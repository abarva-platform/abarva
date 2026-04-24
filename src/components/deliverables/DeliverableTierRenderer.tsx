import Link from 'next/link';
import type { ReactNode } from 'react';
import { deliverableToneColor, type DeliverableRenderModel, type DeliverableRouteLink } from '@/lib/deliverables/render-contract';
import { RICH_DELIVERABLE_DEMO_DISCLAIMER } from '@/lib/integrity/disclaimers';
import { ExportActions } from './ExportActions';
import { ApproveActions } from './ApproveActions';
import { EvidenceChipList } from './EvidenceChipList';
import { SponsorCommitmentForm } from '@/components/workflow/SponsorCommitmentForm';
import type { SponsorCommitmentRecord } from '@/lib/workflow/sponsorCommitment';
import { D02StakeholderSuccessSection } from './D02StakeholderSuccessSection';
import { D04TensionSection } from './D04TensionSection';
import type { ProgramTensionRecord, StakeholderSuccessRecord } from '@/lib/workflow/stakeholderSuccess';

interface DeliverableTierRendererProps {
  model: DeliverableRenderModel;
  /**
   * FM-03 · D01 Program Charter · existing sponsor commitment record.
   */
  sponsorCommitment?: SponsorCommitmentRecord | null;
  /**
   * FM-04 · D02 Stakeholder Map · existing success records for the program.
   */
  stakeholderSuccessRecords?: StakeholderSuccessRecord[];
  /**
   * FM-04 · D04 Intake Synthesis · existing tension records for the program.
   */
  programTensionRecords?: ProgramTensionRecord[];
}

export function DeliverableTierRenderer({
  model,
  sponsorCommitment,
  stakeholderSuccessRecords,
  programTensionRecords,
}: DeliverableTierRendererProps) {
  const isCharter = model.deliverable.code === 'D01' || model.deliverable.typeKey === 'program_charter';
  const isStakeholderMap = model.deliverable.code === 'D02' || model.deliverable.typeKey === 'stakeholder_map';
  const isIntakeSynthesis = model.deliverable.code === 'D04' || model.deliverable.typeKey === 'intake_synthesis';
  return (
    <main className="del-page">
      <DeliverablePageStyles />
      <div className="del-shell">
        {model.deliverable.tier === 'stub' ? <StubBody model={model} /> : model.deliverable.tier === 'outline' ? <OutlineBody model={model} /> : <RichBody model={model} />}
        {isCharter ? (
          <section style={{ marginTop: 32 }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#0E9F8C', fontWeight: 700 }}>
                Phase 1 → 2 gate requirement · FM-03
              </div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 24, letterSpacing: '-0.015em', margin: '8px 0 0', color: '#1a1612' }}>
                Sponsor commitment
              </h2>
            </div>
            <SponsorCommitmentForm programCode={model.program.code} existing={sponsorCommitment ?? null} />
          </section>
        ) : null}
        {isStakeholderMap ? (
          <D02StakeholderSuccessSection programCode={model.program.code} existing={stakeholderSuccessRecords ?? []} />
        ) : null}
        {isIntakeSynthesis ? (
          <D04TensionSection programCode={model.program.code} existing={programTensionRecords ?? []} />
        ) : null}
        <footer className="del-footer">
          {model.provenance.disclaimer} · Seed spec {model.provenance.seedSpecVersion} · {model.provenance.contentState.replace(/_/g, ' ')}.
          {model.deliverable.tier === 'rich' ? ` ${RICH_DELIVERABLE_DEMO_DISCLAIMER}` : ''}
        </footer>
      </div>
    </main>
  );
}

export function DeliverablePageStyles() {
  return (
    <style>{`
      :root {
        --del-bg: #f6f1e8;
        --del-panel: #fffdf8;
        --del-ink: #171411;
        --del-muted: #6d625a;
        --del-line: rgba(23, 20, 17, 0.12);
        --del-teal: #0e9f8c;
        --del-amber: #a96f00;
        --del-red: #b5452f;
        --del-serif: Georgia, 'Times New Roman', serif;
        --del-sans: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        --del-mono: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;
      }
      .del-page { min-height: 100vh; background: radial-gradient(circle at 8% 4%, rgba(14,159,140,.13), transparent 30rem), radial-gradient(circle at 92% 6%, rgba(169,111,0,.12), transparent 30rem), var(--del-bg); color: var(--del-ink); font-family: var(--del-sans); padding: clamp(32px, 5vw, 72px) clamp(20px, 5vw, 76px); }
      .del-shell { width: min(100%, 1360px); margin: 0 auto; }
      .del-topline, .del-eyebrow { font-family: var(--del-mono); text-transform: uppercase; letter-spacing: .16em; color: var(--del-teal); font-size: 11px; line-height: 1.4; }
      .del-title { font-family: var(--del-serif); letter-spacing: -.035em; font-weight: 700; line-height: .98; margin: 14px 0 0; font-size: clamp(44px, 6vw, 84px); max-width: 1020px; }
      .del-summary { font-size: clamp(18px, 1.7vw, 23px); line-height: 1.55; color: var(--del-muted); max-width: 860px; margin: 20px 0 0; }
      .del-breadcrumbs, .del-pill-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
      .del-breadcrumbs a, .del-pill, .del-link-card { border: 1px solid var(--del-line); border-radius: 999px; padding: 8px 12px; color: var(--del-ink); text-decoration: none; background: rgba(255,255,255,.56); font-family: var(--del-mono); font-size: 11px; letter-spacing: .08em; }
      .del-pill[data-tone='teal'] { color: var(--del-teal); border-color: rgba(14,159,140,.3); background: rgba(14,159,140,.12); }
      .del-pill[data-tone='amber'] { color: var(--del-amber); border-color: rgba(169,111,0,.3); background: rgba(169,111,0,.12); }
      .del-panel { background: rgba(255,253,248,.88); border: 1px solid var(--del-line); border-radius: 28px; box-shadow: 0 24px 72px rgba(38,30,22,.12); padding: clamp(22px, 3vw, 34px); }
      .del-dark-band { background: radial-gradient(circle at 18% 4%, rgba(14,159,140,.18), transparent 26rem), linear-gradient(145deg, #111816, #17211f); color: #fffaf0; border-radius: 34px; padding: clamp(26px,4vw,44px); margin-top: 36px; box-shadow: 0 28px 70px rgba(17,24,22,.22); }
      .del-main-grid, .del-header-grid { display: grid; grid-template-columns: minmax(0,1fr) 360px; gap: 28px; margin-top: 28px; align-items: start; }
      .del-section { border-top: 1px solid var(--del-line); padding-top: 24px; margin-top: 24px; }
      .del-section:first-child { border-top: 0; padding-top: 0; margin-top: 0; }
      .del-section h2, .del-section h3 { font-family: var(--del-serif); letter-spacing: -.025em; line-height: 1.05; margin: 0 0 12px; }
      .del-section h2 { font-size: clamp(28px,3vw,44px); }
      .del-section h3 { font-size: 24px; }
      .del-section p, .del-section li { color: var(--del-muted); font-size: 16px; line-height: 1.7; }
      .del-kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border: 1px solid var(--del-line); border-radius: 24px; overflow: hidden; background: var(--del-panel); margin-top: 32px; }
      .del-kpi { padding: 20px; border-right: 1px solid var(--del-line); }
      .del-kpi:last-child { border-right: 0; }
      .del-kpi strong { display: block; font-family: var(--del-serif); font-size: clamp(30px,3.5vw,48px); line-height: .95; letter-spacing: -.04em; margin: 8px 0; }
      .del-table { width: 100%; border-collapse: collapse; border-radius: 18px; overflow: hidden; }
      .del-table th, .del-table td { text-align: left; border-bottom: 1px solid var(--del-line); padding: 14px 12px; vertical-align: top; }
      .del-table th { font-family: var(--del-mono); color: var(--del-muted); font-size: 11px; letter-spacing: .12em; text-transform: uppercase; }
      .del-table tr[data-highlight='true'] td { background: rgba(14,159,140,.1); }
      .del-sidebar { position: sticky; top: 24px; display: flex; flex-direction: column; gap: 16px; }
      .del-link-list { display: flex; flex-direction: column; gap: 8px; }
      .del-link-card { display: block; border-radius: 16px; padding: 12px; font-family: var(--del-sans); letter-spacing: normal; }
      .del-link-card span { display: block; color: var(--del-teal); font-family: var(--del-mono); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; margin-bottom: 4px; }
      .del-link-card small { display: block; color: var(--del-muted); font-size: 12px; line-height: 1.45; margin-top: 4px; }
      .del-status-list { display: grid; gap: 10px; }
      .del-status-item { border: 1px solid var(--del-line); border-radius: 18px; padding: 14px; background: rgba(255,253,248,.72); }
      .del-status-item[data-state='not_yet'] { border-color: rgba(169,111,0,.3); background: rgba(169,111,0,.12); }
      .del-footer { margin-top: 36px; padding-top: 18px; border-top: 1px solid var(--del-line); color: var(--del-muted); font-size: 13px; line-height: 1.6; }
      @media (max-width: 980px) { .del-header-grid, .del-main-grid { grid-template-columns: 1fr; } .del-sidebar { position: static; } .del-kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 640px) { .del-page { padding: 24px 14px; } .del-title { font-size: 42px; } .del-kpi-grid { grid-template-columns: 1fr; } .del-kpi { border-right: 0; border-bottom: 1px solid var(--del-line); } }
      @media print { .del-page { background: #fff; color: #111; padding: 0; } .del-shell { width: 100%; } .del-sidebar, .del-breadcrumbs { display: none; } .del-main-grid, .del-header-grid { display: block; } .del-panel, .del-dark-band { box-shadow: none; border-color: #ccc; break-inside: avoid; } }
    `}</style>
  );
}

function RichBody({ model }: { model: DeliverableRenderModel }) {
  return (
    <>
      <Header model={model} label="Rich deliverable" />
      <KpiGrid model={model} />
      <div className="del-main-grid">
        <article className="del-panel">
          <Section label="Executive Summary" title={model.deliverable.title}>
            <p>{model.summary}</p>
          </Section>
          <EvidenceTable model={model} />
          <EvidenceAnchors model={model} />
          <Section label="Signal Chart" title="Evidence confidence by phase">
            <InlineSignalChart />
          </Section>
          {model.sections.map((section) => (
            <Section key={section.id} label={section.label} title={section.title}>
              <p>{stripBullets(section.body)}</p>
              {section.bullets?.length ? <ul>{section.bullets.slice(0, 6).map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
            </Section>
          ))}
          <Section label="Decision Log" title="Sponsor decisions">
            {model.decisions.map((decision) => (
              <div key={`${decision.date}-${decision.summary}`}>
                <h3>{decision.summary}</h3>
                <p>{decision.date} · {decision.detail}</p>
              </div>
            ))}
          </Section>
        </article>
        <aside className="del-sidebar">
          <LinkPanel title="Cross Links" links={model.crossLinks.filter((link) => link.className !== 'breadcrumb' && link.className !== 'evidence').slice(0, 10)} />
          <LinkPanel title="Evidence Citations" links={model.crossLinks.filter((link) => link.className === 'evidence')} />
          <section className="del-panel">
            <div className="del-eyebrow">Risk Register</div>
            {model.risks.map((risk) => (
              <div className="del-status-item" key={risk.title} style={{ marginTop: 10 }}>
                <div className="del-eyebrow" style={{ color: risk.level === 'High' ? 'var(--del-red)' : 'var(--del-amber)' }}>{risk.level}</div>
                <strong>{risk.title}</strong>
                <p style={{ color: 'var(--del-muted)', marginBottom: 0 }}>{risk.mitigation}</p>
              </div>
            ))}
          </section>
        </aside>
      </div>
    </>
  );
}

function OutlineBody({ model }: { model: DeliverableRenderModel }) {
  return (
    <>
      <Header model={model} label="Outline deliverable" />
      <KpiGrid model={model} />
      <div className="del-main-grid">
        <article className="del-panel">
          <Section label="Executive Summary" title="Draft artifact with scoped evidence.">
            <p>{model.summary}</p>
          </Section>
          {model.sections.slice(0, 4).map((section) => (
            <Section key={section.id} label={section.label} title={section.title}>
              <p>{stripBullets(section.body)}</p>
              {section.bullets?.length ? <ul>{section.bullets.slice(0, 5).map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
            </Section>
          ))}
          <EvidenceTable model={model} />
          <EvidenceAnchors model={model} />
        </article>
        <aside className="del-sidebar">
          <LinkPanel title="Navigation" links={model.crossLinks.filter((link) => link.className !== 'breadcrumb').slice(0, 8)} />
          <section className="del-panel">
            <div className="del-eyebrow">Promotion Rule</div>
            <p style={{ color: 'var(--del-muted)', lineHeight: 1.65 }}>This Outline can become Rich after sponsor evidence resolves open decision utility and quality score checks.</p>
          </section>
        </aside>
      </div>
    </>
  );
}

function StubBody({ model }: { model: DeliverableRenderModel }) {
  return (
    <>
      <Header model={model} label="Scheduled stub" />
      <div className="del-dark-band">
        <div className="del-eyebrow">Activation Conditions</div>
        <div className="del-status-list" style={{ marginTop: 16 }}>
          {model.triggerConditions.map((condition) => (
            <div className="del-status-item" data-state={condition.state} key={condition.title}>
              <div className="del-eyebrow" style={{ color: condition.state === 'not_yet' ? 'var(--del-amber)' : 'var(--del-teal)' }}>{condition.state.replace(/_/g, ' ')}</div>
              <strong>{condition.title}</strong>
              <p style={{ color: 'var(--del-muted)', marginBottom: 0, lineHeight: 1.6 }}>{condition.detail}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="del-main-grid">
        <article className="del-panel">
          <Section label="Structure Preview" title="What will appear when this deliverable activates.">
            <ul>{model.structurePreview.map((item) => <li key={item}>{item}</li>)}</ul>
          </Section>
          <Section label="Prerequisites" title="Preserved context">
            <div className="del-link-list">{model.prerequisites.map((link) => <RouteLink key={`${link.href}-${link.label}`} link={link} />)}</div>
          </Section>
        </article>
        <aside className="del-sidebar">
          <LinkPanel title="Preserved Cross-Links" links={model.crossLinks.filter((link) => link.className !== 'breadcrumb').slice(0, 10)} />
        </aside>
      </div>
    </>
  );
}

function Header({ model, label }: { model: DeliverableRenderModel; label: string }) {
  const breadcrumbs = model.crossLinks.filter((link) => link.className === 'breadcrumb');
  return (
    <header className="del-header-grid">
      <div>
        <nav className="del-breadcrumbs" aria-label="Deliverable breadcrumbs">
          {breadcrumbs.map((link) => <Link href={link.href} key={`${link.label}-${link.href}`}>{link.label}</Link>)}
        </nav>
        <div className="del-topline" style={{ marginTop: 30 }}>{model.tenant.name} · {model.program.code} · {label}</div>
        <h1 className="del-title">{model.deliverable.title}</h1>
        <p className="del-summary">{model.summary}</p>
        <div className="del-pill-row" style={{ marginTop: 22 }}>
          <span className="del-pill" data-tone="teal">Phase {model.phase.spec} · {model.phase.name}</span>
          <span className="del-pill" data-tone={model.deliverable.tier === 'stub' ? 'amber' : 'teal'}>{model.deliverable.tier.toUpperCase()}</span>
          <span className="del-pill" data-tone="amber">Composite disclaimer active</span>
        </div>
        {model.deliverable.tier !== 'stub' ? (
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <ExportActions deliverableCode={model.deliverable.code} title={model.deliverable.title} />
            {model.deliverable.tier === 'rich' ? (
              <ApproveActions
                programCode={model.program.code}
                deliverableCode={model.deliverable.code}
                phase={model.phase.spec}
                decision={model.deliverable.title}
              />
            ) : null}
          </div>
        ) : null}
      </div>
      <aside className="del-panel">
        <div className="del-eyebrow">Render Contract</div>
        <h2 style={{ fontFamily: 'var(--del-serif)', fontSize: 30, lineHeight: 1.05, letterSpacing: '-0.03em', margin: '12px 0' }}>{label}</h2>
        <p style={{ color: 'var(--del-muted)', lineHeight: 1.65, margin: 0 }}>Tier-specific rendering is driven by the seeded deliverable tier, not by a generic fallback template.</p>
      </aside>
    </header>
  );
}

function KpiGrid({ model }: { model: DeliverableRenderModel }) {
  return (
    <section className="del-kpi-grid" aria-label="Deliverable KPI strip">
      {model.kpis.map((kpi) => (
        <div className="del-kpi" key={kpi.label}>
          <div className="del-eyebrow">{kpi.label}</div>
          <strong style={{ color: deliverableToneColor(kpi.tone) }}>{kpi.value}</strong>
          <div style={{ color: 'var(--del-muted)', fontSize: 14 }}>{kpi.detail}</div>
        </div>
      ))}
    </section>
  );
}

function Section({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return (
    <section className="del-section">
      <div className="del-eyebrow">{label}</div>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function EvidenceTable({ model }: { model: DeliverableRenderModel }) {
  return (
    <Section label="Evidence Table" title="Tenant-bound evidence basis">
      <table className="del-table">
        <thead><tr>{model.table.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>
          {model.table.rows.map((row, rowIndex) => {
            const rowKey = typeof row[0] === 'string' ? row[0] : row[0]?.text ?? '';
            return (
              <tr key={`${rowKey}-${rowIndex}`} data-highlight={model.table.highlightedRows?.includes(rowIndex) ? 'true' : 'false'}>
                {row.map((cell, cellIndex) => {
                  // C2-14 · cells can be plain strings (legacy) or `{text, href}`
                  // objects for linked values. Pattern + Program cells now render
                  // as clickable links from the deliverable back to their canonical
                  // surfaces.
                  if (typeof cell === 'string') {
                    return <td key={`${rowKey}-${cellIndex}`}>{cell}</td>;
                  }
                  if (cell.href) {
                    return (
                      <td key={`${rowKey}-${cellIndex}`}>
                        <Link href={cell.href} style={{ color: 'var(--del-teal)', textDecoration: 'underline' }}>
                          {cell.text}
                        </Link>
                      </td>
                    );
                  }
                  return <td key={`${rowKey}-${cellIndex}`}>{cell.text}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </Section>
  );
}

function EvidenceAnchors({ model }: { model: DeliverableRenderModel }) {
  return (
    <Section label="Evidence Citations" title="Source references">
      <EvidenceChipList
        items={model.evidence.map((ref) => ({
          id: ref.id,
          label: ref.label,
          kind: ref.kind,
          href: ref.href,
          source: ref.source,
          reference: ref.reference,
          confidence: ref.confidence,
        }))}
        programCode={model.program.code}
        deliverableCode={model.deliverable.code}
      />
    </Section>
  );
}

function LinkPanel({ title, links }: { title: string; links: DeliverableRouteLink[] }) {
  if (links.length === 0) return null;
  return (
    <section className="del-panel">
      <div className="del-eyebrow">{title}</div>
      <div className="del-link-list" style={{ marginTop: 12 }}>{links.map((link) => <RouteLink key={`${link.className}-${link.href}-${link.title}`} link={link} />)}</div>
    </section>
  );
}

function RouteLink({ link }: { link: DeliverableRouteLink }) {
  return (
    <Link className="del-link-card" href={link.href}>
      <span>{link.label}</span>
      {link.title}
      {link.description ? <small>{link.description}</small> : null}
    </Link>
  );
}

function InlineSignalChart() {
  const points = [
    [46, 166],
    [232, 92],
    [434, 74],
    [620, 74],
    [720, 42],
  ] as const;
  return (
    <svg role="img" aria-label="Seed evidence confidence trend" viewBox="0 0 760 220" style={{ width: '100%', height: 'auto' }}>
      <rect x="0" y="0" width="760" height="220" rx="22" fill="#f2eadc" />
      <path d="M46 166 C124 118 174 138 232 92 C304 36 362 110 434 74 C504 38 554 104 620 74 C666 52 694 56 720 42" fill="none" stroke="#0e9f8c" strokeWidth="5" />
      <path d="M46 166 C124 118 174 138 232 92 C304 36 362 110 434 74 C504 38 554 104 620 74 C666 52 694 56 720 42 L720 188 L46 188 Z" fill="rgba(14,159,140,.14)" />
      {points.map(([x, y]) => <circle key={x} cx={x} cy={y} r="7" fill="#fffdf8" stroke="#0e9f8c" strokeWidth="4" />)}
    </svg>
  );
}

function stripBullets(value: string): string {
  return value.replace(/\n- [\s\S]*/g, '').trim() || value;
}
