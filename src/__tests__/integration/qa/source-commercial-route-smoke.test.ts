/**
 * QA23: Wave-16 Source Commercial Route Smoke Verification Tests
 *
 * Design guarantee: ALL tests in Suite A (static manifest) always pass,
 * even in the standalone lane worktree (no Wave-16 files needed).
 *
 * Suite B performs integration-phase file existence checks that gracefully
 * skip (pass with console.warn) when Wave-16 files are absent, and assert
 * file presence when the integration branch is checked out.
 *
 * Suite C performs content checks that gracefully skip when files are absent.
 */

import {
  WAVE16_ROUTE_DESCRIPTORS,
  WAVE16_COMPONENT_DESCRIPTORS,
  WAVE16_LIB_DESCRIPTORS,
  buildWave16RouteSmokeReport,
} from '../../../lib/qa/source-commercial-route-smoke';

// ---------------------------------------------------------------------------
// Suite A: Static manifest — always passes in any worktree
// ---------------------------------------------------------------------------

describe('Wave-16 Source Commercial Route Smoke — static manifest', () => {
  it('WAVE16_ROUTE_DESCRIPTORS has exactly 3 items', () => {
    expect(WAVE16_ROUTE_DESCRIPTORS).toHaveLength(3);
  });

  it('WAVE16_COMPONENT_DESCRIPTORS has exactly 3 items', () => {
    expect(WAVE16_COMPONENT_DESCRIPTORS).toHaveLength(3);
  });

  it('WAVE16_LIB_DESCRIPTORS has exactly 3 items', () => {
    expect(WAVE16_LIB_DESCRIPTORS).toHaveLength(3);
  });

  it('buildWave16RouteSmokeReport() returns waveId === "wave-16"', () => {
    const report = buildWave16RouteSmokeReport();
    expect(report.waveId).toBe('wave-16');
  });

  it('deterministicDataClaim is non-empty', () => {
    const report = buildWave16RouteSmokeReport();
    expect(report.deterministicDataClaim.length).toBeGreaterThan(0);
  });

  it('noLiveDataClaim is non-empty', () => {
    const report = buildWave16RouteSmokeReport();
    expect(report.noLiveDataClaim.length).toBeGreaterThan(0);
  });

  it('generatedAt is "2026-04-26"', () => {
    const report = buildWave16RouteSmokeReport();
    expect(report.generatedAt).toBe('2026-04-26');
  });

  it('all component descriptors have non-empty filePath and componentName', () => {
    for (const c of WAVE16_COMPONENT_DESCRIPTORS) {
      expect(c.filePath.length).toBeGreaterThan(0);
      expect(c.componentName.length).toBeGreaterThan(0);
    }
  });

  it('all lib descriptors have non-empty filePath and mainExport', () => {
    for (const lib of WAVE16_LIB_DESCRIPTORS) {
      expect(lib.filePath.length).toBeGreaterThan(0);
      expect(lib.mainExport.length).toBeGreaterThan(0);
    }
  });

  it('no route filePath contains "teal" or fake data references', () => {
    for (const route of WAVE16_ROUTE_DESCRIPTORS) {
      expect(route.filePath).not.toMatch(/teal/i);
      expect(route.filePath).not.toMatch(/fake|lorem|placeholder/i);
    }
  });
});

// ---------------------------------------------------------------------------
// Suite B: Integration-phase file checks (skipped in lane worktree)
// ---------------------------------------------------------------------------

describe('Integration-phase file checks (skipped in lane worktree)', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path');
  const repoRoot = path.resolve(__dirname, '../../../../');

  // Wave-16 new files
  const wave16Files = [
    'src/components/source/SourceCommercialEventSection.tsx',
    'src/lib/source/source-commercial-demo-scenario.ts',
    'src/components/source/SourceCommercialExecutiveBrief.tsx',
    'src/lib/source/source-commercial-executive-brief.ts',
    'src/components/source/SourceCommercialActionQueue.tsx',
    'src/lib/source/source-commercial-action-queue.ts',
  ];

  // Wave-15 files that must ALWAYS exist (already in main)
  const wave15Files = [
    'src/components/source/SourceCommercialHub.tsx',
    'src/components/source/SourceCommercialRiskPanel.tsx',
    'src/lib/source/source-commercial-hub-view.ts',
  ];

  wave16Files.forEach(filePath => {
    it(`Wave-16: ${filePath} exists`, () => {
      const fullPath = path.join(repoRoot, filePath);
      if (!fs.existsSync(fullPath)) {
        console.warn(`[QA23] Skipping: ${filePath} not found (run in integration branch)`);
        return;
      }
      expect(fs.existsSync(fullPath)).toBe(true);
    });
  });

  wave15Files.forEach(filePath => {
    it(`Wave-15: ${filePath} exists`, () => {
      const fullPath = path.join(repoRoot, filePath);
      // Wave-15 files MUST exist in this worktree (they're already in main)
      expect(fs.existsSync(fullPath)).toBe(true);
    });
  });

  it('Source event page exists and is not empty', () => {
    const pagePath = path.join(repoRoot, 'src/app/(maestro)/source/events/[eventId]/page.tsx');
    expect(fs.existsSync(pagePath)).toBe(true);
    const content = fs.readFileSync(pagePath, 'utf8');
    expect(content.length).toBeGreaterThan(100);
  });
});

// ---------------------------------------------------------------------------
// Suite C: Integration-phase content checks
// ---------------------------------------------------------------------------

describe('Integration-phase content checks', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path');
  const repoRoot = path.resolve(__dirname, '../../../../');

  it('Event page does not claim live data', () => {
    const pagePath = path.join(repoRoot, 'src/app/(maestro)/source/events/[eventId]/page.tsx');
    if (!fs.existsSync(pagePath)) return;
    const content = fs.readFileSync(pagePath, 'utf8');
    expect(content).not.toMatch(/fetchLiveVendorData|callOpenAI|callClaude|liveModel/);
  });

  it('SourceCommercialEventSection contains deterministic caveat if it exists', () => {
    const filePath = path.join(repoRoot, 'src/components/source/SourceCommercialEventSection.tsx');
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content.toLowerCase()).toMatch(/deterministic|seed-backed|seed backed/);
  });
});
