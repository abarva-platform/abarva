import Link from 'next/link';
import type { DeliverableRenderModel, DeliverableRouteLink } from '@/lib/deliverables/render-contract';

export function StubDeliverable({ model }: { model: DeliverableRenderModel }) {
  const breadcrumbs = model.crossLinks.filter((link) => link.className === 'breadcrumb');
  const preservedLinks = model.crossLinks.filter((link) =>
    ['program_overview', 'phase_summary', 'previous_next', 'related_deliverable', 'source_pattern'].includes(link.className),
  );

  return (
    <main className="del-page">
      <div className="del-shell">
        <header className="del-header-grid">
          <div>
            <nav className="del-breadcrumbs" aria-label="Deliverable breadcrumbs">
              {breadcrumbs.map((link) => (
                <Link href={link.href} key={`${link.label}-${link.href}`}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="del-topline" style={{ marginTop: 30 }}>
              {model.tenant.name} · {model.program.code} · Scheduled stub
            </div>
            <h1 className="del-title">{model.deliverable.title}</h1>
            <p className="del-summary">{model.summary}</p>
            <div className="del-pill-row" style={{ marginTop: 22 }}>
              <span className="del-pill" data-tone="amber">
                No future-state conclusions
              </span>
              <span className="del-pill" data-tone="teal">
                Navigation preserved
              </span>
            </div>
          </div>
          <aside className="del-panel">
            <div className="del-eyebrow">Scheduled Banner</div>
            <h2 style={{ fontFamily: 'var(--del-serif)', fontSize: 32, lineHeight: 1.05, letterSpacing: '-0.03em', margin: '12px 0' }}>
              This artifact unlocks after the gate clears.
            </h2>
            <p style={{ color: 'var(--del-muted)', lineHeight: 1.65, margin: 0 }}>
              The route exists, links resolve, and the page explains what will be generated without fabricating sponsor-approved content.
            </p>
          </aside>
        </header>

        <div className="del-dark-band">
          <div className="del-eyebrow">Activation Conditions</div>
          <div className="del-status-list" style={{ marginTop: 16 }}>
            {model.triggerConditions.map((condition) => (
              <div className="del-status-item" data-state={condition.state} key={condition.title}>
                <div className="del-eyebrow" style={{ color: condition.state === 'not_yet' ? 'var(--del-amber)' : 'var(--del-teal)' }}>
                  {condition.state.replace(/_/g, ' ')}
                </div>
                <strong>{condition.title}</strong>
                <p style={{ color: 'var(--del-muted)', marginBottom: 0, lineHeight: 1.6 }}>{condition.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="del-main-grid">
          <article className="del-panel">
            <section className="del-section">
              <div className="del-eyebrow">Structure Preview</div>
              <h2>What will appear here when this deliverable activates.</h2>
              <ul>
                {model.structurePreview.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="del-section">
              <div className="del-eyebrow">Prerequisites</div>
              {model.prerequisites.length > 0 ? (
                <div className="del-link-list">
                  {model.prerequisites.map((link) => (
                    <Link className="del-link-card" href={link.href} key={`${link.href}-${link.label}`}>
                      <span>{link.label}</span>
                      {link.title}
                      {link.description ? <small>{link.description}</small> : null}
                    </Link>
                  ))}
                </div>
              ) : (
                <p>No prerequisite deliverables are required before this scheduled artifact.</p>
              )}
            </section>
          </article>

          <aside className="del-sidebar">
            <LinkPanel title="Preserved Cross-Links" links={preservedLinks.slice(0, 10)} />
            <section className="del-panel">
              <div className="del-eyebrow">Integrity Rule</div>
              <p style={{ color: 'var(--del-muted)', lineHeight: 1.65 }}>
                Stub pages must be navigable, explicit, and honest: no placeholder fluff, no fake outcomes, and no broken Phase 5 click paths.
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
