// /admin/reasoning/waiver-analysis — Portfolio-wide waiver deep-dive.
//
// Pure server component. Loads all active gate waivers from the in-memory
// store, then derives:
//   1. Summary KPI strip (total waivers, unique instances, most-waived
//      criterion, avg waivers per instance).
//   2. Waiver frequency by instance — horizontal CSS bar chart.
//   3. Criterion frequency table — waiver count, % of instances, risk label.
//   4. Concentration risk card — if any criterion is waived in >50% of
//      instances, surface a warning.
//   5. Waiver-free badge list — instances with zero waivers.

import type { CSSProperties } from 'react';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { getWaivers } from '@/app/api/reasoning/gate-waiver/route';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Waiver analysis · AbarVa Admin',
};

// ─── Palette constants (inline — rust not in design-tokens yet) ───────────────

const RUST_SOFT = '#FFF0E6';
const RUST_INK = '#8B3A0F';

// ─── Instance name lookup ─────────────────────────────────────────────────────

function buildInstanceNameIndex(): Map<string, string> {
  const index = new Map<string, string>();
  for (const inst of SOURCE_EVENT_INSTANCES) {
    index.set(inst.id, inst.name);
  }
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    index.set(inst.id, inst.name);
  }
  return index;
}

// ─── Derived data types ───────────────────────────────────────────────────────

interface InstanceWaiverCount {
  instanceId: string;
  instanceName: string;
  count: number;
}

interface CriterionRow {
  criterionId: string;
  waiverCount: number;
  instancesAffected: number;
  /** As a fraction 0–1. */
  pctAffected: number;
  risk: 'High' | 'Medium' | 'Low';
}

interface WaiverAnalysis {
  totalWaivers: number;
  uniqueInstancesWithWaivers: number;
  totalKnownInstances: number;
  mostWaivedCriterionId: string | null;
  mostWaivedCriterionCount: number;
  avgWaiversPerInstance: number;
  instanceCounts: InstanceWaiverCount[];
  waiverFreeInstances: InstanceWaiverCount[];
  criterionRows: CriterionRow[];
  concentrationCriteria: Array<{ criterionId: string; count: number }>;
}

// ─── Data assembly ────────────────────────────────────────────────────────────

function buildAnalysis(): WaiverAnalysis {
  const nameIndex = buildInstanceNameIndex();

  // All known instances (union of source + programs fixture)
  const allKnownIds = new Set<string>();
  for (const inst of SOURCE_EVENT_INSTANCES) allKnownIds.add(inst.id);
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) allKnownIds.add(inst.id);
  const totalKnownInstances = allKnownIds.size;

  const waivers = getWaivers();

  // Per-instance count
  const instanceCountMap = new Map<string, number>();
  for (const w of waivers) {
    instanceCountMap.set(w.instanceId, (instanceCountMap.get(w.instanceId) ?? 0) + 1);
  }

  // Per-criterion aggregation
  const criterionCountMap = new Map<string, number>();
  const criterionInstanceSetMap = new Map<string, Set<string>>();
  for (const w of waivers) {
    criterionCountMap.set(w.criterionId, (criterionCountMap.get(w.criterionId) ?? 0) + 1);
    const s = criterionInstanceSetMap.get(w.criterionId) ?? new Set<string>();
    s.add(w.instanceId);
    criterionInstanceSetMap.set(w.criterionId, s);
  }

  // Sort criterion rows descending by count
  const criterionRows: CriterionRow[] = Array.from(criterionCountMap.entries())
    .map(([criterionId, waiverCount]) => {
      const instancesAffected = criterionInstanceSetMap.get(criterionId)?.size ?? 0;
      const pctAffected = totalKnownInstances > 0 ? instancesAffected / totalKnownInstances : 0;
      let risk: 'High' | 'Medium' | 'Low';
      if (waiverCount >= 3) risk = 'High';
      else if (waiverCount === 2) risk = 'Medium';
      else risk = 'Low';
      return { criterionId, waiverCount, instancesAffected, pctAffected, risk };
    })
    .sort((a, b) => b.waiverCount - a.waiverCount);

  // Most-waived criterion
  const topCriterion = criterionRows[0] ?? null;

  // Instance counts — sorted descending by count, then by name
  const instanceCountsWithWaivers: InstanceWaiverCount[] = Array.from(instanceCountMap.entries())
    .map(([instanceId, count]) => ({
      instanceId,
      instanceName: nameIndex.get(instanceId) ?? instanceId,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.instanceName.localeCompare(b.instanceName));

  // Waiver-free instances
  const waiverFreeInstances: InstanceWaiverCount[] = Array.from(allKnownIds)
    .filter((id) => !instanceCountMap.has(id))
    .map((id) => ({
      instanceId: id,
      instanceName: nameIndex.get(id) ?? id,
      count: 0,
    }))
    .sort((a, b) => a.instanceName.localeCompare(b.instanceName));

  const uniqueInstancesWithWaivers = instanceCountsWithWaivers.length;
  const avgWaiversPerInstance =
    uniqueInstancesWithWaivers > 0
      ? waivers.length / uniqueInstancesWithWaivers
      : 0;

  // Concentration risk: any criterion waived in >50% of all known instances
  const concentrationCriteria = criterionRows
    .filter((r) => r.pctAffected > 0.5)
    .map((r) => ({ criterionId: r.criterionId, count: r.instancesAffected }));

  return {
    totalWaivers: waivers.length,
    uniqueInstancesWithWaivers,
    totalKnownInstances,
    mostWaivedCriterionId: topCriterion?.criterionId ?? null,
    mostWaivedCriterionCount: topCriterion?.waiverCount ?? 0,
    avgWaiversPerInstance,
    instanceCounts: instanceCountsWithWaivers,
    waiverFreeInstances,
    criterionRows,
    concentrationCriteria,
  };
}

// ─── Style constants ──────────────────────────────────────────────────────────

const HEADER_CELL: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontWeight: 700,
  color: `${COLORS.ink}cc`,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  background: COLORS.skyPale,
  borderBottom: `1px solid ${COLORS.ink}1a`,
  whiteSpace: 'nowrap',
};

const BODY_CELL: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}0d`,
  verticalAlign: 'top',
};

const MONO_CELL: CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}bb`,
};

// ─── Section 1: Summary KPI strip ────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xs,
        minHeight: 110,
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: `${COLORS.ink}99`,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 36,
          color: COLORS.ink,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
        }}
      >
        {value}
      </div>
      {sub ? (
        <div style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: `${COLORS.ink}88` }}>
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function SummaryKpiStrip({ analysis }: { analysis: WaiverAnalysis }) {
  const avg = analysis.avgWaiversPerInstance.toFixed(1);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: SPACING.md,
      }}
    >
      <KpiCard label="Total waivers" value={analysis.totalWaivers} sub="active in store" />
      <KpiCard
        label="Instances with waivers"
        value={analysis.uniqueInstancesWithWaivers}
        sub={`of ${analysis.totalKnownInstances} known`}
      />
      <KpiCard
        label="Most-waived criterion"
        value={analysis.mostWaivedCriterionId ?? '—'}
        sub={
          analysis.mostWaivedCriterionId
            ? `${analysis.mostWaivedCriterionCount} waiver${analysis.mostWaivedCriterionCount === 1 ? '' : 's'}`
            : 'no waivers yet'
        }
      />
      <KpiCard
        label="Avg waivers / instance"
        value={avg}
        sub="among instances with any waiver"
      />
    </div>
  );
}

// ─── Section 2: Waiver frequency by instance (horizontal bar chart) ───────────

function barColor(count: number): { bg: string; fg: string } {
  if (count === 0) return { bg: `${COLORS.ink}14`, fg: `${COLORS.ink}66` };
  if (count <= 2) return { bg: COLORS.amberSoft, fg: COLORS.amberInk };
  return { bg: RUST_SOFT, fg: RUST_INK };
}

function InstanceFrequencyChart({ instances }: { instances: InstanceWaiverCount[] }) {
  if (instances.length === 0) return null;

  const maxCount = instances[0]?.count ?? 1;

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
            Waiver frequency by instance
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Amber = 1–2 waivers · Rust = 3+ waivers
          </div>
        </div>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>
          {instances.length} instance{instances.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ padding: SPACING.md, display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
        {instances.map((inst) => {
          const palette = barColor(inst.count);
          const widthPct = maxCount > 0 ? (inst.count / maxCount) * 100 : 0;
          return (
            <div key={inst.instanceId} style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
              <div
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: COLORS.ink,
                  width: 200,
                  minWidth: 200,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={inst.instanceName}
              >
                {inst.instanceName}
              </div>
              <div style={{ flex: 1, background: `${COLORS.ink}0a`, borderRadius: RADIUS.sm, overflow: 'hidden', height: 20 }}>
                <div
                  style={{
                    width: `${widthPct}%`,
                    minWidth: inst.count > 0 ? 24 : 0,
                    height: '100%',
                    background: palette.bg,
                    borderRadius: RADIUS.sm,
                    transition: 'width 0s',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: SPACING.xs,
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 12,
                  fontWeight: 700,
                  color: palette.fg,
                  width: 28,
                  textAlign: 'right',
                }}
              >
                {inst.count}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Section 3: Criterion frequency table ────────────────────────────────────

function riskBadge(risk: 'High' | 'Medium' | 'Low') {
  const style: CSSProperties =
    risk === 'High'
      ? { background: RUST_SOFT, color: RUST_INK }
      : risk === 'Medium'
        ? { background: COLORS.amberSoft, color: COLORS.amberInk }
        : { background: COLORS.mintSoft, color: COLORS.mintInk };

  return (
    <span
      style={{
        ...style,
        display: 'inline-block',
        borderRadius: RADIUS.pill,
        padding: '2px 9px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
      }}
    >
      {risk}
    </span>
  );
}

function CriterionFrequencyTable({
  rows,
  totalInstances,
}: {
  rows: CriterionRow[];
  totalInstances: number;
}) {
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
            Criterion frequency
          </h2>
          <div
            style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: `${COLORS.ink}88`, marginTop: 2 }}
          >
            Sorted descending by waiver count · Risk: High ≥ 3, Medium = 2, Low = 1
          </div>
        </div>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>
          {rows.length} criterion{rows.length === 1 ? '' : 'a'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Criterion</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Waivers</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>
                % of instances ({totalInstances} total)
              </th>
              <th style={HEADER_CELL}>Risk</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const rowBg = idx % 2 === 0 ? COLORS.white : `${COLORS.ink}04`;
              return (
                <tr key={row.criterionId}>
                  <td
                    style={{
                      ...MONO_CELL,
                      background: rowBg,
                      fontSize: 12,
                      fontWeight: 600,
                      color: COLORS.navy,
                    }}
                  >
                    {row.criterionId}
                  </td>
                  <td style={{ ...MONO_CELL, background: rowBg, textAlign: 'right' }}>
                    {row.waiverCount}
                  </td>
                  <td style={{ ...MONO_CELL, background: rowBg, textAlign: 'right' }}>
                    {(row.pctAffected * 100).toFixed(0)}%
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 11,
                        color: `${COLORS.ink}66`,
                        marginLeft: 4,
                      }}
                    >
                      ({row.instancesAffected} instance{row.instancesAffected === 1 ? '' : 's'})
                    </span>
                  </td>
                  <td style={{ ...BODY_CELL, background: rowBg }}>
                    {riskBadge(row.risk)}
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

// ─── Section 4: Concentration risk card ──────────────────────────────────────

function ConcentrationRiskCard({
  risks,
  totalInstances,
}: {
  risks: Array<{ criterionId: string; count: number }>;
  totalInstances: number;
}) {
  if (risks.length === 0) return null;

  return (
    <section
      style={{
        background: RUST_SOFT,
        border: `1px solid ${RUST_INK}33`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 20,
          color: RUST_INK,
          letterSpacing: '-0.01em',
        }}
      >
        Concentration risk detected
      </div>
      {risks.map((r) => (
        <div
          key={r.criterionId}
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: RUST_INK,
            lineHeight: 1.5,
          }}
        >
          ⚠️ Concentration risk:{' '}
          <span style={{ fontFamily: TYPOGRAPHY.mono, fontWeight: 700 }}>{r.criterionId}</span>{' '}
          waived in {r.count} of {totalInstances} instances. Consider revising this gate criterion.
        </div>
      ))}
    </section>
  );
}

// ─── Section 5: Waiver-free badge list ────────────────────────────────────────

function WaiverFreeBadges({ instances }: { instances: InstanceWaiverCount[] }) {
  if (instances.length === 0) return null;

  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
      }}
    >
      <h2
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 20,
          color: COLORS.ink,
          margin: `0 0 ${SPACING.md}`,
          letterSpacing: '-0.01em',
        }}
      >
        Waiver-free instances{' '}
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 13,
            color: `${COLORS.ink}66`,
            fontWeight: 400,
          }}
        >
          ({instances.length})
        </span>
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING.sm }}>
        {instances.map((inst) => (
          <div
            key={inst.instanceId}
            style={{
              background: COLORS.mintSoft,
              color: COLORS.mintInk,
              borderRadius: RADIUS.pill,
              padding: '4px 14px',
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
            }}
          >
            {inst.instanceName}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

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
        lineHeight: 1.8,
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 20,
          color: COLORS.ink,
          marginBottom: SPACING.sm,
          letterSpacing: '-0.01em',
        }}
      >
        No active waivers
      </div>
      Use the waiver button on a Source or Programs detail page to record gate waivers. They will
      appear here once at least one waiver is in the store.
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function WaiverAnalysisPage() {
  const analysis = buildAnalysis();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open waiver log"
          primaryActionHref="/admin/reasoning/waiver-log"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Waivers"
        title="Waiver Analysis"
        subtitle="Portfolio-wide waiver patterns — frequency, concentration, and risk profiling"
      >
        <SummaryKpiStrip analysis={analysis} />

        {analysis.totalWaivers === 0 ? (
          <EmptyState />
        ) : (
          <>
            <ConcentrationRiskCard
              risks={analysis.concentrationCriteria}
              totalInstances={analysis.totalKnownInstances}
            />
            <InstanceFrequencyChart instances={analysis.instanceCounts} />
            <CriterionFrequencyTable
              rows={analysis.criterionRows}
              totalInstances={analysis.totalKnownInstances}
            />
          </>
        )}

        <WaiverFreeBadges instances={analysis.waiverFreeInstances} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
