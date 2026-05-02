// create_milestones tool
//
// Lets Nexus convert a P4 execution-roadmap narrative into structured
// program_milestones rows so the P4 -> P5 gate can evaluate actual control-plane
// state instead of prose.

import type { AgentTool, ToolResult } from '../registry';
import { registerTool } from '../registry';
import { requireTenancy, TenancyError } from '@/app/api/v1/programs/_auth';
import { createMilestone } from '@/lib/programs/mutations';
import { loadUserProgramAccessPolicy } from '@/lib/auth/program-access-policy';

interface CreateMilestoneInput {
  name: string;
  description?: string;
  target_date?: string;
  phase_number?: number;
  module_key?: string;
  owner_user_id?: string;
}

interface CreateMilestonesInput {
  program_id: string;
  milestones: CreateMilestoneInput[];
}

function cleanDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

function milestoneBatchKey(milestone: CreateMilestoneInput): string {
  return [
    milestone.name.trim().toLowerCase(),
    milestone.phase_number ?? 4,
    milestone.module_key ?? 'execution_roadmap',
  ].join('::');
}

export const createMilestonesTool: AgentTool<CreateMilestonesInput> = {
  name: 'create_milestones',
  description:
    'Create structured program milestone rows for an existing program. Use this after drafting a P4 execution roadmap when the roadmap names critical milestones, owners, dependencies, decision points, and evidence sources. Do not use this for vague narrative bullets; each milestone needs a concrete name and description.',
  surfaces: ['/programs/:id'],
  input_schema: {
    type: 'object',
    properties: {
      program_id: {
        type: 'string',
        description: 'Existing engagement/program UUID.',
      },
      milestones: {
        type: 'array',
        minItems: 1,
        maxItems: 12,
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Milestone name, e.g. "Tower-grain baseline confirmed".',
            },
            description: {
              type: 'string',
              description:
                'Owner, dependency, decision required, and evidence source in prose.',
            },
            target_date: {
              type: 'string',
              description:
                'Optional ISO date YYYY-MM-DD. Use only when the user supplied an actual date, not a relative week.',
            },
            phase_number: {
              type: 'number',
              description: 'Usually 4 for execution-roadmap milestones.',
            },
            module_key: {
              type: 'string',
              description: 'Optional module key, e.g. execution_roadmap.',
            },
            owner_user_id: {
              type: 'string',
              description:
                'Optional owner person UUID only when already known from tenant records. Do not invent UUIDs.',
            },
          },
          required: ['name'],
        },
      },
    },
    required: ['program_id', 'milestones'],
  },
  handler: async (input, ctx): Promise<ToolResult> => {
    if (!Array.isArray(input.milestones) || input.milestones.length === 0) {
      return {
        success: false,
        error: 'milestones_required',
        recovery: 'Provide at least one concrete milestone before I can save the roadmap milestones.',
      };
    }
    if (input.milestones.length > 12) {
      return {
        success: false,
        error: 'too_many_milestones',
        recovery: 'Limit the milestone write to the 12 most critical execution checkpoints.',
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
              ? "Your session expired. Sign back in and we'll save the milestones."
              : "There's no active client on this session. Set the active client and I'll try again.",
        };
      }
      throw err;
    }

    const accessPolicy = ctx.accessPolicy ?? await loadUserProgramAccessPolicy(tenancy, {
      programId: input.program_id,
    });
    const canWriteProgramArtifacts =
      accessPolicy.canCreatePrograms === true ||
      accessPolicy.canApproveGates === true ||
      accessPolicy.canPublishDeliverables === true;
    if (!canWriteProgramArtifacts) {
      return {
        success: false,
        error: 'milestone_write_forbidden',
        recovery:
          'This session can read the roadmap but cannot write milestone records. Ask a program admin or gate approver to save them.',
      };
    }

    const dedupedMilestones: CreateMilestoneInput[] = [];
    const seenMilestones = new Set<string>();
    for (const milestone of input.milestones) {
      const key = milestoneBatchKey(milestone);
      if (seenMilestones.has(key)) continue;
      seenMilestones.add(key);
      dedupedMilestones.push(milestone);
    }

    const created: Array<{ milestone_id: string; name: string }> = [];
    for (const milestone of dedupedMilestones) {
      const name = milestone.name?.trim();
      if (!name) {
        return {
          success: false,
          error: 'milestone_name_required',
          recovery: 'Each milestone needs a concrete name before it can be saved.',
        };
      }
      const milestoneId = await createMilestone(tenancy, input.program_id, {
        name,
        description: milestone.description?.trim() || undefined,
        targetDate: cleanDate(milestone.target_date),
        phaseNumber: milestone.phase_number ?? 4,
        moduleKey: milestone.module_key ?? 'execution_roadmap',
        ownerUserId: milestone.owner_user_id,
      });
      created.push({ milestone_id: milestoneId, name });
    }

    return {
      success: true,
      data: {
        program_id: input.program_id,
        milestone_count: created.length,
        milestones: created,
      },
    };
  },
};

registerTool(createMilestonesTool);
