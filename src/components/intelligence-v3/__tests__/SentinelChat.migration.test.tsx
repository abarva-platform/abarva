/**
 * @jest-environment jsdom
 */

// SentinelChat · localStorage migration coverage.
//
// The dock-mode preference moved from a single legacy key
// (`abarva.intelligence.chat-mode`) with values
// `side-rail | dock-expanded | dock-collapsed` onto AgentDock's per-
// surface keys (`abarva.agent-dock.intelligence.mode`) with values
// `side-rail | pin-bottom | pin-top | expand | collapsed`.
//
// The migration runs once on first mount per browser, gated by a
// flag key that prevents repeated overwrites if the user later
// toggles modes. These tests pin that contract so the next migration
// chip doesn't accidentally re-introduce the legacy key.

import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { SentinelChat } from '../SentinelChat';

const LEGACY = 'abarva.intelligence.chat-mode';
const NEW = 'abarva.agent-dock.intelligence.mode';
const FLAG = 'abarva.intelligence.chat-mode.migrated';

function renderHarness() {
  return render(
    <SentinelChat
      scopeLabel="Test · this page"
      opener="opener"
      conversation={[]}
      workspace={<div data-testid="workspace">workspace</div>}
    />,
  );
}

describe('SentinelChat · legacy mode-key migration', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('migrates side-rail → side-rail', () => {
    window.localStorage.setItem(LEGACY, 'side-rail');
    renderHarness();
    expect(window.localStorage.getItem(NEW)).toBe('side-rail');
    expect(window.localStorage.getItem(FLAG)).toBe('1');
  });

  it('migrates dock-expanded → pin-bottom', () => {
    window.localStorage.setItem(LEGACY, 'dock-expanded');
    renderHarness();
    expect(window.localStorage.getItem(NEW)).toBe('pin-bottom');
    expect(window.localStorage.getItem(FLAG)).toBe('1');
  });

  it('migrates dock-collapsed → collapsed', () => {
    window.localStorage.setItem(LEGACY, 'dock-collapsed');
    renderHarness();
    expect(window.localStorage.getItem(NEW)).toBe('collapsed');
    expect(window.localStorage.getItem(FLAG)).toBe('1');
  });

  it('does NOT overwrite an existing new-key preference', () => {
    window.localStorage.setItem(LEGACY, 'dock-expanded');
    window.localStorage.setItem(NEW, 'expand'); // user already chose
    renderHarness();
    expect(window.localStorage.getItem(NEW)).toBe('expand');
    expect(window.localStorage.getItem(FLAG)).toBe('1');
  });

  it('skips migration when the flag is already set', () => {
    window.localStorage.setItem(FLAG, '1');
    window.localStorage.setItem(LEGACY, 'dock-collapsed');
    renderHarness();
    // No new key was written because we already migrated.
    expect(window.localStorage.getItem(NEW)).toBeNull();
  });

  it('handles a missing legacy key without crashing', () => {
    renderHarness();
    expect(window.localStorage.getItem(NEW)).toBeNull();
    expect(window.localStorage.getItem(FLAG)).toBe('1');
  });

  it('renders the opener as the first agent turn', () => {
    const { getByText } = render(
      <SentinelChat
        scopeLabel="Meridian · The Brief"
        opener="I composed this brief for Meridian Health from the corpus."
        conversation={[]}
        workspace={<div>workspace</div>}
      />,
    );
    expect(
      getByText(/I composed this brief for Meridian Health/),
    ).toBeInTheDocument();
  });
});
