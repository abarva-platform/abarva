// EXPORT-1 · Format router.
//
// Pure module — given a `DeliverableKind` and an optional caller-supplied
// `requestedFormat`, return the format the renderer should produce.
//
// Two static maps drive the router:
//   - DEFAULT_FORMAT — the canonical format per kind, per design §2.
//   - ALLOWED_FORMATS — the set of formats a kind can legitimately render
//     into. The router rejects any requestedFormat not in this set.
//
// The router never falls through silently to a default if the caller asked
// for a specific format — a misuse must surface as an error so the API
// layer can return a 400 rather than handing the user the wrong format.

import type { DeliverableFormat, DeliverableKind } from './types';

/** Default format per deliverable kind, per design Section 2. */
const DEFAULT_FORMAT: Record<DeliverableKind, DeliverableFormat> = {
  'program-charter': 'docx',
  'discovery-report': 'docx',
  'okr-baseline': 'xlsx',
  'stakeholder-map': 'xlsx',
  'synthesis-options-table': 'xlsx',
  'architecture-sketch': 'html',
  'execution-plan': 'xlsx',
  'pilot-result-report': 'docx',
  'outcome-report': 'docx',
  'bafo-scoreboard': 'xlsx',
  'meeting-notes': 'docx',
  'decision-log': 'docx',
  'roadmap': 'html',
  'financial-baseline': 'xlsx',
  'archetype-primer': 'html',
  'workshop-facilitator-guide': 'docx',
};

/** Allowed formats per kind for caller overrides. */
const ALLOWED_FORMATS: Record<DeliverableKind, ReadonlyArray<DeliverableFormat>> = {
  'program-charter': ['docx', 'html'],
  'discovery-report': ['docx'],
  'okr-baseline': ['xlsx'],
  'stakeholder-map': ['xlsx', 'html'],
  'synthesis-options-table': ['xlsx', 'html'],
  'architecture-sketch': ['html'],
  'execution-plan': ['xlsx'],
  'pilot-result-report': ['docx'],
  'outcome-report': ['docx', 'html'],
  'bafo-scoreboard': ['xlsx'],
  'meeting-notes': ['docx'],
  'decision-log': ['docx', 'xlsx'],
  'roadmap': ['html', 'xlsx'],
  'financial-baseline': ['xlsx'],
  'archetype-primer': ['html'],
  'workshop-facilitator-guide': ['docx'],
};

/**
 * Resolve the format to render. If `requestedFormat` is provided it must be
 * in the kind's allowed set; otherwise the kind's default is returned.
 *
 * Throws when the requested format is not allowed for the kind. The error
 * message names the kind, the requested format, and the allowed formats so
 * an API handler can surface a 400 with enough context to guide the caller.
 */
export function routeFormat(
  kind: DeliverableKind,
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

/** True when `format` is a legitimate rendering target for `kind`. */
export function isFormatAllowed(
  kind: DeliverableKind,
  format: DeliverableFormat,
): boolean {
  return ALLOWED_FORMATS[kind].includes(format);
}

/** Default format for `kind` (no override). */
export function getDefaultFormat(kind: DeliverableKind): DeliverableFormat {
  return DEFAULT_FORMAT[kind];
}

/** Allowed formats for `kind`. */
export function listAllowedFormats(
  kind: DeliverableKind,
): ReadonlyArray<DeliverableFormat> {
  return ALLOWED_FORMATS[kind];
}
