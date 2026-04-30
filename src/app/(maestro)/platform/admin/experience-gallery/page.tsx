// LEGACY · being migrated to /admin/experience-gallery in a follow-up wave (post-wave-admin-completion).
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AdminCanonShell } from '@/components/admin/AdminCanonShell';
import { ExperienceGallery } from '@/components/admin/ExperienceGallery';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL_ALLOWLIST = new Set([
  'anand.sundaram@thesundaram.com',
]);

function AdminOnlyNotice() {
  return (
    <AdminCanonShell
      eyebrow="Platform · Design"
      title="Experience Gallery"
      description="Internal visual reference route for approved AbarVa design canon."
      workflow={{
        primaryAgent: 'steward',
        pageQuestion: 'Are visual standards aligned before implementation work continues?',
        whatIsKnown: 'Design canon and static gallery references are route-backed.',
        whatIsMissing: 'This route does not validate live workflow behavior.',
        recommendedNextAction: 'Review gallery standards before approving UI-heavy slices.',
        caveat: 'Static internal design showcase; no runtime workflow execution.',
      }}
    >
      <main style={{ padding: 40, fontFamily: 'DM Sans, sans-serif' }}>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', letterSpacing: 0 }}>Admin access only</h1>
        <p>Experience Gallery is restricted to platform administrators.</p>
      </main>
    </AdminCanonShell>
  );
}

export default async function ExperienceGalleryPage() {
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
      eyebrow="Platform · Design"
      title="Experience Gallery"
      description="Internal AbarVa visual gallery for brand, tokens, archetypes, journeys, agent patterns, and Source workflow references."
      workflow={{
        primaryAgent: 'steward',
        pageQuestion: 'Does the current UI direction stay aligned to approved visual canon?',
        whatIsKnown: 'Gallery sections map directly to experience-system references and Source flow direction.',
        whatIsMissing: 'No live workflow execution or runtime readiness claims are made in this surface.',
        recommendedNextAction: 'Use this gallery during design reviews before merging visual slices.',
        caveat: 'Static deterministic showcase route for internal review.',
      }}
    >
      <ExperienceGallery />
    </AdminCanonShell>
  );
}
