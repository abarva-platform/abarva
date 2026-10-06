const runMock = jest.fn();
const withSessionMock = jest.fn();

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: {
    withSession: (...args: unknown[]) => withSessionMock(...args),
  },
}));

import { readCandidateSupplierRegistry } from "../candidate-supplier-registry-repository";

describe("candidate supplier registry repository", () => {
  beforeEach(() => {
    runMock.mockReset();
    withSessionMock.mockReset();
    withSessionMock.mockImplementation(
      async (callback: (run: typeof runMock) => unknown) => callback(runMock),
    );
  });

  it("reads tenant-scoped candidate authority without inferring contact permission", async () => {
    runMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          vendor_id: "supplier-ams-1",
          legal_name: "Synthetic Application Services LLC",
          supplier_category: "ams",
          source_system: "supplier-master-template",
          source_record_id: "supplier-master.csv#row-2",
          as_of_date: "2026-09-20",
          evidence_reference: "EVID-SUPPLIER-AMS-1",
          raw_payload: {
            candidate_supplier_registry: {
              authorityState: "accepted",
              categoryKeys: ["ams"],
              functionKeys: ["application_operations"],
              archetypeKeys: ["AMS_MANAGED_SERVICES"],
              contactPolicy: "review_required",
            },
          },
        },
      ]);

    await expect(readCandidateSupplierRegistry("tenant-alpha")).resolves.toEqual({
      registryAvailable: true,
      rows: [
        expect.objectContaining({
          tenantKey: "tenant-alpha",
          supplierId: "supplier-ams-1",
          legalEntityId: "supplier-ams-1",
          legalName: "Synthetic Application Services LLC",
          authorityState: "accepted",
          eligibility: {
            categoryKeys: ["ams"],
            functionKeys: ["application_operations"],
            archetypeKeys: ["AMS_MANAGED_SERVICES"],
          },
          contactPolicy: "review_required",
          contacts: [],
          source: {
            system: "supplier-master-template",
            reference: "EVID-SUPPLIER-AMS-1",
            recordedAt: "2026-09-20",
            recordedBy: "supplier-master.csv#row-2",
          },
        }),
      ],
    });

    expect(runMock.mock.calls[1]?.[0]).toContain("FROM source.vendor");
    expect(runMock.mock.calls[1]?.[0]).toContain("WHERE tenant_key = $1");
    expect(runMock.mock.calls[1]?.[1]).toEqual(["tenant-alpha"]);
  });

  it("fails closed for missing tenant identity or an unavailable registry", async () => {
    await expect(readCandidateSupplierRegistry("")).resolves.toEqual({
      registryAvailable: false,
      rows: [],
    });
    expect(withSessionMock).not.toHaveBeenCalled();

    withSessionMock.mockRejectedValueOnce(new Error("relation unavailable"));
    await expect(readCandidateSupplierRegistry("tenant-alpha")).resolves.toEqual({
      registryAvailable: false,
      rows: [],
    });
  });
});
