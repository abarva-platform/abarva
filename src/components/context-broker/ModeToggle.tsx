'use client';

/**
 * ModeToggle · CB-6
 *
 * The 4-mode toggle (Generic / Corpus / Tenant / Full) that sits
 * in the chat surface and lets the user switch which retrieval
 * profile grounds the next answer. The active mode is stored as
 * a per-surface preference via AtlasPageStateProvider; on change,
 * the next chat turn passes `surfaceContext.contextBundleMode` to
 * `/api/chat/agent`, which prefers that value over its
 * surface-default.
 *
 * Per CONTEXT_BROKER_DESIGN.md §4. Buttons:
 *   - Generic — model only
 *   - Corpus  — pattern catalog only
 *   - Tenant  — tenant data only
 *   - Full    — everything
 *
 * Tenant and Full are disabled (with a tooltip) when no
 * `tenantKey` is available so we don't post a request the broker
 * will reject with `MissingTenantKeyError`.
 */

import type { CSSProperties } from 'react';
import type { BrokerMode } from '@/lib/knowledge/context-broker';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

export interface ModeToggleProps {
  /** Current mode. `null` renders no button highlighted. */
  mode: BrokerMode | null;
  /** Called when the user picks a new mode. */
  onChange: (mode: BrokerMode) => void;
  /**
   * Subset of modes that are reachable in the current auth state.
   * Modes outside this set render as disabled buttons with a
   * tooltip explaining why. When omitted, all four are available.
   */
  availableModes?: ReadonlyArray<BrokerMode>;
  /** Visual override — caller can pass a small style object. */
  style?: CSSProperties;
}

const ALL_MODES: ReadonlyArray<{ mode: BrokerMode; label: string; description: string }> = [
  { mode: 'generic', label: 'Generic', description: 'Model only — no retrieval' },
  { mode: 'corpus', label: 'Corpus', description: 'AbarVa pattern catalog only' },
  { mode: 'tenant', label: 'Tenant', description: 'Your data only — no patterns' },
  { mode: 'full', label: 'Full', description: 'Patterns + your data' },
];

const DISABLED_TOOLTIP =
  'Sign in and select a tenant to enable this mode.';

export function ModeToggle({
  mode,
  onChange,
  availableModes,
  style,
}: ModeToggleProps) {
  const available = availableModes ?? ALL_MODES.map((m) => m.mode);
  return (
    <div
      data-testid="mode-toggle"
      role="radiogroup"
      aria-label="Context retrieval mode"
      style={{
        display: 'inline-flex',
        gap: SPACING.xs,
        padding: 2,
        background: COLORS.cream,
        border: `1px solid ${COLORS.ink}11`,
        borderRadius: RADIUS.pill,
        fontFamily: TYPOGRAPHY.mono,
        ...(style ?? {}),
      }}
    >
      {ALL_MODES.map((m) => {
        const isActive = mode === m.mode;
        const isDisabled = !available.includes(m.mode);
        return (
          <button
            key={m.mode}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-disabled={isDisabled}
            disabled={isDisabled}
            data-testid={`mode-toggle-${m.mode}`}
            data-active={isActive ? 'true' : 'false'}
            data-disabled={isDisabled ? 'true' : 'false'}
            title={isDisabled ? DISABLED_TOOLTIP : m.description}
            onClick={isDisabled ? undefined : () => onChange(m.mode)}
            style={buttonStyle(isActive, isDisabled)}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

function buttonStyle(isActive: boolean, isDisabled: boolean): CSSProperties {
  if (isDisabled) {
    return {
      fontFamily: TYPOGRAPHY.mono,
      fontSize: 10,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      fontWeight: 700,
      padding: `4px ${SPACING.sm}`,
      borderRadius: RADIUS.pill,
      border: '1px solid transparent',
      background: 'transparent',
      color: `${COLORS.ink}55`,
      cursor: 'not-allowed',
    };
  }
  if (isActive) {
    return {
      fontFamily: TYPOGRAPHY.mono,
      fontSize: 10,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      fontWeight: 700,
      padding: `4px ${SPACING.sm}`,
      borderRadius: RADIUS.pill,
      border: `1px solid ${COLORS.navy}33`,
      background: COLORS.white,
      color: COLORS.navy,
      cursor: 'pointer',
      boxShadow: `0 1px 2px ${COLORS.ink}11`,
    };
  }
  return {
    fontFamily: TYPOGRAPHY.mono,
    fontSize: 10,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 700,
    padding: `4px ${SPACING.sm}`,
    borderRadius: RADIUS.pill,
    border: '1px solid transparent',
    background: 'transparent',
    color: `${COLORS.ink}99`,
    cursor: 'pointer',
  };
}

/**
 * Helper: derive `availableModes` for a surface given auth state.
 * Mirrors `inferModeForSurface` (server-side) so the disabled
 * states match the route's accept set.
 */
export function availableModesFor(input: {
  hasTenantKey: boolean;
}): ReadonlyArray<BrokerMode> {
  if (input.hasTenantKey) return ['generic', 'corpus', 'tenant', 'full'];
  return ['generic', 'corpus'];
}
