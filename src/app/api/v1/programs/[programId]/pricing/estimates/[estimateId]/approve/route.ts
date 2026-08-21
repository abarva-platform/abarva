// POST /api/v1/programs/:programId/pricing/estimates/:estimateId/approve
//
// Nexus Pricing Engine — PR6 (brief §9.5/§10). The one approve route PR5
// explicitly left unbuilt (see moves-workflow's PR5 header). Runs the
// estimate one final time (the SAME `runEstimate()` `/run` calls — never a
// re-implementation of the math, and it re-validates the gate for free),
// then writes ONE append-only, `status: 'approved'`
// `pricing_estimate_snapshots` row via
// `effort-engine/snapshot-service.ts#createEstimateSnapshot`.
//
// Three explicit outcomes (brief's ask): success (201), not ready — the
// SAME `estimate_not_ready` shape `/run` returns (409), and, when
// GATE_APPROVAL_STRICT_MODE is enabled, a separation-of-duties violation
// for same-preparer approval (409 `self_approval_violation`). In pilot mode
// the same gate is retained but self-approval is stamped in the immutable
// snapshot rationale.
//
// NOT wired anywhere near `board-grade-business-case/route.ts` — see
// `snapshot-service.ts`'s file header and the PR6 release record for the
// explicit "coexist, don't replace" scope decision
// (PRICING_ENGINE_CURRENT_STATE.md §14).

import { NextRequest } from "next/server";
import {
  requireTenancy,
  tenancyErrorResponse,
} from "@/app/api/v1/programs/_auth";
import {
  EstimateNotFoundError,
  EstimateNotReadyError,
  EstimateTenantMismatchError,
  listEstimateInputs,
  runEstimate,
  updateEstimateHeader,
} from "@/lib/pricing/moves-workflow";
import {
  SelfApprovalViolationError,
  UnresolvedRateGapError,
  createEstimateSnapshot,
  resolvePreparedBy,
  toScopeFingerprintInput,
} from "@/lib/pricing/effort-engine/snapshot-service";
import { getCurrentTaxonomyVersion } from "@/lib/pricing/reference-repository";
import {
  requireOwnedEstimate,
  requireOwnedMove,
  snapshotToJson,
  tenantKeyFor,
} from "../../../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ApproveEstimateBody {
  approvalRationale?: unknown;
}

function badRequest(detail: string) {
  return Response.json({ error: "bad_request", detail }, { status: 400 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string; estimateId: string }> },
) {
  try {
    const ctx = await requireTenancy();
    const { programId, estimateId } = await params;

    const move = await requireOwnedMove(ctx, programId);
    if (!move) return Response.json({ error: "not_found" }, { status: 404 });

    const owned = await requireOwnedEstimate(ctx, programId, estimateId);
    if (!owned.ok)
      return Response.json(
        { error: owned.error, detail: owned.detail },
        { status: owned.status },
      );

    const body = (await req.json().catch(() => ({}))) as ApproveEstimateBody;
    if (
      typeof body.approvalRationale !== "string" ||
      body.approvalRationale.trim().length === 0
    ) {
      return badRequest("approvalRationale is required");
    }

    const tenantKey = tenantKeyFor(ctx);

    let runResult;
    try {
      // Re-runs the engine against the CURRENT confirmed inputs — guarantees
      // the approved numbers are freshly computed, not a stale copy of
      // whatever `/run` returned earlier, and re-proves the validation gate
      // for free (throws EstimateNotReadyError below if it now fails).
      runResult = await runEstimate({ estimateId, tenantKey });
    } catch (err) {
      if (err instanceof EstimateNotReadyError) {
        return Response.json(
          {
            error: "estimate_not_ready",
            detail: err.message,
            blockingReasons: err.blockingReasons,
          },
          { status: 409 },
        );
      }
      if (
        err instanceof EstimateNotFoundError ||
        err instanceof EstimateTenantMismatchError
      ) {
        return Response.json({ error: "not_found" }, { status: 404 });
      }
      throw err;
    }

    const inputs = await listEstimateInputs(estimateId);
    const taxonomy = await getCurrentTaxonomyVersion();
    const preparedBy = resolvePreparedBy(owned.estimate, inputs);
    const approvedBy = ctx.userId ?? ctx.clientKey ?? "unknown_session";

    try {
      const snapshot = await createEstimateSnapshot({
        estimateId,
        tenantKey,
        moveId: programId,
        archetypeCode: runResult.archetypeCode,
        modelVersion: runResult.modelVersion,
        scenarioKey: runResult.scenarioKey,
        currency: owned.estimate.currency,
        totals: runResult.totals,
        range: runResult.range,
        topAssumptions: runResult.topAssumptions,
        topUncertaintyDrivers: runResult.topUncertaintyDrivers,
        rateCardVersionId: owned.estimate.selected_rate_card_id,
        // No selected_client_profile column exists on pricing_estimates yet
        // (PR5 schema) — honestly null rather than guessed.
        clientProfileVersionId: null,
        taxonomyVersion: taxonomy?.version ?? null,
        inputs: inputs.map(toScopeFingerprintInput),
        preparedBy,
        approvedBy,
        approvalRationale: body.approvalRationale.trim(),
      });

      // Close the loop on pricing_estimates.status (mutable draft row, see
      // PR5 migration header) — the enum's 'approved' value was added
      // specifically for this PR to write.
      await updateEstimateHeader(estimateId, { status: "approved" });

      return Response.json(
        { ok: true, snapshot: snapshotToJson(snapshot) },
        { status: 201 },
      );
    } catch (err) {
      if (err instanceof SelfApprovalViolationError) {
        return Response.json(
          {
            error: "self_approval_violation",
            detail: err.message,
          },
          { status: 409 },
        );
      }
      if (err instanceof UnresolvedRateGapError) {
        return Response.json(
          {
            error: "unresolved_rate_gap",
            detail: err.message,
            gapCount: err.gapCount,
          },
          { status: 409 },
        );
      }
      throw err;
    }
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error(
      "[POST /api/v1/programs/:programId/pricing/estimates/:estimateId/approve]",
      err,
    );
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
