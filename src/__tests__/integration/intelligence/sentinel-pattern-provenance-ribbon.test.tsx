import { readFileSync } from 'fs';
import { join } from 'path';
import { renderToStaticMarkup } from 'react-dom/server';
import { IntelligenceProvenanceRibbon } from '@/components/intelligence/IntelligenceProvenanceRibbon';
import { buildPatternProvenanceRibbonView } from '@/lib/intelligence/intelligence-provenance-ribbon-view';
import { buildSentinelPatternDetailView } from '@/lib/intelligence/sentinel-pattern-view';
import {
  buildSentinelPatternDetectionsForTenant,
} from '@/lib/intelligence/sentinel-pattern-detections';
import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';

const plan = buildAllProgramsSeedPlan();

describe('Intelligence pattern provenance ribbon', () => {
  it('builds deterministic Pattern provenance from the Sentinel pattern detail view', () => {
    const tenant = plan.tenants[0];
    const [detection] = buildSentinelPatternDetectionsForTenant(tenant);
    const detail = buildSentinelPatternDetailView(tenant, detection.patternKey);

    expect(detail).not.toBeNull();
    const ribbon = buildPatternProvenanceRibbonView(detail!);

    expect(ribbon).toEqual({
      primitive: 'Pattern',
      sourceLabel: 'pattern_detection_read_model',
      storeBinding: 'deterministic read model + evidence trail projection',
      signalCount: detail!.sourceSignalIds.length,
      programCount: detail!.affectedProgramRows.length,
      citationReadinessLabel: 'not_yet_wired',
      runtimeLabel: 'no live Sentinel / no model invocation',
    });
  });

  it('renders the provenance ribbon as visible Intelligence chrome', () => {
    const html = renderToStaticMarkup(
      <IntelligenceProvenanceRibbon
        view={{
          primitive: 'Pattern',
          sourceLabel: 'pattern_detection_read_model',
          storeBinding: 'deterministic read model + evidence trail projection',
          signalCount: 3,
          programCount: 2,
          citationReadinessLabel: 'not_yet_wired',
          runtimeLabel: 'no live Sentinel / no model invocation',
        }}
      />,
    );

    expect(html).toContain('Intelligence provenance ribbon');
    expect(html).toContain('Primitive');
    expect(html).toContain('Pattern');
    expect(html).toContain('pattern detection read model');
    expect(html).toContain('3 seeded signal id(s)');
    expect(html).toContain('2 affected program route(s)');
    expect(html).toContain('not yet wired');
    expect(html).toContain('no live Sentinel / no model invocation');
  });

  it('wires SentinelPatternDetail to the provenance ribbon', () => {
    const componentSource = readWorkspaceFile(
      'src/components/intelligence/SentinelPatternDetail.tsx',
    );

    expect(componentSource).toContain('IntelligenceProvenanceRibbon');
    expect(componentSource).toContain('buildPatternProvenanceRibbonView(view)');
  });

  it('does not claim graph-store provenance, live retrieval, or model invocation', () => {
    const viewSource = readWorkspaceFile(
      'src/lib/intelligence/intelligence-provenance-ribbon-view.ts',
    );
    const componentSource = readWorkspaceFile(
      'src/components/intelligence/IntelligenceProvenanceRibbon.tsx',
    );
    const combined = `${viewSource}\n${componentSource}`.toLowerCase();

    expect(combined).not.toContain('graph store');
    expect(combined).not.toContain('live retrieval enabled');
    expect(combined).not.toContain('anthropic');
    expect(combined).not.toContain('openai');
    expect(combined).not.toContain('pinecone');
  });
});

function readWorkspaceFile(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}
