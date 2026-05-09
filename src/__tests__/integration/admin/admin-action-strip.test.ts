/**
 * W32E — Admin Zone E Action Strip Tests
 *
 * Tests for src/lib/admin/admin-action-strip-view.ts
 * All tests are deterministic seed only.
 */

import {
  buildAdminActionStripView,
  getAvailableAdminActions,
  getBlockedAdminActions,
  type AdminActionStripView,
  type AdminActionStatus,
} from '@/lib/admin/admin-action-strip-view';

// ===========================================================================
// Structure
// ===========================================================================

describe('buildAdminActionStripView — structure', () => {
  it('deterministicSeed is true', () => {
    const view = buildAdminActionStripView('apex-retail');
    expect(view.deterministicSeed).toBe(true);
  });

  it('caveat is a non-empty string', () => {
    const view = buildAdminActionStripView('apex-retail');
    expect(typeof view.caveat).toBe('string');
    expect(view.caveat.length).toBeGreaterThan(10);
  });

  it('availableCount equals actions with available status', () => {
    const view = buildAdminActionStripView('apex-retail');
    const available = view.actions.filter((a) => a.status === 'available').length;
    expect(view.availableCount).toBe(available);
  });

  it('blockedCount equals actions with blocked status', () => {
    const view = buildAdminActionStripView('apex-retail');
    const blocked = view.actions.filter((a) => a.status === 'blocked').length;
    expect(view.blockedCount).toBe(blocked);
  });
});

// ===========================================================================
// Apex Retail data contract
// ===========================================================================

describe('buildAdminActionStripView — apex-retail', () => {
  let view: AdminActionStripView;

  beforeEach(() => {
    view = buildAdminActionStripView('apex-retail');
  });

  it('returns at least 5 actions for apex-retail', () => {
    expect(view.actions.length).toBeGreaterThanOrEqual(5);
  });

  it('includes dataset_approval action', () => {
    const found = view.actions.find((a) => a.category === 'dataset_approval');
    expect(found).toBeDefined();
  });

  it('includes connector_setup action', () => {
    const found = view.actions.find((a) => a.category === 'connector_setup');
    expect(found).toBeDefined();
  });

  it('includes user_access action', () => {
    const found = view.actions.find((a) => a.category === 'user_access');
    expect(found).toBeDefined();
  });

  it('includes production_readiness action', () => {
    const found = view.actions.find((a) => a.category === 'production_readiness');
    expect(found).toBeDefined();
  });

  it('includes architecture_review action', () => {
    const found = view.actions.find((a) => a.category === 'architecture_review');
    expect(found).toBeDefined();
  });

  it('each action has a non-empty label', () => {
    for (const action of view.actions) {
      expect(action.label.length).toBeGreaterThan(0);
    }
  });

  it('each action has deterministicSeed true', () => {
    for (const action of view.actions) {
      expect(action.deterministicSeed).toBe(true);
    }
  });

  it('each action has a valid status', () => {
    const validStatuses: AdminActionStatus[] = ['available', 'disabled', 'deferred', 'blocked'];
    for (const action of view.actions) {
      expect(validStatuses).toContain(action.status);
    }
  });

  it('each action has a valid ownerAgent', () => {
    const validAgents = ['steward', 'nexus', 'atlas'];
    for (const action of view.actions) {
      expect(validAgents).toContain(action.ownerAgent);
    }
  });

  it('production readiness action is blocked', () => {
    const pr = view.actions.find((a) => a.category === 'production_readiness');
    expect(pr?.status).toBe('blocked');
  });

  it('architecture review action is deferred', () => {
    const ar = view.actions.find((a) => a.category === 'architecture_review');
    expect(ar?.status).toBe('deferred');
  });

  it('deferred actions have deferredReason non-null', () => {
    const deferred = view.actions.filter((a) => a.status === 'deferred');
    for (const a of deferred) {
      expect(a.deferredReason).not.toBeNull();
    }
  });

  it('topPriorityAction is non-null for apex-retail', () => {
    expect(view.topPriorityAction).not.toBeNull();
  });

  it('topPriorityAction is available and high priority', () => {
    expect(view.topPriorityAction?.status).toBe('available');
    expect(view.topPriorityAction?.priority).toBe('high');
  });
});

// ===========================================================================
// getAvailableAdminActions
// ===========================================================================

describe('getAvailableAdminActions', () => {
  it('returns only available actions for apex-retail', () => {
    const actions = getAvailableAdminActions('apex-retail');
    for (const a of actions) {
      expect(a.status).toBe('available');
    }
  });

  it('returns non-empty list for apex-retail', () => {
    const actions = getAvailableAdminActions('apex-retail');
    expect(actions.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// getBlockedAdminActions
// ===========================================================================

describe('getBlockedAdminActions', () => {
  it('returns only blocked actions for apex-retail', () => {
    const actions = getBlockedAdminActions('apex-retail');
    for (const a of actions) {
      expect(a.status).toBe('blocked');
    }
  });

  it('returns at least one blocked action for apex-retail', () => {
    const actions = getBlockedAdminActions('apex-retail');
    expect(actions.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// Unknown tenant
// ===========================================================================

describe('buildAdminActionStripView — unknown tenant', () => {
  it('returns empty actions for unknown tenant', () => {
    const view = buildAdminActionStripView('unknown');
    expect(view.actions).toHaveLength(0);
  });

  it('topPriorityAction is null for unknown tenant', () => {
    const view = buildAdminActionStripView('unknown');
    expect(view.topPriorityAction).toBeNull();
  });

  it('deterministicSeed is true for unknown tenant', () => {
    const view = buildAdminActionStripView('unknown');
    expect(view.deterministicSeed).toBe(true);
  });
});
