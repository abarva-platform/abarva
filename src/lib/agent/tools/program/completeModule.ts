// complete_module tool
//
// UPSERTs a program_modules row to status='completed'. Used to satisfy
// governance gate checks that require specific modules to be completed:
//   - baseline_capture (soft gate for P2→P3)
//   - cxo_interview (soft gate for P3→P4)
//   - funding_approval / capacity_approval / sponsor_alignment (hard gates for P5→P6)
//   - cxo_verification / benefits_realization (legacy P5→P6 readiness modules)
//   - phase_3_findings (soft gate for P3→P4)
//
// The UNIQUE constraint is on (engagement_id, module_key) — we upsert to
// avoid duplicate-key errors on retry.

import type { AgentTool, ToolResult } from '../registry';
import { registerTool } from '../registry';
import { requireTenancy, TenancyError } from '@/app/api/v1/programs/_auth';
import { getServerSupabase } from '@/lib/supabase-server';

interface CompleteModuleInput {
  program_id: string;
  module_key: string;
  module_name?: string;
  phase_number?: number;
  notes?: string;
}

const MODULE_PHASE_MAP: Record<string, number> = {
  baseline_capture: 2,
  cxo_interview: 3,
  phase_3_findings: 3,
  funding_approval: 5,
  capacity_approval: 5,
  sponsor_alignment: 5,
  stakeholder_alignment: 5,
  cxo_verification: 5,
  benefits_realization: 5,
};

export const completeModuleTool: AgentTool<CompleteModuleInput> = {
  name: 'complete_module',
  description:
    'Mark a program module as completed. Use this when the user confirms a key activity ' +
    'is done — e.g. baseline_capture after baselining metrics, cxo_interview after the CXO ' +
    'session, funding_approval/capacity_approval and sponsor_alignment before advancing P5, ' +
    'and cxo_verification and benefits_realization before closing out Phase 5. ' +
    'Valid module_key values: baseline_capture, cxo_interview, phase_3_findings, ' +
    'funding_approval, capacity_approval, sponsor_alignment, stakeholder_alignment, ' +
    'cxo_verification, benefits_realization.',
  surfaces: ['/programs/:id'],
  input_schema: {
    type: 'object',
    properties: {
      program_id: { type: 'string', description: 'Engagement UUID.' },
      module_key: {
        type: 'string',
        description:
          'Module key: baseline_capture | cxo_interview | phase_3_findings | ' +
          'funding_approval | capacity_approval | sponsor_alignment | stakeholder_alignment | ' +
          'cxo_verification | benefits_realization',
      },
      module_name: { type: 'string', description: 'Human-readable module name (optional).' },
      phase_number: { type: 'number', description: 'Phase this module belongs to (inferred if omitted).' },
      notes: { type: 'string', description: 'Completion notes.' },
    },
    required: ['program_id', 'module_key'],
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
    const phaseNumber = input.phase_number ?? MODULE_PHASE_MAP[input.module_key] ?? 0;
    const moduleName = input.module_name ?? input.module_key.replace(/_/g, ' ');

    // Upsert: insert or update on conflict (engagement_id, module_key)
    const { error } = await sb
      .from('program_modules')
      .upsert(
        {
          engagement_id: input.program_id,
          module_key: input.module_key,
          module_name: moduleName,
          phase_number: phaseNumber,
          module_order: phaseNumber,
          status: 'completed',
          assigned_user_id: tenancy.userId,
          completed_at: now,
          created_at: now,
        },
        { onConflict: 'engagement_id,module_key', ignoreDuplicates: false },
      );

    if (error) {
      return {
        success: false,
        error: `module_upsert_failed: ${error.message}`,
        recovery: 'Database write failed — want me to retry?',
      };
    }

    void ctx;
    return {
      success: true,
      data: {
        program_id: input.program_id,
        module_key: input.module_key,
        status: 'completed',
      },
    };
  },
};

registerTool(completeModuleTool);
