/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import type { CrossProgramSignal } from '@/lib/admin/setup-data-broker';

import { CrossProgramSignalsPanel } from '../CrossProgramSignalsPanel';

function signal(overrides: Partial<CrossProgramSignal> = {}): CrossProgramSignal {
  return {
    recordId: 'cross_program_signals:xprog:apex:001',
    signalId: 'xprog:apex:001',
    title: 'CMO growth thesis vs CFO cost-takeout posture',
    signalType: 'strategic_misalignment',
    severityRaw: 'High',
    severityBucket: 'high',
    description:
      'CMO target growth scope conflicts with FY2026 cost-takeout posture',
    recommendation: 'Quarterly portfolio review with CFO discipline.',
    status: 'Open',
    programs: ['apex-cdp-2026', 'apex-cc-ai-2026'],
    raisedBy: 'Atlas',
    raisedDate: '2026-04-15',
    ...overrides,
  };
}

describe('CrossProgramSignalsPanel', () => {
  it('renders the empty state when no signals are loaded', () => {
    render(
      <CrossProgramSignalsPanel tenantDisplayName="Apex Retail Group" signals={[]} />,
    );
    expect(screen.getByTestId('admin-xprog-empty')).toBeInTheDocument();
  });

  it('groups signals by severity bucket and renders each card', () => {
    const signals = [
      signal({ recordId: 'r1', signalId: 'high-1', severityBucket: 'high' }),
      signal({
        recordId: 'r2',
        signalId: 'med-1',
        severityRaw: 'Medium',
        severityBucket: 'medium',
        title: 'Priya leads two programs simultaneously',
      }),
      signal({
        recordId: 'r3',
        signalId: 'low-1',
        severityRaw: 'Low',
        severityBucket: 'low',
        title: 'Snowflake — touches all four programs',
      }),
    ];
    render(
      <CrossProgramSignalsPanel tenantDisplayName="Apex Retail Group" signals={signals} />,
    );
    expect(screen.getByTestId('admin-xprog-group-high')).toBeInTheDocument();
    expect(screen.getByTestId('admin-xprog-group-medium')).toBeInTheDocument();
    expect(screen.getByTestId('admin-xprog-group-low')).toBeInTheDocument();
    expect(screen.getByTestId('admin-xprog-signal-high-1')).toBeInTheDocument();
    expect(screen.getByTestId('admin-xprog-signal-med-1')).toBeInTheDocument();
    expect(screen.getByTestId('admin-xprog-signal-low-1')).toBeInTheDocument();
  });

  it('signal card surfaces description + recommendation + program links', () => {
    render(
      <CrossProgramSignalsPanel
        tenantDisplayName="Apex Retail Group"
        signals={[signal()]}
      />,
    );
    expect(
      screen.getByText(/CMO target growth scope conflicts/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Quarterly portfolio review with CFO discipline/),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('admin-xprog-program-link-xprog:apex:001-0'),
    ).toHaveAttribute('href', '/programs/apex-cdp-2026');
  });

  it('breadcrumb links back to /admin', () => {
    render(
      <CrossProgramSignalsPanel
        tenantDisplayName="Apex Retail Group"
        signals={[signal()]}
      />,
    );
    expect(screen.getByTestId('admin-xprog-breadcrumb')).toHaveAttribute(
      'href',
      '/admin',
    );
  });
});
