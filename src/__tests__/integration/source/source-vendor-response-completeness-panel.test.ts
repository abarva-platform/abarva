import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NexusEngagementCanvas } from '@/components/source/NexusEngagementCanvas';
import { SourceVendorResponseCompletenessPanel } from '@/components/source/SourceVendorResponseCompletenessPanel';
import {
  SOURCE_GOLDEN_EVENT_IDS,
  buildSourceVendorResponseCompleteness,
  getSourcingEvent,
} from '@/lib/source';

describe('Source vendor response completeness panel', () => {
  it('renders seeded vendors with completeness and comparability signals', async () => {
    const event = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild);
    expect(event).toBeDefined();
    const readiness = buildSourceVendorResponseCompleteness({ event: event! });

    const html = renderToStaticMarkup(createElement(SourceVendorResponseCompletenessPanel, { readiness }));

    expect(html).toContain('Vendor Response Completeness');
    expect(html).toContain('Vertex CloudOps');
    expect(html).toContain('Nova Partner Group');
    expect(html).toContain('Aegis Digital');
    expect(html).toContain('not_comparable');
    expect(html).toContain('critical section missing - Pricing template');
    expect(html).toContain('low confidence');
  });

  it('surfaces vendor response completeness in the event canvas at vendor responses stage', async () => {
    const event = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild);
    expect(event).toBeTruthy();
    expect(event?.currentStageKey).toBe('responses');

    const html = renderToStaticMarkup(createElement(NexusEngagementCanvas, { event: event! }));

    expect(html).toContain('Vendor Response Completeness');
    expect(html).toContain('Event vendor response readiness');
    expect(html).toContain('Comparability readiness');
  });

  it('keeps panel imports deterministic and dependency-free', async () => {
    const event = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild);
    const readiness = buildSourceVendorResponseCompleteness({ event: event! });
    renderToStaticMarkup(createElement(SourceVendorResponseCompletenessPanel, { readiness }));

    const sources = [
      'src/components/source/SourceVendorResponseCompletenessPanel.tsx',
      'src/components/source/SourceActiveStageWorkspace.tsx',
      'src/lib/source/vendor-response-completeness.ts',
      'src/lib/source/vendor-response-types.ts',
      'src/lib/source/mock-seed.ts',
      'src/__tests__/integration/source/source-vendor-response-completeness-panel.test.ts',
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), 'utf8')).join('\n');

    expect(sources).not.toMatch(/from ['"][^'"]*(openai|anthropic|@anthropic-ai\/sdk|ai\/react|ai)['"]/i);
    expect(sources).not.toMatch(/\bfetch\(/);
  });
});
