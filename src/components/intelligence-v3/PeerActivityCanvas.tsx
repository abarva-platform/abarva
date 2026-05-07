// Intelligence v3 · Peer activity stage.
//
// Reads ai_initiative_kpis where peer_median is set. Compares the
// tenant's latest value against peer median and surfaces the
// most-divergent signals first.

import { COLORS, FONT, BORDER, SPACING, RADIUS } from '@/lib/design/abarva-theme';
import type { PeerActivityData, PeerSignal } from '@/lib/intelligence-v3/stages-display';

export function PeerActivityCanvas({ data }: { data: PeerActivityData }) {
  return (
    <section
      id="stage-panel-peer-activity"
      role="tabpanel"
      style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}
    >
      <SectionHeader>Peer activity · anonymized aggregate signals</SectionHeader>
      <p style={{ fontFamily: FONT.body, fontSize: 12, color: COLORS.muted, margin: 0 }}>
        How this tenant&apos;s KPIs compare to peer medians on the same metric.
        Most-divergent signals surface first.
      </p>

      <Totals data={data} />

      {data.signals.length === 0 ? (
        <Empty>
          No peer-comparable KPIs loaded yet. Set <code style={{ fontFamily: FONT.mono }}>peer_median</code>{' '}
          on KPI rows to surface signals here.
        </Empty>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
          {data.signals.map((s) => (
            <Signal key={`${s.initiativeId}-${s.kpiName}`} signal={s} />
          ))}
        </div>
      )}
    </section>
  );
}

function Totals({ data }: { data: PeerActivityData }) {
  const tiles: ReadonlyArray<{ label: string; value: string }> = [
    { label: 'KPI signals', value: data.totals.kpiCount.toString() },
    { label: 'Ahead of peer', value: data.totals.aheadOfPeer.toString() },
    { label: 'Behind peer', value: data.totals.behindPeer.toString() },
    { label: 'On par', value: data.totals.onPar.toString() },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: SPACING.xs }}>
      {tiles.map((t) => (
        <div
          key={t.label}
          style={{
            border: BORDER.hairline,
            background: COLORS.surface,
            borderRadius: RADIUS.sm,
            padding: SPACING.sm,
          }}
        >
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 9,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: COLORS.muted,
            }}
          >
            {t.label}
          </div>
          <div
            style={{
              fontFamily: FONT.body,
              fontSize: 18,
              fontWeight: 700,
              color: COLORS.ink,
              marginTop: 2,
            }}
          >
            {t.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function Signal({ signal }: { signal: PeerSignal }) {
  const ahead = signal.deltaVsPeer > 0;
  const onPar = signal.deltaVsPeer === 0;
  const tone = onPar ? COLORS.muted : ahead ? '#0F6E56' : COLORS.amber;
  const direction = onPar ? 'On par with peers' : ahead ? 'Ahead of peers' : 'Behind peers';
  const fmt = (n: number) => formatKpiValue(n, signal.kpiUnit);

  return (
    <article
      style={{
        border: BORDER.hairline,
        borderLeft: `3px solid ${tone}`,
        background: COLORS.card,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) auto',
          gap: SPACING.md,
          alignItems: 'baseline',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 9,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: COLORS.muted,
            }}
          >
            {signal.initiativeDisplayId} · {signal.quarter}
          </div>
          <h3
            style={{
              fontFamily: FONT.body,
              fontSize: 15,
              fontWeight: 600,
              color: COLORS.ink,
              margin: 0,
              marginTop: 2,
            }}
          >
            {signal.kpiName}
          </h3>
          <div style={{ fontFamily: FONT.body, fontSize: 12, color: COLORS.muted, marginTop: 2 }}>
            {signal.initiativeName}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 9,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: tone,
              fontWeight: 700,
            }}
          >
            {direction}
          </div>
          <div
            style={{
              fontFamily: FONT.body,
              fontSize: 18,
              fontWeight: 700,
              color: COLORS.ink,
              marginTop: 2,
            }}
          >
            {fmt(signal.tenantValue)}
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
            peer: {fmt(signal.peerMedian)} · Δ {signal.deltaVsPeer > 0 ? '+' : ''}
            {signal.deltaPctVsPeer.toFixed(0)}%
          </div>
        </div>
      </div>
    </article>
  );
}

function formatKpiValue(n: number, unit: string | null): string {
  const formatted = Number.isInteger(n) ? n.toString() : n.toFixed(2);
  if (!unit) return formatted;
  return `${formatted} ${unit}`;
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        background: COLORS.navyDark,
        color: COLORS.surface,
        padding: `${SPACING.sm}px ${SPACING.md}px`,
        fontFamily: FONT.body,
        fontSize: 13,
        fontWeight: 600,
        margin: 0,
        borderLeft: `3px solid ${COLORS.amber}`,
        borderRadius: `${RADIUS.sm}px ${RADIUS.sm}px 0 0`,
      }}
    >
      {children}
    </h2>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: `1px dashed ${COLORS.border}`,
        borderRadius: RADIUS.md,
        padding: SPACING.xxxl,
        textAlign: 'center',
        fontFamily: FONT.body,
        fontSize: 13,
        color: COLORS.muted,
      }}
    >
      {children}
    </div>
  );
}
