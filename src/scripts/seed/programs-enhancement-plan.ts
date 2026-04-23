import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';
import { validateProgramsSeedEnhancementSpec } from '@/lib/programs/enhancement-spec';

function printText(): void {
  const plan = buildAllProgramsSeedPlan();
  const validation = validateProgramsSeedEnhancementSpec();

  console.log('Programs enhancement seed plan');
  console.log('──────────────────────────────');
  console.log(`Tenants:              ${plan.summary.tenantCount}`);
  console.log(`Programs:             ${plan.summary.programCount}`);
  console.log(`Deliverable types:    ${plan.summary.deliverableTypeCount}`);
  console.log(`Deliverables:         ${plan.summary.deliverableCount}`);
  console.log(`Non-stub deliverables:${plan.summary.nonStubDeliverableCount}`);
  console.log(`Rich / Outline / Stub:${plan.summary.richDeliverableCount} / ${plan.summary.outlineDeliverableCount} / ${plan.summary.stubDeliverableCount}`);

  console.log('\nTenant portfolios');
  for (const tenant of plan.tenants) {
    const deliverableCount = tenant.programs.reduce((sum, program) => sum + program.deliverables.length, 0);
    const richCount = tenant.programs.reduce(
      (sum, program) => sum + program.deliverables.filter((deliverable) => deliverable.renderTier === 'rich').length,
      0,
    );
    console.log(`- ${tenant.displayName} (${tenant.tenantKey}) · ${tenant.programs.length} programs · ${deliverableCount} deliverables · ${richCount} rich`);
  }

  if (validation.errors.length) {
    console.log('\nErrors');
    for (const error of validation.errors) console.log(`- ${error}`);
  }

  if (validation.warnings.length) {
    console.log('\nWarnings');
    for (const warning of validation.warnings) console.log(`- ${warning}`);
  }

  console.log('\nNext');
  console.log('- Use this dry-run output to drive the Supabase upsert writer.');
  console.log('- No database writes are performed by this command.');
}

function main(): void {
  const plan = buildAllProgramsSeedPlan();
  const validation = validateProgramsSeedEnhancementSpec();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ plan, validation }, null, 2));
    return;
  }
  printText();
}

main();
