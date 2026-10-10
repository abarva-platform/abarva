// Move assumptions register — the rows one step page relies on.
//
// A step page never writes a figure of its own (template v1.10): every figure
// it shows is a FACT with a source, or an ESTIMATE that cites a register row
// as `[A:ID]` with the row's status and owner role. This module picks the rows
// a step relies on and words each as the step's reference line. Pure, so the
// step page can read it on the client.

import {
  effectiveFigure,
  isCountedStatus,
  type AssumptionArea,
  type AssumptionRecord,
  type AssumptionStatus,
} from "./model";

/** The fields of a register row the step page reads (an `AssumptionView`). */
export type RelianceRow = Pick<
  AssumptionRecord,
  | "registerId"
  | "area"
  | "seq"
  | "statement"
  | "status"
  | "ownerRole"
  | "source"
  | "confidence"
  | "origin"
  | "raisedStepId"
  | "workingFigure"
  | "answerFigure"
  | "unit"
> & { figuresRedacted?: boolean };

export const RELIANCE_STATUS_LABEL: Readonly<Record<AssumptionStatus, string>> =
  {
    proposed: "proposed",
    open: "open",
    confirmed: "confirmed",
    corrected: "corrected",
    superseded: "superseded",
    rejected: "rejected",
  };

const CURRENCY =
  /[$€£¥₹]|\b(?:usd|eur|gbp|jpy|inr|aud|cad|chf|dollars?|euros?|pounds?|budget|cost|price|spend)\b/i;

/**
 * A figure stated in money. Money at planning rates belongs to the P3 Step 4
 * estimate, never on the operating-and-adoption step.
 */
export function isMoneyRow(row: RelianceRow): boolean {
  return [row.unit, row.workingFigure, row.answerFigure].some(
    (part) => typeof part === "string" && CURRENCY.test(part),
  );
}

/**
 * The rows a step relies on: rows raised on that step, and rows in the areas
 * it reads, that a person accepted and that still stand (open, confirmed or
 * corrected). Proposals, rejected and superseded rows never count, and a row
 * stated in money is left to the estimate. Register order: area, then ID.
 */
export function rowsStepReliesOn<R extends RelianceRow>(
  rows: readonly R[],
  step: { stepId: string; areas: readonly AssumptionArea[] },
): { rows: R[]; moneyLeftOut: number } {
  const relied = rows.filter(
    (row) =>
      isCountedStatus(row.status) &&
      (row.raisedStepId === step.stepId || step.areas.includes(row.area)),
  );
  const kept = relied
    .filter((row) => !isMoneyRow(row))
    .sort((a, b) => a.registerId.localeCompare(b.registerId) || a.seq - b.seq);
  return { rows: kept, moneyLeftOut: relied.length - kept.length };
}

/**
 * A register row as an ESTIMATE line: its figure (or, when figures are
 * withheld from this viewer or it has none, its statement) and the reference
 * `[A:A1] open · Steward lead`.
 */
export function relianceLine(row: RelianceRow): { text: string; cite: string } {
  const figure = row.figuresRedacted ? null : effectiveFigure(row);
  return {
    text: figure?.trim() ? figure.trim() : row.statement,
    cite: `[A:${row.registerId}] ${RELIANCE_STATUS_LABEL[row.status]} · ${row.ownerRole}`,
  };
}
