import { readFileSync } from 'fs';
import { join } from 'path';
import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';

const EXPECTED_PROGRAMS = [
  {
    tenantKey: 'apexretail',
    routeSlug: 'apex-retail',
    programs: [
      ['APX-01', 'morrison-owned-brand-margin-recovery', 4, 'active'],
      ['APX-02', 'demand-forecasting-modernization', 3, 'active'],
      ['APX-03', 'store-labor-optimization', 5, 'completed'],
      ['APX-04', 'digital-assortment-copilot', 2, 'active'],
      ['APX-05', 'supply-chain-control-tower', 1, 'active'],
      ['APX-06', 'returns-fraud-detection', 4, 'active'],
    ],
  },
  {
    tenantKey: 'meridian',
    routeSlug: 'meridian-health',
    programs: [
      ['MRD-01', 'ambient-clinical-value-chain-activation', 3, 'active'],
      ['MRD-02', 'prior-authorization-automation', 4, 'active'],
      ['MRD-03', 'clinical-documentation-ai-governance', 1, 'active'],
      ['MRD-04', 'revenue-cycle-ai-tool-rationalization', 2, 'active'],
      ['MRD-05', 'readmission-risk-model-refresh', 5, 'completed'],
    ],
  },
  {
    tenantKey: 'arcturus',
    routeSlug: 'first-capital-financial',
    programs: [
      ['FCF-01', 'fraud-detection-modernization', 3, 'active'],
      ['FCF-02', 'customer-onboarding-kyc-ai', 4, 'active'],
      ['FCF-03', 'wealth-advisor-copilot', 2, 'active'],
      ['FCF-04', 'commercial-lending-data-platform', 1, 'active'],
    ],
  },
  {
    tenantKey: 'keystone',
    routeSlug: 'keystone-energy',
    programs: [
      ['KST-01', 'commodity-trading-ai-modernization', 3, 'active'],
      ['KST-02', 'predictive-maintenance-modernization', 4, 'active'],
      ['KST-03', 'ot-it-data-platform-convergence', 2, 'active'],
      ['KST-04', 'regulatory-reporting-ai', 5, 'completed'],
    ],
  },
] as const;

describe('Programs catalog lock · seeded portfolio shape', () => {
  const plan = buildAllProgramsSeedPlan();

  it('locks the portfolio summary counts', () => {
    expect(plan.summary).toEqual({
      tenantCount: 4,
      programCount: 19,
      deliverableTypeCount: 28,
      deliverableCount: 457,
      nonStubDeliverableCount: 283,
      richDeliverableCount: 44,
      outlineDeliverableCount: 239,
      stubDeliverableCount: 174,
    });
  });

  it('locks tenant ordering and route slugs', () => {
    expect(plan.tenants.map((tenant) => tenant.tenantKey)).toEqual([
      'apexretail',
      'meridian',
      'arcturus',
      'keystone',
    ]);
    expect(plan.tenants.map((tenant) => tenant.routeSlug)).toEqual([
      'apex-retail',
      'meridian-health',
      'first-capital-financial',
      'keystone-energy',
    ]);
  });

  it('locks program code, slug, phase, and status per tenant', () => {
    for (const expectedTenant of EXPECTED_PROGRAMS) {
      const tenant = plan.tenants.find((entry) => entry.tenantKey === expectedTenant.tenantKey);
      expect(tenant).toBeDefined();
      expect(tenant!.routeSlug).toBe(expectedTenant.routeSlug);
      expect(
        tenant!.programs.map((program) => [
          program.code,
          program.programSlug,
          program.currentPhaseSpec,
          program.status,
        ]),
      ).toEqual(expectedTenant.programs);
    }
  });

  it('keeps every program route under its tenant route family', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        expect(program.routePath).toBe(
          `/tenant/${tenant.routeSlug}/programs/${program.programSlug}`,
        );
      }
    }
  });

  it('keeps every deliverable route under its parent program route', () => {
    for (const program of plan.programs) {
      for (const deliverable of program.deliverables) {
        expect(deliverable.routePath.startsWith(`${program.routePath}/deliverables/`)).toBe(true);
      }
    }
  });

  it('has no duplicate program identities or deliverable identities', () => {
    expectUnique(plan.programs.map((program) => program.code), 'program code');
    expectUnique(plan.programs.map((program) => program.programSlug), 'program slug');
    expectUnique(plan.programs.map((program) => program.graphNodeId), 'graph node id');
    expectUnique(
      plan.deliverables.map((deliverable) => deliverable.instanceKey),
      'deliverable instance key',
    );
  });
});

describe('Programs catalog lock · deterministic test hygiene', () => {
  const source = readFileSync(
    join(process.cwd(), 'src/lib/programs/enhancement-seed-planner.ts'),
    'utf8',
  );

  it('the seed planner does not depend on clocks, random values, fetch, or model SDK labels', () => {
    expect(source).not.toMatch(/Date\.now|Math\.random|new Date|\bfetch\(/);
    expect(source).not.toMatch(/anthropic|openai|claude/i);
  });

  it('does not lock fabricated evidence citation ids', () => {
    expect(source).not.toMatch(/\bE-\d{3}\b/);
  });
});

function expectUnique(values: readonly string[], label: string) {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  expect(duplicates).toEqual([]);
  expect(new Set(values).size).toBe(values.length);
  expect(label.length).toBeGreaterThan(0);
}
