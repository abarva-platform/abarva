// /strategic-moves/expert-kernel/dossier
//
// Master HTML artifact for a Move. It renders the deterministic dossier
// view-model produced by the Moves Expert Kernel: status rail, phase sections,
// evidence gaps, Tower handoff, downloads and review/sign-off state.
//
// Server Component by default. No client JS is needed for the first iteration;
// anchors provide navigation and the export route handles downloads.

import Link from 'next/link';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/lib/design/design-tokens';
import {
  EXPERT_REVIEW_CASE_IDS,
  EXPERT_REVIEW_CASES,
  isExpertReviewCaseId,
  buildMasterMoveDossier,
  type DossierStatusRailItem,
} from '@/lib/programs/expert-kernel';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Master Move Dossier · Moves Expert Kernel · AbarVa',
};

function toneColor(tone: DossierStatusRailItem['tone']): {
  bg: string;
  ink: string;
  border: string;
} {
  if (tone === 'good') {
    return { bg: COLORS.mintSoft, ink: COLORS.mintInk, border: COLORS.mintInk };
  }
  if (tone === 'warn') {
    return { bg: COLORS.amberSoft, ink: COLORS.amberInk, border: COLORS.amberInk };
  }
  if (tone === 'bad') {
    return { bg: COLORS.coralSoft, ink: COLORS.coralInk, border: COLORS.coralInk };
  }
  return { bg: COLORS.white, ink: COLORS.ink, border: `${COLORS.ink}33` };
}

function scoreTone(score: number): DossierStatusRailItem['tone'] {
  if (score >= 9) return 'good';
  if (score >= 8.5) return 'good';
  if (score >= 7.5) return 'warn';
  return 'bad';
}

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="dossier-section">
      <div className="section-eyebrow">{eyebrow}</div>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function QualityChip({ score }: { score: number }) {
  const tone = toneColor(scoreTone(score));
  return (
    <span
      className="quality-chip"
      style={{
        background: tone.bg,
        borderColor: tone.border,
        color: tone.ink,
      }}
    >
      {score.toFixed(1)}
    </span>
  );
}

function numericMagnitude(value: number | string): number | null {
  if (typeof value === 'number') return Math.abs(value);
  const match = value.match(/-?\$?([0-9]+(?:\.[0-9]+)?)([MK])?/i);
  if (!match) return null;
  const base = Number(match[1]);
  if (!Number.isFinite(base)) return null;
  const multiplier = match[2]?.toUpperCase() === 'M'
    ? 1_000_000
    : match[2]?.toUpperCase() === 'K'
      ? 1_000
      : 1;
  return Math.abs(base * multiplier);
}

function shouldRenderChart(kind: string): boolean {
  return ['bar', 'curve', 'meter', 'stack', 'waterfall'].includes(kind);
}

export default async function MasterMoveDossierPage({
  searchParams,
}: {
  searchParams: Promise<{ case?: string }>;
}) {
  const { case: caseParam } = await searchParams;
  const caseId = isExpertReviewCaseId(caseParam) ? caseParam : 'apexretail';
  const dossier = buildMasterMoveDossier(caseId);

  return (
    <main className="dossier-shell">
      <style>{`
        .dossier-shell {
          min-height: 100vh;
          background: ${COLORS.cream};
          color: ${COLORS.ink};
          font-family: ${TYPOGRAPHY.sans};
        }
        [data-component="AskAnythingBar"] {
          display: none !important;
        }
        nextjs-portal {
          display: none !important;
        }
        .dossier-layout {
          display: grid;
          grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
          gap: ${SPACING.xl};
          max-width: 1480px;
          margin: 0 auto;
          padding: ${SPACING.xl};
        }
        .side-nav {
          position: sticky;
          top: ${SPACING.lg};
          align-self: start;
          border-right: 1px solid ${COLORS.ink}22;
          padding-right: ${SPACING.lg};
        }
        .brand-mark {
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: ${COLORS.navy};
          font-weight: 800;
          margin-bottom: ${SPACING.sm};
        }
        .case-switcher {
          display: grid;
          gap: 6px;
          margin: ${SPACING.md} 0 ${SPACING.lg};
        }
        .case-switcher a,
        .side-nav a {
          color: inherit;
          text-decoration: none;
        }
        .case-link {
          display: block;
          border: 1px solid ${COLORS.ink}33;
          border-radius: ${RADIUS.sm};
          padding: 8px 10px;
          font-size: 12px;
          font-weight: 700;
        }
        .case-link.active {
          background: ${COLORS.ink};
          color: ${COLORS.white};
          border-color: ${COLORS.ink};
        }
        .nav-list {
          display: grid;
          gap: 7px;
          margin-top: ${SPACING.sm};
        }
        .nav-list a {
          display: block;
          font-size: 12px;
          line-height: 1.25;
          padding: 5px 0;
          color: ${COLORS.ink};
        }
        .dossier-content {
          min-width: 0;
        }
        .hero {
          border-bottom: 2px solid ${COLORS.ink};
          padding-bottom: ${SPACING.lg};
          margin-bottom: ${SPACING.lg};
        }
        .hero h1 {
          font-family: ${TYPOGRAPHY.serif};
          font-size: clamp(36px, 5vw, 64px);
          line-height: 0.98;
          letter-spacing: 0;
          margin: 0 0 ${SPACING.sm};
          max-width: 980px;
        }
        .hero-meta,
        .section-eyebrow,
        .metric-label {
          font-family: ${TYPOGRAPHY.mono};
          font-size: 10px;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: ${COLORS.ink};
          opacity: 0.72;
        }
        .status-rail {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 8px;
          margin-top: ${SPACING.lg};
        }
        .status-item {
          border: 1px solid var(--tone-border);
          background: var(--tone-bg);
          color: var(--tone-ink);
          border-radius: ${RADIUS.sm};
          padding: 10px;
          min-height: 72px;
        }
        .status-value {
          font-size: 16px;
          font-weight: 800;
          line-height: 1.1;
          margin-top: 5px;
          overflow-wrap: anywhere;
        }
        .summary-grid,
        .phase-grid,
        .exhibit-grid,
        .download-grid,
        .signoff-grid {
          display: grid;
          gap: ${SPACING.sm};
        }
        .summary-grid {
          grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.6fr);
        }
        .phase-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .exhibit-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .download-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .signoff-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .panel {
          background: ${COLORS.white};
          border: 1px solid ${COLORS.ink}22;
          border-radius: ${RADIUS.md};
          padding: ${SPACING.md};
        }
        .panel h3 {
          font-size: 15px;
          margin: 0 0 8px;
        }
        .panel p,
        .panel li,
        .evidence-table td,
        .evidence-table th {
          font-size: 13px;
          line-height: 1.48;
        }
        .dossier-section {
          margin-bottom: ${SPACING.xl};
          scroll-margin-top: ${SPACING.lg};
        }
        .dossier-section h2 {
          font-family: ${TYPOGRAPHY.serif};
          font-size: 28px;
          letter-spacing: 0;
          line-height: 1.1;
          margin: 4px 0 ${SPACING.md};
        }
        .quality-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 38px;
          height: 24px;
          border: 1px solid;
          border-radius: ${RADIUS.pill};
          font-family: ${TYPOGRAPHY.mono};
          font-size: 11px;
          font-weight: 800;
        }
        .artifact-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-top: 1px solid ${COLORS.ink}12;
          padding-top: 8px;
          margin-top: 8px;
        }
        .download-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 10px;
        }
        .download-actions a {
          border: 1px solid ${COLORS.ink}33;
          border-radius: ${RADIUS.sm};
          padding: 6px 8px;
          color: ${COLORS.ink};
          text-decoration: none;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .evidence-table {
          width: 100%;
          border-collapse: collapse;
          background: ${COLORS.white};
          border: 1px solid ${COLORS.ink}22;
          border-radius: ${RADIUS.md};
          overflow: hidden;
        }
        .evidence-table th {
          text-align: left;
          background: ${COLORS.ink};
          color: ${COLORS.white};
          font-family: ${TYPOGRAPHY.mono};
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 10px;
        }
        .evidence-table td {
          vertical-align: top;
          border-top: 1px solid ${COLORS.ink}14;
          padding: 10px;
        }
        .mini-visual {
          display: grid;
          gap: 8px;
          margin-top: ${SPACING.sm};
        }
        .architecture-panel {
          margin-top: ${SPACING.sm};
          display: grid;
          gap: ${SPACING.sm};
        }
        .architecture-options {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: ${SPACING.sm};
        }
        .architecture-option {
          border: 1px solid ${COLORS.ink}18;
          border-radius: ${RADIUS.sm};
          padding: 10px;
          background: ${COLORS.cream};
        }
        .architecture-option.selected {
          border-color: ${COLORS.navy};
          background: ${COLORS.mintSoft};
        }
        .architecture-flow {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 8px;
        }
        .architecture-node {
          min-height: 82px;
          border: 1px solid ${COLORS.ink}22;
          border-radius: ${RADIUS.sm};
          padding: 9px;
          background: ${COLORS.white};
          font-size: 12px;
          line-height: 1.3;
        }
        .architecture-node.gap {
          background: ${COLORS.amberSoft};
          border-color: ${COLORS.amberInk};
        }
        .boundary-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }
        .boundary-card {
          border-top: 1px solid ${COLORS.ink}14;
          padding-top: 8px;
          font-size: 12px;
          line-height: 1.42;
        }
        .bar-track {
          height: 10px;
          background: ${COLORS.ink}12;
          border-radius: ${RADIUS.pill};
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          background: ${COLORS.navy};
        }
        .exhibit-card {
          min-height: 190px;
        }
        .exhibit-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 8px;
        }
        .exhibit-status {
          border: 1px solid ${COLORS.ink}33;
          border-radius: ${RADIUS.pill};
          padding: 4px 7px;
          font-family: ${TYPOGRAPHY.mono};
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .exhibit-status.gap {
          background: ${COLORS.amberSoft};
          border-color: ${COLORS.amberInk};
          color: ${COLORS.amberInk};
        }
        .exhibit-status.ready {
          background: ${COLORS.mintSoft};
          border-color: ${COLORS.mintInk};
          color: ${COLORS.mintInk};
        }
        .exhibit-data {
          display: grid;
          gap: 6px;
          margin: 10px 0;
        }
        .exhibit-data-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
          border-top: 1px solid ${COLORS.ink}12;
          padding-top: 6px;
          font-size: 12px;
        }
        .exhibit-value {
          font-weight: 900;
          white-space: nowrap;
        }
        .exhibit-note {
          color: ${COLORS.ink};
          font-size: 12px;
          line-height: 1.35;
          opacity: 0.75;
        }
        .exhibit-chart {
          display: grid;
          gap: 6px;
          margin: 12px 0;
        }
        .exhibit-chart-row {
          display: grid;
          grid-template-columns: 90px minmax(0, 1fr);
          gap: 8px;
          align-items: center;
        }
        .exhibit-chart-label {
          font-size: 10px;
          font-weight: 800;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .exhibit-chart-track {
          height: 12px;
          background: ${COLORS.ink}10;
          border-radius: ${RADIUS.pill};
          overflow: hidden;
        }
        .exhibit-chart-fill {
          display: block;
          height: 100%;
          min-width: 3px;
          background: ${COLORS.navy};
          border-radius: ${RADIUS.pill};
        }
        @media (max-width: 980px) {
          .dossier-layout {
            grid-template-columns: 1fr;
            padding: ${SPACING.md};
          }
          .side-nav {
            position: static;
            border-right: 0;
            border-bottom: 1px solid ${COLORS.ink}22;
            padding-right: 0;
            padding-bottom: ${SPACING.md};
          }
          .nav-list {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .status-rail,
          .summary-grid,
          .phase-grid,
          .architecture-options,
          .architecture-flow,
          .boundary-grid,
          .exhibit-grid,
          .download-grid,
          .signoff-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="dossier-layout">
        <aside className="side-nav" aria-label="Dossier navigation">
          <div className="brand-mark">AbarVa · Moves dossier</div>
          <div className="hero-meta">{dossier.generatedOn}</div>
          <div className="case-switcher">
            {EXPERT_REVIEW_CASE_IDS.map((id) => (
              <Link
                className={`case-link ${id === dossier.caseId ? 'active' : ''}`}
                href={`/strategic-moves/expert-kernel/dossier?case=${id}`}
                key={id}
              >
                {EXPERT_REVIEW_CASES[id].tenantLabel}
              </Link>
            ))}
          </div>
          <nav className="nav-list">
            {dossier.sectionNavigation.map((item) => (
              <a href={`#${item.id}`} key={item.id}>
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="dossier-content">
          <header className="hero">
            <div className="hero-meta">
              {dossier.tenantLabel} · {dossier.tenantKey}
            </div>
            <h1>{dossier.moveLabel}</h1>
            <div className="hero-meta">
              Master artifact · source of truth for decision, evidence, quality,
              downloads and sign-off.
            </div>
            <div className="status-rail" aria-label="Dossier status rail">
              {dossier.topStatusRail.map((item) => {
                const tone = toneColor(item.tone);
                return (
                  <div
                    className="status-item"
                    key={item.id}
                    style={{
                      '--tone-bg': tone.bg,
                      '--tone-ink': tone.ink,
                      '--tone-border': tone.border,
                    } as React.CSSProperties}
                  >
                    <div className="metric-label">{item.label}</div>
                    <div className="status-value">{item.value}</div>
                  </div>
                );
              })}
            </div>
          </header>

          <Section
            id="executive_summary"
            eyebrow="Above the fold"
            title="Executive Summary"
          >
            <div className="summary-grid">
              <div className="panel">
                <h3>{dossier.executiveSummary.answer}</h3>
                <p>{dossier.executiveSummary.recommendationRationale}</p>
                <p>
                  <strong>Next gate:</strong> {dossier.executiveSummary.nextGate}
                </p>
              </div>
              <div className="panel">
                <div className="metric-label">Investment</div>
                <h3>{dossier.executiveSummary.investmentRange}</h3>
                <div className="metric-label">Value range</div>
                <h3>{dossier.executiveSummary.valueRange}</h3>
                <div className="metric-label">Payback</div>
                <p>{dossier.executiveSummary.payback}</p>
              </div>
            </div>
          </Section>

          <Section id="decision_timeline" eyebrow="Decision record" title="Decision Timeline">
            <div className="phase-grid">
              {dossier.phaseSections.map((section) => (
                <div className="panel" key={section.id}>
                  <div className="metric-label">{section.primaryQuestion}</div>
                  <h3>{section.title}</h3>
                  <p>{section.summary}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section
            id="visual_exhibits"
            eyebrow="Board visuals"
            title="Visual Exhibits"
          >
            <div className="exhibit-grid">
              {dossier.visualExhibits.map((exhibit) => {
                const chartData = exhibit.data
                  .map((datum) => ({
                    ...datum,
                    magnitude: numericMagnitude(datum.value),
                  }))
                  .filter((datum) => datum.magnitude !== null)
                  .slice(0, 5);
                const maxMagnitude = Math.max(
                  1,
                  ...chartData.map((datum) => datum.magnitude ?? 0),
                );
                return (
                  <div className="panel exhibit-card" key={exhibit.id}>
                        <div className="exhibit-meta">
                          <div className="metric-label">{exhibit.kind}</div>
                          <span className={`exhibit-status ${exhibit.status}`}>
                            {exhibit.status}
                          </span>
                        </div>
                        <h3>{exhibit.title}</h3>
                        <p>{exhibit.subtitle}</p>
                        {shouldRenderChart(exhibit.kind) && chartData.length > 0 ? (
                          <div
                            className="exhibit-chart"
                            aria-label={`${exhibit.title} mini chart`}
                          >
                            {chartData.map((datum) => (
                              <div
                                className="exhibit-chart-row"
                                key={`${exhibit.id}:chart:${datum.label}`}
                              >
                                <span className="exhibit-chart-label">
                                  {datum.label}
                                </span>
                                <span className="exhibit-chart-track">
                                  <span
                                    className="exhibit-chart-fill"
                                    style={{
                                      width: `${Math.max(
                                        6,
                                        Math.round(
                                          ((datum.magnitude ?? 0) /
                                            maxMagnitude) *
                                            100,
                                        ),
                                      )}%`,
                                    }}
                                  />
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        <div className="exhibit-data">
                          {exhibit.data.slice(0, 3).map((datum) => (
                            <div
                              className="exhibit-data-row"
                              key={`${exhibit.id}:${datum.label}`}
                            >
                              <span>{datum.label}</span>
                              <span className="exhibit-value">
                                {datum.value}
                                {datum.unit ? ` ${datum.unit}` : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="exhibit-note">{exhibit.cSuiteUse}</div>
                  </div>
                );
              })}
            </div>
          </Section>

          {dossier.phaseSections.map((section) => (
            <Section
              id={section.id}
              eyebrow={section.primaryQuestion}
              key={section.id}
              title={section.title}
            >
              <div className="panel">
                <p>{section.summary}</p>
                {section.artifactQuality.map((artifact) => (
                  <div className="artifact-row" key={artifact.artifactId}>
                    <div>
                      <strong>{artifact.label}</strong>
                      <div className="metric-label">{artifact.quality.verdict}</div>
                    </div>
                    <QualityChip score={artifact.quality.score} />
                  </div>
                ))}
                {section.gaps.length > 0 ? (
                  <ul>
                    {section.gaps.slice(0, 3).map((gap) => (
                      <li key={gap.id}>
                        <strong>{gap.severity.toUpperCase()}:</strong> {gap.label}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No open evidence gaps recorded for this section.</p>
                )}
                {section.id === 'solution_architecture' ? (
                  <div className="architecture-panel">
                    <div>
                      <div className="metric-label">Selected Architecture</div>
                      <h3>{dossier.solutionArchitecture.selectedOption.name}</h3>
                      <p>{dossier.solutionArchitecture.selectedOption.summary}</p>
                    </div>
                    <div className="architecture-options">
                      {dossier.solutionArchitecture.optionSet.options.map((option) => (
                        <div
                          className={`architecture-option ${
                            option.id ===
                            dossier.solutionArchitecture.optionSet
                              .recommendedOptionId
                              ? 'selected'
                              : ''
                          }`}
                          key={option.id}
                        >
                          <div className="metric-label">{option.shape}</div>
                          <h3>{option.name}</h3>
                          <p>
                            Reference score {option.referenceScore};{' '}
                            {option.productionShaped
                              ? 'production-shaped'
                              : 'open component gaps'}.
                          </p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="metric-label">Logical Architecture</div>
                      <div className="architecture-flow">
                        {dossier.solutionArchitecture.diagrams
                          .find(
                            (diagram) =>
                              diagram.id === 'logical_architecture_diagram',
                          )
                          ?.nodes.map((architectureNode) => (
                            <div
                              className={`architecture-node ${architectureNode.status}`}
                              key={architectureNode.id}
                            >
                              <strong>{architectureNode.label}</strong>
                              <br />
                              {architectureNode.evidence}
                            </div>
                          ))}
                      </div>
                    </div>
                    <div>
                      <div className="metric-label">Build / Buy / Partner Boundary</div>
                      <div className="boundary-grid">
                        {dossier.solutionArchitecture.buildBuyBoundary.map(
                          (lane) => (
                            <div className="boundary-card" key={lane.lane}>
                              <strong>{lane.disposition.toUpperCase()}</strong>{' '}
                              · {lane.lane}
                              <br />
                              {lane.rationale}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </Section>
          ))}

          <Section
            id="risks_controls_assumptions"
            eyebrow="Challenge logic"
            title="Risks, Controls and Assumptions"
          >
            <div className="summary-grid">
              <div className="panel">
                <h3>Top assumptions</h3>
                <ol>
                  {dossier.executiveSummary.topAssumptions.map((assumption) => (
                    <li key={assumption}>{assumption}</li>
                  ))}
                </ol>
              </div>
              <div className="panel">
                <h3>Open blockers and watch items</h3>
                <ul>
                  {dossier.evidenceGapSection.gaps.slice(0, 5).map((gap) => (
                    <li key={gap.id}>{gap.fixCondition}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>

          <Section id="evidence_gaps" eyebrow="Audit trail" title="Evidence and Gaps">
            <table className="evidence-table">
              <thead>
                <tr>
                  <th>Gap</th>
                  <th>Severity</th>
                  <th>Source</th>
                  <th>Owner</th>
                  <th>Fix condition</th>
                </tr>
              </thead>
              <tbody>
                {dossier.evidenceGapSection.gaps.map((gap) => (
                  <tr key={gap.id}>
                    <td>{gap.label}</td>
                    <td>{gap.severity}</td>
                    <td>{gap.source}</td>
                    <td>{gap.owner}</td>
                    <td>{gap.fixCondition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section
            id="tower_measurement"
            eyebrow="Forecast to actual"
            title="Tower Measurement Handoff"
          >
            <div className="panel">
              <h3>
                Loop {dossier.towerMeasurementSection.loopCloses ? 'closes' : 'does not close yet'}
              </h3>
              <p>
                Wiring coverage:{' '}
                {Math.round(dossier.towerMeasurementSection.wiringCoverage * 100)}%
              </p>
              <div className="mini-visual" aria-label="Tower wiring coverage">
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${Math.round(
                        dossier.towerMeasurementSection.wiringCoverage * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
              <ul>
                {dossier.towerMeasurementSection.metrics.map((metric) => (
                  <li key={metric.baselineMetricKey}>
                    <strong>{metric.label}</strong> · {metric.readinessNote}
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          <Section id="downloads" eyebrow="Export set" title="Downloads">
            <div className="download-grid">
              {dossier.downloadsSection.map((card) => (
                <div className="panel" key={card.artifactId}>
                  <div className="metric-label">{card.phase}</div>
                  <h3>{card.label}</h3>
                  <QualityChip score={card.qualityScore} />
                  <p>
                    {card.verdict}; {card.hardFailureCount} hard fail(s).
                  </p>
                  <div className="download-actions">
                    {card.formats.map((format) => (
                      <Link
                        href={`/api/v1/programs/expert-kernel/export?case=${dossier.caseId}&artifact=${card.artifactId}&format=${format}`}
                        key={format}
                      >
                        {format}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="review_signoff" eyebrow="Governance" title="Review and Sign-Off">
            <div className="signoff-grid">
              {dossier.reviewSignoffSection.map((row) => (
                <div className="panel" key={row.role}>
                  <div className="metric-label">
                    {row.requiredForGate ? 'Required for gate' : 'Advisory'}
                  </div>
                  <h3>{row.label}</h3>
                  <p>
                    <strong>{row.state.replaceAll('_', ' ')}</strong>
                  </p>
                  <p>{row.note}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </main>
  );
}
