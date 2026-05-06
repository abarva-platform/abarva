'use client';

// StrategicMovePhaseClient · Strategic Moves Phase Workspace (P1–P5)
//
// Two-pane phase workspace: Nexus chat on the left, phase canvas on the right.
// Uses /api/chat/agent with surface `/strategic-moves/{moveId}/phase/{phaseNum}`
// and passes moveId + phase in surfaceContext so the agent route loads the
// correct phase pack (T-P1 through T-P5).
//
// Design reference: StrategicMoveOriginateClient.tsx (P0) — same shell,
// same chat patterns, phase-specific canvas on the right.

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { extractArtifacts, visibleArtifactPendingText } from '@/lib/agent/artifacts';
import type { StrategicMove } from '@/lib/programs/types.ui';
import styles from './StrategicMoves.module.css';
import { PhaseRail } from './PhaseRail';

// ── Types ──────────────────────────────────────────────────────────────────────

export type ChatTurn = {
  id: string;
  role: 'user' | 'assistant';
  agentName?: 'Nexus';
  text: string;
};

type AttachmentStatus = 'uploading' | 'done' | 'error';
interface PendingAttachment {
  id: string;
  name: string;
  status: AttachmentStatus;
  attachmentId?: string;
  errorMsg?: string;
}

// ── Phase metadata ─────────────────────────────────────────────────────────────

interface PhaseConfig {
  label: string;
  shortLabel: string;
  firstMessage: (move: StrategicMove) => string;
  suggestedPrompts: string[];
}

const PHASE_CONFIGS: Record<number, PhaseConfig> = {
  1: {
    label: 'P1 Charter',
    shortLabel: 'P1 CHARTER',
    firstMessage: (move) => {
      const sponsorName = move.sponsor?.name ?? null;
      if (sponsorName) {
        return `**${move.name}** has been promoted to P1 Charter. The origination brief is complete — now we turn that into a sponsor-committed charter. P1 has five steps: confirm sponsor commitment, map stakeholders, lock success metrics and value range, draft the charter document, and prepare for gate review. The first thing we need: has **${sponsorName}** formally committed to sponsoring this Move?`;
      }
      return `**${move.name}** has been promoted to P1 Charter. The origination brief is complete — now we turn that into a sponsor-committed charter. P1 has five steps: confirm sponsor commitment, map stakeholders, lock success metrics and value range, draft the charter document, and prepare for gate review. Who should sponsor this Move — which executive owns the outcome this Move is targeting?`;
    },
    suggestedPrompts: [
      'Walk me through the P1 gate criteria',
      'What does the sponsor need to commit to?',
      'Help me draft the stakeholder map',
    ],
  },
  2: {
    label: 'P2 Discover & Diagnose',
    shortLabel: 'P2 DISCOVER',
    firstMessage: (move) =>
      `**${move.name}** has entered P2 Discover & Diagnose. The charter is signed — now we establish the evidence that will determine whether this move goes to P3 or stops here. P2 has five steps: map the current-state process, capture baseline metrics, identify root causes, assess data readiness, and make the continue/discontinue decision. Where do you want to start — process mapping or baseline data?`,
    suggestedPrompts: [
      'Start with current-state process mapping',
      'What baseline metrics do we need to capture?',
      'Walk me through the P2 gate criteria',
    ],
  },
  3: {
    label: 'P3 Design Future State',
    shortLabel: 'P3 DESIGN',
    firstMessage: (move) =>
      `P2 diagnosis is confirmed for **${move.name}**. P3 starts here: for each root cause identified in P2, we need to define the design element that addresses it. That traceability is the foundation. Once all root causes have a design counterpart, we'll work through the operating model shift and solution architecture. Ready to start with the first root cause?`,
    suggestedPrompts: [
      'Start the root cause trace',
      'Help me map the operating model shift',
      'What are the P3 gate criteria?',
    ],
  },
  4: {
    label: 'P4 Roadmap & Business Case',
    shortLabel: 'P4 ROADMAP',
    firstMessage: (move) =>
      `P3 design is signed off for **${move.name}**. P4 builds the plan and the economics.\n\nBefore we start the roadmap, one thing: we need to define the Tower metric plan — the measurable signals that confirm this program is succeeding post-handoff. Without it, we're measuring at gate, not at execution. We'll lock these alongside the business case, not after.\n\nP4 has four steps: roadmap construction from the P3 design, business case economics, Tower metric plan, and gate review. Ready to start with the roadmap?`,
    suggestedPrompts: [
      'Start roadmap construction',
      'Help me draft the business case',
      'What should go in the Tower metric plan?',
    ],
  },
  5: {
    label: 'P5 Mobilize & Handoff',
    shortLabel: 'P5 MOBILIZE',
    firstMessage: (move) =>
      `P4 gate passed for **${move.name}**. P5 begins now: mobilize the delivery team and assemble the Tower handoff package.\n\nP5 has five steps: team assembly and RACI confirmation, handoff package assembly, readiness verification, explicit Tower acceptance, and gate-out. P5 ends when a named Tower representative explicitly confirms the package is executable — not when the package is sent, not when Tower attends a session.\n\nFirst: let's confirm the delivery team. For each workstream from the P4 roadmap, we need a named delivery lead with confirmed availability. Ready to go through the workstreams?`,
    suggestedPrompts: [
      'Confirm the delivery team RACI',
      'Assemble the Tower handoff package',
      'What does Tower acceptance require?',
    ],
  },
};

// ── Canvas section definitions per phase ──────────────────────────────────────

interface CanvasSection {
  id: string;
  label: string;
  placeholder: string;
}

const PHASE_CANVAS_SECTIONS: Record<number, CanvasSection[]> = {
  1: [
    { id: 'sponsor', label: 'Sponsor commitment', placeholder: 'Confirm sponsor identity, commitment level, and decision rights' },
    { id: 'stakeholders', label: 'Stakeholders', placeholder: 'Map who has decision rights, contributes, and can block' },
    { id: 'success-metrics', label: 'Success metrics', placeholder: 'Lock the primary measurable metric and baseline path' },
    { id: 'value-range', label: 'Value range', placeholder: 'Preliminary value range with stated assumptions (PRELIMINARY_ESTIMATE)' },
    { id: 'scope', label: 'Scope', placeholder: 'Charter scope — more precise than the P0 scope boundary' },
  ],
  2: [
    { id: 'baseline', label: 'Current-state baseline', placeholder: 'Document current metrics, process state, and pain points — attest with owner' },
    { id: 'rootcause', label: 'Root cause analysis', placeholder: 'Identify root causes underpinning the problem this move addresses' },
    { id: 'datareadiness', label: 'Data & readiness assessment', placeholder: 'Assess data foundation readiness — access, quality, governance, AI-readiness' },
    { id: 'decision', label: 'P2 decision', placeholder: 'Continue to P3 or discontinue — requires gate evaluation first' },
  ],
  3: [
    { id: 'design', label: 'Target state design', placeholder: 'Future workflow, AI/agent placement, human ownership, capability being built' },
    { id: 'operatingmodel', label: 'Operating model shift', placeholder: 'Who works differently — roles, handoffs, responsibilities — Today → Tomorrow' },
    { id: 'rootcause-trace', label: 'Root cause → design trace', placeholder: 'Every design element must trace to a P2 root cause (hard requirement)' },
    { id: 'risks', label: 'Risks & tradeoffs', placeholder: '5–7 named risks with likelihood, impact, and mitigation' },
  ],
  4: [
    { id: 'roadmap', label: 'Execution roadmap', placeholder: 'Workstreams, estimates, timeline, milestones, dependencies, RACI' },
    { id: 'businesscase', label: 'Business case', placeholder: 'ROM estimate, org-specific rate card, ROI summary — requires sponsor approval' },
    { id: 'valueplan', label: 'Value plan', placeholder: 'Measurement contract: committed outcomes and how they will be measured' },
    { id: 'towermetric', label: 'Tower monitoring plan', placeholder: 'Measurable signals Tower tracks post-handoff — must be drafted at mid-P4' },
  ],
  5: [
    { id: 'raci', label: 'Delivery RACI', placeholder: 'Named delivery leads for every workstream — people, not roles' },
    { id: 'handoffpack', label: 'Tower handoff package', placeholder: 'All phase artifacts assembled: roadmap, monitoring plan, value framework, risk register, RACI, change plan' },
    { id: 'tower-acceptance', label: 'Tower acceptance', placeholder: 'Explicit Tower acceptance required — acknowledged ≠ accepted' },
  ],
};

// ── Gate criteria per phase (labels from anatomy specs) ──────────────────────

interface GateItem {
  id: string;
  label: string;
  severity: 'hard' | 'soft';
}

const PHASE_GATE_ITEMS: Record<number, GateItem[]> = {
  1: [
    { id: 'charter_signed_off', label: 'Charter signed off by sponsor', severity: 'hard' },
    { id: 'sponsor_assigned', label: 'Sponsor committed and decision rights named', severity: 'hard' },
    { id: 'baseline_captured', label: 'Initial value range and success metrics ratified', severity: 'soft' },
  ],
  2: [
    { id: 'discovery_report_signed_off', label: 'Discovery synthesis report signed off', severity: 'hard' },
    { id: 'discovery_notes_ingested', label: 'Discovery notes or workshop logs ingested', severity: 'hard' },
    { id: 'discovery_baseline_attested', label: 'Baseline metrics captured and attested', severity: 'hard' },
    { id: 'discovery_stakeholders_named', label: 'Stakeholder map names required human owners', severity: 'hard' },
    { id: 'p2_readiness_cleared', label: 'Diagnosis clears P2 without unresolved hard gaps', severity: 'hard' },
  ],
  3: [
    { id: 'design_approved', label: 'Future-state design and operating-model shift signed off', severity: 'hard' },
    { id: 'requirements_design_outcome_trace', label: 'Requirements-to-design-to-outcomes traceability captured', severity: 'hard' },
    { id: 'phase_3_findings_written', label: 'Risks and tradeoffs named with mitigations', severity: 'soft' },
    { id: 'cxo_interview_complete', label: 'Operating-model owners interviewed', severity: 'soft' },
  ],
  4: [
    { id: 'execution_roadmap_drafted', label: 'Roadmap drafted', severity: 'hard' },
    { id: 'business_case_approved', label: 'Business case approved', severity: 'hard' },
    { id: 'execution_milestones_defined', label: 'Execution milestones defined', severity: 'hard' },
    { id: 'execution_success_criteria_defined', label: 'Success criteria defined', severity: 'hard' },
    { id: 'readiness_and_change_plan_signed_off', label: 'Change readiness and adoption plan signed off', severity: 'hard' },
    { id: 'funding_approval_recorded', label: 'Funding approval recorded', severity: 'soft' },
    { id: 'sponsor_alignment_confirmed', label: 'Sponsor alignment confirmed', severity: 'soft' },
    { id: 'delivery_raci_named', label: 'Delivery RACI named', severity: 'soft' },
    { id: 'vendor_selection_approved', label: 'Vendor selection approved (if applicable)', severity: 'soft' },
    { id: 'tower_metric_plan_drafted', label: 'Tower metric plan drafted', severity: 'soft' },
    { id: 'tower_handoff_plan_accepted', label: 'Tower handoff plan drafted', severity: 'soft' },
  ],
  5: [
    { id: 'tower_handoff_package_accepted', label: 'Tower handoff package complete and accepted', severity: 'hard' },
    { id: 'execution_team_confirmed', label: 'Execution team confirmed readiness', severity: 'hard' },
    { id: 'monitoring_plan_active', label: 'Monitoring plan active', severity: 'hard' },
    { id: 'raci_signed_off', label: 'RACI signed off with named owners', severity: 'hard' },
    { id: 'value_framework_handed_off', label: 'Value realization framework handed to Tower', severity: 'hard' },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateTurnId(): string {
  return `turn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  move: StrategicMove;
  phaseNum: number;
}

export function StrategicMovePhaseClient({ move, phaseNum }: Props) {
  const config = PHASE_CONFIGS[phaseNum];
  const canvasSections = PHASE_CANVAS_SECTIONS[phaseNum] ?? [];
  const gateItems = PHASE_GATE_ITEMS[phaseNum] ?? [];

  // Match gate criteria from move.gateCriteria to our phase gate items
  const gateItemsWithStatus = gateItems.map((item) => {
    const criterion = move.gateCriteria.find((c) => c.id === item.id);
    return { ...item, completed: criterion?.completed ?? false };
  });

  const [turns, setTurns] = useState<ChatTurn[]>(() => [
    {
      id: 'nexus-open-p' + phaseNum,
      role: 'assistant',
      agentName: 'Nexus',
      text: config.firstMessage(move),
    },
  ]);
  const [composer, setComposer] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);

  const turnsRef = useRef<ChatTurn[]>(turns);
  turnsRef.current = turns;
  const threadRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll thread
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [turns]);

  const updateTurns = useCallback(
    (updater: ChatTurn[] | ((prev: ChatTurn[]) => ChatTurn[])) => {
      const next = typeof updater === 'function' ? updater(turnsRef.current) : updater;
      turnsRef.current = next;
      setTurns(next);
    },
    [],
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      const pendingId = `att-${Date.now()}`;
      setAttachments((prev) => [...prev, { id: pendingId, name: file.name, status: 'uploading' }]);
      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('phase', String(phaseNum));
        const res = await fetch(`/api/programs/workspace/${move.id}/upload`, {
          method: 'POST',
          body: fd,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const data = await res.json() as { attachmentId: string };
        setAttachments((prev) =>
          prev.map((a) =>
            a.id === pendingId ? { ...a, status: 'done', attachmentId: data.attachmentId } : a,
          ),
        );
      } catch (err) {
        setAttachments((prev) =>
          prev.map((a) =>
            a.id === pendingId
              ? { ...a, status: 'error', errorMsg: err instanceof Error ? err.message : 'upload failed' }
              : a,
          ),
        );
      }
    },
    [move.id, phaseNum],
  );

  const send = useCallback(
    async (messageOverride?: string) => {
      const message = (messageOverride ?? composer).trim();
      if (!message || streaming) return;

      const doneAttachments = attachments.filter((a) => a.status === 'done');
      const attachmentSuffix = doneAttachments.length > 0
        ? `\n\n[Attached: ${doneAttachments.map((a) => a.name).join(', ')}]`
        : '';
      const fullMessage = message + attachmentSuffix;

      const assistantTurnId = generateTurnId();
      updateTurns((prev) => [
        ...prev,
        { id: generateTurnId(), role: 'user', text: fullMessage },
        { id: assistantTurnId, role: 'assistant', agentName: 'Nexus', text: '' },
      ]);
      if (!messageOverride) setComposer('');
      setAttachments([]);
      setStreaming(true);

      try {
        const conversationHistory = turnsRef.current
          .filter(
            (t) => t.role === 'user' || (t.role === 'assistant' && t.text.trim().length > 0),
          )
          .map((t) => ({ role: t.role, content: t.text }));

        const res = await fetch('/api/chat/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: fullMessage,
            tenantName: move.tenant.name,
            agentName: 'Nexus',
            surface: `strategic-moves-workspace`,
            conversationHistory,
            surfaceContext: {
              moveId: move.id,
              phase: phaseNum,
              moveDisplayCode: move.displayCode,
              moveName: move.name,
              phaseLabel: config.label,
              attachmentIds: doneAttachments.map((a) => a.attachmentId).filter(Boolean),
            },
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`Agent returned ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let pendingBuffer = '';
        let committedVisible = '';
        const seenArtifacts = new Set<string>();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          pendingBuffer += decoder.decode(value, { stream: true });
          const { visibleText, artifacts, remaining } = extractArtifacts(pendingBuffer);
          committedVisible += visibleText;
          pendingBuffer = remaining;

          for (const a of artifacts) {
            const key = JSON.stringify(a);
            if (!seenArtifacts.has(key)) {
              seenArtifacts.add(key);
              // Future: handle phase-specific artifacts (gate-update, etc.)
            }
          }

          const display = (committedVisible + visibleArtifactPendingText(pendingBuffer)).trimEnd();
          updateTurns((prev) =>
            prev.map((t) => (t.id === assistantTurnId ? { ...t, text: display } : t)),
          );
        }

        // Flush remaining buffer
        if (pendingBuffer.length > 0) {
          const final = extractArtifacts(pendingBuffer);
          committedVisible +=
            final.visibleText +
            (final.remaining.length > 0 ? visibleArtifactPendingText(final.remaining) : '');
        }

        updateTurns((prev) =>
          prev.map((t) =>
            t.id === assistantTurnId ? { ...t, text: committedVisible.trimEnd() } : t,
          ),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Agent error';
        updateTurns((prev) =>
          prev.map((t) =>
            t.id === assistantTurnId
              ? { ...t, text: `I encountered an issue: ${msg}. Please try again.` }
              : t,
          ),
        );
      } finally {
        setStreaming(false);
      }
    },
    [composer, streaming, attachments, move, phaseNum, config.label, updateTurns],
  );

  const hardGateCount = gateItemsWithStatus.filter((g) => g.severity === 'hard').length;
  const hardGateDone = gateItemsWithStatus.filter((g) => g.severity === 'hard' && g.completed).length;
  const totalGateDone = gateItemsWithStatus.filter((g) => g.completed).length;

  return (
    <div id={`ws-phase-p${phaseNum}-page`} className={styles.page}>
      {/* Phase context bar */}
      <div id={`ws-phase-p${phaseNum}-context-bar`} className={styles.originContextBar}>
        <div className={styles.originContextLeft}>
          <span className={styles.originBranch} aria-hidden>&#8627;</span>
          <span className={styles.originLabel}>{move.displayCode}</span>
          <span className={styles.originDraftBadge}>
            {config.shortLabel}
          </span>
        </div>
        <Link className={styles.originCancel} href={`/strategic-moves/${move.id}`}>
          &#8592; Back to overview
        </Link>
      </div>

      {/* Two-pane shell */}
      <section id={`ws-phase-p${phaseNum}-grid`} className={styles.detailShell}>

        {/* Chat pane */}
        <aside id={`ws-chat-p${phaseNum}`} className={styles.chatPane}>
          <div className={styles.chatHead}>
            <div className={styles.agentRow}>
              <div className={styles.agentAvatar} aria-hidden>&#10022;</div>
              <div>
                <div className={styles.agentName}>Nexus</div>
                <div className={styles.agentStatus}>
                  <span className={styles.agentStatusDot} aria-hidden />
                  {move.displayCode} &middot; {config.shortLabel}
                </div>
              </div>
            </div>
          </div>

          {/* Chat thread */}
          <div
            id={`ws-chat-p${phaseNum}-thread`}
            className={styles.chatThread}
            ref={threadRef}
          >
            {turns.map((turn) => (
              <div
                key={turn.id}
                className={turn.role === 'assistant' ? styles.bubbleNexus : styles.bubbleUser}
              >
                {turn.text || (streaming && turn.role === 'assistant' ? '…' : '')}
              </div>
            ))}
          </div>

          {/* Suggested prompts */}
          <div className={styles.startFromBlock}>
            <div className={styles.suggestedPrompts}>
              {config.suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  className={styles.promptChip}
                  type="button"
                  onClick={() => void send(prompt)}
                  disabled={streaming}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Chat input */}
          <div id={`ws-chat-p${phaseNum}-input`} className={styles.chatInput}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.xlsx,.csv,.txt,.md,.json"
              style={{ display: 'none' }}
              onChange={(e) => void handleFileSelect(e)}
            />
            {attachments.length > 0 && (
              <div className={styles.attachmentStrip}>
                {attachments.map((a) => (
                  <span
                    key={a.id}
                    className={`${styles.attachmentChip} ${
                      a.status === 'done' ? styles.attachmentChipDone :
                      a.status === 'error' ? styles.attachmentChipError : ''
                    }`}
                    title={a.status === 'error' ? (a.errorMsg ?? 'upload failed') : a.name}
                  >
                    {a.status === 'uploading' ? '⏳' : a.status === 'done' ? '✓' : '✗'}{' '}
                    {a.name}
                  </span>
                ))}
              </div>
            )}
            <div className={styles.inputRow}>
              <button
                className={styles.uploadBtn}
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={streaming}
                aria-label="Attach file"
                title="Attach file"
              >
                &#x1F4CE;
              </button>
              <textarea
                id={`ws-chat-p${phaseNum}-input-field`}
                rows={1}
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder={`Ask Nexus about ${move.displayCode} ${config.label}…`}
                disabled={streaming}
                spellCheck
              />
              <button
                id={`ws-chat-p${phaseNum}-send-btn`}
                className={styles.sendBtn}
                type="button"
                onClick={() => void send()}
                disabled={streaming || !composer.trim()}
                aria-label="Send"
              >
                &#8593;
              </button>
            </div>
          </div>
        </aside>

        {/* Canvas pane */}
        <article id={`ws-canvas-p${phaseNum}`} className={styles.rightPane}>
          {/* Canvas head */}
          <div className={styles.detailHead}>
            <div className={styles.detailHeadTop}>
              <div className={styles.detailHeadLeft}>
                <div className={styles.detailBreadcrumb}>
                  <Link className={styles.detailCrumb} href="/strategic-moves">
                    Strategic Moves
                  </Link>
                  <span aria-hidden>&rsaquo;</span>
                  <span>{move.tenant.name}</span>
                  <span aria-hidden>&rsaquo;</span>
                  <Link className={styles.detailCrumb} href={`/strategic-moves/${move.id}`}>
                    {move.displayCode}
                  </Link>
                  <span aria-hidden>&rsaquo;</span>
                  <span>{config.label}</span>
                </div>
                <h1 className={styles.detailTitle}>{move.name}</h1>
                <div className={styles.detailId}>
                  {move.archetype} &middot; {config.label} &middot; Sponsor:{' '}
                  {(move.sponsor?.name ?? 'Unassigned').toUpperCase()}
                </div>
              </div>
            </div>
            <PhaseRail current={phaseNum} status={move.statusColor} />
          </div>

          {/* Canvas body */}
          <div className={styles.detailBody}>

            {/* Gate criteria panel */}
            <section
              id={`ws-canvas-p${phaseNum}-gate-panel`}
              className={styles.detailSection}
            >
              <div className={styles.detailSectionTitle}>
                {config.label.toUpperCase()} &middot; Gate criteria
                <span style={{ marginLeft: 8, fontWeight: 400, textTransform: 'none' }}>
                  &mdash; {totalGateDone} of {gateItemsWithStatus.length} met
                  ({hardGateDone} of {hardGateCount} hard)
                </span>
              </div>
              <ul id={`ws-canvas-p${phaseNum}-gate-list`} className={styles.critList}>
                {gateItemsWithStatus.map((item) => (
                  <li key={item.id} id={`ws-canvas-p${phaseNum}-gate-item-${item.id}`}>
                    <span
                      className={`${styles.critCheck} ${item.completed ? styles.critCheckDone : ''}`}
                      aria-hidden
                    >
                      {item.completed ? '✓' : ''}
                    </span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    <span
                      style={{
                        fontSize: 9,
                        fontFamily: 'var(--abarva-mono)',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        color: item.severity === 'hard' ? 'var(--canon-red)' : 'var(--abarva-stone)',
                        flexShrink: 0,
                        marginLeft: 8,
                      }}
                    >
                      {item.severity}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Phase canvas sections */}
            {canvasSections.map((section) => (
              <section
                key={section.id}
                id={`ws-canvas-p${phaseNum}-${section.id}-panel`}
                className={styles.detailSection}
              >
                <div className={styles.detailSectionTitle}>{section.label}</div>
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--abarva-slate)',
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                    padding: '4px 0 2px',
                  }}
                >
                  {section.placeholder}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: 'rgba(0,102,204,0.04)',
                    border: '1px dashed rgba(0,102,204,0.18)',
                    fontSize: 12,
                    color: 'var(--abarva-slate)',
                  }}
                >
                  Work with Nexus in the chat pane to populate this section.
                </div>
              </section>
            ))}

            {/* Artifact shelf */}
            <section
              id={`ws-canvas-p${phaseNum}-artifact-shelf`}
              className={styles.detailSection}
            >
              <div className={styles.detailSectionTitle}>
                {config.label} &middot; Artifacts
              </div>
              {move.deliverables.filter((d) => {
                // Show deliverables relevant to this phase by checking naming conventions
                const phasePrefix = `p${phaseNum}_`;
                return d.typeKey.startsWith(phasePrefix) || d.typeKey.includes(`_p${phaseNum}`);
              }).length === 0 ? (
                <div
                  id={`ws-canvas-p${phaseNum}-artifact-empty-state`}
                  style={{
                    fontSize: 13,
                    color: 'var(--abarva-slate)',
                    fontStyle: 'italic',
                    padding: '4px 0',
                  }}
                >
                  No {config.label} artifacts yet. Nexus will generate artifacts as you work through the phase steps.
                </div>
              ) : (
                <div className={styles.evidenceList}>
                  {move.deliverables
                    .filter((d) => {
                      const phasePrefix = `p${phaseNum}_`;
                      return d.typeKey.startsWith(phasePrefix) || d.typeKey.includes(`_p${phaseNum}`);
                    })
                    .map((deliverable) => (
                      <a
                        key={deliverable.id}
                        className={styles.evItem}
                        href={deliverable.url}
                      >
                        <span className={styles.evNum}>{deliverable.typeKey}</span>
                        <span className={styles.evText}>{deliverable.title}</span>
                        <span
                          style={{
                            fontSize: 9,
                            fontFamily: 'var(--abarva-mono)',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            fontWeight: 700,
                            color: deliverable.status === 'signed' ? 'var(--canon-teal)' : 'var(--abarva-stone)',
                            flexShrink: 0,
                          }}
                        >
                          {deliverable.status}
                        </span>
                        <span className={styles.evLink} aria-hidden>&#8599;</span>
                      </a>
                    ))}
                </div>
              )}
            </section>
          </div>
        </article>
      </section>
    </div>
  );
}
