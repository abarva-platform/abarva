'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import styles from './StrategicMoves.module.css';
import { PhaseRail } from './PhaseRail';

type ScaffoldKey =
  | 'hypothesis'
  | 'archetype'
  | 'sponsor'
  | 'tenant'
  | 'foundation'
  | 'value'
  | 'evidence';

const SCAFFOLD_ORDER: ScaffoldKey[] = [
  'hypothesis',
  'archetype',
  'sponsor',
  'tenant',
  'foundation',
  'value',
  'evidence',
];

const SECTION_LABELS: Record<ScaffoldKey, string> = {
  hypothesis: 'Bet hypothesis',
  archetype: 'Archetype',
  sponsor: 'Sponsor',
  tenant: 'Tenant + scope',
  foundation: 'Foundation readiness',
  value: 'Value at stake',
  evidence: 'Originating evidence',
};

function emptyScaffold(): Record<ScaffoldKey, string> {
  return {
    hypothesis: '',
    archetype: '',
    sponsor: '',
    tenant: '',
    foundation: '',
    value: '',
    evidence: '',
  };
}

interface Props {
  tenantName: string;
}

type ChatTurn = {
  id: string;
  role: 'user' | 'nexus';
  text: string;
};

const BLANK_SEQUENCE: Array<{ key: ScaffoldKey; prompt: string }> = [
  { key: 'hypothesis', prompt: 'What operating pain are we solving first?' },
  { key: 'archetype', prompt: 'What archetype best fits this move?' },
  { key: 'sponsor', prompt: 'Who owns the outcome if this succeeds or stalls?' },
  { key: 'value', prompt: 'What measurable value outcome should we commit to?' },
];

export function StrategicMoveOriginateClient({ tenantName }: Props) {
  const router = useRouter();
  const [scaffold, setScaffold] = useState<Record<ScaffoldKey, string>>(emptyScaffold);
  const [programName, setProgramName] = useState('');
  const [composer, setComposer] = useState('');
  const [blankQuestionIndex, setBlankQuestionIndex] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [originEntry, setOriginEntry] = useState<'intel' | 'foundation' | 'premortem' | 'transfer' | 'blank' | null>(null);
  const [isPending, startTransition] = useTransition();
  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      id: 'nexus-intro-1',
      role: 'nexus',
      text: 'Tell me the outcome you want and the operating pain you need to resolve. I will draft your P0 scaffold.',
    },
    {
      id: 'nexus-intro-2',
      role: 'nexus',
      text: 'When all seven sections are complete, you can promote this move to P1 Charter.',
    },
  ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch('/api/programs/origination-draft?surface=/strategic-moves/new', {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const payload = (await res.json()) as {
        draft?: {
          state?: {
            brief?: {
              programName?: string | null;
              problemStatement?: string | null;
              targetOutcome?: string | null;
              timeline?: string | null;
              classification?: string | null;
              sponsor?: string | null;
            } | null;
            turns?: Array<{ text: string }>;
          };
        } | null;
      };
      if (cancelled) return;
      const brief = payload.draft?.state?.brief;
      if (!brief) return;
      setProgramName(brief.programName ?? '');
      setScaffold((prev) => ({
        ...prev,
        hypothesis: brief.problemStatement ?? prev.hypothesis,
        archetype: brief.classification ?? prev.archetype,
        sponsor: brief.sponsor ?? prev.sponsor,
        tenant: prev.tenant || tenantName,
        value: brief.targetOutcome ?? prev.value,
      }));
      setTurns((prev) => [
        ...prev,
        {
          id: `nexus-draft-${Date.now()}`,
          role: 'nexus',
          text: 'I loaded your saved draft and restored the scaffold sections already captured.',
        },
      ]);
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantName]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const payload = {
        surface: '/strategic-moves/new',
        state: {
          turns: [],
          brief: {
            programName: programName || null,
            problemStatement: scaffold.hypothesis || null,
            targetOutcome: scaffold.value || null,
            timeline: scaffold.foundation || null,
            classification: scaffold.archetype || null,
            matchedPatternId: null,
            sponsor: scaffold.sponsor || null,
            lead: scaffold.sponsor || null,
            crossProgramDependencies: [],
          },
          patternMatch: null,
        },
      };
      void fetch('/api/programs/origination-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }, 300);
    return () => clearTimeout(handle);
  }, [programName, scaffold]);

  const completedCount = useMemo(
    () => SCAFFOLD_ORDER.filter((key) => scaffold[key].trim().length > 0).length,
    [scaffold],
  );
  const canPromote = completedCount === 7 && !isPending;

  function addTurn(role: ChatTurn['role'], text: string) {
    setTurns((prev) => [...prev, { id: `${role}-${Date.now()}-${Math.random()}`, role, text }]);
  }

  function fillWithStagger(next: Partial<Record<ScaffoldKey, string>>) {
    const entries = Object.entries(next) as Array<[ScaffoldKey, string]>;
    entries.forEach(([key, value], index) => {
      setTimeout(() => {
        setScaffold((prev) => ({ ...prev, [key]: value }));
      }, index * 380);
    });
  }

  async function startFrom(type: 'intel' | 'foundation' | 'premortem' | 'transfer' | 'blank') {
    setBlankQuestionIndex(null);
    setOriginEntry(type);
    if (type === 'intel') {
      addTurn('user', 'Start from an Intelligence finding.');
      const res = await fetch('/api/v1/intelligence/signals?limit=3', { cache: 'no-store' });
      const data = res.ok ? ((await res.json()) as { signals?: Array<{ title?: string; summary?: string }> }) : {};
      const first = data.signals?.[0];
      fillWithStagger({
        hypothesis: first?.title || 'Modernize healthcare analytics for agentic care workflows.',
        archetype: 'PLATFORM MODERNIZATION',
        tenant: tenantName,
        evidence: first?.summary || 'Intelligence signal indicates fragmented Epic + claims + coding data flows.',
      });
      addTurn('nexus', first ? 'Loaded your strongest intelligence signal and drafted 4 scaffold sections.' : 'No high-confidence signal found, so I drafted a baseline structure and flagged evidence as needed.');
      return;
    }

    if (type === 'foundation') {
      addTurn('user', 'Start from a Foundation Readiness gap.');
      const res = await fetch('/api/v1/intelligence/foundation?limit=3', { cache: 'no-store' });
      const data = res.ok ? ((await res.json()) as { items?: Array<{ title?: string; detail?: string }> }) : {};
      const first = data.items?.[0];
      fillWithStagger({
        foundation: first?.title || 'Data lineage and quality gates are currently inconsistent across Epic, claims, and coding.',
        tenant: tenantName,
        evidence: first?.detail || 'Foundation gap indicates unresolved lineage controls.',
      });
      addTurn('nexus', 'Foundation gap loaded. I drafted readiness + evidence sections and pinned tenant scope.');
      return;
    }

    if (type === 'premortem') {
      addTurn('user', 'Start from pre-mortem results.');
      fillWithStagger({
        hypothesis: 'If we do not unify analytics delivery, prior-auth and coding quality programs will stall.',
        foundation: 'Pre-mortem predicts baseline ambiguity and sponsor contention if metrics are not locked early.',
        evidence: 'Pre-mortem run PM-STRAT-001 indicates data trust as top failure mode.',
      });
      addTurn('nexus', 'Loaded pre-mortem signals and drafted hypothesis/readiness/evidence. Continue by naming sponsor and value target.');
      return;
    }

    if (type === 'transfer') {
      addTurn('user', 'Start from cross-industry transfer.');
      fillWithStagger({
        archetype: 'CAPABILITY',
        value: 'Increase analytics release velocity while improving coding quality and prior-auth throughput.',
        evidence: 'Cross-industry transfer pattern indicates phased governance with P2 promise contracts.',
      });
      addTurn('nexus', 'Transfer pattern loaded. I drafted archetype/value/evidence and left sponsor + scope for confirmation.');
      return;
    }

    addTurn('user', 'Start from a blank hypothesis.');
    fillWithStagger({
      tenant: tenantName,
      evidence: 'Nexus will attach originating evidence as we define the move.',
    });
    setBlankQuestionIndex(0);
    addTurn('nexus', BLANK_SEQUENCE[0].prompt);
  }

  function fillNextEmptySection(text: string) {
    const emptyKey = SCAFFOLD_ORDER.find((key) => scaffold[key].trim().length === 0);
    if (!emptyKey) return;
    setScaffold((prev) => ({ ...prev, [emptyKey]: text }));
  }

  function handleSend() {
    const message = composer.trim();
    if (!message) return;
    setComposer('');
    addTurn('user', message);

    if (blankQuestionIndex !== null) {
      const step = BLANK_SEQUENCE[blankQuestionIndex];
      setScaffold((prev) => ({ ...prev, [step.key]: message, tenant: prev.tenant || tenantName }));
      const next = blankQuestionIndex + 1;
      if (next < BLANK_SEQUENCE.length) {
        setBlankQuestionIndex(next);
        addTurn('nexus', BLANK_SEQUENCE[next].prompt);
      } else {
        setBlankQuestionIndex(null);
        addTurn('nexus', 'Great. I drafted the core sections. Now add foundation readiness and originating evidence to unlock promotion.');
      }
      return;
    }

    fillNextEmptySection(message);
    addTurn('nexus', 'Captured. I drafted the next scaffold section from your input. Keep going and I will complete all seven sections.');
  }

  function cancelFlow() {
    if (completedCount === 0 && !programName.trim()) {
      router.push('/strategic-moves');
      return;
    }
    setShowConfirm(true);
  }

  async function promote() {
    setSubmitError(null);
    const finalProgramName = programName.trim() || scaffold.hypothesis.slice(0, 100) || 'Untitled Strategic Move';
    startTransition(() => {
      void (async () => {
        const res = await fetch('/api/programs/origination-submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            surface: '/strategic-moves/new',
            programName: finalProgramName,
            problemStatement: scaffold.hypothesis,
            targetOutcome: scaffold.value,
            timeline: scaffold.foundation,
            classification: scaffold.archetype,
            sponsor: scaffold.sponsor,
            lead: scaffold.sponsor,
            matchedPatternId: null,
          }),
        });
        const payload = (await res.json()) as {
          ok?: boolean;
          engagementId?: string;
          message?: string;
          error?: string;
        };
        if (!res.ok || !payload.engagementId) {
          setSubmitError(payload.message || payload.error || 'Submit failed.');
          return;
        }
        router.push(`/strategic-moves/${payload.engagementId}`);
      })();
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.originContextBar}>
        <div className={styles.originContextLeft}>
          <span className={styles.originBranch} aria-hidden>&#8627;</span>
          <span className={styles.originLabel}>Originating new move</span>
          <span className={styles.originDraftBadge}>
            {programName.trim() ? programName.toUpperCase() : 'UNTITLED'} &middot; DRAFT
          </span>
        </div>
        <button className={styles.originCancel} onClick={cancelFlow} type="button">
          &#10005; Cancel
        </button>
      </div>

      <section className={styles.detailShell}>
        <aside className={styles.chatPane}>
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
            <div className={styles.chatSubhead}>
              I draft, you decide. Tell me the bet &mdash; or pick a starting point below.
            </div>
          </div>
          <div className={styles.chatThread}>
            {turns.map((turn) => (
              <div
                key={turn.id}
                className={turn.role === 'nexus' ? styles.bubbleNexus : styles.bubbleUser}
              >
                {turn.text}
              </div>
            ))}
          </div>
          <div className={styles.startFromBlock}>
            <div className={styles.startFromLabel}>
              <span aria-hidden>&#8627;</span> Start from
            </div>
            <div className={styles.startFromChips}>
              {(
                [
                  { entry: 'intel' as const, label: 'An Intelligence finding' },
                  { entry: 'foundation' as const, label: 'A Foundation Readiness gap' },
                  { entry: 'premortem' as const, label: 'A pre-mortem result' },
                  { entry: 'transfer' as const, label: 'Cross-industry transfer' },
                  { entry: 'blank' as const, label: 'A blank hypothesis' },
                ]
              ).map(({ entry, label }) => (
                <button
                  key={entry}
                  className={`${styles.startChip} ${originEntry !== null ? styles.startChipUsed : ''}`}
                  onClick={() => void startFrom(entry)}
                  type="button"
                  disabled={originEntry !== null}
                >
                  <span>{label}</span>
                  <span className={styles.startChipArrow} aria-hidden>&rarr;</span>
                </button>
              ))}
            </div>
          </div>
          <div className={styles.chatInput}>
            <div className={styles.inputRow}>
              <input
                type="text"
                value={composer}
                onChange={(event) => setComposer(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Describe the outcome, tenant, and any signals\u2026"
              />
              <button
                className={styles.sendBtn}
                type="button"
                onClick={handleSend}
                aria-label="Send"
              >
                &#8593;
              </button>
            </div>
          </div>
        </aside>

        <article className={styles.rightPane}>
          <div className={styles.detailHead}>
            <div className={styles.detailHeadTop}>
              <div className={styles.detailHeadLeft}>
                <div className={styles.detailBreadcrumb}>
                  <button
                    className={styles.detailCrumb}
                    onClick={cancelFlow}
                    type="button"
                  >
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
            <PhaseRail current={0} totalPhases={8} status="teal" />
          </div>

          <div className={styles.scaffoldList}>
            {SCAFFOLD_ORDER.map((key, index) => {
              const filled = scaffold[key].trim().length > 0;
              const num = String(index + 1).padStart(2, '0');
              return (
                <section
                  className={`${styles.scaffoldRow} ${filled ? styles.scaffoldRowFilled : ''}`}
                  key={key}
                >
                  <div className={styles.scaffoldNum}>{num}</div>
                  <div className={styles.scaffoldBody}>
                    <div className={styles.scaffoldLabel}>{SECTION_LABELS[key]}</div>
                    {filled ? (
                      <div className={styles.scaffoldName}>{scaffold[key]}</div>
                    ) : (
                      <div className={styles.scaffoldEmpty}>
                        Nexus will draft {SECTION_LABELS[key].toLowerCase()} from your conversation.
                      </div>
                    )}
                  </div>
                  <div className={styles.scaffoldIndicator} aria-hidden />
                </section>
              );
            })}
          </div>

          <footer className={styles.scaffoldFoot}>
            <button
              className={styles.btnPromote}
              disabled={!canPromote}
              onClick={() => void promote()}
              type="button"
            >
              <span>Promote to P1 Charter</span>
              <span className={styles.btnPromoteArrow} aria-hidden>&rarr;</span>
            </button>
            <div className={styles.promoteHelper}>
              {completedCount === 7 ? 'Ready to promote' : `${completedCount} of 7 sections complete`}
            </div>
            {submitError ? (
              <div className={styles.submitError}>{submitError}</div>
            ) : null}
          </footer>
        </article>
      </section>

      {showConfirm ? (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialog}>
            <div className={styles.sectionTitle}>Unsaved origination</div>
            <div>You have scaffold content in progress. What do you want to do?</div>
            <div className={styles.dialogActions}>
              <button className={styles.textButton} onClick={() => setShowConfirm(false)} type="button">
                Continue working
              </button>
              <button
                className={styles.textButton}
                onClick={() => {
                  setShowConfirm(false);
                  setProgramName('');
                  setScaffold(emptyScaffold());
                  router.push('/strategic-moves');
                }}
                type="button"
              >
                Discard
              </button>
              <button
                className={styles.primaryAction}
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
