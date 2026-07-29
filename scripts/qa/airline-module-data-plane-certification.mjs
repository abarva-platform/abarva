#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(
  ROOT,
  "proof",
  "airline-all-module-data-plane-certification-2026-07-29",
);
const REPORT = path.join(
  ROOT,
  "reports",
  "airline-all-module-data-plane-certification-2026-07-29.md",
);

const foundationIdentity = {
  tenantKey: "airline-demo-new",
  baselineId: "airline-demo-new-source-corpus-v1.0.0:knowledge-baseline-v1",
  baselineContentHash:
    "135d860b9b104b2a2891fd108ea57286dc28bc057327498c63934c6552425549",
  projectionVersion: "phase3c2d-consumption-contracts-v1.0.0",
  enterpriseBriefProjection: "consumption.enterprise_brief_v1",
  proofEndpoint: "/api/knowledge/consumption/enterprise-brief",
};

function read(rel) {
  try {
    return fs.readFileSync(path.join(ROOT, rel), "utf8");
  } catch {
    return null;
  }
}

function has(rel, needle) {
  return read(rel)?.includes(needle) ?? false;
}

function evidence(rel, marker, note) {
  const ok = has(rel, marker);
  return { file: rel, marker, note, found: ok };
}

const dataFlow = [
  ["Frozen source release", "Complete", "Approved Airline corpus is frozen; no further source mutation in this lane."],
  ["Governed review decisions", "Complete", "112,201 accepted and 152,029 deferred; no replay permitted."],
  ["Immutable domain publication", "Complete", "Accepted candidates were published into immutable Knowledge domains."],
  ["Active Knowledge Baseline", "Complete", foundationIdentity.baselineId],
  ["Consumption projections", "Complete", "Enterprise brief projection is live-proven available; projection contract is pinned."],
  ["Knowledge API activation", "Complete", "Signed-in /enterprise-brief canary returned 200 against the governed baseline."],
  ["aVa baseline binding", "This PR", "Foundation tenant aVa packets are now server-bound to the active consumption envelope."],
  ["All-module migration", "Open", "Several modules still require runtime DB/provider certification and legacy-fallback removal."],
  ["Cube/Superset/Observable runtime", "Open", "Contracts/presentation exist; governed runtime and identity proof remain."],
];

const modules = [
  {
    module: "Home / Knowledge",
    classification: "migrated_and_proven",
    percentComplete: 90,
    routes: [
      "/api/knowledge/consumption/enterprise-brief",
      "/knowledge-preview?provider=http&tenant=airline-demo-new",
    ],
    readProvider: "Tenant-scoped governed HTTP/API -> Azure PostgreSQL consumption reader",
    writeProvider: "None in product surface; foundation writes are governed jobs only",
    database: "Tenant-scoped Azure PostgreSQL; shared DATABASE_URL fallback refused for foundation tenants",
    baselineBinding: "Required and live-proven",
    fixtureDependency: "Admin fixture preview only; real foundation tenant HTTP path prohibits fixture namespace use",
    legacyDependency: "No SkyHarbor fallback on the live-proven canary path",
    evidence: [
      evidence(
        "src/lib/knowledge/consumption-server/db.ts",
        "refusing shared DATABASE_URL fallback",
        "Tenant-scoped consumption DB resolver fails closed instead of reading shared/old database.",
      ),
      evidence(
        "src/app/api/knowledge/consumption/_shared.ts",
        'const ADMIN_HTTP_CANARY_TENANTS = new Set(["airline-demo-new"])',
        "Consumption endpoint resolves tenant server-side and restricts admin canary tenant override.",
      ),
      evidence(
        "src/app/(maestro)/knowledge-preview/page.tsx",
        'const ADMIN_HTTP_CANARY_TENANT = "airline-demo-new"',
        "Signed-in preview route only permits the Airline HTTP canary tenant.",
      ),
    ],
    nextAction: "Keep provider active; add same signed-in proof to normal tenant-user path after Clerk mapping.",
  },
  {
    module: "aVa / Knowledge",
    classification: "partially_migrated_this_pr",
    percentComplete: 60,
    routes: ["/api/knowledge/ava"],
    readProvider: "Now binds foundation tenants to tenant-scoped consumption reader before reasoning",
    writeProvider: "None; aVa output remains ephemeral and non-promoting",
    database: "Tenant-scoped Azure PostgreSQL consumption envelope for foundation tenants",
    baselineBinding: "Enforced in this PR for foundation preview tenants",
    fixtureDependency: "Deterministic provider remains model-unavailable fallback, not fixture data authority",
    legacyDependency: "No baseline identity accepted from browser for foundation tenants after this PR",
    evidence: [
      evidence(
        "src/app/api/knowledge/ava/route.ts",
        "bindAvaPacketToActiveConsumptionEnvelope",
        "Route overwrites browser-supplied baseline identity with active server envelope.",
      ),
      evidence(
        "src/lib/knowledge/consumption-server/ava-packet-binding.ts",
        "ava_baseline_unavailable",
        "aVa fails closed when the active foundation baseline/projection is unavailable.",
      ),
    ],
    nextAction: "Deploy and run signed-in aVa proof for Airline once this PR lands.",
  },
  {
    module: "Intelligence",
    classification: "partially_migrated_needs_runtime_certification",
    percentComplete: 35,
    routes: ["/api/intelligence/ask", "/api/intelligence/query"],
    readProvider: "Mixed legacy advisory/context paths plus newer Knowledge hooks",
    writeProvider: "Audit/log paths vary by route",
    database: "Not yet proven baseline-bound for Airline",
    baselineBinding: "Not certified",
    fixtureDependency: "Static scan shows legacy tenant-specific/context code remains",
    legacyDependency: "Requires proof that Airline cannot retrieve legacy V6/V7/SkyHarbor context",
    evidence: [
      evidence(
        "src/app/api/intelligence/ask/route.ts",
        "buildHomeKnowAgentAnswer",
        "Route has a Knowledge-answer path, but full baseline-bound Airline packet proof is still required.",
      ),
      evidence(
        "src/app/api/intelligence/ask/route.ts",
        "SkyHarbor",
        "Static tenant-specific logic remains and must be runtime-fenced from Airline Demo New.",
      ),
    ],
    nextAction: "Add signed-in Airline Intelligence proof with legacy fixtures and Supabase unavailable.",
  },
  {
    module: "Moves",
    classification: "partially_migrated_legacy_operational_risk",
    percentComplete: 25,
    routes: ["/api/v1/moves/*", "/api/programs/phase-gate"],
    readProvider: "Operational adapters are mixed; generic reference fallbacks still exist",
    writeProvider: "programsWriteAdapter defaults depend on ABARVA_DATA_PLANE",
    database: "New Azure PostgreSQL not yet proven for all Airline operational state",
    baselineBinding: "Required only when consuming enterprise context; not certified",
    fixtureDependency: "Reference-mode fallbacks exist when moveId is absent/inaccessible",
    legacyDependency: "Supabase-default adapter behavior still exists unless runtime config prevents it",
    evidence: [
      evidence(
        "src/lib/data-plane/write-adapters/programsWriteAdapter.ts",
        "Defaults to Supabase",
        "Programs/Moves write seam still has legacy default behavior.",
      ),
      evidence(
        "src/app/api/v1/moves/board-grade-master-dossier/route.ts",
        "REFERENCE MODE",
        "Board-grade routes retain reference/fallback behavior that must be disabled or certified for Airline.",
      ),
    ],
    nextAction: "Certify runtime env uses azure-postgres and disable reference fallbacks for governed Airline routes.",
  },
  {
    module: "Source",
    classification: "partially_migrated_legacy_operational_risk",
    percentComplete: 30,
    routes: ["/api/v1/source/*", "/source"],
    readProvider: "Several routes use Azure fluent clients; fixture-specific views remain",
    writeProvider: "sourceWriteAdapter defaults depend on ABARVA_DATA_PLANE",
    database: "New Azure PostgreSQL not yet proven for every Source operational table",
    baselineBinding: "Required for Knowledge handoff; not certified end-to-end",
    fixtureDependency: "Source fixture views and event-instance fixtures remain in code",
    legacyDependency: "Static scan shows SkyHarbor default in at least one Source route",
    evidence: [
      evidence(
        "src/lib/data-plane/write-adapters/sourceWriteAdapter.ts",
        "Supabase stays the default",
        "Source write seam still has legacy default behavior.",
      ),
      evidence(
        "src/app/api/v1/source/[eventId]/contract-optimization/brief/route.ts",
        "skyharbor-air",
        "A Source route still has an explicit SkyHarbor fallback and must not serve governed Airline.",
      ),
    ],
    nextAction: "Migrate/certify Source operational state and block old fixture/default routes for Airline.",
  },
  {
    module: "Tower",
    classification: "partially_migrated_legacy_operational_risk",
    percentComplete: 30,
    routes: ["/api/tower/*", "/tower"],
    readProvider: "Mixed Azure read models, V7 projections, and aggregate adapter",
    writeProvider: "Tower value-state and ingest paths use direct DATABASE_URL/Azure clients",
    database: "New Azure PostgreSQL not yet proven for all Tower operational state",
    baselineBinding: "Required for governed enterprise context; metrics remain Tower-owned operational projections",
    fixtureDependency: "Static seeded vendor/portfolio and deterministic views remain",
    legacyDependency: "Aggregate adapter still documents Supabase default unless env forces Azure",
    evidence: [
      evidence(
        "src/lib/tower/aggregate.ts",
        "selectTowerAggregateReadAdapter",
        "Tower aggregate path still documents legacy default behavior.",
      ),
      evidence(
        "src/lib/tower/v7-tower-projection.ts",
        "V7",
        "Legacy V7 projection path remains and needs migration/sunset proof for Airline.",
      ),
    ],
    nextAction: "Certify Tower DB host/schema/table use and remove legacy defaults before Airline completion.",
  },
  {
    module: "Admin / Platform",
    classification: "partially_migrated_needs_sunset_controls",
    percentComplete: 25,
    routes: ["/admin/*", "/platform/*"],
    readProvider: "Mixed admin and platform surfaces",
    writeProvider: "Mixed operational/admin writers",
    database: "Not yet certified against Airline private data plane",
    baselineBinding: "Only applicable where enterprise context is consumed",
    fixtureDependency: "Admin preview fixtures remain intentionally available to platform admins",
    legacyDependency: "Needs controls preventing legacy tenant access and fixture tenant creation",
    evidence: [
      evidence(
        "src/lib/knowledge/consumption-client/factory.ts",
        "assertFixtureNamespace",
        "Fixture namespace guard exists for Knowledge preview, but platform-wide controls remain open.",
      ),
    ],
    nextAction: "Add CI/runtime controls for governed tenant legacy/fallback access.",
  },
  {
    module: "Cube",
    classification: "contract_ready_runtime_proof_pending",
    percentComplete: 65,
    routes: ["Cube semantic model"],
    readProvider: "Governed consumption projections only by contract",
    writeProvider: "None",
    database: "Consumption projections; parity proof previously passed but must be retained in closure bundle",
    baselineBinding: "Metric definitions and projection version required",
    fixtureDependency: "No fixture use allowed in governed model",
    legacyDependency: "Validator prohibits raw source/working/publication/operations tables",
    evidence: [
      evidence(
        "scripts/knowledge/validate-phase3c2e-executable-data-layer.mjs",
        "source_boundary: consumption_only",
        "Executable data-layer validator enforces Cube consumption-only source boundary.",
      ),
      evidence(
        "clients/shared/21-phase3c2e-executable-data-layer/cube/knowledge_consumption_model.yml",
        "source_boundary: consumption_only",
        "Cube model declares the governed consumption-only boundary.",
      ),
    ],
    nextAction: "Rerun Cube-to-PostgreSQL parity in the deployed Airline closure bundle.",
  },
  {
    module: "Superset",
    classification: "presentation_ready_runtime_provisioning_pending",
    percentComplete: 20,
    routes: ["Analyze in Superset"],
    readProvider: "Should use read-only governed identity against consumption/Cube contract",
    writeProvider: "None",
    database: "Not provisioned/proven in this certification",
    baselineBinding: "Required in dataset/dashboard metadata",
    fixtureDependency: "Not certified",
    legacyDependency: "Not certified",
    evidence: [
      evidence(
        "clients/shared/20-phase3c2d-consumption-contracts/MODULE_CONSUMPTION_MAPPING.xlsx.inspect.ndjson",
        "Superset",
        "Presentation contract names the standard dashboard path, but runtime proof remains open.",
      ),
    ],
    nextAction: "Provision read-only governed identity and certify dashboard dataset identity.",
  },
  {
    module: "Observable",
    classification: "presentation_ready_runtime_payload_pending",
    percentComplete: 20,
    routes: ["Observable narrative presentation"],
    readProvider: "Should consume the same governed metric payload as Cube/Superset",
    writeProvider: "None",
    database: "Not directly applicable; payload binding not proven",
    baselineBinding: "Required in payload identity",
    fixtureDependency: "Not certified",
    legacyDependency: "Not certified",
    evidence: [
      evidence(
        "clients/shared/20-phase3c2d-consumption-contracts/MODULE_CONSUMPTION_MAPPING.xlsx.inspect.ndjson",
        "Observable",
        "Contract names the Observable story payload; runtime proof remains open.",
      ),
    ],
    nextAction: "Verify Observable payload carries the same baseline/projection/metric identity.",
  },
];

const missing = modules.flatMap((m) =>
  m.evidence.filter((e) => !e.found).map((e) => `${m.module}: ${e.file} missing ${e.marker}`),
);

function mdTable(rows, headers) {
  return [
    `| ${headers.join(" |")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((v) => String(v).replace(/\n/g, " ")).join(" | ")} |`),
  ].join("\n");
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeOutputs() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });

  const summary = {
    generatedAt: new Date().toISOString(),
    foundationIdentity,
    dataFlow: dataFlow.map(([stage, status, evidenceText]) => ({ stage, status, evidence: evidenceText })),
    modules,
    missingEvidenceChecks: missing,
    completion: {
      foundationPipeline: 100,
      knowledgeActivation: 100,
      allModuleCertification: Math.round(
        modules.reduce((sum, m) => sum + m.percentComplete, 0) / modules.length,
      ),
    },
  };

  fs.writeFileSync(
    path.join(OUT_DIR, "certification-summary.json"),
    JSON.stringify(summary, null, 2),
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "module-matrix.csv"),
    [
      [
        "module",
        "classification",
        "percent_complete",
        "routes",
        "read_provider",
        "write_provider",
        "database",
        "baseline_binding",
        "fixture_dependency",
        "legacy_dependency",
        "next_action",
      ].join(","),
      ...modules.map((m) =>
        [
          m.module,
          m.classification,
          m.percentComplete,
          m.routes.join("; "),
          m.readProvider,
          m.writeProvider,
          m.database,
          m.baselineBinding,
          m.fixtureDependency,
          m.legacyDependency,
          m.nextAction,
        ].map(csvEscape).join(","),
      ),
    ].join("\n"),
  );

  const report = [
    "# Airline All-Module Data-Plane Certification — 2026-07-29",
    "",
    "## Executive Status",
    "",
    "Airline Knowledge activation is complete and immutable. This report is the next gate: it certifies which product modules are actually bound to the governed Airline data plane and which still require migration or runtime proof.",
    "",
    `- Tenant: \`${foundationIdentity.tenantKey}\``,
    `- Active baseline: \`${foundationIdentity.baselineId}\``,
    `- Baseline hash: \`${foundationIdentity.baselineContentHash}\``,
    `- Enterprise brief projection: \`${foundationIdentity.enterpriseBriefProjection}\``,
    `- Projection contract: \`${foundationIdentity.projectionVersion}\``,
    "",
    "## Data Flow Status",
    "",
    mdTable(dataFlow, ["Stage", "Status", "Evidence / note"]),
    "",
    "## Module Certification Matrix",
    "",
    mdTable(
      modules.map((m) => [
        m.module,
        `${m.percentComplete}%`,
        m.classification,
        m.baselineBinding,
        m.fixtureDependency,
        m.legacyDependency,
        m.nextAction,
      ]),
      ["Module", "%", "Classification", "Baseline binding", "Fixture dependency", "Legacy dependency", "Next action"],
    ),
    "",
    "## Evidence Checks",
    "",
    ...modules.flatMap((m) => [
      `### ${m.module}`,
      "",
      ...m.evidence.map((e) =>
        `- ${e.found ? "PASS" : "MISSING"} — \`${e.file}\` contains \`${e.marker}\`: ${e.note}`,
      ),
      "",
    ]),
    "## Decision",
    "",
    missing.length === 0
      ? "Static evidence checks passed. Airline is not fully migrated yet: Home/Knowledge is proven, aVa binding is fixed in this PR, and the remaining modules need runtime provider/DB proof or migration/sunset work."
      : `Static evidence checks failed: ${missing.length} required markers were missing.`,
    "",
  ].join("\n");
  fs.writeFileSync(REPORT, report);
}

writeOutputs();

if (missing.length > 0) {
  console.error(missing.join("\n"));
  process.exit(1);
}

console.log(`Wrote ${REPORT}`);
console.log(`Wrote ${OUT_DIR}`);
