import type { SessionRunner } from '@/lib/data-plane/read-adapters/azureSession';
import { answerHomeKnowFromV7 } from '../v7-home-ask';

function fakeSession(): SessionRunner {
  return async (fn) =>
    fn(async <R>(sql: string) => {
      if (sql.includes('from intelligence_v7.tenant_pack_runs')) {
        return [{
          tenant_key: 'skyharbor-air',
          tenant_name: 'SkyHarbor Air Group',
          contract_version: 'v7.0.0-synthetic-depth-v2-20260703',
          source_dataset: '/Users/anand/Downloads/abarva-v7-synthetic-client-data-v2-20260703',
          row_count: 5473,
          field_count: 160560,
          graph_node_count: 3492,
          relationship_edge_count: 1500,
          chunk_count: 1000,
          loaded_at: '2026-07-03T17:53:00.675Z',
        }] as R[];
      }
      if (sql.includes('group by source_file')) {
        return [{ source_file: 'V7_05_applications_systems.csv', count: 2 }] as R[];
      }
      if (sql.includes('from intelligence_v7.business_records')) {
        return [
          {
            record_name: 'SkyOps Recovery Platform',
            source_file: 'V7_05_applications_systems.csv',
            source_row_number: 2,
            source_artifact_name: 'V7_05_applications_systems.csv',
            source_validation_status: 'validated',
            values_json: {
              system_name: 'SkyOps Recovery Platform',
              system_owner: 'Operations Technology',
              criticality: 'critical',
              lifecycle_status: 'modernize',
            },
          },
          {
            record_name: 'Reservation Core',
            source_file: 'V7_05_applications_systems.csv',
            source_row_number: 3,
            source_artifact_name: 'V7_05_applications_systems.csv',
            source_validation_status: 'validated',
            values_json: {
              system_name: 'Reservation Core',
              system_owner: 'Core Platforms',
              criticality: 'critical',
              lifecycle_status: 'stabilize and expose',
            },
          },
        ] as R[];
      }
      return [] as R[];
    });
}

describe('answerHomeKnowFromV7', () => {
  it('answers deterministically from V7 records without raw substrate IDs', async () => {
    const result = await answerHomeKnowFromV7({
      tenantKey: 'skyharbor',
      tenantDisplayName: 'SkyHarbor Air',
      question: 'What application and core systems context is loaded?',
      includeTrace: true,
      userId: 'user-test',
      session: fakeSession(),
    });

    expect(result.ok).toBe(true);
    expect(result.answer.answerSource).toBe('v7_dataset_contract');
    expect(result.proof.source).toBe('v7_azure_schema');
    expect(result.proof.answerSource.claudeInvoked).toBe(false);
    expect(result.answer.primaryDimension).toBe('v7_05_applications_systems');
    expect(result.answer.directAnswer).toMatch(/SkyOps Recovery Platform/i);
    expect(result.answer.directAnswer).toMatch(/5,473 business records/i);
    expect(result.answer.table?.headers).toEqual(['System', 'Owner', 'Criticality', 'Lifecycle']);
    expect(JSON.stringify(result)).not.toMatch(/record_key|chunk_key|values_json|source_row_number/i);
    expect('trace' in result ? result.trace?.modelCall.provider : null).toBe('none');
  });
});
