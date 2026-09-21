/**
 * @jest-environment node
 */

/**
 * /api/v1/atlas execution mode visibility.
 *
 * Atlas answers in one of two modes and the caller is entitled to know which:
 * a model answer, or a deterministic fallback with a reason. The first two
 * cases here used to assert that by reading `chat/route.ts` and `ask/route.ts`
 * as text and grepping for `'x-atlas-mode': result.atlasMode`. That assertion
 * failed on current `main` for a reason that had nothing to do with the
 * control — the routes were reformatted to double quotes and the header was
 * still being set correctly — and it would have passed just as happily on a
 * route that only mentioned the header in a comment. Both cases now invoke
 * the route handlers and read the response.
 *
 * The third case used to read `llm.ts` as text, with three greps for the
 * `atlas_model_mode` fallback log and the final-return reason contract. It was
 * filed as T-462 and is now converted. It had to go: gutting `logAtlasMode` to
 * a no-op and forcing `fallbackReason: null` on every fallback — two real
 * controls deleted, one of them the silent null the contract exists to prevent
 * — left all three greps matching (the names survive in comments) and the suite
 * at 7 passed / 7.
 *
 * `logAtlasMode` is still module-private; it was not exported so a test could
 * see it, which would reshape the module to suit the test. Instead the payload
 * and the level are pure exported functions in `@/lib/atlas/mode-log`, asserted
 * by calling them, and `runAtlasLlm` is driven for real on its two fallback
 * branches so the log is proved to fire rather than proved to exist.
 *
 * The fourth case reads a migration file, which is text, and asserting its
 * content is the only thing it can mean.
 */

import fs from "node:fs";
import path from "node:path";

const requireAtlasTenancyMock = jest.fn();
jest.mock("@/app/api/v1/atlas/_auth", () => ({
  requireAtlasTenancy: (...args: unknown[]) => requireAtlasTenancyMock(...args),
  tenancyErrorResponse: (err: unknown) => {
    throw err;
  },
}));

const runAtlasTurnMock = jest.fn();
const runAtlasTurnDetailedMock = jest.fn();
jest.mock("@/lib/atlas/orchestrator", () => ({
  runAtlasTurn: (...args: unknown[]) => runAtlasTurnMock(...args),
  runAtlasTurnDetailed: (...args: unknown[]) =>
    runAtlasTurnDetailedMock(...args),
}));

jest.mock("@/lib/atlas/rendered-response", () => ({
  buildAtlasRenderedResponse: () => ({
    response_text: "Meridian has three active programs this quarter.",
  }),
}));

/**
 * Boundaries replaced so `runAtlasLlm` can be driven for real on its fallback
 * branches. These are the module edges the function actually imports — five
 * modules, not eight assertions — and none of them is the subject under test:
 * every case below asserts the mode log and the returned mode contract, never
 * a query result. `getAuditedAnthropicClient` is replaced so no Anthropic call
 * can leave the process in either direction.
 */
const TOWER_STATE = {
  client: {
    clientName: "Meridian Health",
    industryCode: "HEALTHCARE_IDN",
    tenantKey: "meridian-health",
  },
  todayIso: "2026-09-21",
  activeLens: "value",
  substrateCounts: {
    initiatives: 0,
    vendors: 0,
    kpiSnapshots: 0,
    decisions: 0,
    scenarios: 0,
    stakeholderNotes: 0,
    pressures: 0,
    observations: 0,
    alignmentDots: 0,
  },
  bandMetrics: { metrics: [] },
  pressuresView: { cards: [] },
  atlasObservationsView: { rows: [] },
  alignment2x2View: { dots: [] },
  budgetRollups: [],
  initiatives: [],
  vendors: [],
  kpiSnapshots: [],
  decisions: [],
  scenarios: [],
  stakeholderNotes: [],
};

jest.mock("@/lib/atlas/tool-belt", () => ({
  query_tower_current_state: jest.fn(async () => TOWER_STATE),
  query_portfolio_aggregates: jest.fn(async () => null),
  query_signals: jest.fn(async () => []),
  query_programs: jest.fn(async () => []),
  query_use_cases: jest.fn(async () => []),
  query_cohort_benchmarks: jest.fn(async () => null),
  query_signal_evidence: jest.fn(async () => null),
}));

jest.mock("@/lib/agent/retrieval", () => ({
  assembleRetrievalContext: jest.fn(async () => ({
    clientChunks: [],
    industryChunks: [],
    topicChunks: [],
    atlasIacComposition: null,
  })),
}));

jest.mock("@/lib/atlas/tower-factual-spine", () => ({
  buildTowerFactualSpineAnswer: jest.fn(() => null),
}));

jest.mock("@/lib/atlas/value-grounding", () => ({
  buildAtlasValueGrounding: jest.fn(async () => null),
  renderAtlasValueGrounding: jest.fn(() => ""),
}));

jest.mock("@/lib/semantic-dossiers", () => ({
  loadCuratedSemanticDossier: jest.fn(async () => null),
}));

const messagesCreateMock = jest.fn();
jest.mock("@/lib/agent/stream", () => ({
  getAuditedAnthropicClient: jest.fn(async () => ({
    client: {
      messages: { create: (...args: unknown[]) => messagesCreateMock(...args) },
    },
    auditId: "audit-test",
    dataClass: "confidential",
  })),
}));

import { POST as askPost } from "../ask/route";
import { POST as chatPost } from "../chat/route";
import { runAtlasLlm } from "@/lib/atlas/llm";
import {
  atlasModeLogLevel,
  buildAtlasModeLogPayload,
} from "@/lib/atlas/mode-log";
import type { AtlasTenancyCtx } from "@/lib/atlas/types";

function post(body: Record<string, unknown>) {
  return new Request("http://localhost/api/v1/atlas", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as never;
}

const FALLBACK_TURN = {
  threadId: "thread-1",
  signalId: null,
  observationId: null,
  routeType: "tool_augmented",
  intent: "portfolio",
  response: "Meridian has three active programs this quarter.",
  atlasMode: "fallback",
  fallbackReason: "missing_anthropic_api_key",
  groundingDisclosure: null,
  toolResults: {},
};

const ATLAS_CTX: AtlasTenancyCtx = {
  clientId: "client-meridian",
  clientKey: "meridian",
  userId: null,
};

let warnSpy: jest.SpyInstance;
let infoSpy: jest.SpyInstance;
// The failed-model case makes `runAtlasLlm` log its own error on purpose;
// silenced so a deliberate failure does not read as a broken suite in CI.
let errorSpy: jest.SpyInstance;

/** Every `[atlas.mode]` line either console method received, parsed. */
function modeLogPayloads(): unknown[] {
  return [...warnSpy.mock.calls, ...infoSpy.mock.calls]
    .filter((call) => call[0] === "[atlas.mode]")
    .map((call) => JSON.parse(String(call[1])));
}

describe("/api/v1/atlas execution mode visibility", () => {
  beforeEach(() => {
    requireAtlasTenancyMock.mockReset();
    requireAtlasTenancyMock.mockResolvedValue({
      clientId: "client-meridian",
      clientKey: "meridian",
      userId: null,
    });
    runAtlasTurnMock.mockReset();
    runAtlasTurnDetailedMock.mockReset();
    messagesCreateMock.mockReset();
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    infoSpy.mockRestore();
    errorSpy.mockRestore();
    delete process.env.ANTHROPIC_API_KEY;
  });

  it("exposes x-atlas-mode on a chat response", async () => {
    runAtlasTurnMock.mockResolvedValue({ ...FALLBACK_TURN });

    const res = await chatPost(post({ message: "how are my programs?" }));

    expect(res.status).toBe(200);
    expect(res.headers.get("x-atlas-mode")).toBe("fallback");
  });

  it("exposes x-atlas-mode on an ask response", async () => {
    runAtlasTurnDetailedMock.mockResolvedValue({ ...FALLBACK_TURN });

    const res = await askPost(post({ message: "how are my programs?" }));

    expect(res.status).toBe(200);
    expect(res.headers.get("x-atlas-mode")).toBe("fallback");
  });

  it("carries the mode the turn actually ran in, not a constant", async () => {
    runAtlasTurnDetailedMock.mockResolvedValue({
      ...FALLBACK_TURN,
      atlasMode: "model",
      fallbackReason: null,
    });

    const res = await askPost(post({ message: "how are my programs?" }));

    expect(res.headers.get("x-atlas-mode")).toBe("model");
  });

  it("returns mode and fallback reason in the ask JSON payload", async () => {
    runAtlasTurnDetailedMock.mockResolvedValue({ ...FALLBACK_TURN });

    const body = await (
      await askPost(post({ message: "how are my programs?" }))
    ).json();

    expect(body).toMatchObject({
      atlasMode: "fallback",
      fallbackReason: "missing_anthropic_api_key",
    });
  });

  it("reports a null fallback reason rather than omitting the field", async () => {
    runAtlasTurnDetailedMock.mockResolvedValue({
      ...FALLBACK_TURN,
      atlasMode: "model",
      fallbackReason: undefined,
    });

    const body = await (
      await askPost(post({ message: "how are my programs?" }))
    ).json();

    expect(body).toHaveProperty("fallbackReason", null);
  });

  describe("structured fallback mode log (T-462)", () => {
    it("builds a payload that names the event and carries the reason", () => {
      expect(
        buildAtlasModeLogPayload({
          tenantId: "client-meridian",
          mode: "fallback",
          reason: "missing_anthropic_api_key",
          model: "claude-opus-4-7",
          workflow: "atlas-llm",
        }),
      ).toEqual({
        event: "atlas_model_mode",
        tenantId: "client-meridian",
        mode: "fallback",
        reason: "missing_anthropic_api_key",
        model: "claude-opus-4-7",
        workflow: "atlas-llm",
      });
    });

    it("keeps a null reason as null rather than dropping the field", () => {
      const payload = buildAtlasModeLogPayload({
        tenantId: "client-meridian",
        mode: "live",
        reason: null,
        model: "claude-opus-4-7",
        workflow: "atlas-llm",
      });

      // A consumer reading a reason-less fallback must be able to tell "no
      // reason given" from "field absent"; `toHaveProperty` fails on absence.
      expect(payload).toHaveProperty("reason", null);
    });

    it("marks a fallback at warn and every other mode at info", () => {
      expect(atlasModeLogLevel("fallback")).toBe("warn");
      expect(atlasModeLogLevel("live")).toBe("info");
    });

    it("emits the payload on the missing-key fallback branch of runAtlasLlm", async () => {
      delete process.env.ANTHROPIC_API_KEY;

      const result = await runAtlasLlm(ATLAS_CTX, "how are my programs?");

      expect(result.atlasMode).toBe("fallback");
      expect(warnSpy).toHaveBeenCalledWith(
        "[atlas.mode]",
        expect.any(String),
      );
      expect(modeLogPayloads()).toContainEqual(
        expect.objectContaining({
          event: "atlas_model_mode",
          mode: "fallback",
          reason: "missing_anthropic_api_key",
          tenantId: ATLAS_CTX.clientId,
        }),
      );
    });

    it("emits the payload with the model's own reason when the model call fails", async () => {
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";
      messagesCreateMock.mockRejectedValue(new Error("upstream 529 overloaded"));

      const result = await runAtlasLlm(ATLAS_CTX, "how are my programs?");

      expect(modeLogPayloads()).toContainEqual(
        expect.objectContaining({
          event: "atlas_model_mode",
          mode: "fallback",
          reason: "upstream 529 overloaded",
        }),
      );
      // The final-return contract the third grep used to guard: a fallback
      // never reports a null reason, and the mode follows the model name.
      expect(result.modelName).toBeNull();
      expect(result.atlasMode).toBe("fallback");
      expect(result.fallbackReason).toBe("upstream 529 overloaded");
    });

    it("reports a live mode with a null reason when the model answers", async () => {
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";
      messagesCreateMock.mockResolvedValue({
        content: [{ type: "text", text: "Three programs are active." }],
      });

      const result = await runAtlasLlm(ATLAS_CTX, "how are my programs?");

      expect(result.atlasMode).toBe("live");
      expect(result.fallbackReason).toBeNull();
      expect(result.modelName).not.toBeNull();
    });
  });

  it("allows tool-augmented Atlas observations in the persisted route contract", () => {
    const observationsMigration = fs.readFileSync(
      path.join(
        process.cwd(),
        "supabase/migrations/20260627033000_atlas_observations_allow_tool_augmented.sql",
      ),
      "utf8",
    );

    expect(observationsMigration).toContain(
      "atlas_observations_route_type_check",
    );
    expect(observationsMigration).toContain("'tool_augmented'");
  });
});
