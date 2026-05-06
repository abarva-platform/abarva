/**
 * @jest-environment jsdom
 */
/**
 * SetupAdminLanding · render tests · SETUP-1.2
 *
 * Verifies the composer renders the three Acts + opener + activity
 * feed for both rich (Apex) and sparse (cold tenant) inputs, and
 * that segment rollups appear when supplied.
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { getSetupActsContent } from '@/lib/admin/setup-acts-registry';

import { SetupAdminLanding } from '../SetupAdminLanding';

describe('SetupAdminLanding', () => {
  it('renders all three Acts + opener + activity for the rich Apex content', () => {
    const content = getSetupActsContent('apexretail');
    render(
      <SetupAdminLanding
        content={content}
        segmentRollups={[]}
        totalRecords={403}
        segmentsTracked={14}
        capabilitiesGrounded={2}
        lastIngestedRelative="5m ago"
        atlasSignalCount={12}
        atlasHighSeverityCount={2}
        nexusProgramCount={4}
        stewardFindingCount={11}
      />,
    );

    expect(screen.getByTestId('admin-setup-landing')).toBeInTheDocument();
    expect(screen.getByTestId('admin-setup-sentinel-opener')).toBeInTheDocument();
    expect(screen.getByTestId('admin-setup-act-one')).toBeInTheDocument();
    expect(screen.getByTestId('admin-setup-capability-matrix')).toBeInTheDocument();
    expect(screen.getByTestId('admin-setup-act-three')).toBeInTheDocument();
    expect(screen.getByTestId('admin-setup-activity')).toBeInTheDocument();
  });

  it('opener summary cites the live total record count', () => {
    const content = getSetupActsContent('apexretail');
    render(
      <SetupAdminLanding
        content={content}
        segmentRollups={[]}
        totalRecords={403}
        segmentsTracked={14}
        capabilitiesGrounded={2}
        atlasSignalCount={12}
        atlasHighSeverityCount={2}
        nexusProgramCount={4}
        stewardFindingCount={11}
      />,
    );
    const records = screen.getByTestId('admin-setup-summary-records');
    expect(records.textContent).toContain('403');
    const segments = screen.getByTestId('admin-setup-summary-segments');
    expect(segments.textContent).toContain('14 of 14');
  });

  it('renders segment rollups when supplied', () => {
    const content = getSetupActsContent('apexretail');
    render(
      <SetupAdminLanding
        content={content}
        segmentRollups={[
          {
            segmentId: 'enterprise_profile',
            segmentName: 'Enterprise profile',
            familyNumber: 1,
            recordCount: 1,
            coverageScore: 100,
            staleCount: 0,
            missingCount: 0,
            healthState: 'complete',
            lastReviewedAt: null,
            lastIngestedAt: null,
          },
        ]}
        totalRecords={1}
        segmentsTracked={1}
        capabilitiesGrounded={0}
        atlasSignalCount={0}
        atlasHighSeverityCount={0}
        nexusProgramCount={0}
        stewardFindingCount={0}
      />,
    );
    expect(screen.getByTestId('admin-setup-act-one-rollups')).toBeInTheDocument();
    expect(
      screen.getByTestId('admin-setup-segment-enterprise_profile'),
    ).toBeInTheDocument();
  });

  it('shows sparse content for non-Apex tenants', () => {
    const content = getSetupActsContent('keystone');
    render(
      <SetupAdminLanding
        content={content}
        segmentRollups={[]}
        totalRecords={null}
        segmentsTracked={null}
        capabilitiesGrounded={0}
        atlasSignalCount={0}
        atlasHighSeverityCount={0}
        nexusProgramCount={0}
        stewardFindingCount={0}
      />,
    );
    expect(screen.getByTestId('admin-setup-landing')).toHaveAttribute(
      'data-tenant-richness',
      'sparse',
    );
    // No facts in Act 1 → empty-state renders
    const empties = screen.getAllByTestId('admin-setup-empty');
    expect(empties.length).toBeGreaterThanOrEqual(2);
  });

  it('uses Act 3 gains to explain what setup data enables', () => {
    const content = getSetupActsContent('keystone');
    render(
      <SetupAdminLanding
        content={content}
        segmentRollups={[]}
        totalRecords={null}
        segmentsTracked={null}
        capabilitiesGrounded={0}
        atlasSignalCount={0}
        atlasHighSeverityCount={0}
        nexusProgramCount={0}
        stewardFindingCount={0}
      />,
    );

    expect(screen.getByTestId('admin-setup-orientation-banner')).toHaveTextContent(
      'Enterprise memory',
    );
    const priorityList = screen.getByTestId('admin-setup-orientation-priorities');
    expect(priorityList).toHaveTextContent('Segment 1');
    expect(priorityList).toHaveTextContent('Enterprise Profile');
    expect(priorityList).toHaveTextContent('decision rights');
    expect(priorityList.querySelectorAll('li')).toHaveLength(3);
  });

  it('Act 3 ranks gain entries by rank ascending', () => {
    const content = getSetupActsContent('apexretail');
    render(
      <SetupAdminLanding
        content={content}
        segmentRollups={[]}
        totalRecords={403}
        segmentsTracked={14}
        capabilitiesGrounded={2}
        atlasSignalCount={12}
        atlasHighSeverityCount={2}
        nexusProgramCount={4}
        stewardFindingCount={11}
      />,
    );
    const list = screen.getByTestId('admin-setup-gain-list');
    const items = list.querySelectorAll('[data-testid^="admin-setup-gain-"]');
    // First item should be the rank=1 gain
    const firstRankedId = content.actThreeGainEntries
      .slice()
      .sort((a, b) => a.rank - b.rank)[0]?.id;
    expect(items[0]?.getAttribute('data-testid')).toBe(
      `admin-setup-gain-${firstRankedId}`,
    );
  });

  it('capability matrix renders narrative cards covering depth states', () => {
    const content = getSetupActsContent('apexretail');
    render(
      <SetupAdminLanding
        content={content}
        segmentRollups={[]}
        totalRecords={403}
        segmentsTracked={14}
        capabilitiesGrounded={2}
        atlasSignalCount={12}
        atlasHighSeverityCount={2}
        nexusProgramCount={4}
        stewardFindingCount={11}
      />,
    );
    expect(screen.getByTestId('admin-setup-capability-matrix')).toBeInTheDocument();
    expect(screen.getByTestId('admin-setup-narrative-deep')).toBeInTheDocument();
    expect(screen.getByTestId('admin-setup-narrative-blocked')).toBeInTheDocument();
  });
});
