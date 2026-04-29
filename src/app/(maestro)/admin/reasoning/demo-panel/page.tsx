'use client';

import { useState, useCallback } from 'react';
import { SCENARIOS, type ScenarioDescriptor } from '@/app/api/reasoning/demo-scenarios/route';
import { SHELL } from '@/lib/shell/shell-tokens';

type ResultState = Record<string, 'success' | 'error'>;

// ─── Card border accent per scenario ─────────────────────────────────────────

const CARD_ACCENT: Record<string, string> = {
  'green-path': SHELL.MINT_LINE,
  'red-alert': '#c9826a', // subtle rust
  'mid-review': SHELL.PEACH_LINE,
};

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        animation: 'spin 0.9s linear infinite',
        fontSize: 14,
        lineHeight: 1,
      }}
    >
      ⟳
    </span>
  );
}

// ─── ScenarioCard ─────────────────────────────────────────────────────────────

function ScenarioCard({
  scenario,
  isRunning,
  anyRunning,
  result,
  onRun,
}: {
  scenario: ScenarioDescriptor;
  isRunning: boolean;
  anyRunning: boolean;
  result: 'success' | 'error' | null;
  onRun: (id: string) => void;
}) {
  const borderColor = CARD_ACCENT[scenario.id] ?? SHELL.CARD_LINE;

  function handleRun() {
    onRun(scenario.id);
  }

  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1.5px solid ${borderColor}`,
        borderRadius: 10,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Name */}
      <div
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 15,
          fontWeight: 700,
          color: SHELL.INK,
          letterSpacing: '-0.01em',
        }}
      >
        {scenario.name}
      </div>

      {/* Description */}
      <p
        style={{
          margin: 0,
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.INK_SOFT,
          lineHeight: 1.55,
        }}
      >
        {scenario.description}
      </p>

      {/* Actions list */}
      <ul
        style={{
          margin: 0,
          paddingLeft: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {scenario.actions.map((action) => (
          <li
            key={action}
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.INK_MUTED,
              lineHeight: 1.45,
            }}
          >
            {action}
          </li>
        ))}
      </ul>

      {/* Button row */}
      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          type="button"
          disabled={anyRunning}
          onClick={handleRun}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            background: anyRunning ? SHELL.GRAY_BG : SHELL.INK,
            color: anyRunning ? SHELL.GRAY_TEXT : SHELL.CARD_WHITE,
            border: 'none',
            borderRadius: 6,
            padding: '8px 16px',
            fontFamily: SHELL.SANS,
            fontSize: 13,
            fontWeight: 600,
            cursor: anyRunning ? 'not-allowed' : 'pointer',
            letterSpacing: '0.01em',
            transition: 'background 0.15s',
          }}
        >
          {isRunning ? (
            <>
              <Spinner /> Running…
            </>
          ) : (
            'Run scenario'
          )}
        </button>

        {/* Result feedback */}
        {result === 'success' && (
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.MINT_TEXT,
              lineHeight: 1.4,
            }}
          >
            ✓ Applied — reload any reasoning page to see changes
          </div>
        )}
        {result === 'error' && (
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.RUST_TEXT,
              lineHeight: 1.4,
            }}
          >
            ✗ Failed — check server logs
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoPanelPage() {
  const [runningId, setRunningId] = useState<string | null>(null);
  const [resultMap, setResultMap] = useState<ResultState>({});

  const handleRun: (id: string) => void = useCallback(
    async (id: string) => {
      if (runningId !== null) return;

      setRunningId(id);
      // Clear any prior result for this card so the feedback zone resets.
      setResultMap((prev: ResultState) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      try {
        const res = await fetch('/api/reasoning/demo-scenarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenarioId: id }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        setResultMap((prev: ResultState) => ({ ...prev, [id]: 'success' }));
      } catch {
        setResultMap((prev: ResultState) => ({ ...prev, [id]: 'error' }));
      } finally {
        setRunningId(null);
        // Auto-clear the result badge after 3 seconds.
        setTimeout(() => {
          setResultMap((prev: ResultState) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        }, 3000);
      }
    },
    [runningId],
  );

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
      }}
    >
      {/* Page title */}
      <div>
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          Reasoning · Admin
        </div>
        <h1
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 28,
            fontWeight: 700,
            color: SHELL.INK,
            margin: 0,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          Demo panel
        </h1>
        <p
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 14,
            color: SHELL.INK_SOFT,
            marginTop: 8,
            marginBottom: 0,
            lineHeight: 1.55,
          }}
        >
          Trigger pre-built demo scenarios to configure in-memory reasoning state.
        </p>
      </div>

      {/* Warning banner */}
      <div
        role="alert"
        style={{
          background: SHELL.PEACH_BG,
          border: `1px solid ${SHELL.PEACH_LINE}`,
          borderRadius: 8,
          padding: '12px 18px',
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.PEACH_TEXT,
          lineHeight: 1.5,
        }}
      >
        ⚠️ Demo only — all state is in-memory and resets on server restart
      </div>

      {/* Scenario grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20,
        }}
      >
        {Array.from(SCENARIOS).map((scenario) => {
          const cardResult = (resultMap[scenario.id] as 'success' | 'error' | undefined) ?? null;
          return (
            <div key={scenario.id}>
              <ScenarioCard
                scenario={scenario}
                isRunning={runningId === scenario.id}
                anyRunning={runningId !== null}
                result={cardResult}
                onRun={handleRun}
              />
            </div>
          );
        })}
      </div>

      {/* Keyframe for spinner */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
