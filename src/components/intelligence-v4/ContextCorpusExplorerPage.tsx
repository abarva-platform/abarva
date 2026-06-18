'use client';

import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';

import type { AiControlTowerReadModel } from '@/lib/ai-control-tower/read-model';
import type { EnterpriseContextOverview } from '@/lib/enterprise-context/intelligence-read-model';

type IntelligenceTab = 'signals' | 'context' | 'corpus' | 'sentinel';

interface ContextCorpusExplorerPageProps {
  tenantName: string;
  tenantKey: string | null;
  overview: EnterpriseContextOverview | null;
  towerModel: AiControlTowerReadModel;
}

interface IntelligenceSignal {
  id: string;
  headline: string;
  soWhat: string;
  domain: string;
  materiality: 'high' | 'medium' | 'low';
  evidence: string[];
  action: string;
}

interface EnterpriseContextInsightLike {
  id: string;
  headline: string;
  so_what: string;
  domain: string;
  materiality: string;
  evidence: string | null;
  action: string | null;
}

interface SentinelAnswer {
  headline: string;
  rows: string[][];
  columns: string[];
  citations: string[];
  next: string[];
}

const TABS: Array<{ key: IntelligenceTab; kicker: string; label: string }> = [
  { key: 'signals', kicker: 'Meaning', label: 'Signals' },
  { key: 'context', kicker: 'Context', label: 'Browser' },
  { key: 'corpus', kicker: 'Corpus', label: 'Library' },
  { key: 'sentinel', kicker: 'Ask', label: 'Sentinel' },
];

const DIMENSIONS = [
  ['Business strategy & priorities', ['strategy', 'initiative', 'portfolio']],
  ['IT systems landscape', ['application', 'cmdb', 'system']],
  ['Infrastructure & cloud', ['infrastructure', 'cloud', 'datacenter']],
  ['Finance & run cost', ['financial', 'spend', 'budget']],
  ['Vendors & contracts', ['vendor', 'contract', 'renewal']],
  ['Processes & operating model', ['process', 'workflow', 'operating']],
  ['Risk, controls & evidence', ['risk', 'control', 'evidence']],
  ['Data quality & lineage', ['data', 'lineage', 'stewardship']],
  ['AI initiatives & adoption', ['ai', 'initiative', 'adoption']],
  ['Change & delivery', ['change', 'dora', 'delivery']],
  ['Workforce & personas', ['persona', 'workforce', 'org']],
  ['Market & liquidity risk', ['market', 'liquidity', 'treasury']],
] as const;

const STARTERS = [
  'Which AI risks need CIO attention first?',
  'Where is value blocked by missing evidence?',
  'What should we validate before scaling AI?',
  'Which systems or contracts create execution drag?',
  'What context is missing before I trust this?',
];

const COLORS = {
  bg: '#f8f7f2',
  panel: '#fffefa',
  ink: '#171717',
  muted: '#6a665e',
  line: '#dfd9ce',
  navy: '#102650',
  green: '#31765b',
  amber: '#a66a1f',
  red: '#9e332e',
  blue: '#2f5ea8',
  serif: 'var(--font-fraunces), Georgia, serif',
  sans: 'var(--font-geist-sans), Inter, system-ui, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
} as const;

function toneColor(value: string): string {
  if (['high', 'red', 'critical', 'missing', 'review_required'].includes(value.toLowerCase())) return COLORS.red;
  if (['medium', 'amber', 'partial'].includes(value.toLowerCase())) return COLORS.amber;
  if (['green', 'loaded', 'committed', 'retrieval_proven', 'low'].includes(value.toLowerCase())) return COLORS.green;
  return COLORS.blue;
}

function money(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

function pct(value: number | null): string {
  return value === null ? 'n/a' : `${Math.round(value)}%`;
}

function refreshLabel(tenantName: string): string {
  return tenantName.toLowerCase().includes('first capital') ? 'Jun 17, 2026' : 'Current load';
}

function recordTypeCount(overview: EnterpriseContextOverview | null, needles: readonly string[]): number {
  if (!overview) return 0;
  return Object.entries(overview.recordTypeCounts).reduce((sum, [key, count]) => {
    return needles.some((needle) => key.toLowerCase().includes(needle)) ? sum + count : sum;
  }, 0);
}

function overviewInsights(overview: EnterpriseContextOverview | null): EnterpriseContextInsightLike[] {
  const extended = overview as (EnterpriseContextOverview & {
    contextInsights?: EnterpriseContextInsightLike[];
  }) | null;
  return Array.isArray(extended?.contextInsights) ? extended.contextInsights : [];
}

function insightToSignal(insight: EnterpriseContextInsightLike): IntelligenceSignal {
  const materiality = insight.materiality === 'high' || insight.materiality === 'medium' ? insight.materiality : 'low';
  return {
    id: insight.id,
    headline: insight.headline,
    soWhat: insight.so_what,
    domain: insight.domain || 'Context',
    materiality,
    evidence: insight.evidence ? [insight.evidence] : [],
    action: insight.action ?? 'Review evidence chain',
  };
}

function deriveSignals(overview: EnterpriseContextOverview | null, tower: AiControlTowerReadModel): IntelligenceSignal[] {
  const contextSignals = overviewInsights(overview).slice(0, 5).map(insightToSignal);
  const riskSignals = tower.risks
    .filter((risk) => ['critical', 'high'].includes(risk.severity.toLowerCase()) || risk.gate === 'fail')
    .slice(0, 4)
    .map((risk) => ({
      id: `risk-${risk.id}`,
      headline: `${risk.name || risk.dimension} needs governance action before scale`,
      soWhat: risk.description,
      domain: risk.functionName || 'AI governance',
      materiality: risk.severity.toLowerCase() === 'critical' ? 'high' as const : 'medium' as const,
      evidence: [risk.id],
      action: risk.requiredAction || 'Assign named governance owner',
    }));
  const spendSignals = tower.spend
    .filter((row) => row.annualizedSpendUsd > 0)
    .sort((a, b) => b.annualizedSpendUsd - a.annualizedSpendUsd)
    .slice(0, 2)
    .map((row) => ({
      id: `spend-${row.id}`,
      headline: `${row.vendor} ${row.product} carries ${money(row.annualizedSpendUsd)} of AI spend exposure`,
      soWhat: `${row.functionName} owns or consumes this spend; tie it to adoption, productivity, and evidence before renewal or expansion.`,
      domain: 'Spend',
      materiality: 'medium' as const,
      evidence: [row.id],
      action: 'Open Tower Spend and compare against realized value',
    }));
  const adoptionSignals = tower.functions
    .filter((row) => row.seats > 0)
    .sort((a, b) => (a.adoptionPct ?? 999) - (b.adoptionPct ?? 999))
    .slice(0, 2)
    .map((row) => ({
      id: `adoption-${row.name}`,
      headline: `${row.name} adoption is ${pct(row.adoptionPct)} across ${row.seats.toLocaleString()} eligible seats`,
      soWhat: row.blocker,
      domain: 'Adoption',
      materiality: (row.adoptionPct ?? 100) < 50 ? 'high' as const : 'medium' as const,
      evidence: [row.name],
      action: 'Open Tower Adoption by function',
    }));

  return [...riskSignals, ...spendSignals, ...adoptionSignals, ...contextSignals].slice(0, 10);
}

function buildSentinelAnswer(question: string, tower: AiControlTowerReadModel, overview: EnterpriseContextOverview | null): SentinelAnswer {
  const lower = question.toLowerCase();
  if (lower.includes('hold') || lower.includes('validation') || lower.includes('risk') || lower.includes('scale')) {
    const rows = tower.risks
      .filter((risk) => ['critical', 'high'].includes(risk.severity.toLowerCase()) || risk.gate === 'fail')
      .slice(0, 6);
    return {
      headline: rows.length
        ? `${rows.length} governance-blocked AI claims need hold, restructure, or validation before a CIO should scale them.`
        : 'No high-severity AI governance blockers are loaded.',
      columns: ['Risk', 'Function', 'Severity', 'Owner', 'Required action'],
      rows: rows.map((row) => [row.name || row.dimension, row.functionName, row.severity, row.owner, row.requiredAction]),
      citations: rows.map((row) => row.id),
      next: ['Open Tower Risk', 'Open Tower Actions', 'Show evidence rows'],
    };
  }

  if (lower.includes('contract') || lower.includes('renewal') || lower.includes('spend')) {
    const rows = tower.spend.sort((a, b) => b.annualizedSpendUsd - a.annualizedSpendUsd).slice(0, 6);
    return {
      headline: rows.length
        ? `${money(rows.reduce((sum, row) => sum + row.annualizedSpendUsd, 0))} of AI spend is loaded for vendor/product inspection.`
        : 'Spend contracts are not committed yet, so Sentinel should not claim renewal exposure.',
      columns: ['Vendor', 'Product', 'Function', 'Annual spend', 'Renewal'],
      rows: rows.map((row) => [row.vendor, row.product, row.functionName, money(row.annualizedSpendUsd), row.renewalDate ?? 'n/a']),
      citations: rows.map((row) => row.id),
      next: ['Open Tower Spend', 'Ask spend vs value', 'Load contract evidence'],
    };
  }

  if (lower.includes('adoption') || lower.includes('copilot') || lower.includes('productivity')) {
    const rows = tower.functions.sort((a, b) => (a.adoptionPct ?? 999) - (b.adoptionPct ?? 999)).slice(0, 6);
    return {
      headline: rows.length
        ? `${rows[0].name} is the first adoption segment to inspect at ${pct(rows[0].adoptionPct)} adoption.`
        : 'Adoption cannot be answered until tool usage rows are loaded.',
      columns: ['Function', 'Active / seats', 'Adoption', 'Spend', 'Blocker'],
      rows: rows.map((row) => [row.name, `${row.activeUsers.toLocaleString()} / ${row.seats.toLocaleString()}`, pct(row.adoptionPct), money(row.spendUsd), row.blocker]),
      citations: rows.map((row) => row.name),
      next: ['Open Tower Adoption', 'Show Copilot by persona', 'Show productivity proof'],
    };
  }

  if (lower.includes('missing') || lower.includes('trust') || lower.includes('loaded')) {
    const blockers = tower.risks
      .filter((risk) => ['critical', 'high'].includes(risk.severity.toLowerCase()) || risk.gate === 'fail')
      .slice(0, 3);
    const readySignals = deriveSignals(overview, tower).slice(0, 3);
    return {
      headline: readySignals.length
        ? 'The strongest reads are ready to discuss, but scale decisions should still drill into support before approval.'
        : 'The context is not yet strong enough for a confident executive read.',
      columns: ['Readiness area', 'What it means', 'Executive use'],
      rows: [
        ['Ready to discuss', readySignals[0]?.headline ?? 'No strong signal surfaced yet', 'Use as the opening CIO read'],
        ['Needs caution', blockers[0]?.requiredAction ?? 'No high-severity blocker surfaced', 'Validate before scaling or funding'],
        ['Ask next', 'Where value, risk, and adoption disagree', 'Use Sentinel to pressure-test the claim'],
      ],
      citations: readySignals.flatMap((signal) => signal.evidence).slice(0, 4),
      next: ['Open Executive Signals', 'Open Corpus Patterns', 'Ask a follow-up'],
    };
  }

  const topSignal = deriveSignals(overview, tower)[0];
  return {
    headline: topSignal?.headline ?? 'Sentinel needs stronger support before making a confident executive claim.',
    columns: ['Signal', 'Why it matters', 'Action'],
    rows: topSignal ? [[topSignal.domain, topSignal.soWhat, topSignal.action]] : [],
    citations: topSignal?.evidence ?? [],
    next: ['Open Executive Signals', 'Open Context Browser', 'Ask what is missing'],
  };
}

export function ContextCorpusExplorerPage({
  tenantName,
  tenantKey,
  overview,
  towerModel,
}: ContextCorpusExplorerPageProps) {
  const [activeTab, setActiveTab] = useState<IntelligenceTab>('signals');
  const [draft, setDraft] = useState('');
  const signals = useMemo(() => deriveSignals(overview, towerModel), [overview, towerModel]);
  const [answer, setAnswer] = useState<SentinelAnswer>(() =>
    buildSentinelAnswer('What is my context telling me right now?', towerModel, overview),
  );
  const scaleBlockers = towerModel.risks.filter((risk) => ['critical', 'high'].includes(risk.severity.toLowerCase()) || risk.gate === 'fail');
  const decisionActions = towerModel.actions.filter((action) => !['done', 'closed', 'complete', 'completed'].includes(action.status.toLowerCase()));

  const submit = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed) return;
    setAnswer(buildSentinelAnswer(trimmed, towerModel, overview));
    setActiveTab('sentinel');
    setDraft('');
  };

  return (
    <main style={styles.page}>
      <nav style={styles.breadcrumb} aria-label="Breadcrumb">
        <span>{tenantName}</span>
        <span>›</span>
        <strong>Intelligence</strong>
      </nav>
      <section style={styles.hero}>
        <div>
          <p style={styles.kicker}>CONTEXT INTELLIGENCE · {tenantName.toUpperCase()}</p>
          <h1 style={styles.h1}>What your context is telling us</h1>
          <p style={styles.lede}>A reading of the loaded enterprise context and corpus — in plain English, cross-domain, with the supporting evidence and source citations one click away.</p>
        </div>
        <div style={styles.refreshCard}>
          <span>Context refreshed</span>
          <strong><span style={styles.refreshDot} />{refreshLabel(tenantName)}</strong>
          <small>{tenantKey ? 'Evidence-backed enterprise read' : 'Context routing pending'}</small>
        </div>
      </section>

      <nav style={styles.tabs} aria-label="Intelligence views">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              ...styles.tab,
              borderColor: activeTab === tab.key ? COLORS.navy : COLORS.line,
              borderBottomColor: activeTab === tab.key ? COLORS.green : COLORS.line,
            }}
          >
            <span>{tab.kicker}</span>
            <strong>{tab.label}</strong>
          </button>
        ))}
      </nav>

      <section style={styles.workspace}>
        <aside style={styles.sentinel}>
          <p style={styles.kicker}>SENTINEL</p>
          <h2 style={styles.asideTitle}>Ask about loaded context.</h2>
          <div style={styles.answer}>
            <strong>{answer.headline}</strong>
            {answer.rows.length > 0 ? <AnswerTable columns={answer.columns} rows={answer.rows} /> : null}
            {answer.citations.length > 0 ? <EvidencePill count={answer.citations.length} /> : null}
            <div style={styles.next}>{answer.next.map((next) => <span key={next}>{next}</span>)}</div>
          </div>
          <div style={styles.starters}>
            {STARTERS.map((question) => (
              <button key={question} type="button" onClick={() => submit(question)} style={styles.starterButton}>
                {question}
              </button>
            ))}
          </div>
          <form
            style={styles.ask}
            onSubmit={(event) => {
              event.preventDefault();
              submit(draft);
            }}
          >
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask Sentinel..." aria-label="Ask Sentinel" style={styles.askInput} />
            <button type="submit" style={styles.askButton}>Ask</button>
          </form>
          <p style={styles.guardrail}>Sentinel answers only from loaded context and names what is missing.</p>
        </aside>

        <section style={styles.canvas}>
          {activeTab === 'signals' ? <SignalsView signals={signals} /> : null}
          {activeTab === 'context' ? <DimensionsView overview={overview} tower={towerModel} /> : null}
          {activeTab === 'corpus' ? <CorpusView overview={overview} tower={towerModel} /> : null}
          {activeTab === 'sentinel' ? <SentinelView answer={answer} /> : null}
        </section>
      </section>
      <footer style={styles.footer}>
        <span>First Capital Financial Corporation context intelligence</span>
        <span>{decisionActions.length || scaleBlockers.length} decisions to review · refreshed {refreshLabel(tenantName)}</span>
      </footer>
    </main>
  );
}

function SignalsView({ signals }: { signals: IntelligenceSignal[] }) {
  return (
    <>
      <CanvasHeader kicker="Executive Signals" title="The strongest cross-context reads." subtitle="Signals combine business context, corpus evidence, risk gates, spend, adoption, and readiness into plain-English decisions." />
      <div style={styles.signalGrid}>
        {signals.length > 0 ? signals.map((signal) => (
          <article key={signal.id} style={styles.signalCard}>
            <div style={styles.cardTop}>
              <span style={{ ...styles.badge, color: toneColor(signal.materiality), borderColor: `${toneColor(signal.materiality)}55` }}>{signal.materiality}</span>
              <span>{signal.domain}</span>
            </div>
            <h3>{signal.headline}</h3>
            <p>{signal.soWhat}</p>
            <footer>
              <div style={styles.signalActions}>
                <button type="button" style={styles.textButton}>See evidence</button>
                <button type="button" style={styles.primaryAction}>Shape into Move</button>
                {signal.evidence.length > 0 ? <EvidencePill count={signal.evidence.length} /> : null}
              </div>
            </footer>
          </article>
        )) : <EmptyState message="No derived context insights or Tower signals are loaded yet." />}
      </div>
    </>
  );
}

function DimensionsView({ overview, tower }: { overview: EnterpriseContextOverview | null; tower: AiControlTowerReadModel }) {
  return (
    <>
      <CanvasHeader kicker="Context Browser" title="Browse the business context behind the insights." subtitle="Use this view to understand which parts of the enterprise are contributing to the read, without exposing data plumbing." />
      <div style={styles.dimensionGrid}>
        {DIMENSIONS.map(([label, needles], index) => {
          const count = label === 'AI initiatives & adoption'
            ? Math.max(recordTypeCount(overview, needles), tower.rowCounts.initiatives + tower.rowCounts.usage)
            : recordTypeCount(overview, needles);
          return (
            <article key={label} style={styles.dimensionCard}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{label}</strong>
              <Badge label={count > 0 ? 'loaded' : 'missing'} />
              <small>{count > 0 ? 'Available for insight synthesis' : 'Needs more context before strong conclusions'}</small>
            </article>
          );
        })}
      </div>
    </>
  );
}

function CorpusView({ overview, tower }: { overview: EnterpriseContextOverview | null; tower: AiControlTowerReadModel }) {
  const topSignals = deriveSignals(overview, tower).slice(0, 5);
  const rows = [
    ['AI governance', 'Which AI claims should be held until controls are validated?', 'Risk, owner, action, and timing read together.'],
    ['Spend vs value', 'Which investments need proof before renewal or expansion?', 'Spend, adoption, productivity, and benefit claims are compared.'],
    ['Adoption drag', 'Where is usage too weak to justify scaling?', 'Function-level adoption is interpreted against blockers and value.'],
    ['Vendor leverage', 'Which platform contracts should be renegotiated or paused?', 'Renewal pressure is tied to business value and risk posture.'],
    ['Move shaping', 'Which signals are strong enough to become executive moves?', 'Insights are converted into actions when support is sufficient.'],
  ];
  return (
    <>
      <CanvasHeader kicker="Corpus Library" title="Patterns the context can now reason across." subtitle="This is the practical value of the corpus: reusable question patterns, not a technical inventory." />
      <AnswerTable columns={['Pattern', 'Question it answers', 'How it reasons']} rows={rows} />
      <div style={styles.patternList}>
        {topSignals.map((signal) => (
          <article key={signal.id}>
            <strong>{signal.headline}</strong>
            <span>{signal.soWhat}</span>
          </article>
        ))}
      </div>
    </>
  );
}

function SentinelView({ answer }: { answer: SentinelAnswer }) {
  return (
    <>
      <CanvasHeader kicker="Ask Sentinel" title="Ask questions against the loaded context." subtitle="Sentinel returns a headline, supporting rows, evidence status, and next paths." />
      <div style={styles.largeAnswer}>
        <h3>{answer.headline}</h3>
        {answer.rows.length > 0 ? <AnswerTable columns={answer.columns} rows={answer.rows} /> : null}
        {answer.citations.length > 0 ? <EvidencePill count={answer.citations.length} /> : null}
      </div>
    </>
  );
}

function EvidencePill({ count }: { count: number }) {
  return <span style={styles.evidencePill}>{count} evidence {count === 1 ? 'item' : 'items'} available</span>;
}

function CanvasHeader({ kicker, title, subtitle }: { kicker: string; title: string; subtitle: string }) {
  return (
    <header style={styles.canvasHeader}>
      <p style={styles.kicker}>{kicker}</p>
      <h2 style={styles.h2}>{title}</h2>
      <p>{subtitle}</p>
    </header>
  );
}

function AnswerTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={`${row.join('-')}-${index}`}>{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return <span style={{ ...styles.badge, color: toneColor(label), borderColor: `${toneColor(label)}55` }}>{label}</span>;
}

function EmptyState({ message }: { message: string }) {
  return <div style={styles.empty}>{message}</div>;
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: COLORS.bg,
    color: COLORS.ink,
    fontFamily: COLORS.sans,
    padding: '24px 32px 34px',
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    color: COLORS.muted,
    fontSize: 13,
  },
  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 24,
    alignItems: 'flex-start',
    borderBottom: `1px solid ${COLORS.line}`,
    paddingBottom: 22,
  },
  kicker: {
    margin: 0,
    color: COLORS.muted,
    fontFamily: COLORS.mono,
    fontSize: 11,
    fontWeight: 850,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  h1: {
    margin: '8px 0 8px',
    fontFamily: COLORS.serif,
    fontSize: 'clamp(30px, 3.1vw, 42px)',
    lineHeight: 1.05,
    letterSpacing: 0,
    fontWeight: 500,
    maxWidth: 760,
  },
  h2: {
    margin: '5px 0',
    fontFamily: COLORS.serif,
    fontSize: 24,
    lineHeight: 1.12,
    letterSpacing: 0,
    fontWeight: 500,
  },
  lede: {
    margin: 0,
    maxWidth: 780,
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 1.45,
  },
  refreshCard: {
    display: 'grid',
    gap: 6,
    minWidth: 190,
    border: `1px solid ${COLORS.line}`,
    borderRadius: 8,
    background: COLORS.panel,
    padding: 14,
    fontSize: 12,
  },
  refreshDot: {
    display: 'inline-block',
    width: 9,
    height: 9,
    marginRight: 7,
    borderRadius: 999,
    background: COLORS.green,
  },
  tabs: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 2,
    marginTop: 24,
    borderBottom: `1px solid ${COLORS.line}`,
  },
  tab: {
    minWidth: 118,
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 7,
    border: '0',
    borderBottom: '2px solid',
    borderRadius: 0,
    background: 'transparent',
    color: COLORS.ink,
    padding: '11px 14px 12px',
    cursor: 'pointer',
    fontFamily: COLORS.sans,
  },
  workspace: {
    display: 'grid',
    gridTemplateColumns: '350px minmax(0, 1fr)',
    gap: 14,
    marginTop: 14,
    alignItems: 'start',
  },
  sentinel: {
    position: 'sticky',
    top: 12,
    display: 'grid',
    gap: 12,
    border: `1px solid ${COLORS.line}`,
    borderRadius: 8,
    background: COLORS.panel,
    padding: 14,
  },
  asideTitle: {
    margin: 0,
    fontFamily: COLORS.serif,
    fontSize: 19,
    fontWeight: 500,
    letterSpacing: 0,
  },
  answer: {
    display: 'grid',
    gap: 10,
    border: `1px solid ${COLORS.line}`,
    borderRadius: 8,
    background: '#fbfaf7',
    padding: 12,
    fontSize: 13,
    lineHeight: 1.35,
  },
  starters: {
    display: 'grid',
    gap: 7,
  },
  starterButton: {
    border: `1px solid ${COLORS.line}`,
    borderRadius: 6,
    background: '#fffefa',
    color: COLORS.ink,
    padding: '9px 10px',
    textAlign: 'left',
    fontFamily: COLORS.sans,
    fontSize: 13,
    cursor: 'pointer',
  },
  ask: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: 8,
  },
  askInput: {
    minWidth: 0,
    border: `1px solid ${COLORS.line}`,
    borderRadius: 7,
    background: '#fffefa',
    color: COLORS.ink,
    padding: '9px 10px',
    fontFamily: COLORS.sans,
    fontSize: 13,
  },
  askButton: {
    border: `1px solid ${COLORS.navy}`,
    borderRadius: 7,
    background: COLORS.navy,
    color: '#fff',
    padding: '9px 12px',
    fontFamily: COLORS.sans,
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
  },
  guardrail: {
    margin: 0,
    border: `1px solid ${COLORS.green}44`,
    borderRadius: 7,
    background: '#eef8f2',
    color: COLORS.green,
    padding: 9,
    fontFamily: COLORS.mono,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  canvas: {
    minWidth: 0,
    border: `1px solid ${COLORS.line}`,
    borderRadius: 8,
    background: COLORS.panel,
    padding: 18,
  },
  canvasHeader: {
    borderBottom: `1px solid ${COLORS.line}`,
    paddingBottom: 12,
    marginBottom: 12,
  },
  signalGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
  },
  signalCard: {
    border: `1px solid ${COLORS.line}`,
    borderRadius: 8,
    background: '#fbfaf7',
    padding: '16px 18px',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    color: COLORS.muted,
    fontSize: 12,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    border: '1px solid',
    borderRadius: 999,
    padding: '3px 8px',
    fontFamily: COLORS.mono,
    fontSize: 10,
    fontWeight: 900,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  citations: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  evidencePill: {
    display: 'inline-flex',
    width: 'fit-content',
    alignItems: 'center',
    border: `1px solid ${COLORS.green}55`,
    borderRadius: 999,
    color: COLORS.green,
    background: '#eef8f2',
    padding: '4px 8px',
    fontFamily: COLORS.mono,
    fontSize: 10,
    fontWeight: 850,
    textTransform: 'uppercase',
  },
  signalActions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTop: `1px solid ${COLORS.line}`,
  },
  textButton: {
    border: 0,
    background: 'transparent',
    color: COLORS.ink,
    padding: 0,
    fontFamily: COLORS.sans,
    fontSize: 13,
    fontWeight: 750,
    cursor: 'pointer',
  },
  primaryAction: {
    border: `1px solid ${COLORS.ink}`,
    borderRadius: 7,
    background: COLORS.ink,
    color: '#fff',
    padding: '8px 12px',
    fontFamily: COLORS.sans,
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
  },
  next: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  dimensionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 9,
  },
  dimensionCard: {
    display: 'grid',
    gap: 8,
    minHeight: 120,
    border: `1px solid ${COLORS.line}`,
    borderRadius: 8,
    background: '#fbfaf7',
    padding: 12,
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 12,
  },
  sourceList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  patternList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 10,
    marginTop: 14,
  },
  largeAnswer: {
    display: 'grid',
    gap: 12,
    border: `1px solid ${COLORS.line}`,
    borderRadius: 8,
    background: '#fbfaf7',
    padding: 14,
  },
  empty: {
    border: `1px dashed ${COLORS.line}`,
    borderRadius: 8,
    color: COLORS.muted,
    background: '#fbfaf7',
    padding: 24,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 18,
    borderTop: `1px solid ${COLORS.line}`,
    paddingTop: 12,
    color: COLORS.muted,
    fontSize: 12,
  },
};
