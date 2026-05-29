import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import type { AiEgressAuditRecord, AiEgressAuditSink } from './types';

function toDbRow(record: Omit<AiEgressAuditRecord, 'id' | 'createdAt'>) {
  return {
    tenant_id: record.tenantId,
    user_id: record.userId ?? null,
    workflow: record.workflow,
    artifact_id: record.artifactId ?? null,
    artifact_type: record.artifactType ?? null,
    provider: record.provider,
    model: record.model ?? null,
    route: record.route,
    data_class: record.dataClass,
    policy_decision: record.policyDecision,
    decision_reason: record.decisionReason,
    prompt_hash: record.promptHash ?? null,
    response_hash: record.responseHash ?? null,
    prompt_snapshot_ref: record.promptSnapshotRef ?? null,
    response_snapshot_ref: record.responseSnapshotRef ?? null,
    request_metadata: record.requestMetadata,
    error_message: record.errorMessage ?? null,
  };
}

function fromDbRow(row: Record<string, unknown>): AiEgressAuditRecord {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    userId: typeof row.user_id === 'string' ? row.user_id : undefined,
    workflow: String(row.workflow),
    artifactId: typeof row.artifact_id === 'string' ? row.artifact_id : undefined,
    artifactType: typeof row.artifact_type === 'string' ? row.artifact_type : undefined,
    provider: row.provider as AiEgressAuditRecord['provider'],
    model: typeof row.model === 'string' ? row.model : undefined,
    route: row.route as AiEgressAuditRecord['route'],
    dataClass: row.data_class as AiEgressAuditRecord['dataClass'],
    policyDecision: row.policy_decision as AiEgressAuditRecord['policyDecision'],
    decisionReason: String(row.decision_reason),
    promptHash: typeof row.prompt_hash === 'string' ? row.prompt_hash : undefined,
    responseHash: typeof row.response_hash === 'string' ? row.response_hash : undefined,
    promptSnapshotRef: typeof row.prompt_snapshot_ref === 'string' ? row.prompt_snapshot_ref : undefined,
    responseSnapshotRef: typeof row.response_snapshot_ref === 'string' ? row.response_snapshot_ref : undefined,
    requestMetadata: (row.request_metadata as Record<string, unknown> | null) ?? {},
    errorMessage: typeof row.error_message === 'string' ? row.error_message : undefined,
    createdAt: String(row.created_at),
  };
}

export function createSupabaseAiEgressAuditSink(): AiEgressAuditSink {
  return {
    async write(record) {
      const supabase = getAzureWriteFluentClient();
      const { data, error } = await supabase
        .from('ai_egress_audit')
        .insert(toDbRow(record))
        .select('*')
        .single();

      if (error) {
        throw new Error(`AI egress audit write failed: ${error.message}`);
      }
      return fromDbRow(data as Record<string, unknown>);
    },
  };
}
