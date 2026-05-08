import { renderSourceDeliverable, type ScopeMemoSpec } from '../dispatch';
import type { SourceDeliverableSpec } from '../types';

function makeScopeMemoSpec(
  overrides: Partial<ScopeMemoSpec['payload']> = {},
): ScopeMemoSpec {
  return {
    kind: 'scope-memo',
    tenantKey: 'meridian',
    sourceEventId: 'event-1',
    title: 'Meridian Cloud Sourcing',
    generatedAt: '2026-05-08T03:30:00.000Z',
    payload: {
      eventCode: 'MERI-CLOUD-2026',
      eventName: 'Meridian Health Cloud & Infrastructure',
      issuedBy: 'Janet Fischer, VP IT Ops',
      body: '# Scope memo\n\nTier-1 systems include Epic CIS, MyChart, Cloverleaf.',
      bodyIsAuthored: true,
      ...overrides,
    },
  };
}

describe('renderSourceDeliverable · scope-memo', () => {
  it('returns docx by default with valid ZIP magic', async () => {
    const result = await renderSourceDeliverable(makeScopeMemoSpec() as unknown as SourceDeliverableSpec);
    expect(result.format).toBe('docx');
    expect(result.buffer[0]).toBe(0x50); // P
    expect(result.buffer[1]).toBe(0x4b); // K — ZIP magic
    expect(result.filename).toMatch(/d05_scope_memo__MERI-CLOUD-2026__\d{4}-\d{2}-\d{2}\.docx$/);
    expect(result.contentType).toContain('wordprocessing');
    expect(result.sizeBytes).toBeGreaterThan(2000);
  });

  it('returns html when requested', async () => {
    const result = await renderSourceDeliverable(makeScopeMemoSpec() as unknown as SourceDeliverableSpec, 'html');
    expect(result.format).toBe('html');
    const text = result.buffer.toString('utf8');
    expect(text).toContain('<!DOCTYPE html>');
    expect(text).toContain('Meridian Health Cloud');
    expect(result.filename).toMatch(/\.html$/);
    expect(result.contentType).toContain('html');
  });

  it.skip('returns pdf when requested with valid %PDF magic', async () => {
    // PDF coverage is verified via the existing render-pdf route; the
    // dispatch.ts pdf path uses dynamic-import for @react-pdf/renderer
    // to keep the static import graph jest-loadable. The dynamic
    // import chain doesn't resolve under jest's CJS sandbox without a
    // mock; punted to a follow-on slice.
    const result = await renderSourceDeliverable(makeScopeMemoSpec() as unknown as SourceDeliverableSpec, 'pdf');
    expect(result.format).toBe('pdf');
    expect(result.buffer.toString('latin1', 0, 4)).toBe('%PDF');
    expect(result.filename).toMatch(/\.pdf$/);
    expect(result.contentType).toBe('application/pdf');
  }, 15000);

  it('throws on a format not allowed for scope-memo', async () => {
    await expect(
      renderSourceDeliverable(makeScopeMemoSpec() as unknown as SourceDeliverableSpec, 'xlsx'),
    ).rejects.toThrow(/Format "xlsx" is not allowed for kind "scope-memo"/);
  });

  it('throws on a kind not yet wired through the dispatcher', async () => {
    const spec = makeScopeMemoSpec();
    // @ts-expect-error — testing runtime behavior with an unsupported kind
    spec.kind = 'pricing-template';
    await expect(renderSourceDeliverable(spec as unknown as SourceDeliverableSpec)).rejects.toThrow(
      /Source dispatcher does not yet handle kind/,
    );
  });
});
