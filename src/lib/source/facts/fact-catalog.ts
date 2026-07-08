// ─────────────────────────────────────────────────────────────────────────────
// Canonical Source fact catalog — the keystone of the Source analytics fact model.
//
// Source computes value from typed, cited facts via the archetype `valueLeverRules`
// (see src/lib/source/archetypes/registry.ts + types.ts). Every deterministic
// value computation reads its inputs BY KEY. This module is the single, versioned,
// authoritative enumeration of every fact key those levers consume — so the fact
// model, the intake templates, and the value math can never silently drift apart.
//
// DERIVATION (not a hand-typed list): the set of fact keys is DERIVED by sweeping
// `computation.inputs[].key` across ALL `valueLeverRules` in the registry. The
// registry is the source of truth for {key, unit, source}; this catalog layers on
// the presentation/model metadata a rule input does not carry — a human `label`,
// a `description`, and the `entityKind` the fact attaches to (event / tower / app
// / vendor). Adding a lever with a NEW input key to any archetype makes it appear
// here automatically; if that key lacks enrichment metadata, the catalog build
// throws — a loud, deliberate failure that forces the fact to be described before
// it can be consumed. Tests assert the no-orphan-input invariant in both
// directions.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ValueInputSource,
  ValueUnit,
} from '../archetypes/types';
import { listSourceArchetypes } from '../archetypes/registry';

/** Catalog contract version. Bump when the SHAPE of a FactSpec changes. */
export const FACT_CATALOG_VERSION = '1.0.0' as const;

/**
 * What real-world entity a fact attaches to. Drives `entity_ref` on the persisted
 * fact row (a tower id, vendor id, or app id — or null for event-level facts) and
 * the template→fact intake mapping.
 *
 * `value_lever` is the downstream-insight extension (see
 * docs/build/source-downstream-insight-fact-model.md): a fact of this kind hangs
 * off a canonical archetype lever key via `entity_ref` (e.g.
 * `AMS.VOLUME_BAND_PRICING`) — one fact key, one row per lever — so the downstream
 * insights (RFP clause, BAFO, committed value) can carry a per-lever signal
 * WITHOUT faking composite fact keys.
 */
export type FactEntityKind = 'event' | 'tower' | 'app' | 'vendor' | 'value_lever';

export const FACT_ENTITY_KINDS: readonly FactEntityKind[] = [
  'event',
  'tower',
  'app',
  'vendor',
  'value_lever',
] as const;

/**
 * A single canonical fact the value levers consume. `key`, `unit`, and `source`
 * are DERIVED from the registry rule input; `label`, `entityKind`, and
 * `description` come from the enrichment map below.
 */
export interface FactSpec {
  /** Stable fact key the evaluator reads, e.g. 'annual_change_order_spend'. */
  key: string;
  /** Human label for UI / templates. */
  label: string;
  /** Unit of the value (from the registry rule input). */
  unit: ValueUnit;
  /** Where the value is expected to come from (from the registry rule input). */
  source: ValueInputSource;
  /** The entity the fact attaches to (drives entity_ref + template mapping). */
  entityKind: FactEntityKind;
  /** Plain-English description of what the fact measures. */
  description: string;
}

/**
 * Per-key enrichment the registry rule input does NOT carry. Every fact key that
 * appears in any archetype's `valueLeverRules[].computation.inputs[]` MUST have an
 * entry here — the catalog build throws otherwise. Keeping this map hand-authored
 * (rather than inferred) forces a human to state what each fact IS and which
 * entity it hangs off before the value engine can use it.
 *
 * Today this covers the AMS archetype's inputs. As other archetypes gain
 * `valueLeverRules`, add their input keys here; the derivation picks them up with
 * no change to the build logic.
 */
interface FactEnrichment {
  label: string;
  entityKind: FactEntityKind;
  description: string;
}

const FACT_ENRICHMENT: Record<string, FactEnrichment> = {
  // ── AMS · scope leakage ────────────────────────────────────────────────────
  annual_change_order_spend: {
    label: 'Annual change-order / enhancement spend',
    entityKind: 'event',
    description:
      'Yearly spend billed as change-order or enhancement work, parsed from the incumbent contract. The pool from which recurring, avoidable leakage is recovered.',
  },
  recurring_avoidable_pct: {
    label: 'Recurring / avoidable share of change-order spend',
    entityKind: 'event',
    description:
      'Share of change-order spend that recurs and could be folded into base scope or a fixed service catalog, evidenced from the ticket/change record.',
  },
  // ── AMS · pricing (volume-band flex-down) ──────────────────────────────────
  annual_run_cost: {
    label: 'Annual run cost at current band',
    entityKind: 'tower',
    description:
      'Current annual run cost of the in-scope service at the present volume band, from the committed run-cost baseline. Attaches per service tower.',
  },
  projected_volume_decline_pct: {
    label: 'Projected volume decline over term',
    entityKind: 'tower',
    description:
      'Expected decline in ticket / work volume across the contract term, from the enterprise inventory. Drives band step-down repricing.',
  },
  variable_cost_share_pct: {
    label: 'Variable share of run cost',
    entityKind: 'tower',
    description:
      'Portion of run cost that flexes with volume (vs fixed), taken from the vendor pricing schedule. Only this share can step down as volume falls.',
  },
  // ── AMS · productivity credits ─────────────────────────────────────────────
  automatable_effort_pool: {
    label: 'Annual automatable effort pool',
    entityKind: 'event',
    description:
      'Annual effort (valued) that is addressable by automation, from the should-cost model. The base productivity credits are computed against.',
  },
  committed_credit_pct: {
    label: 'Committed productivity-credit %',
    entityKind: 'vendor',
    description:
      'Year-over-year productivity / automation credit the vendor commits to in writing (a credit schedule, not a marketing claim), parsed from the vendor proposal.',
  },
  // ── AMS · retained cost (TCO normalization) ────────────────────────────────
  retained_fte_delta: {
    label: 'Retained FTE delta vs baseline model',
    entityKind: 'vendor',
    description:
      "Difference in retained client / SME FTE the vendor's model assumes versus the baseline, parsed from the vendor proposal. Normalizes over-cheap bids.",
  },
  loaded_fte_cost: {
    label: 'Loaded annual cost per retained FTE',
    entityKind: 'event',
    description:
      'Fully loaded annual cost of one retained client-side FTE, from the enterprise inventory. Values the retained-effort delta.',
  },
  // ── AMS · SLA economics ────────────────────────────────────────────────────
  at_risk_fee_pool: {
    label: 'Annual fee pool exposed to SLA credits',
    entityKind: 'vendor',
    description:
      'Annual fee that SLA credits can claw back, parsed from the vendor proposal. The base of the protected-value SLA calculation.',
  },
  credit_cap_pct: {
    label: 'SLA credit cap %',
    entityKind: 'vendor',
    description:
      'Maximum share of the fee pool recoverable as SLA credits, parsed from the vendor proposal. Caps the protected value.',
  },
  chronic_miss_rate: {
    label: 'Historical chronic-miss rate',
    entityKind: 'event',
    description:
      'Historical rate at which SLAs were chronically missed, from the enterprise incident record. Sizes expected credit exposure.',
  },
  // ── AMS · transition risk ──────────────────────────────────────────────────
  transition_fee: {
    label: 'Quoted transition fee',
    entityKind: 'vendor',
    description:
      'One-time transition / knowledge-transfer fee the vendor quotes, parsed from the vendor proposal. The value at risk if transition overruns.',
  },
  overrun_probability: {
    label: 'Probability of transition overrun',
    entityKind: 'event',
    description:
      'Benchmark probability that transition overruns, from a named market benchmark. Weights the expected avoided-overrun value.',
  },
  overrun_cost_multiple: {
    label: 'Overrun cost multiple',
    entityKind: 'event',
    description:
      'Overrun cost as a multiple of the transition fee, from a named benchmark. Scales the transition value at risk.',
  },
  // ── Cross-archetype / shared inputs ────────────────────────────────────────
  term_years: {
    label: 'Contract term (years)',
    entityKind: 'event',
    description:
      'Length of the contract term in years, parsed from the vendor proposal. Multiplies annualized value levers over the life of the deal.',
  },
};

/**
 * Hand-authored SIGNAL facts the downstream INSIGHT builders read that NO value
 * lever computes over — the fact-model extension that makes the six downstream
 * Source insights real (see docs/build/source-downstream-insight-fact-model.md).
 *
 * Unlike the lever-derived facts above, a signal fact carries its OWN full spec
 * (key, label, unit, source, entityKind, description) — it is not derived from a
 * rule input, so there is nothing to derive it from. It is still hand-authored and
 * still described before it can enter the model (the same "undescribed key must
 * not enter" discipline), but it is EXEMPT from the "every catalog key is a lever
 * input" invariant, because by definition a signal is not a lever input.
 *
 * A `value_lever` signal's `entity_ref` MUST be a canonical archetype lever key
 * (validated at read time against the resolved archetype's `valueLeverRules`);
 * it is never free text.
 */
const DOWNSTREAM_SIGNAL_FACT_SPECS: Record<string, FactSpec> = {
  // ── Shape 1 · per-lever status ─────────────────────────────────────────────
  // RFP clause coverage: is this lever's clause required in the RFP draft?
  // 0/1 carried on the `ratio` unit (a `flag` unit would churn the type surface,
  // the DB, and every exhaustive switch for no functional gain — see the design
  // doc's "Boolean representation" note). 1 = clause present/required, 0 = absent.
  rfp_clause_present: {
    key: 'rfp_clause_present',
    label: 'RFP clause present for lever',
    unit: 'ratio',
    source: 'analyst_input',
    entityKind: 'value_lever',
    description:
      'Whether the RFP draft REQUIRES the clause that protects this value lever (1 = present/required, 0 = absent). One row per lever, keyed by the lever key in entity_ref. Flips RFP clause coverage from a model to a live protected-vs-exposed read.',
  },
  // Committed value: the value LOCKED for this lever by the executed award/contract.
  // A total-over-term $ figure on the `usd` unit — the same basis the lever's own
  // computed band (low/high) is expressed in (value-over-term), so committed can be
  // compared directly against target. NOT usd_per_year: the lever band is already a
  // term total, so an annualized committed number would not be comparable. Sourced
  // from the executed contract / award record (extracted_contract). One row per
  // lever, keyed by the lever key in entity_ref.
  committed_value_usd: {
    key: 'committed_value_usd',
    label: 'Committed value at award for lever',
    unit: 'usd',
    source: 'extracted_contract',
    entityKind: 'value_lever',
    description:
      'The value the executed award/contract COMMITS for this value lever, in USD over the contract term. One row per lever, keyed by the lever key in entity_ref. Flips committed value from a model to a live committed-vs-target read (how much of each lever’s target band the award actually locked).',
  },
  // BAFO progress: the concession the BAFO round CAPTURED for this lever. A total-
  // over-term $ figure on the `usd` unit — the same basis the lever's own computed
  // band (low/high) is expressed in (value-over-term), so captured can be compared
  // directly against target. NOT usd_per_year: the lever band is already a term
  // total, so an annualized captured number would not be comparable (the same
  // reasoning committed_value_usd used). Sourced from the vendor's BAFO submission
  // (extracted_vendor — a BAFO round is a vendor response). One row per lever,
  // keyed by the lever key in entity_ref.
  bafo_concession_captured_usd: {
    key: 'bafo_concession_captured_usd',
    label: 'BAFO concession captured for lever',
    unit: 'usd',
    source: 'extracted_vendor',
    entityKind: 'value_lever',
    description:
      'The concession the BAFO round CAPTURED for this value lever, in USD over the contract term. One row per lever, keyed by the lever key in entity_ref. Flips BAFO progress from a model to a live captured-vs-target read (how much of each lever’s target band the BAFO round actually pulled in); a lever with no concession fact stays at 0-captured / still-open, never fabricated.',
  },
};

/** True when `key` is a hand-authored downstream signal fact (not a lever input). */
export function isSignalFactKey(key: string): boolean {
  return key in DOWNSTREAM_SIGNAL_FACT_SPECS;
}

/**
 * Derive the catalog from the registry, then merge the hand-authored downstream
 * signal facts. Collects every distinct `computation.inputs[].key` across all
 * archetypes' `valueLeverRules`, joins each with its enrichment, adds the signal
 * specs, and freezes the result. Throws if a rule input has no enrichment entry
 * (an undescribed fact must never silently enter the model), if the same key
 * appears with a conflicting unit/source across rules (the fact model requires one
 * canonical meaning per key), or if a signal fact key collides with a lever-derived
 * key (a signal must be a NEW key, never a shadow of a lever input).
 */
function buildFactCatalog(): ReadonlyMap<string, FactSpec> {
  const catalog = new Map<string, FactSpec>();

  for (const archetype of listSourceArchetypes()) {
    for (const rule of archetype.valueLeverRules ?? []) {
      for (const input of rule.computation.inputs) {
        const existing = catalog.get(input.key);
        if (existing) {
          if (existing.unit !== input.unit || existing.source !== input.source) {
            throw new Error(
              `[fact-catalog] Conflicting definition for fact key '${input.key}': ` +
                `${existing.unit}/${existing.source} (from a prior rule) vs ` +
                `${input.unit}/${input.source} (rule '${rule.key}' in archetype ` +
                `'${archetype.id}'). A fact key must have ONE canonical unit + source.`,
            );
          }
          continue;
        }

        const enrichment = FACT_ENRICHMENT[input.key];
        if (!enrichment) {
          throw new Error(
            `[fact-catalog] Value-lever rule '${rule.key}' (archetype '${archetype.id}') ` +
              `references fact key '${input.key}', which has no enrichment entry in ` +
              `FACT_ENRICHMENT. Add its label, entityKind, and description before it ` +
              `can enter the fact model.`,
          );
        }

        catalog.set(input.key, {
          key: input.key,
          label: enrichment.label,
          unit: input.unit,
          source: input.source,
          entityKind: enrichment.entityKind,
          description: enrichment.description,
        });
      }
    }
  }

  // Merge the hand-authored downstream signal facts. A signal key must be NEW —
  // colliding with a lever-derived key would give one key two meanings.
  for (const [key, spec] of Object.entries(DOWNSTREAM_SIGNAL_FACT_SPECS)) {
    if (catalog.has(key)) {
      throw new Error(
        `[fact-catalog] Downstream signal fact '${key}' collides with a ` +
          `lever-derived catalog key. A signal fact must introduce a NEW key, ` +
          `never shadow a value-lever computation input.`,
      );
    }
    catalog.set(key, spec);
  }

  return catalog;
}

/** The frozen, derived canonical catalog, keyed by fact key. */
const CATALOG: ReadonlyMap<string, FactSpec> = buildFactCatalog();

/** All catalog entries, sorted by key for deterministic output. */
export const FACT_CATALOG: readonly FactSpec[] = Object.freeze(
  [...CATALOG.values()].sort((a, b) => a.key.localeCompare(b.key)),
);

/** Every catalog fact key, sorted. */
export const FACT_CATALOG_KEYS: readonly string[] = Object.freeze(
  FACT_CATALOG.map((spec) => spec.key),
);

/** Lookup a canonical fact spec by key. Returns undefined for unknown keys. */
export function factSpecByKey(key: string): FactSpec | undefined {
  return CATALOG.get(key);
}

/** True when `key` is a canonical fact the value levers consume. */
export function isCatalogFactKey(key: string): boolean {
  return CATALOG.has(key);
}

/** All catalog facts that attach to a given entity kind. */
export function factsByEntityKind(entityKind: FactEntityKind): readonly FactSpec[] {
  return FACT_CATALOG.filter((spec) => spec.entityKind === entityKind);
}
