import {
  visualContractFor,
  checkVisualArtifactContract,
  VISUAL_ARTIFACT_STANDARD,
} from "../visual-artifact-contract";
import { buildArtifactPrompt } from "../solution-prompt-factory";
import {
  emptySolutionContext,
  applyPhaseDigest,
  type SolutionContext,
} from "@/lib/programs/solution-context";
import {
  modelTokenBudgetForArtifact,
  STRATEGIC_MOVES_DRAFT_CAVEAT,
} from "../strategic-moves-artifact-standard";

describe("VisualArtifactContract — richness as a contract", () => {
  it("the architecture artifact requires conceptual/logical/physical + pattern visuals", () => {
    const c = visualContractFor("target_state_architecture")!;
    expect(c.requiredVisuals.join(" ")).toMatch(/conceptual/);
    expect(c.requiredVisuals.join(" ")).toMatch(/logical/);
    expect(c.requiredVisuals.join(" ")).toMatch(/physical/);
    expect(c.requiredVisuals.join(" ")).toMatch(/native/);
  });

  it("current-state/gap requires current-state diagram + data flow + gap matrix", () => {
    const c = visualContractFor("discovery_report")!;
    expect(c.requiredVisuals.join(" ")).toMatch(/current-state/);
    expect(c.requiredVisuals.join(" ")).toMatch(/data-flow/);
    expect(c.requiredTables.join(" ")).toMatch(/gap matrix/);
  });

  it("FAILS when required visuals/tables are missing (prose-only)", () => {
    const r = checkVisualArtifactContract("target_state_architecture", {
      visuals: ["conceptual architecture diagram"],
      tables: [],
    });
    expect(r.pass).toBe(false);
    expect(r.missingVisuals.length).toBeGreaterThan(0);
  });

  it("PASSES when the required exhibits are present", () => {
    const r = checkVisualArtifactContract("solution_approach_options", {
      visuals: ["approach arc / increments"],
      tables: ["solution-options matrix", "tradeoff table", "recommendation scorecard"],
    });
    expect(r.pass).toBe(true);
  });
});

function richContext(): SolutionContext {
  let ctx = emptySolutionContext("m1", "skyharbor");
  ctx = applyPhaseDigest(ctx, {
    useCase: "unify clinical + claims to drive VBC",
    kpis: [{ name: "30-day readmissions", baseline: "15.8%", target: "13%", domain: "clinical" }],
    currentState: "Epic Clarity/Caboodle on SQL Server, Tableau",
    gaps: ["no unified member spine", "no ML path"],
    chosenOption: "Option C — Databricks Lakehouse",
  });
  return ctx;
}

describe("solution-prompt-factory — simple prompt, rich context", () => {
  it("binds the real SolutionContext into the prompt (no DATA GAP stubs)", () => {
    const p = buildArtifactPrompt({ artifact: "target_state_architecture", phase: 3, context: richContext() });
    expect(p.outputFormat).toBe("html");
    expect(p.user).toContain("unify clinical + claims");
    expect(p.user).toContain("Epic Clarity/Caboodle on SQL Server");
    expect(p.user).toContain("30-day readmissions");
    expect(p.user).toContain(VISUAL_ARTIFACT_STANDARD.slice(0, 30));
    expect(p.system).toMatch(/visual-first/i);
  });

  it("architecture prompt uses the approved chosenOption", () => {
    const p = buildArtifactPrompt({ artifact: "target_state_architecture", phase: 3, context: richContext() });
    expect(p.user).toContain("Option C — Databricks Lakehouse");
    expect(p.user).toMatch(/Do NOT choose the solution approach here/);
  });

  it("architecture prompt STOPS when no option has been approved", () => {
    const ctx = emptySolutionContext("m1", "t");
    const p = buildArtifactPrompt({ artifact: "target_state_architecture", phase: 3, context: ctx });
    expect(p.user).toMatch(/STOP and request P3a approval/);
  });

  it("marks missing required context as a blocking input, not invented", () => {
    const ctx = emptySolutionContext("m1", "t");
    const p = buildArtifactPrompt({ artifact: "discovery_report", phase: 2, context: ctx });
    expect(p.user).toMatch(/\[MISSING/);
    expect(p.user).toMatch(/Do not invent facts/);
  });

  it("P1 charter prompt carries the premium charter assignment and target depth", () => {
    const p = buildArtifactPrompt({
      artifact: "charter",
      phase: 1,
      context: richContext(),
    });
    expect(p.user).toContain("STRATEGIC MOVES PREMIUM ARTIFACT BRIEF");
    expect(p.user).toContain("PHASE-SPECIFIC ASSIGNMENT — P1 MOVE CHARTER");
    expect(p.user).toContain("Scope In / Out / Adjacent table");
    expect(p.user).toContain("Stakeholder and Decision Rights table");
    expect(p.user).toContain("Target depth: 2,000-3,500 words");
  });

  it("P2 diagnostic prompt requires handoffs, evidence matrix, and process-vs-AI analysis", () => {
    const p = buildArtifactPrompt({
      artifact: "discovery_report",
      phase: 2,
      context: richContext(),
    });
    expect(p.user).toContain("PHASE-SPECIFIC ASSIGNMENT — P2 CURRENT WORK DIAGNOSTIC");
    expect(p.user).toContain("Current-State Handoff Map");
    expect(p.user).toContain("Evidence Coverage table");
    expect(p.user).toContain("Process vs Data vs Policy vs Ownership vs AI Matrix");
  });

  it("P2 diagnostic prompt foregrounds metricsThatMatter and evidence taxonomy when available", () => {
    const ctx = applyPhaseDigest(richContext(), {
      metricsThatMatter: [
        {
          label: "Monthly invoice exceptions",
          value: "1,872",
          source: "LSH_AP_Exception_Category_Report_Q2_2026.csv",
        },
        {
          label: "Manual touch hours per month",
          value: "2,345",
          source: "LSH_AP_Value_Baseline_Worksheet.xlsx",
          caveat: "Finance validation required before funding approval",
        },
      ],
      evidenceTaxonomy: [
        {
          category: "Missing PO",
          volume: "420",
          riskLevel: "Medium",
          owner: "Accounts Payable",
        },
      ],
      clientActionableMissingInputs: [
        {
          needed: "AP/procurement systems landscape",
          whyItMatters: "Confirms systems of record.",
          owner: "Enterprise Architecture",
          howItWillBeUsed: "P3 target architecture",
          gateImpact: "Blocks final P3 architecture",
        },
      ],
    });
    const p = buildArtifactPrompt({
      artifact: "discovery_report",
      phase: 2,
      context: ctx,
    });
    expect(p.user).toContain("Metrics that must be foregrounded when available");
    expect(p.user).toContain("Client-facing move reference:");
    expect(p.user).toContain("Internal move id, audit only, do NOT display in the client-facing artifact body");
    expect(p.user).toContain("Monthly invoice exceptions: 1,872");
    expect(p.user).toContain("Manual touch hours per month: 2,345");
    expect(p.user).toContain("Finance validation required before funding approval");
    expect(p.user).toContain("Missing PO | volume=420 | risk=Medium | owner=Accounts Payable");
    expect(p.user).toContain("Needed: AP/procurement systems landscape");
    expect(p.user).toMatch(/If the evidence packet contains exact metrics/);
  });

  it("draft prompt uses the standard pre-gate caveat", () => {
    const p = buildArtifactPrompt({
      artifact: "charter",
      phase: 1,
      context: richContext(),
      generationMode: "draft",
    });
    expect(p.user).toContain(STRATEGIC_MOVES_DRAFT_CAVEAT);
  });

  it("uses artifact-specific model token budgets", () => {
    expect(modelTokenBudgetForArtifact("discovery_report")).toBeGreaterThan(
      modelTokenBudgetForArtifact("charter"),
    );
    expect(modelTokenBudgetForArtifact("charter")).toBeGreaterThan(20000);
  });
});
