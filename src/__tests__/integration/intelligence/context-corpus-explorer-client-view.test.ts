import { readFileSync } from 'node:fs';

describe('Context Corpus Explorer client view', () => {
  const explorerSource = readFileSync(
    'src/components/intelligence-v4/ContextCorpusExplorerPage.tsx',
    'utf8',
  );

  it('leads with derived insight language instead of substrate inventory', () => {
    expect(explorerSource).toContain('What your context is telling us');
    expect(explorerSource).toContain('The strongest cross-context reads.');
    expect(explorerSource).toContain('Signals combine business context');
    expect(explorerSource).toContain('Browse the business context behind the insights.');
    expect(explorerSource).toContain('Patterns the context can now reason across.');
    expect(explorerSource).toContain('Executive Signals');
    expect(explorerSource).toContain('Corpus Library');
  });

  it('does not expose demo/debug or data-plumbing language on the client shell', () => {
    expect(explorerSource).not.toContain('tenant key');
    expect(explorerSource).not.toContain('Tower fallback/empty');
    expect(explorerSource).not.toContain('Dimensions loaded');
    expect(explorerSource).not.toContain('Evidence points');
    expect(explorerSource).not.toContain('Graph edges');
    expect(explorerSource).not.toContain('Top CIO read');
    expect(explorerSource).not.toContain('Spend to prove');
    expect(explorerSource).not.toContain('Which AI initiatives should we kill, and why?');
  });
});
