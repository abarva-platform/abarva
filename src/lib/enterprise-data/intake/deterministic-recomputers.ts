/**
 * Deterministic enrichment columns, computed here rather than read from the workbook.
 *
 * A deterministic column is reproducible from recorded data by definition, so accepting the
 * submitted value buys nothing and admits tampering. These functions ARE the definition -- the
 * workbook's copy exists only so the client can see what we will compute, and is compared, never
 * used.
 *
 * Each one is a pure function of the recorded rows of one file. That constraint is deliberate: a
 * value that needs another file to compute is not deterministic at this stage, it is a join, and a
 * join belongs after canonical merge where both sides have identity.
 */

export type RecordedRow = Record<string, string | undefined>;

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

/* -- 04_applications_systems ----------------------------------------------------------------- */

/**
 * Banded interface count.
 *
 * Bands rather than the raw number because the raw number is already recorded; what enrichment
 * adds is the threshold judgement, and a threshold is only reviewable if it is stated once here
 * rather than re-invented by each consumer.
 */
export function computeInterfaceIntensity(rows: RecordedRow[]): string[] {
  return rows.map((row) => {
    const raw = clean(row.interfaces_count);
    if (!raw) return "unknown";
    // Parsed whole, not stripped of non-digits. Stripping turns "many" into "" and Number("") is
    // 0, which would band it as "isolated" -- asserting the system has no integrations when what
    // we actually have is a value we could not read.
    if (!/^\d+(?:\.\d+)?$/.test(raw)) return "unknown";
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) return "unknown";
    if (n === 0) return "isolated";
    if (n <= 3) return "lightly_integrated";
    if (n <= 10) return "integrated";
    return "heavily_integrated";
  });
}

/* -- 05_data_assets_integrations -------------------------------------------------------------- */

/**
 * How many DISTINCT source systems write into this row's target system, across the whole file.
 *
 * This is a property of the TARGET, not of the row. Computed per-row it is always 1 and says
 * nothing -- which was the defect in the first draft of this column. Counted across the file it is
 * the convergence measure that makes a warehouse or a landing zone visible in the data rather than
 * assumed from its name.
 *
 * A source system that appears twice writing to the same target counts once: two feeds from one
 * system is not two dependencies.
 */
export function computeTargetFanIn(rows: RecordedRow[]): string[] {
  const sourcesByTarget = new Map<string, Set<string>>();
  for (const row of rows) {
    const target = clean(row.target_system);
    const source = clean(row.source_system);
    if (!target || !source) continue;
    const set = sourcesByTarget.get(target) ?? new Set<string>();
    set.add(source);
    sourcesByTarget.set(target, set);
  }
  return rows.map((row) => {
    const target = clean(row.target_system);
    if (!target) return "unknown";
    return String(sourcesByTarget.get(target)?.size ?? 0);
  });
}

/**
 * How many distinct targets this row's SOURCE system feeds, across the whole file.
 *
 * The mirror of fan-in, and the one that shows what a single retirement would break.
 */
export function computeSourceFanOut(rows: RecordedRow[]): string[] {
  const targetsBySource = new Map<string, Set<string>>();
  for (const row of rows) {
    const target = clean(row.target_system);
    const source = clean(row.source_system);
    if (!target || !source) continue;
    const set = targetsBySource.get(source) ?? new Set<string>();
    set.add(target);
    targetsBySource.set(source, set);
  }
  return rows.map((row) => {
    const source = clean(row.source_system);
    if (!source) return "unknown";
    return String(targetsBySource.get(source)?.size ?? 0);
  });
}

/* -- 06_infrastructure_platforms --------------------------------------------------------------- */

const CRITICALITY_RANK: Record<string, string> = {
  "mission critical": "1",
  "mission-critical": "1",
  critical: "1",
  tier1: "1",
  "tier 1": "1",
  high: "2",
  important: "2",
  tier2: "2",
  "tier 2": "2",
  medium: "3",
  moderate: "3",
  tier3: "3",
  "tier 3": "3",
  low: "4",
  minor: "4",
  tier4: "4",
  "tier 4": "4",
};

/**
 * Ordinal rank from the recorded criticality label, so ordering is one stated mapping rather than
 * a different string comparison in every consumer.
 *
 * An unrecognised label stays unknown. Guessing a rank from an unfamiliar word is exactly the kind
 * of quiet judgement this whole layer exists to make visible.
 */
export function computeCriticalityRank(rows: RecordedRow[]): string[] {
  return rows.map((row) => CRITICALITY_RANK[clean(row.criticality).toLowerCase()] ?? "unknown");
}

/* -- registry ---------------------------------------------------------------------------------- */

export type DeterministicRecomputer = (rows: RecordedRow[]) => string[];

export const DETERMINISTIC_RECOMPUTERS: Record<string, DeterministicRecomputer> = {
  det__interface_intensity: computeInterfaceIntensity,
  det__target_fan_in: computeTargetFanIn,
  det__source_fan_out: computeSourceFanOut,
  det__criticality_rank: computeCriticalityRank,
};

/** Recomputes every deterministic column a schema declares, for one file's recorded rows. */
export function recomputeDeterministicColumns(input: {
  rows: RecordedRow[];
  columns: string[];
}): { values: Record<string, string[]>; unimplemented: string[] } {
  const values: Record<string, string[]> = {};
  const unimplemented: string[] = [];
  for (const column of input.columns) {
    const fn = DETERMINISTIC_RECOMPUTERS[column];
    if (!fn) {
      // A declared column with no implementation must be loud. Silently omitting it would leave
      // the workbook's own submitted value as the only candidate, which is the thing being
      // prevented.
      unimplemented.push(column);
      continue;
    }
    values[column] = fn(input.rows);
  }
  return { values, unimplemented };
}
