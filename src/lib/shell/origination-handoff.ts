// Origination → active program handoff bridge · Surface 2 PR-K
//
// Today's flow ejects the user from the conversation when commit_program
// fires: StewardChat navigates from /programs/new to /programs/<id> and
// the new page mounts AtlasPageStateProvider with an empty thread. The
// 5-minute origination conversation that built the brief on the right
// pane disappears, replaced by Nexus's blank greeting.
//
// This module bridges that gap. Before the navigation:
//   1. StewardChat captures its current conversation turns (normalized
//      to AtlasPageStateProvider's ChatTurn shape).
//   2. Inserts a synthetic handoff-marker turn — the visible "Steward
//      committed the program; Nexus is now active" beat — between the
//      origination turns and whatever Nexus will emit next.
//   3. Persists the bundle to sessionStorage keyed by programId.
//
// Then on the program-detail mount:
//   • AtlasPageStateProvider checks for a handoff payload matching
//     this programId.
//   • If found AND recent (< 90 s — long enough for a slow nav, short
//     enough that a stale tab refreshing later doesn't replay an old
//     handoff), it seeds its conversation state with the bundle.
//   • The payload is then cleared so a refresh doesn't double-hydrate.
//
// Why sessionStorage rather than a server-side cache: the data is
// ephemeral, scoped to one browser session, and there's no value in
// persisting it across tabs or sessions. Programs that need
// conversation history beyond the handoff window already have the
// canonical record in `conversation_threads` (server-side persistence
// is a separate, future scope).

import type { ChatTurn } from './atlas-page-state';

const STORAGE_KEY = 'abarva.programHandoff';
const FRESH_WINDOW_MS = 90_000;

/** What StewardChat writes before router.push fires. */
export interface OriginationHandoffPayload {
  programId: string;
  programName: string;
  /** Turns from the origination conversation, normalized to atlas shape. */
  turns: ChatTurn[];
  /** Wall-clock when the handoff was captured. */
  capturedAt: number;
}

/**
 * Build a synthetic agent turn that visually marks the origination →
 * active handoff. Renderers can detect this turn via
 * `agentName === '__handoff__'` and style it as a divider-style banner
 * rather than a normal chat bubble.
 */
export function buildHandoffMarker(programName: string): ChatTurn {
  return {
    id: `handoff_${Date.now().toString(36)}`,
    role: 'agent',
    agentName: '__handoff__',
    text:
      `Program committed — **${programName}** is now active. ` +
      `Nexus is taking the thread from here.`,
    timestamp: Date.now(),
  };
}

/**
 * StewardChat calls this before router.push. The turns it passes are
 * already normalized to ChatTurn shape so this is a thin write.
 */
export function persistOriginationHandoff(payload: OriginationHandoffPayload): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota / disabled storage — handoff is a UX nicety, not safety
    // critical, so swallow and continue.
  }
}

/**
 * AtlasPageStateProvider on /programs/<id> mount calls this with the
 * current program id. Returns the persisted turns when there is a
 * fresh handoff for this program. Always clears the storage entry to
 * prevent replay on refresh.
 */
export function consumeOriginationHandoff(programId: string): ChatTurn[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(STORAGE_KEY);

    const parsed = JSON.parse(raw) as Partial<OriginationHandoffPayload>;
    if (!parsed || typeof parsed.programId !== 'string') return null;
    if (parsed.programId !== programId) return null;
    if (typeof parsed.capturedAt !== 'number') return null;
    if (Date.now() - parsed.capturedAt > FRESH_WINDOW_MS) return null;
    if (!Array.isArray(parsed.turns)) return null;

    return parsed.turns.filter(
      (t): t is ChatTurn =>
        t != null &&
        typeof (t as ChatTurn).id === 'string' &&
        ((t as ChatTurn).role === 'user' || (t as ChatTurn).role === 'agent') &&
        typeof (t as ChatTurn).text === 'string',
    );
  } catch {
    return null;
  }
}

/**
 * Test-only — clear storage between tests.
 */
export function __resetForTests(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
