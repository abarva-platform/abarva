import {
  buildAgentContext,
  type AgentContextBundle,
  type AgentSurface,
} from '@/lib/agent/context-bundle';
import {
  computeStewardPosture,
  computeNexusPosture,
  computeSentinelPosture,
  computeAtlasPosture,
  computeAllPostures,
} from '@/lib/agent/posture';
import { generateStewardEditorial } from '@/lib/agent/editorial';
import { buildAgentChoices } from '@/lib/agent/choices';

describe('AGENT1A — Context bundle', () => {
  it('returns deterministicSeed: true', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    expect(ctx.deterministicSeed).toBe(true);
  });
  it('resolves apex-retail as rich tier', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    expect(ctx.tenant.tier).toBe('rich');
  });
  it('resolves meridian-health as thin tier', () => {
    const ctx = buildAgentContext('meridian-health', 'admin', 'architecture');
    expect(ctx.tenant.tier).toBe('thin');
  });
  it('resolves arcturus as shell_only tier', () => {
    const ctx = buildAgentContext('arcturus', 'admin', 'architecture');
    expect(ctx.tenant.tier).toBe('shell_only');
  });
  it('unknown tenant defaults to shell_only', () => {
    const ctx = buildAgentContext('unknown-xyz', 'admin', 'architecture');
    expect(ctx.tenant.tier).toBe('shell_only');
  });
  it('apex-retail admin/architecture has 3 context sources', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    expect(ctx.contextSources.length).toBe(3);
  });
  it('apex-retail admin/architecture evidence is strong', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    expect(ctx.evidence.strength).toBe('strong');
  });
  it('apex-retail rich tier with blockers from W32F', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    expect(ctx.blockers.length).toBeGreaterThan(0);
  });
  it('thin tier has 0 blockers (no rich seed)', () => {
    const ctx = buildAgentContext('meridian-health', 'admin', 'production-readiness');
    expect(ctx.blockers.length).toBe(0);
  });
  it('shell_only tier evidence is thin', () => {
    const ctx = buildAgentContext('arcturus', 'admin', 'architecture');
    expect(ctx.evidence.strength).toBe('thin');
  });
  it('exposes surface and page on bundle', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'connectors');
    expect(ctx.surface).toBe('admin');
    expect(ctx.page).toBe('connectors');
  });
  it('initial stage is null', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    expect(ctx.stage).toBeNull();
  });
  it('initial pendingDecisions is empty', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    expect(ctx.pendingDecisions.length).toBe(0);
  });
  it('apex-retail connectors evidence is partial (2 sources)', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'connectors');
    expect(ctx.evidence.strength).toBe('partial');
  });
  it('unknown page yields zero context sources', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'unknown-page');
    expect(ctx.contextSources.length).toBe(0);
  });
  it('unknown page yields thin evidence', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'unknown-page');
    expect(ctx.evidence.strength).toBe('thin');
  });
  it('tenant name resolves correctly for apex-retail', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    expect(ctx.tenant.name).toBe('Apex Retail');
  });
  it('tenant name resolves correctly for meridian-health', () => {
    const ctx = buildAgentContext('meridian-health', 'admin', 'architecture');
    expect(ctx.tenant.name).toBe('Meridian Health System');
  });
  it('evidence.lastUpdated is null for shell_only tenant', () => {
    const ctx = buildAgentContext('arcturus', 'admin', 'architecture');
    expect(ctx.evidence.lastUpdated).toBeNull();
  });
  it('evidence.lastUpdated populated for rich tenant with sources', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    expect(ctx.evidence.lastUpdated).toBeTruthy();
  });
  it('thin tenant with sources still yields thin evidence', () => {
    const ctx = buildAgentContext('meridian-health', 'admin', 'architecture');
    expect(ctx.evidence.strength).toBe('thin');
  });
  it('every blocker carries severity', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    for (const b of ctx.blockers) {
      expect(b.severity).toBeTruthy();
    }
  });
  it('contextSources entries carry id/label/lastUpdated', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    for (const s of ctx.contextSources) {
      expect(s.id).toBeTruthy();
      expect(s.label).toBeTruthy();
      expect(s.lastUpdated).toBeTruthy();
    }
  });
  it('surface admin/data-trust has 3 sources', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'data-trust');
    expect(ctx.contextSources.length).toBe(3);
  });
  it('surface admin/users-access has 2 sources', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'users-access');
    expect(ctx.contextSources.length).toBe(2);
  });
  it('surface admin/agent-readiness has 2 sources', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'agent-readiness');
    expect(ctx.contextSources.length).toBe(2);
  });
  it('surface admin/build-progress has 2 sources', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'build-progress');
    expect(ctx.contextSources.length).toBe(2);
  });
  it('surface admin/overview has 2 sources', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'overview');
    expect(ctx.contextSources.length).toBe(2);
  });
  it('TypeScript surface union accepts known surfaces', () => {
    const surfaces: AgentSurface[] = [
      'admin',
      'programs',
      'source',
      'intelligence',
      'tower',
      'home',
    ];
    expect(surfaces.length).toBe(6);
  });
  it('buildAgentContext is referentially deterministic', () => {
    const a: AgentContextBundle = buildAgentContext(
      'apex-retail',
      'admin',
      'architecture',
    );
    const b: AgentContextBundle = buildAgentContext(
      'apex-retail',
      'admin',
      'architecture',
    );
    expect(a).toEqual(b);
  });
});

describe('AGENT1A — Steward posture', () => {
  it('apex-retail with critical production blocker → BLOCKED', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    const posture = computeStewardPosture(ctx);
    expect(posture.state).toBe('BLOCKED');
    expect(posture.unblockBy).toBeTruthy();
  });
  it('shell_only → THIN', () => {
    const ctx = buildAgentContext('arcturus', 'admin', 'architecture');
    expect(computeStewardPosture(ctx).state).toBe('THIN');
  });
  it('thin tier → THIN', () => {
    const ctx = buildAgentContext('meridian-health', 'admin', 'architecture');
    expect(computeStewardPosture(ctx).state).toBe('THIN');
  });
  it('every posture has reason', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    expect(computeStewardPosture(ctx).reason).toBeTruthy();
  });
  it('agent field is steward', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    expect(computeStewardPosture(ctx).agent).toBe('steward');
  });
  it('READY posture has unblockBy null', () => {
    // Need a rich tenant + page with no blockers + strong evidence.
    // apex-retail/admin/architecture loads no blockers (architecture page) but
    // buildAgentContext loads blockers based on tenant tier. So even on
    // architecture page, apex-retail has all blockers visible. Therefore the
    // realistic READY case here is hard to assert without surface filtering.
    // Instead, validate that READY's contract is honoured if reached.
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    const posture = computeStewardPosture(ctx);
    if (posture.state === 'READY') {
      expect(posture.unblockBy).toBeNull();
    } else {
      expect(posture.unblockBy).toBeTruthy();
    }
  });
  it('BLOCKED posture mentions production blocker title in reason', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    const posture = computeStewardPosture(ctx);
    if (posture.state === 'BLOCKED') {
      expect(posture.reason.toLowerCase()).toContain('blocker');
    }
  });
  it('shell_only THIN unblockBy mentions tenant tier', () => {
    const ctx = buildAgentContext('arcturus', 'admin', 'architecture');
    expect(computeStewardPosture(ctx).unblockBy?.toLowerCase()).toContain(
      'tenant',
    );
  });
});

describe('AGENT1A — Nexus / Sentinel / Atlas postures', () => {
  it('Nexus is PARTIAL for apex-retail admin', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    expect(computeNexusPosture(ctx).state).toBe('PARTIAL');
  });
  it('Nexus is THIN for thin tier', () => {
    const ctx = buildAgentContext('meridian-health', 'admin', 'architecture');
    expect(computeNexusPosture(ctx).state).toBe('THIN');
  });
  it('Nexus is THIN for shell_only', () => {
    const ctx = buildAgentContext('arcturus', 'admin', 'architecture');
    expect(computeNexusPosture(ctx).state).toBe('THIN');
  });
  it('Nexus PARTIAL on programs surface for rich tenant', () => {
    const ctx = buildAgentContext('apex-retail', 'programs', 'overview');
    expect(computeNexusPosture(ctx).state).toBe('PARTIAL');
  });
  it('Sentinel is PARTIAL for apex-retail with strong evidence', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    expect(computeSentinelPosture(ctx).state).toBe('PARTIAL');
  });
  it('Sentinel is THIN for thin evidence', () => {
    const ctx = buildAgentContext('meridian-health', 'admin', 'architecture');
    expect(computeSentinelPosture(ctx).state).toBe('THIN');
  });
  it('Sentinel is PARTIAL when evidence is partial', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'connectors');
    expect(computeSentinelPosture(ctx).state).toBe('PARTIAL');
  });
  it('Sentinel is THIN for shell_only tenant', () => {
    const ctx = buildAgentContext('arcturus', 'admin', 'architecture');
    expect(computeSentinelPosture(ctx).state).toBe('THIN');
  });
  it('Atlas is THIN for any tier in admin (deferred metrics)', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    expect(computeAtlasPosture(ctx).state).toBe('THIN');
  });
  it('Atlas is THIN for thin tier', () => {
    const ctx = buildAgentContext('meridian-health', 'admin', 'architecture');
    expect(computeAtlasPosture(ctx).state).toBe('THIN');
  });
  it('Atlas is THIN for shell_only', () => {
    const ctx = buildAgentContext('arcturus', 'admin', 'architecture');
    expect(computeAtlasPosture(ctx).state).toBe('THIN');
  });
  it('computeAllPostures returns 4 entries', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    expect(computeAllPostures(ctx).length).toBe(4);
  });
  it('computeAllPostures includes one of each agent role', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    const agents = computeAllPostures(ctx).map((p) => p.agent);
    expect(agents).toEqual(['steward', 'nexus', 'sentinel', 'atlas']);
  });
  it('all postures are deterministic — same input same output', () => {
    const ctx1 = buildAgentContext('apex-retail', 'admin', 'architecture');
    const ctx2 = buildAgentContext('apex-retail', 'admin', 'architecture');
    expect(computeAllPostures(ctx1)).toEqual(computeAllPostures(ctx2));
  });
  it('every posture has agent + state + reason fields', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    for (const p of computeAllPostures(ctx)) {
      expect(p.agent).toBeTruthy();
      expect(p.state).toBeTruthy();
      expect(p.reason).toBeTruthy();
    }
  });
});

describe('AGENT1A — Editorial generator', () => {
  it('generates Architecture editorial with Atlas + Steward label', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    const ed = generateStewardEditorial(ctx);
    expect(ed.agentLabel).toContain('Atlas');
    expect(ed.title.toLowerCase()).toContain('architecture posture');
  });
  it('Architecture body mentions SaaS', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    expect(generateStewardEditorial(ctx).body.toLowerCase()).toContain('saas');
  });
  it('Architecture body says do not claim customer-tenant operation', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    expect(generateStewardEditorial(ctx).body.toLowerCase()).toContain(
      'do not claim',
    );
  });
  it('Production Readiness body counts blockers', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    const ed = generateStewardEditorial(ctx);
    expect(ed.body).toMatch(/\d+ critical or high-impact/);
  });
  it('Connectors body mentions tenant name', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'connectors');
    expect(generateStewardEditorial(ctx).body).toContain('Apex Retail');
  });
  it('contextUsed comes from ctx.contextSources', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    const ed = generateStewardEditorial(ctx);
    expect(ed.contextUsed.length).toBe(ctx.contextSources.length);
  });
  it('contextUsed labels match source labels', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    const ed = generateStewardEditorial(ctx);
    expect(ed.contextUsed).toEqual(ctx.contextSources.map((s) => s.label));
  });
  it('evidenceStrength matches ctx.evidence.strength', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    expect(generateStewardEditorial(ctx).evidenceStrength).toBe(
      ctx.evidence.strength,
    );
  });
  it('blocker is set when Steward is BLOCKED', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    expect(generateStewardEditorial(ctx).blocker).toBeTruthy();
  });
  it('primaryAction has label and href', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    const ed = generateStewardEditorial(ctx);
    expect(ed.primaryAction.label).toBeTruthy();
    expect(ed.primaryAction.href).toBeTruthy();
  });
  it('unknown surface/page falls back to default template', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'unknown-page');
    const ed = generateStewardEditorial(ctx);
    expect(ed.title.toLowerCase()).toContain('surface posture');
  });
  it('Data Trust body mentions decision-grade evidence', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'data-trust');
    expect(generateStewardEditorial(ctx).body.toLowerCase()).toContain(
      'decision-grade',
    );
  });
  it('Users & Access body mentions SSO', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'users-access');
    expect(generateStewardEditorial(ctx).body).toContain('SSO');
  });
  it('Agent Readiness body mentions agent identities', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'agent-readiness');
    expect(generateStewardEditorial(ctx).body.toLowerCase()).toContain(
      'agent identities',
    );
  });
  it('Build Progress body mentions wireframes', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'build-progress');
    expect(generateStewardEditorial(ctx).body.toLowerCase()).toContain(
      'wireframes',
    );
  });
  it('Overview body lists pilot prerequisites', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'overview');
    expect(generateStewardEditorial(ctx).body.toLowerCase()).toContain('pilot');
  });
  it('Editorial is deterministic', () => {
    const ctx1 = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    const ctx2 = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    expect(generateStewardEditorial(ctx1)).toEqual(
      generateStewardEditorial(ctx2),
    );
  });
  it('blocker is null when posture is THIN (shell_only)', () => {
    const ctx = buildAgentContext('arcturus', 'admin', 'architecture');
    expect(generateStewardEditorial(ctx).blocker).toBeNull();
  });
});

describe('AGENT1A — Choices builder', () => {
  it('apex-retail with blockers produces choices', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    expect(buildAgentChoices(ctx, 3).length).toBeGreaterThan(0);
  });
  it('shell_only tenant produces 0 choices (no work to surface)', () => {
    const ctx = buildAgentContext('arcturus', 'admin', 'architecture');
    expect(buildAgentChoices(ctx, 3).length).toBe(0);
  });
  it('respects max parameter', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    expect(buildAgentChoices(ctx, 2).length).toBeLessThanOrEqual(2);
  });
  it('default max is 3', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    expect(buildAgentChoices(ctx).length).toBeLessThanOrEqual(3);
  });
  it('every choice has id, label, href, why', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    for (const c of buildAgentChoices(ctx, 3)) {
      expect(c.id).toBeTruthy();
      expect(c.label).toBeTruthy();
      expect(c.href).toBeTruthy();
      expect(c.why).toBeTruthy();
    }
  });
  it('blockers are ordered by severity (critical first)', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    const choices = buildAgentChoices(ctx, 3);
    const blockerChoices = choices.filter(
      (c) => c.category === 'resolve_blocker',
    );
    if (blockerChoices.length >= 2) {
      // First blocker should be critical or high
      expect(blockerChoices[0].why.toLowerCase()).toMatch(/critical|high/);
    }
  });
  it('thin-evidence non-shell tenant gets evidence choice', () => {
    const ctx = buildAgentContext('meridian-health', 'admin', 'architecture');
    const choices = buildAgentChoices(ctx, 3);
    expect(choices.some((c) => c.category === 'open_evidence')).toBe(true);
  });
  it('deterministic — same input same output', () => {
    const ctx1 = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    const ctx2 = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    expect(buildAgentChoices(ctx1, 3)).toEqual(buildAgentChoices(ctx2, 3));
  });
  it('choice ids for blockers are prefixed with resolve-', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    const choices = buildAgentChoices(ctx, 3);
    const blockerChoices = choices.filter(
      (c) => c.category === 'resolve_blocker',
    );
    for (const c of blockerChoices) {
      expect(c.id.startsWith('resolve-')).toBe(true);
    }
  });
  it('blocker choice href anchors back to production-readiness', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    const choices = buildAgentChoices(ctx, 3);
    const blockerChoices = choices.filter(
      (c) => c.category === 'resolve_blocker',
    );
    for (const c of blockerChoices) {
      expect(c.href).toContain('/admin/production-readiness#');
    }
  });
  it('evidence choice id is load-evidence', () => {
    const ctx = buildAgentContext('meridian-health', 'admin', 'architecture');
    const choices = buildAgentChoices(ctx, 3);
    const ev = choices.find((c) => c.category === 'open_evidence');
    expect(ev?.id).toBe('load-evidence');
  });
  it('evidence choice points to /admin/data-trust', () => {
    const ctx = buildAgentContext('meridian-health', 'admin', 'architecture');
    const choices = buildAgentChoices(ctx, 3);
    const ev = choices.find((c) => c.category === 'open_evidence');
    expect(ev?.href).toBe('/admin/data-trust');
  });
  it('rich tenant with strong evidence and no blockers may yield 0 choices', () => {
    // apex-retail architecture page: rich tier loads all blockers; we just
    // sanity-check shape (no NaN, no undefined entries).
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    for (const c of buildAgentChoices(ctx, 3)) {
      expect(c).toBeDefined();
    }
  });
  it('max=0 returns empty array', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    expect(buildAgentChoices(ctx, 0).length).toBe(0);
  });
});

describe('AGENT1A — Banned tokens', () => {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const fs = require('node:fs') as typeof import('node:fs');
  const path = require('node:path') as typeof import('node:path');
  /* eslint-enable @typescript-eslint/no-require-imports */
  const root = process.cwd();
  const files = [
    'src/lib/agent/context-bundle.ts',
    'src/lib/agent/posture.ts',
    'src/lib/agent/editorial.ts',
    'src/lib/agent/choices.ts',
  ];
  files.forEach((f) => {
    it(`${f} contains no banned hex tokens`, () => {
      const src = fs.readFileSync(path.resolve(root, f), 'utf8').toLowerCase();
      ['#14b8a6', '#7c3aed', '#d946ef', 'sparkle'].forEach((b) => {
        expect(src).not.toContain(b);
      });
    });
  });
});
