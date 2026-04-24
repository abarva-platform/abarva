import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { getActiveClientKey } from '@/lib/active-client';
import { CLIENT_KEY_TO_ROUTE_SLUG } from '@/lib/client-config';

export default async function TenantScopedLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ tenantSlug: string }>;
}) {
  const [{ tenantSlug }, user, activeClientKey] = await Promise.all([
    params,
    currentUser().catch(() => null),
    getActiveClientKey(),
  ]);

  const role = user?.publicMetadata?.role as string | undefined;
  const expectedSlug = CLIENT_KEY_TO_ROUTE_SLUG[activeClientKey];

  if (role !== 'admin' && role !== 'investor' && tenantSlug !== expectedSlug) {
    redirect(`/tenant/${expectedSlug}`);
  }

  return <>{children}</>;
}
