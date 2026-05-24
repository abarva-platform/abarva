import Link from 'next/link';
import { requireTenancy } from '@/lib/auth/tenancy';
import {
  getPortfolioValueRollup,
  type TowerPortfolioMove,
  type TowerPortfolioValueRollup,
} from '@/lib/tower/value-states';

export const metadata = { title: 'Tower Portfolio Value · AbarVa' };
export const dynamic = 'force-dynamic';

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        border: '1px solid #d7d2c6',
        borderRadius: 999,
        padding: '4px 9px',
        color: '#4b5563',
        fontSize: 12,
        fontWeight: 760,
      }}
    >
      {children}
    </span>
  );
}

function MoveRow({ move }: { move: TowerPortfolioMove }) {
  return (
    <Link
      href={move.href}
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(250px, 1.4fr) repeat(3, minmax(120px, 0.6fr)) minmax(120px, 0.55fr)',
        gap: 12,
        alignItems: 'center',
        border: '1px solid #d7d2c6',
        borderRadius: 8,
        padding: 14,
        background: '#fff',
        color: '#111827',
        textDecoration: 'none',
      }}
    >
      <div>
        <div style={{ fontWeight: 820 }}>{move.moveName}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 7 }}>
          <StatusPill>{move.templateKind ?? 'Move'}</StatusPill>
          <StatusPill>{move.currentGate ?? 'no gate'}</StatusPill>
        </div>
      </div>
      <strong>{formatUsd(move.projectedUsd)}</strong>
      <strong>{formatUsd(move.trackedUsd)}</strong>
      <strong>{formatUsd(move.verifiedUsd)}</strong>
      <span style={{ color: '#0f1f4d', fontWeight: 820 }}>Open value</span>
    </Link>
  );
}

function emptyPortfolio(ctx: Awaited<ReturnType<typeof requireTenancy>>): TowerPortfolioValueRollup {
  return {
    clientId: ctx.clientId,
    moves: [],
    arrows: [],
    p10Source: 'fallback',
    totals: {
      projectedUsd: 0,
      trackedUsd: 0,
      verifiedUsd: 0,
      activeMoveCount: 0,
      activeSourceWorkflowCount: 0,
    },
  };
}

export default async function TowerPortfolioValuePage() {
  const ctx = await requireTenancy();
  const portfolio = await getPortfolioValueRollup(ctx).catch(() => emptyPortfolio(ctx));

  return (
    <main style={{ minHeight: '100vh', background: '#F8F7F4', color: '#111827', padding: '32px 28px 54px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-end', marginBottom: 22 }}>
          <div>
            <Link href="/tower" style={{ color: '#4b5563', fontSize: 13, fontWeight: 720, textDecoration: 'none' }}>
              Control Tower
            </Link>
            <h1 style={{ margin: '10px 0 8px', fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: 40, lineHeight: 1.05 }}>
              Portfolio Value
            </h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatusPill>{portfolio.totals.activeMoveCount} active Moves</StatusPill>
              <StatusPill>{portfolio.totals.activeSourceWorkflowCount} Source workflows</StatusPill>
              <StatusPill>{portfolio.p10Source === 'move_dependencies' ? 'P10 DAG arrows' : 'DAG fallback'}</StatusPill>
            </div>
          </div>
          <div style={{ border: '1px solid #111827', borderRadius: 8, padding: 18, background: '#111827', color: '#fff', minWidth: 260 }}>
            <div style={{ color: '#d7d2c6', fontSize: 12, fontWeight: 820, textTransform: 'uppercase' }}>Projected portfolio value</div>
            <div style={{ marginTop: 6, fontSize: 30, fontWeight: 860 }}>{formatUsd(portfolio.totals.projectedUsd)}</div>
          </div>
        </div>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            ['Tracked value', portfolio.totals.trackedUsd],
            ['Verified value', portfolio.totals.verifiedUsd],
            ['Projected rows', portfolio.moves.length],
          ].map(([label, value]) => (
            <div key={label} style={{ border: '1px solid #d7d2c6', borderRadius: 8, padding: 16, background: '#fff' }}>
              <div style={{ color: '#6b7280', fontSize: 12, fontWeight: 780 }}>{label}</div>
              <div style={{ marginTop: 6, fontSize: 23, fontWeight: 840 }}>
                {typeof value === 'number' && label !== 'Projected rows' ? formatUsd(value) : String(value)}
              </div>
            </div>
          ))}
        </section>

        <section>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(250px, 1.4fr) repeat(3, minmax(120px, 0.6fr)) minmax(120px, 0.55fr)',
              gap: 12,
              padding: '0 14px 8px',
              color: '#6b7280',
              fontSize: 12,
              fontWeight: 820,
              textTransform: 'uppercase',
            }}
          >
            <span>Move / workflow</span>
            <span>Projected</span>
            <span>Tracked</span>
            <span>Verified</span>
            <span>Drill-down</span>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {portfolio.moves.length === 0 ? (
              <div style={{ border: '1px solid #d7d2c6', borderRadius: 8, padding: 18, background: '#fff', color: '#6b7280' }}>
                Portfolio value data is not available yet for this tenant. Tower is showing an empty state rather than inventing value.
              </div>
            ) : portfolio.moves.map((move) => <MoveRow key={move.moveId} move={move} />)}
          </div>
        </section>

        <section style={{ marginTop: 26 }}>
          <h2 style={{ margin: '0 0 12px', fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: 24 }}>
            Dependency Arrows
          </h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {portfolio.arrows.length === 0 ? (
              <p style={{ margin: 0, color: '#6b7280' }}>No dependency arrows are linked yet.</p>
            ) : portfolio.arrows.map((arrow) => (
              <div key={arrow.id} style={{ border: '1px solid #d7d2c6', borderRadius: 8, padding: 14, background: '#fff' }}>
                <strong>{arrow.fromMoveName}</strong>
                <span style={{ color: '#0f1f4d', fontWeight: 900 }}> → </span>
                <strong>{arrow.toMoveName}</strong>
                <span style={{ color: '#6b7280' }}> · {arrow.relationType}</span>
                {arrow.note ? <p style={{ margin: '6px 0 0', color: '#4b5563' }}>{arrow.note}</p> : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
