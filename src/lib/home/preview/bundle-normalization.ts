import type { ConstantColumn, HomeReviewBundle, TechRecordType } from "./types";

/**
 * Computes, once at load, which columns carry the same value on every row.
 *
 * A column that never varies is a field left at its default, not an assessment. Sitting beside
 * columns that do vary it reads as a result that came back the same way every time -- and it is
 * silently useless as a filter or a predicate, because narrowing on it returns everything.
 *
 * This runs at the loader rather than in each surface. Three places on this page ask "does this
 * field vary" -- the record browser, the exposure band, and the decision queue -- and three
 * independent answers is how one of them ends up claiming a condition it is not applying.
 *
 * Applied to BOTH read paths. The stored copy and the served projection are built by different
 * functions from different rows, and a normalisation wired into only one of them is the same
 * mistake as a test that covers only the fixture.
 */
export function normalizeHomeReviewBundle(
  bundle: HomeReviewBundle,
): HomeReviewBundle {
  if (!bundle.technologyEstate) return bundle;
  return {
    ...bundle,
    technologyEstate: {
      ...bundle.technologyEstate,
      recordTypes: bundle.technologyEstate.recordTypes.map(withConstantColumns),
    },
  };
}

function withConstantColumns(recordType: TechRecordType): TechRecordType {
  return {
    ...recordType,
    constantColumns: constantColumnsForRecord(recordType),
  };
}

/**
 * The detector itself, exported so a surface can fall back to it.
 *
 * The loader normally runs this once and stamps the answer on the record. A component that is
 * handed a record built some other way -- a test, a future caller -- would otherwise report no
 * constant columns at all, which is the quiet failure this whole change exists to remove. One
 * implementation, reachable from both places; not two implementations that can disagree.
 */
export function constantColumnsForRecord(
  recordType: Pick<TechRecordType, "rows" | "columns">,
): ConstantColumn[] {
  const rows = recordType.rows ?? [];
  // Declared column order first, then any key a row carries that the declaration missed -- a field
  // present on the rows but absent from `columns` is exactly the kind that goes unexamined.
  const columns = [
    ...(recordType.columns ?? []),
    ...rows.flatMap((row) => Object.keys(row)),
  ];
  return [...new Set(columns)]
    .map((column) => constantColumnFor(column, rows))
    .filter((column): column is ConstantColumn => column !== null);
}

function constantColumnFor(
  column: string,
  rows: TechRecordType["rows"],
): ConstantColumn | null {
  // One row cannot establish that anything is constant; it establishes that there is one row.
  if (rows.length < 2) return null;
  const values = rows.map((row) => row[column]);
  const present = values.filter(
    (value) => value !== null && value !== undefined && value !== "",
  );
  // A column that is merely SPARSE is a different fact, reported elsewhere. This is only about a
  // column that is filled everywhere and says the same thing everywhere.
  if (present.length !== rows.length) return null;
  const distinct = [...new Set(present.map(formatConstantValue))];
  if (distinct.length !== 1) return null;
  return {
    key: column,
    label: labelFor(column),
    value: distinct[0]!,
    rowCount: rows.length,
  };
}

function formatConstantValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function labelFor(field: string): string {
  return field
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Whether a field varies across a set of rows. The question the queue and the bands both ask. */
export function fieldVaries(
  rows: Array<Record<string, unknown>>,
  field: string,
): boolean {
  const present = rows
    .map((row) => row[field])
    .filter((value) => value !== null && value !== undefined && value !== "")
    .map(formatConstantValue);
  return new Set(present).size > 1;
}
