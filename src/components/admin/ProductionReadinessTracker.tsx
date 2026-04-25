import Link from 'next/link';
import type { CSSProperties } from 'react';
import {
  buildProductionReadinessView,
  PRODUCTION_READINESS_DIMENSIONS,
  PRODUCTION_READINESS_GATES,
  type ProductionReadinessComponent,
  type ProductionReadinessDimension,
  type ProductionReadinessGate,
  type ProductionReadinessGateStatus,
  type ProductionReadinessStatus,
  type ProductionReadinessView,
} from '@/lib/admin/production-readiness';
import { BORDER, COLORS, FONT, RADIUS, SPACING, TYPE } from '@/lib/design/abarva-theme';

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: COLORS.surface,
  color: COLORS.ink,
  fontFamily: FONT.body,
};

const shellStyle: CSSProperties = {
  maxWidth: 1480,
  margin: '0 auto',
  padding: `${SPACING.xxxl}px ${SPACING.xxl}px`,
  display: 'grid',
  gap: SPACING.xl,
};

const cardStyle: CSSProperties = {
  background: COLORS.card,
  border: BORDER.hairline,
  borderRadius: RADIUS.md,
  boxShadow: '0 18px 45px rgba(10, 12, 18, 0.05)',
};

const sectionHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'end',
  gap: SPACING.lg,
};

const tableWrapStyle: CSSProperties = {
  ...cardStyle,
  overflowX: 'auto',
};

const thStyle: CSSProperties = {
  ...TYPE.eyebrow,
  padding: `${SPACING.md}px ${SPACING.lg}px`,
  textAlign: 'left',
  borderBottom: BORDER.hairline,
  background: COLORS.surface2,
  whiteSpace: 'nowrap',
};

const tdStyle: CSSProperties = {
  ...TYPE.caption,
  color: COLORS.body,
  padding: `${SPACING.md}px ${SPACING.lg}px`,
  borderBottom: BORDER.hairlineSoft,
  verticalAlign: 'top',
};

const dimensionLabels: Record<ProductionReadinessDimension, string> = {
  functionality: 'Function',
  data_readiness: 'Data',
  agent_readiness: 'Agent',
  evidence_audit_readiness: 'Evidence',
  ui_ux_readiness: 'UI',
  tenant_isolation: 'Tenant',
  test_coverage: 'Tests',
  build_deploy_health: 'Build',
  production_risk: 'Risk',
};

const gateLabels: Record<ProductionReadinessGate, string> = {
  unit_tests: 'Unit',
  integration_tests: 'Integration',
  route_smoke: 'Route',
  live_persona_walk: 'Persona',
  no_fabrication_check: 'No fabrication',
  tenant_isolation_check: 'Tenant',
  vercel_build: 'Vercel',
  security_governance_review: 'Security',
};

export function ProductionReadinessTracker({
  view = buildProductionReadinessView(),
}: {
  view?: ProductionReadinessView;
}) {
  const fullFlowReady = view.summary.fullFlowReadyCount;
  const pilotReady = view.summary.pilotReadyCount;
  const productionReady = view.summary.productionReadyCount;

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header
          style={{
            ...cardStyle,
            padding: SPACING.xxl,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: SPACING.xxl,
          }}
        >
          <div style={{ display: 'grid', gap: SPACING.lg }}>
            <div style={TYPE.eyebrow}>Steward Production Readiness Brief</div>
            <div style={{ display: 'grid', gap: SPACING.sm }}>
              <h1 style={{ ...TYPE.h1, margin: 0, fontSize: 34, letterSpacing: 0 }}>
                Production readiness is visible, but still blocked.
              </h1>
              <p style={{ ...TYPE.body, margin: 0, maxWidth: 880 }}>
                {view.stewardBrief.summary}
              </p>
            </div>
            <div style={{ display: 'flex', gap: SPACING.sm, flexWrap: 'wrap', alignItems: 'center' }}>
              <StatusPill status={view.overallStatus} />
              <span style={{ ...TYPE.caption, color: COLORS.muted }}>
                Updated {view.lastUpdated} by {view.updatedBy}
              </span>
              <Link
                href="/platform/admin/build-progress"
                style={{
                  ...TYPE.caption,
                  color: COLORS.navy,
                  fontWeight: 600,
                  textDecoration: 'none',
                  marginLeft: 'auto',
                }}
              >
                Build Progress
              </Link>
            </div>
          </div>

          <div style={{ display: 'grid', gap: SPACING.md }}>
            <div style={{ ...cardStyle, padding: SPACING.lg, background: COLORS.surface2 }}>
              <div style={TYPE.eyebrow}>Overall readiness score</div>
              <div style={{ display: 'flex', alignItems: 'end', gap: SPACING.sm }}>
                <div style={{ ...TYPE.h1, margin: 0, fontSize: 64, lineHeight: 0.9, letterSpacing: 0 }}>
                  {view.overallReadinessPercent}
                </div>
                <div style={{ ...TYPE.caption, fontFamily: FONT.mono, paddingBottom: 6 }}>/ 100</div>
              </div>
              <ReadinessBar percent={view.overallReadinessPercent} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: SPACING.sm }}>
              <ReadinessMiniCard label="Full-flow" count={fullFlowReady} total={view.summary.totalComponents} />
              <ReadinessMiniCard label="Pilot" count={pilotReady} total={view.summary.totalComponents} />
              <ReadinessMiniCard label="Production" count={productionReady} total={view.summary.totalComponents} />
            </div>
          </div>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: SPACING.lg }}>
          <div style={{ ...cardStyle, padding: SPACING.xl, display: 'grid', gap: SPACING.md }}>
            <div style={sectionHeaderStyle}>
              <div>
                <div style={TYPE.eyebrow}>Top blockers</div>
                <h2 style={{ ...TYPE.h2, margin: 0, letterSpacing: 0 }}>What blocks production readiness</h2>
              </div>
              <span style={{ ...TYPE.caption, fontFamily: FONT.mono }}>{view.summary.topBlockers.length} tracked</span>
            </div>
            <div style={{ display: 'grid', gap: SPACING.sm }}>
              {view.summary.topBlockers.map((blocker) => (
                <div
                  key={blocker.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '150px minmax(0, 1fr) 120px',
                    gap: SPACING.md,
                    alignItems: 'start',
                    borderTop: BORDER.hairlineSoft,
                    paddingTop: SPACING.md,
                  }}
                >
                  <div>
                    <SeverityPill severity={blocker.severity} />
                    <div style={{ ...TYPE.caption, color: COLORS.muted, marginTop: SPACING.xs }}>
                      {blocker.componentName}
                    </div>
                  </div>
                  <div style={{ ...TYPE.body, margin: 0 }}>{blocker.description}</div>
                  <StatusPill status={blocker.unblocks} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...cardStyle, padding: SPACING.xl, display: 'grid', gap: SPACING.md }}>
            <div>
              <div style={TYPE.eyebrow}>Next recommended actions</div>
              <h2 style={{ ...TYPE.h2, margin: 0, letterSpacing: 0 }}>Fix next</h2>
            </div>
            <div style={{ display: 'grid', gap: SPACING.sm }}>
              {view.recommendedActions.slice(0, 5).map((action, index) => (
                <div key={action.id} style={{ borderTop: BORDER.hairlineSoft, paddingTop: SPACING.md }}>
                  <div style={{ display: 'flex', gap: SPACING.sm, alignItems: 'center', marginBottom: SPACING.xs }}>
                    <span style={{ ...TYPE.eyebrow, color: COLORS.navy }}>{String(index + 1).padStart(2, '0')}</span>
                    <span style={{ ...TYPE.caption, fontWeight: 600, color: COLORS.ink }}>{action.componentName}</span>
                  </div>
                  <div style={{ ...TYPE.body, fontSize: 13 }}>{action.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ display: 'grid', gap: SPACING.md }}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={TYPE.eyebrow}>Component readiness grid</div>
              <h2 style={{ ...TYPE.h2, margin: 0, letterSpacing: 0 }}>Product areas and current maturity</h2>
            </div>
            <span style={{ ...TYPE.caption, fontFamily: FONT.mono }}>{view.summary.totalComponents} components</span>
          </div>
          <div style={tableWrapStyle}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Component</th>
                  <th style={thStyle}>Owner</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Risk</th>
                  <th style={thStyle}>Maturity</th>
                  <th style={thStyle}>Next action</th>
                  <th style={thStyle}>Blockers</th>
                </tr>
              </thead>
              <tbody>
                {view.components.map((component) => (
                  <tr key={component.id}>
                    <td style={{ ...tdStyle, minWidth: 210 }}>
                      <div style={{ ...TYPE.body, fontWeight: 600 }}>{component.name}</div>
                      <div style={{ ...TYPE.caption, fontFamily: FONT.mono }}>{component.id}</div>
                    </td>
                    <td style={tdStyle}>{component.ownerAgent}</td>
                    <td style={tdStyle}><StatusPill status={component.status} /></td>
                    <td style={tdStyle}>
                      <span style={{ ...TYPE.caption, fontFamily: FONT.mono }}>
                        {formatStatus(component.productionRiskLevel ?? component.dimensions.production_risk)}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, minWidth: 300 }}>{component.maturity}</td>
                    <td style={{ ...tdStyle, minWidth: 300 }}>{component.nextAction}</td>
                    <td style={tdStyle}>{component.blockers.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ display: 'grid', gap: SPACING.md }}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={TYPE.eyebrow}>Readiness dimensions</div>
              <h2 style={{ ...TYPE.h2, margin: 0, letterSpacing: 0 }}>Dimension status by component</h2>
            </div>
          </div>
          <StatusMatrix components={view.components} mode="dimensions" />
        </section>

        <section style={{ display: 'grid', gap: SPACING.md }}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={TYPE.eyebrow}>Testing gates</div>
              <h2 style={{ ...TYPE.h2, margin: 0, letterSpacing: 0 }}>Gate status by component</h2>
            </div>
            <span style={{ ...TYPE.caption, color: COLORS.muted }}>
              Vercel and live persona checks are not marked passing by this tracker.
            </span>
          </div>
          <StatusMatrix components={view.components} mode="gates" />
        </section>

        <section style={{ display: 'grid', gap: SPACING.md }}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={TYPE.eyebrow}>Blocked and deferred</div>
              <h2 style={{ ...TYPE.h2, margin: 0, letterSpacing: 0 }}>Lowest readiness areas</h2>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: SPACING.md }}>
            {view.lowestReadinessComponents.map((component) => (
              <div key={component.id} style={{ ...cardStyle, padding: SPACING.lg, display: 'grid', gap: SPACING.sm }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: SPACING.sm, alignItems: 'center' }}>
                  <div style={{ ...TYPE.h3, margin: 0, letterSpacing: 0 }}>{component.name}</div>
                  <StatusPill status={component.status} />
                </div>
                <div style={TYPE.caption}>{component.maturity}</div>
                <div style={{ display: 'grid', gap: SPACING.xs }}>
                  {component.blockers.map((blocker) => (
                    <div key={blocker.id} style={{ ...TYPE.caption, color: COLORS.body }}>
                      {blocker.description}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer style={{ ...TYPE.caption, display: 'flex', justifyContent: 'space-between', gap: SPACING.md, flexWrap: 'wrap' }}>
          <span>{view.stewardBrief.interpretationBasis}</span>
          <Link href="/platform/admin/build-progress" style={{ color: COLORS.navy, fontWeight: 600, textDecoration: 'none' }}>
            Back to Build Progress
          </Link>
        </footer>
      </div>
    </main>
  );
}

function StatusMatrix({
  components,
  mode,
}: {
  components: ReadonlyArray<ProductionReadinessComponent>;
  mode: 'dimensions' | 'gates';
}) {
  const columns = mode === 'dimensions' ? PRODUCTION_READINESS_DIMENSIONS : PRODUCTION_READINESS_GATES;

  return (
    <div style={tableWrapStyle}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1120 }}>
        <thead>
          <tr>
            <th style={thStyle}>Component</th>
            {columns.map((column) => (
              <th key={column} style={{ ...thStyle, textAlign: 'center' }}>
                {mode === 'dimensions'
                  ? dimensionLabels[column as ProductionReadinessDimension]
                  : gateLabels[column as ProductionReadinessGate]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {components.map((component) => (
            <tr key={component.id}>
              <td style={{ ...tdStyle, minWidth: 220 }}>
                <div style={{ ...TYPE.caption, color: COLORS.ink, fontWeight: 600 }}>{component.name}</div>
              </td>
              {columns.map((column) => (
                <td key={column} style={{ ...tdStyle, textAlign: 'center' }}>
                  {mode === 'dimensions' ? (
                    <CompactStatusPill status={component.dimensions[column as ProductionReadinessDimension]} />
                  ) : (
                    <GateStatusPill status={component.testingGates[column as ProductionReadinessGate].status} />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReadinessMiniCard({ label, count, total }: { label: string; count: number; total: number }) {
  return (
    <div style={{ ...cardStyle, padding: SPACING.md, background: COLORS.card }}>
      <div style={TYPE.eyebrow}>{label}</div>
      <div style={{ ...TYPE.h2, margin: 0, letterSpacing: 0 }}>{count}/{total}</div>
    </div>
  );
}

function ReadinessBar({ percent }: { percent: number }) {
  return (
    <div
      style={{
        height: 8,
        borderRadius: RADIUS.pill,
        background: COLORS.border,
        overflow: 'hidden',
        marginTop: SPACING.md,
      }}
    >
      <div
        style={{
          width: `${percent}%`,
          height: '100%',
          background: percent >= 70 ? COLORS.navy : percent >= 45 ? COLORS.amber : COLORS.red,
        }}
      />
    </div>
  );
}

function StatusPill({ status }: { status: ProductionReadinessStatus }) {
  const tone = readinessTone(status);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        width: 'fit-content',
        borderRadius: RADIUS.pill,
        padding: '4px 9px',
        fontFamily: FONT.mono,
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        color: tone.fg,
        background: tone.bg,
        border: `1px solid ${tone.ring}`,
        whiteSpace: 'nowrap',
      }}
    >
      {formatStatus(status)}
    </span>
  );
}

function CompactStatusPill({ status }: { status: ProductionReadinessStatus }) {
  const tone = readinessTone(status);
  return (
    <span
      title={formatStatus(status)}
      style={{
        display: 'inline-flex',
        justifyContent: 'center',
        minWidth: 78,
        borderRadius: RADIUS.sm,
        padding: '4px 6px',
        fontFamily: FONT.mono,
        fontSize: 9,
        fontWeight: 600,
        color: tone.fg,
        background: tone.bg,
        border: `1px solid ${tone.ring}`,
        whiteSpace: 'nowrap',
      }}
    >
      {shortStatus(status)}
    </span>
  );
}

function GateStatusPill({ status }: { status: ProductionReadinessGateStatus }) {
  const tone = gateTone(status);
  return (
    <span
      title={formatStatus(status)}
      style={{
        display: 'inline-flex',
        justifyContent: 'center',
        minWidth: 84,
        borderRadius: RADIUS.sm,
        padding: '4px 6px',
        fontFamily: FONT.mono,
        fontSize: 9,
        fontWeight: 600,
        color: tone.fg,
        background: tone.bg,
        border: `1px solid ${tone.ring}`,
        whiteSpace: 'nowrap',
      }}
    >
      {formatStatus(status)}
    </span>
  );
}

function SeverityPill({ severity }: { severity: 'low' | 'medium' | 'high' | 'critical' }) {
  const tone =
    severity === 'critical'
      ? { fg: COLORS.red, bg: COLORS.redSoft, ring: COLORS.red }
      : severity === 'high'
        ? { fg: COLORS.amber, bg: COLORS.amberSoft, ring: COLORS.amber }
        : { fg: COLORS.navy, bg: COLORS.navySoft, ring: COLORS.navy };

  return (
    <span
      style={{
        display: 'inline-flex',
        width: 'fit-content',
        borderRadius: RADIUS.pill,
        padding: '3px 8px',
        fontFamily: FONT.mono,
        fontSize: 9,
        fontWeight: 600,
        textTransform: 'uppercase',
        color: tone.fg,
        background: tone.bg,
        border: `1px solid ${tone.ring}`,
      }}
    >
      {severity}
    </span>
  );
}

function readinessTone(status: ProductionReadinessStatus) {
  if (status === 'production_ready' || status === 'pilot_ready' || status === 'full_flow_ready' || status === 'tested') {
    return { fg: COLORS.navy, bg: COLORS.navySoft, ring: COLORS.navy };
  }
  if (status === 'blocked') {
    return { fg: COLORS.red, bg: COLORS.redSoft, ring: COLORS.red };
  }
  if (status === 'not_started') {
    return { fg: COLORS.muted, bg: 'rgba(82, 88, 102, 0.10)', ring: COLORS.mutedSoft };
  }
  return { fg: COLORS.amber, bg: COLORS.amberSoft, ring: COLORS.amber };
}

function gateTone(status: ProductionReadinessGateStatus) {
  if (status === 'passing') {
    return { fg: COLORS.navy, bg: COLORS.navySoft, ring: COLORS.navy };
  }
  if (status === 'blocked') {
    return { fg: COLORS.red, bg: COLORS.redSoft, ring: COLORS.red };
  }
  if (status === 'not_started' || status === 'not_run') {
    return { fg: COLORS.muted, bg: 'rgba(82, 88, 102, 0.10)', ring: COLORS.mutedSoft };
  }
  return { fg: COLORS.amber, bg: COLORS.amberSoft, ring: COLORS.amber };
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ');
}

function shortStatus(status: ProductionReadinessStatus): string {
  if (status === 'production_ready') return 'prod';
  if (status === 'full_flow_ready') return 'flow';
  if (status === 'code_complete') return 'code';
  if (status === 'not_started') return 'none';
  return status.replace(/_/g, ' ');
}
