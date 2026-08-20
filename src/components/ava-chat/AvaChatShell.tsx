"use client";

import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
} from "react";
import {
  AgentDock,
  type AgentProfile,
  type AttachmentRef,
  type ChatMessage,
  type DockMode,
  type RestorableDockMode,
  type SuggestedAction,
} from "@/components/agent/AgentDock";
import { AvaAskMark } from "@/components/agent-answer/AvaAskMark";
import { SHELL } from "@/lib/shell/shell-tokens";
import { demoSafeClientText } from "@/lib/client-config";
import { AgentMarkdown } from "@/lib/agent/markdownRenderer";

export type AvaCanvasTab = {
  id: string;
  label: string;
  count?: number;
};

export type AvaChatShellProps = {
  surface: string;
  thread: ChatMessage[];
  onMessage: (
    text: string,
    attachments: AttachmentRef[],
  ) => void | Promise<void>;
  canvas: ReactNode;
  suggestedActions?: SuggestedAction[];
  keepSuggestedActionsVisible?: boolean;
  surfaceContext?: Record<string, unknown>;
  isBusy?: boolean;
  defaultLeftPercent?: number;
  minLeftPx?: number;
  placeholder?: string;
  agent?: Partial<AgentProfile>;
  layout?: "dock" | "chat-only";
  /** Defaults to "side-rail" (always-open, current Intelligence behavior). Pass "collapsed" for a
   * surface where aVa should start as an opt-in floating chip rather than claiming layout space
   * by default. */
  defaultMode?: DockMode;
  collapsedRestoreMode?: RestorableDockMode;
};

const DEFAULT_AVA_AGENT: AgentProfile = {
  initials: "aVa",
  mark: "ava",
  name: "aVa",
  role: "Enterprise advisor",
};

const AVA_CHAT_SHELL_STYLE: CSSProperties & {
  "--agent-dock-sticky-top": string;
} = {
  "--agent-dock-sticky-top": "0px",
};

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

export function AvaChatShell({
  surface,
  thread,
  onMessage,
  canvas,
  suggestedActions,
  keepSuggestedActionsVisible,
  surfaceContext,
  isBusy,
  defaultLeftPercent = 32,
  minLeftPx = 320,
  placeholder = "Ask aVa about this enterprise context...",
  agent,
  layout = "dock",
  defaultMode = "side-rail",
  collapsedRestoreMode,
}: AvaChatShellProps) {
  const profile: AgentProfile = {
    ...DEFAULT_AVA_AGENT,
    ...sanitizeVisibleStrings(agent),
    mark: "ava",
  };
  const safeThread = sanitizeVisibleStrings(thread);
  const safeSuggestedActions = sanitizeVisibleStrings(suggestedActions);
  const safeSurfaceContext = sanitizeVisibleStrings(surfaceContext);
  const safePlaceholder = demoSafeClientText(placeholder);

  return (
    <div data-testid="ava-chat-shell" style={AVA_CHAT_SHELL_STYLE}>
      <AgentDock
        agent={profile}
        surface={surface}
        layout={layout}
        variant="focused"
        defaultMode={defaultMode}
        collapsedRestoreMode={collapsedRestoreMode}
        defaultLeftPercent={defaultLeftPercent}
        minLeftPx={minLeftPx}
        surfaceContext={safeSurfaceContext}
        suggestedActions={safeSuggestedActions}
        keepSuggestedActionsVisible={keepSuggestedActionsVisible}
        thread={safeThread}
        onMessage={onMessage}
        workspace={canvas}
        isAgentBusy={isBusy}
        placeholder={safePlaceholder}
        collapsedSummary={{
          label: "aVa",
          detail: "Open the advisor chat",
        }}
      />
    </div>
  );
}

export function AvaCanvas({
  eyebrow,
  title,
  status,
  tabs,
  activeTab,
  onTabChange,
  children,
  testId = "ava-canvas",
  tabTestIdPrefix = "ava-canvas-tab",
}: {
  eyebrow: string;
  title: string;
  status?: string;
  tabs: AvaCanvasTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: ReactNode;
  testId?: string;
  tabTestIdPrefix?: string;
}) {
  return (
    <section data-testid={testId} style={CANVAS_STYLE}>
      <div style={CANVAS_HEADER_STYLE}>
        <div>
          <div style={EYEBROW_STYLE}>{eyebrow}</div>
          <h2 style={CANVAS_TITLE_STYLE}>{title}</h2>
        </div>
        {status ? <div style={STATUS_STYLE}>{status}</div> : null}
      </div>
      <div style={TAB_ROW_STYLE} role="tablist" aria-label={`${eyebrow} tabs`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            data-testid={`${tabTestIdPrefix}-${tab.id}`}
            style={{
              ...TAB_BUTTON_STYLE,
              ...(activeTab === tab.id ? TAB_BUTTON_ACTIVE_STYLE : null),
            }}
          >
            {tab.label}
            {typeof tab.count === "number" ? (
              <span style={TAB_COUNT_STYLE}>{tab.count}</span>
            ) : null}
          </button>
        ))}
      </div>
      <div
        style={CANVAS_BODY_STYLE}
        data-testid={`ava-canvas-panel-${activeTab}`}
      >
        {children}
      </div>
    </section>
  );
}

export function AvaThread({ messages }: { messages: ChatMessage[] }) {
  return (
    <div style={THREAD_STYLE} data-testid="ava-thread">
      {messages.map((message) => (
        <AvaMessage key={message.id} message={message} />
      ))}
    </div>
  );
}

export function AvaMessage({ message }: { message: ChatMessage }) {
  return (
    <article
      data-role={message.role}
      style={message.role === "user" ? USER_MESSAGE_STYLE : AVA_MESSAGE_STYLE}
    >
      {message.role === "agent" ? (
        <div style={MESSAGE_BYLINE_STYLE}>aVa</div>
      ) : null}
      <div style={MESSAGE_BODY_STYLE}>
        {message.role === "agent" ? (
          <AgentMarkdown text={message.body} />
        ) : (
          message.body
        )}
      </div>
    </article>
  );
}

export function AvaComposer({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "Ask aVa about this enterprise context...",
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(160, textarea.scrollHeight)}px`;
  }, [value]);

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    onSubmit();
  };

  return (
    <form
      aria-label="Ask aVa"
      data-testid="ava-composer"
      style={COMPOSER_STYLE}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <AvaAskMark style={{ minWidth: 41, fontSize: 22 }} />
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={disabled}
        data-testid="ava-composer-input"
        style={COMPOSER_INPUT_STYLE}
      />
      <button
        type="submit"
        disabled={disabled || value.trim().length === 0}
        aria-label="Send message"
        data-testid="ava-composer-send"
        style={COMPOSER_SEND_STYLE}
      >
        ↑
      </button>
    </form>
  );
}

export function AvaAnswerSummary({
  directAnswer,
  whyItMatters,
  evidencePreview,
  confidence,
  nextAction,
  suggestions = [],
}: {
  directAnswer: string;
  whyItMatters?: string;
  evidencePreview?: string;
  confidence?: string;
  nextAction?: string;
  suggestions?: string[];
}) {
  return (
    <div style={SUMMARY_STYLE} data-testid="ava-answer-summary">
      <p style={SUMMARY_DIRECT_STYLE}>{directAnswer}</p>
      {whyItMatters ? (
        <SummaryRow label="Why it matters" value={whyItMatters} />
      ) : null}
      {evidencePreview ? (
        <SummaryRow label="Proof" value={evidencePreview} />
      ) : null}
      {confidence ? <SummaryRow label="Confidence" value={confidence} /> : null}
      {nextAction ? <SummaryRow label="Next" value={nextAction} /> : null}
      {suggestions.length > 0 ? (
        <div style={SUGGESTIONS_STYLE}>
          {suggestions.slice(0, 3).map((suggestion) => (
            <span key={suggestion} style={SUGGESTION_PILL_STYLE}>
              {suggestion}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AvaEvidencePreview({
  items,
}: {
  items: Array<{ id: string; label: string; detail?: string }>;
}) {
  if (items.length === 0) return null;
  return (
    <div style={EVIDENCE_PREVIEW_STYLE} data-testid="ava-evidence-preview">
      {items.slice(0, 4).map((item) => (
        <span key={item.id} style={SUGGESTION_PILL_STYLE} title={item.detail}>
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function AvaDockControls({ children }: { children: ReactNode }) {
  return (
    <div style={DOCK_CONTROLS_STYLE} data-testid="ava-dock-controls">
      {children}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={SUMMARY_ROW_STYLE}>
      <span style={SUMMARY_LABEL_STYLE}>{label}</span>
      <span style={SUMMARY_VALUE_STYLE}>{value}</span>
    </div>
  );
}

const CANVAS_STYLE: CSSProperties = {
  minHeight: "min(760px, calc(100svh - 184px))",
  background: SHELL.PAPER,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 10,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

const CANVAS_HEADER_STYLE: CSSProperties = {
  padding: "18px 20px",
  borderBottom: `1px solid ${SHELL.CARD_LINE}`,
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "flex-start",
};

const EYEBROW_STYLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  letterSpacing: 0,
  textTransform: "uppercase",
  color: SHELL.INK_MUTED,
  marginBottom: 5,
};

const CANVAS_TITLE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.SERIF,
  fontSize: 24,
  lineHeight: 1.15,
  color: SHELL.INK,
};

const STATUS_STYLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  color: SHELL.INK_MUTED,
  textTransform: "uppercase",
  letterSpacing: 0,
  whiteSpace: "nowrap",
};

const TAB_ROW_STYLE: CSSProperties = {
  display: "flex",
  gap: 8,
  padding: "12px 20px",
  borderBottom: `1px solid ${SHELL.CARD_LINE}`,
  overflowX: "auto",
  flexShrink: 0,
};

const TAB_BUTTON_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 999,
  background: "#FFFFFF",
  color: SHELL.INK_MUTED,
  cursor: "pointer",
  fontFamily: SHELL.SANS,
  fontSize: 13,
  fontWeight: 700,
  padding: "8px 12px",
  whiteSpace: "nowrap",
};

const TAB_BUTTON_ACTIVE_STYLE: CSSProperties = {
  background: "#EAF5EE",
  color: "#11613A",
  borderColor: "rgba(17,97,58,0.18)",
};

const TAB_COUNT_STYLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  color: "inherit",
  opacity: 0.72,
};

const CANVAS_BODY_STYLE: CSSProperties = {
  padding: 20,
  overflowY: "auto",
  minHeight: 0,
  flex: "1 1 auto",
};

const THREAD_STYLE: CSSProperties = {
  display: "grid",
  gap: 10,
};

const USER_MESSAGE_STYLE: CSSProperties = {
  justifySelf: "end",
  maxWidth: "84%",
  border: `1px solid ${SHELL.CARD_LINE}`,
  background: "#F7FBF8",
  borderRadius: 14,
  padding: "10px 12px",
};

const AVA_MESSAGE_STYLE: CSSProperties = {
  justifySelf: "start",
  maxWidth: "88%",
  display: "grid",
  gap: 5,
};

const MESSAGE_BYLINE_STYLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  letterSpacing: 0,
  textTransform: "uppercase",
  color: "#14794C",
};

const MESSAGE_BODY_STYLE: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 14,
  lineHeight: 1.5,
  color: SHELL.INK,
  whiteSpace: "normal",
};

const COMPOSER_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  gap: 8,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 12,
  padding: 8,
  background: "#FFFFFF",
};

const COMPOSER_INPUT_STYLE: CSSProperties = {
  flex: 1,
  minHeight: 36,
  maxHeight: 160,
  resize: "none",
  border: 0,
  outline: "none",
  fontFamily: SHELL.SANS,
  fontSize: 15,
  lineHeight: 1.45,
  color: SHELL.INK,
  background: "transparent",
};

const COMPOSER_SEND_STYLE: CSSProperties = {
  width: 42,
  height: 42,
  border: 0,
  borderRadius: "50%",
  background: "#111111",
  color: "#FFFFFF",
  fontSize: 22,
  cursor: "pointer",
};

const SUMMARY_STYLE: CSSProperties = {
  display: "grid",
  gap: 10,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  background: "#FFFFFF",
  padding: 14,
};

const SUMMARY_DIRECT_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.SANS,
  fontSize: 16,
  lineHeight: 1.5,
  color: SHELL.INK,
};

const SUMMARY_ROW_STYLE: CSSProperties = {
  display: "grid",
  gap: 3,
};

const SUMMARY_LABEL_STYLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  letterSpacing: 0,
  textTransform: "uppercase",
  color: SHELL.INK_MUTED,
};

const SUMMARY_VALUE_STYLE: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 14,
  lineHeight: 1.45,
  color: SHELL.INK,
};

const SUGGESTIONS_STYLE: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const SUGGESTION_PILL_STYLE: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 999,
  padding: "6px 9px",
  background: "#FFFFFF",
  color: SHELL.INK,
  fontFamily: SHELL.SANS,
  fontSize: 13,
};

const EVIDENCE_PREVIEW_STYLE: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const DOCK_CONTROLS_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
};
