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

import { claudeCodeArchetype } from '../archetypes/claude-code';
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
