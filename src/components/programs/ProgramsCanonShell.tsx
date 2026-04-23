'use client';

// ProgramsCanonShell · built per design canon v1.1
// Source: wireframe-programs-page.html exemplar + Part 3.2 wireframe + component library
// Signature motion: animated phase journey with dot halo, connector fill, and
// pop-in stage transitions when navigating between phases.

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ProgramFullState } from '@/lib/programs/types.ui';

type TabKey = 'portfolio' | 'p0' | 'p1' | 'p2' | 'p3' | 'p4';

const PHASE_META: Record<
  Exclude<TabKey, 'portfolio'>,
  {
    num: number;
    title: string;
    subtitle: string;
    tagline: string;
    gate: string;
    deliverables: Array<{ code: string; name: string; status: 'ready' | 'draft' | 'pending' }>;
    emptyState: string;
    peerDecisions: Array<{ title: string; programs: number; avgUsd: string }>;
  }
> = {
  p0: {
    num: 0,
    title: 'Intake & Framing',
    subtitle: 'Baseline the workflow · lock scope · secure sponsor intent.',
    tagline: 'The maestro intake conversation produces the charter. Nothing advances without it.',
    gate: 'Sponsor sign-off on charter · named co-sponsor · Risk Register reviewed · Baseline metrics identified.',
    deliverables: [
      { code: 'D01', name: 'Program Charter', status: 'ready' },
      { code: 'D02', name: 'Stakeholder Map', status: 'ready' },
      { code: 'D03', name: 'Risk Register (Initial)', status: 'draft' },
      { code: 'D04', name: 'Baseline Metrics Brief', status: 'pending' },
    ],
    emptyState: 'No turns yet. Say something to Nexus to baseline this program.',
    peerDecisions: [
      { title: 'baseline current workflow first', programs: 1, avgUsd: '$8M' },
      { title: 'launch exec interview sprint', programs: 1, avgUsd: '$6M' },
      { title: 'stand up data readiness squad', programs: 1, avgUsd: '$10M' },
    ],
  },
  p1: {
    num: 1,
    title: 'Diagnosis & Analysis',
    subtitle: 'Quantify the gap · surface contradictions · build the Hypothesis Tree.',
    tagline: 'Diagnosis converts ambiguity into claim. Every claim gets an evidence anchor.',
    gate: 'Findings adopted · Hypothesis Tree resolved · Evidence Ledger audit-grade for material findings.',
    deliverables: [
      { code: 'D05', name: 'Hypothesis Tree', status: 'ready' },
      { code: 'D06', name: 'Workstream Charters', status: 'ready' },
      { code: 'D07', name: 'Data Request Log', status: 'draft' },
      { code: 'D08', name: 'Diagnostic Findings Document', status: 'pending' },
    ],
    emptyState: 'Diagnostic thread is quiet. Open the Hypothesis Tree or ask Nexus to surface contradictions.',
    peerDecisions: [
      { title: 'ship contradiction register first', programs: 3, avgUsd: '$12M' },
      { title: 'run peer-decision scan early', programs: 2, avgUsd: '$9M' },
      { title: 'gate diagnostic on evidence audit', programs: 4, avgUsd: '$14M' },
    ],
  },
  p2: {
    num: 2,
    title: 'Design & Decision',
    subtitle: 'Synthesize intervention options · build the business case · lock the outcome baseline.',
    tagline: 'Design selects from evidence. Decision commits capital. The outcome baseline is non-negotiable.',
    gate: 'Sponsor decision · intervention charters approved · business case committed · outcome baseline locked.',
    deliverables: [
      { code: 'D09', name: 'Option Set with Tradeoffs', status: 'ready' },
      { code: 'D10', name: 'Decision Brief (CXO)', status: 'draft' },
      { code: 'D11', name: 'Intervention Charter', status: 'draft' },
      { code: 'D12', name: 'Business Case · 36 mo', status: 'pending' },
    ],
    emptyState: 'No interventions drafted. Ask Nexus to compose the intervention charter.',
    peerDecisions: [
      { title: 'intervention with explicit refusal logic', programs: 3, avgUsd: '$15M' },
      { title: 'two-option tradeoff memo with dissent', programs: 5, avgUsd: '$11M' },
      { title: 'outcome baseline locked at charter', programs: 6, avgUsd: '$18M' },
    ],
  },
  p3: {
    num: 3,
    title: 'Build & Deliver',
    subtitle: 'Pilot scope · disciplined measurement · scope-drift refusal.',
    tagline: 'Execution is the test. Scope creep gets refused · measurement cadence is weekly, not quarterly.',
    gate: '90-day pilot complete · measurement cadence ≤ weekly · no unflagged scope creep · go/no-go to scale.',
    deliverables: [
      { code: 'D13', name: 'Pilot Plan', status: 'ready' },
      { code: 'D14', name: 'Measurement Dashboard', status: 'draft' },
      { code: 'D15', name: 'Integration Runbook', status: 'pending' },
      { code: 'D16', name: 'Sponsor Read-out · weekly', status: 'pending' },
    ],
    emptyState: 'Execution stream is empty. Pilot plan + measurement cadence drop in once the gate clears.',
    peerDecisions: [
      { title: '90-day pilot with sponsor read-outs', programs: 8, avgUsd: '$22M' },
      { title: 'refuse scope creep via charter gate', programs: 4, avgUsd: '$16M' },
      { title: 'tooling choice posted as a decision', programs: 5, avgUsd: '$13M' },
    ],
  },
  p4: {
    num: 4,
    title: 'Outcome & Accountability',
    subtitle: 'Dual-ledger reconciliation · Evidence Ledger audit · pattern promotion.',
    tagline: 'Outcomes get attested. Two ledgers reconcile. A pattern promotes only after anonymization.',
    gate: 'Attested outcome · Evidence Ledger audit clean · pattern promoted with legal sign-off on anonymization.',
    deliverables: [
      { code: 'D17', name: 'Decision Memo (Rich)', status: 'ready' },
      { code: 'D18', name: 'Dual-Ledger Reconciliation', status: 'draft' },
      { code: 'D19', name: 'Pattern Contribution Package', status: 'pending' },
      { code: 'D20', name: 'Outcome Attestation', status: 'pending' },
    ],
    emptyState: 'Verification pending. Outcome signals land once baseline → actual delta is recorded.',
    peerDecisions: [
      { title: 'attested outcome before board memo', programs: 6, avgUsd: '$19M' },
      { title: 'promote pattern only with anonymization', programs: 3, avgUsd: '$12M' },
      { title: 'Evidence Ledger audit clean-up first', programs: 4, avgUsd: '$10M' },
    ],
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

export function ProgramsCanonShell({ programs }: { programs: ProgramFullState[] }) {
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(programs[0]?.id ?? null);
  const [activeTab, setActiveTab] = useState<TabKey>('portfolio');
  const [visitedPhases, setVisitedPhases] = useState<Set<number>>(new Set());
  const [transitionKey, setTransitionKey] = useState(0); // forces remount on tab change for pop animation

  const selectedProgram = useMemo(
    () => (selectedProgramId ? programs.find((p) => p.id === selectedProgramId) ?? null : null),
    [selectedProgramId, programs],
  );

  function switchTab(tab: TabKey, programId?: string) {
    setActiveTab(tab);
    if (programId) {
      setSelectedProgramId(programId);
    }

    if (tab.startsWith('p')) {
      const n = Number(tab.slice(1));
      setVisitedPhases((prev) => {
        const next = programId ? new Set<number>() : new Set(prev);
        next.add(n);
        return next;
      });
      setTransitionKey((k) => k + 1);
    } else if (programId) {
      setVisitedPhases(new Set()); // reset visited trail for new program
    }
  }

  function openProgram(programId: string) {
    const prog = programs.find((p) => p.id === programId);
    const phase = phaseKeyFor(prog ?? null);
    switchTab(phase, programId);
  }

  return (
    <div className="pcs-root">
      <style>{canonCss}</style>

      {/* Preview banner */}
      <div className="pcs-banner">
        <span><strong>● PROGRAMS · CANON PREVIEW</strong> Design canon v1.1 · animated phase journey</span>
        <Link href="/programs">← Compare with current /programs</Link>
      </div>

      {/* Dark navbar */}
      <nav className="pcs-navbar">
        <div className="pcs-wordmark"><span className="abar">Abar</span><span className="va">Va</span></div>
        <div className="pcs-tenant-switcher">{selectedProgram?.clientName ?? 'Pick a tenant'}</div>
        <div className="pcs-nav-links">
          <Link href="/home">Home</Link>
          <Link href="/preview/programs" className="active">Programs</Link>
          <Link href="/preview/intelligence">Intelligence</Link>
          <Link href="/preview/tower">Control Tower</Link>
          <Link href="/platform">Platform</Link>
        </div>
        <Link href="/preview/investor" className="pcs-nav-right">Investor →</Link>
      </nav>

      {/* ─── Sub-menu · Portfolio + 5 phases ──────────────────────── */}
      <nav className="pcs-submenu" role="tablist" aria-label="Programs navigation">
        <SubTab
          label={`Portfolio · ${programs.length}`}
          active={activeTab === 'portfolio'}
          onClick={() => switchTab('portfolio')}
        />
        <div className="pcs-submenu-divider" />
        {PHASE_KEYS.map((pk) => {
          const meta = PHASE_META[pk];
          const isActive = activeTab === pk;
          const isLive = selectedProgram && phaseKeyFor(selectedProgram) === pk;
          const isVisited = visitedPhases.has(meta.num);
          const disabled = !selectedProgramId;
          return (
            <SubTab
              key={pk}
              label={`P${meta.num} · ${meta.title.split(' ')[0]}`}
              active={isActive}
              live={Boolean(isLive)}
              visited={isVisited}
              disabled={disabled}
              onClick={() => !disabled && switchTab(pk)}
            />
          );
        })}
        <div style={{ flex: 1 }} />
        {selectedProgram ? (
          <div className="pcs-current-program">
            <span className="pcs-current-label">Current:</span>{' '}
            <strong>{selectedProgram.name}</strong>
          </div>
        ) : null}
      </nav>

      {/* Stage */}
      <div className="pcs-stage">
        {activeTab === 'portfolio' ? (
          <PortfolioStage programs={programs} selectedProgramId={selectedProgramId} onOpen={openProgram} />
        ) : selectedProgram ? (
          <PhaseStage
            key={transitionKey}
            program={selectedProgram}
            phaseKey={activeTab as Exclude<TabKey, 'portfolio'>}
            visitedPhases={visitedPhases}
            onPhaseClick={(pk) => switchTab(pk)}
          />
        ) : null}
      </div>

      {/* Composite footer */}
      <div className="pcs-footer">
        <span>Composite organization built from real-world data · not a real customer</span>
        <span>Design canon v1.1 · Apr 23, 2026</span>
      </div>
    </div>
  );
}

// ─── Sub-menu tab ─────────────────────────────────────────────────────
function SubTab({
  label, active, live, visited, disabled, onClick,
}: {
  label: string; active: boolean; live?: boolean; visited?: boolean; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      disabled={disabled}
      onClick={onClick}
      className={`pcs-subtab ${active ? 'active' : ''} ${visited ? 'visited' : ''} ${disabled ? 'disabled' : ''}`}
    >
      {live ? <span className="pcs-live-dot" aria-hidden="true" /> : null}
      {label}
    </button>
  );
}

// ─── Portfolio list ───────────────────────────────────────────────────
function PortfolioStage({
  programs, selectedProgramId, onOpen,
}: {
  programs: ProgramFullState[]; selectedProgramId: string | null; onOpen: (id: string) => void;
}) {
  return (
    <div className="pcs-container">
      <div className="pcs-breadcrumb">
        <a href="#">Portfolio</a>
      </div>
      <div className="pcs-prog-header">
        <div>
          <div className="pcs-code-row">Portfolio · {programs.length} programs · running work at every phase</div>
          <h1 className="pcs-title">Pick a program. Drop into its phase.</h1>
        </div>
      </div>

      <div className="pcs-portfolio-list">
        {programs.map((p) => {
          const meta = PHASE_META[phaseKeyFor(p)];
          const selected = selectedProgramId === p.id;
          const turnCount = p.nexusPanel?.thread?.turns?.length ?? 0;
          const contradictions = p.sponsorDashboard?.openDecisions?.length ?? 0;
          const industry = industryFor(p);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onOpen(p.id)}
              className={`pcs-portfolio-row ${selected ? 'selected' : ''}`}
            >
              <div>
                <div className="pcs-row-label">{industry} · {p.clientName}</div>
                <div className="pcs-row-name">{p.name}</div>
              </div>
              <div>
                <div className="pcs-row-label">Sponsor</div>
                <div className="pcs-row-sub">
                  {p.sponsorPerson.name}
                  {p.sponsorPerson.title ? ` · ${p.sponsorPerson.title}` : ''}
                </div>
              </div>
              <div>
                <div className="pcs-row-label">Phase</div>
                <div className="pcs-row-phase">P{meta.num} · {meta.title.split(' ')[0]}</div>
              </div>
              <div className="pcs-row-stats">
                <span><strong>{turnCount}</strong> turns</span>
                <span><strong className={contradictions > 0 ? 'amber' : ''}>{contradictions}</strong> contras</span>
              </div>
              <span className="pcs-row-cta">{selected ? 'Selected ✓' : 'Open →'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Phase workspace · animated journey ───────────────────────────────
function PhaseStage({
  program, phaseKey, visitedPhases, onPhaseClick,
}: {
  program: ProgramFullState;
  phaseKey: Exclude<TabKey, 'portfolio'>;
  visitedPhases: Set<number>;
  onPhaseClick: (pk: Exclude<TabKey, 'portfolio'>) => void;
}) {
  const meta = PHASE_META[phaseKey];
  const currentLive = phaseKeyFor(program);
  const turns = program.nexusPanel?.thread?.turns ?? [];

  return (
    <div className="pcs-container pcs-phase-stage">
      <div className="pcs-breadcrumb">
        <a href="#">{program.clientName}</a>
        <span className="sep">›</span>
        <a href="#">Programs</a>
        <span className="sep">›</span>
        <span className="current">{program.name}</span>
      </div>

      <div className="pcs-prog-header">
        <div className="pcs-prog-main">
          <div className="pcs-code-row">{industryFor(program)} · Program · Phase {meta.num}</div>
          <h1 className="pcs-title">{program.name}</h1>
          <div className="pcs-prog-meta">
            <span>Sponsor: <strong>{program.sponsorPerson.name}</strong>
              {program.sponsorPerson.title ? `, ${program.sponsorPerson.title}` : ''}
            </span>
            <span className="sep">·</span>
            <span>Composite reference tenant</span>
          </div>
        </div>
        <div className="pcs-prog-actions">
          <button className="pcs-btn">Ask Nexus</button>
          <button className="pcs-btn primary">Request phase gate →</button>
        </div>
      </div>

      {/* Meta chips */}
      <div className="pcs-chips">
        <div className="pcs-chip"><span className="label">Deliverables</span><span className="value">{meta.deliverables.length}</span></div>
        <div className="pcs-chip"><span className="label">Open risks</span><span className="value amber">3</span></div>
        <div className="pcs-chip"><span className="label">Turns</span><span className="value">{turns.length}</span></div>
        <div className="pcs-chip"><span className="label">Projected outcome</span><span className="value teal">$14-22M/yr</span></div>
        <div className="pcs-chip"><span className="label">Contradictions</span><span className="value red">3</span></div>
      </div>

      {/* Phase timeline · the signature animated journey visual */}
      <div className="pcs-timeline-card">
        <div className="pcs-timeline">
          {PHASE_KEYS.map((pk) => {
            const pm = PHASE_META[pk];
            const state: 'done' | 'current' | 'selected' | 'future' =
              pm.num < Number(phaseKey.slice(1))
                ? 'done'
                : pm.num === Number(phaseKey.slice(1))
                  ? 'current'
                  : visitedPhases.has(pm.num)
                    ? 'done'
                    : 'future';
            const isLive = pk === currentLive;
            return (
              <button
                key={pk}
                type="button"
                onClick={() => onPhaseClick(pk)}
                className={`pcs-phase ${state} ${isLive ? 'live' : ''}`}
              >
                <div className="pcs-phase-dot" />
                {pm.num < 4 ? <div className="pcs-phase-connector" /> : null}
                <div className="pcs-phase-label">P{pm.num}</div>
                <div className="pcs-phase-name">{pm.title.split(' ')[0]}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Active phase "pop" panel ───────────────────────────── */}
      <section className="pcs-phase-panel phase-pop" key={`panel-${phaseKey}`}>
        <div className="pcs-phase-header">
          <div>
            <div className="pcs-section-label" style={{ color: 'var(--pcs-teal)' }}>
              Phase {meta.num} · {meta.title}
            </div>
            <h2 className="pcs-phase-title">{meta.subtitle}</h2>
            <div className="pcs-phase-tagline">{meta.tagline}</div>
          </div>
        </div>

        {/* Gate banner */}
        <div className="pcs-gate-banner">
          <div className="pcs-gate-icon">●</div>
          <div>
            <div className="pcs-section-label" style={{ color: 'var(--pcs-teal-dark)', marginBottom: 4 }}>
              Exit gate
            </div>
            <div>{meta.gate}</div>
          </div>
        </div>

        {/* Deliverables + conversation · 2 col */}
        <div className="pcs-phase-grid">
          <div className="pcs-phase-col">
            <div className="pcs-section-label">Deliverables · phase {meta.num}</div>
            <div className="pcs-deliverables">
              {meta.deliverables.map((d) => (
                <div key={d.code} className="pcs-deliverable">
                  <div className="pcs-deliverable-main">
                    <span className="pcs-deliverable-code">{d.code}</span>
                    <span className="pcs-deliverable-name">{d.name}</span>
                  </div>
                  <span className={`pcs-deliverable-status ${d.status}`}>{d.status}</span>
                </div>
              ))}
            </div>

            <div className="pcs-section-label" style={{ marginTop: 28 }}>Conversation · Nexus thread</div>
            <div className="pcs-thread">
              {turns.length === 0 ? (
                <div className="pcs-thread-empty">{meta.emptyState}</div>
              ) : (
                turns.slice(0, 4).map((t, i) => (
                  <div key={i} className="pcs-turn">
                    <strong>{(t.speaker ?? 'nexus').toUpperCase()}</strong> {t.text ?? ''}
                  </div>
                ))
              )}
            </div>
          </div>

          <aside className="pcs-phase-aside">
            <div className="pcs-section-label">Peer decisions · phase {meta.num}</div>
            <ul className="pcs-peer-list">
              {meta.peerDecisions.map((d, i) => (
                <li key={i}>
                  <span>{d.title}</span>
                  <span className="pcs-peer-meta">{d.programs} · {d.avgUsd}</span>
                </li>
              ))}
            </ul>

            <div className="pcs-section-label" style={{ marginTop: 24 }}>Client contradictions</div>
            <div className="pcs-contras">
              <div>VBC commitment vs. capability gap</div>
              <div>Shadow AI · PHI risk unowned</div>
              <div className="amber">3 ambient tools · no owner</div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

const canonCss = `
  :root {
    --pcs-bg-dark: #0a0a0b;
    --pcs-bg-cream: #f5f1eb;
    --pcs-bg-surface: #ffffff;
    --pcs-teal: #1d9e75;
    --pcs-teal-dark: #0f6e56;
    --pcs-teal-light: #e1f5ee;
    --pcs-amber: #ba7517;
    --pcs-amber-light: #faeeda;
    --pcs-red: #a32d2d;
    --pcs-red-light: #fceded;
    --pcs-gray-900: #2c2c2a;
    --pcs-gray-700: #444441;
    --pcs-gray-500: #5f5e5a;
    --pcs-gray-300: #b4b2a9;
    --pcs-gray-200: #d3d1c7;
    --pcs-gray-100: #f1efe8;
    --pcs-border: rgba(10, 10, 11, 0.12);
    --pcs-border-strong: rgba(10, 10, 11, 0.24);
  }

  .pcs-root {
    font-family: 'DM Sans', -apple-system, sans-serif;
    background: var(--pcs-bg-cream);
    color: var(--pcs-gray-900);
    font-size: 14px;
    line-height: 1.5;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  .pcs-banner {
    background: var(--pcs-bg-dark);
    color: var(--pcs-bg-cream);
    padding: 10px 32px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .pcs-banner strong { color: var(--pcs-teal); margin-right: 10px; }
  .pcs-banner a { color: var(--pcs-bg-cream); opacity: 0.85; text-decoration: underline; font-size: 11px; }

  /* ─── Dark navbar ─────────────────────────────────────────────── */
  .pcs-navbar {
    background: var(--pcs-bg-dark);
    padding: 14px 32px;
    display: flex;
    align-items: center;
    gap: 24px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .pcs-wordmark { font-family: 'Georgia', serif; color: white; display: flex; align-items: baseline; }
  .pcs-wordmark .abar { font-weight: 800; font-size: 18px; }
  .pcs-wordmark .va { font-weight: 900; font-size: 24px; color: var(--pcs-teal); }
  .pcs-tenant-switcher {
    background: rgba(255,255,255,0.05);
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    border: 1px solid rgba(255,255,255,0.08);
  }
  .pcs-tenant-switcher::before { content: '●'; color: var(--pcs-teal); font-size: 10px; margin-right: 8px; }
  .pcs-nav-links { display: flex; gap: 24px; margin-left: 8px; flex: 1; }
  .pcs-nav-links a {
    color: white; text-decoration: none; font-size: 14px; font-weight: 600;
    opacity: 0.85; transition: all 0.15s;
  }
  .pcs-nav-links a:hover, .pcs-nav-links a.active { color: var(--pcs-teal); opacity: 1; }
  .pcs-nav-right {
    color: white; opacity: 0.85; font-size: 14px; font-weight: 600;
    text-decoration: none;
  }
  .pcs-nav-right:hover { color: var(--pcs-teal); opacity: 1; }

  /* ─── Sub-menu ────────────────────────────────────────────────── */
  .pcs-submenu {
    position: sticky;
    top: 0;
    z-index: 5;
    background: var(--pcs-bg-surface);
    border-bottom: 1px solid var(--pcs-border);
    padding: 10px 32px;
    display: flex;
    gap: 4px;
    align-items: center;
    flex-wrap: wrap;
  }
  .pcs-submenu-divider { width: 1px; height: 22px; background: var(--pcs-border); margin: 0 10px; }

  .pcs-subtab {
    padding: 8px 14px;
    border-radius: 6px;
    background: transparent;
    border: 1px solid transparent;
    color: var(--pcs-gray-700);
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.18s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .pcs-subtab:hover { background: var(--pcs-bg-cream); color: var(--pcs-gray-900); }
  .pcs-subtab.visited { color: var(--pcs-teal-dark); }
  .pcs-subtab.active {
    background: var(--pcs-teal-light);
    color: var(--pcs-teal-dark);
    border-color: rgba(29,158,117,0.32);
    font-weight: 700;
    border-bottom: 2px solid var(--pcs-teal);
  }
  .pcs-subtab.disabled { opacity: 0.4; cursor: not-allowed; }
  .pcs-live-dot {
    display: inline-block;
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--pcs-teal);
    box-shadow: 0 0 0 2px var(--pcs-teal-light);
  }

  .pcs-current-program {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--pcs-gray-500);
    letter-spacing: 0.06em;
  }
  .pcs-current-label { color: var(--pcs-gray-300); }
  .pcs-current-program strong { color: var(--pcs-gray-900); font-weight: 600; }

  /* ─── Stage ───────────────────────────────────────────────────── */
  .pcs-stage { padding: 32px; }
  .pcs-container { max-width: 1280px; margin: 0 auto; }

  .pcs-breadcrumb {
    font-size: 12px;
    color: var(--pcs-gray-500);
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 22px;
  }
  .pcs-breadcrumb a { color: var(--pcs-gray-500); text-decoration: none; }
  .pcs-breadcrumb a:hover { color: var(--pcs-teal); }
  .pcs-breadcrumb .sep { margin: 0 8px; opacity: 0.4; }
  .pcs-breadcrumb .current { color: var(--pcs-gray-700); }

  /* Program header */
  .pcs-prog-header { margin-bottom: 28px; display: flex; justify-content: space-between; align-items: flex-start; gap: 32px; }
  .pcs-prog-main { flex: 1; }
  .pcs-code-row {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--pcs-teal);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 10px;
    font-weight: 600;
  }
  .pcs-title {
    font-family: 'Georgia', serif;
    font-size: 44px;
    font-weight: 400;
    line-height: 1.1;
    letter-spacing: -0.02em;
    color: var(--pcs-gray-900);
    margin-bottom: 12px;
  }
  .pcs-prog-meta {
    color: var(--pcs-gray-500);
    font-size: 14px;
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }
  .pcs-prog-meta strong { color: var(--pcs-gray-900); font-weight: 600; }
  .pcs-prog-meta .sep { opacity: 0.4; }
  .pcs-prog-actions { display: flex; gap: 8px; }

  .pcs-btn {
    padding: 9px 18px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid var(--pcs-border-strong);
    background: transparent;
    color: var(--pcs-gray-900);
    font-family: 'DM Sans', sans-serif;
  }
  .pcs-btn:hover { background: rgba(0,0,0,0.03); }
  .pcs-btn.primary { background: var(--pcs-bg-dark); color: white; border-color: var(--pcs-bg-dark); }

  /* Chips */
  .pcs-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }
  .pcs-chip {
    background: var(--pcs-bg-surface);
    border: 1px solid var(--pcs-border);
    padding: 7px 14px;
    border-radius: 6px;
    font-size: 12px;
    display: inline-flex; gap: 8px; align-items: center;
  }
  .pcs-chip .label {
    color: var(--pcs-gray-500);
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .pcs-chip .value { font-weight: 600; color: var(--pcs-gray-900); }
  .pcs-chip .value.amber { color: var(--pcs-amber); }
  .pcs-chip .value.red { color: var(--pcs-red); }
  .pcs-chip .value.teal { color: var(--pcs-teal); }

  /* ─── SIGNATURE PHASE TIMELINE ─────────────────────────────────── */
  .pcs-timeline-card {
    background: var(--pcs-bg-surface);
    border: 1px solid var(--pcs-border);
    border-radius: 10px;
    padding: 32px 40px 24px;
    margin-bottom: 28px;
  }
  .pcs-timeline {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0;
    position: relative;
  }
  .pcs-phase {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 12px;
    background: transparent;
    border: none;
    cursor: pointer;
    font-family: inherit;
    transition: transform 0.18s ease;
  }
  .pcs-phase:hover { transform: translateY(-2px); }

  .pcs-phase-dot {
    width: 14px; height: 14px;
    border-radius: 50%;
    background: var(--pcs-gray-200);
    border: 3px solid var(--pcs-bg-surface);
    box-shadow: 0 0 0 1px var(--pcs-border-strong);
    z-index: 2;
    position: relative;
    transition: all 0.3s ease;
  }
  .pcs-phase.done .pcs-phase-dot {
    background: var(--pcs-teal);
    box-shadow: 0 0 0 1px var(--pcs-teal);
  }
  .pcs-phase.current .pcs-phase-dot {
    background: white;
    border: 3px solid var(--pcs-bg-surface);
    box-shadow: 0 0 0 2px var(--pcs-teal);
    width: 22px; height: 22px;
    margin-top: -4px; margin-bottom: -4px;
    animation: pcs-halo 2s ease-out infinite;
  }
  .pcs-phase.current .pcs-phase-dot::after {
    content: '';
    position: absolute;
    inset: -8px;
    border-radius: 50%;
    background: rgba(29,158,117,0.15);
    z-index: -1;
    animation: pcs-pulse 2s ease-out infinite;
  }
  @keyframes pcs-halo {
    0%, 100% { box-shadow: 0 0 0 2px var(--pcs-teal), 0 0 0 6px rgba(29,158,117,0); }
    50%      { box-shadow: 0 0 0 2px var(--pcs-teal), 0 0 0 10px rgba(29,158,117,0.22); }
  }
  @keyframes pcs-pulse {
    0%, 100% { transform: scale(1); opacity: 0.6; }
    50%      { transform: scale(1.4); opacity: 0; }
  }

  .pcs-phase-connector {
    position: absolute;
    top: 7px;
    left: calc(50% + 14px);
    right: calc(-50% + 14px);
    height: 2px;
    background: var(--pcs-gray-200);
    z-index: 1;
    transition: background 0.35s ease;
  }
  .pcs-phase.done .pcs-phase-connector,
  .pcs-phase.done + .pcs-phase .pcs-phase-connector { background: var(--pcs-teal); }
  .pcs-phase.current ~ .pcs-phase .pcs-phase-connector { background: var(--pcs-gray-200); }
  /* Fill connector to the current phase when it's done-to-current */
  .pcs-phase.done .pcs-phase-connector { background: var(--pcs-teal); }

  .pcs-phase-label {
    margin-top: 16px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: var(--pcs-gray-500);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    transition: color 0.18s ease;
  }
  .pcs-phase.current .pcs-phase-label { color: var(--pcs-teal); font-weight: 600; }
  .pcs-phase-name {
    margin-top: 4px;
    font-size: 14px;
    font-weight: 600;
    color: var(--pcs-gray-900);
    transition: color 0.18s ease;
  }
  .pcs-phase.current .pcs-phase-name { color: var(--pcs-teal); }
  .pcs-phase.future .pcs-phase-name { color: var(--pcs-gray-300); font-weight: 500; }

  /* ─── PHASE POP PANEL ANIMATION ──────────────────────────────── */
  .pcs-phase-panel { animation: pcs-pop 0.45s cubic-bezier(0.22, 1, 0.36, 1); }
  @keyframes pcs-pop {
    0%   { opacity: 0; transform: translateY(24px) scale(0.985); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }

  .pcs-phase-header { margin-bottom: 20px; }
  .pcs-section-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--pcs-gray-500);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-weight: 600;
    margin-bottom: 8px;
  }
  .pcs-phase-title {
    font-family: 'Georgia', serif;
    font-size: 30px;
    font-weight: 400;
    letter-spacing: -0.02em;
    color: var(--pcs-gray-900);
    line-height: 1.15;
    margin-bottom: 10px;
  }
  .pcs-phase-tagline {
    font-size: 15px;
    color: var(--pcs-gray-700);
    max-width: 780px;
    line-height: 1.55;
  }

  .pcs-gate-banner {
    display: flex;
    gap: 14px;
    padding: 16px 20px;
    background: var(--pcs-teal-light);
    border-radius: 8px;
    border-left: 3px solid var(--pcs-teal);
    margin-bottom: 28px;
    align-items: flex-start;
  }
  .pcs-gate-icon { color: var(--pcs-teal-dark); font-size: 12px; margin-top: 2px; }

  .pcs-phase-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.8fr) minmax(280px, 1fr);
    gap: 28px;
  }

  .pcs-deliverables { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
  .pcs-deliverable {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 16px;
    background: var(--pcs-bg-surface);
    border: 1px solid var(--pcs-border);
    border-radius: 6px;
    transition: all 0.15s;
  }
  .pcs-deliverable:hover { border-color: var(--pcs-border-strong); }
  .pcs-deliverable-main { display: flex; gap: 14px; align-items: center; flex: 1; min-width: 0; }
  .pcs-deliverable-code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--pcs-gray-500);
    letter-spacing: 0.08em;
    min-width: 36px;
  }
  .pcs-deliverable-name { font-weight: 500; color: var(--pcs-gray-900); font-size: 14px; }
  .pcs-deliverable-status {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    padding: 4px 10px;
    border-radius: 4px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-weight: 500;
  }
  .pcs-deliverable-status.ready { background: var(--pcs-teal-light); color: var(--pcs-teal-dark); }
  .pcs-deliverable-status.draft { background: var(--pcs-bg-cream); color: var(--pcs-gray-700); border: 1px solid var(--pcs-border); }
  .pcs-deliverable-status.pending { background: var(--pcs-amber-light); color: var(--pcs-amber); }

  .pcs-thread {
    margin-top: 10px;
    padding: 18px 20px;
    background: var(--pcs-bg-surface);
    border: 1px solid var(--pcs-border);
    border-radius: 8px;
    min-height: 140px;
  }
  .pcs-thread-empty { font-style: italic; color: var(--pcs-gray-500); font-size: 14px; line-height: 1.6; }
  .pcs-turn { font-size: 14px; color: var(--pcs-gray-700); line-height: 1.55; padding: 6px 0; }
  .pcs-turn strong {
    color: var(--pcs-gray-900);
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.12em;
    margin-right: 8px;
  }

  .pcs-phase-aside {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .pcs-peer-list { margin: 0; padding: 0; list-style: none; }
  .pcs-peer-list li {
    display: flex; justify-content: space-between; gap: 12px;
    padding: 10px 0;
    border-top: 1px dashed var(--pcs-border);
    font-size: 13px;
    color: var(--pcs-gray-900);
  }
  .pcs-peer-list li:first-child { border-top: none; }
  .pcs-peer-meta {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--pcs-gray-500);
    white-space: nowrap;
  }
  .pcs-contras > div {
    padding: 8px 0;
    font-size: 13px;
    color: var(--pcs-gray-900);
    border-top: 1px dashed var(--pcs-border);
  }
  .pcs-contras > div:first-child { border-top: none; }
  .pcs-contras > div.amber { color: var(--pcs-amber); }

  /* Portfolio list */
  .pcs-portfolio-list { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
  .pcs-portfolio-row {
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 0.8fr) auto auto;
    gap: 20px;
    align-items: center;
    padding: 16px 20px;
    background: var(--pcs-bg-surface);
    border: 1px solid var(--pcs-border);
    border-radius: 8px;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    color: inherit;
    transition: all 0.15s;
  }
  .pcs-portfolio-row:hover { border-color: rgba(29,158,117,0.35); transform: translateY(-1px); }
  .pcs-portfolio-row.selected {
    border-color: rgba(29,158,117,0.55);
    box-shadow: 0 4px 18px rgba(29,158,117,0.12);
  }
  .pcs-row-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: var(--pcs-gray-500);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .pcs-row-name {
    font-family: 'Georgia', serif;
    font-size: 18px;
    line-height: 1.15;
    letter-spacing: -0.01em;
    color: var(--pcs-gray-900);
  }
  .pcs-row-sub { font-size: 13px; color: var(--pcs-gray-700); }
  .pcs-row-phase {
    font-size: 13px;
    color: var(--pcs-teal);
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600;
    letter-spacing: 0.04em;
  }
  .pcs-row-stats {
    display: flex; gap: 14px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--pcs-gray-500);
  }
  .pcs-row-stats strong { color: var(--pcs-gray-900); font-weight: 600; }
  .pcs-row-stats strong.amber { color: var(--pcs-amber); }
  .pcs-row-cta {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--pcs-teal);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  /* Footer */
  .pcs-footer {
    padding: 18px 32px;
    font-size: 11px;
    color: var(--pcs-gray-500);
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.05em;
    display: flex;
    justify-content: space-between;
    border-top: 1px solid var(--pcs-border);
    background: var(--pcs-bg-cream);
  }

  @media (prefers-reduced-motion: reduce) {
    .pcs-phase.current .pcs-phase-dot,
    .pcs-phase.current .pcs-phase-dot::after,
    .pcs-phase-panel {
      animation: none !important;
    }
  }
`;
