import {
  allSeedDeliverablePaths,
  buildSeedDeliverableRenderModel,
  findDeliverableByRoute,
  getSeedPlan,
} from '@/lib/deliverables/seed-route-resolver';

describe('Deliverable render contract', () => {
  it('emits canonical seed deliverable URLs without legacy phase folders', () => {
    const paths = allSeedDeliverablePaths();

    expect(paths).toHaveLength(457);
    expect(paths.every((path) => !path.includes('/deliverables/phase-'))).toBe(true);
    expect(paths).toContain('/tenant/apex-retail/programs/morrison-owned-brand-margin-recovery/deliverables/d17-decision-memo-for-cxo');
  });

  it('builds a rich Morrison render model with all mandatory cross-link classes', () => {
    const context = findDeliverableByRoute('apex-retail', 'morrison-owned-brand-margin-recovery', 'd17-decision-memo-for-cxo');
    expect(context?.deliverable?.renderTier).toBe('rich');

    const model = buildSeedDeliverableRenderModel({
      tenant: context!.tenant,
      program: context!.program,
      deliverable: context!.deliverable!,
    });

    expect(model.deliverable.tier).toBe('rich');
    expect(model.sections.length).toBeGreaterThanOrEqual(3);
    expect(model.table.rows.length).toBeGreaterThanOrEqual(4);
    expect(model.kpis).toHaveLength(4);

    const classes = new Set(model.crossLinks.map((link) => link.className));
    for (const requiredClass of [
      'breadcrumb',
      'previous_next',
      'phase_summary',
      'program_overview',
      'related_deliverable',
      'source_pattern',
      'cross_program_analogue',
      'evidence',
    ] as const) {
      expect(classes.has(requiredClass)).toBe(true);
    }
  });

  it('builds a scheduled D25 stub without inventing future conclusions', () => {
    const context = findDeliverableByRoute('apex-retail', 'morrison-owned-brand-margin-recovery', 'd25-outcome-attestation-report');
    expect(context?.deliverable?.renderTier).toBe('stub');

    const model = buildSeedDeliverableRenderModel({
      tenant: context!.tenant,
      program: context!.program,
      deliverable: context!.deliverable!,
    });

    expect(model.deliverable.lifecycleState).toBe('scheduled');
    expect(model.triggerConditions.length).toBeGreaterThanOrEqual(3);
    expect(model.structurePreview.length).toBeGreaterThanOrEqual(6);
    expect(model.summary).toContain('will not state conclusions');
  });

  it('keeps every generated cross-link inside a route class we can audit', () => {
    const plan = getSeedPlan();
    const sample = plan.deliverables.filter((deliverable) => deliverable.programCode === 'APX-01').slice(0, 8);
    const allowedClasses = new Set([
      'breadcrumb',
      'previous_next',
      'phase_summary',
      'program_overview',
      'related_deliverable',
      'source_pattern',
      'cross_program_analogue',
      'evidence',
    ]);

    for (const deliverable of sample) {
      const segment = deliverable.routePath.split('/').pop()!;
      const context = findDeliverableByRoute('apex-retail', 'morrison-owned-brand-margin-recovery', segment);
      const model = buildSeedDeliverableRenderModel({
        tenant: context!.tenant,
        program: context!.program,
        deliverable: context!.deliverable!,
      });
      expect(model.crossLinks.every((link) => allowedClasses.has(link.className))).toBe(true);
      expect(model.crossLinks.every((link) => link.href.length > 0 && !link.href.includes('abarva.local'))).toBe(true);
    }
  });
});
