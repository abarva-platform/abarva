import {
  ROOT_CAUSE_REGISTER_KIND,
  isRootCauseRegisterComplete,
  isRootCauseSettled,
  parseRootCauseRegister,
  rankedRootCauses,
  type RootCauseEntry,
  type RootCauseRegister,
} from "@/lib/programs/root-cause-register";
import type { StepNextAction } from "@/lib/programs/step-page-model";

/**
 * P2 Step 3, "Rank what's causing the gap": the operations the step page
 * performs on the root-cause register, and what the page says to do next.
 *
 * Every operation is a pure function returning a new register (or a refusal
 * sentence), so the rules hold wherever the register is edited:
 * - the order is the consultant's; any move clears the confirmation;
 * - a cause is accepted only with approved evidence, or resolved without it
 *   only with a named owner;
 * - aVa may draft a cause; nothing here lets a draft settle itself.
 */

export type RootCauseEdit =
  | { ok: true; register: RootCauseRegister }
  | { ok: false; reason: string };

const ok = (register: RootCauseRegister): RootCauseEdit => ({
  ok: true,
  register,
});
const refuse = (reason: string): RootCauseEdit => ({ ok: false, reason });

export function emptyRootCauseRegister(): RootCauseRegister {
  return { kind: ROOT_CAUSE_REGISTER_KIND, version: 1, causes: [] };
}

function unconfirmed(
  register: RootCauseRegister,
  causes: RootCauseEntry[],
): RootCauseRegister {
  return { kind: ROOT_CAUSE_REGISTER_KIND, version: 1, causes };
}

function update(
  register: RootCauseRegister,
  id: string,
  change: (entry: RootCauseEntry) => RootCauseEntry,
): RootCauseRegister | null {
  const index = register.causes.findIndex((c) => c.id === id);
  if (index < 0) return null;
  const causes = [...register.causes];
  causes[index] = change(causes[index]);
  return { ...register, causes };
}

/** A copy of the entry without the named fields. */
function without(
  entry: RootCauseEntry,
  ...keys: Array<keyof RootCauseEntry>
): RootCauseEntry {
  const copy = { ...entry };
  for (const key of keys) delete copy[key];
  return copy;
}

function nextId(register: RootCauseRegister, prefix: "RC" | "S"): string {
  const used = register.causes
    .map((c) => new RegExp(`^${prefix}-(\\d+)$`).exec(c.id)?.[1])
    .filter((n): n is string => Boolean(n))
    .map(Number);
  return `${prefix}-${(used.length ? Math.max(...used) : 0) + 1}`;
}

/**
 * Move a ranked cause one place up or down among the ranked causes. Symptoms
 * and out-of-scope causes keep their positions and never take a rank.
 */
export function moveRootCause(
  register: RootCauseRegister,
  id: string,
  direction: "up" | "down",
): RootCauseEdit {
  const ranked = rankedRootCauses(register).map((c) => c.id);
  const at = ranked.indexOf(id);
  if (at < 0) return refuse("Only a ranked cause can move.");
  const to = direction === "up" ? at - 1 : at + 1;
  if (to < 0 || to >= ranked.length) {
    return refuse(
      direction === "up" ? "It is already first." : "It is already last.",
    );
  }
  [ranked[at], ranked[to]] = [ranked[to], ranked[at]];
  const byId = new Map(register.causes.map((c) => [c.id, c]));
  const rankedSlots = register.causes
    .map((c, index) => (ranked.includes(c.id) ? index : -1))
    .filter((index) => index >= 0);
  const causes = [...register.causes];
  rankedSlots.forEach((slot, n) => {
    causes[slot] = byId.get(ranked[n])!;
  });
  return ok(unconfirmed(register, causes));
}

export function acceptRootCause(
  register: RootCauseRegister,
  id: string,
  decidedBy: string,
  decidedAt: string,
): RootCauseEdit {
  const entry = register.causes.find((c) => c.id === id);
  if (!entry) return refuse("That cause is no longer on the list.");
  if (!entry.evidence?.length) {
    return refuse(
      "A cause is accepted only on approved evidence. Add the evidence, or resolve it with a named owner.",
    );
  }
  return ok(
    update(register, id, (c) => ({
      ...c,
      status: "accepted",
      decidedBy,
      decidedAt,
    }))!,
  );
}

export function resolveRootCauseWithOwner(
  register: RootCauseRegister,
  id: string,
  resolution: "known_gap" | "out_of_scope",
  owner: string,
  decidedBy: string,
  decidedAt: string,
): RootCauseEdit {
  const named = owner.trim();
  if (!named)
    return refuse("Resolving a cause without evidence needs a named owner.");
  const next = update(register, id, (c) => ({
    ...c,
    status: resolution,
    owner: named,
    decidedBy,
    decidedAt,
  }));
  if (!next) return refuse("That cause is no longer on the list.");
  return ok(
    resolution === "out_of_scope" ? unconfirmed(next, next.causes) : next,
  );
}

/** Back to open: a draft if it has evidence to accept on, otherwise "no evidence". */
export function reopenRootCause(
  register: RootCauseRegister,
  id: string,
): RootCauseEdit {
  const next = update(register, id, (c) => {
    const rest = without(c, "owner", "decidedBy", "decidedAt");
    return { ...rest, status: c.evidence?.length ? "draft" : "no_evidence" };
  });
  return next
    ? ok(unconfirmed(next, next.causes))
    : refuse("That cause is no longer on the list.");
}

export function setAsideAsSymptom(
  register: RootCauseRegister,
  id: string,
  symptomOf?: string,
): RootCauseEdit {
  const next = update(register, id, (c) => {
    const rest = without(c, "owner", "decidedBy", "decidedAt");
    return { ...rest, status: "symptom", ...(symptomOf ? { symptomOf } : {}) };
  });
  return next
    ? ok(unconfirmed(next, next.causes))
    : refuse("That cause is no longer on the list.");
}

/** A symptom promoted to a cause takes the last rank, as a draft to review. */
export function promoteSymptom(
  register: RootCauseRegister,
  id: string,
): RootCauseEdit {
  const entry = register.causes.find(
    (c) => c.id === id && c.status === "symptom",
  );
  if (!entry) return refuse("Only a set-aside symptom can be promoted.");
  const rest = without(entry, "symptomOf");
  const promoted: RootCauseEntry = {
    ...rest,
    id: nextId(register, "RC"),
    status: rest.evidence?.length ? "draft" : "no_evidence",
  };
  return ok(
    unconfirmed(register, [
      ...register.causes.filter((c) => c.id !== id),
      promoted,
    ]),
  );
}

export interface NewRootCause {
  cause: string;
  short?: string;
  drives?: string;
  evidence?: string[];
  confidence?: "high" | "medium" | "low";
}

/**
 * A cause the consultant writes is their own words: accepted when it rests on
 * approved evidence, otherwise open as "no approved evidence". It takes the
 * last rank and clears the confirmation.
 */
export function addRootCause(
  register: RootCauseRegister,
  input: NewRootCause,
  decidedBy: string,
  decidedAt: string,
): RootCauseEdit {
  const cause = input.cause.trim();
  if (!cause) return refuse("Write the cause first.");
  const evidence = (input.evidence ?? []).map((e) => e.trim()).filter(Boolean);
  const drives = input.drives?.trim();
  // Settled on arrival only when it drives a baseline number AND rests on
  // approved evidence; with evidence alone it is the consultant's draft to
  // review; with neither it is open (template v1.5, "Add a cause").
  const status: RootCauseEntry["status"] = !evidence.length
    ? "no_evidence"
    : drives
      ? "accepted"
      : "draft";
  const entry: RootCauseEntry = {
    id: nextId(register, "RC"),
    cause,
    status,
    source: "team",
    ...(input.short?.trim() ? { short: input.short.trim() } : {}),
    ...(drives ? { drives } : {}),
    ...(evidence.length ? { evidence } : {}),
    ...(input.confidence ? { confidence: input.confidence } : {}),
    ...(status === "accepted" ? { decidedBy, decidedAt } : {}),
  };
  return ok(unconfirmed(register, [...register.causes, entry]));
}

/** Change a cause's wording, link or evidence. An accepted cause that loses its evidence reopens. */
export function editRootCause(
  register: RootCauseRegister,
  id: string,
  input: NewRootCause,
): RootCauseEdit {
  const cause = input.cause.trim();
  if (!cause) return refuse("A cause cannot be blank.");
  const evidence = (input.evidence ?? []).map((e) => e.trim()).filter(Boolean);
  const next = update(register, id, (c) => {
    const rest = without(c, "drives", "evidence", "confidence", "short");
    const lostEvidence = c.status === "accepted" && evidence.length === 0;
    return {
      ...rest,
      cause,
      ...(input.short?.trim() ? { short: input.short.trim() } : {}),
      ...(input.drives?.trim() ? { drives: input.drives.trim() } : {}),
      ...(evidence.length ? { evidence } : {}),
      ...(input.confidence ? { confidence: input.confidence } : {}),
      ...(lostEvidence ? { status: "no_evidence" as const } : {}),
    };
  });
  return next ? ok(next) : refuse("That cause is no longer on the list.");
}

/** Record that a file uploaded for this cause is awaiting extraction review. */
export function markEvidenceInReview(
  register: RootCauseRegister,
  id: string,
  label: string,
): RootCauseEdit {
  const next = update(register, id, (c) => ({ ...c, evidenceInReview: label }));
  return next ? ok(next) : refuse("That cause is no longer on the list.");
}

export function confirmRootCauseOrder(
  register: RootCauseRegister,
  by: string,
  at: string,
): RootCauseEdit {
  if (rankedRootCauses(register).length === 0) {
    return refuse("Add at least one cause before confirming the order.");
  }
  return ok({ ...register, orderConfirmedAt: at, orderConfirmedBy: by });
}

/**
 * An earlier free-text answer becomes draft causes, one per non-empty line,
 * in the order written, so nothing the consultant wrote is lost and nothing
 * is presented as accepted.
 */
export function registerFromEarlierAnswer(text: string): RootCauseRegister {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
  return {
    kind: ROOT_CAUSE_REGISTER_KIND,
    version: 1,
    causes: lines.map((cause, index) => ({
      id: `RC-${index + 1}`,
      cause,
      status: "no_evidence",
      source: "legacy",
    })),
  };
}

export type RootCauseValueKind = "empty" | "earlier_answer" | "register";

export function readRootCauseValue(raw: string): {
  kind: RootCauseValueKind;
  register: RootCauseRegister;
} {
  const register = parseRootCauseRegister(raw);
  if (register) return { kind: "register", register };
  return raw.trim()
    ? { kind: "earlier_answer", register: emptyRootCauseRegister() }
    : { kind: "empty", register: emptyRootCauseRegister() };
}

export interface RootCauseStepCheck {
  id: string;
  level: "hard";
  text: string;
  met: boolean;
  note: string;
  targetRowId?: string;
}

export interface RootCauseStepModel {
  checks: RootCauseStepCheck[];
  countLabel: string;
  nextAction: StepNextAction;
}

/** How a sentence names a cause: its authored short name with its id, or the id alone. */
function causeName(c: { id: string; short?: string }): string {
  return c.short ? `${c.short} (${c.id})` : c.id;
}

function sentence(clauses: string[]): string {
  const all =
    clauses.length > 3
      ? [...clauses.slice(0, 2), `${clauses.length - 2} more below`]
      : clauses;
  const body =
    all.length === 1
      ? all[0]
      : all.length === 2
        ? `${all[0]} and ${all[1]}`
        : `${all.slice(0, -1).join(", ")}, and ${all[all.length - 1]}`;
  return `${body.charAt(0).toUpperCase()}${body.slice(1)}.`;
}

/**
 * What the step says to do next. Decisions first (a cause without evidence,
 * an earlier answer to turn into causes), then the drafts, then the order.
 * Ready only when the register is complete, which is the same rule capture
 * completeness applies.
 */
export function resolveRootCauseStep(
  raw: string,
  options: {
    blockedBy?: string | null;
    /**
     * Clauses for decisions outside the register that lead the sentence and
     * hold readiness — an uploaded extraction awaiting review.
     */
    leadingClauses?: readonly string[];
    /** Labels of files awaiting extraction review in this step. */
    evidenceInReview?: readonly string[];
  } = {},
): RootCauseStepModel {
  const leading = (options.leadingClauses ?? []).filter((c) => c.trim());
  const inReview = new Set(options.evidenceInReview ?? []);
  const { kind, register } = readRootCauseValue(raw);
  const ranked = rankedRootCauses(register);
  const accepted = ranked.filter(isRootCauseSettled).length;
  const open = ranked.filter((c) => !isRootCauseSettled(c));
  const unevidenced = open.filter((c) => c.status === "no_evidence");
  const drafts = open.filter((c) => c.status === "draft");
  const confirmed = Boolean(register.orderConfirmedAt);
  const checks: RootCauseStepCheck[] = [
    {
      id: "settled",
      level: "hard",
      text: "Every ranked cause accepted on approved evidence, or resolved with a named owner",
      met: ranked.length > 0 && open.length === 0,
      note: `${accepted} of ${ranked.length} settled`,
      targetRowId: open[0]?.id,
    },
    {
      id: "order",
      level: "hard",
      text: "The order is confirmed",
      met: confirmed && ranked.length > 0,
      note: confirmed ? "confirmed" : "not confirmed",
    },
  ];
  const countLabel = `${accepted} of ${ranked.length} causes settled`;
  const total = ranked.length + 1;
  const settled = accepted + (confirmed && ranked.length > 0 ? 1 : 0);
  const base = { settled, total, countLabel };

  if (options.blockedBy?.trim()) {
    return {
      checks,
      countLabel,
      nextAction: {
        state: "blocked",
        eyebrow: "Blocked",
        sentence: options.blockedBy.trim().replace(/\.?$/, "."),
        settled,
        total,
        continueEnabled: false,
      },
    };
  }

  if (kind === "earlier_answer") {
    return {
      checks,
      ...base,
      nextAction: {
        state: "in_progress",
        eyebrow: "Next",
        sentence: sentence([
          ...leading,
          "turn your earlier answer into ranked causes",
        ]),
        settled: 0,
        total: 1,
        continueEnabled: false,
      },
    };
  }

  if (leading.length === 0 && isRootCauseRegisterComplete(register)) {
    return {
      checks,
      countLabel,
      nextAction: {
        state: "ready",
        eyebrow: "✓ Ready",
        sentence:
          "Every cause rests on approved evidence or has an owner, and the order is set. Continue to Validate hypotheses.",
        settled,
        total,
        continueEnabled: true,
      },
    };
  }

  const clauses = [
    ...leading,
    ...unevidenced
      .filter((c) => !(c.evidenceInReview && inReview.has(c.evidenceInReview)))
      .map((c) => `find evidence for ${causeName(c)} or name its owner`),
    drafts.length === 1
      ? `review the ${causeName(drafts[0])} draft`
      : drafts.length > 1
        ? `review ${drafts.length} drafts`
        : null,
    ranked.length > 0 && !confirmed ? "confirm the order" : null,
  ].filter((c): c is string => Boolean(c));

  return {
    checks,
    countLabel,
    nextAction: {
      state: "in_progress",
      eyebrow: "Next",
      sentence: clauses.length
        ? sentence(clauses)
        : "Add the first root cause.",
      settled,
      total,
      continueEnabled: false,
    },
  };
}
