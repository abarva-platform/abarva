import type { ContradictionSeed } from '@/lib/intelligence/seed-contradictions';
import { getStatusLabel, getStatusColor, getConfidenceDelta } from '@/lib/public-site/public-corpus';
import Link from 'next/link';

interface ContradictionRowProps {
  contradiction: ContradictionSeed;
  index: number;
}

export function ContradictionRow({ contradiction, index }: ContradictionRowProps) {
  const delta = getConfidenceDelta(contradiction.partyA.confidence, contradiction.partyB.confidence);
  const statusLabel = getStatusLabel(contradiction.status);
  const statusColor = getStatusColor(contradiction.status);
  const isEven = index % 2 === 0;

  return (
    <Link
      href={`/contradictions/${contradiction.id}`}
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 110px', gap: 16, alignItems: 'center', padding: '16px 20px', background: isEven ? 'var(--pub-paper)' : '#f5f2ec', borderBottom: '1px solid var(--pub-rule)', textDecoration: 'none', cursor: 'pointer' }}
      aria-label={`View contradiction: ${contradiction.title}`}
    >
      <div>
        <span style={{ fontFamily: 'var(--pub-font-mono)', fontSize: 10, color: 'var(--pub-stone)', display: 'block', marginBottom: 4 }}>{contradiction.id}</span>
        <span style={{ fontSize: 14, color: 'var(--pub-ink)', fontWeight: 500, lineHeight: 1.4 }}>{contradiction.title}</span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--pub-slate)', lineHeight: 1.5 }}>
        <div style={{ marginBottom: 4 }}><strong style={{ color: 'var(--pub-stone)', fontFamily: 'var(--pub-font-mono)', fontSize: 10 }}>A:</strong> {contradiction.partyA.claim.slice(0, 80)}{contradiction.partyA.claim.length > 80 ? '…' : ''}</div>
        <div><strong style={{ color: 'var(--pub-stone)', fontFamily: 'var(--pub-font-mono)', fontSize: 10 }}>B:</strong> {contradiction.partyB.claim.slice(0, 80)}{contradiction.partyB.claim.length > 80 ? '…' : ''}</div>
      </div>
      <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, fontFamily: 'var(--pub-font-mono)', color: delta.startsWith('+') ? '#1d7a4a' : '#ba7517' }}>
        {delta}
      </div>
      <div>
        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 100, fontSize: 11, fontFamily: 'var(--pub-font-mono)', fontWeight: 600, background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}40` }}>
          {statusLabel}
        </span>
      </div>
    </Link>
  );
}
