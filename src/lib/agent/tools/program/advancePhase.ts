// advance_phase tool · Surface 2 PR-C of Programs Strict Completion v1.2
//
// Closes Crawl Obs #18 architecturally: instead of a static "Advance to
// Phase N" button that fires regardless of gate state, Nexus orchestrates
// the advance via this tool. The handler evaluates gates server-side
// (governance.evaluateGate), and:
//   - blocks advance when any hard-gate criterion is unmet
//   - returns the unmet criteria so Nexus can surface them as
//     gate-evaluation artifacts to the user
//   - advances when criteria pass (calling the same mutation the legacy
//     button targeted)
//   - supports bypass with rationale for sponsor override (lead-only,
//     gated by the existing requestFounderApproval flow)
//
// Evidence semantics (from founder guardrails saved 2026-04-29):
//   The pack remains static doctrine. Gate evaluation here uses the
//   GATE_RULES in src/lib/programs/governance.ts — the same hard-coded
//   rules that have always governed advance — NOT the pack's
//   definitionOfDone. The pack's evidence items are coaching guidance
//   for Nexus to surface in chat; the gate-rules evaluator is what
//   actually decides advance. The future knowledge-broker layer will
//   bridge the two by mapping pack items to live evidence in the
//   Enterprise Data Room.
//
// Agent-driven flow:
//   User: "Can we move to Build now?"
//   Nexus:
//     → advance_phase({program_id, to_phase: 4})
//     → tool evaluates gates, blocks with unmet criteria
//     → Nexus emits gate-evaluation artifacts for each unmet criterion
//     → "Holding on Build — privacy attestation pending. Want to push
//        anyway with sponsor sign-off, or wait?"

import type { AgentTool, ToolResult } from '../registry';
import { registerTool } from '../registry';
import { requireTenancy, TenancyError } from '@/app/api/v1/programs/_auth';
import { advancePhase as advancePhaseMutation } from '@/lib/programs/mutations';
import { evaluateGate, requestFounderApproval } from '@/lib/programs/governance';
import { getProgramById } from '@/lib/programs/queries';
import { loadUserProgramAccessPolicy } from '@/lib/auth/program-access-policy';

interface AdvancePhaseInput {
  /** Engagement id (or graph_node_id) of the program to advance. */
  program_id: string;
  /** Target phase 0..6. Must equal current_phase + 1 unless bypass_gate. */
  to_phase: number;
  /** Plain-language rationale, especially when bypassing gates. */
  rationale?: string;
  /**
   * When true, the agent is requesting a soft-fail bypass (sponsor
   * override). The handler still routes through requestFounderApproval
   * if the gate is hard-failing — bypass doesn't override hard fails.
   */
  bypass_gate?: boolean;
  /**
   * Test/admin flow only: when true, a caller with gate-approval rights can
   * satisfy the sponsor approval requirement and advance in one write.
   */
  self_approve_if_authorized?: boolean;
}

function formatAdvanceError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export const advancePhaseTool: AgentTool<AdvancePhaseInput> = {
  name: 'advance_phase',
  description:
    'Advance a program to the next phase. Always evaluate gates first — the tool will return ' +
    'gate_blocked_hard with the unmet criteria when hard-gate checks fail. When that happens, surface ' +
    'each unmet criterion to the user via gate-evaluation artifacts; do NOT announce success or ' +
    'pretend the advance happened. Only call this when the user has explicitly asked to advance ' +
    '(e.g. "move to Build", "advance the phase"). Default bypass_gate to false; only set true ' +
    'when the user explicitly invokes a sponsor override and provides a rationale.',
  surfaces: ['/programs/:id'],
  input_schema: {
    type: 'object',
    properties: {
      program_id: {
        type: 'string',
        description: 'Engagement id or graph_node_id (e.g. apx-cdp-2026 or its UUID).',
      },
      to_phase: {
        type: 'number',
        description: 'Target phase 0-6. Must equal current_phase + 1 unless bypass_gate is true.',
      },
      rationale: {
        type: 'string',
        description: 'Plain-language rationale, especially when bypass_gate is true.',
      },
      bypass_gate: {
        type: 'boolean',
        description:
          'Default false. Only set true when the user explicitly invokes a sponsor override; ' +
          'soft-fail bypass routes through founder approval if needed. Hard fails always block.',
      },
      self_approve_if_authorized: {
        type: 'boolean',
        description:
          'Default false. Set true only when the signed-in user explicitly asks to self-approve ' +
          'and has phase-gate approval rights. This is for admin/test approval flows; otherwise ' +
          'the tool creates a sponsor approval request instead of advancing.',
      },
    },
    required: ['program_id', 'to_phase'],
  },
  handler: async (input, ctx): Promise<ToolResult> => {
    if (typeof input.to_phase !== 'number' || input.to_phase < 0 || input.to_phase > 6) {
      return {
        success: false,
        error: 'invalid_to_phase',
        recovery: 'Target phase must be 0-6. Tell me which phase you actually want to advance to.',
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
              ? "Your session expired. Sign back in and we'll pick up the advance."
              : "There's no active client on this session. Set the active client and I'll try again.",
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
          `Couldn't find program "${input.program_id}" in this tenant. Confirm the id and I'll retry.`,
      };
    }

    const fromPhase = program.currentPhase ?? 0;
    if (input.to_phase !== fromPhase + 1 && !input.bypass_gate) {
      return {
        success: false,
        error: 'non_adjacent_phase',
        recovery:
          `The program is at phase ${fromPhase}; you asked for ${input.to_phase}. Phases advance ` +
          `one at a time unless you explicitly bypass. Want me to advance one step (${fromPhase} → ${fromPhase + 1}) instead?`,
      };
    }

    let gate;
    try {
      gate = await evaluateGate(tenancy, input.program_id, fromPhase, input.to_phase);
    } catch (err) {
      const message = formatAdvanceError(err);
      return {
        success: false,
        error: `gate_eval_failed: ${message}`,
        recovery: "Couldn't evaluate the gate. Want me to retry, or pull the criteria for review?",
      };
    }

    const hardFails = gate.failedChecks.filter((c) => c.severity === 'hard');
    if (hardFails.length > 0) {
      return {
        success: false,
        error: 'gate_blocked_hard',
        // Pass the unmet criteria back to Nexus so it can emit
        // gate-evaluation artifacts to the user. The recovery string
        // is what the agent reads to know what to surface.
        recovery:
          `Can't advance — ${hardFails.length} hard-gate check${hardFails.length === 1 ? '' : 's'} ` +
          `unmet: ${hardFails.map((c) => `${c.check} (${c.reason})`).join('; ')}. Surface these to ` +
          'the user as gate-evaluation artifacts (status: "blocked") so they can resolve them, ' +
          'then we can retry.',
      };
    }

    const accessPolicy = ctx.accessPolicy ?? await loadUserProgramAccessPolicy(tenancy, {
      programId: input.program_id,
    });
    const canSelfApproveGate =
      input.self_approve_if_authorized === true &&
      (accessPolicy.canApproveGates === true || tenancy.role === 'founder');

    const requestedApprovalOverride =
      input.bypass_gate === true || input.self_approve_if_authorized === true;
    if (
      requestedApprovalOverride &&
      accessPolicy.canApproveGates !== true &&
      tenancy.role !== 'founder'
    ) {
      return {
        success: false,
        error: 'approval_permission_required',
        recovery:
          'This session does not have phase-gate approval rights. Ask a tenant admin or sponsor approver to approve the gate, then retry.',
      };
    }

    if (gate.requiresApproval && !input.bypass_gate && !canSelfApproveGate) {
      // Create a sponsor-approval request via the existing flow rather
      // than silently advancing. The agent should communicate this
      // pending state to the user.
      try {
        await requestFounderApproval(tenancy, input.program_id, {
          requestType: 'phase_gate',
          headline: `Approve phase ${fromPhase} → ${input.to_phase} gate`,
          approverRole: gate.approverRole ?? 'sponsor',
          deadlineHours: 48,
          context: {
            from_phase: fromPhase,
            to_phase: input.to_phase,
            rationale: input.rationale ?? null,
          },
        });
      } catch {
        // Non-fatal — the explicit failure path below tells Nexus.
      }
      return {
        success: false,
        error: 'approval_required',
        recovery:
          `Phase advance requires sponsor approval. I've queued a request — once it's approved, ` +
          `we can advance phase ${fromPhase} → ${input.to_phase}. Tell the user the request is pending.`,
      };
    }

    try {
      const result = await advancePhaseMutation(tenancy, {
        programId: input.program_id,
        fromPhase,
        toPhase: input.to_phase,
        snapshot: input.rationale
          ? {
              rationale: input.rationale,
              advancedAt: new Date().toISOString(),
              self_approved: canSelfApproveGate,
            }
          : {
              advancedAt: new Date().toISOString(),
              self_approved: canSelfApproveGate,
            },
        approvedByUserId: canSelfApproveGate ? tenancy.userId : undefined,
        bypassGate: !!input.bypass_gate,
      });

      // PR-L · emit a program-phase-changed artifact directly to the
      // response stream. The client (AtlasPageStateProvider's stream
      // parser → ProgramDetailPage's onArtifact) uses this to call
      // router.refresh() so the page reflects the new phase WITHOUT
      // unmounting the React tree. Chat history, reactive panel,
      // AtlasPageState all survive the transition. This is the
      // in-place advance the "one canvas across the lifecycle"
      // premise requires.
      const phaseArtifact = {
        programId: result.programId,
        fromPhase,
        toPhase: result.newPhase,
        snapshotId: result.snapshotId,
      };
      ctx.writer?.write(
        `\n[[artifact:program-phase-changed]]${JSON.stringify(phaseArtifact)}[[/artifact]]\n`,
      );

      return {
        success: true,
        data: {
          program_id: result.programId,
          new_phase: result.newPhase,
          snapshot_id: result.snapshotId,
        },
      };
    } catch (err) {
      const message = formatAdvanceError(err);
      return {
        success: false,
        error: `advance_failed: ${message}`,
        recovery: "Couldn't write the advance to the database. Want me to retry, or escalate to admin?",
      };
    }
  },
};

registerTool(advancePhaseTool);
