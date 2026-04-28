// AgentHiddenDrawer.tsx — ACT3
//
// Dedicated server component for the Agent Activity Hidden Drawer variant.
// Renders a persistent collapsed drawer trigger bar that surfaces agent
// mission activity and AI portfolio context without requiring a live runtime.
//
// Design rules (AbarVa File 16):
//   - Calm, mostly white / off-white surfaces.
//   - Navy accent only (no red/amber unless a priority warrant is shown).
//   - No avatars, no icons larger than 16×16, no emoji.
//   - Honest disclaimer always visible.
//   - Server component only — no client directive, no React hooks.

import {
  BORDER,
  COLORS,
  FONT,
  RADIUS,
  SPACING,
} from '@/lib/design/abarva-theme';
import { AgentBadge } from '@/components/abarva/AgentBadge';
import {
  buildAgentHiddenDrawerView,
  type AgentHiddenDrawerView,
} from '@/lib/agent/agent-hidden-drawer-view';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AgentHiddenDrawerProps {
  /** Pre-built view. When omitted the deterministic seed view is used. */
  view?: AgentHiddenDrawerView;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AgentDot({ isActive }: { isActive: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: RADIUS.pill,
        background: isActive ? COLORS.navy : COLORS.border,
        flex: '0 0 auto',
      }}
    />
  );
}

function PriorityBadge({ label }: { label: string }) {
  const isCritical = label.includes('Critical');
  const isHigh = label.includes('High');
  const fg = isCritical ? COLORS.red : isHigh ? COLORS.navy : COLORS.muted;
  const bg = isCritical ? COLORS.redSoft : isHigh ? COLORS.navySoft : COLORS.surface2;
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: FONT.mono,
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color: fg,
        background: bg,
        borderRadius: RADIUS.pill,
        paddingTop: 2,
        paddingBottom: 2,
        paddingLeft: 7,
        paddingRight: 7,
        flex: '0 0 auto',
      }}
    >
      {label}
    </span>
  );
}

function HonestNote({ text }: { text: string }) {
  return (
    <span
      style={{
        fontFamily: FONT.mono,
        fontSize: 9,
        letterSpacing: '0.06em',
        color: COLORS.mutedSoft,
        flex: '0 0 auto',
      }}
    >
      {text}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AgentHiddenDrawer({ view: viewProp }: AgentHiddenDrawerProps) {
  const view = viewProp ?? buildAgentHiddenDrawerView();

  return (
    <section
      data-agent-hidden-drawer="act3"
      data-drawer-state={view.drawerState}
      aria-label="Agent activity drawer"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.md,
        background: COLORS.card,
        border: BORDER.hairline,
        borderRadius: RADIUS.md,
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.sm,
        paddingLeft: SPACING.md,
        paddingRight: SPACING.md,
        fontFamily: FONT.body,
        color: COLORS.body,
        flexWrap: 'wrap',
      }}
    >
      {/* Active indicator dot */}
      <AgentDot isActive={view.activeAgents.length > 0} />

      {/* Mission count */}
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: COLORS.muted,
          flex: '0 0 auto',
        }}
      >
        {view.triggerLabel}
      </span>

      {/* Priority badge */}
      {view.highestPriorityLabel && (
        <PriorityBadge label={view.highestPriorityLabel} />
      )}

      {/* Per-agent badges (active agents only) */}
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.xs,
          flex: '0 0 auto',
        }}
      >
        {view.agentSummaries
          .filter((s) => s.isActive)
          .map((s) => (
            <AgentBadge key={s.agent} agent={s.agent} />
          ))}
      </span>

      {/* Portfolio context */}
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 9,
          letterSpacing: '0.06em',
          color: COLORS.mutedSoft,
          flex: '0 0 auto',
        }}
      >
        {view.portfolioContext.activeUseCases} of{' '}
        {view.portfolioContext.totalInventory} portfolio items active
      </span>

      {/* Spacer */}
      <span style={{ flex: '1 1 auto' }} aria-hidden="true" />

      {/* Deferred open note */}
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 9,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
          flex: '0 0 auto',
        }}
      >
        drawer collapsed · open deferred
      </span>

      {/* Honest disclaimer */}
      <HonestNote text={view.honestDisclaimer} />
    </section>
  );
}
