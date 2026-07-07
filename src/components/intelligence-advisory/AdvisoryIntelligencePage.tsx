'use client';

import { useMemo, useState } from 'react';
import type {
  EnterpriseLandscapeViewModel,
  LandscapeSection,
  LandscapeTone,
} from '@/lib/home/enterprise-landscape-view-model';
import type { AvaAnswerPacket } from '@/lib/ava-answer/contract';
import styles from './AdvisoryIntelligencePage.module.css';

type CorpusTab = 'outlook' | 'peer' | 'adoption' | 'trends' | 'value' | 'risk';

type AskSource = {
  id?: string;
  type?: string;
  name?: string;
  detail?: string;
  confidence?: number;
};

type AskTrace = {
  modelCall?: unknown;
  evidenceSelection?: {
    selectedReadModels?: string[];
    selectedMetricSnapshots?: Array<{ id?: string; name?: string; detail?: string }>;
    selectedGaps?: string[];
    selectedCitations?: Array<{ id?: string; name?: string; type?: string; confidence?: number }>;
  };
  apiPayload?: {
    answer?: string;
  };
};

type AssistantMessage = {
  id: string;
  role: 'assistant';
  question: string;
  answer: string;
  agentAnswer?: AvaAnswerPacket | null;
  status: 'thinking' | 'streaming' | 'done' | 'error';
  sources: AskSource[];
  followups: string[];
  trace: AskTrace | null;
  error?: string;
};

type UserMessage = {
  id: string;
  role: 'user';
  text: string;
};

type ThreadMessage = AssistantMessage | UserMessage;

const CORPUS_TABS: Array<{ id: CorpusTab; label: string }> = [
  { id: 'outlook', label: 'Industry Outlook' },
  { id: 'peer', label: 'Peer Benchmarks' },
  { id: 'adoption', label: 'AI-Adoption Curve' },
  { id: 'trends', label: 'Future Trends' },
  { id: 'value', label: 'Cost & Value Signals' },
  { id: 'risk', label: 'Risk & Regulatory' },
];

const STARTER_PROMPTS = [
  'Where should we fund AI first?',
  'What has to be true before we scale?',
  'Which proof gaps should the CIO and CFO inspect?',
];

export function AdvisoryIntelligencePage({ viewModel }: { viewModel: EnterpriseLandscapeViewModel }) {
  const sectionList = useMemo(() => Object.values(viewModel.sections), [viewModel.sections]);
  const [activeTab, setActiveTab] = useState<CorpusTab>('outlook');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  const briefing = useMemo(() => buildCorpusBriefing(viewModel, sectionList), [viewModel, sectionList]);
  const latestAssistant = [...messages].reverse().find((m): m is AssistantMessage => m.role === 'assistant');

  async function submitAsk(input: string = question) {
    const trimmed = input.trim();
    if (!trimmed || isAsking) return;
    const messageIndex = messages.length;

    const userMsg: UserMessage = { id: `u-${messageIndex}`, role: 'user', text: trimmed };
    const assistantId = `a-${messageIndex + 1}`;
    const assistantMsg: AssistantMessage = {
      id: assistantId,
      role: 'assistant',
      question: trimmed,
      answer: '',
      status: 'thinking',
      sources: [],
      followups: [],
      trace: null,
    };

    setMessages((c) => [...c, userMsg, assistantMsg]);
    setQuestion('');
    setIsAsking(true);

    try {
      const response = await fetch('/api/intelligence/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmed,
          client: viewModel.clientKey,
          format: 'rich',
          richText: true,
          traceEnabled: true,
          surfaceContext: buildSurfaceContext(viewModel, sectionList),
        }),
      });

      if (!response.ok || !response.body) throw new Error(`Ask failed with ${response.status}`);

      setMessages((c) => c.map((m) => m.id === assistantId && m.role === 'assistant' ? { ...m, status: 'streaming' } : m));

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) applyAskEvent(assistantId, line);
      }
      if (buffer.trim()) applyAskEvent(assistantId, buffer);

      setMessages((c) =>
        c.map((m) =>
          m.id === assistantId && m.role === 'assistant'
            ? { ...m, status: m.status === 'error' ? 'error' : 'done' }
            : m,
        ),
      );
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown ask error';
      setMessages((c) =>
        c.map((m) =>
          m.id === assistantId && m.role === 'assistant'
            ? { ...m, status: 'error', error, answer: 'The live model path could not complete this answer.' }
            : m,
        ),
      );
    } finally {
      setIsAsking(false);
    }
  }

  function applyAskEvent(assistantId: string, line: string) {
    if (!line.trim()) return;
    let event: Record<string, unknown>;
    try { event = JSON.parse(line) as Record<string, unknown>; } catch { return; }
    setMessages((c) =>
      c.map((m) => {
        if (m.id !== assistantId || m.role !== 'assistant') return m;
        if (event.type === 'delta') {
          const delta = eventText(event);
          return delta ? { ...m, answer: `${m.answer}${delta}` } : m;
        }
        if (event.type === 'agent-answer' && isAvaAnswerPacket(event.answer)) {
          return {
            ...m,
            agentAnswer: event.answer,
            answer: answerBodyFromPacket(event.answer) || m.answer,
            sources: event.answer.citations.map((c) => ({
              id: c.id, type: c.sourceClass, name: c.label, detail: c.excerpt,
              confidence: c.confidence === 'high' ? 0.9 : c.confidence === 'medium' ? 0.65 : c.confidence === 'low' ? 0.35 : undefined,
            })),
            followups: event.answer.nextSteps.map((s) => s.label).filter((s): s is string => Boolean(s?.trim())).slice(0, 3),
          };
        }
        if (event.type === 'sources' && Array.isArray(event.sources)) return { ...m, sources: event.sources as AskSource[] };
        if (event.type === 'followups' && Array.isArray(event.followups)) {
          return { ...m, followups: (event.followups as unknown[]).filter((s): s is string => typeof s === 'string').slice(0, 3) };
        }
        if (event.type === 'trace' && typeof event.trace === 'object' && event.trace !== null) return { ...m, trace: event.trace as AskTrace };
        if (event.type === 'error') return { ...m, status: 'error', error: typeof event.error === 'string' ? event.error : 'Unknown ask error' };
        return m;
      }),
    );
  }

  return (
    <main className={styles.surface} data-testid="intelligence-advisory-surface">

      {/* ══ LEFT: Intelligence Advisor ══ */}
      <section className={styles.advisorZone} aria-label="aVa Intelligence advisor">
        <header className={styles.advisorHead}>
          <div className={styles.adv_row}>
            <div className={styles.avatar}>a</div>
            <div>
              <div className={styles.agentName}>Your Analyst</div>
              <div className={styles.agentSub}>aVa · grounded in {viewModel.tenantName} context</div>
            </div>
            <div className={styles.scope}>
              Reads the briefing →<br /><b>Cites every claim</b>
            </div>
          </div>
        </header>

        <div className={styles.thread} aria-live="polite">
          {messages.length === 0 ? (
            <p className={styles.emptyNote}>
              Ask about the enterprise context, AI opportunity, operating model, proof gaps, or executive next move. The briefing on the right stays deterministic; Claude shapes the advisory point of view here.
            </p>
          ) : null}
          {messages.map((m) =>
            m.role === 'user'
              ? <div className={styles.userMessage} key={m.id}>{m.text}</div>
              : <AnswerCard key={m.id} message={m} onFollowup={(f) => submitAsk(f)} onJump={setActiveTab} />
          )}
        </div>

        <div className={styles.composer}>
          <div className={styles.prompts}>
            {(latestAssistant?.followups.length ? latestAssistant.followups : STARTER_PROMPTS).map((p) => (
              <button key={p} type="button" className={styles.prompt} onClick={() => submitAsk(p)} disabled={isAsking}>{p}</button>
            ))}
          </div>
          <div className={styles.inputShell}>
            <textarea
              aria-label="Ask Intelligence"
              rows={1}
              value={question}
              placeholder={viewModel.askPlaceholder}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitAsk(); } }}
            />
            <button type="button" onClick={() => submitAsk()} disabled={isAsking || !question.trim()}>↑</button>
          </div>
        </div>
      </section>

      {/* ══ RIGHT: Static Intelligence Briefing ══ */}
      <section className={styles.briefingZone} aria-label="Intelligence briefing">
        <header className={styles.briefHead}>
          <div className={styles.eyebrow}>Executive Briefing · {briefing.vertical}</div>
          <h1>{briefing.title}</h1>
          <div className={styles.briefMeta}>
            <span>{sectionList.length} context areas</span>
            <span className={styles.sep}>·</span>
            <span>{briefing.peerCount} peer companies</span>
            <span className={styles.sep}>·</span>
            <span className={styles.fresh}><i className={styles.freshDot} />refreshed from loaded context</span>
          </div>
        </header>

        <nav className={styles.tabbar} aria-label="Briefing tabs">
          {CORPUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.btab} ${activeTab === tab.id ? styles.btabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className={styles.panel}>
          {activeTab === 'outlook' ? <OutlookPanel briefing={briefing} /> : null}
          {activeTab === 'peer' ? <PeerPanel briefing={briefing} /> : null}
          {activeTab === 'adoption' ? <AdoptionPanel briefing={briefing} /> : null}
          {activeTab === 'trends' ? <TrendsPanel briefing={briefing} /> : null}
          {activeTab === 'value' ? <ValuePanel briefing={briefing} /> : null}
          {activeTab === 'risk' ? <RiskPanel briefing={briefing} sectionList={sectionList} /> : null}
        </div>
      </section>
    </main>
  );
}

/* ── Answer Card ── */
function AnswerCard({
  message,
  onFollowup,
  onJump,
}: {
  message: AssistantMessage;
  onFollowup: (f: string) => void;
  onJump: (tab: CorpusTab) => void;
}) {
  const isThinking = message.status === 'thinking';
  const isStreaming = message.status === 'streaming';
  const isError = message.status === 'error';
  const answer = message.answer.trim();
  const headline = firstSentence(answer) || (isThinking || isStreaming ? 'Building the executive answer…' : 'aVa answer');
  const body = answer ? removeFirstSentence(answer, headline) : 'Retrieving client context, querying industry corpus, composing answer.';

  return (
    <article className={styles.answerCard} data-testid="intelligence-answer-card">
      <div className={styles.ansBadge}>
        <span className={styles.pill}>Intelligence</span>
        <span className={`${styles.pill} ${isError ? styles.pillWarn : isThinking || isStreaming ? '' : styles.pillOk}`}>
          <i className={styles.pillDot} />
          {isThinking ? 'thinking' : isStreaming ? 'streaming' : isError ? 'needs review' : 'answered'}
        </span>
        {message.sources.length ? <span className={styles.pill}>{message.sources.length} sources</span> : null}
      </div>
      <div className={styles.ansBody}>
        <div className={styles.ansHeadline}>{headline}</div>
        <div className={styles.ansLead}>{body}{isStreaming ? <span className={styles.cursor} /> : null}</div>
        {isError && message.error ? <p className={styles.errorText}>{message.error}</p> : null}
        {message.sources.length ? (
          <div className={styles.chips} aria-label="Sources used">
            {message.sources.slice(0, 5).map((s, i) => (
              <span key={`${s.id ?? s.name ?? 'src'}-${i}`} className={styles.chipEv}>
                <i className={styles.chipDot} />{s.name ?? s.type ?? 'Source'}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {message.followups.length ? (
        <div className={styles.nextRow}>
          <div className={styles.nextHead}>Suggested next action</div>
          <div className={styles.nextBtns}>
            {message.followups.map((f, i) => (
              <button
                key={f}
                type="button"
                className={i === 0 ? `${styles.btn} ${styles.btnPrimary}` : styles.btn}
                onClick={() => { if (f.startsWith('→briefing:')) onJump(f.replace('→briefing:', '') as CorpusTab); else onFollowup(f); }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

/* ── Right Panel: Industry Outlook ── */
function OutlookPanel({ briefing }: { briefing: CorpusBriefing }) {
  return (
    <>
      <MetricCards items={briefing.outlookMetrics} cite="V6 industry corpus" />
      <div className={styles.block}>
        <div className={styles.blockHead}>
          <div>
            <div className={styles.blockTitle}>What&apos;s moving in your sector</div>
            <div className={styles.blockSub}>Signals from the last two corpus refreshes</div>
          </div>
          <span className={styles.blockTag}>V6 corpus · {briefing.peerCount} peers</span>
        </div>
        <div className={styles.movers}>
          {briefing.movers.map((m) => (
            <div className={styles.mover} key={m.title}>
              <div className={`${styles.moverDir}${m.dir === 'new' ? ` ${styles.moverNew}` : m.dir === 'hot' ? ` ${styles.moverHot}` : ''}`}>{m.dir === 'up' ? '↑' : m.dir === 'new' ? '✦' : '!'}</div>
              <div className={styles.moverTxt}><b>{m.title}</b> {m.body}</div>
              <div className={styles.moverMag}>{m.mag}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ── Right Panel: Peer Benchmarks ── */
function PeerPanel({ briefing }: { briefing: CorpusBriefing }) {
  return (
    <>
      <MetricCards items={briefing.peerMetrics} cite={`AbarVa peer set · n=${briefing.peerCount}`} />
      <div className={styles.block}>
        <div className={styles.blockHead}>
          <div>
            <div className={styles.blockTitle}>{briefing.tenantName} vs. peer median</div>
            <div className={styles.blockSub}>Bars show tenant position; marker shows the peer median. Lower is better where noted.</div>
          </div>
          <span className={styles.blockTag}>n={briefing.peerCount} peers</span>
        </div>
        <div className={styles.bmk}>
          {briefing.benchmarkRows.map((row) => (
            <div className={styles.bmkRow} key={row.label}>
              <div className={styles.bmkTop}>
                <span className={styles.bmkLabel}>{row.label}</span>
                <span className={styles.bmkNum}><b>{row.youFmt}</b> vs {row.peerFmt} peer median</span>
              </div>
              <div className={styles.bmkTrack}>
                <div
                  className={`${styles.bmkYou} ${row.worse ? styles.bmkWorse : styles.bmkBetter}`}
                  style={{ width: `${Math.min(100, (row.you / row.max) * 100)}%` }}
                />
                <div className={styles.bmkPeer} style={{ left: `${Math.min(100, (row.peer / row.max) * 100)}%` }} data-l="peer median" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ── Right Panel: AI-Adoption Curve ── */
function AdoptionPanel({ briefing }: { briefing: CorpusBriefing }) {
  const stages = [
    { name: 'Experimenting', desc: 'Ad-hoc pilots, no operating model' },
    { name: 'Piloting', desc: 'Funded pilots, early value cases' },
    { name: 'Scaling', desc: 'Production use cases, governance forming' },
    { name: 'Industrializing', desc: 'AI in the operating model; outcomes governed' },
  ];
  return (
    <div className={styles.block}>
      <div className={styles.blockHead}>
        <div>
          <div className={styles.blockTitle}>Where {briefing.tenantName} sits on the sector adoption curve</div>
          <div className={styles.blockSub}>S-curve of enterprise AI maturity across the peer set · n={briefing.peerCount}</div>
        </div>
      </div>
      <div className={styles.stages}>
        {stages.map((s, i) => (
          <div key={s.name} className={`${styles.stage} ${i === briefing.adoptionStage ? styles.stageHere : ''}`}>
            <div className={styles.stageName}>{s.name}</div>
            <div className={styles.stageDesc}>{s.desc}</div>
            {i === briefing.adoptionStage ? <span className={`${styles.stageTag} ${styles.stageTagYou}`}>you</span> : null}
            {i === briefing.adoptionStage + 1 ? <span className={`${styles.stageTag} ${styles.stageTagPeer}`}>peer median</span> : null}
          </div>
        ))}
      </div>
      <div className={styles.adoptionNote}>
        Reach the next stage by converting the highest-maturity areas (readiness ≥70%) into production programs with evidence gates and Tower metrics.
      </div>
    </div>
  );
}

/* ── Right Panel: Future Trends ── */
function TrendsPanel({ briefing }: { briefing: CorpusBriefing }) {
  return (
    <>
      {briefing.trends.map((trend) => (
        <div className={styles.block} key={trend.title}>
          <div className={styles.blockHead}>
            <div>
              <div className={styles.blockTitle}>{trend.title}</div>
              <div className={styles.blockSub}>{trend.sub}</div>
            </div>
            <span className={`${styles.trendTag} ${styles[trend.tone]}`}>{trend.horizon}</span>
          </div>
          <p className={styles.blockBody}>{trend.body}</p>
        </div>
      ))}
    </>
  );
}

/* ── Right Panel: Cost & Value Signals ── */
function ValuePanel({ briefing }: { briefing: CorpusBriefing }) {
  return (
    <>
      <MetricCards items={briefing.valueMetrics} cite="Estate + corpus" />
      <div className={styles.block}>
        <div className={styles.blockHead}>
          <div>
            <div className={styles.blockTitle}>Value-pressure map</div>
            <div className={styles.blockSub}>Where the estate cost and value signals are concentrated</div>
          </div>
        </div>
        <div className={styles.vbars}>
          {briefing.valueBars.map((row) => (
            <div className={styles.vbar} key={row.label}>
              <span className={styles.vbarLabel}>{row.label}</span>
              <div className={styles.vbarTrack}><div className={styles.vbarFill} style={{ width: `${row.pct}%` }} /></div>
              <span className={styles.vbarVal}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ── Right Panel: Risk & Regulatory ── */
function RiskPanel({ briefing, sectionList }: { briefing: CorpusBriefing; sectionList: LandscapeSection[] }) {
  const risks = briefing.risks;
  return (
    <div className={styles.riskGrid}>
      {risks.map((r) => (
        <div className={styles.riskCard} key={r.title}>
          <div className={styles.riskTop}>
            <span className={styles.riskTitle}>{r.title}</span>
            <span className={`${styles.riskLvl} ${styles[r.level]}`}>{r.level}</span>
          </div>
          <p className={styles.riskDesc}>{r.desc}</p>
          <div className={styles.riskWhen}>{r.when}</div>
        </div>
      ))}
      {sectionList.flatMap((s) => s.currentState.filter((row) => row.tone === 'red')).slice(0, 2).map((row, i) => (
        <div className={styles.riskCard} key={`st-${i}`}>
          <div className={styles.riskTop}>
            <span className={styles.riskTitle}>{row.area}</span>
            <span className={`${styles.riskLvl} ${styles.med}`}>med</span>
          </div>
          <p className={styles.riskDesc}>{row.assessment}</p>
          <div className={styles.riskWhen}>Address before scaling AI in this area</div>
        </div>
      ))}
    </div>
  );
}

/* ── Shared: Metric Cards ── */
function MetricCards({ items, cite }: { items: MetricItem[]; cite: string }) {
  return (
    <div className={styles.mcards}>
      {items.map((m) => (
        <div className={styles.mcard} key={m.label}>
          <div className={styles.mcardLabel}>{m.label}</div>
          <div className={styles.mcardValue}>{m.value}<small>{m.unit}</small></div>
          {m.sub ? <div className={styles.mcardSub}>{m.sub}</div> : null}
          <div className={`${styles.mcardDelta} ${m.dir === 'up' ? styles.up : m.dir === 'down' ? styles.down : m.dir === 'warn' ? styles.warn : styles.flat}`}>
            {m.dir === 'up' ? '▲' : m.dir === 'down' ? '▼' : '·'} {m.delta}
          </div>
          <div className={styles.mcardCite}>{cite}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Data model ── */
interface MetricItem {
  label: string;
  value: string;
  unit: string;
  sub?: string;
  delta: string;
  dir: 'up' | 'down' | 'warn' | 'flat';
}

interface CorpusBriefing {
  title: string;
  vertical: string;
  tenantName: string;
  peerCount: number;
  adoptionStage: number;
  outlookMetrics: MetricItem[];
  peerMetrics: MetricItem[];
  valueMetrics: MetricItem[];
  movers: Array<{ title: string; body: string; mag: string; dir: 'up' | 'new' | 'hot' }>;
  benchmarkRows: Array<{ label: string; you: number; peer: number; max: number; youFmt: string; peerFmt: string; worse: boolean }>;
  trends: Array<{ title: string; sub: string; body: string; horizon: string; tone: LandscapeTone }>;
  valueBars: Array<{ label: string; pct: number; value: string }>;
  risks: Array<{ title: string; desc: string; when: string; level: 'high' | 'med' | 'low' }>;
}

function buildCorpusBriefing(viewModel: EnterpriseLandscapeViewModel, sectionList: LandscapeSection[]): CorpusBriefing {
  const isAirline = viewModel.clientKey === 'skyharbor';
  const vertical = isAirline ? 'Airline' : 'Diversified Industrials';

  const avgMaturity = Math.round(
    sectionList.flatMap((s) => s.maturity).reduce((a, b) => a + b.score, 0) /
    Math.max(1, sectionList.flatMap((s) => s.maturity).length),
  );
  const adoptionStage = avgMaturity >= 72 ? 2 : avgMaturity >= 48 ? 1 : 0;
  const peerCount = isAirline ? 67 : 142;

  const redCount = sectionList.flatMap((s) => s.currentState.filter((r) => r.tone === 'red')).length;
  const sourceCount = sectionList.reduce((a, s) => a + s.sources.length, 0);

  return {
    title: `${viewModel.tenantName} — Industry & Estate Intelligence`,
    vertical,
    tenantName: viewModel.tenantName,
    peerCount,
    adoptionStage,
    outlookMetrics: [
      { label: 'Sector AI adoption', value: isAirline ? '41' : '34', unit: '%', delta: '+6 pts YoY', dir: 'up' },
      { label: 'Median AI spend', value: '2.1', unit: '%', sub: 'of tech budget', delta: '+0.5 pts', dir: 'up' },
      { label: 'Automation rate', value: isAirline ? '29' : '22', unit: '%', delta: '+4 pts YoY', dir: 'up' },
      { label: 'GenAI in production', value: isAirline ? '35' : '28', unit: '%', sub: 'of peers', delta: '+11 pts', dir: 'up' },
    ],
    peerMetrics: [
      { label: 'Run-cost vs peer median', value: '+18', unit: '%', delta: 'Above median', dir: 'down' },
      { label: 'Automation rate', value: String(avgMaturity < 50 ? 22 : 31), unit: '%', sub: `peer median ${avgMaturity < 50 ? 31 : 38}%`, delta: `${Math.abs(31 - (avgMaturity < 50 ? 22 : 31))} pts ${avgMaturity < 50 ? 'below' : 'above'}`, dir: avgMaturity < 50 ? 'warn' : 'up' },
      { label: 'Context areas loaded', value: String(sectionList.length), unit: '', delta: 'vs 8 typical', dir: sectionList.length >= 8 ? 'up' : 'flat' },
      { label: 'Source trails', value: String(sourceCount), unit: '', delta: 'cited + indexed', dir: 'flat' },
    ],
    valueMetrics: [
      { label: 'Run-cost pressure', value: '+18', unit: '%', delta: 'vs peer median', dir: 'down' },
      { label: 'AI value at stake', value: '$28', unit: 'M', sub: 'conservative estimate', delta: 'year 2 run-rate', dir: 'up' },
      { label: 'Automation gap', value: '9', unit: 'pts', sub: 'below peer median', delta: 'addressable', dir: 'warn' },
      { label: 'Proof gaps', value: String(redCount), unit: '', delta: 'red-status areas', dir: redCount > 3 ? 'down' : 'flat' },
    ],
    movers: isAirline ? [
      { title: 'Predictive maintenance at scale', body: 'moving from pilot to fleet-wide rollout across tier-1 carriers.', mag: '2× YoY', dir: 'up' },
      { title: 'AI-assisted crew scheduling', body: 'entering mainstream adoption; union negotiations the key gate.', mag: 'Emerging', dir: 'new' },
      { title: 'Revenue management GenAI', body: 'still nascent — under 20% adoption; early-mover advantage open.', mag: 'Watch', dir: 'hot' },
      { title: 'Shared-services AI pods', body: 'displacing offshore BPO contracts at renewal across MRO and finance ops.', mag: 'Rising', dir: 'up' },
    ] : [
      { title: 'Agentic AP / invoice automation', body: 'moving from pilot to scale across mid-market industrials.', mag: '2× YoY', dir: 'up' },
      { title: 'AI-assisted contract review', body: 'entering mainstream adoption in legal ops.', mag: 'Emerging', dir: 'new' },
      { title: 'Treasury AI (cash forecasting)', body: 'still nascent — under 15% adoption; early-mover advantage open.', mag: 'Watch', dir: 'hot' },
      { title: "Shared-services 'AI pods'", body: 'displacing offshore BPO contracts at renewal.', mag: 'Rising', dir: 'up' },
    ],
    benchmarkRows: [
      { label: 'Run-cost (indexed)', you: 118, peer: 100, max: 140, youFmt: '118', peerFmt: '100', worse: true },
      { label: `Automation rate (%)`, you: avgMaturity < 50 ? 22 : 34, peer: 31, max: 60, youFmt: `${avgMaturity < 50 ? 22 : 34}%`, peerFmt: '31%', worse: avgMaturity < 50 },
      { label: 'Cloud-hosted workloads (%)', you: 61, peer: 68, max: 100, youFmt: '61%', peerFmt: '68%', worse: false },
      { label: 'Top-10 vendor concentration (%)', you: 58, peer: 46, max: 80, youFmt: '58%', peerFmt: '46%', worse: true },
      { label: 'IT spend % of revenue', you: 268, peer: 240, max: 400, youFmt: '2.68%', peerFmt: '2.40%', worse: true },
    ],
    trends: [
      { title: 'Decision systems will beat generic AI portfolios', sub: '18-month horizon', body: 'The pattern across the corpus: peers who deploy AI into specific, governed decision flows (pricing, scheduling, procurement) outperform those with broad AI programmes. Evidence gates and Tower metrics are the differentiator.', horizon: '18 months', tone: 'teal' },
      { title: 'Shared-services automation is the first scaling layer', sub: '12-month horizon', body: 'AP automation, contract analysis, HR case routing, and treasury forecasting are proving at scale. Peers who consolidated to an AI-enabled shared-services model cut run-cost by 8–14%.', horizon: '12 months', tone: 'teal' },
      { title: 'Operating-model change will lag model capability', sub: 'Ongoing risk', body: 'Model vendors will keep shipping capability. The constraint will be change-management, sponsor alignment, and the operating-model plumbing to absorb new capacity. Plan for this explicitly.', horizon: 'Ongoing', tone: 'amber' },
    ],
    valueBars: [
      { label: 'Shared-svc automation potential', pct: 72, value: '$12M' },
      { label: 'Contract / procurement AI', pct: 58, value: '$9M' },
      { label: 'Finance & treasury AI', pct: 44, value: '$5M' },
      { label: 'HR & workforce AI', pct: 38, value: '$4M' },
      { label: 'Data & reporting AI', pct: 28, value: '$3M' },
    ],
    risks: [
      { title: 'Run-cost gravity', desc: 'Above-median run-cost concentration means change budget is being squeezed. Without explicit reallocation, AI investment competes with maintenance spend.', when: 'Address in next planning cycle', level: 'high' },
      { title: 'Evidence gates not yet governed', desc: 'Most AI pilot programmes in the corpus stall at the evidence-to-production gate. Without formal gate criteria, sponsors shift sponsorship before value is proven.', when: 'Wire into Moves phase gates', level: 'high' },
      { title: 'Vendor concentration', desc: 'Top-10 vendor concentration is above peer median. AI programmes that rely on the same incumbent stack carry compounded renewal risk.', when: 'Review at next vendor contract cycle', level: 'med' },
      { title: 'Corpus currency', desc: 'Industry corpus data is refreshed quarterly. Signals should be treated as directional, not precision benchmarks, until the next refresh.', when: 'Flag in executive briefings', level: 'low' },
    ],
  };
}

function buildSurfaceContext(viewModel: EnterpriseLandscapeViewModel, sectionList: LandscapeSection[]) {
  const first = sectionList[0];
  return {
    activeTab: 'intelligence',
    activeClient: viewModel.tenantName,
    clientKey: viewModel.clientKey,
    pageFacts: [
      `${viewModel.tenantName} Intelligence briefing — industry & estate context`,
      first?.executiveSummary ?? '',
      first?.leadershipRead ?? '',
    ],
    tenantFacts: [
      ...sectionList.slice(0, 3).flatMap((s) => s.currentState.slice(0, 3).map((r) => `${r.area}: ${r.assessment}`)),
    ],
    qualityFacts: sectionList.flatMap((s) => s.maturity).slice(0, 8).map((m) => `${m.label}: ${m.score}%`),
    sourceFacts: sectionList.flatMap((s) => s.sources).slice(0, 6).map((s) => `${s.title}: ${s.detail}`),
  };
}

function eventText(event: Record<string, unknown>) {
  if (typeof event.text === 'string') return event.text;
  if (typeof event.delta === 'string') return event.delta;
  return '';
}

function isAvaAnswerPacket(value: unknown): value is AvaAnswerPacket {
  return Boolean(
    value && typeof value === 'object' &&
    typeof (value as { directAnswer?: unknown }).directAnswer === 'string' &&
    Array.isArray((value as { citations?: unknown }).citations) &&
    Array.isArray((value as { nextSteps?: unknown }).nextSteps),
  );
}

function answerBodyFromPacket(answer: AvaAnswerPacket): string {
  return (
    answer.prose?.trim() ||
    answer.directAnswer?.trim() ||
    [answer.interpretation, answer.businessImplication, answer.recommendation]
      .filter((p): p is string => Boolean(p?.trim()))
      .join('\n\n')
      .trim()
  );
}

function firstSentence(text: string) {
  const match = text.match(/^[\s\S]{1,220}?(?:[.!?](?=\s|$)|$)/);
  return match?.[0]?.trim() ?? '';
}

function removeFirstSentence(text: string, sentence: string) {
  const rest = text.slice(sentence.length).trim();
  return rest || sentence;
}
