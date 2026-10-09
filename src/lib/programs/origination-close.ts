import "server-only";

// ── One approval closes P0 ────────────────────────────────────────────────────
// The origination flow's contract, per founder spec (2026-06-11): P0 is one
// screen — the user completes origination, promotes, and the Move goes to
// "awaiting authorized user approval". The authenticated user records the
// origination-brief sign-off and the Move advances to P1 Charter through the
// governed gate. The listed sponsor is a stakeholder contact, not the actor.
//
// Mechanics (all governed, no gate bypass):
//   1. ensureOriginationBrief — create the signable `origination_brief`
//      deliverable from the Move's REAL charter data (generalized: works for
//      any use case/archetype; no hardcoded prose).
//   2. Sign it off, recording the authenticated authorized user as signer.
//   3. evaluateGate(0→1): hard checks must genuinely pass (they do once the
//      brief is signed — program_seed_recorded + value_hypothesis_seed read
//      the signed brief). Soft gaps carry forward on the gate decision record.
//   4. advancePhase + Phase Gate Decision Record into the Artifact Vault.
// Best-effort: a failure here logs loudly and leaves the Move at P0 with the
// approval intact — it must never break the approval write itself.

import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { draftModuleDeliverable } from "@/lib/programs/nexus";
import {
  publishDeliverable,
  signOffDeliverable,
  advancePhase,
} from "@/lib/programs/mutations";
import { evaluateGate } from "@/lib/programs/governance";
import { saveGateDecisionArtifact } from "@/lib/programs/deliverables/gate-override-artifact";
import { sendMoveProgressUpdate } from "@/lib/programs/move-progress-notifications";
import type { TenancyCtx } from "@/lib/programs/types.db";
import type { OriginationCloseOutcome } from "@/lib/programs/origination-close-outcome";

interface EngagementSeedRow {
  id: string;
  client_id: string;
  name: string | null;
  current_phase: number | null;
  problem_statement: string | null;
  charter: Record<string, unknown> | null;
}

function charterStr(
  charter: Record<string, unknown> | null,
  ...keys: string[]
): string | null {
  for (const k of keys) {
    const v = charter?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/**
 * Whether the Move's signable origination brief could be ensured, and how.
 *
 * A discriminated union rather than `string | null`, because the two ways of
 * having no id are not interchangeable and the caller has to act differently:
 * `"unreadable"` means the Move's EXISTING documents could not be read, so
 * nothing may be created on top of them, while `"not_created"` means the read
 * succeeded, found none, and the create itself failed. Collapsing both to
 * `null` would put the refusal and the failure on one code again.
 */
export type EnsureOriginationBriefOutcome =
  | { outcome: "existing"; deliverableId: string }
  | { outcome: "created"; deliverableId: string }
  | { outcome: "unreadable" }
  | { outcome: "not_created" };

/**
 * Create (if absent) the signable origination_brief deliverable from the
 * Move's real origination data. Generalized — content comes from the charter
 * fields captured at origination, never from use-case-specific boilerplate.
 *
 * The first read is a DEDUPE read, and the two writes below it
 * (`draftModuleDeliverable` + `publishDeliverable`) are reached only when it
 * finds nothing. The compat client reports a failed read as
 * `{ data: null, error }` rather than throwing, so dropping that `error` made
 * a read outage indistinguishable from "this Move has no brief yet" — and the
 * consequence was not a mis-worded refusal but a WRITE: a second
 * origination_brief row, which `closeP0OnApproval` then signed, leaving the
 * Move with two briefs, the signature on the newer one, the older one's own
 * sign-off still standing, and no control on any surface that removes either.
 * A read it could not perform is now refused instead of assumed.
 */
export async function ensureOriginationBrief(
  ctx: TenancyCtx,
  programId: string,
  row: EngagementSeedRow,
): Promise<EnsureOriginationBriefOutcome> {
  const sb = getAzureWriteFluentClient();
  const { data: existing, error: existingError } = await sb
    .from("deliverables_v2")
    .select("id, status, deliverable_type_key")
    .eq("engagement_id", programId)
    .in("deliverable_type_key", [
      "origination_brief",
      "program_seed_brief",
      "program_seed",
    ])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingError) {
    console.error("[origination-close] existing origination brief unreadable", {
      programId,
      err: existingError.message ?? String(existingError),
    });
    return { outcome: "unreadable" };
  }
  if (existing?.id) {
    return { outcome: "existing", deliverableId: existing.id as string };
  }

  const charter = row.charter ?? {};
  const problem =
    row.problem_statement ??
    charterStr(charter, "problem_statement", "problemStatement") ??
    "Problem statement captured at origination (see Move seed).";
  const outcome =
    charterStr(
      charter,
      "target_outcome",
      "targetOutcome",
      "value_hypothesis",
      "valueHypothesis",
    ) ?? "Target outcome captured at origination (see Move seed).";
  const scope =
    charterStr(charter, "scope_boundary", "scopeBoundary", "initial_scope") ??
    "Scope boundary captured at origination (see Move seed).";
  const sponsor =
    charterStr(charter, "sponsor_candidate", "sponsorCandidate", "sponsor") ??
    "Sponsor candidate recorded at origination.";
  const archetype =
    charterStr(charter, "classification", "archetype", "pattern") ??
    "unclassified";

  const draftContent = [
    `# P0 Origination Brief — ${row.name ?? programId}`,
    `Archetype classification: ${archetype}`,
    "",
    "## Problem / trigger",
    problem,
    "",
    "## Value hypothesis / target outcome",
    outcome,
    "",
    "## Sponsor",
    sponsor,
    "",
    "## Scope boundary",
    scope,
  ].join("\n");

  const { deliverableId } = await draftModuleDeliverable(ctx, {
    programId,
    moduleKey: "p0",
    deliverableTypeKey: "origination_brief",
    title: "P0 Origination Brief",
    draftContent,
    structuredData: { archetype, sponsor, scope, problem, outcome },
  });
  if (!deliverableId) return { outcome: "not_created" };
  await publishDeliverable(ctx, programId, deliverableId);
  return { outcome: "created", deliverableId };
}

export interface CloseP0Result {
  briefEnsured: boolean;
  briefSigned: boolean;
  advanced: boolean;
  newPhase: number | null;
  blockedBy: string[];
  /**
   * WHY the close finished the way it did. `blockedBy` alone cannot say:
   * four of the five stops leave it empty, and an empty `blockedBy` used to
   * be reported to the user as an unexplained failure. See
   * `origination-close-outcome.ts`.
   */
  outcome: OriginationCloseOutcome;
  /** The phase the Move is actually on, when the close found it past P0. */
  movePhase: number | null;
}

/**
 * Called when the origination approval is APPROVED. Signs the brief with the
 * authenticated authorized user as signer and advances P0→P1 through the gate.
 * Never throws — the approval itself must stand regardless.
 */
export async function closeP0OnApproval(input: {
  programId: string;
  tenantKey: string;
  deciderUserId: string;
  rationale?: string | null;
  actorTenancy?: TenancyCtx;
}): Promise<CloseP0Result> {
  const result: CloseP0Result = {
    briefEnsured: false,
    briefSigned: false,
    advanced: false,
    newPhase: null,
    blockedBy: [],
    // Any return that does not set this explicitly is an error path; the
    // catch below is the only one, and it owns `close_errored`.
    outcome: "close_errored",
    movePhase: null,
  };
  try {
    const sb = getAzureWriteFluentClient();
    // Classify this read. A dropped `error` made an outage and a genuinely
    // absent Move return the same `move_not_readable`, whose sentence
    // describes only the absent case — so a read outage told the reader the
    // Move was archived and steered them off the one action that works.
    const { data, error: moveError } = await sb
      .from("engagements")
      .select("id, client_id, name, current_phase, problem_statement, charter")
      .eq("id", input.programId)
      .maybeSingle();
    if (moveError) {
      result.outcome = "move_state_unreadable";
      console.error("[origination-close] Move state unreadable", {
        programId: input.programId,
        err: moveError.message ?? String(moveError),
      });
      return result;
    }
    const row = data as EngagementSeedRow | null;
    if (!row) {
      result.outcome = "move_not_readable";
      return result;
    }
    result.movePhase = row.current_phase ?? 0;
    // Only the P0 origination approval closes P0. Later-phase approvals
    // (handled elsewhere) must not trigger this path.
    if ((row.current_phase ?? 0) !== 0) {
      // Not a block. The Move advanced; this call simply had nothing to do.
      result.outcome = "already_past_p0";
      return result;
    }

    const ctx: TenancyCtx = {
      ...(input.actorTenancy ?? {}),
      clientId: row.client_id,
      userId: input.deciderUserId,
      clientKey: input.actorTenancy?.clientKey ?? input.tenantKey,
      role: input.actorTenancy?.role ?? "client_admin",
      tenantRole: input.actorTenancy?.tenantRole ?? "tenant_admin",
      email: input.actorTenancy?.email ?? null,
      clerkUserId: input.actorTenancy?.clerkUserId,
    };

    const brief = await ensureOriginationBrief(ctx, input.programId, row);
    if (brief.outcome === "unreadable") {
      // Refused, not failed: a second brief was not created BECAUSE an
      // existing one could not be ruled out. Nothing was written.
      result.outcome = "brief_not_readable";
      return result;
    }
    if (brief.outcome === "not_created") {
      result.outcome = "brief_not_created";
      return result;
    }
    const deliverableId = brief.deliverableId;
    result.briefEnsured = true;

    // The authorized user's approval is the brief sign-off.
    const signed = await signOffDeliverable(
      ctx,
      input.programId,
      deliverableId,
      { supabase: sb },
    );
    result.briefSigned = !!signed;

    // Governed gate — hard checks must genuinely pass; soft gaps carry.
    const gate = await evaluateGate(ctx, input.programId, 0, 1, {
      supabase: sb,
    });
    const hardFails = gate.failedChecks.filter((c) => c.severity === "hard");
    if (hardFails.length > 0) {
      result.blockedBy = hardFails.map((c) => c.check);
      result.outcome = "gate_hard_blocked";
      console.error("[origination-close] P0 gate still hard-blocked", {
        programId: input.programId,
        blockedBy: result.blockedBy,
      });
      return result;
    }

    const advanced = await advancePhase(
      ctx,
      {
        programId: input.programId,
        fromPhase: 0,
        toPhase: 1,
        snapshot: {
          humanRationale:
            input.rationale?.trim() ||
            "Origination brief approved by an authorized Move user; P0 closed and advanced to P1 Charter.",
          origination_approval_close: true,
        },
        approvedByUserId: input.deciderUserId,
      },
      { supabase: sb },
    );
    result.advanced = true;
    result.newPhase = advanced.newPhase;
    result.outcome = "advanced";

    // Durable Phase Gate Decision Record (PR-4): soft gaps stay visible.
    const carried = gate.failedChecks.filter((c) => c.severity === "soft");
    await saveGateDecisionArtifact(ctx, {
      moveId: input.programId,
      moveName: row.name ?? undefined,
      fromPhase: 0,
      toPhase: 1,
      approverName: input.deciderUserId,
      approverRole: input.actorTenancy?.role ?? "approver",
      rationale:
        input.rationale?.trim() ||
        "Origination brief approved by an authorized Move user; one-approval P0 close.",
      softGapsCarried: carried.length > 0,
      hardGateOverride: null,
      carriedGaps: carried.map((c) => ({
        check: c.check,
        reason: c.reason ?? null,
        severity: c.severity,
      })),
    });
    await sendMoveProgressUpdate({
      ctx,
      programId: input.programId,
      moveName: row.name ?? `Move ${input.programId}`,
      fromPhase: 0,
      toPhase: advanced.newPhase,
    });
    return result;
  } catch (err) {
    console.error("[origination-close] closeP0OnApproval failed", {
      programId: input.programId,
      err: err instanceof Error ? err.message : String(err),
    });
    return result;
  }
}
