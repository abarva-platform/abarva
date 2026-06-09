// Behavior tests for CONTEXT_FRAMEWORK_v1 (WS-A, light).

import {
  CONTEXT_FRAMEWORK_V1,
  CONTEXT_FRAMEWORK_VERSION,
  getDimensionSpec,
  listCanonicalDimensions,
} from '@/lib/context-framework';

describe('CONTEXT_FRAMEWORK_v1', () => {
  it('is versioned and locks the 12 canonical dimensions', () => {
    expect(CONTEXT_FRAMEWORK_V1.version).toBe(CONTEXT_FRAMEWORK_VERSION);
    expect(CONTEXT_FRAMEWORK_V1.dimensions).toHaveLength(12);
  });

  it('every dimension has a complete governance contract', () => {
    for (const d of CONTEXT_FRAMEWORK_V1.dimensions) {
      expect(d.key).toMatch(/^[a-z_]+$/);
      expect(d.requiredEntities.length).toBeGreaterThan(0);
      expect(d.fields.some((f) => f.required)).toBe(true);
      expect(d.allowedSourceTypes.length).toBeGreaterThan(0);
      expect(d.idempotencyKey).toContain('tenant_key');
      expect(d.applicableAgents.length).toBeGreaterThan(0);
      // Promotion eligibility must require the full evidence chain — agent_ready
      // is earned, never minted from a load.
      expect(d.promotionEligibility.requiresSourceBasis).toBe(true);
      expect(d.promotionEligibility.requiresIndexedOrRetrievable).toBe(true);
      expect(d.promotionEligibility.requiresCiteRender).toBe(true);
    }
  });

  it('dimension keys are unique', () => {
    const keys = listCanonicalDimensions();
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('covers the brief-required client-fillable dimensions', () => {
    const keys = new Set(listCanonicalDimensions());
    for (const k of [
      'organization_leadership',
      'financials_kpis',
      'systems_applications',
      'cloud_infrastructure',
      'vendors_contracts',
      'initiatives_moves',
      'operating_model',
      'process_workflow',
      'risks_controls',
      'artifacts_evidence',
      'data_platforms_domains',
      'value_ledger_baselines',
    ]) {
      expect(keys.has(k)).toBe(true);
    }
  });

  it('every idempotency key supports update-not-duplicate (no value field in the key)', () => {
    for (const d of CONTEXT_FRAMEWORK_V1.dimensions) {
      expect(d.idempotencyKey).not.toContain('value');
      expect(d.idempotencyKey).not.toContain('value_hash');
    }
  });

  it('getDimensionSpec resolves and rejects unknowns', () => {
    expect(getDimensionSpec('vendors_contracts')?.label).toBe('Vendors & Contracts');
    expect(getDimensionSpec('nope')).toBeNull();
  });
});
