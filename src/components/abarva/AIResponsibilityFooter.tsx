import type { CSSProperties } from "react";
import { COLORS, FONT, RADIUS } from "@/lib/design/abarva-theme";

export const AI_RESPONSIBILITY_FOOTER_COPY =
  "AI may produce errors. You are responsible for decisions taken based on this output.";

export interface AIResponsibilityFooterProps {
  tone?: "light" | "dark";
  compact?: boolean;
  style?: CSSProperties;
}

export function AIResponsibilityFooter({
  tone = "light",
  compact = false,
  style,
}: AIResponsibilityFooterProps) {
  const isDark = tone === "dark";

  return (
    <p
      data-testid="ai-responsibility-footer"
      style={{
        margin: 0,
        width: "100%",
        borderRadius: RADIUS.sm,
        border: `1px solid ${
          isDark ? "rgba(250,247,241,0.14)" : "rgba(12,26,58,0.10)"
        }`,
        background: isDark ? "rgba(250,247,241,0.04)" : COLORS.navySoft,
        color: isDark ? "rgba(250,247,241,0.62)" : COLORS.muted,
        fontFamily: FONT.mono,
        fontSize: compact ? 9 : 10,
        fontWeight: 600,
        lineHeight: 1.45,
        padding: compact ? "5px 8px" : "7px 10px",
        textAlign: "center",
        ...style,
      }}
    >
      {AI_RESPONSIBILITY_FOOTER_COPY}
    </p>
  );
}
