// /admin/reasoning/contradiction-severity — Active contradiction ranking by
// severity and health impact across all instances.
//
// Pure server component. For each instance, runs contradiction detection and
// correlates each active contradiction with the instance health score, producing
// a flat ranked list from critical down to low, with health score as secondary
// sort within each severity bucket.

import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import { buildEvidenceMap } from '@/lib/source/source-event-instance';
import { buildProgramEvidenceMap } from '@/lib/programs/program-instance';
import { createContradictionDetector } from '@/lib/reasoning/contradiction-detector';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import { computeInstanceHealth } from '@/lib/reasoning/instance-health';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';
import type { InstanceHealthLabel } from '@/lib/reasoning/health-board';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Contradiction severity · AbarVa Admin',
};

// ─── Severity ordering ─────────────────────────────────────────────────────────

const SEVERITY_RANK: Record<'low' | 'medium' | 'high', number> = {
  high: 1,
  medium: 2,
  low: 3,
};

// ─── Data types ───────────────────────────────────────────────────────────────

type SeverityLevel = 'high' | 'medium' | 'low';

interface ContradictionSeverityRow {
  instanceId: string;
  instanceName: string;
  contradictionId: string;
  templateLabel: string;
  severity: SeverityLevel;
  instanceHealthScore: number;
  instanceHealthLabel: InstanceHealthLabel;
  resolutionPath: string;
  /** Unix ms — from ContradictionDetection.detectedAt */
  detectedAt: number;
}

// ─── Data assembly ────────────────────────────────────────────────────────────

function buildSeverityRows(): ContradictionSeverityRow[] {
  const ALL_PATTERNS = [...SOURCE_LIFECYCLE_PATTERNS, ...PROGRAM_LIFECYCLE_PATTERNS];

  // Use buildHealthBoardRows() to get current health labels per instance.
  const healthBoard = buildHealthBoardRows();
  const healthLabelById = new Map<string, InstanceHealthLabel>(
    healthBoard.map((r) => [r.id, r.healthLabel]),
  );

  // Build numeric health score lookup (required for sort + display).
  const healthScoreById = new Map<string, number>();
  for (const inst of SOURCE_EVENT_INSTANCES) {
    const pattern = SOURCE_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    if (!pattern) continue;
    const ctx = buildSourceSynthesisContext(inst, pattern);
    healthScoreById.set(inst.id, computeInstanceHealth(ctx).score);
  }
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const pattern = PROGRAM_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    const ctx = buildProgramSynthesisContext(inst, pattern);
    healthScoreById.set(inst.id, computeInstanceHealth(ctx).score);
  }

  const rows: ContradictionSeverityRow[] = [];

  // Source instances
  for (const inst of SOURCE_EVENT_INSTANCES) {
    const pattern = ALL_PATTERNS.find((p) => p.patternId === inst.patternId);
    if (!pattern) continue;
    const detector = createContradictionDetector(pattern);
    const detections = detector.detect(buildEvidenceMap(inst));
    const healthScore = healthScoreById.get(inst.id) ?? 100;
    const healthLabel = healthLabelById.get(inst.id) ?? 'unknown';

    for (const d of detections) {
      rows.push({
        instanceId: inst.id,
        instanceName: inst.name,
        contradictionId: d.templateId,
        templateLabel: d.label,
        severity: d.severity,
        instanceHealthScore: healthScore,
        instanceHealthLabel: healthLabel,
        resolutionPath: d.resolutionPath,
        detectedAt: d.detectedAt,
      });
    }
  }

  // Program instances
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const pattern = ALL_PATTERNS.find((p) => p.patternId === inst.patternId);
    if (!pattern) continue;
    const detector = createContradictionDetector(pattern);
    const detections = detector.detect(buildProgramEvidenceMap(inst));
    const healthScore = healthScoreById.get(inst.id) ?? 100;
    const healthLabel = healthLabelById.get(inst.id) ?? 'unknown';

    for (const d of detections) {
      rows.push({
        instanceId: inst.id,
        instanceName: inst.name,
        contradictionId: d.templateId,
        templateLabel: d.label,
        severity: d.severity,
        instanceHealthScore: healthScore,
        instanceHealthLabel: healthLabel,
        resolutionPath: d.resolutionPath,
        detectedAt: d.detectedAt,
      });
    }
  }

  // Sort: severity rank ascending (high first), then health score ascending (worst health first)
  rows.sort((a, b) => {
    const sA = SEVERITY_RANK[a.severity];
    const sB = SEVERITY_RANK[b.severity];
    if (sA !== sB) return sA - sB;
    return a.instanceHealthScore - b.instanceHealthScore;
  });

  return rows;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysActive(detectedAt: number): number {
  const ms = Date.now() - detectedAt;
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function severityPillStyle(severity: SeverityLevel): React.CSSProperties {
  if (severity === 'high') {
    return {
      background: COLORS.coralSoft,
      color: COLORS.coralInk,
    };
  }
  if (severity === 'medium') {
    return {
      background: COLORS.amberSoft,
      color: COLORS.amberInk,
    };
  }
  return {
    background: `${COLORS.ink}0d`,
    color: `${COLORS.ink}99`,
  };
}

function healthScoreColor(score: number): string {
  if (score >= 80) return COLORS.mintInk;
  if (score >= 50) return COLORS.amberInk;
  return COLORS.coralInk;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryStrip({
  total,
  high,
  medium,
  low,
}: {
  total: number;
  high: number;
  medium: number;
  low: number;
}) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: SPACING.lg,
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 18,
          fontWeight: 700,
          color: COLORS.ink,
          letterSpacing: '-0.02em',
        }}
      >
        {total}
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: `${COLORS.ink}99`,
        }}
      >
        active contradiction{total === 1 ? '' : 's'}
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          color: `${COLORS.ink}44`,
        }}
      >
        ·
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 13,
          color: COLORS.coralInk,
          fontWeight: 600,
        }}
      >
        {high} high
      </span>
      <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 11, color: `${COLORS.ink}44` }}>/</span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 13,
          color: COLORS.amberInk,
          fontWeight: 600,
        }}
      >
        {medium} medium
      </span>
      <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 11, color: `${COLORS.ink}44` }}>/</span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 13,
          color: `${COLORS.ink}88`,
          fontWeight: 600,
        }}
      >
        {low} low
      </span>
    </div>
  );
}

function SeverityPill({ severity }: { severity: SeverityLevel }) {
  const label = severity === 'high' ? 'High' : severity === 'medium' ? 'Medium' : 'Low';
  return (
    <span
      style={{
        display: 'inline-block',
        borderRadius: RADIUS.pill,
        padding: '3px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        flexShrink: 0,
        ...severityPillStyle(severity),
      }}
    >
      {label}
    </span>
  );
}

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: `${COLORS.ink}88`,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `2px solid ${COLORS.ink}14`,
  whiteSpace: 'nowrap',
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}0a`,
  verticalAlign: 'middle',
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
};

function SeverityTable({ rows }: { rows: ContradictionSeverityRow[] }) {
  if (rows.length === 0) {
    return (
      <section
        style={{
          background: COLORS.white,
          border: `1px solid ${COLORS.ink}14`,
          borderRadius: RADIUS.lg,
          padding: SPACING.xl,
          textAlign: 'center',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: `${COLORS.ink}88`,
        }}
      >
        No active contradictions detected across any instance.
      </section>
    );
  }

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
            Contradiction severity ranking
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            High severity first · within tier sorted by health score ascending (worst health first)
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
            flexShrink: 0,
          }}
        >
          {rows.length} row{rows.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Instance</th>
              <th style={HEADER_CELL}>Contradiction template</th>
              <th style={HEADER_CELL}>Severity</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Instance health</th>
              <th style={HEADER_CELL}>Resolution path</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Days active</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.instanceId}::${row.contradictionId}`}>
                <td style={MONO_CELL}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: COLORS.ink, fontWeight: 600 }}>
                      {row.instanceName}
                    </span>
                    <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 10, color: `${COLORS.ink}66` }}>
                      {row.instanceId}
                    </span>
                  </div>
                </td>
                <td style={BODY_CELL}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: COLORS.ink }}>
                      {row.templateLabel}
                    </span>
                    <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 10, color: `${COLORS.ink}66` }}>
                      {row.contradictionId}
                    </span>
                  </div>
                </td>
                <td style={BODY_CELL}>
                  <SeverityPill severity={row.severity} />
                </td>
                <td style={{ ...BODY_CELL, textAlign: 'right' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 13,
                        fontWeight: 700,
                        color: healthScoreColor(row.instanceHealthScore),
                      }}
                    >
                      {row.instanceHealthScore}
                    </span>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 10,
                        color: `${COLORS.ink}66`,
                        textTransform: 'capitalize',
                      }}
                    >
                      {row.instanceHealthLabel}
                    </span>
                  </div>
                </td>
                <td style={{ ...BODY_CELL, maxWidth: 320 }}>
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 11,
                      color: `${COLORS.ink}88`,
                      lineHeight: 1.45,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {row.resolutionPath || '—'}
                  </span>
                </td>
                <td style={{ ...MONO_CELL, textAlign: 'right' }}>
                  {daysActive(row.detectedAt)}d
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SeverityDistribution({
  high,
  medium,
  low,
}: {
  high: number;
  medium: number;
  low: number;
}) {
  const total = high + medium + low;
  if (total === 0) return null;

  const bars: Array<{ label: string; count: number; bg: string; fg: string }> = [
    { label: 'High', count: high, bg: COLORS.coralSoft, fg: COLORS.coralInk },
    { label: 'Medium', count: medium, bg: COLORS.amberSoft, fg: COLORS.amberInk },
    { label: 'Low', count: low, bg: `${COLORS.ink}0d`, fg: `${COLORS.ink}88` },
  ];

  const max = Math.max(high, medium, low, 1);

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
          Severity distribution
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Count of active contradictions by severity level
        </div>
      </header>

      <div
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.md,
        }}
      >
        {bars.map(({ label, count, bg, fg }) => {
          const widthPct = Math.round((count / max) * 100);
          return (
            <div
              key={label}
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 48px',
                alignItems: 'center',
                gap: SPACING.md,
              }}
            >
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  fontWeight: 600,
                  color: fg,
                  textAlign: 'right',
                }}
              >
                {label}
              </span>
              <div
                style={{
                  height: 28,
                  background: `${COLORS.ink}08`,
                  borderRadius: RADIUS.sm,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {count > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${widthPct}%`,
                      background: bg,
                      borderRadius: RADIUS.sm,
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: 10,
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 14,
                  fontWeight: 700,
                  color: fg,
                  textAlign: 'right',
                }}
              >
                {count}
              </span>
            </div>
          );
        })}

        <div
          style={{
            marginTop: SPACING.sm,
            paddingTop: SPACING.sm,
            borderTop: `1px solid ${COLORS.ink}10`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 6,
          }}
        >
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              color: `${COLORS.ink}88`,
            }}
          >
            Total
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 14,
              fontWeight: 700,
              color: COLORS.ink,
            }}
          >
            {total}
          </span>
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContradictionSeverityPage() {
  const rows = buildSeverityRows();

  const high = rows.filter((r) => r.severity === 'high').length;
  const medium = rows.filter((r) => r.severity === 'medium').length;
  const low = rows.filter((r) => r.severity === 'low').length;

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open contradiction debug"
          primaryActionHref="/admin/reasoning/contradiction-debug"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Contradiction severity"
        subtitle="Active contradictions across all instances ranked by severity — critical to low, correlated with instance health scores."
      >
        <SummaryStrip total={rows.length} high={high} medium={medium} low={low} />
        <SeverityDistribution high={high} medium={medium} low={low} />
        <SeverityTable rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
