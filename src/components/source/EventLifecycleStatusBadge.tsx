import {
  getLifecycleStatusLabel,
  getLifecycleTone,
} from "@/lib/source/lifecycle";
import type { SourceLifecycleStatus } from "@/lib/source/types";
import { SHELL } from "@/lib/shell/shell-tokens";

const RISK_PILL_HIGH = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  padding: "3px 8px",
  borderRadius: 20,
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  background: SHELL.RUST_BG,
  color: SHELL.RUST_TEXT,
  border: "1px solid " + SHELL.PEACH_LINE,
  display: "inline-flex",
  alignItems: "center",
  width: "fit-content",
};

const RISK_PILL_MEDIUM = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  padding: "3px 8px",
  borderRadius: 20,
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  background: SHELL.PEACH_BG,
  color: SHELL.PEACH_TEXT,
  border: "1px solid " + SHELL.PEACH_LINE,
  display: "inline-flex",
  alignItems: "center",
  width: "fit-content",
};

const RISK_PILL_LOW = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  padding: "3px 8px",
  borderRadius: 20,
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  background: SHELL.MINT_BG,
  color: SHELL.MINT_TEXT,
  border: "1px solid " + SHELL.MINT_LINE,
  display: "inline-flex",
  alignItems: "center",
  width: "fit-content",
};

export function EventLifecycleStatusBadge({
  status,
  label,
  variant = "dark",
}: {
  status: SourceLifecycleStatus;
  label?: string;
  variant?: "dark" | "light";
}) {
  const tone = getLifecycleTone(status);
  const isLight = variant === "light";
  const statusLabel = label ?? getLifecycleStatusLabel(status);
  const styles =
    tone === "critical"
      ? RISK_PILL_HIGH
      : tone === "warning"
        ? RISK_PILL_MEDIUM
        : tone === "success"
          ? RISK_PILL_LOW
          : {
              display: "inline-flex",
              alignItems: "center",
              width: "fit-content",
              fontFamily: SHELL.MONO,
              fontSize: "9px",
              padding: "3px 8px",
              borderRadius: 20,
              textTransform: "uppercase" as const,
              letterSpacing: "0.06em",
              fontWeight: 600,
              background:
                tone === "info"
                  ? isLight
                    ? "rgba(15,118,110,0.10)"
                    : "rgba(20,184,166,0.12)"
                  : isLight
                    ? "rgba(17,24,39,0.04)"
                    : "rgba(255,255,255,0.04)",
              color:
                tone === "info" && isLight
                  ? "#0F766E"
                  : isLight
                    ? SHELL.INK
                    : SHELL.INK,
              border: `1px solid ${tone === "info" ? "rgba(20,184,166,0.25)" : SHELL.CARD_LINE}`,
            };

  return (
    <span style={styles} title={statusTooltip(status, statusLabel)}>
      {statusLabel}
    </span>
  );
}

function statusTooltip(status: SourceLifecycleStatus, label: string): string {
  if (status === "waiting_on_client") {
    return "Waiting on Client means a named client-side approval, evidence item, or gate reason is required before the event can advance.";
  }
  if (status === "active") {
    return "Active means the event is open and ready for the next Source workflow action.";
  }
  if (status === "completed") {
    return "Completed means the event has reached the end of the Source lifecycle.";
  }
  return label;
}
