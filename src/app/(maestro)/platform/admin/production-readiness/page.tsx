import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { ProductionReadinessLivePanel } from '@/components/admin/ProductionReadinessLivePanel';
import { buildProductionReadinessApiResponse } from '@/lib/admin/production-readiness';

export const dynamic = 'force-dynamic';

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

  return <ProductionReadinessLivePanel initialResponse={buildProductionReadinessApiResponse(new Date().toISOString())} />;
}
