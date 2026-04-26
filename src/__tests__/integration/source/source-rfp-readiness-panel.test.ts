import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getSourcingEvent, SOURCE_GOLDEN_EVENT_IDS, buildSourceRfpReadiness } from '@/lib/source';
import { SourceRfpReadinessPanel } from '@/components/source/SourceRfpReadinessPanel';

type SourceRfpInputEvent = Parameters<typeof buildSourceRfpReadiness>[0]['event'];

describe('Source RFP readiness panel', () => {
  it('renders seeded overall RFP tier and blockers', async () => {
    const event = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    const readiness = buildSourceRfpReadiness({ event: event as SourceRfpInputEvent });

    const html = renderToStaticMarkup(createElement(SourceRfpReadinessPanel, { readiness }));

    expect(readiness.overallTier).not.toBe('Rich');
    expect(html).toContain('Event RFP readiness snapshot');
    expect(html).toContain('Overall tier');
    expect(html).toContain(readiness.overallTier);
    expect(html).toContain('Missing inputs');
    expect(html).toContain('RFP section readiness');
  });

  it('does not expose artifact generation behavior and keeps required sections visible', async () => {
    const event = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.amsConsolidation);
    const readiness = buildSourceRfpReadiness({ event: event as SourceRfpInputEvent });
    const html = renderToStaticMarkup(createElement(SourceRfpReadinessPanel, { readiness }));

    expect(html).toContain('Required artifacts');
    expect(html).toContain('Gate and stewardship notes');
    expect(html).toContain('Nexus recommendation');
    expect(html).toContain('Executive context');
    expect(html).not.toContain('artifact drawer');
    expect(readiness.rfpSections.length).toBeGreaterThan(10);
    expect(readiness.rfpSections[0]?.title).toContain('Executive context');
    expect(readiness.rfpSections[0]?.status).toBeTruthy();
  });

  it('renders no model or upload path in implementation', () => {
    const sources = [
      'src/components/source/SourceRfpReadinessPanel.tsx',
      'src/lib/source/rfp-readiness.ts',
      'src/lib/source/rfp-readiness-types.ts',
      'src/lib/source/index.ts',
      'src/lib/source/mock-seed.ts',
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), 'utf8')).join('\n');

    expect(sources).not.toMatch(/from ['"][^'"]*(openai|anthropic|@anthropic-ai\/sdk|ai\/react|ai)[^'"]*['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(upload|parser|parsing|artifact-drawer|uploadFile|createConnector|createDataset)[^'"]*['"]/i);
    expect(sources).not.toMatch(/\bfetch\(/i);
    expect(sources).not.toMatch(/app\/api/);
  });

  it('blocks Rich tier for seeded event without pricing-required inputs', async () => {
    const event = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    expect(event).toBeDefined();
    const readiness = buildSourceRfpReadiness({
      event: {
        ...event!,
        dataReadiness: event!.dataReadiness.map((item) =>
          item.category === 'Ticket History' || item.category === 'SLA Baseline'
            ? { ...item, evidenceUsability: 'not_available', readinessState: 'Missing', confidence: 'low' }
            : item,
        ),
        currentStageKey: 'scope',
      },
    });

    expect(readiness.overallTier).not.toBe('Rich');
    expect(readiness.missingInputs.some((input) => input.category === 'Ticket History')).toBe(true);
    expect(readiness.missingInputs.some((input) => input.category === 'SLA Baseline')).toBe(true);

    const html = renderToStaticMarkup(createElement(SourceRfpReadinessPanel, { readiness }));
    expect(html).toContain('Missing');
  });
});
