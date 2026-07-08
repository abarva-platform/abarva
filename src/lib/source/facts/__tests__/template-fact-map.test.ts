// The structured-map intake contract must bind only to real facts, and must not
// drift from the canonical unit/entity of the fact it populates. These tests keep
// every template column honest against the catalog.

import {
  TEMPLATE_FACT_MAPS,
  listTemplateFactMaps,
  templateFactMapByCode,
} from '../template-fact-map';
import { factSpecByKey, isCatalogFactKey } from '../fact-catalog';

describe('template → fact map — catalog binding integrity', () => {
  it('every mapped column resolves to a catalog fact key', () => {
    const bad: string[] = [];
    for (const tpl of listTemplateFactMaps()) {
      for (const col of tpl.columns) {
        if (!isCatalogFactKey(col.factKey)) {
          bad.push(`${tpl.templateCode}/${col.header}:${col.factKey}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('column unit matches the catalog fact unit (no unit drift)', () => {
    for (const tpl of listTemplateFactMaps()) {
      for (const col of tpl.columns) {
        const spec = factSpecByKey(col.factKey);
        expect(spec).toBeDefined();
        expect(col.unit).toBe(spec!.unit);
      }
    }
  });

  it('column entityKind matches the catalog fact entityKind (no entity drift)', () => {
    for (const tpl of listTemplateFactMaps()) {
      for (const col of tpl.columns) {
        const spec = factSpecByKey(col.factKey);
        expect(spec).toBeDefined();
        expect(col.entityKind).toBe(spec!.entityKind);
      }
    }
  });

  it('no duplicate factKey within a single template', () => {
    for (const tpl of listTemplateFactMaps()) {
      const keys = tpl.columns.map((c) => c.factKey);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it('no duplicate header within a single template', () => {
    for (const tpl of listTemplateFactMaps()) {
      const headers = tpl.columns.map((c) => c.header);
      expect(new Set(headers).size).toBe(headers.length);
    }
  });
});

describe('template → fact map — worked examples present', () => {
  it('ships the app-inventory, volumetrics, and contract-terms templates', () => {
    expect(templateFactMapByCode('APP_INVENTORY_V1')).toBeDefined();
    expect(templateFactMapByCode('VOLUMETRICS_V1')).toBeDefined();
    expect(templateFactMapByCode('CONTRACT_TERMS_V1')).toBeDefined();
  });

  it('CONTRACT_TERMS_V1 binds the 8 vendor/contract facts the AMS levers need', () => {
    const tpl = templateFactMapByCode('CONTRACT_TERMS_V1')!;
    expect(tpl.rowEntity).toBe('vendor');
    expect(tpl.entityRefColumn).toBe('Vendor');
    expect(tpl.columns.map((c) => c.factKey).sort()).toEqual(
      [
        'at_risk_fee_pool',
        'committed_credit_pct',
        'credit_cap_pct',
        'overrun_cost_multiple',
        'overrun_probability',
        'retained_fte_delta',
        'term_years',
        'transition_fee',
      ].sort(),
    );
    // Every column's unit + entityKind must match the catalog (asserted globally
    // above too; pinned here so a CONTRACT_TERMS drift fails loudly by name).
    for (const col of tpl.columns) {
      const spec = factSpecByKey(col.factKey);
      expect(spec).toBeDefined();
      expect(col.unit).toBe(spec!.unit);
      expect(col.entityKind).toBe(spec!.entityKind);
    }
  });

  it('each template declares an entityRefColumn and at least one column', () => {
    for (const tpl of listTemplateFactMaps()) {
      expect(tpl.entityRefColumn.length).toBeGreaterThan(0);
      expect(tpl.columns.length).toBeGreaterThan(0);
    }
  });

  it('templateFactMapByCode returns undefined for unknown codes', () => {
    expect(templateFactMapByCode('NOPE')).toBeUndefined();
  });

  it('registry keys match each template code', () => {
    for (const [code, tpl] of Object.entries(TEMPLATE_FACT_MAPS)) {
      expect(tpl.templateCode).toBe(code);
    }
  });
});
