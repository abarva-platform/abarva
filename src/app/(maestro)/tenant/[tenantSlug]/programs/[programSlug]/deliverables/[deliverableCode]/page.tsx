// PROG-P1 FREEZE — This route has unique deliverable rendering logic and
// cannot be trivially redirected to a canonical Programs path without a
// canonical deliverable detail route existing first.
// Status: frozen until PROG-P7 (cross-surface integration + legacy retirement).
// Do NOT add new feature logic here. Read-only preserve.

import { notFound } from 'next/navigation';
import { DeliverableTierRenderer } from '@/components/deliverables/DeliverableTierRenderer';
import {
  buildSeedDeliverableRenderModel,
  findDeliverableByRoute,
} from '@/lib/deliverables/seed-route-resolver';
import { assertTenantAccess } from '@/lib/auth/tenant-access';
import { requireTenancy } from '@/lib/auth/tenancy';
import { loadUserProgramAccessPolicy } from '@/lib/auth/program-access-policy';
import {
  getProgramTensionRecords,
  getStakeholderSuccessRecords,
} from '@/lib/workflow/stakeholderSuccessLedger';
import { getLatestDataReadiness } from '@/lib/workflow/dataReadinessLedger';

export default async function TenantDeliverableSeedPage({
  params,
}: {
  params: Promise<{
    tenantSlug: string;
    programSlug: string;
    deliverableCode: string;
  }>;
}) {
  const { tenantSlug, programSlug, deliverableCode } = await params;
  await assertTenantAccess(tenantSlug);
  const context = findDeliverableByRoute(
    tenantSlug,
    programSlug,
    deliverableCode,
  );
  if (!context?.deliverable) notFound();

  const model = buildSeedDeliverableRenderModel({
    tenant: context.tenant,
    program: context.program,
    deliverable: context.deliverable,
  });

  const isStakeholderMap =
    model.deliverable.code === 'D02' ||
    model.deliverable.typeKey === 'stakeholder_map';
  const isSuccessMetricTree =
    model.deliverable.code === 'D03' ||
    model.deliverable.typeKey === 'success_metric_tree';
  const isIntakeSynthesis =
    model.deliverable.code === 'D04' ||
    model.deliverable.typeKey === 'intake_synthesis';

  const stakeholderSuccessRecords = isStakeholderMap
    ? getStakeholderSuccessRecords(model.program.code)
    : undefined;
  const programTensionRecords = isIntakeSynthesis
    ? getProgramTensionRecords(model.program.code)
    : undefined;
  const dataReadiness = isSuccessMetricTree
    ? getLatestDataReadiness(model.program.code)
    : null;

  // Mirror the same server-computed approval capability enforced by POST.
  const tenantContext = await requireTenancy().catch(() => null);
  const accessPolicy = tenantContext
    ? await loadUserProgramAccessPolicy(tenantContext).catch(() => null)
    : null;
  const canApprove = accessPolicy?.canApproveGates === true;
  const approveGateReason = !canApprove
    ? 'Approval is limited to workspace users with explicit approval permission. Sponsor status alone is not approval authority.'
    : undefined;

  return (
    <DeliverableTierRenderer
      model={model}
      stakeholderSuccessRecords={stakeholderSuccessRecords}
      programTensionRecords={programTensionRecords}
      dataReadiness={dataReadiness}
      canApprove={canApprove}
      approveGateReason={approveGateReason}
    />
  );
}
