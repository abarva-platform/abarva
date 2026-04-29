// Surface key canonicalization · Surface 2 PR-G of Programs Strict Completion v1.2
//
// The codebase has two surface-key conventions that need to coexist:
//
//   • Semantic — 'home', 'tower', 'programs-detail', 'source-detail', etc.
//     Sent by AppShell → AtlasPageStateProvider into the chat API body.
//
//   • URL-shaped — '/programs/apx-cdp-2026', '/programs/new', '/source/<id>'
//     Used by tools (`surfaces: ['/programs/:id']`) and the artifact-channel
//     gate (regex `/^\/programs\/[^/]+$/`).
//
// Without canonicalization, tool resolution silently filters out tools that
// expect URL-shaped surfaces when the body sends semantic ones. That was
// the bug that hid `advance_phase` from Nexus on /programs/<id>: the
// surface arrived as 'programs-detail' and surfaceMatches('/programs/:id',
// 'programs-detail') returns false on path-segment-count mismatch.
//
// `canonicalizeSurface(surface, surfaceContext)` reshapes the semantic
// form into the URL-shaped form when the necessary id is available in
// surfaceContext. If the input is already URL-shaped or no canonical
// form is known, returns the input unchanged.

export interface SurfaceContext {
  programId?: string;
  // Future surface ids land here — sourceEventId, evidenceId, etc.
  // Add canonicalization rules below as they're needed.
  [key: string]: unknown;
}

/**
 * Reshape semantic surface keys into URL-shaped keys when possible.
 *
 * Returns the input unchanged when:
 *   • the surface is already URL-shaped (starts with '/')
 *   • the surface is unknown to the canonicalizer
 *   • the required id is missing from context
 *
 * Add new rules to the switch as new surfaces gain detail-level keys.
 */
export function canonicalizeSurface(
  surface: string,
  surfaceContext: SurfaceContext | undefined | null,
): string {
  if (!surface) return surface;
  // Already URL-shaped — no work to do.
  if (surface.startsWith('/')) return surface;

  const ctx = surfaceContext ?? {};

  switch (surface) {
    case 'programs-detail': {
      const programId = typeof ctx.programId === 'string' ? ctx.programId : null;
      return programId ? `/programs/${programId}` : surface;
    }
    case 'intelligence': {
      // PR-INT-B · Sentinel's surface. The bare list surface has no
      // detail-level id; semantic and URL-shaped forms collapse onto
      // the same single-segment path. Tools register for '/intelligence'
      // (URL-shaped, matching the existing convention) so we canonicalize
      // here. Detail routes (e.g. '/intelligence/patterns/<id>') will
      // need their own case once added.
      return '/intelligence';
    }
    // Add cases here as detail-level surfaces gain canonical URL forms.
    // 'source-detail', 'evidence-detail', etc.
    default:
      return surface;
  }
}

/**
 * Convenience for callers that have a body with both `surface` and
 * optional top-level `programId` plus `surfaceContext`. Top-level
 * programId wins over surfaceContext.programId (consistent with
 * useAgentStream's hook contract, which passes programId at the top
 * level whereas AtlasPageStateProvider routes it through surfaceContext).
 */
export function canonicalizeFromBody(body: {
  surface?: string;
  programId?: string;
  surfaceContext?: SurfaceContext;
}): { surface: string; programId: string | undefined } {
  const surfaceContext = body.surfaceContext ?? {};
  const programId =
    body.programId ??
    (typeof surfaceContext.programId === 'string' ? surfaceContext.programId : undefined);
  const surface = canonicalizeSurface(body.surface ?? '', { ...surfaceContext, programId });
  return { surface, programId };
}
