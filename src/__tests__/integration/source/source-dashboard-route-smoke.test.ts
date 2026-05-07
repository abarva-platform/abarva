import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AbarVaSourceDashboard } from '@/components/source/AbarVaSourceDashboard';
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
    expect(html).toContain('Source command center');
    expect(html).toContain('Create sourcing event');
    expect(html).toContain('Executive pressure signals');
    expect(html).toContain('Agent missions');
    expect(html).toContain('Stage gate check required');
    expect(html).toContain('Value At Stake');
    expect(html).toContain('$98.3M');
  });

  it('keeps the Source route module wired to deterministic seed-only content', () => {
    const routeSource = readFileSync(join(process.cwd(), 'src/app/(maestro)/source/page.tsx'), 'utf8');
    const eventsRouteSource = readFileSync(join(process.cwd(), 'src/app/(maestro)/source/events/page.tsx'), 'utf8');
    const componentSource = readFileSync(join(process.cwd(), 'src/components/source/SourcePortfolioPage.tsx'), 'utf8');
    const tableSource = readFileSync(join(process.cwd(), 'src/components/source/SourcingEventTable.tsx'), 'utf8');

    // Route still mounts the SourcePortfolioPage — surface contract is unchanged
    // even though the page body was redesigned.
    expect(routeSource).toContain('SourcePortfolioPage');
    expect(eventsRouteSource).toContain('IT sourcing operating queue');
    expect(eventsRouteSource).toContain('Start IT sourcing event');
    expect(eventsRouteSource).toContain('The table is supporting evidence');
    // Compact-header portfolio surface — KPI strip + attention banners removed.
    // Status counts live in a thin DashboardStrip above the table; table rows
    // carry their own per-event signals.
    expect(componentSource).toContain('CompactHeader');
    expect(componentSource).toContain('DashboardStrip');
    expect(componentSource).toContain('PortfolioFilterSidebar');
    expect(componentSource).toContain('PortfolioEventsTable');
    expect(componentSource).toContain('PortfolioEmptyState');
    expect(componentSource).toContain('filterOutTestArtifacts');
    expect(componentSource).toContain('dedupeByEventCode');
    // Removed surfaces — no separate KPI strip, no attention-banner stack.
    expect(componentSource).not.toContain('KpiStrip');
    expect(componentSource).not.toContain('AttentionStack');
    // Legacy event-formation panels are gone — no agent canvas, work dock, or
    // mission preview on the portfolio surface.
    expect(componentSource).not.toContain('SourcePortfolioAgentCanvas');
    expect(componentSource).not.toContain('SourceWorkDock');
    expect(componentSource).not.toContain('SourceMissionPreview');
    expect(componentSource).not.toContain('Ask Sentinel');
    expect(componentSource).not.toContain('FilterPillStrip');
    // Existing event canvas table is untouched.
    expect(tableSource).toContain('Program / Evidence');
    expect(tableSource).toContain('Evidence posture: seeded summary; open event for readiness rows.');
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
      'src/app/(maestro)/source/events/page.tsx',
      'src/components/source/AbarVaSourceDashboard.tsx',
      'src/components/source/SourcePortfolioPage.tsx',
      'src/components/source/SourcingEventTable.tsx',
      'src/components/source/portfolio/PortfolioHeader.tsx',
      'src/components/source/portfolio/KpiStrip.tsx',
      'src/components/source/portfolio/AttentionStack.tsx',
      'src/components/source/portfolio/PortfolioFilterSidebar.tsx',
      'src/components/source/portfolio/PortfolioEventsTable.tsx',
      'src/components/source/portfolio/MiniRail.tsx',
      'src/components/source/portfolio/PortfolioEmptyState.tsx',
      'src/lib/source/agent-mission-report.ts',
      'src/lib/source/portfolio-filtering.ts',
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), 'utf8')).join('\n');

    expect(sources).not.toMatch(/from ['"][^'"]*(openai|anthropic|@anthropic-ai\/sdk|ai\/react|ai)['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(api\/v1|app\/api)[^'"]*['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(upload|parser|parsing|scorecard-ui|artifact-drawer)[^'"]*['"]/i);
    expect(sources).not.toMatch(/\bfetch\(/);
    expect(sources).not.toMatch(/\b(parseUploadedFile|parseDocument|uploadFile|createScorecardUi|openArtifactDrawer)\b/);
    expect(sources).not.toMatch(/from ['"][^'"]*(ProgramSurface|programs\/mock|preview|demo)[^'"]*['"]/i);
  });
});
