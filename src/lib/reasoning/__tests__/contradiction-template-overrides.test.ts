/**
 * Contradiction template overrides tests.
 *
 * Deterministic: pure in-memory store, no IO, no randomness. Each test
 * resets the override map via `_resetForTests` so ordering does not leak.
 */

import {
  _resetForTests,
  clearAllOverrides,
  clearTemplateOverride,
  getOverridesForPattern,
  getTemplateOverride,
  hasOverridesForPattern,
  setTemplateOverride,
} from '@/lib/reasoning/contradiction-template-overrides';
import { PAT_SRC_AMS_001 } from '@/lib/intelligence/source-lifecycle-patterns';
import type { ContradictionTemplate } from '@/lib/intelligence/seed-types';

const PATTERN_ID = PAT_SRC_AMS_001.patternId;
const FIRST_TEMPLATE = PAT_SRC_AMS_001.contradictionTemplates[0];
const SECOND_TEMPLATE = PAT_SRC_AMS_001.contradictionTemplates[1];

function makeOverride(
  base: ContradictionTemplate,
  hint: string,
): ContradictionTemplate {
  return {
    ...base,
    detectionHint: hint,
  };
}

beforeEach(() => {
  _resetForTests();
});

describe('contradiction-template-overrides', () => {
  it('returns null when no override has been recorded', () => {
    expect(getTemplateOverride(PATTERN_ID, FIRST_TEMPLATE.id)).toBeNull();
  });

  it('records and reads back a template override', () => {
    const override = makeOverride(FIRST_TEMPLATE, 'tweaked detection hint');
    setTemplateOverride(PATTERN_ID, FIRST_TEMPLATE.id, override);

    const stored = getTemplateOverride(PATTERN_ID, FIRST_TEMPLATE.id);
    expect(stored).not.toBeNull();
    expect(stored?.detectionHint).toBe('tweaked detection hint');
    expect(stored?.id).toBe(FIRST_TEMPLATE.id);
  });

  it('forces the stored id to match the override key (cannot rename via override)', () => {
    const renamed = { ...FIRST_TEMPLATE, id: 'totally-different-id' };
    setTemplateOverride(PATTERN_ID, FIRST_TEMPLATE.id, renamed);

    const stored = getTemplateOverride(PATTERN_ID, FIRST_TEMPLATE.id);
    expect(stored?.id).toBe(FIRST_TEMPLATE.id);
  });

  it('hasOverridesForPattern reflects whether any override exists', () => {
    expect(hasOverridesForPattern(PATTERN_ID)).toBe(false);
    setTemplateOverride(
      PATTERN_ID,
      FIRST_TEMPLATE.id,
      makeOverride(FIRST_TEMPLATE, 'hint'),
    );
    expect(hasOverridesForPattern(PATTERN_ID)).toBe(true);
  });

  it('getOverridesForPattern returns the baseline list when no overrides exist', () => {
    const merged = getOverridesForPattern(PATTERN_ID);
    expect(merged).toEqual(PAT_SRC_AMS_001.contradictionTemplates);
  });

  it('getOverridesForPattern merges overrides into the baseline list, preserving order', () => {
    const tweaked = makeOverride(SECOND_TEMPLATE, 'override hint #2');
    setTemplateOverride(PATTERN_ID, SECOND_TEMPLATE.id, tweaked);

    const merged = getOverridesForPattern(PATTERN_ID);
    expect(merged).toHaveLength(PAT_SRC_AMS_001.contradictionTemplates.length);

    // Order preserved.
    expect(merged[0]).toEqual(FIRST_TEMPLATE);
    expect(merged[1].id).toBe(SECOND_TEMPLATE.id);
    expect(merged[1].detectionHint).toBe('override hint #2');
  });

  it('getOverridesForPattern returns [] for an unknown patternId', () => {
    expect(getOverridesForPattern('PAT-DOES-NOT-EXIST')).toEqual([]);
  });

  it('clearTemplateOverride removes a single override and is idempotent', () => {
    setTemplateOverride(
      PATTERN_ID,
      FIRST_TEMPLATE.id,
      makeOverride(FIRST_TEMPLATE, 'tweaked'),
    );
    expect(getTemplateOverride(PATTERN_ID, FIRST_TEMPLATE.id)).not.toBeNull();

    clearTemplateOverride(PATTERN_ID, FIRST_TEMPLATE.id);
    expect(getTemplateOverride(PATTERN_ID, FIRST_TEMPLATE.id)).toBeNull();
    expect(hasOverridesForPattern(PATTERN_ID)).toBe(false);

    // Second clear is a no-op.
    expect(() => clearTemplateOverride(PATTERN_ID, FIRST_TEMPLATE.id)).not.toThrow();
  });

  it('clearAllOverrides wipes every recorded override', () => {
    setTemplateOverride(
      PATTERN_ID,
      FIRST_TEMPLATE.id,
      makeOverride(FIRST_TEMPLATE, 'a'),
    );
    setTemplateOverride(
      PATTERN_ID,
      SECOND_TEMPLATE.id,
      makeOverride(SECOND_TEMPLATE, 'b'),
    );
    expect(hasOverridesForPattern(PATTERN_ID)).toBe(true);

    clearAllOverrides();
    expect(hasOverridesForPattern(PATTERN_ID)).toBe(false);
    expect(getTemplateOverride(PATTERN_ID, FIRST_TEMPLATE.id)).toBeNull();
    expect(getTemplateOverride(PATTERN_ID, SECOND_TEMPLATE.id)).toBeNull();
  });

  it('replacing an existing override updates the stored value', () => {
    setTemplateOverride(
      PATTERN_ID,
      FIRST_TEMPLATE.id,
      makeOverride(FIRST_TEMPLATE, 'first'),
    );
    setTemplateOverride(
      PATTERN_ID,
      FIRST_TEMPLATE.id,
      makeOverride(FIRST_TEMPLATE, 'second'),
    );
    expect(
      getTemplateOverride(PATTERN_ID, FIRST_TEMPLATE.id)?.detectionHint,
    ).toBe('second');
  });

  it('ignores empty patternId or templateId on set', () => {
    setTemplateOverride('', FIRST_TEMPLATE.id, FIRST_TEMPLATE);
    setTemplateOverride(PATTERN_ID, '', FIRST_TEMPLATE);
    expect(hasOverridesForPattern(PATTERN_ID)).toBe(false);
  });

  it('does not leak overrides across distinct patternIds', () => {
    setTemplateOverride(
      PATTERN_ID,
      FIRST_TEMPLATE.id,
      makeOverride(FIRST_TEMPLATE, 'tweak'),
    );
    expect(hasOverridesForPattern('PAT-PRG-CDP-001')).toBe(false);
    expect(getTemplateOverride('PAT-PRG-CDP-001', FIRST_TEMPLATE.id)).toBeNull();
  });

  it('integration: overriding detectionHint changes detector output', () => {
    // Import inside the test so the detector picks up the override module
    // through its public surface (no module mocking needed).
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { createContradictionDetector } =
      require('@/lib/reasoning/contradiction-detector') as typeof import('@/lib/reasoning/contradiction-detector');
    /* eslint-enable @typescript-eslint/no-require-imports */

    const detector = createContradictionDetector(PAT_SRC_AMS_001);

    // This evidence map intentionally has zero overlap with any baseline
    // detectionHint — no template should fire under the baseline.
    const evidenceMap: Record<string, unknown> = {
      'klingon-fleet-readiness': 'codified',
      'kobayashi-maru-simulation': 'unwinnable',
    };
    expect(detector.detect(evidenceMap)).toHaveLength(0);

    // Override CON-AMS-001's detection hint to match the new evidence.
    setTemplateOverride(PATTERN_ID, FIRST_TEMPLATE.id, {
      ...FIRST_TEMPLATE,
      detectionHint:
        'klingon fleet readiness contradicts kobayashi maru simulation outcome',
    });

    const detected = detector.detect(evidenceMap);
    expect(detected.length).toBeGreaterThan(0);
    expect(detected.some((d) => d.templateId === FIRST_TEMPLATE.id)).toBe(true);
  });
});
