import Link from 'next/link';
import {
  getAllActiveEngagements,
  getDashboardMetrics,
  type EngagementListItem,
} from '@/lib/db/engagement';
import { getCurrentPerson } from '@/lib/auth/maestro';
import { loadHomeAttention, type HomeAlert, type HomeQueueItem } from '@/lib/home/aggregate';
import { getActiveClientRow } from '@/lib/active-client';

export const dynamic = 'force-dynamic';

const INK = '#F5F5F0';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const TEAL = '#2DD4C8';
const PURPLE = '#9B6DFF';
const CORAL = '#FF6B4A';
const AMBER = '#F59E0B';
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
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000) return `$${Math.round(usd / 1_000)}K`;
  if (usd > 0) return `$${Math.round(usd)}`;
  return '—';
}

function MetricCard({
  label,
  value,
  trend,
  target,
  emphasis,
  empty,
}: {
  label: string;
  value: string;
  trend?: { delta: string; direction: 'up' | 'down' | 'flat' };
  target?: string;
  emphasis?: 'coral' | null;
  empty?: string;
}) {
  const isEmpty = !!empty && (value === '—' || value === '$0' || value === '0');
  return (
    <div
      style={{
        padding: 18,
        background: 'rgba(255,255,255,0.03)',
        border: BORDER_SOFT,
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          letterSpacing: '0.14em',
          color: MUTE,
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, color: emphasis === 'coral' ? CORAL : isEmpty ? MUTE : INK }}>
        {isEmpty ? '—' : value}
      </div>
      {isEmpty ? (
        <div style={{ fontSize: 11, color: MUTE, fontStyle: 'italic', lineHeight: 1.4 }}>
          {empty}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10, fontFamily: FONT_MONO, fontSize: 10, color: MUTE, letterSpacing: '0.06em' }}>
          {trend && (
            <span style={{ color: trend.direction === 'up' ? '#3FB27F' : trend.direction === 'down' ? CORAL : MUTE }}>
              {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {trend.delta}
            </span>
          )}
          {target && <span>target: {target}</span>}
        </div>
      )}
    </div>
  );
}

function EngagementCard({ e }: { e: EngagementListItem }) {
  const phaseColor = PHASE_COLORS[e.current_phase] ?? MUTE;
  const phaseLabel = PHASE_LABELS[e.current_phase] ?? `Phase ${e.current_phase}`;
  return (
    <Link
      href={`/engagements/${encodeURIComponent(e.graph_node_id)}`}
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

function severityColor(s: string): string {
  if (s === 'high') return CORAL;
  if (s === 'medium') return AMBER;
  return MUTE;
}

function AlertRow({ a }: { a: HomeAlert }) {
  return (
    <Link
      href={a.href}
      style={{
        display: 'block',
        padding: '10px 12px',
        background: 'rgba(255,255,255,0.02)',
        border: BORDER_SOFT,
        borderRadius: 8,
        textDecoration: 'none',
        color: INK,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 9,
            letterSpacing: '0.14em',
            color: severityColor(a.severity),
            textTransform: 'uppercase',
          }}
        >
          {a.severity} · {a.summary}
        </span>
        {a.clientName && (
          <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: MUTE, letterSpacing: '0.1em' }}>
            {a.clientName}
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontFamily: FONT_MONO, fontSize: 9, color: MUTE }}>
          {relTime(a.detectedAt)}
        </span>
      </div>
      {a.detail && (
        <div style={{ fontSize: 12.5, color: INK, lineHeight: 1.45 }}>{a.detail}</div>
      )}
    </Link>
  );
}

function QueueRow({ q }: { q: HomeQueueItem }) {
  const accent = q.kind === 'gate_pending' ? CORAL : TEAL;
  return (
    <Link
      href={q.href}
      style={{
        display: 'block',
        padding: '10px 12px',
        background: 'rgba(255,255,255,0.02)',
        border: BORDER_SOFT,
        borderRadius: 8,
        textDecoration: 'none',
        color: INK,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 3 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{q.engagementName}</span>
        <span style={{ marginLeft: 'auto', fontFamily: FONT_MONO, fontSize: 9, color: MUTE }}>
          {relTime(q.updatedAt)}
        </span>
      </div>
      <div style={{ fontSize: 11.5, color: accent, fontFamily: FONT_MONO, letterSpacing: '0.08em' }}>
        {q.detail}
      </div>
    </Link>
  );
}

function SectionLabel({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      style={{
        fontFamily: FONT_MONO,
        fontSize: 10,
        letterSpacing: '0.14em',
        color: color ?? MUTE,
        textTransform: 'uppercase',
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

export default async function HomePage() {
  const person = await getCurrentPerson();
  const activeClient = await getActiveClientRow();
  const [metrics, engagements, attention] = await Promise.all([
    getDashboardMetrics(),
    getAllActiveEngagements(person?.id, activeClient?.id ?? null),
    loadHomeAttention(6, activeClient?.id ?? null),
  ]);

  return (
    <div style={{ padding: '40px 40px 64px', width: '100%', maxWidth: 1800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 500 }}>
            {greeting()}
            {activeClient && (
              <span style={{ color: MUTE, fontWeight: 400 }}>
                {' · '}
                <span style={{ color: TEAL }}>{activeClient.name}</span>
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, color: MUTE, marginTop: 4 }}>
            {engagements.length} active Program{engagements.length === 1 ? '' : 's'}
            {activeClient ? ' for this account' : ''}
            {' · '}
            {metrics.gatesPending} gate{metrics.gatesPending === 1 ? '' : 's'} pending your review
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
          + New Program
        </Link>
      </div>

      {/* Ask Intelligence · search-first reflex on Home. Stateless — posts to
          /intelligence/ask?q= which handles the rest. */}
      <form
        action="/intelligence/ask"
        method="get"
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 24,
          padding: '14px 18px',
          background: 'rgba(255,255,255,0.03)',
          border: BORDER_SOFT,
          borderRadius: 12,
        }}
      >
        <input
          name="q"
          placeholder="Ask anything — sources cited, honest about gaps."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: INK,
            outline: 'none',
            fontSize: 14.5,
            fontFamily: 'DM Sans, -apple-system, sans-serif',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '8px 18px',
            background: TEAL,
            color: '#0A0A0A',
            border: 'none',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: FONT_MONO,
            letterSpacing: '0.1em',
            cursor: 'pointer',
          }}
        >
          ASK →
        </button>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <MetricCard
          label="Active Programs"
          value={String(engagements.length)}
          target={engagements.length === 0 ? undefined : String(engagements.length)}
          empty={activeClient ? `No active Program for ${activeClient.name} · start one to begin baseline capture.` : 'No active Programs.'}
        />
        <MetricCard
          label="Tracked savings YTD"
          value={dollarsM(metrics.trackedSavingsUsd)}
          empty="Savings populate after Phase 4 outcome verification on one or more Programs."
        />
        <MetricCard
          label="Gates pending"
          value={String(metrics.gatesPending)}
          emphasis={metrics.gatesPending > 0 ? 'coral' : null}
        />
        <MetricCard
          label="Outcome fees · this quarter"
          value={dollarsM(metrics.outcomeFeesQuarterUsd)}
          empty="Outcome fees activate when a Phase 4 verification ships in-quarter with positive verified savings."
        />
      </div>

      {/* Attention row · Alerts + Queue — what needs you today */}
      {(attention.alerts.length > 0 || attention.queue.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div>
            <SectionLabel color={CORAL}>
              Alerts · {attention.alerts.length}
            </SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {attention.alerts.length === 0 ? (
                <div style={{ color: MUTE, fontSize: 13, fontStyle: 'italic' }}>
                  No open alerts. Either the data layer is quiet or everything's resolved.
                </div>
              ) : (
                attention.alerts.map((a) => <AlertRow key={a.id} a={a} />)
              )}
            </div>
          </div>
          <div>
            <SectionLabel color={TEAL}>
              Your queue · {attention.queue.length}
            </SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {attention.queue.length === 0 ? (
                <div style={{ color: MUTE, fontSize: 13, fontStyle: 'italic' }}>
                  Queue is empty. Nothing awaiting your response.
                </div>
              ) : (
                attention.queue.map((q) => <QueueRow key={q.id} q={q} />)
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div>
          <SectionLabel>Active Programs</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {engagements.length === 0 ? (
              <div style={{ color: MUTE, fontSize: 14, fontStyle: 'italic' }}>No active Programs.</div>
            ) : (
              engagements.map((e) => <EngagementCard key={e.id} e={e} />)
            )}
          </div>
        </div>

        <div>
          <SectionLabel>Quick start</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <QuickStartCard mode="NEXUS" modeColor={TEAL} title="Start new Program" href="/engagements/new" />
            <QuickStartCard mode="NEXUS · IDENTITY" modeColor={PURPLE} title="Add a user" href="/platform/users/new" />
            <QuickStartCard mode="NEXUS · DATA" modeColor={TEAL} title="Load client data" href="/platform/data" />
          </div>
        </div>
      </div>
    </div>
  );
}
