/**
 * Item T-495 · one suite of the claimable half.
 *
 * This suite's first case used to read `synthesizer.ts`, `answer-mode-registry.ts`,
 * `ask/index.ts` and the Ask route as TEXT and assert 24 substrings of them. It
 * was red, and for nothing behavioural: it required the literal
 * `const finalText = applyCxoAnswerModeFallbacks(cleanedText, answerMode)`, and
 * that call is still made — at `synthesizer.ts:825`, written as a ternary arm.
 * A byte assertion on a statement's formatting fails when the statement is
 * reformatted and passes when the whole feature is deleted but the words stay,
 * so it answered the wrong question in both directions.
 *
 * T-495's acceptance says to delete such an assertion rather than sharpen its
 * pattern — a tighter pattern is the same defect with a longer fuse — and to
 * assert what the module does instead. So the cases below drive the real
 * `synthesizeStream`.
 *
 * WHAT IS MOCKED AND WHAT IS NOT. Only the audited Anthropic client is mocked;
 * it is I/O. `classifyAbarvaAnswerMode`, `buildCxoAnswerModeSystemAddendum`,
 * `buildCxoAnswerModePromptDirective` and `applyCxoAnswerModeFallbacks` all run
 * for real — they are the subject. The expected strings are produced by calling
 * those same functions rather than being copied into this file, so the cases
 * cover whatever the registry says today and cannot drift from it.
 *
 * WHY A GENERAL-MODE CASE IS HERE. Every positive case below would also pass if
 * the synthesizer injected the contract unconditionally, which would defeat the
 * classification entirely. The general-mode case is the one that fails in that
 * direction: the contract must be absent when the query does not ask for it.
 *
 * WHAT THIS SUITE NO LONGER CLAIMS. The deleted case also asserted that
 * `ask/index.ts` and `src/app/api/intelligence/ask/route.ts` contain
 * `applyCxoAnswerModeFallbacks(` and `classifyAbarvaAnswerMode(...)`. Those were
 * byte assertions over two other modules and proved only that the words were
 * present; both would have survived the feature being unwired. They are not
 * replaced here, because driving either module means standing up retrieval and a
 * Next.js route, which is a larger unit than this suite. The residual is
 * recorded on T-495 rather than left implied.
 */

import type { CxoAnswerModeContract } from "../answer-mode-registry";
import {
  applyCxoAnswerModeFallbacks,
  buildCxoAnswerModePromptDirective,
  buildCxoAnswerModeSystemAddendum,
  CXO_ANSWER_MODE_REGISTRY,
  ensureAbarvaSolutionBrief,
  ensureAbarvaSurfacePlan,
  MOVES_EXECUTION_PHASE_LABELS,
} from "../answer-mode-registry";
import { classifyAbarvaAnswerMode } from "../response-policy";
import { cleanIntelligenceModelInputText } from "@/lib/intelligence/model-input-cleaner";

const getAuditedAnthropicClient = jest.fn();

jest.mock("@/lib/agent/stream", () => ({
  getAuditedAnthropicClient: (...args: unknown[]) =>
    getAuditedAnthropicClient(...args),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { synthesizeStream } = require("../synthesizer") as {
  synthesizeStream: (args: Record<string, unknown>) => AsyncGenerator<string>;
};

/** One tenant-shaped source, so retrieval is not the variable under test. */
const SOURCES = [
  {
    type: "TENANT" as const,
    name: "Contact centre operating record",
    id: null,
    detail:
      "The member service function owns first-call resolution and average handle time; the vendor contract renews next year.",
    confidence: 0.8,
  },
];

/**
 * Drives the real `synthesizeStream` over a stubbed model stream and returns
 * both halves of the contract: what was sent to the model, and what the
 * generator yielded to the caller.
 */
async function runSynthesis(args: {
  query: string;
  modelText: string;
}): Promise<{ system: string; user: string; emitted: string }> {
  const captured: { system: string; user: string } = { system: "", user: "" };
  getAuditedAnthropicClient.mockReset();
  getAuditedAnthropicClient.mockResolvedValue({
    auditId: "audit-t495",
    client: {
      messages: {
        create: async () => ({
          async *[Symbol.asyncIterator]() {
            yield {
              type: "content_block_delta",
              delta: { type: "text_delta", text: args.modelText },
            };
          },
        }),
      },
    },
  });

  const chunks: string[] = [];
  for await (const chunk of synthesizeStream({
    query: args.query,
    sources: SOURCES,
    intent: "topic_synthesis",
    tenantId: "tenant-t495",
    tenantClientKey: "skyharbor-air",
    answerOnlyStreaming: true,
    richText: false,
    onModelInput: (parts: { system: string; user: string }) => {
      captured.system = parts.system;
      captured.user = parts.user;
    },
  })) {
    chunks.push(chunk);
  }

  return { ...captured, emitted: chunks.join("") };
}

/**
 * A query the classifier puts in `strategy_to_moves_execution`, asserted rather
 * than assumed in the cases below — if the classifier stops agreeing, the case
 * says so instead of silently testing `general`.
 */
const MOVES_EXECUTION_QUERY =
  "How would we execute this as a Moves program with phase gates?";
const GENERAL_QUERY = "Who is our largest telecoms vendor?";

/**
 * The registry read through the interface it is declared against. The object
 * literal is not annotated, so TypeScript narrows each entry to the fields that
 * entry happens to carry and `systemContract` is absent from the union. This is
 * an annotation, not a cast: every entry is assignable to the declared shape.
 */
const REGISTRY: Record<string, Partial<CxoAnswerModeContract>> =
  CXO_ANSWER_MODE_REGISTRY;

describe("strategy-to-AbarVa solution synthesis contract", () => {
  const ORIGINAL_API_KEY = process.env.ANTHROPIC_API_KEY;

  beforeAll(() => {
    // The synthesizer refuses without a key before it reaches any of the
    // behaviour below. No request is made — the client is mocked.
    process.env.ANTHROPIC_API_KEY = "test-key-t495";
  });

  afterAll(() => {
    if (ORIGINAL_API_KEY === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = ORIGINAL_API_KEY;
  });

  it("sends the classified answer mode's system contract and prompt directive to the model", async () => {
    expect(classifyAbarvaAnswerMode(MOVES_EXECUTION_QUERY)).toBe(
      "strategy_to_moves_execution",
    );

    const { system, user } = await runSynthesis({
      query: MOVES_EXECUTION_QUERY,
      modelText: "Run this as a Moves program.",
    });

    // Both are cleaned by the product before the model call, so the expected
    // text is put through the same cleaner rather than pattern-matched.
    expect(system).toContain(
      cleanIntelligenceModelInputText(
        buildCxoAnswerModeSystemAddendum("strategy_to_moves_execution"),
      ).trim(),
    );
    expect(user).toContain(
      cleanIntelligenceModelInputText(
        buildCxoAnswerModePromptDirective("strategy_to_moves_execution"),
      ).trim(),
    );
  });

  it("applies the mode's deterministic fallback to the model's text before the answer leaves the synthesizer", async () => {
    const modelText = "Run this as a Moves program.";

    const { emitted } = await runSynthesis({
      query: MOVES_EXECUTION_QUERY,
      modelText,
    });

    // The model omitted the phase plan; the synthesizer owes it deterministically.
    expect(modelText).not.toContain("Moves phase plan");
    expect(emitted).toBe(
      applyCxoAnswerModeFallbacks(modelText, "strategy_to_moves_execution"),
    );
    for (const label of MOVES_EXECUTION_PHASE_LABELS) {
      expect(emitted).toContain(label);
    }
  });

  it("leaves a general-mode answer alone, so the contract follows the classification rather than every query", async () => {
    expect(classifyAbarvaAnswerMode(GENERAL_QUERY)).toBe("general");

    const modelText = "Your largest telecoms commitment renews next year.";
    const { system, user, emitted } = await runSynthesis({
      query: GENERAL_QUERY,
      modelText,
    });

    // EVERY contract the registry declares, general included, read off the
    // registry entries rather than through the two builders. Two reasons, and
    // the first is a defect this case found:
    //
    //  - Leaving `general` out let a mutation that made the injection
    //    unconditional pass every case in this suite, because `general`
    //    declares a systemContract and a promptDirective of its own and no
    //    case looked for them.
    //  - `CXO_ANSWER_MODE_REGISTRY` holds 11 entries while `AbarvaAnswerMode`
    //    admits 5, so six keys cannot be passed to the builders at all. Those
    //    six are `active: false` placeholders that declare neither a
    //    systemContract nor a promptDirective, so the type is right and nothing
    //    is missing — but reading the declared fields covers all 11 without a
    //    cast, and asserts over whichever ones carry a contract today. The
    //    5 active modes are what make this loop non-vacuous; a placeholder
    //    contributes no assertion, by the emptiness checks below.
    for (const [mode, contract] of Object.entries(REGISTRY)) {
      const systemContract = cleanIntelligenceModelInputText(
        contract.systemContract ?? "",
      ).trim();
      const directive = cleanIntelligenceModelInputText(
        contract.promptDirective ?? "",
      ).trim();
      if (systemContract) {
        expect({ mode, injected: system.includes(systemContract) }).toEqual({
          mode,
          injected: false,
        });
      }
      if (directive) {
        expect({ mode, injected: user.includes(directive) }).toEqual({
          mode,
          injected: false,
        });
      }
    }
    expect(emitted).toBe(modelText);
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
