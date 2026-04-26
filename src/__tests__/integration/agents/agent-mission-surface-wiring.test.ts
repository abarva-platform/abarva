// AG12 - Agent Mission Surface Wiring tests.
//
// Verifies that the AG11 AgentMissionPanel server component is mounted
// on each of the four canonical surfaces (Programs, Tower, Intelligence,
// Admin) with the correct variant and the correct AG10 surface filter
// applied. Tests are file-pure source-grep + runtime checks: no client
// rendering, no model calls, no time-of-day dependence.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildAgentMissionsForSurface,
  getTopAgentMissions,
} from '@/lib/agents/agent-mission-queue';

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function readSourceFile(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf-8');
}

// Strip line + block comments and double/single/template string literals
// so hygiene assertions only check executable code introduced by AG12.
// Pre-existing prose in file headers (e.g. "No Date.now()" or
// "no OpenAI invocation") must not produce false positives.
function stripCommentsAndStrings(source: string): string {
  let result = '';
  let i = 0;
  const n = source.length;
  while (i < n) {
    const ch = source[i];
    const next = source[i + 1];
    // Line comment
    if (ch === '/' && next === '/') {
      while (i < n && source[i] !== '\n') i++;
      continue;
    }
    // Block comment
    if (ch === '/' && next === '*') {
      i += 2;
      while (i < n && !(source[i] === '*' && source[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    // Double-quoted string
    if (ch === '"') {
      i++;
      while (i < n && source[i] !== '"') {
        if (source[i] === '\\') i += 2;
        else i++;
      }
      i++;
      continue;
    }
    // Single-quoted string
    if (ch === "'") {
      i++;
      while (i < n && source[i] !== "'") {
        if (source[i] === '\\') i += 2;
        else i++;
      }
      i++;
      continue;
    }
    // Template literal
    if (ch === '`') {
      i++;
      while (i < n && source[i] !== '`') {
        if (source[i] === '\\') i += 2;
        else i++;
      }
      i++;
      continue;
    }
    result += ch;
    i++;
  }
  return result;
}

const SURFACE_FILES = {
  programs: 'src/components/programs/ProgramCanonicalDetail.tsx',
  tower: 'src/components/tower/ProgramPressureCards.tsx',
  intelligence: 'src/components/intelligence/SentinelActivePatterns.tsx',
  admin: 'src/components/admin/StewardSetupControlCenter.tsx',
} as const;

const SURFACE_VARIANTS: Record<keyof typeof SURFACE_FILES, string> = {
  programs: 'right_panel',
  tower: 'executive_brief',
  intelligence: 'inline_recommendation',
  admin: 'compact_strip',
};

const SURFACE_LABELS: Record<keyof typeof SURFACE_FILES, string> = {
  programs: 'Program detail',
  tower: 'AI Control Tower',
  intelligence: 'Sentinel Brief',
  admin: 'Admin Setup',
};

const SURFACE_KEYS = Object.keys(SURFACE_FILES) as Array<
  keyof typeof SURFACE_FILES
>;

// ---------------------------------------------------------------------
// Import + helper coverage
// ---------------------------------------------------------------------

describe('AG12 · surface wiring · imports and helpers', () => {
  it.each(SURFACE_KEYS)(
    '%s component imports AgentMissionPanel from @/components/agents/AgentMissionPanel',
    (surface) => {
      const source = readSourceFile(SURFACE_FILES[surface]);
      expect(source).toMatch(
        /import\s*\{\s*AgentMissionPanel\s*\}\s*from\s*['"]@\/components\/agents\/AgentMissionPanel['"]/,
      );
    },
  );

  it.each(SURFACE_KEYS)(
    '%s component references buildAgentMissionsForSurface from AG10',
    (surface) => {
      const source = readSourceFile(SURFACE_FILES[surface]);
      expect(source.includes('buildAgentMissionsForSurface')).toBe(true);
      expect(source).toMatch(
        /from\s*['"]@\/lib\/agents\/agent-mission-queue['"]/,
      );
    },
  );

  it.each(SURFACE_KEYS)(
    '%s component caps the visible mission list at 3 (slice(0, 3) or getTopAgentMissions(_, 3))',
    (surface) => {
      const source = readSourceFile(SURFACE_FILES[surface]);
      const hasSliceCap = /\.slice\(\s*0\s*,\s*3\s*\)/.test(source);
      const hasTopCap = /getTopAgentMissions\([^)]*,\s*3\s*\)/.test(source);
      expect(hasSliceCap || hasTopCap).toBe(true);
    },
  );
});

// ---------------------------------------------------------------------
// Variant + surface-label coverage
// ---------------------------------------------------------------------

describe('AG12 · surface wiring · variant + label correctness', () => {
  it.each(SURFACE_KEYS)(
    '%s component declares the correct AG11 variant string',
    (surface) => {
      const source = readSourceFile(SURFACE_FILES[surface]);
      const variant = SURFACE_VARIANTS[surface];
      const pattern = new RegExp(
        `variant\\s*:\\s*['"\`]${variant}['"\`]`,
      );
      expect(pattern.test(source)).toBe(true);
    },
  );

  it.each(SURFACE_KEYS)(
    '%s component declares the canonical AG12 surface label',
    (surface) => {
      const source = readSourceFile(SURFACE_FILES[surface]);
      const label = SURFACE_LABELS[surface];
      expect(source.includes(label)).toBe(true);
    },
  );

  it.each(SURFACE_KEYS)(
    '%s component mounts <AgentMissionPanel ... /> exactly once',
    (surface) => {
      const source = readSourceFile(SURFACE_FILES[surface]);
      const matches = source.match(/<AgentMissionPanel\b/g) ?? [];
      expect(matches.length).toBe(1);
    },
  );
});

// ---------------------------------------------------------------------
// Surface filter sanity (runtime check against AG10)
// ---------------------------------------------------------------------

describe('AG12 · surface wiring · AG10 filter sanity', () => {
  it('Programs surface yields at least one mission within {nexus, sentinel, steward}', () => {
    const missions = buildAgentMissionsForSurface('programs').filter(
      (m) =>
        m.agent === 'nexus' ||
        m.agent === 'sentinel' ||
        m.agent === 'steward',
    );
    const top = getTopAgentMissions(missions, 3);
    expect(top.length).toBeGreaterThanOrEqual(1);
    expect(top.length).toBeLessThanOrEqual(3);
    for (const mission of top) {
      expect(mission.workObject.surface).toBe('programs');
    }
  });

  it('Tower surface yields at least one mission within {atlas, steward}', () => {
    const missions = buildAgentMissionsForSurface('tower').filter(
      (m) => m.agent === 'atlas' || m.agent === 'steward',
    );
    const top = getTopAgentMissions(missions, 3);
    expect(top.length).toBeGreaterThanOrEqual(1);
    expect(top.length).toBeLessThanOrEqual(3);
    for (const mission of top) {
      expect(mission.workObject.surface).toBe('tower');
    }
  });

  it('Intelligence surface yields at least one mission within {sentinel, nexus}', () => {
    const missions = buildAgentMissionsForSurface('intelligence').filter(
      (m) => m.agent === 'sentinel' || m.agent === 'nexus',
    );
    const top = getTopAgentMissions(missions, 3);
    expect(top.length).toBeGreaterThanOrEqual(1);
    expect(top.length).toBeLessThanOrEqual(3);
    for (const mission of top) {
      expect(mission.workObject.surface).toBe('intelligence');
    }
  });

  it('Admin surface yields at least one Steward mission', () => {
    const missions = buildAgentMissionsForSurface('admin').filter(
      (m) => m.agent === 'steward',
    );
    const top = getTopAgentMissions(missions, 3);
    expect(top.length).toBeGreaterThanOrEqual(1);
    expect(top.length).toBeLessThanOrEqual(3);
    for (const mission of top) {
      expect(mission.workObject.surface).toBe('admin');
      expect(mission.agent).toBe('steward');
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene: forbidden imports / dynamic primitives must NOT
// be introduced by AG12 wiring.
// ---------------------------------------------------------------------

describe('AG12 · surface wiring · module hygiene', () => {
  it.each(SURFACE_KEYS)(
    '%s component does not import from forbidden lib paths',
    (surface) => {
      const source = readSourceFile(SURFACE_FILES[surface]);
      // Allow @/lib/agents (AG10) and @/components/agents (AG11) — these
      // are intentional AG12 dependencies — but forbid every other listed
      // path.
      expect(/from\s+['"]@\/lib\/source\//.test(source)).toBe(false);
      expect(/from\s+['"]@\/lib\/nexus\//.test(source)).toBe(false);
      expect(/from\s+['"]@\/lib\/auth\//.test(source)).toBe(false);
      expect(/from\s+['"]supabase/.test(source)).toBe(false);
    },
  );

  it.each(SURFACE_KEYS)(
    '%s component does not declare a "use client" directive',
    (surface) => {
      const source = readSourceFile(SURFACE_FILES[surface]);
      expect(/^\s*['"]use client['"]/m.test(source)).toBe(false);
    },
  );

  it.each(SURFACE_KEYS)(
    '%s component does not introduce useState or useEffect',
    (surface) => {
      const source = readSourceFile(SURFACE_FILES[surface]);
      expect(/\buseState\b/.test(source)).toBe(false);
      expect(/\buseEffect\b/.test(source)).toBe(false);
    },
  );

  it.each(SURFACE_KEYS)(
    '%s component does not call Date.now / new Date( / Math.random / fetch( in executable code',
    (surface) => {
      const stripped = stripCommentsAndStrings(
        readSourceFile(SURFACE_FILES[surface]),
      );
      expect(/Date\.now\s*\(/.test(stripped)).toBe(false);
      expect(/new\s+Date\s*\(/.test(stripped)).toBe(false);
      expect(/Math\.random\s*\(/.test(stripped)).toBe(false);
      expect(/\bfetch\s*\(/.test(stripped)).toBe(false);
    },
  );

  it.each(SURFACE_KEYS)(
    '%s component does not import anthropic or openai providers',
    (surface) => {
      const source = readSourceFile(SURFACE_FILES[surface]);
      // Pre-existing prose may mention OpenAI / Anthropic in honest
      // disclaimers (e.g. "no Atlas / Claude / OpenAI invocation"); the
      // contract is that no actual provider import is introduced.
      expect(
        /from\s+['"][^'"]*anthropic[^'"]*['"]/i.test(source),
      ).toBe(false);
      expect(
        /from\s+['"][^'"]*openai[^'"]*['"]/i.test(source),
      ).toBe(false);
      expect(/require\(\s*['"][^'"]*anthropic[^'"]*['"]\s*\)/i.test(source)).toBe(
        false,
      );
      expect(/require\(\s*['"][^'"]*openai[^'"]*['"]\s*\)/i.test(source)).toBe(
        false,
      );
    },
  );

  it.each(SURFACE_KEYS)(
    '%s component contains no banned placeholder language',
    (surface) => {
      const source = readSourceFile(SURFACE_FILES[surface]);
      expect(/Coming\s+soon/i.test(source)).toBe(false);
      expect(/\bTBD\b/.test(source)).toBe(false);
      expect(/Lorem\s+ipsum/i.test(source)).toBe(false);
    },
  );
});
