import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SentinelEngagementCanvas } from '@/components/source/SentinelEngagementCanvas';
import {
  SOURCE_GOLDEN_EVENT_IDS,
  buildSourcePricingNormalization,
  buildSourceVendorResponseCompleteness,
  buildSourceRfpReadiness,
  formatSourcePricingNormalizationAsMarkdown,
  getSourcingEvent,
} from '@/lib/source';

describe('Source vendor pricing smoke coverage', () => {
  it('surfaces vendor response completeness panel in the event canvas for vendor responses stage', async () => {
    const event = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild);
    expect(event?.currentStageKey).toBe('responses');

    const html = renderToStaticMarkup(createElement(SentinelEngagementCanvas, { event: event! }));

    expect(html).toContain('Vendor Response Completeness');
    expect(html).toContain('Event vendor response readiness');
    expect(html).toContain('Comparability readiness');
  });

  it('keeps pricing-normalization results aligned with response completeness outputs', async () => {
    const event = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild);
    expect(event).toBeTruthy();

    const vendorResponseReadiness = buildSourceVendorResponseCompleteness({ event: event! });
    const pricingReadiness = buildSourcePricingNormalization({ event: event! });

    const responseMap = new Map(vendorResponseReadiness.records.map((record) => [record.vendorId, record]));
    const pricingMap = new Map(pricingReadiness.snapshots.map((snapshot) => [snapshot.vendorId, snapshot]));

    for (const vendorId of responseMap.keys()) {
      const responseRow = responseMap.get(vendorId);
      const pricingRow = pricingMap.get(vendorId);
      expect(responseRow).toBeTruthy();
      expect(pricingRow).toBeTruthy();

      if (vendorId === 'vendor-b') {
        expect(responseRow?.comparabilityStatus).toBe('not_comparable');
        expect(pricingRow?.comparabilityStatus).toBe('not_comparable');
      } else if (responseRow?.comparabilityStatus === 'partially_comparable') {
        expect(['partially_comparable', 'risk_adjusted']).toContain(pricingRow?.comparabilityStatus);
      } else {
        expect(pricingRow?.comparabilityStatus).not.toBe('not_comparable');
      }
    }
  });

  it('does not return comparable pricing when required inputs are missing', async () => {
    const event = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild);
    const rfpReadiness = buildSourceRfpReadiness({ event: event! });
    const pricingReadiness = buildSourcePricingNormalization({ event: event! });

    expect(rfpReadiness.overallTier).not.toBe('Rich');
    expect(pricingReadiness.status).not.toBe('comparable');
    expect(pricingReadiness.comparisonReadiness).not.toBe('comparable');
  });

  it('surfaces pricing blockers in deterministic model output', async () => {
    const event = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild);
    const pricingReadiness = buildSourcePricingNormalization({ event: event! });
    const markdown = formatSourcePricingNormalizationAsMarkdown(pricingReadiness);

    expect(pricingReadiness.topCommercialTraps.length).toBeGreaterThan(0);
    expect(pricingReadiness.topCommercialTraps.length).toBeLessThanOrEqual(pricingReadiness.traps.length);
    expect(markdown).toContain('## Top traps');
    expect(markdown).toContain('Pricing template');
    expect(markdown).toContain('Nova Partner Group');
  });

  it('checks deterministic implementation boundaries in selected implementation files', async () => {
    const event = await getSourcingEvent(SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild);
    expect(event).toBeTruthy();

    const sources = [
      'src/components/source/SentinelEngagementCanvas.tsx',
      'src/components/source/SourceActiveStageWorkspace.tsx',
      'src/components/source/SourceVendorResponseCompletenessPanel.tsx',
      'src/lib/source/vendor-response-completeness.ts',
      'src/lib/source/pricing-normalization.ts',
      'src/lib/source/mock-seed.ts',
      'src/__tests__/integration/source/source-vendor-pricing-smoke.test.ts',
    ].map((path) => readFileSync(join(process.cwd(), path), 'utf8')).join('\n');

    expect(sources).not.toMatch(/from ['"][^'"]*(openai|anthropic|@anthropic-ai\/sdk|ai\/react|ai)['"]/i);
    expect(sources).not.toMatch(/fetch\(/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(upload|parser|artifact-drawer|scorecard-ui)['"]/i);
    expect(sources).not.toMatch(/from ['\"][^'"]*(artifact-drawer|upload|parser|model|api\/v1)['"]/i);
  });
});
