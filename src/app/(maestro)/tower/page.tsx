export const metadata = { title: 'IT Investment Tower · AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function TowerPage() {
  return (
    <main style={{ width: '100vw', height: 'calc(100dvh - 56px)', overflow: 'hidden', background: '#f7f5ef' }}>
      <iframe
        src="/api/tower/v2-frame"
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
