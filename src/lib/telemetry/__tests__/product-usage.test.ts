import {
  deriveProductUsageModule,
  normalizeTelemetryText,
  safePathFromHref,
} from '../product-usage';

describe('product usage telemetry helpers', () => {
  it('maps product routes to the expected module', () => {
    expect(deriveProductUsageModule('/home')).toBe('home');
    expect(deriveProductUsageModule('/admin/context-layer/uploads')).toBe('setup');
    expect(deriveProductUsageModule('/strategic-moves/move-1')).toBe('moves');
    expect(deriveProductUsageModule('/source/events/event-1')).toBe('source');
    expect(deriveProductUsageModule('/intelligence/ask')).toBe('intelligence');
    expect(deriveProductUsageModule('/tower/portfolio')).toBe('tower');
  });

  it('normalizes and truncates telemetry labels', () => {
    expect(normalizeTelemetryText('  Ask   Sentinel  ')).toBe('Ask Sentinel');
    expect(normalizeTelemetryText('x'.repeat(120))).toHaveLength(96);
  });

  it('stores only path-level hrefs', () => {
    expect(safePathFromHref('https://app.abarva.ai/source?client=meridian')).toBe('/source?client=meridian');
    expect(safePathFromHref('/tower#value')).toBe('/tower#value');
  });
});
