// ADM2 · Steward Setup / Admin control-center read-model tests.
//
// Pure deterministic coverage. No React rendering, no DOM, no model
// calls. Read model is asserted directly; component + route page are
// covered via static-source hygiene + the build pipeline.
//
// Tests assert that:
// - The read model builds deterministically.
// - All 12 canonical Enterprise Dataset Domains are present.
// - Loaded / available / usable evidence counts are exposed.
// - All 4 agents appear in the readiness matrix.
// - Steward Brief carries a recommendedNextAction.
// - Admin modules include Build Progress / Founder Control Tower.
// - No model / API call is required (no Date.now / Math.random / new
//   Date / anthropic / openai / pinecone in the read model).
// - No invented live connector status; no claim of production
//   upload / parsing.
// - Module hygiene: no imports from Source UI, Nexus / Sentinel /
//   Atlas / Agent runtime, legacy /programs, mock.ts, auth, or
//   migrations on either the read-model module or the component.

import {
  buildStewardSetupReadinessView,
  EVIDENCE_STATES_IN_PROGRESSION_ORDER,
  ADMIN_AGENT_NAMES,
  type AgentName,
  type DatasetDomainStatus,
  type EvidenceReadinessState,
} from '@/lib/admin/steward-setup-readiness';

const ALL_DOMAIN_STATUSES: DatasetDomainStatus[] = [
  'not_started',
  'partial',
  'ready',
  'blocked',
];

// ---------------------------------------------------------------------
// Read model determinism
// ---------------------------------------------------------------------

describe('buildStewardSetupReadinessView · determinism + shape', () => {
  it('returns a deterministic view across repeated calls', () => {
    const a = buildStewardSetupReadinessView();
    const b = buildStewardSetupReadinessView();
    expect(a).toEqual(b);
  });

  it('view exposes generatedFrom = deterministic_seed', () => {
    const view = buildStewardSetupReadinessView();
    expect(view.generatedFrom).toBe('deterministic_seed');
  });

  it('setupHealth is one of the canonical enum values', () => {
    const view = buildStewardSetupReadinessView();
    expect(['ready', 'partial', 'blocked']).toContain(view.setupHealth);
    expect(view.setupHealthRationale.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------
// 12 canonical dataset domains
// ---------------------------------------------------------------------

describe('canonical Enterprise Dataset Domains', () => {
  it('exposes exactly 12 canonical domains', () => {
    const view = buildStewardSetupReadinessView();
    expect(view.domains.length).toBe(12);
  });

  it('every domain carries every required ADM1 field', () => {
    const view = buildStewardSetupReadinessView();
    for (const d of view.domains) {
      expect(typeof d.key).toBe('string');
      expect(typeof d.name).toBe('string');
      expect(typeof d.ordinal).toBe('number');
      expect(ALL_DOMAIN_STATUSES).toContain(d.status);
      expect(typeof d.loadedCount).toBe('number');
      expect(typeof d.availableCount).toBe('number');
      expect(typeof d.usableEvidenceCount).toBe('number');
      expect(d.exampleDatasets.length).toBeGreaterThan(0);
      expect(d.missingInputs.length).toBeGreaterThanOrEqual(0);
      expect(d.agentsUsingIt.length).toBeGreaterThan(0);
      expect(d.surfacesUsingIt.length).toBeGreaterThan(0);
      expect(d.stewardGuidance.length).toBeGreaterThan(0);
    }
  });

  it('domains are ordered by ordinal 1..12', () => {
    const view = buildStewardSetupReadinessView();
    expect(view.domains.map((d) => d.ordinal)).toEqual(
      Array.from({ length: 12 }, (_, i) => i + 1),
    );
  });

  it('canonical domain keys cover the ADM1 contract list', () => {
    const view = buildStewardSetupReadinessView();
    const expected = new Set([
      'enterprise_strategy_c_suite',
      'business_kpi_functional_performance',
      'enterprise_architecture_tech_stack',
      'application_portfolio',
      'infrastructure_cloud_data_center',
      'vendor_contract_spend',
      'ai_portfolio_use_case_inventory',
      'ai_tool_adoption_usage_cost',
      'it_operating_model_dora',
      'risk_compliance_governance',
      'evidence_reports_artifacts',
      'org_structure_users_ownership',
    ]);
    expect(new Set(view.domains.map((d) => d.key))).toEqual(expected);
  });

  it('counts are non-negative and respect loaded ≥ available ≥ usable per domain', () => {
    const view = buildStewardSetupReadinessView();
    for (const d of view.domains) {
      expect(d.loadedCount).toBeGreaterThanOrEqual(0);
      expect(d.availableCount).toBeGreaterThanOrEqual(0);
      expect(d.usableEvidenceCount).toBeGreaterThanOrEqual(0);
      expect(d.loadedCount).toBeGreaterThanOrEqual(d.availableCount);
      expect(d.availableCount).toBeGreaterThanOrEqual(d.usableEvidenceCount);
    }
  });
});

// ---------------------------------------------------------------------
// Loaded / available / usable evidence counts
// ---------------------------------------------------------------------

describe('evidence aggregate', () => {
  it('exposes byState entries for every canonical evidence state', () => {
    const view = buildStewardSetupReadinessView();
    const states: EvidenceReadinessState[] = [...EVIDENCE_STATES_IN_PROGRESSION_ORDER];
    for (const s of states) {
      expect(view.evidenceAggregate.byState[s]).toBeGreaterThanOrEqual(0);
    }
  });

  it('totals match the loaded / available / usable convention', () => {
    const view = buildStewardSetupReadinessView();
    const agg = view.evidenceAggregate;
    expect(agg.totalLoaded).toBe(agg.byState.loaded);
    expect(agg.totalAvailable).toBe(agg.byState.indexed);
    expect(agg.totalUsable).toBe(agg.byState.usable_as_evidence);
    expect(agg.totalLoaded).toBeGreaterThanOrEqual(agg.totalAvailable);
    expect(agg.totalAvailable).toBeGreaterThanOrEqual(agg.totalUsable);
  });

  it('progression states are monotonically non-increasing', () => {
    const view = buildStewardSetupReadinessView();
    const order: EvidenceReadinessState[] = [
      'loaded',
      'parsed',
      'indexed',
      'classified',
      'scoped',
      'cited',
      'quality_checked',
      'usable_as_evidence',
    ];
    const counts = order.map((s) => view.evidenceAggregate.byState[s]);
    for (let i = 1; i < counts.length; i += 1) {
      expect(counts[i - 1]).toBeGreaterThanOrEqual(counts[i]);
    }
  });
});

// ---------------------------------------------------------------------
// Agent readiness matrix
// ---------------------------------------------------------------------

describe('agent readiness matrix', () => {
  it('contains all four canonical agents', () => {
    const view = buildStewardSetupReadinessView();
    const got = view.agents.map((a) => a.agent).sort();
    const expected = ([...ADMIN_AGENT_NAMES] as AgentName[]).sort();
    expect(got).toEqual(expected);
  });

  it('every agent row exposes the canonical five-field readout', () => {
    const view = buildStewardSetupReadinessView();
    for (const a of view.agents) {
      expect(['ready', 'partial', 'blocked']).toContain(a.status);
      expect(a.canUse.length).toBeGreaterThan(0);
      expect(a.missingContext.length).toBeGreaterThanOrEqual(0);
      expect(a.safeToAnswer.length).toBeGreaterThan(0);
      expect(a.mustDefer.length).toBeGreaterThan(0);
      expect(typeof a.nextAdminAction).toBe('string');
      expect(a.nextAdminAction.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------
// Steward Brief
// ---------------------------------------------------------------------

describe('Steward brief', () => {
  it('includes a recommendedNextAction with a route', () => {
    const view = buildStewardSetupReadinessView();
    const a = view.brief.recommendedNextAction;
    expect(typeof a.label).toBe('string');
    expect(a.label.length).toBeGreaterThan(0);
    expect(typeof a.routeHref).toBe('string');
    expect(a.routeHref.startsWith('/')).toBe(true);
  });

  it('exposes all required brief fields and three follow-ups, all disabled', () => {
    const view = buildStewardSetupReadinessView();
    const b = view.brief;
    expect(b.title.length).toBeGreaterThan(0);
    expect(['ready', 'partial', 'blocked']).toContain(b.tenantSetupHealth.label);
    expect(b.tenantSetupHealth.rationale.length).toBeGreaterThan(0);
    expect(b.topAdminGaps.length).toBeGreaterThan(0);
    expect(typeof b.dataEvidenceReadiness).toBe('string');
    expect(typeof b.userSecurityRisk).toBe('string');
    expect(typeof b.connectorRisk).toBe('string');
    expect(b.agentReadiness.length).toBe(4);
    expect(b.suggestedFollowUps).toHaveLength(3);
    expect(b.suggestedFollowUps.map((f) => f.id)).toEqual([
      'steward-followup-walk-setup-health',
      'steward-followup-domains-needing-owners',
      'steward-followup-unblock-atlas',
    ]);
    for (const f of b.suggestedFollowUps) {
      expect(f.enabled).toBe(false);
    }
    expect(['deterministic_seed', 'setup_state_read_model']).toContain(b.sourceLabel);
  });

  it('does not invent a dollar amount in any brief field', () => {
    const view = buildStewardSetupReadinessView();
    const b = view.brief;
    const dollarPattern = /\$\s?\d[\d,]*(\.\d+)?/;
    const fields = [
      b.title,
      b.tenantSetupHealth.rationale,
      b.dataEvidenceReadiness,
      b.userSecurityRisk,
      b.connectorRisk,
      b.recommendedNextAction.label,
      b.recommendedNextAction.reason,
      b.interpretationBasis,
      ...b.topAdminGaps.map((g) => g.label),
      ...b.agentReadiness.map((a) => a.sentence),
      ...b.suggestedFollowUps.map((f) => f.label),
      ...b.suggestedFollowUps.map((f) => f.reason),
    ];
    for (const f of fields) {
      expect(f).not.toMatch(dollarPattern);
    }
  });

  it('does not claim a live runtime — connector + Steward marked deferred / not_started', () => {
    const view = buildStewardSetupReadinessView();
    expect(view.brief.connectorRisk.toLowerCase()).toMatch(/deferred|not_started|0 of 0/);
    expect(view.brief.interpretationBasis.toLowerCase()).toContain('deterministic');
    expect(view.brief.interpretationBasis.toLowerCase()).not.toContain('live retrieval');
  });
});

// ---------------------------------------------------------------------
// Admin modules
// ---------------------------------------------------------------------

describe('admin modules', () => {
  it('includes Build Progress / Founder Control Tower', () => {
    const view = buildStewardSetupReadinessView();
    const buildProgress = view.modules.find((m) => m.key === 'build_progress');
    expect(buildProgress).toBeDefined();
    expect(buildProgress!.routeHref).toBe('/platform/admin/build-progress');
    expect(buildProgress!.status).toBe('live');
  });

  it('exposes the 10 canonical modules from ADM1 §G', () => {
    const view = buildStewardSetupReadinessView();
    const expected = new Set([
      'setup_home',
      'data_explorer',
      'users_access',
      'security_governance',
      'connectors',
      'audit_activity',
      'evidence_readiness',
      'agent_readiness_matrix',
      'pattern_content_governance',
      'build_progress',
    ]);
    expect(new Set(view.modules.map((m) => m.key))).toEqual(expected);
  });

  it('every module has a routeHref starting with /', () => {
    const view = buildStewardSetupReadinessView();
    for (const m of view.modules) {
      expect(m.routeHref.startsWith('/')).toBe(true);
    }
  });

  it('routes users and audit modules to canonical Setup W5 pages', () => {
    const view = buildStewardSetupReadinessView();
    const users = view.modules.find((m) => m.key === 'users_access');
    const audit = view.modules.find((m) => m.key === 'audit_activity');
    expect(users?.routeHref).toBe('/admin/users');
    expect(audit?.routeHref).toBe('/admin/audit');
  });
});

// ---------------------------------------------------------------------
// Recommended actions
// ---------------------------------------------------------------------

describe('recommended actions', () => {
  it('exposes at least three ranked actions, each with a route', () => {
    const view = buildStewardSetupReadinessView();
    expect(view.recommendedActions.length).toBeGreaterThanOrEqual(3);
    for (const a of view.recommendedActions) {
      expect(a.routeHref.startsWith('/')).toBe(true);
      expect(a.label.length).toBeGreaterThan(0);
      expect(a.reason.length).toBeGreaterThan(0);
    }
  });

  it('the brief recommendedNextAction matches the first ranked action', () => {
    const view = buildStewardSetupReadinessView();
    expect(view.brief.recommendedNextAction).toEqual(view.recommendedActions[0]);
  });

  it('routes users and audit recommended actions to canonical Setup W5 pages', () => {
    const view = buildStewardSetupReadinessView();
    const hrefs = view.recommendedActions.map((a) => a.routeHref);
    expect(hrefs).toContain('/admin/users');
    expect(hrefs).toContain('/admin/audit');
    expect(hrefs).not.toContain('/platform/admin/users');
    expect(hrefs).not.toContain('/platform/admin/audit');
  });
});

// ---------------------------------------------------------------------
// Module hygiene · read-model module
// ---------------------------------------------------------------------

describe('module hygiene · steward-setup-readiness.ts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../lib/admin/steward-setup-readiness.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = stripComments(source);

  it('does not import Source UI or Source files', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
  });

  it('does not import Nexus / Sentinel / Atlas / Agent runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/components\/agent\//);
  });

  it('does not import legacy /programs routes or mock.ts', () => {
    expect(codeOnly).not.toMatch(/from '@\/app\/programs\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
  });

  it('does not import auth implementation or migrations', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
  });

  it('does not call Date.now or Math.random or new Date', () => {
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

// ---------------------------------------------------------------------
// Module hygiene · component
// ---------------------------------------------------------------------

describe('module hygiene · StewardSetupControlCenter.tsx', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../components/admin/StewardSetupControlCenter.tsx',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');
  const codeOnly = stripComments(source);

  it('imports buildStewardSetupReadinessView from the ADM2 module', () => {
    expect(codeOnly).toMatch(/buildStewardSetupReadinessView/);
    expect(codeOnly).toMatch(/from '@\/lib\/admin\/steward-setup-readiness'/);
  });

  it('does not import Source UI, Nexus, Sentinel, Atlas, or live Agent runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).toMatch(/from '@\/lib\/agent\/agent-mission-queue'/);
    expect(codeOnly).toMatch(/from '@\/components\/agent\/AgentMissionPanel'/);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\/runtime/);
    expect(codeOnly).not.toMatch(/from '@\/components\/agent\/AskAnythingBar'/);
  });

  it('does not import legacy /programs routes, mock.ts, or auth', () => {
    expect(codeOnly).not.toMatch(/from '@\/app\/programs\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
  });
});

// ---------------------------------------------------------------------
// Helper: strip comments before hygiene checks
// ---------------------------------------------------------------------

function stripComments(src: string): string {
  // Line comments first; they may contain `**` glob markers whose `/*`
  // substrings would otherwise confuse the block-comment regex.
  const lineStripped = src
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  return lineStripped.replace(/\/\*[\s\S]*?\*\//g, '');
}
