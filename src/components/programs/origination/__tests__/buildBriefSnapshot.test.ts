// OV2-WIRE-CLIENT · buildBriefSnapshot projects the origination brief
// into the shape /api/chat/agent reads from surfaceContext.briefSnapshot.
// These cases lock in the contract end-to-end:
//   - All 5 fields filled → all carry through.
//   - null/empty/whitespace fields → undefined (route only matches on
//     real signals; empty strings would create false positives).
//   - Empty brief → all keys undefined (the route's buildBriefOverlapInput
//     returns null in that case so detection is skipped entirely).

import { buildBriefSnapshot } from '../types';
import { EMPTY_BRIEF, type ProgramBriefDraft } from '../ProgramBriefPanel';

function brief(overrides: Partial<ProgramBriefDraft>): ProgramBriefDraft {
  return { ...EMPTY_BRIEF, ...overrides };
}

describe('buildBriefSnapshot', () => {
  it('passes all 5 route-relevant fields through when filled', () => {
    const snap = buildBriefSnapshot(
      brief({
        programName: 'CDP Activation',
        sponsor: 'CIO',
        classification: 'PAT-PRG-CDP-001',
        problemStatement: 'Unify customer data across Salesforce and Snowflake.',
        lead: 'Director of Data',
      }),
    );

    expect(snap).toEqual({
      programName: 'CDP Activation',
      sponsor: 'CIO',
      classification: 'PAT-PRG-CDP-001',
      problemStatement: 'Unify customer data across Salesforce and Snowflake.',
      lead: 'Director of Data',
    });
  });

  it('omits fields the route does not read', () => {
    // The brief carries targetOutcome/timeline/matchedPatternId/
    // crossProgramDependencies; the route never reads them, so they
    // must not surface in the snapshot.
    const snap = buildBriefSnapshot(
      brief({
        programName: 'CDP Activation',
        targetOutcome: 'Lift conversion 4pp',
        timeline: 'Q3',
        matchedPatternId: 'PAT-PRG-CDP-001',
        crossProgramDependencies: ['PRG-APX-001 · Loyalty Refresh (P3)'],
      }),
    );

    expect(Object.keys(snap).sort()).toEqual([
      'classification',
      'lead',
      'problemStatement',
      'programName',
      'sponsor',
    ]);
  });

  it('collapses null and empty/whitespace strings to undefined', () => {
    const snap = buildBriefSnapshot(
      brief({
        programName: 'CDP Activation',
        sponsor: '',
        classification: '   ',
        problemStatement: null,
        lead: null,
      }),
    );

    expect(snap.programName).toBe('CDP Activation');
    expect(snap.sponsor).toBeUndefined();
    expect(snap.classification).toBeUndefined();
    expect(snap.problemStatement).toBeUndefined();
    expect(snap.lead).toBeUndefined();
  });

  it('returns an all-undefined snapshot for an empty brief', () => {
    const snap = buildBriefSnapshot(EMPTY_BRIEF);

    expect(snap).toEqual({
      programName: undefined,
      sponsor: undefined,
      classification: undefined,
      problemStatement: undefined,
      lead: undefined,
    });
  });

  it('trims surrounding whitespace on real values', () => {
    // The route's buildBriefOverlapInput trims sponsor/classification
    // before matching; doing it here keeps the wire payload clean and
    // means the route sees the same string the user actually typed.
    const snap = buildBriefSnapshot(
      brief({
        sponsor: '  CIO  ',
        classification: '\tPAT-PRG-CDP-001\n',
      }),
    );

    expect(snap.sponsor).toBe('CIO');
    expect(snap.classification).toBe('PAT-PRG-CDP-001');
  });
});
