/**
 * Connector-test audit writer — PRE-W4-PR-3.
 *
 * Writes one row to `admin_audit_log` per "Test connection" probe.
 * Category is `'connector'` (per the table's CHECK constraint
 * taxonomy). Action is `'connector_tested'`.
 *
 * Failure handling mirrors `tenant-switch-audit.ts`: an audit
 * failure MUST NOT block the probe result reaching the UI. We log
 * a structured `console.warn` line as the second audit channel.
 *
 * Honesty doctrine (memory · feedback_no_demo_thinking.md):
 *   • In fixture mode (default in tests + local) we skip the write
 *     and return `false` — the row would never be queryable
 *     downstream.
 *   • Credentials never appear in metadata. The probe layer is
 *     responsible for stripping anything sensitive from `reason`
 *     before reaching this writer; this module enforces a final
 *     length cap as defence-in-depth.
 */

import 'server-only';

import { azureRead } from '@/lib/data-plane/azureRead';
import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import { tenantAliasesFor } from '@/lib/tenant/aliases';
import { isFixtureMode } from '@/lib/admin/data/admin-data-mode';
import type {
  TestConnectorResult,
  TestConnectorTransition,
} from '@/lib/admin/broker/connector-health-broker';

export interface ConnectorTestAuditInput {
  actorUserId: string;
  tenantKey: string;
  connectorId: string;
  connectorLabel: string;
  result: TestConnectorResult;
}

async function resolveClientIdByCanonicalKey(
  canonicalKey: string,
): Promise<string | null> {
  try {
    const aliases = tenantAliasesFor(canonicalKey);
    for (const alias of aliases) {
      const row = await azureRead.maybeSingle<{ id: string }>({
        table: 'clients',
        columns: ['id'],
        where: { tenant_key: alias },
      });
      if (row?.id) return row.id;
    }
    for (const alias of aliases) {
      const row = await azureRead.maybeSingle<{ id: string }>({
        table: 'clients',
        columns: ['id'],
        where: { slug: alias },
      });
      if (row?.id) return row.id;
    }
  } catch {
    return null;
  }
  return null;
}

function summariseTransition(transition: TestConnectorTransition): string {
  switch (transition.kind) {
    case 'degraded':
      return ` · degraded (${transition.reason})`;
    case 'recovered':
      return ' · recovered';
    case 'none':
      return '';
  }
}

/**
 * Writes one row to `admin_audit_log` describing a "Test
 * connection" probe. Returns `true` when the row landed, `false`
 * when the write was skipped or failed. Callers MUST NOT gate the
 * user-visible probe result on the return value.
 */
export async function writeConnectorTestAudit(
  input: ConnectorTestAuditInput,
): Promise<boolean> {
  if (isFixtureMode()) {
    return false;
  }

  const clientId = await resolveClientIdByCanonicalKey(input.tenantKey);
  if (!clientId) {
    console.warn(
      JSON.stringify({
        event: 'connector_test_audit_skipped',
        reason: 'unresolved_client_id',
        tenant: input.tenantKey,
        connector: input.connectorId,
      }),
    );
    return false;
  }

  // Defence-in-depth: cap any free-form text. The probe layer should
  // already strip credentials from `reason`, but a 200-char cap
  // guarantees nothing weird slips into the audit table.
  const reason = input.result.reason
    ? input.result.reason.slice(0, 200)
    : null;

  const verdict = input.result.ok ? 'healthy' : 'failed';
  const summary = `Connector tested · ${input.connectorLabel} · ${verdict} · ${input.result.latencyMs}ms${summariseTransition(input.result.transition)}`;

  const metadata = {
    actor_user_id: input.actorUserId,
    connector_id: input.connectorId,
    ok: input.result.ok,
    latency_ms: input.result.latencyMs,
    reason,
    probed_at_iso: input.result.probedAtIso,
    prior_status: input.result.priorStatus,
    next_status: input.result.nextStatus,
    transition_kind: input.result.transition.kind,
  } as const;

  try {
    const supabase = getAzureWriteFluentClient();
    const { error } = await supabase.from('admin_audit_log').insert({
      client_id: clientId,
      actor_person_id: null,
      category: 'connector',
      action: 'connector_tested',
      target_kind: 'connector',
      target_id: input.connectorId,
      summary,
      metadata,
    });
    if (error) {
      console.warn(
        JSON.stringify({
          event: 'connector_test_audit_failed',
          reason: error.message ?? 'unknown',
          tenant: input.tenantKey,
          connector: input.connectorId,
        }),
      );
      return false;
    }
    return true;
  } catch (err) {
    console.warn(
      JSON.stringify({
        event: 'connector_test_audit_failed',
        reason: err instanceof Error ? err.message : 'unknown',
        tenant: input.tenantKey,
        connector: input.connectorId,
      }),
    );
    return false;
  }
}
