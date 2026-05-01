import {
  getEmailLookupCandidates,
  personMatchesClerkEmail,
} from '../maestro';

describe('maestro person lookup helpers', () => {
  it('adds canonical email candidates for plus aliases', () => {
    expect(getEmailLookupCandidates('nina.patel+test@abarva.com')).toEqual([
      'nina.patel+test@abarva.com',
      'nina.patel@abarva.com',
    ]);
  });

  it('rejects stale person_id rows whose email does not match the signed-in Clerk email', () => {
    expect(
      personMatchesClerkEmail(
        { email: 'anand.sundaram@thesundaram.com' },
        ['nina.patel+test@abarva.com', 'nina.patel@abarva.com'],
      ),
    ).toBe(false);
  });

  it('rejects metadata person_id rows without email when the Clerk session has email candidates', () => {
    expect(
      personMatchesClerkEmail(
        { email: null },
        ['nina.patel+test@abarva.com', 'nina.patel@abarva.com'],
      ),
    ).toBe(false);
  });

  it('accepts person_id rows whose email matches a Clerk email candidate', () => {
    expect(
      personMatchesClerkEmail(
        { email: 'nina.patel@abarva.com' },
        ['nina.patel+test@abarva.com', 'nina.patel@abarva.com'],
      ),
    ).toBe(true);
  });
});
