// AIR-3 · /admin/ai-initiatives view (3 view modes).
//
// View mode is URL-param driven (?view=goal|category|table). Default
// is 'goal' per package SETUP_UI_SPEC.md ("By Business Goal" because
// CXO recognizes goals; category is platform internal).

import Link from 'next/link';
import { COLORS, SPACING, RADIUS, BORDER, FONT } from '@/lib/design/abarva-theme';
import {
  type AIInitiativesPageData,
  type AIInitiative,
  type AIBusinessGoal,
  type AICategory,
  STAGE_LABELS,
  STATUS_LABELS,
  formatUsd,
  groupInitiativesByGoal,
  groupInitiativesByCategory,
} from '@/lib/admin/ai-initiatives/queries';

export type ViewMode = 'goal' | 'category' | 'table';

interface Props {
  data: AIInitiativesPageData;
  tenantName: string;
  refreshedLabel?: string;
  view: ViewMode;
}

export function AIInitiativesView({ data, tenantName, refreshedLabel, view }: Props) {
  const initiativeCount = data.initiatives.length;
  return (
    <div
      data-testid="ai-initiatives-page"
      style={{
        padding: `${SPACING.xl}px clamp(${SPACING.lg}px, 4vw, ${SPACING.xxxl}px)`,
        maxWidth: 1280,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <Header
        tenantName={tenantName}
        initiativeCount={initiativeCount}
        refreshedLabel={refreshedLabel}
      />
      <ViewToggle active={view} />

      {initiativeCount === 0 ? (
        <EmptyState />
      ) : view === 'goal' ? (
        <ByGoalView initiatives={data.initiatives} goals={data.goals} />
      ) : view === 'category' ? (
        <ByCategoryView initiatives={data.initiatives} categories={data.categories} />
      ) : (
        <AllInitiativesTable initiatives={data.initiatives} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------

function Header({
  tenantName,
  initiativeCount,
  refreshedLabel,
}: {
  tenantName: string;
  initiativeCount: number;
  refreshedLabel?: string;
}) {
  return (
    <header style={{ marginBottom: SPACING.xl }}>
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: COLORS.muted,
          marginBottom: SPACING.xs,
        }}
      >
        Setup · AI Initiatives Registry
      </div>
      <h1
        style={{
          fontFamily: FONT.body,
          fontSize: 24,
          fontWeight: 700,
          color: COLORS.ink,
          letterSpacing: '-0.01em',
          marginBottom: SPACING.xs,
        }}
      >
        AI Initiatives across {tenantName}
      </h1>
      <p
        style={{
          fontFamily: FONT.body,
          fontSize: 13,
          color: COLORS.muted,
          margin: 0,
        }}
      >
        The canonical inventory of AI initiatives. {initiativeCount} initiative
        {initiativeCount === 1 ? '' : 's'} loaded
        {refreshedLabel ? ` · last refreshed ${refreshedLabel}` : ''}.
      </p>
    </header>
  );
}

// ---------------------------------------------------------------------
// View toggle
// ---------------------------------------------------------------------

function ViewToggle({ active }: { active: ViewMode }) {
  const modes: ReadonlyArray<{ value: ViewMode; label: string }> = [
    { value: 'goal', label: 'By Business Goal' },
    { value: 'category', label: 'By Category' },
    { value: 'table', label: 'All initiatives' },
  ];
  return (
    <div
      role="tablist"
      aria-label="View mode"
      style={{
        display: 'flex',
        gap: SPACING.xs,
        marginBottom: SPACING.xl,
        flexWrap: 'wrap',
      }}
    >
      {modes.map((m) => {
        const isActive = m.value === active;
        const href = m.value === 'goal' ? '/admin/ai-initiatives' : `/admin/ai-initiatives?view=${m.value}`;
        return (
          <Link
            key={m.value}
            href={href}
            role="tab"
            aria-selected={isActive}
            style={{
              fontFamily: FONT.body,
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              padding: `${SPACING.xs}px ${SPACING.md}px`,
              borderRadius: RADIUS.pill,
              background: isActive ? COLORS.navy : COLORS.surface,
              color: isActive ? COLORS.surface : COLORS.body,
              border: isActive
                ? `1px solid ${COLORS.navy}`
                : `1px solid ${COLORS.border}`,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {m.label}
          </Link>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------
// View 1 — By Business Goal (default)
// ---------------------------------------------------------------------

function ByGoalView({
  initiatives,
  goals,
}: {
  initiatives: ReadonlyArray<AIInitiative>;
  goals: ReadonlyArray<AIBusinessGoal>;
}) {
  const groups = groupInitiativesByGoal(initiatives, goals);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
      {groups.map(({ goal, initiatives: list }) => (
        <section
          key={goal.goalId}
          aria-labelledby={`goal-${goal.goalId}`}
          style={{
            border: BORDER.hairline,
            borderRadius: RADIUS.md,
            background: COLORS.card,
            padding: SPACING.lg,
          }}
        >
          <header style={{ marginBottom: SPACING.md }}>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: COLORS.muted,
                marginBottom: SPACING.xs,
              }}
            >
              {goal.goalId}
            </div>
            <h2
              id={`goal-${goal.goalId}`}
              style={{
                fontFamily: FONT.body,
                fontSize: 16,
                fontWeight: 600,
                color: COLORS.ink,
                margin: 0,
                marginBottom: SPACING.xs,
              }}
            >
              {goal.name}
            </h2>
            <p style={{ fontFamily: FONT.body, fontSize: 13, color: COLORS.muted, margin: 0 }}>
              {goal.strategicContext}
            </p>
          </header>

          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
            {list.map((init) => (
              <InitiativeCard key={init.initiativeId} initiative={init} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
// View 2 — By Category
// ---------------------------------------------------------------------

function ByCategoryView({
  initiatives,
  categories,
}: {
  initiatives: ReadonlyArray<AIInitiative>;
  categories: ReadonlyArray<AICategory>;
}) {
  const groups = groupInitiativesByCategory(initiatives, categories);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
      {groups.map(({ category, initiatives: list }) => (
        <section
          key={category.categoryId}
          aria-labelledby={`cat-${category.categoryId}`}
          style={{
            border: BORDER.hairline,
            borderRadius: RADIUS.md,
            background: COLORS.card,
            padding: SPACING.lg,
          }}
        >
          <header style={{ marginBottom: SPACING.md }}>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: COLORS.muted,
                marginBottom: SPACING.xs,
              }}
            >
              {category.categoryId}
            </div>
            <h2
              id={`cat-${category.categoryId}`}
              style={{
                fontFamily: FONT.body,
                fontSize: 16,
                fontWeight: 600,
                color: COLORS.ink,
                margin: 0,
                marginBottom: SPACING.xs,
              }}
            >
              {category.name}
            </h2>
            <p style={{ fontFamily: FONT.body, fontSize: 13, color: COLORS.muted, margin: 0 }}>
              {category.definition}
            </p>
          </header>

          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
            {list.map((init) => (
              <InitiativeCard key={init.initiativeId} initiative={init} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
// View 3 — All initiatives (sortable table)
// ---------------------------------------------------------------------

function AllInitiativesTable({ initiatives }: { initiatives: ReadonlyArray<AIInitiative> }) {
  return (
    <div
      style={{
        border: BORDER.hairline,
        borderRadius: RADIUS.md,
        background: COLORS.card,
        overflow: 'hidden',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT.body }}>
        <thead>
          <tr style={{ background: COLORS.surface2, textAlign: 'left' }}>
            <Th>⭐</Th>
            <Th>ID</Th>
            <Th>Initiative</Th>
            <Th>Category</Th>
            <Th>Goal</Th>
            <Th>Stage</Th>
            <Th>Owner</Th>
            <Th align="right">Annual $</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {initiatives.map((i) => (
            <tr
              key={i.initiativeId}
              style={{ borderTop: BORDER.hairlineSoft }}
            >
              <Td>{i.alignedCallout ? '⭐' : ''}</Td>
              <Td mono>{i.displayId}</Td>
              <Td>
                <Link
                  href={`/admin/ai-initiatives/${i.initiativeId}`}
                  style={{ color: COLORS.navy, textDecoration: 'none', fontWeight: 600 }}
                >
                  {i.name}
                </Link>
              </Td>
              <Td>{i.primaryCategoryName}</Td>
              <Td>{truncate(i.primaryGoalName, 32)}</Td>
              <Td>{STAGE_LABELS[i.stage]}</Td>
              <Td>
                {i.ownerName}
                <div style={{ fontSize: 11, color: COLORS.muted }}>{i.ownerTitle}</div>
              </Td>
              <Td align="right" mono>
                {formatUsd(i.committedAnnualUsd)}
              </Td>
              <Td>
                <StatusChip flag={i.statusFlag} />
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      style={{
        fontFamily: FONT.mono,
        fontSize: 10,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: COLORS.muted,
        fontWeight: 600,
        padding: `${SPACING.sm}px ${SPACING.md}px`,
        textAlign: align,
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  mono = false,
  align = 'left',
}: {
  children: React.ReactNode;
  mono?: boolean;
  align?: 'left' | 'right';
}) {
  return (
    <td
      style={{
        fontFamily: mono ? FONT.mono : FONT.body,
        fontSize: 13,
        color: COLORS.body,
        padding: `${SPACING.sm}px ${SPACING.md}px`,
        textAlign: align,
        verticalAlign: 'top',
      }}
    >
      {children}
    </td>
  );
}

// ---------------------------------------------------------------------
// Initiative card (used by goal + category views)
// ---------------------------------------------------------------------

function InitiativeCard({ initiative }: { initiative: AIInitiative }) {
  return (
    <Link
      href={`/admin/ai-initiatives/${initiative.initiativeId}`}
      data-testid={`initiative-card-${initiative.displayId}`}
      data-aligned={initiative.alignedCallout ? 'true' : 'false'}
      style={{
        display: 'block',
        border: initiative.alignedCallout
          ? `1px solid ${COLORS.amber}`
          : BORDER.hairline,
        background: initiative.alignedCallout
          ? 'rgba(180, 83, 9, 0.04)'
          : COLORS.surface,
        borderRadius: RADIUS.sm,
        padding: SPACING.md,
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: SPACING.sm,
          marginBottom: SPACING.xs,
          flexWrap: 'wrap',
        }}
      >
        {initiative.alignedCallout && (
          <span aria-hidden="true" style={{ color: COLORS.amber }}>
            ⭐
          </span>
        )}
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: COLORS.muted,
          }}
        >
          {initiative.displayId}
        </span>
        <span
          style={{
            fontFamily: FONT.body,
            fontSize: 14,
            fontWeight: 600,
            color: COLORS.ink,
          }}
        >
          {initiative.name}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: SPACING.md,
          fontFamily: FONT.body,
          fontSize: 12,
          color: COLORS.muted,
          marginBottom: SPACING.xs,
        }}
      >
        <span>{initiative.primaryCategoryName}</span>
        <span>·</span>
        <span>{STAGE_LABELS[initiative.stage]}{initiative.stageDetail ? ` (${initiative.stageDetail})` : ''}</span>
        <span>·</span>
        <span>{initiative.ownerName} · {initiative.ownerTitle}</span>
        <span>·</span>
        <span style={{ fontFamily: FONT.mono }}>{formatUsd(initiative.committedAnnualUsd)} annual</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' }}>
        <StatusChip flag={initiative.statusFlag} />
        <span style={{ fontFamily: FONT.body, fontSize: 12, color: COLORS.body }}>
          {initiative.statusSummary}
        </span>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------
// Status chip
// ---------------------------------------------------------------------

function StatusChip({ flag }: { flag: AIInitiative['statusFlag'] }) {
  const tone = statusTone(flag);
  return (
    <span
      style={{
        fontFamily: FONT.mono,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: tone.text,
        background: tone.bg,
        padding: `2px ${SPACING.xs}px`,
        borderRadius: RADIUS.sm,
        whiteSpace: 'nowrap',
      }}
    >
      {STATUS_LABELS[flag]}
    </span>
  );
}

function statusTone(flag: AIInitiative['statusFlag']): { bg: string; text: string } {
  switch (flag) {
    case 'healthy':
      return { bg: 'rgba(29, 158, 117, 0.10)', text: '#0F6E56' };
    case 'adoption_gap':
    case 'value_lag':
    case 'foundation_phase':
      return { bg: COLORS.amberSoft, text: COLORS.amber };
    case 'cost_overrun':
    case 'duplication_risk':
    case 'stalled':
      return { bg: COLORS.redSoft, text: COLORS.red };
    case 'in_move':
      return { bg: COLORS.navySoft, text: COLORS.navy };
    default:
      return { bg: COLORS.surface2, text: COLORS.muted };
  }
}

// ---------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------

function EmptyState() {
  return (
    <div
      style={{
        border: `1px dashed ${COLORS.border}`,
        borderRadius: RADIUS.md,
        background: COLORS.surface,
        padding: SPACING.xxxl,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: FONT.body,
          fontSize: 16,
          fontWeight: 600,
          color: COLORS.ink,
          marginBottom: SPACING.sm,
        }}
      >
        No AI initiatives loaded yet
      </div>
      <div style={{ fontFamily: FONT.body, fontSize: 13, color: COLORS.muted, maxWidth: 480, margin: '0 auto' }}>
        Run the substrate load: <code style={{ fontFamily: FONT.mono }}>npm run db:load:ai-initiatives</code>.
        After that completes, this registry surfaces 7 initiatives per demo
        tenant (Apex Retail · Meridian Health · First Capital Financial).
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}
