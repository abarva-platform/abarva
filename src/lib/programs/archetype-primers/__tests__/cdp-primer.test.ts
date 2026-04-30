// PR-OV2-3a: CDP archetype primer tests.
//
// Locks the contract from docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md
// Section D.0.6 (next-phase primer rendered at approval) and D.1.3
// (CDP-parameterized P1 SMEs / templates / workshops / evidence). The
// referential-integrity checks (template→DoD ids, workshop→template ids)
// are what keep the primer from drifting into placeholder content.

import {
  CDP_ACTIVATION_PRIMER,
  getArchetypePrimer,
} from '../index';
import type { ArchetypePrimer } from '../index';
import { P1_DISCOVERY } from '../../phase-packs/P1_discovery';

const P1_DOD_IDS = new Set(P1_DISCOVERY.definitionOfDone.map((d) => d.id));

describe('CDP_ACTIVATION_PRIMER · OV2-3a contract', () => {
  it('satisfies the ArchetypePrimer type and exposes a non-empty p1OutcomeStatement', () => {
    const primer: ArchetypePrimer = CDP_ACTIVATION_PRIMER;
    expect(primer.patternId).toBe('PAT-PRG-CDP-001');
    expect(primer.displayName).toBe('CDP Activation');
    expect(typeof primer.p1OutcomeStatement).toBe('string');
    expect(primer.p1OutcomeStatement.length).toBeGreaterThan(80);
  });

  it('SMEs include at least Data Engineer + Privacy Counsel + MarTech Architect', () => {
    const roles = CDP_ACTIVATION_PRIMER.smes.map((s) => s.role.toLowerCase());
    expect(roles.some((r) => r.includes('data engineer'))).toBe(true);
    expect(roles.some((r) => r.includes('privacy counsel'))).toBe(true);
    expect(roles.some((r) => r.includes('martech architect'))).toBe(true);
  });

  it('exposes at least 4 templates, each with non-empty satisfiesEvidenceItems', () => {
    expect(CDP_ACTIVATION_PRIMER.templates.length).toBeGreaterThanOrEqual(4);
    for (const t of CDP_ACTIVATION_PRIMER.templates) {
      expect(t.id.length).toBeGreaterThan(0);
      expect(t.title.length).toBeGreaterThan(0);
      expect(Array.isArray(t.satisfiesEvidenceItems)).toBe(true);
      expect(t.satisfiesEvidenceItems.length).toBeGreaterThan(0);
    }
  });

  it('every template.satisfiesEvidenceItems id exists on the P1 phase pack DoD', () => {
    for (const t of CDP_ACTIVATION_PRIMER.templates) {
      for (const evidenceId of t.satisfiesEvidenceItems) {
        expect(P1_DOD_IDS.has(evidenceId)).toBe(true);
      }
    }
  });

  it('exposes at least 3 workshops, each with attendees and at least one usesTemplates ref', () => {
    expect(CDP_ACTIVATION_PRIMER.workshops.length).toBeGreaterThanOrEqual(3);
    for (const w of CDP_ACTIVATION_PRIMER.workshops) {
      expect(w.attendees.length).toBeGreaterThan(0);
      expect(w.usesTemplates.length).toBeGreaterThan(0);
      expect(w.durationHours).toBeGreaterThan(0);
    }
  });

  it('every workshop usesTemplates id resolves against the primer’s own templates', () => {
    const templateIds = new Set(CDP_ACTIVATION_PRIMER.templates.map((t) => t.id));
    for (const w of CDP_ACTIVATION_PRIMER.workshops) {
      for (const tid of w.usesTemplates) {
        expect(templateIds.has(tid)).toBe(true);
      }
    }
  });

  it('exposes at least 4 data assets, each with valid format and neededAt', () => {
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
    expect(CDP_ACTIVATION_PRIMER.dataAssets.length).toBeGreaterThanOrEqual(4);
    for (const d of CDP_ACTIVATION_PRIMER.dataAssets) {
      expect(validFormats.has(d.format)).toBe(true);
      expect(validWindows.has(d.neededAt)).toBe(true);
    }
  });

  it('prepChecklist has at least 4 items, each with a rationale', () => {
    expect(CDP_ACTIVATION_PRIMER.prepChecklist.length).toBeGreaterThanOrEqual(4);
    for (const item of CDP_ACTIVATION_PRIMER.prepChecklist) {
      expect(item.id.length).toBeGreaterThan(0);
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.rationale.length).toBeGreaterThan(0);
    }
  });

  it('getArchetypePrimer("PAT-PRG-CDP-001") returns the CDP primer', () => {
    const found = getArchetypePrimer('PAT-PRG-CDP-001');
    expect(found).not.toBeNull();
    expect(found?.patternId).toBe('PAT-PRG-CDP-001');
    expect(found).toBe(CDP_ACTIVATION_PRIMER);
  });

  it('getArchetypePrimer("PAT-PRG-UNKNOWN") returns null', () => {
    expect(getArchetypePrimer('PAT-PRG-UNKNOWN')).toBeNull();
  });
});
