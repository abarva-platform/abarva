using '../ingestion-worker-foundation.bicep'

param location = 'eastus'

param tags = {
  app: 'AbarVa'
  environment: 'lab'
  owner: 'Anand'
  dataClassification: 'no-client-data'
  purpose: 'azure-search-canonical-rebuild-after-supabase-drain'
  costControl: 'founder-review'
}

param controlPlaneResourceGroupName = 'rg-abarva-controlplane-lab-eastus'
param sharedSecurityResourceGroupName = 'rg-abarva-shared-security-lab-eastus'
param keyVaultName = 'kv-abarva-lab-001'
param containerAppsEnvironmentName = 'cae-abarva-scale-lab-eastus'
param scaleRuntimeManagedIdentityName = 'id-abarva-scale-runtime-lab-eastus'

param ingestionWorkerJobName = 'job-a24-search-canon-eus'
param imageName = 'acrabarvalab001.azurecr.io/abarva/web@sha256:8a3533af71b5fd4a81f919245fc9026b946023c34b6a479a12d113d0e7afaa74'
param registryServer = 'acrabarvalab001.azurecr.io'
param workerCommand = '''
node -e 'const {DefaultAzureCredential}=require("@azure/identity");(async()=>{const service=process.env.AZURE_SEARCH_SERVICE_NAME||"srch-abarva-context-lab-eastus";const credential=new DefaultAzureCredential(process.env.AZURE_CLIENT_ID?{managedIdentityClientId:process.env.AZURE_CLIENT_ID}:undefined);const token=await credential.getToken("https://search.azure.com/.default");if(!token||!token.token)throw new Error("managed_identity_token_missing");const url=`https://${service}.search.windows.net/indexes/tenant-context-v1?api-version=2024-07-01`;const res=await fetch(url,{method:"DELETE",headers:{Authorization:`Bearer ${token.token}`}});const text=await res.text();if(!res.ok&&res.status!==404)throw new Error(`tenant_context_delete_failed:${res.status}:${text}`);console.log(JSON.stringify({event:"azure_search_index_deleted",index:"tenant-context-v1",status:res.status}));})().catch(e=>{console.error(e.stack||e.message);process.exit(1)})'
npx tsx src/scripts/azure-ai-search-indexes.ts apply
node <<'NODE'
const { DefaultAzureCredential } = require("@azure/identity");
const { Client } = require("pg");

const aliasMap = {
  meridian: "meridian-health",
  "meridian-healthcare": "meridian-health",
  skyharbor: "skyharbor-air",
  "skyharbor-airlines": "skyharbor-air",
};

function canonicalTenantKey(value) {
  const key = String(value || "").trim().toLowerCase().replace(/_/g, "-");
  return aliasMap[key] || key;
}

function searchId(tenant, chunkId) {
  return Buffer.from(`${tenant}:${chunkId}`, "utf8").toString("base64url");
}

function safeString(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeNumber(value, fallback) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function truncateUtf8(value, maxBytes) {
  let bytes = 0;
  let output = "";
  for (const char of String(value || "")) {
    const charBytes = Buffer.byteLength(char, "utf8");
    if (bytes + charBytes > maxBytes) break;
    output += char;
    bytes += charBytes;
  }
  return output;
}

function toDoc(row, now) {
  const tenant = canonicalTenantKey(row.tenant_key);
  const metadata = row.chunk_metadata || {};
  const provenance = row.provenance || {};
  const sourceSegment = safeString(row.source_segment_id, "unknown");
  const sourceDoc = safeString(row.source_doc, sourceSegment);
  const sourcePath = safeString(row.source_path, sourceDoc);
  return {
    "@search.action": "upload",
    id: searchId(tenant, row.chunk_id),
    tenant_key: tenant,
    source_segment: sourceSegment,
    record_id: safeString(row.source_record_id, row.chunk_id),
    chunk_id: row.chunk_id,
    title: sourceDoc,
    body: truncateUtf8(row.chunk_text, 30000),
    source_uri: sourcePath,
    confidence: safeNumber(metadata.confidence ?? provenance.confidence, 0.8),
    sensitivity: safeString(metadata.classification ?? metadata.sensitivity ?? provenance.classification, "internal"),
    last_seen_at: row.embedded_at || now.toISOString(),
  };
}

async function searchFetch(path, init, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("fetch_timeout")), timeoutMs);
  try {
    const service = process.env.AZURE_SEARCH_SERVICE_NAME || "srch-abarva-context-lab-eastus";
    return await fetch(`https://${service}.search.windows.net${path}${path.includes("?") ? "&" : "?"}api-version=2024-07-01`, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function countTenant(token, tenant) {
  const res = await searchFetch("/indexes/tenant-context-v1/docs/search", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      search: "*",
      count: true,
      top: 0,
      filter: `tenant_key eq '${tenant.replace(/'/g, "''")}'`,
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`count_failed:${tenant}:${res.status}:${text}`);
  return Number(JSON.parse(text)["@odata.count"] || 0);
}

(async () => {
  const credential = new DefaultAzureCredential(
    process.env.AZURE_CLIENT_ID
      ? { managedIdentityClientId: process.env.AZURE_CLIENT_ID }
      : undefined,
  );
  const token = await credential.getToken("https://search.azure.com/.default");
  if (!token || !token.token) throw new Error("managed_identity_token_missing");

  const db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 120000,
  });
  await db.connect();
  const result = await db.query(`
    select
      tenant_key,
      chunk_id,
      source_segment_id,
      source_record_id,
      source_doc,
      source_path,
      chunk_index,
      chunk_text,
      embedded_at,
      provenance,
      chunk_metadata
    from enterprise_context_chunks
    order by tenant_key, chunk_id
  `);
  await db.end();

  const now = new Date();
  const expectedIds = {};
  for (const row of result.rows) {
    const tenant = canonicalTenantKey(row.tenant_key);
    expectedIds[tenant] ||= new Set();
    expectedIds[tenant].add(searchId(tenant, row.chunk_id));
  }
  const expected = Object.fromEntries(
    Object.entries(expectedIds).map(([tenant, ids]) => [tenant, ids.size]).sort(),
  );

  let uploadedRows = 0;
  const batchSize = Number(process.env.AZURE_SEARCH_BACKFILL_BATCH_SIZE || 500);
  for (let offset = 0; offset < result.rows.length; offset += batchSize) {
    const docs = result.rows.slice(offset, offset + batchSize).map((row) => toDoc(row, now));
    const res = await searchFetch("/indexes/tenant-context-v1/docs/index", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token.token}`,
      },
      body: JSON.stringify({ value: docs }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`upload_failed:${res.status}:${text}`);
    const body = text ? JSON.parse(text) : {};
    const failed = (body.value || []).filter((item) => item && item.status === false);
    if (failed.length > 0) {
      throw new Error(`upload_partial_failure:${JSON.stringify(failed.slice(0, 5))}`);
    }
    uploadedRows += docs.length;
    console.log(JSON.stringify({ event: "azure_search_canonical_batch_uploaded", uploadedRows }));
  }

  const observed = {};
  let mismatches = [];
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    for (const tenant of Object.keys(expected).sort()) {
      observed[tenant] = await countTenant(token.token, tenant);
    }
    mismatches = Object.entries(expected)
      .filter(([tenant, count]) => observed[tenant] !== count)
      .map(([tenant, count]) => ({ tenant, expected: count, observed: observed[tenant] || 0 }));
    if (mismatches.length === 0) break;
    console.log(JSON.stringify({ event: "azure_search_canonical_verify_wait", attempt, observed, mismatches }));
    await new Promise((resolve) => setTimeout(resolve, 15000));
  }

  console.log(JSON.stringify({
    event: mismatches.length === 0
      ? "azure_search_canonical_rebuild_verified"
      : "azure_search_canonical_rebuild_mismatch",
    sourceRows: result.rows.length,
    expected,
    observed,
    mismatches,
  }, null, 2));

  if (mismatches.length > 0) process.exit(1);
})().catch((err) => {
  console.error(JSON.stringify({
    event: "azure_search_canonical_rebuild_failed",
    error: err && err.stack ? err.stack : String(err),
  }));
  process.exit(1);
});
NODE
'''

param plainRuntimeEnv = [
  {
    name: 'AZURE_SEARCH_SERVICE_NAME'
    value: 'srch-abarva-context-lab-eastus'
  }
  {
    name: 'AZURE_CLIENT_ID'
    value: '3b6e0c9d-2265-499f-af46-965e0ad78b95'
  }
  {
    name: 'AZURE_SEARCH_BACKFILL_BATCH_SIZE'
    value: '500'
  }
]

param keyVaultSecretRefs = [
  {
    envName: 'DATABASE_URL'
    containerAppSecretName: 'azure-postgres-control-database-url'
    keyVaultSecretUri: 'https://kv-abarva-lab-001.vault.azure.net/secrets/azure-postgres-control-database-url'
  }
]
