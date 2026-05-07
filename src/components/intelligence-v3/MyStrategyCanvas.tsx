// Intelligence v3 · My strategy stage.
//
// Reads ai_business_goals as strategy themes; for each theme shows
// the initiatives serving it, healthy / at-risk / aligned counts, and
// committed vs measured value.

import { COLORS, FONT, BORDER, SPACING, RADIUS } from '@/lib/design/abarva-theme';
import { STATUS_LABELS, formatUsd } from '@/lib/admin/ai-initiatives/labels';
import type { MyStrategyData, StrategyTheme } from '@/lib/intelligence-v3/stages-display';

export function MyStrategyCanvas({ data }: { data: MyStrategyData }) {
  return (
    <section
      id="stage-panel-my-strategy"
      role="tabpanel"
      style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}
    >
      <SectionHeader>My strategy · themes and the initiatives serving them</SectionHeader>
      <p style={{ fontFamily: FONT.body, fontSize: 12, color: COLORS.muted, margin: 0 }}>
        Strategic themes from the business-goal substrate. Each theme shows
        what&apos;s in flight, where bets are aligned, and where coverage gaps
        remain.
      </p>

      <Totals data={data} />

      {data.themes.length === 0 ? (
        <Empty>No business-goal substrate loaded yet for this tenant.</Empty>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
          {data.themes.map((t) => (
            <ThemeCard key={t.goalId} theme={t} />
          ))}
        </div>
      )}
    </section>
  );
}

function Totals({ data }: { data: MyStrategyData }) {
  const tiles: ReadonlyArray<{ label: string; value: string }> = [
    { label: 'Strategy themes', value: data.totals.themeCount.toString() },
    { label: 'Annual committed', value: formatUsd(data.totals.committedTotalUsd) },
    { label: 'Aligned initiatives', value: data.totals.alignedCount.toString() },
    { label: 'Themes with gaps', value: data.totals.themesWithGap.toString() },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: SPACING.xs }}>
      {tiles.map((t) => (
        <div
          key={t.label}
          style={{
            border: BORDER.hairline,
            background: COLORS.surface,
            borderRadius: RADIUS.sm,
            padding: SPACING.sm,
          }}
        >
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 9,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: COLORS.muted,
            }}
          >
            {t.label}
          </div>
          <div
            style={{
              fontFamily: FONT.body,
              fontSize: 18,
              fontWeight: 700,
              color: COLORS.ink,
              marginTop: 2,
            }}
          >
            {t.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function ThemeCard({ theme }: { theme: StrategyTheme }) {
  const hasGap = theme.atRiskCount > 0;
  return (
    <article
      style={{
        border: hasGap ? `1px solid ${COLORS.amber}` : BORDER.hairline,
        borderLeft: `3px solid ${theme.alignedCount > 0 ? COLORS.amber : COLORS.navy}`,
        background: hasGap ? 'rgba(180, 83, 9, 0.04)' : COLORS.card,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
      }}
    >
      <header style={{ marginBottom: SPACING.sm }}>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 9,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: COLORS.muted,
          }}
        >
          {theme.goalId}
        </div>
        <h3 style={{ fontFamily: FONT.body, fontSize: 16, fontWeight: 600, color: COLORS.ink, margin: 0, marginTop: 2 }}>
          {theme.alignedCount > 0 && '⭐ '}
          {theme.goalName}
        </h3>
        <p style={{ fontFamily: FONT.body, fontSize: 12, color: COLORS.muted, margin: 0, marginTop: 4, lineHeight: 1.5 }}>
          {theme.strategicContext}
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: SPACING.xs,
          marginBottom: SPACING.sm,
        }}
      >
        <Stat label="Initiatives" value={theme.initiativeCount.toString()} />
        <Stat label="Healthy" value={`${theme.healthyCount}`} tone={theme.healthyCount > 0 ? '#0F6E56' : COLORS.muted} />
        <Stat label="At risk" value={`${theme.atRiskCount}`} tone={theme.atRiskCount > 0 ? COLORS.amber : COLORS.muted} />
        <Stat label="Annual" value={formatUsd(theme.committedAnnualUsd)} />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          paddingTop: SPACING.sm,
          borderTop: `1px dotted ${COLORS.border}`,
        }}
      >
        {theme.initiatives.map((i) => (
          <div
            key={i.initiativeId}
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto minmax(0,1fr) auto',
              gap: SPACING.md,
              fontFamily: FONT.body,
              fontSize: 12,
              padding: '2px 0',
            }}
          >
            <span style={{ fontFamily: FONT.mono, color: COLORS.muted, fontSize: 10 }}>
              {i.displayId}
            </span>
            <span style={{ color: COLORS.body }}>
              {i.alignedCallout && '⭐ '}
              {i.name}
            </span>
            <span style={{ color: COLORS.muted, textAlign: 'right' }}>
              {STATUS_LABELS[i.statusFlag]}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 9,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: COLORS.muted,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: FONT.body,
          fontSize: 16,
          fontWeight: 700,
          color: tone ?? COLORS.ink,
          marginTop: 2,
        }}
      >
        {value}
      </div>
    </div>
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

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: `1px dashed ${COLORS.border}`,
        borderRadius: RADIUS.md,
        padding: SPACING.xxxl,
        textAlign: 'center',
        fontFamily: FONT.body,
        fontSize: 13,
        color: COLORS.muted,
      }}
    >
      {children}
    </div>
  );
}
