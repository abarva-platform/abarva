import 'server-only';

import { getActiveClientRow } from '@/lib/active-client';
import { clientKeyToInventorySubstrateKey } from '@/lib/agent/tools/intelligence/_shared';
import { getServerSupabase } from '@/lib/supabase-server';
import type { TenancyCtx } from './types.db';

export interface ProgramAuditLogInput {
  tenantKey?: string | null;
  programId: string;
  engagementId?: string | null;
  action: string;
  fromState?: string | null;
  toState?: string | null;
  rationale?: string | null;
  evidenceRefs?: string[] | null;
}

function uuidOrNull(value: string | null | undefined): string | null {
  if (!value) return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

async function resolveTenantKey(explicit: string | null | undefined): Promise<string> {
  if (explicit?.trim()) return explicit.trim();
  const client = await getActiveClientRow().catch(() => null);
  if (client?.key) return clientKeyToInventorySubstrateKey(client.key);
  return 'unknown-tenant';
}

export async function writeProgramAuditLog(
  ctx: TenancyCtx,
  input: ProgramAuditLogInput,
): Promise<void> {
  if (!input.programId) throw new Error('[program-audit-log] programId is required');
  if (!input.action) throw new Error('[program-audit-log] action is required');

  const tenantKey = await resolveTenantKey(input.tenantKey);
  const sb = getServerSupabase();
  const { error } = await sb.from('program_audit_log').insert({
    tenant_key: tenantKey,
    program_id: input.programId,
    engagement_id: uuidOrNull(input.engagementId ?? input.programId),
    actor_id: uuidOrNull(ctx.userId),
    actor_role: ctx.role ?? null,
    action: input.action,
    from_state: input.fromState ?? null,
    to_state: input.toState ?? null,
    rationale: input.rationale ?? null,
    evidence_refs: input.evidenceRefs ?? [],
  });
  if (error) {
    throw new Error(`[program-audit-log] insert failed: ${error.message ?? String(error)}`);
  }
}

export async function writeProgramAuditLogBestEffort(
  ctx: TenancyCtx,
  input: ProgramAuditLogInput,
): Promise<void> {
  try {
    await writeProgramAuditLog(ctx, input);
  } catch (err) {
    console.error('[program-audit-log] best_effort_failed', {
      action: input.action,
      programId: input.programId,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
