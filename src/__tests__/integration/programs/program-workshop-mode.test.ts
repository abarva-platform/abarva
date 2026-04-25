// PW1 · Program Workshop Mode shell tests.
//
// Covers:
//   - view-model determinism (byte-equal across calls for the same
//     programId)
//   - every canonical demo program returns a view with non-null
//     nextWorkshop
//   - view contains required attendees, evidence to capture, and
//     expected outputs (>= 1 each)
//   - honestDisclaimer carries the "not wired" / "deterministic"
//     wording
//   - createdFrom === 'deterministic_seed'
//   - module hygiene on ProgramWorkshopMode.tsx and
//     program-workshop-mode-view.ts
//   - ProgramCanonicalDetail mounts the new component

import { buildProgramWorkshopModeView } from '@/lib/programs/program-workshop-mode-view';
import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as typeof import('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path') as typeof import('path');

const plan = buildAllProgramsSeedPlan();

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('buildProgramWorkshopModeView · determinism', () => {
  it('returns deep-equal output across repeated calls for every demo program', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const a = buildProgramWorkshopModeView(program.programSlug);
        const b = buildProgramWorkshopModeView(program.programSlug);
        expect(a).toEqual(b);
      }
    }
  });

  it('returns byte-equal JSON serialization across repeated calls for every demo program', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const a = JSON.stringify(buildProgramWorkshopModeView(program.programSlug));
        const b = JSON.stringify(buildProgramWorkshopModeView(program.programSlug));
        expect(a).toBe(b);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Non-null nextWorkshop for every canonical demo program
// ---------------------------------------------------------------------

describe('buildProgramWorkshopModeView · canonical coverage', () => {
  it('every canonical demo program returns a view with non-null nextWorkshop', () => {
    expect(plan.programs.length).toBeGreaterThan(0);
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const view = buildProgramWorkshopModeView(program.programSlug);
        expect(view.nextWorkshop).not.toBeNull();
      }
    }
  });

  it('view.programId echoes the input programId for every demo program', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const view = buildProgramWorkshopModeView(program.programSlug);
        expect(view.programId).toBe(program.programSlug);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Required content (attendees, evidence, outputs)
// ---------------------------------------------------------------------

describe('buildProgramWorkshopModeView · required content', () => {
  it('view contains at least one required attendee, evidence-to-capture, and expected output', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const view = buildProgramWorkshopModeView(program.programSlug);
        expect(view.nextWorkshop).not.toBeNull();
        const ws = view.nextWorkshop!;
        expect(ws.requiredAttendees.length).toBeGreaterThanOrEqual(1);
        expect(ws.evidenceToCapture.length).toBeGreaterThanOrEqual(1);
        expect(ws.expectedOutputs.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('agenda has at least one entry for every canonical demo program', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const view = buildProgramWorkshopModeView(program.programSlug);
        expect(view.agenda.length).toBeGreaterThanOrEqual(1);
        for (const line of view.agenda) {
          expect(typeof line).toBe('string');
          expect(line.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('left rail contains the canonical six phases with a current marker for active programs', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const view = buildProgramWorkshopModeView(program.programSlug);
        expect(view.leftRail.phases.length).toBe(6);
        for (let i = 0; i < view.leftRail.phases.length; i += 1) {
          const p = view.leftRail.phases[i];
          expect(p.ordinal).toBe(i + 1);
          expect(typeof p.name).toBe('string');
          expect(p.name.length).toBeGreaterThan(0);
          expect(['completed', 'current', 'pending']).toContain(p.status);
        }
        if (program.status === 'active') {
          const currents = view.leftRail.phases.filter((p) => p.status === 'current');
          expect(currents.length).toBe(1);
        }
      }
    }
  });

  it('right context has a steward gatekeeper and a non-empty gate implication', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const view = buildProgramWorkshopModeView(program.programSlug);
        expect(view.rightContext.gatekeeperAgent).toBe('steward');
        expect(typeof view.rightContext.gateImplication).toBe('string');
        expect(view.rightContext.gateImplication.length).toBeGreaterThan(0);
        expect(Number.isInteger(view.rightContext.evidenceUsable)).toBe(true);
        expect(view.rightContext.evidenceUsable).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Honest disclaimer + createdFrom
// ---------------------------------------------------------------------

describe('buildProgramWorkshopModeView · honesty', () => {
  it('honestDisclaimer mentions "not wired" or "deterministic"', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const view = buildProgramWorkshopModeView(program.programSlug);
        const d = view.honestDisclaimer.toLowerCase();
        const hasNotWired = d.includes('not wired');
        const hasDeterministic = d.includes('deterministic');
        expect(hasNotWired || hasDeterministic).toBe(true);
      }
    }
  });

  it("createdFrom is 'deterministic_seed' for every program view", () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        const view = buildProgramWorkshopModeView(program.programSlug);
        expect(view.createdFrom).toBe('deterministic_seed');
      }
    }
  });

  it('returns a defensive shell with null nextWorkshop for an unknown programId', () => {
    const view = buildProgramWorkshopModeView('does-not-exist-xyz');
    expect(view.nextWorkshop).toBeNull();
    expect(view.agenda).toEqual([]);
    expect(view.createdFrom).toBe('deterministic_seed');
    expect(view.leftRail.phases.length).toBe(6);
  });
});

// ---------------------------------------------------------------------
// Module hygiene · view helper
// ---------------------------------------------------------------------

describe('module hygiene · program-workshop-mode-view.ts', () => {
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/programs/program-workshop-mode-view.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = stripCommentsAndStringLiterals(source);

  it('does not call Date.now / Math.random / new Date', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
  });

  it('does not call fetch or invoke Anthropic / OpenAI runtime', () => {
    expect(codeOnly).not.toMatch(/\bfetch\(/);
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
  });

  it('does not import Nexus / Agent / Source / Auth runtime, mock.ts, or supabase', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
  });

  it('does not use useState or useEffect (server module)', () => {
    expect(codeOnly).not.toMatch(/\buseState\b/);
    expect(codeOnly).not.toMatch(/\buseEffect\b/);
  });
});

// ---------------------------------------------------------------------
// Module hygiene · ProgramWorkshopMode.tsx
// ---------------------------------------------------------------------

describe('module hygiene · ProgramWorkshopMode.tsx', () => {
  const sourcePath = path.resolve(
    __dirname,
    '../../../components/programs/ProgramWorkshopMode.tsx',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = stripCommentsAndStringLiterals(source);

  it('does not call Date.now / Math.random / new Date', () => {
    expect(codeOnly).not.toMatch(/Date\.now\(/);
    expect(codeOnly).not.toMatch(/Math\.random\(/);
    expect(codeOnly).not.toMatch(/new Date\(/);
  });

  it('does not call fetch or invoke Anthropic / OpenAI runtime', () => {
    expect(codeOnly).not.toMatch(/\bfetch\(/);
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
  });

  it('is a server component (no useState / useEffect / "use client")', () => {
    expect(codeOnly).not.toMatch(/\buseState\b/);
    expect(codeOnly).not.toMatch(/\buseEffect\b/);
    expect(source).not.toMatch(/['"]use client['"]/);
  });

  it('does not import Nexus / Agent / Source / Auth runtime, mock.ts, or supabase', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
  });

  it('renders data-program-workshop-mode="pw1" on its root', () => {
    expect(source).toMatch(/data-program-workshop-mode="pw1"/);
  });
});

// ---------------------------------------------------------------------
// ProgramCanonicalDetail mount assertion
// ---------------------------------------------------------------------

describe('ProgramCanonicalDetail · mounts ProgramWorkshopMode', () => {
  const sourcePath = path.resolve(
    __dirname,
    '../../../components/programs/ProgramCanonicalDetail.tsx',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');

  it('imports ProgramWorkshopMode', () => {
    expect(source).toMatch(/ProgramWorkshopMode/);
    expect(source).toMatch(
      /from '@\/components\/programs\/ProgramWorkshopMode'/,
    );
  });

  it('imports buildProgramWorkshopModeView', () => {
    expect(source).toMatch(/buildProgramWorkshopModeView/);
    expect(source).toMatch(
      /from '@\/lib\/programs\/program-workshop-mode-view'/,
    );
  });

  it('mounts <ProgramWorkshopMode /> with view from buildProgramWorkshopModeView', () => {
    expect(source).toMatch(/<ProgramWorkshopMode\b[^>]*view=\{buildProgramWorkshopModeView\(/);
  });
});

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function stripCommentsAndStringLiterals(src: string): string {
  // Strip line comments, then block comments. We retain string literals
  // because hygiene assertions guard import paths and identifier use,
  // not arbitrary mentions inside copy. Import statements are caught
  // by the explicit regex assertions above.
  return src
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}
