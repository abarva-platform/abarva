/**
 * pattern-card-helpers tests
 *
 * Deterministic: no IO, no randomness. Verifies the summarisation utilities
 * used by the pattern index page card view.
 */

import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';
import {
  deriveLifecyclePatternDomain,
  formatDurationLabel,
  summarizePatternForCard,
  truncateApplicability,
} from '@/lib/reasoning/pattern-card-helpers';

describe('pattern-card-helpers', () => {
  it('derives the source-event domain from a PAT-SRC-* id', () => {
    expect(deriveLifecyclePatternDomain('PAT-SRC-AMS-001')).toBe('source-event');
    expect(deriveLifecyclePatternDomain('PAT-SRC-RFP-001')).toBe('source-event');
  });

  it('derives the program domain from a PAT-PRG-* id and falls back to unknown', () => {
    expect(deriveLifecyclePatternDomain('PAT-PRG-CDP-001')).toBe('program');
    expect(deriveLifecyclePatternDomain('PAT-OTHER-001')).toBe('unknown');
    expect(deriveLifecyclePatternDomain('')).toBe('unknown');
  });

  it('truncates applicability over 140 chars with an ellipsis but leaves short ones intact', () => {
    const short = 'AMS engagements that need a doctrine-driven baseline.';
    expect(truncateApplicability(short)).toBe(short);
    const long = 'a'.repeat(200);
    const truncated = truncateApplicability(long);
    expect(truncated.length).toBe(140);
    expect(truncated.endsWith('…')).toBe(true);
  });

  it('summarizes a lifecycle pattern with derived domain, counts, duration label, and detail href', () => {
    const fixture: LifecyclePatternSeed = {
      kind: 'lifecycle',
      id: 'PAT-SRC-AMS-001',
      patternId: 'PAT-SRC-AMS-001',
      slug: 'ams-baseline',
      title: 'AMS baseline',
      domain: 'sourcing',
      tier: 'authoritative',
      vertical: 'cross_industry',
      thesis: 't',
      applicability: 'AMS engagements that need a doctrine-driven baseline.',
      status: 'AUTHORED-REVIEWED',
      version: '1.0.0',
      confidence: 0.9,
      createdFrom: 'human_authored',
      createdBy: 'doctrine',
      createdAt: '2025-01-01',
      instanceCount: 0,
      sourceDocuments: [],
      regulatoryChips: [],
      relatedPatternIds: [],
      derivedFromPatternIds: [],
      taggedContradictionIds: [],
      body: '',
      stages: [
        { id: 's1', label: 'Frame', description: '', order: 1 },
        { id: 's2', label: 'Run', description: '', order: 2 },
      ],
      gateCriteria: [
        {
          id: 'g1',
          stageId: 's1',
          gateType: 'hard',
          description: '',
          evaluationHint: '',
        },
      ],
      expectedArtifacts: [
        {
          id: 'a1',
          stageId: 's1',
          label: '',
          description: '',
          requirement: 'required',
          gateType: 'hard',
        },
        {
          id: 'a2',
          stageId: 's2',
          label: '',
          description: '',
          requirement: 'recommended',
          gateType: 'soft',
        },
        {
          id: 'a3',
          stageId: 's2',
          label: '',
          description: '',
          requirement: 'optional',
          gateType: 'soft',
        },
      ],
      contradictionTemplates: [],
      failureModes: [],
      coAppliesWithPatternIds: [],
      typicalDurationDays: { min: 90, max: 210 },
    };
    const summary = summarizePatternForCard(fixture);
    expect(summary.patternId).toBe('PAT-SRC-AMS-001');
    expect(summary.domain).toBe('source-event');
    expect(summary.tier).toBe('authoritative');
    expect(summary.stageCount).toBe(2);
    expect(summary.gateCriteriaCount).toBe(1);
    expect(summary.expectedArtifactCount).toBe(3);
    expect(summary.durationLabel).toBe('90–210 days');
    expect(summary.href).toBe('/source/patterns/PAT-SRC-AMS-001');
    expect(formatDurationLabel({ min: 1, max: 14 })).toBe('1–14 days');
  });
});
