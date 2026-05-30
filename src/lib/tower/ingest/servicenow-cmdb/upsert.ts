import type { Pool } from 'pg';

import type { CmdbCiRow, CmdbDependencyRow } from './schema';

export interface CmdbUpsertContext {
  clientId: string;
  ingestRunId: string;
  sourceSystem?: string;
}

export interface CmdbUpsertResult {
  cisInserted: number;
  cisUpdated: number;
  dependenciesInserted: number;
  dependenciesUpdated: number;
}

/**
 * Transactionally upsert a parsed ServiceNow CMDB extract into
 * tower_cmdb_cis + tower_cmdb_dependencies. Idempotent: re-running
 * with identical input produces zero net change after the first call.
 *
 * Counts the difference between "inserted" and "updated" via the
 * (xmax = 0) trick — xmax = 0 on a row returned from INSERT ...
 * RETURNING means the row was freshly inserted, anything else means
 * UPSERT updated an existing row.
 */
export async function upsertCmdbExtract(args: {
  pool: Pool;
  context: CmdbUpsertContext;
  cis: CmdbCiRow[];
  dependencies: CmdbDependencyRow[];
}): Promise<CmdbUpsertResult> {
  const { pool, context, cis, dependencies } = args;
  const sourceSystem = context.sourceSystem ?? 'servicenow_cmdb';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let cisInserted = 0;
    let cisUpdated = 0;
    for (const ci of cis) {
      const result = await client.query<{ inserted: boolean }>(
        `
          INSERT INTO public.tower_cmdb_cis (
            client_id, ci_sys_id, ci_name, ci_type, ci_class,
            lifecycle_state, owner_team, business_service, criticality,
            environment, source_system, ingest_run_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (client_id, ci_sys_id) DO UPDATE
            SET ci_name = EXCLUDED.ci_name,
                ci_type = EXCLUDED.ci_type,
                ci_class = EXCLUDED.ci_class,
                lifecycle_state = EXCLUDED.lifecycle_state,
                owner_team = EXCLUDED.owner_team,
                business_service = EXCLUDED.business_service,
                criticality = EXCLUDED.criticality,
                environment = EXCLUDED.environment,
                source_system = EXCLUDED.source_system,
                ingest_run_id = EXCLUDED.ingest_run_id,
                ingested_at = now()
          RETURNING (xmax = 0) AS inserted
        `,
        [
          context.clientId,
          ci.ciSysId,
          ci.ciName,
          ci.ciType,
          ci.ciClass,
          ci.lifecycleState,
          ci.ownerTeam,
          ci.businessService,
          ci.criticality,
          ci.environment,
          sourceSystem,
          context.ingestRunId,
        ],
      );
      if (result.rows[0]?.inserted) cisInserted += 1;
      else cisUpdated += 1;
    }

    let dependenciesInserted = 0;
    let dependenciesUpdated = 0;
    for (const edge of dependencies) {
      const result = await client.query<{ inserted: boolean }>(
        `
          INSERT INTO public.tower_cmdb_dependencies (
            client_id, source_ci_sys_id, target_ci_sys_id, dependency_type,
            source_system, ingest_run_id
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (client_id, source_ci_sys_id, target_ci_sys_id, dependency_type) DO UPDATE
            SET source_system = EXCLUDED.source_system,
                ingest_run_id = EXCLUDED.ingest_run_id,
                ingested_at = now()
          RETURNING (xmax = 0) AS inserted
        `,
        [
          context.clientId,
          edge.sourceCiSysId,
          edge.targetCiSysId,
          edge.dependencyType,
          sourceSystem,
          context.ingestRunId,
        ],
      );
      if (result.rows[0]?.inserted) dependenciesInserted += 1;
      else dependenciesUpdated += 1;
    }

    await client.query('COMMIT');
    return { cisInserted, cisUpdated, dependenciesInserted, dependenciesUpdated };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}
