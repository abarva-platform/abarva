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
});
