/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { ApprovalBriefSnapshotCard } from '../programs/ApprovalBriefSnapshotCard';

describe('ApprovalBriefSnapshotCard', () => {
  it('renders resolved person names instead of raw sponsor and lead UUIDs', () => {
    const sponsorId = '2301b645-2031-4761-aa15-7a2a44225216';
    const leadId = '610d2932-07fd-4446-b1be-e07f3f2f63f4';

    render(
      <ApprovalBriefSnapshotCard
        briefSnapshot={{
          program_name: 'Healthcare Data Analytics Modernization',
          sponsor_person_id: sponsorId,
          lead_person_id: leadId,
        }}
        resolvePersonName={(id) => {
          if (id === sponsorId) return 'Katherine Oshima (CIO)';
          if (id === leadId) return 'Marcus Chen (VP Data and Analytics)';
          return null;
        }}
      />,
    );

    expect(screen.getByText('Katherine Oshima (CIO)')).toBeInTheDocument();
    expect(
      screen.getByText('Marcus Chen (VP Data and Analytics)'),
    ).toBeInTheDocument();
    expect(screen.queryByText(sponsorId)).not.toBeInTheDocument();
    expect(screen.queryByText(leadId)).not.toBeInTheDocument();
  });

  it('uses neutral labels for unresolved UUID person fields', () => {
    const sponsorId = '2301b645-2031-4761-aa15-7a2a44225216';
    const leadId = '610d2932-07fd-4446-b1be-e07f3f2f63f4';

    render(
      <ApprovalBriefSnapshotCard
        briefSnapshot={{
          program_name: 'Healthcare Data Analytics Modernization',
          sponsor_person_id: sponsorId,
          lead_person_id: leadId,
        }}
      />,
    );

    expect(screen.getByText('Selected sponsor')).toBeInTheDocument();
    expect(screen.getByText('Selected lead')).toBeInTheDocument();
    expect(screen.queryByText(sponsorId)).not.toBeInTheDocument();
    expect(screen.queryByText(leadId)).not.toBeInTheDocument();
  });
});
