/**
 * Item C-567 — the Ask ROUTE's answer-mode wiring, proved by execution.
 *
 * C-412 closed the module half (`src/lib/intelligence/ask/index.ts`). This is
 * the other module the deleted byte assertion named, and it is not a copy of
 * the first: measured on the route, the classification reads a different field,
 * the deterministic fallback sits behind an opt-out that the call sites take
 * both ways, and one application is on an error path no module-level suite
 * reaches.
 *
 * WHAT IS STUBBED, AND WHY EACH ONE IS A BOUNDARY AND NOT THE SUBJECT.
 * `@/lib/intelligence/ask` is the retrieval-and-model pipeline as the route
 * sees it — the audited Anthropic client lives behind it — so it stands in for
 * one seam, exactly as the three sibling route suites do. Clerk, the Maestro
 * person, tenant resolution, session memory, Sentinel intent and synthesis
 * telemetry are the auth, data and I/O seams. The answer-mode helpers are NOT
 * stubbed: `classifyAbarvaAnswerMode` and `applyCxoAnswerModeFallbacks` are
 * imported by `route.ts` directly and run for real in every case below, which
 * is the only way a case here can fail when the route stops calling them.
 *
 * EVERY EXPECTED STRING IS READ OFF THE REGISTRY, never copied. A mode's
 * injected text is derived by applying that mode's own fallback to a probe
 * string and taking the difference, so a registry edit moves the expectation
 * with it instead of leaving a case asserting yesterday's wording.
 */
import { POST } from "../route";
import { askIntelligence } from "@/lib/intelligence/ask";
import {
  CXO_ANSWER_MODE_REGISTRY,
  applyCxoAnswerModeFallbacks,
  getCxoAnswerModeContract,
} from "@/lib/intelligence/ask/answer-mode-registry";
import {
  classifyAbarvaAnswerMode,
  type AbarvaAnswerMode,
} from "@/lib/intelligence/ask/response-policy";

jest.mock("@clerk/nextjs/server", () => ({
  currentUser: jest.fn(async () => ({ id: "user-1" })),
}));

jest.mock("@/lib/auth/maestro", () => ({
  getCurrentPerson: jest.fn(async () => null),
}));

jest.mock("@/lib/agent/prompts/_shared/user-context", () => ({
  assembleUserContextBlock: jest.fn(async () => ""),
}));

jest.mock("@/lib/tenant/resolveTenant", () => ({
  resolveTenant: jest.fn(async () => ({
    clientId: "client-1",
    canonicalKey: "apex-retail",
    appClientKey: "apexretail",
    displayName: "Apex Retail Group",
  })),
}));

jest.mock("@/lib/intelligence/ask/session-memory", () => ({
  appendAskSessionTurn: jest.fn(async () => undefined),
  normalizeAskTabId: jest.fn((tabId) => tabId ?? "tab-1"),
  prepareAskSessionMemory: jest.fn(async () => ({
    sessionId: "ask-session-1",
    tabId: "tab-1",
    priorTurnCount: 0,
    contextBlock: "",
  })),
}));

jest.mock("@/lib/agent/sentinel-reasoning", () => ({
  classifySentinelIntent: jest.fn(async () => ({
    intent: "general",
    confidence: 0.8,
    matchedPatternSlugs: [],
  })),
  runSentinelReasoning: jest.fn(),
}));

jest.mock("@/lib/intelligence/ask", () => ({
  askIntelligence: jest.fn(async function* () {
    yield {
      type: "delta",
      text: "Vendor concentration is the live commercial risk.",
    };
    yield { type: "done" };
  }),
}));

jest.mock("@/lib/reasoning/synthesis-telemetry", () => ({
  recordSynthesisEvent: jest.fn(() => ({ id: "tlm_intelligence_1" })),
}));

jest.mock("@/lib/reasoning/telemetry-init", () => ({}));

function makeRequest(body: unknown) {
  return { json: async () => body, cookies: { get: () => undefined } };
}

async function readResponseText(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value);
  }
  return text;
}

function parseNdjson(text: string): Array<Record<string, unknown>> {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

/**
 * The lines a mode's deterministic fallback ADDS, derived from the registry.
 *
 * `**` is stripped because the route's packet path runs the answer through
 * `sanitizeAgentAnswerForRender`, which drops emphasis; asserting the raw
 * registry bytes would fail for a reason that has nothing to do with wiring.
 * The bullets and the heading survive, and they are what a reader sees.
 */
function fallbackLinesFor(mode: AbarvaAnswerMode): string[] {
  const probe = "PROBE ANSWER BODY.";
  const injected = applyCxoAnswerModeFallbacks(probe, mode);
  if (injected === probe) return [];
  return injected
    .slice(probe.length)
    .replace(/\*\*/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Every mode in the registry that injects anything at all. */
const MODES_WITH_A_FALLBACK = (
  Object.keys(CXO_ANSWER_MODE_REGISTRY) as AbarvaAnswerMode[]
).filter((mode) => fallbackLinesFor(mode).length > 0);

// A phase question. Its mode is asserted below rather than assumed, so a
// classifier change cannot silently turn this fixture into a `general` ask and
// leave four cases passing over the wrong branch.
const MOVES_QUESTION =
  "What would the plan look like by phases for SkyHarbor's agent-assist bet?";
// The same shape of cross-tenant ask, phrased so it classifies `general`.
const GENERAL_QUESTION =
  "How many vendors does SkyHarbor have in the loaded register?";

const MOVES_MODE: AbarvaAnswerMode = "strategy_to_moves_execution";

function packetFrom(events: Array<Record<string, unknown>>) {
  const event = events.find((item) => item.type === "agent-answer");
  return (event?.answer ?? null) as { directAnswer?: string } | null;
}

describe("C-567 · POST /api/intelligence/ask answer-mode wiring", () => {
  it("the fixtures classify to the modes these cases are about", () => {
    // The premise, stated and checked. The classifier is not the subject here
    // — its own suites own it — but a case about `strategy_to_moves_execution`
    // that quietly drives `general` proves nothing, and nothing else in this
    // file would report it.
    expect(classifyAbarvaAnswerMode(MOVES_QUESTION)).toBe(MOVES_MODE);
    expect(classifyAbarvaAnswerMode(GENERAL_QUESTION)).toBe("general");
    expect(fallbackLinesFor(MOVES_MODE).length).toBeGreaterThan(0);
    expect(MODES_WITH_A_FALLBACK).toContain(MOVES_MODE);
  });

  it("applies the classified mode's deterministic fallback on a call site that does not opt out", async () => {
    const response = await POST(
      makeRequest({
        q: MOVES_QUESTION,
        client: "apexretail",
        richText: true,
        answerOnlyStreaming: true,
      }) as never,
    );
    const packet = packetFrom(parseNdjson(await readResponseText(response)));

    expect(packet?.directAnswer).toBeTruthy();
    for (const line of fallbackLinesFor(MOVES_MODE)) {
      expect(packet?.directAnswer).toContain(line);
    }
  });

  it("injects nothing for an ordinary question on that same call site, read off every registry mode", async () => {
    // The negative control for the case above, and the one assertion that an
    // unconditional injection cannot pass. Same call site, same tenant, same
    // surface: the ONLY difference is the mode the question classifies to.
    const response = await POST(
      makeRequest({
        q: GENERAL_QUESTION,
        client: "apexretail",
        richText: true,
        answerOnlyStreaming: true,
      }) as never,
    );
    const packet = packetFrom(parseNdjson(await readResponseText(response)));

    // Not vacuous: the packet the mode would have been injected into is here.
    expect(packet?.directAnswer).toContain("Apex Retail Group");
    for (const mode of MODES_WITH_A_FALLBACK) {
      for (const line of fallbackLinesFor(mode)) {
        expect(packet?.directAnswer).not.toContain(line);
      }
    }
  });

  it("applies it on a second call site that does not opt out, on a different surface", async () => {
    // A Home KNOW ask. Reached because `shouldUseHomeKnowAgentAnswer` needs
    // only `activeTab: "home"` and a non-empty question, and the Home engine's
    // own blank guard supplies a grounded no-answer response, so this case
    // needs no Home dataset. It is here because one covered call site proves
    // the helper runs, not that the route calls it from more than one place.
    const response = await POST(
      makeRequest({
        q: "What would the plan look like by phases for our agent-assist bet?",
        client: "apexretail",
        richText: true,
        answerOnlyStreaming: true,
        surfaceContext: { activeTab: "home", clientKey: "apexretail" },
      }) as never,
    );
    const packet = packetFrom(parseNdjson(await readResponseText(response)));

    expect(packet?.directAnswer).toBeTruthy();
    for (const line of fallbackLinesFor(MOVES_MODE)) {
      expect(packet?.directAnswer).toContain(line);
    }
  });

  it("leaves the model's own words alone on a call site that opts out", async () => {
    // Same question, same mode, a call site that passes
    // `preserveModelOutput: true`. The fallback is absent, and the opt-out is
    // the reason: flipping that one flag in the route makes this case fail,
    // which is recorded as one of this item's mutations rather than asserted
    // here in prose.
    const response = await POST(
      makeRequest({
        q: "What would the plan look like by phases for our agent-assist bet?",
        client: "apexretail",
        richText: true,
        answerOnlyStreaming: true,
      }) as never,
    );
    const packet = packetFrom(parseNdjson(await readResponseText(response)));

    expect(packet?.directAnswer).toBe(
      "Vendor concentration is the live commercial risk.",
    );
    for (const line of fallbackLinesFor(MOVES_MODE)) {
      expect(packet?.directAnswer).not.toContain(line);
    }
  });

  it("applies the mode's fallback to the retired-fact refusal on the error path", async () => {
    // The third application, and the one no module-level suite can reach: the
    // route applies the fallback to a client-safe refusal it composes itself,
    // classified from the reader's question.
    (askIntelligence as jest.Mock).mockImplementationOnce(async function* () {
      yield {
        type: "delta",
        text: "Northstar Clinical is the comparable here.",
      };
      yield { type: "done" };
    });

    const response = await POST(
      makeRequest({
        q: "What would the plan look like by phases for our agent-assist bet?",
        client: "apexretail",
        richText: true,
        answerOnlyStreaming: true,
      }) as never,
    );
    const events = parseNdjson(await readResponseText(response));
    const errorEvent = events.find((item) => item.type === "error");
    const message = String(errorEvent?.error ?? "");

    expect(errorEvent).toBeTruthy();
    // Not vacuous: the refusal itself is present, so the assertions below are
    // about what the route added to it.
    expect(message).toContain("currently loaded evidence");
    for (const line of fallbackLinesFor(MOVES_MODE)) {
      expect(message).toContain(line);
    }
  });

  it("classifies the reader's own question and never a query carried on the surface context", async () => {
    // The route reads the mode from the question it was asked, and the context
    // it builds for the guard always carries that question. A request body
    // cannot supply a second one and move the mode.
    const response = await POST(
      makeRequest({
        q: MOVES_QUESTION,
        client: "apexretail",
        richText: true,
        answerOnlyStreaming: true,
        surfaceContext: { query: GENERAL_QUESTION },
      }) as never,
    );
    const packet = packetFrom(parseNdjson(await readResponseText(response)));

    for (const line of fallbackLinesFor(MOVES_MODE)) {
      expect(packet?.directAnswer).toContain(line);
    }
  });

  it("pins what makes the guard's empty-question default harmless", () => {
    // `applyProductTruthToAvaAnswer` classifies `context?.query ?? ""`, so a
    // context with no question and a `general` one classify identically. THE
    // CORRECT BEHAVIOUR FOR NO QUESTION IS TO INJECT NOTHING — a mode cannot
    // be known from a question that was not asked — and that is what happens,
    // because `general` declares no deterministic fallback.
    //
    // Searched rather than sampled, so this is a claim about reachability and
    // not about one request: all eight call sites in `route.ts` pass
    // `productTruthContext(...)`, that helper always sets `query` from the
    // request's question, and `handleAsk` answers an empty question with 400
    // before any of them runs. So the `?? ""` branch is unreachable through
    // `POST` today. It stops being harmless the moment `general` gains a
    // fallback, and this case is what fails then.
    expect(classifyAbarvaAnswerMode("")).toBe("general");
    // Read through the typed accessor, whose return type declares
    // `deterministicFallback` as optional. Reaching into the registry literal
    // instead does not typecheck at all, because the `general` entry is
    // narrowed to an object without that key -- which is a second, stronger
    // statement of the same fact, and the reason this line is written the long
    // way rather than the obvious way.
    expect(
      getCxoAnswerModeContract("general").deterministicFallback,
    ).toBeUndefined();
    expect(fallbackLinesFor("general")).toEqual([]);
  });

  it("answers an empty question before any answer-mode code runs", async () => {
    // Counted from a baseline rather than from zero: this mock accumulates
    // across the cases above, and `not.toHaveBeenCalled()` would be asserting
    // the order of this file rather than the behaviour of the route.
    const callsBefore = (askIntelligence as jest.Mock).mock.calls.length;

    const response = await POST(makeRequest({ q: "   " }) as never);

    expect(response.status).toBe(400);
    expect((askIntelligence as jest.Mock).mock.calls.length).toBe(callsBefore);
  });
});
