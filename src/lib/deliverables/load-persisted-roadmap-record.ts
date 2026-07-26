import "server-only";

// PR10 — the ONE data-read seam for governed roadmap downloads.
//
// Reads the persisted roadmap record from a deliverable version's
// `structured_data.roadmap_governed_record` (written by the persist hook when
// `moves_governed_roadmap_downloads` is enabled), plus the artifact's status and
// available versions, and returns a RoadmapDownloadTarget for the pure download
// service to authorize + render. Tenant scoping is enforced here AND re-checked
// by `authorizeRoadmapDownload` (defense in depth).
//
// NOTE (live-unproven): this DB read follows the exact `azureRead.query` pattern
// used by moves-generate-deps.ts, but — like any data-plane route — it is proven
// against the running app + Postgres, not in unit tests. The pure authorize +
// render + response logic it feeds is fully unit-tested
// (roadmap-artifact-persistence + roadmap-download-service).

import { azureRead } from "@/lib/data-plane/azureRead";
import type {
  PersistedRoadmapRecord,
  RoadmapDownloadTarget,
} from "./roadmap-artifact-persistence";

/** Map the deliverable's governed status to the download target's status. */
function toStatus(
  raw: string | null | undefined,
): RoadmapDownloadTarget["status"] {
  const s = (raw ?? "").toLowerCase();
  if (s.includes("reject")) return "rejected";
  if (s.includes("supersed")) return "superseded";
  return "active";
}

function coerceRecord(structured: unknown): PersistedRoadmapRecord | null {
  if (!structured || typeof structured !== "object") return null;
  const rec = (structured as Record<string, unknown>).roadmap_governed_record;
  if (!rec || typeof rec !== "object") return null;
  const r = rec as Record<string, unknown>;
  // Minimal shape gate; the download service re-validates the contract's hash
  // integrity before rendering, so a corrupt record still cannot be served.
  if (!r.contract || !r.provenance || !r.sync) return null;
  return rec as unknown as PersistedRoadmapRecord;
}

/** Load the governed roadmap download target for a deliverable within a tenant.
 * Returns `record: null` (→ non-enumerating 404) whenever no governed roadmap
 * record exists — including for cross-tenant deliverable ids. */
export async function loadPersistedRoadmapRecord(args: {
  tenantKey: string;
  moveId: string;
  deliverableId: string;
  requestedVersion?: number;
}): Promise<RoadmapDownloadTarget> {
  const empty: RoadmapDownloadTarget = {
    record: null,
    status: "active",
    availableVersions: [],
  };

  const rows = await azureRead.query<{
    structured_data: unknown;
    version: number;
    status: string | null;
    signed_off_version: number | null;
    engagement_id: string;
  }>(
    "SELECT dv.structured_data, dv.version, d.status, d.signed_off_version, d.engagement_id " +
      "FROM deliverable_versions dv " +
      "JOIN deliverables_v2 d ON d.id = dv.deliverable_id " +
      "WHERE d.id = $1 AND d.engagement_id = $2 " +
      "ORDER BY dv.version DESC",
    [args.deliverableId, args.moveId],
    { missingTable: "empty" },
  );
  if (rows.length === 0) return empty;

  const availableVersions = rows.map((r) => r.version).sort((a, b) => a - b);
  const wanted =
    args.requestedVersion !== undefined
      ? rows.find((r) => r.version === args.requestedVersion)
      : rows[0]; // rows[0] is the highest version (current)
  if (!wanted) {
    // Version explicitly requested but absent — surface the available set so the
    // authorizer returns roadmap_version_not_available.
    return {
      record: null,
      status: toStatus(rows[0].status),
      availableVersions,
    };
  }

  const record = coerceRecord(wanted.structured_data);
  if (!record)
    return { record: null, status: toStatus(wanted.status), availableVersions };

  // Tenant fence: the persisted record's own lineage must match the caller's
  // tenant. A mismatch is treated as not-found (never leaks existence).
  if (record.sync.tenantKey !== args.tenantKey) return empty;

  return {
    record,
    status: toStatus(wanted.status),
    availableVersions,
  };
}
