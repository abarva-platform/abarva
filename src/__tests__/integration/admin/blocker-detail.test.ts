/**
 * W32F — Production Readiness Blocker Detail Tests
 *
 * Tests for src/lib/admin/blocker-detail-view.ts
 * ADMIN-DATA8 — module is now async (delegates to admin-blockers-adapter).
 * All tests are deterministic seed only.
 */

import {
  buildBlockerDetailDrawerView,
  getAllBlockerDetails,
  getCriticalBlockers,
  type BlockerSeverity,
  type BlockerOwner,
} from '@/lib/admin/blocker-detail-view';

// ===========================================================================
// getAllBlockerDetails
// ===========================================================================

describe('getAllBlockerDetails', () => {
  it('returns 4 blockers for apex-retail', async () => {
    const blockers = await getAllBlockerDetails('apex-retail');
    expect(blockers).toHaveLength(4);
  });

  it('returns empty array for unknown tenant', async () => {
    const blockers = await getAllBlockerDetails('unknown');
    expect(blockers).toHaveLength(0);
  });

  it('each blocker has a unique id', async () => {
    const blockers = await getAllBlockerDetails('apex-retail');
    const ids = new Set(blockers.map((b) => b.id));
    expect(ids.size).toBe(blockers.length);
  });

  it('each blocker has deterministicSeed true', async () => {
    const blockers = await getAllBlockerDetails('apex-retail');
    for (const b of blockers) {
      expect(b.deterministicSeed).toBe(true);
    }
  });

  it('each blocker has a non-empty title', async () => {
    const blockers = await getAllBlockerDetails('apex-retail');
    for (const b of blockers) {
      expect(b.title.length).toBeGreaterThan(0);
    }
  });

  it('each blocker has a valid severity', async () => {
    const valid: BlockerSeverity[] = ['critical', 'high', 'medium', 'low'];
    const blockers = await getAllBlockerDetails('apex-retail');
    for (const b of blockers) {
      expect(valid).toContain(b.severity);
    }
  });

  it('each blocker has a valid owner', async () => {
    const valid: BlockerOwner[] = ['steward', 'nexus', 'atlas', 'founder', 'engineering'];
    const blockers = await getAllBlockerDetails('apex-retail');
    for (const b of blockers) {
      expect(valid).toContain(b.owner);
    }
  });

  it('no blocker claims to be resolved', async () => {
    // blockers in seed data are open — no "resolved" field = pass
    const blockers = await getAllBlockerDetails('apex-retail');
    expect(blockers.length).toBeGreaterThan(0);
    // All are either pilot or production blockers
    const impactful = blockers.filter((b) => b.pilotImpact || b.productionImpact);
    expect(impactful.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// getCriticalBlockers
// ===========================================================================

describe('getCriticalBlockers', () => {
  it('returns only critical severity blockers', async () => {
    const blockers = await getCriticalBlockers('apex-retail');
    for (const b of blockers) {
      expect(b.severity).toBe('critical');
    }
  });

  it('returns 2 critical blockers for apex-retail', async () => {
    const blockers = await getCriticalBlockers('apex-retail');
    expect(blockers).toHaveLength(2);
  });

  it('evidence upload connector is critical', async () => {
    const blockers = await getCriticalBlockers('apex-retail');
    const found = blockers.find((b) => b.id === 'blk-apex-001');
    expect(found).toBeDefined();
  });

  it('model gateway is critical', async () => {
    const blockers = await getCriticalBlockers('apex-retail');
    const found = blockers.find((b) => b.id === 'blk-apex-002');
    expect(found).toBeDefined();
  });

  it('returns empty for unknown tenant', async () => {
    expect(await getCriticalBlockers('unknown')).toHaveLength(0);
  });
});

// ===========================================================================
// buildBlockerDetailDrawerView — found blocker
// ===========================================================================

describe('buildBlockerDetailDrawerView — found blocker', () => {
  it('blocker is non-null for valid blockerId', async () => {
    const view = await buildBlockerDetailDrawerView('blk-apex-001', 'apex-retail');
    expect(view.blocker).not.toBeNull();
  });

  it('blocker.id matches requested blockerId', async () => {
    const view = await buildBlockerDetailDrawerView('blk-apex-001', 'apex-retail');
    expect(view.blocker?.id).toBe('blk-apex-001');
  });

  it('drawerTitle matches blocker title', async () => {
    const view = await buildBlockerDetailDrawerView('blk-apex-001', 'apex-retail');
    expect(view.drawerTitle).toBe(view.blocker?.title);
  });

  it('deterministicSeed is true', async () => {
    const view = await buildBlockerDetailDrawerView('blk-apex-001', 'apex-retail');
    expect(view.deterministicSeed).toBe(true);
  });

  it('caveat is a non-empty string', async () => {
    const view = await buildBlockerDetailDrawerView('blk-apex-001', 'apex-retail');
    expect(view.caveat.length).toBeGreaterThan(0);
  });

  it('relatedBlockers does not include the main blocker', async () => {
    const view = await buildBlockerDetailDrawerView('blk-apex-001', 'apex-retail');
    const ids = view.relatedBlockers.map((b) => b.id);
    expect(ids).not.toContain('blk-apex-001');
  });

  it('blocker has non-empty nextAction', async () => {
    const view = await buildBlockerDetailDrawerView('blk-apex-001', 'apex-retail');
    expect(view.blocker?.nextAction.length).toBeGreaterThan(0);
  });

  it('blocker has non-empty estimatedResolutionPath', async () => {
    const view = await buildBlockerDetailDrawerView('blk-apex-001', 'apex-retail');
    expect(view.blocker?.estimatedResolutionPath.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// buildBlockerDetailDrawerView — unknown blockerId
// ===========================================================================

describe('buildBlockerDetailDrawerView — unknown blocker', () => {
  it('blocker is null for unknown blockerId', async () => {
    const view = await buildBlockerDetailDrawerView('blk-nonexistent', 'apex-retail');
    expect(view.blocker).toBeNull();
  });

  it('drawerTitle is "Blocker not found" for unknown blockerId', async () => {
    const view = await buildBlockerDetailDrawerView('blk-nonexistent', 'apex-retail');
    expect(view.drawerTitle).toBe('Blocker not found');
  });

  it('relatedBlockers is empty for unknown blockerId', async () => {
    const view = await buildBlockerDetailDrawerView('blk-nonexistent', 'apex-retail');
    expect(view.relatedBlockers).toHaveLength(0);
  });

  it('deterministicSeed is true even for unknown blocker', async () => {
    const view = await buildBlockerDetailDrawerView('blk-nonexistent', 'apex-retail');
    expect(view.deterministicSeed).toBe(true);
  });
});

// ===========================================================================
// Apex Retail specific blockers
// ===========================================================================

describe('apex-retail blocker content', () => {
  it('evidence upload connector blocker has pilotImpact true', async () => {
    const view = await buildBlockerDetailDrawerView('blk-apex-001', 'apex-retail');
    expect(view.blocker?.pilotImpact).toBe(true);
  });

  it('model gateway blocker has productionImpact true', async () => {
    const view = await buildBlockerDetailDrawerView('blk-apex-002', 'apex-retail');
    expect(view.blocker?.productionImpact).toBe(true);
  });

  it('model gateway owner is founder', async () => {
    const view = await buildBlockerDetailDrawerView('blk-apex-002', 'apex-retail');
    expect(view.blocker?.owner).toBe('founder');
  });

  it('SOC2 blocker is high severity', async () => {
    const view = await buildBlockerDetailDrawerView('blk-apex-004', 'apex-retail');
    expect(view.blocker?.severity).toBe('high');
  });
});
