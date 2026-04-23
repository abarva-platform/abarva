'use client';

// Priority 2 item 1 · approval affordance on rich deliverables. Posts to
// /api/programs/approve which persists to the ledger with Clerk-identified
// approver metadata. After click, UI renders the approved state with
// approver + timestamp · local state only (page refresh pulls from ledger
// via the deliverable page's server fetch — next iteration).

import { useState } from 'react';

interface ApproveActionsProps {
  programCode: string;
  deliverableCode: string;
  phase: number;
  decision: string;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'approved'; approverName: string | null; timestamp: string }
  | { kind: 'error'; message: string };

export function ApproveActions({ programCode, deliverableCode, phase, decision }: ApproveActionsProps) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  async function handleApprove() {
    if (status.kind === 'submitting' || status.kind === 'approved') return;
    setStatus({ kind: 'submitting' });
    try {
      const res = await fetch('/api/programs/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programCode, deliverableCode, phase, decision }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ kind: 'error', message: data.error ?? `HTTP ${res.status}` });
        return;
      }
      setStatus({
        kind: 'approved',
        approverName: data.entry?.approverName ?? 'You',
        timestamp: data.entry?.timestamp ?? new Date().toISOString(),
      });
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'network error' });
    }
  }

  return (
    <>
      <style>{approveCss}</style>
      <div className="apv-actions" role="group" aria-label="Approve decision">
        {status.kind === 'approved' ? (
          <div className="apv-approved">
            <span className="apv-check" aria-hidden="true">✓</span>
            <div className="apv-approved-text">
              <strong>Approved by {status.approverName ?? 'You'}</strong>
              <span>{new Date(status.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
            <span className="apv-pill">Advances program</span>
          </div>
        ) : (
          <>
            <button
              type="button"
              className="apv-btn"
              onClick={handleApprove}
              disabled={status.kind === 'submitting'}
              aria-label="Approve this decision"
            >
              {status.kind === 'submitting' ? 'Approving…' : 'Approve decision →'}
            </button>
            <span className="apv-hint">Logs you as approver · advances program to next phase</span>
            {status.kind === 'error' ? (
              <span className="apv-error">Error: {status.message}</span>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}

const approveCss = `
.apv-actions {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; border-radius: 14px;
  background: rgba(245,197,74,0.12);
  border: 1px solid rgba(245,197,74,0.32);
  font-family: 'DM Sans', -apple-system, sans-serif;
  flex-wrap: wrap;
}
.apv-btn {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
  font-weight: 700;
  padding: 10px 16px; border-radius: 999px;
  border: 1px solid transparent; cursor: pointer;
  background: #F5C54A; color: #1a1612;
  transition: all 0.15s;
}
.apv-btn:hover { background: #e8b931; }
.apv-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.apv-hint { font-size: 12px; color: #6d625a; }
.apv-error { font-size: 12px; color: #b5452f; font-family: 'JetBrains Mono', monospace; }

.apv-approved { display: flex; align-items: center; gap: 12px; width: 100%; }
.apv-check {
  width: 28px; height: 28px; border-radius: 50%;
  background: #3FB27F; color: #FFFFFF;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; flex-shrink: 0;
}
.apv-approved-text { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.apv-approved-text strong { font-size: 13px; color: #1a1612; }
.apv-approved-text span { font-size: 11px; color: #6d625a; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.08em; }
.apv-pill {
  display: inline-block; padding: 4px 10px; border-radius: 999px;
  background: rgba(63,178,127,0.15); color: #2e8560;
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  letter-spacing: 0.1em; text-transform: uppercase; font-weight: 700;
}
@media print { .apv-actions { display: none; } }
`;
