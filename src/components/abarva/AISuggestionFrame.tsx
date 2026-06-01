// DES-AI · AISuggestionFrame.
//
// Presentational wrapper for AI-generated recommendations, drafts, and
// pending-review content. Runtime callers provide the content; this component
// only makes the AI/human-review state visible.

import type { CSSProperties, ReactNode } from "react";
import { BORDER, COLORS, RADIUS, SPACING } from "@/lib/design/abarva-theme";
import { AILabel, type AILabelStatus } from "./AILabel";

const STATUS_ACCENT: Record<AILabelStatus, string> = {
  draft: COLORS.navy,
  suggested: COLORS.amber,
  pending_review: COLORS.red,
};

export interface AISuggestionFrameProps {
  children: ReactNode;
  status?: AILabelStatus;
  detail?: string;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
}

export function AISuggestionFrame({
  children,
  status = "suggested",
  detail,
  style,
  bodyStyle,
}: AISuggestionFrameProps) {
  return (
    <section
      role="note"
      data-ai-suggestion-frame={status}
      aria-label="AI-generated suggestion"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: SPACING.sm,
        background: COLORS.card,
        border: BORDER.hairline,
        borderLeft: `3px solid ${STATUS_ACCENT[status]}`,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        ...style,
      }}
    >
      <AILabel status={status} detail={detail} />
      <div style={bodyStyle}>{children}</div>
    </section>
  );
}
