/**
 * pattern-summary helper tests — REASON-25
 *
 * Deterministic: pure functions over the shipped LifecyclePatternSeed
 * fixtures from src/lib/intelligence/source-lifecycle-patterns.ts.
 */

import {
  PAT_SRC_AMS_001,
  PAT_SRC_EMERGENCY_001,
  SOURCE_LIFECYCLE_PATTERNS,
} from '@/lib/intelligence/source-lifecycle-patterns';
import { previewPattern, summarizePattern } from '@/lib/reasoning/pattern-summary';

describe('summarizePattern', () => {
  it('returns the pattern title and a correct stage-count label', () => {
    const summary = summarizePattern(PAT_SRC_AMS_001);
    expect(summary.title).toBe(PAT_SRC_AMS_001.title);
    expect(summary.stageCountLabel).toBe(`${PAT_SRC_AMS_001.stages.length} stages`);
    expect(summary.patternId).toBe('PAT-SRC-AMS-001');
  });

  it('formats a duration range with an en-dash', () => {
    const summary = summarizePattern(PAT_SRC_AMS_001);
    const { min, max } = PAT_SRC_AMS_001.typicalDurationDays;
    expect(summary.durationLabel).toBe(`${min}–${max} days`);
    // The emergency pattern can be as short as 1 day — confirm range still renders.
    const emergency = summarizePattern(PAT_SRC_EMERGENCY_001);
    expect(emergency.durationLabel).toMatch(/days$/);
  });

  it('truncates long applicability strings to roughly 140 characters with an ellipsis', () => {
    const summary = summarizePattern(PAT_SRC_AMS_001);
    expect(summary.applicabilityLine.length).toBeLessThanOrEqual(141);
    if (PAT_SRC_AMS_001.applicability.length > 140) {
      expect(summary.applicabilityLine.endsWith('…')).toBe(true);
    }
  });

  it('produces a summary for every shipped lifecycle pattern', () => {
    expect(SOURCE_LIFECYCLE_PATTERNS).toHaveLength(7);
    for (const pattern of SOURCE_LIFECYCLE_PATTERNS) {
      const summary = summarizePattern(pattern);
      expect(summary.patternId).toBe(pattern.patternId);
      expect(summary.title.length).toBeGreaterThan(0);
      expect(summary.applicabilityLine.length).toBeGreaterThan(0);
    }
  });
});

describe('previewPattern', () => {
  it('returns at most 5 stage labels in stage-order', () => {
    const preview = previewPattern(PAT_SRC_AMS_001);
    expect(preview.topStageLabels.length).toBeLessThanOrEqual(5);
    const ordered = [...PAT_SRC_AMS_001.stages].sort((a, b) => a.order - b.order);
    expect(preview.topStageLabels[0]).toBe(ordered[0]!.label);
  });

  it('puts required artifacts ahead of recommended/optional ones', () => {
    const preview = previewPattern(PAT_SRC_AMS_001);
    const reqs = preview.topArtifacts.map((a) => a.requirement);
    // Once a non-required entry appears, no required entry should follow it.
    const firstNonRequired = reqs.findIndex((r) => r !== 'required');
    if (firstNonRequired !== -1) {
      const tail = reqs.slice(firstNonRequired);
      expect(tail.includes('required')).toBe(false);
    }
    expect(preview.topArtifacts.length).toBeLessThanOrEqual(3);
  });

  it('returns a contradiction template when the pattern has any', () => {
    const preview = previewPattern(PAT_SRC_AMS_001);
    if (PAT_SRC_AMS_001.contradictionTemplates.length > 0) {
      expect(preview.topContradiction).not.toBeNull();
      expect(preview.topContradiction!.label.length).toBeGreaterThan(0);
      expect(preview.topContradiction!.partyA.length).toBeGreaterThan(0);
      expect(preview.topContradiction!.partyB.length).toBeGreaterThan(0);
    }
  });
});
