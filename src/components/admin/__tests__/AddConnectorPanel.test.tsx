/**
 * @jest-environment jsdom
 */
/**
 * AddConnectorPanel · Wave 2 PR-6 tests
 *
 * Covers:
 *   • Default template list renders + category filter narrows it.
 *   • Selecting a template populates the right pane.
 *   • Save draft blocks without a name + fires telemetry once supplied.
 *   • Test connection fires telemetry and renders the placeholder banner.
 *   • The "Configure auth" link points at the selected connector detail.
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';

import {
  AddConnectorPanel,
  __TESTING__,
} from '../AddConnectorPanel';

const captureMock = jest.fn();

jest.mock('posthog-js', () => ({
  __esModule: true,
  default: {
    capture: (...args: unknown[]) => captureMock(...args),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AddConnectorPanel', () => {
  it('renders every default template and filters by category', () => {
    render(<AddConnectorPanel tenantKey="apex-retail" closeHref="/admin/connectors" />);

    const cards = screen.getAllByTestId('add-connector-template-card');
    expect(cards.length).toBe(__TESTING__.DEFAULT_TEMPLATES.length);

    // Filter to CRM only
    const chips = screen.getAllByTestId('add-connector-category-chip');
    const crmChip = chips.find((c) => c.textContent === 'CRM');
    expect(crmChip).toBeTruthy();
    fireEvent.click(crmChip!);

    const filtered = screen.getAllByTestId('add-connector-template-card');
    // Only Salesforce in the CRM bucket today.
    expect(filtered).toHaveLength(1);
    expect(filtered[0]).toHaveAttribute('data-template-id', 'salesforce');
  });

  it('blocks save draft when name is empty and shows validation', () => {
    render(<AddConnectorPanel tenantKey="apex-retail" closeHref="/admin/connectors" />);
    // First template is selected by default (postgres).
    fireEvent.click(screen.getByTestId('add-connector-save-button'));
    expect(screen.getByTestId('add-connector-validation-error')).toHaveTextContent(/name/i);
    expect(captureMock).not.toHaveBeenCalled();
  });

  it('saves draft once name is supplied and fires telemetry', () => {
    render(<AddConnectorPanel tenantKey="apex-retail" closeHref="/admin/connectors" />);
    fireEvent.change(screen.getByTestId('add-connector-name-input'), {
      target: { value: 'Postgres · prod warehouse' },
    });
    fireEvent.click(screen.getByTestId('add-connector-save-button'));

    expect(captureMock).toHaveBeenCalledWith(
      'connector_onboarding_save_draft_clicked',
      expect.objectContaining({
        tenantKey: 'apex-retail',
        template_id: 'postgres',
      }),
    );
    expect(screen.getByTestId('add-connector-saved-banner')).toHaveTextContent(/Postgres · prod warehouse/);
  });

  it('fires telemetry for Test connection and renders the placeholder banner', () => {
    render(<AddConnectorPanel tenantKey="apex-retail" closeHref="/admin/connectors" />);
    fireEvent.click(screen.getByTestId('add-connector-test-button'));
    expect(captureMock).toHaveBeenCalledWith(
      'connector_onboarding_test_connection_clicked',
      expect.objectContaining({
        tenantKey: 'apex-retail',
        template_id: 'postgres',
      }),
    );
    expect(screen.getByTestId('add-connector-test-banner')).toHaveTextContent(/placeholder/i);
  });

  it('Configure auth link points to the selected connector detail', () => {
    render(<AddConnectorPanel tenantKey="apex-retail" closeHref="/admin/connectors" />);
    const link = screen.getByTestId('add-connector-configure-auth-link');
    expect(link).toHaveAttribute('href', '/admin/connectors/postgres');

    // Switch to Salesforce.
    const sfCard = screen
      .getAllByTestId('add-connector-template-card')
      .find((c) => c.getAttribute('data-template-id') === 'salesforce');
    expect(sfCard).toBeTruthy();
    fireEvent.click(sfCard!);
    expect(screen.getByTestId('add-connector-configure-auth-link')).toHaveAttribute(
      'href',
      '/admin/connectors/salesforce',
    );
  });

  it('selecting an auth method marks it active', () => {
    render(<AddConnectorPanel tenantKey="apex-retail" closeHref="/admin/connectors" />);
    // Switch to Salesforce (oauth-only).
    const sfCard = screen
      .getAllByTestId('add-connector-template-card')
      .find((c) => c.getAttribute('data-template-id') === 'salesforce')!;
    fireEvent.click(sfCard);

    const methodBtns = screen.getAllByTestId('add-connector-auth-method');
    expect(methodBtns).toHaveLength(1);
    expect(methodBtns[0]).toHaveAttribute('data-method', 'oauth');
    fireEvent.click(methodBtns[0]!);
    expect(methodBtns[0]).toHaveAttribute('data-selected', 'true');
  });

  it('renders close affordances pointing at closeHref', () => {
    const closeHref = '/admin/connectors?tab=health';
    const { container } = render(
      <AddConnectorPanel tenantKey="apex-retail" closeHref={closeHref} />,
    );
    const scrim = within(container).getByTestId('add-connector-panel-scrim');
    expect(scrim).toHaveAttribute('href', closeHref);
    const cancel = within(container).getByTestId('add-connector-cancel');
    expect(cancel).toHaveAttribute('href', closeHref);
  });
});
