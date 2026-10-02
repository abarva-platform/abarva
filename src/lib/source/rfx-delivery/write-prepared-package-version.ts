import { randomUUID } from "node:crypto";
import { createTxSession, type TxSessionRunner } from "@/lib/data-plane/read-adapters/azureSession";
import type { RfxReleaseSnapshotInput } from "./release-snapshot";
import { prepareRfxReleaseSnapshot } from "./release-snapshot";

export type PreparedPackageWriteInput = Omit<RfxReleaseSnapshotInput, "packageVersionId" | "version">;
export type PreparedPackageWriteResult =
  | { ok: true; id: string; packageVersionId: string; version: number; snapshotSha256: string }
  | { ok: false; code: "invalid_record" | "event_unavailable" | "release_not_ready" | "authority_unavailable"; defects?: readonly string[] };

const nonempty = (value: string | undefined): boolean => Boolean(value?.trim());
const uuid = (value: string): boolean =>
  /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);

export async function writePreparedRfxPackageVersion(
  input: PreparedPackageWriteInput,
  tx: TxSessionRunner = createTxSession("source-rfx-prepared-package-write"),
  newVersionId: () => string = randomUUID,
): Promise<PreparedPackageWriteResult> {
  const pkg = input.release.package;
  if (!nonempty(pkg.tenantKey) || !uuid(pkg.eventId) || !nonempty(pkg.packageId)) {
    return { ok: false, code: "invalid_record" };
  }

  try {
    return await tx(async (run) => {
      await run("SELECT set_config('app.tenant_key', $1, true)", [pkg.tenantKey]);
      const events = await run<{ id: string }>(
        `SELECT id FROM source_events
         WHERE client_key = $1 AND id = $2::uuid
         FOR UPDATE`,
        [pkg.tenantKey, pkg.eventId],
      );
      if (events.length !== 1) return { ok: false, code: "event_unavailable" };

      const previous = await run<{ version_number: number }>(
        `SELECT version_number FROM source_event_rfx_package_version
         WHERE client_key = $1 AND source_event_id = $2::uuid AND package_id = $3
         ORDER BY version_number DESC LIMIT 1`,
        [pkg.tenantKey, pkg.eventId, pkg.packageId],
      );
      if (previous.length > 1 || (previous.length === 1 &&
        (!Number.isSafeInteger(previous[0].version_number) || previous[0].version_number < 1))) {
        return { ok: false, code: "authority_unavailable" };
      }
      const version = (previous[0]?.version_number ?? 0) + 1;
      if (!Number.isSafeInteger(version)) return { ok: false, code: "authority_unavailable" };

      const packageVersionId = newVersionId();
      const prepared = prepareRfxReleaseSnapshot({ ...input, packageVersionId, version });
      if (!prepared.ready) return { ok: false, code: "release_not_ready", defects: prepared.defects };
      const { snapshotSha256, ...content } = prepared.snapshot;
      const snapshotJson = JSON.stringify(content);

      const inserted = await run<{ id: string }>(
        `INSERT INTO source_event_rfx_package_version (
           client_key, source_event_id, package_id, package_version_id,
           version_number, snapshot_json, snapshot_sha256, release_state,
           expires_at, approved_by_user_id, approved_at, approval_evidence_reference
         ) VALUES (
           $1, $2::uuid, $3, $4, $5, $6, $7, 'prepared',
           $8::timestamptz, $9, $10::timestamptz, $11
         ) RETURNING id`,
        [
          pkg.tenantKey, pkg.eventId, pkg.packageId, packageVersionId,
          version, snapshotJson, snapshotSha256, pkg.expiresAt,
          input.approvedByUserId, input.approvedAt, input.approvalEvidenceReference,
        ],
      );
      if (inserted.length !== 1) return { ok: false, code: "authority_unavailable" };
      return { ok: true, id: inserted[0].id, packageVersionId, version, snapshotSha256 };
    });
  } catch {
    return { ok: false, code: "authority_unavailable" };
  }
}
