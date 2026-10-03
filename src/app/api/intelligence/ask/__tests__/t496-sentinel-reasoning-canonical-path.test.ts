/**
 * T-496 — the retired `@/lib/agents` path must stop RESOLVING, not merely stop
 * being written.
 *
 * `src/__tests__/hygiene/canonical-paths.test.ts` already guards this, and it
 * was right: it caught `src/app/api/intelligence/ask/route.ts` importing
 * `@/lib/agents/sentinel-reasoning`. But it is a byte scan over source lines
 * and it requires the literal word `import` on the line, so on the state this
 * item was filed against it saw ONE of the two references in that file and was
 * blind to the `jest.mock` call sites naming that same retired path in
 * three suites. A sharper regular expression is the same defect with a longer
 * fuse.
 *
 * So this suite asserts the two things a byte scan cannot:
 *
 *   1. the retired specifier does not RESOLVE — the reason the import drifted
 *      back is that it worked perfectly at run time and no build, lint or type
 *      check objected;
 *   2. the live Intelligence Ask route calls the module at the CANONICAL path —
 *      proven by mocking that path and driving the real `POST`, so a route that
 *      reached any other copy would fail this even with every string in the
 *      repo spelled correctly.
 *
 * Case 2 is the one that cannot be satisfied by a rename.
 */

import { existsSync } from "fs";
import { join } from "path";

import { POST } from "@/app/api/intelligence/ask/route";
import { classifySentinelIntent } from "@/lib/agent/sentinel-reasoning";

// Assembled from parts rather than written as one quoted literal. This file
// must not itself become a quoted occurrence of the retired path, or it is the
// first false positive the hygiene guard produces the day someone drops its
// `includes("import")` condition — which is exactly the sharpening this suite
// argues for.
const RETIRED_SPECIFIER = ["@/lib", "agents", "sentinel-reasoning"].join("/");
const RETIRED_DIRECTORY = join(process.cwd(), "src", "lib", "agents");

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

// The canonical path, and only the canonical path. If the route reaches the
// retired copy instead, this mock is bypassed and the assertion below fails.
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
    yield { type: "delta", text: "A governed answer." };
    yield { type: "done" };
  }),
}));

jest.mock("@/lib/reasoning/synthesis-telemetry", () => ({
  recordSynthesisEvent: jest.fn(() => ({ id: "tlm_intelligence_1" })),
}));

jest.mock("@/lib/reasoning/telemetry-init", () => ({}));

function makeRequest(body: unknown) {
  return {
    json: async () => body,
    cookies: { get: () => undefined },
  };
}

async function drainResponse(response: Response): Promise<string> {
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

describe("T-496 sentinel-reasoning lives only at the canonical agent path", () => {
  it("resolves the canonical specifier and exports the reasoning entry points", () => {
    // `requireActual`, not `import`. The canonical path is mocked below so the
    // route case can observe it, and a plain import here would hand this case
    // the mock's own shape — which it would then assert against itself. Written
    // that way first, and a mutation that emptied the real barrel of
    // `classifySentinelIntent` left this case green; that is the whole reason
    // it reads the real module.
    const canonical = jest.requireActual<
      typeof import("@/lib/agent/sentinel-reasoning")
    >("@/lib/agent/sentinel-reasoning");

    expect(typeof canonical.classifySentinelIntent).toBe("function");
    expect(typeof canonical.runSentinelReasoning).toBe("function");
  });

  it("no longer resolves the retired specifier", async () => {
    // Not a text search: the specifier is handed to the real resolver. This is
    // the assertion that fails while `src/lib/agents/` survives on disk, which
    // is how the import drifted back without a single check objecting.
    await expect(import(RETIRED_SPECIFIER)).rejects.toThrow();
  });

  it("leaves no retired src/lib/agents directory behind", () => {
    // A rename that leaves the old directory in place fixes today's import and
    // not tomorrow's — the acceptance names this explicitly.
    expect(existsSync(RETIRED_DIRECTORY)).toBe(false);
  });

  it("drives the live Ask route through the canonical module", async () => {
    const response = await POST(
      makeRequest({
        q: "What does the governed evidence support?",
        client: "active-client",
        richText: true,
        answerOnlyStreaming: true,
      }) as never,
    );
    await drainResponse(response);

    // The route imported the module under test; the mock above replaced the
    // canonical path. A call recorded here proves the live surface reaches that
    // module and no other.
    expect(classifySentinelIntent).toHaveBeenCalledTimes(1);
    expect(classifySentinelIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "What does the governed evidence support?",
      }),
    );
  });
});
