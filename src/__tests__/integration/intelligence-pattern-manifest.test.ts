import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';
import {
  getPatternApplicablePrograms,
  getPatternApplicableProgramsForTenant,
  getPatternManifestEntries,
  getPatternManifestEntry,
  patternMatchesIndustry,
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
      expect(Number.isInteger(entry.observationCount)).toBe(true);
      expect(entry.observationCount).toBeGreaterThanOrEqual(0);
      for (const observation of entry.observations) {
        expect(typeof observation).toBe('string');
        expect(observation.trim()).not.toBe('');
      }
    }
  });

  // This case replaces `observationCount >= observations.length`, asserted
  // over every entry, which was written on 2026-05-30 against a manifest
  // holding 17 patterns from one design pack. It was true then — zero
  // violations at 5d795a397. The 2026-06-20 SCB W2.1 expansion
  // (docs/releases/records/2026-06-20-scb-w2-1-pattern-manifest.md) took the
  // manifest to 3,569 patterns by merging three further corpora, and two of
  // them populate `observations` with SOURCE REFERENCES rather than
  // observation statements:
  //
  //   genome_seed_jsonl (3,051) — 9,214 observations, none of them a path or
  //     a URL; `observationCount` equals the list length for all 3,051.
  //   pattern_seed (498)        — 1,579 observations, 1,391 of them a repo
  //     path or a vendor URL, and `observationCount` is an independently
  //     authored evidence figure. 402 entries are below the list length and
  //     88 are above it, so the two fields are plainly not counting the
  //     same thing.
  //
  // One field name, two meanings, split by source system. Restating the old
  // assertion over all 3,569 entries would be asserting something false; the
  // property it stood for — a pattern's declared evidence count agrees with
  // the evidence attached to it — is asserted below on the corpus where the
  // field means that, and the divergence is pinned rather than hidden so the
  // day a genome pattern drifts, this fails. Whether `observations` should
  // carry source references at all is a data-model question and is filed as
  // a backlog item, not decided here.
  const KNOWN_SOURCE_SYSTEMS = [
    'pattern_seed',
    'source_lifecycle_pattern',
    'genome_seed_jsonl',
    'legacy_design_pack_compat',
  ];

  it('declares a known source system for every pattern', () => {
    const entries = getPatternManifestEntries();
    expect(entries.length).toBeGreaterThan(0);

    // A fourth corpus must be classified before it can inherit either
    // meaning of `observations` by default.
    for (const entry of entries) {
      expect(KNOWN_SOURCE_SYSTEMS).toContain(entry.sourceSystem);
    }
  });

  it('keeps observationCount equal to the observation list on the corpus where they count the same thing', () => {
    const genome = getPatternManifestEntries().filter(
      (entry) => entry.sourceSystem === 'genome_seed_jsonl',
    );

    expect(genome.length).toBeGreaterThan(0);

    const drifted = genome.filter(
      (entry) => entry.observationCount !== entry.observations.length,
    );

    expect(drifted.map((entry) => entry.slug)).toEqual([]);
  });

  it('confines the observationCount/observations divergence to the authored seed corpora', () => {
    const divergent = getPatternManifestEntries().filter(
      (entry) => entry.observationCount !== entry.observations.length,
    );

    // The divergence is real and is not being asserted away: it exists, and
    // every entry carrying it comes from an authored seed corpus. If it ever
    // reaches the genome corpus, the case above fails first and this one
    // names the entry.
    expect(divergent.length).toBeGreaterThan(0);
    for (const entry of divergent) {
      expect(entry.sourceSystem).not.toBe('genome_seed_jsonl');
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

  it('maps tenant industry aliases onto manifest sectors', () => {
    const priorAuth = getPatternManifestEntry('prior-authorization-automation');
    expect(priorAuth).toBeTruthy();
    expect(patternMatchesIndustry(priorAuth!, 'HEALTHCARE_IDN')).toBe(true);
    expect(patternMatchesIndustry(priorAuth!, 'healthcare')).toBe(true);
  });
});
