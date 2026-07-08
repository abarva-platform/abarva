import { computeWhatChanged } from '../what-changed';

const draft = `# Solution Approach Decision Summary

## Selected approach
Standalone orchestration layer across CLM and mailbox.

## Pilot scope
All contract types.

## Controls
Attorney approval for non-standard terms.
`;

const final = `# Solution Approach Decision Summary

## Selected approach
CLM-embedded assisted triage and obligation extraction.

## Pilot scope
NDAs, SOWs, vendor agreements, and renewals.

## Controls
Attorney approval for non-standard terms.

## Value assumptions
8-12% cycle-time improvement, directional until finance attests.
`;

describe('computeWhatChanged — deterministic draft→final diff', () => {
  it('flags changed sections, added sections, and leaves untouched ones alone', () => {
    const r = computeWhatChanged(draft, final, ['P4 workstream inputs']);
    expect(r.sectionsChanged).toEqual(expect.arrayContaining(['Selected approach', 'Pilot scope']));
    expect(r.sectionsChanged).not.toContain('Controls'); // unchanged
    expect(r.sectionsAdded).toEqual(['Value assumptions']);
    expect(r.sectionsRemoved).toEqual([]);
    expect(r.hasChanges).toBe(true);
  });

  it('counts added/removed lines', () => {
    const r = computeWhatChanged(draft, final);
    expect(r.linesAdded).toBeGreaterThan(0);
    expect(r.linesRemoved).toBeGreaterThan(0);
  });

  it('surfaces the impacted next-phase inputs only when there are changes', () => {
    expect(computeWhatChanged(draft, final, ['P4 inputs']).impactedNextPhaseInputs).toEqual([
      'P4 inputs',
    ]);
    expect(computeWhatChanged(draft, draft, ['P4 inputs']).impactedNextPhaseInputs).toEqual([]);
  });

  it('reports no changes when draft and final are identical', () => {
    const r = computeWhatChanged(draft, draft, ['x']);
    expect(r.hasChanges).toBe(false);
    expect(r.sectionsChanged).toEqual([]);
    expect(r.linesAdded).toBe(0);
    expect(r.linesRemoved).toBe(0);
  });

  it('detects a removed section', () => {
    const r = computeWhatChanged(final, draft);
    expect(r.sectionsRemoved).toContain('Value assumptions');
  });
});
