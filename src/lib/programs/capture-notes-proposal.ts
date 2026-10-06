import type { PhaseCaptureSection } from "@/lib/programs/phase-capture-contract";

/**
 * Governed fill-from-notes for the Moves phase capture.
 *
 * A consultant leaves a client conversation with a block of notes, not with
 * answers typed into the right seven boxes. This module turns that block into
 * PROPOSALS — never into saved values. It is deliberately deterministic (no
 * model call), because the thing being proposed is a verbatim span of what the
 * client actually said, and the user has to be able to check it against their
 * own notes without trusting a paraphrase.
 *
 * The governance rules this module exists to enforce:
 *
 * 1. **Nothing is written.** The output is a proposal list. Insertion is a
 *    separate, explicit, per-field act by the person (see `CaptureNotesFill`).
 * 2. **Every proposal carries its provenance verbatim.** `excerpt` is an exact
 *    substring of the pasted notes, with the line it came from, so the reviewer
 *    checks the source rather than the suggestion.
 * 3. **Pasted notes are not approved evidence.** A note-derived fill can only
 *    ever be a workspace assertion — `basis` is a constant, not a judgement.
 *    Unstructured notes a consultant typed are exactly what the P1 charter
 *    basis model calls an assertion; they must never present as "evidence
 *    covered". See `P1CharterBasisInput` in `p1-charter-evidence.ts`.
 * 4. **An answered field is never touched.** A section that already holds a
 *    value is skipped and reported as skipped, so a paste can never silently
 *    overwrite captured work.
 * 5. **Structured sections are never proposed into.** Their values are JSON
 *    (facts tables, estimate models); dropping prose in would corrupt them.
 */

/** A section a paste may propose into, with the value it currently holds. */
export interface CaptureNotesTarget {
  section: PhaseCaptureSection;
  /** The section's current captured value ("" when unanswered). */
  value: string;
}

export interface CaptureNotesProposal {
  sectionKey: string;
  sectionLabel: string;
  /** An exact substring of the pasted notes — never a paraphrase. */
  excerpt: string;
  /** 1-based line number of the excerpt's first line in the pasted notes. */
  sourceLine: number;
  /** Distinct section terms found in the excerpt. Shown as the "why". */
  matchedTerms: readonly string[];
  /**
   * Pasted notes are a workspace user's own account of a conversation, so the
   * only basis they can establish is an assertion. Constant by construction.
   */
  basis: "workspace_assertion";
}

export interface CaptureNotesProposalResult {
  proposals: readonly CaptureNotesProposal[];
  /** Section keys skipped because they already hold a value. */
  skippedAnswered: readonly string[];
  /** Section keys skipped because they are structured (JSON) fields. */
  skippedStructured: readonly string[];
  /** Section keys left without a proposal because nothing in the notes matched. */
  unmatchedSections: readonly string[];
  /** Note blocks that matched no section. */
  unusedBlocks: number;
}

/**
 * Words too common to be evidence that a note block is about a section. Kept
 * deliberately small and generic: a long hand-tuned list would quietly become
 * the matcher's real logic and would not survive a new phase's vocabulary.
 */
const STOPWORDS = new Set([
  "a",
  "about",
  "all",
  "an",
  "and",
  "any",
  "are",
  "as",
  "at",
  "be",
  "been",
  "but",
  "by",
  "can",
  "for",
  "from",
  "has",
  "have",
  "how",
  "in",
  "into",
  "is",
  "it",
  "its",
  "make",
  "makes",
  "may",
  "move",
  "not",
  "now",
  "of",
  "on",
  "one",
  "or",
  "our",
  "out",
  "over",
  "should",
  "that",
  "the",
  "their",
  "them",
  "then",
  "this",
  "to",
  "up",
  "use",
  "was",
  "we",
  "what",
  "when",
  "which",
  "who",
  "why",
  "will",
  "with",
  "you",
  "your",
]);

/**
 * A block must hit at least this many distinct section terms to be proposed.
 * Two is the floor at which a match stops being a coincidence of one shared
 * word; below it the proposal costs the reviewer more than it saves.
 */
const MIN_MATCHED_TERMS = 2;

const MIN_BLOCK_CHARS = 12;

const normalizeWord = (raw: string): string =>
  raw
    .toLowerCase()
    .replace(/[^a-z0-9%$-]+/g, "")
    .replace(/^-+|-+$/g, "");

/** Content terms a section is "about": its label and its description. */
const sectionTerms = (section: PhaseCaptureSection): ReadonlySet<string> => {
  const terms = new Set<string>();
  for (const raw of `${section.label} ${section.description}`.split(/\s+/)) {
    const word = normalizeWord(raw);
    if (word.length < 3) continue;
    if (STOPWORDS.has(word)) continue;
    terms.add(word);
  }
  return terms;
};

interface NoteBlock {
  text: string;
  line: number;
  words: ReadonlySet<string>;
}

/**
 * Split pasted notes into reviewable blocks. A block is a paragraph, or a
 * single bullet/numbered line — the units a person actually writes notes in,
 * and the units they can check an excerpt against.
 */
const splitBlocks = (notes: string): NoteBlock[] => {
  const blocks: NoteBlock[] = [];
  const lines = notes.split(/\r?\n/);

  let buffer: string[] = [];
  let bufferLine = 0;

  const flush = () => {
    if (buffer.length === 0) return;
    const text = buffer.join(" ").trim();
    buffer = [];
    if (text.length < MIN_BLOCK_CHARS) return;
    const words = new Set<string>();
    for (const raw of text.split(/\s+/)) {
      const word = normalizeWord(raw);
      if (word.length >= 3) words.add(word);
    }
    blocks.push({ text, line: bufferLine, words });
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (line.length === 0) {
      flush();
      return;
    }
    // A bullet or numbered item is its own block: consultants list one fact per
    // bullet, and joining them would make every excerpt span unrelated facts.
    if (/^([-*•]|\d+[.)])\s+/.test(line)) {
      flush();
      buffer = [line.replace(/^([-*•]|\d+[.)])\s+/, "")];
      bufferLine = index + 1;
      flush();
      return;
    }
    if (buffer.length === 0) bufferLine = index + 1;
    buffer.push(line);
  });
  flush();

  return blocks;
};

interface ScoredPair {
  blockIndex: number;
  sectionKey: string;
  matchedTerms: string[];
}

/**
 * Propose capture values from pasted notes.
 *
 * Deterministic: the same notes and targets always yield the same proposals in
 * the same order. One block is used at most once and one section receives at
 * most one proposal, so a reviewer never sees the same excerpt twice or two
 * candidates for one field.
 */
export function proposeCaptureValuesFromNotes(args: {
  notes: string;
  targets: readonly CaptureNotesTarget[];
}): CaptureNotesProposalResult {
  const { notes, targets } = args;

  const skippedAnswered: string[] = [];
  const skippedStructured: string[] = [];
  const eligible: CaptureNotesTarget[] = [];

  for (const target of targets) {
    if (target.section.structured) {
      skippedStructured.push(target.section.key);
      continue;
    }
    if (target.value.trim().length > 0) {
      skippedAnswered.push(target.section.key);
      continue;
    }
    eligible.push(target);
  }

  const blocks = splitBlocks(notes);
  if (blocks.length === 0 || eligible.length === 0) {
    return {
      proposals: [],
      skippedAnswered,
      skippedStructured,
      unmatchedSections: eligible.map((t) => t.section.key),
      unusedBlocks: blocks.length,
    };
  }

  const pairs: ScoredPair[] = [];
  for (const target of eligible) {
    const terms = sectionTerms(target.section);
    blocks.forEach((block, blockIndex) => {
      const matchedTerms: string[] = [];
      for (const term of terms) {
        if (block.words.has(term)) matchedTerms.push(term);
      }
      if (matchedTerms.length < MIN_MATCHED_TERMS) return;
      pairs.push({
        blockIndex,
        sectionKey: target.section.key,
        matchedTerms: matchedTerms.sort(),
      });
    });
  }

  // Greedy best-first assignment. Ties break on block order then section key so
  // the result is stable regardless of Map/Set iteration incidentals.
  pairs.sort(
    (a, b) =>
      b.matchedTerms.length - a.matchedTerms.length ||
      a.blockIndex - b.blockIndex ||
      a.sectionKey.localeCompare(b.sectionKey),
  );

  const labelByKey = new Map(
    eligible.map((t) => [t.section.key, t.section.label] as const),
  );
  const usedBlocks = new Set<number>();
  const takenSections = new Set<string>();
  const proposals: CaptureNotesProposal[] = [];

  for (const pair of pairs) {
    if (usedBlocks.has(pair.blockIndex)) continue;
    if (takenSections.has(pair.sectionKey)) continue;
    const block = blocks[pair.blockIndex];
    if (!block) continue;
    usedBlocks.add(pair.blockIndex);
    takenSections.add(pair.sectionKey);
    proposals.push({
      sectionKey: pair.sectionKey,
      sectionLabel: labelByKey.get(pair.sectionKey) ?? pair.sectionKey,
      excerpt: block.text,
      sourceLine: block.line,
      matchedTerms: pair.matchedTerms,
      basis: "workspace_assertion",
    });
  }

  // Present in the capture's own section order, not in score order: the
  // reviewer is walking their form, not a ranked list.
  const order = new Map(eligible.map((t, index) => [t.section.key, index]));
  proposals.sort(
    (a, b) =>
      (order.get(a.sectionKey) ?? 0) - (order.get(b.sectionKey) ?? 0),
  );

  return {
    proposals,
    skippedAnswered,
    skippedStructured,
    unmatchedSections: eligible
      .map((t) => t.section.key)
      .filter((key) => !takenSections.has(key)),
    unusedBlocks: blocks.length - usedBlocks.size,
  };
}
