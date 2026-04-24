import { notFound } from 'next/navigation';
import { DeliverableTierRenderer } from '@/components/deliverables/DeliverableTierRenderer';
import { buildSeedDeliverableRenderModel, findDeliverableByRoute } from '@/lib/deliverables/seed-route-resolver';
import { assertTenantAccess } from '@/lib/auth/tenant-access';
import { getLatestSponsorCommitment } from '@/lib/workflow/sponsorCommitmentLedger';
import { getProgramTensionRecords, getStakeholderSuccessRecords } from '@/lib/workflow/stakeholderSuccessLedger';
import { getLatestDataReadiness } from '@/lib/workflow/dataReadinessLedger';

export default async function TenantDeliverableSeedPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; programSlug: string; deliverableCode: string }>;
}) {
  const { tenantSlug, programSlug, deliverableCode } = await params;
  await assertTenantAccess(tenantSlug);
  const context = findDeliverableByRoute(tenantSlug, programSlug, deliverableCode);
  if (!context?.deliverable) notFound();

  const model = buildSeedDeliverableRenderModel({ tenant: context.tenant, program: context.program, deliverable: context.deliverable });

  // FM-03 · D01 Program Charter carries the sponsor commitment form. Fetch
  // the latest committed record server-side so the form can render either
  // the empty state or the audit-trail view without a client round-trip.
  const isCharter = model.deliverable.code === 'D01' || model.deliverable.typeKey === 'program_charter';
  const isStakeholderMap = model.deliverable.code === 'D02' || model.deliverable.typeKey === 'stakeholder_map';
  const isSuccessMetricTree = model.deliverable.code === 'D03' || model.deliverable.typeKey === 'success_metric_tree';
  const isIntakeSynthesis = model.deliverable.code === 'D04' || model.deliverable.typeKey === 'intake_synthesis';

  const existingCommitment = isCharter
    ? getLatestSponsorCommitment(model.program.code)
    : null;
  const stakeholderSuccessRecords = isStakeholderMap
    ? getStakeholderSuccessRecords(model.program.code)
    : undefined;
  const programTensionRecords = isIntakeSynthesis
    ? getProgramTensionRecords(model.program.code)
    : undefined;
  const dataReadiness = isSuccessMetricTree
    ? getLatestDataReadiness(model.program.code)
    : null;

  return (
    <DeliverableTierRenderer
      model={model}
      sponsorCommitment={existingCommitment ?? undefined}
      stakeholderSuccessRecords={stakeholderSuccessRecords}
      programTensionRecords={programTensionRecords}
      dataReadiness={dataReadiness}
    />
  );
}
