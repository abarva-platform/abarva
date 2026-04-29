'use client';

// DigestRegenerateButton — on-demand "Regenerate digest" button for the
// admin weekly digest page. Fires GET /api/reasoning/digest/weekly and
// surfaces status inline; shows a "Last generated" timestamp on success.

import { useState } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { WeeklyDigest } from '@/lib/reasoning/weekly-digest';

type Status =
  | { kind: 'idle' }
  | { kind: 'generating' }
  | { kind: 'success'; generatedAt: string }
  | { kind: 'error' };

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

export function DigestRegenerateButton() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  async function handleRegenerate() {
    setStatus({ kind: 'generating' });
    try {
      const res = await fetch('/api/reasoning/digest/weekly', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const digest = (await res.json()) as WeeklyDigest;
      setStatus({ kind: 'success', generatedAt: digest.windowEnd });
    } catch {
      setStatus({ kind: 'error' });
      setTimeout(() => setStatus({ kind: 'idle' }), 5000);
    }
  }

  const isGenerating = status.kind === 'generating';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: SPACING.xs,
      }}
    >
      <button
        type="button"
        disabled={isGenerating}
        onClick={handleRegenerate}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: SPACING.xs,
          background: isGenerating ? `${COLORS.ink}0a` : COLORS.white,
          border: `1px solid ${COLORS.ink}22`,
          borderRadius: RADIUS.lg,
          padding: `${SPACING.sm} ${SPACING.md}`,
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: isGenerating ? `${COLORS.ink}66` : COLORS.ink,
          fontWeight: 600,
          opacity: isGenerating ? 0.7 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            animation: isGenerating ? 'digest-spin 1s linear infinite' : 'none',
          }}
        >
          ↺
        </span>
        <span>{isGenerating ? 'Generating…' : 'Regenerate digest'}</span>
      </button>

      {status.kind === 'success' && (
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.xs,
          }}
        >
          <span>Last generated {formatTimestamp(status.generatedAt)}</span>
          <span aria-hidden="true">·</span>
          <a
            href="/admin/reasoning/digest"
            style={{
              color: COLORS.navy,
              textDecoration: 'underline',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onClick={(e) => {
              e.preventDefault();
              window.location.reload();
            }}
          >
            Reload to see latest
          </a>
        </div>
      )}

      {status.kind === 'error' && (
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: COLORS.coralInk,
            fontWeight: 600,
          }}
        >
          Generation failed
        </div>
      )}

      {/* Keyframe for the spinner — injected once via a style tag */}
      <style>{`
        @keyframes digest-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
