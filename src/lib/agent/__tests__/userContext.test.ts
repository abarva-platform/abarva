/**
 * userContext — F0.2 verification (Programs Strict Completion v1.2)
 *
 * Tests the pure formatter `formatUserContextBlock`. The async resolver
 * `getUserContext` depends on Clerk + Supabase + the active client cookie
 * and is out of scope for unit tests; its acceptance is verified by
 * the kickoff §4 F0.2 founder walkthrough across the 8 routes.
 */

import { formatUserContextBlock, type UserContext } from '../userContext';

const baseUser: UserContext = {
  firstName: 'David',
  fullName: 'David Sundaram',
  role: 'Founder',
  tenantId: 'apex-retail-group',
  tenantDisplayName: 'Apex Retail Group',
  sponsorshipHistory: [],
};

describe('formatUserContextBlock', () => {
  it('emits the Layer-0 header and identity line', () => {
    const block = formatUserContextBlock(baseUser);
    expect(block).toContain('USER CONTEXT (highest priority — Layer 0):');
    expect(block).toContain('You are speaking with David Sundaram (Founder at Apex Retail Group).');
  });

  it('includes a sponsorship section when programs are present', () => {
    const block = formatUserContextBlock({
      ...baseUser,
      sponsorshipHistory: [
        { programId: 'APX-CDP-2026', programName: 'Customer Data Platform 2026', currentPhase: 'Design', relation: 'sponsor' },
        { programId: 'APX-CC-2026', programName: 'Contact Center AI 2026', currentPhase: 'Build', relation: 'co_sponsor' },
      ],
    });
    expect(block).toContain("David's sponsorship history:");
    expect(block).toContain('- Customer Data Platform 2026 (Design) — you are sponsor');
    expect(block).toContain('- Contact Center AI 2026 (Build) — you are co-sponsor');
  });

  it('omits the sponsorship section when no programs are sponsored', () => {
    const block = formatUserContextBlock(baseUser);
    expect(block).not.toContain('sponsorship history:');
  });

  it('always emits the address-by-name guidance footer', () => {
    const block = formatUserContextBlock(baseUser);
    expect(block).toContain('Address David by name in greetings');
    expect(block).toContain('Acknowledge prior sponsorships when relevant.');
  });

  it('handles unspecified roles gracefully', () => {
    const block = formatUserContextBlock({
      ...baseUser,
      role: 'unspecified role',
    });
    expect(block).toContain('(unspecified role at Apex Retail Group)');
  });
});
