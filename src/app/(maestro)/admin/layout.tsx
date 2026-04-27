// ADMIN8 — /admin layout
// Auth gate (Clerk admin allowlist) for ALL /admin/* routes.
// Lifted from ADMIN5's page-level pattern in
// src/app/(maestro)/platform/admin/production-readiness/page.tsx so every
// /admin sub-route enforces the same admin-only contract uniformly.
//
// Allowlist values are the SAME as the legacy ADMIN5 page-level set —
// no expansion, no shrinkage. If/when the allowlist source moves to a
// shared module this layout should import from there.
import type { ReactNode } from 'react';
import { auth, currentUser } from '@clerk/nextjs/server';
import { connection } from 'next/server';

import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';

const ADMIN_EMAIL_ALLOWLIST: ReadonlySet<string> = new Set([
  'anand+clerk_test@abarva.com',
  'anand.sundaram@thesundaram.com',
]);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function AdminAccessDenied() {
  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Return home"
          primaryActionHref="/"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Restricted area"
        title="Admin access only"
        subtitle="The Setup / Admin control plane is restricted to platform administrators. Return to your tenant home or request admin access from the Steward."
      >
        <div />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await connection();
  const session = await auth();
  if (!session.userId) {
    return <AdminAccessDenied />;
  }

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

  if (!isAdmin) {
    return <AdminAccessDenied />;
  }

  return <>{children}</>;
}
