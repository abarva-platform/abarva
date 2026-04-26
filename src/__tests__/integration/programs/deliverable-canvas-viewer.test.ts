// PDEL7 · Deliverable Canvas Viewer tests.
//
// Pure deterministic coverage of the deliverable viewer view-model and
// the associated server component. No React rendering, no DOM, no model
// calls.

import {
  buildDeliverableCanvasView,
  DELIVERABLE_VIEWER_ACTION_KEYS,
  DELIVERABLE_VIEWER_ACTION_REASONS,
  DELIVERABLE_VIEWER_HONEST_DISCLAIMER,
  DELIVERABLE_VIEWER_RENDER_MODES,
  DELIVERABLE_VIEWER_RICH_TEXT_PLACEHOLDER_BODY,
  type DeliverableViewerRenderMode,
} from '@/lib/programs/deliverable-canvas-view';
import { buildProgramArtifactInventory } from '@/lib/programs/program-artifact-inventory';
import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';

const plan = buildAllProgramsSeedPlan();

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('buildDeliverableCanvasView · determinism', () => {
  it('returns byte-equal output across repeated calls for every (program, artifact) pair', () => {
    expect(plan.tenants.length).toBeGreaterThanOrEqual(4);
    const tenant = plan.tenants[0];
    const program = tenant.programs[0];
    const inv = buildProgramArtifactInventory(tenant, program);
    expect(inv.artifacts.length).toBeGreaterThan(0);
    for (const artifact of inv.artifacts) {
      const a = buildDeliverableCanvasView(program.programSlug, artifact.id);
      const b = buildDeliverableCanvasView(program.programSlug, artifact.id);
      expect(a).not.toBeNull();
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    }
  });

  it('returns null when programId is unknown', () => {
    const view = buildDeliverableCanvasView('not-a-program-slug', 'art:fake');
    expect(view).toBeNull();
  });

  it('returns null when artifactId is unknown for a real program', () => {
    const program = plan.tenants[0].programs[0];
    const view = buildDeliverableCanvasView(
      program.programSlug,
      'art:not-a-real-artifact-id',
    );
    expect(view).toBeNull();
  });
});

// ---------------------------------------------------------------------
// Render modes (3 modes supported)
// ---------------------------------------------------------------------

describe('buildDeliverableCanvasView · render modes', () => {
  it('exposes exactly the three canonical render modes', () => {
    expect([...DELIVERABLE_VIEWER_RENDER_MODES].sort()).toEqual(
      ['html', 'markdown', 'rich_text_placeholder'].sort(),
    );
  });

  it('every artifact resolves to one of the three canonical render modes', () => {
    const seen = new Set<DeliverableViewerRenderMode>();
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const view = buildDeliverableCanvasView(
            program.programSlug,
            artifact.id,
          );
          expect(view).not.toBeNull();
          const mode = view!.renderMode;
          expect(DELIVERABLE_VIEWER_RENDER_MODES).toContain(mode);
          seen.add(mode);
        }
      }
    }
    // Across the canonical demo seed all three render modes must be
    // observable somewhere — guards against the view-model collapsing
    // every artifact into a single render mode.
    expect(seen.has('html')).toBe(true);
    expect(seen.has('markdown')).toBe(true);
    expect(seen.has('rich_text_placeholder')).toBe(true);
  });

  it('rich_text_placeholder previews use the canonical placeholder body', () => {
    let placeholderSeen = 0;
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const view = buildDeliverableCanvasView(
            program.programSlug,
            artifact.id,
          )!;
          if (view.renderMode === 'rich_text_placeholder') {
            expect(view.previewBody).toBe(
              DELIVERABLE_VIEWER_RICH_TEXT_PLACEHOLDER_BODY,
            );
            placeholderSeen += 1;
          }
        }
      }
    }
    expect(placeholderSeen).toBeGreaterThan(0);
  });

  it('html previews are escaped (no raw `<script>` and no `javascript:` URLs)', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const view = buildDeliverableCanvasView(
            program.programSlug,
            artifact.id,
          )!;
          if (view.renderMode === 'html') {
            expect(view.previewBody).not.toMatch(/<script/i);
            expect(view.previewBody).not.toMatch(/javascript:/i);
            expect(view.previewBody).not.toMatch(/onerror=/i);
          }
        }
      }
    }
  });
});

// ---------------------------------------------------------------------
// Disabled actions (4 actions present and disabled)
// ---------------------------------------------------------------------

describe('buildDeliverableCanvasView · disabled actions', () => {
  it('exposes exactly the four canonical action keys', () => {
    expect([...DELIVERABLE_VIEWER_ACTION_KEYS].sort()).toEqual(
      ['approve', 'download', 'edit', 'regenerate'].sort(),
    );
  });

  it('every action is disabled and labeled with a future / not-yet-available reason', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const view = buildDeliverableCanvasView(
            program.programSlug,
            artifact.id,
          )!;
          expect(view.disabledActions).toHaveLength(4);
          const seenKeys = view.disabledActions.map((a) => a.key).sort();
          expect(seenKeys).toEqual(
            [...DELIVERABLE_VIEWER_ACTION_KEYS].sort(),
          );
          for (const action of view.disabledActions) {
            expect(action.enabled).toBe(false);
            expect(action.futureLabel).toBe('future');
            expect(typeof action.reason).toBe('string');
            expect(action.reason.length).toBeGreaterThan(0);
            // Each action reason mentions either "not yet available" or
            // "deferred" — honest deferral language.
            expect(action.reason.toLowerCase()).toMatch(
              /not yet available|deferred/,
            );
          }
        }
      }
    }
  });

  it('action reasons are exactly the canonical reason strings', () => {
    const program = plan.tenants[0].programs[0];
    const inv = buildProgramArtifactInventory(
      plan.tenants[0],
      program,
    );
    const view = buildDeliverableCanvasView(
      program.programSlug,
      inv.artifacts[0].id,
    )!;
    for (const action of view.disabledActions) {
      expect(action.reason).toBe(DELIVERABLE_VIEWER_ACTION_REASONS[action.key]);
    }
  });
});

// ---------------------------------------------------------------------
// Missing evidence visible
// ---------------------------------------------------------------------

describe('buildDeliverableCanvasView · evidence + missing inputs', () => {
  it('evidenceStatus mirrors the underlying inventory evidenceUsability', () => {
    const tenant = plan.tenants[0];
    const program = tenant.programs[0];
    const inv = buildProgramArtifactInventory(tenant, program);
    for (const artifact of inv.artifacts) {
      const view = buildDeliverableCanvasView(
        program.programSlug,
        artifact.id,
      )!;
      expect(view.evidenceStatus).toBe(artifact.evidenceUsability);
    }
  });

  it('artifacts that are not usable evidence surface a missing-input entry naming evidence', () => {
    let nonUsableSeen = 0;
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          if (artifact.evidenceUsability === 'usable') continue;
          nonUsableSeen += 1;
          const view = buildDeliverableCanvasView(
            program.programSlug,
            artifact.id,
          )!;
          const evidenceMention = view.missingInputs.find((entry) =>
            entry.toLowerCase().includes('evidence'),
          );
          expect(evidenceMention).toBeDefined();
        }
      }
    }
    expect(nonUsableSeen).toBeGreaterThan(0);
  });

  it('every missing-input entry is a non-empty string', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const view = buildDeliverableCanvasView(
            program.programSlug,
            artifact.id,
          )!;
          for (const entry of view.missingInputs) {
            expect(typeof entry).toBe('string');
            expect(entry.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });
});

// ---------------------------------------------------------------------
// No fake download URL · no fabrication invariants
// ---------------------------------------------------------------------

describe('buildDeliverableCanvasView · no fake download URL', () => {
  it('serialized view never carries a download URL or http(s) link', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const view = buildDeliverableCanvasView(
            program.programSlug,
            artifact.id,
          )!;
          const json = JSON.stringify(view);
          expect(json).not.toMatch(/https?:\/\//);
          expect(json).not.toMatch(/blob:/);
          expect(json).not.toMatch(/data:application\//);
          expect(json).not.toMatch(/download\?/i);
          expect(json).not.toMatch(/\/files\//);
          expect(json).not.toMatch(/\.pdf"/);
          // No fake `E-###` citation tokens.
          expect(json).not.toMatch(/E-\d/);
        }
      }
    }
  });

  it('versionLabel is null today (versioning not yet wired)', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const inv = buildProgramArtifactInventory(tenant, program);
        for (const artifact of inv.artifacts) {
          const view = buildDeliverableCanvasView(
            program.programSlug,
            artifact.id,
          )!;
          expect(view.versionLabel).toBeNull();
        }
      }
    }
  });

  it('honest disclaimer is non-empty and names the deterministic seed and deferred actions', () => {
    const program = plan.tenants[0].programs[0];
    const inv = buildProgramArtifactInventory(
      plan.tenants[0],
      program,
    );
    const view = buildDeliverableCanvasView(
      program.programSlug,
      inv.artifacts[0].id,
    )!;
    expect(view.honestDisclaimer).toBe(DELIVERABLE_VIEWER_HONEST_DISCLAIMER);
    expect(view.honestDisclaimer.length).toBeGreaterThan(0);
    expect(view.honestDisclaimer.toLowerCase()).toMatch(/deterministic/);
    expect(view.honestDisclaimer.toLowerCase()).toMatch(/deferred/);
  });

  it('createdFrom names the deterministic deliverable view seed', () => {
    const program = plan.tenants[0].programs[0];
    const inv = buildProgramArtifactInventory(
      plan.tenants[0],
      program,
    );
    const view = buildDeliverableCanvasView(
      program.programSlug,
      inv.artifacts[0].id,
    )!;
    expect(view.createdFrom).toBe('deterministic_deliverable_view_seed');
  });
});

// ---------------------------------------------------------------------
// Component contract: no dangerouslySetInnerHTML, server-only
// ---------------------------------------------------------------------

describe('DeliverableCanvasViewer component contract', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const componentPath = path.resolve(
    __dirname,
    '../../../components/programs/DeliverableCanvasViewer.tsx',
  );
  const viewModelPath = path.resolve(
    __dirname,
    '../../../lib/programs/deliverable-canvas-view.ts',
  );

  it('component file does not use dangerouslySetInnerHTML anywhere', () => {
    const content = fs.readFileSync(componentPath, 'utf8');
    expect(content).not.toMatch(/dangerouslySetInnerHTML/);
  });

  it("component file is a server component (no 'use client' directive)", () => {
    const content = fs.readFileSync(componentPath, 'utf8');
    expect(content).not.toMatch(/['"]use client['"]/);
    // Server-component only — no React state hooks.
    expect(content).not.toMatch(/\buseState\b/);
    expect(content).not.toMatch(/\buseEffect\b/);
    expect(content).not.toMatch(/\buseRef\b/);
  });

  it('component file does not import forbidden runtimes', () => {
    const content = fs.readFileSync(componentPath, 'utf8');
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
    expect(content).not.toMatch(/from 'anthropic'/);
    expect(content).not.toMatch(/from 'openai'/);
    expect(content).not.toMatch(/Date\.now\(/);
    expect(content).not.toMatch(/Math\.random\(/);
    expect(content).not.toMatch(/new Date\(/);
    expect(content).not.toMatch(/\bfetch\(/);
  });

  it('view-model module does not import forbidden runtimes', () => {
    const content = fs.readFileSync(viewModelPath, 'utf8');
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
    expect(content).not.toMatch(/from 'anthropic'/);
    expect(content).not.toMatch(/from 'openai'/);
    expect(content).not.toMatch(/Date\.now\(/);
    expect(content).not.toMatch(/Math\.random\(/);
    expect(content).not.toMatch(/new Date\(/);
    expect(content).not.toMatch(/\bfetch\(/);
    // View-model is a pure function module — no React state hooks.
    expect(content).not.toMatch(/\buseState\b/);
    expect(content).not.toMatch(/\buseEffect\b/);
  });

  it('component file mentions the four canonical action labels', () => {
    const content = fs.readFileSync(componentPath, 'utf8');
    expect(content).toMatch(/'edit'/);
    expect(content).toMatch(/'regenerate'/);
    expect(content).toMatch(/'download'/);
    expect(content).toMatch(/'approve'/);
  });

  it('component file marks every action button as disabled and aria-disabled', () => {
    const content = fs.readFileSync(componentPath, 'utf8');
    expect(content).toMatch(/disabled\b/);
    expect(content).toMatch(/aria-disabled="true"/);
  });

  it('component file carries the deterministic-source caption marker', () => {
    const content = fs.readFileSync(componentPath, 'utf8');
    expect(content).toMatch(/deterministic_deliverable_view_seed/);
  });
});
