import { buildArchitecturePageView } from '@/lib/admin/architecture-page-view';
import { buildProductionReadinessPageView } from '@/lib/admin/production-readiness-page-view';
import { buildOverviewPageView } from '@/lib/admin/overview-page-view';
import { buildDataTrustPageView } from '@/lib/admin/data-trust-page-view';
import { buildConnectorsPageView } from '@/lib/admin/connectors-page-view';
import { buildUsersAccessPageView } from '@/lib/admin/users-access-page-view';
import { buildAgentReadinessPageView } from '@/lib/admin/agent-readiness-page-view';
import { buildBuildProgressPageView } from '@/lib/admin/build-progress-page-view';

// ADMIN-DATA3+: builders are progressively migrated to async. Wrap each
// builder so the describe.each table is homogenous regardless of sync/async.
type AnyBuilder = () => unknown | Promise<unknown>;
const toAsync =
  (fn: AnyBuilder) => async (): Promise<ReturnType<typeof buildArchitecturePageView>> =>
    Promise.resolve(fn()) as Promise<ReturnType<typeof buildArchitecturePageView>>;

describe('AGENT1B — Admin pages wired to agent foundation', () => {
  describe.each([
    ['Architecture', toAsync(buildArchitecturePageView)],
    ['Production Readiness', toAsync(buildProductionReadinessPageView)],
    ['Overview', toAsync(buildOverviewPageView)],
    ['Data Trust', toAsync(buildDataTrustPageView)],
    ['Connectors', toAsync(buildConnectorsPageView)],
    ['Users & Access', toAsync(buildUsersAccessPageView)],
    ['Agent Readiness', toAsync(buildAgentReadinessPageView)],
    ['Build Progress', toAsync(buildBuildProgressPageView)],
  ] as const)('%s page', (label, builder) => {
    type AnyView = ReturnType<typeof buildArchitecturePageView>;
    let view: AnyView;
    beforeAll(async () => {
      view = (await builder()) as AnyView;
    });

    it('exposes agentChoices array', () => {
      expect(Array.isArray(view.agentChoices)).toBe(true);
    });
    it('exposes agentPostures array with 4 entries', () => {
      expect(view.agentPostures?.length).toBe(4);
    });
    it('agent postures cover steward/nexus/sentinel/atlas', () => {
      const agents = view.agentPostures?.map((p) => p.agent) ?? [];
      expect(agents).toContain('steward');
      expect(agents).toContain('nexus');
      expect(agents).toContain('sentinel');
      expect(agents).toContain('atlas');
    });
    it('every posture has a state', () => {
      view.agentPostures?.forEach((p) => {
        expect(['BLOCKED', 'PARTIAL', 'THIN', 'READY']).toContain(p.state);
      });
    });
    it('still has all original required fields', () => {
      expect(view.eyebrow).toBeDefined();
      expect(view.title).toBeDefined();
      expect(view.subtitle).toBeDefined();
      expect(view.context).toBeDefined();
      expect(view.editorial).toBeDefined();
      expect(view.editorial.title).toBeDefined();
      expect(view.editorial.body).toBeDefined();
      expect(view.deterministicSeed).toBe(true);
    });
    it('editorial body is non-empty', () => {
      expect(view.editorial.body.length).toBeGreaterThan(20);
    });
    it('editorial does not claim production_ready: true', () => {
      const json = JSON.stringify(view).toLowerCase();
      expect(json).not.toContain('production_ready');
    });
    it('label is non-empty', () => {
      expect(label.length).toBeGreaterThan(0);
    });
  });

  describe('Production Readiness page specifically', () => {
    it('Steward posture is BLOCKED (apex-retail has critical blockers)', () => {
      const view = buildProductionReadinessPageView();
      const steward = view.agentPostures?.find((p) => p.agent === 'steward');
      expect(steward?.state).toBe('BLOCKED');
    });
    it('agentChoices includes blocker resolutions', () => {
      const view = buildProductionReadinessPageView();
      expect(view.agentChoices?.length).toBeGreaterThan(0);
      expect(view.agentChoices?.some((c) => c.category === 'resolve_blocker')).toBe(true);
    });
  });

  describe('Architecture page specifically', () => {
    it('editorial label is Atlas + Steward', () => {
      const view = buildArchitecturePageView();
      expect(view.editorial.title).toContain('Atlas');
    });
  });
});
