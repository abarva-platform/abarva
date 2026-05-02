// complete_program tool
//
// Closes a program by setting lifecycle_state='completed' and
// current_phase=6 on the engagements row. Called after P6 Tower Handoff
// setup is complete and the user has confirmed the handoff can be closed.
//
// Emits a program-phase-changed artifact (phase 6) so the UI refreshes
// in place — same mechanism as advance_phase.

import type { AgentTool, ToolResult } from '../registry';
import { registerTool } from '../registry';
import { requireTenancy, TenancyError } from '@/app/api/v1/programs/_auth';
import { getServerSupabase } from '@/lib/supabase-server';
import { writeProgramAuditLogBestEffort } from '@/lib/programs/audit-log';

interface CompleteProgramInput {
  program_id: string;
  completion_notes?: string;
}

export const completeProgramTool: AgentTool<CompleteProgramInput> = {
  name: 'complete_program',
  description:
    'Mark a program as fully complete (lifecycle_state = completed, current_phase = 6). ' +
    'Use this at P6 Tower Handoff after the Tower execution tracking contract / handoff package is ' +
    'saved and signed off, the external execution owner is named, monitoring feeds and thresholds are ' +
    'defined, and the user explicitly asks to complete P6 setup or close the handoff. This is not a ' +
    'phase advance: execution remains outside AbarVa and Tower observes. Emits a refresh artifact so ' +
    'the UI updates without a full reload.',
  surfaces: ['/programs/:id'],
  input_schema: {
    type: 'object',
    properties: {
      program_id: { type: 'string', description: 'Engagement UUID.' },
      completion_notes: { type: 'string', description: 'Optional closing notes to record.' },
    },
    required: ['program_id'],
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
    const now = new Date().toISOString();

    const { error } = await sb
      .from('engagements')
      .update({
        lifecycle_state: 'completed',
        current_phase: 6,
        updated_at: now,
      })
      .eq('id', input.program_id)
      .eq('client_id', tenancy.clientId);

    if (error) {
      return {
        success: false,
        error: `complete_program_failed: ${error.message}`,
        recovery: 'Database write failed — want me to retry?',
      };
    }

    // Record a module state log entry for audit trail
    try {
      await sb.from('module_state_log').insert({
        engagement_id: input.program_id,
        module_key: 'program_completion',
        previous_state: 'phase_5',
        new_state: 'completed',
        changed_by_user_id: tenancy.userId,
        context_jsonb: {
          completion_notes: input.completion_notes ?? null,
          completed_at: now,
        },
      });
    } catch {
      // Non-fatal audit log — don't fail the completion
    }

    await writeProgramAuditLogBestEffort(tenancy, {
      programId: input.program_id,
      engagementId: input.program_id,
      action: 'program_completed',
      fromState: 'P6',
      toState: 'completed',
      rationale: input.completion_notes ?? 'P6 Tower Handoff setup completed.',
      evidenceRefs: ['program_completion'],
    });

    // Emit phase-changed artifact so the UI refreshes in place.
    ctx.writer?.write(
      `\n[[artifact:program-phase-changed]]${JSON.stringify({
        programId: input.program_id,
        fromPhase: 6,
        toPhase: 6,
        snapshotId: null,
      })}[[/artifact]]\n`,
    );

    return {
      success: true,
      data: {
        program_id: input.program_id,
        lifecycle_state: 'completed',
        phase: 6,
      },
    };
  },
};

registerTool(completeProgramTool);
