import { CANONICAL_TENANT_KEYS } from '../../src/config/tenants/CANONICAL_TENANTS';

/** An unsigned proposal, never an active registry entry or load authorization. */
export function buildEcSliceManifestDraft(
  tenantKey: string,
  registry: { activeTenants: Array<{ tenantKey?: string; key?: string; tenantId?: string; clientKey?: string }> },
  expectedObjectCount: number,
) {
  if (!(CANONICAL_TENANT_KEYS as readonly string[]).includes(tenantKey)) {
    throw new Error('Draft tenant is not canonical');
  }
  if (!registry.activeTenants.some((entry) => entry.tenantKey === tenantKey)) {
    throw new Error('Draft tenant is not declared in the input registry');
  }
  if (!Number.isSafeInteger(expectedObjectCount) || expectedObjectCount < 0) {
    throw new Error('Draft count must be an explicit nonnegative integer');
  }
  return {
    dataset_id: 'ec-private-candidate-v0',
    title: 'Non-serving fictional context candidate',
    client_key: tenantKey,
    tenant_scope: 'canonical_tenant',
    source_layer: 'tenant_context',
    classification: 'internal',
    owner: 'context-data-steward',
    source_basis: 'fictional_private_candidate_not_client_attested',
    ingestion_method: 'operator_aca_job',
    retrieval_plan: 'postgres_fts',
    retrieval_proof_required: true,
    pii_phi_handling: 'Fictional aggregate records only; no real individual information.',
    expected_object_count: expectedObjectCount,
    approved_by: '',
    approved_at: '',
    load_approval: null,
    serving_approval: null,
    notes: 'Unsigned draft outside the active registry. Expected count is catalog objects only, excluding source rows, assertions, measures, edges and evidence sidecars. No declaration, load, review, indexing, retrieval, or serving approval.',
  } as const;
}
