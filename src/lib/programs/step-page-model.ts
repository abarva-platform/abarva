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

/**
 * Where a row sits. Status lives in the group, never on the row.
 * - decision: gaps, conflicts, missing owners, sign-offs, evidence to review
 * - ranked: an item in a ranking step's list, until the order is confirmed
 * - draft: an Ava draft or a team statement awaiting acceptance
 * - advisory: a flag this page cannot settle, such as a route flag (template
 *   v1.10). It never blocks and is never counted; its clause comes last.
 * - set_aside: ruled out of scope (a symptom, not a cause); not open
 * - settled: accepted by a person
 */
export type StepRowState =
  | "decision"
  | "ranked"
  | "draft"
  | "advisory"
  | "set_aside"
  | "settled";

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
  clause?: string | null;
  /**
   * A draft row's own clause, used only when a step states its clauses in
   * row order ("confirm the workflow change"); see `clausesInRowOrder`.
   */
  draftClause?: string;
  /**
   * A draft row's short name for the sentence when it is the only draft:
   * "the PHI access draft". Without it the sentence counts drafts.
   */
  draftName?: string;
}

/** The Work groups, in their fixed order. */
export interface StepRowGroups<R extends StepRow = StepRow> {
  decision: R[];
  ranked: R[];
  draft: R[];
  advisory: R[];
  setAside: R[];
  settled: R[];
}

const byRank = <R extends StepRow>(a: R, b: R) => a.rank - b.rank;

/** Fixed group order, upstream rank within a group. */
export function groupStepRows<R extends StepRow>(
  rows: readonly R[],
): StepRowGroups<R> {
  const sorted = [...rows].sort(byRank);
  const of = (state: StepRowState) =>
    sorted.filter((row) => row.state === state);
  return {
    decision: of("decision"),
    ranked: of("ranked"),
    draft: of("draft"),
    advisory: of("advisory"),
    setAside: of("set_aside"),
    settled: of("settled"),
  };
}

/** The sentence carries at most three clauses; beyond that it points below. */
const MAX_CLAUSES = 3;

function joinClauses(all: readonly string[]): string {
  const clauses =
    all.length > MAX_CLAUSES
      ? [
          ...all.slice(0, MAX_CLAUSES - 1),
          `${all.length - (MAX_CLAUSES - 1)} more below`,
        ]
      : all;
  if (clauses.length <= 1) return clauses[0] ?? "";
  if (clauses.length === 2) return `${clauses[0]} and ${clauses[1]}`;
  // Semicolons keep three substantial instructions distinct, especially
  // when a row's own short name contains a conjunction.
  return clauses.join("; ");
}

function sentence(body: string): string {
  const trimmed = body.trim().replace(/[.\s]+$/, "");
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}.`;
}

function readyActionSentence(body: string): string {
  // Ready copy can contain a completion statement, provenance, and a
  // forward action. Keep all three facts in one action line without dropping
  // the source wording or introducing a second sentence.
  return sentence(
    body
      .replace(/\.\s+(?=[A-Z])/g, "; ")
      .replace(/;\s+Continue\s+to\s+/i, "; continue to "),
  );
}

const decisionClause = (row: StepRow) =>
  row.clause?.trim() || `decide ${row.subject.trim()}`;

/**
 * The one imperative sentence: decisions first, each in its own words and in
 * rank order, then the drafts — named when there is exactly one with a name,
 * counted otherwise. A step whose rows read as one ordered list
 * (`clausesInRowOrder`, P3 Step 3) states every open row's own clause in rank
 * order instead. Advisory clauses come last, and only beside another clause:
 * an advisory alone never keeps a step open. Past three clauses the first two
 * stay and the rest read "N more below". Returns null when nothing is open.
 */
export function buildNextActionSentence(
  rows: readonly StepRow[],
  options: {
    /** The ranking's one clause while its order is unconfirmed: "confirm the order". */
    rankingClause?: string;
    /** Every open row's own clause, in rank order (template v1.10). */
    clausesInRowOrder?: boolean;
  } = {},
): string | null {
  const { decision, ranked, draft, advisory } = groupStepRows(rows);
  const inRowOrder = Boolean(options.clausesInRowOrder);
  const clauses = (
    inRowOrder ? [...decision, ...draft].sort(byRank) : decision
  ).flatMap((row) =>
    row.clause === null
      ? []
      : [
          row.state === "draft"
            ? row.draftClause?.trim() ||
              `review ${row.draftName?.trim() || "the draft"}`
            : decisionClause(row),
        ],
  );
  if (ranked.length > 0) {
    clauses.push(options.rankingClause?.trim() || "confirm the order");
  }
  if (!inRowOrder && draft.length === 1 && draft[0].draftName?.trim()) {
    clauses.push(`review ${draft[0].draftName.trim()}`);
  } else if (!inRowOrder && draft.length > 0) {
    clauses.push(
      `review ${draft.length} ${draft.length === 1 ? "draft" : "drafts"}`,
    );
  }
  if (clauses.length === 0) return null;
  clauses.push(...advisory.map(decisionClause));
  return sentence(joinClauses(clauses));
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
  /** The ranking's clause while its order is unconfirmed. */
  rankingClause?: string;
  /** Every open row's own clause, in rank order (see `buildNextActionSentence`). */
  clausesInRowOrder?: boolean;
  /**
   * The step's own Skipped sentence (template v1.10, profile-driven skip):
   * "Nothing to do here. The P2 route makes this a technical change, …".
   */
  skippedSentence?: string;
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
  // A set-aside row is resolved (ruled out), not settled, so it is neither
  // open nor part of the count; an advisory is never counted (v1.10).
  const counted = input.rows.filter(
    (row) => row.state !== "set_aside" && row.state !== "advisory",
  );
  const total = counted.length;
  const settled = counted.filter((row) => row.state === "settled").length;
  const count = { settled, total };

  if (input.depth === "skip") {
    return {
      state: "skipped",
      eyebrow: "Skipped",
      sentence: input.skippedSentence?.trim()
        ? sentence(input.skippedSentence)
        : SKIPPED_SENTENCE,
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

  const open = buildNextActionSentence(input.rows, {
    rankingClause: input.rankingClause,
    clausesInRowOrder: input.clausesInRowOrder,
  });
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
    sentence: readyActionSentence(input.readySentence),
    ...count,
    continueEnabled: true,
  };
}
