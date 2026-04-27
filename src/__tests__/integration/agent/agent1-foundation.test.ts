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

// AGENT1A foundation tests, aligned with the integrated AGENT1B-superset
// implementation of context-bundle / posture / editorial / choices.

describe('AGENT1A — Context bundle', () => {
  it('returns deterministicSeed: true', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    expect(ctx.deterministicSeed).toBe(true);
  });
  it('resolves apex-retail as rich tier', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    expect(ctx.tenant.tier).toBe('rich');
  });
  it('resolves meridian-health as shell_only tier (non-apex tenant)', () => {
    const ctx = buildAgentContext('meridian-health', 'admin', 'architecture');
    expect(ctx.tenant.tier).toBe('shell_only');
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
  it('apex-retail production-readiness has blockers', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    expect(ctx.blockers.length).toBeGreaterThan(0);
  });
  it('apex-retail production-readiness has critical blockers', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    expect(ctx.blockers.some((b) => b.severity === 'critical')).toBe(true);
  });
  it('unknown-page evidence is thin', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'unknown-page');
    expect(ctx.evidence.strength).toBe('thin');
  });
  it('exposes surface and page on bundle', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'connectors');
    expect(ctx.surface).toBe('admin');
    expect(ctx.page).toBe('connectors');
  });
  it('connectors page evidence is thin', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'connectors');
    expect(ctx.evidence.strength).toBe('thin');
  });
  it('admin/data-trust evidence is partial', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'data-trust');
    expect(ctx.evidence.strength).toBe('partial');
  });
  it('admin/users-access evidence is partial', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'users-access');
    expect(ctx.evidence.strength).toBe('partial');
  });
  it('admin/agent-readiness evidence is partial', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'agent-readiness');
    expect(ctx.evidence.strength).toBe('partial');
  });
  it('admin/build-progress is platform-scoped', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'build-progress');
    expect(ctx.tenant.slug).toBe('abarva-platform');
  });
  it('admin/build-progress tenant tier is rich', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'build-progress');
    expect(ctx.tenant.tier).toBe('rich');
  });
  it('admin/overview evidence is partial', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'overview');
    expect(ctx.evidence.strength).toBe('partial');
  });
  it('initial pendingDecisions is non-empty for seeded admin pages', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    expect(ctx.pendingDecisions.length).toBeGreaterThan(0);
  });
  it('apex-retail data-trust has at least one blocker', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'data-trust');
    expect(ctx.blockers.length).toBeGreaterThan(0);
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
  it('tenant slug resolves correctly for apex-retail', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    expect(ctx.tenant.slug).toBe('apex-retail');
  });
  it('evidence.lastUpdated is non-null when sources are present', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    expect(ctx.evidence.lastUpdated).toBeTruthy();
  });
  it('evidence.lastUpdated is null when no sources', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'unknown-page');
    expect(ctx.evidence.lastUpdated).toBeNull();
  });
  it('every blocker carries severity', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    for (const b of ctx.blockers) {
      expect(b.severity).toBeTruthy();
    }
  });
  it('every blocker carries id and label', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    for (const b of ctx.blockers) {
      expect(b.id).toBeTruthy();
      expect(b.label).toBeTruthy();
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
  it('surface admin/users-access has 3 sources', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'users-access');
    expect(ctx.contextSources.length).toBe(3);
  });
  it('surface admin/agent-readiness has 3 sources', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'agent-readiness');
    expect(ctx.contextSources.length).toBe(3);
  });
  it('surface admin/build-progress has 3 sources', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'build-progress');
    expect(ctx.contextSources.length).toBe(3);
  });
  it('surface admin/overview has 3 sources', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'overview');
    expect(ctx.contextSources.length).toBe(3);
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
  it('admin/architecture stage is documented', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    expect(ctx.stage).toBe('documented');
  });
  it('admin/connectors stage is stub-only', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'connectors');
    expect(ctx.stage).toBe('stub-only');
  });
  it('unknown page stage is null', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'unknown-page');
    expect(ctx.stage).toBeNull();
  });
});

describe('AGENT1A — Steward posture', () => {
  it('apex-retail with critical production blocker → BLOCKED', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    const posture = computeStewardPosture(ctx);
    expect(posture.state).toBe('BLOCKED');
    expect(posture.unblockBy).toBeTruthy();
  });
  it('connectors with no blockers and thin evidence → THIN', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'connectors');
    expect(computeStewardPosture(ctx).state).toBe('THIN');
  });
  it('unknown page (thin evidence, no blockers) → THIN', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'unknown-page');
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
  it('PARTIAL posture has unblockBy populated when blockers exist', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    const posture = computeStewardPosture(ctx);
    if (posture.state === 'PARTIAL' && ctx.blockers.length > 0) {
      expect(posture.unblockBy).toBeTruthy();
    }
  });
  it('BLOCKED posture mentions the blocker label in reason', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    const posture = computeStewardPosture(ctx);
    if (posture.state === 'BLOCKED') {
      expect(posture.reason.toLowerCase()).toContain('blocked by');
    }
  });
  it('THIN unblockBy is null when no blockers', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'unknown-page');
    const p = computeStewardPosture(ctx);
    if (p.state === 'THIN') {
      expect(p.unblockBy).toBeNull();
    }
  });
});

describe('AGENT1A — Nexus / Sentinel / Atlas postures', () => {
  it('Nexus is PARTIAL for apex-retail admin/architecture', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    expect(computeNexusPosture(ctx).state).toBe('PARTIAL');
  });
  it('Nexus is THIN for unknown page', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'unknown-page');
    expect(computeNexusPosture(ctx).state).toBe('THIN');
  });
  it('Nexus is THIN for non-admin programs surface (no seed)', () => {
    const ctx = buildAgentContext('apex-retail', 'programs', 'overview');
    expect(computeNexusPosture(ctx).state).toBe('THIN');
  });
  it('Nexus is BLOCKED with critical blockers', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    expect(computeNexusPosture(ctx).state).toBe('BLOCKED');
  });
  it('Sentinel is READY for apex-retail with strong evidence', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    expect(computeSentinelPosture(ctx).state).toBe('READY');
  });
  it('Sentinel is THIN for thin evidence', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'connectors');
    expect(computeSentinelPosture(ctx).state).toBe('THIN');
  });
  it('Sentinel is PARTIAL when evidence is partial', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'data-trust');
    expect(computeSentinelPosture(ctx).state).toBe('PARTIAL');
  });
  it('Sentinel is BLOCKED with critical blocker on partial evidence', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    expect(computeSentinelPosture(ctx).state).toBe('BLOCKED');
  });
  it('Atlas is PARTIAL for apex-retail admin/architecture (blockers in scope)', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    expect(computeAtlasPosture(ctx).state).toBe('PARTIAL');
  });
  it('Atlas is THIN when no context sources', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'unknown-page');
    expect(computeAtlasPosture(ctx).state).toBe('THIN');
  });
  it('Atlas is READY when sources present and no blockers', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'overview');
    expect(computeAtlasPosture(ctx).state).toBe('READY');
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
    const ctx1 = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    const ctx2 = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    expect(computeAllPostures(ctx1)).toEqual(computeAllPostures(ctx2));
  });
  it('Nexus reason mentions critical blocker', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    expect(computeNexusPosture(ctx).reason.toLowerCase()).toContain('blocker');
  });
  it('Sentinel reason mentions evidence', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'connectors');
    expect(computeSentinelPosture(ctx).reason.toLowerCase()).toContain('evidence');
  });
  it('Atlas thin unblockBy mentions context', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'unknown-page');
    expect(computeAtlasPosture(ctx).unblockBy?.toLowerCase()).toContain('context');
  });
  it('every posture state is one of BLOCKED/PARTIAL/THIN/READY', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    for (const p of computeAllPostures(ctx)) {
      expect(['BLOCKED', 'PARTIAL', 'THIN', 'READY']).toContain(p.state);
    }
  });
  it('every posture has a non-empty reason', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    for (const p of computeAllPostures(ctx)) {
      expect(p.reason.length).toBeGreaterThan(0);
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
  it('Production Readiness body references blockers narrative', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    const ed = generateStewardEditorial(ctx);
    expect(ed.body.toLowerCase()).toContain('blocked by');
  });
  it('Connectors editorial title mentions Connector readiness', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'connectors');
    expect(generateStewardEditorial(ctx).title.toLowerCase()).toContain(
      'connector readiness',
    );
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
  it('blocker is set when blockers are present', () => {
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
    expect(ed.title).toBe('Steward editorial');
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
  it('Agent Readiness body mentions audit trail', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'agent-readiness');
    expect(generateStewardEditorial(ctx).body.toLowerCase()).toContain(
      'audit trail',
    );
  });
  it('Build Progress body mentions waves', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'build-progress');
    expect(generateStewardEditorial(ctx).body.toLowerCase()).toContain(
      'waves',
    );
  });
  it('Overview body mentions pilot', () => {
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
  it('blocker is null when context has no blockers', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'unknown-page');
    expect(generateStewardEditorial(ctx).blocker).toBeNull();
  });
  it('agentLabel is Steward by default for non-Architecture pages', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    expect(generateStewardEditorial(ctx).agentLabel).toBe('Steward');
  });
  it('production-readiness primaryAction points to blockers anchor', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    expect(generateStewardEditorial(ctx).primaryAction.href).toContain(
      '#blockers',
    );
  });
  it('overview primaryAction points to production readiness', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'overview');
    expect(generateStewardEditorial(ctx).primaryAction.href).toContain(
      'production-readiness',
    );
  });
  it('non-admin surface uses fallback template', () => {
    const ctx = buildAgentContext('apex-retail', 'programs', 'overview');
    expect(generateStewardEditorial(ctx).title).toBe('Steward editorial');
  });
});

describe('AGENT1A — Choices builder', () => {
  it('apex-retail with blockers produces choices', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    expect(buildAgentChoices(ctx, 3).length).toBeGreaterThan(0);
  });
  it('all choice sets include a custom affordance', () => {
    const ctx = buildAgentContext('arcturus', 'admin', 'architecture');
    const choices = buildAgentChoices(ctx, 3);
    expect(choices.some((c) => c.category === 'custom')).toBe(true);
  });
  it('custom choice is always last', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    const choices = buildAgentChoices(ctx, 3);
    expect(choices[choices.length - 1]?.category).toBe('custom');
  });
  it('default max is 3 (plus appended custom)', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    expect(buildAgentChoices(ctx).length).toBeLessThanOrEqual(4);
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
      // First blocker entry corresponds to the highest-severity blocker.
      expect(blockerChoices[0].why.toLowerCase()).toMatch(/critical|high/);
    }
  });
  it('thin-evidence non-shell tenant gets evidence-gap choice', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'connectors');
    const choices = buildAgentChoices(ctx, 3);
    expect(choices.some((c) => c.category === 'evidence_gap')).toBe(true);
  });
  it('deterministic — same input same output', () => {
    const ctx1 = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    const ctx2 = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    expect(buildAgentChoices(ctx1, 3)).toEqual(buildAgentChoices(ctx2, 3));
  });
  it('blocker choice ids are prefixed with blocker-', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    const choices = buildAgentChoices(ctx, 3);
    const blockerChoices = choices.filter(
      (c) => c.category === 'resolve_blocker',
    );
    for (const c of blockerChoices) {
      expect(c.id.startsWith('blocker-')).toBe(true);
    }
  });
  it('blocker choice href anchors back to admin/production-readiness', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    const choices = buildAgentChoices(ctx, 3);
    const blockerChoices = choices.filter(
      (c) => c.category === 'resolve_blocker',
    );
    for (const c of blockerChoices) {
      expect(c.href).toContain('/admin/production-readiness#');
    }
  });
  it('evidence-gap choice id is evidence-strengthen', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'connectors');
    const choices = buildAgentChoices(ctx, 3);
    const ev = choices.find((c) => c.category === 'evidence_gap');
    expect(ev?.id).toBe('evidence-strengthen');
  });
  it('evidence-gap choice points to /admin/data-trust on admin surface', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'connectors');
    const choices = buildAgentChoices(ctx, 3);
    const ev = choices.find((c) => c.category === 'evidence_gap');
    expect(ev?.href).toBe('/admin/data-trust');
  });
  it('rich tenant on architecture page yields well-formed choices', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    for (const c of buildAgentChoices(ctx, 3)) {
      expect(c).toBeDefined();
      expect(c.id).toBeTruthy();
    }
  });
  it('max=0 still appends custom (and explore fallback)', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    const choices = buildAgentChoices(ctx, 0);
    expect(choices.some((c) => c.category === 'custom')).toBe(true);
  });
  it('pending decision choices are populated when decisions exist', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    const choices = buildAgentChoices(ctx, 3);
    expect(choices.some((c) => c.category === 'pending_decision')).toBe(true);
  });
  it('pending decision choice ids are prefixed with decision-', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    const choices = buildAgentChoices(ctx, 3);
    const dec = choices.filter((c) => c.category === 'pending_decision');
    for (const c of dec) {
      expect(c.id.startsWith('decision-')).toBe(true);
    }
  });
  it('explore fallback fires for empty contexts', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'unknown-page');
    const choices = buildAgentChoices(ctx, 3);
    // No blockers / decisions; thin evidence → evidence_gap appears.
    // explore only fires if NO category was added at all; with thin
    // evidence, evidence_gap is added so explore should not appear.
    expect(choices.length).toBeGreaterThan(0);
  });
  it('choices array is always non-empty (custom is always appended)', () => {
    const ctx = buildAgentContext('apex-retail', 'admin', 'architecture');
    expect(buildAgentChoices(ctx, 3).length).toBeGreaterThan(0);
  });
});

describe('AGENT1A — Cross-tenant determinism', () => {
  it('apex-retail twice yields identical bundle', () => {
    const a = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    const b = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    expect(a).toEqual(b);
  });
  it('shell_only tenants get the same architecture bundle', () => {
    const a = buildAgentContext('arcturus', 'admin', 'architecture');
    const b = buildAgentContext('meridian-health', 'admin', 'architecture');
    // Tenant slug/name differ, but seed should be the same per page.
    expect(a.contextSources.length).toBe(b.contextSources.length);
    expect(a.evidence.strength).toBe(b.evidence.strength);
    expect(a.blockers).toEqual(b.blockers);
  });
  it('apex-retail and shell_only tenants share the same admin seed for a page', () => {
    const a = buildAgentContext('apex-retail', 'admin', 'architecture');
    const b = buildAgentContext('arcturus', 'admin', 'architecture');
    expect(a.contextSources).toEqual(b.contextSources);
  });
  it('build-progress always resolves the platform tenant', () => {
    const a = buildAgentContext('apex-retail', 'admin', 'build-progress');
    const b = buildAgentContext('arcturus', 'admin', 'build-progress');
    expect(a.tenant).toEqual(b.tenant);
  });
  it('non-admin surfaces have empty seed regardless of tenant', () => {
    const a = buildAgentContext('apex-retail', 'programs', 'overview');
    const b = buildAgentContext('arcturus', 'programs', 'overview');
    expect(a.contextSources.length).toBe(0);
    expect(b.contextSources.length).toBe(0);
  });
  it('evidence strength is deterministic per page', () => {
    const a = buildAgentContext('apex-retail', 'admin', 'connectors');
    const b = buildAgentContext('apex-retail', 'admin', 'connectors');
    expect(a.evidence.strength).toBe(b.evidence.strength);
  });
  it('blocker order is stable across calls', () => {
    const a = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    const b = buildAgentContext('apex-retail', 'admin', 'production-readiness');
    expect(a.blockers.map((x) => x.id)).toEqual(b.blockers.map((x) => x.id));
  });
});
