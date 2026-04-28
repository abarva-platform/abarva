// SOL7 · Solution Archetype Detail Read Model tests.

import {
  SOLUTION_ARCHETYPE_CANVAS_SECTION_KEYS_IN_ORDER,
  SOLUTION_ARCHETYPE_VIEW_BUILDER_VERSION,
  buildSolutionArchetypeCanvasSections,
  buildSolutionArchetypeDetailView,
  summarizeSolutionArchetypeReadiness,
  type SolutionArchetypeLike,
} from '@/lib/solutions/solution-archetype-detail-view';

const DOLLAR_PATTERN = /\$\s?\d/;

const VALID_LAYOUT_HINTS = new Set([
  'list',
  'paragraph',
  'two_column',
  'metric_strip',
  'agent_partition',
]);

// ---------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------

function makeFullyPopulatedArchetype(): SolutionArchetypeLike {
  return {
    key: 'fixture_full_archetype',
    name: 'Fixture Full Archetype',
    sector: 'cross_industry',
    capabilityFamily: 'ai_led_pdlc',
    problemStatement:
      'Engineering velocity claims are anecdotal; AI-led PDLC investment lacks defensible value evidence.',
    businessOutcomes: [
      'Reduce lead time for changes by a measurable margin against the captured baseline',
      'Hold change-failure rate flat or improve it as deployment frequency rises',
      'Defend the AI-led PDLC investment at the next steering touchpoint with captured evidence',
    ],
    currentStateInputsRequired: [
      'Inventory of existing engineering handbooks, ADRs, and style guides',
      'Repository topology and ownership map per service or package',
      'Current state of CI / CD / incident systems with API access notes',
    ],
    patternsUsed: [
      'value_ledger_incompleteness',
      'evidence_chain_gap',
      'program_context_sparsity',
    ],
    failureModesAddressed: [
      'no_value_ledger',
      'no_measurable_baseline',
      'weak_data_foundation',
    ],
    solutionComponents: [
      'context_as_code_foundation',
      'dora_telemetry_layer',
      'value_ledger_for_pdlc',
    ],
    architectureBuildingBlocks: [
      'Versioned context repository per service',
      'Centralised DORA telemetry warehouse with named source of truth per metric',
      'Value ledger application backed by adoption + outcome telemetry',
    ],
    workshopsRequired: [
      'current_state_discovery',
      'data_foundation_assessment',
      'value_framing',
    ],
    smesRequired: [
      'Engineering platform lead',
      'Product owner for the pilot squad',
      'Data warehouse owner for telemetry sources',
    ],
    buildBuyPartnerConsiderations: [
      'Buy DORA telemetry ingestion if the existing data warehouse cannot land the sources',
      'Build the value ledger application in-house to keep sponsor sign-off close to the evidence',
    ],
    governanceRiskConsiderations: [
      'Named owner per DORA metric with quarterly definition review',
      'Privacy review before any per-engineer adoption telemetry crosses manager boundaries',
    ],
    deliverablesGenerated: [
      'Repo context manifest set',
      'Baseline DORA report with executive dashboard',
      'Per-investment value ledger entries with adoption-to-outcome correlation',
    ],
    valueMetrics: [
      'Lead time for changes (DORA)',
      'Change-failure rate (DORA)',
      'Adoption-to-outcome correlation per investment',
    ],
    agentRoles: {
      nexus:
        'Sequence the workshop slate and the spec-to-code rollout against the captured inputs.',
      sentinel:
        'Watch for evidence-chain gap and value-ledger incompleteness across the portfolio.',
      atlas:
        'Anchor the value ledger and defend the AI-led PDLC investment to executive sponsors.',
      steward:
        'Capture the current-state inventory and the SME roster during intake.',
    },
    recommendedFirstWorkshop: 'current_state_discovery',
    createdFrom: 'deterministic_solution_archetype_registry',
  };
}

function makePartialArchetype(): SolutionArchetypeLike {
  const full = makeFullyPopulatedArchetype();
  return {
    ...full,
    key: 'fixture_partial_archetype',
    name: 'Fixture Partial Archetype',
    currentStateInputsRequired: [],
    smesRequired: [],
    workshopsRequired: [],
    valueMetrics: [],
    businessOutcomes: [],
  };
}

// ---------------------------------------------------------------------
// buildSolutionArchetypeDetailView · determinism + projection
// ---------------------------------------------------------------------

describe('buildSolutionArchetypeDetailView', () => {
  it('returns byte-equal output across repeated calls (full fixture)', () => {
    const arche = makeFullyPopulatedArchetype();
    const a = JSON.stringify(buildSolutionArchetypeDetailView(arche));
    const b = JSON.stringify(buildSolutionArchetypeDetailView(arche));
    expect(a).toBe(b);
  });

  it('returns byte-equal output across repeated calls (partial fixture)', () => {
    const arche = makePartialArchetype();
    const a = JSON.stringify(buildSolutionArchetypeDetailView(arche));
    const b = JSON.stringify(buildSolutionArchetypeDetailView(arche));
    expect(a).toBe(b);
  });

  it('projects every required section into the view', () => {
    const arche = makeFullyPopulatedArchetype();
    const view = buildSolutionArchetypeDetailView(arche);
    expect(view.archetypeKey).toBe(arche.key);
    expect(view.summary.name).toBe(arche.name);
    expect(view.summary.sector).toBe(arche.sector);
    expect(view.summary.capabilityFamily).toBe(arche.capabilityFamily);
    expect(view.summary.problemStatement).toBe(arche.problemStatement);
    expect(view.businessOutcomes).toEqual([...arche.businessOutcomes]);
    expect(view.currentStateInputs).toEqual([...arche.currentStateInputsRequired]);
    expect(view.patterns).toEqual([...arche.patternsUsed]);
    expect(view.failureModes).toEqual([...arche.failureModesAddressed]);
    expect(view.solutionComponents).toEqual([...arche.solutionComponents]);
    expect(view.architecture).toEqual([...arche.architectureBuildingBlocks]);
    expect(view.workshops).toEqual([...arche.workshopsRequired]);
    expect(view.smes).toEqual([...arche.smesRequired]);
    expect(view.buildBuyPartner).toEqual([...arche.buildBuyPartnerConsiderations]);
    expect(view.governanceRisk).toEqual([...arche.governanceRiskConsiderations]);
    expect(view.deliverables).toEqual([...arche.deliverablesGenerated]);
    expect(view.valueMetrics).toEqual([...arche.valueMetrics]);
    expect(view.agentRoles).toEqual({ ...arche.agentRoles });
  });

  it('produces empty missingInputPrompts and an architecture-composition action for a fully-populated archetype', () => {
    const arche = makeFullyPopulatedArchetype();
    const view = buildSolutionArchetypeDetailView(arche);
    expect(view.missingInputPrompts.length).toBe(0);
    expect(view.recommendedNextAction.toLowerCase()).toContain('architecture');
  });

  it('produces missingInputPrompts and a Schedule/intake action for a partial archetype', () => {
    const arche = makePartialArchetype();
    const view = buildSolutionArchetypeDetailView(arche);
    expect(view.missingInputPrompts.length).toBeGreaterThan(0);
    const action = view.recommendedNextAction;
    expect(/Schedule|intake/i.test(action)).toBe(true);
  });

  it('tags basis.source and createdFrom with the deterministic markers', () => {
    const view = buildSolutionArchetypeDetailView(makeFullyPopulatedArchetype());
    expect(view.basis.source).toBe('deterministic_solution_archetype_registry');
    expect(view.basis.viewBuilderVersion).toBe(SOLUTION_ARCHETYPE_VIEW_BUILDER_VERSION);
    expect(view.createdFrom).toBe('deterministic_seed');
  });

  it('emits no invented dollar amounts in the serialised view (full fixture)', () => {
    const view = buildSolutionArchetypeDetailView(makeFullyPopulatedArchetype());
    expect(JSON.stringify(view)).not.toMatch(DOLLAR_PATTERN);
  });

  it('emits no invented dollar amounts in the serialised view (partial fixture)', () => {
    const view = buildSolutionArchetypeDetailView(makePartialArchetype());
    expect(JSON.stringify(view)).not.toMatch(DOLLAR_PATTERN);
  });
});

// ---------------------------------------------------------------------
// buildSolutionArchetypeCanvasSections · canonical order + layout
// ---------------------------------------------------------------------

describe('buildSolutionArchetypeCanvasSections', () => {
  it('returns 12 sections in the canonical render order', () => {
    const sections = buildSolutionArchetypeCanvasSections(
      makeFullyPopulatedArchetype(),
    );
    expect(sections.length).toBe(12);
    expect(sections.map((s) => s.key)).toEqual([
      ...SOLUTION_ARCHETYPE_CANVAS_SECTION_KEYS_IN_ORDER,
    ]);
  });

  it('uses only the canonical layoutHint vocabulary', () => {
    const sections = buildSolutionArchetypeCanvasSections(
      makeFullyPopulatedArchetype(),
    );
    for (const s of sections) {
      expect(VALID_LAYOUT_HINTS.has(s.layoutHint)).toBe(true);
    }
  });

  it('every section has a non-empty title', () => {
    const sections = buildSolutionArchetypeCanvasSections(
      makeFullyPopulatedArchetype(),
    );
    for (const s of sections) {
      expect(s.title.trim().length).toBeGreaterThan(0);
    }
  });

  it('returns deterministic output across repeated calls', () => {
    const arche = makeFullyPopulatedArchetype();
    const a = JSON.stringify(buildSolutionArchetypeCanvasSections(arche));
    const b = JSON.stringify(buildSolutionArchetypeCanvasSections(arche));
    expect(a).toBe(b);
  });

  it('flags evidenceLinkRequired on the canonical evidence-anchored sections', () => {
    const sections = buildSolutionArchetypeCanvasSections(
      makeFullyPopulatedArchetype(),
    );
    const byKey = new Map(sections.map((s) => [s.key, s]));
    expect(byKey.get('business_outcomes')?.evidenceLinkRequired).toBe(true);
    expect(byKey.get('current_state_inputs')?.evidenceLinkRequired).toBe(true);
    expect(byKey.get('patterns_and_failure_modes')?.evidenceLinkRequired).toBe(true);
    expect(byKey.get('governance_risk')?.evidenceLinkRequired).toBe(true);
    expect(byKey.get('value_metrics')?.evidenceLinkRequired).toBe(true);
    expect(byKey.get('brief')?.evidenceLinkRequired).toBe(false);
  });

  it('partial fixture leaves the corresponding bodies empty without throwing', () => {
    const sections = buildSolutionArchetypeCanvasSections(makePartialArchetype());
    const byKey = new Map(sections.map((s) => [s.key, s]));
    expect(byKey.get('current_state_inputs')?.body.length).toBe(0);
    expect(byKey.get('workshops')?.body.length).toBe(0);
    expect(byKey.get('smes')?.body.length).toBe(0);
    expect(byKey.get('value_metrics')?.body.length).toBe(0);
    expect(byKey.get('business_outcomes')?.body.length).toBe(0);
    // Brief is composed from summary fields and stays populated even when
    // the input arrays are empty.
    expect((byKey.get('brief')?.body.length ?? 0)).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------
// summarizeSolutionArchetypeReadiness
// ---------------------------------------------------------------------

describe('summarizeSolutionArchetypeReadiness', () => {
  it('returns usable for a fully-populated archetype', () => {
    const summary = summarizeSolutionArchetypeReadiness(
      makeFullyPopulatedArchetype(),
    );
    expect(summary.archetypeKey).toBe('fixture_full_archetype');
    expect(summary.totalSections).toBe(12);
    expect(summary.sectionsWithBody).toBe(12);
    expect(summary.missingInputCount).toBe(0);
    expect(summary.readinessLevel).toBe('usable');
    expect(summary.recommendedNextAction.toLowerCase()).toContain('architecture');
  });

  it('returns weak or partial for a partial archetype with several empty arrays', () => {
    const summary = summarizeSolutionArchetypeReadiness(makePartialArchetype());
    expect(summary.totalSections).toBe(12);
    expect(summary.sectionsWithBody).toBeLessThan(12);
    expect(summary.missingInputCount).toBeGreaterThan(0);
    expect(['weak', 'partial']).toContain(summary.readinessLevel);
    expect(/Schedule|intake/i.test(summary.recommendedNextAction)).toBe(true);
  });

  it('returns deterministic output across repeated calls', () => {
    const arche = makeFullyPopulatedArchetype();
    const a = JSON.stringify(summarizeSolutionArchetypeReadiness(arche));
    const b = JSON.stringify(summarizeSolutionArchetypeReadiness(arche));
    expect(a).toBe(b);
  });
});

// ---------------------------------------------------------------------
// Module hygiene · solution-archetype-detail-view.ts
// ---------------------------------------------------------------------

describe('module hygiene · solution-archetype-detail-view.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/solutions/solution-archetype-detail-view.ts',
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

  it('does not import the SOL3 registry (deferred to follow-up slice)', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/solutions\/solution-archetype-registry/);
  });

  it('does not call Date.now / Math.random / new Date / fetch', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
    expect(codeOnly).not.toMatch(/\bfetch\(/);
  });

  it('does not invoke Claude / OpenAI / Pinecone runtime', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
    expect(codeOnly).not.toMatch(/pinecone/i);
  });

  it('does not contain banned placeholder phrases', () => {
    const banned = [/coming soon/i, /\bTBD\b/, /lorem ipsum/i];
    for (const p of banned) {
      expect(source).not.toMatch(p);
    }
  });

  it('does not use React state hooks', () => {
    expect(codeOnly).not.toMatch(/\buseState\b/);
    expect(codeOnly).not.toMatch(/\buseEffect\b/);
  });
});
