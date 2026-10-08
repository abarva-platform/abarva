import { assembleEngagementSystemPrompt } from '../prompts/engagement';
import type { EngagementRow } from '@/lib/db/engagement';

// The CURRENT ENGAGEMENT CONTEXT block that names the phase lives in the
// Phase 0 assembler, and that assembler also serves the `default:` arm of
// the phase switch. Phases 1..4 have their own assemblers and never emit
// the line. So the phases that read this name are P0 and — through the
// default arm — P5 Mobilize, the last phase of the Move.
//
// P5 is why this suite exists: the name came from a five-entry literal
// array, so `array[5]` was `undefined` and the model was told
// "Current phase: 5 (undefined)".

function promptAtPhase(phase: number): string {
  return assembleEngagementSystemPrompt({
    engagement: {
      id: 'eng-1',
      graph_node_id: 'graph-1',
      name: 'Governed data foundation',
      status: 'active',
      current_phase: phase,
    } as unknown as EngagementRow,
    sponsor: null,
    activePatterns: [],
    peerDecisions: [],
    chainedPatterns: [],
  });
}

function currentPhaseLine(phase: number): string {
  const line = promptAtPhase(phase)
    .split('\n')
    .find((candidate) => candidate.startsWith('- Current phase:'));
  if (!line) throw new Error(`prompt at phase ${phase} has no "- Current phase:" line`);
  return line;
}

describe('the engagement system prompt names the current phase', () => {
  it('names P5 Mobilize instead of telling the model "undefined"', () => {
    const line = currentPhaseLine(5);
    expect(line).toBe('- Current phase: 5 (Mobilize)');
    expect(line).not.toContain('undefined');
  });

  it('names P0 as Originate, not as the retired "Start"', () => {
    expect(currentPhaseLine(0)).toBe('- Current phase: 0 (Originate)');
  });

  it('never names a retired Build, Execute, Verify or Start phase', () => {
    for (const phase of [0, 5]) {
      const line = currentPhaseLine(phase);
      for (const retired of ['Build', 'Execute', 'Verify', 'Start']) {
        expect(line).not.toContain(retired);
      }
    }
  });

  it('names a phase past the canonical range rather than nothing', () => {
    expect(currentPhaseLine(9)).toBe('- Current phase: 9 (Phase 9)');
  });

  it('leaves the phases with their own assemblers alone', () => {
    // Guards the reading above: if P1..P4 ever start emitting this line,
    // this test fails and the cases above must widen to cover them.
    for (const phase of [1, 2, 3, 4]) {
      expect(promptAtPhase(phase)).not.toContain('- Current phase:');
    }
  });
});
