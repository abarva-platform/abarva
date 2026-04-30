// PR-OV2-3a-CCAI: Contact Center AI archetype primer tests.
//
// Locks the contract from docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md
// Sections D.0.3 (parameterized program-specific brief), D.1.3 (CC-AI
// parameterized P1 SMEs / templates / workshops / evidence), and D.1.8
// Scenario B (worked example). Referential-integrity checks (template→DoD
// ids, workshop→template ids) keep the primer from drifting into placeholder
// content.

import {
  CONTACT_CENTER_AI_PRIMER,
  getArchetypePrimer,
} from '../index';
import type { ArchetypePrimer } from '../index';
import { P1_DISCOVERY } from '../../phase-packs/P1_discovery';

const P1_DOD_IDS = new Set(P1_DISCOVERY.definitionOfDone.map((d) => d.id));

describe('CONTACT_CENTER_AI_PRIMER · OV2-3a-CCAI contract', () => {
  it('satisfies the ArchetypePrimer type and exposes a non-empty p1OutcomeStatement', () => {
    const primer: ArchetypePrimer = CONTACT_CENTER_AI_PRIMER;
    expect(primer.patternId).toBe('PAT-PRG-CC-AI-001');
    expect(primer.displayName).toBe('Contact Center AI');
    expect(typeof primer.p1OutcomeStatement).toBe('string');
    expect(primer.p1OutcomeStatement.length).toBeGreaterThan(80);
  });

  it('SMEs include WFM Lead + CX Operations + Privacy Counsel (the three must-have roles)', () => {
    const roles = CONTACT_CENTER_AI_PRIMER.smes.map((s) => s.role.toLowerCase());
    expect(roles.some((r) => r.includes('wfm'))).toBe(true);
    expect(roles.some((r) => r.includes('cx operations'))).toBe(true);
    expect(roles.some((r) => r.includes('privacy counsel'))).toBe(true);
  });

  it('exposes at least 6 SMEs, each with a rationale and valid neededAt window', () => {
    const validWindows = new Set([
      'kickoff',
      'data-discovery',
      'baseline',
      'synthesis-prep',
    ]);
    expect(CONTACT_CENTER_AI_PRIMER.smes.length).toBeGreaterThanOrEqual(6);
    for (const sme of CONTACT_CENTER_AI_PRIMER.smes) {
      expect(sme.role.length).toBeGreaterThan(0);
      expect(sme.rationale.length).toBeGreaterThan(0);
      expect(validWindows.has(sme.neededAt)).toBe(true);
    }
  });

  it('exposes at least 5 templates, each with non-empty satisfiesEvidenceItems', () => {
    expect(CONTACT_CENTER_AI_PRIMER.templates.length).toBeGreaterThanOrEqual(5);
    for (const t of CONTACT_CENTER_AI_PRIMER.templates) {
      expect(t.id.length).toBeGreaterThan(0);
      expect(t.title.length).toBeGreaterThan(0);
      expect(Array.isArray(t.satisfiesEvidenceItems)).toBe(true);
      expect(t.satisfiesEvidenceItems.length).toBeGreaterThan(0);
    }
  });

  it('every template.satisfiesEvidenceItems id exists on the P1 phase pack DoD', () => {
    for (const t of CONTACT_CENTER_AI_PRIMER.templates) {
      for (const evidenceId of t.satisfiesEvidenceItems) {
        expect(P1_DOD_IDS.has(evidenceId)).toBe(true);
      }
    }
  });

  it('exposes at least 3 workshops, each with attendees and at least one usesTemplates ref', () => {
    expect(CONTACT_CENTER_AI_PRIMER.workshops.length).toBeGreaterThanOrEqual(3);
    for (const w of CONTACT_CENTER_AI_PRIMER.workshops) {
      expect(w.attendees.length).toBeGreaterThan(0);
      expect(w.usesTemplates.length).toBeGreaterThan(0);
      expect(w.durationHours).toBeGreaterThan(0);
    }
  });

  it('every workshop usesTemplates id resolves against the primer’s own templates', () => {
    const templateIds = new Set(
      CONTACT_CENTER_AI_PRIMER.templates.map((t) => t.id),
    );
    for (const w of CONTACT_CENTER_AI_PRIMER.workshops) {
      for (const tid of w.usesTemplates) {
        expect(templateIds.has(tid)).toBe(true);
      }
    }
  });

  it('every workshop attendee resolves against a role declared in this primer’s smes', () => {
    const smeRoles = new Set(CONTACT_CENTER_AI_PRIMER.smes.map((s) => s.role));
    for (const w of CONTACT_CENTER_AI_PRIMER.workshops) {
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
    expect(CONTACT_CENTER_AI_PRIMER.dataAssets.length).toBeGreaterThanOrEqual(5);
    for (const d of CONTACT_CENTER_AI_PRIMER.dataAssets) {
      expect(validFormats.has(d.format)).toBe(true);
      expect(validWindows.has(d.neededAt)).toBe(true);
    }
  });

  it('prepChecklist has at least 4 items, each with a rationale', () => {
    expect(CONTACT_CENTER_AI_PRIMER.prepChecklist.length).toBeGreaterThanOrEqual(4);
    for (const item of CONTACT_CENTER_AI_PRIMER.prepChecklist) {
      expect(item.id.length).toBeGreaterThan(0);
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.rationale.length).toBeGreaterThan(0);
    }
  });

  it('getArchetypePrimer("PAT-PRG-CC-AI-001") returns the CC-AI primer', () => {
    const found = getArchetypePrimer('PAT-PRG-CC-AI-001');
    expect(found).not.toBeNull();
    expect(found?.patternId).toBe('PAT-PRG-CC-AI-001');
    expect(found).toBe(CONTACT_CENTER_AI_PRIMER);
  });

  it('getArchetypePrimer("PAT-PRG-UNKNOWN-001") returns null', () => {
    expect(getArchetypePrimer('PAT-PRG-UNKNOWN-001')).toBeNull();
  });
});
