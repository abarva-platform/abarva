import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  buildProductionReadinessSummary,
  type ReadinessSummary,
} from '@/lib/admin/production-readiness-summary';

const summarySourcePath = resolve(
  __dirname,
  '../../../lib/admin/production-readiness-summary.ts',
);

describe('buildProductionReadinessSummary — shape and safety invariants', () => {
  let summary: ReadinessSummary;

  beforeAll(() => {
    summary = buildProductionReadinessSummary();
  });

  it('returns a summary object', () => {
    expect(summary).toBeDefined();
    expect(typeof summary).toBe('object');
  });

  it('generatedAt is hardcoded to 2026-04-26', () => {
    expect(summary.generatedAt).toBe('2026-04-26');
  });

  it('overallReadinessPercent is > 0 and <= 100', () => {
    expect(summary.overallReadinessPercent).toBeGreaterThan(0);
    expect(summary.overallReadinessPercent).toBeLessThanOrEqual(100);
  });

  it('productionReadyClaim is always false', () => {
    expect(summary.productionReadyClaim).toBe(false);
  });

  it('topBlockers is an array', () => {
    expect(Array.isArray(summary.topBlockers)).toBe(true);
  });

  it('next5Actions has at most 5 items', () => {
    expect(summary.next5Actions.length).toBeLessThanOrEqual(5);
    expect(Array.isArray(summary.next5Actions)).toBe(true);
  });

  it('closestToPilotReady is a non-empty array of component ID strings', () => {
    expect(Array.isArray(summary.closestToPilotReady)).toBe(true);
    expect(summary.closestToPilotReady.length).toBeGreaterThan(0);
    for (const id of summary.closestToPilotReady) {
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    }
  });

  it('furthestFromProductionReady is a non-empty array of component ID strings', () => {
    expect(Array.isArray(summary.furthestFromProductionReady)).toBe(true);
    expect(summary.furthestFromProductionReady.length).toBeGreaterThan(0);
    for (const id of summary.furthestFromProductionReady) {
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    }
  });

  it('liveStatusCaveat mentions "static manifest" or "not live monitoring"', () => {
    const caveat = summary.liveStatusCaveat.toLowerCase();
    const mentionsStaticManifest = caveat.includes('static manifest');
    const mentionsNotLiveMonitoring = caveat.includes('not live monitoring') ||
      caveat.includes('does not reflect live monitoring');
    expect(mentionsStaticManifest || mentionsNotLiveMonitoring).toBe(true);
  });

  it('liveStatusCaveat is a non-empty string', () => {
    expect(typeof summary.liveStatusCaveat).toBe('string');
    expect(summary.liveStatusCaveat.trim().length).toBeGreaterThan(0);
  });

  it('manifestFreshness is a non-empty string', () => {
    expect(typeof summary.manifestFreshness).toBe('string');
    expect(summary.manifestFreshness.trim().length).toBeGreaterThan(0);
  });

  it('overallReadiness does not contain "production_ready" string', () => {
    expect(summary.overallReadiness).not.toContain('production_ready');
  });

  it('overallReadiness is a non-empty string', () => {
    expect(typeof summary.overallReadiness).toBe('string');
    expect(summary.overallReadiness.trim().length).toBeGreaterThan(0);
  });

  it('pilotReadiness is a non-empty narrative string', () => {
    expect(typeof summary.pilotReadiness).toBe('string');
    expect(summary.pilotReadiness.trim().length).toBeGreaterThan(0);
  });

  it('productionReadiness is a non-empty narrative string', () => {
    expect(typeof summary.productionReadiness).toBe('string');
    expect(summary.productionReadiness.trim().length).toBeGreaterThan(0);
  });
});

describe('buildProductionReadinessSummary — real data correctness', () => {
  it('is deterministic across two calls', () => {
    const first = buildProductionReadinessSummary();
    const second = buildProductionReadinessSummary();
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it('topBlockers entries each contain a component id prefix in brackets', () => {
    const summary = buildProductionReadinessSummary();
    for (const blocker of summary.topBlockers) {
      expect(blocker).toMatch(/^\[.+\]/);
    }
  });

  it('next5Actions entries each contain a component id prefix in brackets', () => {
    const summary = buildProductionReadinessSummary();
    for (const action of summary.next5Actions) {
      expect(action).toMatch(/^\[.+\]/);
    }
  });

  it('closestToPilotReady does not include model_gateway (not_started)', () => {
    const summary = buildProductionReadinessSummary();
    expect(summary.closestToPilotReady).not.toContain('model_gateway');
  });

  it('furthestFromProductionReady includes model_gateway (not_started)', () => {
    const summary = buildProductionReadinessSummary();
    expect(summary.furthestFromProductionReady).toContain('model_gateway');
  });

  it('topBlockers contains critical blockers from the manifest', () => {
    const summary = buildProductionReadinessSummary();
    const allText = summary.topBlockers.join(' ');
    // There are multiple critical blockers; at least one must surface
    const hasCritical = allText.toLowerCase().includes('critical') ||
      summary.topBlockers.some((b) => b.includes('(critical)'));
    expect(hasCritical).toBe(true);
  });

  it('productionReadyClaim is false regardless of overallReadinessPercent', () => {
    // This test documents the invariant: productionReadyClaim must ALWAYS be false
    const summary = buildProductionReadinessSummary();
    expect(summary.productionReadyClaim).toBe(false);
    // TypeScript enforces this at the type level too (type is `false`, not boolean)
    const claim: false = summary.productionReadyClaim;
    expect(claim).toBe(false);
  });
});

describe('buildProductionReadinessSummary — module hygiene', () => {
  const sourceText = readFileSync(summarySourcePath, 'utf8');

  it('does not import forbidden product/runtime modules', () => {
    expect(sourceText).not.toMatch(/from '@\/lib\/source\//);
    expect(sourceText).not.toMatch(/from '@\/lib\/nexus\//);
    expect(sourceText).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(sourceText).not.toMatch(/from '@\/lib\/atlas\//);
    expect(sourceText).not.toMatch(/from '@\/lib\/agent\//);
    expect(sourceText).not.toMatch(/from '@\/lib\/auth\//);
    expect(sourceText).not.toMatch(/supabase/i);
  });

  it('does not call models, external APIs, or non-deterministic clocks', () => {
    expect(sourceText).not.toMatch(/anthropic/i);
    expect(sourceText).not.toMatch(/openai/i);
    expect(sourceText).not.toMatch(/\bfetch\(/);
    expect(sourceText).not.toMatch(/Date\.now\(/);
    expect(sourceText).not.toMatch(/Math\.random\(/);
    expect(sourceText).not.toMatch(/new Date\(/);
  });

  it('does not use React hooks or "use client" directive', () => {
    expect(sourceText).not.toMatch(/'use client'/);
    expect(sourceText).not.toMatch(/useState/);
    expect(sourceText).not.toMatch(/useEffect/);
  });

  it('productionReadyClaim is never set to true in the source', () => {
    // Ensure no code path can set productionReadyClaim: true
    expect(sourceText).not.toMatch(/productionReadyClaim:\s*true/);
  });

  it('liveStatusCaveat string in source explicitly mentions static manifest and not live monitoring', () => {
    expect(sourceText).toContain('static manifest (production-readiness.json)');
    expect(sourceText).toContain('does not reflect live monitoring');
  });
});
