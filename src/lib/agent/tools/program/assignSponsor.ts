// assign_sponsor tool
//
// Inserts or updates an engagement_participants row with
// approval_authority='sponsor'. Satisfies the sponsor_assigned gate
// check (hard gate for P2→P3).
//
// engagement_participants has no UNIQUE constraint on (engagement_id, user_id)
// so we check-then-update/insert rather than using upsert().

import type { AgentTool, ToolResult } from '../registry';
import { registerTool } from '../registry';
import { requireTenancy, TenancyError } from '@/app/api/v1/programs/_auth';
import { getServerSupabase } from '@/lib/supabase-server';

interface AssignSponsorInput {
  program_id: string;
  person_id: string;
  person_name?: string;
  notes?: string;
}

export const assignSponsorTool: AgentTool<AssignSponsorInput> = {
  name: 'assign_sponsor',
  description:
    'Assign a person as program sponsor. This satisfies the sponsor_assigned hard gate ' +
    'required before advancing from Phase 2 to Phase 3. ' +
    'person_id must be a UUID from the persons table — use lookup_person first if needed. ' +
    'If the person is already a participant, their authority is upgraded to sponsor.',
  surfaces: ['/programs/:id'],
  input_schema: {
    type: 'object',
    properties: {
      program_id: { type: 'string', description: 'Engagement UUID.' },
      person_id: {
        type: 'string',
        description: 'UUID of the person to assign as sponsor. Use lookup_person to resolve names.',
      },
      person_name: {
        type: 'string',
        description: 'Full name of the person (used for display). Resolved via lookup_person.',
      },
      notes: { type: 'string', description: 'Optional context for the assignment.' },
    },
    required: ['program_id', 'person_id'],
  },
  handler: async (input, ctx): Promise<ToolResult> => {
    let tenancy;
    try {
      tenancy = await requireTenancy();
    } catch (err) {
      if (err instanceof TenancyError) {
        return {
          success: false,
          error: `auth:${err.code}`,
          recovery: 'Session issue — sign back in and retry.',
        };
      }
      throw err;
    }

    const sb = getServerSupabase();

    // Check if this person is already a participant
    const { data: existing } = await sb
      .from('engagement_participants')
      .select('id, approval_authority')
      .eq('engagement_id', input.program_id)
      .eq('user_id', input.person_id)
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await sb
        .from('engagement_participants')
        .update({ approval_authority: 'sponsor' })
        .eq('id', (existing as { id: string }).id));
    } else {
      ({ error } = await sb
        .from('engagement_participants')
        .insert({
          engagement_id: input.program_id,
          user_id: input.person_id,
          user_name: input.person_name ?? input.person_id,
          role: 'sponsor',
          approval_authority: 'sponsor',
        }));
    }

    if (error) {
      return {
        success: false,
        error: `sponsor_assign_failed: ${error.message}`,
        recovery: 'Database write failed — want me to retry?',
      };
    }

    void ctx;
    void tenancy;
    return {
      success: true,
      data: {
        program_id: input.program_id,
        person_id: input.person_id,
        approval_authority: 'sponsor',
      },
    };
  },
};

registerTool(assignSponsorTool);
