'use client';

import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';

import { AvaAskMark } from '@/components/agent-answer/AvaAskMark';
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
  { key: 'signals', kicker: 'MEANING · L2', label: 'Signals' },
  { key: 'context', kicker: 'CONTEXT · L1', label: 'Dimensions' },
  { key: 'corpus', kicker: 'GLOBAL · L1', label: 'Corpus' },
  { key: 'sentinel', kicker: 'ASK · L3', label: 'Ava' },
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
  'Which AI initiatives should we kill, and why?',
  'Where are we exposed on platform contract renewals?',
  'Why is retail AI adoption so low?',
  'Which models are running without current validation?',
  'What data is missing before I trust this dashboard?',
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
      headline: `${risk.name || risk.dimension} blocks an AI scale claim`,
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
  if (lower.includes('kill') || lower.includes('validation') || lower.includes('risk')) {
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
        : 'Spend contracts are not committed yet, so Ava should not claim renewal exposure.',
      columns: ['Vendor', 'Product', 'Function', 'Annual spend', 'Renewal'],
      rows: rows.map((row) => [row.vendor, row.product, row.functionName, money(row.annualizedSpendUsd), row.renewalDate ?? 'n/a']),
      citations: rows.map((row) => row.id),
      next: ['Open Tower Spend', 'Ask spend vs value', 'Load contract evidence'],
    };
  }

  if (lower.includes('adoption') || lower.includes('retail') || lower.includes('copilot')) {
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
    return {
      headline: `The context layer has ${overview?.counts.records ?? 0} records, ${overview?.counts.facts ?? 0} facts, ${overview?.counts.relationships ?? 0} graph edges, and Tower has ${tower.rowCounts.evidence} evidence rows.`,
      columns: ['Layer', 'Loaded depth', 'Readiness'],
      rows: [
        ['Enterprise context', `${overview?.counts.records ?? 0} records / ${overview?.counts.facts ?? 0} facts`, overview ? 'loaded' : 'missing'],
        ['Corpus/evidence', `${overview?.counts.evidence ?? 0} evidence rows`, (overview?.counts.evidence ?? 0) > 0 ? 'loaded' : 'missing'],
        ['AI Tower', `${tower.rowCounts.initiatives} initiatives / ${tower.rowCounts.spend} spend / ${tower.rowCounts.actions} actions`, tower.source],
      ],
      citations: tower.evidence.slice(0, 4).map((row) => row.id),
      next: ['Open Dimensions', 'Open Corpus', 'Open Tower Evidence'],
    };
  }

  const topSignal = deriveSignals(overview, tower)[0];
  return {
    headline: topSignal?.headline ?? 'Ava needs committed context, facts, or Tower rows before making a strong claim.',
    columns: ['Signal', 'Why it matters', 'Action'],
    rows: topSignal ? [[topSignal.domain, topSignal.soWhat, topSignal.action]] : [],
    citations: topSignal?.evidence ?? [],
    next: ['Open Signals', 'Open Dimensions', 'Ask what is missing'],
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
  const dimensionsLoaded = DIMENSIONS.filter(([, needles]) => recordTypeCount(overview, needles) > 0).length +
    (towerModel.rowCounts.initiatives > 0 ? 1 : 0);
  const loadedDimensions = Math.min(DIMENSIONS.length, dimensionsLoaded);
  const trustPct = overview && overview.counts.evidence > 0
    ? Math.round((overview.evidenceUsableCount / overview.counts.evidence) * 100)
    : towerModel.evidence.length > 0
      ? 100
      : 0;

  const submit = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed) return;
    setAnswer(buildSentinelAnswer(trimmed, towerModel, overview));
    setActiveTab('sentinel');
    setDraft('');
  };

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.kicker}>CONTEXT INTELLIGENCE · {tenantName.toUpperCase()}</p>
          <h1 style={styles.h1}>What your context is telling us</h1>
          <p style={styles.lede}>Evidence-cited signals from enterprise context, corpus, Tower rows, and graph relationships. Ava answers plainly and names missing context when the substrate is thin.</p>
        </div>
        <div style={styles.meta}>
          <span>tenant key</span>
          <strong>{tenantKey ?? 'not resolved'}</strong>
          <span>{towerModel.source === 'ai_control_data_plane' ? 'Tower committed' : 'Tower fallback/empty'}</span>
        </div>
      </section>

      <section style={styles.health}>
        <HealthCard label="Dimensions loaded" value={`${loadedDimensions}/${DIMENSIONS.length}`} note="context families" tone={loadedDimensions >= 10 ? 'green' : 'amber'} />
        <HealthCard label="Evidence points" value={(overview?.counts.facts ?? towerModel.facts.length).toLocaleString()} note="facts + Tower facts" tone={(overview?.counts.facts ?? towerModel.facts.length) > 0 ? 'green' : 'red'} />
        <HealthCard label="Sources ingested" value={String(overview?.counts.sources ?? towerModel.rowCounts.sources)} note="source systems/files" tone={(overview?.counts.sources ?? 0) > 0 ? 'green' : 'amber'} />
        <HealthCard label="Graph edges" value={String(overview?.counts.relationships ?? 0)} note="context relationships" tone={(overview?.counts.relationships ?? 0) > 0 ? 'green' : 'amber'} />
        <HealthCard label="Trust" value={`${trustPct}%`} note="usable evidence" tone={trustPct > 70 ? 'green' : trustPct > 0 ? 'amber' : 'red'} />
      </section>

      {towerModel.source !== 'ai_control_data_plane' ? <div style={styles.disclosure}>{towerModel.sourceDisclosure}</div> : null}

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
          <p style={styles.kicker}>AVA</p>
          <h2 style={styles.asideTitle}>Ask about loaded context.</h2>
          <div style={styles.answer}>
            <strong>{answer.headline}</strong>
            {answer.rows.length > 0 ? <AnswerTable columns={answer.columns} rows={answer.rows} /> : null}
            {answer.citations.length > 0 ? (
              <div style={styles.citations}>{answer.citations.slice(0, 5).map((citation) => <span key={citation}>{citation}</span>)}</div>
            ) : null}
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
            <AvaAskMark style={styles.askMark} />
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask Ava..." aria-label="Ask Ava" />
            <button type="submit">Ask</button>
          </form>
          <p style={styles.guardrail}>Every answer is evidence-cited where available; unsupported claims are routed to missing-context guidance.</p>
        </aside>

        <section style={styles.canvas}>
          {activeTab === 'signals' ? <SignalsView signals={signals} /> : null}
          {activeTab === 'context' ? <DimensionsView overview={overview} tower={towerModel} /> : null}
          {activeTab === 'corpus' ? <CorpusView overview={overview} tower={towerModel} /> : null}
          {activeTab === 'sentinel' ? <SentinelView answer={answer} /> : null}
        </section>
      </section>
    </main>
  );
}

function HealthCard({ label, value, note, tone }: { label: string; value: string; note: string; tone: string }) {
  return (
    <article style={styles.healthCard}>
      <p style={styles.smallKicker}>{label}</p>
      <strong>{value}</strong>
      <span style={{ color: toneColor(tone) }}>{note}</span>
    </article>
  );
}

function SignalsView({ signals }: { signals: IntelligenceSignal[] }) {
  return (
    <>
      <CanvasHeader kicker="MEANING · L2 · SIGNALS" title="The strongest cross-context reads." subtitle="Signals combine corpus facts, Tower rows, risk gates, spend, adoption, and evidence readiness." />
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
              <div style={styles.citations}>{signal.evidence.slice(0, 3).map((item) => <span key={item}>{item}</span>)}</div>
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
      <CanvasHeader kicker="CONTEXT · L1 · 12 DIMENSIONS" title="Coverage across the enterprise context layer." subtitle="Each tile shows whether that dimension has usable rows or Tower-derived context." />
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
              <small>{count} records</small>
            </article>
          );
        })}
      </div>
    </>
  );
}

function CorpusView({ overview, tower }: { overview: EnterpriseContextOverview | null; tower: AiControlTowerReadModel }) {
  const rows = [
    ['Enterprise records', String(overview?.counts.records ?? 0), 'structured context rows'],
    ['Facts', String(overview?.counts.facts ?? tower.facts.length), 'answerable context assertions'],
    ['Evidence', String(overview?.counts.evidence ?? tower.evidence.length), 'citation-bearing rows'],
    ['Relationships', String(overview?.counts.relationships ?? 0), 'graph edges'],
    ['Tower facts', String(tower.facts.length), 'AI Control Tower answer substrate'],
  ];
  return (
    <>
      <CanvasHeader kicker="GLOBAL · L1 · CORPUS" title="What Ava can search and cite." subtitle="The corpus view explains answerability before an executive asks the hard question." />
      <AnswerTable columns={['Layer', 'Count', 'Meaning']} rows={rows} />
      <div style={styles.sourceList}>
        {(overview?.sourceSystems ?? []).slice(0, 16).map((source) => <span key={source}>{source}</span>)}
      </div>
    </>
  );
}

function SentinelView({ answer }: { answer: SentinelAnswer }) {
  return (
    <>
      <CanvasHeader kicker="ASK · L3 · AVA" title="Structured answer, not a wall of text." subtitle="Ava returns a headline, rows, citations, and next paths." />
      <div style={styles.largeAnswer}>
        <h3>{answer.headline}</h3>
        {answer.rows.length > 0 ? <AnswerTable columns={answer.columns} rows={answer.rows} /> : null}
        <div style={styles.citations}>{answer.citations.map((citation) => <span key={citation}>{citation}</span>)}</div>
      </div>
    </>
  );
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
  meta: {
    display: 'grid',
    gap: 4,
    minWidth: 180,
    border: `1px solid ${COLORS.line}`,
    borderRadius: 8,
    background: COLORS.panel,
    padding: 12,
    fontSize: 12,
  },
  health: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(150px, 1fr))',
    gap: 10,
    marginTop: 14,
  },
  healthCard: {
    display: 'grid',
    gap: 5,
    border: `1px solid ${COLORS.line}`,
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
    gridTemplateColumns: 'auto 1fr auto',
    gap: 8,
    alignItems: 'center',
  },
  askMark: {
    minWidth: 38,
    fontSize: 22,
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
};
