import {
  buildAgentContextContractBlock,
  classifyAgentContextMix,
} from '../module-context-contract';

describe('agent module context contract', () => {
  it('classifies tenant facts, industry patterns, AI-insertion patterns, and Source signals', () => {
    const mix = classifyAgentContextMix([
      {
        type: 'TENANT',
        name: 'SkyHarbor IBM engagement',
        detail: '$280M/yr modernization scope and FY2027 restructure window',
      },
      {
        type: 'PATTERN',
        name: 'Revenue Management AI Dynamic Pricing Guardrail',
        detail: 'DOT 399.88 review; model drift telemetry and human override gate required',
      },
      {
        type: 'vendor',
        name: 'AMS RFP',
        detail: 'BAFO counter, productivity guarantee, exit rights, and SLA evidence',
      },
    ]);

    expect(mix).toEqual({
      totalSources: 3,
      tenantFactCount: 1,
      industryPatternCount: 1,
      aiInsertionPatternCount: 1,
      sourceDiligenceSignalCount: 2,
    });
  });

  it('makes aVa Intelligence answer from tenant facts plus corpus patterns', () => {
    const block = buildAgentContextContractBlock({
      agent: 'ava',
      module: 'intelligence',
      sources: [
        { type: 'TENANT', name: 'Apex CDP Phase 2', detail: 'over-scoped customer data platform initiative' },
        { type: 'PATTERN', name: 'CDP AI Identity Resolution Drift', detail: 'AI matching drift and consent governance' },
      ],
    });

    expect(block).toContain('AVA / INTELLIGENCE');
    expect(block).not.toContain('SENTINEL / INTELLIGENCE');
    expect(block).toContain('tenant facts=1');
    expect(block).toContain('industry/corpus patterns=1');
    expect(block).toContain('what is true, what matters');
    expect(block).toContain('specific AI capability category');
  });

  it('makes Moves output concrete approval gates and deliverables', () => {
    const block = buildAgentContextContractBlock({
      agent: 'nexus',
      module: 'moves',
      sources: [{ type: 'pattern', name: 'AI SDLC Adoption Telemetry Gap', detail: 'Move approval gate pattern' }],
    });

    expect(block).toContain('MOVES / MOVES');
    expect(block).toContain('fundable or killable Move');
    expect(block).toContain('unsafe-to-fund conditions');
    expect(block).toContain('approval gates');
  });

  it('makes aVa Source output procurement leverage rather than generic advice', () => {
    const block = buildAgentContextContractBlock({
      agent: 'sentinel',
      module: 'source',
      sources: [{ type: 'vendor', name: 'Ambient AI RFP', detail: 'BAA subprocessor and adoption telemetry' }],
    });

    expect(block).toContain('AVA / SOURCE');
    expect(block).toContain('RFI/RFP questions');
    expect(block).toContain('BAFO counters');
    expect(block).toContain('model-risk controls');
  });
});
