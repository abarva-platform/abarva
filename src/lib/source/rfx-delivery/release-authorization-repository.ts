import { createHash } from "node:crypto";
import { azureRead } from "@/lib/data-plane/azureRead";

export type RfxReleaseAuthorizationRead =
  | { state: "not_authorized" | "unavailable" }
  | {
      state: "release_authorized";
      authorizationId: string;
      packageVersionId: string;
      snapshotSha256: string;
      authorizedByUserId: string;
      authorizedAt: string;
    };

type AuthorizationRow = {
  client_key: string;
  source_event_id: string;
  package_version_id: string;
  snapshot_json: string;
  snapshot_sha256: string;
  release_state: string;
  approved_at: string | Date;
  expires_at: string | Date;
  authorization_id: string;
  authorization_snapshot_sha256: string;
  authorized_by_user_id: string;
  authorized_at: string | Date;
};

const filled = (value: string): boolean => value.trim().length > 0;
const uuid = (value: string): boolean =>
  /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
    value,
  );
const timestamp = (value: string | Date): number =>
  value instanceof Date ? value.getTime() : Date.parse(value);

/** Historical release authorization readback; delivery or recipient access is not implied. */
export async function readRfxReleaseAuthorization(input: {
  clientKey: string;
  eventId: string;
  packageVersionId: string;
}): Promise<RfxReleaseAuthorizationRead> {
  if (
    !filled(input.clientKey) ||
    !uuid(input.eventId) ||
    !filled(input.packageVersionId)
  ) {
    return { state: "unavailable" };
  }

  try {
    return await azureRead.withSession(async (run) => {
      await run("SELECT set_config('app.tenant_key', $1, false)", [
        input.clientKey,
      ]);
      const rows = await run<AuthorizationRow>(
        `SELECT package.client_key, package.source_event_id, package.package_version_id,
                package.snapshot_json, package.snapshot_sha256, package.release_state,
                package.approved_at, package.expires_at,
                authorization.id AS authorization_id,
                authorization.snapshot_sha256 AS authorization_snapshot_sha256,
                authorization.authorized_by_user_id, authorization.authorized_at
         FROM source_event_rfx_release_authorization authorization
         JOIN source_event_rfx_package_version package
           ON package.client_key = authorization.client_key
          AND package.source_event_id = authorization.source_event_id
          AND package.package_version_id = authorization.package_version_id
         WHERE authorization.client_key = $1 AND authorization.source_event_id = $2::uuid
           AND authorization.package_version_id = $3`,
        [input.clientKey, input.eventId, input.packageVersionId],
      );
      if (rows.length === 0) return { state: "not_authorized" };
      if (rows.length !== 1) return { state: "unavailable" };
      const row = rows[0];
      const authorizedAt = timestamp(row.authorized_at);
      if (
        row.client_key !== input.clientKey ||
        row.source_event_id !== input.eventId ||
        row.package_version_id !== input.packageVersionId ||
        row.release_state !== "prepared" ||
        !filled(row.authorization_id) ||
        !filled(row.authorized_by_user_id) ||
        !Number.isFinite(authorizedAt) ||
        !Number.isFinite(timestamp(row.approved_at)) ||
        !Number.isFinite(timestamp(row.expires_at)) ||
        authorizedAt < timestamp(row.approved_at) ||
        authorizedAt >= timestamp(row.expires_at) ||
        row.snapshot_sha256 !== row.authorization_snapshot_sha256 ||
        createHash("sha256").update(row.snapshot_json).digest("hex") !==
          row.snapshot_sha256
      ) {
        return { state: "unavailable" };
      }
      const snapshot: unknown = JSON.parse(row.snapshot_json);
      if (
        !snapshot ||
        typeof snapshot !== "object" ||
        Array.isArray(snapshot)
      ) {
        return { state: "unavailable" };
      }
      const values = snapshot as Record<string, unknown>;
      if (
        values.tenantKey !== input.clientKey ||
        values.eventId !== input.eventId ||
        values.packageVersionId !== input.packageVersionId ||
        !Array.isArray(values.artifacts) ||
        values.artifacts.length === 0 ||
        !Array.isArray(values.recipients) ||
        values.recipients.length === 0
      ) {
        return { state: "unavailable" };
      }
      return {
        state: "release_authorized",
        authorizationId: row.authorization_id,
        packageVersionId: input.packageVersionId,
        snapshotSha256: row.snapshot_sha256,
        authorizedByUserId: row.authorized_by_user_id,
        authorizedAt: new Date(authorizedAt).toISOString(),
      };
    });
  } catch {
    return { state: "unavailable" };
  }
}
