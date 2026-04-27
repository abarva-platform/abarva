/**
 * ADMIN15 — Build Progress Depth integration tests
 *
 * Pure TypeScript Jest tests covering:
 *   - Page-view extensions (waves, slicesIndex, ciSnapshot, tabs, actionStrip)
 *   - Build-waves.json + build-slices.json manifest reads (deterministic)
 *   - Slice drilldown helper (findSliceDetail)
 *   - Hard-gated affordances disabled with reason
 *   - Component file presence and import wiring
 *   - Visual-lock compliance (no banned hex tokens, no live CI/SDK imports)
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildBuildProgressPageView,
  type BuildProgressPageView,
  type BuildProgressTab,
} from '@/lib/admin/build-progress-page-view';
import { COLORS } from '@/lib/design/design-tokens';

const root = process.cwd();

const COMPONENT_PATHS = {
  waveTimeline: 'src/components/admin/build-progress/WaveTimeline.tsx',
  sliceTable: 'src/components/admin/build-progress/SliceTable.tsx',
  sliceDrawer: 'src/components/admin/build-progress/SliceDetailDrawer.tsx',
  ciMini: 'src/components/admin/build-progress/CIMiniStrip.tsx',
  backlog: 'src/components/admin/build-progress/BacklogPreview.tsx',
  page: 'src/app/(maestro)/admin/build-progress/page.tsx',
  pageView: 'src/lib/admin/build-progress-page-view.ts',
};

const BANNED_HEX = [
  '#14B8A6',
  '#0E9F8C',
  '#0D9488',
  '#06B6D4',
  '#7C3AED',
  '#A855F7',
  '#9333EA',
  '#D946EF',
  '#EC4899',
];

function read(rel: string): string {
  return readFileSync(resolve(root, rel), 'utf8');
}

// ---------------------------------------------------------------------------
// Page-view contract
// ---------------------------------------------------------------------------

describe('ADMIN15 — buildBuildProgressPageView contract', () => {
  let view: BuildProgressPageView;

  beforeAll(() => {
    view = buildBuildProgressPageView();
  });

  it('keeps deterministicSeed: true', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('exposes a non-empty waves array', () => {
    expect(Array.isArray(view.waves)).toBe(true);
    expect(view.waves.length).toBeGreaterThan(0);
  });

  it('exposes waveDetailMap keyed by wave id', () => {
    expect(typeof view.waveDetailMap).toBe('object');
    for (const w of view.waves) {
      expect(view.waveDetailMap[w.id]).toBeDefined();
    }
  });

  it('exposes a non-empty slicesIndex', () => {
    expect(Array.isArray(view.slicesIndex)).toBe(true);
    expect(view.slicesIndex.length).toBeGreaterThan(0);
  });

  it('every slice has a non-empty id and title', () => {
    for (const s of view.slicesIndex) {
      expect(typeof s.id).toBe('string');
      expect(s.id.length).toBeGreaterThan(0);
      expect(typeof s.title).toBe('string');
      expect(s.title.length).toBeGreaterThan(0);
    }
  });

  it('exposes slicesByWave map; sum of slice counts <= total slices', () => {
    expect(typeof view.slicesByWave).toBe('object');
    let total = 0;
    for (const list of Object.values(view.slicesByWave)) {
      total += list.length;
    }
    expect(total).toBe(view.slicesIndex.length);
  });

  it('declares 4 canonical tabs in order Waves / Slices / CI Status / Backlog', () => {
    const ids: BuildProgressTab[] = view.tabs.map((t) => t.id);
    expect(ids).toEqual(['waves', 'slices', 'ci', 'backlog']);
  });

  it('defaultTab is waves', () => {
    expect(view.defaultTab).toBe('waves');
  });

  it('hardGateReason mentions Wave 27', () => {
    expect(view.hardGateReason).toMatch(/Wave 27/);
  });

  it('exposes an action strip with at least 4 actions', () => {
    expect(view.actionStrip.length).toBeGreaterThanOrEqual(4);
  });

  it('action strip includes Open next wave runner action (available)', () => {
    const a = view.actionStrip.find((x) => x.id === 'open-next-wave-runner');
    expect(a).toBeDefined();
    expect(a?.status).toBe('available');
  });

  it('action strip includes View build manifest action (available)', () => {
    const a = view.actionStrip.find((x) => x.id === 'view-build-manifest');
    expect(a).toBeDefined();
    expect(a?.status).toBe('available');
  });

  it('action strip includes Trigger CI run action (blocked)', () => {
    const a = view.actionStrip.find((x) => x.id === 'trigger-ci-run');
    expect(a).toBeDefined();
    expect(a?.status).toBe('blocked');
    expect(a?.reason).toMatch(/Wave 27/);
  });

  it('action strip includes Restart failed step action (blocked)', () => {
    const a = view.actionStrip.find((x) => x.id === 'restart-failed-step');
    expect(a).toBeDefined();
    expect(a?.status).toBe('blocked');
    expect(a?.reason).toMatch(/Wave 27/);
  });

  it('exposes editorial title and body', () => {
    expect(view.editorial.title.length).toBeGreaterThan(0);
    expect(view.editorial.body.length).toBeGreaterThan(0);
  });

  it('context bar declares Setup/Admin mode and deferred liveStatus', () => {
    expect(view.context.mode).toBe('Setup/Admin');
    expect(view.context.liveStatusKind).toBe('deferred');
  });

  it('slicesShipped + outstanding equals slicesPlanned (slicesIndex length)', () => {
    expect(view.slicesPlanned).toBe(view.slicesIndex.length);
    expect(view.slicesShipped).toBeGreaterThanOrEqual(0);
    expect(view.slicesShipped).toBeLessThanOrEqual(view.slicesPlanned);
  });
});

// ---------------------------------------------------------------------------
// CI snapshot
// ---------------------------------------------------------------------------

describe('ADMIN15 — CI snapshot is deterministic and exactly 5 rows', () => {
  let view: BuildProgressPageView;
  beforeAll(() => {
    view = buildBuildProgressPageView();
  });

  it('exposes exactly 5 CI runs', () => {
    expect(view.ciSnapshot.length).toBe(5);
  });

  it('every CI run has a parseable ISO completedAt', () => {
    for (const r of view.ciSnapshot) {
      expect(Number.isNaN(Date.parse(r.completedAt))).toBe(false);
    }
  });

  it('every CI run status is pass | fail | running', () => {
    for (const r of view.ciSnapshot) {
      expect(['pass', 'fail', 'running']).toContain(r.status);
    }
  });

  it('CI snapshot is stable across calls', () => {
    const a = buildBuildProgressPageView();
    const b = buildBuildProgressPageView();
    expect(a.ciSnapshot).toEqual(b.ciSnapshot);
  });

  it('CI durations are positive integers', () => {
    for (const r of view.ciSnapshot) {
      expect(Number.isInteger(r.durationSec)).toBe(true);
      expect(r.durationSec).toBeGreaterThan(0);
    }
  });

  it('every CI run has a non-empty branch and commit sha', () => {
    for (const r of view.ciSnapshot) {
      expect(r.branch.length).toBeGreaterThan(0);
      expect(r.commitSha.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Slice drilldown
// ---------------------------------------------------------------------------

describe('ADMIN15 — findSliceDetail helper', () => {
  let view: BuildProgressPageView;
  beforeAll(() => {
    view = buildBuildProgressPageView();
  });

  it('returns null for unknown slice id', () => {
    expect(view.findSliceDetail('this-slice-does-not-exist-xyz')).toBeNull();
  });

  it('returns a detail for every known slice in slicesIndex', () => {
    for (const s of view.slicesIndex.slice(0, 12)) {
      const detail = view.findSliceDetail(s.id);
      expect(detail).not.toBeNull();
      expect(detail?.id).toBe(s.id);
      expect(detail?.branch.startsWith('wave/')).toBe(true);
    }
  });

  it('synthesizes a PR href only for merged / code_complete slices', () => {
    for (const s of view.slicesIndex) {
      const detail = view.findSliceDetail(s.id);
      if (!detail) continue;
      if (s.status === 'merged' || s.status === 'code_complete') {
        expect(typeof detail.prHref).toBe('string');
        expect(detail.prHref?.startsWith('https://github.com/')).toBe(true);
      } else {
        expect(detail.prHref).toBeNull();
      }
    }
  });

  it('PR hrefs are deterministic across two calls', () => {
    const a = buildBuildProgressPageView();
    const b = buildBuildProgressPageView();
    for (const s of a.slicesIndex.slice(0, 8)) {
      expect(b.findSliceDetail(s.id)?.prHref).toBe(a.findSliceDetail(s.id)?.prHref);
    }
  });
});

// ---------------------------------------------------------------------------
// Backlog
// ---------------------------------------------------------------------------

describe('ADMIN15 — backlog preview shows next 3 planned waves', () => {
  let view: BuildProgressPageView;
  beforeAll(() => {
    view = buildBuildProgressPageView();
  });

  it('backlog length is at most 3', () => {
    expect(view.backlog.length).toBeLessThanOrEqual(3);
  });

  it('every backlog entry is a planned wave', () => {
    for (const w of view.backlog) {
      expect(w.status).toBe('planned');
    }
  });
});

// ---------------------------------------------------------------------------
// Manifest read sanity
// ---------------------------------------------------------------------------

describe('ADMIN15 — page-view reflects manifest counts', () => {
  it('build-waves.json file exists', () => {
    expect(existsSync(resolve(root, 'docs/build/build-waves.json'))).toBe(true);
  });

  it('build-slices.json file exists', () => {
    expect(existsSync(resolve(root, 'docs/build/build-slices.json'))).toBe(true);
  });

  it('view.waves length equals manifest waves length', () => {
    const view = buildBuildProgressPageView();
    const raw = JSON.parse(read('docs/build/build-waves.json')) as { waves?: unknown[] };
    expect(view.waves.length).toBe((raw.waves ?? []).length);
  });

  it('view.slicesIndex length equals manifest slices length', () => {
    const view = buildBuildProgressPageView();
    const raw = JSON.parse(read('docs/build/build-slices.json')) as { slices?: unknown[] };
    expect(view.slicesIndex.length).toBe((raw.slices ?? []).length);
  });
});

// ---------------------------------------------------------------------------
// Component file presence
// ---------------------------------------------------------------------------

describe('ADMIN15 — component files exist', () => {
  for (const [name, path] of Object.entries(COMPONENT_PATHS)) {
    it(`${name} file exists at ${path}`, () => {
      expect(existsSync(resolve(root, path))).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// Visual lock
// ---------------------------------------------------------------------------

describe('ADMIN15 — visual lock: no banned hex literals', () => {
  for (const [name, path] of Object.entries(COMPONENT_PATHS)) {
    it(`${name} contains no banned hex tokens`, () => {
      const src = read(path);
      for (const banned of BANNED_HEX) {
        expect(src.toLowerCase()).not.toContain(banned.toLowerCase());
      }
    });
  }
});

describe('ADMIN15 — components import COLORS from design-tokens', () => {
  const tokenConsumers = [
    COMPONENT_PATHS.waveTimeline,
    COMPONENT_PATHS.sliceTable,
    COMPONENT_PATHS.sliceDrawer,
    COMPONENT_PATHS.ciMini,
    COMPONENT_PATHS.backlog,
  ];
  for (const path of tokenConsumers) {
    it(`${path} imports from design-tokens`, () => {
      const src = read(path);
      expect(src).toMatch(/from '@\/lib\/design\/design-tokens'/);
    });
  }
});

// ---------------------------------------------------------------------------
// Page wiring
// ---------------------------------------------------------------------------

describe('ADMIN15 — page wires all new sub-components', () => {
  let pageSrc: string;
  beforeAll(() => {
    pageSrc = read(COMPONENT_PATHS.page);
  });

  it('imports WaveTimeline', () => {
    expect(pageSrc).toContain('WaveTimeline');
  });
  it('imports SliceTable', () => {
    expect(pageSrc).toContain('SliceTable');
  });
  it('imports SliceDetailDrawer', () => {
    expect(pageSrc).toContain('SliceDetailDrawer');
  });
  it('imports CIMiniStrip', () => {
    expect(pageSrc).toContain('CIMiniStrip');
  });
  it('imports BacklogPreview', () => {
    expect(pageSrc).toContain('BacklogPreview');
  });
  it('reads searchParams for tab / wave / slice', () => {
    expect(pageSrc).toContain('searchParams');
    expect(pageSrc).toMatch(/tab\??:/);
    expect(pageSrc).toMatch(/wave\??:/);
    expect(pageSrc).toMatch(/slice\??:/);
  });
  it('still imports AdminCanonShellV2 + EditorialCanvas + AgentRail (visual lock)', () => {
    expect(pageSrc).toContain('AdminCanonShellV2');
    expect(pageSrc).toContain('EditorialCanvas');
    expect(pageSrc).toContain('AgentRail');
  });
  it('renders BuildProgressActionStrip section in the page body', () => {
    expect(pageSrc).toContain('BuildProgressActionStrip');
  });
  it('renders BuildProgressTabs section', () => {
    expect(pageSrc).toContain('BuildProgressTabs');
  });
});

// ---------------------------------------------------------------------------
// Hard gating — no live CI / SDK imports
// ---------------------------------------------------------------------------

describe('ADMIN15 — hard-gated: no live CI / SDK imports inside components', () => {
  const banned = [
    '@octokit/',
    '@vercel/sdk',
    'gh api',
    'spawn(',
    'execSync',
  ];
  const componentFiles = [
    COMPONENT_PATHS.waveTimeline,
    COMPONENT_PATHS.sliceTable,
    COMPONENT_PATHS.sliceDrawer,
    COMPONENT_PATHS.ciMini,
    COMPONENT_PATHS.backlog,
    COMPONENT_PATHS.pageView,
  ];
  for (const path of componentFiles) {
    it(`${path} does not import live CI / shell-out helpers`, () => {
      const src = read(path);
      for (const b of banned) {
        expect(src).not.toContain(b);
      }
    });
  }
});

describe('ADMIN15 — page action strip renders blocked buttons with reason', () => {
  let pageSrc: string;
  beforeAll(() => {
    pageSrc = read(COMPONENT_PATHS.page);
  });

  it('uses disabled + aria-disabled for blocked actions', () => {
    expect(pageSrc).toMatch(/disabled\b/);
    expect(pageSrc).toContain('aria-disabled="true"');
  });
  it('differentiates blocked vs available with data-status', () => {
    expect(pageSrc).toContain('data-status="blocked"');
    expect(pageSrc).toContain('data-status="available"');
  });
});

describe('ADMIN15 — CI mini strip surfaces the deterministic disclaimer', () => {
  it('CIMiniStrip source includes the Wave 27 disclaimer text', () => {
    const src = read(COMPONENT_PATHS.ciMini);
    expect(src).toMatch(/Wave 27/);
  });
});

describe('ADMIN15 — design token sanity', () => {
  it('COLORS.navy is the canonical AbarVa navy', () => {
    expect(COLORS.navy.toLowerCase()).toBe('#0b4a91');
  });
  it('COLORS.mintSoft exists', () => {
    expect(COLORS.mintSoft).toBeDefined();
  });
  it('COLORS.coralSoft exists', () => {
    expect(COLORS.coralSoft).toBeDefined();
  });
});
