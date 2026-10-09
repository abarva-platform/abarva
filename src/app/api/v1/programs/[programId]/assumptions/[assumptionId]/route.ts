// PATCH /api/v1/programs/:programId/assumptions/:assumptionId — edit a row.
//
// Body: `{ expectedRevision, ...fields }`. Only a proposed or open row can be
// edited, and only by a Move member (not a viewer). `expectedRevision` is the
// revision the person was looking at: a row that has moved since is refused
// with `stale_revision` (409) and nothing is written. The area cannot change —
// it is part of the register ID — and `origin`/`status` are never editable.

import "server-only";

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../_auth";
import { tenancyOrNamedErrorResponse } from "@/lib/programs/tenancy-catch-response";
import { editAssumption } from "@/lib/programs/assumption-register/store";
import {
  describeRegisterRefusal,
  registerRefusalResponse,
  storeRefusalResponse,
} from "@/lib/programs/assumption-register/assumption-register-refusal";
import { parseEditRequest } from "@/lib/programs/assumption-register/register-request";
import {
  historyNotRecordedResponse,
  isRegisterRowId,
  landedAssumptionResponse,
  openAssumptionRegister,
} from "@/lib/programs/assumption-register/register-route-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string; assumptionId: string }> },
) {
  try {
    const { programId, assumptionId } = await params;
    const ctx = await requireTenancy();
    const opened = await openAssumptionRegister(ctx, programId, "write");
    if (!opened.ok) return opened.response;
    if (!isRegisterRowId(assumptionId)) {
      return registerRefusalResponse({
        code: "unknown_assumption",
        which: "row",
      });
    }

    const parsed = parseEditRequest(await req.json().catch(() => null));
    if (!parsed.ok) {
      return registerRefusalResponse({
        code: "bad_request",
        field: parsed.field,
      });
    }

    try {
      const result = await editAssumption(
        ctx,
        programId,
        assumptionId,
        parsed.value.expectedRevision,
        parsed.value.edit,
        { kind: "person", userId: ctx.userId },
      );
      if (!result.ok) return storeRefusalResponse(result.refusal);
      return landedAssumptionResponse(result.record, opened.figures, 200);
    } catch (err) {
      const landed = historyNotRecordedResponse(err, opened.figures, 200);
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
