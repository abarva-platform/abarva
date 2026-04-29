// TOWER4 · Tower Lens Tabs.
//
// Server component. Renders a tab bar (Portfolio · Scorecards · Pressure · Executive Brief)
// and the content panel for the active tab. Tab switching is URL-param-driven:
// ?tab=<key>. No client state, no hydration.
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
  TOWER_TABS,
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
  buildSourceCommercialSignalsView,
} from '@/lib/tower/source-commercial-signals-view';
import type { CommercialSignal, CommercialSignalSeverity } from '@/lib/tower/source-commercial-signals-view';
import {
  buildExecutiveDecisionQueueView,
} from '@/lib/tower/executive-decision-queue-view';
import type { DecisionItem, DecisionUrgency, DecisionStatus } from '@/lib/tower/executive-decision-queue-view';
import {
  buildValueAtRiskPortfolioView,
} from '@/lib/tower/value-at-risk-portfolio-view';
import type { ValueAtRiskItem, ValueRiskTier, ValueRiskStatus, EvidenceConfidence } from '@/lib/tower/value-at-risk-portfolio-view';
import {
  buildProgrammeGateStatusView,
} from '@/lib/tower/programme-gate-status-view';
import type { ProgrammeGateStatusCard, GateStatus } from '@/lib/tower/programme-gate-status-view';
import {
  buildReasoningActivityBriefView,
} from '@/lib/tower/reasoning-activity-brief-view';
import type { ReasoningContradictionItem, ReasoningHandoffItem } from '@/lib/tower/reasoning-activity-brief-view';
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
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function TowerLensTabs({
  tenant,
  activeTab,
  baseUrl,
}: TowerLensTabsProps) {
  const view = buildTowerLensTabsView(activeTab);

  return (
    <div
      data-testid="tower-lens-tabs"
      data-active-tab={activeTab}
      style={{ fontFamily: 'DM Sans, sans-serif' }}
    >
      {/* Tab bar */}
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

      {/* Content panel */}
      <div style={{ padding: '24px clamp(16px, 4vw, 40px)' }}>
        {activeTab === 'portfolio' && (
          <PortfolioPanel tenant={tenant} />
        )}
        {activeTab === 'scorecards' && (
          <ScorecardsPanel tenantSlug={tenant.routeSlug} />
        )}
        {activeTab === 'pressure' && (
          <PressurePanel tenant={tenant} />
        )}
        {activeTab === 'source_commercial' && (
          <SourceCommercialPanel />
        )}
        {activeTab === 'decisions' && (
          <DecisionsPanel />
        )}
        {activeTab === 'value_at_risk' && (
          <ValueAtRiskPanel />
        )}
        {activeTab === 'executive_brief' && (
          <ExecutiveBriefPanel tenantSlug={tenant.routeSlug} />
        )}
        {activeTab === 'programme_gates' && (
          <ProgrammeGatesPanel />
        )}
        {activeTab === 'reasoning_activity' && (
          <ReasoningActivityBriefPanel />
        )}
        {activeTab === 'dependencies' && (
          <DependenciesPanel />
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

/** Pressure — proactive pressure cards */
function PressurePanel({ tenant }: { tenant: TenantSeedPlan }) {
  const pressureView = buildTowerProgramPressureView(tenant);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 960 }}>
      <SectionMeta
        agent="ATLAS"
        title="Pressure signals"
        subtitle="Proactive pressure and risk signals from the Control Tower. Deterministic seed — not live monitoring."
      />

      {pressureView.signals.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pressureView.signals.map((signal) => (
            <article
              key={signal.id}
              style={{
                padding: '16px 18px',
                backgroundColor: C.card,
                border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${severityColor(signal.severity)}`,
                borderRadius: 6,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <div>
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: C.mutedSoft,
                      fontWeight: 700,
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    {signal.programCode} · {signal.type.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>
                    {signal.title}
                  </span>
                </div>
                <SeverityBadge severity={signal.severity} />
              </div>
              <p style={{ margin: 0, fontSize: 12, color: C.muted, lineHeight: 1.55 }}>
                {signal.summary}
              </p>
              {signal.recommendedAction && (
                <div
                  style={{
                    marginTop: 10,
                    padding: '8px 12px',
                    backgroundColor: C.navySoft,
                    borderRadius: 4,
                    fontSize: 12,
                    color: C.navy,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>Atlas recommends: </span>
                  {signal.recommendedAction}
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState message="No pressure signals seeded for this tenant." />
      )}

      <Caveat>All pressure signals are deterministic seed data. No live Atlas monitoring.</Caveat>
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

// ─── TOWER1: Source commercial signals panel ──────────────────────────────────

function SourceCommercialPanel() {
  const view = buildSourceCommercialSignalsView();
  const { eventSummary, signals, executiveGuidance } = view;

  const signalSeverityColor = (s: CommercialSignalSeverity) => {
    if (s === 'critical') return C.red;
    if (s === 'high') return C.amber;
    if (s === 'medium') return C.navy;
    return C.mutedSoft;
  };

  const readinessBg = (r: string) => {
    if (r === 'blocked') return C.redSoft;
    if (r === 'at_risk') return C.amberSoft;
    return C.navySoft;
  };
  const readinessColor = (r: string) => {
    if (r === 'blocked') return C.red;
    if (r === 'at_risk') return C.amber;
    return C.navy;
  };

  return (
    <div
      data-testid="tower-source-commercial-panel"
      style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 960 }}
    >
      <SectionMeta
        agent="ATLAS"
        title="Source Commercial"
        subtitle="AMS Vendor Consolidation 2026 — pricing, BAFO, and selection readiness signals. Deterministic seed."
      />

      {/* Executive guidance banner */}
      <section
        aria-label="Executive guidance"
        data-testid="tower-source-commercial-executive-guidance"
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
          ATLAS · SOURCE COMMERCIAL · DETERMINISTIC SEED
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
          {executiveGuidance}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 10,
            marginTop: 12,
          }}
        >
          <MetricChip label="Event" value={eventSummary.stageLabel} />
          <MetricChip label="Active vendors" value={String(eventSummary.activeVendorCount)} />
          <MetricChip label="Critical signals" value={String(eventSummary.criticalSignalCount)} />
          <MetricChip label="High signals" value={String(eventSummary.highSignalCount)} />
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
          Deterministic seed · SRC-AMS-2026 · {view.contextLine}
        </div>
      </section>

      {/* Selection readiness badge */}
      <div
        data-testid="tower-source-commercial-readiness"
        style={{
          padding: '10px 14px',
          borderRadius: 6,
          background: readinessBg(eventSummary.selectionReadiness),
          border: `1px solid ${readinessColor(eventSummary.selectionReadiness)}30`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: readinessColor(eventSummary.selectionReadiness),
            fontWeight: 700,
          }}
        >
          SELECTION READINESS
        </span>
        <span style={{ fontSize: 12, color: C.ink }}>
          {eventSummary.selectionReadinessLabel}
        </span>
      </div>

      {/* Signals */}
      <section aria-label="Commercial signals">
        <SectionLabel>Commercial signals · {signals.length}</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {signals.map((signal: CommercialSignal) => (
            <article
              key={signal.signalId}
              data-testid={`tower-commercial-signal-${signal.signalId}`}
              style={{
                padding: '16px 18px',
                backgroundColor: C.card,
                border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${signalSeverityColor(signal.severity)}`,
                borderRadius: 6,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <div>
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: C.mutedSoft,
                      fontWeight: 700,
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    {signal.domain.replace(/_/g, ' ')} · {signal.severity}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>
                    {signal.title}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: signalSeverityColor(signal.severity),
                    padding: '2px 6px',
                    border: `1px solid ${signalSeverityColor(signal.severity)}44`,
                    borderRadius: 3,
                  }}
                >
                  {signal.severity}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: C.muted, lineHeight: 1.55 }}>
                {signal.narrative}
              </p>
              <div
                style={{
                  marginTop: 10,
                  padding: '8px 12px',
                  backgroundColor: C.navySoft,
                  borderRadius: 4,
                  fontSize: 12,
                  color: C.navy,
                }}
              >
                <span style={{ fontWeight: 600 }}>Atlas recommends: </span>
                {signal.recommendedAction}
              </div>
              {signal.actions.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {signal.actions.map((action) => (
                    <div
                      key={action.actionId}
                      style={{
                        fontSize: 11,
                        color: C.muted,
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                    >
                      → {action.label} · {action.owner} · {action.deadline}
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* Honest disclaimer */}
      <div
        data-testid="tower-source-commercial-disclaimer"
        data-honest-disclaimer="tower-source-commercial"
        style={{ fontSize: 11, color: C.mutedSoft, fontStyle: 'italic' }}
      >
        Deterministic seed · SRC-AMS-2026 commercial signals reflect fixture context only. Live vendor submission status, gate readiness, and programme alignment are deferred.
      </div>

      <Caveat>All source commercial signals are deterministic seed data. No live Atlas monitoring.</Caveat>
    </div>
  );
}

// ─── TOWER2: Executive decision queue panel ───────────────────────────────────

function DecisionsPanel() {
  const view = buildExecutiveDecisionQueueView();
  const { summary, decisions } = view;

  const urgencyColor = (u: DecisionUrgency) => {
    if (u === 'immediate') return C.red;
    if (u === 'this_week') return C.amber;
    if (u === 'this_month') return C.navy;
    return C.mutedSoft;
  };
  const urgencyLabel = (u: DecisionUrgency) => {
    if (u === 'immediate') return 'IMMEDIATE';
    if (u === 'this_week') return 'THIS WEEK';
    if (u === 'this_month') return 'THIS MONTH';
    return 'MONITOR';
  };
  const statusBg = (s: DecisionStatus) => {
    if (s === 'blocked') return C.redSoft;
    if (s === 'pending_input') return C.amberSoft;
    if (s === 'ready_to_close') return 'rgba(22,163,74,0.07)';
    return C.navySoft;
  };
  const statusLabel = (s: DecisionStatus) => {
    if (s === 'blocked') return 'BLOCKED';
    if (s === 'pending_input') return 'PENDING INPUT';
    if (s === 'ready_to_close') return 'READY TO CLOSE';
    return 'OPEN';
  };

  return (
    <div
      data-testid="tower-decisions-panel"
      style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 960 }}
    >
      <SectionMeta
        agent="ATLAS"
        title="Executive Decisions"
        subtitle="Decisions requiring leadership attention across Source and Programs. Deterministic seed."
      />

      {/* Executive summary banner */}
      <section
        aria-label="Executive decision summary"
        data-testid="tower-decisions-executive-summary"
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
          ATLAS · DECISION QUEUE · DETERMINISTIC SEED
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
          {view.executiveSummary}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 10,
            marginTop: 12,
          }}
        >
          <MetricChip label="Immediate" value={String(summary.immediateCount)} />
          <MetricChip label="This week" value={String(summary.thisWeekCount)} />
          <MetricChip label="Blocked" value={String(summary.blockedCount)} />
          <MetricChip label="Open" value={String(summary.openCount)} />
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
          Deterministic seed · {view.contextLine}
        </div>
      </section>

      {/* Critical blocker alert */}
      {summary.criticalBlockerActive && (
        <div
          data-testid="tower-decisions-critical-blocker-alert"
          style={{
            padding: '10px 14px',
            background: C.redSoft,
            border: `1px solid ${C.red}30`,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: C.red,
              fontWeight: 700,
            }}
          >
            CRITICAL BLOCKER ACTIVE
          </span>
          <span style={{ fontSize: 12, color: C.ink }}>
            An immediate decision has an unresolved blocker. Leadership action required.
          </span>
        </div>
      )}

      {/* Decision items */}
      <section aria-label="Decision queue">
        <SectionLabel>Decision queue · {decisions.length} items</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {decisions.map((decision: DecisionItem) => (
            <article
              key={decision.decisionId}
              data-testid={`tower-decision-item-${decision.decisionId}`}
              style={{
                padding: '16px 18px',
                backgroundColor: C.card,
                border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${urgencyColor(decision.urgency)}`,
                borderRadius: 6,
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 9,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: urgencyColor(decision.urgency),
                        fontWeight: 700,
                        padding: '2px 5px',
                        border: `1px solid ${urgencyColor(decision.urgency)}44`,
                        borderRadius: 3,
                      }}
                    >
                      {urgencyLabel(decision.urgency)}
                    </span>
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 9,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: C.mutedSoft,
                      }}
                    >
                      {decision.domain.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>
                    {decision.title}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 9,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: decision.status === 'blocked' ? C.red : C.mutedSoft,
                    padding: '3px 7px',
                    background: statusBg(decision.status),
                    borderRadius: 3,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {statusLabel(decision.status)}
                </div>
              </div>

              {/* Context */}
              <p style={{ margin: '0 0 10px', fontSize: 12, color: C.muted, lineHeight: 1.55 }}>
                {decision.context}
              </p>

              {/* Decision question */}
              <div
                style={{
                  marginBottom: 10,
                  padding: '8px 12px',
                  background: C.navySoft,
                  borderRadius: 4,
                  fontSize: 12,
                  color: C.navy,
                }}
              >
                <span style={{ fontWeight: 600 }}>Decision question: </span>
                {decision.decisionQuestion}
              </div>

              {/* Atlas recommendation */}
              <div
                style={{
                  marginBottom: 10,
                  padding: '8px 12px',
                  background: 'rgba(22,163,74,0.07)',
                  borderRadius: 4,
                  fontSize: 12,
                  color: C.green,
                }}
              >
                <span style={{ fontWeight: 600 }}>Atlas recommends: </span>
                {decision.recommendedAction}
              </div>

              {/* Known / Missing */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <div
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 9,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: C.mutedSoft,
                      marginBottom: 4,
                    }}
                  >
                    KNOWN
                  </div>
                  {decision.knownContext.map((k, i) => (
                    <div key={i} style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>
                      ✓ {k}
                    </div>
                  ))}
                </div>
                {decision.missingContext.length > 0 && (
                  <div>
                    <div
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 9,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: C.mutedSoft,
                        marginBottom: 4,
                      }}
                    >
                      MISSING
                    </div>
                    {decision.missingContext.map((m, i) => (
                      <div key={i} style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>
                        ? {m}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Blockers */}
              {decision.blockers.length > 0 && (
                <div
                  style={{
                    padding: '6px 10px',
                    background: C.redSoft,
                    borderRadius: 4,
                    marginBottom: 8,
                  }}
                >
                  {decision.blockers.map((b) => (
                    <div key={b.blockerId} style={{ fontSize: 11, color: C.red }}>
                      ⚠ {b.label} · {b.owner}
                    </div>
                  ))}
                </div>
              )}

              {/* Footer: owner + deadline */}
              <div style={{ fontSize: 11, color: C.mutedSoft, fontFamily: 'JetBrains Mono, monospace' }}>
                Owner: {decision.owner} · Deadline: {decision.deadline}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Honest disclaimer */}
      <div
        data-testid="tower-decisions-disclaimer"
        data-honest-disclaimer="tower-executive-decisions"
        style={{ fontSize: 11, color: C.mutedSoft, fontStyle: 'italic' }}
      >
        Deterministic seed · Decision queue reflects fixture context for APX-CDP-2026 and SRC-AMS-2026 only. Live gate state, vendor submission status, and programme escalations are deferred.
      </div>

      <Caveat>All decisions are deterministic seed data. No live programme monitoring.</Caveat>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── TOWER3: Value at risk portfolio lens panel ────────────────────────────────

function ValueAtRiskPanel() {
  const view = buildValueAtRiskPortfolioView();
  const { summary, items } = view;

  const riskTierColor = (t: ValueRiskTier) => {
    if (t === 'high') return C.red;
    if (t === 'medium') return C.amber;
    return C.mutedSoft;
  };
  const statusBg = (s: ValueRiskStatus) => {
    if (s === 'blocked') return C.redSoft;
    if (s === 'at_risk') return C.amberSoft;
    if (s === 'on_track') return 'rgba(22,163,74,0.07)';
    return C.navySoft;
  };
  const statusColor = (s: ValueRiskStatus) => {
    if (s === 'blocked') return C.red;
    if (s === 'at_risk') return C.amber;
    if (s === 'on_track') return C.green;
    return C.mutedSoft;
  };
  const statusLabel = (s: ValueRiskStatus) => {
    if (s === 'blocked') return 'BLOCKED';
    if (s === 'at_risk') return 'AT RISK';
    if (s === 'on_track') return 'ON TRACK';
    return 'DEFERRED';
  };
  const confidenceLabel = (c: EvidenceConfidence) => {
    if (c === 'strong') return 'Strong';
    if (c === 'partial') return 'Partial';
    if (c === 'weak') return 'Weak';
    return 'Missing';
  };
  const confidenceColor = (c: EvidenceConfidence) => {
    if (c === 'strong') return C.green;
    if (c === 'partial') return C.amber;
    if (c === 'weak') return C.red;
    return C.mutedSoft;
  };

  const formatUsd = (v: number) =>
    v >= 1_000_000
      ? `$${(v / 1_000_000).toFixed(1)}M`
      : `$${(v / 1000).toFixed(0)}K`;

  return (
    <div
      data-testid="tower-value-at-risk-panel"
      style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 960 }}
    >
      <SectionMeta
        agent="ATLAS"
        title="Value at Risk"
        subtitle="Value at stake, evidence confidence, and blocker status across Source and Programs. Deterministic seed."
      />

      {/* Portfolio summary banner */}
      <section
        aria-label="Portfolio value summary"
        data-testid="tower-value-at-risk-summary"
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
          ATLAS · VALUE AT RISK · DETERMINISTIC SEED
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
          {view.topPriorityGuidance}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 10,
            marginTop: 12,
          }}
        >
          <MetricChip label="At-risk value" value={formatUsd(summary.atRiskValueUsd)} />
          <MetricChip label="Blocked items" value={String(summary.blockedItemCount)} />
          <MetricChip label="High-risk items" value={String(summary.highRiskItemCount)} />
          <MetricChip label="Evidence confidence" value={confidenceLabel(summary.portfolioEvidenceConfidence)} />
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
          Deterministic seed · {view.contextLine}
        </div>
      </section>

      {/* Portfolio items */}
      <section aria-label="Value at risk items">
        <SectionLabel>Portfolio items · {items.length}</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((item: ValueAtRiskItem) => (
            <article
              key={item.itemId}
              data-testid={`tower-var-item-${item.itemId}`}
              style={{
                padding: '16px 18px',
                backgroundColor: C.card,
                border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${riskTierColor(item.riskTier)}`,
                borderRadius: 6,
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 9,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: C.mutedSoft,
                        fontWeight: 700,
                      }}
                    >
                      {item.source}
                    </span>
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 9,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: riskTierColor(item.riskTier),
                        padding: '2px 5px',
                        border: `1px solid ${riskTierColor(item.riskTier)}44`,
                        borderRadius: 3,
                      }}
                    >
                      {item.riskTier} risk
                    </span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>
                    {item.label}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 11,
                      color: item.valueQuantified ? C.ink : C.mutedSoft,
                    }}
                  >
                    {item.valueQuantified ? formatUsd(item.valueAtStakeUsd) : 'Not quantified'}
                  </span>
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 9,
                      textTransform: 'uppercase',
                      color: statusColor(item.status),
                      padding: '2px 6px',
                      background: statusBg(item.status),
                      borderRadius: 3,
                    }}
                  >
                    {statusLabel(item.status)}
                  </span>
                </div>
              </div>

              {/* Risk narrative */}
              <p style={{ margin: '0 0 10px', fontSize: 12, color: C.muted, lineHeight: 1.55 }}>
                {item.riskNarrative}
              </p>

              {/* Evidence confidence */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  background: C.navySoft,
                  borderRadius: 4,
                  marginBottom: 10,
                }}
              >
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, textTransform: 'uppercase', color: C.mutedSoft }}>
                  Evidence:
                </span>
                <span style={{ fontSize: 11, color: confidenceColor(item.evidenceConfidence), fontWeight: 600 }}>
                  {confidenceLabel(item.evidenceConfidence)}
                </span>
              </div>

              {/* Blocker note */}
              {item.blockerNote && (
                <div
                  style={{
                    padding: '6px 10px',
                    background: C.redSoft,
                    borderRadius: 4,
                    marginBottom: 8,
                    fontSize: 11,
                    color: C.red,
                  }}
                >
                  ⚠ {item.blockerNote}
                </div>
              )}

              {/* Next action */}
              <div
                style={{
                  padding: '8px 12px',
                  backgroundColor: C.navySoft,
                  borderRadius: 4,
                  fontSize: 12,
                  color: C.navy,
                }}
              >
                <span style={{ fontWeight: 600 }}>Atlas recommends: </span>
                {item.nextAction}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Honest disclaimer */}
      <div
        data-testid="tower-value-at-risk-disclaimer"
        data-honest-disclaimer="tower-value-at-risk"
        style={{ fontSize: 11, color: C.mutedSoft, fontStyle: 'italic' }}
      >
        Deterministic seed · Value estimates are directional, derived from fixture BAFO and programme data. Live portfolio value tracking, evidence confidence scoring, and risk quantification are deferred.
      </div>

      <Caveat>All value at risk items are deterministic seed data. No live portfolio monitoring.</Caveat>
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
// TOWER9 · Reasoning Activity Brief panel helpers
// ─────────────────────────────────────────────────────────────────────────────

const CONTRADICTION_SEVERITY_BORDER: Record<string, string> = {
  high:   C.red,
  medium: C.amber,
  low:    C.mutedSoft,
};

const CONTRADICTION_STATUS_LABEL: Record<string, string> = {
  open:       'Open',
  monitoring: 'Monitoring',
  resolved:   'Resolved',
};

const HANDOFF_READINESS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  red:   { bg: C.redSoft,   fg: C.red,   label: 'Blocked' },
  amber: { bg: C.amberSoft, fg: '#92400e', label: 'At Risk' },
  green: { bg: 'rgba(22,163,74,0.08)', fg: C.green, label: 'On Track' },
};

function ReasoningContradictionCard({ item }: { item: ReasoningContradictionItem }) {
  const border = CONTRADICTION_SEVERITY_BORDER[item.severity] ?? C.border;
  const statusLabel = CONTRADICTION_STATUS_LABEL[item.status] ?? item.status;
  return (
    <div
      data-testid={`tower-reasoning-contradiction-${item.contradictionId}`}
      style={{
        borderLeft: `3px solid ${border}`,
        padding: '10px 14px',
        background: C.card,
        border: `1px solid ${C.border}`,
        borderLeftWidth: 3,
        borderLeftColor: border,
        borderRadius: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.mutedSoft }}>
          {item.contradictionId}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 999, background: item.severity === 'high' ? C.redSoft : item.severity === 'medium' ? C.amberSoft : C.navySoft, color: item.severity === 'high' ? C.red : item.severity === 'medium' ? '#92400e' : C.navy, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {item.severity}
          </span>
          <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 999, background: `${C.ink}08`, color: C.muted, fontSize: 10, fontWeight: 500 }}>
            {statusLabel}
          </span>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: C.ink, lineHeight: 1.5, fontWeight: 500 }}>
        {item.label}
      </p>
      {item.relevantGate && (
        <p style={{ margin: 0, fontSize: 11, color: C.muted }}>
          Gate: {item.relevantGate}
        </p>
      )}
      {item.towerFlag && (
        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#92400e', lineHeight: 1.4 }}>
          ⚑ {item.towerFlag}
        </p>
      )}
    </div>
  );
}

function ReasoningActivityBriefPanel() {
  const view = buildReasoningActivityBriefView();

  return (
    <div
      data-testid="tower-reasoning-activity-panel"
      style={{ padding: '24px 32px', maxWidth: 860 }}
    >
      {/* Summary bar */}
      <div
        data-testid="tower-reasoning-activity-summary"
        style={{
          display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20,
          padding: '12px 16px', background: C.card,
          border: `1px solid ${C.border}`, borderRadius: 8,
        }}
      >
        <span style={{ fontSize: 11, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
          Reasoning Activity
        </span>
        <span style={{ flex: 1, fontSize: 11, color: C.muted }}>
          {view.summary.totalPatternsAnalyzed} patterns · {view.summary.lastSynthesisEvent}
        </span>
        {view.summary.activeContradictions > 0 && (
          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: C.redSoft, color: C.red, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {view.summary.activeContradictions} contradiction{view.summary.activeContradictions !== 1 ? 's' : ''}
          </span>
        )}
        {view.summary.pendingHandoffs > 0 && (
          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: C.amberSoft, color: '#92400e', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {view.summary.pendingHandoffs} handoff{view.summary.pendingHandoffs !== 1 ? 's' : ''} at risk
          </span>
        )}
      </div>

      {/* Atlas synthesis */}
      <p style={{ fontSize: 13, color: C.ink, lineHeight: 1.6, margin: '0 0 20px' }}>
        {view.atlasSynthesis}
      </p>

      {/* Active contradictions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {view.activeContradictions.map((item: ReasoningContradictionItem) => (
          <ReasoningContradictionCard key={item.contradictionId} item={item} />
        ))}
      </div>

      {/* Pending handoffs */}
      {view.pendingHandoffs.length > 0 && (
        <div
          data-testid="tower-reasoning-handoffs"
          style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 6 }}
        >
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>
            Cross-Stage Handoff Readiness
          </div>
          {view.pendingHandoffs.map((h: ReasoningHandoffItem) => {
            const rs = HANDOFF_READINESS_STYLE[h.readinessSignal] ?? HANDOFF_READINESS_STYLE.amber;
            return (
              <div
                key={h.handoffId}
                style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  padding: '8px 12px', background: C.card,
                  border: `1px solid ${C.border}`, borderRadius: 6,
                }}
              >
                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: rs.bg, color: rs.fg, fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', marginTop: 2 }}>
                  {rs.label}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>
                    {h.programmeName} · {h.fromStage} → {h.toStage}
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: C.ink, lineHeight: 1.45 }}>
                    {h.narrativeSummary}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Honest disclaimer */}
      <div
        style={{ marginTop: 20, fontSize: 10, color: C.mutedSoft, letterSpacing: '0.04em' }}
        data-testid="tower-reasoning-activity-disclaimer"
        data-honest-disclaimer="tower-reasoning-activity"
      >
        Deterministic seed · Reasoning activity reflects fixture contradiction and handoff data for
        the Apex Retail engagement. Live contradiction detection, pattern synthesis, and handoff
        tracking are managed by the Sentinel reasoning runtime.
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
