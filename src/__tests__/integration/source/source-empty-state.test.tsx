/** @jest-environment jsdom */

import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SourceEmptyState } from '@/components/source/SourceEmptyState';

describe('SourceEmptyState (SRC-EMP-NO-EVENTS)', () => {
  it('renders a clear, tenant-named empty state', () => {
    render(<SourceEmptyState tenantName="Example Tenant" />);

    const emptyState = screen.getByTestId('source-events-empty-state');
    expect(
      within(emptyState).getByRole('heading', {
        level: 1,
        name: /no source events for example tenant yet/i,
      }),
    ).toBeTruthy();
  });

  it('offers one accessible action for starting an event', () => {
    render(<SourceEmptyState />);

    const emptyState = screen.getByTestId('source-events-empty-state');
    const actions = within(emptyState).getAllByRole('link', {
      name: /start .*sourcing event/i,
    });
    expect(actions).toHaveLength(1);
    expect(actions[0]).toHaveAttribute('href', '/source/new');
    expect(actions[0]).toHaveAttribute(
      'data-testid',
      'source-empty-start-event',
    );
  });

  it('renders an operator-supplied tenant name as text, never markup', () => {
    const tenantName = 'Example <script>alert(1)</script> Tenant';
    const { container } = render(<SourceEmptyState tenantName={tenantName} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      tenantName,
    );
    expect(container.querySelector('script')).toBeNull();
  });

  it('offers setup and guidance without claiming active monitoring or agents', () => {
    render(<SourceEmptyState />);

    const emptyState = screen.getByTestId('source-events-empty-state');
    expect(
      within(emptyState).getByRole('link', { name: /review setup connectors/i }),
    ).toHaveAttribute('href', '/admin/setup');
    expect(
      within(emptyState).getByRole('link', {
        name: /new-tenant onboarding runbook/i,
      }),
    ).toHaveAttribute('href', '/docs/pilot/ONBOARDING-NEW-TENANT.md');
    expect(emptyState).not.toHaveTextContent(/steward|sentinel|live monitoring/i);
  });
});
