// PR-3 proof: the orchestrator's ModelCaller is backed by audited Anthropic egress.
// We mock the egress so no live key is needed and assert the wiring: every pass goes
// through preflightAnthropicDirectClient with a pass-specific workflow tag, the pass
// token budget is passed to the Messages call, system+user messages are sent, and
// text is extracted.

const auditedCalls: Array<Record<string, unknown>> = [];
const createCalls: Array<Record<string, unknown>> = [];

jest.mock('@/lib/integrations/ai-egress', () => ({
  preflightAnthropicDirectClient: jest.fn(async (args: Record<string, unknown>) => {
    auditedCalls.push(args);
    const pass = String((args.workflow as string).split(':').pop());
    const text = pass === 'architect'
      ? JSON.stringify(goodPlan())
      : pass === 'section_draft'
        ? JSON.stringify({ key: 'sec', title: 'Section', bodyMarkdown: '## Detail\nWe recommend proceeding. Baseline supported by governed evidence [1]. ' + 'This section is complete and grounded. '.repeat(40), groundingMode: 'mixed', citationsUsed: [1] })
        : pass === 'synthesis'
          ? JSON.stringify({ title: 'SkyHarbor Air — AMS RFP', recommendation: 'We recommend issuing the RFP to the shortlisted vendors given the validated scope and the costed range.', nextActions: ['Issue RFP', 'Brief vendors', 'Open evaluation'], tables: [{ key: 'risk_register', title: 'Risk / Issues / Dependencies', columns: ['Risk', 'Owner'], rows: [['Transition risk', 'PMO']] }], clientCompleteChecklist: [] })
          : 'word '.repeat(300);
    return {
      ok: true,
      auditId: 'audit-1',
      dataClass: 'confidential',
      client: {
        messages: {
          // Mirrors the streaming call site (messages.stream(...).finalMessage()).
          stream: jest.fn((req: Record<string, unknown>) => {
            createCalls.push(req);
            return {
              finalMessage: async () => ({
                id: `msg-${pass}`,
                content: [{ type: 'text', text }],
              }),
            };
          }),
        },
      },
    };
  }),
}));

import { createAuditedModelCaller, generateDeliverable } from '../model-caller';
import { buildPassPrompt } from '../prompt-builder';
import { getArtifactBrief } from '../artifact-brief-registry';
import { amsRfpRequest, goodPlan } from '../__fixtures__/ams-rfp';

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
    expect(res.responseId).toBe('msg-full_draft');
    expect(auditedCalls[0].workflow).toBe('deliverable:source:rfp_package:full_draft');
    expect(auditedCalls[0].model).toBe('claude-opus-4-8');
    expect(auditedCalls[0].tenantId).toBe('skyharbor-air');
    // token budget + system instructions are passed to the model call
    expect(createCalls[0].max_tokens).toBe(prompt.maxTokens);
    expect(typeof createCalls[0].system).toBe('string');
    const message = (createCalls[0].messages as Array<{ content: unknown }>)[0];
    expect(Array.isArray(message.content)).toBe(true);
    const blocks = message.content as Array<Record<string, unknown>>;
    expect(blocks[0]).toMatchObject({
      type: 'text',
      text: prompt.cacheableContext,
      cache_control: { type: 'ephemeral' },
    });
    expect(blocks.map((block) => String(block.text ?? '')).join('')).toBe(prompt.user);
  });
});

describe('generateDeliverable — full live-shaped loop (mocked egress)', () => {
  it('runs architect + per-section + synthesis through audited egress and passes the gates', async () => {
    const req = amsRfpRequest();
    const result = await generateDeliverable(req, { tenantId: 'skyharbor-air', userId: 'u1' });

    const passes = result.passTrace.map((t) => t.pass);
    const sectionCount = goodPlan().sectionPlan.length;
    expect(passes[0]).toBe('architect');
    expect(passes[passes.length - 1]).toBe('synthesis');
    expect(passes.filter((p) => p === 'section_draft')).toHaveLength(sectionCount);
    // one audited egress call per pass: architect + N sections + synthesis
    expect(auditedCalls).toHaveLength(2 + sectionCount);
    expect(auditedCalls.map((c) => (c.workflow as string).split(':').pop())).toEqual(passes);
    expect(result.ok).toBe(true);
    expect(result.document?.title).toMatch(/SkyHarbor/);
    expect(result.quality?.pass).toBe(true);
  });
});

describe('stream-termination retry (regression 2026-07-08)', () => {
  it('retries and succeeds when the stream throws a transient "terminated" error', async () => {
    const req = amsRfpRequest();
    const brief = getArtifactBrief(req);
    const caller = createAuditedModelCaller({ tenantId: 'lakeshore', userId: 'u1' });
    const prompt = buildPassPrompt('full_draft', { req, brief, evidence: req.governedEvidenceBundle, approvedPlanJson: '{}' });

    const { preflightAnthropicDirectClient } = jest.requireMock('@/lib/integrations/ai-egress') as {
      preflightAnthropicDirectClient: jest.Mock;
    };
    let attempt = 0;
    preflightAnthropicDirectClient.mockImplementationOnce(async () => ({
      ok: true,
      auditId: 'audit-retry',
      dataClass: 'confidential',
      client: {
        messages: {
          stream: jest.fn(() => ({
            finalMessage: async () => {
              attempt += 1;
              if (attempt < 2) throw new TypeError('terminated');
              return { id: 'msg-retry-ok', content: [{ type: 'text', text: 'recovered output' }] };
            },
          })),
        },
      },
    }));

    const res = await caller(prompt, req);
    expect(attempt).toBe(2);
    expect(res.text).toBe('recovered output');
  }, 10_000);

  it('does not retry and rethrows a non-network error immediately', async () => {
    const req = amsRfpRequest();
    const brief = getArtifactBrief(req);
    const caller = createAuditedModelCaller({ tenantId: 'lakeshore', userId: 'u1' });
    const prompt = buildPassPrompt('full_draft', { req, brief, evidence: req.governedEvidenceBundle, approvedPlanJson: '{}' });

    const { preflightAnthropicDirectClient } = jest.requireMock('@/lib/integrations/ai-egress') as {
      preflightAnthropicDirectClient: jest.Mock;
    };
    let attempts = 0;
    preflightAnthropicDirectClient.mockImplementationOnce(async () => ({
      ok: true,
      auditId: 'audit-no-retry',
      dataClass: 'confidential',
      client: {
        messages: {
          stream: jest.fn(() => ({
            finalMessage: async () => {
              attempts += 1;
              throw new Error('content policy violation');
            },
          })),
        },
      },
    }));

    await expect(caller(prompt, req)).rejects.toThrow('content policy violation');
    expect(attempts).toBe(1);
  });
});

describe('architect prompt — plan validity rules (regression 2026-06-17)', () => {
  it('states the exact valid citation numbers and the grounding rule so the plan gate passes reliably', () => {
    const req = amsRfpRequest();
    const brief = getArtifactBrief(req);
    const prompt = buildPassPrompt('architect', { req, brief, evidence: req.governedEvidenceBundle });
    // The fixture bundle is citations [1]..[5].
    expect(prompt.user).toContain('PLAN VALIDITY RULES');
    expect(prompt.user).toContain('[1], [2], [3], [4], [5]');
    expect(prompt.user).toMatch(/NEVER invent or cite any number outside this set/i);
    expect(prompt.user).toMatch(/governed_facts.*mixed.*at least one of: evidenceCitations/i);
    expect(prompt.user).toMatch(/expert_template/);
  });

  it('tells the architect not to cite anything when there is no governed evidence', () => {
    const req = amsRfpRequest();
    const brief = getArtifactBrief(req);
    const prompt = buildPassPrompt('architect', { req, brief, evidence: [] });
    expect(prompt.user).toMatch(/there is NO governed evidence; do not cite any/i);
  });
});
