import { nextSourceStage, SOURCE_STAGE_ORDER } from '../constants';
import {
  confirmationKeysForStage,
  WORKED_STAGE_CONFIRMATIONS,
} from '../stage-gate-confirmations';
import { REQUIRED_APPROVAL_CONFIRMATIONS } from '../approval-decision';

describe('nextSourceStage', () => {
  it('returns the next stage for every non-final stage in canonical order', () => {
    for (let i = 0; i < SOURCE_STAGE_ORDER.length - 1; i += 1) {
      expect(nextSourceStage(SOURCE_STAGE_ORDER[i])).toBe(SOURCE_STAGE_ORDER[i + 1]);
    }
  });

  it('returns null for the final stage (value)', () => {
    expect(nextSourceStage('value')).toBeNull();
  });

  it('returns null for unknown / absent keys', () => {
    expect(nextSourceStage('not_a_stage')).toBeNull();
    expect(nextSourceStage(null)).toBeNull();
    expect(nextSourceStage(undefined)).toBeNull();
  });

  it('normalizes a legacy alias before resolving the next stage', () => {
    // 'sourcing_strategy' → 'strategy' → 'scope'
    expect(nextSourceStage('sourcing_strategy')).toBe('scope');
    // 'orals_bafo' → 'bafo' → 'executive_decision'
    expect(nextSourceStage('orals_bafo')).toBe('executive_decision');
  });
});

describe('confirmationKeysForStage', () => {
  it('returns the P0 strategy set for the strategy stage', () => {
    expect(confirmationKeysForStage('strategy')).toEqual([
      ...REQUIRED_APPROVAL_CONFIRMATIONS,
    ]);
  });

  it('returns the worked-stage set for every other canonical stage', () => {
    for (const stage of SOURCE_STAGE_ORDER) {
      if (stage === 'strategy') continue;
      expect(confirmationKeysForStage(stage)).toEqual([...WORKED_STAGE_CONFIRMATIONS]);
    }
  });

  it('falls back to the worked-stage set (never empty) for an unknown key', () => {
    expect(confirmationKeysForStage('not_a_stage')).toEqual([
      ...WORKED_STAGE_CONFIRMATIONS,
    ]);
  });

  it('normalizes a legacy strategy alias to the P0 set', () => {
    expect(confirmationKeysForStage('sourcing_strategy')).toEqual([
      ...REQUIRED_APPROVAL_CONFIRMATIONS,
    ]);
  });
});
