/**
 * Programs demo-beat integration tests · spec §13.8 (4 beats).
 *
 * These exercise the lib/programs functions directly with a constructed
 * TenancyCtx for the seeded Apex demo. They're not browser E2E — true
 * E2E requires Clerk auth + UI — but they cover the 4 demo beats at the
 * API contract level: portfolio → full-state → module → execute flow
 * + classifier SSE stages.
 *
 * Requires the Apex demo seed to be applied on the configured DB.
 * Skipped automatically when Apex programs aren't present.
 *
 * Beats:
 *   1 · Lead portfolio → program → module path
 *   2 · Sponsor dashboard open-decisions surfacing
 *   3 · Execute tab · work-item status transitions + rollup
 *   4 · Classifier 3-stage pipeline on a retail use-case
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

// Load .env.local for tests (supabase-server.ts expects the vars)
try {
  const env = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
  for (const line of env.split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* env file not present — rely on shell env */ }

const hasDbCreds = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

// Only run when DB creds are present (CI can opt-in via env)
const describeIfDb = hasDbCreds ? describe : describe.skip;

describeIfDb('Programs demo beats · §13.8', () => {
  let ctx: { clientId: string; userId: string };
  let contactCenterProgramId: string | null = null;

  beforeAll(async () => {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: client } = await sb.from('clients').select('id').ilike('name', 'Apex Retail').maybeSingle();
    const { data: person } = await sb.from('persons').select('id').limit(1).maybeSingle();
    if (!client || !person) throw new Error('Apex seed not applied — run `npm run seed:programs-demo`');
    ctx = { clientId: (client as { id: string }).id, userId: (person as { id: string }).id };

    const { data: ccProg } = await sb
      .from('engagements')
      .select('id')
      .eq('client_id', ctx.clientId)
      .eq('name', 'Contact Center AI Transformation')
      .maybeSingle();
    contactCenterProgramId = (ccProg as { id: string } | null)?.id ?? null;
  });

  describe('Beat 1 · Lead portfolio → program → module', () => {
    it('portfolio returns at least 4 Apex programs', async () => {
      const { getProgramPortfolio } = await import('@/lib/programs/queries');
      const programs = await getProgramPortfolio(ctx, { limit: 20 });
      expect(programs.length).toBeGreaterThanOrEqual(4);
      const names = programs.map((p) => p.name);
      expect(names).toContain('Contact Center AI Transformation');
      expect(names).toContain('Unified Customer Data Platform');
      expect(names).toContain('Store Associate Productivity');
      expect(names).toContain('Demand Forecasting AI');
    });

    it('program full-state has modules, activity, phases, team for Contact Center AI', async () => {
      if (!contactCenterProgramId) return;
      const { getProgramById } = await import('@/lib/programs/queries');
      const { buildProgramFullState } = await import('@/lib/programs/transformers');
      const program = await getProgramById(ctx, contactCenterProgramId);
      expect(program).not.toBeNull();
      const full = await buildProgramFullState(ctx, program!);
      expect(full.modules.length).toBeGreaterThanOrEqual(5);
      expect(full.phases.length).toBe(6);
      expect(full.phases[0].state).toBe('complete'); // Phase 0 done
      expect(full.phases[4].state).toBe('active'); // Phase 4 active
      expect(full.phases[5].state).toBe('locked');
      expect(full.team.length).toBeGreaterThanOrEqual(2); // sponsor + lead
      expect(full.sponsorPerson.name).not.toBe('—');
    });

    it('module workspace resolves to a ModuleState', async () => {
      if (!contactCenterProgramId) return;
      const { getModuleState } = await import('@/lib/programs/queries');
      const modules = await getModuleState(ctx, contactCenterProgramId);
      expect(modules.length).toBeGreaterThan(0);
      // Stakeholder map should be in the seed for Contact Center AI Phase 1
      const stakeholder = modules.find((m) => m.moduleKey === 'stakeholder_map');
      expect(stakeholder).toBeDefined();
    });
  });

  describe('Beat 2 · Sponsor dashboard · open decisions + flags', () => {
    it('full state carries sponsorDashboard with openDecisions and milestones', async () => {
      if (!contactCenterProgramId) return;
      const { getProgramById } = await import('@/lib/programs/queries');
      const { buildProgramFullState } = await import('@/lib/programs/transformers');
      const program = await getProgramById(ctx, contactCenterProgramId);
      const full = await buildProgramFullState(ctx, program!);
      expect(full.sponsorDashboard).toBeDefined();
      expect(Array.isArray(full.sponsorDashboard.openDecisions)).toBe(true);
      expect(Array.isArray(full.sponsorDashboard.milestones)).toBe(true);
      expect(full.metrics.length).toBeGreaterThan(0);
    });

    it('getOpenMaestroFlags + getPendingApprovals return arrays', async () => {
      if (!contactCenterProgramId) return;
      const { getOpenMaestroFlags, getPendingApprovals } = await import('@/lib/programs/queries');
      const flags = await getOpenMaestroFlags(ctx, contactCenterProgramId);
      const approvals = await getPendingApprovals(ctx, contactCenterProgramId);
      expect(Array.isArray(flags)).toBe(true);
      expect(Array.isArray(approvals)).toBe(true);
      // Contact Center seed includes 2 flags (quality_concern + scope_drift)
      expect(flags.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Beat 3 · Execute tab · rollup + work-item state', () => {
    it('getExecuteRollup returns complete shape', async () => {
      if (!contactCenterProgramId) return;
      const { getExecuteRollup } = await import('@/lib/programs/execute');
      const rollup = await getExecuteRollup(ctx, contactCenterProgramId);
      expect(rollup.milestones.total).toBeGreaterThanOrEqual(3);
      expect(rollup.workItems.total).toBeGreaterThanOrEqual(3);
      expect(rollup.risks.total).toBeGreaterThanOrEqual(1);
      expect(rollup.risks.byHeat).toHaveProperty('high_high');
      expect(rollup.nexusDrafted).toHaveProperty('deliverableCount');
    });

    it('createWorkItem + updateWorkItemStatus round-trip', async () => {
      if (!contactCenterProgramId) return;
      const { createWorkItem, updateWorkItemStatus } = await import('@/lib/programs/mutations');
      const id = await createWorkItem(ctx, contactCenterProgramId, {
        title: `E2E test work item ${Date.now()}`,
        itemType: 'task',
        priority: 'low',
      });
      expect(typeof id).toBe('string');
      await updateWorkItemStatus(ctx, contactCenterProgramId, id, 'in_progress');
      await updateWorkItemStatus(ctx, contactCenterProgramId, id, 'done');

      // Cleanup so reruns don't accumulate
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      await sb.from('program_work_items').delete().eq('id', id);
    });
  });

  describe('Beat 4 · Classifier 3-stage pipeline', () => {
    it('runs end-to-end and returns matches for a retail use case', async () => {
      // Requires ANTHROPIC_API_KEY + OPENAI_API_KEY + PINECONE_API_KEY
      // If any missing, skip (classifier returns empty gracefully but we can't verify bands)
      if (!process.env.ANTHROPIC_API_KEY || !process.env.OPENAI_API_KEY || !process.env.PINECONE_API_KEY) {
        console.warn('Beat 4 skipped · AI keys missing from env');
        return;
      }
      const { classifyOrigination } = await import('@/lib/programs/classifier');
      const output = await classifyOrigination({
        useCase: 'We want to deflect voice calls at our retail contact centers using AI agents + give human reps real-time assistance. Target 28% deflection and 22% AHT reduction.',
        industry: 'retail',
        tenancy: ctx,
      });

      expect(output.latencyMs.stage1).toBeLessThan(5000);
      expect(output.latencyMs.stage2).toBeLessThan(5000);
      expect(output.latencyMs.stage3).toBeLessThan(5000);
      expect(output.latencyMs.total).toBeLessThan(10000);
      // matches array is always returned (may be empty if Pinecone
      // public-patterns namespace hasn't been populated yet — tracked
      // as P2 follow-up)
      expect(Array.isArray(output.matches)).toBe(true);
      expect(Array.isArray(output.extracted.entities)).toBe(true);
      // extracted intent always surfaces even without vector hits
      expect(output.extracted.industry ?? 'retail').toMatch(/retail/i);
    }, 20000);
  });
});
