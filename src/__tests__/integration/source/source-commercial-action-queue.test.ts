import {
  buildCommercialActionQueue,
  ActionState,
  ActionCategory,
} from '../../../lib/source/source-commercial-action-queue';
import { SourceCommercialActionQueue } from '../../../components/source/SourceCommercialActionQueue';

const VALID_STATES: ActionState[] = [
  'proposed',
  'waiting',
  'blocked',
  'completed',
  'deferred',
];

const VALID_CATEGORIES: ActionCategory[] = [
  'vendor-follow-up',
  'pricing-clarification',
  'bafo-prep',
  'risk-review',
  'scorecard-governance',
  'executive-decision',
  'evidence-request',
  'readiness-blocker',
];

const VALID_AGENT_OWNERS = ['Nexus', 'Sentinel', 'Atlas', 'Steward', 'Buyer Team'];

const SAMPLE_RFP_ID = 'rfp-test-001';
const SAMPLE_VENDOR_LIST = ['Vendor Alpha', 'Vendor Beta', 'Vendor Delta'];

describe('SourceCommercialActionQueue - type shape and data integrity', () => {
  const vm = buildCommercialActionQueue(SAMPLE_RFP_ID, SAMPLE_VENDOR_LIST);

  it('buildCommercialActionQueue returns 8 total actions', () => {
    expect(vm.actions).toHaveLength(8);
  });

  it('visibleActions has length 5', () => {
    expect(vm.visibleActions).toHaveLength(5);
  });

  it('hasMore === true', () => {
    expect(vm.hasMore).toBe(true);
  });

  it('all actions have deterministicSeed === true', () => {
    vm.actions.forEach((action) => {
      expect(action.deterministicSeed).toBe(true);
    });
  });

  it('all state values are valid', () => {
    vm.actions.forEach((action) => {
      expect(VALID_STATES).toContain(action.state);
    });
  });

  it('all category values are valid', () => {
    vm.actions.forEach((action) => {
      expect(VALID_CATEGORIES).toContain(action.category);
    });
  });

  it('all agentOwner values are one of the permitted owners', () => {
    vm.actions.forEach((action) => {
      expect(VALID_AGENT_OWNERS).toContain(action.agentOwner);
    });
  });

  it('blockedCount matches count of actions with state "blocked"', () => {
    const manualBlockedCount = vm.actions.filter((a) => a.state === 'blocked').length;
    expect(vm.blockedCount).toBe(manualBlockedCount);
  });

  it('highPriorityCount matches count of actions with priority "high"', () => {
    const manualHighCount = vm.actions.filter((a) => a.priority === 'high').length;
    expect(vm.highPriorityCount).toBe(manualHighCount);
  });

  it('generatedAt === "2026-04-26"', () => {
    expect(vm.generatedAt).toBe('2026-04-26');
  });

  it('caveat contains "deterministic"', () => {
    expect(vm.caveat).toContain('deterministic');
  });

  it('SourceCommercialActionQueue is exported as a function', () => {
    expect(typeof SourceCommercialActionQueue).toBe('function');
  });
});
