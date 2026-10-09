// POST /api/v1/programs/:programId/assumptions/:assumptionId/decision
//
// Body: `{ action, expectedRevision, ... }` where `action` is one of
//   - `accept`    — a proposed row joins the working register (open);
//   - `reject`    — a proposed row is set aside for good;
//   - `answer`    — `{ outcome: "confirmed" | "corrected", answerSource,
//                    answer?, answerFigure?, answerValue? }`. An answer must
//                    name its source; a correction must state its answer;
//   - `supersede` — `{ supersededBy }` points at an existing row of this Move,
//                    or `{ replacement: {...} }` adds a NEW row (new ID, same
//                    area) and points this one at it.
//
// Only a person decides: this route always acts as actor kind `person`, and
// aVa has no path here. A supersede that stores its replacement and is then
// refused names the replacement that landed, so the consultant finishes the
// supersede against it instead of adding a second one.

import "server-only";

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../../_auth";
import { tenancyOrNamedErrorResponse } from "@/lib/programs/tenancy-catch-response";
import {
  RegisterHistoryWriteError,
  supersedeAssumption,
  transitionAssumption,
  type RegisterActor,
} from "@/lib/programs/assumption-register/store";
import {
  describeLandedReplacement,
  describeRegisterRefusal,
  registerRefusalResponse,
  storeRefusalResponse,
} from "@/lib/programs/assumption-register/assumption-register-refusal";
import {
  assumptionForViewer,
  parseDecisionRequest,
} from "@/lib/programs/assumption-register/register-request";
import type { TransitionRequest } from "@/lib/programs/assumption-register/model";
import {
  historyNotRecordedResponse,
  isRegisterRowId,
  landedAssumptionResponse,
  openAssumptionRegister,
} from "@/lib/programs/assumption-register/register-route-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string; assumptionId: string }> },
) {
  try {
    const { programId, assumptionId } = await params;
    const ctx = await requireTenancy();
    const opened = await openAssumptionRegister(ctx, programId, "write");
    if (!opened.ok) return opened.response;
    // Figures are projected for this viewer (see `seesRegisterFigures`).
    const policy = opened.figures;
    if (!isRegisterRowId(assumptionId)) {
      return registerRefusalResponse({
        code: "unknown_assumption",
        which: "row",
      });
    }

    const parsed = parseDecisionRequest(await req.json().catch(() => null));
    if (!parsed.ok) {
      return registerRefusalResponse({
        code: "bad_request",
        field: parsed.field,
      });
    }
    const decision = parsed.value;
    const actor: RegisterActor = { kind: "person", userId: ctx.userId };

    let request: TransitionRequest;
    if (decision.action !== "supersede") {
      request = decision.request;
    } else if (decision.target.kind === "existing") {
      if (!isRegisterRowId(decision.target.supersededBy)) {
        return registerRefusalResponse({
          code: "unknown_assumption",
          which: "supersede_target",
        });
      }
      request = {
        action: "supersede",
        supersededBy: decision.target.supersededBy,
      };
    } else {
      try {
        const result = await supersedeAssumption(
          ctx,
          programId,
          assumptionId,
          decision.expectedRevision,
          decision.target.replacement,
          actor,
        );
        if (!result.ok) {
          if (!result.replacement) return storeRefusalResponse(result.refusal);
          return storeRefusalResponse(
            result.refusal,
            { replacement: assumptionForViewer(result.replacement, policy) },
            describeLandedReplacement(result.replacement),
          );
        }
        return landedAssumptionResponse(result.record, policy, 200, {
          replacement: assumptionForViewer(result.replacement, policy),
        });
      } catch (err) {
        // The replacement's own history write failed: the replacement row
        // landed and the supersede was never attempted.
        if (
          err instanceof RegisterHistoryWriteError &&
          err.landed.id !== assumptionId
        ) {
          return registerRefusalResponse(
            { code: "supersede_incomplete", replacement: err.landed },
            { replacement: assumptionForViewer(err.landed, policy) },
          );
        }
        const landed = historyNotRecordedResponse(err, policy, 200);
        if (landed) return landed;
        throw err;
      }
    }

    try {
      const result = await transitionAssumption(
        ctx,
        programId,
        assumptionId,
        decision.expectedRevision,
        request,
        actor,
      );
      if (!result.ok) return storeRefusalResponse(result.refusal);
      return landedAssumptionResponse(result.record, policy, 200);
    } catch (err) {
      const landed = historyNotRecordedResponse(err, policy, 200);
      if (landed) return landed;
      throw err;
    }
  } catch (err) {
    return tenancyOrNamedErrorResponse(err, tenancyErrorResponse, {
      code: "register_write_unconfirmed",
      detail: describeRegisterRefusal({ code: "register_write_unconfirmed" }),
    });
  }
}
