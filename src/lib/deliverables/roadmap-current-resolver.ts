import "server-only";

// PR11 — resolve the CURRENT (or an explicit version of the) governed
// execution-roadmap contract for a Move, from stable public identifiers only.
//
// The client never supplies `deliverables_v2.id`. It asks for a Move + type +
// (current | version N); this module resolves the correct persisted governed
// contract server-side:
//   • newest VALID version — one whose structured_data carries a real governed
//     record (a failed generation attempt that persisted only narrative has NO
//     record and is therefore skipped, so it can never hide a prior valid one);
//   • never manufactured from narrative/title/filename;
//   • rejected/superseded deliverables surface as governed refusals, not downloads.
//
// The pure selector (`selectRoadmapTarget`) is unit-tested; the DB read
// (`loadCurrentRoadmapTarget`) is the live seam, proven against the app.

import { azureRead } from "@/lib/data-plane/azureRead";
import type {
  PersistedRoadmapRecord,
  RoadmapDownloadTarget,
} from "./roadmap-artifact-persistence";

/** The governed execution-roadmap deliverable type key (golden-bar + orchestrator). */
export const EXECUTION_ROADMAP_TYPE_KEY = "execution_roadmap";

/** One persisted version as the resolver considers it. `record` is non-null ONLY
 * when that version carries a valid governed contract. */
export interface RoadmapVersionCandidate {
  version: number;
  record: PersistedRoadmapRecord | null;
}

function deliverableStatusToTargetStatus(
  raw: string | null | undefined,
): RoadmapDownloadTarget["status"] {
  const s = (raw ?? "").toLowerCase();
  if (s.includes("reject")) return "rejected";
  if (s.includes("supersed")) return "superseded";
  return "active";
}

/** Pure selection. Given every version's (version, record?) plus the
 * deliverable's status, choose the target the authorizer will act on:
 *   - `current` → the highest-version candidate that has a valid record;
 *   - explicit `version` → that version's record (null if it has none);
 *   - `availableVersions` lists only versions that actually hold a valid contract.
 * Never invents a record. */
export function selectRoadmapTarget(args: {
  candidates: RoadmapVersionCandidate[];
  deliverableStatus: string | null | undefined;
  requestedVersion?: number;
}): RoadmapDownloadTarget {
  const status = deliverableStatusToTargetStatus(args.deliverableStatus);
  const valid = args.candidates
    .filter((c) => c.record !== null)
    .sort((a, b) => b.version - a.version);
  const availableVersions = valid.map((c) => c.version).sort((a, b) => a - b);

  let record: PersistedRoadmapRecord | null;
  if (args.requestedVersion !== undefined) {
    record =
      args.candidates.find((c) => c.version === args.requestedVersion)
        ?.record ?? null;
  } else {
    // current = newest version that actually carries a valid governed contract
    record = valid[0]?.record ?? null;
  }
  return { record, status, availableVersions };
}

function coerceRecord(structured: unknown): PersistedRoadmapRecord | null {
  if (!structured || typeof structured !== "object") return null;
  const rec = (structured as Record<string, unknown>).roadmap_governed_record;
  if (!rec || typeof rec !== "object") return null;
  const r = rec as Record<string, unknown>;
  if (!r.contract || !r.provenance || !r.sync) return null;
  return rec as unknown as PersistedRoadmapRecord;
}

/** Load + resolve the current (or explicit-version) governed roadmap target for
 * a Move, using ONLY the Move id + type + tenant. Non-enumerating: returns
 * `record: null` (→ 404) for an unknown Move, a cross-tenant Move, or a Move with
 * no governed contract — none of which are distinguishable to the caller. */
export async function loadCurrentRoadmapTarget(args: {
  tenantKey: string;
  moveId: string;
  requestedVersion?: number;
}): Promise<RoadmapDownloadTarget> {
  const empty: RoadmapDownloadTarget = {
    record: null,
    status: "active",
    availableVersions: [],
  };

  const rows = await azureRead.query<{
    version: number;
    structured_data: unknown;
    status: string | null;
  }>(
    "SELECT dv.version, dv.structured_data, d.status " +
      "FROM deliverable_versions dv " +
      "JOIN deliverables_v2 d ON d.id = dv.deliverable_id " +
      "WHERE d.engagement_id = $1 AND d.deliverable_type_key = $2 " +
      "ORDER BY dv.version DESC",
    [args.moveId, EXECUTION_ROADMAP_TYPE_KEY],
    { missingTable: "empty" },
  );
  if (rows.length === 0) return empty;

  const candidates: RoadmapVersionCandidate[] = rows.map((r) => ({
    version: r.version,
    record: coerceRecord(r.structured_data),
  }));
  const deliverableStatus = rows[0]?.status ?? null;

  const target = selectRoadmapTarget({
    candidates,
    deliverableStatus,
    requestedVersion: args.requestedVersion,
  });

  // Tenant fence: the resolved record's own lineage must match the caller's
  // tenant. A mismatch is treated as not-found (never leaks existence).
  if (target.record && target.record.sync.tenantKey !== args.tenantKey) {
    return empty;
  }
  return target;
}
