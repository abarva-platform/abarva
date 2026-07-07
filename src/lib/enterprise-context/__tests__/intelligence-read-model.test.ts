import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";

import {
  getEnterpriseContextOverviewForTenant,
  summarizeEnterpriseContextChunks,
  summarizeEnterpriseContextRows,
} from "../intelligence-read-model";
import type {
  EnterpriseContextChunkRow,
  EnterpriseContextQualityRow,
  EnterpriseContextRecordRow,
  EnterpriseContextSourceRow,
} from "../intelligence-read-model";

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: jest.fn(),
}));

const mockGetAzureReadFluentClient = jest.mocked(getAzureReadFluentClient);

function record(
  overrides: Partial<EnterpriseContextRecordRow>,
): EnterpriseContextRecordRow {
  return {
    record_type: "cmdb_applications_services",
    title: "Epic Hyperspace",
    source_system: "ServiceNow",
    owner: "CMDB Stewardship",
    freshness_status: "fresh",
    confidence: 0.88,
    payload: {},
    ...overrides,
  };
}

describe("enterprise context Intelligence read model", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("summarizes internal context into CXO-readable cards and Sentinel facts", () => {
    const records: EnterpriseContextRecordRow[] = [
      record({ payload: { criticality: "Tier 1" } }),
      record({
        record_type: "incidents",
        title: "Queue latency",
        payload: { breach_sla: "true" },
        confidence: 0.81,
      }),
      record({
        record_type: "problems",
        title: "Integration backlog",
        payload: {},
        confidence: 0.82,
      }),
      record({
        record_type: "changes",
        title: "Release window",
        payload: {},
        confidence: 0.84,
      }),
      record({
        record_type: "vendors_contract_inventory",
        title: "Epic contract",
        source_system: "Legal CLM",
        owner: "IT Sourcing",
        payload: {
          vendor_name: "Epic Systems",
          annual_spend_usd: "28000000",
          category: "Software / SaaS",
          renewal_risk: "High",
          notes: "EHR renewal creates roadmap leverage.",
        },
        confidence: 0.83,
      }),
      record({
        record_type: "renewal_calendar",
        title: "Epic renewal",
        source_system: "Legal CLM",
        owner: "IT Sourcing",
        payload: { renewal_risk: "High", estimated_value_usd: "55200000" },
        confidence: 0.83,
      }),
      record({
        record_type: "spend_baseline",
        title: "Epic spend",
        source_system: "Finance ERP",
        owner: "Finance Operations",
        payload: { run_rate_usd: "17295996", category: "Clinical Systems" },
        confidence: 0.9,
      }),
      record({
        record_type: "policies_procedures",
        title: "AI Use Policy",
        source_system: "GRC",
        owner: "GRC",
        payload: {},
        confidence: 0.86,
      }),
      record({
        record_type: "risk_compliance_register",
        title: "Model risk",
        source_system: "GRC",
        owner: "GRC",
        payload: {},
        confidence: 0.8,
      }),
      record({
        record_type: "initiative_portfolio",
        title: "Contact Center AI",
        source_system: "Enterprise PMO",
        owner: "Enterprise PMO",
        payload: {},
        confidence: 0.8,
      }),
      record({
        record_type: "data_domains_stewardship",
        title: "Contact Center",
        source_system: "Data catalog",
        owner: "Data Governance",
        payload: {},
        confidence: 0.82,
      }),
      record({
        record_type: "org_decision_rights",
        title: "Anita",
        source_system: "Workday",
        owner: "People Operations",
        payload: {},
        confidence: 0.92,
      }),
    ];
    const sources: EnterpriseContextSourceRow[] = [
      {
        source_system: "ServiceNow",
        display_name: "ServiceNow",
        system_of_record: true,
        source_owner: "ITSM",
        last_synced_at: "2026-05-11T00:00:00Z",
      },
      {
        source_system: "Finance ERP",
        display_name: "Finance ERP",
        system_of_record: true,
        source_owner: "Finance",
        last_synced_at: "2026-05-11T00:00:00Z",
      },
    ];
    const qualityRows: EnterpriseContextQualityRow[] = [
      {
        issue_type: "low_confidence",
        severity: "medium",
        status: "open",
        source_file: "spend.csv",
        owner: "Finance Operations",
      },
    ];

    const overview = summarizeEnterpriseContextRows({
      tenantKey: "meridian",
      tenantName: "Meridian Health",
      counts: {
        sources: 2,
        records: records.length,
        facts: 100,
        relationships: 5,
        evidence: 12,
        qualityIssues: 1,
        stewardshipTasks: 1,
        chunkQueue: 12,
      },
      records,
      sources,
      qualityRows,
      evidenceRows: [{ evidence_usable: true }, { evidence_usable: false }],
    });

    expect(overview.recordTypeCounts.incidents).toBe(1);
    expect(overview.evidenceUsableCount).toBe(1);
    expect(overview.cards.map((card) => card.title)).toEqual(
      expect.arrayContaining([
        "Platform and service reliability",
        "Contract renewal exposure",
        "Spend baseline confidence",
      ]),
    );
    expect(overview.sentinelFacts.join("\n")).toContain(
      "Enterprise Context: 12 records",
    );
    expect(overview.sentinelFacts.join("\n")).toContain("Operational posture");
    expect(overview.sentinelFacts.join("\n")).toContain(
      "$55.2M estimated renewal exposure",
    );
    expect(overview.sentinelFacts.join("\n")).toContain(
      "answer Meridian Health current-state questions",
    );
    expect(overview.vendorSpendRows[0]).toMatchObject({
      vendor: "Epic Systems",
      category: "software-saas",
      spendUsdM: 28,
      spendLabel: "$28.0M",
      health: "risk",
    });
  });

  it("groups Admin-promoted record types into Enterprise Context cards", () => {
    const records: EnterpriseContextRecordRow[] = [
      record({
        record_type: "enterprise_profile",
        title: "Lakeshore profile",
      }),
      record({
        record_type: "org_role",
        title: "Chief Information Officer",
      }),
      record({
        record_type: "business_unit",
        title: "Northline Logistics",
      }),
      record({
        record_type: "facility",
        title: "Chicago primary data center",
      }),
      record({
        record_type: "cmdb_application",
        title: "Oracle EBS",
        payload: { criticality: "Tier 1" },
      }),
      record({
        record_type: "configuration_item",
        title: "Dell VMware private cloud",
      }),
      record({
        record_type: "contract",
        title: "Kyriba contract",
        payload: {
          vendor_name: "Kyriba",
          annual_value_usd: "1800000",
          category: "Treasury SaaS",
          renewal_risk: "Medium",
        },
      }),
      record({
        record_type: "kpi_metric",
        title: "Inventory turns",
      }),
      record({
        record_type: "initiative",
        title: "Treasury modernization",
      }),
      record({
        record_type: "data_asset",
        title: "Finance data mart",
      }),
      record({
        record_type: "business_capability",
        title: "Liquidity forecasting",
      }),
      record({
        record_type: "risk",
        title: "Payment control gap",
      }),
    ];

    const overview = summarizeEnterpriseContextRows({
      tenantKey: "lakeshore-holdings",
      tenantName: "Lakeshore Holdings",
      counts: {
        sources: 13,
        records: records.length,
        facts: 2949,
        relationships: 0,
        evidence: 1542,
        qualityIssues: 0,
        stewardshipTasks: 0,
        chunkQueue: 1542,
      },
      records,
      sources: [
        {
          source_system: "admin_bulk_context_upload",
          display_name: "Admin context upload",
          system_of_record: true,
          source_owner: "Context Stewardship",
          last_synced_at: "2026-06-08T15:30:00Z",
        },
      ],
      qualityRows: [],
      evidenceRows: [{ evidence_usable: true }],
    });

    const platformCard = overview.cards.find(
      (card) => card.key === "platform-and-service-reliability",
    );
    const contractCard = overview.cards.find(
      (card) => card.key === "contract-renewal-exposure",
    );
    const initiativeCard = overview.cards.find(
      (card) => card.key === "initiative-dependency-map",
    );
    const facts = overview.sentinelFacts.join("\n");

    expect(platformCard?.whatWeKnow).toContain("2 systems/services loaded");
    expect(platformCard?.whatWeKnow).toContain("1 are Tier 1");
    expect(contractCard?.whatWeKnow).toContain("1 vendor/contracts");
    expect(initiativeCard?.whatWeKnow).toContain(
      "1 initiatives and 2 data-domain stewardship records",
    );
    expect(facts).toContain("org and decision rights (1)");
    expect(facts).toContain("facilities/business units (2)");
    expect(facts).toContain("systems/services (2)");
    expect(facts).toContain("vendors/contracts (1)");
    expect(facts).toContain("KPIs/metrics (1)");
    expect(facts).toContain("initiatives (1)");
    expect(facts).toContain("data domains/capabilities (2)");
    expect(facts).toContain("risks/compliance (1)");
    expect(facts).toContain(
      "answer Lakeshore Holdings current-state questions",
    );
    expect(overview.vendorSpendRows[0]).toMatchObject({
      vendor: "Kyriba",
      category: "software-saas",
      spendUsdM: 1.8,
      spendLabel: "$1.8M",
      health: "watch",
    });
  });

  it("loads overview tables sequentially to avoid session-mode pool bursts", async () => {
    let activeQueries = 0;
    let maxActiveQueries = 0;
    const queryOrder: string[] = [];
    const countByTable: Record<string, number> = {
      enterprise_context_sources: 1,
      enterprise_context_records: 1,
      enterprise_context_facts: 2,
      enterprise_context_relationships: 3,
      enterprise_context_evidence: 1,
      enterprise_context_quality_issues: 1,
      enterprise_context_stewardship_tasks: 1,
      enterprise_context_chunk_queue: 1,
    };
    const rowsByTable: Record<string, unknown[]> = {
      enterprise_context_records: [
        record({ payload: { criticality: "Tier 1" } }),
      ],
      enterprise_context_sources: [
        {
          source_system: "ServiceNow",
          display_name: "ServiceNow",
          system_of_record: true,
          source_owner: "ITSM",
          last_synced_at: "2026-05-11T00:00:00Z",
        },
      ],
      enterprise_context_quality_issues: [
        {
          issue_type: "low_confidence",
          severity: "medium",
          status: "open",
          source_file: "spend.csv",
          owner: "Finance Operations",
        },
      ],
      enterprise_context_evidence: [{ evidence_usable: true }],
    };

    mockGetAzureReadFluentClient.mockReturnValue({
      from: (table: string) => ({
        select: (
          _columns: string,
          options?: { count?: "exact"; head?: boolean },
        ) => ({
          eq: () => ({
            range: () => runQuery(table, options),
            then: (
              onfulfilled: (value: unknown) => unknown,
              onrejected?: (error: unknown) => unknown,
            ) => runQuery(table, options).then(onfulfilled, onrejected),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof getAzureReadFluentClient>);

    const overview = await getEnterpriseContextOverviewForTenant(
      "meridian-health",
      "Meridian Health",
    );

    expect(overview?.counts.records).toBe(1);
    expect(maxActiveQueries).toBe(1);
    expect(queryOrder).toEqual([
      'enterprise_context_sources:count',
      'enterprise_context_records:count',
      'enterprise_context_facts:count',
      'enterprise_context_relationships:count',
      'enterprise_context_evidence:count',
      'enterprise_context_quality_issues:count',
      'enterprise_context_stewardship_tasks:count',
      'enterprise_context_chunk_queue:count',
      'enterprise_context_records:rows',
      'enterprise_context_sources:rows',
      'enterprise_context_quality_issues:rows',
      'enterprise_context_evidence:rows',
      'context_insights:rows',
    ]);

    async function runQuery(
      table: string,
      options?: { count?: "exact"; head?: boolean },
    ) {
      activeQueries += 1;
      maxActiveQueries = Math.max(maxActiveQueries, activeQueries);
      const isCount = options?.head === true;
      queryOrder.push(`${table}:${isCount ? "count" : "rows"}`);
      await new Promise((resolve) => setTimeout(resolve, 0));
      activeQueries -= 1;
      if (isCount)
        return { data: null, error: null, count: countByTable[table] ?? 0 };
      return { data: rowsByTable[table] ?? [], error: null, count: null };
    }
  });

  it("counts committed chunks as evidence for Admin-promoted records when normalized evidence is empty", async () => {
    let activeQueries = 0;
    let maxActiveQueries = 0;
    const queryOrder: string[] = [];
    const countByTable: Record<string, number> = {
      enterprise_context_sources: 1,
      enterprise_context_records: 1,
      enterprise_context_facts: 2,
      enterprise_context_relationships: 0,
      enterprise_context_evidence: 0,
      enterprise_context_quality_issues: 0,
      enterprise_context_stewardship_tasks: 0,
      enterprise_context_chunk_queue: 0,
      enterprise_context_chunks: 1542,
    };
    const rowsByTable: Record<string, unknown[]> = {
      enterprise_context_records: [
        record({
          record_type: "cmdb_application",
          title: "Oracle EBS",
          payload: { criticality: "Tier 1" },
        }),
      ],
      enterprise_context_sources: [
        {
          source_system: "admin_bulk_context_upload",
          display_name: "Admin context upload",
          system_of_record: true,
          source_owner: "Context Stewardship",
          last_synced_at: "2026-06-08T15:30:00Z",
        },
      ],
      enterprise_context_quality_issues: [],
      enterprise_context_evidence: [],
    };

    mockGetAzureReadFluentClient.mockReturnValue({
      from: (table: string) => ({
        select: (
          _columns: string,
          options?: { count?: "exact"; head?: boolean },
        ) => ({
          eq: () => ({
            range: () => runQuery(table, options),
            then: (
              onfulfilled: (value: unknown) => unknown,
              onrejected?: (error: unknown) => unknown,
            ) => runQuery(table, options).then(onfulfilled, onrejected),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof getAzureReadFluentClient>);

    const overview = await getEnterpriseContextOverviewForTenant(
      "lakeshore-holdings",
      "Lakeshore Holdings",
    );

    expect(overview?.counts.records).toBe(1);
    expect(overview?.counts.evidence).toBe(1542);
    expect(overview?.sentinelFacts.join("\n")).toContain(
      "1 records, 2 facts, 0 CI relationships, and 1542 evidence rows",
    );
    expect(maxActiveQueries).toBe(1);
    expect(queryOrder).toEqual([
      "enterprise_context_sources:count",
      "enterprise_context_records:count",
      "enterprise_context_facts:count",
      "enterprise_context_relationships:count",
      "enterprise_context_evidence:count",
      "enterprise_context_quality_issues:count",
      "enterprise_context_stewardship_tasks:count",
      "enterprise_context_chunk_queue:count",
      "enterprise_context_chunks:count",
      "enterprise_context_records:rows",
      "enterprise_context_sources:rows",
      "enterprise_context_quality_issues:rows",
      "enterprise_context_evidence:rows",
    ]);

    async function runQuery(
      table: string,
      options?: { count?: "exact"; head?: boolean },
    ) {
      activeQueries += 1;
      maxActiveQueries = Math.max(maxActiveQueries, activeQueries);
      const isCount = options?.head === true;
      queryOrder.push(`${table}:${isCount ? "count" : "rows"}`);
      await new Promise((resolve) => setTimeout(resolve, 0));
      activeQueries -= 1;
      if (isCount)
        return { data: null, error: null, count: countByTable[table] ?? 0 };
      return { data: rowsByTable[table] ?? [], error: null, count: null };
    }
  });

  it("falls back to Admin-loaded context chunks when normalized records are empty", async () => {
    const countByTable: Record<string, number> = {
      enterprise_context_sources: 0,
      enterprise_context_records: 0,
      enterprise_context_facts: 0,
      enterprise_context_relationships: 0,
      enterprise_context_evidence: 0,
      enterprise_context_quality_issues: 0,
      enterprise_context_stewardship_tasks: 0,
      enterprise_context_chunk_queue: 0,
    };
    const rowsByTable: Record<string, unknown[]> = {
      enterprise_context_chunks: [
        chunk({ source_doc: "01-org-decision-rights.csv", chunk_id: "org-1" }),
        chunk({
          source_doc: "03-cmdb-applications-services.csv",
          chunk_id: "cmdb-1",
        }),
        chunk({
          source_doc: "04-ci-relationships-dependencies.csv",
          chunk_id: "rel-1",
        }),
        chunk({
          source_doc: "05-vendors-contract-inventory.csv",
          chunk_id: "vendor-1",
        }),
        chunk({
          source_doc: "09-incidents.csv",
          chunk_id: "inc-1",
          embedding_status: "pending",
        }),
      ],
    };

    mockGetAzureReadFluentClient.mockReturnValue({
      from: (table: string) => ({
        select: (
          _columns: string,
          options?: { count?: "exact"; head?: boolean },
        ) => ({
          eq: () => ({
            range: () => {
              if (options?.head)
                return Promise.resolve({
                  data: null,
                  error: null,
                  count: countByTable[table] ?? 0,
                });
              return Promise.resolve({
                data: rowsByTable[table] ?? [],
                error: null,
                count: null,
              });
            },
            then: (
              onfulfilled: (value: unknown) => unknown,
              onrejected?: (error: unknown) => unknown,
            ) => {
              const result = options?.head
                ? { data: null, error: null, count: countByTable[table] ?? 0 }
                : { data: rowsByTable[table] ?? [], error: null, count: null };
              return Promise.resolve(result).then(onfulfilled, onrejected);
            },
          }),
        }),
      }),
    } as unknown as ReturnType<typeof getAzureReadFluentClient>);

    const overview = await getEnterpriseContextOverviewForTenant(
      "meridian-health",
      "Meridian Health System",
    );

    expect(overview).not.toBeNull();
    expect(overview?.counts.sources).toBe(5);
    expect(overview?.counts.records).toBe(0);
    expect(overview?.counts.facts).toBe(0);
    expect(overview?.counts.relationships).toBe(1);
    expect(overview?.counts.stewardshipTasks).toBe(1);
    expect(overview?.recordTypeCounts.org_decision_rights).toBe(1);
    expect(overview?.recordTypeCounts.cmdb_applications_services).toBe(1);
    expect(overview?.cards.map((card) => card.title)).toContain(
      "Embedded evidence coverage",
    );
    expect(overview?.sentinelFacts.join("\n")).toContain(
      "4 embedded context chunks across 5 Admin-loaded source files",
    );
    expect(overview?.sentinelFacts.join("\n")).toContain(
      "chunk-backed loader evidence",
    );
  });

  it("canonicalizes legacy app tenant aliases before reading chunk-backed context", async () => {
    const queriedTenantKeys: string[] = [];
    const countByTable: Record<string, number> = {
      enterprise_context_sources: 0,
      enterprise_context_records: 0,
      enterprise_context_facts: 0,
      enterprise_context_relationships: 0,
      enterprise_context_evidence: 0,
      enterprise_context_quality_issues: 0,
      enterprise_context_stewardship_tasks: 0,
      enterprise_context_chunk_queue: 0,
    };
    const rowsByTable: Record<string, unknown[]> = {
      enterprise_context_chunks: [
        chunk({
          source_doc: "03-cmdb-applications-services.csv",
          chunk_id: "cmdb-1",
        }),
      ],
    };

    mockGetAzureReadFluentClient.mockReturnValue({
      from: (table: string) => ({
        select: (
          _columns: string,
          options?: { count?: "exact"; head?: boolean },
        ) => ({
          eq: (_column: string, value: string) => {
            queriedTenantKeys.push(value);
            return {
              range: () => {
                if (options?.head)
                  return Promise.resolve({
                    data: null,
                    error: null,
                    count: countByTable[table] ?? 0,
                  });
                return Promise.resolve({
                  data: rowsByTable[table] ?? [],
                  error: null,
                  count: null,
                });
              },
              then: (
                onfulfilled: (value: unknown) => unknown,
                onrejected?: (error: unknown) => unknown,
              ) => {
                const result = options?.head
                  ? { data: null, error: null, count: countByTable[table] ?? 0 }
                  : {
                      data: rowsByTable[table] ?? [],
                      error: null,
                      count: null,
                    };
                return Promise.resolve(result).then(onfulfilled, onrejected);
              },
            };
          },
        }),
      }),
    } as unknown as ReturnType<typeof getAzureReadFluentClient>);

    const overview = await getEnterpriseContextOverviewForTenant(
      "meridian",
      "Meridian Health System",
    );

    expect(overview?.tenantKey).toBe("meridian-health");
    expect(overview?.counts.records).toBe(0);
    expect(overview?.counts.facts).toBe(0);
    expect(new Set(queriedTenantKeys)).toEqual(new Set(["meridian-health"]));
  });

  it("summarizes chunk-backed context with source-doc domain counts", () => {
    const overview = summarizeEnterpriseContextChunks({
      tenantKey: "meridian-health",
      tenantName: "Meridian Health System",
      chunks: [
        chunk({
          source_doc: "13-initiative-portfolio.csv",
          chunk_id: "init-1",
        }),
        chunk({
          source_doc: "14-data-domains-stewardship.csv",
          chunk_id: "data-1",
        }),
        chunk({
          source_doc: "15-risk-compliance-register.csv",
          chunk_id: "risk-1",
          embedding_status: "failed",
        }),
      ],
    });

    expect(overview.counts.records).toBe(0);
    expect(overview.counts.facts).toBe(0);
    expect(overview.evidenceUsableCount).toBe(2);
    expect(overview.counts.qualityIssues).toBe(1);
    expect(overview.recordTypeCounts.initiative_portfolio).toBe(1);
    expect(overview.recordTypeCounts.data_domains_stewardship).toBe(1);
    expect(overview.recordTypeCounts.risk_compliance_register).toBe(1);
    expect(overview.sentinelFacts.join("\n")).toContain("initiatives (1)");
  });
});

function chunk(
  overrides: Partial<EnterpriseContextChunkRow>,
): EnterpriseContextChunkRow {
  return {
    source_doc: "03-cmdb-applications-services.csv",
    source_record_id: "row-1",
    chunk_id: "chunk-1",
    chunk_text: "Epic is a Tier 1 clinical platform.",
    embedding_status: "embedded",
    embedding_model: "text-embedding-3-small",
    embedded_at: "2026-06-06T05:14:20.608Z",
    provenance: {},
    chunk_metadata: {},
    ...overrides,
  };
}
