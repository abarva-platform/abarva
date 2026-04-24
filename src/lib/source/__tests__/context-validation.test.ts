// Deterministic validation of the AbarVa Source seed-backed context
// builder against the canonical golden demo events. S3 slice.
//
// These tests verify that:
// - Each of the three golden Source events resolves to a deterministic
//   Source agent context bundle.
// - Lifecycle status, current stage, value at stake, missing inputs,
//   allowed actions, value ledger, and pattern pack identity are all
//   present and stable across repeated calls.
// - The bundles distinguish between events; output is not generic.
//
// No model calls. No network. Same inputs produce identical outputs.

import {
  SOURCE_GOLDEN_EVENT_VALUES_USD,
  SOURCE_LIFECYCLE_STATUS_LABELS,
  SOURCE_STAGE_LABELS,
  SOURCE_STAGE_ORDER,
  SOURCE_TOTAL_VALUE_AT_STAKE_USD,
} from '../constants';
import {
  assessSourceContextQuality,
  buildSourceContextFromSeed,
} from '../context-builder';
import { getSourceEventSeed, getSourceValueSeed } from '../mock-seed';
import type { SourceLifecycleStatus, SourceStageKey } from '../types';
import {
  GOLDEN_SOURCE_EVENT_INPUTS,
  buildAmsConsolidationContextInput,
  buildDataAiModernizationContextInput,
  buildDigitalAppBuildContextInput,
  buildPortfolioContextInput,
} from '../context-test-fixtures';

const CANONICAL_LIFECYCLE_STATUSES = new Set<SourceLifecycleStatus>(
  Object.keys(SOURCE_LIFECYCLE_STATUS_LABELS) as SourceLifecycleStatus[],
);

const CANONICAL_STAGE_KEYS = new Set<SourceStageKey>(SOURCE_STAGE_ORDER);

// ----------------------------------------------------------------------
// Per-event golden assertions
// ----------------------------------------------------------------------

describe.each(GOLDEN_SOURCE_EVENT_INPUTS)(
  'Source golden event · $label',
  ({ id, expectedName, expectedValueUsd, buildInput }) => {
    it('exists in seed data', () => {
      const seed = getSourceEventSeed(id);
      expect(seed).not.toBeNull();
      expect(seed?.name).toBe(expectedName);
    });

    it('resolves a deterministic agent context bundle', () => {
      const a = buildSourceContextFromSeed(buildInput());
      const b = buildSourceContextFromSeed(buildInput());
      expect(a).toEqual(b);
    });

    it('carries event-specific fields', () => {
      const bundle = buildSourceContextFromSeed(buildInput());
      expect(bundle.contextScope === 'event' || bundle.contextScope === 'stage').toBe(
        true,
      );
      expect(bundle.sourcingEvent).toBeDefined();
      expect(bundle.sourcingEvent?.id).toBe(id);
      expect(bundle.sourcingEvent?.name).toBe(expectedName);
      expect(bundle.sourcingEvent?.valueAtStakeUsd).toBe(expectedValueUsd);
    });

    it('has a canonical lifecycle status', () => {
      const bundle = buildSourceContextFromSeed(buildInput());
      expect(bundle.lifecycleStatus).toBeDefined();
      expect(CANONICAL_LIFECYCLE_STATUSES.has(
        bundle.lifecycleStatus as SourceLifecycleStatus,
      )).toBe(true);
    });

    it('has a canonical current stage', () => {
      const bundle = buildSourceContextFromSeed(buildInput());
      expect(bundle.workflowStage).toBeDefined();
      expect(CANONICAL_STAGE_KEYS.has(
        bundle.workflowStage!.key,
      )).toBe(true);
      expect(bundle.workflowStage!.label).toBe(
        SOURCE_STAGE_LABELS[bundle.workflowStage!.key],
      );
    });

    it('records value at stake matching the golden constant', () => {
      const bundle = buildSourceContextFromSeed(buildInput());
      expect(bundle.sourcingEvent?.valueAtStakeUsd).toBe(
        SOURCE_GOLDEN_EVENT_VALUES_USD[
          id as keyof typeof SOURCE_GOLDEN_EVENT_VALUES_USD
        ],
      );
      expect(bundle.sourcingEvent?.valueAtStakeUsd).toBeGreaterThan(0);
    });

    it('produces deterministic missing inputs', () => {
      const a = buildSourceContextFromSeed(buildInput());
      const b = buildSourceContextFromSeed(buildInput());
      expect(a.missingInputs).toEqual(b.missingInputs);
      // Required inputs should always be a non-empty list for golden events.
      expect(a.requiredInputs.length).toBeGreaterThan(0);
    });

    it('produces deterministic allowed actions and they are non-empty', () => {
      const a = buildSourceContextFromSeed(buildInput());
      const b = buildSourceContextFromSeed(buildInput());
      expect(a.allowedActions).toEqual(b.allowedActions);
      expect(a.allowedActions.length).toBeGreaterThan(0);
      const allowedKinds = new Set(a.allowedActions.map((action) => action.kind));
      expect(allowedKinds.has('none')).toBe(false);
    });

    it('produces a deterministic value ledger snapshot for the event', () => {
      const a = buildSourceContextFromSeed(buildInput());
      const b = buildSourceContextFromSeed(buildInput());
      expect(a.projectedValueLedger).toEqual(b.projectedValueLedger);
      expect(a.realizedValueLedger).toEqual(b.realizedValueLedger);
      // Each ledger line must reference this event explicitly.
      for (const line of a.projectedValueLedger) {
        expect(line.eventId).toBe(id);
      }
    });

    it('attaches a pattern pack or explicitly marks one missing', () => {
      const bundle = buildSourceContextFromSeed(buildInput());
      // A pattern pack is expected for golden events; the assessment
      // surfaces a 'Pattern pack context is missing.' note when absent.
      const assessment = assessSourceContextQuality(bundle);
      const patternMissing = assessment.notes.some((note) =>
        /Pattern pack context is missing\./i.test(note),
      );
      expect(Boolean(bundle.selectedPatternPack) || patternMissing).toBe(true);
      if (bundle.selectedPatternPack) {
        expect(bundle.selectedPatternPack.id.length).toBeGreaterThan(0);
        expect(bundle.selectedPatternPack.archetype.length).toBeGreaterThan(0);
      }
    });

    it('produces a deterministic context quality score', () => {
      const a = assessSourceContextQuality(
        buildSourceContextFromSeed(buildInput()),
      );
      const b = assessSourceContextQuality(
        buildSourceContextFromSeed(buildInput()),
      );
      expect(a.score).toEqual(b.score);
      expect(['low', 'medium', 'high']).toContain(a.score.overallConfidence);
    });
  },
);

// ----------------------------------------------------------------------
// Cross-event invariants
// ----------------------------------------------------------------------

describe('Source golden events · cross-event invariants', () => {
  it('produces three distinct event-specific context bundles', () => {
    const dataAi = buildSourceContextFromSeed(
      buildDataAiModernizationContextInput(),
    );
    const ams = buildSourceContextFromSeed(buildAmsConsolidationContextInput());
    const digital = buildSourceContextFromSeed(
      buildDigitalAppBuildContextInput(),
    );
    const ids = [
      dataAi.sourcingEvent?.id,
      ams.sourcingEvent?.id,
      digital.sourcingEvent?.id,
    ];
    expect(new Set(ids).size).toBe(3);
  });

  it('the three bundles do not share identical next actions (output is not generic)', () => {
    const dataAi = buildSourceContextFromSeed(
      buildDataAiModernizationContextInput(),
    );
    const ams = buildSourceContextFromSeed(buildAmsConsolidationContextInput());
    const digital = buildSourceContextFromSeed(
      buildDigitalAppBuildContextInput(),
    );
    const nextActions = [
      dataAi.nextAction,
      ams.nextAction,
      digital.nextAction,
    ];
    expect(new Set(nextActions).size).toBe(3);
  });

  it('records different lifecycle statuses across the three events', () => {
    const dataAi = buildSourceContextFromSeed(
      buildDataAiModernizationContextInput(),
    );
    const ams = buildSourceContextFromSeed(buildAmsConsolidationContextInput());
    const digital = buildSourceContextFromSeed(
      buildDigitalAppBuildContextInput(),
    );
    const statuses = [
      dataAi.lifecycleStatus,
      ams.lifecycleStatus,
      digital.lifecycleStatus,
    ];
    // We expect at least two distinct statuses to prove differentiation.
    expect(new Set(statuses).size).toBeGreaterThanOrEqual(2);
  });

  it('the value ledger total reconciles to the canonical $63.3M value at stake', () => {
    const ledger = getSourceValueSeed();
    const projectedTotal = ledger.projected.reduce(
      (sum, line) => sum + line.amountUsd,
      0,
    );
    expect(projectedTotal).toBe(SOURCE_TOTAL_VALUE_AT_STAKE_USD);
  });

  it('non-empty missing inputs surface for at least one golden event', () => {
    // SRC-001 (Data & AI Modernization) is at risk on a blocked scope
    // gate; missingInputs should not be empty for that event.
    const dataAi = buildSourceContextFromSeed(
      buildDataAiModernizationContextInput(),
    );
    expect(dataAi.missingInputs.length).toBeGreaterThan(0);
  });

  it('every golden event has a non-zero positive value at stake', () => {
    for (const fixture of GOLDEN_SOURCE_EVENT_INPUTS) {
      const bundle = buildSourceContextFromSeed(fixture.buildInput());
      expect(bundle.sourcingEvent?.valueAtStakeUsd).toBe(
        fixture.expectedValueUsd,
      );
      expect(bundle.sourcingEvent!.valueAtStakeUsd).toBeGreaterThan(0);
    }
  });

  it('quality assessment scores are deterministic across repeated calls for every golden event', () => {
    for (const fixture of GOLDEN_SOURCE_EVENT_INPUTS) {
      const a = assessSourceContextQuality(
        buildSourceContextFromSeed(fixture.buildInput()),
      );
      const b = assessSourceContextQuality(
        buildSourceContextFromSeed(fixture.buildInput()),
      );
      expect(a.score).toEqual(b.score);
    }
  });
});

// ----------------------------------------------------------------------
// Portfolio context
// ----------------------------------------------------------------------

describe('Source portfolio context (no eventId)', () => {
  it('produces a deterministic portfolio bundle with no specific event', () => {
    const a = buildSourceContextFromSeed(buildPortfolioContextInput());
    const b = buildSourceContextFromSeed(buildPortfolioContextInput());
    expect(a).toEqual(b);
    expect(a.contextScope).toBe('portfolio');
    expect(a.sourcingEvent).toBeUndefined();
  });

  it('surfaces blockers for waiting/blocked events at the portfolio level', () => {
    const bundle = buildSourceContextFromSeed(buildPortfolioContextInput());
    expect(bundle.blockers.length).toBeGreaterThan(0);
  });

  it('produces a non-empty allowed-action list at portfolio scope', () => {
    const bundle = buildSourceContextFromSeed(buildPortfolioContextInput());
    expect(bundle.allowedActions.length).toBeGreaterThan(0);
  });
});
