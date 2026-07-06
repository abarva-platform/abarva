import type { SessionRunner } from '@/lib/data-plane/read-adapters/azureSession';
import { answerHomeKnowFromV7 } from '../v7-home-ask';

function fakeSession(): SessionRunner {
  return async (fn) =>
    fn(async <R>(sql: string, params: unknown[] = []) => {
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
        const dimension = params[2];
        return [{
          source_file:
            dimension === 'v7_01_enterprise_profile'
              ? 'V7_01_enterprise_profile.csv'
              : 'V7_05_applications_systems.csv',
          count: 2,
        }] as R[];
      }
      if (sql.includes('from intelligence_v7.business_records')) {
        if (params[2] === 'v7_01_enterprise_profile') {
          return [
            {
              record_name: 'Lakeshore Holdings',
              source_file: 'V7_01_enterprise_profile.csv',
              source_row_number: 2,
              source_artifact_name: 'V7_01_enterprise_profile.csv',
              source_validation_status: 'validated',
              values_json: {
                company_name: 'Lakeshore Holdings',
                industry: 'Industrial holdco',
                revenue_usd: '7120000000',
                employee_count: '11800',
                total_direct_technology_budget_usd: '190600000',
                entity_scope: 'holding company',
                parent_entity_name: 'Needs evidence',
              },
            },
          ] as R[];
        }
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
    expect(result.answer.directAnswer).toMatch(/business context is broad enough/i);
    expect(result.answer.directAnswer).not.toMatch(/\bevidence\b|supporting material/i);
    expect(result.answer.directAnswer).not.toMatch(/field facts|graph nodes|retrieval chunks/i);
    expect(result.answer.table?.headers).toEqual(['System', 'Owner', 'Criticality', 'Lifecycle']);
    expect(JSON.stringify(result)).not.toMatch(/record_key|chunk_key|values_json|source_row_number/i);
    expect('trace' in result ? result.trace?.modelCall.provider : null).toBe('none');
  });

  it('routes company profile questions to Enterprise Profile with compact values', async () => {
    const result = await answerHomeKnowFromV7({
      tenantKey: 'lakeshore',
      tenantDisplayName: 'Lakeshore Holdings',
      question:
        'What is Lakeshore Holdings company profile: revenue, employees, portfolio companies, and IT budget?',
      includeTrace: true,
      userId: 'user-test',
      session: fakeSession(),
    });

    expect(result.answer.primaryDimension).toBe('v7_01_enterprise_profile');
    expect(result.answer.directAnswer).toMatch(/Lakeshore Holdings/i);
    expect(result.answer.directAnswer).toMatch(/\$7\.12B revenue/i);
    expect(result.answer.directAnswer).toMatch(/11,800 employees/i);
    expect(result.answer.directAnswer).toMatch(/\$190\.6M direct technology budget/i);
    expect(result.answer.directAnswer).not.toMatch(/data assets integrations|field facts|V7_/i);
  });

  it('keeps business-context availability questions on Home even when tenant name contains routing substrings', async () => {
    const result = await answerHomeKnowFromV7({
      tenantKey: 'lakeshore',
      tenantDisplayName: 'Lakeshore Holdings',
      question: 'What business context is available for Lakeshore Holdings?',
      includeTrace: true,
      userId: 'user-test',
      session: fakeSession(),
    });

    expect(result.proof.questionIntent).toBe('loaded_context');
    expect(result.answer.primaryDimension).toBe('v7_01_enterprise_profile');
    expect(result.answer.answerBoundary.handoffTarget).toBeNull();
    expect(result.answer.directAnswer).toMatch(/Lakeshore Holdings/i);
  });

  it('blocks general-knowledge trivia instead of answering or pretending it is tenant context', async () => {
    const result = await answerHomeKnowFromV7({
      tenantKey: 'lakeshore',
      tenantDisplayName: 'Lakeshore Holdings',
      question: 'What is the capital of Uganda?',
      includeTrace: true,
      userId: 'user-test',
      session: fakeSession(),
    });

    expect(result.proof.questionIntent).toBe('unsupported');
    expect(result.answer.primaryDimension).toBe('v7_01_enterprise_profile');
    expect(result.answer.directAnswer).toContain('Home is a context browser');
    expect(result.answer.directAnswer).toContain('does not answer general knowledge');
    expect(result.answer.directAnswer).not.toMatch(/Kampala/i);
  });

  it('hands generic use-case and investment judgment to Intelligence', async () => {
    const result = await answerHomeKnowFromV7({
      tenantKey: 'lakeshore',
      tenantDisplayName: 'Lakeshore Holdings',
      question: 'Which AI use cases should we fund and scale first?',
      includeTrace: true,
      userId: 'user-test',
      session: fakeSession(),
    });

    expect(result.proof.questionIntent).toBe('handoff_intelligence');
    expect(result.answer.answerBoundary.handoffTarget).toBe('intelligence');
    expect(result.answer.directAnswer).toContain('Intelligence should take over');
    expect(result.answer.directAnswer).toContain('Home should stay focused on available facts and validation boundaries');
  });

  it('keeps explicit Tower ownership routed to Tower', async () => {
    const result = await answerHomeKnowFromV7({
      tenantKey: 'skyharbor',
      tenantDisplayName: 'SkyHarbor Air',
      question: 'Should Tower evaluate the spend and value proof for these AI initiatives?',
      includeTrace: true,
      userId: 'user-test',
      session: fakeSession(),
    });

    expect(result.proof.questionIntent).toBe('handoff_tower');
    expect(result.answer.answerBoundary.handoffTarget).toBe('tower');
  });
});
