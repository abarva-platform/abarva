import type { EngagementRow } from '@/lib/db/engagement';
import type { PersonRow } from '@/lib/db/person';

const INK = '#F5F5F0';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const TEAL = '#2DD4C8';
const PURPLE = '#9B6DFF';
const AMBER = '#F5C54A';
const GREEN = '#3FB27F';
const CORAL = '#FF6B4A';
const BORDER = '0.5px solid rgba(255,255,255,0.08)';
const MONO = 'JetBrains Mono, monospace';
const SERIF = 'Georgia, serif';

const PHASE_LABELS = ['Start', 'Diagnose', 'Design', 'Execute', 'Verify'];
const PHASE_COLORS = [TEAL, TEAL, AMBER, '#FB923C', GREEN];

function dollarsM(n: number | null | undefined): string {
  if (n == null || n <= 0) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function relTime(iso: string | null | undefined): string {
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

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

interface Props {
  engagement: EngagementRow;
  sponsor: PersonRow | null;
  turnCount: number;
  lastTurnAt: string | null;
  activePatternsCount: number;
  assignedTopicsCount: number;
  contradictionsCount: number;
  contradictionsScope?: 'program' | 'client' | 'none';
}

function parseCurrencyToUsd(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/,/g, '').trim();
  const match = normalized.match(/\$?\s*(-?\d+(?:\.\d+)?)\s*([kmb])?/i);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;
  const suffix = (match[2] ?? '').toLowerCase();
  const multiplier =
    suffix === 'b' ? 1_000_000_000 :
    suffix === 'm' ? 1_000_000 :
    suffix === 'k' ? 1_000 :
    1;
  return amount * multiplier;
}

// Dense meta-strip that sits at the top of the engagement console.
// Renders 8 signal elements inline: name · industry · phase gate ·
// value at stake · baseline lock · last activity · turn count ·
// sponsor badge. Below: phase progress bar with gate markers.
export function EngagementMetaStrip({
  engagement,
  sponsor,
  turnCount,
  lastTurnAt,
  activePatternsCount,
  assignedTopicsCount,
  contradictionsCount,
  contradictionsScope = 'client',
}: Props) {
  const gates = (engagement.gates_passed as Array<{ phase?: number; signed_at?: string; status?: string }> | null) ?? [];
  const baseline = engagement.baseline_metrics as {
    items?: Array<{ metric: string; baseline_value?: string | number; actual_value?: string | number; savings_usd?: string | number }>;
    savings_usd?: number;
    captured_at?: string;
  } | null;
  const valueAtStake =
    typeof baseline?.savings_usd === 'number'
      ? baseline.savings_usd
      : (() => {
          for (const item of baseline?.items ?? []) {
            const fromSavings = parseCurrencyToUsd(item.savings_usd);
            if (fromSavings && fromSavings > 0) return fromSavings;
            const fromBaseline = parseCurrencyToUsd(item.baseline_value);
            if (fromBaseline && fromBaseline > 0) return fromBaseline;
          }
          return null;
        })();
  const phase2Gate = gates.find((g) => g.phase === 2 && g.status === 'approved');
  const baselineLockedAt =
    baseline?.captured_at
      ?? (Array.isArray(baseline?.items) && baseline.items.length > 0 ? phase2Gate?.signed_at ?? null : phase2Gate?.signed_at ?? null);
  const latestGate = gates
    .filter((g) => g.status === 'approved' && g.signed_at)
    .sort((a, b) => (b.signed_at ?? '').localeCompare(a.signed_at ?? ''))[0];
  const nextGateAt = latestGate?.signed_at
    ? new Date(new Date(latestGate.signed_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const phase = engagement.current_phase;
  const phaseColor = PHASE_COLORS[phase] ?? MUTE;
  const phaseLabel = PHASE_LABELS[phase] ?? `Phase ${phase}`;

  return (
    <div
      style={{
        padding: '18px 24px',
        background: 'rgba(255,255,255,0.03)',
        border: BORDER,
        borderRadius: 12,
        marginBottom: 16,
      }}
    >
      {/* Row 1: name + sponsor badge + phase chip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 9,
            color: TEAL,
            letterSpacing: '0.14em',
            padding: '3px 8px',
            background: 'rgba(45,212,200,0.08)',
            border: `0.5px solid ${TEAL}`,
            borderRadius: 4,
          }}
        >
          {engagement.industry_code}
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, color: INK, letterSpacing: '-0.01em', flex: 1 }}>
          {engagement.name}
        </div>
        {sponsor && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: INK, fontWeight: 500 }}>{sponsor.name}</div>
              <div style={{ fontFamily: MONO, fontSize: 9, color: MUTE, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {sponsor.role ?? 'Sponsor'}
              </div>
            </div>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(45,212,200,0.12)',
                border: '0.5px solid rgba(45,212,200,0.3)',
                color: TEAL,
                fontSize: 11,
                fontFamily: MONO,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {initials(sponsor.name)}
            </div>
          </div>
        )}
      </div>

      {/* Row 2: dense 6-col signal row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
        <MetaCell
          eyebrow="VALUE AT STAKE"
          value={dollarsM(valueAtStake)}
          sub={baselineLockedAt ? `baseline locked ${formatShortDate(baselineLockedAt)}` : 'baseline not yet locked'}
          accent={valueAtStake ? INK : MUTE}
        />
        <MetaCell
          eyebrow="PHASE"
          value={`${phase} · ${phaseLabel}`}
          sub={nextGateAt ? `next gate ~${formatShortDate(nextGateAt)}` : 'no gate history yet'}
          accent={phaseColor}
        />
        <MetaCell
          eyebrow="TURNS"
          value={String(turnCount)}
          sub={lastTurnAt ? `last ${relTime(lastTurnAt)}` : 'no turns yet'}
          accent={TEAL}
        />
        <MetaCell
          eyebrow="PATTERNS"
          value={String(activePatternsCount)}
          sub="active on this program"
          accent={activePatternsCount > 0 ? CORAL : MUTE}
        />
        <MetaCell
          eyebrow="TOPICS"
          value={String(assignedTopicsCount)}
          sub={assignedTopicsCount > 0 ? 'playbooks injecting' : 'none assigned'}
          accent={assignedTopicsCount > 0 ? PURPLE : MUTE}
        />
        <MetaCell
          eyebrow="CONTRADICTIONS"
          value={String(contradictionsCount)}
          sub={contradictionsScope === 'program' ? 'on this program' : 'on this client'}
          accent={contradictionsCount > 0 ? AMBER : MUTE}
        />
      </div>

      {/* Row 3: phase progress bar */}
      <div style={{ marginTop: 16, padding: '10px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {PHASE_LABELS.map((label, i) => {
            const isPast = i < phase;
            const isCurrent = i === phase;
            const gate = gates.find((g) => g.phase === i && g.status === 'approved');
            const dotColor = isPast || isCurrent ? PHASE_COLORS[i] : 'rgba(255,255,255,0.18)';
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: i === PHASE_LABELS.length - 1 ? 0 : 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 80 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: dotColor,
                        border: isCurrent ? `2px solid ${PHASE_COLORS[i]}` : 'none',
                        boxShadow: isCurrent ? `0 0 0 3px rgba(45,212,200,0.12)` : 'none',
                      }}
                    />
                    <div
                      style={{
                        fontFamily: MONO,
                        fontSize: 9,
                        color: isPast || isCurrent ? INK : MUTE,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        fontWeight: isCurrent ? 700 : 500,
                      }}
                    >
                      P{i} · {label}
                    </div>
                  </div>
                  {gate?.signed_at && (
                    <div
                      style={{
                        fontFamily: MONO,
                        fontSize: 9,
                        color: MUTE,
                        letterSpacing: '0.08em',
                        marginLeft: 18,
                        marginTop: 2,
                      }}
                    >
                      gate {formatShortDate(gate.signed_at)}
                    </div>
                  )}
                </div>
                {i < PHASE_LABELS.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      background: isPast ? PHASE_COLORS[i] : 'rgba(255,255,255,0.08)',
                      borderRadius: 1,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MetaCell({
  eyebrow,
  value,
  sub,
  accent,
}: {
  eyebrow: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 9,
          color: MUTE,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        {eyebrow}
      </div>
      <div style={{ fontSize: 20, fontWeight: 500, color: accent, letterSpacing: '-0.01em' }}>
        {value}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, letterSpacing: '0.04em' }}>
        {sub}
      </div>
    </div>
  );
}
