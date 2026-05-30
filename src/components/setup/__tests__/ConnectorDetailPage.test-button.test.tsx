/**
 * @jest-environment jsdom
 */
/**
 * ConnectorDetailPage · Wave 2 PR-6 — Test connection affordance
 *
 * Smoke test: every connector detail page renders the
 * `ConnectorTestConnectionButton` near the top of the detail body.
 * Verdict §4 Persona A: "this page (180 LOC) is real but mostly
 * form scaffolding … does not offer … a 'test connection' affordance."
 *
 * We stub the AppShell / AgentColumn / SubNavStrip wrappers because
 * they pull in the full app-shell theme tree; the assertion is just
 * that the new button renders on the page.
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { ConnectorDetailPage } from '../ConnectorDetailPage';
import { getSetupConnectorDetail } from '@/lib/setup/shell-setup-fixture';

jest.mock('@/components/shell/AppShell', () => ({
  AppShell: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div data-testid="app-shell-mock">{children}</div>,
}));

jest.mock('@/components/shell/AgentColumn', () => ({
  AgentColumn: () => <aside data-testid="agent-column-mock" />,
}));

jest.mock('@/components/shell/SubNavStrip', () => ({
  SubNavStrip: () => <nav data-testid="subnav-mock" />,
}));

describe('ConnectorDetailPage Test connection affordance', () => {
  it('renders the Test connection button on a known seeded connector detail', () => {
    const detail = getSetupConnectorDetail('sn');
    expect(detail).toBeTruthy();
    render(<ConnectorDetailPage detail={detail!} />);
    expect(screen.getByTestId('connector-test-connection-button')).toBeInTheDocument();
  });
});
