/**
 * @jest-environment jsdom
 */
/**
 * SegmentDetailPage · render tests · SETUP-1.7
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { resolveSegmentRef } from '@/lib/admin/setup-acts-registry';
import type { SegmentRecordSummary } from '@/lib/admin/setup-data-broker';

import { SegmentDetailPage } from '../SegmentDetailPage';

function record(overrides: Partial<SegmentRecordSummary> = {}): SegmentRecordSummary {
  return {
    recordId: 'kpi_dictionary:kpi:apex:001',
    title: 'Revenue',
    recordKind: 'kpi',
    sourceDoc: 'kpi_dictionary.json',
    dataClassification: 'Internal',
    freshnessState: 'fresh',
    confidence: 0.9,
    lastReviewed: '2026-04-15',
    uploadedBy: 'Apex synthetic dataset import',
    uploadedAt: '2026-04-29T12:00:00Z',
    ...overrides,
  };
}

describe('SegmentDetailPage', () => {
  it('renders header + rollup ribbon + record table for a populated segment', () => {
    const ref = resolveSegmentRef('05')!;
    render(
      <SegmentDetailPage
        reference={ref}
        rollup={{
          segmentId: 'kpi_dictionary',
          segmentName: 'KPI dictionary',
          familyNumber: 5,
          recordCount: 50,
          coverageScore: 100,
          staleCount: 0,
          missingCount: 0,
          healthState: 'complete',
          lastReviewedAt: null,
          lastIngestedAt: null,
        }}
        records={[
          record(),
          record({ recordId: 'kpi_dictionary:kpi:apex:002', title: 'EBITDA' }),
        ]}
      />,
    );
    expect(screen.getByTestId('admin-segment-detail')).toBeInTheDocument();
    expect(screen.getByTestId('admin-segment-rollup')).toBeInTheDocument();
    expect(screen.getByTestId('admin-segment-records')).toBeInTheDocument();
    expect(
      screen.getByTestId('admin-segment-record-kpi_dictionary:kpi:apex:001'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('admin-segment-record-kpi_dictionary:kpi:apex:002'),
    ).toBeInTheDocument();
  });

  it('exposes data-segment-id on the wrapper for E2E targeting', () => {
    const ref = resolveSegmentRef('09')!;
    render(
      <SegmentDetailPage reference={ref} rollup={null} records={[]} />,
    );
    const wrapper = screen.getByTestId('admin-segment-detail');
    expect(wrapper).toHaveAttribute('data-segment-id', '09');
    expect(wrapper).toHaveAttribute('data-segment-key', 'evidence_ledger');
  });

  it('renders the not-loaded notice when rollup is null', () => {
    const ref = resolveSegmentRef('14')!;
    render(<SegmentDetailPage reference={ref} rollup={null} records={[]} />);
    expect(screen.getByTestId('admin-segment-not-loaded')).toBeInTheDocument();
  });

  it('renders the empty-state when rollup exists but no records', () => {
    const ref = resolveSegmentRef('13')!;
    render(
      <SegmentDetailPage
        reference={ref}
        rollup={{
          segmentId: 'industry_context',
          segmentName: 'Industry context',
          familyNumber: 13,
          recordCount: 0,
          coverageScore: 0,
          staleCount: 0,
          missingCount: 0,
          healthState: 'not_started',
          lastReviewedAt: null,
          lastIngestedAt: null,
        }}
        records={[]}
      />,
    );
    expect(screen.getByTestId('admin-segment-empty')).toBeInTheDocument();
  });

  it('breadcrumb links back to /admin', () => {
    const ref = resolveSegmentRef('01')!;
    render(<SegmentDetailPage reference={ref} rollup={null} records={[]} />);
    const breadcrumb = screen.getByTestId('admin-segment-breadcrumb');
    expect(breadcrumb).toHaveAttribute('href', '/admin');
  });
});
