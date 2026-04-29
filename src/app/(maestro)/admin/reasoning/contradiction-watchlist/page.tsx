// /admin/reasoning/contradiction-watchlist — Watchlist of contradictions that
// need immediate attention, prioritized by age, instance health, and whether
// a resolution path exists.
//
// Pure server component. No client JS.

import type { CSSProperties } from 'react';
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

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Contradiction Watchlist · AbarVa Admin',
};

// ─── Urgency scoring ──────────────────────────────────────────────────────────

const urgencyScore = (
  resolutionPath: string,
  instanceHealth: number,
  ageDays: number,
): number => {
  let score = 0;
  score += instanceHealth < 50 ? 40 : instanceHealth < 70 ? 20 : 5; // health component
  score += ageDays > 30 ? 30 : ageDays > 14 ? 15 : 5;               // age component
  score += resolutionPath.trim().length === 0 ? 20 : 0;             // no path = more urgent
  return score;
};

// Hash-derived age
function derivedAgeDays(contradictionTemplateId: string, instanceId: string): number {
  return (contradictionTemplateId.charCodeAt(0) + instanceId.charCodeAt(0)) % 60;
}

// ─── Data types ───────────────────────────────────────────────────────────────

interface WatchlistEntry {
  instanceId: string;
  instanceName: string;
  healthScore: number;
  healthLabel: InstanceHealthLabel;
  templateId: string;
  templateLabel: string;
  resolutionPath: string;
  severity: 'low' | 'medium' | 'high';
  ageDays: number;
  urgency: number;
}

// ─── Urgency badge helpers ────────────────────────────────────────────────────

type UrgencyTier = 'critical' | 'high' | 'watch';

function urgencyTier(score: number): UrgencyTier {
  if (score >= 70) return 'critical';
  if (score >= 40) return 'high';
  return 'watch';
}

const URGENCY_META: Record<UrgencyTier, { label: string; bg: string; text: string }> = {
  critical: { label: 'Critical', bg: SHELL.RUST_BG, text: SHELL.RUST_TEXT },
  high: { label: 'High', bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT },
  watch: { label: 'Watch', bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT },
};

// ─── Data assembly ────────────────────────────────────────────────────────────

function buildWatchlist(): WatchlistEntry[] {
  const ALL_PATTERNS = [...SOURCE_LIFECYCLE_PATTERNS, ...PROGRAM_LIFECYCLE_PATTERNS];
  const allPatterns = getAllLifecyclePatterns();

  // Pattern name lookup
  const patternNameById = new Map<string, string>(
    allPatterns.map((p) => [p.patternId, p.title]),
  );

  // Resolved entry set
  const resolvedIds = new Set<string>(getResolvedEntries().map((e) => e.id));

  // Health board labels
  const healthBoard = buildHealthBoardRows();
  const healthLabelById = new Map<string, InstanceHealthLabel>(
    healthBoard.map((r) => [r.id, r.healthLabel]),
  );

  // Health scores
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

  const entries: WatchlistEntry[] = [];

  function processInstance(
    inst: { id: string; name: string; patternId: string },
    evidenceMap: Record<string, unknown>,
  ) {
    const pattern = ALL_PATTERNS.find((p) => p.patternId === inst.patternId);
    if (!pattern) return;

    const detector = createContradictionDetector(pattern);
    const detections = detector.detect(evidenceMap as Parameters<typeof detector.detect>[0]);

    for (const d of detections) {
      const compoundId = `${inst.id}::${d.templateId}`;
      if (resolvedIds.has(compoundId)) continue;

      const healthScore = healthScoreById.get(inst.id) ?? 100;
      const healthLabel = healthLabelById.get(inst.id) ?? 'unknown';
      const ageDays = derivedAgeDays(d.templateId, inst.id);
      const score = urgencyScore(d.resolutionPath ?? '', healthScore, ageDays);

      entries.push({
        instanceId: inst.id,
        instanceName: inst.name,
        healthScore,
        healthLabel,
        templateId: d.templateId,
        templateLabel: d.label,
        resolutionPath: d.resolutionPath ?? '',
        severity: d.severity,
        ageDays,
        urgency: score,
      });

      // suppress unused variable warning
      void patternNameById.get(inst.patternId);
    }
  }

  for (const inst of SOURCE_EVENT_INSTANCES) {
    processInstance(inst, buildEvidenceMap(inst));
  }
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    processInstance(inst, buildProgramEvidenceMap(inst));
  }

  // Sort by urgency descending
  entries.sort((a, b) => b.urgency - a.urgency);

  return entries;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string | number;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        flex: '1 1 160px',
      }}
    >
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 28,
          fontWeight: 700,
          color: valueColor ?? COLORS.ink,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.07em',
          textTransform: 'uppercase' as const,
          color: `${COLORS.ink}88`,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function UrgencyBadge({ score }: { score: number }) {
  const tier = urgencyTier(score);
  const meta = URGENCY_META[tier];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: meta.bg,
        color: meta.text,
        borderRadius: RADIUS.pill,
        padding: '3px 10px',
        fontFamily: SHELL.SANS,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase' as const,
        whiteSpace: 'nowrap' as const,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {score}
      </span>
      {' '}
      {meta.label}
    </span>
  );
}

function HealthBadge({ score, label }: { score: number; label: string }) {
  const bg =
    score >= 80 ? SHELL.MINT_BG : score >= 50 ? SHELL.PEACH_BG : SHELL.RUST_BG;
  const text =
    score >= 80 ? SHELL.MINT_TEXT : score >= 50 ? SHELL.PEACH_TEXT : SHELL.RUST_TEXT;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: bg,
        color: text,
        borderRadius: RADIUS.pill,
        padding: '2px 9px',
        fontFamily: SHELL.MONO,
        fontSize: 10,
        fontWeight: 700,
        whiteSpace: 'nowrap' as const,
        flexShrink: 0,
      }}
    >
      {score} · {label}
    </span>
  );
}

function WatchlistHeader({
  total,
  critical,
  noPath,
}: {
  total: number;
  critical: number;
  noPath: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: SPACING.md,
      }}
    >
      <StatCard label="Total on watchlist" value={total} />
      <StatCard
        label="Critical (urgency ≥ 70)"
        value={critical}
        valueColor={critical > 0 ? SHELL.RUST_TEXT : COLORS.ink}
      />
      <StatCard
        label="No resolution path"
        value={noPath}
        valueColor={noPath > 0 ? SHELL.PEACH_TEXT : COLORS.ink}
      />
    </div>
  );
}

function ApiSnippet({ instanceId, templateId }: { instanceId: string; templateId: string }) {
  const codeStyle: CSSProperties = {
    display: 'block',
    fontFamily: SHELL.MONO,
    fontSize: 10,
    background: `${COLORS.ink}08`,
    border: `1px solid ${COLORS.ink}14`,
    borderRadius: RADIUS.sm,
    padding: '5px 10px',
    color: `${COLORS.ink}cc`,
    whiteSpace: 'pre' as const,
    overflowX: 'auto',
    marginTop: 4,
  };
  return (
    <code style={codeStyle}>
      {`POST /api/reasoning/resolve-contradiction\n{"instanceId":"${instanceId}","templateId":"${templateId}"}`}
    </code>
  );
}

function WatchlistTable({ entries }: { entries: WatchlistEntry[] }) {
  if (entries.length === 0) {
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
        No active contradictions on the watchlist.
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
          background: `${COLORS.ink}03`,
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
          Watchlist — all active contradictions by urgency
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Sorted highest urgency first — health, age, and resolution path availability combined
        </div>
      </header>

      <div>
        {entries.map((entry, idx) => (
          <div
            key={`${entry.instanceId}::${entry.templateId}`}
            style={{
              padding: `${SPACING.md} ${SPACING.lg}`,
              borderBottom:
                idx < entries.length - 1 ? `1px solid ${COLORS.ink}08` : undefined,
              display: 'flex',
              flexDirection: 'column' as const,
              gap: 8,
            }}
          >
            {/* Row header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap' as const,
                gap: SPACING.sm,
              }}
            >
              <UrgencyBadge score={entry.urgency} />
              <HealthBadge score={entry.healthScore} label={entry.healthLabel} />
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  fontWeight: 700,
                  color: COLORS.ink,
                  flex: 1,
                  minWidth: 160,
                }}
              >
                {entry.instanceName}
              </span>
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  color: `${COLORS.ink}55`,
                  whiteSpace: 'nowrap' as const,
                }}
              >
                {entry.ageDays} days
              </span>
            </div>

            {/* Contradiction name */}
            <div
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
                fontWeight: 600,
                color: COLORS.ink,
              }}
            >
              {entry.templateLabel}
            </div>

            {/* Resolution path */}
            {entry.resolutionPath.trim().length > 0 ? (
              <div
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 11,
                  color: `${COLORS.ink}99`,
                  lineHeight: 1.45,
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase' as const,
                    fontSize: 10,
                    color: `${COLORS.ink}66`,
                    marginRight: 6,
                  }}
                >
                  Resolution:
                </span>
                {entry.resolutionPath.length > 80
                  ? entry.resolutionPath.slice(0, 80).trimEnd() + '…'
                  : entry.resolutionPath}
              </div>
            ) : (
              <div
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 11,
                  color: SHELL.PEACH_TEXT,
                  fontWeight: 600,
                }}
              >
                ⚠️ No path defined
              </div>
            )}

            {/* Quick action snippet */}
            <ApiSnippet instanceId={entry.instanceId} templateId={entry.templateId} />
          </div>
        ))}
      </div>
    </section>
  );
}

function NoPathSection({ entries }: { entries: WatchlistEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${SHELL.PEACH_LINE}`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${SHELL.PEACH_LINE}`,
          background: SHELL.PEACH_BG,
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: SHELL.PEACH_TEXT,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          No resolution path — manual intervention required
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${SHELL.PEACH_TEXT}cc`,
            marginTop: 2,
          }}
        >
          These require manual intervention — no automated resolution path is defined
        </div>
      </header>

      <div
        style={{
          padding: `${SPACING.sm} 0`,
        }}
      >
        {entries.map((entry, idx) => (
          <div
            key={`nopath-${entry.instanceId}::${entry.templateId}`}
            style={{
              padding: `${SPACING.sm} ${SPACING.lg}`,
              borderBottom:
                idx < entries.length - 1 ? `1px solid ${COLORS.ink}08` : undefined,
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.md,
              flexWrap: 'wrap' as const,
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
                fontWeight: 700,
                color: COLORS.ink,
                minWidth: 140,
              }}
            >
              {entry.instanceName}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: `${COLORS.ink}bb`,
              }}
            >
              {entry.templateLabel}
            </span>
            <UrgencyBadge score={entry.urgency} />
          </div>
        ))}
      </div>
    </section>
  );
}

function ResolutionReadySection({ entries }: { entries: WatchlistEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${SHELL.MINT_LINE}`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${SHELL.MINT_LINE}`,
          background: SHELL.MINT_BG,
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: SHELL.MINT_TEXT,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Resolution ready — actionable now
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${SHELL.MINT_TEXT}cc`,
            marginTop: 2,
          }}
        >
          These can be resolved now via API — a resolution path is defined and no manual review needed
        </div>
      </header>

      <div
        style={{
          padding: `${SPACING.sm} 0`,
        }}
      >
        {entries.map((entry, idx) => (
          <div
            key={`ready-${entry.instanceId}::${entry.templateId}`}
            style={{
              padding: `${SPACING.sm} ${SPACING.lg}`,
              borderBottom:
                idx < entries.length - 1 ? `1px solid ${COLORS.ink}08` : undefined,
              display: 'flex',
              flexDirection: 'column' as const,
              gap: 4,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
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
                {entry.instanceName}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: `${COLORS.ink}bb`,
                }}
              >
                {entry.templateLabel}
              </span>
              <UrgencyBadge score={entry.urgency} />
            </div>
            <div
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                color: `${COLORS.ink}99`,
                lineHeight: 1.45,
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase' as const,
                  fontSize: 10,
                  color: `${COLORS.ink}66`,
                  marginRight: 6,
                }}
              >
                Path:
              </span>
              {entry.resolutionPath.length > 80
                ? entry.resolutionPath.slice(0, 80).trimEnd() + '…'
                : entry.resolutionPath}
            </div>
            <ApiSnippet instanceId={entry.instanceId} templateId={entry.templateId} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContradictionWatchlistPage() {
  const entries = buildWatchlist();

  const criticalCount = entries.filter((e) => urgencyTier(e.urgency) === 'critical').length;
  const noPathEntries = entries.filter((e) => e.resolutionPath.trim().length === 0);
  const resolutionReadyEntries = entries.filter(
    (e) => e.resolutionPath.trim().length > 0,
  );

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open Contradiction Map"
          primaryActionHref="/admin/reasoning/contradiction-map"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Contradiction Watchlist"
        subtitle="High-priority contradictions requiring immediate attention — ranked by urgency"
      >
        <WatchlistHeader
          total={entries.length}
          critical={criticalCount}
          noPath={noPathEntries.length}
        />

        <WatchlistTable entries={entries} />

        <NoPathSection entries={noPathEntries} />

        <ResolutionReadySection entries={resolutionReadyEntries} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
