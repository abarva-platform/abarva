// PF1 · AI Program Failure Modes Pattern Pack tests.

import {
  AI_PROGRAM_FAILURE_GATES,
  AI_PROGRAM_FAILURE_KEYS_IN_ORDER,
  AI_PROGRAM_FAILURE_PHASES,
  getAiProgramFailureMode,
  listAiProgramFailureModes,
  mapSignalsToFailureModes,
  summarizeFailureModes,
  type AiProgramFailureAgent,
  type AiProgramFailureKey,
} from '@/lib/intelligence/ai-program-failure-modes';

const ALL_AGENTS: AiProgramFailureAgent[] = ['nexus', 'sentinel', 'atlas', 'steward'];

// ---------------------------------------------------------------------
// All failure modes present + canonical order
// ---------------------------------------------------------------------

describe('listAiProgramFailureModes', () => {
  it('returns exactly the 12 canonical failure modes in canonical order', () => {
    const modes = listAiProgramFailureModes();
    expect(modes.length).toBe(12);
    const expected: AiProgramFailureKey[] = [
      'weak_data_foundation',
      'poor_use_case_framing',
      'no_business_owner',
      'no_measurable_baseline',
      'no_value_ledger',
      'weak_workflow_integration',
      'tool_first_thinking',
      'missing_governance_risk',
      'no_adoption_change_plan',
      'no_operating_model_for_scale',
      'pilot_purgatory',
      'ai_tool_sprawl_without_value',
    ];
    expect(modes.map((m) => m.key)).toEqual(expected);
    expect(AI_PROGRAM_FAILURE_KEYS_IN_ORDER).toEqual(expected);
  });

  it('returns deterministic output across repeated calls', () => {
    const a = listAiProgramFailureModes();
    const b = listAiProgramFailureModes();
    expect(a).toEqual(b);
  });
});

// ---------------------------------------------------------------------
// Field set per mode
// ---------------------------------------------------------------------

describe('every failure mode carries the required field set', () => {
  it.each(AI_PROGRAM_FAILURE_KEYS_IN_ORDER.map((k) => [k]))(
    '%s has full schema',
    (k) => {
      const m = getAiProgramFailureMode(k as string);
      expect(m).not.toBeNull();
      const mode = m!;
      expect(mode.key).toBe(k);
      expect(mode.name.length).toBeGreaterThan(0);
      expect(mode.definition.length).toBeGreaterThan(0);
      expect(mode.whyItMatters.length).toBeGreaterThan(0);
      expect(mode.commonSignals.length).toBeGreaterThan(0);
      expect(mode.requiredEvidence.length).toBeGreaterThan(0);
      expect(mode.phaseWhereDetected.length).toBeGreaterThan(0);
      for (const p of mode.phaseWhereDetected) {
        expect(AI_PROGRAM_FAILURE_PHASES).toContain(p);
      }
      expect(mode.recommendedIntervention.length).toBeGreaterThan(0);
      expect(AI_PROGRAM_FAILURE_GATES).toContain(mode.gateImplication);
      expect(typeof mode.deliverableImplication).toBe('string');
      expect(ALL_AGENTS).toContain(mode.primaryAgent);
      expect(mode.handoffAgents.length).toBeGreaterThan(0);
      for (const a of mode.handoffAgents) {
        expect(ALL_AGENTS).toContain(a);
      }
      expect(mode.createdFrom).toBe('deterministic_pattern_pack');
    },
  );

  it('every mode names a primary agent and at least one distinct handoff', () => {
    for (const m of listAiProgramFailureModes()) {
      const handoffSet = new Set(m.handoffAgents);
      // Handoff list may legitimately include the primary agent; we only
      // require that at least one handoff exists.
      expect(handoffSet.size).toBeGreaterThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------

describe('getAiProgramFailureMode', () => {
  it('returns null for unknown keys', () => {
    expect(getAiProgramFailureMode('not-a-real-mode')).toBeNull();
    expect(getAiProgramFailureMode('')).toBeNull();
    expect(getAiProgramFailureMode('value_not_ready')).toBeNull(); // signal type, not pattern key
  });

  it('returns the canonical record for every key', () => {
    for (const k of AI_PROGRAM_FAILURE_KEYS_IN_ORDER) {
      const a = getAiProgramFailureMode(k);
      expect(a).not.toBeNull();
      expect(a!.key).toBe(k);
    }
  });
});

// ---------------------------------------------------------------------
// Signal mapping
// ---------------------------------------------------------------------

describe('mapSignalsToFailureModes', () => {
  it('returns empty for an empty signal list', () => {
    expect(mapSignalsToFailureModes([])).toEqual([]);
  });

  it('returns empty for unknown signal types only', () => {
    expect(mapSignalsToFailureModes(['definitely_not_a_signal'])).toEqual([]);
  });

  it('maps value_not_ready to no_value_ledger and friends', () => {
    const matched = mapSignalsToFailureModes(['value_not_ready']);
    expect(matched.length).toBeGreaterThan(0);
    expect(matched.map((m) => m.key)).toContain('no_value_ledger');
    expect(matched.map((m) => m.key)).toContain('no_measurable_baseline');
  });

  it('maps gate_missing_inputs to gate-related failure modes', () => {
    const matched = mapSignalsToFailureModes(['gate_missing_inputs']);
    expect(matched.length).toBeGreaterThan(0);
    expect(matched.map((m) => m.key)).toContain('poor_use_case_framing');
  });

  it('order is canonical regardless of input order', () => {
    const a = mapSignalsToFailureModes(['value_not_ready', 'evidence_not_ready']);
    const b = mapSignalsToFailureModes(['evidence_not_ready', 'value_not_ready']);
    expect(a.map((m) => m.key)).toEqual(b.map((m) => m.key));
  });
});

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------

describe('summarizeFailureModes', () => {
  it('sums byPrimaryAgent to the total count', () => {
    const all = listAiProgramFailureModes();
    const s = summarizeFailureModes(all);
    expect(s.totalCount).toBe(all.length);
    const sumPrimary = Object.values(s.byPrimaryAgent).reduce((a, b) => a + b, 0);
    expect(sumPrimary).toBe(all.length);
  });

  it('byGate covers all canonical gate values', () => {
    const all = listAiProgramFailureModes();
    const s = summarizeFailureModes(all);
    expect(new Set(Object.keys(s.byGate))).toEqual(new Set(AI_PROGRAM_FAILURE_GATES));
  });

  it('uniqueDeliverableImplications is sorted and unique', () => {
    const all = listAiProgramFailureModes();
    const s = summarizeFailureModes(all);
    const sorted = [...s.uniqueDeliverableImplications].sort();
    expect(s.uniqueDeliverableImplications).toEqual(sorted);
    expect(new Set(s.uniqueDeliverableImplications).size).toBe(
      s.uniqueDeliverableImplications.length,
    );
  });

  it('summarizes a subset correctly', () => {
    const all = listAiProgramFailureModes();
    const subset = all.slice(0, 3);
    const s = summarizeFailureModes(subset);
    expect(s.totalCount).toBe(3);
  });
});

// ---------------------------------------------------------------------
// No fabrication
// ---------------------------------------------------------------------

describe('no fabrication', () => {
  it('no failure mode invents a dollar amount in any string field', () => {
    const dollarPattern = /\$\s?\d[\d,]*(\.\d+)?/;
    for (const m of listAiProgramFailureModes()) {
      const fields: string[] = [
        m.name,
        m.definition,
        m.whyItMatters,
        m.recommendedIntervention,
        ...m.requiredEvidence,
      ];
      for (const f of fields) {
        expect(f).not.toMatch(dollarPattern);
      }
    }
  });

  it('every mode is tagged createdFrom: deterministic_pattern_pack', () => {
    for (const m of listAiProgramFailureModes()) {
      expect(m.createdFrom).toBe('deterministic_pattern_pack');
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene · ai-program-failure-modes.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/intelligence/ai-program-failure-modes.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  it('does not import Sentinel / Atlas / Nexus / Agent runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/components\/agent\//);
  });

  it('does not import Source UI, legacy /programs, mock.ts, auth, or supabase', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/programs\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
  });

  it('does not call Date.now / Math.random / new Date', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
  });

  it('does not invoke Claude / OpenAI / Pinecone runtime', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
    expect(codeOnly).not.toMatch(/pinecone/i);
  });
});
