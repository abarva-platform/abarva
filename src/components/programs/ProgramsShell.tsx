'use client';

// ProgramsShell · one persistent surface for /programs.
// - Top nav stays above (rendered by the maestro layout chrome)
// - Layer 2: Programs sub-menu bar · Portfolio · + New Program | P0 … P4
// - Layer 3: Program metadata strip (only when inside a selected program)
// - Stage: content swaps in place when a sub-tab is clicked · no route change
//
// Light editorial palette matches Home + Platform pages. Sub-tab active
// state fills with teal-soft background + teal bottom border + teal text.

import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { ProgramFullState } from '@/lib/programs/types.ui';

const PAGE_BG = '#F6F1E8';
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
const SERIF = '"Fraunces", Georgia, serif';
const MONO = '"JetBrains Mono", "Fira Code", monospace';
const SANS = '"DM Sans", -apple-system, sans-serif';

type TabKey = 'portfolio' | 'new' | 'p0' | 'p1' | 'p2' | 'p3' | 'p4';

interface PeerDecision {
  title: string;
  programs: number;
  avgUsd: string;
}

const PHASE_META: Record<
  'p0' | 'p1' | 'p2' | 'p3' | 'p4',
  {
    num: number;
    title: string;
    tagline: string;
    emptyState: string;
    peerDecisions: PeerDecision[];
  }
> = {
  p0: {
    num: 0,
    title: 'Start',
    tagline: 'Baseline the current workflow, lock scope and sponsor intent.',
    emptyState: 'No turns yet. Say something to Nexus to baseline this program.',
    peerDecisions: [
      { title: 'baseline current workflow first', programs: 1, avgUsd: '$8M' },
      { title: 'launch exec interview sprint', programs: 1, avgUsd: '$6M' },
      { title: 'stand up data readiness squad', programs: 1, avgUsd: '$10M' },
    ],
  },
  p1: {
    num: 1,
    title: 'Diagnose',
    tagline: 'Quantify the gap · surface contradictions · build the Hypothesis Tree.',
    emptyState: 'Diagnostic thread is quiet. Open the Hypothesis Tree or ask Nexus to surface contradictions.',
    peerDecisions: [
      { title: 'ship contradiction register first', programs: 3, avgUsd: '$12M' },
      { title: 'run peer-decision scan early', programs: 2, avgUsd: '$9M' },
      { title: 'gate diagnostic on evidence audit', programs: 4, avgUsd: '$14M' },
    ],
  },
  p2: {
    num: 2,
    title: 'Design',
    tagline: 'Synthesize intervention options · build the Business Case · lock the baseline.',
    emptyState: 'No interventions drafted. Ask Nexus to compose the intervention charter.',
    peerDecisions: [
      { title: 'intervention with explicit refusal logic', programs: 3, avgUsd: '$15M' },
      { title: 'two-option tradeoff memo with dissent', programs: 5, avgUsd: '$11M' },
      { title: 'outcome baseline locked at charter', programs: 6, avgUsd: '$18M' },
    ],
  },
  p3: {
    num: 3,
    title: 'Execute',
    tagline: 'Pilot scope · disciplined measurement · scope-drift refusal.',
    emptyState: 'Execution stream is empty. Pilot plan + measurement cadence drop in once the gate clears.',
    peerDecisions: [
      { title: '90-day pilot with sponsor read-outs', programs: 8, avgUsd: '$22M' },
      { title: 'refuse scope creep via charter gate', programs: 4, avgUsd: '$16M' },
      { title: 'tooling choice posted as a decision', programs: 5, avgUsd: '$13M' },
    ],
  },
  p4: {
    num: 4,
    title: 'Verify',
    tagline: 'Outcome attribution · Evidence Ledger audit · pattern promotion.',
    emptyState: 'Verification pending. Outcome signals land once baseline → actual delta is recorded.',
    peerDecisions: [
      { title: 'attested outcome before board memo', programs: 6, avgUsd: '$19M' },
      { title: 'promote pattern only with anonymization', programs: 3, avgUsd: '$12M' },
      { title: 'Evidence Ledger audit clean-up first', programs: 4, avgUsd: '$10M' },
    ],
  },
};

const PORTFOLIO_MODE: TabKey[] = ['portfolio', 'new'];
const PHASE_KEYS: Array<Exclude<TabKey, 'portfolio' | 'new'>> = ['p0', 'p1', 'p2', 'p3', 'p4'];

function phaseKeyForProgram(program: ProgramFullState | null): Exclude<TabKey, 'portfolio' | 'new'> {
  if (!program) return 'p0';
  const p = Math.max(0, Math.min(4, program.currentPhase ?? 0));
  return (`p${p}` as Exclude<TabKey, 'portfolio' | 'new'>);
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatTurns(program: ProgramFullState): number {
  return program.nexusPanel?.thread?.turns?.length ?? 0;
}

function industryForProgram(program: ProgramFullState): string {
  const name = program.clientName ?? '';
  if (name.includes('Meridian')) return 'HEALTHCARE_IDN';
  if (name.includes('Apex')) return 'RETAIL';
  if (name.includes('First Capital')) return 'FINSERV';
  return 'GENERAL';
}

export function ProgramsShell({ programs }: { programs: ProgramFullState[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialProgramId = searchParams.get('program');
  const initialTab: TabKey = (() => {
    const t = searchParams.get('tab');
    if (t === 'new') return 'new';
    if (t === 'portfolio') return 'portfolio';
    if (initialProgramId) {
      const phase = searchParams.get('phase');
      if (phase && ['0', '1', '2', '3', '4'].includes(phase)) {
        return (`p${phase}` as TabKey);
      }
      const prog = programs.find((p) => p.id === initialProgramId);
      return phaseKeyForProgram(prog ?? null);
    }
    return 'portfolio';
  })();

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(initialProgramId);
  const [toast, setToast] = useState<string | null>(null);

  const selectedProgram = useMemo(
    () => (selectedProgramId ? programs.find((p) => p.id === selectedProgramId) ?? null : null),
    [selectedProgramId, programs],
  );

  const switchTab = useCallback(
    (tab: TabKey, opts?: { programId?: string | null; toast?: string }) => {
      setActiveTab(tab);
      if (opts && 'programId' in opts) {
        setSelectedProgramId(opts.programId ?? null);
      }
      if (opts?.toast) {
        setToast(opts.toast);
        setTimeout(() => setToast(null), 4000);
      }
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (tab === 'portfolio') {
          url.searchParams.delete('tab');
          url.searchParams.delete('phase');
          url.searchParams.delete('program');
        } else if (tab === 'new') {
          url.searchParams.set('tab', 'new');
          url.searchParams.delete('phase');
          url.searchParams.delete('program');
        } else {
          const pid = opts?.programId ?? selectedProgramId;
          if (pid) url.searchParams.set('program', pid);
          url.searchParams.set('phase', tab.replace('p', ''));
          url.searchParams.delete('tab');
        }
        window.history.replaceState({}, '', url.toString());
      }
    },
    [selectedProgramId],
  );

  const openProgram = useCallback(
    (programId: string) => {
      const prog = programs.find((p) => p.id === programId);
      const phaseKey = phaseKeyForProgram(prog ?? null);
      switchTab(phaseKey, { programId });
    },
    [programs, switchTab],
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: PAGE_BG,
        color: INK,
        fontFamily: SANS,
      }}
    >
      {/* ─── Layer 2 · Programs sub-menu bar ──────────────────────────── */}
      <nav
        role="tablist"
        aria-label="Programs sub-navigation"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 5,
          background: PANEL_BG,
          borderBottom: `1px solid ${LINE}`,
          padding: '10px 28px',
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          flexWrap: 'wrap',
          boxShadow: '0 1px 0 rgba(23,20,17,0.02)',
        }}
      >
        <SubTab
          label={`Portfolio · ${programs.length}`}
          active={activeTab === 'portfolio'}
          onClick={() => switchTab('portfolio')}
        />
        <SubTab
          label="+ New Program"
          active={activeTab === 'new'}
          onClick={() => switchTab('new')}
        />
        <div style={{ width: 1, height: 20, background: LINE, margin: '0 10px' }} aria-hidden="true" />
        {PHASE_KEYS.map((pk) => {
          const meta = PHASE_META[pk];
          const isProgramMode = !PORTFOLIO_MODE.includes(activeTab);
          const isActive = activeTab === pk;
          const disabled = !selectedProgramId && !isProgramMode;
          return (
            <SubTab
              key={pk}
              label={`P${meta.num} · ${meta.title}`}
              active={isActive}
              disabled={disabled}
              onClick={() => {
                if (disabled) return;
                switchTab(pk);
              }}
            />
          );
        })}
        <div style={{ flex: 1 }} />
        <div
          style={{
            display: 'flex',
            gap: 14,
            alignItems: 'center',
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: '0.08em',
            color: INK_MUTED,
          }}
        >
          {selectedProgram ? (
            <span>Last turn · 2h ago</span>
          ) : (
            <span>{programs.length} programs · {programs.filter((p) => p.gateStatus !== 'cleared').length} awaiting gate</span>
          )}
          <button
            type="button"
            style={{
              border: `1px solid ${LINE}`,
              background: 'transparent',
              padding: '6px 12px',
              borderRadius: 999,
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: INK_SOFT,
              cursor: 'pointer',
            }}
          >
            Export
          </button>
        </div>
      </nav>

      {/* ─── Layer 3 · Program metadata strip (only when inside a prog) ── */}
      {!PORTFOLIO_MODE.includes(activeTab) && selectedProgram ? (
        <ProgramMetaStrip program={selectedProgram} activeTab={activeTab} />
      ) : null}

      {/* ─── Stage ───────────────────────────────────────────────────── */}
      <div style={{ padding: '28px 28px 80px', maxWidth: 1480, margin: '0 auto' }}>
        {activeTab === 'portfolio' ? (
          <PortfolioStage programs={programs} onOpen={openProgram} />
        ) : null}
        {activeTab === 'new' ? (
          <NewProgramStage
            onApprove={(programId) =>
              switchTab('p0', {
                programId,
                toast:
                  'Charter approved. Program moved to Phase 0 · Start. The P0 sub-menu is now active.',
              })
            }
          />
        ) : null}
        {!PORTFOLIO_MODE.includes(activeTab) && selectedProgram ? (
          <PhaseStage
            program={selectedProgram}
            phaseKey={activeTab as Exclude<TabKey, 'portfolio' | 'new'>}
          />
        ) : null}
        {!PORTFOLIO_MODE.includes(activeTab) && !selectedProgram ? (
          <div
            style={{
              padding: '48px 28px',
              background: PANEL_BG,
              border: `1px solid ${LINE}`,
              borderRadius: 20,
              textAlign: 'center',
              color: INK_MUTED,
            }}
          >
            <div style={{ fontFamily: SERIF, fontSize: 28, color: INK, marginBottom: 8 }}>
              No program selected.
            </div>
            <div>Pick one from the Portfolio tab to drop into a phase view.</div>
            <button
              type="button"
              onClick={() => switchTab('portfolio')}
              style={{
                marginTop: 18,
                padding: '10px 18px',
                background: INK,
                color: PAGE_BG,
                border: 'none',
                borderRadius: 999,
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Open portfolio
            </button>
          </div>
        ) : null}
      </div>

      {/* Toast */}
      {toast ? (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 10,
            maxWidth: 420,
            padding: '14px 18px',
            background: INK,
            color: PAGE_BG,
            borderRadius: 14,
            fontSize: 13,
            lineHeight: 1.5,
            boxShadow: '0 20px 44px rgba(23,20,17,0.28)',
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', color: TEAL, marginBottom: 4 }}>
            CHARTER APPROVED
          </div>
          {toast}
        </div>
      ) : null}

      {/* Invoke router.refresh if needed for data revalidation */}
      <span style={{ display: 'none' }} aria-hidden="true" data-router-hint={router ? 'ready' : 'idle'} />
    </div>
  );
}

// ─── SubTab · chip-style tab with active teal fill ─────────────────────
function SubTab({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
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
        padding: '8px 14px',
        borderRadius: 10,
        background: active ? TEAL_SOFT : 'transparent',
        border: `1px solid ${active ? 'rgba(14,159,140,0.32)' : 'transparent'}`,
        borderBottom: active ? `2px solid ${TEAL}` : '1px solid transparent',
        color: disabled ? INK_FAINT : active ? TEAL : INK_SOFT,
        fontFamily: MONO,
        fontSize: 11,
        fontWeight: active ? 700 : 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 120ms ease',
      }}
    >
      {label}
    </button>
  );
}

// ─── Metadata strip · shown only when a program is selected ─────────────
function ProgramMetaStrip({
  program,
  activeTab,
}: {
  program: ProgramFullState;
  activeTab: TabKey;
}) {
  const industry = industryForProgram(program);
  const phaseNum = activeTab.startsWith('p') ? Number(activeTab.slice(1)) : program.currentPhase;
  const phaseKey = (`p${phaseNum}` as keyof typeof PHASE_META);
  const phaseTitle = PHASE_META[phaseKey]?.title ?? 'Start';
  const turns = formatTurns(program);
  const topics = program.linkedIntelligenceThreads?.length ?? 0;
  const contradictions = program.sponsorDashboard?.openDecisions?.length ?? 0;
  const deliverables = program.deliverables?.length ?? 0;

  return (
    <div
      style={{
        background: PANEL_BG,
        borderBottom: `1px solid ${LINE}`,
        padding: '20px 28px 22px',
      }}
    >
      <div style={{ maxWidth: 1480, margin: '0 auto' }}>
        <div
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            border: `1px solid ${LINE}`,
            borderRadius: 6,
            fontFamily: MONO,
            fontSize: 10,
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
            marginTop: 8,
            fontSize: 13,
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
          <span>· Opened: <strong style={{ color: INK, fontWeight: 600 }}>{formatDate(new Date())}</strong></span>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
          <MetaChip label="Phase" value={`${phaseNum} ${phaseTitle}`} emphasize />
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
      <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK_MUTED }}>
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: valueColor }}>{value}</span>
    </div>
  );
}

// ─── Portfolio stage · list of program cards ─────────────────────────────
function PortfolioStage({
  programs,
  onOpen,
}: {
  programs: ProgramFullState[];
  onOpen: (id: string) => void;
}) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
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
          Portfolio · {programs.length} programs
        </div>
        <h2
          style={{
            margin: 0,
            fontFamily: SERIF,
            fontSize: 'clamp(32px, 3vw, 52px)',
            lineHeight: 1.02,
            letterSpacing: '-0.03em',
            color: INK,
          }}
        >
          Your active programs, scanable in one glance.
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {programs.map((p) => {
          const phaseTitle = PHASE_META[phaseKeyForProgram(p)].title;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onOpen(p.id)}
              style={{
                textAlign: 'left',
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1fr) auto',
                gap: 18,
                alignItems: 'center',
                padding: '18px 20px',
                background: PANEL_BG,
                border: `1px solid ${LINE}`,
                borderRadius: 14,
                cursor: 'pointer',
                fontFamily: SANS,
                color: INK,
                transition: 'all 120ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(14,159,140,0.42)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = LINE;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 9,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: INK_MUTED,
                    marginBottom: 4,
                  }}
                >
                  {p.clientName}
                </div>
                <div style={{ fontFamily: SERIF, fontSize: 20, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
                  {p.name}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 9,
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
                    fontSize: 9,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: INK_MUTED,
                    marginBottom: 3,
                  }}
                >
                  Phase
                </div>
                <div style={{ fontSize: 13, color: TEAL, fontFamily: MONO, letterSpacing: '0.04em' }}>
                  {p.currentPhase} · {phaseTitle}
                </div>
              </div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  color: INK_FAINT,
                }}
              >
                Open →
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 32, fontSize: 13, color: INK_MUTED }}>
        Need the dense scan-many grid? <Link href="/programs/patterns" style={{ color: TEAL, textDecoration: 'underline' }}>Open patterns library →</Link>
      </div>
    </div>
  );
}

// ─── New Program · 4-step stepper ───────────────────────────────────────
function NewProgramStage({ onApprove }: { onApprove: (programId: string) => void }) {
  const STEPS = [
    { key: 'sponsor', label: 'Sponsor' },
    { key: 'topic', label: 'Topic' },
    { key: 'value', label: 'Value at stake' },
    { key: 'review', label: 'Review & approve' },
  ];
  const [step, setStep] = useState(0);
  const [sponsor, setSponsor] = useState('');
  const [topic, setTopic] = useState('');
  const [value, setValue] = useState('');

  const canAdvance = (() => {
    if (step === 0) return sponsor.trim().length > 0;
    if (step === 1) return topic.trim().length > 0;
    if (step === 2) return value.trim().length > 0;
    return true;
  })();

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
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
          New program · charter workflow
        </div>
        <h2
          style={{
            margin: 0,
            fontFamily: SERIF,
            fontSize: 'clamp(30px, 2.8vw, 48px)',
            lineHeight: 1.04,
            letterSpacing: '-0.03em',
            color: INK,
          }}
        >
          Charter the program. Sponsor, topic, and outcome baseline.
        </h2>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 28, alignItems: 'center' }}>
        {STEPS.map((s, i) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i === STEPS.length - 1 ? 'none' : 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: i <= step ? TEAL : 'transparent',
                  border: `1.5px solid ${i <= step ? TEAL : LINE}`,
                  color: i <= step ? '#fff' : INK_MUTED,
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: MONO,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: i <= step ? INK : INK_MUTED,
                  fontWeight: i === step ? 700 : 500,
                }}
              >
                {s.label}
              </div>
            </div>
            {i < STEPS.length - 1 ? (
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: i < step ? TEAL : LINE,
                  margin: '0 16px',
                }}
              />
            ) : null}
          </div>
        ))}
      </div>

      <div
        style={{
          padding: '28px 30px',
          background: PANEL_BG,
          border: `1px solid ${LINE}`,
          borderRadius: 16,
          minHeight: 320,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {step === 0 ? (
          <StepField
            label="Sponsor"
            hint="Name + role of the senior leader accountable for this program."
            value={sponsor}
            onChange={setSponsor}
            placeholder="e.g. Sarah Chen · CIO · Meridian Health"
          />
        ) : null}
        {step === 1 ? (
          <StepField
            label="Topic"
            hint="The transformation topic or pattern anchoring this program."
            value={topic}
            onChange={setTopic}
            placeholder="e.g. Ambient documentation vendor strategy"
          />
        ) : null}
        {step === 2 ? (
          <StepField
            label="Value at stake"
            hint="Baseline metric, target delta, and attribution pathway."
            value={value}
            onChange={setValue}
            placeholder="e.g. $8-12M annual clinician time recovered"
          />
        ) : null}
        {step === 3 ? (
          <div>
            <div style={{ fontFamily: SERIF, fontSize: 22, color: INK, marginBottom: 16 }}>Review &amp; approve charter.</div>
            <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px 24px', fontSize: 14 }}>
              <dt style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK_MUTED }}>Sponsor</dt>
              <dd style={{ margin: 0, color: INK }}>{sponsor || '—'}</dd>
              <dt style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK_MUTED }}>Topic</dt>
              <dd style={{ margin: 0, color: INK }}>{topic || '—'}</dd>
              <dt style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK_MUTED }}>Value at stake</dt>
              <dd style={{ margin: 0, color: INK }}>{value || '—'}</dd>
            </dl>
            <div
              style={{
                marginTop: 18,
                padding: '12px 14px',
                border: `1px dashed ${LINE}`,
                borderRadius: 10,
                background: PAGE_BG,
                fontSize: 13,
                color: INK_MUTED,
              }}
            >
              Approval locks the charter and moves the program to Phase 0 · Start. The P0 tab will light up and the
              conversation thread begins.
            </div>
          </div>
        ) : null}

        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 12 }}>
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            style={{
              padding: '10px 18px',
              background: 'transparent',
              border: `1px solid ${LINE}`,
              borderRadius: 999,
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: step === 0 ? INK_FAINT : INK_SOFT,
              cursor: step === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            ← Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => canAdvance && setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              disabled={!canAdvance}
              style={{
                padding: '10px 22px',
                background: canAdvance ? INK : LINE_SOFT,
                color: canAdvance ? PAGE_BG : INK_FAINT,
                border: 'none',
                borderRadius: 999,
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: canAdvance ? 'pointer' : 'not-allowed',
                fontWeight: 700,
              }}
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onApprove('new-' + Date.now())}
              style={{
                padding: '12px 22px',
                background: TEAL,
                color: '#fff',
                border: 'none',
                borderRadius: 999,
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              Approve charter → move to Phase 0
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepField({
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label style={{ display: 'block' }}>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: INK_MUTED,
          }}
        >
          {label}
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            marginTop: 8,
            width: '100%',
            padding: '12px 16px',
            background: PAGE_BG,
            border: `1px solid ${LINE}`,
            borderRadius: 12,
            fontFamily: SERIF,
            fontSize: 22,
            color: INK,
            outline: 'none',
          }}
        />
      </label>
      <div style={{ marginTop: 8, fontSize: 13, color: INK_MUTED, lineHeight: 1.55 }}>{hint}</div>
    </div>
  );
}

// ─── Phase workspace stage · 2-col layout ──────────────────────────────
function PhaseStage({
  program,
  phaseKey,
}: {
  program: ProgramFullState;
  phaseKey: Exclude<TabKey, 'portfolio' | 'new'>;
}) {
  const meta = PHASE_META[phaseKey];
  const gateCleared = program.gateStatus === 'cleared' && program.currentPhase >= meta.num;
  const turns = program.nexusPanel?.thread?.turns ?? [];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2.1fr) minmax(280px, 1fr)',
        gap: 24,
      }}
    >
      {/* LEFT · active work surface */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: INK_MUTED,
                  marginBottom: 6,
                }}
              >
                Phase {meta.num} · {meta.title}
              </div>
              <h2 style={{ margin: 0, fontFamily: SERIF, fontSize: 28, letterSpacing: '-0.02em', color: INK }}>
                {meta.tagline}
              </h2>
            </div>
            <div
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 700,
                color: gateCleared ? TEAL : AMBER,
                background: gateCleared ? TEAL_SOFT : 'rgba(192,134,67,0.12)',
                border: `1px solid ${gateCleared ? 'rgba(14,159,140,0.32)' : 'rgba(192,134,67,0.3)'}`,
              }}
            >
              {gateCleared ? 'Gate cleared' : 'Gate not locked'}
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              padding: 20,
              background: PAGE_BG,
              border: `1px solid ${LINE}`,
              borderRadius: 12,
              minHeight: 200,
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
              turns.slice(0, 3).map((t, i) => (
                <div key={i} style={{ fontSize: 13, color: INK_SOFT, lineHeight: 1.55 }}>
                  <strong style={{ color: INK, fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em' }}>
                    {(t.speaker ?? 'nexus').toUpperCase()}
                  </strong>{' '}
                  {t.text ?? ''}
                </div>
              ))
            )}
          </div>
        </section>

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
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: INK_MUTED,
              marginBottom: 14,
            }}
          >
            Peer decisions · phase {meta.num}
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {meta.peerDecisions.map((d, i) => (
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
                    fontSize: 11,
                    color: INK_MUTED,
                    letterSpacing: '0.04em',
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
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: INK_MUTED,
              marginBottom: 10,
            }}
          >
            Sponsor
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 22, color: INK, letterSpacing: '-0.01em' }}>
            {program.sponsorPerson.name}
          </div>
          <div style={{ marginTop: 4, fontSize: 13, color: INK_SOFT }}>
            {program.sponsorPerson.title ?? 'Sponsor'} · {program.clientName} · first meeting
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
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: INK_MUTED,
              }}
            >
              Client contradictions
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 11,
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
                fontSize: 13,
                color: c.tone === 'amber' ? AMBER : INK,
                display: 'flex',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <span>{c.text}</span>
              {c.tone === 'amber' ? <span style={{ fontFamily: MONO, fontSize: 10 }}>$</span> : null}
            </div>
          ))}
        </section>
      </aside>
    </div>
  );
}
