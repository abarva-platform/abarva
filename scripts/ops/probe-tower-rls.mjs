/**
 * Read-only report of who can actually read the Tower projection tables.
 *
 * All four have RLS enabled with zero policies. In Postgres that denies every read to any role
 * which does not bypass RLS — and the application reads them successfully, so its role must be
 * bypassing. That makes tenant isolation a property of the reader's `where tenant_key = $1` rather
 * than of the data.
 *
 * Before adding policies it is worth establishing which of the three bypass routes is in play,
 * because they behave differently: table ownership (bypassed unless FORCE is set), the BYPASSRLS
 * attribute, or superuser. Adding a permissive policy is safe in all three — a table with RLS on
 * and no policies already denies everything, so a policy can only grant — but the route decides
 * whether the policy will ever actually be exercised.
 *
 * Strictly read-only.
 */
import process from "node:process";
const TABLES = ["tower_ai_portfolio","tower_command_center","tower_value_chain","tower_evidence_queue"];
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const { default: pg } = await import("pg");
  const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();
  try {
    const me = await c.query(
      `select current_user as who, r.rolsuper, r.rolbypassrls
         from pg_roles r where r.rolname = current_user`);
    console.log(`role\t${me.rows[0].who}\tsuperuser=${me.rows[0].rolsuper}\tbypassrls=${me.rows[0].rolbypassrls}`);
    const t = await c.query(
      `select c.relname, c.relrowsecurity as rls, c.relforcerowsecurity as forced,
              pg_get_userbyid(c.relowner) as owner,
              (select count(*)::int from pg_policies p
                where p.schemaname='ecl_projection' and p.tablename=c.relname) as policies
         from pg_class c join pg_namespace n on n.oid=c.relnamespace
        where n.nspname='ecl_projection' and c.relname = any($1)
        order by c.relname`, [TABLES]);
    for (const r of t.rows) {
      console.log(`table\t${r.relname}\trls=${r.rls}\tforced=${r.forced}\towner=${r.owner}\tpolicies=${r.policies}`);
    }
    const guc = await c.query(`select current_setting('app.tenant_key', true) as tenant`);
    console.log(`guc\tapp.tenant_key=${guc.rows[0].tenant ?? "<unset>"}`);
    console.log("RLS_PROBE_OK");
  } finally { await c.end(); }
}
main().catch((e) => { console.log(`RLS_PROBE_ERR\t${e.message}`); process.exit(1); });
