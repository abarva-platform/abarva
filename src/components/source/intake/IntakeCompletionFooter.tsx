"use client";

import type { CSSProperties } from "react";
import { SHELL } from "@/lib/shell/shell-tokens";
import type { IntakeFieldId } from "@/lib/source/intake-intent";

export interface CapturedFact {
  id: IntakeFieldId;
  label: string;
  value: string;
}

export interface IntakeApproverPreview {
  name: string;
  role: string;
  userId?: string;
}

interface IntakeCompletionFooterProps {
  capturedFacts: CapturedFact[];
  decisionOwner: IntakeApproverPreview;
  coApprover?: IntakeApproverPreview;
  capturedFactsCount: number;
  totalFactsCount: number;
  submitting: boolean;
  draftSaved: boolean;
  onOpenEvent: () => Promise<void>;
  onSaveDraft: () => void;
}

export function IntakeCompletionFooter({
  capturedFacts,
  decisionOwner,
  coApprover,
  capturedFactsCount,
  totalFactsCount,
  submitting,
  draftSaved,
  onOpenEvent,
  onSaveDraft,
}: IntakeCompletionFooterProps) {
  if (capturedFactsCount !== totalFactsCount) return null;

  return (
    <section
      aria-label="Next approval step"
      data-testid="source-intake-completion-footer"
      style={FOOTER}
    >
      <div style={HEADER_ROW}>
        <div>
          <div style={{ ...SECTION_LABEL, color: "#1d4ed8" }}>
            Next · Approval
          </div>
          <h3 style={TITLE}>Open event for approval</h3>
          <p style={ROUTING_LINE}>
            Routes to: <strong>{decisionOwner.name}</strong> (
            {decisionOwner.role})
            {coApprover ? (
              <>
                {" "}
                + <strong>{coApprover.name}</strong> ({coApprover.role})
              </>
            ) : null}
          </p>
        </div>
        <span style={CAPTURE_CHIP}>
          {capturedFactsCount} of {totalFactsCount} facts captured
        </span>
      </div>

      <details style={FACTS_DETAILS}>
        <summary style={FACTS_SUMMARY}>Captured facts checklist</summary>
        <div style={FACTS_GRID}>
          {capturedFacts.map((fact) => (
            <div key={fact.id} style={FACT_ROW}>
              <span aria-hidden="true" style={CHECK_DOT}>
                ✓
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={FACT_LABEL}>{fact.label}</div>
                <div style={FACT_VALUE}>{fact.value}</div>
              </div>
            </div>
          ))}
        </div>
      </details>

      <div style={ACTION_ROW}>
        <button
          type="button"
          onClick={onSaveDraft}
          data-testid="source-intake-save-draft"
          style={SECONDARY_BUTTON}
        >
          Save draft
        </button>
        <button
          type="button"
          onClick={onOpenEvent}
          disabled={submitting}
          data-testid="source-intake-open-event"
          style={{
            ...PRIMARY_BUTTON,
            opacity: submitting ? 0.66 : 1,
            cursor: submitting ? "progress" : "pointer",
          }}
        >
          {submitting ? "Opening approval…" : "Open event"}
        </button>
      </div>

      <div style={HELP_TEXT}>
        After submit, you&apos;ll land on the approval page, not the canvas. The
        canvas unlocks after approval.
      </div>
      {draftSaved ? (
        <div role="status" aria-live="polite" style={DRAFT_SAVED}>
          Draft saved. No lifecycle action has run.
        </div>
      ) : null}
    </section>
  );
}

const FOOTER: CSSProperties = {
  border: `1px solid ${SHELL.BLUE_LINE}`,
  borderRadius: 14,
  background: `linear-gradient(145deg, ${SHELL.CARD_WHITE} 0%, ${SHELL.BLUE_BG} 100%)`,
  padding: "13px 14px",
  display: "grid",
  gap: 12,
  boxShadow: "0 14px 32px rgba(12, 26, 58, 0.08)",
};

const HEADER_ROW: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
};

const SECTION_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 8.5,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  fontWeight: 700,
};

const TITLE: CSSProperties = {
  margin: "6px 0 0",
  fontFamily: SHELL.SERIF,
  fontSize: 22,
  lineHeight: 1.1,
  color: SHELL.INK,
};

const ROUTING_LINE: CSSProperties = {
  margin: "6px 0 0",
  fontFamily: SHELL.SANS,
  fontSize: 12.5,
  lineHeight: 1.45,
  color: SHELL.INK_SOFT,
};

const CAPTURE_CHIP: CSSProperties = {
  ...SECTION_LABEL,
  flex: "0 0 auto",
  display: "inline-flex",
  alignItems: "center",
  minHeight: 22,
  border: `1px solid ${SHELL.MINT_LINE}`,
  borderRadius: 5,
  background: SHELL.MINT_BG,
  color: SHELL.MINT_TEXT,
  padding: "2px 7px",
  whiteSpace: "nowrap",
};

const FACTS_DETAILS: CSSProperties = {
  borderTop: `1px solid ${SHELL.CARD_LINE}`,
  paddingTop: 10,
};

const FACTS_SUMMARY: CSSProperties = {
  cursor: "pointer",
  fontFamily: SHELL.MONO,
  fontSize: 8.5,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: SHELL.INK_MUTED,
  fontWeight: 700,
};

const FACTS_GRID: CSSProperties = {
  display: "grid",
  gap: 7,
  marginTop: 9,
};

const FACT_ROW: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "18px minmax(0, 1fr)",
  gap: 8,
  alignItems: "flex-start",
};

const CHECK_DOT: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 16,
  height: 16,
  borderRadius: 999,
  background: SHELL.MINT_BG,
  border: `1px solid ${SHELL.MINT_LINE}`,
  color: SHELL.MINT_TEXT,
  fontFamily: SHELL.MONO,
  fontSize: 9,
  fontWeight: 800,
};

const FACT_LABEL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  fontWeight: 800,
  color: SHELL.INK,
};

const FACT_VALUE: CSSProperties = {
  marginTop: 2,
  fontFamily: SHELL.SANS,
  fontSize: 11.5,
  lineHeight: 1.4,
  color: SHELL.INK_SOFT,
  overflow: "hidden",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
};

const ACTION_ROW: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const BUTTON_BASE: CSSProperties = {
  borderRadius: 9,
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontWeight: 800,
  padding: "10px 13px",
};

const PRIMARY_BUTTON: CSSProperties = {
  ...BUTTON_BASE,
  border: `1px solid ${SHELL.INK}`,
  background: SHELL.INK,
  color: SHELL.PAPER,
};

const SECONDARY_BUTTON: CSSProperties = {
  ...BUTTON_BASE,
  border: `1px solid ${SHELL.CARD_LINE}`,
  background: SHELL.CARD_WHITE,
  color: SHELL.INK,
  cursor: "pointer",
};

const HELP_TEXT: CSSProperties = {
  borderTop: `1px solid ${SHELL.CARD_LINE}`,
  paddingTop: 9,
  fontFamily: SHELL.SANS,
  fontSize: 11.5,
  lineHeight: 1.4,
  color: SHELL.INK_MUTED,
};

const DRAFT_SAVED: CSSProperties = {
  border: `1px solid ${SHELL.MINT_LINE}`,
  borderRadius: 8,
  background: SHELL.MINT_BG,
  padding: "8px 10px",
  fontFamily: SHELL.SANS,
  fontSize: 12,
  color: SHELL.MINT_TEXT,
};
