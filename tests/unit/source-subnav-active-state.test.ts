/**
 * Unit tests for the Source sub-nav active-tab resolver and tab catalogue,
 * across both information-architecture states.
 *
 * IA v2 (audit 2026-06-03, Tier 1, default ON) consolidates Source around
 * Decisions (the Queue) + Approvals + Portfolio + Capabilities + Setup —
 * folding the standalone Events surface into Portfolio while keeping artifact
 * operations and capability storytelling discoverable.
 * `NEXT_PUBLIC_SOURCE_IA_V2=0` restores the legacy
 * three-tab IA (Queue / Events / Portfolio). These pure-function tests lock
 * both states. `resolveActiveSourceTab` and `activeSourceSubNavTabs` read the
 * flag at call time, so each block sets the env explicitly.
 */

import {
  resolveActiveSourceTab,
  activeSourceSubNavTabs,
  SOURCE_SUBNAV_TABS,
  SOURCE_SUBNAV_TABS_V2,
} from '@/components/source/SourceSubNav';

const FLAG = 'NEXT_PUBLIC_SOURCE_IA_V2';
const original = process.env[FLAG];
afterAll(() => {
  if (original === undefined) delete process.env[FLAG];
  else process.env[FLAG] = original;
});

// ── IA v2 (default — flag unset or on) ───────────────────────────────────────

describe('IA v2 (default) — operating surfaces', () => {
  beforeEach(() => {
    delete process.env[FLAG]; // unset ⇒ default ON
  });

  test('catalogue is exactly Decisions + Approvals + Portfolio + Capabilities + Setup, in order', () => {
    expect(activeSourceSubNavTabs().map((t) => t.key)).toEqual([
      'queue',
      'approvals',
      'portfolio',
      'capabilities',
      'setup',
    ]);
    expect(activeSourceSubNavTabs().map((t) => t.label)).toEqual([
      'Decisions',
      'Approvals',
      'Portfolio',
      'Capabilities',
      'Setup',
    ]);
  });

  test('the Queue tab is labelled "Decisions"', () => {
    expect(SOURCE_SUBNAV_TABS_V2.find((t) => t.key === 'queue')?.label).toBe('Decisions');
  });

  test('/source/queue → queue (Decisions)', () => {
    expect(resolveActiveSourceTab('/source/queue')).toBe('queue');
  });

  test('/source/portfolio → portfolio', () => {
    expect(resolveActiveSourceTab('/source/portfolio')).toBe('portfolio');
  });

  test('/source/capabilities → capabilities', () => {
    expect(resolveActiveSourceTab('/source/capabilities')).toBe('capabilities');
  });

  test('/source/setup → setup', () => {
    expect(resolveActiveSourceTab('/source/setup')).toBe('setup');
  });

  test('Events paths fold into Portfolio', () => {
    expect(resolveActiveSourceTab('/source/events')).toBe('portfolio');
    expect(resolveActiveSourceTab('/source/events/evt-ams-001')).toBe('portfolio');
    expect(resolveActiveSourceTab('/source/events/evt-ams-001/scorecard')).toBe('portfolio');
    expect(resolveActiveSourceTab('/source/events/evt-ams-001/vendors/v-2')).toBe('portfolio');
  });

  test('renewal + unmatched Source paths fall back to Decisions (queue)', () => {
    for (const p of ['/source/renewal/contract-9', '/source/new', '/source/value', '/source/compare', '/source']) {
      expect(resolveActiveSourceTab(p)).toBe('queue');
    }
  });

  test('no false-prefix match — only exact /source/events(/...) folds to Portfolio', () => {
    // `/source/events-archive` is not the Events index nor a child route, so it
    // does not fold; it falls back to Decisions.
    expect(resolveActiveSourceTab('/source/events-archive')).toBe('queue');
    expect(resolveActiveSourceTab('/source/queue-legacy')).toBe('queue');
  });
});

// ── IA v1 (legacy — flag explicitly off) ─────────────────────────────────────

describe('IA v1 (NEXT_PUBLIC_SOURCE_IA_V2=0) — legacy three tabs', () => {
  beforeEach(() => {
    process.env[FLAG] = '0';
  });

  test('catalogue is the canonical tabs in order', () => {
    expect(SOURCE_SUBNAV_TABS.map((t) => t.key)).toEqual([
      'queue',
      'events',
      'capabilities',
      'portfolio',
    ]);
    expect(activeSourceSubNavTabs().map((t) => t.key)).toEqual([
      'queue',
      'events',
      'capabilities',
      'portfolio',
    ]);
  });

  test('exact top-level routes resolve to their own tab', () => {
    expect(resolveActiveSourceTab('/source/queue')).toBe('queue');
    expect(resolveActiveSourceTab('/source/events')).toBe('events');
    expect(resolveActiveSourceTab('/source/capabilities')).toBe('capabilities');
    expect(resolveActiveSourceTab('/source/portfolio')).toBe('portfolio');
  });

  test('detail routes keep the Events tab lit', () => {
    expect(resolveActiveSourceTab('/source/events/evt-ams-001')).toBe('events');
    expect(resolveActiveSourceTab('/source/events/evt-ams-001/scorecard')).toBe('events');
    expect(resolveActiveSourceTab('/source/events/evt-ams-001/vendors/v-2')).toBe('events');
  });

  test('renewal + unmatched paths fall back to Queue', () => {
    expect(resolveActiveSourceTab('/source/renewal/contract-9')).toBe('queue');
    expect(resolveActiveSourceTab('/source/new')).toBe('queue');
    expect(resolveActiveSourceTab(null)).toBe('queue');
  });

  test('no false-prefix match', () => {
    expect(resolveActiveSourceTab('/source/events-archive')).toBe('queue');
    expect(resolveActiveSourceTab('/source/queue-legacy')).toBe('queue');
  });
});

// ── Invariants across both states ────────────────────────────────────────────

describe('catalogue invariants (both IA states)', () => {
  test('every tab href is under /source/ and no Renewals tab', () => {
    for (const set of [SOURCE_SUBNAV_TABS, SOURCE_SUBNAV_TABS_V2]) {
      for (const tab of set) {
        expect(tab.href.startsWith('/source/')).toBe(true);
        expect(tab.href.includes('renewal')).toBe(false);
      }
    }
  });
});
