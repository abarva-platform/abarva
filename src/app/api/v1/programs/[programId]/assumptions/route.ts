// GET  /api/v1/programs/:programId/assumptions — this Move's assumptions register.
// POST /api/v1/programs/:programId/assumptions — a team member adds a row.
//
// Flagged by `moves_assumption_register_v1`. A row created here is ALWAYS a
// team row: `origin` is `team` and the store opens it at once. The body cannot
// set `origin` or `status` — aVa proposes only through its own tool, as a
// `proposed` row a person must accept.
//
// Every refusal carries an authored `detail` (assumption-register-refusal.ts).
// The catch answers with a NAMED refusal instead of letting the shared tenancy
// responder re-throw into an unbodied 500.

import "server-only";

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../_auth";
import { tenancyOrNamedErrorResponse } from "@/lib/programs/tenancy-catch-response";
import {
  createAssumption,
  listAssumptions,
} from "@/lib/programs/assumption-register/store";
import {
  describeRegisterRefusal,
  registerRefusalResponse,
  storeRefusalResponse,
} from "@/lib/programs/assumption-register/assumption-register-refusal";
import {
  assumptionForViewer,
  parseNewAssumptionRequest,
} from "@/lib/programs/assumption-register/register-request";
import {
  canWriteRegister,
  historyNotRecordedResponse,
  landedAssumptionResponse,
  openAssumptionRegister,
} from "@/lib/programs/assumption-register/register-route-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const opened = await openAssumptionRegister(ctx, programId, "read");
    if (!opened.ok) return opened.response;
    const records = await listAssumptions(ctx, programId);
    return Response.json({
      ok: true,
      assumptions: records.map((record) =>
        assumptionForViewer(record, opened.policy),
      ),
      figuresRedacted: !opened.policy.canViewFinancialData,
      canEdit: canWriteRegister(opened.policy, programId),
    });
  } catch (err) {
    return tenancyOrNamedErrorResponse(err, tenancyErrorResponse, {
      code: "register_read_failed",
      detail: describeRegisterRefusal({ code: "register_read_failed" }),
    });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const opened = await openAssumptionRegister(ctx, programId, "write");
    if (!opened.ok) return opened.response;

    const parsed = parseNewAssumptionRequest(
      await req.json().catch(() => null),
    );
    if (!parsed.ok) {
      return registerRefusalResponse({
        code: "bad_request",
        field: parsed.field,
      });
    }

    try {
      const result = await createAssumption(ctx, programId, parsed.value, {
        kind: "person",
        userId: ctx.userId,
      });
      if (!result.ok) return storeRefusalResponse(result.refusal);
      return landedAssumptionResponse(result.record, opened.policy, 201);
    } catch (err) {
      const landed = historyNotRecordedResponse(err, opened.policy, 201);
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
