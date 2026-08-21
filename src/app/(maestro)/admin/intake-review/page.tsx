import { AdminCanonShellV2 } from "@/components/admin/AdminCanonShellV2";
import { IntakeReviewQueue } from "@/components/admin/intake-review/IntakeReviewQueue";
import { resolveAdminTenant } from "@/lib/admin/admin-tenant";
import { buildReviewQueue } from "@/lib/enterprise-data/intake/review-read-model";

export const metadata = { title: "Intake Review | AbarVa Admin" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * The operator surface for reviewing enrichment proposals.
 *
 * Reads empty today: no enrichment run has been executed for any tenant, and the page says so in
 * those words rather than rendering an encouraging empty state that implies review is complete.
 * The persistence layer that will feed it is the next change; wiring an approval button to nothing
 * would be worse than a disabled one, because a control that appears to work is a control someone
 * believes.
 */
export default async function IntakeReviewPage() {
  const tenant = await resolveAdminTenant();

  const queue = buildReviewQueue({
    tenantKey: tenant.tenantSlug,
    enrichmentRunId: "none",
    proposals: [],
    recordedRows: new Map(),
  });

  return (
    <AdminCanonShellV2 tenantName={tenant.tenantName}>
      <IntakeReviewQueue queue={queue} tenantName={tenant.tenantName} />
    </AdminCanonShellV2>
  );
}
