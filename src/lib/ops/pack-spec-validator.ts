// OPS4 · Pack Spec Validator
//
// Deterministic validation model for solution pack spec entries.
// Validates that a pack spec entry conforms to the canonical schema rules
// required for inclusion in the AbarVa solution pack library.
//
// This module is the authoritative validator used by:
//   - CI hygiene gates to prevent malformed pack entries from landing
//   - Integration tests to verify pack library quality
//   - Build ops tooling to report pack coverage and gaps
//
// No DB writes, no migrations, no live retrieval, no model invocation,
// no fs reads, no Date.now, no Math.random.

// ---------------------------------------------------------------------
// Types — input schema
// ---------------------------------------------------------------------

/**
 * Severity levels for pack spec validation violations.
 */
export type PackSpecViolationSeverity = 'error' | 'warning' | 'info';

/**
 * Categories of validation checks performed.
 */
export type PackSpecCheckCategory =
  | 'identity'      // id, slug, name fields
  | 'content'       // description, primaryQuestion
  | 'structure'     // required arrays (criteria, failureModes, etc.)
  | 'quality'       // content quality thresholds (min length, non-empty)
  | 'provenance'    // createdFrom field matches expected seed
  | 'relations'     // relatedPatternSlugs, sentinelSignals
  | 'metadata';     // category, agentGuidance

/**
 * A single validation violation found in a pack spec entry.
 */
export interface PackSpecViolation {
  field: string;
  category: PackSpecCheckCategory;
  severity: PackSpecViolationSeverity;
  message: string;
}

/**
 * Result of validating a single pack entry.
 */
export interface PackSpecEntryValidationResult {
  entryId: string;
  entrySlug: string;
  isValid: boolean;
  errorCount: number;
  warningCount: number;
  violations: ReadonlyArray<PackSpecViolation>;
  deterministicSeed: true;
}

/**
 * Result of validating an entire pack (array of entries).
 */
export interface PackSpecValidationReport {
  packId: string;
  totalEntries: number;
  validEntries: number;
  invalidEntries: number;
  totalErrors: number;
  totalWarnings: number;
  results: ReadonlyArray<PackSpecEntryValidationResult>;
  overallStatus: 'pass' | 'fail' | 'warn';
  deterministicSeed: true;
}

// ---------------------------------------------------------------------
// Minimum quality thresholds
// ---------------------------------------------------------------------

/** Minimum character length for shortDescription / description fields. */
export const MIN_DESCRIPTION_LENGTH = 40;

/** Minimum character length for primaryQuestion. */
export const MIN_PRIMARY_QUESTION_LENGTH = 20;

/** Minimum number of criteria entries in a sourcing pack. */
export const MIN_CRITERIA_COUNT = 1;

/** Minimum number of sentinelSignals entries. */
export const MIN_SENTINEL_SIGNALS_COUNT = 1;

/** Pattern for a valid slug: lowercase letters, digits, and hyphens only. */
export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

/** Pattern for a valid entry id: non-empty, no whitespace. */
export const ID_PATTERN = /^\S+$/;

// ---------------------------------------------------------------------
// Generic pack entry shape (structural duck type for the validator)
// ---------------------------------------------------------------------

/**
 * The minimal structural interface the validator operates on.
 *
 * Any pack entry type (DataPlatformSourcingPattern, ImsServicesPack, etc.)
 * that satisfies this shape can be validated. The validator does NOT import
 * concrete pack types — it operates on the canonical minimal shape so it
 * stays decoupled from individual packs.
 */
export interface PackSpecEntryShape {
  id: string;
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  primaryQuestion: string;
  criteria: ReadonlyArray<unknown>;
  failureModes?: ReadonlyArray<unknown>;
  sentinelSignals?: ReadonlyArray<string>;
  relatedPatternSlugs?: ReadonlyArray<string>;
  createdFrom: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function nonEmpty(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value != null;
}

function stringLength(value: unknown): number {
  if (typeof value === 'string') return value.trim().length;
  return 0;
}

// ---------------------------------------------------------------------
// Core validation logic
// ---------------------------------------------------------------------

/**
 * Validate a single pack spec entry.
 *
 * Pure function — same input always produces the same output.
 */
export function validatePackSpecEntry(
  entry: PackSpecEntryShape,
): PackSpecEntryValidationResult {
  const violations: PackSpecViolation[] = [];

  // ---- Identity checks -------------------------------------------------

  // id must be present and match ID_PATTERN
  if (!nonEmpty(entry.id)) {
    violations.push({
      field: 'id',
      category: 'identity',
      severity: 'error',
      message: 'entry.id is required and must be non-empty',
    });
  } else if (!ID_PATTERN.test(entry.id)) {
    violations.push({
      field: 'id',
      category: 'identity',
      severity: 'error',
      message: `entry.id "${entry.id}" contains whitespace or is invalid`,
    });
  }

  // slug must be present and match SLUG_PATTERN
  if (!nonEmpty(entry.slug)) {
    violations.push({
      field: 'slug',
      category: 'identity',
      severity: 'error',
      message: 'entry.slug is required and must be non-empty',
    });
  } else if (entry.slug.length < 3 || !SLUG_PATTERN.test(entry.slug)) {
    violations.push({
      field: 'slug',
      category: 'identity',
      severity: 'error',
      message: `entry.slug "${entry.slug}" must be lowercase letters, digits, and hyphens (min 3 chars)`,
    });
  }

  // name must be present and non-empty
  if (!nonEmpty(entry.name)) {
    violations.push({
      field: 'name',
      category: 'identity',
      severity: 'error',
      message: 'entry.name is required and must be non-empty',
    });
  }

  // ---- Content checks --------------------------------------------------

  // shortDescription must meet minimum length
  const descLen = stringLength(entry.shortDescription);
  if (descLen === 0) {
    violations.push({
      field: 'shortDescription',
      category: 'content',
      severity: 'error',
      message: 'entry.shortDescription is required',
    });
  } else if (descLen < MIN_DESCRIPTION_LENGTH) {
    violations.push({
      field: 'shortDescription',
      category: 'quality',
      severity: 'warning',
      message: `entry.shortDescription is only ${descLen} chars — minimum recommended is ${MIN_DESCRIPTION_LENGTH}`,
    });
  }

  // primaryQuestion must meet minimum length
  const qLen = stringLength(entry.primaryQuestion);
  if (qLen === 0) {
    violations.push({
      field: 'primaryQuestion',
      category: 'content',
      severity: 'error',
      message: 'entry.primaryQuestion is required',
    });
  } else if (qLen < MIN_PRIMARY_QUESTION_LENGTH) {
    violations.push({
      field: 'primaryQuestion',
      category: 'quality',
      severity: 'warning',
      message: `entry.primaryQuestion is only ${qLen} chars — minimum recommended is ${MIN_PRIMARY_QUESTION_LENGTH}`,
    });
  }

  // ---- Metadata checks -------------------------------------------------

  // category must be present and non-empty
  if (!nonEmpty(entry.category)) {
    violations.push({
      field: 'category',
      category: 'metadata',
      severity: 'error',
      message: 'entry.category is required',
    });
  }

  // ---- Structure checks ------------------------------------------------

  // criteria must be a non-empty array
  if (!Array.isArray(entry.criteria)) {
    violations.push({
      field: 'criteria',
      category: 'structure',
      severity: 'error',
      message: 'entry.criteria must be an array',
    });
  } else if (entry.criteria.length < MIN_CRITERIA_COUNT) {
    violations.push({
      field: 'criteria',
      category: 'structure',
      severity: 'error',
      message: `entry.criteria must have at least ${MIN_CRITERIA_COUNT} item(s); found ${entry.criteria.length}`,
    });
  }

  // failureModes, if present, must be an array
  if (entry.failureModes !== undefined && !Array.isArray(entry.failureModes)) {
    violations.push({
      field: 'failureModes',
      category: 'structure',
      severity: 'error',
      message: 'entry.failureModes must be an array when present',
    });
  }

  // sentinelSignals, if present, should have at least one entry
  if (entry.sentinelSignals !== undefined) {
    if (!Array.isArray(entry.sentinelSignals)) {
      violations.push({
        field: 'sentinelSignals',
        category: 'structure',
        severity: 'error',
        message: 'entry.sentinelSignals must be an array when present',
      });
    } else if (entry.sentinelSignals.length < MIN_SENTINEL_SIGNALS_COUNT) {
      violations.push({
        field: 'sentinelSignals',
        category: 'relations',
        severity: 'warning',
        message: `entry.sentinelSignals is empty — at least ${MIN_SENTINEL_SIGNALS_COUNT} signal recommended`,
      });
    }
  }

  // relatedPatternSlugs, if present, must be an array of strings
  if (entry.relatedPatternSlugs !== undefined) {
    if (!Array.isArray(entry.relatedPatternSlugs)) {
      violations.push({
        field: 'relatedPatternSlugs',
        category: 'structure',
        severity: 'error',
        message: 'entry.relatedPatternSlugs must be an array when present',
      });
    } else {
      for (let i = 0; i < entry.relatedPatternSlugs.length; i++) {
        const relSlug = entry.relatedPatternSlugs[i];
        if (typeof relSlug !== 'string' || !SLUG_PATTERN.test(relSlug)) {
          violations.push({
            field: `relatedPatternSlugs[${i}]`,
            category: 'relations',
            severity: 'warning',
            message: `relatedPatternSlugs[${i}] "${relSlug}" is not a valid slug`,
          });
        }
      }
    }
  }

  // ---- Provenance checks -----------------------------------------------

  // createdFrom must be present and non-empty
  if (!nonEmpty(entry.createdFrom)) {
    violations.push({
      field: 'createdFrom',
      category: 'provenance',
      severity: 'error',
      message: 'entry.createdFrom is required — pack entries must identify their seed origin',
    });
  }

  // ---- Tally -----------------------------------------------------------

  const errorCount = violations.filter((v) => v.severity === 'error').length;
  const warningCount = violations.filter((v) => v.severity === 'warning').length;

  return {
    entryId: typeof entry.id === 'string' ? entry.id : '',
    entrySlug: typeof entry.slug === 'string' ? entry.slug : '',
    isValid: errorCount === 0,
    errorCount,
    warningCount,
    violations,
    deterministicSeed: true,
  };
}

/**
 * Validate an entire pack (array of entries) and return a full report.
 *
 * Pure function — same input always produces the same output.
 *
 * @param packId   - Stable identifier for this pack (e.g. "PAT1", "PAT2").
 * @param entries  - Array of pack entries to validate.
 */
export function validatePackSpec(
  packId: string,
  entries: ReadonlyArray<PackSpecEntryShape>,
): PackSpecValidationReport {
  const results = entries.map((entry) => validatePackSpecEntry(entry));

  const totalErrors = results.reduce((sum, r) => sum + r.errorCount, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warningCount, 0);
  const invalidEntries = results.filter((r) => !r.isValid).length;
  const validEntries = results.length - invalidEntries;

  let overallStatus: PackSpecValidationReport['overallStatus'];
  if (totalErrors > 0) {
    overallStatus = 'fail';
  } else if (totalWarnings > 0) {
    overallStatus = 'warn';
  } else {
    overallStatus = 'pass';
  }

  return {
    packId,
    totalEntries: entries.length,
    validEntries,
    invalidEntries,
    totalErrors,
    totalWarnings,
    results,
    overallStatus,
    deterministicSeed: true,
  };
}

// ---------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------

/**
 * Return all violations across a report, flattened with their entryId.
 * Useful for CI reporters and table displays.
 */
export interface FlatPackViolation extends PackSpecViolation {
  entryId: string;
  entrySlug: string;
}

export function flattenPackSpecViolations(
  report: PackSpecValidationReport,
): ReadonlyArray<FlatPackViolation> {
  const flat: FlatPackViolation[] = [];
  for (const result of report.results) {
    for (const v of result.violations) {
      flat.push({
        ...v,
        entryId: result.entryId,
        entrySlug: result.entrySlug,
      });
    }
  }
  return flat;
}

/**
 * Summarize a validation report as a single-line status string.
 * Useful for CI log output.
 */
export function summarizePackValidation(
  report: PackSpecValidationReport,
): string {
  const { packId, totalEntries, validEntries, invalidEntries, totalErrors, totalWarnings, overallStatus } = report;
  return (
    `[${overallStatus.toUpperCase()}] Pack ${packId}: ` +
    `${totalEntries} entries, ${validEntries} valid, ${invalidEntries} invalid, ` +
    `${totalErrors} errors, ${totalWarnings} warnings`
  );
}
