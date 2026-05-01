// register_placeholder_person tool · Surface 1 PR2.3
//
// Unblocks the origination flow when the user names a sponsor or lead
// who isn't seeded in the persons table for the active tenant. Steward
// would otherwise stall asking for a UUID; with this tool, Steward can
// register a placeholder person, get a real UUID, and proceed with
// commit_program. Admin tools later resolve the placeholder to a
// fully-detailed persons row (email, links to graph, etc.).
//
// Convention used to mark placeholders so admin UI can list them:
//   personal_threads = ['origination_placeholder']
//
// No schema migration — `personal_threads` is an existing TEXT[] column
// already on persons. Per-tenant scoping uses `organization` (string),
// matching the pattern used by lookup_person.
//
// Per canvas-continuity doctrine, origination can run in the main
// portal canvas as well as the dedicated /programs/new page. Do not
// force a route change just to register a sponsor placeholder.

import type { AgentTool, ToolResult } from '../registry';
import { registerTool } from '../registry';
import { requireTenancy, TenancyError } from '@/app/api/v1/programs/_auth';
import { getActiveClientRow } from '@/lib/active-client';
import { getServerSupabase } from '@/lib/supabase-server';

interface RegisterPlaceholderPersonInput {
  /** Full name of the placeholder person, e.g. "Martin Steward". */
  name: string;
  /** Their role / title in the org, e.g. "CIO", "VP of Applications". */
  role?: string;
  /**
   * Optional override for the person's organization. Defaults to the
   * active client's display name. Override is rare — it exists for
   * the case where the user names a sponsor from a partner org.
   */
  organization?: string;
}

const PLACEHOLDER_MARKER = 'origination_placeholder';

export const registerPlaceholderPersonTool: AgentTool<RegisterPlaceholderPersonInput> = {
  name: 'register_placeholder_person',
  description:
    'Create a placeholder person record when the user names a sponsor or lead who is NOT in ' +
    'the persons table yet. Returns an internal person record id you can use in commit_program. ' +
    'Do not mention that id, UUIDs, or database mechanics in user-facing prose. The placeholder ' +
    'is marked for admin follow-up (admins resolve full details — email, links, etc. — later). ' +
    'Call this only AFTER lookup_person returns no match AND the user has confirmed they want ' +
    "to register a placeholder. Don't call this speculatively; always confirm with the user first.",
  surfaces: ['/programs/new', '/demo/programs/new', '/home', '/programs'],
  input_schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: "Full name as the user said it. e.g. 'Martin Steward', 'James Walker'.",
      },
      role: {
        type: 'string',
        description:
          "The person's role or title in the organization. e.g. 'CIO', 'VP of Applications', " +
          "'Chief Information Officer'. Optional but strongly encouraged so admin can resolve later.",
      },
      organization: {
        type: 'string',
        description:
          "Optional override for the person's organization. Defaults to the active client. " +
          'Override only when the person belongs to a partner / vendor org distinct from the tenant.',
      },
    },
    required: ['name'],
  },
  handler: async (input): Promise<ToolResult> => {
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      return {
        success: false,
        error: 'empty_name',
        recovery: 'I need a full name to register a placeholder. Who is this person?',
      };
    }

    // Require tenancy (auth + active client) before writing — the
    // returned ctx isn't read directly because we use getActiveClientRow
    // for the organization default below, but requireTenancy is the
    // gate that throws when the session is invalid.
    try {
      await requireTenancy();
    } catch (err) {
      if (err instanceof TenancyError) {
        return {
          success: false,
          error: `auth:${err.code}`,
          recovery:
            err.code === 'unauthenticated'
              ? "I can't register the placeholder — your session expired. Want to sign back in?"
              : "I can't register the placeholder — there's no active client on this session.",
        };
      }
      throw err;
    }

    const client = await getActiveClientRow();
    if (!client) {
      return {
        success: false,
        error: 'no_active_client',
        recovery: "I can't tell which tenant to register the placeholder under. Set the active client and try again.",
      };
    }

    const organization = (input.organization ?? client.name).trim();
    const role = input.role?.trim() || null;

    const sb = getServerSupabase();
    const { data, error } = await sb
      .from('persons')
      .insert({
        name: trimmedName,
        email: null,
        role,
        organization,
        familiarity: 'first_meeting',
        personal_threads: [PLACEHOLDER_MARKER],
      })
      .select('id, name, role, organization')
      .single();

    if (error || !data) {
      return {
        success: false,
        error: `register_failed: ${error?.message ?? 'unknown'}`,
        recovery:
          "Couldn't register the placeholder — the persons table refused the write. Want me " +
          'to retry, or escalate this to admin to set up directly?',
      };
    }

    return {
      success: true,
      data: {
        person_id: (data as { id: string }).id,
        name: trimmedName,
        role,
        organization,
        placeholder: true,
        admin_resolution_pending: true,
        marker: PLACEHOLDER_MARKER,
      },
    };
  },
};

registerTool(registerPlaceholderPersonTool);
