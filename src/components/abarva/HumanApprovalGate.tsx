// DES-AI · HumanApprovalGate.
//
// Shared approval-control primitive for consequential AI-assisted actions.
// It makes the human decision boundary visible: responsibility checkbox,
// free-text rationale, and minimum-length validation.

import type { CSSProperties } from "react";
import {
  AI_DECISION_SUPPORT_WATERMARK,
  HUMAN_DECISION_ATTESTATION_TEXT,
} from "@/lib/ai-liability/human-decision-controls";
import { COLORS, FONT, RADIUS, SPACING } from "@/lib/design/abarva-theme";

export const HUMAN_APPROVAL_JUSTIFICATION_MIN_CHARS = 20;

export function normalizeHumanApprovalJustification(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function canSubmitHumanApproval({
  acceptedResponsibility,
  justification,
  minChars = HUMAN_APPROVAL_JUSTIFICATION_MIN_CHARS,
}: {
  acceptedResponsibility: boolean;
  justification: string;
  minChars?: number;
}): boolean {
  return (
    acceptedResponsibility &&
    normalizeHumanApprovalJustification(justification).length >= minChars
  );
}

export interface HumanApprovalGateProps {
  justification: string;
  onJustificationChange: (value: string) => void;
  acceptedResponsibility: boolean;
  onAcceptedResponsibilityChange: (value: boolean) => void;
  minChars?: number;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  style?: CSSProperties;
}

export function HumanApprovalGate({
  justification,
  onJustificationChange,
  acceptedResponsibility,
  onAcceptedResponsibilityChange,
  minChars = HUMAN_APPROVAL_JUSTIFICATION_MIN_CHARS,
  disabled = false,
  label = "Human decision justification",
  placeholder = "State your decision rationale and the evidence you reviewed...",
  style,
}: HumanApprovalGateProps) {
  const normalized = normalizeHumanApprovalJustification(justification);
  const hasEnoughJustification = normalized.length >= minChars;
  const canSubmit = canSubmitHumanApproval({
    acceptedResponsibility,
    justification,
    minChars,
  });

  return (
    <section
      data-human-approval-gate="true"
      aria-label="Human approval gate"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: SPACING.md,
        ...style,
      }}
    >
      <div
        data-testid="human-approval-attestation"
        style={{
          background: COLORS.navySoft,
          border: `1px solid ${COLORS.navy}24`,
          borderRadius: RADIUS.md,
          padding: "10px 12px",
          fontFamily: FONT.body,
          fontSize: 12,
          color: COLORS.body,
          lineHeight: 1.5,
        }}
      >
        <strong>{AI_DECISION_SUPPORT_WATERMARK}</strong>{" "}
        {HUMAN_DECISION_ATTESTATION_TEXT}
      </div>

      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          fontFamily: FONT.body,
          fontSize: 12,
          color: COLORS.body,
          lineHeight: 1.45,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={acceptedResponsibility}
          disabled={disabled}
          onChange={(event) =>
            onAcceptedResponsibilityChange(event.target.checked)
          }
          data-testid="human-approval-responsibility-checkbox"
          style={{ marginTop: 2, flexShrink: 0 }}
        />
        <span>
          I have reviewed the AI-assisted suggestion, source evidence, and
          missing-data caveats, and I accept responsibility for this human
          decision.
        </span>
      </label>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label
          htmlFor="human-approval-justification"
          style={{
            fontFamily: FONT.mono,
            fontSize: 9,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: COLORS.muted,
            fontWeight: 700,
          }}
        >
          {label}
        </label>
        <textarea
          id="human-approval-justification"
          rows={4}
          value={justification}
          disabled={disabled}
          onChange={(event) => onJustificationChange(event.target.value)}
          data-testid="human-approval-justification"
          placeholder={placeholder}
          style={{
            fontFamily: FONT.body,
            fontSize: 13,
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.md,
            padding: 10,
            width: "100%",
            boxSizing: "border-box",
            resize: "vertical",
            color: COLORS.ink,
            outline: "none",
            lineHeight: 1.5,
          }}
        />
        <div
          data-testid="human-approval-validation"
          data-human-approval-ready={canSubmit ? "true" : "false"}
          style={{
            fontFamily: FONT.mono,
            fontSize: 9,
            color: canSubmit
              ? COLORS.navy
              : hasEnoughJustification
                ? COLORS.amber
                : COLORS.muted,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Minimum {minChars} characters · responsibility checkbox required
        </div>
      </div>
    </section>
  );
}
