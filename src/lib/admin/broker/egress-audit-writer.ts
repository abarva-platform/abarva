/**
 * Egress Audit Writer · PRE-W4-PR-6 (tenant-stamping default-on)
 *
 * The sole authority that may write to `public.ai_egress_audit`.
 *
 * Why this exists
 * ---------------
 * The Setup Audit verdict (`docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md`
 * §6 risk register) and the Persona C incident notes called out that the
 * isolation-posture broker (`isolation-posture-broker.ts:44-52,256-265`)
 * can only flag a cross-tenant mis-routing when callers stamp BOTH
 * `request_metadata.intendedTenantKey` and `request_metadata.resolvedTenantKey`
 * on the audit row. Detection was opt-in. A STRESS-P0-006-class silent
 * mis-routing without those stamps would register as a normal `allow`
 * row, not an anomaly.
 *
 * This wrapper closes the gap:
 *
 *   - Every write to `ai_egress_audit` MUST flow through this writer.
 *   - The writer REQUIRES a `ctx` with `intendedTenantKey`,
 *     `resolvedTenantKey`, and `tenantId`. Missing fields throw — the
 *     row never lands.
 *   - The two tenant identifiers are merged into `request_metadata`,
 *     preserving any other caller-set fields.
 *   - When intended ≠ resolved, a structured warn fires immediately
 *     (write-time anomaly signal), in addition to the lane-time
 *     detection in `isolation-posture-broker.ts`.
 *
 * Hygiene gate: `egress-writer-monopoly.test.ts` scans `src/` for any
 * `ai_egress_audit` insert outside this file. If a future PR bypasses
 * the writer, that test fails closed and the PR cannot merge.
 *
 * Broker-boundary doctrine: this file lives under
 * `src/lib/admin/broker/**`, the only directory where direct data-plane
 * access (Supabase / Postgres) is permitted from the app tier
 * (`broker-boundary.test.ts`). The W1-PR-4 admin-surface boundary gate
 * already forbids direct Supabase imports from `src/app/(maestro)/admin`
 * and `src/lib/admin/**` outside this directory.
 *
 * PII doctrine: this wrapper does NOT change which columns are written.
 * It stamps tenant context only. Payload-fingerprint columns
 * (`prompt_hash`, `response_hash`, `prompt_snapshot_ref`,
 * `response_snapshot_ref`) are still controlled by the caller record
 * — the wrapper is a stamp + write gate, not a redactor.
 *
 * Honesty doctrine (memory · feedback_no_demo_thinking.md): if tenant
 * context cannot be supplied, the writer throws rather than write a
 * half-stamped row. No silent failures.
 */

import "server-only";

import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { emitNotification } from "@/lib/admin/broker/notification-broker";
import { resolveTenantClientUuid } from "@/lib/integrations/ai-egress/tenant-client-resolver";
import type {
  AiDataClass,
  AiEgressAuditRecord,
  AiPolicyDecision,
  AiProvider,
  AiRoute,
} from "@/lib/integrations/ai-egress/types";

// ── Contract ────────────────────────────────────────────────────────────────

/**
 * The input shape for an egress audit write. Mirrors the
 * `Omit<AiEgressAuditRecord, 'id' | 'createdAt'>` shape used by the
 * existing `AiEgressAuditSink` contract so callers can swap in without
 * rewriting their field maps.
 */
export interface EgressAuditWriteInput {
  tenantId: string;
  userId?: string;
  workflow: string;
  artifactId?: string;
  artifactType?: string;
  provider: AiProvider;
  model?: string;
  route: AiRoute;
  dataClass: AiDataClass;
  policyDecision: AiPolicyDecision;
  decisionReason: string;
  promptHash?: string;
  responseHash?: string;
  promptSnapshotRef?: string;
  responseSnapshotRef?: string;
  requestMetadata?: Record<string, unknown>;
  errorMessage?: string;
}

/**
 * Tenant resolution context. Both `intendedTenantKey` and
 * `resolvedTenantKey` are required — the wrapper refuses to write a
 * row without them. `tenantId` is the canonical UUID the row gets
 * stamped with.
 *
 * The key fields accept any tenant identifier string (slug, UUID,
 * alias). The wrapper compares them by string equality. The isolation
 * broker's lane-time detection performs the same comparison.
 */
export interface EgressAuditTenantContext {
  intendedTenantKey: string;
  resolvedTenantKey: string;
  tenantId: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateContext(ctx: EgressAuditTenantContext): void {
  if (!nonEmptyString(ctx.intendedTenantKey)) {
    throw new Error(
      "writeEgressAudit: ctx.intendedTenantKey is required (non-empty string). " +
        "Tenant stamping is default-on; a row cannot be written without intended/resolved keys.",
    );
  }
  if (!nonEmptyString(ctx.resolvedTenantKey)) {
    throw new Error(
      "writeEgressAudit: ctx.resolvedTenantKey is required (non-empty string). " +
        "Tenant stamping is default-on; a row cannot be written without intended/resolved keys.",
    );
  }
  if (!nonEmptyString(ctx.tenantId)) {
    throw new Error(
      "writeEgressAudit: ctx.tenantId is required (non-empty string). " +
        "The row needs a tenant_id for RLS to bite.",
    );
  }
}

function mergeMetadata(
  caller: Record<string, unknown> | undefined,
  ctx: EgressAuditTenantContext,
): Record<string, unknown> {
  // Stamp tenant context. We OVERWRITE any caller-supplied
  // intendedTenantKey / resolvedTenantKey — the wrapper is the
  // authority on these fields. Callers who try to spoof them lose.
  return {
    ...(caller ?? {}),
    intendedTenantKey: ctx.intendedTenantKey,
    resolvedTenantKey: ctx.resolvedTenantKey,
  };
}

function emitMismatchWarn(
  input: EgressAuditWriteInput,
  ctx: EgressAuditTenantContext,
): void {
  if (ctx.intendedTenantKey === ctx.resolvedTenantKey) return;
  // Structured warn — write-time anomaly signal. The lane-time
  // isolation broker still flags this row, but a write-time signal
  // lets ops alert before someone opens the lane.
  console.warn(
    JSON.stringify({
      event: "ai_egress_audit.tenant_mismatch",
      workflow: input.workflow,
      provider: input.provider,
      route: input.route,
      policy_decision: input.policyDecision,
      intended_tenant: ctx.intendedTenantKey,
      resolved_tenant: ctx.resolvedTenantKey,
      tenant_id: ctx.tenantId,
      user_id: input.userId ?? null,
    }),
  );
}

/**
 * W4-PR-3 · Emit `isolation.anomaly` through the notification broker
 * when a tenant-key mismatch is detected at write time. The payload
 * adheres to the isolation-anomaly template contract and the existing
 * PII allowlist — tenant slugs only, no user identifiers, no payload
 * fingerprints. Fire-and-forget: a broker outage must not block the
 * audit row insert (the row itself is the canonical record).
 */
function emitIsolationAnomalyBestEffort(
  input: EgressAuditWriteInput,
  ctx: EgressAuditTenantContext,
): void {
  if (ctx.intendedTenantKey === ctx.resolvedTenantKey) return;
  void emitNotification({
    tenantKey: ctx.resolvedTenantKey,
    eventType: "isolation.anomaly",
    payload: {
      intendedTenantKey: ctx.intendedTenantKey,
      resolvedTenantKey: ctx.resolvedTenantKey,
      intendedTenantSlug: ctx.intendedTenantKey,
      resolvedTenantSlug: ctx.resolvedTenantKey,
      detector: `ai_egress_audit.tenant_mismatch:${input.workflow}`,
      severity: "critical",
      producedAtIso: new Date().toISOString(),
    },
    targetResourceId: ctx.tenantId,
  }).catch((err: unknown) => {
    console.warn(
      JSON.stringify({
        event: "isolation_anomaly.notification_emit_failed",
        intended_tenant: ctx.intendedTenantKey,
        resolved_tenant: ctx.resolvedTenantKey,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  });
}

function toDbRow(
  input: EgressAuditWriteInput,
  ctx: EgressAuditTenantContext,
): Record<string, unknown> {
  return {
    tenant_id: ctx.tenantId,
    user_id: input.userId ?? null,
    workflow: input.workflow,
    artifact_id: input.artifactId ?? null,
    artifact_type: input.artifactType ?? null,
    provider: input.provider,
    model: input.model ?? null,
    route: input.route,
    data_class: input.dataClass,
    policy_decision: input.policyDecision,
    decision_reason: input.decisionReason,
    prompt_hash: input.promptHash ?? null,
    response_hash: input.responseHash ?? null,
    prompt_snapshot_ref: input.promptSnapshotRef ?? null,
    response_snapshot_ref: input.responseSnapshotRef ?? null,
    request_metadata: mergeMetadata(input.requestMetadata, ctx),
    error_message: input.errorMessage ?? null,
  };
}

function fromDbRow(row: Record<string, unknown>): AiEgressAuditRecord {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    userId: typeof row.user_id === "string" ? row.user_id : undefined,
    workflow: String(row.workflow),
    artifactId:
      typeof row.artifact_id === "string" ? row.artifact_id : undefined,
    artifactType:
      typeof row.artifact_type === "string" ? row.artifact_type : undefined,
    provider: row.provider as AiEgressAuditRecord["provider"],
    model: typeof row.model === "string" ? row.model : undefined,
    route: row.route as AiEgressAuditRecord["route"],
    dataClass: row.data_class as AiEgressAuditRecord["dataClass"],
    policyDecision:
      row.policy_decision as AiEgressAuditRecord["policyDecision"],
    decisionReason: String(row.decision_reason),
    promptHash:
      typeof row.prompt_hash === "string" ? row.prompt_hash : undefined,
    responseHash:
      typeof row.response_hash === "string" ? row.response_hash : undefined,
    promptSnapshotRef:
      typeof row.prompt_snapshot_ref === "string"
        ? row.prompt_snapshot_ref
        : undefined,
    responseSnapshotRef:
      typeof row.response_snapshot_ref === "string"
        ? row.response_snapshot_ref
        : undefined,
    requestMetadata:
      (row.request_metadata as Record<string, unknown> | null) ?? {},
    errorMessage:
      typeof row.error_message === "string" ? row.error_message : undefined,
    createdAt: String(row.created_at),
  };
}

// ── Entry point ─────────────────────────────────────────────────────────────

/**
 * The sole writer to `public.ai_egress_audit`.
 *
 * Throws if `ctx.intendedTenantKey`, `ctx.resolvedTenantKey`, or
 * `ctx.tenantId` are missing/blank.
 *
 * Throws if the underlying Supabase insert fails. Callers that need
 * graceful degradation (e.g. the Sentinel sink's memory fallback)
 * MUST handle the throw themselves — the writer does not silently
 * swallow.
 */
const TENANT_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const tenantUuidCache = new Map<string, string>();

/**
 * `ai_egress_audit.tenant_id` is a UUID column, but call sites have repeatedly
 * passed the tenant KEY ("skyharbor") — each one failing the whole egress with
 * `invalid input syntax for type uuid`. Fix the class at the sink: resolve a
 * non-UUID tenantId to the client UUID here, once, for every caller.
 */
async function resolveTenantUuid(tenantId: string): Promise<string> {
  if (TENANT_UUID_RE.test(tenantId)) return tenantId;
  const cached = tenantUuidCache.get(tenantId);
  if (cached) return cached;
  try {
    const id = await resolveTenantClientUuid(tenantId);
    if (id && TENANT_UUID_RE.test(id)) {
      tenantUuidCache.set(tenantId, id);
      return id;
    }
  } catch {
    /* fall through — let the insert fail loudly as before */
  }
  return tenantId;
}

export async function writeEgressAudit(
  input: EgressAuditWriteInput,
  ctx: EgressAuditTenantContext,
): Promise<AiEgressAuditRecord> {
  validateContext(ctx);
  ctx = { ...ctx, tenantId: await resolveTenantUuid(ctx.tenantId) };
  emitMismatchWarn(input, ctx);

  const supabase = getAzureWriteFluentClient();
  const { data, error } = await supabase
    .from("ai_egress_audit")
    .insert(toDbRow(input, ctx))
    .select("*")
    .single();

  if (error) {
    throw new Error(`AI egress audit write failed: ${error.message}`);
  }

  // W4-PR-3 · After the canonical row lands, fan out the
  // `isolation.anomaly` notification when the tenant context did not
  // match. Done AFTER the insert so a successful audit row still
  // exists if the notification path errors. The emitter is
  // fire-and-forget; failures never surface to the caller.
  emitIsolationAnomalyBestEffort(input, ctx);

  return fromDbRow(data as Record<string, unknown>);
}
