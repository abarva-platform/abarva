const readAcceptedCandidatesForEvent = jest.fn();
const readContractVendorLegalEntityIds = jest.fn();

jest.mock(
  "@/lib/source/candidate-suppliers/event-candidate-authority-repository",
  () => ({
    readAcceptedCandidatesForEvent: (input: unknown) =>
      readAcceptedCandidatesForEvent(input),
  }),
);

jest.mock("@/lib/source/candidate-suppliers/contract-vendor-repository", () => {
  const actual = jest.requireActual(
    "@/lib/source/candidate-suppliers/contract-vendor-repository",
  );
  return {
    ...actual,
    readContractVendorLegalEntityIds: (key: string) =>
      readContractVendorLegalEntityIds(key),
  };
});

import {
  asProjectionRow,
  readSourceNewStage04VendorPanel,
} from "@/lib/source/new-workspace/stage04-vendor-panel";

/**
 * Stage 04 names three groups. Two are answerable from the data that
 * exists; the third is not, and the value of this panel is that it says
 * which is which rather than filling the gap.
 *
 * The acceptance record carries no contact policy and no eligibility
 * attributes, and neither does the vendor table. A panel that rendered an
 * unrecorded contact policy as "contactable" would be the exact failure
 * this stage exists to prevent — and one that rendered it as a blocker
 * nobody can clear would be just as wrong.
 */

const CANDIDATE = {
  authorityId: "auth-1",
  supplierId: "v-inc",
  legalEntityId: "v-inc",
  legalName: "Incumbent Co",
  acceptedByName: "A. Buyer",
  acceptedAt: "2026-09-01T00:00:00Z",
  acceptanceRationale: "Named in the category strategy.",
  evidenceReference: "evt-1/panel/auth-1",
};

const FRESH = {
  ...CANDIDATE,
  authorityId: "auth-2",
  supplierId: "v-new",
  legalEntityId: "v-new",
  legalName: "New Co",
  evidenceReference: "evt-1/panel/auth-2",
};

beforeEach(() => {
  readAcceptedCandidatesForEvent.mockReset();
  readContractVendorLegalEntityIds.mockReset();
});

function authorityReturns(
  candidates: unknown[],
  registryAvailable = true,
) {
  readAcceptedCandidatesForEvent.mockResolvedValue({
    registryAvailable,
    acceptedSupplierIds: [],
    acceptedCandidates: candidates,
  });
}

function contractsReturn(
  state: string,
  legalEntityIds: string[] = [],
) {
  readContractVendorLegalEntityIds.mockResolvedValue({
    state,
    legalEntityIds,
    unresolvedVendorReferences: 0,
    note: null,
  });
}

const INPUT = {
  clientKey: "t1",
  eventId: "evt-1",
  asOf: "2026-09-19",
};

describe("the stage 04 panel says what it knows and what it does not", () => {
  it("separates an accepted incumbent from an accepted new candidate", () => {
    authorityReturns([CANDIDATE, FRESH]);
    contractsReturn("available", ["v-inc"]);

    return readSourceNewStage04VendorPanel(INPUT).then((panel) => {
      expect(panel.status).toBe("available");
      expect(panel.counts.existing_contract_vendor).toBe(1);
      expect(panel.counts.eligible_candidate).toBe(1);

      const incumbent = panel.rows.find((r) => r.legalEntityId === "v-inc");
      expect(incumbent?.group).toBe("existing_contract_vendor");
      // The acceptance evidence travels with the row: who accepted it and
      // against what record. A panel row with no provenance is an assertion.
      expect(incumbent?.acceptedByName).toBe("A. Buyer");
      expect(incumbent?.evidenceReference).toBe("evt-1/panel/auth-1");
    });
  });

  it("refuses the panel when the contract register could not be read", async () => {
    // Otherwise every incumbent renders as a new candidate, which is the
    // specific wrong answer this grouping exists to prevent.
    authorityReturns([CANDIDATE, FRESH]);
    contractsReturn("unavailable");

    const panel = await readSourceNewStage04VendorPanel(INPUT);

    expect(panel.status).toBe("blocked");
    expect(panel.rows).toEqual([]);
    expect(panel.blockers.join(" ")).toContain("could not be read");
  });

  it("refuses the panel when the linkage exists but is unpopulated", async () => {
    // A contract register with no vendor on any row is not a register
    // saying nobody is under contract.
    authorityReturns([CANDIDATE, FRESH]);
    contractsReturn("linkage_unpopulated");

    const panel = await readSourceNewStage04VendorPanel(INPUT);

    expect(panel.status).toBe("blocked");
    expect(panel.rows).toEqual([]);
  });

  it("refuses the panel when the candidate authority could not be read", async () => {
    authorityReturns([], false);
    contractsReturn("available", ["v-inc"]);

    const panel = await readSourceNewStage04VendorPanel(INPUT);

    expect(panel.status).toBe("blocked");
    expect(panel.blockers.join(" ")).toContain("could not be read");
  });

  it("shows an empty panel as empty, not as blocked", async () => {
    // A governed event with no accepted candidates yet is an answer.
    authorityReturns([]);
    contractsReturn("no_contracts");

    const panel = await readSourceNewStage04VendorPanel(INPUT);

    expect(panel.status).toBe("empty");
    expect(panel.rows).toEqual([]);
  });

  it("makes no claim about who may be contacted", async () => {
    // The acceptance record carries no contact policy, and neither does the
    // vendor table. The panel says so instead of rendering everyone as
    // reachable or everyone as blocked.
    authorityReturns([CANDIDATE]);
    contractsReturn("available", []);

    const panel = await readSourceNewStage04VendorPanel(INPUT);

    expect(panel.notRecorded.join(" ")).toContain(
      "makes no claim about who may be contacted",
    );
    // And no row carries a contactability verdict at all.
    for (const row of panel.rows) {
      expect(Object.keys(row)).not.toContain("contactBlocker");
      expect(Object.keys(row)).not.toContain("contactReadiness");
    }
  });

  it("says the selected group is empty by design, not by outcome", async () => {
    // Respondent selection happens after this stage. An empty group that
    // looks like "nobody was selected" is a different claim.
    authorityReturns([CANDIDATE, FRESH]);
    contractsReturn("available", ["v-inc"]);

    const panel = await readSourceNewStage04VendorPanel(INPUT);

    expect(panel.counts.selected_respondent).toBe(0);
    expect(panel.notRecorded.join(" ")).toContain("empty by design");
  });

  it("claims the least for every field the acceptance record does not carry", () => {
    // The mapper's whole job is to not invent. Two mutations survived every
    // other case here — claiming a contact policy and inventing eligibility —
    // because the panel drops both fields before rendering, so a fabricated
    // value changed nothing observable. Asserting the mapper directly is
    // what holds it to the intent its comment describes.
    const row = asProjectionRow(CANDIDATE);

    expect(row.eligibility).toEqual({
      categoryKeys: [],
      functionKeys: [],
      archetypeKeys: [],
    });
    // Unknown is not permission.
    expect(row.contactPolicy).toBe("review_required");
    expect(row.contactReadiness).toBe("review_required");
    expect(row.activeContacts).toEqual([]);
    // Acceptance onto the panel is not selection as a respondent.
    expect(row.selectedForEvent).toBe(false);
    // And the provenance is the acceptance record, not an invented source.
    expect(row.source.system).toBe("source_event_candidate_supplier_authority");
    expect(row.source.recordedBy).toBe("A. Buyer");
  });

  it("exposes nothing that could contact or select a supplier", async () => {
    authorityReturns([CANDIDATE, FRESH]);
    contractsReturn("available", ["v-inc"]);

    const panel = await readSourceNewStage04VendorPanel(INPUT);

    const values = [
      ...Object.values(panel),
      ...panel.rows.flatMap((r) => Object.values(r)),
    ];
    expect(values.filter((v) => typeof v === "function")).toEqual([]);
  });
});
