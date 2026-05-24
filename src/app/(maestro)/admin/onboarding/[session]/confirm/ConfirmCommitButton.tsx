'use client';

import { useState } from 'react';

type Props = {
  sessionId: string;
  disabled: boolean;
};

export function ConfirmCommitButton({ sessionId, disabled }: Props) {
  const [state, setState] = useState<'idle' | 'committing' | 'committed' | 'failed'>('idle');
  const [message, setMessage] = useState<string>('');

  async function commit() {
    setState('committing');
    setMessage('');
    const response = await fetch(`/api/onboarding/${sessionId}/commit`, { method: 'POST' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.ok) {
      setState('failed');
      setMessage(body.detail ?? body.error ?? 'Commit failed');
      return;
    }
    setState('committed');
    setMessage('Committed to the Apex enterprise context tables. Embeddings remain a separate post-commit job.');
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <button
        type="button"
        onClick={commit}
        disabled={disabled || state === 'committing' || state === 'committed'}
        style={{
          width: 'fit-content',
          border: 0,
          borderRadius: 6,
          background: disabled ? '#9CA3AF' : '#111827',
          color: '#FFFFFF',
          fontWeight: 700,
          padding: '10px 16px',
          cursor: disabled || state === 'committing' || state === 'committed' ? 'not-allowed' : 'pointer',
        }}
      >
        {state === 'committing' ? 'Committing...' : state === 'committed' ? 'Committed' : 'Commit validated pack'}
      </button>
      {message ? (
        <div style={{ color: state === 'failed' ? '#B91C1C' : '#047857', fontSize: 13, fontWeight: 600 }}>
          {message}
        </div>
      ) : null}
    </div>
  );
}
