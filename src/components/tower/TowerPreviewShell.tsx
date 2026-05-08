'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { TowerViewModel, ContradictionRow } from '@/lib/tower/aggregate';
import { AgentRail, AGENTS, type AgentTurn } from '@/components/agent-rail/AgentRail';
import type { RenderedResponse } from '@/lib/agent/renderedResponse';
import { useDrawer } from '@/components/drawer/DrawerProvider';
import { PressureCardDerivation } from '@/components/tower/PressureCardDerivation';

// TowerPreviewShell · redesign sandbox per the audit feedback.
// Keeps the 5-column "live system" cockpit (the audit called it "closest
// to right"), drops the cream narrative hero + the right-side duplicate
// metric tiles, adds a Pressure-Today row above the strip, and demotes
// Atlas to a right-edge dock.

const PAGE_BG = '#ffffff';
const PANEL_BG = '#FFFDFC';
const INK = '#171411';
const INK_SOFT = '#3A312A';
const INK_MUTED = '#5B4D43';
const INK_FAINT = '#8A7D70';
const LINE = 'rgba(23,20,17,0.12)';
const TEAL = '#0E9F8C';
const TEAL_SOFT = 'rgba(14,159,140,0.1)';
const AMBER = '#C08643';
const AMBER_SOFT = 'rgba(192,134,67,0.12)';
const CORAL = '#CE5A3B';
const CORAL_SOFT = 'rgba(206,90,59,0.1)';
const SERIF = '"Fraunces", Georgia, serif';
const MONO = '"JetBrains Mono", "Fira Code", monospace';
const SANS = '"Inter", -apple-system, sans-serif';

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
    programName: 'Clinical Documentation AI Governance',
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
  clientId,
  clientName,
}: {
  vm: TowerViewModel | null;
  clientId: string;
  clientName: string;
  currentPath: string;
}) {
  const [expandedPillar, setExpandedPillar] = useState<PillarKey | null>(null);

  const pressure: PressureItem[] = vm?.contradictions?.length
    ? (() => {
        const derived = derivePressure(vm.contradictions);
        return derived.length > 0 ? derived : FALLBACK_PRESSURE;
      })()
    : FALLBACK_PRESSURE;
  const totalMoPressureK = Math.round(pressure.reduce((sum, item) => sum + item.monthlyUsd, 0) / 1000);
  const unownedCount = pressure.filter((p) => p.unowned).length;
  const hottestUnownedPressure = pressure
    .filter((item) => item.unowned)
    .sort((a, b) => b.monthlyUsd - a.monthlyUsd)[0] ?? pressure[0];
  const hottestLabel = hottestUnownedPressure?.title ?? 'top pressure';
  const [atlasThreadId, setAtlasThreadId] = useState<string | null>(null);
  const [atlasPending, setAtlasPending] = useState(false);
  const [atlasConversation, setAtlasConversation] = useState<AgentTurn[]>(() => {
    const hottestK = hottestUnownedPressure ? Math.round(hottestUnownedPressure.monthlyUsd / 1000) : 0;
    return [
      {
        id: 'atlas-opener',
        speaker: 'agent',
        text: `${unownedCount} unowned pressures. $${totalMoPressureK}K/mo. ${hottestLabel} leads at $${hottestK}K/mo. Pick one.`,
      },
    ];
  });

  async function sendAtlasTurn(text: string) {
    const prompt = text.trim();
    if (!prompt || atlasPending) return;

    const userTurnId = `atlas-you-${Date.now()}`;
    const pendingTurnId = `atlas-agent-pending-${Date.now()}`;
    setAtlasPending(true);
    setAtlasConversation((prev) => [
      ...prev,
      { id: userTurnId, speaker: 'you', text: prompt },
      { id: pendingTurnId, speaker: 'agent', text: 'Atlas is reading the live Tower state…' },
    ]);

    try {
      const res = await fetch('/api/v1/atlas/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          threadId: atlasThreadId,
          clientId,
        }),
      });

      const json = (await res.json().catch(() => ({}))) as {
        threadId?: string;
        renderedResponse?: RenderedResponse;
      };

      if (!res.ok || !json.renderedResponse) {
        throw new Error('Atlas ask route did not return a rendered response');
      }

      const renderedResponse = json.renderedResponse;

      if (json.threadId) {
        setAtlasThreadId(json.threadId);
      }

      setAtlasConversation((prev) => prev.map((turn) => (
        turn.id === pendingTurnId
          ? {
              id: `atlas-agent-${Date.now()}`,
              speaker: 'agent',
              text: renderedResponse.response_text,
              rendered: renderedResponse,
            }
          : turn
      )));
    } catch {
      setAtlasConversation((prev) => prev.map((turn) => (
        turn.id === pendingTurnId
          ? {
              id: `atlas-agent-${Date.now()}`,
              speaker: 'agent',
              text: 'Atlas could not answer from the live Tower path just now. Honest next step: retry, or open Programs / Intelligence rather than treating the pressure card as analysis.',
            }
          : turn
      )));
    } finally {
      setAtlasPending(false);
    }
  }

  const inventoryTotal = vm?.inventory.total ?? 42;
  const adoptionPct = Math.round(vm?.adoption.avgPenetrationPct ?? 62);
  const valueVerified = vm?.value.verifiedUsd ?? 51_000;
  const riskApproved = vm?.risk.approved ?? 13;
  const riskTotal = vm?.risk.totalAssessed ?? 25;
  const monthlySpend = vm?.cost.monthlySpendUsd ?? 1_400_000;
  const contradictionCount = vm?.contradictions?.length ?? 25;
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
      {/* P0-2 · sandbox banner removed · /preview/tower is the canonical
          authenticated Tower surface; it is not a sandbox to customers. */}

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
          <Link
            href="/intelligence"
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
              textDecoration: 'none',
            }}
          >
            Open intelligence
          </Link>
          <Link
            href="/engagements"
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
            <PressureRow key={p.id} item={p} onAskAtlas={(prompt) => void sendAtlasTurn(prompt)} />
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
                <Link href="/engagements" style={{ color: INK, textDecoration: 'underline' }}>
                  Clinical Documentation AI Governance
                </Link>
                <span style={{ color: INK_FAINT, fontFamily: MONO, fontSize: 11, marginLeft: 6 }}>
                  · Phase 1 · Diagnose
                </span>
                {' · '}
                <Link href="/engagements" style={{ color: INK, textDecoration: 'underline' }}>
                  Ambient Clinical Value Chain Activation
                </Link>
                <span style={{ color: INK_FAINT, fontFamily: MONO, fontSize: 11, marginLeft: 6 }}>
                  · Phase 3 · Design
                </span>
              </div>
            </div>
          </div>
          <Link
            href="/engagements"
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

      {/* ─── Atlas agent rail · voice-disciplined per design thinking §3 ──
          Atlas is executive-concise: headline + qualifier + decision chips.
          Never more than 3 sentences. Decision verbs on chips. One handoff
          to Nexus when a pressure needs a program. */}
      {(() => {
        return (
          <AgentRail
            agent={AGENTS.atlas}
            contextBadge={`${clientName} · Monday check`}
            userInitials="AS"
            conversation={atlasConversation}
            guidedChoice={{
              prompt: 'Decide in the next 5 minutes.',
              options: [
                { id: 'assign-hottest', label: `Assign owner · ${hottestLabel}`, sub: 'queue for next CIO staff · I draft the ask' },
                { id: 'defer-to-council', label: 'Defer to AI Council', sub: 'next meeting · I preload the pre-read' },
                { id: 'create-program', label: 'Resolve via new program', sub: 'hand to Nexus · draft charter in Programs → Nexus ✱' },
                { id: 'vendor-overlap', label: 'Vendor overlap matrix', sub: '7 tools · rationalisation queue' },
                { id: 'pressure-export', label: 'Export CEO pressure memo', sub: 'one-pager · top-3 unowned' },
              ],
            }}
            onChoice={(id) => {
              const prompt = ({
                'assign-hottest': `Assign an owner for "${hottestLabel}". What is the cleanest ask, and what happens in the next 30 days if nobody owns it?`,
                'defer-to-council': `If we defer "${hottestLabel}" to AI Council, what risk stays unowned in the meantime?`,
                'create-program': `This looks charter-shaped. What program should exist to resolve "${hottestLabel}", and what should the first memo carry?`,
                'vendor-overlap': `Build the decision frame for "${hottestLabel}". What should a vendor overlap matrix force us to decide?`,
                'pressure-export': `Draft the CEO pressure memo shape for "${hottestLabel}". Keep it concise and board-safe.`,
              } as Record<string, string>)[id] ?? id;
              void sendAtlasTurn(prompt);
            }}
            onEscape={(text) => {
              void sendAtlasTurn(text);
            }}
          />
        );
      })()}
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

function PressureRow({ item, onAskAtlas }: { item: PressureItem; onAskAtlas?: (prompt: string) => void }) {
  const severityColor = item.severity === 'critical' ? CORAL : AMBER;
  const severityBg = item.severity === 'critical' ? CORAL_SOFT : AMBER_SOFT;
  const drawer = useDrawer();

  function askAtlas() {
    if (!onAskAtlas) return;
    const monthlyK = Math.round(item.monthlyUsd / 1000);
    const prompt = `Walk me through the ${fmtUsd(item.monthlyUsd)}/mo pressure on "${item.title}". What's the derivation, who should own it, and what's the next decision I should force? ${item.unowned ? 'This one is unowned — name a candidate.' : ''}`.trim();
    onAskAtlas(prompt);
    void monthlyK;
  }

  function openDerivation() {
    drawer.openDrawer({
      kind: 'pattern',
      id: item.id,
      href: item.programHref ?? '#',
      title: item.title,
      eyebrow: `Pressure card \u00b7 ${item.severity.toUpperCase()}`,
      body: (
        <PressureCardDerivation
          title={item.title}
          headline={`${fmtUsd(item.monthlyUsd)} / month`}
          severity={item.severity}
          owner={item.unowned ? 'unowned' : item.programName ?? 'Program owner'}
          method="The headline is the contradiction's monthly dollar impact per Tower's cost aggregate. Breakdown ties each component back to its source contradiction or use case."
          inputs={[
            { label: 'Monthly cost impact', value: `${fmtUsd(item.monthlyUsd)}/mo`, qualifier: 'From contradiction evidence.impact.monthly_total_usd' },
            { label: 'Severity', value: item.severity.toUpperCase(), qualifier: 'Normalised from contradiction row severity' },
            { label: 'Owner status', value: item.unowned ? 'Unowned' : 'Owned', qualifier: item.unowned ? 'No accountable owner on record' : item.programName ?? 'Owner named on program' },
          ]}
          relatedLinks={item.programHref ? [{ label: `Open program \u00b7 ${item.programName ?? 'linked program'}`, href: item.programHref }] : []}
        />
      ),
    });
  }

  return (
    <div
      style={{
        // Fixed-width columns · severity 90px, $ 110px (right-aligned),
        // headline flexes, unowned flag 110px, action 130px (fixed so
        // "ASSIGN OWNER" pill and "OPEN →" right-edge both align).
        display: 'grid',
        gridTemplateColumns: '90px 110px minmax(0, 1fr) 110px 130px',
        gap: 18,
        alignItems: 'center',
        padding: '14px 18px',
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
          padding: '5px 0',
          borderRadius: 6,
          textAlign: 'center',
          width: 90,
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
          fontVariantNumeric: 'tabular-nums',
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
          textAlign: 'right',
        }}
      >
        {item.unowned ? '— UNOWNED' : item.programName ?? '—'}
      </span>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
        <button
          type="button"
          onClick={openDerivation}
          title="How was this number computed?"
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: INK_MUTED,
            background: 'transparent',
            border: `1px solid ${LINE}`,
            borderRadius: 999,
            padding: '4px 10px',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          Why?
        </button>
        {onAskAtlas ? (
          <button
            type="button"
            onClick={askAtlas}
            title="Ask Atlas to walk this pressure"
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: AMBER,
              background: AMBER_SOFT,
              border: `1px solid ${AMBER}55`,
              borderRadius: 999,
              padding: '4px 10px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ▲ Ask Atlas
          </button>
        ) : null}
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
              padding: '6px 14px',
              border: `1px solid transparent`,
            }}
          >
            Open →
          </Link>
        ) : (
          <button
            type="button"
            style={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: CORAL,
              border: `1px solid ${CORAL_SOFT}`,
              background: 'transparent',
              borderRadius: 999,
              padding: '6px 14px',
              cursor: 'pointer',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            Assign owner
          </button>
        )}
      </div>
    </div>
  );
}

function PillarCard({
  label,
  subtitle,
  value,
  unit,
  breakdown,
  expanded,
  onClick,
}: {
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
