// ─────────────────────────────────────────────────────────────────────────────
// aVa Source ANSWER EXPORT — Phase C.
//
// The Source chat route (`/api/chat/agent`) is a raw streaming-text endpoint:
// it never assembles an `AvaAnswerPacket` (that contract belongs to
// Intelligence/Home's `src/lib/ava-answer/*`, a DIFFERENT answer surface — see
// `src/lib/source/ava/answer-quality-gate.ts`'s module doc, which states this
// explicitly). So there is no existing "packet → markdown" serializer to reuse
// for Source: this module IS that minimal serializer, scoped to what the
// Source aVa turn actually produces — the (possibly repaired) answer text plus
// the SAME mode-grounding block (`ModeGroundingResult`) already built for that
// turn's prompt + quality gate.
//
// CRITICAL: export must reuse the ALREADY-GENERATED turn. This module takes
// the finished answer text + grounding as plain data and renders them to a
// string — it never calls the model, never re-grounds, never re-runs the
// quality gate. Callers should invoke it with exactly the values already
// computed for that chat turn (the SAME `finalText` the client received, and
// the SAME `groundingBlockText` / `quotableFacts` bag threaded into the gate).
//
// Exportable modes (per the Source aVa answer-mode spec): `decision_recommendation`,
// `value_at_stake`, `vendor_comparison`, `bafo_strategy`, `contract_optimization`.
// `isExportableSourceAnswerMode` is the single source of truth for that list so
// a future UI affordance can gate the export button/action off the same
// predicate this module uses.
// ─────────────────────────────────────────────────────────────────────────────

import type { SourceAnswerMode } from "./answer-mode";

/** The 5 modes the Source aVa spec calls "exportable". */
export const EXPORTABLE_SOURCE_ANSWER_MODES: readonly SourceAnswerMode[] = [
  "decision_recommendation",
  "value_at_stake",
  "vendor_comparison",
  "bafo_strategy",
  "contract_optimization",
];

export function isExportableSourceAnswerMode(mode: SourceAnswerMode | null): boolean {
  if (mode === null) return false;
  return (EXPORTABLE_SOURCE_ANSWER_MODES as readonly string[]).includes(mode);
}

/** Human label for a mode, used as the export's section heading. */
const MODE_LABELS: Partial<Record<SourceAnswerMode, string>> = {
  decision_recommendation: "Decision Recommendation",
  value_at_stake: "Value at Stake",
  vendor_comparison: "Vendor Comparison",
  bafo_strategy: "BAFO Strategy",
  contract_optimization: "Contract Optimization",
};

function modeLabel(mode: SourceAnswerMode | null): string {
  if (mode === null) return "Source aVa Answer";
  return MODE_LABELS[mode] ?? mode;
}

export interface SourceAvaAnswerExportEventSummary {
  code: string;
  name: string;
}

export interface ExportSourceAnswerPacketInput {
  /** The mode this turn was classified as — drives the export's heading and
   * whether the mode is one of the 5 the spec calls "exportable" (callers
   * should check `isExportableSourceAnswerMode` before offering the export
   * action, but this function itself does not refuse a non-exportable mode —
   * it is a pure renderer, not a policy gate). */
  mode: SourceAnswerMode | null;
  /** The event this turn answered about, for the export header. */
  event?: SourceAvaAnswerExportEventSummary | null;
  /** The user's original question for this turn. */
  question: string;
  /** The FINAL (already gated/repaired) answer text — the same text the
   * client received. This function never re-generates or re-repairs it. */
  answerText: string;
  /**
   * The raw mode-grounding block text for this turn (the SAME string injected
   * into the generation prompt and passed to the quality gate) — included
   * verbatim as the export's citation/evidence section so the export is
   * traceable to the SAME grounding the chat answer was checked against, not
   * a fresh re-read.
   */
  groundingBlockText?: string;
  /** The quotable facts bag for this turn (from `ModeGroundingResult.quotableFacts`)
   * — rendered as a compact key/value appendix so the export carries the exact
   * cited figures a reviewer can cross-check. */
  quotableFacts?: Record<string, string>;
  /** ISO timestamp for the export's generated-at line. Defaults to "now" if
   * omitted — callers running this in a test should pass a fixed value for
   * deterministic output. */
  generatedAtIso?: string;
}

/**
 * Render an already-generated Source aVa answer turn to a plain-text/markdown
 * export. Pure function — no I/O, no model call, no re-grounding. Reuses
 * EXACTLY the answer text + grounding block + quotable facts the caller
 * already produced for this turn.
 */
export function exportSourceAnswerPacket(input: ExportSourceAnswerPacketInput): string {
  const generatedAt = input.generatedAtIso ?? new Date().toISOString();
  const lines: string[] = [];

  lines.push(`# ${modeLabel(input.mode)}`);
  lines.push("");
  if (input.event) {
    lines.push(`**Event:** ${input.event.name} (${input.event.code})`);
  }
  lines.push(`**Question:** ${input.question}`);
  lines.push(`**Generated:** ${generatedAt}`);
  lines.push("");
  lines.push("## Answer");
  lines.push("");
  lines.push(input.answerText.trim());

  if (input.groundingBlockText && input.groundingBlockText.trim().length > 0) {
    lines.push("");
    lines.push("## Grounding / Evidence");
    lines.push("");
    lines.push(
      "The figures above are quoted from this deterministic grounding record — not re-computed by the model:",
    );
    lines.push("");
    lines.push("```");
    lines.push(input.groundingBlockText.trim());
    lines.push("```");
  }

  const factEntries = Object.entries(input.quotableFacts ?? {});
  if (factEntries.length > 0) {
    lines.push("");
    lines.push("## Cited Facts");
    lines.push("");
    for (const [key, value] of factEntries) {
      lines.push(`- **${key}:** ${value}`);
    }
  }

  lines.push("");
  lines.push("---");
  lines.push(
    "Exported from AbarVa Source aVa. This export reuses the answer already generated for this chat turn — no new model call was made to produce it.",
  );

  return lines.join("\n");
}
