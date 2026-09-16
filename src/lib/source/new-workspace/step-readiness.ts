export type StepStatus =
  | "needs_work"
  | "ready_to_submit"
  | "awaiting_approval"
  | "complete"
  | "blocked";

export type EvidenceDisposition =
  | { kind: "missing" }
  | { kind: "uploaded"; versionId: string }
  | { kind: "accepted"; versionId: string; acceptedBy: string }
  | { kind: "explicit_unknown"; recordedBy: string; reason: string };

export type NamedApproval = {
  role: "business_owner" | "procurement_lead" | "release_approver";
  actorId: string;
  versionId: string;
  decision: "approved" | "changes_requested";
};

type StepBase = { holdReasons?: readonly string[] };

export type RequestStepInput = StepBase & {
  step: "request";
  versionId: string;
  requesterId: string;
  businessOwnerId: string;
  need: string;
  category: string;
  decisionDate: string;
  accepted?: { versionId: string; actorId: string };
};

export type DefineStepInput = StepBase & {
  step: "define";
  outcome: string;
  scopeIn: string;
  scopeOut: string;
  motion: string;
  ownerId: string;
  decisionDate: string;
  baseline: EvidenceDisposition;
  strategy: { versionId: string; state: "draft" | "uploaded" | "accepted"; acceptedBy?: string };
  submittedVersionId?: string;
  approvals: readonly NamedApproval[];
};

export type SupplierSelection = {
  selectionId: string;
  legalEntityId: string;
  contactId: string;
  disqualified: boolean;
  nda?: {
    state: "not_started" | "pending" | "approved" | "waived";
    legalEntityId: string;
    scopeId: string;
    expiresOn: string;
    actorId: string;
    reason?: string;
  };
};

export type SuppliersStepInput = StepBase & {
  step: "suppliers_nda";
  selectionVersionId: string;
  confirmedVersionId?: string;
  requiredScopeId: string;
  asOfDate: string;
  selected: readonly SupplierSelection[];
};

export type RfiStepInput = StepBase & {
  step: "rfi";
  package: { versionId: string; state: "draft" | "uploaded" | "accepted"; acceptedBy?: string };
  selected: readonly SupplierSelection[];
  selectionVersionId: string;
  confirmedSelectionVersionId: string;
  requiredScopeId: string;
  asOfDate: string;
  recipientSnapshotId: string;
  submittedVersionId?: string;
  approvals: readonly NamedApproval[];
  release?: { packageVersionId: string; recipientSnapshotId: string; actorId: string };
  decision?: {
    kind: "close" | "extend" | "convert";
    packageVersionId: string;
    actorId: string;
  };
};

export type StepReadinessInput =
  | RequestStepInput
  | DefineStepInput
  | SuppliersStepInput
  | RfiStepInput;

export type StepReadiness = {
  step: StepReadinessInput["step"];
  status: StepStatus;
  completedRequirements: string[];
  unmetRequirements: string[];
  baselineEvidencePresent?: boolean;
  nextAction: { label: string; disabled: boolean; disabledReason?: string };
};

const filled = (value: string | undefined): boolean => Boolean(value?.trim());

export function isAcceptedEvidence(value: EvidenceDisposition): boolean {
  return value.kind === "accepted" && filled(value.versionId) && filled(value.acceptedBy);
}

function isResolvedDisposition(value: EvidenceDisposition): boolean {
  return isAcceptedEvidence(value) ||
    (value.kind === "explicit_unknown" && filled(value.recordedBy) && filled(value.reason));
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function supplierGaps(
  selected: readonly SupplierSelection[],
  requiredScopeId: string,
  asOfDate: string,
): { missing: string[]; blocked: string[]; pending: boolean } {
  const missing: string[] = [];
  const blocked: string[] = [];
  let pending = false;
  if (!selected.length) missing.push("Select at least one supplier");
  if (!filled(requiredScopeId) || !validDate(asOfDate)) blocked.push("Establish the event scope and as-of date");
  const ids = selected.map((supplier) => supplier.selectionId);
  if (ids.some((id) => !filled(id)) || new Set(ids).size !== ids.length) {
    blocked.push("Resolve duplicate or missing supplier selections");
  }
  for (const supplier of selected) {
    const name = filled(supplier.selectionId) ? supplier.selectionId : "Selected supplier";
    if (supplier.disqualified) blocked.push(`${name}: supplier is disqualified`);
    if (!filled(supplier.legalEntityId)) missing.push(`${name}: select a legal entity`);
    if (!filled(supplier.contactId)) missing.push(`${name}: select a contact`);
    if (supplier.nda?.state === "pending") {
      pending = true;
      continue;
    }
    if (supplier.nda?.state !== "approved" && supplier.nda?.state !== "waived") {
      missing.push(`${name}: clear NDA coverage or record a waiver`);
      continue;
    }
    if (
      !filled(supplier.nda.actorId) ||
      (supplier.nda.state === "waived" && !filled(supplier.nda.reason)) ||
      !filled(supplier.legalEntityId) ||
      supplier.nda.legalEntityId !== supplier.legalEntityId ||
      supplier.nda.scopeId !== requiredScopeId ||
      !validDate(supplier.nda.expiresOn) ||
      supplier.nda.expiresOn < asOfDate
    ) {
      blocked.push(`${name}: NDA or waiver does not cover this entity, scope, and date`);
    }
  }
  return { missing, blocked, pending };
}

function result(
  step: StepReadinessInput["step"],
  status: StepStatus,
  label: string,
  completedRequirements: string[],
  unmetRequirements: string[],
  baselineEvidencePresent?: boolean,
): StepReadiness {
  const disabled = status === "needs_work" || status === "awaiting_approval" || status === "blocked";
  return {
    step,
    status,
    completedRequirements,
    unmetRequirements,
    ...(baselineEvidencePresent === undefined ? {} : { baselineEvidencePresent }),
    nextAction: {
      label,
      disabled,
      ...(disabled ? { disabledReason: unmetRequirements.join("; ") } : {}),
    },
  };
}

function assessRequest(input: RequestStepInput): StepReadiness {
  const requirements = [
    ["Identify the request version", input.versionId],
    ["Name the requester", input.requesterId],
    ["Name the business owner", input.businessOwnerId],
    ["Describe the need", input.need],
    ["Choose a category", input.category],
    ["Set a decision date", validDate(input.decisionDate) ? input.decisionDate : ""],
  ] as const;
  const completed: string[] = requirements.filter(([, value]) => filled(value)).map(([label]) => label);
  const missing: string[] = requirements.filter(([, value]) => !filled(value)).map(([label]) => label);
  const blocked = input.holdReasons?.filter(filled) ?? [];
  if (blocked.length) return result(input.step, "blocked", "Accept for planning", completed, [...blocked, ...missing]);
  if (missing.length) return result(input.step, "needs_work", "Accept for planning", completed, missing);
  if (input.accepted?.versionId === input.versionId && filled(input.accepted.actorId)) {
    return result(input.step, "complete", "Continue to Define", [...completed, "Request accepted"], []);
  }
  return result(input.step, "ready_to_submit", "Accept for planning", completed, []);
}

function assessDefine(input: DefineStepInput): StepReadiness {
  const requirements = [
    ["State the outcome", input.outcome],
    ["Confirm in-scope work", input.scopeIn],
    ["Confirm out-of-scope work", input.scopeOut],
    ["Choose a sourcing motion", input.motion],
    ["Name the owner", input.ownerId],
    ["Set a decision date", validDate(input.decisionDate) ? input.decisionDate : ""],
  ] as const;
  const completed: string[] = requirements.filter(([, value]) => filled(value)).map(([label]) => label);
  const missing: string[] = requirements.filter(([, value]) => !filled(value)).map(([label]) => label);
  if (isResolvedDisposition(input.baseline)) {
    completed.push(input.baseline.kind === "explicit_unknown" ? "Baseline unknown recorded" : "Baseline evidence accepted");
  } else {
    missing.push("Accept baseline evidence or record why it is unknown");
  }
  if (input.strategy.state === "accepted" && filled(input.strategy.versionId) && filled(input.strategy.acceptedBy)) completed.push("Strategy version accepted");
  else missing.push("Accept the Strategy version");
  const current = input.approvals.filter((approval) => approval.versionId === input.strategy.versionId);
  const approved = (role: NamedApproval["role"]) => current.find((approval) =>
    approval.role === role && approval.decision === "approved" && filled(approval.actorId));
  const business = approved("business_owner");
  const procurement = approved("procurement_lead");
  const blocked = [...(input.holdReasons?.filter(filled) ?? [])];
  if (current.some((approval) => approval.decision === "changes_requested")) blocked.push("Changes requested for this Strategy version");
  if (business && procurement && business.actorId === procurement.actorId) blocked.push("Two distinct people must approve the Strategy");
  if (blocked.length) return result(input.step, "blocked", "Submit Strategy for approval", completed, [...blocked, ...missing], isAcceptedEvidence(input.baseline));
  if (missing.length) return result(input.step, "needs_work", "Submit Strategy for approval", completed, missing, isAcceptedEvidence(input.baseline));
  if (input.submittedVersionId !== input.strategy.versionId) {
    return result(input.step, "ready_to_submit", "Submit Strategy for approval", completed, [], isAcceptedEvidence(input.baseline));
  }
  if (business) completed.push("Business owner approved this version");
  if (procurement) completed.push("Procurement lead approved this version");
  if (business && procurement) return result(input.step, "complete", "Continue to Suppliers & NDA", completed, [], isAcceptedEvidence(input.baseline));
  const waiting = [
    ...(!business ? ["Business owner approval pending"] : []),
    ...(!procurement ? ["Procurement lead approval pending"] : []),
  ];
  return result(input.step, "awaiting_approval", "Continue to Suppliers & NDA", completed, waiting, isAcceptedEvidence(input.baseline));
}

function assessSuppliers(input: SuppliersStepInput): StepReadiness {
  const { missing, blocked, pending } = supplierGaps(input.selected, input.requiredScopeId, input.asOfDate);
  blocked.unshift(...(input.holdReasons?.filter(filled) ?? []));
  const completed = input.selected.filter((supplier) => {
    const gaps = supplierGaps([supplier], input.requiredScopeId, input.asOfDate);
    return !gaps.missing.length && !gaps.blocked.length && !gaps.pending;
  }).map((supplier) => `${supplier.selectionId}: ready`);
  if (!filled(input.selectionVersionId)) missing.push("Identify the supplier selection version");
  if (blocked.length) return result(input.step, "blocked", "Confirm selected suppliers", completed, [...blocked, ...missing]);
  if (missing.length) return result(input.step, "needs_work", "Confirm selected suppliers", completed, missing);
  if (pending) return result(input.step, "awaiting_approval", "Confirm selected suppliers", completed, ["NDA clearance pending"]);
  if (input.confirmedVersionId === input.selectionVersionId) {
    return result(input.step, "complete", "Continue to RFI", [...completed, "Supplier selection confirmed"], []);
  }
  return result(input.step, "ready_to_submit", "Confirm selected suppliers", completed, []);
}

function assessRfi(input: RfiStepInput): StepReadiness {
  const { missing, blocked, pending } = supplierGaps(input.selected, input.requiredScopeId, input.asOfDate);
  blocked.unshift(...(input.holdReasons?.filter(filled) ?? []));
  const completed: string[] = [];
  if (input.package.state === "accepted" && filled(input.package.versionId) && filled(input.package.acceptedBy)) completed.push("RFI package accepted");
  else missing.push("Accept the versioned RFI package");
  if (!filled(input.selectionVersionId) || input.confirmedSelectionVersionId !== input.selectionVersionId) {
    missing.push("Confirm the current supplier selection");
  } else completed.push("Supplier selection confirmed");
  if (!filled(input.recipientSnapshotId)) missing.push("Freeze the recipient and NDA snapshot");
  if (!missing.some((item) => item.startsWith("Select")) && input.selected.length) completed.push("Recipients selected");
  if (input.release && (
    input.release.packageVersionId !== input.package.versionId ||
    input.release.recipientSnapshotId !== input.recipientSnapshotId ||
    !filled(input.release.actorId)
  )) blocked.push("Release does not match the current package and recipients");
  if (input.decision && (!input.release || input.decision.packageVersionId !== input.package.versionId || !filled(input.decision.actorId))) {
    blocked.push("RFI decision must follow release of this package by a named person");
  }
  if (blocked.length) return result(input.step, "blocked", "Submit RFI for release approval", completed, [...blocked, ...missing]);
  if (missing.length) return result(input.step, "needs_work", "Submit RFI for release approval", completed, missing);
  if (pending) return result(input.step, "awaiting_approval", "Submit RFI for release approval", completed, ["NDA clearance pending"]);
  const approval = input.approvals.find((item) => item.role === "release_approver" &&
    item.versionId === input.package.versionId && item.decision === "approved" && filled(item.actorId));
  if (input.approvals.some((item) => item.versionId === input.package.versionId && item.decision === "changes_requested")) {
    return result(input.step, "blocked", "Submit RFI for release approval", completed, ["Changes requested for this RFI package"]);
  }
  if (input.submittedVersionId !== input.package.versionId) {
    if (input.release) return result(input.step, "blocked", "Submit RFI for release approval", completed, ["Release has no submission for this package version"]);
    return result(input.step, "ready_to_submit", "Submit RFI for release approval", completed, []);
  }
  if (!approval) return result(input.step, input.release ? "blocked" : "awaiting_approval", "Release RFI to cleared suppliers", completed, [input.release ? "Release has no named approval for this package version" : "Named release approval pending"]);
  completed.push("Release approved for this package");
  if (!input.release) return result(input.step, "ready_to_submit", "Release RFI to cleared suppliers", completed, []);
  completed.push("RFI released to cleared suppliers");
  if (!input.decision) return result(input.step, "ready_to_submit", "Record RFI decision", completed, []);
  return result(input.step, "complete", "View RFI outcome", [...completed, "RFI decision recorded"], []);
}

export function assessStepReadiness(input: StepReadinessInput): StepReadiness {
  switch (input.step) {
    case "request": return assessRequest(input);
    case "define": return assessDefine(input);
    case "suppliers_nda": return assessSuppliers(input);
    case "rfi": return assessRfi(input);
  }
}
