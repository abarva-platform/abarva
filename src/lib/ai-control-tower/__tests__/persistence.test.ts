import canonicalPackage from '../../../../docs/build/ai-control-tower-template/ai-control-tower-synthetic-canonical-v1.json';
import { buildAiControlTowerLoadPlan } from '../load-plan';
import { prepareAiControlTowerCommitBatch } from '../persistence';

describe('AI Control Tower persistence preparation', () => {
  it('maps canonical plan rows to concrete substrate table columns', () => {
    const plan = buildAiControlTowerLoadPlan({
      clientId: '00000000-0000-0000-0000-000000000001',
      clientKey: 'firstcapital',
      package: canonicalPackage,
    });
    const batch = prepareAiControlTowerCommitBatch({
      plan,
      refreshRunId: '11111111-1111-1111-1111-111111111111',
      sourceIdByKey: {
        'SRC-M365-COPILOT-MAY': '22222222-2222-2222-2222-222222222222',
        'SRC-GITHUB-DORA-MAY': '33333333-3333-3333-3333-333333333333',
      },
    });

    expect(batch.sources).toHaveLength(10);
    expect(batch.rowsByTable.ai_control_initiatives).toHaveLength(7);
    expect(batch.rowsByTable.ai_control_tool_usage_monthly[0]).toMatchObject({
      source_id: '22222222-2222-2222-2222-222222222222',
      tool_key: 'TOOL-M365',
      user_group_or_team: 'Finance Analysts',
      period_start: '2026-05-01',
      period_end: '2026-05-31',
    });
    expect(batch.rowsByTable.ai_control_dora_metrics[0]).toMatchObject({
      source_id: '33333333-3333-3333-3333-333333333333',
      period_start: '2026-05-01',
      period_end: '2026-05-31',
    });
    expect(batch.rowsByTable.ai_control_context_facts).toHaveLength(108);
    expect(batch.rowsByTable.ai_control_evidence_items).toHaveLength(7);
  });

  it('persists derived actions as proposed system outputs', () => {
    const plan = buildAiControlTowerLoadPlan({
      clientId: '00000000-0000-0000-0000-000000000001',
      package: canonicalPackage,
    });
    const batch = prepareAiControlTowerCommitBatch({
      plan,
      refreshRunId: '11111111-1111-1111-1111-111111111111',
      sourceIdByKey: {},
    });

    const actions = batch.rowsByTable.ai_control_actions;
    expect(actions).toHaveLength(plan.derivedActions.length);
    expect(actions.every((action) => action.status === 'proposed')).toBe(true);
    expect(actions.every((action) => (action.payload as { source?: string }).source === 'system_derived')).toBe(true);
  });
});
