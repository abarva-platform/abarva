import type { StepDepth } from "@/lib/programs/phase-workflow-registry";

/**
 * The pure rules of the Moves step page template.
 *
 * Every step page answers one question first: "what should I do to move
 * forward?". A step differs from another only in its rows; this module owns
 * what every step shares — the row contract, the fixed grouping, the
 * next-action sentence, the settled count and the five page states — so a new
 * step is a registry entry plus an adapter that produces rows, never new page
 * rules.
 *
 * Nothing here decides a row. A recommendation is not an approval: a row is
 * settled only when a person accepted it, and Ava's drafts stay drafts.
 */

/** Where a row sits. Status lives in the group, never on the row. */
export type StepRowState = "decision" | "draft" | "settled";

export interface StepRow {
  /** Stable id shown in mono, e.g. "RC-4" or "OPT-B". */
  id: string;
  /** Upstream rank (P2 root-cause rank, option order). Rows never reorder within a group. */
  rank: number;
  /** The row's subject, e.g. the root cause it designs for. */
  subject: string;
  state: StepRowState;
  /**
   * A decision row's own clause in the next-action sentence, imperative and
   * lower case: "decide who designs identity resolution". Names the decision,
   * never a control.
   */
  clause?: string;
  /**
   * A draft row's short name for the sentence when it is the only draft:
   * "the PHI access draft". Without it the sentence counts drafts.
   */
  draftName?: string;
}

export interface StepRowGroups<R extends StepRow = StepRow> {
  decision: R[];
  draft: R[];
  settled: R[];
}

const byRank = <R extends StepRow>(a: R, b: R) => a.rank - b.rank;

/** Fixed group order, upstream rank within a group. */
export function groupStepRows<R extends StepRow>(
  rows: readonly R[],
): StepRowGroups<R> {
  const sorted = [...rows].sort(byRank);
  return {
    decision: sorted.filter((row) => row.state === "decision"),
    draft: sorted.filter((row) => row.state === "draft"),
    settled: sorted.filter((row) => row.state === "settled"),
  };
}

/** The sentence carries at most three clauses; beyond that it points below. */
const MAX_CLAUSES = 3;

function joinClauses(all: readonly string[]): string {
  const clauses =
    all.length > MAX_CLAUSES
      ? [...all.slice(0, MAX_CLAUSES - 1), `${all.length - (MAX_CLAUSES - 1)} more below`]
      : all;
  if (clauses.length <= 1) return clauses[0] ?? "";
  if (clauses.length === 2) return `${clauses[0]} and ${clauses[1]}`;
  return `${clauses.slice(0, -1).join(", ")}, and ${clauses[clauses.length - 1]}`;
}

function sentence(body: string): string {
  const trimmed = body.trim().replace(/[.\s]+$/, "");
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}.`;
}

/**
 * The one imperative sentence: decisions first, each in its own words and in
 * rank order, then the drafts — named when there is exactly one with a name,
 * counted otherwise. Past three clauses the first two stay and the rest read
 * "N more below". Returns null when nothing is open.
 */
export function buildNextActionSentence(
  rows: readonly StepRow[],
): string | null {
  const { decision, draft } = groupStepRows(rows);
  const clauses = decision.map(
    (row) => row.clause?.trim() || `decide ${row.subject.trim()}`,
  );
  if (draft.length === 1 && draft[0].draftName?.trim()) {
    clauses.push(`review ${draft[0].draftName.trim()}`);
  } else if (draft.length > 0) {
    clauses.push(`review ${draft.length} ${draft.length === 1 ? "draft" : "drafts"}`);
  }
  return clauses.length > 0 ? sentence(joinClauses(clauses)) : null;
}

export type StepPageState =
  | "in_progress"
  | "ready"
  | "blocked"
  | "skipped"
  | "done";

export interface StepPageInput {
  depth: StepDepth;
  rows: readonly StepRow[];
  /**
   * An outside cause the step cannot resolve on its own page ("P2 has no
   * accepted root causes"). A step whose inputs could not be read is blocked,
   * never ready: an unreadable input is not an empty one.
   */
  blockedBy?: string | null;
  /** When the step was recorded done. Reopening any row clears it. */
  doneAt?: string | null;
  /** The step's own ready sentence, e.g. "… Continue to Architecture options." */
  readySentence: string;
  /** What to do when the step has no rows yet, e.g. "Add the design session output." */
  emptySentence: string;
}

export interface StepNextAction {
  state: StepPageState;
  eyebrow: string;
  sentence: string;
  settled: number;
  total: number;
  /** Ready, skipped and done let the consultant continue; nothing else does. */
  continueEnabled: boolean;
}

export const SKIPPED_SENTENCE =
  "Nothing to do here. This step is skipped for this use case, by attestation.";
export const DONE_SENTENCE =
  "Nothing to do here. Reopening any row reopens this step.";

function formatDoneDate(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * The NextAction region for a step: its state, eyebrow, sentence and the
 * `N of M settled` count. Order matters: a skipped step is skipped whatever
 * its rows say; an outside block wins over local progress; done needs every
 * row still settled.
 */
export function resolveStepNextAction(input: StepPageInput): StepNextAction {
  const total = input.rows.length;
  const settled = input.rows.filter((row) => row.state === "settled").length;
  const count = { settled, total };

  if (input.depth === "skip") {
    return {
      state: "skipped",
      eyebrow: "Skipped",
      sentence: SKIPPED_SENTENCE,
      ...count,
      continueEnabled: true,
    };
  }

  const blockedBy = input.blockedBy?.trim();
  if (blockedBy) {
    return {
      state: "blocked",
      eyebrow: "Blocked",
      sentence: sentence(blockedBy),
      ...count,
      continueEnabled: false,
    };
  }

  const open = buildNextActionSentence(input.rows);
  if (open) {
    return {
      state: "in_progress",
      eyebrow: "Next",
      sentence: open,
      ...count,
      continueEnabled: false,
    };
  }

  if (total === 0) {
    return {
      state: "in_progress",
      eyebrow: "Next",
      sentence: sentence(input.emptySentence),
      ...count,
      continueEnabled: false,
    };
  }

  const doneDate = input.doneAt ? formatDoneDate(input.doneAt) : null;
  if (doneDate) {
    return {
      state: "done",
      eyebrow: `✓ Done · ${doneDate}`,
      sentence: DONE_SENTENCE,
      ...count,
      continueEnabled: true,
    };
  }

  return {
    state: "ready",
    eyebrow: "✓ Ready",
    sentence: sentence(input.readySentence),
    ...count,
    continueEnabled: true,
  };
}
