// Slice 0.3 · Tower Outcome Taxonomy — unit tests for the taxonomy builders.
//
// Purely deterministic. No DOM, no model calls, no network, no clock.
//
// Coverage:
//
// - Every outcome concept has an encoded definition.
// - classifySeverity maps each 0..1 band edge to the right severity.
// - deriveValueRung never inflates a claim above its evidence.
// - deriveExecutiveAction maps each concept/severity to the right action.
// - classifyOutcomeReading returns the correct full classification.
// - Renewal-window urgency escalates regardless of severity.
// - Determinism: identical input yields byte-equal output.

import {
  OUTCOME_CONCEPTS,
  VALUE_RUNGS,
  EXECUTIVE_ACTIONS,
  OUTCOME_CONCEPT_DEFINITIONS,
  SEVERITY_THRESHOLDS,
  RENEWAL_URGENT_WINDOW_DAYS,
  classifySeverity,
  deriveValueRung,
  deriveExecutiveAction,
  classifyOutcomeReading,
  classifyOutcomeReadings,
  getOutcomeConceptDefinition,
  type OutcomeReading,
} from '@/lib/tower/taxonomy/outcome-taxonomy';

describe('Tower outcome taxonomy — encoded definitions', () => {
  it('defines every outcome concept exactly once', () => {
    for (const concept of OUTCOME_CONCEPTS) {
      const def = OUTCOME_CONCEPT_DEFINITIONS[concept];
      expect(def).toBeDefined();
      expect(def.concept).toBe(concept);
      expect(def.meaning.length).toBeGreaterThan(10);
      expect(def.cxoRelevance.length).toBeGreaterThan(10);
      expect(def.sourcedFrom.length).toBeGreaterThan(0);
      expect(EXECUTIVE_ACTIONS).toContain(def.impliedAction);
    }
  });

  it('getOutcomeConceptDefinition is a lookup over the same table', () => {
    expect(getOutcomeConceptDefinition('adoption')).toBe(
      OUTCOME_CONCEPT_DEFINITIONS.adoption,
    );
  });

  it('verified value is the only value concept implying no_action', () => {
    expect(OUTCOME_CONCEPT_DEFINITIONS.verified_value.impliedAction).toBe(
      'no_action',
    );
    expect(OUTCOME_CONCEPT_DEFINITIONS.projected_value.impliedAction).toBe(
      'verify_value_claim',
    );
    expect(OUTCOME_CONCEPT_DEFINITIONS.tracked_value.impliedAction).toBe(
      'verify_value_claim',
    );
  });
});

describe('classifySeverity', () => {
  it('maps band edges to severities', () => {
    expect(classifySeverity(1)).toBe('on_track');
    expect(classifySeverity(SEVERITY_THRESHOLDS.onTrack)).toBe('on_track');
    expect(classifySeverity(0.6)).toBe('watch');
    expect(classifySeverity(SEVERITY_THRESHOLDS.watch)).toBe('watch');
    expect(classifySeverity(0.3)).toBe('at_risk');
    expect(classifySeverity(SEVERITY_THRESHOLDS.atRisk)).toBe('at_risk');
    expect(classifySeverity(0.1)).toBe('critical');
    expect(classifySeverity(0)).toBe('critical');
  });

  it('clamps out-of-range and NaN scores', () => {
    expect(classifySeverity(2)).toBe('on_track');
    expect(classifySeverity(-1)).toBe('critical');
    expect(classifySeverity(Number.NaN)).toBe('critical');
  });
});

describe('deriveValueRung', () => {
  it('returns null for non-value concepts', () => {
    const reading: OutcomeReading = {
      concept: 'adoption',
      subjectId: 'p1',
      normalizedScore: 0.4,
      evidenceStrength: 'verified',
    };
    expect(deriveValueRung(reading)).toBeNull();
  });

  it('never inflates a claim above its evidence', () => {
    expect(
      deriveValueRung({
        concept: 'verified_value',
        subjectId: 'p1',
        normalizedScore: 0.9,
        evidenceStrength: 'tracked',
      }),
    ).toBe('tracked');
    expect(
      deriveValueRung({
        concept: 'verified_value',
        subjectId: 'p1',
        normalizedScore: 0.9,
        evidenceStrength: 'projected',
      }),
    ).toBe('projected');
  });

  it('does not promote a claim above its concept rung', () => {
    expect(
      deriveValueRung({
        concept: 'projected_value',
        subjectId: 'p1',
        normalizedScore: 0.9,
        evidenceStrength: 'verified',
      }),
    ).toBe('projected');
  });

  it('returns the concept rung when evidence matches', () => {
    expect(
      deriveValueRung({
        concept: 'verified_value',
        subjectId: 'p1',
        normalizedScore: 0.9,
        evidenceStrength: 'verified',
      }),
    ).toBe('verified');
  });
});

describe('deriveExecutiveAction', () => {
  it('on-track verified value implies no action', () => {
    const reading: OutcomeReading = {
      concept: 'verified_value',
      subjectId: 'p1',
      normalizedScore: 0.9,
      evidenceStrength: 'verified',
    };
    expect(deriveExecutiveAction(reading, 'on_track', 'verified')).toBe(
      'no_action',
    );
  });

  it('on-track but unverified value still implies verification', () => {
    const reading: OutcomeReading = {
      concept: 'tracked_value',
      subjectId: 'p1',
      normalizedScore: 0.9,
      evidenceStrength: 'tracked',
    };
    expect(deriveExecutiveAction(reading, 'on_track', 'tracked')).toBe(
      'verify_value_claim',
    );
  });

  it('critical adoption escalates to sponsor intervention', () => {
    const reading: OutcomeReading = {
      concept: 'adoption',
      subjectId: 'p1',
      normalizedScore: 0.1,
      evidenceStrength: 'tracked',
    };
    expect(deriveExecutiveAction(reading, 'critical', null)).toBe(
      'sponsor_intervention',
    );
  });

  it('at-risk adoption implies a normal adoption push', () => {
    const reading: OutcomeReading = {
      concept: 'adoption',
      subjectId: 'p1',
      normalizedScore: 0.3,
      evidenceStrength: 'tracked',
    };
    expect(deriveExecutiveAction(reading, 'at_risk', null)).toBe(
      'drive_adoption',
    );
  });

  it('spend at risk implies reallocation', () => {
    const reading: OutcomeReading = {
      concept: 'spend_at_risk',
      subjectId: 'v1',
      normalizedScore: 0.4,
      evidenceStrength: 'tracked',
    };
    expect(deriveExecutiveAction(reading, 'at_risk', null)).toBe(
      'reallocate_spend',
    );
  });

  it('dependency risk implies escalation', () => {
    const reading: OutcomeReading = {
      concept: 'dependency_risk',
      subjectId: 'p1',
      normalizedScore: 0.2,
      evidenceStrength: 'tracked',
    };
    expect(deriveExecutiveAction(reading, 'critical', null)).toBe(
      'escalate_dependency',
    );
  });

  it('renewal inside the urgent window escalates even at watch severity', () => {
    const reading: OutcomeReading = {
      concept: 'renewal_risk',
      subjectId: 'v1',
      normalizedScore: 0.6,
      evidenceStrength: 'tracked',
      daysToEvent: RENEWAL_URGENT_WINDOW_DAYS - 1,
    };
    expect(deriveExecutiveAction(reading, 'watch', null)).toBe(
      'open_renewal_review',
    );
  });

  it('renewal far out at on-track severity needs no action', () => {
    const reading: OutcomeReading = {
      concept: 'renewal_risk',
      subjectId: 'v1',
      normalizedScore: 0.9,
      evidenceStrength: 'tracked',
      daysToEvent: 300,
    };
    expect(deriveExecutiveAction(reading, 'on_track', null)).toBe('no_action');
  });
});

describe('classifyOutcomeReading', () => {
  it('returns the full classification with a rationale', () => {
    const reading: OutcomeReading = {
      concept: 'adoption',
      subjectId: 'apex-contact-center-ai',
      normalizedScore: 0.12,
      evidenceStrength: 'tracked',
    };
    const result = classifyOutcomeReading(reading);
    expect(result.concept).toBe('adoption');
    expect(result.subjectId).toBe('apex-contact-center-ai');
    expect(result.severity).toBe('critical');
    expect(result.valueRung).toBeNull();
    expect(result.impliedAction).toBe('sponsor_intervention');
    expect(result.rationale).toContain('apex-contact-center-ai');
    expect(result.rationale).toContain('critical');
    expect(result.rationale.length).toBeGreaterThan(40);
  });

  it('classifies an on-track verified value claim as no_action', () => {
    const result = classifyOutcomeReading({
      concept: 'verified_value',
      subjectId: 'p2',
      normalizedScore: 0.85,
      evidenceStrength: 'verified',
    });
    expect(result.severity).toBe('on_track');
    expect(result.valueRung).toBe('verified');
    expect(result.impliedAction).toBe('no_action');
  });

  it('demotes a verified-value concept lacking evidence and asks to verify', () => {
    const result = classifyOutcomeReading({
      concept: 'verified_value',
      subjectId: 'p3',
      normalizedScore: 0.85,
      evidenceStrength: 'projected',
    });
    expect(result.valueRung).toBe('projected');
    expect(result.impliedAction).toBe('verify_value_claim');
  });

  it('is deterministic — byte-equal output for identical input', () => {
    const reading: OutcomeReading = {
      concept: 'spend_at_risk',
      subjectId: 'v9',
      normalizedScore: 0.33,
      evidenceStrength: 'tracked',
    };
    expect(JSON.stringify(classifyOutcomeReading(reading))).toBe(
      JSON.stringify(classifyOutcomeReading(reading)),
    );
  });
});

describe('classifyOutcomeReadings', () => {
  it('classifies a batch preserving input order', () => {
    const readings: OutcomeReading[] = [
      {
        concept: 'projected_value',
        subjectId: 'a',
        normalizedScore: 0.9,
        evidenceStrength: 'projected',
      },
      {
        concept: 'dependency_risk',
        subjectId: 'b',
        normalizedScore: 0.1,
        evidenceStrength: 'tracked',
      },
    ];
    const results = classifyOutcomeReadings(readings);
    expect(results.map((r) => r.subjectId)).toEqual(['a', 'b']);
    expect(results[0].impliedAction).toBe('verify_value_claim');
    expect(results[1].impliedAction).toBe('escalate_dependency');
  });

  it('exposes stable canonical enums', () => {
    expect(VALUE_RUNGS).toEqual(['projected', 'tracked', 'verified']);
    expect(OUTCOME_CONCEPTS).toContain('renewal_risk');
  });
});
