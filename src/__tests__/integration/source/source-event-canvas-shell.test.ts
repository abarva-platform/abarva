import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import SourceEventDetailPage from '@/app/(maestro)/source/events/[eventId]/page';
import { NexusEngagementCanvas } from '@/components/source/NexusEngagementCanvas';
import {
  SOURCE_GOLDEN_EVENT_IDS,
  getSourcingEvent,
} from '@/lib/source';

describe('Source event canvas shell', () => {
  it('renders the seeded event canvas shell deterministically', async () => {
    const event = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    expect(event).toBeDefined();

    const html = renderToStaticMarkup(createElement(NexusEngagementCanvas, { event: event! }));

    expect(html).toContain('Journey map');
    expect(html).toContain('Current-stage workspace');
    expect(html).toContain('Data readiness');
    expect(html).toContain('Evidence posture for this stage');
    expect(html).toContain('Source consumes Admin/Setup readiness');
    expect(html).toContain('Artifacts / reviews placeholder');
    expect(html).toContain('Nexus guidance');
    expect(html).toContain('Agent mission preview');
  });

  it('keeps Scope visible as the current blocked stage with required baseline inputs', async () => {
    const event = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    const html = renderToStaticMarkup(createElement(NexusEngagementCanvas, { event: event! }));

    expect(html).toContain('Scope');
    expect(html).toContain('Blocked');
    expect(html).toContain('Application inventory');
    expect(html).toContain('Analytics workload baseline');
    expect(html).toContain('Application inventory and analytics workload baseline missing');
    expect(html).toContain('Workload Baseline');
    expect(html).toContain('Retained Roles');
    expect(html).toContain('Requested');
    expect(html).toContain('Blocks Rich-tier Scope and makes pricing normalization unsafe.');
    expect(html).toContain('Blocks clear scope split and transition responsibility language.');
  });

  it('renders deterministic Nexus and mission content without API calls', async () => {
    const page = await SourceEventDetailPage({
      params: Promise.resolve({ eventId: SOURCE_GOLDEN_EVENT_IDS.dataAiModernization }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain('Source event canvas shell led by Nexus');
    expect(html).toContain('Lead sourcing agent');
    expect(html).toContain('Top mission');
    expect(html).toContain('Stage gate check required');
    expect(html).toContain('Deterministic guidance only');
  });

  it('includes the deterministic data readiness panel with missing and usable evidence states', async () => {
    const event = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    const html = renderToStaticMarkup(createElement(NexusEngagementCanvas, { event: event! }));

    expect(html).toContain('Data readiness');
    expect(html).toContain('Workload Baseline');
    expect(html).toContain('Ticket History');
    expect(html).toContain('Requested');
    expect(html).toContain('Missing');
    expect(html).toContain('Application Inventory');
    expect(html).toContain('Usable Evidence');
    expect(html).toContain('usable evidence');
    expect(html).toContain('Vendor Contracts');
    expect(html).toContain('Loaded');
    expect(html).toContain('loaded, not usable');
    expect(html).toContain('Vendor Spend');
    expect(html).toContain('Available');
    expect(html).toContain('available, not validated');
    expect(html).toContain('Loaded and Available');
    expect(html).toContain('Steward to Admin/Setup intake');
  });

  it('keeps the event canvas shell inside the approved Source boundary', () => {
    const sources = [
      'src/app/(maestro)/source/events/[eventId]/page.tsx',
      'src/components/source/NexusEngagementCanvas.tsx',
      'src/components/source/SourceJourneyTracker.tsx',
      'src/components/source/SourceStagePanel.tsx',
      'src/components/source/SourceActiveStageWorkspace.tsx',
      'src/components/source/SourceDataReadinessPanel.tsx',
      'src/components/source/PersistentNexusPanel.tsx',
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), 'utf8')).join('\n');

    expect(sources).not.toMatch(/from ['"][^'"]*(openai|anthropic|@anthropic-ai\/sdk|ai\/react|ai)['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(api\/v1|app\/api)[^'"]*['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(upload|parser|parsing|scorecard-ui|artifact-drawer)[^'"]*['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(admin\/setup|platform\/admin|connectors|migrations)[^'"]*['"]/i);
    expect(sources).not.toMatch(/\bfetch\(/);
    expect(sources).not.toMatch(/\b(parseUploadedFile|parseDocument|uploadFile|createConnector|createDataset|createScorecardUi|openArtifactDrawer)\b/);
    expect(sources).not.toMatch(/from ['"][^'"]*(ProgramSurface|programs\/mock|preview|demo)[^'"]*['"]/i);
  });
});
