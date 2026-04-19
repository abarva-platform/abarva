import { getAnthropicClient } from './stream';
import { getServerSupabase } from '@/lib/supabase-server';

export interface MaestroTurnContext {
  maestroPersonId: string;
  turnId: string;
  turnText: string;
  engagementId?: string | null;
  engagementIndustry?: string | null;
}

function extractionPrompt(currentProfile: Record<string, unknown>, turnText: string, industry?: string | null): string {
  return `You're updating a Maestro's evolving profile based on their latest turn. The
Maestro is a senior practitioner running AbarVa engagements. Their profile
accumulates across every turn.

CURRENT PROFILE
${JSON.stringify(currentProfile, null, 2)}

LATEST TURN (from the Maestro)
"""
${turnText}
"""

${industry ? `ENGAGEMENT INDUSTRY: ${industry}` : ''}

TASK
Return a JSON object with ONLY the fields that should be updated or added.
Do not restate fields that haven't changed.

Possible fields:
- background (string) — biographical/career summary
- domain_depth (string[]) — areas of deep expertise
- communication_style (string) — how they communicate
- preferences (string[]) — specific preferences (e.g., avoids certain names)
- recent_patterns (array of {pattern, seen_in_engagements}) — observed behaviors
- engagements_run (number) — increment if this turn starts a new engagement
- industries_touched (string[]) — add new industries

RULES
- If nothing is new or significant, return {}.
- Never remove fields, only add or refine.
- Keep strings concise — 1 sentence max each.
- For recent_patterns, merge with existing by pattern name; increment counter.

Return ONLY the JSON object, no prose.`;
}

export async function updateMaestroProfile(ctx: MaestroTurnContext): Promise<void> {
  const sb = getServerSupabase();
  const { data: person } = await sb
    .from('persons')
    .select('maestro_profile')
    .eq('id', ctx.maestroPersonId)
    .maybeSingle();
  if (!person) return;

  const currentProfile = ((person as { maestro_profile?: Record<string, unknown> | null }).maestro_profile ?? {}) as Record<
    string,
    unknown
  >;

  let update: Record<string, unknown> = {};
  try {
    const response = await getAnthropicClient().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: extractionPrompt(currentProfile, ctx.turnText, ctx.engagementIndustry) }],
    });
    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { text: string }).text)
      .join('');
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return;
    update = JSON.parse(match[0]) as Record<string, unknown>;
  } catch (err) {
    console.error('[maestro-extractor]', err);
    return;
  }

  if (!update || Object.keys(update).length === 0) return;

  // Merge — shallow for top-level fields; arrays concat-unique; recent_patterns merge by pattern name.
  const merged: Record<string, unknown> = { ...currentProfile };
  for (const [k, v] of Object.entries(update)) {
    if (k === 'recent_patterns' && Array.isArray(v)) {
      const existing = (Array.isArray(merged[k]) ? merged[k] : []) as Array<{
        pattern: string;
        seen_in_engagements: number;
      }>;
      const incoming = v as Array<{ pattern: string; seen_in_engagements: number }>;
      for (const p of incoming) {
        if (!p || typeof p.pattern !== 'string') continue;
        const idx = existing.findIndex((e) => e.pattern === p.pattern);
        if (idx >= 0) {
          existing[idx].seen_in_engagements =
            (existing[idx].seen_in_engagements ?? 0) + (p.seen_in_engagements ?? 1);
        } else {
          existing.push({ pattern: p.pattern, seen_in_engagements: p.seen_in_engagements ?? 1 });
        }
      }
      merged[k] = existing;
    } else if (Array.isArray(v) && Array.isArray(merged[k])) {
      merged[k] = Array.from(new Set([...(merged[k] as unknown[]), ...v]));
    } else {
      merged[k] = v;
    }
  }
  merged.last_updated_from_turn_id = ctx.turnId;

  await sb
    .from('persons')
    .update({
      maestro_profile: merged,
      maestro_profile_updated_at: new Date().toISOString(),
    })
    .eq('id', ctx.maestroPersonId);
}
