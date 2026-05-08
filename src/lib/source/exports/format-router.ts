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

import type { DeliverableFormat, SourceDeliverableKind } from './types';

/** Default format per Source deliverable kind, matches what we ship today. */
const DEFAULT_FORMAT: Record<SourceDeliverableKind, DeliverableFormat> = {
  // Narrative artifacts default to docx (offline-edit + share).
  'scope-memo': 'docx',
  'rfp-package': 'docx',
  'decision-brief': 'docx',
  'selection-memo': 'docx',
  // Structured-data artifacts default to xlsx (the in-place editing
  // surface buyers actually use).
  'app-inventory': 'xlsx',
  'response-checklist': 'xlsx',
  'scorecard': 'xlsx',
  'pricing-template': 'xlsx',
  'pricing-comparison': 'xlsx',
  'trap-log': 'xlsx',
  'bafo-question-pack': 'xlsx',
};

/**
 * Allowed formats per kind for caller overrides. Reflects the actual
 * coverage matrix shipped through Slices 2-7:
 *   - Narrative artifacts have all 4 formats
 *   - Structured-data artifacts have xlsx + docx (where d04/d11/d16
 *     shipped docx in Slice 5; d20/d22 are xlsx-only as of Slice 6)
 *   - d19 pricing has xlsx (template + comparison) only
 */
const ALLOWED_FORMATS: Record<
  SourceDeliverableKind,
  ReadonlyArray<DeliverableFormat>
> = {
  'scope-memo': ['docx', 'html', 'pdf'],
  'rfp-package': ['docx', 'html', 'pdf'],
  'decision-brief': ['docx', 'html', 'pdf'],
  'selection-memo': ['docx', 'html', 'pdf'],
  'app-inventory': ['xlsx', 'docx'],
  'response-checklist': ['xlsx', 'docx'],
  'scorecard': ['xlsx', 'docx'],
  'pricing-template': ['xlsx'],
  'pricing-comparison': ['xlsx'],
  'trap-log': ['xlsx'],
  'bafo-question-pack': ['xlsx'],
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
        `Allowed formats: ${allowed.join(', ')}.`,
    );
  }
  return requestedFormat;
}

/** Read-only accessor — used by docs / tests / coverage reports. */
export function getDefaultFormat(kind: SourceDeliverableKind): DeliverableFormat {
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
