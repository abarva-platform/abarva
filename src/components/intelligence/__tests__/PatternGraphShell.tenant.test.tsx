/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type React from 'react';

import { PatternGraphShell } from '../PatternGraphShell';
import { buildPatternGraphShellView } from '@/lib/sentinel/pattern-graph-shell-view';
import { buildPatternGraphView } from '@/lib/sentinel/pattern-graph-read-model';

jest.mock('@/components/shell/AppShell', () => ({
  AppShell: ({
    topBarProps,
    children,
  }: {
    topBarProps: { tenantName?: string };
    children: React.ReactNode;
  }) => (
    <div>
      <div data-testid="app-shell-tenant-name">{topBarProps.tenantName}</div>
      {children}
    </div>
  ),
}));

jest.mock('../PatternGraphSentinel', () => ({
  PatternGraphSentinel: () => <aside data-testid="pattern-graph-sentinel" />,
}));

describe('PatternGraphShell tenant label', () => {
  it('uses the active tenant name instead of the Apex fixture label', () => {
    render(
      <PatternGraphShell
        shell={buildPatternGraphShellView('graph')}
        graph={buildPatternGraphView()}
        tenantName="Lakeshore Holdings"
      />,
    );

    expect(screen.getByTestId('app-shell-tenant-name')).toHaveTextContent(
      'Lakeshore Holdings',
    );
    expect(screen.queryByText('Apex Retail Group')).not.toBeInTheDocument();
  });
});
