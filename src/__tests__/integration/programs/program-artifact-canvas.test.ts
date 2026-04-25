// PDEL5 · Program Artifact Canvas tests.
//
// Pure deterministic coverage of the canvas view-model + component
// integration. No React rendering, no DOM, no model calls.

import {
  buildProgramArtifactCanvasView,
  PROGRAM_ARTIFACT_CANVAS_ACTION_KEYS,
  PROGRAM_ARTIFACT_CANVAS_HONEST_DISCLAIMER,
  PROGRAM_ARTIFACT_CANVAS_PLACEHOLDER_PREVIEW_BODY,
} from '@/lib/programs/program-artifact-canvas-view';
import { buildProgramArtifactInventory } from '@/lib/programs/program-artifact-inventory';
import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';

const plan = buildAllProgramsSeedPlan();

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('buildProgramArtifactCanvasView · determinism', () => {
  it('returns byte-equal output across repeated calls for every canonical program', () => {
    expect(plan.tenants.length).toBeGreaterThanOrEqual(4);
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const a = buildProgramArtifactCanvasView(program.programSlug);
        const b = buildProgramArtifactCanvasView(program.programSlug);
        expect(JSON.stringify(a)).toBe(JSON.stringify(b));
      }
    }
  });

  it('returns byte-equal output when an artifact selection is supplied', () => {
    const tenant = plan.tenants[0];
    const program = tenant.programs[0];
    const inv = buildProgramArtifactInventory(tenant, program);
    const artifactId = inv.artifacts[0].id;
    const a = buildProgramArtifactCanvasView(program.programSlug, artifactId);
    const b = buildProgramArtifactCanvasView(program.programSlug, artifactId);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ---------------------------------------------------------------------
// Coverage across canonical demo programs
// ---------------------------------------------------------------------

describe('buildProgramArtifactCanvasView · coverage', () => {
  it('every canonical demo program produces a non-zero artifact count', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const view = buildProgramArtifactCanvasView(program.programSlug);
        expect(view.artifactCount).toBeGreaterThan(0);
        expect(view.list.length).toBe(view.artifactCount);
        expect(view.createdFrom).toBe('deterministic_seed');
      }
    }
  });

  it('renderableCount is always less than or equal to artifactCount', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const view = buildProgramArtifactCanvasView(program.programSlug);
        expect(view.renderableCount).toBeLessThanOrEqual(view.artifactCount);
        expect(view.renderableCount).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('returns an empty view with no selection when programId is unknown', () => {
    const view = buildProgramArtifactCanvasView('not-a-program-slug');
    expect(view.artifactCount).toBe(0);
    expect(view.renderableCount).toBe(0);
    expect(view.list).toEqual([]);
    expect(view.selected).toBeNull();
    expect(view.honestDisclaimer).toBe(PROGRAM_ARTIFACT_CANVAS_HONEST_DISCLAIMER);
  });
});

// ---------------------------------------------------------------------
// Selection contract — actions are all disabled in PDEL5
// ---------------------------------------------------------------------

describe('buildProgramArtifactCanvasView · selection', () => {
  it('every action is disabled with a non-empty reason when an artifact is selected', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const view = buildProgramArtifactCanvasView(
            program.programSlug,
            artifact.id,
          );
          expect(view.selected).not.toBeNull();
          const sel = view.selected!;
          expect(sel.artifactId).toBe(artifact.id);
          expect(sel.actions).toHaveLength(
            PROGRAM_ARTIFACT_CANVAS_ACTION_KEYS.length,
          );
          for (const action of sel.actions) {
            expect(action.enabled).toBe(false);
            expect(typeof action.reason).toBe('string');
            expect(action.reason.length).toBeGreaterThan(0);
          }
          const seenKeys = sel.actions.map((a) => a.key).sort();
          const expectedKeys = [...PROGRAM_ARTIFACT_CANVAS_ACTION_KEYS].sort();
          expect(seenKeys).toEqual(expectedKeys);
        }
      }
    }
  });

  it('preview mode is `placeholder` for any non-html/non-markdown render mode', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const view = buildProgramArtifactCanvasView(
            program.programSlug,
            artifact.id,
          );
          const sel = view.selected!;
          if (sel.renderMode !== 'html' && sel.renderMode !== 'markdown') {
            expect(sel.preview.mode).toBe('placeholder');
            expect(sel.preview.body).toBe(
              PROGRAM_ARTIFACT_CANVAS_PLACEHOLDER_PREVIEW_BODY,
            );
          }
        }
      }
    }
  });

  it('selection origin maps to a known canonical bucket', () => {
    const tenant = plan.tenants[0];
    const program = tenant.programs[0];
    const inv = buildProgramArtifactInventory(tenant, program);
    const knownOrigins = new Set(['generated', 'uploaded', 'workshop_note']);
    for (const artifact of inv.artifacts) {
      const view = buildProgramArtifactCanvasView(
        program.programSlug,
        artifact.id,
      );
      expect(knownOrigins.has(view.selected!.origin)).toBe(true);
    }
  });

  it('isSelected flag flips on the matching list entry only', () => {
    const tenant = plan.tenants[0];
    const program = tenant.programs[0];
    const inv = buildProgramArtifactInventory(tenant, program);
    const artifactId = inv.artifacts[0].id;
    const view = buildProgramArtifactCanvasView(program.programSlug, artifactId);
    const selected = view.list.filter((entry) => entry.isSelected);
    expect(selected).toHaveLength(1);
    expect(selected[0].artifactId).toBe(artifactId);
  });
});

// ---------------------------------------------------------------------
// No-fabrication invariants
// ---------------------------------------------------------------------

describe('buildProgramArtifactCanvasView · no-fabrication invariants', () => {
  it('no `https://` appears anywhere in the serialized view', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const view = buildProgramArtifactCanvasView(program.programSlug);
        expect(JSON.stringify(view)).not.toMatch(/https:\/\//);
      }
    }
  });

  it('no `https://` appears when an artifact is selected', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const view = buildProgramArtifactCanvasView(
            program.programSlug,
            artifact.id,
          );
          expect(JSON.stringify(view)).not.toMatch(/https:\/\//);
        }
      }
    }
  });

  it('no fake `E-###` citation tokens appear in the serialized view', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const view = buildProgramArtifactCanvasView(program.programSlug);
        expect(JSON.stringify(view)).not.toMatch(/E-\d/);
      }
    }
  });

  it('no fake `E-###` citation tokens appear when an artifact is selected', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const view = buildProgramArtifactCanvasView(
            program.programSlug,
            artifact.id,
          );
          expect(JSON.stringify(view)).not.toMatch(/E-\d/);
        }
      }
    }
  });

  it('placeholder preview body never claims a real download path', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const view = buildProgramArtifactCanvasView(
            program.programSlug,
            artifact.id,
          );
          const body = view.selected!.preview.body;
          expect(body).not.toMatch(/https:\/\//);
          expect(body).not.toMatch(/blob:/);
          expect(body).not.toMatch(/download\?/i);
          expect(body).not.toMatch(/\.pdf$/);
          expect(body).not.toMatch(/\/files\//);
        }
      }
    }
  });

  it('honest disclaimer is non-empty and names the deterministic seed', () => {
    const view = buildProgramArtifactCanvasView(plan.programs[0].programSlug);
    expect(view.honestDisclaimer.length).toBeGreaterThan(0);
    expect(view.honestDisclaimer.toLowerCase()).toMatch(/deterministic/);
    expect(view.honestDisclaimer.toLowerCase()).toMatch(
      /no live (download|retrieval)/,
    );
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('Program artifact canvas module hygiene', () => {
  it('view + component modules do not import forbidden runtimes', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path');
    const sources = [
      path.resolve(
        __dirname,
        '../../../lib/programs/program-artifact-canvas-view.ts',
      ),
      path.resolve(
        __dirname,
        '../../../components/programs/ProgramArtifactCanvas.tsx',
      ),
    ];
    for (const src of sources) {
      const content = fs.readFileSync(src, 'utf8');
      expect(content).not.toMatch(/from '@\/lib\/nexus\//);
      expect(content).not.toMatch(/from '@\/lib\/agent\//);
      expect(content).not.toMatch(/from '@\/lib\/source\//);
      expect(content).not.toMatch(/from '@\/lib\/auth\//);
      expect(content).not.toMatch(/from '@\/lib\/sentinel\//);
      expect(content).not.toMatch(/from '@\/lib\/atlas\//);
      expect(content).not.toMatch(/from '@\/lib\/programs\/mock'/);
      expect(content).not.toMatch(/from '@\/app\/programs\//);
      expect(content).not.toMatch(/from '@\/app\/\(maestro\)\/preview\//);
      expect(content).not.toMatch(/from '@\/app\/demo\//);
      expect(content).not.toMatch(/from 'supabase/);
      expect(content).not.toMatch(/from '@supabase\//);
      // Forbidden runtime APIs.
      expect(content).not.toMatch(/Date\.now\(/);
      expect(content).not.toMatch(/Math\.random\(/);
      expect(content).not.toMatch(/new Date\(/);
      expect(content).not.toMatch(/\bfetch\(/);
      expect(content).not.toMatch(/from 'anthropic'/);
      expect(content).not.toMatch(/from 'openai'/);
      // Server-component only — no React state hooks.
      expect(content).not.toMatch(/\buseState\b/);
      expect(content).not.toMatch(/\buseEffect\b/);
    }
  });

  it('ProgramCanonicalDetail mounts the new ProgramArtifactCanvas component', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path');
    const detail = fs.readFileSync(
      path.resolve(
        __dirname,
        '../../../components/programs/ProgramCanonicalDetail.tsx',
      ),
      'utf8',
    );
    expect(detail).toMatch(/ProgramArtifactCanvas/);
    expect(detail).toMatch(/buildProgramArtifactCanvasView/);
  });
});
