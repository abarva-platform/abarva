import { Client, type ClientConfig } from "pg";

// Read (and the one write: approve/override) path for the Home Knowledge V4
// review queue on the retired V4 review surface. Modeled on
// readHomeKnowledgeV4PackForTenantFromPostgres (same table, same connection
// pattern) -- reads never throw (return an empty list on any failure so the
// page still renders); the approve/override write throws real errors, since
// the caller (the API route) needs to report them back to the reviewer.

const ARTIFACT_TYPE = "NexusHomeKnowledgePackV4Book";

export interface HomeKnowledgeV4ReviewViolation {
  type?: string;
  message?: string;
  severity?: string;
  dimension_key?: string;
}

export interface HomeKnowledgeV4ReviewCandidate {
  id: string;
  tenant_key: string;
  tenant_name: string;
  pack_version: string;
  status: string;
  validation_status: string | null;
  violations: HomeKnowledgeV4ReviewViolation[];
  created_at: string;
  approved_by: string | null;
  approved_at: string | null;
  override_reason: string | null;
  overridden_by: string | null;
  overridden_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  reject_reason: string | null;
  retired_by: string | null;
  retire_reason: string | null;
  rollback_of_pack_id: string | null;
  effective_from: string | null;
  effective_to: string | null;
}

export interface HomeKnowledgeV4PackHistoryRow {
  id: string;
  tenant_key: string;
  pack_version: string;
  status: string;
  validation_status: string | null;
  created_at: string;
  approved_by: string | null;
  approved_at: string | null;
  effective_from: string | null;
  effective_to: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  reject_reason: string | null;
  retired_by: string | null;
  retire_reason: string | null;
  rollback_of_pack_id: string | null;
}

export interface HomeKnowledgeV4JobRunFailure {
  id: string;
  job_execution_name: string;
  tenant_key: string;
  outcome: string;
  error_message: string | null;
  created_at: string;
}

function connectionString(): string | null {
  return (
    process.env.ABARVA_AZURE_DATABASE_URL ??
    process.env.AZURE_DATABASE_URL ??
    process.env.DATABASE_URL ??
    null
  );
}

function disablePostgresSsl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.get("sslmode")?.toLowerCase() === "disable")
      return true;
    return ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

function clientConfig(url: string, applicationName: string): ClientConfig {
  return {
    connectionString: url,
    ssl: disablePostgresSsl(url) ? false : { rejectUnauthorized: false },
    application_name: applicationName,
  };
}

// Latest row per tenant (candidate or approved) for the review queue -- the
// point is "what's the current reviewable state for this tenant", not a
// full version history.
export async function listHomeKnowledgeV4CandidatesForReview(): Promise<
  HomeKnowledgeV4ReviewCandidate[]
> {
  const dbUrl = connectionString();
  if (!dbUrl) return [];
  const client = new Client(
    clientConfig(dbUrl, "home-knowledge-v4-review-read"),
  );
  try {
    await client.connect();
    const result = await client.query(
      `SELECT DISTINCT ON (tenant_key)
              id, tenant_key, tenant_name, pack_version, status, validation_status,
              quality_report, created_at, approved_by, approved_at,
              override_reason, overridden_by, overridden_at,
              rejected_by, rejected_at, reject_reason,
              retired_by, retire_reason, rollback_of_pack_id,
              effective_from, effective_to
         FROM public.home_knowledge_packs
        WHERE artifact_type = $1
        ORDER BY tenant_key, created_at DESC`,
      [ARTIFACT_TYPE],
    );
    return result.rows.map((row) => ({
      id: row.id,
      tenant_key: row.tenant_key,
      tenant_name: row.tenant_name,
      pack_version: row.pack_version,
      status: row.status,
      validation_status: row.validation_status,
      violations: Array.isArray(row.quality_report?.violations)
        ? row.quality_report.violations
        : [],
      created_at: row.created_at,
      approved_by: row.approved_by,
      approved_at: row.approved_at,
      override_reason: row.override_reason,
      overridden_by: row.overridden_by,
      overridden_at: row.overridden_at,
      rejected_by: row.rejected_by,
      rejected_at: row.rejected_at,
      reject_reason: row.reject_reason,
      retired_by: row.retired_by,
      retire_reason: row.retire_reason,
      rollback_of_pack_id: row.rollback_of_pack_id,
      effective_from: row.effective_from,
      effective_to: row.effective_to,
    }));
  } catch (error) {
    console.warn(
      "[home-v4-review] failed to list candidates for review",
      error,
    );
    return [];
  } finally {
    await client.end().catch(() => undefined);
  }
}

export interface HomeKnowledgeV4CandidateRenderPack {
  id: string;
  tenant_key: string;
  pack_version: string;
  status: string;
  validation_status: string | null;
  violations: HomeKnowledgeV4ReviewViolation[];
  created_at: string;
  render_pack: unknown;
}

// The real, persisted book-mode candidate for one tenant -- render_pack and
// all -- not the review queue's summary row. The retired V4 explorer
// previously rendered only a build-time-bundled fixture file; approving a
// candidate from that fixture would mean approving content nobody actually
// re-read from the database. Returns null (never throws) on any failure or
// absence so the caller can fall back to the fixture and say so honestly,
// rather than crash the page.
export async function getHomeKnowledgeV4LatestCandidateRenderPack(
  tenantKey: string,
): Promise<HomeKnowledgeV4CandidateRenderPack | null> {
  const dbUrl = connectionString();
  if (!dbUrl) return null;
  const client = new Client(
    clientConfig(dbUrl, "home-knowledge-v4-candidate-render-pack-read"),
  );
  try {
    await client.connect();
    const result = await client.query(
      `SELECT id, tenant_key, pack_version, status, validation_status, quality_report, created_at, render_pack
         FROM public.home_knowledge_packs
        WHERE tenant_key = $1 AND artifact_type = $2
        ORDER BY created_at DESC
        LIMIT 1`,
      [tenantKey, ARTIFACT_TYPE],
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      tenant_key: row.tenant_key,
      pack_version: row.pack_version,
      status: row.status,
      validation_status: row.validation_status,
      violations: Array.isArray(row.quality_report?.violations)
        ? row.quality_report.violations
        : [],
      created_at: row.created_at,
      render_pack: row.render_pack,
    };
  } catch (error) {
    console.warn(
      "[home-v4-review] failed to read latest candidate render_pack",
      error,
    );
    return null;
  } finally {
    await client.end().catch(() => undefined);
  }
}

// Full version history for one tenant -- what the review-queue's "latest
// row only" listing above deliberately omits. Needed for rollback: you can
// only roll back to a pack you can see.
export async function listHomeKnowledgeV4PackHistoryForTenant(
  tenantKey: string,
): Promise<HomeKnowledgeV4PackHistoryRow[]> {
  const dbUrl = connectionString();
  if (!dbUrl) return [];
  const client = new Client(
    clientConfig(dbUrl, "home-knowledge-v4-review-read"),
  );
  try {
    await client.connect();
    const result = await client.query(
      `SELECT id, tenant_key, pack_version, status, validation_status, created_at,
              approved_by, approved_at, effective_from, effective_to,
              rejected_by, rejected_at, reject_reason,
              retired_by, retire_reason, rollback_of_pack_id
         FROM public.home_knowledge_packs
        WHERE tenant_key = $1 AND artifact_type = $2
        ORDER BY created_at DESC`,
      [tenantKey, ARTIFACT_TYPE],
    );
    return result.rows;
  } catch (error) {
    console.warn("[home-v4-review] failed to list pack history", error);
    return [];
  } finally {
    await client.end().catch(() => undefined);
  }
}

// Generation and persistence failures never produce a home_knowledge_packs
// row at all -- this is the only place they're visible. Recent only (a
// review queue, not an unbounded audit log; the full history lives in the
// table itself for anyone querying directly).
export async function listHomeKnowledgeV4RecentJobRunFailures(): Promise<
  HomeKnowledgeV4JobRunFailure[]
> {
  const dbUrl = connectionString();
  if (!dbUrl) return [];
  const client = new Client(
    clientConfig(dbUrl, "home-knowledge-v4-review-read"),
  );
  try {
    await client.connect();
    const result = await client.query(
      `SELECT id, job_execution_name, tenant_key, outcome, error_message, created_at
         FROM public.home_knowledge_v4_job_runs
        WHERE outcome IN ('generation_failed', 'persistence_failed')
        ORDER BY created_at DESC
        LIMIT 20`,
    );
    return result.rows;
  } catch (error) {
    console.warn(
      "[home-v4-review] failed to list recent job-run failures",
      error,
    );
    return [];
  } finally {
    await client.end().catch(() => undefined);
  }
}

export class HomeKnowledgeV4ApprovalError extends Error {}

// Same transactional shape as persist-home-knowledge-v4-book.mjs's
// approveTenantPack -- kept in sync by hand (the operator script and this
// Next.js lib run in different environments, so they don't share code) --
// retire the tenant's current approved row (any artifact type; the partial
// unique index home_knowledge_packs_one_active_approved is tenant-scoped
// across all of them), then approve the latest candidate. Requires an
// override reason whenever validation_status isn't 'pass'.
export async function approveHomeKnowledgeV4Candidate(options: {
  tenantKey: string;
  approvedBy: string;
  overrideReason?: string | null;
}): Promise<{
  id: string;
  tenantKey: string;
  packVersion: string;
  overridden: boolean;
}> {
  const dbUrl = connectionString();
  if (!dbUrl)
    throw new HomeKnowledgeV4ApprovalError("Missing database connection.");
  const client = new Client(
    clientConfig(dbUrl, "home-knowledge-v4-review-approve"),
  );
  await client.connect();
  try {
    await client.query("BEGIN");
    const latest = await client.query(
      `SELECT id, validation_status, quality_report FROM public.home_knowledge_packs
        WHERE tenant_key = $1 AND artifact_type = $2 AND status = 'candidate'
        ORDER BY created_at DESC LIMIT 1`,
      [options.tenantKey, ARTIFACT_TYPE],
    );
    if (latest.rows.length === 0) {
      throw new HomeKnowledgeV4ApprovalError(
        `No candidate pack found for tenant "${options.tenantKey}".`,
      );
    }
    const row = latest.rows[0];
    const needsOverride = row.validation_status !== "pass";
    if (needsOverride && !options.overrideReason?.trim()) {
      throw new HomeKnowledgeV4ApprovalError(
        `This candidate has validation_status "${row.validation_status}" -- approving it requires a written override reason.`,
      );
    }
    const findingsAcknowledged = needsOverride
      ? (row.quality_report?.violations ?? [])
      : [];
    await client.query(
      `UPDATE public.home_knowledge_packs
        SET effective_to = now(), status = 'retired', updated_at = now()
        WHERE tenant_key = $1 AND status = 'approved' AND effective_to IS NULL`,
      [options.tenantKey],
    );
    const approved = await client.query(
      `UPDATE public.home_knowledge_packs
        SET status = 'approved', approved_by = $2, approved_at = now(), effective_from = now(), updated_at = now(),
            override_reason = $3, overridden_by = $4, overridden_at = $5, findings_acknowledged = $6
        WHERE id = $1
        RETURNING id, tenant_key, pack_version`,
      [
        row.id,
        options.approvedBy,
        needsOverride ? options.overrideReason : null,
        needsOverride ? options.approvedBy : null,
        needsOverride ? new Date().toISOString() : null,
        JSON.stringify(findingsAcknowledged),
      ],
    );
    await client.query("COMMIT");
    const result = approved.rows[0];
    return {
      id: result.id,
      tenantKey: result.tenant_key,
      packVersion: result.pack_version,
      overridden: needsOverride,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end().catch(() => undefined);
  }
}

// Reject a candidate outright -- reviewed and explicitly declined, never
// approved. Distinct from retire: a rejected row never went live.
export async function rejectHomeKnowledgeV4Candidate(options: {
  packId: string;
  rejectedBy: string;
  reason: string;
}): Promise<{ id: string; tenantKey: string; packVersion: string }> {
  if (!options.reason.trim()) {
    throw new HomeKnowledgeV4ApprovalError("A reject reason is required.");
  }
  const dbUrl = connectionString();
  if (!dbUrl)
    throw new HomeKnowledgeV4ApprovalError("Missing database connection.");
  const client = new Client(
    clientConfig(dbUrl, "home-knowledge-v4-review-reject"),
  );
  await client.connect();
  try {
    await client.query("BEGIN");
    const current = await client.query(
      `SELECT id, status FROM public.home_knowledge_packs WHERE id = $1 AND artifact_type = $2 FOR UPDATE`,
      [options.packId, ARTIFACT_TYPE],
    );
    if (current.rows.length === 0) {
      throw new HomeKnowledgeV4ApprovalError(
        `No V4 pack found with id "${options.packId}".`,
      );
    }
    if (current.rows[0].status !== "candidate") {
      throw new HomeKnowledgeV4ApprovalError(
        `Only a pack with status "candidate" can be rejected (this one is "${current.rows[0].status}"). Use retire to pull down an already-active pack.`,
      );
    }
    const rejected = await client.query(
      `UPDATE public.home_knowledge_packs
        SET status = 'rejected', rejected_by = $2, rejected_at = now(), reject_reason = $3, updated_at = now()
        WHERE id = $1
        RETURNING id, tenant_key, pack_version`,
      [options.packId, options.rejectedBy, options.reason.trim()],
    );
    await client.query("COMMIT");
    const result = rejected.rows[0];
    return {
      id: result.id,
      tenantKey: result.tenant_key,
      packVersion: result.pack_version,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end().catch(() => undefined);
  }
}

// Pull a tenant's currently-active pack down WITHOUT promoting a
// replacement -- e.g. to deliberately fall a tenant back to the V2
// renderer. This is the standalone action approve's implicit retire-of-
// prior never exposed on its own.
export async function retireHomeKnowledgeV4ActivePack(options: {
  tenantKey: string;
  retiredBy: string;
  reason: string;
}): Promise<{ id: string; tenantKey: string; packVersion: string }> {
  if (!options.reason.trim()) {
    throw new HomeKnowledgeV4ApprovalError("A retire reason is required.");
  }
  const dbUrl = connectionString();
  if (!dbUrl)
    throw new HomeKnowledgeV4ApprovalError("Missing database connection.");
  const client = new Client(
    clientConfig(dbUrl, "home-knowledge-v4-review-retire"),
  );
  await client.connect();
  try {
    await client.query("BEGIN");
    const active = await client.query(
      `SELECT id FROM public.home_knowledge_packs
        WHERE tenant_key = $1 AND artifact_type = $2 AND status = 'approved' AND effective_to IS NULL
        FOR UPDATE`,
      [options.tenantKey, ARTIFACT_TYPE],
    );
    if (active.rows.length === 0) {
      throw new HomeKnowledgeV4ApprovalError(
        `No active V4 pack found for tenant "${options.tenantKey}".`,
      );
    }
    const retired = await client.query(
      `UPDATE public.home_knowledge_packs
        SET status = 'retired', effective_to = now(), retired_by = $2, retire_reason = $3, updated_at = now()
        WHERE id = $1
        RETURNING id, tenant_key, pack_version`,
      [active.rows[0].id, options.retiredBy, options.reason.trim()],
    );
    await client.query("COMMIT");
    const result = retired.rows[0];
    return {
      id: result.id,
      tenantKey: result.tenant_key,
      packVersion: result.pack_version,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end().catch(() => undefined);
  }
}

// Reactivate a specific earlier pack (retired or rejected) for a tenant --
// retires whatever is currently active for that tenant (same partial-
// unique-index-respecting pattern as approve) and flips the named pack back
// to approved/live, stamping rollback_of_pack_id with whatever it displaced.
export async function rollbackHomeKnowledgeV4Pack(options: {
  tenantKey: string;
  targetPackId: string;
  rolledBackBy: string;
  reason: string;
}): Promise<{
  id: string;
  tenantKey: string;
  packVersion: string;
  displacedPackId: string | null;
}> {
  if (!options.reason.trim()) {
    throw new HomeKnowledgeV4ApprovalError("A rollback reason is required.");
  }
  const dbUrl = connectionString();
  if (!dbUrl)
    throw new HomeKnowledgeV4ApprovalError("Missing database connection.");
  const client = new Client(
    clientConfig(dbUrl, "home-knowledge-v4-review-rollback"),
  );
  await client.connect();
  try {
    await client.query("BEGIN");
    const target = await client.query(
      `SELECT id, tenant_key, status FROM public.home_knowledge_packs
        WHERE id = $1 AND artifact_type = $2 AND tenant_key = $3
        FOR UPDATE`,
      [options.targetPackId, ARTIFACT_TYPE, options.tenantKey],
    );
    if (target.rows.length === 0) {
      throw new HomeKnowledgeV4ApprovalError(
        `No V4 pack with id "${options.targetPackId}" found for tenant "${options.tenantKey}".`,
      );
    }
    if (!["retired", "rejected"].includes(target.rows[0].status)) {
      throw new HomeKnowledgeV4ApprovalError(
        `Rollback target must currently be "retired" or "rejected" (this one is "${target.rows[0].status}").`,
      );
    }
    const displaced = await client.query(
      `UPDATE public.home_knowledge_packs
        SET status = 'retired', effective_to = now(), retired_by = $2,
            retire_reason = $3, updated_at = now()
        WHERE tenant_key = $1 AND status = 'approved' AND effective_to IS NULL
        RETURNING id`,
      [
        options.tenantKey,
        options.rolledBackBy,
        `Displaced by rollback to pack ${options.targetPackId}: ${options.reason.trim()}`,
      ],
    );
    const reactivated = await client.query(
      `UPDATE public.home_knowledge_packs
        SET status = 'approved', approved_by = $2, approved_at = now(), effective_from = now(), effective_to = NULL,
            updated_at = now(), rollback_of_pack_id = $3,
            override_reason = $4, overridden_by = $2, overridden_at = now()
        WHERE id = $1
        RETURNING id, tenant_key, pack_version`,
      [
        options.targetPackId,
        options.rolledBackBy,
        displaced.rows[0]?.id ?? null,
        `Rolled back: ${options.reason.trim()}`,
      ],
    );
    await client.query("COMMIT");
    const result = reactivated.rows[0];
    return {
      id: result.id,
      tenantKey: result.tenant_key,
      packVersion: result.pack_version,
      displacedPackId: displaced.rows[0]?.id ?? null,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end().catch(() => undefined);
  }
}
