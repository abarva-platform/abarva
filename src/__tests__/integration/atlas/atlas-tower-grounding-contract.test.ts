/**
 * Backlog item 65 — a contract test satisfied by a dead import.
 *
 * The case named "LLM payload is wired to current Tower state plus retrieval
 * context" used to read `src/lib/atlas/llm.ts` as text and assert six symbols
 * appeared in it. One of those symbols, `formatTowerCurrentStateForPrompt`, was
 * present only as an import that nothing called; `formatCleanTowerContext` is
 * what actually formats that state. Measured rather than argued: deleting the
 * unused import — a change with no effect on any prompt — turned the case red
 * (1 failed / 4 passed). A check that a token appears in a file cannot tell the
 * difference between wired and merely imported, which is the whole reason it
 * passed for as long as it did.
 *
 * The cases below drive the real `runAtlasLlm` and assert on the prompt
 * actually handed to the audited Anthropic client. The tool belt, retrieval,
 * the dossier loader and the model client are mocked because they are I/O; the
 * prompt assembly is NOT mocked — it is the subject.
 *
 * Identifier hygiene has its own thorough suite at
 * `src/__tests__/behaviors/atlas-prompt-identifier-hygiene.test.ts` (item 17).
 * One case is kept here so this file's own claim about the payload stands on a
 * behaviour rather than on a function name.
 */

// This file declares module-scoped fixtures; without an export it is a script
// and its names collide with other test files in the same program.
export {};

import { classifyAtlasIntent } from '@/lib/atlas/classifier';
import { buildAtlasSystemPrompt } from '@/lib/atlas/prompt';

const queryTowerCurrentState = jest.fn();
const queryPortfolioAggregates = jest.fn();
const querySignals = jest.fn();
const queryPrograms = jest.fn();
const queryUseCases = jest.fn();
const queryCohortBenchmarks = jest.fn();
const querySignalEvidence = jest.fn();
const assembleRetrievalContext = jest.fn();
const getDerivedEnterpriseReadForTenant = jest.fn();
const buildAtlasValueGrounding = jest.fn();
const loadCuratedSemanticDossier = jest.fn();
const getAuditedAnthropicClient = jest.fn();

jest.mock('@/lib/atlas/tool-belt', () => ({
  query_tower_current_state: (...args: unknown[]) =>
    queryTowerCurrentState(...args),
  query_portfolio_aggregates: (...args: unknown[]) =>
    queryPortfolioAggregates(...args),
  query_signals: (...args: unknown[]) => querySignals(...args),
  query_programs: (...args: unknown[]) => queryPrograms(...args),
  query_use_cases: (...args: unknown[]) => queryUseCases(...args),
  query_cohort_benchmarks: (...args: unknown[]) =>
    queryCohortBenchmarks(...args),
  query_signal_evidence: (...args: unknown[]) => querySignalEvidence(...args),
}));

jest.mock('@/lib/agent/retrieval', () => ({
  assembleRetrievalContext: (...args: unknown[]) =>
    assembleRetrievalContext(...args),
}));

jest.mock('@/lib/enterprise-context/derived-enterprise-read', () => ({
  getDerivedEnterpriseReadForTenant: (...args: unknown[]) =>
    getDerivedEnterpriseReadForTenant(...args),
}));

jest.mock('@/lib/atlas/value-grounding', () => ({
  buildAtlasValueGrounding: (...args: unknown[]) =>
    buildAtlasValueGrounding(...args),
  renderAtlasValueGrounding: () => 'Grounding: Tower substrate.',
}));

jest.mock('@/lib/semantic-dossiers', () => ({
  loadCuratedSemanticDossier: (...args: unknown[]) =>
    loadCuratedSemanticDossier(...args),
}));

jest.mock('@/lib/agent/stream', () => ({
  getAuditedAnthropicClient: (...args: unknown[]) =>
    getAuditedAnthropicClient(...args),
}));

/**
 * Business facts that exist only in this file's fixtures. Each sits on a field
 * the real tool belt populates, so a case failing means that source stopped
 * reaching the prompt — not that the fixture was contrived.
 */
const TOWER_INITIATIVE = 'Baggage telemetry modernisation';
const TOWER_VENDOR = 'Northwind Handling Systems';
const TOWER_PORTFOLIO_COMPANY = 'Terminal Operations';
const TOWER_PRESSURE = 'Renewal window is inside 90 days';
const RETRIEVED_CHUNK_TEXT =
  'Peers consolidated two of five baggage vendors during the 2025 renewal cycle.';
const RETRIEVED_SOURCE_KEY =
  'enterprise_context_chunks/skyharbor-air/vendor-brief-14.md';
const CLIENT_ID = '7c1f2a54-3b8d-4e21-9f44-b7a90c2d1e08';

function towerState() {
  return {
    client: {
      clientId: CLIENT_ID,
      clientName: 'Airline Demo',
      tenantKey: 'skyharbor-air',
      industryCode: 'GENERAL',
    },
    todayIso: '2026-09-18',
    activeLens: 'value',
    substrateCounts: {
      initiatives: 1,
      vendors: 1,
      kpiSnapshots: 0,
      decisions: 0,
      scenarios: 0,
      stakeholderNotes: 0,
      pressures: 1,
      observations: 0,
      alignmentDots: 0,
    },
    bandMetrics: { metrics: [] },
    pressuresView: {
      cards: [
        {
          headline: TOWER_PRESSURE,
          magnitudeLabel: '$1.2M renewal exposure',
          magnitudeConfidence: 'high',
          nextAction: 'Confirm commercial owner and renewal evidence.',
        },
      ],
    },
    atlasObservationsView: { observations: [] },
    alignment2x2View: { dots: [], strategicBets: [], totalPlotted: 0 },
    budgetRollups: [
      {
        portfolioCompany: TOWER_PORTFOLIO_COMPANY,
        totalItBudgetUsd: 4_500_000,
        actualSpendYtdUsd: 2_100_000,
        runAmountUsd: 3_000_000,
        changeAmountUsd: 1_500_000,
        itSpendAsPctRevenue: 0.072,
      },
    ],
    initiatives: [
      {
        id: 'init_5m21qd',
        name: TOWER_INITIATIVE,
        primaryCategoryName: 'Operations',
        ownerName: 'Operations lead',
        committedTotalUsd: 2_400_000,
        committedAnnualUsd: 800_000,
        measuredValueUsd: null,
        statusFlag: 'on_track',
        statusSummary: 'Telemetry rollout is tracking to plan.',
      },
    ],
    vendors: [
      {
        vendorName: TOWER_VENDOR,
        initiativeName: TOWER_INITIATIVE,
        contractValueUsd: 1_200_000,
        renewalDate: '2027-03-31',
        financialHealth: 'stable',
      },
    ],
    kpiSnapshots: [],
    decisions: [],
    scenarios: [],
    stakeholderNotes: [],
  };
}

/**
 * Where the raw tool-result JSON starts. The prompt has two halves and they are
 * governed differently: everything above is composed prose, including the
 * citation block; everything below is the serialized tool-result map.
 */
const PAYLOAD_MARKER_RE = /^(?:Supporting|Raw) tool context follows/m;

/**
 * The composed-prose half of the prompt.
 *
 * Every assertion below is scoped to it, and that is not tidiness. The tool
 * results are serialized into the payload as well, so the same tower fact and
 * the same retrieved chunk appear twice in the prompt for two different
 * reasons. An unscoped `toContain` therefore passes whether or not the
 * formatted section was ever assembled: the first draft of this suite asserted
 * on the whole prompt, and deleting `retrievedContext` from the user message
 * left the retrieval case green — it was reading the payload. Scoping is what
 * makes these cases able to fail.
 */
function prose(prompt: string): string {
  return prompt.slice(0, payloadOffset(prompt));
}

function payloadOffset(prompt: string): number {
  const index = prompt.search(PAYLOAD_MARKER_RE);
  if (index < 0) {
    throw new Error(
      'the line introducing the tool-result payload is not in the prompt; ' +
        'this suite splits the prompt on it and cannot tell the halves apart',
    );
  }
  return index;
}

/** The prompt text the model was actually given, from the audited client call. */
async function capturePrompt(message = 'what are others doing in our industry?') {
  const { runAtlasLlm } = await import('@/lib/atlas/llm');
  await runAtlasLlm(
    { clientId: CLIENT_ID, clientKey: 'skyharbor', userId: 'user-1' },
    message,
  );
  const call = getAuditedAnthropicClient.mock.calls.at(-1)?.[0] as
    | { prompt: string }
    | undefined;
  if (!call) throw new Error('the audited Anthropic client was never called');
  return call.prompt;
}

describe('Atlas Tower grounding contract', () => {
  it('routes open-ended industry and corpus questions through the LLM grounding path', () => {
    expect(classifyAtlasIntent('what are others doing in our industry?')).toEqual({
      intent: 'llm',
      routeType: 'llm',
    });
    expect(classifyAtlasIntent('answer this from the knowledge corpus')).toEqual({
      intent: 'llm',
      routeType: 'llm',
    });
    expect(classifyAtlasIntent('what can Tower answer?')).toEqual({
      intent: 'llm',
      routeType: 'llm',
    });
  });

  it('routes operational action requests to refusal discipline', () => {
    expect(classifyAtlasIntent('cancel the ServiceNow renewal')).toEqual({
      intent: 'strategy_refusal',
      routeType: 'scripted',
    });
  });

  it('system prompt prioritizes current Tower state and retrieved corpus context', () => {
    const prompt = buildAtlasSystemPrompt('Meridian Health');
    expect(prompt).toContain('Treat TOWER CURRENT STATE as the first source of truth');
    expect(prompt).toContain('For "what are others doing" questions');
    expect(prompt).toContain('If asked what Tower can answer');
    expect(prompt).toContain('Do not execute or simulate operational actions');
    expect(prompt).toContain('Never answer from another tenant');
    expect(prompt).toContain('AGENT OUTPUT CONTRACT v2026-06-05');
    expect(prompt).toContain('CXO decision digest labels: My read; Why; Decision fork; What I would do next; Evidence gap');
    expect(prompt).toContain('Simple factual questions stay simple');
    expect(prompt).not.toContain('Apex Retail Group');
  });

  describe('LLM payload is wired to current Tower state plus retrieval context', () => {
    const originalApiKey = process.env.ANTHROPIC_API_KEY;

    afterAll(() => {
      if (originalApiKey === undefined) delete process.env.ANTHROPIC_API_KEY;
      else process.env.ANTHROPIC_API_KEY = originalApiKey;
    });

    beforeEach(() => {
      jest.clearAllMocks();
      // Without a key `runAtlasLlm` returns the deterministic fallback and
      // never builds a prompt; these cases are about the prompt.
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      queryTowerCurrentState.mockResolvedValue(towerState());
      queryPortfolioAggregates.mockResolvedValue({
        initiativeCount: 1,
        totalCommittedUsd: 2_400_000,
      });
      querySignals.mockResolvedValue([]);
      queryPrograms.mockResolvedValue([]);
      queryUseCases.mockResolvedValue([]);
      queryCohortBenchmarks.mockResolvedValue(null);
      querySignalEvidence.mockResolvedValue(null);
      assembleRetrievalContext.mockResolvedValue({
        industryChunks: [],
        topicChunks: [],
        clientChunks: [
          {
            sourceKey: RETRIEVED_SOURCE_KEY,
            text: RETRIEVED_CHUNK_TEXT,
            score: 0.8,
          },
        ],
        atlasIacComposition: null,
      });
      getDerivedEnterpriseReadForTenant.mockResolvedValue(null);
      buildAtlasValueGrounding.mockResolvedValue({ claims: [] });
      loadCuratedSemanticDossier.mockResolvedValue(null);
      getAuditedAnthropicClient.mockResolvedValue({
        client: {
          messages: {
            create: jest.fn(async () => ({
              content: [{ type: 'text', text: 'Peers consolidated vendors.' }],
            })),
          },
        },
      });
    });

    it('queries current Tower state and puts its business facts in the prompt', async () => {
      const prompt = await capturePrompt();
      expect(queryTowerCurrentState).toHaveBeenCalled();
      expect(prose(prompt)).toContain('TOWER BUSINESS CONTEXT');
      expect(prose(prompt)).toContain(
        'Read model counts: 1 initiatives, 1 vendor rows, 0 KPI snapshots, 1 pressure signals.',
      );
      expect(prose(prompt)).toContain(TOWER_PORTFOLIO_COMPANY);
      expect(prose(prompt)).toContain('IT budget $4.5M');
      expect(prose(prompt)).toContain(TOWER_PRESSURE);
      // The initiative and the vendor come from different branches of the
      // formatter, so one surviving does not imply the other did.
      expect(prose(prompt)).toContain(TOWER_INITIATIVE);
      expect(prose(prompt)).toContain(TOWER_VENDOR);
    });

    it('assembles retrieval context and puts the retrieved text in the prompt', async () => {
      const prompt = await capturePrompt();
      expect(assembleRetrievalContext).toHaveBeenCalled();
      // Asserted on the chunk text, not on the "RETRIEVED CONTEXT" header:
      // `CITATION_INSTRUCTION` names that header in its own wording, so the
      // header alone survives the section being removed.
      expect(prose(prompt)).toContain(RETRIEVED_CHUNK_TEXT);
    });

    it('carries the citation instruction so the retrieved context can be cited', async () => {
      const prompt = await capturePrompt();
      expect(prose(prompt)).toContain('CITATION FORMAT');
      // The citation contract asks for "the exact source_key shown with the
      // chunk", so the key has to be above the payload where the chunk is.
      expect(prose(prompt)).toContain(RETRIEVED_SOURCE_KEY);
    });

    it('withholds record identifiers from the supporting tool payload', async () => {
      // Replaces an assertion that the string "sanitizeForTenantPrompt"
      // appeared in the module. That said nothing about what the function did.
      const prompt = await capturePrompt();
      expect(prompt).not.toContain(CLIENT_ID);
    });
  });

});
