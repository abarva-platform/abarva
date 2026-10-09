// propose_assumption tool · Moves assumptions register (flag
// `moves_assumption_register_v1`)
//
// aVa may put a WORKING FIGURE in front of the team only as a labelled register
// assumption, never as a fact. This tool is the one way it does that: it adds a
// row to the Move's register with status `proposed`, origin `ava_proposal` and
// actor kind `ava`. A proposed row reaches no document and no prompt until a
// person accepts it.
//
// What this tool can NEVER do, by construction: accept, reject, answer, edit or
// supersede a row. It imports only `createAssumption` from the store, the
// store derives the status from the origin (never from input), and the store
// refuses any non-`ava_proposal` origin from an `ava` actor. Those decisions
// belong to a person, through the register routes.
//
// Every proposal must carry a source, an owner ROLE (never a personal name), a
// confidence of 1, 3 or 5, a statement and the working figure it proposes.

import type { AgentTool, ToolResult } from "../registry";
import { registerTool } from "../registry";
import { requireTenancy, TenancyError } from "@/app/api/v1/programs/_auth";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { getProgramById } from "@/lib/programs/queries";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import {
  ASSUMPTION_AREAS,
  REGISTER_CONFIDENCE_SCORES,
  isRegisterConfidence,
  type AssumptionArea,
} from "@/lib/programs/assumption-register/model";
import {
  createAssumption,
  RegisterHistoryWriteError,
} from "@/lib/programs/assumption-register/store";
import { looksLikePersonalName } from "@/lib/programs/assumption-register/owner-role";
import {
  ASSUMPTION_REGISTER_FLAG,
  canWriteRegister,
} from "@/lib/programs/assumption-register/register-route-access";

interface ProposeAssumptionInput {
  program_id: string;
  area: string;
  statement: string;
  working_figure: string;
  working_value?: number;
  unit?: string;
  source: string;
  owner_role: string;
  confidence: number;
  why_it_matters?: string;
  raised_phase?: number;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function refuse(error: string, recovery: string): ToolResult {
  return { success: false, error, recovery };
}

export const proposeAssumptionTool: AgentTool<ProposeAssumptionInput> = {
  name: "propose_assumption",
  description:
    "Propose a working figure for this Move as a labelled assumption on its assumptions register. " +
    "Use this whenever a document or answer needs a figure that is not in the evidence: never state such a " +
    "figure as a fact, propose it here instead. The row is saved as PROPOSED and waits for a person on the " +
    "Move team to accept or reject it; it reaches no document until accepted. This tool can only propose. " +
    "It cannot accept, reject, answer, edit or supersede any assumption, so never claim it did. " +
    "Every proposal needs the statement, the working figure, where the figure came from, the ROLE that owns " +
    "it (never a person's name), and a confidence of 1 (low), 3 (medium) or 5 (high).",
  surfaces: ["/programs/:id", "/strategic-moves/:id/phase/:phase"],
  input_schema: {
    type: "object",
    properties: {
      program_id: {
        type: "string",
        description: "The Move (program) id.",
      },
      area: {
        type: "string",
        enum: [...ASSUMPTION_AREAS],
        description: "Which part of the case the figure supports.",
      },
      statement: {
        type: "string",
        description:
          "The assumption in one sentence, e.g. that a share of claims are reworked by hand.",
      },
      working_figure: {
        type: "string",
        description:
          "The working figure as it should read in a document, e.g. 30% or 12 weeks.",
      },
      working_value: {
        type: "number",
        description: "Optional numeric value of the working figure.",
      },
      unit: {
        type: "string",
        description:
          "Optional unit of the working value, e.g. percent or weeks.",
      },
      source: {
        type: "string",
        description:
          "Where the figure came from: a named document, benchmark or interview. Required.",
      },
      owner_role: {
        type: "string",
        description:
          "The ROLE accountable for validating the figure, e.g. Finance Director or CFO office. Never a person's name.",
      },
      confidence: {
        type: "number",
        enum: [...REGISTER_CONFIDENCE_SCORES],
        description: "1 is low, 3 is medium, 5 is high.",
      },
      why_it_matters: {
        type: "string",
        description: "Optional: what in the case depends on this figure.",
      },
      raised_phase: {
        type: "number",
        description:
          "Optional: the phase (0 to 5) the assumption was raised in.",
      },
    },
    required: [
      "program_id",
      "area",
      "statement",
      "working_figure",
      "source",
      "owner_role",
      "confidence",
    ],
  },
  handler: async (input, ctx): Promise<ToolResult> => {
    const programId = text(input.program_id);
    if (!programId) {
      return refuse(
        "missing_program_id",
        "I need the Move id before I can propose an assumption.",
      );
    }
    if (!(ASSUMPTION_AREAS as readonly string[]).includes(input.area)) {
      return refuse(
        "invalid_area",
        "Say which area the figure supports: value, data, delivery or adoption.",
      );
    }
    const statement = text(input.statement);
    if (!statement) {
      return refuse(
        "missing_statement",
        "State the assumption in one sentence, then propose it again.",
      );
    }
    const workingFigure = text(input.working_figure);
    if (!workingFigure) {
      return refuse(
        "missing_working_figure",
        "A proposal must carry the working figure it proposes. Add the figure, then propose it again.",
      );
    }
    const source = text(input.source);
    if (!source) {
      return refuse(
        "missing_source",
        "Name where the figure came from (a document, benchmark or interview). Without a source it cannot be proposed.",
      );
    }
    const ownerRole = text(input.owner_role);
    if (!ownerRole) {
      return refuse(
        "missing_owner_role",
        "Name the ROLE that owns validating this figure, such as Finance Director.",
      );
    }
    if (looksLikePersonalName(ownerRole)) {
      return refuse(
        "owner_role_is_a_name",
        "The owner must be a role, such as Finance Director or CFO office, never a person's name. Propose it again with the role.",
      );
    }
    if (!isRegisterConfidence(input.confidence)) {
      return refuse(
        "invalid_confidence",
        "Confidence must be 1 (low), 3 (medium) or 5 (high).",
      );
    }
    if (
      input.working_value !== undefined &&
      // `Number.isFinite` is false for anything that is not a number.
      !Number.isFinite(input.working_value)
    ) {
      return refuse(
        "invalid_working_value",
        "The working value must be a number, or leave it out.",
      );
    }

    let tenancy;
    try {
      tenancy = await requireTenancy();
    } catch (err) {
      if (err instanceof TenancyError) {
        return refuse(
          `auth:${err.code}`,
          err.code === "unauthenticated"
            ? "Your session expired. Sign back in and I'll propose the assumption."
            : "There's no active client on this session. Set the active client and I'll try again.",
        );
      }
      throw err;
    }

    if (!isFeatureEnabled(tenancy, ASSUMPTION_REGISTER_FLAG)) {
      return refuse(
        "register_not_enabled",
        "The assumptions register is not turned on for this workspace, so nothing was proposed. Mark the figure as an assumption to validate in prose instead.",
      );
    }

    const program = await getProgramById(tenancy, programId);
    if (!program) {
      return refuse(
        "program_not_found",
        "This Move could not be opened for this account, so nothing was proposed. Confirm the Move id.",
      );
    }

    const policy =
      ctx.accessPolicy ??
      (await loadUserProgramAccessPolicy(tenancy, { programId }));
    if (!canWriteRegister(policy, programId)) {
      return refuse(
        "forbidden",
        "This account can view the Move but cannot add to its register, so nothing was proposed. A Move team member can propose it.",
      );
    }

    try {
      const result = await createAssumption(
        tenancy,
        programId,
        {
          area: input.area as AssumptionArea,
          statement,
          workingFigure,
          workingValue: input.working_value ?? null,
          unit: text(input.unit) || null,
          source,
          confidence: input.confidence,
          ownerRole,
          whyItMatters: text(input.why_it_matters) || null,
          raisedPhase:
            typeof input.raised_phase === "number" ? input.raised_phase : null,
          origin: "ava_proposal",
        },
        { kind: "ava", userId: tenancy.userId },
      );
      if (!result.ok) {
        return refuse(
          `register_refused:${result.refusal.code}`,
          result.refusal.code === "invalid_input"
            ? `The register refused the ${result.refusal.field} field, so nothing was proposed. Fix it and propose again.`
            : "The register refused the proposal, so nothing was proposed. Tell the user and do not claim the assumption exists.",
        );
      }
      return {
        success: true,
        data: {
          register_id: result.record.registerId,
          assumption_id: result.record.id,
          status: result.record.status,
          note: `Proposed as ${result.record.registerId}. It waits for a person on the Move team to accept or reject it, and reaches no document until accepted.`,
        },
      };
    } catch (err) {
      if (err instanceof RegisterHistoryWriteError) {
        return {
          success: true,
          data: {
            register_id: err.landed.registerId,
            assumption_id: err.landed.id,
            status: err.landed.status,
            history_recorded: false,
            note: `Proposed as ${err.landed.registerId}, but its history entry was not recorded. Do not propose it again.`,
          },
        };
      }
      return refuse(
        "proposal_unconfirmed",
        "The proposal could not be confirmed: it may or may not have been saved. Ask the user to check the register before proposing it again.",
      );
    }
  },
};

registerTool(proposeAssumptionTool);
