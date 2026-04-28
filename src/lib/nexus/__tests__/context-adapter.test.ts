// Deterministic tests for the Nexus Context Bundle adapter (S4).
//
// The adapter is pure: same inputs produce identical outputs.  No model
// calls, no network. These tests build small inline fixtures and assert
// state, scoring, gating, and that input objects are not mutated.

import {
  adaptToContextBundle,
  buildOrchestratorContextBundleFields,
  type NexusContextAdapterInput,
} from '../context-adapter';
import type { CompositionBundle } from '../assembler';
import type { OrchestratorInput } from '../orchestrator';
import type { SessionContext } from '../sessionContext';
import type {
  EvidenceClaim,
} from '../specialists/evidence';
import type { Source } from '@/lib/intelligence/types';

// ---------------------------------------------------------------------
// Fixture builders
// ---------------------------------------------------------------------

function pipelineInput(
  overrides: Partial<OrchestratorInput> = {},
): OrchestratorInput {
  return {
    query: 'What should I do next?',
    tenancy: { clientId: 'client-northstar', userId: 'user-tester' },
    priorTurns: [],
    ...overrides,
  };
}

function source(
  id: string,
  type: Source['type'] = 'pattern',
  confidence: Source['confidence'] = 'high',
): Source {
  return {
    id,
    type,
    name: `Source ${id}`,
    confidence,
    asOf: '2026-04-01T00:00:00.000Z',
  };
}

function claim(
  text: string,
  sourceId: string,
  confidence: 'high' | 'medium' | 'low' = 'high',
  type: Source['type'] = 'pattern',
): EvidenceClaim {
  return {
    text,
    source: source(sourceId, type, confidence),
    confidence,
    dimension: 'graph',
  };
}

function compositionBundle(
  overrides: Partial<CompositionBundle> = {},
): CompositionBundle {
  return {
    mode: 'grounded',
    query: 'What should I do next?',
    entities: [],
    evidence: [],
    valueSignals: [],
    valueHeadline: null,
    contradictions: [],
    contradictionSelfCheck: null,
    decision: { crux: null, branches: [], tiebreaker: null },
    sources: [],
    contextTokenEstimate: 0,
    ...overrides,
  };
}

function sessionContext(
  overrides: Partial<SessionContext> = {},
): SessionContext {
  return {
    user: {
      id: 'user-tester',
      name: 'Tester One',
      role: 'cio',
      email: 'tester+one@example.com',
      isVip: false,
      vipProfile: null,
    },
    tenant: {
      clientId: 'client-northstar',
      clientName: 'Northstar Holdings',
      industryCode: 'SVC',
    },
    recentEngagements: [
      {
        id: 'eng-1',
        name: 'Modernization',
        currentPhase: 3,
        status: 'in_progress',
        lastActivityAt: '2026-04-20T00:00:00.000Z',
      },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------
// Empty / minimal · should be insufficient or blocked
// ---------------------------------------------------------------------

describe('adaptToContextBundle · empty / minimal Nexus input', () => {
  it('produces an insufficient or blocked bundle for a bare pipeline input', () => {
    const result = adaptToContextBundle({ pipelineInput: pipelineInput() });
    expect(['insufficient', 'blocked']).toContain(result.state);
    expect(result.responseGate.permitsResponse).toBe(false);
  });

  it('blocks when tenancy.clientId is missing (identity absent)', () => {
    const result = adaptToContextBundle({
      pipelineInput: pipelineInput({
        tenancy: { clientId: '', userId: 'user-tester' },
      }),
    });
    expect(result.state).toBe('blocked');
    expect(result.responseGate.requiresRefusal).toBe(true);
  });

  it('marks identity-missing as a blocking missing input', () => {
    const result = adaptToContextBundle({
      pipelineInput: pipelineInput({
        tenancy: { clientId: '', userId: '' },
      }),
    });
    const blockingInputs = result.bundle.missingInputs.filter((m) => m.blocking);
    expect(blockingInputs.length).toBeGreaterThanOrEqual(1);
    expect(blockingInputs.some((m) => m.category === 'identity')).toBe(true);
  });
});

// ---------------------------------------------------------------------
// Pattern-only context
// ---------------------------------------------------------------------

describe('adaptToContextBundle · pattern-only Nexus context', () => {
  it('classifies pattern-heavy bundles without work object as pattern_only', () => {
    const composition = compositionBundle({
      sources: [
        source('pattern-1', 'pattern', 'high'),
        source('pattern-2', 'pattern', 'high'),
        source('framework-1', 'framework', 'medium'),
      ],
    });
    const result = adaptToContextBundle({
      pipelineInput: pipelineInput(),
      compositionBundle: composition,
      session: null,
    });
    expect(result.state).toBe('pattern_only');
    expect(result.bundle.patternReferences.length).toBe(3);
  });

  it('routes pattern_only with no event context to ask_for_missing_context', () => {
    const composition = compositionBundle({
      sources: [
        source('pattern-1', 'pattern', 'high'),
        source('pattern-2', 'pattern', 'high'),
      ],
    });
    const result = adaptToContextBundle({
      pipelineInput: pipelineInput(),
      compositionBundle: composition,
    });
    expect(result.responseGate.reason).toBe('ask_for_missing_context');
    expect(result.responseGate.requiresPatternLabeling).toBe(true);
  });
});

// ---------------------------------------------------------------------
// Work object + evidence · usable_with_gaps or complete
// ---------------------------------------------------------------------

describe('adaptToContextBundle · work object + evidence', () => {
  it('produces a usable_with_gaps or complete bundle when entities + evidence + session are present', () => {
    const composition = compositionBundle({
      entities: ['ENG-1'],
      evidence: [
        claim('payer mix is heavy MA', 'src-1', 'high'),
        claim('vendor concentration risk on Vendor X', 'src-2', 'medium'),
        claim('contract renewal in Q3', 'src-3', 'medium'),
      ],
      sources: [
        source('src-1', 'pattern', 'high'),
        source('src-2', 'engagement', 'medium'),
      ],
      valueHeadline: '$522K/mo concentration risk',
      valueSignals: [
        { dimension: 'spend' as never, headline: 'concentration risk', detail: '$522K/mo' } as never,
      ],
      decision: {
        crux: 'consolidate vendors',
        branches: [
          { verdict: 'consolidate', condition: 'baseline confirmed', confidence: 'high' },
          { verdict: 'defer', condition: 'compliance review', confidence: 'medium' },
        ],
        tiebreaker: null,
      },
    });
    const result = adaptToContextBundle({
      pipelineInput: pipelineInput({ priorTurns: [] }),
      compositionBundle: composition,
      session: sessionContext(),
    });
    expect(['usable_with_gaps', 'complete']).toContain(result.state);
    expect(result.responseGate.permitsResponse).toBe(true);
  });

  it('records evidence and pattern references with deterministic shape', () => {
    const composition = compositionBundle({
      entities: ['ENG-1'],
      evidence: [
        claim('finding A', 'pat-1', 'high', 'pattern'),
        claim('finding B', 'eng-1', 'medium', 'engagement'),
      ],
      sources: [
        source('pat-1', 'pattern', 'high'),
        source('eng-1', 'engagement', 'medium'),
      ],
    });
    const result = adaptToContextBundle({
      pipelineInput: pipelineInput(),
      compositionBundle: composition,
      session: sessionContext(),
    });
    expect(result.bundle.evidenceReferences).toHaveLength(2);
    expect(result.bundle.evidenceReferences[0].confidence).toBe('HIGH');
    expect(result.bundle.evidenceReferences[1].confidence).toBe('MEDIUM');
    expect(result.bundle.patternReferences).toHaveLength(1);
    expect(result.bundle.patternReferences[0].id).toBe('pat-1');
  });
});

// ---------------------------------------------------------------------
// Determinism + no mutation
// ---------------------------------------------------------------------

describe('adaptToContextBundle · determinism', () => {
  it('produces identical results across repeated calls with the same inputs', () => {
    const composition = compositionBundle({
      entities: ['ENG-7'],
      evidence: [claim('finding', 'src-1', 'high')],
      sources: [source('src-1', 'pattern', 'high')],
    });
    const session = sessionContext();
    const adapterInput: NexusContextAdapterInput = {
      pipelineInput: pipelineInput(),
      compositionBundle: composition,
      session,
    };
    const a = adaptToContextBundle(adapterInput);
    const b = adaptToContextBundle(adapterInput);
    expect(a.state).toEqual(b.state);
    expect(a.qualityScore).toEqual(b.qualityScore);
    expect(a.responseGate).toEqual(b.responseGate);
    expect(a.summary).toEqual(b.summary);
  });

  it('produces a deterministic missingInputs list', () => {
    const a = adaptToContextBundle({ pipelineInput: pipelineInput() });
    const b = adaptToContextBundle({ pipelineInput: pipelineInput() });
    expect(a.bundle.missingInputs).toEqual(b.bundle.missingInputs);
  });

  it('produces a deterministic responseGate for the clarifying fast-path shape', () => {
    const adapterInput: NexusContextAdapterInput = {
      pipelineInput: pipelineInput(),
      compositionBundle: compositionBundle(),
      isClarifying: true,
    };
    const a = adaptToContextBundle(adapterInput);
    const b = adaptToContextBundle(adapterInput);
    expect(a.responseGate).toEqual(b.responseGate);
  });
});

describe('adaptToContextBundle · purity', () => {
  it('does not mutate the pipeline input or composition bundle', () => {
    const composition = compositionBundle({
      entities: ['ENG-1'],
      sources: [source('src-1', 'pattern', 'high')],
      evidence: [claim('finding', 'src-1', 'high')],
    });
    const pipeline = pipelineInput({ priorTurns: [] });
    const session = sessionContext();
    const compositionSnapshot = JSON.stringify(composition);
    const pipelineSnapshot = JSON.stringify(pipeline);
    const sessionSnapshot = JSON.stringify(session);

    adaptToContextBundle({
      pipelineInput: pipeline,
      compositionBundle: composition,
      session,
    });

    expect(JSON.stringify(composition)).toBe(compositionSnapshot);
    expect(JSON.stringify(pipeline)).toBe(pipelineSnapshot);
    expect(JSON.stringify(session)).toBe(sessionSnapshot);
  });
});

// ---------------------------------------------------------------------
// Orchestrator-fields convenience
// ---------------------------------------------------------------------

describe('buildOrchestratorContextBundleFields', () => {
  it('returns the five orchestrator-level fields with expected shape', () => {
    const fields = buildOrchestratorContextBundleFields({
      pipelineInput: pipelineInput(),
      compositionBundle: compositionBundle({
        entities: ['ENG-1'],
        evidence: [claim('x', 'src-1', 'high')],
        sources: [source('src-1', 'pattern', 'high')],
      }),
      session: sessionContext(),
    });
    expect(fields.contextBundle).toBeDefined();
    expect(fields.contextBundleSummary).toBeDefined();
    expect(fields.contextBundleGate).toBeDefined();
    expect(fields.contextBundleScore).toBeDefined();
    expect(fields.contextBundleState).toBeDefined();
    expect(fields.contextBundle.state).toBe(fields.contextBundleState);
  });

  it('attaches conversation references when prior turns exist', () => {
    const fields = buildOrchestratorContextBundleFields({
      pipelineInput: pipelineInput({
        priorTurns: [
          {
            id: 'turn-1',
            threadId: 'thread-1',
            index: 0,
            role: 'user',
            mode: null,
            format: null,
            confidence: null,
            payload: { question: 'first question' },
            sources: [],
            capabilitiesActive: [],
            counterOfTurnId: null,
            contradictionSelfCheck: null,
            personaKey: null,
            latencyMs: null,
            firstTokenMs: null,
            createdAt: '2026-04-22T00:00:00.000Z',
          },
        ],
      }),
      compositionBundle: compositionBundle(),
    });
    expect(fields.contextBundle.conversationReferences.length).toBe(1);
    expect(fields.contextBundle.categories.conversation.present).toBe(true);
  });
});
