import "server-only";
import { createHash } from "node:crypto";
import {
  getAzureWriteFluentClient,
  getAzureReadFluentClient,
  resolveDatabaseUrlCandidates,
  withAzureWriteTransaction,
} from "@/lib/data-plane/postgresCompat";
import { resolveTenantDatabaseConnection } from "@/lib/data-plane/tenantConnectionResolver";
import type { TenancyCtx } from "@/lib/programs/types.db";
import type { P5HandoffBinding } from "@/lib/programs/p5-measurement-plan";
import {
  evaluateGovernedObject,
  type GovernedObject,
} from "@/lib/governance/context-corpus-policy";

export const P5_HANDOFF_DATASET = "moves_p5_outcome_handoff_v1";
export class P5HandoffRefusal extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 409,
  ) {
    super(message);
  }
}

export function p5Hash(value: unknown): string {
  const canonical = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(canonical);
    if (item && typeof item === "object")
      return Object.fromEntries(
        Object.entries(item)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, val]) => [key, canonical(val)]),
      );
    return item;
  };
  return createHash("sha256")
    .update(
      typeof value === "string"
        ? value
        : (JSON.stringify(canonical(value)) ?? "undefined"),
    )
    .digest("hex");
}

export function p5LedgerId(binding: P5HandoffBinding, leverId: string): string {
  const hex = p5Hash({ dataset: P5_HANDOFF_DATASET, binding, leverId });
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export interface P5LedgerWrite {
  id: string;
  subjectLabel: string;
  category:
    | "cost_avoidance"
    | "productivity"
    | "revenue_lift"
    | "risk_reduction";
  projectedUsd: number;
  ownerRole: string;
  sourceReference: string;
  note: string;
  metadata: {
    datasetId: typeof P5_HANDOFF_DATASET;
    binding: P5HandoffBinding;
    leverId: string;
    ownerUserId: string;
    governedObject: GovernedObject;
    [key: string]: unknown;
  };
}

export async function readP5PublishedRows(
  ctx: TenancyCtx,
  moveId: string,
  independent = false,
) {
  const sb = independent
    ? getAzureReadFluentClient()
    : getAzureWriteFluentClient();
  const { data, error } = await sb
    .from("outcome_ledger")
    .select(
      "id, tenant_client_key, client_id, subject_kind, subject_ref, subject_label, is_current, value_rung, category, unit, counterfactual_confidence, governance_review_status, projected_amount, realized_amount, baseline_amount, measurement_owner_role, evidence_pointer, evidence_claim_ids, note, recorded_by, recorded_at, metadata",
    )
    .eq("client_id", ctx.clientId)
    .eq("subject_kind", "move")
    .eq("subject_ref", moveId)
    .eq("is_current", true);
  if (error || !Array.isArray(data))
    throw new P5HandoffRefusal(
      "ledger_read_unavailable",
      "Tower publication could not be read. Its state is unknown; retry the read before publishing.",
      503,
    );
  return (data as Array<Record<string, unknown>>).filter(
    (row) =>
      (row.metadata as Record<string, unknown> | null)?.datasetId ===
      P5_HANDOFF_DATASET,
  );
}

export function verifyP5PublishedRows(
  rows: Array<Record<string, unknown>>,
  binding: P5HandoffBinding,
  expected: readonly P5LedgerWrite[],
): boolean {
  if (rows.length === 0) return false;
  const basisOf = (raw: unknown) => {
    const object = raw as GovernedObject | undefined;
    if (!object || evaluateGovernedObject(object).decision === "block")
      return null;
    return {
      ...object,
      created_at: null,
      updated_at: null,
      last_reviewed_at: null,
      provenance: object.provenance
        ? { ...object.provenance, committed_at: null }
        : null,
    };
  };
  const matches =
    rows.length === expected.length &&
    expected.every((item) =>
      rows.some(
        (row) =>
          row.id === item.id &&
          row.tenant_client_key === binding.tenantKey &&
          row.client_id === binding.clientId &&
          row.subject_ref === binding.moveId &&
          row.subject_kind === "move" &&
          row.subject_label === item.subjectLabel &&
          row.is_current === true &&
          row.value_rung === "projected_only" &&
          row.category === item.category &&
          row.unit === "usd_seed" &&
          row.counterfactual_confidence === "low" &&
          row.governance_review_status === "approved" &&
          row.measurement_owner_role === item.ownerRole &&
          row.evidence_pointer === item.sourceReference &&
          p5Hash(row.evidence_claim_ids) ===
            p5Hash([
              `deliverable:${binding.contractId}:v${binding.contractVersion}:${binding.contractHash}`,
            ]) &&
          row.note === item.note &&
          row.realized_amount == null &&
          row.baseline_amount == null &&
          typeof row.recorded_by === "string" &&
          row.recorded_by.length > 0 &&
          Number.isFinite(Date.parse(String(row.recorded_at))) &&
          row.projected_amount != null &&
          Number.isFinite(Number(row.projected_amount)) &&
          Number(row.projected_amount) === item.projectedUsd &&
          (row.metadata as Record<string, unknown>)?.ownerUserId ===
            item.metadata.ownerUserId &&
          (row.metadata as Record<string, unknown>)?.leverId ===
            item.metadata.leverId &&
          p5Hash((row.metadata as Record<string, unknown>)?.measure) ===
            p5Hash(item.metadata.measure) &&
          p5Hash((row.metadata as Record<string, unknown>)?.p4Lever) ===
            p5Hash(item.metadata.p4Lever) &&
          p5Hash((row.metadata as Record<string, unknown>)?.binding) ===
            p5Hash(binding) &&
          p5Hash(
            basisOf((row.metadata as Record<string, unknown>)?.governedObject),
          ) === p5Hash(basisOf(item.metadata.governedObject)),
      ),
    );
  if (!matches)
    throw new P5HandoffRefusal(
      "publication_basis_changed",
      "The published handoff differs from the current contract, saved plan or approved P4 input basis. Review a governed rebaseline before proceeding.",
    );
  return true;
}

/** The product route owns auth; the transaction fences the physical write again. */
export async function withP5HandoffTransaction<T>(
  ctx: TenancyCtx,
  moveId: string,
  work: () => Promise<T>,
): Promise<T> {
  const url =
    resolveTenantDatabaseConnection(ctx).candidates[0] ??
    resolveDatabaseUrlCandidates()[0];
  if (!url)
    throw new P5HandoffRefusal(
      "publication_unavailable",
      "The data plane is unavailable. No handoff was published.",
      503,
    );
  return withAzureWriteTransaction(
    url,
    async (query) => {
      const locked = await query(
        "SELECT id, current_phase FROM engagements WHERE id = $1 AND client_id = $2 FOR UPDATE",
        [moveId, ctx.clientId],
      );
      if (!locked.rows.length)
        throw new P5HandoffRefusal(
          "move_not_readable",
          "This Move is not accessible.",
          404,
        );
      if (locked.rows[0].current_phase !== 5)
        throw new P5HandoffRefusal(
          "handoff_phase_required",
          "Publish the reviewed measurement handoff while this Move is in P5.",
        );
      return work();
    },
    { includeReads: true },
  );
}

export async function persistP5Handoff(
  ctx: TenancyCtx,
  binding: P5HandoffBinding,
  rows: readonly P5LedgerWrite[],
) {
  if (ctx.clientId !== binding.clientId || !ctx.userId || rows.length === 0)
    throw new P5HandoffRefusal(
      "publication_scope_invalid",
      "The handoff identity is invalid.",
      403,
    );
  const existing = await readP5PublishedRows(ctx, binding.moveId);
  if (verifyP5PublishedRows(existing, binding, rows))
    return { alreadyPublished: true };
  const now = new Date().toISOString();
  const { error } = await getAzureWriteFluentClient()
    .from("outcome_ledger")
    .insert(
      rows.map((row) => ({
        id: row.id,
        tenant_client_key: binding.tenantKey,
        client_id: binding.clientId,
        subject_kind: "move",
        subject_ref: binding.moveId,
        subject_label: row.subjectLabel,
        is_current: true,
        value_rung: "projected_only",
        category: row.category,
        unit: "usd_seed",
        projected_amount: row.projectedUsd,
        realized_amount: null,
        baseline_amount: null,
        counterfactual_confidence: "low",
        governance_review_status: "approved",
        measurement_owner_role: row.ownerRole,
        evidence_pointer: row.sourceReference,
        evidence_claim_ids: [
          `deliverable:${binding.contractId}:v${binding.contractVersion}:${binding.contractHash}`,
        ],
        note: row.note,
        metadata: {
          ...row.metadata,
          governedObject: {
            ...row.metadata.governedObject,
            created_at: now,
            updated_at: now,
            last_reviewed_at: now,
            provenance: {
              ...row.metadata.governedObject.provenance,
              committed_at: now,
            },
          },
        },
        recorded_by: ctx.userId,
        recorded_at: now,
      })),
    );
  if (error)
    throw new P5HandoffRefusal(
      "publication_write_failed",
      "The handoff write failed. Read its stored state before retrying.",
      503,
    );
  return { alreadyPublished: false };
}
