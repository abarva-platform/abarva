import { notFound } from 'next/navigation';
import { DeliverableTierRenderer } from '@/components/deliverables/DeliverableTierRenderer';
import { buildSeedDeliverableRenderModel, findDeliverableByRoute } from '@/lib/deliverables/seed-route-resolver';
import { assertTenantAccess } from '@/lib/auth/tenant-access';
import { getCurrentUser } from '@/lib/auth/current-user';
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

  // §4.11 permission gating · maestros approve anywhere; tenant-scoped
  // viewers approve their own tenant's deliverables; anyone else sees
  // the read-only view. Server-side POST still enforces tenant access
  // (C2-07) — UI gate is defense-in-depth + honest affordance.
  const viewer = await getCurrentUser();
  const canApprove =
    viewer?.primaryRole === 'maestro' ||
    viewer?.accessibleClients.some((c) => c.clientId === context.tenant.tenantKey) ||
    viewer?.metadataClientKey === context.tenant.tenantKey;
  const approveGateReason = !canApprove
    ? `Approval authority on ${context.tenant.displayName} deliverables belongs to members of that tenant.`
    : undefined;

  return (
    <DeliverableTierRenderer
      model={model}
      sponsorCommitment={existingCommitment ?? undefined}
      stakeholderSuccessRecords={stakeholderSuccessRecords}
      programTensionRecords={programTensionRecords}
      dataReadiness={dataReadiness}
      canApprove={canApprove}
      approveGateReason={approveGateReason}
    />
  );
}
