// DES-AI · AILabel.
//
// Small visible marker for AI-generated outputs. Use this anywhere the
// product renders drafted, suggested, or not-yet-reviewed AI content.

import type { CSSProperties } from "react";
import { COLORS, FONT, RADIUS } from "@/lib/design/abarva-theme";

export type AILabelStatus = "draft" | "suggested" | "pending_review";

const LABEL_META: Record<
  AILabelStatus,
  { text: string; accent: string; background: string; helper: string }
> = {
  draft: {
    text: "AI Draft",
    accent: COLORS.navy,
    background: COLORS.navySoft,
    helper: "Review before commit",
  },
  suggested: {
    text: "Suggested",
    accent: COLORS.amber,
    background: COLORS.amberSoft,
    helper: "Validate before action",
  },
  pending_review: {
    text: "Pending Review",
    accent: COLORS.red,
    background: COLORS.redSoft,
    helper: "Human approval required",
  },
};

export interface AILabelProps {
  status?: AILabelStatus;
  detail?: string;
  compact?: boolean;
  style?: CSSProperties;
}

export function AILabel({
  status = "draft",
  detail,
  compact = false,
  style,
}: AILabelProps) {
  const meta = LABEL_META[status];
  const helper = detail ?? meta.helper;

  return (
    <span
      data-ai-label-status={status}
      aria-label={`${meta.text}: ${helper}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? 5 : 7,
        width: "fit-content",
        maxWidth: "100%",
        borderRadius: RADIUS.pill,
        border: `1px solid ${meta.accent}33`,
        background: meta.background,
        color: meta.accent,
        padding: compact ? "2px 7px" : "3px 9px",
        fontFamily: FONT.mono,
        fontSize: compact ? 9 : 10,
        fontWeight: 700,
        lineHeight: 1.35,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        whiteSpace: "normal",
        ...style,
      }}
    >
      <span>{meta.text}</span>
      {helper ? (
        <>
          <span aria-hidden="true" style={{ opacity: 0.45 }}>
            ·
          </span>
          <span
            style={{
              color: COLORS.muted,
              fontWeight: 600,
              letterSpacing: "0.04em",
            }}
          >
            {helper}
          </span>
        </>
      ) : null}
    </span>
  );
}
