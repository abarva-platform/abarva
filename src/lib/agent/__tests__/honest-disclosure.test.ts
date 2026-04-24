// Deterministic tests for S5 honest-disclosure metadata derivation.
//
// Pure mapping from S1 ContextBundle + S2 scoring/gate to a renderer-
// facing HonestDisclosureMetadata block. No model calls, no network.

import {
  CONTEXT_CATEGORY_LABELS,
  deriveConfidenceLevelFromContextScore,
  deriveContextUsedLabels,
  deriveDisclosureMessage,
  deriveHonestDisclosureMetadata,
} from '../honestDisclosure';
import {
  createEmptyContextBundle,
  type ContextBundle,
  type ContextBundleAssemblyInput,
  type ContextBundleEvidenceReference,
  type ContextBundleMissingInput,
  type ContextBundlePatternReference,
  type ContextBundleQualityScore,
} from '../context-bundle';
import {
  classifyContextBundle,
  createResponseGate,
  scoreContextBundle,
} from '../context-bundle-scoring';
import type { RenderedResponse } from '../renderedResponse';

// --- Bundle fixtures (mirror S2 test patterns) ------------------------

const baseInput: ContextBundleAssemblyInput = {
  tenantId: 'tenant-meridian',
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

function baseBundle(): ContextBundle {
  return createEmptyContextBundle(baseInput);
}

function markPresent(
  bundle: ContextBundle,
  keys: Array<keyof ContextBundle['categories']>,
): void {
  for (const key of keys) {
    bundle.categories[key] = {
      ...bundle.categories[key],
      present: true,
      provenance: 'deterministic',
      missingFields: [],
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
  b.patternReferences = [patternRef('P1', 'BATTLE-TESTED', 92)];
  b.allowedActions = [
    {
      id: 'a',
      label: 'Open artifact',
      kind: 'openArtifact',
      allowed: true,
      requiresGateCheck: false,
      requiresEvidenceCheck: false,
    },
    {
      id: 'b',
      label: 'Review gate',
      kind: 'reviewGate',
      allowed: true,
      requiresGateCheck: true,
      requiresEvidenceCheck: false,
    },
    {
      id: 'c',
      label: 'Upload',
      kind: 'uploadEvidence',
      allowed: true,
      requiresGateCheck: false,
      requiresEvidenceCheck: false,
    },
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
  b.missingInputs = [
    {
      id: 'm1',
      label: 'Application inventory',
      category: 'evidence',
      blocking: false,
    },
    {
      id: 'm2',
      label: 'Workload baseline',
      category: 'evidence',
      blocking: false,
    },
  ];
  b.allowedActions = [
    {
      id: 'a',
      label: 'Ask for input',
      kind: 'requestInput',
      allowed: true,
      requiresGateCheck: false,
      requiresEvidenceCheck: false,
    },
  ];
  return b;
}

function patternOnlyBundle(): ContextBundle {
  const b = baseBundle();
  markPresent(b, ['identity', 'patterns']);
  b.patternReferences = [patternRef('P1', 'BATTLE-TESTED', 95)];
  b.allowedActions = [
    {
      id: 'a',
      label: 'Ask',
      kind: 'ask',
      allowed: true,
      requiresGateCheck: false,
      requiresEvidenceCheck: false,
    },
  ];
  return b;
}

function insufficientBundle(): ContextBundle {
  const b = baseBundle();
  markPresent(b, ['identity']);
  return b;
}

function blockedBundle(): ContextBundle {
  const b = baseBundle();
  markPresent(b, ['identity', 'workObject']);
  b.missingInputs = [
    {
      id: 'block-1',
      label: 'Tenant access approval',
      category: 'identity',
      blocking: true,
    } satisfies ContextBundleMissingInput,
  ];
  return b;
}

function scoreBundle(b: ContextBundle): ContextBundle {
  const state = classifyContextBundle(b);
  b.state = state;
  b.qualityScore = scoreContextBundle(b);
  b.responseGate = createResponseGate(b);
  return b;
}

// ---------------------------------------------------------------------
// deriveConfidenceLevelFromContextScore
// ---------------------------------------------------------------------

describe('deriveConfidenceLevelFromContextScore', () => {
  it('returns HIGH for complete bundles with low vanilla-response risk', () => {
    const b = scoreBundle(completeBundle());
    expect(deriveConfidenceLevelFromContextScore(b.qualityScore, b.state)).toBe(
      'HIGH',
    );
  });

  it('downgrades HIGH to MEDIUM when vanilla-response risk exceeds threshold', () => {
    const score: ContextBundleQualityScore = {
      context_completeness: 90,
      pattern_grounding: 80,
      evidence_coverage: 80,
      workflow_awareness: 80,
      actionability: 80,
      vanilla_response_risk: 75,
      overallConfidence: 'HIGH',
      notes: [],
    };
    expect(deriveConfidenceLevelFromContextScore(score)).toBe('MEDIUM');
  });

  it('returns MEDIUM for usable_with_gaps and pattern_only', () => {
    const u = scoreBundle(usableWithGapsBundle());
    expect(deriveConfidenceLevelFromContextScore(u.qualityScore, u.state)).toBe(
      'MEDIUM',
    );
    const p = scoreBundle(patternOnlyBundle());
    expect(deriveConfidenceLevelFromContextScore(p.qualityScore, p.state)).toBe(
      'MEDIUM',
    );
  });

  it('returns LOW for insufficient and blocked', () => {
    const i = scoreBundle(insufficientBundle());
    expect(deriveConfidenceLevelFromContextScore(i.qualityScore, i.state)).toBe(
      'LOW',
    );
    const x = scoreBundle(blockedBundle());
    expect(deriveConfidenceLevelFromContextScore(x.qualityScore, x.state)).toBe(
      'LOW',
    );
  });

  it('falls back on the state alone when no score is provided', () => {
    expect(deriveConfidenceLevelFromContextScore(null, 'complete')).toBe('HIGH');
    expect(deriveConfidenceLevelFromContextScore(null, 'usable_with_gaps')).toBe(
      'MEDIUM',
    );
    expect(deriveConfidenceLevelFromContextScore(null, 'pattern_only')).toBe(
      'MEDIUM',
    );
    expect(deriveConfidenceLevelFromContextScore(null, 'insufficient')).toBe(
      'LOW',
    );
    expect(deriveConfidenceLevelFromContextScore(null, 'blocked')).toBe('LOW');
    expect(deriveConfidenceLevelFromContextScore(null)).toBe('LOW');
  });
});

// ---------------------------------------------------------------------
// deriveDisclosureMessage
// ---------------------------------------------------------------------

describe('deriveDisclosureMessage', () => {
  it('returns the canonical message for each state', () => {
    expect(deriveDisclosureMessage({ state: 'complete' })).toMatch(
      /enough client, workflow, evidence, and pattern context/i,
    );
    expect(deriveDisclosureMessage({ state: 'usable_with_gaps' })).toMatch(
      /directional recommendation/i,
    );
    expect(deriveDisclosureMessage({ state: 'pattern_only' })).toMatch(
      /pattern-informed/i,
    );
    expect(deriveDisclosureMessage({ state: 'insufficient' })).toMatch(
      /not have enough context/i,
    );
    expect(deriveDisclosureMessage({ state: 'blocked' })).toMatch(
      /cannot responsibly answer/i,
    );
  });

  it('returns null when no state is provided', () => {
    expect(deriveDisclosureMessage({})).toBeNull();
  });

  it('appends missing inputs for usable_with_gaps and pattern_only states', () => {
    const message = deriveDisclosureMessage({
      state: 'usable_with_gaps',
      missingInputs: ['Application inventory', 'Workload baseline', 'Pricing'],
    });
    expect(message).toMatch(/Missing: Application inventory, Workload baseline/);
    expect(message).toMatch(/plus 1 more/);
  });

  it('flags elevated vanilla-risk inline for complete bundles', () => {
    const message = deriveDisclosureMessage({
      state: 'complete',
      vanillaResponseRisk: 80,
    });
    expect(message).toMatch(/could read as generic/i);
  });
});

// ---------------------------------------------------------------------
// deriveContextUsedLabels
// ---------------------------------------------------------------------

describe('deriveContextUsedLabels', () => {
  it('returns the human-friendly label for each present category', () => {
    const labels = deriveContextUsedLabels(scoreBundle(completeBundle()));
    expect(labels).toContain(CONTEXT_CATEGORY_LABELS.identity);
    expect(labels).toContain(CONTEXT_CATEGORY_LABELS.evidence);
    expect(labels).toContain(CONTEXT_CATEGORY_LABELS.patterns);
    expect(labels.length).toBe(8);
  });

  it('omits absent categories', () => {
    const labels = deriveContextUsedLabels(scoreBundle(insufficientBundle()));
    expect(labels).toEqual(['Identity']);
  });

  it('accepts a summary shape', () => {
    const summary = {
      bundleId: 'b',
      surface: 'programs' as const,
      route: '/x',
      tenantId: 'tenant-1',
      state: 'complete' as const,
      presentCategoryKeys: ['identity', 'patterns'] as Array<
        'identity' | 'patterns'
      >,
      absentCategoryKeys: [] as Array<'identity' | 'patterns'>,
      missingInputCount: 0,
      allowedActionCount: 0,
      evidenceCount: 0,
      patternCount: 0,
      artifactCount: 0,
      overallConfidence: 'HIGH' as const,
    };
    expect(deriveContextUsedLabels(summary)).toEqual(['Identity', 'Pattern library']);
  });

  it('returns an empty array when given null/undefined', () => {
    expect(deriveContextUsedLabels(null)).toEqual([]);
    expect(deriveContextUsedLabels(undefined)).toEqual([]);
  });
});

// ---------------------------------------------------------------------
// deriveHonestDisclosureMetadata
// ---------------------------------------------------------------------

describe('deriveHonestDisclosureMetadata', () => {
  it('returns HIGH confidence and proceed gate for a complete bundle', () => {
    const b = scoreBundle(completeBundle());
    const meta = deriveHonestDisclosureMetadata({ bundle: b });
    expect(meta.contextBundleState).toBe('complete');
    expect(meta.confidenceLevel).toBe('HIGH');
    expect(meta.responseGate).toBe('proceed');
    expect(meta.recommendedResponseMode).toBe('proceed');
    expect(meta.permitsResponse).toBe(true);
    expect(meta.disclosureMessage).toMatch(/grounded recommendation/i);
    expect(meta.contextCategoriesUsed?.length).toBe(8);
    expect(meta.missingInputs).toEqual([]);
    expect(typeof meta.vanillaResponseRisk).toBe('number');
  });

  it('returns MEDIUM with disclosure for usable_with_gaps including named missing inputs', () => {
    const b = scoreBundle(usableWithGapsBundle());
    const meta = deriveHonestDisclosureMetadata({ bundle: b });
    expect(meta.contextBundleState).toBe('usable_with_gaps');
    expect(meta.confidenceLevel).toBe('MEDIUM');
    expect(meta.responseGate).toBe('proceed_with_disclosure');
    expect(meta.permitsResponse).toBe(true);
    expect(meta.missingInputs).toContain('Application inventory');
    expect(meta.disclosureMessage).toMatch(/Application inventory/);
  });

  it('returns MEDIUM and ask_for_missing_context for pattern_only without work object', () => {
    const b = scoreBundle(patternOnlyBundle());
    const meta = deriveHonestDisclosureMetadata({ bundle: b });
    expect(meta.contextBundleState).toBe('pattern_only');
    expect(meta.confidenceLevel).toBe('MEDIUM');
    expect(meta.responseGate).toBe('ask_for_missing_context');
    expect(meta.permitsResponse).toBe(false);
    expect(meta.disclosureMessage).toMatch(/pattern-informed/i);
  });

  it('returns LOW confidence and ask_for_missing_context for insufficient', () => {
    const b = scoreBundle(insufficientBundle());
    const meta = deriveHonestDisclosureMetadata({ bundle: b });
    expect(meta.contextBundleState).toBe('insufficient');
    expect(meta.confidenceLevel).toBe('LOW');
    expect(meta.responseGate).toBe('ask_for_missing_context');
    expect(meta.permitsResponse).toBe(false);
    expect(meta.disclosureMessage).toMatch(/not have enough context/i);
  });

  it('returns LOW confidence and refuse_or_defer with non-permissive language for blocked', () => {
    const b = scoreBundle(blockedBundle());
    const meta = deriveHonestDisclosureMetadata({ bundle: b });
    expect(meta.contextBundleState).toBe('blocked');
    expect(meta.confidenceLevel).toBe('LOW');
    expect(meta.responseGate).toBe('refuse_or_defer');
    expect(meta.permitsResponse).toBe(false);
    expect(meta.disclosureMessage).toMatch(/cannot responsibly answer/i);
  });

  it('lowers confidence when vanilla-response risk is elevated even on a high-completeness bundle', () => {
    const b = scoreBundle(completeBundle());
    // Synthesize an elevated risk by mutating the score copy that the
    // helper reads. The bundle itself is otherwise unchanged.
    const inflated: ContextBundleQualityScore = {
      ...b.qualityScore!,
      vanilla_response_risk: 75,
    };
    const meta = deriveHonestDisclosureMetadata({
      bundle: b,
      qualityScore: inflated,
    });
    expect(meta.confidenceLevel).toBe('MEDIUM');
  });

  it('surfaces missing inputs in metadata for bundles with non-empty missingInputs', () => {
    const b = scoreBundle(usableWithGapsBundle());
    const meta = deriveHonestDisclosureMetadata({ bundle: b });
    expect(meta.missingInputs).toEqual([
      'Application inventory',
      'Workload baseline',
    ]);
  });

  it('is deterministic across repeated calls with the same bundle', () => {
    const b = scoreBundle(usableWithGapsBundle());
    const a = deriveHonestDisclosureMetadata({ bundle: b });
    const c = deriveHonestDisclosureMetadata({ bundle: b });
    expect(a).toEqual(c);
  });

  it('still works when only a state is supplied (no bundle, no score)', () => {
    const meta = deriveHonestDisclosureMetadata({ state: 'pattern_only' });
    expect(meta.contextBundleState).toBe('pattern_only');
    expect(meta.confidenceLevel).toBe('MEDIUM');
    expect(meta.disclosureMessage).toMatch(/pattern-informed/i);
    expect(meta.contextCategoriesUsed).toEqual([]);
    expect(meta.missingInputs).toEqual([]);
  });
});

// ---------------------------------------------------------------------
// Backwards compatibility: legacy RenderedResponse without metadata
// ---------------------------------------------------------------------

describe('RenderedResponse · backwards compatibility', () => {
  it('compiles a legacy rendered response with no honest_disclosure block', () => {
    const legacy: RenderedResponse = {
      response_text: 'Here is a legacy response.',
      citations: [],
      confidence_signal: 'medium',
      sparsity_flag: false,
      follow_up_actions: [],
      handoff_affordance: null,
    };
    expect(legacy.honest_disclosure).toBeUndefined();
  });

  it('compiles a rendered response with an honest_disclosure block attached', () => {
    const meta = deriveHonestDisclosureMetadata({
      bundle: scoreBundle(completeBundle()),
    });
    const next: RenderedResponse = {
      response_text: 'Here is a grounded response.',
      citations: [],
      confidence_signal: 'high',
      sparsity_flag: false,
      follow_up_actions: [],
      handoff_affordance: null,
      honest_disclosure: meta,
    };
    expect(next.honest_disclosure?.confidenceLevel).toBe('HIGH');
  });

  it('does not crash when given null inputs', () => {
    expect(() =>
      deriveHonestDisclosureMetadata({
        bundle: null,
        summary: null,
        state: null,
        qualityScore: null,
        responseGate: null,
      }),
    ).not.toThrow();
  });
});
