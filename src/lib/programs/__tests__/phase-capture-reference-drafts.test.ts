import { readSyntheticReferenceDraft } from "../phase-capture-reference-drafts";

const referenceModule = {
  status: "not_started" as const,
  state: {
    capture_section_key: "scope_boundary",
    value: "",
    synthetic_reference_draft: "Example scope boundary.",
    provenance_class: "synthetic_reference",
    requires_human_review: true,
    gate_credit: false,
  },
};

describe("readSyntheticReferenceDraft", () => {
  it("reads a review-only synthetic draft without substituting it for the captured value", () => {
    expect(readSyntheticReferenceDraft(referenceModule)).toBe(
      "Example scope boundary.",
    );
    expect(referenceModule.state.value).toBe("");
  });

  it.each([
    { ...referenceModule, status: "in_progress" as const },
    {
      ...referenceModule,
      state: { ...referenceModule.state, provenance_class: "client_evidence" },
    },
    {
      ...referenceModule,
      state: { ...referenceModule.state, requires_human_review: false },
    },
    {
      ...referenceModule,
      state: { ...referenceModule.state, gate_credit: true },
    },
    {
      ...referenceModule,
      state: { ...referenceModule.state, synthetic_reference_draft: "  " },
    },
  ])("rejects drafts without the complete review-only provenance", (module) => {
    expect(readSyntheticReferenceDraft(module)).toBeNull();
  });
});
