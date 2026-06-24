import {
  OPERATIONAL_MODULE_VISIBILITY,
  OPERATIONAL_SEMANTIC_VIEWS,
  buildOperationalInsightCards,
  getOperationalModuleVisibility,
  getOperationalSemanticViewsForModule,
} from '../operational-evidence-semantic-layer';

describe('operational evidence semantic layer', () => {
  it('exposes semantic views to core frontend modules', () => {
    for (const moduleKey of ['home', 'intelligence', 'moves', 'context_layer_admin', 'tower', 'ava'] as const) {
      const contract = getOperationalModuleVisibility(moduleKey);
      const views = getOperationalSemanticViewsForModule(moduleKey);

      expect(contract).not.toBeNull();
      expect(views.length).toBeGreaterThan(0);
      expect(contract?.visibleViews).toHaveLength(views.length);
    }
  });

  it('gives aVa full operational question coverage', () => {
    const ava = getOperationalModuleVisibility('ava');

    expect(ava?.primaryQuestions).toEqual(
      expect.arrayContaining([
        'What work is repetitive?',
        'Where are the bottlenecks?',
        'Which apps create the most operational friction?',
        'What should we automate first?',
        'What stays human-approved?',
        'What is the 90-day pilot roadmap?',
        'What value can we expect?',
      ]),
    );
    expect(ava?.visibleViews).toHaveLength(OPERATIONAL_SEMANTIC_VIEWS.length);
  });

  it('keeps Moves connected to readiness, opportunity, control, value, and roadmap views', () => {
    const moves = getOperationalModuleVisibility('moves');

    expect(moves?.visibleViews).toEqual(
      expect.arrayContaining([
        'evidence_readiness_and_lineage',
        'automation_opportunity_portfolio',
        'human_agent_control_matrix',
        'value_estimate_portfolio',
        'ninety_day_pilot_plan',
      ]),
    );
    expect(moves?.defaultActions).toEqual(expect.arrayContaining(['Generate draft', 'Regenerate with feedback']));
  });

  it('defines every semantic view with metrics, dimensions, consumers, and questions', () => {
    for (const view of OPERATIONAL_SEMANTIC_VIEWS) {
      expect(view.metrics.length).toBeGreaterThan(0);
      expect(view.dimensions.length).toBeGreaterThan(0);
      expect(view.consumerModules.length).toBeGreaterThan(0);
      expect(view.defaultQuestions.length).toBeGreaterThan(0);
      expect(view.defaultInsightCards.length).toBeGreaterThan(0);
    }
  });

  it('builds consumable insight cards from traceable opportunities', () => {
    const cards = buildOperationalInsightCards({
      caveat: 'Synthetic demo evidence - not client-approved production truth',
      opportunities: [
        {
          opportunityId: 'AI-OPP-001',
          opportunityName: 'Ticket Intake Agent',
          sourceEvidence: ['INC1048000', 'EVT-2026-05-01-00'],
          pattern: 'High reassignment/reopen pattern across top categories.',
          humanRole: 'Review high severity and low confidence recommendations.',
          agentRole: 'Draft evidence-backed routing recommendation.',
          controls: ['Human approval for P1/P2', 'Audit log'],
          valueEstimate: '$190,000-$260,000 annual ROM',
          affectedApplications: ['Advisor Desktop'],
          affectedTeams: ['Advisor Platform Support'],
          confidence: 0.78,
        },
      ],
    });

    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      id: 'operational-insight-AI-OPP-001',
      type: 'automation_priority',
      title: 'Ticket Intake Agent',
      evidenceRefs: ['INC1048000', 'EVT-2026-05-01-00'],
      caveat: 'Synthetic demo evidence - not client-approved production truth',
    });
  });

  it('does not define module visibility for unknown modules', () => {
    expect(OPERATIONAL_MODULE_VISIBILITY.map((entry) => entry.module)).not.toContain('unknown');
  });
});
