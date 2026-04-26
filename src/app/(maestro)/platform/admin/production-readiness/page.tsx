import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { ProductionReadinessDecisionFlow } from '@/components/admin/ProductionReadinessDecisionFlow';
import { ProductionReadinessLivePanel } from '@/components/admin/ProductionReadinessLivePanel';
import { ProductionReadinessTracker } from '@/components/admin/ProductionReadinessTracker';
import {
  buildProductionReadinessApiResponse,
  buildProductionReadinessView,
} from '@/lib/admin/production-readiness';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ADMIN_EMAIL_ALLOWLIST = new Set([
  'anand+clerk_test@abarva.com',
  'anand.sundaram@thesundaram.com',
]);

function AdminOnlyNotice() {
  return (
    <main style={{ padding: 40, fontFamily: 'DM Sans, sans-serif' }}>
      <h1 style={{ fontFamily: 'DM Sans, sans-serif', letterSpacing: 0 }}>
        Admin access only
      </h1>
      <p>Production Readiness Tracker is restricted to platform administrators.</p>
    </main>
  );
}

export default async function ProductionReadinessPage() {
  await connection();

  const session = await auth();
  if (!session.userId) redirect('/sign-in');

  const user = await currentUser();
  const role = (user?.publicMetadata?.role as string | undefined) ?? '';
  const fallbackRole =
    (user?.unsafeMetadata?.role as string | undefined)
    ?? (user?.publicMetadata?.legacyRole as string | undefined);
  const primaryEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const isAdmin =
    role === 'admin'
    || fallbackRole === 'admin'
    || (!!primaryEmail && ADMIN_EMAIL_ALLOWLIST.has(primaryEmail));

  if (!isAdmin) return <AdminOnlyNotice />;

  // PROD8 (wave-17): mount the decision-flow refresh above the existing
  // tracker / live panel. The decision flow is the calm summary; the live
  // panel keeps the existing dimension grid + segment summaries below it.
  // ProductionReadinessTracker is intentionally imported here so this page
  // continues to declare its dependency on the canonical tracker surface
  // even though the live panel mounts it internally.
  void ProductionReadinessTracker;
  void buildProductionReadinessView;

  const initialResponse = buildProductionReadinessApiResponse(new Date().toISOString());

  return (
    <>
      <ProductionReadinessDecisionFlow />
      <ProductionReadinessLivePanel initialResponse={initialResponse} />
    </>
  );
}
