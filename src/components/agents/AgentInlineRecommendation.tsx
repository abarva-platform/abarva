// AgentInlineRecommendation.tsx — ACT2
//
// Standalone server component for the Agent Activity Inline Recommendation
// variant. Renders the top agent recommendation inline in a page body —
// suitable for embedding next to program cards, deliverable rows, or evidence
// panels. Shows all 4 per-agent recommendations in a compact stacked list.
//
// Design rules (AbarVa File 16):
//   - Calm, mostly white / off-white surfaces.
//   - Navy left-border accent on the card.
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
  buildAgentInlineRecommendationView,
  type AgentInlineRecommendationView,
  type InlineRecommendationItem,
} from '@/lib/agent/agent-inline-recommendation-view';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AgentInlineRecommendationProps {
  /** Pre-built view. When omitted the deterministic seed view is used. */
  view?: AgentInlineRecommendationView;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RecommendationRow({ item }: { item: InlineRecommendationItem }) {
  const accentColor = item.isUrgent ? COLORS.navy : COLORS.border;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xs,
        borderLeft: `2px solid ${accentColor}`,
        paddingLeft: SPACING.sm,
        paddingTop: SPACING.xs,
        paddingBottom: SPACING.xs,
      }}
    >
      {/* Header row: agent badge + priority + type */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.xs,
          flexWrap: 'wrap',
        }}
      >
        <AgentBadge agent={item.mission.agent} status={item.mission.type.replace(/_/g, ' ')} />
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: item.isUrgent ? COLORS.navy : COLORS.muted,
          }}
        >
          {item.priorityLabel}
        </span>
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 9,
            letterSpacing: '0.06em',
            color: COLORS.mutedSoft,
          }}
        >
          {item.stateLabel}
        </span>
      </div>

      {/* Rationale (clamped to 1 line) */}
      <p
        style={{
          margin: 0,
          fontSize: 12,
          color: COLORS.body,
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 1,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {item.mission.rationale}
      </p>

      {/* Recommended action */}
      <div
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: COLORS.ink,
          lineHeight: 1.4,
        }}
      >
        {item.mission.recommendedAction}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <p style={{ margin: 0, fontSize: 13, color: COLORS.muted }}>
      No agent recommendations right now.
    </p>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AgentInlineRecommendation({
  view: viewProp,
}: AgentInlineRecommendationProps) {
  const view = viewProp ?? buildAgentInlineRecommendationView();

  return (
    <section
      data-agent-inline-recommendation="act2"
      aria-label={view.sectionLabel}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
        background: COLORS.card,
        border: BORDER.hairline,
        borderLeft: `3px solid ${COLORS.navy}`,
        borderRadius: RADIUS.md,
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.sm,
        paddingLeft: SPACING.md,
        paddingRight: SPACING.md,
        fontFamily: FONT.body,
        color: COLORS.body,
      }}
    >
      {/* Section heading */}
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: COLORS.muted,
        }}
      >
        {view.sectionLabel}
        {view.hasUrgentRecommendation && (
          <span
            style={{
              marginLeft: SPACING.xs,
              background: COLORS.navySoft,
              color: COLORS.navy,
              borderRadius: RADIUS.pill,
              paddingTop: 1,
              paddingBottom: 1,
              paddingLeft: 6,
              paddingRight: 6,
              fontSize: 9,
            }}
          >
            urgent
          </span>
        )}
      </div>

      {/* Recommendation rows */}
      {view.allRecommendations.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
          {view.allRecommendations.map((item) => (
            <RecommendationRow key={item.mission.id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}

      {/* Honest disclaimer */}
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 9,
          letterSpacing: '0.06em',
          color: COLORS.mutedSoft,
        }}
      >
        {view.honestDisclaimer}
      </span>
    </section>
  );
}
