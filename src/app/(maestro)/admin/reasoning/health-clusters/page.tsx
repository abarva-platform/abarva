// /admin/reasoning/health-clusters — Instances grouped by health score band.
//
// Pure server component, force-dynamic.
//
// Sections:
//   1. Cluster overview row  — 5 cards (Excellent / Good / Fair / Weak / Critical)
//      with instance count, avg health score, avg contradictions per cluster.
//   2. Per-cluster detail sections — instance table + common stage + avg dwell.
//   3. Anomaly callout — structural mismatches and hidden-strength instances.

import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows, type InstanceHealthRow } from '@/lib/reasoning/health-board';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Health Clusters · AbarVa Admin',
};

// ─── Cluster definitions ──────────────────────────────────────────────────────

const CLUSTERS = [
  { label: 'Excellent', min: 80, max: 100, color: '#1A6B3F' },
  { label: 'Good',      min: 65, max: 79,  color: '#3BA865' },
  { label: 'Fair',      min: 50, max: 64,  color: '#B8860B' },
  { label: 'Weak',      min: 35, max: 49,  color: '#C85A1A' },
  { label: 'Critical',  min: 0,  max: 34,  color: '#8B1A1A' },
] as const;

type ClusterLabel = (typeof CLUSTERS)[number]['label'];

// ─── Enriched row ─────────────────────────────────────────────────────────────

interface EnrichedRow {
  id: string;
  name: string;
  type: 'source' | 'program';
  healthScore: number;
  gatesMet: number;
  gatesTotal: number;
  activeContradictions: number;
  currentStage: string;
  /** stageIndex derived from stageLabel/phaseLabel via lifecycle patterns */
  stageIndex: number;
}

// ─── Health score derivation (matches synthesis-comparison formula) ──────────

function deriveHealthScore(row: InstanceHealthRow): number {
  return Math.round(
    (row.gatesMet / Math.max(row.gatesTotal, 1)) * 60 +
      (1 - Math.min(row.activeContradictions / 5, 1)) * 30 +
      10,
  );
}

// ─── Stage index derivation ───────────────────────────────────────────────────

function buildStageIndexMap(): Map<string, number> {
  const map = new Map<string, number>();
  for (const pattern of getAllLifecyclePatterns()) {
    for (const stage of pattern.stages) {
      const key = stage.label.toLowerCase();
      if (!map.has(key)) {
        map.set(key, stage.order);
      }
    }
  }
  return map;
}

function deriveStageIndex(stageLabel: string, indexMap: Map<string, number>): number {
  const lower = stageLabel.toLowerCase();
  // Try exact match first, then substring
  for (const [key, idx] of indexMap.entries()) {
    if (lower.includes(key) || key.includes(lower)) return idx;
  }
  return 0;
}

// ─── Data assembly ────────────────────────────────────────────────────────────

function buildEnrichedRows(): EnrichedRow[] {
  const raw = buildHealthBoardRows();
  const stageIndexMap = buildStageIndexMap();

  return raw.map((r) => {
    const healthScore = deriveHealthScore(r);
    const currentStage = r.stageLabel ?? r.phaseLabel ?? '—';
    const stageIndex = deriveStageIndex(currentStage, stageIndexMap);
    return {
      id: r.id,
      name: r.label,
      type: r.type,
      healthScore,
      gatesMet: r.gatesMet,
      gatesTotal: r.gatesTotal,
      activeContradictions: r.activeContradictions,
      currentStage,
      stageIndex,
    };
  });
}

// ─── Cluster bucketing ────────────────────────────────────────────────────────

function clusterFor(score: number): ClusterLabel {
  for (const c of CLUSTERS) {
    if (score >= c.min && score <= c.max) return c.label;
  }
  return 'Critical';
}

interface ClusterBucket {
  label: ClusterLabel;
  color: string;
  min: number;
  max: number;
  rows: EnrichedRow[];
  avgScore: number;
  avgContradictions: number;
}

function buildClusters(rows: EnrichedRow[]): ClusterBucket[] {
  return CLUSTERS.map((c) => {
    const members = rows.filter((r) => r.healthScore >= c.min && r.healthScore <= c.max);
    const avgScore =
      members.length > 0
        ? members.reduce((s, r) => s + r.healthScore, 0) / members.length
        : 0;
    const avgContradictions =
      members.length > 0
        ? members.reduce((s, r) => s + r.activeContradictions, 0) / members.length
        : 0;
    return {
      label: c.label,
      color: c.color,
      min: c.min,
      max: c.max,
      rows: members,
      avgScore,
      avgContradictions,
    };
  });
}

// ─── Mode helper ─────────────────────────────────────────────────────────────

function mode<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  const freq = new Map<string, { val: T; count: number }>();
  for (const v of arr) {
    const key = String(v);
    const existing = freq.get(key);
    if (existing) existing.count++;
    else freq.set(key, { val: v, count: 1 });
  }
  let best: { val: T; count: number } | null = null;
  for (const entry of freq.values()) {
    if (!best || entry.count > best.count) best = entry;
  }
  return best ? best.val : null;
}

// ─── Anomaly detection ────────────────────────────────────────────────────────

interface AnomalyRow {
  id: string;
  name: string;
  healthScore: number;
  gatesPct: number;
  activeContradictions: number;
  kind: 'structural-mismatch' | 'hidden-strength';
}

function detectAnomalies(rows: EnrichedRow[]): AnomalyRow[] {
  const result: AnomalyRow[] = [];
  for (const r of rows) {
    const cluster = clusterFor(r.healthScore);
    const gatesPct = r.gatesTotal > 0 ? (r.gatesMet / r.gatesTotal) * 100 : 0;

    if (cluster === 'Excellent' && gatesPct < 60) {
      result.push({
        id: r.id,
        name: r.name,
        healthScore: r.healthScore,
        gatesPct,
        activeContradictions: r.activeContradictions,
        kind: 'structural-mismatch',
      });
    } else if ((cluster === 'Weak' || cluster === 'Critical') && gatesPct >= 70) {
      result.push({
        id: r.id,
        name: r.name,
        healthScore: r.healthScore,
        gatesPct,
        activeContradictions: r.activeContradictions,
        kind: 'hidden-strength',
      });
    }
  }
  return result;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ClusterOverviewCard({ bucket }: { bucket: ClusterBucket }) {
  const empty = bucket.rows.length === 0;
  return (
    <div
      style={{
        flex: '1 1 140px',
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderTop: `3px solid ${bucket.color}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        opacity: empty ? 0.5 : 1,
      }}
    >
      {/* Color swatch + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            display: 'inline-block',
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: bucket.color,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: bucket.color,
          }}
        >
          {bucket.label}
        </span>
      </div>
      {/* Range */}
      <div
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 10,
          color: `${COLORS.ink}66`,
        }}
      >
        {bucket.min}–{bucket.max}
      </div>
      {/* Instance count */}
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 28,
          color: COLORS.ink,
          lineHeight: 1,
          letterSpacing: '-0.01em',
        }}
      >
        {bucket.rows.length}
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 10,
          color: `${COLORS.ink}88`,
        }}
      >
        instance{bucket.rows.length === 1 ? '' : 's'}
      </div>
      {/* Avg score + avg contradictions */}
      {!empty && (
        <>
          <div
            style={{
              marginTop: 4,
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: COLORS.ink,
            }}
          >
            avg score: <strong>{bucket.avgScore.toFixed(1)}</strong>
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: COLORS.ink,
            }}
          >
            avg contradictions: <strong>{bucket.avgContradictions.toFixed(1)}</strong>
          </div>
        </>
      )}
    </div>
  );
}

function ClusterDetailSection({ bucket }: { bucket: ClusterBucket }) {
  if (bucket.rows.length === 0) return null;

  const commonStage = mode(bucket.rows.map((r) => r.currentStage)) ?? '—';
  const avgDwell =
    bucket.rows.reduce((s, r) => s + r.stageIndex * 12, 0) / bucket.rows.length;

  const TH: CSSProperties = {
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: `${COLORS.ink}88`,
    padding: '8px 12px',
    textAlign: 'left',
    borderBottom: `1px solid ${COLORS.ink}0c`,
    background: `${COLORS.ink}04`,
    whiteSpace: 'nowrap',
  };
  const TD: CSSProperties = {
    fontFamily: TYPOGRAPHY.mono,
    fontSize: 12,
    color: COLORS.ink,
    padding: '10px 12px',
    borderBottom: `1px solid ${COLORS.ink}08`,
    verticalAlign: 'middle',
  };

  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderLeft: `4px solid ${bucket.color}`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      {/* Cluster header */}
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}0c`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACING.md,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 16,
                fontWeight: 700,
                color: bucket.color,
                letterSpacing: '-0.01em',
              }}
            >
              {bucket.label}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: `${COLORS.ink}66`,
              }}
            >
              score {bucket.min}–{bucket.max}
            </span>
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
            }}
          >
            Common stage:{' '}
            <strong style={{ color: COLORS.ink, fontFamily: TYPOGRAPHY.mono, fontSize: 11 }}>
              {commonStage}
            </strong>
            {'  ·  '}Avg dwell proxy:{' '}
            <strong style={{ color: COLORS.ink }}>{avgDwell.toFixed(0)} days</strong>
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: bucket.color,
            fontWeight: 600,
          }}
        >
          {bucket.rows.length} instance{bucket.rows.length === 1 ? '' : 's'}
        </span>
      </header>

      {/* Instance table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={TH}>Name</th>
              <th style={{ ...TH, textAlign: 'center' }}>Health score</th>
              <th style={{ ...TH, textAlign: 'center' }}>Gates met %</th>
              <th style={{ ...TH, textAlign: 'center' }}>Active contradictions</th>
              <th style={{ ...TH }}>Current stage</th>
            </tr>
          </thead>
          <tbody>
            {bucket.rows.map((row) => {
              const gatesPct =
                row.gatesTotal > 0
                  ? `${((row.gatesMet / row.gatesTotal) * 100).toFixed(0)}%`
                  : '—';
              return (
                <tr key={row.id}>
                  <td
                    style={{
                      ...TD,
                      fontFamily: TYPOGRAPHY.sans,
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    {row.name}
                  </td>
                  <td style={{ ...TD, textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        background: `${bucket.color}18`,
                        color: bucket.color,
                        borderRadius: RADIUS.pill,
                        padding: '2px 10px',
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {row.healthScore}
                    </span>
                  </td>
                  <td style={{ ...TD, textAlign: 'center' }}>{gatesPct}</td>
                  <td
                    style={{
                      ...TD,
                      textAlign: 'center',
                      color:
                        row.activeContradictions >= 3
                          ? COLORS.coralInk
                          : row.activeContradictions >= 1
                          ? COLORS.amberInk
                          : COLORS.mintInk,
                      fontWeight: row.activeContradictions >= 3 ? 700 : 400,
                    }}
                  >
                    {row.activeContradictions}
                  </td>
                  <td
                    style={{
                      ...TD,
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 12,
                      color: `${COLORS.ink}99`,
                    }}
                  >
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

function AnomalyCallout({ anomalies }: { anomalies: AnomalyRow[] }) {
  if (anomalies.length === 0) return null;

  const mismatches = anomalies.filter((a) => a.kind === 'structural-mismatch');
  const hidden = anomalies.filter((a) => a.kind === 'hidden-strength');

  const TH: CSSProperties = {
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: `${COLORS.ink}88`,
    padding: '8px 12px',
    textAlign: 'left',
    borderBottom: `1px solid ${COLORS.ink}0c`,
    background: `${COLORS.ink}04`,
    whiteSpace: 'nowrap',
  };
  const TD: CSSProperties = {
    fontFamily: TYPOGRAPHY.mono,
    fontSize: 12,
    color: COLORS.ink,
    padding: '10px 12px',
    borderBottom: `1px solid ${COLORS.ink}08`,
    verticalAlign: 'middle',
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
          borderBottom: `1px solid ${COLORS.ink}0c`,
        }}
      >
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: COLORS.navy,
          }}
        >
          Anomaly Callout
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Instances whose cluster membership by health doesn&apos;t match their gate-pass rate
        </div>
      </header>

      {mismatches.length > 0 && (
        <div
          style={{
            padding: `${SPACING.sm} ${SPACING.lg}`,
            background: `${SHELL.AMBER_DOT}12`,
            borderBottom: `1px solid ${COLORS.ink}0c`,
          }}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              fontWeight: 700,
              color: '#B8860B',
              marginBottom: 4,
            }}
          >
            Structural mismatch — Excellent cluster but gates met &lt; 60%
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              color: `${COLORS.ink}99`,
            }}
          >
            Suggests inflated score driven by low contradiction count, not gate completion.
          </div>
        </div>
      )}

      {mismatches.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>Name</th>
                <th style={{ ...TH, textAlign: 'center' }}>Health score</th>
                <th style={{ ...TH, textAlign: 'center' }}>Gates met %</th>
                <th style={{ ...TH, textAlign: 'center' }}>Active contradictions</th>
              </tr>
            </thead>
            <tbody>
              {mismatches.map((a) => (
                <tr key={`mismatch-${a.id}`}>
                  <td
                    style={{
                      ...TD,
                      fontFamily: TYPOGRAPHY.sans,
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    {a.name}
                  </td>
                  <td style={{ ...TD, textAlign: 'center' }}>{a.healthScore}</td>
                  <td style={{ ...TD, textAlign: 'center', color: COLORS.amberInk, fontWeight: 700 }}>
                    {a.gatesPct.toFixed(0)}%
                  </td>
                  <td style={{ ...TD, textAlign: 'center' }}>{a.activeContradictions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hidden.length > 0 && (
        <div
          style={{
            padding: `${SPACING.sm} ${SPACING.lg}`,
            background: `${COLORS.mintInk}12`,
            borderBottom: `1px solid ${COLORS.ink}0c`,
            borderTop: mismatches.length > 0 ? `1px solid ${COLORS.ink}0c` : undefined,
          }}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              fontWeight: 700,
              color: COLORS.mintInk,
              marginBottom: 4,
            }}
          >
            Hidden strength — Weak/Critical cluster but gates met ≥ 70%
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              color: `${COLORS.ink}99`,
            }}
          >
            Suggests high contradictions are dragging the score down despite strong gate compliance.
          </div>
        </div>
      )}

      {hidden.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>Name</th>
                <th style={{ ...TH, textAlign: 'center' }}>Health score</th>
                <th style={{ ...TH, textAlign: 'center' }}>Gates met %</th>
                <th style={{ ...TH, textAlign: 'center' }}>Active contradictions</th>
              </tr>
            </thead>
            <tbody>
              {hidden.map((a) => (
                <tr key={`hidden-${a.id}`}>
                  <td
                    style={{
                      ...TD,
                      fontFamily: TYPOGRAPHY.sans,
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    {a.name}
                  </td>
                  <td style={{ ...TD, textAlign: 'center' }}>{a.healthScore}</td>
                  <td style={{ ...TD, textAlign: 'center', color: COLORS.mintInk, fontWeight: 700 }}>
                    {a.gatesPct.toFixed(0)}%
                  </td>
                  <td style={{ ...TD, textAlign: 'center', color: COLORS.coralInk, fontWeight: 700 }}>
                    {a.activeContradictions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {anomalies.length === 0 && (
        <div
          style={{
            padding: `${SPACING.lg}`,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${COLORS.ink}88`,
            textAlign: 'center',
          }}
        >
          No anomalies detected.
        </div>
      )}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HealthClustersPage() {
  const rows = buildEnrichedRows();
  const clusters = buildClusters(rows);
  const anomalies = detectAnomalies(rows);
  const populatedClusters = clusters.filter((c) => c.rows.length >= 1);

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
        title="Health Clusters"
        subtitle="Instances grouped by health score band — within-cluster patterns and anomalies"
      >
        {/* ── 1. Cluster overview row ── */}
        <div
          style={{
            display: 'flex',
            gap: SPACING.md,
            flexWrap: 'wrap',
          }}
        >
          {clusters.map((bucket) => (
            <div key={bucket.label} style={{ flex: '1 1 140px' }}>
              <ClusterOverviewCard bucket={bucket} />
            </div>
          ))}
        </div>

        {/* ── 2. Per-cluster detail sections ── */}
        {populatedClusters.length === 0 ? (
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
            No instances found.
          </div>
        ) : (
          populatedClusters.map((bucket) => (
            <div key={`detail-${bucket.label}`}>
              <ClusterDetailSection bucket={bucket} />
            </div>
          ))
        )}

        {/* ── 3. Anomaly callout ── */}
        <AnomalyCallout anomalies={anomalies} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
