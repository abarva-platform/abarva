"use client";

// AgentDock · shared chat-dock foundation for every agent surface.
//
// Five toggleable modes per surface, persisted in localStorage. The full
// mode model stays in the component, but the visible chrome is intentionally
// sparse: end users get expand and close, not a row of layout-debug controls.
//
// Composer behavior is identical across modes: auto-grow textarea up to
// ~6 rows / 160px, Enter submits, Shift+Enter inserts newline, paperclip
// uploads to /api/v1/agent/attachments, drag-drop covers the whole panel.
//
// IMPORTANT: this is the FOUNDATION component. The 7 sibling migration
// chips (Source new/canvas, Moves home/detail, Intelligence brief, Tower,
// Admin) will swap their existing chat panels for AgentDock in their own
// PRs. Don't touch those surfaces here.
//
// Design:
//   - Inline style objects (matches EventChatLane / portfolio idiom)
//   - No external icon library — chevrons are inline SVG
//   - Tokens borrowed from canvas-tokens (CHAT_BG, INK, RULE, etc.)
//
// Spec source: this PR · feat(agent): shared AgentDock with 6 modes.

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { CANVAS } from "@/components/source/canvas/canvas-tokens";
import { ResizableSplitter } from "@/components/source/canvas/ResizableSplitter";
import { SynthesisFeedbackWidget } from "@/components/reasoning/SynthesisFeedbackWidget";
import { AgentMarkdown } from "@/lib/agent/markdownRenderer";
import { useAtlasPageState } from "@/components/shell/AtlasPageStateProvider";
import { demoSafeClientText } from "@/lib/client-config";
import { hasVisibleAvaArtifacts } from "@/lib/ava-answer/renderable-artifacts";
import { AgentAnswerRenderer } from "@/components/agent-answer/AgentAnswerRenderer";
import { AvaAskMark } from "@/components/agent-answer/AvaAskMark";
import { EvidenceBasis } from "./EvidenceBasis";
import { AgentActionApprovalNotice } from "./AgentActionApprovalNotice";
import { AIResponsibilityFooter } from "@/components/abarva/AIResponsibilityFooter";
import type { AskSource } from "@/lib/intelligence/ask/types";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import type {
  AvaChatSessionExport,
  AvaChatSessionExportFormat,
} from "@/lib/ava-answer/export/session-types";
import { shapePublicText } from "@/lib/ava-answer/render-layer-shaper";
import type { AgentResponsePart } from "@/lib/agent/response-parts";

// useLayoutEffect warns if executed during SSR. The dock only computes
// real values in the browser, so fall back to the no-op effect on the
// server. This keeps the API call-site simple and SSR-safe.
const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function hasRenderableAvaArtifacts(
  answer?: AvaAnswerPacket | null,
): answer is AvaAnswerPacket {
  return hasVisibleAvaArtifacts(answer);
}

// Governed fence types the server may emit mid-stream (decision-table,
// chart, followups, abarva-canvas — see structured-exhibits.ts and the
// Intelligence canvas contract) that must never render as raw text: treat
// them the same as a raw pipe-table leak.
const RAW_STRUCTURED_FENCE_RE =
  /```(?:decision-table|chart|followups|abarva-canvas)\b|canvasType/i;

function hasRawMarkdownTableFragment(value: string): boolean {
  if (RAW_STRUCTURED_FENCE_RE.test(value)) return true;
  return value
    .split(/\r?\n/)
    .some((line) => (line.match(/\|/g) ?? []).length >= 2);
}

function stripMarkdownTableFragments(value: string): string {
  const withoutFences = value.replace(
    /```(?:decision-table|chart|followups|abarva-canvas)\b[\s\S]*?```/gi,
    "\n",
  );
  return withoutFences
    .split(/\r?\n/)
    .filter((line) => (line.match(/\|/g) ?? []).length < 2)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function shouldRenderAvaArtifactsInDock(
  surface: string,
  answer?: AvaAnswerPacket | null,
): answer is AvaAnswerPacket {
  void surface;
  return hasRenderableAvaArtifacts(answer);
}

function avaAnswerTextForDock(answer?: AvaAnswerPacket | null): string {
  if (!answer) return "";
  const text =
    answer.prose?.trim() ||
    answer.directAnswer?.trim() ||
    [answer.interpretation, answer.businessImplication, answer.recommendation]
      .filter((part): part is string => Boolean(part?.trim()))
      .join("\n\n")
      .trim();
  if (hasRenderableAvaArtifacts(answer) && hasRawMarkdownTableFragment(text)) {
    return shapePublicText(stripMarkdownTableFragments(text), "");
  }
  return shapePublicText(text, "");
}

const TECHNICAL_STRING_FIELDS = new Set([
  "id",
  "key",
  "client",
  "clientKey",
  "tenantId",
  "tenantKey",
]);

function sanitizeVisibleStrings<T>(value: T, fieldName?: string): T {
  if (
    typeof value === "string" &&
    fieldName &&
    TECHNICAL_STRING_FIELDS.has(fieldName)
  ) {
    return value;
  }
  if (typeof value === "string") return demoSafeClientText(value) as T;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeVisibleStrings(item)) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        sanitizeVisibleStrings(entry, key),
      ]),
    ) as T;
  }
  return value;
}

const MOVES_CHROME_TEXT_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> =
  [
    [/\bNo outgoing gate\b/gi, "No outgoing readiness checkpoint"],
    [
      /\bShow me what is still missing for this gate\./gi,
      "Show me what is still missing for this phase.",
    ],
    [/\bWhat's blocking the gate\?/gi, "What's blocking progress?"],
    [/\bOpen gate review\b/gi, "Open readiness review"],
    [/\bGate criteria\b/g, "Readiness criteria"],
    [/\bgate criteria\b/g, "readiness criteria"],
    [/\bthis gate\b/gi, "this phase"],
  ];

function normalizeMovesChromeText<T>(value: T, fieldName?: string): T {
  if (
    typeof value === "string" &&
    fieldName &&
    TECHNICAL_STRING_FIELDS.has(fieldName)
  ) {
    return value;
  }
  if (typeof value === "string") {
    let text: string = value;
    for (const [pattern, replacement] of MOVES_CHROME_TEXT_REPLACEMENTS) {
      text = text.replace(pattern, replacement);
    }
    return text as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeMovesChromeText(item)) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        normalizeMovesChromeText(entry, key),
      ]),
    ) as T;
  }
  return value;
}

function visibleAgentDockBody(
  surface: string,
  body: string,
  agentAnswer?: AvaAnswerPacket | null,
  preserveVisibleText = false,
): string {
  void surface;
  const packetText = avaAnswerTextForDock(agentAnswer);
  const bodyText =
    agentAnswer &&
    hasRenderableAvaArtifacts(agentAnswer) &&
    hasRawMarkdownTableFragment(body)
      ? stripMarkdownTableFragments(body)
      : body;
  const text = shapePublicText(packetText || bodyText, "");
  return preserveVisibleText ? text : demoSafeClientText(text);
}

function chatSessionTitle(thread: readonly ChatMessage[]): string {
  const firstUserTurn = thread.find((turn) => turn.role === "user");
  const title = firstUserTurn?.body.trim() || "aVa Executive Session Export";
  return title.length > 120 ? `${title.slice(0, 117).trimEnd()}...` : title;
}

function buildChatSessionExport(
  surface: string,
  thread: readonly ChatMessage[],
): AvaChatSessionExport {
  const firstAnswer = thread.find((turn) => turn.agentAnswer)?.agentAnswer;
  return {
    title: chatSessionTitle(thread),
    surface,
    tenantKey: firstAnswer?.tenantKey,
    turns: thread.map((turn) => ({
      id: turn.id,
      role: turn.role,
      body: visibleAgentDockBody(surface, turn.body, turn.agentAnswer, true),
      at: turn.at,
      answer: turn.agentAnswer ?? null,
    })),
  };
}

function submitChatSessionExport(
  session: AvaChatSessionExport,
  format: AvaChatSessionExportFormat,
) {
  const targetName = `ava-session-export-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
  const iframe = document.createElement("iframe");
  iframe.name = targetName;
  iframe.title = "aVa session export download target";
  iframe.style.display = "none";

  const form = document.createElement("form");
  form.method = "POST";
  form.action = "/api/intelligence/ask/export";
  form.target = targetName;
  form.style.display = "none";

  const payload = document.createElement("input");
  payload.type = "hidden";
  payload.name = "payload";
  payload.value = JSON.stringify({ session, format });
  form.appendChild(payload);

  document.body.appendChild(iframe);
  document.body.appendChild(form);
  form.submit();
  window.setTimeout(() => {
    form.remove();
    iframe.remove();
  }, 60_000);
}

/**
 * Auto-measure the dock's natural distance from the top of the viewport.
 *
 * The PR #1773 fix hardcoded `--agent-dock-top-offset` to 64px
 * (AppTopBar height). That works for surfaces with no other sticky
 * chrome, but breaks anywhere a secondary nav, progress rail, banner,
 * or sourcing-journey strip sits above the dock — height is
 * over-computed and the composer drops below the fold.
 *
 * The measured value is useful for viewport-bounded height, but it must
 * not become the sticky `top` offset. Feeding the dock's own current
 * position back into `position: sticky; top:` is self-referential: pages
 * with a secondary header can permanently bake a large natural offset
 * into the sticky point and leave a dead zone above the dock.
 *
 * The shell therefore writes `--agent-dock-self-top` for height only.
 * Sticky positioning uses a stable chrome offset:
 * `--agent-dock-sticky-top`, then `--agent-dock-top-offset`, then 72px.
 */
function useDockSelfTop(ref: RefObject<HTMLDivElement | null>) {
  useIsoLayoutEffect(() => {
    if (!ref.current) return;

    let scheduled = false;
    let lastValue = -1;

    const measure = () => {
      scheduled = false;
      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      // For sticky elements that are pinned, getBoundingClientRect().top
      // equals the resolved sticky `top` value once the page has scrolled.
      // For elements above their sticky point, top is the natural offset.
      // Either way, this is the y-coord we want as `top` AND as the
      // height subtractor. Negative values (offscreen above viewport) or
      // non-finite values fall back to the var default, so guard them.
      const value = Math.max(0, Math.round(rect.top));
      if (!Number.isFinite(value) || value === lastValue) return;
      lastValue = value;
      node.style.setProperty("--agent-dock-self-top", `${value}px`);
    };

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      // requestAnimationFrame coalesces resize + scroll + mutation
      // bursts into a single measurement per frame.
      window.requestAnimationFrame(measure);
    };

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(schedule, 100);
    };

    let mutationTimer: ReturnType<typeof setTimeout> | null = null;
    const onMutation = () => {
      if (mutationTimer) clearTimeout(mutationTimer);
      mutationTimer = setTimeout(schedule, 100);
    };

    measure();

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", schedule, { passive: true });

    let observer: MutationObserver | null = null;
    if (typeof MutationObserver !== "undefined") {
      observer = new MutationObserver(onMutation);
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class", "hidden"],
      });
    }

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", schedule);
      if (resizeTimer) clearTimeout(resizeTimer);
      if (mutationTimer) clearTimeout(mutationTimer);
      if (observer) observer.disconnect();
    };
  }, [ref]);
}

// ── Types ─────────────────────────────────────────────────────────────────

export type DockMode =
  | "side-rail"
  | "side-rail-right"
  | "pin-bottom"
  | "pin-top"
  | "expand"
  | "collapsed";

export type RestorableDockMode = Exclude<DockMode, "collapsed">;

export const DOCK_MODES: readonly DockMode[] = [
  "side-rail",
  "side-rail-right",
  "pin-bottom",
  "pin-top",
  "expand",
  "collapsed",
] as const;

export interface AgentProfile {
  /** 1–2 character glyph or initials shown in the avatar. */
  initials: string;
  /** Optional branded mark for Ava surfaces. */
  mark?: "ava";
  /** Full name shown in the header. */
  name: string;
  /** Eyebrow under the name. Action verbs the user can ask for. */
  role: string;
}

export interface ChatMessage {
  id: string;
  role: "agent" | "user";
  body: string;
  /** Optional structured UI parts, used by Source/aVa for tables and charts. */
  parts?: AgentResponsePart[];
  /** Optional createdAt for byline rendering. */
  at?: string;
  /** Optional telemetry event id that can receive thumbs feedback. */
  feedbackEventId?: string;
  /** Evidence sources the answer was grounded in (client context, corpus
   *  patterns, industry/research). Streamed from the `sources` event and
   *  surfaced via <EvidenceBasis>; when present the citation-gap warning is
   *  suppressed because the answer is visibly grounded. */
  citations?: AskSource[];
  /** Structured Ava answer channels (tables/charts/graphs) emitted by SCB surfaces. */
  agentAnswer?: AvaAnswerPacket;
}

export interface AttachmentRef {
  id: string;
  file_name: string;
  mime: string;
  bytes: number;
  storage_path: string;
  /** First ~4000 chars of extracted text. Empty string for images / parse failures. */
  extracted_text_preview?: string;
  parse_metadata?: {
    page_count?: number | null;
    table_count?: number | null;
    parser_id?: string | null;
    small_doc_shortcut?: {
      eligible: boolean;
      route: "claude-native-pdf" | "parser";
      reason: string;
      byte_size: number;
      page_count: number | null;
      thresholds: {
        max_bytes: number;
        max_pages_exclusive: number;
      };
    } | null;
    raw_mode_escape?: {
      eligible: boolean;
      requires_user_approval: boolean;
      route: "claude-native-pdf";
      reason: string;
      estimated_tokens_per_turn: number;
      parser_bug_ticket_id: string | null;
      cost_warning: string;
    } | null;
  };
  raw_mode_requested?: {
    acknowledged_at: string;
    parser_bug_ticket_id: string | null;
    estimated_tokens_per_turn: number;
  };
}

export interface SuggestedAction {
  id: string;
  label: string;
  /** Body submitted when clicked. */
  body: string;
  /** Optional override — when provided, click uses the caller's behavior. */
  onClick?: () => void;
}

export interface AgentDockProps {
  agent: AgentProfile;
  /** Used as the localStorage namespace + telemetry key. */
  surface: string;
  /**
   * `dock` preserves the existing multi-mode workspace/chat shell.
   * `chat-only` renders the advisor as the primary page experience and ignores
   * persisted split/canvas modes for this surface.
   */
  layout?: "dock" | "chat-only";
  /**
   * `standard` keeps the full operational dock used by Source/Moves/Tower.
   * `focused` keeps the chat rail quiet for GPT-like advisor surfaces and
   * renders governed answer artifacts without repeating packet chrome.
   */
  variant?: "standard" | "focused";
  /** Suppress loud draft/citation review chrome while preserving the normal rail layout. */
  quietReviewChrome?: boolean;
  defaultMode?: DockMode;
  /** When true, starts from defaultMode instead of restoring a persisted dock mode. */
  disableStoredMode?: boolean;
  /** Mode to open when the collapsed chip is invoked. Defaults to the last rich mode. */
  collapsedRestoreMode?: RestorableDockMode;
  /** Free-form context passed back to the API on submit. */
  surfaceContext?: Record<string, unknown>;
  /** Optional "in reply to …" quote rendered above the composer. */
  initialQuote?: string;
  /** Three-or-fewer suggested actions surfaced above the composer. */
  suggestedActions?: SuggestedAction[];
  /** Keep suggested actions visible even after an opening advisor turn exists. */
  keepSuggestedActionsVisible?: boolean;
  /** Human-facing composer placeholder. Defaults to "Ask {agent.name}…". */
  placeholder?: string;
  thread: ChatMessage[];
  /** Caller handles network. We pass plain text + attachment refs. */
  onMessage: (
    text: string,
    attachments: AttachmentRef[],
  ) => void | Promise<void>;
  /** For side-rail modes this becomes the opposite pane; other modes flow normally. */
  workspace: ReactNode;
  /** Side-rail splitter overrides. */
  minLeftPx?: number;
  defaultLeftPercent?: number;
  /** Expanded overlay sizing overrides for artifact-heavy surfaces. */
  expandedWidth?: CSSProperties["width"];
  expandedMaxWidth?: CSSProperties["maxWidth"];
  /** Preserve caller-provided visible text when the surface has already applied its own naming policy. */
  preserveVisibleText?: boolean;
  /** Optional copy for the collapsed chip. Defaults to the legacy "Ask {agent}". */
  collapsedSummary?: {
    label: string;
    detail?: string;
  };
  /** Optional presentation override for the collapsed launcher. */
  collapsedChipStyle?: CSSProperties;
  /**
   * Optional override: when true, AgentDock shows a throbber turn at the
   * end of the thread even if no agent message is in flight via
   * AtlasPageState. Most callers can leave this undefined — AgentDock
   * reads `useAtlasPageState().isStreaming || isAssemblingContextBundle`
   * automatically when mounted inside the provider tree.
   *
   * Founder feedback 2026-05-10: 'while any agent is busy retrieving
   * info... it will be nice to show a spinning icon... throbber or
   * similar to show it is busy working.'
   */
  isAgentBusy?: boolean;
}

// ── Storage helpers ───────────────────────────────────────────────────────

export function modeStorageKey(surface: string): string {
  return `abarva.agent-dock.${surface}.mode`;
}

export function splitStorageKey(surface: string): string {
  return `abarva.agent-dock.${surface}.split`;
}

function readStoredMode(surface: string): DockMode | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(modeStorageKey(surface));
    if (raw && (DOCK_MODES as readonly string[]).includes(raw)) {
      return raw as DockMode;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writeStoredMode(surface: string, mode: DockMode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(modeStorageKey(surface), mode);
  } catch {
    /* ignore */
  }
}

function resolveCollapsedRestoreMode(
  defaultMode: DockMode,
  collapsedRestoreMode?: RestorableDockMode,
): RestorableDockMode {
  return (
    collapsedRestoreMode ??
    (defaultMode === "collapsed" ? "side-rail" : defaultMode)
  );
}

// ── Mime allowlist (matches API + spec) ───────────────────────────────────

export const AGENT_DOCK_MIME_ALLOWLIST: readonly string[] = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
  "text/markdown",
  "image/png",
  "image/jpeg",
];

// ── Local upload state ────────────────────────────────────────────────────

interface PendingUpload {
  /** Stable client-side id while the upload is in flight. */
  localId: string;
  file: File;
  status: "uploading" | "done" | "error";
  startedAtMs: number;
  estimatedPages: number | null;
  errorMessage?: string;
  /** Server-assigned record (only when status === 'done'). */
  ref?: AttachmentRef;
}

export interface UploadParsedPreview {
  snippet: string;
  pageSignal: string;
  tableSignal: string;
  hasExtractedText: boolean;
  rawModeEscape:
    | NonNullable<AttachmentRef["parse_metadata"]>["raw_mode_escape"]
    | null;
  rawModeRequested: boolean;
}

export interface UploadParsingProgress {
  label: string;
  elapsedSeconds: number;
  currentPage: number | null;
  estimatedPages: number | null;
}

export interface UploadParsingProgressInput {
  file: Pick<File, "size" | "type">;
  startedAtMs: number;
  estimatedPages: number | null;
  status: "uploading" | "done" | "error";
}

export function estimateUploadParsePages(
  file: Pick<File, "size" | "type">,
): number | null {
  if (file.type !== "application/pdf") return null;
  // The browser cannot know true PDF page count without parsing bytes.
  // Use a deliberately conservative size heuristic for UX only; server-side
  // parser metadata remains the source of truth once upload completes.
  return Math.max(1, Math.min(50, Math.ceil(file.size / 65_000)));
}

export function buildUploadParsingProgress(
  upload: UploadParsingProgressInput,
  nowMs: number,
): UploadParsingProgress | null {
  if (upload.status !== "uploading") return null;
  const elapsedSeconds = Math.max(
    0,
    Math.floor((nowMs - upload.startedAtMs) / 1000),
  );
  const estimatedPages = upload.estimatedPages;
  const currentPage =
    estimatedPages === null
      ? null
      : Math.min(
          estimatedPages,
          Math.max(1, Math.floor(elapsedSeconds / 2) + 1),
        );
  const stage =
    upload.file.type === "application/pdf"
      ? "Parsing PDF"
      : upload.file.type.includes("spreadsheet")
        ? "Parsing workbook"
        : upload.file.type.includes("wordprocessingml")
          ? "Parsing document"
          : "Processing upload";
  const pageLabel =
    currentPage !== null && estimatedPages !== null
      ? ` · page ${currentPage} of ~${estimatedPages}`
      : "";
  return {
    label: `${stage}${pageLabel} · ${elapsedSeconds}s elapsed`,
    elapsedSeconds,
    currentPage,
    estimatedPages,
  };
}

export function buildUploadParsedPreview(
  upload: Pick<PendingUpload, "estimatedPages" | "ref" | "status">,
): UploadParsedPreview | null {
  if (upload.status !== "done" || !upload.ref) return null;
  const rawPreview = upload.ref.extracted_text_preview?.trim() ?? "";
  const snippet = rawPreview
    ? rawPreview.length > 200
      ? `${rawPreview.slice(0, 200).trimEnd()}...`
      : rawPreview
    : "No readable text extracted.";
  return {
    snippet,
    pageSignal:
      typeof upload.ref.parse_metadata?.page_count === "number"
        ? `Pages: ${upload.ref.parse_metadata.page_count}`
        : upload.estimatedPages === null
          ? "Pages: not reported"
          : `Pages: ~${upload.estimatedPages} estimated`,
    tableSignal:
      typeof upload.ref.parse_metadata?.table_count === "number"
        ? `Tables: ${upload.ref.parse_metadata.table_count}`
        : "Tables: not reported",
    hasExtractedText: rawPreview.length > 0,
    rawModeEscape: upload.ref.parse_metadata?.raw_mode_escape ?? null,
    rawModeRequested: Boolean(upload.ref.raw_mode_requested),
  };
}

// ── Component ─────────────────────────────────────────────────────────────

export function AgentDock(props: AgentDockProps) {
  const {
    agent: rawAgent,
    surface,
    layout = "dock",
    variant = "standard",
    quietReviewChrome = false,
    defaultMode = "side-rail",
    disableStoredMode = false,
    collapsedRestoreMode,
    surfaceContext: rawSurfaceContext,
    initialQuote: rawInitialQuote,
    suggestedActions: rawSuggestedActions = [],
    keepSuggestedActionsVisible = false,
    placeholder: rawPlaceholder,
    thread: rawThread,
    onMessage,
    workspace,
    minLeftPx = 320,
    defaultLeftPercent = 38,
    expandedWidth,
    expandedMaxWidth,
    preserveVisibleText = false,
    collapsedSummary,
    collapsedChipStyle,
    isAgentBusy: isAgentBusyOverride,
  } = props;
  const displayAgentName = "aVa";

  const isMovesSurface = surface.startsWith("moves/");
  const agent = preserveVisibleText
    ? rawAgent
    : sanitizeVisibleStrings(rawAgent);
  const surfaceContext = preserveVisibleText
    ? rawSurfaceContext
    : sanitizeVisibleStrings(rawSurfaceContext);
  const initialQuote = rawInitialQuote
    ? preserveVisibleText
      ? rawInitialQuote
      : demoSafeClientText(rawInitialQuote)
    : rawInitialQuote;
  const safeSuggestedActions = preserveVisibleText
    ? rawSuggestedActions
    : sanitizeVisibleStrings(rawSuggestedActions);
  const suggestedActions = isMovesSurface
    ? normalizeMovesChromeText(safeSuggestedActions)
    : safeSuggestedActions;
  const placeholder = rawPlaceholder
    ? preserveVisibleText
      ? rawPlaceholder
      : demoSafeClientText(rawPlaceholder)
    : rawPlaceholder;
  const safeThread = preserveVisibleText
    ? rawThread
    : sanitizeVisibleStrings(rawThread);
  const thread = isMovesSurface
    ? normalizeMovesChromeText(safeThread)
    : safeThread;
  const focused = variant === "focused";
  const chatOnly = layout === "chat-only";
  const showReviewChrome = !focused && !quietReviewChrome;

  // Founder feedback 2026-05-10: 'while any agent is busy retrieving info,
  // it will be nice to show a spinning icon / throbber or similar to show
  // it is busy working.' AtlasPageStateProvider already exposes the
  // streaming + context-bundle-assembling flags; we read them here so any
  // surface mounted inside the provider gets the throbber for free, with
  // an explicit prop override for callers that wire their own state.
  const atlasPageState = useAtlasPageState();
  const isAgentBusy =
    typeof isAgentBusyOverride === "boolean"
      ? isAgentBusyOverride
      : Boolean(
          atlasPageState &&
          (atlasPageState.isStreaming ||
            atlasPageState.isAssemblingContextBundle),
        );

  // Mode state (persisted)
  const [mode, setModeState] = useState<DockMode>(defaultMode);
  const previousSurfaceRef = useRef(surface);
  // Last non-collapsed mode — used when restoring from the floating chip.
  const [lastRichMode, setLastRichMode] = useState<DockMode>(
    defaultMode === "collapsed"
      ? resolveCollapsedRestoreMode(defaultMode, collapsedRestoreMode)
      : defaultMode,
  );

  useEffect(() => {
    previousSurfaceRef.current = surface;
    const nextMode = disableStoredMode
      ? defaultMode
      : (readStoredMode(surface) ?? defaultMode);
    setModeState(nextMode);
    setLastRichMode(
      nextMode === "collapsed"
        ? resolveCollapsedRestoreMode(defaultMode, collapsedRestoreMode)
        : nextMode,
    );
  }, [collapsedRestoreMode, defaultMode, disableStoredMode, surface]);

  const setMode = useCallback(
    (next: DockMode) => {
      setModeState(next);
      if (!disableStoredMode) writeStoredMode(surface, next);
      if (next !== "collapsed") setLastRichMode(next);
    },
    [disableStoredMode, surface],
  );

  // Esc closes (collapses)
  useEffect(() => {
    if (mode !== "expand") return;
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape")
        setMode(lastRichMode === "expand" ? "side-rail" : lastRichMode);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, lastRichMode, setMode]);

  // Composer state
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const threadScrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);

  // Outer-shell ref for measuring the dock's natural top y-offset for
  // height calculations. Sticky top intentionally uses a stable shell
  // chrome offset, not this measured value.
  const shellRef = useRef<HTMLDivElement | null>(null);
  useDockSelfTop(shellRef);

  // Uploads
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const [draggingOver, setDraggingOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sessionExportPending, setSessionExportPending] =
    useState<AvaChatSessionExportFormat | null>(null);
  const [sessionExportStatus, setSessionExportStatus] = useState("");
  const [uploadProgressNowMs, setUploadProgressNowMs] = useState(() =>
    Date.now(),
  );

  const anyUploading = uploads.some((u) => u.status === "uploading");
  const sendDisabled =
    submitting ||
    anyUploading ||
    (draft.trim().length === 0 && uploads.length === 0);
  const canExportSession =
    thread.length > 0 &&
    thread.some(
      (turn) => turn.body.trim().length > 0 || Boolean(turn.agentAnswer),
    );
  const sessionExportPayload = useMemo(
    () => buildChatSessionExport(surface, thread),
    [surface, thread],
  );
  const runSessionExport = useCallback(
    async (format: AvaChatSessionExportFormat) => {
      if (!canExportSession) return;
      setSessionExportPending(format);
      setSessionExportStatus("");
      try {
        submitChatSessionExport(sessionExportPayload, format);
        setSessionExportStatus("Ready");
      } catch {
        setSessionExportStatus("Failed");
      } finally {
        setSessionExportPending(null);
      }
    },
    [canExportSession, sessionExportPayload],
  );

  // Auto-grow textarea (cap ~6 rows / 160px)
  const onChangeDraft = useCallback((value: string) => {
    setDraft(value);
    const ta = inputRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    }
  }, []);

  // Scroll only the dock's internal thread pane. DOM-level scrollIntoView()
  // can move the hosting admin page when this dock is embedded in /admin.
  useEffect(() => {
    if (thread.length === 0 && !isAgentBusy) return;
    const scroller = threadScrollRef.current;
    if (scroller) {
      scroller.scrollTop = scroller.scrollHeight;
    }
  }, [thread.length, isAgentBusy]);

  useEffect(() => {
    if (!anyUploading) return;
    setUploadProgressNowMs(Date.now());
    const timer = window.setInterval(() => {
      setUploadProgressNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [anyUploading]);

  // Submit
  const submit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();
      const trimmed = draft.trim();
      const refs = uploads
        .filter(
          (u): u is PendingUpload & { ref: AttachmentRef } =>
            u.status === "done" && !!u.ref,
        )
        .map((u) => u.ref);
      if (trimmed.length === 0 && refs.length === 0) return;
      setDraft("");
      setUploads([]);
      const ta = inputRef.current;
      if (ta) ta.style.height = "auto";
      try {
        setSubmitting(true);
        await onMessage(trimmed, refs);
      } finally {
        setSubmitting(false);
      }
    },
    [draft, uploads, onMessage],
  );

  const submitSuggestedAction = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || submitting) return;
      setDraft("");
      const ta = inputRef.current;
      if (ta) ta.style.height = "auto";
      try {
        setSubmitting(true);
        await onMessage(trimmed, []);
      } finally {
        setSubmitting(false);
      }
    },
    [onMessage, submitting],
  );

  // ── Upload handling ─────────────────────────────────────────────────────

  const startUploads = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;
      const allowed = list.filter((f) =>
        AGENT_DOCK_MIME_ALLOWLIST.includes(f.type),
      );
      const nextPending: PendingUpload[] = allowed.map((file) => ({
        localId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        status: "uploading",
        startedAtMs: Date.now(),
        estimatedPages: estimateUploadParsePages(file),
      }));
      if (nextPending.length === 0) return;
      setUploads((prev) => [...prev, ...nextPending]);

      // Fire each upload independently so a single slow file doesn't block.
      for (const pending of nextPending) {
        const fd = new FormData();
        fd.append("file", pending.file);
        fd.append("surface", surface);
        fd.append("agent", agent.name.toLowerCase());
        if (surfaceContext) {
          fd.append("surfaceContext", JSON.stringify(surfaceContext));
        }
        void fetch("/api/v1/agent/attachments", {
          method: "POST",
          body: fd,
        })
          .then(async (res) => {
            if (!res.ok) {
              const errBody = (await res.json().catch(() => ({}))) as {
                error?: string;
              };
              throw new Error(errBody.error ?? `upload_failed_${res.status}`);
            }
            return (await res.json()) as AttachmentRef;
          })
          .then((ref) => {
            setUploads((prev) =>
              prev.map((u) =>
                u.localId === pending.localId
                  ? { ...u, status: "done", ref }
                  : u,
              ),
            );
          })
          .catch((err: unknown) => {
            const message =
              err instanceof Error ? err.message : "upload_failed";
            setUploads((prev) =>
              prev.map((u) =>
                u.localId === pending.localId
                  ? { ...u, status: "error", errorMessage: message }
                  : u,
              ),
            );
          });
      }
    },
    [agent.name, surface, surfaceContext],
  );

  const removeUpload = useCallback((localId: string) => {
    setUploads((prev) => prev.filter((u) => u.localId !== localId));
  }, []);

  const requestRawMode = useCallback((localId: string) => {
    setUploads((prev) =>
      prev.map((u) => {
        const rawMode = u.ref?.parse_metadata?.raw_mode_escape;
        if (
          u.localId !== localId ||
          u.status !== "done" ||
          !u.ref ||
          !rawMode?.eligible
        ) {
          return u;
        }
        return {
          ...u,
          ref: {
            ...u.ref,
            raw_mode_requested: {
              acknowledged_at: new Date().toISOString(),
              parser_bug_ticket_id: rawMode.parser_bug_ticket_id,
              estimated_tokens_per_turn: rawMode.estimated_tokens_per_turn,
            },
          },
        };
      }),
    );
  }, []);

  // Drag-drop handlers (cover the entire dock panel)
  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDraggingOver(true);
  }, []);
  const onDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    if (e.currentTarget === e.target) setDraggingOver(false);
  }, []);
  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDraggingOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        startUploads(e.dataTransfer.files);
      }
    },
    [startUploads],
  );

  // ── Dock chrome (header / mode picker / chip) ──────────────────────────

  const dockId = useId();

  const onComposerKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void submit();
      }
    },
    [submit],
  );
  const collapsedSummaryLabel = collapsedSummary?.label;
  const collapsedSummaryDetail = collapsedSummary?.detail;
  const collapsedRestoreLabel = collapsedSummaryDetail
    ? `${collapsedSummaryLabel ?? displayAgentName}: ${collapsedSummaryDetail}`
    : `Restore ${collapsedSummaryLabel ?? displayAgentName} chat`;
  const visibleSuggestedActions = useMemo(
    () =>
      focused && thread.length > 0 && !keepSuggestedActionsVisible
        ? []
        : suggestedActions,
    [focused, keepSuggestedActionsVisible, suggestedActions, thread.length],
  );

  // Render the chat panel inner — used by every mode (side-rail, pin-*,
  // expand). The collapsed mode renders the floating chip instead.
  const chatPanel = useMemo(() => {
    return (
      <div
        ref={dropZoneRef}
        data-testid="agent-dock-panel"
        data-mode={mode}
        data-dragging={draggingOver ? "true" : "false"}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          ...PANEL_STYLE,
          ...(focused ? FOCUSED_PANEL_STYLE : null),
          ...(chatOnly ? CHAT_ONLY_PANEL_STYLE : null),
          outline: draggingOver
            ? `2px dashed ${CANVAS.SPLITTER_ACTIVE}`
            : "none",
          outlineOffset: -2,
          background: draggingOver ? "rgba(12,26,58,0.04)" : CANVAS.CHAT_BG,
        }}
      >
        {/* Spinner keyframes are scoped to this dock instance. */}
        <style>{`
          @keyframes agent-dock-spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          .agent-dock-spinner {
            animation: agent-dock-spin 800ms linear infinite;
          }
        `}</style>
        {/* Header */}
        {chatOnly && thread.length === 0 ? null : (
          <div style={chatOnly ? CHAT_ONLY_HEADER_STYLE : HEADER_STYLE}>
            <div style={AGENT_ROW_STYLE}>
              <AvaAskMark
                variant="wordmark-dark"
                style={AGENT_WORDMARK_STYLE}
              />
              <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
                <span style={AGENT_ROLE_STYLE}>{agent.role}</span>
              </div>
            </div>
            <div style={HEADER_ACTIONS_STYLE}>
              {canExportSession ? (
                <SessionExportActions
                  pending={sessionExportPending}
                  status={sessionExportStatus}
                  onExport={runSessionExport}
                />
              ) : null}
              {chatOnly ? null : (
                <ModePicker mode={mode} onChange={setMode} dockId={dockId} />
              )}
            </div>
          </div>
        )}

        {/* Optional quote */}
        {initialQuote ? (
          <div style={QUOTE_STYLE} aria-label="Quoted context">
            <span style={QUOTE_LABEL_STYLE}>In reply to</span>
            <span style={QUOTE_BODY_STYLE}>{initialQuote}</span>
          </div>
        ) : null}

        {/* Thread */}
        <div
          ref={threadScrollRef}
          style={{
            ...(focused ? FOCUSED_THREAD_STYLE : THREAD_STYLE),
            ...(chatOnly ? CHAT_ONLY_THREAD_STYLE : null),
            ...(chatOnly && thread.length === 0
              ? CHAT_ONLY_EMPTY_THREAD_STYLE
              : null),
          }}
          data-testid="agent-dock-thread"
        >
          {thread.length === 0 ? (
            <div
              style={chatOnly ? CHAT_ONLY_EMPTY_STATE_STYLE : EMPTY_STATE_STYLE}
            >
              {chatOnly ? (
                <AvaAskMark
                  variant="wordmark-dark"
                  style={CHAT_ONLY_EMPTY_MARK_STYLE}
                />
              ) : null}
              <p
                style={
                  chatOnly ? CHAT_ONLY_EMPTY_TITLE_STYLE : EMPTY_TITLE_STYLE
                }
              >
                Ask {displayAgentName} anything.
              </p>
              <p
                style={
                  chatOnly
                    ? CHAT_ONLY_EMPTY_SUBTITLE_STYLE
                    : EMPTY_SUBTITLE_STYLE
                }
              >
                {agent.role}
              </p>
            </div>
          ) : (
            thread.map((turn) => (
              <div
                key={turn.id}
                data-testid={`agent-dock-turn-${turn.role}`}
                style={
                  turn.role === "user"
                    ? focused
                      ? FOCUSED_USER_TURN_STYLE
                      : USER_TURN_STYLE
                    : AGENT_TURN_STYLE
                }
              >
                {turn.role === "agent" ? (
                  <div style={AGENT_BYLINE_STYLE}>{displayAgentName}</div>
                ) : null}
                <div style={BUBBLE_STYLE}>
                  {turn.role === "agent" ? (
                    <AgentMarkdown
                      text={visibleAgentDockBody(
                        surface,
                        turn.body,
                        turn.agentAnswer,
                        preserveVisibleText,
                      )}
                    />
                  ) : (
                    turn.body
                  )}
                </div>
                {showReviewChrome &&
                turn.role === "agent" &&
                surface !== "intelligence" &&
                turn.citations &&
                turn.citations.length > 0 ? (
                  <EvidenceBasis citations={turn.citations} />
                ) : null}
                {turn.role === "agent" &&
                shouldRenderAvaArtifactsInDock(surface, turn.agentAnswer) ? (
                  <div style={{ marginTop: 12 }}>
                    <AgentAnswerRenderer
                      answer={turn.agentAnswer}
                      showChrome={!focused}
                      showProse={!focused}
                      preserveOutput={preserveVisibleText}
                    />
                  </div>
                ) : null}
                {!focused && turn.role === "agent" && turn.feedbackEventId ? (
                  <div style={FEEDBACK_ROW_STYLE}>
                    <SynthesisFeedbackWidget
                      synthesisId={turn.feedbackEventId}
                      surface={
                        surface === "intelligence" ? "sentinel" : "program"
                      }
                    />
                  </div>
                ) : null}
              </div>
            ))
          )}
          {/* Throbber: shown whenever the agent is busy and there's no
              streaming agent turn yet visible. We hide it once an agent
              turn with body has appeared so we don't double-up the
              indicator next to the streaming text. */}
          {isAgentBusy &&
          (thread.length === 0 ||
            thread[thread.length - 1].role === "user" ||
            (thread[thread.length - 1].role === "agent" &&
              thread[thread.length - 1].body.trim().length === 0)) ? (
            <div
              data-testid="agent-dock-throbber"
              aria-live="polite"
              style={AGENT_TURN_STYLE}
            >
              <div style={AGENT_BYLINE_STYLE}>{displayAgentName}</div>
              <div
                style={{
                  ...BUBBLE_STYLE,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <AgentBusyThrobber />
                <span style={{ fontStyle: "italic", opacity: 0.75 }}>
                  Working — retrieving tenant context and forming a view…
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Suggested actions */}
        {visibleSuggestedActions.length > 0 ? (
          <div style={SUGGESTIONS_STYLE} aria-label="Suggested actions">
            <div style={SUGGESTIONS_LABEL_STYLE}>Suggested questions</div>
            {visibleSuggestedActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => {
                  if (action.onClick) {
                    action.onClick();
                  } else {
                    void submitSuggestedAction(action.body);
                  }
                }}
                disabled={submitting}
                data-testid={`agent-dock-suggestion-${action.id}`}
                style={SUGGESTION_BUTTON_STYLE}
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}

        {/* Pending attachment chips */}
        {uploads.length > 0 ? (
          <div style={CHIPS_ROW_STYLE} data-testid="agent-dock-chips">
            {uploads.map((u) => (
              <UploadChip
                key={u.localId}
                upload={u}
                progress={buildUploadParsingProgress(u, uploadProgressNowMs)}
                parsedPreview={buildUploadParsedPreview(u)}
                onRemove={() => removeUpload(u.localId)}
                onRequestRawMode={() => requestRawMode(u.localId)}
              />
            ))}
          </div>
        ) : null}

        <div
          style={COMPOSER_DISCLAIMER_STYLE}
          data-testid="agent-dock-disclaimer"
        >
          aVa can make mistakes. Check important info.
        </div>

        {/* Composer */}
        <form
          onSubmit={submit}
          style={INPUT_FORM_STYLE}
          aria-label={`Ask ${displayAgentName}`}
          data-testid="agent-dock-form"
        >
          <button
            type="button"
            aria-label="Attach files"
            data-testid="agent-dock-attach"
            onClick={() => fileInputRef.current?.click()}
            disabled={submitting}
            style={ATTACH_BUTTON_STYLE}
          >
            <span aria-hidden="true" style={ATTACH_PLUS_STYLE}>
              +
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={AGENT_DOCK_MIME_ALLOWLIST.join(",")}
            multiple
            data-testid="agent-dock-file-input"
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files) startUploads(e.target.files);
              // Reset so re-selecting the same file fires onChange again.
              e.target.value = "";
            }}
          />
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => onChangeDraft(e.target.value)}
            onKeyDown={onComposerKeyDown}
            placeholder={placeholder ?? `Ask ${displayAgentName}…`}
            rows={1}
            spellCheck
            disabled={submitting}
            data-testid="agent-dock-input"
            style={INPUT_STYLE}
          />
          <button
            type="submit"
            disabled={sendDisabled}
            aria-label="Send message"
            data-testid="agent-dock-send"
            style={{
              ...SUBMIT_BUTTON_STYLE,
              opacity: sendDisabled ? 0.45 : 1,
              cursor: sendDisabled ? "not-allowed" : "pointer",
            }}
          >
            ↑
          </button>
        </form>
        {showReviewChrome ? (
          <>
            <div style={ACTION_APPROVAL_NOTICE_WRAP_STYLE}>
              <AgentActionApprovalNotice compact />
            </div>
            <div style={RESPONSIBILITY_FOOTER_WRAP_STYLE}>
              <AIResponsibilityFooter compact />
            </div>
          </>
        ) : null}
      </div>
    );
  }, [
    agent,
    chatOnly,
    dockId,
    draft,
    draggingOver,
    focused,
    initialQuote,
    isAgentBusy, // throbber visibility flips when this changes
    mode,
    onChangeDraft,
    onComposerKeyDown,
    canExportSession,
    placeholder,
    preserveVisibleText,
    onDragLeave,
    onDragOver,
    onDrop,
    removeUpload,
    requestRawMode,
    runSessionExport,
    sendDisabled,
    sessionExportPending,
    sessionExportStatus,
    setMode,
    showReviewChrome,
    submitSuggestedAction,
    surface,
    startUploads,
    submit,
    submitting,
    thread,
    uploads,
    uploadProgressNowMs,
    visibleSuggestedActions,
  ]);

  // ── Render by mode ──────────────────────────────────────────────────────

  if (chatOnly) {
    return (
      <main
        ref={shellRef}
        data-testid="agent-dock-chat-only-shell"
        style={CHAT_ONLY_SHELL_STYLE}
      >
        {chatPanel}
      </main>
    );
  }

  if (mode === "collapsed") {
    const restoreMode =
      lastRichMode === "collapsed"
        ? resolveCollapsedRestoreMode(defaultMode, collapsedRestoreMode)
        : lastRichMode;
    return (
      <>
        {workspace}
        <button
          type="button"
          aria-label={collapsedRestoreLabel}
          data-testid="agent-dock-collapsed-chip"
          onClick={() => setMode(restoreMode)}
          onDoubleClick={() => setMode(restoreMode)}
          style={{ ...COLLAPSED_CHIP_STYLE, ...collapsedChipStyle }}
        >
          <span style={COLLAPSED_CHIP_INITIALS_STYLE}>
            <AvaAskMark
              variant="wordmark-light"
              style={{ width: 42, minWidth: 42 }}
            />
          </span>
        </button>
      </>
    );
  }

  if (mode === "side-rail" || mode === "side-rail-right") {
    // The dock is always viewport-bounded — height is NEVER inherited from
    // the workspace pane. This guarantees the composer is always above the
    // fold even when the workspace renders a 3000px-tall scroll body.
    //
    // The shell self-measures its natural viewport-top y-offset for height.
    // Sticky top remains the stable chrome offset so the dock cannot feed
    // its own current position back into its sticky point.
    const dockOnRight = mode === "side-rail-right";
    return (
      <div
        ref={shellRef}
        data-testid="agent-dock-side-rail-shell"
        data-side={dockOnRight ? "right" : "left"}
        style={SIDE_RAIL_SHELL_STYLE}
      >
        <ResizableSplitter
          left={
            dockOnRight ? (
              <div style={WORKSPACE_PANE_STYLE}>{workspace}</div>
            ) : (
              chatPanel
            )
          }
          right={
            dockOnRight ? (
              chatPanel
            ) : (
              <div style={WORKSPACE_PANE_STYLE}>{workspace}</div>
            )
          }
          defaultLeftPercent={
            dockOnRight ? 100 - defaultLeftPercent : defaultLeftPercent
          }
          minLeftPx={minLeftPx}
          minRightPx={Math.max(420, minLeftPx)}
          storageKey={splitStorageKey(surface)}
        />
      </div>
    );
  }

  if (mode === "pin-bottom" || mode === "pin-top") {
    const pinTop = mode === "pin-top";
    return (
      <div
        ref={shellRef}
        style={PIN_LAYOUT_STYLE}
        data-testid="agent-dock-pin-shell"
      >
        {pinTop ? (
          <div style={PIN_PANEL_STYLE_TOP} data-testid="agent-dock-pin-top">
            {chatPanel}
          </div>
        ) : null}
        <div style={WORKSPACE_PANE_STYLE}>{workspace}</div>
        {!pinTop ? (
          <div
            style={PIN_PANEL_STYLE_BOTTOM}
            data-testid="agent-dock-pin-bottom"
          >
            {chatPanel}
          </div>
        ) : null}
      </div>
    );
  }

  // expand
  return (
    <>
      <div style={WORKSPACE_PANE_STYLE}>{workspace}</div>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${displayAgentName} expanded chat`}
        data-testid="agent-dock-expand-overlay"
        style={EXPAND_OVERLAY_STYLE}
      >
        <div
          style={{
            ...EXPAND_PANEL_STYLE,
            ...(expandedWidth ? { width: expandedWidth } : null),
            ...(expandedMaxWidth ? { maxWidth: expandedMaxWidth } : null),
          }}
        >
          {chatPanel}
        </div>
      </div>
    </>
  );
}

interface SessionExportActionsProps {
  pending: AvaChatSessionExportFormat | null;
  status: string;
  onExport: (format: AvaChatSessionExportFormat) => void | Promise<void>;
}

function SessionExportActions({
  pending,
  status,
  onExport,
}: SessionExportActionsProps) {
  return (
    <div aria-label="Export chat session" style={SESSION_EXPORT_STYLE}>
      <button
        type="button"
        aria-label="Export chat session as HTML"
        title="Export session as HTML"
        disabled={pending !== null}
        onClick={() => void onExport("html")}
        style={SESSION_EXPORT_BUTTON_STYLE}
      >
        {pending === "html" ? "..." : "HTML"}
      </button>
      <button
        type="button"
        aria-label="Export chat session as PDF"
        title="Export session as PDF"
        disabled={pending !== null}
        onClick={() => void onExport("pdf")}
        style={SESSION_EXPORT_BUTTON_STYLE}
      >
        {pending === "pdf" ? "..." : "PDF"}
      </button>
      {status ? (
        <span style={SESSION_EXPORT_STATUS_STYLE}>{status}</span>
      ) : null}
    </div>
  );
}

// ── Mode picker ───────────────────────────────────────────────────────────

interface ModePickerProps {
  mode: DockMode;
  onChange: (mode: DockMode) => void;
  dockId: string;
}

function ModePicker({ mode, onChange, dockId }: ModePickerProps) {
  return (
    <div
      aria-label="Chat window actions"
      data-testid="agent-dock-mode-picker"
      style={MODE_PICKER_STYLE}
    >
      {/* Pin-right (side-rail-right) */}
      <ModeButton
        mode="side-rail-right"
        active={mode === "side-rail-right"}
        onClick={() =>
          onChange(mode === "side-rail-right" ? "side-rail" : "side-rail-right")
        }
        aria-label="Pin right"
        title="Pin right"
        dockId={dockId}
      >
        <SideRailRightIcon />
      </ModeButton>
      {/* Pin-bottom */}
      <ModeButton
        mode="pin-bottom"
        active={mode === "pin-bottom"}
        onClick={() =>
          onChange(mode === "pin-bottom" ? "side-rail" : "pin-bottom")
        }
        aria-label="Pin bottom"
        title="Pin bottom"
        dockId={dockId}
      >
        <PinBottomIcon />
      </ModeButton>
      {/* Expand / restore */}
      {mode === "expand" ? (
        <ModeButton
          mode="side-rail"
          active={false}
          onClick={() => onChange("side-rail")}
          aria-label="Return to page"
          title="Return to page"
          dockId={dockId}
        >
          <SideRailIcon />
        </ModeButton>
      ) : (
        <ModeButton
          mode="expand"
          active={false}
          onClick={() => onChange("expand")}
          aria-label="Expand chat"
          title="Expand chat"
          dockId={dockId}
        >
          <MaximizeIcon />
        </ModeButton>
      )}
      <ModeButton
        mode="collapsed"
        active={false}
        onClick={() => onChange("collapsed")}
        aria-label="Close chat"
        title="Close chat"
        dockId={dockId}
      >
        <CloseIcon />
      </ModeButton>
    </div>
  );
}

interface ModeButtonProps {
  mode: DockMode;
  active: boolean;
  onClick: () => void;
  ["aria-label"]: string;
  title: string;
  children: ReactNode;
  dockId: string;
}

function ModeButton({
  mode,
  active,
  onClick,
  "aria-label": ariaLabel,
  title,
  children,
  dockId,
}: ModeButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={title}
      onClick={onClick}
      data-testid={`agent-dock-mode-${mode}`}
      data-active={active ? "true" : "false"}
      data-dock-id={dockId}
      style={{
        ...MODE_BUTTON_STYLE,
        background: active ? "rgba(12,26,58,0.08)" : "transparent",
        color: active ? CANVAS.INK : CANVAS.GRAY_DK,
      }}
    >
      {children}
    </button>
  );
}

// ── Upload chip ───────────────────────────────────────────────────────────

interface UploadChipProps {
  upload: PendingUpload;
  progress: UploadParsingProgress | null;
  parsedPreview: UploadParsedPreview | null;
  onRemove: () => void;
  onRequestRawMode: () => void;
}

function UploadChip({
  upload,
  progress,
  parsedPreview,
  onRemove,
  onRequestRawMode,
}: UploadChipProps) {
  const sizeLabel = formatBytes(upload.file.size);
  const isError = upload.status === "error";
  const isUploading = upload.status === "uploading";
  return (
    <span
      data-testid={`agent-dock-chip-${upload.localId}`}
      data-status={upload.status}
      aria-label={
        progress
          ? `${upload.file.name}: ${progress.label}`
          : `${upload.file.name}: ${upload.status}`
      }
      style={{
        ...CHIP_STYLE,
        borderColor: isError ? "#FCA5A5" : CANVAS.RULE,
        background: isError ? "#FEE2E2" : CANVAS.CARD,
        color: isError ? "#991B1B" : CANVAS.INK,
      }}
    >
      {isUploading ? (
        <span
          aria-hidden="true"
          style={CHIP_SPINNER_STYLE}
          data-testid={`agent-dock-chip-spinner-${upload.localId}`}
          className="agent-dock-spinner"
        />
      ) : null}
      <span style={CHIP_TEXT_STACK_STYLE}>
        <span style={CHIP_MAIN_ROW_STYLE}>
          <span style={CHIP_NAME_STYLE} title={upload.file.name}>
            {upload.file.name}
          </span>
          <span style={CHIP_SIZE_STYLE}>{sizeLabel}</span>
        </span>
        {progress ? (
          <span
            style={CHIP_PROGRESS_STYLE}
            aria-live="polite"
            data-testid={`agent-dock-chip-progress-${upload.localId}`}
          >
            {progress.label}
          </span>
        ) : null}
        {parsedPreview ? (
          <span
            style={{
              ...CHIP_PREVIEW_STYLE,
              color: parsedPreview.hasExtractedText
                ? CANVAS.INK
                : CANVAS.GRAY_DK,
            }}
            data-testid={`agent-dock-chip-preview-${upload.localId}`}
          >
            <span style={CHIP_PREVIEW_LABEL_STYLE}>Parsed preview</span>
            <span>{parsedPreview.snippet}</span>
            <span style={CHIP_PREVIEW_META_STYLE}>
              {parsedPreview.pageSignal} · {parsedPreview.tableSignal}
            </span>
            {parsedPreview.rawModeEscape?.eligible ? (
              <span style={CHIP_RAW_MODE_STYLE}>
                <span>{parsedPreview.rawModeEscape.cost_warning}</span>
                {parsedPreview.rawModeRequested ? (
                  <span
                    data-testid={`agent-dock-chip-raw-mode-requested-${upload.localId}`}
                    style={CHIP_RAW_MODE_STATUS_STYLE}
                  >
                    Raw mode requested · ticket{" "}
                    {parsedPreview.rawModeEscape.parser_bug_ticket_id}
                  </span>
                ) : (
                  <button
                    type="button"
                    data-testid={`agent-dock-chip-raw-mode-${upload.localId}`}
                    onClick={onRequestRawMode}
                    style={CHIP_RAW_MODE_BUTTON_STYLE}
                  >
                    Use raw mode
                  </button>
                )}
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
      {isError ? (
        <span
          style={CHIP_ERROR_STYLE}
          title={upload.errorMessage ?? "Upload failed"}
        >
          failed
        </span>
      ) : null}
      <button
        type="button"
        aria-label={`Remove ${upload.file.name}`}
        onClick={onRemove}
        style={CHIP_REMOVE_STYLE}
        data-testid={`agent-dock-chip-remove-${upload.localId}`}
      >
        ×
      </button>
    </span>
  );
}

function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Inline icons ──────────────────────────────────────────────────────────

function SideRailIcon() {
  // PanelLeft-equivalent
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}
function SideRailRightIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}
function PinBottomIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="14" width="18" height="7" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="12" y1="3" x2="12" y2="10" />
    </svg>
  );
}
function MaximizeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

// Side-rail shell — viewport-bounded so the dock never grows with its
// workspace sibling. The shell sets an explicit, viewport-relative height
// regardless of how tall the workspace flex pane renders, so the composer
// can never end up below the fold.
//
//   height:    calc(100vh - top - bottom)   // safe default, every browser
//   maxHeight: calc(100dvh - top - bottom)  // mobile-aware upper bound
//
// `100dvh` accounts for mobile address-bar collapse — when the bar hides,
// dvh shrinks the cap so the composer remains in view. Older browsers
// without dvh ignore the maxHeight and fall back to the vh height.
//
// **Offset resolution order**
//   Sticky top:
//     1. `--agent-dock-sticky-top` — explicit page override.
//     2. `--agent-dock-top-offset` — legacy shell-chrome override.
//     3. `72px` — NexusTopNav baseline.
//   Height subtractor:
//     1. `--agent-dock-self-top` — measured natural top for the mounted dock.
//     2. `--agent-dock-top-offset`.
//     3. `72px`.
//
// Separating sticky top from measured height prevents the dock's own
// natural position from being fed back into `position: sticky; top:`.
const SIDE_RAIL_SHELL_STYLE: CSSProperties = {
  position: "sticky",
  top: "var(--agent-dock-sticky-top, var(--agent-dock-top-offset, 72px))",
  display: "flex",
  alignItems: "stretch",
  width: "100%",
  height:
    "calc(100vh - var(--agent-dock-self-top, var(--agent-dock-top-offset, 72px)) - var(--agent-dock-bottom-padding, 0px))",
  maxHeight:
    "calc(100dvh - var(--agent-dock-self-top, var(--agent-dock-top-offset, 72px)) - var(--agent-dock-bottom-padding, 0px))",
  minHeight: 0,
  overflow: "hidden",
};

const CHAT_ONLY_SHELL_STYLE: CSSProperties = {
  position: "sticky",
  top: "var(--agent-dock-sticky-top, var(--agent-dock-top-offset, 72px))",
  display: "flex",
  justifyContent: "center",
  width: "100%",
  height:
    "calc(100vh - var(--agent-dock-self-top, var(--agent-dock-top-offset, 72px)) - var(--agent-dock-bottom-padding, 0px))",
  maxHeight:
    "calc(100dvh - var(--agent-dock-self-top, var(--agent-dock-top-offset, 72px)) - var(--agent-dock-bottom-padding, 0px))",
  minHeight: 0,
  overflow: "hidden",
  background: "#FFFFFF",
};

const PANEL_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  width: "100%",
  background: CANVAS.CHAT_BG,
  borderRight: `1px solid ${CANVAS.HAIRLINE}`,
  minHeight: 0,
  overflow: "hidden",
  position: "relative",
};

const FOCUSED_PANEL_STYLE: CSSProperties = {
  background: "#FFFFFF",
  borderRight: `1px solid ${CANVAS.HAIRLINE}`,
};

const CHAT_ONLY_PANEL_STYLE: CSSProperties = {
  width: "min(100%, 1180px)",
  borderRight: "none",
  background: "#FFFFFF",
};

const HEADER_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "14px 18px 12px",
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  flexShrink: 0,
};

const CHAT_ONLY_HEADER_STYLE: CSSProperties = {
  ...HEADER_STYLE,
  padding: "12px 22px 10px",
  borderBottom: "none",
};

const HEADER_ACTIONS_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  flexShrink: 0,
};

const AGENT_ROW_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 12,
  minWidth: 0,
};

const AGENT_WORDMARK_STYLE: CSSProperties = {
  width: 62,
  height: "auto",
  flexShrink: 0,
};

const AGENT_ROLE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  color: CANVAS.INK_SOFT,
  lineHeight: 1.3,
};

const MODE_PICKER_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 2,
  padding: 2,
  borderRadius: 6,
  border: `1px solid ${CANVAS.HAIRLINE}`,
};

const SESSION_EXPORT_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
};

const SESSION_EXPORT_BUTTON_STYLE: CSSProperties = {
  appearance: "none",
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 5,
  background: "#FFFFFF",
  color: CANVAS.INK,
  cursor: "pointer",
  fontFamily: CANVAS.SANS,
  fontSize: 10,
  fontWeight: 700,
  lineHeight: 1,
  minWidth: 34,
  height: 24,
  padding: "0 7px",
};

const SESSION_EXPORT_STATUS_STYLE: CSSProperties = {
  color: CANVAS.GRAY_DK,
  fontFamily: CANVAS.SANS,
  fontSize: 10,
  minWidth: 32,
};

const MODE_BUTTON_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 26,
  height: 24,
  borderRadius: 4,
  border: "none",
  cursor: "pointer",
  transition: "background 120ms ease",
};

const QUOTE_STYLE: CSSProperties = {
  display: "grid",
  gap: 4,
  padding: "10px 18px",
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  background: "rgba(12,26,58,0.025)",
  flexShrink: 0,
};

const QUOTE_LABEL_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: CANVAS.GRAY_DK,
  fontWeight: 600,
};

const QUOTE_BODY_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 12.5,
  color: CANVAS.INK_SOFT,
  lineHeight: 1.5,
};

const THREAD_STYLE: CSSProperties = {
  flex: "1 1 auto",
  minHeight: 0,
  overflowY: "auto",
  padding: "20px 18px",
  display: "grid",
  gap: 14,
  alignContent: "start",
  // Same chat-panel background as the panel + composer so the three regions
  // never appear striped. User flagged this explicitly as "must be same
  // color background".
  background: CANVAS.CHAT_BG,
};

const FOCUSED_THREAD_STYLE: CSSProperties = {
  ...THREAD_STYLE,
  padding: "18px 18px 16px",
  gap: 16,
  background: "#FFFFFF",
};

const CHAT_ONLY_THREAD_STYLE: CSSProperties = {
  ...FOCUSED_THREAD_STYLE,
  padding: "22px 22px 18px",
  maxWidth: 1180,
  width: "100%",
  margin: "0 auto",
};

const CHAT_ONLY_EMPTY_THREAD_STYLE: CSSProperties = {
  justifyContent: "center",
  alignContent: "center",
  paddingBottom: 24,
};

const EMPTY_STATE_STYLE: CSSProperties = {
  paddingTop: 12,
  display: "grid",
  gap: 8,
};

const EMPTY_TITLE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SERIF,
  fontSize: 18,
  fontWeight: 400,
  color: CANVAS.INK,
  margin: 0,
};

const EMPTY_SUBTITLE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 12.5,
  lineHeight: 1.5,
  color: CANVAS.INK_SOFT,
  margin: 0,
  maxWidth: 520,
};

const CHAT_ONLY_EMPTY_STATE_STYLE: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: 12,
  textAlign: "center",
  padding: "0 20px",
};

const CHAT_ONLY_EMPTY_MARK_STYLE: CSSProperties = {
  width: 84,
  minWidth: 84,
  height: "auto",
};

const CHAT_ONLY_EMPTY_TITLE_STYLE: CSSProperties = {
  ...EMPTY_TITLE_STYLE,
  fontSize: 34,
  lineHeight: 1.1,
};

const CHAT_ONLY_EMPTY_SUBTITLE_STYLE: CSSProperties = {
  ...EMPTY_SUBTITLE_STYLE,
  maxWidth: 680,
  fontSize: 14,
  color: CANVAS.GRAY_DK,
};

const AGENT_TURN_STYLE: CSSProperties = {
  display: "grid",
  gap: 4,
};

const USER_TURN_STYLE: CSSProperties = {
  display: "grid",
  gap: 4,
  justifyItems: "end",
};

const FOCUSED_USER_TURN_STYLE: CSSProperties = {
  ...USER_TURN_STYLE,
  justifyItems: "end",
};

const AGENT_BYLINE_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: "0.10em",
  color: CANVAS.GRAY_DK,
  fontWeight: 600,
};

const BUBBLE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 14,
  lineHeight: 1.6,
  color: CANVAS.INK,
  wordBreak: "break-word",
  maxWidth: "100%",
};

const FEEDBACK_ROW_STYLE: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  paddingTop: 6,
};

const SUGGESTIONS_STYLE: CSSProperties = {
  display: "grid",
  gap: 6,
  padding: "12px 18px",
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
  flex: "0 0 auto",
  maxHeight: "min(28vh, 220px)",
  overflowY: "auto",
  overscrollBehavior: "contain",
  background: CANVAS.CHAT_BG,
  scrollPaddingBottom: 12,
};

const SUGGESTIONS_LABEL_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: CANVAS.GRAY_DK,
  marginBottom: 2,
};

const SUGGESTION_BUTTON_STYLE: CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "10px 12px",
  background: CANVAS.CARD,
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  lineHeight: 1.45,
  color: CANVAS.INK,
  cursor: "pointer",
  transition: "background 120ms ease, border-color 120ms ease",
};

const CHIPS_ROW_STYLE: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  padding: "8px 18px",
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
  flex: "0 0 auto",
  maxHeight: "min(22vh, 180px)",
  overflowY: "auto",
  overscrollBehavior: "contain",
  background: CANVAS.CHAT_BG,
};

const CHIP_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "flex-start",
  gap: 6,
  padding: "3px 8px",
  borderRadius: 6,
  border: `1px solid ${CANVAS.RULE}`,
  fontFamily: CANVAS.SANS,
  fontSize: 11.5,
  background: CANVAS.CARD,
  color: CANVAS.INK,
  maxWidth: "100%",
};

const CHIP_TEXT_STACK_STYLE: CSSProperties = {
  display: "grid",
  gap: 1,
  minWidth: 0,
};

const CHIP_MAIN_ROW_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  minWidth: 0,
};

const CHIP_NAME_STYLE: CSSProperties = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: 200,
};

const CHIP_SIZE_STYLE: CSSProperties = {
  color: CANVAS.GRAY_DK,
  fontFamily: CANVAS.MONO,
  fontSize: 10,
};

const CHIP_PROGRESS_STYLE: CSSProperties = {
  color: CANVAS.GRAY_DK,
  fontFamily: CANVAS.MONO,
  fontSize: 9.5,
  lineHeight: 1.25,
  whiteSpace: "nowrap",
};

const CHIP_PREVIEW_STYLE: CSSProperties = {
  display: "grid",
  gap: 2,
  maxWidth: 260,
  paddingTop: 3,
  fontSize: 10.5,
  lineHeight: 1.35,
};

const CHIP_PREVIEW_LABEL_STYLE: CSSProperties = {
  color: CANVAS.GRAY_DK,
  fontFamily: CANVAS.MONO,
  fontSize: 9.5,
  textTransform: "uppercase",
  letterSpacing: 0,
};

const CHIP_PREVIEW_META_STYLE: CSSProperties = {
  color: CANVAS.GRAY_DK,
  fontFamily: CANVAS.MONO,
  fontSize: 9.5,
};

const CHIP_RAW_MODE_STYLE: CSSProperties = {
  display: "grid",
  gap: 4,
  marginTop: 3,
  padding: "5px 6px",
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 6,
  background: "#FFF7ED",
  color: "#7C2D12",
};

const CHIP_RAW_MODE_BUTTON_STYLE: CSSProperties = {
  justifySelf: "start",
  border: "1px solid #FDBA74",
  borderRadius: 5,
  background: "#FFFFFF",
  color: "#9A3412",
  cursor: "pointer",
  fontFamily: CANVAS.MONO,
  fontSize: 9.5,
  padding: "3px 6px",
};

const CHIP_RAW_MODE_STATUS_STYLE: CSSProperties = {
  color: "#166534",
  fontFamily: CANVAS.MONO,
  fontSize: 9.5,
};

const CHIP_ERROR_STYLE: CSSProperties = {
  color: "#991B1B",
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const CHIP_REMOVE_STYLE: CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: CANVAS.GRAY_DK,
  fontSize: 14,
  lineHeight: 1,
  padding: 0,
  marginLeft: 2,
};

const CHIP_SPINNER_STYLE: CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 999,
  border: `2px solid ${CANVAS.RULE}`,
  borderTopColor: CANVAS.INK,
  display: "inline-block",
  animation: "agent-dock-spin 800ms linear infinite",
};

const COMPOSER_DISCLAIMER_STYLE: CSSProperties = {
  flex: "0 0 auto",
  padding: "8px 18px 6px",
  background: CANVAS.CHAT_BG,
  color: CANVAS.GRAY_DK,
  fontFamily: CANVAS.SANS,
  fontSize: 11,
  lineHeight: 1.3,
  textAlign: "center",
};

// Composer · a GPT-like unified input bar. `position: sticky` is retained as
// the last guardrail for cramped viewports: the thread and suggestion regions
// scroll above this bar instead of pushing it below the fold.
const INPUT_FORM_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  minHeight: 54,
  margin: "0 18px 14px",
  padding: "7px 8px",
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 999,
  background: CANVAS.CARD,
  boxShadow: "0 10px 30px rgba(12, 26, 58, 0.10)",
  flex: "0 0 auto",
  position: "sticky",
  bottom: 10,
  zIndex: 3,
};

const RESPONSIBILITY_FOOTER_WRAP_STYLE: CSSProperties = {
  padding: "0 18px 14px",
  background: CANVAS.CHAT_BG,
  flex: "0 0 auto",
};

const ACTION_APPROVAL_NOTICE_WRAP_STYLE: CSSProperties = {
  padding: "0 18px 8px",
  background: CANVAS.CHAT_BG,
  flex: "0 0 auto",
};

const ATTACH_BUTTON_STYLE: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 999,
  background: "transparent",
  color: CANVAS.INK_SOFT,
  border: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
};

const ATTACH_PLUS_STYLE: CSSProperties = {
  display: "block",
  fontFamily: CANVAS.SANS,
  fontSize: 28,
  fontWeight: 300,
  lineHeight: 1,
  transform: "translateY(-1px)",
};

const INPUT_STYLE: CSSProperties = {
  flex: 1,
  fontFamily: CANVAS.SANS,
  fontSize: 15,
  lineHeight: 1.5,
  padding: "8px 2px",
  borderRadius: 0,
  border: "none",
  background: "transparent",
  color: CANVAS.INK,
  resize: "none",
  minHeight: 38,
  maxHeight: 160,
  overflowY: "hidden",
  outline: "none",
};

const SUBMIT_BUTTON_STYLE: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 999,
  background: CANVAS.INK,
  color: "#fff",
  border: "none",
  fontSize: 16,
  fontWeight: 500,
  flexShrink: 0,
};

const WORKSPACE_PANE_STYLE: CSSProperties = {
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

// Pin layout — same viewport-bound contract as the side-rail shell so
// pin-top / pin-bottom never let the composer drift below the fold. The
// workspace pane keeps internal scroll behavior; the dock bar stays
// visible above the fold. Same measured-height contract applies.
const PIN_LAYOUT_STYLE: CSSProperties = {
  position: "sticky",
  top: "var(--agent-dock-sticky-top, var(--agent-dock-top-offset, 72px))",
  display: "flex",
  flexDirection: "column",
  height:
    "calc(100vh - var(--agent-dock-self-top, var(--agent-dock-top-offset, 72px)) - var(--agent-dock-bottom-padding, 0px))",
  maxHeight:
    "calc(100dvh - var(--agent-dock-self-top, var(--agent-dock-top-offset, 72px)) - var(--agent-dock-bottom-padding, 0px))",
  width: "100%",
  minHeight: 0,
  overflow: "hidden",
};

const PIN_PANEL_STYLE_BOTTOM: CSSProperties = {
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
  height: 480,
  maxHeight: "60vh",
  flexShrink: 0,
  background: CANVAS.CHAT_BG,
};

const PIN_PANEL_STYLE_TOP: CSSProperties = {
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  height: 480,
  maxHeight: "60vh",
  flexShrink: 0,
  background: CANVAS.CHAT_BG,
};

const EXPAND_OVERLAY_STYLE: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(10,10,11,0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: "5vh 5vw",
};

const EXPAND_PANEL_STYLE: CSSProperties = {
  width: "90vw",
  height: "90vh",
  maxWidth: 1400,
  maxHeight: 1000,
  background: CANVAS.CHAT_BG,
  borderRadius: 8,
  boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

const COLLAPSED_CHIP_STYLE: CSSProperties = {
  position: "fixed",
  bottom: 24,
  right: 24,
  minWidth: 56,
  height: 56,
  padding: "0 18px",
  gap: 10,
  borderRadius: 999,
  background: CANVAS.INK,
  color: "#fff",
  border: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
  zIndex: 900,
  fontFamily: CANVAS.SERIF,
  fontSize: 18,
  fontWeight: 500,
};

const COLLAPSED_CHIP_INITIALS_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: CANVAS.SERIF,
  fontSize: 18,
  fontWeight: 500,
  letterSpacing: "0.02em",
};

// ── Agent busy throbber ───────────────────────────────────────────────────
//
// Three pulsing dots animation rendered via CSS keyframes injected once.
// Lives inline with the chat bubble so the user gets a clear "working"
// signal while Sentinel/Nexus/Source retrieve tenant context, embed the
// query, query Pinecone, run lexical fallback, etc. — the round-trip
// can be 2-6 seconds and a static empty bubble feels frozen.

const THROBBER_KEYFRAMES_ID = "agent-dock-throbber-keyframes";
const THROBBER_KEYFRAMES = `
@keyframes agent-dock-throbber-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.45; }
  40% { transform: scale(1); opacity: 1; }
}
`;

function ensureThrobberKeyframes(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(THROBBER_KEYFRAMES_ID)) return;
  const style = document.createElement("style");
  style.id = THROBBER_KEYFRAMES_ID;
  style.textContent = THROBBER_KEYFRAMES;
  document.head.appendChild(style);
}

function AgentBusyThrobber() {
  useEffect(() => {
    ensureThrobberKeyframes();
  }, []);
  return (
    <span
      role="status"
      aria-label="Agent is working"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        flexShrink: 0,
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            width: 7,
            height: 7,
            borderRadius: 999,
            background: CANVAS.INK,
            animation: `agent-dock-throbber-bounce 1.1s infinite ease-in-out`,
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
    </span>
  );
}
