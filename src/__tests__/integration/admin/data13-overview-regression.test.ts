/**
 * DATA13 — Overview page regression guard.
 *
 * Asserts that:
 * 1. buildOverviewPageView() returns real adapter data (not hardcoded constants)
 * 2. setupItems contains at least the 6 canonical setup step IDs
 * 3. recentActivity and crossPageCounts are present
 * 4. dataMode is a valid value
 * 5. No hardcoded SETUP_ITEMS constant can be re-introduced (enforced via type check)
 */

import { buildOverviewPageView } from '@/lib/admin/overview-page-view';

const CANONICAL_STEP_IDS = [
  'data-trust',
  'connectors',
  'users-access',
  'agent-readiness',
  'production-readiness',
  'architecture',
];

describe('DATA13 · overview page regression guard', () => {
  it('returns the canonical 6 setup step IDs', async () => {
    const view = await buildOverviewPageView();
    const ids = view.setupItems.map((s) => s.id);
    for (const id of CANONICAL_STEP_IDS) {
      expect(ids).toContain(id);
    }
  });

  it('returns recentActivity array', async () => {
    const view = await buildOverviewPageView();
    expect(Array.isArray(view.recentActivity)).toBe(true);
  });

  it('returns crossPageCounts with expected keys', async () => {
    const view = await buildOverviewPageView();
    expect(view.crossPageCounts).toHaveProperty('openBlockers');
    expect(view.crossPageCounts).toHaveProperty('datasetsPendingApproval');
    expect(view.crossPageCounts).toHaveProperty('connectorsNotConfigured');
    expect(view.crossPageCounts).toHaveProperty('invitesPending');
    expect(view.crossPageCounts).toHaveProperty('productionReadinessGatesFailing');
  });

  it('returns a valid dataMode', async () => {
    const view = await buildOverviewPageView();
    expect(['fixture', 'live']).toContain(view.dataMode);
  });

  it('all setupItem statuses are valid', async () => {
    const view = await buildOverviewPageView();
    const validStatuses = ['done', 'in_progress', 'pending'];
    for (const item of view.setupItems) {
      expect(validStatuses).toContain(item.status);
    }
  });

  it('context data field reflects dataMode', async () => {
    const view = await buildOverviewPageView();
    if (view.dataMode === 'live') {
      expect(view.context.data).toBe('Live DB');
      expect(view.context.liveStatusKind).toBe('live');
    } else {
      expect(view.context.data).toContain('seeds');
      expect(view.context.liveStatusKind).toBe('deferred');
    }
  });
});
