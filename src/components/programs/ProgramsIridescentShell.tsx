'use client';

// ProgramsIridescentShell · Nexus-chat-first · the conversation is the
// anchor, phase journey flows through it. Phase pills below the composer
// are the navigation — click one and the chat switches to that phase's
// thread. No competing heroes. The agent is the center of attention.

import { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { ProgramFullState } from '@/lib/programs/types.ui';

type PhaseKey = 'p0' | 'p1' | 'p2' | 'p3' | 'p4';

type DStatus = 'ready' | 'draft' | 'pending';
interface PhaseSpec {
  num: number;
  short: string;
  full: string;
  summary: string;
  deliverables: Array<{ code: string; name: string; status: DStatus }>;
}

const PHASE_NAMES: Record<PhaseKey, PhaseSpec> = {
  p0: {
    num: 0, short: 'Start', full: 'Intake & Framing',
    summary: 'Baseline the workflow, lock scope, secure sponsor intent.',
    deliverables: [
      { code: 'D01', name: 'Program Charter', status: 'ready' },
      { code: 'D02', name: 'Stakeholder Map', status: 'ready' },
      { code: 'D03', name: 'Risk Register', status: 'draft' },
      { code: 'D04', name: 'Baseline Metrics', status: 'pending' },
    ],
  },
  p1: {
    num: 1, short: 'Diagnose', full: 'Diagnosis & Analysis',
    summary: 'Quantify the gap. Surface contradictions. Build the Hypothesis Tree.',
    deliverables: [
      { code: 'D05', name: 'Hypothesis Tree', status: 'ready' },
      { code: 'D06', name: 'Workstream Charters', status: 'ready' },
      { code: 'D07', name: 'Data Request Log', status: 'draft' },
      { code: 'D08', name: 'Findings Document', status: 'pending' },
    ],
  },
  p2: {
    num: 2, short: 'Design', full: 'Design & Decision',
    summary: 'Synthesize interventions. Build the business case. Lock outcome baseline.',
    deliverables: [
      { code: 'D09', name: 'Option Set', status: 'ready' },
      { code: 'D10', name: 'Decision Brief', status: 'draft' },
      { code: 'D11', name: 'Intervention Charter', status: 'draft' },
      { code: 'D12', name: 'Business Case · 36mo', status: 'pending' },
    ],
  },
  p3: {
    num: 3, short: 'Execute', full: 'Build & Deliver',
    summary: 'Pilot scope. Weekly measurement. Scope-drift refusal.',
    deliverables: [
      { code: 'D13', name: 'Pilot Plan', status: 'ready' },
      { code: 'D14', name: 'Measurement Dash', status: 'draft' },
      { code: 'D15', name: 'Runbook', status: 'pending' },
      { code: 'D16', name: 'Sponsor Read-out', status: 'pending' },
    ],
  },
  p4: {
    num: 4, short: 'Verify', full: 'Outcome & Accountability',
    summary: 'Dual-ledger reconciliation. Evidence Ledger audit. Pattern promotion.',
    deliverables: [
      { code: 'D17', name: 'Decision Memo', status: 'ready' },
      { code: 'D18', name: 'Dual-Ledger Recon', status: 'draft' },
      { code: 'D19', name: 'Pattern Package', status: 'pending' },
      { code: 'D20', name: 'Outcome Attestation', status: 'pending' },
    ],
  },
};

const PHASE_KEYS: PhaseKey[] = ['p0', 'p1', 'p2', 'p3', 'p4'];

const PHASE_CONVERSATIONS: Record<PhaseKey, Array<{ speaker: 'you' | 'nexus'; text: string }>> = {
  p0: [
    { speaker: 'you', text: 'Restating for the record: two ambient vendors in parallel — Abridge in primary care (800 docs, 70% adoption) and DAX Copilot Epic-embedded in specialty (1,400 docs, 55% adoption). Burnout trending worse despite adoption. CMIO wants consolidation, primary care wants to keep Abridge.' },
    { speaker: 'nexus', text: 'Heard. Before the charter locks, let me pressure-test the burnout signal. Adoption is 70% and 55%, and burnout is *worse* — that is the thing that should scare us. Two hypotheses land differently: (a) the tools reduce keystrokes but increase cognitive load because clinicians verify every note, or (b) the backlog grew faster than the tools compensated. Which one is true changes the answer entirely.' },
    { speaker: 'you', text: 'CMIO believes (a) and wants to consolidate. Primary care believes Abridge already fixed (a) for them and DAX is the laggard.' },
    { speaker: 'nexus', text: 'Good — that\'s the contradiction for the charter. I will draft scope around three options for Phase 2: consolidate to Abridge, consolidate to DAX, or retain both with workflow redesign. Each option gets a business case and a sponsor-decision gate. Ready to open the baseline-locking module?' },
  ],
  p1: [
    { speaker: 'nexus', text: 'Diagnosis brief: 30-day note quality pulled. Abridge 2.1% material error on assessment sections; DAX 3.6%. But clinicians correct DAX before sign-off at higher rates, so final-note accuracy converges. Error patterns differ — Abridge misses discourse markers, DAX misses negations. Different failure modes, different redesigns.' },
    { speaker: 'you', text: 'So CMIO and primary care are both right. They describe different problems. Add H3 to the Hypothesis Tree: "complementary failure modes · hybrid plus review redesign beats consolidation."' },
    { speaker: 'nexus', text: 'Drafted. Evidence Ledger has 8 supporting note samples. Contradictions log has 3 items · 2 primary-care workflow interviews, 1 specialty documentation audit. Ready to propose Phase 1 gate read-out to Sarah.' },
  ],
  p2: [
    { speaker: 'nexus', text: 'Three charters drafted. A: consolidate to Abridge · $2.4M/yr license delta · 18mo ROI. B: consolidate to DAX · $1.8M/yr · 22mo ROI, tighter Epic integration. C: retain both + workflow redesign · $0.9M/yr cost · 11mo ROI on burnout. All share the same outcome baseline: cognitive-load score, 30-day burnout trend, note-quality audit.' },
    { speaker: 'you', text: 'Sarah needs $8-11M scope. Can we land C below that without cutting measurement?' },
    { speaker: 'nexus', text: 'Yes · pull facilitator travel and internalise QA audit sampling — lands at $850K with 12mo ROI on the burnout metric. Decision Brief is ready with A/B/C tradeoff, dissent captured from CMIO and primary care, and recommended path (C). Business Case · 36mo attached.' },
  ],
  p3: [
    { speaker: 'nexus', text: 'Week 6 pilot read-out. Primary care cohort burnout -14%, specialty -9%. Note-quality audit passing 96% weekly. No scope creep flagged. One risk · specialty leads want a second workflow-redesign iteration with a structured attending-review step.' },
    { speaker: 'you', text: 'Approve the iteration inside the scope envelope. No capital increase.' },
    { speaker: 'nexus', text: 'Recorded as a Decision Log entry — within-scope iteration, no capital. Sponsor read-out draft ready for Sarah Friday.' },
  ],
  p4: [
    { speaker: 'nexus', text: 'Dual-ledger reconciling. AbarVa ledger: $6.2M annualized cognitive-load recovery across cohorts. Client finance ledger: $5.8M (they exclude one overhead line). Delta reconciled · attestation draft ready for CFO sign-off.' },
    { speaker: 'you', text: 'Push the attestation. Ready to promote the pattern?' },
    { speaker: 'nexus', text: 'Legal anonymization review in progress · 3 days. Once cleared, pattern promotes with 47 observations and a recommended starter charter for analogous programs. First Meridian pattern contribution.' },
  ],
};

function phaseKeyFor(program: ProgramFullState | null): PhaseKey {
  if (!program) return 'p0';
  const p = Math.max(0, Math.min(4, program.currentPhase ?? 0));
  return (`p${p}` as PhaseKey);
}

function initialsOf(name: string): string {
  return name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export function ProgramsIridescentShell({ programs }: { programs: ProgramFullState[] }) {
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(programs[0]?.id ?? null);
  const [activePhase, setActivePhase] = useState<PhaseKey>('p0');
  const [visitedPhases, setVisitedPhases] = useState<Set<number>>(new Set([0]));
  const [transitionKey, setTransitionKey] = useState(0);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const selectedProgram = useMemo(
    () => (selectedProgramId ? programs.find((p) => p.id === selectedProgramId) ?? null : null),
    [selectedProgramId, programs],
  );

  useEffect(() => {
    setVisitedPhases((prev) => {
      const next = new Set(prev);
      next.add(PHASE_NAMES[activePhase].num);
      return next;
    });
    setTransitionKey((k) => k + 1);
    // Scroll chat to bottom on phase change
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100);
  }, [activePhase]);

  const conversation = PHASE_CONVERSATIONS[activePhase];
  const phaseMeta = PHASE_NAMES[activePhase];

  if (!selectedProgram) {
    return <div style={{ padding: 40, fontFamily: 'DM Sans, sans-serif' }}>No program available.</div>;
  }

  const sponsorName = selectedProgram.sponsorPerson.name;
  const sponsorTitle = selectedProgram.sponsorPerson.title ?? 'Sponsor';
  const sponsorInitials = initialsOf(sponsorName);

  return (
    <div className="pis-root">
      <style>{iridescentCss}</style>

      {/* Minimal navbar · one strip · AbarVa + tenant + Programs active */}
      <nav className="pis-navbar">
        <div className="pis-navbar-left">
          <div className="pis-wordmark">
            <span className="dot" />
            <span><span className="abar">Abar</span><span className="va">Va</span></span>
          </div>
          <select
            className="pis-nav-select"
            value={selectedProgramId ?? ''}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedProgramId(id);
              const prog = programs.find((x) => x.id === id);
              setActivePhase(phaseKeyFor(prog ?? null));
              setVisitedPhases(new Set([Number(phaseKeyFor(prog ?? null).slice(1))]));
            }}
            aria-label="Program"
          >
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.clientName} · {p.name}</option>
            ))}
          </select>
        </div>
        <div className="pis-navbar-center">
          <Link href="/home">Home</Link>
          <Link href="/preview/programs" className="active">Programs</Link>
          <Link href="/preview/intelligence">Intelligence</Link>
          <Link href="/preview/tower">Control Tower</Link>
        </div>
        <div className="pis-navbar-right">
          <Link href="/programs" className="pis-nav-compare">Current ↗</Link>
          <div className="pis-user-avatar" title={`${sponsorName} · ${sponsorTitle}`}>{sponsorInitials}</div>
        </div>
      </nav>

      {/* ─── CHAT STAGE · pure Nexus focus ─────────────────────────── */}
      <main className="pis-chat-stage">
        {/* One line · program title · small, not a hero */}
        <div className="pis-chat-topline">
          <h1 className="pis-program-title">{selectedProgram.name}</h1>
        </div>

        {/* Phase-journey pills · the ONE navigation */}
        <div className="pis-phase-anchors" role="tablist" aria-label="Phase journey">
          {PHASE_KEYS.map((pk) => {
            const meta = PHASE_NAMES[pk];
            const active = activePhase === pk;
            const visited = visitedPhases.has(meta.num);
            const live = pk === phaseKeyFor(selectedProgram);
            return (
              <button
                key={pk}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActivePhase(pk)}
                className={`pis-phase-anchor ${active ? 'active' : ''} ${visited ? 'visited' : ''} ${live ? 'live' : ''}`}
              >
                <span className="pis-phase-anchor-num">P{meta.num}</span>
                <span className="pis-phase-anchor-name">{meta.short}</span>
              </button>
            );
          })}
        </div>

        {/* 2-col · chat (main, wide, tall) + deliverables rail (only) */}
        <div className="pis-chat-layout" key={transitionKey}>
          <div className="pis-chat-window">
            <div className="pis-chat-messages">
              {conversation.map((turn, i) => (
                <div key={i} className={`pis-bubble ${turn.speaker}`}>
                  <div className="pis-bubble-avatar">
                    {turn.speaker === 'you' ? sponsorInitials : '✱'}
                  </div>
                  <div className="pis-bubble-content">
                    <div className="pis-bubble-speaker">{turn.speaker === 'you' ? 'You' : 'Nexus'}</div>
                    <div className="pis-bubble-body">{turn.text}</div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Composer · anchored at bottom */}
            <form
              className="pis-chat-composer"
              onSubmit={(e) => { e.preventDefault(); setInput(''); }}
            >
              <div className="pis-composer-row">
                <button type="button" className="pis-composer-plus" aria-label="Attach">+</button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Reply to Nexus in Phase ${phaseMeta.num} · ${phaseMeta.short}…`}
                  className="pis-composer-input"
                />
                <div className="pis-composer-meta">Opus 4.7</div>
                <button type="submit" className="pis-composer-send" aria-label="Send">↵</button>
              </div>
            </form>

            {/* Subtle contradictions link · no card chrome */}
            <div className="pis-inline-signals">
              <span className="pis-inline-signal">
                <span className="pis-inline-dot amber" /> 3 contradictions surfaced · <a href="#">view all</a>
              </span>
            </div>
          </div>

          {/* SIDE RAIL · deliverables only · nothing else */}
          <aside className="pis-side-rail">
            <div className="pis-side-heading">Phase {phaseMeta.num} deliverables</div>
            <div className="pis-side-deliverables">
              {phaseMeta.deliverables.map((d) => (
                <button key={d.code} type="button" className={`pis-side-deliverable ${d.status}`}>
                  <div className="pis-side-deliverable-main">
                    <span className="pis-side-deliverable-code">{d.code}</span>
                    <span className="pis-side-deliverable-name">{d.name}</span>
                  </div>
                  <span className={`pis-side-deliverable-status ${d.status}`} aria-label={d.status}>
                    {d.status === 'ready' ? '●' : d.status === 'draft' ? '◐' : '○'}
                  </span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </main>

      {/* Composite footer */}
      <div className="pis-footer">
        <span>Composite organization built from real-world data · not a real customer</span>
        <span>Nexus-first design · chat anchors the 5-phase journey</span>
      </div>
    </div>
  );
}

const iridescentCss = `
  :root {
    --pis-dark: #0a0a0a;
    --pis-dark-panel: #111111;
    --pis-dark-card: #161616;
    --pis-ink: #1a1612;
    --pis-cream: #F5F1EB;
    --pis-cream-deep: #F1ECE2;
    --pis-teal: #14B8A6;
    --pis-teal-dark: #0a5849;
    --pis-amber: #F59E0B;
    --pis-purple: #A78BFA;
    --pis-pink: #F472B6;
  }

  /* Minimal navbar · single strip · program select · Programs tab active */
  .pis-navbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 32px;
    background: var(--pis-dark);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .pis-navbar-left { display: flex; align-items: center; gap: 24px; }
  .pis-navbar-center { display: flex; gap: 28px; }
  .pis-navbar-center a {
    font-size: 14px; color: rgba(255,255,255,0.55); text-decoration: none;
    transition: color 0.15s;
  }
  .pis-navbar-center a:hover { color: #f4f4f2; }
  .pis-navbar-center a.active {
    color: var(--pis-teal); font-weight: 700;
    border-bottom: 2px solid var(--pis-teal); padding-bottom: 4px;
  }
  .pis-navbar-right { display: flex; align-items: center; gap: 14px; }
  .pis-nav-compare {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
    color: rgba(255,255,255,0.45); text-decoration: none;
  }
  .pis-nav-compare:hover { color: var(--pis-teal); }
  .pis-nav-select {
    padding: 6px 28px 6px 12px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: #f4f4f2;
    border-radius: 6px;
    font-family: inherit; font-size: 13px; cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%23aaa' d='M0 0h10L5 6z'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 10px center;
    max-width: 360px;
  }
  .pis-nav-select:focus { outline: 1px solid var(--pis-teal); outline-offset: 1px; }

  .pis-root {
    font-family: 'DM Sans', -apple-system, sans-serif;
    background: var(--pis-dark);
    color: #f4f4f2;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  /* Banner */
  .pis-banner {
    background: var(--pis-dark);
    color: #f4f4f2;
    padding: 10px 32px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .pis-banner strong { color: var(--pis-teal); margin-right: 10px; }
  .pis-banner a { color: #f4f4f2; opacity: 0.85; text-decoration: underline; font-size: 11px; }

  /* Navbar */
  .pis-navbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 32px;
    background: var(--pis-dark);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .pis-navbar-left { display: flex; align-items: center; gap: 40px; }
  .pis-wordmark { display: flex; align-items: center; gap: 8px; font-family: 'Georgia', serif; font-size: 18px; color: #f4f4f2; }
  .pis-wordmark .dot { width: 18px; height: 18px; border-radius: 50%; background: var(--pis-teal); }
  .pis-wordmark .abar { font-weight: 800; }
  .pis-wordmark .va { color: var(--pis-teal); font-weight: 900; }
  .pis-tenant-chip { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #f4f4f2; }
  .pis-tenant-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--pis-teal); }
  .pis-nav-links { display: flex; gap: 28px; margin-left: 10px; }
  .pis-nav-links a { font-size: 14px; color: rgba(255,255,255,0.6); text-decoration: none; transition: color 0.15s; }
  .pis-nav-links a:hover { color: #f4f4f2; }
  .pis-nav-links a.active { color: var(--pis-teal); font-weight: 700; border-bottom: 2px solid var(--pis-teal); padding-bottom: 4px; }
  .pis-navbar-right { display: flex; align-items: center; gap: 10px; }
  .pis-user-card { text-align: right; }
  .pis-user-name { font-size: 13px; font-weight: 600; color: #f4f4f2; }
  .pis-user-role { font-size: 11px; color: var(--pis-teal); font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.08em; }
  .pis-user-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--pis-teal); color: var(--pis-dark); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }

  /* Program picker · single row with dropdown */
  .pis-program-picker {
    background: var(--pis-dark);
    padding: 10px 32px 12px;
    display: flex; gap: 12px; align-items: center;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .pis-program-picker-label { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.45); }
  .pis-program-select {
    padding: 6px 28px 6px 12px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: #f4f4f2;
    border-radius: 6px;
    font-family: inherit;
    font-size: 13px;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%23aaa' d='M0 0h10L5 6z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
  }
  .pis-program-select:focus { outline: 1px solid var(--pis-teal); outline-offset: 1px; }
  .pis-program-sub { font-size: 12px; color: rgba(255,255,255,0.55); font-family: 'JetBrains Mono', monospace; letter-spacing: 0.04em; }

  /* ─── CHAT-CENTERED STAGE · 2-col with side rail ────────────── */
  .pis-chat-stage {
    max-width: 1320px;
    margin: 0 auto;
    padding: 28px 32px 60px;
    background: var(--pis-dark);
  }

  .pis-chat-topline {
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .pis-program-title {
    font-family: 'Georgia', serif;
    font-size: 32px;
    font-weight: 600;
    letter-spacing: -0.015em;
    line-height: 1.1;
    color: #f4f4f2;
    margin: 0;
  }

  /* Two-col layout · chat is LEFT (main), side rail is RIGHT */
  .pis-chat-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 24px;
    align-items: start;
    animation: pis-pop 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  }
  @keyframes pis-pop {
    0%   { opacity: 0; transform: translateY(16px) scale(0.99); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* The chat window · CENTER OF ATTENTION */
  .pis-chat-window {
    animation: pis-pop 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  }
  @keyframes pis-pop {
    0%   { opacity: 0; transform: translateY(16px) scale(0.99); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }

  .pis-chat-phase-banner {
    padding: 16px 20px;
    background:
      radial-gradient(ellipse 400px 200px at 20% 0%, rgba(20,184,166,0.12), transparent 60%),
      rgba(20,184,166,0.04);
    border: 1px solid rgba(20,184,166,0.22);
    border-radius: 14px;
    margin-bottom: 16px;
  }
  .pis-chat-phase-label {
    display: flex; align-items: center; gap: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--pis-teal);
    font-weight: 700;
    margin-bottom: 8px;
  }
  .pis-chat-phase-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--pis-teal);
    box-shadow: 0 0 0 0 rgba(20,184,166,0.5);
    animation: pis-halo 2s ease-out infinite;
  }
  @keyframes pis-halo {
    0%, 100% { box-shadow: 0 0 0 0 rgba(20,184,166,0.5); }
    50%      { box-shadow: 0 0 0 8px rgba(20,184,166,0); }
  }
  .pis-chat-phase-summary { font-size: 14px; line-height: 1.55; color: rgba(255,255,255,0.82); }

  /* Messages */
  .pis-chat-messages {
    display: flex; flex-direction: column; gap: 18px;
    margin-bottom: 20px;
  }
  .pis-bubble {
    display: flex; gap: 14px;
    padding: 4px 0;
  }
  .pis-bubble-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700;
  }
  .pis-bubble.you .pis-bubble-avatar { background: rgba(255,255,255,0.08); color: #f4f4f2; }
  .pis-bubble.nexus .pis-bubble-avatar {
    background: var(--pis-teal); color: var(--pis-dark);
    font-family: 'Georgia', serif; font-size: 18px;
  }
  .pis-bubble-content { flex: 1; min-width: 0; }
  .pis-bubble-speaker {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.4);
    margin-bottom: 6px;
  }
  .pis-bubble.nexus .pis-bubble-speaker { color: var(--pis-teal); font-weight: 700; }
  .pis-bubble-body { font-size: 15px; line-height: 1.65; color: rgba(255,255,255,0.92); }
  .pis-bubble-body em { color: var(--pis-amber); font-style: normal; font-weight: 600; }

  /* Composer · the central affordance */
  .pis-chat-composer {
    background: var(--pis-dark-card);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 14px 18px;
    margin-bottom: 22px;
    box-shadow: 0 4px 28px rgba(0,0,0,0.35);
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
  }
  .pis-chat-composer:focus-within {
    border-color: rgba(20,184,166,0.45);
    box-shadow: 0 4px 28px rgba(0,0,0,0.35), 0 0 0 3px rgba(20,184,166,0.1);
  }
  .pis-composer-hint {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.4);
    margin-bottom: 10px;
  }
  .pis-composer-row { display: flex; align-items: center; gap: 12px; }
  .pis-composer-plus {
    width: 32px; height: 32px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.6);
    border-radius: 999px;
    cursor: pointer; font-size: 18px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: all 0.15s;
  }
  .pis-composer-plus:hover { background: rgba(255,255,255,0.1); color: #f4f4f2; }
  .pis-composer-input {
    flex: 1;
    background: transparent;
    border: none;
    color: #f4f4f2;
    font-family: inherit;
    font-size: 15px;
    outline: none;
  }
  .pis-composer-input::placeholder { color: rgba(255,255,255,0.35); }
  .pis-composer-meta {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    color: rgba(255,255,255,0.4);
  }
  .pis-composer-send {
    width: 36px; height: 36px;
    background: var(--pis-teal);
    border: none; color: var(--pis-dark);
    border-radius: 999px;
    cursor: pointer; font-size: 14px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: all 0.15s;
  }
  .pis-composer-send:hover { background: #0fa896; }

  /* Inline signals · subtle link row after composer */
  .pis-inline-signals {
    display: flex;
    justify-content: center;
    margin-top: 14px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.06em;
    color: rgba(255,255,255,0.45);
  }
  .pis-inline-signal { display: inline-flex; align-items: center; gap: 8px; }
  .pis-inline-signal a { color: var(--pis-teal); text-decoration: none; }
  .pis-inline-signal a:hover { text-decoration: underline; }
  .pis-inline-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
  .pis-inline-dot.amber { background: var(--pis-amber); box-shadow: 0 0 0 2px rgba(245,158,11,0.18); }

  /* Side rail · deliverables only · minimal */
  .pis-side-rail {
    position: sticky;
    top: 24px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    padding: 18px;
  }
  .pis-side-heading {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.5);
    margin-bottom: 12px;
    font-weight: 600;
  }
  .pis-side-deliverables { display: flex; flex-direction: column; gap: 4px; }
  .pis-side-deliverable {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    align-items: center;
    padding: 10px 12px;
    background: transparent;
    border: 1px solid transparent;
    color: rgba(255,255,255,0.85);
    border-radius: 8px;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    font-size: 13px;
    transition: all 0.15s;
  }
  .pis-side-deliverable:hover {
    background: rgba(255,255,255,0.04);
    border-color: rgba(255,255,255,0.08);
  }
  .pis-side-deliverable-main { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
  .pis-side-deliverable-code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    color: rgba(255,255,255,0.4);
  }
  .pis-side-deliverable.ready .pis-side-deliverable-code { color: var(--pis-teal); }
  .pis-side-deliverable.pending .pis-side-deliverable-code { color: var(--pis-amber); }
  .pis-side-deliverable-name {
    font-size: 13px;
    color: rgba(255,255,255,0.88);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .pis-side-deliverable-status { font-size: 11px; color: rgba(255,255,255,0.4); }
  .pis-side-deliverable-status.ready { color: var(--pis-teal); }
  .pis-side-deliverable-status.draft { color: rgba(255,255,255,0.55); }
  .pis-side-deliverable-status.pending { color: var(--pis-amber); }

  /* Phase anchors · Claude.ai-style action pills under the chat */
  .pis-phase-anchors {
    display: flex; gap: 10px;
    justify-content: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .pis-phase-anchor {
    display: flex; align-items: center; gap: 8px;
    padding: 9px 18px;
    background: var(--pis-dark-card);
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.75);
    border-radius: 999px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .pis-phase-anchor:hover {
    background: rgba(20,184,166,0.08);
    border-color: rgba(20,184,166,0.3);
    color: #f4f4f2;
    transform: translateY(-1px);
  }
  .pis-phase-anchor.visited:not(.active) {
    background: rgba(20,184,166,0.06);
    border-color: rgba(20,184,166,0.2);
  }
  .pis-phase-anchor.active {
    background: rgba(20,184,166,0.18);
    border: 1.5px solid var(--pis-teal);
    color: var(--pis-teal);
    font-weight: 700;
    box-shadow: 0 4px 16px rgba(20,184,166,0.2);
  }
  .pis-phase-anchor.live::before {
    content: '';
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--pis-teal);
    box-shadow: 0 0 0 2px rgba(20,184,166,0.25);
    display: inline-block;
  }
  .pis-phase-anchor-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    opacity: 0.75;
    font-weight: 600;
  }
  .pis-phase-anchor.active .pis-phase-anchor-num { opacity: 1; }
  .pis-phase-anchor-name { font-size: 13px; }

  /* Deliverables chip row · compact */
  .pis-chat-deliverables {
    display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;
    padding: 12px 0 4px;
  }
  .pis-chat-deliverables-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.4);
    align-self: center;
    margin-right: 4px;
  }
  .pis-deliverable-chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 10px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 999px;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .pis-deliverable-chip:hover { background: rgba(255,255,255,0.08); }
  .pis-deliverable-chip.ready { background: rgba(20,184,166,0.08); border-color: rgba(20,184,166,0.3); }
  .pis-deliverable-chip.pending { background: rgba(245,158,11,0.06); border-color: rgba(245,158,11,0.22); }
  .pis-deliverable-code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.06em;
    opacity: 0.65;
  }
  .pis-deliverable-chip.ready .pis-deliverable-code { color: var(--pis-teal); opacity: 1; }
  .pis-deliverable-chip.pending .pis-deliverable-code { color: var(--pis-amber); opacity: 1; }
  .pis-deliverable-name { color: rgba(255,255,255,0.82); }

  /* Context drawer · peripheral, collapsed */
  .pis-context-drawer {
    margin-top: 32px;
    border-top: 1px solid rgba(255,255,255,0.06);
    padding-top: 20px;
  }
  .pis-context-summary {
    display: flex; justify-content: space-between; align-items: center;
    cursor: pointer;
    padding: 10px 14px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.6);
    list-style: none;
    transition: all 0.15s;
  }
  .pis-context-summary::-webkit-details-marker { display: none; }
  .pis-context-summary:hover { color: #f4f4f2; border-color: rgba(255,255,255,0.12); }
  .pis-context-chevron { transition: transform 0.2s; }
  .pis-context-drawer[open] .pis-context-chevron { transform: rotate(180deg); }
  .pis-context-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
    margin-top: 14px;
  }
  .pis-context-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    padding: 14px 16px;
  }
  .pis-context-card.amber { border-color: rgba(245,158,11,0.2); }
  .pis-context-card.purple { border-color: rgba(167,139,250,0.2); }
  .pis-context-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.45);
    margin-bottom: 8px;
  }
  .pis-context-label.amber { color: var(--pis-amber); }
  .pis-context-label.purple { color: var(--pis-purple); }
  .pis-context-name { font-size: 14px; font-weight: 700; color: #f4f4f2; margin-bottom: 3px; }
  .pis-context-sub { font-size: 12px; color: rgba(255,255,255,0.55); }
  .pis-contradiction-mini {
    padding: 6px 0;
    border-top: 1px dashed rgba(255,255,255,0.08);
    font-size: 12px;
    line-height: 1.45;
    color: rgba(255,255,255,0.78);
  }
  .pis-contradiction-mini:first-of-type { border-top: none; padding-top: 0; }

  /* Footer */
  .pis-footer {
    padding: 18px 32px;
    font-size: 11px;
    color: rgba(255,255,255,0.45);
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.05em;
    display: flex; justify-content: space-between;
    background: var(--pis-dark);
    border-top: 1px solid rgba(255,255,255,0.06);
  }

  @media (max-width: 900px) {
    .pis-context-grid { grid-template-columns: 1fr; }
    .pis-chat-topline { flex-direction: column; align-items: flex-start; gap: 16px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .pis-chat-window, .pis-phase-anchor, .pis-chat-phase-dot { animation: none !important; transition: none !important; }
  }
`;
