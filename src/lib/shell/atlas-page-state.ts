// atlas-page-state.ts
//
// Canonical type definitions for the single AtlasPageState object that lives
// per page. Every Atlas surface (AgentColumn, AskAnythingBar, AtlasDrawer in
// future Mode B) reads from and writes to this shared state — structurally
// preventing the "two Atlases" and "Atlas doesn't know the tenant" bugs.
//
// Shell Layout Spec v2 §6 · April 2026

// ── Surface + stage IDs ───────────────────────────────────────────────────────

export type SurfaceId =
  | 'tower'
  | 'programs'
  | 'programs-detail'
  | 'source'
  | 'source-detail'
  | 'intelligence'
  | 'home'
  | 'setup'
  | 'setup-detail';

/** P0-P6 for program phases, S1-S7 for source event stages. */
export type StageId =
  | 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6'
  | 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7';

// ── Conversation ──────────────────────────────────────────────────────────────

export interface ChatTurn {
  id: string;
  role: 'user' | 'agent';
  text: string;
  /** The agent name for display (Nexus, Sentinel, Atlas, Steward). */
  agentName: string;
  timestamp: number;
}

export interface SuggestedAction {
  id: string;
  label: string;
  /** If present, this text is submitted as the next user message when clicked. */
  message?: string;
  /** If present, navigates instead of submitting. */
  href?: string;
}

// ── Page state ────────────────────────────────────────────────────────────────

/**
 * The single state object per page per the Shell Layout Spec v2 §6.1.
 * Both synthesis and chat surfaces read from this. Tenant is always present
 * (initialized from shell context on mount) — the "Atlas doesn't know Apex"
 * failure mode is architecturally impossible because this is the only path to
 * Atlas and it always includes the tenant.
 */
export interface AtlasPageState {
  /** Tenant name from shell context (locked at login, never re-fetched). */
  tenantName: string;
  /** Surface the page belongs to (canonical, assigned in the catalog). */
  surface: SurfaceId;
  /** Workflow stage for stage-aware surfaces; null for monitoring surfaces. */
  stage: StageId | null;
  /**
   * Surface-specific data injected at mount (pressures for Tower, program
   * metadata for Programs detail, event metadata for Source events, etc.).
   * Passed to every agent turn as additional context.
   */
  surfaceContext: Record<string, unknown>;
  /** Agent name displayed to users (Nexus, Sentinel, Atlas, Steward). */
  agentName: string;
  /** Full conversation history. Turn 0 will be synthesis in Mode A/B waves. */
  conversation: ChatTurn[];
  /**
   * Streaming text for the in-flight agent turn. Reset to '' when a turn
   * completes and the text is flushed to `conversation`.
   */
  currentResponse: string;
  isStreaming: boolean;
  error: string | null;
  suggestedActions: SuggestedAction[];
}

// ── Context value ─────────────────────────────────────────────────────────────

/** Full context value consumed via useAtlasPageState(). */
export interface AtlasPageContextValue extends AtlasPageState {
  /** Submit a user message. Appends user turn + streams agent reply. */
  ask: (text: string) => void;
  /** Clear the in-flight response / error (does not clear conversation). */
  clearResponse: () => void;
}

// ── Provider props ────────────────────────────────────────────────────────────

export interface AtlasPageStateProviderProps {
  tenantName: string;
  surface: SurfaceId;
  stage?: StageId | null;
  surfaceContext?: Record<string, unknown>;
  agentName?: string;
}
