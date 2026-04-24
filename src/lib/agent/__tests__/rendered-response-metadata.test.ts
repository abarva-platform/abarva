// Deterministic tests for the S6 rendered-response view-model mapper.
//
// Pure mapping from RenderedResponse.honest_disclosure (S5) into the
// shape AgentResponse + HonestDisclosureBanner + ConfidenceQualifier
// + SparsitySignal consume. No React rendering, no DOM. Same inputs
// produce identical outputs.

import {
  getHonestDisclosureViewModel,
  type HonestDisclosureViewModel,
} from '../rendered-response-ui';
import {
  deriveHonestDisclosureMetadata,
} from '../honestDisclosure';
import {
  createEmptyContextBundle,
  type ContextBundle,
  type ContextBundleAssemblyInput,
  type ContextBundleEvidenceReference,
  type ContextBundlePatternReference,
} from '../context-bundle';
import {
  classifyContextBundle,
  createResponseGate,
  scoreContextBundle,
} from '../context-bundle-scoring';
import type {
  HonestDisclosureMetadata,
  RenderedResponse,
} from '../renderedResponse';

// --- Bundle fixtures (mirror S2/S5 patterns) --------------------------

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

function scoreBundle(b: ContextBundle): ContextBundle {
  b.state = classifyContextBundle(b);
  b.qualityScore = scoreContextBundle(b);
  b.responseGate = createResponseGate(b);
  return b;
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
      id: 'open-artifact',
      label: 'Open artifact',
      kind: 'openArtifact',
      allowed: true,
      requiresGateCheck: false,
      requiresEvidenceCheck: false,
    },
    {
      id: 'review-gate',
      label: 'Review gate',
      kind: 'reviewGate',
      allowed: true,
      requiresGateCheck: true,
      requiresEvidenceCheck: false,
    },
    {
      id: 'upload',
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
  markPresent(b, ['identity', 'workObject', 'workflowState', 'artifacts', 'patterns']);
  b.evidenceReferences = [evidenceRef('E1', 'MEDIUM')];
  b.patternReferences = [patternRef('P1', 'AUTHORED-REVIEWED', 70)];
  b.missingInputs = [
    { id: 'm1', label: 'Application inventory', category: 'evidence', blocking: false },
    { id: 'm2', label: 'Workload baseline', category: 'evidence', blocking: false },
  ];
  b.allowedActions = [
    {
      id: 'ask-input',
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
      id: 'ask',
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
    { id: 'block-1', label: 'Tenant access approval', category: 'identity', blocking: true },
  ];
  return b;
}

// --- Response fixture builder -----------------------------------------

function buildResponse(overrides: Partial<RenderedResponse> = {}): RenderedResponse {
  return {
    response_text: 'Body text',
    citations: [],
    confidence_signal: 'medium',
    sparsity_flag: false,
    follow_up_actions: [],
    handoff_affordance: null,
    ...overrides,
  };
}

function buildResponseFromBundle(
  bundle: ContextBundle,
  overrides: Partial<RenderedResponse> = {},
): RenderedResponse {
  const meta: HonestDisclosureMetadata = deriveHonestDisclosureMetadata({ bundle });
  return buildResponse({ honest_disclosure: meta, ...overrides });
}

// =====================================================================
// Tests
// =====================================================================

describe('getHonestDisclosureViewModel · legacy responses', () => {
  it('returns an empty model when honest_disclosure is undefined', () => {
    const vm = getHonestDisclosureViewModel(buildResponse());
    expect(vm.bannerKind).toBeNull();
    expect(vm.confidence).toBeNull();
    expect(vm.contextCategoriesUsed).toEqual([]);
    expect(vm.missingInputs).toEqual([]);
    expect(vm.permitsResponse).toBeNull();
    expect(vm.disclosureMessage).toBeUndefined();
  });

  it('returns an empty model regardless of sparsity_flag when no metadata is attached', () => {
    const vm = getHonestDisclosureViewModel(buildResponse({ sparsity_flag: true }));
    expect(vm.bannerKind).toBeNull();
    expect(vm.sparsityEvidenceSummary).toBeUndefined();
  });
});

describe('getHonestDisclosureViewModel · complete bundle', () => {
  it('renders no banner, HIGH confidence, all 8 categories, no missing inputs', () => {
    const bundle = scoreBundle(completeBundle());
    const vm = getHonestDisclosureViewModel(buildResponseFromBundle(bundle));
    expect(vm.bannerKind).toBeNull();
    expect(vm.confidence?.tier).toBe('HIGH');
    expect(vm.contextCategoriesUsed.length).toBe(8);
    expect(vm.missingInputs).toEqual([]);
    expect(vm.permitsResponse).toBe(true);
    expect(vm.recommendedResponseMode).toBe('proceed');
    expect(vm.disclosureMessage).toMatch(/grounded recommendation/i);
  });
});

describe('getHonestDisclosureViewModel · usable_with_gaps bundle', () => {
  it('renders no banner but surfaces MEDIUM confidence and missing inputs', () => {
    const bundle = scoreBundle(usableWithGapsBundle());
    const vm = getHonestDisclosureViewModel(buildResponseFromBundle(bundle));
    expect(vm.bannerKind).toBeNull();
    expect(vm.confidence?.tier).toBe('MEDIUM');
    expect(vm.missingInputs).toContain('Application inventory');
    expect(vm.permitsResponse).toBe(true);
    expect(vm.recommendedResponseMode).toBe('proceed_with_disclosure');
    expect(vm.disclosureMessage).toMatch(/Application inventory/);
  });
});

describe('getHonestDisclosureViewModel · pattern_only bundle', () => {
  it('renders a quality banner when the gate refuses event-specific prose', () => {
    const bundle = scoreBundle(patternOnlyBundle());
    const vm = getHonestDisclosureViewModel(buildResponseFromBundle(bundle));
    expect(vm.bannerKind).toBe('quality');
    expect(vm.qualityIssueLabel).toBe('context_insufficient');
    expect(vm.confidence?.tier).toBe('MEDIUM');
    expect(vm.recommendedResponseMode).toBe('ask_for_missing_context');
    expect(vm.permitsResponse).toBe(false);
    expect(vm.disclosureMessage).toMatch(/pattern-informed/i);
  });
});

describe('getHonestDisclosureViewModel · insufficient bundle', () => {
  it('renders a quality banner with LOW confidence and ask_for_missing_context mode', () => {
    const bundle = scoreBundle(insufficientBundle());
    const vm = getHonestDisclosureViewModel(buildResponseFromBundle(bundle));
    expect(vm.bannerKind).toBe('quality');
    expect(vm.qualityIssueLabel).toBe('context_insufficient');
    expect(vm.confidence?.tier).toBe('LOW');
    expect(vm.permitsResponse).toBe(false);
    expect(vm.recommendedResponseMode).toBe('ask_for_missing_context');
  });
});

describe('getHonestDisclosureViewModel · blocked bundle', () => {
  it('renders a cannot_help banner with LOW confidence and refuse_or_defer mode', () => {
    const bundle = scoreBundle(blockedBundle());
    const vm = getHonestDisclosureViewModel(buildResponseFromBundle(bundle));
    expect(vm.bannerKind).toBe('cannot_help');
    expect(vm.confidence?.tier).toBe('LOW');
    expect(vm.permitsResponse).toBe(false);
    expect(vm.recommendedResponseMode).toBe('refuse_or_defer');
    expect(vm.disclosureMessage).toMatch(/cannot responsibly answer/i);
    expect(vm.bannerDetail).toMatch(/cannot responsibly answer/i);
  });
});

describe('getHonestDisclosureViewModel · explicit quality_issues', () => {
  it('prefers the quality banner kind even when state would suppress it', () => {
    const bundle = scoreBundle(completeBundle());
    const response = buildResponseFromBundle(bundle, {
      quality_issues: ['hallucinated_citation_stripped'],
    });
    const vm = getHonestDisclosureViewModel(response);
    expect(vm.bannerKind).toBe('quality');
    expect(vm.qualityIssueLabel).toBe('hallucinated_citation_stripped');
  });
});

describe('getHonestDisclosureViewModel · sparsity addendum', () => {
  it('forwards a missing-inputs summary for sparse responses with metadata', () => {
    const bundle = scoreBundle(usableWithGapsBundle());
    const response = buildResponseFromBundle(bundle, { sparsity_flag: true });
    const vm = getHonestDisclosureViewModel(response);
    expect(vm.sparsityEvidenceSummary).toMatch(/Missing: Application inventory/);
  });

  it('falls back to the disclosure message when no missing inputs are present', () => {
    const bundle = scoreBundle(completeBundle());
    const response = buildResponseFromBundle(bundle, { sparsity_flag: true });
    const vm = getHonestDisclosureViewModel(response);
    expect(vm.sparsityEvidenceSummary).toMatch(/grounded recommendation/i);
  });

  it('produces no addendum when sparsity_flag is false', () => {
    const bundle = scoreBundle(usableWithGapsBundle());
    const response = buildResponseFromBundle(bundle, { sparsity_flag: false });
    const vm = getHonestDisclosureViewModel(response);
    expect(vm.sparsityEvidenceSummary).toBeUndefined();
  });
});

describe('getHonestDisclosureViewModel · determinism', () => {
  it('produces identical view models for the same response across repeated calls', () => {
    const bundle = scoreBundle(usableWithGapsBundle());
    const response = buildResponseFromBundle(bundle);
    const a = getHonestDisclosureViewModel(response);
    const b = getHonestDisclosureViewModel(response);
    expect(a).toEqual(b satisfies HonestDisclosureViewModel);
  });

  it('does not mutate the input response object', () => {
    const bundle = scoreBundle(usableWithGapsBundle());
    const response = buildResponseFromBundle(bundle, { sparsity_flag: true });
    const snapshot = JSON.stringify(response);
    getHonestDisclosureViewModel(response);
    expect(JSON.stringify(response)).toBe(snapshot);
  });
});

describe('getHonestDisclosureViewModel · partial metadata', () => {
  it('handles a metadata block that contains only a state and confidence', () => {
    const response = buildResponse({
      honest_disclosure: {
        contextBundleState: 'pattern_only',
        confidenceLevel: 'MEDIUM',
      },
    });
    const vm = getHonestDisclosureViewModel(response);
    expect(vm.confidence?.tier).toBe('MEDIUM');
    // No recommendedResponseMode → no banner.
    expect(vm.bannerKind).toBeNull();
    expect(vm.contextCategoriesUsed).toEqual([]);
    expect(vm.missingInputs).toEqual([]);
    expect(vm.permitsResponse).toBeNull();
  });

  it('handles metadata with permitsResponse explicitly true', () => {
    const response = buildResponse({
      honest_disclosure: {
        contextBundleState: 'usable_with_gaps',
        confidenceLevel: 'MEDIUM',
        permitsResponse: true,
        recommendedResponseMode: 'proceed_with_disclosure',
      },
    });
    const vm = getHonestDisclosureViewModel(response);
    expect(vm.permitsResponse).toBe(true);
  });
});
