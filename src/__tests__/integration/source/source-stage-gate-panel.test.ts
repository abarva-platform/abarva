import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SourceStageGatePanel } from '@/components/source/SourceStageGatePanel';
import { buildSourceStageGateReadiness, getSourceEventSeed, SOURCE_GOLDEN_EVENT_IDS } from '@/lib/source';

describe('Source stage gate panel', () => {
  it('renders deterministic stage gate signal and transition table', () => {
    const event = getSourceEventSeed(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    const readiness = buildSourceStageGateReadiness({ event: event! });
    const html = renderToStaticMarkup(createElement(SourceStageGatePanel, { readiness }));

    expect(html).toContain('Stage gate readiness');
    expect(html).toContain('Current gate signal');
    expect(html).toContain('Gate transition table');
    expect(html).toContain('Strategy -&gt; Scope');
    expect(html).toContain('Value -&gt; Closed');
    expect(html).toContain('Nexus next action');
  });

  it('keeps panel files free of model/upload/workflow engine imports', () => {
    const sources = [
      'src/components/source/SourceStageGatePanel.tsx',
      'src/components/source/SentinelEngagementCanvas.tsx',
      'src/lib/source/source-stage-gates.ts',
      'src/lib/source/mock-seed.ts',
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), 'utf8')).join('\n');

    expect(sources).not.toMatch(/from ['"][^'"]*(openai|anthropic|ai\/react|@anthropic-ai\/sdk)['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(upload|parser|parsing|workflow-engine|approval-engine|artifact-drawer)['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(database|supabase|migrations)['"]/i);
  });
});
