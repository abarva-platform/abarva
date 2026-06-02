'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  RESPONSIBLE_AI_ACKNOWLEDGMENT_TEXT,
  RESPONSIBLE_AI_ACKNOWLEDGMENT_VERSION,
} from '@/lib/ai-liability/responsible-ai-acknowledgment-copy';

export function ResponsibleAiAcknowledgmentForm({
  clientName,
  reason,
  storageAvailable,
}: {
  clientName: string;
  reason?: 'missing' | 'expired' | 'storage_unavailable' | string;
  storageAvailable: boolean;
}) {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAnnualRenewal = reason === 'expired';

  async function submit() {
    if (!accepted || submitting) return;
    setSubmitting(true);
    setError(null);

    const response = await fetch('/api/ai-liability/responsible-ai-acknowledgment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accepted: true,
        textVersion: RESPONSIBLE_AI_ACKNOWLEDGMENT_VERSION,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? 'Acknowledgment could not be recorded.');
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
          display: 'grid',
          gap: 8,
          border: '1px solid rgba(14, 118, 104, 0.18)',
          borderRadius: 8,
          background: '#E5F2EF',
          padding: 16,
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
          {isAnnualRenewal ? 'Annual renewal' : 'Required'} for {clientName}
        </div>
        <p style={{ margin: 0, color: '#0C1A3A', fontSize: 15, lineHeight: 1.55 }}>
          {RESPONSIBLE_AI_ACKNOWLEDGMENT_TEXT}
        </p>
        {isAnnualRenewal && (
          <p
            style={{
              margin: 0,
              color: '#59667A',
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            Your previous Responsible AI acknowledgment has reached its annual
            renewal point. Confirm the current human decision boundary before
            continuing.
          </p>
        )}
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
          The acknowledgment ledger is unavailable. Access remains paused until the
          system can record the acceptance evidence.
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
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          type="checkbox"
          style={{ marginTop: 3 }}
        />
        <span>
          I have read and understand this Responsible AI Use acknowledgment. I
          {isAnnualRenewal ? ' renew' : ' accept'} it for my access to{' '}
          {clientName}.
        </span>
      </label>

      {error && (
        <p role="alert" style={{ margin: 0, color: '#9F3E3B', fontSize: 13 }}>
          {error}
        </p>
      )}

      <button
        disabled={!accepted || submitting || !storageAvailable}
        onClick={submit}
        type="button"
        style={{
          width: 'fit-content',
          border: 'none',
          borderRadius: 8,
          background: !accepted || submitting || !storageAvailable ? '#A9B0BD' : '#0C1A3A',
          color: '#fff',
          cursor: !accepted || submitting || !storageAvailable ? 'not-allowed' : 'pointer',
          fontSize: 14,
          fontWeight: 800,
          padding: '11px 16px',
        }}
      >
        {submitting
          ? 'Recording...'
          : isAnnualRenewal
            ? 'Renew acknowledgment and continue'
            : 'Accept and continue'}
      </button>
    </div>
  );
}
