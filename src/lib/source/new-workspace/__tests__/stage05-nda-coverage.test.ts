import {
  buildSourceNewStage05NdaCoverage,
  type Stage05SupplierAuthoritySlice,
} from "../stage05-nda-coverage";

const accepted = {
  authorityId: "candidate-1",
  supplierId: "vendor-1",
  legalEntityId: "vendor-1",
  legalName: "Example Technology LLC",
  acceptedByName: "Procurement Owner",
  acceptedAt: "2026-09-19T12:00:00Z",
  acceptanceRationale: "Qualified for the event panel",
  evidenceReference: "EVID-CANDIDATE-1",
};

const availableAuthority: Stage05SupplierAuthoritySlice = {
  candidate: accepted,
  ndaAuthority: {
    registryAvailable: true,
    publishedTemplateVersions: ["MUTUAL-NDA-v3"],
    executedNdas: [
      {
        ndaId: "nda-1",
        tenantKey: "tenant-a",
        supplierLegalEntityId: "vendor-1",
        templateVersion: "MUTUAL-NDA-v3",
        scopeLevel: "event_only",
        coveredEventIds: ["event-1"],
        coveredAffiliateEntityIds: [],
        effectiveFrom: "2026-09-01T00:00:00Z",
        effectiveTo: "2027-09-01T00:00:00Z",
        uploadedBy: "legal-user",
      },
    ],
    waivers: [],
  },
};

describe("buildSourceNewStage05NdaCoverage", () => {
  it("distinguishes an unavailable candidate registry from an empty panel", () => {
    const unavailable = buildSourceNewStage05NdaCoverage({
      clientKey: "tenant-a",
      eventId: "event-1",
      asOf: "2026-09-20T00:00:00Z",
      candidateRegistryAvailable: false,
      suppliers: [],
    });
    const empty = buildSourceNewStage05NdaCoverage({
      clientKey: "tenant-a",
      eventId: "event-1",
      asOf: "2026-09-20T00:00:00Z",
      candidateRegistryAvailable: true,
      suppliers: [],
    });

    expect(unavailable.status).toBe("unavailable");
    expect(unavailable.nextAction.label).toBe("Restore candidate authority");
    expect(empty.status).toBe("empty");
    expect(empty.nextAction.label).toBe("Accept candidate panel");
  });

  it("reports one governed coverage result per explicitly accepted supplier", () => {
    const result = buildSourceNewStage05NdaCoverage({
      clientKey: "tenant-a",
      eventId: "event-1",
      asOf: "2026-09-20T00:00:00Z",
      candidateRegistryAvailable: true,
      suppliers: [availableAuthority],
    });

    expect(result.status).toBe("ready");
    expect(result.suppliers).toEqual([
      expect.objectContaining({
        legalEntityId: "vendor-1",
        legalName: "Example Technology LLC",
        state: "covered_by_nda",
        authorityReference: "nda-1",
      }),
    ]);
    expect(result.nextAction.label).toBe("Open market package gate");
  });

  it("blocks rather than treating an unavailable NDA registry as no NDA rows", () => {
    const result = buildSourceNewStage05NdaCoverage({
      clientKey: "tenant-a",
      eventId: "event-1",
      asOf: "2026-09-20T00:00:00Z",
      candidateRegistryAvailable: true,
      suppliers: [
        {
          candidate: accepted,
          ndaAuthority: {
            registryAvailable: false,
            publishedTemplateVersions: [],
            executedNdas: [],
            waivers: [],
          },
        },
      ],
    });

    expect(result.status).toBe("blocked");
    expect(result.suppliers[0]).toEqual(
      expect.objectContaining({
        state: "unavailable",
        reason: expect.stringContaining("unavailable"),
      }),
    );
    expect(result.nextAction.label).toBe("Restore NDA authority");
  });

  it("shows an explicit waiver as a waiver and never as an executed NDA", () => {
    const result = buildSourceNewStage05NdaCoverage({
      clientKey: "tenant-a",
      eventId: "event-1",
      asOf: "2026-09-20T00:00:00Z",
      candidateRegistryAvailable: true,
      suppliers: [
        {
          candidate: accepted,
          ndaAuthority: {
            registryAvailable: true,
            publishedTemplateVersions: ["MUTUAL-NDA-v3"],
            executedNdas: [],
            waivers: [
              {
                waiverId: "waiver-1",
                tenantKey: "tenant-a",
                supplierLegalEntityId: "vendor-1",
                eventId: "event-1",
                reason: "Legal-approved timing exception",
                expiresAt: "2026-10-01T00:00:00Z",
                approvedByLegalName: "Named Legal Approver",
                approvedAt: "2026-09-18T00:00:00Z",
              },
            ],
          },
        },
      ],
    });

    expect(result.status).toBe("ready");
    expect(result.suppliers[0]).toEqual(
      expect.objectContaining({
        state: "covered_by_waiver",
        authorityReference: "waiver-1",
      }),
    );
    expect(result.suppliers[0]?.reason).toContain("Display it as a waiver");
  });

  it("keeps every accepted supplier visible when only one is covered", () => {
    const result = buildSourceNewStage05NdaCoverage({
      clientKey: "tenant-a",
      eventId: "event-1",
      asOf: "2026-09-20T00:00:00Z",
      candidateRegistryAvailable: true,
      suppliers: [
        availableAuthority,
        {
          candidate: {
            ...accepted,
            authorityId: "candidate-2",
            supplierId: "vendor-2",
            legalEntityId: "vendor-2",
            legalName: "Second Supplier Inc.",
          },
          ndaAuthority: {
            registryAvailable: true,
            publishedTemplateVersions: ["MUTUAL-NDA-v3"],
            executedNdas: [],
            waivers: [],
          },
        },
      ],
    });

    expect(result.status).toBe("blocked");
    expect(result.suppliers).toHaveLength(2);
    expect(result.suppliers.map((supplier) => supplier.state)).toEqual([
      "covered_by_nda",
      "not_covered",
    ]);
    expect(result.nextAction.label).toBe("Resolve NDA coverage");
  });
});
