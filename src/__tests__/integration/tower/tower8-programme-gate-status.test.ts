// TOWER8 · Programme Gate Status Lens — integration tests.
//
// Verifies structural invariants added in TOWER8:
//   1. programme-gate-status-view lib is deterministic and contract-correct
//   2. tower-lens-tabs-view has programme_gates tab key (8th tab)
//   3. TowerLensTabs renders ProgrammeGatesPanel with correct testids
//   4. Honest disclaimer is literal (not interpolated)

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  TOWER_TABS,
  buildTowerLensTabsView,
  resolveTowerTab,
} from '@/lib/tower/tower-lens-tabs-view';
import {
  buildProgrammeGateStatusView,
} from '@/lib/tower/programme-gate-status-view';

const COMPONENT_PATH = join(
  process.cwd(),
  'src/components/tower/TowerLensTabs.tsx',
);
const LIB_PATH = join(
  process.cwd(),
  'src/lib/tower/programme-gate-status-view.ts',
);

const componentSrc = readFileSync(COMPONENT_PATH, 'utf8');
const libSrc = readFileSync(LIB_PATH, 'utf8');

// ─── tower-lens-tabs-view · programme_gates tab ───────────────────────────────

describe('TOWER8 · tower-lens-tabs-view · programme_gates tab', () => {
  it("TOWER_TABS includes 'programme_gates' key", () => {
    const keys = TOWER_TABS.map((t) => t.key);
    expect(keys).toContain('programme_gates');
  });

  it('TOWER_TABS has exactly eight tabs', () => {
    expect(TOWER_TABS).toHaveLength(8);
  });

  it("resolveTowerTab accepts 'programme_gates'", () => {
    expect(resolveTowerTab('programme_gates')).toBe('programme_gates');
  });

  it("buildTowerLensTabsView includes programme_gates in tabs", () => {
    const view = buildTowerLensTabsView('programme_gates');
    expect(view.tabs.map((t) => t.key)).toContain('programme_gates');
  });

  it("buildTowerLensTabsView echoes programme_gates as active tab", () => {
    const view = buildTowerLensTabsView('programme_gates');
    expect(view.activeTab).toBe('programme_gates');
  });

  it("programme_gates tab has non-empty label and description", () => {
    const tab = TOWER_TABS.find((t) => t.key === 'programme_gates');
    expect(tab).toBeDefined();
    expect(tab!.label.trim().length).toBeGreaterThan(0);
    expect(tab!.description.trim().length).toBeGreaterThan(0);
  });

  it('programme_gates tab is marked hasApexRetailContent', () => {
    const tab = TOWER_TABS.find((t) => t.key === 'programme_gates');
    expect(tab!.hasApexRetailContent).toBe(true);
  });
});

// ─── TowerLensTabs · ProgrammeGatesPanel ─────────────────────────────────────

describe('TOWER8 · TowerLensTabs · ProgrammeGatesPanel', () => {
  it('imports buildProgrammeGateStatusView from programme-gate-status-view', () => {
    expect(componentSrc).toContain("from '@/lib/tower/programme-gate-status-view'");
  });

  it('defines ProgrammeGatesPanel function', () => {
    expect(componentSrc).toContain('function ProgrammeGatesPanel()');
  });

  it("renders ProgrammeGatesPanel for programme_gates tab", () => {
    expect(componentSrc).toContain("{activeTab === 'programme_gates' && (");
    expect(componentSrc).toContain('<ProgrammeGatesPanel />');
  });

  it('has data-testid="tower-programme-gates-panel"', () => {
    expect(componentSrc).toContain('data-testid="tower-programme-gates-panel"');
  });

  it('has data-testid="tower-programme-gates-summary"', () => {
    expect(componentSrc).toContain('data-testid="tower-programme-gates-summary"');
  });

  it('has tower-gate-programme- testid prefix for programme cards', () => {
    expect(componentSrc).toContain('tower-gate-programme-');
  });

  it('has data-testid="tower-programme-gates-dependencies"', () => {
    expect(componentSrc).toContain('data-testid="tower-programme-gates-dependencies"');
  });

  it('has data-testid="tower-programme-gates-disclaimer"', () => {
    expect(componentSrc).toContain('data-testid="tower-programme-gates-disclaimer"');
  });

  it('has data-honest-disclaimer="tower-programme-gates"', () => {
    expect(componentSrc).toContain('data-honest-disclaimer="tower-programme-gates"');
  });

  it('honest disclaimer contains literal Deterministic seed', () => {
    const idx = componentSrc.indexOf('data-honest-disclaimer="tower-programme-gates"');
    expect(idx).toBeGreaterThan(0);
    const snippet = componentSrc.slice(idx, idx + 400);
    expect(snippet).toContain('Deterministic seed');
  });

  it('does not import from src/lib/source', () => {
    expect(componentSrc).not.toMatch(/@\/lib\/source/);
  });

  it('does not call fetch or Date.now', () => {
    expect(componentSrc).not.toMatch(/\bfetch\s*\(/);
    expect(componentSrc).not.toMatch(/Date\.now\s*\(/);
  });
});

// ─── programme-gate-status-view · source audit ───────────────────────────────

describe('TOWER8 · programme-gate-status-view · source audit', () => {
  it('buildProgrammeGateStatusView is exported', () => {
    expect(libSrc).toContain('export function buildProgrammeGateStatusView');
  });

  it('ProgrammeGateStatusView interface is exported', () => {
    expect(libSrc).toContain('export interface ProgrammeGateStatusView');
  });

  it('ProgrammeGateStatusCard interface is exported', () => {
    expect(libSrc).toContain('export interface ProgrammeGateStatusCard');
  });

  it('ProgrammeGateMilestone interface is exported', () => {
    expect(libSrc).toContain('export interface ProgrammeGateMilestone');
  });

  it('GateStatus type is exported', () => {
    expect(libSrc).toContain('export type GateStatus');
  });

  it('module contains no runtime impurity', () => {
    expect(libSrc).not.toMatch(/Date\.now/);
    expect(libSrc).not.toMatch(/Math\.random/);
    expect(libSrc).not.toMatch(/fetch\(/);
  });

  it('does NOT import from src/lib/source', () => {
    expect(libSrc).not.toMatch(/@\/lib\/source/);
  });

  it('deterministicSeed: true literal present', () => {
    expect(libSrc).toContain('deterministicSeed: true');
  });
});

// ─── programme-gate-status-view · runtime contract ───────────────────────────

describe('TOWER8 · buildProgrammeGateStatusView · runtime contract', () => {
  const view = buildProgrammeGateStatusView();

  it('returns a non-null view', () => {
    expect(view).not.toBeNull();
  });

  it('deterministicSeed is true', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('programmes array has exactly 4 entries', () => {
    expect(view.programmes).toHaveLength(4);
  });

  it('summary.totalProgrammes is 4', () => {
    expect(view.summary.totalProgrammes).toBe(4);
  });

  it('summary counts match programmes array', () => {
    const blocked = view.programmes.filter((p) => p.activeGate.status === 'blocked').length;
    const atRisk = view.programmes.filter((p) => p.activeGate.status === 'at_risk').length;
    const pending = view.programmes.filter((p) => p.activeGate.status === 'pending').length;
    expect(view.summary.blockedGates).toBe(blocked);
    expect(view.summary.atRiskGates).toBe(atRisk);
    expect(view.summary.pendingGates).toBe(pending);
  });

  it('has at least one blocked programme', () => {
    const blocked = view.programmes.filter((p) => p.activeGate.status === 'blocked');
    expect(blocked.length).toBeGreaterThan(0);
  });

  it('has at least one at-risk programme', () => {
    const atRisk = view.programmes.filter((p) => p.activeGate.status === 'at_risk');
    expect(atRisk.length).toBeGreaterThan(0);
  });

  it('needsAttentionCount matches programmes needing attention', () => {
    const count = view.programmes.filter((p) => p.needsTowerAttention).length;
    expect(view.summary.needsAttentionCount).toBe(count);
  });

  it('each programme has non-empty required string fields', () => {
    for (const p of view.programmes) {
      expect(p.programmeId.trim().length).toBeGreaterThan(0);
      expect(p.programmeName.trim().length).toBeGreaterThan(0);
      expect(p.displayId.trim().length).toBeGreaterThan(0);
      expect(p.currentPhaseStatus.trim().length).toBeGreaterThan(0);
    }
  });

  it('each programme has a valid current phase', () => {
    const validPhases = ['P1', 'P2', 'P3', 'P4', 'P5'];
    for (const p of view.programmes) {
      expect(validPhases).toContain(p.currentPhase);
    }
  });

  it('each active gate has a valid status', () => {
    const validStatuses = ['pending', 'approved', 'blocked', 'at_risk', 'not_reached'];
    for (const p of view.programmes) {
      expect(validStatuses).toContain(p.activeGate.status);
    }
  });

  it('APX-CDP-2026 is blocked', () => {
    const cdp = view.programmes.find((p) => p.programmeId === 'APX-CDP-2026');
    expect(cdp).toBeDefined();
    expect(cdp!.activeGate.status).toBe('blocked');
    expect(cdp!.needsTowerAttention).toBe(true);
  });

  it('APX-DF-2026 does not need tower attention', () => {
    const df = view.programmes.find((p) => p.programmeId === 'APX-DF-2026');
    expect(df).toBeDefined();
    expect(df!.needsTowerAttention).toBe(false);
    expect(df!.towerFlags).toHaveLength(0);
  });

  it('has cross-programme dependencies', () => {
    expect(view.crossProgrammeDependencies.length).toBeGreaterThan(0);
  });

  it('atlasSynthesis is non-empty', () => {
    expect(view.atlasSynthesis.trim().length).toBeGreaterThan(0);
  });

  it('honestDisclaimer contains Deterministic seed', () => {
    expect(view.honestDisclaimer).toContain('Deterministic seed');
  });

  it('is deterministic across calls', () => {
    const a = buildProgrammeGateStatusView();
    const b = buildProgrammeGateStatusView();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('all programmeIds are unique', () => {
    const ids = view.programmes.map((p) => p.programmeId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
