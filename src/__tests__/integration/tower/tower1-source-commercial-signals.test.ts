// TOWER1 · Source commercial signals in Control Tower.
//
// Verifies structural invariants added in TOWER1:
//   1. tower-lens-tabs-view has source_commercial tab key
//   2. TowerLensTabs renders source_commercial tab
//   3. SourceCommercialPanel has correct testids and honest disclaimer
//   4. source-commercial-signals-view lib is deterministic and contract-correct

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  TOWER_TABS,
  buildTowerLensTabsView,
  resolveTowerTab,
} from '@/lib/tower/tower-lens-tabs-view';
import { buildSourceCommercialSignalsView } from '@/lib/tower/source-commercial-signals-view';

const TABS_PAGE_PATH = join(
  process.cwd(),
  'src/components/tower/TowerLensTabs.tsx',
);
const LIB_PATH = join(
  process.cwd(),
  'src/lib/tower/source-commercial-signals-view.ts',
);

const towerSrc = readFileSync(TABS_PAGE_PATH, 'utf8');
const libSrc = readFileSync(LIB_PATH, 'utf8');

// ─── tower-lens-tabs-view · source_commercial tab ────────────────────────────

describe('TOWER1 · tower-lens-tabs-view · source_commercial tab', () => {
  it("TOWER_TABS includes 'source_commercial' key", () => {
    const keys = TOWER_TABS.map((t) => t.key);
    expect(keys).toContain('source_commercial');
  });

  it("resolveTowerTab accepts 'source_commercial'", () => {
    expect(resolveTowerTab('source_commercial')).toBe('source_commercial');
  });

  it("buildTowerLensTabsView includes source_commercial in tabs", () => {
    const view = buildTowerLensTabsView('source_commercial');
    expect(view.tabs.map((t) => t.key)).toContain('source_commercial');
  });

  it("buildTowerLensTabsView echoes source_commercial as active tab", () => {
    const view = buildTowerLensTabsView('source_commercial');
    expect(view.activeTab).toBe('source_commercial');
  });

  it("source_commercial tab has non-empty label and description", () => {
    const tab = TOWER_TABS.find((t) => t.key === 'source_commercial');
    expect(tab).toBeDefined();
    expect(tab!.label.trim().length).toBeGreaterThan(0);
    expect(tab!.description.trim().length).toBeGreaterThan(0);
  });

  it("source_commercial tab hasApexRetailContent = true", () => {
    const tab = TOWER_TABS.find((t) => t.key === 'source_commercial');
    expect(tab!.hasApexRetailContent).toBe(true);
  });
});

// ─── TowerLensTabs.tsx · SourceCommercialPanel ────────────────────────────────

describe('TOWER1 · TowerLensTabs · SourceCommercialPanel', () => {
  it("imports buildSourceCommercialSignalsView from tower lib (not source lib)", () => {
    expect(towerSrc).toContain("from '@/lib/tower/source-commercial-signals-view'");
    // Must NOT import from source lib
    expect(towerSrc).not.toMatch(/@\/lib\/source\//);
  });

  it("defines SourceCommercialPanel function", () => {
    expect(towerSrc).toContain('function SourceCommercialPanel()');
  });

  it("renders SourceCommercialPanel for source_commercial tab", () => {
    expect(towerSrc).toContain("{activeTab === 'source_commercial' && (");
    expect(towerSrc).toContain('<SourceCommercialPanel />');
  });

  it('has data-testid="tower-source-commercial-panel"', () => {
    expect(towerSrc).toContain('data-testid="tower-source-commercial-panel"');
  });

  it('has data-testid="tower-source-commercial-executive-guidance"', () => {
    expect(towerSrc).toContain('data-testid="tower-source-commercial-executive-guidance"');
  });

  it('has data-testid="tower-source-commercial-readiness"', () => {
    expect(towerSrc).toContain('data-testid="tower-source-commercial-readiness"');
  });

  it('has data-testid="tower-source-commercial-disclaimer"', () => {
    expect(towerSrc).toContain('data-testid="tower-source-commercial-disclaimer"');
  });

  it('has data-honest-disclaimer="tower-source-commercial"', () => {
    expect(towerSrc).toContain('data-honest-disclaimer="tower-source-commercial"');
  });

  it('honest disclaimer mentions Deterministic seed', () => {
    const idx = towerSrc.indexOf('data-honest-disclaimer="tower-source-commercial"');
    expect(idx).toBeGreaterThan(0);
    const snippet = towerSrc.slice(idx, idx + 400);
    expect(snippet).toContain('Deterministic seed');
  });
});

// ─── source-commercial-signals-view · source audit ───────────────────────────

describe('TOWER1 · source-commercial-signals-view · source audit', () => {
  it('buildSourceCommercialSignalsView is exported', () => {
    expect(libSrc).toContain('export function buildSourceCommercialSignalsView');
  });

  it('SourceCommercialSignalsView interface is exported', () => {
    expect(libSrc).toContain('export interface SourceCommercialSignalsView');
  });

  it('CommercialSignal interface is exported', () => {
    expect(libSrc).toContain('export interface CommercialSignal');
  });

  it('SourceCommercialEventSummary interface is exported', () => {
    expect(libSrc).toContain('export interface SourceCommercialEventSummary');
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

// ─── source-commercial-signals-view · runtime contract ───────────────────────

describe('TOWER1 · source-commercial-signals-view · runtime contract', () => {
  const view = buildSourceCommercialSignalsView();

  it('returns a non-null view', () => {
    expect(view).not.toBeNull();
  });

  it('deterministicSeed is true', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('headline is non-empty', () => {
    expect(view.headline.length).toBeGreaterThan(0);
  });

  it('contextLine is non-empty', () => {
    expect(view.contextLine.length).toBeGreaterThan(0);
  });

  it('signals array is non-empty', () => {
    expect(view.signals.length).toBeGreaterThan(0);
  });

  it('has at least one critical or high signal', () => {
    const urgent = view.signals.filter((s) => s.severity === 'critical' || s.severity === 'high');
    expect(urgent.length).toBeGreaterThan(0);
  });

  it('each signal has non-empty title, narrative, recommendedAction', () => {
    view.signals.forEach((s) => {
      expect(s.title.trim().length).toBeGreaterThan(0);
      expect(s.narrative.trim().length).toBeGreaterThan(0);
      expect(s.recommendedAction.trim().length).toBeGreaterThan(0);
    });
  });

  it('event summary has expected AMS event id', () => {
    expect(view.eventSummary.eventId).toBe('src-ams-2026');
  });

  it('event summary has stage label', () => {
    expect(view.eventSummary.stageLabel.length).toBeGreaterThan(0);
  });

  it('event summary selectionReadiness is at_risk (blockers active)', () => {
    expect(view.eventSummary.selectionReadiness).toBe('at_risk');
  });

  it('event summary criticalSignalCount matches signals', () => {
    const critCount = view.signals.filter((s) => s.severity === 'critical').length;
    expect(view.eventSummary.criticalSignalCount).toBe(critCount);
  });

  it('executiveGuidance is non-empty', () => {
    expect(view.executiveGuidance.length).toBeGreaterThan(0);
  });

  it('honestDisclaimer contains Deterministic seed', () => {
    expect(view.honestDisclaimer).toContain('Deterministic seed');
  });

  it('is deterministic across calls', () => {
    const a = buildSourceCommercialSignalsView();
    const b = buildSourceCommercialSignalsView();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
