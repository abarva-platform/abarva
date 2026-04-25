// MW2 · Workshop Readiness Read Model tests.

import {
  buildNextRecommendedWorkshop,
  buildWorkshopReadinessForProgram,
  summarizeWorkshopReadiness,
  WORKSHOP_PARTICIPANT_ROLES_IN_ORDER,
  WORKSHOP_TYPES_IN_ORDER,
  type WorkshopReadiness,
  type WorkshopType,
} from '@/lib/programs/workshop-readiness';
import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';

const plan = buildAllProgramsSeedPlan();

// ---------------------------------------------------------------------
// Determinism + per-program output
// ---------------------------------------------------------------------

describe('buildWorkshopReadinessForProgram · determinism', () => {
  it('returns deterministic output across repeated calls for every (tenant, program) pair', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const a = buildWorkshopReadinessForProgram(tenant, program);
        const b = buildWorkshopReadinessForProgram(tenant, program);
        expect(a).toEqual(b);
      }
    }
  });

  it('every program has at least one workshop readiness record', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const list = buildWorkshopReadinessForProgram(tenant, program);
        expect(list.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('every program produces at least three workshop readiness records when active', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        if (program.status !== 'active') continue;
        const list = buildWorkshopReadinessForProgram(tenant, program);
        expect(list.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('all four canonical demo tenants surface workshops', () => {
    expect(plan.tenants.length).toBeGreaterThanOrEqual(4);
    for (const tenant of plan.tenants) {
      const collected: WorkshopReadiness[] = [];
      for (const program of tenant.programs) {
        const list = buildWorkshopReadinessForProgram(tenant, program);
        collected.push(...list);
      }
      expect(collected.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------
// Required field set / shape
// ---------------------------------------------------------------------

describe('WorkshopReadiness shape', () => {
  it('every record carries the required field set', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          expect(typeof ws.id).toBe('string');
          expect(ws.id.length).toBeGreaterThan(0);
          expect(ws.tenantKey).toBe(tenant.tenantKey);
          expect(ws.tenantName).toBe(tenant.displayName);
          expect(ws.programCode).toBe(program.code);
          expect(ws.programSlug).toBe(program.programSlug);
          expect(WORKSHOP_TYPES_IN_ORDER).toContain(ws.type);
          expect(typeof ws.title).toBe('string');
          expect(ws.title.length).toBeGreaterThan(0);
          expect(typeof ws.objective.text).toBe('string');
          expect(ws.objective.text.length).toBeGreaterThan(0);
          expect(ws.objective.ties_to_phase_spec).toBeGreaterThanOrEqual(1);
          expect(ws.objective.ties_to_phase_spec).toBeLessThanOrEqual(5);
          expect(typeof ws.nexusPreparationBrief).toBe('string');
          expect(ws.nexusPreparationBrief.length).toBeGreaterThan(0);
          expect(typeof ws.stewardGateImplication).toBe('string');
          expect(ws.stewardGateImplication.length).toBeGreaterThan(0);
          expect(ws.createdFrom).toBe('deterministic_program_seed');
        }
      }
    }
  });

  it('id format ws:<tenantKey>:<programSlug>:<type>', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          expect(ws.id).toBe(`ws:${tenant.tenantKey}:${program.programSlug}:${ws.type}`);
        }
      }
    }
  });

  it('workshop ids are unique within a single program list', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const list = buildWorkshopReadinessForProgram(tenant, program);
        const ids = list.map((w) => w.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });

  it('workshop types are unique within a single program list', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const list = buildWorkshopReadinessForProgram(tenant, program);
        const types = list.map((w) => w.type);
        expect(new Set(types).size).toBe(types.length);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Required attendees + optional SMEs
// ---------------------------------------------------------------------

describe('attendee composition', () => {
  it('requiredAttendees always contains client_maestro', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          const roles = ws.requiredAttendees.map((a) => a.role);
          expect(roles).toContain('client_maestro');
        }
      }
    }
  });

  it('every required attendee carries a non-empty reason', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          for (const a of ws.requiredAttendees) {
            expect(typeof a.reason).toBe('string');
            expect(a.reason.length).toBeGreaterThan(0);
            expect(WORKSHOP_PARTICIPANT_ROLES_IN_ORDER).toContain(a.role);
          }
        }
      }
    }
  });

  it('optionalSmes are drawn from {abarva_sme, abarva_consultant}', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          for (const sme of ws.optionalSmes) {
            expect(['abarva_sme', 'abarva_consultant']).toContain(sme.role);
            expect(typeof sme.reason).toBe('string');
            expect(sme.reason.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it('every workshop has at least one optional SME entry', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          expect(ws.optionalSmes.length).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });

  it('every workshop has at least three required attendees including the maestro', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          expect(ws.requiredAttendees.length).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------
// Agenda / pre-read / questions / outputs / evidence
// ---------------------------------------------------------------------

describe('content composition', () => {
  it('every workshop has at least one questionsToAsk entry', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          expect(ws.questionsToAsk.length).toBeGreaterThanOrEqual(1);
          for (const q of ws.questionsToAsk) {
            expect(typeof q).toBe('string');
            expect(q.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it('every workshop has at least one expectedOutputs entry', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          expect(ws.expectedOutputs.length).toBeGreaterThanOrEqual(1);
          for (const o of ws.expectedOutputs) {
            expect(typeof o.kind).toBe('string');
            expect(typeof o.description).toBe('string');
            expect(o.description.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it('every workshop has at least one preReadList entry', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          expect(ws.preReadList.length).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });

  it('agenda entries are positive integers and total to a sane workshop window', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          expect(ws.agenda.length).toBeGreaterThanOrEqual(3);
          let total = 0;
          for (const a of ws.agenda) {
            expect(Number.isInteger(a.minutes)).toBe(true);
            expect(a.minutes).toBeGreaterThan(0);
            expect(typeof a.activity).toBe('string');
            expect(a.activity.length).toBeGreaterThan(0);
            total += a.minutes;
          }
          // 30 minutes minimum, 4 hours maximum is the sane window.
          expect(total).toBeGreaterThanOrEqual(30);
          expect(total).toBeLessThanOrEqual(240);
        }
      }
    }
  });

  it('every workshop has at least one likelyTensions and one decisionsNeeded entry', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          expect(ws.likelyTensions.length).toBeGreaterThanOrEqual(1);
          expect(ws.decisionsNeeded.length).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------
// Evidence to capture
// ---------------------------------------------------------------------

describe('evidenceToCapture invariants', () => {
  it('every workshop has at least two evidenceToCapture entries', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          expect(ws.evidenceToCapture.length).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });

  it('every workshop has at least one required evidence entry and at least one optional entry', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          const hasRequired = ws.evidenceToCapture.some((e) => e.required === true);
          const hasOptional = ws.evidenceToCapture.some((e) => e.required === false);
          expect(hasRequired).toBe(true);
          expect(hasOptional).toBe(true);
        }
      }
    }
  });

  it('every evidence entry carries a non-empty label and reason', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          for (const e of ws.evidenceToCapture) {
            expect(typeof e.label).toBe('string');
            expect(e.label.length).toBeGreaterThan(0);
            expect(typeof e.reason).toBe('string');
            expect(e.reason.length).toBeGreaterThan(0);
            expect(typeof e.required).toBe('boolean');
          }
        }
      }
    }
  });
});

// ---------------------------------------------------------------------
// Risks
// ---------------------------------------------------------------------

describe('risks', () => {
  it('every workshop has at least one risk with a known severity', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          expect(ws.risks.length).toBeGreaterThanOrEqual(1);
          for (const r of ws.risks) {
            expect(typeof r.id).toBe('string');
            expect(r.id.length).toBeGreaterThan(0);
            expect(typeof r.description).toBe('string');
            expect(r.description.length).toBeGreaterThan(0);
            expect(['low', 'medium', 'high']).toContain(r.severity);
          }
        }
      }
    }
  });

  it('risk ids are unique within a workshop', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          const ids = ws.risks.map((r) => r.id);
          expect(new Set(ids).size).toBe(ids.length);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------
// Next-recommended workshop
// ---------------------------------------------------------------------

describe('buildNextRecommendedWorkshop', () => {
  it('returns non-null for every active program', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        if (program.status !== 'active') continue;
        const next = buildNextRecommendedWorkshop(tenant, program);
        expect(next).not.toBeNull();
      }
    }
  });

  it('is deterministic across repeated calls', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const a = buildNextRecommendedWorkshop(tenant, program);
        const b = buildNextRecommendedWorkshop(tenant, program);
        expect(a).toEqual(b);
      }
    }
  });

  it('returns a workshop drawn from the program list when non-null', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const list = buildWorkshopReadinessForProgram(tenant, program);
        const next = buildNextRecommendedWorkshop(tenant, program);
        if (next === null) continue;
        expect(list).toContainEqual(next);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Summary reconciliation
// ---------------------------------------------------------------------

describe('summarizeWorkshopReadiness', () => {
  it('byType counts sum to totalCount', () => {
    const all: WorkshopReadiness[] = [];
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        all.push(...buildWorkshopReadinessForProgram(tenant, program));
      }
    }
    const summary = summarizeWorkshopReadiness(all);
    const sumByType = Object.values(summary.byType).reduce((a, b) => a + b, 0);
    expect(summary.totalCount).toBe(all.length);
    expect(sumByType).toBe(all.length);
  });

  it('perTenant counts sum to totalCount', () => {
    const all: WorkshopReadiness[] = [];
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        all.push(...buildWorkshopReadinessForProgram(tenant, program));
      }
    }
    const summary = summarizeWorkshopReadiness(all);
    const sumPerTenant = summary.perTenant.reduce((a, t) => a + t.count, 0);
    expect(sumPerTenant).toBe(all.length);
  });

  it('perTenant entries reference real demo tenants', () => {
    const all: WorkshopReadiness[] = [];
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        all.push(...buildWorkshopReadinessForProgram(tenant, program));
      }
    }
    const summary = summarizeWorkshopReadiness(all);
    const tenantKeys = new Set(plan.tenants.map((t) => t.tenantKey));
    for (const t of summary.perTenant) {
      expect(tenantKeys.has(t.tenantKey)).toBe(true);
    }
  });

  it('summary on empty array is zeroed across the byType record', () => {
    const summary = summarizeWorkshopReadiness([]);
    expect(summary.totalCount).toBe(0);
    for (const t of WORKSHOP_TYPES_IN_ORDER) {
      const key = t as WorkshopType;
      expect(summary.byType[key]).toBe(0);
    }
    expect(summary.perTenant.length).toBe(0);
  });
});

// ---------------------------------------------------------------------
// No fabrication
// ---------------------------------------------------------------------

describe('no fabrication', () => {
  it('every record carries createdFrom: deterministic_program_seed', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          expect(ws.createdFrom).toBe('deterministic_program_seed');
        }
      }
    }
  });

  it('no string field invents a dollar amount', () => {
    const dollarPattern = /\$\s?\d/;
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          const fields: string[] = [
            ws.title,
            ws.objective.text,
            ws.nexusPreparationBrief,
            ws.stewardGateImplication,
            ...ws.preReadList,
            ...ws.questionsToAsk,
            ...ws.likelyTensions,
            ...ws.decisionsNeeded,
            ...ws.requiredAttendees.map((a) => a.reason),
            ...ws.optionalSmes.map((a) => a.reason),
            ...ws.agenda.map((a) => a.activity),
            ...ws.evidenceToCapture.flatMap((e) => [e.label, e.reason]),
            ...ws.expectedOutputs.map((o) => o.description),
            ...ws.risks.map((r) => r.description),
          ];
          for (const f of fields) {
            expect(f).not.toMatch(dollarPattern);
          }
        }
      }
    }
  });

  it('no string field claims a real E-### evidence citation', () => {
    const eidPattern = /\bE-\d{2,}\b/;
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          const fields = [
            ws.title,
            ws.objective.text,
            ws.nexusPreparationBrief,
            ws.stewardGateImplication,
            ...ws.evidenceToCapture.flatMap((e) => [e.label, e.reason]),
            ...ws.expectedOutputs.map((o) => o.description),
          ];
          for (const f of fields) {
            expect(f).not.toMatch(eidPattern);
          }
        }
      }
    }
  });
});

// ---------------------------------------------------------------------
// Steward gate implication invariants
// ---------------------------------------------------------------------

describe('stewardGateImplication invariants', () => {
  it('phase 4 (Execute) workshops honestly state no canonical hard gate is at risk', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        if (program.currentPhaseSpec !== 4) continue;
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          expect(ws.stewardGateImplication.toLowerCase()).toContain(
            'no canonical hard gate is at risk',
          );
        }
      }
    }
  });

  it('phase 1/2/3/5 workshops name a canonical gate G1..G4', () => {
    const gatePattern = /\bG[1-4]\b/;
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        if (program.currentPhaseSpec === 4) continue;
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          expect(ws.stewardGateImplication).toMatch(gatePattern);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene · workshop-readiness.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/programs/workshop-readiness.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');

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
