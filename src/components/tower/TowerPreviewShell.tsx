'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { TowerViewModel, ContradictionRow } from '@/lib/tower/aggregate';

// TowerPreviewShell · redesign sandbox per the audit feedback.
// Keeps the 5-column "live system" cockpit (the audit called it "closest
// to right"), drops the cream narrative hero + the right-side duplicate
// metric tiles, adds a Pressure-Today row above the strip, and demotes
// Atlas to a right-edge dock.

const PAGE_BG = '#F8F7F4';
const PANEL_BG = '#FFFDFC';
const INK = '#171411';
const INK_SOFT = '#3A312A';
const INK_MUTED = '#5B4D43';
const INK_FAINT = '#8A7D70';
const LINE = 'rgba(23,20,17,0.12)';
const LINE_SOFT = 'rgba(23,20,17,0.06)';
const TEAL = '#0E9F8C';
const TEAL_SOFT = 'rgba(14,159,140,0.1)';
const AMBER = '#C08643';
const AMBER_SOFT = 'rgba(192,134,67,0.12)';
const CORAL = '#CE5A3B';
const CORAL_SOFT = 'rgba(206,90,59,0.1)';
const GREEN = '#3FB27F';
const SERIF = '"Fraunces", Georgia, serif';
const MONO = '"JetBrains Mono", "Fira Code", monospace';
const SANS = '"DM Sans", -apple-system, sans-serif';

type PillarKey = 'inventory' | 'adoption' | 'value' | 'risk' | 'cost';

interface PressureItem {
  id: string;
  monthlyUsd: number;
  title: string;
  programName: string | null;
  programHref: string | null;
  severity: 'critical' | 'high' | 'medium';
  unowned: boolean;
}

interface ContradictionImpact {
  monthly_total_usd?: number;
  eliminable_usd_annual?: number;
  owner_named?: boolean;
  one_liner?: string;
}

function fmtUsd(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '—';
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

function fmtRelTime(d: Date | null | undefined): string {
  if (!d) return '—';
  const mins = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function derivePressure(contradictions: ContradictionRow[]): PressureItem[] {
  // Top 3 by monthly $ · prefer unowned · prefer high severity
  const scored = contradictions.map((c) => {
    const impact = (c.evidence && typeof c.evidence === 'object' ? c.evidence : {}) as { impact?: ContradictionImpact };
    const monthly = Number(impact.impact?.monthly_total_usd ?? 0);
    const unowned = impact.impact?.owner_named === false;
    const oneLiner = impact.impact?.one_liner ?? c.description ?? c.contradiction_type.replace(/_/g, ' ');
    return {
      id: c.id,
      monthlyUsd: monthly,
      title: oneLiner,
      programName: c.triggered_engagement_id ? null : null,
      programHref: c.triggered_engagement_id ? `/engagements/${encodeURIComponent(c.triggered_engagement_id)}` : null,
      severity: (c.severity === 'low' ? 'medium' : c.severity === 'medium' ? 'high' : 'critical') as PressureItem['severity'],
      unowned,
      rawSeverity: c.severity,
    };
  });
  const ranked = [...scored].sort((a, b) => {
    if (a.unowned !== b.unowned) return a.unowned ? -1 : 1;
    return b.monthlyUsd - a.monthlyUsd;
  });
  return ranked.slice(0, 3);
}

// ─── Fallback data · used when the tenant has no aggregate rows yet ─────
const FALLBACK_PRESSURE: PressureItem[] = [
  {
    id: 'f-1',
    monthlyUsd: 42_000,
    title: 'VBC commitment vs. capability gap — 3 contracts at risk',
    programName: 'Meridian AI Readiness',
    programHref: '/engagements',
    severity: 'critical',
    unowned: true,
  },
  {
    id: 'f-2',
    monthlyUsd: 28_000,
    title: 'Shadow AI · PHI risk unowned across 3 clinical teams',
    programName: null,
    programHref: null,
    severity: 'high',
    unowned: true,
  },
  {
    id: 'f-3',
    monthlyUsd: 18_000,
    title: '3 ambient documentation tools running · no owner',
    programName: 'Ambient Documentation Vendor Strategy',
    programHref: '/engagements',
    severity: 'high',
    unowned: true,
  },
];

export function TowerPreviewShell({
  vm,
  clientName,
}: {
  vm: TowerViewModel | null;
  clientName: string;
  currentPath: string;
}) {
  const [expandedPillar, setExpandedPillar] = useState<PillarKey | null>(null);
  const [atlasOpen, setAtlasOpen] = useState(false);

  const pressure: PressureItem[] = vm?.contradictions?.length
    ? (() => {
        const derived = derivePressure(vm.contradictions);
        return derived.length > 0 ? derived : FALLBACK_PRESSURE;
      })()
    : FALLBACK_PRESSURE;

  const inventoryTotal = vm?.inventory.total ?? 42;
  const adoptionPct = Math.round(vm?.adoption.avgPenetrationPct ?? 62);
  const valueVerified = vm?.value.verifiedUsd ?? 51_000;
  const riskApproved = vm?.risk.approved ?? 13;
  const riskTotal = vm?.risk.totalAssessed ?? 25;
  const monthlySpend = vm?.cost.monthlySpendUsd ?? 1_400_000;
  const contradictionCount = vm?.contradictions?.length ?? 25;
  const unownedCount = pressure.filter((p) => p.unowned).length;
  const lastTurn = fmtRelTime(vm?.inventory.freshness ?? null);

  const now = new Date();
  const dateStr = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  return (
    <div
      style={{
        minHeight: '100vh',
        background: PAGE_BG,
        color: INK,
        fontFamily: SANS,
        paddingBottom: 60,
      }}
    >
      {/* Preview banner · flags this as a sandbox */}
      <div
        style={{
          background: INK,
          color: PAGE_BG,
          padding: '10px 24px',
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <span>
          <strong style={{ color: TEAL, marginRight: 10 }}>● TOWER · REDESIGN PREVIEW</strong>
          <span style={{ opacity: 0.7 }}>Sandbox route · live data · no user impact</span>
        </span>
        <Link
          href="/tower"
          style={{ color: PAGE_BG, opacity: 0.85, textDecoration: 'underline', fontSize: 11 }}
        >
          ← Compare with current /tower
        </Link>
      </div>

      {/* ─── Operating header · one line ─────────────────────────────── */}
      <div
        style={{
          padding: '22px 28px 18px',
          maxWidth: 1520,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: TEAL,
              marginBottom: 6,
              fontWeight: 600,
            }}
          >
            Tower · Control room
          </div>
          <h1
            style={{
              margin: 0,
              fontFamily: SERIF,
              fontSize: 34,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              color: INK,
            }}
          >
            {clientName}
            <span style={{ color: INK_FAINT, fontSize: 22, marginLeft: 12, fontFamily: SANS, fontWeight: 400 }}>
              · {dateStr} · {timeStr}
            </span>
          </h1>
          <div
            style={{
              display: 'flex',
              gap: 14,
              flexWrap: 'wrap',
              marginTop: 12,
              fontSize: 14,
              color: INK_SOFT,
            }}
          >
            <HeaderPill label="Use cases" value={String(inventoryTotal)} />
            <HeaderPill label="Contradictions" value={String(contradictionCount)} />
            <HeaderPill label="Unowned" value={String(unownedCount)} tone="amber" />
            <HeaderPill label="Spend" value={`${fmtUsd(monthlySpend)}/mo`} />
            <HeaderPill label="Last turn" value={lastTurn} muted />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setAtlasOpen(true)}
            style={{
              padding: '10px 18px',
              background: 'transparent',
              border: `1px solid ${LINE}`,
              borderRadius: 999,
              fontFamily: MONO,
              fontSize: 12,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: INK_SOFT,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Ask Atlas
          </button>
          <Link
            href="/programs"
            style={{
              padding: '10px 18px',
              background: INK,
              color: PAGE_BG,
              borderRadius: 999,
              fontFamily: MONO,
              fontSize: 12,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            Open programs →
          </Link>
        </div>
      </div>

      {/* ─── PRESSURE TODAY · the audit's key move ────────────────────── */}
      <div style={{ maxWidth: 1520, margin: '0 auto', padding: '0 28px 18px' }}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 12,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: CORAL,
            marginBottom: 10,
            fontWeight: 700,
          }}
        >
          Pressure today · {unownedCount} unowned · highest-dollar
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pressure.map((p) => (
            <PressureRow key={p.id} item={p} />
          ))}
        </div>
      </div>

      {/* ─── 5-COLUMN STRIP · the cockpit ─────────────────────────────── */}
      <div style={{ maxWidth: 1520, margin: '0 auto', padding: '0 28px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
            gap: 12,
          }}
        >
          <PillarCard
            pillar="inventory"
            label="Inventory"
            subtitle="What exists"
            value={String(inventoryTotal)}
            unit="use cases"
            breakdown={[
              { label: 'In production', value: vm?.inventory.inProduction ?? 11 },
              { label: 'In pilot', value: vm?.inventory.inPilot ?? 6 },
              { label: 'Stalled', value: vm?.inventory.stalled ?? 8, tone: 'amber' },
            ]}
            expanded={expandedPillar === 'inventory'}
            onClick={() => setExpandedPillar(expandedPillar === 'inventory' ? null : 'inventory')}
          />
          <PillarCard
            pillar="adoption"
            label="Adoption"
            subtitle="Who uses it"
            value={`${adoptionPct}%`}
            unit="avg penetration"
            breakdown={[
              { label: 'DAU', value: vm?.adoption.totalDau ?? 3460 },
              { label: 'WAU', value: vm?.adoption.totalWau ?? 13416 },
              { label: 'Avg drop-off', value: `${Math.round(vm?.adoption.avgDropOffPct ?? 27)}%`, tone: 'amber' },
            ]}
            expanded={expandedPillar === 'adoption'}
            onClick={() => setExpandedPillar(expandedPillar === 'adoption' ? null : 'adoption')}
          />
          <PillarCard
            pillar="value"
            label="Value"
            subtitle="Is it working"
            value={fmtUsd(valueVerified)}
            unit="verified"
            breakdown={[
              { label: 'Projected', value: fmtUsd(vm?.value.projectedUsd ?? 0) },
              { label: 'Drivers tracked', value: Object.keys(vm?.value.byDriver ?? {}).length || 3 },
              { label: 'Use cases with baseline', value: vm?.value.coveredUseCaseCount ?? 5 },
            ]}
            expanded={expandedPillar === 'value'}
            onClick={() => setExpandedPillar(expandedPillar === 'value' ? null : 'value')}
          />
          <PillarCard
            pillar="risk"
            label="Risk"
            subtitle="Is it safe"
            value={`${riskApproved}/${riskTotal}`}
            unit="approved"
            breakdown={[
              { label: 'Conditional / pending', value: `${vm?.risk.conditional ?? 6} · ${vm?.risk.pending ?? 6}` },
              { label: 'High risk', value: vm?.risk.highRisk ?? 2, tone: 'coral' },
              { label: 'Bias incidents', value: vm?.risk.biasIncidents ?? 0 },
            ]}
            expanded={expandedPillar === 'risk'}
            onClick={() => setExpandedPillar(expandedPillar === 'risk' ? null : 'risk')}
          />
          <PillarCard
            pillar="cost"
            label="Cost"
            subtitle="Is it worth it"
            value={`${fmtUsd(monthlySpend)}`}
            unit="/ month"
            breakdown={[
              { label: 'LLM', value: fmtUsd(vm?.cost.byCategory.llm ?? 204_000) },
              { label: 'Compute', value: fmtUsd(vm?.cost.byCategory.compute ?? 366_000) },
              { label: 'License', value: fmtUsd(vm?.cost.byCategory.license ?? 709_000) },
            ]}
            expanded={expandedPillar === 'cost'}
            onClick={() => setExpandedPillar(expandedPillar === 'cost' ? null : 'cost')}
          />
        </div>

        {/* Inline drill-down panel */}
        {expandedPillar ? (
          <DrillDown pillar={expandedPillar} onClose={() => setExpandedPillar(null)} />
        ) : null}
      </div>

      {/* ─── Programs quick footer ─────────────────────────────────────── */}
      <div style={{ maxWidth: 1520, margin: '0 auto', padding: '32px 28px 0' }}>
        <div
          style={{
            padding: '18px 22px',
            background: PANEL_BG,
            border: `1px solid ${LINE}`,
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 18,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            <div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: INK_MUTED,
                }}
              >
                Active programs
              </div>
              <div style={{ fontSize: 14, color: INK, marginTop: 4 }}>
                <Link href="/programs" style={{ color: INK, textDecoration: 'underline' }}>
                  Meridian AI Readiness
                </Link>
                <span style={{ color: INK_FAINT, fontFamily: MONO, fontSize: 11, marginLeft: 6 }}>
                  · Phase 1 · Diagnose
                </span>
                {' · '}
                <Link href="/programs" style={{ color: INK, textDecoration: 'underline' }}>
                  Ambient Documentation Vendor Strategy
                </Link>
                <span style={{ color: INK_FAINT, fontFamily: MONO, fontSize: 11, marginLeft: 6 }}>
                  · Phase 0 · Start
                </span>
              </div>
            </div>
          </div>
          <Link
            href="/programs"
            style={{
              fontFamily: MONO,
              fontSize: 12,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: TEAL,
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            Open all →
          </Link>
        </div>
      </div>

      {/* ─── Atlas dock · right edge, summonable ──────────────────────── */}
      <AtlasDock open={atlasOpen} onClose={() => setAtlasOpen(false)} onOpen={() => setAtlasOpen(true)} clientName={clientName} />
    </div>
  );
}

// ─── Pieces ─────────────────────────────────────────────────────────────

function HeaderPill({
  label,
  value,
  tone,
  muted,
}: {
  label: string;
  value: string;
  tone?: 'amber' | 'coral';
  muted?: boolean;
}) {
  const valueColor = tone === 'coral' ? CORAL : tone === 'amber' ? AMBER : muted ? INK_MUTED : INK;
  return (
    <span
      style={{
        display: 'inline-flex',
        gap: 8,
        alignItems: 'baseline',
        padding: '6px 12px',
        background: PANEL_BG,
        border: `1px solid ${LINE}`,
        borderRadius: 999,
      }}
    >
      <span
        style={{
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: INK_MUTED,
        }}
      >
        {label}
      </span>
      <strong style={{ fontSize: 14, fontWeight: 600, color: valueColor }}>{value}</strong>
    </span>
  );
}

function PressureRow({ item }: { item: PressureItem }) {
  const severityColor = item.severity === 'critical' ? CORAL : AMBER;
  const severityBg = item.severity === 'critical' ? CORAL_SOFT : AMBER_SOFT;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 110px 1fr auto auto',
        gap: 16,
        alignItems: 'center',
        padding: '12px 16px 12px 14px',
        background: PANEL_BG,
        border: `1px solid ${LINE}`,
        borderLeft: `3px solid ${severityColor}`,
        borderRadius: 10,
      }}
    >
      <span
        style={{
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontWeight: 700,
          color: severityColor,
          background: severityBg,
          padding: '5px 10px',
          borderRadius: 6,
        }}
      >
        {item.severity}
      </span>
      <span
        style={{
          fontFamily: MONO,
          fontSize: 15,
          fontWeight: 700,
          color: INK,
          textAlign: 'right',
        }}
      >
        {fmtUsd(item.monthlyUsd)}/mo
      </span>
      <span style={{ fontSize: 15, color: INK, lineHeight: 1.45 }}>{item.title}</span>
      <span
        style={{
          fontFamily: MONO,
          fontSize: 12,
          color: item.unowned ? CORAL : INK_MUTED,
          fontWeight: item.unowned ? 700 : 500,
          letterSpacing: '0.04em',
        }}
      >
        {item.unowned ? '— UNOWNED' : item.programName ?? '—'}
      </span>
      {item.programHref ? (
        <Link
          href={item.programHref}
          style={{
            fontFamily: MONO,
            fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: TEAL,
            textDecoration: 'none',
            fontWeight: 700,
          }}
        >
          Open →
        </Link>
      ) : (
        <button
          type="button"
          style={{
            fontFamily: MONO,
            fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: CORAL,
            border: `1px solid ${CORAL_SOFT}`,
            background: 'transparent',
            borderRadius: 999,
            padding: '6px 12px',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          Assign owner
        </button>
      )}
    </div>
  );
}

function PillarCard({
  pillar,
  label,
  subtitle,
  value,
  unit,
  breakdown,
  expanded,
  onClick,
}: {
  pillar: PillarKey;
  label: string;
  subtitle: string;
  value: string;
  unit: string;
  breakdown: Array<{ label: string; value: string | number; tone?: 'amber' | 'coral' }>;
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: '18px 16px 16px',
        background: expanded ? TEAL_SOFT : PANEL_BG,
        border: `1px solid ${expanded ? 'rgba(14,159,140,0.32)' : LINE}`,
        borderRadius: 14,
        cursor: 'pointer',
        fontFamily: SANS,
        color: INK,
        transition: 'all 140ms ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minHeight: 150,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 12,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: expanded ? TEAL : INK_MUTED,
          }}
        >
          {label}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 12, color: INK_FAINT }}>{expanded ? '▾' : '▸'}</span>
      </div>
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 38,
          lineHeight: 1,
          letterSpacing: '-0.03em',
          color: INK,
        }}
      >
        {value}{' '}
        <span style={{ fontSize: 14, color: INK_MUTED, fontWeight: 400, letterSpacing: 0 }}>{unit}</span>
      </div>
      <div style={{ fontSize: 13, color: INK_MUTED, fontStyle: 'italic' }}>{subtitle}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
        {breakdown.map((b) => (
          <div
            key={b.label}
            style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: MONO }}
          >
            <span style={{ color: INK_MUTED, letterSpacing: '0.02em' }}>{b.label}</span>
            <span style={{ color: b.tone === 'coral' ? CORAL : b.tone === 'amber' ? AMBER : INK, fontWeight: 600 }}>
              {b.value}
            </span>
          </div>
        ))}
      </div>
    </button>
  );
}

function DrillDown({ pillar, onClose }: { pillar: PillarKey; onClose: () => void }) {
  const headings: Record<PillarKey, string> = {
    inventory: 'Inventory drill-down · all use cases by stage, business unit, and freshness.',
    adoption: 'Adoption drill-down · penetration by use case · drop-off drivers.',
    value: 'Value drill-down · verified vs projected, by driver · use cases missing baseline.',
    risk: 'Risk drill-down · approval queue · high-risk deployments · bias log.',
    cost: 'Cost drill-down · by category · projected 6-month spend · unit economics.',
  };
  return (
    <section
      style={{
        marginTop: 14,
        padding: '20px 22px',
        background: PANEL_BG,
        border: `1px solid ${LINE}`,
        borderRadius: 14,
        position: 'relative',
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close drill-down"
        style={{
          position: 'absolute',
          top: 12,
          right: 14,
          border: 'none',
          background: 'transparent',
          color: INK_MUTED,
          cursor: 'pointer',
          fontFamily: MONO,
          fontSize: 14,
        }}
      >
        ✕
      </button>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: TEAL,
          marginBottom: 6,
          fontWeight: 700,
        }}
      >
        {pillar}
      </div>
      <h3 style={{ margin: 0, fontFamily: SERIF, fontSize: 22, color: INK, letterSpacing: '-0.015em' }}>
        {headings[pillar]}
      </h3>
      <div
        style={{
          marginTop: 14,
          padding: 18,
          background: PAGE_BG,
          border: `1px dashed ${LINE}`,
          borderRadius: 10,
          fontSize: 13,
          color: INK_MUTED,
          fontStyle: 'italic',
        }}
      >
        Drill-down table renders here using the Command Center DataGrid primitive · filter, sort, density, saved views.
        In the real implementation this pulls the filtered dataset for {pillar} and lands on the same row pattern as the Home command center.
      </div>
    </section>
  );
}

function AtlasDock({
  open,
  onClose,
  onOpen,
  clientName,
}: {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
  clientName: string;
}) {
  return (
    <>
      {/* Collapsed tab on right edge */}
      {!open ? (
        <button
          type="button"
          onClick={onOpen}
          aria-label="Open Atlas"
          style={{
            position: 'fixed',
            right: 0,
            top: '40%',
            padding: '16px 10px',
            background: INK,
            color: PAGE_BG,
            border: 'none',
            borderRadius: '10px 0 0 10px',
            cursor: 'pointer',
            writingMode: 'vertical-rl',
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            fontWeight: 700,
            boxShadow: '-4px 4px 14px rgba(23,20,17,0.15)',
            zIndex: 20,
          }}
        >
          Atlas ⟨
        </button>
      ) : null}

      {/* Expanded panel */}
      {open ? (
        <aside
          role="dialog"
          aria-label="Atlas assistant"
          style={{
            position: 'fixed',
            right: 0,
            top: 0,
            bottom: 0,
            width: 380,
            background: INK,
            color: PAGE_BG,
            zIndex: 21,
            padding: '20px 22px',
            boxShadow: '-12px 0 40px rgba(23,20,17,0.28)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            overflow: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: AMBER,
                  fontWeight: 700,
                }}
              >
                Atlas · Tower
              </div>
              <div style={{ fontFamily: SERIF, fontSize: 20, marginTop: 4 }}>{clientName}</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Atlas"
              style={{
                border: '1px solid rgba(248,247,244,0.22)',
                background: 'transparent',
                color: PAGE_BG,
                padding: '6px 10px',
                borderRadius: 999,
                cursor: 'pointer',
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: '0.12em',
              }}
            >
              Close ⟩
            </button>
          </div>
          <div
            style={{
              padding: 16,
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.26)',
              borderRadius: 14,
              fontSize: 14,
              lineHeight: 1.55,
            }}
          >
            2 programs active. 3 unowned contradictions burning $88K/month. Shadow AI is the hottest of the three · no named
            owner, PHI risk.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['Who owns Shadow AI?', 'Peer position on VBC capability', 'Last gate decision summary'].map((q) => (
              <button
                key={q}
                type="button"
                style={{
                  textAlign: 'left',
                  padding: '10px 14px',
                  background: 'rgba(248,247,244,0.04)',
                  border: '1px solid rgba(248,247,244,0.1)',
                  borderRadius: 10,
                  color: PAGE_BG,
                  fontFamily: SANS,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {q}
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <input
            type="text"
            placeholder="Ask Atlas about portfolio state…"
            style={{
              padding: '12px 14px',
              background: 'rgba(248,247,244,0.06)',
              border: '1px solid rgba(248,247,244,0.18)',
              borderRadius: 12,
              color: PAGE_BG,
              fontFamily: SANS,
              fontSize: 13,
              outline: 'none',
            }}
          />
        </aside>
      ) : null}
    </>
  );
}
