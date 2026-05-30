import {
  buildAllProgramsSeedPlan,
  buildDeliverableTypeSeedSpecs,
  deliverableTypeKeyFor,
  graphNodeIdForProgram,
} from '@/lib/programs/enhancement-seed-planner';
import { TENANT_PORTFOLIOS, getDeliverableDefinition } from '@/lib/programs/enhancement-spec';

describe('Programs enhancement seed planner', () => {
  it('creates canonical deliverable type seed specs for all 28 deliverables', () => {
    const specs = buildDeliverableTypeSeedSpecs();

    expect(specs).toHaveLength(28);
    expect(specs[0]).toMatchObject({
      typeKey: 'd01_program_charter',
      code: 'D01',
      slug: 'd01-program-charter',
      title: 'Program Charter',
      applicableSpecPhases: [1],
      applicableAppPhases: [0],
      outputFormat: 'markdown',
      maturity: 'pilot',
    });
    expect(deliverableTypeKeyFor(getDeliverableDefinition('D17'))).toBe('d17_decision_memo_for_cxo');
  });

  it('uses stable graph ids and tenant-scoped route paths for program seeds', () => {
    const apex = TENANT_PORTFOLIOS.find((portfolio) => portfolio.tenantKey === 'apexretail')!;
    const morrison = apex.programs.find((program) => program.code === 'APX-01')!;

    expect(graphNodeIdForProgram(apex, morrison)).toBe('eng_apexretail_morrison_owned_brand_margin_recovery');

    const plan = buildAllProgramsSeedPlan();
    const morrisonPlan = plan.programs.find((program) => program.code === 'APX-01')!;

    expect(morrisonPlan).toMatchObject({
      tenantKey: 'apexretail',
      graphNodeId: 'eng_apexretail_morrison_owned_brand_margin_recovery',
      routePath: '/tenant/apex-retail/programs/morrison-owned-brand-margin-recovery',
      appArchetype: 'operational_optimization',
      currentPhaseSpec: 4,
      currentAppPhase: 3,
      status: 'active',
    });
  });

  it('emits the expected full seed plan scale', () => {
    const plan = buildAllProgramsSeedPlan();

    expect(plan.summary).toEqual({
      tenantCount: 5,
      programCount: 15,
      deliverableTypeCount: 28,
      deliverableCount: 363,
      nonStubDeliverableCount: 217,
      richDeliverableCount: 44,
      outlineDeliverableCount: 173,
      stubDeliverableCount: 146,
    });
  });

  it('keeps Northstar and SkyHarbor route stubs in the tenant plan without fabricating programs', () => {
    const plan = buildAllProgramsSeedPlan();

    expect(plan.tenants.find((tenant) => tenant.routeSlug === 'northstar-clinical')).toMatchObject({
      tenantKey: 'northstar',
      displayName: 'Northstar Clinical Technologies',
      programs: [],
    });
    expect(plan.tenants.find((tenant) => tenant.routeSlug === 'skyharbor-air')).toMatchObject({
      tenantKey: 'skyharbor',
      displayName: 'SkyHarbor Air',
      programs: [],
    });
  });

  it('keeps Morrison rich through current phase and explicit scheduled stubs after it', () => {
    const plan = buildAllProgramsSeedPlan();
    const morrison = plan.programs.find((program) => program.code === 'APX-01')!;

    const richRoutes = morrison.deliverables
      .filter((deliverable) => deliverable.renderTier === 'rich')
      .map((deliverable) => deliverable.routePath);
    expect(richRoutes).toContain('/tenant/apex-retail/programs/morrison-owned-brand-margin-recovery/deliverables/d12-estimation-roadmap');
    expect(richRoutes).toContain('/tenant/apex-retail/programs/morrison-owned-brand-margin-recovery/deliverables/d17-decision-memo-for-cxo');

    const scheduled = morrison.deliverables.filter((deliverable) => deliverable.lifecycleState === 'scheduled');
    expect(scheduled.map((deliverable) => deliverable.deliverableCode)).toEqual(['D24', 'D25', 'D26', 'D27', 'D28']);
    expect(scheduled.every((deliverable) => deliverable.structuredData.activationCriteria)).toBe(true);
  });

  it('honors the Demand Forecasting D13 one-off even though OO does not normally require architecture', () => {
    const plan = buildAllProgramsSeedPlan();
    const demandForecasting = plan.programs.find((program) => program.code === 'APX-02')!;
    const d13 = demandForecasting.deliverables.find((deliverable) => deliverable.deliverableCode === 'D13');

    expect(d13).toMatchObject({
      requirement: 'additional',
      renderTier: 'rich',
      phaseSpec: 3,
      phaseApp: 2,
      deliverableTypeKey: 'd13_target_state_architecture',
    });
  });
});
