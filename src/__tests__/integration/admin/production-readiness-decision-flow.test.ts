// ── PROD8 (wave-17): ProductionReadinessDecisionFlow type/source tests ──────
// No React rendering, no jsdom. Pure type and source-string assertions.

import * as fs from 'fs';
import * as path from 'path';
import { ProductionReadinessDecisionFlow } from '@/components/admin/ProductionReadinessDecisionFlow';

const repoRoot = path.resolve(__dirname, '../../../../');
const componentSource = fs.readFileSync(
  path.join(
    repoRoot,
    'src/components/admin/ProductionReadinessDecisionFlow.tsx',
  ),
  'utf8',
);
const pageSource = fs.readFileSync(
  path.join(
    repoRoot,
    'src/app/(maestro)/platform/admin/production-readiness/page.tsx',
  ),
  'utf8',
);

describe('ProductionReadinessDecisionFlow (PROD8)', () => {
  it('exports a function', () => {
    expect(typeof ProductionReadinessDecisionFlow).toBe('function');
  });

  it('component source contains demo-readiness wording', () => {
    expect(
      /Can we demo|demo-ready/i.test(componentSource),
    ).toBe(true);
  });

  it('component source contains pilot wording', () => {
    expect(/Can we pilot|pilot/i.test(componentSource)).toBe(true);
  });

  it('component source contains production-blocker wording', () => {
    expect(
      /blocks production|production blocker/i.test(componentSource),
    ).toBe(true);
  });

  it('component source contains a Next-actions section', () => {
    expect(
      /Next five actions|Next 5 actions|Next actions/i.test(componentSource),
    ).toBe(true);
  });

  it('component source contains "manifest-backed" live caveat language', () => {
    expect(/manifest-backed/i.test(componentSource)).toBe(true);
  });

  it('component source declares it is not a live monitoring feed', () => {
    expect(
      /not a live|not live|not connected to/i.test(componentSource),
    ).toBe(true);
  });

  it('component source does NOT contain teal hex colors', () => {
    expect(/#14B8A6/i.test(componentSource)).toBe(false);
    expect(/#0E9F8C/i.test(componentSource)).toBe(false);
  });

  it('component source does NOT promote production_ready: true', () => {
    expect(/production_ready\s*:\s*true/i.test(componentSource)).toBe(false);
  });

  it('page source imports ProductionReadinessDecisionFlow', () => {
    expect(
      /import\s*\{[^}]*ProductionReadinessDecisionFlow[^}]*\}\s*from/i.test(
        pageSource,
      ),
    ).toBe(true);
  });

  it('page source still imports ProductionReadinessTracker', () => {
    expect(
      /import\s*\{[^}]*ProductionReadinessTracker[^}]*\}\s*from/i.test(
        pageSource,
      ),
    ).toBe(true);
  });

  it('component source uses navy accent or imports from abarva-theme', () => {
    const usesNavy = /#1B2B5C/i.test(componentSource);
    const importsAbarvaTheme = /from\s+['"]@\/lib\/design\/abarva-theme['"]/.test(
      componentSource,
    );
    expect(usesNavy || importsAbarvaTheme).toBe(true);
  });
});
