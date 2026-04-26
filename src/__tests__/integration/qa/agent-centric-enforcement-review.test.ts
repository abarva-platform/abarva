import {
  AGENT_CENTRIC_ENFORCEMENT_RULES,
  getEnforcementRulesForSurface,
  getEnforcementRulesForAgent,
  buildAgentCentricEnforcementReport,
  type WorkflowSurface,
  type AgentRole,
} from '@/lib/qa/agent-centric-enforcement-review';

describe('AGENTX — Agent-Centric Enforcement Review', () => {
  describe('Enforcement rules catalog', () => {
    it('has at least 9 enforcement rules', () => {
      expect(AGENT_CENTRIC_ENFORCEMENT_RULES.length).toBeGreaterThanOrEqual(9);
    });

    it('every rule has a ruleId, title, description, and failCondition', () => {
      for (const rule of AGENT_CENTRIC_ENFORCEMENT_RULES) {
        expect(rule.ruleId).toBeTruthy();
        expect(rule.title).toBeTruthy();
        expect(rule.description).toBeTruthy();
        expect(rule.failCondition).toBeTruthy();
      }
    });

    it('every rule applies to at least one surface', () => {
      for (const rule of AGENT_CENTRIC_ENFORCEMENT_RULES) {
        expect(rule.appliesToSurfaces.length).toBeGreaterThan(0);
      }
    });

    it('every rule applies to at least one agent', () => {
      for (const rule of AGENT_CENTRIC_ENFORCEMENT_RULES) {
        expect(rule.appliesToAgents.length).toBeGreaterThan(0);
      }
    });

    it('every rule has deterministicSeed: true', () => {
      for (const rule of AGENT_CENTRIC_ENFORCEMENT_RULES) {
        expect(rule.deterministicSeed).toBe(true);
      }
    });

    it('AGENTX-R1 applies to all 7 surfaces', () => {
      const r1 = AGENT_CENTRIC_ENFORCEMENT_RULES.find(r => r.ruleId === 'AGENTX-R1');
      expect(r1).toBeDefined();
      expect(r1!.appliesToSurfaces.length).toBeGreaterThanOrEqual(7);
    });

    it('no two rules have the same ruleId', () => {
      const ids = AGENT_CENTRIC_ENFORCEMENT_RULES.map(r => r.ruleId);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });
  });

  describe('getEnforcementRulesForSurface', () => {
    it('returns rules for programs surface', () => {
      const rules = getEnforcementRulesForSurface('programs');
      expect(rules.length).toBeGreaterThan(0);
    });

    it('returns rules for source surface', () => {
      const rules = getEnforcementRulesForSurface('source');
      expect(rules.length).toBeGreaterThan(0);
    });

    it('every returned rule applies to the requested surface', () => {
      const surfaces: WorkflowSurface[] = ['programs', 'source', 'intelligence', 'control_tower'];
      for (const surface of surfaces) {
        const rules = getEnforcementRulesForSurface(surface);
        for (const rule of rules) {
          expect(rule.appliesToSurfaces).toContain(surface);
        }
      }
    });
  });

  describe('getEnforcementRulesForAgent', () => {
    it('returns rules for nexus', () => {
      expect(getEnforcementRulesForAgent('nexus').length).toBeGreaterThan(0);
    });

    it('returns rules for sentinel', () => {
      expect(getEnforcementRulesForAgent('sentinel').length).toBeGreaterThan(0);
    });

    it('returns rules for steward', () => {
      expect(getEnforcementRulesForAgent('steward').length).toBeGreaterThan(0);
    });

    it('returns rules for atlas', () => {
      expect(getEnforcementRulesForAgent('atlas').length).toBeGreaterThan(0);
    });

    it('every returned rule applies to the requested agent', () => {
      const agents: AgentRole[] = ['nexus', 'sentinel', 'steward', 'atlas'];
      for (const agent of agents) {
        const rules = getEnforcementRulesForAgent(agent);
        for (const rule of rules) {
          expect(rule.appliesToAgents).toContain(agent);
        }
      }
    });
  });

  describe('buildAgentCentricEnforcementReport', () => {
    let report: ReturnType<typeof buildAgentCentricEnforcementReport>;

    beforeEach(() => {
      report = buildAgentCentricEnforcementReport();
    });

    it('returns a report without throwing', () => {
      expect(report).toBeDefined();
    });

    it('totalRules matches AGENT_CENTRIC_ENFORCEMENT_RULES length', () => {
      expect(report.totalRules).toBe(AGENT_CENTRIC_ENFORCEMENT_RULES.length);
    });

    it('surfacesCovered has all 7 surfaces', () => {
      expect(report.surfacesCovered.length).toBe(7);
    });

    it('checks array is non-empty', () => {
      expect(report.checks.length).toBeGreaterThan(0);
    });

    it('check counts sum to total checks', () => {
      const total = report.passCount + report.failCount + report.deferredCount + report.notApplicableCount;
      expect(total).toBe(report.checks.length);
    });

    it('overallStatus is pass, fail, or partial', () => {
      expect(['pass', 'fail', 'partial']).toContain(report.overallStatus);
    });

    it('no check has failCount > 0 (no enforcement failures in current seed state)', () => {
      expect(report.failCount).toBe(0);
    });

    it('caveat is non-empty', () => {
      expect(report.caveat.length).toBeGreaterThan(0);
    });

    it('every check has deterministicSeed: true', () => {
      for (const check of report.checks) {
        expect(check.deterministicSeed).toBe(true);
      }
    });

    it('every check has a non-empty description and detail', () => {
      for (const check of report.checks) {
        expect(check.description.length).toBeGreaterThan(0);
        expect(check.detail.length).toBeGreaterThan(0);
      }
    });

    it('report has deterministicSeed: true', () => {
      expect(report.deterministicSeed).toBe(true);
    });

    it('source surface has at least one passing check', () => {
      const sourceChecks = report.checks.filter(c => c.surface === 'source' && c.status === 'pass');
      expect(sourceChecks.length).toBeGreaterThan(0);
    });

    it('programs surface has at least one passing check', () => {
      const programChecks = report.checks.filter(c => c.surface === 'programs' && c.status === 'pass');
      expect(programChecks.length).toBeGreaterThan(0);
    });
  });
});
