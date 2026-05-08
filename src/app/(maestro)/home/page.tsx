// /home · tenant home page · masthead + sidebar + 5 numbered sections.
//
// Locked design from docs/training/setup-home-{apex,firstcap,meridian}.html.
// Resolves the active client and renders the matching tenant fixture
// (Meridian / Apex / FirstCap) at full wireframe fidelity.

import type { Metadata } from 'next';
import { TenantHomePage } from '@/components/home/TenantHomePage';
import { resolveTenantHome } from '@/components/home/tenant-home-fixtures';
import { getActiveClientRow } from '@/lib/active-client';

export const metadata: Metadata = { title: 'Home · AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const activeClient = await getActiveClientRow().catch(() => null);
  const data = resolveTenantHome(activeClient?.key);
  return <TenantHomePage data={data} />;
}
