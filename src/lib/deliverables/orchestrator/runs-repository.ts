// Deliverable runs repository — async status ledger access.
//
// Tracks board-grade generation runs in Postgres so the multi-replica app can poll a
// run's status across replicas. The DB client is injectable so the mapping is unit-
// tested without the data plane.

import 'server-only';

import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';

export type DeliverableRunStatus = 'running' | 'succeeded' | 'blocked' | 'failed';

export interface DeliverableRunRecord {
  id: string;
  clientId: string;
  tenantKey: string;
  userId: string;
  module: string;
  archetype: string;
  deliverableType: string;
  status: DeliverableRunStatus;
  artifactId: string | null;
  sectionCount: number | null;
  retrievedEvidence: number | null;
  blockers: string[];
  warnings: string[];
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRunInput {
  clientId: string;
  tenantKey: string;
  userId: string;
  module: string;
  archetype: string;
  deliverableType: string;
}

export interface CompleteRunInput {
  status: 'succeeded' | 'blocked' | 'failed';
  artifactId?: string | null;
  sectionCount?: number | null;
  retrievedEvidence?: number | null;
  blockers?: string[];
  warnings?: string[];
  error?: string | null;
}

type DbClient = ReturnType<typeof getAzureWriteFluentClient>;

function rowToRecord(row: Record<string, unknown>): DeliverableRunRecord {
  const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);
  return {
    id: String(row.id),
    clientId: String(row.client_id),
    tenantKey: String(row.tenant_key),
    userId: String(row.user_id),
    module: String(row.module),
    archetype: String(row.archetype),
    deliverableType: String(row.deliverable_type),
    status: row.status as DeliverableRunStatus,
    artifactId: row.artifact_id ? String(row.artifact_id) : null,
    sectionCount: row.section_count === null || row.section_count === undefined ? null : Number(row.section_count),
    retrievedEvidence: row.retrieved_evidence === null || row.retrieved_evidence === undefined ? null : Number(row.retrieved_evidence),
    blockers: arr(row.blockers),
    warnings: arr(row.warnings),
    error: typeof row.error === 'string' ? row.error : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function createDeliverableRun(
  input: CreateRunInput,
  db: DbClient = getAzureWriteFluentClient(),
): Promise<DeliverableRunRecord> {
  const { data, error } = await db
    .from('deliverable_runs')
    .insert({
      client_id: input.clientId,
      tenant_key: input.tenantKey,
      user_id: input.userId,
      module: input.module,
      archetype: input.archetype,
      deliverable_type: input.deliverableType,
      status: 'running',
    })
    .select('*')
    .single();
  if (error) throw new Error(`deliverable_runs insert failed: ${error.message}`);
  return rowToRecord(data as Record<string, unknown>);
}

export async function completeDeliverableRun(
  id: string,
  input: CompleteRunInput,
  db: DbClient = getAzureWriteFluentClient(),
): Promise<void> {
  const { error } = await db
    .from('deliverable_runs')
    .update({
      status: input.status,
      artifact_id: input.artifactId ?? null,
      section_count: input.sectionCount ?? null,
      retrieved_evidence: input.retrievedEvidence ?? null,
      blockers: input.blockers ?? [],
      warnings: input.warnings ?? [],
      error: input.error ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw new Error(`deliverable_runs update failed: ${error.message}`);
}

/** Read a run, scoped to the owning client (tenant-isolation defense-in-depth). */
export async function getDeliverableRun(
  id: string,
  clientId: string,
  db: DbClient = getAzureWriteFluentClient(),
): Promise<DeliverableRunRecord | null> {
  const { data, error } = await db
    .from('deliverable_runs')
    .select('*')
    .eq('id', id)
    .eq('client_id', clientId)
    .maybeSingle();
  if (error) throw new Error(`deliverable_runs read failed: ${error.message}`);
  return data ? rowToRecord(data as Record<string, unknown>) : null;
}
