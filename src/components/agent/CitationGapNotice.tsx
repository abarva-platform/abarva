"use client";

type CitationGapNoticeTone = "light" | "dark";

interface CitationGapNoticeProps {
  tone?: CitationGapNoticeTone;
  compact?: boolean;
}

export function CitationGapNotice({
  tone = "light",
  compact = false,
}: CitationGapNoticeProps) {
  const isDark = tone === "dark";
  return (
    <div
      className="agent-citation-gap-banner"
      aria-label="Citation gap"
      data-citation-gap-notice="true"
      style={{
        marginBottom: compact ? 8 : 12,
        padding: compact ? "6px 8px" : "8px 10px",
        borderRadius: 8,
        background: isDark ? "rgba(245,197,74,0.10)" : "rgba(245,197,74,0.14)",
        border: isDark
          ? "1px solid rgba(245,197,74,0.24)"
          : "1px solid rgba(245,197,74,0.28)",
        color: isDark ? "rgba(250,247,241,0.82)" : "#5f4103",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: compact ? 9 : 10,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        lineHeight: 1.45,
      }}
    >
      Source review needed: this answer has no source citations attached. Review
      the source basis before relying on it.
    </div>
  );
}
