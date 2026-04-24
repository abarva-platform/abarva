import { notFound } from 'next/navigation';
import { SeedPhaseOverview } from '@/components/deliverables/SeedRouteShell';
import { findProgramByRoute } from '@/lib/deliverables/seed-route-resolver';
import type { SpecPhaseNumber } from '@/lib/programs/enhancement-spec';
import { assertTenantAccess } from '@/lib/auth/tenant-access';

export default async function TenantProgramPhaseSeedPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; programSlug: string; phaseNum: string }>;
}) {
  const { tenantSlug, programSlug, phaseNum } = await params;
  const phase = Number(phaseNum);
  if (!isSpecPhase(phase)) notFound();

  await assertTenantAccess(tenantSlug);
  const context = findProgramByRoute(tenantSlug, programSlug);
  if (!context) notFound();

  return <SeedPhaseOverview tenant={context.tenant} program={context.program} phase={phase} />;
}

function isSpecPhase(value: number): value is SpecPhaseNumber {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}
