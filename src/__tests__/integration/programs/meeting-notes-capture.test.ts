// MW4 · Meeting Notes Capture Read Model tests.

import { readFileSync } from 'fs';
import { join } from 'path';

import {
  MEETING_NOTE_TYPES,
  buildMeetingNoteCaptureSeed,
  buildMeetingNoteCaptureTemplate,
  deriveDeliverableUpdatesFromMeetingNotes,
  deriveEvidenceCandidatesFromMeetingNotes,
  deriveProgramUpdatesFromMeetingNotes,
  summarizeMeetingNotesCapture,
  synthesizeMeetingNotes,
  type MeetingNoteCapture,
  type MeetingNoteType,
} from '@/lib/programs/meeting-notes-capture';

const CANONICAL_WORKSHOP_TYPES = [
  'current_state_discovery',
  'use_case_framing',
  'data_foundation_assessment',
  'value_framing',
  'governance_risk_review',
  'architecture_solution_design',
  'operating_model_alignment',
  'adoption_change_readiness',
  'executive_decision_review',
] as const;

const PROGRAM_KEYS = [
  'apex-contact-center-ai',
  'meridian-clinical-intelligence',
  'apex-demand-forecasting',
] as const;

// ---------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------

describe('buildMeetingNoteCaptureTemplate', () => {
  it('exposes templates for at least four canonical workshop types', () => {
    const sample = [
      'current_state_discovery',
      'use_case_framing',
      'data_foundation_assessment',
      'value_framing',
    ];
    expect(sample.length).toBeGreaterThanOrEqual(4);
    for (const ws of sample) {
      const tpl = buildMeetingNoteCaptureTemplate(ws);
      expect(tpl.workshopType).toBe(ws);
    }
  });

  it('returns a record with all arrays empty and observation empty', () => {
    for (const ws of CANONICAL_WORKSHOP_TYPES) {
      const tpl = buildMeetingNoteCaptureTemplate(ws);
      expect(tpl.observation).toBe('');
      expect(tpl.decisions).toEqual([]);
      expect(tpl.actionItems).toEqual([]);
      expect(tpl.risks).toEqual([]);
      expect(tpl.openQuestions).toEqual([]);
      expect(tpl.evidenceCandidates).toEqual([]);
      expect(tpl.stakeholderAlignment).toEqual([]);
    }
  });

  it('records the canonical workshop type so callers can tell which template to use', () => {
    for (const ws of CANONICAL_WORKSHOP_TYPES) {
      const tpl = buildMeetingNoteCaptureTemplate(ws);
      expect(tpl.workshopType).toBe(ws);
    }
  });

  it('always carries the honest disclaimer with the required substrings', () => {
    for (const ws of CANONICAL_WORKSHOP_TYPES) {
      const tpl = buildMeetingNoteCaptureTemplate(ws);
      expect(tpl.honestDisclaimer).toContain('deterministic seed');
      expect(tpl.honestDisclaimer).toContain('not wired');
    }
  });

  it('produces deterministic output across repeated calls', () => {
    for (const ws of CANONICAL_WORKSHOP_TYPES) {
      const a = buildMeetingNoteCaptureTemplate(ws);
      const b = buildMeetingNoteCaptureTemplate(ws);
      expect(a).toEqual(b);
    }
  });
});

// ---------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------

describe('buildMeetingNoteCaptureSeed', () => {
  it('returns at least two notes per (programKey, workshopType) pair', () => {
    for (const programKey of PROGRAM_KEYS) {
      for (const ws of CANONICAL_WORKSHOP_TYPES) {
        const seed = buildMeetingNoteCaptureSeed(programKey, ws);
        expect(seed.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('every seed note carries at least one decision, action, risk, question, and evidence candidate', () => {
    for (const programKey of PROGRAM_KEYS) {
      for (const ws of CANONICAL_WORKSHOP_TYPES) {
        const seed = buildMeetingNoteCaptureSeed(programKey, ws);
        for (const note of seed) {
          expect(note.decisions.length).toBeGreaterThanOrEqual(1);
          expect(note.actionItems.length).toBeGreaterThanOrEqual(1);
          expect(note.risks.length).toBeGreaterThanOrEqual(1);
          expect(note.openQuestions.length).toBeGreaterThanOrEqual(1);
          expect(note.evidenceCandidates.length).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });

  it('produces deterministic byte-equal output across repeated calls', () => {
    for (const programKey of PROGRAM_KEYS) {
      for (const ws of CANONICAL_WORKSHOP_TYPES) {
        const a = buildMeetingNoteCaptureSeed(programKey, ws);
        const b = buildMeetingNoteCaptureSeed(programKey, ws);
        expect(JSON.stringify(a)).toBe(JSON.stringify(b));
      }
    }
  });

  it('every id matches /^mtg-seed-[a-z0-9-]+$/', () => {
    const idRegex = /^mtg-seed-[a-z0-9-]+$/;
    for (const programKey of PROGRAM_KEYS) {
      for (const ws of CANONICAL_WORKSHOP_TYPES) {
        const seed = buildMeetingNoteCaptureSeed(programKey, ws);
        for (const note of seed) {
          expect(note.id).toMatch(idRegex);
          for (const d of note.decisions) expect(d.id).toMatch(idRegex);
          for (const a of note.actionItems) expect(a.id).toMatch(idRegex);
          for (const r of note.risks) expect(r.id).toMatch(idRegex);
          for (const q of note.openQuestions) expect(q.id).toMatch(idRegex);
          for (const e of note.evidenceCandidates) expect(e.id).toMatch(idRegex);
          for (const s of note.stakeholderAlignment)
            expect(s.id).toMatch(idRegex);
        }
      }
    }
  });

  it('records the canonical workshopType verbatim on every note', () => {
    for (const programKey of PROGRAM_KEYS) {
      for (const ws of CANONICAL_WORKSHOP_TYPES) {
        const seed = buildMeetingNoteCaptureSeed(programKey, ws);
        for (const note of seed) {
          expect(note.workshopType).toBe(ws);
          expect(note.programKey).toBe(programKey);
        }
      }
    }
  });

  it('uses only role labels, never real person names', () => {
    const realNamePattern =
      /\b(John|Jane|Mary|Mike|Anand|Steve|Alice|Bob|Charlie|David|Sarah|Linda|Robert)\b/i;
    for (const programKey of PROGRAM_KEYS) {
      for (const ws of CANONICAL_WORKSHOP_TYPES) {
        const seed = buildMeetingNoteCaptureSeed(programKey, ws);
        for (const note of seed) {
          expect(note.capturedBy).not.toMatch(realNamePattern);
          for (const d of note.decisions) {
            expect(d.decidedBy).not.toMatch(realNamePattern);
            expect(d.rationale).not.toMatch(realNamePattern);
            expect(d.decision).not.toMatch(realNamePattern);
          }
          for (const a of note.actionItems) {
            expect(a.ownerRole).not.toMatch(realNamePattern);
            expect(a.description).not.toMatch(realNamePattern);
          }
          for (const r of note.risks) {
            if (r.ownerRole) expect(r.ownerRole).not.toMatch(realNamePattern);
            expect(r.description).not.toMatch(realNamePattern);
          }
          for (const s of note.stakeholderAlignment) {
            for (const p of s.participants) {
              expect(p).not.toMatch(realNamePattern);
            }
          }
        }
      }
    }
  });

  it('contains no E-### literal tokens in any string field', () => {
    const fakeCitation = /\bE-\d+/;
    for (const programKey of PROGRAM_KEYS) {
      for (const ws of CANONICAL_WORKSHOP_TYPES) {
        const seed = buildMeetingNoteCaptureSeed(programKey, ws);
        const blob = JSON.stringify(seed);
        expect(blob).not.toMatch(fakeCitation);
      }
    }
  });

  it('every note carries the honest disclaimer with the required substrings', () => {
    for (const programKey of PROGRAM_KEYS) {
      for (const ws of CANONICAL_WORKSHOP_TYPES) {
        const seed = buildMeetingNoteCaptureSeed(programKey, ws);
        for (const note of seed) {
          expect(note.honestDisclaimer).toContain('deterministic seed');
          expect(note.honestDisclaimer).toContain('not wired');
        }
      }
    }
  });

  it('every note carries createdFrom = deterministic_seed', () => {
    for (const programKey of PROGRAM_KEYS) {
      for (const ws of CANONICAL_WORKSHOP_TYPES) {
        const seed = buildMeetingNoteCaptureSeed(programKey, ws);
        for (const note of seed) {
          expect(note.createdFrom).toBe('deterministic_seed');
        }
      }
    }
  });

  it('uses only valid noteType values from the canonical union', () => {
    for (const programKey of PROGRAM_KEYS) {
      for (const ws of CANONICAL_WORKSHOP_TYPES) {
        const seed = buildMeetingNoteCaptureSeed(programKey, ws);
        for (const note of seed) {
          expect(MEETING_NOTE_TYPES).toContain(note.noteType);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------

describe('summarizeMeetingNotesCapture', () => {
  it('reconciles totals across the seed', () => {
    const seed = buildMeetingNoteCaptureSeed(
      'apex-contact-center-ai',
      'use_case_framing',
    );
    const summary = summarizeMeetingNotesCapture(seed);
    expect(summary.totalNotes).toBe(seed.length);
    let decisions = 0;
    let actions = 0;
    let evidence = 0;
    const counts: Record<string, number> = {};
    for (const note of seed) {
      decisions += note.decisions.length;
      actions += note.actionItems.length;
      evidence += note.evidenceCandidates.length;
      counts[note.noteType] = (counts[note.noteType] ?? 0) + 1;
    }
    expect(summary.totalDecisions).toBe(decisions);
    expect(summary.totalActionItems).toBe(actions);
    expect(summary.totalEvidenceCandidates).toBe(evidence);
    for (const t of MEETING_NOTE_TYPES) {
      expect(summary.byType[t]).toBe(counts[t] ?? 0);
    }
  });

  it('returns zeroed totals for an empty list', () => {
    const summary = summarizeMeetingNotesCapture([]);
    expect(summary.totalNotes).toBe(0);
    expect(summary.totalDecisions).toBe(0);
    expect(summary.totalActionItems).toBe(0);
    expect(summary.totalEvidenceCandidates).toBe(0);
    for (const t of MEETING_NOTE_TYPES) {
      expect(summary.byType[t as MeetingNoteType]).toBe(0);
    }
  });
});

// ---------------------------------------------------------------------
// Derive program updates
// ---------------------------------------------------------------------

describe('deriveProgramUpdatesFromMeetingNotes', () => {
  it('returns no updates for templates (which have empty arrays)', () => {
    const tpl = buildMeetingNoteCaptureTemplate('current_state_discovery');
    expect(deriveProgramUpdatesFromMeetingNotes([tpl])).toEqual([]);
  });

  it('returns updates only for notes with content implying a program change', () => {
    const seed = buildMeetingNoteCaptureSeed(
      'apex-contact-center-ai',
      'governance_risk_review',
    );
    const updates = deriveProgramUpdatesFromMeetingNotes(seed);
    expect(updates.length).toBeGreaterThan(0);
    for (const u of updates) {
      expect([
        'phase_advance_request',
        'gate_readiness_change',
        'risk_register_update',
        'value_at_stake_update',
      ]).toContain(u.updateKind);
      expect(u.rationale.length).toBeGreaterThan(0);
    }
  });

  it('emits a phase_advance_request when a decision affects the program key', () => {
    const seed = buildMeetingNoteCaptureSeed(
      'meridian-clinical-intelligence',
      'value_framing',
    );
    const updates = deriveProgramUpdatesFromMeetingNotes(seed);
    expect(
      updates.some((u) => u.updateKind === 'phase_advance_request'),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------
// Derive deliverable updates
// ---------------------------------------------------------------------

describe('deriveDeliverableUpdatesFromMeetingNotes', () => {
  it('returns no updates for templates', () => {
    const tpl = buildMeetingNoteCaptureTemplate('use_case_framing');
    expect(deriveDeliverableUpdatesFromMeetingNotes([tpl])).toEqual([]);
  });

  it('returns updates only when notes mention deliverables', () => {
    const seed = buildMeetingNoteCaptureSeed(
      'apex-contact-center-ai',
      'use_case_framing',
    );
    const updates = deriveDeliverableUpdatesFromMeetingNotes(seed);
    expect(updates.length).toBeGreaterThan(0);
    for (const u of updates) {
      expect([
        'draft_input_added',
        'review_feedback',
        'approval_blocked',
        'rework_required',
      ]).toContain(u.updateKind);
      expect(u.deliverableKey.length).toBeGreaterThan(0);
    }
  });

  it('emits review_feedback when a decision references a deliverable key', () => {
    const seed = buildMeetingNoteCaptureSeed(
      'meridian-clinical-intelligence',
      'governance_risk_review',
    );
    const updates = deriveDeliverableUpdatesFromMeetingNotes(seed);
    expect(updates.some((u) => u.updateKind === 'review_feedback')).toBe(
      true,
    );
  });
});

// ---------------------------------------------------------------------
// Derive evidence candidates
// ---------------------------------------------------------------------

describe('deriveEvidenceCandidatesFromMeetingNotes', () => {
  it('returns the union of all evidence candidates across notes', () => {
    const seed = buildMeetingNoteCaptureSeed(
      'apex-contact-center-ai',
      'data_foundation_assessment',
    );
    const expected = seed.flatMap((n) => n.evidenceCandidates);
    const got = deriveEvidenceCandidatesFromMeetingNotes(seed);
    expect(got.length).toBe(expected.length);
    expect(JSON.stringify(got)).toBe(JSON.stringify(expected));
  });

  it('returns an empty list for an empty input', () => {
    expect(deriveEvidenceCandidatesFromMeetingNotes([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------
// Synthesis
// ---------------------------------------------------------------------

describe('synthesizeMeetingNotes', () => {
  it('is deterministic across repeated calls', () => {
    const seed = buildMeetingNoteCaptureSeed(
      'apex-contact-center-ai',
      'value_framing',
    );
    const a = synthesizeMeetingNotes(seed);
    const b = synthesizeMeetingNotes(seed);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('caps top arrays per spec', () => {
    const seed: MeetingNoteCapture[] = [];
    for (const ws of CANONICAL_WORKSHOP_TYPES) {
      const list = buildMeetingNoteCaptureSeed(
        'apex-contact-center-ai',
        ws,
      );
      seed.push(...list);
    }
    const result = synthesizeMeetingNotes(seed);
    expect(result.topDecisions.length).toBeLessThanOrEqual(3);
    expect(result.topActionItems.length).toBeLessThanOrEqual(5);
    expect(result.topRisks.length).toBeLessThanOrEqual(3);
  });

  it('marks the result as deterministic seed and synthesizer v1', () => {
    const seed = buildMeetingNoteCaptureSeed(
      'apex-contact-center-ai',
      'use_case_framing',
    );
    const result = synthesizeMeetingNotes(seed);
    expect(result.basis.synthesizer).toBe('meeting_synthesis_v1');
    expect(result.createdFrom).toBe('deterministic_seed');
  });

  it('omits closed action items from the top list', () => {
    const seed = buildMeetingNoteCaptureSeed(
      'apex-contact-center-ai',
      'use_case_framing',
    );
    const result = synthesizeMeetingNotes(seed);
    for (const a of result.topActionItems) {
      expect(['open', 'in_progress']).toContain(a.state);
    }
  });

  it('returns a structured shape even for an empty input', () => {
    const result = synthesizeMeetingNotes([]);
    expect(result.programKey).toBe('');
    expect(result.workshopType).toBe('');
    expect(result.topDecisions).toEqual([]);
    expect(result.topActionItems).toEqual([]);
    expect(result.topRisks).toEqual([]);
    expect(result.recommendedNextStep.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene', () => {
  const filePath = join(
    process.cwd(),
    'src/lib/programs/meeting-notes-capture.ts',
  );
  const source = readFileSync(filePath, 'utf8');

  it('has no banned imports', () => {
    const banned = [
      "from '@/lib/source/",
      "from '@/lib/nexus/",
      "from '@/lib/sentinel/",
      "from '@/lib/atlas/",
      "from '@/lib/agent/",
      "from '@/lib/auth/",
      "from 'supabase",
      "from '@/lib/programs/mock'",
    ];
    for (const needle of banned) {
      expect(source).not.toContain(needle);
    }
  });

  it('uses no banned runtime APIs', () => {
    expect(source).not.toMatch(/\bDate\.now\b/);
    expect(source).not.toMatch(/\bMath\.random\b/);
    expect(source).not.toMatch(/\bnew Date\(/);
    expect(source).not.toMatch(/\bfetch\(/);
    expect(source).not.toMatch(/\buseState\b/);
    expect(source).not.toMatch(/\buseEffect\b/);
  });

  it('contains no placeholder strings', () => {
    expect(source).not.toContain('Coming soon');
    expect(source).not.toContain('TBD');
    expect(source).not.toContain('Lorem ipsum');
  });

  it('contains no E-### literal tokens', () => {
    expect(source).not.toMatch(/\bE-\d+/);
  });
});
