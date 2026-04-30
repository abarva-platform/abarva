import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { buildProductionReadinessApiResponse } from '@/lib/admin/production-readiness-loader';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ADMIN_EMAIL_ALLOWLIST = new Set([
  'anand.sundaram@thesundaram.com',
]);

const PRODUCTION_READINESS_NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
} as const;

export async function GET() {
  const allowed = await canReadProductionReadiness();
  if (!allowed) {
    return NextResponse.json(
      { error: 'forbidden', message: 'Production readiness is restricted to platform administrators.' },
      { status: 403, headers: PRODUCTION_READINESS_NO_STORE_HEADERS },
    );
  }

  return NextResponse.json(buildProductionReadinessApiResponse(new Date().toISOString()), {
    headers: PRODUCTION_READINESS_NO_STORE_HEADERS,
  });
}

async function canReadProductionReadiness(): Promise<boolean> {
  const session = await auth();
  if (!session.userId) return false;

  const user = await currentUser();
  const role = (user?.publicMetadata?.role as string | undefined) ?? '';
  const fallbackRole =
    (user?.unsafeMetadata?.role as string | undefined)
    ?? (user?.publicMetadata?.legacyRole as string | undefined);
  const primaryEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();

  return (
    role === 'admin'
    || fallbackRole === 'admin'
    || (!!primaryEmail && ADMIN_EMAIL_ALLOWLIST.has(primaryEmail))
  );
}
