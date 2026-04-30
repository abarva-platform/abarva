// PR-OV2-3a-LOYALTY: Loyalty Program AI archetype primer tests.
//
// Locks the contract from docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md
// Sections D.0.3 (parameterized program-specific brief) and D.1.3 (Loyalty AI
// parameterized P1 SMEs / templates / workshops / evidence). Referential-
// integrity checks (template→DoD ids, workshop→template ids, workshop→SME
// roles) keep the primer from drifting into placeholder content.

import {
  LOYALTY_AI_PRIMER,
  getArchetypePrimer,
} from '../index';
import type { ArchetypePrimer } from '../index';
import { P1_DISCOVERY } from '../../phase-packs/P1_discovery';

const P1_DOD_IDS = new Set(P1_DISCOVERY.definitionOfDone.map((d) => d.id));

describe('LOYALTY_AI_PRIMER · OV2-3a-LOYALTY contract', () => {
  it('satisfies the ArchetypePrimer type and exposes a non-empty p1OutcomeStatement', () => {
    const primer: ArchetypePrimer = LOYALTY_AI_PRIMER;
    expect(primer.patternId).toBe('PAT-PRG-LOYALTY-001');
    expect(primer.displayName).toBe('Loyalty Program AI');
    expect(typeof primer.p1OutcomeStatement).toBe('string');
    expect(primer.p1OutcomeStatement.length).toBeGreaterThan(80);
  });

  it('SMEs include VP Loyalty + Privacy Counsel + Marketing Analytics / Incrementality Lead (failure-mode-grounded roles)', () => {
    const roles = LOYALTY_AI_PRIMER.smes.map((s) => s.role.toLowerCase());
    expect(roles.some((r) => r.includes('vp loyalty'))).toBe(true);
    expect(roles.some((r) => r.includes('privacy counsel'))).toBe(true);
    expect(roles.some((r) => r.includes('incrementality'))).toBe(true);
  });

  it('exposes at least 6 SMEs, each with a rationale and valid neededAt window', () => {
    const validWindows = new Set([
      'kickoff',
      'data-discovery',
      'baseline',
      'synthesis-prep',
    ]);
    expect(LOYALTY_AI_PRIMER.smes.length).toBeGreaterThanOrEqual(6);
    for (const sme of LOYALTY_AI_PRIMER.smes) {
      expect(sme.role.length).toBeGreaterThan(0);
      expect(sme.rationale.length).toBeGreaterThan(0);
      expect(validWindows.has(sme.neededAt)).toBe(true);
    }
  });

  it('exposes at least 5 templates, each with non-empty satisfiesEvidenceItems', () => {
    expect(LOYALTY_AI_PRIMER.templates.length).toBeGreaterThanOrEqual(5);
    for (const t of LOYALTY_AI_PRIMER.templates) {
      expect(t.id.length).toBeGreaterThan(0);
      expect(t.title.length).toBeGreaterThan(0);
      expect(Array.isArray(t.satisfiesEvidenceItems)).toBe(true);
      expect(t.satisfiesEvidenceItems.length).toBeGreaterThan(0);
    }
  });

  it('every template.satisfiesEvidenceItems id exists on the P1 phase pack DoD', () => {
    for (const t of LOYALTY_AI_PRIMER.templates) {
      for (const evidenceId of t.satisfiesEvidenceItems) {
        expect(P1_DOD_IDS.has(evidenceId)).toBe(true);
      }
    }
  });

  it('exposes at least 3 workshops, each with attendees and at least one usesTemplates ref', () => {
    expect(LOYALTY_AI_PRIMER.workshops.length).toBeGreaterThanOrEqual(3);
    for (const w of LOYALTY_AI_PRIMER.workshops) {
      expect(w.attendees.length).toBeGreaterThan(0);
      expect(w.usesTemplates.length).toBeGreaterThan(0);
      expect(w.durationHours).toBeGreaterThan(0);
    }
  });

  it('every workshop usesTemplates id resolves against the primer’s own templates', () => {
    const templateIds = new Set(LOYALTY_AI_PRIMER.templates.map((t) => t.id));
    for (const w of LOYALTY_AI_PRIMER.workshops) {
      for (const tid of w.usesTemplates) {
        expect(templateIds.has(tid)).toBe(true);
      }
    }
  });

  it('every workshop attendee resolves against a role declared in this primer’s smes', () => {
    const smeRoles = new Set(LOYALTY_AI_PRIMER.smes.map((s) => s.role));
    for (const w of LOYALTY_AI_PRIMER.workshops) {
      for (const attendee of w.attendees) {
        expect(smeRoles.has(attendee)).toBe(true);
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
    expect(LOYALTY_AI_PRIMER.dataAssets.length).toBeGreaterThanOrEqual(5);
    for (const d of LOYALTY_AI_PRIMER.dataAssets) {
      expect(validFormats.has(d.format)).toBe(true);
      expect(validWindows.has(d.neededAt)).toBe(true);
    }
  });

  it('prepChecklist has at least 5 items, each with a rationale', () => {
    expect(LOYALTY_AI_PRIMER.prepChecklist.length).toBeGreaterThanOrEqual(5);
    for (const item of LOYALTY_AI_PRIMER.prepChecklist) {
      expect(item.id.length).toBeGreaterThan(0);
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.rationale.length).toBeGreaterThan(0);
    }
  });

  it('getArchetypePrimer("PAT-PRG-LOYALTY-001") returns the Loyalty primer', () => {
    const found = getArchetypePrimer('PAT-PRG-LOYALTY-001');
    expect(found).not.toBeNull();
    expect(found?.patternId).toBe('PAT-PRG-LOYALTY-001');
    expect(found).toBe(LOYALTY_AI_PRIMER);
  });

  it('getArchetypePrimer("PAT-PRG-UNKNOWN-001") returns null', () => {
    expect(getArchetypePrimer('PAT-PRG-UNKNOWN-001')).toBeNull();
  });
});
