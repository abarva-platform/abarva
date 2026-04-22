import Link from 'next/link';
import { getAllActiveEngagements, type EngagementListItem } from '@/lib/db/engagement';
import { getActiveClientRow } from '@/lib/active-client';
import { loadEngagementSummaries, type EngagementSummaryExtras } from '@/lib/engagements/list-summary';

export const dynamic = 'force-dynamic';

const INK = '#F5F5F0';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const TEAL = '#2DD4C8';
const PURPLE = '#9B6DFF';
const AMBER = '#F5C54A';
const GREEN = '#3FB27F';
const CORAL = '#FF6B4A';
const BORDER_SOFT = '0.5px solid rgba(255,255,255,0.08)';
const FONT_MONO = 'JetBrains Mono, monospace';
const FONT_SERIF = 'Georgia, serif';

const PHASE_LABELS = ['Start', 'Diagnose', 'Design', 'Execute', 'Verify'];
const PHASE_COLORS = [TEAL, TEAL, AMBER, '#FB923C', GREEN];

function dollarsM(n: number | null): string {
  if (n == null || n <= 0) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function relTime(iso: string | null): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const m = Math.floor(diffMs / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatScale(s: { employees: number | null; revenue_usd: number | null } | null): string | null {
  if (!s) return null;
  const parts: string[] = [];
  if (typeof s.employees === 'number' && s.employees > 0) {
    parts.push(`${(s.employees / 1000).toFixed(0)}K employees`);
  }
  if (typeof s.revenue_usd === 'number' && s.revenue_usd > 0) {
    parts.push(`$${(s.revenue_usd / 1_000_000_000).toFixed(1)}B rev`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

function EngagementCard({ e, x }: { e: EngagementListItem; x: EngagementSummaryExtras | undefined }) {
  const phaseColor = PHASE_COLORS[e.current_phase] ?? MUTE;
  const phaseLabel = PHASE_LABELS[e.current_phase] ?? `Phase ${e.current_phase}`;
  const scale = formatScale(x?.clientScale ?? null);
  return (
    <Link
      href={`/engagements/${encodeURIComponent(e.graph_node_id)}`}
      style={{
        display: 'block',
        padding: 18,
        background: 'rgba(255,255,255,0.03)',
        border: BORDER_SOFT,
        borderRadius: 12,
        textDecoration: 'none',
        color: INK,
      }}
    >
      {/* Header: name + phase */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>{e.name}</div>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: '0.14em',
            color: phaseColor,
            textTransform: 'uppercase',
          }}
        >
          Phase {e.current_phase} · {phaseLabel}
        </div>
      </div>

      {/* Sub-header: industry · sponsor · client scale */}
      <div style={{ display: 'flex', gap: 14, fontSize: 12, color: MUTE, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: FONT_MONO, letterSpacing: '0.1em' }}>{e.industry_code}</span>
        {e.sponsor_name && (
          <span>
            Sponsor: {e.sponsor_name}
            {e.sponsor_role ? `, ${e.sponsor_role}` : ''}
          </span>
        )}
        {scale && <span style={{ fontFamily: FONT_MONO, letterSpacing: '0.06em' }}>{scale}</span>}
      </div>

      {/* Value at stake · serif large · primary metric */}
      {x?.valueAtStakeUsd && x.valueAtStakeUsd > 0 && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
          <div style={{ fontFamily: FONT_SERIF, fontSize: 26, fontWeight: 400, color: INK, letterSpacing: '-0.01em' }}>
            {dollarsM(x.valueAtStakeUsd)}
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTE, letterSpacing: '0.08em' }}>
            VALUE AT STAKE
            {x.baselineLockedAt ? ` · baseline locked ${formatDate(x.baselineLockedAt)}` : ''}
          </div>
        </div>
      )}

      {/* Dense data grid · 4-col row of mini-metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
        <MiniMetric
          label="Deliverables"
          value={String(x?.deliverablesCount ?? 0)}
          sub={x?.topDeliverableQuality ? `top ${x.topDeliverableQuality}/100` : undefined}
          accent={PURPLE}
        />
        <MiniMetric
          label="Turns"
          value={String(x?.turnCount ?? 0)}
          sub={x?.lastTurnAt ? `last ${relTime(x.lastTurnAt)}` : undefined}
          accent={TEAL}
        />
        <MiniMetric
          label="Topics"
          value={String(x?.assignedTopicsCount ?? 0)}
          sub={x?.primaryTopicTitle ? `primary · ${x.primaryTopicTitle.slice(0, 28)}` : undefined}
          accent={PURPLE}
        />
        <MiniMetric
          label="Contradictions"
          value={String(x?.contradictionsCount ?? 0)}
          sub={
            x?.contradictionsCount
              ? x.contradictionsScope === 'program'
                ? 'on this program'
                : 'on this client'
              : undefined
          }
          accent={x?.contradictionsCount ? AMBER : MUTE}
        />
      </div>

      {/* Footer · next gate */}
      {x?.nextGateDate && (
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTE, letterSpacing: '0.08em', borderTop: BORDER_SOFT, paddingTop: 8 }}>
          NEXT GATE · {formatDate(x.nextGateDate)}
        </div>
      )}
    </Link>
  );
}

function MiniMetric({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 9,
          color: accent,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 500, color: INK }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 10, color: MUTE, fontFamily: FONT_MONO, letterSpacing: '0.04em' }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export default async function EngagementsListPage() {
  const activeClient = await getActiveClientRow();
  const rows = await getAllActiveEngagements(undefined, activeClient?.id ?? null);
  const extras = await loadEngagementSummaries(rows.map((r) => r.id));

  return (
    <div style={{ padding: '28px 28px 40px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 500 }}>
            Programs
            {activeClient && <span style={{ color: MUTE, fontWeight: 400 }}> · <span style={{ color: TEAL }}>{activeClient.name}</span></span>}
          </div>
          <div style={{ fontSize: 12, color: MUTE, marginTop: 4 }}>
            {rows.length} active{activeClient ? ' for this account' : ''}
          </div>
        </div>
        <Link
          href="/programs/new"
          style={{
            padding: '10px 16px',
            background: TEAL,
            color: '#0A0A0A',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          + New program
        </Link>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {rows.length === 0 ? (
          <div style={{ padding: 20, border: BORDER_SOFT, borderRadius: 10, color: MUTE, fontSize: 14, fontStyle: 'italic' }}>
            No active programs yet{activeClient ? ` for ${activeClient.name}` : ''}. Click + New program to begin.
          </div>
        ) : (
          rows.map((e) => <EngagementCard key={e.id} e={e} x={extras[e.id]} />)
        )}
      </div>
    </div>
  );
}
