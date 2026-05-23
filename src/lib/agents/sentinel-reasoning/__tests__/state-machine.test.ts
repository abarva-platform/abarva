import { classifySentinelIntent, runSentinelReasoning } from '../index';

describe('P11 Sentinel reasoning loop', () => {
  it('routes IT-productivity questions into the structured loop', async () => {
    const result = await classifySentinelIntent({
      query: 'How should Apex improve IT productivity with AI and DORA?',
      clientId: 'apexretail',
      userId: 'test-user',
    });

    expect(result.intent).toBe('it_productivity');
    expect(result.confidence).toBeGreaterThanOrEqual(30);
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
