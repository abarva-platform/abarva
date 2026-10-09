import type { TraceRow } from "@/lib/programs/design-traceability";
import {
  noteSentences,
  noteTerms,
  ownerInSentence,
  termOverlap,
} from "@/lib/programs/root-cause-notes";

/**
 * Fill P3 Step 1 from pasted notes, under the same rules as P2's
 * (`root-cause-notes.ts`): deterministic proposals carrying the verbatim
 * sentence and its line; drafts only, never accepted for the consultant; only
 * for a cause that has nothing yet, so a typed or accepted element is never
 * replaced.
 */

export interface DesignNotesProposal {
  kind: "element" | "handoff";
  causeId: string;
  /** The proposed design element, or the proposed owner for a hand-off. */
  value: string;
  /** For a hand-off: the program named beside the owner, if any. */
  program?: string;
  excerpt: string;
  sourceLine: number;
}

function causeWords(row: TraceRow): Set<string> {
  return noteTerms(row.cause);
}

export function proposeDesignFromNotes(
  notes: string,
  rows: readonly TraceRow[],
): DesignNotesProposal[] {
  const open = rows.filter((row) => !row.link);
  if (open.length === 0) return [];
  const all = noteSentences(notes);
  const proposals: DesignNotesProposal[] = [];
  const claimed = new Set<string>();

  for (const sentence of all) {
    const words = noteTerms(sentence.text);
    const scored = open
      .filter((row) => !claimed.has(row.causeId))
      .map((row) => ({ row, score: termOverlap(causeWords(row), words) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
    const owner = ownerInSentence(sentence.text);
    const target =
      scored[0]?.row ?? (owner && open.length === 1 ? open[0] : undefined);
    if (!target || claimed.has(target.causeId)) continue;
    if (owner) {
      const program = /\(([^)]+)\)/.exec(owner)?.[1]?.trim();
      proposals.push({
        kind: "handoff",
        causeId: target.causeId,
        value: owner.replace(/\s*\([^)]*\)\s*$/, "").trim(),
        ...(program ? { program } : {}),
        excerpt: sentence.text,
        sourceLine: sentence.line,
      });
      claimed.add(target.causeId);
      continue;
    }
    if ((scored[0]?.score ?? 0) < 1) continue;
    proposals.push({
      kind: "element",
      causeId: target.causeId,
      value: sentence.text.replace(/^[A-Za-z ]{2,30}:\s+/, "").replace(/\.$/, "").trim(),
      excerpt: sentence.text,
      sourceLine: sentence.line,
    });
    claimed.add(target.causeId);
  }
  return proposals;
}
