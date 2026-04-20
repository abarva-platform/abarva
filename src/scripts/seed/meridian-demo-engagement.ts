import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

// Q3 · Meridian demo engagement turn-history seed.
//
// Creates (or refreshes) a Phase 2 Design engagement at Meridian with 12
// sample turns demonstrating quality Nexus dialogue, 3 partial deliverable
// drafts, active patterns metadata. Every seeded artifact is tagged
// retrieved_refs.source='demo_seed' for clean rollback.
//
// Idempotent: re-running clears prior demo_seed turns for this engagement
// then re-seeds.
//
// Usage:
//   npx tsx src/scripts/seed/meridian-demo-engagement.ts
//
// Teardown:
//   DELETE FROM turns WHERE retrieved_refs->>'source' = 'demo_seed';
//   UPDATE engagements SET deliverables='[]'::jsonb WHERE name LIKE 'Meridian%AI Governance%' AND deliverables::text LIKE '%demo_seed%';

function getSb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required');
  return createClient(url, key, { auth: { persistSession: false } });
}

const ENGAGEMENT_NAME = 'Meridian · AI Governance + Analytics Modernization';
const CLIENT_NAME_CANDIDATES = ['Meridian Health', 'Meridian Health System'];
const SPONSOR_NAME = 'Sarah Chen';
const SPONSOR_ROLE = 'Chief Information Officer';
const SPONSOR_EMAIL_HINT = 'schen@meridian.demo';

const now = Date.now();
const days = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000).toISOString();

// 12 turns over last ~10 days, alternating sender, showing phase progression
const TURN_SCRIPT: Array<{
  day: number;
  sender: 'user' | 'agent';
  phase: number;
  mode_label?: string;
  text: string;
}> = [
  {
    day: 10,
    sender: 'user',
    phase: 1,
    text: `Sarah here. Board flagged AI sprawl last week — we have 28 production AI use cases across Meridian, seven different vendors, and nobody can answer "which ones are working." I need to know where to start. We're also hitting data platform sprawl that the Databricks migration hasn't fixed.`,
  },
  {
    day: 10,
    sender: 'agent',
    phase: 1,
    mode_label: 'Diagnose',
    text: `Understood. Let's anchor this. Two observations first, then I have a question.\n\nFirst — your vendor landscape has two active foundation models (Microsoft Copilot + Anthropic/Claude) and three clinical AI vendors (Abridge, Nuance DAX, Cohere Health). Abridge + Nuance DAX are overlapping regionally at roughly $478K/mo combined. That's the largest rationalization opportunity I'm seeing.\n\nSecond — the Databricks-to-Snowflake path at 47% complete has a governance layer that hasn't been designed. That's F004 in the Genome — data platform sprawl combined with AI-readiness claims tends to recreate the original problem after migration. 78% historical failure rate.\n\nMy question: what triggered the board's AI sprawl concern — an incident, a consultant brief, or a budget review? That shapes whether we sequence governance first or rationalization first.`,
  },
  {
    day: 9,
    sender: 'user',
    phase: 1,
    text: `Budget review. Finance flagged that AI spend grew 38% YoY without ROI attribution. The board asked CFO to quantify savings and Robin (CFO) came back with "we can't, the attribution doesn't exist." That turned into an AI governance ask by the following week.`,
  },
  {
    day: 9,
    sender: 'agent',
    phase: 1,
    mode_label: 'Diagnose',
    text: `That's a CFO-driven ask, not a regulatory one. Sequencing implication: you need attribution plumbing before you can move on rationalization. If you cut a vendor and you can't prove the gap closed, the board loses confidence.\n\nThree diagnostic questions, I'd like answers over the next two sessions:\n\n1. What's the board's AI timeline — is analytics modernization the blocker or is it a parallel track?\n2. Who owns data governance today? Is there an active data steward program or is it distributed?\n3. Have you quantified the Abridge + Nuance DAX overlap at the service-line level, or is $478K/mo just the aggregate?\n\nStart with #1.`,
  },
  {
    day: 8,
    sender: 'user',
    phase: 1,
    text: `Board timeline is 18 months for "verified AI value." Analytics modernization is a prereq — they made that explicit. On governance, we have a nominal data steward program under the CMIO office but it's not active. Three people, each 20% allocated, committee meets quarterly. On the Abridge+Nuance overlap — I don't have service-line detail. Best guess Abridge covers hospital med/surg, Nuance DAX covers ambulatory. They were bought by different service-line leaders.`,
  },
  {
    day: 8,
    sender: 'agent',
    phase: 1,
    mode_label: 'Diagnose',
    text: `Good. That tells me four things.\n\nFirst, the 18-month board commit makes the analytics modernization sequence load-bearing. Genome shows F008 (AI ROI unclear) at 91% failure rate when modernization lags AI adoption — we need to re-baseline the Databricks→Snowflake path against AI-readiness criteria, not just platform consolidation.\n\nSecond, the governance program is governance theater — committee meets but can't name last 3 use cases it approved, and 20% FTE allocation means no enforcement. I'll pattern-match that to F007 (documented-not-enforced).\n\nThird, the vendor overlap being service-line-owned (not centralized procurement) is actually good news for rationalization — clear ownership means clear decision authority.\n\nFourth, we have enough to move from Phase 1 Diagnose to Phase 2 Design. I'd propose three intervention paths. Want to walk through them?`,
  },
  {
    day: 6,
    sender: 'user',
    phase: 2,
    text: `Yes, walk me through the options. What's the honest tradeoff space?`,
  },
  {
    day: 6,
    sender: 'agent',
    phase: 2,
    mode_label: 'Design',
    text: `Three viable paths. Each has different capital, timeline, and political shape.\n\nPath A · Governance-first. Stand up enforced AI governance (review board with binding authority, model inventory, bias monitoring) before touching any vendor. 3-4 months. Cost: ~$180K platform + $420K internal FTE. Outcome: board gets attribution mechanism; rationalization happens with evidence. Risk: rationalization delayed 4 months.\n\nPath B · Rationalization-first. Consolidate Abridge+Nuance DAX (pick one, migrate), resolve Databricks→Snowflake governance overlay, then governance. 6-7 months. Cost: ~$240K platform + $380K internal + $180K migration. Outcome: immediate spend reduction ~$2.8M annualized. Risk: F007 pattern — rationalization without governance leaves you vulnerable to the next wave.\n\nPath C · Parallel. Start both. Requires 2 workstream leads, shared steering. 4-5 months. Cost: ~$340K platform + $650K internal. Outcome: fastest compound benefit. Risk: organizational strain; pattern chain risk (F004 → F008 at 64% chain rate) if both threads underpowered.\n\nBased on peer comparables — 8 engagements with similar CFO-driven starts, 6 chose Path C, 4 succeeded. The 2 that failed both had <0.6 FTE workstream leads. If Meridian can staff dedicated 1.0 leads, I'd recommend C. If not, A.\n\nWhich is the binding constraint — time to board update, or staffing bandwidth?`,
  },
  {
    day: 5,
    sender: 'user',
    phase: 2,
    text: `Time. Board update in May. That's 14 weeks. Staffing I can unlock if the case is clear.`,
  },
  {
    day: 5,
    sender: 'agent',
    phase: 2,
    mode_label: 'Design',
    text: `14 weeks rules out Path B. You cannot land a vendor migration + new governance by May with credibility.\n\nMy recommendation: Path C with two named leads. For governance, I'd propose Maya Patel (CMIO office, already involved in the steward program — has political cover). For rationalization, Derek Liu (IT architecture, ran the Databricks migration — has the modernization context).\n\nI'll draft the business case. Three numbers the board will ask about that we need to prep:\n  · Annualized savings from Abridge+Nuance consolidation: $2.8M conservative, $3.4M base, $4.1M aggressive\n  · Governance ROI: quantified risk-avoidance is hard; we'll frame as compliance-readiness + attribution enablement\n  · 14-week milestone credibility: needs 3 gates with falsifiable exit criteria\n\nAnything I'm missing on Maya and Derek? Conflicts or constraints I should know?`,
  },
  {
    day: 3,
    sender: 'user',
    phase: 2,
    text: `Maya is the right call. Derek is stretched — he's also on Epic go-live which is Q3. Can we land rationalization with someone else as lead, or is Derek essential?`,
  },
  {
    day: 3,
    sender: 'agent',
    phase: 2,
    mode_label: 'Design',
    text: `Derek's not essential as lead — he's essential as advisor. Good alternative is Priya Raman if she's available (senior architect, ran the Snowflake governance pilot). Derek can review at phase gates only.\n\nOne more thing for the business case: the Databricks→Snowflake migration budget. If the board hasn't locked it, we should fold the governance overlay into that budget rather than treat it as additive. Savings: ~$180K of double-counted vendor setup, and it aligns the two threads politically under analytics modernization (where you already have board air cover).\n\nI'm drafting the options paper now. You'll have a v0 by end of day Friday. We can iterate over the weekend if needed.`,
  },
];

const DEMO_DELIVERABLES = [
  {
    type: 'options_paper',
    phase: 2,
    generated_at: days(4),
    content: {
      title: 'Paths A/B/C · 14-week board commit framing',
      status: 'draft_v2',
      quality_score: 72,
      source: 'demo_seed',
      paths_analyzed: 3,
      recommended: 'C',
      sections_complete: ['executive_summary', 'current_state_baseline', 'options_comparison'],
      sections_pending: ['financial_return', 'risks_and_mitigations'],
    },
  },
  {
    type: 'business_case',
    phase: 2,
    generated_at: days(2),
    content: {
      title: 'Governance-first + rationalization parallel · board case',
      status: 'in_progress',
      quality_score: 58,
      source: 'demo_seed',
      data_gaps: ['Derek availability confirmation', 'Snowflake governance overlay pricing'],
      sections_complete: ['strategic_context'],
      sections_in_progress: ['investment_requirement', 'financial_return'],
    },
  },
  {
    type: 'governance_charter',
    phase: 2,
    generated_at: days(1),
    content: {
      title: 'Meridian AI Governance Charter · v0.3',
      status: 'outline',
      source: 'demo_seed',
      review_board_proposed: { members: 5, chair: 'CMIO', cadence: 'biweekly' },
      scope: 'all production AI + shadow AI discovered in Q2 audit',
    },
  },
];

async function findMeridianClient(sb: SupabaseClient): Promise<{ id: string; name: string } | null> {
  for (const name of CLIENT_NAME_CANDIDATES) {
    const { data } = await sb.from('clients').select('id, name').ilike('name', name).maybeSingle();
    if (data) return data as { id: string; name: string };
  }
  return null;
}

async function findOrCreateSponsor(sb: SupabaseClient): Promise<string> {
  const { data: existing } = await sb
    .from('persons')
    .select('id')
    .ilike('name', SPONSOR_NAME)
    .maybeSingle();
  if (existing) return (existing as { id: string }).id;

  const { data: inserted, error } = await sb
    .from('persons')
    .insert({
      name: SPONSOR_NAME,
      email: SPONSOR_EMAIL_HINT,
      role: SPONSOR_ROLE,
      organization: 'Meridian Health',
      familiarity: 'frequent_collaborator',
      communication_style: { pace: 'direct', detail_level: 'operational' },
      working_rhythm: {},
      personal_threads: [],
    })
    .select('id')
    .single();
  if (error) throw error;
  return (inserted as { id: string }).id;
}

async function findOrCreateEngagement(
  sb: SupabaseClient,
  clientId: string,
  sponsorId: string,
): Promise<{ id: string; graph_node_id: string }> {
  const { data: existing } = await sb
    .from('engagements')
    .select('id, graph_node_id')
    .eq('name', ENGAGEMENT_NAME)
    .maybeSingle();
  if (existing) return existing as { id: string; graph_node_id: string };

  const graphNodeId = `eng_meridian_demo_${Date.now().toString(36)}`;
  const { data: inserted, error } = await sb
    .from('engagements')
    .insert({
      graph_node_id: graphNodeId,
      name: ENGAGEMENT_NAME,
      industry_code: 'HEALTHCARE_IDN',
      function_code: 'AI_GOVERNANCE',
      objective_code: 'GOVERNANCE_AND_RATIONALIZATION',
      topic_code: 'ai_governance_implementation',
      sponsor_person_id: sponsorId,
      client_id: clientId,
      current_phase: 2,
      status: 'active',
      charter: {
        problem_statement: 'AI spend grew 38% YoY with no ROI attribution; board needs verified value in 18 months while Meridian holds an active Databricks→Snowflake modernization.',
        forcing_event: 'CFO flagged lack of AI attribution at Q1 budget review; board escalated to 14-week governance commit.',
        scope_in: ['Production AI inventory + attribution', 'Abridge/Nuance DAX regional overlap rationalization', 'Governance overlay for Snowflake migration'],
        scope_out: ['New AI use-case enablement (parked until governance lands)', 'Clinical workflow changes', 'Epic go-live impact'],
        stakeholders: [
          { name: 'Sarah Chen', role: 'CIO', stance: 'sponsor' },
          { name: 'Robin Acevedo', role: 'CFO', stance: 'sponsor' },
          { name: 'Maya Patel', role: 'CMIO office · proposed governance lead', stance: 'champion' },
          { name: 'Derek Liu', role: 'IT architecture · advisor (constrained by Epic go-live)', stance: 'neutral' },
          { name: 'Service-line VPs', role: 'vendor-overlap owners', stance: 'skeptic' },
        ],
        success_criteria: ['$2.8M+ annualized vendor-overlap savings', 'Enforced governance board with binding authority', 'Board update May 2026 with credible attribution mechanism'],
        constraints: ['14-week runway to board update', 'Epic go-live Q3 2026 blocks Derek', 'Databricks migration already mid-flight — no re-platform'],
        generated_at: days(11),
      },
      gates_passed: [
        { phase: 0, status: 'approved', signed_at: days(11), approval_text: 'Charter locked — Phase 0 complete.', summary: 'Governance + rationalization parallel track authorized.' },
        { phase: 1, status: 'approved', signed_at: days(7), approval_text: 'Diagnose complete. Pattern-matched to F004, F007, F008.', summary: 'Three intervention paths framed.' },
      ],
      deliverables: DEMO_DELIVERABLES,
      baseline_metrics: {
        items: [
          { metric: 'Annual AI vendor spend', baseline_value: '$11.4M', source: 'Finance Q1 2026 extract' },
          { metric: 'Abridge + Nuance DAX combined monthly', baseline_value: '$478K', source: 'AP system + vendor contracts' },
          { metric: 'Governance review cycle time', baseline_value: 'no SLA · avg 90+ days', source: 'CMIO office calendar review' },
        ],
      },
    })
    .select('id, graph_node_id')
    .single();
  if (error) throw error;
  return inserted as { id: string; graph_node_id: string };
}

async function clearPriorDemoTurns(sb: SupabaseClient, engagementId: string): Promise<number> {
  // Supabase doesn't support ->> in delete filters on all versions, but we can
  // match on mode_label which we'll distinguish via 'demo_seed' prefix. To
  // keep the surface simple, delete all turns for this engagement where
  // retrieved_refs contains our tag (via JSONB containment).
  const { data, error } = await sb
    .from('turns')
    .delete()
    .eq('engagement_id', engagementId)
    .contains('retrieved_refs', { source: 'demo_seed' })
    .select('id');
  if (error) throw error;
  return (data ?? []).length;
}

async function seedTurns(sb: SupabaseClient, engagementId: string): Promise<void> {
  const rows = TURN_SCRIPT.map((t) => ({
    engagement_id: engagementId,
    phase: t.phase,
    sender: t.sender,
    text: t.text,
    mode_label: t.mode_label ?? null,
    retrieved_refs: {
      source: 'demo_seed',
      demo_script_version: 1,
      seeded_at: new Date().toISOString(),
    },
    created_at: days(t.day),
  }));

  const { error } = await sb.from('turns').insert(rows);
  if (error) throw error;
}

async function main() {
  const sb = getSb();

  const client = await findMeridianClient(sb);
  if (!client) {
    console.error('✗  No Meridian client found. Apply Pack H + Pack J seeds first.');
    process.exit(1);
  }
  console.log(`ℹ  Meridian client · id=${client.id}`);

  const sponsorId = await findOrCreateSponsor(sb);
  console.log(`ℹ  Sponsor · Sarah Chen · id=${sponsorId}`);

  const engagement = await findOrCreateEngagement(sb, client.id, sponsorId);
  console.log(`ℹ  Engagement · ${ENGAGEMENT_NAME} · id=${engagement.id} · graph=${engagement.graph_node_id}`);

  const cleared = await clearPriorDemoTurns(sb, engagement.id);
  if (cleared > 0) console.log(`✓  Cleared ${cleared} prior demo_seed turns`);

  await seedTurns(sb, engagement.id);
  console.log(`✓  Seeded ${TURN_SCRIPT.length} turns with source='demo_seed'`);

  console.log('\n─ Demo engagement ready. ─────────────────────────────');
  console.log(`  URL · /engagements/${engagement.graph_node_id}`);
  console.log(`  Turns · ${TURN_SCRIPT.length} sample turns over 10 days`);
  console.log(`  Deliverables · ${DEMO_DELIVERABLES.length} draft entries in engagement.deliverables`);
  console.log(`  Charter · populated (Phase 0 + Phase 1 gates approved, current Phase 2)`);
  console.log(`  Teardown · DELETE FROM turns WHERE retrieved_refs->>'source' = 'demo_seed';`);
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
