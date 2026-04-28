// TEN3 - Dedicated Tenant Deployment Blueprint tests.
//
// Deterministic, file-pure suite. No network calls, no model
// providers, no migrations, no time-of-day dependence, no auth import.

import {
  DEDICATED_TENANT_CHECKLIST_CATEGORIES,
  DEDICATED_TENANT_ONBOARDING_STEP_KINDS,
  DEDICATED_TENANT_OPERATIONAL_SURFACES,
  DEDICATED_TENANT_READINESS_STATES,
  DEDICATED_TENANT_STORE_KINDS,
  buildDedicatedTenantBlueprint,
  listDedicatedTenantChecklistCategories,
  listDedicatedTenantOnboardingStepKinds,
  listDedicatedTenantOperationalSurfaces,
  listDedicatedTenantReadinessStates,
  listDedicatedTenantStoreKinds,
  summarizeDedicatedTenantReadiness,
  validateDedicatedTenantBlueprint,
  type DedicatedTenantDeploymentModel,
} from '@/lib/architecture/dedicated-tenant-blueprint';

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('buildDedicatedTenantBlueprint · determinism', () => {
  it('returns byte-equal JSON across repeated calls', () => {
    const first = JSON.stringify(buildDedicatedTenantBlueprint());
    const second = JSON.stringify(buildDedicatedTenantBlueprint());
    const third = JSON.stringify(buildDedicatedTenantBlueprint());
    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  it('readinessChecklist is byte-equal across repeated calls', () => {
    const a = JSON.stringify(
      buildDedicatedTenantBlueprint().readinessChecklist,
    );
    const b = JSON.stringify(
      buildDedicatedTenantBlueprint().readinessChecklist,
    );
    expect(b).toBe(a);
  });

  it('summarizeDedicatedTenantReadiness is byte-equal across repeated calls', () => {
    const a = JSON.stringify(
      summarizeDedicatedTenantReadiness(buildDedicatedTenantBlueprint()),
    );
    const b = JSON.stringify(
      summarizeDedicatedTenantReadiness(buildDedicatedTenantBlueprint()),
    );
    expect(b).toBe(a);
  });
});

// ---------------------------------------------------------------------
// Canonical vocabularies
// ---------------------------------------------------------------------

describe('canonical vocabularies', () => {
  it('readiness states tuple is exact and ordered', () => {
    expect(DEDICATED_TENANT_READINESS_STATES).toEqual([
      'contract_only',
      'lab_validated',
      'pilot_ready',
      'enterprise_ready',
      'deferred',
    ]);
    expect(listDedicatedTenantReadinessStates()).toEqual(
      DEDICATED_TENANT_READINESS_STATES,
    );
  });

  it('store kinds tuple is exact and ordered', () => {
    expect(DEDICATED_TENANT_STORE_KINDS).toEqual([
      'database',
      'storage',
      'vector',
      'graph',
      'model_gateway',
      'audit',
    ]);
    expect(listDedicatedTenantStoreKinds()).toEqual(
      DEDICATED_TENANT_STORE_KINDS,
    );
  });

  it('onboarding step kinds tuple is exact and ordered', () => {
    expect(DEDICATED_TENANT_ONBOARDING_STEP_KINDS).toEqual([
      'initialize_tenant_record',
      'provision_data_stores',
      'wire_customer_sso',
      'seed_tenant_roles',
      'register_tenant_admin',
      'activate_model_gateway_policy',
      'enable_audit_boundary',
      'set_up_agents',
      'verify_tenant_smoke',
    ]);
    expect(listDedicatedTenantOnboardingStepKinds()).toEqual(
      DEDICATED_TENANT_ONBOARDING_STEP_KINDS,
    );
  });

  it('operational surfaces tuple is exact and ordered', () => {
    expect(DEDICATED_TENANT_OPERATIONAL_SURFACES).toEqual([
      'upgrade_strategy',
      'maintenance_windows',
      'backup_retention',
      'disaster_recovery',
      'secret_rotation',
      'cost_observability',
      'tenant_offboarding',
      'incident_response',
    ]);
    expect(listDedicatedTenantOperationalSurfaces()).toEqual(
      DEDICATED_TENANT_OPERATIONAL_SURFACES,
    );
  });

  it('checklist categories tuple is exact and ordered', () => {
    expect(DEDICATED_TENANT_CHECKLIST_CATEGORIES).toEqual([
      'data_plane',
      'identity',
      'governance',
      'operations',
      'cost',
    ]);
    expect(listDedicatedTenantChecklistCategories()).toEqual(
      DEDICATED_TENANT_CHECKLIST_CATEGORIES,
    );
  });
});

// ---------------------------------------------------------------------
// Required boundaries / coverage
// ---------------------------------------------------------------------

describe('required boundaries · coverage', () => {
  const blueprint = buildDedicatedTenantBlueprint();

  it('every required store kind (database, storage, vector, graph, model_gateway, audit) is present', () => {
    const seen = new Set(blueprint.dataStores.map((store) => store.kind));
    for (const kind of DEDICATED_TENANT_STORE_KINDS) {
      expect(seen.has(kind)).toBe(true);
    }
  });

  it('isolation controls cover every required store kind', () => {
    const seen = new Set(
      blueprint.isolationControls.map((control) => control.storeKind),
    );
    for (const kind of DEDICATED_TENANT_STORE_KINDS) {
      expect(seen.has(kind)).toBe(true);
    }
  });

  it('onboarding sequence covers every canonical step kind in contiguous order', () => {
    const sorted = [...blueprint.onboardingSequence].sort(
      (a, b) => a.sequence - b.sequence,
    );
    for (let index = 0; index < sorted.length; index += 1) {
      expect(sorted[index].sequence).toBe(index + 1);
    }
    const kinds = sorted.map((step) => step.kind);
    expect(kinds).toEqual([...DEDICATED_TENANT_ONBOARDING_STEP_KINDS]);
  });

  it('operational responsibilities cover every canonical surface', () => {
    const seen = new Set(
      blueprint.operationalResponsibilities.map((entry) => entry.surface),
    );
    for (const surface of DEDICATED_TENANT_OPERATIONAL_SURFACES) {
      expect(seen.has(surface)).toBe(true);
    }
  });

  it('readiness checklist covers every category', () => {
    const seen = new Set(
      blueprint.readinessChecklist.items.map((item) => item.category),
    );
    for (const category of DEDICATED_TENANT_CHECKLIST_CATEGORIES) {
      expect(seen.has(category)).toBe(true);
    }
  });

  it('every entity carries the deterministic createdFrom tag', () => {
    expect(blueprint.envelope.createdFrom).toBe(
      'deterministic_dedicated_tenant_blueprint_seed',
    );
    for (const store of blueprint.dataStores) {
      expect(store.createdFrom).toBe(
        'deterministic_dedicated_tenant_blueprint_seed',
      );
    }
    for (const control of blueprint.isolationControls) {
      expect(control.createdFrom).toBe(
        'deterministic_dedicated_tenant_blueprint_seed',
      );
    }
    for (const step of blueprint.onboardingSequence) {
      expect(step.createdFrom).toBe(
        'deterministic_dedicated_tenant_blueprint_seed',
      );
    }
    for (const entry of blueprint.operationalResponsibilities) {
      expect(entry.createdFrom).toBe(
        'deterministic_dedicated_tenant_blueprint_seed',
      );
    }
    for (const item of blueprint.readinessChecklist.items) {
      expect(item.createdFrom).toBe(
        'deterministic_dedicated_tenant_blueprint_seed',
      );
    }
    expect(blueprint.readinessChecklist.createdFrom).toBe(
      'deterministic_dedicated_tenant_blueprint_seed',
    );
    expect(blueprint.createdFrom).toBe(
      'deterministic_dedicated_tenant_blueprint_seed',
    );
  });

  it('envelope is the enterprise_dedicated tier', () => {
    expect(blueprint.envelope.tier).toBe('enterprise_dedicated');
  });

  it('every store carries non-empty risk and mitigation', () => {
    for (const store of blueprint.dataStores) {
      expect(store.risk.length).toBeGreaterThan(0);
      expect(store.mitigation.length).toBeGreaterThan(0);
      expect(store.defaultOption.length).toBeGreaterThan(0);
      expect(store.fallbackOption.length).toBeGreaterThan(0);
    }
  });

  it('every isolation control carries non-empty enforcement and audit fields', () => {
    for (const control of blueprint.isolationControls) {
      expect(control.controlStatement.length).toBeGreaterThan(0);
      expect(control.enforcementRule.length).toBeGreaterThan(0);
      expect(control.auditRequirement.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------

describe('validateDedicatedTenantBlueprint', () => {
  it('the canonical seed validates clean', () => {
    const result = validateDedicatedTenantBlueprint(
      buildDedicatedTenantBlueprint(),
    );
    expect(result.findings.filter((f) => f.severity === 'error')).toEqual([]);
    expect(result.isValid).toBe(true);
  });

  it('detects a missing store kind', () => {
    const seed = buildDedicatedTenantBlueprint();
    const broken: DedicatedTenantDeploymentModel = {
      ...seed,
      dataStores: seed.dataStores.filter((store) => store.kind !== 'audit'),
    };
    const result = validateDedicatedTenantBlueprint(broken);
    expect(result.isValid).toBe(false);
    expect(
      result.findings.some((f) => f.reason.includes('audit')),
    ).toBe(true);
  });

  it('detects a non-contiguous onboarding sequence', () => {
    const seed = buildDedicatedTenantBlueprint();
    const broken: DedicatedTenantDeploymentModel = {
      ...seed,
      onboardingSequence: seed.onboardingSequence.map((step, index) =>
        index === 0 ? { ...step, sequence: 99 } : step,
      ),
    };
    const result = validateDedicatedTenantBlueprint(broken);
    expect(result.isValid).toBe(false);
    expect(
      result.findings.some((f) => f.reason.includes('contiguous')),
    ).toBe(true);
  });

  it('detects an unknown isolation control storeKind', () => {
    const seed = buildDedicatedTenantBlueprint();
    const broken: DedicatedTenantDeploymentModel = {
      ...seed,
      isolationControls: seed.isolationControls.map((control, index) =>
        index === 0
          ? {
              ...control,
              storeKind:
                'no_such_kind' as unknown as (typeof DEDICATED_TENANT_STORE_KINDS)[number],
            }
          : control,
      ),
    };
    const result = validateDedicatedTenantBlueprint(broken);
    expect(result.isValid).toBe(false);
    expect(
      result.findings.some((f) => f.reason.includes('storeKind')),
    ).toBe(true);
  });

  it('detects a checklist item below pilot_ready with no blocker', () => {
    const seed = buildDedicatedTenantBlueprint();
    const broken: DedicatedTenantDeploymentModel = {
      ...seed,
      readinessChecklist: {
        ...seed.readinessChecklist,
        items: seed.readinessChecklist.items.map((item, index) =>
          index === 0 ? { ...item, blocker: '' } : item,
        ),
      },
    };
    const result = validateDedicatedTenantBlueprint(broken);
    expect(result.isValid).toBe(false);
    expect(
      result.findings.some((f) => f.reason.includes('blocker')),
    ).toBe(true);
  });

  it('detects a missing operational surface', () => {
    const seed = buildDedicatedTenantBlueprint();
    const broken: DedicatedTenantDeploymentModel = {
      ...seed,
      operationalResponsibilities: seed.operationalResponsibilities.filter(
        (entry) => entry.surface !== 'incident_response',
      ),
    };
    const result = validateDedicatedTenantBlueprint(broken);
    expect(result.isValid).toBe(false);
    expect(
      result.findings.some((f) => f.reason.includes('incident_response')),
    ).toBe(true);
  });

  it('detects a wrong createdFrom tag', () => {
    const seed = buildDedicatedTenantBlueprint();
    const broken: DedicatedTenantDeploymentModel = {
      ...seed,
      createdFrom:
        'something_else' as unknown as DedicatedTenantDeploymentModel['createdFrom'],
    };
    const result = validateDedicatedTenantBlueprint(broken);
    expect(result.isValid).toBe(false);
    expect(
      result.findings.some((f) => f.reason.includes('createdFrom')),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------
// Summary reconciliation
// ---------------------------------------------------------------------

describe('summarizeDedicatedTenantReadiness', () => {
  const blueprint = buildDedicatedTenantBlueprint();
  const summary = summarizeDedicatedTenantReadiness(blueprint);

  it('totalDataStores matches input length', () => {
    expect(summary.totalDataStores).toBe(blueprint.dataStores.length);
  });

  it('storeKindsCovered lists every store kind in the seed', () => {
    expect(new Set(summary.storeKindsCovered)).toEqual(
      new Set(DEDICATED_TENANT_STORE_KINDS),
    );
  });

  it('controlsByStoreKind reconciles to total isolation controls', () => {
    const sum = (
      Object.values(summary.controlsByStoreKind) as number[]
    ).reduce((a, b) => a + b, 0);
    expect(sum).toBe(blueprint.isolationControls.length);
  });

  it('storesByReadiness reconciles to totalDataStores', () => {
    const sum = (
      Object.values(summary.storesByReadiness) as number[]
    ).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalDataStores);
  });

  it('checklistItemsByCategory reconciles to total checklist items', () => {
    const sum = (
      Object.values(summary.checklistItemsByCategory) as number[]
    ).reduce((a, b) => a + b, 0);
    expect(sum).toBe(blueprint.readinessChecklist.items.length);
  });

  it('checklistItemsByReadiness reconciles to total checklist items', () => {
    const sum = (
      Object.values(summary.checklistItemsByReadiness) as number[]
    ).reduce((a, b) => a + b, 0);
    expect(sum).toBe(blueprint.readinessChecklist.items.length);
  });

  it('onboardingStepCount equals the seed length', () => {
    expect(summary.onboardingStepCount).toBe(
      blueprint.onboardingSequence.length,
    );
  });

  it('operationalSurfacesCovered matches the canonical surface vocabulary', () => {
    expect(new Set(summary.operationalSurfacesCovered)).toEqual(
      new Set(DEDICATED_TENANT_OPERATIONAL_SURFACES),
    );
  });

  it('defaults to summarizing the canonical seed when called with no arguments', () => {
    const explicit = summarizeDedicatedTenantReadiness(blueprint);
    const implicit = summarizeDedicatedTenantReadiness();
    expect(JSON.stringify(implicit)).toBe(JSON.stringify(explicit));
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene · dedicated-tenant-blueprint.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/architecture/dedicated-tenant-blueprint.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  it('does not import auth / supabase / source / sentinel / atlas / nexus / agent runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
  });

  it('does not import migrations or supabase client', () => {
    expect(codeOnly).not.toMatch(/supabase\/migrations/);
    expect(codeOnly).not.toMatch(/from 'supabase'/);
    expect(codeOnly).not.toMatch(/from '@supabase\//);
  });

  it('does not call Date.now / Math.random / new Date / fetch', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
    expect(codeOnly).not.toMatch(/\bfetch\(/);
  });

  it('does not invoke Anthropic / OpenAI / Cohere / Databricks / Pinecone runtime', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
    expect(codeOnly).not.toMatch(/cohere/i);
    expect(codeOnly).not.toMatch(/databricks/i);
    expect(codeOnly).not.toMatch(/pinecone/i);
  });

  it('does not use React state hooks (useState / useEffect)', () => {
    expect(codeOnly).not.toMatch(/\buseState\b/);
    expect(codeOnly).not.toMatch(/\buseEffect\b/);
  });

  it('does not include placeholder language (Coming soon / TBD / Lorem ipsum)', () => {
    expect(codeOnly).not.toMatch(/Coming soon/i);
    expect(codeOnly).not.toMatch(/\bTBD\b/);
    expect(codeOnly).not.toMatch(/Lorem ipsum/i);
  });

  it('does not invent dollar amounts in serialized output', () => {
    const serialized = JSON.stringify(buildDedicatedTenantBlueprint());
    expect(serialized).not.toMatch(/\$\s*\d/);
  });

  it('does not claim production-ready in serialized output', () => {
    const serialized = JSON.stringify(
      buildDedicatedTenantBlueprint(),
    ).toLowerCase();
    expect(serialized).not.toMatch(/production_ready/);
    expect(serialized).not.toMatch(/production tenant isolation is complete/);
    expect(serialized).not.toMatch(/fully enforced in production/);
  });

  it('does not invent live runtime claims for vendor models in serialized output', () => {
    const serialized = JSON.stringify(buildDedicatedTenantBlueprint());
    expect(serialized).not.toMatch(/anthropic/i);
    expect(serialized).not.toMatch(/openai/i);
    expect(serialized).not.toMatch(/cohere/i);
    expect(serialized).not.toMatch(/databricks/i);
  });
});
