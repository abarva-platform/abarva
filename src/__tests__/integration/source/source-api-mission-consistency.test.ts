import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  SOURCE_GOLDEN_EVENT_IDS,
  buildSourceAgentContextBundle,
  buildSourceMultiAgentBriefing,
  createSourceAgentMissionReport,
  createSourceNexusApiStubResponse,
  getSourceContextValidationReadableReport,
  getSourceWorkflowValidationReadableReport,
} from '@/lib/source';

const generatedAt = '2026-04-26T00:00:00.000Z';
const eventId = SOURCE_GOLDEN_EVENT_IDS.dataAiModernization;
const tenant = {
  tenantId: 'source-api-mission-consistency',
  tenantName: 'Source API Mission Consistency',
};
const user = {
  id: 'source-api-mission-consistency-user',
  email: 'source-consistency@example.com',
};

function buildSeededApiResponse() {
  return createSourceNexusApiStubResponse({
    eventId,
    prompt: 'What should happen next?',
    mode: 'event',
    userRole: 'sourcingLead',
    stageKey: 'scope',
    tenant,
    user,
    generatedAt,
  });
}

function buildSeededMissionReport() {
  const contextBundle = buildSourceAgentContextBundle({
    tenant,
    user,
    userRole: 'sourcingLead',
    persona: 'sourcingLead',
    route: '/source/events/evt-source-data-ai-si-selection',
    surface: 'nexusPanel',
    userPrompt: 'What should happen next?',
    eventId,
    stageKey: 'scope',
  });
  const contextValidationReport = getSourceContextValidationReadableReport({ generatedAt });
  const workflowValidationReport = getSourceWorkflowValidationReadableReport({ generatedAt });
  const multiAgentBriefing = buildSourceMultiAgentBriefing({
    contextBundle,
    contextValidationReport,
    workflowValidationReport,
    userRole: 'sourcingLead',
    mode: 'event',
    generatedAt,
  });

  return createSourceAgentMissionReport({
    contextBundle,
    contextValidationReport,
    workflowValidationReport,
    multiAgentBriefing,
    userRole: 'sourcingLead',
    mode: 'event',
    generatedAt,
  });
}

describe('Source API and mission report consistency', () => {
  it('keeps the Nexus API stub and mission report aligned on the seeded event blocker', () => {
    const apiResponse = buildSeededApiResponse();
    const missionReport = buildSeededMissionReport();
    const topMission = missionReport.topMissions[0];

    expect(apiResponse.ok).toBe(true);
    expect(apiResponse.noModel).toBe(true);
    expect(apiResponse.answerStatus).toBe('blocked');
    expect(apiResponse.eventId).toBe(eventId);
    expect(apiResponse.multiAgentBriefing?.overallReadiness).toBe('blocked');
    expect(apiResponse.multiAgentBriefing?.highestPriorityAction).toContain('missing inputs');
    expect(topMission).toMatchObject({
      agentName: 'steward',
      missionType: 'gate_check',
      title: 'Stage gate check required',
      priority: 'critical',
      state: 'blocked',
      sourceEventId: eventId,
    });
    expect(missionReport.recommendedNextAction).toBe(topMission?.recommendedAction);
  });

  it('includes Nexus, Sentinel, Atlas, and Steward in both deterministic outputs', () => {
    const apiResponse = buildSeededApiResponse();
    const missionReport = buildSeededMissionReport();

    expect(apiResponse.multiAgentBriefing?.nexus.agentName).toBe('nexus');
    expect(apiResponse.multiAgentBriefing?.sentinel.agentName).toBe('sentinel');
    expect(apiResponse.multiAgentBriefing?.atlas.agentName).toBe('atlas');
    expect(apiResponse.multiAgentBriefing?.steward.agentName).toBe('steward');
    expect(missionReport.countByAgent.nexus).toBeGreaterThan(0);
    expect(missionReport.countByAgent.sentinel).toBeGreaterThan(0);
    expect(missionReport.countByAgent.atlas).toBeGreaterThan(0);
    expect(missionReport.countByAgent.steward).toBeGreaterThan(0);
  });

  it('keeps suggested actions deterministic and preserves custom options', () => {
    const first = buildSeededApiResponse();
    const second = buildSeededApiResponse();
    const missionReport = buildSeededMissionReport();

    expect(first.suggestedActions).toEqual(second.suggestedActions);
    expect(first.suggestedActions.length).toBeGreaterThanOrEqual(4);
    expect(first.suggestedActions.some((action) => action.actionType === 'askCustomQuestion')).toBe(true);
    expect(missionReport.suggestedActions.some((action) => action.actionType === 'askCustomQuestion')).toBe(true);
    expect(first.suggestedActions.some((action) => action.agentName === 'nexus')).toBe(true);
    expect(first.suggestedActions.some((action) => action.agentName === 'steward')).toBe(true);
  });

  it('returns context and workflow validation summaries alongside mission evidence', () => {
    const apiResponse = buildSeededApiResponse();
    const missionReport = buildSeededMissionReport();

    expect(apiResponse.contextValidationSummary).toMatchObject({
      verdict: 'defer',
      deferCount: 2,
      rejectCount: 0,
    });
    expect(apiResponse.workflowValidationSummary).toMatchObject({
      verdict: 'defer',
      blockCount: 11,
      failCount: 0,
    });
    expect(apiResponse.defers.length).toBeGreaterThan(0);
    expect(apiResponse.warnings).toContain('No model was called. Response is deterministic.');
    expect(missionReport.blockers.length).toBeGreaterThan(0);
    expect(missionReport.defers.length).toBeGreaterThan(0);
  });

  it('does not import model providers, persistence, upload parsing, or UI runtime', () => {
    const sources = [
      'src/lib/source/nexus-api.ts',
      'src/app/api/v1/source/[eventId]/nexus/ask/route.ts',
      'src/lib/source/agent-mission-report.ts',
      'src/lib/source/agent-missions.ts',
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), 'utf8')).join('\n');

    expect(sources).not.toMatch(/from ['"][^'"]*(openai|anthropic|@anthropic-ai\/sdk|ai\/react|ai)['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(supabase|prisma|database|repository|upload|parse|parser)[^'"]*['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(components\/|react-dom|ProgramSurface|programs\/mock)[^'"]*['"]/i);
    expect(sources).not.toContain('createThread');
    expect(sources).not.toContain('appendTurn');
    expect(sources).not.toContain('setInterval');
    expect(sources).not.toContain('setTimeout');
  });
});
