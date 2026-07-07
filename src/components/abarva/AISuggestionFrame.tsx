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
  ariaLabel?: string;
  className?: string;
  bodyClassName?: string;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
}

/**
 * Presentational review frame for AI-generated recommendations and drafts.
 *
 * Example:
 * `<AISuggestionFrame status="suggested">Recommended next action</AISuggestionFrame>`
 */
export function AISuggestionFrame({
  children,
  status = "suggested",
  detail,
  ariaLabel,
  className,
  bodyClassName,
  style,
  bodyStyle,
}: AISuggestionFrameProps) {
  const labelText =
    status === "draft"
      ? "AI-generated draft"
      : status === "pending_review"
        ? "AI-generated output pending review"
        : "AI-generated suggestion";

  return (
    <section
      role="note"
      data-ai-suggestion-frame={status}
      aria-label={ariaLabel ?? labelText}
      className={className}
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
      <div className={bodyClassName} style={bodyStyle}>
        {children}
      </div>
    </section>
  );
}
