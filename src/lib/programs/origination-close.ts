import "server-only";

// ── One approval closes P0 ────────────────────────────────────────────────────
// The origination flow's contract, per founder spec (2026-06-11): P0 is one
// screen — the user completes origination, promotes, and the Move goes to
// "awaiting sponsor approval". Approving that ONE decision must close P0
// entirely: the sponsor's approval IS the origination-brief sign-off, and the
// Move advances to P1 Charter through the governed gate. No hidden second
// gate, no revisiting P0.
//
// Mechanics (all governed, no gate bypass):
//   1. ensureOriginationBrief — create the signable `origination_brief`
//      deliverable from the Move's REAL charter data (generalized: works for
//      any use case/archetype; no hardcoded prose).
//   2. Sign it off, recording the approving sponsor as signer.
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
import type { TenancyCtx } from "@/lib/programs/types.db";

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
 * Create (if absent) the signable origination_brief deliverable from the
 * Move's real origination data. Generalized — content comes from the charter
 * fields captured at origination, never from use-case-specific boilerplate.
 * Returns the deliverableId (existing or newly created).
 */
export async function ensureOriginationBrief(
  ctx: TenancyCtx,
  programId: string,
  row: EngagementSeedRow,
): Promise<string | null> {
  const sb = getAzureWriteFluentClient();
  const { data: existing } = await sb
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
  if (existing?.id) return existing.id as string;

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
  await publishDeliverable(ctx, programId, deliverableId);
  return deliverableId;
}

export interface CloseP0Result {
  briefEnsured: boolean;
  briefSigned: boolean;
  advanced: boolean;
  newPhase: number | null;
  blockedBy: string[];
}

/**
 * Called when the origination approval is APPROVED. Signs the brief with the
 * approving sponsor as signer and advances P0→P1 through the governed gate.
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
  };
  try {
    const sb = getAzureWriteFluentClient();
    const { data } = await sb
      .from("engagements")
      .select("id, client_id, name, current_phase, problem_statement, charter")
      .eq("id", input.programId)
      .maybeSingle();
    const row = data as EngagementSeedRow | null;
    if (!row) return result;
    // Only the P0 origination approval closes P0. Later-phase approvals
    // (handled elsewhere) must not trigger this path.
    if ((row.current_phase ?? 0) !== 0) return result;

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

    const deliverableId = await ensureOriginationBrief(
      ctx,
      input.programId,
      row,
    );
    result.briefEnsured = !!deliverableId;
    if (!deliverableId) return result;

    // The sponsor's approval IS the brief sign-off — recorded with the
    // approving user as signer.
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
            "Origination brief approved by sponsor; P0 closed and advanced to P1 Charter per the one-approval origination contract.",
          origination_approval_close: true,
        },
        approvedByUserId: input.deciderUserId,
      },
      { supabase: sb },
    );
    result.advanced = true;
    result.newPhase = advanced.newPhase;

    // Durable Phase Gate Decision Record (PR-4): soft gaps stay visible.
    const carried = gate.failedChecks.filter((c) => c.severity === "soft");
    await saveGateDecisionArtifact(ctx, {
      moveId: input.programId,
      moveName: row.name ?? undefined,
      fromPhase: 0,
      toPhase: 1,
      approverName: input.deciderUserId,
      approverRole: "sponsor",
      rationale:
        input.rationale?.trim() ||
        "Origination brief approved; one-approval P0 close.",
      softGapsCarried: carried.length > 0,
      hardGateOverride: null,
      carriedGaps: carried.map((c) => ({
        check: c.check,
        reason: c.reason ?? null,
        severity: c.severity,
      })),
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
