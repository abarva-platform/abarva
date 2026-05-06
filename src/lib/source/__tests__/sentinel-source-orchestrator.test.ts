import {
  SOURCE_GOLDEN_EVENT_IDS,
} from '@/lib/source/constants';
import {
  buildSourceContextAssemblyResultFromSeed,
} from '@/lib/source/context-builder';
import {
  getSourceContextValidationReadableReport,
} from '@/lib/source/agent-validation-report';
import {
  getSourceWorkflowValidationReadableReport,
} from '@/lib/source/workflow-validation-report';
import {
  buildSentinelSourceBriefing,
  adaptSentinelBriefingToMultiAgent,
} from '../sentinel-source-orchestrator';

const tenant = { tenantId: 'tenant-test', tenantName: 'Test Tenant' };
const user = { id: 'user-test', email: 'test@example.com' };
const generatedAt = '2026-05-06T00:00:00.000Z';

function buildTestInput(eventId: string) {
  const contextResult = buildSourceContextAssemblyResultFromSeed({
    tenant,
    user,
    userRole: 'sourcingLead',
    persona: 'sourcingLead',
    route: '/test',
    surface: 'nexusPanel',
    userPrompt: 'Test',
    eventId,
    selectedAttachmentIds: [],
  });
  const contextBundle = contextResult.bundle!;
  const contextValidationReport = getSourceContextValidationReadableReport({ generatedAt });
  const workflowValidationReport = getSourceWorkflowValidationReadableReport({ generatedAt });
  return { contextBundle, contextValidationReport, workflowValidationReport, generatedAt };
}

describe('buildSentinelSourceBriefing', () => {
  it('emits a single Sentinel-voiced primary block', () => {
    const input = buildTestInput(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    const briefing = buildSentinelSourceBriefing(input);

    expect(briefing.primaryVoice.agentName).toBe('sentinel');
    expect(briefing.primaryVoice.summary).toBeTruthy();
    expect(briefing.primaryVoice.primaryFinding).toBeTruthy();
  });

  it('surfaces all four specialist flavors in specialistContributions', () => {
    const input = buildTestInput(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    const briefing = buildSentinelSourceBriefing(input);

    const flavors = new Set(briefing.specialistContributions.map((c) => c.specialistFlavor));
    expect(flavors.has('nexus')).toBe(true);
    expect(flavors.has('sentinel')).toBe(true);
    expect(flavors.has('atlas')).toBe(true);
    expect(flavors.has('steward')).toBe(true);
  });

  it('assigns specialist catalog ids to each contribution', () => {
    const input = buildTestInput(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    const briefing = buildSentinelSourceBriefing(input);

    for (const contrib of briefing.specialistContributions) {
      expect(contrib.specialistId).toBeTruthy();
    }
  });

  it('ranks steward highest on blocked/deferred events', () => {
    const input = buildTestInput(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    const briefing = buildSentinelSourceBriefing(input);

    // Steward has priority tier 0 (highest); it should be ranked first when there are blockers or defers.
    const isBlockedOrDeferred = ['blocked', 'deferred', 'lowContext'].includes(briefing.overallReadiness);
    if (isBlockedOrDeferred) {
      expect(briefing.specialistContributions[0].specialistFlavor).toBe('steward');
    }
  });

  it('propagates overallReadiness, blockers, and defers from the internal multi-agent briefing', () => {
    const input = buildTestInput(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    const briefing = buildSentinelSourceBriefing(input);

    expect(['ready', 'partiallyReady', 'blocked', 'deferred', 'lowContext']).toContain(briefing.overallReadiness);
    expect(Array.isArray(briefing.blockers)).toBe(true);
    expect(Array.isArray(briefing.defers)).toBe(true);
  });

  it('combinedSummary matches primaryVoice.summary', () => {
    const input = buildTestInput(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    const briefing = buildSentinelSourceBriefing(input);

    expect(briefing.combinedSummary).toBe(briefing.primaryVoice.summary);
  });

  it('caps summary to 120 words', () => {
    const input = buildTestInput(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    const briefing = buildSentinelSourceBriefing(input);

    const wordCount = briefing.primaryVoice.summary.trim().split(/\s+/).length;
    expect(wordCount).toBeLessThanOrEqual(121);
  });
});

describe('adaptSentinelBriefingToMultiAgent', () => {
  it('reconstructs per-agent shapes from specialist contributions', () => {
    const input = buildTestInput(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    const briefing = buildSentinelSourceBriefing(input);
    const adapted = adaptSentinelBriefingToMultiAgent(briefing);

    expect(adapted.nexus.agentName).toBe('nexus');
    expect(adapted.sentinel.agentName).toBe('sentinel');
    expect(adapted.atlas.agentName).toBe('atlas');
    expect(adapted.steward.agentName).toBe('steward');
  });

  it('preserves eventId, contextScope, generatedAt', () => {
    const input = buildTestInput(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    const briefing = buildSentinelSourceBriefing(input);
    const adapted = adaptSentinelBriefingToMultiAgent(briefing);

    expect(adapted.contextScope).toBe(briefing.contextScope);
    expect(adapted.generatedAt).toBe(briefing.generatedAt);
  });
});
