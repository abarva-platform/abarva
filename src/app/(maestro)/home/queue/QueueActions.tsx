'use client';

// Queue row actions · mark a task done. Simple PATCH to /api/tasks.

import { useState } from 'react';

export function QueueActions({ taskId }: { taskId: string }) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');

  async function markDone() {
    if (status === 'submitting' || status === 'done') return;
    setStatus('submitting');
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, done: true }),
      });
      if (!res.ok) {
        setStatus('error');
        return;
      }
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  return (
    <>
      <style>{`
        .qa-btn {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
          padding: 7px 11px; border-radius: 999px;
          border: 1px solid rgba(14,159,140,0.3);
          background: rgba(14,159,140,0.08); color: #0e9f8c;
          cursor: pointer; font-weight: 700; flex-shrink: 0;
        }
        .qa-btn:hover { background: rgba(14,159,140,0.14); }
        .qa-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .qa-done { color: #3FB27F; border-color: rgba(63,178,127,0.3); background: rgba(63,178,127,0.1); }
      `}</style>
      <button
        type="button"
        className={`qa-btn ${status === 'done' ? 'qa-done' : ''}`}
        onClick={markDone}
        disabled={status === 'submitting' || status === 'done'}
        aria-label="Mark task done"
      >
        {status === 'done' ? '✓ Done' : status === 'submitting' ? 'Saving…' : 'Mark done →'}
      </button>
    </>
  );
}
