/**
 * NexusReactivePanel · selectVisibleArtifacts
 *
 * Locks in the dedupe + filter + reverse-order behavior so the panel
 * stays well-defined as Codex / Wave-2 work adds more artifact types.
 */

import { selectVisibleArtifacts } from '../NexusReactivePanel';
import type { Artifact } from '@/lib/agent/artifacts';

describe('selectVisibleArtifacts', () => {
  it('drops Surface 1 brief-field and classification artifacts', () => {
    const input: Artifact[] = [
      { type: 'brief-field', field: 'sponsor', value: 'Sarah Chen' },
      { type: 'classification', archetype: 'CDP', archetypeLabel: 'CDP', confidence: 'high' },
      {
        type: 'pattern-match',
        patternId: 'PAT-FOO-001',
        name: 'Foo',
        summary: 'bar',
      },
    ];
    const out = selectVisibleArtifacts(input);
    expect(out).toHaveLength(1);
    expect(out[0].type).toBe('pattern-match');
  });

  it('reverses the stream so most-recent renders first', () => {
    const input: Artifact[] = [
      { type: 'gate-evaluation', gate: 'first', status: 'unmet' },
      { type: 'gate-evaluation', gate: 'second', status: 'met' },
      { type: 'gate-evaluation', gate: 'third', status: 'pending' },
    ];
    const out = selectVisibleArtifacts(input);
    expect(out.map((a) => (a.type === 'gate-evaluation' ? a.gate : ''))).toEqual([
      'third',
      'second',
      'first',
    ]);
  });

  it('dedupes phase-progress by evidenceItemId, keeping the latest', () => {
    const input: Artifact[] = [
      {
        type: 'phase-progress',
        evidenceItemId: 'charter-signed-off',
        label: 'Charter signed off',
        severity: 'hard',
        status: 'unmet',
      },
      {
        type: 'phase-progress',
        evidenceItemId: 'charter-signed-off',
        label: 'Charter signed off',
        severity: 'hard',
        status: 'met',
        detail: 'Sponsor signed today',
      },
      {
        type: 'phase-progress',
        evidenceItemId: 'baseline-kpi-captured',
        label: 'Baseline KPI captured',
        severity: 'soft',
        status: 'unknown',
      },
    ];
    const out = selectVisibleArtifacts(input);
    const progress = out.filter((a) => a.type === 'phase-progress') as Array<
      Extract<Artifact, { type: 'phase-progress' }>
    >;
    expect(progress).toHaveLength(2);
    const charter = progress.find((p) => p.evidenceItemId === 'charter-signed-off');
    expect(charter?.status).toBe('met');
    expect(charter?.detail).toBe('Sponsor signed today');
  });

  it('dedupes anti-pattern-flag by antiPatternId, keeping the latest', () => {
    const input: Artifact[] = [
      {
        type: 'anti-pattern-flag',
        antiPatternId: 'phantom-sponsor',
        label: 'The Phantom Sponsor',
        detectedSignal: 'first signal',
        whatToFlag: 'consequence A',
        mitigation: 'redirect A',
      },
      {
        type: 'anti-pattern-flag',
        antiPatternId: 'phantom-sponsor',
        label: 'The Phantom Sponsor',
        detectedSignal: 'second signal',
        whatToFlag: 'consequence B',
        mitigation: 'redirect B',
      },
    ];
    const out = selectVisibleArtifacts(input);
    const flags = out.filter((a) => a.type === 'anti-pattern-flag') as Array<
      Extract<Artifact, { type: 'anti-pattern-flag' }>
    >;
    expect(flags).toHaveLength(1);
    expect(flags[0].detectedSignal).toBe('second signal');
    expect(flags[0].whatToFlag).toBe('consequence B');
  });

  it('preserves non-deduped artifact insertion order through reversal', () => {
    const input: Artifact[] = [
      { type: 'gate-evaluation', gate: 'A', status: 'unmet' },
      {
        type: 'phase-progress',
        evidenceItemId: 'x',
        label: 'X',
        severity: 'hard',
        status: 'unmet',
      },
      { type: 'gate-evaluation', gate: 'B', status: 'pending' },
    ];
    const out = selectVisibleArtifacts(input);
    // Non-deduped (gate-evaluation) appear in reverse insertion order:
    // B before A. Phase-progress is grouped at the end, then reversed —
    // so the dedupe-tracked types come first in the visible list.
    const gateOrder = out
      .filter((a) => a.type === 'gate-evaluation')
      .map((a) => (a.type === 'gate-evaluation' ? a.gate : ''));
    expect(gateOrder).toEqual(['B', 'A']);
  });

  it('returns empty for an empty stream', () => {
    expect(selectVisibleArtifacts([])).toEqual([]);
  });
});
