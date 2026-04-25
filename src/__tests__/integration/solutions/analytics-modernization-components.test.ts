// SOL4 · Analytics Modernization Solution Component Pack tests.

import {
  ANALYTICS_MODERNIZATION_COMPONENT_KEYS,
  ANALYTICS_MODERNIZATION_COMPONENTS,
  getAnalyticsModernizationComponent,
  listAnalyticsModernizationComponents,
  recommendAnalyticsModernizationComponents,
  summarizeAnalyticsModernizationComponentPack,
  type AnalyticsModernizationComponent,
  type AnalyticsModernizationComponentKey,
} from '@/lib/solutions/analytics-modernization-components';

const DOLLAR_PATTERN = /\$\s?\d/;

const CANONICAL_KEYS: AnalyticsModernizationComponentKey[] = [
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
  'data_product_operating_model',
  'real_time_integration_layer',
  'analytics_cost_optimization',
];

function collectStringFields(c: AnalyticsModernizationComponent): string[] {
  return [
    c.name,
    c.definition,
    c.problemSolved,
    ...c.requiredCurrentStateInputs,
    ...c.targetCapabilities,
    ...c.architectureBuildingBlocks,
    ...c.governanceRequirements,
    ...c.implementationSteps,
    ...c.expectedOutcomes,
    ...c.risks,
    ...c.requiredWorkshops,
    ...c.deliverablesProduced,
    ...c.relatedArchetypes,
  ];
}

// ---------------------------------------------------------------------
// All components present + canonical order
// ---------------------------------------------------------------------

describe('listAnalyticsModernizationComponents', () => {
  it('returns exactly the 15 canonical components in canonical order', () => {
    const components = listAnalyticsModernizationComponents();
    expect(components.length).toBe(15);
    expect(components.map((c) => c.key)).toEqual(CANONICAL_KEYS);
    expect(ANALYTICS_MODERNIZATION_COMPONENT_KEYS).toEqual(CANONICAL_KEYS);
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

  it('exposes the canonical record map keyed in canonical order', () => {
    expect(Object.keys(ANALYTICS_MODERNIZATION_COMPONENTS)).toEqual(CANONICAL_KEYS);
    for (const k of CANONICAL_KEYS) {
      expect(ANALYTICS_MODERNIZATION_COMPONENTS[k].key).toBe(k);
    }
  });
});

// ---------------------------------------------------------------------
// Field set per component
// ---------------------------------------------------------------------

describe('every component carries the required field set', () => {
  it.each(CANONICAL_KEYS.map((k) => [k]))(
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
      expect(comp.relatedArchetypes.length).toBeGreaterThanOrEqual(1);
      expect(comp.createdFrom).toBe('deterministic_solution_component_pack');
    },
  );

  it('every required string field is non-empty after trim', () => {
    for (const c of listAnalyticsModernizationComponents()) {
      expect(c.name.trim().length).toBeGreaterThan(0);
      expect(c.definition.trim().length).toBeGreaterThan(0);
      expect(c.problemSolved.trim().length).toBeGreaterThan(0);
      for (const item of collectStringFields(c)) {
        expect(item.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Coverage: semantic / data quality / governance / AI / feature store
// ---------------------------------------------------------------------

describe('coverage of canonical analytics-modernization concepts', () => {
  function packText(): string {
    return listAnalyticsModernizationComponents()
      .map((c) => collectStringFields(c).join(' | '))
      .join(' || ')
      .toLowerCase();
  }

  it('the registry mentions the semantic layer concept', () => {
    expect(packText()).toContain('semantic');
  });

  it('the registry mentions data quality concepts', () => {
    expect(packText()).toContain('data quality');
  });

  it('the registry mentions governance concepts', () => {
    expect(packText()).toContain('governance');
  });

  it('the registry explicitly names AI / feature-store readiness', () => {
    const text = packText();
    expect(text).toMatch(/\bai\b/);
    expect(text).toContain('feature store');
  });

  it('ai_ready_feature_store is present and explicitly references AI readiness', () => {
    const featureStore = getAnalyticsModernizationComponent('ai_ready_feature_store');
    expect(featureStore).not.toBeNull();
    const text = collectStringFields(featureStore!).join(' | ').toLowerCase();
    expect(text).toMatch(/\bai\b/);
    expect(text).toContain('feature store');
  });

  it('semantic_layer_design and data_quality_observability are present', () => {
    expect(getAnalyticsModernizationComponent('semantic_layer_design')).not.toBeNull();
    expect(
      getAnalyticsModernizationComponent('data_quality_observability'),
    ).not.toBeNull();
  });

  it('data_governance_operating_model is present', () => {
    expect(
      getAnalyticsModernizationComponent('data_governance_operating_model'),
    ).not.toBeNull();
  });
});

// ---------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------

describe('getAnalyticsModernizationComponent', () => {
  it('returns null for unknown keys', () => {
    expect(getAnalyticsModernizationComponent('not-a-real-component')).toBeNull();
    expect(getAnalyticsModernizationComponent('')).toBeNull();
    expect(getAnalyticsModernizationComponent('weak_data_foundation')).toBeNull();
    expect(getAnalyticsModernizationComponent('value_ledger_for_pdlc')).toBeNull();
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
      recommendAnalyticsModernizationComponents({ capabilityKeywords: [] }),
    ).toEqual([]);
    expect(
      recommendAnalyticsModernizationComponents({
        capabilityKeywords: [],
        currentStateGaps: [],
      }),
    ).toEqual([]);
  });

  it('matches by capability keyword overlap', () => {
    const matched = recommendAnalyticsModernizationComponents({
      capabilityKeywords: ['feature store'],
    });
    expect(matched.length).toBeGreaterThan(0);
    expect(matched.map((c) => c.key)).toContain('ai_ready_feature_store');
  });

  it('matches by current-state-gap overlap', () => {
    const matched = recommendAnalyticsModernizationComponents({
      currentStateGaps: ['inventory of curated datasets'],
    });
    expect(matched.length).toBeGreaterThan(0);
    expect(matched.map((c) => c.key)).toContain('data_quality_observability');
  });

  it('returns canonical-order results regardless of input order', () => {
    const a = recommendAnalyticsModernizationComponents({
      capabilityKeywords: ['governance', 'semantic'],
      currentStateGaps: ['inventory of source systems'],
    });
    const b = recommendAnalyticsModernizationComponents({
      capabilityKeywords: ['semantic', 'governance'],
      currentStateGaps: ['inventory of source systems'],
    });
    expect(a.map((c) => c.key)).toEqual(b.map((c) => c.key));
    const aKeys = a.map((c) => c.key);
    const canonicalIdx = aKeys.map((k) => ANALYTICS_MODERNIZATION_COMPONENT_KEYS.indexOf(k));
    const sorted = [...canonicalIdx].sort((x, y) => x - y);
    expect(canonicalIdx).toEqual(sorted);
  });

  it('ignores unknown capability and gap keywords without throwing', () => {
    const matched = recommendAnalyticsModernizationComponents({
      capabilityKeywords: ['definitely_not_a_capability_keyword_xyz'],
      currentStateGaps: ['definitely_not_a_gap_keyword_xyz'],
    });
    expect(matched).toEqual([]);
  });

  it('union semantics: a component matched by capability or by gap appears once', () => {
    const matched = recommendAnalyticsModernizationComponents({
      capabilityKeywords: ['feature store'],
      currentStateGaps: ['inventory of ai / ml use cases'],
    });
    const keys = matched.map((c) => c.key);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
    expect(keys).toContain('ai_ready_feature_store');
  });

  it('returns deterministic output across repeated calls', () => {
    const input = {
      capabilityKeywords: ['governance', 'semantic'],
      currentStateGaps: ['inventory of curated datasets'],
    };
    const a = recommendAnalyticsModernizationComponents(input);
    const b = recommendAnalyticsModernizationComponents(input);
    expect(a).toEqual(b);
  });

  it('keyword search is case-insensitive', () => {
    const lower = recommendAnalyticsModernizationComponents({
      capabilityKeywords: ['feature store'],
    });
    const upper = recommendAnalyticsModernizationComponents({
      capabilityKeywords: ['FEATURE STORE'],
    });
    expect(upper.map((c) => c.key)).toEqual(lower.map((c) => c.key));
  });
});

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------

describe('summarizeAnalyticsModernizationComponentPack', () => {
  it('totalCount equals the canonical pack size of 15', () => {
    const s = summarizeAnalyticsModernizationComponentPack();
    expect(s.totalCount).toBe(15);
    expect(s.totalCount).toBe(ANALYTICS_MODERNIZATION_COMPONENT_KEYS.length);
  });

  it('uniqueArchitectureBlocks is sorted ascending and contains observed blocks', () => {
    const s = summarizeAnalyticsModernizationComponentPack();
    const sorted = [...s.uniqueArchitectureBlocks].sort((a, b) => a.localeCompare(b));
    expect(s.uniqueArchitectureBlocks).toEqual(sorted);
    const observed = new Set<string>();
    for (const c of listAnalyticsModernizationComponents()) {
      for (const b of c.architectureBuildingBlocks) observed.add(b);
    }
    expect(new Set(s.uniqueArchitectureBlocks)).toEqual(observed);
  });

  it('uniqueWorkshops is sorted ascending and reconciles to observed workshops', () => {
    const s = summarizeAnalyticsModernizationComponentPack();
    const sorted = [...s.uniqueWorkshops].sort((a, b) => a.localeCompare(b));
    expect(s.uniqueWorkshops).toEqual(sorted);
    const observed = new Set<string>();
    for (const c of listAnalyticsModernizationComponents()) {
      for (const w of c.requiredWorkshops) observed.add(w);
    }
    expect(new Set(s.uniqueWorkshops)).toEqual(observed);
  });

  it('uniqueDeliverables is sorted ascending and reconciles to observed deliverables', () => {
    const s = summarizeAnalyticsModernizationComponentPack();
    const sorted = [...s.uniqueDeliverables].sort((a, b) => a.localeCompare(b));
    expect(s.uniqueDeliverables).toEqual(sorted);
    const observed = new Set<string>();
    for (const c of listAnalyticsModernizationComponents()) {
      for (const d of c.deliverablesProduced) observed.add(d);
    }
    expect(new Set(s.uniqueDeliverables)).toEqual(observed);
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
  it('no component invents a dollar amount in any string field', () => {
    for (const c of listAnalyticsModernizationComponents()) {
      for (const f of collectStringFields(c)) {
        expect(f).not.toMatch(DOLLAR_PATTERN);
      }
    }
  });

  it('every component is tagged createdFrom: deterministic_solution_component_pack', () => {
    for (const c of listAnalyticsModernizationComponents()) {
      expect(c.createdFrom).toBe('deterministic_solution_component_pack');
    }
  });

  it('no component string field claims live retrieval / live model invocation', () => {
    const livePatterns = [
      /live model invocation/i,
      /real-?time retrieval/i,
      /live anthropic/i,
      /live openai/i,
    ];
    for (const c of listAnalyticsModernizationComponents()) {
      const text = collectStringFields(c).join(' | ');
      for (const p of livePatterns) {
        expect(text).not.toMatch(p);
      }
    }
  });

  it('no component string field carries a banned placeholder phrase', () => {
    const banned = [/coming soon/i, /\btbd\b/i, /lorem ipsum/i];
    for (const c of listAnalyticsModernizationComponents()) {
      const text = collectStringFields(c).join(' | ');
      for (const p of banned) {
        expect(text).not.toMatch(p);
      }
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

  it('does not import Sentinel / Atlas / Nexus / Agent runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/components\/agent\//);
  });

  it('does not import Source UI, legacy /programs, mock.ts, auth, or supabase', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/programs\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
  });

  it('does not call Date.now / Math.random / new Date / fetch', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
    expect(codeOnly).not.toMatch(/\bfetch\(/);
  });

  it('does not invoke Claude / OpenAI / Pinecone runtime', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
    expect(codeOnly).not.toMatch(/pinecone/i);
  });

  it('does not use React state hooks', () => {
    expect(codeOnly).not.toMatch(/\buseState\b/);
    expect(codeOnly).not.toMatch(/\buseEffect\b/);
  });
});
