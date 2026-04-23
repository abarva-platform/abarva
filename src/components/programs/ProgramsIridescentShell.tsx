'use client';

// ProgramsIridescentShell · Nexus-chat-first, cream aesthetic.
// The (maestro) layout already renders AbarvaNav · this component does
// NOT render its own navbar. Just the chat + phase journey + side rail.

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { ProgramFullState } from '@/lib/programs/types.ui';
import { PhaseGateControl } from '@/components/programs/PhaseGateControl';

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
    { speaker: 'nexus', text: 'Legal anonymization review in progress · 3 days. Once cleared, pattern promotes with 47 observations and a recommended starter charter for analogous programs. First pattern contribution from this program.' },
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

function nexusAck(step: IntakeStep, choiceId: string, _intake: IntakeState, _nextStep: IntakeStep): string {
  const choice = INTAKE_LABELS[choiceId] ?? choiceId;
  if (step === 'archetype') {
    return `"${choice}". Good — I will pre-load the pattern library scope for that archetype. Peer decisions from analogous programs will surface starting Phase 1. Who is the sponsor?`;
  }
  if (step === 'sponsor') {
    return `Sponsor set to ${choice}. I have their communication style on file — I will calibrate first-meeting framing. What is the value at stake?`;
  }
  if (step === 'value') {
    return `Value at stake: ${choice}. I will lock the baseline methodology in Phase 1 and keep the capital envelope inside the range. How wide is the scope?`;
  }
  if (step === 'scope') {
    return `Scope: ${choice}. That is enough to draft the charter. Review the four inputs on the right and approve when ready — I will open Phase 0 and begin the baseline-locking conversation immediately.`;
  }
  return choice;
}

function IntakeGuidedChoice({
  step,
  onChoice,
  onEscape,
}: {
  step: { prompt: string; options: Array<{ id: string; label: string; sub?: string }> };
  onChoice: (id: string, label: string) => void;
  onEscape: (text: string) => void;
}) {
  const [text, setText] = useState('');
  return (
    <div className="pis-intake-guided">
      <div className="pis-intake-guided-prompt">{step.prompt}</div>
      <div className="pis-intake-guided-options">
        {step.options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className="pis-intake-chip"
            onClick={() => onChoice(opt.id, opt.label)}
          >
            <span className="pis-intake-chip-label">{opt.label}</span>
            {opt.sub ? <span className="pis-intake-chip-sub">{opt.sub}</span> : null}
          </button>
        ))}
      </div>
      <form
        className="pis-intake-escape"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) { onEscape(text.trim()); setText(''); }
        }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Something else…"
          className="pis-intake-escape-input"
        />
        <button type="submit" className="pis-intake-escape-send" aria-label="Send">↵</button>
      </form>
    </div>
  );
}

function IntakeProgressItem({ label, done, value, active }: { label: string; done: boolean; value: string | null; active: boolean }) {
  return (
    <div className={`pis-intake-progress ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
      <span className="pis-intake-progress-dot" aria-hidden="true" />
      <div className="pis-intake-progress-content">
        <div className="pis-intake-progress-label">{label}</div>
        {value ? <div className="pis-intake-progress-value">{value}</div> : null}
      </div>
    </div>
  );
}

type Mode = 'phase' | 'intake';

type IntakeStep = 'archetype' | 'sponsor' | 'value' | 'scope' | 'review';
interface IntakeState {
  archetype: string | null;
  sponsor: string | null;
  valueAtStake: string | null;
  scope: string | null;
}

const INTAKE_OPTIONS: Record<IntakeStep, { prompt: string; options: Array<{ id: string; label: string; sub?: string }> } | null> = {
  archetype: {
    prompt: 'What kind of program are you creating? I will anchor to the pattern library.',
    options: [
      { id: 'healthcare-prior-auth', label: 'Healthcare · Prior Authorization AI', sub: 'Denial + throughput pattern · 9 peer observations' },
      { id: 'retail-owned-brand', label: 'Retail · Owned-Brand Margin Recovery', sub: 'Morrison-analogous · 12 peer observations · pattern live' },
      { id: 'finserv-cost-income', label: 'FinServ · Cost-to-Income Compression', sub: 'Middle-office AI pattern · 7 peer observations' },
      { id: 'energy-asset-reliability', label: 'Energy · Asset Reliability & Downtime', sub: 'Field-ops AI pattern · 5 peer observations' },
    ],
  },
  sponsor: {
    prompt: 'Who sponsors the decision? I will pull their communication style from the graph once you confirm.',
    options: [
      { id: 'sponsor-cfo', label: 'CFO', sub: 'Cost-side framing · weekly cadence · board-facing' },
      { id: 'sponsor-cio', label: 'CIO / CTO', sub: 'Platform + data seat · cross-portfolio view' },
      { id: 'sponsor-cmo', label: 'CMO / CCO', sub: 'Revenue-side framing · customer-outcome pressure' },
      { id: 'sponsor-coo', label: 'COO / Ops lead', sub: 'Throughput + reliability framing · operational cadence' },
    ],
  },
  value: {
    prompt: 'What is the value at stake? A range is fine — I will lock a baseline in Phase 1.',
    options: [
      { id: 'v-small', label: '$2-5M annual impact', sub: 'Typical for single-workstream programs' },
      { id: 'v-medium', label: '$5-15M annual impact', sub: 'Multi-lever · 12-18 month programs' },
      { id: 'v-large', label: '$15M+ annual impact', sub: 'Enterprise-grade · 3+ workstreams · board-level' },
      { id: 'v-unknown', label: 'Not yet quantified', sub: 'I will run a sizing pass in diagnosis' },
    ],
  },
  scope: {
    prompt: 'How wide is the scope? Tighter scope moves faster through Phase 0.',
    options: [
      { id: 's-single', label: 'Single workstream · 1 decision owner', sub: 'Fastest path to Phase 1 gate · 2-3 week charter' },
      { id: 's-multi', label: 'Multi-workstream · 1 sponsor', sub: '4-6 week charter with coordination overhead' },
      { id: 's-enterprise', label: 'Enterprise-wide · co-sponsored', sub: '6-8 week charter · dual-sponsor governance' },
    ],
  },
  review: null,
};

const INTAKE_LABELS: Record<string, string> = {
  'healthcare-prior-auth': 'Healthcare · Prior Authorization AI',
  'retail-owned-brand': 'Retail · Owned-Brand Margin Recovery',
  'finserv-cost-income': 'FinServ · Cost-to-Income Compression',
  'energy-asset-reliability': 'Energy · Asset Reliability & Downtime',
  'sponsor-cfo': 'CFO',
  'sponsor-cio': 'CIO / CTO',
  'sponsor-cmo': 'CMO / CCO',
  'sponsor-coo': 'COO / Ops lead',
  'v-small': '$2-5M annual impact',
  'v-medium': '$5-15M annual impact',
  'v-large': '$15M+ annual impact',
  'v-unknown': 'Not yet quantified · sizing pass in diagnosis',
  's-single': 'Single workstream · 1 decision owner',
  's-multi': 'Multi-workstream · 1 sponsor',
  's-enterprise': 'Enterprise-wide · co-sponsored',
};

interface ProgramsIridescentShellProps {
  programs: ProgramFullState[];
  // Display name of the signed-in user's active tenant. Used for the
  // empty state when the tenant has no programs yet — keeps the page
  // coherent with the nav dropdown.
  activeClientName?: string | null;
}

export function ProgramsIridescentShell({ programs, activeClientName = null }: ProgramsIridescentShellProps) {
  const initialPhase = phaseKeyFor(programs[0] ?? null);
  const [mode, setMode] = useState<Mode>(programs.length === 0 ? 'intake' : 'phase');
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(programs[0]?.id ?? null);
  const [activePhase, setActivePhase] = useState<PhaseKey>(initialPhase);
  const [visitedPhases, setVisitedPhases] = useState<Set<number>>(new Set([PHASE_NAMES[initialPhase].num]));
  const [transitionKey, setTransitionKey] = useState(0);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Intake state
  const [intakeStep, setIntakeStep] = useState<IntakeStep>('archetype');
  const [intake, setIntake] = useState<IntakeState>({ archetype: null, sponsor: null, valueAtStake: null, scope: null });
  const [intakeLog, setIntakeLog] = useState<Array<{ speaker: 'you' | 'nexus'; text: string }>>([
    {
      speaker: 'nexus',
      text: 'A new program starts with four questions. I will anchor each to the pattern library so analogous peer decisions are available from Phase 1. Nothing free-text until we hit the charter — I will give you options.',
    },
  ]);

  const selectedProgram = useMemo(
    () => (selectedProgramId ? programs.find((p) => p.id === selectedProgramId) ?? null : null),
    [selectedProgramId, programs],
  );

  const navigateToPhase = (pk: PhaseKey) => {
    setActivePhase(pk);
    setVisitedPhases((prev) => {
      const next = new Set(prev);
      next.add(PHASE_NAMES[pk].num);
      return next;
    });
    setTransitionKey((k) => k + 1);
  };

  useEffect(() => {
    const id = window.setTimeout(
      () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }),
      100,
    );
    return () => window.clearTimeout(id);
  }, [activePhase, transitionKey]);

  const conversation = PHASE_CONVERSATIONS[activePhase];
  const phaseMeta = PHASE_NAMES[activePhase];

  const sponsorName = selectedProgram?.sponsorPerson.name ?? 'New sponsor';
  const sponsorTitle = selectedProgram?.sponsorPerson.title ?? 'Sponsor';
  const sponsorInitials = initialsOf(sponsorName);
  const clientLabel = selectedProgram?.clientName ?? activeClientName ?? 'Your organization';
  const titleText = selectedProgram?.name ?? (activeClientName ? `Start your first program for ${activeClientName}` : 'Start your first program');
  const showEmptyState = !selectedProgram;

  return (
    <div className="pis-root">
      <style>{iridescentCss}</style>

      {/* NO local navbar · the (maestro) layout provides AbarvaNav */}

      {/* Preview banner · thin */}
      <div className="pis-banner">
        <span><strong>● PROGRAMS · NEXUS-FIRST</strong> Chat anchors the 5-phase journey</span>
        <Link href="/programs">← Compare with current /programs</Link>
      </div>

      {/* ─── CHAT STAGE · cream, pure Nexus focus ──────────────────── */}
      <main className="pis-chat-stage">
        {/* Program title + program switcher · one compact row */}
        <div className="pis-chat-topline">
          <div className="pis-topline-left">
            <h1 className="pis-program-title">{titleText}</h1>
            <div className="pis-program-meta">
              <span className="pis-program-meta-dot" />
              {selectedProgram
                ? `${clientLabel} · Sponsor ${sponsorName}, ${sponsorTitle}`
                : `${clientLabel} · No programs yet · use + New program to intake one`}
            </div>
          </div>
          {programs.length > 1 ? (
            <select
              className="pis-program-select"
              value={selectedProgramId ?? ''}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedProgramId(id);
                const prog = programs.find((x) => x.id === id);
                const phase = phaseKeyFor(prog ?? null);
                setActivePhase(phase);
                setVisitedPhases(new Set([PHASE_NAMES[phase].num]));
                setTransitionKey((k) => k + 1);
              }}
              aria-label="Switch program"
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.clientName} · {p.name}</option>
              ))}
            </select>
          ) : null}
        </div>

        {/* Phase-journey pills · single navigation · above chat.
            "+ New Program" sits at the left end and switches mode to intake. */}
        <div className="pis-phase-anchors" role="tablist" aria-label="Phase journey">
          <button
            type="button"
            onClick={() => {
              setMode('intake');
              setIntakeStep('archetype');
              setIntake({ archetype: null, sponsor: null, valueAtStake: null, scope: null });
              setIntakeLog([
                {
                  speaker: 'nexus',
                  text: 'A new program starts with four questions. I will anchor each to the pattern library so analogous peer decisions are available from Phase 1. Nothing free-text until we hit the charter — I will give you options.',
                },
              ]);
              setTransitionKey((k) => k + 1);
            }}
            className={`pis-phase-anchor new-program ${mode === 'intake' ? 'active' : ''}`}
          >
            <span className="pis-phase-anchor-num">+</span>
            <span className="pis-phase-anchor-name">New program</span>
          </button>
          <span className="pis-phase-divider" aria-hidden="true" />
          {PHASE_KEYS.map((pk) => {
            const meta = PHASE_NAMES[pk];
            const active = mode === 'phase' && activePhase === pk;
            const visited = visitedPhases.has(meta.num);
            const live = pk === phaseKeyFor(selectedProgram);
            return (
              <button
                key={pk}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => { setMode('phase'); navigateToPhase(pk); }}
                className={`pis-phase-anchor ${active ? 'active' : ''} ${visited && mode === 'phase' ? 'visited' : ''} ${live ? 'live' : ''}`}
                disabled={mode === 'intake'}
                style={mode === 'intake' ? { opacity: 0.4 } : undefined}
              >
                <span className="pis-phase-anchor-num">P{meta.num}</span>
                <span className="pis-phase-anchor-name">{meta.short}</span>
              </button>
            );
          })}
        </div>

        {/* Phase-gate control · advances live phase forward when user is on it */}
        {selectedProgram && mode === 'phase' && activePhase === phaseKeyFor(selectedProgram) ? (
          <div style={{ margin: '12px 0 0' }}>
            <PhaseGateControl
              programCode={selectedProgram.id}
              currentPhase={PHASE_NAMES[activePhase].num}
              maxPhase={4}
              gateCriterion={`Advance ${selectedProgram.name} to Phase ${PHASE_NAMES[activePhase].num + 1}`}
            />
          </div>
        ) : null}

        {/* 2-col · chat (main) + side rail (deliverables or intake progress) */}
        <div className="pis-chat-layout" key={transitionKey}>
          <div className="pis-chat-window">
            <div className="pis-chat-messages">
              {showEmptyState && mode === 'phase' ? (
                <div className="pis-bubble nexus">
                  <div className="pis-bubble-avatar">✱</div>
                  <div className="pis-bubble-content">
                    <div className="pis-bubble-speaker">Nexus</div>
                    <div className="pis-bubble-body">
                      {activeClientName
                        ? `No programs yet for ${activeClientName}. Use + New program at the left of the phase journey to intake one — four questions, all guided choice, and you land in Phase 0 with a charter.`
                        : 'No programs yet in this workspace. Use + New program at the left of the phase journey to intake one — four questions, all guided choice, and you land in Phase 0 with a charter.'}
                    </div>
                  </div>
                </div>
              ) : (
                (mode === 'phase' ? conversation : intakeLog).map((turn, i) => (
                  <div key={i} className={`pis-bubble ${turn.speaker}`}>
                    <div className="pis-bubble-avatar">
                      {turn.speaker === 'you' ? sponsorInitials : '✱'}
                    </div>
                    <div className="pis-bubble-content">
                      <div className="pis-bubble-speaker">
                        {turn.speaker === 'you' ? 'You' : 'Nexus'}
                      </div>
                      <div className="pis-bubble-body">{turn.text}</div>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Intake mode · guided-choice input (chips + "something else") */}
            {mode === 'intake' && intakeStep !== 'review' && INTAKE_OPTIONS[intakeStep] ? (
              <IntakeGuidedChoice
                step={INTAKE_OPTIONS[intakeStep]!}
                onChoice={(id, label) => {
                  const you = { speaker: 'you' as const, text: label };
                  const next: typeof intakeLog = [...intakeLog, you];
                  const newIntake = { ...intake };
                  let nextStep: IntakeStep = intakeStep;
                  if (intakeStep === 'archetype') { newIntake.archetype = id; nextStep = 'sponsor'; }
                  else if (intakeStep === 'sponsor') { newIntake.sponsor = id; nextStep = 'value'; }
                  else if (intakeStep === 'value') { newIntake.valueAtStake = id; nextStep = 'scope'; }
                  else if (intakeStep === 'scope') { newIntake.scope = id; nextStep = 'review'; }
                  // Nexus ack + next prompt
                  next.push({
                    speaker: 'nexus',
                    text: nexusAck(intakeStep, id, newIntake, nextStep),
                  });
                  setIntake(newIntake);
                  setIntakeLog(next);
                  setIntakeStep(nextStep);
                }}
                onEscape={(text) => {
                  const you = { speaker: 'you' as const, text };
                  setIntakeLog([...intakeLog, you, {
                    speaker: 'nexus',
                    text: `Noted — "${text}". I will incorporate that into the charter but keep the structured option as the primary record so peer decisions still match.`,
                  }]);
                }}
              />
            ) : null}

            {/* Intake review · approve charter to move to P0 */}
            {mode === 'intake' && intakeStep === 'review' ? (
              <div className="pis-intake-review">
                <div className="pis-intake-review-title">Charter review · approve to enter Phase 0</div>
                <ul className="pis-intake-review-list">
                  <li><span className="pis-intake-review-label">Archetype</span><span>{INTAKE_LABELS[intake.archetype!]}</span></li>
                  <li><span className="pis-intake-review-label">Sponsor</span><span>{INTAKE_LABELS[intake.sponsor!]}</span></li>
                  <li><span className="pis-intake-review-label">Value at stake</span><span>{INTAKE_LABELS[intake.valueAtStake!]}</span></li>
                  <li><span className="pis-intake-review-label">Scope</span><span>{INTAKE_LABELS[intake.scope!]}</span></li>
                </ul>
                <div className="pis-intake-review-actions">
                  <button type="button" className="pis-btn-secondary" onClick={() => { setIntakeStep('archetype'); setIntakeLog(intakeLog.slice(0, 1)); setIntake({ archetype: null, sponsor: null, valueAtStake: null, scope: null }); }}>Start over</button>
                  <button type="button" className="pis-btn-primary" onClick={() => {
                    setMode('phase');
                    navigateToPhase('p0');
                  }}>Approve charter → enter Phase 0 →</button>
                </div>
              </div>
            ) : null}

            {/* Phase mode composer */}
            {mode === 'phase' ? (
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
            ) : null}

            {mode === 'phase' ? (
              <div className="pis-inline-signals">
                <span className="pis-inline-signal">
                  <span className="pis-inline-dot amber" /> 3 contradictions surfaced · <Link href="/preview/intelligence?view=contradictions">view all</Link>
                </span>
              </div>
            ) : null}
          </div>

          <aside className="pis-side-rail">
            {mode === 'phase' ? (
              <>
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
              </>
            ) : (
              <>
                <div className="pis-side-heading">Intake progress</div>
                <div className="pis-side-deliverables">
                  <IntakeProgressItem label="Archetype" done={!!intake.archetype} value={intake.archetype ? INTAKE_LABELS[intake.archetype] : null} active={intakeStep === 'archetype'} />
                  <IntakeProgressItem label="Sponsor" done={!!intake.sponsor} value={intake.sponsor ? INTAKE_LABELS[intake.sponsor] : null} active={intakeStep === 'sponsor'} />
                  <IntakeProgressItem label="Value at stake" done={!!intake.valueAtStake} value={intake.valueAtStake ? INTAKE_LABELS[intake.valueAtStake] : null} active={intakeStep === 'value'} />
                  <IntakeProgressItem label="Scope" done={!!intake.scope} value={intake.scope ? INTAKE_LABELS[intake.scope] : null} active={intakeStep === 'scope'} />
                  <IntakeProgressItem label="Review & approve" done={false} value={null} active={intakeStep === 'review'} />
                </div>
              </>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

const iridescentCss = `
  :root {
    --pis-bg: #F5F1EB;
    --pis-bg-deep: #F1ECE2;
    --pis-surface: #FFFFFF;
    --pis-surface-soft: #FAF7F1;
    --pis-ink: #1a1612;
    --pis-ink-muted: #544b42;
    --pis-ink-faint: #8a7e72;
    --pis-line: rgba(26,22,18,0.12);
    --pis-line-soft: rgba(26,22,18,0.06);
    --pis-teal: #0E9F8C;
    --pis-teal-dark: #0a5849;
    --pis-teal-soft: rgba(14,159,140,0.1);
    --pis-amber: #BA7517;
    --pis-amber-soft: rgba(186,117,23,0.1);
  }

  .pis-root {
    font-family: 'DM Sans', -apple-system, sans-serif;
    background: var(--pis-bg);
    color: var(--pis-ink);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  /* Thin preview banner (unobtrusive) */
  .pis-banner {
    background: var(--pis-ink);
    color: var(--pis-bg);
    padding: 8px 32px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    display: flex; justify-content: space-between; align-items: center;
  }
  .pis-banner strong { color: var(--pis-teal); margin-right: 10px; }
  .pis-banner a { color: var(--pis-bg); opacity: 0.85; text-decoration: underline; font-size: 11px; }

  /* ─── CHAT STAGE · 2-col layout ──────────────────────────────── */
  .pis-chat-stage {
    max-width: 1320px;
    margin: 0 auto;
    padding: 32px 32px 60px;
  }

  /* Topline · program title + meta + dropdown */
  .pis-chat-topline {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 24px;
    margin-bottom: 20px;
    padding-bottom: 18px;
    border-bottom: 1px solid var(--pis-line);
  }
  .pis-topline-left { flex: 1; min-width: 0; }
  .pis-program-title {
    font-family: 'Georgia', serif;
    font-size: 34px;
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.1;
    color: var(--pis-ink);
    margin: 0 0 8px;
  }
  .pis-program-meta {
    display: flex; align-items: center; gap: 10px;
    font-size: 13px;
    color: var(--pis-ink-muted);
  }
  .pis-program-meta-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--pis-teal);
  }
  .pis-program-select {
    padding: 8px 32px 8px 14px;
    background: var(--pis-surface);
    border: 1px solid var(--pis-line);
    color: var(--pis-ink);
    border-radius: 8px;
    font-family: inherit; font-size: 13px; font-weight: 500;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%236d6258' d='M0 0h10L5 6z'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 12px center;
    max-width: 360px;
  }
  .pis-program-select:focus { outline: 2px solid rgba(14,159,140,0.35); outline-offset: 1px; }

  /* "+ New Program" pill · distinct accent */
  .pis-phase-anchor.new-program {
    background: var(--pis-ink);
    color: var(--pis-bg);
    border-color: var(--pis-ink);
  }
  .pis-phase-anchor.new-program:hover {
    background: var(--pis-teal-dark);
    color: var(--pis-bg);
    border-color: var(--pis-teal-dark);
  }
  .pis-phase-anchor.new-program.active {
    background: var(--pis-teal);
    color: #FFFFFF;
    border-color: var(--pis-teal);
    box-shadow: 0 6px 20px rgba(14,159,140,0.28);
  }
  .pis-phase-anchor.new-program .pis-phase-anchor-num {
    color: inherit; opacity: 1;
    font-family: 'Georgia', serif; font-size: 16px; font-weight: 700;
  }
  .pis-phase-divider {
    width: 1px; height: 28px;
    background: var(--pis-line);
    margin: 0 6px;
    align-self: center;
  }

  /* Intake guided choice · same visual contract as the rail GuidedChoice */
  .pis-intake-guided {
    margin-top: 12px;
    padding: 16px;
    background: var(--pis-surface);
    border: 1px solid var(--pis-line);
    border-radius: 12px;
  }
  .pis-intake-guided-prompt {
    font-size: 14px;
    color: var(--pis-ink);
    margin-bottom: 14px;
    font-weight: 500;
  }
  .pis-intake-guided-options {
    display: flex; flex-direction: column; gap: 8px;
    margin-bottom: 14px;
  }
  .pis-intake-chip {
    text-align: left;
    padding: 12px 14px;
    background: var(--pis-bg);
    border: 1px solid var(--pis-line);
    border-radius: 10px;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    color: var(--pis-ink);
    transition: all 0.15s;
  }
  .pis-intake-chip:hover {
    background: var(--pis-teal-soft);
    border-color: var(--pis-teal);
    transform: translateX(-1px);
  }
  .pis-intake-chip-label { display: block; font-weight: 600; }
  .pis-intake-chip-sub {
    display: block;
    margin-top: 3px;
    font-size: 12px;
    color: var(--pis-ink-muted);
    line-height: 1.45;
  }
  .pis-intake-escape {
    display: flex;
    gap: 8px;
    padding: 8px;
    background: var(--pis-bg);
    border: 1px solid var(--pis-line);
    border-radius: 10px;
  }
  .pis-intake-escape:focus-within {
    border-color: var(--pis-teal);
    box-shadow: 0 0 0 3px var(--pis-teal-soft);
  }
  .pis-intake-escape-input {
    flex: 1;
    background: transparent; border: none; outline: none;
    font-family: inherit; font-size: 13px;
    color: var(--pis-ink);
    padding: 4px 6px;
  }
  .pis-intake-escape-input::placeholder { color: var(--pis-ink-faint); }
  .pis-intake-escape-send {
    width: 32px; height: 32px; border-radius: 999px;
    background: var(--pis-teal); color: #FFFFFF;
    border: none; cursor: pointer; font-weight: 700;
  }

  /* Intake review · charter approval */
  .pis-intake-review {
    margin-top: 12px;
    padding: 22px 24px;
    background: var(--pis-surface);
    border: 1px solid var(--pis-teal);
    border-radius: 14px;
  }
  .pis-intake-review-title {
    font-family: 'Georgia', serif;
    font-size: 20px;
    font-weight: 600;
    color: var(--pis-ink);
    letter-spacing: -0.01em;
    margin-bottom: 16px;
  }
  .pis-intake-review-list {
    list-style: none; margin: 0 0 22px; padding: 0;
    display: flex; flex-direction: column; gap: 10px;
  }
  .pis-intake-review-list li {
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: 14px;
    padding: 10px 0;
    border-top: 1px dashed var(--pis-line);
    font-size: 14px;
    color: var(--pis-ink);
  }
  .pis-intake-review-list li:first-child { border-top: none; }
  .pis-intake-review-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--pis-ink-muted);
    align-self: center;
  }
  .pis-intake-review-actions {
    display: flex; gap: 10px; justify-content: flex-end;
  }
  .pis-btn-primary, .pis-btn-secondary {
    padding: 10px 18px;
    border-radius: 999px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    border: 1px solid transparent;
  }
  .pis-btn-primary {
    background: var(--pis-teal); color: #FFFFFF;
  }
  .pis-btn-primary:hover { background: var(--pis-teal-dark); }
  .pis-btn-secondary {
    background: transparent;
    color: var(--pis-ink-muted);
    border-color: var(--pis-line);
  }
  .pis-btn-secondary:hover { background: var(--pis-bg); color: var(--pis-ink); }

  /* Intake progress · side rail */
  .pis-intake-progress {
    display: flex; gap: 12px; align-items: flex-start;
    padding: 10px 12px;
    border-radius: 8px;
    transition: background 0.15s;
  }
  .pis-intake-progress.active { background: var(--pis-teal-soft); }
  .pis-intake-progress-dot {
    width: 10px; height: 10px; border-radius: 50%;
    background: transparent;
    border: 1.5px solid var(--pis-line);
    margin-top: 4px;
    flex-shrink: 0;
    transition: all 0.2s;
  }
  .pis-intake-progress.done .pis-intake-progress-dot {
    background: var(--pis-teal);
    border-color: var(--pis-teal);
  }
  .pis-intake-progress.active .pis-intake-progress-dot {
    border-color: var(--pis-teal);
    box-shadow: 0 0 0 3px var(--pis-teal-soft);
  }
  .pis-intake-progress-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--pis-ink-muted);
    font-weight: 600;
  }
  .pis-intake-progress.done .pis-intake-progress-label,
  .pis-intake-progress.active .pis-intake-progress-label {
    color: var(--pis-teal-dark);
  }
  .pis-intake-progress-value {
    font-size: 12px;
    color: var(--pis-ink);
    margin-top: 3px;
    line-height: 1.4;
  }

  /* Phase anchors · cream-palette pills */
  .pis-phase-anchors {
    display: flex; gap: 10px;
    justify-content: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .pis-phase-anchor {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 20px;
    background: var(--pis-surface);
    border: 1px solid var(--pis-line);
    color: var(--pis-ink-muted);
    border-radius: 999px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .pis-phase-anchor:hover {
    background: var(--pis-teal-soft);
    border-color: rgba(14,159,140,0.3);
    color: var(--pis-ink);
    transform: translateY(-1px);
  }
  .pis-phase-anchor.visited:not(.active) {
    background: rgba(14,159,140,0.05);
    border-color: rgba(14,159,140,0.2);
    color: var(--pis-teal-dark);
  }
  .pis-phase-anchor.active {
    background: var(--pis-teal-soft);
    border: 1.5px solid var(--pis-teal);
    color: var(--pis-teal-dark);
    font-weight: 700;
    box-shadow: 0 4px 16px rgba(14,159,140,0.15);
  }
  .pis-phase-anchor.live::before {
    content: '';
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--pis-teal);
    box-shadow: 0 0 0 2px rgba(14,159,140,0.25);
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

  /* Two-col layout */
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

  .pis-chat-window { display: flex; flex-direction: column; gap: 12px; }

  /* Messages */
  .pis-chat-messages {
    display: flex; flex-direction: column; gap: 14px;
    padding-bottom: 4px;
  }
  .pis-bubble {
    display: flex; gap: 14px;
    padding: 16px 18px;
    background: var(--pis-surface);
    border: 1px solid var(--pis-line-soft);
    border-radius: 12px;
  }
  .pis-bubble.nexus {
    background: var(--pis-teal-soft);
    border-color: rgba(14,159,140,0.22);
  }
  .pis-bubble-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700;
  }
  .pis-bubble.you .pis-bubble-avatar { background: rgba(26,22,18,0.08); color: var(--pis-ink); }
  .pis-bubble.nexus .pis-bubble-avatar {
    background: var(--pis-teal); color: white;
    font-family: 'Georgia', serif; font-size: 18px;
  }
  .pis-bubble-content { flex: 1; min-width: 0; }
  .pis-bubble-speaker {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--pis-ink-faint);
    margin-bottom: 6px;
  }
  .pis-bubble.nexus .pis-bubble-speaker { color: var(--pis-teal-dark); font-weight: 700; }
  .pis-bubble-body { font-size: 15px; line-height: 1.65; color: var(--pis-ink); }
  .pis-bubble-body em { color: var(--pis-amber); font-style: normal; font-weight: 600; }

  /* Composer · cream palette */
  .pis-chat-composer {
    background: var(--pis-surface);
    border: 1px solid var(--pis-line);
    border-radius: 14px;
    padding: 10px 14px;
    margin-top: 10px;
    box-shadow: 0 2px 10px rgba(26,22,18,0.04);
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .pis-chat-composer:focus-within {
    border-color: rgba(14,159,140,0.4);
    box-shadow: 0 2px 10px rgba(26,22,18,0.06), 0 0 0 3px rgba(14,159,140,0.08);
  }
  .pis-composer-row { display: flex; align-items: center; gap: 10px; }
  .pis-composer-plus {
    width: 30px; height: 30px;
    background: var(--pis-bg);
    border: 1px solid var(--pis-line);
    color: var(--pis-ink-muted);
    border-radius: 999px;
    cursor: pointer; font-size: 16px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: all 0.15s;
  }
  .pis-composer-plus:hover { background: var(--pis-teal-soft); color: var(--pis-teal-dark); border-color: rgba(14,159,140,0.3); }
  .pis-composer-input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--pis-ink);
    font-family: inherit;
    font-size: 15px;
    outline: none;
  }
  .pis-composer-input::placeholder { color: var(--pis-ink-faint); }
  .pis-composer-meta {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    color: var(--pis-ink-faint);
  }
  .pis-composer-send {
    width: 32px; height: 32px;
    background: var(--pis-teal);
    border: none; color: white;
    border-radius: 999px;
    cursor: pointer; font-size: 14px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: all 0.15s;
  }
  .pis-composer-send:hover { background: #0a5849; }

  /* Inline signals · subtle link under composer */
  .pis-inline-signals {
    display: flex; justify-content: center;
    padding: 8px 0 0;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.04em;
    color: var(--pis-ink-faint);
  }
  .pis-inline-signal { display: inline-flex; align-items: center; gap: 8px; }
  .pis-inline-signal a { color: var(--pis-teal-dark); text-decoration: none; font-weight: 600; }
  .pis-inline-signal a:hover { text-decoration: underline; }
  .pis-inline-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
  .pis-inline-dot.amber { background: var(--pis-amber); box-shadow: 0 0 0 2px rgba(186,117,23,0.2); }

  /* Side rail · deliverables only */
  .pis-side-rail {
    position: sticky;
    top: 24px;
    background: var(--pis-surface);
    border: 1px solid var(--pis-line);
    border-radius: 14px;
    padding: 18px;
  }
  .pis-side-heading {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--pis-ink-muted);
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
    color: var(--pis-ink);
    border-radius: 8px;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    font-size: 13px;
    transition: all 0.15s;
  }
  .pis-side-deliverable:hover {
    background: var(--pis-bg);
    border-color: var(--pis-line);
  }
  .pis-side-deliverable-main { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
  .pis-side-deliverable-code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    color: var(--pis-ink-faint);
  }
  .pis-side-deliverable.ready .pis-side-deliverable-code { color: var(--pis-teal); font-weight: 600; }
  .pis-side-deliverable.pending .pis-side-deliverable-code { color: var(--pis-amber); font-weight: 600; }
  .pis-side-deliverable-name {
    font-size: 13px;
    color: var(--pis-ink);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .pis-side-deliverable-status { font-size: 11px; color: var(--pis-ink-faint); }
  .pis-side-deliverable-status.ready { color: var(--pis-teal); }
  .pis-side-deliverable-status.draft { color: var(--pis-ink-muted); }
  .pis-side-deliverable-status.pending { color: var(--pis-amber); }

  @media (max-width: 900px) {
    .pis-chat-layout { grid-template-columns: 1fr; }
    .pis-side-rail { position: static; }
    .pis-chat-topline { flex-direction: column; align-items: flex-start; gap: 12px; }
    .pis-phase-anchors { justify-content: flex-start; }
  }
  @media (prefers-reduced-motion: reduce) {
    .pis-chat-layout, .pis-phase-anchor { animation: none !important; transition: none !important; }
  }
`;
