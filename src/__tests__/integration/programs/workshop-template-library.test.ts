// MW7 · Workshop Template Library tests.

import {
  buildWorkshopTemplateLibrary,
  getTemplatesByCategory,
  listWorkshopTemplateCategories,
  summarizeWorkshopTemplateLibrary,
  type WorkshopTemplate,
  type WorkshopTemplateCategory,
} from '@/lib/programs/workshop-template-library';

const REQUIRED_CATEGORIES: ReadonlyArray<WorkshopTemplateCategory> = [
  'discovery',
  'framing',
  'value',
  'governance',
  'architecture',
  'adoption',
  'executive_review',
];

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('buildWorkshopTemplateLibrary · determinism', () => {
  it('returns deterministic output across repeated calls', () => {
    const a = buildWorkshopTemplateLibrary();
    const b = buildWorkshopTemplateLibrary();
    expect(a).toEqual(b);
  });

  it('emits a stable canonical category ordering', () => {
    expect(listWorkshopTemplateCategories()).toEqual(REQUIRED_CATEGORIES);
  });
});

// ---------------------------------------------------------------------
// Coverage
// ---------------------------------------------------------------------

describe('library coverage', () => {
  it('emits at least one template per canonical category', () => {
    const library = buildWorkshopTemplateLibrary();
    for (const category of REQUIRED_CATEGORIES) {
      const templatesInCategory = library.filter((t) => t.category === category);
      expect(templatesInCategory.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('emits at least seven templates in total', () => {
    const library = buildWorkshopTemplateLibrary();
    expect(library.length).toBeGreaterThanOrEqual(7);
  });

  it('all seven canonical categories are present in the library', () => {
    const library = buildWorkshopTemplateLibrary();
    const categories = new Set(library.map((t) => t.category));
    for (const category of REQUIRED_CATEGORIES) {
      expect(categories.has(category)).toBe(true);
    }
    expect(categories.size).toBe(REQUIRED_CATEGORIES.length);
  });

  it('template ids are unique', () => {
    const library = buildWorkshopTemplateLibrary();
    const ids = library.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('getTemplatesByCategory returns only templates in the named category', () => {
    for (const category of REQUIRED_CATEGORIES) {
      const filtered = getTemplatesByCategory(category);
      expect(filtered.length).toBeGreaterThanOrEqual(1);
      for (const t of filtered) {
        expect(t.category).toBe(category);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Required field set
// ---------------------------------------------------------------------

describe('WorkshopTemplate shape', () => {
  it('every template has the required fields and the deterministic source', () => {
    const library = buildWorkshopTemplateLibrary();
    for (const template of library) {
      expect(typeof template.id).toBe('string');
      expect(template.id.length).toBeGreaterThan(0);
      expect(REQUIRED_CATEGORIES).toContain(template.category);
      expect(typeof template.categoryLabel).toBe('string');
      expect(template.categoryLabel.length).toBeGreaterThan(0);
      expect(typeof template.title).toBe('string');
      expect(template.title.length).toBeGreaterThan(0);
      expect(typeof template.purpose).toBe('string');
      expect(template.purpose.length).toBeGreaterThan(0);
      expect(typeof template.durationMinutes).toBe('number');
      expect(template.durationMinutes).toBeGreaterThan(0);
      expect(typeof template.decisionToLand).toBe('string');
      expect(template.decisionToLand.length).toBeGreaterThan(0);

      expect(template.inputs).toBeTruthy();
      expect(Array.isArray(template.inputs.required)).toBe(true);
      expect(Array.isArray(template.inputs.optional)).toBe(true);
      expect(template.inputs.required.length).toBeGreaterThanOrEqual(1);

      expect(Array.isArray(template.agenda)).toBe(true);
      expect(template.agenda.length).toBeGreaterThanOrEqual(3);
      let lastStep = 0;
      let agendaTotal = 0;
      for (const step of template.agenda) {
        expect(typeof step.step).toBe('number');
        expect(step.step).toBe(lastStep + 1);
        lastStep = step.step;
        expect(typeof step.title).toBe('string');
        expect(step.title.length).toBeGreaterThan(0);
        expect(typeof step.durationMinutes).toBe('number');
        expect(step.durationMinutes).toBeGreaterThan(0);
        expect(typeof step.intent).toBe('string');
        expect(step.intent.length).toBeGreaterThan(0);
        agendaTotal += step.durationMinutes;
      }
      expect(agendaTotal).toBe(template.durationMinutes);

      expect(Array.isArray(template.outputs)).toBe(true);
      expect(template.outputs.length).toBeGreaterThanOrEqual(1);
      for (const o of template.outputs) {
        expect(typeof o).toBe('string');
        expect(o.length).toBeGreaterThan(0);
      }

      expect(Array.isArray(template.facilitatorNotes)).toBe(true);
      for (const n of template.facilitatorNotes) {
        expect(typeof n).toBe('string');
        expect(n.length).toBeGreaterThan(0);
      }

      expect(template.createdFrom).toBe(
        'deterministic_workshop_template_library_seed',
      );
    }
  });
});

// ---------------------------------------------------------------------
// No-fabrication invariants
// ---------------------------------------------------------------------

describe('no fabrication', () => {
  function fields(template: WorkshopTemplate): string[] {
    return [
      template.title,
      template.purpose,
      template.decisionToLand,
      ...template.inputs.required,
      ...template.inputs.optional,
      ...template.outputs,
      ...template.facilitatorNotes,
      ...template.agenda.map((s) => s.title),
      ...template.agenda.map((s) => s.intent),
    ];
  }

  it('no field invents a dollar amount', () => {
    const dollarPattern = /\$\s?\d/;
    for (const t of buildWorkshopTemplateLibrary()) {
      for (const f of fields(t)) {
        expect(f).not.toMatch(dollarPattern);
      }
    }
  });

  it('no field claims a real E-### evidence citation', () => {
    const eidPattern = /\bE-\d{2,}\b/;
    for (const t of buildWorkshopTemplateLibrary()) {
      for (const f of fields(t)) {
        expect(f).not.toMatch(eidPattern);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Summary reconciliation
// ---------------------------------------------------------------------

describe('summarizeWorkshopTemplateLibrary', () => {
  it('byCategory counts sum to totalCount', () => {
    const library = buildWorkshopTemplateLibrary();
    const summary = summarizeWorkshopTemplateLibrary(library);
    expect(summary.totalCount).toBe(library.length);
    const sum = Object.values(summary.byCategory).reduce((a, b) => a + b, 0);
    expect(sum).toBe(library.length);
  });

  it('totalDurationMinutes equals the sum of every template duration', () => {
    const library = buildWorkshopTemplateLibrary();
    const summary = summarizeWorkshopTemplateLibrary(library);
    const expected = library.reduce((a, t) => a + t.durationMinutes, 0);
    expect(summary.totalDurationMinutes).toBe(expected);
  });

  it('uniqueCategories enumerates exactly the represented categories in canonical order', () => {
    const library = buildWorkshopTemplateLibrary();
    const summary = summarizeWorkshopTemplateLibrary(library);
    expect(summary.uniqueCategories).toEqual(REQUIRED_CATEGORIES);
  });

  it('summary on empty array zeroes the byCategory record', () => {
    const summary = summarizeWorkshopTemplateLibrary([]);
    expect(summary.totalCount).toBe(0);
    expect(summary.totalDurationMinutes).toBe(0);
    expect(summary.uniqueCategories.length).toBe(0);
    for (const category of REQUIRED_CATEGORIES) {
      expect(summary.byCategory[category]).toBe(0);
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene · workshop-template-library.ts
// ---------------------------------------------------------------------

describe('module hygiene · workshop-template-library.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/programs/workshop-template-library.ts',
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
// Canon hygiene · WorkshopTemplateLibrary.tsx
// ---------------------------------------------------------------------

describe('canon hygiene · WorkshopTemplateLibrary.tsx', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../components/programs/WorkshopTemplateLibrary.tsx',
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

  it('does not use React hooks (useState / useEffect / useMemo / useReducer / useCallback)', () => {
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
    // Per ABARVA_VISUAL_CANON acceptance gate: surfaces must use tokens
    // from src/lib/design/abarva-theme.ts; hard-coded color or font
    // duplication bypasses the canon and is forbidden.
    expect(codeOnly).toMatch(/from '@\/lib\/design\/abarva-theme'/);
    // No local hex literals — every color must come from the theme.
    expect(codeOnly).not.toMatch(/['"]#[0-9A-Fa-f]{6}['"]/);
    // No local DM Sans font-family literal — must read FONT.body.
    expect(codeOnly).not.toMatch(/['"]DM Sans[^'"]*['"]/);
  });
});
