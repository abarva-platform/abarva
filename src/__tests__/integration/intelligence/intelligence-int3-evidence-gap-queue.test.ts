// INT3 · Sentinel Evidence Gap Queue — integration tests.
//
// Verifies structural invariants added in INT3:
//   1. sentinel-evidence-gap-queue-view lib is deterministic and contract-correct
//   2. intelligence-lens-tabs-view has gap_queue tab key (7th tab)
//   3. IntelligenceLensTabs renders EvidenceGapQueuePanel with correct testids
//   4. Honest disclaimer is literal (not interpolated)

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  INTELLIGENCE_TABS,
  buildIntelligenceLensTabsView,
  resolveIntelligenceTab,
} from '@/lib/intelligence/intelligence-lens-tabs-view';
import {
  buildEvidenceGapQueueView,
} from '@/lib/intelligence/sentinel-evidence-gap-queue-view';

const COMPONENT_PATH = join(
  process.cwd(),
  'src/components/intelligence/IntelligenceLensTabs.tsx',
);
const LIB_PATH = join(
  process.cwd(),
  'src/lib/intelligence/sentinel-evidence-gap-queue-view.ts',
);

const componentSrc = readFileSync(COMPONENT_PATH, 'utf8');
const libSrc = readFileSync(LIB_PATH, 'utf8');

// ─── intelligence-lens-tabs-view · gap_queue tab ──────────────────────────────

describe('INT3 · intelligence-lens-tabs-view · gap_queue tab', () => {
  it("INTELLIGENCE_TABS includes 'gap_queue' key", () => {
    const keys = INTELLIGENCE_TABS.map((t) => t.key);
    expect(keys).toContain('gap_queue');
  });

  it('INTELLIGENCE_TABS has exactly seven tabs', () => {
    expect(INTELLIGENCE_TABS).toHaveLength(7);
  });

  it("resolveIntelligenceTab accepts 'gap_queue'", () => {
    expect(resolveIntelligenceTab('gap_queue')).toBe('gap_queue');
  });

  it("buildIntelligenceLensTabsView includes gap_queue in tabs", () => {
    const view = buildIntelligenceLensTabsView('gap_queue');
    expect(view.tabs.map((t) => t.key)).toContain('gap_queue');
  });

  it("buildIntelligenceLensTabsView echoes gap_queue as active tab", () => {
    const view = buildIntelligenceLensTabsView('gap_queue');
    expect(view.activeTab).toBe('gap_queue');
  });

  it("gap_queue tab has non-empty label and description", () => {
    const tab = INTELLIGENCE_TABS.find((t) => t.key === 'gap_queue');
    expect(tab).toBeDefined();
    expect(tab!.label.trim().length).toBeGreaterThan(0);
    expect(tab!.description.trim().length).toBeGreaterThan(0);
  });

  it('gap_queue tab is marked hasApexRetailContent', () => {
    const tab = INTELLIGENCE_TABS.find((t) => t.key === 'gap_queue');
    expect(tab!.hasApexRetailContent).toBe(true);
  });
});

// ─── IntelligenceLensTabs · EvidenceGapQueuePanel ────────────────────────────

describe('INT3 · IntelligenceLensTabs · EvidenceGapQueuePanel', () => {
  it('imports buildEvidenceGapQueueView from sentinel-evidence-gap-queue-view', () => {
    expect(componentSrc).toContain("from '@/lib/intelligence/sentinel-evidence-gap-queue-view'");
  });

  it('defines EvidenceGapQueuePanel function', () => {
    expect(componentSrc).toContain('function EvidenceGapQueuePanel()');
  });

  it("renders EvidenceGapQueuePanel for gap_queue tab", () => {
    expect(componentSrc).toContain("{activeTab === 'gap_queue' && (");
    expect(componentSrc).toContain('<EvidenceGapQueuePanel />');
  });

  it('has data-testid="intelligence-gap-queue-panel"', () => {
    expect(componentSrc).toContain('data-testid="intelligence-gap-queue-panel"');
  });

  it('has data-testid="intelligence-gap-queue-summary"', () => {
    expect(componentSrc).toContain('data-testid="intelligence-gap-queue-summary"');
  });

  it('has intelligence-gap-queue-item- testid prefix for gap items', () => {
    expect(componentSrc).toContain('intelligence-gap-queue-item-');
  });

  it('has data-testid="intelligence-gap-queue-disclaimer"', () => {
    expect(componentSrc).toContain('data-testid="intelligence-gap-queue-disclaimer"');
  });

  it('has data-honest-disclaimer="intelligence-gap-queue"', () => {
    expect(componentSrc).toContain('data-honest-disclaimer="intelligence-gap-queue"');
  });

  it('honest disclaimer contains literal Deterministic seed', () => {
    const idx = componentSrc.indexOf('data-honest-disclaimer="intelligence-gap-queue"');
    expect(idx).toBeGreaterThan(0);
    const snippet = componentSrc.slice(idx, idx + 400);
    expect(snippet).toContain('Deterministic seed');
  });

  it('does not import from src/lib/source', () => {
    expect(componentSrc).not.toMatch(/@\/lib\/source/);
  });

  it('references gap_queue key', () => {
    expect(componentSrc).toContain('gap_queue');
  });
});

// ─── sentinel-evidence-gap-queue-view · source audit ─────────────────────────

describe('INT3 · sentinel-evidence-gap-queue-view · source audit', () => {
  it('buildEvidenceGapQueueView is exported', () => {
    expect(libSrc).toContain('export function buildEvidenceGapQueueView');
  });

  it('EvidenceGapQueueView interface is exported', () => {
    expect(libSrc).toContain('export interface EvidenceGapQueueView');
  });

  it('EvidenceGapQueueItem interface is exported', () => {
    expect(libSrc).toContain('export interface EvidenceGapQueueItem');
  });

  it('EvidenceGapQueueSummary interface is exported', () => {
    expect(libSrc).toContain('export interface EvidenceGapQueueSummary');
  });

  it('GapUrgency type is exported', () => {
    expect(libSrc).toContain('export type GapUrgency');
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

// ─── sentinel-evidence-gap-queue-view · runtime contract ─────────────────────

describe('INT3 · buildEvidenceGapQueueView · runtime contract', () => {
  const queue = buildEvidenceGapQueueView();

  it('returns a non-null view', () => {
    expect(queue).not.toBeNull();
  });

  it('deterministicSeed is true', () => {
    expect(queue.deterministicSeed).toBe(true);
  });

  it('totalGaps is 8', () => {
    expect(queue.totalGaps).toBe(8);
  });

  it('items array has 8 entries', () => {
    expect(queue.items).toHaveLength(8);
  });

  it('summary.totalGaps matches items length', () => {
    expect(queue.summary.totalGaps).toBe(queue.items.length);
  });

  it('has 2 critical-urgency gaps', () => {
    const critical = queue.items.filter((i) => i.urgency === 'critical');
    expect(critical).toHaveLength(2);
    expect(queue.summary.criticalCount).toBe(2);
  });

  it('has 3 high-urgency gaps', () => {
    const high = queue.items.filter((i) => i.urgency === 'high');
    expect(high).toHaveLength(3);
    expect(queue.summary.highCount).toBe(3);
  });

  it('has 3 medium-urgency gaps', () => {
    const medium = queue.items.filter((i) => i.urgency === 'medium');
    expect(medium).toHaveLength(3);
    expect(queue.summary.mediumCount).toBe(3);
  });

  it('critical gaps come before high gaps in items array', () => {
    const criticalIndices = queue.items
      .map((item, i) => (item.urgency === 'critical' ? i : -1))
      .filter((i) => i >= 0);
    const highIndices = queue.items
      .map((item, i) => (item.urgency === 'high' ? i : -1))
      .filter((i) => i >= 0);
    const maxCritical = Math.max(...criticalIndices);
    const minHigh = Math.min(...highIndices);
    expect(maxCritical).toBeLessThan(minHigh);
  });

  it('each item has non-empty required string fields', () => {
    for (const item of queue.items) {
      expect(item.queueId.trim().length).toBeGreaterThan(0);
      expect(item.gapId.trim().length).toBeGreaterThan(0);
      expect(item.label.trim().length).toBeGreaterThan(0);
      expect(item.needed.trim().length).toBeGreaterThan(0);
      expect(item.responsibleParty.trim().length).toBeGreaterThan(0);
      expect(item.patternId.trim().length).toBeGreaterThan(0);
      expect(item.patternTitle.trim().length).toBeGreaterThan(0);
    }
  });

  it('each item has a valid urgency', () => {
    const validUrgencies = ['critical', 'high', 'medium', 'low'];
    for (const item of queue.items) {
      expect(validUrgencies).toContain(item.urgency);
    }
  });

  it('each item has a valid patternApplicationStatus', () => {
    const validStatuses = ['active', 'candidate', 'monitoring'];
    for (const item of queue.items) {
      expect(validStatuses).toContain(item.patternApplicationStatus);
    }
  });

  it('CDP gate gap (ca-001-gate) is critical and references AMS vendor selection', () => {
    const gap = queue.items.find((i) => i.gapId === 'ca-001-gate');
    expect(gap).toBeDefined();
    expect(gap!.urgency).toBe('critical');
    expect(gap!.deadlineHint).not.toBeNull();
  });

  it('Vendor B SOC-2 gap (bg-001-soc2) is critical', () => {
    const gap = queue.items.find((i) => i.gapId === 'bg-001-soc2');
    expect(gap).toBeDefined();
    expect(gap!.urgency).toBe('critical');
  });

  it('atlasSummary is non-empty', () => {
    expect(queue.atlasSummary.trim().length).toBeGreaterThan(0);
  });

  it('honestDisclaimer contains Deterministic seed', () => {
    expect(queue.honestDisclaimer).toContain('Deterministic seed');
  });

  it('is deterministic across calls', () => {
    const a = buildEvidenceGapQueueView();
    const b = buildEvidenceGapQueueView();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('all queueIds are unique', () => {
    const ids = queue.items.map((i) => i.queueId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all gapIds are unique', () => {
    const ids = queue.items.map((i) => i.gapId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
