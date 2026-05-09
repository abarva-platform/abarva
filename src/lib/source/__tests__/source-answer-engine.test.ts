import {
  buildSourceAnswerEngine,
  detectSourceAnswerMode,
  type SourceAnswerMode,
} from '../source-answer-engine';
import type { SourceAgentContextBundle, SourceLiveTenantContextSnapshot } from '../agent-context';

const liveTenantContext: SourceLiveTenantContextSnapshot = {
  clientKey: 'apexretail',
  brokerTenantKey: 'apex-retail',
  inventoryRecordCount: 883,
  contextChunkCount: 935,
  embeddedContextChunkCount: 935,
  sourceEventFound: true,
  segments: [
    { segmentId: 'it_landscape', inventoryRecords: 96, contextChunks: 96, embeddedChunks: 96 },
    { segmentId: 'evidence_ledger', inventoryRecords: 20, contextChunks: 20, embeddedChunks: 20 },
    { segmentId: 'vendor_contracts', inventoryRecords: 38, contextChunks: 38, embeddedChunks: 38 },
    { segmentId: 'financial_model', inventoryRecords: 63, contextChunks: 63, embeddedChunks: 63 },
  ],
  currentStateAreas: ['IT Landscape', 'Evidence Ledger', 'Vendor Contracts', 'Financial Model'],
  evidenceBasis: [
    'IT Landscape: 96 records, 96 chunks, 96 embedded',
    'Evidence Ledger: 20 records, 20 chunks, 20 embedded',
  ],
  retrievedEvidence: [
    {
      id: 'chunk:evidence_ledger:identity',
      segmentId: 'evidence_ledger',
      recordId: 'evidence_ledger:ev:apex:001',
      title: 'Identity match baseline',
      sourceType: 'contextChunk',
      sourceDoc: 'data-quality-baseline-2026-q1.xlsx',
      excerpt: 'claim: Identity match rate across customer source systems is currently 71%.',
      confidence: 'high',
      score: 14,
    },
    {
      id: 'chunk:evidence_ledger:cdp',
      segmentId: 'evidence_ledger',
      recordId: 'evidence_ledger:ev:apex:009',
      title: 'CDP selection memo',
      sourceType: 'contextChunk',
      sourceDoc: 'CDP-Round-1-Selection-Memo-2026-04-15.pdf',
      excerpt: 'claim: Deloitte Digital was selected as CDP implementation partner; Treasure Data and Segment advanced to BAFO.',
      confidence: 'high',
      score: 13,
    },
    {
      id: 'chunk:it_landscape:martech',
      segmentId: 'it_landscape',
      recordId: 'it_landscape:martech',
      title: 'Martech integration landscape',
      sourceType: 'contextChunk',
      sourceDoc: 'martech-architecture-inventory.csv',
      excerpt: 'Current martech estate includes loyalty, email, web analytics, customer service, and data lake integrations.',
      confidence: 'high',
      score: 12,
    },
    {
      id: 'chunk:vendor_contracts:cdp',
      segmentId: 'vendor_contracts',
      recordId: 'vendor_contracts:cdp',
      title: 'CDP contract baseline',
      sourceType: 'contextChunk',
      sourceDoc: 'vendor-contract-register.csv',
      excerpt: 'Current customer data vendors include renewal and data-processing constraints that affect CDP implementation scope.',
      confidence: 'high',
      score: 11,
    },
    {
      id: 'chunk:financial_model:cdp',
      segmentId: 'financial_model',
      recordId: 'financial_model:cdp',
      title: 'CDP value case',
      sourceType: 'contextChunk',
      sourceDoc: 'cdp-value-model.xlsx',
      excerpt: 'CDP value model separates platform subscription, implementation, data engineering, and run support.',
      confidence: 'high',
      score: 10,
    },
    {
      id: 'chunk:org_structure:cdo',
      segmentId: 'org_structure',
      recordId: 'org_structure:cdo',
      title: 'CDO ownership',
      sourceType: 'contextChunk',
      sourceDoc: 'org-structure.csv',
      excerpt: 'Customer data activation decision rights sit with the CDO and CIO governance forum.',
      confidence: 'high',
      score: 9,
    },
  ],
  warnings: [],
};

const contextBundle: SourceAgentContextBundle = {
  tenant: { tenantId: 'apex-retail', tenantKey: 'apexretail', tenantName: 'Apex Retail Group' },
  user: { id: 'user-source-answer' },
  userRole: 'cio',
  persona: 'cio',
  route: '/api/v1/source/APX-SRC-CDP-2026/nexus/ask',
  surface: 'nexusPanel',
  contextScope: 'event',
  sourcingEvent: {
    id: 'apx-src-cdp-2026',
    code: 'APX-SRC-CDP-2026',
    name: 'CDP Vendor Selection',
    accountName: 'Apex Retail Group',
    archetype: 'platform_selection',
    rigor: 'strategic',
    lifecycleStatus: 'active',
    owner: 'Chief Digital Officer',
    currentStageKey: 'evaluation',
    valueAtStakeUsd: 2_400_000,
  },
  sourcingArchetype: 'platform_selection',
  liveTenantContext,
  blockers: [],
  requiredInputs: [],
  missingInputs: [],
  stageGates: [],
  artifacts: [],
  projectedValueLedger: [],
  uploadedFiles: [],
  selectedAttachmentIds: [],
  allowedActions: [],
  sourceOfTruthTimestamps: [],
  risks: [],
  decisions: [],
  parsedFileSummaries: [],
  evidenceCitations: [],
  relevantPatternSections: [],
  priorConversationTurns: [],
  userPrompt: 'How should the CIO shape the CDP sourcing event?',
  normalizedIntent: 'unknown',
  systemProposedActions: [],
  contextQuality: {
    contextCompleteness: 5,
    patternGrounding: 4,
    evidenceCoverage: 5,
    eventStateGrounding: 5,
    missingInputAwareness: 5,
    actionability: 5,
    vanillaResponseRisk: 1,
    overallConfidence: 'high',
    missingContextReasons: [],
  },
};

describe('Source answer engine', () => {
  it.each([
    ['What is Apex current state of affairs for the CDP event?', 'current_state'],
    ['Summarize org structure and tech landscape for this sourcing event.', 'current_state'],
    ['What should the CIO recommend before BAFO?', 'cxo_guidance'],
    ['What traps should we watch in CDP sourcing?', 'risk_traps'],
    ['What data is missing before we proceed?', 'missing_data'],
    ['How smart is Sentinel Source about IT outsourcing?', 'expert_sourcing'],
    ['What is the current financial baseline?', 'current_state'],
    ['How should the CFO shape value and pricing?', 'cxo_guidance'],
    ['Which vendor risk should we avoid?', 'risk_traps'],
    ['What gaps block a decision-grade recommendation?', 'missing_data'],
    ['How do we scope the RFP?', 'event_shaping'],
    ['What does the market and corpus say about CDP sourcing?', 'expert_sourcing'],
    ['What is the current tech landscape?', 'current_state'],
    ['How should this event be scored?', 'event_shaping'],
    ['Give CXO guidance for the selection decision.', 'cxo_guidance'],
    ['What commercial gotchas should we avoid?', 'risk_traps'],
    ['What baseline do we need?', 'missing_data'],
    ['Explain expert sourcing posture for AMS.', 'expert_sourcing'],
    ['What is the org structure implication?', 'current_state'],
    ['How should vendors be evaluated?', 'event_shaping'],
    ['What should the CDO steer?', 'cxo_guidance'],
    ['What red flags are in vendor demos?', 'risk_traps'],
    ['What required evidence is not ready?', 'missing_data'],
    ['What is the sourcing expertise lens?', 'expert_sourcing'],
    ['What is our financial and technology current state?', 'current_state'],
    ['How should the event shape the scorecard?', 'event_shaping'],
    ['What decision should the CFO make?', 'cxo_guidance'],
    ['What failure modes should Sentinel flag?', 'risk_traps'],
    ['What cannot proceed without more data?', 'missing_data'],
    ['What outsourcing knowledge should Source apply?', 'expert_sourcing'],
  ] satisfies Array<[string, SourceAnswerMode]>)('classifies %s', (prompt, mode) => {
    expect(detectSourceAnswerMode(prompt)).toBe(mode);
  });

  it('builds a cited CXO answer with current-state facts and CDP sourcing guidance', () => {
    const answer = buildSourceAnswerEngine({
      prompt: 'How should the CIO shape the CDP sourcing event?',
      contextBundle,
      userRole: 'cio',
    });

    expect(answer).toMatchObject({
      engineVersion: 'source-answer-engine/v1',
      mode: 'cxo_guidance',
      confidence: 'high',
      recommendedNextAction: 'Lock CDP scoring around identity, activation, integration ownership, governance, and full TCO before BAFO.',
    });
    expect(answer?.answerText).toContain('Current state');
    expect(answer?.answerText).toContain('CXO guidance');
    expect(answer?.expertLens[0]).toContain('enterprise data operating model');
    expect(answer?.evidenceCitations.length).toBeGreaterThanOrEqual(5);
    expect(answer?.evidenceCitations.map((citation) => citation.sourceDoc)).toEqual(
      expect.arrayContaining([
        'data-quality-baseline-2026-q1.xlsx',
        'CDP-Round-1-Selection-Memo-2026-04-15.pdf',
      ]),
    );
  });
});
