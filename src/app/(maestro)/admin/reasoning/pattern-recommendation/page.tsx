// /admin/reasoning/pattern-recommendation — Jaccard-based co-apply suggestions.
//
// Pure server component. For every fixture instance it computes a compatibility
// score between the instance's active lifecycle pattern and every other pattern
// using stage-name overlap (Jaccard intersection / union).
//
// Sections:
//   HowItWorksCallout      — explanation of the scoring method
//   InstanceRecommendations — one card per instance, top-3 suggestions
//   CrossPatternMatrix      — N×N compatibility heat-map (capped at 8×8)

import React from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';
import type { InstanceHealthRow } from '@/lib/reasoning/health-board';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pattern Recommendations · AbarVa Admin',
};

// ─── Compatibility scoring ────────────────────────────────────────────────────

function compatibilityScore(patternA: LifecyclePatternSeed, patternB: LifecyclePatternSeed): number {
  const stagesA = new Set((patternA.stages ?? []).map((s) => s.label?.toLowerCase() ?? ''));
  const stagesB = new Set((patternB.stages ?? []).map((s) => s.label?.toLowerCase() ?? ''));
  const intersection = [...stagesA].filter((s) => stagesB.has(s)).length;
  const union = new Set([...stagesA, ...stagesB]).size;
  return union === 0 ? 0 : Math.round((intersection / union) * 100);
}

function sharedStageCount(patternA: LifecyclePatternSeed, patternB: LifecyclePatternSeed): number {
  const stagesA = new Set((patternA.stages ?? []).map((s) => s.label?.toLowerCase() ?? ''));
  const stagesB = new Set((patternB.stages ?? []).map((s) => s.label?.toLowerCase() ?? ''));
  return [...stagesA].filter((s) => stagesB.has(s)).length;
}

function unionStageCount(patternA: LifecyclePatternSeed, patternB: LifecyclePatternSeed): number {
  const stagesA = (patternA.stages ?? []).map((s) => s.label?.toLowerCase() ?? '');
  const stagesB = (patternB.stages ?? []).map((s) => s.label?.toLowerCase() ?? '');
  return new Set([...stagesA, ...stagesB]).size;
}

// ─── Instance → pattern resolution ──────────────────────────────────────────

function resolvePatternForInstance(
  instanceId: string,
  instanceType: 'source' | 'program',
  patterns: LifecyclePatternSeed[],
  index: number,
): LifecyclePatternSeed {
  // Try to find a patternId on the raw instance fixture
  if (instanceType === 'source') {
    const raw = SOURCE_EVENT_INSTANCES.find((i) => i.id === instanceId);
    if (raw?.patternId) {
      const found = patterns.find((p) => p.patternId === raw.patternId || p.id === raw.patternId);
      if (found) return found;
    }
  } else {
    const raw = APEX_RETAIL_PROGRAM_INSTANCES.find((i) => i.id === instanceId);
    if (raw?.patternId) {
      const found = patterns.find((p) => p.patternId === raw.patternId || p.id === raw.patternId);
      if (found) return found;
    }
  }
  // Round-robin fallback
  return patterns[index % patterns.length];
}

// ─── Score chip color ─────────────────────────────────────────────────────────

function scoreColor(score: number): { bg: string; text: string; border: string } {
  if (score >= 60) {
    return { bg: COLORS.mintSoft, text: COLORS.mintInk, border: `${COLORS.mintInk}33` };
  }
  if (score >= 30) {
    return { bg: COLORS.amberSoft, text: COLORS.amberInk, border: `${COLORS.amberInk}33` };
  }
  return { bg: COLORS.coralSoft, text: COLORS.coralInk, border: `${COLORS.coralInk}33` };
}

function matrixCellColor(score: number): string {
  if (score >= 60) return COLORS.mintSoft;
  if (score >= 30) return COLORS.amberSoft;
  return COLORS.coralSoft;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function HowItWorksCallout() {
  return (
    <div
      style={{
        background: SHELL.BLUE_BG,
        border: `1px solid ${SHELL.BLUE_LINE}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
      }}
    >
      <p
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: COLORS.navy,
          fontStyle: 'italic',
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        Recommendations are based on stage-name overlap between the instance&rsquo;s active pattern
        and all available patterns. Higher overlap = stronger compatibility. Scores use Jaccard
        similarity: intersection of shared stage names divided by union of all stage names, expressed
        as a percentage.
      </p>
    </div>
  );
}

interface Recommendation {
  pattern: LifecyclePatternSeed;
  score: number;
  shared: number;
  total: number;
}

interface InstanceCardProps {
  row: InstanceHealthRow;
  currentPattern: LifecyclePatternSeed;
  recommendations: Recommendation[];
}

function HealthBadge({ label }: { label: InstanceHealthRow['healthLabel'] }) {
  const map: Record<InstanceHealthRow['healthLabel'], { bg: string; text: string; border: string }> = {
    healthy: { bg: COLORS.mintSoft, text: COLORS.mintInk, border: `${COLORS.mintInk}33` },
    warning: { bg: COLORS.amberSoft, text: COLORS.amberInk, border: `${COLORS.amberInk}33` },
    critical: { bg: COLORS.coralSoft, text: COLORS.coralInk, border: `${COLORS.coralInk}33` },
    unknown: { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT, border: SHELL.GRAY_LINE },
  };
  const c = map[label];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: RADIUS.pill,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
      }}
    >
      {label}
    </span>
  );
}

function InstanceCard({ row, currentPattern, recommendations }: InstanceCardProps) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
          marginBottom: SPACING.sm,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 14,
            fontWeight: 600,
            color: COLORS.ink,
          }}
        >
          {row.label}
        </span>
        <HealthBadge label={row.healthLabel} />
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: SHELL.INK_SOFT,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {row.type}
        </span>
      </div>

      {/* Current pattern */}
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          color: SHELL.INK_MID,
          fontStyle: 'italic',
          marginBottom: SPACING.md,
        }}
      >
        Active pattern: {currentPattern.title}
      </div>

      {/* Recommendations */}
      {recommendations.length === 0 ? (
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: SHELL.GRAY_TEXT,
            fontStyle: 'italic',
          }}
        >
          No compatible patterns found
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
          {recommendations.map((rec) => {
            const c = scoreColor(rec.score);
            return (
              <div
                key={rec.pattern.patternId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: SPACING.sm,
                  background: SHELL.GRAY_BG,
                  borderRadius: RADIUS.md,
                  padding: `${SPACING.sm} ${SPACING.md}`,
                  flexWrap: 'wrap',
                }}
              >
                {/* Score badge */}
                <span
                  style={{
                    display: 'inline-block',
                    minWidth: 40,
                    textAlign: 'center',
                    padding: '2px 8px',
                    borderRadius: RADIUS.pill,
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 11,
                    fontWeight: 700,
                    background: c.bg,
                    color: c.text,
                    border: `1px solid ${c.border}`,
                  }}
                >
                  {rec.score}%
                </span>
                {/* Pattern name */}
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 13,
                    fontWeight: 500,
                    color: COLORS.ink,
                    flex: 1,
                  }}
                >
                  {rec.pattern.title}
                </span>
                {/* Rationale */}
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 11,
                    color: SHELL.INK_SOFT,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Shares {rec.shared} of {rec.total} stages
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface CrossPatternMatrixProps {
  patterns: LifecyclePatternSeed[];
}

function CrossPatternMatrix({ patterns }: CrossPatternMatrixProps) {
  const capped = patterns.slice(0, 8);

  return (
    <div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: COLORS.navy,
          marginBottom: SPACING.md,
        }}
      >
        Cross-pattern compatibility matrix
        {patterns.length > 8 && (
          <span
            style={{
              fontWeight: 400,
              color: SHELL.INK_SOFT,
              marginLeft: SPACING.sm,
              textTransform: 'none',
              letterSpacing: 0,
            }}
          >
            (showing first 8 of {patterns.length})
          </span>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            borderCollapse: 'collapse',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            tableLayout: 'fixed',
            minWidth: capped.length * 68 + 160,
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  width: 160,
                  padding: `${SPACING.xs} ${SPACING.sm}`,
                  textAlign: 'left',
                  color: SHELL.INK_SOFT,
                  fontWeight: 600,
                  borderBottom: `1px solid ${COLORS.ink}14`,
                }}
              >
                Pattern
              </th>
              {capped.map((p) => (
                <th
                  key={p.patternId}
                  style={{
                    width: 68,
                    padding: `${SPACING.xs} 2px`,
                    textAlign: 'center',
                    color: SHELL.INK_SOFT,
                    fontWeight: 500,
                    fontSize: 10,
                    borderBottom: `1px solid ${COLORS.ink}14`,
                    maxWidth: 68,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={p.title}
                >
                  {p.patternId.slice(-6)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {capped.map((rowPattern, ri) => (
              <tr key={rowPattern.patternId}>
                <td
                  style={{
                    padding: `${SPACING.xs} ${SPACING.sm}`,
                    fontWeight: 500,
                    color: COLORS.ink,
                    borderBottom: `1px solid ${COLORS.ink}0a`,
                    maxWidth: 160,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={rowPattern.title}
                >
                  {rowPattern.title}
                </td>
                {capped.map((colPattern, ci) => {
                  const isDiagonal = ri === ci;
                  const score = isDiagonal ? -1 : compatibilityScore(rowPattern, colPattern);
                  return (
                    <td
                      key={colPattern.patternId}
                      style={{
                        padding: `${SPACING.xs} 2px`,
                        textAlign: 'center',
                        background: isDiagonal ? SHELL.GRAY_BG : matrixCellColor(score),
                        borderBottom: `1px solid ${COLORS.ink}0a`,
                        fontWeight: isDiagonal ? 400 : score >= 60 ? 700 : 500,
                        color: isDiagonal
                          ? SHELL.INK_MUTED
                          : score >= 60
                          ? COLORS.mintInk
                          : score >= 30
                          ? COLORS.amberInk
                          : COLORS.coralInk,
                        fontSize: 11,
                      }}
                    >
                      {isDiagonal ? '—' : `${score}%`}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PatternRecommendationPage() {
  const allPatterns = getAllLifecyclePatterns();
  const rows = buildHealthBoardRows();

  // Build per-instance data
  const instanceData = rows.map((row, index) => {
    const currentPattern = resolvePatternForInstance(row.id, row.type, allPatterns, index);

    // Score against all OTHER patterns
    const scored = allPatterns
      .filter((p) => p.patternId !== currentPattern.patternId)
      .map((p) => ({
        pattern: p,
        score: compatibilityScore(currentPattern, p),
        shared: sharedStageCount(currentPattern, p),
        total: unionStageCount(currentPattern, p),
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return { row, currentPattern, recommendations: scored };
  });

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
        eyebrow="Reasoning · Patterns"
        title="Pattern Recommendations"
        subtitle="Suggested co-apply patterns by instance, ranked by structural compatibility"
      >
        {/* Section 1: How it works */}
        <HowItWorksCallout />

        {/* Section 2: Instance recommendation cards */}
        <div style={{ marginBottom: SPACING.xl }}>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: COLORS.navy,
              marginBottom: SPACING.md,
            }}
          >
            Instance recommendations
            <span
              style={{
                fontWeight: 400,
                color: SHELL.INK_SOFT,
                marginLeft: SPACING.sm,
                textTransform: 'none',
                letterSpacing: 0,
              }}
            >
              ({instanceData.length} instances)
            </span>
          </div>

          {instanceData.map((item) => (
            <div key={item.row.id}>
              <InstanceCard
                row={item.row}
                currentPattern={item.currentPattern}
                recommendations={item.recommendations}
              />
            </div>
          ))}
        </div>

        {/* Section 3: Cross-pattern compatibility matrix */}
        <div
          style={{
            background: COLORS.white,
            border: `1px solid ${COLORS.ink}14`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
          }}
        >
          <CrossPatternMatrix patterns={allPatterns} />
        </div>
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
