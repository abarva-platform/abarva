// Deterministic unit tests for S2 Context Bundle scoring + classifier.
//
// These tests are fixture-driven. No model calls, no network, no
// time-dependent behavior. Each fixture is built explicitly so the
// scoring expectations are legible from the test body.

import {
  createEmptyContextBundle,
  type ContextBundle,
  type ContextBundleAssemblyInput,
  type ContextBundleAllowedAction,
  type ContextBundleArtifactReference,
  type ContextBundleEvidenceReference,
  type ContextBundleMissingInput,
  type ContextBundlePatternReference,
} from '../context-bundle';
import {
  CONTEXT_BUNDLE_SCORE_THRESHOLDS,
  classifyContextBundle,
  computeActionability,
  computeContextCompleteness,
  computeEvidenceCoverage,
  computePatternGrounding,
  computeVanillaResponseRisk,
  computeWorkflowAwareness,
  createResponseGate,
  scoreContextBundle,
} from '../context-bundle-scoring';

const baseInput: ContextBundleAssemblyInput = {
  tenantId: 'tenant-meridian',
  tenantName: 'Meridian Health',
  userId: 'user-1',
  userRole: 'cio',
  route: '/tenant/meridian/programs/mrd-01',
  surface: 'programs',
  assignedAgent: 'nexus',
  workObjectId: 'MRD-01',
  workObjectKind: 'program',
  userPrompt: 'What should I do next?',
  requestedAt: '2026-04-24T00:00:00.000Z',
};

function baseBundle(overrides: Partial<ContextBundle> = {}): ContextBundle {
  const b = createEmptyContextBundle(baseInput);
  return { ...b, ...overrides };
}

function markPresent(
  bundle: ContextBundle,
  keys: Array<keyof ContextBundle['categories']>,
  missingFields: Partial<Record<keyof ContextBundle['categories'], string[]>> = {},
): void {
  for (const key of keys) {
    bundle.categories[key] = {
      ...bundle.categories[key],
      present: true,
      provenance: 'deterministic',
      missingFields: missingFields[key] ?? [],
    };
  }
}

function evidenceRef(
  id: string,
  confidence: ContextBundleEvidenceReference['confidence'] = 'HIGH',
): ContextBundleEvidenceReference {
  return {
    id,
    label: `Evidence ${id}`,
    kind: 'registryEntry',
    confidence,
    provenance: 'deterministic',
  };
}

function patternRef(
  id: string,
  authoringStatus: ContextBundlePatternReference['authoringStatus'] = 'AUTHORED-EXPERT',
  relevanceScore = 90,
): ContextBundlePatternReference {
  return {
    id,
    name: `Pattern ${id}`,
    tier: 'useCase',
    relevanceScore,
    authoringStatus,
    sectionsCited: ['B', 'D'],
  };
}

function artifactRef(id: string): ContextBundleArtifactReference {
  return {
    id,
    title: `Artifact ${id}`,
    kind: 'DecisionMemo',
    tier: 'rich',
    status: 'draft',
    missingInputs: [],
    evidenceIds: [id],
  };
}

function allowed(
  id: string,
  kind: ContextBundleAllowedAction['kind'] = 'ask',
): ContextBundleAllowedAction {
  return {
    id,
    label: `Action ${id}`,
    kind,
    allowed: true,
    requiresGateCheck: false,
    requiresEvidenceCheck: false,
  };
}

function missingInput(
  id: string,
  blocking = false,
): ContextBundleMissingInput {
  return {
    id,
    label: `Missing ${id}`,
    category: 'evidence',
    blocking,
  };
}

// --- Fixtures: one per state ------------------------------------------

function completeBundle(): ContextBundle {
  const b = baseBundle();
  markPresent(b, [
    'identity',
    'workObject',
    'workflowState',
    'businessContext',
    'artifacts',
    'patterns',
    'evidence',
    'conversation',
  ]);
  b.evidenceReferences = [
    evidenceRef('E1', 'HIGH'),
    evidenceRef('E2', 'HIGH'),
    evidenceRef('E3', 'MEDIUM'),
  ];
  b.patternReferences = [
    patternRef('P1', 'BATTLE-TESTED', 92),
    patternRef('P2', 'AUTHORED-EXPERT', 80),
  ];
  b.artifactReferences = [artifactRef('A1'), artifactRef('A2')];
  b.allowedActions = [
    allowed('open-artifact', 'openArtifact'),
    allowed('upload-evidence', 'uploadEvidence'),
    allowed('review-gate', 'reviewGate'),
  ];
  return b;
}

function usableWithGapsBundle(): ContextBundle {
  const b = baseBundle();
  markPresent(b, [
    'identity',
    'workObject',
    'workflowState',
    'artifacts',
    'patterns',
  ]);
  b.evidenceReferences = [evidenceRef('E1', 'MEDIUM')];
  b.patternReferences = [patternRef('P1', 'AUTHORED-REVIEWED', 70)];
  b.artifactReferences = [artifactRef('A1')];
  b.allowedActions = [allowed('ask-input', 'requestInput')];
  return b;
}

function patternOnlyBundle(): ContextBundle {
  const b = baseBundle();
  // Pattern context exists. No work object. No evidence. Identity present.
  markPresent(b, ['identity', 'patterns']);
  b.patternReferences = [
    patternRef('P1', 'BATTLE-TESTED', 95),
    patternRef('P2', 'AUTHORED-EXPERT', 85),
  ];
  b.allowedActions = [allowed('ask', 'ask')];
  return b;
}

function insufficientBundle(): ContextBundle {
  const b = baseBundle();
  // Identity present so we are not blocked; nothing else.
  markPresent(b, ['identity']);
  return b;
}

function blockedBundle(): ContextBundle {
  const b = baseBundle();
  markPresent(b, ['identity', 'workObject']);
  b.missingInputs = [missingInput('tenant-access-approval', true)];
  return b;
}

// --- Scoring dimensions -----------------------------------------------

describe('computeContextCompleteness', () => {
  it('returns 0 for an empty bundle', () => {
    expect(computeContextCompleteness(baseBundle())).toBe(0);
  });

  it('reaches the complete floor when all categories are present', () => {
    const b = completeBundle();
    expect(computeContextCompleteness(b)).toBeGreaterThanOrEqual(
      CONTEXT_BUNDLE_SCORE_THRESHOLDS.completeMinCompleteness,
    );
  });

  it('applies a gap penalty when a category self-reports missing fields', () => {
    const b = baseBundle();
    markPresent(b, ['identity'], { identity: ['email', 'role', 'tenant'] });
    const score = computeContextCompleteness(b);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(20);
  });
});

describe('computePatternGrounding', () => {
  it('returns 0 when no pattern references are attached', () => {
    expect(computePatternGrounding(baseBundle())).toBe(0);
  });

  it('scores higher for expert/battle-tested patterns than draft', () => {
    const draftBundle = baseBundle();
    draftBundle.patternReferences = [patternRef('P1', 'AUTHORED-DRAFT', 90)];
    const expertBundle = baseBundle();
    expertBundle.patternReferences = [patternRef('P1', 'BATTLE-TESTED', 90)];
    expect(computePatternGrounding(expertBundle)).toBeGreaterThan(
      computePatternGrounding(draftBundle),
    );
  });

  it('caps the score at 100 even with many patterns and cited sections', () => {
    const b = baseBundle();
    b.patternReferences = Array.from({ length: 6 }, (_, i) => ({
      ...patternRef(`P${i}`, 'BATTLE-TESTED', 100),
      sectionsCited: ['A', 'B', 'C', 'D', 'E'],
    }));
    expect(computePatternGrounding(b)).toBe(100);
  });
});

describe('computeEvidenceCoverage', () => {
  it('returns 0 with no evidence references', () => {
    expect(computeEvidenceCoverage(baseBundle())).toBe(0);
  });

  it('rewards high-confidence evidence more than low-confidence', () => {
    const lowBundle = baseBundle();
    lowBundle.evidenceReferences = [evidenceRef('E1', 'LOW')];
    const highBundle = baseBundle();
    highBundle.evidenceReferences = [evidenceRef('E1', 'HIGH')];
    expect(computeEvidenceCoverage(highBundle)).toBeGreaterThan(
      computeEvidenceCoverage(lowBundle),
    );
  });

  it('combines evidence-present bonus when the Evidence category is populated', () => {
    const b = baseBundle();
    markPresent(b, ['evidence']);
    b.evidenceReferences = [evidenceRef('E1', 'HIGH'), evidenceRef('E2', 'HIGH')];
    expect(computeEvidenceCoverage(b)).toBeGreaterThanOrEqual(
      CONTEXT_BUNDLE_SCORE_THRESHOLDS.completeMinEvidenceCoverage,
    );
  });
});

describe('computeWorkflowAwareness', () => {
  it('returns 0 when no workflow categories are present', () => {
    expect(computeWorkflowAwareness(baseBundle())).toBe(0);
  });

  it('scales when both work object and workflow state are present', () => {
    const b = baseBundle();
    markPresent(b, ['workObject', 'workflowState', 'artifacts']);
    b.artifactReferences = [artifactRef('A1')];
    expect(computeWorkflowAwareness(b)).toBeGreaterThanOrEqual(
      CONTEXT_BUNDLE_SCORE_THRESHOLDS.completeMinWorkflowAwareness,
    );
  });
});

describe('computeActionability', () => {
  it('returns 0 with no allowed actions', () => {
    expect(computeActionability(baseBundle())).toBe(0);
  });

  it('returns only a floor when all actions are disallowed', () => {
    const b = baseBundle();
    b.allowedActions = [
      {
        id: 'blocked-1',
        label: 'blocked',
        kind: 'ask',
        allowed: false,
        blockedReason: 'no-permission',
        requiresGateCheck: false,
        requiresEvidenceCheck: false,
      },
    ];
    expect(computeActionability(b)).toBeLessThan(20);
  });

  it('caps actionability when no work object is present', () => {
    const b = baseBundle();
    // Rich actions but no work object — portfolio-style.
    b.allowedActions = [
      allowed('nav', 'navigate'),
      allowed('ask', 'ask'),
      allowed('upload', 'uploadEvidence'),
    ];
    expect(computeActionability(b)).toBeLessThanOrEqual(60);
  });
});

describe('computeVanillaResponseRisk', () => {
  it('is 100 for an empty bundle', () => {
    expect(computeVanillaResponseRisk(baseBundle())).toBe(100);
  });

  it('drops substantially when identity, work object, evidence, and patterns are all present', () => {
    const b = completeBundle();
    expect(computeVanillaResponseRisk(b)).toBeLessThanOrEqual(
      CONTEXT_BUNDLE_SCORE_THRESHOLDS.completeMaxVanillaRisk,
    );
  });

  it('remains elevated when only identity and patterns exist (pattern_only)', () => {
    const b = patternOnlyBundle();
    const risk = computeVanillaResponseRisk(b);
    expect(risk).toBeGreaterThanOrEqual(40);
    expect(risk).toBeLessThan(80);
  });
});

// --- Classification ---------------------------------------------------

describe('classifyContextBundle', () => {
  it('classifies a full bundle as complete', () => {
    expect(classifyContextBundle(completeBundle())).toBe('complete');
  });

  it('classifies a partially populated bundle as usable_with_gaps', () => {
    expect(classifyContextBundle(usableWithGapsBundle())).toBe('usable_with_gaps');
  });

  it('classifies a pattern-heavy but work-object-absent bundle as pattern_only', () => {
    expect(classifyContextBundle(patternOnlyBundle())).toBe('pattern_only');
  });

  it('classifies an identity-only bundle as insufficient', () => {
    expect(classifyContextBundle(insufficientBundle())).toBe('insufficient');
  });

  it('classifies a bundle with blocking missing inputs as blocked', () => {
    expect(classifyContextBundle(blockedBundle())).toBe('blocked');
  });

  it('classifies a bundle with missing identity as blocked', () => {
    expect(classifyContextBundle(baseBundle())).toBe('blocked');
  });
});

// --- Edge-case inputs -------------------------------------------------

describe('classifyContextBundle · edge cases', () => {
  it('downgrades to pattern_only when work object is missing but patterns are strong', () => {
    const b = baseBundle();
    markPresent(b, ['identity', 'patterns', 'conversation']);
    b.patternReferences = [patternRef('P1', 'BATTLE-TESTED', 95)];
    expect(classifyContextBundle(b)).toBe('pattern_only');
  });

  it('downgrades to usable_with_gaps when evidence is missing but work object exists', () => {
    const b = baseBundle();
    markPresent(b, ['identity', 'workObject', 'workflowState', 'artifacts']);
    b.artifactReferences = [artifactRef('A1')];
    b.allowedActions = [allowed('ask-input', 'requestInput')];
    // No patterns, no evidence — not enough to be complete or pattern_only.
    expect(classifyContextBundle(b)).toBe('usable_with_gaps');
  });

  it('flags high vanilla-response risk when bundle is thin', () => {
    const score = scoreContextBundle(insufficientBundle());
    expect(score.vanilla_response_risk).toBeGreaterThan(60);
  });

  it('never classifies a bundle without identity as anything but blocked', () => {
    const b = baseBundle();
    markPresent(b, ['workObject', 'workflowState', 'patterns', 'evidence']);
    b.patternReferences = [patternRef('P1', 'BATTLE-TESTED', 95)];
    b.evidenceReferences = [evidenceRef('E1', 'HIGH')];
    // Identity remains absent in baseBundle.
    expect(classifyContextBundle(b)).toBe('blocked');
  });
});

// --- Aggregator -------------------------------------------------------

describe('scoreContextBundle', () => {
  it('returns HIGH confidence for complete bundles', () => {
    expect(scoreContextBundle(completeBundle()).overallConfidence).toBe('HIGH');
  });

  it('returns MEDIUM confidence for usable_with_gaps and pattern_only', () => {
    expect(scoreContextBundle(usableWithGapsBundle()).overallConfidence).toBe(
      'MEDIUM',
    );
    expect(scoreContextBundle(patternOnlyBundle()).overallConfidence).toBe(
      'MEDIUM',
    );
  });

  it('returns LOW confidence for insufficient and blocked', () => {
    expect(scoreContextBundle(insufficientBundle()).overallConfidence).toBe('LOW');
    expect(scoreContextBundle(blockedBundle()).overallConfidence).toBe('LOW');
  });

  it('is deterministic for the same bundle across repeated calls', () => {
    const b = completeBundle();
    const a = scoreContextBundle(b);
    const b2 = scoreContextBundle(b);
    expect(a).toEqual(b2);
  });

  it('notes when evidence is missing', () => {
    const score = scoreContextBundle(patternOnlyBundle());
    expect(score.notes.some((n) => /evidence/i.test(n))).toBe(true);
  });

  it('notes when work object is missing', () => {
    const score = scoreContextBundle(patternOnlyBundle());
    expect(score.notes.some((n) => /work object/i.test(n))).toBe(true);
  });
});

// --- Response gate ----------------------------------------------------

describe('createResponseGate', () => {
  it('maps complete to proceed', () => {
    const b = completeBundle();
    b.state = classifyContextBundle(b);
    const gate = createResponseGate(b);
    expect(gate.state).toBe('complete');
    expect(gate.reason).toBe('proceed');
    expect(gate.permitsResponse).toBe(true);
    expect(gate.requiresDisclosure).toBe(false);
    expect(gate.requiresPatternLabeling).toBe(false);
    expect(gate.requiresRefusal).toBe(false);
    expect(gate.requiresGuidedChoices).toBe(false);
  });

  it('maps usable_with_gaps to proceed_with_disclosure', () => {
    const b = usableWithGapsBundle();
    b.state = classifyContextBundle(b);
    const gate = createResponseGate(b);
    expect(gate.state).toBe('usable_with_gaps');
    expect(gate.reason).toBe('proceed_with_disclosure');
    expect(gate.permitsResponse).toBe(true);
    expect(gate.requiresDisclosure).toBe(true);
  });

  it('maps pattern_only with evidence gap and no work object to ask_for_missing_context', () => {
    const b = patternOnlyBundle();
    b.state = classifyContextBundle(b);
    const gate = createResponseGate(b);
    expect(gate.state).toBe('pattern_only');
    expect(gate.reason).toBe('ask_for_missing_context');
    expect(gate.permitsResponse).toBe(false);
    expect(gate.requiresGuidedChoices).toBe(true);
    expect(gate.requiresPatternLabeling).toBe(true);
  });

  it('maps pattern_only with some event context to proceed_with_disclosure', () => {
    const b = baseBundle();
    // Pattern-only but the work object exists so we can still anchor.
    markPresent(b, ['identity', 'workObject', 'patterns']);
    b.patternReferences = [patternRef('P1', 'BATTLE-TESTED', 95)];
    b.allowedActions = [allowed('ask-input', 'requestInput')];
    b.state = classifyContextBundle(b);
    const gate = createResponseGate(b);
    expect(gate.state).toBe('pattern_only');
    expect(gate.reason).toBe('proceed_with_disclosure');
    expect(gate.requiresPatternLabeling).toBe(true);
    expect(gate.permitsResponse).toBe(true);
  });

  it('maps insufficient to ask_for_missing_context', () => {
    const b = insufficientBundle();
    b.state = classifyContextBundle(b);
    const gate = createResponseGate(b);
    expect(gate.state).toBe('insufficient');
    expect(gate.reason).toBe('ask_for_missing_context');
    expect(gate.permitsResponse).toBe(false);
    expect(gate.requiresGuidedChoices).toBe(true);
  });

  it('maps blocked to refuse_or_defer and encodes blocking input ids', () => {
    const b = blockedBundle();
    b.state = classifyContextBundle(b);
    const gate = createResponseGate(b);
    expect(gate.state).toBe('blocked');
    expect(gate.permitsResponse).toBe(false);
    expect(gate.requiresRefusal).toBe(true);
    expect(gate.reason.startsWith('refuse_or_defer')).toBe(true);
    expect(gate.reason).toContain('tenant-access-approval');
  });
});
