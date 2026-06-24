import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  SEMANTIC_DIMENSION_CATALOG,
  SEMANTIC_GOLDEN_QUESTIONS,
  SEMANTIC_METRIC_REGISTRY,
  answerEnterpriseSemanticQuestion,
  answerSemanticQuestion,
  auditSemanticLayerReadiness,
  getEnterpriseSemanticQuestionLayerContract,
  getSemanticExtensionRegistry,
  planSemanticQuestion,
  routeSemanticQuestion,
  verifySemanticAnswer,
  type SemanticRecord,
} from '../semantic-question-layer';

describe('19-dimension semantic question layer', () => {
  it('publishes the Enterprise Semantic Question Layer as a platform-level service contract', () => {
    const contract = getEnterpriseSemanticQuestionLayerContract();

    expect(contract.serviceName).toBe('Enterprise Semantic Question Layer');
    expect(contract.consumers).toEqual(
      expect.arrayContaining(['home', 'moves', 'source', 'tower', 'ava', 'intelligence', 'context_layer_admin']),
    );
    expect(contract.moduleUseCases).toMatchObject({
      home: 'what do we know?',
      moves: 'what should we do?',
      source: 'which vendor and why?',
      tower: 'are we delivering value?',
      ava: 'explain it like an advisor.',
    });
    expect(contract.responsibilities.join(' ')).toContain('structured data');
    expect(contract.unsupportedBehavior.join(' ')).toContain('Do not hallucinate');
    expect(contract.requiredAnswerSections).toEqual(
      expect.arrayContaining(['directAnswer', 'basis', 'evidence', 'confidence', 'caveats', 'recommendedNextAction', 'askNext']),
    );
  });

  it('defines semantic contracts for all 19 universal dimensions including the relationship graph', () => {
    const readiness = auditSemanticLayerReadiness();

    expect(readiness).toMatchObject({
      dimensionCount: 19,
      extensionCount: 6,
      goldenQuestionCount: 95,
      missingMetrics: [],
    });
    expect(readiness.extensionDimensionCount).toBeGreaterThanOrEqual(25);
    expect(readiness.metricCount).toBeGreaterThanOrEqual(15);

    for (const dimension of SEMANTIC_DIMENSION_CATALOG) {
      expect(dimension.businessName).toMatch(/[A-Za-z]/);
      expect(dimension.description.length).toBeGreaterThan(40);
      expect(dimension.businessQuestionsSupported).toHaveLength(5);
      expect(dimension.synonyms.length).toBeGreaterThanOrEqual(5);
      expect(dimension.canonicalEntities.length).toBeGreaterThan(0);
      expect(dimension.sourceTablesOrViews).toEqual(expect.arrayContaining(['enterprise_context_records', 'enterprise_context_facts']));
      expect(dimension.searchableIndices.length).toBeGreaterThan(0);
      expect(dimension.primaryGrain).toMatch(/[A-Za-z]/);
      expect(dimension.keyFields.length).toBeGreaterThan(0);
      expect(dimension.allowedFilters.length).toBeGreaterThan(0);
      expect(dimension.canonicalMetrics.length).toBeGreaterThan(0);
      expect(dimension.freshnessFields.length).toBeGreaterThan(0);
      expect(dimension.ownerFields.length).toBeGreaterThan(0);
      expect(dimension.dataQualityFields.length).toBeGreaterThan(0);
      expect(dimension.confidenceRules.length).toBeGreaterThan(0);
      expect(dimension.caveats.length).toBeGreaterThan(0);
      expect(dimension.citationRules[0]).toMatchObject({ required: true });
      expect(dimension.unsupportedQuestionBehavior).toContain('do not fabricate');
    }
  });

  it('registers reusable metrics with formulas, fields, confidence, caveats, and citation requirements', () => {
    expect(SEMANTIC_METRIC_REGISTRY.map((metric) => metric.metricId)).toEqual(
      expect.arrayContaining([
        'incident_count',
        'sla_breach_rate',
        'reopen_rate',
        'reassignment_rate',
        'cycle_time',
        'app_friction_score',
        'automation_value_score',
        'opportunity_feasibility_score',
        'normalized_tco',
        'vendor_score',
        'roadmap_readiness',
        'data_quality_score',
        'governance_gap_count',
      ]),
    );

    for (const metric of SEMANTIC_METRIC_REGISTRY) {
      expect(metric.formula).toMatch(/[A-Za-z0-9]/);
      expect(metric.requiredFields.length).toBeGreaterThan(0);
      expect(metric.allowedDimensions.length).toBeGreaterThan(0);
      expect(metric.confidenceRules.length).toBeGreaterThan(0);
      expect(metric.citationRequirements.length).toBeGreaterThan(0);
    }
  });

  it('keeps the persisted semantic metric seed aligned with the TypeScript registry', () => {
    const migrationSql = readFileSync(
      path.join(process.cwd(), 'supabase/migrations/20260624163000_semantic_metric_registry_expansion.sql'),
      'utf8',
    );

    for (const metric of SEMANTIC_METRIC_REGISTRY) {
      expect(migrationSql).toContain(`'${metric.metricId}'`);
    }
  });

  it('treats planned datasets as semantic extensions anchored to the universal model', () => {
    const extensions = getSemanticExtensionRegistry();

    expect(extensions.map((extension) => extension.extensionId)).toEqual(
      expect.arrayContaining([
        'operational_evidence_process_intelligence',
        'moves_evidence_readiness',
        'source_proposal_intelligence',
        'rate_card_provenance',
        'ai_control_tower',
        'healthcare_clinical_claims',
      ]),
    );

    for (const extension of extensions) {
      expect(extension.datasetFamilies.length).toBeGreaterThan(0);
      expect(extension.extensionDimensions.length).toBeGreaterThan(0);
      expect(extension.anchorsToUniversalDimensions.length).toBeGreaterThan(0);
      expect(extension.canonicalMetrics.length).toBeGreaterThan(0);
      expect(extension.requiredEvidenceTypes.length).toBeGreaterThan(0);
      expect(extension.unsupportedQuestionBehavior).toMatch(/[A-Za-z]/);
    }
  });

  it('routes natural language to dimensions, intents, metrics, and joins', () => {
    const route = routeSemanticQuestion('Which apps are causing the most friction and what should we automate first?');

    expect(route.intent).toBe('ranking');
    expect(route.semanticExtensions).toEqual(expect.arrayContaining(['operational_evidence_process_intelligence']));
    expect(route.dimensions).toEqual(expect.arrayContaining(['applications_systems', 'operations_service_management']));
    expect(route.metrics).toEqual(expect.arrayContaining(['app_friction_score', 'incident_count']));
    expect(route.requiredJoins.map((join) => join.targetDimension)).toEqual(
      expect.arrayContaining(['operations_service_management']),
    );
    expect(route.suggestedQueryPlan).toContain('Use structured metrics');
  });

  it('uses module context so every AbarVa module consumes the shared semantic service with the right bias', () => {
    const moves = answerEnterpriseSemanticQuestion({
      requestedByModule: 'moves',
      question: 'What should we do next?',
    });
    const source = answerEnterpriseSemanticQuestion({
      requestedByModule: 'source',
      question: 'Which vendor and why?',
    });
    const tower = answerEnterpriseSemanticQuestion({
      requestedByModule: 'tower',
      question: 'Are we delivering value?',
    });
    const ava = answerEnterpriseSemanticQuestion({
      requestedByModule: 'ava',
      question: 'Explain the biggest operational bottleneck like an advisor.',
    });

    expect(moves.serviceName).toBe('Enterprise Semantic Question Layer');
    expect(moves.moduleUseCase).toBe('what should we do?');
    expect(moves.plan.route.semanticExtensions).toEqual(expect.arrayContaining(['moves_evidence_readiness']));
    expect(moves.answer.serviceName).toBe('Enterprise Semantic Question Layer');
    expect(moves.answer.basis).toContain('Basis:');

    expect(source.moduleUseCase).toBe('which vendor and why?');
    expect(source.plan.route.semanticExtensions).toEqual(expect.arrayContaining(['source_proposal_intelligence']));
    expect(source.plan.route.dimensions).toEqual(expect.arrayContaining(['vendors_contracts_licenses']));

    expect(tower.moduleUseCase).toBe('are we delivering value?');
    expect(tower.plan.route.semanticExtensions).toEqual(expect.arrayContaining(['ai_control_tower']));

    expect(ava.moduleUseCase).toBe('explain it like an advisor.');
    expect(ava.plan.route.semanticExtensions).toEqual(expect.arrayContaining(['operational_evidence_process_intelligence']));
  });

  it('plans structured metric answers before narrative synthesis', () => {
    const records: SemanticRecord[] = [
      {
        id: 'INC-1',
        dimensionId: 'operations_service_management',
        sourceType: 'synthetic_demo',
        sourceName: 'servicenow_extract',
        synthetic: true,
        fields: {
          record_type: 'incident',
          system_id: 'advisor-desktop',
          app_name: 'Advisor Desktop',
          sla_breached: true,
          reopened_count: 1,
          reassignment_count: 5,
        },
        citation: 'servicenow_extract.csv#row-1',
      },
      {
        id: 'INC-2',
        dimensionId: 'operations_service_management',
        sourceType: 'synthetic_demo',
        sourceName: 'servicenow_extract',
        synthetic: true,
        fields: {
          record_type: 'incident',
          system_id: 'advisor-desktop',
          app_name: 'Advisor Desktop',
          sla_breached: true,
          reopened_count: 0,
          reassignment_count: 3,
        },
        citation: 'servicenow_extract.csv#row-2',
      },
      {
        id: 'APP-1',
        dimensionId: 'applications_systems',
        sourceType: 'synthetic_demo',
        sourceName: 'cmdb_inventory',
        synthetic: true,
        fields: {
          app_id: 'advisor-desktop',
          name: 'Advisor Desktop',
          criticality: 'high',
          incident_count: 428,
          sla_breach_count: 42,
          reopen_count: 31,
          linked_event_count: 88,
        },
        citation: 'cmdb_inventory.csv#row-7',
      },
    ];

    const plan = planSemanticQuestion('Which apps are causing the most friction?', records);

    expect(plan.executionMode).toBe('structured_metric');
    expect(plan.computedFacts.map((fact) => fact.metricId)).toEqual(expect.arrayContaining(['app_friction_score']));
    expect(plan.evidence.map((evidence) => evidence.citationReference)).toEqual(
      expect.arrayContaining(['servicenow_extract.csv#row-1', 'cmdb_inventory.csv#row-7']),
    );
    expect(plan.caveats.join(' ')).toContain('Synthetic demo evidence');
  });

  it('composes a human answer with evidence, caveats, confidence, next action, and ask-next prompts', () => {
    const answer = answerSemanticQuestion('Which apps are causing the most friction?', [
      {
        id: 'APP-1',
        dimensionId: 'applications_systems',
        sourceType: 'structured_row',
        sourceName: 'enterprise_context_applications',
        fields: {
          app_id: 'advisor-desktop',
          name: 'Advisor Desktop',
          incident_count: 12,
          sla_breach_count: 2,
          reopen_count: 1,
          linked_event_count: 4,
          it_owner_team: 'Advisor Platform',
        },
        confidence: 0.9,
        citation: 'enterprise_context_applications#APP-1',
      },
    ]);

    expect(answer.directAnswer).toContain('Top application friction score');
    expect(answer.serviceName).toBe('Enterprise Semantic Question Layer');
    expect(answer.basis).toContain('Application friction score');
    expect(answer.evidence).toHaveLength(1);
    expect(answer.caveats.length).toBeGreaterThan(0);
    expect(answer.askNext).toEqual(expect.arrayContaining(['Add this to a Move']));
    expect(answer.verification.passed).toBe(true);
  });

  it('verifies unsupported numbers and low-confidence limitations', () => {
    const plan = planSemanticQuestion('Which apps are causing the most friction?');
    const verification = verifySemanticAnswer('The top app has 428 incidents.', plan);

    expect(verification.passed).toBe(false);
    expect(verification.issues).toEqual(expect.arrayContaining(['Unsupported number in answer: 428']));
  });

  it('publishes 95 golden questions with intent, dimension, metrics, citations, and caveat behavior', () => {
    expect(SEMANTIC_GOLDEN_QUESTIONS).toHaveLength(95);
    const byDimension = new Map<string, number>();
    for (const question of SEMANTIC_GOLDEN_QUESTIONS) {
      expect(question.expectedDimensions).toHaveLength(1);
      expect(question.expectedMetrics.length).toBeGreaterThan(0);
      expect(question.expectedAnswerShape).toEqual(
        expect.arrayContaining(['direct answer', 'evidence citations', 'confidence', 'caveats', 'ask next']),
      );
      expect(question.requiredCitationBehavior).toContain('record_id');
      expect(question.unsupportedCaveatBehavior).toContain('do not fabricate');
      byDimension.set(question.expectedDimensions[0], (byDimension.get(question.expectedDimensions[0]) ?? 0) + 1);
    }

    expect([...byDimension.values()].every((count) => count === 5)).toBe(true);
  });
});
