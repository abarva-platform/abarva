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

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      toPhase: 1,
      selfApproveIfAuthorized: true,
      snapshot: { requested_from: 'program_detail_phase_advance_button' },
    });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });
});
