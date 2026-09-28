export const CHANGE_IMPACT_LEVELS = [
  "none",
  "limited",
  "material",
  "unknown",
] as const;

export type ChangeImpactLevel = (typeof CHANGE_IMPACT_LEVELS)[number];

export const SOLUTION_ROUTES = [
  "technical_product",
  "process_change",
  "operating_model_change",
  "combined_change",
  "unresolved",
] as const;

export type SolutionRoute = (typeof SOLUTION_ROUTES)[number];

export const SOLUTION_ROUTE_LABELS: Record<SolutionRoute, string> = {
  technical_product: "Technical product / data solution",
  process_change: "Business process change",
  operating_model_change: "Operating-model change",
  combined_change: "Combined business change",
  unresolved: "Not yet determined",
};

export const SOLUTION_OUTPUT_TYPES = [
  "reports_dashboards",
  "data_product",
  "workflow_automation",
  "service_operating_model",
  "mixed",
] as const;

export type SolutionOutputType = (typeof SOLUTION_OUTPUT_TYPES)[number];

export interface BusinessChangeAssessment {
  expectedWorkflowChange: ChangeImpactLevel;
  expectedRoleAccountabilityChange: ChangeImpactLevel;
  adoptionOwner: string;
  adoptionResponsibility: "business" | "delivery_team" | "shared";
  evidenceReference: string;
  validatedBy: string;
}

export interface SolutionRouteValidation {
  businessChangeAssessmentSnapshot: BusinessChangeAssessment;
  solutionOutput: SolutionOutputType;
  workflowChange: Exclude<ChangeImpactLevel, "unknown">;
  roleAccountabilityChange: Exclude<ChangeImpactLevel, "unknown">;
  evidenceReference: string;
  decision: "confirm" | "correct";
  selectedRoute: Exclude<SolutionRoute, "unresolved">;
  correctionRationale: string;
  validatedBy: string;
}

export interface ConfirmedSolutionRoute {
  route: Exclude<SolutionRoute, "unresolved">;
  recommendation: SolutionRoute;
  decision: "confirm" | "correct";
  evidenceReference: string;
  validatedBy: string;
  rationale: string;
}

function parseRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function isOneOf<T extends readonly string[]>(
  value: unknown,
  values: T,
): value is T[number] {
  return typeof value === "string" && values.includes(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function parseBusinessChangeAssessment(
  raw: unknown,
): BusinessChangeAssessment | null {
  const record = parseRecord(raw);
  if (
    !record ||
    !isOneOf(record.expectedWorkflowChange, CHANGE_IMPACT_LEVELS) ||
    record.expectedWorkflowChange === "unknown" ||
    !isOneOf(record.expectedRoleAccountabilityChange, CHANGE_IMPACT_LEVELS) ||
    record.expectedRoleAccountabilityChange === "unknown" ||
    !nonEmpty(record.adoptionOwner) ||
    !isOneOf(record.adoptionResponsibility, [
      "business",
      "delivery_team",
      "shared",
    ] as const) ||
    !nonEmpty(record.evidenceReference) ||
    !nonEmpty(record.validatedBy)
  ) {
    return null;
  }
  return {
    expectedWorkflowChange: record.expectedWorkflowChange,
    expectedRoleAccountabilityChange: record.expectedRoleAccountabilityChange,
    adoptionOwner: record.adoptionOwner.trim(),
    adoptionResponsibility: record.adoptionResponsibility,
    evidenceReference: record.evidenceReference.trim(),
    validatedBy: record.validatedBy.trim(),
  };
}

export function parseSolutionRouteValidation(
  raw: unknown,
): SolutionRouteValidation | null {
  const record = parseRecord(raw);
  const businessChangeAssessmentSnapshot = record
    ? parseBusinessChangeAssessment(record.businessChangeAssessmentSnapshot)
    : null;
  if (
    !record ||
    !businessChangeAssessmentSnapshot ||
    !isOneOf(record.solutionOutput, SOLUTION_OUTPUT_TYPES) ||
    !isOneOf(record.workflowChange, CHANGE_IMPACT_LEVELS) ||
    record.workflowChange === "unknown" ||
    !isOneOf(record.roleAccountabilityChange, CHANGE_IMPACT_LEVELS) ||
    record.roleAccountabilityChange === "unknown" ||
    !nonEmpty(record.evidenceReference) ||
    !isOneOf(record.decision, ["confirm", "correct"] as const) ||
    !isOneOf(record.selectedRoute, SOLUTION_ROUTES) ||
    record.selectedRoute === "unresolved" ||
    !nonEmpty(record.validatedBy) ||
    (record.decision === "correct" && !nonEmpty(record.correctionRationale))
  ) {
    return null;
  }

  return {
    businessChangeAssessmentSnapshot,
    solutionOutput: record.solutionOutput,
    workflowChange: record.workflowChange,
    roleAccountabilityChange: record.roleAccountabilityChange,
    evidenceReference: record.evidenceReference.trim(),
    decision: record.decision,
    selectedRoute: record.selectedRoute,
    correctionRationale:
      typeof record.correctionRationale === "string"
        ? record.correctionRationale.trim()
        : "",
    validatedBy: record.validatedBy.trim(),
  };
}

export function recommendSolutionRoute(
  validation: Pick<
    SolutionRouteValidation,
    "solutionOutput" | "workflowChange" | "roleAccountabilityChange"
  >,
): SolutionRoute {
  const workflowMaterial = validation.workflowChange === "material";
  const rolesMaterial = validation.roleAccountabilityChange === "material";

  if (workflowMaterial && rolesMaterial) return "combined_change";
  if (
    rolesMaterial ||
    validation.solutionOutput === "service_operating_model"
  ) {
    return "operating_model_change";
  }
  if (workflowMaterial || validation.solutionOutput === "workflow_automation") {
    return "process_change";
  }
  if (
    (validation.solutionOutput === "reports_dashboards" ||
      validation.solutionOutput === "data_product") &&
    validation.workflowChange !== "material" &&
    validation.roleAccountabilityChange !== "material"
  ) {
    return "technical_product";
  }
  return "unresolved";
}

export function resolveConfirmedSolutionRoute(args: {
  businessChangeAssessment: unknown;
  routeValidation: unknown;
  approvedEvidenceReferences: readonly string[];
}): ConfirmedSolutionRoute | null {
  const business = parseBusinessChangeAssessment(args.businessChangeAssessment);
  const validation = parseSolutionRouteValidation(args.routeValidation);
  if (
    !business ||
    !validation ||
    !args.approvedEvidenceReferences.includes(validation.evidenceReference) ||
    JSON.stringify(business) !==
      JSON.stringify(validation.businessChangeAssessmentSnapshot)
  ) {
    return null;
  }

  const recommendation = recommendSolutionRoute(validation);
  if (
    validation.decision === "confirm" &&
    validation.selectedRoute !== recommendation
  ) {
    return null;
  }
  if (
    validation.selectedRoute === "technical_product" &&
    (validation.workflowChange === "material" ||
      validation.roleAccountabilityChange === "material" ||
      (validation.solutionOutput !== "reports_dashboards" &&
        validation.solutionOutput !== "data_product"))
  ) {
    return null;
  }

  return {
    route: validation.selectedRoute,
    recommendation,
    decision: validation.decision,
    evidenceReference: validation.evidenceReference,
    validatedBy: validation.validatedBy,
    rationale:
      validation.decision === "correct"
        ? validation.correctionRationale
        : `Confirmed system recommendation: ${SOLUTION_ROUTE_LABELS[recommendation]}.`,
  };
}

export function isBusinessChangeAssessmentComplete(raw: unknown): boolean {
  return parseBusinessChangeAssessment(raw) !== null;
}

export function isSolutionRouteValidationComplete(args: {
  businessChangeAssessment: unknown;
  routeValidation: unknown;
  approvedEvidenceReferences: readonly string[];
}): boolean {
  return resolveConfirmedSolutionRoute(args) !== null;
}

export function stampSolutionRouteReviewer(
  raw: unknown,
  reviewerIdentity: string,
): unknown {
  const record = parseRecord(raw);
  if (!record || !reviewerIdentity.trim()) return raw;
  return JSON.stringify({ ...record, validatedBy: reviewerIdentity.trim() });
}

export function updateStructuredCaptureValue(
  raw: string,
  key: string,
  value: string,
): string {
  const record = parseRecord(raw) ?? {};
  return JSON.stringify({ ...record, [key]: value });
}
