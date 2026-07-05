'use client';

import { useMemo, useState } from 'react';
import type { EnterpriseLandscapeViewModel, LandscapeTone } from '@/lib/home/enterprise-landscape-view-model';
import styles from './AdvisoryIntelligencePage.module.css';

type AdvisorKey = 'strategy' | 'execution' | 'data' | 'technology' | 'risk' | 'finance' | 'change' | 'actions';

interface Advisor {
  key: AdvisorKey;
  label: string;
  role: string;
  question: string;
  tone: LandscapeTone;
}

const ADVISORS: Advisor[] = [
  {
    key: 'strategy',
    label: 'Strategy',
    role: 'Strategic rationale',
    question: 'Why should leadership care?',
    tone: 'teal',
  },
  {
    key: 'execution',
    label: 'Execution',
    role: 'How winners execute',
    question: 'What sequence is most likely to work?',
    tone: 'amber',
  },
  {
    key: 'data',
    label: 'Data',
    role: 'Data and evidence readiness',
    question: 'What data will block value?',
    tone: 'amber',
  },
  {
    key: 'technology',
    label: 'Technology',
    role: 'Architecture and platform choices',
    question: 'What should we simplify before scaling?',
    tone: 'amber',
  },
  {
    key: 'risk',
    label: 'Risk',
    role: 'Failure modes and controls',
    question: 'What could go wrong?',
    tone: 'red',
  },
  {
    key: 'finance',
    label: 'Finance',
    role: 'Value and spend discipline',
    question: 'Where is money at risk?',
    tone: 'teal',
  },
  {
    key: 'change',
    label: 'Change',
    role: 'Adoption and operating model',
    question: 'What will users resist?',
    tone: 'amber',
  },
  {
    key: 'actions',
    label: 'Next actions',
    role: 'Monday-morning plan',
    question: 'What should we do next?',
    tone: 'teal',
  },
];

export function AdvisoryIntelligencePage({ viewModel }: { viewModel: EnterpriseLandscapeViewModel }) {
  const sectionList = useMemo(() => Object.values(viewModel.sections), [viewModel.sections]);
  const [selectedAdvisor, setSelectedAdvisor] = useState<AdvisorKey>('strategy');
  const [selectedSection, setSelectedSection] = useState(viewModel.defaultSectionId);
  const [question, setQuestion] = useState('');
  const advisor = ADVISORS.find((item) => item.key === selectedAdvisor) ?? ADVISORS[0];
  const section = viewModel.sections[selectedSection] ?? viewModel.sections[viewModel.defaultSectionId];
  const guidance = buildGuidance(advisor.key, section);

  function ask() {
    const normalized = question.trim().toLowerCase();
    if (!normalized) return;
    const matchedSection = sectionList.find((candidate) => {
      const haystack = `${candidate.id} ${candidate.title} ${candidate.subtitle}`.toLowerCase();
      return haystack.includes(normalized) || normalized.includes(candidate.id.replace('-', ' '));
    });
    if (matchedSection) setSelectedSection(matchedSection.id);
    if (normalized.includes('risk') || normalized.includes('fail') || normalized.includes('control')) {
      setSelectedAdvisor('risk');
    } else if (normalized.includes('value') || normalized.includes('spend') || normalized.includes('roi')) {
      setSelectedAdvisor('finance');
    } else if (normalized.includes('data') || normalized.includes('analytics') || normalized.includes('lineage')) {
      setSelectedAdvisor('data');
    } else if (normalized.includes('next') || normalized.includes('monday') || normalized.includes('action')) {
      setSelectedAdvisor('actions');
    } else if (normalized.includes('architecture') || normalized.includes('technology') || normalized.includes('platform')) {
      setSelectedAdvisor('technology');
    }
  }

  return (
    <main className={styles.surface}>
      <header className={styles.command}>
        <div className={styles.commandLabel}>AbarVa Intelligence</div>
        <input
          aria-label="Ask Intelligence"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') ask();
          }}
          placeholder={`Ask the advisory board about ${viewModel.tenantName}...`}
        />
        <button type="button" onClick={ask}>Ask</button>
      </header>

      <div className={styles.layout}>
        <aside className={styles.rail}>
          <div className={styles.railTitle}>Advisory board</div>
          {ADVISORS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`${styles.advisorButton} ${selectedAdvisor === item.key ? styles.active : ''}`}
              onClick={() => setSelectedAdvisor(item.key)}
            >
              <span className={`${styles.dot} ${styles[item.tone]}`} />
              <span>{item.label}</span>
              <small>{item.question}</small>
            </button>
          ))}

          <div className={styles.railTitle}>Decision context</div>
          {sectionList.slice(0, 14).map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.contextButton} ${selectedSection === item.id ? styles.activeContext : ''}`}
              onClick={() => setSelectedSection(item.id)}
            >
              {item.id.replace('-', ' ')}
            </button>
          ))}
        </aside>

        <section className={styles.canvas}>
          <div className={styles.hero}>
            <div>
              <div className={styles.eyebrow}>{advisor.role} - {viewModel.tenantName}</div>
              <h1>{guidance.headline}</h1>
              <p>{guidance.summary}</p>
            </div>
            <div className={styles.verdict}>
              <span>Recommendation</span>
              <b>{guidance.recommendation}</b>
            </div>
          </div>

          <div className={styles.boardGrid}>
            {guidance.cards.map((card) => (
              <article className={styles.card} key={card.title}>
                <div className={styles.cardLabel}>{card.label}</div>
                <h2>{card.title}</h2>
                <p>{card.body}</p>
              </article>
            ))}
          </div>

          <section className={styles.plan}>
            <div className={styles.sectionHead}>
              <span>Recommended approach</span>
              <b>{section.id.replace('-', ' ')}</b>
            </div>
            <div className={styles.sequence}>
              {guidance.steps.map((step, index) => (
                <div className={styles.step} key={step}>
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </section>
        </section>

        <aside className={styles.panel}>
          <span className={styles.panelBadge}>Intelligence · aVa</span>
          <p className={styles.panelSummary}>{section.executiveSummary}</p>
          <div className={styles.signalCards}>
            <div className={styles.signalCard}>
              <div className={styles.signalCardValue}>{section.implications.length}</div>
              <div className={styles.signalCardLabel}>Signals</div>
            </div>
            <div className={styles.signalCard}>
              <div className={styles.signalCardValue}>{section.sources.length}</div>
              <div className={styles.signalCardLabel}>Sources</div>
            </div>
            <div className={styles.signalCard}>
              <div className={styles.signalCardValue}>{section.currentState.length}</div>
              <div className={styles.signalCardLabel}>Context pts</div>
            </div>
          </div>
          <div className={styles.panelTitle}>Signals behind the advice</div>
          {section.implications.slice(0, 6).map((item) => (
            <div className={styles.signal} key={item.label}>
              <span>{item.label}</span>
              <b>{item.value}</b>
            </div>
          ))}
        </aside>
      </div>
    </main>
  );
}

function buildGuidance(key: AdvisorKey, section: EnterpriseLandscapeViewModel['sections'][string]) {
  const risk = section.implications.find((item) => item.risk)?.value ?? section.currentState[0]?.assessment;
  const firstFinding = section.currentState[0]?.assessment ?? section.executiveSummary;
  const secondFinding = section.currentState[1]?.assessment ?? section.subtitle;
  const source = section.sources[0]?.title ?? 'loaded enterprise context';

  if (key === 'risk') {
    return {
      headline: `${section.title} needs control design before scale.`,
      summary: `The advisory read is that the biggest risk is not the idea itself; it is scaling before the operating controls, ownership, and evidence are ready.`,
      recommendation: 'Control first, then scale',
      cards: [
        { label: 'What could go wrong', title: 'Scaling hides weak evidence', body: risk },
        { label: 'Failure pattern', title: 'Teams treat pilots as production', body: 'Programs usually fail when confidence, exception handling, ownership, and auditability are added after launch instead of designed into the workflow.' },
        { label: 'Mitigation', title: 'Make the control gate explicit', body: `Use ${source} as the evidence trail and require a named owner before expanding the scope.` },
      ],
      steps: ['Name the control owner and approval gate.', 'Define evidence required for expansion.', 'Run a limited-scope pilot with exception review.', 'Only scale after evidence is strong enough for leadership challenge.'],
    };
  }

  if (key === 'finance') {
    return {
      headline: `${section.title} should be funded only where value proof is visible.`,
      summary: 'The financial lens separates valuable modernization from attractive spend. The question is not whether to invest, but which dependency unlocks measurable value first.',
      recommendation: 'Fund the bottleneck',
      cards: [
        { label: 'Value logic', title: 'Tie spend to the blocker', body: firstFinding },
        { label: 'Spend discipline', title: 'Avoid platform spend without adoption proof', body: 'Require every funded workstream to name the business metric it moves, the owner who accepts the result, and the evidence cadence.' },
        { label: 'Board question', title: 'What value becomes visible in 90 days?', body: secondFinding },
      ],
      steps: ['Rank initiatives by value-at-risk and dependency removal.', 'Pause spend that lacks a measurable adoption path.', 'Tie vendor milestones to business evidence.', 'Review realized value monthly in Tower.'],
    };
  }

  if (key === 'data') {
    return {
      headline: `${section.title} depends on trusted data products, not more disconnected reporting.`,
      summary: 'The data expert would focus on lineage, ownership, quality, and usable semantic definitions before promising AI productivity.',
      recommendation: 'Certify the data path',
      cards: [
        { label: 'Data blocker', title: 'Lineage and ownership decide trust', body: firstFinding },
        { label: 'Best practice', title: 'Create governed data products', body: 'Winners establish domain-owned data products with quality scores, business definitions, and consumption contracts before broad AI rollout.' },
        { label: 'Watch item', title: 'Do not confuse availability with readiness', body: secondFinding },
      ],
      steps: ['Identify the 5 highest-value data products.', 'Assign business and technology owners.', 'Score quality, lineage, and access controls.', 'Bind AI use cases only to certified datasets.'],
    };
  }

  if (key === 'actions') {
    return {
      headline: `The next move is to turn ${section.title.toLowerCase()} into an owned decision path.`,
      summary: 'This is the Monday-morning view: the few actions leadership can take now to reduce ambiguity and move value forward.',
      recommendation: 'Create a governed move',
      cards: [
        { label: 'Next Monday', title: 'Pick the decision owner', body: 'Assign one accountable executive and one delivery owner. Without this, advisory insight stays as commentary.' },
        { label: 'Next 30 days', title: 'Prove the value path', body: firstFinding },
        { label: 'Next 60 days', title: 'Sequence the dependency work', body: secondFinding },
      ],
      steps: ['Name owner, metric, and decision date.', 'Convert the advisory read into a Move.', 'Attach source evidence and assumptions.', 'Track spend, adoption, risk, and value in Tower.'],
    };
  }

  return {
    headline: `${section.title} is the decision area leadership should inspect next.`,
    summary: 'The advisory board read combines enterprise context, operating reality, technical constraints, risk posture, and likely execution patterns into a practical recommendation.',
    recommendation: key === 'strategy' ? 'Proceed selectively' : 'Sequence before scale',
    cards: [
      { label: 'Why this matters', title: 'It affects value realization', body: section.executiveSummary },
      { label: 'What experienced teams do', title: 'Start with the constrained workflow', body: firstFinding },
      { label: 'Common failure mode', title: 'Underestimating dependency work', body: risk },
    ],
    steps: ['Clarify the business outcome.', 'Identify the weakest dependency.', 'Design the first controlled pilot.', 'Convert evidence into a governed Move and Tower metric.'],
  };
}
