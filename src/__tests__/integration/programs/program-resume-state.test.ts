// PROG7 · Program Resume State Read Model tests.

import { readFileSync } from 'fs';
import { join } from 'path';

import {
  buildAllProgramResumeStates,
  buildProgramResumeState,
  getBlockedResumeItems,
  getNextResumeAction,
  summarizeProgramResumeState,
  type ProgramResumeOpenItem,
  type ProgramResumeState,
} from '@/lib/programs/program-resume-state';
import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';

const plan = buildAllProgramsSeedPlan();

// ---------------------------------------------------------------------
// Determinism + per-program output
// ---------------------------------------------------------------------

describe('buildProgramResumeState · determinism', () => {
  it('returns deterministic output across repeated calls for every (tenant, program) pair', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const a = buildProgramResumeState(tenant, program);
        const b = buildProgramResumeState(tenant, program);
        expect(a).toEqual(b);
      }
    }
  });

  it('every demo program has a resume state', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const state = buildProgramResumeState(tenant, program);
        expect(state).toBeDefined();
        expect(state.id).toBe(
          `prog-resume:${tenant.tenantKey}:${program.programSlug}`,
        );
      }
    }
  });

  it('all four canonical demo tenants surface resume states', () => {
    expect(plan.tenants.length).toBeGreaterThanOrEqual(4);
    const states = buildAllProgramResumeStates(plan.tenants);
    const tenantKeys = new Set(states.map((s) => s.tenantKey));
    for (const tenant of plan.tenants) {
      expect(tenantKeys.has(tenant.tenantKey)).toBe(true);
    }
  });

  it('every state carries the canonical createdFrom literal', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const state = buildProgramResumeState(tenant, program);
        expect(state.createdFrom).toBe('deterministic_program_seed');
      }
    }
  });
});

// ---------------------------------------------------------------------
// Required field set / shape
// ---------------------------------------------------------------------

describe('ProgramResumeState shape', () => {
  it('every state carries the required field set', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const state = buildProgramResumeState(tenant, program);
        expect(typeof state.id).toBe('string');
        expect(state.id.length).toBeGreaterThan(0);
        expect(state.tenantKey).toBe(tenant.tenantKey);
        expect(state.tenantName).toBe(tenant.displayName);
        expect(state.programCode).toBe(program.code);
        expect(state.programSlug).toBe(program.programSlug);
        expect(state.programName).toBe(program.name);
        expect(state.lastActivePhase).toBeDefined();
        expect(typeof state.lastActivePhase.label).toBe('string');
        expect(state.lastActivePhase.index).toBeGreaterThanOrEqual(1);
        expect(state.lastActivePhase.index).toBeLessThanOrEqual(6);
      }
    }
  });

  it('id format prog-resume:<tenantKey>:<programSlug>', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const state = buildProgramResumeState(tenant, program);
        expect(state.id).toBe(
          `prog-resume:${tenant.tenantKey}:${program.programSlug}`,
        );
      }
    }
  });

  it('resume state ids are unique across the portfolio', () => {
    const states = buildAllProgramResumeStates(plan.tenants);
    const ids = states.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('confidence band is one of low / medium / high', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const state = buildProgramResumeState(tenant, program);
        expect(['low', 'medium', 'high']).toContain(state.resumeConfidence);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Last active workshop checkpoint
// ---------------------------------------------------------------------

describe('lastActiveWorkshop checkpoint', () => {
  it('is non-null for every active program', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        if (program.status !== 'active') continue;
        const state = buildProgramResumeState(tenant, program);
        expect(state.lastActiveWorkshop).not.toBeNull();
      }
    }
  });

  it('checkpoint references a real workshop type when present', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const state = buildProgramResumeState(tenant, program);
        if (state.lastActiveWorkshop === null) continue;
        expect(state.lastActiveWorkshop.workshopId).toContain('ws:');
        expect(state.lastActiveWorkshop.workshopId).toContain(
          tenant.tenantKey,
        );
        expect(state.lastActiveWorkshop.workshopId).toContain(
          program.programSlug,
        );
        expect(typeof state.lastActiveWorkshop.workshopTitle).toBe('string');
        expect(state.lastActiveWorkshop.workshopTitle.length).toBeGreaterThan(
          0,
        );
        expect(
          state.lastActiveWorkshop.tiesToPhaseSpec,
        ).toBeGreaterThanOrEqual(1);
        expect(state.lastActiveWorkshop.tiesToPhaseSpec).toBeLessThanOrEqual(
          5,
        );
      }
    }
  });
});

// ---------------------------------------------------------------------
// Last viewed artifact
// ---------------------------------------------------------------------

describe('lastViewedArtifact', () => {
  it('is non-null when the program has at least one deliverable', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        if (program.deliverables.length === 0) continue;
        const state = buildProgramResumeState(tenant, program);
        expect(state.lastViewedArtifact).not.toBeNull();
      }
    }
  });

  it('artifact carries non-empty label, routePath, and reason when present', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const state = buildProgramResumeState(tenant, program);
        if (state.lastViewedArtifact === null) continue;
        expect(state.lastViewedArtifact.label.length).toBeGreaterThan(0);
        expect(state.lastViewedArtifact.routePath.length).toBeGreaterThan(0);
        expect(state.lastViewedArtifact.reason.length).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Open items (actions / questions / gaps / gates / drafts)
// ---------------------------------------------------------------------

describe('open items captured', () => {
  it('every active program produces at least one open action OR open question', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        if (program.status !== 'active') continue;
        const state = buildProgramResumeState(tenant, program);
        const total =
          state.openActions.length + state.openQuestions.length;
        expect(total).toBeGreaterThan(0);
      }
    }
  });

  it('every active program records at least one unresolved evidence gap', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        if (program.status !== 'active') continue;
        const state = buildProgramResumeState(tenant, program);
        expect(state.unresolvedEvidenceGaps.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('every active program records at least one pending gate check', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        if (program.status !== 'active') continue;
        const state = buildProgramResumeState(tenant, program);
        expect(state.pendingGateChecks.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('every open item carries id, kind, description, status, and reason', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const state = buildProgramResumeState(tenant, program);
        const all: ProgramResumeOpenItem[] = [
          ...state.openActions,
          ...state.openQuestions,
          ...state.unresolvedEvidenceGaps,
          ...state.pendingGateChecks,
          ...state.draftDeliverables,
        ];
        for (const item of all) {
          expect(typeof item.id).toBe('string');
          expect(item.id.length).toBeGreaterThan(0);
          expect([
            'open_action',
            'open_question',
            'evidence_gap',
            'pending_gate_check',
            'draft_deliverable',
          ]).toContain(item.kind);
          expect(typeof item.description).toBe('string');
          expect(item.description.length).toBeGreaterThan(0);
          expect(['open', 'in_progress', 'blocked', 'unknown']).toContain(
            item.status,
          );
          expect(typeof item.reason).toBe('string');
          expect(item.reason.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('open item ids are unique within a single resume state', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const state = buildProgramResumeState(tenant, program);
        const all: ProgramResumeOpenItem[] = [
          ...state.openActions,
          ...state.openQuestions,
          ...state.unresolvedEvidenceGaps,
          ...state.pendingGateChecks,
          ...state.draftDeliverables,
        ];
        const ids = all.map((i) => i.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });

  it('items with kind open_action come from openActions and have action-shaped status', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const state = buildProgramResumeState(tenant, program);
        for (const action of state.openActions) {
          expect(action.kind).toBe('open_action');
          expect(['open', 'in_progress']).toContain(action.status);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------
// Next recommended action
// ---------------------------------------------------------------------

describe('nextRecommendedAction', () => {
  it('is present and non-empty for every program', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const state = buildProgramResumeState(tenant, program);
        expect(state.nextRecommendedAction).toBeDefined();
        expect(state.nextRecommendedAction.label.length).toBeGreaterThan(0);
        expect(state.nextRecommendedAction.routePath.length).toBeGreaterThan(
          0,
        );
        expect(state.nextRecommendedAction.reason.length).toBeGreaterThan(0);
      }
    }
  });

  it('getNextResumeAction helper returns the same label', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const state = buildProgramResumeState(tenant, program);
        expect(getNextResumeAction(state)).toBe(
          state.nextRecommendedAction.label,
        );
      }
    }
  });

  it('routePath points to the program detail route for active programs', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        if (program.status !== 'active') continue;
        const state = buildProgramResumeState(tenant, program);
        expect(state.nextRecommendedAction.routePath).toBe(program.routePath);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Blocked resume items helper
// ---------------------------------------------------------------------

describe('getBlockedResumeItems', () => {
  it('returns only items with status blocked', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const state = buildProgramResumeState(tenant, program);
        const blocked = getBlockedResumeItems(state);
        for (const item of blocked) {
          expect(item.status).toBe('blocked');
        }
      }
    }
  });

  it('does not promote unknown-status items to blocked', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const state = buildProgramResumeState(tenant, program);
        const blocked = getBlockedResumeItems(state);
        for (const item of blocked) {
          expect(item.status).not.toBe('unknown');
        }
      }
    }
  });
});

// ---------------------------------------------------------------------
// Aggregate summary reconciliation
// ---------------------------------------------------------------------

describe('summarizeProgramResumeState', () => {
  it('totalCount reconciles to the supplied list length', () => {
    const states = buildAllProgramResumeStates(plan.tenants);
    const summary = summarizeProgramResumeState(states);
    expect(summary.totalCount).toBe(states.length);
  });

  it('byConfidence reconciles to totalCount', () => {
    const states = buildAllProgramResumeStates(plan.tenants);
    const summary = summarizeProgramResumeState(states);
    const sum =
      summary.byConfidence.low +
      summary.byConfidence.medium +
      summary.byConfidence.high;
    expect(sum).toBe(summary.totalCount);
  });

  it('perTenant counts sum to totalCount', () => {
    const states = buildAllProgramResumeStates(plan.tenants);
    const summary = summarizeProgramResumeState(states);
    const sumPerTenant = summary.perTenant.reduce(
      (acc, t) => acc + t.count,
      0,
    );
    expect(sumPerTenant).toBe(summary.totalCount);
  });

  it('perTenant entries reference real demo tenants', () => {
    const states = buildAllProgramResumeStates(plan.tenants);
    const summary = summarizeProgramResumeState(states);
    const tenantKeys = new Set(plan.tenants.map((t) => t.tenantKey));
    for (const t of summary.perTenant) {
      expect(tenantKeys.has(t.tenantKey)).toBe(true);
    }
  });

  it('summary on empty array is zeroed', () => {
    const summary = summarizeProgramResumeState([]);
    expect(summary.totalCount).toBe(0);
    expect(summary.byConfidence.low).toBe(0);
    expect(summary.byConfidence.medium).toBe(0);
    expect(summary.byConfidence.high).toBe(0);
    expect(summary.totalOpenActions).toBe(0);
    expect(summary.totalOpenQuestions).toBe(0);
    expect(summary.totalUnresolvedEvidenceGaps).toBe(0);
    expect(summary.totalPendingGateChecks).toBe(0);
    expect(summary.totalDraftDeliverables).toBe(0);
    expect(summary.perTenant.length).toBe(0);
  });

  it('total open-item counts reconcile across the resume states', () => {
    const states: ProgramResumeState[] = buildAllProgramResumeStates(
      plan.tenants,
    ) as ProgramResumeState[];
    const summary = summarizeProgramResumeState(states);
    let actions = 0;
    let questions = 0;
    let gaps = 0;
    let gates = 0;
    let drafts = 0;
    for (const s of states) {
      actions += s.openActions.length;
      questions += s.openQuestions.length;
      gaps += s.unresolvedEvidenceGaps.length;
      gates += s.pendingGateChecks.length;
      drafts += s.draftDeliverables.length;
    }
    expect(summary.totalOpenActions).toBe(actions);
    expect(summary.totalOpenQuestions).toBe(questions);
    expect(summary.totalUnresolvedEvidenceGaps).toBe(gaps);
    expect(summary.totalPendingGateChecks).toBe(gates);
    expect(summary.totalDraftDeliverables).toBe(drafts);
  });
});

// ---------------------------------------------------------------------
// No fabrication
// ---------------------------------------------------------------------

describe('no fabrication', () => {
  it('no string field invents a dollar amount', () => {
    const dollarPattern = /\$\s?\d/;
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const state = buildProgramResumeState(tenant, program);
        const fields = collectStringFields(state);
        for (const f of fields) {
          expect(f).not.toMatch(dollarPattern);
        }
      }
    }
  });

  it('no string field claims a real E-### evidence citation', () => {
    const eidPattern = /\bE-\d{2,}\b/;
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const state = buildProgramResumeState(tenant, program);
        const fields = collectStringFields(state);
        for (const f of fields) {
          expect(f).not.toMatch(eidPattern);
        }
      }
    }
  });

  it('no item carries a fake completed decision (no status === "completed")', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const state = buildProgramResumeState(tenant, program);
        const all: ProgramResumeOpenItem[] = [
          ...state.openActions,
          ...state.openQuestions,
          ...state.unresolvedEvidenceGaps,
          ...state.pendingGateChecks,
          ...state.draftDeliverables,
        ];
        for (const item of all) {
          // The status union explicitly excludes `'completed'`, but
          // double-check against accidental literal usage.
          expect(item.status as string).not.toBe('completed');
          expect(item.reason).not.toMatch(/decision (signed|approved)/i);
        }
      }
    }
  });

  it('items the seed cannot derive surface as status: unknown', () => {
    let sawUnknown = false;
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const state = buildProgramResumeState(tenant, program);
        const all: ProgramResumeOpenItem[] = [
          ...state.openActions,
          ...state.openQuestions,
          ...state.unresolvedEvidenceGaps,
          ...state.pendingGateChecks,
          ...state.draftDeliverables,
        ];
        if (all.some((i) => i.status === 'unknown')) {
          sawUnknown = true;
        }
      }
    }
    // At least one demo program must surface an unknown status,
    // because evidence is honestly not seeded across the portfolio.
    expect(sawUnknown).toBe(true);
  });
});

// ---------------------------------------------------------------------
// Module hygiene · no fake timestamps, no banned APIs, no banned imports
// ---------------------------------------------------------------------

describe('module hygiene · program-resume-state.ts', () => {
  const filePath = join(
    process.cwd(),
    'src/lib/programs/program-resume-state.ts',
  );
  const source = readFileSync(filePath, 'utf8');
  const codeOnly = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  it('does not call Date.now / Math.random / new Date', () => {
    expect(codeOnly).not.toMatch(/\bDate\.now\(/);
    expect(codeOnly).not.toMatch(/\bMath\.random\(/);
    expect(codeOnly).not.toMatch(/\bnew Date\(/);
  });

  it('does not call fetch', () => {
    expect(codeOnly).not.toMatch(/\bfetch\(/);
  });

  it('does not invoke Anthropic / OpenAI runtime', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
  });

  it('does not import Source UI', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
  });

  it('does not import Sentinel / Atlas / Nexus / Agent runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/components\/agent\//);
  });

  it('does not import legacy /programs routes, mock.ts, auth, or supabase', () => {
    expect(codeOnly).not.toMatch(/from '@\/app\/programs\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
  });

  it('contains no placeholder strings', () => {
    expect(source).not.toContain('Coming soon');
    expect(source).not.toContain('TBD');
    expect(source).not.toContain('Lorem ipsum');
  });
});

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function collectStringFields(state: ProgramResumeState): string[] {
  const out: string[] = [
    state.id,
    state.tenantKey,
    state.tenantName,
    state.programCode,
    state.programSlug,
    state.programName,
    state.lastActivePhase.label,
    state.lastActivePhase.summary,
    state.nextRecommendedAction.label,
    state.nextRecommendedAction.routePath,
    state.nextRecommendedAction.reason,
  ];
  if (state.lastActiveWorkshop) {
    out.push(state.lastActiveWorkshop.workshopTitle);
    out.push(state.lastActiveWorkshop.workshopId);
  }
  if (state.lastViewedArtifact) {
    out.push(state.lastViewedArtifact.label);
    out.push(state.lastViewedArtifact.routePath);
    out.push(state.lastViewedArtifact.reason);
  }
  for (const item of [
    ...state.openActions,
    ...state.openQuestions,
    ...state.unresolvedEvidenceGaps,
    ...state.pendingGateChecks,
    ...state.draftDeliverables,
  ]) {
    out.push(item.id, item.description, item.reason);
  }
  return out;
}
