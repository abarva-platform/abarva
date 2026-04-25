// SOL4 · Analytics Modernization Solution Component Pack tests.

import {
  ANALYTICS_MODERNIZATION_COMPONENT_KEYS,
  ANALYTICS_MODERNIZATION_COMPONENTS,
  getAnalyticsModernizationComponent,
  listAnalyticsModernizationComponents,
  recommendAnalyticsModernizationComponents,
  summarizeAnalyticsModernizationComponentPack,
  type AnalyticsModernizationComponentKey,
} from '@/lib/solutions/analytics-modernization-components';

const DOLLAR_PATTERN = /\$\s*\d/;

const EXPECTED_KEYS: AnalyticsModernizationComponentKey[] = [
  'data_platform_assessment',
  'cloud_lakehouse_foundation',
  'semantic_layer_design',
  'master_data_management',
  'data_quality_observability',
  'reporting_rationalization',
  'ai_ready_feature_store',
  'data_governance_operating_model',
  'metadata_catalog_lineage',
  'self_service_analytics_enablement',
  'legacy_platform_decommission',
  'value_case_and_migration_roadmap',
];

// ---------------------------------------------------------------------
// All components present + canonical order
// ---------------------------------------------------------------------

describe('listAnalyticsModernizationComponents', () => {
  it('returns exactly the 12 canonical components in canonical order', () => {
    const components = listAnalyticsModernizationComponents();
    expect(components.length).toBe(12);
    expect(components.map((c) => c.key)).toEqual(EXPECTED_KEYS);
    expect(ANALYTICS_MODERNIZATION_COMPONENT_KEYS).toEqual(EXPECTED_KEYS);
  });

  it('returns deterministic output across repeated calls', () => {
    const a = listAnalyticsModernizationComponents();
    const b = listAnalyticsModernizationComponents();
    expect(a).toEqual(b);
  });

  it('serializes byte-equal across repeated calls', () => {
    const a = JSON.stringify(listAnalyticsModernizationComponents());
    const b = JSON.stringify(listAnalyticsModernizationComponents());
    expect(a).toBe(b);
  });
});

// ---------------------------------------------------------------------
// Field set per component
// ---------------------------------------------------------------------

describe('every component carries the required field set', () => {
  it.each(ANALYTICS_MODERNIZATION_COMPONENT_KEYS.map((k) => [k]))(
    '%s has full schema and meets array minimums',
    (k) => {
      const c = getAnalyticsModernizationComponent(k as string);
      expect(c).not.toBeNull();
      const comp = c!;
      expect(comp.key).toBe(k);
      expect(comp.name.length).toBeGreaterThan(0);
      expect(comp.definition.length).toBeGreaterThan(0);
      expect(comp.problemSolved.length).toBeGreaterThan(0);
      expect(comp.requiredCurrentStateInputs.length).toBeGreaterThanOrEqual(3);
      expect(comp.targetCapabilities.length).toBeGreaterThanOrEqual(2);
      expect(comp.architectureBuildingBlocks.length).toBeGreaterThanOrEqual(2);
      expect(comp.governanceRequirements.length).toBeGreaterThanOrEqual(2);
      expect(comp.implementationSteps.length).toBeGreaterThanOrEqual(3);
      expect(comp.expectedOutcomes.length).toBeGreaterThanOrEqual(2);
      expect(comp.risks.length).toBeGreaterThanOrEqual(1);
      expect(comp.requiredWorkshops.length).toBeGreaterThanOrEqual(1);
      expect(comp.deliverablesProduced.length).toBeGreaterThanOrEqual(1);
      expect(comp.createdFrom).toBe('deterministic_solution_component_pack');
    },
  );

  it('every required string field is non-empty after trim', () => {
    for (const c of listAnalyticsModernizationComponents()) {
      expect(c.name.trim().length).toBeGreaterThan(0);
      expect(c.definition.trim().length).toBeGreaterThan(0);
      expect(c.problemSolved.trim().length).toBeGreaterThan(0);
      const arrays: ReadonlyArray<ReadonlyArray<string>> = [
        c.requiredCurrentStateInputs,
        c.targetCapabilities,
        c.architectureBuildingBlocks,
        c.governanceRequirements,
        c.implementationSteps,
        c.expectedOutcomes,
        c.risks,
        c.requiredWorkshops,
        c.deliverablesProduced,
      ];
      for (const arr of arrays) {
        for (const item of arr) {
          expect(item.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('exposes ANALYTICS_MODERNIZATION_COMPONENTS registry with every canonical key', () => {
    for (const k of EXPECTED_KEYS) {
      expect(ANALYTICS_MODERNIZATION_COMPONENTS[k]).toBeDefined();
      expect(ANALYTICS_MODERNIZATION_COMPONENTS[k].key).toBe(k);
    }
  });
});

// ---------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------

describe('getAnalyticsModernizationComponent', () => {
  it('returns null for unknown keys', () => {
    expect(getAnalyticsModernizationComponent('unknown')).toBeNull();
    expect(getAnalyticsModernizationComponent('')).toBeNull();
    expect(getAnalyticsModernizationComponent('not-a-real-component')).toBeNull();
    expect(getAnalyticsModernizationComponent('context_as_code_foundation')).toBeNull();
  });

  it('returns the canonical record for every key', () => {
    for (const k of ANALYTICS_MODERNIZATION_COMPONENT_KEYS) {
      const c = getAnalyticsModernizationComponent(k);
      expect(c).not.toBeNull();
      expect(c!.key).toBe(k);
    }
  });
});

// ---------------------------------------------------------------------
// Recommend from inputs
// ---------------------------------------------------------------------

describe('recommendAnalyticsModernizationComponents', () => {
  it('returns empty when no capabilityKeywords or currentStateGaps are supplied', () => {
    expect(recommendAnalyticsModernizationComponents({})).toEqual([]);
    expect(
      recommendAnalyticsModernizationComponents({ capabilityKeywords: [], currentStateGaps: [] }),
    ).toEqual([]);
  });

  it('matches by capability keyword substring', () => {
    const matched = recommendAnalyticsModernizationComponents({
      capabilityKeywords: ['lineage'],
    });
    expect(matched.length).toBeGreaterThan(0);
    expect(matched.map((m) => m.key)).toContain('metadata_catalog_lineage');
  });

  it('matches by current-state gap substring', () => {
    const matched = recommendAnalyticsModernizationComponents({
      currentStateGaps: ['legacy warehouses'],
    });
    expect(matched.length).toBeGreaterThan(0);
    expect(matched.map((m) => m.key)).toContain('cloud_lakehouse_foundation');
  });

  it('returns canonical-order results regardless of input order', () => {
    const a = recommendAnalyticsModernizationComponents({
      capabilityKeywords: ['semantic', 'feature'],
      currentStateGaps: ['governance', 'lineage'],
    });
    const b = recommendAnalyticsModernizationComponents({
      capabilityKeywords: ['feature', 'semantic'],
      currentStateGaps: ['lineage', 'governance'],
    });
    expect(a.map((c) => c.key)).toEqual(b.map((c) => c.key));
    const aKeys = a.map((c) => c.key);
    const canonicalIdx = aKeys.map((k) =>
      ANALYTICS_MODERNIZATION_COMPONENT_KEYS.indexOf(k),
    );
    const sorted = [...canonicalIdx].sort((x, y) => x - y);
    expect(canonicalIdx).toEqual(sorted);
  });

  it('union semantics: a component matched by keyword OR gap appears once', () => {
    const matched = recommendAnalyticsModernizationComponents({
      capabilityKeywords: ['lineage'],
      currentStateGaps: ['lineage'],
    });
    const keys = matched.map((c) => c.key);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
    expect(keys).toContain('metadata_catalog_lineage');
  });

  it('ignores unknown / non-matching inputs without throwing', () => {
    const matched = recommendAnalyticsModernizationComponents({
      capabilityKeywords: ['definitely-not-a-token-zzz'],
      currentStateGaps: ['definitely-not-a-gap-zzz'],
    });
    expect(matched).toEqual([]);
  });

  it('returns deterministic output across repeated calls', () => {
    const input = {
      capabilityKeywords: ['lineage'],
      currentStateGaps: ['governance'],
    };
    const a = recommendAnalyticsModernizationComponents(input);
    const b = recommendAnalyticsModernizationComponents(input);
    expect(a).toEqual(b);
  });
});

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------

describe('summarizeAnalyticsModernizationComponentPack', () => {
  it('totalCount equals 12', () => {
    const s = summarizeAnalyticsModernizationComponentPack();
    expect(s.totalCount).toBe(12);
  });

  it('uniqueArchitectureBlocks is sorted ascending', () => {
    const s = summarizeAnalyticsModernizationComponentPack();
    const sorted = [...s.uniqueArchitectureBlocks].sort();
    expect(s.uniqueArchitectureBlocks).toEqual(sorted);
    expect(s.uniqueArchitectureBlocks.length).toBeGreaterThan(0);
  });

  it('uniqueWorkshops is sorted ascending', () => {
    const s = summarizeAnalyticsModernizationComponentPack();
    const sorted = [...s.uniqueWorkshops].sort();
    expect(s.uniqueWorkshops).toEqual(sorted);
    expect(s.uniqueWorkshops.length).toBeGreaterThan(0);
  });

  it('uniqueDeliverables is sorted ascending', () => {
    const s = summarizeAnalyticsModernizationComponentPack();
    const sorted = [...s.uniqueDeliverables].sort();
    expect(s.uniqueDeliverables).toEqual(sorted);
    expect(s.uniqueDeliverables.length).toBeGreaterThan(0);
  });

  it('returns deterministic output across repeated calls', () => {
    const a = summarizeAnalyticsModernizationComponentPack();
    const b = summarizeAnalyticsModernizationComponentPack();
    expect(a).toEqual(b);
  });
});

// ---------------------------------------------------------------------
// No fabrication
// ---------------------------------------------------------------------

describe('no fabrication', () => {
  it('JSON.stringify of the registry does not match a dollar-amount pattern', () => {
    const text = JSON.stringify(ANALYTICS_MODERNIZATION_COMPONENTS);
    expect(text).not.toMatch(DOLLAR_PATTERN);
  });

  it('every component is tagged createdFrom: deterministic_solution_component_pack', () => {
    for (const c of listAnalyticsModernizationComponents()) {
      expect(c.createdFrom).toBe('deterministic_solution_component_pack');
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene · analytics-modernization-components.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/solutions/analytics-modernization-components.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  it('does not call Date.now / Math.random / new Date / fetch(', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
    expect(codeOnly).not.toMatch(/\bfetch\(/);
  });

  it('does not invoke Anthropic / OpenAI / Supabase runtime', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
    expect(codeOnly).not.toMatch(/supabase/i);
  });

  it('does not import auth / source / sentinel / atlas / nexus / agent', () => {
    expect(codeOnly).not.toMatch(/@\/lib\/auth/);
    expect(codeOnly).not.toMatch(/@\/lib\/source/);
    expect(codeOnly).not.toMatch(/@\/lib\/sentinel/);
    expect(codeOnly).not.toMatch(/@\/lib\/atlas/);
    expect(codeOnly).not.toMatch(/@\/lib\/nexus/);
    expect(codeOnly).not.toMatch(/@\/lib\/agent/);
  });

  it('does not import next/* or React', () => {
    expect(codeOnly).not.toMatch(/from 'next\//);
    expect(codeOnly).not.toMatch(/from "next\//);
    expect(codeOnly).not.toMatch(/from 'react'/);
    expect(codeOnly).not.toMatch(/from "react"/);
  });
});
