// draft_artifact tool · Wave 4A workspace artifact generation
//
// Available on `/strategic-moves/:id/phase/:phase` surfaces. Lets the Nexus
// workspace chat generate and persist a deliverable draft into deliverables_v2.
//
// Calls the SAME functions POST /api/programs/workspace/[moveId]/artifact
// calls (generateArtifact + draftModuleDeliverable), in-process, rather than
// making an HTTP round-trip to that route's own public URL. The prior
// self-referential fetch (constructing a URL from `ctx.request.url` and
// calling back into the running container's own public hostname) was
// fragile in this VNet-constrained deployment and surfaced live as "Could
// not reach the artifact service" whenever it failed — every other
// deliverable-writing tool in this codebase (e.g. complete_deliverable)
// already calls its underlying mutation directly instead of self-fetching;
// this brings draft_artifact in line with that pattern.

import type { AgentTool, ToolResult } from '../registry';
import { registerTool } from '../registry';
import { requireTenancy, TenancyError } from '@/app/api/v1/programs/_auth';
import { getProgramById } from '@/lib/programs/queries';
import { generateArtifact } from '@/lib/deliverables/generate-artifact';
import { buildGeneratedPhaseDigest } from '@/lib/deliverables/generated-phase-digest';
import {
  createMovesGenerateArtifactDeps,
  normalizeMovesDeliverableKey,
} from '@/lib/deliverables/moves-generate-deps';
import { getDeliverableProfile } from '@/lib/deliverables/profiles/registry';
import { draftModuleDeliverable } from '@/lib/programs/nexus';
import { PHASE_LABEL_MAP } from '@/lib/programs/programs-fixture';
import type { ProgramPhaseId } from '@/lib/programs/programs-types';

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

const PHASE_TO_MODULE_KEY: Record<number, string> = {
  1: 'charter',
  2: 'diagnose',
  3: 'design',
  4: 'roadmap',
  5: 'mobilize',
};

export const draftArtifactTool: AgentTool<DraftArtifactInput> = {
  name: 'draft_artifact',
  description:
    'Generate a deliverable draft for the current strategic move workspace and persist it to deliverables_v2. ' +
    'Use this when the user asks Nexus to draft, generate, or create a phase deliverable such as a charter, ' +
    'diagnose report, design spec, roadmap, or mobilization plan. The draft goes through quality gates before ' +
    'persisting — if it fails, a Maestro flag is raised and the user is notified. ' +
    'Phase-to-deliverable mapping: P1=charter/discovery_report, P2=diagnose_report/design_brief, ' +
    'P3=design_spec/design_brief, P4=roadmap/execution_roadmap/execution_plan, ' +
    'P5=mobilize_plan/business_case/approval_memo/sponsor_alignment/readiness_and_change_plan. ' +
    'NOT for requirements-to-design-to-outcomes traceability, traceability matrices, or other ' +
    'evidence/mapping artifacts that trace one thing to another — those have no generation profile ' +
    'here. Use complete_deliverable instead, with deliverable_type_key "requirements_traceability", ' +
    'and write the traceability content yourself as the tool call\'s content/content_outline.',
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
  handler: async (input): Promise<ToolResult> => {
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
          `Use one of: ${Array.from(ALLOWED_DELIVERABLE_KEYS).sort().join(', ')}. ` +
          'For traceability/mapping artifacts, use complete_deliverable instead.',
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

    let ctx;
    try {
      ctx = await requireTenancy();
    } catch (err) {
      if (err instanceof TenancyError) {
        return {
          success: false,
          error: `auth:${err.code}`,
          recovery: 'I could not verify your session. Please refresh and try again.',
        };
      }
      throw err;
    }

    try {
      const program = await getProgramById(ctx, input.move_id);
      if (!program) {
        return {
          success: false,
          error: 'not_found',
          recovery: 'That Move is not accessible from this account.',
        };
      }
      if (program.archivedAt || program.deletedAt) {
        return {
          success: false,
          error: 'archived_or_deleted',
          recovery: 'That Move has been archived and can no longer be drafted into.',
        };
      }
      if (!ctx.clientKey) {
        return {
          success: false,
          error: 'no_tenant_key',
          recovery: 'The active tenant has no resolvable tenant key.',
        };
      }

      const moduleKey = PHASE_TO_MODULE_KEY[phase];
      const phaseLabel = PHASE_LABEL_MAP[phase as ProgramPhaseId] ?? `P${phase}`;
      const artifact = normalizeMovesDeliverableKey(deliverableKey, phase, title);
      const profile = getDeliverableProfile(artifact);

      const result = await generateArtifact(
        {
          moveId: input.move_id,
          tenantKey: ctx.clientKey,
          phase,
          artifact,
          allowApprovedRetry: true,
          useCaseQuery: prompt,
        },
        createMovesGenerateArtifactDeps(ctx),
      );

      if (result.status === 'blocked_gate') {
        return {
          success: false,
          error: `gate_blocked: ${result.blockers.map((b) => b.reason).join('; ')}`,
          recovery:
            'This phase is not ready for that deliverable yet — a gate is still open. ' +
            'Close the blocking item first, then ask me to draft again.',
        };
      }

      if (result.status === 'blocked_context') {
        return {
          success: false,
          error: `context_blocked: ${result.missing.join(', ')}`,
          recovery:
            `I need more evidence before I can draft this: ${result.missing.join(', ')}. ` +
            'Upload it or tell me where to find it and I will retry.',
        };
      }

      if (result.status === 'blocked_quality') {
        return {
          success: false,
          error: 'golden_bar_failed',
          recovery:
            'The draft did not meet the quality bar. Try providing more specific context or ' +
            'evidence in the prompt and I will retry.',
        };
      }

      const solutionContextDigest = buildGeneratedPhaseDigest({
        artifact,
        phase,
        html: result.html,
        context: result.context,
      });

      const { deliverableId, versionId } = await draftModuleDeliverable(ctx, {
        programId: input.move_id,
        moduleKey,
        deliverableTypeKey: artifact,
        title: title || profile.title,
        draftContent: result.html,
        structuredData: {
          prompt,
          phase,
          artifact,
          output_format: 'html',
          mode: 'workspace_artifact',
          solutionContextDigest,
          solution_context: result.context,
          golden_bar: result.goldenBar,
        },
        provenanceMap: {
          module: moduleKey,
          program: program.name,
          phase,
          phase_label: phaseLabel,
          artifact,
          output_format: 'html',
        },
      });

      return {
        success: true,
        data: {
          deliverable_id: deliverableId,
          version_id: versionId,
          phase,
          deliverable_key: artifact,
          title,
          content_preview:
            result.html.slice(0, 300) + (result.html.length > 300 ? '…' : ''),
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: `draft_artifact_failed: ${message}`,
        recovery: 'The artifact draft failed unexpectedly. Retry, or ask an admin to check the logs.',
      };
    }
  },
};

registerTool(draftArtifactTool);
