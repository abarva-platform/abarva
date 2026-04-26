import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  loadProductionReadinessManifest,
  type ProductionReadinessComponent,
  type ProductionReadinessManifest,
} from '@/lib/admin/production-readiness';
import {
  PRODUCTION_READINESS_VALIDATION_RULES,
  summarizeProductionReadinessValidation,
  validateProductionReadinessComponent,
  validateProductionReadinessManifest,
  type ProductionReadinessValidationRule,
} from '@/lib/admin/production-readiness-validator';

const validatorPath = resolve(__dirname, '../../../lib/admin/production-readiness-validator.ts');

function cloneManifest(): ProductionReadinessManifest {
  const original = loadProductionReadinessManifest();
  return JSON.parse(JSON.stringify(original)) as ProductionReadinessManifest;
}

function findComponent(
  manifest: ProductionReadinessManifest,
  componentId: string,
): ProductionReadinessComponent {
  const component = manifest.components.find((item) => item.id === componentId);
  if (!component) {
    throw new Error(`Test fixture missing component "${componentId}" in cloned manifest.`);
  }
  return component;
}

function findingsForRule(
  result: ReturnType<typeof validateProductionReadinessManifest>,
  rule: ProductionReadinessValidationRule,
) {
  return result.findings.filter((finding) => finding.rule === rule);
}

describe('production readiness validator on real manifest', () => {
  it('returns passed=true on the real production-readiness.json manifest', () => {
    const manifest = loadProductionReadinessManifest();
    const result = validateProductionReadinessManifest(manifest);
    if (!result.passed) {
      throw new Error(
        `Expected real manifest to validate, got findings:\n${summarizeProductionReadinessValidation(result)}`,
      );
    }
    expect(result.passed).toBe(true);
    expect(result.errorCount).toBe(0);
    expect(result.findings).toEqual([]);
  });

  it('exposes the canonical list of validation rules in stable order', () => {
    expect([...PRODUCTION_READINESS_VALIDATION_RULES]).toEqual([
      'manifest_parses',
      'all_required_components_exist',
      'all_statuses_valid',
      'all_dimensions_present',
      'all_testing_gates_present',
      'production_ready_requires_all_gates_pass',
      'pilot_ready_requires_route_smoke_or_persona_walk',
      'every_component_has_next_action',
      'every_blocker_has_severity_and_description',
      'no_live_monitoring_claim_unless_source_says_live',
      'overall_readiness_percent_within_planned_range',
      'maturity_snapshot_present',
    ]);
  });

  it('summarizes a passing result with no findings', () => {
    const manifest = loadProductionReadinessManifest();
    const summary = summarizeProductionReadinessValidation(validateProductionReadinessManifest(manifest));
    expect(summary).toContain('PASSED');
    expect(summary).toContain('No findings recorded.');
  });

  it('per-component validator returns no findings on real components', () => {
    const manifest = loadProductionReadinessManifest();
    for (const component of manifest.components) {
      const findings = validateProductionReadinessComponent(component);
      if (findings.length > 0) {
        throw new Error(
          `Expected no findings for ${component.id}, got: ${findings
            .map((finding) => `${finding.rule}: ${finding.message}`)
            .join('; ')}`,
        );
      }
    }
  });
});

describe('production readiness validator negative cases', () => {
  it('manifest_parses fires when input is not a structural manifest', () => {
    const result = validateProductionReadinessManifest({} as ProductionReadinessManifest);
    expect(result.passed).toBe(false);
    expect(findingsForRule(result, 'manifest_parses')).toHaveLength(1);
  });

  it('all_required_components_exist fires when a required component is removed', () => {
    const manifest = cloneManifest();
    manifest.components = manifest.components.filter(
      (component) => component.id !== 'model_gateway',
    );
    const result = validateProductionReadinessManifest(manifest);
    expect(result.passed).toBe(false);
    const findings = findingsForRule(result, 'all_required_components_exist');
    expect(findings).toHaveLength(1);
    expect(findings[0].componentId).toBe('model_gateway');
  });

  it('all_statuses_valid fires when a component status is not in the canonical enum', () => {
    const manifest = cloneManifest();
    const component = findComponent(manifest, 'programs');
    (component as unknown as { status: string }).status = 'mostly_done';
    const result = validateProductionReadinessManifest(manifest);
    expect(result.passed).toBe(false);
    const findings = findingsForRule(result, 'all_statuses_valid');
    expect(findings.some((finding) => finding.componentId === 'programs')).toBe(true);
  });

  it('all_dimensions_present fires when a dimension is removed', () => {
    const manifest = cloneManifest();
    const component = findComponent(manifest, 'programs');
    delete (component.dimensions as unknown as Record<string, unknown>).functionality;
    const result = validateProductionReadinessManifest(manifest);
    const findings = findingsForRule(result, 'all_dimensions_present');
    expect(findings.some((finding) => finding.componentId === 'programs')).toBe(true);
    expect(findings.some((finding) => finding.message.includes('functionality'))).toBe(true);
  });

  it('all_testing_gates_present fires when a gate is removed', () => {
    const manifest = cloneManifest();
    const component = findComponent(manifest, 'programs');
    delete (component.testingGates as unknown as Record<string, unknown>).route_smoke;
    const result = validateProductionReadinessManifest(manifest);
    const findings = findingsForRule(result, 'all_testing_gates_present');
    expect(findings.some((finding) => finding.componentId === 'programs')).toBe(true);
    expect(findings.some((finding) => finding.message.includes('route_smoke'))).toBe(true);
  });

  it('production_ready_requires_all_gates_pass fires when status is production_ready but a gate is not passing', () => {
    const manifest = cloneManifest();
    const component = findComponent(manifest, 'programs');
    (component as unknown as { status: string }).status = 'production_ready';
    component.blockers = [];
    const result = validateProductionReadinessManifest(manifest);
    const findings = findingsForRule(result, 'production_ready_requires_all_gates_pass');
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.every((finding) => finding.componentId === 'programs')).toBe(true);
  });

  it('pilot_ready_requires_route_smoke_or_persona_walk fires when both gates are not_started', () => {
    const manifest = cloneManifest();
    const component = findComponent(manifest, 'admin_setup');
    (component as unknown as { status: string }).status = 'pilot_ready';
    component.testingGates.route_smoke = { status: 'not_started', evidence: '' };
    component.testingGates.live_persona_walk = { status: 'not_started', evidence: '' };
    const result = validateProductionReadinessManifest(manifest);
    const findings = findingsForRule(result, 'pilot_ready_requires_route_smoke_or_persona_walk');
    expect(findings).toHaveLength(1);
    expect(findings[0].componentId).toBe('admin_setup');
  });

  it('every_component_has_next_action fires when nextAction is empty', () => {
    const manifest = cloneManifest();
    const component = findComponent(manifest, 'programs');
    (component as unknown as { nextAction: string }).nextAction = '';
    const result = validateProductionReadinessManifest(manifest);
    const findings = findingsForRule(result, 'every_component_has_next_action');
    expect(findings).toHaveLength(1);
    expect(findings[0].componentId).toBe('programs');
  });

  it('every_blocker_has_severity_and_description fires when blocker fields are missing', () => {
    const manifest = cloneManifest();
    const component = findComponent(manifest, 'programs');
    component.blockers = [
      {
        id: 'fixture-broken-blocker',
        severity: 'invalid_value' as unknown as 'low',
        description: '',
        unblocks: 'pilot_ready',
      },
    ];
    const result = validateProductionReadinessManifest(manifest);
    const findings = findingsForRule(result, 'every_blocker_has_severity_and_description');
    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings.every((finding) => finding.componentId === 'programs')).toBe(true);
  });

  it('no_live_monitoring_claim_unless_source_says_live fires when manifest claims live monitoring but source does not', () => {
    const manifest = cloneManifest();
    const component = findComponent(manifest, 'programs');
    component.notes = ['live monitoring is enabled and reporting incidents'];
    manifest.source = 'Deterministic build manifest. Strictly file-pure.';
    const result = validateProductionReadinessManifest(manifest);
    const findings = findingsForRule(result, 'no_live_monitoring_claim_unless_source_says_live');
    expect(findings.length).toBeGreaterThan(0);
  });

  it('no_live_monitoring_claim does NOT fire when manifest.source acknowledges live or CI', () => {
    const manifest = cloneManifest();
    const component = findComponent(manifest, 'programs');
    component.notes = ['live monitoring is enabled and reporting incidents'];
    manifest.source = 'CI-attested live deployment evidence as of 2026-04-25.';
    const result = validateProductionReadinessManifest(manifest);
    const findings = findingsForRule(result, 'no_live_monitoring_claim_unless_source_says_live');
    expect(findings).toHaveLength(0);
  });

  it('overall_readiness_percent_within_planned_range fires when percent is outside planned range', () => {
    const manifest = cloneManifest();
    manifest.overallReadinessPercent = 95;
    const result = validateProductionReadinessManifest(manifest);
    const findings = findingsForRule(result, 'overall_readiness_percent_within_planned_range');
    expect(findings).toHaveLength(1);
  });

  it('maturity_snapshot_present fires when indicators array is empty', () => {
    const manifest = cloneManifest();
    (manifest.maturitySnapshot as unknown as { indicators: unknown[] }).indicators = [];
    const result = validateProductionReadinessManifest(manifest);
    const findings = findingsForRule(result, 'maturity_snapshot_present');
    expect(findings.length).toBeGreaterThan(0);
  });

  it('summarizes a failing result with all finding lines', () => {
    const manifest = cloneManifest();
    const component = findComponent(manifest, 'programs');
    (component as unknown as { nextAction: string }).nextAction = '';
    const result = validateProductionReadinessManifest(manifest);
    const summary = summarizeProductionReadinessValidation(result);
    expect(summary).toContain('FAILED');
    expect(summary).toContain('every_component_has_next_action');
  });
});

describe('production readiness validator rule coverage', () => {
  it('every rule in PRODUCTION_READINESS_VALIDATION_RULES has at least one negative test case in this file', () => {
    const testSource = readFileSync(__filename, 'utf8');
    for (const rule of PRODUCTION_READINESS_VALIDATION_RULES) {
      expect(testSource).toContain(rule);
    }
  });
});

describe('production readiness validator module hygiene', () => {
  const validatorSource = readFileSync(validatorPath, 'utf8');

  it('does not import forbidden product/runtime modules', () => {
    expect(validatorSource).not.toMatch(/from '@\/lib\/source\//);
    expect(validatorSource).not.toMatch(/from '@\/lib\/nexus\//);
    expect(validatorSource).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(validatorSource).not.toMatch(/from '@\/lib\/atlas\//);
    expect(validatorSource).not.toMatch(/from '@\/lib\/agent\//);
    expect(validatorSource).not.toMatch(/from '@\/lib\/auth\//);
    expect(validatorSource).not.toMatch(/supabase/i);
  });

  it('does not call models, external APIs, or non-deterministic clocks', () => {
    expect(validatorSource).not.toMatch(/anthropic/i);
    expect(validatorSource).not.toMatch(/openai/i);
    expect(validatorSource).not.toMatch(/\bfetch\(/);
    expect(validatorSource).not.toMatch(/Date\.now\(/);
    expect(validatorSource).not.toMatch(/Math\.random\(/);
    expect(validatorSource).not.toMatch(/new Date\(/);
  });

  it('does not use React hooks or placeholder language', () => {
    expect(validatorSource).not.toMatch(/useState/);
    expect(validatorSource).not.toMatch(/useEffect/);
    expect(validatorSource).not.toMatch(/Coming soon/);
    expect(validatorSource).not.toMatch(/TBD/);
    expect(validatorSource).not.toMatch(/Lorem ipsum/);
  });
});
