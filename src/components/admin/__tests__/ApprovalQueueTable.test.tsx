/**
 * @jest-environment jsdom
 */
/**
 * OV2-2c · ApprovalQueueTable render tests
 *
 * Coverage:
 *   • Renders N rows for N pending requests
 *   • Renders empty state when no pending requests
 *   • Each row exposes program name + resolved sponsor + classification + Review link
 *   • UUID-backed submitter/sponsor fields are not rendered as raw IDs
 *   • formatRelativeTime handles common buckets
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import {
  ApprovalQueueTable,
  formatRelativeTime,
} from '../programs/ApprovalQueueTable';
import type { ApprovalRequest } from '@/lib/programs/approval';

function fixture(overrides: Partial<ApprovalRequest> = {}): ApprovalRequest {
  return {
    id: 'req-' + Math.random().toString(36).slice(2, 8),
    tenantKey: 'apex-retail',
    programId: 'prog-1',
    requestedByUserId: 'user-2',
    requestedAt: '2026-04-29T12:00:00Z',
    requestStatus: 'pending',
    decidedByUserId: null,
    decidedAt: null,
    decisionRationale: null,
    briefSnapshot: {
      program_name: 'Apex CDP 2026',
      sponsor_person_id: 'pers-sponsor-1',
      classification: 'CDP',
    },
    createdAt: '2026-04-29T12:00:00Z',
    updatedAt: '2026-04-29T12:00:00Z',
    ...overrides,
  };
}

describe('ApprovalQueueTable', () => {
  it('renders one row per pending request', () => {
    const reqs = [
      fixture({ id: 'req-a' }),
      fixture({ id: 'req-b' }),
      fixture({ id: 'req-c' }),
    ];
    render(<ApprovalQueueTable requests={reqs} />);
    expect(screen.getAllByTestId('approval-queue-row')).toHaveLength(3);
    expect(screen.queryByTestId('approval-queue-empty')).toBeNull();
  });

  it('renders the empty state when no requests', () => {
    render(<ApprovalQueueTable requests={[]} />);
    expect(screen.getByTestId('approval-queue-empty')).toBeInTheDocument();
    expect(screen.getByText(/No pending approvals/i)).toBeInTheDocument();
  });

  it('renders program name, sponsor, classification, and a Review link', () => {
    const sponsorId = '2301b645-2031-4761-aa15-7a2a44225216';
    const req = fixture({
      id: 'req-x',
      requestedByUserId: '99582958-3c75-447c-a7e5-d22d0ab5009a',
      briefSnapshot: {
        program_name: 'Meridian KYC AI',
        sponsor_person_id: sponsorId,
        classification: 'AMS_CONSOLIDATION',
      },
    });
    render(
      <ApprovalQueueTable
        requests={[req]}
        resolveUserName={(id) =>
          id === req.requestedByUserId ? 'Nina Patel (Director)' : null
        }
        resolvePersonName={(id) =>
          id === sponsorId ? 'Katherine Oshima (CIO)' : null
        }
      />,
    );
    expect(screen.getByText('Meridian KYC AI')).toBeInTheDocument();
    expect(screen.getByText('Nina Patel (Director)')).toBeInTheDocument();
    expect(screen.getByText('Katherine Oshima (CIO)')).toBeInTheDocument();
    expect(screen.queryByText(req.requestedByUserId)).not.toBeInTheDocument();
    expect(screen.queryByText(sponsorId)).not.toBeInTheDocument();
    expect(screen.getByText('AMS_CONSOLIDATION')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Review/i });
    expect(link).toHaveAttribute('href', '/admin/programs/approvals/req-x');
  });

  it('uses neutral labels instead of unresolved UUID submitter and sponsor values', () => {
    const req = fixture({
      requestedByUserId: '99582958-3c75-447c-a7e5-d22d0ab5009a',
      briefSnapshot: {
        program_name: 'Meridian Analytics Modernization',
        sponsor_person_id: '2301b645-2031-4761-aa15-7a2a44225216',
      },
    });
    render(<ApprovalQueueTable requests={[req]} />);
    expect(screen.getByText('Registered user')).toBeInTheDocument();
    expect(screen.getByText('Selected sponsor')).toBeInTheDocument();
    expect(screen.queryByText(req.requestedByUserId)).not.toBeInTheDocument();
    expect(
      screen.queryByText(String(req.briefSnapshot.sponsor_person_id)),
    ).not.toBeInTheDocument();
  });

  it('falls back to "Untitled program" when program_name is missing', () => {
    const req = fixture({ briefSnapshot: {} });
    render(<ApprovalQueueTable requests={[req]} />);
    expect(screen.getByText('Untitled program')).toBeInTheDocument();
  });

  it('formatRelativeTime buckets common deltas', () => {
    const now = new Date('2026-04-29T12:00:00Z');
    expect(formatRelativeTime('2026-04-29T11:59:30Z', now)).toBe('just now');
    expect(formatRelativeTime('2026-04-29T11:55:00Z', now)).toBe('5m ago');
    expect(formatRelativeTime('2026-04-29T09:00:00Z', now)).toBe('3h ago');
    expect(formatRelativeTime('2026-04-27T12:00:00Z', now)).toBe('2d ago');
  });
});
