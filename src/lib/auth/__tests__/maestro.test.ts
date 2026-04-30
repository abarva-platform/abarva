import {
  getEmailLookupCandidates,
  personMatchesClerkEmail,
} from '../maestro';

describe('maestro person lookup helpers', () => {
  it('adds canonical demo email candidates for +clerk_test aliases', () => {
    expect(getEmailLookupCandidates('demo-apexretail+clerk_test@abarva.com')).toEqual([
      'demo-apexretail+clerk_test@abarva.com',
      'demo-apexretail@abarva.com',
    ]);
  });

  it('rejects stale person_id rows whose email does not match the signed-in Clerk email', () => {
    expect(
      personMatchesClerkEmail(
        { email: 'anand.sundaram@thesundaram.com' },
        ['demo-apexretail+clerk_test@abarva.com', 'demo-apexretail@abarva.com'],
      ),
    ).toBe(false);
  });

  it('rejects metadata person_id rows without email when the Clerk session has email candidates', () => {
    expect(
      personMatchesClerkEmail(
        { email: null },
        ['demo-apexretail+clerk_test@abarva.com', 'demo-apexretail@abarva.com'],
      ),
    ).toBe(false);
  });

  it('accepts person_id rows whose email matches a Clerk email candidate', () => {
    expect(
      personMatchesClerkEmail(
        { email: 'demo-apexretail@abarva.com' },
        ['demo-apexretail+clerk_test@abarva.com', 'demo-apexretail@abarva.com'],
      ),
    ).toBe(true);
  });
});
