import "server-only";

// Moves — persist/read the approved next-phase Inputs Pack (Level 2 feed-forward)
// through the EXISTING governed Move-scoped store (`program_evidence_items`).
// No new table, no migration. Reuses the same DB client, tenancy, RLS, and audit
// log as the evidence writer; the pack is stored as a JSONB payload under a
// distinct `evidence_type` discriminator. Move-scoped; NEVER promoted to
// enterprise context.

import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import {
  APPROVED_INPUTS_PACK_TYPE,
  isApprovedInputsPack,
  type ApprovedInputsPack,
} from "@/lib/programs/phase-templates";
import { writeProgramAuditLogBestEffort } from "./audit-log";
import type { TenancyCtx } from "./types.db";

export interface RecordApprovedInputsPackInput {
  tenantKey: string;
  moveId: string;
  targetPhase: number;
  targetPhaseLabel: string;
  pack: ApprovedInputsPack;
  sourceAttachmentId?: string | null;
}

/** Write an approved Inputs Pack as Move-scoped content. Returns the record id. */
export async function recordApprovedInputsPack(
  ctx: TenancyCtx,
  input: RecordApprovedInputsPackInput,
): Promise<string> {
  const sb = getAzureWriteFluentClient();
  const { data, error } = await sb
    .from("program_evidence_items")
    .insert({
      tenant_key: input.tenantKey,
      program_id: input.moveId,
      attachment_id: input.sourceAttachmentId ?? null,
      // The pack is READ BY the target phase, so scope the record to it.
      phase: input.targetPhase,
      step_id: null,
      evidence_type: APPROVED_INPUTS_PACK_TYPE,
      title: `Approved Inputs Pack for ${input.targetPhaseLabel}`,
      summary: `Client-approved hand-off carried into ${input.targetPhaseLabel}. Move-scoped; not added to enterprise context.`,
      extracted_text: null,
      // JSONB column — the governed pack payload. Move-scoped by construction.
      extracted_structured: input.pack,
      confidence: 1,
      created_by_user_id: ctx.userId,
    })
    .select("id")
    .single();
  if (error) throw error;
  const id = (data as { id: string }).id;
  await writeProgramAuditLogBestEffort(ctx, {
    tenantKey: input.tenantKey,
    programId: input.moveId,
    engagementId: input.moveId,
    action: "program_evidence_captured",
    fromState: null,
    toState: APPROVED_INPUTS_PACK_TYPE,
    rationale: `Approved Inputs Pack for phase ${input.targetPhase}`,
    evidenceRefs: [id],
  });
  return id;
}

export interface ApprovedInputsPackRecord {
  id: string;
  pack: ApprovedInputsPack;
  approvedAt: string;
  approvedBy: string;
}

/** Read the latest approved Inputs Pack targeting a phase, if any. */
export async function getLatestApprovedInputsPack(
  input: { tenantKey: string; moveId: string; phase: number },
): Promise<ApprovedInputsPackRecord | null> {
  const sb = getAzureWriteFluentClient();
  const { data, error } = await sb
    .from("program_evidence_items")
    .select("id, extracted_structured, created_at, created_by_user_id")
    .eq("tenant_key", input.tenantKey)
    .eq("program_id", input.moveId)
    .eq("phase", input.phase)
    .eq("evidence_type", APPROVED_INPUTS_PACK_TYPE)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as {
    id: string;
    extracted_structured: unknown;
    created_at: string;
    created_by_user_id: string;
  };
  if (!isApprovedInputsPack(row.extracted_structured)) return null;
  return {
    id: row.id,
    pack: row.extracted_structured,
    approvedAt: row.created_at,
    approvedBy: row.created_by_user_id,
  };
}
