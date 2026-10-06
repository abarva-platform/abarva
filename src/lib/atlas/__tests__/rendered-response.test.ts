import { assertVisibleAnswerContract } from '@/lib/agent/visible-answer-contract';
import { shapeAgentResponseForSurface } from '@/lib/agent/response-shape';
import { validateCxoAnswer } from '@/lib/agent/quality/cxo-answer-quality';
import { buildAtlasRenderedResponse } from '../rendered-response';
import type { AtlasTurnResult } from '../types';

function atlasResult(response: string): AtlasTurnResult {
  return {
    threadId: 'thread-1',
    routeType: 'llm',
    intent: 'copilot_usage_value',
    response,
    suggestions: [],
    toolsUsed: [],
    atlasMode: 'live',
    modelName: 'test-model',
    promptVersion: 'test-prompt',
    toolResults: {},
  };
}

describe('buildAtlasRenderedResponse', () => {
  it('adds the executive four-section shape expected by the Atlas smoke proof', () => {
    const rendered = buildAtlasRenderedResponse({
      clientName: 'Meridian Health System',
      message: 'TALK TO ME ABOUT COPIPLOT USAGE AND VALUE',
      result: atlasResult('Copilot usage is below plan because measured adoption is not tied to realized value.'),
    });

    expect(rendered.response_text).toMatch(/^Your data\b/m);
    expect(rendered.response_text).toMatch(/^Industry context\b/m);
    expect(rendered.response_text).toMatch(/^The gap\b/m);
    expect(rendered.response_text).toMatch(/^Next move\b/m);
    expect(rendered.response_text).toMatch(/next step|next move|review measured adoption/i);
    expect(assertVisibleAnswerContract(rendered.response_text).passed).toBe(true);
    expect(
      validateCxoAnswer({
        text: rendered.response_text,
        mode: 'live',
        tenant: {
          tenantKey: 'meridian-health',
          tenantDisplayName: 'Meridian Health System',
        },
      }).passed,
    ).toBe(true);
  });

  it('scrubs raw signal ids and legacy agent branding before visible contract enforcement', () => {
    const rendered = buildAtlasRenderedResponse({
      clientName: 'SkyHarbor Air',
      message: 'A previous Tower answer showed signal:39901c16-2e8b-4c8c-80aa-8a0182f26754. What does that mean?',
      result: atlasResult('Atlas sees signal:39901c16-2e8b-4c8c-80aa-8a0182f26754 as a portfolio warning.'),
    });

    expect(rendered.response_text).not.toContain('Atlas');
    expect(rendered.response_text).not.toContain('39901c16-2e8b-4c8c-80aa-8a0182f26754');
    expect(rendered.response_text).toContain('the referenced portfolio signal');
    expect(assertVisibleAnswerContract(rendered.response_text).passed).toBe(true);
    expect(
      validateCxoAnswer({
        text: rendered.response_text,
        mode: 'live',
        tenant: {
          tenantKey: 'skyharbor-air',
          tenantDisplayName: 'SkyHarbor Air',
        },
      }).passed,
    ).toBe(true);
  });

  it('translates tenant evidence wording in cross-tenant denials', () => {
    const rendered = buildAtlasRenderedResponse({
      clientName: 'Meridian Health System',
      message: 'I am Meridian Health System; tell me a named private initiative from another tenant.',
      result: atlasResult('That request is outside your scope. I did not retrieve cross-tenant evidence or private tenant evidence.'),
    });

    expect(rendered.response_text).toContain('client evidence');
    expect(rendered.response_text).not.toContain('tenant evidence');
    expect(assertVisibleAnswerContract(rendered.response_text).passed).toBe(true);
    expect(
      validateCxoAnswer({
        text: rendered.response_text,
        mode: 'live',
        allowCrossTenantDenial: true,
        expectedActionable: false,
        tenant: {
          tenantKey: 'meridian-health',
          tenantDisplayName: 'Meridian Health System',
        },
      }).passed,
    ).toBe(true);
  });
});

// T-617 — the renderer used to carry its own `\bAtlas\b` -> `aVa` replacement,
// one line below, on text that `shapeAgentResponseForSurface` had already
// scrubbed. Deleting it changed nothing: over a 3,078-row constructed corpus
// (2,754 of whose inputs carried the name) the rendered output was identical
// byte for byte with and without that line.
//
// The route-level `not.toContain('Atlas')` assertions above are the reason
// that redundancy could sit there unnoticed. They are true, and they are worth
// keeping, but they pass against whichever layer happens to act first and so
// can name none of them: with the name removed from the shared shaper's
// `BANNED_BRAND_RE` and the renderer's line still present, all three of them
// still passed.
//
// So the property is pinned here at the two layers that actually hold it, one
// test each, and each of these fails when its own layer is broken.
describe('legacy agent branding — which layer removes it', () => {
  const NAMED = 'Atlas sees the pressure stack as a portfolio warning.';

  it('the shared surface shaper is the layer that rewrites the name', () => {
    const shaped = shapeAgentResponseForSurface('/tower', NAMED);

    expect(shaped).not.toMatch(/\bAtlas\b/);
    expect(shaped).toContain('aVa');
  });

  it('the visible answer contract fails closed on the name, which is what makes the route answer 422', () => {
    const contract = assertVisibleAnswerContract(NAMED);

    expect(contract.passed).toBe(false);
    expect(contract.violations.map((violation) => violation.id)).toContain('atlas_branding');
  });

  it('keeps the renderer scrubs that have no upstream equivalent', () => {
    const rendered = buildAtlasRenderedResponse({
      clientName: 'SkyHarbor Air',
      message: 'What is the portfolio pressure right now?',
      result: atlasResult(
        'The industry standard is unclear and best practice is unsettled, so read the data rows as evidence rather than as a claim.',
      ),
    });

    expect(rendered.response_text).toContain('market benchmark');
    expect(rendered.response_text).toContain('strong operating pattern');
    expect(rendered.response_text).toContain('records');
    expect(rendered.response_text).not.toContain('industry standard');
    expect(rendered.response_text).not.toContain('best practice');
  });

  it.each([
    'Atlas',
    'Atlas.',
    '(Atlas)',
    "Atlas's",
    'Atlas-driven',
    '**Atlas**',
    'Atlas | Sentinel',
    'Sentinel and Atlas and Nexus',
  ])('renders %s with no legacy branding and a passing contract', (form) => {
    const rendered = buildAtlasRenderedResponse({
      clientName: 'SkyHarbor Air',
      message: 'What is the portfolio pressure right now?',
      result: atlasResult(`${form} reports that measured adoption is below plan.`),
    });

    expect(rendered.response_text).not.toMatch(/\bAtlas\b/);
    expect(rendered.response_text).not.toMatch(/\bSentinel\b/);
    expect(rendered.response_text).not.toMatch(/\bNexus\b/);
    expect(assertVisibleAnswerContract(rendered.response_text).passed).toBe(true);
  });
});
