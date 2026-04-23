import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';
import {
  getPatternApplicablePrograms,
  getPatternApplicableProgramsForTenant,
  getPatternManifestEntries,
  getPatternManifestEntry,
  patternRouteFor,
} from '@/lib/intelligence/pattern-manifest';

describe('intelligence pattern manifest', () => {
  it('covers the demo-critical pattern pack routes', () => {
    const entries = getPatternManifestEntries();
    const slugs = new Set(entries.map((entry) => entry.slug));

    expect(Array.from(slugs)).toEqual(expect.arrayContaining([
      'owned-brand-margin-recovery',
      'demand-forecasting-inventory-ai',
      'analytics-modernization',
      'ai-use-case-portfolio-management',
    ]));

    for (const slug of slugs) {
      const entry = getPatternManifestEntry(slug);
      expect(entry?.slug).toBe(slug);
      expect(patternRouteFor(slug)).toBe(`/intelligence/patterns/${encodeURIComponent(slug)}`);
    }
  });

  it('resolves every non-null tenant portfolio pattern slug', () => {
    const plan = buildAllProgramsSeedPlan();
    const patternSlugs = Array.from(new Set(
      plan.programs
        .map((program) => program.patternSlug)
        .filter((slug): slug is string => Boolean(slug)),
    ));

    expect(patternSlugs.length).toBeGreaterThan(0);
    for (const slug of patternSlugs) {
      expect(getPatternManifestEntry(slug)?.slug).toBe(slug);
    }
  });

  it('does not emit localhost pattern routes', () => {
    const serialized = JSON.stringify(getPatternManifestEntries());
    expect(serialized).not.toContain('abarva.local');
    expect(serialized).not.toContain('/Users/');

    for (const entry of getPatternManifestEntries()) {
      expect(patternRouteFor(entry.slug)).toMatch(/^\/intelligence\/patterns\//);
      expect(patternRouteFor(entry.id)).toMatch(/^\/intelligence\/patterns\//);
      expect(entry.lastUpdatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(entry.evidenceCount).toBeGreaterThanOrEqual(0);
      expect(entry.observationCount).toBeGreaterThanOrEqual(entry.observations.length);
    }
  });

  it('wires Morrison D17 back to the owned-brand pattern bidirectionally', () => {
    const programs = getPatternApplicablePrograms('owned-brand-margin-recovery');
    const morrison = programs.find((program) => program.programSlug === 'morrison-owned-brand-margin-recovery');

    expect(morrison).toBeTruthy();
    expect(morrison?.clientDisplayName).toMatch(/Apex/i);
    expect(morrison?.currentPhaseSpec).toBeGreaterThanOrEqual(3);
    expect(morrison?.routePath).toBe('/tenant/apex-retail/programs/morrison-owned-brand-margin-recovery');
    expect(morrison?.deliverables.some((deliverable) => deliverable.code === 'D17' && deliverable.renderTier === 'rich')).toBe(true);

    const apexPrograms = getPatternApplicableProgramsForTenant('owned-brand-margin-recovery', 'apex-retail');
    expect(apexPrograms.map((program) => program.programSlug)).toContain('morrison-owned-brand-margin-recovery');
  });
});
