import Link from 'next/link';
import { deliverableToneColor, type DeliverableRenderModel, type DeliverableRouteLink } from '@/lib/deliverables/render-contract';

export function OutlineDeliverable({ model }: { model: DeliverableRenderModel }) {
  const breadcrumbs = model.crossLinks.filter((link) => link.className === 'breadcrumb');
  const evidence = model.crossLinks.filter((link) => link.className === 'evidence');
  const navigation = model.crossLinks.filter((link) =>
    ['program_overview', 'phase_summary', 'previous_next', 'source_pattern', 'related_deliverable'].includes(link.className),
  );

  return (
    <main className="del-page">
      <div className="del-shell">
        <header>
          <nav className="del-breadcrumbs" aria-label="Deliverable breadcrumbs">
            {breadcrumbs.map((link) => (
              <Link href={link.href} key={`${link.label}-${link.href}`}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="del-topline" style={{ marginTop: 30 }}>
            {model.tenant.name} · {model.program.code} · Outline deliverable
          </div>
          <h1 className="del-title">{model.deliverable.title}</h1>
          <p className="del-summary">{model.summary}</p>
        </header>

        <section className="del-kpi-grid" aria-label="Outline deliverable data elements">
          {model.kpis.slice(0, 4).map((kpi) => (
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
              <h2>Draft artifact with scoped evidence.</h2>
              <p>{model.summary}</p>
            </section>

            {model.sections.slice(0, 4).map((section) => (
              <section className="del-section" key={section.id}>
                <div className="del-eyebrow">{section.label}</div>
                <h2>{section.title}</h2>
                <p>{section.body.replace(/\n- .*/gs, '').trim() || section.body}</p>
                {section.bullets && section.bullets.length > 0 ? (
                  <ul>
                    {section.bullets.slice(0, 5).map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}

            <section className="del-section">
              <div className="del-eyebrow">Data Element</div>
              <table className="del-table">
                <thead>
                  <tr>
                    {model.table.columns.map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {model.table.rows.slice(0, 4).map((row, index) => (
                    <tr key={`${row[0]}-${index}`}>
                      {row.map((cell) => (
                        <td key={`${row[0]}-${cell}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </article>

          <aside className="del-sidebar">
            <LinkPanel title="Navigation" links={navigation.slice(0, 8)} />
            <LinkPanel title="Evidence" links={evidence} />
            <section className="del-panel">
              <div className="del-eyebrow">Promotion Rule</div>
              <p style={{ color: 'var(--del-muted)', lineHeight: 1.65 }}>
                This Outline can become Rich after sponsor evidence resolves the open decision utility and quality score checks.
              </p>
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

function LinkPanel({ title, links }: { title: string; links: DeliverableRouteLink[] }) {
  if (links.length === 0) return null;
  return (
    <section className="del-panel">
      <div className="del-eyebrow">{title}</div>
      <div className="del-link-list" style={{ marginTop: 12 }}>
        {links.map((link) => (
          <Link className="del-link-card" href={link.href} key={`${link.href}-${link.label}`}>
            <span>{link.label}</span>
            {link.title}
            {link.description ? <small>{link.description}</small> : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
