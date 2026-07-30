/**
 * Fixed allow-list of assembler fields known today to be source-incomplete for
 * airline-demo-new, per the task brief and corroborated independently by
 * consumption-server/shape.ts::shapeEnterpriseBrief hardcoding
 * `perspectives: []` / `interpretation: null`, and by the foundation-closure
 * record's projection.counts never listing executive_perspective_v1 /
 * strategic_interpretation_v1 as built.
 *
 * See reports/airline-knowledge-provider-reconciliation-2026-07-30/
 * SOURCE_INCOMPLETE_COMPONENTS.md for the full writeup.
 *
 * This is a DECLARED list, not a heuristic. isSourceIncomplete() only ever
 * asks "is this field on the list AND is the data actually absent" — it never
 * infers "sparse" from a row count or any other magic threshold. If real
 * executive_perspective_v1 data lands, this list must be revisited by a
 * human (see RISK_ASSESSMENT.md), not auto-detected.
 */

export const SOURCE_INCOMPLETE_FIELDS = [
  "leadership_agenda",
  "csuite_perspectives",
  "leadership_disagreements",
  "executive_commitments",
  "ava_leadership_reasoning",
] as const;
export type SourceIncompleteField = (typeof SOURCE_INCOMPLETE_FIELDS)[number];

const SOURCE_INCOMPLETE_SET: ReadonlySet<string> = new Set(
  SOURCE_INCOMPLETE_FIELDS,
);
export const isSourceIncompleteField = (
  v: unknown,
): v is SourceIncompleteField =>
  typeof v === "string" && SOURCE_INCOMPLETE_SET.has(v);

/**
 * True only when `field` is on the fixed allow-list AND the caller-supplied
 * data is functionally absent (empty array / null). Never called with a
 * field outside the allow-list to force a SOURCE_INCOMPLETE result — that
 * would defeat the point of a declared list.
 */
export function isSourceIncomplete(
  field: SourceIncompleteField,
  hasData: boolean,
): boolean {
  void field; // reserved for future per-field nuance; every current field uses the same rule
  return !hasData;
}
