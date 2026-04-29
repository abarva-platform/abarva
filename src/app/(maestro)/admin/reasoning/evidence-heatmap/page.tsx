// /admin/reasoning/evidence-heatmap — CSS-grid heatmap of evidence density.
//
// Pure server component, force-dynamic.
//
// Rows = instances, columns = lifecycle stages, cell color = evidence count
// intensity. Derived from `buildHealthBoardRows` + `getEvidenceFor` per
// instance + `getAllLifecyclePatterns` for stage list.
//
// Sections:
//   1. Legend strip   — 5 color swatches for 0 / 1-2 / 3-5 / 6-9 / 10+
//   2. Heatmap grid   — CSS grid with header row + one row per instance
//   3. Sparse instances card  — total evidence < 3
//   4. Rich instances card    — total evidence ≥ 10

import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import { getEvidenceFor } from '@/lib/reasoning/evidence-ingestion-store';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Evidence Heatmap · AbarVa Admin',
};

// ─── Heat color function ──────────────────────────────────────────────────────

function heatColor(n: number): string {
  if (n === 0) return '#F0EEE9';
  if (n <= 2) return '#C8EDD8';
  if (n <= 5) return '#7DC99E';
  if (n <= 9) return '#3BA865';
  return '#1A6B3F';
}

function heatTextColor(n: number): string {
  if (n === 0) return 'transparent';
  if (n <= 2) return '#1A6B3F';
  if (n <= 5) return '#0D4828';
  return '#F8F7F4';
}

// ─── Data computation ─────────────────────────────────────────────────────────

interface HeatmapRow {
  instanceId: string;
  instanceLabel: string;
  stageCounts: number[]; // one entry per displayed stage
  totalCount: number;
}

function buildHeatmapData(): {
  stageLabels: string[];
  rows: HeatmapRow[];
} {
  const allPatterns = getAllLifecyclePatterns();
  // Use the first pattern's stages, capped at 8
  const stages = allPatterns.length > 0 ? allPatterns[0].stages.slice(0, 8) : [];
  const stageLabels = stages.map((s) => s.label.slice(0, 8));
  const stageCount = stages.length;

  const healthRows = buildHealthBoardRows();

  const rows: HeatmapRow[] = healthRows.map((row) => {
    const evidenceItems = getEvidenceFor(row.id);
    const evidenceCount = evidenceItems.length;

    // Check if evidence items carry a `stage` or `stageId` field for per-stage breakdown.
    // If they do, tally per stage; otherwise distribute evenly.
    const stageCounts = new Array<number>(stageCount).fill(0);

    if (stageCount > 0) {
      let hasStageField = false;

      // Try to map evidence items to stages using stage/stageId field
      for (const item of evidenceItems) {
        const stageVal = (item as Record<string, unknown>).stage ?? (item as Record<string, unknown>).stageId;
        if (typeof stageVal === 'string') {
          const idx = stages.findIndex(
            (s) => s.id === stageVal || s.label.toLowerCase() === stageVal.toLowerCase(),
          );
          if (idx >= 0) {
            stageCounts[idx]++;
            hasStageField = true;
          }
        }
      }

      // Fall back: distribute evenly if no stage field was found
      if (!hasStageField && evidenceCount > 0) {
        const base = Math.floor(evidenceCount / stageCount);
        const remainder = evidenceCount % stageCount;
        for (let i = 0; i < stageCount; i++) {
          stageCounts[i] = base + (i < remainder ? 1 : 0);
        }
      }
    }

    return {
      instanceId: row.id,
      instanceLabel: row.label,
      stageCounts,
      totalCount: evidenceCount,
    };
  });

  return { stageLabels, rows };
}

// ─── Legend strip ─────────────────────────────────────────────────────────────

const LEGEND_ITEMS: Array<{ label: string; color: string; textColor: string }> = [
  { label: '0', color: '#F0EEE9', textColor: `${COLORS.ink}88` },
  { label: '1–2', color: '#C8EDD8', textColor: '#1A6B3F' },
  { label: '3–5', color: '#7DC99E', textColor: '#0D4828' },
  { label: '6–9', color: '#3BA865', textColor: '#F8F7F4' },
  { label: '10+', color: '#1A6B3F', textColor: '#F8F7F4' },
];

function LegendStrip() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.sm,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: `${COLORS.ink}88`,
          marginRight: 4,
        }}
      >
        Evidence density:
      </span>
      {LEGEND_ITEMS.map((item) => (
        <div
          key={item.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              background: item.color,
              borderRadius: RADIUS.sm,
              border: `1px solid ${COLORS.ink}14`,
            }}
          />
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: `${COLORS.ink}99`,
            }}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Heatmap grid ─────────────────────────────────────────────────────────────

const CELL_SIZE = 40;
const LABEL_WIDTH = 140;
const CELL_STYLE_BASE: CSSProperties = {
  width: CELL_SIZE,
  height: CELL_SIZE,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 10,
  fontFamily: TYPOGRAPHY.mono,
  fontWeight: 600,
  borderRadius: 2,
  flexShrink: 0,
};

function HeatmapGrid({
  stageLabels,
  rows,
}: {
  stageLabels: string[];
  rows: HeatmapRow[];
}) {
  if (stageLabels.length === 0 || rows.length === 0) {
    return (
      <div
        style={{
          background: COLORS.white,
          border: `1px dashed ${COLORS.ink}33`,
          borderRadius: RADIUS.lg,
          padding: SPACING.xl,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: `${COLORS.ink}88`,
          textAlign: 'center',
        }}
      >
        No data available.
      </div>
    );
  }

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}0c`,
        }}
      >
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 700,
          }}
        >
          Instance × Stage Heatmap
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          {rows.length} instances · {stageLabels.length} stages
        </div>
      </div>
      <div style={{ overflowX: 'auto', padding: SPACING.lg }}>
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            marginBottom: 2,
          }}
        >
          <div style={{ width: LABEL_WIDTH, flexShrink: 0 }} />
          {stageLabels.map((sl, i) => (
            <div
              key={i}
              style={{
                width: CELL_SIZE,
                flexShrink: 0,
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: `${COLORS.ink}88`,
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {sl}
            </div>
          ))}
        </div>
        {/* Data rows */}
        {rows.map((row) => (
          <div
            key={row.instanceId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              marginBottom: 2,
            }}
          >
            <div
              style={{
                width: LABEL_WIDTH,
                flexShrink: 0,
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                fontWeight: 600,
                color: COLORS.ink,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                paddingRight: 8,
              }}
              title={row.instanceLabel}
            >
              {row.instanceLabel.slice(0, 14)}
            </div>
            {row.stageCounts.map((count, i) => (
              <div
                key={i}
                style={{
                  ...CELL_STYLE_BASE,
                  background: heatColor(count),
                  color: heatTextColor(count),
                }}
                title={`${row.instanceLabel} · Stage ${i + 1}: ${count} evidence item(s)`}
              >
                {count > 0 ? count : ''}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Instance list cards ──────────────────────────────────────────────────────

function InstanceListCard({
  title,
  subtitle,
  rows,
  accentColor,
  badge,
}: {
  title: string;
  subtitle: string;
  rows: HeatmapRow[];
  accentColor: string;
  badge: string;
}) {
  return (
    <div
      style={{
        flex: '1 1 300px',
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderTop: `3px solid ${accentColor}`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}0c`,
        }}
      >
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 700,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          {subtitle}
        </div>
      </div>
      {rows.length === 0 ? (
        <div
          style={{
            padding: SPACING.lg,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${COLORS.ink}66`,
          }}
        >
          None found.
        </div>
      ) : (
        <div style={{ padding: `${SPACING.sm} 0` }}>
          {rows.map((row) => (
            <div
              key={row.instanceId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `8px ${SPACING.lg}`,
                borderBottom: `1px solid ${COLORS.ink}08`,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.ink,
                  }}
                >
                  {row.instanceLabel}
                </div>
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 10,
                    color: `${COLORS.ink}66`,
                    marginTop: 1,
                  }}
                >
                  {row.instanceId}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 13,
                    fontWeight: 700,
                    color: accentColor,
                  }}
                >
                  {row.totalCount}
                </span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    background: `${accentColor}18`,
                    color: accentColor,
                    borderRadius: RADIUS.pill,
                    padding: '2px 8px',
                  }}
                >
                  {badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EvidenceHeatmapPage() {
  const { stageLabels, rows } = buildHeatmapData();

  const sparseRows = rows.filter((r) => r.totalCount < 3);
  const richRows = rows.filter((r) => r.totalCount >= 10);

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to Reasoning"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Evidence Heatmap"
        subtitle="Evidence density per instance × stage — darker = more evidence"
      >
        {/* ── Legend ── */}
        <LegendStrip />

        {/* ── Heatmap grid ── */}
        <HeatmapGrid stageLabels={stageLabels} rows={rows} />

        {/* ── Sparse + Rich instance cards ── */}
        <div
          style={{
            display: 'flex',
            gap: SPACING.md,
            flexWrap: 'wrap',
            alignItems: 'flex-start',
          }}
        >
          <InstanceListCard
            title="Sparse Instances"
            subtitle="Total evidence < 3 across all stages"
            rows={sparseRows}
            accentColor={COLORS.amberInk}
            badge="needs more evidence"
          />
          <InstanceListCard
            title="Rich Instances"
            subtitle="Total evidence ≥ 10 across all stages"
            rows={richRows}
            accentColor={COLORS.mintInk}
            badge="well evidenced"
          />
        </div>
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
