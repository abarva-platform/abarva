import { canonicalTenantKey } from "@/lib/tenant/aliases";

export const DENSE_ECL_ASSESSMENT_IDS: Record<string, string> = {
  "meridian-health": "assessment-dense-source-room-20260823",
  "skyharbor-air": "assessment-dense-skyharbor-20260827",
};

export const DEFAULT_DENSE_ECL_ASSESSMENT_ID =
  DENSE_ECL_ASSESSMENT_IDS["meridian-health"];

export function denseAssessmentIdForTenant(
  tenantKey: string | null | undefined,
): string {
  const canonical = canonicalTenantKey(tenantKey ?? "");
  return DENSE_ECL_ASSESSMENT_IDS[canonical] ?? DEFAULT_DENSE_ECL_ASSESSMENT_ID;
}
