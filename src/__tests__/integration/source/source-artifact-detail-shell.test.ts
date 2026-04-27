import fs from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SOURCE_GOLDEN_EVENT_IDS } from '@/lib/source/constants';
import { getSourceArtifactSeed, getSourceEventSeed } from '@/lib/source/mock-seed';
import { buildSourceStageGateReadiness } from '@/lib/source/source-stage-gates';
import { SourceArtifactDrawer } from '@/components/source/SourceArtifactDrawer';

describe('Source artifact detail shell', () => {
  it('renders the Nexus-led artifact review shell with metadata, context, and action anchors', () => {
    const event = getSourceEventSeed(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    const artifact = getSourceArtifactSeed(
      SOURCE_GOLDEN_EVENT_IDS.dataAiModernization,
      'artifact-source-001-data-request',
    );

    expect(event).not.toBeNull();
    expect(artifact).not.toBeNull();
    if (!event || !artifact) return;

    const readiness = buildSourceStageGateReadiness({ event });
    const currentGate = readiness.gates.find((gate) => gate.fromStageKey === event.currentStageKey) ?? readiness.gates[0];

    const html = renderToStaticMarkup(createElement(SourceArtifactDrawer, {
      artifact,
      eventName: event.name,
      currentStageLabel: event.currentStageLabel,
      relatedGate: {
        label: currentGate.transitionLabel,
        state: currentGate.state,
        blocker: currentGate.blocker,
      },
    }));

    expect(html).toContain('Nexus artifact lead');
    expect(html).toContain('Show evidence');
    expect(html).toContain('Show version history');
    expect(html).toContain('Explain missing inputs');
    expect(html).toContain('Ask custom');
    expect(html).toContain('Context used');
    expect(html).toContain('Evidence and review rail');
    expect(html).toContain('Approval placeholder');
    expect(html).toContain('Version history placeholder');
    expect(html).toContain('Deterministic artifact review shell only');
  });

  it('keeps the route and artifact shell free of model, upload, parsing, and workflow imports', () => {
    const routeSource = fs.readFileSync(
      path.join(process.cwd(), 'src/app/(maestro)/source/events/[eventId]/artifacts/[artifactId]/page.tsx'),
      'utf8',
    );
    const componentSource = fs.readFileSync(
      path.join(process.cwd(), 'src/components/source/SourceArtifactDrawer.tsx'),
      'utf8',
    );

    expect(routeSource).toContain('SourceCanonShell');
    expect(componentSource).toContain('Custom artifact follow-up is deferred');

    for (const source of [routeSource, componentSource]) {
      expect(source).not.toMatch(/from ['"][^'"]*(openai|claude|anthropic|upload|parser|parsing|workflow-engine|approval-engine)[^'"]*['"]/i);
    }
  });
});
