import { auth, currentUser } from "@clerk/nextjs/server";

import { CANONICAL_CLIENT_ADMIN_EMAILS } from "@/lib/auth/canonical-auth-roster";

// Extracted from src/app/(maestro)/home/v4-preview/page.tsx so the exact
// same gate is shared by every server-side surface that needs it (the page
// itself, and any API route it POSTs to) -- a route reusing hand-copied
// auth logic instead of this function is exactly the drift that caused the
// P0 cross-tenant exposure on this same page (see
// 2026-07-24-home-v4-preview-route.md's post-merge correction).
const ADMIN_EMAIL_ALLOWLIST: ReadonlySet<string> = new Set([
  "anand.sundaram@thesundaram.com",
  ...CANONICAL_CLIENT_ADMIN_EMAILS,
]);

export async function isPlatformAdminSession(): Promise<boolean> {
  const session = await auth();
  if (!session.userId) return false;

  const claims = session.sessionClaims as
    | {
        publicMetadata?: { role?: string };
        email?: string;
        emailAddress?: string;
        email_addresses?: Array<{ emailAddress?: string }>;
        emailAddresses?: Array<{ emailAddress?: string }>;
      }
    | undefined;
  const user = await currentUser().catch(() => null);

  const role = (claims?.publicMetadata?.role as string | undefined) ?? (user?.publicMetadata?.role as string | undefined) ?? "";
  const primaryEmail = (
    claims?.emailAddress ??
    claims?.email ??
    claims?.emailAddresses?.[0]?.emailAddress ??
    claims?.email_addresses?.[0]?.emailAddress ??
    user?.primaryEmailAddress?.emailAddress
  )?.toLowerCase();

  return role === "admin" || (!!primaryEmail && ADMIN_EMAIL_ALLOWLIST.has(primaryEmail));
}

export async function requirePlatformAdminEmail(): Promise<string | null> {
  const session = await auth();
  if (!session.userId) return null;
  const user = await currentUser().catch(() => null);
  return (
    user?.primaryEmailAddress?.emailAddress ??
    (session.sessionClaims as { email?: string } | undefined)?.email ??
    null
  );
}
