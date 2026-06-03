export type SetupAiGovernanceBacklogId = "T244" | "T245";

export type SetupAiSuggestionDomain =
  | "tenant_configuration"
  | "dimension_mapping"
  | "connector_setting"
  | "approval_policy"
  | "anomaly_remediation";

export type SetupAiGovernanceState =
  | "suggested"
  | "admin_review_required"
  | "approved"
  | "rejected"
  | "triage_acknowledged";

export interface SetupAiGovernanceRequest {
  readonly id: string;
  readonly backlogId: SetupAiGovernanceBacklogId;
  readonly tenantKey: string;
  readonly domain: SetupAiSuggestionDomain;
  readonly aiSummary: string;
  readonly evidenceIds: readonly string[];
  readonly detectedAt: string;
  readonly state: SetupAiGovernanceState;
  readonly adminUserId?: string | null;
  readonly adminReason?: string | null;
  readonly triageAcknowledgedAt?: string | null;
}

export interface SetupAiGovernanceDecision {
  readonly requestId: string;
  readonly backlogId: SetupAiGovernanceBacklogId;
  readonly canApply: boolean;
  readonly canRemediate: boolean;
  readonly requiredHumanAction: string;
  readonly missing: readonly string[];
  readonly auditEvidence: readonly string[];
}

export interface SetupAiGovernanceSummary {
  readonly total: number;
  readonly blockedTotal: number;
  readonly readyToApplyTotal: number;
  readonly approvalRequiredTotal: number;
  readonly triageRequiredTotal: number;
  readonly decisions: readonly SetupAiGovernanceDecision[];
}

export function evaluateSetupAiGovernanceRequest(
  request: SetupAiGovernanceRequest,
): SetupAiGovernanceDecision {
  const missing: string[] = [];

  if (request.evidenceIds.length === 0) {
    missing.push("evidence_ids");
  }

  if (request.backlogId === "T244") {
    if (request.state !== "approved") {
      missing.push("admin_approval");
    }
    if (!request.adminUserId) {
      missing.push("admin_user_id");
    }
    if (!request.adminReason || request.adminReason.trim().length === 0) {
      missing.push("admin_reason");
    }
  }

  if (request.backlogId === "T245") {
    if (request.state !== "triage_acknowledged") {
      missing.push("triage_acknowledgement");
    }
    if (!request.adminUserId) {
      missing.push("triage_admin_user_id");
    }
    if (!request.adminReason || request.adminReason.trim().length === 0) {
      missing.push("triage_reason");
    }
    if (!request.triageAcknowledgedAt) {
      missing.push("triage_acknowledged_at");
    }
  }

  const canApply = request.backlogId === "T244" && missing.length === 0;
  const canRemediate = request.backlogId === "T245" && missing.length === 0;

  return {
    requestId: request.id,
    backlogId: request.backlogId,
    canApply,
    canRemediate,
    requiredHumanAction: canApply || canRemediate
      ? "Human control satisfied; retain evidence before execution."
      : request.backlogId === "T244"
        ? "Admin approval with a recorded reason is required before applying the AI-suggested setup change."
        : "Human triage acknowledgement with a recorded reason is required before any AI-detected anomaly remediation.",
    missing,
    auditEvidence: [
      "tenant_key",
      "ai_summary",
      "evidence_ids",
      "admin_user_id",
      "admin_reason",
      request.backlogId === "T245" ? "triage_acknowledged_at" : "approval_timestamp",
    ],
  };
}

export function summarizeSetupAiGovernance(
  requests: readonly SetupAiGovernanceRequest[],
): SetupAiGovernanceSummary {
  const decisions = requests.map(evaluateSetupAiGovernanceRequest);
  return {
    total: requests.length,
    blockedTotal: decisions.filter((decision) => !decision.canApply && !decision.canRemediate).length,
    readyToApplyTotal: decisions.filter((decision) => decision.canApply || decision.canRemediate).length,
    approvalRequiredTotal: decisions.filter(
      (decision) => decision.backlogId === "T244" && !decision.canApply,
    ).length,
    triageRequiredTotal: decisions.filter(
      (decision) => decision.backlogId === "T245" && !decision.canRemediate,
    ).length,
    decisions,
  };
}
