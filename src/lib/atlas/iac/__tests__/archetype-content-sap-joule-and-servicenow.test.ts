/**
 * Content-quality floor for the SAP Joule and ServiceNow Now Assist
 * archetypes. Wave 2 sibling slices each ship their own content test file
 * scoped to their own archetypes; this keeps the merge surface trivial.
 *
 * Minima for these two entries (per master prompt):
 *  - ≥2 deployment patterns
 *  - ≥2 pitfalls
 *  - ≥2 emerging patterns ("whatNext")
 *  - ≥3 evidence anchors
 *
 * In practice both archetypes exceed these minima; the test locks the floor.
 */

import { sapJouleArchetype } from '../archetypes/sap-joule';
import { servicenowNowAssistArchetype } from '../archetypes/servicenow-now-assist';
import type { InitiativeArchetype } from '../types';

const WAVE_TWO_ARCHETYPES: ReadonlyArray<readonly [string, InitiativeArchetype]> = [
  ['sap_joule', sapJouleArchetype],
  ['servicenow_now_assist', servicenowNowAssistArchetype],
];

describe('IAC Wave 2 — SAP Joule + ServiceNow Now Assist content floor', () => {
  it.each(WAVE_TWO_ARCHETYPES)('%s: archetypeKey matches', (key, archetype) => {
    expect(archetype.archetypeKey).toBe(key);
  });

  it.each(WAVE_TWO_ARCHETYPES)('%s: has a non-empty label and definition', (_key, archetype) => {
    expect(archetype.label.length).toBeGreaterThan(0);
    expect(archetype.definition.length).toBeGreaterThan(40);
  });

  it.each(WAVE_TWO_ARCHETYPES)('%s: at least 1 adoption metric', (_key, archetype) => {
    expect(archetype.adoptionMetrics.length).toBeGreaterThanOrEqual(1);
  });

  it.each(WAVE_TWO_ARCHETYPES)('%s: at least 2 deployment patterns', (_key, archetype) => {
    expect(archetype.deploymentPatterns.length).toBeGreaterThanOrEqual(2);
  });

  it.each(WAVE_TWO_ARCHETYPES)('%s: at least 2 pitfalls', (_key, archetype) => {
    expect(archetype.commonPitfalls.length).toBeGreaterThanOrEqual(2);
  });

  it.each(WAVE_TWO_ARCHETYPES)('%s: at least 2 emerging patterns (whatNext)', (_key, archetype) => {
    expect(archetype.whatNext.length).toBeGreaterThanOrEqual(2);
  });

  it.each(WAVE_TWO_ARCHETYPES)('%s: at least 3 evidence anchors', (_key, archetype) => {
    expect(archetype.evidenceAnchors.length).toBeGreaterThanOrEqual(3);
  });

  it('sap_joule: category is ai-erp', () => {
    expect(sapJouleArchetype.category).toBe('ai-erp');
  });

  it('servicenow_now_assist: category is ai-itsm', () => {
    expect(servicenowNowAssistArchetype.category).toBe('ai-itsm');
  });
});
