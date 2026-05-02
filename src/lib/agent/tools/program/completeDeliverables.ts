// complete_deliverables tool
//
// Batch persistence for phase packages that naturally contain multiple signed
// artifacts, especially P5 Approval & Mobilization. Without this tool, Nexus
// can spend one model/tool turn per artifact and hit the client timeout before
// the gate is evaluated.

import type { AgentTool, ToolResult } from '../registry';
import { registerTool } from '../registry';
import { requireTenancy, TenancyError } from '@/app/api/v1/programs/_auth';
import { completeDeliverable } from '@/lib/programs/mutations';
import { sanitizeRestrictedFinancialText } from '@/lib/agent/restricted-output-policy';
import { ALLOWED_PROGRAM_DELIVERABLE_TYPES } from './completeDeliverable';

interface BatchDeliverableInput {
  deliverable_type_key: string;
  title: string;
  content?: string;
  content_outline?: string[];
  module_key?: string;
  sign_off?: boolean;
  rationale?: string;
}

interface CompleteDeliverablesToolInput {
  program_id: string;
  deliverables: BatchDeliverableInput[];
}

function contentFrom(input: BatchDeliverableInput): string | undefined {
  if (input.content) return input.content;
  if (input.content_outline && input.content_outline.length > 0) {
    return input.content_outline.map((item) => `- ${item}`).join('\n');
  }
  return undefined;
}

export const completeDeliverablesTool: AgentTool<CompleteDeliverablesToolInput> = {
  name: 'complete_deliverables',
  description:
    'Persist and optionally sign off several program deliverables in one batch. Use this for phase packages ' +
    'that require multiple artifacts in the same user-approved turn, especially P5 Approval & Mobilization ' +
    'packages with business_case, funding_approval, sponsor_alignment, readiness_and_change_plan, and ' +
    'tower_handoff_plan. Keep each artifact bounded: concise content under 6,000 characters or content_outline.',
  surfaces: ['/programs/:id'],
  input_schema: {
    type: 'object',
    properties: {
      program_id: {
        type: 'string',
        description: 'Program/engagement id.',
      },
      deliverables: {
        type: 'array',
        minItems: 1,
        maxItems: 8,
        items: {
          type: 'object',
          properties: {
            deliverable_type_key: {
              type: 'string',
              description:
                'Lifecycle deliverable type, e.g. business_case, funding_approval, sponsor_alignment, readiness_and_change_plan, tower_handoff_plan.',
            },
            title: {
              type: 'string',
              description: 'Human-readable deliverable title.',
            },
            content: {
              type: 'string',
              maxLength: 6000,
              description: 'Concise artifact content. Prefer content_outline for large packages.',
            },
            content_outline: {
              type: 'array',
              items: { type: 'string' },
              maxItems: 16,
              description: 'Bounded outline used when the full artifact would be too long for tool JSON.',
            },
            module_key: {
              type: 'string',
              description: 'Optional module this deliverable satisfies.',
            },
            sign_off: {
              type: 'boolean',
              description: 'Defaults true. Set false only when the user asks to save drafts.',
            },
            rationale: {
              type: 'string',
              description: 'Why the artifact is ready, used for audit provenance.',
            },
          },
          required: ['deliverable_type_key', 'title'],
        },
      },
    },
    required: ['program_id', 'deliverables'],
  },
  handler: async (input, ctx): Promise<ToolResult> => {
    if (!input.program_id?.trim()) {
      return { success: false, error: 'missing_program_id', recovery: 'I need the program id before I can persist deliverables.' };
    }
    if (!Array.isArray(input.deliverables) || input.deliverables.length === 0) {
      return { success: false, error: 'missing_deliverables', recovery: 'Provide at least one deliverable to save.' };
    }
    if (input.deliverables.length > 8) {
      return { success: false, error: 'too_many_deliverables', recovery: 'Save the eight most important deliverables first, then continue with the rest.' };
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
              ? "Your session expired. Sign back in and I'll save the deliverables."
              : "There's no active client on this session. Set the active client and I'll retry.",
        };
      }
      throw err;
    }

    const saved: Array<{ deliverable_id: string; version_id: string | null; deliverable_type_key: string; status: string }> = [];
    for (const deliverable of input.deliverables) {
      const deliverableTypeKey = deliverable.deliverable_type_key?.trim();
      const title = deliverable.title?.trim();
      if (!deliverableTypeKey || !ALLOWED_PROGRAM_DELIVERABLE_TYPES.has(deliverableTypeKey)) {
        return {
          success: false,
          error: `unsupported_deliverable_type:${deliverableTypeKey ?? ''}`,
          recovery: `Use one of: ${Array.from(ALLOWED_PROGRAM_DELIVERABLE_TYPES).sort().join(', ')}.`,
        };
      }
      if (!title) {
        return { success: false, error: 'missing_title', recovery: 'Every deliverable in the batch needs a short title.' };
      }

      const rawContent = contentFrom(deliverable);
      const result = await completeDeliverable(tenancy, input.program_id, {
        deliverableTypeKey,
        title,
        content: rawContent
          ? sanitizeRestrictedFinancialText(
              rawContent,
              ctx.accessPolicy
                ? { outputPolicy: { exactFinancialValues: ctx.accessPolicy.canViewFinancialData } }
                : null,
            )
          : undefined,
        moduleKey: deliverable.module_key,
        signOff: deliverable.sign_off !== false,
        structuredData: {
          completed_by_agent: 'Nexus',
          explicit_user_acceptance: deliverable.sign_off !== false,
          rationale: deliverable.rationale ?? null,
          batch_completed: true,
        },
      });
      saved.push({
        deliverable_id: result.deliverableId,
        version_id: result.versionId,
        deliverable_type_key: deliverableTypeKey,
        status: result.status,
      });
    }

    return {
      success: true,
      data: {
        program_id: input.program_id,
        deliverable_count: saved.length,
        deliverables: saved,
      },
    };
  },
};

registerTool(completeDeliverablesTool);
