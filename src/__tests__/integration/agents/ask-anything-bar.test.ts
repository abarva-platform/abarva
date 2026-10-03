/**
 * @jest-environment jsdom
 */

// AskAnythingBar — the viewport-fixed bottom composer on agent surfaces.
//
// T-495: this suite used to read AskAnythingBar.tsx and
// ProgramCanonicalDetail.tsx as TEXT and grep them for literals
// ("event.key === 'Enter'", "MAX_HEIGHT_PX", "Live ask deferred", a palette
// hex). Half of those literals had left the component while the behaviour
// they named was still there, so the suite was red for no product reason,
// and the other half would have stayed green over a broken composer. Every
// case below RENDERS the component and drives it the way a user does.
// Rationale and mutation record:
// docs/architecture/t495-ask-anything-bar-triage.json.

import { createElement } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { AskAnythingBar, type AskAnythingAgent } from '@/components/agent/AskAnythingBar';
import { ProgramCanonicalDetail } from '@/components/programs/ProgramCanonicalDetail';
import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';
import { buildNexusProgramWorkbenchView } from '@/lib/programs/nexus-program-workbench-view';

// ── Seams ────────────────────────────────────────────────────────────────
// The bar talks to the model only through two hooks: the shared Atlas page
// state when AppShell provides one, else its own useAgentStream. Both are
// replaced with recorders, so a case can see exactly what the bar sent.

type PageState = {
  ask: jest.Mock;
  currentResponse: string;
  currentResponseParts: unknown[];
  currentAgentAnswer: unknown;
  isStreaming: boolean;
  error: string | null;
  clearResponse: jest.Mock;
};

let mockPageState: PageState | null = null;
const mockLocalAsk = jest.fn();
const mockLocalClear = jest.fn();
const mockUseAgentStream = jest.fn();
let mockLocalStreaming = false;

jest.mock('@/components/shell/AtlasPageStateProvider', () => ({
  useAtlasPageState: () => mockPageState,
}));

jest.mock('@/hooks/useAgentStream', () => ({
  useAgentStream: (opts: unknown) => {
    mockUseAgentStream(opts);
    return {
      ask: mockLocalAsk,
      response: '',
      isStreaming: mockLocalStreaming,
      error: null,
      clear: mockLocalClear,
    };
  },
}));

jest.mock('@/components/programs/attachments/usePendingAttachments', () => ({
  usePendingAttachments: () => ({
    count: 0,
    items: [],
    isUploading: false,
    addFiles: jest.fn(),
    uploadAll: jest.fn(),
    clearUploaded: jest.fn(),
    removeAttachment: jest.fn(),
    retry: jest.fn(),
  }),
}));

function pageState(overrides: Partial<PageState> = {}): PageState {
  return {
    ask: jest.fn(),
    currentResponse: '',
    currentResponseParts: [],
    currentAgentAnswer: null,
    isStreaming: false,
    error: null,
    clearResponse: jest.fn(),
    ...overrides,
  };
}

function renderBar(props: Partial<Parameters<typeof AskAnythingBar>[0]> = {}) {
  return render(
    createElement(AskAnythingBar, {
      agent: 'nexus',
      scopeLabel: 'PRG-1 · P3 Design',
      ...props,
    }),
  );
}

function composer(): HTMLTextAreaElement {
  return screen.getByRole('textbox') as HTMLTextAreaElement;
}

function sendButton(): HTMLButtonElement {
  return screen.getByRole('button', { name: 'Send' }) as HTMLButtonElement;
}

let fetchSpy: jest.Mock;

beforeEach(() => {
  mockPageState = pageState();
  mockLocalStreaming = false;
  mockLocalAsk.mockReset();
  mockLocalClear.mockReset();
  mockUseAgentStream.mockReset();
  // The component itself must never reach the network; the stream hook is
  // the only path to a model. A throwing fetch makes any direct call loud.
  fetchSpy = jest.fn(() => {
    throw new Error('AskAnythingBar must not call fetch directly');
  });
  (globalThis as { fetch?: unknown }).fetch = fetchSpy;
});

afterEach(() => {
  cleanup();
});

// ── Composer behaviour ───────────────────────────────────────────────────

describe('AskAnythingBar · Enter sends, Shift+Enter does not', () => {
  it('Enter sends the trimmed text once through the shared page state, clears the composer and prevents the newline', () => {
    renderBar();
    fireEvent.change(composer(), { target: { value: '  What is at risk in P3?  ' } });

    const notPrevented = fireEvent.keyDown(composer(), { key: 'Enter' });

    expect(notPrevented).toBe(false);
    expect(mockPageState!.ask).toHaveBeenCalledTimes(1);
    expect(mockPageState!.ask).toHaveBeenCalledWith('What is at risk in P3?', undefined, undefined);
    expect(mockPageState!.clearResponse).toHaveBeenCalledTimes(1);
    expect(composer().value).toBe('');
    expect(mockLocalAsk).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('Shift+Enter neither sends nor prevents the default, so the textarea takes the newline', () => {
    renderBar();
    fireEvent.change(composer(), { target: { value: 'line one' } });

    const notPrevented = fireEvent.keyDown(composer(), { key: 'Enter', shiftKey: true });

    expect(notPrevented).toBe(true);
    expect(mockPageState!.ask).not.toHaveBeenCalled();
    expect(composer().value).toBe('line one');
  });

  it('a key other than Enter does not send', () => {
    renderBar();
    fireEvent.change(composer(), { target: { value: 'hello' } });
    fireEvent.keyDown(composer(), { key: 'a' });
    expect(mockPageState!.ask).not.toHaveBeenCalled();
  });

  it('whitespace-only text is never sent, by Enter or by the Send button', () => {
    renderBar();
    fireEvent.change(composer(), { target: { value: '   \n  ' } });
    fireEvent.keyDown(composer(), { key: 'Enter' });
    fireEvent.click(sendButton());
    expect(mockPageState!.ask).not.toHaveBeenCalled();
    expect(sendButton().disabled).toBe(true);
  });

  it('nothing is sent while a response is still streaming', () => {
    mockPageState = pageState({ isStreaming: true });
    renderBar();
    fireEvent.change(composer(), { target: { value: 'second question' } });
    fireEvent.keyDown(composer(), { key: 'Enter' });
    fireEvent.click(sendButton());
    expect(mockPageState.ask).not.toHaveBeenCalled();
    expect(sendButton().disabled).toBe(true);
  });
});

describe('AskAnythingBar · the Send button is live, and enabled only when there is something to send', () => {
  it('is disabled when empty, enabled once text is typed, and sends on click', () => {
    renderBar();
    expect(sendButton().disabled).toBe(true);

    fireEvent.change(composer(), { target: { value: 'Summarise the gate' } });
    expect(sendButton().disabled).toBe(false);

    fireEvent.click(sendButton());
    expect(mockPageState!.ask).toHaveBeenCalledWith('Summarise the gate', undefined, undefined);
    expect(sendButton().disabled).toBe(true);
  });
});

describe('AskAnythingBar · without an AppShell page state it falls back to its own stream', () => {
  it('sends through useAgentStream, bound to the surface, program and displayed agent name', () => {
    mockPageState = null;
    renderBar({ agent: 'sentinel', surface: 'programs-detail', programId: 'prog-42' });

    expect(mockUseAgentStream).toHaveBeenCalledWith({
      surface: 'programs-detail',
      programId: 'prog-42',
      agentName: 'Ava',
    });

    fireEvent.change(composer(), { target: { value: 'Any evidence gaps?' } });
    fireEvent.keyDown(composer(), { key: 'Enter' });

    expect(mockLocalAsk).toHaveBeenCalledTimes(1);
    expect(mockLocalAsk).toHaveBeenCalledWith('Any evidence gaps?');
    expect(mockLocalClear).toHaveBeenCalledTimes(1);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('with no surface given, the stream is scoped to the agent key', () => {
    mockPageState = null;
    renderBar({ agent: 'atlas' });
    expect(mockUseAgentStream).toHaveBeenCalledWith(
      expect.objectContaining({ surface: 'atlas', agentName: 'Ava' }),
    );
  });

  it('while its own stream is responding, nothing is sent', () => {
    mockPageState = null;
    mockLocalStreaming = true;
    renderBar();
    fireEvent.change(composer(), { target: { value: 'again' } });
    fireEvent.keyDown(composer(), { key: 'Enter' });
    expect(mockLocalAsk).not.toHaveBeenCalled();
  });
});

describe('AskAnythingBar · the textarea grows with its content up to a ceiling, then scrolls', () => {
  function setScrollHeight(el: HTMLElement, px: number) {
    Object.defineProperty(el, 'scrollHeight', { configurable: true, get: () => px });
  }

  it('takes the content height below the ceiling', () => {
    renderBar();
    setScrollHeight(composer(), 72);
    fireEvent.change(composer(), { target: { value: 'a\nb\nc' } });
    expect(composer().style.height).toBe('72px');
  });

  it('stops at the ceiling for long content, and the ceiling is the textarea max-height', () => {
    renderBar();
    setScrollHeight(composer(), 900);
    fireEvent.change(composer(), { target: { value: 'x'.repeat(4000) } });
    expect(composer().style.height).toBe('180px');
    expect(composer().style.maxHeight).toBe('180px');
  });

  it('collapses back after a send', () => {
    renderBar();
    setScrollHeight(composer(), 120);
    fireEvent.change(composer(), { target: { value: 'grown' } });
    expect(composer().style.height).toBe('120px');
    fireEvent.keyDown(composer(), { key: 'Enter' });
    expect(composer().style.height).toBe('auto');
  });
});

describe('AskAnythingBar · what it renders', () => {
  it('is a spell-checked, labelled textarea with the default placeholder', () => {
    renderBar();
    const ta = composer();
    expect(ta.tagName).toBe('TEXTAREA');
    expect(ta.getAttribute('spellcheck')).toBe('true');
    expect(ta.getAttribute('aria-label')).toBe('Ask Ava');
    expect(ta.getAttribute('placeholder')).toBe('Ask Ava anything…');
  });

  it('uses a supplied placeholder instead of the default', () => {
    renderBar({ placeholder: 'Ask about this contract' });
    expect(composer().getAttribute('placeholder')).toBe('Ask about this contract');
  });

  it('is fixed to the bottom of the viewport, above page content', () => {
    const { container } = renderBar();
    const root = container.querySelector('[data-component="AskAnythingBar"]') as HTMLElement;
    expect(root).not.toBeNull();
    expect(root.style.position).toBe('fixed');
    expect(root.style.bottom).toBe('0px');
    expect(root.style.zIndex).toBe('50');
  });

  const agents: AskAnythingAgent[] = ['nexus', 'sentinel', 'atlas', 'steward'];
  it.each(agents)('for agent %s the eyebrow reads "Ask Ava" scoped to the surface label', (agent) => {
    const { container } = renderBar({ agent, scopeLabel: `scope-for-${agent}` });
    const root = container.querySelector('[data-component="AskAnythingBar"]') as HTMLElement;
    expect(root.getAttribute('data-agent')).toBe(agent);
    expect(screen.getByText('Ask Ava')).toBeTruthy();
    expect(screen.getByText(`· scope-for-${agent}`)).toBeTruthy();
  });

  it('opens no response panel before a send, even when the page state holds a response', () => {
    mockPageState = pageState({ currentResponse: 'Three gates are open.' });
    renderBar();
    expect(screen.queryByText('Three gates are open.')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Dismiss response' })).toBeNull();
  });

  it('shows the response in a panel after a send, and dismissing it clears the response and closes the panel', () => {
    mockPageState = pageState({ currentResponse: 'Three gates are open.' });
    renderBar();
    fireEvent.change(composer(), { target: { value: 'q' } });
    fireEvent.keyDown(composer(), { key: 'Enter' });
    expect(screen.getByText('Three gates are open.')).toBeTruthy();
    expect(mockPageState.clearResponse).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss response' }));
    expect(mockPageState.clearResponse).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('Three gates are open.')).toBeNull();
  });
});

// ── Program detail mount ─────────────────────────────────────────────────

describe('AskAnythingBar · mounted on the canonical Program detail page', () => {
  const plan = buildAllProgramsSeedPlan();
  const tenant = plan.tenants.find((t) => t.programs.length > 0)!;
  const program = tenant.programs[0];

  it('the page renders exactly one bar, bound to Nexus, scoped to program code and phase', () => {
    expect(tenant).toBeDefined();
    const { container } = render(createElement(ProgramCanonicalDetail, { tenant, program }));

    const bars = container.querySelectorAll('[data-component="AskAnythingBar"]');
    expect(bars).toHaveLength(1);
    expect(bars[0].getAttribute('data-agent')).toBe('nexus');

    const phaseLabel = buildNexusProgramWorkbenchView({
      programCode: program.code,
      programName: program.name,
      tenantLabel: tenant.displayName,
      currentPhaseSpec: program.currentPhaseSpec,
      deliverableCount: program.deliverables.length,
      evidenceBackedDeliverables: program.deliverables.filter((d) => d.renderTier === 'rich').length,
    }).contextStrip.phaseLabel;
    expect(bars[0].textContent).toContain(`· ${program.code} · ${phaseLabel}`);
  });

  it('the page reserves bottom padding so the fixed bar does not cover its footer', () => {
    const { container } = render(createElement(ProgramCanonicalDetail, { tenant, program }));
    const main = container.querySelector('main') as HTMLElement;
    const content = main.firstElementChild as HTMLElement;
    expect(content.contains(container.querySelector('footer'))).toBe(true);
    expect(content.style.paddingBottom).toBe('160px');
  });
});
