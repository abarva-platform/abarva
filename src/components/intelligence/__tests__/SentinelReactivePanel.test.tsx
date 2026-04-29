import { selectVisibleSentinelArtifacts } from '@/components/intelligence/SentinelReactivePanel';
import type { Artifact } from '@/lib/agent/artifacts';

describe('selectVisibleSentinelArtifacts', () => {
  it('keeps Sentinel-relevant artifact types and reverses order', () => {
    const artifacts: Artifact[] = [
      {
        type: 'pattern-match',
        patternId: 'PAT-CDP-001',
        name: 'CDP Activation',
        summary: 'Customer data platform programme lifecycle.',
      },
      {
        type: 'evidence-highlight',
        evidenceId: 'EV-CDP-013',
        reason: 'Privacy clauses missing on page 14.',
      },
      {
        type: 'cross-program-dependency',
        programId: 'APX-CDP-2026',
        programName: 'Apex CDP Activation',
        currentPhase: 'P3 Design',
      },
    ];

    const visible = selectVisibleSentinelArtifacts(artifacts);

    expect(visible).toHaveLength(3);
    // Reversed: most-recent (cross-program-dependency) first.
    expect(visible[0].type).toBe('cross-program-dependency');
    expect(visible[2].type).toBe('pattern-match');
  });

  it('keeps PR-INT-D artifact types (graph-neighborhood, contradiction-flag)', () => {
    const artifacts: Artifact[] = [
      {
        type: 'graph-neighborhood',
        rootId: 'pattern_x',
        rootLabel: 'Pattern X',
        nodeCount: 5,
        edgeCount: 4,
        topEdges: [
          { targetId: 'pattern_y', targetLabel: 'Pattern Y', edgeType: 'co_applies_with' },
        ],
      },
      {
        type: 'contradiction-flag',
        contradictionId: 'c1',
        label: 'Contradiction',
        severity: 'high',
        partyA: 'A',
        partyB: 'B',
        detectionDescription: 'detected',
        resolutionPath: 'resolve',
      },
    ];

    const visible = selectVisibleSentinelArtifacts(artifacts);
    expect(visible).toHaveLength(2);
    // Reversed: contradiction (latest) first.
    expect(visible[0].type).toBe('contradiction-flag');
    expect(visible[1].type).toBe('graph-neighborhood');
  });

  it('drops Programs-only artifact types (gate-evaluation, phase-progress, anti-pattern-flag, etc.)', () => {
    const artifacts: Artifact[] = [
      {
        type: 'pattern-match',
        patternId: 'PAT-CDP-001',
        name: 'CDP Activation',
        summary: 'Customer data platform programme lifecycle.',
      },
      {
        type: 'gate-evaluation',
        gate: 'Build gate · privacy attestation',
        status: 'unmet',
      },
      {
        type: 'phase-progress',
        evidenceItemId: 'charter-signed-off',
        label: 'Charter signed off',
        severity: 'hard',
        status: 'unmet',
      },
      {
        type: 'anti-pattern-flag',
        antiPatternId: 'phantom-sponsor',
        label: 'Phantom Sponsor',
        detectedSignal: 'Sponsor cannot describe specific commitment',
        whatToFlag: 'High stall risk',
        mitigation: 'Insist on cadence',
      },
      {
        type: 'brief-field',
        field: 'programName',
        value: 'Test',
      },
    ];

    const visible = selectVisibleSentinelArtifacts(artifacts);

    expect(visible).toHaveLength(1);
    expect(visible[0].type).toBe('pattern-match');
  });

  it('returns empty when no artifacts have streamed', () => {
    expect(selectVisibleSentinelArtifacts([])).toEqual([]);
  });
});
