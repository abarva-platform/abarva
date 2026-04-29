// /admin/reasoning/gate-owners — Hard gate criterion ownership by stakeholder category.
//
// Pure server component. Groups hard gate criteria by inferred owner category
// across all lifecycle patterns. Owner category is derived from keyword
// matching against criterion descriptions. Renders a summary strip, a
// per-pattern ownership table (always-expanded accordion), and a bar chart of
// hard gate counts by owner category.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import type { GateCriterion } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gate owners · AbarVa Admin',
};

// ─── Owner category inference ─────────────────────────────────────────────────

type OwnerCategory =
  | 'Legal'
  | 'Finance'
  | 'Technical'
  | 'Procurement'
  | 'Executive'
  | 'Other';

const OWNER_KEYWORDS: Record<OwnerCategory, string[]> = {
  Legal: ['legal', 'compliance', 'contract', 'nda', 'regulatory', 'gdpr', 'audit', 'liability', 'privacy', 'security attestation', 'legal review', 'legal sign'],
  Finance: ['finance', 'financial', 'budget', 'cost', 'tco', 'commercial', 'pricing', 'spend', 'invoic', 'payment', 'roi', 'okr', 'value realisation', 'value realization', 'benefit'],
  Technical: ['technical', 'architecture', 'integration', 'api', 'infrastructure', 'security review', 'security design', 'data model', 'pilot', 'build', 'deploy', 'system', 'platform', 'stack', 'performance', 'sla', 'service level', 'adoption metric', 'okr baseline'],
  Procurement: ['procurement', 'rfp', 'rfi', 'bafo', 'vendor', 'supplier', 'shortlist', 'evaluation', 'rfq', 'scope', 'nda', 'transition'],
  Executive: ['executive', 'sponsor', 'steering', 'sign-off', 'sign off', 'approval', 'charter', 'board', 'stakeholder', 'director', 'ceo', 'cto', 'cfo', 'business case'],
  Other: [],
};

const ORDERED_CATEGORIES: OwnerCategory[] = [
  'Executive',
  'Legal',
  'Finance',
  'Procurement',
  'Technical',
  'Other',
];

function inferOwnerCategory(criterion: GateCriterion): OwnerCategory {
  const text = criterion.description.toLowerCase();
  // Check all categories (except Other) in priority order
  for (const cat of ORDERED_CATEGORIES.filter((c) => c !== 'Other')) {
    for (const keyword of OWNER_KEYWORDS[cat]) {
      if (text.includes(keyword)) {
        return cat;
      }
    }
  }
  return 'Other';
}

// ─── Data model ───────────────────────────────────────────────────────────────

interface EnrichedCriterion {
  criterion: GateCriterion;
  ownerCategory: OwnerCategory;
}

interface PatternGroup {
  patternId: string;
  patternTitle: string;
  hardGates: EnrichedCriterion[];
  allCriteria: EnrichedCriterion[];
}

interface PageData {
  patternGroups: PatternGroup[];
  totalPatterns: number;
  totalHardGates: number;
  categoryDistribution: Record<OwnerCategory, number>;
  ownerCategoryCount: number;
}

function buildPageData(): PageData {
  const patterns = getAllLifecyclePatterns();

  const patternGroups: PatternGroup[] = patterns.map((p) => {
    const allCriteria: EnrichedCriterion[] = p.gateCriteria.map((c) => ({
      criterion: c,
      ownerCategory: inferOwnerCategory(c),
    }));
    const hardGates = allCriteria.filter((e) => e.criterion.gateType === 'hard');
    return {
      patternId: p.patternId,
      patternTitle: p.title,
      hardGates,
      allCriteria,
    };
  });

  // Sort patterns by hard gate count descending
  patternGroups.sort((a, b) => b.hardGates.length - a.hardGates.length);

  const distribution: Record<OwnerCategory, number> = {
    Legal: 0,
    Finance: 0,
    Technical: 0,
    Procurement: 0,
    Executive: 0,
    Other: 0,
  };
  let totalHardGates = 0;
  for (const g of patternGroups) {
    for (const e of g.hardGates) {
      distribution[e.ownerCategory] += 1;
      totalHardGates += 1;
    }
  }

  const ownerCategoryCount = ORDERED_CATEGORIES.filter((c) => distribution[c] > 0).length;

  return {
    patternGroups,
    totalPatterns: patterns.length,
    totalHardGates,
    categoryDistribution: distribution,
    ownerCategoryCount,
  };
}

// ─── Owner category pill colours ─────────────────────────────────────────────

const CATEGORY_PALETTE: Record<OwnerCategory, { bg: string; fg: string }> = {
  Legal: { bg: SHELL.PEACH_BG, fg: SHELL.PEACH_TEXT },
  Finance: { bg: SHELL.MINT_BG, fg: SHELL.MINT_TEXT },
  Technical: { bg: SHELL.BLUE_BG, fg: COLORS.navy },
  Procurement: { bg: SHELL.GRAY_BG, fg: SHELL.GRAY_TEXT },
  Executive: { bg: COLORS.amberSoft, fg: COLORS.amberInk },
  Other: { bg: `${COLORS.ink}0d`, fg: `${COLORS.ink}88` },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryStrip({
  totalPatterns,
  totalHardGates,
  ownerCategoryCount,
}: {
  totalPatterns: number;
  totalHardGates: number;
  ownerCategoryCount: number;
}) {
  const items = [
    { label: 'Patterns', value: String(totalPatterns) },
    { label: 'Hard gates', value: String(totalHardGates) },
    { label: 'Owner categories', value: String(ownerCategoryCount) },
  ];
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: SPACING.md,
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            background: COLORS.white,
            border: `1px solid ${COLORS.ink}14`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.xs,
          }}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: `${COLORS.ink}99`,
              fontWeight: 600,
            }}
          >
            {item.label}
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 40,
              color: COLORS.ink,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
            }}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function OwnerPill({ category }: { category: OwnerCategory }) {
  const palette = CATEGORY_PALETTE[category];
  return (
    <span
      style={{
        display: 'inline-block',
        background: palette.bg,
        color: palette.fg,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {category}
    </span>
  );
}

const TH: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 12,
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}22`,
  letterSpacing: '0.01em',
  whiteSpace: 'nowrap',
};

const TD: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}0d`,
  verticalAlign: 'top',
};

const TD_MONO: React.CSSProperties = {
  ...TD,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

function PatternSection({ group }: { group: PatternGroup }) {
  if (group.hardGates.length === 0) {
    return (
      <div
        style={{
          background: COLORS.white,
          border: `1px solid ${COLORS.ink}14`,
          borderRadius: RADIUS.lg,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: `${SPACING.md} ${SPACING.lg}`,
            display: 'flex',
            alignItems: 'baseline',
            gap: SPACING.md,
          }}
        >
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: `${COLORS.ink}66`,
              background: `${COLORS.ink}08`,
              borderRadius: RADIUS.pill,
              padding: '2px 8px',
            }}
          >
            {group.patternId}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 17,
              color: COLORS.ink,
              letterSpacing: '-0.01em',
            }}
          >
            {group.patternTitle}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}66`,
              marginLeft: 'auto',
            }}
          >
            No hard gates
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
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
          gap: SPACING.md,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}66`,
            background: `${COLORS.ink}08`,
            borderRadius: RADIUS.pill,
            padding: '2px 8px',
            flexShrink: 0,
          }}
        >
          {group.patternId}
        </span>
        <h3
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 18,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
            flexGrow: 1,
          }}
        >
          {group.patternTitle}
        </h3>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
            flexShrink: 0,
          }}
        >
          {group.hardGates.length} hard gate{group.hardGates.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
          <thead>
            <tr>
              <th style={{ ...TH, width: '14%' }}>Gate ID</th>
              <th style={{ ...TH, width: '46%' }}>Description</th>
              <th style={{ ...TH, width: '20%' }}>Stage</th>
              <th style={{ ...TH, width: '20%' }}>Owner category</th>
            </tr>
          </thead>
          <tbody>
            {group.hardGates.map((enriched) => (
              <tr key={enriched.criterion.id}>
                <td style={TD_MONO}>{enriched.criterion.id}</td>
                <td style={TD}>{enriched.criterion.description}</td>
                <td style={TD_MONO}>{enriched.criterion.stageId}</td>
                <td style={{ ...TD, padding: `${SPACING.xs} ${SPACING.md}` }}>
                  <OwnerPill category={enriched.ownerCategory} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OwnershipTable({ patternGroups }: { patternGroups: PatternGroup[] }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: `${COLORS.ink}99`,
          fontWeight: 600,
        }}
      >
        Ownership by pattern
      </div>
      {patternGroups.map((group) => (
        <div key={group.patternId}>
          <PatternSection group={group} />
        </div>
      ))}
    </section>
  );
}

function OwnerDistributionChart({
  distribution,
  totalHardGates,
}: {
  distribution: Record<OwnerCategory, number>;
  totalHardGates: number;
}) {
  const maxCount = Math.max(...ORDERED_CATEGORIES.map((c) => distribution[c]), 1);
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
            Owner distribution
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Hard gate count by owner category across all patterns
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {totalHardGates} total
        </span>
      </header>
      <div style={{ padding: SPACING.lg, display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
        {ORDERED_CATEGORIES.map((cat) => {
          const count = distribution[cat];
          const pct = totalHardGates > 0 ? (count / totalHardGates) * 100 : 0;
          const barPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const palette = CATEGORY_PALETTE[cat];
          return (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
              <div
                style={{
                  width: 100,
                  flexShrink: 0,
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLORS.ink,
                }}
              >
                {cat}
              </div>
              <div
                style={{
                  flex: 1,
                  height: 20,
                  background: `${COLORS.ink}08`,
                  borderRadius: RADIUS.sm,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${barPct}%`,
                    height: '100%',
                    background: palette.bg,
                    borderRadius: RADIUS.sm,
                    minWidth: count > 0 ? 4 : 0,
                    transition: 'none',
                  }}
                />
              </div>
              <div
                style={{
                  width: 80,
                  flexShrink: 0,
                  display: 'flex',
                  gap: SPACING.xs,
                  alignItems: 'baseline',
                }}
              >
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 14,
                    fontWeight: 600,
                    color: COLORS.ink,
                  }}
                >
                  {count}
                </span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 11,
                    color: `${COLORS.ink}66`,
                  }}
                >
                  {pct.toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GateOwnersPage() {
  const data = buildPageData();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="View patterns"
          primaryActionHref="/admin/reasoning/patterns"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Gate owners"
        title="Gate criterion ownership"
        subtitle="Hard gate criteria grouped by inferred stakeholder owner category across all lifecycle patterns. Owner categories are derived from criterion description keywords."
      >
        <SummaryStrip
          totalPatterns={data.totalPatterns}
          totalHardGates={data.totalHardGates}
          ownerCategoryCount={data.ownerCategoryCount}
        />
        <OwnerDistributionChart
          distribution={data.categoryDistribution}
          totalHardGates={data.totalHardGates}
        />
        <OwnershipTable patternGroups={data.patternGroups} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
