// /admin/reasoning/patterns — Lifecycle pattern data-dictionary.
//
// Server component. Loads all registered lifecycle patterns (source + program),
// computes stage / gate / contradiction / failure-mode counts per pattern, and
// cross-references every pattern against the source-event and program instance
// catalogues to show which instances are bound to each pattern.
//
// The admin layout enforces dynamic rendering via `force-dynamic`.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pattern explorer | AbarVa Admin',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface PatternSummary {
  pattern: LifecyclePatternSeed;
  stageCount: number;
  totalGateCriteria: number;
  hardGateCount: number;
  softGateCount: number;
  contradictionTemplateCount: number;
  failureModeCount: number;
  instanceCount: number;
  instanceLabels: string[];
  stageBreakdowns: Array<{
    stageId: string;
    stageLabel: string;
    hardCount: number;
    softCount: number;
  }>;
  firstThreeContradictions: Array<{ id: string; label: string }>;
  extraContradictionCount: number;
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function buildPatternSummaries(): PatternSummary[] {
  const patterns = getAllLifecyclePatterns();

  // Build patternId → instance label[] map from both catalogues.
  const instancesByPattern = new Map<string, string[]>();

  for (const inst of SOURCE_EVENT_INSTANCES) {
    const existing = instancesByPattern.get(inst.patternId) ?? [];
    existing.push(inst.name);
    instancesByPattern.set(inst.patternId, existing);
  }

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const existing = instancesByPattern.get(inst.patternId) ?? [];
    existing.push(inst.name);
    instancesByPattern.set(inst.patternId, existing);
  }

  return patterns.map((pattern) => {
    const gc = pattern.gateCriteria ?? [];
    const hardGateCount = gc.filter((c) => c.gateType === 'hard').length;
    const softGateCount = gc.filter((c) => c.gateType !== 'hard').length;

    // Per-stage gate breakdown — count hard/soft for each stage.
    const stageBreakdowns = (pattern.stages ?? []).map((stage) => {
      const stageGates = gc.filter((c) => c.stageId === stage.id);
      return {
        stageId: stage.id,
        stageLabel: stage.label,
        hardCount: stageGates.filter((c) => c.gateType === 'hard').length,
        softCount: stageGates.filter((c) => c.gateType !== 'hard').length,
      };
    });

    const templates = pattern.contradictionTemplates ?? [];
    const firstThreeContradictions = templates.slice(0, 3).map((t) => ({
      id: t.id,
      label: t.label,
    }));
    const extraContradictionCount = Math.max(0, templates.length - 3);

    const instanceLabels = instancesByPattern.get(pattern.patternId) ?? [];

    return {
      pattern,
      stageCount: (pattern.stages ?? []).length,
      totalGateCriteria: gc.length,
      hardGateCount,
      softGateCount,
      contradictionTemplateCount: templates.length,
      failureModeCount: (pattern.failureModes ?? []).length,
      instanceCount: instanceLabels.length,
      instanceLabels,
      stageBreakdowns,
      firstThreeContradictions,
      extraContradictionCount,
    };
  });
}

// ─── Pill chip component ──────────────────────────────────────────────────────

function Chip({
  label,
  bg,
  color,
  border,
}: {
  label: string;
  bg: string;
  color: string;
  border: string;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: RADIUS.pill,
        background: bg,
        border: `1px solid ${border}`,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        color,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

// ─── Pattern card ─────────────────────────────────────────────────────────────

function PatternCard({ summary }: { summary: PatternSummary }) {
  const { pattern } = summary;

  return (
    <div
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
      {/* Header row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 18,
            fontWeight: 600,
            color: COLORS.ink,
            letterSpacing: '-0.01em',
            lineHeight: 1.25,
          }}
        >
          {pattern.title}
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}66`,
            letterSpacing: '0.04em',
          }}
        >
          {pattern.patternId} · v{pattern.version}
        </div>
      </div>

      {/* Stat pill row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING.xs }}>
        <Chip
          label={`${summary.stageCount} stage${summary.stageCount !== 1 ? 's' : ''}`}
          bg={COLORS.skyPale}
          color={COLORS.navy}
          border={`${COLORS.navy}33`}
        />
        <Chip
          label={`${summary.hardGateCount} hard gate${summary.hardGateCount !== 1 ? 's' : ''}`}
          bg={COLORS.coralSoft}
          color={`${COLORS.ink}`}
          border={`${COLORS.ink}1a`}
        />
        <Chip
          label={`${summary.softGateCount} soft gate${summary.softGateCount !== 1 ? 's' : ''}`}
          bg={COLORS.amberSoft}
          color={`${COLORS.ink}`}
          border={`${COLORS.ink}1a`}
        />
        <Chip
          label={`${summary.contradictionTemplateCount} contradiction${summary.contradictionTemplateCount !== 1 ? 's' : ''}`}
          bg={COLORS.mintSoft}
          color={COLORS.mintInk}
          border={`${COLORS.mintInk}22`}
        />
        <Chip
          label={`${summary.failureModeCount} failure mode${summary.failureModeCount !== 1 ? 's' : ''}`}
          bg={`${COLORS.ink}08`}
          color={`${COLORS.ink}cc`}
          border={`${COLORS.ink}14`}
        />
        <Chip
          label={`${summary.instanceCount} instance${summary.instanceCount !== 1 ? 's' : ''}`}
          bg={summary.instanceCount > 0 ? COLORS.skyPale : `${COLORS.ink}06`}
          color={summary.instanceCount > 0 ? COLORS.navy : `${COLORS.ink}55`}
          border={summary.instanceCount > 0 ? `${COLORS.navy}33` : `${COLORS.ink}14`}
        />
      </div>

      {/* Stage breakdown table */}
      {summary.stageBreakdowns.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            paddingTop: SPACING.xs,
            borderTop: `1px solid ${COLORS.ink}0e`,
          }}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: `${COLORS.ink}66`,
              fontWeight: 600,
              marginBottom: 2,
            }}
          >
            Stages
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '4px 12px',
            }}
          >
            {summary.stageBreakdowns.map((stage) => (
              <div
                key={stage.stageId}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 6,
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: COLORS.ink,
                }}
              >
                <span style={{ fontWeight: 500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {stage.stageLabel}
                </span>
                <span style={{ color: `${COLORS.ink}66`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {stage.hardCount}H / {stage.softCount}S
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Contradiction templates */}
      {summary.contradictionTemplateCount > 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            paddingTop: SPACING.xs,
            borderTop: `1px solid ${COLORS.ink}0e`,
          }}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: `${COLORS.ink}66`,
              fontWeight: 600,
              marginBottom: 2,
            }}
          >
            Contradiction templates
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {summary.firstThreeContradictions.map((t) => (
              <span
                key={t.id}
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: COLORS.ink,
                  background: `${COLORS.ink}06`,
                  border: `1px solid ${COLORS.ink}12`,
                  borderRadius: RADIUS.sm,
                  padding: '2px 8px',
                }}
              >
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 10,
                    color: `${COLORS.ink}66`,
                    marginRight: 5,
                  }}
                >
                  {t.id}
                </span>
                {t.label}
              </span>
            ))}
            {summary.extraContradictionCount > 0 ? (
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: `${COLORS.ink}66`,
                  padding: '2px 8px',
                  fontStyle: 'italic',
                }}
              >
                &hellip;and {summary.extraContradictionCount} more
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Instance list */}
      {summary.instanceLabels.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            paddingTop: SPACING.xs,
            borderTop: `1px solid ${COLORS.ink}0e`,
          }}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: `${COLORS.ink}66`,
              fontWeight: 600,
              marginBottom: 2,
            }}
          >
            Instances
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}cc`,
              lineHeight: 1.5,
            }}
          >
            {summary.instanceLabels.join(', ')}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PatternExplorerPage() {
  const summaries = buildPatternSummaries();

  const totalGateCriteria = summaries.reduce((acc, s) => acc + s.totalGateCriteria, 0);
  const totalContradictions = summaries.reduce((acc, s) => acc + s.contradictionTemplateCount, 0);

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open reasoning telemetry"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Pattern explorer"
        title="Pattern explorer"
        subtitle="Data-dictionary view of all registered lifecycle patterns — stages, gate criteria, contradiction templates, and instance bindings."
      >
        {/* Summary strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.md,
            flexWrap: 'wrap',
            padding: `${SPACING.sm} ${SPACING.md}`,
            background: COLORS.skyPale,
            border: `1px solid ${COLORS.navy}22`,
            borderRadius: RADIUS.lg,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: COLORS.navy,
            fontWeight: 600,
          }}
        >
          <span>{summaries.length} patterns</span>
          <span style={{ color: `${COLORS.navy}44` }}>·</span>
          <span>{totalGateCriteria} total gate criteria</span>
          <span style={{ color: `${COLORS.navy}44` }}>·</span>
          <span>{totalContradictions} contradiction templates</span>
        </div>

        {/* Back link */}
        <a
          href="/admin/reasoning"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: SPACING.sm,
            background: COLORS.white,
            border: `1px solid ${COLORS.ink}22`,
            borderRadius: RADIUS.lg,
            padding: `${SPACING.sm} ${SPACING.md}`,
            textDecoration: 'none',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: COLORS.ink,
            alignSelf: 'flex-start',
          }}
        >
          <span style={{ fontWeight: 600 }}>Back to reasoning telemetry</span>
        </a>

        {/* Pattern cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
          {summaries.map((s) => (
            <PatternCard key={String(s.pattern.patternId)} summary={s} />
          ))}
        </div>
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
