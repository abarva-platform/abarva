/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PhaseAdvanceButton } from '../PhaseAdvanceButton';

const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ ok: true, newPhase: 1 }),
  }) as jest.Mock;
});

describe('PhaseAdvanceButton', () => {
  it('requests self-approval when the caller is authorized for phase gates', async () => {
    render(
      <PhaseAdvanceButton
        programId="prog-1"
        currentPhase={0}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /advance to p1/i }));
    expect(global.fetch).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/human rationale for phase advance/i), {
      target: { value: 'I reviewed the evidence and accept this phase advance.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /commit human decision/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      toPhase: 1,
      selfApproveIfAuthorized: true,
      humanRationale: 'I reviewed the evidence and accept this phase advance.',
      snapshot: {
        requested_from: 'program_detail_phase_advance_button',
        humanRationale: 'I reviewed the evidence and accept this phase advance.',
      },
    });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it('shows a gate-completion label and does not call the API when disabled', () => {
    render(
      <PhaseAdvanceButton
        programId="prog-1"
        currentPhase={0}
        disabledReason="Complete and sign off the P0 seed artifacts before requesting Discovery."
      />,
    );

    const button = screen.getByRole('button', {
      name: /complete current gate first/i,
    });
    expect((button as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(button);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
