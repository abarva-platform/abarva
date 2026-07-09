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
  const askIndexCode = readFileSync(join(__dirname, "..", "index.ts"), "utf8");
  const routeCode = readFileSync(
    join(
      __dirname,
      "..",
      "..",
      "..",
      "..",
      "app",
      "api",
      "intelligence",
      "ask",
      "route.ts",
    ),
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
    expect(synthesizerCode).toContain(
      "const finalText = applyCxoAnswerModeFallbacks(cleanedText, answerMode)",
    );
    expect(synthesizerCode).toContain("yield deterministicRemainder");
    expect(synthesizerCode).toContain(
      "applyCxoAnswerModeFallbacks(\n      enforceDecisionGradeAnswer(evidenceDisciplined),\n      answerMode,\n    )",
    );
    expect(askIndexCode).toContain("applyCxoAnswerModeFallbacks(");
    expect(askIndexCode).toContain("classifyAbarvaAnswerMode(trimmed)");
    expect(routeCode).toContain("applyCxoAnswerModeFallbacks(");
    expect(routeCode).toContain("classifyAbarvaAnswerMode(context?.query ?? \"\")");
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

  it("does not append a duplicate generic table when an existing phase table only misses one phase", () => {
    const answer = applyCxoAnswerModeFallbacks(
      [
        "| Phase | Checkpoint |",
        "|---|---|",
        "| P0 Originate | Frame the bet. |",
        "| P1 Charter | Sign the charter. |",
        "| P2 Understand Current State | Ground the evidence. |",
        "| P3 Choose the Approach | Pick the path. |",
        "| P5 Prepare to Execute | Confirm readiness. |",
        "| Tower Track Outcomes | Track value. |",
      ].join("\n"),
      "strategy_to_moves_execution",
    );

    expect(answer).toContain("**Moves phase contract completion**");
    expect(answer).toContain("P4 Build the Plan");
    expect(
      answer.match(/\| Phase \| What AbarVa does \| Proposed output \|/g),
    ).toBeNull();
  });

  it("keeps safe-blocked answers useful by appending the governed phase contract", () => {
    const answer = applyCxoAnswerModeFallbacks(
      "I can't safely answer that from the currently loaded evidence.",
      "strategy_to_moves_execution",
    );

    expect(answer).toContain("I can't safely answer");
    expect(answer).toContain("| Phase | What AbarVa does | Proposed output |");
    expect(answer).toContain("P0 Originate");
    expect(answer).toContain("Tower Track Outcomes");
  });
});
