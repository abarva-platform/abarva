"use client";

import { useState, type FormEvent } from "react";
import { COLORS, RADIUS, TYPOGRAPHY } from "@/lib/design/design-tokens";
import type { PreservedSourceFile } from "@/lib/context-ingestion/loader/contract";

/**
 * AskStewardDock — the scoped side panel for one file.
 *
 * When a finding escalates (escalateToConversation), the operator opens
 * a side dock pinned to ONE preserved file: a compact file preview
 * (name, dimension context, citation), a simple message list, a
 * composer, and a Confirm action that resolves the conversation. Pure
 * presentational: messages and the input value are props/local state;
 * sending and confirming are emitted as events. No fetch, no agent
 * call.
 *
 * Locked design system: cream surface, serif display, hairline borders,
 * black + ghost buttons.
 */

export interface StewardMessage {
  id: string;
  author: "steward" | "operator";
  body: string;
  /** Optional citation into the preserved original (page/row/cell). */
  citation?: string;
  at?: string; // ISO or display string
}

export interface AskStewardDockProps {
  /** The file this conversation is scoped to. */
  file: PreservedSourceFile;
  /** Human-readable label of the file's current dimension (optional). */
  dimensionLabel?: string;
  messages: StewardMessage[];
  /** Operator sent a message from the composer. */
  onSend?: (body: string) => void;
  /** Operator confirmed / resolved the conversation. */
  onConfirm?: () => void;
  /** Operator closed the dock. */
  onClose?: () => void;
  /** Disable composer + actions (e.g. while a reply is pending). */
  disabled?: boolean;
  className?: string;
}

export function AskStewardDock({
  file,
  dimensionLabel,
  messages,
  onSend,
  onConfirm,
  onClose,
  disabled = false,
  className,
}: AskStewardDockProps) {
  const [draft, setDraft] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || disabled) return;
    onSend?.(trimmed);
    setDraft("");
  }

  return (
    <aside
      className={className}
      aria-label={`Ask Ava about ${file.filename}`}
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: 380,
        height: "100%",
        background: COLORS.cream,
        borderLeft: `1px solid ${COLORS.ink}1A`,
        fontFamily: TYPOGRAPHY.sans,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          padding: "16px 18px",
          borderBottom: `1px solid ${COLORS.ink}14`,
        }}
      >
        <div>
          <div
            style={{ fontFamily: TYPOGRAPHY.serif, fontSize: 18, color: COLORS.ink }}
          >
            Ask Ava
          </div>
          <div style={{ fontSize: 12, color: `${COLORS.ink}99`, marginTop: 2 }}>
            About one file only
          </div>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            style={{
              border: "none",
              background: "transparent",
              color: `${COLORS.ink}99`,
              fontSize: 18,
              lineHeight: 1,
              cursor: "pointer",
              padding: 2,
            }}
          >
            ×
          </button>
        ) : null}
      </div>

      {/* Scoped file preview */}
      <div
        style={{
          padding: "12px 18px",
          borderBottom: `1px solid ${COLORS.ink}14`,
          background: COLORS.white,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.ink }}>
          {file.filename}
        </div>
        <dl
          style={{
            margin: "8px 0 0",
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            columnGap: 10,
            rowGap: 4,
            fontSize: 12,
          }}
        >
          {dimensionLabel ? (
            <>
              <dt style={{ color: `${COLORS.ink}80` }}>Dimension</dt>
              <dd style={{ margin: 0, color: COLORS.ink }}>{dimensionLabel}</dd>
            </>
          ) : null}
          <dt style={{ color: `${COLORS.ink}80` }}>Preserved</dt>
          <dd style={{ margin: 0, color: COLORS.ink }}>
            {(file.bytes / 1024).toFixed(0)} KB ·{" "}
            <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11 }}>
              {file.fileHash.slice(0, 12)}…
            </span>
          </dd>
          <dt style={{ color: `${COLORS.ink}80` }}>Path</dt>
          <dd
            style={{
              margin: 0,
              color: `${COLORS.ink}99`,
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              wordBreak: "break-all",
            }}
          >
            {file.objectKey}
          </dd>
        </dl>
      </div>

      {/* Message list */}
      <div
        role="log"
        aria-label="Conversation"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.length === 0 ? (
          <div style={{ fontSize: 13, color: `${COLORS.ink}80`, textAlign: "center" }}>
            Ask about how this file was mapped or interpreted.
          </div>
        ) : (
          messages.map((message) => {
            const fromOperator = message.author === "operator";
            return (
              <div
                key={message.id}
                style={{
                  alignSelf: fromOperator ? "flex-end" : "flex-start",
                  maxWidth: "90%",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: `${COLORS.ink}80`,
                    marginBottom: 3,
                    textAlign: fromOperator ? "right" : "left",
                  }}
                >
                  {fromOperator ? "You" : "Steward"}
                  {message.at ? ` · ${message.at}` : ""}
                </div>
                <div
                  style={{
                    padding: "9px 12px",
                    borderRadius: RADIUS.md,
                    border: `1px solid ${COLORS.ink}1A`,
                    background: fromOperator ? COLORS.skyPale : COLORS.white,
                    color: COLORS.ink,
                    fontSize: 13,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {message.body}
                  {message.citation ? (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 11,
                        color: `${COLORS.ink}80`,
                        fontFamily: TYPOGRAPHY.mono,
                      }}
                    >
                      {message.citation}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer + confirm */}
      <form
        onSubmit={handleSubmit}
        style={{
          borderTop: `1px solid ${COLORS.ink}14`,
          padding: "12px 18px",
          background: COLORS.white,
        }}
      >
        <label className="sr-only" htmlFor="ask-steward-input">
          Message Steward
        </label>
        <textarea
          id="ask-steward-input"
          value={draft}
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about this file…"
          rows={2}
          spellCheck
          style={{
            width: "100%",
            resize: "vertical",
            border: `1px solid ${COLORS.ink}33`,
            borderRadius: RADIUS.sm,
            padding: "9px 10px",
            background: COLORS.white,
            color: COLORS.ink,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            boxSizing: "border-box",
          }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button
            type="submit"
            disabled={disabled || draft.trim().length === 0}
            style={{
              padding: "8px 14px",
              borderRadius: RADIUS.sm,
              border: `1px solid ${COLORS.ink}33`,
              background: "transparent",
              color: COLORS.ink,
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              fontWeight: 500,
              cursor:
                disabled || draft.trim().length === 0 ? "not-allowed" : "pointer",
              opacity: disabled || draft.trim().length === 0 ? 0.6 : 1,
            }}
          >
            Send
          </button>
          <button
            type="button"
            disabled={disabled || !onConfirm}
            onClick={onConfirm}
            style={{
              marginLeft: "auto",
              padding: "8px 16px",
              borderRadius: RADIUS.sm,
              border: "none",
              background: COLORS.ink,
              color: COLORS.white,
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              fontWeight: 500,
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.6 : 1,
            }}
          >
            Confirm &amp; resolve
          </button>
        </div>
      </form>
    </aside>
  );
}

export default AskStewardDock;
