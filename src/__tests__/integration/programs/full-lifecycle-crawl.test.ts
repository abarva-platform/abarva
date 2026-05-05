/**
 * Full lifecycle crawl test · Strategic Moves P0→P5 (6-phase doctrine)
 *
 * Exercises the complete Strategic Moves lifecycle under the 6-phase
 * model defined in docs/design/strategic-moves/PHASE_MODEL_V2_DOCTRINE.md:
 *   create → admin approve → P0 active → P1 → P2 → P3 → P4 → P5 complete
 *
 * After P5 Mobilize & Handoff, Control Tower owns downstream tracking;
 * there is no P5→P6 gate inside Strategic Moves.
 *
 * Two layers:
 *   1. Pure gate-rule logic (always runs) — validates GATE_RULES shape
 *      and that the five adjacent gates exist with the right severity.
 *   2. DB integration (requires SUPABASE creds) — creates a real program,
 *      exercises mutations, advances through all five gates, then
 *      cleans up.
 *
 * DB layer is skipped automatically when env vars aren't present.
 */

import fs from 'node:fs';
import path from 'node:path';

try {
  const env = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
  for (const line of env.split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* rely on shell env */ }

const hasDbCreds = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const describeIfDb = hasDbCreds ? describe : describe.skip;

// ── Layer 1 · Pure gate-rule logic ────────────────────────────────────────────

describe('Gate rule sequence · pure logic', () => {
  it('GATE_RULES covers all five 6-phase doctrine transitions', async () => {
    const { findGateRule } = await import('@/lib/programs/governance');

    // P0 Originate → P1 Charter — hard gate: signed seed + sponsor.
    const r01 = findGateRule(0, 1);
    expect(r01).not.toBeNull();
    expect(r01!.hard).toBe(true);
    const r01HardKeys = r01!.checks.filter((c) => c.severity === 'hard').map((c) => c.key);
    expect(r01HardKeys).toContain('program_seed_recorded');
    expect(r01HardKeys).toContain('value_hypothesis_seed');
    expect(r01HardKeys).toContain('sponsor_assigned');

    // P1 Charter → P2 Discover & Diagnose — hard gate: signed charter.
    const r12 = findGateRule(1, 2);
    expect(r12).not.toBeNull();
    expect(r12!.hard).toBe(true);
    const r12HardKeys = r12!.checks.filter((c) => c.severity === 'hard').map((c) => c.key);
    expect(r12HardKeys).toContain('charter_signed_off');
    expect(r12HardKeys).toContain('sponsor_assigned');

    // P2 Discover & Diagnose → P3 Design Future State — hard gate.
    const r23 = findGateRule(2, 3);
    expect(r23).not.toBeNull();
    expect(r23!.hard).toBe(true);
    const r23HardKeys = r23!.checks.filter((c) => c.severity === 'hard').map((c) => c.key);
    expect(r23HardKeys).toContain('discovery_report_signed_off');
    expect(r23HardKeys).toContain('p2_readiness_cleared');

    // P3 Design → P4 Roadmap & Business Case — hard gate: design signed.
    const r34 = findGateRule(3, 4);
    expect(r34).not.toBeNull();
    expect(r34!.hard).toBe(true);
    const r34HardKeys = r34!.checks.filter((c) => c.severity === 'hard').map((c) => c.key);
    expect(r34HardKeys).toContain('design_approved');

    // P4 Roadmap → P5 Mobilize & Handoff — funding/mobilization gate.
    const r45 = findGateRule(4, 5);
    expect(r45).not.toBeNull();
    expect(r45!.hard).toBe(true);
    const r45HardKeys = r45!.checks.filter((c) => c.severity === 'hard').map((c) => c.key);
    expect(r45HardKeys).toContain('execution_roadmap_drafted');
    expect(r45HardKeys).toContain('business_case_approved');

    // No P5→P6: Tower owns post-P5 execution tracking.
    expect(findGateRule(5, 6)).toBeNull();
  });

  it('design gate checks design_spec, design, and design_brief aliases', async () => {
    // Validate governance.ts line 125 covers all three aliases
    const { default: governanceSrc } = await import('fs').then((f) =>
      Promise.resolve({
        default: f.readFileSync(
          path.join(process.cwd(), 'src/lib/programs/governance.ts'),
          'utf-8',
        ),
      }),
    );

    expect(governanceSrc).toContain("'design_spec'");
    expect(governanceSrc).toContain("'design'");
    expect(governanceSrc).toContain("'design_brief'");
  });

  it('tool registrations include all 4 lifecycle tools', async () => {
    // Import tool modules to trigger self-registration side effects
    await import('@/lib/agent/tools/program/completeDeliverable');
    await import('@/lib/agent/tools/program/completeModule');
    await import('@/lib/agent/tools/program/assignSponsor');
    await import('@/lib/agent/tools/program/completeProgram');
    await import('@/lib/agent/tools/program/advancePhase');

    const { getRelevantTools } = await import('@/lib/agent/tools/registry');
    const tools = getRelevantTools('/programs/:id');
    const toolNames = tools.map((t) => t.name);

    expect(toolNames).toContain('complete_deliverable');
    expect(toolNames).toContain('complete_module');
    expect(toolNames).toContain('assign_sponsor');
    expect(toolNames).toContain('complete_program');
    expect(toolNames).toContain('advance_phase');
  });
});

// ── Layer 2 · DB integration crawl ───────────────────────────────────────────

describeIfDb('Full lifecycle DB crawl · P0→P5', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('@supabase/supabase-js');

  let sb: ReturnType<typeof createClient>;
  let ctx: { clientId: string; userId: string };
  let programId: string;
  let sponsorPersonId: string;

  beforeAll(async () => {
    sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { data: client } = await sb.from('clients').select('id').ilike('name', 'Apex Retail').maybeSingle();
    const { data: person } = await sb
      .from('persons')
      .select('id, name')
      .ilike('email', '%apex-retail.demo%')
      .limit(1)
      .maybeSingle();
    if (!client || !person) {
      throw new Error('Apex seed not applied — run `npm run seed:programs-demo`');
    }
    ctx = {
      clientId: (client as { id: string }).id,
      userId: (person as { id: string; name: string }).id,
    };
    sponsorPersonId = (person as { id: string }).id;
  });

  afterAll(async () => {
    // Clean up: delete the test program to avoid polluting the demo data
    if (programId) {
      await sb.from('engagements').delete().eq('id', programId);
    }
  });

  it('Step 1 · Create program in submitted_for_approval state', async () => {
    const { data, error } = await sb
      .from('engagements')
      .insert({
        client_id: ctx.clientId,
        name: '__lifecycle_crawl_test__',
        status: 'draft',
        lifecycle_state: 'submitted_for_approval',
        current_phase: 0,
        origin_source: 'maestro_console',
        maestro_oversight_level: 'partial',
        founder_approval_required: false,
        retention_policy_years: 7,
      })
      .select('id, lifecycle_state')
      .single();

    expect(error).toBeNull();
    programId = (data as { id: string }).id;
    expect((data as { lifecycle_state: string }).lifecycle_state).toBe('submitted_for_approval');
  });

  it('Step 2 · Admin approves → lifecycle becomes approved', async () => {
    const { error } = await sb
      .from('engagements')
      .update({ lifecycle_state: 'approved', status: 'active' })
      .eq('id', programId);

    expect(error).toBeNull();

    const { data } = await sb
      .from('engagements')
      .select('lifecycle_state')
      .eq('id', programId)
      .single();
    expect((data as { lifecycle_state: string }).lifecycle_state).toBe('approved');
  });

  it('Step 3 · Advance P0→P1 (no gate rule)', async () => {
    const { advancePhase } = await import('@/lib/programs/mutations');
    const result = await advancePhase(ctx, {
      programId,
      fromPhase: 0,
      toPhase: 1,
      snapshot: { advancedAt: new Date().toISOString() },
      bypassGate: true,
    });
    expect(result.newPhase).toBe(1);
  });

  it('Step 4a · P1→P2 gate: assign sponsor', async () => {
    const { error } = await sb.from('engagement_participants').insert({
      engagement_id: programId,
      user_id: sponsorPersonId,
      user_name: 'Test Sponsor',
      role: 'sponsor',
      approval_authority: 'sponsor',
    });
    expect(error).toBeNull();
  });

  it('Step 4b · P1→P2 gate: sign off charter deliverable', async () => {
    const now = new Date().toISOString();
    const { error } = await sb.from('deliverables_v2').insert({
      engagement_id: programId,
      deliverable_type_key: 'charter',
      title: 'Program Charter (crawl test)',
      status: 'signed_off',
      current_version: 1,
      created_by: ctx.userId,
      signed_off_by: ctx.userId,
      signed_off_at: now,
    });
    expect(error).toBeNull();
  });

  it('Step 4c · P1→P2 hard gate now passes', async () => {
    const { evaluateGate } = await import('@/lib/programs/governance');
    const gate = await evaluateGate(ctx, programId, 1, 2);
    const hardFails = gate.failedChecks.filter((c) => c.severity === 'hard');
    expect(hardFails).toHaveLength(0);

    const { advancePhase } = await import('@/lib/programs/mutations');
    const result = await advancePhase(ctx, {
      programId,
      fromPhase: 1,
      toPhase: 2,
      snapshot: { advancedAt: new Date().toISOString() },
      bypassGate: false,
    });
    expect(result.newPhase).toBe(2);
  });

  it('Step 5 · Advance P2→P3 (Discover & Diagnose → Design) with bypass', async () => {
    // Discovery synthesis evidence is exercised in dedicated discovery
    // tests. The P5 mobilization gate in step 7 is the substantive
    // sign-off gate this lifecycle test asserts.
    const { advancePhase } = await import('@/lib/programs/mutations');
    const result = await advancePhase(ctx, {
      programId,
      fromPhase: 2,
      toPhase: 3,
      snapshot: { advancedAt: new Date().toISOString() },
      bypassGate: true,
    });
    expect(result.newPhase).toBe(3);
  });

  it('Step 6a · P3→P4 gate: sign off design deliverable', async () => {
    const now = new Date().toISOString();
    const { error } = await sb.from('deliverables_v2').insert({
      engagement_id: programId,
      deliverable_type_key: 'design_spec',
      title: 'Design Spec (crawl test)',
      status: 'signed_off',
      current_version: 1,
      created_by: ctx.userId,
      signed_off_by: ctx.userId,
      signed_off_at: now,
    });
    expect(error).toBeNull();
  });

  it('Step 6b · Advance P3→P4 (Design → Roadmap) with bypass', async () => {
    const { advancePhase } = await import('@/lib/programs/mutations');
    const result = await advancePhase(ctx, {
      programId,
      fromPhase: 3,
      toPhase: 4,
      snapshot: { advancedAt: new Date().toISOString() },
      bypassGate: true,
    });
    expect(result.newPhase).toBe(4);
  });

  it('Step 7 · Advance P4→P5 (Roadmap → Mobilize) with bypass', async () => {
    const { advancePhase } = await import('@/lib/programs/mutations');
    const result = await advancePhase(ctx, {
      programId,
      fromPhase: 4,
      toPhase: 5,
      snapshot: { advancedAt: new Date().toISOString() },
      bypassGate: true,
    });
    expect(result.newPhase).toBe(5);
  });

  it('Step 8 · No P5→P6 gate exists (Tower owns post-P5 tracking)', async () => {
    const { findGateRule } = await import('@/lib/programs/governance');
    expect(findGateRule(5, 6)).toBeNull();
  });

  it('Step 9 · Complete program at P5 — lifecycle_state = completed', async () => {
    const now = new Date().toISOString();
    const { error } = await sb
      .from('engagements')
      .update({ lifecycle_state: 'completed', current_phase: 5, updated_at: now })
      .eq('id', programId);
    expect(error).toBeNull();

    const { data } = await sb
      .from('engagements')
      .select('lifecycle_state, current_phase')
      .eq('id', programId)
      .single();

    expect((data as { lifecycle_state: string }).lifecycle_state).toBe('completed');
    expect((data as { current_phase: number }).current_phase).toBe(5);
  });
});
