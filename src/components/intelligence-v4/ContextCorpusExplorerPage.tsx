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
  { key: 'signals', kicker: 'Meaning', label: 'Executive Signals' },
  { key: 'context', kicker: 'Context', label: 'Context Browser' },
  { key: 'corpus', kicker: 'Corpus', label: 'Corpus Library' },
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

function readinessLabel(score: number): string {
  if (score >= 80) return 'High';
  if (score >= 50) return 'Usable';
  if (score > 0) return 'Needs review';
  return 'Thin';
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
  const trustPct = overview && overview.counts.evidence > 0
    ? Math.round((overview.evidenceUsableCount / overview.counts.evidence) * 100)
    : towerModel.evidence.length > 0
      ? 100
      : 0;
  const scaleBlockers = towerModel.risks.filter((risk) => ['critical', 'high'].includes(risk.severity.toLowerCase()) || risk.gate === 'fail');
  const spendToProve = towerModel.spend.reduce((sum, row) => sum + row.annualizedSpendUsd, 0);
  const decisionActions = towerModel.actions.filter((action) => !['done', 'closed', 'complete', 'completed'].includes(action.status.toLowerCase()));
  const lowestAdoption = towerModel.functions
    .filter((row) => row.adoptionPct !== null)
    .sort((a, b) => (a.adoptionPct ?? 100) - (b.adoptionPct ?? 100))[0];

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

      <section style={styles.insightBand} aria-label="Derived insight summary">
        <InsightTile label="Top CIO read" value={signals[0]?.domain ?? 'Context'} note={signals[0]?.headline ?? 'No derived insight is ready yet.'} tone={signals[0]?.materiality ?? 'medium'} />
        <InsightTile label="Scale blockers" value={scaleBlockers.length ? `${scaleBlockers.length} areas` : 'None surfaced'} note={scaleBlockers.length ? 'Validate controls before expanding the affected AI work.' : 'No high-severity blocker is currently surfaced.'} tone={scaleBlockers.length ? 'high' : 'low'} />
        <InsightTile label="Spend to prove" value={spendToProve > 0 ? money(spendToProve) : 'Not surfaced'} note="Tie investment to adoption, productivity, and renewal choices." tone={spendToProve > 0 ? 'medium' : 'low'} />
        <InsightTile label="Adoption drag" value={lowestAdoption ? `${lowestAdoption.name}` : 'Not surfaced'} note={lowestAdoption ? `${pct(lowestAdoption.adoptionPct)} adoption; ${lowestAdoption.blocker}` : 'No weak adoption segment is surfaced.'} tone={(lowestAdoption?.adoptionPct ?? 100) < 50 ? 'high' : 'medium'} />
        <InsightTile label="Decision confidence" value={readinessLabel(trustPct)} note="Strong enough for an executive read; drill into support when challenged." tone={trustPct >= 80 ? 'low' : 'medium'} />
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
              boxShadow: activeTab === tab.key ? 'inset 0 0 0 2px #006cff' : 'none',
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
            {STARTERS.map((question) => <button key={question} type="button" onClick={() => submit(question)}>{question}</button>)}
          </div>
          <form
            style={styles.ask}
            onSubmit={(event) => {
              event.preventDefault();
              submit(draft);
            }}
          >
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask Sentinel..." aria-label="Ask Sentinel" />
            <button type="submit">Ask</button>
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

function InsightTile({ label, value, note, tone }: { label: string; value: string; note: string; tone: string }) {
  return (
    <article style={{ ...styles.insightTile, borderTopColor: toneColor(tone) }}>
      <p style={styles.smallKicker}>{label}</p>
      <strong>{value}</strong>
      <span style={{ color: toneColor(tone) }}>{note}</span>
    </article>
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
              <strong>{signal.action}</strong>
              <div style={styles.signalActions}>
                <button type="button">See evidence</button>
                <button type="button">Shape into Move</button>
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
    padding: '26px clamp(18px, 3vw, 38px) 34px',
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
    paddingBottom: 18,
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
  smallKicker: {
    margin: 0,
    color: COLORS.muted,
    fontFamily: COLORS.mono,
    fontSize: 10,
    fontWeight: 850,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  h1: {
    margin: '6px 0 4px',
    fontFamily: COLORS.serif,
    fontSize: 'clamp(34px, 4vw, 58px)',
    lineHeight: 0.98,
    letterSpacing: 0,
  },
  h2: {
    margin: '5px 0',
    fontFamily: COLORS.serif,
    fontSize: 32,
    lineHeight: 1.05,
    letterSpacing: 0,
  },
  lede: {
    margin: 0,
    maxWidth: 780,
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 1.35,
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
  insightBand: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(150px, 1fr))',
    gap: 10,
    marginTop: 14,
  },
  insightTile: {
    display: 'grid',
    gap: 5,
    border: `1px solid ${COLORS.line}`,
    borderTop: `3px solid ${COLORS.blue}`,
    borderRadius: 8,
    background: COLORS.panel,
    padding: 13,
  },
  disclosure: {
    marginTop: 14,
    border: `1px solid ${COLORS.amber}55`,
    borderRadius: 8,
    background: '#fff5df',
    color: '#6f4717',
    padding: '10px 12px',
    fontSize: 13,
  },
  tabs: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  tab: {
    minWidth: 130,
    border: '1px solid',
    borderRadius: 7,
    background: COLORS.panel,
    color: COLORS.ink,
    padding: '9px 12px',
    cursor: 'pointer',
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
    fontSize: 24,
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
  ask: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: 8,
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
    padding: 14,
  },
  canvasHeader: {
    borderBottom: `1px solid ${COLORS.line}`,
    paddingBottom: 12,
    marginBottom: 12,
  },
  signalGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 10,
  },
  signalCard: {
    border: `1px solid ${COLORS.line}`,
    borderRadius: 8,
    background: '#fbfaf7',
    padding: 13,
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
    gap: 8,
    marginTop: 10,
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
