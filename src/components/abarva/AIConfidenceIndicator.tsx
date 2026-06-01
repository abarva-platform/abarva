// DES-AI AIConfidenceIndicator.
//
// Shared visible confidence marker for AI-generated outputs. Shows the
// confidence tier and the short rationale that explains why the system is
// more or less certain.

import type { CSSProperties } from "react";
import type { ConfidenceTier } from "@/lib/agent/renderedResponse";
import { COLORS, FONT, RADIUS } from "@/lib/design/abarva-theme";

export type AIConfidenceTier = ConfidenceTier;

const TIER_META: Record<
  AIConfidenceTier,
  {
    label: string;
    accent: string;
    background: string;
    defaultRationale: string;
  }
> = {
  HIGH: {
    label: "High confidence",
    accent: COLORS.navy,
    background: COLORS.navySoft,
    defaultRationale: "Strong grounding available",
  },
  MEDIUM: {
    label: "Medium confidence",
    accent: COLORS.amber,
    background: COLORS.amberSoft,
    defaultRationale: "Usable with caveats",
  },
  LOW: {
    label: "Low confidence",
    accent: COLORS.red,
    background: COLORS.redSoft,
    defaultRationale: "Extra review required",
  },
};

export function normalizeAIConfidenceTier(
  value: string | null | undefined,
): AIConfidenceTier {
  const normalized = value?.trim().toUpperCase();
  if (
    normalized === "HIGH" ||
    normalized === "MEDIUM" ||
    normalized === "LOW"
  ) {
    return normalized;
  }
  return "LOW";
}

export interface AIConfidenceIndicatorProps {
  tier: AIConfidenceTier | string;
  rationale?: string;
  compact?: boolean;
  style?: CSSProperties;
}

export function AIConfidenceIndicator({
  tier,
  rationale,
  compact = false,
  style,
}: AIConfidenceIndicatorProps) {
  const normalizedTier = normalizeAIConfidenceTier(tier);
  const meta = TIER_META[normalizedTier];
  const explanation = rationale ?? meta.defaultRationale;

  return (
    <span
      data-ai-confidence-tier={normalizedTier}
      aria-label={`${meta.label}: ${explanation}`}
      title={`${meta.label}: ${explanation}`}
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
      <span>{meta.label}</span>
      {explanation ? (
        <>
          <span aria-hidden="true" style={{ opacity: 0.45 }}>
            &middot;
          </span>
          <span
            style={{
              color: COLORS.muted,
              fontWeight: 600,
              letterSpacing: "0.04em",
            }}
          >
            {explanation}
          </span>
        </>
      ) : null}
    </span>
  );
}
