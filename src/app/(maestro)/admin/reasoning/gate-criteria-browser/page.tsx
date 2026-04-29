// /admin/reasoning/gate-criteria-browser — Browsable catalog of all gate criteria.
//
// Server component. Shows every gate criterion across all lifecycle patterns
// grouped by pattern and stage, with type chips, hardest badges, cross-pattern
// duplicate detection, and a failure simulation derived from health-board rows.

import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import type { GateCriterion, LifecyclePatternSeed } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gate Criteria Browser · AbarVa Admin',
};

// ─── Caps ──────────────────────────────────────────────────────────────────────

const MAX_PATTERNS = 6;
const MAX_STAGES_PER_PATTERN = 8;
const MAX_CRITERIA_PER_STAGE = 10;

// ─── Hash helper (deterministic, no randomness) ────────────────────────────────

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ─── Data shape ────────────────────────────────────────────────────────────────

interface EnrichedCriterion {
  criterion: GateCriterion;
  patternId: string;
  patternTitle: string;
  stageLabel: string;
  stageOrder: number;
  failingCount: number;
}

interface StageGroup {
  stageId: string;
  stageLabel: string;
  stageOrder: number;
  criteria: EnrichedCriterion[];
}

interface PatternGroup {
  patternId: string;
  patternTitle: string;
  stages: StageGroup[];
}

// ─── Data computation ──────────────────────────────────────────────────────────

function buildCatalog(): {
  patternGroups: PatternGroup[];
  totalCriteria: number;
  hardCount: number;
  softCount: number;
  uniquePatternCount: number;
  duplicates: Array<{ name: string; patternCount: number; patternTitles: string[] }>;
} {
  const patterns = getAllLifecyclePatterns().slice(0, MAX_PATTERNS);
  const healthRows = buildHealthBoardRows();

  // Build failing-instances simulation: an instance "fails" a criterion if
  // gatesMet/max(gatesTotal,1) < 0.7 AND hash(instanceId + criterionName) % 3 === 0
  const weakInstances = healthRows.filter(
    (r) => r.gatesMet / Math.max(r.gatesTotal, 1) < 0.7,
  );

  function failingCount(criterionName: string): number {
    return weakInstances.filter(
      (r) => simpleHash(r.id + criterionName) % 3 === 0,
    ).length;
  }

  // Track criterion names across patterns for duplicate detection
  const criterionPatternMap = new Map<string, Set<string>>(); // name → patternId set
  const criterionPatternTitles = new Map<string, string[]>();

  const patternGroups: PatternGroup[] = [];

  for (const pattern of patterns) {
    const stageMap = new Map<string, StageGroup>();

    // Index stages by id for label/order lookup
    const stageIndex = new Map(pattern.stages.map((s) => [s.id, s]));

    for (const criterion of pattern.gateCriteria) {
      const stage = stageIndex.get(criterion.stageId);
      const stageLabel = stage?.label ?? criterion.stageId;
      const stageOrder = stage?.order ?? 0;

      if (!stageMap.has(criterion.stageId)) {
        stageMap.set(criterion.stageId, {
          stageId: criterion.stageId,
          stageLabel,
          stageOrder,
          criteria: [],
        });
      }

      const group = stageMap.get(criterion.stageId)!;
      if (group.criteria.length < MAX_CRITERIA_PER_STAGE) {
        group.criteria.push({
          criterion,
          patternId: pattern.patternId,
          patternTitle: pattern.title,
          stageLabel,
          stageOrder,
          failingCount: failingCount(criterion.description),
        });
      }

      // Duplicate tracking
      if (!criterionPatternMap.has(criterion.description)) {
        criterionPatternMap.set(criterion.description, new Set());
        criterionPatternTitles.set(criterion.description, []);
      }
      criterionPatternMap.get(criterion.description)!.add(pattern.patternId);
      const titles = criterionPatternTitles.get(criterion.description)!;
      if (!titles.includes(pattern.title)) {
        titles.push(pattern.title);
      }
    }

    // Sort stages by order, cap at MAX_STAGES_PER_PATTERN
    const sortedStages = Array.from(stageMap.values())
      .sort((a, b) => a.stageOrder - b.stageOrder)
      .slice(0, MAX_STAGES_PER_PATTERN);

    if (sortedStages.length > 0) {
      patternGroups.push({
        patternId: pattern.patternId,
        patternTitle: pattern.title,
        stages: sortedStages,
      });
    }
  }

  // Summary stats across ALL patterns (not just capped display)
  const allPatterns: LifecyclePatternSeed[] = getAllLifecyclePatterns();
  const allCriteria = allPatterns.flatMap((p) => p.gateCriteria);
  const totalCriteria = allCriteria.length;
  const hardCount = allCriteria.filter((c) => c.gateType === 'hard').length;
  const softCount = allCriteria.filter((c) => c.gateType === 'soft').length;
  const uniquePatternCount = allPatterns.length;

  // Duplicates: criteria names appearing in 2+ patterns
  const duplicates = Array.from(criterionPatternMap.entries())
    .filter(([, patternSet]) => patternSet.size >= 2)
    .map(([name, patternSet]) => ({
      name,
      patternCount: patternSet.size,
      patternTitles: criterionPatternTitles.get(name) ?? [],
    }))
    .sort((a, b) => b.patternCount - a.patternCount);

  return {
    patternGroups,
    totalCriteria,
    hardCount,
    softCount,
    uniquePatternCount,
    duplicates,
  };
}

// ─── Summary strip ──────────────────────────────────────────────────────────────

function SummaryStrip({
  totalCriteria,
  hardCount,
  softCount,
  uniquePatternCount,
}: {
  totalCriteria: number;
  hardCount: number;
  softCount: number;
  uniquePatternCount: number;
}) {
  const items: Array<{ label: string; value: string; color: string }> = [
    { label: 'total criteria', value: String(totalCriteria), color: COLORS.ink },
    { label: 'hard gates', value: String(hardCount), color: SHELL.RUST_TEXT },
    { label: 'soft gates', value: String(softCount), color: SHELL.PEACH_TEXT },
    { label: 'patterns', value: String(uniquePatternCount), color: '#2a56a6' },
  ];

  const containerStyle: CSSProperties = {
    background: COLORS.white,
    border: `1px solid ${COLORS.ink}14`,
    borderRadius: RADIUS.lg,
    padding: `${SPACING.md} ${SPACING.lg}`,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: `${SPACING.sm} ${SPACING.lg}`,
  };

  return (
    <div style={containerStyle}>
      {items.map((item, i) => (
        <span
          key={item.label}
          style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}
        >
          {i > 0 && (
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: `${COLORS.ink}40`,
                marginRight: 4,
              }}
            >
              ·
            </span>
          )}
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 22,
              color: item.color,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {item.value}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
            }}
          >
            {item.label}
          </span>
        </span>
      ))}
    </div>
  );
}

// ─── Gate type chip ─────────────────────────────────────────────────────────────

function GateChip({ gateType }: { gateType: 'hard' | 'soft' }) {
  const isHard = gateType === 'hard';
  const chipStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: RADIUS.pill,
    fontFamily: TYPOGRAPHY.mono,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    background: isHard ? SHELL.RUST_BG : SHELL.PEACH_BG,
    color: isHard ? SHELL.RUST_TEXT : SHELL.PEACH_TEXT,
    whiteSpace: 'nowrap',
  };
  return <span style={chipStyle}>{gateType}</span>;
}

// ─── Hardest badge ──────────────────────────────────────────────────────────────

function HardestBadge() {
  const badgeStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '1px 7px',
    borderRadius: RADIUS.pill,
    fontFamily: TYPOGRAPHY.mono,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    background: `${COLORS.ink}0d`,
    color: `${COLORS.ink}88`,
    whiteSpace: 'nowrap',
  };
  return <span style={badgeStyle}>Hardest</span>;
}

// ─── Failing count badge ────────────────────────────────────────────────────────

function FailingBadge({ count }: { count: number }) {
  if (count === 0) return null;
  const badgeStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '1px 7px',
    borderRadius: RADIUS.pill,
    fontFamily: TYPOGRAPHY.mono,
    fontSize: 10,
    fontWeight: 600,
    background: `${COLORS.ink}0a`,
    color: `${COLORS.ink}77`,
    whiteSpace: 'nowrap',
  };
  return <span style={badgeStyle}>{count} failing</span>;
}

// ─── Criterion row ──────────────────────────────────────────────────────────────

function CriterionRow({
  ec,
  isHardest,
}: {
  ec: EnrichedCriterion;
  isHardest: boolean;
}) {
  const rowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: `7px ${SPACING.md}`,
    borderBottom: `1px solid ${COLORS.ink}08`,
  };

  return (
    <div style={rowStyle}>
      <GateChip gateType={ec.criterion.gateType} />
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          color: `${COLORS.ink}cc`,
          flex: 1,
          lineHeight: 1.4,
          minWidth: 0,
        }}
        title={ec.criterion.description}
      >
        {ec.criterion.description.length > 100
          ? `${ec.criterion.description.slice(0, 100)}…`
          : ec.criterion.description}
      </span>
      {isHardest && <HardestBadge />}
      <FailingBadge count={ec.failingCount} />
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 10,
          color: `${COLORS.ink}44`,
          whiteSpace: 'nowrap',
        }}
      >
        {ec.criterion.id}
      </span>
    </div>
  );
}

// ─── Pattern-grouped catalog ────────────────────────────────────────────────────

function PatternCatalog({ patternGroups }: { patternGroups: PatternGroup[] }) {
  const sectionStyle: CSSProperties = {
    background: COLORS.white,
    border: `1px solid ${COLORS.ink}14`,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  };

  const patternHeaderStyle: CSSProperties = {
    fontFamily: TYPOGRAPHY.serif,
    fontSize: 18,
    color: COLORS.ink,
    margin: 0,
    letterSpacing: '-0.01em',
  };

  const stageHeaderStyle: CSSProperties = {
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: `${COLORS.ink}88`,
    padding: `${SPACING.xs} ${SPACING.md}`,
    background: `${COLORS.ink}05`,
    borderTop: `1px solid ${COLORS.ink}0d`,
    borderBottom: `1px solid ${COLORS.ink}0d`,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
      {patternGroups.map((pg) => {
        // Count total criteria in this pattern for "hardest" classification:
        // criteria in later stages (higher stageOrder) get the "Hardest" badge.
        const allCriteriaInPattern = pg.stages.flatMap((s) => s.criteria);
        const maxOrder = Math.max(...pg.stages.map((s) => s.stageOrder), 0);

        return (
          <div key={pg.patternId} style={sectionStyle}>
            <div
              style={{
                padding: `${SPACING.md} ${SPACING.lg}`,
                borderBottom: `1px solid ${COLORS.ink}10`,
              }}
            >
              <h2 style={patternHeaderStyle}>{pg.patternTitle}</h2>
              <div
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 10,
                  color: `${COLORS.ink}55`,
                  marginTop: 2,
                }}
              >
                {pg.patternId} — {allCriteriaInPattern.length} criteria across{' '}
                {pg.stages.length} stage{pg.stages.length !== 1 ? 's' : ''}
              </div>
            </div>
            {pg.stages.map((sg) => {
              const isHardestStage = sg.stageOrder === maxOrder;
              return (
                <div key={sg.stageId}>
                  <div style={stageHeaderStyle}>
                    {sg.stageLabel}
                    <span
                      style={{
                        marginLeft: 8,
                        fontWeight: 400,
                        color: `${COLORS.ink}55`,
                        textTransform: 'none',
                        letterSpacing: 0,
                        fontSize: 11,
                      }}
                    >
                      ({sg.criteria.length})
                    </span>
                  </div>
                  {sg.criteria.map((ec) => (
                    <div key={ec.criterion.id}>
                      <CriterionRow ec={ec} isHardest={isHardestStage} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ─── Cross-pattern duplicates ───────────────────────────────────────────────────

function DuplicateDetection({
  duplicates,
}: {
  duplicates: Array<{ name: string; patternCount: number; patternTitles: string[] }>;
}) {
  if (duplicates.length === 0) return null;

  const sectionStyle: CSSProperties = {
    background: SHELL.BLUE_BG,
    border: `1px solid ${COLORS.ink}14`,
    borderRadius: RADIUS.lg,
    padding: `${SPACING.md} ${SPACING.lg}`,
  };

  const chipStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '4px 10px',
    borderRadius: RADIUS.pill,
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 11,
    background: COLORS.white,
    border: `1px solid ${COLORS.ink}18`,
    color: COLORS.ink,
    maxWidth: 360,
  };

  return (
    <section style={sectionStyle}>
      <h2
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 18,
          color: COLORS.ink,
          margin: `0 0 ${SPACING.sm} 0`,
          letterSpacing: '-0.01em',
        }}
      >
        Cross-pattern shared criteria
      </h2>
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          color: `${COLORS.ink}88`,
          marginBottom: SPACING.md,
        }}
      >
        {duplicates.length} criterion description{duplicates.length !== 1 ? 's' : ''} appear in
        multiple patterns
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING.sm }}>
        {duplicates.slice(0, 20).map((dup, idx) => (
          <div key={idx} style={chipStyle} title={dup.patternTitles.join(', ')}>
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 10,
                fontWeight: 700,
                color: '#2a56a6',
                whiteSpace: 'nowrap',
              }}
            >
              ×{dup.patternCount}
            </span>
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {dup.name.length > 55 ? `${dup.name.slice(0, 55)}…` : dup.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function GateCriteriaBrowserPage() {
  const {
    patternGroups,
    totalCriteria,
    hardCount,
    softCount,
    uniquePatternCount,
    duplicates,
  } = buildCatalog();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to reasoning"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Gate Criteria Browser"
        subtitle="All gate criteria across all patterns — type, stage, and instance failure rates"
      >
        <SummaryStrip
          totalCriteria={totalCriteria}
          hardCount={hardCount}
          softCount={softCount}
          uniquePatternCount={uniquePatternCount}
        />
        <PatternCatalog patternGroups={patternGroups} />
        <DuplicateDetection duplicates={duplicates} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
