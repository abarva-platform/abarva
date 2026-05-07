'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import type { Artifact } from '@/lib/agent/artifacts';
import { FilterPillStrip } from '@/components/shell/FilterPillStrip';
import { SHELL } from '@/lib/shell/shell-tokens';
import { TOWER_INDEX_VIEW, type PressureItem } from '@/lib/tower/shell-tower-fixture';
import { AtlasSynthesisQuote } from '@/components/tower/AtlasSynthesisQuote';

// ---------------------------------------------------------------------------
// Severity helpers
// ---------------------------------------------------------------------------

function severityBorderColor(severity: PressureItem['severity']): string {
  if (severity === 'high') return SHELL.RUST_TEXT;
  if (severity === 'medium') return SHELL.PEACH_TEXT;
  return SHELL.MINT_TEXT;
}

function severityLabelColor(severity: PressureItem['severity']): string {
  if (severity === 'high') return SHELL.RUST_TEXT;
  if (severity === 'medium') return SHELL.PEACH_TEXT;
  return SHELL.MINT_TEXT;
}

function severityBgColor(severity: PressureItem['severity']): string {
  if (severity === 'high') return SHELL.RUST_BG;
  if (severity === 'medium') return SHELL.PEACH_BG;
  return SHELL.MINT_BG;
}

function deltaColor(item: PressureItem): string {
  if (item.deltaDir === 'down') return SHELL.MINT_TEXT;
  if (item.severity === 'high') return SHELL.RUST_TEXT;
  return SHELL.PEACH_TEXT;
}

// ---------------------------------------------------------------------------
// Status pill
// ---------------------------------------------------------------------------

function StatusPill({ status }: { status: PressureItem['status'] }) {
  const bg =
    status === 'active'
      ? SHELL.RUST_BG
      : status === 'watching'
        ? SHELL.PEACH_BG
        : SHELL.MINT_BG;
  const color =
    status === 'active'
      ? SHELL.RUST_TEXT
      : status === 'watching'
        ? SHELL.PEACH_TEXT
        : SHELL.MINT_TEXT;
  const label =
    status === 'active' ? 'Active' : status === 'watching' ? 'Watching' : 'Resolved';

  return (
    <span
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 9,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        padding: '2px 7px',
        borderRadius: 8,
        background: bg,
        color,
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Pressure card — compact list style
// ---------------------------------------------------------------------------

function PressureCard({ item }: { item: PressureItem }) {
  const borderColor = severityBorderColor(item.severity);
  const labelColor = severityLabelColor(item.severity);
  const severityBg = severityBgColor(item.severity);
  const dColor = deltaColor(item);

  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        borderLeft: `3px solid ${borderColor}`,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {/* Top row: severity badge + title + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 8,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: labelColor,
            background: severityBg,
            padding: '2px 6px',
            borderRadius: 4,
            flexShrink: 0,
          }}
        >
          {item.severity}
        </span>
        <Link
          href={`/tower/pressures/${item.id}`}
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 15,
            fontWeight: 700,
            color: SHELL.INK,
            flex: 1,
            lineHeight: 1.2,
            textDecoration: 'none',
          }}
        >
          {item.title}
        </Link>
        <StatusPill status={item.status} />
      </div>

      {/* Hero stat row */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 26,
            fontWeight: 700,
            color: SHELL.INK,
            lineHeight: 1,
          }}
        >
          {item.heroStat}
        </span>
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 11,
            color: SHELL.INK_SOFT,
            lineHeight: 1.3,
          }}
        >
          {item.heroLabel}
        </span>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            color: dColor,
            marginLeft: 'auto',
            flexShrink: 0,
          }}
        >
          {item.delta}
        </span>
      </div>

      {/* Driver + Atlas sentence */}
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 12,
          color: SHELL.INK_SOFT,
          lineHeight: 1.5,
        }}
      >
        {item.topDriver}
      </div>
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 11,
          fontStyle: 'italic',
          color: SHELL.INK_MUTED,
          lineHeight: 1.5,
          borderTop: `1px solid ${SHELL.CARD_LINE}`,
          paddingTop: 6,
        }}
      >
        {item.atlasSentence}
      </div>

      {/* Action link */}
      <div>
        <Link
          href={`/tower/pressures/${item.id}`}
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: SHELL.INK_SOFT,
            textDecoration: 'none',
          }}
        >
          View detail →
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div
      style={{
        background: SHELL.PAPER_SOFT,
        borderRadius: 8,
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 14,
          color: SHELL.INK_MUTED,
          marginBottom: 4,
        }}
      >
        No pressures in this filter
      </div>
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 12,
          color: SHELL.INK_MUTED,
        }}
      >
        Try a different filter to see pressure items
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cross-program activity strip
// ---------------------------------------------------------------------------

interface ActivityRow {
  ref: string;
  phase: string;
  note: string;
  when: string;
  href?: string;
}

const ACTIVITY_ROWS: ActivityRow[] = [
  { ref: 'APX-CDP-2026', phase: 'Design phase', note: 'Architecture sprint active', when: '2h ago', href: '/tower/programs/apx-cdp-2026' },
  { ref: 'APX-CC-2026', phase: 'Execution Roadmap phase', note: 'Gate approaching', when: '4h ago' },
  { ref: 'APX-DFV2-2025', phase: 'Tower Handoff', note: 'Steady state · Atlas monitoring', when: 'Mar 28' },
];

function ActivityStrip() {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '9px 14px',
          borderBottom: `1px solid ${SHELL.CARD_LINE}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          Cross-program activity
        </span>
        <Link
          href="/tower/activity"
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_SOFT,
            textDecoration: 'none',
            letterSpacing: '0.10em',
          }}
        >
          All →
        </Link>
      </div>
      {ACTIVITY_ROWS.map((row, i) => {
        const rowContent = (
          <>
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 9,
                letterSpacing: '0.08em',
                color: SHELL.INK_MUTED,
                flexShrink: 0,
              }}
            >
              {row.ref}
            </span>
            <span style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK, flex: 1 }}>
              {row.phase}
              <span style={{ color: SHELL.INK_SOFT, marginLeft: 6 }}>· {row.note}</span>
            </span>
            <span style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED, flexShrink: 0 }}>
              {row.when}
            </span>
          </>
        );
        const sharedStyle = {
          display: 'flex',
          alignItems: 'baseline' as const,
          gap: 10,
          padding: '8px 14px',
          borderBottom: i < ACTIVITY_ROWS.length - 1 ? `1px solid ${SHELL.CARD_LINE}` : undefined,
        };
        return row.href ? (
          <Link key={row.ref} href={row.href} style={{ ...sharedStyle, textDecoration: 'none' }}>
            {rowContent}
          </Link>
        ) : (
          <div key={row.ref} style={sharedStyle}>
            {rowContent}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Atlas brief sidebar
// ---------------------------------------------------------------------------

function AtlasBriefSidebar({
  quote,
  actions,
}: {
  quote: string;
  actions: typeof TOWER_INDEX_VIEW.actions;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Atlas brief card */}
      <div
        style={{
          background: SHELL.CARD_WHITE,
          border: `1px solid ${SHELL.CARD_LINE}`,
          borderRadius: 10,
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
            }}
          >
            Atlas
          </span>
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              letterSpacing: '0.12em',
              color: SHELL.INK_MUTED,
            }}
          >
            · Cross-program synthesis
          </span>
        </div>
        <p
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK,
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {quote}
        </p>

        {/* Action list */}
        <div
          style={{
            borderTop: `1px solid ${SHELL.CARD_LINE}`,
            paddingTop: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {actions.map((action) => (
            <div
              key={action.letter}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  fontWeight: 700,
                  color: SHELL.PAPER,
                  background: SHELL.INK,
                  borderRadius: '50%',
                  width: 16,
                  height: 16,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {action.letter}
              </span>
              <div>
                <div
                  style={{
                    fontFamily: SHELL.SANS,
                    fontSize: 12,
                    fontWeight: 700,
                    color: SHELL.INK,
                    lineHeight: 1.3,
                  }}
                >
                  {action.text}
                </div>
                {action.detail && (
                  <div
                    style={{
                      fontFamily: SHELL.SANS,
                      fontSize: 11,
                      color: SHELL.INK_MUTED,
                      lineHeight: 1.4,
                      marginTop: 1,
                    }}
                  >
                    {action.detail}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity strip */}
      <ActivityStrip />

      {/* Lens quick links */}
      <div
        style={{
          background: SHELL.CARD_WHITE,
          border: `1px solid ${SHELL.CARD_LINE}`,
          borderRadius: 10,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
            marginBottom: 2,
          }}
        >
          Tower lenses
        </div>
        {[
          { href: '/tower/outcomes', label: 'Value · outcome realization' },
          { href: '/tower/lens/adoption', label: 'Adoption · usage tracking' },
          { href: '/tower/lens/risk', label: 'Risk · open risk items' },
          { href: '/tower/lens/inventory', label: 'Inventory · use cases & vendor stack' },
          { href: '/tower/lens/cost', label: 'Cost · AI cloud spend & budget variance' },
        ].map(({ href, label }) => (
          <a
            key={href}
            href={href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_SOFT,
              textDecoration: 'none',
            }}
          >
            <span style={{ color: SHELL.INK_MUTED }}>→</span>
            <span>{label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat strip
// ---------------------------------------------------------------------------

interface StatItem {
  label: string;
  value: string | number;
  tone?: 'risk' | 'warn' | 'ok' | 'neutral';
}

function StatStrip({ stats }: { stats: StatItem[] }) {
  function valueColor(tone: StatItem['tone']): string {
    if (tone === 'risk') return SHELL.RUST_TEXT;
    if (tone === 'warn') return SHELL.PEACH_TEXT;
    if (tone === 'ok') return SHELL.MINT_TEXT;
    return SHELL.INK;
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        borderBottom: `1px solid ${SHELL.CARD_LINE}`,
        background: SHELL.CARD_WHITE,
      }}
    >
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          style={{
            flex: 1,
            padding: '10px 20px',
            borderRight: i < stats.length - 1 ? `1px solid ${SHELL.CARD_LINE}` : undefined,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 8,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
            }}
          >
            {stat.label}
          </span>
          <span
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 22,
              fontWeight: 700,
              color: valueColor(stat.tone),
              lineHeight: 1,
            }}
          >
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// New pressure modal
// ---------------------------------------------------------------------------

type NewSeverity = 'High' | 'Medium' | 'Low watch' | null;

interface NewPressureModalProps {
  onClose: () => void;
}

function NewPressureModal({ onClose }: NewPressureModalProps) {
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<NewSeverity>(null);
  const [driver, setDriver] = useState('');
  const [heroValue, setHeroValue] = useState('');
  const [heroLabel, setHeroLabel] = useState('');
  const [relatedProgram, setRelatedProgram] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isValid = title.trim().length > 0 && severity !== null && driver.trim().length > 0;

  function handleAdd() {
    if (!isValid) return;
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  }

  const severityOptions: { label: NonNullable<NewSeverity>; activeBg: string; activeColor: string }[] = [
    { label: 'High', activeBg: SHELL.RUST_BG, activeColor: SHELL.RUST_TEXT },
    { label: 'Medium', activeBg: SHELL.PEACH_BG, activeColor: SHELL.PEACH_TEXT },
    { label: 'Low watch', activeBg: SHELL.MINT_BG, activeColor: SHELL.MINT_TEXT },
  ];

  const inputStyle: React.CSSProperties = {
    fontFamily: SHELL.SANS,
    fontSize: 13,
    color: SHELL.INK,
    background: SHELL.CARD_WHITE,
    border: `1px solid ${SHELL.CARD_LINE}`,
    borderRadius: 6,
    padding: '8px 12px',
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: SHELL.MONO,
    fontSize: 9,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: SHELL.INK_MUTED,
    marginBottom: 6,
    display: 'block',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: SHELL.PAPER,
          borderRadius: 12,
          padding: '28px 32px',
          maxWidth: 520,
          width: '90%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: SHELL.SERIF, fontSize: 18, fontWeight: 700, color: SHELL.INK }}>
            Set new pressure
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: SHELL.MONO,
              fontSize: 14,
              color: SHELL.INK_MUTED,
              padding: '2px 6px',
            }}
          >
            ×
          </button>
        </div>

        <div>
          <label style={labelStyle}>Pressure title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Margin Compression" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Severity</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {severityOptions.map((opt) => {
              const isSelected = severity === opt.label;
              return (
                <button
                  key={opt.label}
                  onClick={() => setSeverity(opt.label)}
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: `1px solid ${isSelected ? 'transparent' : SHELL.CARD_LINE}`,
                    background: isSelected ? opt.activeBg : SHELL.CARD_WHITE,
                    color: isSelected ? opt.activeColor : SHELL.INK_SOFT,
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Top driver</label>
          <input type="text" value={driver} onChange={(e) => setDriver(e.target.value)} placeholder="One sentence describing the root cause" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Headline metric (optional)</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input type="text" value={heroValue} onChange={(e) => setHeroValue(e.target.value)} placeholder="$2.4M" style={{ ...inputStyle, width: '40%', flex: '0 0 auto' }} />
            <input type="text" value={heroLabel} onChange={(e) => setHeroLabel(e.target.value)} placeholder="vs $1.8M budget" style={{ ...inputStyle, flex: 1 }} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Related program (optional)</label>
          <select value={relatedProgram} onChange={(e) => setRelatedProgram(e.target.value)} style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none' }}>
            <option value="">(none)</option>
            <option value="APX-CDP-2026">APX-CDP-2026</option>
            <option value="APX-CC-2026">APX-CC-2026</option>
            <option value="APX-SAP-2026">APX-SAP-2026</option>
            <option value="APX-LPM-2026">APX-LPM-2026</option>
            <option value="APX-DFV2-2025">APX-DFV2-2025</option>
          </select>
        </div>

        <div
          style={{
            background: SHELL.PAPER_SOFT,
            borderRadius: 6,
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <span style={{ fontFamily: SHELL.MONO, fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: SHELL.INK_MUTED }}>Atlas</span>
          <span style={{ fontFamily: SHELL.SANS, fontSize: 11, color: SHELL.INK_MUTED, lineHeight: 1.5 }}>
            Atlas will begin monitoring this pressure and surface it in the Tower activity stream.
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          {submitted ? (
            <span style={{ fontFamily: SHELL.MONO, fontSize: 11, color: SHELL.MINT_TEXT, letterSpacing: '0.08em', alignSelf: 'center' }}>
              ✓ Pressure added to Tower
            </span>
          ) : (
            <>
              <button
                onClick={onClose}
                style={{
                  fontFamily: SHELL.MONO, fontSize: 11, letterSpacing: '0.08em',
                  color: SHELL.INK, background: 'none',
                  border: `1px solid ${SHELL.CARD_LINE}`, borderRadius: 6,
                  padding: '8px 16px', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!isValid}
                style={{
                  fontFamily: SHELL.MONO, fontSize: 11, letterSpacing: '0.08em',
                  color: SHELL.PAPER, background: isValid ? SHELL.INK : SHELL.INK_MUTED,
                  border: 'none', borderRadius: 6,
                  padding: '8px 16px', cursor: isValid ? 'pointer' : 'not-allowed',
                }}
              >
                Add to Tower
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

interface TowerIndexPageProps {
  tenantName?: string;
  context?: string;
  provenanceSlot?: ReactNode;
  portfolioSummarySlot?: ReactNode;
  cascadeGraphSlot?: ReactNode;
  towerHandoffSlot?: ReactNode;
  towerSubmenuSlot?: ReactNode;
  towerLensSlot?: ReactNode;
}

export function TowerIndexPage({
  tenantName = 'AbarVa Client',
  context = 'Control Tower',
  provenanceSlot: _provenanceSlot,
  portfolioSummarySlot,
  cascadeGraphSlot,
  towerHandoffSlot,
  towerSubmenuSlot,
  towerLensSlot,
}: TowerIndexPageProps = {}) {
  void _provenanceSlot;
  const [showNewPressure, setShowNewPressure] = useState(false);
  const [synthesisQuote, setSynthesisQuote] = useState(TOWER_INDEX_VIEW.agentQuote);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Artifact handler kept for AppShell compatibility
  const [, setAtlasArtifacts] = useState<Artifact[]>([]);
  const handleAtlasArtifact = useCallback((artifact: Artifact) => {
    setAtlasArtifacts((prev) => {
      const key = JSON.stringify(artifact);
      if (prev.some((a) => JSON.stringify(a) === key)) return prev;
      return [...prev, artifact];
    });
  }, []);

  const activeFilter = searchParams?.get('filter') ?? 'all';

  const filtered = TOWER_INDEX_VIEW.pressures.filter(p => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'high') return p.severity === 'high';
    if (activeFilter === 'medium') return p.severity === 'medium';
    if (activeFilter === 'low') return p.severity === 'low';
    if (activeFilter === 'resolved') return p.status === 'resolved';
    return true;
  });

  const filterPills = [
    { key: 'all', label: 'All', active: activeFilter === 'all', count: TOWER_INDEX_VIEW.pressures.length, onClick: () => router.push('/tower') },
    { key: 'high', label: 'High', active: activeFilter === 'high', count: TOWER_INDEX_VIEW.pressures.filter(p => p.severity === 'high').length, onClick: () => router.push('/tower?filter=high') },
    { key: 'medium', label: 'Medium', active: activeFilter === 'medium', count: TOWER_INDEX_VIEW.pressures.filter(p => p.severity === 'medium').length, onClick: () => router.push('/tower?filter=medium') },
    { key: 'low', label: 'Low watch', active: activeFilter === 'low', count: TOWER_INDEX_VIEW.pressures.filter(p => p.severity === 'low').length, onClick: () => router.push('/tower?filter=low') },
    { key: 'resolved', label: 'Resolved', active: activeFilter === 'resolved', count: 0, onClick: () => router.push('/tower?filter=resolved') },
  ];

  const stats: StatItem[] = [
    { label: 'Active pressures', value: TOWER_INDEX_VIEW.activeCount, tone: 'warn' },
    { label: 'High severity', value: TOWER_INDEX_VIEW.highCount, tone: 'risk' },
    { label: 'Programs in Tower', value: 4, tone: 'neutral' },
    { label: 'Initiatives observed', value: 6, tone: 'neutral' },
    { label: 'Gate items due', value: 2, tone: 'warn' },
  ];

  return (
    <AppShell
      surface="tower"
      topBarProps={{ tenantName, showLocked: true, context }}
      middleStrip={towerSubmenuSlot ?? <FilterPillStrip pills={filterPills} />}
      onArtifact={handleAtlasArtifact}
    >
      {/* Hidden synthesis streamer */}
      <div style={{ display: 'none' }} aria-hidden>
        <AtlasSynthesisQuote
          fallback={TOWER_INDEX_VIEW.agentQuote}
          onLoaded={setSynthesisQuote}
        />
      </div>

      {/* Stat strip — anchored below submenu */}
      <StatStrip stats={stats} />

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 28px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          minHeight: 0,
        }}
      >
        {/* Primary 2-column layout: pressure grid + Atlas sidebar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 300px',
            gap: 20,
            alignItems: 'start',
          }}
        >
          {/* Left: pressure grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Section header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 9,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: SHELL.INK_MUTED,
                  }}
                >
                  Active pressures
                </span>
                <span
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 10,
                    fontWeight: 700,
                    color: SHELL.PAPER,
                    background: SHELL.RUST_TEXT,
                    padding: '1px 7px',
                    borderRadius: 8,
                    lineHeight: 1.5,
                  }}
                >
                  {TOWER_INDEX_VIEW.highCount} high
                </span>
                <span
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 10,
                    fontWeight: 700,
                    color: SHELL.INK,
                    background: SHELL.PEACH_BG,
                    padding: '1px 7px',
                    borderRadius: 8,
                    lineHeight: 1.5,
                  }}
                >
                  {TOWER_INDEX_VIEW.activeCount} total
                </span>
              </div>
              <button
                onClick={() => setShowNewPressure(true)}
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  letterSpacing: '0.08em',
                  color: SHELL.INK_SOFT,
                  background: 'none',
                  border: `1px solid ${SHELL.CARD_LINE}`,
                  borderRadius: 5,
                  padding: '4px 10px',
                  cursor: 'pointer',
                }}
              >
                + Set pressure
              </button>
            </div>

            {/* Filter pills when no submenu slot */}
            {!towerSubmenuSlot && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {filterPills.map((pill) => (
                  <button
                    key={pill.key}
                    onClick={pill.onClick}
                    style={{
                      fontFamily: SHELL.MONO,
                      fontSize: 10,
                      letterSpacing: '0.08em',
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: `1px solid ${pill.active ? SHELL.INK : SHELL.CARD_LINE}`,
                      background: pill.active ? SHELL.INK : SHELL.CARD_WHITE,
                      color: pill.active ? SHELL.PAPER : SHELL.INK_SOFT,
                      cursor: 'pointer',
                    }}
                  >
                    {pill.label} {pill.count > 0 ? `(${pill.count})` : ''}
                  </button>
                ))}
              </div>
            )}

            {/* Pressure cards */}
            {filtered.length === 0 ? (
              <EmptyState />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered.map((item) => (
                  <PressureCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* Right: Atlas brief + activity + lens links */}
          <AtlasBriefSidebar
            quote={synthesisQuote}
            actions={TOWER_INDEX_VIEW.actions}
          />
        </div>

        {/* Tower lens tab content */}
        {towerLensSlot && (
          <div>{towerLensSlot}</div>
        )}

        {/* Portfolio summary — below the fold; supporting detail */}
        {portfolioSummarySlot && (
          <div>
            <div style={{ fontFamily: SHELL.MONO, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: SHELL.INK_MUTED, marginBottom: 8 }}>
              Portfolio summary
            </div>
            {portfolioSummarySlot}
          </div>
        )}

        {/* Portfolio cascade graph */}
        {cascadeGraphSlot && (
          <div>{cascadeGraphSlot}</div>
        )}

        {/* Tower handoff panels */}
        {towerHandoffSlot && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 9,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: SHELL.INK_MUTED,
              }}
            >
              Handoffs
            </div>
            {towerHandoffSlot}
          </div>
        )}
      </div>

      {showNewPressure && (
        <NewPressureModal onClose={() => setShowNewPressure(false)} />
      )}
    </AppShell>
  );
}
