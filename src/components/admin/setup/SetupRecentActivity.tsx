/**
 * SetupRecentActivity · SETUP-1.2
 *
 * Activity feed shown alongside the three Acts. Sourced from the
 * live audit log when present, falls back to authored events.
 *
 * Per SETUP-1_DETAILED_DESIGN.md §6.5.
 */

import type { SetupActivityEvent } from '@/lib/admin/setup-acts-registry';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

import { SetupActHeader } from './SetupActOne';

export interface SetupRecentActivityProps {
  events: SetupActivityEvent[];
}

export function SetupRecentActivity({ events }: SetupRecentActivityProps) {
  return (
    <section
      data-testid="admin-setup-activity"
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}11`,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
      }}
    >
      <SetupActHeader
        eyebrow="Recent activity"
        title="What changed in the last few days"
        subtitle="Imports, agent-detected signals, and human reviews — the audit log surfaces here so the admin sees the substrate evolving."
      />
      {events.length === 0 ? (
        <p
          data-testid="admin-setup-empty"
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 14,
            color: `${COLORS.ink}aa`,
            fontStyle: 'italic',
          }}
        >
          No activity yet. Activity events will appear once data is uploaded or agents start grounding the corpus.
        </p>
      ) : (
        <ol
          data-testid="admin-setup-activity-list"
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.sm,
          }}
        >
          {events.map((event, i) => (
            <li
              key={`${event.actor}-${i}`}
              role="listitem"
              data-testid={`admin-setup-activity-event-${i}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr 100px',
                gap: SPACING.sm,
                paddingBottom: SPACING.sm,
                borderBottom: i === events.length - 1 ? 'none' : `1px solid ${COLORS.ink}0d`,
                alignItems: 'baseline',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  color: COLORS.navy,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {event.actor}
              </p>
              <p
                style={{
                  margin: 0,
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  color: COLORS.ink,
                  lineHeight: 1.45,
                }}
              >
                {event.what}
              </p>
              <p
                style={{
                  margin: 0,
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 10,
                  color: `${COLORS.ink}88`,
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                }}
              >
                {event.timestamp}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
