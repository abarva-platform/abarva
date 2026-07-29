/**
 * Provider + scenario + aVa behavior tests. These prove:
 * - fixtures produce contract-valid envelopes across all scenarios;
 * - partial/withheld/not_loaded never leak content or coerce values to zero;
 * - the graph honors one-hop default, two-hop on request, candidate opt-in;
 * - aVa refuses without evidence and is unavailable when models are disabled;
 * - the fixture and HTTP providers are interchangeable behind the interface.
 */

import {
  ContractFixtureConsumptionProvider,
  HttpConsumptionApiProvider,
  DeterministicAvaReasoningProvider,
  NullAvaReasoningProvider,
  createFixtureRuntime,
} from "..";
import {
  envelopeMetaSchema,
  findContentSafetyViolations,
  PROJECTION_CONTRACT_VERSION,
  type AvaKnowledgePacket,
  type ConsumptionEnvelope,
  type KnowledgeConsumptionProvider,
} from "../../consumption-contracts";
import { FIXTURE_SCENARIOS, FIXTURE_TENANT_KEYS } from "../../fixtures";

const TENANT = "fixture-airline-demo-new";

function metaOf(env: ConsumptionEnvelope<unknown>) {
  const meta: Record<string, unknown> = { ...env };
  delete meta.data;
  return meta;
}

describe("ContractFixtureConsumptionProvider — every scenario is contract-valid", () => {
  for (const tenantKey of FIXTURE_TENANT_KEYS) {
    for (const scenario of FIXTURE_SCENARIOS) {
      it(`${tenantKey} / ${scenario} → valid brief envelope`, async () => {
        const p = new ContractFixtureConsumptionProvider({ tenantKey, scenario });
        const env = await p.getEnterpriseBrief({ tenantKey });
        expect(envelopeMetaSchema.safeParse(metaOf(env)).success).toBe(true);
        expect(findContentSafetyViolations(env)).toEqual([]);
      });
    }
  }
});

describe("partial-data semantics", () => {
  it("withheld scenario empties content and sets availability withheld", async () => {
    const p = new ContractFixtureConsumptionProvider({ tenantKey: TENANT, scenario: "withheld" });
    const env = await p.getEnterpriseBrief({ tenantKey: TENANT });
    expect(env.availabilityState).toBe("withheld");
    expect(env.data.perspectives).toEqual([]);
    expect(env.data.interpretation).toBeNull();
    expect(env.warnings.some((w) => w.code === "evidence_withheld")).toBe(true);
  });

  it("not_loaded scenario suppresses data and warns", async () => {
    const p = new ContractFixtureConsumptionProvider({ tenantKey: TENANT, scenario: "not_loaded" });
    const env = await p.exploreEntities({ tenantKey: TENANT });
    expect(env.availabilityState).toBe("not_loaded");
    expect(env.data.entities).toEqual([]);
  });

  it("never coerces a not_measured metric to zero", async () => {
    const p = new ContractFixtureConsumptionProvider({ tenantKey: TENANT, scenario: "normal" });
    const env = await p.getEnterpriseBrief({ tenantKey: TENANT });
    const cloud = env.data.headlineMetrics.find((m) => m.metricKey === "enterprise.cloud_pct");
    expect(cloud?.value).toBeNull();
    expect(cloud?.availabilityState).toBe("not_measured");
  });

  it("stale scenario backdates as-of and marks freshness stale", async () => {
    const p = new ContractFixtureConsumptionProvider({ tenantKey: TENANT, scenario: "stale" });
    const env = await p.getEnterpriseBrief({ tenantKey: TENANT });
    expect(env.freshnessState).toBe("stale");
    expect(Date.parse(env.asOf)).toBeLessThan(Date.parse("2026-07-27T00:00:00.000Z"));
  });

  it("api_failure_lkg surfaces a last-known-good warning", async () => {
    const p = new ContractFixtureConsumptionProvider({ tenantKey: TENANT, scenario: "api_failure_lkg" });
    const env = await p.getEnterpriseBrief({ tenantKey: TENANT });
    expect(env.warnings.some((w) => w.code === "last_known_good")).toBe(true);
  });
});

describe("relationships graph", () => {
  const base = {
    tenantKey: TENANT,
    knowledgeBaselineRef: "kb",
    focalEntityRefs: ["app-crew-sched"],
    direction: "both" as const,
    currentTargetScope: "both" as const,
    authorityMinimum: "accepted" as const,
    maxNodes: 40,
    maxEdges: 60,
  };

  it("one hop is the default and excludes hop-2 nodes", async () => {
    const p = new ContractFixtureConsumptionProvider({ tenantKey: TENANT, scenario: "normal" });
    const env = await p.getRelationships({ ...base, hopDepth: 1 });
    expect(env.data.nodes.every((n) => n.hop <= 1)).toBe(true);
    expect(env.data.truncated).toBe(true);
  });

  it("two hops includes hop-2 nodes on request", async () => {
    const p = new ContractFixtureConsumptionProvider({ tenantKey: TENANT, scenario: "normal" });
    const env = await p.getRelationships({ ...base, hopDepth: 2 });
    expect(env.data.nodes.some((n) => n.hop === 2)).toBe(true);
  });

  it("candidate edges are excluded unless opted in", async () => {
    const p = new ContractFixtureConsumptionProvider({ tenantKey: TENANT, scenario: "normal" });
    const off = await p.getRelationships({ ...base, hopDepth: 2, includeCandidates: false });
    const on = await p.getRelationships({ ...base, hopDepth: 2, includeCandidates: true });
    expect(off.data.edges.every((e) => e.authorityState !== "candidate")).toBe(true);
    expect(on.data.edges.some((e) => e.authorityState === "candidate")).toBe(true);
  });
});

describe("aVa reasoning path", () => {
  const packet = (evidenceRefs: string[]): AvaKnowledgePacket => ({
    tenantKey: TENANT,
    knowledgeBaselineRef: "kb",
    domainPublicationVersions: {},
    consumptionProjectionVersions: {},
    cubeSemanticModelVersion: null,
    mode: "brief",
    lens: "none",
    depth: "executive",
    currentTargetScope: "current",
    focalEntityRefs: [],
    activeFilters: {},
    permissionBoundaryRef: "tenant:x",
    executivePerspectiveRefs: [],
    acceptedFactRefs: [],
    relationshipEdgeRefs: [],
    metricQueryHashes: [],
    evidenceRefs,
    knownGapRefs: [],
    blockedSourceRefs: [],
  });

  it("refuses when no evidence is in scope (never estimates)", async () => {
    const ava = new DeterministicAvaReasoningProvider();
    const a = await ava.ask({ intent: "explain", question: "x", packet: packet([]) });
    expect(a.outcome).toBe("refused");
    expect(a.promoted).toBe(false);
  });

  it("answers grounded in evidence and stays ephemeral", async () => {
    const ava = new DeterministicAvaReasoningProvider();
    const a = await ava.ask({ intent: "explain", question: "x", packet: packet(["ev-1", "ev-2"]) });
    expect(a.outcome).toBe("answered");
    expect(a.evidenceRefs.length).toBeGreaterThan(0);
    expect(a.promoted).toBe(false);
  });

  it("is unavailable when models are disabled", () => {
    expect(new NullAvaReasoningProvider().isAvailable()).toBe(false);
    const rt = createFixtureRuntime(TENANT, "models_disabled");
    expect(rt.ava.isAvailable()).toBe(false);
    expect(rt.modelsEnabled).toBe(false);
  });
});

describe("provider interchangeability", () => {
  it("both providers satisfy the same interface shape", () => {
    const fixture: KnowledgeConsumptionProvider = new ContractFixtureConsumptionProvider({ tenantKey: TENANT, scenario: "normal" });
    const http: KnowledgeConsumptionProvider = new HttpConsumptionApiProvider(TENANT);
    const methods: (keyof KnowledgeConsumptionProvider)[] = [
      "getEnterpriseBrief", "exploreEntities", "getEntityDetail", "getRelationships",
      "getEvidenceAndGaps", "searchKnowledge", "getSuggestedQuestions", "previewModuleHandoff",
    ];
    for (const m of methods) {
      expect(typeof fixture[m]).toBe("function");
      expect(typeof http[m]).toBe("function");
    }
  });

  it("HTTP provider rejects a contract-violating envelope from the API", async () => {
    const fetchImpl = (async () =>
      new Response(JSON.stringify({ tenantKey: "x", availabilityState: "bogus_state", data: {} }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })) as unknown as typeof fetch;
    const http = new HttpConsumptionApiProvider(TENANT, { fetchImpl });
    await expect(http.getEnterpriseBrief({ tenantKey: TENANT })).rejects.toThrow();
  });

  it("throws with no cache when the API is unavailable (no legacy fallback)", async () => {
    const fetchImpl = (async () => { throw new Error("network down"); }) as unknown as typeof fetch;
    const http = new HttpConsumptionApiProvider(TENANT, { fetchImpl });
    await expect(http.getEnterpriseBrief({ tenantKey: TENANT })).rejects.toThrow(/not available/);
  });

  it("sends the admin canary tenant marker only when configured", async () => {
    const requests: unknown[] = [];
    const fetchImpl = (async (_url: string | URL | Request, init?: RequestInit) => {
      requests.push(JSON.parse(String(init?.body ?? "{}")));
      return new Response(
        JSON.stringify({
          tenantKey: "airline-demo-new",
          knowledgeBaselineRef: "kb",
          domainPublicationVersions: {},
          projectionName: "consumption.enterprise_brief_v1",
          projectionContractVersion: PROJECTION_CONTRACT_VERSION,
          asOf: "2026-07-28T00:00:00.000Z",
          contentHash: "hash",
          authorityState: "published",
          availabilityState: "available",
          freshnessState: "fresh",
          evidenceRefs: [],
          knownGapRefs: [],
          warnings: [],
          data: {},
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }) as unknown as typeof fetch;

    const normal = new HttpConsumptionApiProvider("airline-demo-new", { fetchImpl });
    await normal.getEnterpriseBrief({ tenantKey: "airline-demo-new" });
    const canary = new HttpConsumptionApiProvider("airline-demo-new", {
      fetchImpl,
      adminCanaryTenantKey: "airline-demo-new",
    });
    await canary.getEnterpriseBrief({ tenantKey: "airline-demo-new" });

    expect(requests[0]).not.toHaveProperty("__adminCanaryTenantKey");
    expect(requests[1]).toHaveProperty("__adminCanaryTenantKey", "airline-demo-new");
  });

  it("refuses to construct a fixture provider for an unknown tenant (no fallback)", () => {
    expect(() => new ContractFixtureConsumptionProvider({ tenantKey: "skyharbor-air", scenario: "normal" })).toThrow();
  });
});
