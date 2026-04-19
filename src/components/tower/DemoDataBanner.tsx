'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const TEAL = '#2DD4C8';
const INK = '#F5F5F0';
const MUTE = 'rgba(245, 245, 240, 0.72)';

interface Props {
  clientId: string;
  demoRowCount: number;
  realRowCount: number;
}

export function DemoDataBanner({ clientId, demoRowCount, realRowCount }: Props) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (demoRowCount === 0) return null;

  const isMixed = realRowCount > 0;

  async function handleRemove() {
    if (!window.confirm(`Remove ${demoRowCount} demo rows for this client? Real data (${realRowCount} rows) will be preserved.`)) return;
    setRemoving(true);
    setError(null);
    try {
      const res = await fetch(`/api/tower/seed-demo?clientId=${encodeURIComponent(clientId)}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `${res.status} ${res.statusText}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown');
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div
      style={{
        background: 'rgba(45,212,200,0.06)',
        border: `0.5px solid ${TEAL}`,
        borderRadius: 10,
        padding: '12px 18px',
        marginBottom: 18,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        color: INK,
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      <span style={{ color: TEAL, fontSize: 12, letterSpacing: '0.08em', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>◆</span>
      <div style={{ flex: 1, fontSize: 13 }}>
        {isMixed ? (
          <>
            <span style={{ fontWeight: 600 }}>Mixed data · </span>
            <span style={{ color: MUTE }}>{realRowCount} real rows, {demoRowCount} demo rows for exploration.</span>
          </>
        ) : (
          <>
            <span style={{ fontWeight: 600 }}>Demo data · </span>
            <span style={{ color: MUTE }}>This client's Tower is populated with {demoRowCount} synthetic rows. Real data will replace it when you upload.</span>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={handleRemove}
        disabled={removing}
        style={{
          padding: '6px 14px',
          background: 'transparent',
          border: `1px solid ${MUTE}`,
          borderRadius: 6,
          color: INK,
          fontSize: 12,
          fontFamily: 'DM Sans, sans-serif',
          fontWeight: 600,
          cursor: removing ? 'default' : 'pointer',
          opacity: removing ? 0.5 : 1,
        }}
      >
        {removing ? 'Removing…' : 'Remove demo data'}
      </button>
      {error && <span style={{ color: '#FF6B4A', fontSize: 12 }}>{error}</span>}
    </div>
  );
}
