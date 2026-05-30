/**
 * PR-2613 (P0 follow-up to PR-2606) — verify the admin landing's
 * per-request broker caches log structured warnings when their
 * brokers throw, instead of silently swallowing the error.
 *
 * The pre-PR behavior was `catch { return null }` / `catch { return [] }`
 * with no log — which left founders + ops staff guessing at why the
 * production /admin Trust strip rendered "0 / no data yet" while the
 * masthead pills truthfully showed "14 SEGMENTS LOADED". Now each
 * helper emits a JSON `console.warn` with an event tag, the
 * tenantKey, the error message, and the first three stack frames so
 * Vercel function logs carry enough signal to correlate.
 */

jest.mock('@/lib/admin/setup-data-broker', () => ({
  getSetupInventorySnapshot: jest.fn(),
  getCrossProgramSignals: jest.fn(),
}));

jest.mock('@/lib/admin/broker/trust-spine-broker', () => ({
  getTrustSpine: jest.fn(),
}));

jest.mock('@/lib/programs/approval', () => ({
  getApprovalQueueForTenant: jest.fn(),
}));

import {
  getCrossProgramSignals,
  getSetupInventorySnapshot,
} from '@/lib/admin/setup-data-broker';
import { getTrustSpine } from '@/lib/admin/broker/trust-spine-broker';
import { getApprovalQueueForTenant } from '@/lib/programs/approval';

import {
  cachedApprovalQueue,
  cachedCrossProgramSignals,
  cachedInventorySnapshot,
  cachedTrustSpine,
  logBrokerFailure,
} from '../_cached-helpers';

const mockedInventory = getSetupInventorySnapshot as jest.MockedFunction<
  typeof getSetupInventorySnapshot
>;
const mockedSignals = getCrossProgramSignals as jest.MockedFunction<
  typeof getCrossProgramSignals
>;
const mockedSpine = getTrustSpine as jest.MockedFunction<typeof getTrustSpine>;
const mockedApproval = getApprovalQueueForTenant as jest.MockedFunction<
  typeof getApprovalQueueForTenant
>;

describe('admin/_cached-helpers · structured broker-failure logging', () => {
  // React's `cache()` dedupes calls within a single request. The jest
  // worker is one continuous "request" for the test file, so a unique
  // tenantKey per case is the simplest way to bypass the cache.
  let warnSpy: jest.SpyInstance<void, Parameters<typeof console.warn>>;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockedInventory.mockReset();
    mockedSignals.mockReset();
    mockedSpine.mockReset();
    mockedApproval.mockReset();
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  function parseLastWarn(): {
    event: string;
    tenantKey: string | null;
    error: string;
    stack?: string[];
  } {
    expect(warnSpy).toHaveBeenCalled();
    const arg = warnSpy.mock.calls.at(-1)?.[0];
    expect(typeof arg).toBe('string');
    return JSON.parse(String(arg));
  }

  describe('logBrokerFailure', () => {
    it('emits a single JSON warn with event, tenantKey, error, and a 3-frame stack', () => {
      const err = new Error('pool timeout');
      logBrokerFailure('admin_page.unit_check', 'tenant-x', err);
      const payload = parseLastWarn();
      expect(payload.event).toBe('admin_page.unit_check');
      expect(payload.tenantKey).toBe('tenant-x');
      expect(payload.error).toBe('pool timeout');
      expect(Array.isArray(payload.stack)).toBe(true);
      expect(payload.stack && payload.stack.length).toBeLessThanOrEqual(3);
    });

    it('handles non-Error throws by stringifying them', () => {
      logBrokerFailure('admin_page.unit_check_2', null, 'bare string thrown');
      const payload = parseLastWarn();
      expect(payload.error).toBe('bare string thrown');
      expect(payload.tenantKey).toBeNull();
    });
  });

  describe('cachedInventorySnapshot', () => {
    it('returns null and logs admin_page.cached_inventory_snapshot_failed on throw', async () => {
      mockedInventory.mockRejectedValueOnce(new Error('DB pool exhausted'));
      const result = await cachedInventorySnapshot('tenant-inv-fail-A');
      expect(result).toBeNull();
      const payload = parseLastWarn();
      expect(payload.event).toBe('admin_page.cached_inventory_snapshot_failed');
      expect(payload.tenantKey).toBe('tenant-inv-fail-A');
      expect(payload.error).toBe('DB pool exhausted');
    });

    it('does not log when tenantKey is null (no broker call)', async () => {
      const result = await cachedInventorySnapshot(null);
      expect(result).toBeNull();
      expect(warnSpy).not.toHaveBeenCalled();
      expect(mockedInventory).not.toHaveBeenCalled();
    });
  });

  describe('cachedTrustSpine', () => {
    it('returns null and logs admin_page.cached_trust_spine_failed on throw', async () => {
      mockedInventory.mockResolvedValueOnce(null);
      mockedSpine.mockRejectedValueOnce(new Error('rls denied'));
      const result = await cachedTrustSpine('tenant-spine-fail-A');
      expect(result).toBeNull();
      const payload = parseLastWarn();
      expect(payload.event).toBe('admin_page.cached_trust_spine_failed');
      expect(payload.tenantKey).toBe('tenant-spine-fail-A');
      expect(payload.error).toBe('rls denied');
    });

    it('does not log when tenantKey is null', async () => {
      const result = await cachedTrustSpine(null);
      expect(result).toBeNull();
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('cachedCrossProgramSignals', () => {
    it('returns [] and logs admin_page.cached_cross_program_signals_failed on throw', async () => {
      mockedSignals.mockRejectedValueOnce(new Error('adapter timeout'));
      const result = await cachedCrossProgramSignals('tenant-signals-fail-A');
      expect(result).toEqual([]);
      const payload = parseLastWarn();
      expect(payload.event).toBe(
        'admin_page.cached_cross_program_signals_failed',
      );
      expect(payload.tenantKey).toBe('tenant-signals-fail-A');
      expect(payload.error).toBe('adapter timeout');
    });
  });

  describe('cachedApprovalQueue', () => {
    it('returns [] and logs admin_page.cached_approval_queue_failed on throw', async () => {
      mockedApproval.mockRejectedValueOnce(new Error('approval table missing'));
      const result = await cachedApprovalQueue('client-approval-fail-A');
      expect(result).toEqual([]);
      const payload = parseLastWarn();
      expect(payload.event).toBe('admin_page.cached_approval_queue_failed');
      // approval cache passes the clientKey as the tenantKey field.
      expect(payload.tenantKey).toBe('client-approval-fail-A');
      expect(payload.error).toBe('approval table missing');
    });
  });
});
