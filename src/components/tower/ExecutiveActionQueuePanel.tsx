// Tower · Slice 3.2 — Executive Action Queue panel.
//
// v1 surface for the executive action queue. Renders a deterministically
// ranked list of the interventions a CXO should act on this week.
//
// Server component (no client state). Matches the locked AbarVa design
// system: cream page background, Fraunces/Georgia serif headers, Inter
// body, restrained ink palette. No new colors or fonts are introduced.

import {
  buildExecutiveActionQueue,
  type ActionSeverity,
  type ExecutiveAction,
  type ExecutiveActionQueue,
} from '@/lib/tower/action-queue/executive-action-queue';

// Tokens mirror the locked Tower palette used across TowerIndexPage.
const C = {
  PAGE_BG: '#F8F7F4',
  CARD: '#ffffff',
  RULE: 'rgba(10,10,11,0.10)',
  INK: '#1A1A18',
  INK_2: '#525866',
  GRAY_DK: '#525866',
  RED: '#a32d2d',
  RED_BG: '#fceded',
  AMBER: '#ba7517',
  AMBER_BG: '#faeeda',
  GREEN: '#1d6b4f',
  GOLD: '#A57C2D',
  SERIF: 'var(--font-fraunces), "Fraunces", Georgia, serif',
  SANS: 'var(--font-inter), "Inter", system-ui, sans-serif',
  MONO: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

const SEVERITY_STYLE: Record<
  ActionSeverity,
  { label: string; ink: string; bg: string }
> = {
  critical: { label: 'Critical', ink: C.RED, bg: C.RED_BG },
  high: { label: 'High', ink: C.AMBER, bg: C.AMBER_BG },
  elevated: { label: 'Elevated', ink: C.AMBER, bg: C.AMBER_BG },
  watch: { label: 'Watch', ink: C.GRAY_DK, bg: '#f1f0ed' },
};

function SeverityChip({ severity }: { severity: ActionSeverity }) {
  const s = SEVERITY_STYLE[severity];
  return (
    <span
      data-testid={`eaq-severity-${severity}`}
      style={{
        fontFamily: C.MONO,
        fontSize: 9.5,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: 8,
        background: s.bg,
        color: s.ink,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  );
}

function ActionRow({ action }: { action: ExecutiveAction }) {
  return (
    <li
      data-testid={`eaq-action-${action.id}`}
      style={{
        listStyle: 'none',
        background: C.CARD,
        border: `1px solid ${C.RULE}`,
        borderRadius: 10,
        padding: '16px 18px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
          flexWrap: 'wrap',
        }}
      >
        <SeverityChip severity={action.severity} />
        <span
          style={{
            fontFamily: C.MONO,
            fontSize: 9.5,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: C.GRAY_DK,
          }}
        >
          {action.triggerLabel}
        </span>
      </div>

      <div
        style={{
          fontFamily: C.SERIF,
          fontSize: 16,
          fontWeight: 400,
          color: C.INK,
          lineHeight: 1.25,
          marginBottom: 6,
        }}
      >
        {action.initiative}
      </div>

      <p
        style={{
          margin: '0 0 8px',
          fontFamily: C.SANS,
          fontSize: 12.5,
          lineHeight: 1.5,
          color: C.INK_2,
        }}
      >
        {action.condition}
      </p>

      <p
        style={{
          margin: '0 0 10px',
          fontFamily: C.SANS,
          fontSize: 12.5,
          fontStyle: 'italic',
          lineHeight: 1.5,
          color: C.GRAY_DK,
        }}
      >
        {action.whyItMatters}
      </p>

      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'baseline',
          paddingTop: 10,
          borderTop: `1px solid ${C.RULE}`,
        }}
      >
        <span
          aria-hidden
          style={{ fontFamily: C.MONO, fontSize: 12, color: C.GOLD, fontWeight: 700 }}
        >
          →
        </span>
        <span
          style={{
            fontFamily: C.SANS,
            fontSize: 12.5,
            fontWeight: 600,
            lineHeight: 1.5,
            color: C.INK,
          }}
        >
          {action.impliedAction}
        </span>
      </div>
    </li>
  );
}

interface ExecutiveActionQueuePanelProps {
  /** Pre-built queue. Defaults to the canonical ledger-derived queue. */
  queue?: ExecutiveActionQueue;
}

/**
 * Executive Action Queue panel — v1.
 *
 * Renders the ranked queue of interventions a CXO should act on this
 * week. Order is whatever `buildExecutiveActionQueue` produced; this
 * component never re-sorts, so the deterministic ordering contract is
 * preserved end-to-end.
 */
export function ExecutiveActionQueuePanel({
  queue = buildExecutiveActionQueue(),
}: ExecutiveActionQueuePanelProps = {}) {
  return (
    <section
      data-testid="tower-executive-action-queue"
      style={{
        margin: '0 32px',
        padding: '20px 22px',
        background: C.PAGE_BG,
        border: `1px solid ${C.RULE}`,
        borderRadius: 12,
      }}
    >
      <div
        style={{
          fontFamily: C.MONO,
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          fontWeight: 700,
          color: C.GOLD,
          marginBottom: 4,
        }}
      >
        Executive action queue
      </div>
      <h2
        style={{
          margin: '0 0 14px',
          fontFamily: C.SERIF,
          fontSize: 19,
          fontWeight: 400,
          lineHeight: 1.2,
          color: C.INK,
        }}
        data-testid="tower-eaq-headline"
      >
        {queue.headline}
      </h2>

      {queue.actions.length === 0 ? (
        <p
          style={{
            margin: 0,
            fontFamily: C.SANS,
            fontSize: 13,
            color: C.GREEN,
          }}
        >
          Every tracked initiative is earning at or above projection. Nothing
          needs an executive decision this cycle.
        </p>
      ) : (
        <ul
          role="list"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            margin: 0,
            padding: 0,
          }}
        >
          {queue.actions.map((action) => (
            <ActionRow key={action.id} action={action} />
          ))}
        </ul>
      )}

      <p
        style={{
          margin: '14px 0 0',
          fontFamily: C.SANS,
          fontSize: 11,
          fontStyle: 'italic',
          lineHeight: 1.5,
          color: C.GRAY_DK,
        }}
      >
        {queue.disclaimer}
      </p>
    </section>
  );
}
