// PDEL · Program Artifact Inventory tests.

import {
  buildProgramArtifactInventory,
  getRenderableDeliverables,
  groupArtifactsByPhase,
  PROGRAM_ARTIFACT_FILE_CHIPS,
  PROGRAM_ARTIFACT_PHASE_BUCKETS,
  PROGRAM_ARTIFACT_TYPES_IN_ORDER,
  summarizeProgramArtifacts,
  type ProgramArtifactType,
  type ProgramArtifactPhaseBucket,
} from '@/lib/programs/program-artifact-inventory';
import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';

const plan = buildAllProgramsSeedPlan();

// ---------------------------------------------------------------------
// Determinism + per-tenant inventory
// ---------------------------------------------------------------------

describe('buildProgramArtifactInventory · determinism', () => {
  it('returns deterministic output across repeated calls for the first program of every tenant', () => {
    for (const tenant of plan.tenants) {
      if (tenant.programs.length === 0) continue;
      const program = tenant.programs[0];
      const a = buildProgramArtifactInventory(tenant, program);
      const b = buildProgramArtifactInventory(tenant, program);
      expect(a).toEqual(b);
    }
  });

  it('all four canonical demo tenants produce a non-empty inventory', () => {
    expect(plan.tenants.length).toBeGreaterThanOrEqual(4);
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        expect(inv.artifacts.length).toBeGreaterThan(0);
        expect(inv.summary.totalArtifacts).toBe(inv.artifacts.length);
        expect(inv.generatedFrom).toBe('deterministic_seed');
      }
    }
  });

  it('inventory carries tenant + program references', () => {
    const tenant = plan.tenants[0];
    const program = tenant.programs[0];
    const inv = buildProgramArtifactInventory(tenant, program);
    expect(inv.tenant).toBe(tenant);
    expect(inv.program).toBe(program);
  });
});

// ---------------------------------------------------------------------
// Field set
// ---------------------------------------------------------------------

describe('ProgramArtifact shape', () => {
  it('every artifact carries the required field set', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const a of inv.artifacts) {
          expect(typeof a.id).toBe('string');
          expect(a.id.length).toBeGreaterThan(0);
          expect(a.programCode).toBe(program.code);
          expect(a.programSlug).toBe(program.programSlug);
          expect(a.tenantKey).toBe(tenant.tenantKey);
          expect(a.tenantRouteSlug).toBe(tenant.routeSlug);
          expect(typeof a.routeHref).toBe('string');
          expect(PROGRAM_ARTIFACT_TYPES_IN_ORDER).toContain(a.type);
          expect(PROGRAM_ARTIFACT_FILE_CHIPS).toContain(a.fileChip);
          expect(typeof a.title).toBe('string');
          expect(a.title.length).toBeGreaterThan(0);
          expect(typeof a.description).toBe('string');
          expect(PROGRAM_ARTIFACT_PHASE_BUCKETS).toContain(a.phaseBucket);
          expect(typeof a.status).toBe('string');
          expect(typeof a.renderMode).toBe('string');
          expect(typeof a.renderableInCanvas).toBe('boolean');
          expect(typeof a.downloadable).toBe('boolean');
          expect(['usable', 'partial', 'not_usable']).toContain(a.evidenceUsability);
          expect(typeof a.honestFallback).toBe('string');
          expect(a.honestFallback.length).toBeGreaterThan(0);
          expect(a.createdFrom).toBe('deterministic_seed');
        }
      }
    }
  });

  it('artifact ids are unique within a single inventory', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        const ids = inv.artifacts.map((a) => a.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Grouping
// ---------------------------------------------------------------------

describe('groupArtifactsByPhase', () => {
  it('groups all artifacts deterministically by phase bucket', () => {
    const tenant = plan.tenants[0];
    const program = tenant.programs[0];
    const inv = buildProgramArtifactInventory(tenant, program);
    const grouped = groupArtifactsByPhase(inv.artifacts);
    let total = 0;
    for (const bucket of PROGRAM_ARTIFACT_PHASE_BUCKETS) {
      total += grouped[bucket].length;
    }
    expect(total).toBe(inv.artifacts.length);
  });

  it('every artifact ends up in the bucket matching its phaseBucket field', () => {
    const tenant = plan.tenants[0];
    const program = tenant.programs[0];
    const inv = buildProgramArtifactInventory(tenant, program);
    const grouped = groupArtifactsByPhase(inv.artifacts);
    for (const a of inv.artifacts) {
      expect(grouped[a.phaseBucket]).toContain(a);
    }
  });
});

// ---------------------------------------------------------------------
// Renderable + downloadable invariants
// ---------------------------------------------------------------------

describe('renderable / downloadable invariants', () => {
  it('getRenderableDeliverables returns only artifacts where renderableInCanvas is true', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        const renderable = getRenderableDeliverables(inv.artifacts);
        for (const a of renderable) {
          expect(a.renderableInCanvas).toBe(true);
        }
      }
    }
  });

  it('renderable HTML/Markdown-like artifacts use html_render or markdown_render mode', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        const renderable = getRenderableDeliverables(inv.artifacts);
        // At least one renderable should exist for any program with
        // non-stub deliverables; we don't assert non-zero here because
        // an all-stub program is theoretically possible.
        for (const a of renderable) {
          expect([
            'html_render',
            'markdown_render',
            'note_list',
          ]).toContain(a.renderMode);
        }
      }
    }
  });

  it('no artifact carries a fake download URL today; downloadable defaults to false', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const a of inv.artifacts) {
          // Until export pipeline lands, every artifact is non-downloadable.
          expect(a.downloadable).toBe(false);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------

describe('summarizeProgramArtifacts', () => {
  it('byType / byPhase / byStatus reconcile to artifact list', () => {
    const tenant = plan.tenants[0];
    const program = tenant.programs[0];
    const inv = buildProgramArtifactInventory(tenant, program);
    const sumByType = Object.values(inv.summary.byType).reduce((a, b) => a + b, 0);
    const sumByPhase = Object.values(inv.summary.byPhase).reduce((a, b) => a + b, 0);
    const sumByStatus = Object.values(inv.summary.byStatus).reduce((a, b) => a + b, 0);
    expect(sumByType).toBe(inv.artifacts.length);
    expect(sumByPhase).toBe(inv.artifacts.length);
    expect(sumByStatus).toBe(inv.artifacts.length);
  });

  it('renderableCount matches getRenderableDeliverables', () => {
    const tenant = plan.tenants[0];
    const program = tenant.programs[0];
    const inv = buildProgramArtifactInventory(tenant, program);
    expect(inv.summary.renderableCount).toBe(
      getRenderableDeliverables(inv.artifacts).length,
    );
  });

  it('summarize works on an arbitrary subset', () => {
    const tenant = plan.tenants[0];
    const program = tenant.programs[0];
    const inv = buildProgramArtifactInventory(tenant, program);
    const subset = inv.artifacts.slice(0, 3);
    const s = summarizeProgramArtifacts(subset, program.code);
    expect(s.totalArtifacts).toBe(3);
    expect(s.programCode).toBe(program.code);
  });
});

// ---------------------------------------------------------------------
// No fabrication
// ---------------------------------------------------------------------

describe('no fabrication', () => {
  it('no artifact invents a dollar amount in any string field', () => {
    const dollarPattern = /\$\s?\d[\d,]*(\.\d+)?/;
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const a of inv.artifacts) {
          const fields = [a.title, a.description, a.honestFallback, a.routeHref];
          for (const f of fields) {
            expect(f).not.toMatch(dollarPattern);
          }
        }
      }
    }
  });

  it('no artifact claims a real E-### evidence citation today', () => {
    const eidPattern = /\bE-\d{2,}\b/;
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const a of inv.artifacts) {
          expect(a.title).not.toMatch(eidPattern);
          expect(a.description).not.toMatch(eidPattern);
        }
      }
    }
  });

  it('every artifact carries an honest-fallback caption naming its limit', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const a of inv.artifacts) {
          expect(a.honestFallback.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene · program-artifact-inventory.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/programs/program-artifact-inventory.ts',
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
