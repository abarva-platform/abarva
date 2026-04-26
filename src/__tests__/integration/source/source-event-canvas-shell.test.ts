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
    expect(html).toContain('Data readiness placeholder');
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

  it('keeps the event canvas shell inside the approved Source boundary', () => {
    const sources = [
      'src/app/(maestro)/source/events/[eventId]/page.tsx',
      'src/components/source/NexusEngagementCanvas.tsx',
      'src/components/source/SourceJourneyTracker.tsx',
      'src/components/source/SourceStagePanel.tsx',
      'src/components/source/SourceActiveStageWorkspace.tsx',
      'src/components/source/PersistentNexusPanel.tsx',
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), 'utf8')).join('\n');

    expect(sources).not.toMatch(/from ['"][^'"]*(openai|anthropic|@anthropic-ai\/sdk|ai\/react|ai)['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(api\/v1|app\/api)[^'"]*['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(upload|parser|parsing|scorecard-ui|artifact-drawer)[^'"]*['"]/i);
    expect(sources).not.toMatch(/\bfetch\(/);
    expect(sources).not.toMatch(/\b(parseUploadedFile|parseDocument|uploadFile|createScorecardUi|openArtifactDrawer)\b/);
    expect(sources).not.toMatch(/from ['"][^'"]*(ProgramSurface|programs\/mock|preview|demo)[^'"]*['"]/i);
  });
});
