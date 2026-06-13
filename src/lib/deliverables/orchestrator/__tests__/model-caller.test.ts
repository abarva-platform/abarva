// PR-3 proof: the orchestrator's ModelCaller is backed by audited OpenAI egress.
// We mock the egress so no live key is needed and assert the wiring: every pass goes
// through preflightOpenAIDirectClient with a pass-specific workflow tag, the pass
// token budget is passed to the Responses call, instructions+input are sent, and
// text is extracted.

const auditedCalls: Array<Record<string, unknown>> = [];
const createCalls: Array<Record<string, unknown>> = [];

jest.mock('@/lib/integrations/ai-egress', () => ({
  preflightOpenAIDirectClient: jest.fn(async (args: Record<string, unknown>) => {
    auditedCalls.push(args);
    const pass = String((args.workflow as string).split(':').pop());
    const text = pass === 'architect'
      ? JSON.stringify(goodPlan())
      : pass === 'render_package'
        ? JSON.stringify(goodDocument())
        : 'word '.repeat(300);
    return {
      ok: true,
      auditId: 'audit-1',
      dataClass: 'confidential',
      client: {
        responses: {
          create: jest.fn(async (req: Record<string, unknown>) => {
            createCalls.push(req);
            return { id: `r-${pass}`, output_text: text };
          }),
        },
      },
    };
  }),
}));

import { createAuditedModelCaller, generateDeliverable } from '../model-caller';
import { buildPassPrompt } from '../prompt-builder';
import { getArtifactBrief } from '../artifact-brief-registry';
import { GENERATION_PASSES } from '../prompt-builder';
import { amsRfpRequest, goodPlan, goodDocument } from '../__fixtures__/ams-rfp';

beforeEach(() => {
  auditedCalls.length = 0;
  createCalls.length = 0;
});

describe('createAuditedModelCaller', () => {
  it('routes a single pass through audited egress with a pass-specific workflow + token budget', async () => {
    const req = amsRfpRequest();
    const brief = getArtifactBrief(req);
    const caller = createAuditedModelCaller({ tenantId: 'skyharbor-air', userId: 'u1' });
    const prompt = buildPassPrompt('full_draft', { req, brief, evidence: req.governedEvidenceBundle, approvedPlanJson: '{}' });
    const res = await caller(prompt, req);

    expect(res.text.length).toBeGreaterThan(0);
    expect(res.responseId).toBe('r-full_draft');
    expect(auditedCalls[0].workflow).toBe('deliverable:source:rfp_package:full_draft');
    expect(auditedCalls[0].model).toBe('gpt-5.5');
    expect(auditedCalls[0].tenantId).toBe('skyharbor-air');
    // token budget + system instructions are passed to the model call
    expect(createCalls[0].max_output_tokens).toBe(prompt.maxTokens);
    expect(typeof createCalls[0].instructions).toBe('string');
    expect(typeof createCalls[0].input).toBe('string');
  });
});

describe('generateDeliverable — full live-shaped loop (mocked egress)', () => {
  it('runs all six passes through audited egress and passes the gates', async () => {
    const req = amsRfpRequest();
    const result = await generateDeliverable(req, { tenantId: 'skyharbor-air', userId: 'u1' });

    expect(result.passTrace.map((t) => t.pass)).toEqual(GENERATION_PASSES);
    // one audited egress call per pass, each tagged distinctly
    expect(auditedCalls).toHaveLength(6);
    expect(auditedCalls.map((c) => (c.workflow as string).split(':').pop())).toEqual(GENERATION_PASSES);
    expect(result.ok).toBe(true);
    expect(result.document?.title).toMatch(/SkyHarbor/);
    expect(result.quality?.pass).toBe(true);
  });
});
