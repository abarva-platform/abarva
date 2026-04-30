import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { BuildProgressDashboard } from '@/components/admin/build-progress/BuildProgressDashboard';
import { AdminCanonShell } from '@/components/admin/AdminCanonShell';
import { buildProgressRoadmap } from '@/lib/build-progress/roadmap';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL_ALLOWLIST = new Set([
  'anand.sundaram@thesundaram.com',
]);

function AdminOnlyNotice() {
  return (
    <AdminCanonShell
      eyebrow="Platform · Build"
      title="Build Progress"
      description="Internal build-wave route to track implementation, blockers, and verification status."
      workflow={{
        primaryAgent: 'steward',
        pageQuestion: 'What build slices are complete and what blocks the next merge-safe wave?',
        whatIsKnown: 'Wave/slice manifests and deterministic progress summary are route-backed.',
        whatIsMissing: 'Live CI/Vercel telemetry is not guaranteed on this page.',
        recommendedNextAction: 'Use wave tracker to close blockers before production promotion.',
        caveat: 'Deterministic build tracker, not a live deployment monitor.',
      }}
    >
      <main style={{ padding: 40, fontFamily: 'DM Sans, sans-serif' }}>
        <h1 style={{ fontFamily: 'Georgia, serif' }}>Admin access only</h1>
        <p>Founder Build Control Tower is restricted to platform administrators.</p>
      </main>
    </AdminCanonShell>
  );
}

export default async function FounderBuildProgressPage() {
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

  return (
    <AdminCanonShell
      eyebrow="Platform · Build"
      title="Build Progress"
      description="Wave and slice execution view for deterministic build governance."
      workflow={{
        primaryAgent: 'steward',
        pageQuestion: 'Which waves are merged, blocked, or pending verification?',
        whatIsKnown: 'Build roadmap and merged status are represented in canonical docs/build manifests.',
        whatIsMissing: 'This route does not certify real-time deploy success automatically.',
        recommendedNextAction: 'Close failed checks and verify hygiene gate before merge.',
        caveat: 'Deterministic tracker surface. Manual deploy verification still required.',
      }}
    >
      <BuildProgressDashboard roadmap={buildProgressRoadmap} />
    </AdminCanonShell>
  );
}
