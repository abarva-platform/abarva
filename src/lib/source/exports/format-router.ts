// Source · Format router (Path C migration foundations).
//
// Pure module — given a `SourceDeliverableKind` and an optional caller-
// supplied `requestedFormat`, return the format the renderer should
// produce. Mirrors src/lib/programs/exports/format-router.ts.
//
// Two static maps drive the router:
//   - DEFAULT_FORMAT — the canonical format per kind (matches what
//     Source has been shipping by default per Slices 2-7)
//   - ALLOWED_FORMATS — the set of formats a kind can legitimately
//     render into (matches the per-artifact coverage matrix that was
//     built across Slices 2-7)
//
// The router never falls through silently to a default if the caller
// asked for a specific format — a misuse must surface as an error so
// the API layer can return a 400 rather than handing the user the
// wrong format.

import type { DeliverableFormat, SourceDeliverableKind } from "./types";

/** Default format per Source deliverable kind, matches what we ship today. */
const DEFAULT_FORMAT: Record<SourceDeliverableKind, DeliverableFormat> = {
  // Narrative artifacts default to docx (offline-edit + share).
  "strategy-memo": "docx",
  "scope-memo": "docx",
  "rfp-package": "docx",
  "vendor-response-pack": "docx",
  "decision-brief": "docx",
  "selection-memo": "docx",
  // Structured-data artifacts default to xlsx (the in-place editing
  // surface buyers actually use).
  "app-inventory": "xlsx",
  "response-checklist": "xlsx",
  scorecard: "xlsx",
  "pricing-template": "xlsx",
  "pricing-comparison": "xlsx",
  "trap-log": "xlsx",
  "bafo-question-pack": "xlsx",
  // Lifecycle-coverage wave. Narrative kinds default to docx; the
  // structured ones (market-scan, TCO iceberg, ai-clause-gap, renewal-
  // decision) default to xlsx because their canonical working surface
  // is a workbook.
  "demand-challenge": "docx",
  "sourcing-approach": "docx",
  "market-scan": "xlsx",
  "tco-iceberg": "xlsx",
  "ai-clause-gap": "xlsx",
  "vendor-risk-pack": "docx",
  "renewal-decision": "xlsx",
};

/**
 * Allowed formats per kind for caller overrides. Reflects the actual
 * coverage matrix:
 *   - Narrative artifacts have docx + html + pdf.
 *   - Structured-data artifacts have xlsx (the canonical data working
 *     surface) plus docx + pdf (readable renderings of the same
 *     content — a CFO won't open a spreadsheet in a board pack).
 *
 * Slice G7 closes the parity gap: d19 (pricing template + comparison),
 * d20 (trap log) and d22 (BAFO) — previously xlsx-only — now ship docx
 * and pdf alongside their xlsx. Every Source artifact now downloads in
 * every format appropriate to its content type.
 */
const ALLOWED_FORMATS: Record<
  SourceDeliverableKind,
  ReadonlyArray<DeliverableFormat>
> = {
  "strategy-memo": ["docx", "html", "pdf"],
  "scope-memo": ["docx", "html", "pdf"],
  "rfp-package": ["docx", "html", "pdf"],
  "vendor-response-pack": ["docx", "html", "pdf"],
  "decision-brief": ["docx", "html", "pdf"],
  "selection-memo": ["docx", "html", "pdf"],
  "app-inventory": ["xlsx", "docx", "pdf"],
  "response-checklist": ["xlsx", "docx", "pdf"],
  scorecard: ["xlsx", "docx", "pdf"],
  "pricing-template": ["xlsx", "docx", "pdf", "html"],
  "pricing-comparison": ["xlsx", "docx", "pdf"],
  "trap-log": ["xlsx", "docx", "pdf"],
  "bafo-question-pack": ["xlsx", "docx", "pdf"],
  // Lifecycle-coverage wave. Matches the per-stage content:
  // Demand Challenge, Sourcing Approach, Vendor Risk Pack = narrative
  //   (docx + pdf — no xlsx working grid)
  // Market Scan, TCO Iceberg, AI Clause Gap, Renewal Decision =
  //   structured (xlsx canonical) + docx + pdf
  // The AI Clause Gap also has html because it ships as a sharable
  // checklist link the panel can review without a download.
  "demand-challenge": ["docx", "pdf"],
  "sourcing-approach": ["docx", "pdf"],
  "market-scan": ["xlsx", "docx", "pdf"],
  "tco-iceberg": ["xlsx", "docx", "pdf"],
  "ai-clause-gap": ["xlsx", "docx", "pdf", "html"],
  "vendor-risk-pack": ["docx", "pdf"],
  "renewal-decision": ["xlsx", "docx", "pdf"],
};

/**
 * Resolve the format to render. If `requestedFormat` is provided it
 * must be in the kind's allowed set; otherwise the kind's default is
 * returned.
 *
 * Throws when the requested format is not allowed for the kind. The
 * error message names the kind, the requested format, and the allowed
 * formats so an API handler can surface a 400 with enough context for
 * the caller.
 */
export function routeFormat(
  kind: SourceDeliverableKind,
  requestedFormat?: DeliverableFormat,
): DeliverableFormat {
  if (requestedFormat === undefined) {
    return DEFAULT_FORMAT[kind];
  }
  const allowed = ALLOWED_FORMATS[kind];
  if (!allowed.includes(requestedFormat)) {
    throw new Error(
      `Format "${requestedFormat}" is not allowed for kind "${kind}". ` +
        `Allowed formats: ${allowed.join(", ")}.`,
    );
  }
  return requestedFormat;
}

/** Read-only accessor — used by docs / tests / coverage reports. */
export function getDefaultFormat(
  kind: SourceDeliverableKind,
): DeliverableFormat {
  return DEFAULT_FORMAT[kind];
}

/** Read-only accessor — used by docs / tests / coverage reports. */
export function getAllowedFormats(
  kind: SourceDeliverableKind,
): ReadonlyArray<DeliverableFormat> {
  return ALLOWED_FORMATS[kind];
}

/** All Source kinds — used by tests + admin reports + future expansion. */
export function listAllKinds(): ReadonlyArray<SourceDeliverableKind> {
  return Object.keys(DEFAULT_FORMAT) as SourceDeliverableKind[];
}
