import { notFound } from 'next/navigation';
import { DeliverableTierRenderer } from '@/components/deliverables/DeliverableTierRenderer';
import { buildSeedDeliverableRenderModel, findDeliverableByRoute } from '@/lib/deliverables/seed-route-resolver';

export default async function TenantDeliverableSeedPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; programSlug: string; deliverableCode: string }>;
}) {
  const { tenantSlug, programSlug, deliverableCode } = await params;
  const context = findDeliverableByRoute(tenantSlug, programSlug, deliverableCode);
  if (!context?.deliverable) notFound();

  const model = buildSeedDeliverableRenderModel({ tenant: context.tenant, program: context.program, deliverable: context.deliverable });

  return <DeliverableTierRenderer model={model} />;
}
