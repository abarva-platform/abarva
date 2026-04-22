import Link from 'next/link';
import { getAllActiveEngagements, type EngagementListItem } from '@/lib/db/engagement';
import { getActiveClientRow } from '@/lib/active-client';
import { loadEngagementSummaries, type EngagementSummaryExtras } from '@/lib/engagements/list-summary';

export const dynamic = 'force-dynamic';

const PAGE_BG = '#F6F1E8';
const PANEL_BG = '#FFFDFC';
const PANEL_SOFT = '#F3EBDD';
const INK = '#171411';
const INK_SOFT = '#40342D';
const INK_MUTED = '#6B5B52';
const LINE = 'rgba(23,20,17,0.12)';
const TEAL = '#0E9F8C';
const TEAL_DEEP = '#0A5849';
const PLUM = '#8B5CF6';
const AMBER = '#D97706';
const GREEN = '#2F855A';
const CORAL = '#D9485F';
const CREAM = '#FBF7F1';
const SERIF = '"Fraunces", Georgia, serif';
const MONO = '"JetBrains Mono", "Fira Code", monospace';
const SANS = '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

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

function MiniMetric({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: 14,
        background: 'rgba(255,255,255,0.56)',
        border: `1px solid ${LINE}`,
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 10,
          color: accent,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: INK }}>{value}</div>
      {sub ? (
        <div
          style={{
            marginTop: 4,
            fontSize: 11,
            color: INK_MUTED,
            fontFamily: MONO,
            letterSpacing: '0.04em',
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function EngagementCard({ e, x }: { e: EngagementListItem; x: EngagementSummaryExtras | undefined }) {
  const phaseColor = PHASE_COLORS[e.current_phase] ?? INK_MUTED;
  const phaseLabel = PHASE_LABELS[e.current_phase] ?? `Phase ${e.current_phase}`;
  const scale = formatScale(x?.clientScale ?? null);

  return (
    <Link
      href={`/engagements/${encodeURIComponent(e.graph_node_id)}`}
      style={{
        display: 'block',
        padding: 22,
        background: PANEL_BG,
        border: `1px solid ${LINE}`,
        borderRadius: 22,
        textDecoration: 'none',
        color: INK,
        boxShadow: '0 18px 48px rgba(23,20,17,0.06)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 18,
          marginBottom: 18,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: 0, flex: '1 1 540px' }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 11,
              color: TEAL,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            {e.industry_code} · Program
          </div>
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 'clamp(28px, 2.3vw, 42px)',
              lineHeight: 0.98,
              letterSpacing: '-0.04em',
              color: INK,
            }}
          >
            {e.name}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              marginTop: 12,
              fontSize: 14,
              lineHeight: 1.6,
              color: INK_SOFT,
            }}
          >
            {e.sponsor_name ? (
              <span>
                Sponsor: <strong style={{ color: INK }}>{e.sponsor_name}</strong>
                {e.sponsor_role ? `, ${e.sponsor_role}` : ''}
              </span>
            ) : null}
            {scale ? <span>{scale}</span> : null}
          </div>
        </div>

        <div
          style={{
            flex: '0 0 auto',
            minWidth: 220,
            padding: 16,
            borderRadius: 18,
            background: PANEL_SOFT,
            border: `1px solid ${LINE}`,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              color: phaseColor,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Phase {e.current_phase} · {phaseLabel}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: INK_SOFT }}>
            {x?.nextGateDate ? (
              <>Next gate: <strong style={{ color: INK }}>{formatDate(x.nextGateDate)}</strong></>
            ) : (
              <>Next gate timing not locked yet</>
            )}
          </div>
          <div
            style={{
              marginTop: 10,
              fontFamily: MONO,
              fontSize: 10,
              color: INK_MUTED,
              letterSpacing: '0.08em',
            }}
          >
            {x?.lastTurnAt ? `last turn ${relTime(x.lastTurnAt)}` : 'no turns yet'}
          </div>
        </div>
      </div>

      {x?.valueAtStakeUsd && x.valueAtStakeUsd > 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 12,
            padding: '16px 18px',
            background: 'rgba(14,159,140,0.06)',
            border: '1px solid rgba(14,159,140,0.18)',
            borderRadius: 18,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 'clamp(30px, 2.4vw, 46px)',
              lineHeight: 1,
              letterSpacing: '-0.03em',
              color: INK,
            }}
          >
            {dollarsM(x.valueAtStakeUsd)}
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              color: TEAL_DEEP,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Value at stake
            {x.baselineLockedAt ? ` · baseline locked ${formatDate(x.baselineLockedAt)}` : ''}
          </div>
        </div>
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12,
        }}
      >
        <MiniMetric
          label="Deliverables"
          value={String(x?.deliverablesCount ?? 0)}
          sub={x?.topDeliverableQuality ? `top ${x.topDeliverableQuality}/100` : undefined}
          accent={PLUM}
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
          sub={x?.primaryTopicTitle ? `primary · ${x.primaryTopicTitle.slice(0, 24)}` : undefined}
          accent={PLUM}
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
          accent={x?.contradictionsCount ? AMBER : INK_MUTED}
        />
      </div>
    </Link>
  );
}

export default async function EngagementsListPage() {
  const activeClient = await getActiveClientRow();
  const rows = await getAllActiveEngagements(undefined, activeClient?.id ?? null);
  const extras = await loadEngagementSummaries(rows.map((r) => r.id));
  const newProgramHref = activeClient?.key
    ? `/programs/new?client=${encodeURIComponent(activeClient.key)}`
    : '/programs/new';

  const latestTurn = rows
    .map((row) => extras[row.id]?.lastTurnAt ?? null)
    .filter((value): value is string => !!value)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: PAGE_BG,
        color: INK,
        fontFamily: SANS,
        padding: '28px 24px 56px',
      }}
    >
      <div style={{ maxWidth: 1360, margin: '0 auto' }}>
        <section
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 30,
            border: `1px solid ${LINE}`,
            background:
              'radial-gradient(circle at top left, rgba(90,166,248,0.18), transparent 30%), radial-gradient(circle at top right, rgba(14,159,140,0.14), transparent 28%), linear-gradient(180deg, #FFFDFC 0%, #F6F1E8 100%)',
            padding: '42px 32px 30px',
            boxShadow: '0 24px 80px rgba(23,20,17,0.07)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.15fr) minmax(280px, 0.85fr)',
              gap: 28,
              alignItems: 'start',
            }}
            className="engagements-hero-grid"
          >
            <div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: TEAL,
                  marginBottom: 16,
                }}
              >
                Programs
              </div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: SERIF,
                  fontSize: 'clamp(44px, 5.8vw, 86px)',
                  lineHeight: 0.92,
                  letterSpacing: '-0.06em',
                  color: INK,
                  maxWidth: 900,
                }}
              >
                Programs for {activeClient?.name ?? 'the current tenant'}.
              </h1>
              <p
                style={{
                  margin: '22px 0 0',
                  maxWidth: 760,
                  fontSize: 'clamp(18px, 1.4vw, 25px)',
                  lineHeight: 1.48,
                  color: INK_SOFT,
                }}
              >
                The list should read like a decision surface, not an admin table. Warm canvas for clarity, richer type
                for fast scanning, and enough operational signal up front that a leader can decide where to click next.
              </p>
            </div>

            <div
              style={{
                borderRadius: 24,
                padding: 22,
                background: 'rgba(255,255,255,0.72)',
                border: `1px solid ${LINE}`,
              }}
            >
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: INK_MUTED,
                  marginBottom: 14,
                }}
              >
                Portfolio read
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  `${rows.length} active programs${activeClient ? ' for this account' : ''}`,
                  latestTurn ? `Latest dialogue moved ${relTime(latestTurn)}` : 'No turns yet on the active list',
                  'Use this route when you want sponsor, contradiction, and deliverable signal at scan speed',
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                      fontSize: 15,
                      lineHeight: 1.55,
                      color: INK,
                    }}
                  >
                    <span style={{ color: TEAL, fontWeight: 800 }}>•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Link
                href={newProgramHref}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 18,
                  padding: '12px 18px',
                  borderRadius: 999,
                  background: TEAL,
                  color: '#08120F',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                + New program
              </Link>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 26 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 18,
              flexWrap: 'wrap',
              marginBottom: 16,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: TEAL,
                  marginBottom: 8,
                }}
              >
                Portfolio list
              </div>
              <div
                style={{
                  fontFamily: SERIF,
                  fontSize: 'clamp(28px, 2.2vw, 40px)',
                  lineHeight: 1.02,
                  letterSpacing: '-0.04em',
                  color: INK,
                }}
              >
                Open the live work.
              </div>
            </div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 11,
                color: INK_MUTED,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {latestTurn ? `latest turn · ${relTime(latestTurn)}` : 'conversation not yet started'}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            {rows.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  borderRadius: 22,
                  border: `1px solid ${LINE}`,
                  background: PANEL_BG,
                  color: INK_SOFT,
                  fontSize: 15,
                  lineHeight: 1.6,
                }}
              >
                No active programs yet{activeClient ? ` for ${activeClient.name}` : ''}. Start a new program to seed
                the portfolio with live scope, sponsors, contradictions, and deliverables.
              </div>
            ) : (
              rows.map((e) => <EngagementCard key={e.id} e={e} x={extras[e.id]} />)
            )}
          </div>
        </section>

        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media (max-width: 1080px) {
                .engagements-hero-grid {
                  grid-template-columns: 1fr !important;
                }
              }
            `,
          }}
        />
      </div>
    </div>
  );
}
