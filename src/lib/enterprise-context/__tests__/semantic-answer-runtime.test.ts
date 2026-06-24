import {
  answerEnterpriseSemanticQuestionFromAzure,
  inferSemanticRuntimeIntent,
  semanticRuntimeTenantKeys,
  type SemanticRuntimeDeps,
} from '../semantic-answer-runtime';

describe('semantic answer runtime', () => {
  it('routes plain-English dataset questions to inventory intent', () => {
    expect(inferSemanticRuntimeIntent('What data do we have loaded for this tenant?')).toBe('inventory');
    expect(inferSemanticRuntimeIntent('Which apps create the most operational friction?')).toBe('application_friction');
    expect(inferSemanticRuntimeIntent('Where are the bottlenecks?')).toBe('bottlenecks');
    expect(inferSemanticRuntimeIntent('What value can we expect?')).toBe('value');
  });

  it('queries known tenant aliases with the canonical semantic key', async () => {
    expect(semanticRuntimeTenantKeys('skyharbor-air')).toEqual(['skyharbor-air', 'skyharbor', 'skyharbor-airlines']);
    expect(semanticRuntimeTenantKeys('skyharbor')).toEqual(['skyharbor-air', 'skyharbor', 'skyharbor-airlines']);
    expect(semanticRuntimeTenantKeys('lakeshore')).toEqual(['lakeshore', 'lakeshore-holdings', 'lakeshore-industries']);

    const paramsSeen: unknown[] = [];
    const query: NonNullable<SemanticRuntimeDeps['read']>['query'] = async <R,>(_sql: string, params?: unknown[]): Promise<R[]> => {
      paramsSeen.push(params?.[0]);
      return [] as R[];
    };

    await answerEnterpriseSemanticQuestionFromAzure(
      {
        tenantKey: 'skyharbor',
        question: 'What data do we have loaded?',
        module: 'home',
      },
      {
        read: { query },
        now: () => new Date('2026-06-24T12:00:00.000Z'),
      },
    );

    expect(paramsSeen).toEqual([
      ['skyharbor-air', 'skyharbor', 'skyharbor-airlines'],
      ['skyharbor-air', 'skyharbor', 'skyharbor-airlines'],
      ['skyharbor-air', 'skyharbor', 'skyharbor-airlines'],
    ]);
  });

  it('answers from tenant semantic volumetrics with citations and caveats', async () => {
    const query: NonNullable<SemanticRuntimeDeps['read']>['query'] = async <R,>(sql: string): Promise<R[]> => {
        if (sql.includes('tenant_data_volumetrics')) {
          return [
            {
              tenant_key: 'morganstreet',
              source_type: 'operational_work_items',
              dimension_key: 'operational_work_item',
              family_key: 'operational_evidence',
              evidence_type: 'work_item',
              record_count: 6200,
              entity_count: 6200,
              distinct_application_count: 150,
              distinct_process_count: 60,
              distinct_vendor_count: 0,
              distinct_owner_count: 8,
              freshness_status: 'synthetic',
              coverage_status: 'strong',
              confidence_score: 0.78,
              synthetic_demo_flag: true,
              finance_validated_flag: false,
              notes: 'test row',
            },
            {
              tenant_key: 'morganstreet',
              source_type: 'operational_value_estimates',
              dimension_key: 'value_estimate',
              family_key: 'operational_evidence',
              evidence_type: 'value_estimate',
              record_count: 60,
              entity_count: 60,
              distinct_application_count: 0,
              distinct_process_count: 0,
              distinct_vendor_count: 0,
              distinct_owner_count: 0,
              freshness_status: 'synthetic',
              coverage_status: 'partial',
              confidence_score: 0.78,
              synthetic_demo_flag: true,
              finance_validated_flag: false,
              notes: 'test row',
            },
          ] as R[];
        }
        if (sql.includes('tenant_dimension_coverage')) {
          return [
            {
              tenant_key: 'morganstreet',
              dimension_key: 'operational_work_item',
              available: true,
              queryable_structured: true,
              searchable_unstructured: false,
              metric_ready: true,
              citation_ready: true,
              record_count: 6200,
              freshness_status: 'synthetic',
              confidence_score: 0.78,
              caveats: ['Contains synthetic demo evidence.'],
              recommended_client_action: 'Replace synthetic evidence before production decisions.',
            },
          ] as R[];
        }
        if (sql.includes('tenant_question_readiness')) {
          return [
            {
              tenant_key: 'morganstreet',
              question_pattern: 'What work is repetitive?',
              intent_type: 'process_intelligence',
              readiness_status: 'answerable',
              confidence_score: 0.76,
              missing_data: [],
              caveat_text: '',
              suggested_next_action: 'Use deterministic query first, then narrative synthesis with citations.',
            },
          ] as R[];
        }
        return [];
    };
    const read: SemanticRuntimeDeps['read'] = { query };

    const answer = await answerEnterpriseSemanticQuestionFromAzure(
      {
        tenantKey: 'morganstreet',
        question: 'What work is repetitive?',
        module: 'ava',
      },
      {
        read,
        now: () => new Date('2026-06-24T12:00:00.000Z'),
      },
    );

    expect(answer.intent).toBe('process_intelligence');
    expect(answer.directAnswer).toContain('6,260 records');
    expect(answer.facts).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Semantic record count', value: 6260 }),
    ]));
    expect(answer.citations[0]).toEqual(expect.objectContaining({
      sourceTable: 'operational_work_items',
      recordCount: 6200,
      syntheticDemo: true,
    }));
    expect(answer.caveats.join(' ')).toMatch(/Synthetic demo evidence/);
    expect(answer.readinessStatus).toBe('answerable');
    expect(answer.generatedAt).toBe('2026-06-24T12:00:00.000Z');
  });
});
