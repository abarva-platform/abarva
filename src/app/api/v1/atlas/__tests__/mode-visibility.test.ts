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
 * The third case still reads `llm.ts` as text. It is kept and labelled rather
 * than converted because `logAtlasMode` is module-private and the only path
 * that reaches it runs eight tenant data queries first; exporting a private
 * function so a test can see it would change the shape of the module to suit
 * the test. It is filed as T-462, and it is named here as a weaker assertion
 * than the two above rather than left to look like the same thing.
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

import { POST as askPost } from "../ask/route";
import { POST as chatPost } from "../chat/route";

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

  it("logs structured fallback mode events without hiding the reason (source assertion — see T-462)", () => {
    const llmSource = fs.readFileSync(
      path.join(process.cwd(), "src/lib/atlas/llm.ts"),
      "utf8",
    );

    expect(llmSource).toMatch(/event:\s*["']atlas_model_mode["']/);
    expect(llmSource).toMatch(/mode:\s*["']fallback["']/);
    expect(llmSource).toMatch(/fallbackReason:\s*modelName\s*\?\s*null\s*:/);
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
