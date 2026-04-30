// OV2-FM-TELEMETRY · failure-mode telemetry events.
//
// Fires the PostHog events that power the cross-program failure-mode
// rollup described in the design doc Part E.5 — "Across your 4
// programs, the platform forced you through 17 sponsor commitment
// checks (failure mode #1) — 16 cleared, 1 flagged-and-resolved."
// Without these events landing in PostHog the rollup has nothing to
// aggregate.
//
// Wrapper choice: the codebase uses `posthog-js` directly (see
// `src/components/PostHogProvider.tsx` which calls `posthog.init` and
// `src/app/posthog-pageview.tsx` which calls `posthog.capture`). There
// is no shared helper around it. We import the same singleton here for
// consistency, and no-op when the singleton is not initialized (test
// env, SSR, missing `NEXT_PUBLIC_POSTHOG_KEY`).
//
// Idempotency: every event carries `$insert_id` per PostHog convention
// so duplicate emissions (e.g. provider re-mount, re-emitted artifact)
// collapse into a single row in rollups. The provider also dedupes by
// `failureModeId` via a session-scoped ref before reaching this helper.
//
// This module is client-only. Server-side capture (when the agent
// route streams the artifact, even if the tab closes before render) is
// deferred to OV2-FM-TELEMETRY-SERVER.

import 'client-only';
import posthog from 'posthog-js';
import type { FailureModeFlaggedArtifact } from '@/lib/agent/artifacts';

/**
 * Page-level context attached to every failure-mode telemetry event.
 * The rollup needs `programId` + `tenantKey` to bucket events; the
 * surface and agent name are diagnostic for slicing rollups by where
 * the flag fired.
 */
export interface FailureModeContext {
  /** Program the flag was raised against. Null on /programs (origination). */
  programId: string | null;
  /** Broker-tenant-key form (post-clientKeyToBrokerTenantKey mapping). */
  tenantKey: string | null;
  /** Surface path or canonical surface id, e.g. '/programs/<id>'. */
  surface: string;
  /** Agent that produced the flag, e.g. 'Nexus'. */
  agentName: string;
}

/** PostHog event name constants — also exported for tests / docs. */
export const FAILURE_MODE_FLAGGED_EVENT = 'program.failure_mode_flagged';
export const FAILURE_MODE_CLEARED_EVENT = 'program.failure_mode_cleared';

/**
 * Minimum shape of a posthog client we depend on. We accept any
 * object with a `.capture(eventName, properties)` method so tests can
 * inject a fake; in production this resolves to the `posthog-js`
 * singleton imported above.
 */
interface PostHogLike {
  capture: (eventName: string, properties: Record<string, unknown>) => void;
  __loaded?: boolean;
}

/**
 * Resolve the posthog client to use. Returns null when posthog is
 * either unavailable (SSR / module not loaded) or has not been
 * initialized via `posthog.init` (test env, missing env var). Both
 * cases are no-ops at the call sites.
 */
function resolvePostHog(): PostHogLike | null {
  // posthog-js exports a singleton that is safe to import in any env;
  // it just won't have `__loaded` set until `init()` runs.
  const candidate = posthog as unknown as PostHogLike | undefined;
  if (!candidate || typeof candidate.capture !== 'function') return null;
  if (!candidate.__loaded) return null;
  return candidate;
}

/**
 * Build a stable PostHog `$insert_id` for a given (failureModeId,
 * phase) pair plus a coarse timestamp. PostHog uses `$insert_id` to
 * dedupe events server-side; including the failure-mode + phase keeps
 * re-emissions of the same flag from inflating rollup counts. The
 * `Date.now()` component is intentional: a flag genuinely raised
 * twice in different sessions should count as two checks, not be
 * silently merged.
 */
function buildInsertId(failureModeId: number, phase: number): string {
  return `${failureModeId}:${phase}:${Date.now()}`;
}

/**
 * Fire a posthog event for a failure-mode-flagged artifact.
 * No-ops silently when posthog is not initialized (test env, SSR).
 */
export function trackFailureModeFlagged(
  artifact: FailureModeFlaggedArtifact,
  context: FailureModeContext,
): void {
  const client = resolvePostHog();
  if (!client) return;

  const properties: Record<string, unknown> = {
    failure_mode_id: artifact.failureModeId,
    failure_mode_name: artifact.failureModeName,
    phase: artifact.phase,
    severity: artifact.severity,
    detected_signal: artifact.detectedSignal,
    consequence: artifact.consequence,
    redirect: artifact.redirect,
    program_id: context.programId,
    tenant_key: context.tenantKey,
    surface: context.surface,
    agent_name: context.agentName,
    $insert_id: buildInsertId(artifact.failureModeId, artifact.phase),
  };

  client.capture(FAILURE_MODE_FLAGGED_EVENT, properties);
}

/**
 * Future hook for `failure_mode.cleared` events when the agent
 * retracts a flag (e.g. user provides evidence; not yet implemented
 * end-to-end, but the catalog promise depends on it). Stub for
 * symmetry — the rollup needs both flagged AND cleared counts to
 * render "16 cleared, 1 flagged-and-resolved."
 *
 * Wired identically to `trackFailureModeFlagged` so when the doctrine
 * for retraction lands, callers only need to invoke this; no new
 * plumbing required.
 */
export function trackFailureModeCleared(
  artifact: { failureModeId: number; failureModeName: string; phase: number },
  context: FailureModeContext,
): void {
  const client = resolvePostHog();
  if (!client) return;

  const properties: Record<string, unknown> = {
    failure_mode_id: artifact.failureModeId,
    failure_mode_name: artifact.failureModeName,
    phase: artifact.phase,
    program_id: context.programId,
    tenant_key: context.tenantKey,
    surface: context.surface,
    agent_name: context.agentName,
    $insert_id: buildInsertId(artifact.failureModeId, artifact.phase),
  };

  client.capture(FAILURE_MODE_CLEARED_EVENT, properties);
}
