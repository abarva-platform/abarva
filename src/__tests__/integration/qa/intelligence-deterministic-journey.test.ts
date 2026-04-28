import { readFileSync } from 'fs';
import { join } from 'path';

import { buildIntelligenceDeterministicJourneyManifest } from '@/lib/qa/intelligence-deterministic-journey';

describe('QA33 Intelligence deterministic journey manifest', () => {
  it('declares canonical Sentinel landing and pattern-detail routes', () => {
    const manifest = buildIntelligenceDeterministicJourneyManifest();

    expect(manifest.id).toBe('qa33-intelligence-deterministic-journey');
    expect(manifest.agent).toBe('Sentinel');
    expect(manifest.landingRoute).toBe('/tenant/apex-retail/intelligence');
    expect(manifest.patternDetailRoute).toBe('/tenant/apex-retail/intelligence/patterns/[patternKey]');
    expect(manifest.createdFrom).toBe('deterministic_seed_manifest');
  });

  it('covers all deterministic canvas modes and pattern-detail depth primitives', () => {
    const manifest = buildIntelligenceDeterministicJourneyManifest();

    expect(manifest.canvasModes).toEqual(['summary', 'evidence', 'programs', 'actions']);
    expect(manifest.detailDepth).toEqual([
      'provenance_ribbon',
      'source_basis_panel',
      'evidence_dataset_drawer',
      'interaction_rail',
    ]);
    expect(manifest.checkpoints.length).toBeGreaterThanOrEqual(10);
    expect(manifest.checkpoints.every((checkpoint) => checkpoint.deterministicSeedOnly)).toBe(true);
  });

  it('matches the existing route and component wiring on disk', () => {
    const landingRoute = readWorkspaceFile('src/app/(maestro)/tenant/[tenantSlug]/intelligence/page.tsx');
    const detailRoute = readWorkspaceFile(
      'src/app/(maestro)/tenant/[tenantSlug]/intelligence/patterns/[patternKey]/page.tsx',
    );
    const detailComponent = readWorkspaceFile('src/components/intelligence/SentinelPatternDetail.tsx');
    const canvasHelper = readWorkspaceFile('src/lib/intelligence/intelligence-canvas-modes.ts');

    // I1: IntelligenceRouteShell retired — route directly renders IntelligenceLensTabs.
    expect(landingRoute).not.toContain('IntelligenceRouteShell');
    expect(landingRoute).toContain('IntelligenceLensTabs');
    expect(detailRoute).toContain('SentinelPatternDetail');
    expect(detailRoute).toContain('IntelligenceCanvasModeTabs');
    for (const mode of ['summary', 'evidence', 'programs', 'actions']) {
      expect(canvasHelper).toContain(`'${mode}'`);
    }
    expect(detailComponent).toContain('IntelligenceProvenanceRibbon');
    expect(detailComponent).toContain('IntelligenceSourceBasisPanel');
    expect(detailComponent).toContain('EvidenceDatasetDrawer');
    expect(detailComponent).toContain('SentinelInteractionRail');
  });

  it('does not claim real browser smoke, live retrieval, model invocation, or migrations', () => {
    const manifest = buildIntelligenceDeterministicJourneyManifest();
    const source = readWorkspaceFile('src/lib/qa/intelligence-deterministic-journey.ts');
    const serialized = JSON.stringify(manifest).toLowerCase();

    expect(manifest.smokeStatus).toBe('manifest_only_pre_browser_smoke');
    expect(serialized).toContain('not a playwright smoke test');
    expect(source).not.toMatch(/fetch\(|chromium|page\.goto|browser\.newpage/i);
    expect(source).not.toMatch(/openai|anthropic|claude|pinecone|supabase/i);
    expect(source).not.toMatch(/db:migrate|createMigration|Date\.now|Math\.random/);
  });

  it('is byte-stable across repeated builds', () => {
    const first = buildIntelligenceDeterministicJourneyManifest();
    const second = buildIntelligenceDeterministicJourneyManifest();

    expect(second).toEqual(first);
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });
});

function readWorkspaceFile(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}
