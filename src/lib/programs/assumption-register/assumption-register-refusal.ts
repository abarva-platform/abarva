// What a refused assumptions-register request tells the consultant.
//
// The three register routes (`/api/v1/programs/<moveId>/assumptions`, its
// `[assumptionId]` edit route and its `decision` route) answer every refusal
// with a machine `error` code AND an authored `detail` sentence. Each sentence
// says what the reader can do next AND what did or did not land — a refusal
// that leaves "was anything saved?" open invites a second, duplicate write.
//
// `detail` here is always authored prose, never a machine value (no raw field
// name, no status token, no revision alone), so a reader may render
// `detail ?? error` safely.
//
// The Move-unreadable 404 is NOT a register refusal: it keeps the shared,
// cause-blind body from `moveUnreadableRefusalBody` so an absent Move, a
// foreign Move and a Move outside the caller's grants stay byte-identical.

import {
  ASSUMPTION_TRANSITIONS,
  EDITABLE_STATUSES,
  type AssumptionAction,
  type AssumptionRecord,
  type AssumptionStatus,
} from "./model";
import type { StoreRefusal } from "./store";
import { moveUnreadableRefusalBody } from "@/lib/programs/move-unreadable-refusal";

/** The decisions the decision route accepts, in the reader's vocabulary. */
export const REGISTER_DECISION_ACTIONS = [
  "accept",
  "reject",
  "answer",
  "supersede",
] as const;
export type RegisterDecisionAction = (typeof REGISTER_DECISION_ACTIONS)[number];

/** Request fields a `bad_request` can name. A `Record` over it keeps every one labelled. */
export type RegisterRequestField =
  | "body"
  | "area"
  | "statement"
  | "source"
  | "ownerRole"
  | "confidence"
  | "workingValue"
  | "raisedPhase"
  | "edit"
  | "expectedRevision"
  | "action"
  | "outcome"
  | "answer"
  | "answerValue"
  | "replacement";

const FIELD_LABEL: Readonly<Record<RegisterRequestField, string>> = {
  body: "The request could not be read",
  area: "The area must be value, data, delivery or adoption",
  statement: "The assumption needs a statement",
  source: "The assumption needs a source: where the figure came from",
  ownerRole:
    "The assumption needs an owner role, such as Finance Director (a role, not a person's name)",
  confidence: "Confidence must be 1, 3 or 5",
  workingValue: "The working value must be a number",
  raisedPhase: "The phase it was raised in must be a phase from 0 to 5",
  edit: "The edit changed nothing that can be edited",
  expectedRevision:
    "The request must say which revision of the assumption you were looking at",
  action: "The decision must be accept, reject, answer or supersede",
  outcome: "An answer must say whether it confirms or corrects the figure",
  answer: "A correction must state the corrected answer",
  answerValue: "The answer value must be a number",
  replacement:
    "A supersede must name the replacement: an existing row on this register, or a new replacement row with a statement, source, owner role and confidence",
};

/** Every register refusal code, with the HTTP status it answers with. */
export const REGISTER_REFUSAL_STATUS = {
  forbidden: 403,
  stale_revision: 409,
  invalid_transition: 409,
  answer_source_required: 400,
  unknown_assumption: 404,
  register_not_enabled: 404,
  bad_request: 400,
  id_allocation_conflict: 409,
  register_read_failed: 500,
  register_write_unconfirmed: 500,
  supersede_incomplete: 500,
  owner_role_is_a_person: 400,
} as const satisfies Record<string, number>;

export type RegisterRefusalCode = keyof typeof REGISTER_REFUSAL_STATUS;

/** A register refusal with the context its sentence needs. */
export type RegisterRefusal =
  | { code: "forbidden" }
  | { code: "stale_revision"; currentRevision: number | null }
  | {
      code: "invalid_transition";
      from: AssumptionStatus;
      /** What was attempted: a model action, or an edit. */
      attempted: AssumptionAction | "edit";
    }
  | { code: "answer_source_required" }
  | { code: "unknown_assumption"; which: "row" | "supersede_target" }
  | { code: "register_not_enabled" }
  | { code: "bad_request"; field: RegisterRequestField }
  | { code: "id_allocation_conflict" }
  | { code: "register_read_failed" }
  | { code: "register_write_unconfirmed" }
  | {
      /** `ownerRole` reads like a person (`looksLikePersonalName`, owner-role.ts). */
      code: "owner_role_is_a_person";
    }
  | {
      /** The replacement row landed; the supersede of the old row did not. */
      code: "supersede_incomplete";
      replacement: Pick<AssumptionRecord, "registerId" | "revision">;
    };

const ATTEMPT_PHRASE: Readonly<Record<AssumptionAction | "edit", string>> = {
  accept: "accepted",
  reject: "rejected",
  confirm: "answered as confirmed",
  correct: "answered with a correction",
  supersede: "superseded",
  edit: "edited",
};

const PARTICIPLE: Readonly<Record<AssumptionAction, string>> = {
  accept: "accepted",
  reject: "rejected",
  confirm: "confirmed",
  correct: "corrected",
  supersede: "superseded",
};

function joinOr(words: readonly string[]): string {
  if (words.length <= 1) return words.join("");
  return `${words.slice(0, -1).join(", ")} or ${words[words.length - 1]}`;
}

function withArticle(word: string): string {
  return `${/^[aeiou]/.test(word) ? "An" : "A"} ${word}`;
}

/**
 * What can still be done to a row in `status`, read from the transition table
 * itself so the sentence and the rules cannot drift apart.
 */
export function describeNextSteps(status: AssumptionStatus): string {
  const actions = (
    Object.keys(ASSUMPTION_TRANSITIONS) as AssumptionAction[]
  ).filter((action) => ASSUMPTION_TRANSITIONS[action].from.includes(status));
  if (actions.length === 0) {
    return `${withArticle(status)} assumption is final; nothing more can be done to it.`;
  }
  return `${withArticle(status)} assumption can only be ${joinOr(
    actions.map((action) => PARTICIPLE[action]),
  )}.`;
}

/** The sentence for one refusal. Every sentence states what did or did not land. */
export function describeRegisterRefusal(refusal: RegisterRefusal): string {
  switch (refusal.code) {
    case "forbidden":
      return (
        "Your account can view this Move but cannot change its assumptions register. " +
        "Nothing was saved. Ask a member of the Move team to make this change."
      );
    case "stale_revision":
      return (
        (refusal.currentRevision === null
          ? "Someone changed this assumption after you opened it. "
          : `Someone changed this assumption after you opened it; it is now at revision ${refusal.currentRevision}. `) +
        "Nothing was saved. Reload the register, check the current version, and make your change again."
      );
    case "invalid_transition":
      if (refusal.attempted === "edit") {
        return (
          `This assumption is ${refusal.from}, so it can no longer be edited: only ${joinOr(EDITABLE_STATUSES)} assumptions can be edited. ` +
          "Nothing was changed. " +
          describeNextSteps(refusal.from)
        );
      }
      return (
        `This assumption is ${refusal.from}, so it cannot be ${ATTEMPT_PHRASE[refusal.attempted]}. ` +
        "Nothing was changed. " +
        describeNextSteps(refusal.from)
      );
    case "answer_source_required":
      return (
        "An answer must name its source: the document, system or role the answer came from. " +
        "Nothing was saved. Add the source and answer again."
      );
    case "unknown_assumption":
      return refusal.which === "supersede_target"
        ? "The row named as the replacement is not on this Move's register, so nothing was superseded. " +
            "Reload the register and choose a replacement from its rows, or supersede with a new replacement row."
        : "This assumption is not on this Move's register. Nothing was changed. " +
            "Reload the register to see its current rows.";
    case "register_not_enabled":
      return "The assumptions register is not turned on for this workspace, so nothing was read or saved.";
    case "bad_request":
      return `${FIELD_LABEL[refusal.field]}. Nothing was saved.`;
    case "id_allocation_conflict":
      return (
        "Several people were adding assumptions at the same moment and a register ID could not be allocated. " +
        "Nothing was saved. Add the assumption again."
      );
    case "register_read_failed":
      return "The assumptions register could not be read just now. Nothing was changed. Reload to try again.";
    case "register_write_unconfirmed":
      return (
        "The change could not be confirmed: it may or may not have been saved. " +
        "Reload the register to see the assumption's current state before trying again."
      );
    case "owner_role_is_a_person":
      return (
        "The owner role reads like a person's name or an email address. Nothing was saved. " +
        "The owner field takes a role, such as CFO office or Finance Director, because documents and aVa read the owner role and must never carry a person's name. " +
        "Enter the role, and put the person's name in the owner name field if you need it."
      );
    case "supersede_incomplete":
      return (
        `The replacement assumption ${refusal.replacement.registerId} WAS saved as an open row, ` +
        "but its history entry was not recorded and this assumption was NOT superseded. " +
        `To finish, supersede this assumption with ${refusal.replacement.registerId} as the replacement rather than adding another, ` +
        "and tell your workspace administrator so the history can be repaired."
      );
  }
}

/** The JSON body of a refusal. */
export function registerRefusalBody(
  refusal: RegisterRefusal,
  detailSuffix?: string,
): {
  ok: false;
  error: RegisterRefusalCode;
  detail: string;
  currentRevision?: number | null;
} {
  const detail = describeRegisterRefusal(refusal);
  return {
    ok: false,
    error: refusal.code,
    detail: detailSuffix ? `${detail} ${detailSuffix}` : detail,
    ...(refusal.code === "stale_revision"
      ? { currentRevision: refusal.currentRevision }
      : {}),
  };
}

/**
 * A refusal as a `Response`, with its status. `extra` rides beside the body;
 * `detailSuffix` appends a sentence about something that DID land.
 */
export function registerRefusalResponse(
  refusal: RegisterRefusal,
  extra: Record<string, unknown> = {},
  detailSuffix?: string,
): Response {
  return Response.json(
    { ...extra, ...registerRefusalBody(refusal, detailSuffix) },
    { status: REGISTER_REFUSAL_STATUS[refusal.code] },
  );
}

/**
 * Map a store refusal to the route's answer. `unknown_program` means the Move
 * is not this client's — answered with the shared cause-blind 404 body, never
 * a register-specific code.
 */
export function storeRefusalResponse(
  refusal: StoreRefusal,
  extra: Record<string, unknown> = {},
  detailSuffix?: string,
): Response {
  const respond = (mapped: RegisterRefusal) =>
    registerRefusalResponse(mapped, extra, detailSuffix);
  switch (refusal.code) {
    case "unknown_program":
      return Response.json(moveUnreadableRefusalBody(), { status: 404 });
    case "unknown_assumption":
      return respond({ code: "unknown_assumption", which: "row" });
    case "unknown_supersede_target":
      return respond({ code: "unknown_assumption", which: "supersede_target" });
    case "stale_revision":
      return respond({
        code: "stale_revision",
        currentRevision: refusal.currentRevision,
      });
    case "id_allocation_conflict":
      return respond({ code: "id_allocation_conflict" });
    case "expected_register_id_drift":
      return respond({ code: "id_allocation_conflict" });
    case "invalid_transition":
      return respond({
        code: "invalid_transition",
        from: refusal.from,
        attempted: refusal.action,
      });
    case "edit_not_allowed":
      return respond({
        code: "invalid_transition",
        from: refusal.status,
        attempted: "edit",
      });
    case "actor_not_permitted":
      return respond({ code: "forbidden" });
    case "answer_source_required":
      return respond({ code: "answer_source_required" });
    case "answer_required":
      return respond({ code: "bad_request", field: "answer" });
    case "superseded_by_required":
      return respond({ code: "bad_request", field: "replacement" });
    case "invalid_input":
      return respond({
        code: "bad_request",
        field: requestFieldFor(refusal.field),
      });
  }
}

/** The model's `invalid_input` field names, in the request's own vocabulary. */
function requestFieldFor(field: string): RegisterRequestField {
  return field in FIELD_LABEL ? (field as RegisterRequestField) : "body";
}

/**
 * A supersede whose replacement row was stored before the supersede itself
 * was refused. The replacement is a valid open row; the sentence says so, so
 * the consultant points the supersede at it instead of adding another.
 */
export function describeLandedReplacement(
  replacement: Pick<AssumptionRecord, "registerId">,
): string {
  return (
    `The replacement assumption ${replacement.registerId} WAS saved as an open row. ` +
    `To finish, supersede this assumption with ${replacement.registerId} as the replacement rather than adding another.`
  );
}

/**
 * The change landed but its history entry did not. The write succeeded, so the
 * route answers with the stored row; this sentence stops a repeat.
 */
export function describeHistoryNotRecorded(
  record: Pick<AssumptionRecord, "registerId" | "revision">,
): string {
  return (
    `The change to ${record.registerId} was saved (revision ${record.revision}), but its history entry was not recorded. ` +
    "Do not repeat the change. Tell your workspace administrator so the history can be repaired."
  );
}
