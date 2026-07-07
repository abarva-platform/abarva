// The keystone invariant: the fact catalog and the archetype value levers stay in
// lockstep. Every input a value lever consumes MUST resolve to a catalog entry
// (no orphan inputs), and the catalog must not carry facts no lever uses (no dead
// facts). This is what keeps the fact model honest as levers are added.

import {
  FACT_CATALOG,
  FACT_CATALOG_KEYS,
  FACT_CATALOG_VERSION,
  FACT_ENTITY_KINDS,
  factSpecByKey,
  factsByEntityKind,
  isCatalogFactKey,
  type FactEntityKind,
} from '../fact-catalog';
import { listSourceArchetypes } from '../../archetypes/registry';

/** Every distinct computation input key across all archetypes' value levers. */
function allRuleInputKeys(): Set<string> {
  const keys = new Set<string>();
  for (const archetype of listSourceArchetypes()) {
    for (const rule of archetype.valueLeverRules ?? []) {
      for (const input of rule.computation.inputs) {
        keys.add(input.key);
      }
    }
  }
  return keys;
}

describe('Source fact catalog — value-lever lockstep', () => {
  it('resolves every value-lever computation input to a catalog entry (no orphans)', () => {
    const orphans: string[] = [];
    for (const archetype of listSourceArchetypes()) {
      for (const rule of archetype.valueLeverRules ?? []) {
        for (const input of rule.computation.inputs) {
          if (!isCatalogFactKey(input.key)) {
            orphans.push(`${archetype.id}/${rule.key}:${input.key}`);
          }
        }
      }
    }
    expect(orphans).toEqual([]);
  });

  it('carries no dead facts (every catalog key is consumed by some lever)', () => {
    const consumed = allRuleInputKeys();
    const dead = FACT_CATALOG_KEYS.filter((key) => !consumed.has(key));
    expect(dead).toEqual([]);
  });

  it('the catalog key set equals the lever input key set exactly', () => {
    const consumed = [...allRuleInputKeys()].sort();
    expect([...FACT_CATALOG_KEYS].sort()).toEqual(consumed);
  });

  it('preserves each input unit + source from the registry (catalog does not rewrite them)', () => {
    for (const archetype of listSourceArchetypes()) {
      for (const rule of archetype.valueLeverRules ?? []) {
        for (const input of rule.computation.inputs) {
          const spec = factSpecByKey(input.key);
          expect(spec).toBeDefined();
          expect(spec!.unit).toBe(input.unit);
          expect(spec!.source).toBe(input.source);
        }
      }
    }
  });
});

describe('Source fact catalog — shape + lookups', () => {
  it('is versioned', () => {
    expect(FACT_CATALOG_VERSION).toBe('1.0.0');
  });

  it('every entry has label, description, and a valid entityKind', () => {
    for (const spec of FACT_CATALOG) {
      expect(spec.label.length).toBeGreaterThan(0);
      expect(spec.description.length).toBeGreaterThan(0);
      expect(FACT_ENTITY_KINDS).toContain(spec.entityKind);
    }
  });

  it('is sorted by key and has unique keys', () => {
    const keys = FACT_CATALOG.map((s) => s.key);
    expect(keys).toEqual([...keys].sort());
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('exposes the AMS fact keys today', () => {
    // Sanity anchor: the AMS archetype's inputs are present.
    for (const key of [
      'annual_change_order_spend',
      'recurring_avoidable_pct',
      'annual_run_cost',
      'projected_volume_decline_pct',
      'variable_cost_share_pct',
      'automatable_effort_pool',
      'committed_credit_pct',
      'retained_fte_delta',
      'loaded_fte_cost',
      'at_risk_fee_pool',
      'credit_cap_pct',
      'chronic_miss_rate',
      'transition_fee',
      'overrun_probability',
      'overrun_cost_multiple',
      'term_years',
    ]) {
      expect(isCatalogFactKey(key)).toBe(true);
    }
  });

  it('factSpecByKey returns undefined for unknown keys', () => {
    expect(factSpecByKey('not_a_real_fact')).toBeUndefined();
  });

  it('factsByEntityKind partitions the catalog exactly', () => {
    const counted = FACT_ENTITY_KINDS.reduce(
      (sum, kind) => sum + factsByEntityKind(kind as FactEntityKind).length,
      0,
    );
    expect(counted).toBe(FACT_CATALOG.length);
  });
});
