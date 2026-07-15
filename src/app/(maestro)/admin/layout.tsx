// ADMIN8 — /admin layout
// Auth gate (Clerk admin allowlist) for ALL /admin/* routes.
// Lifted from ADMIN5's page-level pattern in
// src/app/(maestro)/platform/admin/production-readiness/page.tsx so every
// /admin sub-route enforces the same admin-only contract uniformly.
//
// Allowlist values are the SAME as the legacy ADMIN5 page-level set —
// no expansion, no shrinkage. If/when the allowlist source moves to a
// shared module this layout should import from there.
import type { ReactNode } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connection } from "next/server";

import { AdminCanonShellV2 } from "@/components/admin/AdminCanonShellV2";
import { EditorialCanvas } from "@/components/admin/EditorialCanvas";
import { AgentRail } from "@/components/admin/AgentRail";
import { CANONICAL_CLIENT_ADMIN_EMAILS } from "@/lib/auth/canonical-auth-roster";
import { hasTenantAdminAccess } from "@/lib/admin/tenant-admin-access";

const ADMIN_EMAIL_ALLOWLIST: ReadonlySet<string> = new Set([
  "anand.sundaram@thesundaram.com",
  // The three locked demo accounts are the only non-founder identities allowed
  // into Setup during demo walks. They remain tenant-pinned by clientId.
  "demo-apexretail+clerk_test@abarva.com",
  "demo-meridian+clerk_test@abarva.com",
  "demo-firstcapital+clerk_test@abarva.com",
  ...CANONICAL_CLIENT_ADMIN_EMAILS,
]);

export const dynamic = "force-dynamic";
export const revalidate = 0;

function AdminAccessDenied() {
  return (
    <AdminCanonShellV2
      tenantName="AbarVa Admin"
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
        subtitle="The Admin workspace control plane is restricted to platform administrators. Return to your tenant home or request admin access from the Steward."
      >
        <div />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await connection();
  const session = await auth();
  if (!session.userId) {
    return <AdminAccessDenied />;
  }

  const claims = session.sessionClaims as
    | {
        publicMetadata?: {
          role?: string;
          legacyRole?: string;
        };
        email?: string;
        emailAddress?: string;
        email_addresses?: Array<{ emailAddress?: string }>;
        emailAddresses?: Array<{ emailAddress?: string }>;
      }
    | undefined;
  const user = await currentUser().catch(() => null);
  const role =
    (claims?.publicMetadata?.role as string | undefined) ??
    (user?.publicMetadata?.role as string | undefined) ??
    "";
  const fallbackRole =
    (claims?.publicMetadata?.legacyRole as string | undefined) ??
    (user?.unsafeMetadata?.role as string | undefined) ??
    (user?.publicMetadata?.legacyRole as string | undefined);
  const primaryEmail = (
    claims?.emailAddress ??
    claims?.email ??
    claims?.emailAddresses?.[0]?.emailAddress ??
    claims?.email_addresses?.[0]?.emailAddress ??
    user?.primaryEmailAddress?.emailAddress
  )?.toLowerCase();
  const isPlatformAdmin =
    role === "admin" ||
    fallbackRole === "admin" ||
    (!!primaryEmail && ADMIN_EMAIL_ALLOWLIST.has(primaryEmail));

  if (!isPlatformAdmin && !(await hasTenantAdminAccess())) {
    return <AdminAccessDenied />;
  }

  return <>{children}</>;
}
