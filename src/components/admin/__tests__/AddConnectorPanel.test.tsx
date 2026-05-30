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
import { act, fireEvent, render, screen, within } from '@testing-library/react';

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

// The panel pulls in the server action by default. In jsdom we
// stub the action with a per-test override via the `saveDraft` prop.
jest.mock('@/app/(maestro)/admin/connectors/_actions/create-pending-connector', () => ({
  createPendingConnectorAction: jest.fn(async () => ({
    ok: true,
    connectorId: 'conn-fixture-1',
  })),
}));

const defaultSaveDraft = jest.fn(async () => ({
  ok: true as const,
  connectorId: 'conn-fixture-1',
}));

beforeEach(() => {
  jest.clearAllMocks();
  defaultSaveDraft.mockClear();
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
    render(
      <AddConnectorPanel
        tenantKey="apex-retail"
        closeHref="/admin/connectors"
        saveDraft={defaultSaveDraft}
      />,
    );
    // First template is selected by default (postgres).
    fireEvent.click(screen.getByTestId('add-connector-save-button'));
    expect(screen.getByTestId('add-connector-validation-error')).toHaveTextContent(/name/i);
    expect(captureMock).not.toHaveBeenCalled();
    expect(defaultSaveDraft).not.toHaveBeenCalled();
  });

  it('saves draft once name is supplied, fires telemetry, and invokes the action', async () => {
    render(
      <AddConnectorPanel
        tenantKey="apex-retail"
        closeHref="/admin/connectors"
        saveDraft={defaultSaveDraft}
      />,
    );
    fireEvent.change(screen.getByTestId('add-connector-name-input'), {
      target: { value: 'Postgres · prod warehouse' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('add-connector-save-button'));
    });

    expect(captureMock).toHaveBeenCalledWith(
      'connector_onboarding_save_draft_clicked',
      expect.objectContaining({
        tenantKey: 'apex-retail',
        template_id: 'postgres',
      }),
    );
    expect(defaultSaveDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: 'postgres',
        name: 'Postgres · prod warehouse',
      }),
    );
    expect(screen.getByTestId('add-connector-saved-banner')).toHaveTextContent(
      /Postgres · prod warehouse/,
    );
    const link = screen.getByTestId('add-connector-saved-link');
    expect(link).toHaveAttribute(
      'href',
      '/admin/connectors#connector-conn-fixture-1',
    );
  });

  it('surfaces server-action errors inline and preserves form state', async () => {
    const failingAction = jest.fn(async () => ({
      ok: false as const,
      error: 'Permission denied.',
    }));
    render(
      <AddConnectorPanel
        tenantKey="apex-retail"
        closeHref="/admin/connectors"
        saveDraft={failingAction}
      />,
    );
    fireEvent.change(screen.getByTestId('add-connector-name-input'), {
      target: { value: 'Postgres · prod' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('add-connector-save-button'));
    });
    expect(failingAction).toHaveBeenCalled();
    expect(screen.getByTestId('add-connector-validation-error')).toHaveTextContent(
      /Permission denied/,
    );
    // Name preserved so the operator can fix the issue and retry.
    expect(screen.getByTestId('add-connector-name-input')).toHaveValue(
      'Postgres · prod',
    );
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
