'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import styles from './StrategicMoves.module.css';

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

export function StrategicMoveOriginateClient({ tenantName }: Props) {
  const router = useRouter();
  const [scaffold, setScaffold] = useState<Record<ScaffoldKey, string>>(emptyScaffold);
  const [programName, setProgramName] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

  function fillWithStagger(next: Partial<Record<ScaffoldKey, string>>) {
    const entries = Object.entries(next) as Array<[ScaffoldKey, string]>;
    entries.forEach(([key, value], index) => {
      setTimeout(() => {
        setScaffold((prev) => ({ ...prev, [key]: value }));
      }, index * 380);
    });
  }

  async function startFrom(type: 'intel' | 'foundation' | 'premortem' | 'transfer' | 'blank') {
    if (type === 'intel') {
      // TODO: wire chip to richer intelligence findings endpoint when available.
      const res = await fetch('/api/v1/intelligence/signals?limit=3', { cache: 'no-store' });
      const data = res.ok ? ((await res.json()) as { signals?: Array<{ title?: string; summary?: string }> }) : {};
      const first = data.signals?.[0];
      fillWithStagger({
        hypothesis: first?.title || 'Modernize healthcare analytics for agentic care workflows.',
        archetype: 'PLATFORM MODERNIZATION',
        tenant: tenantName,
        evidence: first?.summary || 'Intelligence signal indicates fragmented Epic + claims + coding data flows.',
      });
      return;
    }

    if (type === 'foundation') {
      // TODO: wire chip to foundation readiness gaps endpoint contract.
      const res = await fetch('/api/v1/intelligence/foundation?limit=3', { cache: 'no-store' });
      const data = res.ok ? ((await res.json()) as { items?: Array<{ title?: string; detail?: string }> }) : {};
      const first = data.items?.[0];
      fillWithStagger({
        foundation: first?.title || 'Data lineage and quality gates are currently inconsistent across Epic, claims, and coding.',
        tenant: tenantName,
        evidence: first?.detail || 'Foundation gap indicates unresolved lineage controls.',
      });
      return;
    }

    if (type === 'premortem') {
      // TODO: no pre-mortem list endpoint found yet; use fixture stub until module route exists.
      fillWithStagger({
        hypothesis: 'If we do not unify analytics delivery, prior-auth and coding quality programs will stall.',
        foundation: 'Pre-mortem predicts baseline ambiguity and sponsor contention if metrics are not locked early.',
        evidence: 'Pre-mortem run PM-STRAT-001 indicates data trust as top failure mode.',
      });
      return;
    }

    if (type === 'transfer') {
      // TODO: no transfer library list endpoint found yet; use fixture stub until module route exists.
      fillWithStagger({
        archetype: 'CAPABILITY',
        value: 'Increase analytics release velocity while improving coding quality and prior-auth throughput.',
        evidence: 'Cross-industry transfer pattern indicates phased governance with P2 promise contracts.',
      });
      return;
    }

    fillWithStagger({
      tenant: tenantName,
      hypothesis: 'Define a focused strategic move with a measurable value outcome.',
    });
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
      <div className={styles.topbar}>
        <div>
          <div className={styles.eyebrow}>Strategic Moves</div>
          <h1 className={styles.title}>Originate new move</h1>
        </div>
      </div>

      <section className={styles.originateShell}>
        <aside className={styles.chatPane}>
          <div className={styles.chatHead}>
            <div className={styles.eyebrow}>New Move · P0 Originate</div>
            <div>Nexus drafting mode</div>
          </div>
          <div className={styles.chatBody}>
            <div className={styles.bubbleNexus}>
              Tell me the outcome you want and the operating pain you need to resolve. I will draft your P0 scaffold.
            </div>
            <div className={styles.bubbleNexus}>
              When all seven sections are complete, you can promote this move to P1 Charter.
            </div>
          </div>
          <div className={styles.startFromLabel}>↳ Start from</div>
          <div className={styles.chipColumn}>
            <button className={styles.startChip} onClick={() => void startFrom('intel')} type="button">An Intelligence finding</button>
            <button className={styles.startChip} onClick={() => void startFrom('foundation')} type="button">A Foundation Readiness gap</button>
            <button className={styles.startChip} onClick={() => void startFrom('premortem')} type="button">A pre-mortem result</button>
            <button className={styles.startChip} onClick={() => void startFrom('transfer')} type="button">Cross-industry transfer</button>
            <button className={styles.startChip} onClick={() => void startFrom('blank')} type="button">A blank hypothesis</button>
          </div>
        </aside>

        <article className={styles.rightPane}>
          <div className={styles.originContext}>
            <div>
              <div className={styles.eyebrow}>↳ Originating new move · draft</div>
              <input
                className={styles.scaffoldTextarea}
                onChange={(event) => setProgramName(event.target.value)}
                placeholder="Move name"
                value={programName}
              />
            </div>
            <button className={styles.textButton} onClick={cancelFlow} type="button">
              Cancel
            </button>
          </div>

          <div className={styles.scaffold}>
            {SCAFFOLD_ORDER.map((key, index) => {
              const filled = scaffold[key].trim().length > 0;
              return (
                <section
                  className={`${styles.scaffoldRow} ${filled ? styles.scaffoldRowFilled : ''}`}
                  key={key}
                >
                  <div className={`${styles.scaffoldLabel} ${filled ? styles.scaffoldLabelFilled : ''}`}>
                    {index + 1}. {SECTION_LABELS[key]}
                  </div>
                  <textarea
                    className={styles.scaffoldTextarea}
                    onChange={(event) => setScaffold((prev) => ({ ...prev, [key]: event.target.value }))}
                    placeholder={`Capture ${SECTION_LABELS[key].toLowerCase()}...`}
                    value={scaffold[key]}
                  />
                </section>
              );
            })}
          </div>

          <footer className={styles.scaffoldFoot}>
            <div>{completedCount} of 7 sections complete</div>
            <button
              className={`${styles.primaryAction} ${canPromote ? '' : styles.disabled}`}
              disabled={!canPromote}
              onClick={() => void promote()}
              type="button"
            >
              Promote to P1 Charter →
            </button>
          </footer>
          {submitError ? (
            <div style={{ color: 'var(--canon-red)', marginTop: 8, fontSize: 13 }}>{submitError}</div>
          ) : null}
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

