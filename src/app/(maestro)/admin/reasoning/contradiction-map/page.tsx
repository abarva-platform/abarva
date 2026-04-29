// /admin/reasoning/contradiction-map — Visual triage board for all active
// contradictions: instance-grouped cards with resolution path snippets,
// pattern heat row, and resolution coverage progress bar.
//
// Pure server component. No client JS.

import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
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
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { getResolvedEntries } from '@/lib/reasoning/contradiction-resolution-state';
import type { InstanceHealthLabel } from '@/lib/reasoning/health-board';
import type { CSSProperties } from 'react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Contradiction Map · AbarVa Admin',
};

// ─── Data types ───────────────────────────────────────────────────────────────

interface ContradictionEntry {
  templateId: string;
  templateLabel: string;
  patternId: string;
  patternName: string;
  resolutionPath: string;
  severity: 'low' | 'medium' | 'high';
}

interface InstanceTriageCard {
  instanceId: string;
  instanceName: string;
  healthScore: number;
  healthLabel: InstanceHealthLabel;
  contradictions: ContradictionEntry[];
}

interface MapData {
  cards: InstanceTriageCard[];
  patternHeat: Array<{ patternId: string; patternName: string; count: number }>;
  totalActive: number;
  totalWithResolution: number;
  totalTemplates: number;
}

// ─── Data assembly ────────────────────────────────────────────────────────────

function buildMapData(): MapData {
  const ALL_PATTERNS = [...SOURCE_LIFECYCLE_PATTERNS, ...PROGRAM_LIFECYCLE_PATTERNS];
  const allPatterns = getAllLifecyclePatterns();

  // Pattern name lookup (field is `title` on PatternSeed)
  const patternNameById = new Map<string, string>(
    allPatterns.map((p) => [p.patternId, p.title]),
  );

  // Resolved entry set (compound id: instanceId::templateId)
  const resolvedIds = new Set<string>(getResolvedEntries().map((e) => e.id));

  // Health board for labels
  const healthBoard = buildHealthBoardRows();
  const healthLabelById = new Map<string, InstanceHealthLabel>(
    healthBoard.map((r) => [r.id, r.healthLabel]),
  );

  // Compute numeric health scores separately (InstanceHealthRow has no healthScore field)
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

  // Pattern heat counter
  const patternCountById = new Map<string, number>();

  const cards: InstanceTriageCard[] = [];

  function processInstance(
    inst: { id: string; name: string; patternId: string },
    evidenceMap: Record<string, unknown>,
  ) {
    const pattern = ALL_PATTERNS.find((p) => p.patternId === inst.patternId);
    if (!pattern) return;

    const detector = createContradictionDetector(pattern);
    const detections = detector.detect(evidenceMap as Parameters<typeof detector.detect>[0]);
    const activeDetections = detections.filter(
      (d) => !resolvedIds.has(`${inst.id}::${d.templateId}`),
    );

    if (activeDetections.length === 0) return;

    const contradictions: ContradictionEntry[] = activeDetections.map((d) => {
      // Increment pattern heat
      patternCountById.set(inst.patternId, (patternCountById.get(inst.patternId) ?? 0) + 1);
      return {
        templateId: d.templateId,
        templateLabel: d.label,
        patternId: inst.patternId,
        patternName: patternNameById.get(inst.patternId) ?? inst.patternId,
        resolutionPath: d.resolutionPath ?? '',
        severity: d.severity,
      };
    });

    cards.push({
      instanceId: inst.id,
      instanceName: inst.name,
      healthScore: healthScoreById.get(inst.id) ?? 100,
      healthLabel: healthLabelById.get(inst.id) ?? 'unknown',
      contradictions,
    });
  }

  for (const inst of SOURCE_EVENT_INSTANCES) {
    processInstance(inst, buildEvidenceMap(inst));
  }
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    processInstance(inst, buildProgramEvidenceMap(inst));
  }

  // Build pattern heat array sorted by count descending
  const patternHeat = Array.from(patternCountById.entries())
    .map(([patternId, count]) => ({
      patternId,
      patternName: patternNameById.get(patternId) ?? patternId,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // Totals
  const totalActive = cards.reduce((sum, c) => sum + c.contradictions.length, 0);
  const totalWithResolution = cards.reduce(
    (sum, c) => sum + c.contradictions.filter((ct) => ct.resolutionPath.trim().length > 0).length,
    0,
  );

  return {
    cards,
    patternHeat,
    totalActive,
    totalWithResolution,
    totalTemplates: totalActive,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function firstSentence(text: string, maxChars = 120): string {
  if (!text) return '';
  const dot = text.indexOf('.');
  const raw = dot !== -1 ? text.slice(0, dot + 1) : text;
  return raw.length > maxChars ? raw.slice(0, maxChars).trimEnd() + '…' : raw;
}

function healthScoreColor(score: number): string {
  if (score >= 80) return SHELL.MINT_TEXT;
  if (score >= 50) return SHELL.PEACH_TEXT;
  return SHELL.RUST_TEXT;
}

function healthBg(score: number): string {
  if (score >= 80) return SHELL.MINT_BG;
  if (score >= 50) return SHELL.PEACH_BG;
  return SHELL.RUST_BG;
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeaderStats({
  totalActive,
  instancesAffected,
  patternsAffected,
  avgPerInstance,
}: {
  totalActive: number;
  instancesAffected: number;
  patternsAffected: number;
  avgPerInstance: string;
}) {
  const items = [
    { label: 'Active contradictions', value: String(totalActive), color: SHELL.RUST_TEXT },
    { label: 'Instances affected', value: String(instancesAffected) },
    { label: 'Patterns with contradictions', value: String(patternsAffected) },
    { label: 'Avg / affected instance', value: avgPerInstance },
  ];

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap',
        gap: SPACING.xl,
        alignItems: 'center',
      }}
    >
      {items.map(({ label, value, color }) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 22,
              fontWeight: 700,
              color: color ?? COLORS.ink,
              letterSpacing: '-0.02em',
            }}
          >
            {value}
          </span>
          <span
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 11,
              letterSpacing: '0.07em',
              textTransform: 'uppercase' as const,
              color: `${COLORS.ink}88`,
              fontWeight: 600,
            }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function HealthBadge({ score, label }: { score: number; label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: healthBg(score),
        color: healthScoreColor(score),
        borderRadius: RADIUS.pill,
        padding: '3px 10px',
        fontFamily: SHELL.MONO,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {score} · {label}
    </span>
  );
}

function CountBadge({ count }: { count: number }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: SHELL.RUST_BG,
        color: SHELL.RUST_TEXT,
        borderRadius: RADIUS.pill,
        padding: '2px 9px',
        fontFamily: SHELL.MONO,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {count} contradiction{count === 1 ? '' : 's'}
    </span>
  );
}

function StatusChip() {
  return (
    <span
      style={{
        display: 'inline-block',
        background: SHELL.RUST_BG,
        color: SHELL.RUST_TEXT,
        borderRadius: RADIUS.pill,
        padding: '2px 9px',
        fontFamily: SHELL.SANS,
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        flexShrink: 0,
      }}
    >
      Active
    </span>
  );
}

function InstanceTriageSection({ cards }: { cards: InstanceTriageCard[] }) {
  if (cards.length === 0) {
    return (
      <section
        style={{
          background: COLORS.white,
          border: `1px solid ${COLORS.ink}14`,
          borderRadius: RADIUS.lg,
          padding: SPACING.xl,
          textAlign: 'center',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 14,
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
        Instance triage cards
      </h2>
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          color: `${COLORS.ink}88`,
          marginTop: -8,
        }}
      >
        Only instances with at least one active contradiction are shown
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: SPACING.md,
        }}
      >
        {cards.map((card) => (
          <div
            key={card.instanceId}
            style={{
              background: COLORS.white,
              border: `1px solid ${COLORS.ink}14`,
              borderRadius: RADIUS.lg,
              overflow: 'hidden',
            }}
          >
            {/* Card header */}
            <div
              style={{
                padding: `${SPACING.md} ${SPACING.lg}`,
                borderBottom: `1px solid ${COLORS.ink}0d`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: SPACING.md,
                flexWrap: 'wrap' as const,
                background: `${COLORS.ink}03`,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.serif,
                    fontSize: 15,
                    fontWeight: 600,
                    color: COLORS.ink,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {card.instanceName}
                </span>
                <span
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 10,
                    color: `${COLORS.ink}66`,
                  }}
                >
                  {card.instanceId}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' as const }}>
                <HealthBadge score={card.healthScore} label={card.healthLabel} />
                <CountBadge count={card.contradictions.length} />
              </div>
            </div>

            {/* Contradiction rows */}
            <div style={{ padding: `${SPACING.sm} 0` }}>
              {card.contradictions.map((ct) => (
                <div
                  key={`${card.instanceId}::${ct.templateId}`}
                  style={{
                    padding: `${SPACING.sm} ${SPACING.lg}`,
                    borderBottom: `1px solid ${COLORS.ink}08`,
                    display: 'flex',
                    flexDirection: 'column' as const,
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: SPACING.sm,
                      flexWrap: 'wrap' as const,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 13,
                        fontWeight: 700,
                        color: COLORS.ink,
                      }}
                    >
                      {ct.templateLabel}
                    </span>
                    <StatusChip />
                  </div>
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 11,
                      fontStyle: 'italic',
                      color: `${COLORS.ink}77`,
                    }}
                  >
                    {ct.patternName}
                  </span>
                  {ct.resolutionPath ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 5,
                        marginTop: 2,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: SHELL.SANS,
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.07em',
                          textTransform: 'uppercase' as const,
                          color: `${COLORS.ink}66`,
                          flexShrink: 0,
                        }}
                      >
                        Suggested action:
                      </span>
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.sans,
                          fontSize: 11,
                          color: `${COLORS.ink}99`,
                          lineHeight: 1.45,
                        }}
                      >
                        {firstSentence(ct.resolutionPath)}
                      </span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PatternHeatRow({
  heat,
}: {
  heat: Array<{ patternId: string; patternName: string; count: number }>;
}) {
  if (heat.length === 0) return null;

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
          Pattern heat
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Patterns generating the most active contradictions — sorted descending
        </div>
      </header>

      <div
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          display: 'flex',
          flexWrap: 'wrap',
          gap: SPACING.sm,
          alignItems: 'center',
        }}
      >
        {heat.map(({ patternId, patternName, count }) => {
          const isHot = count >= 3;
          const bg = isHot ? SHELL.RUST_BG : SHELL.PEACH_BG;
          const fg = isHot ? SHELL.RUST_TEXT : SHELL.PEACH_TEXT;

          return (
            <div
              key={patternId}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: bg,
                borderRadius: RADIUS.pill,
                padding: '4px 12px',
              }}
            >
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  fontWeight: 600,
                  color: fg,
                }}
              >
                {truncate(patternName, 12)}
              </span>
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 11,
                  fontWeight: 700,
                  color: fg,
                  background: `${fg}22`,
                  borderRadius: RADIUS.pill,
                  padding: '1px 7px',
                }}
              >
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ResolutionCoverage({
  covered,
  total,
}: {
  covered: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((covered / total) * 100) : 0;

  const barStyle: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: `${pct}%`,
    background: pct >= 80 ? SHELL.MINT_TEXT : pct >= 50 ? SHELL.AMBER_DOT : SHELL.RUST_TEXT,
    borderRadius: RADIUS.sm,
    transition: 'width 0.3s ease',
  };

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
          Resolution coverage
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Proportion of active contradictions that have a resolution path defined on the template
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
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: SPACING.sm,
          }}
        >
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 28,
              fontWeight: 700,
              color: pct >= 80 ? SHELL.MINT_TEXT : pct >= 50 ? SHELL.AMBER_DOT : SHELL.RUST_TEXT,
              letterSpacing: '-0.02em',
            }}
          >
            {pct}%
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              color: `${COLORS.ink}99`,
            }}
          >
            {covered} of {total} active contradiction{total === 1 ? '' : 's'} have a resolution
            path defined
          </span>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: 12,
            background: `${COLORS.ink}0d`,
            borderRadius: RADIUS.sm,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {covered > 0 && <div style={barStyle} />}
        </div>

        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: `${COLORS.ink}77`,
          }}
        >
          {total - covered} contradiction{total - covered === 1 ? '' : 's'} lack a resolution path
          — update the contradiction template definition to add guidance.
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContradictionMapPage() {
  const data = buildMapData();

  const instancesAffected = data.cards.length;
  const patternsAffected = new Set(
    data.cards.flatMap((c) => c.contradictions.map((ct) => ct.patternId)),
  ).size;
  const avgPerInstance =
    instancesAffected > 0
      ? (data.totalActive / instancesAffected).toFixed(1)
      : '0.0';

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open Contradiction Debug"
          primaryActionHref="/admin/reasoning/contradiction-debug"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Contradiction Map"
        subtitle="Active contradictions by instance and pattern — triage board with resolution paths"
      >
        <HeaderStats
          totalActive={data.totalActive}
          instancesAffected={instancesAffected}
          patternsAffected={patternsAffected}
          avgPerInstance={avgPerInstance}
        />

        <InstanceTriageSection cards={data.cards} />

        <PatternHeatRow heat={data.patternHeat} />

        <ResolutionCoverage
          covered={data.totalWithResolution}
          total={data.totalActive}
        />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
