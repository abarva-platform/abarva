// /admin/reasoning/contradictions — Cross-instance contradictions overview.
//
// Server component. Iterates every source event instance and program instance,
// runs the deterministic contradiction detector against each, filters out
// resolved contradictions, and renders a flat admin table so operators can
// see all active unresolved contradictions across the full corpus at a glance.
//
// No client JS — pure server render. No interactive features needed.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { buildEvidenceMap } from '@/lib/source/source-event-instance';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { buildProgramEvidenceMap } from '@/lib/programs/program-instance';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import { detectContradictions } from '@/lib/reasoning/contradiction-detector';
import { isResolved } from '@/lib/reasoning/contradiction-resolution-state';
import type { ContradictionDetection } from '@/lib/reasoning/types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Active contradictions · AbarVa Admin',
};

// ─── Types ─────────────────────────────────────────────────────────────────────

type InstanceType = 'Source' | 'Program';

interface ContradictionRow {
  instanceId: string;
  instanceName: string;
  instanceType: InstanceType;
  currentStage: string;
  detection: ContradictionDetection;
}

// ─── Data gathering ────────────────────────────────────────────────────────────

function gatherRows(): ContradictionRow[] {
  const rows: ContradictionRow[] = [];

  // Build a pattern lookup by patternId for fast access.
  const srcPatternMap = new Map(
    SOURCE_LIFECYCLE_PATTERNS.map((p) => [p.patternId, p]),
  );
  const prgPatternMap = new Map(
    PROGRAM_LIFECYCLE_PATTERNS.map((p) => [p.patternId, p]),
  );

  for (const instance of SOURCE_EVENT_INSTANCES) {
    const pattern = srcPatternMap.get(instance.patternId);
    if (!pattern) continue; // skip if no matching pattern

    const evidenceMap = buildEvidenceMap(instance);
    const detections = detectContradictions(pattern, evidenceMap);

    for (const detection of detections) {
      if (isResolved(detection.templateId)) continue;
      rows.push({
        instanceId: instance.id,
        instanceName: instance.name,
        instanceType: 'Source',
        currentStage: instance.currentStage,
        detection,
      });
    }
  }

  for (const instance of APEX_RETAIL_PROGRAM_INSTANCES) {
    const pattern = prgPatternMap.get(instance.patternId);
    if (!pattern) continue; // skip if no matching pattern

    const evidenceMap = buildProgramEvidenceMap(instance);
    const detections = detectContradictions(pattern, evidenceMap);

    for (const detection of detections) {
      if (isResolved(detection.templateId)) continue;
      rows.push({
        instanceId: instance.id,
        instanceName: instance.name,
        instanceType: 'Program',
        currentStage: String(instance.currentPhase),
        detection,
      });
    }
  }

  return rows;
}

// ─── Severity helpers ──────────────────────────────────────────────────────────

type Severity = ContradictionDetection['severity'];

function severityPalette(severity: Severity): { bg: string; fg: string } {
  if (severity === 'high') {
    return { bg: COLORS.coralSoft, fg: COLORS.coralInk };
  }
  if (severity === 'medium') {
    return { bg: COLORS.amberSoft, fg: COLORS.amberInk };
  }
  // low
  return { bg: `${COLORS.ink}0d`, fg: `${COLORS.ink}99` };
}

function countBySeverity(rows: ContradictionRow[], severity: Severity): number {
  return rows.filter((r) => r.detection.severity === severity).length;
}

// ─── Table style constants ─────────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  fontWeight: 700,
  color: `${COLORS.ink}cc`,
  textAlign: 'left' as const,
  padding: `${SPACING.sm} ${SPACING.md}`,
  background: COLORS.skyPale,
  borderBottom: `1px solid ${COLORS.ink}1a`,
  whiteSpace: 'nowrap' as const,
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}0d`,
  verticalAlign: 'top' as const,
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}bb`,
};

// ─── Summary header ───────────────────────────────────────────────────────────

function SeverityChip({ label, count, bg, fg }: { label: string; count: number; bg: string; fg: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: bg,
        color: fg,
        borderRadius: RADIUS.pill,
        padding: '4px 12px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.02em',
      }}
    >
      <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 13 }}>{count}</span>
      {label}
    </span>
  );
}

function SummaryHeader({ rows }: { rows: ContradictionRow[] }) {
  const highCount = countBySeverity(rows, 'high');
  const mediumCount = countBySeverity(rows, 'medium');
  const lowCount = countBySeverity(rows, 'low');

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: SPACING.md,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 600,
          }}
        >
          Active contradictions
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 36,
            color: COLORS.ink,
            marginTop: 4,
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
          }}
        >
          {rows.length}
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          unresolved across all instances
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
          flexWrap: 'wrap',
        }}
      >
        <SeverityChip
          label="high"
          count={highCount}
          bg={COLORS.coralSoft}
          fg={COLORS.coralInk}
        />
        <SeverityChip
          label="medium"
          count={mediumCount}
          bg={COLORS.amberSoft}
          fg={COLORS.amberInk}
        />
        <SeverityChip
          label="low"
          count={lowCount}
          bg={`${COLORS.ink}0d`}
          fg={`${COLORS.ink}88`}
        />
      </div>
    </div>
  );
}

// ─── Type badge ────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: InstanceType }) {
  const isSource = type === 'Source';
  return (
    <span
      style={{
        display: 'inline-block',
        background: isSource ? COLORS.skyPale : COLORS.mintSoft,
        color: isSource ? COLORS.navy : COLORS.mintInk,
        borderRadius: RADIUS.pill,
        padding: '2px 9px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.03em',
      }}
    >
      {type}
    </span>
  );
}

// ─── Severity badge ────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: Severity }) {
  const { bg, fg } = severityPalette(severity);
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: fg,
        borderRadius: RADIUS.pill,
        padding: '2px 9px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      {severity}
    </span>
  );
}

// ─── Contradictions table ──────────────────────────────────────────────────────

function ContradictionsTable({ rows }: { rows: ContradictionRow[] }) {
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
            All active contradictions
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Source events and programs — unresolved only
          </div>
        </div>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>
          {rows.length} row{rows.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 880 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Instance</th>
              <th style={HEADER_CELL}>Type</th>
              <th style={HEADER_CELL}>Template ID</th>
              <th style={HEADER_CELL}>Description</th>
              <th style={HEADER_CELL}>Severity</th>
              <th style={HEADER_CELL}>Stage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const description = row.detection.label.length > 0
                ? row.detection.label.slice(0, 80)
                : row.detection.templateId;
              const isEven = idx % 2 === 0;
              const rowBg = isEven ? COLORS.white : `${COLORS.ink}04`;
              const cellOverride: React.CSSProperties = { background: rowBg };

              return (
                <tr key={`${row.instanceId}::${row.detection.templateId}::${idx}`}>
                  <td style={{ ...BODY_CELL, ...cellOverride, fontWeight: 600, maxWidth: 200 }}>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 12,
                        color: COLORS.ink,
                        fontWeight: 600,
                        lineHeight: 1.3,
                      }}
                    >
                      {row.instanceName}
                    </div>
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
                  <td style={{ ...BODY_CELL, ...cellOverride }}>
                    <TypeBadge type={row.instanceType} />
                  </td>
                  <td style={{ ...MONO_CELL, ...cellOverride, fontSize: 10 }}>
                    {row.detection.templateId}
                  </td>
                  <td
                    style={{
                      ...BODY_CELL,
                      ...cellOverride,
                      maxWidth: 260,
                      lineHeight: 1.4,
                    }}
                  >
                    {description}
                  </td>
                  <td style={{ ...BODY_CELL, ...cellOverride }}>
                    <SeverityBadge severity={row.detection.severity} />
                  </td>
                  <td style={{ ...MONO_CELL, ...cellOverride }}>
                    {row.currentStage}
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

// ─── Empty state ───────────────────────────────────────────────────────────────

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
        color: COLORS.mintInk,
        lineHeight: 1.5,
      }}
    >
      No active contradictions detected across any instance — all clean.
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ContradictionsOverviewPage() {
  const rows = gatherRows();

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
        eyebrow="Reasoning · Contradictions"
        title="Cross-instance overview"
        subtitle="All active unresolved contradictions detected across every source event and program instance. Contradictions marked resolved on detail pages are suppressed here."
      >
        <SummaryHeader rows={rows} />
        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          <ContradictionsTable rows={rows} />
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
