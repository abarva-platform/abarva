// Intelligence v3 · Sessions stage.
//
// "Persistent thinking sessions that can become Move evidence." For
// v1 the substrate doesn't yet exist (no ai_intel_sessions table) so
// this canvas surfaces:
//   1. The current Sentinel exploration as an inline session card
//   2. A "Save as named session" affordance (placeholder until the
//      session-persistence table lands)
//   3. The chat-mode preference state — visible reminder that the
//      user's lens choice is preserved across navigation
// Once the persistence layer ships, the empty state replaces with
// a list of named sessions.

import { COLORS, FONT, BORDER, SPACING, RADIUS } from '@/lib/design/abarva-theme';
import type { IntelligenceV3PageData } from './types';

interface Props {
  data: IntelligenceV3PageData;
}

export function SessionsCanvas({ data }: Props) {
  return (
    <section
      id="stage-panel-sessions"
      role="tabpanel"
      style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}
    >
      <SectionHeader>Sessions · persistent threads that can become Move evidence</SectionHeader>
      <p style={{ fontFamily: FONT.body, fontSize: 12, color: COLORS.muted, margin: 0 }}>
        Working threads in this exploration. Save a session to revisit later
        or to attach as evidence when shaping a Move.
      </p>

      {/* Active session — derived from current page state */}
      <article
        style={{
          border: BORDER.hairline,
          borderLeft: `3px solid ${COLORS.amber}`,
          background: COLORS.card,
          borderRadius: RADIUS.md,
          padding: SPACING.lg,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            flexWrap: 'wrap',
            gap: SPACING.sm,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 9,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: COLORS.amber,
                fontWeight: 700,
              }}
            >
              Active session · unsaved
            </div>
            <h3
              style={{
                fontFamily: FONT.body,
                fontSize: 16,
                fontWeight: 600,
                color: COLORS.ink,
                margin: 0,
                marginTop: 2,
              }}
            >
              {data.conversationContext.activeThread}
            </h3>
            <div
              style={{
                fontFamily: FONT.body,
                fontSize: 12,
                color: COLORS.muted,
                marginTop: 2,
              }}
            >
              Layer focused: {data.conversationContext.layerFocus} · scope:{' '}
              {data.tenantName} · this page
            </div>
          </div>
          <button
            type="button"
            disabled
            title="Session persistence ships in a follow-up wave"
            style={{
              fontFamily: FONT.body,
              fontSize: 13,
              fontWeight: 600,
              padding: `${SPACING.xs}px ${SPACING.lg}px`,
              borderRadius: RADIUS.pill,
              background: COLORS.surface2,
              color: COLORS.muted,
              border: `1px solid ${COLORS.border}`,
              cursor: 'not-allowed',
              whiteSpace: 'nowrap',
            }}
          >
            Save as named session
          </button>
        </div>
      </article>

      {/* Saved sessions placeholder */}
      <div
        style={{
          border: `1px dashed ${COLORS.border}`,
          borderRadius: RADIUS.md,
          padding: SPACING.xl,
          background: COLORS.surface,
        }}
      >
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 9,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: COLORS.muted,
            marginBottom: SPACING.xs,
          }}
        >
          Saved sessions
        </div>
        <p style={{ fontFamily: FONT.body, fontSize: 13, color: COLORS.body, margin: 0, lineHeight: 1.55 }}>
          No saved sessions yet for {data.tenantName}. The persistence layer
          ships in the next substrate wave — once it lands, named sessions
          accumulate here, are exportable, and can be attached as evidence
          when shaping a Strategic Move.
        </p>
      </div>
    </section>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        background: COLORS.navyDark,
        color: COLORS.surface,
        padding: `${SPACING.sm}px ${SPACING.md}px`,
        fontFamily: FONT.body,
        fontSize: 13,
        fontWeight: 600,
        margin: 0,
        borderLeft: `3px solid ${COLORS.amber}`,
        borderRadius: `${RADIUS.sm}px ${RADIUS.sm}px 0 0`,
      }}
    >
      {children}
    </h2>
  );
}
