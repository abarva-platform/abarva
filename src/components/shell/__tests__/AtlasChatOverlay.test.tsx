/**
 * @jest-environment jsdom
 */
/**
 * AtlasChatOverlay · CB-6 verification
 *
 * Coverage:
 *   - Renders nothing when closed
 *   - Renders chat thread + 4-mode toggle when open
 *   - Context Assembled panel renders cold-start when no bundle
 *   - Panel renders skeleton while assembling
 *   - Panel renders the bundle when one is present
 *   - ModeToggle's onChange wires through to setContextBundleMode
 *   - Tenant + Full disabled when no tenant key (tenantName empty)
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { AtlasChatOverlay } from '../AtlasChatOverlay';
import type {
  AtlasPageContextValue,
  ChatTurn,
} from '@/lib/shell/atlas-page-state';
import type { ContextBundle } from '@/lib/knowledge/context-broker';

const mockUseAtlasPageState = jest.fn<AtlasPageContextValue | null, []>();

jest.mock('@/hooks/useAtlasPageState', () => ({
  useAtlasPageState: () => mockUseAtlasPageState(),
}));

jest.mock('@/components/programs/attachments/AttachmentChip', () => ({
  PersistedAttachmentChip: ({ attachment }: { attachment: { id: string } }) => (
    <span data-testid={`attachment-chip-${attachment.id}`} />
  ),
}));

function bundle(overrides: Partial<ContextBundle> = {}): ContextBundle {
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
    infoTags: [],
    assembledAt: '2026-04-30T14:32:09Z',
    ...overrides,
  };
}

function pageState(
  overrides: Partial<AtlasPageContextValue> = {},
): AtlasPageContextValue {
  const turn: ChatTurn = {
    id: 'usr-1',
    role: 'user',
    text: 'Hello',
    agentName: 'Atlas',
    timestamp: 0,
  };
  return {
    tenantName: 'Apex Retail Group',
    hasTenantKey: true,
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

afterEach(() => {
  mockUseAtlasPageState.mockReset();
});

describe('AtlasChatOverlay · CB-6', () => {
  it('renders nothing when open=false', () => {
    mockUseAtlasPageState.mockReturnValue(pageState());
    const { container } = render(
      <AtlasChatOverlay open={false} onClose={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the chat thread and the 4-mode toggle when open', () => {
    mockUseAtlasPageState.mockReturnValue(pageState());
    render(<AtlasChatOverlay open={true} onClose={() => {}} />);
    expect(screen.getByTestId('atlas-chat-thread')).toBeInTheDocument();
    expect(screen.getByTestId('atlas-chat-context-rail')).toBeInTheDocument();
    expect(screen.getByTestId('mode-toggle')).toBeInTheDocument();
    // All four toggle buttons are present.
    expect(screen.getByTestId('mode-toggle-generic')).toBeInTheDocument();
    expect(screen.getByTestId('mode-toggle-corpus')).toBeInTheDocument();
    expect(screen.getByTestId('mode-toggle-tenant')).toBeInTheDocument();
    expect(screen.getByTestId('mode-toggle-full')).toBeInTheDocument();
  });

  it('renders the Context Assembled panel in cold-start when no bundle', () => {
    mockUseAtlasPageState.mockReturnValue(pageState());
    render(<AtlasChatOverlay open={true} onClose={() => {}} />);
    const panel = screen.getByTestId('context-assembled-panel');
    expect(panel).toHaveAttribute('data-state', 'empty');
    expect(screen.getByTestId('context-assembled-empty-cold')).toBeInTheDocument();
  });

  it('renders the skeleton while assembling', () => {
    mockUseAtlasPageState.mockReturnValue(
      pageState({ isAssemblingContextBundle: true }),
    );
    render(<AtlasChatOverlay open={true} onClose={() => {}} />);
    const panel = screen.getByTestId('context-assembled-panel');
    expect(panel).toHaveAttribute('data-state', 'loading');
    expect(screen.getByTestId('context-panel-skeleton')).toBeInTheDocument();
  });

  it('renders the bundle when one is present', () => {
    mockUseAtlasPageState.mockReturnValue(
      pageState({ latestContextBundle: bundle() }),
    );
    render(<AtlasChatOverlay open={true} onClose={() => {}} />);
    const panel = screen.getByTestId('context-assembled-panel');
    expect(panel).toHaveAttribute('data-state', 'ready');
    expect(panel).toHaveAttribute('data-mode', 'full');
    expect(screen.getByTestId('context-panel-section-facts')).toBeInTheDocument();
  });

  it('forwards mode toggle clicks to setContextBundleMode', () => {
    const setContextBundleMode = jest.fn();
    mockUseAtlasPageState.mockReturnValue(pageState({ setContextBundleMode }));
    render(<AtlasChatOverlay open={true} onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('mode-toggle-corpus'));
    expect(setContextBundleMode).toHaveBeenCalledTimes(1);
    expect(setContextBundleMode).toHaveBeenCalledWith('corpus');
  });

  it('disables tenant + full when hasTenantKey is false (CB-8)', () => {
    // CB-8 · the disabled-mode guardrail keys off the explicit
    // `hasTenantKey` boolean, NOT `tenantName`. AppShell defaults
    // `tenantName` to "Apex Retail Group" for unauthenticated demo
    // opens, so the prior `tenantName`-based proxy was always true
    // and the toggle never disabled Tenant / Full.
    mockUseAtlasPageState.mockReturnValue(
      pageState({ tenantName: 'Apex Retail Group', hasTenantKey: false }),
    );
    render(<AtlasChatOverlay open={true} onClose={() => {}} />);
    expect(screen.getByTestId('mode-toggle-tenant')).toBeDisabled();
    expect(screen.getByTestId('mode-toggle-full')).toBeDisabled();
    expect(screen.getByTestId('mode-toggle-generic')).not.toBeDisabled();
    expect(screen.getByTestId('mode-toggle-corpus')).not.toBeDisabled();
  });

  it('enables all four modes when hasTenantKey is true (CB-8)', () => {
    mockUseAtlasPageState.mockReturnValue(
      pageState({ hasTenantKey: true }),
    );
    render(<AtlasChatOverlay open={true} onClose={() => {}} />);
    expect(screen.getByTestId('mode-toggle-tenant')).not.toBeDisabled();
    expect(screen.getByTestId('mode-toggle-full')).not.toBeDisabled();
    expect(screen.getByTestId('mode-toggle-generic')).not.toBeDisabled();
    expect(screen.getByTestId('mode-toggle-corpus')).not.toBeDisabled();
  });

  it('disables tenant + full even when tenantName is set if hasTenantKey is false (CB-8)', () => {
    // Regression check for the DEFECT-B walk finding: tenantName is
    // unreliable as a tenant-key proxy because AppShell defaults it
    // to a display string.
    mockUseAtlasPageState.mockReturnValue(
      pageState({ tenantName: 'Apex Retail Group', hasTenantKey: false }),
    );
    render(<AtlasChatOverlay open={true} onClose={() => {}} />);
    expect(screen.getByTestId('mode-toggle-tenant')).toBeDisabled();
    expect(screen.getByTestId('mode-toggle-full')).toBeDisabled();
  });
});
