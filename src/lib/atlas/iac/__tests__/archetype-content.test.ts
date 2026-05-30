/**
 * Content-quality floor for the two reference archetypes shipped in this
 * foundation slice. Sibling Wave 2 archetypes are not required to meet
 * these minima — those each ship their own content tests under their slice.
 *
 * Minima for the reference entries:
 *  - 4 adoption metrics
 *  - 3 deployment patterns
 *  - 3 pitfalls
 *  - 3 emerging patterns ("whatNext")
 *  - 4 evidence anchors
 */

import { aiLedProductDevelopmentArchetype } from '../archetypes/ai-led-product-development';
import { claudeCodeArchetype } from '../archetypes/claude-code';
import { cursorArchetype } from '../archetypes/cursor';
import { githubCopilotArchetype } from '../archetypes/github-copilot';
import type { InitiativeArchetype } from '../types';

const REFERENCE_ARCHETYPES: ReadonlyArray<readonly [string, InitiativeArchetype]> = [
  ['github_copilot', githubCopilotArchetype],
  ['claude_code', claudeCodeArchetype],
];

describe('IAC reference archetypes — content floor', () => {
  it.each(REFERENCE_ARCHETYPES)('%s: archetypeKey matches', (key, archetype) => {
    expect(archetype.archetypeKey).toBe(key);
  });

  it.each(REFERENCE_ARCHETYPES)('%s: has a non-empty label and definition', (_key, archetype) => {
    expect(archetype.label.length).toBeGreaterThan(0);
    expect(archetype.definition.length).toBeGreaterThan(40);
  });

  it.each(REFERENCE_ARCHETYPES)('%s: at least 4 adoption metrics', (_key, archetype) => {
    expect(archetype.adoptionMetrics.length).toBeGreaterThanOrEqual(4);
  });

  it.each(REFERENCE_ARCHETYPES)('%s: at least 3 deployment patterns', (_key, archetype) => {
    expect(archetype.deploymentPatterns.length).toBeGreaterThanOrEqual(3);
  });

  it.each(REFERENCE_ARCHETYPES)('%s: at least 3 pitfalls', (_key, archetype) => {
    expect(archetype.commonPitfalls.length).toBeGreaterThanOrEqual(3);
  });

  it.each(REFERENCE_ARCHETYPES)('%s: at least 3 emerging patterns (whatNext)', (_key, archetype) => {
    expect(archetype.whatNext.length).toBeGreaterThanOrEqual(3);
  });

  it.each(REFERENCE_ARCHETYPES)('%s: at least 4 evidence anchors', (_key, archetype) => {
    expect(archetype.evidenceAnchors.length).toBeGreaterThanOrEqual(4);
  });

  it.each(REFERENCE_ARCHETYPES)('%s: category is ai-coding for both reference entries', (_key, archetype) => {
    expect(archetype.category).toBe('ai-coding');
  });
});

/**
 * Content floor for the Cursor archetype — a named-product entry, so it meets
 * the same minima as the GitHub Copilot / Claude Code reference entries.
 */
describe('IAC archetype — Cursor content floor', () => {
  it('archetypeKey is "cursor"', () => {
    expect(cursorArchetype.archetypeKey).toBe('cursor');
  });

  it('label and definition are non-empty', () => {
    expect(cursorArchetype.label.length).toBeGreaterThan(0);
    expect(cursorArchetype.definition.length).toBeGreaterThan(40);
  });

  it('category is ai-coding', () => {
    expect(cursorArchetype.category).toBe('ai-coding');
  });

  it('at least 4 adoption metrics', () => {
    expect(cursorArchetype.adoptionMetrics.length).toBeGreaterThanOrEqual(4);
  });

  it('at least 3 deployment patterns', () => {
    expect(cursorArchetype.deploymentPatterns.length).toBeGreaterThanOrEqual(3);
  });

  it('at least 3 pitfalls', () => {
    expect(cursorArchetype.commonPitfalls.length).toBeGreaterThanOrEqual(3);
  });

  it('at least 3 emerging patterns (whatNext)', () => {
    expect(cursorArchetype.whatNext.length).toBeGreaterThanOrEqual(3);
  });

  it('at least 4 evidence anchors', () => {
    expect(cursorArchetype.evidenceAnchors.length).toBeGreaterThanOrEqual(4);
  });
});

/**
 * Content floor for the AI-led product development archetype.
 *
 * This archetype is harder to source rigorously than named-product
 * archetypes (no single vendor publishes a usage figure for "vibe coding").
 * Per the slice brief, the floor here is intentionally lower than the
 * named-product floor: 2 deployment patterns, 2 pitfalls, 2 whatNext,
 * 3 evidence anchors. Quality > quantity — every numeric figure still
 * cites a primary, dated source.
 */
describe('IAC archetype — AI-led product development content floor', () => {
  it('archetypeKey is "ai_led_product_development"', () => {
    expect(aiLedProductDevelopmentArchetype.archetypeKey).toBe('ai_led_product_development');
  });

  it('label and definition are non-empty', () => {
    expect(aiLedProductDevelopmentArchetype.label.length).toBeGreaterThan(0);
    expect(aiLedProductDevelopmentArchetype.definition.length).toBeGreaterThan(40);
  });

  it('category is ai-product-dev', () => {
    expect(aiLedProductDevelopmentArchetype.category).toBe('ai-product-dev');
  });

  it('at least 1 adoption metric (lower floor — vendor-neutral pattern)', () => {
    expect(aiLedProductDevelopmentArchetype.adoptionMetrics.length).toBeGreaterThanOrEqual(1);
  });

  it('at least 2 deployment patterns', () => {
    expect(aiLedProductDevelopmentArchetype.deploymentPatterns.length).toBeGreaterThanOrEqual(2);
  });

  it('at least 2 pitfalls', () => {
    expect(aiLedProductDevelopmentArchetype.commonPitfalls.length).toBeGreaterThanOrEqual(2);
  });

  it('at least 2 emerging patterns (whatNext)', () => {
    expect(aiLedProductDevelopmentArchetype.whatNext.length).toBeGreaterThanOrEqual(2);
  });

  it('at least 3 evidence anchors', () => {
    expect(aiLedProductDevelopmentArchetype.evidenceAnchors.length).toBeGreaterThanOrEqual(3);
  });
});
