import {
  buildCandidateSupplierRegistrySlice,
  type CandidateSupplierAuthorityRow,
} from "@/lib/source/candidate-suppliers/candidate-supplier-authority";
import { buildVendorPanelProjection } from "@/lib/source/candidate-suppliers/vendor-panel-projection";

/**
 * Stage 04 asks the panel to tell three groups apart: eligible candidates,
 * selected respondents, and vendors the organisation is already under
 * contract with. The candidate authority answers the first two. It has no
 * view of contracts at all, so a vendor already under contract arrives from
 * it looking exactly like a fresh candidate.
 *
 * These cases are built on slices produced by the real authority rather than
 * on hand-written slice literals. A panel test that forges its own input can
 * only prove the panel agrees with the fixture; feeding it authority output
 * proves the two actually compose.
 */

function row(
  overrides: Partial<CandidateSupplierAuthorityRow> = {},
): CandidateSupplierAuthorityRow {
  return {
    tenantKey: "t1",
    supplierId: "s1",
    legalEntityId: "e1",
    legalName: "Supplier One",
    authorityState: "accepted",
    eligibility: {
      categoryKeys: ["cat-a"],
      functionKeys: ["fn-a"],
      archetypeKeys: ["arch-a"],
    },
    contactPolicy: "contact_allowed",
    contacts: [
      {
        contactId: "c1",
        role: "account",
        email: "a@example.test",
        state: "active",
      },
    ],
    source: {
      system: "vendor-master",
      reference: "VM-1",
      recordedAt: "2026-06-01T00:00:00Z",
      recordedBy: "procurement-ops",
    },
    ...overrides,
  };
}

function slice(
  rows: readonly CandidateSupplierAuthorityRow[],
  selectedSupplierIds: readonly string[] = [],
  registryAvailable = true,
) {
  return buildCandidateSupplierRegistrySlice({
    registryAvailable,
    tenantKey: "t1",
    eventId: "evt-1",
    // The authority refuses to project without at least one governed
    // eligibility filter, so a realistic slice always carries one.
    filters: { categoryKey: "cat-a" },
    rows,
    selectedSupplierIds,
  });
}

const INCUMBENT = row({
  supplierId: "s-inc",
  legalEntityId: "e-inc",
  legalName: "Incumbent Co",
});
const FRESH = row({
  supplierId: "s-new",
  legalEntityId: "e-new",
  legalName: "New Co",
});

describe("the stage 04 vendor panel separates three groups", () => {
  it("files a vendor already under contract apart from a fresh candidate", () => {
    const panel = buildVendorPanelProjection({
      slice: slice([INCUMBENT, FRESH]),
      contractVendorLegalEntityIds: ["e-inc"],
      contractEvidenceAvailable: true,
    });

    expect(panel.status).toBe("available");
    expect(panel.counts).toEqual({
      eligible_candidate: 1,
      selected_respondent: 0,
      existing_contract_vendor: 1,
    });
    const byId = Object.fromEntries(
      panel.rows.map((r) => [r.supplierId, r.group]),
    );
    expect(byId["s-inc"]).toBe("existing_contract_vendor");
    expect(byId["s-new"]).toBe("eligible_candidate");
  });

  it("calls a selected incumbent a respondent, not contract history", () => {
    // A vendor can be both. The panel that matters in a live event is the
    // respondent list, so selection has to win — filing them under history
    // would drop them out of the group being worked.
    const panel = buildVendorPanelProjection({
      slice: slice([INCUMBENT, FRESH], ["s-inc"]),
      contractVendorLegalEntityIds: ["e-inc"],
      contractEvidenceAvailable: true,
    });

    expect(panel.counts.selected_respondent).toBe(1);
    expect(panel.counts.existing_contract_vendor).toBe(0);
    expect(panel.rows.find((r) => r.supplierId === "s-inc")?.group).toBe(
      "selected_respondent",
    );
  });

  it("tells an empty contract register apart from one it could not read", () => {
    // The distinction the group exists for. Both inputs carry zero contract
    // vendors; only one of them is an answer.
    const known = buildVendorPanelProjection({
      slice: slice([INCUMBENT, FRESH]),
      contractVendorLegalEntityIds: [],
      contractEvidenceAvailable: true,
    });
    expect(known.status).toBe("available");
    expect(known.counts.eligible_candidate).toBe(2);

    const unknown = buildVendorPanelProjection({
      slice: slice([INCUMBENT, FRESH]),
      contractVendorLegalEntityIds: [],
      contractEvidenceAvailable: false,
    });
    expect(unknown.status).toBe("blocked");
    expect(unknown.rows).toEqual([]);
    expect(unknown.blockers.join(" ")).toContain("could not be read");
  });

  it("shows nothing at all when the registry itself is unavailable", () => {
    const panel = buildVendorPanelProjection({
      slice: slice([INCUMBENT, FRESH], [], false),
      contractVendorLegalEntityIds: ["e-inc"],
      contractEvidenceAvailable: true,
    });

    expect(panel.status).toBe("blocked");
    expect(panel.rows).toEqual([]);
    expect(panel.counts.existing_contract_vendor).toBe(0);
  });

  it("stays blocked, and repeats the reason, when no eligibility filter was declared", () => {
    // The third clause of the decision's fail-closed rule. The authority
    // refuses an unfiltered event; the panel must pass that refusal on
    // rather than rendering it as a panel with no matches.
    const unfiltered = buildCandidateSupplierRegistrySlice({
      registryAvailable: true,
      tenantKey: "t1",
      eventId: "evt-1",
      filters: {},
      rows: [INCUMBENT, FRESH],
      selectedSupplierIds: [],
    });
    expect(unfiltered.status).toBe("blocked");

    const panel = buildVendorPanelProjection({
      slice: unfiltered,
      contractVendorLegalEntityIds: ["e-inc"],
      contractEvidenceAvailable: true,
    });

    expect(panel.status).toBe("blocked");
    expect(panel.rows).toEqual([]);
    expect(panel.blockers.join(" ")).toContain("eligibility filter");
  });

  it("states a contact blocker for every supplier that cannot be approached", () => {
    const panel = buildVendorPanelProjection({
      slice: slice([
        row({ supplierId: "s-ok", legalEntityId: "e-ok" }),
        row({
          supplierId: "s-dnc",
          legalEntityId: "e-dnc",
          contactPolicy: "do_not_contact",
        }),
        row({
          supplierId: "s-rev",
          legalEntityId: "e-rev",
          contactPolicy: "review_required",
        }),
        row({ supplierId: "s-nc", legalEntityId: "e-nc", contacts: [] }),
      ]),
      contractVendorLegalEntityIds: [],
      contractEvidenceAvailable: true,
    });

    const blockerFor = (id: string) =>
      panel.rows.find((r) => r.supplierId === id)?.contactBlocker;

    expect(blockerFor("s-ok")).toBeNull();
    expect(blockerFor("s-dnc")).toContain("Do not contact");
    expect(blockerFor("s-rev")).toContain("review");
    expect(blockerFor("s-nc")).toContain("No active contact record");
  });

  it("carries the eligibility keys through so the panel can show why", () => {
    const panel = buildVendorPanelProjection({
      slice: slice([FRESH]),
      contractVendorLegalEntityIds: [],
      contractEvidenceAvailable: true,
    });

    expect(panel.rows[0]?.eligibility).toEqual({
      categoryKeys: ["cat-a"],
      functionKeys: ["fn-a"],
      archetypeKeys: ["arch-a"],
    });
  });

  it("exposes no way to send, contact, or select from the panel", () => {
    // The decision forbids side effects. The guarantee here is structural:
    // nothing the projection returns is callable, so there is nothing a
    // caller could invoke by mistake.
    const panel = buildVendorPanelProjection({
      slice: slice([INCUMBENT, FRESH], ["s-inc"]),
      contractVendorLegalEntityIds: ["e-inc"],
      contractEvidenceAvailable: true,
    });

    const values = [
      ...Object.values(panel),
      ...panel.rows.flatMap((r) => Object.values(r)),
    ];
    expect(values.filter((v) => typeof v === "function")).toEqual([]);
  });
});
