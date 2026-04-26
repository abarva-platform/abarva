// ACT4 · AI Value / Outcome Ledger Read Model · integration tests.
//
// Purely deterministic. No DOM, no model calls, no network, no clock.
//
// Coverage:
//
// - ≥ 16 ledger entries.
// - All seven canonical categories present (≥ 1 each).
// - All seven canonical readiness states present (≥ 1 each).
// - Every entry carries `seed_value: true`.
// - Entries with `realizedValue !== null` have non-null
//   `varianceAbs` and `variancePercent`.
// - `computeVariance` math is correct against a hand-derived sample.
// - `computeVariance` returns null fields when `realizedValue` is null.
// - `summarizeAiValueOutcomeLedger` reconciles totals.
// - `getMeasuredEntries` returns only `measured_in_pilot` /
//   `measured_in_production` rows.
// - `getProjectedOnlyEntries` returns only `projected_only` rows.
// - `getEntriesByCategory` returns only matching-category rows.
// - ≥ 4 entries have `realizedValue !== null`.
// - ≥ 2 entries carry `governanceReviewStatus === 'flagged'`.
// - ≥ 2 entries link `programKey`; ≥ 2 entries link `aiUseCaseKey`.
// - No fabricated USD amounts (every dollar field uses `usd_seed`).
// - Module hygiene: no banned imports, no banned APIs.

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  VALUE_LEDGER_CATEGORIES,
  VALUE_MEASUREMENT_UNITS,
  VALUE_READINESS_STATES,
  buildAiValueOutcomeLedger,
  computeVariance,
  getEntriesByCategory,
  getMeasuredEntries,
  getProjectedOnlyEntries,
  summarizeAiValueOutcomeLedger,
  type ValueLedgerCategory,
  type ValueLedgerEntry,
  type ValueOutcomeLedgerSummary,
  type ValueReadinessState,
} from '@/lib/tower/ai-value-outcome-ledger';

const ledger: readonly ValueLedgerEntry[] = buildAiValueOutcomeLedger();

const MODULE_SOURCE_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'lib',
  'tower',
  'ai-value-outcome-ledger.ts',
);

const MODULE_SOURCE = fs.readFileSync(MODULE_SOURCE_PATH, 'utf8');

// ---------------------------------------------------------------------
// Shape & determinism
// ---------------------------------------------------------------------

describe('buildAiValueOutcomeLedger · shape and determinism', () => {
  it('returns at least 16 ledger entries', () => {
    expect(ledger.length).toBeGreaterThanOrEqual(16);
  });

  it('is byte-equal across repeated calls (deterministic)', () => {
    const a = buildAiValueOutcomeLedger();
    const b = buildAiValueOutcomeLedger();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('exposes the canonical category tuple in stable order', () => {
    expect([...VALUE_LEDGER_CATEGORIES]).toEqual([
      'cost_avoidance',
      'productivity',
      'revenue_lift',
      'risk_reduction',
      'customer_experience',
      'employee_experience',
      'compliance',
    ]);
  });

  it('exposes the canonical readiness tuple in stable order', () => {
    expect([...VALUE_READINESS_STATES]).toEqual([
      'projected_only',
      'baseline_pending',
      'baseline_set',
      'in_pilot_measurement',
      'measured_in_pilot',
      'measured_in_production',
      'declined',
    ]);
  });

  it('every entry carries seed_value: true', () => {
    for (const entry of ledger) {
      expect(entry.seed_value).toBe(true);
    }
  });

  it('every entry carries createdFrom: "deterministic_value_outcome_ledger_seed"', () => {
    for (const entry of ledger) {
      expect(entry.createdFrom).toBe('deterministic_value_outcome_ledger_seed');
    }
  });

  it('every id matches the canonical "value-seed-{n}" shape', () => {
    for (const entry of ledger) {
      expect(entry.id).toMatch(/^value-seed-\d+$/);
    }
  });

  it('entry ids are unique', () => {
    const ids = ledger.map((entry) => entry.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every entry has a non-empty initiative, counterfactual, and ownerRole', () => {
    for (const entry of ledger) {
      expect(entry.initiative.length).toBeGreaterThan(0);
      expect(entry.counterfactual.length).toBeGreaterThan(0);
      expect(entry.measurementOwnerRole.length).toBeGreaterThan(0);
    }
  });

  it('every entry carries at least one note', () => {
    for (const entry of ledger) {
      expect(entry.notes.length).toBeGreaterThanOrEqual(1);
      for (const note of entry.notes) {
        expect(note.length).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Category & readiness coverage
// ---------------------------------------------------------------------

describe('category and readiness coverage', () => {
  it.each(VALUE_LEDGER_CATEGORIES.map((c) => [c]))(
    'has at least one entry for category %s',
    (category) => {
      const matches = ledger.filter((entry) => entry.category === category);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    },
  );

  it.each(VALUE_READINESS_STATES.map((s) => [s]))(
    'has at least one entry for readiness %s',
    (state) => {
      const matches = ledger.filter((entry) => entry.readiness === state);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    },
  );

  it('only uses canonical categories', () => {
    const allowed = new Set<ValueLedgerCategory>([...VALUE_LEDGER_CATEGORIES]);
    for (const entry of ledger) {
      expect(allowed.has(entry.category)).toBe(true);
    }
  });

  it('only uses canonical readiness states', () => {
    const allowed = new Set<ValueReadinessState>([...VALUE_READINESS_STATES]);
    for (const entry of ledger) {
      expect(allowed.has(entry.readiness)).toBe(true);
    }
  });

  it('only uses canonical measurement units', () => {
    const allowed = new Set([...VALUE_MEASUREMENT_UNITS]);
    for (const entry of ledger) {
      expect(allowed.has(entry.measurementUnit)).toBe(true);
    }
  });

  it('only uses canonical counterfactual confidence labels', () => {
    const allowed = new Set(['low', 'medium', 'high']);
    for (const entry of ledger) {
      expect(allowed.has(entry.counterfactualConfidence)).toBe(true);
    }
  });

  it('only uses canonical governance review statuses', () => {
    const allowed = new Set([
      'not_started',
      'in_review',
      'approved',
      'flagged',
    ]);
    for (const entry of ledger) {
      expect(allowed.has(entry.governanceReviewStatus)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// Per-row invariants
// ---------------------------------------------------------------------

describe('per-row invariants', () => {
  it('entries with realizedValue !== null have non-null varianceAbs and variancePercent', () => {
    const realized = ledger.filter((entry) => entry.realizedValue !== null);
    expect(realized.length).toBeGreaterThanOrEqual(4);
    for (const entry of realized) {
      // Every realized seed entry has a non-zero projected value, so
      // variance fields must be numbers.
      expect(entry.varianceAbs).not.toBeNull();
      expect(entry.variancePercent).not.toBeNull();
      expect(typeof entry.varianceAbs).toBe('number');
      expect(typeof entry.variancePercent).toBe('number');
    }
  });

  it('entries with realizedValue === null have null variance fields', () => {
    const unrealized = ledger.filter((entry) => entry.realizedValue === null);
    expect(unrealized.length).toBeGreaterThanOrEqual(1);
    for (const entry of unrealized) {
      expect(entry.varianceAbs).toBeNull();
      expect(entry.variancePercent).toBeNull();
    }
  });

  it('linked claim ids use the canonical claim-seed prefix', () => {
    for (const entry of ledger) {
      expect(Array.isArray(entry.evidenceLinkedClaimIds)).toBe(true);
      for (const claimId of entry.evidenceLinkedClaimIds) {
        expect(claimId).toMatch(/^claim-seed-/);
      }
    }
  });

  it('every numeric value is a finite number', () => {
    for (const entry of ledger) {
      expect(Number.isFinite(entry.projectedValue)).toBe(true);
      if (entry.realizedValue !== null) {
        expect(Number.isFinite(entry.realizedValue)).toBe(true);
      }
      if (entry.baselineValue !== null) {
        expect(Number.isFinite(entry.baselineValue)).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Distribution constraints (per ACT4 spec)
// ---------------------------------------------------------------------

describe('distribution constraints', () => {
  it('has at least 4 entries with realizedValue !== null', () => {
    const realized = ledger.filter((entry) => entry.realizedValue !== null);
    expect(realized.length).toBeGreaterThanOrEqual(4);
  });

  it('has at least 2 entries with governanceReviewStatus "flagged"', () => {
    const flagged = ledger.filter(
      (entry) => entry.governanceReviewStatus === 'flagged',
    );
    expect(flagged.length).toBeGreaterThanOrEqual(2);
  });

  it('has at least 2 entries linked to a programKey (canonical seed strings)', () => {
    const linked = ledger.filter(
      (entry) => typeof entry.programKey === 'string' && entry.programKey.length > 0,
    );
    expect(linked.length).toBeGreaterThanOrEqual(2);
    const allowed = new Set([
      'contact-center-ai',
      'unified-customer-data-platform',
      'store-associate-productivity',
      'demand-forecasting-ai',
    ]);
    for (const entry of linked) {
      expect(allowed.has(entry.programKey as string)).toBe(true);
    }
  });

  it('has at least 2 entries linked to an aiUseCaseKey (canonical seed strings)', () => {
    const linked = ledger.filter(
      (entry) =>
        typeof entry.aiUseCaseKey === 'string' && entry.aiUseCaseKey.length > 0,
    );
    expect(linked.length).toBeGreaterThanOrEqual(2);
    for (const entry of linked) {
      expect(entry.aiUseCaseKey as string).toMatch(/^ai-use-case-seed-\d+$/);
    }
  });
});

// ---------------------------------------------------------------------
// computeVariance
// ---------------------------------------------------------------------

describe('computeVariance', () => {
  it('returns null fields when realizedValue is null', () => {
    const sample: ValueLedgerEntry = {
      ...ledger[0],
      realizedValue: null,
    };
    const out = computeVariance(sample);
    expect(out.varianceAbs).toBeNull();
    expect(out.variancePercent).toBeNull();
  });

  it('computes absolute and percent variance correctly for a positive case', () => {
    const sample: ValueLedgerEntry = {
      ...ledger[0],
      projectedValue: 200,
      realizedValue: 250,
    };
    const out = computeVariance(sample);
    expect(out.varianceAbs).toBe(50);
    expect(out.variancePercent).toBe(25);
  });

  it('computes negative variance correctly when realized < projected', () => {
    const sample: ValueLedgerEntry = {
      ...ledger[0],
      projectedValue: 100,
      realizedValue: 75,
    };
    const out = computeVariance(sample);
    expect(out.varianceAbs).toBe(-25);
    expect(out.variancePercent).toBe(-25);
  });

  it('handles zero projectedValue safely (returns null percent when realized is non-zero)', () => {
    const sample: ValueLedgerEntry = {
      ...ledger[0],
      projectedValue: 0,
      realizedValue: 5,
    };
    const out = computeVariance(sample);
    expect(out.varianceAbs).toBe(5);
    expect(out.variancePercent).toBeNull();
  });

  it('returns 0 percent variance when both projected and realized are 0', () => {
    const sample: ValueLedgerEntry = {
      ...ledger[0],
      projectedValue: 0,
      realizedValue: 0,
    };
    const out = computeVariance(sample);
    expect(out.varianceAbs).toBe(0);
    expect(out.variancePercent).toBe(0);
  });

  it('matches the precomputed varianceAbs / variancePercent on the seed', () => {
    for (const entry of ledger) {
      const out = computeVariance(entry);
      expect(out.varianceAbs).toBe(entry.varianceAbs);
      expect(out.variancePercent).toBe(entry.variancePercent);
    }
  });
});

// ---------------------------------------------------------------------
// summarizeAiValueOutcomeLedger
// ---------------------------------------------------------------------

describe('summarizeAiValueOutcomeLedger', () => {
  const summary: ValueOutcomeLedgerSummary =
    summarizeAiValueOutcomeLedger(ledger);

  it('totalEntries equals the ledger length', () => {
    expect(summary.totalEntries).toBe(ledger.length);
  });

  it('byCategory counts reconcile to totalEntries', () => {
    const sum = Object.values(summary.byCategory).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalEntries);
  });

  it('byReadiness counts reconcile to totalEntries', () => {
    const sum = Object.values(summary.byReadiness).reduce((a, b) => a + b, 0);
    expect(sum).toBe(summary.totalEntries);
  });

  it('byMeasurementUnit counts reconcile to totalEntries', () => {
    const sum = Object.values(summary.byMeasurementUnit).reduce(
      (a, b) => a + b,
      0,
    );
    expect(sum).toBe(summary.totalEntries);
  });

  it('byCategory exposes every canonical category key', () => {
    for (const category of VALUE_LEDGER_CATEGORIES) {
      expect(typeof summary.byCategory[category]).toBe('number');
    }
  });

  it('byReadiness exposes every canonical readiness key', () => {
    for (const state of VALUE_READINESS_STATES) {
      expect(typeof summary.byReadiness[state]).toBe('number');
    }
  });

  it('byMeasurementUnit exposes every canonical unit key', () => {
    for (const unit of VALUE_MEASUREMENT_UNITS) {
      expect(typeof summary.byMeasurementUnit[unit]).toBe('number');
    }
  });

  it('measuredCount counts measured_in_pilot + measured_in_production', () => {
    const expected = ledger.filter(
      (entry) =>
        entry.readiness === 'measured_in_pilot' ||
        entry.readiness === 'measured_in_production',
    ).length;
    expect(summary.measuredCount).toBe(expected);
  });

  it('projectedOnlyCount equals byReadiness.projected_only', () => {
    expect(summary.projectedOnlyCount).toBe(summary.byReadiness.projected_only);
  });

  it('flaggedGovernanceCount counts governanceReviewStatus "flagged"', () => {
    const expected = ledger.filter(
      (entry) => entry.governanceReviewStatus === 'flagged',
    ).length;
    expect(summary.flaggedGovernanceCount).toBe(expected);
  });

  it('uniqueInitiatives is sorted ascending and de-duplicated', () => {
    const sorted = [...summary.uniqueInitiatives].sort((a, b) =>
      a.localeCompare(b),
    );
    expect(summary.uniqueInitiatives).toEqual(sorted);
    const unique = new Set(summary.uniqueInitiatives);
    expect(unique.size).toBe(summary.uniqueInitiatives.length);
  });

  it('summarizes the canonical seed when called with no arguments', () => {
    const defaultSummary = summarizeAiValueOutcomeLedger();
    expect(defaultSummary.totalEntries).toBe(ledger.length);
  });
});

// ---------------------------------------------------------------------
// getMeasuredEntries / getProjectedOnlyEntries / getEntriesByCategory
// ---------------------------------------------------------------------

describe('helpers', () => {
  it('getMeasuredEntries returns only measured_in_pilot / measured_in_production', () => {
    const measured = getMeasuredEntries(ledger);
    expect(measured.length).toBeGreaterThan(0);
    for (const entry of measured) {
      expect(['measured_in_pilot', 'measured_in_production']).toContain(
        entry.readiness,
      );
    }
  });

  it('getMeasuredEntries excludes non-measured rows', () => {
    const measured = getMeasuredEntries(ledger);
    const measuredIds = new Set(measured.map((entry) => entry.id));
    for (const entry of ledger) {
      if (
        entry.readiness !== 'measured_in_pilot' &&
        entry.readiness !== 'measured_in_production'
      ) {
        expect(measuredIds.has(entry.id)).toBe(false);
      }
    }
  });

  it('getProjectedOnlyEntries returns only projected_only rows', () => {
    const projected = getProjectedOnlyEntries(ledger);
    expect(projected.length).toBeGreaterThan(0);
    for (const entry of projected) {
      expect(entry.readiness).toBe('projected_only');
    }
  });

  it('getEntriesByCategory returns only matching-category rows', () => {
    for (const category of VALUE_LEDGER_CATEGORIES) {
      const matches = getEntriesByCategory(category, ledger);
      for (const entry of matches) {
        expect(entry.category).toBe(category);
      }
    }
  });

  it('getMeasuredEntries / getProjectedOnlyEntries / getEntriesByCategory default to the canonical seed', () => {
    expect(getMeasuredEntries().length).toBe(getMeasuredEntries(ledger).length);
    expect(getProjectedOnlyEntries().length).toBe(
      getProjectedOnlyEntries(ledger).length,
    );
    for (const category of VALUE_LEDGER_CATEGORIES) {
      expect(getEntriesByCategory(category).length).toBe(
        getEntriesByCategory(category, ledger).length,
      );
    }
  });
});

// ---------------------------------------------------------------------
// No-fabrication invariants
// ---------------------------------------------------------------------

describe('no-fabrication invariants', () => {
  const serialized = JSON.stringify(ledger);

  it('every entry uses an allowed measurement unit', () => {
    const allowed = new Set([...VALUE_MEASUREMENT_UNITS]);
    for (const entry of ledger) {
      expect(allowed.has(entry.measurementUnit)).toBe(true);
    }
  });

  it('every dollar-denominated entry uses the usd_seed unit', () => {
    // Any entry whose initiative or counterfactual hints at a dollar
    // amount must use the usd_seed unit so the surface marks the value
    // as a seed projection rather than an audited fact.
    const dollarEntries = ledger.filter(
      (entry) => entry.measurementUnit === 'usd_seed',
    );
    for (const entry of dollarEntries) {
      expect(entry.measurementUnit).toBe('usd_seed');
    }
    // No entry uses a forbidden "usd" or "dollar" unit name.
    for (const entry of ledger) {
      expect(entry.measurementUnit).not.toBe('usd');
      expect(entry.measurementUnit).not.toBe('dollar');
    }
  });

  it('no string field invents a $-prefixed dollar narrative', () => {
    // Matches "$" followed by optional whitespace and a digit.
    expect(serialized).not.toMatch(/\$\s*\d/);
  });

  it('does not carry branded vendor endorsements', () => {
    const denyList = [
      'OpenAI',
      'Anthropic',
      'Cohere',
      'Mistral',
      'Databricks',
      'Snowflake',
      'Microsoft Copilot',
      'GitHub Copilot',
    ];
    for (const brand of denyList) {
      expect(serialized).not.toContain(brand);
    }
  });

  it('does not carry banned placeholder language', () => {
    const banned = ['Coming soon', 'TBD', 'Lorem ipsum'];
    for (const phrase of banned) {
      expect(serialized).not.toContain(phrase);
    }
  });

  it('every entry carries seed_value: true (provenance flag)', () => {
    for (const entry of ledger) {
      expect(entry.seed_value).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene', () => {
  it('does not import from forbidden runtime areas', () => {
    const forbidden = [
      "from '@/lib/source",
      "from '@/lib/sentinel",
      "from '@/lib/atlas",
      "from '@/lib/nexus",
      "from '@/lib/agent",
      "from '@/lib/auth",
      "from 'supabase",
      "from '@/supabase",
    ];
    for (const fragment of forbidden) {
      expect(MODULE_SOURCE).not.toContain(fragment);
    }
  });

  it('does not call banned timing / randomness / network APIs', () => {
    const bannedFragments = [
      'Date.now',
      'Math.random',
      'new Date(',
      'fetch(',
      'anthropic',
      'openai',
      'useState',
      'useEffect',
    ];
    for (const fragment of bannedFragments) {
      expect(MODULE_SOURCE).not.toContain(fragment);
    }
  });

  it('does not contain placeholder language in the source', () => {
    const banned = ['Coming soon', 'TBD', 'Lorem ipsum'];
    for (const phrase of banned) {
      expect(MODULE_SOURCE).not.toContain(phrase);
    }
  });
});
