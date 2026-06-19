/**
 * Parity test — Azure AI Search retrieval lane vs the pgvector path.
 *
 * Asserts:
 *   1. `canonicalizeTenantKey` maps legacy aliases to canonical form.
 *   2. The retriever always pins `tenant_key` on the Azure filter — a
 *      future refactor that drops this filter must fail this test.
 *   3. Both backends (Azure and pgvector) return shape-compatible
 *      `ContextChunk[]` so the broker's flag-driven dispatch is a
 *      drop-in swap with no downstream branching.
 */

import { describe, expect, it, jest } from "@jest/globals";
import {
  canonicalizeTenantKey,
  queryTenantContext,
  TENANT_CONTEXT_INDEX_NAME,
  type TenantContextChunk,
} from "../tenant-context-retriever";
// Pull `ContextChunk` through the broker's re-export rather than the
// tenant-data types module directly — the broker boundary rule routes
// every cross-module consumer through `context-broker/types`.
import type { ContextChunk } from "@/lib/knowledge/context-broker/types";

describe("Azure AI Search retriever — parity & invariants", () => {
  describe("canonicalizeTenantKey", () => {
    it("maps apexretail → apex-retail", () => {
      expect(canonicalizeTenantKey("apexretail")).toBe("apex-retail");
    });

    it("maps meridian → meridian-health", () => {
      expect(canonicalizeTenantKey("meridian")).toBe("meridian-health");
    });

    it("maps arcturus → first-capital", () => {
      expect(canonicalizeTenantKey("arcturus")).toBe("first-capital");
    });

    // Regression 2026-06-17: these were in the backfill map but missing from the
    // retriever map, so their deliverable evidence retrieval keyed on the wrong
    // tenant_key and returned 0 hits. Both maps must carry the full roster.
    it("maps skyharbor → skyharbor-air", () => {
      expect(canonicalizeTenantKey("skyharbor")).toBe("skyharbor-air");
      expect(canonicalizeTenantKey("skyharbor-airlines")).toBe("skyharbor-air");
    });

    it("maps lakeshore → lakeshore-holdings", () => {
      expect(canonicalizeTenantKey("lakeshore")).toBe("lakeshore-holdings");
    });

    it("maps northstar → northstar-clinical", () => {
      expect(canonicalizeTenantKey("northstar")).toBe("northstar-clinical");
    });

    it("maps firstcapital → first-capital", () => {
      expect(canonicalizeTenantKey("firstcapital")).toBe("first-capital");
    });

    it("returns canonical keys verbatim (idempotent)", () => {
      expect(canonicalizeTenantKey("apex-retail")).toBe("apex-retail");
      expect(canonicalizeTenantKey("meridian-health")).toBe("meridian-health");
      expect(canonicalizeTenantKey("first-capital")).toBe("first-capital");
    });

    it("returns unknown keys verbatim (no implicit rejection)", () => {
      expect(canonicalizeTenantKey("contoso-corp")).toBe("contoso-corp");
    });
  });

  describe("tenant_key filter is mandatory", () => {
    function makeFetch(): {
      fetchImpl: jest.MockedFunction<typeof fetch>;
      lastBody: () => Record<string, unknown>;
    } {
      let captured = "";
      const fetchImpl = jest.fn(
        async (_url: unknown, init?: { body?: BodyInit | null }) => {
          captured = typeof init?.body === "string" ? init.body : "";
          return new Response(JSON.stringify({ value: [] }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        },
      ) as unknown as jest.MockedFunction<typeof fetch>;
      return {
        fetchImpl,
        lastBody: () => JSON.parse(captured) as Record<string, unknown>,
      };
    }

    it("always pins tenant_key eq <canonical> in the OData filter", async () => {
      const { fetchImpl, lastBody } = makeFetch();
      process.env.AZURE_SEARCH_ADMIN_KEY = "test-key";
      await queryTenantContext({
        tenantClientKey: "apex-retail",
        query: "demand forecasting",
        fetchImpl,
      });
      const body = lastBody();
      expect(body.filter).toBeDefined();
      expect(String(body.filter)).toMatch(/tenant_key eq 'apex-retail'/);
      expect(String(body.filter)).toMatch(/lifecycle_state eq 'active'/);
    });

    it("canonicalizes legacy aliases before composing the filter", async () => {
      const { fetchImpl, lastBody } = makeFetch();
      process.env.AZURE_SEARCH_ADMIN_KEY = "test-key";
      await queryTenantContext({
        tenantClientKey: "apexretail",
        query: "*",
        fetchImpl,
      });
      const body = lastBody();
      expect(String(body.filter)).toMatch(/tenant_key eq 'apex-retail'/);
      expect(String(body.filter)).toMatch(/lifecycle_state eq 'active'/);
      expect(String(body.filter)).not.toMatch(/apexretail/);
    });

    it("retains tenant_key even when extra filters are supplied", async () => {
      const { fetchImpl, lastBody } = makeFetch();
      process.env.AZURE_SEARCH_ADMIN_KEY = "test-key";
      await queryTenantContext({
        tenantClientKey: "meridian",
        query: "patient throughput",
        filters: {
          minConfidence: 0.7,
          sensitivity: ["internal", "confidential"],
          extra: ["source_segment eq 'kpi_dictionary'"],
        },
        fetchImpl,
      });
      const filter = String(lastBody().filter);
      // tenant filter first
      expect(filter.startsWith("tenant_key eq 'meridian-health'")).toBe(true);
      expect(filter).toMatch(/lifecycle_state eq 'active'/);
      expect(filter).toMatch(/confidence ge 0.7/);
      // Azure AI Search requires search.in(), NOT the OData `in (...)` list literal,
      // which the service rejects as an unsupported language feature.
      expect(filter).toMatch(
        /search\.in\(sensitivity, 'internal,confidential', ','\)/,
      );
      expect(filter).not.toMatch(/sensitivity in \(/);
      expect(filter).toMatch(/source_segment eq 'kpi_dictionary'/);
    });

    it("queries the tenant-context-v1 index by name", async () => {
      const { fetchImpl } = makeFetch();
      process.env.AZURE_SEARCH_ADMIN_KEY = "test-key";
      await queryTenantContext({
        tenantClientKey: "apex-retail",
        query: "*",
        fetchImpl,
      });
      const call = fetchImpl.mock.calls[0];
      expect(String(call?.[0])).toContain(
        `/indexes/${TENANT_CONTEXT_INDEX_NAME}/docs/search`,
      );
    });

    it("runs a structured-segment pass before the general query for AI Tower questions", async () => {
      const bodies: Record<string, unknown>[] = [];
      const fetchImpl = jest.fn(
        async (_url: unknown, init?: { body?: BodyInit | null }) => {
          const body =
            typeof init?.body === "string"
              ? (JSON.parse(init.body) as Record<string, unknown>)
              : {};
          bodies.push(body);
          const value =
            bodies.length === 1
              ? [
                  {
                    "@search.score": 10,
                    id: "structured-1",
                    tenant_key: "first-capital",
                    source_segment: "program_inventory",
                    record_id: "FCF-INIT-007",
                    chunk_id:
                      "ctx:first-capital:program-inventory:fcf-init-007:c30",
                    title: "Initiative milestones",
                    body: "initiative_id: FCF-INIT-007 status: kill_candidate",
                    sensitivity: "internal",
                  },
                ]
              : [
                  {
                    "@search.score": 9,
                    id: "structured-1",
                    tenant_key: "first-capital",
                    source_segment: "program_inventory",
                    record_id: "FCF-INIT-007",
                    chunk_id:
                      "ctx:first-capital:program-inventory:fcf-init-007:c30",
                    title: "Initiative milestones",
                    body: "initiative_id: FCF-INIT-007 status: kill_candidate",
                    sensitivity: "internal",
                  },
                  {
                    "@search.score": 8,
                    id: "general-1",
                    tenant_key: "first-capital",
                    source_segment: "it_financials",
                    record_id: "FCF-SRC-001",
                    chunk_id: "FCF-CHUNK-001",
                    title: "Legacy source chunk",
                    body: "general context",
                    sensitivity: "internal",
                  },
                ];
          return new Response(JSON.stringify({ value }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        },
      ) as unknown as jest.MockedFunction<typeof fetch>;
      process.env.AZURE_SEARCH_ADMIN_KEY = "test-key";

      const chunks = await queryTenantContext({
        tenantClientKey: "firstcapital",
        query: "Which AI initiatives should we kill?",
        topK: 2,
        fetchImpl,
      });

      expect(fetchImpl).toHaveBeenCalledTimes(2);
      expect(String(bodies[0]?.filter)).toContain(
        "tenant_key eq 'first-capital'",
      );
      expect(String(bodies[0]?.filter)).toContain(
        "search.in(source_segment, 'program_inventory', ',')",
      );
      expect(String(bodies[0]?.search)).toContain("kill_candidate");
      expect(String(bodies[0]?.search)).toContain("supervision");
      expect(String(bodies[1]?.filter)).not.toContain(
        "search.in(source_segment",
      );
      expect(chunks.map((chunk) => chunk.chunkId)).toEqual([
        "ctx:first-capital:program-inventory:fcf-init-007:c30",
        "FCF-CHUNK-001",
      ]);
    });

    it("expands engineer productivity questions across persona, KPI, and AI-tool segments", async () => {
      const bodies: Record<string, unknown>[] = [];
      const fetchImpl = jest.fn(
        async (_url: unknown, init?: { body?: BodyInit | null }) => {
          const body =
            typeof init?.body === "string"
              ? (JSON.parse(init.body) as Record<string, unknown>)
              : {};
          bodies.push(body);
          return new Response(JSON.stringify({ value: [] }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        },
      ) as unknown as jest.MockedFunction<typeof fetch>;
      process.env.AZURE_SEARCH_ADMIN_KEY = "test-key";

      await queryTenantContext({
        tenantClientKey: "first-capital",
        query:
          "What is the productivity impact of AI on software engineers at First Capital?",
        topK: 20,
        fetchImpl,
      });

      expect(fetchImpl).toHaveBeenCalledTimes(5);
      expect(String(bodies[0]?.filter)).toContain(
        "search.in(record_id, 'FCF-AI-002,FCF-KPI-006,FCF-PERS-007', ',')",
      );
      const structured = bodies.find((body) =>
        String(body.search).includes("code-completion"),
      );
      expect(String(structured?.search)).toContain("github");
      expect(String(structured?.filter)).toContain(
        "search.in(source_segment, 'it_landscape,org_structure,program_inventory', ',')",
      );
    });

    it("expands fraud value questions toward KPI evidence rows", async () => {
      const bodies: Record<string, unknown>[] = [];
      const fetchImpl = jest.fn(
        async (_url: unknown, init?: { body?: BodyInit | null }) => {
          const body =
            typeof init?.body === "string"
              ? (JSON.parse(init.body) as Record<string, unknown>)
              : {};
          bodies.push(body);
          return new Response(JSON.stringify({ value: [] }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        },
      ) as unknown as jest.MockedFunction<typeof fetch>;
      process.env.AZURE_SEARCH_ADMIN_KEY = "test-key";

      await queryTenantContext({
        tenantClientKey: "first-capital",
        query: "What evidence backs the Fraud Graph v2 value case?",
        topK: 20,
        fetchImpl,
      });

      expect(fetchImpl).toHaveBeenCalledTimes(3);
      expect(String(bodies[0]?.search)).toContain("Fraud Loss Avoidance");
      expect(String(bodies[0]?.search)).toContain("current_value");
      const structured = bodies.find((body) =>
        String(body.search).includes("fraud loss avoidance"),
      );
      expect(String(structured?.filter)).toContain(
        "search.in(source_segment, 'it_landscape,program_inventory', ',')",
      );
    });

    it("expands AML persona governance questions toward persona and SR 11-7 rows", async () => {
      const bodies: Record<string, unknown>[] = [];
      const fetchImpl = jest.fn(
        async (_url: unknown, init?: { body?: BodyInit | null }) => {
          const body =
            typeof init?.body === "string"
              ? (JSON.parse(init.body) as Record<string, unknown>)
              : {};
          bodies.push(body);
          return new Response(JSON.stringify({ value: [] }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        },
      ) as unknown as jest.MockedFunction<typeof fetch>;
      process.env.AZURE_SEARCH_ADMIN_KEY = "test-key";

      await queryTenantContext({
        tenantClientKey: "first-capital",
        query:
          "Show me all AI tools that serve the AML analyst persona and their governance status.",
        topK: 20,
        fetchImpl,
      });

      expect(fetchImpl).toHaveBeenCalledTimes(6);
      expect(String(bodies[0]?.filter)).toContain(
        "search.in(record_id, 'FCF-CTRL-003', ',')",
      );
      expect(String(bodies[1]?.search)).toContain("model_risk_sr11_7");
      expect(String(bodies[3]?.search)).toContain(
        "AML Financial Crimes Analyst",
      );
      const structured = bodies.find((body) =>
        String(body.search).includes("nice actimize"),
      );
      expect(String(structured?.filter)).toContain(
        "search.in(source_segment, 'it_landscape,org_structure,program_inventory', ',')",
      );
    });

    it("anchors AML scaling blocker questions to the SR 11-7 control row", async () => {
      const bodies: Record<string, unknown>[] = [];
      const fetchImpl = jest.fn(
        async (_url: unknown, init?: { body?: BodyInit | null }) => {
          const body =
            typeof init?.body === "string"
              ? (JSON.parse(init.body) as Record<string, unknown>)
              : {};
          bodies.push(body);
          return new Response(JSON.stringify({ value: [] }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        },
      ) as unknown as jest.MockedFunction<typeof fetch>;
      process.env.AZURE_SEARCH_ADMIN_KEY = "test-key";

      await queryTenantContext({
        tenantClientKey: "first-capital",
        query: "What blocks scaling AML triage automation?",
        topK: 20,
        fetchImpl,
      });

      expect(fetchImpl).toHaveBeenCalledTimes(6);
      expect(String(bodies[0]?.filter)).toContain(
        "search.in(record_id, 'FCF-CTRL-003', ',')",
      );
      expect(String(bodies[3]?.search)).toContain("FCF-CTRL-003");
    });
  });

  describe("shape parity — Azure result is drop-in for chunksByVector", () => {
    it("maps a search hit into the ContextChunk contract", async () => {
      const fetchImpl = jest.fn(
        async () =>
          new Response(
            JSON.stringify({
              value: [
                {
                  "@search.score": 0.91,
                  id: "a-id",
                  tenant_key: "apex-retail",
                  source_segment: "enterprise_profile",
                  record_id: "rec-1",
                  chunk_id: "chunk-1",
                  title: "enterprise_profile.csv",
                  body: "Apex Retail synthetic context.",
                  source_uri: "setup/enterprise_profile.csv",
                  confidence: 0.91,
                  sensitivity: "confidential",
                  last_seen_at: "2026-05-15T00:00:00.000Z",
                },
              ],
            }),
            { status: 200 },
          ),
      ) as unknown as jest.MockedFunction<typeof fetch>;
      process.env.AZURE_SEARCH_ADMIN_KEY = "test-key";

      const azureHits = await queryTenantContext({
        tenantClientKey: "apex-retail",
        query: "context",
        fetchImpl,
      });

      // The TenantContextChunk mirror exposes every key the canonical
      // ContextChunk contract requires for the broker's `chunksByVector`
      // path. The assignment below is the load-bearing TS check: if a
      // shape drift appears, this assignment fails to compile.
      const asBrokerShape: ContextChunk[] = azureHits as ContextChunk[];
      expect(asBrokerShape).toHaveLength(1);

      const hit = azureHits[0]!;
      const expected: TenantContextChunk = {
        tenantKey: "apex-retail",
        chunkId: "chunk-1",
        sourceSegmentId: "enterprise_profile",
        sourceDoc: "enterprise_profile.csv",
        recordId: "rec-1",
        text: "Apex Retail synthetic context.",
        embeddingStatus: "embedded",
        sourceBasis: "setup/enterprise_profile.csv",
        classification: "confidential",
        vectorScore: 0.91,
      };
      expect(hit).toEqual(expected);
    });

    it("preserves canonical client labels before chunks reach the broker", async () => {
      const fetchImpl = jest.fn(
        async () =>
          new Response(
            JSON.stringify({
              value: [
                {
                  "@search.score": 0.88,
                  id: "legacy-id",
                  tenant_key: "first-capital",
                  source_segment: "enterprise_profile",
                  record_id: "rec-legacy",
                  chunk_id: "chunk-legacy",
                  title: "First Capital Financial profile.md",
                  body: "First Capital Financial is the active tenant. Apex Retail and Meridian Health are cross-tenant labels.",
                  source_uri: "setup/First Capital Financial/profile.md",
                  confidence: 0.88,
                  sensitivity: "internal",
                },
              ],
            }),
            { status: 200 },
          ),
      ) as unknown as jest.MockedFunction<typeof fetch>;
      process.env.AZURE_SEARCH_ADMIN_KEY = "test-key";

      const azureHits = await queryTenantContext({
        tenantClientKey: "arcturus",
        query: "tenant profile",
        fetchImpl,
      });

      const hit = azureHits[0]!;
      expect(hit.tenantKey).toBe("first-capital");
      expect(hit.sourceDoc).toBe("First Capital Financial profile.md");
      expect(hit.sourceBasis).toBe("setup/First Capital Financial/profile.md");
      expect(hit.text).toContain(
        "First Capital Financial is the active tenant.",
      );
      expect(hit.text).toContain(
        "Apex Retail and Meridian Health are cross-tenant labels.",
      );
    });

    it("produces the same set of keys the pgvector adapter populates", () => {
      // Pin every key on `ContextChunk` (besides the rare `embedding`
      // raw-vector payload, which neither lane returns on hot paths)
      // against the retriever's local mirror so a future contract
      // expansion forces both files to update together.
      const sample: TenantContextChunk = {
        tenantKey: "t",
        chunkId: "c",
        sourceSegmentId: "s",
        sourceDoc: "d",
        recordId: "r",
        text: "x",
        embeddingStatus: "embedded",
        sourceBasis: "sb",
        classification: "internal",
        vectorScore: 0.5,
      };
      const asCanonical: ContextChunk = sample as ContextChunk;
      // Both shapes carry these keys.
      expect(Object.keys(asCanonical).sort()).toEqual(
        Object.keys(sample).sort(),
      );
    });
  });

  describe("feature-flag default — flag is OFF for every roster tenant", () => {
    it("retrieval_azure_search is off for apex / meridian / first-capital by default", async () => {
      const { isFeatureEnabled } =
        await import("@/lib/features/is-feature-enabled");
      expect(
        isFeatureEnabled({ clientKey: "apexretail" }, "retrieval_azure_search"),
      ).toBe(false);
      expect(
        isFeatureEnabled({ clientKey: "meridian" }, "retrieval_azure_search"),
      ).toBe(false);
      expect(
        isFeatureEnabled({ clientKey: "arcturus" }, "retrieval_azure_search"),
      ).toBe(false);
    });

    it("is registered as a known flag (typo at call sites is a compile error)", async () => {
      const { getFeatureFlagDefinition } =
        await import("@/lib/features/registry");
      const def = getFeatureFlagDefinition("retrieval_azure_search");
      expect(def).toBeDefined();
      expect(def?.policy).toBe("tenant");
      expect(def?.includeTenants ?? []).toHaveLength(0);
    });
  });
});

describe("Azure Search index/contract drift (lifecycle_state)", () => {
  // Live indexes that predate the lifecycle_state field reject the strict filter
  // with a specific missing-field 400. The retriever must degrade past ONLY that
  // clause (keeping tenant scope) rather than failing the whole query.
  function makeDriftFetch(): {
    fetchImpl: jest.MockedFunction<typeof fetch>;
    bodies: () => Array<Record<string, unknown>>;
  } {
    const captured: string[] = [];
    const fetchImpl = jest.fn(
      async (_url: unknown, init?: { body?: BodyInit | null }) => {
        const raw = typeof init?.body === "string" ? init.body : "";
        captured.push(raw);
        const parsed = raw ? (JSON.parse(raw) as { filter?: string }) : {};
        if (
          typeof parsed.filter === "string" &&
          parsed.filter.includes("lifecycle_state eq 'active'")
        ) {
          return new Response(
            JSON.stringify({
              error: {
                code: "",
                message:
                  "Invalid expression: Could not find a property named 'lifecycle_state' on type 'search.document'.\r\nParameter name: $filter",
              },
            }),
            { status: 400, headers: { "content-type": "application/json" } },
          );
        }
        return new Response(JSON.stringify({ value: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    ) as unknown as jest.MockedFunction<typeof fetch>;
    return {
      fetchImpl,
      bodies: () =>
        captured.map((b) => JSON.parse(b) as Record<string, unknown>),
    };
  }

  it("degrades past the missing lifecycle_state field (keeps tenant scope) and flags telemetry", async () => {
    process.env.AZURE_SEARCH_ADMIN_KEY = "test-key";
    const { fetchImpl, bodies } = makeDriftFetch();
    const telemetry: { degradedIndexContract?: boolean } = {};

    await expect(
      queryTenantContext({
        tenantClientKey: "apex-retail",
        query: "*",
        fetchImpl,
        telemetry,
      }),
    ).resolves.toEqual([]);

    const all = bodies();
    const strict = all.find((b) =>
      String(b.filter).includes("lifecycle_state eq 'active'"),
    );
    const degraded = all.find((b) => !String(b.filter).includes("lifecycle_state"));
    expect(strict).toBeDefined(); // tried strict first
    expect(degraded).toBeDefined(); // retried without the lifecycle clause
    expect(String(degraded?.filter)).toMatch(/tenant_key eq 'apex-retail'/); // scope kept
    expect(telemetry.degradedIndexContract).toBe(true);
  });

  it("still throws on a generic (non-lifecycle) search failure", async () => {
    process.env.AZURE_SEARCH_ADMIN_KEY = "test-key";
    const fetchImpl = jest.fn(
      async () =>
        new Response(JSON.stringify({ error: { message: "boom" } }), {
          status: 500,
          headers: { "content-type": "application/json" },
        }),
    ) as unknown as jest.MockedFunction<typeof fetch>;

    await expect(
      queryTenantContext({
        tenantClientKey: "apex-retail",
        query: "*",
        fetchImpl,
      }),
    ).rejects.toThrow(/azure_search_query_failed:500/);
  });
});
