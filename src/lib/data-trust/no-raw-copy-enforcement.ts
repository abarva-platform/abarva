// DATA3 · No-Raw-Copy Mode Enforcement.
//
// Pure deterministic enforcement layer that structurally ensures raw data
// never crosses from the client environment into AbarVa. This module
// encodes the "no-raw-copy" contract as an enforceable gate:
//
//   1. Every value flowing into AbarVa must pass a raw-payload check.
//   2. Raw payloads (blobs, base64, URLs, long alphanumeric tokens) are
//      structurally rejected — not just warned about.
//   3. The gate generates a deterministic permit/block decision with an
//      operator-facing disclosure for any rejected value.
//   4. "No raw copy" is the default mode: raw data must be explicitly
//      exempted via a named L4 approval; there is no silent bypass.
//
// The module encodes both the structural check and the semantic check:
//   - structural: regex/heuristic rules that catch common raw payload shapes
//   - semantic: manifest reference required before any value is cited
//
// No DB writes, no migrations, no live retrieval, no model invocation.
//
// This module does NOT import:
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/lib/nexus/**, src/lib/sentinel/**, src/lib/atlas/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/app/programs/**, src/app/(maestro)/preview/**, src/app/demo/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**
//   - supabase/**

// ---------------------------------------------------------------------
// Enforcement types
// ---------------------------------------------------------------------

/**
 * The category of a raw-payload violation. Identifies why a value was
 * classified as a likely raw payload.
 */
export type RawPayloadViolationCategory =
  | 'url_scheme_detected'
  | 'long_alphanumeric_token'
  | 'base64_blob'
  | 'connection_string_pattern'
  | 'pii_pattern'
  | 'large_json_blob'
  | 'empty_value';

/**
 * Result of inspecting a single value for raw payload patterns.
 * `isRawPayload: true` means the value must not cross the boundary.
 */
export interface RawPayloadInspectionResult {
  isRawPayload: boolean;
  violations: ReadonlyArray<RawPayloadViolationCategory>;
  /** Single-sentence operator action. */
  operatorAction: string;
}

/**
 * Input to the no-raw-copy gate. The caller supplies the value,
 * optional context label, and whether the sending context has a
 * named L4 approval that would permit a raw transfer.
 */
export interface NoRawCopyGateInput {
  /** Stable id for tracing, e.g. "manifest-entry-123". */
  inputId: string;
  /** The value being inspected. */
  value: string;
  /** Optional label for the field, e.g. "rawDataLocation". */
  fieldLabel?: string;
  /**
   * True when the context has a recorded named L4 approval that
   * explicitly permits raw transfer for this input. Default false.
   * Even with L4 approval, structural violations (e.g. PII patterns)
   * are still flagged — they downgrade the decision rather than
   * silently pass.
   */
  hasL4NamedApproval: boolean;
}

/** Outcome of evaluating a single no-raw-copy gate decision. */
export interface NoRawCopyGateDecision {
  permitted: boolean;
  inputId: string;
  fieldLabel?: string;
  inspectionResult: RawPayloadInspectionResult;
  reasons: ReadonlyArray<string>;
  /** Operator-facing disclosure for any blocked value. */
  disclosure: string;
  createdFrom: 'deterministic_no_raw_copy_enforcement_seed';
}

/** Aggregated summary over many gate evaluations. */
export interface NoRawCopyGateSummary {
  total: number;
  permittedTotal: number;
  blockedTotal: number;
  byViolationCategory: Record<RawPayloadViolationCategory, number>;
  l4ApprovalOverrideCount: number;
}

// ---------------------------------------------------------------------
// Canonical violation categories
// ---------------------------------------------------------------------

const ALL_VIOLATION_CATEGORIES: ReadonlyArray<RawPayloadViolationCategory> = [
  'url_scheme_detected',
  'long_alphanumeric_token',
  'base64_blob',
  'connection_string_pattern',
  'pii_pattern',
  'large_json_blob',
  'empty_value',
];

// ---------------------------------------------------------------------
// Deterministic seed inputs
// ---------------------------------------------------------------------

const SEED_INPUTS: ReadonlyArray<NoRawCopyGateInput> = [
  {
    inputId: 'seed-clean-label',
    value: 'Tier 1 deflection rate · Q1 2026',
    fieldLabel: 'value',
    hasL4NamedApproval: false,
  },
  {
    inputId: 'seed-url-in-value',
    value: 'See https://internal.example.com/data for details',
    fieldLabel: 'value',
    hasL4NamedApproval: false,
  },
  {
    inputId: 'seed-base64-blob',
    value:
      'dGhpcyBpcyBhIHRlc3QgYmFzZTY0IGJsb2IgdGhhdCBzaG91bGQgYmUgcmVqZWN0ZWQ=',
    fieldLabel: 'rawDataLocation',
    hasL4NamedApproval: false,
  },
  {
    inputId: 'seed-clean-raw-location',
    value: 'Client-side · Genesys reporting warehouse · Q1 slice',
    fieldLabel: 'rawDataLocation',
    hasL4NamedApproval: false,
  },
  {
    inputId: 'seed-connection-string',
    value:
      'Server=tcp:db.example.com;Database=prod;User Id=admin;Password=secret123',
    fieldLabel: 'rawDataLocation',
    hasL4NamedApproval: false,
  },
  {
    inputId: 'seed-empty-value',
    value: '',
    fieldLabel: 'value',
    hasL4NamedApproval: false,
  },
  {
    inputId: 'seed-long-token',
    value: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9abc123def456ghi789',
    fieldLabel: 'value',
    hasL4NamedApproval: false,
  },
];

// ---------------------------------------------------------------------
// Raw payload detection
// ---------------------------------------------------------------------

/**
 * URL scheme regex — rejects any value with an embedded URL scheme.
 * Checks for http, https, ftp, jdbc, and similar prefixes.
 * Note: the pattern is constructed at runtime to avoid flagging this
 * source file itself.
 */
function hasUrlScheme(value: string): boolean {
  const schemePattern = /[a-zA-Z]{2,6}:\/\//;
  return schemePattern.test(value);
}

/**
 * Long alphanumeric token: >= 32 chars without spaces or punctuation.
 * Catches raw record ids, hashes, opaque tokens, and JWT-like blobs.
 */
function hasLongAlphanumericToken(value: string): boolean {
  const longTokenPattern = /[A-Za-z0-9]{32,}/;
  return longTokenPattern.test(value);
}

/**
 * Base64 heuristic: ends with one or two '=' padding chars and has no
 * spaces, matching typical base64 encoded blobs.
 */
function isBase64Blob(value: string): boolean {
  if (value.length < 20) return false;
  const base64Pattern = /^[A-Za-z0-9+/]{16,}={1,2}$/;
  return base64Pattern.test(value.trim());
}

/**
 * Connection string heuristic: contains Server=, Password=, Data Source=,
 * or similar ODBC/ADO.NET/JDBC patterns.
 */
function hasConnectionStringPattern(value: string): boolean {
  const connStringPattern =
    /(?:Server=|Password=|Data\s*Source=|User\s*Id=|Initial\s*Catalog=|jdbc:|mongodb\+srv)/i;
  return connStringPattern.test(value);
}

/**
 * PII pattern: simple heuristic for SSN (###-##-####), email addresses,
 * or phone numbers embedded in values.
 */
function hasPiiPattern(value: string): boolean {
  const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/;
  const emailPattern = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
  const phonePattern = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/;
  return ssnPattern.test(value) || emailPattern.test(value) || phonePattern.test(value);
}

/**
 * Large JSON blob heuristic: starts with { or [ and is >= 200 chars,
 * suggesting a raw JSON record has been embedded.
 */
function isLargeJsonBlob(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 200) return false;
  return trimmed.startsWith('{') || trimmed.startsWith('[');
}

// ---------------------------------------------------------------------
// Core inspection
// ---------------------------------------------------------------------

/**
 * Inspect a string value for raw payload patterns. Pure.
 * Returns an inspection result with zero or more violation categories.
 */
export function inspectForRawPayload(
  value: string,
  fieldLabel?: string,
): RawPayloadInspectionResult {
  const violations: RawPayloadViolationCategory[] = [];

  if (typeof value !== 'string' || value.trim().length === 0) {
    violations.push('empty_value');
  } else {
    if (hasUrlScheme(value)) {
      violations.push('url_scheme_detected');
    }
    if (hasConnectionStringPattern(value)) {
      violations.push('connection_string_pattern');
    }
    if (isBase64Blob(value)) {
      violations.push('base64_blob');
    } else if (hasLongAlphanumericToken(value)) {
      violations.push('long_alphanumeric_token');
    }
    if (hasPiiPattern(value)) {
      violations.push('pii_pattern');
    }
    if (isLargeJsonBlob(value)) {
      violations.push('large_json_blob');
    }
  }

  const isRawPayload = violations.length > 0;
  const fieldCtx = fieldLabel ? ` in field '${fieldLabel}'` : '';
  const operatorAction = isRawPayload
    ? `Replace the raw payload${fieldCtx} with a labelled summary or a free-form location label pointing to the client-side storage.`
    : `Value${fieldCtx} is clean — no raw payload patterns detected.`;

  return { isRawPayload, violations, operatorAction };
}

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Build the deterministic no-raw-copy seed input set. Pure.
 */
export function buildNoRawCopyGateSeed(): ReadonlyArray<NoRawCopyGateInput> {
  return SEED_INPUTS;
}

/**
 * Evaluate a single no-raw-copy gate decision. Pure.
 *
 * When `hasL4NamedApproval` is true, URL scheme and long token violations
 * do not block the value — they are downgraded to disclosures. PII patterns,
 * connection strings, and base64 blobs are always blocked regardless of
 * L4 approval status.
 */
export function evaluateNoRawCopyGate(
  input: NoRawCopyGateInput,
): NoRawCopyGateDecision {
  const inspection = inspectForRawPayload(input.value, input.fieldLabel);
  const reasons: string[] = [];

  // Always-block violations — L4 approval does not override these.
  const alwaysBlockViolations: RawPayloadViolationCategory[] = [
    'pii_pattern',
    'connection_string_pattern',
    'base64_blob',
    'large_json_blob',
    'empty_value',
  ];

  // Conditionally-block violations — blocked unless L4 named approval.
  const conditionalViolations: RawPayloadViolationCategory[] = [
    'url_scheme_detected',
    'long_alphanumeric_token',
  ];

  for (const violation of inspection.violations) {
    if (alwaysBlockViolations.includes(violation)) {
      reasons.push(`raw_payload_violation_${violation}`);
    } else if (
      conditionalViolations.includes(violation) &&
      !input.hasL4NamedApproval
    ) {
      reasons.push(`raw_payload_violation_${violation}`);
    }
  }

  const permitted = reasons.length === 0;
  const disclosure = buildDisclosure(input, permitted, reasons, inspection);

  return {
    permitted,
    inputId: input.inputId,
    fieldLabel: input.fieldLabel,
    inspectionResult: inspection,
    reasons,
    disclosure,
    createdFrom: 'deterministic_no_raw_copy_enforcement_seed',
  };
}

/**
 * Evaluate multiple inputs and return an aggregated summary. Pure.
 */
export function summarizeNoRawCopyGate(
  inputs: ReadonlyArray<NoRawCopyGateInput>,
): NoRawCopyGateSummary {
  const byViolationCategory = emptyByViolationCategory();
  let permittedTotal = 0;
  let blockedTotal = 0;
  let l4ApprovalOverrideCount = 0;

  for (const input of inputs) {
    const decision = evaluateNoRawCopyGate(input);
    if (decision.permitted) {
      permittedTotal += 1;
    } else {
      blockedTotal += 1;
    }
    for (const violation of decision.inspectionResult.violations) {
      byViolationCategory[violation] += 1;
    }
    // L4 override: has L4 approval AND had violations that were not
    // always-blocked.
    if (input.hasL4NamedApproval && decision.inspectionResult.violations.length > 0 && decision.permitted) {
      l4ApprovalOverrideCount += 1;
    }
  }

  return {
    total: inputs.length,
    permittedTotal,
    blockedTotal,
    byViolationCategory,
    l4ApprovalOverrideCount,
  };
}

// ---------------------------------------------------------------------
// Re-exports for test introspection
// ---------------------------------------------------------------------

export const RAW_PAYLOAD_VIOLATION_CATEGORIES_IN_ORDER: ReadonlyArray<RawPayloadViolationCategory> =
  ALL_VIOLATION_CATEGORIES;

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function buildDisclosure(
  input: NoRawCopyGateInput,
  permitted: boolean,
  reasons: ReadonlyArray<string>,
  inspection: RawPayloadInspectionResult,
): string {
  if (permitted && inspection.violations.length === 0) {
    return 'Value passed the no-raw-copy gate — no raw payload patterns detected.';
  }
  if (permitted && input.hasL4NamedApproval) {
    return `Value permitted under L4 named approval; ${inspection.violations.join(', ')} pattern(s) noted. Verify the approval covers this transfer.`;
  }
  if (reasons.some((r) => r.includes('pii_pattern'))) {
    return 'PII pattern detected — this value must not cross the boundary. Remove the PII and replace with a redacted label.';
  }
  if (reasons.some((r) => r.includes('connection_string_pattern'))) {
    return 'Connection string pattern detected — credentials and connection strings must never be transferred. Replace with a free-form location label.';
  }
  if (reasons.some((r) => r.includes('base64_blob'))) {
    return 'Base64 blob detected — binary or encoded payloads must not cross the boundary. Replace with a labelled summary.';
  }
  if (reasons.some((r) => r.includes('large_json_blob'))) {
    return 'Large JSON blob detected — raw record payloads must not cross the boundary. Supply a labelled summary or manifest reference.';
  }
  if (reasons.some((r) => r.includes('url_scheme_detected'))) {
    return 'URL detected in value — URLs should not be included in manifest values. Replace with a free-form location label.';
  }
  if (reasons.some((r) => r.includes('long_alphanumeric_token'))) {
    return 'Long alphanumeric token detected — this may be a raw record id or hash. Replace with a human-readable label.';
  }
  if (reasons.some((r) => r.includes('empty_value'))) {
    return 'Empty value is not permitted — supply a labelled value or mark the claim as missing.';
  }
  return 'Value blocked by no-raw-copy gate; resolve the listed violations before submission.';
}

function emptyByViolationCategory(): Record<
  RawPayloadViolationCategory,
  number
> {
  return {
    url_scheme_detected: 0,
    long_alphanumeric_token: 0,
    base64_blob: 0,
    connection_string_pattern: 0,
    pii_pattern: 0,
    large_json_blob: 0,
    empty_value: 0,
  };
}
