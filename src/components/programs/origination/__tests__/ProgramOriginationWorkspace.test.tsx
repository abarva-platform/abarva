/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import {
  EMPTY_BRIEF_STATE,
  ProgramOriginationWorkspace,
  buildOperatorChecklist,
} from '../ProgramOriginationWorkspace';

jest.mock('../StewardChat', () => ({
  StewardChat: ({ turns }: { turns: Array<{ text: string }> }) => (
    <section aria-label="Mock Steward chat">
      {turns.map((turn, index) => (
        <p key={`${turn.text}-${index}`}>{turn.text}</p>
      ))}
    </section>
  ),
}));

describe('ProgramOriginationWorkspace', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
    } as Response);
    window.sessionStorage.clear();
  });

  afterEach(() => {
    delete (global as Partial<typeof globalThis>).fetch;
  });

  it('shows the active tenant in the new-program header', async () => {
    render(
      <ProgramOriginationWorkspace
        surface="/programs/new"
        tenantName="Apex Retail Group"
        initialTurns={[
          {
            id: 'cold-open-production',
            role: 'assistant',
            agentName: 'Steward',
            text: 'Welcome.',
          },
        ]}
      />,
    );

    expect(screen.getByLabelText('Active tenant').textContent).toContain(
      'Tenant · Apex Retail Group',
    );
    expect(screen.getByLabelText('New program setup checklist')).toBeTruthy();
    expect(screen.getByText('Tenant confirmed')).toBeTruthy();
    expect(screen.getByText('Setup conversation')).toBeTruthy();
    expect(screen.getByText('Brief ready')).toBeTruthy();
    expect(screen.getByText('Submit for approval')).toBeTruthy();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });

  it('does not hydrate a stale origination draft from a previous page session', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        draft: {
          state: {
            sessionId: 'previous-session',
            turns: [{ id: 'old-turn', role: 'user', text: 'Previous conversation' }],
          },
        },
      }),
    } as Response);
    window.sessionStorage.setItem(
      'abarva.program_origination.session:/programs/new',
      'previous-session',
    );

    render(
      <ProgramOriginationWorkspace
        surface="/programs/new"
        tenantName="Apex Retail Group"
        initialTurns={[
          {
            id: 'cold-open-production',
            role: 'assistant',
            agentName: 'Steward',
            text: 'Welcome.',
          },
        ]}
      />,
    );

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    expect(screen.getByText('Welcome.')).toBeTruthy();
    expect(screen.queryByText('Previous conversation')).toBeNull();
    expect(window.sessionStorage.getItem('abarva.program_origination.session:/programs/new')).not.toBe(
      'previous-session',
    );
  });
});

describe('buildOperatorChecklist', () => {
  it('marks tenant as done and conversation as active before the first user turn', () => {
    const checklist = buildOperatorChecklist({
      tenantName: 'Apex Retail Group',
      turns: [{ id: 'cold-open', role: 'assistant', agentName: 'Steward', text: 'Welcome.' }],
      briefState: EMPTY_BRIEF_STATE,
    });

    expect(checklist.map((item) => [item.id, item.status])).toEqual([
      ['tenant', 'done'],
      ['conversation', 'active'],
      ['brief', 'pending'],
      ['submit', 'pending'],
    ]);
  });

  it('marks the brief as active once setup fields start filling in', () => {
    const checklist = buildOperatorChecklist({
      tenantName: 'Apex Retail Group',
      turns: [{ id: 't1', role: 'user', text: 'Set up ERP modernization.' }],
      briefState: {
        ...EMPTY_BRIEF_STATE,
        brief: {
          ...EMPTY_BRIEF_STATE.brief,
          programName: 'Apex ERP Modernization',
          problemStatement: 'Close is too slow.',
        },
      },
    });

    expect(checklist.map((item) => [item.id, item.status])).toEqual([
      ['tenant', 'done'],
      ['conversation', 'done'],
      ['brief', 'active'],
      ['submit', 'pending'],
    ]);
  });

  it('moves submit to active when the minimum setup brief is ready', () => {
    const checklist = buildOperatorChecklist({
      tenantName: 'Apex Retail Group',
      turns: [{ id: 't1', role: 'user', text: 'Set up ERP modernization.' }],
      briefState: {
        ...EMPTY_BRIEF_STATE,
        brief: {
          ...EMPTY_BRIEF_STATE.brief,
          programName: 'Apex ERP Modernization',
          problemStatement: 'Close is too slow.',
          targetOutcome: 'Reduce close cycle time.',
          sponsor: 'Sarah Chen',
          lead: 'Mei Tanaka',
          classification: 'ERP Modernization',
        },
      },
    });

    expect(checklist.map((item) => [item.id, item.status])).toEqual([
      ['tenant', 'done'],
      ['conversation', 'done'],
      ['brief', 'done'],
      ['submit', 'active'],
    ]);
  });
});
