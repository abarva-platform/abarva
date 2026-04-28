import { readFileSync } from 'fs';
import { join } from 'path';
import { renderToStaticMarkup } from 'react-dom/server';

import { KnowledgeFabricHealthPanel } from '@/components/intelligence/KnowledgeFabricHealthPanel';
import { buildKnowledgeFabricHealthPanelView } from '@/lib/intelligence/knowledge-fabric-health-view';

describe('KnowledgeFabricHealthPanel', () => {
  it('builds deterministic byte-equal panel views', () => {
    const first = buildKnowledgeFabricHealthPanelView();
    const second = buildKnowledgeFabricHealthPanelView();

    expect(second).toEqual(first);
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });

  it('renders health title, source/citation basis, and deterministic caveat', () => {
    const view = buildKnowledgeFabricHealthPanelView();
    const html = renderToStaticMarkup(<KnowledgeFabricHealthPanel view={view} />);

    expect(html).toContain('Knowledge fabric health');
    expect(html).toContain('Total primitives');
    expect(html).toContain('Source-backed');
    expect(html).toContain('Citation-backed');
    expect(html).toContain('Contradiction findings');
    expect(html).toContain('deterministic seed corpus data');
    expect(html).toContain('does not index, persist, or mutate');
  });

  it('mounts inside the Intelligence summary tab', () => {
    const source = readWorkspaceFile('src/components/intelligence/IntelligenceLensTabs.tsx');

    expect(source).toContain('KnowledgeFabricHealthPanel');
    expect(source.indexOf('Summary context used')).toBeLessThan(
      source.indexOf('<KnowledgeFabricHealthPanel />'),
    );
    expect(source.indexOf('<KnowledgeFabricHealthPanel />')).toBeLessThan(
      source.indexOf('Recommended action'),
    );
  });

  it('does not use live retrieval, model SDKs, graph writes, or runtime randomness', () => {
    const source = [
      readWorkspaceFile('src/lib/intelligence/knowledge-fabric-health-view.ts'),
      readWorkspaceFile('src/components/intelligence/KnowledgeFabricHealthPanel.tsx'),
    ].join('\n');

    expect(source).not.toMatch(/fetch\(|openai|anthropic|pinecone|supabase/i);
    expect(source).not.toMatch(/indexCorpus|createKnowledgeFabric|resolveKnowledgeFabricWriteMode/);
    expect(source).not.toMatch(/Date\.now|Math\.random|new Date\(/);
    expect(source).not.toMatch(/live retrieval|live graph|live vector/i);
  });
});

function readWorkspaceFile(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}
