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
          nda_id: "nda-1",
          client_key: "example-tenant",
          source_event_id: "11111111-1111-4111-8111-111111111111",
          supplier_legal_entity_id: "VEN-001",
          template_version: "standard-mutual-v3",
          scope_level: "event_only",
          covered_affiliate_entity_ids: [],
          effective_from: "2026-01-01",
          executed_at: "2026-02-15T12:00:00.000Z",
          effective_to: "2027-01-01",
          uploaded_by_user_id: "user-1",
          // Signature evidence is given real, distinct values rather than left
          // absent. Absent columns come back `undefined`, and an expectation of
          // `undefined` passes whether or not the repository reads the column
          // at all — it would assert nothing about the mapping it exists to pin.
          document_sha256: "a".repeat(64),
          signature_method: "docusign",
          supplier_signatory_name: "Supplier Signatory",
          buyer_signatory_name: "Buyer Signatory",
          certificate_sha256: "b".repeat(64),
          private_evidence_ref: "private/nda-1/certificate.pdf",
        },
      ])
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
      executedNdas: [
        {
          ndaId: "nda-1",
          tenantKey: "example-tenant",
          supplierLegalEntityId: "VEN-001",
          templateVersion: "standard-mutual-v3",
          scopeLevel: "event_only",
          // Asserted, not ignored. `toEqual` stays exhaustive on purpose:
          // this case's name is its contract, and swapping in
          // `toMatchObject` would keep it green while deleting the property
          // that proves nothing extra leaked into the row.
          signatureEvidence: {
            documentSha256: "a".repeat(64),
            signatureMethod: "docusign",
            signedAt: "2026-02-15T12:00:00.000Z",
            supplierSignatoryName: "Supplier Signatory",
            buyerSignatoryName: "Buyer Signatory",
            certificateSha256: "b".repeat(64),
            privateEvidenceRef: "private/nda-1/certificate.pdf",
          },
          coveredEventIds: ["11111111-1111-4111-8111-111111111111"],
          coveredAffiliateEntityIds: [],
          effectiveFrom: "2026-01-01",
          effectiveTo: "2027-01-01",
          uploadedBy: "user-1",
        },
      ],
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
    expect(run.mock.calls[2][0]).toContain("authority.executed_at");
    expect(run.mock.calls[2][0]).toContain("artifact_type = 'nda_executed'");
    expect(run.mock.calls[2][0]).toContain("lifecycle_state = 'current'");
    expect(run.mock.calls[2][0]).toContain(
      "COALESCE(artifact.blob_sha256, artifact.sha256)",
    );
    expect(run.mock.calls[3][1]).toEqual([
      "example-tenant",
      "11111111-1111-4111-8111-111111111111",
      "VEN-001",
    ]);
    expect(run.mock.calls[3][0]).toContain("revoked_at IS NULL");
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
      executedNdas: [],
      waivers: [],
    });
  });

  it("fails closed when the template register is unavailable", async () => {
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
      executedNdas: [],
      waivers: [],
    });
  });

  it("fails closed when executed NDA authority is unavailable", async () => {
    run
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ template_version: "standard-mutual-v3" }])
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
      executedNdas: [],
      waivers: [],
    });
  });
});
