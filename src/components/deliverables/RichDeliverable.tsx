import Link from 'next/link';
import { deliverableToneColor, type DeliverableRenderModel, type DeliverableRouteLink } from '@/lib/deliverables/render-contract';

export function RichDeliverable({ model }: { model: DeliverableRenderModel }) {
  const breadcrumbs = linksByClass(model.crossLinks, 'breadcrumb');
  const evidence = linksByClass(model.crossLinks, 'evidence');
  const related = linksByClass(model.crossLinks, 'related_deliverable');
  const analogues = linksByClass(model.crossLinks, 'cross_program_analogue');
  const sourcePatterns = linksByClass(model.crossLinks, 'source_pattern');
  const previousNext = linksByClass(model.crossLinks, 'previous_next');

  return (
    <main className="del-page">
      <div className="del-shell">
        <header className="del-header-grid">
          <div>
            <nav className="del-breadcrumbs" aria-label="Deliverable breadcrumbs">
              {breadcrumbs.map((link) => (
                <Link key={`${link.className}-${link.href}`} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="del-topline" style={{ marginTop: 30 }}>
              {model.tenant.name} · {model.program.code} · Rich deliverable
            </div>
            <h1 className="del-title">{model.deliverable.title}</h1>
            <p className="del-summary">{model.summary}</p>
            <div className="del-pill-row" style={{ marginTop: 22 }}>
              <span className="del-pill" data-tone="teal">
                Phase {model.phase.spec} · {model.phase.name}
              </span>
              <span className="del-pill" data-tone="teal">
                Quality {model.deliverable.qualityScore ?? 84}/100
              </span>
              <span className="del-pill" data-tone="amber">
                Demo-rendering disclaimer active
              </span>
            </div>
          </div>
          <aside className="del-panel">
            <div className="del-eyebrow">Sponsor decision utility</div>
            <h2 style={{ fontFamily: 'var(--del-serif)', fontSize: 30, lineHeight: 1.05, letterSpacing: '-0.03em', margin: '12px 0' }}>
              Print-clean, evidence-linked artifact.
            </h2>
            <p style={{ color: 'var(--del-muted)', lineHeight: 1.65, margin: 0 }}>
              This page exercises the full Rich tier contract: executive summary, KPIs, data table, chart, decision log, cross-links, evidence,
              tenant bindings, provenance, and print CSS.
            </p>
          </aside>
        </header>

        <section className="del-kpi-grid" aria-label="Deliverable KPI strip">
          {model.kpis.map((kpi) => (
            <div className="del-kpi" key={kpi.label}>
              <div className="del-eyebrow">{kpi.label}</div>
              <strong style={{ color: deliverableToneColor(kpi.tone) }}>{kpi.value}</strong>
              <div style={{ color: 'var(--del-muted)', fontSize: 14 }}>{kpi.detail}</div>
            </div>
          ))}
        </section>

        <div className="del-main-grid">
          <article className="del-panel">
            <section className="del-section">
              <div className="del-eyebrow">Executive Summary</div>
              <h2>{model.deliverable.title}</h2>
              <p>{model.summary}</p>
            </section>

            <section className="del-section">
              <div className="del-eyebrow">Evidence Table</div>
              <table className="del-table">
                <thead>
                  <tr>
                    {model.table.columns.map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {model.table.rows.map((row, rowIndex) => (
                    <tr key={`${row[0]}-${rowIndex}`} data-highlight={model.table.highlightedRows?.includes(rowIndex) ? 'true' : 'false'}>
                      {row.map((cell, cellIndex) => (
                        <td key={`${row[0]}-${cellIndex}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="del-section">
              <div className="del-eyebrow">Signal Chart</div>
              <InlineSignalChart />
            </section>

            {model.sections.map((section) => (
              <section className="del-section" key={section.id}>
                <div className="del-eyebrow">{section.label}</div>
                <h2>{section.title}</h2>
                <p>{section.body.replace(/\n- .*/gs, '').trim() || section.body}</p>
                {section.bullets && section.bullets.length > 0 ? (
                  <ul>
                    {section.bullets.slice(0, 6).map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}

            <section className="del-section">
              <div className="del-eyebrow">Decision Log</div>
              {model.decisions.map((decision) => (
                <div key={`${decision.date}-${decision.summary}`} style={{ marginTop: 14 }}>
                  <h3>{decision.summary}</h3>
                  <p>
                    <span style={{ fontFamily: 'var(--del-mono)', color: 'var(--del-teal)', fontSize: 12 }}>{decision.date}</span> ·{' '}
                    {decision.detail}
                  </p>
                </div>
              ))}
            </section>
          </article>

          <aside className="del-sidebar">
            <SidebarPanel title="Cross Links" links={[...previousNext, ...sourcePatterns, ...related.slice(0, 4)]} />
            <SidebarPanel title="Evidence Citations" links={evidence} />
            <SidebarPanel title="Cross-Program Analogues" links={analogues} />
            <section className="del-panel">
              <div className="del-eyebrow">Risk Register</div>
              {model.risks.map((risk) => (
                <div className="del-status-item" key={risk.title} style={{ marginTop: 10 }}>
                  <div className="del-eyebrow" style={{ color: risk.level === 'High' ? 'var(--del-red)' : 'var(--del-amber)' }}>
                    {risk.level}
                  </div>
                  <strong>{risk.title}</strong>
                  <p style={{ color: 'var(--del-muted)', marginBottom: 0 }}>{risk.mitigation}</p>
                </div>
              ))}
            </section>
          </aside>
        </div>

        <footer className="del-footer">
          {model.provenance.disclaimer} · Seed spec {model.provenance.seedSpecVersion} · {model.provenance.contentState.replace(/_/g, ' ')}.
        </footer>
      </div>
    </main>
  );
}

function SidebarPanel({ title, links }: { title: string; links: DeliverableRouteLink[] }) {
  if (links.length === 0) return null;
  return (
    <section className="del-panel">
      <div className="del-eyebrow">{title}</div>
      <div className="del-link-list" style={{ marginTop: 12 }}>
        {links.map((link) => (
          <Link className="del-link-card" key={`${link.className}-${link.href}-${link.title}`} href={link.href}>
            <span>{link.label}</span>
            {link.title}
            {link.description ? <small>{link.description}</small> : null}
          </Link>
        ))}
      </div>
    </section>
  );
}

function linksByClass(modelLinks: DeliverableRouteLink[], className: DeliverableRouteLink['className']): DeliverableRouteLink[] {
  return modelLinks.filter((link) => link.className === className);
}

function InlineSignalChart() {
  return (
    <svg role="img" aria-label="Seed evidence confidence trend" viewBox="0 0 760 220" style={{ width: '100%', height: 'auto' }}>
      <defs>
        <linearGradient id="delChartFill" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#0e9f8c" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#a96f00" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="760" height="220" rx="22" fill="#f2eadc" />
      <path d="M46 166 C124 118 174 138 232 92 C304 36 362 110 434 74 C504 38 554 104 620 74 C666 52 694 56 720 42" fill="none" stroke="#0e9f8c" strokeWidth="5" />
      <path d="M46 166 C124 118 174 138 232 92 C304 36 362 110 434 74 C504 38 554 104 620 74 C666 52 694 56 720 42 L720 188 L46 188 Z" fill="url(#delChartFill)" />
      {[46, 232, 434, 620, 720].map((x, index) => (
        <circle key={x} cx={x} cy={[166, 92, 74, 74, 42][index]} r="7" fill="#fffdf8" stroke="#0e9f8c" strokeWidth="4" />
      ))}
      <text x="46" y="204" fill="#6d625a" fontFamily="JetBrains Mono, monospace" fontSize="12">
        Evidence confidence by phase
      </text>
    </svg>
  );
}
