/**
 * @jest-environment jsdom
 */

// StewardChat · OV2-4b · paper-clip affordance render tests.
//
// On /programs/new there's no committed program id yet, so the
// paper-clip is rendered as a disabled affordance — visible (so the
// founder's "don't forget the paper clip" reminder is satisfied from
// turn 1) but informational. We assert:
//
//   1. The paper-clip button is in the DOM.
//   2. It is disabled.
//   3. The hidden file input carries the canonical mime allowlist
//      `accept` attribute, ready for Wave 2 wiring.

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TextDecoder } from 'node:util';
import { useState, type ComponentProps } from 'react';
import { StewardChat, type ChatTurn } from '../StewardChat';
import { ATTACHMENT_MIME_ALLOWLIST } from '@/lib/programs/attachments/mime';

global.TextDecoder = TextDecoder as typeof global.TextDecoder;

const mockRouterPush = jest.fn();

// next/navigation isn't relevant for render-only checks but the chat
// imports useRouter unconditionally.
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush, replace: jest.fn() }),
}));

// AgentMarkdown does its own DOM things — we don't care about its
// rendering here so a passthrough mock keeps the test focused.
jest.mock('@/lib/agent/markdownRenderer', () => ({
  AgentMarkdown: ({ text }: { text: string }) => <span data-testid="markdown">{text}</span>,
}));

jest.mock('@/lib/shell/origination-handoff', () => ({
  buildHandoffMarker: (programName: string) => ({
    id: 'handoff-marker',
    role: 'agent',
    agentName: 'Steward',
    text: `Continuing from ${programName}`,
    timestamp: Date.now(),
  }),
  persistOriginationHandoff: jest.fn(),
}));

const TURNS: ChatTurn[] = [
  { id: 't1', role: 'user', text: 'Hello Steward.' },
];

const COLD_OPEN_TURNS: ChatTurn[] = [
  { id: 'cold-open-production', role: 'assistant', agentName: 'Steward', text: 'Welcome.' },
];

function StatefulStewardChat(
  props: Omit<ComponentProps<typeof StewardChat>, 'turns' | 'onTurnsChange'> & {
    initialTurns?: ChatTurn[];
  },
) {
  const { initialTurns = COLD_OPEN_TURNS, ...chatProps } = props;
  const [turns, setTurns] = useState<ChatTurn[]>(initialTurns);
  return <StewardChat {...chatProps} turns={turns} onTurnsChange={setTurns} />;
}

describe('StewardChat · OV2-4b paper-clip', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    mockRouterPush.mockClear();
  });

  it('renders a paper-clip button in the composer', () => {
    render(
      <StewardChat
        surface="/programs/new"
        tenantName="Apex Retail"
        turns={TURNS}
        onTurnsChange={() => {}}
      />,
    );
    const btn = screen.getByRole('button', { name: /attach a file/i });
    expect(btn).toBeTruthy();
  });

  it('disables the paper-clip on /programs/new (no program id yet)', () => {
    render(
      <StewardChat
        surface="/programs/new"
        tenantName="Apex Retail"
        turns={TURNS}
        onTurnsChange={() => {}}
      />,
    );
    const btn = screen.getByRole('button', { name: /attach a file/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('declares the mime allowlist on the hidden file input', () => {
    const { container } = render(
      <StewardChat
        surface="/programs/new"
        tenantName="Apex Retail"
        turns={TURNS}
        onTurnsChange={() => {}}
      />,
    );
    const input = container.querySelector(
      'input[data-component="StewardChatAttachmentInput"]',
    ) as HTMLInputElement | null;
    expect(input).not.toBeNull();
    const accept = input?.getAttribute('accept') ?? '';
    expect(accept.split(',')).toEqual(expect.arrayContaining([...ATTACHMENT_MIME_ALLOWLIST]));
  });
});

describe('StewardChat · starter prompts', () => {
  it('shows fast-start setup prompts before the first user turn', () => {
    render(
      <StewardChat
        surface="/programs/new"
        tenantName="Apex Retail"
        turns={COLD_OPEN_TURNS}
        onTurnsChange={() => {}}
      />,
    );

    expect(screen.getByLabelText('Starter prompts')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Apex ERP modernization' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Meridian prior auth' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'First Capital risk controls' })).toBeTruthy();
  });

  it('prefills the composer when a starter prompt is selected', () => {
    render(
      <StewardChat
        surface="/programs/new"
        tenantName="Apex Retail"
        turns={COLD_OPEN_TURNS}
        onTurnsChange={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Apex ERP modernization' }));

    const composer = screen.getByLabelText('Message Steward') as HTMLTextAreaElement;
    expect(composer.value).toContain('Set up a new Apex Retail program');
    expect(composer.value).toContain('Sponsor Sarah Chen');
  });

  it('hides starter prompts after the user has already sent a turn', () => {
    render(
      <StewardChat
        surface="/programs/new"
        tenantName="Apex Retail"
        turns={TURNS}
        onTurnsChange={() => {}}
      />,
    );

    expect(screen.queryByLabelText('Starter prompts')).toBeNull();
  });
});

describe('StewardChat · handoff receipt', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    mockRouterPush.mockClear();
  });

  afterEach(() => {
    delete (global as Partial<typeof globalThis>).fetch;
  });

  it('shows a handoff receipt when commit_program returns a program-created sentinel', async () => {
    const streamedChunk = Buffer.from(
      'Submitted for approval. [[program-created:APX-NEW-2026]]',
    );
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: jest
            .fn()
            .mockResolvedValueOnce({ done: false, value: streamedChunk })
            .mockResolvedValueOnce({ done: true, value: undefined }),
        }),
      },
    } as unknown as Response);

    render(
      <StatefulStewardChat
        surface="/programs/new"
        tenantName="Apex Retail"
        programName="Apex ERP Modernization"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Apex ERP modernization' }));

    const composer = screen.getByLabelText('Message Steward') as HTMLTextAreaElement;
    await waitFor(() => {
      expect(composer.value).toContain('Set up a new Apex Retail program');
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByLabelText('Program handoff receipt')).toBeTruthy();
    });
    expect(screen.getByText('Submitted for approval')).toBeTruthy();
    expect(screen.getByText(/Opening Apex ERP Modernization at/)).toBeTruthy();
    expect(screen.getByText(/\/programs\/APX-NEW-2026/)).toBeTruthy();
  });
});
