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

function summarizeAliasRows(records: EnterpriseContextRecordRow[]) {
  return summarizeEnterpriseContextRows({
    tenantKey: "test-tenant",
    tenantName: "Test tenant",
    counts: {
      sources: 0,
      records: records.length,
      facts: 0,
      relationships: 0,
      evidence: 0,
      qualityIssues: 0,
      stewardshipTasks: 0,
      chunkQueue: 0,
    },
    records,
    sources: [],
    qualityRows: [],
    evidenceRows: [],
  });
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

  // Re-baselined 2026-09-24 (item T-756) as a whole case, not one string. It
  // failed at its first assertion from `8fe274ed8` (#7795, 2026-09-18) onward,
  // so the thirteen assertions after that line had not run since, and seven of
  // the fourteen were wrong. Six are behind #7795's deliberate change and are
  // re-baselined here; the seventh was a regression and is fixed in the read
  // model rather than re-baselined. What #7795 changed, and why each expectation
  // moved:
  //
  //  - `configuration_item` is deliberately no longer counted as an application
  //    or service, so the fixture's CI plus one application reads 1, not 2. The
  //    sibling case "does not count a configuration item as an application or
  //    service" is #7795's own assertion of that decision.
  //  - `data_asset` and `business_capability` are no longer counted as
  //    data-domain/stewardship rows. #7795's record states the decision as
  //    "exclude adjacent but distinct record types from application/service,
  //    vendor/contract, and data-domain/stewardship counts", and its alias table
  //    pairs `data_domains_stewardship` with `data_domain` only, so the fixture's
  //    data asset plus business capability reads 0, not 2.
  //  - the card and fact copy was renamed to say "records" rather than implying
  //    distinct entities: "systems/services" became "application/service
  //    record(s)", "vendors/contracts" became "vendor/contract record(s)",
  //    "N are Tier 1" became "N marked Tier 1", and "data-domain stewardship"
  //    gained its slash. The counts are of source rows across aliases and are
  //    not de-duplicated, which is what the rename exists to stop overstating.
  //
  // The vendor-spend assertion below is NOT re-baselined. It asserts $1.8M sized
  // from `annual_value_usd`, which PR #3316 (`b46b5e82f`, 2026-06-08) bound for
  // exactly that reason; the binding was lost as collateral of a bad merge and
  // is restored in `buildVendorSpendRows`. See the focused case
  // "sizes a vendor spend row from a contract's annual_value_usd" below, which
  // pins it independently of this composite fixture.
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

    expect(platformCard?.whatWeKnow).toContain(
      "1 application/service record loaded",
    );
    expect(platformCard?.whatWeKnow).toContain("1 marked Tier 1");
    expect(contractCard?.whatWeKnow).toContain("1 vendor/contract record");
    expect(initiativeCard?.whatWeKnow).toContain(
      "1 initiatives and 0 data-domain/stewardship records",
    );
    expect(facts).toContain("org and decision rights (1)");
    expect(facts).toContain("facilities/business units (2)");
    expect(facts).toContain("application/service records (1)");
    expect(facts).toContain("vendor/contract records (1)");
    expect(facts).toContain("KPIs/metrics (1)");
    expect(facts).toContain("initiatives (1)");
    expect(facts).toContain("data-domain/stewardship records (0)");
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

  it.each([
    ["org_decision_rights", "org_role", "org and decision rights (2)"],
    ["org_decision_rights", "decision_right", "org and decision rights (2)"],
    ["facilities_business_units", "facility", "facilities/business units (2)"],
    ["facilities_business_units", "business_unit", "facilities/business units (2)"],
    ["cmdb_applications_services", "cmdb_application", "application/service records (2)"],
    ["cmdb_applications_services", "cmdb_service", "application/service records (2)"],
    ["incidents", "incident", "incidents (2)"],
    ["problems", "problem", "problems (2)"],
    ["changes", "change", "changes (2)"],
    ["renewal_calendar", "renewal", "renewals (2)"],
    ["vendors_contract_inventory", "contract", "vendor/contract records (2)"],
    ["financial_kpis", "kpi_metric", "KPIs/metrics (2)"],
    ["policies_procedures", "policy", "policies/procedures (2)"],
    ["policies_procedures", "procedure", "policies/procedures (2)"],
    ["initiative_portfolio", "initiative", "initiatives (2)"],
    ["data_domains_stewardship", "data_domain", "data-domain/stewardship records (2)"],
    ["risk_compliance_register", "risk", "risks/compliance (2)"],
    ["risk_compliance_register", "compliance_finding", "risks/compliance (2)"],
  ])("counts %s and %s as recorded rows", (legacyType, promotedType, expectedFact) => {
    const overview = summarizeAliasRows([
      record({ record_type: legacyType, title: "Legacy row" }),
      record({ record_type: promotedType, title: "Promoted row" }),
    ]);

    expect(overview.sentinelFacts.join("\n")).toContain(expectedFact);
    expect(overview.recordTypeCounts).toMatchObject({
      [legacyType]: 1,
      [promotedType]: 1,
    });
  });

  // Added 2026-09-24 (item T-756). PR #3316 (`b46b5e82f`, 2026-06-08) added
  // `annual_value_usd` to the spend key chain in `buildVendorSpendRows` so
  // structured vendor contracts promoted through Admin would size rather than
  // render "Not sized". The 1,223-file squash `6ebe6d4a9` (2026-07-07) left the
  // pre-#3316 copy of that function live and a post-#3316 copy orphaned inside
  // `countEnterpriseContextRows`; `70874ff0e`, twenty minutes later, correctly
  // deleted the orphan as dead code and took the last copy of the binding with
  // it. The composite case above asserted the sized value and would have caught
  // it, but from 2026-09-18 it failed at its first assertion, and the suite runs
  // in no CI job. This case pins each contract-side key on its own so a single
  // key lost from the chain fails here by name rather than inside a fixture that
  // is asserting fourteen other things.
  it.each([
    ["annual_spend_usd"],
    ["annualized_spend_usd"],
    ["ttm_spend_usd"],
    ["run_rate_usd"],
    ["contract_value_usd"],
    ["annual_value_usd"],
    ["estimated_annual_value_usd"],
    ["estimated_value_usd"],
  ])("sizes a vendor spend row from a contract's %s", (spendKey) => {
    const overview = summarizeAliasRows([
      record({
        record_type: "contract",
        title: "Kyriba contract",
        payload: { vendor_name: "Kyriba", [spendKey]: "1800000" },
      }),
    ]);

    expect(overview.vendorSpendRows).toHaveLength(1);
    expect(overview.vendorSpendRows[0]).toMatchObject({
      vendor: "Kyriba",
      spendUsdM: 1.8,
      spendLabel: "$1.8M",
    });
  });

  it("reads a renewal row's annual_value_usd when the contract carries no spend", () => {
    const overview = summarizeAliasRows([
      record({
        record_type: "contract",
        title: "Kyriba contract",
        payload: { vendor_name: "Kyriba" },
      }),
      record({
        record_type: "renewal",
        title: "Kyriba renewal",
        payload: { vendor_name: "Kyriba", annual_value_usd: "1800000" },
      }),
    ]);

    expect(overview.vendorSpendRows).toHaveLength(1);
    expect(overview.vendorSpendRows[0]).toMatchObject({
      vendor: "Kyriba",
      spendUsdM: 1.8,
      spendLabel: "$1.8M",
    });
  });

  it("leaves a contract with no recognized spend key unsized rather than guessing", () => {
    const overview = summarizeAliasRows([
      record({
        record_type: "contract",
        title: "Kyriba contract",
        payload: { vendor_name: "Kyriba", annual_value_eur: "1800000" },
      }),
    ]);

    expect(overview.vendorSpendRows[0]).toMatchObject({
      vendor: "Kyriba",
      spendUsdM: 0,
      spendLabel: "Not sized",
    });
  });

  it("does not count a configuration item as an application or service", () => {
    const overview = summarizeAliasRows([
      record({ record_type: "cmdb_application", title: "Application", payload: { ci_id: "CI-1" } }),
      record({ record_type: "configuration_item", title: "Underlying CI", payload: { ci_id: "CI-1" } }),
    ]);

    expect(overview.cards.find((card) => card.key === "platform-and-service-reliability")?.whatWeKnow)
      .toContain("1 application/service record loaded");
    expect(overview.sentinelFacts.join("\n")).toContain("application/service records (1)");
  });

  it("does not present vendor and data-asset rows as contracts or data domains", () => {
    const overview = summarizeAliasRows([
      record({ record_type: "contract", title: "Agreement" }),
      record({ record_type: "vendor", title: "Supplier" }),
      record({ record_type: "data_domain", title: "Finance domain" }),
      record({ record_type: "data_asset", title: "Finance dataset" }),
    ]);

    expect(overview.sentinelFacts.join("\n")).toContain("vendor/contract records (1)");
    expect(overview.sentinelFacts.join("\n")).toContain("Commercial posture: 1 vendor/contract record");
    expect(overview.sentinelFacts.join("\n")).toContain("data-domain/stewardship records (1)");
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
      // Added by the Intelligence executive briefing surface (6ebe6d4a9),
      // which introduced the context_insights read. The expected sequence was
      // not updated with it, so this case has been red ever since -- unseen,
      // because no workflow reaches this directory.
      "context_insights:rows",
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
