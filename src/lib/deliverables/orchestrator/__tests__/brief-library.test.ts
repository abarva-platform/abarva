// PR-2 proof: deliverables differ by use case. A deliverable structure composed with
// an archetype pack yields archetype-specific exhibits/tables/evidence — not one
// generic template — while the AMS RFP keeps its bespoke override.
import {
  getArtifactBrief,
  hasDedicatedBrief,
} from "../artifact-brief-registry";
import {
  ARCHETYPE_PACKS,
  getArchetypePack,
  loadArchetypePackCatalog,
} from "../briefs/archetype-packs";
import {
  assetKeyCollisions,
  composeArtifactAssets,
} from "../briefs/artifact-asset-composition";
import {
  DELIVERABLE_STRUCTURES,
  getDeliverableStructure,
} from "../briefs/deliverable-structures";
import type { DeliverableStructure } from "../briefs/deliverable-structures";
import { resolveQualityBar } from "../quality-bar-registry";
import { amsRfpRequest } from "../__fixtures__/ams-rfp";
import type { DeliverableIntelligenceRequest } from "../types";

function req(
  over: Partial<DeliverableIntelligenceRequest>,
): DeliverableIntelligenceRequest {
  return amsRfpRequest(over);
}

describe("archetype packs", () => {
  it("cover the named use cases with distinct exhibits", () => {
    for (const a of [
      "AMS_IT_OUTSOURCING",
      "ERP_SI_SELECTION",
      "CLOUD_MODERNIZATION",
      "AI_PDLC",
      "ANALYTICS_CAPABILITY_REPATRIATION",
      "GOVERNED_DATA_FOUNDATION",
    ]) {
      const pack = getArchetypePack(a)!;
      expect(pack.exhibits.length).toBeGreaterThanOrEqual(4);
      expect(pack.tables.length).toBeGreaterThanOrEqual(4);
      expect(pack.keyEvidenceFamilies.length).toBeGreaterThan(0);
    }
    expect(Object.keys(ARCHETYPE_PACKS)).toHaveLength(6);
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
    expect(brief.expectedExhibits.map((e) => e.key)).toEqual(
      expect.arrayContaining(["symptom_cause_table", "root_cause_tree"]),
    );
    expect(brief.recommendedStructure.map((s) => s.key)).not.toContain(
      "maturity",
    );
  });

  it("design_workshop_guide is a bounded facilitation guide, not a generic report binder", () => {
    const brief = getArtifactBrief(
      req({
        module: "moves",
        deliverableType: "design_workshop_guide",
        useCaseArchetype: "AI_PDLC",
      }),
    );

    expect(brief.fixedStructure).toBe(true);
    expect(brief.requiredSections).toEqual([
      "discovery_carry_forward",
      "design_session_plan",
      "evidence_carry_forward",
      "facilitation_tradeoffs",
      "design_gate_readiness",
    ]);
    expect(brief.recommendedStructure).toHaveLength(5);
    expect(brief.recommendedStructure.map((section) => section.title)).toEqual(
      expect.arrayContaining([
        "Design Sessions & Decisions",
        "Evidence & Assumptions to Carry into Design",
        "Design Exit & Roadmap Handoff Readiness",
      ]),
    );
    expect(brief.prohibitedContent?.join(" ")).toMatch(
      /not a completed future-state solution/i,
    );
    expect(brief.prohibitedContent?.join(" ")).toMatch(
      /estimate scope.*approved roadmap/i,
    );
    const sectionBudgets = brief.recommendedStructure.map((section) => {
      const budget = section.expertLatitude.match(/Keep under (\d+) words\./);
      expect(budget).not.toBeNull();
      return Number(budget?.[1]);
    });
    expect(
      sectionBudgets.reduce((total, words) => total + words, 0),
    ).toBeLessThanOrEqual(
      resolveQualityBar("moves", "design_workshop_guide").targetBodyWordsMax!,
    );
    expect(brief.expectedTables.map((table) => table.key)).not.toContain(
      "risk_register",
    );
    expect(brief.expectedExhibits).toHaveLength(0);
  });

  it.each([
    ["roadmap", 7, ["executive_roadmap"]],
    ["discovery_report", 6, []],
    [
      "target_state_architecture",
      7,
      [
        "conceptual_architecture",
        "logical_architecture",
        "physical_architecture",
        "agent_orchestration",
      ],
    ],
    [
      "solution_design",
      6,
      ["experience_flow", "component_interaction", "exception_control_flow"],
    ],
    ["operating_model", 6, ["human_ai_work_split", "decision_rights"]],
    ["requirements_traceability", 5, []],
    ["sourcing_strategy", 5, ["sourcing_options_matrix"]],
    ["estimate_model", 6, []],
    ["value_model", 6, []],
    ["readiness_and_change_plan", 7, []],
    ["mobilization_plan", 6, []],
    ["handoff_pack", 7, []],
    ["executive_playback", 6, []],
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
        expect.arrayContaining([...exhibitKeys]),
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

  it("keeps every shared deliverable structure to seven sections or fewer", () => {
    const oversized = DELIVERABLE_STRUCTURES.filter(
      (structure) => structure.sections.length > 7,
    ).map((structure) => ({
      key: `${structure.module}:${structure.deliverableType}`,
      sectionCount: structure.sections.length,
    }));

    expect(oversized).toEqual([]);
  });

  it("keeps target architecture fixed, decision-focused, and below the hard export ceiling", () => {
    const structure = getDeliverableStructure(
      "moves",
      "target_state_architecture",
    )!;
    expect(structure.fixedStructure).toBe(true);
    expect(structure.sections.map((section) => section.key)).toEqual([
      "exec_summary",
      "options_considered",
      "current_state",
      "target_state",
      "platform_controls",
      "implementation_risks",
      "recommendation",
    ]);
    expect(structure.sections.map((section) => section.expertLatitude)).toEqual(
      [
        "Keep under 450 words. State the decision once; do not preview every later section.",
        "Keep under 650 words using an options matrix. Do not invent three options when only one credible pattern exists.",
        "Keep under 500 words. State only facts that change the architecture decision; put missing facts in open inputs.",
        "Keep under 750 words plus the required architecture exhibits. Explain what each exhibit proves; do not repeat its labels as prose.",
        "Keep under 650 words using one compact controls/integration table. Mark provider/service choices as selected, illustrative, or open input.",
        "Keep under 600 words using a risk/dependency table. Sequence architecture decisions only; do not become a project plan.",
        "Keep under 250 words. End with approve / revise / hold and named next actions.",
      ],
    );
    const authoredBudget = structure.sections.reduce((sum, section) => {
      const n = section.expertLatitude.match(/under ([\d,]+) words/i)?.[1];
      return sum + (n ? Number(n.replace(/,/g, "")) : 0);
    }, 0);
    expect(authoredBudget).toBeLessThan(5_000);
    expect(structure.requiredSectionKeys).toEqual([
      "exec_summary",
      "current_state",
      "target_state",
      "recommendation",
    ]);
    expect(structure.requiredSectionKeys).not.toContain("options_considered");
  });

  it("keeps solution-design authoring budgets below the hard export ceiling", () => {
    const structure = getDeliverableStructure("moves", "solution_design")!;
    expect(structure.sections.map((section) => section.key)).toEqual([
      "exec_decision",
      "journey_workflow",
      "solution_components",
      "controls_operability",
      "acceptance_traceability",
      "recommendation",
    ]);
    expect(structure.sections.map((section) => section.expertLatitude)).toEqual(
      [
        "Keep under 300 words; lead with the decision and do not restate the full architecture.",
        "Keep under 450 words plus one workflow exhibit.",
        "Keep under 700 words plus a component interaction exhibit. Use one compact responsibility/contract table; do not write separate component and data essays.",
        "Keep under 650 words plus one exception/control exhibit. Distinguish confirmed requirements from open decisions.",
        "Keep under 450 words using concise tables.",
        "Keep under 150 words.",
      ],
    );
    expect(structure.requiredSectionKeys).toEqual([
      "exec_decision",
      "solution_components",
      "acceptance_traceability",
      "recommendation",
    ]);
    expect(structure.requiredSectionKeys).not.toContain("journey_workflow");
  });

  it("keeps operating-model authoring budgets below the hard export ceiling", () => {
    const structure = getDeliverableStructure("moves", "operating_model")!;
    expect(structure.sections.map((section) => section.key)).toEqual([
      "exec_decision",
      "work_split_controls",
      "roles_cadence",
      "adoption",
      "risks_open",
      "recommendation",
    ]);
    expect(structure.sections.map((section) => section.expertLatitude)).toEqual(
      [
        "Keep under 300 words.",
        "Keep under 750 words plus both operating exhibits. Use one compact work-split table and one decision-rights table.",
        "Keep under 700 words using role/RACI and cadence tables; no narrative role biographies.",
        "Keep under 450 words; tie each action to the changed process and measure.",
        "Keep under 400 words using concise tables.",
        "Keep under 120 words.",
      ],
    );
    expect(structure.requiredSectionKeys).toEqual([
      "exec_decision",
      "work_split_controls",
      "roles_cadence",
      "recommendation",
    ]);
    expect(structure.requiredSectionKeys).not.toContain("adoption");
  });

  it("keeps requirements-traceability as a compact control matrix below its hard ceiling", () => {
    const structure = getDeliverableStructure(
      "moves",
      "requirements_traceability",
    )!;
    expect(structure.fixedStructure).toBe(true);
    expect(structure.sections.map((section) => section.expertLatitude)).toEqual(
      [
        "Keep under 180 words. State the verdict, material conditions, and what decision this enables.",
        "Keep under 450 words using a compact requirements table; do not narrate every row.",
        "Keep under 650 words using one traceability matrix; tables carry the detail, prose only explains exceptions.",
        "Keep under 450 words using a single exception/control table.",
        "Keep under 120 words.",
      ],
    );
    const authoredBudget = structure.sections.reduce((sum, section) => {
      const n = section.expertLatitude.match(/under (\d+) words/i)?.[1];
      return sum + (n ? Number(n) : 0);
    }, 0);
    expect(authoredBudget).toBeLessThan(3_200);
  });

  it("keeps sourcing-strategy authoring budgets below the hard export ceiling", () => {
    const structure = getDeliverableStructure("moves", "sourcing_strategy")!;
    expect(structure.sections.map((section) => section.key)).toEqual([
      "exec_decision",
      "scope_options",
      "evaluation_guardrails",
      "delivery_risks",
      "recommendation",
    ]);
    expect(structure.sections.map((section) => section.expertLatitude)).toEqual(
      [
        "Keep under 200 words.",
        "Keep under 650 words plus one options matrix. Use a capability/options table; do not split capability boundary and options into separate essays.",
        "Keep under 350 words using compact criteria and guardrail tables.",
        "Keep under 500 words using one delivery/risk/input table.",
        "Keep under 80 words.",
      ],
    );
    expect(structure.requiredSectionKeys).toEqual([
      "exec_decision",
      "scope_options",
      "evaluation_guardrails",
      "recommendation",
    ]);
    expect(structure.requiredSectionKeys).not.toContain("delivery_risks");
  });

  it("keeps business-case structure concise and avoids duplicated decision sections", () => {
    const structure = getDeliverableStructure("moves", "business_case")!;
    const brief = getArtifactBrief(
      req({
        module: "moves",
        deliverableType: "business_case",
        useCaseArchetype: "AI_PDLC",
      }),
    );

    expect(structure.sections.map((section) => section.key)).toEqual([
      "exec_summary",
      "decision_required",
      "current_state",
      "options",
      "value_hypothesis",
      "risks",
    ]);
    expect(structure.sections.map((section) => section.title)).toEqual([
      "Executive Answer",
      "Funding Decision & Recommendation",
      "Baseline, Problem & Opportunity",
      "Options, Trade-Offs & Recommended Path",
      "Economics & Value Case",
      "Risks, Conditions & Evidence Gaps",
    ]);
    expect(brief.recommendedStructure).toHaveLength(6);
    expect(structure.requiredSectionKeys).toEqual([
      "exec_summary",
      "decision_required",
      "current_state",
      "value_hypothesis",
      "risks",
    ]);
    expect(brief.optionalSections).toEqual(["options"]);
    expect(resolveQualityBar("moves", "business_case").minSections).toBe(
      structure.requiredSectionKeys.length,
    );
    expect(structure.sections.map((section) => section.key)).not.toEqual(
      expect.arrayContaining([
        "problem_opportunity",
        "cost_model",
        "financials",
        "recommendation",
      ]),
    );
    expect((structure.prohibitedContent ?? []).join(" ")).toMatch(
      /Do not add separate Problem \/ Opportunity, Cost Model, Financial Summary, or Recommendation sections/,
    );
  });

  it.each([
    ["business_case", true],
    ["target_state_architecture", true],
    ["solution_design", true],
    ["operating_model", true],
    ["sourcing_strategy", true],
    ["roadmap", true],
    ["discovery_report", true],
    ["estimate_model", true],
    ["value_model", true],
    ["readiness_and_change_plan", true],
    ["handoff_pack", true],
    ["mobilization_plan", true],
    ["executive_playback", true],
  ] as const)(
    "%s quality floor follows required sections, not optional section count",
    (deliverableType, hasOptionalSections) => {
      const structure = getDeliverableStructure("moves", deliverableType)!;
      if (hasOptionalSections) {
        expect(structure.sections.length).toBeGreaterThan(
          structure.requiredSectionKeys.length,
        );
      }
      expect(resolveQualityBar("moves", deliverableType).minSections).toBe(
        structure.requiredSectionKeys.length,
      );
    },
  );

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
    expect(readiness.requiredSectionKeys).not.toContain("dependencies_risks");
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

  it("analytics repatriation business case surfaces parity, exit, and cost-stack intelligence", () => {
    const brief = getArtifactBrief(
      req({
        module: "moves",
        deliverableType: "business_case",
        useCaseArchetype: "ANALYTICS_CAPABILITY_REPATRIATION",
      }),
    );

    expect(
      brief.expectedExhibits.some((exhibit) =>
        /Transition Cost Stack/.test(exhibit.title),
      ),
    ).toBe(true);
    expect(
      brief.expectedTables.some((table) =>
        /Contract, IP, Data Return and Exit/.test(table.title),
      ),
    ).toBe(true);
    expect(brief.disallowedFabrication).toMatch(
      /Never compute savings as vendor spend minus internal platform cost/,
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
    expect(
      brief.expectedExhibits.filter((e) =>
        [
          "conceptual_architecture",
          "logical_architecture",
          "physical_architecture",
          "agent_orchestration",
        ].includes(e.kind),
      ),
    ).toHaveLength(4);
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

// ── a deliverable TYPE may declare the tables it needs ──
//
// `composeBrief` concatenated the structure's exhibits with the pack's but took
// its tables from the pack ALONE. The consequence was measurable and is pinned
// below: within one archetype, eighteen of the twenty-one shipped structures
// received an identical table set, so a Target State Architecture was asked for
// a vendor pricing template and a Requirements Traceability document for no
// traceability matrix. `expectedTables` reaches the model prompt
// (prompt-builder) and the retrieval queries (generate-service), so this is the
// instruction the document is written against, not a label.
//
// These cases fix the populations and assert what follows. None of them asserts
// a string the implementation also produces from a constant.

function tableSignature(
  module: DeliverableStructure["module"],
  deliverableType: string,
  archetype: string,
): string {
  return getArtifactBrief(req({ module, deliverableType, useCaseArchetype: archetype }))
    .expectedTables.map((t) => t.key)
    .sort()
    .join("+");
}

const ALL_ARCHETYPES = Object.keys(ARCHETYPE_PACKS);

const STRUCTURE_DECLARED_TABLES = DELIVERABLE_STRUCTURES.filter(
  (s) => (s.expectedTables ?? []).length > 0,
);

describe("structure-declared expected tables", () => {
  it("declares tables on the deliverable types built around one, and no others", () => {
    // Four structures, not an empty declaration anywhere: a structure with no
    // type-specific table must not carry an empty array, because that changes
    // nothing and no case could kill it.
    expect(
      STRUCTURE_DECLARED_TABLES.map((s) => `${s.module}/${s.deliverableType}`).sort(),
    ).toEqual([
      "moves/estimate_model",
      "moves/readiness_and_change_plan",
      "moves/requirements_traceability",
      "source/evaluation_workbook",
    ]);
    for (const s of DELIVERABLE_STRUCTURES)
      expect(s.expectedTables?.length === 0).toBe(false);
  });

  it("names a table no archetype pack supplies — the declaration is needed, not a copy", () => {
    const packTableKeys = new Set(
      ALL_ARCHETYPES.flatMap((a) => getArchetypePack(a)!.tables.map((t) => t.key)),
    );
    const declared = STRUCTURE_DECLARED_TABLES.flatMap((s) =>
      (s.expectedTables ?? []).map((t) => t.key),
    );
    expect(declared.length).toBeGreaterThan(0);
    for (const key of declared) expect(packTableKeys.has(key)).toBe(false);
  });

  it("carries each declared table into the brief under EVERY archetype", () => {
    // The expected keys are written out here rather than read back off
    // `s.expectedTables`. Reading them off the declaration makes the assertion
    // self-referential: renaming a key in the catalog renames it in the
    // expectation too, and the case passes while the table the deliverable is
    // built around has silently become something else.
    const DECLARED: Array<[DeliverableStructure["module"], string, string[]]> = [
      [
        "moves",
        "requirements_traceability",
        ["requirements_traceability_matrix", "traceability_gap_register"],
      ],
      ["moves", "estimate_model", ["estimate_basis_buildup"]],
      ["moves", "readiness_and_change_plan", ["stakeholder_decision_rights"]],
      ["source", "evaluation_workbook", ["evaluation_scoring_model"]],
    ];
    expect(DECLARED.map(([m, d]) => `${m}/${d}`).sort()).toEqual(
      STRUCTURE_DECLARED_TABLES.map((s) => `${s.module}/${s.deliverableType}`).sort(),
    );
    for (const [module, deliverableType, want] of DECLARED) {
      const structure = DELIVERABLE_STRUCTURES.find(
        (s) => s.module === module && s.deliverableType === deliverableType,
      )!;
      expect((structure.expectedTables ?? []).map((t) => t.key)).toEqual(want);
      for (const a of ALL_ARCHETYPES) {
        const keys = getArtifactBrief(
          req({ module, deliverableType, useCaseArchetype: a }),
        ).expectedTables.map((t) => t.key);
        expect(keys.slice(0, want.length)).toEqual(want);
      }
    }
  });

  it("puts the artifact type's own tables before the use case's", () => {
    const keys = getArtifactBrief(
      req({
        module: "moves",
        deliverableType: "requirements_traceability",
        useCaseArchetype: "AMS_IT_OUTSOURCING",
      }),
    ).expectedTables.map((t) => t.key);
    expect(keys.slice(0, 2)).toEqual([
      "requirements_traceability_matrix",
      "traceability_gap_register",
    ]);
    expect(keys.length).toBeGreaterThan(2);
  });

  it("loses no table the archetype pack already supplied", () => {
    for (const s of DELIVERABLE_STRUCTURES) {
      if (s.deliverableType === "charter" || s.deliverableType === "design_workshop_guide")
        continue;
      if (s.deliverableType === "discovery_plan") continue; // routed to its own builder
      for (const a of ALL_ARCHETYPES) {
        const keys = new Set(
          getArtifactBrief(
            req({ module: s.module, deliverableType: s.deliverableType, useCaseArchetype: a }),
          ).expectedTables.map((t) => t.key),
        );
        for (const packTable of getArchetypePack(a)!.tables)
          expect([...keys]).toContain(packTable.key);
      }
    }
  });

  it("still withholds the ARCHETYPE's tables from the approval instruments", () => {
    for (const deliverableType of ["charter", "design_workshop_guide"])
      for (const a of ALL_ARCHETYPES)
        expect(
          getArtifactBrief(req({ module: "moves", deliverableType, useCaseArchetype: a }))
            .expectedTables,
        ).toEqual([]);
  });

  it("makes a deliverable type's table set differ from its neighbours' under one archetype", () => {
    // The defect, stated as the number it produced. Under a single archetype
    // the four declaring structures now differ from the generic set; before
    // this field every non-withheld structure shared one signature.
    const a = "AMS_IT_OUTSOURCING";
    const generic = tableSignature("moves", "business_case", a);
    expect(tableSignature("moves", "target_state_architecture", a)).toBe(generic);
    for (const s of STRUCTURE_DECLARED_TABLES)
      expect(tableSignature(s.module, s.deliverableType, a)).not.toBe(generic);

    const distinct = new Set(
      DELIVERABLE_STRUCTURES.flatMap((s) =>
        ALL_ARCHETYPES.map((arch) => tableSignature(s.module, s.deliverableType, arch)),
      ),
    );
    // 32 over the six registered archetypes, and it decomposes exactly: one
    // empty signature shared by the two approval instruments that withhold
    // tables, one for the discovery plan its own builder serves, one generic
    // signature per archetype (6), and one per declaring structure per
    // archetype (4 x 6 = 24). Registering a sixth archetype pack therefore
    // added five, from 27. Dropping any structure's declaration collapses it
    // back toward the generic set and fails this case.
    expect(distinct.size).toBe(32);
  });
});

// ── the join rule itself ──
//
// `composeArtifactAssets` is exported and callable without `composeBrief`, and
// it is the ONLY place either asset kind is joined, so its cases are written
// against it directly. The collision it resolves is reachable through shipped
// code: `loadArchetypePackCatalog` validates a configured pack's shape and
// cannot know which keys a structure already declares.

describe("composeArtifactAssets", () => {
  const t = (key: string, title: string) => ({
    key,
    title,
    columns: ["A"],
    groundingMode: "mixed" as const,
    moveToExcelIfWide: false,
  });

  it("concatenates structure-first when nothing collides, and mutates neither input", () => {
    const fromStructure = [t("own_one", "Own One")];
    const fromPack = [t("pack_one", "Pack One"), t("pack_two", "Pack Two")];
    expect(composeArtifactAssets(fromStructure, fromPack).map((x) => x.key)).toEqual([
      "own_one",
      "pack_one",
      "pack_two",
    ]);
    expect(fromStructure).toHaveLength(1);
    expect(fromPack).toHaveLength(2);
  });

  it("keeps one entry per key, and the structure's wins", () => {
    const composed = composeArtifactAssets(
      [t("estimate_basis_buildup", "Estimate Build-Up & Basis of Estimate")],
      [t("estimate_basis_buildup", "Vendor Pricing Sheet"), t("risk_register", "Risks")],
    );
    expect(composed.map((x) => x.key)).toEqual(["estimate_basis_buildup", "risk_register"]);
    expect(composed[0].title).toBe("Estimate Build-Up & Basis of Estimate");
  });

  it("de-duplicates within one side too", () => {
    expect(
      composeArtifactAssets([t("a", "A1"), t("a", "A2")], [t("a", "A3")]).map((x) => x.key),
    ).toEqual(["a"]);
  });

  it("keeps key-less assets rather than collapsing them into one", () => {
    // A blank key is a contract defect for the schemas to refuse. Folding two
    // of them together would delete an expectation and hide it.
    const composed = composeArtifactAssets(
      [t("", "First Unkeyed")],
      [t("  ", "Second Unkeyed")],
    );
    expect(composed).toHaveLength(2);
  });

  it("reports the collision as well as resolving it", () => {
    expect(
      assetKeyCollisions(
        [t("estimate_basis_buildup", "Mine"), t("only_mine", "Mine Too")],
        [t("estimate_basis_buildup", "Theirs"), t("risk_register", "Risks")],
      ),
    ).toEqual(["estimate_basis_buildup"]);
  });

  it("reports no collision for any shipped structure × pack pair", () => {
    for (const s of DELIVERABLE_STRUCTURES)
      for (const a of ALL_ARCHETYPES) {
        const pack = getArchetypePack(a)!;
        expect(assetKeyCollisions(s.expectedTables ?? [], pack.tables)).toEqual([]);
        expect(assetKeyCollisions(s.expectedExhibits ?? [], pack.exhibits)).toEqual([]);
      }
  });

  it("resolves a collision that a CONFIGURED pack makes reachable today", () => {
    // The door, through shipped code: the pack contract accepts this source
    // (its own keys are unique) and the structure already declares the key.
    const structure = DELIVERABLE_STRUCTURES.find(
      (s) => s.deliverableType === "estimate_model",
    )!;
    const loaded = loadArchetypePackCatalog([
      {
        archetype: "AMS_IT_OUTSOURCING",
        label: "AMS / IT Outsourcing",
        keyEvidenceFamilies: ["service_tower_scope"],
        exhibits: [
          {
            key: "service_tower_scope_map",
            title: "Service Tower Scope Map",
            kind: "matrix",
            purpose: "Show the towers in scope.",
            preferredFormat: "pptx",
          },
        ],
        tables: [
          {
            key: "estimate_basis_buildup",
            title: "Vendor Pricing Sheet",
            columns: ["Tower", "Unit", "Rate"],
            groundingMode: "mixed",
            moveToExcelIfWide: false,
          },
        ],
      },
    ]);
    expect(loaded.errors).toEqual([]);
    expect(loaded.applied).toEqual([
      { archetype: "AMS_IT_OUTSOURCING", outcome: "overrode" },
    ]);

    const configured = loaded.catalog.AMS_IT_OUTSOURCING;
    expect(assetKeyCollisions(structure.expectedTables ?? [], configured.tables)).toEqual([
      "estimate_basis_buildup",
    ]);
    const composed = composeArtifactAssets(
      structure.expectedTables ?? [],
      configured.tables,
    );
    expect(composed.map((x) => x.key)).toEqual(["estimate_basis_buildup"]);
    expect(composed[0].title).toBe("Estimate Build-Up & Basis of Estimate");
  });
});
