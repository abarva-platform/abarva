"use client";

import type { CSSProperties } from "react";
import { SHELL } from "@/lib/shell/shell-tokens";

export interface IntakeFact {
  id: string;
  label: string;
  value: string;
  note?: string;
}

interface IntakeFactsReviewProps {
  facts: readonly IntakeFact[];
}

export function IntakeFactsReview({ facts }: IntakeFactsReviewProps) {
  return (
    <section aria-label="Captured intake facts" style={SECTION_STYLE}>
      <div style={EYEBROW_STYLE}>Captured Facts</div>
      <h2 style={TITLE_STYLE}>Review the five facts</h2>
      <div style={FACT_LIST_STYLE}>
        {facts.map((fact) => (
          <article key={fact.id} style={FACT_CARD_STYLE}>
            <div style={FACT_LABEL_STYLE}>{fact.label}</div>
            <p style={FACT_VALUE_STYLE}>{fact.value || "Not captured yet"}</p>
            {fact.note ? <p style={FACT_NOTE_STYLE}>{fact.note}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

const SECTION_STYLE: CSSProperties = {
  display: "grid",
  gap: 10,
};

const EYEBROW_STYLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0,
  color: SHELL.INK_MUTED,
};

const TITLE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.SANS,
  fontSize: 16,
  lineHeight: 1.22,
  fontWeight: 800,
  letterSpacing: 0,
  color: SHELL.INK,
};

const FACT_LIST_STYLE: CSSProperties = {
  display: "grid",
  gap: 8,
};

const FACT_CARD_STYLE: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  background: SHELL.CARD_WHITE,
  padding: "10px 12px",
};

const FACT_LABEL_STYLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0,
  color: SHELL.INK_MUTED,
  marginBottom: 5,
};

const FACT_VALUE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.SANS,
  fontSize: 12.5,
  lineHeight: 1.45,
  color: SHELL.INK,
};

const FACT_NOTE_STYLE: CSSProperties = {
  margin: "6px 0 0",
  fontFamily: SHELL.SANS,
  fontSize: 12.5,
  lineHeight: 1.4,
  color: SHELL.INK_SOFT,
};
