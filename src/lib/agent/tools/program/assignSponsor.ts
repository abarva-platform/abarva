// assign_sponsor tool
//
// Lists an engagement participant as a sponsor progress contact. The role
// does not grant approval authority; authorized workspace users approve gates.
//
// engagement_participants has no UNIQUE constraint on (engagement_id, user_id)
// so we check-then-update/insert rather than using upsert().

import type { AgentTool, ToolResult } from '../registry';
import { registerTool } from '../registry';
import { requireTenancy, TenancyError } from '@/app/api/v1/programs/_auth';
import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import { getProgramById } from '@/lib/programs/queries';
import { loadUserProgramAccessPolicy } from '@/lib/auth/program-access-policy';

interface AssignSponsorInput {
  program_id: string;
  person_id: string;
  person_name?: string;
  notes?: string;
  send_progress_emails?: boolean;
}

export const assignSponsorTool: AgentTool<AssignSponsorInput> = {
  name: 'assign_sponsor',
  description:
    'List a person as a sponsor progress contact. This satisfies the sponsor_assigned contact criterion. ' +
    'It does not grant approval authority; only an authorized workspace user records product approvals. ' +
    'Use this only after the user explicitly confirms that this person should be listed. ' +
    'Progress email delivery is off unless send_progress_emails is explicitly true. ' +
    'person_id must be a UUID from the persons table — use lookup_person first if needed. ' +
    'A sponsor contact is read-only in the Move; explicit client-level workspace permissions remain separate.',
  surfaces: ['/programs/:id'],
  input_schema: {
    type: 'object',
    properties: {
      program_id: { type: 'string', description: 'Engagement UUID.' },
      person_id: {
        type: 'string',
        description:
          'UUID of the person to assign as sponsor. Use lookup_person to resolve names.',
      },
      person_name: {
        type: 'string',
        description:
          'Full name of the person (used for display). Resolved via lookup_person.',
      },
      notes: {
        type: 'string',
        description: 'Optional context for the assignment.',
      },
      send_progress_emails: {
        type: 'boolean',
        description:
          'Whether this contact should receive informational phase-progress emails. Defaults to false.',
      },
    },
    required: ['program_id', 'person_id'],
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
          recovery: 'Session issue — sign back in and retry.',
        };
      }
      throw err;
    }

    const program = await getProgramById(tenancy, input.program_id);
    if (!program) {
      return {
        success: false,
        error: 'program_not_found',
        recovery:
          'The Move was not found in the active workspace. Refresh the workspace and try again.',
      };
    }

    const accessPolicy = await loadUserProgramAccessPolicy(tenancy, {
      programId: input.program_id,
    });
    if (
      (!accessPolicy.canApproveGates && !accessPolicy.canAdminUsers) ||
      (Array.isArray(accessPolicy.programIdsAllowed) &&
        !accessPolicy.programIdsAllowed.includes(input.program_id))
    ) {
      return {
        success: false,
        error: 'forbidden:authorized_workspace_user_required',
        recovery:
          'Only an authorized workspace user can manage this Move contact.',
      };
    }

    const sb = getAzureWriteFluentClient();

    // Check if this person is already a participant
    const { data: existing } = await sb
      .from('engagement_participants')
      .select('id, approval_authority')
      .eq('engagement_id', input.program_id)
      .eq('user_id', input.person_id)
      .maybeSingle();

    const contactPayload = {
      role: 'Sponsor',
      notify_on: input.send_progress_emails === true ? ['phase_gate'] : [],
      approval_authority: 'contributor',
      program_access_level: 'program_viewer',
      can_view_financial: false,
      can_upload: false,
      can_generate_deliverables: false,
      can_publish_deliverables: false,
      can_approve_phase_gates: false,
    };
    const legacyContactPayload = {
      role: contactPayload.role,
      notify_on: contactPayload.notify_on,
      approval_authority: contactPayload.approval_authority,
    };

    let writeResult;
    if (existing) {
      writeResult = await sb
        .from('engagement_participants')
        .update(contactPayload)
        .eq('id', (existing as { id: string }).id);
    } else {
      writeResult = await sb.from('engagement_participants').insert({
        engagement_id: input.program_id,
        user_id: input.person_id,
        user_name: input.person_name ?? input.person_id,
        ...contactPayload,
      });
    }

    if (
      writeResult.error &&
      /program_access_level|can_view_financial|can_upload|can_generate_deliverables|can_publish_deliverables|can_approve_phase_gates/i.test(
        writeResult.error.message,
      )
    ) {
      if (existing) {
        writeResult = await sb
          .from('engagement_participants')
          .update(legacyContactPayload)
          .eq('id', (existing as { id: string }).id);
      } else {
        writeResult = await sb.from('engagement_participants').insert({
          engagement_id: input.program_id,
          user_id: input.person_id,
          user_name: input.person_name ?? input.person_id,
          ...legacyContactPayload,
        });
      }
    }

    if (writeResult.error) {
      return {
        success: false,
        error: `sponsor_assign_failed: ${writeResult.error.message}`,
        recovery: 'Database write failed — want me to retry?',
      };
    }

    return {
      success: true,
      data: {
        program_id: input.program_id,
        person_id: input.person_id,
        role: 'Sponsor progress contact; no Nexus approval authority',
        approval_authority: 'contributor',
      },
    };
  },
};

registerTool(assignSponsorTool);
