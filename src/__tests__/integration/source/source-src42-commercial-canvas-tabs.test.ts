// SRC42 · Commercial active canvas tab consolidation.
//
// Verifies the structural invariants added in SRC42:
//   1. SourceEventDetailPage has 8 TabKey values including summary/readiness/missions
//   2. TABS array includes Summary, Readiness, Missions entries
//   3. Default activeTab is 'summary' (not 'bafo')
//   4. SummaryTab, ReadinessTab, MissionsTab components are present
//   5. All three new tabs have correct testids and honest disclaimers
//   6. Render switch wires all 8 tabs

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const PAGE_PATH = join(
  process.cwd(),
  'src/components/source/SourceEventDetailPage.tsx',
);

const src = readFileSync(PAGE_PATH, 'utf8');

// ─── TabKey definition ────────────────────────────────────────────────────────

describe('SRC42 · SourceEventDetailPage · TabKey', () => {
  it('includes summary', () => {
    expect(src).toContain("'summary'");
  });

  it('includes readiness', () => {
    expect(src).toContain("'readiness'");
  });

  it('includes missions', () => {
    expect(src).toContain("'missions'");
  });

  it('has TabKey type with all 8 values', () => {
    expect(src).toContain(
      "type TabKey = 'summary' | 'pricing' | 'bafo' | 'risk' | 'readiness' | 'missions' | 'signals' | 'program'"
    );
  });
});

// ─── TABS array ───────────────────────────────────────────────────────────────

describe('SRC42 · SourceEventDetailPage · TABS array', () => {
  it('has Summary tab entry', () => {
    expect(src).toContain("{ key: 'summary', label: 'Summary' }");
  });

  it('has Readiness tab entry', () => {
    expect(src).toContain("{ key: 'readiness', label: 'Readiness' }");
  });

  it('has Missions tab entry', () => {
    expect(src).toContain("{ key: 'missions', label: 'Missions' }");
  });
});

// ─── Default active tab ───────────────────────────────────────────────────────

describe('SRC42 · SourceEventDetailPage · default active tab', () => {
  it("defaults to 'summary' not 'bafo'", () => {
    expect(src).toContain("useState<TabKey>('summary')");
  });

  it("does not default to 'bafo'", () => {
    expect(src).not.toContain("useState<TabKey>('bafo')");
  });
});

// ─── SummaryTab component ─────────────────────────────────────────────────────

describe('SRC42 · SummaryTab', () => {
  it('function is defined', () => {
    expect(src).toContain('function SummaryTab()');
  });

  it('has data-testid="source-summary-tab"', () => {
    expect(src).toContain('data-testid="source-summary-tab"');
  });

  it('has data-honest-disclaimer="source-summary"', () => {
    expect(src).toContain('data-honest-disclaimer="source-summary"');
  });

  it('honest disclaimer mentions Deterministic seed', () => {
    const idx = src.indexOf('data-honest-disclaimer="source-summary"');
    const snippet = src.slice(idx, idx + 300);
    expect(snippet).toContain('Deterministic seed');
  });
});

// ─── ReadinessTab component ───────────────────────────────────────────────────

describe('SRC42 · ReadinessTab', () => {
  it('function is defined', () => {
    expect(src).toContain('function ReadinessTab()');
  });

  it('has data-testid="source-readiness-tab"', () => {
    expect(src).toContain('data-testid="source-readiness-tab"');
  });

  it('has data-honest-disclaimer="source-readiness"', () => {
    expect(src).toContain('data-honest-disclaimer="source-readiness"');
  });

  it('honest disclaimer mentions Deterministic seed', () => {
    const idx = src.indexOf('data-honest-disclaimer="source-readiness"');
    const snippet = src.slice(idx, idx + 300);
    expect(snippet).toContain('Deterministic seed');
  });
});

// ─── MissionsTab component ────────────────────────────────────────────────────

describe('SRC42 · MissionsTab', () => {
  it('function is defined', () => {
    expect(src).toContain('function MissionsTab()');
  });

  it('has data-testid="source-missions-tab"', () => {
    expect(src).toContain('data-testid="source-missions-tab"');
  });

  it('has data-honest-disclaimer="source-missions"', () => {
    expect(src).toContain('data-honest-disclaimer="source-missions"');
  });

  it('honest disclaimer mentions Deterministic seed', () => {
    const idx = src.indexOf('data-honest-disclaimer="source-missions"');
    const snippet = src.slice(idx, idx + 300);
    expect(snippet).toContain('Deterministic seed');
  });
});

// ─── Render switch ────────────────────────────────────────────────────────────

describe('SRC42 · SourceEventDetailPage · render switch', () => {
  it("wires summary tab", () => {
    expect(src).toContain("{activeTab === 'summary' && <SummaryTab />}");
  });

  it("wires readiness tab", () => {
    expect(src).toContain("{activeTab === 'readiness' && <ReadinessTab />}");
  });

  it("wires missions tab", () => {
    expect(src).toContain("{activeTab === 'missions' && <MissionsTab />}");
  });

  it("wires bafo tab", () => {
    expect(src).toContain("{activeTab === 'bafo' && <BafoStrategyTab />}");
  });

  it("wires pricing tab", () => {
    expect(src).toContain("{activeTab === 'pricing' && <PricingNormalizationTab />}");
  });

  it("wires risk tab", () => {
    expect(src).toContain("{activeTab === 'risk' && <RiskDetectionTab />}");
  });

  it("wires signals tab", () => {
    expect(src).toContain("{activeTab === 'signals' && <SignalsStreamTab />}");
  });

  it("wires program tab", () => {
    expect(src).toContain("{activeTab === 'program' && <LinkedProgramTab />}");
  });
});
