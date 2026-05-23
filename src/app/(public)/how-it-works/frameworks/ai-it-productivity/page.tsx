import type { Metadata } from 'next';
import Link from 'next/link';
import { PaperContainer } from '@/components/public-site/PaperContainer';
import { buildPageMetadata } from '@/lib/public-site/seo-defaults';

export const metadata: Metadata = buildPageMetadata({
  title: 'AI IT Productivity Decision Framework',
  description:
    'A publishable subset of the AbarVa IT-productivity framework: six patterns for CTOs evaluating AI-enabled SDLC and product-development productivity.',
});

const headlinePatterns = [
  {
    id: 'P-IT-01',
    title: 'Run, Grow, Transform split',
    body:
      'AI productivity lift lands differently by spend bucket. Run work needs cost and reliability discipline; Grow work needs flow and release capacity; Transform work needs portfolio sequencing.',
  },
  {
    id: 'P-IT-02',
    title: 'TIME x AI-fit beats tool rollout',
    body:
      'The right unit of analysis is the application portfolio cell, not the developer seat. Tolerate, Invest, Migrate, and Eliminate apps should not receive the same AI tooling strategy.',
  },
  {
    id: 'P-IT-03',
    title: 'Productivity is not value',
    body:
      'Hours saved become enterprise value only when a named reallocation queue exists. Otherwise the benefit becomes ghost productivity.',
  },
  {
    id: 'P-IT-07',
    title: 'Senior slowdown dissent',
    body:
      'A credible AI SDLC program includes the dissenting evidence: senior engineers on familiar codebases may slow down unless workflow and task fit are designed deliberately.',
  },
  {
    id: 'P-IT-14',
    title: 'Baseline before rollout',
    body:
      'A 4-6 week DORA, SPACE, DevEx, and tool-footprint baseline prevents pilot anecdotes from turning into a weak enterprise business case.',
  },
  {
    id: 'P-SRC-01',
    title: 'AMS optimization is a sibling workflow',
    body:
      'Managed-services vendor portfolio optimization belongs in Source. It informs the productivity Move, but it has separate sponsors, evidence, contract levers, and cadence.',
  },
];

const workflowSteps = [
  'Ask the CTO question in Intelligence against Apex context.',
  'Receive six Sentinel cards with citations, dissent, and audit trail.',
  'Shape Moves into a 9-gate IT-Productivity Move plus sibling dependency DAG.',
  'Open the IT-Productivity Move and inspect value layers.',
  'Hand off AMS vendor portfolio diagnostic to Source.',
];

export default function AIITProductivityFrameworkPage() {
  return (
    <div className="p13-framework-page">
      <style>{`
        .p13-framework-page {
          background: var(--pub-paper);
          min-height: 100vh;
          padding-top: 56px;
          color: var(--pub-ink);
        }
        .p13-framework-hero {
          padding: 80px 0 56px;
          border-bottom: 1px solid var(--pub-rule);
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
        .p13-framework-section {
          padding: 56px 0;
          border-bottom: 1px solid var(--pub-rule);
        }
        .p13-framework-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-top: 26px;
        }
        .p13-pattern-card {
          border: 1px solid var(--pub-rule);
          border-radius: 8px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.38);
          min-height: 210px;
        }
        .p13-pattern-id {
          font-family: var(--pub-font-mono);
          font-size: 11px;
          color: var(--pub-signal);
          margin-bottom: 12px;
        }
        .p13-pattern-card h2 {
          font-family: var(--pub-font-serif);
          font-size: 24px;
          font-weight: 500;
          letter-spacing: 0;
          margin-bottom: 10px;
        }
        .p13-pattern-card p,
        .p13-copy {
          color: var(--pub-slate);
          font-size: 15px;
          line-height: 1.65;
        }
        .p13-workflow {
          display: grid;
          gap: 12px;
          margin-top: 22px;
          list-style: none;
          counter-reset: workflow;
        }
        .p13-workflow li {
          counter-increment: workflow;
          border: 1px solid var(--pub-rule);
          border-radius: 8px;
          padding: 16px 18px;
          background: rgba(255, 255, 255, 0.38);
          color: var(--pub-slate);
          display: grid;
          grid-template-columns: 42px 1fr;
          gap: 12px;
          align-items: start;
        }
        .p13-workflow li::before {
          content: counter(workflow, decimal-leading-zero);
          font-family: var(--pub-font-mono);
          font-size: 12px;
          color: var(--pub-stone);
          padding-top: 2px;
        }
        .p13-cta {
          border: 1px solid rgba(0, 102, 204, 0.28);
          border-radius: 8px;
          padding: 24px;
          background: rgba(0, 102, 204, 0.07);
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 24px;
          align-items: center;
        }
        .p13-cta h2 {
          font-family: var(--pub-font-serif);
          font-size: 30px;
          font-weight: 500;
          letter-spacing: 0;
          margin-bottom: 8px;
        }
        .p13-button {
          display: inline-flex;
          min-height: 42px;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          padding: 0 18px;
          background: var(--pub-ink);
          color: var(--pub-paper);
          font-weight: 600;
          text-decoration: none;
          white-space: nowrap;
        }
        .p13-button:hover {
          color: var(--pub-paper);
          text-decoration: none;
        }
        @media (max-width: 900px) {
          .p13-title { font-size: 38px; }
          .p13-framework-grid { grid-template-columns: 1fr; }
          .p13-cta { grid-template-columns: 1fr; }
        }
      `}</style>

      <section className="p13-framework-hero">
        <PaperContainer>
          <p className="p13-eyebrow">Public framework teaser</p>
          <h1 className="p13-title">AI IT productivity is a portfolio decision, not a seat rollout.</h1>
          <p className="p13-subtitle">
            This is the publishable subset of AbarVa&apos;s IT-productivity decision framework. The
            full corpus includes evidence chunks, counterarguments, vertical overlays, versioned
            templates, and tenant-specific calculations behind login.
          </p>
        </PaperContainer>
      </section>

      <section className="p13-framework-section">
        <PaperContainer>
          <p className="p13-eyebrow">Six headline patterns</p>
          <div className="p13-framework-grid">
            {headlinePatterns.map((pattern) => (
              <article key={pattern.id} className="p13-pattern-card">
                <p className="p13-pattern-id">{pattern.id}</p>
                <h2>{pattern.title}</h2>
                <p>{pattern.body}</p>
              </article>
            ))}
          </div>
        </PaperContainer>
      </section>

      <section className="p13-framework-section">
        <PaperContainer narrow>
          <p className="p13-eyebrow">Demo workflow</p>
          <h2 className="p13-title" style={{ fontSize: 36 }}>
            How the answer becomes executable.
          </h2>
          <p className="p13-copy">
            AbarVa turns the CTO question into a repeatable path: context, reasoning, dependency
            shape, value tracking, and sourcing workflow. The public page shows the shape; the
            logged-in demo shows the tenant-grounded evidence and artifacts.
          </p>
          <ol className="p13-workflow">
            {workflowSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </PaperContainer>
      </section>

      <section className="p13-framework-section">
        <PaperContainer>
          <div className="p13-cta">
            <div>
              <p className="p13-eyebrow">Full corpus</p>
              <h2>Full corpus - login required</h2>
              <p className="p13-copy">
                The complete framework includes the 39 IT-productivity patterns, Source workflows,
                discovery instruments, Move gates, evidence links, and version-pinned audit trail.
              </p>
            </div>
            <Link className="p13-button" href="/sign-in">
              Full corpus - login required
            </Link>
          </div>
        </PaperContainer>
      </section>
    </div>
  );
}
