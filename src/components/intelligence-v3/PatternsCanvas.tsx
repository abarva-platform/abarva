// Intelligence v3 · Patterns stage.
//
// Reuses the existing 10-failure-mode library and overlays per-tenant
// initiative exposure. Each card links to the existing
// /intelligence/failure-modes/<slug> editorial page (preserved in the
// v3 reframe).

import Link from 'next/link';
import { COLORS, FONT, BORDER, SPACING, RADIUS } from '@/lib/design/abarva-theme';
import { J0_FAILURE_MODE_CARDS } from '@/lib/intelligence/j0-failure-mode-cards';
import type { AIInitiative } from '@/lib/admin/ai-initiatives/queries';

interface Props {
  initiatives: ReadonlyArray<AIInitiative>;
}

// Heuristic mapping: which failure-mode #s correlate with which
// initiative status_flag. The mapping is deliberately rough — meant
// as a first-pass tenant exposure overlay, not a definitive risk
// score.
const STATUS_TO_FAILURE_IDS: Record<string, ReadonlyArray<number>> = {
  stalled: [1, 5, 6], // Phantom sponsor · Workflow that wasn't · Last-minute auditor
  cost_overrun: [3, 9], // Untestable foundation · Phantom KPI
  duplication_risk: [10, 7], // Sprawl trap · Vendor-picked first
  value_lag: [9, 5], // Phantom KPI · Workflow that wasn't
  adoption_gap: [4, 5], // Borrowed team · Workflow that wasn't
  foundation_phase: [3, 6], // Untestable foundation · Last-minute auditor
};

export function PatternsCanvas({ initiatives }: Props) {
  // Compute exposure: how many initiatives signal each failure mode.
  const exposure = new Map<number, AIInitiative[]>();
  for (const i of initiatives) {
    const ids = STATUS_TO_FAILURE_IDS[i.statusFlag] ?? [];
    for (const id of ids) {
      const list = exposure.get(id) ?? [];
      list.push(i);
      exposure.set(id, list);
    }
  }

  return (
    <section
      id="stage-panel-patterns"
      role="tabpanel"
      style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}
    >
      <SectionHeader>Pattern library · 10 ways enterprise AI fails</SectionHeader>
      <p style={{ fontFamily: FONT.body, fontSize: 12, color: COLORS.muted, margin: 0 }}>
        Canonical failure modes from the corpus. Each card surfaces the
        tenant&apos;s exposure — initiatives whose current status pattern-matches
        the failure mode. Click any card for the editorial deep-dive.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: SPACING.sm,
        }}
      >
        {J0_FAILURE_MODE_CARDS.map((card) => {
          const matching = exposure.get(card.failureModeId) ?? [];
          const slug = slugify(card.editorialName);
          return (
            <Link
              key={card.failureModeId}
              href={`/intelligence/failure-modes/${slug}`}
              style={{
                display: 'block',
                border: matching.length > 0 ? `1px solid ${COLORS.amber}` : BORDER.hairline,
                background:
                  matching.length > 0 ? 'rgba(180, 83, 9, 0.04)' : COLORS.card,
                borderRadius: RADIUS.md,
                padding: SPACING.lg,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: SPACING.sm,
                  marginBottom: SPACING.xs,
                }}
              >
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    color: COLORS.muted,
                  }}
                >
                  #{card.failureModeId}
                </span>
                {matching.length > 0 && (
                  <span
                    style={{
                      fontFamily: FONT.mono,
                      fontSize: 9,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: COLORS.amber,
                      fontWeight: 700,
                    }}
                  >
                    {matching.length} initiative{matching.length === 1 ? '' : 's'} exposed
                  </span>
                )}
              </div>
              <h3
                style={{
                  fontFamily: FONT.body,
                  fontSize: 16,
                  fontWeight: 600,
                  color: COLORS.ink,
                  margin: 0,
                  marginBottom: SPACING.xs,
                }}
              >
                {card.editorialName}
              </h3>
              <p
                style={{
                  fontFamily: FONT.body,
                  fontSize: 13,
                  color: COLORS.body,
                  margin: 0,
                  marginBottom: SPACING.sm,
                  lineHeight: 1.5,
                }}
              >
                {card.oneLineHook}
              </p>
              {matching.length > 0 && (
                <div
                  style={{
                    fontFamily: FONT.body,
                    fontSize: 11,
                    color: COLORS.muted,
                    paddingTop: SPACING.xs,
                    borderTop: `1px dotted ${COLORS.border}`,
                  }}
                >
                  {matching
                    .slice(0, 3)
                    .map((i) => i.displayId)
                    .join(' · ')}
                  {matching.length > 3 ? ` · +${matching.length - 3} more` : ''}
                </div>
              )}
              {card.citedResearch[0] && (
                <div
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 10,
                    color: COLORS.muted,
                    marginTop: SPACING.sm,
                  }}
                >
                  {card.citedResearch[0].source} · {card.citedResearch[0].citation.slice(0, 80)}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function slugify(name: string): string {
  // Editorial names like "The Phantom Sponsor" → "phantom-sponsor".
  return name
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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
