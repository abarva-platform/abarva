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

/** Portfolio — programme pressure signals + Atlas programme brief */
function PortfolioPanel({ tenant }: { tenant: TenantSeedPlan }) {
  const pressureView = buildTowerProgramPressureView(tenant);
  const { signals, summary, strip } = pressureView;
  const pressureBrief = buildAtlasProgramPressureBrief(tenant, signals, summary);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 960 }}>
      <SectionMeta
        agent="ATLAS"
        title="Portfolio"
        subtitle="Programme portfolio overview — pressure signals and vendor-aligned programme status. Deterministic seed."
      />

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

// ─────────────────────────────────────────────────────────────────────────────
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
