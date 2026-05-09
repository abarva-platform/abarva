// /home · tenant home page · masthead + sidebar + 5 numbered sections.
//
// Locked design from docs/training/setup-home-{apex,firstcap,meridian}.html.
// Resolves the active client and renders the matching tenant fixture
// (Meridian / Apex / FirstCap) at full wireframe fidelity.
//
// Top bar: AppTopBarBlack is now the canonical /home top bar (founder
// approved 2026-05-08 after live preview review). The legacy
// AppTopBar and the C/D preview variants remain importable for any
// surface that still uses them but are no longer wired here.

import type { Metadata } from 'next';
import { AppTopBarBlack } from '@/components/shell/AppTopBarBlack';
import { TenantHomePage } from '@/components/home/TenantHomePage';
import { resolveTenantHome } from '@/components/home/tenant-home-fixtures';
import { getActiveClientRow } from '@/lib/active-client';

export const metadata: Metadata = { title: 'Home · AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const activeClient = await getActiveClientRow().catch(() => null);
  const data = resolveTenantHome(activeClient?.key);
  return (
    <>
      <AppTopBarBlack tenantName={data.title} />
      <TenantHomePage data={data} />
    </>
  );
}
