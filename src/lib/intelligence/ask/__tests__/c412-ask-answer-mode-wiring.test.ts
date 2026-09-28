/**
 * Item C-412 · the Ask module half.
 *
 * WHAT THIS REPLACES, AND WHY IT IS NOT THE SAME ASSERTION SHARPENED. Until
 * 2026-09-27 the only thing binding answer-mode classification and the
 * deterministic fallback to this module was a case that read `ask/index.ts` and
 * the Ask route as TEXT and required the substrings `applyCxoAnswerModeFallbacks(`
 * and `classifyAbarvaAnswerMode(...)` to appear in them. Item T-495 deleted it,
 * correctly: a substring match stays green when the call is present but unwired,
 * and goes red when the call is merely reformatted, so it answered the wrong
 * question in both directions. But T-495's replacement suite drives
 * `synthesizeStream` only, which left **neither** this module nor the route
 * carrying any assertion, of any kind, that the feature is still wired into the
 * path a reader's question actually travels. That gap is this suite's subject.
 *
 * WHAT IS MOCKED AND WHAT IS NOT. Retrieval is mocked at its own module
 * boundaries and the audited Anthropic client is mocked, because both are I/O.
 * `classifyAbarvaAnswerMode`, `buildCxoAnswerModeSystemAddendum`,
 * `buildCxoAnswerModePromptDirective`, `applyCxoAnswerModeFallbacks`, the
 * answer-mode registry, the synthesizer and `askIntelligence` itself all run for
 * real — they are the subject, and mocking any of them would reproduce the
 * defect being repaired. Expected strings are produced by calling the same
 * registry-backed builders rather than copied into this file, so the cases
 * cover whatever the registry declares today and cannot drift from it.
 *
 * WHY THE FALLBACK CASE ASKS FOR `richText: true`, WHICH IS NOT INCIDENTAL AND
 * WAS MEASURED RATHER THAN REASONED. All three of the synthesizer's own
 * `applyCxoAnswerModeFallbacks` calls are gated on `!args.richText`
 * (`synthesizer.ts` ~825, ~1350, ~1426), so on the rich-text path the call in
 * THIS module is the only one that runs and the second case below is
 * attributable to `ask/index.ts` and to nothing downstream of it.
 *
 * The same case written on the plain-text path would NOT detect that call being
 * deleted. Measured, with the call removed and `richText: false`: the phase-plan
 * heading and all seven phase labels still reach the caller, because the
 * synthesizer has already applied the fallback. A redundant applier survives
 * mutation and reads exactly like a covered one, so the plain-text path cannot
 * evidence this module's own wiring.
 *
 * The plain-text path is also the wrong place to assert the block's text at all,
 * for a second and separate reason: the shared shaper reformats it there —
 * Markdown emphasis and list markers are stripped and at least one line is
 * re-cut mid-sentence. That reshaping is filed work of its own and is neither
 * caused nor covered by this suite.
 *
 * WHY A GENERAL-MODE CASE IS HERE. Every positive case would also pass if the
 * contract were injected unconditionally, which would defeat the classification
 * entirely. The third case is the one that fails in that direction.
 *
 * NOT IN THIS CHANGE. `src/app/api/intelligence/ask/route.ts` is the second unit
 * and is explicitly out of scope: all three suites under its own `__tests__`
 * `jest.mock` the whole `@/lib/intelligence/ask` module, so the route still
 * carries no binding. That residual stays on C-412's successor rather than being
 * left implied.
 */

// The synthesizer refuses before any of the behaviour below when this is unset,
// and it reads `process.env` at call time. No request is made — the client is
// mocked. Set at module scope so it is in place before the first case runs.
process.env.ANTHROPIC_API_KEY = "test-key-c412";

jest.mock("server-only", () => ({}));

// Retrieval, mocked at the same boundaries the sibling module suite uses, so
// what retrieval returns is not the variable under test.
jest.mock("../retrievers/ecl-serving-context", () => ({
  isEclProjectionProvider: () => false,
  retrieveEclServingContextSources: async () => [],
}));
jest.mock("../retrievers/curated-dossier", () => ({
  retrieveCuratedDossierSources: async () => ({ sources: [] }),
}));
jest.mock("@/lib/knowledge/tenant-enterprise-context", () => ({
  retrieveTenantEnterpriseSources: async () => [],
  retrieveTenantStructuredFacts: async () => [],
}));
jest.mock("@/lib/knowledge/tenant-technology-context", () => ({
  retrieveTenantTechnologySources: async () => [],
}));
jest.mock("../retrievers/retail-overlay", () => ({
  retrieveRetailOverlaySources: async () => [],
}));
jest.mock("../router", () => ({
  route: async () => ({ sources: [] }),
}));
jest.mock("../retrievers/worldview", () => ({
  retrieveWorldview: async () => ({ sources: [] }),
}));
jest.mock("../tenant-fact-fingerprint", () => ({
  getTenantFactFingerprint: async () => ({}),
  formatTenantFactAvailabilityBlock: () => "",
}));
jest.mock("../canonical-landscape-source", () => ({
  buildCanonicalLandscapeSource: async () => null,
}));
jest.mock("../client-grounding-packet", () => ({
  buildClientGroundingPacketSource: () => null,
}));

const getAuditedAnthropicClient = jest.fn();
jest.mock("@/lib/agent/stream", () => ({
  getAuditedAnthropicClient: (...args: unknown[]) =>
    getAuditedAnthropicClient(...args),
}));

import type { CxoAnswerModeContract } from "../answer-mode-registry";
import {
  applyCxoAnswerModeFallbacks,
  buildCxoAnswerModePromptDirective,
  buildCxoAnswerModeSystemAddendum,
  CXO_ANSWER_MODE_REGISTRY,
  MOVES_EXECUTION_PHASE_LABELS,
} from "../answer-mode-registry";
import { classifyAbarvaAnswerMode } from "../response-policy";
import { cleanIntelligenceModelInputText } from "@/lib/intelligence/model-input-cleaner";
import { askIntelligence } from "../index";

/**
 * A query the classifier puts in `strategy_to_moves_execution`, asserted rather
 * than assumed in each case below — if the classifier stops agreeing, the case
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

/**
 * The LINES a mode's deterministic fallback ADDS to a given text, read off the
 * registry entry rather than copied into this file.
 *
 * Two reasons this is lines rather than one block, and both were measured on
 * this path rather than anticipated:
 *
 *  - The delivered answer is not `fallback(modelText)`, and asserting that it is
 *    would be wrong. `applyProductTruthRuntimeGuard` also runs in this module
 *    and appends a decision-boundary line of its own; that is a separate
 *    governance control and not this suite's subject. Asserting the fallback's
 *    own contribution keeps each case attributable to the fallback and
 *    indifferent to what else the path legitimately adds.
 *  - The block does not survive the path byte-for-byte. `chunkAskText` re-chunks
 *    the answer, which drops the blank line before the block and the two-space
 *    Markdown hard break after its heading. The words are the registry's
 *    contribution; that whitespace is not, and a case that failed on it would be
 *    the byte assertion this item exists to stop repeating.
 *
 * Returns `[]` when the entry declares no fallback, or declares one that leaves
 * this text alone — and every caller asserts it got something, so no case can
 * pass by having nothing to look for.
 */
function deterministicAdditionLines(
  contract: Partial<CxoAnswerModeContract>,
  text: string,
): string[] {
  const applied = contract.deterministicFallback?.(text);
  if (!applied || applied === text) return [];
  const added = applied.startsWith(text) ? applied.slice(text.length) : applied;
  return added
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

interface AskRun {
  /** Every `onModelInput` the turn produced, so "one model call" is checkable. */
  modelInputs: { system: string; user: string }[];
  /** The `delta` events joined — what the reader actually receives. */
  answer: string;
  /** Event types in order, so a refusal cannot be read as an answer. */
  eventTypes: string[];
}

/**
 * Drives the real `askIntelligence` over a stubbed model stream and returns both
 * halves of the contract: what was sent to the model, and what the generator
 * yielded to its caller.
 */
async function runAsk(args: {
  query: string;
  modelText: string;
}): Promise<AskRun> {
  getAuditedAnthropicClient.mockReset();
  getAuditedAnthropicClient.mockResolvedValue({
    auditId: "audit-c412",
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

  const modelInputs: { system: string; user: string }[] = [];
  const eventTypes: string[] = [];
  let answer = "";

  for await (const event of askIntelligence(args.query, {
    // `tenantId` is required for the synthesizer to reach the model at all;
    // without it the turn refuses before the behaviour under test.
    tenantId: "tenant-c412",
    tenantClientKey: "skyharbor-air",
    // See the header note: this is what makes the fallback case attributable
    // to `ask/index.ts` rather than to the synthesizer.
    richText: true,
    onModelInput: (parts) => modelInputs.push(parts),
  })) {
    eventTypes.push(event.type);
    if (event.type === "delta") answer += event.text ?? "";
  }

  return { modelInputs, answer, eventTypes };
}

describe("C-412 · answer-mode wiring inside the Ask module", () => {
  it("sends the classified mode's system contract and prompt directive to the model", async () => {
    expect(classifyAbarvaAnswerMode(MOVES_EXECUTION_QUERY)).toBe(
      "strategy_to_moves_execution",
    );

    const { modelInputs, eventTypes } = await runAsk({
      query: MOVES_EXECUTION_QUERY,
      modelText: "Run this as a Moves program.",
    });

    // One model call, and the turn completed rather than refusing — otherwise
    // an empty `modelInputs` would make the assertions below vacuous.
    expect({
      modelCalls: modelInputs.length,
      completed: eventTypes.includes("done"),
      refused: eventTypes.includes("error"),
    }).toEqual({ modelCalls: 1, completed: true, refused: false });

    // Both halves are cleaned by the product before the model call, so the
    // expected text goes through the same cleaner rather than being matched
    // loosely.
    expect(modelInputs[0].system).toContain(
      cleanIntelligenceModelInputText(
        buildCxoAnswerModeSystemAddendum("strategy_to_moves_execution"),
      ).trim(),
    );
    expect(modelInputs[0].user).toContain(
      cleanIntelligenceModelInputText(
        buildCxoAnswerModePromptDirective("strategy_to_moves_execution"),
      ).trim(),
    );
  }, 30000);

  it("delivers the mode's deterministic fallback to the caller when the model returns nothing the mode owes", async () => {
    const modelText = "Run this as a Moves program.";

    // "Nothing usable" stated rather than assumed: the model answered the
    // question in prose and supplied none of the artifacts the mode requires.
    expect(modelText).not.toContain("Moves phase plan");
    for (const label of MOVES_EXECUTION_PHASE_LABELS) {
      expect(modelText).not.toContain(label);
    }

    // The fallback's own contribution, taken from the registry entry the mode
    // resolves to. Asserted non-empty first: if the registry ever stops owing
    // anything for this mode, the case must say so rather than pass vacuously.
    const owedLines = deterministicAdditionLines(
      REGISTRY.strategy_to_moves_execution,
      modelText,
    );
    expect(owedLines.length).toBeGreaterThan(0);
    // That entry is the one the exported helper resolves this mode to, so the
    // lines asserted below are the ones this path owes and not another entry's.
    const throughHelper = applyCxoAnswerModeFallbacks(
      modelText,
      "strategy_to_moves_execution",
    );
    for (const line of owedLines) {
      expect(throughHelper).toContain(line);
    }

    const { answer } = await runAsk({
      query: MOVES_EXECUTION_QUERY,
      modelText,
    });

    expect(answer).toContain(modelText);
    for (const line of owedLines) {
      expect(answer).toContain(line);
    }
    for (const label of MOVES_EXECUTION_PHASE_LABELS) {
      expect(answer).toContain(label);
    }
  }, 30000);

  it("leaves an ordinary question with no mode contract, so the injection follows the classification rather than every query", async () => {
    expect(classifyAbarvaAnswerMode(GENERAL_QUERY)).toBe("general");

    const modelText = "Your largest telecoms commitment renews next year.";
    const { modelInputs, answer } = await runAsk({
      query: GENERAL_QUERY,
      modelText,
    });

    expect(modelInputs).toHaveLength(1);
    const { system, user } = modelInputs[0];

    // EVERY contract the registry declares, `general` included, read off the
    // registry entries rather than through the two builders. Leaving `general`
    // out would let a mutation that made the injection unconditional pass every
    // case in this suite, because `general` declares a systemContract and a
    // promptDirective of its own. Reading the declared fields also covers the
    // registry keys that `AbarvaAnswerMode` does not admit — inactive
    // placeholders, which declare neither field and so contribute no assertion.
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

    // And no mode's deterministic fallback ran either, so the classification
    // gates the fallback as well as the contract. Counted, so a registry that
    // declared no fallbacks at all could not pass this loop silently.
    let fallbacksChecked = 0;
    for (const [mode, contract] of Object.entries(REGISTRY)) {
      const owedLines = deterministicAdditionLines(contract, modelText);
      if (owedLines.length === 0) continue;
      fallbacksChecked += 1;
      for (const line of owedLines) {
        expect({ mode, line, applied: answer.includes(line) }).toEqual({
          mode,
          line,
          applied: false,
        });
      }
    }
    expect(fallbacksChecked).toBeGreaterThan(0);

    // `general` declares no deterministic fallback, so the model's own text
    // reaches the reader intact.
    expect(answer).toContain(modelText);
  }, 30000);
});
