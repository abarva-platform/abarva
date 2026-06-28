'use client';

import { useMemo, useRef, useState } from 'react';
import { AvaWordmark } from '@/components/brand/AvaWordmark';

import type {
  AiControlTowerActionRead,
  AiControlTowerAgentRead,
  AiControlTowerEvidenceRead,
  AiControlTowerFunctionRead,
  AiControlTowerInitiativeRead,
  AiControlTowerKpi,
  AiControlTowerProductivityRead,
  AiControlTowerReadModel,
  AiControlTowerRiskRead,
  AiControlTowerSpendRead,
} from '@/lib/ai-control-tower/read-model';

type TowerTab =
  | 'value'
  | 'initiatives'
  | 'adoption'
  | 'productivity'
  | 'agents'
  | 'spend'
  | 'risk'
  | 'evidence'
  | 'actions';

interface AiControlTowerPageProps {
  model: AiControlTowerReadModel;
}

interface AtlasAnswer {
  headline: string;
  /** Grounded prose answer from the Atlas engine (preferred over the structured table). */
  body?: string;
  disclosure: string | null;
  columns: string[];
  rows: string[][];
  modelTables?: VisibleTable[];
  modelTabs?: VisibleTab[];
  choices: Array<{ label: string; tab: TowerTab }>;
  /** Engine-suggested follow-up questions (re-ask on click). */
  followUps?: Array<{ label: string; value: string }>;
  citations: string[];
}

interface VisibleTable {
  id: string;
  title: string;
  columns: string[];
  rows: string[][];
}

interface VisibleTab {
  id: string;
  label: string;
  prose: string;
  tables?: VisibleTable[];
}

interface CioTowerChatResponse {
  response?: string;
  modelOutput?: {
    version: 'cio_tower_visible_answer_v1';
    answer: string;
    tables?: VisibleTable[];
    tabs?: VisibleTab[];
    followUpQuestion?: string | null;
  };
  validationStatus?: 'passed' | 'failed';
  validationErrors?: string[];
}

const TABS: Array<{ key: TowerTab; kicker: string; label: string; question: string }> = [
  { key: 'value', kicker: 'Portfolio', label: 'Portfolio', question: 'Which investments should we scale, hold, restructure, or stop?' },
  { key: 'initiatives', kicker: 'Programs', label: 'Programs', question: 'Which strategic programs need leadership attention?' },
  { key: 'adoption', kicker: 'Adoption', label: 'Adoption', question: 'Where is adoption strong enough to support the value claim?' },
  { key: 'productivity', kicker: 'Productivity', label: 'Productivity', question: 'Where did work get faster without quality drift?' },
  { key: 'agents', kicker: 'Agents', label: 'Agents', question: 'Which agents are resolving real work?' },
  { key: 'spend', kicker: 'Spend', label: 'Spend', question: 'Where is technology spend concentrated, exposed, or under-proven?' },
  { key: 'risk', kicker: 'Risk', label: 'Risk', question: 'Which programs are blocked by governance, controls, or weak proof?' },
  { key: 'evidence', kicker: 'Evidence', label: 'Evidence', question: 'Which decisions are backed strongly enough for executive challenge?' },
  { key: 'actions', kicker: 'Actions', label: 'Actions', question: 'What should go to the next steering meeting?' },
];

const SUGGESTED_QUESTIONS = [
  'Which AI initiatives should we scale, hold, restructure, or kill?',
  'Where is AI spend not backed by evidence?',
  'Which function has the biggest adoption gap?',
  'What should go to the next steering meeting?',
];

const TOWER_ASK_TEXTAREA_MAX_HEIGHT = 156;

function resizeTowerAskTextarea(el: HTMLTextAreaElement) {
  el.style.height = 'auto';
  const nextHeight = Math.min(el.scrollHeight, TOWER_ASK_TEXTAREA_MAX_HEIGHT);
  el.style.height = `${nextHeight}px`;
  el.style.overflowY = el.scrollHeight > TOWER_ASK_TEXTAREA_MAX_HEIGHT ? 'auto' : 'hidden';
}

const COLORS = {
  bg: '#f8f7f2',
  panel: '#fffefa',
  ink: '#171717',
  muted: '#625f58',
  line: '#ded9ce',
  navy: '#102650',
  blue: '#2f5ea8',
  green: '#31765b',
  amber: '#a66a1f',
  red: '#9e332e',
  wash: '#f1eee7',
  serif: 'var(--font-fraunces), Georgia, serif',
  sans: 'var(--font-geist-sans), Inter, system-ui, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
} as const;

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

function toneColor(tone: string): string {
  if (tone === 'green' || tone === 'committed' || tone === 'retrieval_proven') return COLORS.green;
  if (tone === 'amber' || tone === 'review_required' || tone === 'partial' || tone === 'medium') return COLORS.amber;
  if (tone === 'red' || tone === 'missing' || tone === 'fail' || tone === 'critical' || tone === 'high') return COLORS.red;
  if (tone === 'blue') return COLORS.blue;
  return COLORS.muted;
}

function rowFunction(row: { functionName?: string }): string {
  return row.functionName || 'Unassigned';
}

function filterByFunction<T extends { functionName?: string }>(rows: T[], selectedFunction: string): T[] {
  if (selectedFunction === 'All') return rows;
  return rows.filter((row) => rowFunction(row) === selectedFunction);
}

function topInitiatives(model: AiControlTowerReadModel, selectedFunction: string): AiControlTowerInitiativeRead[] {
  return filterByFunction(model.initiatives, selectedFunction)
    .sort((a, b) => b.realizedUsd - a.realizedUsd || b.promisedUsd - a.promisedUsd)
    .slice(0, 8);
}

export function AiControlTowerPage({ model }: AiControlTowerPageProps) {
  const enterpriseRead = model.derivedEnterpriseRead ?? null;
  const [activeTab, setActiveTab] = useState<TowerTab>('value');
  const [selectedFunction, setSelectedFunction] = useState('All');
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string | null>(model.initiatives[0]?.id ?? null);
  const [draft, setDraft] = useState('');
  const draftRef = useRef<HTMLTextAreaElement | null>(null);
  const [pending, setPending] = useState(false);
  const [answer, setAnswer] = useState<AtlasAnswer | null>(() => ({
    headline: enterpriseRead?.headline ?? (model.initiatives.length
      ? `I am watching ${model.tenantName}'s AI portfolio across ${model.functions.length} functions, ${model.initiatives.length} initiatives, ${model.spend.length} spend rows, and ${model.evidence.length} evidence links.`
      : 'aVa is ready, but this tenant does not yet have committed AI Control Tower rows.'),
    body: enterpriseRead
      ? `${enterpriseRead.executiveSummary}\n\nTower implication: AI portfolio decisions should be read against this enterprise context before scaling, holding, or funding initiatives.`
      : undefined,
    disclosure: model.sourceDisclosure,
    columns: ['Area', 'Loaded rows', 'Readiness'],
    rows: [
      ...(enterpriseRead ? [['Enterprise read', String(enterpriseRead.insights.length), 'derived']] : []),
      ['Initiatives', String(model.rowCounts.initiatives), model.rowCounts.initiatives > 0 ? 'loaded' : 'missing'],
      ['Spend', String(model.rowCounts.spend), model.rowCounts.spend > 0 ? 'loaded' : 'missing'],
      ['Evidence', String(model.rowCounts.evidence), model.rowCounts.evidence > 0 ? 'loaded' : 'missing'],
    ],
    choices: [
      { label: 'Value', tab: 'value' },
      { label: 'Risk', tab: 'risk' },
      { label: 'Evidence', tab: 'evidence' },
    ],
    citations: [],
  }));

  const functionOptions = useMemo(
    () => ['All', ...model.functions.map((row) => row.name).filter(Boolean)],
    [model.functions],
  );
  const selectedInitiative = model.initiatives.find((row) => row.id === selectedInitiativeId) ?? model.initiatives[0] ?? null;
  const tabMeta = TABS.find((tab) => tab.key === activeTab) ?? TABS[0];

  const submitQuestion = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || pending) return;
    setDraft('');
    if (draftRef.current) {
      draftRef.current.style.height = 'auto';
      draftRef.current.style.overflowY = 'hidden';
    }
    setPending(true);
    try {
      const res = await fetch('/api/tower/cio-chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as CioTowerChatResponse & { detail?: string };
      if (!res.ok || !data.modelOutput) {
        throw new Error(data.detail || `cio_tower_chat_http_${res.status}`);
      }
      setAnswer({
        headline: '',
        body: data.modelOutput.answer,
        disclosure: model.sourceDisclosure,
        columns: [],
        rows: [],
        modelTables: data.modelOutput.tables ?? [],
        modelTabs: data.modelOutput.tabs ?? [],
        choices: [],
        followUps: data.modelOutput.followUpQuestion
          ? [{ label: data.modelOutput.followUpQuestion, value: data.modelOutput.followUpQuestion }]
          : [],
        citations: [],
      });
    } catch (error) {
      setAnswer({
        headline: '',
        body: `aVa could not produce a valid Tower answer contract. ${error instanceof Error ? error.message : 'Try again after the prompt contract is corrected.'}`,
        disclosure: 'No fallback answer was generated.',
        columns: [],
        rows: [],
        choices: [],
        citations: [],
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.kicker}>PORTFOLIO COMMAND CENTER · {model.tenantName.toUpperCase()}</p>
          <h1 style={styles.h1}>Where technology money is going, what value is showing up, and what needs intervention.</h1>
          <p style={styles.lede}>{enterpriseRead?.headline ?? 'A leadership view of spend, value, adoption, risk, vendor exposure, agent outcomes, and the decisions that need attention.'}</p>
        </div>
        <div style={styles.metaBox}>
          <span>Refresh period</span>
          <strong>{model.reportingPeriodEnd ?? 'not committed'}</strong>
          <span>{model.source === 'ai_control_data_plane' ? 'Committed portfolio data' : 'Demo data only'}</span>
        </div>
      </section>

      {model.source !== 'ai_control_data_plane' ? (
        <div style={styles.disclosure}>{model.sourceDisclosure}</div>
      ) : null}

      {enterpriseRead ? (
        <section style={styles.enterpriseReadBand} aria-label="Enterprise context read">
          <div>
            <p style={styles.smallKicker}>ENTERPRISE READ</p>
            <strong>{enterpriseRead.maturityRead}</strong>
            <span>{enterpriseRead.northStar}</span>
          </div>
          <div>
            <p style={styles.smallKicker}>RECOMMENDED MOVE</p>
            <strong>{enterpriseRead.recommendedMoves[0]?.title ?? 'Review enterprise context before scaling AI'}</strong>
            <span>{enterpriseRead.recommendedMoves[0]?.decision ?? enterpriseRead.whatThisMeans}</span>
          </div>
        </section>
      ) : null}

      <section style={styles.kpiGrid}>
        {model.kpis.map((kpi) => <KpiCard key={kpi.key} kpi={kpi} />)}
      </section>

      <section style={styles.segmentBar}>
        <div>
          <p style={styles.smallKicker}>FUNCTION SEGMENT</p>
          <select
            aria-label="Function segment"
            value={selectedFunction}
            onChange={(event) => setSelectedFunction(event.target.value)}
            style={styles.select}
          >
            {functionOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </div>
        <div style={styles.functionStrip}>
          {model.functions.slice(0, 8).map((row) => (
            <button
              key={row.name}
              type="button"
              onClick={() => setSelectedFunction(row.name)}
              style={{
                ...styles.functionChip,
                borderColor: selectedFunction === row.name ? COLORS.navy : COLORS.line,
              }}
            >
              <strong>{row.name}</strong>
              <span>{pct(row.adoptionPct)} adoption · {money(row.realizedUsd)} value</span>
            </button>
          ))}
        </div>
      </section>

      <nav aria-label="AI Control Tower lenses" style={styles.tabs}>
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
            {tab.kicker !== tab.label ? <span>{tab.kicker}</span> : null}
            <strong>{tab.label}</strong>
          </button>
        ))}
      </nav>

      <section style={styles.workspace}>
        <aside style={styles.atlas}>
          <p style={styles.kicker}>aVa · Tower</p>
          <div style={styles.agentIdentity}>
            <AvaWordmark tone="light" style={{ width: 58 }} />
            <h2 style={styles.asideTitle}>Ask about the portfolio.</h2>
          </div>
          <div style={styles.answerBox}>
            {pending ? (
              <p style={{ color: COLORS.muted, fontStyle: 'italic', margin: 0 }}>
                aVa is reading the committed context…
              </p>
            ) : answer ? (
              <>
                {answer.headline ? <strong>{answer.headline}</strong> : null}
                {answer.body ? <p style={{ whiteSpace: 'pre-wrap', margin: '0 0 8px' }}>{answer.body}</p> : null}
                {answer.disclosure ? <p>{answer.disclosure}</p> : null}
                {answer.rows.length > 0 ? <MiniTable columns={answer.columns} rows={answer.rows} /> : null}
                {answer.modelTables?.map((table) => (
                  <VisibleAnswerTable key={table.id} table={table} />
                ))}
                {answer.modelTabs?.map((tab) => (
                  <VisibleAnswerTab key={tab.id} tab={tab} />
                ))}
                {answer.citations.length > 0 ? (
                  <div style={styles.citationRow}>
                    {answer.citations.slice(0, 4).map((citation) => <span key={citation}>{citation}</span>)}
                  </div>
                ) : null}
                {answer.choices.length > 0 ? (
                  <div style={styles.choiceRow}>
                    {answer.choices.map((choice) => (
                      <button key={`${choice.label}-${choice.tab}`} type="button" onClick={() => setActiveTab(choice.tab)} style={styles.choiceButton}>
                        {choice.label}
                      </button>
                    ))}
                  </div>
                ) : null}
                {answer.followUps && answer.followUps.length > 0 ? (
                  <div style={styles.choiceRow}>
                    {answer.followUps.map((followUp) => (
                      <button key={followUp.value} type="button" onClick={() => submitQuestion(followUp.value)} style={styles.choiceButton}>
                        {followUp.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
          <div style={styles.suggested}>
            {SUGGESTED_QUESTIONS.map((question) => (
              <button key={question} type="button" onClick={() => submitQuestion(question)} style={styles.suggestion}>
                {question}
              </button>
            ))}
          </div>
          <form
            style={styles.askForm}
            onSubmit={(event) => {
              event.preventDefault();
              submitQuestion(draft);
            }}
          >
            <textarea
              ref={draftRef}
              aria-label="Ask aVa"
              rows={1}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                resizeTowerAskTextarea(event.target);
              }}
              onFocus={(event) => resizeTowerAskTextarea(event.target)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  submitQuestion(draft);
                }
              }}
              placeholder="Ask aVa..."
              style={styles.askInput}
              disabled={pending}
            />
            <button type="submit" style={styles.askButton} disabled={pending}>{pending ? '…' : 'Ask'}</button>
          </form>
          <p style={styles.guardrail}>Human approval required: aVa proposes; named leaders approve writes, submissions, and external actions.</p>
        </aside>

        <section style={styles.canvas}>
          <div style={styles.canvasHeader}>
            <div>
              <p style={styles.kicker}>{tabMeta.kicker}</p>
              <h2 style={styles.h2}>{tabMeta.question}</h2>
            </div>
            <span style={styles.datePill}>{model.reportingPeriodEnd ?? 'no refresh'}</span>
          </div>
          <LensCanvas
            model={model}
            activeTab={activeTab}
            selectedFunction={selectedFunction}
            selectedInitiative={selectedInitiative}
            onSelectInitiative={setSelectedInitiativeId}
          />
        </section>
      </section>
    </main>
  );
}

function KpiCard({ kpi }: { kpi: AiControlTowerKpi }) {
  return (
    <article style={styles.kpiCard}>
      <p style={styles.smallKicker}>{kpi.label}</p>
      <div style={styles.kpiValueRow}>
        <strong style={styles.kpiValue}>{kpi.value}</strong>
        <span style={{ ...styles.badge, color: toneColor(kpi.tone), borderColor: `${toneColor(kpi.tone)}55`, background: `${toneColor(kpi.tone)}13` }}>
          {kpi.tone}
        </span>
      </div>
      <p style={styles.kpiNote}>{kpi.note}</p>
    </article>
  );
}

function MiniTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div style={styles.miniTableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.join('-')}-${index}`}>
              {row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VisibleAnswerTable({ table }: { table: VisibleTable }) {
  return (
    <section style={styles.visibleTableSection}>
      <h3 style={styles.visibleTableTitle}>{table.title}</h3>
      <MiniTable columns={table.columns} rows={table.rows} />
    </section>
  );
}

function VisibleAnswerTab({ tab }: { tab: VisibleTab }) {
  return (
    <section style={styles.visibleTabSection}>
      <h3 style={styles.visibleTableTitle}>{tab.label}</h3>
      <p style={{ whiteSpace: 'pre-wrap', margin: '0 0 8px' }}>{tab.prose}</p>
      {tab.tables?.map((table) => <VisibleAnswerTable key={table.id} table={table} />)}
    </section>
  );
}

function LensCanvas({
  model,
  activeTab,
  selectedFunction,
  selectedInitiative,
  onSelectInitiative,
}: {
  model: AiControlTowerReadModel;
  activeTab: TowerTab;
  selectedFunction: string;
  selectedInitiative: AiControlTowerInitiativeRead | null;
  onSelectInitiative: (id: string) => void;
}) {
  if (activeTab === 'initiatives') {
    const rows = filterByFunction(model.initiatives, selectedFunction);
    return (
      <div style={styles.twoCol}>
        <div>
          <label style={styles.label}>
            Select initiative
            <select
              value={selectedInitiative?.id ?? ''}
              onChange={(event) => onSelectInitiative(event.target.value)}
              style={styles.wideSelect}
            >
              {rows.map((row) => <option key={row.id} value={row.id}>{row.id} · {row.title}</option>)}
            </select>
          </label>
          <InitiativeTable rows={rows} onSelect={onSelectInitiative} />
        </div>
        <InitiativeDetail initiative={selectedInitiative} evidence={model.evidence} risks={model.risks} />
      </div>
    );
  }

  if (activeTab === 'adoption') {
    const rows = selectedFunction === 'All'
      ? model.functions
      : model.functions.filter((row) => row.name === selectedFunction);
    return <FunctionTable rows={rows} />;
  }

  if (activeTab === 'productivity') {
    return <ProductivityTable rows={filterByFunction(model.productivity, selectedFunction)} />;
  }

  if (activeTab === 'agents') {
    return <AgentsTable rows={filterByFunction(model.agents, selectedFunction)} />;
  }

  if (activeTab === 'spend') {
    return <SpendTable rows={filterByFunction(model.spend, selectedFunction)} />;
  }

  if (activeTab === 'risk') {
    return <RiskTable rows={filterByFunction(model.risks, selectedFunction)} />;
  }

  if (activeTab === 'evidence') {
    return <EvidenceTable rows={model.evidence} facts={model.facts.length} />;
  }

  if (activeTab === 'actions') {
    return <ActionsTable rows={model.actions} />;
  }

  return <InitiativeTable rows={topInitiatives(model, selectedFunction)} onSelect={onSelectInitiative} />;
}

function InitiativeTable({ rows, onSelect }: { rows: AiControlTowerInitiativeRead[]; onSelect: (id: string) => void }) {
  if (rows.length === 0) return <EmptyState message="No initiatives loaded for this function." />;
  return (
    <TableShell>
      <thead>
        <tr>
          <th>Initiative</th>
          <th>Function</th>
          <th>Owner</th>
          <th>Metric</th>
          <th>Realized</th>
          <th>Evidence</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} onClick={() => onSelect(row.id)} style={styles.clickRow}>
            <td><strong>{row.title}</strong><br /><span>{row.id}</span></td>
            <td>{row.functionName}</td>
            <td>{row.owner}</td>
            <td>{row.metric}</td>
            <td>{money(row.realizedUsd)} / {money(row.promisedUsd)}</td>
            <td><Badge label={row.evidenceState} /></td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}

function FunctionTable({ rows }: { rows: AiControlTowerFunctionRead[] }) {
  if (rows.length === 0) return <EmptyState message="No function scorecard rows are loaded." />;
  return (
    <TableShell>
      <thead>
        <tr>
          <th>Function</th>
          <th>Adoption</th>
          <th>Spend</th>
          <th>Realized</th>
          <th>Driver</th>
          <th>Blocker</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name}>
            <td><strong>{row.name}</strong><br /><span>{row.initiatives} initiatives</span></td>
            <td>{pct(row.adoptionPct)}<br /><span>{row.activeUsers.toLocaleString()} / {row.seats.toLocaleString()}</span></td>
            <td>{money(row.spendUsd)}</td>
            <td>{money(row.realizedUsd)}</td>
            <td>{row.driver}</td>
            <td>{row.blocker}</td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}

function ProductivityTable({ rows }: { rows: AiControlTowerProductivityRead[] }) {
  if (rows.length === 0) return <EmptyState message="No persona productivity or DORA baseline rows are loaded." />;
  return (
    <TableShell>
      <thead><tr><th>Persona / team</th><th>Function</th><th>Workflow</th><th>Metric</th><th>Before / current / target</th><th>Confidence</th></tr></thead>
      <tbody>{rows.map((row) => (
        <tr key={row.id}>
          <td><strong>{row.persona}</strong></td>
          <td>{row.functionName}</td>
          <td>{row.workflow}</td>
          <td>{row.metric}</td>
          <td>{row.baseline ?? 'n/a'} / {row.current ?? 'n/a'} / {row.target ?? 'n/a'} {row.unit}</td>
          <td><Badge label={row.confidence} /></td>
        </tr>
      ))}</tbody>
    </TableShell>
  );
}

function AgentsTable({ rows }: { rows: AiControlTowerAgentRead[] }) {
  if (rows.length === 0) return <EmptyState message="No ServiceNow, ERP, Workday, SAP, or platform agent outcome rows are loaded." />;
  return (
    <TableShell>
      <thead><tr><th>Agent</th><th>Function</th><th>Vendor</th><th>Workflow</th><th>Resolution</th><th>Governance</th></tr></thead>
      <tbody>{rows.map((row) => (
        <tr key={row.id}>
          <td><strong>{row.name}</strong><br /><span>{row.module}</span></td>
          <td>{row.functionName}</td>
          <td>{row.vendor}</td>
          <td>{row.workflow}</td>
          <td>{pct(row.autoResolvePct)} auto · {pct(row.deflectionPct)} touched</td>
          <td><Badge label={row.evidenceState} /></td>
        </tr>
      ))}</tbody>
    </TableShell>
  );
}

function SpendTable({ rows }: { rows: AiControlTowerSpendRead[] }) {
  if (rows.length === 0) return <EmptyState message="No spend contracts or AI tool billing rows are committed for this segment." />;
  return (
    <TableShell>
      <thead><tr><th>Vendor / product</th><th>Function</th><th>Initiative</th><th>Annual spend</th><th>Renewal</th><th>Evidence</th></tr></thead>
      <tbody>{rows.map((row) => (
        <tr key={row.id}>
          <td><strong>{row.vendor}</strong><br /><span>{row.product}</span></td>
          <td>{row.functionName}</td>
          <td>{row.initiativeId ?? 'unlinked'}</td>
          <td>{money(row.annualizedSpendUsd)}</td>
          <td>{row.renewalDate ?? 'n/a'}</td>
          <td><Badge label={row.evidenceState} /></td>
        </tr>
      ))}</tbody>
    </TableShell>
  );
}

function RiskTable({ rows }: { rows: AiControlTowerRiskRead[] }) {
  if (rows.length === 0) return <EmptyState message="No risk or governance rows are loaded for this segment." />;
  return (
    <TableShell>
      <thead><tr><th>Risk</th><th>Function</th><th>Severity</th><th>Gate</th><th>Owner</th><th>Required action</th></tr></thead>
      <tbody>{rows.map((row) => (
        <tr key={row.id}>
          <td><strong>{row.name || row.dimension}</strong><br /><span>{row.description}</span></td>
          <td>{row.functionName}</td>
          <td><Badge label={row.severity} /></td>
          <td>{row.gate || 'n/a'}</td>
          <td>{row.owner}</td>
          <td>{row.requiredAction}</td>
        </tr>
      ))}</tbody>
    </TableShell>
  );
}

function EvidenceTable({ rows, facts }: { rows: AiControlTowerEvidenceRead[]; facts: number }) {
  if (rows.length === 0) return <EmptyState message={`No committed evidence rows are available. aVa has ${facts} context facts but cannot cite source rows until evidence is committed.`} />;
  return (
    <TableShell>
      <thead><tr><th>Evidence</th><th>Record</th><th>Type</th><th>Pointer</th><th>State</th><th>Confidence</th></tr></thead>
      <tbody>{rows.slice(0, 30).map((row) => (
        <tr key={row.id}>
          <td><strong>{row.citationLabel}</strong><br /><span>{row.id}</span></td>
          <td>{row.recordType} · {row.recordKey}</td>
          <td>{row.evidenceType}</td>
          <td>{row.pointer}</td>
          <td><Badge label={row.evidenceState} /></td>
          <td>{row.confidence === null ? 'n/a' : `${Math.round(row.confidence * 100)}%`}</td>
        </tr>
      ))}</tbody>
    </TableShell>
  );
}

function ActionsTable({ rows }: { rows: AiControlTowerActionRead[] }) {
  if (rows.length === 0) return <EmptyState message="No derived steering actions are loaded yet." />;
  return (
    <TableShell>
      <thead><tr><th>Proposal</th><th>Posture</th><th>Owner</th><th>Due</th><th>Rationale</th><th>Human gate</th></tr></thead>
      <tbody>{rows.map((row) => (
        <tr key={row.id}>
          <td><strong>{row.title}</strong><br /><span>{row.relatedType} · {row.relatedKey}</span></td>
          <td><Badge label={row.posture} /></td>
          <td>{row.owner}</td>
          <td>{row.dueDate ?? 'n/a'}</td>
          <td>{row.rationale}</td>
          <td>Required</td>
        </tr>
      ))}</tbody>
    </TableShell>
  );
}

function InitiativeDetail({
  initiative,
  evidence,
  risks,
}: {
  initiative: AiControlTowerInitiativeRead | null;
  evidence: AiControlTowerEvidenceRead[];
  risks: AiControlTowerRiskRead[];
}) {
  if (!initiative) return <EmptyState message="Pick an initiative to see owner, scope, value, evidence, and governance posture." />;
  const initiativeEvidence = evidence.filter((row) => row.recordKey === initiative.id);
  const initiativeRisks = risks.filter((row) => row.initiativeId === initiative.id);
  return (
    <aside style={styles.detailPanel}>
      <p style={styles.kicker}>INITIATIVE DETAIL</p>
      <h3 style={styles.detailTitle}>{initiative.title}</h3>
      <dl style={styles.detailGrid}>
        <div><dt>Owner</dt><dd>{initiative.owner}</dd></div>
        <div><dt>Function</dt><dd>{initiative.functionName}</dd></div>
        <div><dt>Promised</dt><dd>{money(initiative.promisedUsd)}</dd></div>
        <div><dt>Realized</dt><dd>{money(initiative.realizedUsd)} · {pct(initiative.realizedPct)}</dd></div>
        <div><dt>Metric</dt><dd>{initiative.metric}</dd></div>
        <div><dt>Evidence</dt><dd>{initiative.evidenceState}</dd></div>
      </dl>
      <p style={styles.detailCopy}>{initiative.promisedBenefit}</p>
      <h4 style={styles.detailSection}>Risks</h4>
      {initiativeRisks.length > 0 ? initiativeRisks.map((risk) => <p key={risk.id} style={styles.detailCopy}>{risk.description}</p>) : <p style={styles.detailCopy}>No linked risk rows.</p>}
      <h4 style={styles.detailSection}>Citations</h4>
      <div style={styles.citationRow}>
        {initiativeEvidence.length > 0
          ? initiativeEvidence.slice(0, 5).map((row) => <span key={row.id}>{row.citationLabel}</span>)
          : <span>No evidence row linked</span>}
      </div>
    </aside>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span style={{ ...styles.badge, color: toneColor(label), borderColor: `${toneColor(label)}55`, background: `${toneColor(label)}13` }}>
      {label || 'n/a'}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div style={styles.empty}>{message}</div>;
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>{children}</table>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: COLORS.bg,
    color: COLORS.ink,
    fontFamily: COLORS.sans,
    padding: '20px clamp(18px, 3vw, 34px) 30px',
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
    fontWeight: 800,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  smallKicker: {
    margin: 0,
    color: COLORS.muted,
    fontFamily: COLORS.mono,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  h1: {
    margin: '6px 0 4px',
    fontFamily: COLORS.serif,
    fontSize: 'clamp(26px, 2.8vw, 42px)',
    lineHeight: 1.05,
    letterSpacing: 0,
    maxWidth: 980,
  },
  h2: {
    margin: '5px 0 0',
    fontFamily: COLORS.serif,
    fontSize: 23,
    lineHeight: 1.12,
    letterSpacing: 0,
  },
  lede: {
    margin: 0,
    maxWidth: 760,
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 1.35,
  },
  metaBox: {
    display: 'grid',
    gap: 4,
    minWidth: 170,
    border: `1px solid ${COLORS.line}`,
    borderRadius: 8,
    padding: 12,
    background: COLORS.panel,
    fontSize: 12,
  },
  disclosure: {
    marginTop: 14,
    border: `1px solid ${COLORS.amber}55`,
    borderRadius: 8,
    background: '#fff5df',
    color: '#6f4717',
    padding: '10px 12px',
    fontSize: 13,
    lineHeight: 1.35,
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(150px, 1fr))',
    gap: 10,
    marginTop: 14,
  },
  kpiCard: {
    background: COLORS.panel,
    border: `1px solid ${COLORS.line}`,
    borderRadius: 8,
    padding: 13,
    minHeight: 98,
  },
  kpiValueRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    marginTop: 6,
  },
  kpiValue: {
    fontFamily: COLORS.serif,
    fontSize: 31,
    lineHeight: 1,
  },
  kpiNote: {
    margin: '8px 0 0',
    color: COLORS.muted,
    fontSize: 12,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
    border: '1px solid',
    borderRadius: 999,
    padding: '3px 8px',
    fontFamily: COLORS.mono,
    fontSize: 10,
    fontWeight: 900,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  segmentBar: {
    display: 'grid',
    gridTemplateColumns: '220px 1fr',
    gap: 14,
    marginTop: 14,
    alignItems: 'end',
  },
  select: {
    width: '100%',
    marginTop: 6,
    border: `1px solid ${COLORS.line}`,
    borderRadius: 6,
    padding: '9px 10px',
    background: COLORS.panel,
    color: COLORS.ink,
    fontWeight: 750,
  },
  wideSelect: {
    width: '100%',
    marginTop: 7,
    border: `1px solid ${COLORS.line}`,
    borderRadius: 6,
    padding: '10px',
    background: COLORS.panel,
    color: COLORS.ink,
    fontWeight: 700,
  },
  functionStrip: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto',
    paddingBottom: 1,
  },
  functionChip: {
    display: 'grid',
    gap: 4,
    minWidth: 190,
    background: COLORS.panel,
    border: '1px solid',
    borderRadius: 8,
    padding: '9px 10px',
    textAlign: 'left',
    color: COLORS.ink,
    cursor: 'pointer',
  },
  tabs: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  tab: {
    minWidth: 112,
    background: COLORS.panel,
    border: '1px solid',
    borderRadius: 7,
    padding: '9px 12px',
    color: COLORS.ink,
    cursor: 'pointer',
  },
  workspace: {
    display: 'grid',
    gridTemplateColumns: '340px minmax(0, 1fr)',
    gap: 14,
    marginTop: 14,
    alignItems: 'start',
  },
  atlas: {
    position: 'sticky',
    top: 12,
    display: 'grid',
    gap: 12,
    background: COLORS.panel,
    border: `1px solid ${COLORS.line}`,
    borderRadius: 8,
    padding: 14,
  },
  asideTitle: {
    margin: 0,
    fontFamily: COLORS.serif,
    fontSize: 24,
    letterSpacing: 0,
  },
  agentIdentity: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  answerBox: {
    display: 'grid',
    gap: 10,
    border: `1px solid ${COLORS.line}`,
    borderRadius: 8,
    padding: 12,
    background: '#fbfaf7',
    fontSize: 13,
    lineHeight: 1.35,
  },
  suggested: {
    display: 'grid',
    gap: 7,
  },
  suggestion: {
    width: '100%',
    border: `1px solid ${COLORS.line}`,
    borderRadius: 7,
    background: COLORS.panel,
    color: COLORS.ink,
    padding: '9px 10px',
    textAlign: 'left',
    cursor: 'pointer',
  },
  askForm: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: 8,
  },
  askInput: {
    minWidth: 0,
    minHeight: 42,
    maxHeight: TOWER_ASK_TEXTAREA_MAX_HEIGHT,
    border: `1px solid ${COLORS.line}`,
    borderRadius: 7,
    padding: '10px',
    background: COLORS.panel,
    color: COLORS.ink,
    font: 'inherit',
    lineHeight: 1.45,
    resize: 'none',
    overflowY: 'hidden',
  },
  askButton: {
    border: 'none',
    borderRadius: 7,
    padding: '0 13px',
    background: COLORS.navy,
    color: 'white',
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
  enterpriseReadBand: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
    gap: 10,
    marginTop: 12,
    border: `1px solid ${COLORS.line}`,
    borderRadius: 8,
    background: COLORS.panel,
    padding: 13,
  },
  choiceRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 7,
  },
  choiceButton: {
    border: `1px solid ${COLORS.line}`,
    borderRadius: 999,
    background: COLORS.panel,
    padding: '5px 9px',
    color: COLORS.ink,
    cursor: 'pointer',
    fontSize: 12,
  },
  citationRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  canvas: {
    minWidth: 0,
    background: COLORS.panel,
    border: `1px solid ${COLORS.line}`,
    borderRadius: 8,
    padding: 14,
  },
  canvasHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 14,
    alignItems: 'flex-start',
    borderBottom: `1px solid ${COLORS.line}`,
    paddingBottom: 12,
    marginBottom: 12,
  },
  datePill: {
    border: `1px solid ${COLORS.blue}44`,
    borderRadius: 999,
    background: '#eff5ff',
    color: COLORS.blue,
    padding: '5px 9px',
    fontFamily: COLORS.mono,
    fontSize: 11,
    fontWeight: 850,
    whiteSpace: 'nowrap',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  miniTableWrap: {
    overflowX: 'auto',
    maxHeight: 260,
  },
  visibleTableSection: {
    display: 'grid',
    gap: 6,
    borderTop: `1px solid ${COLORS.line}`,
    paddingTop: 8,
  },
  visibleTabSection: {
    display: 'grid',
    gap: 7,
    borderTop: `1px solid ${COLORS.line}`,
    paddingTop: 8,
  },
  visibleTableTitle: {
    margin: 0,
    color: COLORS.ink,
    fontFamily: COLORS.serif,
    fontSize: 18,
    lineHeight: 1.15,
    letterSpacing: 0,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 12,
  },
  clickRow: {
    cursor: 'pointer',
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.55fr) minmax(280px, 0.85fr)',
    gap: 14,
    alignItems: 'start',
  },
  label: {
    display: 'grid',
    gap: 4,
    marginBottom: 10,
    color: COLORS.muted,
    fontFamily: COLORS.mono,
    fontSize: 10,
    fontWeight: 850,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  detailPanel: {
    border: `1px solid ${COLORS.line}`,
    borderRadius: 8,
    background: '#fbfaf7',
    padding: 13,
  },
  detailTitle: {
    margin: '5px 0 10px',
    fontFamily: COLORS.serif,
    fontSize: 24,
    lineHeight: 1.05,
    letterSpacing: 0,
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    margin: 0,
  },
  detailCopy: {
    margin: '10px 0 0',
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 1.4,
  },
  detailSection: {
    margin: '14px 0 0',
    fontFamily: COLORS.mono,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  empty: {
    border: `1px dashed ${COLORS.line}`,
    borderRadius: 8,
    padding: 22,
    color: COLORS.muted,
    background: '#fbfaf7',
    fontSize: 14,
  },
};
