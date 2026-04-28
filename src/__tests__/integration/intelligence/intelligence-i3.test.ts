/**
 * I3 · INT-IDX-SIGNALS / INT-DTL-SIGNAL — Intelligence signal stream view model tests.
 *
 * Verifies:
 *   - buildIntelligenceSignalsIndexView: totalSignals ≥ 30, bySourceType sums, ProvenanceRibbon
 *   - getKnownSignalIds: ≥ 30 entries, includes SIG-SRC-2025-001
 *   - buildIntelligenceSignalDetailView: SIG-SRC-2025-001 detail fields
 *   - buildIntelligenceSignalDetailView: unknown slug returns null
 *   - Signal detail: affectedPatternIds is array, provenanceRibbon.primitive === 'Signal'
 *   - View models are deterministic
 *   - Module hygiene (no fetch, Date.now, Math.random, new Date)
 *   - File existence checks (server components, client islands, routes)
 */

import * as fs from 'fs';
import * as path from 'path';

import { buildIntelligenceSignalsIndexView, getKnownSignalIds } from '@/lib/intelligence/intelligence-signals-index-view';
import { buildIntelligenceSignalDetailView } from '@/lib/intelligence/intelligence-signal-detail-view';
import { MANUAL_SIGNAL_COUNT } from '@/lib/intelligence/seed-signals-manual';

const ROOT = path.resolve(__dirname, '../../../../');

function fileExists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel));
}

function readFile(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

// ---------------------------------------------------------------------------
// Signals index view
// ---------------------------------------------------------------------------

describe('I3 · buildIntelligenceSignalsIndexView — index', () => {
  const view = buildIntelligenceSignalsIndexView();

  it('returns a non-null view', () => {
    expect(view).not.toBeNull();
  });

  it('totalSignals matches MANUAL_SIGNAL_COUNT', () => {
    expect(view.totalSignals).toBe(MANUAL_SIGNAL_COUNT);
  });

  it('totalSignals is at least 30', () => {
    expect(view.totalSignals).toBeGreaterThanOrEqual(30);
  });

  it('signals array length matches totalSignals', () => {
    expect(view.signals.length).toBe(view.totalSignals);
  });

  it('bySourceType counts sum to totalSignals', () => {
    const sum =
      view.bySourceType.vendor_announcement +
      view.bySourceType.regulatory +
      view.bySourceType.analyst +
      view.bySourceType.manual_curated;
    expect(sum).toBe(view.totalSignals);
  });

  it('bySourceType has vendor_announcement > 0', () => {
    expect(view.bySourceType.vendor_announcement).toBeGreaterThan(0);
  });

  it('bySourceType has regulatory > 0', () => {
    expect(view.bySourceType.regulatory).toBeGreaterThan(0);
  });

  it('every signal row has a non-empty id', () => {
    for (const signal of view.signals) {
      expect(signal.id.length).toBeGreaterThan(0);
    }
  });

  it('every signal row has a non-empty title', () => {
    for (const signal of view.signals) {
      expect(signal.title.length).toBeGreaterThan(0);
    }
  });

  it('every signal row has a confidenceLabel in format "NN%"', () => {
    for (const signal of view.signals) {
      expect(signal.confidenceLabel).toMatch(/^\d+%$/);
    }
  });

  it('every signal row href starts with /intelligence/signals/', () => {
    for (const signal of view.signals) {
      expect(signal.href.startsWith('/intelligence/signals/')).toBe(true);
    }
  });

  it('every signal row sourceTypeLabel is non-empty', () => {
    for (const signal of view.signals) {
      expect(signal.sourceTypeLabel.length).toBeGreaterThan(0);
    }
  });

  it('provenanceRibbon.primitive is "Signal"', () => {
    expect(view.provenanceRibbon.primitive).toBe('Signal');
  });

  it('provenanceRibbon.signalCount equals totalSignals', () => {
    expect(view.provenanceRibbon.signalCount).toBe(view.totalSignals);
  });

  it('provenanceRibbon.sourceLabel is deterministic_seed', () => {
    expect(view.provenanceRibbon.sourceLabel).toBe('deterministic_seed');
  });

  it('provenanceRibbon.runtimeLabel mentions no live Sentinel', () => {
    expect(view.provenanceRibbon.runtimeLabel).toContain('no live Sentinel');
  });

  it('agentQuote is non-empty', () => {
    expect(view.agentQuote.length).toBeGreaterThan(0);
  });

  it('agentContext is non-empty', () => {
    expect(view.agentContext.length).toBeGreaterThan(0);
  });

  it('deterministicSeed is true', () => {
    expect(view.deterministicSeed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getKnownSignalIds
// ---------------------------------------------------------------------------

describe('I3 · getKnownSignalIds', () => {
  const ids = getKnownSignalIds();

  it('returns at least 30 signal IDs', () => {
    expect(ids.length).toBeGreaterThanOrEqual(30);
  });

  it('includes sig-src-2025-001 (lowercase)', () => {
    expect(ids).toContain('sig-src-2025-001');
  });

  it('includes sig-reg-2025-001 (lowercase)', () => {
    expect(ids).toContain('sig-reg-2025-001');
  });

  it('includes sig-man-2025-001 (lowercase)', () => {
    expect(ids).toContain('sig-man-2025-001');
  });

  it('all IDs are lowercase', () => {
    for (const id of ids) {
      expect(id).toBe(id.toLowerCase());
    }
  });
});

// ---------------------------------------------------------------------------
// Signal detail view — known signal: SIG-SRC-2025-001
// ---------------------------------------------------------------------------

describe('I3 · buildIntelligenceSignalDetailView — SIG-SRC-2025-001', () => {
  const view = buildIntelligenceSignalDetailView('sig-src-2025-001');

  it('returns a non-null view', () => {
    expect(view).not.toBeNull();
  });

  it('signalId is lowercase sig-src-2025-001', () => {
    expect(view?.signalId).toBe('sig-src-2025-001');
  });

  it('sourceType is vendor_announcement', () => {
    expect(view?.sourceType).toBe('vendor_announcement');
  });

  it('sourceTypeLabel is Vendor', () => {
    expect(view?.sourceTypeLabel).toBe('Vendor');
  });

  it('sourceName is non-empty', () => {
    expect((view?.sourceName ?? '').length).toBeGreaterThan(0);
  });

  it('sourceUrl starts with https://', () => {
    expect(view?.sourceUrl.startsWith('https://')).toBe(true);
  });

  it('summary is non-empty', () => {
    expect((view?.summary ?? '').length).toBeGreaterThan(0);
  });

  it('confidenceLabel is in format "NN%"', () => {
    expect(view?.confidenceLabel).toMatch(/^\d+%$/);
  });

  it('affectedPatternIds is an array', () => {
    expect(Array.isArray(view?.affectedPatternIds)).toBe(true);
  });

  it('affectedPatternIds has at least 1 entry', () => {
    expect((view?.affectedPatternIds.length ?? 0)).toBeGreaterThan(0);
  });

  it('affectedProgramIds is an array', () => {
    expect(Array.isArray(view?.affectedProgramIds)).toBe(true);
  });

  it('signalsLandingHref is /intelligence/signals', () => {
    expect(view?.signalsLandingHref).toBe('/intelligence/signals');
  });

  it('intelligenceLandingHref is /intelligence', () => {
    expect(view?.intelligenceLandingHref).toBe('/intelligence');
  });

  it('provenanceRibbon.primitive is "Signal"', () => {
    expect(view?.provenanceRibbon.primitive).toBe('Signal');
  });

  it('agentQuote is non-empty', () => {
    expect((view?.agentQuote ?? '').length).toBeGreaterThan(0);
  });

  it('honestDisclaimer mentions deterministic', () => {
    expect(view?.honestDisclaimer).toContain('deterministic');
  });

  it('deterministicSeed is true', () => {
    expect(view?.deterministicSeed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Signal detail view — known signal: SIG-REG-2025-001
// ---------------------------------------------------------------------------

describe('I3 · buildIntelligenceSignalDetailView — SIG-REG-2025-001 (regulatory)', () => {
  const view = buildIntelligenceSignalDetailView('sig-reg-2025-001');

  it('returns a non-null view', () => {
    expect(view).not.toBeNull();
  });

  it('sourceType is regulatory', () => {
    expect(view?.sourceType).toBe('regulatory');
  });

  it('sourceTypeLabel is Regulatory', () => {
    expect(view?.sourceTypeLabel).toBe('Regulatory');
  });
});

// ---------------------------------------------------------------------------
// Signal detail view — manual curated signal
// ---------------------------------------------------------------------------

describe('I3 · buildIntelligenceSignalDetailView — SIG-MAN-2025-001 (manual_curated)', () => {
  const view = buildIntelligenceSignalDetailView('sig-man-2025-001');

  it('returns a non-null view', () => {
    expect(view).not.toBeNull();
  });

  it('sourceType is manual_curated', () => {
    expect(view?.sourceType).toBe('manual_curated');
  });

  it('sourceTypeLabel is Curated', () => {
    expect(view?.sourceTypeLabel).toBe('Curated');
  });
});

// ---------------------------------------------------------------------------
// Signal detail view — unknown slug
// ---------------------------------------------------------------------------

describe('I3 · buildIntelligenceSignalDetailView — unknown slug', () => {
  it('returns null for an unknown signal ID', () => {
    expect(buildIntelligenceSignalDetailView('unknown-signal-xyz')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(buildIntelligenceSignalDetailView('')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('I3 · determinism', () => {
  it('buildIntelligenceSignalsIndexView returns identical output on repeated calls', () => {
    const a = buildIntelligenceSignalsIndexView();
    const b = buildIntelligenceSignalsIndexView();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('buildIntelligenceSignalDetailView returns identical output on repeated calls', () => {
    const a = buildIntelligenceSignalDetailView('sig-src-2025-001');
    const b = buildIntelligenceSignalDetailView('sig-src-2025-001');
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ---------------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------------

describe('I3 · module hygiene', () => {
  const FORBIDDEN = ['fetch(', 'Date.now(', 'Math.random(', 'new Date('];

  const VIEW_FILES = [
    'src/lib/intelligence/intelligence-signals-index-view.ts',
    'src/lib/intelligence/intelligence-signal-detail-view.ts',
  ];

  for (const rel of VIEW_FILES) {
    it(`${rel} does not contain forbidden patterns`, () => {
      const src = readFile(rel);
      for (const pattern of FORBIDDEN) {
        expect(src).not.toContain(pattern);
      }
    });
  }

  it('intelligence-signals-index-view.ts does not import from src/lib/auth', () => {
    const src = readFile('src/lib/intelligence/intelligence-signals-index-view.ts');
    expect(src).not.toContain("from '@/lib/auth");
  });

  it('intelligence-signal-detail-view.ts does not import from src/lib/auth', () => {
    const src = readFile('src/lib/intelligence/intelligence-signal-detail-view.ts');
    expect(src).not.toContain("from '@/lib/auth");
  });

  it('IntelligenceSignalsIndexPage.tsx is NOT a use client component', () => {
    const src = readFile('src/components/intelligence/IntelligenceSignalsIndexPage.tsx');
    expect(src.startsWith("'use client'")).toBe(false);
    expect(src.startsWith('"use client"')).toBe(false);
  });

  it('IntelligenceSignalDetailPage.tsx is NOT a use client component', () => {
    const src = readFile('src/components/intelligence/IntelligenceSignalDetailPage.tsx');
    expect(src.startsWith("'use client'")).toBe(false);
    expect(src.startsWith('"use client"')).toBe(false);
  });

  it('IntelligenceSignalsSentinel.tsx IS a use client component', () => {
    const src = readFile('src/components/intelligence/IntelligenceSignalsSentinel.tsx');
    expect(src.startsWith("'use client'")).toBe(true);
  });

  it('IntelligenceSignalDetailSentinel.tsx IS a use client component', () => {
    const src = readFile('src/components/intelligence/IntelligenceSignalDetailSentinel.tsx');
    expect(src.startsWith("'use client'")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// File existence
// ---------------------------------------------------------------------------

describe('I3 · file existence', () => {
  const REQUIRED_FILES = [
    'src/lib/intelligence/intelligence-signals-index-view.ts',
    'src/lib/intelligence/intelligence-signal-detail-view.ts',
    'src/components/intelligence/IntelligenceSignalsIndexPage.tsx',
    'src/components/intelligence/IntelligenceSignalDetailPage.tsx',
    'src/components/intelligence/IntelligenceSignalsSentinel.tsx',
    'src/components/intelligence/IntelligenceSignalDetailSentinel.tsx',
    'src/app/intelligence/signals/page.tsx',
    'src/app/intelligence/signals/[signalId]/page.tsx',
  ];

  for (const rel of REQUIRED_FILES) {
    it(`${rel} exists`, () => {
      expect(fileExists(rel)).toBe(true);
    });
  }
});
