/**
 * Unit tests for the Source sub-nav active-tab resolver.
 *
 * The Source surface gained a Snowflake-style secondary nav strip
 * (Queue / Events / Portfolio) after the redesign that made `/source`
 * redirect straight to `/source/queue` orphaned the events portfolio at
 * `/source/events`. `resolveActiveSourceTab` decides which tab lights up
 * for a given pathname.
 *
 * Pure-function tests — no browser, no router. They lock the rule:
 *  - a tab is active when the pathname starts with its href
 *  - detail routes keep their parent tab lit
 *  - renewal cockpit routes (and any unmatched Source path) fall back to Queue
 */

import {
  resolveActiveSourceTab,
  SOURCE_SUBNAV_TABS,
} from '@/components/source/SourceSubNav';

// ── Exact top-level routes ───────────────────────────────────────────────────

describe('exact top-level Source routes resolve to their own tab', () => {
  test('/source/queue → queue', () => {
    expect(resolveActiveSourceTab('/source/queue')).toBe('queue');
  });
  test('/source/events → events', () => {
    expect(resolveActiveSourceTab('/source/events')).toBe('events');
  });
  test('/source/portfolio → portfolio', () => {
    expect(resolveActiveSourceTab('/source/portfolio')).toBe('portfolio');
  });
});

// ── Detail routes keep the parent tab lit ────────────────────────────────────

describe('detail routes keep their parent tab active', () => {
  test('/source/events/[eventId] → events', () => {
    expect(resolveActiveSourceTab('/source/events/evt-ams-001')).toBe('events');
  });
  test('/source/events/[eventId]/scorecard → events', () => {
    expect(resolveActiveSourceTab('/source/events/evt-ams-001/scorecard')).toBe(
      'events',
    );
  });
  test('/source/events/[eventId]/artifacts/[artifactId] → events', () => {
    expect(
      resolveActiveSourceTab('/source/events/evt-ams-001/artifacts/art-7'),
    ).toBe('events');
  });
  test('/source/events/[eventId]/vendors/[vendorId] → events', () => {
    expect(
      resolveActiveSourceTab('/source/events/evt-ams-001/vendors/v-2'),
    ).toBe('events');
  });
});

// ── Renewal cockpit routes fall back to Queue ────────────────────────────────

describe('renewal cockpit routes fall back to the Queue tab', () => {
  test('/source/renewal/[contractId] → queue', () => {
    expect(resolveActiveSourceTab('/source/renewal/contract-9')).toBe('queue');
  });
  test('/source/renewal/[contractId]/execution → queue', () => {
    expect(
      resolveActiveSourceTab('/source/renewal/contract-9/execution'),
    ).toBe('queue');
  });
});

// ── Unmatched Source paths fall back to Queue ────────────────────────────────

describe('unmatched Source paths fall back to the Queue tab', () => {
  test.each([
    '/source',
    '/source/value',
    '/source/new',
    '/source/compare',
    '/source/patterns',
    '/source/patterns/PAT-SRC-AMS-001',
    '/source/learn',
  ])('%s → queue', (path) => {
    expect(resolveActiveSourceTab(path)).toBe('queue');
  });

  test('null / undefined pathname → queue', () => {
    expect(resolveActiveSourceTab(null)).toBe('queue');
    expect(resolveActiveSourceTab(undefined)).toBe('queue');
    expect(resolveActiveSourceTab('')).toBe('queue');
  });
});

// ── No false-prefix matches ──────────────────────────────────────────────────

describe('a tab href is not matched as a bare string prefix', () => {
  // `/source/events-archive` must NOT light "Events" — only `/source/events`
  // and `/source/events/...` may.
  test('/source/events-archive → queue (not events)', () => {
    expect(resolveActiveSourceTab('/source/events-archive')).toBe('queue');
  });
  test('/source/queue-legacy → queue is exact, suffix does not match', () => {
    // `/source/queue-legacy` does not start with `/source/queue/`, so it
    // falls back rather than matching the Queue tab by accident.
    expect(resolveActiveSourceTab('/source/queue-legacy')).toBe('queue');
  });
});

// ── Tab catalogue invariants ─────────────────────────────────────────────────

describe('SOURCE_SUBNAV_TABS catalogue', () => {
  test('exposes exactly the three canonical tabs in order', () => {
    expect(SOURCE_SUBNAV_TABS.map((t) => t.key)).toEqual([
      'queue',
      'events',
      'portfolio',
    ]);
  });

  test('every tab href is under /source/', () => {
    for (const tab of SOURCE_SUBNAV_TABS) {
      expect(tab.href.startsWith('/source/')).toBe(true);
    }
  });

  test('does NOT include a Renewals tab (renewals have no index route)', () => {
    expect(
      SOURCE_SUBNAV_TABS.some(
        (t) => t.key === 'renewals' || t.href.includes('renewal'),
      ),
    ).toBe(false);
  });

  test('every tab resolves to itself for its own href', () => {
    for (const tab of SOURCE_SUBNAV_TABS) {
      expect(resolveActiveSourceTab(tab.href)).toBe(tab.key);
    }
  });
});
