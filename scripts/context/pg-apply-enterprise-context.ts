// ---- pg-port of load-enterprise-context.ts applyPlan, for apexretail ----
// Dataset is baked into the image at /app/data/apexretail (image abarva/clf-apex-data).
import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import {
  parseMeridianEnterpriseContextDataset,
  buildMeridianEnterpriseContextIngestionPlan,
  retargetEnterpriseContextIngestionPlan,
} from "@/lib/enterprise-context/ingestion/meridian-loader";

const M = "___APEX___";
const emit = (k: string, v: unknown) => console.log(`${M}${k}${M}` + JSON.stringify(v));

const PROFILE = {
  tenantKey: "apexretail",
  name: "Apex Retail",
  legalName: "Apex Retail Group",
  industryCode: "retail",
  slugs: ["apex-retail", "apexretail"],
  aliases: ["Apex Retail", "Apex Retail Group"],
};
const IMPORTED_BY = `${PROFILE.legalName} Enterprise Context synthetic Day One import`;
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const SOURCE_ROOT = "/app/data/apexretail";

// ---- build plan via in-image builder ----
const parsed = parseMeridianEnterpriseContextDataset(SOURCE_ROOT);
const built = buildMeridianEnterpriseContextIngestionPlan(parsed);
const plan: any = retargetEnterpriseContextIngestionPlan(built, PROFILE.tenantKey);
emit("SUMMARY", { tenantKey: plan.tenantKey, sourceRoot: plan.sourceRoot, summary: plan.summary });

if (process.env.APPLY !== "1") {
  emit("DRYRUN", { note: "APPLY!=1; not writing", planned: plan.summary });
  process.exit(0);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
const now = new Date().toISOString();

// ---- column-type cache for safe coercion ----
const colTypeCache = new Map<string, Map<string, { dataType: string; udt: string }>>();
async function colTypes(table: string) {
  if (colTypeCache.has(table)) return colTypeCache.get(table)!;
  const r = await pool.query(
    `SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name=$1`,
    [table],
  );
  const m = new Map<string, { dataType: string; udt: string }>();
  for (const row of r.rows) m.set(row.column_name, { dataType: row.data_type, udt: row.udt_name });
  colTypeCache.set(table, m);
  return m;
}

function dedupe(rows: any[], keys: string[]) {
  return [...new Map(rows.map((r) => [keys.map((k) => String(r[k] ?? "")).join("\u0000"), r])).values()];
}

async function upsert(table: string, rows: any[], conflict: string): Promise<number> {
  if (!rows.length) return 0;
  const keys = conflict.split(",").map((s) => s.trim());
  const deduped = dedupe(rows, keys);
  const types = await colTypes(table);
  // Some tables (e.g. enterprise_context_relationships) have no DEFAULT on id →
  // generate one for rows that lack it. id is never part of the conflict update.
  if (types.has("id")) for (const r of deduped) if (r.id == null) r.id = randomUUID();
  // columns = union of present keys that are real columns
  const colSet = new Set<string>();
  for (const r of deduped) for (const k of Object.keys(r)) if (types.has(k) && r[k] !== undefined) colSet.add(k);
  const cols = [...colSet];
  const batchSize = 250;
  for (let i = 0; i < deduped.length; i += batchSize) {
    const batch = deduped.slice(i, i + batchSize);
    const params: any[] = [];
    const tuples: string[] = [];
    for (const r of batch) {
      const ph: string[] = [];
      for (const c of cols) {
        const t = types.get(c)!;
        let v = r[c];
        if (v === undefined) v = null;
        if (v !== null && (t.udt === "jsonb" || t.udt === "json")) {
          params.push(JSON.stringify(v));
          ph.push(`$${params.length}::jsonb`);
        } else if (t.dataType === "ARRAY") {
          params.push(v == null ? null : Array.isArray(v) ? v : [v]);
          ph.push(`$${params.length}`);
        } else {
          params.push(v);
          ph.push(`$${params.length}`);
        }
      }
      tuples.push(`(${ph.join(",")})`);
    }
    const updates = cols.filter((c) => !keys.includes(c) && c !== "id").map((c) => `${c}=EXCLUDED.${c}`);
    const sql =
      `INSERT INTO ${table} (${cols.join(",")}) VALUES ${tuples.join(",")} ` +
      `ON CONFLICT (${keys.join(",")}) DO UPDATE SET ${updates.join(",")}`;
    await pool.query(sql, params);
  }
  return deduped.length;
}

async function idMap(table: string, keyCol: string, vals: string[]) {
  const out = new Map<string, string>();
  const uniq = [...new Set(vals.filter(Boolean))];
  const r = await pool.query(
    `SELECT id, ${keyCol} AS k FROM ${table} WHERE tenant_key=$1 AND ${keyCol} = ANY($2::text[])`,
    [PROFILE.tenantKey, uniq],
  );
  for (const row of r.rows) out.set(String(row.k), String(row.id));
  return out;
}

async function ensureClientId(): Promise<string> {
  const tryCol = async (col: string, vals: string[]) => {
    for (const v of vals) {
      const r = await pool.query(`SELECT id FROM clients WHERE ${col}=$1 LIMIT 1`, [v]);
      if (r.rows[0]?.id) return String(r.rows[0].id);
    }
    return null;
  };
  const id =
    (await tryCol("tenant_key", [PROFILE.tenantKey])) ||
    (await tryCol("slug", PROFILE.slugs)) ||
    (await tryCol("name", PROFILE.aliases)) ||
    (await tryCol("legal_name", PROFILE.aliases));
  if (id) {
    await pool.query(
      `UPDATE clients SET name=$2, legal_name=$3, industry_code=$4, slug=$5, tenant_key=$6 WHERE id=$1`,
      [id, PROFILE.name, PROFILE.legalName, PROFILE.industryCode, PROFILE.slugs[0], PROFILE.tenantKey],
    );
    return id;
  }
  const r = await pool.query(
    `INSERT INTO clients (name, legal_name, industry_code, slug, tenant_key) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [PROFILE.name, PROFILE.legalName, PROFILE.industryCode, PROFILE.slugs[0], PROFILE.tenantKey],
  );
  return String(r.rows[0].id);
}

async function main() {
  const clientId = await ensureClientId();
  emit("CLIENT", { clientId });

  const sourceRows = plan.sources.map((s: any) => ({
    client_id: clientId, tenant_key: plan.tenantKey, source_system: s.sourceSystem, source_key: s.sourceKey,
    source_type: s.sourceSystem === "day_one_template" ? "template_workbook" : "source_system_export",
    display_name: s.displayName, system_of_record: s.sourceSystem !== "day_one_template",
    source_owner: s.sourceOwner, steward_owner: "Enterprise Context Stewardship",
    sync_cadence: s.sourceSystem === "day_one_template" ? "manual" : "weekly",
    tenant_aliases: [PROFILE.tenantKey, ...PROFILE.slugs, ...PROFILE.aliases.map(slugify)],
    source_status: "active", last_synced_at: now, last_validated_at: "2026-05-01", confidence: 0.86,
    freshness_status: "fresh", evidence_pointer: `${plan.sourceRoot}/manifest.json`,
    metadata: { imported_by: IMPORTED_BY }, updated_at: now,
  }));
  const nSources = await upsert("enterprise_context_sources", sourceRows, "tenant_key,source_system,source_key");
  const sourceIdBySystem = await idMap("enterprise_context_sources", "source_system", plan.sources.map((s: any) => s.sourceSystem));
  const dayOne = sourceIdBySystem.get("day_one_template") ?? null;

  const sfRows = plan.sourceFiles.map((sf: any) => ({
    client_id: clientId, tenant_key: plan.tenantKey, source_id: dayOne, source_file_id: sf.sourceFileId,
    source_system: sf.sourceSystem, source_file: sf.sourceFile, source_path: `${plan.sourceRoot}/${sf.sourceFile}`,
    workbook_name: sf.workbookName, sheet_names: ["Instructions", "Data Dictionary", "Data"], row_count: sf.rowCount,
    imported_by: IMPORTED_BY, last_synced_at: now, last_validated_at: "2026-05-01", confidence: 0.86,
    freshness_status: "fresh", evidence_pointer: `${sf.sourceFile}#Data`, metadata: { source_root: plan.sourceRoot }, updated_at: now,
  }));
  const nSourceFiles = await upsert("enterprise_context_source_files", sfRows, "tenant_key,source_file_id");
  const sfIdByKey = await idMap("enterprise_context_source_files", "source_file_id", plan.sourceFiles.map((sf: any) => sf.sourceFileId));

  const recRows = plan.records.map((r: any) => ({
    client_id: clientId, tenant_key: r.tenantKey, canonical_record_id: r.canonicalRecordId, record_type: r.recordType,
    title: r.title, source_id: sourceIdBySystem.get(r.sourceSystem) ?? null,
    source_file_id: sfIdByKey.get(`${r.tenantKey}:${r.recordType}`) ?? null, source_system: r.sourceSystem,
    source_record_id: r.sourceRecordId, source_file: r.sourceFile, source_sheet: r.sourceSheet, source_row_number: r.sourceRowNumber,
    owner: r.owner, steward_owner: "Enterprise Context Stewardship", last_synced_at: now, last_validated_at: r.lastValidatedAt,
    confidence: r.confidence, freshness_status: r.freshnessStatus, evidence_pointer: r.evidencePointer,
    lifecycle_state: r.lifecycleState, payload_hash: r.payloadHash, payload: r.payload, updated_at: now,
  }));
  const nRecords = await upsert("enterprise_context_records", recRows, "tenant_key,canonical_record_id");
  const recIdByCanon = await idMap("enterprise_context_records", "canonical_record_id", plan.records.map((r: any) => r.canonicalRecordId));

  const factRows = plan.facts.map((f: any) => ({
    client_id: clientId, tenant_key: f.tenantKey, record_id: recIdByCanon.get(f.canonicalRecordId), fact_key: f.factKey,
    fact_type: f.factType, fact_value: f.factValue, fact_text: f.factText, source_system: f.sourceSystem,
    source_record_id: f.sourceRecordId, source_file: f.sourceFile, source_sheet: f.sourceSheet, source_row_number: f.sourceRowNumber,
    owner: f.owner, last_synced_at: now, last_validated_at: f.lastValidatedAt, confidence: f.confidence,
    freshness_status: f.freshnessStatus, evidence_pointer: f.evidencePointer, lifecycle_state: f.lifecycleState,
    value_hash: f.valueHash, updated_at: now,
  })).filter((f: any) => f.record_id);
  const nFacts = await upsert("enterprise_context_facts", factRows, "tenant_key,record_id,fact_key,value_hash");

  const relRows = plan.relationships.map((rel: any) => ({
    client_id: clientId, tenant_key: rel.tenantKey, relationship_key: rel.relationshipKey, relationship_type: rel.relationshipType,
    from_record_id: recIdByCanon.get(`${plan.tenantKey}:cmdb_applications_services:${rel.fromExternalId}`) ?? null,
    to_record_id: recIdByCanon.get(`${plan.tenantKey}:cmdb_applications_services:${rel.toExternalId}`) ?? null,
    from_external_id: rel.fromExternalId, to_external_id: rel.toExternalId, source_system: rel.sourceSystem,
    source_record_id: rel.sourceRecordId, source_file: rel.sourceFile, source_sheet: rel.sourceSheet, source_row_number: rel.sourceRowNumber,
    owner: rel.owner, last_synced_at: now, last_validated_at: rel.lastValidatedAt, confidence: rel.confidence,
    freshness_status: rel.freshnessStatus, evidence_pointer: rel.evidencePointer, lifecycle_state: "active", properties: rel.properties, updated_at: now,
  }));
  const nRels = await upsert("enterprise_context_relationships", relRows, "tenant_key,relationship_key");

  const evRows = plan.evidence.map((e: any) => ({
    client_id: clientId, tenant_key: e.tenantKey, evidence_key: e.evidenceKey, evidence_type: e.evidenceType,
    record_id: recIdByCanon.get(e.canonicalRecordId), citation_label: e.citationLabel, citation_locator: e.citationLocator,
    evidence_pointer: e.evidencePointer, source_system: e.sourceSystem, source_record_id: e.sourceRecordId, source_file: e.sourceFile,
    source_sheet: e.sourceSheet, source_row_number: e.sourceRowNumber, owner: e.owner, evidence_usable: e.evidenceUsable,
    last_synced_at: now, last_validated_at: "2026-05-01", confidence: e.confidence, freshness_status: e.freshnessStatus,
    lifecycle_state: "active", metadata: { source_root: plan.sourceRoot }, updated_at: now,
  })).filter((e: any) => e.record_id);
  const nEvidence = await upsert("enterprise_context_evidence", evRows, "tenant_key,evidence_key");

  emit("APPLIED", { clientId, sources: nSources, sourceFiles: nSourceFiles, records: nRecords, facts: nFacts, relationships: nRels, evidence: nEvidence });

  // independent verify
  const v = await pool.query(
    `SELECT 'records' t, count(*) n FROM enterprise_context_records WHERE tenant_key='apexretail'
     UNION ALL SELECT 'facts', count(*) FROM enterprise_context_facts WHERE tenant_key='apexretail'
     UNION ALL SELECT 'facts_active', count(*) FROM enterprise_context_facts WHERE tenant_key='apexretail' AND lifecycle_state='active'
     UNION ALL SELECT 'orphan_facts', count(*) FROM enterprise_context_facts f LEFT JOIN enterprise_context_records r ON r.id=f.record_id WHERE f.tenant_key='apexretail' AND r.id IS NULL
     UNION ALL SELECT 'evidence', count(*) FROM enterprise_context_evidence WHERE tenant_key='apexretail'`,
  );
  emit("VERIFY", v.rows);
  const dup = await pool.query(
    `SELECT count(*) n FROM (SELECT record_id, fact_key, value_hash FROM enterprise_context_facts WHERE tenant_key='apexretail' GROUP BY 1,2,3 HAVING count(*)>1) d`,
  );
  emit("DUP_FACT_IDENTITY", dup.rows[0]);
  const byType = await pool.query(
    `SELECT record_type, lifecycle_state, count(*) n FROM enterprise_context_records WHERE tenant_key='apexretail' GROUP BY 1,2 ORDER BY 1`,
  );
  emit("RECORDS_BY_TYPE", byType.rows);
  await pool.end();
  console.log(`${M}DONE${M}{}`);
}
main().catch((e) => { emit("ERR", { error: e.message, stack: (e.stack || "").slice(0, 600) }); process.exit(1); });
