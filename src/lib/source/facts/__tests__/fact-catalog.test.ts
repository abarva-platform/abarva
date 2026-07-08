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
  isSignalFactKey,
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

  it('carries no dead facts (every catalog key is a lever input OR a signal fact)', () => {
    const consumed = allRuleInputKeys();
    // Signal facts (downstream-insight extension) are catalog entries that no
    // lever consumes — they are read by insight builders, not the value math — so
    // they are legitimately not lever inputs. Everything else must be consumed.
    const dead = FACT_CATALOG_KEYS.filter(
      (key) => !consumed.has(key) && !isSignalFactKey(key),
    );
    expect(dead).toEqual([]);
  });

  it('the lever-derived catalog key set equals the lever input key set exactly', () => {
    const consumed = [...allRuleInputKeys()].sort();
    // Exclude signal facts from the lever-derived slice before comparing.
    const leverDerived = [...FACT_CATALOG_KEYS]
      .filter((key) => !isSignalFactKey(key))
      .sort();
    expect(leverDerived).toEqual(consumed);
  });

  it('every signal fact resolves and is NOT a lever input', () => {
    const consumed = allRuleInputKeys();
    const signalKeys = FACT_CATALOG_KEYS.filter(isSignalFactKey);
    expect(signalKeys.length).toBeGreaterThan(0);
    for (const key of signalKeys) {
      expect(isCatalogFactKey(key)).toBe(true);
      expect(consumed.has(key)).toBe(false);
    }
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

  it('resolves the rfp_clause_present signal fact under entity_kind value_lever', () => {
    expect(isCatalogFactKey('rfp_clause_present')).toBe(true);
    expect(isSignalFactKey('rfp_clause_present')).toBe(true);
    const spec = factSpecByKey('rfp_clause_present');
    expect(spec).toBeDefined();
    expect(spec!.entityKind).toBe('value_lever');
    // Boolean carried as 0/1 on the ratio unit (see the design doc).
    expect(spec!.unit).toBe('ratio');
    expect(FACT_ENTITY_KINDS).toContain('value_lever');
  });

  it('resolves the committed_value_usd signal fact under entity_kind value_lever', () => {
    expect(isCatalogFactKey('committed_value_usd')).toBe(true);
    expect(isSignalFactKey('committed_value_usd')).toBe(true);
    const spec = factSpecByKey('committed_value_usd');
    expect(spec).toBeDefined();
    expect(spec!.entityKind).toBe('value_lever');
    // A total-over-term $ figure on the usd unit — same basis as the lever band,
    // so committed can be compared directly against target.
    expect(spec!.unit).toBe('usd');
    // Sourced from the executed contract / award record.
    expect(spec!.source).toBe('extracted_contract');
  });

  it('resolves the bafo_concession_captured_usd signal fact under entity_kind value_lever', () => {
    expect(isCatalogFactKey('bafo_concession_captured_usd')).toBe(true);
    expect(isSignalFactKey('bafo_concession_captured_usd')).toBe(true);
    const spec = factSpecByKey('bafo_concession_captured_usd');
    expect(spec).toBeDefined();
    expect(spec!.entityKind).toBe('value_lever');
    // A total-over-term $ figure on the usd unit — same basis as the lever band,
    // so captured can be compared directly against target.
    expect(spec!.unit).toBe('usd');
    // Sourced from the vendor's BAFO submission (a BAFO round is a vendor response).
    expect(spec!.source).toBe('extracted_vendor');
  });

  it('resolves the response_addressed signal fact under entity_kind vendor_lever', () => {
    expect(isCatalogFactKey('response_addressed')).toBe(true);
    expect(isSignalFactKey('response_addressed')).toBe(true);
    const spec = factSpecByKey('response_addressed');
    expect(spec).toBeDefined();
    expect(spec!.entityKind).toBe('vendor_lever');
    // 0/0.5/1 on the ratio unit (see the multi-vendor design doc) — no new unit.
    expect(spec!.unit).toBe('ratio');
    // A vendor's answer is extracted from the vendor response.
    expect(spec!.source).toBe('extracted_vendor');
    // The new composite entity kind is admitted.
    expect(FACT_ENTITY_KINDS).toContain('vendor_lever');
  });

  it('resolves the three vendor-bid signal facts under entity_kind vendor', () => {
    const bidKeys = [
      { key: 'vendor_headline_bid', unit: 'usd' },
      { key: 'vendor_retained_fte_delta', unit: 'fte' },
      { key: 'vendor_sla_credit_cap_pct', unit: 'pct' },
    ] as const;
    for (const { key, unit } of bidKeys) {
      expect(isCatalogFactKey(key)).toBe(true);
      // A bid line item is a hand-authored signal (not a lever input).
      expect(isSignalFactKey(key)).toBe(true);
      const spec = factSpecByKey(key);
      expect(spec).toBeDefined();
      // entity_kind='vendor' — no new entity kind, no migration.
      expect(spec!.entityKind).toBe('vendor');
      expect(spec!.unit).toBe(unit);
      // A vendor's bid is extracted from its proposal.
      expect(spec!.source).toBe('extracted_vendor');
    }
    // vendor is an already-allowed kind (no migration was needed for the bids).
    expect(FACT_ENTITY_KINDS).toContain('vendor');
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
