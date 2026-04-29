'use client';

// DemoScenarioPanel — one-click pre-scripted demo state for presenters.
//
// Renders a row of 3 scenario cards (green-path / red-alert / mid-review).
// Each card has a color accent, description, and a "Load →" button.
// On load: POSTs to /api/reasoning/demo-scenarios, shows spinner, then
// "Scenario loaded ✓" with a "Reset all →" link to /api/reasoning/demo-reset.

import { useState } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScenarioConfig {
  id: string;
  name: string;
  description: string;
  /** Top border accent color — drawn from design tokens only. */
  accentBg: string;
  accentText: string;
  accentBorder: string;
}

type CardStatus = 'idle' | 'loading' | 'success' | 'error';

// ─── Scenario definitions (static — mirrors route.ts SCENARIOS) ───────────────

const SCENARIO_CONFIGS: ScenarioConfig[] = [
  {
    id: 'green-path',
    name: 'Green path',
    description:
      'Advance AMS event to BAFO stage, waive all unmet gates, and resolve all contradictions — everything healthy.',
    accentBg: COLORS.mintSoft,
    accentText: COLORS.mintInk,
    accentBorder: COLORS.mintInk,
  },
  {
    id: 'red-alert',
    name: 'Red alert',
    description:
      'Set AMS event back to RFI stage and surface 3+ high-severity contradictions — portfolio health critical.',
    accentBg: COLORS.coralSoft,
    accentText: COLORS.coralInk,
    accentBorder: COLORS.coralInk,
  },
  {
    id: 'mid-review',
    name: 'Mid-review',
    description:
      'Set AMS event to RFP stage, waive 2 gates, leave 2 unmet, and keep 1 contradiction active — realistic mid-cycle.',
    accentBg: COLORS.amberSoft,
    accentText: COLORS.amberInk,
    accentBorder: COLORS.amberInk,
  },
];

// ─── ScenarioCard ─────────────────────────────────────────────────────────────

function ScenarioCard({ config }: { config: ScenarioConfig }) {
  const [status, setStatus] = useState<CardStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleLoad() {
    setStatus('loading');
    setErrorMsg(null);
    try {
      const res = await fetch('/api/reasoning/demo-scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: config.id }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      setStatus('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
      setTimeout(() => {
        setStatus('idle');
        setErrorMsg(null);
      }, 4000);
    }
  }

  async function handleReset() {
    try {
      await fetch('/api/reasoning/demo-reset', { method: 'POST' });
    } catch {
      // best-effort
    }
    setStatus('idle');
  }

  const isLoading = status === 'loading';

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderTop: `3px solid ${config.accentBorder}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
        flex: '1 1 0',
        minWidth: 200,
      }}
    >
      {/* Accent label */}
      <div
        style={{
          display: 'inline-flex',
          alignSelf: 'flex-start',
          background: config.accentBg,
          color: config.accentText,
          borderRadius: RADIUS.pill,
          padding: '3px 10px',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        {config.name}
      </div>

      {/* Description */}
      <p
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: `${COLORS.ink}bb`,
          lineHeight: 1.5,
          margin: 0,
          flexGrow: 1,
        }}
      >
        {config.description}
      </p>

      {/* Footer: button or status */}
      {status === 'success' ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: SPACING.sm,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: COLORS.mintInk,
              fontWeight: 600,
            }}
          >
            Scenario loaded ✓
          </span>
          <button
            type="button"
            onClick={() => void handleReset()}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              textDecoration: 'underline',
            }}
          >
            Reset all →
          </button>
        </div>
      ) : status === 'error' ? (
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: COLORS.coralInk,
            fontWeight: 600,
          }}
        >
          {errorMsg ?? 'Failed to load scenario'}
        </span>
      ) : (
        <button
          type="button"
          disabled={isLoading}
          onClick={() => void handleLoad()}
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: COLORS.white,
            border: `1px solid ${config.accentBorder}`,
            borderRadius: RADIUS.lg,
            padding: `${SPACING.xs} ${SPACING.md}`,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: config.accentText,
            fontWeight: 600,
            opacity: isLoading ? 0.6 : 1,
            transition: 'opacity 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {isLoading ? 'Loading scenario…' : 'Load →'}
        </button>
      )}
    </div>
  );
}

// ─── DemoScenarioPanel ────────────────────────────────────────────────────────

export function DemoScenarioPanel() {
  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}10`,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 20,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Demo scenario presets
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Load pre-scripted state with one click — in-memory only, resets on server restart
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {SCENARIO_CONFIGS.length} scenario{SCENARIO_CONFIGS.length === 1 ? '' : 's'}
        </span>
      </header>

      <div
        style={{
          display: 'flex',
          gap: SPACING.md,
          padding: SPACING.md,
          flexWrap: 'wrap',
        }}
      >
        {SCENARIO_CONFIGS.map((config) => (
          <ScenarioCard key={config.id} config={config} />
        ))}
      </div>
    </section>
  );
}
