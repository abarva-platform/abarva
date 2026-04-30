// PR-OV2-3a-FORECAST: Demand Forecasting archetype primer tests.
//
// Locks the contract from docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md
// Sections D.0.3 / D.1.3 / D.1.8 Scenario D (Apex Demand Forecasting). The
// referential-integrity checks (template -> P1 DoD ids, workshop ->
// template ids, workshop -> primer SME roles) are what keep the primer from
// drifting into placeholder content.

import {
  DEMAND_FORECASTING_PRIMER,
  getArchetypePrimer,
} from '../index';
import type { ArchetypePrimer } from '../index';
import { P1_DISCOVERY } from '../../phase-packs/P1_discovery';

const P1_DOD_IDS = new Set(P1_DISCOVERY.definitionOfDone.map((d) => d.id));

describe('DEMAND_FORECASTING_PRIMER · OV2-3a-FORECAST contract', () => {
  it('satisfies the ArchetypePrimer type and exposes a non-empty p1OutcomeStatement', () => {
    const primer: ArchetypePrimer = DEMAND_FORECASTING_PRIMER;
    expect(primer.patternId).toBe('PAT-PRG-DATA-FAB-001');
    expect(primer.displayName).toBe('Demand Forecasting');
    expect(typeof primer.p1OutcomeStatement).toBe('string');
    expect(primer.p1OutcomeStatement.length).toBeGreaterThan(80);
  });

  it('p1OutcomeStatement names the three Scenario D artifacts: granularity, baseline distribution+bias, S&OP cadence', () => {
    const text = DEMAND_FORECASTING_PRIMER.p1OutcomeStatement.toLowerCase();
    // Granularity decision must be explicit.
    expect(text).toMatch(/granularit/);
    // Baseline must reference distribution and/or bias structure (not just MAPE).
    expect(text).toMatch(/distribution/);
    expect(text).toMatch(/bias/);
    // S&OP cadence inventory must be named.
    expect(text).toMatch(/s&op|sop/);
    // P1 explicitly excludes model-vs-vendor evaluation (that belongs in P2).
    expect(text).toMatch(/p2/);
  });

  it('SMEs include Demand Planner + Supply Chain VP + S&OP Lead (gating roles)', () => {
    const roles = DEMAND_FORECASTING_PRIMER.smes.map((s) => s.role.toLowerCase());
    expect(roles.some((r) => r.includes('demand planner'))).toBe(true);
    expect(roles.some((r) => r.includes('supply chain vp'))).toBe(true);
    expect(roles.some((r) => r.includes('s&op'))).toBe(true);
    // Pilot-grade depth check: at least 6 SMEs spanning kickoff -> synthesis-prep.
    expect(DEMAND_FORECASTING_PRIMER.smes.length).toBeGreaterThanOrEqual(6);
    const windows = new Set(DEMAND_FORECASTING_PRIMER.smes.map((s) => s.neededAt));
    expect(windows.has('kickoff')).toBe(true);
    expect(windows.has('data-discovery')).toBe(true);
    expect(windows.has('baseline')).toBe(true);
    expect(windows.has('synthesis-prep')).toBe(true);
  });

  it('exposes at least 5 templates, each with non-empty satisfiesEvidenceItems', () => {
    expect(DEMAND_FORECASTING_PRIMER.templates.length).toBeGreaterThanOrEqual(5);
    for (const t of DEMAND_FORECASTING_PRIMER.templates) {
      expect(t.id.length).toBeGreaterThan(0);
      expect(t.title.length).toBeGreaterThan(0);
      expect(Array.isArray(t.satisfiesEvidenceItems)).toBe(true);
      expect(t.satisfiesEvidenceItems.length).toBeGreaterThan(0);
    }
  });

  it('every template.satisfiesEvidenceItems id exists on the P1 phase pack DoD', () => {
    for (const t of DEMAND_FORECASTING_PRIMER.templates) {
      for (const evidenceId of t.satisfiesEvidenceItems) {
        expect(P1_DOD_IDS.has(evidenceId)).toBe(true);
      }
    }
  });

  it('exposes 3 workshops (Day 1 / Day 2 / Day 3) with attendees + usesTemplates', () => {
    expect(DEMAND_FORECASTING_PRIMER.workshops.length).toBeGreaterThanOrEqual(3);
    for (const w of DEMAND_FORECASTING_PRIMER.workshops) {
      expect(w.attendees.length).toBeGreaterThan(0);
      expect(w.usesTemplates.length).toBeGreaterThan(0);
      expect(w.durationHours).toBeGreaterThan(0);
    }
    // Day 1 must be the granularity-decision workshop.
    const day1 = DEMAND_FORECASTING_PRIMER.workshops.find((w) =>
      w.id.includes('granularity'),
    );
    expect(day1).toBeDefined();
    // Day 2 must surface bias / baseline analysis explicitly.
    const day2 = DEMAND_FORECASTING_PRIMER.workshops.find((w) =>
      w.id.includes('baseline') || w.id.includes('bias'),
    );
    expect(day2).toBeDefined();
    // Day 3 must address S&OP consumption.
    const day3 = DEMAND_FORECASTING_PRIMER.workshops.find((w) =>
      w.id.includes('sop') || w.id.toLowerCase().includes('consumption'),
    );
    expect(day3).toBeDefined();
  });

  it('every workshop usesTemplates id resolves against the primer’s own templates', () => {
    const templateIds = new Set(
      DEMAND_FORECASTING_PRIMER.templates.map((t) => t.id),
    );
    for (const w of DEMAND_FORECASTING_PRIMER.workshops) {
      for (const tid of w.usesTemplates) {
        expect(templateIds.has(tid)).toBe(true);
      }
    }
  });

  it('every workshop attendee references a role declared on the primer’s SME list', () => {
    const smeRoles = new Set(
      DEMAND_FORECASTING_PRIMER.smes.map((s) => s.role),
    );
    for (const w of DEMAND_FORECASTING_PRIMER.workshops) {
      for (const a of w.attendees) {
        expect(smeRoles.has(a)).toBe(true);
      }
    }
  });

  it('exposes at least 5 data assets, each with valid format and neededAt', () => {
    const validFormats = new Set([
      'CSV',
      'spreadsheet',
      'PDF',
      'text-summary',
      'structured-export',
    ]);
    const validWindows = new Set([
      'kickoff',
      'data-discovery',
      'baseline',
      'synthesis-prep',
    ]);
    expect(DEMAND_FORECASTING_PRIMER.dataAssets.length).toBeGreaterThanOrEqual(5);
    for (const d of DEMAND_FORECASTING_PRIMER.dataAssets) {
      expect(d.id.length).toBeGreaterThan(0);
      expect(d.label.length).toBeGreaterThan(0);
      expect(d.rationale.length).toBeGreaterThan(0);
      expect(validFormats.has(d.format)).toBe(true);
      expect(validWindows.has(d.neededAt)).toBe(true);
    }
  });

  it('prepChecklist has at least 4 items, each with a non-empty rationale', () => {
    expect(DEMAND_FORECASTING_PRIMER.prepChecklist.length).toBeGreaterThanOrEqual(4);
    for (const item of DEMAND_FORECASTING_PRIMER.prepChecklist) {
      expect(item.id.length).toBeGreaterThan(0);
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.rationale.length).toBeGreaterThan(0);
    }
  });

  it('getArchetypePrimer("PAT-PRG-DATA-FAB-001") returns the demand-forecasting primer', () => {
    const found = getArchetypePrimer('PAT-PRG-DATA-FAB-001');
    expect(found).not.toBeNull();
    expect(found?.patternId).toBe('PAT-PRG-DATA-FAB-001');
    expect(found).toBe(DEMAND_FORECASTING_PRIMER);
  });

  it('getArchetypePrimer("PAT-PRG-UNKNOWN-001") returns null', () => {
    expect(getArchetypePrimer('PAT-PRG-UNKNOWN-001')).toBeNull();
  });
});
