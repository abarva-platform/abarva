// complete_deliverable tool · Program lifecycle crawl enablement
//
// Lets Nexus persist and sign off a generated artifact when an authorized
// user explicitly accepts it. This closes the gap where the agent could
// draft content in chat but hard gates still saw no signed deliverable in
// deliverables_v2.

import type { AgentTool, ToolResult } from '../registry';
import { registerTool } from '../registry';
import { requireTenancy, TenancyError } from '@/app/api/v1/programs/_auth';
import { completeDeliverable } from '@/lib/programs/mutations';

interface CompleteDeliverableToolInput {
  program_id: string;
  deliverable_type_key: string;
  title: string;
  content?: string;
  module_key?: string;
  sign_off?: boolean;
  rationale?: string;
}

const ALLOWED_DELIVERABLE_TYPES = new Set([
  'charter',
  'design',
  'design_spec',
  'execution_plan',
  'outcome_report',
  'vendor_selection',
  'discovery_report',
  'approval_packet',
]);

export const completeDeliverableTool: AgentTool<CompleteDeliverableToolInput> = {
  name: 'complete_deliverable',
  description:
    'Persist a program artifact into deliverables_v2 and, when the authorized user explicitly approves it, ' +
    'mark it signed_off so phase gates can read it. Use this only after the user has accepted the artifact ' +
    'or said to approve/sign off. Do not call it for rough drafts. If sign_off is omitted, default to true ' +
    'because this tool represents an explicit acceptance moment. For chat-only drafts, use ordinary prose or ' +
    'the draft route instead.',
  surfaces: ['/programs/:id'],
  input_schema: {
    type: 'object',
    properties: {
      program_id: {
        type: 'string',
        description: 'Program/engagement id.',
      },
      deliverable_type_key: {
        type: 'string',
        description:
          'Deliverable key, e.g. charter, design_spec, execution_plan, outcome_report, vendor_selection.',
      },
      title: {
        type: 'string',
        description: 'Human-readable deliverable title.',
      },
      content: {
        type: 'string',
        description: 'Artifact content to store as the latest deliverable version.',
      },
      module_key: {
        type: 'string',
        description: 'Optional module this deliverable satisfies.',
      },
      sign_off: {
        type: 'boolean',
        description: 'Defaults true. Set false only when the user asks to save a draft without approval.',
      },
      rationale: {
        type: 'string',
        description: 'Why the artifact is ready, used for audit provenance.',
      },
    },
    required: ['program_id', 'deliverable_type_key', 'title'],
  },
  handler: async (input): Promise<ToolResult> => {
    const deliverableTypeKey = input.deliverable_type_key?.trim();
    const title = input.title?.trim();
    if (!input.program_id?.trim()) {
      return {
        success: false,
        error: 'missing_program_id',
        recovery: 'I need the program id before I can persist a deliverable.',
      };
    }
    if (!deliverableTypeKey || !ALLOWED_DELIVERABLE_TYPES.has(deliverableTypeKey)) {
      return {
        success: false,
        error: 'unsupported_deliverable_type',
        recovery:
          `Use one of: ${Array.from(ALLOWED_DELIVERABLE_TYPES).sort().join(', ')}. ` +
          'If this is a different artifact, save it as an attachment or approval_packet first.',
      };
    }
    if (!title) {
      return {
        success: false,
        error: 'missing_title',
        recovery: 'Give the deliverable a short title, then I can persist it.',
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
              ? "Your session expired. Sign back in and I'll save the deliverable."
              : "There's no active client on this session. Set the active client and I'll retry.",
        };
      }
      throw err;
    }

    try {
      const result = await completeDeliverable(tenancy, input.program_id, {
        deliverableTypeKey,
        title,
        content: input.content,
        moduleKey: input.module_key,
        signOff: input.sign_off !== false,
        structuredData: {
          completed_by_agent: 'Nexus',
          explicit_user_acceptance: input.sign_off !== false,
          rationale: input.rationale ?? null,
        },
      });

      return {
        success: true,
        data: {
          program_id: input.program_id,
          deliverable_id: result.deliverableId,
          version_id: result.versionId,
          deliverable_type_key: deliverableTypeKey,
          status: result.status,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: `complete_deliverable_failed: ${message}`,
        recovery:
          "I couldn't persist or sign off that deliverable. Keep the artifact text visible, " +
          'then retry or ask an admin to check deliverables_v2.',
      };
    }
  },
};

registerTool(completeDeliverableTool);
