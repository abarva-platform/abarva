import {
  APEX_RETAIL_BROKER_TENANT_KEY,
  APEX_RETAIL_CLIENT_KEY,
  APEX_RETAIL_DATA_SEGMENTS,
  buildApexRetailSourceContextAssemblyInput,
  toApexRetailLiveTenantContextSnapshot,
  type ApexRetailAdapterOptions,
} from '../adapters/apex-retail-adapter';

type QueryCall = {
  sql: string;
  params: readonly unknown[];
};

function createReadClientStub() {
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
    readClient: {
      async query(sql: string, params: readonly unknown[]) {
        calls.push({ sql, params });
        if (/from\s+source_events/i.test(sql)) {
          return [dataByTable.source_events];
        }
        if (/from\s+data_inventory_records/i.test(sql)) {
          return dataByTable.data_inventory_records;
        }
        if (/from\s+enterprise_context_chunks/i.test(sql)) {
          return dataByTable.enterprise_context_chunks;
        }
        return [];
      },
    },
  };
}

describe('Apex Retail Source adapter', () => {
  it('assembles SourceContextAssemblyInput from live Azure read query boundaries', async () => {
    const { readClient, calls } = createReadClientStub();
    const result = await buildApexRetailSourceContextAssemblyInput({
      readClient: readClient as unknown as ApexRetailAdapterOptions['readClient'],
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
    expect(calls.map((call) => tableNameFromSql(call.sql))).toEqual(
      expect.arrayContaining([
        'source_events',
        'data_inventory_records',
        'enterprise_context_chunks',
      ]),
    );
    const eventQuery = calls.find((call) => /from\s+source_events/i.test(call.sql));
    expect(eventQuery?.sql).toContain('event_code = $2');
    expect(eventQuery?.params).toEqual([
      APEX_RETAIL_CLIENT_KEY,
      'apex-retail-contact-center-ai-2026',
    ]);
    expect(calls.every((call) => !/\bor\s+/i.test(call.sql))).toBe(true);
  });

  it('uses the broker tenant key for inventory substrate queries', async () => {
    const { readClient, calls } = createReadClientStub();
    await buildApexRetailSourceContextAssemblyInput({
      readClient: readClient as unknown as ApexRetailAdapterOptions['readClient'],
      user: { id: 'user-apex-source' },
      userPrompt: 'Build Source context for Apex.',
    });

    const tenantKeyParams = calls
      .filter((call) =>
        /from\s+(data_inventory_records|enterprise_context_chunks)/i.test(call.sql),
      )
      .map((call) => call.params[0]);
    expect(tenantKeyParams).toEqual([
      APEX_RETAIL_BROKER_TENANT_KEY,
      APEX_RETAIL_BROKER_TENANT_KEY,
    ]);
  });

  it('summarizes the live Apex corpus as current-state sourcing intelligence', async () => {
    const { readClient } = createReadClientStub();
    const result = await buildApexRetailSourceContextAssemblyInput({
      readClient: readClient as unknown as ApexRetailAdapterOptions['readClient'],
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

function tableNameFromSql(sql: string): string | null {
  return sql.match(/from\s+([a-z_]+)/i)?.[1] ?? null;
}
