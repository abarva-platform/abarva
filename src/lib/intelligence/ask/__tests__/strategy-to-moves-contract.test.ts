import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  applyCxoAnswerModeFallbacks,
  CXO_ANSWER_MODE_REGISTRY,
  MOVES_EXECUTION_PHASE_LABELS,
} from "../answer-mode-registry";

describe("strategy-to-AbarVa solution synthesis contract", () => {
  const synthesizerCode = readFileSync(
    join(__dirname, "..", "synthesizer.ts"),
    "utf8",
  );
  const registryCode = readFileSync(
    join(__dirname, "..", "answer-mode-registry.ts"),
    "utf8",
  );

  it("injects the strategy-to-AbarVa solution contract into the active synthesis path", () => {
    expect(synthesizerCode).toContain(
      "classifyAbarvaAnswerMode(args.query)",
    );
    expect(registryCode).toContain(
      "STRATEGY_TO_ABARVA_SOLUTION_CONTRACT",
    );
    expect(registryCode).toContain(
      "STRATEGY_TO_MOVES_EXECUTION_CONTRACT",
    );
    expect(registryCode).toContain("strategy_to_abarva_solution");
    expect(registryCode).toContain("ACTIVE ANSWER MODE:");
    expect(registryCode).toContain("strategy_to_moves_execution");
    expect(registryCode).toContain("How AbarVa would solve this");
    expect(registryCode).toContain("Home for current-state evidence");
    expect(registryCode).toContain("Source for vendor/commercial levers");
    expect(registryCode).toContain("compact Moves phase table");
    expect(registryCode).toContain("ensureMovesExecutionPhaseTable");
    expect(registryCode).toContain("| Phase | What AbarVa does | Proposed output |");
    expect(registryCode).toContain("P0 Originate");
    expect(registryCode).toContain("P5 Prepare to Execute");
    expect(registryCode).toContain("Tower Track Outcomes");
    expect(synthesizerCode).toContain("buildCxoAnswerModeSystemAddendum(answerMode)");
    expect(synthesizerCode).toContain("buildCxoAnswerModePromptDirective(answerMode)");
    expect(synthesizerCode).toContain("applyCxoAnswerModeFallbacks(text, answerMode)");
  });

  it("keeps critical CXO answer modes in one registry", () => {
    expect(CXO_ANSWER_MODE_REGISTRY.strategy_to_moves_execution).toMatchObject({
      active: true,
      exportRequired: true,
      requiredArtifacts: ["phase_table", "tower_outcomes", "surface_plan"],
    });
    expect(CXO_ANSWER_MODE_REGISTRY.industry_trend_to_ai_bets).toMatchObject({
      active: false,
      exportRequired: true,
      requiredArtifacts: ["trend_table", "priority_matrix"],
    });
    expect(CXO_ANSWER_MODE_REGISTRY.board_ai_governance_plan).toMatchObject({
      active: false,
      exportRequired: true,
    });
  });

  it("deterministically appends the Moves P0-P5 phase table when Claude omits it", () => {
    const answer = applyCxoAnswerModeFallbacks(
      "**Lakeshore Holdings should run this as a Moves sprint.**",
      "strategy_to_moves_execution",
    );

    expect(answer).toContain("| Phase | What AbarVa does | Proposed output |");
    for (const label of MOVES_EXECUTION_PHASE_LABELS) {
      expect(answer).toContain(label);
    }
  });
});
