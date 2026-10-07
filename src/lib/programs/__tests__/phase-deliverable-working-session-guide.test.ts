// Every working-session guide a Moves phase can build takes the working-guide
// generation path — not just the one the prompt builder used to name.
//
// The prompt builder branched eleven times on
// `req.module === "moves" && req.deliverableType === "design_workshop_guide"`,
// which selected the draft requirements, the red-team reviewer's role and
// criteria, the rewrite standard, the render instruction, the per-section draft
// framing, the next-actions requirement, the expected exhibits/tables lines,
// the quality-bar line, the formatting line, the size-discipline note and the
// length-and-purpose rules. Five generatable deliverables are working guides.
// The other four took the BOARD-GRADE path: drafted with "a clear
// recommendation with next steps", red-teamed for "unclear or missing
// decisions", rewritten to strengthen "the decision ask" — against their own
// declaration, which sets `requiresRecommendation`, `requiresDecisionSection`
// and `requiresRiskTable` to false and whose profile acceptance checks say the
// guide "does not make new sponsor, funding, design, or execution decisions".
//
// Nothing failed when the literal was widened to the declaration — 457 suites
// passed unchanged — because no suite exercised the other four guides' prompts
// at all. That is what this one does, from the production request builder.

import {
  PHASE_CANONICAL_KEYS,
  phaseCanonicalKeysForRoute,
} from "@/lib/programs/deliverable-registry";
import { orchestratorDeliverableType } from "@/lib/programs/orchestrated-deliverable-map";
import { resolveQualityBar } from "@/lib/deliverables/orchestrator/quality-bar-registry";
import { getArtifactBrief } from "@/lib/deliverables/orchestrator/artifact-brief-registry";
import { buildPassPrompt } from "@/lib/deliverables/orchestrator/prompt-builder";
import { buildMoveDeliverableRequest } from "@/lib/programs/deliverables/orchestrated/build-request";
import { DELIVERABLE_PROFILES } from "@/lib/deliverables/profiles/registry";
import { deliverableKeyForOrchestratorType } from "@/lib/deliverables/quality/deliverable-key-map";
import {
  isWorkingSessionGuide,
  workingSessionGuideAcceptanceChecks,
  workingSessionGuidePurpose,
  workingSessionGuidePurposeRules,
} from "@/lib/deliverables/orchestrator/working-session-guide";
import type { ConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";
import type { MoveBusinessCaseInput } from "@/lib/programs/move-business-case";

// Written out rather than read from the predicate under test: a deliverable
// that changes sides has to change this list, which is the point.
const WORKING_SESSION_GUIDES = [
  "design_workshop_guide",
  "discovery_plan",
  "execution_kickoff_guide",
  "mobilization_workshop_guide",
  "planning_workshop_guide",
];

const BOARD_GRADE_DELIVERABLES = [
  "business_case",
  "charter",
  "discovery_report",
  "execution_roadmap",
  "financial_model",
  "handoff_package",
  "operating_model_design",
  "process_change_estimate_brief",
  "readiness_and_change_plan",
  "requirements_traceability",
  "root_cause_worksheet",
  "solution_design",
  "sourcing_strategy",
  "target_state_architecture",
  "tower_metrics_plan",
  "value_measurement_contract",
];

type ChangeImpact = ConfirmedSolutionRoute["workflowChange"];
const CHANGE_IMPACTS: ChangeImpact[] = ["material", "limited", "none"];

/** Every route shape the build-set resolver branches on — the P3 set is route-dependent. */
function everyRouteShape(): Array<ConfirmedSolutionRoute | null> {
  const shapes: Array<ConfirmedSolutionRoute | null> = [null];
  for (const route of ["technical_product", "process_change"] as const) {
    for (const workflowChange of CHANGE_IMPACTS) {
      for (const roleAccountabilityChange of CHANGE_IMPACTS) {
        shapes.push({
          route,
          workflowChange,
          roleAccountabilityChange,
        } as ConfirmedSolutionRoute);
      }
    }
  }
  return shapes;
}

function everyGeneratableKey(): string[] {
  const keys = new Set<string>();
  for (const phase of [1, 2, 3, 4, 5]) {
    for (const key of PHASE_CANONICAL_KEYS[phase] ?? []) keys.add(key);
    for (const shape of everyRouteShape()) {
      for (const key of phaseCanonicalKeysForRoute(phase, shape)) keys.add(key);
    }
  }
  return [...keys].sort();
}

function signalFor(registryKey: string) {
  const deliverableType = orchestratorDeliverableType(registryKey);
  return {
    module: "moves",
    deliverableType,
    qualityBar: resolveQualityBar("moves", deliverableType),
  };
}

function move(): MoveBusinessCaseInput {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Governed data foundation",
    tenant_key: "demo-tenant",
    tenant_name: "Demo Tenant",
    charter: {
      sponsor: "Chief Operating Officer",
      stakeholders: "Data governance, analytics, IT",
      success_metrics: "One trusted definition per reported measure",
      value_range: "Directional, to be validated in P4",
      scope: "In: governed data foundation. Out: downstream reporting rebuild.",
    },
    baseline_metrics: [],
  } as unknown as MoveBusinessCaseInput;
}

function promptsFor(deliverableType: string) {
  const { request } = buildMoveDeliverableRequest(move(), {
    deliverableType,
    phaseOrStage: "P4_business_case",
    artifactStandard: `moves.${deliverableType}`,
    decisionContext: "Prepare the next governed phase.",
  });
  const brief = getArtifactBrief(request);
  const shared = {
    req: request,
    brief,
    evidence: request.governedEvidenceBundle,
  };
  return {
    request,
    brief,
    fullDraft: buildPassPrompt("full_draft", {
      ...shared,
      approvedPlanJson: "{}",
    }).user,
    redTeam: buildPassPrompt("red_team", {
      ...shared,
      draftMarkdown: "draft",
    }).user,
    rewrite: buildPassPrompt("board_grade_rewrite", {
      ...shared,
      draftMarkdown: "draft",
      critiqueText: "critique",
    }).user,
    render: buildPassPrompt("render_package", {
      ...shared,
      revisedDraftMarkdown: "draft",
    }).user,
    synthesis: buildPassPrompt("synthesis", { ...shared, sectionDrafts: [] })
      .user,
    // The per-section pass is built once per planned section, so it takes the
    // brief's own first section rather than a key invented here.
    sectionDraft: buildPassPrompt("section_draft", {
      ...shared,
      section: {
        key: brief.recommendedStructure[0]?.key ?? "section_1",
        title: brief.recommendedStructure[0]?.title ?? "Section 1",
        rationale: "Carry forward what is settled.",
        groundingMode: "mixed",
        evidenceCitations: [],
        assumptionsUsed: [],
        placeholders: [],
      },
      outlineSummary: "1. Section",
    }).user,
  };
}

describe("the working-guide generation path is selected by declaration", () => {
  it("splits every generatable deliverable into the two paths, by name", () => {
    const keys = everyGeneratableKey();
    const guides = keys.filter((key) => isWorkingSessionGuide(signalFor(key)));
    const boardGrade = keys.filter(
      (key) => !isWorkingSessionGuide(signalFor(key)),
    );
    // Listing them, not counting: a new deliverable must land on a named side.
    expect(guides).toEqual(WORKING_SESSION_GUIDES);
    expect(boardGrade).toEqual(BOARD_GRADE_DELIVERABLES);
  });

  it("keeps every listed key a real deliverable with a resolvable profile", () => {
    for (const key of [
      ...WORKING_SESSION_GUIDES,
      ...BOARD_GRADE_DELIVERABLES,
    ]) {
      const profileKey = deliverableKeyForOrchestratorType(
        orchestratorDeliverableType(key),
      );
      expect(profileKey).toBeDefined();
      expect(DELIVERABLE_PROFILES[profileKey!]).toBeDefined();
    }
  });

  it("needs all three declared flags to be false, not any one of them", () => {
    const base = {
      module: "moves",
      deliverableType: "planning_workshop_guide",
      qualityBar: {
        requiresRecommendation: false,
        requiresDecisionSection: false,
        requiresRiskTable: false,
      },
    };
    expect(isWorkingSessionGuide(base)).toBe(true);
    for (const flag of [
      "requiresRecommendation",
      "requiresDecisionSection",
      "requiresRiskTable",
    ] as const) {
      expect(
        isWorkingSessionGuide({
          ...base,
          qualityBar: { ...base.qualityBar, [flag]: true },
        }),
      ).toBe(false);
    }
  });

  it("is fenced to the moves module", () => {
    expect(
      isWorkingSessionGuide({
        module: "source",
        deliverableType: "planning_workshop_guide",
        qualityBar: {
          requiresRecommendation: false,
          requiresDecisionSection: false,
          requiresRiskTable: false,
        },
      }),
    ).toBe(false);
  });

  it("serves every working guide a five-section fixed structure, which the prompt states as a number", () => {
    for (const key of WORKING_SESSION_GUIDES) {
      const { brief } = promptsFor(orchestratorDeliverableType(key));
      expect(brief.recommendedStructure).toHaveLength(5);
      expect(brief.fixedStructure).toBe(true);
    }
  });
});

describe("each guide's purpose rules come from its own profile", () => {
  it("states the guide's declared purpose and acceptance checks", () => {
    const signal = signalFor("planning_workshop_guide");
    expect(workingSessionGuidePurpose(signal)).toContain(
      "roadmap, business-case, finance, metrics, readiness, and change sessions",
    );
    expect(workingSessionGuideAcceptanceChecks(signal)).toContain(
      "does not make new sponsor, funding, design, or execution decisions",
    );
    const rules = workingSessionGuidePurposeRules(signal).join("\n");
    expect(rules).toContain("Purpose of this guide:");
    expect(rules).toContain("accepted only if every one of these holds:");
    expect(rules).toContain(
      "does not make new sponsor, funding, design, or execution decisions",
    );
  });

  it("gives each guide its OWN purpose, not one shared sentence", () => {
    const purposes = WORKING_SESSION_GUIDES.map((key) =>
      workingSessionGuidePurpose(signalFor(key)),
    );
    expect(purposes.every((p) => typeof p === "string" && p.length > 0)).toBe(
      true,
    );
    expect(new Set(purposes).size).toBe(WORKING_SESSION_GUIDES.length);
  });

  it("states nothing for a board-grade deliverable", () => {
    const signal = signalFor("business_case");
    expect(workingSessionGuidePurpose(signal)).toBeNull();
    expect(workingSessionGuideAcceptanceChecks(signal)).toEqual([]);
    expect(workingSessionGuidePurposeRules(signal)).toEqual([]);
  });
});

describe("the later-phase guides no longer take the board-grade prompt path", () => {
  for (const key of [
    "planning_workshop_guide",
    "mobilization_workshop_guide",
    "execution_kickoff_guide",
  ]) {
    it(`drafts, reviews, rewrites and renders ${key} as a working guide`, () => {
      const p = promptsFor(key);

      // full draft
      expect(p.fullDraft).toContain(
        "Write Markdown with exactly the required guide sections",
      );
      expect(p.fullDraft).not.toContain("clear recommendation with next steps");
      expect(p.fullDraft).not.toContain("risk/issues/dependencies table");
      expect(p.fullDraft).toContain("WORKING-GUIDE LENGTH AND PURPOSE RULES:");
      expect(p.fullDraft).toContain("Purpose of this guide:");
      expect(p.fullDraft).toContain(
        "does not make new sponsor, funding, design, or execution decisions",
      );
      expect(p.fullDraft).not.toContain("crisp sponsor decision memo");
      expect(p.fullDraft).toContain(
        "EXPECTED EXHIBITS:\n  (none; use only the required guide sections)",
      );
      expect(p.fullDraft).toContain("EXPECTED TABLES: only the compact tables");

      // red team
      expect(p.redTeam).toContain(
        "a senior engagement lead reviewing a client workshop guide",
      );
      expect(p.redTeam).toContain("Do not request a generic risk register");
      expect(p.redTeam).not.toContain("too short for a board-grade artifact");
      expect(p.redTeam).not.toContain("skeptical senior McKinsey partner");

      // rewrite
      expect(p.rewrite).toContain("client-ready facilitation-guide quality");
      expect(p.rewrite).not.toContain("Strengthen synthesis, implications");

      // render package
      expect(p.render).toContain(
        "Convert the final client workshop guide into the structured render package",
      );
      expect(p.render).not.toContain(
        "Preserve all content, citations [n], placeholders",
      );

      // per-section draft
      expect(p.sectionDraft).toContain(
        "Write client-ready facilitation-guide Markdown",
      );
      expect(p.sectionDraft).not.toContain(
        "Write board-grade, senior-consulting Markdown",
      );

      // synthesis already read the declaration; it must still agree
      expect(p.synthesis).toContain("not a decision ask");
      expect(p.synthesis).toContain("concise session handoffs");
    });
  }

  it("leaves a board-grade deliverable on the board-grade path", () => {
    const p = promptsFor("business_case");
    expect(p.fullDraft).toContain("clear recommendation with next steps");
    expect(p.fullDraft).not.toContain(
      "WORKING-GUIDE LENGTH AND PURPOSE RULES:",
    );
    expect(p.redTeam).toContain("skeptical senior McKinsey partner");
    expect(p.rewrite).toContain("Strengthen synthesis, implications");
    expect(p.synthesis).not.toContain("not a decision ask");
    expect(p.sectionDraft).toContain(
      "Write board-grade, senior-consulting Markdown",
    );
  });

  it("keeps the design guide on the path it already had", () => {
    const p = promptsFor("design_workshop_guide");
    expect(p.fullDraft).toContain("Use exactly the five required sections");
    expect(p.fullDraft).toContain("at or below 3,000 words");
    expect(p.fullDraft).not.toContain("clear recommendation with next steps");
    expect(p.redTeam).toContain("Do not request a generic risk register");
  });
});
