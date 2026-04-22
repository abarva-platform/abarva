import { getAnthropicClient } from '@/lib/agent/stream';
import {
  getEngagementById,
  type EngagementRow,
} from '@/lib/db/engagement';
import { getRecentTurns } from '@/lib/db/turn';
import { getActivePatterns, getPeerDecisionsForPhase } from '@/lib/graph/retrieval';
import { getServerSupabase } from '@/lib/supabase-server';
import { generateDeliverable as generateDeliverableV2 } from './v2-generator';

export interface EngagementCharter {
  problem_statement: string;
  forcing_event: string;
  scope_in: string[];
  scope_out: string[];
  stakeholders: Array<{
    name: string;
    role: string;
    stance: 'sponsor' | 'champion' | 'neutral' | 'skeptic' | 'blocker';
  }>;
  success_criteria: string[];
  constraints: string[];
  generated_at: string;
}

export interface DiagnosticCharter {
  current_state_summary: string;
  quantified_problem: Array<{ metric: string; value: string; source: string }>;
  active_genome_patterns: Array<{ code: string; name: string; evidence: string }>;
  root_causes: string[];
  peer_comparables: Array<{ engagement_name: string; industry: string; outcome: string }>;
  hypotheses: string[];
  generated_at: string;
}

const PHASE_TO_V2_DELIVERABLE: Record<number, string> = {
  0: 'charter',
  1: 'diagnostic_charter',
  2: 'design_brief',
  3: 'execution_plan',
  4: 'outcome_report',
};

const PHASE_TO_LEGACY_DELIVERABLE: Record<number, string> = {
  0: 'engagement_charter',
  1: 'diagnostic_charter',
  2: 'solution_design',
  3: 'execution_dashboard',
  4: 'outcome_verification',
};

function legacyContentFromV2(args: {
  content: string;
  structuredData: unknown;
}): Record<string, unknown> {
  const sections = Array.isArray((args.structuredData as { sections?: unknown[] } | null)?.sections)
    ? ((args.structuredData as {
        sections: Array<{ key?: string; title?: string; body?: string; citations?: string[] }>;
      }).sections)
    : [];

  if (sections.length === 0) {
    return { markdown: args.content };
  }

  const mapped = Object.fromEntries(
    sections
      .filter((section) => typeof section.key === 'string')
      .map((section) => [
        section.key as string,
        {
          title: section.title ?? section.key ?? 'Section',
          body: section.body ?? '',
          citations: Array.isArray(section.citations) ? section.citations : [],
        },
      ]),
  );

  return {
    ...mapped,
    markdown: args.content,
  };
}

async function syncLegacyArtifacts(args: {
  engagementId: string;
  phase: number;
  content: string;
  structuredData: unknown;
}): Promise<void> {
  const engagement = await getEngagementById(args.engagementId);
  if (!engagement) return;

  const legacyType = PHASE_TO_LEGACY_DELIVERABLE[args.phase];
  if (!legacyType) return;

  const legacyContent = legacyContentFromV2({
    content: args.content,
    structuredData: args.structuredData,
  });

  const existing = ((engagement.deliverables as Array<Record<string, unknown>> | null) ?? []);
  const deliverables = [
    ...existing.filter((deliverable) => deliverable.type !== legacyType),
    {
      type: legacyType,
      phase: args.phase,
      generated_at: new Date().toISOString(),
      content: legacyContent,
    },
  ];

  const updates: Record<string, unknown> = { deliverables };
  if (args.phase === 0) {
    updates.charter = legacyContent;
  }
  if (args.phase === 4) {
    updates.status = 'completed';
    updates.outcome_fee_status = engagement.outcome_fee_usd && engagement.outcome_fee_usd > 0 ? 'approved' : 'not_triggered';
    updates.phase_4_completed_at = new Date().toISOString();
  }

  await getServerSupabase()
    .from('engagements')
    .update(updates)
    .eq('id', args.engagementId);
}

function assembleCharterPrompt(engagementName: string, turnHistory: string): string {
  return `You are generating an Engagement Charter from the conversation below. Extract only what was explicitly discussed — do not invent or infer.

ENGAGEMENT: ${engagementName}

CONVERSATION:
${turnHistory}

Produce a structured Engagement Charter in JSON:

{
  "problem_statement": "1-2 sentences stating the core problem the sponsor is solving",
  "forcing_event": "What triggered this engagement right now",
  "scope_in": ["What's in scope"],
  "scope_out": ["What's explicitly out of scope, if mentioned"],
  "stakeholders": [ { "name": "Full Name", "role": "Title", "stance": "sponsor" | "champion" | "neutral" | "skeptic" | "blocker" } ],
  "success_criteria": ["Concrete criteria the sponsor named as 'done'"],
  "constraints": ["Time, budget, political, regulatory constraints mentioned"]
}

RULES
- Only include fields where the conversation provided clear signal. Leave arrays empty if nothing discussed.
- Each string terse, factual, no hedging.
- Do not add commentary, markdown, or any text outside the JSON object.

Output ONLY the JSON object.`;
}

function assembleSolutionDesignPrompt(args: {
  engagementName: string;
  diagnosticSummary: string;
  turnHistory: string;
  peerDecisions: Array<{ choice: string; engagement_count: number; avg_outcome_usd: number }>;
}): string {
  return `You are generating a Solution Design from a completed Phase 2 conversation.

ENGAGEMENT: ${args.engagementName}

DIAGNOSTIC (locked)
${args.diagnosticSummary}

PEER DECISIONS AT THIS PHASE
${args.peerDecisions.map((d) => `- "${d.choice}" — ${d.engagement_count} engagements, avg $${Math.round(d.avg_outcome_usd / 1000000)}M`).join('\n')}

CONVERSATION (Phase 2 Design turns)
${args.turnHistory}

Produce a Solution Design in JSON:

{
  "options_considered": [
    {
      "name": "Short name",
      "description": "1-2 sentence description",
      "estimated_cost_usd": 5000000,
      "estimated_timeline_months": 9,
      "risk_level": "low" | "medium" | "high",
      "expected_outcome_usd": 15000000,
      "peer_comparables": [{"engagement_name": "...", "outcome_summary": "..."}],
      "genome_pattern_risks": [{"code": "F007", "note": "..."}],
      "pros": ["..."],
      "cons": ["..."]
    }
  ],
  "recommended_option": "name matching one of options_considered",
  "recommendation_rationale": "2-3 sentences",
  "selected_option": "what the sponsor ACTUALLY chose",
  "roadmap": [{"milestone": "...", "target_date": "YYYY-MM-DD", "owner": "role or name", "dependencies": []}],
  "baseline_metrics_proposed": [
    {"metric": "name", "baseline_value": "number with unit", "measurement_method": "how", "source": "where"}
  ]
}

RULES
- Each option must have all fields populated
- Only include options actually discussed
- recommended_option and selected_option may differ
- Numbers explicit, not ranges
- Output ONLY JSON. No commentary.`;
}

function assembleExecutionPrompt(args: {
  engagementName: string;
  roadmap: string;
  turnHistory: string;
  decisionsCount: number;
}): string {
  return `You are generating an Execution Dashboard summarizing a completed Phase 3 conversation.

ENGAGEMENT: ${args.engagementName}

ROADMAP (from Phase 2 Design)
${args.roadmap}

DECISIONS LOGGED DURING PHASE 3: ${args.decisionsCount}

CONVERSATION (Phase 3 turns)
${args.turnHistory}

Produce an Execution Dashboard in JSON:

{
  "milestones": [
    {
      "milestone": "from roadmap",
      "target_date": "YYYY-MM-DD",
      "actual_date": "YYYY-MM-DD or null",
      "status": "complete" | "on_track" | "at_risk" | "slipped" | "descoped",
      "notes": "short factual note"
    }
  ],
  "chain_risks_surfaced": [
    {"code": "F007", "surfaced_at": "YYYY-MM-DD", "mitigation": "what was done"}
  ],
  "decisions_logged_count": ${args.decisionsCount},
  "scope_changes": [
    {"change": "description", "approved_by": "person"}
  ]
}

Output ONLY JSON.`;
}

function assembleVerificationPrompt(args: {
  engagementName: string;
  baselineItems: string;
  actualItems: string;
  feeInfo: string;
  turnHistory: string;
  durationDays: number;
}): string {
  return `You are generating an Outcome Verification for a completed Phase 4 conversation.

ENGAGEMENT: ${args.engagementName}
DURATION: ${args.durationDays} days

BASELINE METRICS
${args.baselineItems}

ACTUAL METRICS
${args.actualItems}

OUTCOME FEE PROPOSAL
${args.feeInfo}

CONVERSATION (Phase 4 Verify turns)
${args.turnHistory}

Produce an Outcome Verification in JSON:

{
  "metrics_compared": [
    {
      "metric": "name",
      "baseline_value": "value with unit",
      "actual_value": "value with unit",
      "delta_absolute": "value with unit",
      "delta_percentage": 25.5
    }
  ],
  "total_baseline_cost_usd": 14200000,
  "total_actual_cost_usd": 9600000,
  "total_savings_usd": 4600000,
  "fee_percentage": 20,
  "fee_amount_usd": 920000,
  "engagement_duration_days": ${args.durationDays},
  "lessons_learned": ["short lesson statements"]
}

- delta_percentage positive = improvement (cost down, hours down, etc.)
- If numbers not explicitly stated, derive from baseline/actual items
- Output ONLY JSON.`;
}

function assembleDiagnosticPrompt(args: {
  engagementName: string;
  charterSummary: string;
  turnHistory: string;
  activeGenomePatterns: Array<{ code: string; name: string; failure_rate: number }>;
}): string {
  return `You are generating a Diagnostic Charter from the conversation below, enriched with platform intelligence.

ENGAGEMENT: ${args.engagementName}

CHARTER (already approved)
${args.charterSummary}

ACTIVE GENOME PATTERNS
${args.activeGenomePatterns.map((p) => `- ${p.code} ${p.name} (${(p.failure_rate * 100).toFixed(0)}% historical failure rate)`).join('\n')}

CONVERSATION (Phase 1 Diagnose turns)
${args.turnHistory}

Produce a Diagnostic Charter in JSON:

{
  "current_state_summary": "2-3 sentences, clinical",
  "quantified_problem": [ { "metric": "...", "value": "...", "source": "..." } ],
  "active_genome_patterns": [ { "code": "F008", "name": "...", "evidence": "..." } ],
  "root_causes": ["Short root-cause statements"],
  "peer_comparables": [ { "engagement_name": "...", "industry": "...", "outcome": "..." } ],
  "hypotheses": ["Diagnostic hypotheses"]
}

RULES same as charter. Output ONLY JSON.`;
}

function parseJsonFromResponse(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function runHaiku(prompt: string): Promise<Record<string, unknown> | null> {
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = response.content
    .filter((b: { type: string }) => b.type === 'text')
    .map((b: { text: string }) => b.text)
    .join('');
  return parseJsonFromResponse(text);
}

async function generateLegacyDeliverableForPhase(engagementId: string, phase: number): Promise<void> {
  const engagement = (await getEngagementById(engagementId)) as EngagementRow | null;
  if (!engagement) return;

  const turns = await getRecentTurns(engagementId, 50);
  const turnHistory = turns.map((t) => `[${t.sender.toUpperCase()}]: ${t.text}`).join('\n\n');

  let deliverable: Record<string, unknown> | null = null;
  let deliverableType: string;

  if (phase === 0) {
    deliverableType = 'engagement_charter';
    deliverable = await runHaiku(assembleCharterPrompt(engagement.name, turnHistory));
    if (deliverable) {
      await getServerSupabase()
        .from('engagements')
        .update({ charter: deliverable })
        .eq('id', engagementId);
    }
  } else if (phase === 1) {
    deliverableType = 'diagnostic_charter';
    const activePatterns = await getActivePatterns(engagement.graph_node_id);
    deliverable = await runHaiku(
      assembleDiagnosticPrompt({
        engagementName: engagement.name,
        charterSummary: engagement.charter
          ? JSON.stringify(engagement.charter).slice(0, 500)
          : 'Charter not yet generated',
        turnHistory,
        activeGenomePatterns: activePatterns.map((p) => ({
          code: p.code,
          name: p.name,
          failure_rate: p.failure_rate,
        })),
      }),
    );
  } else if (phase === 2) {
    deliverableType = 'solution_design';
    const deliverables = ((engagement.deliverables as Array<Record<string, unknown>> | null) ?? []);
    const diagnostic = deliverables.find((d) => d.type === 'diagnostic_charter');
    const peerDecisions = await getPeerDecisionsForPhase(engagement.graph_node_id, 2);
    deliverable = await runHaiku(
      assembleSolutionDesignPrompt({
        engagementName: engagement.name,
        diagnosticSummary: diagnostic ? JSON.stringify(diagnostic.content).slice(0, 1500) : 'No diagnostic available',
        turnHistory,
        peerDecisions: peerDecisions.map((d) => ({
          choice: d.choice,
          engagement_count: d.engagement_count,
          avg_outcome_usd: d.avg_outcome_usd,
        })),
      }),
    );
    // Also mirror baseline_metrics_proposed into engagements.baseline_metrics
    if (deliverable && Array.isArray((deliverable as { baseline_metrics_proposed?: unknown[] }).baseline_metrics_proposed)) {
      const items = (deliverable as { baseline_metrics_proposed: Array<Record<string, unknown>> }).baseline_metrics_proposed;
      await getServerSupabase()
        .from('engagements')
        .update({ baseline_metrics: { items, captured_at: new Date().toISOString() } })
        .eq('id', engagementId);
    }
  } else if (phase === 3) {
    deliverableType = 'execution_dashboard';
    const deliverables = ((engagement.deliverables as Array<Record<string, unknown>> | null) ?? []);
    const design = deliverables.find((d) => d.type === 'solution_design');
    const roadmap = design
      ? JSON.stringify((design.content as { roadmap?: unknown }).roadmap ?? []).slice(0, 1500)
      : 'No roadmap available';
    const decisions = (engagement.decisions as unknown[] | null) ?? [];
    deliverable = await runHaiku(
      assembleExecutionPrompt({
        engagementName: engagement.name,
        roadmap,
        turnHistory,
        decisionsCount: decisions.length,
      }),
    );
  } else if (phase === 4) {
    deliverableType = 'outcome_verification';
    const baseline = (engagement.baseline_metrics as { items?: Array<Record<string, unknown>> } | null)?.items ?? [];
    const actual = (engagement.actual_metrics as { items?: Array<Record<string, unknown>> } | null)?.items ?? [];
    const feeUsd = engagement.outcome_fee_usd ?? null;
    const feeInfo = feeUsd
      ? `Fee proposed: $${feeUsd.toLocaleString()}`
      : 'No fee proposed yet';
    const startedAt = engagement.phase_0_started_at ? new Date(engagement.phase_0_started_at) : new Date(engagement.created_at);
    const durationDays = Math.max(1, Math.floor((Date.now() - startedAt.getTime()) / 86_400_000));
    deliverable = await runHaiku(
      assembleVerificationPrompt({
        engagementName: engagement.name,
        baselineItems: baseline.map((m) => `- ${m.metric}: ${m.baseline_value}`).join('\n') || '- none',
        actualItems: actual.map((m) => `- ${m.metric}: ${m.actual_value}`).join('\n') || '- none',
        feeInfo,
        turnHistory,
        durationDays,
      }),
    );
    // On successful generation, transition to completed + fee approved
    if (deliverable) {
      await getServerSupabase()
        .from('engagements')
        .update({
          status: 'completed',
          outcome_fee_status: feeUsd && feeUsd > 0 ? 'approved' : 'not_triggered',
          phase_4_completed_at: new Date().toISOString(),
        })
        .eq('id', engagementId);
    }
  } else {
    return;
  }

  if (!deliverable) return;

  const sb = getServerSupabase();
  const { data: current } = await sb
    .from('engagements')
    .select('deliverables')
    .eq('id', engagementId)
    .single();
  const existing = ((current?.deliverables as Array<Record<string, unknown>> | null) ?? []);
  const newDeliverables = [
    ...existing.filter((d) => d.type !== deliverableType),
    {
      type: deliverableType,
      phase,
      generated_at: new Date().toISOString(),
      content: deliverable,
    },
  ];
  await sb.from('engagements').update({ deliverables: newDeliverables }).eq('id', engagementId);
}

export async function generateDeliverableForPhase(engagementId: string, phase: number): Promise<void> {
  const deliverableTypeKey = PHASE_TO_V2_DELIVERABLE[phase];

  if (deliverableTypeKey) {
    try {
      const result = await generateDeliverableV2({
        engagementId,
        deliverableTypeKey,
        persist: true,
      });

      await syncLegacyArtifacts({
        engagementId,
        phase,
        content: result.content,
        structuredData: result.structured_data,
      });

      return;
    } catch (err) {
      console.warn('[generateDeliverableForPhase.v2]', err);
    }
  }

  await generateLegacyDeliverableForPhase(engagementId, phase);
}
