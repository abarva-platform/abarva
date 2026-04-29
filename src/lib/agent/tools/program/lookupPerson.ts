// lookup_person tool · Surface 1 PR2.2
//
// Lets Steward resolve role titles or names into actual persons.id
// UUIDs by querying the seeded persons table for the active client.
// Closes the dead-end Anand hit during the live walkthrough where
// Steward asked the user to paste UUIDs because it had no way to
// look them up.
//
// Scoping: persons table has no client_id FK — persons are global
// records linked to tenants via the `organization` string field.
// We match `persons.organization` against the active client's name
// (case-insensitive partial), then narrow by role/name query.
//
// Per kickoff §4 surface filter: surfaces = ['/programs/new',
// '/demo/programs/new']. Other surfaces will adopt as they ship.

import type { AgentTool, ToolResult } from '../registry';
import { registerTool } from '../registry';
import { requireTenancy, TenancyError } from '@/app/api/v1/programs/_auth';
import { getActiveClientRow } from '@/lib/active-client';
import { getServerSupabase } from '@/lib/supabase-server';

interface LookupPersonInput {
  /** Free-form query — name, role title (e.g. "CIO"), or both. */
  query: string;
  /** Optional hint for downstream callers; doesn't affect filtering. */
  context?: string;
}

interface PersonMatch {
  person_id: string;
  name: string;
  role: string | null;
  organization: string | null;
  email: string | null;
}

const MAX_MATCHES = 8;

export const lookupPersonTool: AgentTool<LookupPersonInput> = {
  name: 'lookup_person',
  description:
    'Resolve a role title or person name (e.g. "CIO", "Lin Martinez", "VP of Applications") ' +
    'into matching persons in the active tenant. Returns a list of {person_id, name, role, ' +
    'organization, email} matches. ' +
    'CALL THIS PROACTIVELY: as soon as the user mentions a role or a person — even mid-sentence ' +
    "— look them up. Don't ask 'who is your CIO?' — call lookup_person({query:'CIO'}) and tell " +
    "the user what you found. e.g. 'I see Martin Steward as CIO at Meridian — confirming him as " +
    "sponsor?'. Only ask the user for clarification if the lookup returns zero or ambiguous results. " +
    'If exactly one match comes back, propose using it. If multiple, ask the user to pick. ' +
    'If zero, tell the user no match was found and offer to register them as a placeholder ' +
    '(via register_placeholder_person) so the program flow can continue.',
  surfaces: ['/programs/new', '/demo/programs/new'],
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'The role title or name the user said. Examples: "CIO", "VP of Applications", ' +
          '"Lin Martinez", "Chief Information Officer". Free-form; the tool will match ' +
          'against the persons table.',
      },
      context: {
        type: 'string',
        description:
          "Optional context for what role this person plays in the program (e.g. 'sponsor', " +
          "'lead'). Doesn't affect filtering — just helps the agent reason about which match to use.",
      },
    },
    required: ['query'],
  },
  handler: async (input): Promise<ToolResult> => {
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
              ? "I can't look people up — your session expired. Want to sign back in?"
              : "I can't look people up — there's no active client on this session.",
        };
      }
      throw err;
    }

    const client = await getActiveClientRow();
    if (!client) {
      return {
        success: false,
        error: 'no_active_client',
        recovery: "I can't tell which tenant to look people up in. Set the active client and try again.",
      };
    }

    const sb = getServerSupabase();
    const queryRaw = input.query.trim();
    if (!queryRaw) {
      return {
        success: false,
        error: 'empty_query',
        recovery: 'I need a name or role to search for. Who should I look up?',
      };
    }

    // Light-touch query normalization: strip filler words so a query
    // like "the CIO" still hits a row whose role is "CIO".
    const stripped = queryRaw.replace(/^(the|our|my|a|an)\s+/i, '');
    const lower = stripped.toLowerCase();

    // Ilike pattern with both word and word-bounded variants. We OR
    // across name, role, and email so a single query can resolve
    // a name, a title, or an email.
    const pattern = `%${lower}%`;
    const { data, error } = await sb
      .from('persons')
      .select('id, name, role, organization, email')
      .or(`name.ilike.${pattern},role.ilike.${pattern},email.ilike.${pattern}`)
      .limit(50);

    if (error) {
      return {
        success: false,
        error: `lookup_failed: ${error.message}`,
        recovery: "Couldn't query the persons table. Want me to try again, or capture this as a placeholder?",
      };
    }

    type Row = {
      id: string;
      name: string;
      role: string | null;
      organization: string | null;
      email: string | null;
    };

    const allRows = (data ?? []) as Row[];

    // Scope by tenant: prefer rows whose organization matches the
    // active client's name (case-insensitive contains either way).
    const clientName = client.name.toLowerCase();
    const inTenant = allRows.filter((row) => {
      const org = (row.organization ?? '').toLowerCase();
      if (!org) return false;
      return org.includes(clientName) || clientName.includes(org);
    });

    // If we got tenant matches, use those. Otherwise fall back to
    // global matches so Steward can still surface candidates the user
    // can confirm or reject (and tell the user the org didn't match).
    const matches: PersonMatch[] = (inTenant.length > 0 ? inTenant : allRows)
      .slice(0, MAX_MATCHES)
      .map((row) => ({
        person_id: row.id,
        name: row.name,
        role: row.role,
        organization: row.organization,
        email: row.email,
      }));

    return {
      success: true,
      data: {
        query: queryRaw,
        tenant_id: tenancy.clientId,
        tenant_name: client.name,
        matches,
        match_count: matches.length,
        scoped_to_tenant: inTenant.length > 0,
      },
    };
  },
};

registerTool(lookupPersonTool);
