jest.mock('server-only', () => ({}));

import {
  retrieveTenantEnterpriseSources,
  retrieveTenantStructuredFacts,
  selectTenantEnterpriseSegments,
} from '@/lib/knowledge/tenant-enterprise-context';
import type {
  ContextChunk,
  GraphEdge,
  GraphNeighborhood,
  GraphNode,
  SegmentId,
  TenantDataAdapter,
} from '@/lib/knowledge/tenant-data';

let fakeAdapter: TenantDataAdapter;
let fakeTables: Record<string, unknown[]> | null = null;

jest.mock('@/lib/knowledge/tenant-data', () => {
  const actual = jest.requireActual('@/lib/knowledge/tenant-data');
  return {
    ...actual,
    getTenantDataAdapter: (): TenantDataAdapter => fakeAdapter,
  };
});

jest.mock('@/lib/data-plane/read-adapters/azureSession', () => ({
  createDefaultSession: () => async (fn: (run: (sql: string, params: unknown[]) => Promise<unknown[]>) => Promise<unknown>) => {
    if (!fakeTables) throw new Error('Postgres test tables not configured');
    const run = async (sql: string): Promise<unknown[]> => {
      const table = tableFromSql(sql);
      let rows = [...(fakeTables?.[table] ?? (table === 'clients' ? [{ id: 'northstar-client' }] : []))];
      if (table === 'applications' && /\bGROUP\s+BY\b/i.test(sql)) {
        const grouped = new Map<string, { business_function: string; application_count: number; annual_cost_usd: number }>();
        for (const row of rows as Array<{ business_function?: string | null; annual_cost_usd?: number | string | null }>) {
          const businessFunction = row.business_function?.trim() || 'unknown';
          const current = grouped.get(businessFunction) ?? {
            business_function: businessFunction,
            application_count: 0,
            annual_cost_usd: 0,
          };
          current.application_count += 1;
          const cost = typeof row.annual_cost_usd === 'number' ? row.annual_cost_usd : Number(row.annual_cost_usd ?? 0);
          current.annual_cost_usd += Number.isFinite(cost) ? cost : 0;
          grouped.set(businessFunction, current);
        }
        rows = [...grouped.values()].sort((a, b) => b.application_count - a.application_count || b.annual_cost_usd - a.annual_cost_usd);
      }
      const limit = Number(sql.match(/LIMIT\s+(\d+)/i)?.[1] ?? rows.length);
      rows = rows.slice(0, limit);
      return rows;
    };
    return fn(run);
  },
}));

function tableFromSql(sql: string): string {
  const match = sql.match(/\bFROM\s+([a-z_]+)/i);
  if (!match) throw new Error(`No table in SQL: ${sql}`);
  return match[1]!;
}

function makeEmptyAdapter(): TenantDataAdapter {
  return {
    listSegments: () => Promise.resolve([]),
    listRecords: () => Promise.resolve([]),
    getRecord: () => Promise.resolve(null),
    listGraphNodes: () => Promise.resolve([]),
    listGraphEdgesForNode: () => Promise.resolve([]),
    getGraphNeighborhood: (_tenantKey, rootId) => {
      const neighborhood: GraphNeighborhood = { rootId, nodes: [], edges: [], depth: 0 };
      return Promise.resolve(neighborhood);
    },
    pathBetween: () => Promise.resolve(null),
    listContextChunks: () => Promise.resolve([]),
    chunksByRecord: () => Promise.resolve([]),
    chunksByKeyword: () => Promise.resolve([]),
    chunksByVector: () => Promise.reject(new Error('Vector retrieval not enabled.')),
    getEvidence: () => Promise.resolve(null),
    hasPersistedData: () => Promise.resolve(false),
  };
}

function chunk(segmentId: SegmentId, text: string, sourceDoc = `${segmentId}.csv`): ContextChunk {
  return {
    tenantKey: 'meridian-health',
    chunkId: `${segmentId}:chunk:1`,
    sourceSegmentId: segmentId,
    sourceDoc,
    recordId: `${segmentId}:record:1`,
    text,
    embeddingStatus: 'pending',
  };
}

function person(nodeId: string, title: string, payload: Record<string, unknown> = {}): GraphNode {
  return {
    tenantKey: 'meridian-health',
    nodeId,
    kind: 'person',
    title,
    payload,
  };
}

function mockPostgresTables(tables: Record<string, unknown[]>): void {
  fakeTables = {
    clients: [{ id: 'northstar-client' }],
    ...tables,
  };
}

function reportsTo(fromNodeId: string, toNodeId: string): GraphEdge {
  return {
    tenantKey: 'meridian-health',
    edgeId: `${fromNodeId}:reports-to:${toNodeId}`,
    fromNodeId,
    toNodeId,
    kind: 'REPORTS_TO',
  };
}

describe('tenant enterprise context retrieval', () => {
  beforeEach(() => {
    fakeTables = null;
    const chunks = [
      chunk(
        'enterprise_profile',
        'enterprise: Meridian Health integrated delivery network with Epic as system of record and an enterprise IT operating model.',
        'enterprise_profile.md',
      ),
      chunk(
        'org_structure',
        'name: Dr. Anita Krishnamurthy role: EVP CDIO reports_to: CEO owns: Data and Analytics, Clinical Informatics, AI Platform',
        'executive_bench.csv',
      ),
      chunk(
        'it_financials',
        'category: Total IT Spend fy2026_planned_usd: 312000000 run_change_transform: CIO_run / CIO_change / CIO_transform notes: FY2026 IT budget envelope',
        'it_spend_breakdown.csv',
      ),
      chunk(
        'it_landscape',
        'system_name: Epic Cogito vendor: Epic category: clinical analytics platform owner_id: person:meridian:data-analytics',
        'systems_inventory.csv',
      ),
    ];
    fakeAdapter = {
      ...makeEmptyAdapter(),
      listContextChunks: (_tenantKey, opts) => {
        const requested = new Set(opts?.segmentIds ?? []);
        return Promise.resolve(chunks.filter((item) => requested.has(item.sourceSegmentId as SegmentId)));
      },
    };
  });

  it('selects both org structure and IT financials for leadership plus budget questions', () => {
    expect(selectTenantEnterpriseSegments('What do you know about my IT leadership team and my budget?')).toEqual(
      expect.arrayContaining(['org_structure', 'it_financials']),
    );
  });

  it('treats direct-report questions as tenant org-structure questions', () => {
    expect(selectTenantEnterpriseSegments('Who are my direct reports?')).toEqual(
      expect.arrayContaining(['org_structure']),
    );
  });

  it('treats C-level business leader questions as tenant org-structure questions', () => {
    expect(selectTenantEnterpriseSegments('Who is my C level leaders in business?')).toEqual(
      expect.arrayContaining(['org_structure']),
    );
  });

  it('retrieves persisted org and budget chunks for any tenant key before Sentinel says data is unavailable', async () => {
    const sources = await retrieveTenantEnterpriseSources(
      'meridian-health',
      'What do you know about my IT leadership team and my budget?',
    );
    const detail = sources.map((source) => source.detail).join('\n');

    expect(sources.map((source) => source.id)).toEqual(
      expect.arrayContaining([
        'meridian-health:enterprise_profile',
        'meridian-health:org_structure',
        'meridian-health:it_financials',
      ]),
    );
    expect(detail).toContain('Dr. Anita Krishnamurthy');
    expect(detail).toContain('FY2026 IT budget envelope');
    expect(detail).toContain('Use these persisted setup-data chunks before saying tenant profile, org structure, budget, or system context is unavailable.');
  });

  it('normalizes SkyHarbor app aliases to the loaded skyharbor-air tenant key before chunk lookup', async () => {
    const seenTenantKeys: string[] = [];
    fakeAdapter = {
      ...makeEmptyAdapter(),
      listContextChunks: (tenantKey, opts) => {
        seenTenantKeys.push(tenantKey);
        const requested = new Set(opts?.segmentIds ?? []);
        if (tenantKey !== 'skyharbor-air' || !requested.has('it_financials')) return Promise.resolve([]);
        return Promise.resolve([
          chunk(
            'it_financials',
            'Pattern AIR-M-011-10: IBM Restructure Leverage AWS EDP True Up. The value ledger shows promised vs realized modernization value is disputed.',
            'AIRLINE_INDUSTRY_PATTERN_OVERLAY_v1.md',
          ),
        ]);
      },
    };

    const sources = await retrieveTenantEnterpriseSources(
      'skyharbor',
      "Where is the through-line between our IBM dependency and Amala's modernization pressure?",
    );
    const detail = sources.map((source) => source.detail).join('\n');

    expect(seenTenantKeys).toContain('skyharbor-air');
    expect(sources.map((source) => source.id)).toContain('skyharbor-air:it_financials');
    expect(detail).toContain('AIR-M-011-10');
    expect(detail).toContain('value ledger');
  });

  it('adds a graph-backed direct-reports source for the active profile across clients', async () => {
    const active = person('person:meridian:anita-krishnamurthy', 'Dr. Anita Krishnamurthy', {
      title: 'EVP, Chief Digital and Information Officer',
      function: 'Digital and Information',
    });
    const cmio = person('person:meridian:jennifer-wexler', 'Dr. Jennifer Wexler', {
      title: 'Chief Medical Information Officer',
      function: 'Clinical Informatics',
    });
    const infra = person('person:meridian:marco-silva', 'Marco Silva', {
      title: 'VP Infrastructure and Cloud',
      function: 'Infrastructure and Cloud',
    });
    fakeAdapter = {
      ...fakeAdapter,
      listGraphNodes: (_tenantKey, kind) => Promise.resolve(kind === 'person' ? [active, cmio, infra] : []),
      listGraphEdgesForNode: (_tenantKey, nodeId, direction) => {
        if (nodeId !== active.nodeId || direction !== 'incoming') return Promise.resolve([]);
        return Promise.resolve([
          reportsTo(cmio.nodeId, active.nodeId),
          reportsTo(infra.nodeId, active.nodeId),
        ]);
      },
    };

    const sources = await retrieveTenantEnterpriseSources(
      'meridian-health',
      'Who are my direct reports?',
      { activePersonGraphNodeId: active.nodeId, activePersonDisplayName: active.title },
    );
    const directReports = sources.find((source) => source.id.includes(':direct_reports:'));

    expect(directReports?.detail).toContain('This is an in-domain tenant org-structure lookup.');
    expect(directReports?.detail).toContain('Dr. Jennifer Wexler');
    expect(directReports?.detail).toContain('Marco Silva');
  });

  it('falls back to org-structure chunks when graph nodes are unavailable', async () => {
    fakeAdapter = {
      ...fakeAdapter,
      listGraphNodes: () => Promise.resolve([]),
      listGraphEdgesForNode: () => Promise.resolve([]),
      listContextChunks: (_tenantKey, opts) => {
        const requested = new Set(opts?.segmentIds ?? []);
        if (!requested.has('org_structure')) return Promise.resolve([]);
        return Promise.resolve([
          chunk(
            'org_structure',
            'id: person:meridian:linda-howard full_name: Linda Howard title: VP Enterprise Architecture scope: shared reports_to: person:meridian:anita-krishnamurthy vacancy_status: Filled',
            'it_leadership.json',
          ),
          chunk(
            'org_structure',
            'id: person:meridian:wei-zhang full_name: Wei Zhang title: VP Infrastructure & Cloud scope: shared reports_to: person:meridian:anita-krishnamurthy vacancy_status: Filled',
            'it_leadership.json',
          ),
        ]);
      },
    };

    const sources = await retrieveTenantEnterpriseSources(
      'meridian-health',
      'Who are my direct reports?',
      { activePersonGraphNodeId: 'person:meridian:anita-krishnamurthy', activePersonDisplayName: 'Dr. Anita Krishnamurthy' },
    );
    const directReports = sources.find((source) => source.id.includes(':direct_reports:'));

    expect(directReports?.detail).toContain('Linda Howard — VP Enterprise Architecture — scope: shared');
    expect(directReports?.detail).toContain('Wei Zhang — VP Infrastructure & Cloud — scope: shared');
  });

  it('adds a parsed C-level business leader source from executive org chunks', async () => {
    fakeAdapter = {
      ...fakeAdapter,
      listContextChunks: (_tenantKey, opts) => {
        const requested = new Set(opts?.segmentIds ?? []);
        if (!requested.has('org_structure')) return Promise.resolve([]);
        return Promise.resolve([
          chunk(
            'org_structure',
            'id: person:meridian:elaine-morales full_name: Dr. Elaine Morales title: President & Chief Executive Officer scope: system reports_to: Board',
            'executive_bench.json',
          ),
          chunk(
            'org_structure',
            'id: person:meridian:david-park full_name: David Park title: Chief Financial Officer scope: system reports_to: person:meridian:elaine-morales',
            'executive_bench.json',
          ),
          chunk(
            'org_structure',
            'id: person:meridian:anita-krishnamurthy full_name: Dr. Anita Krishnamurthy title: Chief Digital and Information Officer scope: system reports_to: person:meridian:elaine-morales',
            'executive_bench.json',
          ),
          chunk(
            'org_structure',
            'id: person:meridian:kavita-patel full_name: Dr. Kavita Patel title: Associate CMIO, AI scope: provider reports_to: person:meridian:jennifer-wexler',
            'it_leadership.json',
          ),
        ]);
      },
    };

    const sources = await retrieveTenantEnterpriseSources('meridian-health', 'Who is my C level leaders in business?');
    const cLevel = sources.find((source) => source.id === 'meridian-health:c_level_business_leaders');

    expect(cLevel?.detail).toContain('Dr. Elaine Morales — President & Chief Executive Officer');
    expect(cLevel?.detail).toContain('David Park — Chief Financial Officer');
    expect(cLevel?.detail).not.toContain('Chief Digital and Information Officer');
    expect(cLevel?.detail).not.toContain('Associate CMIO');
  });

  it('does not inject tenant enterprise context for off-domain questions', async () => {
    const sources = await retrieveTenantEnterpriseSources('first-capital-financial', 'What is the capital of Italy?');

    expect(sources).toEqual([]);
  });

  it('normalizes legacy Apex aliases before chunks reach the Sentinel prompt', async () => {
    fakeAdapter = {
      ...makeEmptyAdapter(),
      listContextChunks: (_tenantKey, opts) => {
        const requested = new Set(opts?.segmentIds ?? []);
        if (!requested.has('enterprise_profile')) return Promise.resolve([]);
        return Promise.resolve([
          chunk('enterprise_profile', 'Asterline Retail Group is the active tenant. Asterline Retail operates specialty banners.'),
        ]);
      },
    };

    const sources = await retrieveTenantEnterpriseSources('apex-retail', 'What do you know about my company profile?');
    const detail = sources.map((source) => source.detail).join('\n');

    expect(detail).toContain('Apex Retail Group');
    expect(detail).toContain('Apex Retail operates specialty banners');
    expect(detail).not.toContain('Asterline');
  });

  it('preserves canonical Meridian and First Capital names before chunks reach the Sentinel prompt', async () => {
    fakeAdapter = {
      ...makeEmptyAdapter(),
      listContextChunks: (_tenantKey, opts) => {
        const requested = new Set(opts?.segmentIds ?? []);
        if (!requested.has('enterprise_profile')) return Promise.resolve([]);
        return Promise.resolve([
          chunk('enterprise_profile', 'Meridian Health and First Capital Financial are canonical demo labels.'),
        ]);
      },
    };

    const sources = await retrieveTenantEnterpriseSources('meridian-health', 'What do you know about my company profile?');
    const detail = sources.map((source) => source.detail).join('\n');

    expect(detail).toContain('Meridian Health');
    expect(detail).toContain('First Capital Financial');
  });

  it('adds Northstar structured application rows before Sentinel reaches for industry-typical clinical systems', async () => {
    mockPostgresTables({
      applications: [
        {
          id: 'app-row-234',
          name: 'Java legacy Capability 234',
          vendor: 'SAP',
          business_function: 'BU-AWC',
          deployment_model: 'on_prem',
          criticality: 'tier1',
          status: 'active',
          annual_cost_usd: 17298000,
        },
        {
          id: 'app-row-225',
          name: 'Modern microservice Capability 225',
          vendor: 'Infosys',
          business_function: 'BU-STERILE',
          deployment_model: 'hybrid',
          criticality: 'tier1',
          status: 'active',
          annual_cost_usd: 16650000,
        },
      ],
    });

    const sources = await retrieveTenantEnterpriseSources(
      'northstar-clinical',
      "What's our application portfolio? Walk me through the top apps by criticality.",
    );
    const detail = sources.map((source) => source.detail).join('\n');

    expect(detail).toContain('NST-APP-234 Java legacy Capability 234');
    expect(detail).toContain('NST-APP-225 Modern microservice Capability 225');
    expect(detail).toContain('Answer app-portfolio and criticality questions from these rows');
    expect(detail).not.toContain('Epic EHR');
    expect(detail).not.toContain('Meditech');
  });

  it('adds Northstar structured vendor contract rows with renewal and exit terms', async () => {
    mockPostgresTables({
      vendor_contracts: [
        {
          vendor_id: 'NST-VEND-090',
          vendor_name: 'SAP Program 90',
          contract_category: 'PLM',
          annual_contract_value_usd: 31200000,
          renewal_date: '2026-07-15T05:00:00.000Z',
          exit_terms_jsonb: { summary: 'annual renewal window' },
          ai_usage_clauses: true,
          indemnity_provided: true,
          concentration_pct: 2.1,
        },
      ],
    });

    const sources = await retrieveTenantEnterpriseSources(
      'northstar-clinical',
      'Name 3 most-exposed vendor renewals.',
    );
    const detail = sources.map((source) => source.detail).join('\n');

    expect(detail).toContain('NST-VEND-090 SAP Program 90');
    expect(detail).toContain('annual_value $31.2M');
    expect(detail).toContain('renewal 2026-07-15');
    expect(detail).toContain('exit_terms "annual renewal window"');
  });

  it('adds Northstar structured initiative rows for kill-list questions', async () => {
    mockPostgresTables({
      ai_initiatives: [
        {
          initiative_id: 'NST-INIT-AS400-REBATES',
          display_id: 'NST-AS400-REBATES',
          name: 'AS/400 Distributor Rebates Retirement',
          stage: 'pilot',
          status_flag: 'stalled',
          committed_total_usd: 7200000,
          measured_value_usd: 21600000,
          status_summary: 'kill',
          metadata: { sentinel_posture: 'kill' },
        },
      ],
    });

    const sources = await retrieveTenantEnterpriseSources(
      'northstar-clinical',
      'Which active initiatives should we kill?',
    );
    const detail = sources.map((source) => source.detail).join('\n');

    expect(detail).toContain('NST-INIT-AS400-REBATES');
    expect(detail).toContain('AS/400 Distributor Rebates Retirement');
    expect(detail).toContain('Sentinel posture kill');
    expect(detail).toContain('committed $7.2M');
  });

  it('adds SkyHarbor DORA scorecard rows for engineering productivity questions', async () => {
    mockPostgresTables({
      enterprise_context_chunks: [
        {
          chunk_id: 'SHA-CHUNK-0282',
          source_segment_id: 'enterprise_profile',
          source_doc: 'source_uploads/dora_productivity_baseline.csv',
          chunk_text: 'SkyHarbor record in S09_ENGINEERING_PRODUCTIVITY. Key facts: scorecard_id=SHA-DORA-001; lead_time_for_change_hours=8; deploy_frequency_per_week=25; MTTR_hours=1.5; change_failure_rate_pct=4.',
        },
        {
          chunk_id: 'SHA-CHUNK-0284',
          source_segment_id: 'enterprise_profile',
          source_doc: 'source_uploads/dora_productivity_baseline.csv',
          chunk_text: 'SkyHarbor record in S09_ENGINEERING_PRODUCTIVITY. Key facts: scorecard_id=SHA-DORA-003; lead_time_for_change_hours=80; deploy_frequency_per_week=3; MTTR_hours=12; change_failure_rate_pct=18.',
        },
      ],
    });

    const sources = await retrieveTenantEnterpriseSources(
      'skyharbor',
      "How are we performing on DORA metrics by domain, and where's the modernization correlation?",
    );
    const detail = sources.map((source) => source.detail).join('\n');

    expect(sources.map((source) => source.id)).toContain('skyharbor-air:structured:engineering_productivity');
    expect(detail).toContain('SHA-DORA-001 · Mobile Digital · lead_time 8h · deploy_frequency 25/week');
    expect(detail).toContain('SHA-DORA-003 · Mainframe Core · lead_time 80h · deploy_frequency 3/week');
    expect(detail).toContain('Use these exact scorecard IDs and metrics before saying DORA');
  });

  it('returns explicit 0.99 structured facts for top-app criticality questions', async () => {
    mockPostgresTables({
      applications: [
        {
          id: 'app-row-234',
          name: 'Java legacy Capability 234',
          vendor: 'SAP',
          business_function: 'BU-HIS',
          deployment_model: 'on_prem',
          criticality: 'tier1',
          status: 'active',
          annual_cost_usd: 17298000,
        },
      ],
    });

    const sources = await retrieveTenantStructuredFacts('northstar-clinical', 'Top 5 apps by criticality, name them');

    expect(sources).toHaveLength(1);
    expect(sources[0]?.confidence).toBe(0.99);
    expect(sources[0]?.detail).toContain('NST-APP-234');
    expect(sources[0]?.detail).toContain('Do not substitute industry-typical provider EHR');
  });

  it('returns application-count structured rows for chart-by-domain questions', async () => {
    mockPostgresTables({
      applications: [
        {
          id: 'app-row-234',
          name: 'Java legacy Capability 234',
          vendor: 'SAP',
          business_function: 'Clinical Operations',
          deployment_model: 'on_prem',
          criticality: 'tier1',
          status: 'active',
          annual_cost_usd: 17298000,
        },
        {
          id: 'app-row-235',
          name: 'Modern microservice Capability 235',
          vendor: 'Infosys',
          business_function: 'Clinical Operations',
          deployment_model: 'hybrid',
          criticality: 'tier2',
          status: 'active',
          annual_cost_usd: 6100000,
        },
        {
          id: 'app-row-240',
          name: 'Revenue Cycle Capability 240',
          vendor: 'Oracle',
          business_function: 'Revenue Cycle',
          deployment_model: 'saas',
          criticality: 'tier2',
          status: 'active',
          annual_cost_usd: 4100000,
        },
      ],
    });

    const sources = await retrieveTenantStructuredFacts(
      'northstar-clinical',
      'Give me a chart of our application count by domain.',
    );
    const aggregate = sources.find((source) =>
      source.id.endsWith(':structured-fact:application-count-by-function'),
    );

    expect(aggregate?.confidence).toBe(0.99);
    expect(aggregate?.structured?.tables[0]?.chart).toEqual(
      expect.objectContaining({
        labelKey: 'function',
        valueKey: 'applicationCount',
      }),
    );
    expect(aggregate?.structured?.tables[0]?.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          function: 'Clinical Operations',
          applicationCount: 2,
        }),
        expect.objectContaining({
          function: 'Revenue Cycle',
          applicationCount: 1,
        }),
      ]),
    );
  });

  it('returns initiative rows for visual AI-spend and value-at-stake questions', async () => {
    mockPostgresTables({
      ai_initiatives: [
        {
          initiative_id: 'NST-INIT-CODING-AI',
          display_id: 'NST-CODING-AI',
          name: 'Clinical Coding AI Modernization',
          stage: 'pilot',
          status_flag: 'healthy',
          committed_total_usd: 42000000,
          measured_value_usd: 126000000,
          status_summary: 'accelerate',
          metadata: { sentinel_posture: 'accelerate_with_guardrails' },
        },
        {
          initiative_id: 'NST-INIT-DENIALS',
          display_id: 'NST-DENIALS',
          name: 'Denials Prevention AI',
          stage: 'industrialize',
          status_flag: 'at_risk',
          committed_total_usd: 18000000,
          measured_value_usd: 54000000,
          status_summary: 'fix_data_first',
          metadata: { sentinel_posture: 'hold_until_source_quality' },
        },
      ],
    });

    const sources = await retrieveTenantStructuredFacts(
      'northstar-clinical',
      'Chart our AI spend by initiative and show value at stake.',
    );
    const initiatives = sources.find((source) =>
      source.id.endsWith(':structured-fact:active-initiatives'),
    );

    expect(initiatives?.structured?.tables[0]?.chart).toEqual(
      expect.objectContaining({
        labelKey: 'initiative',
        valueKey: 'committed',
      }),
    );
    expect(initiatives?.detail).toContain('Clinical Coding AI Modernization');
    expect(initiatives?.detail).toContain('Denials Prevention AI');
  });

  it('returns relationship-ready structured rows for dependency graph questions', async () => {
    mockPostgresTables({
      applications: [
        {
          id: 'app-row-234',
          name: 'Java legacy Capability 234',
          vendor: 'SAP',
          business_function: 'Clinical Operations',
          deployment_model: 'on_prem',
          criticality: 'tier1',
          status: 'active',
          annual_cost_usd: 17298000,
        },
      ],
      vendor_contracts: [
        {
          vendor_id: 'NST-VEND-090',
          vendor_name: 'SAP Program 90',
          contract_category: 'ERP',
          annual_contract_value_usd: 31200000,
          renewal_date: '2026-07-15T05:00:00.000Z',
          exit_terms_jsonb: { summary: 'annual renewal window' },
          ai_usage_clauses: true,
          indemnity_provided: true,
          concentration_pct: 2.1,
        },
      ],
      ai_initiatives: [
        {
          initiative_id: 'NST-INIT-S4-WAVE0',
          display_id: 'NST-S4-WAVE0',
          name: 'SAP S/4 Global Consolidation Wave 0',
          stage: 'multi_year_strategic_bet',
          status_flag: 'value_lag',
          committed_total_usd: 68000000,
          measured_value_usd: 204000000,
          status_summary: 'hold_contested',
          metadata: { sentinel_posture: 'hold_contested' },
        },
      ],
    });

    const sources = await retrieveTenantStructuredFacts(
      'northstar-clinical',
      'Show me the dependency graph of our core systems and initiatives.',
    );

    expect(sources.map((source) => source.id)).toEqual(
      expect.arrayContaining([
        'northstar-clinical:structured-fact:top-applications',
        'northstar-clinical:structured-fact:top-vendors',
        'northstar-clinical:structured-fact:active-initiatives',
      ]),
    );
    expect(sources.flatMap((source) => source.structured?.tables ?? []).some((table) => Boolean(table.graph))).toBe(true);
  });

  it('returns explicit 0.99 structured facts for vendor renewals in the next six months', async () => {
    mockPostgresTables({
      vendor_contracts: [
        {
          vendor_id: 'NST-VEND-090',
          vendor_name: 'SAP Program 90',
          contract_category: 'PLM',
          annual_contract_value_usd: 31200000,
          renewal_date: '2026-07-15T05:00:00.000Z',
          exit_terms_jsonb: { summary: 'annual renewal window' },
          ai_usage_clauses: true,
          indemnity_provided: true,
          concentration_pct: 2.1,
        },
        {
          vendor_id: 'NST-VEND-001',
          vendor_name: 'Oracle',
          contract_category: 'QMS',
          annual_contract_value_usd: 940000,
          renewal_date: '2027-02-15T05:00:00.000Z',
          exit_terms_jsonb: { summary: 'annual renewal window' },
          ai_usage_clauses: false,
          indemnity_provided: false,
          concentration_pct: 0.1,
        },
      ],
    });

    const sources = await retrieveTenantStructuredFacts('northstar-clinical', 'Name 3 most-exposed vendor renewals in the next 6 months');
    const detail = sources.map((source) => source.detail).join('\n');

    expect(sources[0]?.confidence).toBe(0.99);
    expect(detail).toContain('NST-VEND-090');
    expect(detail).not.toContain('NST-VEND-001');
  });

  it('returns explicit 0.99 structured facts for active initiatives and excludes closed records', async () => {
    mockPostgresTables({
      ai_initiatives: [
        {
          initiative_id: 'NST-INIT-CODING-AI',
          display_id: 'NST-CODING-AI',
          name: 'Clinical Coding AI Modernization',
          stage: 'pilot',
          status_flag: 'healthy',
          committed_total_usd: 42000000,
          measured_value_usd: 126000000,
          status_summary: 'accelerate',
          metadata: { sentinel_posture: 'accelerate_with_guardrails' },
        },
        {
          initiative_id: 'NST-CLOSED-LEGACY',
          display_id: 'NST-C-LEGACY',
          name: 'Closed Legacy Program',
          stage: 'sunset',
          status_flag: 'closed',
          committed_total_usd: 1000000,
          measured_value_usd: 0,
          status_summary: 'closed',
          metadata: { sentinel_posture: 'closed' },
        },
      ],
    });

    const sources = await retrieveTenantStructuredFacts('northstar-clinical', 'Active initiatives by stage');
    const detail = sources.map((source) => source.detail).join('\n');

    expect(sources[0]?.confidence).toBe(0.99);
    expect(detail).toContain('NST-INIT-CODING-AI');
    expect(detail).not.toContain('NST-CLOSED-LEGACY');
  });

  it('does not fabricate structured rows for no-match queries', async () => {
    mockPostgresTables({
      applications: [
        {
          id: 'app-row-234',
          name: 'Java legacy Capability 234',
          vendor: 'SAP',
          business_function: 'BU-HIS',
          deployment_model: 'on_prem',
          criticality: 'tier1',
          status: 'active',
          annual_cost_usd: 17298000,
        },
      ],
    });

    await expect(retrieveTenantStructuredFacts('northstar-clinical', 'How should we think about AI strategy?')).resolves.toEqual([]);
  });

  it('routes Northstar regulatory exposure questions to tenant enterprise context', async () => {
    fakeAdapter = {
      ...makeEmptyAdapter(),
      listContextChunks: (_tenantKey, opts) => {
        const requested = new Set(opts?.segmentIds ?? []);
        if (!requested.has('enterprise_profile')) return Promise.resolve([]);
        return Promise.resolve([
          chunk(
            'enterprise_profile',
            'EU AI Act Annex I exposure becomes material by August 2027; FDA PCCP, FDA 524B, SBOM, MDR, IVDR, ISO 13485, and GxP obligations constrain regulated AI workflows.',
            'named-entity-facts.jsonl',
          ),
        ]);
      },
    };

    const sources = await retrieveTenantEnterpriseSources(
      'northstar-clinical',
      'Where are we exposed on EU AI Act and FDA AI/ML expectations?',
    );
    const detail = sources.map((source) => source.detail).join('\n');

    expect(detail).toContain('EU AI Act Annex I');
    expect(detail).toContain('FDA 524B');
  });

  it('routes SAP S/4 Wave 0 binary questions to active initiative context', async () => {
    mockPostgresTables({
      ai_initiatives: [
        {
          initiative_id: 'NST-INIT-S4-WAVE0',
          display_id: 'NST-S4-WAVE0',
          name: 'SAP S/4 Global Consolidation Wave 0',
          stage: 'multi_year_strategic_bet',
          status_flag: 'value_lag',
          committed_total_usd: 68000000,
          measured_value_usd: 204000000,
          status_summary: 'hold_contested',
          metadata: { sentinel_posture: 'hold_contested' },
        },
      ],
    });

    const sources = await retrieveTenantStructuredFacts(
      'northstar-clinical',
      'Just yes or no: should we accelerate SAP S/4 Wave 0 right now?',
    );
    const detail = sources.map((source) => source.detail).join('\n');

    expect(detail).toContain('NST-INIT-S4-WAVE0');
    expect(detail).toContain('SAP S/4 Global Consolidation Wave 0');
    expect(detail).toContain('committed $68.0M');
  });
});
