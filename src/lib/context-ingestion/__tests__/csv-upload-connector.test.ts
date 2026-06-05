import {
  inferCsvSchemaMapping,
  loadCsvUploadToTenantContext,
  parseCsvUpload,
  prepareCsvUploadForTenantContext,
} from '../csv-upload-connector';

describe('csv upload connector', () => {
  it('parses quoted CSV values without splitting embedded commas', () => {
    const parsed = parseCsvUpload([
      'app_id,name,owner_role,notes',
      'app-1,"Claims, Core",VP Architecture,"Tier 1, regulated"',
    ].join('\n'));

    expect(parsed.headers).toEqual(['app_id', 'name', 'owner_role', 'notes']);
    expect(parsed.rows).toEqual([
      {
        app_id: 'app-1',
        name: 'Claims, Core',
        owner_role: 'VP Architecture',
        notes: 'Tier 1, regulated',
      },
    ]);
  });

  it('infers schema mapping from the selected context template and headers', () => {
    const mapping = inferCsvSchemaMapping({
      fileName: 'application-portfolio.csv',
      templateId: 'application-portfolio',
      headers: ['app_id', 'name', 'criticality', 'owner_role', 'system_of_record'],
    });

    expect(mapping).toMatchObject({
      templateId: 'application-portfolio',
      dimension: 'application_portfolio',
      sourceRecordIdColumn: 'app_id',
      titleColumn: 'name',
      fieldMappings: {
        app_id: 'app_id',
        name: 'name',
        criticality: 'criticality',
        owner_role: 'owner_role',
        system_of_record: 'system_of_record',
      },
    });
  });

  it('prepares tenant-scoped pending context chunks without writing other tenants', () => {
    const prepared = prepareCsvUploadForTenantContext({
      clientId: 'client-apex',
      tenantKey: 'apex-retail',
      uploadedBy: 'user-1',
      fileName: 'application-portfolio.csv',
      uploadedAt: '2026-05-30T12:00:00.000Z',
      csvText: [
        'app_id,name,criticality,owner_role,system_of_record',
        'app-1,Claims Core,Tier 1,VP Architecture,true',
        'app-2,Finance Data Mart,Tier 2,Director Finance,true',
      ].join('\n'),
      mapping: { templateId: 'application-portfolio' },
    });

    expect(prepared.chunks).toHaveLength(2);
    expect(prepared.chunks.every((chunk) => chunk.client_id === 'client-apex')).toBe(true);
    expect(prepared.chunks.every((chunk) => chunk.tenant_key === 'apex-retail')).toBe(true);
    expect(prepared.chunks.every((chunk) => chunk.embedding_status === 'pending')).toBe(true);
    expect(prepared.chunks[0]).toMatchObject({
      source_segment_id: 'it_landscape',
      source_record_id: 'app-1',
      source_doc: 'application-portfolio.csv',
    });
    expect(prepared.embeddingHandoff.command).toBe('npm run embed:pending-chunks -- --tenant apex-retail');
  });

  it('batch inserts prepared chunks without delete or cross-tenant writes', async () => {
    const calls: Array<{ table: string; operation: string; payload: unknown }> = [];
    const db = {
      from(table: string) {
        return {
          insert(payload: unknown) {
            calls.push({ table, operation: 'insert', payload });
            return {
              select() {
                const rows = Array.isArray(payload) ? payload : [payload];
                return Promise.resolve({
                  data: rows.map((_, index) => ({ id: `row-${index}`, chunk_id: `chunk-${index}` })),
                  error: null,
                  count: rows.length,
                });
              },
            };
          },
        };
      },
    };

    const result = await loadCsvUploadToTenantContext({
      clientId: 'client-first-capital',
      tenantKey: 'first-capital',
      uploadedBy: 'user-2',
      fileName: 'vendor-contracts.csv',
      uploadedAt: '2026-05-30T12:00:00.000Z',
      csvText: [
        'vendor_id,vendor_name,annual_value_usd,renewal_date',
        'ven-1,Finzly,1200000,2026-10-01',
      ].join('\n'),
      mapping: { templateId: 'vendor-contracts' },
      db: db as never,
    });

    expect(result.persistence.status).toBe('inserted');
    expect(result.chunksQueued).toBe(1);
    expect(calls.map((call) => call.operation)).toEqual(['insert', 'insert']);
    expect(calls.some((call) => call.operation === 'delete')).toBe(false);
    const chunkInsert = calls.find((call) => call.table === 'enterprise_context_chunks');
    expect(chunkInsert?.payload).toEqual([
      expect.objectContaining({
        client_id: 'client-first-capital',
        tenant_key: 'first-capital',
        source_record_id: 'ven-1',
        embedding_status: 'pending',
      }),
    ]);
  });

  it('blocks PHS phase 0 uploads with missing required evidence fields before persistence', async () => {
    const calls: Array<{ table: string; operation: string; payload: unknown }> = [];
    const db = {
      from(table: string) {
        return {
          insert(payload: unknown) {
            calls.push({ table, operation: 'insert', payload });
            return {
              select() {
                return Promise.resolve({ data: [], error: null, count: 0 });
              },
            };
          },
        };
      },
    };

    await expect(
      loadCsvUploadToTenantContext({
        clientId: 'client-meridian',
        tenantKey: 'meridian-health',
        uploadedBy: 'user-3',
        fileName: 'phs-evidence-register.csv',
        csvText: [
          'title,source_type,owner,evidence_date,sensitivity,confidence,summary,usable_by_surface',
          'Stars baseline,public,Data steward,2026-06-05,public,high,Public Stars measure baseline,"moves,admin"',
        ].join('\n'),
        mapping: { templateId: 'phs-evidence-register' },
        db: db as never,
      }),
    ).rejects.toThrow('csv_missing_required_fields:citation_key');

    expect(calls).toHaveLength(0);
  });

  it('appends PHS evidence-register rows to the evidence ledger after context chunks insert', async () => {
    const calls: Array<{ table: string; operation: string; payload: unknown }> = [];
    const evidenceInputs: unknown[] = [];
    const db = {
      from(table: string) {
        return {
          insert(payload: unknown) {
            calls.push({ table, operation: 'insert', payload });
            return {
              select() {
                const rows = Array.isArray(payload) ? payload : [payload];
                return Promise.resolve({
                  data: rows.map((_, index) => ({ id: `row-${index}`, chunk_id: `chunk-${index}` })),
                  error: null,
                  count: rows.length,
                });
              },
            };
          },
        };
      },
    };

    const result = await loadCsvUploadToTenantContext({
      clientId: 'client-meridian',
      tenantKey: 'meridian-health',
      uploadedBy: 'user-3',
      fileName: 'phs-evidence-register.csv',
      uploadedAt: '2026-06-05T12:00:00.000Z',
      csvText: [
        'citation_key,title,source_type,owner,evidence_date,sensitivity,confidence,summary,usable_by_surface,source_url,source_quote',
        'PHS-STARS-2026,Stars baseline,public,Data steward,2026-06-05,public,high,Public Stars measure baseline,"moves,admin",https://example.test/stars,"3.0 Stars baseline"',
      ].join('\n'),
      mapping: { templateId: 'phs-evidence-register' },
      db: db as never,
      recordEvidenceFn: async (input) => {
        evidenceInputs.push(input);
        return 'ledger-1';
      },
    });

    expect(result.persistence.status).toBe('inserted');
    expect(result.evidenceLedger).toEqual({
      status: 'inserted',
      rowsRecorded: 1,
      evidenceIds: ['ledger-1'],
      detail: 'PHS evidence register rows were appended to the evidence ledger.',
    });
    expect(calls.map((call) => call.table)).toEqual([
      'data_ingestion_runs',
      'enterprise_context_chunks',
    ]);
    expect(evidenceInputs).toEqual([
      expect.objectContaining({
        clientId: 'client-meridian',
        artifactRef: 'PHS-STARS-2026',
        sourceType: 'document_extract',
        sourceQuote: '3.0 Stars baseline',
      }),
    ]);
  });
});
