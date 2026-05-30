'use client';

// Tower decide-and-route action row — Fund / Pause / Kill buttons.
//
// Pure client component. Posts to `/api/tower/decision`, which writes
// through the existing `writeProgramAuditLog` pattern (no new logger).
// AbarVa locked palette only: black for the primary action, ghost
// (transparent + ink border) for the rest. Disabled visually while
// posting; the row stays inline below the portfolio card.
//
// State is intentionally local: this row is a decision *signal* surface
// for Tower. The deeper engagement-lifecycle write (Move kill, pause
// timer, fund commit) lives in Programs and is a future follow-up.

import { useCallback, useState } from 'react';
import type { CSSProperties } from 'react';

type DecisionAction = 'fund' | 'pause' | 'kill';

interface Props {
  programId: string;
  subjectLabel?: string;
}

const INK = '#1A1A18';
const RULE = 'rgba(10,10,11,0.12)';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const ACTIONS: ReadonlyArray<{
  key: DecisionAction;
  label: string;
  primary: boolean;
}> = [
  { key: 'fund', label: 'Fund', primary: true },
  { key: 'pause', label: 'Pause', primary: false },
  { key: 'kill', label: 'Kill', primary: false },
];

function buttonStyle(primary: boolean, disabled: boolean): CSSProperties {
  return {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    fontWeight: 700,
    padding: '6px 12px',
    borderRadius: 6,
    border: `1px solid ${INK}`,
    background: primary ? INK : 'transparent',
    color: primary ? '#ffffff' : INK,
    cursor: disabled ? 'wait' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    transition: 'opacity 120ms ease',
  };
}

export function TowerDecisionActionRow({ programId, subjectLabel }: Props) {
  const [pending, setPending] = useState<DecisionAction | null>(null);
  const [status, setStatus] = useState<
    { ok: true; action: DecisionAction } | { ok: false; message: string } | null
  >(null);

  const onClick = useCallback(
    async (action: DecisionAction) => {
      if (pending) return;
      const rationale =
        action === 'kill'
          ? window.prompt(
              `Confirm KILL for ${subjectLabel ?? programId}. Add a short rationale:`,
              '',
            )
          : null;
      if (action === 'kill' && (rationale === null || rationale.trim() === '')) {
        // user cancelled or left rationale blank — no-op.
        return;
      }
      setPending(action);
      setStatus(null);
      try {
        const res = await fetch('/api/tower/decision', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ programId, action, rationale: rationale ?? null }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          setStatus({ ok: false, message: body.error ?? `http_${res.status}` });
        } else {
          setStatus({ ok: true, action });
        }
      } catch (err) {
        setStatus({
          ok: false,
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        setPending(null);
      }
    },
    [pending, programId, subjectLabel],
  );

  return (
    <div
      data-testid="tower-decision-row"
      data-program-id={programId}
      style={{
        marginTop: 11,
        paddingTop: 11,
        borderTop: `1px dashed ${RULE}`,
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <span
        style={{
          fontFamily: MONO,
          fontSize: 9,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontWeight: 700,
          color: '#5b5148',
        }}
      >
        Decide
      </span>
      {ACTIONS.map((a) => (
        <button
          type="button"
          key={a.key}
          data-testid={`tower-decision-${a.key}`}
          onClick={() => onClick(a.key)}
          disabled={pending !== null}
          style={buttonStyle(a.primary, pending !== null)}
        >
          {pending === a.key ? `${a.label}…` : a.label}
        </button>
      ))}
      {status?.ok ? (
        <span
          style={{
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: '#1d6b4f',
            fontWeight: 700,
          }}
          role="status"
        >
          Logged · {status.action}
        </span>
      ) : null}
      {status && !status.ok ? (
        <span
          style={{
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: '#a32d2d',
            fontWeight: 700,
          }}
          role="alert"
        >
          {status.message}
        </span>
      ) : null}
    </div>
  );
}
