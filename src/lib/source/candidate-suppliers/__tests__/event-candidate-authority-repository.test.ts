const runMock = jest.fn();
const withSessionMock = jest.fn();

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: {
    withSession: (...args: unknown[]) => withSessionMock(...args),
  },
}));

import { readAcceptedCandidatesForEvent } from "../event-candidate-authority-repository";

describe("event candidate authority repository", () => {
  beforeEach(() => {
    runMock.mockReset();
    withSessionMock.mockReset();
    withSessionMock.mockImplementation(
      async (callback: (run: typeof runMock) => unknown) => callback(runMock),
    );
  });

  it("reads only explicit accepted authority joined to the governed legal entity", async () => {
    runMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          authority_id: "candidate-authority-1",
          vendor_id: "vendor-1",
          legal_name: "Example Services LLC",
          supplier_category: "managed-services",
          vendor_source_system: "supplier-master-template",
          vendor_source_record_id: "supplier-master-template.xlsx#row-2",
          vendor_as_of_date: "2026-09-19",
          vendor_evidence_reference: "EVID-SUPPLIER-1",
          vendor_raw_payload: {
            candidate_supplier_registry: {
              categoryKeys: ["managed-services"],
              functionKeys: ["technology"],
              archetypeKeys: ["application-managed-services"],
              contactPolicy: "contact_allowed",
              contacts: [
                {
                  contactId: "contact-1",
                  role: "account_executive",
                  email: "contact@example.invalid",
                  state: "active",
                },
              ],
            },
          },
          accepted_by_name: "Sourcing Owner",
          accepted_at: new Date("2026-09-20T02:00:00.000Z"),
          acceptance_rationale: "Meets the declared event eligibility criteria",
          evidence_reference: "event-intake-v3#candidate-review",
        },
      ]);

    await expect(
      readAcceptedCandidatesForEvent({
        clientKey: "tenant-alpha",
        eventId: "11111111-1111-4111-8111-111111111111",
      }),
    ).resolves.toEqual({
      registryAvailable: true,
      acceptedSupplierIds: ["vendor-1"],
      acceptedCandidates: [
        expect.objectContaining({
          authorityId: "candidate-authority-1",
          supplierId: "vendor-1",
          legalEntityId: "vendor-1",
          legalName: "Example Services LLC",
          acceptedByName: "Sourcing Owner",
          acceptedAt: "2026-09-20T02:00:00.000Z",
          eligibility: {
            categoryKeys: ["managed-services"],
            functionKeys: ["technology"],
            archetypeKeys: ["application-managed-services"],
          },
          contactPolicy: "contact_allowed",
          activeContactCount: 1,
          registrySource: {
            system: "supplier-master-template",
            reference: "EVID-SUPPLIER-1",
            recordedAt: "2026-09-19",
            recordedBy: "supplier-master-template.xlsx#row-2",
          },
        }),
      ],
    });

    expect(runMock.mock.calls[1]?.[0]).toContain(
      "FROM source_event_candidate_supplier_authority authority",
    );
    expect(runMock.mock.calls[1]?.[0]).toContain(
      "INNER JOIN source.vendor vendor",
    );
    expect(runMock.mock.calls[1]?.[0]).toContain("vendor.raw_payload");
    expect(runMock.mock.calls[1]?.[0]).toContain(
      "authority.authority_state = 'accepted'",
    );
    expect(runMock.mock.calls[1]?.[0]).not.toContain("supplier_status");
    expect(runMock.mock.calls[1]?.[0]).not.toContain("response_status");
    expect(runMock.mock.calls[1]?.[1]).toEqual([
      "tenant-alpha",
      "11111111-1111-4111-8111-111111111111",
    ]);
  });

  it("distinguishes an available empty registry slice from an unavailable relation", async () => {
    runMock.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    await expect(
      readAcceptedCandidatesForEvent({
        clientKey: "tenant-alpha",
        eventId: "11111111-1111-4111-8111-111111111111",
      }),
    ).resolves.toEqual({
      registryAvailable: true,
      acceptedSupplierIds: [],
      acceptedCandidates: [],
    });

    withSessionMock.mockRejectedValueOnce(new Error("relation unavailable"));
    await expect(
      readAcceptedCandidatesForEvent({
        clientKey: "tenant-alpha",
        eventId: "11111111-1111-4111-8111-111111111111",
      }),
    ).resolves.toEqual({
      registryAvailable: false,
      acceptedSupplierIds: [],
      acceptedCandidates: [],
    });
  });

  it("fails closed before querying when tenant or event identity is missing", async () => {
    await expect(
      readAcceptedCandidatesForEvent({ clientKey: "", eventId: "event-1" }),
    ).resolves.toEqual({
      registryAvailable: false,
      acceptedSupplierIds: [],
      acceptedCandidates: [],
    });
    await expect(
      readAcceptedCandidatesForEvent({ clientKey: "tenant-alpha", eventId: "" }),
    ).resolves.toEqual({
      registryAvailable: false,
      acceptedSupplierIds: [],
      acceptedCandidates: [],
    });
    expect(withSessionMock).not.toHaveBeenCalled();
  });
});
