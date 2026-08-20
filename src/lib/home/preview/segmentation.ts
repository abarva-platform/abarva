import type { TechRecordType } from "./types";

const NOT_SPECIFIED = "(not specified)";
const MIN_DISTINCT = 2;
const MAX_DISTINCT = 12;

type Row = TechRecordType["rows"][number];

function bucketValue(value: Row[string]): string {
  return value === null || value === undefined || value === "" ? NOT_SPECIFIED : String(value);
}

/** Which of this record type's own real columns are usable as a second segmentation axis --
 * string-valued (not a quantitative field like annualCostUsd), and few enough distinct values to
 * render as matrix columns (2-12). Never invents a category: every value returned here is a
 * column name that already exists verbatim in the source canonical data. */
export function eligibleCrossDimensions(recordType: TechRecordType): string[] {
  const eligible: string[] = [];
  for (const col of recordType.columns) {
    if (col === recordType.primaryDimension) continue;
    const nonNull = recordType.rows.map((r) => r[col]).filter((v) => v !== null && v !== undefined && v !== "");
    if (nonNull.length === 0) continue;
    if (!nonNull.every((v) => typeof v === "string")) continue;
    const distinct = new Set(nonNull.map(String));
    if (distinct.size < MIN_DISTINCT || distinct.size > MAX_DISTINCT) continue;
    eligible.push(col);
  }
  return eligible;
}

export interface CrossTab {
  rowDimension: string;
  colDimension: string;
  rowValues: string[];
  colValues: string[];
  /** matrix[rowIndex][colIndex] = real count of records with that exact combination. */
  matrix: number[][];
  rowTotals: number[];
  colTotals: number[];
}

/** A genuine two-dimensional cross-tab -- e.g. business function (rows) by data platform type
 * (columns) -- built entirely from real per-record field values, the same shape as a segmentation
 * matrix an analyst would build by hand from the source extract. Row order follows the record
 * type's own dimensionCounts (already sorted by real volume); column order is the same descending
 * frequency, computed fresh for this column. */
export function computeCrossTab(recordType: TechRecordType, colDimension: string): CrossTab | null {
  const rowDimension = recordType.primaryDimension;
  if (!rowDimension) return null;

  const rowValues = recordType.dimensionCounts.map((d) => d.value);

  const colCounts = new Map<string, number>();
  for (const row of recordType.rows) {
    const bucket = bucketValue(row[colDimension]);
    colCounts.set(bucket, (colCounts.get(bucket) ?? 0) + 1);
  }
  const colValues = Array.from(colCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([value]) => value);

  const matrix: number[][] = rowValues.map(() => colValues.map(() => 0));
  for (const row of recordType.rows) {
    const rowBucket = bucketValue(row[rowDimension]);
    const colBucket = bucketValue(row[colDimension]);
    const rowIdx = rowValues.indexOf(rowBucket);
    const colIdx = colValues.indexOf(colBucket);
    if (rowIdx === -1 || colIdx === -1) continue;
    matrix[rowIdx][colIdx] += 1;
  }

  const rowTotals = matrix.map((cols) => cols.reduce((sum, n) => sum + n, 0));
  const colTotals = colValues.map((_, colIdx) => matrix.reduce((sum, cols) => sum + cols[colIdx], 0));

  return { rowDimension, colDimension, rowValues, colValues, matrix, rowTotals, colTotals };
}
