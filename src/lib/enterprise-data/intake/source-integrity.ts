/**
 * Source integrity checks that run on recorded tenant files, before anything is built from them.
 *
 * These catch a class of defect that every other gate passes: the file parses, every column is
 * populated, no value is malformed, and the dataset is still wrong -- because the defect is in the
 * RELATIONSHIP between values rather than in any single one.
 *
 * Three checks, each for a failure that reached main:
 *
 *   JOIN CONVENTION.  Two tenants referenced their systems by different keys -- one by name, one by
 *   an id that lived in a provenance column. Both files were individually valid. Every flow in one
 *   tenant dangled, and a consumer joining on the documented key got nothing back, silently.
 *
 *   DEGENERATE DISTRIBUTION.  A numeric column where a handful of values repeat across hundreds of
 *   rows is not a measurement, it is a label. Each row looks plausible and the total looks
 *   plausible; only the distribution shows that no per-row figure was ever recorded. Any
 *   concentration, Pareto or top-N analysis over it produces a confident false answer.
 *
 *   VOCABULARY DRIFT.  The same recorded column carrying different value spaces per tenant means
 *   every consumer must special-case, and the special cases are where tenants get confused.
 *
 * All three report. None repairs. A validator that fixes what it finds hides the fact that the
 * source is wrong, and the source is what the client will be shown.
 */

export type IntegrityCode =
  | "constant_reference_column"
  | "empty_relationship_column"
  | "unresolvable_reference"
  | "reference_key_is_provenance"
  | "join_convention_differs_across_tenants"
  | "degenerate_numeric_distribution"
  | "vocabulary_drift_across_tenants";

export interface IntegrityFinding {
  code: IntegrityCode;
  severity: "error" | "warning";
  tenantKey: string;
  file?: string;
  column?: string;
  message: string;
  /** Numbers behind the finding, so it can be argued with rather than believed. */
  detail?: Record<string, unknown>;
}

export type Row = Record<string, string>;

function values(rows: Row[], column: string): string[] {
  return rows.map((r) => (r[column] ?? "").trim()).filter(Boolean);
}

/**
 * Checks that references in one file resolve against the declared identity column of another.
 *
 * Reports separately when the references resolve against a PROVENANCE column instead. That
 * distinction is the finding: "nothing resolves" reads as missing data, when the truth is that the
 * data is all present under a key nobody declared.
 */
export function checkReferences(input: {
  tenantKey: string;
  file: string;
  rows: Row[];
  referenceColumns: string[];
  target: { file: string; identityColumn: string; provenanceColumns: string[]; rows: Row[] };
}): IntegrityFinding[] {
  const findings: IntegrityFinding[] = [];
  const refs = new Set(input.referenceColumns.flatMap((c) => values(input.rows, c)));
  if (!refs.size) return findings;

  const identity = new Set(values(input.target.rows, input.target.identityColumn));
  const unresolved = [...refs].filter((r) => !identity.has(r));
  if (!unresolved.length) return findings;

  for (const provenance of input.target.provenanceColumns) {
    const alt = new Set(values(input.target.rows, provenance));
    const viaProvenance = unresolved.filter((r) => alt.has(r));
    if (viaProvenance.length === unresolved.length) {
      findings.push({
        code: "reference_key_is_provenance",
        severity: "error",
        tenantKey: input.tenantKey,
        file: input.file,
        column: input.referenceColumns.join("|"),
        message: `Every reference in ${input.file} resolves against ${input.target.file}.${provenance}, which is a provenance field, and none against the declared identity ${input.target.identityColumn}. The data is all here under a key nobody declared, so a consumer joining on the documented key gets nothing and reports an empty topology rather than an error.`,
        detail: { references: refs.size, resolvedVia: provenance, resolvedAgainstIdentity: refs.size - unresolved.length },
      });
      return findings;
    }
  }

  findings.push({
    code: "unresolvable_reference",
    severity: "error",
    tenantKey: input.tenantKey,
    file: input.file,
    column: input.referenceColumns.join("|"),
    message: `${unresolved.length} of ${refs.size} references in ${input.file} do not resolve against ${input.target.file}.${input.target.identityColumn}. Each names a system the estate file does not contain.`,
    detail: { unresolved: unresolved.slice(0, 10), unresolvedCount: unresolved.length, totalReferences: refs.size },
  });
  return findings;
}

/**
 * Flags a numeric column whose values repeat too few times to be per-row measurements.
 *
 * The threshold is expressed as distinct values relative to row count, because that is the shape
 * of the failure: a generator assigning one constant per category produces a handful of distinct
 * values however many rows there are.
 */
export function checkNumericDistribution(input: {
  tenantKey: string;
  file: string;
  column: string;
  rows: Row[];
  /** Below this many distinct values per hundred rows, the column is a label rather than a measure. */
  minDistinctPerHundred?: number;
}): IntegrityFinding[] {
  const raw = values(input.rows, input.column);
  const numeric = raw.map((v) => Number(v.replace(/[,$]/g, ""))).filter((n) => Number.isFinite(n));
  if (numeric.length < 30) return [];

  const distinct = new Set(numeric).size;
  const perHundred = (distinct / numeric.length) * 100;
  const floor = input.minDistinctPerHundred ?? 5;
  if (perHundred >= floor) return [];

  const counts = new Map<number, number>();
  for (const n of numeric) counts.set(n, (counts.get(n) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return [
    {
      code: "degenerate_numeric_distribution",
      severity: "error",
      tenantKey: input.tenantKey,
      file: input.file,
      column: input.column,
      message: `${input.column} has ${distinct} distinct values across ${numeric.length} rows. A figure that repeats across hundreds of rows is a category label, not a per-row measurement. Each row looks plausible and the total looks plausible, so nothing else catches this -- but any concentration, Pareto or top-N analysis over this column returns a confident answer about a value that was never recorded.`,
      detail: {
        distinct,
        rows: numeric.length,
        distinctPerHundredRows: Number(perHundred.toFixed(2)),
        mostCommon: top.map(([value, count]) => ({ value, count })),
      },
    },
  ];
}

/**
 * Flags the same recorded column carrying different value spaces across tenants.
 *
 * A warning rather than an error: two clients genuinely may describe their estates differently,
 * and forcing a shared vocabulary onto recorded data would be putting our schema ahead of what the
 * client said. What must not happen is a consumer quietly assuming one of them.
 */
export function checkVocabularyDrift(input: {
  file: string;
  column: string;
  byTenant: Record<string, Row[]>;
}): IntegrityFinding[] {
  const spaces = Object.entries(input.byTenant).map(
    ([tenantKey, rows]) => [tenantKey, new Set(values(rows, input.column))] as const,
  );
  if (spaces.length < 2) return [];

  const findings: IntegrityFinding[] = [];
  for (const [tenantKey, space] of spaces) {
    const others = spaces.filter(([k]) => k !== tenantKey);
    const shared = [...space].filter((v) => others.some(([, s]) => s.has(v)));
    if (shared.length) continue;
    findings.push({
      code: "vocabulary_drift_across_tenants",
      severity: "warning",
      tenantKey,
      file: input.file,
      column: input.column,
      message: `${input.column} shares no value with any other tenant. Two clients may legitimately describe their estates differently, and forcing a shared vocabulary onto recorded data would put our schema ahead of what the client said. The risk is a consumer that quietly assumes one tenant's spelling -- classify into a declared vocabulary rather than matching these strings.`,
      detail: { distinctValues: [...space].slice(0, 12), valueCount: space.size },
    });
  }
  return findings;
}

/**
 * Flags a reference column that carries one value across every row, or none at all.
 *
 * A relationship column with a single distinct value is not a reference -- it is a constant that
 * landed there, and the file will still look populated because the descriptive columns beside it
 * are real. This is the hardest shape to notice by eye: the rows have genuine, distinct names, the
 * row count is plausible, and there is no relationship data in the file whatsoever.
 */
export function checkRelationshipColumns(input: {
  tenantKey: string;
  file: string;
  rows: Row[];
  referenceColumns: string[];
  /** Values that are never a system: template ids, packet names, version strings. */
  nonDataTokens?: string[];
}): IntegrityFinding[] {
  const findings: IntegrityFinding[] = [];
  if (input.rows.length < 10) return findings;

  for (const column of input.referenceColumns) {
    const all = input.rows.map((r) => (r[column] ?? "").trim());
    const populated = all.filter(Boolean);

    if (!populated.length) {
      findings.push({
        code: "empty_relationship_column",
        severity: "error",
        tenantKey: input.tenantKey,
        file: input.file,
        column,
        message: `${column} is blank on all ${all.length} rows. The file looks populated because the descriptive columns beside it are real and distinct, but it carries no relationship data at all -- so any flow or topology view built from it is built from nothing.`,
        detail: { rows: all.length },
      });
      continue;
    }

    const distinct = new Set(populated);
    if (distinct.size === 1) {
      const [only] = [...distinct];
      const looksLikeMetadata = (input.nonDataTokens ?? []).some(
        (token) => only === token || only.includes(token),
      );
      findings.push({
        code: "constant_reference_column",
        severity: "error",
        tenantKey: input.tenantKey,
        file: input.file,
        column,
        message: looksLikeMetadata
          ? `${column} holds "${only}" on every row, which is a template or packet identifier rather than a system. A column shift or a mis-mapped generator wrote file metadata into a relationship column, and nothing downstream can tell because the value is a valid string.`
          : `${column} holds the single value "${only}" across all ${populated.length} populated rows. A reference column with one distinct value is a constant that landed there, not a reference.`,
        detail: { value: only, rows: populated.length },
      });
    }
  }

  return findings;
}

export function summarise(findings: IntegrityFinding[]): string {
  if (!findings.length) return "No source integrity findings.";
  const errors = findings.filter((f) => f.severity === "error");
  const lines = [`${findings.length} findings (${errors.length} errors).`];
  for (const f of findings) {
    lines.push(`\n[${f.severity}] ${f.code} — ${f.tenantKey}${f.file ? ` · ${f.file}` : ""}${f.column ? ` · ${f.column}` : ""}\n  ${f.message}`);
  }
  return lines.join("\n");
}
