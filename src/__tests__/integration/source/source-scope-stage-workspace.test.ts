import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SourceScopeStageWorkspace } from '@/components/source/SourceScopeStageWorkspace';
import { SOURCE_GOLDEN_EVENT_IDS, getSourcingEvent, createSourceAgentMissionReport, getSourceContextValidationReadableReport, getSourceWorkflowValidationReadableReport, buildSourceAgentContextBundle, buildSourceMultiAgentBriefing } from '@/lib/source';

describe('Source scope stage workspace', () => {
  it('renders seeded scope stage readiness and gate status', async () => {
    const event = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    expect(event?.currentStageKey).toBe('scope');

    const contextBundle = buildSourceAgentContextBundle({
      tenant: { tenantId: 'source-event-canvas-shell', tenantName: 'Source Scope Stage' },
      user: { id: 'source-scope-test' },
      userRole: 'sourcingLead',
      persona: 'sourcingLead',
      route: `/source/events/${event?.id}`,
      surface: 'eventCanvas',
      userPrompt: 'Scope readiness question',
      eventId: event?.id,
      stageKey: event?.currentStageKey,
    });
    const contextValidationReport = getSourceContextValidationReadableReport({ generatedAt: '2026-04-26T00:00:00.000Z' });
    const workflowValidationReport = getSourceWorkflowValidationReadableReport({ generatedAt: '2026-04-26T00:00:00.000Z' });
    const multiAgentBriefing = buildSourceMultiAgentBriefing({
      contextBundle,
      contextValidationReport,
      workflowValidationReport,
      userRole: 'sourcingLead',
      mode: 'event',
      generatedAt: '2026-04-26T00:00:00.000Z',
    });
    const missionReport = createSourceAgentMissionReport({
      contextBundle,
      contextValidationReport,
      workflowValidationReport,
      multiAgentBriefing,
      userRole: 'sourcingLead',
      mode: 'event',
      generatedAt: '2026-04-26T00:00:00.000Z',
    });

    const html = renderToStaticMarkup(createElement(SourceScopeStageWorkspace, {
      event: event!,
      missionReport,
      missionPreviewMissions: missionReport.topMissions.slice(0, 3),
    }));

    expect(html).toContain('Scope pricing readiness');
    expect(html).toContain('Stage goal');
    expect(html).toContain('Stage gate signal');
    expect(html).toContain('Move to Sourcing Strategy');
    expect(html).toContain('In-scope and out-of-scope');
    expect(html).toContain('Required baseline');
    expect(html).toContain('Pricing-impact baseline');
  });

  it('shows baseline readiness states and price-readiness categories', async () => {
    const event = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    const contextBundle = buildSourceAgentContextBundle({
      tenant: { tenantId: 'source-event-canvas-shell', tenantName: 'Source Scope Stage' },
      user: { id: 'source-scope-test' },
      userRole: 'sourcingLead',
      persona: 'sourcingLead',
      route: `/source/events/${event?.id}`,
      surface: 'eventCanvas',
      userPrompt: 'Scope pricing baseline check',
      eventId: event?.id,
      stageKey: event?.currentStageKey,
    });
    const contextValidationReport = getSourceContextValidationReadableReport({ generatedAt: '2026-04-26T00:00:00.000Z' });
    const workflowValidationReport = getSourceWorkflowValidationReadableReport({ generatedAt: '2026-04-26T00:00:00.000Z' });
    const multiAgentBriefing = buildSourceMultiAgentBriefing({
      contextBundle,
      contextValidationReport,
      workflowValidationReport,
      userRole: 'sourcingLead',
      mode: 'event',
      generatedAt: '2026-04-26T00:00:00.000Z',
    });
    const missionReport = createSourceAgentMissionReport({
      contextBundle,
      contextValidationReport,
      workflowValidationReport,
      multiAgentBriefing,
      userRole: 'sourcingLead',
      mode: 'event',
      generatedAt: '2026-04-26T00:00:00.000Z',
    });

    const html = renderToStaticMarkup(createElement(SourceScopeStageWorkspace, {
      event: event!,
      missionReport,
      missionPreviewMissions: missionReport.topMissions.slice(0, 3),
    }));

    expect(html).toContain('Application Inventory');
    expect(html).toContain('Workload Baseline');
    expect(html).toContain('Vendor Spend');
    expect(html).toContain('SLA Baseline');
    expect(html).toContain('Vendor Contracts');
    expect(html).toContain('Available');
    expect(html).toContain('Usable Evidence');
    expect(html).toContain('loaded, not usable');
    expect(html).toContain('available, not validated');
  });

  it('shows artifact placeholders and Nexus action guidance', async () => {
    const event = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    const contextBundle = buildSourceAgentContextBundle({
      tenant: { tenantId: 'source-event-canvas-shell', tenantName: 'Source Scope Stage' },
      user: { id: 'source-scope-test' },
      userRole: 'sourcingLead',
      persona: 'sourcingLead',
      route: `/source/events/${event?.id}`,
      surface: 'eventCanvas',
      userPrompt: 'Scope artifacts and guidance',
      eventId: event?.id,
      stageKey: event?.currentStageKey,
    });
    const contextValidationReport = getSourceContextValidationReadableReport({ generatedAt: '2026-04-26T00:00:00.000Z' });
    const workflowValidationReport = getSourceWorkflowValidationReadableReport({ generatedAt: '2026-04-26T00:00:00.000Z' });
    const multiAgentBriefing = buildSourceMultiAgentBriefing({
      contextBundle,
      contextValidationReport,
      workflowValidationReport,
      userRole: 'sourcingLead',
      mode: 'event',
      generatedAt: '2026-04-26T00:00:00.000Z',
    });
    const missionReport = createSourceAgentMissionReport({
      contextBundle,
      contextValidationReport,
      workflowValidationReport,
      multiAgentBriefing,
      userRole: 'sourcingLead',
      mode: 'event',
      generatedAt: '2026-04-26T00:00:00.000Z',
    });
    const html = renderToStaticMarkup(createElement(SourceScopeStageWorkspace, {
      event: event!,
      missionReport,
      missionPreviewMissions: missionReport.topMissions.slice(0, 3),
    }));

    expect(html).toContain('Artifact placeholders');
    expect(html).toContain('Scope Document');
    expect(html).toContain('Minimum Data Request');
    expect(html).toContain('RFP Outline');
    expect(html).toContain('Retained/Vendor Responsibility Matrix');
    expect(html).toContain('Nexus guidance');
    expect(html).toContain('Request missing workload baseline');
    expect(html).toContain('Confirm scope split with PMO');
  });

  it('keeps scope workspace inside deterministic Source boundaries', () => {
    const sources = [
      'src/components/source/SourceScopeStageWorkspace.tsx',
      'src/components/source/SourceActiveStageWorkspace.tsx',
      'src/components/source/SourceDataReadinessPanel.tsx',
      'src/lib/source/admin-setup-readiness-contract.ts',
      'src/lib/source/types.ts',
      'src/lib/source/queries.ts',
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), 'utf8')).join('\n');

    expect(sources).not.toMatch(/from ['"][^'"]*(openai|anthropic|@anthropic-ai\/sdk|ai\/react|ai)['"]/i);
    expect(sources).not.toMatch(/\bfetch\(/);
    expect(sources).not.toMatch(/from ['"][^'"]*(upload|parser|parsing|api\/v1|scorecard-ui|artifact-drawer|preview|demo|programs\/mock|ProgramSurface)['"]/i);
    expect(sources).not.toMatch(/\b(createModel|createConnector|uploadFile|parseDocument|parseUploadedFile)\b/);
  });
});
