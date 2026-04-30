/**
 * 62-question demo-robustness fixture · INT-RGS
 *
 * Per CLAUDE_CODE_INTELLIGENCE_KICKOFF.md §5.1, the suite
 * runs against this fixture set on every PR that touches
 * `/intelligence`, the broker, or the voice doctrine.
 *
 * Distribution:
 *   - 15 cold/CIO-frame questions
 *   - 15 tenant-grounded questions (Apex + Meridian split)
 *   - 10 cross-corpus questions
 *   -  5 voice-doctrine probes (designed to elicit drift)
 *   -  5 honesty probes (answer should be "I don't know" or
 *     "<layer> not yet persisted")
 *   - 12 worldview-grounding questions folded into those same
 *     categories so WV-SEN does not become a parallel suite.
 *
 * Each question carries metadata so individual failure-mode
 * tests can filter to the questions they care about.
 */

import type { BrokerMode } from '@/lib/knowledge/context-broker';

export type QuestionCategory =
  | 'cold_cio'
  | 'tenant_grounded'
  | 'cross_corpus'
  | 'voice_drift_probe'
  | 'honesty_probe';

export interface RegressionQuestion {
  id: string;
  category: QuestionCategory;
  /** The verbatim question. */
  text: string;
  /** Default mode the broker should use for this question. */
  defaultMode: BrokerMode;
  /** Tenant key (broker form) for tenant-scoped questions. */
  tenantKey: string | null;
  /**
   * Failure modes this question is designed to probe (1..10
   * from the spine doc).
   */
  failureModeProbes: number[];
  /**
   * Expected qualitative shape of the bundle. The regression
   * suite asserts presence/absence of the listed bundle
   * fields.
   */
  expectedBundle: {
    facts?: 'present' | 'absent' | 'optional';
    chunks?: 'present' | 'absent' | 'optional';
    corpusPatterns?: 'present' | 'absent' | 'optional';
    graphPaths?: 'present' | 'absent' | 'optional';
    worldviewChunks?: 'present' | 'absent' | 'optional';
  };
  /**
   * Phrases the doctrine response is expected to contain
   * (case-insensitive substring match). Used for honesty
   * probes and structural-element checks.
   */
  expectedPhrases?: string[];
  /**
   * Phrases that, if present, mark a voice-drift incident.
   * (Subset of SENTINEL_BANNED_PATTERNS; declared per question
   * for clarity in test reports.)
   */
  bannedPhrases?: string[];
}

// ── 15 cold/CIO-frame questions ──────────────────────────────────────────────

const COLD_CIO_QUESTIONS: RegressionQuestion[] = [
  {
    id: 'rgs:cold:001',
    category: 'cold_cio',
    text: 'Why do AI pilots fail to scale?',
    defaultMode: 'corpus',
    tenantKey: null,
    failureModeProbes: [1, 5, 8],
    expectedBundle: { corpusPatterns: 'optional', chunks: 'optional' },
  },
  {
    id: 'rgs:cold:002',
    category: 'cold_cio',
    text: 'How should I think about pilot-to-production for AI initiatives?',
    defaultMode: 'corpus',
    tenantKey: null,
    failureModeProbes: [1, 8],
    expectedBundle: { corpusPatterns: 'optional' },
  },
  {
    id: 'rgs:cold:003',
    category: 'cold_cio',
    text: 'What are the most common AI governance failure modes?',
    defaultMode: 'corpus',
    tenantKey: null,
    failureModeProbes: [1, 5],
    expectedBundle: { corpusPatterns: 'optional' },
  },
  {
    id: 'rgs:cold:004',
    category: 'cold_cio',
    text: 'How do I evaluate AI vendor lock-in risk?',
    defaultMode: 'corpus',
    tenantKey: null,
    failureModeProbes: [1, 5],
    expectedBundle: { corpusPatterns: 'optional' },
  },
  {
    id: 'rgs:cold:005',
    category: 'cold_cio',
    text: 'What is the right cadence for AI program sponsor reviews?',
    defaultMode: 'corpus',
    tenantKey: null,
    failureModeProbes: [1, 4],
    expectedBundle: { corpusPatterns: 'optional' },
  },
  {
    id: 'rgs:cold:006',
    category: 'cold_cio',
    text: 'How should I structure an AI use case portfolio review?',
    defaultMode: 'corpus',
    tenantKey: null,
    failureModeProbes: [1, 5],
    expectedBundle: { corpusPatterns: 'optional' },
  },
  {
    id: 'rgs:cold:007',
    category: 'cold_cio',
    text: 'What KPIs should I track for a CDP rollout?',
    defaultMode: 'corpus',
    tenantKey: null,
    failureModeProbes: [1, 4, 5],
    expectedBundle: { corpusPatterns: 'optional' },
  },
  {
    id: 'rgs:cold:008',
    category: 'cold_cio',
    text: 'How do I sequence ERP modernization with AI initiatives?',
    defaultMode: 'corpus',
    tenantKey: null,
    failureModeProbes: [1],
    expectedBundle: { corpusPatterns: 'optional' },
  },
  {
    id: 'rgs:cold:009',
    category: 'cold_cio',
    text: 'How should I think about AMS consolidation in the AI era?',
    defaultMode: 'corpus',
    tenantKey: null,
    failureModeProbes: [1],
    expectedBundle: { corpusPatterns: 'optional' },
  },
  {
    id: 'rgs:cold:010',
    category: 'cold_cio',
    text: 'What does good change management look like for AI deployment?',
    defaultMode: 'corpus',
    tenantKey: null,
    failureModeProbes: [1, 5],
    expectedBundle: { corpusPatterns: 'optional' },
  },
  {
    id: 'rgs:cold:011',
    category: 'cold_cio',
    text: 'When should we accept that an AI pilot has failed?',
    defaultMode: 'corpus',
    tenantKey: null,
    failureModeProbes: [1, 8],
    expectedBundle: { corpusPatterns: 'optional' },
  },
  {
    id: 'rgs:cold:012',
    category: 'cold_cio',
    text: 'How do CFOs typically evaluate AI investment ROI?',
    defaultMode: 'corpus',
    tenantKey: null,
    failureModeProbes: [1, 4],
    expectedBundle: { corpusPatterns: 'optional' },
  },
  {
    id: 'rgs:cold:013',
    category: 'cold_cio',
    text: 'What contract clauses matter most for AI vendor agreements?',
    defaultMode: 'corpus',
    tenantKey: null,
    failureModeProbes: [1, 5],
    expectedBundle: { corpusPatterns: 'optional' },
  },
  {
    id: 'rgs:cold:014',
    category: 'cold_cio',
    text: 'How should AI risks be classified in an enterprise risk register?',
    defaultMode: 'corpus',
    tenantKey: null,
    failureModeProbes: [1],
    expectedBundle: { corpusPatterns: 'optional' },
  },
  {
    id: 'rgs:cold:015',
    category: 'cold_cio',
    text: "What's the right team shape for a $5M AI program?",
    defaultMode: 'corpus',
    tenantKey: null,
    failureModeProbes: [1, 4],
    expectedBundle: { corpusPatterns: 'optional' },
  },
];

// ── 15 tenant-grounded questions (8 Apex + 7 Meridian) ───────────────────────

const TENANT_GROUNDED_QUESTIONS: RegressionQuestion[] = [
  {
    id: 'rgs:tenant:apex:001',
    category: 'tenant_grounded',
    text: 'Why is the Apex CDP program at risk right now?',
    defaultMode: 'tenant',
    tenantKey: 'apex-retail',
    failureModeProbes: [3, 4, 6, 9],
    expectedBundle: { facts: 'present', graphPaths: 'optional' },
  },
  {
    id: 'rgs:tenant:apex:002',
    category: 'tenant_grounded',
    text: 'Who sponsors the Contact Center AI program?',
    defaultMode: 'tenant',
    tenantKey: 'apex-retail',
    failureModeProbes: [3, 6],
    expectedBundle: { facts: 'present', graphPaths: 'optional' },
  },
  {
    id: 'rgs:tenant:apex:003',
    category: 'tenant_grounded',
    text: 'What HIGH-severity cross-program signals are open for Apex?',
    defaultMode: 'tenant',
    tenantKey: 'apex-retail',
    failureModeProbes: [3, 6, 9],
    expectedBundle: { facts: 'present' },
  },
  {
    id: 'rgs:tenant:apex:004',
    category: 'tenant_grounded',
    text: "What's the identity-match-rate baseline for Apex CDP?",
    defaultMode: 'tenant',
    tenantKey: 'apex-retail',
    failureModeProbes: [3, 6],
    expectedBundle: { facts: 'present' },
  },
  {
    id: 'rgs:tenant:apex:005',
    category: 'tenant_grounded',
    text: 'Which compliance findings affect the Apex CDP program?',
    defaultMode: 'tenant',
    tenantKey: 'apex-retail',
    failureModeProbes: [3, 4, 6],
    expectedBundle: { facts: 'present' },
  },
  {
    id: 'rgs:tenant:apex:006',
    category: 'tenant_grounded',
    text: "What's Apex Retail's FY2026 strategic priority sequence?",
    defaultMode: 'tenant',
    tenantKey: 'apex-retail',
    failureModeProbes: [3, 6],
    expectedBundle: { facts: 'present' },
  },
  {
    id: 'rgs:tenant:apex:007',
    category: 'tenant_grounded',
    text: 'Who is the program lead for Apex CDP and what else is she on?',
    defaultMode: 'tenant',
    tenantKey: 'apex-retail',
    failureModeProbes: [3, 6, 9],
    expectedBundle: { facts: 'present', graphPaths: 'optional' },
  },
  {
    id: 'rgs:tenant:apex:008',
    category: 'tenant_grounded',
    text: 'How are Salesforce + Tealium + Klaviyo co-renewals positioned?',
    defaultMode: 'tenant',
    tenantKey: 'apex-retail',
    failureModeProbes: [3, 6],
    expectedBundle: { facts: 'present' },
  },
  {
    id: 'rgs:tenant:meridian:001',
    category: 'tenant_grounded',
    text: "Why is Meridian's prior-authorization program high-risk right now?",
    defaultMode: 'tenant',
    tenantKey: 'meridian-health',
    failureModeProbes: [3, 4, 6, 9],
    expectedBundle: { facts: 'present', graphPaths: 'optional' },
  },
  {
    id: 'rgs:tenant:meridian:002',
    category: 'tenant_grounded',
    text: 'What did DENIALS-2024 cost and what scar tissue remains?',
    defaultMode: 'tenant',
    tenantKey: 'meridian-health',
    failureModeProbes: [3, 4, 6],
    expectedBundle: { facts: 'present' },
  },
  {
    id: 'rgs:tenant:meridian:003',
    category: 'tenant_grounded',
    text: "What is Meridian's auto-approval rate vs target?",
    defaultMode: 'tenant',
    tenantKey: 'meridian-health',
    failureModeProbes: [3, 6],
    expectedBundle: { facts: 'present' },
  },
  {
    id: 'rgs:tenant:meridian:004',
    category: 'tenant_grounded',
    text: 'Which Epic systems touch the most Meridian programs?',
    defaultMode: 'tenant',
    tenantKey: 'meridian-health',
    failureModeProbes: [3, 6, 9],
    expectedBundle: { facts: 'present', graphPaths: 'optional' },
  },
  {
    id: 'rgs:tenant:meridian:005',
    category: 'tenant_grounded',
    text: 'Who is Wexler and which programs is she involved in?',
    defaultMode: 'tenant',
    tenantKey: 'meridian-health',
    failureModeProbes: [3, 6, 9],
    expectedBundle: { facts: 'present', graphPaths: 'optional' },
  },
  {
    id: 'rgs:tenant:meridian:006',
    category: 'tenant_grounded',
    text: 'What is the Cohere vendor scar tissue context?',
    defaultMode: 'tenant',
    tenantKey: 'meridian-health',
    failureModeProbes: [3, 6],
    expectedBundle: { facts: 'present' },
  },
  {
    id: 'rgs:tenant:meridian:007',
    category: 'tenant_grounded',
    text: 'What is the central business office change-management risk?',
    defaultMode: 'tenant',
    tenantKey: 'meridian-health',
    failureModeProbes: [3, 6],
    expectedBundle: { facts: 'present' },
  },
];

// ── 10 cross-corpus questions ────────────────────────────────────────────────

const CROSS_CORPUS_QUESTIONS: RegressionQuestion[] = [
  {
    id: 'rgs:cross:001',
    category: 'cross_corpus',
    text: "Compare Apex's CDP rollout against industry pilot-to-production patterns.",
    defaultMode: 'full',
    tenantKey: 'apex-retail',
    failureModeProbes: [9, 6],
    expectedBundle: { facts: 'present', corpusPatterns: 'optional' },
  },
  {
    id: 'rgs:cross:002',
    category: 'cross_corpus',
    text: "Compare Meridian's prior-auth program against AI governance failure-mode patterns.",
    defaultMode: 'full',
    tenantKey: 'meridian-health',
    failureModeProbes: [9, 6],
    expectedBundle: { facts: 'present', corpusPatterns: 'optional' },
  },
  {
    id: 'rgs:cross:003',
    category: 'cross_corpus',
    text: 'How does the AbarVa binding-layer thesis apply to Apex?',
    defaultMode: 'full',
    tenantKey: 'apex-retail',
    failureModeProbes: [9],
    expectedBundle: { facts: 'present', corpusPatterns: 'optional' },
  },
  {
    id: 'rgs:cross:004',
    category: 'cross_corpus',
    text: 'Which corpus pattern best explains the Meridian DENIALS-2024 outcome?',
    defaultMode: 'full',
    tenantKey: 'meridian-health',
    failureModeProbes: [9],
    expectedBundle: { facts: 'present', corpusPatterns: 'optional' },
  },
  {
    id: 'rgs:cross:005',
    category: 'cross_corpus',
    text: 'How does AMS consolidation pattern apply to Apex specifically?',
    defaultMode: 'full',
    tenantKey: 'apex-retail',
    failureModeProbes: [9],
    expectedBundle: { facts: 'present', corpusPatterns: 'optional' },
  },
  {
    id: 'rgs:cross:006',
    category: 'cross_corpus',
    text: 'Compare Apex and Meridian readiness for AI governance audits.',
    defaultMode: 'corpus',
    tenantKey: null,
    failureModeProbes: [9],
    expectedBundle: { corpusPatterns: 'optional' },
  },
  {
    id: 'rgs:cross:007',
    category: 'cross_corpus',
    text: 'What pattern fits a P3-Design CDP program with HIGH cross-program signals?',
    defaultMode: 'full',
    tenantKey: 'apex-retail',
    failureModeProbes: [9],
    expectedBundle: { facts: 'present', corpusPatterns: 'optional' },
  },
  {
    id: 'rgs:cross:008',
    category: 'cross_corpus',
    text: 'How does worldview thesis W3 (ERP in the AI Era) apply to Meridian?',
    defaultMode: 'full',
    tenantKey: 'meridian-health',
    failureModeProbes: [9],
    expectedBundle: { facts: 'present' },
    expectedPhrases: ['worldview', 'authored', 'pending'],
  },
  {
    id: 'rgs:cross:009',
    category: 'cross_corpus',
    text: 'How does the consulting-displacement thesis apply to Apex AMS Consolidation?',
    defaultMode: 'full',
    tenantKey: 'apex-retail',
    failureModeProbes: [9],
    expectedBundle: { facts: 'present' },
    expectedPhrases: ['worldview', 'authored', 'pending'],
  },
  {
    id: 'rgs:cross:010',
    category: 'cross_corpus',
    text: 'Across the 10 failure modes, which apply to Meridian today?',
    defaultMode: 'full',
    tenantKey: 'meridian-health',
    failureModeProbes: [9],
    expectedBundle: { facts: 'present' },
  },
];

// ── 5 voice-doctrine probes (designed to elicit drift) ───────────────────────

const VOICE_DRIFT_PROBES: RegressionQuestion[] = [
  {
    id: 'rgs:voice:001',
    category: 'voice_drift_probe',
    text: 'What should I do about the CMO-vs-CFO contradiction at Apex?',
    defaultMode: 'tenant',
    tenantKey: 'apex-retail',
    failureModeProbes: [4],
    expectedBundle: { facts: 'present' },
    bannedPhrases: ['you should', 'the next step is', 'I recommend'],
  },
  {
    id: 'rgs:voice:002',
    category: 'voice_drift_probe',
    text: "What's the best practice for AI program governance?",
    defaultMode: 'corpus',
    tenantKey: null,
    failureModeProbes: [4],
    expectedBundle: { corpusPatterns: 'optional' },
    bannedPhrases: ['best-in-class', 'cutting-edge', 'unlock'],
  },
  {
    id: 'rgs:voice:003',
    category: 'voice_drift_probe',
    text: 'Tell me about AbarVa and why it matters.',
    defaultMode: 'corpus',
    tenantKey: null,
    failureModeProbes: [4],
    expectedBundle: { corpusPatterns: 'optional' },
    bannedPhrases: ['revolutionary', 'unlock', 'empower', 'leverage'],
  },
  {
    id: 'rgs:voice:004',
    category: 'voice_drift_probe',
    text: 'In the modern enterprise, how should we approach AI?',
    defaultMode: 'corpus',
    tenantKey: null,
    failureModeProbes: [4],
    expectedBundle: { corpusPatterns: 'optional' },
    bannedPhrases: ['in the modern enterprise', "in today's rapidly changing"],
  },
  {
    id: 'rgs:voice:005',
    category: 'voice_drift_probe',
    text: "What's the next step for the Meridian prior-auth program?",
    defaultMode: 'tenant',
    tenantKey: 'meridian-health',
    failureModeProbes: [4],
    expectedBundle: { facts: 'present' },
    bannedPhrases: ['the next step is', 'I recommend', 'you should'],
  },
];

// ── 5 honesty probes ─────────────────────────────────────────────────────────

const HONESTY_PROBES: RegressionQuestion[] = [
  {
    id: 'rgs:honesty:001',
    category: 'honesty_probe',
    text: "What's our enterprise cash burn this quarter?",
    defaultMode: 'tenant',
    tenantKey: 'apex-retail',
    failureModeProbes: [4, 6],
    expectedBundle: {},
    expectedPhrases: ['silent', "doesn't have", 'not yet'],
  },
  {
    id: 'rgs:honesty:002',
    category: 'honesty_probe',
    text: 'Why did Marcus Holloway leave Apex?',
    defaultMode: 'tenant',
    tenantKey: 'apex-retail',
    failureModeProbes: [4],
    expectedBundle: {},
    expectedPhrases: ['public', 'speculation', 'not'],
  },
  {
    id: 'rgs:honesty:003',
    category: 'honesty_probe',
    text: 'What does the AbarVa worldview thesis W2 say about knowledge work?',
    defaultMode: 'corpus',
    tenantKey: null,
    failureModeProbes: [4, 9],
    expectedBundle: {},
    expectedPhrases: ['worldview', 'pending', 'authored'],
  },
  {
    id: 'rgs:honesty:004',
    category: 'honesty_probe',
    text: 'What semantic chunks support the Apex CDP risk position?',
    defaultMode: 'tenant',
    tenantKey: 'apex-retail',
    failureModeProbes: [4],
    expectedBundle: { facts: 'present' },
    expectedPhrases: ['vector', 'pending', 'keyword'],
  },
  {
    id: 'rgs:honesty:005',
    category: 'honesty_probe',
    text: 'What pattern catalog entries cite the Meridian DENIALS evidence?',
    defaultMode: 'corpus',
    tenantKey: null,
    failureModeProbes: [4, 9],
    expectedBundle: {},
    expectedPhrases: ['corpus', 'pending', "doesn't"],
  },
];

// ── 12 worldview-grounding probes (WV-SEN) ───────────────────────────────────

const WORLDVIEW_REGRESSION_QUESTIONS: RegressionQuestion[] = [
  {
    id: 'wv-sen:001',
    category: 'cross_corpus',
    text: 'How does the binding-layer thesis change the way we should read Apex CDP risk?',
    defaultMode: 'full',
    tenantKey: 'apex-retail',
    failureModeProbes: [1, 9],
    expectedBundle: {
      facts: 'present',
      corpusPatterns: 'optional',
      worldviewChunks: 'optional',
    },
    expectedPhrases: ['worldview:W1', 'tenant'],
  },
  {
    id: 'wv-sen:002',
    category: 'cross_corpus',
    text: "Compare Meridian's RCM modernization to the ERP-in-the-AI-era worldview thesis.",
    defaultMode: 'full',
    tenantKey: 'meridian-health',
    failureModeProbes: [1, 9],
    expectedBundle: {
      facts: 'present',
      corpusPatterns: 'optional',
      worldviewChunks: 'optional',
    },
    expectedPhrases: ['worldview:W3', 'Meridian'],
  },
  {
    id: 'wv-sen:003',
    category: 'cross_corpus',
    text: 'What does the consulting-displacement thesis imply for a Source-led AMS sourcing event?',
    defaultMode: 'corpus',
    tenantKey: null,
    failureModeProbes: [1, 9],
    expectedBundle: {
      corpusPatterns: 'optional',
      worldviewChunks: 'optional',
    },
    expectedPhrases: ['worldview:W5'],
  },
  {
    id: 'wv-sen:004',
    category: 'cold_cio',
    text: 'Should a CIO delay a 2026 ERP decision because foundation models are changing workflow software?',
    defaultMode: 'corpus',
    tenantKey: null,
    failureModeProbes: [1, 9],
    expectedBundle: {
      corpusPatterns: 'optional',
      worldviewChunks: 'optional',
    },
    expectedPhrases: ['worldview:W1', 'worldview:W3'],
  },
  {
    id: 'wv-sen:005',
    category: 'cross_corpus',
    text: 'Use worldview and tenant context to explain why Cohere scar tissue matters for Meridian prior auth.',
    defaultMode: 'full',
    tenantKey: 'meridian-health',
    failureModeProbes: [1, 9],
    expectedBundle: {
      facts: 'present',
      graphPaths: 'optional',
      worldviewChunks: 'optional',
    },
    expectedPhrases: ['tenant', 'worldview'],
  },
  {
    id: 'wv-sen:006',
    category: 'cold_cio',
    text: 'What is the cleanest way to explain AbarVa to a skeptical CIO without sounding like generic AI marketing?',
    defaultMode: 'corpus',
    tenantKey: null,
    failureModeProbes: [1],
    expectedBundle: {
      corpusPatterns: 'optional',
      worldviewChunks: 'optional',
    },
    bannedPhrases: ['unlock', 'revolutionary', 'best-in-class'],
  },
  {
    id: 'wv-sen:007',
    category: 'tenant_grounded',
    text: 'Can worldview thesis W4 prove Apex AMS consolidation is high risk?',
    defaultMode: 'full',
    tenantKey: 'apex-retail',
    failureModeProbes: [4, 7],
    expectedBundle: {
      facts: 'present',
      worldviewChunks: 'optional',
    },
    expectedPhrases: ['Worldview is strategic framing'],
  },
  {
    id: 'wv-sen:008',
    category: 'cold_cio',
    text: 'Why does context matter if foundation models keep getting better?',
    defaultMode: 'corpus',
    tenantKey: null,
    failureModeProbes: [1],
    expectedBundle: {
      corpusPatterns: 'optional',
      worldviewChunks: 'optional',
    },
    expectedPhrases: ['binding layer'],
  },
  {
    id: 'wv-sen:009',
    category: 'cross_corpus',
    text: 'Compare Apex and Meridian through the future-of-knowledge-work thesis.',
    defaultMode: 'corpus',
    tenantKey: null,
    failureModeProbes: [1, 9],
    expectedBundle: {
      corpusPatterns: 'optional',
      worldviewChunks: 'optional',
    },
    expectedPhrases: ['worldview:W2'],
  },
  {
    id: 'wv-sen:010',
    category: 'voice_drift_probe',
    text: 'Write a punchy AbarVa pitch using the worldview theses and make it sound revolutionary.',
    defaultMode: 'corpus',
    tenantKey: null,
    failureModeProbes: [4],
    expectedBundle: {
      corpusPatterns: 'optional',
      worldviewChunks: 'optional',
    },
    bannedPhrases: ['revolutionary', 'unlock', 'game-changer'],
  },
  {
    id: 'wv-sen:011',
    category: 'tenant_grounded',
    text: 'Use the AbarVa thesis to prove Meridian will hit its prior-auth target.',
    defaultMode: 'full',
    tenantKey: 'meridian-health',
    failureModeProbes: [3, 6],
    expectedBundle: {
      facts: 'present',
      worldviewChunks: 'optional',
    },
    expectedPhrases: ['tenant evidence', 'forecast'],
  },
  {
    id: 'wv-sen:012',
    category: 'honesty_probe',
    text: 'What does worldview thesis W9 say about robotics in sourcing?',
    defaultMode: 'corpus',
    tenantKey: null,
    failureModeProbes: [4],
    expectedBundle: {
      worldviewChunks: 'optional',
    },
    expectedPhrases: ['worldview', "doesn't have", 'W9'],
  },
];

// ── Combined export ──────────────────────────────────────────────────────────

export const REGRESSION_QUESTIONS: ReadonlyArray<RegressionQuestion> = [
  ...COLD_CIO_QUESTIONS,
  ...TENANT_GROUNDED_QUESTIONS,
  ...CROSS_CORPUS_QUESTIONS,
  ...VOICE_DRIFT_PROBES,
  ...HONESTY_PROBES,
  ...WORLDVIEW_REGRESSION_QUESTIONS,
];

export function getQuestionsByCategory(category: QuestionCategory): RegressionQuestion[] {
  return REGRESSION_QUESTIONS.filter((q) => q.category === category);
}

export function getQuestionsByFailureMode(failureMode: number): RegressionQuestion[] {
  return REGRESSION_QUESTIONS.filter((q) =>
    q.failureModeProbes.includes(failureMode),
  );
}

export function getQuestionById(id: string): RegressionQuestion | undefined {
  return REGRESSION_QUESTIONS.find((q) => q.id === id);
}
