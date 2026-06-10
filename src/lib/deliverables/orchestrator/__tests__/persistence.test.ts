// PR-5 proof: a completed deliverable persists through the artifacts repository
// contract (mapping is correct), and a gate-blocked result is refused.
import { persistDeliverable } from '../persistence';
import type { OrchestrationResult } from '../orchestrator';
import { getArtifactBrief } from '../artifact-brief-registry';
import { amsRfpRequest, goodDocument } from '../__fixtures__/ams-rfp';
import type { GeneratedArtifactRecord } from '@/lib/artifacts/repository';
import type { TenantAiPolicy } from '@/lib/integrations/ai-egress';

const tenantPolicy = {} as TenantAiPolicy;

function okResult(): OrchestrationResult {
  const req = amsRfpRequest();
  return {
    ok: true,
    brief: getArtifactBrief(req),
    document: goodDocument(),
    quality: { pass: true, blockers: [], warnings: ['evidence underused'], metrics: {} as never },
    passTrace: [
      { pass: 'architect', maxTokens: 6000, highStakes: true, outputChars: 100, responseId: 'r1' },
      { pass: 'render_package', maxTokens: 16000, highStakes: true, outputChars: 100, responseId: 'r6' },
    ],
  } as OrchestrationResult;
}

describe('persistDeliverable', () => {
  it('maps the document into the generated_artifacts contract and saves it', async () => {
    let savedInput: unknown;
    let savedRendered: unknown;
    const mockSave = (async (input: unknown, rendered: unknown) => {
      savedInput = input;
      savedRendered = rendered;
      return { id: 'art-1', clientId: 'c1', metadata: {} } as unknown as GeneratedArtifactRecord;
    }) as never;

    const rec = await persistDeliverable(
      okResult(),
      { clientId: 'c1', renderedBy: 'u1', sourceArtifactRef: 'evt-skyharbor-ams', tenantPolicy, evidenceLedgerIds: ['ev-1', 'ev-2'] },
      { save: mockSave },
    );

    expect(rec.id).toBe('art-1');
    const input = savedInput as Record<string, unknown>;
    const rendered = savedRendered as Record<string, unknown>;
    expect(input.artifactType).toBe('source_board_pack'); // module=source
    expect(input.title).toMatch(/SkyHarbor/);
    expect((input.sections as unknown[]).length).toBeGreaterThan(0);
    expect((input.facts as unknown[]).length).toBe(goodDocument().sourceRegister.length);
    expect(rendered.outputFormat).toBe('docx');
    expect(typeof rendered.html).toBe('string');
    expect((rendered.html as string)).toMatch(/SkyHarbor/);
    expect(rendered.blobSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(rendered.evidenceLedgerIds).toEqual(['ev-1', 'ev-2']);
    expect(rendered.generationEgressAudit).toBe('r1,r6'); // response ids stitched
    expect(rendered.qualityScore as number).toBeLessThan(1); // one warning → small penalty
    expect(rendered.qualityScore as number).toBeGreaterThanOrEqual(0.5);
  });

  it('refuses to persist a gate-blocked result', async () => {
    const blocked = { ok: false, brief: getArtifactBrief(amsRfpRequest()), passTrace: [], blockedReason: 'quality gate blocked export: unsupported claims' } as OrchestrationResult;
    await expect(
      persistDeliverable(blocked, { clientId: 'c1', renderedBy: 'u1', sourceArtifactRef: 'x', tenantPolicy }),
    ).rejects.toThrow(/cannot persist|quality gate/);
  });
});
