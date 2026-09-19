import {
  buildCandidateSupplierRegistrySlice,
  type CandidateSupplierAuthorityRow,
} from "@/lib/source/candidate-suppliers/candidate-supplier-authority";

const row = (
  overrides: Partial<CandidateSupplierAuthorityRow> = {},
): CandidateSupplierAuthorityRow => ({
  tenantKey: "tenant-alpha",
  supplierId: "supplier-1",
  legalEntityId: "legal-1",
  legalName: "Example Services LLC",
  authorityState: "accepted",
  eligibility: {
    categoryKeys: ["managed-services"],
    functionKeys: ["technology"],
    archetypeKeys: ["application-managed-services"],
  },
  contactPolicy: "contact_allowed",
  contacts: [
    {
      contactId: "contact-1",
      role: "account_executive",
      displayName: "Example Contact",
      email: "contact@example.invalid",
      state: "active",
    },
  ],
  source: {
    system: "supplier-master-template",
    reference: "supplier-master-template.xlsx#row-2",
    recordedAt: "2026-09-19T12:00:00.000Z",
    recordedBy: "person-admin-1",
  },
  ...overrides,
});

const input = () => ({
  registryAvailable: true,
  tenantKey: "tenant-alpha",
  eventId: "event-1",
  filters: {
    categoryKey: "managed-services",
    functionKey: "technology",
    archetypeKey: "application-managed-services",
  },
  rows: [row()],
  selectedSupplierIds: [] as string[],
});

describe("candidate supplier authority", () => {
  it("blocks a projection without declared tenant and event identity", () => {
    const missingTenant = buildCandidateSupplierRegistrySlice({
      ...input(),
      tenantKey: "",
      rows: [row({ tenantKey: "" })],
    });
    const missingEvent = buildCandidateSupplierRegistrySlice({
      ...input(),
      eventId: "",
    });

    expect(missingTenant.status).toBe("blocked");
    expect(missingTenant.candidates).toEqual([]);
    expect(missingTenant.blockers).toContain("Declare the tenant and sourcing event identity");
    expect(missingEvent.status).toBe("blocked");
    expect(missingEvent.candidates).toEqual([]);
  });

  it("fails closed when the governed registry slice is unavailable", () => {
    const result = buildCandidateSupplierRegistrySlice({
      ...input(),
      registryAvailable: false,
      rows: [row()],
    });

    expect(result.status).toBe("unavailable");
    expect(result.candidates).toEqual([]);
    expect(result.blockers).toContain("Governed candidate-supplier authority is unavailable");
  });

  it("never exposes an opposite-tenant supplier", () => {
    const result = buildCandidateSupplierRegistrySlice({
      ...input(),
      rows: [row({ tenantKey: "tenant-other" })],
    });

    expect(result.status).toBe("empty");
    expect(result.candidates).toEqual([]);
  });

  it("requires an accepted authority row with declared identity and lineage", () => {
    const result = buildCandidateSupplierRegistrySlice({
      ...input(),
      rows: [
        row({ authorityState: "draft" }),
        row({ supplierId: "supplier-2", legalEntityId: "", legalName: "Missing entity" }),
        row({
          supplierId: "supplier-3",
          legalEntityId: "legal-3",
          legalName: "Missing lineage",
          source: { system: "", reference: "", recordedAt: "", recordedBy: "" },
        }),
      ],
    });

    expect(result.status).toBe("empty");
    expect(result.candidates).toEqual([]);
    expect(result.excluded).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ supplierId: "supplier-1", reason: "authority_not_accepted" }),
        expect.objectContaining({ supplierId: "supplier-2", reason: "identity_incomplete" }),
        expect.objectContaining({ supplierId: "supplier-3", reason: "lineage_incomplete" }),
      ]),
    );
  });

  it("matches every declared event filter instead of inferring fit from a display label", () => {
    const result = buildCandidateSupplierRegistrySlice({
      ...input(),
      rows: [
        row(),
        row({
          supplierId: "supplier-2",
          legalEntityId: "legal-2",
          legalName: "Category-only Services",
          eligibility: {
            categoryKeys: ["managed-services"],
            functionKeys: ["operations"],
            archetypeKeys: ["infrastructure-managed-services"],
          },
        }),
      ],
    });

    expect(result.status).toBe("available");
    expect(result.candidates.map((candidate) => candidate.supplierId)).toEqual(["supplier-1"]);
    expect(result.excluded).toContainEqual(
      expect.objectContaining({ supplierId: "supplier-2", reason: "eligibility_mismatch" }),
    );
  });

  it("separates eligibility from contact readiness and honors do-not-contact state", () => {
    const noContact = row({ supplierId: "supplier-2", legalEntityId: "legal-2", contacts: [] });
    const prohibited = row({
      supplierId: "supplier-3",
      legalEntityId: "legal-3",
      contactPolicy: "do_not_contact",
    });
    const result = buildCandidateSupplierRegistrySlice({
      ...input(),
      rows: [row(), noContact, prohibited],
    });

    expect(result.candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ supplierId: "supplier-1", contactReadiness: "ready" }),
        expect.objectContaining({ supplierId: "supplier-2", contactReadiness: "missing_contact" }),
        expect.objectContaining({ supplierId: "supplier-3", contactReadiness: "prohibited" }),
      ]),
    );
    expect(result.contactReadySupplierIds).toEqual(["supplier-1"]);
  });

  it("marks selection only from an explicit event selection record", () => {
    const available = buildCandidateSupplierRegistrySlice(input());
    const selected = buildCandidateSupplierRegistrySlice({
      ...input(),
      selectedSupplierIds: ["supplier-1"],
    });

    expect(available.candidates[0]?.selectedForEvent).toBe(false);
    expect(selected.candidates[0]?.selectedForEvent).toBe(true);
  });

  it("blocks filtering when the event has no declared category, function, or archetype", () => {
    const result = buildCandidateSupplierRegistrySlice({
      ...input(),
      filters: {},
    });

    expect(result.status).toBe("blocked");
    expect(result.candidates).toEqual([]);
    expect(result.blockers).toContain("Declare at least one governed eligibility filter for the event");
  });
});
