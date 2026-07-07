// TOWER4 · Tower Lens Tabs — view-model unit tests.
//
// Pure deterministic coverage of tower-lens-tabs-view.ts.
// No React rendering, no DOM, no model calls.

import {
  TOWER_TABS,
  buildTowerLensTabsView,
  resolveTowerTab,
  type TowerTabKey,
} from "@/lib/tower/tower-lens-tabs-view";

// ─────────────────────────────────────────────────────────────────────────────
// Tab set
// ─────────────────────────────────────────────────────────────────────────────

describe("TOWER_TABS", () => {
  it("declares exactly five canonical tabs (T-2 Tower Fix Package: dropped pressure, source_commercial, decisions, value_at_risk, reasoning_activity)", () => {
    expect(TOWER_TABS).toHaveLength(5);
  });

  it("contains portfolio, scorecards, programme_gates, dependencies, executive_brief in that order", () => {
    expect(TOWER_TABS.map((t) => t.key)).toEqual([
      "portfolio",
      "scorecards",
      "programme_gates",
      "dependencies",
      "executive_brief",
    ]);
  });

  it("every tab has a non-empty label and description", () => {
    for (const tab of TOWER_TABS) {
      expect(tab.label.length).toBeGreaterThan(0);
      expect(tab.description.length).toBeGreaterThan(0);
    }
  });

  it("all tabs are marked hasApexRetailContent", () => {
    for (const tab of TOWER_TABS) {
      expect(tab.hasApexRetailContent).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// resolveTowerTab
// ─────────────────────────────────────────────────────────────────────────────

describe("resolveTowerTab", () => {
  it('returns "portfolio" for undefined', () => {
    expect(resolveTowerTab(undefined)).toBe("portfolio");
  });

  it('returns "portfolio" for null', () => {
    expect(resolveTowerTab(null)).toBe("portfolio");
  });

  it('returns "portfolio" for empty string', () => {
    expect(resolveTowerTab("")).toBe("portfolio");
  });

  it('returns "portfolio" for unknown key', () => {
    expect(resolveTowerTab("enterprise")).toBe("portfolio");
    expect(resolveTowerTab("not_a_tab")).toBe("portfolio");
  });

  // Tower Fix Package T-2: 5 valid keys (down from 9). Dropped:
  // pressure, source_commercial, decisions, value_at_risk, reasoning_activity.
  const VALID: TowerTabKey[] = [
    "portfolio",
    "scorecards",
    "programme_gates",
    "dependencies",
    "executive_brief",
  ];
  for (const key of VALID) {
    it(`accepts valid key "${key}"`, () => {
      expect(resolveTowerTab(key)).toBe(key);
    });
  }

  it.each([
    "pressure",
    "source_commercial",
    "decisions",
    "value_at_risk",
    "reasoning_activity",
  ])('falls back to "portfolio" for dropped tab "%s"', (key) => {
    expect(resolveTowerTab(key)).toBe("portfolio");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildTowerLensTabsView
// ─────────────────────────────────────────────────────────────────────────────

describe("buildTowerLensTabsView", () => {
  it("returns deterministicSeed: true", () => {
    const view = buildTowerLensTabsView("portfolio");
    expect(view.deterministicSeed).toBe(true);
  });

  it("echoes the active tab", () => {
    const tabs: TowerTabKey[] = [
      "portfolio",
      "scorecards",
      "programme_gates",
      "dependencies",
      "executive_brief",
    ];
    for (const tab of tabs) {
      expect(buildTowerLensTabsView(tab).activeTab).toBe(tab);
    }
  });

  it("always includes all five tabs (T-2 Tower Fix Package reduction)", () => {
    const view = buildTowerLensTabsView("portfolio");
    expect(view.tabs).toHaveLength(5);
    expect(view.tabs.map((t) => t.key)).toEqual([
      "portfolio",
      "scorecards",
      "programme_gates",
      "dependencies",
      "executive_brief",
    ]);
  });

  it("is pure — same input yields identical output", () => {
    const a = buildTowerLensTabsView("scorecards");
    const b = buildTowerLensTabsView("scorecards");
    expect(a).toEqual(b);
  });
});

// The TOWER4 component file probe (TowerLensTabs.tsx) was removed when that
// orphaned component was deleted — it was never wired to a live route,
// superseded by TowerIndexPage's CXO command center. tower-lens-tabs-view.ts
// itself stays live (TowerIndexPage still uses its TowerTabKey type/helpers),
// so the coverage above this comment remains.
