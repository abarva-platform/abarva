import {
  renderGeneratedSourceArtifactFormats,
} from '../generated-artifact-rendering';
import type { SourceGenerationContext } from '../agent-generation/types';

function makeCtx(): SourceGenerationContext {
  return {
    tenantKey: 'skyharbor',
    tenantName: 'SkyHarbor Air',
    event: {
      id: 'event-1',
      code: 'SKYH-AQ1B-2026',
      name: 'AQ1b DOCX Rendering Proof',
      archetype: 'managed_service',
      rigor: 'strategic',
      currentStageKey: 'scope',
      statusLabel: 'Active',
      owner: 'Anand Sundaram',
      triggerDescription: null,
      scopeDescription: null,
      estimatedValueUsd: 1,
    },
    artifactStates: [],
    gateCriteria: [],
    evidence: [],
  };
}

describe('renderGeneratedSourceArtifactFormats', () => {
  it('renders DOCX primary, HTML preview, and internal markdown source for d05', async () => {
    const result = await renderGeneratedSourceArtifactFormats({
      artifactCode: 'd05_scope_memo',
      artifactId: 'artifact-state-1',
      body: [
        '# Scope Memo',
        '',
        '## In scope',
        '',
        '| Area | Included |',
        '|---|---|',
        '| Applications | Yes |',
      ].join('\n'),
      ctx: makeCtx(),
      generatedAt: '2026-06-16T17:00:00.000Z',
    });

    expect(result.errors).toEqual([]);
    expect(result.primary.format).toBe('docx');
    expect(result.primary.filename).toBe('Scope_Memo-artifact.docx');
    expect(result.primary.contentType).toMatch(/wordprocessingml/);
    expect(result.primary.bytes.subarray(0, 2).toString('latin1')).toBe('PK');

    expect(result.preview?.format).toBe('html');
    expect(result.preview?.filename).toBe('Scope_Memo-artifact_preview.html');
    expect(result.preview?.bytes.toString('utf8')).toContain('<article class="source-doc">');
    expect(result.preview?.bytes.toString('utf8')).toContain('AQ1b DOCX Rendering Proof');
    expect(result.preview?.bytes.toString('utf8')).toContain('Company: SkyHarbor Air');
    expect(result.preview?.bytes.toString('utf8')).not.toContain('Tenant:');

    expect(result.source?.format).toBe('md');
    expect(result.source?.filename).toBe('Scope_Memo-artifact_source.md');
    expect(result.source?.bytes.toString('utf8')).toContain('## In scope');
  });

  it('falls back to markdown primary when no DOCX renderer is available', async () => {
    const result = await renderGeneratedSourceArtifactFormats({
      artifactCode: 'unsupported_generated_note',
      artifactId: 'artifact-state-2',
      body: '# Internal Note\n\nStill persisted as markdown.',
      ctx: makeCtx(),
      generatedAt: '2026-06-16T17:00:00.000Z',
    });

    expect(result.primary.format).toBe('md');
    expect(result.primary.role).toBe('primary');
    expect(result.primary.filename).toMatch(/\.md$/);
    expect(result.primary.bytes.toString('utf8')).toContain('Still persisted');
    expect(result.source).toBeNull();
    expect(result.errors).toContain('docx:unsupported:unsupported_generated_note');
  });
});
