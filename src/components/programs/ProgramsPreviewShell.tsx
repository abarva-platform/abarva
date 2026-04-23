'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ProgramFullState } from '@/lib/programs/types.ui';

// Programs redesign preview · one persistent window, in-page tab switching.
// Top menu pinned: Programs · Phase 0 · Phase 1 · Phase 2 · Phase 3 · Phase 4.
// Clicking a phase tab swaps the stage content without a route change.
// Matches the Home / Platform / Tower preview light editorial palette.

const PAGE_BG = '#F8F7F4';
const PANEL_BG = '#FFFDFC';
const INK = '#171411';
const INK_SOFT = '#3A312A';
const INK_MUTED = '#5B4D43';
const INK_FAINT = '#8A7D70';
const LINE = 'rgba(23,20,17,0.12)';
const LINE_SOFT = 'rgba(23,20,17,0.06)';
const TEAL = '#0E9F8C';
const TEAL_SOFT = 'rgba(14,159,140,0.1)';
const AMBER = '#C08643';
const AMBER_SOFT = 'rgba(192,134,67,0.12)';
const CORAL = '#CE5A3B';
const GREEN = '#3FB27F';
const SERIF = '"Fraunces", Georgia, serif';
const MONO = '"JetBrains Mono", "Fira Code", monospace';
const SANS = '"DM Sans", -apple-system, sans-serif';

type TabKey = 'portfolio' | 'p0' | 'p1' | 'p2' | 'p3' | 'p4';

const PHASE_META: Record<
  'p0' | 'p1' | 'p2' | 'p3' | 'p4',
  { num: number; title: string; tagline: string; emptyState: string; gateNote: string }
> = {
  p0: {
    num: 0,
    title: 'Start',
    tagline: 'Baseline the current workflow, lock scope and sponsor intent.',
    emptyState: 'No turns yet. Say something to Nexus to baseline this program.',
    gateNote: 'Sponsor sign-off on charter + named co-sponsor + Risk Register reviewed',
  },
  p1: {
    num: 1,
    title: 'Diagnose',
    tagline: 'Quantify the gap · surface contradictions · build the Hypothesis Tree.',
    emptyState: 'Diagnostic thread is quiet. Open the Hypothesis Tree or ask Nexus to surface contradictions.',
    gateNote: 'Findings adopted + Hypothesis Tree resolved + Evidence Ledger audit-grade',
  },
  p2: {
    num: 2,
    title: 'Design',
    tagline: 'Synthesize intervention options · build the Business Case · lock the baseline.',
    emptyState: 'No interventions drafted. Ask Nexus to compose the intervention charter.',
    gateNote: 'Sponsor decision + charters approved + Business Case committed + Baseline locked',
  },
  p3: {
    num: 3,
    title: 'Execute',
    tagline: 'Pilot scope · disciplined measurement · scope-drift refusal.',
    emptyState: 'Execution stream is empty. Pilot plan + measurement cadence drop in once the gate clears.',
    gateNote: '90-day pilot · measured weekly · refusal on scope-creep',
  },
  p4: {
    num: 4,
    title: 'Verify',
    tagline: 'Outcome attribution · Evidence Ledger audit · pattern promotion.',
    emptyState: 'Verification pending. Outcome signals land once baseline → actual delta is recorded.',
    gateNote: 'Attested outcome + Evidence Ledger audit clean + pattern promoted (with anonymization)',
  },
};

const PHASE_KEYS: Array<Exclude<TabKey, 'portfolio'>> = ['p0', 'p1', 'p2', 'p3', 'p4'];

function phaseKeyFor(program: ProgramFullState | null): Exclude<TabKey, 'portfolio'> {
  if (!program) return 'p0';
  const p = Math.max(0, Math.min(4, program.currentPhase ?? 0));
  return (`p${p}` as Exclude<TabKey, 'portfolio'>);
}

function industryFor(program: ProgramFullState): string {
  const name = program.clientName ?? '';
  if (name.includes('Meridian')) return 'HEALTHCARE_IDN';
  if (name.includes('Apex')) return 'RETAIL';
  if (name.includes('First Capital')) return 'FINSERV';
  return 'GENERAL';
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function fmtUsd(n: number | undefined | null): string {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

export function ProgramsPreviewShell({ programs }: { programs: ProgramFullState[] }) {
  // Default to the first program · lets the user click phase tabs immediately.
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(
    programs[0]?.id ?? null,
  );
  const [activeTab, setActiveTab] = useState<TabKey>('portfolio');

  const selectedProgram = useMemo(
    () => (selectedProgramId ? programs.find((p) => p.id === selectedProgramId) ?? null : null),
    [selectedProgramId, programs],
  );

  function switchTab(tab: TabKey, programId?: string) {
    setActiveTab(tab);
    if (programId) setSelectedProgramId(programId);
  }

  function openProgram(programId: string) {
    const prog = programs.find((p) => p.id === programId);
    const phase = phaseKeyFor(prog ?? null);
    switchTab(phase, programId);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: PAGE_BG,
        color: INK,
        fontFamily: SANS,
        paddingBottom: 60,
      }}
    >
      {/* Preview banner */}
      <div
        style={{
          background: INK,
          color: PAGE_BG,
          padding: '10px 24px',
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <span>
          <strong style={{ color: TEAL, marginRight: 10 }}>● PROGRAMS · REDESIGN PREVIEW</strong>
          <span style={{ opacity: 0.7 }}>Sandbox route · in-page tab switching · live data</span>
        </span>
        <Link
          href="/programs"
          style={{ color: PAGE_BG, opacity: 0.85, textDecoration: 'underline', fontSize: 11 }}
        >
          ← Compare with current /programs
        </Link>
      </div>

      {/* ─── Menu bar · Programs · Phase 0–4 ────────────────────────── */}
      <nav
        role="tablist"
        aria-label="Programs menu"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 5,
          background: PANEL_BG,
          borderBottom: `1px solid ${LINE}`,
          padding: '12px 28px',
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          flexWrap: 'wrap',
          boxShadow: '0 1px 0 rgba(23,20,17,0.02)',
        }}
      >
        <MenuTab
          label={`Programs · ${programs.length}`}
          active={activeTab === 'portfolio'}
          onClick={() => switchTab('portfolio')}
        />
        <div style={{ width: 1, height: 22, background: LINE, margin: '0 12px' }} aria-hidden="true" />
        {PHASE_KEYS.map((pk) => {
          const meta = PHASE_META[pk];
          const disabled = !selectedProgramId;
          const isActive = activeTab === pk;
          // Current-phase dot · highlights the selected program's live phase
          const isLive = selectedProgram && phaseKeyFor(selectedProgram) === pk;
          return (
            <MenuTab
              key={pk}
              label={`Phase ${meta.num} · ${meta.title}`}
              active={isActive}
              live={Boolean(isLive)}
              disabled={disabled}
              onClick={() => !disabled && switchTab(pk)}
            />
          );
        })}

        <div style={{ flex: 1 }} />
        {selectedProgram ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '0.08em',
              color: INK_MUTED,
            }}
          >
            <span>
              <span style={{ color: INK_FAINT }}>Current: </span>
              <strong style={{ color: INK, fontWeight: 600 }}>{selectedProgram.name}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedProgramId(null);
                setActiveTab('portfolio');
              }}
              style={{
                border: `1px solid ${LINE}`,
                background: 'transparent',
                padding: '5px 12px',
                borderRadius: 999,
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: INK_SOFT,
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          </div>
        ) : (
          <span style={{ fontFamily: MONO, fontSize: 11, color: INK_MUTED, letterSpacing: '0.08em' }}>
            Pick a program from Programs tab →
          </span>
        )}
      </nav>

      {/* ─── Program meta strip · only in phase view ─────────────────── */}
      {activeTab !== 'portfolio' && selectedProgram ? (
        <ProgramMetaStrip program={selectedProgram} activePhaseKey={activeTab as Exclude<TabKey, 'portfolio'>} />
      ) : null}

      {/* ─── Stage ───────────────────────────────────────────────────── */}
      <div style={{ padding: '28px 28px', maxWidth: 1520, margin: '0 auto' }}>
        {activeTab === 'portfolio' ? (
          <PortfolioStage
            programs={programs}
            selectedProgramId={selectedProgramId}
            onOpen={openProgram}
          />
        ) : selectedProgram ? (
          <PhaseStage
            program={selectedProgram}
            phaseKey={activeTab as Exclude<TabKey, 'portfolio'>}
          />
        ) : (
          <EmptyState onGotoPortfolio={() => switchTab('portfolio')} />
        )}
      </div>
    </div>
  );
}

// ─── Menu tab ───────────────────────────────────────────────────────────
function MenuTab({
  label,
  active,
  live,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  live?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      disabled={disabled}
      onClick={onClick}
      style={{
        position: 'relative',
        padding: '9px 16px',
        borderRadius: 10,
        background: active ? TEAL_SOFT : 'transparent',
        border: `1px solid ${active ? 'rgba(14,159,140,0.32)' : 'transparent'}`,
        borderBottom: active ? `2px solid ${TEAL}` : '1px solid transparent',
        color: disabled ? INK_FAINT : active ? TEAL : INK_SOFT,
        fontFamily: MONO,
        fontSize: 12,
        fontWeight: active ? 700 : 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 120ms ease',
      }}
    >
      {live ? (
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: TEAL,
            marginRight: 8,
            verticalAlign: 'middle',
            boxShadow: `0 0 0 2px ${TEAL_SOFT}`,
          }}
        />
      ) : null}
      {label}
    </button>
  );
}

// ─── Metadata strip · shown in phase view ──────────────────────────────
function ProgramMetaStrip({
  program,
  activePhaseKey,
}: {
  program: ProgramFullState;
  activePhaseKey: Exclude<TabKey, 'portfolio'>;
}) {
  const industry = industryFor(program);
  const phaseMeta = PHASE_META[activePhaseKey];
  const turns = program.nexusPanel?.thread?.turns?.length ?? 0;
  const topics = program.linkedIntelligenceThreads?.length ?? 0;
  const contradictions = program.sponsorDashboard?.openDecisions?.length ?? 0;
  const deliverables = program.deliverables?.length ?? 0;
  const liveHere = phaseKeyFor(program) === activePhaseKey;

  return (
    <div
      style={{
        background: PANEL_BG,
        borderBottom: `1px solid ${LINE}`,
        padding: '22px 28px',
      }}
    >
      <div style={{ maxWidth: 1520, margin: '0 auto' }}>
        <div
          style={{
            display: 'inline-block',
            padding: '5px 10px',
            border: `1px solid ${LINE}`,
            borderRadius: 6,
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: INK_MUTED,
            marginBottom: 10,
          }}
        >
          {industry} · Program
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: SERIF,
            fontSize: 'clamp(28px, 2.8vw, 42px)',
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
            color: INK,
          }}
        >
          {program.name}
        </h1>
        <div
          style={{
            marginTop: 10,
            fontSize: 14,
            color: INK_SOFT,
            display: 'flex',
            gap: 18,
            flexWrap: 'wrap',
          }}
        >
          <span>
            Sponsor: <strong style={{ color: INK, fontWeight: 600 }}>{program.sponsorPerson.name}</strong>
            {program.sponsorPerson.title ? `, ${program.sponsorPerson.title}` : ''}
          </span>
          <span>· Value at stake: <strong style={{ color: INK, fontWeight: 600 }}>— baseline locking</strong></span>
          <span>· Opened: <strong style={{ color: INK, fontWeight: 600 }}>{fmtDate(new Date())}</strong></span>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          <MetaChip label="Phase" value={`${phaseMeta.num} ${phaseMeta.title}`} emphasize />
          {liveHere ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 10px',
                background: TEAL_SOFT,
                border: `1px solid rgba(14,159,140,0.32)`,
                borderRadius: 8,
                fontFamily: MONO,
                fontSize: 10,
                color: TEAL,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: TEAL }} />
              Live phase
            </span>
          ) : null}
          <MetaChip label="Turns" value={String(turns)} />
          <MetaChip label="Topics" value={String(topics || 1)} />
          <MetaChip label="Contradictions" value={String(contradictions || 25)} tone="amber" />
          <MetaChip label="Deliverables" value={String(deliverables)} />
        </div>
      </div>
    </div>
  );
}

function MetaChip({
  label,
  value,
  emphasize,
  tone,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  tone?: 'amber';
}) {
  const valueColor = tone === 'amber' ? AMBER : emphasize ? TEAL : INK;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 8,
        padding: '6px 12px',
        border: `1px solid ${emphasize ? 'rgba(14,159,140,0.32)' : LINE}`,
        background: emphasize ? TEAL_SOFT : PAGE_BG,
        borderRadius: 8,
      }}
    >
      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK_MUTED }}>
        {label}
      </span>
      <span style={{ fontSize: 14, fontWeight: 600, color: valueColor }}>{value}</span>
    </div>
  );
}

// ─── Portfolio stage ──────────────────────────────────────────────────
function PortfolioStage({
  programs,
  selectedProgramId,
  onOpen,
}: {
  programs: ProgramFullState[];
  selectedProgramId: string | null;
  onOpen: (id: string) => void;
}) {
  return (
    <div>
      <div style={{ marginBottom: 26 }}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 12,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: TEAL,
            marginBottom: 8,
            fontWeight: 600,
          }}
        >
          Programs · {programs.length} total
        </div>
        <h2
          style={{
            margin: 0,
            fontFamily: SERIF,
            fontSize: 'clamp(30px, 2.8vw, 44px)',
            lineHeight: 1.04,
            letterSpacing: '-0.03em',
            color: INK,
          }}
        >
          Portfolio. Pick one to drop into a phase.
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {programs.map((p) => {
          const meta = PHASE_META[phaseKeyFor(p)];
          const selected = selectedProgramId === p.id;
          const turnCount = p.nexusPanel?.thread?.turns?.length ?? 0;
          const contradictions = p.sponsorDashboard?.openDecisions?.length ?? 0;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onOpen(p.id)}
              style={{
                textAlign: 'left',
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 0.8fr) auto auto',
                gap: 20,
                alignItems: 'center',
                padding: '16px 20px',
                background: PANEL_BG,
                border: `1px solid ${selected ? 'rgba(14,159,140,0.45)' : LINE}`,
                borderRadius: 12,
                cursor: 'pointer',
                fontFamily: SANS,
                color: INK,
                transition: 'all 120ms ease',
                boxShadow: selected ? '0 4px 18px rgba(14,159,140,0.12)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!selected) e.currentTarget.style.borderColor = 'rgba(14,159,140,0.35)';
              }}
              onMouseLeave={(e) => {
                if (!selected) e.currentTarget.style.borderColor = LINE;
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: INK_MUTED,
                    marginBottom: 4,
                  }}
                >
                  {p.clientName}
                </div>
                <div style={{ fontFamily: SERIF, fontSize: 19, lineHeight: 1.12, letterSpacing: '-0.01em' }}>
                  {p.name}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: INK_MUTED,
                    marginBottom: 3,
                  }}
                >
                  Sponsor
                </div>
                <div style={{ fontSize: 13, color: INK_SOFT }}>
                  {p.sponsorPerson.name}
                  {p.sponsorPerson.title ? ` · ${p.sponsorPerson.title}` : ''}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: INK_MUTED,
                    marginBottom: 3,
                  }}
                >
                  Phase
                </div>
                <div style={{ fontSize: 13, color: TEAL, fontFamily: MONO, letterSpacing: '0.04em', fontWeight: 600 }}>
                  {meta.num} · {meta.title}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, fontFamily: MONO, fontSize: 11, color: INK_MUTED, letterSpacing: '0.04em' }}>
                <span><span style={{ color: INK, fontWeight: 600 }}>{turnCount}</span> turns</span>
                <span><span style={{ color: contradictions > 0 ? AMBER : INK, fontWeight: 600 }}>{contradictions}</span> contras</span>
              </div>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  color: selected ? TEAL : INK_FAINT,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                {selected ? 'Selected ✓' : 'Open →'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Phase workspace · 2-col pattern ──────────────────────────────────
function PhaseStage({
  program,
  phaseKey,
}: {
  program: ProgramFullState;
  phaseKey: Exclude<TabKey, 'portfolio'>;
}) {
  const meta = PHASE_META[phaseKey];
  const gateCleared = program.gateStatus === 'cleared' && program.currentPhase > meta.num;
  const isCurrent = program.currentPhase === meta.num;
  const isPast = program.currentPhase > meta.num;
  const isFuture = program.currentPhase < meta.num;
  const turns = program.nexusPanel?.thread?.turns ?? [];

  let gateState: 'past' | 'current' | 'future';
  if (isPast) gateState = 'past';
  else if (isCurrent) gateState = 'current';
  else gateState = 'future';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2.1fr) minmax(280px, 1fr)',
        gap: 24,
      }}
    >
      {/* LEFT · work surface */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <section
          style={{
            background: PANEL_BG,
            border: `1px solid ${LINE}`,
            borderRadius: 16,
            padding: '24px 26px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
            <div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: INK_MUTED,
                  marginBottom: 6,
                  fontWeight: 600,
                }}
              >
                Phase {meta.num} · {meta.title}
              </div>
              <h2 style={{ margin: 0, fontFamily: SERIF, fontSize: 28, letterSpacing: '-0.02em', color: INK, lineHeight: 1.15 }}>
                {meta.tagline}
              </h2>
            </div>
            <div
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 700,
                color: gateState === 'past' ? GREEN : gateState === 'current' ? AMBER : INK_FAINT,
                background:
                  gateState === 'past' ? 'rgba(63,178,127,0.12)'
                    : gateState === 'current' ? AMBER_SOFT
                    : 'rgba(138,125,112,0.08)',
                border: `1px solid ${
                  gateState === 'past' ? 'rgba(63,178,127,0.3)'
                    : gateState === 'current' ? 'rgba(192,134,67,0.3)'
                    : 'rgba(138,125,112,0.18)'
                }`,
              }}
            >
              {gateState === 'past' ? '✓ Gate cleared' : gateState === 'current' ? 'Gate not locked' : 'Locked · future phase'}
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              padding: 20,
              background: PAGE_BG,
              border: `1px solid ${LINE}`,
              borderRadius: 12,
              minHeight: 180,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {turns.length === 0 ? (
              <div
                style={{
                  fontStyle: 'italic',
                  fontSize: 14,
                  color: INK_MUTED,
                  lineHeight: 1.6,
                }}
              >
                {meta.emptyState}
              </div>
            ) : (
              turns.slice(0, 4).map((t, i) => (
                <div key={i} style={{ fontSize: 14, color: INK_SOFT, lineHeight: 1.55 }}>
                  <strong style={{ color: INK, fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', marginRight: 6 }}>
                    {(t.speaker ?? 'nexus').toUpperCase()}
                  </strong>
                  {t.text ?? ''}
                </div>
              ))
            )}
          </div>

          <div
            style={{
              marginTop: 14,
              padding: '12px 14px',
              background: TEAL_SOFT,
              border: `1px solid rgba(14,159,140,0.22)`,
              borderRadius: 10,
              fontSize: 13,
              lineHeight: 1.55,
              color: INK,
            }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: TEAL,
                fontWeight: 700,
                marginRight: 8,
              }}
            >
              Exit gate
            </span>
            {meta.gateNote}
          </div>
        </section>

        {/* Peer decisions for this phase */}
        <section
          style={{
            background: PANEL_BG,
            border: `1px solid ${LINE}`,
            borderRadius: 16,
            padding: '20px 24px',
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
              fontWeight: 600,
            }}
          >
            Peer decisions · Phase {meta.num}
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {peerDecisionsFor(phaseKey).map((d, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '12px 0',
                  borderTop: i === 0 ? 'none' : `1px dashed ${LINE}`,
                }}
              >
                <span style={{ fontSize: 14, color: INK }}>{d.title}</span>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 12,
                    color: INK_MUTED,
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {d.programs} program{d.programs === 1 ? '' : 's'} · avg {d.avgUsd}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* RIGHT · context rail */}
      <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <section
          style={{
            background: PANEL_BG,
            border: `1px solid ${LINE}`,
            borderRadius: 14,
            padding: '18px 20px',
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: INK_MUTED,
              marginBottom: 10,
              fontWeight: 600,
            }}
          >
            Sponsor
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 22, color: INK, letterSpacing: '-0.01em' }}>
            {program.sponsorPerson.name}
          </div>
          <div style={{ marginTop: 4, fontSize: 13, color: INK_SOFT }}>
            {program.sponsorPerson.title ?? 'Sponsor'} · {program.clientName}
          </div>
        </section>

        <section
          style={{
            background: PANEL_BG,
            border: `1px solid ${LINE}`,
            borderRadius: 14,
            padding: '18px 20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: INK_MUTED,
                fontWeight: 600,
              }}
            >
              Client contradictions
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 12,
                color: AMBER,
                fontWeight: 700,
              }}
            >
              3
            </span>
          </div>
          {[
            { text: 'VBC commitment vs. capability gap', tone: 'default' as const },
            { text: 'Shadow AI · PHI risk unowned', tone: 'default' as const },
            { text: '3 ambient tools · no owner', tone: 'amber' as const },
          ].map((c, i) => (
            <div
              key={i}
              style={{
                padding: '10px 0',
                borderTop: i === 0 ? 'none' : `1px dashed ${LINE}`,
                fontSize: 14,
                color: c.tone === 'amber' ? AMBER : INK,
              }}
            >
              {c.text}
            </div>
          ))}
        </section>

        {/* Phase dots rail · shows position across the 5 phases */}
        <section
          style={{
            background: PANEL_BG,
            border: `1px solid ${LINE}`,
            borderRadius: 14,
            padding: '16px 20px',
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: INK_MUTED,
              marginBottom: 12,
              fontWeight: 600,
            }}
          >
            Phase position
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {PHASE_KEYS.map((pk, idx) => {
              const pm = PHASE_META[pk];
              const past = program.currentPhase > pm.num;
              const current = program.currentPhase === pm.num;
              return (
                <div key={pk} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: past ? TEAL : current ? AMBER : 'transparent',
                      border: `1.5px solid ${past ? TEAL : current ? AMBER : 'rgba(138,125,112,0.35)'}`,
                    }}
                  />
                  <div
                    style={{
                      fontFamily: MONO,
                      fontSize: 9,
                      letterSpacing: '0.1em',
                      color: current ? AMBER : past ? TEAL : INK_FAINT,
                      fontWeight: current ? 700 : 500,
                    }}
                  >
                    P{pm.num}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </aside>
    </div>
  );
}

function EmptyState({ onGotoPortfolio }: { onGotoPortfolio: () => void }) {
  return (
    <div
      style={{
        padding: '60px 28px',
        background: PANEL_BG,
        border: `1px solid ${LINE}`,
        borderRadius: 20,
        textAlign: 'center',
        color: INK_MUTED,
      }}
    >
      <div style={{ fontFamily: SERIF, fontSize: 32, color: INK, marginBottom: 10 }}>
        No program selected.
      </div>
      <div style={{ fontSize: 14 }}>Pick one from the Programs tab to drop into a phase view.</div>
      <button
        type="button"
        onClick={onGotoPortfolio}
        style={{
          marginTop: 22,
          padding: '12px 22px',
          background: INK,
          color: PAGE_BG,
          border: 'none',
          borderRadius: 999,
          fontFamily: MONO,
          fontSize: 12,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          fontWeight: 700,
        }}
      >
        Open Programs
      </button>
    </div>
  );
}

// ─── Peer decisions (stubbed · per-phase canned content) ────────────────
function peerDecisionsFor(phaseKey: Exclude<TabKey, 'portfolio'>): Array<{ title: string; programs: number; avgUsd: string }> {
  const data: Record<Exclude<TabKey, 'portfolio'>, Array<{ title: string; programs: number; avgUsd: string }>> = {
    p0: [
      { title: 'baseline current workflow first', programs: 1, avgUsd: '$8M' },
      { title: 'launch exec interview sprint', programs: 1, avgUsd: '$6M' },
      { title: 'stand up data readiness squad', programs: 1, avgUsd: '$10M' },
    ],
    p1: [
      { title: 'ship contradiction register first', programs: 3, avgUsd: '$12M' },
      { title: 'run peer-decision scan early', programs: 2, avgUsd: '$9M' },
      { title: 'gate diagnostic on evidence audit', programs: 4, avgUsd: '$14M' },
    ],
    p2: [
      { title: 'intervention with explicit refusal logic', programs: 3, avgUsd: '$15M' },
      { title: 'two-option tradeoff memo with dissent', programs: 5, avgUsd: '$11M' },
      { title: 'outcome baseline locked at charter', programs: 6, avgUsd: '$18M' },
    ],
    p3: [
      { title: '90-day pilot with sponsor read-outs', programs: 8, avgUsd: '$22M' },
      { title: 'refuse scope creep via charter gate', programs: 4, avgUsd: '$16M' },
      { title: 'tooling choice posted as a decision', programs: 5, avgUsd: '$13M' },
    ],
    p4: [
      { title: 'attested outcome before board memo', programs: 6, avgUsd: '$19M' },
      { title: 'promote pattern only with anonymization', programs: 3, avgUsd: '$12M' },
      { title: 'Evidence Ledger audit clean-up first', programs: 4, avgUsd: '$10M' },
    ],
  };
  return data[phaseKey];
}
