import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  applyCxoAnswerModeFallbacks,
  CXO_ANSWER_MODE_REGISTRY,
  ensureAbarvaSolutionBrief,
  ensureAbarvaSurfacePlan,
  MOVES_EXECUTION_PHASE_LABELS,
} from "../answer-mode-registry";
import { classifyAbarvaAnswerMode } from "../response-policy";

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
    expect(synthesizerCode).toContain("classifyAbarvaAnswerMode(args.query)");
    expect(registryCode).toContain("STRATEGY_TO_ABARVA_SOLUTION_CONTRACT");
    expect(registryCode).toContain("STRATEGY_TO_MOVES_EXECUTION_CONTRACT");
    expect(registryCode).toContain("strategy_to_abarva_solution");
    expect(registryCode).toContain("ACTIVE ANSWER MODE:");
    expect(registryCode).toContain("strategy_to_moves_execution");
    expect(registryCode).toContain("How AbarVa would solve this");
    expect(registryCode).toContain("Home for current-state evidence");
    expect(registryCode).toContain("Source for vendor/commercial levers");
    expect(registryCode).toContain("compact Moves phase plan");
    expect(registryCode).toContain("ensureMovesExecutionPhaseTable");
    expect(registryCode).toContain("P0 Originate");
    expect(registryCode).toContain("P5 Approval & Mobilization");
    expect(registryCode).toContain("Tower Track Outcomes");
    expect(synthesizerCode).toContain(
      "buildCxoAnswerModeSystemAddendum(answerMode)",
    );
    expect(synthesizerCode).toContain(
      "buildCxoAnswerModePromptDirective(answerMode)",
    );
    expect(synthesizerCode).toContain(
      "applyCxoAnswerModeFallbacks(text, answerMode)",
    );
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
    expect(routeCode).toContain(
      'classifyAbarvaAnswerMode(context?.query ?? "")',
    );
  });

  it("keeps critical CXO answer modes in one registry", () => {
    expect(CXO_ANSWER_MODE_REGISTRY.strategy_to_moves_execution).toMatchObject({
      active: true,
      exportRequired: true,
      requiredArtifacts: ["phase_table", "tower_outcomes", "surface_plan"],
    });
    expect(CXO_ANSWER_MODE_REGISTRY.industry_trend_to_ai_bets).toMatchObject({
      active: true,
      exportRequired: true,
      requiredArtifacts: ["trend_table", "priority_matrix"],
    });
    expect(
      CXO_ANSWER_MODE_REGISTRY.industry_trend_to_ai_bets.promptDirective,
    ).toContain("Client Grounding Packet first");
    expect(CXO_ANSWER_MODE_REGISTRY.board_ai_governance_plan).toMatchObject({
      active: false,
      exportRequired: true,
    });
  });

  it("classifies what-should-we-do-with asks as AbarVa solution mode", () => {
    expect(
      classifyAbarvaAnswerMode(
        "What should we do with member service agent assist?",
      ),
    ).toBe("strategy_to_abarva_solution");
    expect(
      classifyAbarvaAnswerMode("What would AbarVa do next for this AI bet?"),
    ).toBe("strategy_to_abarva_solution");
  });

  it("adds the AbarVa surface path when strategy mode omits it", () => {
    const answer = ensureAbarvaSurfacePlan(
      "Healthcare Demo should run a 45-day evidence sprint before deployment.",
    );

    expect(answer).toContain("How AbarVa would run it");
    expect(answer).toContain("Intelligence frames");
    expect(answer).toContain("Home validates");
    expect(answer).toContain("Moves turns");
    expect(answer).toContain("Source checks");
    expect(answer).toContain("Tower tracks");
  });

  it("compacts strategy-to-AbarVa solution answers into the Pyramid Brief", () => {
    const answer = ensureAbarvaSolutionBrief(
      [
        "Healthcare Demo should not scale member service agent assist as a generic AI pilot; it should use it as the proof point for a broader service-operations modernization decision.",
        "The current-state evidence matters because the contact-center stack, data readiness, workflow ownership, and member-service priorities decide whether this is a safe production bet or just a chatbot demo.",
        "Industry adoption patterns support the bet, but the tenant context still needs evidence on system integration, call reasons, escalation workflow, knowledge-base ownership, and benefit tracking.",
        "AbarVa should frame the executive bet, validate the operating context, turn the work into execution gates, pressure-test vendor dependencies, and track value after launch.",
        "This fourth paragraph should not survive as a separate mini-deck section because normal answers need to stay brief.",
      ].join("\n\n"),
    );

    expect(answer).toMatch(/^\*\*Answer:\*\*/);
    expect(answer).toContain("**Proof:**");
    expect(answer).toContain("**Move:**");
    expect(answer.split(/\n{2,}/)).toHaveLength(3);
    expect(answer).toContain("Intelligence");
    expect(answer).toContain("Home");
    expect(answer).toContain("Moves");
    expect(answer).toContain("Source");
    expect(answer).toContain("Tower");
    expect(answer).not.toContain("This fourth paragraph should not survive");
  });

  it("strips nested model labels from compact strategy briefs", () => {
    const answer = ensureAbarvaSolutionBrief(
      [
        "Answer: Proof. The loaded enterprise context shows the contact center function owns first-call resolution, average handle time, and intent detection.",
        "Healthcare Demo — pursue member service agent assist as a conditional advance, not a full commitment.",
        "Move: Move. Home should validate the four gap items as a structured evidence checklist against current systems.",
      ].join("\n\n"),
    );

    expect(answer).toContain(
      "**Answer:** Healthcare Demo — pursue member service agent assist",
    );
    expect(answer).toContain("**Proof:** The loaded enterprise context");
    expect(answer).toContain("**Move:** Home should validate");
    expect(answer).not.toContain("Answer: Proof");
    expect(answer).not.toContain("Move: Move");
  });

  it("strips nested model labels even when the answer is already short", () => {
    const answer = ensureAbarvaSolutionBrief(
      [
        "Answer: Healthcare Demo should proceed conditionally.",
        "Proof: Proof. The loaded evidence supports the KPI logic but not production readiness.",
        "Move: Move. Home should validate the evidence gaps before Moves opens execution planning. Intelligence, Home, Moves, Source, and Tower each have a role.",
      ].join("\n\n"),
    );

    expect(answer).toContain("Answer: Healthcare Demo should proceed");
    expect(answer).toContain("Proof: The loaded evidence supports");
    expect(answer).toContain("Move: Home should validate");
    expect(answer).not.toContain("Proof: Proof");
    expect(answer).not.toContain("Move: Move");
  });

  it("deterministically appends the Moves P0-P5 phase plan when Claude omits it", () => {
    const answer = applyCxoAnswerModeFallbacks(
      "**Lakeshore Holdings should run this as a Moves sprint.**",
      "strategy_to_moves_execution",
    );

    expect(answer).toContain("**Moves phase plan**");
    expect(answer).not.toContain("|---|");
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
        "| P2 Discover & Diagnose | Ground the evidence. |",
        "| P3 Design Future State | Pick the path. |",
        "| P5 Approval & Mobilization | Confirm readiness. |",
        "| Tower Track Outcomes | Track value. |",
      ].join("\n"),
      "strategy_to_moves_execution",
    );

    expect(answer).toContain("**Moves phase contract completion**");
    expect(answer).toContain("P4 Roadmap & Business Case");
    expect(
      answer.match(/\| Phase \| What AbarVa does \| Proposed output \|/g),
    ).toBeNull();
  });

  it("recognizes plain phase tables and does not append a duplicate generic table", () => {
    const answer = applyCxoAnswerModeFallbacks(
      [
        "Moves Phase\tHITL Checkpoint\tDrift Threshold",
        "P0 Originate\tFrame the bet.\tNo model yet.",
        "P1 Charter\tSign the charter.\tDefine MAPE.",
        "P2 Discover & Diagnose\tGround the evidence.\tBacktest drift.",
        "P3 Design Future State\tPick the path.\tReview options.",
        "P4 Roadmap & Business Case\tBuild milestones.\tSet gates.",
        "P5 Approval & Mobilization\tConfirm readiness.\tRun cutover.",
        "Tower Track Outcomes\tTrack value.\tReport drift.",
      ].join("\n"),
      "strategy_to_moves_execution",
    );

    expect(answer).toContain("Moves Phase\tHITL Checkpoint\tDrift Threshold");
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
    expect(answer).toContain("**Moves phase plan**");
    expect(answer).not.toContain("|---|");
    expect(answer).toContain("P0 Originate");
    expect(answer).toContain("Tower Track Outcomes");
  });
});
