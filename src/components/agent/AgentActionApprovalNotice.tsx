"use client";

import type { CSSProperties } from "react";

type AgentActionApprovalNoticeTone = "light" | "dark";

export const AGENT_ACTION_APPROVAL_NOTICE_COPY =
  "Human approval required: agent-suggested actions are proposals only. A named person must approve before any write, submission, or external action runs.";

interface AgentActionApprovalNoticeProps {
  tone?: AgentActionApprovalNoticeTone;
  compact?: boolean;
  style?: CSSProperties;
}

export function AgentActionApprovalNotice({
  tone = "light",
  compact = false,
  style,
}: AgentActionApprovalNoticeProps) {
  const isDark = tone === "dark";

  return (
    <div
      aria-label="Human approval required for agent actions"
      data-agent-action-approval-notice="true"
      style={{
        padding: compact ? "6px 8px" : "8px 10px",
        borderRadius: 8,
        background: isDark
          ? "rgba(14,159,140,0.12)"
          : "rgba(14,159,140,0.08)",
        border: isDark
          ? "1px solid rgba(14,159,140,0.28)"
          : "1px solid rgba(14,159,140,0.18)",
        color: isDark ? "rgba(250,247,241,0.82)" : "#0f5f55",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: compact ? 9 : 10,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        lineHeight: 1.45,
        ...style,
      }}
    >
      {AGENT_ACTION_APPROVAL_NOTICE_COPY}
    </div>
  );
}
