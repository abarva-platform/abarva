'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  RESPONSIBLE_AI_TRAINING_COMPLETION_STATEMENT,
  RESPONSIBLE_AI_TRAINING_ESTIMATED_MINUTES,
  RESPONSIBLE_AI_TRAINING_MODULES,
  RESPONSIBLE_AI_TRAINING_VERSION,
} from '@/lib/ai-liability/responsible-ai-training-copy';

export function ResponsibleAiTrainingForm({
  clientName,
  storageAvailable,
}: {
  clientName: string;
  storageAvailable: boolean;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!completed || submitting) return;
    setSubmitting(true);
    setError(null);

    const response = await fetch('/api/ai-liability/responsible-ai-training', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        completed: true,
        trainingVersion: RESPONSIBLE_AI_TRAINING_VERSION,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? 'Training completion could not be recorded.');
      setSubmitting(false);
      return;
    }

    router.replace('/home');
    router.refresh();
  }

  return (
    <div
      style={{
        display: 'grid',
        gap: 18,
        border: '1px solid rgba(12, 26, 58, 0.14)',
        borderRadius: 8,
        background: '#fff',
        padding: 24,
        boxShadow: '0 18px 48px rgba(12, 26, 58, 0.08)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            color: '#0E7668',
            fontFamily: 'var(--font-jetbrains-mono)',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Required training for {clientName}
        </div>
        <div
          aria-label={`Estimated ${RESPONSIBLE_AI_TRAINING_ESTIMATED_MINUTES} minutes`}
          style={{
            border: '1px solid rgba(14, 118, 104, 0.22)',
            borderRadius: 999,
            color: '#0E7668',
            fontFamily: 'var(--font-jetbrains-mono)',
            fontSize: 11,
            fontWeight: 800,
            padding: '6px 10px',
            textTransform: 'uppercase',
          }}
        >
          {RESPONSIBLE_AI_TRAINING_ESTIMATED_MINUTES} min
        </div>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {RESPONSIBLE_AI_TRAINING_MODULES.map((module, index) => (
          <article
            key={module.title}
            style={{
              border: '1px solid rgba(12, 26, 58, 0.12)',
              borderRadius: 8,
              background: index % 2 === 0 ? '#F8FAFC' : '#F6F1EA',
              padding: 16,
            }}
          >
            <div
              style={{
                color: '#8B95A8',
                fontFamily: 'var(--font-jetbrains-mono)',
                fontSize: 11,
                fontWeight: 800,
                marginBottom: 6,
                textTransform: 'uppercase',
              }}
            >
              Module {index + 1}
            </div>
            <h2
              style={{
                margin: 0,
                color: '#0C1A3A',
                fontSize: 16,
                fontWeight: 800,
                lineHeight: 1.25,
              }}
            >
              {module.title}
            </h2>
            <p style={{ margin: '8px 0 0', color: '#59667A', fontSize: 14, lineHeight: 1.55 }}>
              {module.body}
            </p>
          </article>
        ))}
      </div>

      {!storageAvailable && (
        <p
          role="alert"
          style={{
            margin: 0,
            border: '1px solid rgba(159, 62, 59, 0.22)',
            borderRadius: 8,
            background: '#F9E6E4',
            color: '#9F3E3B',
            padding: 12,
            fontSize: 13,
            lineHeight: 1.45,
          }}
        >
          The training ledger is unavailable. Access remains paused until the
          system can record the completion evidence.
        </p>
      )}

      <label
        style={{
          display: 'grid',
          gridTemplateColumns: '20px minmax(0, 1fr)',
          gap: 10,
          alignItems: 'start',
          color: '#27324A',
          fontSize: 14,
          lineHeight: 1.45,
        }}
      >
        <input
          checked={completed}
          onChange={(event) => setCompleted(event.target.checked)}
          type="checkbox"
          style={{ marginTop: 3 }}
        />
        <span>{RESPONSIBLE_AI_TRAINING_COMPLETION_STATEMENT}</span>
      </label>

      {error && (
        <p role="alert" style={{ margin: 0, color: '#9F3E3B', fontSize: 13 }}>
          {error}
        </p>
      )}

      <button
        disabled={!completed || submitting || !storageAvailable}
        onClick={submit}
        type="button"
        style={{
          width: 'fit-content',
          border: 'none',
          borderRadius: 8,
          background: !completed || submitting || !storageAvailable ? '#A9B0BD' : '#0C1A3A',
          color: '#fff',
          cursor: !completed || submitting || !storageAvailable ? 'not-allowed' : 'pointer',
          fontSize: 14,
          fontWeight: 800,
          padding: '11px 16px',
        }}
      >
        {submitting ? 'Recording...' : 'Complete training and continue'}
      </button>
    </div>
  );
}
