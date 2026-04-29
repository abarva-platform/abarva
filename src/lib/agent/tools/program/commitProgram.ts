// commit_program tool · F0.4 first tool, used by Surface 1 (/programs/new)
//
// When the user confirms the program brief Steward has assembled, the
// agent emits a tool_use block with the structured fields. The route
// invokes this handler, which calls into the existing program-creation
// path (originateProgram). Only after the DB write returns does the
// agent generate the success-confirmation message — this is the
// architectural mechanism that makes "Registered ✅ but DB write
// failed" structurally impossible.
//
// Per kickoff §4 F0.4: surfaces = ['/programs/new', '/demo/programs/new'].

import type { AgentTool, ToolResult } from '../registry';
import { registerTool } from '../registry';
import { requireTenancy, TenancyError } from '@/app/api/v1/programs/_auth';
import { originateProgram } from '@/lib/programs/mutations';
import type { ArchetypeKey, OriginationForm } from '@/lib/programs/types.ui';
import type { OriginSource } from '@/lib/programs/types.db';
import { getServerSupabase } from '@/lib/supabase-server';

// Postgres UUID v4 format (also matches v1/v3/v5 — sufficient for input
// validation before we attempt an `engagements.insert` that would
// otherwise throw an opaque uuid-cast error.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface CommitProgramInput {
  program_name: string;
  problem_statement: string;
  target_outcome?: string;
  timeline?: string;
  sponsor_person_id: string;
  lead_person_id?: string;
  classification?: ArchetypeKey | null;
  matched_pattern_id?: string;
}

export const commitProgramTool: AgentTool<CommitProgramInput> = {
  name: 'commit_program',
  description:
    'Persist a new program to the database after the user has explicitly confirmed the program brief. ' +
    'Returns the program id on success. Call this only after the user says yes to your "Shall I register?" ' +
    'question — never speculatively. ' +
    'IMPORTANT: sponsor_person_id and lead_person_id MUST be UUIDs from the persons table. ' +
    'If the user has named a role ("CIO") or a person ("Lin Martinez") without giving you a UUID, ' +
    'call the `lookup_person` tool FIRST to resolve them — do NOT ask the user to paste a UUID themselves. ' +
    'The seeded persons table for the active tenant has leadership records you can resolve against. Only ' +
    'after lookup_person returns a match should you call commit_program with the resulting person_id. ' +
    "DEFAULTING THE LEAD: when the user has named a sponsor but not a separate lead, ASK 'is " +
    "<sponsor name> also the day-to-day lead, or someone else?' If the user confirms or doesn't " +
    'name a separate lead after asking, default lead_person_id to the same UUID as sponsor_person_id. ' +
    'Most small programs have one person owning both roles; do not stall the flow because the user ' +
    "hasn't explicitly named a lead. " +
    'If this returns failure, report the failure honestly with recovery options; do not announce success.',
  surfaces: ['/programs/new', '/demo/programs/new'],
  input_schema: {
    type: 'object',
    properties: {
      program_name: {
        type: 'string',
        description: 'The program name as confirmed by the user.',
      },
      problem_statement: {
        type: 'string',
        description: 'The use case / problem statement, as a natural-language paragraph.',
      },
      target_outcome: {
        type: 'string',
        description: 'The target outcome the user committed to (optional but encouraged).',
      },
      timeline: {
        type: 'string',
        description: 'Free-form timeline hint (e.g., "9 months", "BAFO by May").',
      },
      sponsor_person_id: {
        type: 'string',
        description:
          'UUID from persons table for the named program sponsor. If the user said a role ' +
          '("CIO") or a name without a UUID, call lookup_person FIRST to resolve them — do not ' +
          'ask the user to paste a UUID.',
      },
      lead_person_id: {
        type: 'string',
        description:
          'UUID from persons table for the program lead. Same rules as sponsor_person_id — ' +
          'use lookup_person to resolve roles or names into UUIDs before calling commit_program.',
      },
      classification: {
        type: 'string',
        description:
          'Archetype classification (e.g., AMS_CONSOLIDATION, CDP). Pass null when unsure.',
      },
      matched_pattern_id: {
        type: 'string',
        description: 'Pattern key matched during classification (e.g., PAT-PRG-AMS-CONSOLIDATION-001).',
      },
    },
    required: ['program_name', 'problem_statement', 'sponsor_person_id'],
  },
  handler: async (input, ctx): Promise<ToolResult> => {
    // Pre-flight: validate UUID-shaped person ids BEFORE we attempt the
    // DB write. Without this the agent's first failure surface is an
    // opaque "invalid input syntax for type uuid: 'CTO'" Postgres
    // error, which Steward then translates to a generic "write error"
    // — not actionable for the user. Catching it here lets Steward
    // recover by asking for the actual person.
    if (!UUID_RE.test(input.sponsor_person_id.trim())) {
      return {
        success: false,
        error: `invalid_sponsor_person_id: "${input.sponsor_person_id}" is not a person id`,
        recovery:
          `I need the named sponsor as an actual person, not a role like "${input.sponsor_person_id}". ` +
          'Who specifically should own this — full name? (Ideally with their persons.id from your team list, ' +
          'but a name is a start; we can resolve from there.)',
      };
    }
    if (input.lead_person_id && !UUID_RE.test(input.lead_person_id.trim())) {
      return {
        success: false,
        error: `invalid_lead_person_id: "${input.lead_person_id}" is not a person id`,
        recovery:
          `Same issue with the program lead — "${input.lead_person_id}" is a role, not a person. ` +
          "Who's leading day-to-day? If it's the sponsor, I can default to that.",
      };
    }

    let tenancy;
    try {
      tenancy = await requireTenancy();
    } catch (err) {
      if (err instanceof TenancyError) {
        return {
          success: false,
          error: `auth:${err.code}`,
          recovery:
            err.code === 'unauthenticated'
              ? "Your session expired. Want me to take you back to sign-in, then we'll register the program?"
              : "There's no active client on this session. Set the active client and I'll try again.",
        };
      }
      throw err;
    }

    const originationForm: OriginationForm = {
      name: input.program_name,
      useCase: input.problem_statement,
      targetOutcome: input.target_outcome ?? '',
      sponsorPersonId: input.sponsor_person_id,
      leadPersonId: input.lead_person_id ?? input.sponsor_person_id,
    };

    // Idempotency guard: if a program with the same name was created
    // for this client in the last 5 minutes, return that one instead
    // of inserting a duplicate. Defends against double-click on
    // confirm, network retry, or the agent calling commit_program
    // twice in the same conversation.
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString();
      const sb = getServerSupabase();
      const { data: existing } = await sb
        .from('engagements')
        .select('id, name, graph_node_id, created_at')
        .eq('client_id', tenancy.clientId)
        .eq('name', originationForm.name)
        .gte('created_at', fiveMinutesAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing) {
        const row = existing as { id: string; name: string };
        ctx.writer?.write(`\n[[program-created:${row.id}]]`);
        return {
          success: true,
          data: {
            program_id: row.id,
            program_name: row.name,
            redirect_to: `/programs/${row.id}`,
            surface: ctx.surface,
            idempotent_replay: true,
          },
        };
      }
    } catch {
      // If the idempotency lookup itself fails, fall through to the
      // normal insert path. Safer to risk a duplicate than to block
      // a legitimate registration on a transient lookup error.
    }

    try {
      const program = await originateProgram(tenancy, {
        name: originationForm.name,
        useCase: originationForm.useCase,
        archetype: input.classification ?? null,
        originSource: 'maestro_console' as OriginSource,
        originSourceRef: null,
        acceptedPatternKey: input.matched_pattern_id ?? null,
        sponsorUserId: originationForm.sponsorPersonId,
        leadUserId: originationForm.leadPersonId,
      });

      // Surface 1 navigation sentinel: tell the client the program is
      // ready to be navigated to. Agent-authored confirmation text still
      // streams normally; this sentinel is stripped client-side before
      // display (StewardChat scrubs the regex).
      ctx.writer?.write(`\n[[program-created:${program.id}]]`);

      return {
        success: true,
        data: {
          program_id: program.id,
          program_name: program.name,
          redirect_to: `/programs/${program.id}`,
          surface: ctx.surface,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: `originate_failed: ${message}`,
        recovery:
          "Couldn't write the program to the database — the API returned an error. " +
          'Want me to retry, or do you want me to capture this as a draft for review?',
      };
    }
  },
};

// Self-register on first import. Routes import this module at startup
// (chat/agent route) so the tool is available when the surface matches.
registerTool(commitProgramTool);
