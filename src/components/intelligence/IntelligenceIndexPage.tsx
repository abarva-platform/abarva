'use client';

// Shell-native Intelligence Index page — pattern library browsing surface.
// INT-IDX: AppShell + FilterPillStrip + Sentinel AgentColumn + pattern list.

import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { FilterPillStrip } from '@/components/shell/FilterPillStrip';
import { SHELL } from '@/lib/shell/shell-tokens';
import { INTELLIGENCE_INDEX_VIEW, type IntelligencePattern } from '@/lib/intelligence/shell-intelligence-fixture';

// ─── INT-MOD-SUBMIT: Pattern submission modal ─────────────────────────────────

interface PatternSubmitModalProps {
  onClose: () => void;
}

function PatternSubmitModal({ onClose }: PatternSubmitModalProps) {
  const [name, setName] = useState('');
  const [tier, setTier] = useState<'T1' | 'T2' | 'T3' | null>(null);
  const [problem, setProblem] = useState('');
  const [evidence, setEvidence] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (name.trim() === '' || tier === null) return;
    setSubmitted(true);
    setTimeout(() => onClose(), 2500);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: `1px solid ${SHELL.CARD_LINE}`,
    borderRadius: 6,
    padding: '8px 12px',
    fontFamily: SHELL.SANS,
    fontSize: 13,
    background: SHELL.PAPER,
    color: SHELL.INK,
    boxSizing: 'border-box',
    outline: 'none',
    resize: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: SHELL.MONO,
    fontSize: 9,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: SHELL.INK_MUTED,
    display: 'block',
    marginBottom: 5,
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(12,26,58,0.6)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: SHELL.PAPER,
          borderRadius: 12,
          padding: 32,
          maxWidth: 520,
          width: '100%',
          margin: '10vh auto',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 20,
              fontWeight: 700,
              color: SHELL.INK,
              lineHeight: 1.2,
              marginBottom: 4,
            }}
          >
            Submit a Pattern
          </div>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              color: SHELL.INK_MUTED,
              letterSpacing: '0.1em',
            }}
          >
            Sn · Pattern submission
          </div>
        </div>

        {submitted ? (
          /* Success state */
          <div>
            <div
              style={{
                padding: '14px 16px',
                background: SHELL.MINT_BG,
                border: `1px solid ${SHELL.MINT_LINE}`,
                borderRadius: 8,
                fontFamily: SHELL.SANS,
                fontSize: 13,
                color: SHELL.MINT_TEXT,
                marginBottom: 20,
              }}
            >
              ✓ Submitted — Sentinel will begin review within one cycle.
            </div>
            <button
              onClick={onClose}
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                letterSpacing: '0.08em',
                color: SHELL.INK_SOFT,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Close
            </button>
          </div>
        ) : (
          /* Form */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Pattern name */}
            <div>
              <label style={labelStyle}>Pattern name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
                placeholder="e.g. Predictive Churn Signal"
              />
            </div>

            {/* Tier */}
            <div>
              <label style={labelStyle}>Tier</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['T1', 'T2', 'T3'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTier(t)}
                    style={{
                      padding: '5px 16px',
                      borderRadius: 999,
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: SHELL.MONO,
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      background: tier === t ? SHELL.INK : SHELL.GRAY_BG,
                      color: tier === t ? SHELL.PAPER : SHELL.INK_SOFT,
                      transition: 'background 120ms ease, color 120ms ease',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Problem statement */}
            <div>
              <label style={labelStyle}>Problem statement</label>
              <textarea
                rows={3}
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                style={inputStyle}
                placeholder="Describe the problem this pattern addresses…"
              />
            </div>

            {/* Evidence links */}
            <div>
              <label style={labelStyle}>Evidence links (optional)</label>
              <textarea
                rows={2}
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                style={inputStyle}
                placeholder="https://…"
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <button
                onClick={onClose}
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  color: SHELL.INK_SOFT,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={name.trim() === '' || tier === null}
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  background: name.trim() === '' || tier === null ? SHELL.GRAY_BG : SHELL.INK,
                  color: name.trim() === '' || tier === null ? SHELL.INK_MUTED : SHELL.PAPER,
                  border: 'none',
                  borderRadius: 6,
                  padding: '9px 18px',
                  cursor: name.trim() === '' || tier === null ? 'not-allowed' : 'pointer',
                  transition: 'background 120ms ease, color 120ms ease',
                }}
              >
                Submit for Sentinel review
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tier badge ───────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: IntelligencePattern['tier'] }) {
  const map: Record<IntelligencePattern['tier'], { bg: string; text: string; label: string }> = {
    T3: { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT, label: 'T3 · Use-case' },
    T2: { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT, label: 'T2 · Capability' },
    T1: { bg: SHELL.BLUE_BG, text: '#2a4a7a', label: 'T1 · Foundation' },
  };
  const m = map[tier];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        background: m.bg,
        color: m.text,
        fontFamily: SHELL.MONO,
        fontSize: 9.5,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        lineHeight: 1.5,
        whiteSpace: 'nowrap',
      }}
    >
      {m.label}
    </span>
  );
}

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: IntelligencePattern['status'] }) {
  const map: Record<IntelligencePattern['status'], { bg: string; text: string; label: string }> = {
    validated: { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT, label: 'Validated' },
    emerging: { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT, label: 'Emerging' },
    deprecated: { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT, label: 'Deprecated' },
    'in-review': { bg: SHELL.BLUE_BG, text: '#2a4a7a', label: 'In review' },
    candidate: { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT, label: 'Candidate' },
  };
  const m = map[status];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        background: m.bg,
        color: m.text,
        fontFamily: SHELL.SANS,
        fontSize: 11,
        fontWeight: 500,
        lineHeight: 1.6,
        whiteSpace: 'nowrap',
      }}
    >
      {m.label}
    </span>
  );
}

// ─── Pattern row ──────────────────────────────────────────────────────────────

function PatternRow({ pattern }: { pattern: IntelligencePattern }) {
  const href = `/intelligence/${pattern.id.toLowerCase().replace('/', '-').replace('_', '-')}`;

  return (
    <Link
      href={href}
      style={{
        display: 'grid',
        gridTemplateColumns: '72px 1fr 120px 96px 72px 64px',
        alignItems: 'center',
        height: 48,
        padding: '0 20px',
        borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        textDecoration: 'none',
        color: SHELL.INK,
        gap: 8,
        transition: 'background 100ms ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = SHELL.PAPER_SOFT;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
      }}
    >
      {/* ID */}
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          color: SHELL.INK_MUTED,
          letterSpacing: '0.06em',
        }}
      >
        {pattern.id}
        {pattern.id === 'T3-H01' && (
          <span style={{ marginLeft: 4, color: SHELL.AMBER_DOT }}>★</span>
        )}
      </span>

      {/* Name + description */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 14,
            fontWeight: 700,
            color: SHELL.INK,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.2,
          }}
        >
          {pattern.name}
        </div>
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 11,
            fontStyle: 'italic',
            color: SHELL.INK_MUTED,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.2,
            marginTop: 1,
          }}
        >
          {pattern.description}
        </div>
      </div>

      {/* Tier badge */}
      <div>
        <TierBadge tier={pattern.tier} />
      </div>

      {/* Status pill */}
      <div>
        <StatusPill status={pattern.status} />
      </div>

      {/* Programs count */}
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          color: SHELL.INK_MUTED,
          letterSpacing: '0.04em',
        }}
      >
        {pattern.usedInPrograms}p
      </span>

      {/* View link */}
      <div>
        <Link
          href={href}
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: 999,
            border: `1px solid ${SHELL.INK}`,
            background: 'transparent',
            color: SHELL.INK,
            fontFamily: SHELL.MONO,
            fontSize: 10,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            textDecoration: 'none',
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
          }}
        >
          View
        </Link>
      </div>
    </Link>
  );
}

// ─── Pattern table ────────────────────────────────────────────────────────────

function PatternTable({ patterns }: { patterns: IntelligencePattern[] }) {
  const colHeaderStyle: React.CSSProperties = {
    fontFamily: SHELL.MONO,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: SHELL.INK_MUTED,
  };

  return (
    <div
      style={{
        borderRadius: 10,
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        overflow: 'hidden',
      }}
    >
      {/* Column headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '72px 1fr 120px 96px 72px 64px',
          padding: '7px 20px',
          gap: 8,
          background: SHELL.PAPER_SOFT,
          borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        }}
      >
        <span style={colHeaderStyle}>ID</span>
        <span style={colHeaderStyle}>Pattern</span>
        <span style={colHeaderStyle}>Tier</span>
        <span style={colHeaderStyle}>Status</span>
        <span style={colHeaderStyle}>Programs</span>
        <span style={colHeaderStyle}></span>
      </div>

      {/* Rows */}
      {patterns.map((p) => (
        <PatternRow key={p.id} pattern={p} />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function IntelligenceIndexPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeFilter = searchParams?.get('filter') ?? 'all';
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const filtered = INTELLIGENCE_INDEX_VIEW.patterns.filter(p => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 't1') return p.tier === 'T1';
    if (activeFilter === 't2') return p.tier === 'T2';
    if (activeFilter === 't3') return p.tier === 'T3';
    if (activeFilter === 'in-review') return p.status === 'in-review';
    if (activeFilter === 'candidate') return p.status === 'candidate';
    if (activeFilter === 'validated') return p.status === 'validated';
    return true;
  });

  const filterPills = [
    { key: 'all', label: 'All', active: activeFilter === 'all', count: INTELLIGENCE_INDEX_VIEW.patterns.length, href: '/intelligence' },
    { key: 't3', label: 'T3 · Use-case', active: activeFilter === 't3', count: INTELLIGENCE_INDEX_VIEW.patterns.filter(p => p.tier === 'T3').length, href: '/intelligence?filter=t3' },
    { key: 't2', label: 'T2 · Capability', active: activeFilter === 't2', count: INTELLIGENCE_INDEX_VIEW.patterns.filter(p => p.tier === 'T2').length, href: '/intelligence?filter=t2' },
    { key: 't1', label: 'T1 · Foundation', active: activeFilter === 't1', count: INTELLIGENCE_INDEX_VIEW.patterns.filter(p => p.tier === 'T1').length, href: '/intelligence?filter=t1' },
    { key: 'in-review', label: 'In review', active: activeFilter === 'in-review', count: INTELLIGENCE_INDEX_VIEW.patterns.filter(p => p.status === 'in-review').length, href: '/intelligence?filter=in-review' },
  ];

  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Intelligence · Pattern Library',
      }}
      middleStrip={
        <FilterPillStrip
          pills={filterPills.map(pill => ({
            key: pill.key,
            label: pill.label,
            active: pill.active,
            count: pill.count,
            onClick: () => router.push(pill.href),
          }))}
        />
      }
    >
      {/* Sentinel column */}
      <AgentColumn
        agent={{ initials: 'Sn', name: 'Sentinel', role: 'Pattern Validator' }}
        quote={INTELLIGENCE_INDEX_VIEW.agentQuote}
        agentContext={INTELLIGENCE_INDEX_VIEW.agentContext}
        actions={INTELLIGENCE_INDEX_VIEW.actions}
        surface="intelligence"
        onActionClick={(letter) => {
          if (letter === 'A') router.push('/intelligence?filter=validated');
          else if (letter === 'B') router.push('/intelligence?filter=in-review');
          else if (letter === 'C') setShowSubmitModal(true);
        }}
      />

      {/* Main content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '32px 48px',
        }}
      >
        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              marginBottom: 6,
            }}
          >
            Intelligence · Pattern Library
          </div>
          <h1
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 26,
              fontWeight: 700,
              color: SHELL.INK,
              margin: 0,
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}
          >
            Pattern Library
          </h1>
          <p
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK_MUTED,
              margin: '6px 0 0',
              lineHeight: 1.5,
            }}
          >
            {filtered.length} pattern{filtered.length !== 1 ? 's' : ''} · validated and emerging signals for AI program design
          </p>
        </div>

        {/* Pattern table */}
        <PatternTable patterns={filtered} />

        {/* Solutions link */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${SHELL.CARD_LINE}` }}>
          <a href="/intelligence/solutions" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: SHELL.MONO, fontSize: 11, color: SHELL.INK_SOFT, textDecoration: 'none',
          }}>
            <span>→</span>
            <span>Solution archetypes · end-to-end blueprints</span>
          </a>
        </div>
      </div>

      {/* INT-MOD-SUBMIT: Pattern submission modal */}
      {showSubmitModal && <PatternSubmitModal onClose={() => setShowSubmitModal(false)} />}
    </AppShell>
  );
}
