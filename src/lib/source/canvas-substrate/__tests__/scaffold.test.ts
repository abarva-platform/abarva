import {
  buildEventScaffold,
  mergeMissingVirtualScaffold,
  buildVirtualEventScaffold,
  expectedScaffoldRowCount,
} from "../scaffold";
import {
  SOURCE_ARTIFACT_SPECS,
  SOURCE_GATE_CRITERIA,
  SOURCE_EVIDENCE_REQUIREMENTS,
} from "../../canonical-specs";

describe("buildEventScaffold", () => {
  const input = {
    sourceEventId: "evt-12345",
    tenantKey: "apexretail",
  };

  it("produces one artifact-state row per canonical spec", () => {
    const out = buildEventScaffold(input);
    expect(out.artifactStates.length).toBe(SOURCE_ARTIFACT_SPECS.length);
  });

  it("produces one criterion-state row per canonical criterion", () => {
    const out = buildEventScaffold(input);
    expect(out.gateCriterionStates.length).toBe(SOURCE_GATE_CRITERIA.length);
  });

  it("produces one evidence-state row per canonical requirement", () => {
    const out = buildEventScaffold(input);
    expect(out.evidenceStates.length).toBe(SOURCE_EVIDENCE_REQUIREMENTS.length);
  });

  it("every artifact-state row carries event id + tenant key", () => {
    const out = buildEventScaffold(input);
    for (const row of out.artifactStates) {
      expect(row.source_event_id).toBe(input.sourceEventId);
      expect(row.tenant_key).toBe(input.tenantKey);
      expect(row.status).toBe("not_started");
      expect(row.tier).toBe("stub");
    }
  });

  it("every criterion-state row defaults to pending", () => {
    const out = buildEventScaffold(input);
    for (const row of out.gateCriterionStates) {
      expect(row.state).toBe("pending");
      expect(row.source_event_id).toBe(input.sourceEventId);
    }
  });

  it("every evidence-state row defaults to Not Requested", () => {
    const out = buildEventScaffold(input);
    for (const row of out.evidenceStates) {
      expect(row.current_state).toBe("Not Requested");
      expect(row.source_event_id).toBe(input.sourceEventId);
    }
  });

  it("artifact codes round-trip from spec to row exactly", () => {
    const out = buildEventScaffold(input);
    const codes = out.artifactStates.map((r) => r.artifact_code).sort();
    const specCodes = SOURCE_ARTIFACT_SPECS.map((s) => s.code).sort();
    expect(codes).toEqual(specCodes);
  });

  it("preserves gate-defining flag from spec", () => {
    const out = buildEventScaffold(input);
    const rowByCode = new Map(
      out.artifactStates.map((r) => [r.artifact_code, r]),
    );
    for (const spec of SOURCE_ARTIFACT_SPECS) {
      const row = rowByCode.get(spec.code);
      expect(row?.gate_defining).toBe(spec.gateDefining);
      expect(row?.requirement_level).toBe(spec.requirementLevel);
    }
  });

  it("criterion ids round-trip exactly", () => {
    const out = buildEventScaffold(input);
    const ids = out.gateCriterionStates.map((r) => r.criterion_id).sort();
    const canonicalIds = SOURCE_GATE_CRITERIA.map((c) => c.criterionId).sort();
    expect(ids).toEqual(canonicalIds);
  });

  it("evidence requirement ids round-trip exactly", () => {
    const out = buildEventScaffold(input);
    const ids = out.evidenceStates.map((r) => r.requirement_id).sort();
    const canonicalIds = SOURCE_EVIDENCE_REQUIREMENTS.map(
      (e) => e.requirementId,
    ).sort();
    expect(ids).toEqual(canonicalIds);
  });
});

describe("expectedScaffoldRowCount", () => {
  it("matches the canonical catalog totals", () => {
    const counts = expectedScaffoldRowCount();
    expect(counts.artifactStates).toBe(SOURCE_ARTIFACT_SPECS.length);
    expect(counts.gateCriterionStates).toBe(SOURCE_GATE_CRITERIA.length);
    expect(counts.evidenceStates).toBe(SOURCE_EVIDENCE_REQUIREMENTS.length);
    expect(counts.total).toBe(
      SOURCE_ARTIFACT_SPECS.length +
        SOURCE_GATE_CRITERIA.length +
        SOURCE_EVIDENCE_REQUIREMENTS.length,
    );
  });

  it("produces the expected total for one event (sanity bound)", () => {
    const total = expectedScaffoldRowCount().total;
    // 33 artifacts + 47 criteria + 23 evidence = 103 rows per event
    expect(total).toBeGreaterThanOrEqual(80);
    expect(total).toBeLessThanOrEqual(180);
  });
});

describe("buildVirtualEventScaffold", () => {
  const input = {
    sourceEventId: "evt-legacy-bafo",
    tenantKey: "apexretail",
  };

  it("keeps legacy Pricing and BAFO stages from rendering blank", () => {
    const out = buildVirtualEventScaffold(input);
    const pricingCodes = out.artifactStates
      .filter((row) => row.stage === "pricing")
      .map((row) => row.artifactCode)
      .sort();
    const bafoCodes = out.artifactStates
      .filter((row) => row.stage === "bafo")
      .map((row) => row.artifactCode)
      .sort();

    expect(pricingCodes).toEqual([
      "d19_pricing_workbook",
      "d20_trap_log",
      "d21_assumption_set",
    ]);
    expect(bafoCodes).toEqual(["d22_bafo_question_pack", "d23_bafo_round_log"]);
    expect(
      out.evidenceStates.some(
        (row) =>
          row.stage === "pricing" && row.currentState === "Not Requested",
      ),
    ).toBe(true);
    expect(
      out.gateCriterionStates.some((row) => row.fromStage === "bafo"),
    ).toBe(true);
  });
});

describe("mergeMissingVirtualScaffold", () => {
  const input = {
    sourceEventId: "evt-partial-pricing",
    tenantKey: "apexretail",
  };

  it("fills missing later-stage artifacts when only early-stage substrate exists", () => {
    const base = buildVirtualEventScaffold(input);
    const strategyOnly = {
      artifactStates: base.artifactStates.filter(
        (row) => row.stage === "strategy",
      ),
      gateCriterionStates: base.gateCriterionStates.filter(
        (row) => row.fromStage === "strategy",
      ),
      evidenceStates: base.evidenceStates.filter(
        (row) => row.stage === "strategy",
      ),
    };

    const merged = mergeMissingVirtualScaffold(input, strategyOnly);

    expect(merged.artifactStates.some((row) => row.stage === "pricing")).toBe(
      true,
    );
    expect(merged.artifactStates.some((row) => row.stage === "bafo")).toBe(
      true,
    );
    expect(
      merged.gateCriterionStates.some((row) => row.fromStage === "pricing"),
    ).toBe(true);
    expect(merged.evidenceStates.some((row) => row.stage === "bafo")).toBe(
      true,
    );
  });

  it("preserves persisted rows when matching virtual scaffold entries exist", () => {
    const base = buildVirtualEventScaffold(input);
    const persistedArtifact = {
      ...base.artifactStates.find(
        (row) => row.artifactCode === "d01_strategy_memo",
      )!,
      status: "approved" as const,
      body: "Persisted authored memo",
    };

    const merged = mergeMissingVirtualScaffold(input, {
      artifactStates: [persistedArtifact],
    });

    expect(
      merged.artifactStates.find(
        (row) => row.artifactCode === "d01_strategy_memo",
      ),
    ).toMatchObject({
      status: "approved",
      body: "Persisted authored memo",
    });
  });
});
