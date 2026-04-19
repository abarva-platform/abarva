import { getAnthropicClient } from '@/lib/agent/stream';
import {
  getEngagementById,
  type EngagementRow,
} from '@/lib/db/engagement';
import { getRecentTurns } from '@/lib/db/turn';
import { getActivePatterns } from '@/lib/graph/retrieval';
import { getServerSupabase } from '@/lib/supabase-server';

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
    .filter((b) => b.type === 'text')
    .map((b) => (b as { text: string }).text)
    .join('');
  return parseJsonFromResponse(text);
}

export async function generateDeliverableForPhase(engagementId: string, phase: number): Promise<void> {
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
