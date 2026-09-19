/**
 * An agent answer is scrubbed of visible identifiers twice, by two different
 * passes, and the two must say the same thing.
 *
 * `shapeStreamingAgentTextForSurface` shapes the tokens a reader watches
 * arrive. `shapeAgentResponseForSurface` shapes the settled answer that
 * replaces them. Both run `repairAgentOutputContractText`; only the settled one
 * runs `shapeSharedAdvisorResponse` first, and the shaper scrubs identifiers
 * too. So every identifier class is rewritten by the shaper on the settled path
 * and by the contract repair on the streaming path, and if the two carry
 * different replacement wording the sentence a reader watched arrive is not the
 * sentence they are left with.
 *
 * That was true of exactly one class. Measured on `ce99d7312` before the fix,
 * same input to both:
 *
 *   settled  : "…is overdue on record the referenced item."
 *   streaming: "…is overdue on record the referenced record."
 *
 * Every other class already agreed. The cases below assert the agreement
 * itself rather than either literal, so a future rename of the placeholder is
 * not a failure while a future divergence is — and so the same guard covers
 * identifier classes nobody has added yet.
 *
 * Backlog item 43, the half left untriaged when its sibling case was updated.
 */
import {
  shapeAgentResponseForSurface,
  shapeStreamingAgentTextForSurface,
} from '@/lib/agent/response-shape';

const SURFACE = '/tower';
const UUID = '39901c16-2e8b-4c8c-80aa-8a0182f26754';
const ENTITY_ID = 'V-ACME-001';

function bothPasses(raw: string): { settled: string; streaming: string } {
  return {
    settled: shapeAgentResponseForSurface(SURFACE, raw),
    streaming: shapeStreamingAgentTextForSurface(SURFACE, raw),
  };
}

describe('visible-identifier placeholders agree across the streaming and settled passes', () => {
  it('rewrites a bare UUID to the same wording on both passes', () => {
    const { settled, streaming } = bothPasses(
      `Demand Forecasting attestation is overdue on record ${UUID}.`,
    );

    expect(settled).toBe(streaming);
  });

  it('rewrites a signal-prefixed UUID to the same wording on both passes', () => {
    const { settled, streaming } = bothPasses(
      `Demand Forecasting attestation is overdue — warning, signal: ${UUID}.`,
    );

    expect(settled).toBe(streaming);
  });

  it('does not flash a parenthesized placeholder before the settled answer removes it', () => {
    const { settled, streaming } = bothPasses(
      `Review the renewal record (${UUID}) before the gate meeting.`,
    );

    expect(streaming).toBe(settled);
  });

  it('does not flash an em-dash placeholder before the settled answer removes it', () => {
    const { settled, streaming } = bothPasses(
      `Review the renewal record — ${UUID} before the gate meeting.`,
    );

    expect(streaming).toBe(settled);
  });

  it('rewrites a raw entity id to the same wording on both passes', () => {
    const { settled, streaming } = bothPasses(
      `Review ${ENTITY_ID} before the gate review.`,
    );

    expect(settled).toBe(streaming);
  });

  // The guardrails. Agreement alone is satisfied by removing both scrubs, which
  // would agree on leaking the identifier, and by replacing both with an empty
  // string, which would agree on an unreadable sentence. These three say what
  // the passes have to agree *on*.
  it('leaks the identifier on neither pass', () => {
    const { settled, streaming } = bothPasses(
      `Demand Forecasting attestation is overdue on record ${UUID}.`,
    );

    expect(settled).not.toContain(UUID);
    expect(streaming).not.toContain(UUID);
  });

  it('leaves a readable sentence in place of the identifier on both passes', () => {
    const { settled, streaming } = bothPasses(
      `Demand Forecasting attestation is overdue on record ${UUID}.`,
    );

    for (const text of [settled, streaming]) {
      expect(text).toContain('Demand Forecasting attestation is overdue');
      expect(text).toMatch(/\breferenced\b/);
    }
  });

  it('carries identifier-free prose through both passes unchanged', () => {
    const prose = 'Demand Forecasting attestation is overdue on the flagged record.';
    const { settled, streaming } = bothPasses(prose);

    expect(settled).toBe(prose);
    expect(streaming).toBe(prose);
  });
});
