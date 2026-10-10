import { createHash } from "node:crypto";
import {
  createTxSession,
  type TxSessionRunner,
} from "@/lib/data-plane/read-adapters/azureSession";

export type RfxReleaseAuthorizationInput = {
  clientKey: string;
  eventId: string;
  packageVersionId: string;
  snapshotSha256: string;
  authorizedByUserId: string;
  releaseEvidenceReference: string;
};

export type RfxReleaseAuthorizationResult =
  | { ok: true; authorizationId: string; snapshotSha256: string }
  | {
      ok: false;
      code:
        | "invalid_record"
        | "event_unavailable"
        | "package_unavailable"
        | "package_expired"
        | "digest_mismatch"
        | "already_authorized"
        | "authority_unavailable";
    };

type PreparedRow = {
  client_key: string;
  source_event_id: string;
  package_version_id: string;
  snapshot_json: string;
  snapshot_sha256: string;
  release_state: string;
  approved_at: string | Date;
  expires_at: string | Date;
};

const uuid = (value: string): boolean =>
  /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
    value,
  );
const filled = (value: string): boolean => value.trim().length > 0;
const millis = (value: string | Date): number =>
  value instanceof Date ? value.getTime() : Date.parse(value);

/** Records release authorization only; delivery and supplier receipt are separate actions. */
export async function authorizePreparedRfxPackageVersion(
  input: RfxReleaseAuthorizationInput,
  tx: TxSessionRunner = createTxSession("source-rfx-release-authorization"),
  now: () => Date = () => new Date(),
): Promise<RfxReleaseAuthorizationResult> {
  if (
    !filled(input.clientKey) ||
    !uuid(input.eventId) ||
    !filled(input.packageVersionId) ||
    !/^[0-9a-f]{64}$/.test(input.snapshotSha256) ||
    !filled(input.authorizedByUserId) ||
    !filled(input.releaseEvidenceReference)
  ) {
    return { ok: false, code: "invalid_record" };
  }

  try {
    return await tx(async (run) => {
      await run("SELECT set_config('app.tenant_key', $1, true)", [
        input.clientKey,
      ]);
      const events = await run<{ id: string }>(
        `SELECT id FROM source_events
         WHERE client_key = $1 AND id = $2::uuid FOR UPDATE`,
        [input.clientKey, input.eventId],
      );
      if (events.length !== 1) return { ok: false, code: "event_unavailable" };

      const packages = await run<PreparedRow>(
        `SELECT client_key, source_event_id, package_version_id, snapshot_json,
                snapshot_sha256, release_state, approved_at, expires_at
         FROM source_event_rfx_package_version
         WHERE client_key = $1 AND source_event_id = $2::uuid
           AND package_version_id = $3 FOR SHARE`,
        [input.clientKey, input.eventId, input.packageVersionId],
      );
      const pkg = packages[0];
      if (
        packages.length !== 1 ||
        pkg.client_key !== input.clientKey ||
        pkg.source_event_id !== input.eventId ||
        pkg.package_version_id !== input.packageVersionId ||
        pkg.release_state !== "prepared"
      ) {
        return { ok: false, code: "package_unavailable" };
      }
      const authorizedAt = now().getTime();
      if (
        !Number.isFinite(authorizedAt) ||
        !Number.isFinite(millis(pkg.approved_at)) ||
        authorizedAt < millis(pkg.approved_at) ||
        !Number.isFinite(millis(pkg.expires_at)) ||
        authorizedAt >= millis(pkg.expires_at)
      ) {
        return { ok: false, code: "package_expired" };
      }
      if (
        pkg.snapshot_sha256 !== input.snapshotSha256 ||
        createHash("sha256").update(pkg.snapshot_json).digest("hex") !==
          input.snapshotSha256
      ) {
        return { ok: false, code: "digest_mismatch" };
      }

      const prior = await run<{ id: string }>(
        `SELECT id FROM source_event_rfx_release_authorization
         WHERE client_key = $1 AND source_event_id = $2::uuid
           AND package_version_id = $3 FOR SHARE`,
        [input.clientKey, input.eventId, input.packageVersionId],
      );
      if (prior.length > 0) return { ok: false, code: "already_authorized" };

      const inserted = await run<{ id: string }>(
        `INSERT INTO source_event_rfx_release_authorization (
           client_key, source_event_id, package_version_id, snapshot_sha256,
           authorized_by_user_id, authorized_at, release_evidence_reference
         ) VALUES ($1, $2::uuid, $3, $4, $5, clock_timestamp(), $6)
         RETURNING id`,
        [
          input.clientKey,
          input.eventId,
          input.packageVersionId,
          input.snapshotSha256,
          input.authorizedByUserId,
          input.releaseEvidenceReference,
        ],
      );
      if (inserted.length !== 1)
        return { ok: false, code: "authority_unavailable" };
      return {
        ok: true,
        authorizationId: inserted[0].id,
        snapshotSha256: input.snapshotSha256,
      };
    });
  } catch {
    return { ok: false, code: "authority_unavailable" };
  }
}
