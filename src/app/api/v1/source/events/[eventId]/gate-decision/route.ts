// POST /api/v1/source/events/{eventId}/gate-decision
//
// Assess a Source stage gate against current signals, apply the Maestro/Admin decision
// (enforcing the approve-with-gaps hard rules), and persist the resulting approval record
// as a durable File Cabinet artifact. Returns the assessment, Nexus guidance, the resolved
// gate, and the approval artifact id.

import type { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getAmsStageGate } from "@/lib/source/stage-gate/ams-stage-gates";
import { assessStageGate } from "@/lib/source/stage-gate/gate-resolver";
import { applyMaestroDecision } from "@/lib/source/stage-gate/maestro-override";
import { buildGateGuidance } from "@/lib/source/stage-gate/gate-guidance";
import {
  buildStageCompletion,
  type StageSignals,
} from "@/lib/source/stage-gate/completion-feeder";
import { persistApprovalArtifact } from "@/lib/source/stage-gate/approval-artifact";
import type { MaestroAction } from "@/lib/source/stage-gate/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIONS: MaestroAction[] = [
  "approve",
  "approve_with_gaps",
  "reject",
  "mark_preliminary",
  "defer",
  "assign_follow_up",
  "mark_client_to_complete",
  "force_advance",
];

interface Body {
  stageKey?: string;
  satisfiedRequirementKeys?: string[];
  signals?: StageSignals;
  action?: MaestroAction;
  rationale?: string;
  gapsAcknowledged?: string[];
  risksAccepted?: string[];
  followUpItems?: { item: string; owner: string }[];
}

export async function POST(
  req: NextRequest,
  ctxParam: { params: Promise<{ eventId: string }> },
) {
  try {
    const ctx = await requireTenancy();
    if (!ctx.clientKey)
      return Response.json({ error: "no_tenant_key" }, { status: 409 });
    const { eventId } = await ctxParam.params;
    if (!eventId?.trim())
      return Response.json(
        { error: "bad_request", detail: "eventId is required." },
        { status: 400 },
      );

    let body: Body;
    try {
      body = (await req.json()) as Body;
    } catch {
      return Response.json(
        { error: "bad_request", detail: "Body was not valid JSON." },
        { status: 400 },
      );
    }

    const def = body.stageKey ? getAmsStageGate(body.stageKey) : undefined;
    if (!def)
      return Response.json(
        { error: "bad_request", detail: "Unknown or missing stageKey (AMS)." },
        { status: 400 },
      );
    if (!body.action || !ACTIONS.includes(body.action))
      return Response.json(
        {
          error: "bad_request",
          detail: `action must be one of ${ACTIONS.join(", ")}.`,
        },
        { status: 400 },
      );

    const completion = body.satisfiedRequirementKeys
      ? { satisfiedRequirementKeys: new Set(body.satisfiedRequirementKeys) }
      : buildStageCompletion(def, body.signals ?? {});

    const assessment = assessStageGate(def, completion);
    const decisionResult = applyMaestroDecision(assessment, {
      action: body.action,
      approver: ctx.userId,
      approvedAt: new Date().toISOString(),
      ...(body.rationale ? { rationale: body.rationale } : {}),
      ...(body.gapsAcknowledged
        ? { gapsAcknowledged: body.gapsAcknowledged }
        : {}),
      ...(body.risksAccepted ? { risksAccepted: body.risksAccepted } : {}),
      ...(body.followUpItems ? { followUpItems: body.followUpItems } : {}),
    });

    if (!decisionResult.ok) {
      // hard rule: e.g. override past gaps without rationale
      return Response.json(
        {
          error: "invalid_decision",
          detail: decisionResult.error,
          assessment,
          guidance: buildGateGuidance(assessment),
        },
        { status: 422 },
      );
    }

    const approvalArtifact = await persistApprovalArtifact(
      decisionResult.resolved!.approvalRecord,
      {
        tenantKey: ctx.clientKey,
        sourceEventId: eventId,
        sourceEventRowId: eventId,
        generatedBy: ctx.userId,
      },
    );

    return Response.json({
      assessment,
      guidance: buildGateGuidance(assessment),
      resolved: {
        gateStatus: decisionResult.resolved!.gateStatus,
        artifactLabel: decisionResult.resolved!.artifactLabel,
        allowIssueReady: decisionResult.resolved!.allowIssueReady,
        gapsAcknowledged: decisionResult.resolved!.gapsAcknowledged,
        followUpItems: decisionResult.resolved!.followUpItems,
      },
      approvalArtifactId: approvalArtifact.id,
    });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not tenancy */
    }
    console.error("[POST /api/v1/source/events/[eventId]/gate-decision]", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
