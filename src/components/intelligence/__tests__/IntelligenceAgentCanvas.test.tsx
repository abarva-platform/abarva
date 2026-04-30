/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { IntelligenceAgentCanvas } from '../IntelligenceAgentCanvas';
import type { AtlasPageContextValue } from '@/lib/shell/atlas-page-state';
import type { ContextBundle } from '@/lib/knowledge/context-broker';

const mockAtlasDrawer = jest.fn((props: Record<string, unknown>) => (
  <div
    data-testid="stub-atlas-drawer"
    data-composer-placement={String(props.composerPlacement ?? '')}
  >
    {props.emptyState as React.ReactNode}
  </div>
));

jest.mock('@/components/shell/AtlasDrawer', () => ({
  AtlasDrawer: (props: Record<string, unknown>) => mockAtlasDrawer(props),
}));

const mockUseAtlasPageState = jest.fn<AtlasPageContextValue | null, []>();

jest.mock('@/components/shell/AtlasPageStateProvider', () => {
  const actual = jest.requireActual('@/components/shell/AtlasPageStateProvider');
  return {
    ...actual,
    useAtlasPageState: () => mockUseAtlasPageState(),
  };
});

function makeBundle(overrides: Partial<ContextBundle> = {}): ContextBundle {
  return {
    query: 'what is the binding-layer thesis?',
    mode: 'corpus',
    tenantKey: null,
    facts: [],
    graphPaths: [],
    semanticChunks: [],
    corpusPatterns: [],
    worldviewChunks: [],
    provenance: [],
    warnings: [],
    infoTags: [],
    assembledAt: '2026-04-30T14:32:09Z',
    ...overrides,
  };
}

function makePageState(
  overrides: Partial<AtlasPageContextValue> = {},
): AtlasPageContextValue {
  return {
    tenantName: 'Apex Retail Group',
    hasTenantKey: true,
    surface: 'intelligence',
    stage: null,
    surfaceContext: {},
    agentName: 'Sentinel',
    conversation: [],
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

afterEach(() => {
  mockAtlasDrawer.mockClear();
  mockUseAtlasPageState.mockReset();
});

describe('IntelligenceAgentCanvas', () => {
  it('keeps Sentinel composer near the header and renders starter choices', () => {
    const ask = jest.fn();
    mockUseAtlasPageState.mockReturnValue(makePageState({ ask }));

    render(<IntelligenceAgentCanvas quote="Ask Sentinel." />);

    expect(mockAtlasDrawer).toHaveBeenCalledWith(
      expect.objectContaining({ embedded: true, composerPlacement: 'afterHeader' }),
    );
    expect(screen.getByTestId('sentinel-starter-choices')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Find a pattern'));
    expect(ask).toHaveBeenCalledWith('Show me patterns like pilot-to-production failure.');
  });

  it('renders Reasoning and Context tabs on the Intelligence rail', () => {
    mockUseAtlasPageState.mockReturnValue(makePageState());

    render(<IntelligenceAgentCanvas quote="Ask Sentinel." />);

    expect(screen.getByTestId('intelligence-agent-rail-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('intelligence-agent-rail-tab-reasoning')).toHaveAttribute(
      'data-active',
      'true',
    );
    expect(screen.getByTestId('intelligence-agent-rail-tab-context')).toHaveAttribute(
      'data-active',
      'false',
    );
  });

  it('shows the Context Assembled panel and mode toggle in the Context tab', () => {
    const setContextBundleMode = jest.fn();
    mockUseAtlasPageState.mockReturnValue(
      makePageState({
        latestContextBundle: makeBundle(),
        contextBundleMode: 'corpus',
        setContextBundleMode,
      }),
    );

    render(<IntelligenceAgentCanvas quote="Ask Sentinel." />);
    fireEvent.click(screen.getByTestId('intelligence-agent-rail-tab-context'));

    expect(screen.getByTestId('context-assembled-panel')).toHaveAttribute('data-state', 'ready');
    expect(screen.getByTestId('context-assembled-panel')).toHaveAttribute('data-mode', 'corpus');
    expect(screen.getByTestId('mode-toggle')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('mode-toggle-generic'));
    expect(setContextBundleMode).toHaveBeenCalledWith('generic');
  });
});
