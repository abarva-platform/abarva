// PR-5 proof: a completed deliverable persists through the artifacts repository
// contract (mapping is correct), and a gate-blocked result is refused.
jest.mock('@/lib/deliverables/deck-from-result', () => ({
  buildDeckHtmlFromDocument: jest.fn(() => '<html><body>Executive deck</body></html>'),
}));

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
      { pass: 'architect', maxTokens: 6000, highStakes: true, outputChars: 100, responseId: 'msg_arch' },
      { pass: 'synthesis', maxTokens: 16000, highStakes: true, outputChars: 100, responseId: '11111111-2222-3333-4444-555555555555' },
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
    // generation_egress_audit is a UUID FK — link the first pass whose responseId is a
    // genuine audit UUID (Anthropic msg_ ids are skipped); null when none qualify.
    expect(rendered.generationEgressAudit).toBe('11111111-2222-3333-4444-555555555555');
    expect(rendered.qualityScore as number).toBeLessThan(1); // one warning → small penalty
    expect(rendered.qualityScore as number).toBeGreaterThanOrEqual(0.5);
  });

  it('persists the structured renderable doc in metadata for on-demand re-render', async () => {
    let extraMeta: unknown;
    const mockSave = (async (
      _input: unknown,
      _rendered: unknown,
      extra: unknown,
    ) => {
      extraMeta = extra;
      return { id: 'art-meta', clientId: 'c1', metadata: {} } as unknown as GeneratedArtifactRecord;
    }) as never;

    await persistDeliverable(
      okResult(),
      { clientId: 'c1', renderedBy: 'u1', sourceArtifactRef: 'evt', tenantPolicy },
      { save: mockSave },
    );

    const meta = extraMeta as Record<string, unknown>;
    expect(meta).toBeDefined();
    expect(meta.renderableDoc).toBeDefined();
    expect((meta.renderableDoc as Record<string, unknown>).title).toBe(goodDocument().title);
  });

  it('prescribes docx for a narrative deliverable (rfp_package)', async () => {
    let rendered: Record<string, unknown> | undefined;
    const mockSave = (async (_input: unknown, r: unknown) => {
      rendered = r as Record<string, unknown>;
      return { id: 'a', clientId: 'c1', metadata: {} } as unknown as GeneratedArtifactRecord;
    }) as never;
    await persistDeliverable(
      okResult(),
      { clientId: 'c1', renderedBy: 'u1', sourceArtifactRef: 'evt', tenantPolicy },
      { save: mockSave },
    );
    expect(rendered?.outputFormat).toBe('docx');
  });

  it('prescribes xlsx for the financial model (estimate_model)', async () => {
    let rendered: Record<string, unknown> | undefined;
    const mockSave = (async (_input: unknown, r: unknown) => {
      rendered = r as Record<string, unknown>;
      return { id: 'a', clientId: 'c1', metadata: {} } as unknown as GeneratedArtifactRecord;
    }) as never;

    // moves financial model → orchestrator deliverableType 'estimate_model'
    const req = amsRfpRequest({ module: 'moves', deliverableType: 'estimate_model' });
    const result = {
      ok: true,
      brief: getArtifactBrief(req),
      document: goodDocument(),
      quality: { pass: true, blockers: [], warnings: [], metrics: {} as never },
      passTrace: [],
    } as OrchestrationResult;

    await persistDeliverable(
      result,
      { clientId: 'c1', renderedBy: 'u1', sourceArtifactRef: 'evt', tenantPolicy },
      { save: mockSave },
    );
    expect(rendered?.outputFormat).toBe('xlsx');
  });

  it('honors an explicit outputFormat override', async () => {
    let rendered: Record<string, unknown> | undefined;
    const mockSave = (async (_input: unknown, r: unknown) => {
      rendered = r as Record<string, unknown>;
      return { id: 'a', clientId: 'c1', metadata: {} } as unknown as GeneratedArtifactRecord;
    }) as never;
    await persistDeliverable(
      okResult(),
      { clientId: 'c1', renderedBy: 'u1', sourceArtifactRef: 'evt', tenantPolicy, outputFormat: 'html' },
      { save: mockSave },
    );
    expect(rendered?.outputFormat).toBe('html');
  });

  it('does not block on format_fit when a decision-storytelling deck deliberately renders as html (regression 2026-07-08)', async () => {
    // business_case's profile only allows docx/pptx/xlsx. When moves_decision_
    // storytelling forces the exhibit-led deck (html) for a Moves deliverable,
    // that html IS the deliverable by design — format_fit must not fire against
    // the original docx contract, or every docx/xlsx-profiled Moves deliverable
    // is guaranteed to quarantine the moment the flag is on for a tenant.
    let rendered: Record<string, unknown> | undefined;
    const mockSave = (async (_input: unknown, r: unknown) => {
      rendered = r as Record<string, unknown>;
      return { id: 'a', clientId: 'c1', metadata: {} } as unknown as GeneratedArtifactRecord;
    }) as never;

    const req = amsRfpRequest({ module: 'moves', deliverableType: 'business_case' });
    const result = {
      ok: true,
      brief: getArtifactBrief(req),
      document: goodDocument(),
      quality: { pass: true, blockers: [], warnings: [], metrics: {} as never },
      passTrace: [],
    } as OrchestrationResult;

    await persistDeliverable(
      result,
      {
        clientId: 'c1',
        renderedBy: 'u1',
        sourceArtifactRef: 'evt-lakeshore-legal',
        tenantPolicy,
        renderAsDeck: true,
        tenantKey: 'lakeshore',
      },
      { save: mockSave },
    );

    expect(rendered?.outputFormat).toBe('html');
    const reason = String(rendered?.quarantineReason ?? '');
    expect(reason).not.toMatch(/format_fit/);
  });

  it('refuses to persist a gate-blocked result', async () => {
    const blocked = { ok: false, brief: getArtifactBrief(amsRfpRequest()), passTrace: [], blockedReason: 'quality gate blocked export: unsupported claims' } as OrchestrationResult;
    await expect(
      persistDeliverable(blocked, { clientId: 'c1', renderedBy: 'u1', sourceArtifactRef: 'x', tenantPolicy }),
    ).rejects.toThrow(/cannot persist|quality gate/);
  });
});
