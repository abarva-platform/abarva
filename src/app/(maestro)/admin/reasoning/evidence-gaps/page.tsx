// /admin/reasoning/evidence-gaps — Portfolio-level evidence gap report.
//
// Server component. Iterates over every source event instance and program
// instance, calls buildEvidenceSuggestions for each, and surfaces instances
// that have high-priority evidence gaps (unmet hard gate criteria).
//
// Renders:
//   - 3 summary metric cards
//   - Main table of instances with high-priority gaps, sorted by gap count
//   - All-clear banner for gap-free instances
//   - Full empty state if no high-priority gaps exist anywhere

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import { buildEvidenceSuggestions } from '@/lib/reasoning/evidence-suggestions';
import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';
import type { SourceEventInstance } from '@/lib/source/source-event-instance';
import type { ProgramInstance } from '@/lib/programs/program-instance';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Evidence gaps · AbarVa Admin',
};

// ─── Types ────────────────────────────────────────────────────────────────────

type InstanceType = 'source' | 'program';

interface InstanceGapRow {
  instanceId: string;
  instanceName: string;
  instanceType: InstanceType;
  phaseOrStage: string;
  highGapCount: number;
  mediumGapCount: number;
  /** First suggestion's first 2 evidence types (if any). */
  topEvidenceHints: string[];
}

// ─── Data computation ─────────────────────────────────────────────────────────

function buildPatternMap(patterns: LifecyclePatternSeed[]): Map<string, LifecyclePatternSeed> {
  const m = new Map<string, LifecyclePatternSeed>();
  for (const p of patterns) {
    m.set(p.patternId, p);
  }
  return m;
}

function currentStageLabel(instance: SourceEventInstance | ProgramInstance): string {
  if ('currentPhase' in instance && 'phases' in instance) {
    const phase = instance.phases.find((p) => p.phaseId === instance.currentPhase);
    return phase ? phase.phaseLabel : `Phase ${instance.currentPhase}`;
  }
  return (instance as SourceEventInstance).currentStage;
}

function computeGapRows(): {
  rows: InstanceGapRow[];
  allClearCount: number;
  totalHighGaps: number;
  totalMediumGaps: number;
} {
  const srcPatterns = buildPatternMap(SOURCE_LIFECYCLE_PATTERNS);
  const prgPatterns = buildPatternMap(PROGRAM_LIFECYCLE_PATTERNS);

  const rows: InstanceGapRow[] = [];
  let allClearCount = 0;
  let totalHighGaps = 0;
  let totalMediumGaps = 0;

  // Source event instances
  for (const inst of SOURCE_EVENT_INSTANCES) {
    const pattern = srcPatterns.get(inst.patternId);
    if (!pattern) continue;

    const suggestions = buildEvidenceSuggestions(inst, pattern);
    const highSuggestions = suggestions.filter((s) => s.priority === 'high');
    const mediumSuggestions = suggestions.filter((s) => s.priority === 'medium');

    totalHighGaps += highSuggestions.length;
    totalMediumGaps += mediumSuggestions.length;

    if (highSuggestions.length === 0) {
      allClearCount += 1;
      continue;
    }

    const topHints = highSuggestions[0].suggestedEvidenceTypes.slice(0, 2);

    rows.push({
      instanceId: inst.id,
      instanceName: inst.name,
      instanceType: 'source',
      phaseOrStage: inst.currentStage,
      highGapCount: highSuggestions.length,
      mediumGapCount: mediumSuggestions.length,
      topEvidenceHints: topHints,
    });
  }

  // Program instances
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const pattern = prgPatterns.get(inst.patternId);
    if (!pattern) continue;

    const suggestions = buildEvidenceSuggestions(inst, pattern);
    const highSuggestions = suggestions.filter((s) => s.priority === 'high');
    const mediumSuggestions = suggestions.filter((s) => s.priority === 'medium');

    totalHighGaps += highSuggestions.length;
    totalMediumGaps += mediumSuggestions.length;

    if (highSuggestions.length === 0) {
      allClearCount += 1;
      continue;
    }

    const topHints = highSuggestions[0].suggestedEvidenceTypes.slice(0, 2);

    rows.push({
      instanceId: inst.id,
      instanceName: inst.name,
      instanceType: 'program',
      phaseOrStage: currentStageLabel(inst),
      highGapCount: highSuggestions.length,
      mediumGapCount: mediumSuggestions.length,
      topEvidenceHints: topHints,
    });
  }

  // Sort by high gap count descending
  rows.sort((a, b) => b.highGapCount - a.highGapCount);

  return { rows, allClearCount, totalHighGaps, totalMediumGaps };
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

// ─── Components ───────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xs,
        minHeight: 120,
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
        {label}
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 36,
          color: COLORS.ink,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
        }}
      >
        {value}
      </div>
      {sub ? (
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function MetricGrid({
  instancesWithGaps,
  totalHighGaps,
  totalMediumGaps,
}: {
  instancesWithGaps: number;
  totalHighGaps: number;
  totalMediumGaps: number;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: SPACING.md,
      }}
    >
      <MetricCard
        label="Instances with gaps"
        value={instancesWithGaps}
        sub="1+ unmet hard gate criterion"
      />
      <MetricCard
        label="High-priority gaps"
        value={totalHighGaps}
        sub="Hard gate — status unmet"
      />
      <MetricCard
        label="Medium-priority gaps"
        value={totalMediumGaps}
        sub="Hard gate partial or soft gate unmet"
      />
    </div>
  );
}

function TypeBadge({ type }: { type: InstanceType }) {
  const isProgram = type === 'program';
  return (
    <span
      style={{
        display: 'inline-block',
        background: isProgram ? COLORS.skyPale : COLORS.amberSoft,
        color: isProgram ? COLORS.navy : COLORS.amberInk,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'capitalize',
        letterSpacing: '0.02em',
      }}
    >
      {type}
    </span>
  );
}

function HighCountBadge({ count }: { count: number }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: COLORS.coralSoft,
        color: COLORS.coralInk,
        borderRadius: RADIUS.pill,
        padding: '2px 12px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.02em',
      }}
    >
      {count}
    </span>
  );
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + '…';
}

function GapsTable({ rows }: { rows: InstanceGapRow[] }) {
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
            Instances with high-priority gaps
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Sorted by gap count descending · showing unmet hard gate criteria only
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {rows.length} instance{rows.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Instance</th>
              <th style={HEADER_CELL}>Type</th>
              <th style={HEADER_CELL}>Phase / Stage</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>High gaps</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>Medium gaps</th>
              <th style={HEADER_CELL}>Suggested evidence (first 2)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const hintText =
                row.topEvidenceHints.length > 0
                  ? truncate(row.topEvidenceHints.join(', '), 60)
                  : '—';
              return (
                <tr key={row.instanceId}>
                  <td style={BODY_CELL}>
                    <div style={{ fontWeight: 600 }}>{row.instanceName}</div>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        color: `${COLORS.ink}77`,
                        marginTop: 2,
                      }}
                    >
                      {row.instanceId}
                    </div>
                  </td>
                  <td style={BODY_CELL}>
                    <TypeBadge type={row.instanceType} />
                  </td>
                  <td style={MONO_CELL}>{row.phaseOrStage}</td>
                  <td
                    style={{
                      ...BODY_CELL,
                      textAlign: 'center',
                    }}
                  >
                    <HighCountBadge count={row.highGapCount} />
                  </td>
                  <td
                    style={{
                      ...MONO_CELL,
                      textAlign: 'center',
                      color: row.mediumGapCount > 0 ? COLORS.amberInk : `${COLORS.ink}55`,
                    }}
                  >
                    {row.mediumGapCount}
                  </td>
                  <td
                    style={{
                      ...BODY_CELL,
                      color: `${COLORS.ink}99`,
                      maxWidth: 260,
                    }}
                  >
                    {hintText}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AllClearBanner({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div
      style={{
        background: COLORS.mintSoft,
        border: `1px solid ${COLORS.mintInk}33`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 14,
        color: COLORS.mintInk,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.sm,
      }}
    >
      <span
        aria-hidden="true"
        style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 18, lineHeight: 1 }}
      >
        ✓
      </span>
      {count} instance{count === 1 ? '' : 's'} with no evidence gaps
    </div>
  );
}

function EmptyStateBanner() {
  return (
    <div
      style={{
        background: COLORS.mintSoft,
        border: `1px solid ${COLORS.mintInk}33`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.xl} ${SPACING.lg}`,
        textAlign: 'center',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 16,
        color: COLORS.mintInk,
        fontWeight: 600,
        lineHeight: 1.5,
      }}
    >
      All hard gate criteria are covered across all instances.
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EvidenceGapsPage() {
  const { rows, allClearCount, totalHighGaps, totalMediumGaps } = computeGapRows();
  const instancesWithGaps = rows.length;

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open Source detail"
          primaryActionHref="/source"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Evidence"
        title="Evidence gap report"
        subtitle="Portfolio-level view of unmet hard gate criteria missing evidence. Instances with at least one high-priority gap appear in the table below — sorted by gap count so the most urgent cases rise to the top."
      >
        <MetricGrid
          instancesWithGaps={instancesWithGaps}
          totalHighGaps={totalHighGaps}
          totalMediumGaps={totalMediumGaps}
        />
        {instancesWithGaps === 0 ? (
          <EmptyStateBanner />
        ) : (
          <GapsTable rows={rows} />
        )}
        <AllClearBanner count={allClearCount} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
