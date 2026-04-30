/**
 * @jest-environment jsdom
 */

/**
 * AgentCanvas · CB-7 verification
 *
 * Locks the contract that the Context Assembled rail (panel + 4-mode
 * toggle) actually mounts on Programs surfaces — closing PR #1277's
 * DEFECT-A. Coverage:
 *
 *   - Programs surface (`/programs/<id>`) renders the rail tab strip
 *     with Reasoning + Context tabs.
 *   - Non-Programs surface (`/intelligence`) does NOT render the rail
 *     tab strip; the legacy single-purpose right rail stands.
 *   - Context tab passes `latestContextBundle` through to the panel.
 *   - Context tab renders the cold-start state when no bundle.
 *   - Mode-toggle clicks call `setContextBundleMode`.
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { AgentCanvas } from '../AgentCanvas';
import type {
  AtlasPageContextValue,
  ChatTurn,
} from '@/lib/shell/atlas-page-state';
import type { ContextBundle } from '@/lib/knowledge/context-broker';

// AtlasDrawer pulls in next/navigation and the agent-stream hook; we
// stub the entire embedded chat with a minimal placeholder so this test
// can stay focused on the rail. The chat surface itself is exercised
// by AtlasDrawer's own tests.
jest.mock('@/components/shell/AtlasDrawer', () => ({
  AtlasDrawer: () => <div data-testid="stub-atlas-drawer" />,
}));

// NexusReactivePanel is a heavy artifact-card renderer. The test cares
// that it lives inside the Reasoning tab, not what it draws — stub.
jest.mock('@/components/programs/NexusReactivePanel', () => ({
  NexusReactivePanel: () => <div data-testid="stub-nexus-reactive-panel" />,
}));

const mockUseAtlasPageState = jest.fn<AtlasPageContextValue | null, []>();

jest.mock('@/hooks/useAtlasPageState', () => ({
  useAtlasPageState: () => mockUseAtlasPageState(),
}));

function makeBundle(overrides: Partial<ContextBundle> = {}): ContextBundle {
  return {
    query: 'why is apex CDP at risk?',
    mode: 'full',
    tenantKey: 'apex-retail',
    facts: [],
    graphPaths: [],
    semanticChunks: [],
    corpusPatterns: [],
    provenance: [],
    warnings: [],
    assembledAt: '2026-04-30T14:32:09Z',
    ...overrides,
  };
}

function makePageState(
  overrides: Partial<AtlasPageContextValue> = {},
): AtlasPageContextValue {
  const turn: ChatTurn = {
    id: 'usr-1',
    role: 'user',
    text: 'Hello',
    agentName: 'Nexus',
    timestamp: 0,
  };
  return {
    tenantName: 'Apex Retail Group',
    surface: 'programs-detail',
    stage: null,
    surfaceContext: {},
    agentName: 'Nexus',
    conversation: [turn],
    currentResponse: '',
    isStreaming: false,
    error: null,
    suggestedActions: [],
    ask: jest.fn(),
    clearResponse: jest.fn(),
    latestContextBundle: null,
    isAssemblingContextBundle: false,
    contextBundleMode: null,
    setContextBundleMode: jest.fn(),
    ...overrides,
  };
}

const NEXUS_AGENT = { initials: 'Nx', name: 'Nexus', role: 'Program Orchestrator' };
const SENTINEL_AGENT = { initials: 'Sn', name: 'Sentinel', role: 'Knowledge' };

afterEach(() => {
  mockUseAtlasPageState.mockReset();
});

describe('AgentCanvas · CB-7', () => {
  it('renders the Reasoning + Context tab strip on a Programs surface', () => {
    mockUseAtlasPageState.mockReturnValue(makePageState());
    render(
      <AgentCanvas
        surface="/programs/APX-CDP-2026"
        programId="APX-CDP-2026"
        agent={NEXUS_AGENT}
        quote="Where are we?"
        artifacts={[]}
        onArtifact={() => {}}
      />,
    );
    expect(screen.getByTestId('agent-canvas-rail-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('agent-canvas-rail-tab-reasoning')).toBeInTheDocument();
    expect(screen.getByTestId('agent-canvas-rail-tab-context')).toBeInTheDocument();
    // Reasoning is the default active tab.
    expect(screen.getByTestId('agent-canvas-rail-tab-reasoning')).toHaveAttribute(
      'data-active',
      'true',
    );
    expect(screen.getByTestId('agent-canvas-rail-tab-context')).toHaveAttribute(
      'data-active',
      'false',
    );
  });

  it('does NOT render the rail tab strip on a non-Programs surface', () => {
    mockUseAtlasPageState.mockReturnValue(makePageState());
    render(
      <AgentCanvas
        surface="/intelligence"
        agent={SENTINEL_AGENT}
        quote="Patterns and citations"
        artifacts={[]}
        onArtifact={() => {}}
      />,
    );
    expect(screen.queryByTestId('agent-canvas-rail-tabs')).toBeNull();
    expect(screen.queryByTestId('agent-canvas-mode-toggle-row')).toBeNull();
    // The legacy single-purpose Reasoning panel still mounts.
    expect(screen.getByTestId('stub-nexus-reactive-panel')).toBeInTheDocument();
  });

  it('switches to the Context tab and shows the cold-start panel when no bundle', () => {
    mockUseAtlasPageState.mockReturnValue(makePageState());
    render(
      <AgentCanvas
        surface="/programs/APX-CDP-2026"
        programId="APX-CDP-2026"
        agent={NEXUS_AGENT}
        quote="Where are we?"
        artifacts={[]}
        onArtifact={() => {}}
      />,
    );
    fireEvent.click(screen.getByTestId('agent-canvas-rail-tab-context'));
    expect(screen.getByTestId('agent-canvas-rail-tab-context')).toHaveAttribute(
      'data-active',
      'true',
    );
    const panel = screen.getByTestId('context-assembled-panel');
    expect(panel).toHaveAttribute('data-state', 'empty');
    expect(screen.getByTestId('context-assembled-empty-cold')).toBeInTheDocument();
    // Mode toggle is rendered above the panel.
    expect(screen.getByTestId('mode-toggle')).toBeInTheDocument();
  });

  it('passes the assembled bundle through to the Context panel when set', () => {
    mockUseAtlasPageState.mockReturnValue(
      makePageState({ latestContextBundle: makeBundle() }),
    );
    render(
      <AgentCanvas
        surface="/programs/APX-CDP-2026"
        programId="APX-CDP-2026"
        agent={NEXUS_AGENT}
        quote="Where are we?"
        artifacts={[]}
        onArtifact={() => {}}
      />,
    );
    fireEvent.click(screen.getByTestId('agent-canvas-rail-tab-context'));
    const panel = screen.getByTestId('context-assembled-panel');
    expect(panel).toHaveAttribute('data-state', 'ready');
    expect(panel).toHaveAttribute('data-mode', 'full');
  });

  it('renders the assembling skeleton while a bundle is in flight', () => {
    mockUseAtlasPageState.mockReturnValue(
      makePageState({ isAssemblingContextBundle: true }),
    );
    render(
      <AgentCanvas
        surface="/programs/APX-CDP-2026"
        programId="APX-CDP-2026"
        agent={NEXUS_AGENT}
        quote="Where are we?"
        artifacts={[]}
        onArtifact={() => {}}
      />,
    );
    fireEvent.click(screen.getByTestId('agent-canvas-rail-tab-context'));
    const panel = screen.getByTestId('context-assembled-panel');
    expect(panel).toHaveAttribute('data-state', 'loading');
    expect(screen.getByTestId('context-panel-skeleton')).toBeInTheDocument();
  });

  it('forwards mode-toggle clicks to setContextBundleMode', () => {
    const setContextBundleMode = jest.fn();
    mockUseAtlasPageState.mockReturnValue(makePageState({ setContextBundleMode }));
    render(
      <AgentCanvas
        surface="/programs/APX-CDP-2026"
        programId="APX-CDP-2026"
        agent={NEXUS_AGENT}
        quote="Where are we?"
        artifacts={[]}
        onArtifact={() => {}}
      />,
    );
    fireEvent.click(screen.getByTestId('agent-canvas-rail-tab-context'));
    fireEvent.click(screen.getByTestId('mode-toggle-corpus'));
    expect(setContextBundleMode).toHaveBeenCalledTimes(1);
    expect(setContextBundleMode).toHaveBeenCalledWith('corpus');
  });

  it('falls back to the single-purpose Reasoning rail when the provider is absent', () => {
    mockUseAtlasPageState.mockReturnValue(null);
    render(
      <AgentCanvas
        surface="/programs/APX-CDP-2026"
        programId="APX-CDP-2026"
        agent={NEXUS_AGENT}
        quote="Where are we?"
        artifacts={[]}
        onArtifact={() => {}}
      />,
    );
    // Tab strip is gated on the provider's presence at the inner
    // component level; absent provider → no tabs, only the
    // reactive-panel stub in the rail.
    expect(screen.queryByTestId('agent-canvas-rail-tabs')).toBeNull();
    expect(screen.getByTestId('stub-nexus-reactive-panel')).toBeInTheDocument();
  });
});
