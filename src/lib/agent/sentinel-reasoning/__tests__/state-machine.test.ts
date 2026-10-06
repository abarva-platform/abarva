jest.mock('server-only', () => ({}));

import { classifySentinelIntent, runSentinelReasoning } from '../index';

describe('P11 Sentinel reasoning loop', () => {
  it('routes IT-productivity questions into the structured loop', async () => {
    const result = await classifySentinelIntent({
      query: 'How should Apex improve IT productivity with AI and DORA metrics?',
      clientId: 'apexretail',
      userId: 'test-user',
    });

    expect(result.intent).toBe('it_productivity');
    expect(result.confidence).toBeGreaterThanOrEqual(30);
  });

  // Regression guard for the 2026-05-25 Meridian stress test: Q3/Q4/Q5-style
  // questions were misrouted into the six-stage workflow, producing identical
  // 6,000-character canned-template responses that scored 10/10. After the
  // classifier was tightened these generic questions must fall through to the
  // general intent.
  it.each([
    'Walk me through our application portfolio',
    'Which initiatives should we kill this quarter?',
    'What blocks killing the loyalty rewrite?',
  ])('does NOT misroute generic question into it_productivity workflow: %s', async (query) => {
    const result = await classifySentinelIntent({
      query,
      clientId: 'meridian',
      userId: 'test-user',
    });
    expect(result.intent).toBe('general');
  });

  it('emits six auditable stages with citations and a Shape Move action', async () => {
    const stages = [];
    for await (const stage of runSentinelReasoning({
      query: 'As Apex CTO, where should I use AI to improve IT productivity?',
      clientId: 'apexretail',
      userId: 'test-user',
    })) {
      stages.push(stage);
    }

    expect(stages.map((stage) => stage.id)).toEqual([
      'clarify',
      'alignment_check',
      'portfolio_segmentation',
      'tom_recommendation',
      'tooling_governance',
      'sibling_move_portfolio',
    ]);
    expect(stages.every((stage) => stage.citations.length >= 3)).toBe(true);
    expect(stages.every((stage) => stage.corpusVersionPinned >= 1 && stage.templateVersionPinned >= 1)).toBe(true);
    const finalStage = stages[5];
    expect(finalStage.dissent).toMatch(/Dissent/);
    expect(finalStage.oneClickAction?.endpoint).toBe('/api/dependencies/siblings/accept');
    expect(finalStage.oneClickAction?.payload.proposals.length).toBeGreaterThanOrEqual(5);
  });
});
