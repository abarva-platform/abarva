'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { FilterPillStrip } from '@/components/shell/FilterPillStrip';
import { SHELL } from '@/lib/shell/shell-tokens';
import { TOWER_INDEX_VIEW, type PressureItem } from '@/lib/tower/shell-tower-fixture';

// ---------------------------------------------------------------------------
// Severity helpers
// ---------------------------------------------------------------------------

function severityBorderColor(severity: PressureItem['severity']): string {
  if (severity === 'high') return SHELL.RUST_BG;
  if (severity === 'medium') return SHELL.AMBER_DOT;
  return SHELL.MINT_LINE;
}

function severityLabelColor(severity: PressureItem['severity']): string {
  if (severity === 'high') return SHELL.RUST_TEXT;
  if (severity === 'medium') return SHELL.PEACH_TEXT;
  return SHELL.MINT_TEXT;
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
        padding: '3px 8px',
        borderRadius: 10,
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
// Pressure card
// ---------------------------------------------------------------------------

function PressureCard({ item }: { item: PressureItem }) {
  const borderColor = severityBorderColor(item.severity);
  const labelColor = severityLabelColor(item.severity);
  const dColor = deltaColor(item);

  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 12,
        padding: 20,
        borderLeft: `3px solid ${borderColor}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {/* Top row: severity label + title + status pill */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: labelColor,
            flexShrink: 0,
          }}
        >
          {item.severity}
        </span>
        <Link
          href={`/tower/pressures/${item.id}`}
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 16,
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

      {/* Hero number row */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <span
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 32,
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
            fontSize: 12,
            color: SHELL.INK_SOFT,
            lineHeight: 1.3,
          }}
        >
          {item.heroLabel}
        </span>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 12,
            color: dColor,
            marginLeft: 'auto',
            flexShrink: 0,
          }}
        >
          {item.delta}
        </span>
      </div>

      {/* Top driver */}
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.INK_SOFT,
          marginTop: 8,
          lineHeight: 1.5,
        }}
      >
        {item.topDriver}
      </div>

      {/* Atlas sentence */}
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 12,
          fontStyle: 'italic',
          color: SHELL.INK_MUTED,
          marginTop: 4,
          lineHeight: 1.55,
        }}
      >
        {item.atlasSentence}
      </div>

      {/* Action link */}
      <div style={{ marginTop: 14 }}>
        <Link
          href={`/tower/pressures/${item.id}`}
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
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
        background: SHELL.GRAY_BG,
        borderRadius: 10,
        padding: '32px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 15,
          color: SHELL.INK_MUTED,
          marginBottom: 6,
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
// Cross-program activity row
// ---------------------------------------------------------------------------

interface ActivityRow {
  ref: string;
  phase: string;
  note: string;
  when: string;
  href?: string;
}

const ACTIVITY_ROWS: ActivityRow[] = [
  { ref: 'APX-CDP-2026', phase: 'Synthesis phase', note: 'Workshop 5 outstanding', when: '2h ago', href: '/tower/programs/apx-cdp-2026' },
  { ref: 'APX-CC-2026', phase: 'Build phase', note: 'Activate gate approaching', when: '4h ago' },
  { ref: 'APX-DFV2-2025', phase: 'Operate', note: 'steady state · Atlas monitoring', when: 'Mar 28' },
];

function ActivityStrip() {
  return (
    <div
      style={{
        marginTop: 32,
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 20px',
          borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Link
          href="/tower/activity"
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
            textDecoration: 'none',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          Cross-program activity →
        </Link>
      </div>

      {/* Rows */}
      {ACTIVITY_ROWS.map((row, i) => {
        const rowContent = (
          <>
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                letterSpacing: '0.08em',
                color: SHELL.INK_SOFT,
                flexShrink: 0,
                minWidth: 120,
              }}
            >
              [{row.ref}]
            </span>
            <span
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 13,
                color: SHELL.INK,
                flex: 1,
              }}
            >
              {row.phase}
              <span
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 12,
                  color: SHELL.INK_SOFT,
                  marginLeft: 8,
                }}
              >
                · {row.note}
              </span>
            </span>
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                color: SHELL.INK_MUTED,
                flexShrink: 0,
              }}
            >
              {row.when}
            </span>
          </>
        );

        const sharedStyle = {
          display: 'flex',
          flexDirection: 'row' as const,
          alignItems: 'baseline' as const,
          gap: 16,
          padding: '11px 20px',
          borderBottom:
            i < ACTIVITY_ROWS.length - 1 ? `1px solid ${SHELL.CARD_LINE_SOFT}` : undefined,
        };

        return row.href ? (
          <Link
            key={row.ref}
            href={row.href}
            style={{ ...sharedStyle, textDecoration: 'none' }}
          >
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
        {/* Modal header */}
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

        {/* Field: Title */}
        <div>
          <label style={labelStyle}>Pressure Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Margin Compression"
            style={inputStyle}
          />
        </div>

        {/* Field: Severity */}
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
                    transition: 'background 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Field: Driver */}
        <div>
          <label style={labelStyle}>Top Driver</label>
          <input
            type="text"
            value={driver}
            onChange={(e) => setDriver(e.target.value)}
            placeholder="One sentence describing the root cause"
            style={inputStyle}
          />
        </div>

        {/* Field: Hero stat (optional) */}
        <div>
          <label style={labelStyle}>Headline Metric (optional)</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              value={heroValue}
              onChange={(e) => setHeroValue(e.target.value)}
              placeholder="$2.4M"
              style={{ ...inputStyle, width: '40%', flex: '0 0 auto' }}
            />
            <input
              type="text"
              value={heroLabel}
              onChange={(e) => setHeroLabel(e.target.value)}
              placeholder="vs $1.8M budget"
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
        </div>

        {/* Field: Related program (optional) */}
        <div>
          <label style={labelStyle}>Related Program (optional)</label>
          <select
            value={relatedProgram}
            onChange={(e) => setRelatedProgram(e.target.value)}
            style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none' }}
          >
            <option value="">(none)</option>
            <option value="APX-CDP-2026">APX-CDP-2026</option>
            <option value="APX-CC-2026">APX-CC-2026</option>
            <option value="APX-SAP-2026">APX-SAP-2026</option>
            <option value="APX-LPM-2026">APX-LPM-2026</option>
            <option value="APX-DFV2-2025">APX-DFV2-2025</option>
          </select>
        </div>

        {/* Atlas note */}
        <div
          style={{
            background: SHELL.PAPER_SOFT,
            borderRadius: 6,
            padding: '10px 14px',
            marginTop: -4,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <span style={{ fontFamily: SHELL.MONO, fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: SHELL.INK_MUTED }}>
            Atlas
          </span>
          <span style={{ fontFamily: SHELL.SANS, fontSize: 11, color: SHELL.INK_MUTED, lineHeight: 1.5 }}>
            Atlas will begin monitoring this pressure and surface it in the Tower activity stream.
          </span>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
          {submitted ? (
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 11,
                color: SHELL.MINT_TEXT,
                letterSpacing: '0.08em',
                alignSelf: 'center',
              }}
            >
              ✓ Pressure added to Tower
            </span>
          ) : (
            <>
              <button
                onClick={onClose}
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  color: SHELL.INK,
                  background: 'none',
                  border: `1px solid ${SHELL.CARD_LINE}`,
                  borderRadius: 6,
                  padding: '8px 16px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!isValid}
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  color: SHELL.PAPER,
                  background: isValid ? SHELL.INK : SHELL.INK_MUTED,
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 16px',
                  cursor: isValid ? 'pointer' : 'not-allowed',
                  transition: 'background 0.15s',
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

export function TowerIndexPage() {
  const [showNewPressure, setShowNewPressure] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
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

  return (
    <AppShell
      surface="tower"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Control Tower · 3 active pressures',
      }}
      middleStrip={<FilterPillStrip pills={filterPills} />}
    >
      <AgentColumn
        agent={{ initials: 'At', name: 'Atlas', role: 'Cross-Program Synthesizer' }}
        quote={TOWER_INDEX_VIEW.agentQuote}
        agentContext={TOWER_INDEX_VIEW.agentContext}
        actions={TOWER_INDEX_VIEW.actions}
        onActionClick={(letter) => {
          if (letter === 'A') router.push('/tower?filter=high');
          else if (letter === 'B') router.push('/tower/programs/apx-cdp-2026');
          else if (letter === 'C') setShowNewPressure(true);
        }}
      />

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '24px 32px',
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', gap: 12 }}>
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
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
                fontSize: 11,
                fontWeight: 600,
                color: SHELL.PAPER,
                background: SHELL.RUST_TEXT,
                padding: '2px 9px',
                borderRadius: 10,
                lineHeight: 1.4,
              }}
            >
              {TOWER_INDEX_VIEW.highCount} high
            </span>
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 11,
                fontWeight: 600,
                color: SHELL.INK,
                background: SHELL.PEACH_BG,
                padding: '2px 9px',
                borderRadius: 10,
                lineHeight: 1.4,
              }}
            >
              {TOWER_INDEX_VIEW.activeCount} total
            </span>
          </div>
          <button
            onClick={() => setShowNewPressure(true)}
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              letterSpacing: '0.08em',
              color: SHELL.INK_SOFT,
              background: 'none',
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 5,
              padding: '4px 10px',
              cursor: 'pointer',
            }}
          >
            + Set new pressure
          </button>
        </div>

        {/* Pressure cards grid */}
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
            }}
          >
            {filtered.map((item) => (
              <PressureCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Cross-program activity strip */}
        <ActivityStrip />

        {/* Lens links */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${SHELL.CARD_LINE}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <a href="/tower/outcomes" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: SHELL.MONO, fontSize: 11, color: SHELL.INK_SOFT,
            textDecoration: 'none',
          }}>
            <span>→</span>
            <span>Value lens · outcome realization</span>
          </a>
          <a href="/tower/lens/adoption" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: SHELL.MONO, fontSize: 11, color: SHELL.INK_SOFT,
            textDecoration: 'none',
          }}>
            <span>→</span>
            <span>Adoption lens · usage tracking</span>
          </a>
          <a href="/tower/lens/risk" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: SHELL.MONO, fontSize: 11, color: SHELL.INK_SOFT,
            textDecoration: 'none',
          }}>
            <span>→</span>
            <span>Risk lens · open risk items</span>
          </a>
        </div>
      </div>

      {showNewPressure && (
        <NewPressureModal onClose={() => setShowNewPressure(false)} />
      )}
    </AppShell>
  );
}
