/**
 * @jest-environment jsdom
 */

/**
 * InviteCollaboratorDialog · send-button wiring smoke test — PRE-W4-PR-1.
 *
 * Verifies the dialog's Send Invitation button now calls a real send
 * implementation, surfaces a loading state, renders the masked
 * audit reference on success, and renders an error banner on failure
 * (without closing the dialog).
 *
 * We inject `sendInviteImpl` directly rather than mocking the server
 * action module so the test stays purely behavioral and never reaches
 * for Clerk / Supabase.
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { InviteCollaboratorDialog } from '@/components/setup/InviteCollaboratorDialog';
import type { SendInviteResult } from '@/app/(maestro)/admin/users-access/_actions/send-invite';

// jsdom's <dialog> element does not implement showModal/close.
// Polyfill them as no-ops so the effect that toggles dialog state
// does not throw during render.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
});

async function advanceToReview() {
  // Step 1 — type a valid email
  const emailInput = screen.getByPlaceholderText(/name@company\.com/i);
  fireEvent.change(emailInput, { target: { value: 'morgan@example.com' } });
  fireEvent.click(screen.getByText(/^Continue →$/));
  // Step 2 — role (default collaborator) — continue
  fireEvent.click(screen.getByText(/^Continue →$/));
  // Step 3 — message (optional) — continue
  fireEvent.click(screen.getByText(/^Continue →$/));
  // Step 4 — review; send button visible
  await waitFor(() => {
    expect(screen.getByTestId('invite-collaborator-send')).toBeInTheDocument();
  });
}

describe('InviteCollaboratorDialog · Send wiring', () => {
  it('shows a loading state, then a success card with the invitation id', async () => {
    let resolveSend: (v: SendInviteResult) => void = () => {};
    const sendInviteImpl = jest.fn(
      () =>
        new Promise<SendInviteResult>((resolve) => {
          resolveSend = resolve;
        }),
    );

    render(
      <InviteCollaboratorDialog
        open
        onClose={() => {}}
        tenantName="Apex"
        tenantKey="apex-retail"
        sendInviteImpl={sendInviteImpl}
      />,
    );

    await advanceToReview();
    fireEvent.click(screen.getByTestId('invite-collaborator-send'));

    // Loading state is visible while the promise is pending.
    await waitFor(() => {
      expect(screen.getByTestId('invite-collaborator-send')).toHaveTextContent(/Sending/i);
    });

    // Resolve the action.
    await act(async () => {
      resolveSend({ ok: true, invitationId: 'inv_test_123', maskedEmail: 'm***@example.com' });
    });

    await waitFor(() => {
      expect(screen.getByTestId('invite-collaborator-success')).toBeInTheDocument();
      expect(screen.getByTestId('invitation-id')).toHaveTextContent('inv_test_123');
    });

    expect(sendInviteImpl).toHaveBeenCalledTimes(1);
    expect(sendInviteImpl).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantKey: 'apex-retail',
        email: 'morgan@example.com',
        role: 'collaborator',
      }),
    );
  });

  it('renders an inline error and keeps the dialog open on failure', async () => {
    const sendInviteImpl = jest.fn(async () => ({
      ok: false as const,
      code: 'already_member' as const,
      message: 'That email is already a member.',
    }));

    const onClose = jest.fn();
    render(
      <InviteCollaboratorDialog
        open
        onClose={onClose}
        tenantName="Apex"
        tenantKey="apex-retail"
        sendInviteImpl={sendInviteImpl}
      />,
    );

    await advanceToReview();
    fireEvent.click(screen.getByTestId('invite-collaborator-send'));

    await waitFor(() => {
      expect(screen.getByTestId('invite-collaborator-error')).toHaveTextContent(
        /already a member/i,
      );
    });
    // Success card never rendered; dialog still open.
    expect(screen.queryByTestId('invite-collaborator-success')).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
