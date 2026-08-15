import { NextResponse } from "next/server";

import { getActiveClientRow } from "@/lib/active-client";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import {
  requireTenancy,
  TenancyError,
  tenancyErrorResponse,
} from "@/lib/auth/tenancy";
import {
  ContractOptimizationWorkflowActionError,
  runContractOptimizationWorkflowAction,
  type ContractOptimizationWorkflowAction,
} from "@/lib/source/data-model/contract-optimization-workflow-actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ contractId: string }>;
};

interface WorkflowActionBody {
  action?: ContractOptimizationWorkflowAction;
  opportunityId?: string | null;
  rationale?: string | null;
}

export async function POST(request: Request, { params }: RouteContext) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error);
  }

  const [{ contractId: rawContractId }, activeClient] = await Promise.all([
    params,
    getActiveClientRow().catch(() => null),
  ]);
  const contractId = decodeURIComponent(rawContractId).trim();
  if (!activeClient?.key) {
    return NextResponse.json(
      {
        ok: false,
        error: "no_client",
        detail: "No active client for Source Optimize workflow action.",
      },
      { status: 403 },
    );
  }

  let body: WorkflowActionBody;
  try {
    body = (await request.json()) as WorkflowActionBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }
  const action = body.action;
  if (!isWorkflowAction(action)) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_action",
        detail: "Unsupported Source Optimize workflow action.",
      },
      { status: 400 },
    );
  }

  const accessPolicy = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: activeClient.key,
  }).catch(() => null);
  const allowed =
    action === "approve_request" || action === "send_back_request"
      ? Boolean(accessPolicy?.canApproveSourceStages)
      : Boolean(
          accessPolicy?.canCreateSourceEvents ||
          accessPolicy?.canApproveSourceStages,
        );
  if (!allowed) {
    return NextResponse.json(
      {
        ok: false,
        error:
          action === "approve_request" || action === "send_back_request"
            ? "forbidden_source_approval_required"
            : "forbidden_source_create_required",
        detail:
          "Source workflow permissions are required to update the optimization case.",
      },
      { status: 403 },
    );
  }

  try {
    const result = await runContractOptimizationWorkflowAction({
      tenantKey: activeClient.key,
      contractId,
      opportunityId: body.opportunityId,
      action,
      rationale: body.rationale,
      actorRole: tenancy.role ?? tenancy.tenantRole ?? null,
      actorUserId: tenancy.userId,
    });
    return NextResponse.json(result, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ContractOptimizationWorkflowActionError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.code,
          detail: error.message,
        },
        { status: statusForActionError(error.code) },
      );
    }
    if (error instanceof TenancyError) return tenancyErrorResponse(error);
    return NextResponse.json(
      {
        ok: false,
        error: "workflow_action_failed",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

function isWorkflowAction(
  action: WorkflowActionBody["action"],
): action is ContractOptimizationWorkflowAction {
  return (
    action === "create_approval_request" ||
    action === "approve_request" ||
    action === "send_back_request" ||
    action === "record_agreed_outcome" ||
    action === "request_finance_confirmation"
  );
}

function statusForActionError(
  code: ContractOptimizationWorkflowActionError["code"],
): number {
  switch (code) {
    case "missing_dataset":
    case "missing_case":
    case "missing_opportunity":
      return 404;
    case "missing_baseline":
    case "baseline_conflict":
    case "opportunity_not_ready":
    case "missing_pending_request":
    case "missing_approved_request":
    case "missing_agreed_outcome":
      return 409;
    case "missing_rationale":
    case "invalid_action":
      return 400;
    default:
      return 500;
  }
}
