import { composeAllAgentDoctrineBlock } from '@/lib/agent/all-agent-doctrine';
import { lintVoice, wordCountDelta } from '@/lib/agent/voiceContracts';
import type { AgentKey } from '@/components/agent-rail/AgentRail';
import type { RenderedResponse } from '@/lib/agent/renderedResponse';

jest.mock('server-only', () => ({}));

interface SurfaceFixture {
  name: string;
  agent: AgentKey;
  route: string;
  answer: string;
  shapingDecision?: boolean;
  tenantScoped?: boolean;
}

const fixtures: SurfaceFixture[] = [
  {
    name: 'Setup/Admin Steward',
    agent: 'steward',
    route: '/platform/admin/data-governance',
    tenantScoped: true,
    answer: [
      'Apex Retail setup status: connector and evidence readiness are the gating facts, not a business-value claim.',
      'Source basis: setup evidence ledger. Confidence: medium.',
      'Fix first: verify Clerk and Supabase tenant mapping. Fix next: confirm data-trust upload status. Monitor: missing connector evidence.',
    ].join(' '),
  },
  {
    name: 'Intelligence Sentinel',
    agent: 'sentinel',
    route: '/intelligence',
    tenantScoped: true,
    answer: [
      'Apex Retail has enough corpus grounding to discuss merchandising AI, but KPI magnitude is thin.',
      'Source basis: canonical retail merchandising patterns plus Apex tenant context. Confidence: medium.',
      'Rank value only after checking markdown leakage, stockouts, inventory turns, and planner rework. Next: pull merchandising KPI baselines.',
    ].join(' '),
  },
  {
    name: 'Strategic Moves Nexus',
    agent: 'nexus',
    route: '/strategic-moves/new',
    tenantScoped: true,
    shapingDecision: true,
    answer: [
      'For Apex Retail, start the merchandising Move with margin leakage, not a generic AI roadmap.',
      'Source basis: Apex current-state context plus retail merchandising patterns. Confidence: medium.',
      'Recommended: assortment and markdown decisioning - tests margin, inventory turns, and planner productivity.',
      'Option 2: demand forecasting - better if stockouts are the pain. Option 3: product-content automation - lower risk, lower strategic value.',
    ].join(' '),
  },
  {
    name: 'Source Nexus',
    agent: 'nexus',
    route: '/source/events/apx-src-cdp-2026',
    tenantScoped: true,
    shapingDecision: true,
    answer: [
      'For Apex Retail, shape the CDP sourcing event around identity quality, activation latency, integration ownership, and run cost.',
      'Source basis: Source event evidence plus CDP sourcing patterns. Confidence: high.',
      'Recommended: keep BAFO gated on data quality proof. Option 2: defer BAFO until ownership is clear. Option 3: narrow scope to loyalty activation first.',
    ].join(' '),
  },
  {
    name: 'Tower Atlas',
    agent: 'atlas',
    route: '/tower',
    tenantScoped: true,
    shapingDecision: true,
    answer: [
      'Apex Retail Tower read: pursue merchandising AI only if it ties to margin, stockout, and planner-capacity baselines.',
      'Source basis: Tower pressure state plus canonical retail patterns. Confidence: medium.',
      'Choose: pursue with baseline gate / defer until KPI owners are named / reject if no operating owner will sponsor the decision loop.',
    ].join(' '),
  },
  {
    name: 'General Chat Nexus',
    agent: 'nexus',
    route: '/api/v1/nexus/query',
    answer: [
      'I do not have enough tenant evidence to claim KPIs, financials, or org facts.',
      'Source basis: sparse retrieval only. Confidence: low.',
      'Pattern-level answer: compare baseline KPI ownership, data readiness, and decision rights before ranking value. Next: provide the tenant or Move context.',
    ].join(' '),
  },
];

function expectGroundedConciseAnswer(fixture: SurfaceFixture): void {
  expect(wordCountDelta(fixture.agent, fixture.answer)).toBeLessThanOrEqual(0);
  expect(lintVoice(fixture.agent, fixture.answer)).toEqual([]);
  expect(fixture.answer).toMatch(/Source basis:/);
  expect(fixture.answer).toMatch(/Confidence: (low|medium|high)/i);
  expect(fixture.answer).not.toMatch(/great question|happy to help|hope that helps|feel free to/i);
  expect(fixture.answer).not.toMatch(/Meridian/i);
  expect(fixture.answer).not.toMatch(/\$[0-9]|[0-9]+%|ROI/i);
  if (fixture.tenantScoped) {
    expect(fixture.answer).toContain('Apex Retail');
  }
  if (fixture.shapingDecision) {
    expect(fixture.answer).toMatch(/Recommended:|Choose:/);
    expect(fixture.answer).toMatch(/Option 2:|defer/i);
  }
}

describe('all-agent response-shape regression', () => {
  it.each([
    ['/setup', 'setup_governance'],
    ['/platform/admin/data-governance', 'setup_governance'],
    ['/intelligence', 'intelligence'],
    ['/strategic-moves/new', 'strategic_moves'],
    ['/source/events/apx-src-cdp-2026', 'source'],
    ['/tower', 'tower'],
    ['/api/v1/nexus/query', 'general'],
  ])('injects shared doctrine for %s', (route, expectedSurface) => {
    const doctrine = composeAllAgentDoctrineBlock({ agentName: 'Nexus', surface: route });

    expect(doctrine).toContain(`Surface family: ${expectedSurface}.`);
    expect(doctrine).toContain('Agent posture: Before I guide a Move');
    expect(doctrine).toContain('Pre-advice checklist: client context; phase or lifecycle stage; business problem');
    expect(doctrine).toContain('guide the user to complete the work');
    expect(doctrine).toContain('Decision OS principles');
    expect(doctrine).toContain('Outcome-first');
    expect(doctrine).toContain('Pattern-first');
    expect(doctrine).toContain('Challenge mode');
    expect(doctrine).toContain('Value proof from day one');
    expect(doctrine).toContain('active tenant/current-state context');
    expect(doctrine).toContain('AGENT OUTPUT CONTRACT v2026-06-05');
    expect(doctrine).toContain('three-depth CXO reading model');
    expect(doctrine).toContain('Always lead with a 1-2 sentence answer');
    expect(doctrine).toContain('cxo-decision-digest, lead-bullets, lead-table, stat-stack, sequential-steps, or brief-narrative');
    expect(doctrine).toContain('For hard CXO or strategic questions, default to cxo-decision-digest');
    expect(doctrine).toContain('CXO decision digest labels: My read; Why; Decision fork; What I would do next; Evidence gap');
    expect(doctrine).toContain('Simple factual questions stay simple');
    expect(doctrine).toContain('avoid wall-of-text answers over roughly 120 words');
    expect(doctrine).toContain('do not emit raw markdown emphasis markers');
    expect(doctrine).toContain('offer 2-4 options');
    expect(doctrine).toContain('Never invent current-state facts, KPI values, financials, org structure');
    expect(doctrine).toContain('rank opportunities from available tenant KPIs');
  });

  it.each(fixtures)('keeps $name concise, sourced, tenant-aware, and non-inventive', (fixture) => {
    expectGroundedConciseAnswer(fixture);
  });

  it('requires rendered responses to expose confidence, sparsity, citations, and next action metadata', () => {
    const rendered: RenderedResponse = {
      response_text: fixtures[2].answer,
      citations: [{
        placeholder: '{{cite:pattern:AIP-RETAIL-MERCHANDISING_DECISIONING}}',
        target_type: 'pattern',
        target_id: 'AIP-RETAIL-MERCHANDISING_DECISIONING',
        target_slug: 'retail-merchandising-decisioning',
        target_label: 'Retail Merchandising Decisioning',
        confidence: 0.74,
        confidence_tier: 'MEDIUM',
        provenance: 'authored',
      }],
      confidence_signal: 'medium',
      sparsity_flag: false,
      follow_up_actions: [{
        id: 'choose-recommended-merchandising-move',
        label: 'Use recommended option',
        kind: 'next_turn',
        target: 'Use assortment and markdown decisioning as the Move hypothesis.',
      }],
      handoff_affordance: null,
      honest_disclosure: {
        contextBundleState: 'usable_with_gaps',
        confidenceLevel: 'MEDIUM',
        confidenceReason: 'Tenant context and canonical retail patterns are present; KPI values are not yet retrieved.',
        contextCategoriesUsed: ['Tenant current state', 'Pattern library'],
        missingInputs: ['Current merchandising KPI values', 'KPI owner confirmation'],
        disclosureMessage: 'Grounded in tenant context and patterns; KPI ranking still needs baseline values.',
        responseGate: 'proceed_with_disclosure',
        permitsResponse: true,
        recommendedResponseMode: 'proceed_with_disclosure',
      },
    };

    expect(rendered.citations).toHaveLength(1);
    expect(rendered.confidence_signal).toBe('medium');
    expect(rendered.follow_up_actions[0]?.label).toBe('Use recommended option');
    expect(rendered.honest_disclosure?.missingInputs).toEqual([
      'Current merchandising KPI values',
      'KPI owner confirmation',
    ]);
  });
});
