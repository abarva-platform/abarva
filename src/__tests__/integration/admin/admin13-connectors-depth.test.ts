/**
 * ADMIN13 — Connectors Depth integration tests
 *
 * Pure TypeScript Jest tests covering:
 *   - Page-view extensions (categories, detail map, actions, tabs)
 *   - Per-connector deterministic detail (config fields, sync attempts, logs)
 *   - Hard-gated affordances disabled with reason
 *   - Component file presence and import wiring
 *   - Visual-lock compliance (no banned hex tokens, no live SDK imports)
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildConnectorsPageView,
  type ConnectorsPageView,
  type ConnectorTab,
  type ConnectorAction,
} from '@/lib/admin/connectors-page-view';
import {
  buildConnectorsReadinessView,
  type ConnectorReadiness,
} from '@/lib/admin/connectors-readiness-view';
import { COLORS } from '@/lib/design/design-tokens';

const root = process.cwd();

const COMPONENT_PATHS = {
  drawer: 'src/components/admin/connectors/ConnectorDetailDrawer.tsx',
  group: 'src/components/admin/connectors/ConnectorCategoryGroup.tsx',
  matrix: 'src/components/admin/connectors/RequirementsMatrix.tsx',
  sparkline: 'src/components/admin/connectors/HealthTrendSparkline.tsx',
  blockerDrilldown: 'src/components/admin/connectors/PilotBlockerDrilldown.tsx',
  actionStrip: 'src/components/admin/connectors/ConnectorsActionStrip.tsx',
  page: 'src/app/(maestro)/admin/connectors/page.tsx',
  pageView: 'src/lib/admin/connectors-page-view.ts',
};

const BANNED_HEX = ['#14B8A6', '#0E9F8C', '#0D9488', '#06B6D4', '#7C3AED', '#A855F7', '#9333EA', '#D946EF', '#EC4899'];

function read(rel: string): string {
  return readFileSync(resolve(root, rel), 'utf8');
}

// ---------------------------------------------------------------------------
// Page-view contract
// ---------------------------------------------------------------------------

describe('ADMIN13 — buildConnectorsPageView contract', () => {
  let view: ConnectorsPageView;

  beforeAll(() => {
    view = buildConnectorsPageView();
  });

  it('keeps deterministicSeed: true', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('exposes a non-empty categories array', () => {
    expect(Array.isArray(view.categories)).toBe(true);
    expect(view.categories.length).toBeGreaterThan(0);
  });

  it('exposes connectorDetailMap as a plain object keyed by connector id', () => {
    expect(typeof view.connectorDetailMap).toBe('object');
    for (const conn of view.connectors) {
      expect(view.connectorDetailMap[conn.id]).toBeDefined();
    }
  });

  it('exposes an actions strip with at least 3 actions', () => {
    expect(view.actions.length).toBeGreaterThanOrEqual(3);
  });

  it('declares 4 canonical tabs in order Health / Requirements / Configuration / Logs', () => {
    const ids: ConnectorTab[] = view.tabs.map((t) => t.id);
    expect(ids).toEqual(['health', 'requirements', 'configuration', 'logs']);
  });

  it('defaultTab is health', () => {
    expect(view.defaultTab).toBe('health');
  });

  it('hardGateReason mentions Wave 27', () => {
    expect(view.hardGateReason).toMatch(/Wave 27/);
  });

  it('total connectors in categories equals view.connectors.length', () => {
    const summed = view.categories.reduce((acc, c) => acc + c.connectors.length, 0);
    expect(summed).toBe(view.connectors.length);
  });

  it('every category has a non-empty label', () => {
    for (const cat of view.categories) {
      expect(typeof cat.label).toBe('string');
      expect(cat.label.length).toBeGreaterThan(0);
    }
  });

  it('every category configuredCount + non-configured equals totalCount', () => {
    for (const cat of view.categories) {
      const configured = cat.connectors.filter((c) => c.status === 'configured_stub').length;
      expect(cat.configuredCount).toBe(configured);
      expect(cat.totalCount).toBe(cat.connectors.length);
    }
  });

  it('category pilotBlockerCount equals connectors that are pilot-required and not configured', () => {
    for (const cat of view.categories) {
      const expected = cat.connectors.filter(
        (c) => c.requiredForPilot && c.status !== 'configured_stub',
      ).length;
      expect(cat.pilotBlockerCount).toBe(expected);
    }
  });
});

// ---------------------------------------------------------------------------
// Per-connector detail
// ---------------------------------------------------------------------------

describe('ADMIN13 — per-connector detail map', () => {
  let view: ConnectorsPageView;

  beforeAll(() => {
    view = buildConnectorsPageView();
  });

  it('every detail has a non-empty vendor', () => {
    for (const conn of view.connectors) {
      const detail = view.connectorDetailMap[conn.id];
      expect(detail.vendor.length).toBeGreaterThan(0);
    }
  });

  it('every detail has a docsHref starting with https://', () => {
    for (const conn of view.connectors) {
      const detail = view.connectorDetailMap[conn.id];
      expect(detail.docsHref.startsWith('https://')).toBe(true);
    }
  });

  it('every detail has at least 1 config field', () => {
    for (const conn of view.connectors) {
      const detail = view.connectorDetailMap[conn.id];
      expect(detail.configFields.length).toBeGreaterThan(0);
    }
  });

  it('secret-typed fields never expose live secret material in maskedValue', () => {
    for (const conn of view.connectors) {
      const detail = view.connectorDetailMap[conn.id];
      for (const field of detail.configFields) {
        if (field.type === 'secret' && field.maskedValue) {
          // The masked value must be entirely bullets — no leaked alphanumerics.
          expect(field.maskedValue).toMatch(/^[•]+$/);
        }
      }
    }
  });

  it('lastSyncAttempt has a parseable ISO timestamp', () => {
    for (const conn of view.connectors) {
      const detail = view.connectorDetailMap[conn.id];
      const t = Date.parse(detail.lastSyncAttempt.occurredAt);
      expect(Number.isNaN(t)).toBe(false);
    }
  });

  it('healthTrend has exactly 24 points', () => {
    for (const conn of view.connectors) {
      const detail = view.connectorDetailMap[conn.id];
      expect(detail.healthTrend.length).toBe(24);
    }
  });

  it('healthTrend points are clamped to 0–100', () => {
    for (const conn of view.connectors) {
      const detail = view.connectorDetailMap[conn.id];
      for (const p of detail.healthTrend) {
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(100);
      }
    }
  });

  it('healthTrend is deterministic across calls', () => {
    const a = buildConnectorsPageView();
    const b = buildConnectorsPageView();
    for (const conn of a.connectors) {
      expect(b.connectorDetailMap[conn.id].healthTrend).toEqual(
        a.connectorDetailMap[conn.id].healthTrend,
      );
    }
  });

  it('requirements reference at least one canonical surface per connector with detail', () => {
    for (const conn of view.connectors) {
      const detail = view.connectorDetailMap[conn.id];
      expect(detail.requirements.length).toBeGreaterThanOrEqual(1);
      for (const r of detail.requirements) {
        expect(r.surface.length).toBeGreaterThan(0);
      }
    }
  });

  it('error log timestamps are unique within a connector', () => {
    for (const conn of view.connectors) {
      const detail = view.connectorDetailMap[conn.id];
      const stamps = detail.errorLog.map((e) => e.timestamp);
      const set = new Set(stamps);
      expect(set.size).toBe(stamps.length);
    }
  });

  it('recentAttempts contain only known outcomes', () => {
    const allowed = new Set(['success_stub', 'failure', 'skipped', 'pending']);
    for (const conn of view.connectors) {
      const detail = view.connectorDetailMap[conn.id];
      for (const a of detail.recentAttempts) {
        expect(allowed.has(a.outcome)).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Actions strip
// ---------------------------------------------------------------------------

describe('ADMIN13 — action strip', () => {
  let view: ConnectorsPageView;
  beforeAll(() => {
    view = buildConnectorsPageView();
  });

  it('Add connector action is blocked with hard-gate reason', () => {
    const add = view.actions.find((a) => a.id === 'add-connector') as ConnectorAction;
    expect(add).toBeDefined();
    expect(add.status).toBe('blocked');
    expect(add.reason).toMatch(/Wave 27/);
  });

  it('Test all connections is blocked', () => {
    const test = view.actions.find((a) => a.id === 'test-all') as ConnectorAction;
    expect(test).toBeDefined();
    expect(test.status).toBe('blocked');
  });

  it('Export config is available (safe)', () => {
    const exp = view.actions.find((a) => a.id === 'export-config') as ConnectorAction;
    expect(exp).toBeDefined();
    expect(exp.status).toBe('available');
    expect(exp.reason).toBeNull();
  });

  it('blocked actions all share the same hard-gate reason text', () => {
    const blocked = view.actions.filter((a) => a.status === 'blocked');
    for (const b of blocked) {
      expect(b.reason).toBe(view.hardGateReason);
    }
  });
});

// ---------------------------------------------------------------------------
// Pilot blockers integrity
// ---------------------------------------------------------------------------

describe('ADMIN13 — pilot blockers stay consistent with W32D readiness', () => {
  it('pilotBlockers list matches readiness view', () => {
    const pageView = buildConnectorsPageView();
    const readiness = buildConnectorsReadinessView('apex-retail');
    expect(pageView.pilotBlockers.map((c: ConnectorReadiness) => c.id)).toEqual(
      readiness.pilotBlockers.map((c: ConnectorReadiness) => c.id),
    );
  });

  it('every pilot blocker has detail in the detail map', () => {
    const pageView = buildConnectorsPageView();
    for (const b of pageView.pilotBlockers) {
      expect(pageView.connectorDetailMap[b.id]).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// File presence + visual lock
// ---------------------------------------------------------------------------

describe('ADMIN13 — required component files exist', () => {
  for (const [name, path] of Object.entries(COMPONENT_PATHS)) {
    it(`${name} file exists at ${path}`, () => {
      expect(existsSync(resolve(root, path))).toBe(true);
    });
  }
});

describe('ADMIN13 — visual lock: no banned hex literals', () => {
  for (const [name, path] of Object.entries(COMPONENT_PATHS)) {
    it(`${name} contains no banned hex tokens`, () => {
      const src = read(path);
      for (const banned of BANNED_HEX) {
        expect(src.toLowerCase()).not.toContain(banned.toLowerCase());
      }
    });
  }
});

describe('ADMIN13 — drawer + group + matrix + sparkline import design tokens', () => {
  const tokenConsumers = [
    COMPONENT_PATHS.drawer,
    COMPONENT_PATHS.group,
    COMPONENT_PATHS.matrix,
    COMPONENT_PATHS.sparkline,
    COMPONENT_PATHS.blockerDrilldown,
    COMPONENT_PATHS.actionStrip,
  ];
  for (const path of tokenConsumers) {
    it(`${path} imports COLORS from design-tokens`, () => {
      const src = read(path);
      expect(src).toMatch(/from '@\/lib\/design\/design-tokens'/);
    });
  }
});

describe('ADMIN13 — page wires all new sub-components', () => {
  let pageSrc: string;
  beforeAll(() => {
    pageSrc = read(COMPONENT_PATHS.page);
  });

  it('imports ConnectorsActionStrip', () => {
    expect(pageSrc).toContain('ConnectorsActionStrip');
  });
  it('imports ConnectorCategoryGroup', () => {
    expect(pageSrc).toContain('ConnectorCategoryGroup');
  });
  it('imports ConnectorDetailDrawer', () => {
    expect(pageSrc).toContain('ConnectorDetailDrawer');
  });
  it('imports PilotBlockerDrilldown', () => {
    expect(pageSrc).toContain('PilotBlockerDrilldown');
  });
  it('imports RequirementsMatrix', () => {
    expect(pageSrc).toContain('RequirementsMatrix');
  });
  it('reads searchParams for connector / tab / blockers', () => {
    expect(pageSrc).toContain('searchParams');
    expect(pageSrc).toMatch(/connector\??:/);
    expect(pageSrc).toMatch(/tab\??:/);
    expect(pageSrc).toMatch(/blockers\??:/);
  });
  it('still imports AdminCanonShellV2 + EditorialCanvas + AgentRail (visual lock)', () => {
    expect(pageSrc).toContain('AdminCanonShellV2');
    expect(pageSrc).toContain('EditorialCanvas');
    expect(pageSrc).toContain('AgentRail');
  });
});

// ---------------------------------------------------------------------------
// Hard gating — no live SDK imports inside drawer/components
// ---------------------------------------------------------------------------

describe('ADMIN13 — hard-gated: no live SDK imports inside connectors components', () => {
  const banned = ['@clerk/nextjs', '@supabase/supabase-js', '@vercel/postgres', '@pinecone-database/pinecone'];
  const componentFiles = [
    COMPONENT_PATHS.drawer,
    COMPONENT_PATHS.group,
    COMPONENT_PATHS.matrix,
    COMPONENT_PATHS.sparkline,
    COMPONENT_PATHS.blockerDrilldown,
    COMPONENT_PATHS.actionStrip,
  ];
  for (const path of componentFiles) {
    it(`${path} does not import live connector SDKs`, () => {
      const src = read(path);
      for (const b of banned) {
        expect(src).not.toContain(b);
      }
    });
  }
});

describe('ADMIN13 — drawer renders disabled buttons with hard-gate reason', () => {
  it('drawer source contains Test connection / Configure / Remove labels', () => {
    const src = read(COMPONENT_PATHS.drawer);
    expect(src).toContain('Test connection');
    expect(src).toContain('Configure');
    expect(src).toContain('Remove');
  });
  it('drawer disables stub buttons via the disabled attribute', () => {
    const src = read(COMPONENT_PATHS.drawer);
    expect(src).toMatch(/disabled\b/);
    expect(src).toContain('aria-disabled="true"');
  });
  it('drawer surfaces hardGateReason text', () => {
    const src = read(COMPONENT_PATHS.drawer);
    expect(src).toContain('hardGateReason');
  });
});

describe('ADMIN13 — action strip renders blocked buttons with reason', () => {
  it('action strip uses disabled + aria-disabled for blocked actions', () => {
    const src = read(COMPONENT_PATHS.actionStrip);
    expect(src).toMatch(/disabled\b/);
    expect(src).toContain('aria-disabled="true"');
  });
  it('action strip differentiates blocked vs available with data-status', () => {
    const src = read(COMPONENT_PATHS.actionStrip);
    expect(src).toContain('data-status="blocked"');
    expect(src).toContain('data-status="available"');
  });
});

describe('ADMIN13 — design token sanity for the COLORS export used here', () => {
  it('COLORS.navy exists and is the canonical AbarVa navy', () => {
    expect(COLORS.navy.toLowerCase()).toBe('#0b4a91');
  });
  it('COLORS.coralSoft exists', () => {
    expect(COLORS.coralSoft).toBeDefined();
  });
});
