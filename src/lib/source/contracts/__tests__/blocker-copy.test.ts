import {
  blockerLabel,
  normalizeArtifactBlockers,
} from "../blocker-copy";

describe("blockerLabel", () => {
  it("resolves every known blocker code to its short label", () => {
    expect(blockerLabel("stage_not_eligible")).toBe("Stage");
    expect(blockerLabel("missing_required_upstream")).toBe("Upstream");
    expect(blockerLabel("upstream_required")).toBe("Upstream");
    expect(blockerLabel("not_accepted")).toBe("Acceptance");
    expect(blockerLabel("review_required")).toBe("Review");
    expect(blockerLabel("governance_stage_below_export_minimum")).toBe(
      "Approval",
    );
    expect(blockerLabel("sibling_not_accepted")).toBe("Sign-off");
  });

  it("falls back to a title-cased reading of an unrecognized code — never throws", () => {
    expect(blockerLabel("some_future_blocker_code")).toBe(
      "Some Future Blocker Code",
    );
  });
});

describe("normalizeArtifactBlockers", () => {
  it("passes through a real blockers[] array unchanged (render/download/accept-route shape)", () => {
    const payload = {
      error: "export_not_eligible",
      detail: "d05_scope_memo cannot be exported yet: ...",
      governanceStage: "human_review",
      blockers: [
        { code: "not_accepted", detail: "Has not been accepted yet." },
        {
          code: "governance_stage_below_export_minimum",
          detail: "Below the required minimum.",
          meta: { requiredMinimumStage: "approved_for_external_use" },
        },
      ],
    };
    const result = normalizeArtifactBlockers(payload);
    expect(result).toHaveLength(2);
    expect(result[0].code).toBe("not_accepted");
    expect(result[1].meta).toEqual({
      requiredMinimumStage: "approved_for_external_use",
    });
  });

  it("flattens a single-blocker route response (AI-generate route shape) into a one-item array", () => {
    const payload = {
      error: "stage_not_eligible",
      detail: 'd24_decision_brief is not eligible to generate before stage "executive_decision".',
      earliestEligibleStage: "executive_decision",
      currentStage: "scope",
    };
    const result = normalizeArtifactBlockers(payload);
    expect(result).toEqual([
      {
        code: "stage_not_eligible",
        detail:
          'd24_decision_brief is not eligible to generate before stage "executive_decision".',
        meta: { earliestEligibleStage: "executive_decision", currentStage: "scope" },
      },
    ]);
  });

  it("real upstream_required shape: missingUpstream lands in meta, detail is preserved verbatim", () => {
    const payload = {
      error: "upstream_required",
      detail: "Cannot generate d24_decision_brief — author and approve these upstream artifacts first: d16_scorecard.",
      missingUpstream: ["d16_scorecard"],
    };
    const result = normalizeArtifactBlockers(payload);
    expect(result).toHaveLength(1);
    expect(result[0].detail).toBe(
      "Cannot generate d24_decision_brief — author and approve these upstream artifacts first: d16_scorecard.",
    );
    expect(result[0].meta).toEqual({ missingUpstream: ["d16_scorecard"] });
  });

  it("returns [] for a payload with no error/blockers and no fallback given", () => {
    expect(normalizeArtifactBlockers({ ok: true })).toEqual([]);
  });

  it("returns [] for null/non-object payloads with no fallback", () => {
    expect(normalizeArtifactBlockers(null)).toEqual([]);
    expect(normalizeArtifactBlockers(undefined)).toEqual([]);
    expect(normalizeArtifactBlockers("not json")).toEqual([]);
  });

  it("uses the fallback detail as a single unknown-coded blocker when the payload carries nothing usable", () => {
    expect(normalizeArtifactBlockers(null, "Network error.")).toEqual([
      { code: "unknown", detail: "Network error." },
    ]);
    expect(normalizeArtifactBlockers({ ok: false }, "HTTP 500.")).toEqual([
      { code: "unknown", detail: "HTTP 500." },
    ]);
  });

  it("ignores an empty blockers[] array and falls back to the error/detail fields", () => {
    const payload = { error: "forbidden", detail: "Upload rights are required.", blockers: [] };
    expect(normalizeArtifactBlockers(payload)).toEqual([
      { code: "forbidden", detail: "Upload rights are required.", meta: undefined },
    ]);
  });

  it("drops malformed blocker entries from a blockers[] array rather than crashing", () => {
    const payload = {
      blockers: [
        { code: "not_accepted", detail: "Real one." },
        { code: 42, detail: "Bad code type." },
        { detail: "Missing code entirely." },
        "not even an object",
      ],
    };
    const result = normalizeArtifactBlockers(payload);
    expect(result).toEqual([{ code: "not_accepted", detail: "Real one." }]);
  });
});
