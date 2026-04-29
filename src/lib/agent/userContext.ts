// userContext · F0.2 of Programs Strict Completion v1.2
//
// Layer-0 of the four-layer reasoning protocol (kickoff §4 F0.2). Every
// agent route composes the context block returned by `getUserContext()`
// AFTER its role/voice line and BEFORE knowledge/task content, so the
// agent always knows who it's talking to.
//
// `recentActivity` is intentionally NOT in scope for this kickoff (no
// user-activity log exists in the schema; building it would violate the
// schema-without-data anti-pattern in §13).

import { getCurrentPerson } from '@/lib/auth/maestro';
import { getActiveClientRow } from '@/lib/active-client';
import { getServerSupabase } from '@/lib/supabase-server';
import { PHASE_LABEL_MAP } from '@/lib/programs/programs-fixture';
import type { ProgramPhaseId } from '@/lib/programs/programs-types';

export interface SponsorshipEntry {
  /** Stable identifier — graph_node_id when present, else the engagement primary key. */
  programId: string;
  /** Human-readable program name. */
  programName: string;
  /** Phase label (e.g., "Discovery", "Build"). */
  currentPhase: string;
  /** Sponsorship role in this program. */
  relation: 'sponsor' | 'co_sponsor';
}

export interface UserContext {
  /** First name extracted from `persons.name`. Always non-empty. */
  firstName: string;
  /** Full name from `persons.name`. */
  fullName: string;
  /** Role from `persons.role`, or 'unspecified' when absent. */
  role: string;
  /** Active client (tenant) id. */
  tenantId: string;
  /** Active client display name. */
  tenantDisplayName: string;
  /** Programs where the user is the named sponsor or co-sponsor in the active tenant. */
  sponsorshipHistory: SponsorshipEntry[];
}

function deriveFirstName(name: string | null | undefined): string {
  const cleaned = (name ?? '').trim();
  if (!cleaned) return 'there';
  const first = cleaned.split(/\s+/)[0];
  return first || cleaned;
}

function phaseLabel(phase: number | null | undefined): string {
  if (phase === null || phase === undefined) return 'unknown phase';
  if (phase >= 0 && phase <= 6) {
    return PHASE_LABEL_MAP[phase as ProgramPhaseId] ?? `Phase ${phase}`;
  }
  return `Phase ${phase}`;
}

/**
 * Resolves the current request's user + tenant + sponsorship into a
 * UserContext, or returns null if the request is unauthenticated or
 * has no active client.
 *
 * Designed to be called at the entry of every agent route that makes
 * an LLM call. Per kickoff §4 F0.2 this applies to ALL 8 routes (4
 * interactive + 4 synthesis).
 */
export async function getUserContext(): Promise<UserContext | null> {
  const person = await getCurrentPerson();
  if (!person) return null;
  const client = await getActiveClientRow();
  if (!client) return null;

  const sb = getServerSupabase();
  const { data: rows, error } = await sb
    .from('engagements')
    .select(
      'id, graph_node_id, name, current_phase, sponsor_person_id, co_sponsor_person_id',
    )
    .eq('client_id', client.id)
    .or(
      `sponsor_person_id.eq.${person.id},co_sponsor_person_id.eq.${person.id}`,
    );

  const sponsorshipHistory: SponsorshipEntry[] =
    error || !rows
      ? []
      : (rows as Array<{
          id: string;
          graph_node_id: string | null;
          name: string;
          current_phase: number | null;
          sponsor_person_id: string | null;
          co_sponsor_person_id: string | null;
        }>).map((row) => ({
          programId: row.graph_node_id ?? row.id,
          programName: row.name,
          currentPhase: phaseLabel(row.current_phase),
          relation:
            row.sponsor_person_id === person.id ? 'sponsor' : 'co_sponsor',
        }));

  return {
    firstName: deriveFirstName(person.name),
    fullName: person.name ?? deriveFirstName(person.name),
    role: person.role ?? 'unspecified role',
    tenantId: client.id,
    tenantDisplayName: client.name,
    sponsorshipHistory,
  };
}

/**
 * Renders a UserContext into the Layer-0 block that gets composed into
 * agent system prompts. Pure function so callers can compose it
 * deterministically and tests can pin its shape.
 */
export function formatUserContextBlock(ctx: UserContext): string {
  const lines: string[] = [];
  lines.push('USER CONTEXT (highest priority — Layer 0):');
  lines.push(
    `You are speaking with ${ctx.fullName} (${ctx.role} at ${ctx.tenantDisplayName}).`,
  );

  if (ctx.sponsorshipHistory.length > 0) {
    lines.push('');
    lines.push(`${ctx.firstName}'s sponsorship history:`);
    for (const entry of ctx.sponsorshipHistory) {
      const rel = entry.relation === 'sponsor' ? 'sponsor' : 'co-sponsor';
      lines.push(`- ${entry.programName} (${entry.currentPhase}) — you are ${rel}`);
    }
  }

  lines.push('');
  lines.push(
    `Address ${ctx.firstName} by name in greetings and when contextually appropriate. ` +
      `Reference his/her role lens when framing responses. ` +
      `Acknowledge prior sponsorships when relevant.`,
  );

  return lines.join('\n');
}

/**
 * Convenience: resolve user context and format the prompt block in one
 * call. Returns an empty string when the user is unauthenticated or has
 * no active client (so the caller can safely concatenate without a
 * conditional). Returns the trailing newline so callers can compose
 * directly.
 */
export async function getUserContextPromptBlock(): Promise<string> {
  const ctx = await getUserContext();
  if (!ctx) return '';
  return `${formatUserContextBlock(ctx)}\n\n`;
}
