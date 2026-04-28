import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AbarVaSourceDashboard } from '@/components/source/AbarVaSourceDashboard';
import SourceDashboardPage from '@/app/(maestro)/source/page';
import {
  SOURCE_GOLDEN_EVENT_IDS,
  buildSourceAgentContextBundle,
  buildSourceMultiAgentBriefing,
  createSourceAgentMissionReport,
  getSourceContextValidationReadableReport,
  getSourceDashboardData,
  getSourceWorkflowValidationReadableReport,
} from '@/lib/source';

const generatedAt = '2026-04-26T00:00:00.000Z';

function buildDashboardMissionReport() {
  const contextBundle = buildSourceAgentContextBundle({
    tenant: {
      tenantId: 'source-dashboard-preview',
      tenantName: 'Source Dashboard Preview',
    },
    user: {
      id: 'source-dashboard-preview',
    },
    userRole: 'sourcingLead',
    persona: 'sourcingLead',
    route: '/source',
    surface: 'dashboard',
    userPrompt: 'Show deterministic Source dashboard missions.',
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
    mode: 'dashboard',
    generatedAt,
  });

  return createSourceAgentMissionReport({
    contextBundle,
    contextValidationReport,
    workflowValidationReport,
    multiAgentBriefing,
    userRole: 'sourcingLead',
    mode: 'dashboard',
    generatedAt,
  });
}

describe('Source dashboard route smoke', () => {
  it('renders the dashboard component from seeded data', async () => {
    const data = await getSourceDashboardData();
    const html = renderToStaticMarkup(createElement(AbarVaSourceDashboard, { data }));

    expect(html).toContain('Source command read');
    expect(html).toContain('Executive pressure signals');
    expect(html).toContain('Agent missions');
    expect(html).toContain('Stage gate check required');
    expect(html).toContain('Value At Stake');
    expect(html).toContain('$98.3M');
  });

  it('keeps the Source route module wired to deterministic seed-only content', () => {
    const routeSource = readFileSync(join(process.cwd(), 'src/app/(maestro)/source/page.tsx'), 'utf8');
    const componentSource = readFileSync(join(process.cwd(), 'src/components/source/SourceIndexPage.tsx'), 'utf8');

    expect(routeSource).toContain('SourceIndexPage');
    expect(componentSource).toContain('AMS Vendor Consolidation 2026');
    expect(componentSource).toContain('ACTIVE EVENT');
    expect(componentSource).not.toMatch(/fetch\(|openai|claude|anthropic/i);
  });

  it('builds mission preview data deterministically from the seeded Source event', () => {
    const report = buildDashboardMissionReport();

    expect(report.sourceEventId).toBe(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    expect(report.missionCount).toBe(11);
    expect(report.countByAgent).toMatchObject({
      nexus: expect.any(Number),
      sentinel: expect.any(Number),
      atlas: expect.any(Number),
      steward: expect.any(Number),
    });
    expect(report.topMissions[0]).toMatchObject({
      agentName: 'steward',
      title: 'Stage gate check required',
      priority: 'critical',
    });
  });

  it('keeps the dashboard route smoke deterministic and inside Source scope', () => {
    const sources = [
      'src/app/(maestro)/source/page.tsx',
      'src/components/source/AbarVaSourceDashboard.tsx',
      'src/lib/source/agent-mission-report.ts',
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), 'utf8')).join('\n');

    expect(sources).not.toMatch(/from ['"][^'"]*(openai|anthropic|@anthropic-ai\/sdk|ai\/react|ai)['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(api\/v1|app\/api)[^'"]*['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(upload|parser|parsing|scorecard-ui|artifact-drawer)[^'"]*['"]/i);
    expect(sources).not.toMatch(/\bfetch\(/);
    expect(sources).not.toMatch(/\b(parseUploadedFile|parseDocument|uploadFile|createScorecardUi|openArtifactDrawer)\b/);
    expect(sources).not.toMatch(/from ['"][^'"]*(ProgramSurface|programs\/mock|preview|demo)[^'"]*['"]/i);
  });
});
