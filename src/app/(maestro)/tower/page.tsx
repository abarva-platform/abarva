import { getActiveClientRow } from '@/lib/active-client';

export const metadata = { title: 'IT Investment Tower · AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TowerPage() {
  const activeClient = await getActiveClientRow();
  const frameSrc = activeClient?.key
    ? `/api/tower/v2-frame?client=${encodeURIComponent(activeClient.key)}`
    : '/api/tower/v2-frame';

  return (
    <main style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#f7f5ef' }}>
      <iframe
        src={frameSrc}
        title="AbarVa IT Investment Tower"
        style={{
          width: '100%',
          height: '100%',
          border: 0,
          display: 'block',
          background: '#f7f5ef',
        }}
      />
    </main>
  );
}
