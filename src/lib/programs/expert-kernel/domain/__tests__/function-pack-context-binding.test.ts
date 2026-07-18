// function-pack-context-binding — unit tests.
//
// Proves the §5 binding contract is real: binding a pack for a phase artifact
// returns the inherited TOC and the expected operating-metric list, and turns
// an absent metric into a PRECISE, named seed gap (spec §7). Also proves the
// honest fallback when no pack exists — never a fabricated outline.

import { bindFunctionPackForArtifact } from '../function-pack-context-binding';
import { careDeliveryCareManagementPack } from '../healthcare/care-delivery-care-management';

describe('bindFunctionPackForArtifact — bound pack', () => {
  it('inherits the deliverable outline for the requested artifact', () => {
    const binding = bindFunctionPackForArtifact(
      'healthcare-provider',
      'care_delivery_care_management',
      'business_case',
      [],
    );

    expect(binding.bound).toBe(true);
    expect(binding.functionLabel).toBe('Care delivery & care management');
    expect(binding.phase).toBe('Design & Plan');
    expect(binding.artifactLabel).toBe('Care-Management Business Case');

    // The inherited TOC matches the pack's business-case outline exactly —
    // structure is inherited, not improvised.
    const expectedOutline = careDeliveryCareManagementPack.deliverableOutlines.find(
      (o) => o.artifact === 'business_case',
    );
    expect(expectedOutline).toBeDefined();
    expect(binding.deliverableOutline.map((s) => s.heading)).toEqual(
      expectedOutline!.sections.map((s) => s.heading),
    );
    expect(binding.deliverableOutline[0].guidance.length).toBeGreaterThan(0);
  });

  it('different artifacts inherit different outlines', () => {
    const discover = bindFunctionPackForArtifact(
      'healthcare-provider',
      'care_delivery_care_management',
      'discover_brief',
      [],
    );
    const mobilize = bindFunctionPackForArtifact(
      'healthcare-provider',
      'care_delivery_care_management',
      'mobilization_plan',
      [],
    );
    expect(discover.phase).toBe('Discover');
    expect(mobilize.phase).toBe('Mobilize');
    expect(discover.deliverableOutline).not.toEqual(
      mobilize.deliverableOutline,
    );
  });

  it('exposes every operating metric the function expects', () => {
    const binding = bindFunctionPackForArtifact(
      'healthcare-provider',
      'care_delivery_care_management',
      'discover_brief',
      [],
    );
    expect(binding.expectedMetrics).toHaveLength(
      careDeliveryCareManagementPack.operatingMetrics.length,
    );
    expect(binding.expectedMetrics.map((m) => m.key)).toEqual(
      careDeliveryCareManagementPack.operatingMetrics.map((m) => m.key),
    );
  });

  it('turns every absent metric into a precise, named seed gap (§7)', () => {
    // The tenant records nothing — every expected metric is a seed gap.
    const binding = bindFunctionPackForArtifact(
      'healthcare-provider',
      'care_delivery_care_management',
      'discover_brief',
      [],
    );
    expect(binding.seedGaps).toHaveLength(
      careDeliveryCareManagementPack.operatingMetrics.length,
    );

    const readmissionGap = binding.seedGaps.find(
      (g) => g.metricKey === 'readmission_rate_30d',
    );
    expect(readmissionGap).toBeDefined();
    // The gap is self-describing — name, definition, and source — not a vague
    // "we don't have this number".
    expect(readmissionGap!.metricName).toContain('readmission');
    expect(readmissionGap!.definition.length).toBeGreaterThan(0);
    expect(readmissionGap!.expectedDataSource.length).toBeGreaterThan(0);
    expect(readmissionGap!.gapStatement).toContain('readmission');
    expect(readmissionGap!.gapStatement).toContain('blocks');
  });

  it('reports a seed gap ONLY for metrics the tenant does not record', () => {
    // The tenant records two metrics; the rest are seed gaps.
    const recorded = ['readmission_rate_30d', 'ed_utilization_per_1000'];
    const binding = bindFunctionPackForArtifact(
      'healthcare-provider',
      'care_delivery_care_management',
      'business_case',
      recorded,
    );

    const gapKeys = binding.seedGaps.map((g) => g.metricKey);
    expect(gapKeys).not.toContain('readmission_rate_30d');
    expect(gapKeys).not.toContain('ed_utilization_per_1000');
    expect(binding.seedGaps).toHaveLength(
      careDeliveryCareManagementPack.operatingMetrics.length - recorded.length,
    );
    // care-gap closure is a real VBC metric and is NOT recorded — it must
    // surface as a precise seed gap.
    expect(gapKeys).toContain('care_gap_closure_rate');
  });

  it('reports no seed gaps when the tenant records every expected metric', () => {
    const allKeys = careDeliveryCareManagementPack.operatingMetrics.map(
      (m) => m.key,
    );
    const binding = bindFunctionPackForArtifact(
      'healthcare-provider',
      'care_delivery_care_management',
      'business_case',
      allKeys,
    );
    expect(binding.seedGaps).toEqual([]);
  });
});

describe('bindFunctionPackForArtifact — honest fallback', () => {
  it('does not fabricate an outline when no pack exists', () => {
    const binding = bindFunctionPackForArtifact(
      'retail',
      'care_delivery_care_management',
      'business_case',
      [],
    );
    expect(binding.bound).toBe(false);
    expect(binding.deliverableOutline).toEqual([]);
    expect(binding.expectedMetrics).toEqual([]);
    expect(binding.seedGaps).toEqual([]);
    // The agent must surface this honestly, not silently fake depth.
    expect(binding.fallbackNote).toContain('No curated Domain Function Pack');
    expect(binding.fallbackNote).toContain('known');
  });

  it('falls back honestly for an unknown function in a known industry', () => {
    // The healthcare taxonomy is fully catalogued; a
    // healthcare function outside that set (telehealth & virtual care) has
    // no pack yet — a genuinely uncatalogued function, never a faked bind.
    const binding = bindFunctionPackForArtifact(
      'healthcare-provider',
      'telehealth_virtual_care',
      'discover_brief',
      [],
    );
    expect(binding.bound).toBe(false);
    expect(binding.fallbackNote.length).toBeGreaterThan(0);
  });
});
