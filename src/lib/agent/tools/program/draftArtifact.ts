// draft_artifact tool · Wave 4A workspace artifact generation
//
// Available on `/strategic-moves/:id/phase/:phase` surfaces. Lets the Nexus
// workspace chat call the artifact endpoint to generate and persist a
// deliverable draft into deliverables_v2.
//
// The tool calls POST /api/programs/workspace/[moveId]/artifact internally,
// so all quality gates, provenance rules, and Maestro flag logic are
// enforced consistently regardless of how the draft was triggered.

import type { AgentTool, ToolResult } from '../registry';
import { registerTool } from '../registry';

interface DraftArtifactInput {
  move_id: string;
  phase: number;
  deliverable_key: string;
  title: string;
  prompt: string;
}

const ALLOWED_DELIVERABLE_KEYS = new Set([
  'charter',
  'diagnose_report',
  'design_spec',
  'roadmap',
  'mobilize_plan',
  'discovery_report',
  'discovery_summary',
  'design_brief',
  'execution_plan',
  'execution_roadmap',
  'business_case',
  'approval_memo',
  'sponsor_alignment',
  'readiness_and_change_plan',
]);

export const draftArtifactTool: AgentTool<DraftArtifactInput> = {
  name: 'draft_artifact',
  description:
    'Generate a deliverable draft for the current strategic move workspace and persist it to deliverables_v2. ' +
    'Use this when the user asks Nexus to draft, generate, or create a phase deliverable such as a charter, ' +
    'diagnose report, design spec, roadmap, or mobilization plan. The draft goes through quality gates before ' +
    'persisting — if it fails, a Maestro flag is raised and the user is notified. ' +
    'Phase-to-deliverable mapping: P1=charter/discovery_report, P2=diagnose_report/design_brief, ' +
    'P3=design_spec/design_brief, P4=roadmap/execution_roadmap/execution_plan, ' +
    'P5=mobilize_plan/business_case/approval_memo/sponsor_alignment/readiness_and_change_plan.',
  // Matches /strategic-moves/:moveId/phase/:phase surface pattern
  surfaces: ['/strategic-moves/:id/phase/:phase'],
  input_schema: {
    type: 'object',
    properties: {
      move_id: {
        type: 'string',
        description: 'The strategic move / program id (UUID).',
      },
      phase: {
        type: 'number',
        description: 'Phase number (1–5).',
        minimum: 1,
        maximum: 5,
      },
      deliverable_key: {
        type: 'string',
        description:
          'Deliverable type key. Common keys: charter, diagnose_report, design_spec, roadmap, mobilize_plan, ' +
          'discovery_report, design_brief, execution_roadmap, business_case, approval_memo, sponsor_alignment, ' +
          'readiness_and_change_plan.',
      },
      title: {
        type: 'string',
        description: 'Human-readable deliverable title, e.g. "P1 Charter — Contact Center AI".',
      },
      prompt: {
        type: 'string',
        description:
          'The drafting prompt for Nexus — describe what the deliverable should cover, which evidence to draw on, ' +
          'and any specific sections or constraints.',
      },
    },
    required: ['move_id', 'phase', 'deliverable_key', 'title', 'prompt'],
  },
  handler: async (input, ctx): Promise<ToolResult> => {
    // Validate inputs
    if (!input.move_id?.trim()) {
      return {
        success: false,
        error: 'missing_move_id',
        recovery: 'I need the move id to draft an artifact.',
      };
    }

    const phase = Number(input.phase);
    if (!Number.isInteger(phase) || phase < 1 || phase > 5) {
      return {
        success: false,
        error: 'invalid_phase',
        recovery: 'Phase must be an integer between 1 and 5.',
      };
    }

    const deliverableKey = input.deliverable_key?.trim();
    if (!deliverableKey) {
      return {
        success: false,
        error: 'missing_deliverable_key',
        recovery: 'Specify a deliverable_key such as charter, design_spec, or roadmap.',
      };
    }
    if (!ALLOWED_DELIVERABLE_KEYS.has(deliverableKey)) {
      return {
        success: false,
        error: 'unsupported_deliverable_key',
        recovery:
          `Use one of: ${Array.from(ALLOWED_DELIVERABLE_KEYS).sort().join(', ')}.`,
      };
    }

    const title = input.title?.trim();
    if (!title) {
      return {
        success: false,
        error: 'missing_title',
        recovery: 'Give the deliverable a short title.',
      };
    }

    const prompt = input.prompt?.trim();
    if (!prompt) {
      return {
        success: false,
        error: 'missing_prompt',
        recovery: 'Provide a drafting prompt describing what the deliverable should cover.',
      };
    }

    try {
      // Call the artifact endpoint internally, reusing the incoming request's
      // auth credentials (cookies/headers) so requireTenancy() resolves correctly.
      const url = new URL(
        `/api/programs/workspace/${encodeURIComponent(input.move_id)}/artifact`,
        ctx.request.url,
      );

      const resp = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Forward auth cookies
          cookie: ctx.request.headers.get('cookie') ?? '',
        },
        body: JSON.stringify({
          phase,
          deliverableKey,
          title,
          prompt,
        }),
      });

      const data = (await resp.json()) as Record<string, unknown>;

      if (resp.status === 422) {
        // Quality gate hard failure — communicate to user with the issue list
        const issues = Array.isArray(data.issues)
          ? (data.issues as Array<{ gate: string; severity: string; message: string }>)
              .filter((i) => i.severity === 'hard')
              .map((i) => `${i.gate}: ${i.message}`)
              .join('; ')
          : 'unspecified gate failure';
        return {
          success: false,
          error: `quality_gate_failed: ${issues}`,
          recovery:
            'The draft did not pass quality gates. A Maestro flag has been raised. ' +
            'Try providing more specific context or evidence in the prompt and I will retry.',
        };
      }

      if (!resp.ok) {
        const message = typeof data.detail === 'string' ? data.detail : (data.error as string) ?? resp.statusText;
        return {
          success: false,
          error: `artifact_draft_failed (${resp.status}): ${message}`,
          recovery: 'The artifact draft failed. Check the prompt and try again.',
        };
      }

      return {
        success: true,
        data: {
          deliverable_id: data.deliverableId,
          version_id: data.versionId,
          phase: data.phase,
          deliverable_key: deliverableKey,
          title,
          content_preview:
            typeof data.content === 'string'
              ? data.content.slice(0, 300) + (data.content.length > 300 ? '…' : '')
              : '',
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: `draft_artifact_failed: ${message}`,
        recovery:
          'Could not reach the artifact service. The draft was not saved. ' +
          'Retry or ask an admin to check the workspace endpoint.',
      };
    }
  },
};

registerTool(draftArtifactTool);
