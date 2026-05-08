'use client';

// StrategicMoveOriginateClient · Strategic Moves Originate (P0)
//
// Two-pane origination workspace: Nexus chat on the left drives a
// reactive 7-section scaffold on the right. Uses /api/chat/agent with
// surface '/strategic-moves/new' and agentName 'Nexus'.
//
// The agent receives the T-P0 phase pack + AH-ORIG-1–6 rules via the
// agent route system prompt. First-message variant (2A/2B) is composed
// server-side and passed in as `initialTurns`.

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { extractArtifacts, visibleArtifactPendingText } from '@/lib/agent/artifacts';
import type { BriefProgressArtifact, Artifact } from '@/lib/agent/artifacts';
import styles from './StrategicMoves.module.css';
import { PhaseRail } from './PhaseRail';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ChatTurn = {
  id: string;
  role: 'user' | 'assistant';
  agentName?: 'Nexus';
  text: string;
};

type ScaffoldFieldId =
  | 'problem-statement'
  | 'archetype'
  | 'sponsor-candidate'
  | 'scope-boundary'
  | 'evidence-family'
  | 'value-hypothesis'
  | 'foundation-readiness';

interface BriefState {
  programName: string;
  fields: Record<ScaffoldFieldId, string>;
}

const INITIAL_FIELDS: Record<ScaffoldFieldId, string> = {
  'problem-statement': '',
  'archetype': '',
  'sponsor-candidate': '',
  'scope-boundary': '',
  'evidence-family': '',
  'value-hypothesis': '',
  'foundation-readiness': '',
};

// Steps 1–4 are required to promote. Steps 5–7 are optional enrichment
// that Nexus can fill during P1 if not captured at origination.
const REQUIRED_FIELD_COUNT = 4;

const SCAFFOLD_DEFS: Array<{ id: ScaffoldFieldId; label: string; step: number; optional?: boolean }> = [
  { id: 'problem-statement', label: "What's the bet / hypothesis", step: 1 },
  { id: 'archetype', label: 'Archetype classification', step: 2 },
  { id: 'sponsor-candidate', label: 'Sponsor candidate', step: 3 },
  { id: 'scope-boundary', label: 'Scope / boundary', step: 4 },
  { id: 'evidence-family', label: 'Evidence family selection', step: 5, optional: true },
  { id: 'value-hypothesis', label: 'Value hypothesis seed', step: 6, optional: true },
  { id: 'foundation-readiness', label: 'Foundation readiness', step: 7, optional: true },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateTurnId(): string {
  return `turn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function applyBriefProgressArtifact(
  fields: Record<ScaffoldFieldId, string>,
  artifact: BriefProgressArtifact,
): Record<ScaffoldFieldId, string> {
  const next = { ...fields };
  for (const f of artifact.fields) {
    const id = f.id as ScaffoldFieldId;
    if (f.status !== 'empty' && f.value && id in next) {
      next[id] = f.value;
    }
  }
  return next;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  tenantName: string;
  initialTurns?: ChatTurn[];
}

export function StrategicMoveOriginateClient({ tenantName, initialTurns }: Props) {
  const router = useRouter();
  const [turns, setTurns] = useState<ChatTurn[]>(
    initialTurns ?? [
      {
        id: 'nexus-open-2a',
        role: 'assistant',
        agentName: 'Nexus',
        text: `To start a new Strategic Move, I need four things from you: the outcome you're targeting, who cares about it, what evidence you have, and a rough sense of what value is at stake. Where do you want to start?`,
      },
    ],
  );
  const [brief, setBrief] = useState<BriefState>({
    programName: '',
    fields: { ...INITIAL_FIELDS },
  });
  const [composer, setComposer] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [scaffoldOpen, setScaffoldOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const turnsRef = useRef<ChatTurn[]>(turns);
  turnsRef.current = turns;
  const threadRef = useRef<HTMLDivElement>(null);

  // Auto-scroll thread
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [turns]);

  // Debounced draft persistence
  useEffect(() => {
    const handle = setTimeout(() => {
      void fetch('/api/programs/origination-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surface: '/strategic-moves/new',
          state: {
            turns: turns
              .filter((t) => t.text.trim().length > 0)
              .map((t) => ({ id: t.id, role: t.role, agentName: t.agentName, text: t.text })),
            brief: {
              programName: brief.programName || null,
              problemStatement: brief.fields['problem-statement'] || null,
              targetOutcome: brief.fields['value-hypothesis'] || null,
              timeline: null,
              classification: brief.fields['archetype'] || null,
              matchedPatternId: null,
              sponsor: brief.fields['sponsor-candidate'] || null,
              lead: null,
              crossProgramDependencies: [],
            },
            patternMatch: null,
          },
        }),
      });
    }, 500);
    return () => clearTimeout(handle);
  }, [turns, brief]);

  const updateTurns = useCallback(
    (updater: ChatTurn[] | ((prev: ChatTurn[]) => ChatTurn[])) => {
      const next = typeof updater === 'function' ? updater(turnsRef.current) : updater;
      turnsRef.current = next;
      setTurns(next);
    },
    [],
  );

  const handleArtifact = useCallback((artifact: Artifact) => {
    if (artifact.type === 'brief-progress') {
      setBrief((prev) => ({
        ...prev,
        fields: applyBriefProgressArtifact(prev.fields, artifact as BriefProgressArtifact),
      }));
    }
  }, []);

  const send = useCallback(
    async (messageOverride?: string) => {
      const message = (messageOverride ?? composer).trim();
      if (!message || streaming) return;

      const assistantTurnId = generateTurnId();
      updateTurns((prev) => [
        ...prev,
        { id: generateTurnId(), role: 'user', text: message },
        { id: assistantTurnId, role: 'assistant', agentName: 'Nexus', text: '' },
      ]);
      if (!messageOverride) setComposer('');
      setStreaming(true);
      setSubmitError(null);

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
            message,
            tenantName,
            agentName: 'Nexus',
            surface: '/strategic-moves/new',
            conversationHistory,
            surfaceContext: { programName: brief.programName || null },
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
              handleArtifact(a);
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
          for (const a of final.artifacts) {
            const key = JSON.stringify(a);
            if (!seenArtifacts.has(key)) {
              seenArtifacts.add(key);
              handleArtifact(a);
            }
          }
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
    [composer, streaming, tenantName, brief.programName, updateTurns, handleArtifact],
  );

  const filledCount = Object.values(brief.fields).filter((v) => v.trim().length > 0).length;
  const requiredFilled = SCAFFOLD_DEFS.filter(({ id, optional }) => !optional && brief.fields[id].trim().length > 0).length;
  const canPromote = requiredFilled >= REQUIRED_FIELD_COUNT && !isPending && !streaming;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      if (showConfirm) {
        setShowConfirm(false);
      } else {
        cancelFlow();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showConfirm]);

  function cancelFlow() {
    if (filledCount === 0 && !brief.programName.trim()) {
      router.push('/strategic-moves');
      return;
    }
    setShowConfirm(true);
  }

  async function promote() {
    setSubmitError(null);
    const finalName =
      brief.programName.trim() ||
      brief.fields['problem-statement'].slice(0, 100) ||
      'Untitled Strategic Move';
    startTransition(() => {
      void (async () => {
        // Snapshot origination turns before submit (filter empty turns, cap at 40)
        const originationTurns = turnsRef.current
          .filter((t) => t.text.trim().length > 0)
          .slice(-40)
          .map((t) => ({ role: t.role, text: t.text }));

        const res = await fetch('/api/programs/origination-submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            surface: '/strategic-moves/new',
            programName: finalName,
            problemStatement: brief.fields['problem-statement'],
            targetOutcome: brief.fields['value-hypothesis'],
            timeline: brief.fields['foundation-readiness'],
            classification: brief.fields['archetype'],
            sponsor: brief.fields['sponsor-candidate'],
            lead: brief.fields['sponsor-candidate'],
            matchedPatternId: null,
            // Extended scaffold fields
            scopeBoundary: brief.fields['scope-boundary'] || null,
            evidenceFamily: brief.fields['evidence-family'] || null,
            // Origination chat transcript → persisted to turns table
            originationTurns,
          }),
        });
        const payload = (await res.json()) as {
          ok?: boolean;
          engagementId?: string;
          message?: string;
          error?: string;
        };
        if (!res.ok || !payload.engagementId) {
          setSubmitError(payload.message ?? payload.error ?? 'Submit failed.');
          return;
        }
        router.push(`/strategic-moves/${payload.engagementId}`);
      })();
    });
  }

  return (
    <div id="orig-page" className={styles.page}>
      {/* orig-identity */}
      <div id="orig-identity" className={styles.originContextBar}>
        <div className={styles.originContextLeft}>
          <span className={styles.originBranch} aria-hidden>&#8627;</span>
          <span className={styles.originLabel}>Originating new move</span>
          <span id="orig-identity-title" className={styles.originDraftBadge}>
            {brief.programName.trim() ? brief.programName.toUpperCase() : 'UNTITLED'} &middot; DRAFT
          </span>
        </div>
        <button className={styles.originCancel} onClick={cancelFlow} type="button">
          &#10005; Cancel
        </button>
      </div>

      {/* orig-grid */}
      <section id="orig-grid" className={styles.detailShell}>

        {/* orig-chat */}
        <aside id="orig-chat" className={styles.chatPane}>
          <div className={styles.chatHead}>
            <div className={styles.agentRow}>
              <div className={styles.agentAvatar} aria-hidden>&#10022;</div>
              <div>
                <div className={styles.agentName}>Nexus</div>
                <div className={styles.agentStatus}>
                  <span className={styles.agentStatusDot} aria-hidden />
                  NEW MOVE &middot; P0 ORIGINATE
                </div>
              </div>
            </div>
          </div>

          {/* orig-chat-message-list */}
          <div id="orig-chat-message-list" className={styles.chatThread} ref={threadRef}>
            {turns.map((turn) => (
              <div
                key={turn.id}
                className={turn.role === 'assistant' ? styles.bubbleNexus : styles.bubbleUser}
              >
                {turn.text || (streaming && turn.role === 'assistant' ? '…' : '')}
              </div>
            ))}
          </div>

          {/* orig-chat-scaffold — collapsible step ladder */}
          <div id="orig-chat-scaffold" className={styles.startFromBlock}>
            <button
              type="button"
              className={styles.scaffoldToggleBtn}
              onClick={() => setScaffoldOpen((v) => !v)}
              aria-expanded={scaffoldOpen}
              aria-controls="orig-chat-scaffold-grid"
            >
              <span aria-hidden>&#8627;</span>
              Scaffold
              <span className={styles.startChipCount}>
                {requiredFilled}/{REQUIRED_FIELD_COUNT} req.
              </span>
              <span className={styles.scaffoldToggleIcon} aria-hidden>
                {scaffoldOpen ? '▴' : '▾'}
              </span>
            </button>
            {scaffoldOpen && (
              <div id="orig-chat-scaffold-grid" className={styles.startChipGrid}>
                {SCAFFOLD_DEFS.map(({ id, label, step, optional }) => {
                  const filled = brief.fields[id].trim().length > 0;
                  return (
                    <button
                      key={id}
                      id={`orig-chat-scaffold-step-${step}`}
                      className={`${styles.startChipCompact} ${filled ? styles.startChipUsed : ''}`}
                      onClick={() => void send(`Let's work on step ${step}: ${label}.`)}
                      type="button"
                      disabled={streaming}
                      aria-label={`${label}${optional ? ' (optional)' : ''}${filled ? ' — captured' : ''}`}
                      title={label}
                    >
                      <span className={styles.chipStepNum} aria-hidden>{step}</span>
                      <span className={styles.chipLabel}>{label}{optional ? <span className={styles.chipOptional}> opt</span> : null}</span>
                      {filled ? (
                        <span className={styles.startChipArrow} aria-hidden>&#10003;</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* orig-chat-input-area */}
          <div id="orig-chat-input-area" className={styles.chatInput}>
            <div className={styles.inputRow}>
              <textarea
                id="orig-chat-input-field"
                rows={1}
                value={composer}
                onChange={(e) => {
                  setComposer(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder="Describe the outcome or pick a step above…"
                disabled={streaming}
                spellCheck
                style={{ overflowY: 'hidden', maxHeight: '120px' }}
              />
              <button
                id="orig-chat-send-btn"
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

        {/* orig-canvas */}
        <article id="orig-canvas" className={styles.rightPane}>
          <div className={styles.detailHead}>
            <div className={styles.detailHeadTop}>
              <div className={styles.detailHeadLeft}>
                <div className={styles.detailBreadcrumb}>
                  <button className={styles.detailCrumb} onClick={cancelFlow} type="button">
                    Strategic Moves
                  </button>
                  <span aria-hidden>&rsaquo;</span>
                  <span>{tenantName}</span>
                  <span aria-hidden>&rsaquo;</span>
                  <span>NEW</span>
                </div>
                <h1 className={styles.detailTitle}>Originate a strategic move</h1>
                <div className={styles.detailId}>P0 Originate &middot; Drafting</div>
              </div>
            </div>
            <PhaseRail current={0} status="teal" />
          </div>

          {/* orig-canvas-brief */}
          <div id="orig-canvas-brief" className={styles.scaffoldList}>
            {SCAFFOLD_DEFS.map(({ id, label, step, optional }) => {
              const value = brief.fields[id];
              const filled = value.trim().length > 0;
              const num = String(step).padStart(2, '0');
              return (
                <section
                  id={`orig-canvas-brief-section-${step}`}
                  className={`${styles.scaffoldRow} ${filled ? styles.scaffoldRowFilled : ''}`}
                  key={id}
                >
                  <div className={styles.scaffoldNum}>{num}</div>
                  <div className={styles.scaffoldBody}>
                    <div className={styles.scaffoldLabel}>
                      {label}
                      {optional ? <span className={styles.scaffoldOptionalTag}> optional</span> : null}
                    </div>
                    {filled ? (
                      <div
                        id={`orig-canvas-brief-section-${step}-content`}
                        className={styles.scaffoldName}
                      >
                        {value}
                      </div>
                    ) : (
                      <div className={styles.scaffoldEmpty}>
                        Nexus will capture {label.toLowerCase()} from your conversation.
                      </div>
                    )}
                  </div>
                  <div className={styles.scaffoldIndicator} aria-hidden />
                </section>
              );
            })}
          </div>

          {/* orig-promote-bar */}
          <footer id="orig-promote-bar" className={styles.scaffoldFoot}>
            <div className={styles.programNameRow}>
              <input
                id="orig-identity-name-input"
                type="text"
                placeholder="Move name (Nexus will suggest, or type here)"
                value={brief.programName}
                onChange={(e) =>
                  setBrief((prev) => ({ ...prev, programName: e.target.value }))
                }
                className={styles.programNameInput}
              />
            </div>
            <button
              id="orig-promote-bar-promote-btn"
              className={styles.btnPromote}
              disabled={!canPromote}
              onClick={() => void promote()}
              type="button"
              aria-disabled={!canPromote}
            >
              <span>Promote to P1 Charter</span>
              <span className={styles.btnPromoteArrow} aria-hidden>&rarr;</span>
            </button>
            <div id="orig-promote-bar-gate-summary" className={styles.promoteHelper}>
              {canPromote ? 'Ready to promote' : `${requiredFilled} of ${REQUIRED_FIELD_COUNT} required sections complete`}
            </div>
            {!canPromote ? (
              <div id="orig-promote-bar-status-text" className={styles.promoteHelper}>
                Complete steps 1–4 to promote. Steps 5–7 are optional.
              </div>
            ) : null}
            {submitError ? <div className={styles.submitError}>{submitError}</div> : null}
          </footer>
        </article>
      </section>

      {/* Discard confirmation */}
      {showConfirm ? (
        <div
          className={`${styles.confirmOverlay} ${styles.confirmOverlayShow}`}
          role="presentation"
        >
          <div
            className={styles.confirmDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-discard-title"
          >
            <h3 id="confirm-discard-title" className={styles.confirmDialogTitle}>
              Discard this move?
            </h3>
            <p className={styles.confirmDialogBody}>
              You&rsquo;ve captured {filledCount} of 7 sections ({requiredFilled} of {REQUIRED_FIELD_COUNT} required). Save as a draft to come back, or discard and start fresh.
            </p>
            <div className={styles.confirmActions}>
              <button className={styles.confirmBtn} onClick={() => setShowConfirm(false)} type="button">
                Continue working
              </button>
              <button
                className={`${styles.confirmBtn} ${styles.confirmBtnDanger}`}
                onClick={() => {
                  setShowConfirm(false);
                  setBrief({ programName: '', fields: { ...INITIAL_FIELDS } });
                  router.push('/strategic-moves');
                }}
                type="button"
              >
                Discard
              </button>
              <button
                className={`${styles.confirmBtn} ${styles.confirmBtnPrimary}`}
                onClick={() => {
                  setShowConfirm(false);
                  router.push('/strategic-moves');
                }}
                type="button"
              >
                Save as draft
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
