import fs from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getSourceValueSeed } from '@/lib/source/mock-seed';
import { SourceValueLedger } from '@/components/source/SourceValueLedger';

describe('Source value ledger shell', () => {
  it('renders Ava-led value context, summary distinctions, and action layer', () => {
    const snapshot = getSourceValueSeed();

    const html = renderToStaticMarkup(createElement(SourceValueLedger, { snapshot }));

    expect(html).toContain('Ava value ledger lead');
    expect(html).toContain('Projected');
    expect(html).toContain('Committed');
    expect(html).toContain('Measuring');
    expect(html).toContain('Realized');
    expect(html).toContain('Context used');
    expect(html).toContain('Source context: seeded only');
    expect(html).toContain('Evidence confidence summary');
    expect(html).toContain('Assumptions');
    expect(html).toContain('variance notes');
    expect(html).toContain('Action layer');
    expect(html).not.toContain('chat');
    expect(html).toContain('Show assumptions');
    expect(html).toContain('Show evidence gaps');
    expect(html).toContain('Explain value confidence');
    expect(html).toContain('Ask Ava about this value ledger');
    expect(html).toContain('Submit (disabled until runtime)');
    expect(html).toContain('deterministic, seed-backed');
    expect(html).toContain('live realized-savings claim');
    expect(html).toContain('Deterministic seeded input only');
  });

  it('keeps value route/component free of model, upload, parsing, workflow, and approval engine imports', () => {
    const routeSource = fs.readFileSync(
      path.join(process.cwd(), 'src/app/(maestro)/source/value/page.tsx'),
      'utf8',
    );
    const componentSource = fs.readFileSync(
      path.join(process.cwd(), 'src/components/source/SourceValueLedger.tsx'),
      'utf8',
    );

    expect(routeSource).toContain('AppShell');
    expect(routeSource).toContain('surface="source"');
    expect(routeSource).toContain('SourceValueLedger');
    expect(componentSource).toContain('Ava value ledger lead');

    for (const source of [routeSource, componentSource]) {
      expect(source).not.toContain('openai');
      expect(source).not.toContain('claude');
      expect(source).not.toContain('anthropic');
      expect(source).not.toContain('upload');
      expect(source).not.toContain('parsing');
      expect(source).not.toContain('workflow-engine');
      expect(source).not.toContain('workflow automation');
      expect(source).not.toContain('approval engine');
      expect(source).not.toContain('live savings');
    }
  });

  it('keeps event value proof route free of raw DB and developer recovery copy', () => {
    const routeSource = fs.readFileSync(
      path.join(process.cwd(), 'src/app/(maestro)/source/events/[eventId]/value/page.tsx'),
      'utf8',
    );

    expect(routeSource).toContain('Value proof not loaded yet');
    expect(routeSource).toContain('Do not use this');
    expect(routeSource).toContain('page as savings proof');
    expect(routeSource).not.toContain('invalid input syntax');
    expect(routeSource).not.toContain('computeBaseline()');
    expect(routeSource).not.toContain('source value states load failed');
  });
});
