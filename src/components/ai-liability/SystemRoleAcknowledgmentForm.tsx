'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  SYSTEM_ROLE_ACKNOWLEDGMENT_POINTS,
  SYSTEM_ROLE_ACKNOWLEDGMENT_TEXT,
  SYSTEM_ROLE_ACKNOWLEDGMENT_VERSION,
} from '@/lib/ai-liability/system-role-acknowledgment-copy';

export function SystemRoleAcknowledgmentForm({
  clientName,
  signedAt,
  storageAvailable,
}: {
  clientName: string;
  signedAt: string | null;
  storageAvailable: boolean;
}) {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!accepted || submitting || signedAt) return;
    setSubmitting(true);
    setError(null);

    const response = await fetch('/api/ai-liability/system-role-acknowledgment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accepted: true,
        textVersion: SYSTEM_ROLE_ACKNOWLEDGMENT_VERSION,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? 'System role acknowledgment could not be recorded.');
      setSubmitting(false);
      return;
    }

    router.refresh();
  }

  return (
    <section
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
          Tenant admin attestation for {clientName}
        </div>
        <p style={{ margin: 0, color: '#0C1A3A', fontSize: 15, lineHeight: 1.55 }}>
          {SYSTEM_ROLE_ACKNOWLEDGMENT_TEXT}
        </p>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {SYSTEM_ROLE_ACKNOWLEDGMENT_POINTS.map((point) => (
          <div
            key={point}
            style={{
              border: '1px solid rgba(12, 26, 58, 0.12)',
              borderRadius: 8,
              color: '#27324A',
              fontSize: 14,
              lineHeight: 1.5,
              padding: 12,
            }}
          >
            {point}
          </div>
        ))}
      </div>

      {signedAt ? (
        <p
          role="status"
          style={{
            margin: 0,
            border: '1px solid rgba(14, 118, 104, 0.22)',
            borderRadius: 8,
            background: '#F0F7F5',
            color: '#0E7668',
            padding: 12,
            fontSize: 13,
            lineHeight: 1.45,
          }}
        >
          Recorded for this admin on {new Date(signedAt).toLocaleString()}.
        </p>
      ) : null}

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
          The system role ledger is unavailable. The acknowledgment cannot be
          recorded until the ledger is reachable.
        </p>
      )}

      {!signedAt && (
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
            I am authorized to sign this tenant-admin system role acknowledgment
            for {clientName}.
          </span>
        </label>
      )}

      {error && (
        <p role="alert" style={{ margin: 0, color: '#9F3E3B', fontSize: 13 }}>
          {error}
        </p>
      )}

      {!signedAt && (
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
          {submitting ? 'Recording...' : 'Sign acknowledgment'}
        </button>
      )}
    </section>
  );
}
