/**
 * Nexus Pricing Engine — PR6 forward-compatible seam ONLY.
 *
 * Per the PR4 execution prompt: do NOT build `snapshot-service.ts` or
 * `context-projection.ts` with real logic in PR4 — the immutable
 * snapshot/business-case workflow is PR6 scope
 * (`pricing_estimate_snapshots`, created as a skeleton by PR2's
 * `20260723234500_pricing_rate_cards_client_profiles_v1.sql`, is still
 * unpopulated by any PR up to and including this one). This file exists
 * only so a future PR has a stable import path and type shape to implement
 * against, instead of inventing one from scratch — nothing below is called
 * from anywhere in PR4.
 */
import type { EffortEngineOutput } from "./types";

/**
 * PR6 will implement: given an `EffortEngineOutput` (possibly across
 * multiple scenarios) and the approving user's identity/rationale, write an
 * append-only `pricing_estimate_snapshots` row (never an UPDATE of an
 * existing approved row — see that table's migration comment for the
 * immutability convention it must follow, matching
 * `source_artifact_acceptances`).
 */
export interface SnapshotCandidate {
  output: EffortEngineOutput;
  approvedBy: string;
  approvalRationale: string;
}

/**
 * PR6 will implement. Intentionally unimplemented in PR4 — calling this
 * throws rather than silently doing nothing, so an accidental early call
 * from a future PR fails loudly during development instead of appearing to
 * "work" while writing nothing.
 */
export function createEstimateSnapshot(_candidate: SnapshotCandidate): never {
  throw new Error("not_implemented_pr6: createEstimateSnapshot is a PR6 forward-compatible seam only — see snapshot-service.ts's file header");
}
