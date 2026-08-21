/**
 * Nexus Pricing Engine — PR6 approval / immutable-snapshot workflow (brief
 * §9.5, §9.7, §10).
 *
 * This is the ONLY new integration point PR6 adds:
 * `getApprovedSnapshotForMove()`. It is deliberately NOT wired into
 * `src/app/api/v1/moves/board-grade-business-case/route.ts` or any other
 * expert-kernel-consuming code path — see
 * `docs/architecture/PRICING_ENGINE_CURRENT_STATE.md` §14 and the PR6
 * release record for the full "coexist, don't replace" scope decision. The
 * only consumer of this module in this PR is the new
 * `POST .../pricing/estimates/:estimateId/approve` route.
 *
 * ## Immutability convention chosen for this table (documented, not an
 * oversight)
 *
 * `pricing_estimate_snapshots` (the PR2 skeleton,
 * `20260723234500_pricing_rate_cards_client_profiles_v1.sql`) is STRICT
 * append-only for this PR's write path: `createEstimateSnapshot` only ever
 * INSERTs. No prior row is ever UPDATEd — not to `superseded`, and not to
 * `stale_for_current_scope`. This is a deliberate reading of that
 * migration's own header/footer comments, which are unambiguous for THIS
 * table specifically:
 *
 *   > "Append-only: no UPDATE/DELETE path, matching the
 *   > source_artifact_acceptances precedent ... never an in-place mutation
 *   > of an approved snapshot." (file header)
 *   > "no UPDATE/DELETE path is exposed by any PR2 code. A later,
 *   > real-population PR (PR6) must preserve this — a re-snapshot is always
 *   > a new INSERT, never an UPDATE of an approved row." (table footer)
 *
 * `source_artifact_acceptances` itself (the precedent this table is
 * modeled on, `20260722150000_source_artifact_acceptances.sql`) is the same
 * shape: no UPDATE/DELETE statement anywhere in that migration or any
 * calling code — "the current acceptance for an artifact is always the
 * latest row by accepted_at" (that file's header). Its own "latest wins" is
 * achieved PURELY by inserting a new row and querying by `accepted_at DESC`
 * — never by writing back into an older row. That is the one interpretation
 * actually consistent with what is already committed, so this module
 * follows it exactly:
 *
 *   - "Superseded" is a NEVER-WRITTEN status value from this write path.
 *     An older approved snapshot for a Move is superseded PURELY by the
 *     existence of a newer row with a later `created_at` — computed at read
 *     time (`getApprovedSnapshotForMove` orders by `created_at DESC` and
 *     returns only the newest row), never persisted onto the old row.
 *   - "stale_for_current_scope" is the SAME story: `checkSnapshotStaleness`
 *     is a pure, read-time comparison (current scope fingerprint vs. the
 *     snapshot's stored `upstream_scope_fingerprint`). It never issues an
 *     UPDATE. `getApprovedSnapshotForMove` calls it and returns a `stale`
 *     result WITHOUT touching the row's stored `status` column.
 *
 * A prior PR6 draft of this file considered flipping the OLD row to
 * `superseded`/`stale_for_current_scope` via UPDATE (the enum values exist
 * in the CHECK constraint, and the brief's prose can be read either way).
 * That was rejected specifically because the migration's own footer comment
 * explicitly forbids it for this table ("never an UPDATE of an approved
 * row") — this is not the same judgment call
 * `pricing_taxonomy_versions`/`pricing_rate_cards` make (those tables DO
 * flip a prior row's `is_current` flag on supersession, per
 * `versioning.ts`); `pricing_estimate_snapshots` was modeled on
 * `source_artifact_acceptances` instead, which never mutates a prior row at
 * all. The `superseded` / `stale_for_current_scope` enum values remain
 * valid CHECK-constraint members for a future PR that decides a real
 * "mark stale" background job is worth the mutation — this PR does not add
 * one.
 *
 * ## estimate_id (PR6 companion migration)
 *
 * The PR2 skeleton had no `pricing_estimates` FK (that table didn't exist
 * yet). PR5 added `pricing_estimates` with support for MULTIPLE scenario
 * variants per Move (`scenario_group_id`), which means "the approved
 * snapshot for this Move" is only well-defined if the snapshot names WHICH
 * estimate/scenario it approved. See
 * `20260724020000_pricing_estimate_snapshots_pr6_estimate_link.sql` for the
 * additive `estimate_id` column this module writes and reads.
 */
import { randomUUID } from "node:crypto";
import { azureRead } from "@/lib/data-plane/azureRead";
import {
  createTxSession,
  type TxSessionRunner,
} from "@/lib/data-plane/read-adapters/azureSession";
import {
  isGateApprovalStrictMode,
  passesSeparationOfDuties,
} from "@/lib/auth/gate-approval-strict-mode";
import { computeContentHash } from "../versioning";
import type {
  PricingEstimateInputRow,
  PricingEstimateRow,
  PricingEstimateSnapshotRow,
} from "../types";
import type { EffortEngineTotals } from "./types";

// ---------------------------------------------------------------------------
// Upstream scope fingerprint (brief §9.5)
// ---------------------------------------------------------------------------

/**
 * Deliberately re-declared here (same shape as
 * `moves-workflow/validation-gate.ts`'s `EstimateInputForGate`) rather than
 * imported from it: `effort-engine/` (PR4) must not take a compile-time
 * dependency on `moves-workflow/` (PR5) — the dependency runs the other
 * direction (moves-workflow's `execution-service.ts` already imports FROM
 * effort-engine). Structural typing means any caller building an
 * `EstimateInputForGate`-shaped object (the API route, execution-service,
 * or a test) can pass it here with no import needed either.
 */
export interface ScopeFingerprintInputRow {
  inputKey: string;
  value: unknown;
  confirmedAt: string | null;
  overrideReason: string | null;
  confidence: string | null;
}

/** An input counts toward the fingerprint only once it is SETTLED — the
 * same rule `validation-gate.ts`'s `isInputSettled` uses to decide whether
 * an input can block a run. An unsettled/proposed-but-not-confirmed
 * suggestion never drove the numbers that produced this output, so it must
 * not be part of what "the scope that produced this snapshot" means. */
function isSettled(input: ScopeFingerprintInputRow): boolean {
  if (input.confirmedAt) return true;
  if (input.overrideReason && input.confidence) return true;
  return false;
}

export interface ScopeFingerprintInputs {
  archetypeCode: string;
  modelVersion: number;
  scenarioKey: string;
  selectedRateCardId: string | null;
  inputs: readonly ScopeFingerprintInputRow[];
}

/**
 * sha256 fingerprint (via the SAME `computeContentHash`/`canonicalize`
 * helper `versioning.ts` already uses for every other pricing_* content
 * hash — not a bespoke hashing scheme) of the confirmed scope inputs that
 * produced (or would produce) a given estimate's numbers. Used both to
 * stamp a new snapshot's `upstream_scope_fingerprint` and, later, to detect
 * drift (`checkSnapshotStaleness`).
 */
export function computeUpstreamScopeFingerprint(
  scope: ScopeFingerprintInputs,
): string {
  const settled = scope.inputs
    .filter(isSettled)
    .map((i) => ({ inputKey: i.inputKey, value: i.value }))
    .sort((a, b) =>
      a.inputKey < b.inputKey ? -1 : a.inputKey > b.inputKey ? 1 : 0,
    );

  return computeContentHash({
    archetypeCode: scope.archetypeCode,
    modelVersion: scope.modelVersion,
    scenarioKey: scope.scenarioKey,
    selectedRateCardId: scope.selectedRateCardId,
    inputs: settled,
  });
}

/** Maps a persisted input row down to the gate/fingerprint shape (mirrors `execution-service.ts`'s private `toGateInput`). */
export function toScopeFingerprintInput(
  row: PricingEstimateInputRow,
): ScopeFingerprintInputRow {
  return {
    inputKey: row.input_key,
    value: row.value,
    confirmedAt: row.confirmed_at,
    overrideReason: row.override_reason,
    confidence: row.confidence,
  };
}

// ---------------------------------------------------------------------------
// Segregation of duties (brief §10)
// ---------------------------------------------------------------------------

/**
 * Thrown when the approving user is the same identity that last modified
 * (confirmed an input on, or — absent any confirmed input — created) the
 * estimate being approved. Named to match the existing repo convention:
 * `src/lib/programs/deliverable-role-approvals.ts`'s
 * `recordRoleApprovalDecision` throws the literal string
 * `"self_approval_violation"` when `deliverable.created_by === ctx.userId`.
 * This class carries the same `self_approval_violation` identifier so API
 * routes/tests can match on `err.message.startsWith("self_approval_violation")`
 * exactly like the deliverable-approvals call sites already do.
 */
export class SelfApprovalViolationError extends Error {
  constructor(
    public readonly approvedBy: string,
    public readonly preparedBy: string,
  ) {
    super(
      `self_approval_violation: '${approvedBy}' cannot approve a pricing estimate snapshot whose inputs they themselves last confirmed ('${preparedBy}') — segregation of duties requires a different approver.`,
    );
    this.name = "SelfApprovalViolationError";
  }
}

// ---------------------------------------------------------------------------
// Unresolved rate gaps (PR7 hardening — brief §12 "missing all fallbacks
// blocks the estimate")
// ---------------------------------------------------------------------------

/**
 * Thrown when an estimate has one or more line items whose role rate could
 * not be resolved (`EffortEngineTotals.gapCount > 0` — PR4's engine already
 * refuses to fabricate a zero cost for these; see `cost-engine.ts#aggregateTotals`,
 * which tracks `gapCount` and never sums a null `laborCostCents` into the
 * total). Prior to this PR7 hardening pass, `runEstimate` surfaced a
 * non-zero `gapCount` only as an entry in `topUncertaintyDrivers` — a
 * disclosure, not a gate — which meant an estimate with a genuinely unpriced
 * role could still be approved into a permanent, immutable snapshot. That
 * gap is closed HERE, at the one point of no return (`createEstimateSnapshot`):
 * approval — the moment a cost figure becomes a financial commitment,
 * matching this file's own segregation-of-duties control — must not lock in
 * a number with an honest hole in it. `/run` and the draft workflow are
 * UNCHANGED and still show gaps as an in-progress disclosure (a user must be
 * able to see a gap while still fixing rate-card coverage); only approval
 * blocks.
 */
export class UnresolvedRateGapError extends Error {
  constructor(public readonly gapCount: number) {
    super(
      `unresolved_rate_gap: ${gapCount} line item(s) have no resolvable role rate (no client rate-card line, global rate-card line, or rate-band default) — approve cannot lock in a snapshot with an unpriced cost line. Resolve the rate-card gap (or the tenant's rate-card coverage) before approving.`,
    );
    this.name = "UnresolvedRateGapError";
  }
}

/**
 * Resolves "who prepared this estimate" for the segregation-of-duties check:
 * the `confirmed_by` of whichever input was confirmed most recently, or —
 * if no input has ever been confirmed (every settled input was instead
 * marked unknown-with-override, which carries no identity column in the
 * PR5 schema) — the estimate's own `created_by`. Returns null only when
 * neither signal exists (a hand-seeded row with no identity anywhere),
 * in which case the segregation-of-duties check is a deliberate no-op —
 * see `assertSegregationOfDuties`.
 *
 * ## Pattern followed, and why
 *
 * This module follows the shared `GATE_APPROVAL_STRICT_MODE` convention.
 * Pilot mode keeps the gate and rationale but allows a runner with approval
 * authority to approve their own pricing snapshot; strict mode enforces
 * separation of duties. Pilot self-approval is recorded on the immutable
 * snapshot rationale instead of being silent.
 */
export function resolvePreparedBy(
  estimate: Pick<PricingEstimateRow, "created_by">,
  inputs: readonly PricingEstimateInputRow[],
): string | null {
  let latest: PricingEstimateInputRow | null = null;
  for (const row of inputs) {
    if (!row.confirmed_by || !row.confirmed_at) continue;
    if (
      !latest ||
      !latest.confirmed_at ||
      row.confirmed_at > latest.confirmed_at
    ) {
      latest = row;
    }
  }
  return latest?.confirmed_by ?? estimate.created_by ?? null;
}

/** Throws `SelfApprovalViolationError` when `approvedBy` is the same identity as `preparedBy`. A null `preparedBy` (no identity signal at all) is a deliberate no-op — there is nothing to compare against. */
export function assertSegregationOfDuties(
  approvedBy: string,
  preparedBy: string | null,
): void {
  const preparedByForCheck = preparedBy?.trim() ? preparedBy : null;
  if (
    !passesSeparationOfDuties({
      requestedByUserId: preparedByForCheck,
      approverUserId: approvedBy,
    })
  ) {
    throw new SelfApprovalViolationError(
      approvedBy,
      preparedByForCheck ?? "unknown",
    );
  }
}

function appendPilotSelfApprovalNote(args: {
  rationale: string;
  approvedBy: string;
  preparedBy: string | null;
}): string {
  if (isGateApprovalStrictMode()) return args.rationale;
  if (!args.preparedBy || args.preparedBy !== args.approvedBy) {
    return args.rationale;
  }
  return [
    args.rationale,
    "Pilot approval note: the approver is also the pricing estimate preparer; permitted because GATE_APPROVAL_STRICT_MODE is off.",
  ].join("\n\n");
}

// ---------------------------------------------------------------------------
// Store port
// ---------------------------------------------------------------------------

export interface SnapshotStorePort {
  insertSnapshot(row: PricingEstimateSnapshotRow): Promise<void>;
  /** Latest row for the Move by `created_at DESC` — "latest wins", see file header. Empty array reads as "no snapshot", never throws on a missing/empty table. */
  getLatestSnapshotForMove(
    moveId: string,
    tenantKey: string,
  ): Promise<PricingEstimateSnapshotRow | null>;
}

function defaultStore(
  session: TxSessionRunner = createTxSession("abarva-pricing-write"),
): SnapshotStorePort {
  return {
    async insertSnapshot(row) {
      await session(async (run) => {
        await run(
          `INSERT INTO pricing_estimate_snapshots
             (id, tenant_key, move_id, estimate_id, model_version, taxonomy_version,
              rate_card_version_id, client_profile_version_id, upstream_scope_fingerprint,
              totals, status, approved_by, approved_at, approval_rationale, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            row.id,
            row.tenant_key,
            row.move_id,
            row.estimate_id,
            row.model_version,
            row.taxonomy_version,
            row.rate_card_version_id,
            row.client_profile_version_id,
            row.upstream_scope_fingerprint,
            JSON.stringify(row.totals),
            row.status,
            row.approved_by,
            row.approved_at,
            row.approval_rationale,
            row.created_at,
          ],
        );
      });
    },
    async getLatestSnapshotForMove(moveId, tenantKey) {
      const rows = await azureRead.select<PricingEstimateSnapshotRow>({
        table: "pricing_estimate_snapshots",
        where: { move_id: moveId, tenant_key: tenantKey },
        orderBy: { column: "created_at", direction: "desc" },
        limit: 1,
        missingTable: "empty",
      });
      return rows[0] ?? null;
    },
  };
}

export { defaultStore as defaultSnapshotStore };

// ---------------------------------------------------------------------------
// createEstimateSnapshot (brief §9.5)
// ---------------------------------------------------------------------------

/** The low/expected/high range a snapshot locks in, alongside the range policy that produced it — the same shape `moves-workflow/types.ts`'s `EstimateRunRangeResult` already carries, duplicated locally rather than imported so `effort-engine/` does not take a dependency on `moves-workflow/` (moves-workflow depends on effort-engine, never the reverse). */
export interface SnapshotRangeTotals {
  policyCode: string;
  policyName: string;
  score: number;
  lowCents: number;
  expectedCents: number;
  highCents: number;
}

/** The JSONB shape written to `pricing_estimate_snapshots.totals`. Every field here is safe, non-line-item summary data — see `governed-load/business-case-projection.ts`, which reads exactly this shape back out for brief §9.7's safe business-case summary. */
export interface SnapshotTotalsPayload {
  currency: string;
  totalRawHours: number;
  totalExpectedHours: number;
  totalLaborCostCents: number;
  totalManualCostCents: number;
  totalCostCents: number;
  gapCount: number;
  range: SnapshotRangeTotals;
  topAssumptions: string[];
  topUncertaintyDrivers: string[];
}

/**
 * The subset of a completed PR4 `EffortEngineOutput` a snapshot needs.
 * Deliberately NOT the full `EffortEngineOutput` (which also carries
 * `lineItems: EffortLineItem[]`) — by the time an estimate is approved, its
 * line items are already persisted to `pricing_estimate_line_items`
 * (`execution-service.ts`'s replace-on-rerun) in a DIFFERENT row shape
 * (`PricingEstimateLineItemRow`, not `EffortLineItem`); re-threading the raw
 * engine-internal line items through the approval call would mean carrying
 * two divergent shapes for "the same" data. A snapshot only ever needs the
 * ROLLED-UP totals, never the per-line detail (that's what makes it a safe
 * summary in the first place — see `governed-load/business-case-projection.ts`).
 */
export interface SnapshotCandidate {
  estimateId: string;
  tenantKey: string;
  moveId: string;
  archetypeCode: string;
  modelVersion: number;
  /** Plain `string`, not PR4's `ScenarioKey` union — `EstimateRunResult.scenarioKey` (moves-workflow/types.ts) is already just `string` by the time it reaches this call, and the fingerprint/totals payload only ever needs string equality, not the closed-set type. */
  scenarioKey: string;
  currency: string;
  totals: EffortEngineTotals;
  range: SnapshotRangeTotals;
  topAssumptions: string[];
  topUncertaintyDrivers: string[];
  rateCardVersionId: string | null;
  clientProfileVersionId: string | null;
  taxonomyVersion: number | null;
  /** Every input row for the estimate (settled or not) — `computeUpstreamScopeFingerprint` filters to settled ones internally, so callers never have to duplicate that filter. */
  inputs: readonly ScopeFingerprintInputRow[];
  /** See `resolvePreparedBy` — the identity segregation-of-duties compares `approvedBy` against. */
  preparedBy: string | null;
  approvedBy: string;
  approvalRationale: string;
}

/**
 * Writes ONE append-only, `status: 'approved'` row to
 * `pricing_estimate_snapshots`. Never UPDATEs a prior row — see file header
 * for why. Enforces segregation of duties (throws
 * `SelfApprovalViolationError`) and requires a non-empty
 * `approvalRationale` before writing anything.
 */
export async function createEstimateSnapshot(
  candidate: SnapshotCandidate,
  store: SnapshotStorePort = defaultStore(),
): Promise<PricingEstimateSnapshotRow> {
  if (!candidate.approvalRationale.trim()) {
    throw new Error(
      "approval_rationale_required: an approved snapshot must record why it was approved",
    );
  }
  if (candidate.totals.gapCount > 0) {
    throw new UnresolvedRateGapError(candidate.totals.gapCount);
  }
  assertSegregationOfDuties(candidate.approvedBy, candidate.preparedBy);

  const fingerprint = computeUpstreamScopeFingerprint({
    archetypeCode: candidate.archetypeCode,
    modelVersion: candidate.modelVersion,
    scenarioKey: candidate.scenarioKey,
    selectedRateCardId: candidate.rateCardVersionId,
    inputs: candidate.inputs,
  });

  const now = new Date().toISOString();
  const totals: SnapshotTotalsPayload = {
    currency: candidate.currency,
    totalRawHours: candidate.totals.totalRawHours,
    totalExpectedHours: candidate.totals.totalExpectedHours,
    totalLaborCostCents: candidate.totals.totalLaborCostCents,
    totalManualCostCents: candidate.totals.totalManualCostCents,
    totalCostCents: candidate.totals.totalCostCents,
    gapCount: candidate.totals.gapCount,
    range: candidate.range,
    topAssumptions: candidate.topAssumptions,
    topUncertaintyDrivers: candidate.topUncertaintyDrivers,
  };

  const row: PricingEstimateSnapshotRow = {
    id: randomUUID(),
    tenant_key: candidate.tenantKey,
    move_id: candidate.moveId,
    estimate_id: candidate.estimateId,
    model_version: candidate.modelVersion,
    taxonomy_version: candidate.taxonomyVersion,
    rate_card_version_id: candidate.rateCardVersionId,
    client_profile_version_id: candidate.clientProfileVersionId,
    upstream_scope_fingerprint: fingerprint,
    totals: totals as unknown as Record<string, unknown>,
    status: "approved",
    approved_by: candidate.approvedBy,
    approved_at: now,
    approval_rationale: appendPilotSelfApprovalNote({
      rationale: candidate.approvalRationale,
      approvedBy: candidate.approvedBy,
      preparedBy: candidate.preparedBy,
    }),
    created_at: now,
  };

  await store.insertSnapshot(row);
  return row;
}

// ---------------------------------------------------------------------------
// Staleness detection (brief §9.5) — pure, read-time only, never mutates
// ---------------------------------------------------------------------------

export interface StalenessCheckResult {
  stale: boolean;
  currentFingerprint: string;
  snapshotFingerprint: string;
}

/**
 * Pure comparison: recomputes the fingerprint for the Move's CURRENT scope
 * and compares it against a snapshot's stored
 * `upstream_scope_fingerprint`. Never issues a write — see file header for
 * why this does not flip the snapshot row's `status` to
 * `stale_for_current_scope` in the database.
 */
export function checkSnapshotStaleness(
  currentScope: ScopeFingerprintInputs,
  snapshot: Pick<PricingEstimateSnapshotRow, "upstream_scope_fingerprint">,
): StalenessCheckResult {
  const currentFingerprint = computeUpstreamScopeFingerprint(currentScope);
  return {
    stale: currentFingerprint !== snapshot.upstream_scope_fingerprint,
    currentFingerprint,
    snapshotFingerprint: snapshot.upstream_scope_fingerprint,
  };
}

// ---------------------------------------------------------------------------
// getApprovedSnapshotForMove (brief §9.5) — the ONE new integration point
// ---------------------------------------------------------------------------

export type ApprovedSnapshotResult =
  | { status: "none" }
  | { status: "approved"; snapshot: PricingEstimateSnapshotRow }
  | {
      status: "stale";
      snapshot: PricingEstimateSnapshotRow;
      currentFingerprint: string;
    };

export interface EstimateScopeLookupPort {
  getEstimateById(estimateId: string): Promise<PricingEstimateRow | null>;
  listEstimateInputs(estimateId: string): Promise<PricingEstimateInputRow[]>;
}

function defaultEstimateScopeLookup(): EstimateScopeLookupPort {
  return {
    async getEstimateById(estimateId) {
      return azureRead.maybeSingle<PricingEstimateRow>({
        table: "pricing_estimates",
        where: { id: estimateId },
        missingTable: "empty",
      });
    },
    async listEstimateInputs(estimateId) {
      return azureRead.select<PricingEstimateInputRow>({
        table: "pricing_estimate_inputs",
        where: { estimate_id: estimateId },
        missingTable: "empty",
      });
    },
  };
}

/**
 * Returns the current approved, non-stale snapshot for a Move — or an
 * explicit `none` / `stale` result. This is the ONLY new integration point
 * PR6 adds (brief §9.5); it is NOT called from
 * `board-grade-business-case/route.ts` or any other expert-kernel-consuming
 * path — see this file's header and the PR6 release record for the scope
 * decision.
 *
 * "Current, non-superseded" is achieved purely by reading the newest row
 * (`created_at DESC`) — an older approved row is superseded by definition
 * of not being the newest, never by a written `status` flip (file header).
 * "Non-stale" is verified live against the Move's CURRENT estimate scope
 * (via `estimate_id`), not trusted from the snapshot's own stored `status`
 * column, since this write path never updates that column after insert.
 */
export async function getApprovedSnapshotForMove(
  moveId: string,
  tenantKey: string,
  store: SnapshotStorePort = defaultStore(),
  scopeLookup: EstimateScopeLookupPort = defaultEstimateScopeLookup(),
): Promise<ApprovedSnapshotResult> {
  const snapshot = await store.getLatestSnapshotForMove(moveId, tenantKey);
  if (!snapshot) return { status: "none" };

  if (!snapshot.estimate_id) {
    // Defensive: a snapshot with no known estimate (e.g. a hand-seeded or
    // pre-estimate_id-migration row) cannot be staleness-checked against a
    // live scope. Trust its stored status rather than guessing.
    return { status: "approved", snapshot };
  }

  const estimate = await scopeLookup.getEstimateById(snapshot.estimate_id);
  if (!estimate || estimate.tenant_key !== tenantKey) {
    // The estimate this snapshot named no longer resolves for this tenant —
    // cannot verify currency against a live scope either. Same defensive
    // fallback as above, not a fabricated "stale" claim we can't back up.
    return { status: "approved", snapshot };
  }

  const inputRows = await scopeLookup.listEstimateInputs(estimate.id);
  const staleness = checkSnapshotStaleness(
    {
      archetypeCode: estimate.archetype_code,
      modelVersion: estimate.model_version,
      scenarioKey: estimate.scenario_key,
      selectedRateCardId: estimate.selected_rate_card_id,
      inputs: inputRows.map(toScopeFingerprintInput),
    },
    snapshot,
  );

  if (staleness.stale) {
    return {
      status: "stale",
      snapshot,
      currentFingerprint: staleness.currentFingerprint,
    };
  }
  return { status: "approved", snapshot };
}
