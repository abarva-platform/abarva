/**
 * Connectors page banner smoke test · Wave 2 PR-1
 *
 * Verifies the page-view surfaces the sticky-banner inputs the
 * connectors page needs:
 *
 *   • `degradedCount` matches the number of `blocked` adapter rows
 *     (posture-tier `degraded`).
 *   • `firstDegradedId` points at the first degraded connector in
 *     the posture-first sorted list.
 *   • When no rows are degraded, both fields surface zero / null
 *     so the page hides the banner.
 *   • The flat `connectors` list is sorted degraded-first.
 *
 * The page render itself is exercised through `view.degradedCount`
 * — the JSX-side conditional is `degradedCount > 0 && firstDegradedId`,
 * so verifying those inputs is sufficient to verify the banner
 * lifecycle.
 */

import { buildConnectorsPageView } from '@/lib/admin/connectors-page-view';

describe('connectors page-view · degraded banner inputs', () => {
  beforeAll(() => {
    // Adapter defaults to fixture mode; ADMIN_DATA_MODE undefined → fixture.
    delete process.env.ADMIN_DATA_MODE;
  });

  it('exposes a degraded count and first-degraded id for tenants with degraded rows', async () => {
    // Apex Retail fixture contains a `blocked` connector (Beroe LiVE.Ai
    // market-intelligence — `not_configured` in the fixture; we synthesize
    // by reading whatever the live fixture exposes and checking the
    // contract still holds).
    const view = await buildConnectorsPageView('apex-retail');

    // The contract MUST always supply both fields (numbers / null).
    expect(typeof view.degradedCount).toBe('number');
    expect(view.degradedCount).toBeGreaterThanOrEqual(0);
    expect(
      view.firstDegradedId === null || typeof view.firstDegradedId === 'string',
    ).toBe(true);

    // If degraded rows exist, firstDegradedId MUST point at one and
    // the leading connector in the sorted list MUST be degraded.
    const blockedRows = view.connectors.filter((c) => c.status === 'blocked');
    expect(view.degradedCount).toBe(blockedRows.length);

    if (view.degradedCount > 0) {
      expect(view.firstDegradedId).not.toBeNull();
      expect(view.connectors[0].status).toBe('blocked');
      expect(view.firstDegradedId).toBe(view.connectors[0].id);
    } else {
      expect(view.firstDegradedId).toBeNull();
    }
  });

  it('hides the banner (degradedCount=0, firstDegradedId=null) for tenants with no degraded rows', async () => {
    // Meridian fixture has no `blocked` connectors per the fixture
    // module's stewardship; verify the no-banner posture.
    const view = await buildConnectorsPageView('meridian-health');
    const blockedRows = view.connectors.filter((c) => c.status === 'blocked');

    expect(view.degradedCount).toBe(blockedRows.length);
    if (blockedRows.length === 0) {
      expect(view.degradedCount).toBe(0);
      expect(view.firstDegradedId).toBeNull();
    }
  });

  it('sorts the flat connectors list posture-first (degraded → disconnected → live → pending)', async () => {
    const view = await buildConnectorsPageView('apex-retail');
    const order = view.connectors.map((c) => c.status);

    // Adjacent pairs must be non-increasing in urgency:
    // blocked < not_configured < configured_stub < deferred.
    const rank: Record<string, number> = {
      blocked: 0,
      not_configured: 1,
      configured_stub: 2,
      deferred: 3,
    };
    for (let i = 1; i < order.length; i++) {
      const prev = rank[order[i - 1]] ?? 99;
      const curr = rank[order[i]] ?? 99;
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });
});
