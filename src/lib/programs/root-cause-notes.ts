import {
  rankedRootCauses,
  type RootCauseRegister,
} from "@/lib/programs/root-cause-register";

/**
 * Fill P2 Step 3 from pasted notes: deterministic PROPOSALS for the
 * root-cause register, under the same rules as the capture's fill-from-notes
 * (`capture-notes-proposal.ts`):
 * - nothing is written; the consultant inserts each proposal;
 * - every proposal carries the verbatim sentence it came from and its line;
 * - pasted notes are an assertion, never approved evidence, so a proposed
 *   cause arrives with no evidence and cannot be accepted until evidence is
 *   added or an owner resolves it;
 * - aVa does not rank: a proposed cause can only join at the bottom.
 */

export interface RootCauseNotesProposal {
  kind: "cause" | "owner";
  /** For an owner proposal: the open cause it would resolve. */
  causeId?: string;
  /** The proposed cause text, or the proposed owner. */
  value: string;
  /** An exact substring of the pasted notes. */
  excerpt: string;
  sourceLine: number;
}

interface Sentence {
  text: string;
  line: number;
}

function sentences(notes: string): Sentence[] {
  const out: Sentence[] = [];
  notes.split(/\r?\n/).forEach((lineText, index) => {
    const pattern = /[^.!?]+[.!?]?/g;
    for (const match of lineText.matchAll(pattern)) {
      const text = match[0].trim();
      if (text.length >= 8) out.push({ text, line: index + 1 });
    }
  });
  return out;
}

const WORD = /[a-z][a-z0-9-]{2,}/g;
const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "into",
  "not",
  "are",
  "was",
  "were",
  "has",
  "have",
  "but",
  "our",
  "their",
  "its",
  "between",
  "across",
  "another",
  "candidate",
  "would",
  "will",
  "own",
  "owns",
  "owner",
]);

function terms(text: string): Set<string> {
  return new Set(
    (text.toLowerCase().match(WORD) ?? []).filter((w) => !STOP.has(w)),
  );
}

function overlap(a: Set<string>, b: Set<string>): number {
  let shared = 0;
  for (const word of a) if (b.has(word)) shared += 1;
  return shared;
}

/** Wording that describes a cause: an absence, a conflict, a drift. */
const CAUSE_MARKER =
  /\b(no|not|lack|lacks|lacking|missing|without|never|drift|drifts|drifting|conflict|conflicts|conflicting|inconsistent|unresolved|undefined|unclear|manual|gap)\b/i;

/** "Dana Ruiz (master-data program) would own it", "owned by Dana Ruiz", "owner: Dana Ruiz". */
const OWNER_PATTERNS: RegExp[] = [
  /([A-Z][\w'’-]+(?:\s+[A-Z][\w'’-]+)+(?:\s*\([^)]+\))?)\s+(?:would|will|could|should)\s+own\b/,
  /\bowned by\s+([A-Z][\w'’-]+(?:\s+[A-Z][\w'’-]+)+(?:\s*\([^)]+\))?)/,
  /\bowner(?:\s+is|:)\s*([A-Z][\w'’-]+(?:\s+[A-Z][\w'’-]+)+(?:\s*\([^)]+\))?)/,
];

function ownerIn(text: string): string | null {
  for (const pattern of OWNER_PATTERNS) {
    const match = pattern.exec(text);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

/** Drop a leading "Another candidate:" style label; the excerpt stays verbatim. */
function causeText(sentence: string): string {
  return sentence
    .replace(/^[A-Za-z ]{2,30}:\s+/, "")
    .replace(/\.$/, "")
    .trim();
}

export function proposeRootCausesFromNotes(
  notes: string,
  register: RootCauseRegister,
): RootCauseNotesProposal[] {
  const all = sentences(notes);
  const open = rankedRootCauses(register).filter(
    (c) => c.status === "no_evidence" && !c.owner,
  );
  const known = register.causes.map((c) => terms(c.cause));
  const proposals: RootCauseNotesProposal[] = [];
  const used = new Set<number>();

  // Owners for open causes: the sentence must name the cause, unless only one
  // cause is open, in which case naming an owner is enough.
  all.forEach((sentence, index) => {
    const owner = ownerIn(sentence.text);
    if (!owner) return;
    const words = terms(sentence.text);
    const target =
      open.length === 1
        ? open[0]
        : open
            .map((c) => ({ c, score: overlap(terms(c.cause), words) }))
            .filter((x) => x.score > 0)
            .sort((a, b) => b.score - a.score)[0]?.c;
    if (!target) return;
    if (proposals.some((p) => p.kind === "owner" && p.causeId === target.id))
      return;
    proposals.push({
      kind: "owner",
      causeId: target.id,
      value: owner,
      excerpt: sentence.text,
      sourceLine: sentence.line,
    });
    used.add(index);
  });

  // New candidate causes: cause wording that no existing cause already covers.
  all.forEach((sentence, index) => {
    if (used.has(index) || !CAUSE_MARKER.test(sentence.text)) return;
    const words = terms(sentence.text);
    // Covered when most of the shorter wording is shared, not when two
    // words happen to be ("EHR" and "claims" appear in different causes).
    const covered = known.some(
      (k) =>
        overlap(k, words) / Math.max(1, Math.min(k.size, words.size)) >= 0.6,
    );
    if (covered) return;
    proposals.push({
      kind: "cause",
      value: causeText(sentence.text),
      excerpt: sentence.text,
      sourceLine: sentence.line,
    });
  });

  return proposals;
}
