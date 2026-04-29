// /admin/reasoning/instances/[instanceId] — Full reasoning breakdown for a
// single instance: gates, contradictions, evidence map, synthesis context.
//
// Server component. Looks up the instance across SOURCE_EVENT_INSTANCES and
// APEX_RETAIL_PROGRAM_INSTANCES, runs gate evaluation + contradiction
// detection, and renders a structured drilldown.

import { notFound } from 'next/navigation';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SHELL } from '@/lib/shell/shell-tokens';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import { buildEvidenceMap } from '@/lib/source/source-event-instance';
import { buildProgramEvidenceMap } from '@/lib/programs/program-instance';
import { evaluateStageGates } from '@/lib/reasoning/gate-evaluator';
import { detectContradictions } from '@/lib/reasoning/contradiction-detector';
import { computeInstanceHealth } from '@/lib/reasoning/instance-health';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';
import type { GateEvaluation } from '@/lib/reasoning/types';
import type { ContradictionDetection } from '@/lib/reasoning/types';

export const dynamic = 'force-dynamic';

// ─── Types ────────────────────────────────────────────────────────────────────

type GateStatus = GateEvaluation['status'];

// ─── Section heading style ────────────────────────────────────────────────────

const SECTION_HEADING: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 15,
  fontWeight: 700,
  color: COLORS.ink,
  letterSpacing: '-0.01em',
  marginBottom: 12,
  marginTop: 0,
};

const TH: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  fontWeight: 700,
  color: SHELL.INK_SOFT,
  textAlign: 'left',
  padding: `${SPACING.xs} ${SPACING.sm}`,
  borderBottom: `1px solid ${SHELL.CARD_LINE}`,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
};

const TD: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.xs} ${SPACING.sm}`,
  borderBottom: `1px solid ${SHELL.CARD_LINE}`,
  verticalAlign: 'top',
};

const TD_MONO: React.CSSProperties = {
  ...TD,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: SHELL.INK_SOFT,
};

// ─── Gate status badge ────────────────────────────────────────────────────────

function gateStatusStyle(status: GateStatus): React.CSSProperties {
  if (status === 'met') {
    return {
      background: SHELL.MINT_BG,
      color: SHELL.MINT_TEXT,
      border: `1px solid ${SHELL.MINT_LINE}`,
    };
  }
  if (status === 'waived') {
    return {
      background: SHELL.PAPER_DEEP,
      color: SHELL.AMBER_DOT,
      border: `1px solid ${SHELL.PEACH_LINE}`,
    };
  }
  // unmet or partial
  return {
    background: SHELL.RUST_BG,
    color: SHELL.RUST_TEXT,
    border: `1px solid ${SHELL.PEACH_LINE}`,
  };
}

function gateStatusLabel(status: GateStatus): string {
  if (status === 'met') return '✓ Met';
  if (status === 'waived') return '~ Waived';
  if (status === 'partial') return '~ Partial';
  return '✗ Unmet';
}

function GateStatusBadge({ status }: { status: GateStatus }) {
  return (
    <span
      style={{
        ...gateStatusStyle(status),
        display: 'inline-block',
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {gateStatusLabel(status)}
    </span>
  );
}

// ─── Health badge ─────────────────────────────────────────────────────────────

function HealthBadge({ grade, score }: { grade: 'green' | 'amber' | 'red'; score: number }) {
  const palette: React.CSSProperties =
    grade === 'amber'
      ? { background: SHELL.PAPER_DEEP, color: SHELL.AMBER_DOT, border: `1px solid ${SHELL.PEACH_LINE}` }
      : grade === 'red'
      ? { background: SHELL.RUST_BG, color: SHELL.RUST_TEXT, border: `1px solid ${SHELL.PEACH_LINE}` }
      : { background: SHELL.MINT_BG, color: SHELL.MINT_TEXT, border: `1px solid ${SHELL.MINT_LINE}` };
  const label = grade === 'amber' ? 'Warning' : grade === 'red' ? 'Critical' : 'Healthy';
  return (
    <span
      style={{
        ...palette,
        borderRadius: RADIUS.pill,
        padding: '3px 12px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {label} · {score}
    </span>
  );
}

// ─── Type badge ───────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: 'source' | 'program' }) {
  const isSource = type === 'source';
  return (
    <span
      style={{
        display: 'inline-block',
        background: isSource ? SHELL.PEACH_BG : SHELL.BLUE_BG,
        color: isSource ? SHELL.PEACH_TEXT : SHELL.INK_MID,
        border: `1px solid ${isSource ? SHELL.PEACH_LINE : SHELL.BLUE_LINE}`,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {isSource ? 'Source event' : 'Program'}
    </span>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${SHELL.CARD_LINE}`,
          background: SHELL.PAPER,
        }}
      >
        <h2 style={SECTION_HEADING}>{title}</h2>
      </div>
      <div style={{ padding: `${SPACING.md} ${SPACING.lg}` }}>{children}</div>
    </section>
  );
}

// ─── Severity badge ───────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: 'low' | 'medium' | 'high' }) {
  const palette: React.CSSProperties =
    severity === 'high'
      ? { background: SHELL.RUST_BG, color: SHELL.RUST_TEXT }
      : severity === 'medium'
      ? { background: SHELL.PAPER_DEEP, color: SHELL.AMBER_DOT }
      : { background: SHELL.GRAY_BG, color: SHELL.GRAY_TEXT };
  return (
    <span
      style={{
        ...palette,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {severity}
    </span>
  );
}

// ─── Gate criteria table ──────────────────────────────────────────────────────

function GateCriteriaTable({ gates }: { gates: GateEvaluation[] }) {
  if (gates.length === 0) {
    return (
      <p
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          color: SHELL.INK_MUTED,
          margin: 0,
        }}
      >
        No gate criteria found for the current stage.
      </p>
    );
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
        <thead>
          <tr>
            <th style={{ ...TH, width: 180 }}>Criterion ID</th>
            <th style={{ ...TH, minWidth: 220 }}>Description</th>
            <th style={{ ...TH, width: 80 }}>Weight</th>
            <th style={{ ...TH, width: 100 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {gates.map((g) => (
            <tr key={g.criterionId}>
              <td style={TD_MONO}>{g.criterionId}</td>
              <td
                style={{
                  ...TD,
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  maxWidth: 340,
                }}
              >
                {g.evidence.length > 0 && (
                  <div
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 10,
                      color: SHELL.INK_MUTED,
                      marginTop: 4,
                    }}
                  >
                    {g.evidence.slice(0, 2).join(' · ')}
                  </div>
                )}
              </td>
              <td style={TD}>
                <span
                  style={{
                    display: 'inline-block',
                    background:
                      g.gateType === 'hard' ? SHELL.INK : SHELL.GRAY_BG,
                    color:
                      g.gateType === 'hard' ? SHELL.PAPER : SHELL.GRAY_TEXT,
                    borderRadius: RADIUS.pill,
                    padding: '2px 7px',
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {g.gateType}
                </span>
              </td>
              <td style={TD}>
                <GateStatusBadge status={g.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Contradictions list ──────────────────────────────────────────────────────

function ContradictionsList({
  contradictions,
}: {
  contradictions: ContradictionDetection[];
}) {
  if (contradictions.length === 0) {
    return (
      <p
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          color: SHELL.INK_MUTED,
          margin: 0,
        }}
      >
        None detected.
      </p>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {contradictions.map((c) => (
        <div
          key={c.templateId}
          style={{
            background: SHELL.PAPER,
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderRadius: RADIUS.md,
            padding: `${SPACING.sm} ${SPACING.md}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 10,
                color: SHELL.INK_MUTED,
              }}
            >
              {c.templateId}
            </span>
            <SeverityBadge severity={c.severity} />
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              fontWeight: 600,
              color: SHELL.INK,
              marginBottom: 4,
            }}
          >
            {c.label}
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: SHELL.INK_SOFT,
            }}
          >
            {c.partyA} vs {c.partyB}
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              color: SHELL.INK_MUTED,
              marginTop: 4,
            }}
          >
            Confidence: {Math.round(c.confidence * 100)}%
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Evidence map preview ─────────────────────────────────────────────────────

function EvidenceMapPreview({ map }: { map: Record<string, unknown> }) {
  const keys = Object.keys(map).slice(0, 20);
  if (keys.length === 0) {
    return (
      <p
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          color: SHELL.INK_MUTED,
          margin: 0,
        }}
      >
        No evidence keys present.
      </p>
    );
  }
  return (
    <ul
      style={{
        margin: 0,
        padding: 0,
        listStyle: 'none',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 4,
      }}
    >
      {keys.map((k) => (
        <li key={k}>
          <code
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: SHELL.INK_MID,
              background: SHELL.PAPER_DEEP,
              borderRadius: RADIUS.sm,
              padding: '2px 6px',
              display: 'inline-block',
            }}
          >
            {k}
          </code>
        </li>
      ))}
      {Object.keys(map).length > 20 && (
        <li>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: SHELL.INK_MUTED,
            }}
          >
            +{Object.keys(map).length - 20} more…
          </span>
        </li>
      )}
    </ul>
  );
}

// ─── Back link ────────────────────────────────────────────────────────────────

function BackLink() {
  return (
    <a
      href="/admin/reasoning/health"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 12,
        color: SHELL.INK_SOFT,
        textDecoration: 'none',
        marginBottom: 8,
      }}
    >
      ← Back to health board
    </a>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function InstanceDetailPage({
  params,
}: {
  params: Promise<{ instanceId: string }>;
}) {
  const { instanceId } = await params;

  // ── Resolve instance ────────────────────────────────────────────────────────

  const sourceInst = SOURCE_EVENT_INSTANCES.find((i) => i.id === instanceId);
  const programInst = sourceInst
    ? undefined
    : APEX_RETAIL_PROGRAM_INSTANCES.find((i) => i.id === instanceId);

  if (!sourceInst && !programInst) {
    notFound();
  }

  const instanceType: 'source' | 'program' = sourceInst ? 'source' : 'program';

  // ── Resolve pattern ─────────────────────────────────────────────────────────

  let patternId: string;
  let currentStageLabel: string;
  let instanceLabel: string;
  let evidenceMap: Record<string, unknown>;
  let gates: GateEvaluation[];
  let contradictions: ContradictionDetection[];
  let healthGrade: 'green' | 'amber' | 'red';
  let healthScore: number;

  if (sourceInst) {
    patternId = sourceInst.patternId;
    currentStageLabel = sourceInst.currentStage;
    instanceLabel = sourceInst.name;
    evidenceMap = buildEvidenceMap(sourceInst);

    const pattern = SOURCE_LIFECYCLE_PATTERNS.find((p) => p.patternId === patternId);
    if (pattern) {
      gates = evaluateStageGates(pattern, sourceInst.currentStage, evidenceMap);
      contradictions = detectContradictions(pattern, evidenceMap);
      const ctx = buildSourceSynthesisContext(sourceInst, pattern);
      const health = computeInstanceHealth(ctx);
      healthGrade = health.grade;
      healthScore = health.score;
    } else {
      gates = [];
      contradictions = [];
      healthGrade = 'amber';
      healthScore = 50;
    }
  } else {
    // programInst is defined here (narrowed by the notFound() above)
    const inst = programInst!;
    patternId = inst.patternId;
    const phase = inst.phases.find((p) => p.phaseId === inst.currentPhase);
    currentStageLabel = phase
      ? `P${phase.phaseId} ${phase.phaseLabel}`
      : `P${inst.currentPhase}`;
    instanceLabel = inst.name;
    evidenceMap = buildProgramEvidenceMap(inst);

    const pattern = PROGRAM_LIFECYCLE_PATTERNS.find((p) => p.patternId === patternId);
    if (pattern) {
      const stageId = `P${inst.currentPhase}-${phase?.phaseLabel ?? ''}`;
      gates = evaluateStageGates(pattern, stageId, evidenceMap);
      contradictions = detectContradictions(pattern, evidenceMap);
      const ctx = buildProgramSynthesisContext(inst, pattern);
      const health = computeInstanceHealth(ctx);
      healthGrade = health.grade;
      healthScore = health.score;
    } else {
      gates = [];
      contradictions = [];
      healthGrade = 'amber';
      healthScore = 50;
    }
  }

  const metCount = gates.filter((g) => g.status === 'met' || g.status === 'waived').length;

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to Health Board"
          primaryActionHref="/admin/reasoning/health"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title={instanceLabel}
        subtitle={`Full reasoning breakdown — gates, contradictions, evidence map, and synthesis context for instance ${instanceId}.`}
      >
        {/* Back link */}
        <BackLink />

        {/* Header card */}
        <section
          style={{
            background: SHELL.CARD_WHITE,
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderRadius: RADIUS.lg,
            padding: `${SPACING.md} ${SPACING.lg}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 12,
              marginBottom: 8,
            }}
          >
            <TypeBadge type={instanceType} />
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: SHELL.INK_MUTED,
              }}
            >
              {instanceId}
            </span>
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 22,
              fontWeight: 700,
              color: SHELL.INK,
              letterSpacing: '-0.02em',
              marginBottom: 8,
            }}
          >
            {instanceLabel}
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: SHELL.INK_SOFT,
              }}
            >
              {instanceType === 'source' ? 'Stage' : 'Phase'}:{' '}
              <strong>{currentStageLabel}</strong>
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: SHELL.INK_SOFT,
              }}
            >
              Pattern: <code style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11 }}>{patternId}</code>
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: SHELL.INK_SOFT,
              }}
            >
              Gates: {metCount}/{gates.length} met
            </span>
            <HealthBadge grade={healthGrade} score={healthScore} />
          </div>
        </section>

        {/* Gate criteria table */}
        <SectionCard
          title={`Gate criteria · ${currentStageLabel} (${gates.length} criteria)`}
        >
          <GateCriteriaTable gates={gates} />
        </SectionCard>

        {/* Active contradictions */}
        <SectionCard
          title={`Active contradictions (${contradictions.length})`}
        >
          <ContradictionsList contradictions={contradictions} />
        </SectionCard>

        {/* Evidence map preview */}
        <SectionCard
          title={`Evidence map preview · ${Math.min(Object.keys(evidenceMap).length, 20)} of ${Object.keys(evidenceMap).length} keys`}
        >
          <EvidenceMapPreview map={evidenceMap} />
        </SectionCard>
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
