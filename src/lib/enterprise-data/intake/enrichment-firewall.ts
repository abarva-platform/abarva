import { createHash } from "node:crypto";

/**
 * The enrichment firewall.
 *
 * ARCHITECTURE
 *
 * Recorded data is immutable. Model output is never a column on the recorded record -- it is a
 * PROPOSAL OVERLAY, validated against the exact source version it was derived from, reviewed cell
 * by cell, and merged into canonical state only for the proposals a person approved.
 *
 *   immutable recorded file -> recorded ingestion -> canonical recorded attributes
 *   enrichment overlay -> validate against source hash -> review -> merge approved proposals only
 *
 * WHY THIS SHAPE RATHER THAN GATED COLUMNS
 *
 * `canonical-tenant-data-build.ts` passes every CSV column through generically. A gate placed in
 * that path is one refactor away from being bypassed, and the failure is silent: unapproved model
 * output becomes a canonical attribute indistinguishable from a recorded one. Making the recorded
 * path REFUSE reserved prefixes outright turns that hazard into a firewall -- the dangerous
 * behaviour now fails loudly instead of needing to be remembered.
 *
 * The client still sees one friendly workbook with prefixed columns. On upload those columns are
 * extracted into the overlay and stripped from the recorded stream, so the two never travel
 * together past intake.
 */

/** Reserved on every recorded ingestion path. Their presence in the recorded stream is an error,
 * never a value. */
export const RESERVED_ENRICHMENT_PREFIXES = ["det__", "drv__", "aug__"] as const;

export type EnrichmentBasis = "recorded" | "deterministic" | "derived" | "augmented";

export function basisForColumn(column: string): EnrichmentBasis {
  if (column.startsWith("det__")) return "deterministic";
  if (column.startsWith("drv__")) return "derived";
  if (column.startsWith("aug__")) return "augmented";
  return "recorded";
}

export function isReservedColumn(column: string): boolean {
  return RESERVED_ENRICHMENT_PREFIXES.some((p) => column.startsWith(p));
}

/* -- declared columns ---------------------------------------------------------------------- */

export interface DeclaredEnrichmentColumn {
  column: string;
  basis: Exclude<EnrichmentBasis, "recorded">;
  /**
   * The logical canonical attribute this proposal targets. Stable across bases, so a later
   * recorded `architecture_role` and a derived one occupy ONE key rather than competing.
   *
   * Without this we end up with architectureRole, drvArchitectureRole and augArchitectureRole,
   * and every consumer has to decide which wins.
   */
  targetAttribute: string;
  vocabulary?: string[];
  /** Recorded columns a proposal for this attribute may cite. Drives the dependency hash that
   * makes invalidation exact rather than blunt. */
  evidenceFields: string[];
}

export interface EnrichmentSchema {
  schemaVersion: string;
  templateFile: string;
  columns: DeclaredEnrichmentColumn[];
}

/* -- hashing ------------------------------------------------------------------------------- */

export function hashContent(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Hash of only the recorded evidence fields a proposal depends on.
 *
 * This is what makes invalidation precise. A client correcting an unrelated column in the same
 * file must not invalidate every derivation in it; a client correcting a field the proposal
 * actually cited must invalidate that proposal immediately.
 */
export function dependencyHash(row: Record<string, unknown>, evidenceFields: string[]): string {
  const parts = [...evidenceFields]
    .sort()
    .map((f) => `${f}=${String(row[f] ?? "")}`)
    .join(" ");
  return hashContent(parts);
}

/* -- the firewall -------------------------------------------------------------------------- */

export interface RecordedStreamCheck {
  ok: boolean;
  errors: string[];
  /** Columns safe to pass to the recorded canonical build. */
  recordedColumns: string[];
  /** Reserved columns removed from the recorded stream, handed to the overlay parser. */
  extractedEnrichmentColumns: string[];
}

/**
 * Called by BOTH ingestion routes before any recorded record is built.
 *
 * `csv-source-adapter` drops unmapped columns and `canonical-tenant-data-build` admits them, so
 * one file produces two different canonical results depending on route. A single shared check
 * removes that divergence: reserved columns leave the recorded stream on every path, identically.
 */
export function screenRecordedStream(input: {
  columns: string[];
  /** True when the caller is the plain recorded loader, where reserved columns are a hard error.
   * False when the caller is the intake splitter, which is entitled to extract them. */
  strict: boolean;
  templateFile?: string;
}): RecordedStreamCheck {
  const errors: string[] = [];
  const recordedColumns: string[] = [];
  const extractedEnrichmentColumns: string[] = [];

  for (const column of input.columns) {
    if (isReservedColumn(column)) {
      extractedEnrichmentColumns.push(column);
      if (input.strict) {
        errors.push(
          `Reserved enrichment column "${column}" reached the recorded ingestion path${
            input.templateFile ? ` in ${input.templateFile}` : ""
          }. Enrichment must arrive as an approved overlay, never as a recorded column. This file was not split at intake.`,
        );
      }
      continue;
    }
    recordedColumns.push(column);
  }

  return { ok: errors.length === 0, errors, recordedColumns, extractedEnrichmentColumns };
}

/* -- overlay admission --------------------------------------------------------------------- */

export interface OverlayColumnCheck {
  column: string;
  declared: boolean;
  reason?: string;
}

/**
 * Only columns the schema declares for this template may exist in an overlay.
 *
 * Without this a model can invent `drv__new_fact` and, being correctly prefixed, it would look
 * like legitimate enrichment. An undeclared column is a schema violation, not a contribution.
 */
export function screenOverlayColumns(input: {
  columns: string[];
  schema: EnrichmentSchema;
}): { ok: boolean; errors: string[]; checks: OverlayColumnCheck[] } {
  const declared = new Map(input.schema.columns.map((c) => [c.column, c]));
  const errors: string[] = [];
  const checks: OverlayColumnCheck[] = [];

  for (const column of input.columns) {
    // Proposal metadata never becomes a canonical business attribute; it lives on the proposal.
    if (column.endsWith("__basis") || column.endsWith("__evidence")) {
      checks.push({
        column,
        declared: true,
        reason: "proposal metadata -- stored on the proposal, never as an attribute",
      });
      continue;
    }
    if (!declared.has(column)) {
      errors.push(
        `Enrichment column "${column}" is not declared for ${input.schema.templateFile} at schema ${input.schema.schemaVersion}. An undeclared column is a schema violation, not a contribution.`,
      );
      checks.push({ column, declared: false, reason: "undeclared" });
      continue;
    }
    checks.push({ column, declared: true });
  }

  return { ok: errors.length === 0, errors, checks };
}

/* -- content-level prohibitions ------------------------------------------------------------- */

/**
 * Financial content, detected in the VALUE rather than the column name.
 *
 * Name-based checking is trivially evaded: a model can place "$4.7M" inside an innocuously named
 * derived field or an evidence note. A derived cost is a fabricated cost wherever it is written.
 */
const FINANCIAL_CONTENT = [
  /[$£€¥]\s?\d/,
  /\b\d+(?:[.,]\d+)?\s?(?:k|m|bn|b|mm)\b\s*(?:usd|gbp|eur|dollars?|pounds?|euros?)?/i,
  /\b(?:usd|gbp|eur|aud|cad)\s?\d/i,
  /\b\d+(?:[.,]\d+)?\s?%/,
  /\b(?:cost|costs|spend|price|pricing|saving|savings|roi|payback|budget)\b/i,
  /\blicen[cs]e fee\b/i,
];

export function containsFinancialClaim(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const v = value.trim();
  if (!v) return false;
  return FINANCIAL_CONTENT.some((re) => re.test(v));
}

export function screenProposalContent(input: {
  cells: Array<{ rowId: string; column: string; value: unknown }>;
}): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const cell of input.cells) {
    if (basisForColumn(cell.column) === "recorded") continue;
    if (containsFinancialClaim(cell.value)) {
      errors.push(
        `Row ${cell.rowId}, column "${cell.column}" contains what reads as a financial claim (${String(cell.value).slice(0, 40)}). A derived cost is a fabricated cost, wherever it is written.`,
      );
    }
  }
  return { ok: errors.length === 0, errors };
}

/* -- deterministic values are never trusted from the file ----------------------------------- */

/**
 * Submitted `det__` values are discarded and recomputed.
 *
 * A deterministic column is reproducible by definition, so accepting the submitted value buys
 * nothing and admits tampering -- by a model that "improved" it, or by anyone editing the sheet.
 * Recomputing also detects the tampering, which is itself worth knowing about a workbook.
 */
export function reconcileDeterministic(input: {
  submitted: Record<string, unknown>;
  recomputed: Record<string, unknown>;
}): { values: Record<string, unknown>; tampered: string[] } {
  const tampered: string[] = [];
  for (const [key, recomputedValue] of Object.entries(input.recomputed)) {
    const submittedValue = input.submitted[key];
    if (submittedValue !== undefined && String(submittedValue) !== String(recomputedValue)) {
      tampered.push(key);
    }
  }
  // Recomputed always wins. The submitted value is never used, only compared.
  return { values: { ...input.recomputed }, tampered };
}
