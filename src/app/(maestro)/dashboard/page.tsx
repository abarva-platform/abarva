import Link from 'next/link';
import {
  getAllActiveEngagements,
  getDashboardMetrics,
  type EngagementListItem,
} from '@/lib/db/engagement';
import { getCurrentPerson } from '@/lib/auth/maestro';

const INK = '#F5F5F0';
const MUTE = '#8B8680';
const TEAL = '#2DD4C8';
const PURPLE = '#9B6DFF';
const CORAL = '#FF6B4A';
const BORDER_SOFT = '0.5px solid rgba(255,255,255,0.08)';
const FONT_MONO = 'JetBrains Mono, monospace';

const PHASE_LABELS = ['Start', 'Diagnose', 'Design', 'Execute', 'Verify'];
const PHASE_COLORS = [TEAL, TEAL, '#F59E0B', '#FB923C', MUTE];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function relTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const m = Math.floor(diffMs / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? 's' : ''} ago`;
}

function dollarsM(usd: number): string {
  return `$${Math.round(usd / 1_000_000)}M`;
}

function MetricCard({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: 'coral' | null;
}) {
  return (
    <div
      style={{
        padding: 18,
        background: 'rgba(255,255,255,0.03)',
        border: BORDER_SOFT,
        borderRadius: 12,
      }}
    >
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          letterSpacing: '0.14em',
          color: MUTE,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, color: emphasis === 'coral' ? CORAL : INK }}>
        {value}
      </div>
    </div>
  );
}

function EngagementCard({ e }: { e: EngagementListItem }) {
  const phaseColor = PHASE_COLORS[e.current_phase] ?? MUTE;
  const phaseLabel = PHASE_LABELS[e.current_phase] ?? `Phase ${e.current_phase}`;
  return (
    <Link
      href={`/engage/${encodeURIComponent(e.graph_node_id)}`}
      style={{
        display: 'block',
        padding: 16,
        background: 'rgba(255,255,255,0.03)',
        border: BORDER_SOFT,
        borderRadius: 10,
        textDecoration: 'none',
        color: INK,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 500 }}>{e.name}</div>
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
      <div style={{ display: 'flex', gap: 14, fontSize: 12, color: MUTE }}>
        <div>
          {e.sponsor_name ?? 'unassigned'}
          {e.sponsor_role ? ` · ${e.sponsor_role}` : ''}
        </div>
        <div style={{ fontFamily: FONT_MONO, letterSpacing: '0.1em' }}>{e.industry_code}</div>
        <div style={{ marginLeft: 'auto', fontFamily: FONT_MONO }}>{relTime(e.updated_at)}</div>
      </div>
    </Link>
  );
}

function QuickStartCard({
  mode,
  modeColor,
  title,
  href,
}: {
  mode: string;
  modeColor: string;
  title: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        padding: 14,
        background: 'rgba(255,255,255,0.03)',
        border: BORDER_SOFT,
        borderRadius: 10,
        textDecoration: 'none',
        color: INK,
      }}
    >
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 9,
          letterSpacing: '0.14em',
          color: modeColor,
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {mode}
      </div>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{title}</div>
    </Link>
  );
}

export default async function DashboardPage() {
  const person = await getCurrentPerson();
  const [metrics, engagements] = await Promise.all([
    getDashboardMetrics(),
    getAllActiveEngagements(person?.id),
  ]);

  return (
    <div style={{ padding: '28px 28px 40px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 500 }}>{greeting()}</div>
          <div style={{ fontSize: 13, color: MUTE, marginTop: 4 }}>
            {metrics.activeCount} active engagement{metrics.activeCount === 1 ? '' : 's'} · {metrics.gatesPending} gate
            {metrics.gatesPending === 1 ? '' : 's'} pending your review
          </div>
        </div>
        <Link
          href="/engagements/new"
          style={{
            padding: '10px 16px',
            background: TEAL,
            color: '#0A0A0A',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          + New engagement
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <MetricCard label="Active" value={String(metrics.activeCount)} />
        <MetricCard label="Tracked savings in-flight" value={dollarsM(metrics.trackedSavingsUsd)} />
        <MetricCard
          label="Gates pending"
          value={String(metrics.gatesPending)}
          emphasis={metrics.gatesPending > 0 ? 'coral' : null}
        />
        <MetricCard label="Outcome fees this quarter" value={dollarsM(metrics.outcomeFeesQuarterUsd)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              letterSpacing: '0.14em',
              color: MUTE,
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            Active engagements
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {engagements.length === 0 ? (
              <div style={{ color: MUTE, fontSize: 14, fontStyle: 'italic' }}>No active engagements.</div>
            ) : (
              engagements.map((e) => <EngagementCard key={e.id} e={e} />)
            )}
          </div>
        </div>

        <div>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              letterSpacing: '0.14em',
              color: MUTE,
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            Quick start
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <QuickStartCard mode="NEXUS · ENGAGEMENT" modeColor={TEAL} title="Start new engagement" href="/engagements/new" />
            <QuickStartCard mode="NEXUS · IDENTITY" modeColor={PURPLE} title="Add a user" href="/users/new" />
            <QuickStartCard mode="NEXUS · DATA" modeColor={TEAL} title="Load client data" href="/data" />
          </div>
        </div>
      </div>
    </div>
  );
}
