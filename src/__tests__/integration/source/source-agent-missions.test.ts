import { readFileSync } from 'fs';
import { resolve } from 'path';

import {
  SOURCE_GOLDEN_EVENT_IDS,
  buildSourceAgentContextBundle,
  buildSourceAgentMissions,
  buildSourceMultiAgentBriefing,
  formatSourceAgentMissionsAsMarkdown,
  getSourceContextValidationReadableReport,
  getSourceWorkflowValidationReadableReport,
  prioritizeSourceAgentMissions,
  summarizeSourceAgentMissions,
  type SourceAgentMission,
  type SourceAgentMissionInput,
  type SourceAgentMissionPriority,
} from '@/lib/source';

const generatedAt = '2026-04-26T00:00:00.000Z';
const tenant = {
  tenantId: 'tenant-test',
  tenantName: 'Test Tenant',
};
const user = {
  id: 'user-test',
  email: 'source-missions@example.com',
};

function buildMissionInput(): SourceAgentMissionInput {
  const contextBundle = buildSourceAgentContextBundle({
    tenant,
    user,
    userRole: 'sourcingLead',
    persona: 'sourcingLead',
    route: '/source',
    surface: 'nexusPanel',
    userPrompt: 'What should Source agents do next?',
    eventId: SOURCE_GOLDEN_EVENT_IDS.dataAiModernization,
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

  return {
    contextBundle,
    contextValidationReport,
    workflowValidationReport,
    multiAgentBriefing,
    userRole: 'sourcingLead',
    mode: 'event',
    generatedAt,
  };
}

function findMission(
  missions: SourceAgentMission[],
  agentName: SourceAgentMission['agentName'],
  missionType: SourceAgentMission['missionType'],
): SourceAgentMission | undefined {
  return missions.find((mission) => mission.agentName === agentName && mission.missionType === missionType);
}

describe('Source deterministic agent mission read model', () => {
  it('creates a Nexus mission for the seeded Data and AI event', () => {
    const missions = buildSourceAgentMissions(buildMissionInput());
    const nexusMission = findMission(missions, 'nexus', 'next_action');

    expect(nexusMission).toBeTruthy();
    expect(nexusMission?.sourceEventId).toBe(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    expect(nexusMission?.stageId).toBe('scope');
    expect(nexusMission?.recommendedAction).toBeTruthy();
    expect(nexusMission?.suggestedActions.some((action) => action.actionType === 'askCustomQuestion')).toBe(true);
  });

  it('turns missing Source inputs into a Nexus data request mission', () => {
    const missions = buildSourceAgentMissions(buildMissionInput());
    const dataMission = findMission(missions, 'nexus', 'data_readiness');

    expect(dataMission).toBeTruthy();
    expect(dataMission?.title).toBe('Minimum data request needed');
    expect(dataMission?.state).toBe('waiting');
    expect(dataMission?.priority).toBe('high');
    expect(dataMission?.recommendedAction).toContain('minimum data request');
    expect(dataMission?.blockerReason).toContain('Missing inputs');
  });

  it('turns context validation defers into a Sentinel mission', () => {
    const missions = buildSourceAgentMissions(buildMissionInput());
    const sentinelMission = findMission(missions, 'sentinel', 'validation_defer');

    expect(sentinelMission).toBeTruthy();
    expect(sentinelMission?.state).toBe('deferred');
    expect(sentinelMission?.trigger).toBe('validation_defer_detected');
    expect(sentinelMission?.handoffTarget).toBe('nexus');
  });

  it('turns workflow blockers into a Steward mission', () => {
    const missions = buildSourceAgentMissions(buildMissionInput());
    const stewardMission = findMission(missions, 'steward', 'workflow_blocker');

    expect(stewardMission).toBeTruthy();
    expect(stewardMission?.state).toBe('blocked');
    expect(stewardMission?.priority).toBe('critical');
    expect(stewardMission?.blockerReason).toBeTruthy();
  });

  it('turns value at stake into an Atlas mission', () => {
    const missions = buildSourceAgentMissions(buildMissionInput());
    const atlasMission = findMission(missions, 'atlas', 'value_risk');

    expect(atlasMission).toBeTruthy();
    expect(atlasMission?.summary).toContain('$18.5M');
    expect(atlasMission?.recommendedAction).toContain('executive value/risk brief');
  });

  it('prioritizes missions deterministically', () => {
    const missions = buildSourceAgentMissions(buildMissionInput());
    const priorities: Record<SourceAgentMissionPriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    const priorityRanks = prioritizeSourceAgentMissions(missions).map((mission) => priorities[mission.priority]);
    const sortedRanks = [...priorityRanks].sort((a, b) => a - b);

    expect(priorityRanks).toEqual(sortedRanks);
    expect(prioritizeSourceAgentMissions(missions)[0]?.priority).toBe('critical');
  });

  it('formats missions as markdown for review and demos', () => {
    const missions = buildSourceAgentMissions(buildMissionInput());
    const markdown = formatSourceAgentMissionsAsMarkdown(missions);
    const summary = summarizeSourceAgentMissions(missions);

    expect(markdown).toContain('# Source Agent Missions');
    expect(markdown).toContain('## Mission Inventory');
    expect(markdown).toContain('Workflow gate is blocked');
    expect(summary).toContain('Source agent missions:');
  });

  it('does not import model providers, persistence, UI, schedulers, or program runtime', () => {
    const files = [
      'src/lib/source/agent-missions.ts',
      'src/lib/source/agent-mission-types.ts',
    ].map((filePath) => readFileSync(resolve(process.cwd(), filePath), 'utf8')).join('\n');

    expect(files).not.toMatch(/from ['"][^'"]*(openai|anthropic|@anthropic-ai\/sdk|ai\/react|ai)['"]/i);
    expect(files).not.toMatch(/from ['"][^'"]*(supabase|prisma|database|repository|ProgramSurface|programs\/mock)[^'"]*['"]/i);
    expect(files).not.toMatch(/from ['"][^'"]*(react|components\/|app\/api)[^'"]*['"]/i);
    expect(files).not.toContain('setInterval');
    expect(files).not.toContain('setTimeout');
    expect(files).not.toContain('createThread');
    expect(files).not.toContain('appendTurn');
  });
});
