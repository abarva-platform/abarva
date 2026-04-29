// /admin/reasoning/contradiction-frequency — Frequency analysis showing which
// contradiction templates fire most often across all instances.
//
// Pure server component. For each instance, runs contradiction detection (same
// logic as contradiction-debug) and aggregates per-template fire counts,
// resolution counts, and non-fire counts. Templates are ranked by fire count
// descending.

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
import { isResolved } from '@/lib/reasoning/contradiction-resolution-state';
import { createContradictionDetector } from '@/lib/reasoning/contradiction-detector';
import type { ContradictionTemplate } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

// ─── Data types ───────────────────────────────────────────────────────────────

type TemplateFrequency = {
  templateId: string;
  label: string;
  severity: 'low' | 'medium' | 'high';
  /** Total number of instances where this template fired (active or resolved). */
  fireCount: number;
  /** Fires that are currently resolved. */
  resolvedCount: number;
  /** Total instances where this template was applicable (pattern had the template). */
  applicableCount: number;
};

// ─── Frequency builder ────────────────────────────────────────────────────────

function buildFrequencyData(): {
  rows: TemplateFrequency[];
  totalInstances: number;
  totalFires: number;
  totalTemplates: number;
} {
  // templateId → accumulator
  const acc = new Map<
    string,
    {
      templateId: string;
      label: string;
      severity: 'low' | 'medium' | 'high';
      fireCount: number;
      resolvedCount: number;
      applicableCount: number;
    }
  >();

  const allInstances: Array<{
    id: string;
    patternId: string;
    evidenceMap: Record<string, unknown>;
  }> = [];

  // Collect source instances
  for (const inst of SOURCE_EVENT_INSTANCES) {
    allInstances.push({
      id: inst.id,
      patternId: inst.patternId,
      evidenceMap: buildEvidenceMap(inst),
    });
  }

  // Collect program instances
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    allInstances.push({
      id: inst.id,
      patternId: inst.patternId,
      evidenceMap: buildProgramEvidenceMap(inst),
    });
  }

  const ALL_PATTERNS = [...SOURCE_LIFECYCLE_PATTERNS, ...PROGRAM_LIFECYCLE_PATTERNS];

  for (const { id: instanceId, patternId, evidenceMap } of allInstances) {
    const pattern = ALL_PATTERNS.find((p) => p.patternId === patternId);
    if (!pattern) continue;

    const detector = createContradictionDetector(pattern);
    const firedDetections = detector.detect(evidenceMap);
    const firedById = new Map(firedDetections.map((d) => [d.templateId, d]));

    for (const tmpl of pattern.contradictionTemplates as ContradictionTemplate[]) {
      const existing = acc.get(tmpl.id);
      const entry = existing ?? {
        templateId: tmpl.id,
        label: tmpl.label,
        severity: tmpl.severity,
        fireCount: 0,
        resolvedCount: 0,
        applicableCount: 0,
      };

      entry.applicableCount += 1;

      const fired = firedById.has(tmpl.id);
      const resolvedKey = `${instanceId}::${tmpl.id}`;
      const resolved = isResolved(resolvedKey);

      if (fired || resolved) {
        entry.fireCount += 1;
        if (resolved) {
          entry.resolvedCount += 1;
        }
      }

      acc.set(tmpl.id, entry);
    }
  }

  const rows = Array.from(acc.values()).sort((a, b) => {
    if (b.fireCount !== a.fireCount) return b.fireCount - a.fireCount;
    return a.templateId.localeCompare(b.templateId);
  });

  const totalFires = rows.reduce((s, r) => s + r.fireCount, 0);

  return {
    rows,
    totalInstances: allInstances.length,
    totalFires,
    totalTemplates: rows.length,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryStrip({
  totalTemplates,
  totalFires,
  totalInstances,
}: {
  totalTemplates: number;
  totalFires: number;
  totalInstances: number;
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
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: `${COLORS.ink}99`,
          fontWeight: 600,
        }}
      >
        Summary
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 13,
          color: COLORS.ink,
        }}
      >
        {totalTemplates} template{totalTemplates === 1 ? '' : 's'} evaluated
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 13,
          color: COLORS.ink,
        }}
      >
        {totalFires} total fire{totalFires === 1 ? '' : 's'}
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 13,
          color: COLORS.ink,
        }}
      >
        across {totalInstances} instance{totalInstances === 1 ? '' : 's'}
      </span>
    </div>
  );
}

function SeverityDot({ severity }: { severity: 'low' | 'medium' | 'high' }) {
  const color =
    severity === 'high'
      ? COLORS.coralInk
      : severity === 'medium'
        ? COLORS.amberInk
        : `${COLORS.ink}66`;
  const label = severity === 'high' ? 'High' : severity === 'medium' ? 'Medium' : 'Low';
  return (
    <span
      title={label}
      aria-label={label}
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

function ResolutionPill({ resolved, total }: { resolved: number; total: number }) {
  if (total === 0) return null;
  const pct = Math.round((resolved / total) * 100);
  return (
    <span
      style={{
        display: 'inline-block',
        background: COLORS.mintSoft,
        color: COLORS.mintInk,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {pct}% resolved
    </span>
  );
}

function BarRow({
  row,
  maxFireCount,
}: {
  row: TemplateFrequency;
  maxFireCount: number;
}) {
  const barWidthPct = maxFireCount > 0 ? Math.round((row.fireCount / maxFireCount) * 100) : 0;
  const barColor =
    row.severity === 'high'
      ? COLORS.coralInk
      : row.severity === 'medium'
        ? COLORS.amberInk
        : `${COLORS.ink}55`;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '220px 1fr 80px 110px',
        alignItems: 'center',
        gap: SPACING.md,
        padding: `10px ${SPACING.lg}`,
        borderBottom: `1px solid ${COLORS.ink}0a`,
      }}
    >
      {/* Template ID + label + severity */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <SeverityDot severity={row.severity} />
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: `${COLORS.ink}aa`,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {row.templateId}
          </span>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: COLORS.ink,
            lineHeight: 1.3,
          }}
        >
          {row.label}
        </span>
      </div>

      {/* Bar */}
      <div
        style={{
          height: 12,
          background: `${COLORS.ink}0a`,
          borderRadius: RADIUS.sm,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${barWidthPct}%`,
            background: barColor,
            borderRadius: RADIUS.sm,
            transition: 'width 0.2s ease',
          }}
        />
      </div>

      {/* Count */}
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 12,
          color: COLORS.ink,
          textAlign: 'right',
          whiteSpace: 'nowrap',
        }}
      >
        {row.fireCount} / {row.applicableCount}
      </span>

      {/* Resolution pill */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {row.fireCount > 0 ? (
          <ResolutionPill resolved={row.resolvedCount} total={row.fireCount} />
        ) : (
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: `${COLORS.ink}44`,
            }}
          >
            —
          </span>
        )}
      </div>
    </div>
  );
}

function FrequencyBarChart({ rows }: { rows: TemplateFrequency[] }) {
  const firedRows = rows.filter((r) => r.fireCount > 0);
  const neverFiredRows = rows.filter((r) => r.fireCount === 0);
  const maxFireCount = firedRows.length > 0 ? firedRows[0].fireCount : 0;

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
            Frequency ranking
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Sorted by fire count descending · bar width proportional to max fires
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
          <LegendItem color={COLORS.coralInk} label="High" />
          <LegendItem color={COLORS.amberInk} label="Medium" />
          <LegendItem color={`${COLORS.ink}55`} label="Low" />
        </div>
      </header>

      {/* Column headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '220px 1fr 80px 110px',
          gap: SPACING.md,
          padding: `${SPACING.sm} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}14`,
          background: `${COLORS.ink}04`,
        }}
      >
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: `${COLORS.ink}88`,
          }}
        >
          Template
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: `${COLORS.ink}88`,
          }}
        >
          Frequency
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: `${COLORS.ink}88`,
            textAlign: 'right',
          }}
        >
          Fired / N
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: `${COLORS.ink}88`,
            textAlign: 'right',
          }}
        >
          Resolution
        </span>
      </div>

      {/* Fired rows */}
      {firedRows.map((row) => (
        <BarRow key={row.templateId} row={row} maxFireCount={maxFireCount} />
      ))}

      {firedRows.length === 0 && (
        <div
          style={{
            padding: `${SPACING.xl} ${SPACING.lg}`,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${COLORS.ink}88`,
            textAlign: 'center',
          }}
        >
          No contradiction templates have fired across any instance.
        </div>
      )}

      {/* Never-fired section */}
      {neverFiredRows.length > 0 && (
        <>
          <div
            style={{
              padding: `${SPACING.sm} ${SPACING.lg}`,
              borderTop: `1px solid ${COLORS.ink}14`,
              borderBottom: `1px solid ${COLORS.ink}0a`,
              background: `${COLORS.ink}04`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: SPACING.md,
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: `${COLORS.ink}66`,
              }}
            >
              Never fired
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: `${COLORS.ink}66`,
              }}
            >
              {neverFiredRows.length} template{neverFiredRows.length === 1 ? '' : 's'}
            </span>
          </div>
          {neverFiredRows.map((row) => (
            <div
              key={row.templateId}
              style={{
                display: 'grid',
                gridTemplateColumns: '220px 1fr 80px 110px',
                alignItems: 'center',
                gap: SPACING.md,
                padding: `8px ${SPACING.lg}`,
                borderBottom: `1px solid ${COLORS.ink}0a`,
                opacity: 0.55,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <SeverityDot severity={row.severity} />
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 11,
                      color: `${COLORS.ink}aa`,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {row.templateId}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 12,
                    color: COLORS.ink,
                    lineHeight: 1.3,
                  }}
                >
                  {row.label}
                </span>
              </div>
              <div
                style={{
                  height: 12,
                  background: `${COLORS.ink}08`,
                  borderRadius: RADIUS.sm,
                }}
              />
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 12,
                  color: `${COLORS.ink}66`,
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                }}
              >
                0 / {row.applicableCount}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  color: `${COLORS.ink}44`,
                  textAlign: 'right',
                }}
              >
                —
              </span>
            </div>
          ))}
        </>
      )}
    </section>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        color: `${COLORS.ink}99`,
      }}
    >
      <span
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContradictionFrequencyPage() {
  const { rows, totalInstances, totalFires, totalTemplates } = buildFrequencyData();

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
        title="Contradiction frequency"
        subtitle="Which contradiction templates fire most often across all instances — ranked by frequency."
      >
        <SummaryStrip
          totalTemplates={totalTemplates}
          totalFires={totalFires}
          totalInstances={totalInstances}
        />
        <FrequencyBarChart rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
