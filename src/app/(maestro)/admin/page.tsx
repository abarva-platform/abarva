import { AppShell } from '@/components/shell/AppShell';

export const metadata = { title: 'Admin Home | AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ADMIN_MAESTRO_HOME_SRC = '/design/admin-maestro-menu-wireframe-2026-05-31.html';

export default function AdminOverviewPage() {
  return (
    <AppShell surface="home" agentName="Steward" showProductNav>
      <main
        data-admin-home-wireframe="true"
        style={{
          flex: 1,
          minHeight: 0,
          background: '#FBFAF7',
        }}
      >
        <iframe
          title="AbarVa admin Maestro home"
          src={ADMIN_MAESTRO_HOME_SRC}
          style={{
            display: 'block',
            width: '100%',
            minHeight: 'calc(100vh - 64px)',
            height: 'calc(100dvh - 64px)',
            border: 0,
            background: '#FBFAF7',
          }}
        />
      </main>
    </AppShell>
  );
}
