import {
  PATTERNOPS_PROMOTION_STATES,
  PATTERNOPS_RETRIEVAL_ORDER,
  isTrustedPatternOpsPattern,
  patternOpsCoverageKey,
  summarizeGroundingBasis,
  type CanonicalPatternOpsPattern,
} from './canonical-pattern-contract';

function basePattern(overrides: Partial<CanonicalPatternOpsPattern> = {}): CanonicalPatternOpsPattern {
  return {
    canonicalPatternId: 'patops-healthcare-ambient-cdi-001',
    sourcePatternIds: ['H-CDI-001'],
    title: 'Ambient AI CDI Capture Regression',
    summary: 'Ambient AI notes reduce burden but can miss CDI-specific evidence.',
    industry: 'healthcare',
    enterpriseArea: 'middle_office',
    function: 'clinical documentation integrity',
    processArea: 'ambient documentation',
    useCase: 'ambient ai note drafting',
    aiAgenticArchitecturePattern: 'ambient listener drafts note; clinician approves; CDI agent audits specificity',
    humanRole: 'clinician confirms clinical truth and approves final note',
    agentRole: 'drafts note, flags missing specificity, routes CDI exceptions',
    dataRequirements: ['encounter transcript', 'problem list', 'coding rules', 'CDI query history'],
    kpis: ['note closure time', 'CDI query response rate', 'HCC capture rate'],
    valueLevers: ['physician productivity', 'risk adjustment accuracy', 'denial prevention'],
    failureModes: ['clinical specificity loss', 'physician correction fatigue', 'BAA subprocessor gap'],
    guardrails: ['human approval before billing', 'BAA review', 'CDI exception sampling'],
    artifacts: ['AI move canvas', 'human-agent workflow design', 'value model', 'governance checklist'],
    workshops: ['clinical workflow redesign', 'CDI validation workshop'],
    applicablePhases: ['originate', 'design', 'roadmap_business_case'],
    sourceBasis: [
      {
        sourceType: 'genome_pattern',
        sourceId: 'H-CDI-001',
        label: 'Healthcare CDI corpus pattern',
        evidenceClass: 'pattern_backed',
        confidence: 'high',
        reviewedAt: '2026-05-30',
        reviewer: 'PatternOps steward',
      },
    ],
    confidence: 'high',
    lastReviewedAt: '2026-05-30',
    owner: 'healthcare-pattern-steward',
    lifecycleStatus: 'reviewed',
    coverageTags: ['healthcare', 'cdi', 'ambient_ai', 'moves', 'source'],
    retrievalPriority: 80,
    ...overrides,
  };
}

describe('PatternOps canonical contract', () => {
  it('keeps retrieval discipline in the product doctrine order', () => {
    expect(PATTERNOPS_RETRIEVAL_ORDER).toEqual([
      'move_context',
      'client_facts_and_evidence',
      'phase_pack',
      'industry_function_use_case_patterns',
      'cross_industry_analogs',
      'architecture_patterns',
      'failure_modes_and_anti_patterns',
      'required_artifact_templates',
      'missing_inputs_and_confidence',
    ]);
  });

  it('treats reviewed high-confidence patterns with evidence and phase artifacts as trusted for agents', () => {
    expect(isTrustedPatternOpsPattern(basePattern())).toBe(true);
    expect(isTrustedPatternOpsPattern(basePattern({ lifecycleStatus: 'draft' }))).toBe(false);
    expect(isTrustedPatternOpsPattern(basePattern({ confidence: 'medium' }))).toBe(false);
    expect(isTrustedPatternOpsPattern(basePattern({ sourceBasis: [] }))).toBe(false);
    expect(isTrustedPatternOpsPattern(basePattern({ dataRequirements: [] }))).toBe(false);
    expect(isTrustedPatternOpsPattern(basePattern({ failureModes: [] }))).toBe(false);
    expect(isTrustedPatternOpsPattern(basePattern({ artifacts: [] }))).toBe(false);
    expect(isTrustedPatternOpsPattern(basePattern({ applicablePhases: [] }))).toBe(false);
    expect(isTrustedPatternOpsPattern(basePattern({ lastReviewedAt: null }))).toBe(false);
  });

  it('defines the promotion workflow without implying unreviewed automatic training', () => {
    expect(PATTERNOPS_PROMOTION_STATES).toEqual(['draft', 'reviewed', 'trusted', 'retired', 'superseded']);
  });

  it('builds stable coverage keys across industry, office area, function, process, and use case', () => {
    expect(
      patternOpsCoverageKey({
        industry: 'Retail / CPG',
        enterpriseArea: 'front_office',
        function: 'Customer & Loyalty',
        processArea: 'Personalized Offers',
        useCase: 'Next Best Action AI',
      }),
    ).toBe('retail_cpg:front_office:customer_loyalty:personalized_offers:next_best_action_ai');
  });

  it('summarizes the hidden grounding drawer basis in plain language', () => {
    expect(
      summarizeGroundingBasis({
        clientFacts: 4,
        industryPatterns: 3,
        priorMovePatterns: 2,
        benchmarks: 1,
        evidenceArtifacts: 2,
        confidence: 'medium',
        missingInputs: ['adoption metrics', 'baseline cycle time'],
      }),
    ).toContain('4 client facts, 3 industry patterns, 2 prior move patterns');
    expect(
      summarizeGroundingBasis({
        clientFacts: 1,
        industryPatterns: 1,
        priorMovePatterns: 0,
        benchmarks: 0,
        evidenceArtifacts: 1,
        confidence: 'high',
        missingInputs: [],
      }),
    ).not.toContain('Missing inputs');
  });
});
