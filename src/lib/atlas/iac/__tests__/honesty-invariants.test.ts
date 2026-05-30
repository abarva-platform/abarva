/**
 * Honesty invariants for the Initiative-Archetype Corpus.
 *
 * Mirrors the discipline the Atlas P0 audit closed (PR #2562). If these
 * pass, the IAC cannot re-introduce fabricated industry-context claims at
 * Atlas runtime.
 */

import { INITIATIVE_ARCHETYPES } from '../registry';
import type {
  AdoptionMetric,
  DeploymentPattern,
  EvidenceAnchor,
  InitiativeArchetype,
  PeerBenchmark,
  PlanningRange,
} from '../types';

const DATE_RE = /^\d{4}-\d{2}(-\d{2})?$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const BANNED_PHRASES = [
  'industry standard',
  'everyone is doing',
  'best practice',
];

function expectValidDate(value: string, context: string): void {
  expect(value).toBeDefined();
  expect(typeof value).toBe('string');
  expect(value.length).toBeGreaterThan(0);
  if (!DATE_RE.test(value)) {
    throw new Error(`${context}: expected YYYY-MM or YYYY-MM-DD, got "${value}"`);
  }
}

function expectPlanningRange(range: PlanningRange, context: string): void {
  expect(range).toBeDefined();
  expect(range.label).toBe('planning-range');
  expect(typeof range.low).toBe('number');
  expect(typeof range.high).toBe('number');
  expect(range.high).toBeGreaterThanOrEqual(range.low);
  expect(typeof range.unit).toBe('string');
  expect(range.unit.length).toBeGreaterThan(0);
  expect(typeof range.cohort).toBe('string');
  expect(range.cohort.length).toBeGreaterThan(0);
  expect(typeof range.sampleSize).toBe('number');
  expect(range.sampleSize).toBeGreaterThanOrEqual(0);
  expect(typeof range.source).toBe('string');
  expect(range.source.length).toBeGreaterThan(0);
  expectValidDate(range.date, `${context}.date`);
}

function collectStringFields(archetype: InitiativeArchetype): string[] {
  const out: string[] = [];
  out.push(archetype.label, archetype.definition);
  for (const m of archetype.adoptionMetrics) {
    out.push(m.metric, m.range.cohort, m.range.unit, m.range.source);
    if (m.topQuartileRange) {
      out.push(m.topQuartileRange.cohort, m.topQuartileRange.unit, m.topQuartileRange.source);
    }
  }
  for (const d of archetype.deploymentPatterns) {
    out.push(d.pattern, d.description, d.source);
  }
  out.push(
    archetype.trendDirection.six_month_signal,
    archetype.trendDirection.named_driver,
    archetype.trendDirection.source,
  );
  for (const p of archetype.commonPitfalls) {
    out.push(p.name, p.description);
    if (p.source) out.push(p.source);
  }
  for (const b of archetype.peerBenchmarks) {
    out.push(b.cohortLabel, b.metric, b.range.cohort, b.range.unit, b.range.source);
  }
  for (const w of archetype.whatNext) {
    out.push(w.name, w.description);
    if (w.source) out.push(w.source);
  }
  for (const e of archetype.evidenceAnchors) {
    out.push(e.claim, e.source);
    if (e.url) out.push(e.url);
  }
  return out;
}

describe('IAC honesty invariants', () => {
  it.each(INITIATIVE_ARCHETYPES.map((a) => [a.archetypeKey, a] as const))(
    '%s: every AdoptionMetric range is a labelled planning range with source + date',
    (_key: string, archetype: InitiativeArchetype) => {
      expect(archetype.adoptionMetrics.length).toBeGreaterThan(0);
      archetype.adoptionMetrics.forEach((m: AdoptionMetric, idx: number) => {
        expectPlanningRange(m.range, `${archetype.archetypeKey}.adoptionMetrics[${idx}].range`);
        if (m.topQuartileRange) {
          expectPlanningRange(
            m.topQuartileRange,
            `${archetype.archetypeKey}.adoptionMetrics[${idx}].topQuartileRange`,
          );
        }
      });
    },
  );

  it.each(INITIATIVE_ARCHETYPES.map((a) => [a.archetypeKey, a] as const))(
    '%s: every PeerBenchmark range is a labelled planning range with source + date',
    (_key: string, archetype: InitiativeArchetype) => {
      expect(archetype.peerBenchmarks.length).toBeGreaterThan(0);
      archetype.peerBenchmarks.forEach((b: PeerBenchmark, idx: number) => {
        expectPlanningRange(b.range, `${archetype.archetypeKey}.peerBenchmarks[${idx}].range`);
      });
    },
  );

  it.each(INITIATIVE_ARCHETYPES.map((a) => [a.archetypeKey, a] as const))(
    '%s: every DeploymentPattern.prevalenceInCohort is a labelled planning range with source + date',
    (_key: string, archetype: InitiativeArchetype) => {
      expect(archetype.deploymentPatterns.length).toBeGreaterThan(0);
      archetype.deploymentPatterns.forEach((d: DeploymentPattern, idx: number) => {
        expectPlanningRange(
          d.prevalenceInCohort,
          `${archetype.archetypeKey}.deploymentPatterns[${idx}].prevalenceInCohort`,
        );
        expect(d.source.length).toBeGreaterThan(0);
        expectValidDate(d.date, `${archetype.archetypeKey}.deploymentPatterns[${idx}].date`);
      });
    },
  );

  it.each(INITIATIVE_ARCHETYPES.map((a) => [a.archetypeKey, a] as const))(
    '%s: every evidenceAnchor has source and a valid date',
    (_key: string, archetype: InitiativeArchetype) => {
      expect(archetype.evidenceAnchors.length).toBeGreaterThan(0);
      archetype.evidenceAnchors.forEach((e: EvidenceAnchor, idx: number) => {
        expect(typeof e.claim).toBe('string');
        expect(e.claim.length).toBeGreaterThan(0);
        expect(typeof e.source).toBe('string');
        expect(e.source.length).toBeGreaterThan(0);
        expectValidDate(e.date, `${archetype.archetypeKey}.evidenceAnchors[${idx}].date`);
      });
    },
  );

  it.each(INITIATIVE_ARCHETYPES.map((a) => [a.archetypeKey, a] as const))(
    '%s: trendDirection has source and date',
    (_key: string, archetype: InitiativeArchetype) => {
      expect(archetype.trendDirection.source.length).toBeGreaterThan(0);
      expectValidDate(archetype.trendDirection.date, `${archetype.archetypeKey}.trendDirection.date`);
    },
  );

  it.each(INITIATIVE_ARCHETYPES.map((a) => [a.archetypeKey, a] as const))(
    '%s: lastReviewed is a valid ISO date (YYYY-MM-DD)',
    (_key: string, archetype: InitiativeArchetype) => {
      expect(archetype.lastReviewed).toBeDefined();
      expect(typeof archetype.lastReviewed).toBe('string');
      expect(ISO_DATE_RE.test(archetype.lastReviewed)).toBe(true);
      const parsed = new Date(archetype.lastReviewed);
      expect(Number.isNaN(parsed.getTime())).toBe(false);
    },
  );

  it.each(INITIATIVE_ARCHETYPES.map((a) => [a.archetypeKey, a] as const))(
    '%s: no banned phrases ("industry standard", "everyone is doing", "best practice") in archetype copy',
    (_key: string, archetype: InitiativeArchetype) => {
      const fields = collectStringFields(archetype);
      for (const field of fields) {
        const haystack = field.toLowerCase();
        for (const banned of BANNED_PHRASES) {
          if (haystack.includes(banned)) {
            throw new Error(
              `${archetype.archetypeKey}: banned phrase "${banned}" found in archetype copy — ` +
                `if this is a verbatim quotation from a cited source, move it inside an explicit ` +
                `quoted EvidenceAnchor and flag for review.\nOffending field: "${field}"`,
            );
          }
        }
      }
    },
  );
});
