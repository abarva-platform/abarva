import { checkCoverage, checkContainment, buildShadowReport, type UtilisationRecord } from '../evidence-gates';
import type { EvidenceAdmissionDecision, EvidenceAdmissionPolicy, EvidenceCandidate } from '../move-scope';

const policy: EvidenceAdmissionPolicy = {
  policyVersion: 'p2@1',
  artifactType: 'discovery_report',
  archetype: 'AI_PDLC',
  required: [
    { family: 'operational_baseline', minItems: 2, requiredEvidenceKeys: ['kpi:aht'], maxDepth: 1 },
  ],
  permitted: [],
  benchmark: [{ family: 'peer_programme', appendixOnly: true, mustBeLabelled: true }],
  excluded: [],
  legalEdges: [],
};

const decision = (over: Partial<EvidenceAdmissionDecision> & { evidenceId: string }): EvidenceAdmissionDecision => ({
  admitted: true,
  artifactType: 'discovery_report',
  policyVersion: 'p2@1',
  family: 'operational_baseline',
  admittedBy: 'named_object',
  traversalDepth: 1,
  traversalPath: [],
  reason: 'ok',
  ...over,
});

const upload = (id: string, phase = 'P1'): EvidenceCandidate => ({
  evidenceId: id,
  family: 'uploaded',
  objectIds: [],
  fromMoveUpload: true,
  uploadedAtPhase: phase,
});

const used = (id: string): UtilisationRecord => ({ evidenceId: id, state: 'used' });

const baseCoverage = {
  policy,
  candidates: [upload('u1'), upload('u2', 'P2')],
  decisions: [decision({ evidenceId: 'e1' }), decision({ evidenceId: 'e2' })],
  utilisation: [used('u1'), used('u2')],
  presentEvidenceKeys: ['kpi:aht'],
};

describe('coverage gate', () => {
  it('passes when every upload is used and every family meets its minimum', () => {
    const v = checkCoverage(baseCoverage);
    expect(v.findings).toEqual([]);
    expect(v.moveUploads).toEqual({ total: 2, used: 2, declared: 0, unused: 0 });
  });

  // ── planted case 1 ────────────────────────────────────────────────────────
  it('FAILS when a single Move upload is dropped', () => {
    // Per item, no minimum. A percentage would let the pipeline choose which of
    // the client's own evidence to ignore.
    const v = checkCoverage({ ...baseCoverage, utilisation: [used('u1')] });
    expect(v.ok).toBe(false);
    expect(v.findings[0]).toMatchObject({ kind: 'move_upload_unused', evidenceId: 'u2', phase: 'P2' });
  });

  it('accepts an upload declared not applicable, with a reason and an actor', () => {
    const v = checkCoverage({
      ...baseCoverage,
      utilisation: [used('u1'), { evidenceId: 'u2', state: 'declared_not_applicable', reason: 'superseded by P2 intake', actorId: 'anand' }],
    });
    expect(v.ok).toBe(true);
    expect(v.moveUploads.declared).toBe(1);
  });

  it('rejects a declaration missing its reason or actor', () => {
    // A declaration without both is silence with extra steps.
    const v = checkCoverage({
      ...baseCoverage,
      utilisation: [used('u1'), { evidenceId: 'u2', state: 'declared_not_applicable', reason: 'n/a' }],
    });
    expect(v.findings[0].kind).toBe('declaration_incomplete');
  });

  // ── planted case 2 ────────────────────────────────────────────────────────
  it('FAILS when a required family falls below its minimum', () => {
    const v = checkCoverage({ ...baseCoverage, decisions: [decision({ evidenceId: 'e1' })] });
    expect(v.ok).toBe(false);
    expect(v.findings[0]).toMatchObject({ kind: 'family_below_minimum', have: 1, need: 2 });
  });

  // ── planted case 3 ────────────────────────────────────────────────────────
  it('FAILS when a decision-critical item is missing even at the minimum', () => {
    // The family is at its minimum and the artifact is still incomplete,
    // because the one item the decision rests on is the missing one.
    const v = checkCoverage({ ...baseCoverage, presentEvidenceKeys: [] });
    expect(v.ok).toBe(false);
    expect(v.findings[0]).toMatchObject({ kind: 'required_key_missing', key: 'kpi:aht' });
    expect(v.families[0]).toMatchObject({ admitted: 2, minItems: 2 });
  });
});

describe('containment gate', () => {
  const decisions = [
    decision({ evidenceId: 'ok-1' }),
    decision({ evidenceId: 'bad-1', admitted: false, admittedBy: null, reason: 'no legal path from declared scope within depth 1' }),
    decision({ evidenceId: 'bench-1', family: 'peer_programme', admittedBy: 'benchmark' }),
  ];

  it('passes when everything rendered traces to an admission', () => {
    const v = checkContainment({ decisions, packed: ['ok-1'], cited: ['ok-1'], rendered: ['ok-1'] });
    expect(v.findings).toEqual([]);
  });

  // ── planted case 4 ────────────────────────────────────────────────────────
  it('FAILS when off-scope evidence reaches the artifact, correct or not', () => {
    const v = checkContainment({ decisions, packed: ['bad-1'], cited: ['bad-1'], rendered: ['bad-1'] });
    expect(v.ok).toBe(false);
    expect(v.findings.map((f) => f.kind)).toEqual([
      'inadmissible_reached_stage',
      'inadmissible_reached_stage',
      'inadmissible_reached_stage',
    ]);
    expect(v.findings[0].message).toContain('no legal path');
  });

  it('FAILS when a rendered item traces to no decision at all', () => {
    const v = checkContainment({ decisions, packed: [], cited: [], rendered: ['ghost'] });
    expect(v.findings[0]).toMatchObject({ kind: 'no_admission_decision', evidenceId: 'ghost' });
  });

  // ── planted case 5 ────────────────────────────────────────────────────────
  it('FAILS when benchmark evidence sits in the core story', () => {
    const v = checkContainment({
      decisions,
      packed: ['bench-1'],
      cited: ['bench-1'],
      rendered: ['bench-1'],
      renderedInCoreStory: ['bench-1'],
      labelledAsBenchmark: ['bench-1'],
    });
    expect(v.ok).toBe(false);
    expect(v.findings[0].kind).toBe('benchmark_outside_appendix');
  });

  it('FAILS when benchmark evidence is rendered without its label', () => {
    const v = checkContainment({ decisions, packed: [], cited: [], rendered: ['bench-1'] });
    expect(v.findings[0].kind).toBe('benchmark_unlabelled');
  });
});

describe('shadow report', () => {
  it('separates the two denominators and flags each escape', () => {
    const decisions = [
      decision({ evidenceId: 'ok-1' }),
      decision({ evidenceId: 'ok-2' }),
      decision({ evidenceId: 'bad-1', admitted: false, admittedBy: null, reason: 'off scope' }),
    ];
    const coverage = checkCoverage({ ...baseCoverage, utilisation: [used('u1')] });
    const report = buildShadowReport({
      decisions,
      retrieved: ['ok-1', 'bad-1'],
      packed: ['ok-1', 'bad-1'],
      cited: ['bad-1'],
      rendered: ['bad-1'],
      coverage,
    });

    expect(report).toMatchObject({ availableEvidence: 3, admitted: 2, wouldExclude: 1 });
    expect(report.flags.inadmissibleRetrieved).toEqual(['bad-1']);
    expect(report.flags.inadmissibleInDeck).toEqual(['bad-1']);
    // The quiet failure: admitted, required, and retrieval never surfaced it.
    expect(report.flags.requiredAdmittedNeverRetrieved).toEqual(['ok-2']);
    expect(report.flags.moveUploadsNeverUsedOrDeclared).toEqual(['u2']);
  });
});
