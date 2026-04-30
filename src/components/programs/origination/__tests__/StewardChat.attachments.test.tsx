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

import { fireEvent, render, screen } from '@testing-library/react';
import { StewardChat, type ChatTurn } from '../StewardChat';
import { ATTACHMENT_MIME_ALLOWLIST } from '@/lib/programs/attachments/mime';

// next/navigation isn't relevant for render-only checks but the chat
// imports useRouter unconditionally.
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

// AgentMarkdown does its own DOM things — we don't care about its
// rendering here so a passthrough mock keeps the test focused.
jest.mock('@/lib/agent/markdownRenderer', () => ({
  AgentMarkdown: ({ text }: { text: string }) => <span data-testid="markdown">{text}</span>,
}));

const TURNS: ChatTurn[] = [
  { id: 't1', role: 'user', text: 'Hello Steward.' },
];

const COLD_OPEN_TURNS: ChatTurn[] = [
  { id: 'cold-open-production', role: 'assistant', agentName: 'Steward', text: 'Welcome.' },
];

describe('StewardChat · OV2-4b paper-clip', () => {
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
