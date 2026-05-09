import {
  APEX_RETAIL_BROKER_TENANT_KEY,
  APEX_RETAIL_CLIENT_KEY,
  APEX_RETAIL_DATA_SEGMENTS,
  buildApexRetailSourceContextAssemblyInput,
  toApexRetailLiveTenantContextSnapshot,
  type ApexRetailAdapterOptions,
} from '../adapters/apex-retail-adapter';

type QueryCall = {
  table: string;
  op: string;
  args: unknown[];
};

function createSupabaseStub() {
  const calls: QueryCall[] = [];
  const dataByTable: Record<string, unknown> = {
    source_events: {
      id: 'apex-retail-contact-center-ai-2026',
      event_code: 'SRC-APX-CCA-2026',
      event_name: 'Contact Center AI Platform',
      client_key: APEX_RETAIL_CLIENT_KEY,
      event_type: 'platform_selection',
      current_stage_key: 'orals_bafo',
      lifecycle_state: 'active',
      linked_program_id: 'APX-CC-2026',
      estimated_value_usd: 1_800_000,
      trigger_description: 'Contain contact center run cost while improving experience.',
      scope_description: 'Contact center AI platform selection.',
      decision_owner: 'Chief Customer Officer',
      created_by_user_id: 'user-apex-source',
      created_at: '2026-05-01T00:00:00.000Z',
      updated_at: '2026-05-09T00:00:00.000Z',
    },
    data_inventory_records: [
      {
        segment_id: 'sourcing_artifacts',
        record_id: 'src:apex:cca:001',
        title: 'Contact Center AI sourcing artifact',
        freshness_state: 'fresh',
        ingestion_status: 'persisted',
        last_reviewed: '2026-05-01',
      },
      {
        segment_id: 'evidence_ledger',
        record_id: 'ev:apex:cca:001',
        title: 'Contact Center AI evidence ledger',
        freshness_state: 'fresh',
        ingestion_status: 'persisted',
        last_reviewed: '2026-05-01',
      },
    ],
    enterprise_context_chunks: [
      {
        chunk_id: 'chunk:apex:cca:001',
        source_segment_id: 'sourcing_artifacts',
        source_record_id: 'src:apex:cca:001',
        embedding_status: 'pending',
      },
      {
        chunk_id: 'chunk:apex:cca:002',
        source_segment_id: 'evidence_ledger',
        source_record_id: 'ev:apex:cca:001',
        embedding_status: 'embedded',
      },
    ],
  };

  return {
    calls,
    supabase: {
      from(table: string) {
        calls.push({ table, op: 'from', args: [] });
        const chain = {
          select(...args: unknown[]) {
            calls.push({ table, op: 'select', args });
            return chain;
          },
          eq(...args: unknown[]) {
            calls.push({ table, op: 'eq', args });
            return chain;
          },
          neq(...args: unknown[]) {
            calls.push({ table, op: 'neq', args });
            return chain;
          },
          in(...args: unknown[]) {
            calls.push({ table, op: 'in', args });
            return chain;
          },
          or(...args: unknown[]) {
            calls.push({ table, op: 'or', args });
            return chain;
          },
          order(...args: unknown[]) {
            calls.push({ table, op: 'order', args });
            return chain;
          },
          limit(...args: unknown[]) {
            calls.push({ table, op: 'limit', args });
            return chain;
          },
          async maybeSingle() {
            calls.push({ table, op: 'maybeSingle', args: [] });
            return { data: dataByTable[table], error: null };
          },
          then(resolve: (value: { data: unknown; error: null }) => void) {
            calls.push({ table, op: 'then', args: [] });
            return Promise.resolve(resolve({ data: dataByTable[table], error: null }));
          },
        };
        return chain;
      },
    },
  };
}

describe('Apex Retail Source adapter', () => {
  it('assembles SourceContextAssemblyInput from live Supabase query boundaries', async () => {
    const { supabase, calls } = createSupabaseStub();
    const result = await buildApexRetailSourceContextAssemblyInput({
      supabase: supabase as unknown as ApexRetailAdapterOptions['supabase'],
      user: { id: 'user-apex-source' },
      userPrompt: 'Build Source context for Apex.',
      eventId: 'apex-retail-contact-center-ai-2026',
    });

    expect(result.input.tenant.tenantKey).toBe(APEX_RETAIL_CLIENT_KEY);
    expect(result.input.tenant.tenantId).toBe(APEX_RETAIL_BROKER_TENANT_KEY);
    expect(result.input.route).toBe('/source/events/apex-retail-contact-center-ai-2026');
    expect(result.input.surface).toBe('eventCanvas');
    expect(result.input.stageKey).toBe('bafo');
    expect(result.liveContext.sourceEventFound).toBe(true);
    expect(result.liveContext.dataSegmentsRequested).toEqual(APEX_RETAIL_DATA_SEGMENTS);
    expect(result.liveContext.inventoryRecordCount).toBe(2);
    expect(result.liveContext.contextChunkCount).toBe(2);
    expect(result.liveContext.contextChunkSegmentCounts).toEqual({ sourcing_artifacts: 1, evidence_ledger: 1 });
    expect(result.liveContext.embeddedChunkSegmentCounts).toEqual({ evidence_ledger: 1 });
    expect(result.liveContext.embeddingStatusCounts).toEqual({ pending: 1, embedded: 1 });
    expect(calls.map((call) => call.table)).toEqual(
      expect.arrayContaining([
        'source_events',
        'data_inventory_records',
        'enterprise_context_chunks',
      ]),
    );
    expect(calls).toEqual(
      expect.arrayContaining([
        { table: 'source_events', op: 'eq', args: ['event_code', 'apex-retail-contact-center-ai-2026'] },
      ]),
    );
    expect(calls.some((call) => call.op === 'or')).toBe(false);
  });

  it('uses the broker tenant key for inventory substrate queries', async () => {
    const { supabase, calls } = createSupabaseStub();
    await buildApexRetailSourceContextAssemblyInput({
      supabase: supabase as unknown as ApexRetailAdapterOptions['supabase'],
      user: { id: 'user-apex-source' },
      userPrompt: 'Build Source context for Apex.',
    });

    const tenantKeyFilters = calls.filter((call) =>
      call.op === 'eq' && call.args[0] === 'tenant_key',
    );
    expect(tenantKeyFilters.map((call) => call.args[1])).toEqual([
      APEX_RETAIL_BROKER_TENANT_KEY,
      APEX_RETAIL_BROKER_TENANT_KEY,
    ]);
  });

  it('summarizes the live Apex corpus as current-state sourcing intelligence', async () => {
    const { supabase } = createSupabaseStub();
    const result = await buildApexRetailSourceContextAssemblyInput({
      supabase: supabase as unknown as ApexRetailAdapterOptions['supabase'],
      user: { id: 'user-apex-source' },
      userPrompt: 'What is the current contact center AI sourcing state?',
      eventId: 'SRC-APX-CCA-2026',
    });

    const snapshot = toApexRetailLiveTenantContextSnapshot(result.liveContext);

    expect(APEX_RETAIL_DATA_SEGMENTS).toEqual(
      expect.arrayContaining([
        'org_structure',
        'it_financials',
        'it_landscape',
        'financial_model',
        'kpi_history',
        'vendor_intelligence',
        'peer_benchmarks',
        'ai_transformation',
      ]),
    );
    expect(snapshot.sourceEventFound).toBe(true);
    expect(snapshot.currentStateAreas).toEqual(expect.arrayContaining(['Sourcing Artifacts', 'Evidence Ledger']));
    expect(snapshot.evidenceBasis).toEqual(
      expect.arrayContaining([
        'Sourcing Artifacts: 1 records, 1 chunks, 0 embedded',
        'Evidence Ledger: 1 records, 1 chunks, 1 embedded',
      ]),
    );
    expect(snapshot.warnings).toEqual([
      'Some Apex Retail context chunks are not embedded yet; semantic retrieval may be partial.',
    ]);
  });
});
