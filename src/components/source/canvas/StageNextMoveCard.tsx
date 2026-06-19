"use client";

import type { CSSProperties } from "react";
import type { StageNextMoveView } from "@/lib/source/stage-next-move";
import { CANVAS } from "./canvas-tokens";

interface StageNextMoveCardProps {
  nextMove: StageNextMoveView;
  onPrimary: () => void;
  onSecondary?: () => void;
  /** Drafting in progress — disables the primary action and shows a working
   *  label so the user gets feedback during the (multi-second) governed
   *  generation, instead of the button appearing to do nothing. */
  pending?: boolean;
}

const NEXT_MOVE_ACCENT = "#1d4ed8";

export function StageNextMoveCard({
  nextMove,
  onPrimary,
  onSecondary,
  pending = false,
}: StageNextMoveCardProps) {
  return (
    <section
      data-testid="source-canvas-next-move-card"
      aria-label="Next move"
      style={CARD_STYLE}
    >
      <div style={COPY_STYLE}>
        <div style={EYEBROW_STYLE}>{nextMove.eyebrow}</div>
        <h2 style={TITLE_STYLE}>{nextMove.title}</h2>
        <p style={BODY_STYLE}>{nextMove.body}</p>
        {nextMove.gates.length > 0 ? (
          <div data-testid="source-canvas-next-move-gates" style={GATES_STYLE}>
            {nextMove.gates.slice(0, 4).map((gate) => {
              const clear = gate.state === "met" || gate.state === "waived";
              return (
                <span
                  key={gate.id}
                  style={GATE_STYLE}
                  title={gate.id}
                  data-state={gate.state}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      ...BOX_STYLE,
                      background: clear ? CANVAS.ACTIVE : CANVAS.CARD,
                      borderColor: clear ? CANVAS.ACTIVE : CANVAS.RULE,
                    }}
                  >
                    {clear ? "✓" : ""}
                  </span>
                  <span>{gate.label}</span>
                </span>
              );
            })}
            <span style={GATE_SUMMARY_STYLE}>{nextMove.gateSummary}</span>
          </div>
        ) : null}
      </div>
      <div style={ACTIONS_STYLE}>
        <button
          type="button"
          data-testid="source-canvas-next-move-primary"
          onClick={onPrimary}
          disabled={pending}
          aria-busy={pending}
          style={
            pending
              ? { ...PRIMARY_BUTTON_STYLE, opacity: 0.72, cursor: "wait" }
              : PRIMARY_BUTTON_STYLE
          }
        >
          {pending ? (
            "Drafting…"
          ) : (
            <>
              {nextMove.primaryLabel} <span aria-hidden="true">→</span>
            </>
          )}
        </button>
        {nextMove.secondaryLabel && onSecondary ? (
          <button
            type="button"
            data-testid="source-canvas-next-move-secondary"
            onClick={onSecondary}
            style={SECONDARY_BUTTON_STYLE}
          >
            {nextMove.secondaryLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}

const CARD_STYLE: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 3,
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) auto",
  gap: 24,
  alignItems: "center",
  margin: "0 24px 0",
  padding: "22px 26px",
  border: `1px solid ${CANVAS.RULE}`,
  borderLeft: `3px solid ${NEXT_MOVE_ACCENT}`,
  borderRadius: 12,
  background: CANVAS.CARD,
  boxShadow: "0 8px 20px rgba(12,26,58,0.06)",
};

const COPY_STYLE: CSSProperties = {
  minWidth: 0,
};

const EYEBROW_STYLE: CSSProperties = {
  marginBottom: 8,
  fontFamily: CANVAS.SANS,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: NEXT_MOVE_ACCENT,
};

const TITLE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: CANVAS.SERIF,
  fontSize: 24,
  lineHeight: 1.16,
  fontWeight: 400,
  color: CANVAS.INK,
};

const BODY_STYLE: CSSProperties = {
  maxWidth: 780,
  margin: "8px 0 0",
  fontFamily: CANVAS.SANS,
  fontSize: 13.5,
  lineHeight: 1.5,
  color: CANVAS.INK_SOFT,
};

const GATES_STYLE: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 14,
  marginTop: 14,
  paddingTop: 14,
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
};

const GATE_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  color: CANVAS.INK,
};

const BOX_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 16,
  height: 16,
  border: "1px solid",
  borderRadius: 4,
  color: CANVAS.CARD,
  fontSize: 10,
  fontWeight: 800,
  lineHeight: 1,
};

const GATE_SUMMARY_STYLE: CSSProperties = {
  marginLeft: "auto",
  fontFamily: CANVAS.SANS,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
};

const ACTIONS_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 9,
  minWidth: 216,
};

const PRIMARY_BUTTON_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  border: `1px solid ${NEXT_MOVE_ACCENT}`,
  borderRadius: 9,
  background: NEXT_MOVE_ACCENT,
  color: CANVAS.CARD,
  padding: "12px 18px",
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const SECONDARY_BUTTON_STYLE: CSSProperties = {
  ...PRIMARY_BUTTON_STYLE,
  background: CANVAS.CARD,
  color: CANVAS.INK,
  borderColor: CANVAS.RULE,
};
