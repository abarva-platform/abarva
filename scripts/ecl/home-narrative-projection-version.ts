export type NarrativeProjectionVersion = 1 | 2;

export function narrativeProjectionVersion(raw?: string | null): NarrativeProjectionVersion {
  if (raw === undefined || raw === null) return 1;
  if (raw === "1" || raw === "2") return Number(raw) as NarrativeProjectionVersion;
  throw new Error("Home narrative projection version must be exactly 1 or 2");
}

export function assertNarrativePlanVersion(
  plannedVersion: unknown,
  expectedVersion: NarrativeProjectionVersion,
): void {
  // Existing approved legacy plans did not declare their version.
  if (plannedVersion === undefined && expectedVersion === 1) return;
  if (plannedVersion !== expectedVersion)
    throw new Error("Approved Home narrative plan targets a different projection version");
}

export function assertNarrativeRowVersion(
  rows: readonly { tenant_key: string; assessment_id: string; projection_version: number }[],
  tenantKey: string,
  assessmentId: string,
  projectionVersion: NarrativeProjectionVersion,
): void {
  if (rows.some((row) => row.tenant_key !== tenantKey || row.assessment_id !== assessmentId ||
    row.projection_version !== projectionVersion))
    throw new Error("Home narrative rows do not match the exact tenant, assessment and projection version");
}
