/**
 * Item C-569 — the five Ask ROUTE answer-mode call sites `C-567` left undriven.
 *
 * `C-567` proved three of the route's eight `applyProductTruthToAvaAnswer`
 * call sites by execution. Measured here before a line of this suite was
 * written, by instrumenting all eight sites and running that suite: it reaches
 * 419, 874 and 1417 and nothing else. The other five — 550, 668, 785, 1079 and
 * 1581 — were driven by nothing, which is why this file exists and why every
 * case below names the site it answers for.
 *
 * REPORTED PER SITE, NEVER IN AGGREGATE. An aggregate count of "sites covered"
 * is exactly what let five hide behind three, so each site gets its own case,
 * its own identifying assertion on the packet the route emits, and its own
 * mutation.
 *
 * WHAT IS STUBBED, AND WHY EACH ONE IS A BOUNDARY AND NOT THE SUBJECT. The
 * same seams the three sibling route suites and `C-567` replace — the
 * retrieval-and-model pipeline behind `@/lib/intelligence/ask`, Clerk, the
 * Maestro person, tenant resolution, session memory, Sentinel intent and
 * reasoning, synthesis telemetry — plus one this file is the first to need:
 * `buildServerSourceAnswerContext`, which checks tenant access and assembles
 * the governed Source packet out of the data plane. It is an auth-and-data
 * seam, and the two Source sites cannot be reached without standing in for it.
 * The answer-mode helpers are NOT stubbed: `classifyAbarvaAnswerMode` and
 * `applyCxoAnswerModeFallbacks` run for real in every case, which is the only
 * way a case here can fail when the route stops calling them.
 *
 * EVERY EXPECTED STRING IS READ OFF THE REGISTRY, never copied, by applying a
 * mode's own fallback to a probe string and taking the difference.
 *
 * TWO OF THE FIVE SITES ARE NOT REACHED BY ANY REQUEST, and that is a finding
 * rather than a gap in this suite. Sites 785 and 1581 are answered by search,
 * with an executable case pinning the fact that makes each one unreachable, so
 * the case fails when the fact stops holding. Their reasoning is written above
 * each one rather than in a release note nobody re-reads.
 */
import { POST } from "../route";
import { askIntelligence } from "@/lib/intelligence/ask";
import { classifySentinelIntent, runSentinelReasoning } from "@/lib/agent/sentinel-reasoning";
import {
  CXO_ANSWER_MODE_REGISTRY,
  applyCxoAnswerModeFallbacks,
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

// The governed Source packet assembly. It calls `checkTenantAccessByKey` and
// reads the Source read models, so it is the data-and-auth boundary for the
// two Source call sites. What it returns here is a Source surface context with
// no contract rows, which is enough for both builders to produce their
// named-contract-not-in-packet answer — the smallest real answer either site
// emits, and the one that needs no fixture register.
jest.mock("@/lib/source/ava/server-contract-answer-context", () => ({
  buildServerSourceAnswerContext: jest.fn(async () => ({
    module: "source",
    clientKey: "apexretail",
  })),
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

async function eventsFor(body: unknown) {
  const response = await POST(makeRequest(body) as never);
  return parseNdjson(await readResponseText(response));
}

type EmittedPacket = {
  intent?: string;
  surface?: string;
  directAnswer?: string;
  decisionFrame?: unknown;
  citations?: Array<Record<string, unknown>>;
};

function packetFrom(events: Array<Record<string, unknown>>): EmittedPacket | null {
  const event = events.find((item) => item.type === "agent-answer");
  return (event?.answer ?? null) as EmittedPacket | null;
}

/**
 * The lines a mode's deterministic fallback ADDS, derived from the registry.
 * `**` is stripped because every site's packet passes through
 * `sanitizeAgentAnswerForRender`, which drops emphasis.
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

const MODES_WITH_A_FALLBACK = (
  Object.keys(CXO_ANSWER_MODE_REGISTRY) as AbarvaAnswerMode[]
).filter((mode) => fallbackLinesFor(mode).length > 0);

const MOVES_MODE: AbarvaAnswerMode = "strategy_to_moves_execution";

/** One question per site, each phrased to reach that site and no other. */
const SITE_550_QUESTION =
  "What would the plan look like by phases for the negotiation levers on CTR-9001?";
const SITE_668_QUESTION =
  "What would the plan look like by phases for CTR-9001 as a relationship chart?";
const SITE_785_QUESTION =
  "What would the plan look like by phases for SkyHarbor's agent-assist bet?";
const SITE_1079_QUESTION =
  "What would the plan look like by phases for the service desk automation bet?";
const SITE_1581_QUESTION =
  "What would the plan look like by phases for the agent-assist bet?";

function expectNoFallback(text: string | undefined) {
  for (const line of fallbackLinesFor(MOVES_MODE)) {
    expect(text).not.toContain(line);
  }
}

function expectFallback(text: string | undefined) {
  const lines = fallbackLinesFor(MOVES_MODE);
  expect(lines.length).toBeGreaterThan(0);
  for (const line of lines) {
    expect(text).toContain(line);
  }
}

describe("C-569 · the five Ask route answer-mode call sites C-567 did not reach", () => {
  it("every question below classifies to the mode these cases are about", () => {
    // The premise, checked rather than assumed. A case about
    // `strategy_to_moves_execution` that quietly drives `general` proves
    // nothing about an opt-out, because `general` injects nothing either way.
    for (const question of [
      SITE_550_QUESTION,
      SITE_668_QUESTION,
      SITE_785_QUESTION,
      SITE_1079_QUESTION,
      SITE_1581_QUESTION,
    ]) {
      expect(classifyAbarvaAnswerMode(question)).toBe(MOVES_MODE);
    }
    expect(MODES_WITH_A_FALLBACK).toContain(MOVES_MODE);
    expect(fallbackLinesFor(MOVES_MODE).length).toBeGreaterThan(0);
  });

  it("site 550 · route.source_contract_optimization_export.answer opts out, and the opt-out is why the fallback is absent", async () => {
    const events = await eventsFor({
      q: SITE_550_QUESTION,
      client: "apexretail",
      richText: true,
      answerOnlyStreaming: true,
      surfaceContext: { module: "source", clientKey: "apexretail" },
    });
    const packet = packetFrom(events);

    // Identifies the site: no other call site composes this intent.
    expect(packet?.intent).toBe("source_contract_optimization_export");
    expect(packet?.surface).toBe("source");
    // Not vacuous: the answer the fallback would have been appended to is here.
    expect(packet?.directAnswer).toContain("CTR-9001");
    expectNoFallback(packet?.directAnswer);
  });

  it("site 668 · route.source_visual.agent_answer opts out on the same terms", async () => {
    const events = await eventsFor({
      q: SITE_668_QUESTION,
      client: "apexretail",
      richText: true,
      answerOnlyStreaming: true,
      surfaceContext: { module: "source", clientKey: "apexretail" },
    });
    const packet = packetFrom(events);

    // Identifies the site. The word `chart` is what splits this request from
    // the one above: the export predicate excludes a visual ask outright, so
    // the same tenant, module and contract id reach the visual site instead.
    expect(packet?.intent).toBe("source_contract_visual");
    expect(packet?.surface).toBe("source");
    expect(packet?.directAnswer).toContain("CTR-9001");
    expectNoFallback(packet?.directAnswer);
  });

  it("site 1079 · route.sentinel.agent_answer opts out on the Sentinel reasoning path", async () => {
    (classifySentinelIntent as jest.Mock).mockImplementationOnce(async () => ({
      intent: "it_productivity",
      confidence: 0.91,
      matchedPatternSlugs: ["service-desk-automation"],
      entities: {},
      reason: "service desk automation",
    }));
    (runSentinelReasoning as jest.Mock).mockImplementationOnce(
      async function* () {
        yield {
          name: "Diagnosis",
          content:
            "Ticket deflection is the measurable lever on the service desk.",
          citations: [
            {
              id: "sentinel-1",
              label: "Service desk ticket volumes",
              detail: "42,000 tickets across the last four quarters",
              sourceType: "client_data",
              url: null,
            },
          ],
        };
      },
    );

    const events = await eventsFor({
      q: SITE_1079_QUESTION,
      client: "apexretail",
      richText: true,
      answerOnlyStreaming: true,
    });
    const packet = packetFrom(events);

    // Identifies the site: only the Sentinel branch emits `classified` with
    // this intent and an `ava-stage` before its packet.
    const classified = events.find((item) => item.type === "classified");
    expect(
      (classified?.classification as { intent?: string } | undefined)?.intent,
    ).toBe("it_productivity");
    expect(events.some((item) => item.type === "ava-stage")).toBe(true);
    expect(packet?.surface).toBe("intelligence");
    // Not vacuous: the stage text the fallback would have been appended to.
    expect(packet?.directAnswer).toContain("Ticket deflection");
    expectNoFallback(packet?.directAnswer);
  });

  /**
   * SITE 785 · route.home_know_tenant_fence.answer — NOT REACHED BY ANY
   * REQUEST, established by search over the route rather than by one sample.
   *
   * Its guard is a two-part disjunction and both parts are answered:
   *
   * 1. `!hasTenantAliasOverlap(homeTenantAliases, requestedHomeAliases)`.
   *    `homeTenantAliases` is built from `tenant ?? sessionTenant` and
   *    `requestedHomeAliases` from `tenantClientKey ?? homeTenant.appClientKey
   *    ?? homeTenant.canonicalKey` — and `tenantClientKey` IS
   *    `resolvedClient.appClientKey`, the same object. So the right side is
   *    always an alias of a key the left side already contains, the overlap
   *    holds, and the negation is false. When no tenant resolves at all,
   *    `requestedHomeAliases` is empty and the guard's own length check fails.
   *
   * 2. `mentionsForeignTenant(query, foreignTenantAliases)`. That is
   *    `shouldFenceForeignTenantQuery` over `homeTenantAliases`, and the route
   *    already ran the identical predicate at site 419 over
   *    `[tenantInventoryKey, tenantClientKey, tenant?.displayName,
   *    ...signedInTenantAliases]` — the same four values under their other
   *    names — and returned before reaching Home KNOW. So whenever this half
   *    is true, 419 has already answered.
   *
   * The two cases below are what fails if either fact stops holding: the first
   * pins that the global fence, not the Home KNOW fence, answers the only
   * request shape that could reach 785, and the second proves that assertion
   * is not vacuous by producing the Home wording from site 419 itself.
   */
  it("site 785 · a Home ask naming another tenant is answered by the global fence at site 419, never by the Home KNOW fence", async () => {
    const events = await eventsFor({
      q: SITE_785_QUESTION,
      client: "apexretail",
      richText: true,
      answerOnlyStreaming: true,
      surfaceContext: { activeTab: "home", clientKey: "apexretail" },
    });
    const packet = packetFrom(events);

    expect(packet?.intent).toBe("tenant_fence");
    // The observable that separates the two sites. Site 419 derives its
    // surface from `surfaceContext.module`, which this request does not set,
    // so it answers as Intelligence; site 785 always builds the Home variant.
    expect(packet?.directAnswer).toContain("from Intelligence");
    expect(packet?.directAnswer).not.toContain("from Home");
    // Site 419 applies the fallback, so this also records which side of the
    // opt-out the answering site is on.
    expectFallback(packet?.directAnswer);
  });

  it("site 785 · the Home wording the case above excludes is reachable at site 419, so that exclusion is not vacuous", async () => {
    const events = await eventsFor({
      q: SITE_785_QUESTION,
      client: "apexretail",
      richText: true,
      answerOnlyStreaming: true,
      surfaceContext: { module: "home", activeTab: "home", clientKey: "apexretail" },
    });
    const packet = packetFrom(events);

    expect(packet?.intent).toBe("tenant_fence");
    expect(packet?.directAnswer).toContain("from Home");
    expectFallback(packet?.directAnswer);
  });

  /**
   * SITE 1581 · route.agent_answer.exhibits — REACHED, but only by a model
   * answer that carries all five companion-canvas markers itself and puts no
   * prose before the first one.
   *
   * Established by reading the branch above it rather than by sampling: with
   * `intelligence_companion_canvas` off — and its registry entry declares
   * `includeTenants: []`, so it is off for every tenant unless an env list
   * names one — the route calls `ensureRouteMandatoryCanvasTabs`, which injects
   * any missing card and whose main answer comes from
   * `cleanRouteCanvasMainAnswer`, a function that never returns empty because
   * it falls back to a canned sentence. So an ordinary answer always arrives at
   * the tabbed branch with at least one tab AND a non-empty main answer, and
   * site 1417 takes it. The only way past that branch with the flag off is for
   * the model's own output to already satisfy the mandate — all five markers,
   * the Chart card carrying chart-ready data — while beginning at the first
   * marker, which leaves `mainAnswer` empty.
   */
  const FIVE_TAB_MODEL_ANSWER = [
    "<<<TAB: Decision | grounding: tenant-evidence>>>",
    "Sequence the agent-assist bet behind the readiness gate.",
    "",
    "<<<TAB: Industry Insights | grounding: industry-context>>>",
    "Peer carriers run eighteen to twenty-four month agent-assist ramps.",
    "",
    "<<<TAB: Chart | grounding: tenant-evidence>>>",
    "| Wave | Candidate value |",
    "| --- | --- |",
    "| Wave 1 | $4.2M |",
    "",
    "<<<TAB: Table | grounding: tenant-evidence>>>",
    "| Phase | Owner |",
    "| --- | --- |",
    "| P0 | Chief Operating Officer |",
    "",
    "<<<TAB: Evidence | grounding: tenant-evidence>>>",
    "Ticket volume and handle time are captured; deflection is not.",
  ].join("\n");

  it("site 1581 · route.agent_answer.exhibits opts out when the model's own answer leaves no main answer before its first card", async () => {
    (askIntelligence as jest.Mock).mockImplementationOnce(async function* () {
      yield { type: "delta", text: FIVE_TAB_MODEL_ANSWER };
      yield { type: "done" };
    });

    const events = await eventsFor({
      q: SITE_1581_QUESTION,
      client: "apexretail",
      richText: true,
      answerOnlyStreaming: true,
    });
    const packet = packetFrom(events);

    // Identifies the site against its two neighbours: the tabbed site composes
    // `decision_canvas` and a `decisionFrame`, and the Sentinel site emits a
    // `classified` event first. This packet has neither.
    expect(packet?.surface).toBe("intelligence");
    expect(packet?.intent).not.toBe("decision_canvas");
    expect(packet?.decisionFrame).toBeUndefined();
    expect(events.some((item) => item.type === "classified")).toBe(false);
    // Not vacuous: the answer the fallback would have been appended to.
    expect(packet?.directAnswer).toContain("readiness gate");
    expectNoFallback(packet?.directAnswer);
  });

  it("site 1581 · the same question with an ordinary model answer reaches the tabbed site instead, so the identification above is not vacuous", async () => {
    // The route's mandatory-card injection is what moves it: same question,
    // same tenant, same surface, and the only difference is that the model did
    // not write the cards itself.
    const events = await eventsFor({
      q: SITE_1581_QUESTION,
      client: "apexretail",
      richText: true,
      answerOnlyStreaming: true,
    });
    const packet = packetFrom(events);

    expect(packet?.intent).toBe("decision_canvas");
    expect(packet?.decisionFrame).toBeDefined();
    expectNoFallback(packet?.directAnswer);
  });
});
