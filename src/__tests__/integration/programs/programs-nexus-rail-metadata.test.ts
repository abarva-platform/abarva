// S9b · Programs Nexus rail metadata binding tests.
//
// Pure deterministic coverage of the rail view-model layer. No React
// rendering, no DOM, no model/API calls. Tests assert that:
// - The Context Bundle the rail builds populates the canonical 8
//   categories with the present/absent posture S9b ships.
// - The RenderedResponse carries honest_disclosure metadata (S5) with
//   confidence, context-used, missing-inputs, response gate.
// - Bundle / score / gate / metadata are deterministic across calls.
// - Rail choices are stable.
// - The view module does not import legacy /programs, mock.ts, preview,
//   demo, Source UI, or Nexus runtime modules.

import {
  buildProgramNexusContextBundle,
  buildProgramNexusRailChoices,
  buildProgramNexusRenderedResponse,
  listKnownCategoryKeys,
  type ProgramNexusRailMode,
} from '@/lib/programs/programs-nexus-rail-view';
import { CONTEXT_BUNDLE_CATEGORY_KEYS } from '@/lib/agent/context-bundle';
import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';
import type {
  ProgramSeedPlan,
  TenantSeedPlan,
} from '@/lib/programs/enhancement-seed-planner';

const plan = buildAllProgramsSeedPlan();

function pickFixture(): { tenant: TenantSeedPlan; program: ProgramSeedPlan } {
  // Use the apexretail tenant + first program for stable fixtures.
  const tenant = plan.tenants.find((t) => t.tenantKey === 'apexretail');
  if (!tenant || tenant.programs.length === 0) {
    throw new Error('apexretail seed missing required programs for the rail tests');
  }
  return { tenant, program: tenant.programs[0] };
}

// ---------------------------------------------------------------------
// Context Bundle structure
// ---------------------------------------------------------------------

describe('buildProgramNexusContextBundle', () => {
  const { tenant, program } = pickFixture();

  it('exposes all eight canonical category keys', () => {
    const bundle = buildProgramNexusContextBundle(tenant, program);
    const keys = Object.keys(bundle.categories).sort();
    const expected = [...CONTEXT_BUNDLE_CATEGORY_KEYS].sort();
    expect(keys).toEqual(expected);
  });

  it('marks identity, work object, workflow state, artifacts, conversation as present', () => {
    const bundle = buildProgramNexusContextBundle(tenant, program);
    expect(bundle.categories.identity.present).toBe(true);
    expect(bundle.categories.workObject.present).toBe(true);
    expect(bundle.categories.workflowState.present).toBe(true);
    expect(bundle.categories.artifacts.present).toBe(program.deliverables.length > 0);
    expect(bundle.categories.conversation.present).toBe(true);
  });

  it('marks businessContext and evidence as absent (not seeded yet)', () => {
    const bundle = buildProgramNexusContextBundle(tenant, program);
    expect(bundle.categories.businessContext.present).toBe(false);
    expect(bundle.categories.businessContext.missingFields.length).toBeGreaterThan(0);
    expect(bundle.categories.evidence.present).toBe(false);
    expect(bundle.categories.evidence.missingFields).toContain('evidenceBase');
  });

  it('attaches a pattern reference when the seed has a patternSlug', () => {
    const bundle = buildProgramNexusContextBundle(tenant, program);
    if (program.patternSlug) {
      expect(bundle.categories.patterns.present).toBe(true);
      expect(bundle.patternReferences.length).toBeGreaterThanOrEqual(1);
      expect(bundle.patternReferences[0].id).toBe(program.patternSlug);
    } else {
      expect(bundle.categories.patterns.present).toBe(false);
    }
  });

  it('produces a deterministic bundle across repeated calls', () => {
    const a = buildProgramNexusContextBundle(tenant, program);
    const b = buildProgramNexusContextBundle(tenant, program);
    // bundleId / state / qualityScore / responseGate / category posture
    // must all be stable for a given input.
    expect(a.bundleId).toBe(b.bundleId);
    expect(a.state).toBe(b.state);
    expect(a.qualityScore).toEqual(b.qualityScore);
    expect(a.responseGate).toEqual(b.responseGate);
  });

  it('exposes a non-empty allowedActions list with no "none" kind', () => {
    const bundle = buildProgramNexusContextBundle(tenant, program);
    expect(bundle.allowedActions.length).toBeGreaterThan(0);
    const kinds = new Set(bundle.allowedActions.map((a) => a.kind));
    expect(kinds.has('none')).toBe(false);
  });

  it('captures missing-input fallbacks for unseeded categories', () => {
    const bundle = buildProgramNexusContextBundle(tenant, program);
    const labels = bundle.missingInputs.map((m) => m.label.toLowerCase());
    expect(labels.some((label) => label.includes('value'))).toBe(true);
    expect(labels.some((label) => label.includes('risk'))).toBe(true);
    expect(labels.some((label) => label.includes('evidence'))).toBe(true);
  });

  it('listKnownCategoryKeys is identical to the platform contract', () => {
    expect(listKnownCategoryKeys()).toEqual(CONTEXT_BUNDLE_CATEGORY_KEYS);
  });
});

// ---------------------------------------------------------------------
// RenderedResponse + honest_disclosure metadata
// ---------------------------------------------------------------------

describe('buildProgramNexusRenderedResponse', () => {
  const { tenant, program } = pickFixture();

  it('returns a RenderedResponse with honest_disclosure metadata', () => {
    const turn = buildProgramNexusRenderedResponse(tenant, program, 'opener');
    expect(typeof turn.rendered.response_text).toBe('string');
    expect(turn.rendered.response_text.length).toBeGreaterThan(20);
    expect(turn.rendered.honest_disclosure).toBeDefined();
  });

  it('confidence_signal corresponds to the disclosure confidence tier', () => {
    const turn = buildProgramNexusRenderedResponse(tenant, program, 'opener');
    const tier = turn.metadata.confidenceLevel;
    if (tier === 'HIGH') expect(turn.rendered.confidence_signal).toBe('high');
    if (tier === 'MEDIUM') expect(turn.rendered.confidence_signal).toBe('medium');
    if (tier === 'LOW') expect(turn.rendered.confidence_signal).toBe('low');
  });

  it('honest_disclosure.contextCategoriesUsed lists at least one category label', () => {
    const turn = buildProgramNexusRenderedResponse(tenant, program, 'opener');
    expect(Array.isArray(turn.metadata.contextCategoriesUsed)).toBe(true);
    expect(turn.metadata.contextCategoriesUsed!.length).toBeGreaterThan(0);
  });

  it('honest_disclosure.missingInputs surfaces value/risk/evidence fallbacks', () => {
    const turn = buildProgramNexusRenderedResponse(tenant, program, 'opener');
    const joined = (turn.metadata.missingInputs ?? []).join(' | ').toLowerCase();
    expect(joined).toMatch(/value/);
    expect(joined).toMatch(/risk/);
    expect(joined).toMatch(/evidence/);
  });

  it('honest_disclosure.responseGate is one of the four canonical reasons', () => {
    const turn = buildProgramNexusRenderedResponse(tenant, program, 'opener');
    const reason = turn.metadata.responseGate;
    expect(['proceed', 'proceed_with_disclosure', 'ask_for_missing_context', 'refuse_or_defer']).toContain(reason);
  });

  it('honest_disclosure.disclosureMessage is a non-empty single-line phrase', () => {
    const turn = buildProgramNexusRenderedResponse(tenant, program, 'opener');
    expect(typeof turn.metadata.disclosureMessage).toBe('string');
    expect(turn.metadata.disclosureMessage!.length).toBeGreaterThan(10);
  });

  it('sparsity_flag is true while evidence is unseeded', () => {
    const turn = buildProgramNexusRenderedResponse(tenant, program, 'opener');
    expect(turn.rendered.sparsity_flag).toBe(true);
  });

  it('produces deterministic responses across repeated calls', () => {
    const a = buildProgramNexusRenderedResponse(tenant, program, 'opener');
    const b = buildProgramNexusRenderedResponse(tenant, program, 'opener');
    expect(a.rendered).toEqual(b.rendered);
    expect(a.metadata).toEqual(b.metadata);
  });

  it('emits distinct prose per rail mode (output is not generic)', () => {
    const modes: ProgramNexusRailMode[] = [
      'opener',
      'walk-charter',
      'pressure-test',
      'surface-contradictions',
      'phase-readiness',
      'next-step',
    ];
    const texts = modes.map(
      (mode) => buildProgramNexusRenderedResponse(tenant, program, mode).rendered.response_text,
    );
    expect(new Set(texts).size).toBe(modes.length);
  });

  it('phase-readiness mode includes the gate-state honest fallback', () => {
    const turn = buildProgramNexusRenderedResponse(tenant, program, 'phase-readiness');
    expect(turn.rendered.response_text.toLowerCase()).toContain('gate state machine not yet wired');
  });

  it('always anchors prose with the tenant context line', () => {
    const turn = buildProgramNexusRenderedResponse(tenant, program, 'opener');
    expect(turn.rendered.response_text).toContain(tenant.displayName);
    expect(turn.rendered.response_text).toContain(program.code);
  });
});

// ---------------------------------------------------------------------
// Choices
// ---------------------------------------------------------------------

describe('buildProgramNexusRailChoices', () => {
  const { tenant, program } = pickFixture();

  it('returns the five canonical guided choices in deterministic order', () => {
    const choices = buildProgramNexusRailChoices(tenant, program);
    expect(choices.map((c) => c.id)).toEqual([
      'walk-charter',
      'pressure-test',
      'surface-contradictions',
      'phase-readiness',
      'next-step',
    ]);
  });

  it('every choice has a label and a sub-line', () => {
    const choices = buildProgramNexusRailChoices(tenant, program);
    for (const c of choices) {
      expect(c.label.length).toBeGreaterThan(0);
      expect(c.sub.length).toBeGreaterThan(0);
    }
  });

  it('returns identical choices across repeated calls', () => {
    const a = buildProgramNexusRailChoices(tenant, program);
    const b = buildProgramNexusRailChoices(tenant, program);
    expect(a).toEqual(b);
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('Module hygiene', () => {
  it('does not import legacy /programs, mock.ts, preview, demo, Source UI, or Nexus runtime', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path');
    const sources = [
      path.resolve(__dirname, '../../../lib/programs/programs-nexus-rail-view.ts'),
      path.resolve(__dirname, '../../../components/deliverables/NexusProgramRail.tsx'),
    ];
    for (const src of sources) {
      const content = fs.readFileSync(src, 'utf8');
      expect(content).not.toMatch(/from '@\/lib\/programs\/mock'/);
      expect(content).not.toMatch(/from '@\/app\/programs\//);
      expect(content).not.toMatch(/from '@\/app\/\(maestro\)\/preview\//);
      expect(content).not.toMatch(/from '@\/app\/demo\//);
      expect(content).not.toMatch(/from '@\/lib\/source\//);
      expect(content).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
      expect(content).not.toMatch(/from '@\/lib\/nexus\//);
    }
  });
});

// ---------------------------------------------------------------------
// Cross-tenant determinism · all four canonical demo tenants
// ---------------------------------------------------------------------

describe('Cross-tenant determinism', () => {
  it.each(plan.tenants.map((t) => [t.tenantKey, t]))(
    'produces a stable RenderedResponse for the first program of %s',
    (_key, tenant) => {
      if ((tenant as TenantSeedPlan).programs.length === 0) {
        return;
      }
      const program = (tenant as TenantSeedPlan).programs[0];
      const a = buildProgramNexusRenderedResponse(tenant as TenantSeedPlan, program, 'opener');
      const b = buildProgramNexusRenderedResponse(tenant as TenantSeedPlan, program, 'opener');
      expect(a.rendered).toEqual(b.rendered);
      expect(a.metadata.confidenceLevel).toBeDefined();
    },
  );
});
