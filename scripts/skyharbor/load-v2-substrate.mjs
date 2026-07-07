// Operator load: SkyHarbor v2 synthetic dataset → governed enterprise_context_* tables.
// Faithful operator-script execution of the governed loader contract (same pattern
// as scripts/skyharbor/stages/.../azure_postgres_loader.mjs and lakeshore loader):
// stages originals to Azure Blob (managed identity), then commits chunks + sources +
// source_files + records (upsert by canonical_record_id) + facts (supersede by
// fact_key, upsert) with deterministic dimension→segment→record_type routing.
// Idempotent: re-runs upsert/supersede, never destructive-delete.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import crypto from "node:crypto";
import Papa from "papaparse";
import { Client } from "pg";

const DATASET = "/app/dataset";
const TENANT = "skyharbor-air";
const CLIENT_ID = "6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301";
const DATASET_ID = "skyharbor-air-synthetic-v2";
const SOURCE_SYSTEM = "admin_bulk_context_upload";
const NOW = new Date().toISOString();
const ACCOUNT = process.env.DATA_PLANE_OBJECT_STORE_ACCOUNT;
const CONTAINER = process.env.DATA_PLANE_OBJECT_STORE_CONTAINER;

const TEMPLATE_DIM = {
  "enterprise-profile": "enterprise_profile", "financial-kpi-workbook": "financial_kpis",
  "org-roles": "org_roles_teams", "application-portfolio": "application_portfolio",
  "infrastructure-estate": "infrastructure_estate", "integration-topology": "integration_topology",
  "vendor-contracts": "vendor_contracts", "sla-register": "service_levels",
  "initiative-portfolio": "transformation_initiatives", "dora-baseline": "delivery_dora_devex",
  "incidents-change-history": "incidents_ops_telemetry", "ai-tool-footprint": "ai_tooling_model_inventory",
  "business-capability-map": "business_capability", "erp-landscape-workbook": "erp_landscape",
};
const DIM_SEGMENT = {
  enterprise_profile: "enterprise_profile", financial_kpis: "it_financials", org_roles_teams: "org_structure",
  application_portfolio: "it_landscape", infrastructure_estate: "infrastructure", integration_topology: "it_landscape",
  vendor_contracts: "it_financials", service_levels: "it_landscape", transformation_initiatives: "program_inventory",
  delivery_dora_devex: "program_inventory", incidents_ops_telemetry: "it_landscape",
  ai_tooling_model_inventory: "it_landscape", business_capability: "enterprise_profile", erp_landscape: "it_landscape",
};
const recordType = (dim, row) => {
  if (dim === "org_roles_teams") return "org_role";
  if (dim === "financial_kpis") return "kpi_metric";
  if (dim === "vendor_contracts") return "contract";
  if (dim === "transformation_initiatives") return "initiative";
  if (dim === "service_levels") return "service_level";
  if (dim === "integration_topology") return "integration";
  if (dim === "business_capability") return "business_capability";
  if (dim === "enterprise_profile") return "enterprise_profile";
  if (dim === "infrastructure_estate") return String(row.asset_class || "").toLowerCase().includes("data center") ? "facility" : "configuration_item";
  if (dim === "application_portfolio" || dim === "erp_landscape") return "cmdb_application";
  return dim.replace(/-/g, "_");
};
const ID_COLS = ["app_id", "vendor_id", "person_id", "sla_id", "edge_id", "incident_id", "team_id", "tool_id", "cap_id", "erp_object_id", "initiative_id", "line_id", "asset_name"];
const TITLE_COLS = ["name", "title", "vendor_name", "service_name", "capability_name", "asset_name", "metric", "role"];
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
const pickCol = (row, cols) => { for (const c of cols) if (row[c] != null && String(row[c]).trim() !== "") return String(row[c]); return null; };

async function stageBlob(fileName, bytes, dim, segment) {
  if (!ACCOUNT || !CONTAINER) return { staged: false, reason: "no storage env" };
  try {
    const { BlobServiceClient } = await import("@azure/storage-blob");
    const { DefaultAzureCredential } = await import("@azure/identity");
    const cred = new DefaultAzureCredential({ managedIdentityClientId: process.env.AZURE_CLIENT_ID });
    const svc = new BlobServiceClient(`https://${ACCOUNT}.blob.core.windows.net`, cred);
    const path = `${TENANT}/${DATASET_ID}/${sha(fileName).slice(0, 12)}/${fileName}`;
    await svc.getContainerClient(CONTAINER).getBlockBlobClient(path).uploadData(bytes, {
      blobHTTPHeaders: { blobContentType: "text/csv" },
      metadata: { tenant_key: TENANT, client_id: CLIENT_ID, dataset_id: DATASET_ID, dimension: dim, segment, source_system: SOURCE_SYSTEM, sha256: sha(bytes.toString()) },
    });
    return { staged: true, path };
  } catch (e) { return { staged: false, reason: String(e.message || e).slice(0, 120) }; }
}

(async () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await db.connect();
  const result = { ts: NOW, files: [], totals: { chunks: 0, records: 0, facts: 0, superseded: 0, blob_staged: 0 } };

  // one source row for the load
  const srcRes = await db.query(
    `insert into enterprise_context_sources (client_id, tenant_key, source_system, source_key, source_type, display_name, sync_cadence, metadata, updated_at)
     values ($1,$2,$3,$4,'bulk_upload',$5,'manual',$6,now())
     on conflict (tenant_key, source_system, source_key) do update set updated_at=now(), display_name=excluded.display_name
     returning id`,
    [CLIENT_ID, TENANT, SOURCE_SYSTEM, DATASET_ID, "SkyHarbor v2 comprehensive substrate", JSON.stringify({ dataset_id: DATASET_ID, basis: "synthetic_comparable" })]
  );
  const sourceId = srcRes.rows[0].id;

  const manifest = JSON.parse(readFileSync(join(DATASET, "manifest.json"), "utf8"));
  for (const f of manifest.files) {
    const dim = TEMPLATE_DIM[f.templateId];
    if (!dim) { result.files.push({ file: f.path, error: `no dim for ${f.templateId}` }); continue; }
    const segment = DIM_SEGMENT[dim];
    const bytes = readFileSync(join(DATASET, "csv", f.path));
    const parsed = Papa.parse(bytes.toString("utf8"), { header: true, skipEmptyLines: true });
    const rows = parsed.data.filter((row) => Object.values(row).some((v) => String(v ?? "").trim() !== ""));

    const blob = await stageBlob(f.path, bytes, dim, segment);
    if (blob.staged) result.totals.blob_staged++;

    const sourceFileId = `${DATASET_ID}:${f.path}`;
    const sfRes = await db.query(
      `insert into enterprise_context_source_files (client_id, tenant_key, source_id, source_file_id, source_system, source_file, source_path, file_hash, row_count, imported_by, metadata, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now())
       on conflict (tenant_key, source_file_id) do update set row_count=excluded.row_count, file_hash=excluded.file_hash, source_path=excluded.source_path, updated_at=now()
       returning id`,
      [CLIENT_ID, TENANT, sourceId, sourceFileId, SOURCE_SYSTEM, f.path, blob.path || `dataset/csv/${f.path}`, sha(bytes.toString()), rows.length, "operator-load", JSON.stringify({ dimension: dim, segment, templateId: f.templateId, blob })]
    );
    const sourceFileUuid = sfRes.rows[0].id;

    let rc = 0, fc = 0, sc = 0, cc = 0, idx = 0;
    for (const row of rows) {
      idx++;
      const rid = pickCol(row, ID_COLS) || `row${idx}`;
      const srcRecId = `${f.path}:${rid}`;
      const canonical = `${sourceFileId}:${slug(rid)}`;
      const rtype = recordType(dim, row);
      const title = pickCol(row, TITLE_COLS) || rid;

      const recRes = await db.query(
        `insert into enterprise_context_records (client_id, tenant_key, canonical_record_id, record_type, title, source_id, source_file_id, source_system, source_record_id, source_file, source_row_number, payload, payload_hash, confidence, freshness_status, lifecycle_state, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'fresh','active',now())
         on conflict (tenant_key, canonical_record_id) do update set title=excluded.title, record_type=excluded.record_type, payload=excluded.payload, payload_hash=excluded.payload_hash, source_file_id=excluded.source_file_id, lifecycle_state='active', updated_at=now()
         returning id`,
        [CLIENT_ID, TENANT, canonical, rtype, title, sourceId, sourceFileUuid, SOURCE_SYSTEM, srcRecId, f.path, idx, JSON.stringify(row), sha(JSON.stringify(row)), 0.88]
      );
      const recordId = recRes.rows[0].id;
      rc++;

      // facts: one per non-empty column. Supersede prior active facts for these keys, then upsert.
      const keys = Object.keys(row).filter((k) => String(row[k] ?? "").trim() !== "");
      if (keys.length) {
        const sup = await db.query(
          `update enterprise_context_facts set lifecycle_state='superseded', updated_at=now()
           where tenant_key=$1 and record_id=$2 and lifecycle_state='active' and fact_key = any($3)`,
          [TENANT, recordId, keys]
        );
        sc += sup.rowCount || 0;
        for (const k of keys) {
          const val = String(row[k]);
          const isNum = /^-?\d+(\.\d+)?$/.test(val);
          const vhash = sha(`${k}=${val}`);
          const r2 = await db.query(
            `insert into enterprise_context_facts (client_id, tenant_key, record_id, fact_key, fact_type, fact_value, fact_text, source_system, source_record_id, source_file, value_hash, confidence, freshness_status, lifecycle_state, updated_at)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'fresh','active',now())
             on conflict (tenant_key, record_id, fact_key, value_hash) do update set lifecycle_state='active', updated_at=now()
             returning id`,
            [CLIENT_ID, TENANT, recordId, k, isNum ? "number" : "string", JSON.stringify(isNum ? { value: Number(val) } : { value: val }), val.slice(0, 500), SOURCE_SYSTEM, srcRecId, f.path, vhash, 0.88]
          );
          if (r2.rowCount) fc++;
        }
      }

      // chunk: retrievable text per record
      const chunkText = `${title} (${rid})\n` + keys.map((k) => `${k}: ${row[k]}`).join("\n");
      const chunkId = `ctx:${TENANT}:${segment}:${slug(srcRecId)}:c0`;
      const ch = await db.query(
        `insert into enterprise_context_chunks (client_id, tenant_key, chunk_id, source_segment_id, source_record_id, source_doc, source_path, chunk_index, chunk_text, token_count, embedding_status, provenance, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7,0,$8,$9,'pending',$10,now())
         on conflict (tenant_key, chunk_id) do update set chunk_text=excluded.chunk_text, source_doc=excluded.source_doc, updated_at=now()
         returning id`,
        [CLIENT_ID, TENANT, chunkId, segment, srcRecId, f.path, blob.path || `dataset/csv/${f.path}`, chunkText, Math.ceil(chunkText.length / 4), JSON.stringify({ dataset_id: DATASET_ID, source_file: f.path, committed_at: NOW, dimension: dim })]
      );
      if (ch.rowCount) cc++;
    }
    result.files.push({ file: f.path, dimension: dim, segment, record_type: recordType(dim, rows[0] || {}), rows: rows.length, records: rc, facts: fc, superseded: sc, chunks: cc, blob });
    result.totals.records += rc; result.totals.facts += fc; result.totals.superseded += sc; result.totals.chunks += cc;
  }
  await db.end();
  console.log("SKYLOAD_BEGIN" + JSON.stringify(result) + "SKYLOAD_END");
})().catch((e) => { console.log("SKYLOAD_BEGIN" + JSON.stringify({ fatal: String(e.stack || e.message || e).slice(0, 400) }) + "SKYLOAD_END"); process.exit(1); });
