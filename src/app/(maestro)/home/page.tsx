// /home · tenant home page · masthead + sidebar + 5 numbered sections.
//
// Locked design from docs/training/setup-home-{apex,firstcap,meridian}.html.
// Resolves the active client and renders the matching tenant fixture
// (Meridian / Apex / FirstCap) at full wireframe fidelity.
//
// Top bar variant gating (preview-only, 2026-05-08):
//   /home               → AppTopBar  (current default, unchanged)
//   /home?topbar=B      → AppTopBarBlack       (Option B)
//   /home?topbar=C      → AppTopBarEditorial   (Option C)
//   /home?topbar=D      → AppTopBarTwoBar      (Option D)

import type { Metadata } from 'next';
import { AppTopBar } from '@/components/shell/AppTopBar';
import { AppTopBarBlack } from '@/components/shell/AppTopBarBlack';
import { AppTopBarEditorial } from '@/components/shell/AppTopBarEditorial';
import { AppTopBarTwoBar } from '@/components/shell/AppTopBarTwoBar';
import { TenantHomePage } from '@/components/home/TenantHomePage';
import { resolveTenantHome } from '@/components/home/tenant-home-fixtures';
import { getActiveClientRow } from '@/lib/active-client';

export const metadata: Metadata = { title: 'Home · AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface HomePageProps {
  searchParams: Promise<{ topbar?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const [{ topbar }, activeClient] = await Promise.all([
    searchParams,
    getActiveClientRow().catch(() => null),
  ]);
  const data = resolveTenantHome(activeClient?.key);
  const variant = (topbar ?? '').toUpperCase();
  const tenantName = data.title;

  let bar;
  if (variant === 'B') bar = <AppTopBarBlack tenantName={tenantName} />;
  else if (variant === 'C') bar = <AppTopBarEditorial tenantName={tenantName} />;
  else if (variant === 'D') bar = <AppTopBarTwoBar tenantName={tenantName} />;
  else bar = <AppTopBar />;

  return (
    <>
      {bar}
      <TenantHomePage data={data} />
    </>
  );
}
