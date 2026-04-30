// PR-OV2-3a-AICODING: AI Coding archetype primer tests.
//
// Locks the contract from docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md
// Sections D.0.3 / D.1.3 (parameterized program-specific tables) and D.0.6
// (next-phase primer rendered at approval). The referential-integrity checks
// (template -> P1 DoD ids, workshop -> template ids, workshop -> primer SME
// roles) are what keep the primer from drifting into placeholder content.

import {
  AI_CODING_PRIMER,
  getArchetypePrimer,
} from '../index';
import type { ArchetypePrimer } from '../index';
import { P1_DISCOVERY } from '../../phase-packs/P1_discovery';

const P1_DOD_IDS = new Set(P1_DISCOVERY.definitionOfDone.map((d) => d.id));

describe('AI_CODING_PRIMER · OV2-3a-AICODING contract', () => {
  it('satisfies the ArchetypePrimer type and exposes a non-empty p1OutcomeStatement', () => {
    const primer: ArchetypePrimer = AI_CODING_PRIMER;
    expect(primer.patternId).toBe('PAT-PRG-AI-CODING-001');
    expect(primer.displayName).toBe('AI Coding Productivity');
    expect(typeof primer.p1OutcomeStatement).toBe('string');
    expect(primer.p1OutcomeStatement.length).toBeGreaterThan(80);
  });

  it('p1OutcomeStatement names the four AI Coding artifacts: cohort, baseline, indexing audit, dissenter', () => {
    const text = AI_CODING_PRIMER.p1OutcomeStatement.toLowerCase();
    // First-cohort definition (one function or repo set, not "all engineers").
    expect(text).toMatch(/cohort/);
    // PR-cycle-time + acceptance-rate baseline.
    expect(text).toMatch(/pr.?cycle|cycle.?time/);
    expect(text).toMatch(/acceptance/);
    // Repo-indexing audit + IP/legal posture.
    expect(text).toMatch(/index/);
    expect(text).toMatch(/copyleft|ip|legal|license/);
    // Dissenter must be named explicitly.
    expect(text).toMatch(/dissenter/);
    // P1 explicitly excludes vendor evaluation (that belongs in P2).
    expect(text).toMatch(/p2/);
  });

  it('SMEs include DevEx Lead + Legal/IP Counsel + Repo Architect (gating roles)', () => {
    const roles = AI_CODING_PRIMER.smes.map((s) => s.role.toLowerCase());
    expect(roles.some((r) => r.includes('devex') || r.includes('developer productivity'))).toBe(true);
    expect(roles.some((r) => r.includes('legal') || r.includes('ip counsel'))).toBe(true);
    expect(roles.some((r) => r.includes('repo') || r.includes('source control'))).toBe(true);
    // Pilot-grade depth check: at least 6 SMEs spanning kickoff -> synthesis-prep.
    expect(AI_CODING_PRIMER.smes.length).toBeGreaterThanOrEqual(6);
    const windows = new Set(AI_CODING_PRIMER.smes.map((s) => s.neededAt));
    expect(windows.has('kickoff')).toBe(true);
    expect(windows.has('data-discovery')).toBe(true);
    expect(windows.has('baseline')).toBe(true);
    expect(windows.has('synthesis-prep')).toBe(true);
  });

  it('exposes at least 5 templates, each with non-empty satisfiesEvidenceItems', () => {
    expect(AI_CODING_PRIMER.templates.length).toBeGreaterThanOrEqual(5);
    for (const t of AI_CODING_PRIMER.templates) {
      expect(t.id.length).toBeGreaterThan(0);
      expect(t.title.length).toBeGreaterThan(0);
      expect(Array.isArray(t.satisfiesEvidenceItems)).toBe(true);
      expect(t.satisfiesEvidenceItems.length).toBeGreaterThan(0);
    }
  });

  it('every template.satisfiesEvidenceItems id exists on the P1 phase pack DoD', () => {
    for (const t of AI_CODING_PRIMER.templates) {
      for (const evidenceId of t.satisfiesEvidenceItems) {
        expect(P1_DOD_IDS.has(evidenceId)).toBe(true);
      }
    }
  });

  it('exposes 3 workshops (Day 1 / Day 2 / Day 3) with attendees + usesTemplates', () => {
    expect(AI_CODING_PRIMER.workshops.length).toBeGreaterThanOrEqual(3);
    for (const w of AI_CODING_PRIMER.workshops) {
      expect(w.attendees.length).toBeGreaterThan(0);
      expect(w.usesTemplates.length).toBeGreaterThan(0);
      expect(w.durationHours).toBeGreaterThan(0);
    }
    // Day 1 must be the first-cohort + workflow-inventory workshop.
    const day1 = AI_CODING_PRIMER.workshops.find((w) =>
      w.id.includes('first-cohort') || w.id.includes('workflow-inventory'),
    );
    expect(day1).toBeDefined();
    // Day 2 must surface repo-indexing audit + baseline.
    const day2 = AI_CODING_PRIMER.workshops.find((w) =>
      w.id.includes('indexing') || w.id.includes('baseline'),
    );
    expect(day2).toBeDefined();
    // Day 3 must address dissenter + readiness validation.
    const day3 = AI_CODING_PRIMER.workshops.find((w) =>
      w.id.includes('dissenter') || w.id.includes('readiness'),
    );
    expect(day3).toBeDefined();
  });

  it('every workshop usesTemplates id resolves against the primer’s own templates', () => {
    const templateIds = new Set(AI_CODING_PRIMER.templates.map((t) => t.id));
    for (const w of AI_CODING_PRIMER.workshops) {
      for (const tid of w.usesTemplates) {
        expect(templateIds.has(tid)).toBe(true);
      }
    }
  });

  it('every workshop attendee references a role declared on the primer’s SME list', () => {
    const smeRoles = new Set(AI_CODING_PRIMER.smes.map((s) => s.role));
    for (const w of AI_CODING_PRIMER.workshops) {
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
    expect(AI_CODING_PRIMER.dataAssets.length).toBeGreaterThanOrEqual(5);
    for (const d of AI_CODING_PRIMER.dataAssets) {
      expect(d.id.length).toBeGreaterThan(0);
      expect(d.label.length).toBeGreaterThan(0);
      expect(d.rationale.length).toBeGreaterThan(0);
      expect(validFormats.has(d.format)).toBe(true);
      expect(validWindows.has(d.neededAt)).toBe(true);
    }
  });

  it('prepChecklist has at least 5 items, each with a non-empty rationale', () => {
    expect(AI_CODING_PRIMER.prepChecklist.length).toBeGreaterThanOrEqual(5);
    for (const item of AI_CODING_PRIMER.prepChecklist) {
      expect(item.id.length).toBeGreaterThan(0);
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.rationale.length).toBeGreaterThan(0);
    }
  });

  it('getArchetypePrimer("PAT-PRG-AI-CODING-001") returns the AI Coding primer', () => {
    const found = getArchetypePrimer('PAT-PRG-AI-CODING-001');
    expect(found).not.toBeNull();
    expect(found?.patternId).toBe('PAT-PRG-AI-CODING-001');
    expect(found).toBe(AI_CODING_PRIMER);
  });

  it('getArchetypePrimer("PAT-PRG-UNKNOWN-001") returns null', () => {
    expect(getArchetypePrimer('PAT-PRG-UNKNOWN-001')).toBeNull();
  });
});
