import type { SessionRunner } from '@/lib/data-plane/read-adapters/azureSession';
import { retrieveV7DossierSources } from './v7-dossier';

function fakeSession(seenRunQueries: string[] = []): SessionRunner {
  return async (fn) =>
    fn(async <R>(sql: string, params: unknown[] = []) => {
      if (sql.includes('from intelligence_v7.current_tenant_pack_runs') || sql.includes('from intelligence_v7.tenant_pack_runs')) {
        seenRunQueries.push(sql);
        return [{
          tenant_key: 'lakeshore-industries',
          tenant_name: 'Lakeshore Holdings',
          contract_version: 'v7.0.0-synthetic-depth-v2-20260703',
          row_count: 2783,
          field_count: 82072,
          graph_node_count: 1539,
          relationship_edge_count: 700,
          chunk_count: 500,
          loaded_at: '2026-07-03T17:59:55.619Z',
        }] as R[];
      }

      if (sql.includes('from intelligence_v7.business_records')) {
        const dimensions = Array.isArray(params[2]) ? new Set(params[2] as string[]) : null;
        const rows = [
          {
            record_name: 'Shared HR exception triage 03',
            dimension_key: 'v7_10_ai_initiatives',
            source_file: 'V7_10_ai_initiatives.csv',
            source_artifact_name: 'V7_10_ai_initiatives.csv',
            source_validation_status: 'synthetic_demo',
            values_json: {
              ai_use_case: 'Shared HR exception triage 03',
              business_function_ref: 'Shared HR',
              production_status: 'limited production',
              data_readiness: 'weak',
              model_risk_tier: 'medium',
              measured_value_usd: '550000',
              scale_hold_stop_recommendation: 'stop',
              decision_needed: 'Validate source quality, control boundary, and business value before scaling.',
            },
          },
          {
            record_name: 'Legal and Compliance',
            dimension_key: 'v7_02_business_functions',
            source_file: 'V7_02_business_functions.csv',
            source_artifact_name: 'V7_02_business_functions.csv',
            source_validation_status: 'synthetic_demo',
            values_json: {
              function_name: 'Legal and Compliance',
              executive_owner: 'CEO',
              known_business_pain_points: 'Manual handoffs, fragmented reporting, and source ownership gaps requiring client validation.',
              ai_opportunity_areas: 'Legal and Compliance summarization, exception triage, forecasting, and guided workflow assistance',
            },
          },
          {
            record_name: 'Industrial holdco AI readiness 04',
            dimension_key: 'v7_15_industry_market_knowledge_patterns',
            source_file: 'V7_15_industry_market_knowledge_patterns.csv',
            source_artifact_name: 'V7_15_industry_market_knowledge_patterns.csv',
            source_validation_status: 'synthetic_demo',
            values_json: {
              pattern_name: 'Industrial holdco AI readiness 04',
              industry_domain: 'Industrial holdco',
              signals: 'aging systems; manual workflows; source quality gaps; owner gaps; control pressure',
              recommended_actions: 'Use as question guide and fit-check against tenant facts before narrative.',
            },
          },
          {
            record_name: 'Epic Clarity',
            dimension_key: 'v7_05_applications_systems',
            source_file: 'V7_05_applications_systems.csv',
            source_artifact_name: 'V7_05_applications_systems.csv',
            source_validation_status: 'synthetic_demo',
            values_json: {
              system_name: 'Epic Clarity',
              vendor_product: 'Epic',
              decision_relevance: 'SQL Server extracts; Caboodle; Tableau',
              lifecycle_status: 'current core',
              known_gaps: 'No certified medallion architecture is loaded.',
            },
          },
          {
            record_name: 'Reporting marts and BI layer',
            dimension_key: 'v7_06_data_assets_integrations',
            source_file: 'V7_06_data_assets_integrations.csv',
            source_artifact_name: 'V7_06_data_assets_integrations.csv',
            source_validation_status: 'synthetic_demo',
            values_json: {
              data_asset_name: 'Reporting marts and BI layer',
              system_of_record: 'Epic Clarity; Epic Caboodle; claims marts',
              consumer_refs: 'Tableau; SAS; Power BI',
              upstream_systems: 'Epic Clarity; Epic Caboodle; claims marts',
              downstream_consumers: 'Tableau; SAS; Power BI',
              governance_status: 'fragmented',
            },
          },
        ];
        return rows.filter((row) => !dimensions || dimensions.has(row.dimension_key)) as R[];
      }

      return [] as R[];
    });
}

describe('retrieveV7DossierSources', () => {
  it('builds a Lakeshore v7 executive dossier for Intelligence synthesis', async () => {
    const seenRunQueries: string[] = [];
    const result = await retrieveV7DossierSources(
      'How should the CIO prioritize AI across HR, finance, treasury, legal, and shared services?',
      {
        tenantInventoryKey: 'lakeshore',
        session: fakeSession(seenRunQueries),
      },
    );

    expect(seenRunQueries.join('\n')).toContain('from intelligence_v7.current_tenant_pack_runs');
    expect(seenRunQueries.join('\n')).not.toContain('contract_version = $2');
    expect(result.sources[0]).toEqual(expect.objectContaining({
      type: 'TENANT',
      name: 'Lakeshore Holdings V7 executive dossier',
      detail: expect.stringContaining('2,783 business records'),
    }));
    expect(result.sources.map((source) => source.id)).toContain('v7_10_ai_initiatives');
    expect(result.sources.map((source) => source.id)).toContain('v7_02_business_functions');
    expect(result.sources.map((source) => source.id)).toContain('v7_15_industry_market_knowledge_patterns');
    expect(result.sources.map((source) => source.detail).join('\n')).toMatch(/Shared HR exception triage/i);
    expect(result.sources.map((source) => source.detail).join('\n')).toMatch(/synthetic demo until client validated/i);
  });

  it('selects system and data-estate evidence for analytics and reporting estate questions', async () => {
    const result = await retrieveV7DossierSources(
      'What does Meridian know about its current analytics and reporting estate?',
      {
        tenantInventoryKey: 'meridian',
        session: fakeSession(),
      },
    );

    expect(result.sources.map((source) => source.id)).toContain('v7_05_applications_systems');
    expect(result.sources.map((source) => source.id)).toContain('v7_06_data_assets_integrations');
    const details = result.sources.map((source) => source.detail).join('\n');
    expect(details).toMatch(/Epic Clarity/i);
    expect(details).toMatch(/SQL Server/i);
    expect(details).toMatch(/Tableau/i);
    expect(details).toMatch(/SAS/i);
    expect(details).toMatch(/Power BI/i);
  });

  it('fails closed when the v7 schema is unavailable', async () => {
    const session: SessionRunner = async () => {
      throw new Error('relation intelligence_v7.tenant_pack_runs does not exist');
    };

    await expect(retrieveV7DossierSources('What is loaded?', {
      tenantInventoryKey: 'lakeshore',
      session,
    })).resolves.toEqual({ sources: [], averageConfidence: 0 });
  });
});
