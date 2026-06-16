import {
  AI_CONTROL_TOWER_OPTIONAL_SHEETS,
  AI_CONTROL_TOWER_REQUIRED_SHEETS,
  AI_CONTROL_TOWER_SHEET_CONTRACTS,
  classifyAiControlTowerIntent,
  lensForAiControlIntent,
  normalizeAiControlHeader,
} from '../contracts';

describe('AI Control Tower contracts', () => {
  it('treats actions as derived, with only an optional decision-log input sheet', () => {
    expect(AI_CONTROL_TOWER_REQUIRED_SHEETS).not.toContain('Action Decision Log');
    expect(AI_CONTROL_TOWER_OPTIONAL_SHEETS).toContain('Action Decision Log');
    expect(AI_CONTROL_TOWER_SHEET_CONTRACTS.find((sheet) => sheet.sheetName === 'Action Decision Log')).toMatchObject({
      targetTable: 'ai_control_actions',
      required: false,
      requiredHeaders: expect.arrayContaining(['action_id', 'recommendation', 'owner_role', 'evidence_id']),
    });
  });

  it('normalizes workbook headers into stable loader keys', () => {
    expect(normalizeAiControlHeader(' Monthly Spend (USD) ')).toBe('monthly_spend_usd');
    expect(normalizeAiControlHeader('Source Row #')).toBe('source_row');
  });

  it('orients common CXO questions to reusable intents and lenses', () => {
    expect(classifyAiControlTowerIntent('Which actions should go to steering?')).toBe('steering_actions');
    expect(lensForAiControlIntent('steering_actions')).toBe('actions');

    expect(classifyAiControlTowerIntent('Are ServiceNow agents worth renewing?')).toBe('agent_outcome');
    expect(lensForAiControlIntent('agent_outcome')).toBe('agents');

    expect(classifyAiControlTowerIntent('Where did developer DORA improve?')).toBe('productivity_before_after');
    expect(lensForAiControlIntent('productivity_before_after')).toBe('productivity');
  });
});
