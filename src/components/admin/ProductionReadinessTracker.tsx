import Link from 'next/link';
import type { CSSProperties } from 'react';
import {
  type ProductMaturityArea,
  type ProductMaturityIndicator,
  type ProductionReadinessComponent,
  type ProductionReadinessComponentProgress,
  type ProductionReadinessDimension,
  type ProductionReadinessGate,
  type ProductionReadinessGateStatus,
  type ProductionReadinessSegmentSummary,
  type ProductionReadinessStatus,
  type ProductionReadinessView,
} from '@/lib/admin/production-readiness';
import { BORDER, COLORS, FONT, RADIUS, SPACING, TYPE } from '@/lib/design/abarva-theme';

const PRODUCTION_READINESS_DIMENSION_COLUMNS: ReadonlyArray<ProductionReadinessDimension> = [
  'functionality',
  'data_readiness',
  'agent_readiness',
  'evidence_audit_readiness',
  'ui_ux_readiness',
  'tenant_isolation',
  'test_coverage',
  'build_deploy_health',
  'production_risk',
];

const PRODUCTION_READINESS_GATE_COLUMNS: ReadonlyArray<ProductionReadinessGate> = [
  'unit_tests',
  'integration_tests',
  'route_smoke',
  'live_persona_walk',
  'no_fabrication_check',
  'tenant_isolation_check',
  'vercel_build',
  'security_governance_review',
];

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
  view,
}: {
  view: ProductionReadinessView;
}) {
  const startedCount = view.componentProgress.filter((component) => component.started).length;
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
              <h1
                style={{
                  ...TYPE.h1,
                  margin: 0,
                  fontSize: 34,
                  letterSpacing: 0,
                }}
              >
                Production readiness is visible, but still blocked.
              </h1>
              <p style={{ ...TYPE.body, margin: 0, maxWidth: 880 }}>{view.stewardBrief.summary}</p>
            </div>
            <div
              style={{
                display: 'flex',
                gap: SPACING.sm,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
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
            <div
              style={{
                ...cardStyle,
                padding: SPACING.lg,
                background: COLORS.surface2,
              }}
            >
              <div style={TYPE.eyebrow}>Overall readiness score</div>
              <div style={{ display: 'flex', alignItems: 'end', gap: SPACING.sm }}>
                <div
                  style={{
                    ...TYPE.h1,
                    margin: 0,
                    fontSize: 64,
                    lineHeight: 0.9,
                    letterSpacing: 0,
                  }}
                >
                  {view.overallReadinessPercent}
                </div>
                <div
                  style={{
                    ...TYPE.caption,
                    fontFamily: FONT.mono,
                    paddingBottom: 6,
                  }}
                >
                  / 100
                </div>
              </div>
              <ReadinessBar percent={view.overallReadinessPercent} />
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(118px, 1fr))',
                gap: SPACING.sm,
              }}
            >
              <ReadinessMiniCard label="Started" count={startedCount} total={view.summary.totalComponents} />
              <ReadinessMiniCard
                label="Code+"
                count={view.summary.codeCompleteOrBetterCount}
                total={view.summary.totalComponents}
              />
              <ReadinessMiniCard label="Full-flow" count={fullFlowReady} total={view.summary.totalComponents} />
              <ReadinessMiniCard label="Pilot" count={pilotReady} total={view.summary.totalComponents} />
              <ReadinessMiniCard label="Production" count={productionReady} total={view.summary.totalComponents} />
            </div>
          </div>
        </header>

        <MaturitySnapshotCards indicators={view.maturitySnapshot.indicators} />

        <section style={{ display: 'grid', gap: SPACING.md }}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={TYPE.eyebrow}>Product maturity by area</div>
              <h2 style={{ ...TYPE.h2, margin: 0, letterSpacing: 0 }}>What is complete, pending, and estimated done</h2>
            </div>
            <span style={{ ...TYPE.caption, color: COLORS.muted }}>{view.maturitySnapshot.source}</span>
          </div>
          <ProductMaturityTable areas={view.maturitySnapshot.areas} />
        </section>

        <section style={{ display: 'grid', gap: SPACING.md }}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={TYPE.eyebrow}>Readiness by segment</div>
              <h2 style={{ ...TYPE.h2, margin: 0, letterSpacing: 0 }}>Segments, percent done, and pending work</h2>
            </div>
            <span style={{ ...TYPE.caption, color: COLORS.muted }}>
              Derived from the deterministic manifest, not live monitoring.
            </span>
          </div>
          <SegmentReadinessTable segments={view.segments} />
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: SPACING.lg,
          }}
        >
          <div
            style={{
              ...cardStyle,
              padding: SPACING.xl,
              display: 'grid',
              gap: SPACING.md,
            }}
          >
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
                    <div
                      style={{
                        ...TYPE.caption,
                        color: COLORS.muted,
                        marginTop: SPACING.xs,
                      }}
                    >
                      {blocker.componentName}
                    </div>
                  </div>
                  <div style={{ ...TYPE.body, margin: 0 }}>{blocker.description}</div>
                  <StatusPill status={blocker.unblocks} />
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              ...cardStyle,
              padding: SPACING.xl,
              display: 'grid',
              gap: SPACING.md,
            }}
          >
            <div>
              <div style={TYPE.eyebrow}>Next recommended actions</div>
              <h2 style={{ ...TYPE.h2, margin: 0, letterSpacing: 0 }}>Fix next</h2>
            </div>
            <div style={{ display: 'grid', gap: SPACING.sm }}>
              {view.recommendedActions.slice(0, 5).map((action, index) => (
                <div
                  key={action.id}
                  style={{
                    borderTop: BORDER.hairlineSoft,
                    paddingTop: SPACING.md,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: SPACING.sm,
                      alignItems: 'center',
                      marginBottom: SPACING.xs,
                    }}
                  >
                    <span style={{ ...TYPE.eyebrow, color: COLORS.navy }}>{String(index + 1).padStart(2, '0')}</span>
                    <span
                      style={{
                        ...TYPE.caption,
                        fontWeight: 600,
                        color: COLORS.ink,
                      }}
                    >
                      {action.componentName}
                    </span>
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
              <div style={TYPE.eyebrow}>Component progress table</div>
              <h2 style={{ ...TYPE.h2, margin: 0, letterSpacing: 0 }}>Started, done, pending, and blockers</h2>
            </div>
            <span style={{ ...TYPE.caption, fontFamily: FONT.mono }}>{view.summary.totalComponents} components</span>
          </div>
          <ComponentProgressTable components={view.componentProgress} />
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: SPACING.md,
            }}
          >
            {view.lowestReadinessComponents.map((component) => (
              <div
                key={component.id}
                style={{
                  ...cardStyle,
                  padding: SPACING.lg,
                  display: 'grid',
                  gap: SPACING.sm,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: SPACING.sm,
                    alignItems: 'center',
                  }}
                >
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

        <footer
          style={{
            ...TYPE.caption,
            display: 'flex',
            justifyContent: 'space-between',
            gap: SPACING.md,
            flexWrap: 'wrap',
          }}
        >
          <span>{view.stewardBrief.interpretationBasis}</span>
          <Link
            href="/platform/admin/build-progress"
            style={{
              color: COLORS.navy,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Back to Build Progress
          </Link>
        </footer>
      </div>
    </main>
  );
}

function MaturitySnapshotCards({ indicators }: { indicators: ReadonlyArray<ProductMaturityIndicator> }) {
  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: SPACING.md,
      }}
    >
      {indicators.map((indicator) => (
        <div
          key={indicator.id}
          style={{
            ...cardStyle,
            padding: SPACING.lg,
            display: 'grid',
            gap: SPACING.sm,
          }}
        >
          <div style={TYPE.eyebrow}>{indicator.label}</div>
          <div style={{ display: 'flex', alignItems: 'end', gap: SPACING.sm }}>
            <div
              style={{
                ...TYPE.h1,
                margin: 0,
                fontSize: 38,
                lineHeight: 1,
                letterSpacing: 0,
              }}
            >
              {formatPercentRange(indicator.percentLow, indicator.percentHigh)}
            </div>
          </div>
          <ReadinessBar percent={getPercentMidpoint(indicator.percentLow, indicator.percentHigh)} />
          <p style={{ ...TYPE.caption, margin: 0, color: COLORS.body }}>{indicator.interpretation}</p>
        </div>
      ))}
    </section>
  );
}

function ProductMaturityTable({ areas }: { areas: ReadonlyArray<ProductMaturityArea> }) {
  return (
    <div style={tableWrapStyle}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1180 }}>
        <thead>
          <tr>
            <th style={thStyle}>Area</th>
            <th style={thStyle}>What is complete / mostly complete</th>
            <th style={thStyle}>What is pending</th>
            <th style={thStyle}>Est. complete</th>
            <th style={thStyle}>Related readiness</th>
          </tr>
        </thead>
        <tbody>
          {areas.map((area) => (
            <tr key={area.id}>
              <td style={{ ...tdStyle, minWidth: 230 }}>
                <div style={{ ...TYPE.body, fontWeight: 700, color: COLORS.ink }}>{area.area}</div>
              </td>
              <td style={{ ...tdStyle, minWidth: 330 }}>{area.completed}</td>
              <td style={{ ...tdStyle, minWidth: 330 }}>{area.pending}</td>
              <td style={{ ...tdStyle, minWidth: 160 }}>
                <PercentCell
                  percent={getPercentMidpoint(area.percentLow, area.percentHigh)}
                  label={formatPercentRange(area.percentLow, area.percentHigh)}
                />
              </td>
              <td style={{ ...tdStyle, minWidth: 230 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING.xs }}>
                  {area.relatedComponentIds.map((componentId) => (
                    <span
                      key={componentId}
                      style={{
                        ...TYPE.caption,
                        fontFamily: FONT.mono,
                        color: COLORS.navy,
                        background: COLORS.navySoft,
                        border: `1px solid ${COLORS.mutedSoft}`,
                        borderRadius: RADIUS.sm,
                        padding: '3px 6px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {componentId}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SegmentReadinessTable({ segments }: { segments: ReadonlyArray<ProductionReadinessSegmentSummary> }) {
  return (
    <div style={tableWrapStyle}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1320 }}>
        <thead>
          <tr>
            <th style={thStyle}>Segment</th>
            <th style={thStyle}>Components</th>
            <th style={thStyle}>Started</th>
            <th style={thStyle}>% done</th>
            <th style={thStyle}>% pending</th>
            <th style={thStyle}>Code+</th>
            <th style={thStyle}>Tested+</th>
            <th style={thStyle}>Full-flow</th>
            <th style={thStyle}>Pilot</th>
            <th style={thStyle}>Production</th>
            <th style={thStyle}>Blockers</th>
            <th style={thStyle}>Next action</th>
          </tr>
        </thead>
        <tbody>
          {segments.map((segment) => (
            <tr key={segment.id}>
              <td style={{ ...tdStyle, minWidth: 230 }}>
                <div style={{ ...TYPE.body, fontWeight: 700, color: COLORS.ink }}>{segment.name}</div>
                <div style={{ ...TYPE.caption, color: COLORS.muted }}>{segment.description}</div>
              </td>
              <td style={tdStyle}>{segment.totalComponents}</td>
              <td style={tdStyle}>
                <CountCell count={segment.startedCount} total={segment.totalComponents} />
              </td>
              <td style={{ ...tdStyle, minWidth: 150 }}>
                <PercentCell percent={segment.percentComplete} />
              </td>
              <td style={{ ...tdStyle, minWidth: 150 }}>
                <PercentCell percent={segment.percentPending} pending />
              </td>
              <td style={tdStyle}>
                <CountCell count={segment.codeCompleteOrBetterCount} total={segment.totalComponents} />
              </td>
              <td style={tdStyle}>
                <CountCell count={segment.testReadyCount} total={segment.totalComponents} />
              </td>
              <td style={tdStyle}>
                <CountCell count={segment.fullFlowReadyCount} total={segment.totalComponents} />
              </td>
              <td style={tdStyle}>
                <CountCell count={segment.pilotReadyCount} total={segment.totalComponents} />
              </td>
              <td style={tdStyle}>
                <CountCell count={segment.productionReadyCount} total={segment.totalComponents} />
              </td>
              <td style={tdStyle}>
                <BlockerCount count={segment.blockerCount} critical={segment.criticalBlockerCount} />
              </td>
              <td style={{ ...tdStyle, minWidth: 320 }}>{segment.nextAction}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ComponentProgressTable({ components }: { components: ReadonlyArray<ProductionReadinessComponentProgress> }) {
  return (
    <div style={tableWrapStyle}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1260 }}>
        <thead>
          <tr>
            <th style={thStyle}>Segment</th>
            <th style={thStyle}>Component</th>
            <th style={thStyle}>Started</th>
            <th style={thStyle}>% done</th>
            <th style={thStyle}>% pending</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Risk</th>
            <th style={thStyle}>Blockers</th>
            <th style={thStyle}>Next action</th>
          </tr>
        </thead>
        <tbody>
          {components.map((component) => (
            <tr key={component.componentId}>
              <td style={{ ...tdStyle, minWidth: 190 }}>{component.segmentName}</td>
              <td style={{ ...tdStyle, minWidth: 230 }}>
                <div style={{ ...TYPE.body, fontWeight: 700, color: COLORS.ink }}>{component.componentName}</div>
                <div style={{ ...TYPE.caption, fontFamily: FONT.mono }}>{component.componentId}</div>
              </td>
              <td style={tdStyle}>
                <StartedPill started={component.started} />
              </td>
              <td style={{ ...tdStyle, minWidth: 150 }}>
                <PercentCell percent={component.percentComplete} />
              </td>
              <td style={{ ...tdStyle, minWidth: 150 }}>
                <PercentCell percent={component.percentPending} pending />
              </td>
              <td style={tdStyle}>
                <StatusPill status={component.status} />
              </td>
              <td style={tdStyle}>
                <span style={{ ...TYPE.caption, fontFamily: FONT.mono }}>
                  {formatStatus(component.productionRiskLevel)}
                </span>
              </td>
              <td style={tdStyle}>
                <BlockerCount count={component.blockerCount} critical={component.criticalBlockerCount} />
              </td>
              <td style={{ ...tdStyle, minWidth: 320 }}>{component.nextAction}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusMatrix({
  components,
  mode,
}: {
  components: ReadonlyArray<ProductionReadinessComponent>;
  mode: 'dimensions' | 'gates';
}) {
  const columns = mode === 'dimensions' ? PRODUCTION_READINESS_DIMENSION_COLUMNS : PRODUCTION_READINESS_GATE_COLUMNS;

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
                <div
                  style={{
                    ...TYPE.caption,
                    color: COLORS.ink,
                    fontWeight: 600,
                  }}
                >
                  {component.name}
                </div>
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
      <div style={{ ...TYPE.h2, margin: 0, letterSpacing: 0 }}>
        {count}/{total}
      </div>
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

function PercentCell({ percent, pending = false, label }: { percent: number; pending?: boolean; label?: string }) {
  return (
    <div style={{ display: 'grid', gap: SPACING.xs, minWidth: 120 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: SPACING.sm,
        }}
      >
        <span
          style={{
            ...TYPE.caption,
            fontFamily: FONT.mono,
            fontWeight: 700,
            color: COLORS.ink,
          }}
        >
          {label ?? `${percent}%`}
        </span>
        <span style={{ ...TYPE.caption, color: COLORS.muted }}>{pending ? 'pending' : 'done'}</span>
      </div>
      <div
        style={{
          height: 7,
          borderRadius: RADIUS.pill,
          background: COLORS.border,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.max(0, Math.min(100, percent))}%`,
            height: '100%',
            background: pending ? COLORS.amber : percent >= 50 ? COLORS.navy : COLORS.amber,
          }}
        />
      </div>
    </div>
  );
}

function CountCell({ count, total }: { count: number; total: number }) {
  return (
    <span
      style={{
        ...TYPE.caption,
        fontFamily: FONT.mono,
        fontWeight: 700,
        color: COLORS.ink,
        whiteSpace: 'nowrap',
      }}
    >
      {count}/{total}
    </span>
  );
}

function StartedPill({ started }: { started: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        width: 'fit-content',
        borderRadius: RADIUS.pill,
        padding: '4px 9px',
        fontFamily: FONT.mono,
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        color: started ? COLORS.navy : COLORS.muted,
        background: started ? COLORS.navySoft : 'rgba(82, 88, 102, 0.10)',
        border: `1px solid ${started ? COLORS.navy : COLORS.mutedSoft}`,
        whiteSpace: 'nowrap',
      }}
    >
      {started ? 'started' : 'not started'}
    </span>
  );
}

function BlockerCount({ count, critical }: { count: number; critical: number }) {
  return (
    <div style={{ display: 'grid', gap: 2 }}>
      <span
        style={{
          ...TYPE.caption,
          fontFamily: FONT.mono,
          fontWeight: 700,
          color: count > 0 ? COLORS.red : COLORS.ink,
        }}
      >
        {count}
      </span>
      {critical > 0 ? (
        <span style={{ ...TYPE.caption, fontFamily: FONT.mono, color: COLORS.red }}>{critical} critical</span>
      ) : null}
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
  if (
    status === 'production_ready' ||
    status === 'pilot_ready' ||
    status === 'full_flow_ready' ||
    status === 'tested'
  ) {
    return { fg: COLORS.navy, bg: COLORS.navySoft, ring: COLORS.navy };
  }
  if (status === 'blocked') {
    return { fg: COLORS.red, bg: COLORS.redSoft, ring: COLORS.red };
  }
  if (status === 'not_started') {
    return {
      fg: COLORS.muted,
      bg: 'rgba(82, 88, 102, 0.10)',
      ring: COLORS.mutedSoft,
    };
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
    return {
      fg: COLORS.muted,
      bg: 'rgba(82, 88, 102, 0.10)',
      ring: COLORS.mutedSoft,
    };
  }
  return { fg: COLORS.amber, bg: COLORS.amberSoft, ring: COLORS.amber };
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ');
}

function formatPercentRange(low: number, high: number): string {
  return low === high ? `${low}%` : `${low}-${high}%`;
}

function getPercentMidpoint(low: number, high: number): number {
  return Math.round((low + high) / 2);
}

function shortStatus(status: ProductionReadinessStatus): string {
  if (status === 'production_ready') return 'prod';
  if (status === 'full_flow_ready') return 'flow';
  if (status === 'code_complete') return 'code';
  if (status === 'not_started') return 'none';
  return status.replace(/_/g, ' ');
}
