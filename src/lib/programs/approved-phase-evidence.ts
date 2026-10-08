import "server-only";

import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import type { TenancyCtx } from "@/lib/programs/types.db";
import { tenantAliasesFor } from "@/lib/tenant/aliases";

export interface ApprovedPhaseEvidenceReference {
  evidenceId: string;
  title: string;
  familyKey: string;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function textValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Return only human-approved evidence records for the requested Move phase. */
export async function listApprovedPhaseEvidence(
  ctx: TenancyCtx,
  moveId: string,
  phase: number,
): Promise<ApprovedPhaseEvidenceReference[]> {
  const tenantKey = ctx.clientKey;
  if (!tenantKey || !moveId || !Number.isInteger(phase)) return [];
  // Match any representation of the tenant (app client key + canonical
  // substrate alias) so approved evidence loaded under either is seen by the
  // gate. The alias set is per-tenant, so this cannot widen to another tenant.
  const tenantKeys = tenantAliasesFor(tenantKey);

  try {
    const db = getAzureWriteFluentClient();
    const { data: reviews, error: reviewError } = await db
      .from("program_evidence_reviews")
      .select("evidence_id, family_key, source_ref, reviewed_at")
      .in("tenant_key", tenantKeys)
      .eq("program_id", moveId)
      .eq("phase", phase)
      .eq("decision", "approved")
      .order("reviewed_at", { ascending: false })
      .limit(160);
    if (reviewError || !Array.isArray(reviews) || reviews.length === 0)
      return [];

    const reviewRows = reviews as Array<Record<string, unknown>>;
    const evidenceIds = reviewRows
      .map((row) => textValue(row.evidence_id))
      .filter((id): id is string => Boolean(id));
    if (evidenceIds.length === 0) return [];

    const { data: evidence, error: evidenceError } = await db
      .from("program_evidence_items")
      .select("id, title")
      .in("tenant_key", tenantKeys)
      .eq("program_id", moveId)
      .in("id", evidenceIds);
    if (evidenceError || !Array.isArray(evidence)) return [];

    const evidenceTitleById = new Map(
      (evidence as Array<Record<string, unknown>>).map((row) => [
        textValue(row.id),
        textValue(row.title),
      ]),
    );

    return reviewRows.flatMap((row) => {
      const evidenceId = textValue(row.evidence_id);
      if (!evidenceId || !evidenceTitleById.has(evidenceId)) return [];
      const sourceRef = objectValue(row.source_ref);
      const familyKey = textValue(row.family_key) ?? "current_state_evidence";
      return [
        {
          evidenceId,
          title:
            textValue(sourceRef.filename) ??
            textValue(sourceRef.title) ??
            evidenceTitleById.get(evidenceId) ??
            familyKey,
          familyKey,
        },
      ];
    });
  } catch {
    return [];
  }
}
