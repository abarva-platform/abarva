/**
 * @jest-environment jsdom
 *
 * NotificationsPreferencesPage component tests · W4-PR-4
 *
 * Coverage:
 *   - Matrix renders one fieldset per source module.
 *   - Mandatory rows render a LOCKED chip + a "mandatory · cannot
 *     disable" note.
 *   - Channel segmented control reflects state; clicking 'None' clears
 *     the frequency dropdown (renders "n/a · channel disabled").
 *   - Frequency dropdown only appears when channel !== 'none'.
 *   - Quiet hours, timezone, and daily cap inputs reflect state.
 *   - Empty state: when no preferences exist, the apply-defaults banner
 *     renders and Save is disabled.
 *   - Default hint string shows the registry default per row.
 *   - Save dispatches the action with the form payload.
 *   - Test-send buttons dispatch with the channel and surface status.
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import {
  NotificationsPreferencesPage,
  type NotificationsPreferencesPageProps,
  type SavePreferencesResult,
  type SeedDefaultsResult,
  type SendTestResult,
} from '../NotificationsPreferencesPage';
import { NOTIFICATION_REGISTRY } from '@/lib/admin/broker/notifications-registry';
import type {
  NotificationPreferenceRow,
  NotificationSourceModule,
} from '@/lib/admin/broker/notifications-types';

const MODULES: NotificationSourceModule[] = [
  'setup',
  'moves',
  'source',
  'intelligence',
  'tower',
  'system',
];

function makeRegistryByModule() {
  return MODULES.map((module) => ({
    module,
    entries: NOTIFICATION_REGISTRY.filter((e) => e.sourceModule === module),
  }));
}

function makeProps(
  overrides: Partial<NotificationsPreferencesPageProps> = {},
): NotificationsPreferencesPageProps {
  return {
    tenantName: 'Apex Retail Group',
    tenantSlug: 'apex-retail',
    userId: 'user_test_123',
    personaLabel: 'CIO · Apex',
    registryByModule: makeRegistryByModule(),
    existingPreferences: [],
    mandatoryEventTypes: ['approval.requested', 'rls.policy_change'],
    lastSavedAt: null,
    actions: {
      savePreferences: jest.fn(
        async () => ({ ok: true, savedAt: new Date().toISOString(), count: 1 } as SavePreferencesResult),
      ),
      seedDefaults: jest.fn(async () => ({ ok: true, count: 18 } as SeedDefaultsResult)),
      sendTest: jest.fn(async () => ({ ok: true, status: 'queued' } as SendTestResult)),
    },
    ...overrides,
  };
}

function makeExistingPreferences(): NotificationPreferenceRow[] {
  const now = '2026-05-30T12:34:56Z';
  return NOTIFICATION_REGISTRY.map((entry, idx) => ({
    id: `row-${idx}`,
    tenant_id: 'tenant-1',
    user_id: 'user_test_123',
    event_type: entry.eventType,
    channel: entry.defaultChannel,
    frequency: entry.defaultFrequency,
    quiet_hours_start: null,
    quiet_hours_end: null,
    timezone: 'UTC',
    mandatory: false,
    daily_cap: 20,
    created_at: now,
    updated_at: now,
  }));
}

describe('NotificationsPreferencesPage', () => {
  it('renders one fieldset per source module', () => {
    render(<NotificationsPreferencesPage {...makeProps({ existingPreferences: makeExistingPreferences() })} />);
    for (const mod of MODULES) {
      expect(document.querySelector(`[data-module-fieldset="${mod}"]`)).toBeInTheDocument();
    }
  });

  it('renders the LOCKED chip + "cannot disable" note on mandatory rows', () => {
    render(<NotificationsPreferencesPage {...makeProps({ existingPreferences: makeExistingPreferences() })} />);
    const mandatoryRow = document.querySelector('[data-event-row="approval.requested"]') as HTMLElement;
    expect(mandatoryRow).toBeInTheDocument();
    expect(mandatoryRow.getAttribute('data-mandatory')).toBe('true');
    expect(within(mandatoryRow).getByText(/LOCKED/i)).toBeInTheDocument();
    expect(within(mandatoryRow).getByText(/mandatory · cannot disable/i)).toBeInTheDocument();
  });

  it('non-mandatory rows do NOT show a LOCKED chip', () => {
    render(<NotificationsPreferencesPage {...makeProps({ existingPreferences: makeExistingPreferences() })} />);
    const row = document.querySelector('[data-event-row="system.daily_digest"]') as HTMLElement;
    expect(row).toBeInTheDocument();
    expect(row.getAttribute('data-mandatory')).toBe('false');
    expect(within(row).queryByText(/LOCKED/i)).not.toBeInTheDocument();
  });

  it('frequency dropdown disappears when channel is set to None', () => {
    render(<NotificationsPreferencesPage {...makeProps({ existingPreferences: makeExistingPreferences() })} />);
    const row = document.querySelector('[data-event-row="system.daily_digest"]') as HTMLElement;
    expect(within(row).getByRole('combobox', { name: /frequency/i })).toBeInTheDocument();

    const noneButton = row.querySelector('[data-channel-option="none"]') as HTMLButtonElement;
    fireEvent.click(noneButton);

    expect(within(row).queryByRole('combobox', { name: /frequency/i })).not.toBeInTheDocument();
    expect(within(row).getByText(/n\/a · channel disabled/i)).toBeInTheDocument();
  });

  it('disables the None option on mandatory rows', () => {
    render(<NotificationsPreferencesPage {...makeProps({ existingPreferences: makeExistingPreferences() })} />);
    const mandatoryRow = document.querySelector('[data-event-row="approval.requested"]') as HTMLElement;
    const noneButton = mandatoryRow.querySelector('[data-channel-option="none"]') as HTMLButtonElement;
    expect(noneButton).toBeDisabled();
  });

  it('renders the empty-state banner when no preferences exist', () => {
    render(<NotificationsPreferencesPage {...makeProps({ existingPreferences: [] })} />);
    expect(document.querySelector('[data-empty-state-banner]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /apply defaults for my role/i })).toBeInTheDocument();
    // Save / Cancel disabled when no prefs exist.
    expect(screen.getByRole('button', { name: /^save preferences$/i })).toBeDisabled();
  });

  it('shows the default hint per row', () => {
    render(<NotificationsPreferencesPage {...makeProps({ existingPreferences: makeExistingPreferences() })} />);
    const row = document.querySelector('[data-event-row="system.daily_digest"]') as HTMLElement;
    const hint = within(row).getByText(/default:/i);
    expect(hint.textContent).toMatch(/Email · Daily digest/i);
  });

  it('quiet hours inputs reflect typed state', () => {
    render(<NotificationsPreferencesPage {...makeProps({ existingPreferences: makeExistingPreferences() })} />);
    const start = document.querySelector('[data-input="quiet-start"]') as HTMLInputElement;
    fireEvent.change(start, { target: { value: '22:00' } });
    expect(start.value).toBe('22:00');
  });

  it('daily cap input accepts a number', () => {
    render(<NotificationsPreferencesPage {...makeProps({ existingPreferences: makeExistingPreferences() })} />);
    const cap = document.querySelector('[data-input="daily-cap"]') as HTMLInputElement;
    fireEvent.change(cap, { target: { value: '50' } });
    expect(cap.value).toBe('50');
  });

  it('clicking save dispatches the savePreferences action', async () => {
    const props = makeProps({ existingPreferences: makeExistingPreferences() });
    render(<NotificationsPreferencesPage {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /^save preferences$/i }));
    await waitFor(() => expect(props.actions.savePreferences).toHaveBeenCalledTimes(1));
    const call = (props.actions.savePreferences as jest.Mock).mock.calls[0][0];
    expect(call.rows.length).toBeGreaterThan(0);
    expect(call.rows[0]).toHaveProperty('event_type');
    expect(call.rows[0]).toHaveProperty('channel');
    expect(call.rows[0]).toHaveProperty('frequency');
  });

  it('clicking the test button dispatches the sendTest action with the channel', async () => {
    const props = makeProps({ existingPreferences: makeExistingPreferences() });
    render(<NotificationsPreferencesPage {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /test email/i }));
    await waitFor(() => expect(props.actions.sendTest).toHaveBeenCalledWith('email'));
    await waitFor(() =>
      expect(document.querySelector('[data-test-status="email"]')?.textContent).toMatch(
        /dispatched \(queued\)/i,
      ),
    );
  });

  it('clicking apply-defaults dispatches the seedDefaults action', async () => {
    const props = makeProps({ existingPreferences: [] });
    render(<NotificationsPreferencesPage {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /apply defaults for my role/i }));
    await waitFor(() => expect(props.actions.seedDefaults).toHaveBeenCalledTimes(1));
  });

  it('surfaces an error feedback when save returns ok:false', async () => {
    const props = makeProps({
      existingPreferences: makeExistingPreferences(),
      actions: {
        savePreferences: jest.fn(
          async () =>
            ({ ok: false, code: 'mandatory_locked', message: 'cannot disable' } as SavePreferencesResult),
        ),
        seedDefaults: jest.fn(async () => ({ ok: true, count: 0 } as SeedDefaultsResult)),
        sendTest: jest.fn(async () => ({ ok: true, status: 'queued' } as SendTestResult)),
      },
    });
    render(<NotificationsPreferencesPage {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /^save preferences$/i }));
    await waitFor(() =>
      expect(document.querySelector('[data-feedback="error"]')?.textContent).toMatch(/cannot disable/i),
    );
  });
});
