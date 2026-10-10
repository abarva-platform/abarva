import "server-only";

// Assumptions register — the access ladder every register route runs, and the
// answers that report a row which DID land.
//
// Order, and why:
//   1. the flag. `moves_assumption_register_v1` is tenant-scoped, so refusing
//      before the Move read reveals nothing about any Move;
//   2. the Move. `getProgramById` applies the tenant fence and per-Move RBAC; a
//      null is answered with the shared cause-blind 404 body, so an absent
//      Move, another tenant's Move and a Move outside the caller's grants stay
//      byte-identical;
//   3. the per-Move access policy. Reads need nothing more — they only use it
//      to decide what the viewer may SEE (figures withheld without financial
//      visibility). Writes need a role that is not `program_viewer` AND the
//      Move inside `programIdsAllowed` (null = every Move of the client).

import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { getProgramById } from "@/lib/programs/queries";
import { getProgramsRouteSupabase } from "@/lib/programs/programs-auth-mode-server";
import {
  loadUserProgramAccessPolicy,
  type UserProgramAccessPolicy,
} from "@/lib/auth/program-access-policy";
import { moveUnreadableRefusalBody } from "@/lib/programs/move-unreadable-refusal";
import type { TenancyCtx } from "@/lib/programs/types.db";
import type { AssumptionRecord } from "./model";
import { RegisterHistoryWriteError } from "./store";
import {
  describeHistoryNotRecorded,
  registerRefusalResponse,
} from "./assumption-register-refusal";
import { assumptionForViewer } from "./register-request";
import { looksLikePersonalName } from "./owner-role";

export const ASSUMPTION_REGISTER_FLAG = "moves_assumption_register_v1";

/** May this policy change this Move's register? */
export function canWriteRegister(
  policy: { accessLevel: string; programIdsAllowed: readonly string[] | null },
  programId: string,
): boolean {
  return (
    policy.accessLevel !== "program_viewer" &&
    (policy.programIdsAllowed === null ||
      policy.programIdsAllowed.includes(programId))
  );
}

/**
 * Who sees a register's working figures. The register is the team's working
 * tool: anyone who can work this Move's register sees its figures, as does
 * anyone with financial visibility. A read-only viewer without financial
 * visibility gets them withheld (the restricted-financial rule exists for
 * broad viewers, not for the people building the case).
 */
export function seesRegisterFigures(
  policy: Pick<
    UserProgramAccessPolicy,
    "canViewFinancialData" | "accessLevel" | "programIdsAllowed"
  >,
  programId: string,
): boolean {
  return policy.canViewFinancialData || canWriteRegister(policy, programId);
}

export type OpenedRegister =
  | {
      ok: true;
      policy: UserProgramAccessPolicy;
      /** The viewer projection every response uses for figures. */
      figures: { canViewFinancialData: boolean };
    }
  | { ok: false; response: Response };

/** Run the flag → Move → policy ladder for one request. */
export async function openAssumptionRegister(
  ctx: TenancyCtx,
  programId: string,
  mode: "read" | "write",
): Promise<OpenedRegister> {
  if (!isFeatureEnabled(ctx, ASSUMPTION_REGISTER_FLAG)) {
    return {
      ok: false,
      response: registerRefusalResponse({ code: "register_not_enabled" }),
    };
  }
  const { supabase } = await getProgramsRouteSupabase(
    mode === "read" ? "program_read" : "mutation",
  );
  const program = await getProgramById(ctx, programId, { supabase });
  if (!program) {
    return {
      ok: false,
      response: Response.json(moveUnreadableRefusalBody(), { status: 404 }),
    };
  }
  const policy = await loadUserProgramAccessPolicy(ctx, { programId });
  if (mode === "write" && !canWriteRegister(policy, programId)) {
    return {
      ok: false,
      response: registerRefusalResponse({ code: "forbidden" }),
    };
  }
  return {
    ok: true,
    policy,
    figures: { canViewFinancialData: seesRegisterFigures(policy, programId) },
  };
}

/**
 * The refusal for an owner ROLE that reads like a person, or null. Documents
 * and aVa read `owner_role`, so a person never goes there; `owner_name` may
 * still carry one, and no generation view reads it. Checked before the store,
 * so a refused row writes nothing.
 */
export function personAsOwnerRoleResponse(
  ownerRole: string | null | undefined,
): Response | null {
  return typeof ownerRole === "string" && looksLikePersonalName(ownerRole)
    ? registerRefusalResponse({ code: "owner_role_is_a_person" })
    : null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Register rows are keyed by uuid; anything else cannot name one. */
export function isRegisterRowId(value: string): boolean {
  return UUID_RE.test(value);
}

/** A row that landed, projected for the viewer. */
export function landedAssumptionResponse(
  record: AssumptionRecord,
  policy: Pick<UserProgramAccessPolicy, "canViewFinancialData">,
  status: number,
  extra: Record<string, unknown> = {},
): Response {
  return Response.json(
    {
      ok: true,
      assumption: assumptionForViewer(record, policy),
      historyRecorded: true,
      ...extra,
    },
    { status },
  );
}

/**
 * The change landed and its history entry did not. The row is the truth, so
 * the reader gets it — with `historyRecorded: false` and a sentence that stops
 * a repeat. Returns null for any other error, which the caller re-throws.
 */
export function historyNotRecordedResponse(
  err: unknown,
  policy: Pick<UserProgramAccessPolicy, "canViewFinancialData">,
  status: number,
): Response | null {
  if (!(err instanceof RegisterHistoryWriteError)) return null;
  return landedAssumptionResponse(err.landed, policy, status, {
    historyRecorded: false,
    detail: describeHistoryNotRecorded(err.landed),
  });
}
