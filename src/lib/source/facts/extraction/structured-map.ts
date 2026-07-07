// ─────────────────────────────────────────────────────────────────────────────
// Structured-map extraction — deterministic template → SourceEventFactInsert[].
//
// Given a PARSED intake template (rows × columns, already extracted from a CSV /
// XLSX upstream — no LLM, no parsing of raw bytes here) plus its `TemplateFactMap`
// binding, this produces one typed `source_event_facts` insert per mapped, valued
// cell. Every fact is stamped `source_method: 'structured_map'`, `confidence:
// 'high'`, and cited to the template code + column/row, per the keystone contract.
//
// Determinism, not inference: the ONLY thing that decides which fact a column
// becomes is the `TemplateFactMap`. Columns not in the map are collected as
// `unmappedColumns` (surfaced, never dropped). A column whose declared fact does
// not resolve in the catalog, or whose unit/entity drifts from the catalog, is a
// `rejectedRows` entry — loud, not silent. This is the same no-drift discipline
// the template-fact-map tests already assert; here we enforce it at runtime so a
// malformed upload can never seed a bad fact.
//
// Entity attachment: a fact's `entity_ref` follows the FACT's `entityKind`, not
// the template's row entity. An `event`-level fact (e.g. change-order spend) is
// event-scoped → `entity_ref = null`. A `tower`/`app`/`vendor` fact takes the
// row's entity id (read from the template's `entityRefColumn`). This lets one
// template row carry both event-level and entity-level facts (e.g. VOLUMETRICS_V1
// rows are towers but some columns are event-level pools).
// ─────────────────────────────────────────────────────────────────────────────

import type { ValueUnit } from "../../archetypes/types";
import { factSpecByKey } from "../fact-catalog";
import type {
  FactConfidence,
  FactSourceMethod,
  SourceEventFactInsert,
} from "../fact-types";
import type { TemplateColumnMapping, TemplateFactMap } from "../template-fact-map";

/** A single parsed template row: header → cell value (string | number | null). */
export type ParsedTemplateRow = Readonly<
  Record<string, string | number | null | undefined>
>;

/** A parsed template upload: the header set + the data rows. */
export interface ParsedTemplateUpload {
  /** The column headers present in the upload, in order. */
  readonly headers: readonly string[];
  /** The data rows (one object per row, keyed by header). */
  readonly rows: readonly ParsedTemplateRow[];
}

/** A row/column that could not be mapped to a valid, valued fact. */
export interface RejectedCell {
  /** Zero-based index of the row in the upload. */
  readonly rowIndex: number;
  /** The column header the rejection is about. */
  readonly header: string;
  /** The fact key the column was bound to (if any). */
  readonly factKey?: string;
  /** Why it was rejected. */
  readonly reason: string;
}

/** The deterministic mapping outcome. */
export interface StructuredMapResult {
  /** The facts ready to persist. */
  readonly facts: SourceEventFactInsert[];
  /**
   * Headers present in the upload that the template does NOT bind to a fact
   * (nor use as the entity-ref column). Surfaced so drift is visible; never a
   * silent drop.
   */
  readonly unmappedColumns: string[];
  /** Cells that were bound but could not become a fact (bad unit / entity / value). */
  readonly rejectedRows: RejectedCell[];
}

const STRUCTURED_MAP_METHOD: FactSourceMethod = "structured_map";
const STRUCTURED_MAP_CONFIDENCE: FactConfidence = "high";

/**
 * Coerce a raw cell to a finite number for a numeric-unit fact. Tolerates the
 * common export shapes (thousands separators, a leading `$`, a trailing `%`,
 * parenthesised negatives, surrounding whitespace) but never guesses: anything
 * that does not cleanly parse returns `null` and the cell is rejected.
 */
export function coerceNumericCell(
  raw: string | number | null | undefined,
): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;

  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;

  // Parenthesised negative: (1,200) → -1200
  const negative = /^\((.*)\)$/.test(trimmed);
  const inner = negative ? trimmed.replace(/^\((.*)\)$/, "$1") : trimmed;

  const cleaned = inner.replace(/[$,\s]/g, "").replace(/%$/, "");
  if (cleaned.length === 0) return null;
  // Reject anything that is not a plain decimal number after cleaning.
  if (!/^[+-]?\d*\.?\d+$/.test(cleaned)) return null;

  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;
  return negative ? -Math.abs(parsed) : parsed;
}

/** Units whose value lands in `value_numeric`. Every catalog unit today is one. */
const NUMERIC_UNITS: ReadonlySet<ValueUnit> = new Set<ValueUnit>([
  "usd",
  "usd_per_year",
  "pct",
  "count",
  "fte",
  "months",
  "ratio",
]);

/**
 * Validate a column binding against the canonical catalog. Returns an error
 * string when the binding drifts (unknown fact key, or unit/entity that does
 * not match the catalog), or `null` when it is sound.
 */
function validateColumnBinding(col: TemplateColumnMapping): string | null {
  const spec = factSpecByKey(col.factKey);
  if (!spec) {
    return `fact key '${col.factKey}' is not in the catalog`;
  }
  if (col.unit !== spec.unit) {
    return `unit drift: template '${col.unit}' vs catalog '${spec.unit}' for '${col.factKey}'`;
  }
  if (col.entityKind !== spec.entityKind) {
    return `entity drift: template '${col.entityKind}' vs catalog '${spec.entityKind}' for '${col.factKey}'`;
  }
  return null;
}

/**
 * Map a parsed template upload to typed fact inserts, deterministically.
 *
 * @param template  The template contract (from `TEMPLATE_FACT_MAPS`).
 * @param upload    The parsed rows/headers (extracted upstream — no bytes here).
 * @param ctx       The event + tenant scope every fact row is stamped with.
 */
export function mapTemplateUploadToFacts(
  template: TemplateFactMap,
  upload: ParsedTemplateUpload,
  ctx: { readonly sourceEventId: string; readonly clientKey: string },
): StructuredMapResult {
  const facts: SourceEventFactInsert[] = [];
  const rejectedRows: RejectedCell[] = [];

  const mappedHeaders = new Set<string>(template.columns.map((c) => c.header));
  // The entity-ref column is "used" (not a fact, but not unmapped either).
  const knownHeaders = new Set<string>([
    ...mappedHeaders,
    template.entityRefColumn,
  ]);

  // Columns present in the upload the template does not know about.
  const unmappedColumns = upload.headers.filter((h) => !knownHeaders.has(h));

  upload.rows.forEach((row, rowIndex) => {
    // The row's entity id (drives entity_ref for non-event facts).
    const entityRefRaw = row[template.entityRefColumn];
    const entityRefValue =
      entityRefRaw === null || entityRefRaw === undefined
        ? null
        : String(entityRefRaw).trim() || null;

    for (const col of template.columns) {
      // 1) The binding itself must be catalog-sound (no drift).
      const bindingError = validateColumnBinding(col);
      if (bindingError) {
        rejectedRows.push({
          rowIndex,
          header: col.header,
          factKey: col.factKey,
          reason: bindingError,
        });
        continue;
      }

      // 2) The cell must be present. Absent cells are skipped silently (a sparse
      //    template is normal — not every tower reports every column), but a
      //    present-yet-uncoercible value IS a rejection.
      const cell = row[col.header];
      const cellPresent =
        cell !== null && cell !== undefined && String(cell).trim() !== "";
      if (!cellPresent) continue;

      // 3) A non-event fact needs its row entity id to attach to.
      if (col.entityKind !== "event" && !entityRefValue) {
        rejectedRows.push({
          rowIndex,
          header: col.header,
          factKey: col.factKey,
          reason: `entity-level fact requires a value in entity-ref column '${template.entityRefColumn}'`,
        });
        continue;
      }

      // 4) Coerce + unit-validate the value.
      if (!NUMERIC_UNITS.has(col.unit)) {
        // No categorical facts ship today; reject rather than guess a text write.
        rejectedRows.push({
          rowIndex,
          header: col.header,
          factKey: col.factKey,
          reason: `unit '${col.unit}' is not a supported numeric unit for structured map`,
        });
        continue;
      }
      const numeric = coerceNumericCell(cell);
      if (numeric === null) {
        rejectedRows.push({
          rowIndex,
          header: col.header,
          factKey: col.factKey,
          reason: `value '${String(cell)}' is not a valid number for unit '${col.unit}'`,
        });
        continue;
      }

      facts.push({
        source_event_id: ctx.sourceEventId,
        client_key: ctx.clientKey,
        fact_key: col.factKey,
        entity_kind: col.entityKind,
        entity_ref: col.entityKind === "event" ? null : entityRefValue,
        value_numeric: numeric,
        value_text: null,
        unit: col.unit,
        source_method: STRUCTURED_MAP_METHOD,
        source_citation: {
          doc: template.templateCode,
          locator: `column '${col.header}', row ${rowIndex + 1}`,
          entity_ref_column: template.entityRefColumn,
          entity_ref: entityRefValue,
          row_index: rowIndex,
        },
        confidence: STRUCTURED_MAP_CONFIDENCE,
      });
    }
  });

  return { facts, unmappedColumns, rejectedRows };
}
