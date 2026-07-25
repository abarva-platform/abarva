import { Client, type ClientConfig } from "pg";

// Read (and the one write: approve/override) path for the Home Knowledge V4
// review queue on /home/v4-preview. Modeled on
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
  return process.env.ABARVA_AZURE_DATABASE_URL ?? process.env.AZURE_DATABASE_URL ?? process.env.DATABASE_URL ?? null;
}

function disablePostgresSsl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.get("sslmode")?.toLowerCase() === "disable") return true;
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
export async function listHomeKnowledgeV4CandidatesForReview(): Promise<HomeKnowledgeV4ReviewCandidate[]> {
  const dbUrl = connectionString();
  if (!dbUrl) return [];
  const client = new Client(clientConfig(dbUrl, "home-knowledge-v4-review-read"));
  try {
    await client.connect();
    const result = await client.query(
      `SELECT DISTINCT ON (tenant_key)
              id, tenant_key, tenant_name, pack_version, status, validation_status,
              quality_report, created_at, approved_by, approved_at,
              override_reason, overridden_by, overridden_at
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
      violations: Array.isArray(row.quality_report?.violations) ? row.quality_report.violations : [],
      created_at: row.created_at,
      approved_by: row.approved_by,
      approved_at: row.approved_at,
      override_reason: row.override_reason,
      overridden_by: row.overridden_by,
      overridden_at: row.overridden_at,
    }));
  } catch (error) {
    console.warn("[home-v4-review] failed to list candidates for review", error);
    return [];
  } finally {
    await client.end().catch(() => undefined);
  }
}

// Generation and persistence failures never produce a home_knowledge_packs
// row at all -- this is the only place they're visible. Recent only (a
// review queue, not an unbounded audit log; the full history lives in the
// table itself for anyone querying directly).
export async function listHomeKnowledgeV4RecentJobRunFailures(): Promise<HomeKnowledgeV4JobRunFailure[]> {
  const dbUrl = connectionString();
  if (!dbUrl) return [];
  const client = new Client(clientConfig(dbUrl, "home-knowledge-v4-review-read"));
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
    console.warn("[home-v4-review] failed to list recent job-run failures", error);
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
}): Promise<{ id: string; tenantKey: string; packVersion: string; overridden: boolean }> {
  const dbUrl = connectionString();
  if (!dbUrl) throw new HomeKnowledgeV4ApprovalError("Missing database connection.");
  const client = new Client(clientConfig(dbUrl, "home-knowledge-v4-review-approve"));
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
      throw new HomeKnowledgeV4ApprovalError(`No candidate pack found for tenant "${options.tenantKey}".`);
    }
    const row = latest.rows[0];
    const needsOverride = row.validation_status !== "pass";
    if (needsOverride && !options.overrideReason?.trim()) {
      throw new HomeKnowledgeV4ApprovalError(
        `This candidate has validation_status "${row.validation_status}" -- approving it requires a written override reason.`,
      );
    }
    const findingsAcknowledged = needsOverride ? (row.quality_report?.violations ?? []) : [];
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
    return { id: result.id, tenantKey: result.tenant_key, packVersion: result.pack_version, overridden: needsOverride };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end().catch(() => undefined);
  }
}
