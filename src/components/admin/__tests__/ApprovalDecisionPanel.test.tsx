/**
 * @jest-environment jsdom
 */
/**
 * OV2-2c · ApprovalDecisionPanel interactive tests
 *
 * Coverage:
 *   • Reject without rationale shows an inline error and does not POST
 *   • Approve happy path POSTs the right body and redirects
 *   • Reject happy path includes the trimmed rationale in the body
 *   • Server error renders inline alert
 *   • alreadyDecided=true renders the read-only variant
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ApprovalDecisionPanel } from '../programs/ApprovalDecisionPanel';

const pushMock = jest.fn();
const refreshMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

const fetchMock = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  // jsdom does not ship fetch by default
  (globalThis as { fetch?: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  delete (globalThis as { fetch?: typeof fetch }).fetch;
});

function mockResponse(body: unknown, init: { status?: number } = {}): Response {
  // jsdom in this jest config does not expose the global Response. We
  // fall back to a duck-typed object that the panel only needs to
  // expose ok / status / json().
  const status = init.status ?? 200;
  const stub = {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  };
  return stub as unknown as Response;
}

describe('ApprovalDecisionPanel', () => {
  it('blocks reject without rationale and does not POST', async () => {
    render(<ApprovalDecisionPanel requestId="req-1" />);
    fireEvent.click(screen.getByTestId('approval-reject-button'));
    expect(await screen.findByTestId('approval-decision-error')).toHaveTextContent(
      /Rationale is required/i,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('approve happy path POSTs the right body and navigates', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ ok: true, request: { id: 'req-1' } }),
    );
    render(<ApprovalDecisionPanel requestId="req-1" />);
    fireEvent.change(screen.getByTestId('approval-rationale-textarea'), {
      target: { value: '  optional but nice  ' },
    });
    fireEvent.click(screen.getByTestId('approval-approve-button'));

    await waitFor(() => expect(pushMock).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/admin/programs/approvals/req-1');
    expect(init.method).toBe('POST');
    const sent = JSON.parse(init.body as string) as {
      decision: string;
      rationale?: string;
    };
    expect(sent.decision).toBe('approved');
    expect(sent.rationale).toBe('optional but nice');
    expect(pushMock).toHaveBeenCalledWith('/admin/programs/approvals');
  });

  it('reject happy path POSTs the trimmed rationale', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ ok: true, request: { id: 'req-1' } }),
    );
    render(<ApprovalDecisionPanel requestId="req-1" />);
    fireEvent.change(screen.getByTestId('approval-rationale-textarea'), {
      target: { value: '\n  sponsor not committed  \n' },
    });
    fireEvent.click(screen.getByTestId('approval-reject-button'));

    await waitFor(() => expect(pushMock).toHaveBeenCalled());
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sent = JSON.parse(init.body as string) as {
      decision: string;
      rationale?: string;
    };
    expect(sent.decision).toBe('rejected');
    expect(sent.rationale).toBe('sponsor not committed');
  });

  it('renders an inline error on a failed POST', async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ error: 'decide_failed', detail: 'already decided' }, {
        status: 400,
      }),
    );
    render(<ApprovalDecisionPanel requestId="req-1" />);
    fireEvent.change(screen.getByTestId('approval-rationale-textarea'), {
      target: { value: 'looks good' },
    });
    fireEvent.click(screen.getByTestId('approval-approve-button'));

    expect(
      await screen.findByTestId('approval-decision-error'),
    ).toHaveTextContent(/already decided/);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('renders the decided variant when alreadyDecided=true', () => {
    render(
      <ApprovalDecisionPanel requestId="req-1" alreadyDecided />,
    );
    expect(
      screen.getByTestId('approval-decision-panel-decided'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('approval-decision-panel'),
    ).toBeNull();
  });
});
