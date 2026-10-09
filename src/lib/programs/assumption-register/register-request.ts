// Assumptions register — request parsing and the viewer's projection.
//
// Pure. The routes read a JSON body into the store's typed inputs here, and
// project every stored row through `assumptionForViewer` before it leaves the
// server.
//
// Two rules live here because both are about what the HTTP body may NOT do:
//   - the body never sets `origin` or `status`. A row created over HTTP is a
//     team row (`origin: "team"`, which the store opens at once); any `origin`
//     or `status` the client sends is ignored. aVa proposes only through its
//     own tool, which writes `ava_proposal` with actor kind `ava`.
//   - the area never changes on an edit: it is part of the register ID.
//
// Redaction: a viewer whose access policy withholds financial data gets every
// figure nulled and every free-text field passed through the shared restricted
// financial sanitizer. The register's figures are working figures for a
// business case, so the whole figure set is withheld rather than guessed at
// per area.

import { sanitizeRestrictedFinancialText } from "@/lib/agent/restricted-output-policy";
import {
  type AssumptionArea,
  type AssumptionEdit,
  type AssumptionRecord,
  type NewAssumptionInput,
  type RegisterConfidence,
  type TransitionRequest,
} from "./model";
import {
  REGISTER_DECISION_ACTIONS,
  type RegisterDecisionAction,
  type RegisterRequestField,
} from "./assumption-register-refusal";

type Parsed<T> =
  | { ok: true; value: T }
  | { ok: false; field: RegisterRequestField };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A text field: a string is kept (trimmed later by the store), anything else is absent. */
function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

/** A required text field. Non-strings become "", which the model refuses by name. */
function requiredText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** `undefined` = not sent; `null` = cleared; a finite number; otherwise invalid. */
function optionalNumber(value: unknown): number | null | undefined | "invalid" {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : "invalid";
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter(
    (item): item is string => typeof item === "string" && item.trim() !== "",
  );
}

function expectedRevisionOf(body: Record<string, unknown>): number | null {
  const value = body.expectedRevision;
  return typeof value === "number" && Number.isInteger(value) && value >= 1
    ? value
    : null;
}

/** The body of a team-created row. `origin` and `status` in the body are ignored. */
export function parseNewAssumptionRequest(
  body: unknown,
): Parsed<NewAssumptionInput> {
  if (!isRecord(body)) return { ok: false, field: "body" };
  const workingValue = optionalNumber(body.workingValue);
  if (workingValue === "invalid") return { ok: false, field: "workingValue" };
  return {
    ok: true,
    value: {
      area: body.area as AssumptionArea,
      statement: requiredText(body.statement),
      whyItMatters: optionalText(body.whyItMatters),
      workingFigure: optionalText(body.workingFigure),
      workingValue: workingValue ?? null,
      unit: optionalText(body.unit),
      source: requiredText(body.source),
      confidence: body.confidence as RegisterConfidence,
      ownerRole: requiredText(body.ownerRole),
      ownerName: optionalText(body.ownerName),
      ownerPersonId: optionalText(body.ownerPersonId),
      // Range and integer checks are the model's (`validateNewAssumption`),
      // which refuses a non-number by name too.
      raisedPhase: (body.raisedPhase ?? null) as number | null,
      raisedStepId: optionalText(body.raisedStepId),
      evidenceIds: stringArray(body.evidenceIds) ?? [],
      origin: "team",
    },
  };
}

const EDIT_TEXT_FIELDS = [
  "statement",
  "whyItMatters",
  "workingFigure",
  "unit",
  "source",
  "ownerRole",
  "ownerName",
  "ownerPersonId",
  "raisedStepId",
] as const;

/** An edit: the revision the person was looking at, and the fields they changed. */
export function parseEditRequest(
  body: unknown,
): Parsed<{ expectedRevision: number; edit: AssumptionEdit }> {
  if (!isRecord(body)) return { ok: false, field: "body" };
  const expectedRevision = expectedRevisionOf(body);
  if (expectedRevision === null)
    return { ok: false, field: "expectedRevision" };
  const edit: AssumptionEdit = {};
  for (const field of EDIT_TEXT_FIELDS) {
    if (body[field] === undefined) continue;
    // A non-string clears the field; the model refuses a cleared required
    // field (statement, source, owner role) by name.
    (edit as Record<string, unknown>)[field] =
      typeof body[field] === "string" ? body[field] : null;
  }
  const workingValue = optionalNumber(body.workingValue);
  if (workingValue === "invalid") return { ok: false, field: "workingValue" };
  if (workingValue !== undefined) edit.workingValue = workingValue;
  if (body.confidence !== undefined) {
    edit.confidence = body.confidence as RegisterConfidence;
  }
  const evidenceIds = stringArray(body.evidenceIds);
  if (evidenceIds !== undefined) edit.evidenceIds = evidenceIds;
  return { ok: true, value: { expectedRevision, edit } };
}

export type RegisterDecision =
  | {
      action: Exclude<RegisterDecisionAction, "supersede">;
      expectedRevision: number;
      request: TransitionRequest;
    }
  | {
      action: "supersede";
      expectedRevision: number;
      target:
        | { kind: "existing"; supersededBy: string }
        | {
            kind: "new";
            replacement: Omit<NewAssumptionInput, "area" | "origin">;
          };
    };

/**
 * A decision body. `answer` carries an explicit `outcome` — `confirmed` or
 * `corrected` — so a re-answer never silently flips one into the other.
 */
export function parseDecisionRequest(body: unknown): Parsed<RegisterDecision> {
  if (!isRecord(body)) return { ok: false, field: "body" };
  const action = body.action;
  if (
    typeof action !== "string" ||
    !(REGISTER_DECISION_ACTIONS as readonly string[]).includes(action)
  ) {
    return { ok: false, field: "action" };
  }
  const expectedRevision = expectedRevisionOf(body);
  if (expectedRevision === null)
    return { ok: false, field: "expectedRevision" };
  switch (action as RegisterDecisionAction) {
    case "accept":
      return {
        ok: true,
        value: {
          action: "accept",
          expectedRevision,
          request: { action: "accept" },
        },
      };
    case "reject":
      return {
        ok: true,
        value: {
          action: "reject",
          expectedRevision,
          request: { action: "reject" },
        },
      };
    case "answer": {
      const outcome = body.outcome;
      if (outcome !== "confirmed" && outcome !== "corrected") {
        return { ok: false, field: "outcome" };
      }
      const answerValue = optionalNumber(body.answerValue);
      if (answerValue === "invalid") return { ok: false, field: "answerValue" };
      const answer = {
        answerSource: requiredText(body.answerSource),
        answerFigure: optionalText(body.answerFigure),
        answerValue: answerValue ?? null,
      };
      return {
        ok: true,
        value: {
          action: "answer",
          expectedRevision,
          request:
            outcome === "confirmed"
              ? {
                  action: "confirm",
                  ...answer,
                  answer: optionalText(body.answer),
                }
              : {
                  action: "correct",
                  ...answer,
                  answer: requiredText(body.answer),
                },
        },
      };
    }
    case "supersede": {
      if (typeof body.supersededBy === "string" && body.supersededBy.trim()) {
        return {
          ok: true,
          value: {
            action: "supersede",
            expectedRevision,
            target: {
              kind: "existing",
              supersededBy: body.supersededBy.trim(),
            },
          },
        };
      }
      if (!isRecord(body.replacement))
        return { ok: false, field: "replacement" };
      const parsed = parseNewAssumptionRequest(body.replacement);
      if (!parsed.ok) return parsed;
      // The replacement inherits the superseded row's area, and the store sets
      // its origin; neither is taken from the body.
      const replacement: Partial<NewAssumptionInput> = { ...parsed.value };
      delete replacement.area;
      delete replacement.origin;
      return {
        ok: true,
        value: {
          action: "supersede",
          expectedRevision,
          target: {
            kind: "new",
            replacement: replacement as Omit<
              NewAssumptionInput,
              "area" | "origin"
            >,
          },
        },
      };
    }
  }
}

/** A register row as the reader receives it. The tenant fence never leaves the server. */
export type AssumptionView = Omit<AssumptionRecord, "tenantKey"> & {
  figuresRedacted: boolean;
};

/**
 * Project a stored row for one viewer. Without financial visibility every
 * figure is withheld (nulled, not masked, so no length or magnitude leaks) and
 * the free-text fields go through the shared restricted-financial sanitizer.
 */
export function assumptionForViewer(
  record: AssumptionRecord,
  viewer: { canViewFinancialData: boolean },
): AssumptionView {
  const copy: Omit<AssumptionRecord, "tenantKey"> & { tenantKey?: string } = {
    ...record,
  };
  delete copy.tenantKey;
  const rest: Omit<AssumptionRecord, "tenantKey"> = copy;
  if (viewer.canViewFinancialData) return { ...rest, figuresRedacted: false };
  const policy = { outputPolicy: { exactFinancialValues: false } };
  const clean = (value: string | null) =>
    value === null ? null : sanitizeRestrictedFinancialText(value, policy);
  return {
    ...rest,
    statement: sanitizeRestrictedFinancialText(rest.statement, policy),
    whyItMatters: clean(rest.whyItMatters),
    source: sanitizeRestrictedFinancialText(rest.source, policy),
    answer: clean(rest.answer),
    answerSource: clean(rest.answerSource),
    workingFigure: null,
    workingValue: null,
    answerFigure: null,
    answerValue: null,
    figuresRedacted: true,
  };
}
