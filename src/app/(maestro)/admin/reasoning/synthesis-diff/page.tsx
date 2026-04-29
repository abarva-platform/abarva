// /admin/reasoning/synthesis-diff — Before/after synthesis confidence comparison.
//
// Pure server component. For every SOURCE_EVENT_INSTANCE and
// APEX_RETAIL_PROGRAM_INSTANCE that has in-memory evidence ingestions or
// resolved contradictions, computes:
//   • "before" context — base instance data without ingested evidence
//   • "after"  context — current context enriched with ingested evidence
// Then uses computeSynthesisDiff + computeSynthesisConfidence to build a
// per-instance diff table. Instances with no changes appear in a separate
// "no changes" section.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';
import { computeSynthesisConfidence } from '@/lib/reasoning/synthesis-confidence';
import {
  computeSynthesisDiff,
  simulateBeforeContext,
  isSynthesisDiffEmpty,
  type SynthesisDiff,
} from '@/lib/reasoning/synthesis-diff';
import { getEvidenceFor } from '@/lib/reasoning/evidence-ingestion-store';
import { getResolved } from '@/lib/reasoning/contradiction-resolution-state';
import type { SynthesisContext } from '@/lib/reasoning/types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Synthesis diff · AbarVa Admin',
};

// ─── Data model ───────────────────────────────────────────────────────────────

interface InstanceDiffRow {
  id: string;
  name: string;
  type: 'source' | 'program';
  currentStage: string;
  beforeScore: number;
  afterScore: number;
  delta: number;
  diff: SynthesisDiff;
}

interface InstanceNoChangeRow {
  id: string;
  name: string;
  type: 'source' | 'program';
  currentStage: string;
  currentScore: number;
}

interface PageData {
  diffRows: InstanceDiffRow[];
  noChangeRows: InstanceNoChangeRow[];
  avgDelta: number;
}

// ─── Data computation ─────────────────────────────────────────────────────────

function computePageData(): PageData {
  const diffRows: InstanceDiffRow[] = [];
  const noChangeRows: InstanceNoChangeRow[] = [];

  // ── Source instances ──────────────────────────────────────────────────────
  for (const inst of SOURCE_EVENT_INSTANCES) {
    const pattern = SOURCE_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    if (!pattern) continue;

    const evidenceCount = getEvidenceFor(inst.id).length;
    const afterCtx: SynthesisContext = buildSourceSynthesisContext(inst, pattern);
    const afterScore = computeSynthesisConfidence(afterCtx).score;

    if (evidenceCount === 0) {
      // No ingested evidence — no diff possible; show as no-change row
      noChangeRows.push({
        id: inst.id,
        name: inst.name,
        type: 'source',
        currentStage: inst.currentStage,
        currentScore: afterScore,
      });
      continue;
    }

    // Simulate "before" by stripping ingested evidence: use simulateBeforeContext
    // which removes the last citation and approximates the lower-evidence state.
    const beforeCtx: SynthesisContext = simulateBeforeContext(afterCtx);
    const beforeScore = computeSynthesisConfidence(beforeCtx).score;
    const diff = computeSynthesisDiff(beforeCtx, afterCtx);

    if (isSynthesisDiffEmpty(diff)) {
      noChangeRows.push({
        id: inst.id,
        name: inst.name,
        type: 'source',
        currentStage: inst.currentStage,
        currentScore: afterScore,
      });
      continue;
    }

    diffRows.push({
      id: inst.id,
      name: inst.name,
      type: 'source',
      currentStage: inst.currentStage,
      beforeScore,
      afterScore,
      delta: diff.confidenceDelta,
      diff,
    });
  }

  // ── Program instances ─────────────────────────────────────────────────────
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const pattern = PROGRAM_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);

    const evidenceCount = getEvidenceFor(inst.id).length;
    const afterCtx: SynthesisContext = buildProgramSynthesisContext(inst, pattern);
    const afterScore = computeSynthesisConfidence(afterCtx).score;
    const stageLabel = `P${inst.currentPhase}`;

    if (evidenceCount === 0) {
      noChangeRows.push({
        id: inst.id,
        name: inst.name,
        type: 'program',
        currentStage: stageLabel,
        currentScore: afterScore,
      });
      continue;
    }

    const beforeCtx: SynthesisContext = simulateBeforeContext(afterCtx);
    const beforeScore = computeSynthesisConfidence(beforeCtx).score;
    const diff = computeSynthesisDiff(beforeCtx, afterCtx);

    if (isSynthesisDiffEmpty(diff)) {
      noChangeRows.push({
        id: inst.id,
        name: inst.name,
        type: 'program',
        currentStage: stageLabel,
        currentScore: afterScore,
      });
      continue;
    }

    diffRows.push({
      id: inst.id,
      name: inst.name,
      type: 'program',
      currentStage: stageLabel,
      beforeScore,
      afterScore,
      delta: diff.confidenceDelta,
      diff,
    });
  }

  // Sort diff rows by delta descending (most improved first)
  diffRows.sort((a, b) => b.delta - a.delta);

  const avgDelta =
    diffRows.length === 0
      ? 0
      : Math.round(diffRows.reduce((sum, r) => sum + r.delta, 0) / diffRows.length);

  return { diffRows, noChangeRows, avgDelta };
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
  whiteSpace: 'nowrap',
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 13,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'middle',
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 12,
  color: `${COLORS.ink}cc`,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypePill({ type }: { type: 'source' | 'program' }) {
  const isSource = type === 'source';
  return (
    <span
      style={{
        display: 'inline-block',
        background: isSource ? COLORS.skyPale : COLORS.mintSoft,
        color: isSource ? COLORS.navy : '#1B5E20',
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      {isSource ? 'source' : 'program'}
    </span>
  );
}

function ScoreBar({ score, max = 100 }: { score: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (score / max) * 100));
  const color =
    score >= 75 ? '#1B5E20' : score >= 45 ? '#7A4F01' : '#8B1F0F';
  const bg = score >= 75 ? COLORS.mintSoft : score >= 45 ? COLORS.amberSoft : COLORS.coralSoft;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width: 80,
          height: 6,
          background: `${COLORS.ink}14`,
          borderRadius: RADIUS.pill,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            borderRadius: RADIUS.pill,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 12,
          color,
          background: bg,
          borderRadius: RADIUS.sm,
          padding: '1px 6px',
          minWidth: 28,
          textAlign: 'right',
        }}
      >
        {score}
      </span>
    </div>
  );
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 12, color: `${COLORS.ink}66` }}>
        ±0
      </span>
    );
  }
  const positive = delta > 0;
  return (
    <span
      style={{
        display: 'inline-block',
        background: positive ? COLORS.mintSoft : COLORS.coralSoft,
        color: positive ? '#1B5E20' : '#8B1F0F',
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {positive ? '+' : ''}{delta}
    </span>
  );
}

function GateFactorCell({ gates }: { gates: string[] }) {
  if (gates.length === 0) {
    return (
      <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}44` }}>
        —
      </span>
    );
  }
  return (
    <span
      style={{
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 12,
        color: COLORS.ink,
        lineHeight: 1.4,
      }}
    >
      {gates[0]}
      {gates.length > 1 ? (
        <span style={{ color: `${COLORS.ink}66`, marginLeft: 4 }}>+{gates.length - 1} more</span>
      ) : null}
    </span>
  );
}

function SummaryStrip({
  diffCount,
  avgDelta,
  noChangeCount,
}: {
  diffCount: number;
  avgDelta: number;
  noChangeCount: number;
}) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: SPACING.lg,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
          Instances with diffs
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
          {diffCount}
        </span>
      </div>
      <div
        style={{
          width: 1,
          height: 48,
          background: `${COLORS.ink}14`,
          flexShrink: 0,
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
          Avg confidence improvement
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 32,
            color: avgDelta >= 0 ? '#1B5E20' : '#8B1F0F',
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
          }}
        >
          {avgDelta >= 0 ? '+' : ''}{avgDelta}%
        </span>
      </div>
      <div
        style={{
          width: 1,
          height: 48,
          background: `${COLORS.ink}14`,
          flexShrink: 0,
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
          No changes
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 32,
            color: `${COLORS.ink}88`,
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
          }}
        >
          {noChangeCount}
        </span>
      </div>
    </div>
  );
}

function DiffTable({ rows }: { rows: InstanceDiffRow[] }) {
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
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Confidence diff
        </h2>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>
          {rows.length} instance{rows.length === 1 ? '' : 's'} with evidence ingestions
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Instance</th>
              <th style={HEADER_CELL}>Type</th>
              <th style={HEADER_CELL}>Stage</th>
              <th style={HEADER_CELL}>Before</th>
              <th style={HEADER_CELL}>After</th>
              <th style={HEADER_CELL}>Delta</th>
              <th style={HEADER_CELL}>Top improved gate</th>
              <th style={HEADER_CELL}>Top worsened gate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const improvedGates = row.diff.gatesImproved.map(
                (g) => ('description' in g ? (g as unknown as { description: string }).description : g.criterionId),
              );
              const worsenedGates = row.diff.gatesWorsened.map(
                (g) => ('description' in g ? (g as unknown as { description: string }).description : g.criterionId),
              );
              return (
                <tr key={row.id}>
                  <td style={BODY_CELL}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.sans,
                          fontSize: 13,
                          fontWeight: 600,
                          color: COLORS.ink,
                        }}
                      >
                        {row.name}
                      </span>
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 10,
                          color: `${COLORS.ink}66`,
                        }}
                      >
                        {row.id}
                      </span>
                    </div>
                  </td>
                  <td style={BODY_CELL}>
                    <TypePill type={row.type} />
                  </td>
                  <td style={MONO_CELL}>{row.currentStage}</td>
                  <td style={BODY_CELL}>
                    <ScoreBar score={row.beforeScore} />
                  </td>
                  <td style={BODY_CELL}>
                    <ScoreBar score={row.afterScore} />
                  </td>
                  <td style={BODY_CELL}>
                    <DeltaBadge delta={row.delta} />
                  </td>
                  <td style={BODY_CELL}>
                    <GateFactorCell gates={improvedGates} />
                  </td>
                  <td style={BODY_CELL}>
                    <GateFactorCell gates={worsenedGates} />
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

function EvidenceDetailStrip({ row }: { row: InstanceDiffRow }) {
  const { diff } = row;
  const hasContradictionChanges =
    diff.newContradictions.length > 0 || diff.resolvedContradictions.length > 0;

  if (!hasContradictionChanges && diff.evidenceDelta === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        padding: `${SPACING.sm} ${SPACING.md}`,
        background: `${COLORS.ink}05`,
        borderTop: `1px solid ${COLORS.ink}0a`,
      }}
    >
      {diff.evidenceDelta !== 0 ? (
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}99`,
          }}
        >
          Evidence: {diff.evidenceDelta > 0 ? '+' : ''}{diff.evidenceDelta} citations
        </span>
      ) : null}
      {diff.resolvedContradictions.length > 0 ? (
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: '#1B5E20',
          }}
        >
          {diff.resolvedContradictions.length} contradiction{diff.resolvedContradictions.length === 1 ? '' : 's'} resolved
        </span>
      ) : null}
      {diff.newContradictions.length > 0 ? (
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: '#8B1F0F',
          }}
        >
          {diff.newContradictions.length} new contradiction{diff.newContradictions.length === 1 ? '' : 's'}
        </span>
      ) : null}
    </div>
  );
}

function ExpandedDiffSection({ rows }: { rows: InstanceDiffRow[] }) {
  if (rows.length === 0) return null;
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
          Per-instance diff detail
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Evidence ingestion counts and contradiction state changes
        </div>
      </header>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {rows.map((row) => (
          <div
            key={row.id}
            style={{
              borderBottom: `1px solid ${COLORS.ink}0a`,
            }}
          >
            <div
              style={{
                padding: `${SPACING.sm} ${SPACING.md}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: SPACING.md,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
                <TypePill type={row.type} />
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.ink,
                  }}
                >
                  {row.name}
                </span>
              </div>
              <DeltaBadge delta={row.delta} />
            </div>
            <EvidenceDetailStrip row={row} />
          </div>
        ))}
      </div>
    </section>
  );
}

function NoChangesSection({ rows }: { rows: InstanceNoChangeRow[] }) {
  if (rows.length === 0) return null;
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
            No changes
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Instances with no evidence ingestions — showing current confidence score
          </div>
        </div>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>
          {rows.length} instance{rows.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Instance</th>
              <th style={HEADER_CELL}>Type</th>
              <th style={HEADER_CELL}>Stage</th>
              <th style={HEADER_CELL}>Current confidence</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td style={BODY_CELL}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 13,
                        fontWeight: 600,
                        color: COLORS.ink,
                      }}
                    >
                      {row.name}
                    </span>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        color: `${COLORS.ink}66`,
                      }}
                    >
                      {row.id}
                    </span>
                  </div>
                </td>
                <td style={BODY_CELL}>
                  <TypePill type={row.type} />
                </td>
                <td style={MONO_CELL}>{row.currentStage}</td>
                <td style={BODY_CELL}>
                  <ScoreBar score={row.currentScore} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px dashed ${COLORS.ink}33`,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        textAlign: 'center',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 14,
        color: `${COLORS.ink}aa`,
        lineHeight: 1.6,
      }}
    >
      No instances have evidence ingestions yet. Use the{' '}
      <a
        href="/admin/reasoning/evidence-ingest"
        style={{ color: COLORS.navy, textDecoration: 'underline' }}
      >
        Evidence ingest
      </a>{' '}
      tool to add evidence items and see how synthesis confidence changes.
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SynthesisDiffPage() {
  const { diffRows, noChangeRows, avgDelta } = computePageData();
  const isEmpty = diffRows.length === 0 && noChangeRows.length === 0;

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Evidence ingest"
          primaryActionHref="/admin/reasoning/evidence-ingest"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Synthesis diff"
        subtitle="Before/after synthesis confidence comparison for instances with evidence ingestions or contradiction resolutions. Scores are computed from live in-memory state — add evidence via the Evidence ingest tool and return here to see the delta."
      >
        {isEmpty ? (
          <EmptyState />
        ) : (
          <>
            <SummaryStrip
              diffCount={diffRows.length}
              avgDelta={avgDelta}
              noChangeCount={noChangeRows.length}
            />
            {diffRows.length > 0 ? (
              <>
                <DiffTable rows={diffRows} />
                <ExpandedDiffSection rows={diffRows} />
              </>
            ) : null}
            <NoChangesSection rows={noChangeRows} />
          </>
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
