import { notFound } from 'next/navigation';
import { SeedProgramOverview } from '@/components/deliverables/SeedRouteShell';
import { findProgramByRoute } from '@/lib/deliverables/seed-route-resolver';

export default async function TenantProgramSeedPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; programSlug: string }>;
}) {
  const { tenantSlug, programSlug } = await params;
  const context = findProgramByRoute(tenantSlug, programSlug);
  if (!context) notFound();

  return <SeedProgramOverview tenant={context.tenant} program={context.program} />;
}
