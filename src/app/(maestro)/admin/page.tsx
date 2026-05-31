import AbarvaNav from '@/components/AbarvaNav';

export const metadata = { title: 'Admin Home | AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ADMIN_MAESTRO_HOME_SRC = '/design/admin-maestro-menu-wireframe-2026-05-31.html';

export default function AdminOverviewPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FBFAF7',
      }}
    >
      <nav aria-label="Primary">
        <AbarvaNav activePage="home" />
      </nav>
      <main
        data-admin-home-wireframe="true"
        style={{
          minHeight: 'calc(100vh - 56px)',
          background: '#FBFAF7',
        }}
      >
        <iframe
          title="AbarVa admin Maestro home"
          src={ADMIN_MAESTRO_HOME_SRC}
          style={{
            display: 'block',
            width: '100%',
            minHeight: 'calc(100vh - 56px)',
            height: 'calc(100dvh - 56px)',
            border: 0,
            background: '#FBFAF7',
          }}
        />
      </main>
    </div>
  );
}
