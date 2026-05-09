/**
 * @jest-environment jsdom
 */

// StrategicMoveDetailClient · component tests
//
// Covers the Move detail migration to <AgentDock>:
//   - Mounts AgentDock as the surface shell (paperclip composer, mode
//     picker, suggested chips, surface key 'moves/detail').
//   - Right pane (workspace) renders inside the dock.
//   - Send threads moveId + programId through to /api/chat/agent.
//   - Suggested chips (gate-blocking) pre-fill the composer, not auto-send.

import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';

// Build a minimal Response.body shim — a getReader() that yields one
// chunk and ends. jsdom doesn't ship ReadableStream / TextEncoder so we
// fake the streaming reader contract directly.
function makeMockBody(text: string) {
  const bytes = new Uint8Array(Array.from(text).map((c) => c.charCodeAt(0)));
  let yielded = false;
  return {
    getReader() {
      return {
        async read() {
          if (yielded) return { done: true, value: undefined as Uint8Array | undefined };
          yielded = true;
          return { done: false, value: bytes };
        },
      };
    },
  };
}

import { StrategicMoveDetailClient } from '../StrategicMoveDetailClient';
import type { StrategicMove } from '@/lib/programs/types.ui';

function makeMove(overrides: Partial<StrategicMove> = {}): StrategicMove {
  const base: StrategicMove = {
    id: 'apx-cdp-2026',
    displayCode: 'APX-CDP-2026',
    name: 'Customer Data Platform',
    archetype: 'PROGRAM_CDP',
    tenant: { id: 'tenant-uuid-apex', name: 'Apex Retail', industryCode: 'retail' },
    currentPhase: 2,
    phaseLabel: 'P2 Discover & Diagnose',
    status: {
      key: 'gate_blocked',
      text: 'Gate blocked',
      description: 'Stakeholder map missing one named owner',
    },
    statusColor: 'amber',
    sponsor: { id: 'p-1', name: 'Maya Chen', role: 'cmo' },
    participants: [],
    valueAtStake: { projected: null, verified: null, assumptions: null },
    deliverables: [],
    gateCriteria: [],
    recentActivity: [],
    linkedEvidence: [],
    mapLabel: 'CDP',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
  };
  return { ...base, ...overrides };
}

beforeEach(() => {
  window.localStorage.clear();
  (global as { fetch: unknown }).fetch = undefined;
});

describe('StrategicMoveDetailClient', () => {
  it('renders the workspace inside the AgentDock side rail', () => {
    render(
      <StrategicMoveDetailClient
        move={makeMove()}
        workspace={<div data-testid="ws">workspace content</div>}
      />,
    );
    // AgentDock is mounted (paperclip, send button, mode picker present).
    expect(screen.getByTestId('agent-dock-attach')).toBeInTheDocument();
    expect(screen.getByTestId('agent-dock-send')).toBeInTheDocument();
    expect(screen.getByTestId('agent-dock-mode-picker')).toBeInTheDocument();
    // Workspace child renders.
    expect(screen.getByTestId('ws')).toBeInTheDocument();
  });

  it('seeds the thread with two Nexus turns scoped to the move', () => {
    render(
      <StrategicMoveDetailClient
        move={makeMove()}
        workspace={<div />}
      />,
    );
    const turns = screen.getAllByTestId('agent-dock-turn-agent');
    expect(turns.length).toBeGreaterThanOrEqual(2);
    expect(turns[0].textContent).toMatch(/APX-CDP-2026/);
    expect(turns[0].textContent).toMatch(/P2 Discover/);
  });

  it('exposes the gate-blocking suggested actions', () => {
    render(
      <StrategicMoveDetailClient
        move={makeMove()}
        workspace={<div />}
      />,
    );
    expect(screen.getByTestId('agent-dock-suggestion-gate-missing')).toHaveTextContent(
      'Show me what is still missing for this gate.',
    );
    expect(screen.getByTestId('agent-dock-suggestion-gate-blocking')).toHaveTextContent(
      "What's blocking the gate?",
    );
  });

  it('pre-fills (does not auto-send) when a suggested action chip is clicked', async () => {
    const fetchMock = jest.fn();
    (global as { fetch: unknown }).fetch = fetchMock;

    render(
      <StrategicMoveDetailClient
        move={makeMove()}
        workspace={<div />}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('agent-dock-suggestion-gate-blocking'));
    });

    const input = screen.getByTestId('agent-dock-input') as HTMLTextAreaElement;
    expect(input.value).toBe("What's blocking the gate?");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('threads moveId, programId, and surfaceContext to /api/chat/agent on send', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: makeMockBody('hello there'),
    });
    (global as { fetch: unknown }).fetch = fetchMock;

    render(
      <StrategicMoveDetailClient
        move={makeMove()}
        workspace={<div />}
      />,
    );

    const input = screen.getByTestId('agent-dock-input') as HTMLTextAreaElement;
    await act(async () => {
      fireEvent.change(input, { target: { value: 'why is the gate blocked?' } });
    });

    await act(async () => {
      fireEvent.submit(screen.getByTestId('agent-dock-form'));
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/chat/agent',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
    const body = JSON.parse(
      (fetchMock.mock.calls[0][1] as { body: string }).body,
    ) as {
      message: string;
      tenantName: string;
      agentName: string;
      surface: string;
      surfaceContext: Record<string, unknown>;
    };
    expect(body.agentName).toBe('Nexus');
    expect(body.surface).toBe('programs-detail');
    expect(body.tenantName).toBe('Apex Retail');
    expect(body.message).toBe('why is the gate blocked?');
    expect(body.surfaceContext.programId).toBe('apx-cdp-2026');
    expect(body.surfaceContext.moveId).toBe('apx-cdp-2026');
    expect(body.surfaceContext.moveCode).toBe('APX-CDP-2026');
    expect(body.surfaceContext.currentPhase).toBe(2);
  });

  it('persists the dock surface key as moves/detail', () => {
    render(
      <StrategicMoveDetailClient
        move={makeMove()}
        workspace={<div />}
      />,
    );
    const panel = screen.getByTestId('agent-dock-panel');
    // Default mode is side-rail; mode is persisted under
    // abarva.agent-dock.moves/detail.mode after a switch.
    expect(panel).toHaveAttribute('data-mode', 'side-rail');
    act(() => {
      fireEvent.click(screen.getByTestId('agent-dock-mode-pin-bottom'));
    });
    expect(window.localStorage.getItem('abarva.agent-dock.moves/detail.mode')).toBe(
      'pin-bottom',
    );
  });
});
