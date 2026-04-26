import fs from 'node:fs';
import path from 'node:path';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

function getImportSpecifiers(source: string): string[] {
  const imports = source.matchAll(/from\s+['"]([^'"]+)['"]/g);
  return Array.from(imports, (match) => match[1]);
}

describe('source commercial canonical import boundary guard', () => {
  const executiveSummaryPath = 'src/lib/source/executive-decision-summary.ts';
  const executivePanelPath = 'src/components/source/SourceExecutiveDecisionSummaryPanel.tsx';

  const bannedCommercialModelImports = [
    './bafo-negotiation-model',
    './pricing-normalization-model',
    './commercial-risk-detection',
    './bafo-negotiation',
    './pricing-normalization',
  ];

  it('executive-decision-summary does not import parallel commercial model modules directly', () => {
    const source = read(executiveSummaryPath);
    const imports = getImportSpecifiers(source);

    for (const bannedImport of bannedCommercialModelImports) {
      expect(imports).not.toContain(bannedImport);
    }
  });

  it('executive-decision-summary imports canonical commercial contracts', () => {
    const source = read(executiveSummaryPath);
    const imports = getImportSpecifiers(source);

    expect(imports).toContain('./commercial-signals');
    expect(imports).toContain('./commercial-mission-adapter');
    expect(source).toContain('commercial-signals');
    expect(source).toContain('commercial-mission-adapter');
  });

  it('executive decision panel avoids direct imports of parallel commercial model modules', () => {
    const source = read(executivePanelPath);
    const imports = getImportSpecifiers(source);

    for (const bannedImport of bannedCommercialModelImports) {
      expect(imports).not.toContain(bannedImport);
    }
  });

  it('executive path references canonical flow modules', () => {
    const source = read(executiveSummaryPath);
    expect(source).toContain('commercial-signals');
    expect(source).toContain('commercial-mission-adapter');
    expect(source).toContain('sourceModulesUsed');
  });
});

