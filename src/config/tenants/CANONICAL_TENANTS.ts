export type CanonicalTenant = {
  readonly key: string;
  readonly name: string;
  readonly industry: string;
  readonly mimics: string;
  readonly patternOverlays: readonly string[];
  readonly compliance?: TenantComplianceMetadata;
};

export type BaaExecutionStatus =
  | "not_required"
  | "not_started"
  | "in_review"
  | "executed"
  | "expired";

export type HipaaRiskAssessmentStatus =
  | "not_required"
  | "not_started"
  | "in_progress"
  | "completed";

export type TenantComplianceMetadata = {
  readonly regulatedDataProfile: "none" | "phi_possible";
  readonly baa: {
    readonly status: BaaExecutionStatus;
    readonly executionDate: string | null;
  };
  readonly hipaaRiskAssessment: {
    readonly status: HipaaRiskAssessmentStatus;
    readonly assessmentDate: string | null;
  };
  readonly owner: {
    readonly role: string;
    readonly name: string | null;
    readonly email: string | null;
  };
  readonly notes: string;
  readonly evidencePointer: string | null;
};

export const DEFAULT_TENANT_COMPLIANCE_METADATA = {
  regulatedDataProfile: "none",
  baa: {
    status: "not_required",
    executionDate: null,
  },
  hipaaRiskAssessment: {
    status: "not_required",
    assessmentDate: null,
  },
  owner: {
    role: "not_applicable",
    name: null,
    email: null,
  },
  notes:
    "No regulated healthcare compliance posture is configured for this tenant.",
  evidencePointer: null,
} as const satisfies TenantComplianceMetadata;

export const MERIDIAN_PHS_COMPLIANCE_METADATA = {
  regulatedDataProfile: "phi_possible",
  baa: {
    status: "not_started",
    executionDate: null,
  },
  hipaaRiskAssessment: {
    status: "not_started",
    assessmentDate: null,
  },
  owner: {
    role: "pilot_compliance_owner_tbd",
    name: null,
    email: null,
  },
  notes:
    "PHS pilot placeholder only. No signed BAA or completed HIPAA risk assessment is represented.",
  evidencePointer:
    "docs/enterprise-context/synthetic/meridian/15-risk-compliance-register.csv",
} as const satisfies TenantComplianceMetadata;

export const CANONICAL_TENANTS = [
  {
    key: "apex-retail",
    name: "Apex Retail",
    industry: "retail",
    mimics: "Generic mass-market retailer",
    patternOverlays: ["core", "retail-v1"],
  },
  {
    key: "meridian-health",
    name: "Meridian Health System",
    industry: "healthcare_provider",
    mimics: "Sacramento-based integrated delivery network plus health plan",
    patternOverlays: ["core"],
    compliance: MERIDIAN_PHS_COMPLIANCE_METADATA,
  },
  {
    key: "northstar-clinical",
    name: "Northstar Clinical Technologies",
    industry: "healthcare_medtech",
    mimics: "Solventum-shape healthcare products and devices company",
    patternOverlays: ["core"],
  },
  {
    key: "first-capital",
    name: "FS Demo",
    industry: "financial_services_banking",
    mimics: "Mid-tier banking institution",
    patternOverlays: ["core"],
  },
  {
    key: "skyharbor-air",
    name: "Airline Demo",
    industry: "airline",
    mimics: "Delta-shape global airline",
    patternOverlays: ["core", "airline-industry-v1"],
  },
  {
    key: "lakeshore-holdings",
    name: "Lakeshore Holdings",
    industry: "diversified",
    mimics: "Morgan Street Holdings-shape diversified holding company",
    patternOverlays: ["core"],
  },
  {
    key: "internal-golden",
    name: "AbarVa Golden Health System",
    industry: "healthcare_provider",
    mimics: "Permanent internal-only Golden Move regression/demo/proof fixture (Healthcare archetype, synthetic) — not a client, per docs/architecture/MOVES_OPERATING_MODEL.md's Golden Move proposal. Deliberately excluded from src/lib/client-config.ts's ALL_CLIENTS so it never appears in any client-facing picker/persona surface.",
    patternOverlays: ["core", "internal-fixture"],
  },
] as const satisfies readonly CanonicalTenant[];

export type CanonicalTenantKey = (typeof CANONICAL_TENANTS)[number]["key"];

export const CANONICAL_TENANT_KEYS = CANONICAL_TENANTS.map(
  (tenant) => tenant.key,
);

export function getCanonicalTenant(key: string): CanonicalTenant | null {
  return CANONICAL_TENANTS.find((tenant) => tenant.key === key) ?? null;
}

export function getTenantComplianceMetadata(
  key: string,
): TenantComplianceMetadata {
  return (
    getCanonicalTenant(key)?.compliance ?? DEFAULT_TENANT_COMPLIANCE_METADATA
  );
}

export function getTenantPatternOverlays(key: string): readonly string[] {
  return getCanonicalTenant(key)?.patternOverlays ?? [];
}
