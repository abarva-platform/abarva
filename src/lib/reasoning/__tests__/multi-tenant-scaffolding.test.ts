/**
 * Multi-tenant scaffolding tests.
 *
 * Deterministic: no network, no LLM calls, no randomness. Pins the contract
 * for the `tenantId` field that was added to instances, telemetry events and
 * derived risk/alert rows. Tenancy is not enforced yet — these tests verify
 * the scaffolding (default tenant, optional filters, back-compat).
 *
 * Coverage:
 *   1. Every fixture instance carries `tenantId === 'apex-retail'`
 *   2. `getAllInstanceIds()` filters by tenantId, defaults to all
 *   3. `resolveAnyInstance()` filters by tenantId, defaults to global lookup
 *   4. `recordSynthesisEvent` defaults `tenantId` to `'apex-retail'`
 *   5. `recordSynthesisEvent` honours an explicit tenantId
 *   6. `recordCascadeEvent` defaults + filters by tenantId
 *   7. `buildPortfolioAlerts` and `buildPortfolioRiskRegister` propagate
 *      and filter by tenantId
 */

import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import {
  getAllInstanceIds,
  resolveAnyInstance,
} from '@/lib/reasoning/instance-resolver';
import {
  recordSynthesisEvent,
  getRecentSynthesisEvents,
  _resetForTests as resetSynthesis,
  type SynthesisTelemetryInput,
} from '@/lib/reasoning/synthesis-telemetry';
import {
  recordCascadeEvent,
  getRecentCascadeEvents,
  _resetForTests as resetCascade,
  type CascadeTelemetryInput,
} from '@/lib/reasoning/cascade-telemetry';
import { buildPortfolioAlerts } from '@/lib/reasoning/portfolio-alerts';
import { buildPortfolioRiskRegister } from '@/lib/reasoning/risk-register';

const baseSynthesisInput: SynthesisTelemetryInput = {
  surface: 'source',
  instanceId: 'apex-retail-ams-outsourcing-2026',
  patternId: 'PAT-SRC-AMS-001',
  cacheHit: false,
  latencyMs: 100,
  citationCount: 0,
  contradictionCount: 0,
  failureModeCount: 0,
  gateCount: 0,
};

const baseCascadeInput: CascadeTelemetryInput = {
  sourceInstanceId: 'apex-retail-ams-outsourcing-2026',
  targetInstanceId: 'APX-CDP-2026',
  linkType: 'depends-on',
  severity: 'high',
  buildContext: 'source-synthesis',
};

beforeEach(() => {
  resetSynthesis();
  resetCascade();
});

describe('multi-tenant scaffolding · instance fixtures', () => {
  it('every source-event fixture carries tenantId=apex-retail', () => {
    expect(SOURCE_EVENT_INSTANCES.length).toBeGreaterThan(0);
    for (const instance of SOURCE_EVENT_INSTANCES) {
      expect(instance.tenantId).toBe('apex-retail');
    }
  });

  it('every program fixture carries tenantId=apex-retail', () => {
    expect(APEX_RETAIL_PROGRAM_INSTANCES.length).toBeGreaterThan(0);
    for (const instance of APEX_RETAIL_PROGRAM_INSTANCES) {
      expect(instance.tenantId).toBe('apex-retail');
    }
  });
});

describe('multi-tenant scaffolding · instance-resolver', () => {
  it('getAllInstanceIds() returns every id when no tenantId filter is set', () => {
    const all = getAllInstanceIds();
    expect(all.sourceEvents.length).toBe(SOURCE_EVENT_INSTANCES.length);
    expect(all.programs.length).toBe(APEX_RETAIL_PROGRAM_INSTANCES.length);
  });

  it('getAllInstanceIds({ tenantId: "apex-retail" }) matches the unfiltered result', () => {
    const filtered = getAllInstanceIds({ tenantId: 'apex-retail' });
    const all = getAllInstanceIds();
    expect(filtered.sourceEvents).toEqual(all.sourceEvents);
    expect(filtered.programs).toEqual(all.programs);
  });

  it('getAllInstanceIds({ tenantId: "other-tenant" }) returns empty arrays', () => {
    const filtered = getAllInstanceIds({ tenantId: 'other-tenant' });
    expect(filtered.sourceEvents).toEqual([]);
    expect(filtered.programs).toEqual([]);
  });

  it('resolveAnyInstance respects the tenantId filter', () => {
    // Match: in-tenant lookup resolves
    const match = resolveAnyInstance('APX-CDP-2026', { tenantId: 'apex-retail' });
    expect(match?.kind).toBe('program');

    // Mismatch: out-of-tenant lookup returns null even though id exists
    const miss = resolveAnyInstance('APX-CDP-2026', { tenantId: 'other-tenant' });
    expect(miss).toBeNull();

    // Default (no options): back-compat global lookup still works
    const fallback = resolveAnyInstance('APX-CDP-2026');
    expect(fallback?.kind).toBe('program');
  });
});

describe('multi-tenant scaffolding · synthesis telemetry', () => {
  it('recordSynthesisEvent defaults tenantId to apex-retail when not supplied', () => {
    const event = recordSynthesisEvent(baseSynthesisInput);
    expect(event.tenantId).toBe('apex-retail');
  });

  it('recordSynthesisEvent honours an explicit tenantId on the input', () => {
    const event = recordSynthesisEvent({
      ...baseSynthesisInput,
      tenantId: 'meridian',
    });
    expect(event.tenantId).toBe('meridian');
  });

  it('getRecentSynthesisEvents filters by tenantId when provided', () => {
    recordSynthesisEvent({ ...baseSynthesisInput }); // apex-retail (default)
    recordSynthesisEvent({ ...baseSynthesisInput, tenantId: 'meridian' });
    recordSynthesisEvent({ ...baseSynthesisInput, tenantId: 'meridian' });

    const apex = getRecentSynthesisEvents(undefined, { tenantId: 'apex-retail' });
    const meridian = getRecentSynthesisEvents(undefined, { tenantId: 'meridian' });
    const all = getRecentSynthesisEvents();

    expect(apex.length).toBe(1);
    expect(meridian.length).toBe(2);
    expect(all.length).toBe(3);
    expect(apex.every((e) => e.tenantId === 'apex-retail')).toBe(true);
    expect(meridian.every((e) => e.tenantId === 'meridian')).toBe(true);
  });
});

describe('multi-tenant scaffolding · cascade telemetry', () => {
  it('recordCascadeEvent defaults tenantId to apex-retail when not supplied', () => {
    const event = recordCascadeEvent(baseCascadeInput);
    expect(event.tenantId).toBe('apex-retail');
  });

  it('getRecentCascadeEvents filters by tenantId when provided', () => {
    recordCascadeEvent({ ...baseCascadeInput });
    recordCascadeEvent({ ...baseCascadeInput, tenantId: 'meridian' });

    const apex = getRecentCascadeEvents(undefined, { tenantId: 'apex-retail' });
    const meridian = getRecentCascadeEvents(undefined, { tenantId: 'meridian' });

    expect(apex.length).toBe(1);
    expect(apex[0].tenantId).toBe('apex-retail');
    expect(meridian.length).toBe(1);
    expect(meridian[0].tenantId).toBe('meridian');
  });
});

describe('multi-tenant scaffolding · derived rows', () => {
  it('buildPortfolioAlerts stamps every alert with the source instance tenantId', () => {
    const alerts = buildPortfolioAlerts();
    // Every alert traces back to a fixture instance — all stay on apex-retail.
    for (const alert of alerts) {
      expect(alert.tenantId).toBe('apex-retail');
    }
  });

  it('buildPortfolioAlerts({ tenantId }) drops alerts outside the requested tenant', () => {
    const apex = buildPortfolioAlerts({ tenantId: 'apex-retail' });
    const other = buildPortfolioAlerts({ tenantId: 'other-tenant' });
    const all = buildPortfolioAlerts();

    expect(apex.length).toBe(all.length);
    expect(other).toEqual([]);
  });

  it('buildPortfolioRiskRegister stamps every row with the source instance tenantId', () => {
    const rows = buildPortfolioRiskRegister();
    for (const row of rows) {
      expect(row.tenantId).toBe('apex-retail');
    }
  });

  it('buildPortfolioRiskRegister({ tenantId }) drops rows outside the requested tenant', () => {
    const all = buildPortfolioRiskRegister();
    const apex = buildPortfolioRiskRegister({ tenantId: 'apex-retail' });
    const other = buildPortfolioRiskRegister({ tenantId: 'other-tenant' });

    expect(apex.length).toBe(all.length);
    expect(other).toEqual([]);
  });
});
