import { notFound } from 'next/navigation';
import { ProgramCanonicalDetail } from '@/components/programs/ProgramCanonicalDetail';
import { ProgramCanonShell } from '@/components/programs/ProgramCanonShell';
import { findProgramByRoute } from '@/lib/deliverables/seed-route-resolver';
import { assertTenantAccess } from '@/lib/auth/tenant-access';

export default async function TenantProgramCanonicalPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; programSlug: string }>;
}) {
  const { tenantSlug, programSlug } = await params;
  await assertTenantAccess(tenantSlug);
  const context = findProgramByRoute(tenantSlug, programSlug);
  if (!context) notFound();

  return (
    <ProgramCanonShell
      title={`${context.program.code} · ${context.program.name}`}
      summary="Flagship program workspace showing journey state, gate posture, deliverables/evidence readiness, and cross-agent mission guidance."
    >
      <ProgramCanonicalDetail tenant={context.tenant} program={context.program} />
    </ProgramCanonShell>
  );
}
