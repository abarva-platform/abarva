// MW5 · Meeting Notes → Program State Updates Read Model tests.

import { readFileSync } from 'fs';
import { join } from 'path';

import {
  buildMeetingNoteCaptureSeed,
  buildMeetingNoteCaptureTemplate,
  type MeetingNoteCapture,
} from '@/lib/programs/meeting-notes-capture';
import {
  PROGRAM_UPDATE_PROPOSAL_TYPES,
  deriveActionProposals,
  deriveDeliverableUpdateProposals,
  deriveEvidenceCandidateProposals,
  deriveGateImpactProposals,
  deriveOpenQuestionProposals,
  deriveProgramUpdatesFromMeetingNotesCapture,
  deriveRiskProposals,
  summarizeProgramUpdateProposals,
  type ProgramUpdateProposal,
  type ProgramUpdateProposalType,
} from '@/lib/programs/meeting-notes-to-program-updates';

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
  'arcturus-decision-cockpit',
] as const;

function buildAllSeedNotes(): readonly MeetingNoteCapture[] {
  const out: MeetingNoteCapture[] = [];
  for (const programKey of PROGRAM_KEYS) {
    for (const ws of CANONICAL_WORKSHOP_TYPES) {
      const seed = buildMeetingNoteCaptureSeed(programKey, ws);
      out.push(...seed);
    }
  }
  return out;
}

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('deriveProgramUpdatesFromMeetingNotesCapture · determinism', () => {
  it('produces byte-equal output across repeated calls for the canonical seed', () => {
    for (const programKey of PROGRAM_KEYS) {
      for (const ws of CANONICAL_WORKSHOP_TYPES) {
        const seed = buildMeetingNoteCaptureSeed(programKey, ws);
        const a = deriveProgramUpdatesFromMeetingNotesCapture(seed);
        const b = deriveProgramUpdatesFromMeetingNotesCapture(seed);
        expect(JSON.stringify(a)).toBe(JSON.stringify(b));
      }
    }
  });

  it('returns no proposals for empty templates', () => {
    for (const ws of CANONICAL_WORKSHOP_TYPES) {
      const tpl = buildMeetingNoteCaptureTemplate(ws);
      expect(deriveProgramUpdatesFromMeetingNotesCapture([tpl])).toEqual([]);
    }
  });

  it('returns an empty list for an empty input', () => {
    expect(deriveProgramUpdatesFromMeetingNotesCapture([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------
// Coverage across the canonical seed
// ---------------------------------------------------------------------

describe('deriveProgramUpdatesFromMeetingNotesCapture · coverage', () => {
  it('emits at least one proposal per (programKey, workshopType) seed pair', () => {
    for (const programKey of PROGRAM_KEYS) {
      for (const ws of CANONICAL_WORKSHOP_TYPES) {
        const seed = buildMeetingNoteCaptureSeed(programKey, ws);
        const proposals = deriveProgramUpdatesFromMeetingNotesCapture(seed);
        expect(proposals.length).toBeGreaterThan(0);
      }
    }
  });

  it('every proposal carries a discriminator from the canonical proposal-type union', () => {
    const proposals = deriveProgramUpdatesFromMeetingNotesCapture(
      buildAllSeedNotes(),
    );
    for (const proposal of proposals) {
      expect(PROGRAM_UPDATE_PROPOSAL_TYPES).toContain(proposal.proposalType);
    }
  });

  it('emits every canonical proposal type at least once across the full seed', () => {
    const proposals = deriveProgramUpdatesFromMeetingNotesCapture(
      buildAllSeedNotes(),
    );
    const seen = new Set(proposals.map((p) => p.proposalType));
    for (const type of PROGRAM_UPDATE_PROPOSAL_TYPES) {
      expect(seen.has(type)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// Provenance + status
// ---------------------------------------------------------------------

describe('proposal provenance and status', () => {
  it('every proposal carries source.programKey, source.workshopType, and source.noteId from a known note', () => {
    for (const programKey of PROGRAM_KEYS) {
      for (const ws of CANONICAL_WORKSHOP_TYPES) {
        const seed = buildMeetingNoteCaptureSeed(programKey, ws);
        const knownNoteIds = new Set(seed.map((n) => n.id));
        const proposals = deriveProgramUpdatesFromMeetingNotesCapture(seed);
        for (const proposal of proposals) {
          expect(proposal.source.programKey).toBe(programKey);
          expect(proposal.source.workshopType).toBe(ws);
          expect(knownNoteIds.has(proposal.source.noteId)).toBe(true);
          expect(proposal.source.workshopOrdinal).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it('every proposal is marked status: proposed (never applied)', () => {
    const proposals = deriveProgramUpdatesFromMeetingNotesCapture(
      buildAllSeedNotes(),
    );
    expect(proposals.length).toBeGreaterThan(0);
    for (const proposal of proposals) {
      expect(proposal.status).toBe('proposed');
    }
  });

  it('no proposal carries an applied / committed / done state in any field', () => {
    const proposals = deriveProgramUpdatesFromMeetingNotesCapture(
      buildAllSeedNotes(),
    );
    const blob = JSON.stringify(proposals);
    expect(blob).not.toMatch(/"status":\s*"applied"/);
    expect(blob).not.toMatch(/"status":\s*"committed"/);
    expect(blob).not.toMatch(/"status":\s*"done"/);
    expect(blob).not.toMatch(/"applied":\s*true/);
  });

  it('every proposal carries createdFrom = deterministic_meeting_notes_seed', () => {
    const proposals = deriveProgramUpdatesFromMeetingNotesCapture(
      buildAllSeedNotes(),
    );
    for (const proposal of proposals) {
      expect(proposal.createdFrom).toBe('deterministic_meeting_notes_seed');
    }
  });
});

// ---------------------------------------------------------------------
// Action proposals
// ---------------------------------------------------------------------

describe('deriveActionProposals', () => {
  it('returns one proposal per captured action item', () => {
    const seed = buildMeetingNoteCaptureSeed(
      'apex-contact-center-ai',
      'use_case_framing',
    );
    const expectedCount = seed.reduce(
      (sum, note) => sum + note.actionItems.length,
      0,
    );
    const proposals = deriveActionProposals(seed);
    expect(proposals.length).toBe(expectedCount);
    for (const proposal of proposals) {
      expect(proposal.proposalType).toBe('action_proposal');
      expect(proposal.status).toBe('proposed');
      expect(proposal.description.length).toBeGreaterThan(0);
      expect(proposal.ownerRole.length).toBeGreaterThan(0);
    }
  });

  it('preserves the original action state as initialState', () => {
    const seed = buildMeetingNoteCaptureSeed(
      'meridian-clinical-intelligence',
      'governance_risk_review',
    );
    const proposals = deriveActionProposals(seed);
    for (const proposal of proposals) {
      expect(['open', 'in_progress', 'completed', 'blocked']).toContain(
        proposal.initialState,
      );
    }
  });

  it('returns an empty list when notes have no action items', () => {
    const tpl = buildMeetingNoteCaptureTemplate('value_framing');
    expect(deriveActionProposals([tpl])).toEqual([]);
  });
});

// ---------------------------------------------------------------------
// Risk proposals
// ---------------------------------------------------------------------

describe('deriveRiskProposals', () => {
  it('returns one proposal per captured risk', () => {
    const seed = buildMeetingNoteCaptureSeed(
      'apex-contact-center-ai',
      'governance_risk_review',
    );
    const expectedCount = seed.reduce(
      (sum, note) => sum + note.risks.length,
      0,
    );
    const proposals = deriveRiskProposals(seed);
    expect(proposals.length).toBe(expectedCount);
    for (const proposal of proposals) {
      expect(proposal.proposalType).toBe('risk_proposal');
      expect(proposal.status).toBe('proposed');
      expect(['low', 'medium', 'high']).toContain(proposal.likelihood);
      expect(['low', 'medium', 'high']).toContain(proposal.impact);
    }
  });

  it('emits stronger rationale for high-impact risks', () => {
    const seed = buildMeetingNoteCaptureSeed(
      'apex-contact-center-ai',
      'governance_risk_review',
    );
    const proposals = deriveRiskProposals(seed);
    const highImpact = proposals.filter((p) => p.impact === 'high');
    expect(highImpact.length).toBeGreaterThan(0);
    for (const proposal of highImpact) {
      expect(proposal.rationale).toMatch(/high-impact|High-impact|warrants/);
    }
  });
});

// ---------------------------------------------------------------------
// Open question proposals
// ---------------------------------------------------------------------

describe('deriveOpenQuestionProposals', () => {
  it('returns one proposal per blocking open question', () => {
    const seed = buildMeetingNoteCaptureSeed(
      'arcturus-decision-cockpit',
      'executive_decision_review',
    );
    const proposals = deriveOpenQuestionProposals(seed);
    expect(proposals.length).toBeGreaterThan(0);
    for (const proposal of proposals) {
      expect(proposal.proposalType).toBe('open_question_proposal');
      expect(proposal.status).toBe('proposed');
      expect(['phase_advancement', 'deliverable_approval', 'gate_signoff']).toContain(
        proposal.blocks,
      );
    }
  });

  it('returns an empty list when notes carry no open questions', () => {
    const tpl = buildMeetingNoteCaptureTemplate('current_state_discovery');
    expect(deriveOpenQuestionProposals([tpl])).toEqual([]);
  });
});

// ---------------------------------------------------------------------
// Evidence candidate proposals
// ---------------------------------------------------------------------

describe('deriveEvidenceCandidateProposals', () => {
  it('returns one proposal per captured evidence candidate', () => {
    const seed = buildMeetingNoteCaptureSeed(
      'apex-contact-center-ai',
      'data_foundation_assessment',
    );
    const expectedCount = seed.reduce(
      (sum, note) => sum + note.evidenceCandidates.length,
      0,
    );
    const proposals = deriveEvidenceCandidateProposals(seed);
    expect(proposals.length).toBe(expectedCount);
    for (const proposal of proposals) {
      expect(proposal.proposalType).toBe('evidence_candidate_proposal');
      expect(proposal.status).toBe('proposed');
      expect(typeof proposal.needsCapture).toBe('boolean');
    }
  });

  it('preserves the source label verbatim', () => {
    const seed = buildMeetingNoteCaptureSeed(
      'meridian-clinical-intelligence',
      'value_framing',
    );
    const proposals = deriveEvidenceCandidateProposals(seed);
    for (const proposal of proposals) {
      expect([
        'shared_screen',
        'whiteboard',
        'verbal_only',
        'document_referenced',
        'preexisting_artifact',
      ]).toContain(proposal.sourceLabel);
    }
  });
});

// ---------------------------------------------------------------------
// Deliverable update proposals
// ---------------------------------------------------------------------

describe('deriveDeliverableUpdateProposals', () => {
  it('returns no proposals for empty templates', () => {
    const tpl = buildMeetingNoteCaptureTemplate('use_case_framing');
    expect(deriveDeliverableUpdateProposals([tpl])).toEqual([]);
  });

  it('emits review_feedback when a decision references a deliverable key', () => {
    const seed = buildMeetingNoteCaptureSeed(
      'meridian-clinical-intelligence',
      'governance_risk_review',
    );
    const proposals = deriveDeliverableUpdateProposals(seed);
    expect(proposals.some((p) => p.updateKind === 'review_feedback')).toBe(
      true,
    );
  });

  it('emits rework_required when stakeholder alignment is divergent', () => {
    const seed = buildMeetingNoteCaptureSeed(
      'apex-contact-center-ai',
      'use_case_framing',
    );
    const proposals = deriveDeliverableUpdateProposals(seed);
    expect(proposals.some((p) => p.updateKind === 'rework_required')).toBe(
      true,
    );
  });

  it('every proposal carries a non-empty deliverable key', () => {
    const proposals = deriveDeliverableUpdateProposals(buildAllSeedNotes());
    expect(proposals.length).toBeGreaterThan(0);
    for (const proposal of proposals) {
      expect(proposal.deliverableKey.length).toBeGreaterThan(0);
      expect([
        'draft_input_added',
        'review_feedback',
        'approval_blocked',
        'rework_required',
      ]).toContain(proposal.updateKind);
    }
  });
});

// ---------------------------------------------------------------------
// Gate impact proposals
// ---------------------------------------------------------------------

describe('deriveGateImpactProposals', () => {
  it('returns no proposals for empty templates', () => {
    const tpl = buildMeetingNoteCaptureTemplate('governance_risk_review');
    expect(deriveGateImpactProposals([tpl])).toEqual([]);
  });

  it('every gate impact carries advisory: true', () => {
    const proposals = deriveGateImpactProposals(buildAllSeedNotes());
    expect(proposals.length).toBeGreaterThan(0);
    for (const proposal of proposals) {
      expect(proposal.advisory).toBe(true);
      expect(['G1', 'G2', 'G3', 'G4']).toContain(proposal.gate);
      expect([
        'gate_readiness_at_risk',
        'gate_readiness_advanced',
        'gate_signoff_blocked',
        'gate_evidence_needed',
      ]).toContain(proposal.impactKind);
    }
  });

  it('emits gate_signoff_blocked for open questions blocking gate signoff', () => {
    const seed = buildMeetingNoteCaptureSeed(
      'arcturus-decision-cockpit',
      'value_framing',
    );
    const proposals = deriveGateImpactProposals(seed);
    expect(
      proposals.some((p) => p.impactKind === 'gate_signoff_blocked'),
    ).toBe(true);
  });

  it('emits gate_readiness_advanced for sponsor decisions', () => {
    const seed = buildMeetingNoteCaptureSeed(
      'meridian-clinical-intelligence',
      'use_case_framing',
    );
    const proposals = deriveGateImpactProposals(seed);
    expect(
      proposals.some((p) => p.impactKind === 'gate_readiness_advanced'),
    ).toBe(true);
  });

  it('maps workshop types to canonical gates', () => {
    const expectations: ReadonlyArray<readonly [string, 'G1' | 'G2' | 'G3' | 'G4']> = [
      ['current_state_discovery', 'G1'],
      ['use_case_framing', 'G1'],
      ['data_foundation_assessment', 'G2'],
      ['value_framing', 'G2'],
      ['governance_risk_review', 'G2'],
      ['architecture_solution_design', 'G3'],
      ['operating_model_alignment', 'G3'],
      ['adoption_change_readiness', 'G4'],
      ['executive_decision_review', 'G4'],
    ];
    for (const [ws, expectedGate] of expectations) {
      const seed = buildMeetingNoteCaptureSeed('apex-contact-center-ai', ws);
      const proposals = deriveGateImpactProposals(seed);
      for (const proposal of proposals) {
        expect(proposal.gate).toBe(expectedGate);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------

describe('summarizeProgramUpdateProposals', () => {
  it('reconciles totals against the proposal list', () => {
    const proposals = deriveProgramUpdatesFromMeetingNotesCapture(
      buildAllSeedNotes(),
    );
    const summary = summarizeProgramUpdateProposals(proposals);
    expect(summary.totalProposals).toBe(proposals.length);
    const counts: Record<string, number> = {};
    for (const proposal of proposals) {
      counts[proposal.proposalType] =
        (counts[proposal.proposalType] ?? 0) + 1;
    }
    for (const t of PROGRAM_UPDATE_PROPOSAL_TYPES) {
      expect(summary.byType[t as ProgramUpdateProposalType]).toBe(
        counts[t] ?? 0,
      );
    }
    expect(summary.actionProposals).toBe(counts.action_proposal ?? 0);
    expect(summary.riskProposals).toBe(counts.risk_proposal ?? 0);
    expect(summary.openQuestionProposals).toBe(
      counts.open_question_proposal ?? 0,
    );
    expect(summary.evidenceCandidateProposals).toBe(
      counts.evidence_candidate_proposal ?? 0,
    );
    expect(summary.deliverableUpdateProposals).toBe(
      counts.deliverable_update_proposal ?? 0,
    );
    expect(summary.gateImpactProposals).toBe(counts.gate_impact_proposal ?? 0);
  });

  it('always reports appliedProposals = 0', () => {
    const proposals = deriveProgramUpdatesFromMeetingNotesCapture(
      buildAllSeedNotes(),
    );
    const summary = summarizeProgramUpdateProposals(proposals);
    expect(summary.appliedProposals).toBe(0);
  });

  it('returns zeroed totals for an empty list', () => {
    const summary = summarizeProgramUpdateProposals([]);
    expect(summary.totalProposals).toBe(0);
    expect(summary.actionProposals).toBe(0);
    expect(summary.riskProposals).toBe(0);
    expect(summary.openQuestionProposals).toBe(0);
    expect(summary.evidenceCandidateProposals).toBe(0);
    expect(summary.deliverableUpdateProposals).toBe(0);
    expect(summary.gateImpactProposals).toBe(0);
    expect(summary.appliedProposals).toBe(0);
    for (const t of PROGRAM_UPDATE_PROPOSAL_TYPES) {
      expect(summary.byType[t as ProgramUpdateProposalType]).toBe(0);
    }
  });
});

// ---------------------------------------------------------------------
// Honesty / fabrication guards
// ---------------------------------------------------------------------

describe('honesty and fabrication guards', () => {
  it('contains no fabricated E-### evidence citation tokens', () => {
    const proposals = deriveProgramUpdatesFromMeetingNotesCapture(
      buildAllSeedNotes(),
    );
    const blob = JSON.stringify(proposals);
    expect(blob).not.toMatch(/\bE-\d+/);
  });

  it('contains no fabricated dollar amounts', () => {
    const proposals = deriveProgramUpdatesFromMeetingNotesCapture(
      buildAllSeedNotes(),
    );
    const blob = JSON.stringify(proposals);
    expect(blob).not.toMatch(/\$\d/);
  });

  it('contains no real person names', () => {
    const realNamePattern =
      /\b(John|Jane|Mary|Mike|Anand|Steve|Alice|Bob|Charlie|David|Sarah|Linda|Robert)\b/i;
    const proposals = deriveProgramUpdatesFromMeetingNotesCapture(
      buildAllSeedNotes(),
    );
    const blob = JSON.stringify(proposals);
    expect(blob).not.toMatch(realNamePattern);
  });

  it('returns proposals only — never mutates the input notes', () => {
    const seed = buildMeetingNoteCaptureSeed(
      'apex-contact-center-ai',
      'use_case_framing',
    );
    const before = JSON.stringify(seed);
    deriveProgramUpdatesFromMeetingNotesCapture(seed);
    const after = JSON.stringify(seed);
    expect(after).toBe(before);
  });
});

// ---------------------------------------------------------------------
// Top-level entry point: ordering invariant
// ---------------------------------------------------------------------

describe('top-level ordering invariant', () => {
  it('emits proposals grouped by type in the canonical order: action, risk, question, evidence, deliverable, gate', () => {
    const seed = buildMeetingNoteCaptureSeed(
      'apex-contact-center-ai',
      'governance_risk_review',
    );
    const proposals = deriveProgramUpdatesFromMeetingNotesCapture(seed);
    const canonicalOrder: readonly ProgramUpdateProposalType[] = [
      'action_proposal',
      'risk_proposal',
      'open_question_proposal',
      'evidence_candidate_proposal',
      'deliverable_update_proposal',
      'gate_impact_proposal',
    ];
    let lastIndex = -1;
    for (const proposal of proposals) {
      const idx = canonicalOrder.indexOf(proposal.proposalType);
      expect(idx).toBeGreaterThanOrEqual(lastIndex);
      lastIndex = idx;
    }
  });

  it('matches the concatenation of the per-type derive helpers', () => {
    const seed = buildMeetingNoteCaptureSeed(
      'meridian-clinical-intelligence',
      'value_framing',
    );
    const top = deriveProgramUpdatesFromMeetingNotesCapture(seed);
    const concat: ProgramUpdateProposal[] = [
      ...deriveActionProposals(seed),
      ...deriveRiskProposals(seed),
      ...deriveOpenQuestionProposals(seed),
      ...deriveEvidenceCandidateProposals(seed),
      ...deriveDeliverableUpdateProposals(seed),
      ...deriveGateImpactProposals(seed),
    ];
    expect(JSON.stringify(top)).toBe(JSON.stringify(concat));
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene', () => {
  const filePath = join(
    process.cwd(),
    'src/lib/programs/meeting-notes-to-program-updates.ts',
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
      'anthropic',
      'openai',
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

  it("does not declare 'use client' or use React hooks", () => {
    expect(source).not.toContain("'use client'");
    expect(source).not.toContain('"use client"');
    expect(source).not.toMatch(/\buseState\b/);
    expect(source).not.toMatch(/\buseEffect\b/);
  });
});
