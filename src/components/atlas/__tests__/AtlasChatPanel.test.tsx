/**
 * @jest-environment jsdom
 */

// AtlasChatPanel · adapter behavior on top of the shared AgentDock.
//
// Coverage:
//   - Translates AtlasMessage[] → AgentDock thread (atlas → agent role).
//   - Adds a transient "Atlas is thinking…" turn while pending=true.
//   - Routes suggestion clicks to the caller's onSuggestion (no compose).
//   - Forwards composer submit (text + attachments) to onSubmit.
//   - Renders the workspace pane in side-rail mode by default.
//   - Honours surface key for AgentDock localStorage persistence.

import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { AtlasChatPanel, type AtlasMessage } from '../AtlasChatPanel';
import { modeStorageKey } from '@/components/agent/AgentDock';
import type { AtlasSuggestion } from '@/lib/atlas/types';

const SURFACE = 'tower';

const MESSAGES: AtlasMessage[] = [
  { id: 'a1', role: 'atlas', content: 'Three threads run through this morning.' },
  { id: 'u1', role: 'user', content: 'Show me lagging programs.' },
];

const SUGGESTIONS: AtlasSuggestion[] = [
  { label: 'Open hero signal', value: 'signal:abc', kind: 'signal' },
  { label: 'Peer position', value: 'How do we compare to peers?', kind: 'message' },
];

beforeEach(() => {
  window.localStorage.clear();
});

describe('AtlasChatPanel · adapter', () => {
  it('translates atlas/user messages to AgentDock thread roles', () => {
    render(
      <AtlasChatPanel
        messages={MESSAGES}
        pending={false}
        onSubmit={jest.fn()}
        suggestions={[]}
        onSuggestion={jest.fn()}
        workspace={<div data-testid="tower-body">tower body</div>}
        surface={SURFACE}
      />,
    );

    const thread = screen.getByTestId('agent-dock-thread');
    expect(thread).toHaveTextContent('Three threads run through this morning.');
    expect(thread).toHaveTextContent('Show me lagging programs.');
    // workspace renders alongside in side-rail mode.
    expect(screen.getByTestId('tower-body')).toBeInTheDocument();
  });

  it('appends a transient "Atlas is thinking…" turn while pending', () => {
    render(
      <AtlasChatPanel
        messages={MESSAGES}
        pending={true}
        onSubmit={jest.fn()}
        suggestions={[]}
        onSuggestion={jest.fn()}
        workspace={<div>w</div>}
        surface={SURFACE}
      />,
    );

    const thread = screen.getByTestId('agent-dock-thread');
    expect(thread).toHaveTextContent('Atlas is thinking…');
  });

  it('renders in side-rail mode by default and persists per-surface', () => {
    render(
      <AtlasChatPanel
        messages={[]}
        pending={false}
        onSubmit={jest.fn()}
        suggestions={[]}
        onSuggestion={jest.fn()}
        workspace={<div>w</div>}
        surface={SURFACE}
      />,
    );

    const panel = screen.getByTestId('agent-dock-panel');
    expect(panel).toHaveAttribute('data-mode', 'side-rail');

    // Switch to pin-bottom — should write the surface-scoped storage key.
    fireEvent.click(screen.getByTestId('agent-dock-mode-pin-bottom'));
    expect(window.localStorage.getItem(modeStorageKey(SURFACE))).toBe('pin-bottom');
  });

  it('routes suggestion clicks to onSuggestion without pre-filling composer', () => {
    const onSuggestion = jest.fn();
    render(
      <AtlasChatPanel
        messages={[]}
        pending={false}
        onSubmit={jest.fn()}
        suggestions={SUGGESTIONS}
        onSuggestion={onSuggestion}
        workspace={<div>w</div>}
        surface={SURFACE}
      />,
    );

    const firstButton = screen.getByTestId('agent-dock-suggestion-signal-0');
    fireEvent.click(firstButton);

    expect(onSuggestion).toHaveBeenCalledTimes(1);
    expect(onSuggestion).toHaveBeenCalledWith(SUGGESTIONS[0]);
    // Composer should remain empty (no pre-fill from onClick path).
    const input = screen.getByTestId('agent-dock-input') as HTMLTextAreaElement;
    expect(input.value).toBe('');
  });

  it('forwards composer submit (text + attachments) to onSubmit', async () => {
    const onSubmit = jest.fn();
    render(
      <AtlasChatPanel
        messages={[]}
        pending={false}
        onSubmit={onSubmit}
        suggestions={[]}
        onSuggestion={jest.fn()}
        workspace={<div>w</div>}
        surface={SURFACE}
      />,
    );

    const input = screen.getByTestId('agent-dock-input');
    fireEvent.change(input, { target: { value: 'hello atlas' } });
    await act(async () => {
      fireEvent.submit(screen.getByTestId('agent-dock-form'));
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith('hello atlas', []);
  });
});
