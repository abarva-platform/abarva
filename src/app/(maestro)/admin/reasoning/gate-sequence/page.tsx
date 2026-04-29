// /admin/reasoning/gate-sequence — Recommended gate criterion evaluation order.
//
// Pure server component. For each lifecycle pattern, criteria are sorted by:
//   1. stage.order ASC  — earlier stages first
//   2. gateType: hard before soft  — hard gates prioritised within each stage
//   3. criterion id ASC  — deterministic tie-breaker
//
// This yields the recommended evaluation sequence an operator (or automated
// evaluator) should follow for each pattern.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import type { GateCriterion, LifecyclePatternSeed, LifecycleStage } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gate sequence · AbarVa Admin',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface SequencedCriterion {
  seq: number;
  criterion: GateCriterion;
  stage: LifecycleStage;
  rationale: string;
}

interface PatternSequence {
  pattern: LifecyclePatternSeed;
  items: SequencedCriterion[];
  hardCount: number;
  softCount: number;
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function buildPatternSequences(): PatternSequence[] {
  const patterns = getAllLifecyclePatterns();

  return patterns
    .map((pattern) => {
      const stageMap = new Map<string, LifecycleStage>(
        pattern.stages.map((s) => [s.id, s]),
      );

      // Sort: stage.order ASC → hard before soft → id ASC
      const sorted = [...(pattern.gateCriteria ?? [])].sort(
        (a, b) => {
          const stageA = stageMap.get(a.stageId);
          const stageB = stageMap.get(b.stageId);
          const orderA = stageA?.order ?? 9999;
          const orderB = stageB?.order ?? 9999;
          if (orderA !== orderB) return orderA - orderB;
          // hard = 0, soft = 1 → hard sorts first
          const typeA = a.gateType === 'hard' ? 0 : 1;
          const typeB = b.gateType === 'hard' ? 0 : 1;
          if (typeA !== typeB) return typeA - typeB;
          return a.id.localeCompare(b.id);
        },
      );

      const items: SequencedCriterion[] = sorted.map((criterion, idx) => {
        const stage = stageMap.get(criterion.stageId) ?? {
          id: criterion.stageId,
          label: criterion.stageId,
          description: '',
          order: 9999,
        };
        const rationale =
          criterion.gateType === 'hard'
            ? 'Hard gate — must be satisfied before stage advancement'
            : 'Soft gate — evaluated after all hard gates in this stage';
        return { seq: idx + 1, criterion, stage, rationale };
      });

      const hardCount = items.filter((i) => i.criterion.gateType === 'hard').length;
      const softCount = items.filter((i) => i.criterion.gateType === 'soft').length;

      return { pattern, items, hardCount, softCount };
    })
    .filter((ps) => ps.items.length > 0);
}

// ─── Style constants ──────────────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}22`,
  letterSpacing: '0.01em',
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'top',
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryStrip({
  patternCount,
  totalCriteria,
  hardCount,
}: {
  patternCount: number;
  totalCriteria: number;
  hardCount: number;
}) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        gap: SPACING.lg,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: `${COLORS.ink}99`,
            fontWeight: 600,
          }}
        >
          Patterns
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 32,
            color: COLORS.ink,
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
          }}
        >
          {patternCount}
        </span>
      </div>
      <div
        style={{
          width: 1,
          alignSelf: 'stretch',
          background: `${COLORS.ink}14`,
          flexShrink: 0,
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: `${COLORS.ink}99`,
            fontWeight: 600,
          }}
        >
          Total gate criteria
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 32,
            color: COLORS.ink,
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
          }}
        >
          {totalCriteria}
        </span>
      </div>
      <div
        style={{
          width: 1,
          alignSelf: 'stretch',
          background: `${COLORS.ink}14`,
          flexShrink: 0,
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: `${COLORS.ink}99`,
            fontWeight: 600,
          }}
        >
          Hard gates sequenced first
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 32,
            color: COLORS.ink,
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
          }}
        >
          {hardCount}
        </span>
      </div>
      <div style={{ marginLeft: 'auto', alignSelf: 'center' }}>
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            lineHeight: 1.5,
          }}
        >
          Hard gates are evaluated before soft gates within each stage.
          <br />
          Sequence resets to 1 for each pattern.
        </span>
      </div>
    </div>
  );
}

function TypePill({ gateType }: { gateType: 'hard' | 'soft' }) {
  const isHard = gateType === 'hard';
  return (
    <span
      style={{
        display: 'inline-block',
        background: isHard ? `${COLORS.ink}12` : `${COLORS.ink}07`,
        color: isHard ? COLORS.ink : `${COLORS.ink}99`,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: isHard ? 700 : 500,
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
        border: isHard ? `1px solid ${COLORS.ink}22` : `1px solid ${COLORS.ink}10`,
      }}
    >
      {gateType}
    </span>
  );
}

function SequenceTable({ ps }: { ps: PatternSequence }) {
  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      {/* Pattern header */}
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}10`,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.md,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.sm }}>
            <h2
              style={{
                fontFamily: TYPOGRAPHY.serif,
                fontSize: 20,
                color: COLORS.ink,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {ps.pattern.title}
            </h2>
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: `${COLORS.ink}88`,
              }}
            >
              {ps.pattern.patternId}
            </span>
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
            }}
          >
            {ps.pattern.stages.length} stage{ps.pattern.stages.length === 1 ? '' : 's'} ·{' '}
            {ps.items.length} criteria · {ps.hardCount} hard · {ps.softCount} soft
          </div>
        </div>
        <div style={{ display: 'flex', gap: SPACING.sm, alignItems: 'center', flexShrink: 0 }}>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              color: `${COLORS.ink}88`,
            }}
          >
            {ps.hardCount} hard before {ps.softCount} soft per stage
          </span>
        </div>
      </header>

      {/* Sequence table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr>
              <th style={{ ...HEADER_CELL, width: 56 }}>Seq #</th>
              <th style={{ ...HEADER_CELL, width: 180 }}>Gate ID</th>
              <th style={HEADER_CELL}>Description</th>
              <th style={{ ...HEADER_CELL, width: 80 }}>Type</th>
              <th style={{ ...HEADER_CELL, width: 140 }}>Stage</th>
              <th style={HEADER_CELL}>Rationale</th>
            </tr>
          </thead>
          <tbody>
            {ps.items.map((item) => (
              <tr
                key={item.criterion.id}
                style={{
                  background:
                    item.criterion.gateType === 'hard'
                      ? 'transparent'
                      : `${COLORS.ink}02`,
                }}
              >
                <td
                  style={{
                    ...MONO_CELL,
                    fontWeight: 700,
                    color: COLORS.navy,
                    textAlign: 'center',
                  }}
                >
                  {item.seq}
                </td>
                <td style={MONO_CELL}>{item.criterion.id}</td>
                <td
                  style={{
                    ...BODY_CELL,
                    lineHeight: 1.45,
                    maxWidth: 320,
                  }}
                >
                  {item.criterion.description}
                </td>
                <td style={BODY_CELL}>
                  <TypePill gateType={item.criterion.gateType} />
                </td>
                <td style={BODY_CELL}>
                  <div
                    style={{
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 12,
                      color: COLORS.ink,
                      fontWeight: 600,
                    }}
                  >
                    {item.stage.label}
                  </div>
                  <div
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 10,
                      color: `${COLORS.ink}88`,
                      marginTop: 2,
                    }}
                  >
                    order {item.stage.order}
                  </div>
                </td>
                <td
                  style={{
                    ...BODY_CELL,
                    color: `${COLORS.ink}99`,
                    fontStyle: 'italic',
                    lineHeight: 1.4,
                  }}
                >
                  {item.rationale}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SequenceSummary({
  sequences,
}: {
  sequences: PatternSequence[];
}) {
  const totalHard = sequences.reduce((acc, ps) => acc + ps.hardCount, 0);
  const totalSoft = sequences.reduce((acc, ps) => acc + ps.softCount, 0);
  const totalCriteria = totalHard + totalSoft;
  const hardPct = totalCriteria === 0 ? 0 : Math.round((totalHard / totalCriteria) * 100);

  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
      }}
    >
      <h2
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 20,
          color: COLORS.ink,
          margin: 0,
          letterSpacing: '-0.01em',
        }}
      >
        Sequence summary
      </h2>
      <p
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: `${COLORS.ink}99`,
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        Across all {sequences.length} patterns, <strong>{totalHard} hard gate{totalHard === 1 ? '' : 's'}</strong> are
        ordered before <strong>{totalSoft} soft gate{totalSoft === 1 ? '' : 's'}</strong> within each stage ({hardPct}%
        of all criteria are hard). Within any given stage, hard gates are always sequenced first so
        that blocking criteria surface before advisory ones.
      </p>

      {/* Per-pattern breakdown */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Pattern</th>
              <th style={{ ...HEADER_CELL, width: 80, textAlign: 'right' }}>Criteria</th>
              <th style={{ ...HEADER_CELL, width: 80, textAlign: 'right' }}>Hard</th>
              <th style={{ ...HEADER_CELL, width: 80, textAlign: 'right' }}>Soft</th>
              <th style={{ ...HEADER_CELL, width: 80, textAlign: 'right' }}>Hard %</th>
            </tr>
          </thead>
          <tbody>
            {sequences.map((ps) => {
              const total = ps.hardCount + ps.softCount;
              const pct = total === 0 ? 0 : Math.round((ps.hardCount / total) * 100);
              return (
                <tr key={ps.pattern.patternId}>
                  <td style={BODY_CELL}>
                    <span style={{ fontWeight: 600 }}>{ps.pattern.title}</span>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        color: `${COLORS.ink}88`,
                        marginLeft: 8,
                      }}
                    >
                      {ps.pattern.patternId}
                    </span>
                  </td>
                  <td style={{ ...MONO_CELL, textAlign: 'right' }}>{total}</td>
                  <td style={{ ...MONO_CELL, textAlign: 'right', fontWeight: 700 }}>
                    {ps.hardCount}
                  </td>
                  <td style={{ ...MONO_CELL, textAlign: 'right' }}>{ps.softCount}</td>
                  <td style={{ ...MONO_CELL, textAlign: 'right' }}>{pct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GateSequencePage() {
  const sequences = buildPatternSequences();

  const totalCriteria = sequences.reduce(
    (acc, ps) => acc + ps.hardCount + ps.softCount,
    0,
  );
  const totalHard = sequences.reduce((acc, ps) => acc + ps.hardCount, 0);

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
        eyebrow="Reasoning · Gate sequence"
        title="Recommended evaluation order"
        subtitle="Gate criteria sorted by stage order then type — hard gates evaluated first within each stage, followed by soft gates. Sequence numbers reset per pattern."
      >
        <SummaryStrip
          patternCount={sequences.length}
          totalCriteria={totalCriteria}
          hardCount={totalHard}
        />

        {sequences.map((ps) => (
          <div key={ps.pattern.patternId} style={{ display: 'contents' }}>
            <SequenceTable ps={ps} />
          </div>
        ))}

        <SequenceSummary sequences={sequences} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
