/**
 * ContextBroker · CB-1 + CB-3 unit tests.
 *
 * Exercises the per-mode composition discipline against a hand-rolled
 * `TenantDataAdapter` mock. No real DB / Pinecone / OpenAI — vector
 * retrieval is exercised via an injected OpenAIEmbeddingsLike stub
 * and an adapter whose `chunksByVector` is overridden.
 */

import {
  DefaultContextBroker,
  MissingTenantKeyError,
  WARNING_CORPUS_PENDING,
  WARNING_VECTOR_PENDING,
  WARNING_WORLDVIEW_PENDING,
  allowedPatternIndustriesForTenant,
  extractKeywords,
  vectorRetrievalInfoTag,
  type ContextBroker,
  type CorpusPatternRetriever,
} from "..";
import {
  WARNING_CANONICAL_CORPUS_EMPTY,
  WARNING_CANONICAL_PATTERN_NO_MATCH,
  type CanonicalPatternIndexHit,
  type CanonicalPatternIndexResult,
} from "@/lib/intelligence/canonical/runtime-pattern-index";
import type { OpenAIEmbeddingsLike } from "../embedding-client";
import type { TenantDataAdapter } from "@/lib/knowledge/tenant-data";
import type {
  ContextChunk,
  GraphNeighborhood,
  TenantRecord,
} from "@/lib/knowledge/tenant-data/types";

jest.mock("server-only", () => ({}));
jest.mock("@/lib/azure-search/tenant-context-retriever", () => ({
  queryTenantContext: jest.fn(),
}));

const EMBED_DIM = 1536;

function makeFakeOpenAI(): OpenAIEmbeddingsLike {
  return {
    embeddings: {
      create: jest.fn(
        async ({ input }: { model: string; input: string[] }) => ({
          data: input.map((_, idx) => ({
            embedding: new Array<number>(EMBED_DIM).fill((idx + 1) / 1000),
            index: idx,
          })),
          usage: {
            prompt_tokens: input.length * 50,
            total_tokens: input.length * 50,
          },
        }),
      ),
    },
  };
}

const TENANT = "apex-retail";

const canonicalPatternHit: CanonicalPatternIndexHit = {
  canonical_id: "AIP-RETAIL-CONTACT-CENTER-AI-ROUTING",
  title: "Contact Center AI Routing",
  summary: "Route customer contacts using intent, value, and service context.",
  industry: ["retail"],
  enterprise_area: "front_office",
  function: "contact_center",
  process_area: "service_routing_and_resolution",
  use_case_category: "agentic_workflow",
  strategic_move_phases: ["design"],
  maturity_level: "proven",
  confidence_level: "high",
  value_hypothesis:
    "Intent-aware routing improves containment, CSAT, and handle time.",
  primary_kpis: ["containment_rate", "aht", "csat"],
  secondary_kpis: ["first_contact_resolution", "transfer_rate"],
  baseline_needed: ["current_contact_volume", "current_aht", "current_csat"],
  measurement_method:
    "Compare baseline and pilot cohorts by channel and intent.",
  value_levers: ["experience", "productivity", "cost_takeout"],
  quantitative_claims: [],
  source_basis: "internal_pattern",
  source_references: [],
  confidence_rationale: "Reviewed internal pattern.",
  missing_required_fields: [],
  missing_provenance: false,
  unsupported_claim_flags: [],
  duplicate_risk: null,
  score: 0.82,
  match_reasons: ["query:contact+center+routing"],
};

function patternHit(
  canonicalId: string,
  industry: CanonicalPatternIndexHit["industry"],
  title = canonicalId,
): CanonicalPatternIndexHit {
  return {
    ...canonicalPatternHit,
    canonical_id: canonicalId,
    title,
    industry,
  };
}

function makePatternResult(
  overrides: Partial<CanonicalPatternIndexResult> = {},
): CanonicalPatternIndexResult {
  return {
    source: "persisted_canonical_corpus",
    status: "empty",
    patterns: [],
    total: 0,
    warnings: [WARNING_CANONICAL_CORPUS_EMPTY],
    filters_applied: { query: "test", limit: 8 },
    cache: { mode: "disabled", key: null, ttl_ms: 0 },
    ...overrides,
  };
}

function makeRecord(recordId: string, title = recordId): TenantRecord {
  return {
    tenantKey: TENANT,
    segmentId: "program_inventory",
    recordId,
    recordKind: "program_record",
    title,
    payload: {},
    sourceBasis: `synthetic://${recordId}`,
    classification: "internal",
    confidence: 0.9,
  };
}

function makeChunk(chunkId: string, recordId: string): ContextChunk {
  return {
    tenantKey: TENANT,
    chunkId,
    recordId,
    text: `chunk text for ${recordId}`,
    embeddingStatus: "pending",
    sourceBasis: `synthetic://${recordId}`,
    classification: "internal",
  };
}

function makeNeighborhood(rootId: string): GraphNeighborhood {
  return {
    rootId,
    nodes: [
      {
        tenantKey: TENANT,
        nodeId: rootId,
        kind: "program",
        title: rootId,
        payload: {},
      },
    ],
    edges: [
      {
        tenantKey: TENANT,
        edgeId: `${rootId}::SPONSORED_BY::person:apex:jennifer-park`,
        fromNodeId: rootId,
        toNodeId: "person:apex:jennifer-park",
        kind: "SPONSORED_BY",
      },
    ],
    depth: 1,
  };
}

interface AdapterOverrides {
  listRecords?: TenantDataAdapter["listRecords"];
  chunksByKeyword?: TenantDataAdapter["chunksByKeyword"];
  getRecord?: TenantDataAdapter["getRecord"];
  chunksByVector?: TenantDataAdapter["chunksByVector"];
  getGraphNeighborhood?: TenantDataAdapter["getGraphNeighborhood"];
}

function buildAdapter(overrides: AdapterOverrides = {}): TenantDataAdapter {
  return {
    listSegments: jest.fn().mockResolvedValue([]),
    listRecords: overrides.listRecords ?? jest.fn().mockResolvedValue([]),
    getRecord: overrides.getRecord ?? jest.fn().mockResolvedValue(null),
    listGraphNodes: jest.fn().mockResolvedValue([]),
    listGraphEdgesForNode: jest.fn().mockResolvedValue([]),
    getGraphNeighborhood:
      overrides.getGraphNeighborhood ??
      jest
        .fn()
        .mockResolvedValue({ rootId: "x", nodes: [], edges: [], depth: 0 }),
    pathBetween: jest.fn().mockResolvedValue(null),
    listContextChunks: jest.fn().mockResolvedValue([]),
    chunksByRecord: jest.fn().mockResolvedValue([]),
    chunksByKeyword:
      overrides.chunksByKeyword ?? jest.fn().mockResolvedValue([]),
    chunksByVector:
      overrides.chunksByVector ??
      jest
        .fn()
        .mockRejectedValue(new Error("Vector retrieval not yet enabled.")),
    getEvidence: jest.fn().mockResolvedValue(null),
    hasPersistedData: jest.fn().mockResolvedValue(true),
  };
}

function makeBroker(
  overrides: AdapterOverrides = {},
  openai: OpenAIEmbeddingsLike = makeFakeOpenAI(),
  patternRetriever: CorpusPatternRetriever = jest
    .fn()
    .mockResolvedValue(makePatternResult()),
): {
  broker: ContextBroker;
  adapter: TenantDataAdapter;
  patternRetriever: CorpusPatternRetriever;
} {
  const adapter = buildAdapter(overrides);
  const broker = new DefaultContextBroker(adapter, openai, patternRetriever);
  return { broker, adapter, patternRetriever };
}

describe("extractKeywords", () => {
  it("lowercases, drops stopwords + short tokens, dedupes, caps at 10", () => {
    const out = extractKeywords(
      "Who is the sponsor of the Apex CDP program and which systems does it depend on?",
    );
    expect(out).toEqual(
      expect.arrayContaining([
        "sponsor",
        "apex",
        "cdp",
        "program",
        "systems",
        "depend",
      ]),
    );
    expect(out.length).toBeLessThanOrEqual(10);
    expect(out).not.toContain("the");
    expect(out).not.toContain("is");
  });

  it("exposes vendor inference economics through the broker seam", () => {
    const { broker } = makeBroker();

    expect(broker.getInferenceEconomicsForVendor("DAX Copilot")).toEqual({
      perCallUsd: null,
      pricingTierLadder: [],
      repricingClauseText: null,
      repricingNoticeDays: null,
      volumeLockExpiresOn: null,
      contractCeilingUsdPerYear: null,
      asOf: "2026-05-31",
    });
  });

  it("strips trailing punctuation", () => {
    expect(extractKeywords("budget?")).toEqual(["budget"]);
  });

  it("returns [] for empty / whitespace-only input", () => {
    expect(extractKeywords("")).toEqual([]);
    expect(extractKeywords("   ")).toEqual([]);
  });
});

describe("DefaultContextBroker.assemble — generic mode", () => {
  it("returns empty bundle with no facts/graph/chunks/patterns", async () => {
    const { broker } = makeBroker();
    const bundle = await broker.assemble({
      query: "anything",
      mode: "generic",
    });

    expect(bundle.mode).toBe("generic");
    expect(bundle.tenantKey).toBeNull();
    expect(bundle.facts).toEqual([]);
    expect(bundle.graphPaths).toEqual([]);
    expect(bundle.semanticChunks).toEqual([]);
    expect(bundle.corpusPatterns).toEqual([]);
    expect(bundle.provenance).toEqual([]);
    expect(bundle.warnings).toEqual([]);
  });

  it("does not call the adapter at all", async () => {
    const { broker, adapter } = makeBroker();
    await broker.assemble({ query: "q", mode: "generic" });
    expect(adapter.chunksByKeyword).not.toHaveBeenCalled();
    expect(adapter.chunksByVector).not.toHaveBeenCalled();
    expect(adapter.getRecord).not.toHaveBeenCalled();
  });
});

describe("DefaultContextBroker.assemble — corpus mode", () => {
  it("maps tenant keys to the right canonical pattern industry allowlist", () => {
    expect(
      Array.from(allowedPatternIndustriesForTenant("apex-retail") ?? []),
    ).toEqual(["retail", "cross_industry"]);
    expect(
      Array.from(allowedPatternIndustriesForTenant("meridian") ?? []),
    ).toEqual(["healthcare_provider", "cross_industry"]);
    expect(
      Array.from(allowedPatternIndustriesForTenant("northstar-clinical") ?? []),
    ).toEqual(["healthcare_medtech", "cross_industry"]);
    expect(
      Array.from(allowedPatternIndustriesForTenant("first-capital") ?? []),
    ).toEqual(["financial_services_banking", "cross_industry"]);
    expect(
      Array.from(allowedPatternIndustriesForTenant("skyharbor-air") ?? []),
    ).toEqual(["airline", "cross_industry"]);
  });

  it("returns empty bundle with worldview-pending + canonical-corpus empty warnings when indexes have no hits", async () => {
    // INT-WV-2: with no PINECONE_API_KEY in test env, the worldview
    // retriever returns reached=false and the broker tags both the
    // worldview-pending and pattern-catalog (CB-6) gaps.
    const { broker } = makeBroker();
    const bundle = await broker.assemble({
      query: "pattern question",
      mode: "corpus",
    });

    expect(bundle.mode).toBe("corpus");
    expect(bundle.tenantKey).toBeNull();
    expect(bundle.facts).toEqual([]);
    expect(bundle.graphPaths).toEqual([]);
    expect(bundle.semanticChunks).toEqual([]);
    expect(bundle.corpusPatterns).toEqual([]);
    expect(bundle.worldviewChunks).toEqual([]);
    expect(bundle.provenance).toEqual([]);
    expect(bundle.warnings).toContain(WARNING_WORLDVIEW_PENDING);
    expect(bundle.warnings).toContain(WARNING_CANONICAL_CORPUS_EMPTY);
  });

  it("hydrates corpusPatterns from the persisted canonical index", async () => {
    const patternRetriever = jest.fn().mockResolvedValue(
      makePatternResult({
        status: "ready",
        patterns: [canonicalPatternHit],
        total: 1,
        warnings: [],
      }),
    );
    const { broker } = makeBroker({}, makeFakeOpenAI(), patternRetriever);

    const bundle = await broker.assemble({
      query: "contact center routing",
      mode: "corpus",
    });

    expect(patternRetriever).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "contact center routing",
        mode: "corpus",
      }),
      null,
    );
    expect(bundle.corpusPatterns).toEqual([
      {
        patternId: canonicalPatternHit.canonical_id,
        patternName: canonicalPatternHit.title,
        score: canonicalPatternHit.score,
        summary: canonicalPatternHit.summary,
        sourceBasis: "internal_pattern",
        confidenceLevel: "high",
        missingRequiredFields: [],
        missingProvenance: false,
        unsupportedClaimCount: 0,
        matchReasons: ["query:contact+center+routing"],
      },
    ]);
    expect(bundle.provenance).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceClass: "pattern_catalog",
          sourceId: canonicalPatternHit.canonical_id,
        }),
      ]),
    );
    expect(bundle.retrievalTrace?.shared_corpus_ids).toContain(
      canonicalPatternHit.canonical_id,
    );
  });
});

describe("DefaultContextBroker.assemble — tenant mode", () => {
  it("throws MissingTenantKeyError when tenantKey is absent", async () => {
    const { broker } = makeBroker();
    await expect(
      broker.assemble({ query: "who sponsors apex cdp", mode: "tenant" }),
    ).rejects.toBeInstanceOf(MissingTenantKeyError);
  });

  it("hydrates facts from chunksByKeyword + getRecord (keyword-fallback path)", async () => {
    const seedChunks: ContextChunk[] = [
      makeChunk("chunk:apex:cdp:001", "program:apex-cdp-2026"),
      makeChunk("chunk:apex:cdp:002", "program:apex-cdp-2026"), // dupe record_id
      makeChunk(
        "chunk:apex:contact:001",
        "program:apex-contact-center-ai-2026",
      ),
    ];
    const records: Record<string, TenantRecord> = {
      "program:apex-cdp-2026": makeRecord(
        "program:apex-cdp-2026",
        "Apex CDP 2026",
      ),
      "program:apex-contact-center-ai-2026": makeRecord(
        "program:apex-contact-center-ai-2026",
      ),
    };

    // Default adapter has chunksByVector rejecting — keyword fallback fires.
    const { broker } = makeBroker({
      chunksByKeyword: jest.fn().mockResolvedValue(seedChunks),
      getRecord: jest
        .fn()
        .mockImplementation((_t: string, id: string) =>
          Promise.resolve(records[id] ?? null),
        ),
      getGraphNeighborhood: jest
        .fn()
        .mockImplementation((_t: string, rootId: string) =>
          Promise.resolve(makeNeighborhood(rootId)),
        ),
    });

    const bundle = await broker.assemble({
      query: "who sponsors the apex cdp program",
      mode: "tenant",
      tenantKey: TENANT,
    });

    expect(bundle.mode).toBe("tenant");
    expect(bundle.tenantKey).toBe(TENANT);
    expect(bundle.facts.length).toBe(2);
    expect(bundle.facts.map((f) => f.recordId)).toEqual([
      "program:apex-cdp-2026",
      "program:apex-contact-center-ai-2026",
    ]);
    // Both record ids start with `program:`, so both should yield neighborhoods.
    expect(bundle.graphPaths.length).toBe(2);
    expect(bundle.warnings).toContain(WARNING_VECTOR_PENDING);
    expect(bundle.warnings).not.toContain(WARNING_CORPUS_PENDING);
  });

  it("prepends enterprise profile and system anchors for broad company-facts questions", async () => {
    const profile = makeRecord(
      "enterprise_profile:apex",
      "Apex Retail Group enterprise profile",
    );
    const sap = {
      ...makeRecord("it_landscape:sys:apex:sap-s4", "SAP S/4HANA"),
      segmentId: "it_landscape" as const,
    };
    const program = makeRecord("program:apex-cdp-2026", "Apex CDP 2026");
    const { broker, adapter } = makeBroker({
      listRecords: jest
        .fn()
        .mockResolvedValueOnce([profile])
        .mockResolvedValueOnce([sap]),
      chunksByKeyword: jest
        .fn()
        .mockResolvedValue([
          makeChunk("chunk:apex:cdp:001", "program:apex-cdp-2026"),
        ]),
      getRecord: jest.fn().mockResolvedValue(program),
    });

    const bundle = await broker.assemble({
      query:
        "What do you know about Apex Retail? Give me your highest-confidence facts.",
      mode: "tenant",
      tenantKey: TENANT,
    });

    expect(adapter.listRecords).toHaveBeenCalledWith(
      TENANT,
      "enterprise_profile",
      { limit: 3 },
    );
    expect(adapter.listRecords).toHaveBeenCalledWith(TENANT, "it_landscape", {
      limit: 6,
      recordKind: "systems_inventory",
    });
    expect(bundle.facts.map((fact) => fact.recordId)).toEqual([
      "enterprise_profile:apex",
      "it_landscape:sys:apex:sap-s4",
      "program:apex-cdp-2026",
    ]);
  });

  it("prepends vendor spend and renewal anchors for vendor-contract questions", async () => {
    const salesforce = {
      ...makeRecord("vendor_contracts:vendor:apex:002", "Salesforce"),
      segmentId: "vendor_contracts" as const,
      recordKind: "vendor_scorecards",
      payload: {
        vendor_name: "Salesforce",
        annual_spend_usd: 3290000,
        renewal_date: "2026-09-15",
        notes:
          "Sales + Service + Commerce + Tableau; renewal coming with Einstein scope debate",
      },
    };
    const aws = {
      ...makeRecord("vendor_contracts:vendor:apex:003", "AWS"),
      segmentId: "vendor_contracts" as const,
      recordKind: "vendor_scorecards",
      payload: {
        vendor_name: "AWS",
        annual_spend_usd: 4280000,
        renewal_date: "2027-06-30",
        notes: "EDP commit; phase 2 migration in progress",
      },
    };
    const renewal = {
      ...makeRecord(
        "it_financials:renewal:apex:010",
        "Salesforce Sales + Service renewal",
      ),
      segmentId: "it_financials" as const,
      recordKind: "renewal_calendar",
      payload: {
        vendor: "Salesforce (Sales + Service)",
        annual_value_usd: 1240000,
        renewal_date: "2026-09-15",
      },
    };
    const unrelated = makeRecord("program:apex-cdp-2026", "Apex CDP 2026");
    const { broker, adapter } = makeBroker({
      listRecords: jest
        .fn()
        .mockImplementation((_tenant: string, segment: string) => {
          if (segment === "vendor_contracts")
            return Promise.resolve([salesforce, aws]);
          if (segment === "it_financials") return Promise.resolve([renewal]);
          if (segment === "it_landscape") return Promise.resolve([]);
          return Promise.resolve([]);
        }),
      chunksByKeyword: jest
        .fn()
        .mockResolvedValue([
          makeChunk("chunk:apex:cdp:001", "program:apex-cdp-2026"),
        ]),
      getRecord: jest.fn().mockResolvedValue(unrelated),
    });

    const bundle = await broker.assemble({
      query:
        "Who are our top 5 vendors by annual spend, and which contracts renew in the next 12 months?",
      mode: "tenant",
      tenantKey: TENANT,
    });

    expect(adapter.listRecords).toHaveBeenCalledWith(
      TENANT,
      "vendor_contracts",
      { limit: 80 },
    );
    expect(adapter.listRecords).toHaveBeenCalledWith(TENANT, "it_financials", {
      limit: 80,
    });
    expect(bundle.facts.map((fact) => fact.recordId)).toEqual([
      "vendor_contracts:vendor:apex:002",
      "it_financials:renewal:apex:010",
      "vendor_contracts:vendor:apex:003",
      "program:apex-cdp-2026",
    ]);
  });

  it("prepends tenant-specific strategic decision anchors for broad AI value questions", async () => {
    const populationHealth = {
      ...makeRecord(
        "program_inventory:meridian:population-health-ai",
        "Population Health AI for ACOs",
      ),
      tenantKey: "meridian-health",
      segmentId: "program_inventory" as const,
      payload: {
        value_at_stake: "$8M-$24M MSSP shared savings",
        notes: "Population health ACO bet with CIO + sponsor ownership.",
      },
    };
    const ambient = {
      ...makeRecord(
        "program_inventory:meridian:ambient-documentation",
        "Ambient AI Clinical Documentation",
      ),
      tenantKey: "meridian-health",
      segmentId: "program_inventory" as const,
      payload: { notes: "Ambient scale-up over-delivering committed value." },
    };
    const priorAuth = {
      ...makeRecord(
        "program_inventory:meridian:prior-auth",
        "Prior Authorization Automation",
      ),
      tenantKey: "meridian-health",
      segmentId: "program_inventory" as const,
      payload: { notes: "P4 build program." },
    };
    const { broker, adapter } = makeBroker({
      listRecords: jest
        .fn()
        .mockImplementation((_tenant: string, segment: string) => {
          if (segment === "program_inventory")
            return Promise.resolve([priorAuth, ambient, populationHealth]);
          return Promise.resolve([]);
        }),
      chunksByKeyword: jest.fn().mockResolvedValue([]),
    });

    const bundle = await broker.assemble({
      query:
        "Where would AI create the most measurable value for Meridian Health in the next 12 months? Rank the top 5.",
      mode: "tenant",
      tenantKey: "meridian-health",
      maxFacts: 3,
    });

    expect(adapter.listRecords).toHaveBeenCalledWith(
      "meridian-health",
      "program_inventory",
      { limit: 80 },
    );
    expect(adapter.listRecords).toHaveBeenCalledWith(
      "meridian-health",
      "kpi_dictionary",
      { limit: 80 },
    );
    expect(bundle.facts.map((fact) => fact.recordId)).toEqual([
      "program_inventory:meridian:population-health-ai",
      "program_inventory:meridian:ambient-documentation",
      "program_inventory:meridian:prior-auth",
    ]);
  });

  it("anchors First Capital broad move-now questions on FedNow and model-risk context", async () => {
    const aml = {
      ...makeRecord("program_inventory:first:aml", "AML/KYC Remediation"),
      tenantKey: "first-capital",
      segmentId: "program_inventory" as const,
      payload: { notes: "OCC review and alert triage." },
    };
    const fedNow = {
      ...makeRecord(
        "program_inventory:first:fednow",
        "FedNow Payment Rails Modernization",
      ),
      tenantKey: "first-capital",
      segmentId: "program_inventory" as const,
      payload: {
        notes:
          "FedNow deposit retention, payment controls, and model risk gates.",
      },
    };
    const modelRisk = {
      ...makeRecord(
        "evidence_ledger:first:sr117",
        "SR 11-7 model validation finding",
      ),
      tenantKey: "first-capital",
      segmentId: "evidence_ledger" as const,
      payload: {
        notes: "Model risk and model validation must clear before ML scale.",
      },
    };
    const { broker } = makeBroker({
      listRecords: jest
        .fn()
        .mockImplementation((_tenant: string, segment: string) => {
          if (segment === "program_inventory")
            return Promise.resolve([aml, fedNow]);
          if (segment === "evidence_ledger")
            return Promise.resolve([modelRisk]);
          return Promise.resolve([]);
        }),
      chunksByKeyword: jest.fn().mockResolvedValue([]),
    });

    const bundle = await broker.assemble({
      query: "Which First Capital AI or digital bet should move now and why?",
      mode: "tenant",
      tenantKey: "first-capital",
      maxFacts: 3,
    });

    expect(bundle.facts.map((fact) => fact.recordId)).toEqual([
      "program_inventory:first:fednow",
      "evidence_ledger:first:sr117",
      "program_inventory:first:aml",
    ]);
  });

  it("uses pgvector retrieval when chunksByVector succeeds", async () => {
    const seedChunks: ContextChunk[] = [
      makeChunk("chunk:apex:cdp:001", "program:apex-cdp-2026"),
    ];
    const vectorChunks: ContextChunk[] = [
      {
        ...makeChunk("chunk:apex:cdp:vec:001", "program:apex-cdp-2026"),
        vectorScore: 0.91,
      },
      {
        ...makeChunk("chunk:apex:cdp:vec:002", "program:apex-cdp-2026"),
        vectorScore: 0.84,
      },
    ];
    const { broker, adapter } = makeBroker({
      chunksByKeyword: jest.fn().mockResolvedValue(seedChunks),
      getRecord: jest
        .fn()
        .mockResolvedValue(makeRecord("program:apex-cdp-2026")),
      chunksByVector: jest.fn().mockResolvedValue(vectorChunks),
    });

    const bundle = await broker.assemble({
      query: "apex cdp sponsor",
      mode: "tenant",
      tenantKey: TENANT,
      maxChunks: 5,
    });

    expect(adapter.chunksByVector).toHaveBeenCalled();
    expect(bundle.semanticChunks).toHaveLength(2);
    expect(bundle.semanticChunks[0]).toMatchObject({
      score: 0.91,
      chunk: expect.objectContaining({ chunkId: "chunk:apex:cdp:vec:001" }),
    });
    expect(bundle.semanticChunks[1].score).toBe(0.84);
    expect(bundle.warnings).not.toContain(WARNING_VECTOR_PENDING);
    // CB-10 · vector-retrieval-succeeded is success metadata and now
    // lives on `infoTags` (slate-toned info strip), not `warnings`
    // (amber strip).
    expect(bundle.warnings).not.toContain(vectorRetrievalInfoTag(5));
    expect(bundle.infoTags).toContain(vectorRetrievalInfoTag(5));
  });

  it("falls back to keyword retrieval and tags WARNING_VECTOR_PENDING when embedTexts throws", async () => {
    const fallbackChunks: ContextChunk[] = [
      makeChunk("chunk:apex:keywords:001", "program:apex-cdp-2026"),
    ];
    const failingOpenAI: OpenAIEmbeddingsLike = {
      embeddings: {
        create: jest.fn(async () => {
          throw new Error("OpenAI down");
        }),
      },
    };
    const adapter = buildAdapter({
      chunksByKeyword: jest.fn().mockResolvedValue(fallbackChunks),
      getRecord: jest
        .fn()
        .mockResolvedValue(makeRecord("program:apex-cdp-2026")),
      // chunksByVector would succeed if reached — but embedTexts fails first.
      chunksByVector: jest.fn().mockResolvedValue([]),
    });
    const broker = new DefaultContextBroker(adapter, failingOpenAI);

    const bundle = await broker.assemble({
      query: "apex cdp",
      mode: "tenant",
      tenantKey: TENANT,
    });

    expect(bundle.warnings).toContain(WARNING_VECTOR_PENDING);
    expect(bundle.semanticChunks.length).toBeGreaterThan(0);
    expect(bundle.semanticChunks[0].score).toBe(0); // keyword fallback marker
  });

  it("falls back to keyword retrieval when vector retrieval returns no chunks", async () => {
    const fallbackChunks: ContextChunk[] = [
      makeChunk("chunk:apex:keywords:001", "program:apex-cdp-2026"),
    ];
    const { broker, adapter } = makeBroker({
      chunksByKeyword: jest.fn().mockResolvedValue(fallbackChunks),
      getRecord: jest
        .fn()
        .mockResolvedValue(makeRecord("program:apex-cdp-2026")),
      chunksByVector: jest.fn().mockResolvedValue([]),
    });

    const bundle = await broker.assemble({
      query: "apex cdp",
      mode: "tenant",
      tenantKey: TENANT,
    });

    expect(adapter.chunksByVector).toHaveBeenCalled();
    expect(adapter.chunksByKeyword).toHaveBeenCalled();
    expect(bundle.warnings).toContain(WARNING_VECTOR_PENDING);
    expect(bundle.infoTags).not.toContain(vectorRetrievalInfoTag(8));
    expect(bundle.semanticChunks).toEqual([
      {
        chunk: expect.objectContaining({ chunkId: "chunk:apex:keywords:001" }),
        score: 0,
      },
    ]);
  });

  it("catches chunksByVector throws and falls back to keyword retrieval", async () => {
    const fallbackChunks: ContextChunk[] = [
      makeChunk("chunk:apex:keywords:001", "program:apex-cdp-2026"),
    ];
    const { broker, adapter } = makeBroker({
      chunksByKeyword: jest.fn().mockResolvedValue(fallbackChunks),
      getRecord: jest
        .fn()
        .mockResolvedValue(makeRecord("program:apex-cdp-2026")),
    });

    const bundle = await broker.assemble({
      query: "apex cdp",
      mode: "tenant",
      tenantKey: TENANT,
    });

    expect(adapter.chunksByVector).toHaveBeenCalled();
    expect(bundle.warnings).toContain(WARNING_VECTOR_PENDING);
    expect(bundle.semanticChunks.length).toBeGreaterThan(0);
    expect(bundle.semanticChunks[0].score).toBe(0); // keyword fallback marker
  });

  it("emits one provenance entry per fact + graphPath + chunk", async () => {
    const seedChunks: ContextChunk[] = [
      makeChunk("chunk:apex:cdp:001", "program:apex-cdp-2026"),
    ];
    const { broker } = makeBroker({
      chunksByKeyword: jest.fn().mockResolvedValue(seedChunks),
      getRecord: jest
        .fn()
        .mockResolvedValue(makeRecord("program:apex-cdp-2026")),
      getGraphNeighborhood: jest
        .fn()
        .mockImplementation((_t: string, rootId: string) =>
          Promise.resolve(makeNeighborhood(rootId)),
        ),
    });

    const bundle = await broker.assemble({
      query: "apex cdp sponsor",
      mode: "tenant",
      tenantKey: TENANT,
    });

    const expected =
      bundle.facts.length +
      bundle.graphPaths.length +
      bundle.semanticChunks.length;
    expect(bundle.provenance.length).toBe(expected);
    for (const p of bundle.provenance) {
      expect(typeof p.sourceId).toBe("string");
      expect(p.sourceId.length).toBeGreaterThan(0);
    }
  });

  it("tags registered tenants with private-plane trace and private-client provenance", async () => {
    const seedChunks: ContextChunk[] = [
      makeChunk("chunk:apex:private:001", "program:apex-cdp-2026"),
    ];
    const { broker } = makeBroker({
      chunksByKeyword: jest.fn().mockResolvedValue(seedChunks),
      getRecord: jest
        .fn()
        .mockResolvedValue(makeRecord("program:apex-cdp-2026")),
      getGraphNeighborhood: jest
        .fn()
        .mockImplementation((_t: string, rootId: string) =>
          Promise.resolve(makeNeighborhood(rootId)),
        ),
    });

    const bundle = await broker.assemble({
      query: "apex cdp sponsor",
      mode: "tenant",
      tenantKey: "apex-retail",
    });

    expect(bundle.retrievalTrace).toMatchObject({
      tenant_key: "apex-retail",
      data_plane_id: "pdp:apex-retail:prod",
      schema: "client_apex_retail_private",
      pinecone_index: "abarva-client-apex-retail-prod",
    });
    expect(bundle.retrievalTrace?.retrieved_private_ids).toEqual(
      expect.arrayContaining([
        "program:apex-cdp-2026",
        "chunk:apex:private:001",
      ]),
    );
    expect(bundle.provenance.map((p) => p.sourceClass)).toContain(
      "private_client_data",
    );
  });

  it("keeps Northstar on private DB retrieval when private Pinecone is blocked", async () => {
    const northstarChunk: ContextChunk = {
      tenantKey: "northstar-health",
      chunkId: "chunk:northstar:analytics:001",
      recordId: "program:nh-prog-healthcare-data-analytics-modernization",
      text: "Northstar analytics modernization covers Epic, prior auth, coding accuracy, and value-based care.",
      embeddingStatus: "pending",
      sourceBasis: "private_data_plane_seed",
      classification: "confidential",
    };
    const northstarRecord: TenantRecord = {
      tenantKey: "northstar-health",
      segmentId: "program_inventory",
      recordId: "program:nh-prog-healthcare-data-analytics-modernization",
      recordKind: "program_record",
      title: "Healthcare Data Analytics Modernization for Agentic Care",
      payload: {},
      sourceBasis: "private_data_plane_seed",
      classification: "confidential",
      confidence: 0.9,
    };
    const { broker, adapter } = makeBroker({
      chunksByKeyword: jest.fn().mockResolvedValue([northstarChunk]),
      getRecord: jest.fn().mockResolvedValue(northstarRecord),
    });

    const bundle = await broker.assemble({
      query:
        "How should Northstar Health modernize analytics given Epic, prior authorization, coding accuracy, and value-based care?",
      mode: "tenant",
      tenantKey: "northstar-health",
    });

    expect(adapter.chunksByVector).not.toHaveBeenCalled();
    expect(bundle.retrievalTrace).toMatchObject({
      tenant_key: "northstar-health",
      data_plane_id: "pdp:northstar-health:prod",
      schema: "client_northstar_health_private",
      pinecone_index: null,
      vector_status: "blocked",
    });
    expect(bundle.warnings.join(" ")).toMatch(
      /Private vector retrieval unavailable/,
    );
    expect(bundle.semanticChunks.map((hit) => hit.chunk.chunkId)).toContain(
      "chunk:northstar:analytics:001",
    );
  });

  it("skips graph traversal for records whose id has no graph prefix", async () => {
    const seedChunks: ContextChunk[] = [
      makeChunk("chunk:apex:kpi:001", "kpi_dictionary:apex:001"),
    ];
    const nonGraphRecord: TenantRecord = {
      ...makeRecord("kpi_dictionary:apex:001"),
      segmentId: "kpi_dictionary",
    };
    const getGraphNeighborhood = jest.fn();
    const { broker } = makeBroker({
      chunksByKeyword: jest.fn().mockResolvedValue(seedChunks),
      getRecord: jest.fn().mockResolvedValue(nonGraphRecord),
      getGraphNeighborhood,
    });

    const bundle = await broker.assemble({
      query: "kpi target",
      mode: "tenant",
      tenantKey: TENANT,
    });

    expect(bundle.facts.length).toBe(1);
    expect(bundle.graphPaths).toEqual([]);
    expect(getGraphNeighborhood).not.toHaveBeenCalled();
  });
});

describe("DefaultContextBroker.assemble — full mode", () => {
  it("throws MissingTenantKeyError when tenantKey is absent", async () => {
    const { broker } = makeBroker();
    await expect(
      broker.assemble({ query: "q", mode: "full" }),
    ).rejects.toBeInstanceOf(MissingTenantKeyError);
  });

  it("behaves like tenant mode + hydrates canonical corpus pattern gaps", async () => {
    const seedChunks: ContextChunk[] = [
      makeChunk("chunk:apex:cdp:001", "program:apex-cdp-2026"),
    ];
    const patternRetriever = jest.fn().mockResolvedValue(
      makePatternResult({
        status: "no_match",
        warnings: [WARNING_CANONICAL_PATTERN_NO_MATCH],
        filters_applied: {
          query: "apex cdp sponsor",
          tenant_key: TENANT,
          limit: 8,
        },
      }),
    );
    const { broker } = makeBroker(
      {
        chunksByKeyword: jest.fn().mockResolvedValue(seedChunks),
        getRecord: jest
          .fn()
          .mockResolvedValue(makeRecord("program:apex-cdp-2026")),
        getGraphNeighborhood: jest
          .fn()
          .mockImplementation((_t: string, rootId: string) =>
            Promise.resolve(makeNeighborhood(rootId)),
          ),
      },
      makeFakeOpenAI(),
      patternRetriever,
    );

    const bundle = await broker.assemble({
      query: "apex cdp sponsor",
      mode: "full",
      tenantKey: TENANT,
    });

    expect(bundle.mode).toBe("full");
    expect(bundle.facts.length).toBeGreaterThan(0);
    expect(bundle.graphPaths.length).toBeGreaterThan(0);
    expect(bundle.warnings).toContain(WARNING_VECTOR_PENDING);
    expect(bundle.warnings).toContain(WARNING_CANONICAL_PATTERN_NO_MATCH);
    expect(patternRetriever).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "full" }),
      TENANT,
    );
  });

  it("filters canonical corpus patterns to the active tenant industry in full mode", async () => {
    const retail = patternHit(
      "AIP-RETAIL-ASSORTMENT-001",
      ["retail"],
      "Retail assortment",
    );
    const financial = patternHit(
      "AIP-FINSERV-MODEL-RISK-001",
      ["financial_services_banking"],
      "Model risk controls",
    );
    const cross = patternHit(
      "AIP-X-AI-GOVERNANCE-001",
      ["cross_industry"],
      "AI governance",
    );
    const patternRetriever = jest.fn().mockResolvedValue(
      makePatternResult({
        status: "ready",
        patterns: [retail, financial, cross],
        total: 3,
        warnings: [],
      }),
    );
    const { broker } = makeBroker(
      {
        chunksByKeyword: jest.fn().mockResolvedValue([]),
      },
      makeFakeOpenAI(),
      patternRetriever,
    );

    const bundle = await broker.assemble({
      query: "parallel gates for a new ML model",
      mode: "full",
      tenantKey: "first-capital",
    });

    expect(bundle.corpusPatterns.map((pattern) => pattern.patternId)).toEqual([
      "AIP-FINSERV-MODEL-RISK-001",
      "AIP-X-AI-GOVERNANCE-001",
    ]);
    expect(bundle.retrievalTrace?.shared_corpus_ids).toEqual([
      "AIP-FINSERV-MODEL-RISK-001",
      "AIP-X-AI-GOVERNANCE-001",
    ]);
  });
});

describe("DefaultContextBroker.assemble — clamps + metadata", () => {
  it("clamps maxFacts at 50 (request 100 → over-fetch is bounded)", async () => {
    const chunksByKeyword = jest.fn().mockResolvedValue([]);
    const { broker } = makeBroker({ chunksByKeyword });

    await broker.assemble({
      query: "budget",
      mode: "tenant",
      tenantKey: TENANT,
      maxFacts: 100,
    });

    // The broker over-fetches by 2x but the cap on maxFacts is 50,
    // so chunksByKeyword should be called with 100 (= 50 * 2), never 200.
    expect(chunksByKeyword).toHaveBeenCalledWith(
      TENANT,
      expect.any(Array),
      100,
    );
  });

  it("clamps maxChunks at 20", async () => {
    const chunksByKeyword = jest.fn().mockResolvedValue([]);
    const { broker, adapter } = makeBroker({ chunksByKeyword });

    await broker.assemble({
      query: "budget",
      mode: "tenant",
      tenantKey: TENANT,
      maxChunks: 100,
    });

    // chunksByKeyword is called twice in tenant mode: once for fact
    // hydration and once for the keyword fallback. Find the fallback
    // call (the only one whose limit equals maxChunks).
    const lastCall = (adapter.chunksByKeyword as jest.Mock).mock.calls.at(-1);
    expect(lastCall?.[2]).toBe(20);
  });

  it("floors maxFacts at 1 when 0 is requested", async () => {
    const chunksByKeyword = jest.fn().mockResolvedValue([]);
    const { broker } = makeBroker({ chunksByKeyword });

    await broker.assemble({
      query: "budget",
      mode: "tenant",
      tenantKey: TENANT,
      maxFacts: 0,
    });

    expect(chunksByKeyword).toHaveBeenCalledWith(TENANT, expect.any(Array), 2);
  });

  it("assembledAt is a valid ISO timestamp", async () => {
    const { broker } = makeBroker();
    const bundle = await broker.assemble({ query: "q", mode: "generic" });
    expect(typeof bundle.assembledAt).toBe("string");
    expect(Number.isNaN(Date.parse(bundle.assembledAt))).toBe(false);
    // Round-trip stable.
    expect(new Date(bundle.assembledAt).toISOString()).toBe(bundle.assembledAt);
  });

  it("preserves the verbatim query in the bundle", async () => {
    const { broker } = makeBroker();
    const query = "Who SPONSORS the apex.cdp program??";
    const bundle = await broker.assemble({ query, mode: "generic" });
    expect(bundle.query).toBe(query);
  });
});
