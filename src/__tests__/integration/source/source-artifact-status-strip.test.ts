import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SourceArtifactStatusStrip } from '@/components/source/SourceArtifactStatusStrip';
import { getSourceArtifactStatusStripSeed, SOURCE_GOLDEN_EVENT_IDS } from '@/lib/source';

describe('Source artifact status strip', () => {
  it('renders deterministic artifact metadata rows', () => {
    const seed = getSourceArtifactStatusStripSeed(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    const html = renderToStaticMarkup(createElement(SourceArtifactStatusStrip, { artifacts: seed.artifacts }));

    expect(html).toContain('Artifacts and deliverables');
    expect(html).toContain('Deterministic artifact status strip');
    expect(html).toContain('Sourcing Strategy Memo');
    expect(html).toContain('Pricing Template');
    expect(html).toContain('Executive Decision Brief');
    expect(html).toContain('Transition Readiness Checklist');
    expect(html).toContain('Value Ledger Assumptions');
  });

  it('keeps artifact strip implementation free of model/upload/workflow imports', () => {
    const sources = [
      'src/components/source/SourceArtifactStatusStrip.tsx',
      'src/components/source/SentinelEngagementCanvas.tsx',
      'src/lib/source/mock-seed.ts',
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), 'utf8')).join('\n');

    expect(sources).not.toMatch(/from ['"][^'"]*(openai|anthropic|ai\/react|@anthropic-ai\/sdk)['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(upload|parser|parsing|artifact-drawer|workflow-engine|approval-engine)['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(database|supabase|migrations)['"]/i);
  });
});
