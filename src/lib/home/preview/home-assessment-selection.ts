import { azureRead } from "@/lib/data-plane/azureRead";
import { denseAssessmentIdForTenant } from "@/lib/ecl/denseAssessment";

export async function selectedHomeAssessmentId(tenantKey: string): Promise<string> {
  const rows = await azureRead.query<{ assessment_id: string }>(
    `select assessment_id
     from ecl_projection.home_active_assessment
     where tenant_key = $1 and state = 'active'`,
    [tenantKey],
    { missingTable: "empty" },
  );
  if (rows.length > 1) {
    throw new Error("Home has multiple declared active assessments");
  }
  return rows[0]?.assessment_id ?? denseAssessmentIdForTenant(tenantKey);
}
