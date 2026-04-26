import { readFileSync } from 'fs';
import { resolve } from 'path';

import {
  SOURCE_GOLDEN_EVENT_IDS,
  buildSourceAgentContextBundle,
  buildSourceMultiAgentBriefing,
  createSourceAgentMissionReport,
  formatSourceAgentMissionReportAsMarkdown,
  getSourceAgentMissionReadableReport,
  getSourceAgentMissionRemediations,
  getSourceContextValidationReadableReport,
  getSourceWorkflowValidationReadableReport,
  summarizeSourceAgentMissionReport,
  type SourceAgentMissionInput,
} from '@/lib/source';

const generatedAt = '2026-04-26T00:00:00.000Z';
const tenant = {
  tenantId: 'tenant-test',
  tenantName: 'Test Tenant',
};
const user = {
  id: 'user-test',
  email: 'source-report@example.com',
};

function buildReportInput(): SourceAgentMissionInput {
  const contextBundle = buildSourceAgentContextBundle({
    tenant,
    user,
    userRole: 'sourcingLead',
    persona: 'sourcingLead',
    route: '/source',
    surface: 'nexusPanel',
    userPrompt: 'What are the current Source agent missions?',
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

describe('Source agent mission report formatter', () => {
  it('builds a readable report from seeded Data and AI event missions', () => {
    const report = createSourceAgentMissionReport(buildReportInput());

    expect(report.reportVersion).toBe('source-agent-mission-report/v1');
    expect(report.sourceEventId).toBe(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    expect(report.sourceEventName).toBe('Data & AI Modernization SI Selection');
    expect(report.generatedAt).toBe(generatedAt);
  });

  it('includes deterministic mission counts', () => {
    const report = getSourceAgentMissionReadableReport(buildReportInput());

    expect(report.missionCount).toBe(11);
    expect(report.countByPriority).toMatchObject({
      critical: 2,
      high: 7,
      medium: 2,
      low: 0,
    });
    expect(report.countByState.blocked).toBeGreaterThan(0);
    expect(report.countByState.waiting).toBeGreaterThan(0);
  });

  it('includes Nexus, Sentinel, Atlas, and Steward groups', () => {
    const report = getSourceAgentMissionReadableReport(buildReportInput());

    expect(report.countByAgent.nexus).toBeGreaterThan(0);
    expect(report.countByAgent.sentinel).toBeGreaterThan(0);
    expect(report.countByAgent.atlas).toBeGreaterThan(0);
    expect(report.countByAgent.steward).toBeGreaterThan(0);
  });

  it('includes top priority mission, blockers, defers, and handoffs', () => {
    const report = getSourceAgentMissionReadableReport(buildReportInput());

    expect(report.topMissions[0]?.agentName).toBe('steward');
    expect(report.topMissions[0]?.title).toBe('Stage gate check required');
    expect(report.criticalMissions).toHaveLength(2);
    expect(report.blockers.length).toBeGreaterThan(0);
    expect(report.defers.length).toBeGreaterThan(0);
    expect(report.handoffs.some((handoff) => handoff.includes('steward -> nexus'))).toBe(true);
  });

  it('formats markdown and summarizes the report', () => {
    const report = getSourceAgentMissionReadableReport(buildReportInput());
    const markdown = formatSourceAgentMissionReportAsMarkdown(report);
    const summary = summarizeSourceAgentMissionReport(report);
    const remediations = getSourceAgentMissionRemediations(report);

    expect(markdown).toContain('# Source Agent Mission Report');
    expect(markdown).toContain('## Top Missions');
    expect(markdown).toContain('Stage gate check required');
    expect(summary).toContain('11 Source agent missions');
    expect(remediations.length).toBeGreaterThan(0);
  });

  it('does not import model providers, UI, persistence, or program runtime', () => {
    const files = [
      'src/lib/source/agent-mission-report.ts',
      'src/lib/source/agent-missions.ts',
    ].map((filePath) => readFileSync(resolve(process.cwd(), filePath), 'utf8')).join('\n');

    expect(files).not.toMatch(/from ['"][^'"]*(openai|anthropic|@anthropic-ai\/sdk|ai\/react|ai)['"]/i);
    expect(files).not.toMatch(/from ['"][^'"]*(react|components\/|app\/api)[^'"]*['"]/i);
    expect(files).not.toMatch(/from ['"][^'"]*(supabase|prisma|database|repository|ProgramSurface|programs\/mock)[^'"]*['"]/i);
    expect(files).not.toContain('createThread');
    expect(files).not.toContain('appendTurn');
    expect(files).not.toContain('setInterval');
    expect(files).not.toContain('setTimeout');
  });
});
