// commit_program tool · F0.4 first tool, used by Surface 1 (/programs/new)
//
// When the user confirms the program brief Steward has assembled, the
// agent emits a tool_use block with the structured fields. The route
// invokes this handler, which calls into the existing program-creation
// path (originateProgram). Only after the DB write returns does the
// agent generate the success-confirmation message — this is the
// architectural mechanism that makes "Registered ✅ but DB write
// failed" structurally impossible.
//
// Per kickoff §4 F0.4: surfaces = ['/programs/new', '/demo/programs/new'].

import type { AgentTool, ToolResult } from '../registry';
import { registerTool } from '../registry';
import { requireTenancy, TenancyError } from '@/app/api/v1/programs/_auth';
import { originateProgram } from '@/lib/programs/mutations';
import type { ArchetypeKey, OriginationForm } from '@/lib/programs/types.ui';
import type { OriginSource } from '@/lib/programs/types.db';

interface CommitProgramInput {
  program_name: string;
  problem_statement: string;
  target_outcome?: string;
  timeline?: string;
  sponsor_person_id: string;
  lead_person_id?: string;
  classification?: ArchetypeKey | null;
  matched_pattern_id?: string;
}

export const commitProgramTool: AgentTool<CommitProgramInput> = {
  name: 'commit_program',
  description:
    'Persist a new program to the database after the user has explicitly confirmed the program brief. Returns the program id on success. Call this only after the user says yes to your "Shall I register?" question — never speculatively. If this returns failure, report the failure honestly to the user with recovery options; do not announce success.',
  surfaces: ['/programs/new', '/demo/programs/new'],
  input_schema: {
    type: 'object',
    properties: {
      program_name: {
        type: 'string',
        description: 'The program name as confirmed by the user.',
      },
      problem_statement: {
        type: 'string',
        description: 'The use case / problem statement, as a natural-language paragraph.',
      },
      target_outcome: {
        type: 'string',
        description: 'The target outcome the user committed to (optional but encouraged).',
      },
      timeline: {
        type: 'string',
        description: 'Free-form timeline hint (e.g., "9 months", "BAFO by May").',
      },
      sponsor_person_id: {
        type: 'string',
        description: 'Persons.id of the named program sponsor.',
      },
      lead_person_id: {
        type: 'string',
        description: 'Persons.id of the program lead (often the same as sponsor for small programs).',
      },
      classification: {
        type: 'string',
        description:
          'Archetype classification (e.g., AMS_CONSOLIDATION, CDP). Pass null when unsure.',
      },
      matched_pattern_id: {
        type: 'string',
        description: 'Pattern key matched during classification (e.g., PAT-PRG-AMS-CONSOLIDATION-001).',
      },
    },
    required: ['program_name', 'problem_statement', 'sponsor_person_id'],
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
          recovery:
            err.code === 'unauthenticated'
              ? "Your session expired. Want me to take you back to sign-in, then we'll register the program?"
              : "There's no active client on this session. Set the active client and I'll try again.",
        };
      }
      throw err;
    }

    const originationForm: OriginationForm = {
      name: input.program_name,
      useCase: input.problem_statement,
      targetOutcome: input.target_outcome ?? '',
      sponsorPersonId: input.sponsor_person_id,
      leadPersonId: input.lead_person_id ?? input.sponsor_person_id,
    };

    try {
      const program = await originateProgram(tenancy, {
        name: originationForm.name,
        useCase: originationForm.useCase,
        archetype: input.classification ?? null,
        originSource: 'maestro_console' as OriginSource,
        originSourceRef: null,
        acceptedPatternKey: input.matched_pattern_id ?? null,
        sponsorUserId: originationForm.sponsorPersonId,
        leadUserId: originationForm.leadPersonId,
      });

      // Surface 1 navigation sentinel: tell the client the program is
      // ready to be navigated to. Agent-authored confirmation text still
      // streams normally; this sentinel is stripped client-side before
      // display (StewardChat scrubs the regex).
      ctx.writer?.write(`\n[[program-created:${program.id}]]`);

      return {
        success: true,
        data: {
          program_id: program.id,
          program_name: program.name,
          redirect_to: `/programs/${program.id}`,
          surface: ctx.surface,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: `originate_failed: ${message}`,
        recovery:
          "Couldn't write the program to the database — the API returned an error. " +
          'Want me to retry, or do you want me to capture this as a draft for review?',
      };
    }
  },
};

// Self-register on first import. Routes import this module at startup
// (chat/agent route) so the tool is available when the surface matches.
registerTool(commitProgramTool);
