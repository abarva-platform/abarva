// PR-OV2-3a-COPILOT: M365 Copilot archetype primer tests.
//
// Locks the contract from docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md
// Sections D.0.3 (parameterized program-specific brief) and D.1.3 (Copilot
// parameterized P1 SMEs / templates / workshops / evidence). Referential-
// integrity checks (template→DoD ids, workshop→template ids, workshop→SME
// roles) keep the primer from drifting into placeholder content.

import {
  M365_COPILOT_PRIMER,
  getArchetypePrimer,
} from '../index';
import type { ArchetypePrimer } from '../index';
import { P1_DISCOVERY } from '../../phase-packs/P1_discovery';

const P1_DOD_IDS = new Set(P1_DISCOVERY.definitionOfDone.map((d) => d.id));

describe('M365_COPILOT_PRIMER · OV2-3a-COPILOT contract', () => {
  it('satisfies the ArchetypePrimer type and exposes a non-empty p1OutcomeStatement', () => {
    const primer: ArchetypePrimer = M365_COPILOT_PRIMER;
    expect(primer.patternId).toBe('PAT-PRG-COPILOT-001');
    expect(primer.displayName).toBe('M365 Copilot Deployment');
    expect(typeof primer.p1OutcomeStatement).toBe('string');
    expect(primer.p1OutcomeStatement.length).toBeGreaterThan(80);
  });

  it('SMEs include Champions Network Lead + SharePoint Owner + Privacy Counsel (failure-mode-grounded roles)', () => {
    const roles = M365_COPILOT_PRIMER.smes.map((s) => s.role.toLowerCase());
    expect(roles.some((r) => r.includes('champions network'))).toBe(true);
    expect(roles.some((r) => r.includes('sharepoint'))).toBe(true);
    expect(roles.some((r) => r.includes('privacy counsel'))).toBe(true);
  });

  it('exposes at least 6 SMEs, each with a rationale and valid neededAt window', () => {
    const validWindows = new Set([
      'kickoff',
      'data-discovery',
      'baseline',
      'synthesis-prep',
    ]);
    expect(M365_COPILOT_PRIMER.smes.length).toBeGreaterThanOrEqual(6);
    for (const sme of M365_COPILOT_PRIMER.smes) {
      expect(sme.role.length).toBeGreaterThan(0);
      expect(sme.rationale.length).toBeGreaterThan(0);
      expect(validWindows.has(sme.neededAt)).toBe(true);
    }
  });

  it('exposes at least 5 templates, each with non-empty satisfiesEvidenceItems', () => {
    expect(M365_COPILOT_PRIMER.templates.length).toBeGreaterThanOrEqual(5);
    for (const t of M365_COPILOT_PRIMER.templates) {
      expect(t.id.length).toBeGreaterThan(0);
      expect(t.title.length).toBeGreaterThan(0);
      expect(Array.isArray(t.satisfiesEvidenceItems)).toBe(true);
      expect(t.satisfiesEvidenceItems.length).toBeGreaterThan(0);
    }
  });

  it('every template.satisfiesEvidenceItems id exists on the P1 phase pack DoD', () => {
    for (const t of M365_COPILOT_PRIMER.templates) {
      for (const evidenceId of t.satisfiesEvidenceItems) {
        expect(P1_DOD_IDS.has(evidenceId)).toBe(true);
      }
    }
  });

  it('exposes at least 3 workshops, each with attendees and at least one usesTemplates ref', () => {
    expect(M365_COPILOT_PRIMER.workshops.length).toBeGreaterThanOrEqual(3);
    for (const w of M365_COPILOT_PRIMER.workshops) {
      expect(w.attendees.length).toBeGreaterThan(0);
      expect(w.usesTemplates.length).toBeGreaterThan(0);
      expect(w.durationHours).toBeGreaterThan(0);
    }
  });

  it('every workshop usesTemplates id resolves against the primer’s own templates', () => {
    const templateIds = new Set(M365_COPILOT_PRIMER.templates.map((t) => t.id));
    for (const w of M365_COPILOT_PRIMER.workshops) {
      for (const tid of w.usesTemplates) {
        expect(templateIds.has(tid)).toBe(true);
      }
    }
  });

  it('every workshop attendee resolves against a role declared in this primer’s smes', () => {
    const smeRoles = new Set(M365_COPILOT_PRIMER.smes.map((s) => s.role));
    for (const w of M365_COPILOT_PRIMER.workshops) {
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
    expect(M365_COPILOT_PRIMER.dataAssets.length).toBeGreaterThanOrEqual(5);
    for (const d of M365_COPILOT_PRIMER.dataAssets) {
      expect(validFormats.has(d.format)).toBe(true);
      expect(validWindows.has(d.neededAt)).toBe(true);
    }
  });

  it('prepChecklist has at least 5 items, each with a rationale', () => {
    expect(M365_COPILOT_PRIMER.prepChecklist.length).toBeGreaterThanOrEqual(5);
    for (const item of M365_COPILOT_PRIMER.prepChecklist) {
      expect(item.id.length).toBeGreaterThan(0);
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.rationale.length).toBeGreaterThan(0);
    }
  });

  it('getArchetypePrimer("PAT-PRG-COPILOT-001") returns the Copilot primer', () => {
    const found = getArchetypePrimer('PAT-PRG-COPILOT-001');
    expect(found).not.toBeNull();
    expect(found?.patternId).toBe('PAT-PRG-COPILOT-001');
    expect(found).toBe(M365_COPILOT_PRIMER);
  });

  it('getArchetypePrimer("PAT-PRG-UNKNOWN-001") returns null', () => {
    expect(getArchetypePrimer('PAT-PRG-UNKNOWN-001')).toBeNull();
  });
});
