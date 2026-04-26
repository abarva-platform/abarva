// MW6 · SME Recommendation Panel tests.

import {
  SME_PARTICIPATION_MODES_IN_ORDER,
  SME_READINESS_IN_ORDER,
  SME_ROLES_IN_ORDER,
  buildSmeRecommendationsForProgram,
  buildSmeRecommendationsForWorkshop,
  summarizeSmeRecommendations,
  type SmeRecommendation,
  type SmeRole,
} from '@/lib/programs/sme-recommendations';
import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';
import {
  buildNextRecommendedWorkshop,
  buildWorkshopReadinessForProgram,
} from '@/lib/programs/workshop-readiness';

const plan = buildAllProgramsSeedPlan();

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('buildSmeRecommendationsForWorkshop · determinism', () => {
  it('returns deterministic output across repeated calls for every workshop', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          const a = buildSmeRecommendationsForWorkshop(ws);
          const b = buildSmeRecommendationsForWorkshop(ws);
          expect(a).toEqual(b);
        }
      }
    }
  });

  it('every workshop produces at least three SME recommendations', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          const recs = buildSmeRecommendationsForWorkshop(ws);
          expect(recs.length).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });
});

describe('buildSmeRecommendationsForProgram · determinism', () => {
  it('returns deterministic output across repeated calls for every program', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const a = buildSmeRecommendationsForProgram(tenant, program);
        const b = buildSmeRecommendationsForProgram(tenant, program);
        expect(a).toEqual(b);
      }
    }
  });

  it('every program produces at least two SME recommendations (maestro pair minimum)', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const recs = buildSmeRecommendationsForProgram(tenant, program);
        expect(recs.length).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Required field set
// ---------------------------------------------------------------------

describe('SmeRecommendation shape', () => {
  it('every recommendation has role/reason/participation mode and the deterministic source', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const recs = buildSmeRecommendationsForProgram(tenant, program);
        for (const rec of recs) {
          expect(typeof rec.id).toBe('string');
          expect(rec.id.length).toBeGreaterThan(0);
          expect(rec.tenantKey).toBe(tenant.tenantKey);
          expect(rec.programCode).toBe(program.code);
          expect(rec.programSlug).toBe(program.programSlug);
          expect(SME_ROLES_IN_ORDER).toContain(rec.role);
          expect(typeof rec.roleLabel).toBe('string');
          expect(rec.roleLabel.length).toBeGreaterThan(0);
          expect(['client', 'abarva']).toContain(rec.organization);
          expect(SME_PARTICIPATION_MODES_IN_ORDER).toContain(rec.participationMode);
          expect(SME_READINESS_IN_ORDER).toContain(rec.readiness);
          expect(typeof rec.whyNeeded).toBe('string');
          expect(rec.whyNeeded.length).toBeGreaterThan(0);
          expect(rec.reason).toBeTruthy();
          expect(typeof rec.reason.phaseRationale).toBe('string');
          expect(rec.reason.phaseRationale.length).toBeGreaterThan(0);
          expect(Array.isArray(rec.suggestedFocus)).toBe(true);
          expect(rec.suggestedFocus.length).toBeGreaterThanOrEqual(1);
          for (const focus of rec.suggestedFocus) {
            expect(typeof focus).toBe('string');
            expect(focus.length).toBeGreaterThan(0);
          }
          expect(rec.createdFrom).toBe('deterministic_sme_recommendation_seed');
        }
      }
    }
  });

  it('every workshop-scoped recommendation references a workshop id and type', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          const recs = buildSmeRecommendationsForWorkshop(ws);
          for (const rec of recs) {
            expect(rec.workshopId).toBe(ws.id);
            expect(rec.workshopType).toBe(ws.type);
          }
        }
      }
    }
  });

  it('program-level recommendations drop the workshop linkage', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const recs = buildSmeRecommendationsForProgram(tenant, program);
        for (const rec of recs) {
          expect(rec.workshopId).toBeNull();
          expect(rec.workshopType).toBeNull();
        }
      }
    }
  });

  it('every workshop-scoped recommendation set always names the Client Maestro and AbarVa Maestro', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          const recs = buildSmeRecommendationsForWorkshop(ws);
          const roles = recs.map((r) => r.role);
          expect(roles).toContain('client_maestro');
          expect(roles).toContain('abarva_maestro');
        }
      }
    }
  });

  it('id format ws-scoped recommendations follow sme:<tenantKey>:<programSlug>:<workshopType>:<role>', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          for (const rec of buildSmeRecommendationsForWorkshop(ws)) {
            expect(rec.id).toBe(
              `sme:${ws.tenantKey}:${ws.programSlug}:${ws.type}:${rec.role}`,
            );
          }
        }
      }
    }
  });

  it('roles are unique within a single workshop recommendation set', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          const recs = buildSmeRecommendationsForWorkshop(ws);
          const roles = recs.map((r) => r.role);
          expect(new Set(roles).size).toBe(roles.length);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------
// Workshop vs program-level differentiation
// ---------------------------------------------------------------------

describe('workshop vs program-level recommendations', () => {
  it('workshop-specific recommendations differ from program-level recommendations on at least one field', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const next = buildNextRecommendedWorkshop(tenant, program);
        if (next === null) continue;
        const wsRecs = buildSmeRecommendationsForWorkshop(next);
        const programRecs = buildSmeRecommendationsForProgram(tenant, program);
        // Same role roster but the linkage / id fields differ.
        const wsRoles = wsRecs.map((r) => r.role);
        const programRoles = programRecs.map((r) => r.role);
        expect(programRoles).toEqual(wsRoles);
        // Differ on workshopId at minimum.
        for (let i = 0; i < wsRecs.length; i += 1) {
          const ws = wsRecs[i];
          const prog = programRecs[i];
          expect(ws.workshopId).not.toBe(prog.workshopId);
          expect(ws.workshopType).not.toBe(prog.workshopType);
          expect(ws.id).not.toBe(prog.id);
        }
      }
    }
  });

  it('the recommendation set differs across workshops within a single program', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const list = buildWorkshopReadinessForProgram(tenant, program);
        if (list.length < 2) continue;
        const setsByWorkshop = list.map((ws) =>
          buildSmeRecommendationsForWorkshop(ws).map((r) => r.role).join(','),
        );
        // Workshops within a program must produce at least two distinct
        // role rosters.
        expect(new Set(setsByWorkshop).size).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Reason / evidence linkage
// ---------------------------------------------------------------------

describe('reason composition', () => {
  it('every workshop-scoped recommendation set carries at least one evidence-anchored reason', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          const recs = buildSmeRecommendationsForWorkshop(ws);
          const evidenceAnchored = recs.filter(
            (r) => typeof r.reason.evidenceGap === 'string' && r.reason.evidenceGap.length > 0,
          );
          expect(evidenceAnchored.length).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });

  it('every workshop-scoped recommendation set carries a failure-mode anchor on at least one reason', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const ws of buildWorkshopReadinessForProgram(tenant, program)) {
          const recs = buildSmeRecommendationsForWorkshop(ws);
          const failureAnchored = recs.filter(
            (r) => typeof r.reason.failureModeKey === 'string' && r.reason.failureModeKey.length > 0,
          );
          expect(failureAnchored.length).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------
// No real person names — roles only
// ---------------------------------------------------------------------

describe('no real person names', () => {
  it('no string field invents a real person name token', () => {
    // Heuristic: a "real person name" token is a two-token capitalized
    // sequence like "Jane Smith" that is not part of a known role label
    // or proper noun whitelist (AbarVa, Nexus, Sentinel, Atlas, Steward,
    // Maestro, Client, Vendor, Startup, Solution Architect, Workflow
    // Owner, Value Lead, Domain SME, Data Architect, Security and
    // Governance Lead, Change and Adoption Lead, Engineering
    // Productivity Lead, Clinical SME, AbarVa Maestro, Client Maestro).
    const whitelist = new Set([
      'AbarVa',
      'AbarVa Maestro',
      'Atlas',
      'Change',
      'Change and Adoption Lead',
      'Client',
      'Client Maestro',
      'Clinical',
      'Clinical SME',
      'Data',
      'Data Architect',
      'Domain',
      'Domain SME',
      'Engineering',
      'Engineering Productivity Lead',
      'Maestro',
      'Nexus',
      'Security',
      'Security and Governance Lead',
      'Sentinel',
      'Solution',
      'Solution Architect',
      'Startup',
      'Steward',
      'Value',
      'Value Lead',
      'Vendor',
      'Vendor and Startup Expert',
      'Workflow',
      'Workflow Owner',
    ]);
    const personTokenRe = /\b([A-Z][a-z]{2,})\s([A-Z][a-z]{2,})\b/g;
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const recs = buildSmeRecommendationsForProgram(tenant, program);
        for (const rec of recs) {
          const fields: string[] = [
            rec.roleLabel,
            rec.whyNeeded,
            rec.reason.phaseRationale,
            ...(rec.reason.evidenceGap ? [rec.reason.evidenceGap] : []),
            ...rec.suggestedFocus,
          ];
          for (const f of fields) {
            const matches = f.match(personTokenRe) ?? [];
            for (const m of matches) {
              const [a, b] = m.split(' ');
              const ok =
                whitelist.has(m) ||
                whitelist.has(a) ||
                whitelist.has(b) ||
                m.startsWith('AbarVa') ||
                m.endsWith('Lead') ||
                m.endsWith('Owner') ||
                m.endsWith('Architect') ||
                m.endsWith('Maestro') ||
                m.endsWith('SME') ||
                m.endsWith('Expert');
              if (!ok) {
                throw new Error(
                  `unexpected person-name token "${m}" in field "${f}"`,
                );
              }
            }
          }
        }
      }
    }
  });

  it('no field invents a dollar amount', () => {
    const dollarPattern = /\$\s?\d/;
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const recs = buildSmeRecommendationsForProgram(tenant, program);
        for (const rec of recs) {
          const fields: string[] = [
            rec.roleLabel,
            rec.whyNeeded,
            rec.reason.phaseRationale,
            ...(rec.reason.evidenceGap ? [rec.reason.evidenceGap] : []),
            ...rec.suggestedFocus,
          ];
          for (const f of fields) {
            expect(f).not.toMatch(dollarPattern);
          }
        }
      }
    }
  });

  it('no field claims a real E-### evidence citation', () => {
    const eidPattern = /\bE-\d{2,}\b/;
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const recs = buildSmeRecommendationsForProgram(tenant, program);
        for (const rec of recs) {
          const fields: string[] = [
            rec.roleLabel,
            rec.whyNeeded,
            rec.reason.phaseRationale,
            ...(rec.reason.evidenceGap ? [rec.reason.evidenceGap] : []),
            ...rec.suggestedFocus,
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
// Summary reconciliation
// ---------------------------------------------------------------------

describe('summarizeSmeRecommendations', () => {
  it('byRole counts sum to totalCount', () => {
    const all: SmeRecommendation[] = [];
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        all.push(...buildSmeRecommendationsForProgram(tenant, program));
      }
    }
    const summary = summarizeSmeRecommendations(all);
    const sumByRole = Object.values(summary.byRole).reduce((a, b) => a + b, 0);
    expect(summary.totalCount).toBe(all.length);
    expect(sumByRole).toBe(all.length);
  });

  it('byParticipationMode and byReadiness counts sum to totalCount', () => {
    const all: SmeRecommendation[] = [];
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        all.push(...buildSmeRecommendationsForProgram(tenant, program));
      }
    }
    const summary = summarizeSmeRecommendations(all);
    const sumPart = Object.values(summary.byParticipationMode).reduce((a, b) => a + b, 0);
    const sumRead = Object.values(summary.byReadiness).reduce((a, b) => a + b, 0);
    expect(sumPart).toBe(all.length);
    expect(sumRead).toBe(all.length);
  });

  it('summary on empty array zeroes the byRole record', () => {
    const summary = summarizeSmeRecommendations([]);
    expect(summary.totalCount).toBe(0);
    for (const role of SME_ROLES_IN_ORDER) {
      const key = role as SmeRole;
      expect(summary.byRole[key]).toBe(0);
    }
    expect(summary.uniqueWorkshopTypes.length).toBe(0);
  });
});

// ---------------------------------------------------------------------
// Module hygiene · sme-recommendations.ts
// ---------------------------------------------------------------------

describe('module hygiene · sme-recommendations.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/programs/sme-recommendations.ts',
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
});

// ---------------------------------------------------------------------
// Module hygiene · SmeRecommendationPanel.tsx
// ---------------------------------------------------------------------

describe('module hygiene · SmeRecommendationPanel.tsx', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../components/programs/SmeRecommendationPanel.tsx',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  it('does not declare itself a client component', () => {
    expect(codeOnly).not.toMatch(/['"]use client['"]/);
  });

  it('does not use React hooks (useState / useEffect / useMemo / useReducer)', () => {
    expect(codeOnly).not.toMatch(/\buseState\b/);
    expect(codeOnly).not.toMatch(/\buseEffect\b/);
    expect(codeOnly).not.toMatch(/\buseMemo\b/);
    expect(codeOnly).not.toMatch(/\buseReducer\b/);
    expect(codeOnly).not.toMatch(/\buseCallback\b/);
  });

  it('does not call Date.now / Math.random / new Date / fetch', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
    expect(codeOnly).not.toMatch(/\bfetch\(/);
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

  it('does not import auth, supabase, or programs mock', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
  });

  it('does not invoke Claude / OpenAI / Pinecone runtime', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
    expect(codeOnly).not.toMatch(/pinecone/i);
  });

  it('imports tokens from the canonical AbarVa theme (no local color/font duplication)', () => {
    // Per ABARVA_VISUAL_CANON §L acceptance gate #8: surfaces must use
    // tokens from src/lib/design/abarva-theme.ts; hard-coded color or
    // font duplication bypasses the canon and is forbidden.
    expect(codeOnly).toMatch(/from '@\/lib\/design\/abarva-theme'/);
    // No local hex literals — every color must come from the theme.
    expect(codeOnly).not.toMatch(/['"]#[0-9A-Fa-f]{6}['"]/);
    // No local DM Sans font-family literal — must read FONT.body.
    expect(codeOnly).not.toMatch(/['"]DM Sans[^'"]*['"]/);
  });
});
