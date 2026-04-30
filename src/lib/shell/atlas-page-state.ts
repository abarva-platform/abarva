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

import type { AttachmentChipRef } from '@/lib/programs/attachments/types';
// CB-6 · type-only import — the broker module is server-only, but type
// imports are erased at compile time so this never traverses the
// client bundle's webpack graph.
import type { BrokerMode, ContextBundle } from '@/lib/knowledge/context-broker';

export interface ChatTurn {
  id: string;
  role: 'user' | 'agent';
  text: string;
  /** The agent name for display (Nexus, Sentinel, Atlas, Steward). */
  agentName: string;
  timestamp: number;
  /**
   * OV2-4b · attachments persisted with this turn. Rendered as chips
   * after the message body. Server-side, the turn's surfaceContext
   * carries the same refs so the agent can reference them.
   */
  attachments?: AttachmentChipRef[];
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
  /**
   * CB-6 · the latest assembled `ContextBundle` for the active
   * conversation. Set when the agent route emits a
   * `context-bundle` artifact at the start of its response.
   * `null` before the first turn or while assembly is in flight
   * (in which case `isAssemblingContextBundle` is also true).
   */
  latestContextBundle: ContextBundle | null;
  /**
   * CB-6 · true while the broker is assembling for the latest user
   * turn (between user-submit and the first context-bundle artifact
   * landing). The panel renders a skeleton during this window.
   */
  isAssemblingContextBundle: boolean;
  /**
   * CB-6 · the user's per-surface mode preference for the 4-mode
   * toggle. `null` until the user picks one (the route then uses
   * `inferModeForSurface` per surface). The provider hydrates this
   * from localStorage on mount.
   */
  contextBundleMode: BrokerMode | null;
}

// ── Context value ─────────────────────────────────────────────────────────────

/** Full context value consumed via useAtlasPageState(). */
export interface AtlasPageContextValue extends AtlasPageState {
  /**
   * Submit a user message. Appends user turn + streams agent reply.
   * Optional attachments are attached to the user turn for chip
   * rendering AND threaded into surfaceContext.attachments so the
   * server-side agent prompt can reference them.
   */
  ask: (text: string, attachments?: AttachmentChipRef[]) => void;
  /** Clear the in-flight response / error (does not clear conversation). */
  clearResponse: () => void;
  /**
   * CB-6 · update the per-surface context-mode preference. The provider
   * persists the chosen mode to localStorage keyed by surface; the
   * next `ask()` call sends it to the route via
   * `surfaceContext.contextBundleMode`.
   */
  setContextBundleMode: (mode: BrokerMode) => void;
}

// ── Provider props ────────────────────────────────────────────────────────────

export interface AtlasPageStateProviderProps {
  tenantName: string;
  surface: SurfaceId;
  stage?: StageId | null;
  surfaceContext?: Record<string, unknown>;
  agentName?: string;
  /** Full synthesis text stored as conversation turn 0. */
  synthesisText?: string;
  /** Initial action set shown by presentational Atlas consumers. */
  suggestedActions?: SuggestedAction[];
  /**
   * PR-L · structured-artifact dispatcher. When provided, the provider
   * parses each streamed chunk through extractArtifacts(), strips the
   * sentinel tuples from the conversation text the user sees, and
   * forwards each parsed artifact here. Pages on /programs/<id> wire
   * this to update the reactive panel and trigger router.refresh()
   * on program-phase-changed.
   *
   * Caller should hold a stable reference (useCallback) so we don't
   * re-create the streaming closure on every render.
   */
  onArtifact?: (artifact: import('@/lib/agent/artifacts').Artifact) => void;
}

export interface AtlasPageStateSeed extends AtlasPageStateProviderProps {
  timestamp?: number;
}

export interface AppendAtlasTurnOptions {
  id?: string;
  timestamp?: number;
  agentName?: string;
}

export const ATLAS_SYNTHESIS_TURN_ID = 'atlas-synthesis-turn-0';
export const DEFAULT_ATLAS_AGENT_NAME = 'Atlas';
export const DEFAULT_ATLAS_TENANT_NAME = 'Apex Retail Group';

function normalizeTenantName(tenantName: string) {
  const normalized = tenantName.trim();
  return normalized.length > 0 ? normalized : DEFAULT_ATLAS_TENANT_NAME;
}

function createTurnId(role: ChatTurn['role'], timestamp: number, index: number) {
  return `atlas-${role}-${timestamp}-${index}`;
}

function createDefaultSynthesis(seed: AtlasPageStateSeed) {
  const tenantName = normalizeTenantName(seed.tenantName);
  const agentName = seed.agentName ?? DEFAULT_ATLAS_AGENT_NAME;
  const stageLabel = seed.stage ? ` at ${seed.stage}` : '';

  return `${agentName} is initialized for ${tenantName} on ${seed.surface}${stageLabel}. Ask for the page context, current pressures, or next best action.`;
}

export function createAtlasPageState(seed: AtlasPageStateSeed): AtlasPageState {
  const tenantName = normalizeTenantName(seed.tenantName);
  const agentName = seed.agentName ?? DEFAULT_ATLAS_AGENT_NAME;
  const timestamp = seed.timestamp ?? Date.now();
  const synthesisText = seed.synthesisText?.trim() || createDefaultSynthesis({ ...seed, tenantName, agentName });

  return {
    tenantName,
    surface: seed.surface,
    stage: seed.stage ?? null,
    surfaceContext: seed.surfaceContext ?? {},
    agentName,
    conversation: [
      {
        id: ATLAS_SYNTHESIS_TURN_ID,
        role: 'agent',
        text: synthesisText,
        agentName,
        timestamp,
      },
    ],
    currentResponse: '',
    isStreaming: false,
    error: null,
    suggestedActions: seed.suggestedActions ?? [],
    latestContextBundle: null,
    isAssemblingContextBundle: false,
    contextBundleMode: null,
  };
}

export function resetAtlasPageState(seed: AtlasPageStateSeed): AtlasPageState {
  return createAtlasPageState(seed);
}

export function appendAtlasUserTurn(
  state: AtlasPageState,
  text: string,
  options: AppendAtlasTurnOptions = {},
): AtlasPageState {
  const cleanText = text.trim();
  if (!cleanText) return state;

  const timestamp = options.timestamp ?? Date.now();
  const turn: ChatTurn = {
    id: options.id ?? createTurnId('user', timestamp, state.conversation.length),
    role: 'user',
    text: cleanText,
    agentName: options.agentName ?? state.agentName,
    timestamp,
  };

  return {
    ...state,
    conversation: [...state.conversation, turn],
    currentResponse: '',
    isStreaming: false,
    error: null,
  };
}

export function appendAtlasAgentTurn(
  state: AtlasPageState,
  text: string,
  options: AppendAtlasTurnOptions = {},
): AtlasPageState {
  const cleanText = text.trim();
  if (!cleanText) return state;

  const timestamp = options.timestamp ?? Date.now();
  const turn: ChatTurn = {
    id: options.id ?? createTurnId('agent', timestamp, state.conversation.length),
    role: 'agent',
    text: cleanText,
    agentName: options.agentName ?? state.agentName,
    timestamp,
  };

  return {
    ...state,
    conversation: [...state.conversation, turn],
    currentResponse: '',
    isStreaming: false,
    error: null,
  };
}

export function clearAtlasResponse(state: AtlasPageState): AtlasPageState {
  return {
    ...state,
    currentResponse: '',
    isStreaming: false,
    error: null,
  };
}

export function buildAtlasContextualReply(state: AtlasPageState, prompt: string) {
  const stageLabel = state.stage ? `, stage ${state.stage}` : '';
  return `${state.agentName} has ${state.tenantName} context for ${state.surface}${stageLabel}. I will use the page synthesis and ${Object.keys(state.surfaceContext).length} context fields to answer: "${prompt.trim()}".`;
}
