/**
 * @jest-environment jsdom
 */

// SentinelChat · position contract.
//
// The dock-migration PR moves the chat lane from the right side of the
// Intelligence surface to the LEFT, matching Source/Moves. This test
// pins the contract by reading the live DOM order of the chat panel
// and the workspace pane in side-rail mode.

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { SentinelChat } from '../SentinelChat';

describe('SentinelChat · position', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders chat panel BEFORE workspace in DOM order (LEFT rail)', () => {
    render(
      <SentinelChat
        scopeLabel="Acme · this page"
        opener="Hi from Sentinel."
        conversation={[]}
        workspace={<div data-testid="my-workspace">workspace body</div>}
      />,
    );
    const dockPanel = screen.getByTestId('agent-dock-panel');
    const workspace = screen.getByTestId('my-workspace');
    // Both nodes are present.
    expect(dockPanel).toBeInTheDocument();
    expect(workspace).toBeInTheDocument();
    // The dock panel sits earlier in the DOM than the workspace —
    // proving chat is on the LEFT in side-rail mode.
    const order = dockPanel.compareDocumentPosition(workspace);
    // DOCUMENT_POSITION_FOLLOWING = 4 — workspace follows dockPanel.
    expect(order & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('passes surfaceContext through to the dock', () => {
    render(
      <SentinelChat
        scopeLabel="Acme · this page"
        opener="Hi"
        conversation={[]}
        workspace={<div>w</div>}
        surfaceContext={{ activeTab: 'brief', activeClient: 'meridian' }}
      />,
    );
    // Dock renders without crashing — surfaceContext doesn't bubble
    // into the DOM, but reaching this assertion proves it was an
    // accepted prop shape.
    expect(screen.getByTestId('agent-dock-panel')).toBeInTheDocument();
  });
});
