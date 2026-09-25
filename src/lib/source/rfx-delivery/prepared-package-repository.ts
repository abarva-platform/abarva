import { createHash } from "node:crypto";
import { azureRead } from "@/lib/data-plane/azureRead";

export type PreparedRfxPackageVersion = {
  packageId: string;
  packageVersionId: string;
  version: number;
  snapshotSha256: string;
  artifactCount: number;
  recipientCount: number;
  expiresAt: string;
  approvedAt: string;
  state: "prepared";
};

type PreparedPackageRow = {
  client_key: string;
  source_event_id: string;
  package_id: string;
  package_version_id: string;
  version_number: number;
  snapshot_json: string;
  snapshot_sha256: string;
  release_state: string;
  expires_at: string | Date;
  approved_by_user_id: string;
  approved_at: string | Date;
  approval_evidence_reference: string;
};

const UNAVAILABLE = { registryAvailable: false, versions: [] } as const;

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function iso(value: string | Date): string | null {
  const time = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

function verifiedMetadata(
  row: PreparedPackageRow,
  input: { clientKey: string; eventId: string },
): PreparedRfxPackageVersion | null {
  if (
    row.client_key !== input.clientKey || row.source_event_id !== input.eventId ||
    row.release_state !== "prepared" ||
    !text(row.package_id) || !text(row.package_version_id) ||
    !Number.isSafeInteger(row.version_number) || row.version_number < 1 ||
    !text(row.approved_by_user_id) || !text(row.approval_evidence_reference) ||
    !text(row.snapshot_json) || !/^[0-9a-f]{64}$/.test(row.snapshot_sha256)
  ) return null;

  const expiresAt = iso(row.expires_at);
  const approvedAt = iso(row.approved_at);
  if (!expiresAt || !approvedAt || approvedAt > expiresAt) return null;
  const digest = createHash("sha256").update(row.snapshot_json).digest("hex");
  if (digest !== row.snapshot_sha256) return null;

  const payload: unknown = JSON.parse(row.snapshot_json);
  if (!object(payload) || !object(payload.authentication) ||
    !text(payload.authentication.method) || payload.authentication.method === "none" ||
    !Array.isArray(payload.artifacts) || payload.artifacts.length === 0 ||
    !Array.isArray(payload.recipients) || payload.recipients.length === 0 ||
    payload.tenantKey !== input.clientKey || payload.eventId !== input.eventId ||
    payload.packageId !== row.package_id ||
    payload.packageVersionId !== row.package_version_id ||
    payload.version !== row.version_number ||
    payload.approvedByUserId !== row.approved_by_user_id ||
    payload.approvalEvidenceReference !== row.approval_evidence_reference ||
    !text(payload.approvedAt) || iso(payload.approvedAt) !== approvedAt ||
    !text(payload.expiresAt) || iso(payload.expiresAt) !== expiresAt
  ) return null;

  return {
    packageId: row.package_id,
    packageVersionId: row.package_version_id,
    version: row.version_number,
    snapshotSha256: row.snapshot_sha256,
    artifactCount: payload.artifacts.length,
    recipientCount: payload.recipients.length,
    expiresAt,
    approvedAt,
    state: "prepared",
  };
}

/** Historical prepared-version readback only; it never implies current authority or issuance. */
export async function readPreparedRfxPackagesForEvent(input: {
  clientKey: string;
  eventId: string;
}): Promise<{ registryAvailable: boolean; versions: readonly PreparedRfxPackageVersion[] }> {
  if (!text(input.clientKey) || !text(input.eventId)) return UNAVAILABLE;

  try {
    return await azureRead.withSession(async (run) => {
      await run("SELECT set_config('app.tenant_key', $1, false)", [input.clientKey]);
      const rows = await run<PreparedPackageRow>(
        `SELECT client_key, source_event_id, package_id, package_version_id,
                version_number, snapshot_json, snapshot_sha256, release_state,
                expires_at, approved_by_user_id, approved_at,
                approval_evidence_reference
         FROM source_event_rfx_package_version
         WHERE client_key = $1 AND source_event_id = $2::uuid
         ORDER BY version_number DESC, package_version_id ASC`,
        [input.clientKey, input.eventId],
      );
      const versions = rows.map((row) => verifiedMetadata(row, input));
      if (versions.some((version) => version === null)) return UNAVAILABLE;
      const versionIds = versions.map((version) => version!.packageVersionId);
      if (new Set(versionIds).size !== versionIds.length) return UNAVAILABLE;
      return { registryAvailable: true, versions: versions as PreparedRfxPackageVersion[] };
    });
  } catch {
    return UNAVAILABLE;
  }
}
