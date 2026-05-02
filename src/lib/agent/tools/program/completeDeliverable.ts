// complete_deliverable tool - Program lifecycle crawl enablement
//
// Lets Nexus persist and sign off a generated artifact when an authorized
// user explicitly accepts it. This closes the gap where the agent could
// draft content in chat but hard gates still saw no signed deliverable in
// deliverables_v2.

import type { AgentTool, ToolResult } from '../registry';
import { registerTool } from '../registry';
import { requireTenancy, TenancyError } from '@/app/api/v1/programs/_auth';
import { completeDeliverable } from '@/lib/programs/mutations';
import { sanitizeRestrictedFinancialText } from '@/lib/agent/restricted-output-policy';

interface CompleteDeliverableToolInput {
  program_id: string;
  deliverable_type_key: string;
  title: string;
  content?: string;
  content_outline?: string[];
  module_key?: string;
  sign_off?: boolean;
  rationale?: string;
}

export const ALLOWED_PROGRAM_DELIVERABLE_TYPES = new Set([
  'approval_memo',
  'approval_packet',
  'baseline',
  'baseline_metrics',
  'business_case',
  'business_readiness_plan',
  'capacity_approval',
  'charter',
  'change_management_plan',
  'control_tower_handoff',
  'current_state_assessment',
  'current_state_summary',
  'design',
  'design_brief',
  'design_spec',
  'discovery_notes',
  'discovery_report',
  'discovery_summary',
  'execution_plan',
  'execution_roadmap',
  'execution_monitoring_plan',
  'funding_approval',
  'funding_business_case',
  'meeting_notes',
  'mobilization_roadmap',
  'outcome_report',
  'origination_brief',
  'readiness_and_change_plan',
  'requirements_design_outcome_trace',
  'requirements_traceability',
  'risk_register',
  'sponsor_alignment',
  'stakeholder_alignment',
  'stakeholder_map',
  'synthesis_options_memo',
  'tower_handoff_plan',
  'traceability_matrix',
  'value_baseline',
  'vendor_selection',
  'workshop_facilitator_guide',
  'workshop_notes',
]);

export const completeDeliverableTool: AgentTool<CompleteDeliverableToolInput> = {
  name: 'complete_deliverable',
  description:
    'Persist a program artifact into deliverables_v2 and, when the authorized user explicitly approves it, ' +
    'mark it signed_off so phase gates can read it. Use this only after the user has accepted the artifact ' +
    'or said to approve/sign off. Do not call it for rough drafts. If sign_off is omitted, default to true ' +
    'because this tool represents an explicit acceptance moment. For chat-only drafts, use ordinary prose or ' +
    'the draft route instead. Use distinct deliverable_type_key values for distinct gate artifacts: ' +
    'P0 accepted seed brief = origination_brief, P2 synthesis options memo = synthesis_options_memo, P2 workshop guide = workshop_facilitator_guide, ' +
    'P2 charter = charter, P3 solution design = design_spec, P3 requirements-to-design-to-outcomes trace = ' +
    'requirements_traceability, P4 roadmap = execution_roadmap, P5 funding package = business_case plus ' +
    'approval_memo or funding_approval, P5 alignment = stakeholder_alignment or sponsor_alignment, ' +
    'P5 readiness = readiness_and_change_plan, P6 Tower setup = tower_handoff_plan. Keep the content payload ' +
    'bounded: prefer content_outline for large artifacts, and keep content under 6,000 characters. Do not generate ' +
    'a huge hidden tool payload.',
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
          'Deliverable key. Common lifecycle keys: discovery_report, stakeholder_map, charter, design_spec, ' +
          'origination_brief, synthesis_options_memo, workshop_facilitator_guide, requirements_traceability, execution_roadmap, business_case, approval_packet, approval_memo, ' +
          'funding_approval, stakeholder_alignment, sponsor_alignment, change_management_plan, ' +
          'readiness_and_change_plan, tower_handoff_plan, outcome_report, vendor_selection.',
      },
      title: {
        type: 'string',
        description: 'Human-readable deliverable title.',
      },
      content: {
        type: 'string',
        maxLength: 6000,
        description:
          'Artifact content to store as the latest deliverable version. Keep this concise and bounded; ' +
          'for large phase deliverables, store an executive-grade outline and key decisions here instead of full prose.',
      },
      content_outline: {
        type: 'array',
        items: { type: 'string' },
        maxItems: 16,
        description:
          'Use this for large deliverables instead of a long content string. Each item is a short section heading, ' +
          'decision, gate proof, risk, or required follow-up. The tool will persist a compact markdown document.',
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
  handler: async (input, ctx): Promise<ToolResult> => {
    const deliverableTypeKey = input.deliverable_type_key?.trim();
    const title = input.title?.trim();
    if (!input.program_id?.trim()) {
      return {
        success: false,
        error: 'missing_program_id',
        recovery: 'I need the program id before I can persist a deliverable.',
      };
    }
    if (!deliverableTypeKey || !ALLOWED_PROGRAM_DELIVERABLE_TYPES.has(deliverableTypeKey)) {
      return {
        success: false,
        error: 'unsupported_deliverable_type',
        recovery:
          `Use one of: ${Array.from(ALLOWED_PROGRAM_DELIVERABLE_TYPES).sort().join(', ')}. ` +
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
      const contentFromOutline =
        !input.content && input.content_outline && input.content_outline.length > 0
          ? input.content_outline.map((item) => `- ${item}`).join('\n')
          : undefined;
      const rawContent = input.content ?? contentFromOutline;
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
          : input.content,
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
