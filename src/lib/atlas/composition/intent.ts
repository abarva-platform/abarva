import { findArchetypeByLooseMatch } from '@/lib/atlas/iac/retrieval';

export type AtlasIacIntentKind = 'initiative-specific' | 'archetype-specific' | 'hybrid' | 'none';

export interface AtlasIacIntent {
  kind: AtlasIacIntentKind;
  initiativeId: string | null;
  archetypeKey: string | null;
}

const INITIATIVE_ID_RE = /\b(?:AR|MH|FC|APX|MER|FCFI)-\d{2,4}\b/i;
const HYBRID_RE = /\b(compare|against|versus|vs\.?|industry|market|peers?|trend|adoption|benchmark)\b/i;
const INITIATIVE_RE = /\b(initiative|pilot|program|status|our|we|tenant)\b/i;

function archetypeAlias(prompt: string): string | null {
  if (/\bclaude\s+code\b/i.test(prompt)) return 'claude_code';
  if (/\bcursor\b/i.test(prompt)) return 'cursor';
  if (/\bjoule\b/i.test(prompt)) return 'sap_joule';
  if (/\bnow\s+assist\b|\bservicenow\b/i.test(prompt)) return 'servicenow_now_assist';
  if (/\bworkday\b/i.test(prompt)) return 'workday_ai_agents';
  if (/\boracle\b/i.test(prompt)) return 'oracle_ai_agents';
  if (/\bsalesforce\b|\bagentforce\b|\beinstein\b/i.test(prompt)) return 'salesforce_einstein_agentforce';
  if (/\bgithub\b.*\bcopilot\b|\bcopilot\b.*\b(code|developer|sdlc|github)\b/i.test(prompt)) {
    return 'github_copilot';
  }
  if (/\bcopilot\b|\bm365\b|\bmicrosoft\s+365\b/i.test(prompt)) return 'microsoft_365_copilot';
  if (/\bvibe\s+coding\b|\bai-led\b|\bai led\b|\breplit\b|\blovable\b|\bv0\b/i.test(prompt)) {
    return 'ai_led_product_development';
  }
  return null;
}

export function extractInitiativeId(prompt: string): string | null {
  return prompt.match(INITIATIVE_ID_RE)?.[0]?.toUpperCase() ?? null;
}

export function classifyAtlasIacIntent(prompt: string): AtlasIacIntent {
  const initiativeId = extractInitiativeId(prompt);
  const archetype = findArchetypeByLooseMatch(prompt);
  const archetypeKey = archetype?.archetypeKey ?? archetypeAlias(prompt);
  const asksHybrid = HYBRID_RE.test(prompt);

  if (initiativeId && (asksHybrid || archetypeKey)) {
    return { kind: 'hybrid', initiativeId, archetypeKey };
  }
  if (initiativeId || (INITIATIVE_RE.test(prompt) && /\b(copilot|agent|cursor|joule|assist)\b/i.test(prompt))) {
    return { kind: 'initiative-specific', initiativeId, archetypeKey };
  }
  if (archetypeKey || asksHybrid) {
    return { kind: 'archetype-specific', initiativeId: null, archetypeKey };
  }
  return { kind: 'none', initiativeId: null, archetypeKey: null };
}
