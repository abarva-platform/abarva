/**
 * @jest-environment jsdom
 */

// AgentDock · component tests for the foundation behavior.
//
// Coverage:
//   - Renders in side-rail mode by default
//   - Mode picker switches modes and persists in localStorage
//   - Composer auto-grows on input
//   - Enter submits, Shift+Enter inserts newline
//   - Send button disabled while upload pending
//   - Drag-drop highlights panel
//   - Removing a chip removes the attachment from the next submit
//
// We mock global.fetch for the upload POST so the test environment
// doesn't try to actually hit the route handler.

import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, within } from '@testing-library/react';

import {
  AgentDock,
  AGENT_DOCK_MIME_ALLOWLIST,
  modeStorageKey,
  splitStorageKey,
  type AttachmentRef,
  type ChatMessage,
} from '../AgentDock';

const SURFACE = 'test/agent-dock';

const AGENT = {
  initials: 'S',
  name: 'Sentinel',
  role: 'Drafts artifacts, surfaces evidence, flags gaps before they cost you.',
};

function makeFile(name: string, mime: string, body = 'hello'): File {
  return new File([body], name, { type: mime });
}

function setupFetchMock(
  result: AttachmentRef | { error: string },
  status = 200,
): jest.Mock {
  const mock = jest.fn().mockImplementation(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => result,
  }));
  (global as { fetch: unknown }).fetch = mock;
  return mock;
}

beforeEach(() => {
  window.localStorage.clear();
  (global as { fetch: unknown }).fetch = undefined;
});

describe('AgentDock · default mode', () => {
  it('renders in side-rail mode when no preference is stored', () => {
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );
    expect(screen.getByTestId('agent-dock-panel')).toHaveAttribute('data-mode', 'side-rail');
    expect(screen.getByTestId('workspace')).toBeInTheDocument();
  });

  it('honours an explicit defaultMode when no stored preference', () => {
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        defaultMode="pin-bottom"
        thread={[]}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );
    expect(screen.getByTestId('agent-dock-panel')).toHaveAttribute('data-mode', 'pin-bottom');
    expect(screen.getByTestId('agent-dock-pin-bottom')).toBeInTheDocument();
  });

  it('reads a stored mode preference', () => {
    window.localStorage.setItem(modeStorageKey(SURFACE), 'expand');
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );
    expect(screen.getByTestId('agent-dock-expand-overlay')).toBeInTheDocument();
  });
});

describe('AgentDock · mode picker', () => {
  it('switches modes and persists each choice', () => {
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );

    fireEvent.click(screen.getByTestId('agent-dock-mode-pin-bottom'));
    expect(window.localStorage.getItem(modeStorageKey(SURFACE))).toBe('pin-bottom');
    expect(screen.getByTestId('agent-dock-panel')).toHaveAttribute('data-mode', 'pin-bottom');

    fireEvent.click(screen.getByTestId('agent-dock-mode-pin-top'));
    expect(window.localStorage.getItem(modeStorageKey(SURFACE))).toBe('pin-top');

    fireEvent.click(screen.getByTestId('agent-dock-mode-expand'));
    expect(window.localStorage.getItem(modeStorageKey(SURFACE))).toBe('expand');
    expect(screen.getByTestId('agent-dock-expand-overlay')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('agent-dock-mode-collapsed'));
    expect(window.localStorage.getItem(modeStorageKey(SURFACE))).toBe('collapsed');
    expect(screen.getByTestId('agent-dock-collapsed-chip')).toBeInTheDocument();
  });

  it('uses a per-surface localStorage key', () => {
    expect(modeStorageKey('source/new')).toBe('abarva.agent-dock.source/new.mode');
    expect(splitStorageKey('source/new')).toBe('abarva.agent-dock.source/new.split');
  });
});

describe('AgentDock · composer', () => {
  it('auto-grows the textarea on input', () => {
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );
    const ta = screen.getByTestId('agent-dock-input') as HTMLTextAreaElement;
    // Stub scrollHeight so the auto-grow path can pick a non-trivial size.
    Object.defineProperty(ta, 'scrollHeight', { value: 80, configurable: true });
    fireEvent.change(ta, { target: { value: 'one\ntwo\nthree' } });
    expect(ta.style.height).toBe('80px');
  });

  it('submits on Enter and inserts newline on Shift+Enter', async () => {
    const onMessage = jest.fn().mockResolvedValue(undefined);
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={onMessage}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );
    const ta = screen.getByTestId('agent-dock-input') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: 'hello' } });

    // Shift+Enter — onMessage should NOT fire
    fireEvent.keyDown(ta, { key: 'Enter', shiftKey: true });
    expect(onMessage).not.toHaveBeenCalled();

    // Enter — submits
    await act(async () => {
      fireEvent.keyDown(ta, { key: 'Enter', shiftKey: false });
    });
    expect(onMessage).toHaveBeenCalledWith('hello', []);
  });

  it('disables Send when there is no draft and no attachment', () => {
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );
    const send = screen.getByTestId('agent-dock-send') as HTMLButtonElement;
    expect(send).toBeDisabled();
    const ta = screen.getByTestId('agent-dock-input') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: 'hi' } });
    expect(send).not.toBeDisabled();
  });
});

describe('AgentDock · attachments', () => {
  it('disables Send while an upload is pending and re-enables on success', async () => {
    let resolveFetch: (value: { ok: boolean; status: number; json: () => Promise<AttachmentRef> }) => void = () => {};
    const fetchMock = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );
    (global as { fetch: unknown }).fetch = fetchMock;

    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );

    const fileInput = screen.getByTestId('agent-dock-file-input') as HTMLInputElement;
    const file = makeFile('a.txt', 'text/plain');

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    // Send should be disabled while uploading.
    const send = screen.getByTestId('agent-dock-send') as HTMLButtonElement;
    expect(send).toBeDisabled();
    expect(screen.getByTestId('agent-dock-chips')).toBeInTheDocument();

    // Resolve the upload — chip flips to done, Send re-enables.
    await act(async () => {
      resolveFetch({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'att-1',
          file_name: 'a.txt',
          mime: 'text/plain',
          bytes: 5,
          storage_path: 'tenant/u/att-1-a.txt',
          extracted_text_preview: 'hello',
        }),
      });
    });

    expect(send).not.toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('removing a chip drops the ref from the next submit', async () => {
    setupFetchMock({
      id: 'att-2',
      file_name: 'b.txt',
      mime: 'text/plain',
      bytes: 5,
      storage_path: 'tenant/u/att-2-b.txt',
      extracted_text_preview: 'hello',
    });

    const onMessage = jest.fn().mockResolvedValue(undefined);
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={onMessage}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );
    const fileInput = screen.getByTestId('agent-dock-file-input') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [makeFile('b.txt', 'text/plain')] } });
    });

    // Now the chip is done — find the remove button via testid prefix.
    const chips = screen.getByTestId('agent-dock-chips');
    const removeBtn = within(chips).getAllByRole('button')[0];
    fireEvent.click(removeBtn);
    expect(screen.queryByTestId('agent-dock-chips')).not.toBeInTheDocument();

    // Type something and submit — the attachment list passed to onMessage is empty.
    const ta = screen.getByTestId('agent-dock-input') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: 'go' } });
    await act(async () => {
      fireEvent.keyDown(ta, { key: 'Enter', shiftKey: false });
    });
    expect(onMessage).toHaveBeenCalledWith('go', []);
  });

  it('exposes the same MIME allowlist as the API contract', () => {
    expect(AGENT_DOCK_MIME_ALLOWLIST).toContain('application/pdf');
    expect(AGENT_DOCK_MIME_ALLOWLIST).toContain('image/png');
    expect(AGENT_DOCK_MIME_ALLOWLIST).toContain('image/jpeg');
    expect(AGENT_DOCK_MIME_ALLOWLIST).not.toContain('application/x-msdownload');
  });

  it('skips files with an unsupported mime type', async () => {
    const fetchMock = jest.fn();
    (global as { fetch: unknown }).fetch = fetchMock;
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );
    const fileInput = screen.getByTestId('agent-dock-file-input') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, {
        target: { files: [makeFile('x.exe', 'application/x-msdownload')] },
      });
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId('agent-dock-chips')).not.toBeInTheDocument();
  });
});

describe('AgentDock · drag-drop', () => {
  it('highlights the panel on dragover', () => {
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );
    const panel = screen.getByTestId('agent-dock-panel');
    expect(panel).toHaveAttribute('data-dragging', 'false');
    fireEvent.dragOver(panel);
    expect(panel).toHaveAttribute('data-dragging', 'true');
    fireEvent.dragLeave(panel);
    expect(panel).toHaveAttribute('data-dragging', 'false');
  });
});

describe('AgentDock · thread render', () => {
  it('renders thread turns in order with role data attribute', () => {
    const thread: ChatMessage[] = [
      { id: 'a', role: 'agent', body: 'Hello.' },
      { id: 'b', role: 'user', body: 'Hi.' },
    ];
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={thread}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );
    const turns = screen.getAllByTestId(/agent-dock-turn-/);
    expect(turns).toHaveLength(2);
    expect(turns[0]).toHaveAttribute('data-testid', 'agent-dock-turn-agent');
    expect(turns[1]).toHaveAttribute('data-testid', 'agent-dock-turn-user');
  });
});

describe('AgentDock · viewport-bound side-rail', () => {
  // Regression: prior to this fix, side-rail dock height was inherited from
  // its parent flex pane. On surfaces whose document scrolled (e.g.
  // /source/new with 1587px doc height vs 827px viewport), the composer
  // ended up below the fold. The shell now self-imposes
  //   height: calc(100vh - var(--agent-dock-top-offset, 64px))
  // so the dock stays viewport-bounded irrespective of workspace height.

  it('renders the dock inside a viewport-bound shell with explicit height', () => {
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={jest.fn()}
        workspace={
          <div data-testid="tall-workspace" style={{ height: 3000 }}>
            tall content
          </div>
        }
      />,
    );

    const shell = screen.getByTestId('agent-dock-side-rail-shell');
    expect(shell).toBeInTheDocument();

    // jsdom doesn't compute layout, so we assert on the inline style
    // contract. The shell MUST set an explicit, viewport-relative height
    // via calc() — never `100%`. That is the load-bearing invariant; if
    // someone removes it, the bug returns.
    const height = shell.style.height;
    const maxHeight = shell.style.maxHeight;
    expect(height).toMatch(/calc\(100vh/);
    expect(height).toContain('var(--agent-dock-top-offset');
    // dvh fallback for mobile address-bar collapse.
    expect(maxHeight).toMatch(/calc\(100dvh/);
  });

  it('does not depend on parent flex height — dock height is self-imposed', () => {
    // Render the dock inside a deliberately mis-sized parent. Pre-fix,
    // dock height tracked parent. Post-fix, dock has its own height.
    render(
      <div style={{ height: 5000 }}>
        <AgentDock
          agent={AGENT}
          surface={SURFACE}
          thread={[]}
          onMessage={jest.fn()}
          workspace={<div style={{ height: 5000 }}>tall</div>}
        />
      </div>,
    );

    const shell = screen.getByTestId('agent-dock-side-rail-shell');
    // Height comes from the calc() expression, NOT from `100%`.
    expect(shell.style.height.startsWith('calc(')).toBe(true);
    expect(shell.style.height).not.toBe('100%');
  });

  it('keeps the panel and composer using a single chat-panel background', () => {
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[{ id: 'a', role: 'agent', body: 'Hi.' }]}
        onMessage={jest.fn()}
        workspace={<div>w</div>}
      />,
    );
    const panel = screen.getByTestId('agent-dock-panel');
    const thread = screen.getByTestId('agent-dock-thread');
    const form = screen.getByTestId('agent-dock-form');

    // Panel, thread, and composer all read from CANVAS.CHAT_BG. Tokens
    // resolve to `rgb(253, 251, 247)` in jsdom. They must match — the
    // user explicitly flagged background striping.
    const expected = 'rgb(253, 251, 247)';
    expect(panel.style.background).toBe(expected);
    expect(thread.style.background).toBe(expected);
    expect(form.style.background).toBe(expected);
  });

  it('drops the legacy sticky-bottom on the composer (handled by flex-column now)', () => {
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={jest.fn()}
        workspace={<div>w</div>}
      />,
    );
    const form = screen.getByTestId('agent-dock-form');
    // Should NOT carry position:sticky any longer.
    expect(form.style.position).not.toBe('sticky');
  });
});
