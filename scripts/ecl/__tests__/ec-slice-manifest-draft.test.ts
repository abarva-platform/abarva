import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { CANONICAL_TENANT_KEYS } from '../../../src/config/tenants/CANONICAL_TENANTS';
import { validateManifest, resolveLoadApproval } from '../../../src/lib/governance/dataset-manifest';
import { buildEcSliceManifestDraft } from '../ec_slice_manifest_draft';

const registry = JSON.parse(readFileSync(new URL('../../../datasets/tenant-inputs/tenant-input-registry.json', import.meta.url), 'utf8'));
const tenant = registry.activeTenants.find((entry: { tenantKey: string }) =>
  (CANONICAL_TENANT_KEYS as readonly string[]).includes(entry.tenantKey)).tenantKey;

test('unsigned registry-bound draft cannot authorize declaration or load', () => {
  const draft = buildEcSliceManifestDraft(tenant, registry, 3);
  assert.equal(draft.client_key, tenant);
  assert.equal(draft.approved_by, '');
  assert.equal(draft.load_approval, null);
  assert.equal(draft.serving_approval, null);
  assert.equal(validateManifest(draft).ok, false);
  assert.equal(resolveLoadApproval([draft], {
    dataset_id: draft.dataset_id, tenant_key: tenant,
    assessment_id: 'ec-disposable-proof', source_set_hash: '0'.repeat(64),
    object_count: 3, ingestion_method: 'operator_aca_job',
  }).approved, false);
});

test('draft refuses undeclared identity and unknown population', () => {
  assert.throws(() => buildEcSliceManifestDraft('not-a-tenant', registry, 3));
  assert.throws(() => buildEcSliceManifestDraft(tenant, { activeTenants: [] }, 3));
  assert.throws(() => buildEcSliceManifestDraft(tenant, registry, NaN));
});
