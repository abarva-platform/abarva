// complete_deliverable tool
//
// UPSERTs a deliverables_v2 row to status='signed_off' so gate checks in
// governance.ts can pass. Used during the lifecycle crawl to mark a
// charter, design_brief, or outcome_report as sponsor-approved.
//
// Surfaces: /programs/:id (Nexus agent surface during active program work)

import type { AgentTool, ToolResult } from '../registry';
import { registerTool } from '../registry';
import { requireTenancy, TenancyError } from '@/app/api/v1/programs/_auth';
import { getServerSupabase } from '@/lib/supabase-server';

interface CompleteDeliverableInput {
  program_id: string;
  deliverable_type_key: string;
  title?: string;
  notes?: string;
}

export const completeDeliverableTool: AgentTool<CompleteDeliverableInput> = {
  name: 'complete_deliverable',
  description:
    'Mark a program deliverable as signed off (status = signed_off). ' +
    'Use this when the user confirms a deliverable is complete — charter for P2→P3, ' +
    'design_spec for P4→P5, outcome_report for P5→P6. ' +
    'Valid deliverable_type_key values: charter, design_spec, outcome_report, execution_plan, vendor_selection. ' +
    'After calling this, you can call advance_phase to check if the gate now passes.',
  surfaces: ['/programs/:id'],
  input_schema: {
    type: 'object',
    properties: {
      program_id: { type: 'string', description: 'Engagement UUID.' },
      deliverable_type_key: {
        type: 'string',
        description: 'Type key: charter | design_spec | outcome_report | execution_plan | vendor_selection',
      },
      title: { type: 'string', description: 'Human-readable title for the deliverable.' },
      notes: { type: 'string', description: 'Optional sign-off notes.' },
    },
    required: ['program_id', 'deliverable_type_key'],
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
    const title = input.title ?? `${input.deliverable_type_key} (signed off)`;

    // Check if a row already exists for this program + type
    const { data: existing } = await sb
      .from('deliverables_v2')
      .select('id, status')
      .eq('engagement_id', input.program_id)
      .eq('deliverable_type_key', input.deliverable_type_key)
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await sb
        .from('deliverables_v2')
        .update({
          status: 'signed_off',
          signed_off_by: tenancy.userId,
          signed_off_at: now,
          updated_at: now,
        })
        .eq('id', (existing as { id: string }).id));
    } else {
      ({ error } = await sb
        .from('deliverables_v2')
        .insert({
          engagement_id: input.program_id,
          deliverable_type_key: input.deliverable_type_key,
          title,
          status: 'signed_off',
          current_version: 1,
          created_by: tenancy.userId,
          signed_off_by: tenancy.userId,
          signed_off_at: now,
          created_at: now,
          updated_at: now,
        }));
    }

    if (error) {
      return {
        success: false,
        error: `deliverable_upsert_failed: ${error.message}`,
        recovery: 'Database write failed — want me to retry?',
      };
    }

    void ctx;
    return {
      success: true,
      data: {
        program_id: input.program_id,
        deliverable_type_key: input.deliverable_type_key,
        status: 'signed_off',
      },
    };
  },
};

registerTool(completeDeliverableTool);
