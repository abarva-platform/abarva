'use client';

// Move→Source hand-off CTA · loop wiring (GAP-2).
//
// Renders on the Move detail Overview tab when the Move carries a
// `sourcing_strategy` deliverable. It surfaces the Slice 2.6 Move-to-Source
// trigger's recommendation and gives the user one affordance to move into
// Source:
//
//   - If a Source event is already linked to this Move, the CTA deep-links
//     straight into that event ("Open Source event").
//   - Otherwise it POSTs the seeded recommendation to /api/v1/source/events
//     — carrying `linkedProgramId = moveId` so the new event records the
//     Move↔event linkage — then navigates to the new event.
//
// The recommendation payload is computed server-side by
// `runMoveToSourceHandoff` and passed in as a prop; this component only
// renders it and drives the create/open action.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './StrategicMoves.module.css';
import type { MoveToSourceHandoffResult } from '@/lib/programs/source-trigger/move-to-source-handoff';

interface ExistingLinkedEvent {
  id: string;
  code: string;
  name: string;
}

interface Props {
  /** The hand-off result computed server-side. */
  handoff: MoveToSourceHandoffResult;
  /** A Source event already linked to this Move, when one exists. */
  existingEvent: ExistingLinkedEvent | null;
}

export function MoveToSourceHandoffCta({ handoff, existingEvent }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { trigger, seed } = handoff;

  // No external sourcing needed — show the trigger verdict, no CTA.
  if (trigger.disposition !== 'sourcing_required' || !seed) {
    return (
      <section className={styles.detailSection} data-testid="move-to-source-handoff">
        <div className={styles.detailSectionTitle}>Sourcing hand-off</div>
        <p style={{ fontSize: 12.5, color: '#5A5A52', lineHeight: 1.5, margin: '4px 0 0' }}>
          {trigger.disposition === 'build_in_house'
            ? 'The Move-to-Source trigger reads this Move as build-in-house — the squad delivers it, no Source event is opened.'
            : 'The Move-to-Source trigger needs a resolved delivery model before a sourcing brief can be shaped.'}
        </p>
      </section>
    );
  }

  const rec = trigger.recommendation!;

  async function createSourceEvent() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/source/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seed),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        eventUrl?: string;
        error?: string;
        detail?: string;
      };
      if (!res.ok || !json.ok) {
        setError(json.detail ?? json.error ?? 'Could not open the Source event.');
        setPending(false);
        return;
      }
      router.push(json.eventUrl ?? '/source/portfolio');
    } catch {
      setError('Could not reach the Source intake. Try again.');
      setPending(false);
    }
  }

  return (
    <section className={styles.detailSection} data-testid="move-to-source-handoff">
      <div className={styles.detailSectionTitle}>Sourcing hand-off</div>

      <p style={{ fontSize: 12.5, color: '#5A5A52', lineHeight: 1.5, margin: '4px 0 10px' }}>
        {rec.whatToSource} The Move-to-Source trigger recommends a{' '}
        <strong>{rec.engagementKindLabel.toLowerCase()}</strong> ({trigger.confidence} confidence).
      </p>

      <div
        style={{
          border: '1px solid #E3E1DA',
          borderRadius: 10,
          background: '#FFFFFF',
          padding: '11px 13px',
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8A8A80', fontWeight: 700, marginBottom: 6 }}>
          External lane scope
        </div>
        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#3A3A34', lineHeight: 1.55 }}>
          {rec.externalScope.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>

      {error && (
        <p style={{ fontSize: 12, color: '#B4231A', margin: '0 0 8px' }}>{error}</p>
      )}

      {existingEvent ? (
        <a
          className={styles.btnPhase}
          href={`/source/events/${existingEvent.id}`}
          data-testid="move-to-source-open"
        >
          Open Source event · {existingEvent.code}{' '}
          <span className={styles.btnArrow} aria-hidden>&rarr;</span>
        </a>
      ) : (
        <button
          type="button"
          className={styles.btnPhase}
          onClick={createSourceEvent}
          disabled={pending}
          data-testid="move-to-source-create"
          style={{ border: 'none', cursor: pending ? 'wait' : 'pointer' }}
        >
          {pending ? 'Opening Source event…' : 'Open Source event'}{' '}
          {!pending && <span className={styles.btnArrow} aria-hidden>&rarr;</span>}
        </button>
      )}

      <p style={{ fontSize: 11, color: '#9A9A90', margin: '8px 0 0', lineHeight: 1.45 }}>
        The Source event records its linkage back to this Move — the decision trace shows the hand-off.
      </p>
    </section>
  );
}
