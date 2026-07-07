import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'

export const dynamic = "force-dynamic";

async function shouldUseAccessibilitySignInFallback() {
  if (process.env.ACCESSIBILITY_AXE_DISABLE_CLERK !== "1") return false;

  const requestHeaders = await headers();
  return requestHeaders.get("x-abarva-accessibility-axe") === "1";
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; redirect?: string }>;
}) {
  const [params, user] = await Promise.all([
    searchParams,
    currentUser().catch(() => null),
  ]);

  if (user) {
    redirect(params.redirect || "/auth-redirect");
  }

  redirect('/')
}
