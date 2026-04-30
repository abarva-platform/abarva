import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';
import { TENANT_PORTFOLIOS } from '@/lib/programs/enhancement-spec';
import {
  buildDeliverableTypePayload,
  buildDeliverableVersionPayload,
  buildProgramPayload,
  buildSeedClientPayload,
  clientAliasesForPortfolio,
  filterProgramsSeedPlan,
} from '@/lib/programs/enhancement-seed-writer';

describe('Programs enhancement seed writer helpers', () => {
  it('filters the plan without stubs for targeted dry runs', () => {
    const filtered = filterProgramsSeedPlan(buildAllProgramsSeedPlan(), {
      tenantKeys: ['apexretail'],
      programCodes: ['APX-01'],
      includeStubs: false,
    });

    expect(filtered.summary).toMatchObject({
      tenants: 1,
      clients: 1,
      programs: 1,
      deliverables: 20,
      deliverableVersions: 20,
      richDeliverables: 19,
      outlineDeliverables: 1,
      stubDeliverables: 0,
    });
  });

  it('keeps Apex aliases while inserting the canonical display name if missing', () => {
    const apex = TENANT_PORTFOLIOS.find((portfolio) => portfolio.tenantKey === 'apexretail')!;

    expect(clientAliasesForPortfolio(apex)).toEqual([
      'Apex Retail Group',
      'Apex Retail',
    ]);
    expect(buildSeedClientPayload(apex)).toMatchObject({
      name: 'Apex Retail Group',
      industry_code: 'RETAIL',
    });
  });

  it('builds program payloads that stay client-scoped and demo-marked', () => {
    const plan = buildAllProgramsSeedPlan();
    const tenant = plan.tenants.find((entry) => entry.tenantKey === 'meridian')!;
    const program = tenant.programs.find((entry) => entry.code === 'MRD-01')!;
    const payload = buildProgramPayload(tenant, program, 'client-uuid', '2026-04-22T00:00:00.000Z');

    expect(payload).toMatchObject({
      graph_node_id: 'eng_meridian_ambient_clinical_value_chain_activation',
      client_id: 'client-uuid',
      name: 'Ambient Clinical Value Chain Activation',
      industry_code: 'HEALTHCARE_IDN',
      function_code: 'FRONT_OFFICE',
      current_phase: 2,
      program_archetype: 'ai_product_enablement',
      origin_source: 'intelligence_promoted',
      is_demo_data: true,
    });
    expect(payload.baseline_metrics).toMatchObject({
      deliverableCounts: {
        total: 24,
        rich: 14,
        outline: 1,
        stub: 9,
      },
    });
  });

  it('creates client-safe deliverable type and version payloads', () => {
    const plan = buildAllProgramsSeedPlan();
    const seedType = plan.deliverableTypes.find((entry) => entry.code === 'D01')!;
    const typePayload = buildDeliverableTypePayload(seedType);

    expect(typePayload).toMatchObject({
      type_key: 'd01_program_charter',
      title: 'Program Charter',
      output_format: 'markdown',
      maturity: 'pilot',
    });
    expect(typePayload.generation_prompt_template).toContain('Do not expose implementation metadata');

    const tenant = plan.tenants.find((entry) => entry.tenantKey === 'apexretail')!;
    const program = tenant.programs.find((entry) => entry.code === 'APX-01')!;
    const deliverable = program.deliverables.find((entry) => entry.deliverableCode === 'D01')!;
    const versionPayload = buildDeliverableVersionPayload(tenant, program, deliverable, 'deliverable-uuid');

    expect(versionPayload.content).toContain('Morrison Owned Brand Margin Recovery');
    expect(versionPayload.content).not.toContain('<gate_approval>');
    expect(versionPayload.structured_data).toMatchObject({
      deliverableCode: 'D01',
      fidelityTier: 'rich',
      clientDisplayName: 'Apex Retail Group',
    });
    expect(versionPayload.quality_score).toMatchObject({
      total_score: 84,
      seedQuality: 0.84,
      fidelityTier: 'rich',
      unresolvedGaps: 1,
    });
    expect(versionPayload.quality_issues).toMatchObject({
      total_score: 84,
      critical: [],
      remaining: [],
    });
  });
});
