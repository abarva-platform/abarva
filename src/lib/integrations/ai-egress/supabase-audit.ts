/**
 * Supabase-backed AI Egress audit sink.
 *
 * Since PRE-W4-PR-6, this file no longer talks to Supabase directly.
 * The sole authority that writes to `public.ai_egress_audit` is
 * `src/lib/admin/broker/egress-audit-writer.ts`. This module is a thin
 * factory that returns an `AiEgressAuditSink` bound to a caller-supplied
 * `EgressAuditTenantContext`. Every `.write()` invocation flows through
 * the broker wrapper, which stamps `request_metadata.intendedTenantKey`
 * and `request_metadata.resolvedTenantKey` automatically.
 *
 * The `egress-writer-monopoly.test.ts` hygiene gate enforces that no
 * other file in `src/` issues a direct insert against `ai_egress_audit`.
 */

import {
  writeEgressAudit,
  type EgressAuditTenantContext,
  type EgressAuditWriteInput,
} from '@/lib/admin/broker/egress-audit-writer';
import type { AiEgressAuditSink } from './types';

/**
 * Build a Supabase-backed audit sink with tenant context baked in.
 *
 * The `ctx` argument is REQUIRED. Callers that cannot supply both an
 * `intendedTenantKey` and a `resolvedTenantKey` MUST resolve them
 * first — typically via `resolveTenant()` in `src/lib/tenant/`. The
 * wrapper throws on missing context, so a caller that omits this
 * argument will receive a runtime error on the first write rather
 * than ship a silently-unstamped row.
 *
 * @param ctx - Tenant resolution context. `intendedTenantKey` is what
 *   the caller asked for (session/cookie/explicit slug);
 *   `resolvedTenantKey` is what the policy/loader actually decided to
 *   act on. When the two differ, the broker writer fires a structured
 *   warn and the isolation-posture broker badges the row anomalous.
 */
export function createSupabaseAiEgressAuditSink(
  ctx: EgressAuditTenantContext,
): AiEgressAuditSink {
  return {
    async write(record) {
      // `record.tenantId` is the canonical tenant_id UUID the row
      // gets stamped with on the DB row. The ctx.tenantId is the
      // SAME value (the caller resolved it before constructing the
      // sink). We trust ctx.tenantId because it's what the broker
      // writer validates; record.tenantId is included in the input
      // and is just a field-rename through.
      const input: EgressAuditWriteInput = {
        tenantId: record.tenantId,
        userId: record.userId,
        workflow: record.workflow,
        artifactId: record.artifactId,
        artifactType: record.artifactType,
        provider: record.provider,
        model: record.model,
        route: record.route,
        dataClass: record.dataClass,
        policyDecision: record.policyDecision,
        decisionReason: record.decisionReason,
        promptHash: record.promptHash,
        responseHash: record.responseHash,
        promptSnapshotRef: record.promptSnapshotRef,
        responseSnapshotRef: record.responseSnapshotRef,
        requestMetadata: record.requestMetadata,
        errorMessage: record.errorMessage,
      };
      return await writeEgressAudit(input, ctx);
    },
  };
}

export type { EgressAuditTenantContext } from '@/lib/admin/broker/egress-audit-writer';
