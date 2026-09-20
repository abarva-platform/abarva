import { azureRead } from "@/lib/data-plane/azureRead";
import { readNdaAuthorityForEvent } from "../nda-authority-repository";

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: { withSession: jest.fn() },
}));

const withSession = azureRead.withSession as jest.Mock;
const run = jest.fn();

describe("readNdaAuthorityForEvent", () => {
  beforeEach(() => {
    run.mockReset();
    withSession.mockReset();
    withSession.mockImplementation(async (callback) => callback(run));
  });

  it("reads only one tenant, event, and declared supplier entity", async () => {
    run
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ template_version: "standard-mutual-v3" }])
      .mockResolvedValueOnce([
        {
          waiver_id: "waiver-1",
          client_key: "example-tenant",
          supplier_legal_entity_id: "VEN-001",
          source_event_id: "11111111-1111-4111-8111-111111111111",
          reason: "Pending counter-signature",
          expires_at: "2026-10-01T00:00:00.000Z",
          approved_by_legal_name: "Named Legal Reviewer",
          approved_at: "2026-09-20T00:00:00.000Z",
        },
      ]);

    const result = await readNdaAuthorityForEvent({
      clientKey: "example-tenant",
      eventId: "11111111-1111-4111-8111-111111111111",
      supplierLegalEntityId: "VEN-001",
    });

    expect(result).toEqual({
      registryAvailable: true,
      publishedTemplateVersions: ["standard-mutual-v3"],
      waivers: [
        {
          waiverId: "waiver-1",
          tenantKey: "example-tenant",
          supplierLegalEntityId: "VEN-001",
          eventId: "11111111-1111-4111-8111-111111111111",
          reason: "Pending counter-signature",
          expiresAt: "2026-10-01T00:00:00.000Z",
          approvedByLegalName: "Named Legal Reviewer",
          approvedAt: "2026-09-20T00:00:00.000Z",
        },
      ],
    });
    expect(run.mock.calls[0]).toEqual([
      "SELECT set_config('app.tenant_key', $1, false)",
      ["example-tenant"],
    ]);
    expect(run.mock.calls[1][1]).toEqual(["example-tenant"]);
    expect(run.mock.calls[1][0]).toContain("client_key = $1");
    expect(run.mock.calls[2][1]).toEqual([
      "example-tenant",
      "11111111-1111-4111-8111-111111111111",
      "VEN-001",
    ]);
    expect(run.mock.calls[2][0]).toContain("client_key = $1");
    expect(run.mock.calls[2][0]).toContain("source_event_id = $2::uuid");
    expect(run.mock.calls[2][0]).toContain("supplier_legal_entity_id = $3");
    expect(run.mock.calls[2][0]).toContain("revoked_at IS NULL");
  });

  it("distinguishes a modelled empty register from an unavailable registry", async () => {
    run.mockResolvedValue([]);

    await expect(
      readNdaAuthorityForEvent({
        clientKey: "example-tenant",
        eventId: "11111111-1111-4111-8111-111111111111",
        supplierLegalEntityId: "VEN-001",
      }),
    ).resolves.toEqual({
      registryAvailable: true,
      publishedTemplateVersions: [],
      waivers: [],
    });
  });

  it("fails closed when either governed relation is unavailable", async () => {
    run
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(
        Object.assign(new Error("relation does not exist"), { code: "42P01" }),
      );

    await expect(
      readNdaAuthorityForEvent({
        clientKey: "example-tenant",
        eventId: "11111111-1111-4111-8111-111111111111",
        supplierLegalEntityId: "VEN-001",
      }),
    ).resolves.toEqual({
      registryAvailable: false,
      publishedTemplateVersions: [],
      waivers: [],
    });
  });
});
