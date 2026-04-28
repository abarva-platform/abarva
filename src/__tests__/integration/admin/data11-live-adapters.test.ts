/**
 * DATA11 — Live adapter wiring tests.
 *
 * Verifies:
 * 1. In fixture mode (default), adapters return fixtures normally.
 * 2. In live mode without DB env vars set, requireClientId throws gracefully.
 * 3. mapDbRung mapping is correct.
 * 4. buildAgentContextAsync falls back to base when in fixture mode.
 */

import { mapDbRung } from '@/lib/admin/data/admin-db-helpers';
import { getAdminConnectors } from '@/lib/admin/data/admin-connectors-adapter';
import { getAdminBlockers } from '@/lib/admin/data/admin-blockers-adapter';
import { getAdminAuditEvents } from '@/lib/admin/data/admin-audit-log-adapter';
import { getAdminDatasets } from '@/lib/admin/data/admin-datasets-adapter';
import { getAdminSetupProgress } from '@/lib/admin/data/admin-setup-progress-adapter';
import { buildAgentContextAsync, buildAgentContext } from '@/lib/agent/context-bundle';

// ---------------------------------------------------------------------------
// mapDbRung mapping
// ---------------------------------------------------------------------------

describe('DATA11 — mapDbRung mapping', () => {
  it('maps raw → loaded', () => {
    expect(mapDbRung('raw')).toBe('loaded');
  });
  it('maps verified → available', () => {
    expect(mapDbRung('verified')).toBe('available');
  });
  it('maps blessed → usable', () => {
    expect(mapDbRung('blessed')).toBe('usable');
  });
  it('maps ground_truth → agent_usable', () => {
    expect(mapDbRung('ground_truth')).toBe('agent_usable');
  });
  it('maps audit_trail → decision_grade', () => {
    expect(mapDbRung('audit_trail')).toBe('decision_grade');
  });
  it('falls back to loaded for unknown rung', () => {
    expect(mapDbRung('unknown_rung_value')).toBe('loaded');
  });
});

// ---------------------------------------------------------------------------
// Fixture mode: adapters return data (no throws)
// ---------------------------------------------------------------------------

describe('DATA11 — fixture mode adapter behavior', () => {
  // ADMIN_DATA_MODE defaults to 'fixture' when not set.

  it('getAdminConnectors returns array in fixture mode', async () => {
    const result = await getAdminConnectors('apex-retail');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('getAdminBlockers returns array in fixture mode', async () => {
    const result = await getAdminBlockers('apex-retail');
    expect(Array.isArray(result)).toBe(true);
  });

  it('getAdminAuditEvents returns array in fixture mode', async () => {
    const result = await getAdminAuditEvents('apex-retail');
    expect(Array.isArray(result)).toBe(true);
  });

  it('getAdminDatasets returns array in fixture mode', async () => {
    const result = await getAdminDatasets('apex-retail');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('getAdminSetupProgress returns array in fixture mode', async () => {
    const result = await getAdminSetupProgress('apex-retail');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('connector rows have required fields', async () => {
    const result = await getAdminConnectors('apex-retail');
    const first = result[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('kind');
    expect(first).toHaveProperty('label');
    expect(first).toHaveProperty('status');
    expect(first).toHaveProperty('tenantSlug', 'apex-retail');
  });

  it('blocker rows have required fields', async () => {
    const result = await getAdminBlockers('apex-retail');
    if (result.length === 0) return; // safe — meridian may have no blockers
    const first = result[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('title');
    expect(first).toHaveProperty('severity');
    expect(first).toHaveProperty('status');
    expect(typeof first.pilotImpact).toBe('boolean');
    expect(typeof first.productionImpact).toBe('boolean');
  });

  it('dataset rows have rung values from AdminDatasetRung enum', async () => {
    const validRungs = ['loaded', 'available', 'usable', 'agent_usable', 'decision_grade'];
    const result = await getAdminDatasets('apex-retail');
    for (const row of result) {
      expect(validRungs).toContain(row.rung);
    }
  });
});

// ---------------------------------------------------------------------------
// Live mode: requireClientId throws when no DB env vars are set
// ---------------------------------------------------------------------------

describe('DATA11 — live mode without DB: requireClientId throws gracefully', () => {
  it('requireClientId throws when SUPABASE env vars are missing', async () => {
    // Temporarily force live mode and clear supabase env vars
    const origMode = process.env.ADMIN_DATA_MODE;
    const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const origKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    process.env.ADMIN_DATA_MODE = 'live';
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Reset module cache so getServerSupabase sees the cleared env
    jest.resetModules();

    try {
      const { requireClientId } = await import('@/lib/admin/data/admin-db-helpers');
      await expect(requireClientId('apex-retail')).rejects.toThrow();
    } finally {
      process.env.ADMIN_DATA_MODE = origMode ?? '';
      if (origUrl !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
      if (origKey !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = origKey;
      jest.resetModules();
    }
  });
});

// ---------------------------------------------------------------------------
// buildAgentContextAsync in fixture mode
// ---------------------------------------------------------------------------

describe('DATA11 — buildAgentContextAsync in fixture mode', () => {
  it('returns a Promise', async () => {
    const result = buildAgentContextAsync('apex-retail', 'admin', 'overview');
    expect(result).toBeInstanceOf(Promise);
  });

  it('in fixture mode, returns same shape as buildAgentContext', async () => {
    const sync = buildAgentContext('apex-retail', 'admin', 'overview');
    const async_ = await buildAgentContextAsync('apex-retail', 'admin', 'overview');

    // Shape check: same fields present
    expect(async_.surface).toBe(sync.surface);
    expect(async_.page).toBe(sync.page);
    expect(async_.tenant.slug).toBe(sync.tenant.slug);
    expect(async_.deterministicSeed).toBe(true);
  });

  it('in fixture mode, blockers from async match sync', async () => {
    const sync = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    const async_ = await buildAgentContextAsync('apex-retail', 'admin', 'production-readiness');
    // In fixture mode, async should equal sync
    expect(async_.blockers).toEqual(sync.blockers);
  });

  it('returns evidence shape', async () => {
    const ctx = await buildAgentContextAsync('apex-retail', 'admin', 'data-trust');
    expect(ctx.evidence).toHaveProperty('strength');
    expect(ctx.evidence).toHaveProperty('sources');
    expect(['strong', 'partial', 'thin']).toContain(ctx.evidence.strength);
  });
});
