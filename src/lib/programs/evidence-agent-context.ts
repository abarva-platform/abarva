import "server-only";

import { CORPUS_GLOBAL_SCOPE, isCanonicalClientKey } from "@/lib/governance/context-corpus-policy";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import type { TenancyCtx } from "./types.db";
import { listProgramEvidenceForPrompt, type ProgramEvidencePromptItem } from "./evidence-context";
import { admitMoveSources, type MoveAdmissionDiagnostic } from "./move-agent-admission";

/** Read-only model admission; approval never creates index or citation proof. */
export async function loadProgramEvidenceForAgent(
  ctx: TenancyCtx, programId: string, phase: number | null,
): Promise<{ items: ProgramEvidencePromptItem[]; unavailable: boolean; diagnostics?: MoveAdmissionDiagnostic[] }> {
  const clientKey = canonicalTenantKey(ctx.clientKey);
  if (!clientKey || !isCanonicalClientKey(clientKey) || clientKey === CORPUS_GLOBAL_SCOPE || !ctx.clientId || !programId || phase === null || !Number.isInteger(phase) || phase < 0 || phase > 5) return { items: [], unavailable: true };
  try {
    const approved = await listProgramEvidenceForPrompt(ctx, programId, phase, { modelAdmission: true });
    const items = approved.filter(item => item.phase === phase && item.approvedAt !== null && item.extractedText === null);
    if (items.length === 0) return { items: [], unavailable: approved.length > 0 };
    const admitted = await admitMoveSources(items, item => item.admissionSource, { clientKey, tenantId: ctx.clientId, moveId: programId, phase });
    return { items: admitted.items, unavailable: admitted.items.length === 0, diagnostics: admitted.diagnostics };
  } catch {
    return { items: [], unavailable: true, diagnostics: [{ objectTable: "program_evidence_items", objectId: programId, state: "unreadable" }] };
  }
}
