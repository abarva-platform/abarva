import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

import {
  buildIntelligenceDeterministicJourneyManifest,
  describeJourneyEvidenceDefects,
} from '@/lib/qa/intelligence-deterministic-journey';

describe('QA33 Intelligence deterministic journey manifest', () => {
  it('declares canonical Sentinel landing and pattern-detail routes', () => {
    const manifest = buildIntelligenceDeterministicJourneyManifest();

    expect(manifest.id).toBe('qa33-intelligence-deterministic-journey');
    expect(manifest.agent).toBe('Sentinel');
    expect(manifest.landingRoute).toBe('/intelligence');
    // There is no pattern-detail route to declare. Null is the claim.
    expect(manifest.patternDetailRoute).toBeNull();
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
    // This case used to hold its own hardcoded copy of the evidence paths,
    // so the manifest and the test could each drift from the repository
    // independently — and both did, for the same four files. Driving it from
    // the manifest's own evidence removes the second copy, so there is one
    // list and it is the one the product claims.
    const manifest = buildIntelligenceDeterministicJourneyManifest();
    const defects = describeJourneyEvidenceDefects(manifest, (relativePath) =>
      existsSync(join(process.cwd(), relativePath)),
    );

    expect(defects).toEqual([]);

    const landingRoute = readWorkspaceFile('src/app/(maestro)/intelligence/page.tsx');
    expect(landingRoute).toContain('AdvisoryIntelligencePage');
  });

  it('does not claim coverage of the journey the sunset removed', () => {
    // The assertions this case replaces were not weakened — they were
    // pointing at files deleted in July, and had been failing unseen because
    // no workflow runs this directory. What they asserted is now recorded as
    // an explicit loss rather than an unexamined red.
    const manifest = buildIntelligenceDeterministicJourneyManifest();
    const removed = manifest.checkpoints.filter((c) => c.subjectState === 'removed');

    expect(removed).toHaveLength(9);
    expect(removed.map((c) => c.id)).toContain('qa33-route-pattern-detail');
    for (const checkpoint of removed) {
      expect(checkpoint.removedNote?.trim()).toBeTruthy();
      expect(checkpoint.evidence.some((e) => e.startsWith('src/'))).toBe(false);
    }
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
