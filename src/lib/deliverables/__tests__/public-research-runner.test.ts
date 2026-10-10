/**
 * The research step runs one audited Anthropic call with the web search and
 * web fetch server tools and stores what the API cited as PENDING sources. It
 * must never throw into a build, and every attempt that reached egress is
 * recorded with its status.
 *
 * `preflightAnthropicDirectClient` is mocked to hand back a client whose
 * `messages.create` returns fixture content blocks shaped like the API's:
 * `server_tool_use`, `web_search_tool_result` (results carry `page_age`) and
 * `text` with `web_search_result_location` citations (`cited_text`, `url`,
 * `title`). The repository is mocked so each case reads exactly what the step
 * asked to write.
 */
jest.mock("server-only", () => ({}));

const mockPreflight = jest.fn();
jest.mock("@/lib/integrations/ai-egress/anthropic-direct", () => ({
  preflightAnthropicDirectClient: (...args: unknown[]) =>
    mockPreflight(...args),
}));

const mockInsertRun = jest.fn();
const mockInsertSources = jest.fn();
const mockFindReusable = jest.fn();
jest.mock("../public-research/repository", () => ({
  insertResearchRun: (...args: unknown[]) => mockInsertRun(...args),
  insertPublicSources: (...args: unknown[]) => mockInsertSources(...args),
  findReusableResearchRun: (...args: unknown[]) => mockFindReusable(...args),
}));

const mockFlag = { on: true };
jest.mock("@/lib/features/is-feature-enabled", () => ({
  isFeatureEnabled: (_ctx: unknown, key: string) =>
    key === "moves_public_source_research" ? mockFlag.on : false,
}));

import {
  assembleSources,
  extractCitations,
  pageAgeToDate,
  parseSourceAnnotations,
  PUBLIC_RESEARCH_FLAG,
  PUBLIC_RESEARCH_WORKLOAD,
  RESEARCH_CACHE_DAYS,
  RESEARCH_MAX_CONTINUATIONS,
  RESEARCH_MAX_TOKENS,
  RESEARCH_MAX_TOOL_USES,
  RESEARCH_TIMEOUT_MS,
  RESEARCH_WEB_FETCH_MAX_CONTENT_TOKENS,
  RESEARCH_WEB_FETCH_MAX_USES,
  RESEARCH_WEB_SEARCH_MAX_USES,
  runPublicResearch,
  type PublicResearchInput,
  type PublicResearchOutcome,
} from "../public-research/research-runner";
import {
  PUBLIC_SOURCE_EXCERPT_MAX_CHARS,
  PUBLIC_SOURCES_PER_RUN_MAX,
} from "../public-research/types";
import { runDeliverableForTenant } from "../orchestrator/generate-service";
import { getFeatureFlagDefinition } from "@/lib/features/registry";
import { AI_WORKLOADS } from "@/lib/observability/ai-workload-taxonomy";

type Block = Record<string, unknown>;

const MOVE = "11111111-1111-4111-8111-111111111111";
const RUN_ID = "33333333-3333-4333-8333-333333333333";
const CLIENT_ID = "44444444-4444-4444-8444-444444444444";
const NOW = new Date("2026-10-10T12:00:00.000Z");
const URL_A = "https://rules.example.gov/payment-rule";
const URL_B = "https://journal.example.org/study";

const input: PublicResearchInput = {
  tenantClientKey: "meridian",
  clientId: CLIENT_ID,
  userId: "user-1",
  programId: MOVE,
  phase: 2,
  deliverableType: "current_state_assessment",
  brief: {
    industry: "HEALTHCARE_IDN",
    archetype: "ambient_clinical_documentation",
    valueLevers: ["cycle time"],
    deniedNames: ["Northwind Regional Care"],
  },
};

function searchUse(id: string, name = "web_search"): Block {
  return { type: "server_tool_use", id, name, input: { query: "payer rule" } };
}

function searchResult(
  results: { url: string; title: string; page_age: string | null }[],
): Block {
  return {
    type: "web_search_tool_result",
    tool_use_id: "srv_1",
    content: results.map((r) => ({
      type: "web_search_result",
      encrypted_content: "enc",
      ...r,
    })),
  };
}

function cited(
  text: string,
  url: string,
  citedText: string,
  title: string | null = "Cited title",
): Block {
  return {
    type: "text",
    text,
    citations: [
      {
        type: "web_search_result_location",
        url,
        title,
        cited_text: citedText,
        encrypted_index: "idx",
      },
    ],
  };
}

function json(entries: unknown[]): Block {
  return {
    type: "text",
    text: `Here are the sources.\n\`\`\`json\n${JSON.stringify(entries)}\n\`\`\``,
    citations: null,
  };
}

function annotation(url: string, over: Record<string, unknown> = {}) {
  return {
    url,
    publisher: "Example Agency",
    publishedDate: "2026-01-15",
    claim: "The rule sets the payment basis.",
    confidence: "high",
    ...over,
  };
}

function message(content: Block[], stop_reason = "end_turn") {
  return { id: "msg_1", model: "m", content, stop_reason };
}

const mockCreate = jest.fn();

function allowEgress() {
  mockPreflight.mockResolvedValue({
    ok: true,
    client: { messages: { create: mockCreate } },
    auditId: "audit-1",
    dataClass: "internal",
  });
}

const goodTurn = () =>
  message([
    searchUse("srv_1"),
    searchResult([
      { url: URL_A, title: "Payment rule", page_age: "March 4, 2026" },
      { url: URL_B, title: "Published study", page_age: "April 2, 2025" },
    ]),
    cited(
      "The rule sets the basis.",
      URL_A,
      "Payment is calculated on the published basis.",
    ),
    cited(
      "A study found shorter notes.",
      URL_B,
      "Note time fell after adoption.",
      null,
    ),
    json([
      annotation(URL_A),
      annotation(URL_B, {
        publishedDate: null,
        publisher: null,
        confidence: "medium",
      }),
    ]),
  ]);

beforeEach(() => {
  jest.clearAllMocks();
  mockFlag.on = true;
  allowEgress();
  mockFindReusable.mockResolvedValue({
    ok: true,
    run: null,
    pendingSourceCount: 0,
  });
  mockInsertRun.mockImplementation(async (_scope, run) => ({
    ok: true,
    run: { id: RUN_ID, ...run },
  }));
  mockInsertSources.mockImplementation(
    async (_scope, _runId, sources: unknown[]) => ({
      ok: true,
      inserted: sources,
      duplicates: 0,
      rejected: [],
    }),
  );
});

function run(over: Partial<PublicResearchInput> = {}, timeoutMs?: number) {
  return runPublicResearch(
    { ...input, ...over },
    { now: () => NOW, ...(timeoutMs ? { timeoutMs } : {}) },
  );
}

function lastRunWrite() {
  return mockInsertRun.mock.calls.at(-1)?.[1];
}

describe("parsing", () => {
  it("stores only API-cited https sources the model annotated, pending review", async () => {
    mockCreate.mockResolvedValue(goodTurn());
    const out = await run();
    expect(out).toMatchObject({
      status: "ok",
      origin: "searched",
      runId: RUN_ID,
      pendingSources: 2,
      recorded: true,
      auditId: "audit-1",
      note: "2 outside sources found, awaiting review",
      error: null,
    });
    const [scope, runId, sources] = mockInsertSources.mock.calls[0]!;
    expect(scope).toEqual({ tenantKey: "meridian", programId: MOVE });
    expect(runId).toBe(RUN_ID);
    expect(sources).toEqual([
      {
        kind: "public_source",
        url: URL_A,
        title: "Cited title",
        publisher: "Example Agency",
        publishedAt: "2026-01-15",
        retrievedAt: NOW.toISOString(),
        excerpt: "Payment is calculated on the published basis.",
        claim: "The rule sets the payment basis.",
        confidence: "high",
      },
      {
        kind: "public_source",
        url: URL_B,
        // No citation title: the search result's title.
        title: "Published study",
        publisher: null,
        // No date from the model: the search result's page age.
        publishedAt: "2025-04-02",
        retrievedAt: NOW.toISOString(),
        excerpt: "Note time fell after adoption.",
        claim: "The rule sets the payment basis.",
        confidence: "medium",
      },
    ]);
    expect(lastRunWrite()).toMatchObject({
      phase: 2,
      status: "ok",
      sourceCount: 2,
      auditId: "audit-1",
      error: null,
    });
  });

  it("drops a non-https citation, an uncited annotation, an unannotated citation and an invalid annotation", async () => {
    const insecure = "http://insecure.example.org/page";
    const uncited = "https://never-cited.example.org/";
    const unannotated = "https://unannotated.example.org/";
    const invalid = "https://invalid.example.org/";
    mockCreate.mockResolvedValue(
      message([
        cited("a", URL_A, "Cited passage A."),
        cited("b", insecure, "Insecure passage."),
        cited("c", unannotated, "Nobody annotated this."),
        cited("d", invalid, "Badly annotated."),
        json([
          annotation(URL_A),
          annotation(insecure),
          annotation(uncited),
          annotation(invalid, { confidence: "certain" }),
          { url: URL_A },
          "not an object",
        ]),
      ]),
    );
    await run();
    const sources = mockInsertSources.mock.calls[0]![2] as { url: string }[];
    expect(sources.map((s) => s.url)).toEqual([URL_A]);
  });

  it("never extracts a citation whose URL is not https", () => {
    expect(
      extractCitations([
        cited("a", "http://insecure.example.org/page", "Passage."),
        cited("b", "https://user:pw@example.org/", "Passage."),
        cited("c", "not a url", "Passage."),
      ]),
    ).toEqual([]);
  });

  it("ignores citations that are not web search citations and empty cited text", () => {
    const sources = assembleSources(
      [
        {
          type: "text",
          text: "x",
          citations: [
            {
              type: "char_location",
              url: URL_A,
              cited_text: "doc text",
              document_index: 0,
            },
            {
              type: "web_search_result_location",
              url: URL_B,
              cited_text: "   ",
              title: "t",
            },
          ],
        },
        {
          type: "web_search_tool_result",
          content: {
            type: "web_search_tool_result_error",
            error_code: "unavailable",
          },
        },
      ],
      [annotation(URL_A), annotation(URL_B)] as never,
      NOW.toISOString(),
    );
    expect(sources).toEqual([]);
  });

  it("keeps the first citation per URL and falls back to publisher, then host, for a title", () => {
    const sources = assembleSources(
      [
        cited("1", URL_A, "First passage.", null),
        cited("2", URL_A, "Second passage.", "Later title"),
        cited("3", URL_B, "Host passage.", null),
      ],
      [
        annotation(URL_A, { publisher: "Agency" }),
        annotation(URL_B, { publisher: null }),
      ] as never,
      NOW.toISOString(),
    );
    expect(sources.map((s) => [s.url, s.title, s.excerpt])).toEqual([
      [URL_A, "Agency", "First passage."],
      [URL_B, "journal.example.org", "Host passage."],
    ]);
  });

  it("cuts the excerpt to the excerpt limit and collapses whitespace", async () => {
    const long = `  ${"a".repeat(150)}   \n  ${"b".repeat(250)}  `;
    mockCreate.mockResolvedValue(
      message([cited("a", URL_A, long), json([annotation(URL_A)])]),
    );
    await run();
    const [source] = mockInsertSources.mock.calls[0]![2] as {
      excerpt: string;
    }[];
    expect(source!.excerpt).toBe(`${"a".repeat(150)} ${"b".repeat(149)}`);
    expect(Array.from(source!.excerpt)).toHaveLength(
      PUBLIC_SOURCE_EXCERPT_MAX_CHARS,
    );
    expect(PUBLIC_SOURCE_EXCERPT_MAX_CHARS).toBe(300);
  });

  it("reads the last JSON block, a bare array, and refuses non-arrays", () => {
    expect(
      parseSourceAnnotations(
        "```json\n[]\n```\nlater\n```json\n[" +
          JSON.stringify(annotation(URL_A)) +
          "]\n```",
      ),
    ).toMatchObject({ ok: true, annotations: [{ url: URL_A }], dropped: 0 });
    expect(
      parseSourceAnnotations(`Sources: [${JSON.stringify(annotation(URL_B))}]`),
    ).toMatchObject({
      ok: true,
      annotations: [{ url: URL_B }],
    });
    expect(parseSourceAnnotations('```json\n{"url":"x"}\n```')).toEqual({
      ok: false,
      detail: "the source list is not a JSON array",
    });
    expect(parseSourceAnnotations("```json\n[{,]\n```")).toEqual({
      ok: false,
      detail: "the source list is not valid JSON",
    });
    expect(parseSourceAnnotations("no list here")).toEqual({
      ok: false,
      detail: "no JSON source list in the answer",
    });
    expect(
      parseSourceAnnotations(
        JSON.stringify([
          annotation(URL_A, { publishedDate: "Jan 2026" }),
          annotation(URL_A, { claim: "" }),
        ]),
      ),
    ).toEqual({ ok: true, annotations: [], dropped: 2 });
  });

  it("turns an absolute page age into a date and a relative one into nothing", () => {
    expect(pageAgeToDate("March 4, 2026")).toBe("2026-03-04");
    expect(pageAgeToDate("2 days ago")).toBeNull();
    expect(pageAgeToDate("Sometime 2026x")).toBeNull();
    expect(pageAgeToDate(null)).toBeNull();
  });
});

describe("budgets", () => {
  it("sends the declared tool versions, tool caps, token cap, signal and audit identity", async () => {
    mockCreate.mockResolvedValue(goodTurn());
    await run();
    expect(RESEARCH_WEB_SEARCH_MAX_USES).toBe(6);
    expect(RESEARCH_WEB_FETCH_MAX_USES).toBe(3);
    expect(RESEARCH_MAX_TOOL_USES).toBe(9);
    expect(RESEARCH_MAX_TOKENS).toBe(4096);
    expect(RESEARCH_TIMEOUT_MS).toBe(90_000);
    const [body, requestOptions] = mockCreate.mock.calls[0]!;
    expect(body.max_tokens).toBe(4096);
    expect(body.tools).toEqual([
      { type: "web_search_20260209", name: "web_search", max_uses: 6 },
      {
        type: "web_fetch_20260309",
        name: "web_fetch",
        max_uses: 3,
        max_content_tokens: RESEARCH_WEB_FETCH_MAX_CONTENT_TOKENS,
      },
    ]);
    expect(RESEARCH_WEB_FETCH_MAX_CONTENT_TOKENS).toBe(6000);
    expect(requestOptions.signal).toBeInstanceOf(AbortSignal);

    const [preflightArgs] = mockPreflight.mock.calls[0]!;
    expect(preflightArgs).toMatchObject({
      tenantId: CLIENT_ID,
      userId: "user-1",
      workflow: "deliverable:research:current_state_assessment",
      dataClass: "internal",
      workload: PUBLIC_RESEARCH_WORKLOAD,
      artifactType: "deliverable_current_state_assessment",
      model: body.model,
    });
    expect(AI_WORKLOADS[PUBLIC_RESEARCH_WORKLOAD]).toEqual({
      module: "moves",
      lane: "offline-generation",
    });
    // What reached egress is the screened brief and the fixed instructions.
    expect(preflightArgs.prompt).toContain("Industry: healthcare idn");
    expect(preflightArgs.prompt).toContain(body.system);
    expect(preflightArgs.prompt).not.toMatch(/Northwind|meridian/i);
    expect(body.messages).toEqual([
      {
        role: "user",
        content: expect.stringContaining(
          "Archetype: ambient clinical documentation",
        ),
      },
    ]);
  });

  it("stores at most the per-run limit of sources", async () => {
    const urls = Array.from(
      { length: PUBLIC_SOURCES_PER_RUN_MAX + 3 },
      (_, i) => `https://s${i}.example.org/`,
    );
    mockCreate.mockResolvedValue(
      message([
        ...urls.map((url, i) => cited(`c${i}`, url, `Passage ${i}.`)),
        json(urls.map((url) => annotation(url))),
      ]),
    );
    await run();
    const sources = mockInsertSources.mock.calls[0]![2] as { url: string }[];
    expect(PUBLIC_SOURCES_PER_RUN_MAX).toBe(12);
    expect(sources).toHaveLength(PUBLIC_SOURCES_PER_RUN_MAX);
    expect(sources.map((s) => s.url)).toEqual(
      urls.slice(0, PUBLIC_SOURCES_PER_RUN_MAX),
    );
    expect(lastRunWrite().sourceCount).toBe(PUBLIC_SOURCES_PER_RUN_MAX);
  });
});

describe("pause_turn", () => {
  it("resumes a paused turn by sending the paused content back, then parses all turns", async () => {
    const paused = [
      searchUse("srv_1"),
      searchResult([{ url: URL_A, title: "Payment rule", page_age: null }]),
    ];
    mockCreate
      .mockResolvedValueOnce(message(paused, "pause_turn"))
      .mockResolvedValueOnce(
        message([cited("a", URL_A, "Passage A."), json([annotation(URL_A)])]),
      );
    const out = await run();
    expect(mockCreate).toHaveBeenCalledTimes(2);
    const second = mockCreate.mock.calls[1]![0];
    expect(second.messages).toEqual([
      mockCreate.mock.calls[0]![0].messages[0],
      { role: "assistant", content: paused },
    ]);
    expect(second.messages).toHaveLength(2);
    expect(out.status).toBe("ok");
    expect(out.pendingSources).toBe(1);
  });

  it("accumulates every paused turn when resuming more than once", async () => {
    const first = [searchUse("srv_1")];
    const secondTurn = [searchUse("srv_2")];
    mockCreate
      .mockResolvedValueOnce(message(first, "pause_turn"))
      .mockResolvedValueOnce(message(secondTurn, "pause_turn"))
      .mockResolvedValueOnce(
        message([cited("a", URL_A, "Passage A."), json([annotation(URL_A)])]),
      );
    await run();
    expect(mockCreate.mock.calls[2]![0].messages[1]).toEqual({
      role: "assistant",
      content: [...first, ...secondTurn],
    });
  });

  it("stops at the continuation bound and records a parse failure, not a throw", async () => {
    mockCreate.mockResolvedValue(message([searchUse("srv_x")], "pause_turn"));
    const out = await run();
    expect(mockCreate).toHaveBeenCalledTimes(RESEARCH_MAX_CONTINUATIONS + 1);
    expect(out.status).toBe("failed");
    expect(out.error).toMatch(/^parse_failure: .*continuation bound/);
    expect(lastRunWrite()).toMatchObject({ status: "failed" });
  });

  it("does not resume once the tool-use budget is spent", async () => {
    mockCreate.mockResolvedValue(
      message(
        Array.from({ length: RESEARCH_MAX_TOOL_USES }, (_, i) =>
          searchUse(`srv_${i}`),
        ),
        "pause_turn",
      ),
    );
    await run();
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("still resumes one tool use under the budget", async () => {
    mockCreate
      .mockResolvedValueOnce(
        message(
          Array.from({ length: RESEARCH_MAX_TOOL_USES - 1 }, (_, i) =>
            searchUse(`srv_${i}`),
          ),
          "pause_turn",
        ),
      )
      .mockResolvedValueOnce(
        message([cited("a", URL_A, "Passage A."), json([annotation(URL_A)])]),
      );
    await run();
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});

describe("failures continue the build and are recorded", () => {
  it("times out on the abort signal and records `timeout`", async () => {
    mockCreate.mockImplementation(
      (_body, opts: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          opts.signal.addEventListener("abort", () =>
            reject(
              Object.assign(new Error("aborted"), {
                name: "APIUserAbortError",
              }),
            ),
          );
        }),
    );
    const out = await run({}, 20);
    expect(out).toMatchObject({
      status: "timeout",
      pendingSources: 0,
      recorded: true,
      note: "No outside sources: research timeout",
    });
    expect(lastRunWrite()).toMatchObject({
      status: "timeout",
      sourceCount: 0,
      auditId: "audit-1",
    });
    expect(lastRunWrite().error).toMatch(/timeout after 20 ms/);
    expect(mockInsertSources).not.toHaveBeenCalled();
  });

  it("records `failed`, not `timeout`, for a model error before the deadline", async () => {
    mockCreate.mockRejectedValue(new Error("overloaded"));
    const out = await run();
    expect(out.status).toBe("failed");
    expect(lastRunWrite().error).toBe("model_call_failed: overloaded");
  });

  it("records `denied` when egress refuses, and never calls the model", async () => {
    mockPreflight.mockResolvedValue({
      ok: false,
      reason: "tenant policy disallows external AI",
      auditId: "audit-denied",
      dataClass: "internal",
      policyDecision: "deny",
    });
    const out = await run();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(out).toMatchObject({
      status: "denied",
      auditId: "audit-denied",
      note: "No outside sources: research denied",
    });
    expect(lastRunWrite()).toMatchObject({
      status: "denied",
      auditId: "audit-denied",
      error: "egress_denied: tenant policy disallows external AI",
    });
  });

  it("records `failed` when the preflight itself throws", async () => {
    mockPreflight.mockRejectedValue(new Error("policy read failed"));
    const out = await run();
    expect(out.status).toBe("failed");
    expect(lastRunWrite()).toMatchObject({
      status: "failed",
      auditId: null,
      error: "preflight_failed: policy read failed",
    });
  });

  it("records `failed` on a parse failure and stores nothing", async () => {
    mockCreate.mockResolvedValue(
      message([
        cited("a", URL_A, "Passage A."),
        { type: "text", text: "no list", citations: null },
      ]),
    );
    const out = await run();
    expect(out).toMatchObject({
      status: "failed",
      pendingSources: 0,
      note: "No outside sources: research failed",
    });
    expect(lastRunWrite().error).toBe(
      "parse_failure: no JSON source list in the answer",
    );
    expect(mockInsertSources).not.toHaveBeenCalled();
  });

  it("records `failed` on a refusal", async () => {
    mockCreate.mockResolvedValue(
      message([json([annotation(URL_A)])], "refusal"),
    );
    const out = await run();
    expect(out.status).toBe("failed");
    expect(lastRunWrite().error).toBe("model_refused");
  });

  it("reports an ok search with nothing citable as no outside sources", async () => {
    mockCreate.mockResolvedValue(message([json([annotation(URL_A)])]));
    const out = await run();
    expect(out).toMatchObject({
      status: "ok",
      pendingSources: 0,
      note: "No outside sources found",
    });
    expect(mockInsertSources).not.toHaveBeenCalled();
  });

  it("counts only newly stored sources as pending", async () => {
    mockCreate.mockResolvedValue(goodTurn());
    mockInsertSources.mockImplementation(
      async (_scope, _runId, sources: unknown[]) => ({
        ok: true,
        inserted: sources.slice(0, 1),
        duplicates: 1,
        rejected: [],
      }),
    );
    const out = await run();
    expect(out).toMatchObject({
      status: "ok",
      pendingSources: 1,
      note: "1 outside source found, awaiting review",
    });
    expect(lastRunWrite().sourceCount).toBe(2);
  });

  it("reports a source write failure as failed", async () => {
    mockCreate.mockResolvedValue(goodTurn());
    mockInsertSources.mockResolvedValue({
      ok: false,
      reason: "write_failed",
      detail: "x",
    });
    const out = await run();
    expect(out).toMatchObject({
      status: "failed",
      recorded: true,
      runId: RUN_ID,
      error: "sources not stored: write_failed",
    });
  });

  it("reports an unrecorded run without throwing", async () => {
    mockCreate.mockResolvedValue(goodTurn());
    mockInsertRun.mockResolvedValue({
      ok: false,
      reason: "write_failed",
      detail: "no table",
    });
    const out = await run();
    expect(out).toMatchObject({
      status: "failed",
      recorded: false,
      runId: null,
    });
    expect(out.error).toMatch(/^run not recorded: write_failed/);
    expect(mockInsertSources).not.toHaveBeenCalled();
  });

  it("never throws even when the repository throws", async () => {
    mockFindReusable.mockRejectedValue(new Error("boom"));
    const out = await run();
    expect(out).toMatchObject({ status: "failed", origin: "not_run" });
    expect(out.error).toBe("research_step_failed: boom");
  });

  it("records `skipped` for a brief with nothing left to research, without egress", async () => {
    const out = await run({
      brief: {
        industry: "8 hospitals",
        archetype: "Northwind rollout",
        deniedNames: ["Northwind"],
      },
    });
    expect(mockPreflight).not.toHaveBeenCalled();
    expect(out).toMatchObject({
      status: "skipped",
      origin: "not_run",
      recorded: true,
    });
    expect(lastRunWrite()).toMatchObject({
      status: "skipped",
      error: "empty_brief",
      sourceCount: 0,
    });
  });

  it("does nothing at all for an unenrolled tenant", async () => {
    mockFlag.on = false;
    const out = await run();
    expect(out).toMatchObject({
      status: "skipped",
      origin: "not_run",
      recorded: false,
      error: "flag_off",
    });
    expect(mockPreflight).not.toHaveBeenCalled();
    expect(mockInsertRun).not.toHaveBeenCalled();
    expect(mockFindReusable).not.toHaveBeenCalled();
  });
});

describe("cache", () => {
  it("reuses a recent ok run for the same brief instead of searching", async () => {
    mockFindReusable.mockResolvedValue({
      ok: true,
      run: { id: "run-cached", auditId: "audit-old", sourceCount: 4 },
      pendingSourceCount: 3,
    });
    const out = await run();
    expect(mockPreflight).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockInsertRun).not.toHaveBeenCalled();
    expect(out).toMatchObject({
      status: "ok",
      origin: "cache",
      runId: "run-cached",
      pendingSources: 3,
      recorded: false,
      note: "3 outside sources found, awaiting review",
    });
    const [scope, hash, since] = mockFindReusable.mock.calls[0]!;
    expect(scope).toEqual({ tenantKey: "meridian", programId: MOVE });
    expect(hash).toBe(out.briefHash);
    expect(RESEARCH_CACHE_DAYS).toBe(14);
    expect(since).toBe(
      new Date(NOW.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    );
  });

  it("searches when there is no reusable run, or the cache read fails", async () => {
    mockCreate.mockResolvedValue(goodTurn());
    await run();
    mockFindReusable.mockResolvedValue({
      ok: false,
      reason: "read_failed",
      detail: "x",
    });
    await run();
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("uses the singular for one pending source", async () => {
    mockFindReusable.mockResolvedValue({
      ok: true,
      run: { id: "r", auditId: null },
      pendingSourceCount: 1,
    });
    expect((await run()).note).toBe("1 outside source found, awaiting review");
  });
});

describe("build hook", () => {
  const stored: PublicResearchOutcome = {
    status: "ok",
    origin: "searched",
    runId: RUN_ID,
    briefHash: "h",
    pendingSources: 2,
    recorded: true,
    auditId: "audit-1",
    note: "2 outside sources found, awaiting review",
    error: null,
  };
  const order: string[] = [];
  const assemble = jest.fn(async () => {
    order.push("assemble");
    return {
      evidence: [],
      sourceRegister: [],
      retrievedCount: 0,
      coverage: {
        approvedAvailable: 0,
        retrieved: 0,
        packed: 0,
        droppedForBudget: 0,
        unreadable: 0,
        cited: 0,
        coverageRatio: null,
        coverageState: "no_approved_evidence",
        requiresAttention: false,
        usedTokens: 0,
        evidenceTokenBudget: 1000,
      },
    };
  });
  const generate = jest.fn(async () => ({
    ok: false,
    blockedReason: "stop here",
    quality: { pass: false, blockers: [], warnings: [] },
  }));
  const research = jest.fn(async () => {
    order.push("research");
    return stored;
  });
  const buildInput = {
    module: "moves" as const,
    useCaseArchetype: "ambient_clinical_documentation",
    deliverableType: "current_state_assessment",
    decisionContext: "decide",
    clientDisplayName: "Northwind Regional Care",
    initiativeDisplayName: "Notes",
    tenantClientKey: "meridian",
    clientId: CLIENT_ID,
    userId: "user-1",
    sourceArtifactRef: MOVE,
    phase: 2,
    publicResearchBrief: {
      useCase: "clinical note drafting",
      valueLevers: ["cycle time"],
    },
  };
  const deps = () => ({
    assemble: assemble as never,
    generate: generate as never,
    research,
    loadPublicSources: async () => [],
  });

  beforeEach(() => {
    order.length = 0;
  });

  it("is registered as a tenant flag that enrolls the demo tenant", () => {
    expect(getFeatureFlagDefinition(PUBLIC_RESEARCH_FLAG)).toMatchObject({
      policy: "tenant",
      includeTenants: ["meridian"],
    });
  });

  it("does nothing when the flag is off", async () => {
    mockFlag.on = false;
    const out = await runDeliverableForTenant(buildInput, deps());
    expect(research).not.toHaveBeenCalled();
    expect(out.publicResearch).toBeUndefined();
    expect(out.warnings ?? []).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/public_research/)]),
    );
    expect(assemble).toHaveBeenCalled();
  });

  it("does nothing for a non-Moves build even with the flag on", async () => {
    const out = await runDeliverableForTenant(
      { ...buildInput, module: "source" },
      deps(),
    );
    expect(research).not.toHaveBeenCalled();
    expect(out.publicResearch).toBeUndefined();
  });

  it("runs before assembly, stores only, and reports the coverage note", async () => {
    const out = await runDeliverableForTenant(buildInput, deps());
    expect(order).toEqual(["research", "assemble"]);
    expect(research).toHaveBeenCalledWith({
      tenantClientKey: "meridian",
      clientId: CLIENT_ID,
      userId: "user-1",
      programId: MOVE,
      phase: 2,
      deliverableType: "current_state_assessment",
      brief: {
        industry: "HEALTHCARE_IDN",
        archetype: "ambient_clinical_documentation",
        useCase: "clinical note drafting",
        valueLevers: ["cycle time"],
        registerQuestions: [],
        deniedNames: ["Northwind Regional Care"],
      },
    });
    expect(out.publicResearch).toEqual(stored);
    expect(out.warnings).toContain(
      "public_research: 2 outside sources found, awaiting review",
    );
    // Nothing from research reaches the generation request.
    const req = JSON.stringify((generate.mock.calls[0] as unknown[])[0]);
    expect(req).not.toMatch(/outside source|public_research/);
  });

  it("carries the outcome on a successful build", async () => {
    const out = await runDeliverableForTenant(buildInput, {
      ...deps(),
      generate: (async () => ({
        ok: true,
        brief: { module: "moves" },
        document: {
          generatedSections: [{ title: "s", bodyMarkdown: "b" }],
          clientDisplayName: "Client",
          initiativeDisplayName: "Notes",
        },
        quality: { pass: true, warnings: [] },
        passTrace: [],
      })) as never,
      persist: (async () => ({ id: "art-1", blobUrl: "/a" })) as never,
      loadPolicy: (async () => ({ tenantId: "t", policy: {} })) as never,
    });
    expect(out.ok).toBe(true);
    expect(out.publicResearch).toEqual(stored);
    expect(out.warnings).toContain(
      "public_research: 2 outside sources found, awaiting review",
    );
  });

  it("continues the build when the research step throws", async () => {
    research.mockRejectedValueOnce(new Error("unexpected"));
    const out = await runDeliverableForTenant(buildInput, deps());
    expect(assemble).toHaveBeenCalled();
    expect(generate).toHaveBeenCalled();
    expect(out.publicResearch).toMatchObject({
      status: "failed",
      note: "No outside sources: research failed",
      error: "research_step_failed: unexpected",
    });
    expect(out.warnings).toContain(
      "public_research: No outside sources: research failed",
    );
  });
});
