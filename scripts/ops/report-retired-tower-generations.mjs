/**
 * Read-only report of what a retention sweep would remove, and whether it can be done safely.
 *
 * Retiring a generation makes it unreadable through the serving views. It does not delete it:
 * `tower_ai_portfolio` alone holds 720 rows at projection version 1 against 55 at version 2.
 *
 * Before anything deletes, two things have to be established, and neither is safe to assume:
 *
 *   1. **Does a retired generation share an assessment_id with a live one?** The loader's existing
 *      deletes are scoped `tenant_key AND assessment_id`, with no projection_version. If one
 *      assessment carries both a live and a retired generation, that predicate deletes live rows.
 *   2. **Which tenants are on which version?** The lab has `meridian-health` on version 2 and
 *      `skyharbor-air` on version 1. A sweep keyed on "below the highest version" would delete a
 *      live tenant's entire dataset.
 *
 * This reports both, plus per-table row counts for every generation, and never deletes.
 *
 * Strictly read-only.
 */

import process from "node:process";

const TABLES = [
  "tower_ai_portfolio",
  "tower_command_center",
  "tower_value_chain",
  "tower_evidence_queue",
];

function line(label, value) {
  console.log(`${label}\t${typeof value === "string" ? value : JSON.stringify(value)}`);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const { default: pg } = await import("pg");
  const client = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    console.log("=== 1. declared lifecycle state ===");
    const declared = await client.query(
      `select tenant_key, assessment_id, projection_version, state,
              activated_at, retired_at
         from ecl_projection.tower_assessment_lifecycle
        order by tenant_key, state, projection_version desc`,
    );
    if (declared.rows.length === 0) {
      line("declared", "NONE — nothing has been declared, so nothing is sweepable");
    }
    for (const r of declared.rows) {
      console.log(
        `declared\t${r.tenant_key}\t${r.assessment_id}\tv${r.projection_version}\t${r.state}\tretired_at=${r.retired_at ?? "-"}`,
      );
    }

    console.log("=== 2. every generation present, per table ===");
    for (const table of TABLES) {
      const gens = await client.query(
        `select tenant_key, assessment_id, projection_version, count(*)::int as rows
           from ecl_projection.${table}
          group by tenant_key, assessment_id, projection_version
          order by tenant_key, projection_version desc`,
      );
      for (const r of gens.rows) {
        console.log(
          `generation\t${table}\t${r.tenant_key}\t${r.assessment_id}\tv${r.projection_version}\t${r.rows}`,
        );
      }
    }

    console.log("=== 3. THE SAFETY QUESTION: does one assessment carry two versions? ===");
    for (const table of TABLES) {
      const shared = await client.query(
        `select tenant_key, assessment_id,
                count(distinct projection_version)::int as versions,
                array_agg(distinct projection_version order by projection_version) as version_list
           from ecl_projection.${table}
          group by tenant_key, assessment_id
         having count(distinct projection_version) > 1`,
      );
      if (shared.rows.length === 0) {
        console.log(`assessment_scope\t${table}\tSAFE — every assessment holds exactly one version`);
      } else {
        for (const r of shared.rows) {
          console.log(
            `assessment_scope\t${table}\tUNSAFE\t${r.tenant_key}\t${r.assessment_id}\tversions=${JSON.stringify(r.version_list)}`,
          );
        }
      }
    }

    console.log("=== 4. what a state-keyed sweep would remove ===");
    const sweepable = await client.query(
      `select l.tenant_key, l.assessment_id, l.projection_version, l.retired_at
         from ecl_projection.tower_assessment_lifecycle l
        where l.state = 'retired'
        order by l.tenant_key, l.projection_version`,
    );
    if (sweepable.rows.length === 0) {
      line("sweepable", "NONE — no generation is declared retired");
    }
    for (const r of sweepable.rows) {
      for (const table of TABLES) {
        const c = await client.query(
          `select count(*)::int as rows from ecl_projection.${table}
            where tenant_key = $1 and assessment_id = $2 and projection_version = $3`,
          [r.tenant_key, r.assessment_id, r.projection_version],
        );
        console.log(
          `sweepable\t${table}\t${r.tenant_key}\t${r.assessment_id}\tv${r.projection_version}\t${c.rows[0].rows}`,
        );
      }
    }

    console.log("=== 5. undeclared generations — kept, never swept ===");
    const undeclared = await client.query(
      `select p.tenant_key, p.assessment_id, p.projection_version, count(*)::int as rows
         from ecl_projection.tower_ai_portfolio p
         left join ecl_projection.tower_assessment_lifecycle l
           on l.tenant_key = p.tenant_key
          and l.assessment_id = p.assessment_id
          and l.projection_version = p.projection_version
        where l.tenant_key is null
        group by p.tenant_key, p.assessment_id, p.projection_version
        order by p.tenant_key, p.projection_version desc`,
    );
    for (const r of undeclared.rows) {
      console.log(
        `undeclared\ttower_ai_portfolio\t${r.tenant_key}\t${r.assessment_id}\tv${r.projection_version}\t${r.rows}`,
      );
    }

    console.log("REPORT_OK");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.log(`REPORT_ERR\t${error.message}`);
  process.exit(1);
});
