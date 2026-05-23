import type { Metadata } from 'next';
import Link from 'next/link';
import { PaperContainer } from '@/components/public-site/PaperContainer';
import { buildPageMetadata } from '@/lib/public-site/seo-defaults';

export const metadata: Metadata = buildPageMetadata({
  title: 'IT Productivity: generic LLM vs AbarVa Sentinel',
  description:
    'A side-by-side comparison of a generic IT-productivity answer and an AbarVa Sentinel answer grounded in Apex Retail context, citations, dissent, Move workflow, and audit.',
});

const sameQuestion =
  'How do I improve productivity of IT resources by leveraging AI-powered SDLC and product development lifecycle tools?';

const genericBullets = [
  'Adopt AI coding assistants for developers and expand prompt training.',
  'Automate testing, documentation, incident summaries, and code review support.',
  'Measure productivity with DORA metrics, cycle time, and developer satisfaction.',
  'Run pilots before enterprise rollout and standardize approved tools.',
  'Create governance for data leakage, IP protection, and security review.',
];

const sentinelCards = [
  {
    title: 'Clarify the outcome',
    body:
      'Apex should choose one primary KPI before tool rollout: DORA delta, release capacity, Run-cost takeout, or value reallocation. The answer changes by KPI.',
    citation: 'Apex org_topology v1 + P-IT-13 Alignment-as-prerequisite',
  },
  {
    title: 'Segment the portfolio',
    body:
      'Use TIME x AI-fit across 100 Apex applications. Invest cells receive AI SDLC tooling; eliminate cells receive migration/sunset planning first.',
    citation: 'application_portfolio v1 + P-IT-02 TIME x AI-fit',
  },
  {
    title: 'Baseline before rollout',
    body:
      'Run a 4-6 week DORA, SPACE, DevEx, and tool-footprint baseline. Do not let pilot anecdotes become the value case.',
    citation: 'dora_baselines v1 + P-IT-14 Baseline-before-rollout',
  },
  {
    title: 'Shape the Move',
    body:
      'Instantiate IT-Productivity as a 9-gate Strategic Move with Wave 0 charter, sibling dependency check, discovery, baseline, diagnose, TOM, tooling, business case, mobilize, and operate.',
    citation: 'move_template ai-enabled-it-productivity-program@v1',
  },
  {
    title: 'Show dissent',
    body:
      'Apex should not assume senior engineers get faster on familiar codebases. The answer includes the METR slowdown finding and a kill criterion for productivity reversal.',
    citation: 'P-IT-07 METR senior slowdown + P-IT-11 Copilot-vs-METR contradiction',
  },
  {
    title: 'Connect Source',
    body:
      'AMS Optimization stays a Source workflow, not a productivity gate. Vendor concentration, leakage, and outcome-based clauses are diagnosed separately and inform the Move DAG.',
    citation: 'P-SRC-01 AMS reshape playbook + SourceWorkflow ams-portfolio-optimization@v1',
  },
];

const proofRows = [
  {
    label: 'Citation density',
    generic: '2 general categories; no tenant evidence pointers.',
    sentinel: '6 tenant/corpus/template references in the first answer, version pinned.',
  },
  {
    label: 'Dissent presence',
    generic: 'Cautions are generic security and change-management caveats.',
    sentinel: 'Named dissent: ghost productivity, tool sprawl, METR slowdown, and reallocation gap.',
  },
  {
    label: 'Move workflow',
    generic: 'Pilot recommendation, no durable execution object.',
    sentinel: 'One-click Shape Moves creates the IT-Productivity Move, 5 sibling Moves, and AMS Source workflow edges.',
  },
  {
    label: 'Version-pinned audit',
    generic: 'No audit artifact beyond the chat transcript.',
    sentinel: 'Answer pins corpus, template, tenant context, egress audit id, and reasoning trace.',
  },
];

export default function ITProductivityComparisonPage() {
  return (
    <div className="p13-comparison-page">
      <style>{`
        .p13-comparison-page {
          background: var(--pub-paper);
          min-height: 100vh;
          padding-top: 56px;
          color: var(--pub-ink);
        }
        .p13-hero {
          border-bottom: 1px solid var(--pub-rule);
          padding: 80px 0 56px;
        }
        .p13-eyebrow {
          font-family: var(--pub-font-mono);
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--pub-stone);
          margin-bottom: 14px;
        }
        .p13-title {
          font-family: var(--pub-font-serif);
          font-size: 52px;
          font-weight: 500;
          line-height: 1.06;
          letter-spacing: 0;
          max-width: 900px;
          margin-bottom: 20px;
        }
        .p13-subtitle {
          font-size: 18px;
          line-height: 1.6;
          color: var(--pub-slate);
          max-width: 720px;
        }
        .p13-question {
          margin-top: 30px;
          border: 1px solid var(--pub-rule);
          border-radius: 8px;
          padding: 18px 20px;
          background: rgba(255, 255, 255, 0.42);
          font-size: 16px;
          line-height: 1.55;
        }
        .p13-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
        }
        .p13-section {
          padding: 56px 0;
          border-bottom: 1px solid var(--pub-rule);
        }
        .p13-column {
          border: 1px solid var(--pub-rule);
          border-radius: 8px;
          padding: 24px;
          background: rgba(255, 255, 255, 0.38);
        }
        .p13-column--sentinel {
          background: rgba(0, 102, 204, 0.06);
          border-color: rgba(0, 102, 204, 0.24);
        }
        .p13-column h2,
        .p13-section h2 {
          font-family: var(--pub-font-serif);
          font-size: 28px;
          font-weight: 500;
          letter-spacing: 0;
          margin-bottom: 12px;
        }
        .p13-muted {
          color: var(--pub-slate);
          font-size: 14px;
          line-height: 1.55;
          margin-bottom: 18px;
        }
        .p13-list {
          display: grid;
          gap: 12px;
          list-style: none;
        }
        .p13-list li {
          border-top: 1px solid var(--pub-rule);
          padding-top: 12px;
          color: var(--pub-slate);
          font-size: 14px;
          line-height: 1.55;
        }
        .p13-card-list {
          display: grid;
          gap: 12px;
          list-style: none;
        }
        .p13-card {
          border: 1px solid var(--pub-rule);
          border-radius: 8px;
          padding: 14px;
          background: rgba(255, 255, 255, 0.42);
        }
        .p13-card h3 {
          font-family: var(--pub-font-mono);
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .p13-card p {
          color: var(--pub-slate);
          font-size: 14px;
          line-height: 1.55;
        }
        .p13-citation {
          display: block;
          margin-top: 8px;
          color: var(--pub-signal);
          font-family: var(--pub-font-mono);
          font-size: 11px;
          line-height: 1.45;
        }
        .p13-proof-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 14px;
        }
        .p13-proof-table th,
        .p13-proof-table td {
          border-bottom: 1px solid var(--pub-rule);
          padding: 14px 12px;
          vertical-align: top;
          text-align: left;
        }
        .p13-proof-table th {
          font-family: var(--pub-font-mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--pub-stone);
        }
        .p13-egress {
          border: 1px solid rgba(0, 102, 204, 0.28);
          border-radius: 8px;
          padding: 22px;
          background: rgba(0, 102, 204, 0.07);
        }
        .p13-egress strong {
          color: var(--pub-ink);
        }
        .p13-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 22px;
        }
        .p13-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 40px;
          border-radius: 6px;
          padding: 0 16px;
          font-weight: 600;
          text-decoration: none;
          border: 1px solid var(--pub-ink);
          color: var(--pub-ink);
        }
        .p13-button--primary {
          background: var(--pub-ink);
          color: var(--pub-paper);
        }
        @media (max-width: 820px) {
          .p13-title { font-size: 38px; }
          .p13-grid { grid-template-columns: 1fr; }
          .p13-proof-table { display: block; overflow-x: auto; }
        }
      `}</style>

      <section className="p13-hero">
        <PaperContainer>
          <p className="p13-eyebrow">How it works / IT Productivity</p>
          <h1 className="p13-title">Same CTO question. Different operating answer.</h1>
          <p className="p13-subtitle">
            The public comparison uses cached content only. It shows why AbarVa Sentinel is more
            than a model response: it carries tenant context, dissent, workflow shape, and an audit
            trail the executive team can govern.
          </p>
          <div className="p13-question">
            <strong>Same question:</strong> {sameQuestion}
          </div>
        </PaperContainer>
      </section>

      <section className="p13-section">
        <PaperContainer>
          <div className="p13-grid">
            <article className="p13-column">
              <p className="p13-eyebrow">Cached generic LLM baseline</p>
              <h2>Good advice, weak operating memory.</h2>
              <p className="p13-muted">
                This column is a cached, model-shaped baseline without Apex context, corpus
                grounding, Move templates, Source workflows, or tenant egress policy. No provider
                call runs on page load.
              </p>
              <ul className="p13-list">
                {genericBullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>

            <article className="p13-column p13-column--sentinel">
              <p className="p13-eyebrow">AbarVa Sentinel answer</p>
              <h2>Tenant-grounded judgment with a workflow behind it.</h2>
              <p className="p13-muted">
                Sentinel answers as an Apex CTO advisor: it cites client evidence, version-pinned
                corpus patterns, Move templates, Source workflows, dissent, and the next executable
                step.
              </p>
              <ul className="p13-card-list">
                {sentinelCards.map((card) => (
                  <li key={card.title} className="p13-card">
                    <h3>{card.title}</h3>
                    <p>{card.body}</p>
                    <span className="p13-citation">{card.citation}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </PaperContainer>
      </section>

      <section className="p13-section">
        <PaperContainer>
          <p className="p13-eyebrow">Visible proof</p>
          <h2>What the demo should make obvious.</h2>
          <table className="p13-proof-table">
            <thead>
              <tr>
                <th>Signal</th>
                <th>Generic LLM answer</th>
                <th>AbarVa Sentinel answer</th>
              </tr>
            </thead>
            <tbody>
              {proofRows.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.generic}</td>
                  <td>{row.sentinel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </PaperContainer>
      </section>

      <section className="p13-section">
        <PaperContainer>
          <div className="p13-egress">
            <p className="p13-eyebrow">AI Egress Control Plane</p>
            <h2>Every model call is governed before it leaves the tenant boundary.</h2>
            <p className="p13-muted">
              <strong>
                Every model call governed by tenant policy, classified by data sensitivity, redacted
                as needed, logged for audit.
              </strong>{' '}
              The live application routes LLM work through <code>callModel(...)</code>, policy checks
              <code> clients.ai_policy</code>, and synchronous <code>ai_egress_audit</code> writes.
              This comparison page does not introduce a new model call site.
            </p>
            <div className="p13-actions">
              <Link className="p13-button p13-button--primary" href="/how-it-works/frameworks/ai-it-productivity/">
                Read the public framework
              </Link>
              <Link className="p13-button" href="/sign-in">
                Full corpus - login required
              </Link>
            </div>
          </div>
        </PaperContainer>
      </section>
    </div>
  );
}
