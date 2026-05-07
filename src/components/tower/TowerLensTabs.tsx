// TOWER4 · Tower Lens Tabs.
//
// Server component. Renders a tab bar (Portfolio · Scorecards · Gates · Dependencies · Executive brief)
// and the content panel for the active tab. Tab switching is URL-param-driven:
// ?tab=<key>. No client state, no hydration.
//
// T-2 (Tower Fix Package, 2026-05-07): reduced from 10 tabs to 5 working tabs.
// Dropped: pressure, source_commercial, decisions, value_at_risk, reasoning_activity.
// Their jobs now live on Portfolio (pressures, Atlas observations) or other surfaces.
//
// Allowed imports:
//   - @/lib/tower/tower-lens-tabs-view (TOWER4 view-model)
//   - @/lib/tower/control-tower-active-lens-view
//   - @/lib/tower/atlas-executive-brief-canvas
//   - @/lib/tower/program-pressure-view
//   - @/components/tower/ControlTowerActiveLens (re-used for Scorecards)
//   - @/components/tower/AtlasExecutiveBriefCanvas (re-used for Executive Brief)
//   - @/components/tower/ProgramPressureCards (re-used for Portfolio + Pressure)
//   - next/link
//
// Forbidden:
//   - model calls, fetch, Date.now, Math.random, live runtime
//   - src/lib/source/**, src/lib/auth/**

import Link from 'next/link';
import {
  buildTowerLensTabsView,
  type TowerTabKey,
} from '@/lib/tower/tower-lens-tabs-view';
import {
  buildControlTowerActiveLensView,
} from '@/lib/tower/control-tower-active-lens-view';
import {
  buildAtlasExecutiveBriefView,
} from '@/lib/tower/atlas-executive-brief-canvas';
import {
  buildAtlasProgramPressureBrief,
  buildTowerProgramPressureView,
} from '@/lib/tower/program-pressure-view';
import { ControlTowerActiveLens } from '@/components/tower/ControlTowerActiveLens';
import { AtlasExecutiveBriefCanvas } from '@/components/tower/AtlasExecutiveBriefCanvas';
import type { TenantSeedPlan } from '@/lib/programs/enhancement-seed-planner';
import type { ProgramControlTowerSignal, ProgramPressureSeverity } from '@/lib/programs/programs-control-tower-signals';
import {
  buildProgrammeGateStatusView,
} from '@/lib/tower/programme-gate-status-view';
import type { ProgrammeGateStatusCard, GateStatus } from '@/lib/tower/programme-gate-status-view';
import { buildPortfolioAlerts } from '@/lib/reasoning/portfolio-alerts';
import { PortfolioAlertsPanel } from '@/components/tower/PortfolioAlertsPanel';
import {
  computeCascadeImpacts,
  computeReverseCascade,
} from '@/lib/reasoning/cross-instance-reasoner';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { LinkedInstanceTilesGrid } from '@/components/_shared/LinkedInstanceTilesGrid';
import { PortfolioPhaseHeatmap } from '@/components/tower/PortfolioPhaseHeatmap';
import { DependencyManagerPanel } from '@/components/tower/DependencyManagerPanel';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens (matches existing Tower surface palette)
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  surface: '#F8F7F4',
  card: '#FFFFFF',
  ink: '#0A0C12',
  muted: '#525866',
  mutedSoft: '#9AA3B2',
  border: '#E8E6E1',
  navy: '#1B2B5C',
  navySoft: 'rgba(27,43,92,0.08)',
  amber: '#F59E0B',
  amberSoft: 'rgba(245,158,11,0.08)',
  red: '#B91C1C',
  redSoft: 'rgba(185,28,28,0.08)',
  green: '#16A34A',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface TowerLensTabsProps {
  tenant: TenantSeedPlan;
  activeTab: TowerTabKey;
  /** Base URL for tab links (e.g. /tenant/apex-retail/tower) */
  baseUrl: string;
  /**
   * Authenticated /tower renders the lens tabs in the global workspace strip.
   * Keep the content reusable without duplicating a second tab bar below Atlas.
   */
  showTabBar?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function TowerLensTabs({
  tenant,
  activeTab,
  baseUrl,
  showTabBar = true,
}: TowerLensTabsProps) {
  const view = buildTowerLensTabsView(activeTab);

  return (
    <div
      data-testid="tower-lens-tabs"
      data-active-tab={activeTab}
      style={{ fontFamily: 'DM Sans, sans-serif' }}
    >
      {showTabBar && (
        <nav
          aria-label="Tower lens tabs"
          style={{
            display: 'flex',
            gap: 2,
            borderBottom: `1px solid ${C.border}`,
            backgroundColor: C.card,
            padding: '0 24px',
          }}
        >
          {view.tabs.map((tab) => {
            const isActive = tab.key === activeTab;
            const href = tab.key === 'portfolio'
              ? baseUrl
              : `${baseUrl}?tab=${tab.key}`;
            return (
              <Link
                key={tab.key}
                href={href}
                data-tab={tab.key}
                data-active={String(isActive)}
                aria-current={isActive ? 'page' : undefined}
                title={tab.description}
                style={{
                  padding: '10px 16px',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? C.navy : C.muted,
                  borderBottom: isActive
                    ? `2px solid ${C.navy}`
                    : '2px solid transparent',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  letterSpacing: isActive ? '0.01em' : undefined,
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Content panel */}
      <div style={{ padding: '24px clamp(16px, 4vw, 40px)' }}>
        {activeTab === 'portfolio' && (
          <PortfolioPanel tenant={tenant} />
        )}
        {activeTab === 'scorecards' && (
          <ScorecardsPanel tenantSlug={tenant.routeSlug} />
        )}
        {activeTab === 'programme_gates' && (
          <ProgrammeGatesPanel />
        )}
        {activeTab === 'dependencies' && (
          <DependenciesPanel />
        )}
        {activeTab === 'executive_brief' && (
          <ExecutiveBriefPanel tenantSlug={tenant.routeSlug} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab panels
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derive the IDs of program instances that have at least one cross-instance
 * linked counterpart (in either direction — downstream cascade or upstream
 * dependency). Used to decide which tiles to render in the portfolio panel.
 *
 * Returns a stable-sorted array of canonical program instance IDs that have
 * at least one linked instance.
 */
function deriveLinkedProgramIds(): string[] {
  const withLinks: string[] = [];

  for (const instance of APEX_RETAIL_PROGRAM_INSTANCES) {
    const downstream = computeCascadeImpacts(instance);
    const upstream = computeReverseCascade(instance);
    if (downstream.length > 0 || upstream.length > 0) {
      withLinks.push(instance.id);
    }
  }

  return withLinks;
}

/** Portfolio — programme pressure signals + Atlas programme brief */
function PortfolioPanel({ tenant }: { tenant: TenantSeedPlan }) {
  const pressureView = buildTowerProgramPressureView(tenant);
  const { signals, summary, strip } = pressureView;
  const pressureBrief = buildAtlasProgramPressureBrief(tenant, signals, summary);
  const alerts = buildPortfolioAlerts();
  const alertCount = alerts.length;
  const linkedProgramIds = deriveLinkedProgramIds();
  const linkedCount = linkedProgramIds.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 960 }}>
      <SectionMeta
        agent="ATLAS"
        title="Portfolio"
        subtitle="Programme portfolio overview — pressure signals and vendor-aligned programme status. Deterministic seed."
      />

      {/* Portfolio phase heatmap */}
      <section aria-label="Portfolio phase map" data-testid="portfolio-phase-map-section">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: C.muted,
            }}
          >
            Portfolio phase map
          </span>
        </div>
        <PortfolioPhaseHeatmap />
      </section>

      {/* Active alerts section */}
      <section aria-label="Active alerts">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: C.muted,
            }}
          >
            Active alerts
          </span>
          {alertCount > 0 ? (
            <span
              data-testid="portfolio-alerts-count-badge"
              style={{
                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 9px',
                borderRadius: 10,
                background: 'rgba(245,158,11,0.12)',
                color: '#B45309',
                border: '1px solid rgba(180,83,9,0.2)',
              }}
            >
              {alertCount} {alertCount === 1 ? 'alert' : 'alerts'}
            </span>
          ) : (
            <span
              data-testid="portfolio-alerts-clear-badge"
              style={{
                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 9px',
                borderRadius: 10,
                background: 'rgba(22,163,74,0.08)',
                color: '#16A34A',
                border: '1px solid rgba(22,163,74,0.2)',
              }}
            >
              All clear
            </span>
          )}
        </div>
        <PortfolioAlertsPanel alerts={alerts} title="Active alerts" />
      </section>

      {/* Linked programs section */}
      <section aria-label="Linked programs" data-testid="portfolio-linked-programs-section">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: C.muted,
            }}
          >
            Linked programs
          </span>
          {linkedCount > 0 ? (
            <span
              data-testid="portfolio-linked-programs-count-badge"
              style={{
                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 9px',
                borderRadius: 10,
                background: C.navySoft,
                color: C.navy,
                border: `1px solid ${C.navy}22`,
              }}
            >
              {linkedCount} {linkedCount === 1 ? 'link' : 'links'}
            </span>
          ) : (
            <span
              data-testid="portfolio-linked-programs-empty-badge"
              style={{
                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 9px',
                borderRadius: 10,
                background: C.navySoft,
                color: C.mutedSoft,
                border: `1px solid ${C.border}`,
              }}
            >
              None
            </span>
          )}
        </div>
        {linkedCount > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {linkedProgramIds.map((instanceId) => (
              <LinkedInstanceTilesGrid
                key={instanceId}
                currentInstanceId={instanceId}
              />
            ))}
          </div>
        ) : (
          <div
            data-testid="portfolio-linked-programs-empty-state"
            style={{
              padding: '20px 24px',
              backgroundColor: C.card,
              border: `1px dashed ${C.border}`,
              borderRadius: 6,
              fontSize: 13,
              color: C.muted,
              fontStyle: 'italic',
            }}
          >
            No linked programs — cross-instance programme links will appear here when configured.
          </div>
        )}
      </section>

      {/* Atlas portfolio brief */}
      <section
        aria-label="Atlas portfolio brief"
        style={{
          backgroundColor: '#0F1E3F',
          color: '#FFFFFF',
          padding: '18px 22px',
          borderRadius: 6,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: '#9AA3B2',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          ATLAS · PORTFOLIO · DETERMINISTIC SEED
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
          {pressureBrief.topPressure}
        </div>
        <div style={{ fontSize: 12, color: '#D1D5DB', lineHeight: 1.55 }}>
          {pressureBrief.whyItMatters}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 10,
            marginTop: 14,
          }}
        >
          <MetricChip label="Signals" value={strip.totalSignals} />
          <MetricChip label="Top severity" value={strip.topSeverity} />
          <MetricChip label="Programmes affected" value={strip.programsAffected} />
          <MetricChip label="Evidence/value gaps" value={strip.evidenceValueGaps} />
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 10,
            color: '#525866',
            borderTop: '1px solid #1F2F5A',
            paddingTop: 10,
          }}
        >
          {pressureBrief.interpretationBasis}
        </div>
      </section>

      {/* Programme signals */}
      {signals.length > 0 ? (
        <section aria-label="Programme pressure signals">
          <SectionLabel>Programme pressure signals</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {signals.slice(0, 5).map((signal) => (
              <PressureSignalRow key={signal.id} signal={signal} />
            ))}
          </div>
        </section>
      ) : (
        <EmptyState message="No programme pressure signals seeded for this tenant." />
      )}

      <Caveat>All portfolio signals are deterministic seed data. No live Atlas monitoring.</Caveat>
    </div>
  );
}

/** Scorecards — lens-specific programme health scorecards */
function ScorecardsPanel({ tenantSlug }: { tenantSlug: string }) {
  const lensView = buildControlTowerActiveLensView(tenantSlug, 'portfolio');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 960 }}>
      <SectionMeta
        agent="ATLAS"
        title="Scorecards"
        subtitle="Programme health by domain. Deterministic seed — not live telemetry."
      />
      <ControlTowerActiveLens view={lensView} />
      <Caveat>{lensView.deterministicSeedCaveat}</Caveat>
    </div>
  );
}

/** Executive Brief — Atlas executive summary */
function ExecutiveBriefPanel({ tenantSlug }: { tenantSlug: string }) {
  const briefView = buildAtlasExecutiveBriefView(tenantSlug);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 960 }}>
      <SectionMeta
        agent="ATLAS"
        title="Executive Brief"
        subtitle="Atlas executive summary — value, risk, and adoption signals. Deterministic seed — not live intelligence."
      />
      <AtlasExecutiveBriefCanvas view={briefView} />
      <Caveat>{briefView.deterministicSeedCaveat}</Caveat>
    </div>
  );
}

// Shared sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: C.mutedSoft,
        fontWeight: 700,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function SectionMeta({
  agent,
  title,
  subtitle,
}: {
  agent: string;
  title: string;
  subtitle: string;
}) {
  return (
    <header>
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: C.navy,
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        {agent}
      </div>
      <h2
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: 22,
          fontWeight: 600,
          color: C.ink,
          margin: '0 0 4px',
        }}
      >
        {title}
      </h2>
      <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{subtitle}</p>
    </header>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: '8px 10px',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <span
        style={{
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#9AA3B2',
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>
        {value}
      </span>
    </div>
  );
}

function severityColor(severity: ProgramPressureSeverity): string {
  switch (severity) {
    case 'critical': return C.red;
    case 'high': return C.amber;
    case 'medium': return '#6366F1';
    case 'low': return C.mutedSoft;
    default: return C.mutedSoft;
  }
}

function SeverityBadge({ severity }: { severity: ProgramPressureSeverity }) {
  const color = severityColor(severity);
  return (
    <span
      style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        padding: '2px 8px',
        borderRadius: 999,
        background: `${color}18`,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {severity}
    </span>
  );
}

function PressureSignalRow({
  signal,
}: {
  signal: ProgramControlTowerSignal;
}) {
  return (
    <article
      style={{
        padding: '12px 16px',
        backgroundColor: C.card,
        border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${severityColor(signal.severity)}`,
        borderRadius: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              color: C.mutedSoft,
              fontWeight: 700,
              marginRight: 8,
              letterSpacing: '0.08em',
            }}
          >
            {signal.programCode}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>
            {signal.title}
          </span>
        </div>
        <SeverityBadge severity={signal.severity} />
      </div>
      <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{signal.summary}</span>
    </article>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: '20px 24px',
        backgroundColor: C.card,
        border: `1px dashed ${C.border}`,
        borderRadius: 6,
        fontSize: 13,
        color: C.muted,
        fontStyle: 'italic',
      }}
    >
      {message}
    </div>
  );
}

function Caveat({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, color: C.mutedSoft, fontStyle: 'italic', margin: 0 }}>
      {children}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOWER8 · Programme Gates Panel
// ─────────────────────────────────────────────────────────────────────────────

const GATE_STATUS_STYLE: Record<GateStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: C.navySoft, text: C.navy, label: 'Pending' },
  approved: { bg: 'rgba(22,163,74,0.08)', text: C.green, label: 'Approved' },
  blocked: { bg: C.redSoft, text: C.red, label: 'Blocked' },
  at_risk: { bg: C.amberSoft, text: '#92400e', label: 'At risk' },
  not_reached: { bg: '#f3f4f6', text: C.mutedSoft, label: 'Not reached' },
};

function ProgrammeGateCard({ card }: { card: ProgrammeGateStatusCard }) {
  const gateStyle = GATE_STATUS_STYLE[card.activeGate.status];

  return (
    <div
      data-testid={`tower-gate-programme-${card.programmeId}`}
      style={{
        padding: '16px 20px',
        background: C.card,
        border: `1px solid ${card.needsTowerAttention ? C.amber : C.border}`,
        borderLeft: `3px solid ${gateStyle.text}`,
        borderRadius: 8,
      }}
    >
      {/* Programme header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.1em', color: C.muted }}>
          {card.displayId}
        </span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.ink }}>
          {card.programmeName}
        </span>
        <span style={{
          fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.06em',
          color: C.muted, padding: '1px 6px', background: C.navySoft, borderRadius: 4,
        }}>
          {card.currentPhase}
        </span>
        <span style={{
          display: 'inline-block', padding: '2px 7px', borderRadius: 999,
          background: gateStyle.bg, color: gateStyle.text,
          fontSize: 9, fontWeight: 600, letterSpacing: '0.06em',
          textTransform: 'uppercase', lineHeight: 1.5, whiteSpace: 'nowrap',
        }}>
          {gateStyle.label}
        </span>
      </div>

      {/* Active gate */}
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: C.muted, letterSpacing: '0.04em' }}>
          Active gate: {card.activeGate.label}
          {card.activeGate.targetDate && ` · ${card.activeGate.targetDate}`}
        </span>
        {card.activeGate.gatingCondition && (
          <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.5, margin: '4px 0 0' }}>
            {card.activeGate.gatingCondition}
          </p>
        )}
      </div>

      {/* Tower flags */}
      {card.towerFlags.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {card.towerFlags.map((flag, i) => (
            <div key={i} style={{ fontSize: 11, color: C.red, lineHeight: 1.5 }}>
              ⚑ {flag}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgrammeGatesPanel() {
  const view = buildProgrammeGateStatusView();

  return (
    <div
      data-testid="tower-programme-gates-panel"
      style={{ padding: '24px 32px', maxWidth: 860 }}
    >
      {/* Summary bar */}
      <div
        data-testid="tower-programme-gates-summary"
        style={{
          display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20,
          padding: '12px 16px', background: C.card,
          border: `1px solid ${C.border}`, borderRadius: 8,
        }}
      >
        <span style={{ fontSize: 11, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
          Programme Gates
        </span>
        <span style={{ flex: 1, fontSize: 12, color: C.muted }}>
          {view.summary.totalProgrammes} programmes
        </span>
        {view.summary.blockedGates > 0 && (
          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: C.redSoft, color: C.red, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {view.summary.blockedGates} blocked
          </span>
        )}
        {view.summary.atRiskGates > 0 && (
          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: C.amberSoft, color: '#92400e', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {view.summary.atRiskGates} at risk
          </span>
        )}
        {view.summary.pendingGates > 0 && (
          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: C.navySoft, color: C.navy, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {view.summary.pendingGates} pending
          </span>
        )}
        {view.summary.needsAttentionCount > 0 && (
          <span style={{ fontSize: 11, color: C.amber, fontWeight: 600 }}>
            {view.summary.needsAttentionCount} need tower attention
          </span>
        )}
      </div>

      {/* Atlas synthesis */}
      <p style={{ fontSize: 13, color: C.ink, lineHeight: 1.6, margin: '0 0 20px' }}>
        {view.atlasSynthesis}
      </p>

      {/* Programme cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {view.programmes.map((card: ProgrammeGateStatusCard) => (
          <ProgrammeGateCard key={card.programmeId} card={card} />
        ))}
      </div>

      {/* Cross-programme dependencies */}
      {view.crossProgrammeDependencies.length > 0 && (
        <div
          data-testid="tower-programme-gates-dependencies"
          style={{ marginTop: 20, padding: '14px 16px', background: C.amberSoft, border: `1px solid ${C.amber}`, borderRadius: 8 }}
        >
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#92400e', marginBottom: 8 }}>
            Cross-programme dependencies
          </div>
          {view.crossProgrammeDependencies.map((dep, i) => (
            <p key={i} style={{ fontSize: 11, color: C.ink, lineHeight: 1.55, margin: i > 0 ? '6px 0 0' : 0 }}>
              {dep}
            </p>
          ))}
        </div>
      )}

      {/* Honest disclaimer */}
      <div
        style={{ marginTop: 20, fontSize: 10, color: C.mutedSoft, letterSpacing: '0.04em' }}
        data-testid="tower-programme-gates-disclaimer"
        data-honest-disclaimer="tower-programme-gates"
      >
        Deterministic seed · Programme gate status reflects fixture phase data for the Apex Retail engagement.
        Live gate approvals and phase transitions are managed by the programme gate management workflow.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOWER-DEP · Dependencies panel
// ─────────────────────────────────────────────────────────────────────────────

function DependenciesPanel() {
  return (
    <div
      data-testid="tower-dependencies-panel"
      style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 960 }}
    >
      <SectionMeta
        agent="ATLAS"
        title="Dependencies"
        subtitle="Source-to-program dependency matrix — all cross-instance links between source events and programs. Deterministic seed."
      />
      <DependencyManagerPanel />
      <Caveat>
        All dependency links are deterministic seed data derived from fixture instances. Live
        dependency tracking and automated link derivation are deferred.
      </Caveat>
    </div>
  );
}
