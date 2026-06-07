#!/usr/bin/env node
// Azure-only DB target guard — fail closed on Supabase.
//
// Purpose: BEFORE any context/corpus audit or data operation, prove which
// database would actually be queried. Supabase must never be used again; the
// only acceptable target is the private Azure Postgres.
//
// Policy (all enforced; exit 1 on any violation):
//   1. Never print secret values — only a redacted host classification.
//   2. If DATABASE_URL host is Supabase, this is NOT an Azure audit -> FAIL.
//   3. An Azure target env var must be set (ABARVA_AZURE_DATABASE_URL, or an
//      explicitly Azure-named var) and must classify as AZURE.
//   4. The EFFECTIVE target (what the app would use, Azure-preferred) must be
//      AZURE. If any path would fall back to Supabase -> FAIL.
//
// Usage:
//   unset NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY
//   test -n "$ABARVA_AZURE_DATABASE_URL" || { echo "FAIL: ..."; exit 1; }
//   node scripts/data-plane/assert-azure-db-target.mjs

const AZURE_HOST_RE = /(postgres\.database\.azure\.com)$|^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/i;
const SUPABASE_HOST_RE = /supabase/i;

function classify(value) {
  if (!value) return { present: false, kind: "ABSENT", host: null };
  let host = null;
  try {
    host = new URL(value).host.split(":")[0];
  } catch {
    return { present: true, kind: "UNPARSEABLE", host: null };
  }
  const kind = SUPABASE_HOST_RE.test(host)
    ? "SUPABASE"
    : AZURE_HOST_RE.test(host)
      ? "AZURE"
      : "OTHER";
  return { present: true, kind, host };
}

// Redact a host so it can be printed safely: keep the public suffix shape,
// mask everything identifying. e.g. pg-xxx...azure.com -> p*-***...database.azure.com
function redactHost(host) {
  if (!host) return "(none)";
  if (/^10\.\d/.test(host)) return "10.x.x.x (private VNet)";
  const parts = host.split(".");
  const head = parts[0] ?? "";
  const maskedHead = head.length <= 2 ? "*".repeat(head.length) : head.slice(0, 1) + "*".repeat(head.length - 1);
  const suffix = parts.slice(-3).join(".");
  return `${maskedHead}….${suffix}`;
}

const AZURE_VARS = ["ABARVA_AZURE_DATABASE_URL", "AZURE_DATABASE_URL", "AZURE_POSTGRES_URL"];
const azureVar = AZURE_VARS.find((n) => process.env[n]);
const azure = classify(azureVar ? process.env[azureVar] : undefined);
const legacy = classify(process.env.DATABASE_URL);

const failures = [];

// 2. DATABASE_URL must not be a Supabase target.
if (legacy.kind === "SUPABASE") {
  failures.push(
    "DATABASE_URL points at SUPABASE. Supabase is decommissioned for this work; do not proceed with an Azure audit.",
  );
}

// 3. An Azure target must be present and classify as AZURE.
if (!azureVar) {
  failures.push(
    `No Azure target env var set (one of: ${AZURE_VARS.join(", ")}). This would not be an Azure audit.`,
  );
} else if (azure.kind !== "AZURE") {
  failures.push(
    `${azureVar} does not classify as Azure Postgres (got ${azure.kind}). Expected *.postgres.database.azure.com or a private 10.x host.`,
  );
}

// 4. Effective target (Azure-preferred): the app uses the Azure var when set,
// else DATABASE_URL. If the effective target is anything but AZURE -> fail.
const effective = azureVar ? azure : legacy;
if (effective.kind !== "AZURE") {
  failures.push(
    `Effective DB target classifies as ${effective.kind}, not AZURE. Any fallback to Supabase is forbidden.`,
  );
}

// 5. Supabase client env must be unset during the audit.
for (const n of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) {
  if (process.env[n]) {
    failures.push(`${n} is set; unset all Supabase env vars during an Azure audit.`);
  }
}

const report = {
  ok: failures.length === 0,
  kind: "azure-db-target-guard",
  azure_target_var: azureVar ?? null,
  azure_target: { kind: azure.kind, host: redactHost(azure.host) },
  database_url: { kind: legacy.kind, host: redactHost(legacy.host) },
  effective_target_kind: effective.kind,
  failures,
};

console.log(JSON.stringify(report, null, 2));

if (!report.ok) {
  console.error("\nFAIL: DB target is not a clean Azure-only target. See failures above.");
  process.exit(1);
}
console.log("\nPASS: effective DB target is AZURE; no Supabase fallback.");
