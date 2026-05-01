/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ProgramUserProvisionForm } from '../ProgramUserProvisionForm';

const refreshMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

describe('ProgramUserProvisionForm', () => {
  beforeEach(() => {
    refreshMock.mockReset();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        email: 'sarah.chen@example.com',
        assignments: [{ programId: 'program-1', status: 'assigned' }],
        invitation: { status: 'sent', invitationId: 'invite-1', email: 'sarah.chen@example.com' },
      }),
    }) as jest.Mock;
  });

  it('submits client-pinned Programs provisioning payload', async () => {
    render(
      <ProgramUserProvisionForm
        tenantName="Meridian Health System"
        programs={[{ id: 'program-1', name: 'Analytics Modernization', phaseLabel: 'P0 Origination' }]}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: /^Email$/i }), {
      target: { value: 'sarah.chen@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Display name/i), {
      target: { value: 'Sarah Chen' },
    });
    (screen.getByRole('option', { name: /Analytics Modernization/i }) as HTMLOptionElement).selected = true;
    fireEvent.change(screen.getByLabelText(/Existing program assignments/i));
    fireEvent.click(screen.getByLabelText(/Send Clerk invite email/i));

    fireEvent.click(screen.getByRole('button', { name: /Provision Programs user/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/provision', expect.objectContaining({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    }));
    const body = JSON.parse(((global.fetch as jest.Mock).mock.calls[0][1] as { body: string }).body);
    expect(body).toMatchObject({
      email: 'sarah.chen@example.com',
      name: 'Sarah Chen',
      accessLevel: 'program_member',
      programIds: ['program-1'],
      financialVisibility: false,
      canCreatePrograms: true,
      canUploadArtifacts: true,
      canGenerateDeliverables: true,
      sendInvite: true,
    });
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/Provisioned sarah.chen@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/Clerk invite sent/i)).toBeInTheDocument();
  });

  it('surfaces failed cross-client assignments without claiming full success', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        email: 'sarah.chen@example.com',
        assignments: [{ programId: 'apex-program', status: 'failed' }],
        invitation: { status: 'failed', detail: 'tenant mismatch' },
      }),
    });

    render(
      <ProgramUserProvisionForm
        tenantName="Meridian Health System"
        programs={[{ id: 'apex-program', name: 'Apex Program', phaseLabel: 'P0 Origination' }]}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: /^Email$/i }), {
      target: { value: 'sarah.chen@example.com' },
    });
    (screen.getByRole('option', { name: /Apex Program/i }) as HTMLOptionElement).selected = true;
    fireEvent.change(screen.getByLabelText(/Existing program assignments/i));
    fireEvent.click(screen.getByRole('button', { name: /Provision Programs user/i }));

    expect(await screen.findByText(/program assignment failed/i)).toBeInTheDocument();
    expect(screen.getByText(/Clerk invite failed: tenant mismatch/i)).toBeInTheDocument();
  });
});
