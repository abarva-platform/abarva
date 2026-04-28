import { readFileSync } from 'fs';
import { join } from 'path';
import { renderToStaticMarkup } from 'react-dom/server';
import { IntelligenceSourceBasisPanel } from '@/components/intelligence/IntelligenceSourceBasisPanel';
import { buildIntelligenceSourceBasisPanelView } from '@/lib/intelligence/intelligence-source-basis-panel-view';
import { buildSentinelPatternDetailView } from '@/lib/intelligence/sentinel-pattern-view';
import { buildSentinelPatternDetectionsForTenant } from '@/lib/intelligence/sentinel-pattern-detections';
import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';

const plan = buildAllProgramsSeedPlan();

describe('Intelligence source basis panel', () => {
  it('summarizes internal and external basis rows for a detected pattern', () => {
    const tenant = plan.tenants[0];
    const [detection] = buildSentinelPatternDetectionsForTenant(tenant);
    const detail = buildSentinelPatternDetailView(tenant, detection.patternKey);

    expect(detail).not.toBeNull();
    const panel = buildIntelligenceSourceBasisPanelView(detail!);

    expect(panel.patternKey).toBe(detection.patternKey);
    expect(panel.totalBases).toBe(panel.internalCount + panel.externalCount);
    expect(panel.internalCount).toBeGreaterThanOrEqual(1);
    expect(panel.externalCount).toBeGreaterThanOrEqual(1);
    expect(panel.internalRows).toHaveLength(panel.internalCount);
    expect(panel.externalRows).toHaveLength(panel.externalCount);
    expect(panel.honestDisclaimer.toLowerCase()).toContain('deterministic seed');
  });

  it('renders internal basis, external basis, confidence, and citation locators', () => {
    const tenant = plan.tenants[0];
    const [detection] = buildSentinelPatternDetectionsForTenant(tenant);
    const detail = buildSentinelPatternDetailView(tenant, detection.patternKey);
    const panel = buildIntelligenceSourceBasisPanelView(detail!);

    const html = renderToStaticMarkup(<IntelligenceSourceBasisPanel view={panel} />);

    expect(html).toContain('Intelligence source basis');
    expect(html).toContain('Internal basis');
    expect(html).toContain('External basis');
    expect(html).toMatch(/HIGH|MEDIUM|LOW/);
    expect(html).toContain('citationLocator'.replace('citationLocator', panel.internalRows[0].citationLocator));
    expect(html).toContain('no live external retrieval');
  });

  it('wires SentinelPatternDetail to the source basis panel under provenance', () => {
    const componentSource = readWorkspaceFile(
      'src/components/intelligence/SentinelPatternDetail.tsx',
    );

    expect(componentSource).toContain('IntelligenceProvenanceRibbon');
    expect(componentSource).toContain('IntelligenceSourceBasisPanel');
    expect(componentSource.indexOf('IntelligenceProvenanceRibbon')).toBeLessThan(
      componentSource.indexOf('IntelligenceSourceBasisPanel'),
    );
  });

  it('does not claim live retrieval, graph schema, or model runtime', () => {
    const viewSource = readWorkspaceFile(
      'src/lib/intelligence/intelligence-source-basis-panel-view.ts',
    );
    const componentSource = readWorkspaceFile(
      'src/components/intelligence/IntelligenceSourceBasisPanel.tsx',
    );
    const combined = `${viewSource}\n${componentSource}`.toLowerCase();

    expect(combined).not.toContain('fetch(');
    expect(combined).not.toContain('graph schema');
    expect(combined).not.toContain('anthropic');
    expect(combined).not.toContain('openai');
    expect(combined).not.toContain('pinecone');
  });
});

function readWorkspaceFile(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}
