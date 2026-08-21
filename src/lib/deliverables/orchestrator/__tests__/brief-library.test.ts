// PR-2 proof: deliverables differ by use case. A deliverable structure composed with
// an archetype pack yields archetype-specific exhibits/tables/evidence — not one
// generic template — while the AMS RFP keeps its bespoke override.
import {
  getArtifactBrief,
  hasDedicatedBrief,
} from "../artifact-brief-registry";
import { ARCHETYPE_PACKS, getArchetypePack } from "../briefs/archetype-packs";
import {
  DELIVERABLE_STRUCTURES,
  getDeliverableStructure,
} from "../briefs/deliverable-structures";
import { amsRfpRequest } from "../__fixtures__/ams-rfp";
import type { DeliverableIntelligenceRequest } from "../types";

function req(
  over: Partial<DeliverableIntelligenceRequest>,
): DeliverableIntelligenceRequest {
  return amsRfpRequest(over);
}

describe("archetype packs", () => {
  it("cover the four named use cases with distinct exhibits", () => {
    for (const a of [
      "AMS_IT_OUTSOURCING",
      "ERP_SI_SELECTION",
      "CLOUD_MODERNIZATION",
      "AI_PDLC",
    ]) {
      const pack = getArchetypePack(a)!;
      expect(pack.exhibits.length).toBeGreaterThanOrEqual(4);
      expect(pack.tables.length).toBeGreaterThanOrEqual(4);
      expect(pack.keyEvidenceFamilies.length).toBeGreaterThan(0);
    }
    expect(Object.keys(ARCHETYPE_PACKS)).toHaveLength(4);
  });

  it("AMS exhibits differ from cloud-modernization exhibits", () => {
    const ams = new Set(
      getArchetypePack("AMS_IT_OUTSOURCING")!.exhibits.map((e) => e.title),
    );
    const cloud = new Set(
      getArchetypePack("CLOUD_MODERNIZATION")!.exhibits.map((e) => e.title),
    );
    expect([...cloud].some((t) => !ams.has(t))).toBe(true);
    expect(
      getArchetypePack("CLOUD_MODERNIZATION")!.tables.some((t) =>
        /6Rs|Disposition/.test(t.title),
      ),
    ).toBe(true);
    expect(
      getArchetypePack("AI_PDLC")!.tables.some((t) => /DORA/.test(t.title)),
    ).toBe(true);
  });
});

describe("deliverable structures", () => {
  it("cover Moves + Source artifact types with required sections", () => {
    expect(getDeliverableStructure("moves", "charter")).toBeTruthy();
    expect(getDeliverableStructure("moves", "business_case")).toBeTruthy();
    expect(getDeliverableStructure("moves", "roadmap")).toBeTruthy();
    expect(
      getDeliverableStructure("moves", "root_cause_worksheet"),
    ).toBeTruthy();
    expect(
      getDeliverableStructure("source", "sourcing_strategy_memo"),
    ).toBeTruthy();
    for (const d of DELIVERABLE_STRUCTURES) {
      expect(d.requiredSectionKeys.length).toBeGreaterThan(0);
      // Every structure must ground in governed evidence somewhere — but a
      // commitment doc like the P1 Charter grounds through `mixed` sections
      // (evidence + synthesis) rather than a pure `governed_facts` current-state
      // analysis, which belongs to P2. Both modes are evidence-bearing.
      expect(
        d.sections.some(
          (s) =>
            s.groundingMode === "governed_facts" || s.groundingMode === "mixed",
        ),
      ).toBe(true);
    }
  });

  it("root_cause_worksheet has its own fixed issue-tree structure, not the discovery report binder", () => {
    const brief = getArtifactBrief(
      req({
        module: "moves",
        deliverableType: "root_cause_worksheet",
        useCaseArchetype: "AI_PDLC",
      }),
    );
    expect(brief.deliverableType).toBe("root_cause_worksheet");
    expect(brief.fixedStructure).toBe(true);
    expect(brief.requiredSections).toEqual([
      "exec_answer",
      "symptom_cause_table",
      "root_cause_tree",
      "confidence_gaps",
      "p3_implications",
    ]);
    expect(brief.expectedExhibits.map((e) => e.key)).toEqual([
      "symptom_cause_table",
      "root_cause_tree",
    ]);
    expect(brief.recommendedStructure.map((s) => s.key)).not.toContain(
      "maturity",
    );
  });

  it.each([
    [
      "solution_design",
      8,
      ["experience_flow", "component_interaction", "exception_control_flow"],
    ],
    ["operating_model", 8, ["human_ai_work_split", "decision_rights"]],
    ["sourcing_strategy", 7, ["sourcing_options_matrix"]],
  ] as const)(
    "%s has a fixed, purpose-specific structure instead of the generic Moves binder",
    (deliverableType, sectionCount, exhibitKeys) => {
      const structure = getDeliverableStructure("moves", deliverableType)!;
      const brief = getArtifactBrief(
        req({ module: "moves", deliverableType, useCaseArchetype: "AI_PDLC" }),
      );
      expect(structure.fixedStructure).toBe(true);
      expect(structure.sections).toHaveLength(sectionCount);
      expect(brief.recommendedStructure).toHaveLength(sectionCount);
      expect(brief.requiredSections).toEqual(structure.requiredSectionKeys);
      expect(brief.expectedExhibits.map((exhibit) => exhibit.key)).toEqual(
        exhibitKeys,
      );
      expect(
        brief.recommendedStructure.map((section) => section.key),
      ).not.toEqual(
        expect.arrayContaining([
          "phase_gates",
          "value_case",
          "implementation_roadmap",
        ]),
      );
    },
  );

  it("keeps solution-design authoring budgets below the hard export ceiling", () => {
    const structure = getDeliverableStructure("moves", "solution_design")!;
    expect(structure.sections.map((section) => section.expertLatitude)).toEqual(
      [
        "Keep under 300 words; lead with the decision and do not restate the full architecture.",
        "Keep under 450 words plus one workflow exhibit.",
        "Keep under 550 words plus a component interaction exhibit.",
        "Keep under 500 words; use a compact contract table.",
        "Keep under 450 words plus one exception/control exhibit.",
        "Keep under 450 words; distinguish confirmed requirements from open decisions.",
        "Keep under 450 words using concise tables.",
        "Keep under 150 words.",
      ],
    );
  });

  it("keeps operating-model authoring budgets below the hard export ceiling", () => {
    const structure = getDeliverableStructure("moves", "operating_model")!;
    expect(structure.sections.map((section) => section.expertLatitude)).toEqual(
      [
        "Keep under 300 words.",
        "Keep under 500 words plus one exhibit.",
        "Keep under 600 words using role and RACI tables.",
        "Keep under 550 words plus one decision-rights exhibit.",
        "Keep under 500 words using a cadence table.",
        "Keep under 450 words; tie each action to the changed process and measure.",
        "Keep under 400 words using concise tables.",
        "Keep under 120 words.",
      ],
    );
  });

  it("keeps sourcing-strategy authoring budgets below the hard export ceiling", () => {
    const structure = getDeliverableStructure("moves", "sourcing_strategy")!;
    expect(structure.sections.map((section) => section.expertLatitude)).toEqual(
      [
        "Keep under 200 words.",
        "Keep under 325 words using a capability table.",
        "Keep under 425 words plus one options matrix.",
        "Keep under 350 words using compact criteria and guardrail tables.",
        "Keep under 325 words.",
        "Keep under 275 words using a single table.",
        "Keep under 80 words.",
      ],
    );
  });

  it("keeps P4 estimate, value, and readiness instruments fixed, compact, and evidence-gated", () => {
    const estimate = getDeliverableStructure("moves", "estimate_model")!;
    const value = getDeliverableStructure("moves", "value_model")!;
    const readiness = getDeliverableStructure(
      "moves",
      "readiness_and_change_plan",
    )!;

    expect(estimate.fixedStructure).toBe(true);
    expect(value.fixedStructure).toBe(true);
    expect(readiness.fixedStructure).toBe(true);
    expect((estimate.prohibitedContent ?? []).join(" ")).toMatch(
      /Do not include invented implementation budgets, annual savings, ROI, NPV, IRR, or payback/,
    );
    expect((value.prohibitedContent ?? []).join(" ")).toMatch(
      /Do not include unsupported realized value, annual savings, ROI, NPV, payback, or target-value claims/,
    );
    expect((readiness.prohibitedContent ?? []).join(" ")).toMatch(
      /Do not turn readiness approval into funding approval/,
    );
    expect(
      estimate.sections.map((section) => section.expertLatitude).join(" "),
    ).toMatch(/input-register table/);
    expect(
      value.sections.map((section) => section.expertLatitude).join(" "),
    ).toMatch(
      /compact table for metrics, owner, source, baseline status, cadence, and acceptance rule/,
    );
    expect(
      readiness.sections.map((section) => section.expertLatitude).join(" "),
    ).toMatch(/role-and-authority table/);
  });
});

describe("composition — same deliverable type differs by archetype", () => {
  it("a Moves business case for AMS vs cloud carries different exhibits/evidence", () => {
    const amsBC = getArtifactBrief(
      req({
        module: "moves",
        deliverableType: "business_case",
        useCaseArchetype: "AMS_IT_OUTSOURCING",
      }),
    );
    const cloudBC = getArtifactBrief(
      req({
        module: "moves",
        deliverableType: "business_case",
        useCaseArchetype: "CLOUD_MODERNIZATION",
      }),
    );
    // same baseline section flow…
    expect(amsBC.recommendedStructure.map((s) => s.key)).toEqual(
      cloudBC.recommendedStructure.map((s) => s.key),
    );
    // …but archetype-specific exhibits
    const amsExhibits = amsBC.expectedExhibits.map((e) => e.title);
    const cloudExhibits = cloudBC.expectedExhibits.map((e) => e.title);
    expect(amsExhibits).not.toEqual(cloudExhibits);
    expect(cloudExhibits.join(" ")).toMatch(/Migration Waves|Dependency/);
    // current-state section is enriched with the archetype's evidence families
    const cloudCurrent = cloudBC.recommendedStructure.find(
      (s) => s.key === "current_state",
    )!;
    expect(cloudCurrent.expectedEvidenceFamilies).toContain(
      "app_dependency_map",
    );
  });

  it("AI-PDLC business case surfaces DORA + AI-tooling intelligence", () => {
    const brief = getArtifactBrief(
      req({
        module: "moves",
        deliverableType: "business_case",
        useCaseArchetype: "AI_PDLC",
      }),
    );
    expect(brief.expectedExhibits.some((e) => /DORA/.test(e.title))).toBe(true);
    expect(brief.expectedTables.some((t) => /AI Tooling/.test(t.title))).toBe(
      true,
    );
  });

  it("AMS RFP keeps its bespoke override (not the composed default)", () => {
    expect(
      hasDedicatedBrief("source", "AMS_IT_OUTSOURCING", "rfp_package"),
    ).toBe(true);
    const brief = getArtifactBrief(
      req({
        module: "source",
        deliverableType: "rfp_package",
        useCaseArchetype: "AMS_IT_OUTSOURCING",
      }),
    );
    expect(brief.disallowedFabrication).toMatch(
      /incumbent vendor names|spend/i,
    );
    expect(brief.recommendedStructure.length).toBeGreaterThanOrEqual(10);
  });

  it("composed RFP for ERP/SI carries SI-selection governance + exhibits", () => {
    const brief = getArtifactBrief(
      req({
        module: "source",
        deliverableType: "sourcing_strategy_memo",
        useCaseArchetype: "ERP_SI_SELECTION",
      }),
    );
    expect(
      brief.expectedExhibits.some((e) =>
        /Rollout Waves|Integration/.test(e.title),
      ),
    ).toBe(true);
    expect(
      brief.expectedTables.some((t) =>
        /Integration Register|Data Migration/.test(t.title),
      ),
    ).toBe(true);
  });

  it("still falls back to the module default for an unknown deliverable type", () => {
    const brief = getArtifactBrief(
      req({
        module: "tower",
        deliverableType: "mystery_doc",
        useCaseArchetype: "UNKNOWN",
      }),
    );
    expect(brief.recommendedStructure.length).toBeGreaterThanOrEqual(4);
    expect(brief.requiredSections.length).toBeGreaterThan(0);
  });
});

describe("target_state_architecture key resolution (regression)", () => {
  it("resolves via the exact gate-artifact key used by governance.ts/deliverable-registry.ts", () => {
    // getDeliverableStructure is an exact-string lookup — this deliverable type
    // was previously registered as "target_architecture" (missing "_state"),
    // so every real Target State Architecture generation silently fell through
    // to defaultBrief() with zero expected exhibits. Guard the exact key.
    expect(
      getDeliverableStructure("moves", "target_state_architecture"),
    ).toBeTruthy();
    expect(
      getDeliverableStructure("moves", "target_architecture"),
    ).toBeUndefined();
  });

  it("composes with real architecture-view exhibits, not the empty-exhibit default fallback", () => {
    const brief = getArtifactBrief(
      req({
        module: "moves",
        deliverableType: "target_state_architecture",
        useCaseArchetype: "AI_PDLC",
      }),
    );
    const kinds = brief.expectedExhibits.map((e) => e.kind);
    expect(kinds).toEqual(
      expect.arrayContaining([
        "conceptual_architecture",
        "logical_architecture",
        "physical_architecture",
        "agent_orchestration",
      ]),
    );
    // deliverable-type exhibits are additive to the archetype pack's own exhibits
    expect(brief.expectedExhibits.length).toBeGreaterThan(4);
    const physical = brief.expectedExhibits.find(
      (e) => e.kind === "physical_architecture",
    )!;
    expect(physical.requiredElements).toEqual(
      expect.arrayContaining(["regions", "secrets", "CI/CD"]),
    );
    expect(physical.legendRequired).toBe(true);
  });

  it("a Business Case under the SAME archetype does NOT get the architecture exhibits", () => {
    const brief = getArtifactBrief(
      req({
        module: "moves",
        deliverableType: "business_case",
        useCaseArchetype: "AI_PDLC",
      }),
    );
    expect(
      brief.expectedExhibits.some((e) => e.kind === "physical_architecture"),
    ).toBe(false);
    expect(
      brief.expectedExhibits.some((e) => e.kind === "agent_orchestration"),
    ).toBe(false);
  });

  it("carries the purpose-boundary prohibitedContent through to the brief", () => {
    const brief = getArtifactBrief(
      req({
        module: "moves",
        deliverableType: "target_state_architecture",
        useCaseArchetype: "AI_PDLC",
      }),
    );
    expect(brief.prohibitedContent?.join(" ")).toMatch(/not a build plan/i);
  });
});
