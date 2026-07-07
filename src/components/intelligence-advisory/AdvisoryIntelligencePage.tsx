'use client';

import { useMemo, useState } from 'react';
import type {
  EnterpriseLandscapeViewModel,
  LandscapeSection,
  LandscapeTone,
} from '@/lib/home/enterprise-landscape-view-model';
import type { AvaAnswerPacket } from '@/lib/ava-answer/contract';
import styles from './AdvisoryIntelligencePage.module.css';

type BriefingTab = 'answer' | 'industry' | 'trends' | 'plays' | 'evidence';

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
  status: 'thinking' | 'done' | 'error';
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

const BRIEFING_TABS: Array<{ id: BriefingTab; label: string; dot: 'neutral' | 'blue' | 'teal' | 'amber' | 'green' }> = [
  { id: 'answer', label: 'Answer', dot: 'neutral' },
  { id: 'industry', label: 'Industry Signal', dot: 'blue' },
  { id: 'trends', label: 'Trends', dot: 'teal' },
  { id: 'plays', label: 'Plays', dot: 'amber' },
  { id: 'evidence', label: 'Evidence', dot: 'green' },
];

const STARTER_PROMPTS = [
  'Where should we fund AI first?',
  'What has to be true before we scale?',
  'Which proof gaps should the CIO and CFO inspect?',
];

export function AdvisoryIntelligencePage({ viewModel }: { viewModel: EnterpriseLandscapeViewModel }) {
  const sectionList = useMemo(() => Object.values(viewModel.sections), [viewModel.sections]);
  const [selectedSectionId, setSelectedSectionId] = useState(viewModel.defaultSectionId);
  const [activeTab, setActiveTab] = useState<BriefingTab>('answer');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  const selectedSection = viewModel.sections[selectedSectionId] ?? viewModel.sections[viewModel.defaultSectionId];
  const briefing = useMemo(() => buildBriefing(viewModel, selectedSection), [viewModel, selectedSection]);
  const latestAssistant = [...messages].reverse().find((message): message is AssistantMessage => message.role === 'assistant');

  async function submitAsk(input: string = question) {
    const trimmed = input.trim();
    if (!trimmed || isAsking) return;

    const userMessage: UserMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };
    const assistantId = `a-${Date.now()}`;
    const assistantMessage: AssistantMessage = {
      id: assistantId,
      role: 'assistant',
      question: trimmed,
      answer: '',
      status: 'thinking',
      sources: [],
      followups: [],
      trace: null,
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
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
          surfaceContext: buildSurfaceContext(viewModel, selectedSection),
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Ask failed with ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          applyAskEvent(assistantId, line);
        }
      }
      if (buffer.trim()) applyAskEvent(assistantId, buffer);
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId && message.role === 'assistant'
            ? { ...message, status: message.status === 'error' ? 'error' : 'done' }
            : message,
        ),
      );
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown ask error';
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId && message.role === 'assistant'
            ? { ...message, status: 'error', error, answer: 'I could not complete the Intelligence answer from the live model path.' }
            : message,
        ),
      );
    } finally {
      setIsAsking(false);
    }
  }

  function applyAskEvent(assistantId: string, line: string) {
    if (!line.trim()) return;
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(line) as Record<string, unknown>;
    } catch {
      return;
    }
    setMessages((current) =>
      current.map((message) => {
        if (message.id !== assistantId || message.role !== 'assistant') return message;
        if (event.type === 'delta') {
          const delta = eventText(event);
          return delta ? { ...message, answer: `${message.answer}${delta}` } : message;
        }
        if (event.type === 'agent-answer' && isAvaAnswerPacket(event.answer)) {
          const answerText = answerBodyFromPacket(event.answer);
          return {
            ...message,
            agentAnswer: event.answer,
            answer: answerText || message.answer,
            sources: event.answer.citations.map((citation) => ({
              id: citation.id,
              type: citation.sourceClass,
              name: citation.label,
              detail: citation.excerpt,
              confidence:
                citation.confidence === 'high'
                  ? 0.9
                  : citation.confidence === 'medium'
                    ? 0.65
                    : citation.confidence === 'low'
                      ? 0.35
                      : undefined,
            })),
            followups: event.answer.nextSteps
              .map((step) => step.label)
              .filter((item): item is string => Boolean(item?.trim()))
              .slice(0, 3),
          };
        }
        if (event.type === 'sources' && Array.isArray(event.sources)) {
          return { ...message, sources: event.sources as AskSource[] };
        }
        if (event.type === 'followups' && Array.isArray(event.followups)) {
          return {
            ...message,
            followups: event.followups.filter((item): item is string => typeof item === 'string').slice(0, 3),
          };
        }
        if (event.type === 'trace' && typeof event.trace === 'object' && event.trace !== null) {
          return { ...message, trace: event.trace as AskTrace };
        }
        if (event.type === 'error') {
          return {
            ...message,
            status: 'error',
            error: typeof event.error === 'string' ? event.error : 'Unknown ask error',
          };
        }
        return message;
      }),
    );
  }

  return (
    <main className={styles.surface} data-testid="intelligence-advisory-surface">
      <section className={styles.advisorZone} aria-label="aVa Intelligence advisor">
        <header className={styles.advisorHead}>
          <div className={styles.avatar}>a</div>
          <div>
            <div className={styles.agentName}>Your Analyst</div>
            <div className={styles.agentSub}>aVa · grounded in {viewModel.tenantName} context</div>
          </div>
          <div className={styles.scope}>
            Reads the briefing
            <b>Cites every claim</b>
          </div>
        </header>

        <div className={styles.thread} aria-live="polite">
          {messages.length === 0 ? (
            <div className={styles.emptyNote}>
              Ask a question about the enterprise context, AI opportunity, operating model, proof gaps, or executive next move. The briefing on the right stays deterministic; Claude shapes the advisory point of view on the left.
            </div>
          ) : null}
          {messages.map((message) =>
            message.role === 'user'
              ? <div className={styles.userMessage} key={message.id}>{message.text}</div>
              : (
                <AnswerCard
                  key={message.id}
                  message={message}
                  onFollowup={(followup) => submitAsk(followup)}
                />
              ),
          )}
        </div>

        <div className={styles.composer}>
          <div className={styles.prompts}>
            {(latestAssistant?.followups.length ? latestAssistant.followups : STARTER_PROMPTS).map((prompt) => (
              <button key={prompt} type="button" onClick={() => submitAsk(prompt)} disabled={isAsking}>
                {prompt}
              </button>
            ))}
          </div>
          <div className={styles.inputShell}>
            <textarea
              aria-label="Ask Intelligence"
              rows={1}
              value={question}
              placeholder={viewModel.askPlaceholder}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  submitAsk();
                }
              }}
            />
            <button type="button" onClick={() => submitAsk()} disabled={isAsking || !question.trim()}>
              ↑
            </button>
          </div>
        </div>
      </section>

      <section className={styles.briefingZone} aria-label="Intelligence briefing">
        <header className={styles.briefHead}>
          <div>
            <div className={styles.eyebrow}>Executive Briefing · {briefing.vertical}</div>
            <h1>{briefing.title}</h1>
            <div className={styles.meta}>
              <span>{sectionList.length} context areas</span>
              <span>{briefing.sourceCount} source trails</span>
              <span>{briefing.signalCount} decision signals</span>
              <span className={styles.fresh}><i /> refreshed from loaded context</span>
            </div>
          </div>
          <label className={styles.sectionPicker}>
            <span>Context lens</span>
            <select
              value={selectedSectionId}
              onChange={(event) => {
                setSelectedSectionId(event.target.value);
                setActiveTab('answer');
              }}
            >
              {sectionList.map((section) => (
                <option key={section.id} value={section.id}>{section.title}</option>
              ))}
            </select>
          </label>
        </header>

        <nav className={styles.tabbar} aria-label="Briefing tabs">
          {BRIEFING_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? styles.activeTab : ''}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={styles[tab.dot]} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className={styles.panel}>
          {activeTab === 'answer' ? <AnswerBriefing briefing={briefing} section={selectedSection} /> : null}
          {activeTab === 'industry' ? <IndustryBriefing briefing={briefing} section={selectedSection} /> : null}
          {activeTab === 'trends' ? <TrendsBriefing briefing={briefing} /> : null}
          {activeTab === 'plays' ? <PlaysBriefing section={selectedSection} /> : null}
          {activeTab === 'evidence' ? <EvidenceBriefing section={selectedSection} latestAssistant={latestAssistant} /> : null}
        </div>
      </section>
    </main>
  );
}

function eventText(event: Record<string, unknown>) {
  if (typeof event.text === 'string') return event.text;
  if (typeof event.delta === 'string') return event.delta;
  return '';
}

function isAvaAnswerPacket(value: unknown): value is AvaAnswerPacket {
  return Boolean(
    value &&
      typeof value === 'object' &&
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
      .filter((part): part is string => Boolean(part?.trim()))
      .join('\n\n')
      .trim()
  );
}

function AnswerCard({ message, onFollowup }: { message: AssistantMessage; onFollowup: (followup: string) => void }) {
  const answer = message.answer.trim();
  const headline = firstSentence(answer) || (message.status === 'thinking' ? 'Building the executive answer…' : 'aVa answer');
  const body = answer ? removeFirstSentence(answer, headline) : 'Checking the selected tenant briefing, source trail, and relevant corpus patterns.';
  return (
    <article className={styles.answerCard} data-testid="intelligence-answer-card">
      <div className={styles.answerBadge}>
        <span>aVa · intelligence</span>
        <span>{message.status === 'thinking' ? 'thinking' : message.status === 'error' ? 'needs review' : 'answered'}</span>
        {message.sources.length ? <span>{message.sources.length} sources</span> : null}
      </div>
      <div className={styles.answerBody}>
        <h2>{headline}</h2>
        <p>{body}</p>
        {message.error ? <p className={styles.errorText}>{message.error}</p> : null}
        {message.sources.length ? (
          <div className={styles.sourceChips} aria-label="Sources used">
            {message.sources.slice(0, 5).map((source, index) => (
              <span key={`${source.id ?? source.name ?? 'source'}-${index}`}>
                <i />
                {source.name ?? source.type ?? 'Source'}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {message.followups.length ? (
        <div className={styles.nextRow}>
          {message.followups.map((followup) => (
            <button key={followup} type="button" onClick={() => onFollowup(followup)}>
              {followup}
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function AnswerBriefing({ briefing, section }: { briefing: BriefingModel; section: LandscapeSection }) {
  return (
    <>
      <div className={styles.metricGrid}>
        {briefing.metrics.map((metric) => (
          <div className={styles.metricCard} key={metric.label}>
            <span>{metric.label}</span>
            <b>{metric.value}</b>
            <small>{metric.note}</small>
          </div>
        ))}
      </div>
      <section className={styles.block}>
        <div className={styles.blockHead}>
          <div>
            <h2>{section.title}</h2>
            <p>{section.subtitle}</p>
          </div>
          <span>{section.eyebrow.replace('CURRENT STATE ASSESSMENT - ', '')}</span>
        </div>
        <p className={styles.lead}>{section.executiveSummary}</p>
      </section>
      <div className={styles.twoColumn}>
        <OpportunityMap briefing={briefing} />
        <MaturityBars rows={section.maturity} />
      </div>
    </>
  );
}

function IndustryBriefing({ briefing, section }: { briefing: BriefingModel; section: LandscapeSection }) {
  return (
    <>
      <section className={styles.block}>
        <div className={styles.blockHead}>
          <div>
            <h2>What the context is telling us</h2>
            <p>Tenant facts stay separate from pattern context. This tab explains the useful industry lens without pretending it is client evidence.</p>
          </div>
          <span>Industry context</span>
        </div>
        <div className={styles.moverList}>
          {briefing.industrySignals.map((signal) => (
            <div className={styles.mover} key={signal.title}>
              <i className={styles[signal.tone]} />
              <p><b>{signal.title}</b>{signal.body}</p>
              <strong>{signal.magnitude}</strong>
            </div>
          ))}
        </div>
      </section>
      <section className={styles.block}>
        <div className={styles.blockHead}>
          <div>
            <h2>Loaded tenant facts that anchor the view</h2>
            <p>These come from the selected briefing section and are safe to use in the model prompt.</p>
          </div>
        </div>
        <DecisionTable
          headers={['Area', 'Assessment', 'Posture']}
          rows={section.currentState.slice(0, 5).map((row) => [row.area, row.assessment, row.tag])}
        />
      </section>
    </>
  );
}

function TrendsBriefing({ briefing }: { briefing: BriefingModel }) {
  return (
    <>
      <section className={styles.block}>
        <div className={styles.blockHead}>
          <div>
            <h2>Opportunity map</h2>
            <p>Visual shorthand for value pressure versus readiness. Labels are numbered to avoid chart text collisions.</p>
          </div>
          <span>Directional</span>
        </div>
        <OpportunityMap briefing={briefing} large />
      </section>
      <section className={styles.block}>
        <div className={styles.blockHead}>
          <div>
            <h2>Legend</h2>
            <p>Numbers map back to the selected opportunities and context areas.</p>
          </div>
        </div>
        <div className={styles.legendGrid}>
          {briefing.opportunities.map((item, index) => (
            <div key={item.label}><b>{index + 1}</b><span>{item.label}</span><small>{item.action}</small></div>
          ))}
        </div>
      </section>
    </>
  );
}

function PlaysBriefing({ section }: { section: LandscapeSection }) {
  const steps = [
    'Name the executive decision owner and the metric that will prove value.',
    'Separate what is known from tenant evidence, what is pattern context, and what remains an assumption.',
    'Turn the highest-value path into a Move with gates, source trail, and Tower metrics.',
    'Use Source only when vendor, contract, pricing, or external commitment depth is required.',
  ];
  return (
    <section className={styles.block}>
      <div className={styles.blockHead}>
        <div>
          <h2>Recommended play</h2>
          <p>{section.leadershipRead}</p>
        </div>
        <span>Next move</span>
      </div>
      <div className={styles.stageRow}>
        {steps.map((step, index) => (
          <div className={styles.stage} key={step}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <p>{step}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function EvidenceBriefing({
  section,
  latestAssistant,
}: {
  section: LandscapeSection;
  latestAssistant?: AssistantMessage;
}) {
  return (
    <>
      <section className={styles.block}>
        <div className={styles.blockHead}>
          <div>
            <h2>Source trail</h2>
            <p>Human-readable evidence shown to the executive. Raw chunks and prompt internals stay out of the UI.</p>
          </div>
          <span>{section.sources.length} sources</span>
        </div>
        <div className={styles.evidenceList}>
          {section.sources.map((source) => (
            <div key={source.title}>
              <b>{source.title}</b>
              <p>{source.detail}</p>
            </div>
          ))}
        </div>
      </section>
      {latestAssistant?.trace?.evidenceSelection?.selectedCitations?.length ? (
        <section className={styles.block}>
          <div className={styles.blockHead}>
            <div>
              <h2>Latest Claude grounding</h2>
              <p>Trace proof that the live answer selected tenant/corpus sources. This is summarized, not raw prompt text.</p>
            </div>
          </div>
          <div className={styles.evidenceList}>
            {latestAssistant.trace.evidenceSelection.selectedCitations.slice(0, 6).map((citation, index) => (
              <div key={`${citation.id ?? citation.name ?? 'citation'}-${index}`}>
                <b>{citation.name ?? citation.id ?? 'Selected source'}</b>
                <p>{citation.type ?? 'source'} · confidence {typeof citation.confidence === 'number' ? citation.confidence.toFixed(2) : 'n/a'}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function OpportunityMap({ briefing, large = false }: { briefing: BriefingModel; large?: boolean }) {
  return (
    <div className={`${styles.mapCard} ${large ? styles.largeMap : ''}`}>
      <div className={styles.axisLabelTop}>Value pressure</div>
      <div className={styles.axisLabelBottom}>Readiness today</div>
      <div className={styles.mapGrid}>
        <span>Fund readiness</span>
        <span>Scale now</span>
        <span>Hold</span>
        <span>Certify then scale</span>
      </div>
      {briefing.opportunities.map((item, index) => (
        <div
          key={item.label}
          className={`${styles.mapDot} ${styles[item.tone]}`}
          style={{ left: `${item.readiness}%`, bottom: `${item.value}%` }}
          title={`${index + 1}. ${item.label}: ${item.action}`}
        >
          {index + 1}
        </div>
      ))}
    </div>
  );
}

function MaturityBars({ rows }: { rows: Array<{ label: string; score: number; tone: LandscapeTone }> }) {
  return (
    <section className={styles.block}>
      <div className={styles.blockHead}>
        <div>
          <h2>Readiness signals</h2>
          <p>Loaded maturity signals translated into executive-readable bars.</p>
        </div>
      </div>
      <div className={styles.bars}>
        {rows.slice(0, 5).map((row) => (
          <div className={styles.barRow} key={row.label}>
            <div><span>{row.label}</span><b>{row.score}%</b></div>
            <i><em className={styles[row.tone]} style={{ width: `${Math.max(6, row.score)}%` }} /></i>
          </div>
        ))}
      </div>
    </section>
  );
}

function DecisionTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>{cell}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

interface BriefingModel {
  title: string;
  vertical: string;
  sourceCount: number;
  signalCount: number;
  metrics: Array<{ label: string; value: string; note: string }>;
  opportunities: Array<{ label: string; value: number; readiness: number; action: string; tone: LandscapeTone }>;
  industrySignals: Array<{ title: string; body: string; magnitude: string; tone: LandscapeTone }>;
}

function buildBriefing(viewModel: EnterpriseLandscapeViewModel, section: LandscapeSection): BriefingModel {
  const sections = Object.values(viewModel.sections);
  const sourceCount = sections.reduce((sum, item) => sum + item.sources.length, 0);
  const signalCount = sections.reduce((sum, item) => sum + item.implications.length, 0);
  const maturityAverage = Math.round(
    section.maturity.reduce((sum, item) => sum + item.score, 0) / Math.max(1, section.maturity.length),
  );
  return {
    title: `${viewModel.tenantName} decision intelligence canvas`,
    vertical: viewModel.clientKey === 'skyharbor' ? 'Airline' : 'Industrial / shared services',
    sourceCount,
    signalCount,
    metrics: [
      { label: 'Context areas', value: String(sections.length), note: 'selected from the loaded enterprise model' },
      { label: 'Signals', value: String(signalCount), note: 'leadership implications across sections' },
      { label: 'Sources', value: String(sourceCount), note: 'human-readable source trails' },
      { label: 'Readiness', value: `${maturityAverage}%`, note: 'average of selected maturity signals' },
    ],
    opportunities: buildOpportunities(sections, section),
    industrySignals: buildIndustrySignals(section),
  };
}

function buildOpportunities(sections: LandscapeSection[], selected: LandscapeSection) {
  const candidates = [selected, ...sections.filter((section) => section.id !== selected.id)].slice(0, 5);
  return candidates.map((section, index) => {
    const readiness = Math.round(section.maturity.reduce((sum, item) => sum + item.score, 0) / Math.max(1, section.maturity.length));
    const riskPenalty = section.currentState.filter((row) => row.tone === 'red').length * 11;
    const value = Math.max(12, Math.min(92, 78 - index * 8 + riskPenalty));
    const action = readiness >= 72 && value >= 65 ? 'Scale now' : readiness >= 55 ? 'Certify then scale' : value >= 70 ? 'Fund readiness' : 'Hold';
    const tone: LandscapeTone = action === 'Scale now' ? 'teal' : action === 'Fund readiness' ? 'red' : 'amber';
    return {
      label: section.title,
      value,
      readiness: Math.max(8, Math.min(92, readiness)),
      action,
      tone,
    };
  });
}

function buildIndustrySignals(section: LandscapeSection): BriefingModel['industrySignals'] {
  const primary = section.implications[0]?.value ?? section.executiveSummary;
  const risk = section.implications.find((item) => item.risk)?.value ?? section.currentState.find((row) => row.tone === 'red')?.assessment;
  return [
    {
      title: 'Decision systems beat generic AI portfolios.',
      body: ` ${primary}`,
      magnitude: 'High',
      tone: 'teal',
    },
    {
      title: 'Readiness gates matter more than demos.',
      body: ` ${risk ?? 'The main execution risk is funding scale before proof, ownership, and operating controls are visible.'}`,
      magnitude: 'Watch',
      tone: 'amber',
    },
    {
      title: 'Evidence should travel into Moves and Tower.',
      body: ' The useful pattern is to keep context, decision owner, value proof, and risk gates bound as work moves from Intelligence into execution.',
      magnitude: 'Next',
      tone: 'teal',
    },
  ];
}

function buildSurfaceContext(viewModel: EnterpriseLandscapeViewModel, section: LandscapeSection) {
  return {
    activeTab: 'intelligence',
    activeClient: viewModel.tenantName,
    clientKey: viewModel.clientKey,
    pageFacts: [
      `${viewModel.tenantName} Intelligence briefing selected context: ${section.title}`,
      section.executiveSummary,
      section.leadershipRead,
    ],
    tenantFacts: [
      ...section.currentState.slice(0, 5).map((row) => `${row.area}: ${row.assessment}`),
      ...section.snapshot.slice(0, 5).map((item) => `${item[0]}: ${item[1]}`),
    ],
    qualityFacts: section.maturity.map((item) => `${item.label}: ${item.score}%`),
    sourceFacts: section.sources.map((source) => `${source.title}: ${source.detail}`),
  };
}

function firstSentence(text: string) {
  const match = text.match(/^[\s\S]{1,220}?(?:[.!?](?=\s|$)|$)/);
  return match?.[0]?.trim() ?? '';
}

function removeFirstSentence(text: string, sentence: string) {
  const rest = text.slice(sentence.length).trim();
  return rest || sentence;
}
