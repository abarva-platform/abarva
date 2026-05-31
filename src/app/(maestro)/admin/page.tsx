export const metadata = { title: 'Admin Home | AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ADMIN_MAESTRO_HOME_SRC = '/design/admin-maestro-menu-wireframe-2026-05-31.html';

export default function AdminOverviewPage() {
  return (
    <main
      data-admin-home-wireframe="true"
      style={{
        minHeight: '100vh',
        background: '#FBFAF7',
      }}
    >
      <iframe
        title="AbarVa admin Maestro home"
        src={ADMIN_MAESTRO_HOME_SRC}
        style={{
          display: 'block',
          width: '100%',
          minHeight: '100vh',
          height: '100dvh',
          border: 0,
          background: '#FBFAF7',
        }}
      />
    </main>
  );
}
