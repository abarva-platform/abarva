// Client-safe blocker normalization + labeling (PR 4D, ADR-0015).
//
// Every route in the contract system already writes full-sentence, human-
// readable `detail` prose server-side (artifact-authority.ts,
// generation-eligibility.ts) — that part was never the gap. The gap PR 4D
// closes: every client call site dropped everything except a single
// `detail`/`error` string at the fetch boundary, so a multi-blocker 409
// (e.g. "not accepted" AND "below export minimum" at once) only ever
// surfaced its first sentence, and export links had no error handling of
// any kind. This module is the one place that turns whatever shape a route
// actually returns into a single, consistent list — so every surface that
// shows a blocked action (generate, accept, export) renders the same way,
// and no component re-implements its own parsing of route-specific fields.
//
// Two route-response shapes exist today, both real, neither owned by this
// file to change:
//   - accept/render/download routes return `{ error, detail, blockers: [...] }`
//     — the full ArtifactAuthorityBlocker[] from artifact-authority.ts.
//   - the AI-generate route flattens a SINGLE blocker into the top level
//     (`{ error: code, detail, ...meta }`), no `blockers` array.
// normalizeArtifactBlockers() reads either shape and always returns an
// array, so downstream rendering never special-cases the route it came
// from.

export interface ArtifactBlockerLike {
  code: string;
  detail: string;
  meta?: Record<string, unknown>;
}

const BLOCKER_CODE_LABELS: Record<string, string> = {
  stage_not_eligible: "Stage",
  missing_required_upstream: "Upstream",
  upstream_required: "Upstream",
  not_accepted: "Acceptance",
  review_required: "Review",
  not_reviewable: "Status",
  governance_stage_below_export_minimum: "Approval",
  sibling_not_accepted: "Sign-off",
  no_content_to_accept: "Content",
  unsupported_artifact: "Unsupported",
  forbidden: "Rights",
};

/** Short, scannable badge text for a blocker code. Never throws on an
 * unrecognized code — falls back to a generic title-cased reading of it,
 * since new blocker codes may be added to the resolver without every UI
 * call site needing a matching release. */
export function blockerLabel(code: string): string {
  const known = BLOCKER_CODE_LABELS[code];
  if (known) return known;
  return code
    .split("_")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Reads either known route-response shape and always returns an array —
 * empty when the payload carries no recognizable blocker at all (e.g. a
 * bare network failure), so callers can render "something went wrong"
 * without a separate null-check path. */
export function normalizeArtifactBlockers(
  payload: unknown,
  fallbackDetail?: string,
): ArtifactBlockerLike[] {
  if (!isRecord(payload)) {
    return fallbackDetail
      ? [{ code: "unknown", detail: fallbackDetail }]
      : [];
  }
  if (Array.isArray(payload.blockers) && payload.blockers.length > 0) {
    return payload.blockers.filter(
      (b): b is ArtifactBlockerLike =>
        isRecord(b) && typeof b.code === "string" && typeof b.detail === "string",
    );
  }
  if (typeof payload.error === "string") {
    const { error, detail } = payload;
    const meta = { ...payload };
    delete meta.error;
    delete meta.detail;
    delete meta.blockers;
    return [
      {
        code: error,
        detail:
          typeof detail === "string"
            ? detail
            : (fallbackDetail ?? `${blockerLabel(error)} blocked this action.`),
        meta: Object.keys(meta).length > 0 ? meta : undefined,
      },
    ];
  }
  return fallbackDetail ? [{ code: "unknown", detail: fallbackDetail }] : [];
}
