/**
 * Explanation serializer tests.
 *
 * Pure unit tests — no network, no LLM, no randomness. Builds a synthetic
 * SynthesisContext and feeds it through `serializeSynthesisExplanation`.
 */

import {
  serializeSynthesisExplanation,
  type ContradictionTemplateLite,
  type FailureModeTemplateLite,
  type SerializeInputs,
} from '@/lib/reasoning/explanation-serializer';
import type {
  ContradictionDetection,
  FailureModeDetection,
  GateEvaluation,
  PatternRef,
  SynthesisContext,
} from '@/lib/reasoning/types';

const PATTERN_REF: PatternRef = {
  patternId: 'PAT-TEST-001',
  patternVersion: '1.0.0',
  section: '§ Test',
};

function makeContext(overrides: Partial<SynthesisContext> = {}): SynthesisContext {
  return {
    instanceId: 'test-instance',
    instanceType: 'source-event',
    patternId: 'PAT-TEST-001',
    patternVersion: '1.0.0',
    currentStage: 'BAFO',
    gatesSummary: { total: 2, met: 1, unmet: 1, blocked: [] },
    activeContradictions: [],
    failureModes: [],
    missingArtifacts: [],
    cascadeContext: [],
    citations: [
      {
        ref: PATTERN_REF,
        excerpt: 'Stage definition.',
        relevance: 'Current stage',
      },
    ],
    instanceSnapshot: {},
    stageGuidance: '',
    builtAt: 1700000000000,
    ...overrides,
  };
}

function makeGateEval(
  criterionId: string,
  stageId: string,
  status: GateEvaluation['status'],
  gateType: GateEvaluation['gateType'] = 'hard',
): GateEvaluation {
  return {
    criterionId,
    stageId,
    status,
    gateType,
    evidence: [],
    patternRef: PATTERN_REF,
    evaluatedAt: 1700000000000,
  };
}

function makeContradictionTemplate(id: string): ContradictionTemplateLite {
  return {
    id,
    label: `Label for ${id}`,
    severity: 'medium',
    partyA: 'A',
    partyB: 'B',
    resolutionPath: 'Resolve via X.',
  };
}

function makeFailureModeTemplate(id: string): FailureModeTemplateLite {
  return {
    id,
    label: `FM ${id}`,
    description: `Description ${id}`,
    stages: ['BAFO'],
    mitigations: ['Mitigate X'],
  };
}

describe('serializeSynthesisExplanation', () => {
  it('echoes surface, instanceId and pattern info from the context', () => {
    const ctx = makeContext();
    const payload = serializeSynthesisExplanation({
      surface: 'source',
      context: ctx,
      gateEvaluations: [],
      contradictionTemplates: [],
      failureModeTemplates: [],
    });
    expect(payload.surface).toBe('source');
    expect(payload.instanceId).toBe(ctx.instanceId);
    expect(payload.instanceType).toBe('source-event');
    expect(payload.patternId).toBe('PAT-TEST-001');
    expect(payload.patternVersion).toBe('1.0.0');
    expect(payload.currentStage).toBe('BAFO');
  });

  it('groups gate evaluations by stageId in encounter order', () => {
    const evals = [
      makeGateEval('c1', 'RFI', 'met'),
      makeGateEval('c2', 'BAFO', 'unmet'),
      makeGateEval('c3', 'RFI', 'met'),
    ];
    const payload = serializeSynthesisExplanation({
      surface: 'source',
      context: makeContext(),
      gateEvaluations: evals,
      contradictionTemplates: [],
      failureModeTemplates: [],
    });
    expect(payload.gates).toHaveLength(2);
    expect(payload.gates[0].stageId).toBe('RFI');
    expect(payload.gates[0].rows).toHaveLength(2);
    expect(payload.gates[1].stageId).toBe('BAFO');
    expect(payload.gates[1].rows).toHaveLength(1);
  });

  describe('gateSummary', () => {
    it('counts every criterion the payload renders, not the current stage only', () => {
      // The context's own gatesSummary is built from the CURRENT stage
      // (`evaluateStage`), while the route feeds the serializer every
      // criterion at every stage (`evaluateAllStages().flatMap(...)`). The
      // headline used to quote the first over a body listing the second, so
      // its denominator counted a subset of the list it headed. This fixture
      // makes the two disagree: 2 in the context, 4 in the evaluations.
      const payload = serializeSynthesisExplanation({
        surface: 'source',
        context: makeContext({ gatesSummary: { total: 2, met: 1, unmet: 1, blocked: [] } }),
        gateEvaluations: [
          makeGateEval('c1', 'RFI', 'met'),
          makeGateEval('c2', 'RFI', 'unmet'),
          makeGateEval('c3', 'BAFO', 'met'),
          makeGateEval('c4', 'BAFO', 'unmet'),
        ],
        contradictionTemplates: [],
        failureModeTemplates: [],
      });
      const renderedRows = payload.gates.reduce((n, g) => n + g.rows.length, 0);
      expect(renderedRows).toBe(4);
      expect(payload.gateSummary.total).toBe(4);
      // The number it used to quote.
      expect(payload.gateSummary.total).not.toBe(2);
    });

    it('is a partition of the rows it heads', () => {
      const payload = serializeSynthesisExplanation({
        surface: 'programs',
        context: makeContext(),
        gateEvaluations: [
          makeGateEval('c1', 'RFI', 'met'),
          makeGateEval('c2', 'RFI', 'partial'),
          makeGateEval('c3', 'RFI', 'waived'),
          makeGateEval('c4', 'BAFO', 'unmet'),
        ],
        contradictionTemplates: [],
        failureModeTemplates: [],
      });
      const { total, met, partial, waived, unmet } = payload.gateSummary;
      expect(met + partial + waived + unmet).toBe(total);
      expect(total).toBe(payload.gates.reduce((n, g) => n + g.rows.length, 0));
    });

    it('does not fold a waived criterion into met, and the body still shows it', () => {
      const payload = serializeSynthesisExplanation({
        surface: 'programs',
        // The context claims both criteria are cleared, because
        // `gatesSummary.met` means met-OR-waived for the advancement question.
        context: makeContext({ gatesSummary: { total: 2, met: 2, unmet: 0, blocked: [] } }),
        gateEvaluations: [
          makeGateEval('c1', 'BAFO', 'met'),
          makeGateEval('c2', 'BAFO', 'waived'),
        ],
        contradictionTemplates: [],
        failureModeTemplates: [],
      });
      expect(payload.gateSummary.met).toBe(1);
      expect(payload.gateSummary.waived).toBe(1);
      // The row the headline must not claim as proven is still in the trace.
      expect(payload.gates[0].rows.map((r) => r.status)).toEqual(['met', 'waived']);
    });

    it('reports a partial criterion as partial, not unmet', () => {
      const payload = serializeSynthesisExplanation({
        surface: 'source',
        context: makeContext(),
        gateEvaluations: [makeGateEval('c1', 'BAFO', 'partial')],
        contradictionTemplates: [],
        failureModeTemplates: [],
      });
      expect(payload.gateSummary.partial).toBe(1);
      expect(payload.gateSummary.unmet).toBe(0);
    });

    it('counts nothing when no criterion was evaluated', () => {
      const payload = serializeSynthesisExplanation({
        surface: 'tower',
        context: makeContext({ gatesSummary: { total: 3, met: 3, unmet: 0, blocked: [] } }),
        gateEvaluations: [],
        contradictionTemplates: [],
        failureModeTemplates: [],
      });
      expect(payload.gateSummary).toEqual({
        total: 0,
        met: 0,
        partial: 0,
        waived: 0,
        unmet: 0,
      });
    });
  });

  it('enriches gate rows with description from the criterionDescriptions map', () => {
    const evals = [makeGateEval('c1', 'BAFO', 'unmet')];
    const desc = new Map<string, { description: string; evaluationHint: string }>();
    desc.set('c1', { description: 'BAFO contract signed', evaluationHint: 'Upload signed PDF' });
    const payload = serializeSynthesisExplanation({
      surface: 'source',
      context: makeContext(),
      gateEvaluations: evals,
      criterionDescriptions: desc,
      contradictionTemplates: [],
      failureModeTemplates: [],
    });
    expect(payload.gates[0].rows[0].description).toBe('BAFO contract signed');
    expect(payload.gates[0].rows[0].evaluationHint).toBe('Upload signed PDF');
  });

  it('falls back to gatesSummary.blocked for description when no map provided', () => {
    const ctx = makeContext({
      gatesSummary: {
        total: 1,
        met: 0,
        unmet: 1,
        blocked: [
          {
            criterionId: 'c1',
            stageId: 'BAFO',
            status: 'unmet',
            gateType: 'hard',
            evidence: [],
            description: 'From blocked list',
            evaluationHint: 'Hint from blocked',
            patternRef: PATTERN_REF,
            evaluatedAt: 1700000000000,
          },
        ],
      },
    });
    const evals = [makeGateEval('c1', 'BAFO', 'unmet')];
    const payload = serializeSynthesisExplanation({
      surface: 'source',
      context: ctx,
      gateEvaluations: evals,
      contradictionTemplates: [],
      failureModeTemplates: [],
    });
    expect(payload.gates[0].rows[0].description).toBe('From blocked list');
    expect(payload.gates[0].rows[0].evaluationHint).toBe('Hint from blocked');
  });

  it('serializes contradiction templates: fires the matched ones, not-fires others', () => {
    const detected: ContradictionDetection = {
      templateId: 't1',
      label: 'Label for t1',
      severity: 'medium',
      confidence: 0.6,
      partyA: 'A',
      partyB: 'B',
      triggeringEvidence: [
        { field: 'vendor.claim', value: 'x' },
        { field: 'measured.value', value: 'y' },
      ],
      resolutionPath: 'Resolve via X.',
      patternRef: PATTERN_REF,
      detectedAt: 1700000000000,
    };
    const ctx = makeContext({ activeContradictions: [detected] });
    const payload = serializeSynthesisExplanation({
      surface: 'source',
      context: ctx,
      gateEvaluations: [],
      contradictionTemplates: [
        makeContradictionTemplate('t1'),
        makeContradictionTemplate('t2'),
      ],
      failureModeTemplates: [],
    });
    expect(payload.contradictions).toHaveLength(2);
    const t1 = payload.contradictions.find((c) => c.templateId === 't1')!;
    const t2 = payload.contradictions.find((c) => c.templateId === 't2')!;
    expect(t1.fired).toBe(true);
    expect(t1.confidence).toBeCloseTo(0.6, 5);
    expect(t1.triggeringFields).toEqual(['vendor.claim', 'measured.value']);
    expect(t2.fired).toBe(false);
    expect(t2.confidence).toBe(0);
    expect(t2.triggeringFields).toEqual([]);
  });

  it('serializes failure mode templates with fired/not-fired status', () => {
    const fired: FailureModeDetection = {
      id: 'fm1',
      failureModeId: 'fm1',
      label: 'FM fm1',
      description: 'Description fm1',
      stages: ['BAFO'],
      mitigations: ['Mitigate X'],
      confidence: 0.7,
      matchedKeywords: ['vendor', 'consolidation'],
      detectedFromKeys: ['vendor.consolidation.evidence'],
    };
    const ctx = makeContext({ failureModes: [fired] });
    const payload = serializeSynthesisExplanation({
      surface: 'source',
      context: ctx,
      gateEvaluations: [],
      contradictionTemplates: [],
      failureModeTemplates: [
        makeFailureModeTemplate('fm1'),
        makeFailureModeTemplate('fm2'),
      ],
    });
    expect(payload.failureModes).toHaveLength(2);
    const r1 = payload.failureModes.find((f) => f.failureModeId === 'fm1')!;
    const r2 = payload.failureModes.find((f) => f.failureModeId === 'fm2')!;
    expect(r1.fired).toBe(true);
    expect(r1.confidence).toBeCloseTo(0.7, 5);
    expect(r1.matchedKeywords).toEqual(['vendor', 'consolidation']);
    expect(r2.fired).toBe(false);
    expect(r2.matchedKeywords).toEqual([]);
  });

  it('serializes cascade impacts, preserving severity tiers', () => {
    const ctx = makeContext({
      cascadeContext: [
        {
          sourceInstanceId: 'SRC-AMS-2026',
          targetInstanceId: 'APX-CDP-2026',
          targetInstanceName: 'Apex CDP',
          linkType: 'feeds',
          severity: 'blocking',
          impactSeverity: 'high',
          impact: 'Delays P3 Design.',
        },
      ],
    });
    const payload = serializeSynthesisExplanation({
      surface: 'source',
      context: ctx,
      gateEvaluations: [],
      contradictionTemplates: [],
      failureModeTemplates: [],
    });
    expect(payload.cascadeImpacts).toHaveLength(1);
    expect(payload.cascadeImpacts[0].targetInstanceId).toBe('APX-CDP-2026');
    expect(payload.cascadeImpacts[0].severity).toBe('blocking');
    expect(payload.cascadeImpacts[0].impactSeverity).toBe('high');
  });

  it('flattens citations into rows', () => {
    const ctx = makeContext({
      citations: [
        { ref: PATTERN_REF, excerpt: 'Stage one excerpt', relevance: 'Why one' },
        {
          ref: { ...PATTERN_REF, section: '§ Other' },
          excerpt: 'Stage two excerpt',
          relevance: 'Why two',
        },
      ],
    });
    const payload = serializeSynthesisExplanation({
      surface: 'source',
      context: ctx,
      gateEvaluations: [],
      contradictionTemplates: [],
      failureModeTemplates: [],
    });
    expect(payload.citations).toHaveLength(2);
    expect(payload.citations[0].section).toBe('§ Test');
    expect(payload.citations[1].section).toBe('§ Other');
  });

  it('is pure: identical inputs produce identical outputs', () => {
    const inputs: SerializeInputs = {
      surface: 'source',
      context: makeContext(),
      gateEvaluations: [makeGateEval('c1', 'BAFO', 'met')],
      contradictionTemplates: [makeContradictionTemplate('t1')],
      failureModeTemplates: [makeFailureModeTemplate('fm1')],
    };
    const a = serializeSynthesisExplanation(inputs);
    const b = serializeSynthesisExplanation(inputs);
    expect(a).toEqual(b);
  });
});
