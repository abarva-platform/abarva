import { getServerSupabase } from '@/lib/supabase-server';

// Layer 4 · USER CONTEXT block for Nexus + Ask Intelligence prompts.
// Pulls from vip_profiles (migration 038). Empty-safe: returns '' if no
// VIP profile matches, or if demo_tier='standard' (no personalization
// for generic users).

export interface UserProfileArgs {
  personId?: string | null;
  displayName?: string | null;
}

type CareerRole = { role?: string; company?: string; start?: string | null; end?: string | null; scope?: string };
type Initiative = string;
type Signal = { type?: string; venue?: string; date?: string; topic?: string };
type Principle = string;
type Concern = string;

interface VipProfileRow {
  display_name: string;
  current_title: string | null;
  current_company: string | null;
  current_industry: string | null;
  current_company_scale: Record<string, unknown> | null;
  career_history: CareerRole[] | null;
  current_initiatives: Initiative[] | null;
  areas_of_expertise: string[] | null;
  recent_public_signals: Signal[] | null;
  company_principles: Principle[] | null;
  labor_model: string | null;
  cloud_posture: string | null;
  communication_style: Record<string, unknown> | null;
  builder_vs_buyer: string | null;
  known_concerns: Concern[] | null;
  demo_tier: string;
  emphasize_topics: string[] | null;
  avoid_topics: string[] | null;
}

export interface VipGreetingData {
  displayName: string;
  firstName: string;
  currentTitle: string | null;
  currentCompany: string | null;
  emphasizeTopics: string[];
  currentInitiatives: string[];
}

export async function loadVipGreetingData(args: UserProfileArgs): Promise<VipGreetingData | null> {
  const profile = await loadProfile(args);
  if (!profile) return null;
  const firstName = profile.display_name.split(/\s+/)[0] ?? profile.display_name;
  return {
    displayName: profile.display_name,
    firstName,
    currentTitle: profile.current_title,
    currentCompany: profile.current_company,
    emphasizeTopics: (profile.emphasize_topics ?? []).slice(0, 3),
    currentInitiatives: (profile.current_initiatives ?? []).slice(0, 3),
  };
}

async function loadProfile(args: UserProfileArgs): Promise<VipProfileRow | null> {
  if (!args.personId && !args.displayName) return null;
  const sb = getServerSupabase();
  let row: VipProfileRow | null = null;
  let matchPath: 'person_id' | 'display_name_exact' | 'display_name_ilike' | 'miss' = 'miss';

  if (args.personId) {
    const { data, error } = await sb
      .from('vip_profiles')
      .select('*')
      .eq('person_id', args.personId)
      .neq('demo_tier', 'standard')
      .maybeSingle();
    if (error) console.warn('[vip.loadProfile.person_id]', error.message);
    row = (data as VipProfileRow | null) ?? null;
    if (row) matchPath = 'person_id';
  }

  if (!row && args.displayName) {
    // First: case-insensitive exact match via ilike-without-wildcard
    const { data: exact, error: exactErr } = await sb
      .from('vip_profiles')
      .select('*')
      .ilike('display_name', args.displayName)
      .neq('demo_tier', 'standard')
      .maybeSingle();
    if (exactErr) console.warn('[vip.loadProfile.displayName_exact]', exactErr.message);
    row = (exact as VipProfileRow | null) ?? null;
    if (row) matchPath = 'display_name_exact';

    // Fallback: first-name + last-name fuzzy match. Handles "Prat Kumar
    // Vemana" (Clerk) against "Prat Vemana" (vip seed) by matching
    // on the first + last tokens.
    if (!row) {
      const tokens = args.displayName.trim().split(/\s+/).filter((t) => t.length > 0);
      if (tokens.length >= 2) {
        const first = tokens[0];
        const last = tokens[tokens.length - 1];
        const { data: fuzzy, error: fuzzyErr } = await sb
          .from('vip_profiles')
          .select('*')
          .ilike('display_name', `${first}%${last}`)
          .neq('demo_tier', 'standard')
          .maybeSingle();
        if (fuzzyErr) console.warn('[vip.loadProfile.displayName_ilike]', fuzzyErr.message);
        row = (fuzzy as VipProfileRow | null) ?? null;
        if (row) matchPath = 'display_name_ilike';
      }
    }
  }

  if (process.env.VIP_DEBUG === '1') {
    console.log('[vip.loadProfile]', {
      personId: args.personId ?? null,
      displayName: args.displayName ?? null,
      matchPath,
      matched: !!row,
      matched_name: row?.display_name ?? null,
      demo_tier: row?.demo_tier ?? null,
    });
  }

  return row;
}

function formatScale(scale: Record<string, unknown> | null | undefined): string {
  if (!scale) return '';
  const parts: string[] = [];
  if (typeof scale.revenue_usd === 'number') parts.push(`$${(scale.revenue_usd / 1_000_000_000).toFixed(1)}B revenue`);
  if (typeof scale.employees === 'number') parts.push(`${(scale.employees / 1000).toFixed(0)}K employees`);
  if (typeof scale.fortune_rank === 'number') parts.push(`Fortune ${scale.fortune_rank}`);
  return parts.join(' · ');
}

function formatCareer(history: CareerRole[] | null, maxRoles = 4): string {
  if (!history || history.length === 0) return '';
  const roles = history.slice(0, maxRoles);
  return roles
    .map((r) => {
      const period = r.start && r.end ? ` (${r.start}–${r.end})` : r.start && !r.end ? ` (${r.start}–present)` : '';
      return `${r.role ?? 'Role'} at ${r.company ?? 'Company'}${period}`;
    })
    .join(' · ');
}

function formatStyle(style: Record<string, unknown> | null): string {
  if (!style) return '';
  const parts: string[] = [];
  if (typeof style.pace === 'string') parts.push(`pace: ${style.pace}`);
  if (typeof style.detail_level === 'string') parts.push(`detail: ${style.detail_level}`);
  if (typeof style.attention_span === 'string') parts.push(`attention: ${style.attention_span}`);
  if (typeof style.preference === 'string') parts.push(`preference: ${style.preference}`);
  return parts.join(' · ');
}

export async function assembleUserContextBlock(args: UserProfileArgs): Promise<string> {
  const profile = await loadProfile(args);
  if (!profile) return '';

  const lines: string[] = [];
  lines.push(`USER CONTEXT · ${profile.display_name} · ${profile.demo_tier.toUpperCase()} tier`);
  if (profile.current_title && profile.current_company) {
    const scale = formatScale(profile.current_company_scale);
    lines.push(`Role · ${profile.current_title} at ${profile.current_company}${scale ? ` (${scale})` : ''}`);
  }

  const career = formatCareer(profile.career_history);
  if (career) lines.push(`Background · ${career}`);

  if (profile.current_initiatives && profile.current_initiatives.length > 0) {
    lines.push(`Current focus · ${profile.current_initiatives.join(' · ')}`);
  }

  if (profile.areas_of_expertise && profile.areas_of_expertise.length > 0) {
    lines.push(`Expertise · ${profile.areas_of_expertise.join(', ')}`);
  }

  const orgContext: string[] = [];
  if (profile.company_principles && profile.company_principles.length > 0) {
    orgContext.push(profile.company_principles.join(' · '));
  }
  if (profile.labor_model) orgContext.push(`Labor model: ${profile.labor_model}`);
  if (profile.cloud_posture) orgContext.push(`Cloud: ${profile.cloud_posture}`);
  if (orgContext.length > 0) lines.push(`Org context · ${orgContext.join(' · ')}`);

  const style = formatStyle(profile.communication_style);
  if (style) lines.push(`Style · ${style}${profile.builder_vs_buyer ? ` · ${profile.builder_vs_buyer} mindset` : ''}`);

  if (profile.known_concerns && profile.known_concerns.length > 0) {
    lines.push(`Known concerns · ${profile.known_concerns.slice(0, 4).join(' · ')}`);
  }

  if (profile.emphasize_topics && profile.emphasize_topics.length > 0) {
    lines.push(`Emphasize · ${profile.emphasize_topics.join(' · ')}`);
  }

  if (profile.avoid_topics && profile.avoid_topics.length > 0) {
    lines.push(`Avoid · ${profile.avoid_topics.join(' · ')}`);
  }

  lines.push('');
  lines.push(
    'Use this context naturally. Calibrate substance, pace, and framing to who they are. ' +
      'Do not fawn or recite facts back. Reference shared history or their concerns only when the current turn calls for it.',
  );

  return lines.join('\n');
}
