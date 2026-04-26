// ADM6 · Users & Access Surface tests.

import {
  buildUsersAccessReadinessView,
  listRiskyPermissionFlags,
  summarizeUsersAccess,
  USERS_ACCESS_ROLES_IN_ORDER,
  type UsersAccessReadinessView,
  type UsersAccessRole,
} from '@/lib/admin/users-access-readiness';

// ---------------------------------------------------------------------
// Determinism + canonical role coverage
// ---------------------------------------------------------------------

describe('buildUsersAccessReadinessView · determinism + shape', () => {
  it('returns deterministic output across repeated calls', () => {
    const a = buildUsersAccessReadinessView();
    const b = buildUsersAccessReadinessView();
    expect(a).toEqual(b);
  });

  it('view createdFrom is the deterministic seed label', () => {
    const v = buildUsersAccessReadinessView();
    expect(v.createdFrom).toBe('deterministic_users_access_readiness_seed');
  });

  it('view exposes all 7 canonical roles', () => {
    const v = buildUsersAccessReadinessView();
    const roleKeys = v.roles.map((r) => r.role).sort();
    const expected = [...USERS_ACCESS_ROLES_IN_ORDER].sort();
    expect(roleKeys).toEqual(expected);
    expect(v.roles.length).toBe(7);
  });

  it('USERS_ACCESS_ROLES_IN_ORDER lists exactly the 7 canonical roles', () => {
    const expected: ReadonlyArray<UsersAccessRole> = [
      'platform_admin',
      'tenant_admin',
      'maestro',
      'sponsor',
      'investor',
      'steward',
      'observer',
    ];
    expect(USERS_ACCESS_ROLES_IN_ORDER).toEqual(expected);
  });

  it('every role carries a non-zero seat count and a scope note', () => {
    const v = buildUsersAccessReadinessView();
    for (const r of v.roles) {
      expect(r.count).toBeGreaterThanOrEqual(1);
      expect(r.scopeNote.length).toBeGreaterThan(0);
      expect(r.readOnlyToday).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// Risky permission flags surfaced when seeded
// ---------------------------------------------------------------------

describe('risky permission flags', () => {
  it('surfaces risky flags from the seed', () => {
    const v = buildUsersAccessReadinessView();
    expect(v.riskyFlags.length).toBeGreaterThan(0);
    for (const f of v.riskyFlags) {
      expect(['low', 'medium', 'high']).toContain(f.severity);
      expect(f.reason.length).toBeGreaterThan(0);
      expect(f.suggestedReview.length).toBeGreaterThan(0);
    }
  });

  it('listRiskyPermissionFlags orders by severity (high → medium → low)', () => {
    const v = buildUsersAccessReadinessView();
    const ordered = listRiskyPermissionFlags(v);
    const severityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
    for (let i = 1; i < ordered.length; i++) {
      const prev = severityRank[ordered[i - 1].severity];
      const curr = severityRank[ordered[i].severity];
      expect(prev).toBeLessThanOrEqual(curr);
    }
  });
});

// ---------------------------------------------------------------------
// Summary helper
// ---------------------------------------------------------------------

describe('summarizeUsersAccess', () => {
  it('reports totalSeats matching role-count sum', () => {
    const v = buildUsersAccessReadinessView();
    const s = summarizeUsersAccess(v);
    const sum = v.roles.reduce((acc, r) => acc + r.count, 0);
    expect(s.totalSeats).toBe(sum);
    expect(s.totalRoles).toBe(7);
    expect(s.pendingInvites).toBe(0);
  });

  it('roleDistributionSentence reads as roles + counts (no real names)', () => {
    const v = buildUsersAccessReadinessView();
    const s = summarizeUsersAccess(v);
    // Sentence references the canonical role keys.
    expect(s.roleDistributionSentence).toMatch(/maestro|sponsor|steward|observer|admin|investor/);
    // The sentence must not contain a "First Last" capitalized pair.
    expect(s.roleDistributionSentence).not.toMatch(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/);
  });
});

// ---------------------------------------------------------------------
// No live mutation claim · no real person names
// ---------------------------------------------------------------------

describe('no live auth mutation claim', () => {
  function serializeView(v: UsersAccessReadinessView): string {
    return JSON.stringify(v);
  }

  it('serialized view never claims an active "edit user", "invite", or "revoke" verb', () => {
    const v = buildUsersAccessReadinessView();
    const serialized = serializeView(v).toLowerCase();
    // Active-voice verbs that would imply live mutation are forbidden.
    expect(serialized).not.toMatch(/\bedit user\b/);
    expect(serialized).not.toMatch(/\binviting\b/);
    expect(serialized).not.toMatch(/\brevoking\b/);
    expect(serialized).not.toMatch(/\binvited successfully\b/);
    expect(serialized).not.toMatch(/\brevoked successfully\b/);
    expect(serialized).not.toMatch(/\buser created\b/);
    expect(serialized).not.toMatch(/\buser deleted\b/);
  });

  it('any "invite" mention is annotated as a future / not-wired placeholder', () => {
    const v = buildUsersAccessReadinessView();
    const serialized = serializeView(v).toLowerCase();
    if (serialized.includes('invite')) {
      // Acceptable forms: "0 pending — invite system not wired",
      // "invite system not wired", etc. Caller must not promise a working invite.
      expect(serialized).toMatch(/invite (system|api|pipeline|flow|runtime)/);
      expect(serialized).toMatch(/not wired|deferred|not yet wired/);
    }
  });

  it('view never enumerates a real person name (First Last pattern)', () => {
    const v = buildUsersAccessReadinessView();
    const serialized = serializeView(v);
    // Capture every "Capitalized Capitalized" pair, then assert none of
    // them looks like a real human name (i.e. excluded from a known
    // allow-list of canonical labels).
    const matches = serialized.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g) ?? [];
    const allowList = new Set<string>([
      'AbarVa Platform',
      'Apex Retail',
      'Customer Data',
      'Data Platform',
      'Store Associate',
      'Associate Productivity',
      'Demand Forecasting',
      'Contact Center',
    ]);
    const offenders = matches.filter((m) => !allowList.has(m));
    expect(offenders).toEqual([]);
  });
});

// ---------------------------------------------------------------------
// Module hygiene · users-access-readiness.ts
// ---------------------------------------------------------------------

describe('module hygiene · users-access-readiness.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/admin/users-access-readiness.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  it('does not call Date.now / Math.random / new Date / fetch', () => {
    expect(codeOnly).not.toMatch(/Date\.now\s*\(/);
    expect(codeOnly).not.toMatch(/Math\.random\s*\(/);
    expect(codeOnly).not.toMatch(/new\s+Date\s*\(/);
    expect(codeOnly).not.toMatch(/\bfetch\s*\(/);
  });

  it('does not import anthropic / openai / model providers', () => {
    expect(codeOnly).not.toMatch(/from\s+['"]@anthropic-ai\//);
    expect(codeOnly).not.toMatch(/from\s+['"]anthropic['"]/);
    expect(codeOnly).not.toMatch(/from\s+['"]openai['"]/);
  });

  it('does not import auth / source / sentinel / atlas / nexus / agent runtime', () => {
    expect(codeOnly).not.toMatch(/from\s+['"]@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from\s+['"]@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from\s+['"]@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from\s+['"]@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from\s+['"]@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from\s+['"]@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from\s+['"]@\/components\/agent\//);
  });
});

// ---------------------------------------------------------------------
// Canon hygiene · UsersAccessSurface.tsx
// ---------------------------------------------------------------------

describe('canon hygiene · UsersAccessSurface.tsx', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const sourcePath = path.resolve(
    __dirname,
    '../../../components/admin/UsersAccessSurface.tsx',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  it('imports COLORS / FONT / BORDER / RADIUS / SPACING / TYPE from @/lib/design/abarva-theme', () => {
    expect(codeOnly).toMatch(/from\s+['"]@\/lib\/design\/abarva-theme['"]/);
    expect(codeOnly).toMatch(/COLORS/);
    expect(codeOnly).toMatch(/FONT/);
    expect(codeOnly).toMatch(/BORDER/);
    expect(codeOnly).toMatch(/RADIUS/);
    expect(codeOnly).toMatch(/SPACING/);
    expect(codeOnly).toMatch(/TYPE/);
  });

  it('does not declare local hex literals (canon §L acceptance gate #8)', () => {
    expect(codeOnly).not.toMatch(/['"]#[0-9A-Fa-f]{6}['"]/);
    expect(codeOnly).not.toMatch(/['"]#[0-9A-Fa-f]{3}['"]/);
  });

  it('does not declare a local DM Sans font literal', () => {
    expect(codeOnly).not.toMatch(/['"]DM Sans[^'"]*['"]/);
  });

  it("is a server component (no 'use client' directive)", () => {
    expect(source).not.toMatch(/^['"]use client['"]/m);
  });

  it('does not use React hooks (useState / useEffect / useMemo / useReducer / useCallback)', () => {
    expect(codeOnly).not.toMatch(/\buseState\b/);
    expect(codeOnly).not.toMatch(/\buseEffect\b/);
    expect(codeOnly).not.toMatch(/\buseMemo\b/);
    expect(codeOnly).not.toMatch(/\buseReducer\b/);
    expect(codeOnly).not.toMatch(/\buseCallback\b/);
  });

  it('does not import Clerk runtime auth', () => {
    expect(codeOnly).not.toMatch(/from\s+['"]@clerk\//);
  });

  it('imports the AbarVa AgentBadge primitive (Steward guidance label)', () => {
    expect(codeOnly).toMatch(/from\s+['"]@\/components\/abarva\/AgentBadge['"]/);
    expect(codeOnly).toMatch(/<AgentBadge\b/);
  });

  it('does not import auth / source / sentinel / atlas / nexus / agent runtime', () => {
    expect(codeOnly).not.toMatch(/from\s+['"]@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from\s+['"]@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from\s+['"]@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from\s+['"]@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from\s+['"]@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from\s+['"]@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from\s+['"]@\/components\/agent\//);
  });

  it('does not perform live network calls (no fetch / no Date.now / no Math.random)', () => {
    expect(codeOnly).not.toMatch(/\bfetch\s*\(/);
    expect(codeOnly).not.toMatch(/Date\.now\s*\(/);
    expect(codeOnly).not.toMatch(/Math\.random\s*\(/);
  });

  it('renders the canonical eyebrow label "USERS & ACCESS · ADM6"', () => {
    expect(source).toMatch(/USERS &amp; ACCESS · ADM6|USERS & ACCESS · ADM6/);
  });

  it('renders the canonical footer caption naming the deterministic seed', () => {
    expect(source).toMatch(/deterministic users-access readiness seed/);
    expect(source).toMatch(/no live auth mutation/);
  });

  it('disables the future verbs (edit / invite / revoke) with "future · not yet wired"', () => {
    expect(source).toMatch(/future · not yet wired/);
    expect(source).toMatch(/Edit/);
    expect(source).toMatch(/Invite/);
    expect(source).toMatch(/Revoke/);
  });
});
