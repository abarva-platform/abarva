"use client";

import type { CSSProperties } from "react";
import { SHELL } from "@/lib/shell/shell-tokens";

export interface IntakeChatTurn {
  id: string;
  speaker: string;
  text: string;
  timeLabel?: string;
}

interface IntakeChatTrailProps {
  turns: readonly IntakeChatTurn[];
}

export function IntakeChatTrail({ turns }: IntakeChatTrailProps) {
  return (
    <details style={DETAILS_STYLE}>
      <summary style={SUMMARY_STYLE}>Intake chat trail</summary>
      <div style={TRAIL_STYLE}>
        {turns.length > 0 ? (
          turns.map((turn) => (
            <article key={turn.id} style={TURN_STYLE}>
              <div style={TURN_META_STYLE}>
                <span>{turn.speaker}</span>
                {turn.timeLabel ? <span>{turn.timeLabel}</span> : null}
              </div>
              <p style={TURN_TEXT_STYLE}>{turn.text}</p>
            </article>
          ))
        ) : (
          <p style={EMPTY_STYLE}>
            No intake chat was captured for this event. Use the facts above as
            the approval record.
          </p>
        )}
      </div>
    </details>
  );
}

const DETAILS_STYLE: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  background: "#fbfaf7",
  padding: "12px 14px",
};

const SUMMARY_STYLE: CSSProperties = {
  cursor: "pointer",
  fontFamily: SHELL.SANS,
  fontSize: 13,
  fontWeight: 700,
  color: SHELL.INK,
};

const TRAIL_STYLE: CSSProperties = {
  display: "grid",
  gap: 10,
  marginTop: 12,
};

const TURN_STYLE: CSSProperties = {
  borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
  paddingTop: 10,
};

const TURN_META_STYLE: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  fontFamily: SHELL.MONO,
  fontSize: 10,
  color: SHELL.INK_MUTED,
};

const TURN_TEXT_STYLE: CSSProperties = {
  margin: "5px 0 0",
  fontFamily: SHELL.SANS,
  fontSize: 13,
  lineHeight: 1.45,
  color: SHELL.INK_SOFT,
};

const EMPTY_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.SANS,
  fontSize: 13,
  lineHeight: 1.45,
  color: SHELL.INK_SOFT,
};
