// Status-cell tone — a deterministic, format-agnostic map from a status/RAG/
// ownership cell VALUE to a colour tone, so an executive table reads at a glance
// (a risk level, an acceptance pass/fail, a readiness state) rather than as a
// uniform grid. Used by the renderer to colour a table's declared statusColumn.
//
// Tones are hex strings (not renderer-specific tokens) so PPTX, HTML, DOCX and
// PDF can all draw the same colour from one source. A value that matches no
// known keyword is "neutral" — rendered exactly as an ordinary cell, so marking
// a column that turns out to hold free text never miscolours it loudly.

export type CellTone = "critical" | "warn" | "good" | "neutral";

// Whole-word keyword sets. Ordered check: critical, then good, then warn — so a
// value is only "warn" when it is neither clearly bad nor clearly good. Matching
// is case-insensitive and word-boundary, so "high" matches "High" and "high
// risk" but not "highlight".
const CRITICAL = [
  "critical", "high", "severe", "fail", "failed", "failing", "blocked",
  "blocker", "at risk", "at-risk", "off track", "off-track", "overdue",
  "breach", "breached", "no-go", "no go", "red", "escalate", "escalated",
];
const GOOD = [
  "low", "pass", "passed", "passing", "on track", "on-track", "done",
  "complete", "completed", "ready", "healthy", "met", "approved", "go",
  "green", "resolved", "closed",
];
const WARN = [
  "medium", "moderate", "partial", "partially", "in progress", "in-progress",
  "pending", "watch", "caution", "delayed", "amber", "yellow", "review",
  "at plan risk",
];

function hasWord(haystack: string, needle: string): boolean {
  const re = new RegExp(
    `(?<![A-Za-z0-9])${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z0-9])`,
    "i",
  );
  return re.test(haystack);
}

export function cellTone(value: string): CellTone {
  const v = (value ?? "").trim();
  if (!v) return "neutral";
  if (CRITICAL.some((w) => hasWord(v, w))) return "critical";
  if (GOOD.some((w) => hasWord(v, w))) return "good";
  if (WARN.some((w) => hasWord(v, w))) return "warn";
  return "neutral";
}

export interface ToneHex {
  /** Soft cell fill, or null for no fill (neutral). */
  fill: string | null;
  /** Readable text colour on that fill. */
  text: string;
}

/** Hex (no leading #) for each tone — soft tint fill + a darker readable text. */
export const CELL_TONE_HEX: Readonly<Record<CellTone, ToneHex>> = {
  critical: { fill: "F7E4E1", text: "9B2D20" },
  warn: { fill: "F6ECD9", text: "8A6D1F" },
  good: { fill: "E4EFE7", text: "2F5D45" },
  neutral: { fill: null, text: "1B1A17" },
};
