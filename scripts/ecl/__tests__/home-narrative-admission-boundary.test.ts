import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CANONICAL_TENANT_KEYS } from "../../../src/config/tenants/CANONICAL_TENANTS";
import { POLICY_VERSION } from "../../../src/lib/governance/context-corpus-policy";
import {
  buildGovernedSignalPacket,
  governedCandidateForSignal,
  narrativeEvidenceRefusal,
  type HomeProjectionWriteRow,
} from "../build_home_ecl_narrative_layer";
import {
  PROJECTION_READINESS_TABLE,
  SIGNAL_READINESS_TABLE,
  readinessKey,
  signalSourceHash,
  type NarrativeReadinessProof,
} from "../home-narrative-readiness";

type Row = HomeProjectionWriteRow;
type Proofs = Map<string, NarrativeReadinessProof>;

// The governed bundle admits only canonical tenant keys, so the fixture takes its tenant from code.
const TENANT: string = CANONICAL_TENANT_KEYS[0];
assert.ok(TENANT, "no canonical tenant key to build the fixture with");
const ASSESSMENT = "assessment-1";
const WITHHELD_NOTICE_ID = "ctx_ecl_context_policy_summary_001";

// Computed here rather than taken from the builder: a proof records the hash of one exact row or signal.
const sha256Json = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const contextIdOf = (row: Row) =>
  `ctx_ecl_${row.page_key}_${row.row_type}_${row.row_key}`.replace(/[^a-zA-Z0-9_]/g, "_");

// Every row is eligible on its own fields, so a readiness proof is the only thing that can withhold it.
function projectionRow(
  pageKey: string,
  rowType: string,
  rowKey: string,
  display: Record<string, unknown>,
  overrides: Partial<Row> = {},
): Row {
  return {
    id: `row-${rowKey}`,
    tenant_key: TENANT,
    assessment_id: ASSESSMENT,
    snapshot_id: "snapshot-1",
    projection_manifest_id: "manifest-1",
    projection_entry_id: `entry-${rowKey}`,
    projection_version: 1,
    page_key: pageKey,
    row_key: rowKey,
    section_key: "records",
    row_type: rowType,
    title: `Record ${rowKey}`,
    summary: null,
    primary_object_id: null,
    metric_keys_json: [],
    relationship_ids_json: [],
    source_refs_json: [{ source_record_id: `source-record-${rowKey}` }],
    basis_summary: "source-backed projection row",
    value_state: "known",
    quality_state: "passed",
    admission_status: "admitted",
    admission_gate_key: null,
    admission_result_json: {},
    gap_flags_json: [],
    display_payload_json: display,
    source_hash: `source-hash-${rowKey}-v1`,
    ...overrides,
  };
}

const READY: Omit<NarrativeReadinessProof, "object_table" | "object_id" | "source_hash" | "content_hash"> = {
  client_key: TENANT,
  tenant_id: TENANT,
  source_layer: "signal",
  source_basis: "accepted source record",
  classification: "internal",
  retrievability: "fts_indexed",
  agent_readiness_status: "agent_ready",
  confidence_level: "high",
  cited_render_verified_at: "2026-01-01T00:00:00Z",
  policy_validation_status: "pass",
  policy_version: POLICY_VERSION,
  policy_validated_at: "2026-01-01T00:00:00Z",
};

function rowProof(row: Row, overrides: Partial<NarrativeReadinessProof> = {}): NarrativeReadinessProof {
  return {
    ...READY,
    object_table: PROJECTION_READINESS_TABLE,
    object_id: row.projection_entry_id,
    source_hash: row.source_hash,
    content_hash: sha256Json(row),
    ...overrides,
  };
}

function proofMap(proofs: NarrativeReadinessProof[]): Proofs {
  return new Map(proofs.map((proof) => [readinessKey(proof.object_table, proof.object_id), proof]));
}

function build(rows: Row[], proofs: NarrativeReadinessProof[]) {
  return buildGovernedSignalPacket(rows, TENANT, ASSESSMENT, [], [], proofMap(proofs));
}

// Signal proofs are recorded against a build of the admitted rows alone, so a packet that lets
// any other row shape a signal no longer matches them.
function signalProofs(admittedRows: Row[]): NarrativeReadinessProof[] {
  const sourceHashes = new Map(admittedRows.map((row) => [contextIdOf(row), row.source_hash]));
  return build(admittedRows, admittedRows.map((row) => rowProof(row))).candidateSignals.map((signal) => ({
    ...READY,
    object_table: SIGNAL_READINESS_TABLE,
    object_id: signal.id,
    source_hash: signalSourceHash(signal.evidenceRefs.map((ref) => sourceHashes.get(ref) ?? `not-admitted:${ref}`)),
    content_hash: sha256Json(signal),
  }));
}

const application = projectionRow("applications_systems", "application", "APP-001", {
  application_id: "APP-001",
  application_name: "Admitted Ledger",
  business_function: "Admitted Finance",
  vendor_name: "Admitted Vendor",
  criticality_tier: "Tier 1",
  annual_cost_usd: 1_000_000,
});
const contract = projectionRow("vendor_contracts", "contract", "CTR-001", {
  contract_id: "CTR-001",
  contract_name: "Admitted Hosting Agreement",
  supplier_name: "Admitted Supplier",
  service_category: "Hosting",
  annualized_value_usd: 2_000_000,
});
const platform = projectionRow("infrastructure_platforms", "infrastructure", "PLAT-001", {
  platform_id: "PLAT-001",
  platform_name: "Admitted Platform",
  platform_type: "Database",
  hosting_model: "Admitted Cloud",
  criticality_tier: "Tier 1",
});
// Names a withheld application as its source and an admitted one as its target.
const dataFlow = projectionRow("current_state_data_flow", "data_flow", "FLOW-001", {
  data_flow_id: "FLOW-001",
  data_asset_name: "Admitted Feed",
  source_system: "APP-901",
  target_system: "APP-001",
  integration_type: "Admitted Batch",
});
const workload = projectionRow("data_assets_integrations", "data_analytics_workload", "WKL-001", {
  workload_name: "Admitted Reporting",
  function: "Admitted Finance",
  technology_name: "Admitted BI",
  workload_count: 12,
});
const ADMITTED = [application, contract, platform, dataFlow, workload];
const ADMITTED_PROOFS = ADMITTED.map((row) => rowProof(row));

const planted = (name: string, field: string) => `withheld-${name}-${field}`;
const plantedText = (name: string) => ({ title: planted(name, "title"), summary: planted(name, "summary") });
function withheldApplication(rowKey: string, name: string): Row {
  return projectionRow(
    "applications_systems",
    "application",
    rowKey,
    {
      application_id: rowKey,
      application_name: planted(name, "name"),
      business_function: planted(name, "function"),
      vendor_name: planted(name, "vendor"),
      criticality_tier: "Tier 1",
      annual_cost_usd: 70_000_000,
    },
    plantedText(name),
  );
}

const noProof = withheldApplication("APP-901", "no-proof");
const otherTenant = withheldApplication("APP-902", "other-tenant");
const staleSource = withheldApplication("APP-903", "stale-source");
const staleContent = withheldApplication("APP-904", "stale-content");
const WITHHELD = [
  noProof,
  otherTenant,
  staleSource,
  staleContent,
  projectionRow(
    "vendor_contracts",
    "contract",
    "CTR-901",
    {
      contract_id: "CTR-901",
      contract_name: planted("contract", "name"),
      supplier_name: planted("contract", "supplier"),
      service_category: planted("contract", "service"),
      annualized_value_usd: 90_000_000,
    },
    plantedText("contract"),
  ),
  projectionRow(
    "infrastructure_platforms",
    "infrastructure",
    "PLAT-901",
    {
      platform_id: "PLAT-901",
      platform_name: planted("platform", "name"),
      platform_type: planted("platform", "type"),
      hosting_model: planted("platform", "hosting"),
      criticality_tier: "Tier 1",
    },
    plantedText("platform"),
  ),
  projectionRow(
    "data_assets_integrations",
    "data_flow",
    "FLOW-901",
    {
      data_flow_id: "FLOW-901",
      data_asset_name: planted("flow", "name"),
      source_system: planted("flow", "source"),
      target_system: planted("flow", "target"),
      integration_type: planted("flow", "type"),
      consumption_layer: planted("flow", "layer"),
    },
    plantedText("flow"),
  ),
  projectionRow(
    "data_assets_integrations",
    "data_analytics_workload",
    "WKL-901",
    {
      workload_name: planted("workload", "name"),
      function: planted("workload", "function"),
      technology_name: planted("workload", "technology"),
      workload_count: 900,
    },
    plantedText("workload"),
  ),
  projectionRow("leadership_perspective", "interview_theme", "THEME-901", {}, plantedText("theme")),
];
const WITHHELD_PROOFS = [
  rowProof(otherTenant, { client_key: "tenant-b", tenant_id: "tenant-b" }),
  // Matches the row as it is now; only the recorded source version is behind.
  rowProof(staleSource, { source_hash: "source-hash-before-resourcing" }),
  // Recorded before the row's title changed.
  rowProof({ ...staleContent, title: "title when the proof was recorded" }),
];

// Everything a row could put in front of the model: each planted string, its raw key, its context id.
function markersOf(row: Row): string[] {
  const plantedStrings = JSON.stringify(row).match(/withheld-[a-z0-9_-]+/g) ?? [];
  return [...new Set([...plantedStrings, row.row_key, contextIdOf(row)])];
}

function assertNoneReached(packet: unknown, rows: Row[]) {
  const json = JSON.stringify(packet);
  for (const marker of rows.flatMap(markersOf)) {
    assert.equal(json.includes(marker), false, `${marker} reached the packet`);
  }
}

test("control: each withheld row reaches the packet once it carries a current proof", () => {
  const json = JSON.stringify(build([...ADMITTED, ...WITHHELD], [...ADMITTED, ...WITHHELD].map((row) => rowProof(row))).signalPacket);
  for (const row of WITHHELD) {
    assert.equal(json.includes(contextIdOf(row)), true, `${row.row_key} is not admitted even with a proof`);
    assert.equal(
      markersOf(row).some((marker) => marker.startsWith("withheld-") && json.includes(marker)),
      true,
      `${row.row_key} carries no planted string the scan can see`,
    );
  }
});

test("a row without a current proof for this tenant, source and content never reaches the packet", () => {
  const proofs = [...ADMITTED_PROOFS, ...WITHHELD_PROOFS, ...signalProofs(ADMITTED)];
  const mixed = build([...ADMITTED, ...WITHHELD], proofs);
  const admittedOnly = build(ADMITTED, proofs);
  const packet = mixed.signalPacket;

  // The proof is what withheld them, not their own fields.
  assert.equal(mixed.contextPolicyProof.row_readiness_counts.ready, ADMITTED.length);
  assert.equal(mixed.contextPolicyProof.row_readiness_counts.blocked_missing_governance_proof, WITHHELD.length);

  assertNoneReached(packet, WITHHELD);
  assertNoneReached([...mixed.visibleIdentifierLabels], WITHHELD);
  assert.equal(mixed.visibleIdentifierLabels.get("APP-001"), "Admitted Ledger");

  const statements = new Map(packet.contextItems.map((item) => [item.id, item.statement]));
  assert.match(statements.get(contextIdOf(application)) ?? "", /^Admitted Ledger is recorded as an application for Admitted Finance/);
  assert.match(statements.get(contextIdOf(contract)) ?? "", /^Admitted Hosting Agreement is recorded as a contract with Admitted Supplier/);
  assert.match(statements.get(contextIdOf(platform)) ?? "", /^Admitted Platform is recorded as an infrastructure or platform record/);
  assert.match(statements.get(contextIdOf(workload)) ?? "", /^Admitted Reporting is recorded as a data, reporting, ETL, script, or analytics workload segment/);
  // The admitted identifier resolves to its label; the withheld one to nothing that names it.
  assert.match(statements.get(contextIdOf(dataFlow)) ?? "", /^Admitted Feed is recorded as a data movement from .+ to Admitted Ledger using Admitted Batch\.$/);

  // Five application rows, one admitted: every count the model can read says one.
  assert.deepEqual(
    Object.fromEntries(packet.coverageManifest.dimensionCoverage.map((item) => [item.key, item.recordCount])),
    {
      home_agent_ready_applications_systems: 1,
      home_agent_ready_vendor_contracts: 1,
      home_agent_ready_infrastructure_platforms: 1,
      home_agent_ready_data_flows: 1,
      home_agent_ready_data_workload_segments: 1,
    },
  );
  assert.equal(packet.coverageManifest.vendorDocumentEvidence.totalContracts, 1);
  // The builder adds category summaries beyond the packet's declared type.
  const { categorySummaries } = packet as unknown as { categorySummaries: Array<{ recordCount: number }> };
  assert.deepEqual(categorySummaries.map((summary) => summary.recordCount), [1, 1, 1, 1, 1]);
  assert.equal(packet.businessEconomics.recordedApplicationAnnualCost, 1_000_000);
  assert.equal(packet.businessEconomics.technologyBudget, null);
  assert.equal(packet.businessEconomics.technologyBudgetShareOfRevenue, null);
  assert.deepEqual(packet.visualDatasets.application_landscape_by_function, [{ label: "Admitted Finance", sharePct: 100 }]);
  assert.deepEqual(packet.visualDatasets.vendor_spend_concentration, [{ label: "Admitted Supplier", sharePct: 100 }]);
  assert.equal(
    packet.signals.find((signal) => signal.id === "sig_ecl_estate_001")?.statement,
    "The executive-ready record contains 1 applications, 1 contracts, 1 infrastructure and platform records, and 1 data movements.",
  );
  assert.match(statements.get("ctx_ecl_scope_data_workload_001") ?? "", /includes 1 ready segment-level evidence rows/);
  assert.match(statements.get("ctx_ecl_scope_leadership_001") ?? "", /are not supplied by the current Home narrative input/);

  // The withheld rows change one thing only: a fixed notice that carries no count.
  const notice = packet.contextItems.at(-1);
  assert.equal(notice?.id, WITHHELD_NOTICE_ID);
  assert.doesNotMatch(notice?.statement ?? "", /\d/);
  assert.equal(admittedOnly.signalPacket.contextItems.some((item) => item.id === WITHHELD_NOTICE_ID), false);
  assert.equal(packet.signals.length > 0, true);
  assert.deepEqual(mixed.candidateSignals, admittedOnly.candidateSignals);
  assert.deepEqual({ ...packet, contextItems: packet.contextItems.slice(0, -1) }, admittedOnly.signalPacket);
});

test("a derived signal needs its own proof, bound to the source version of every row it cites", () => {
  const candidates = build(ADMITTED, ADMITTED_PROOFS).candidateSignals;
  const proofs = signalProofs(ADMITTED);
  const admittedIds = (rows: Row[], given: NarrativeReadinessProof[]) =>
    build(rows, given).signalPacket.signals.map((signal) => signal.id);
  const allIds = candidates.map((signal) => signal.id);
  const without = (id: string) => allIds.filter((candidate) => candidate !== id);

  assert.deepEqual(admittedIds(ADMITTED, ADMITTED_PROOFS), []);
  assert.deepEqual(admittedIds(ADMITTED, [...ADMITTED_PROOFS, ...proofs]), allIds);

  const [first, ...rest] = proofs;
  assert.deepEqual(
    admittedIds(ADMITTED, [...ADMITTED_PROOFS, { ...first, client_key: "tenant-b", tenant_id: "tenant-b" }, ...rest]),
    without(first.object_id),
  );
  assert.deepEqual(
    admittedIds(ADMITTED, [...ADMITTED_PROOFS, { ...first, content_hash: sha256Json("an earlier statement") }, ...rest]),
    without(first.object_id),
  );

  // One cited row is re-sourced and re-proven. No signal's wording changes, so only the source
  // binding can tell that the proofs recorded against the earlier version no longer apply.
  const resourced = { ...contract, source_hash: "source-hash-CTR-001-v2" };
  const resourcedRows = ADMITTED.map((row) => (row === contract ? resourced : row));
  const resourcedRowProofs = resourcedRows.map((row) => rowProof(row));
  const citesContract = (signal: { evidenceRefs: string[] }) => signal.evidenceRefs.includes(contextIdOf(contract));
  const stillBound = candidates.filter((signal) => !citesContract(signal)).map((signal) => signal.id);
  assert.equal(stillBound.length > 0 && stillBound.length < allIds.length, true);
  assert.deepEqual(build(resourcedRows, resourcedRowProofs).candidateSignals, candidates);
  assert.equal(
    build(resourcedRows, resourcedRowProofs).signalPacket.contextItems.some((item) => item.id === contextIdOf(contract)),
    true,
  );
  assert.deepEqual(admittedIds(resourcedRows, [...resourcedRowProofs, ...proofs]), stillBound);
  assert.deepEqual(admittedIds(resourcedRows, [...resourcedRowProofs, ...signalProofs(resourcedRows)]), allIds);
});

test("a signal citing a row outside the admitted set is withheld whatever its proof covers", () => {
  const admittedSourceHashes = new Map([["ctx_admitted", "source-hash-admitted"]]);
  const signal = (evidenceRefs: string[]) => ({
    id: "sig_probe",
    kind: "portfolio" as const,
    statement: "One admitted record and one other record.",
    domains: ["application_system"],
    evidenceRefs,
  });
  const readiness = (evidenceRefs: string[], provenSourceHashes: string[]) =>
    governedCandidateForSignal(
      signal(evidenceRefs),
      TENANT,
      {
        ...READY,
        object_table: SIGNAL_READINESS_TABLE,
        object_id: "sig_probe",
        source_hash: signalSourceHash(provenSourceHashes),
        content_hash: sha256Json(signal(evidenceRefs)),
      },
      admittedSourceHashes,
    ).agent_readiness_status;

  assert.equal(readiness(["ctx_admitted"], ["source-hash-admitted"]), "agent_ready");
  assert.equal(readiness(["ctx_admitted", "ctx_other"], ["source-hash-admitted", "source-hash-other"]), "not_reviewed");
  assert.equal(readiness(["ctx_admitted", "ctx_other"], ["source-hash-admitted"]), "not_reviewed");
  assert.equal(readiness([], []), "not_reviewed");
});

test("the job's own chapter summaries, claims and story plan are never fact candidates", () => {
  const proofs = [...ADMITTED_PROOFS, ...signalProofs(ADMITTED)];
  const baseline = build(ADMITTED, proofs);
  const authored = (rowType: string, rowKey: string, overrides: Partial<Row> = {}) =>
    projectionRow("executive_brief", rowType, rowKey, { note: planted(rowType, "payload") }, {
      ...plantedText(rowType),
      admission_status: "not_applicable",
      ...overrides,
    });

  // Eligible and proven: only their row type keeps them out.
  const proven = [
    authored("summary", "executive_brief_summary"),
    authored("chapter_claim", "executive_brief_writer_claim_001"),
    authored("story_plan", "executive_story_plan_v1"),
  ];
  const withProven = build([...ADMITTED, ...proven], [...proofs, ...proven.map((row) => rowProof(row))]);
  assertNoneReached(withProven.signalPacket, proven);
  assert.deepEqual(withProven.signalPacket, baseline.signalPacket);
  assert.equal(withProven.contextPolicyProof.candidate_count, baseline.contextPolicyProof.candidate_count);

  // As stored after a write, with no source references: not a withheld fact either.
  const stored = build([...ADMITTED, authored("story_plan", "executive_story_plan_v1", { source_refs_json: [] })], proofs);
  assert.deepEqual(stored.signalPacket, baseline.signalPacket);
  assert.deepEqual(stored.contextPolicyProof.row_readiness_counts, baseline.contextPolicyProof.row_readiness_counts);
});

test("rows whose keys normalise to one context id do not admit each other", () => {
  const proven = projectionRow("applications_systems", "application", "APP-777", {
    application_id: "APP-777",
    application_name: "Admitted Twin",
    business_function: "Admitted Finance",
    annual_cost_usd: 1_000_000,
  });
  const unproven = withheldApplication("APP_777", "same-context-id");
  assert.equal(contextIdOf(proven), contextIdOf(unproven));

  const proofs = [rowProof(proven), ...signalProofs([proven])];
  const alone = build([proven], proofs).signalPacket;
  assert.equal(alone.signals.length > 0, true);
  // Whichever row comes first, the unproven one adds the withheld notice and nothing else: not
  // its statement, not a count, and not its source version in place of the proven row's.
  for (const rows of [[proven, unproven], [unproven, proven]]) {
    const packet = build(rows, proofs).signalPacket;
    const json = JSON.stringify(packet);
    for (const marker of markersOf(unproven).filter((item) => item.startsWith("withheld-"))) {
      assert.equal(json.includes(marker), false, `${marker} reached the packet`);
    }
    assert.equal(packet.contextItems.at(-1)?.id, WITHHELD_NOTICE_ID);
    assert.deepEqual({ ...packet, contextItems: packet.contextItems.slice(0, -1) }, alone);
  }
});

test("source-record context is refused until it has its own readiness path", () => {
  const refused = /source-record context has no admitted readiness path yet/;
  const proofs = proofMap(ADMITTED_PROOFS);
  assert.throws(
    () =>
      buildGovernedSignalPacket(ADMITTED, TENANT, ASSESSMENT, [], [
        {
          file_name: "00_enterprise_profile.csv",
          source_type: "enterprise_profile",
          origin: "client_intake",
          source_owner: null,
          quality_state: "passed",
          record_type: "enterprise_profile",
          row_number: 1,
          payload_json: { industry: planted("source-row", "industry") },
        },
      ], proofs),
    refused,
  );
  assert.throws(
    () =>
      buildGovernedSignalPacket(ADMITTED, TENANT, ASSESSMENT, [
        {
          sourcePath: "00_enterprise_profile.csv",
          domain: "enterprise_profile",
          objectTypes: ["enterprise_profile"],
          recordCount: 0,
          basis: ["coverage_context_not_citable"],
          authority: ["client_intake"],
          qualityStates: ["passed"],
          materialFields: ["industry"],
          exampleRecords: [planted("source-summary", "example")],
        },
      ], [], proofs),
    refused,
  );
});

test("generation is refused until an admitted row and an admitted signal reach the packet", () => {
  const noProofs = build(ADMITTED, []);
  assert.equal(noProofs.contextPolicyProof.usable_count, 0);
  assert.match(narrativeEvidenceRefusal(noProofs) ?? "", /no governed usable evidence reached the executive packet/);
  assert.match(narrativeEvidenceRefusal(noProofs) ?? "", /blocked_missing_governance_proof/);

  const rowsOnly = build(ADMITTED, ADMITTED_PROOFS);
  assert.equal(rowsOnly.contextPolicyProof.usable_count, ADMITTED.length);
  assert.match(narrativeEvidenceRefusal(rowsOnly) ?? "", /no governed usable evidence reached the executive packet/);

  const admitted = build(ADMITTED, [...ADMITTED_PROOFS, ...signalProofs(ADMITTED)]);
  assert.equal(narrativeEvidenceRefusal(admitted), null);
  // Either condition refuses on its own.
  assert.notEqual(
    narrativeEvidenceRefusal({ ...admitted, contextPolicyProof: { ...admitted.contextPolicyProof, usable_count: 0 } }),
    null,
  );
  assert.notEqual(
    narrativeEvidenceRefusal({ ...admitted, signalPacket: { ...admitted.signalPacket, signals: [] } }),
    null,
  );
});

test("readiness diagnostics stay out of the packet", () => {
  const { signalPacket, contextPolicyProof } = build(
    [...ADMITTED, ...WITHHELD],
    [...ADMITTED_PROOFS, ...WITHHELD_PROOFS, ...signalProofs(ADMITTED)],
  );
  assert.equal(contextPolicyProof.blocked_count, WITHHELD.length);
  assert.deepEqual(Object.keys(signalPacket).sort(), [
    "analyticalLenses",
    "businessEconomics",
    "categorySummaries",
    "contextItems",
    "coverageManifest",
    "enterpriseIdentity",
    "pagePromptContracts",
    "signals",
    "sourceSummaries",
    "strategicPriorities",
    "visualDatasets",
  ]);
  const json = JSON.stringify(signalPacket);
  for (const key of Object.keys(contextPolicyProof)) {
    assert.equal(json.includes(`"${key}"`), false, `${key} reached the packet`);
  }
  for (const value of [
    contextPolicyProof.context_bundle_hash,
    "blocked_missing_governance_proof",
    ...Object.keys(contextPolicyProof.blocked_count_by_reason),
    ...contextPolicyProof.source_hashes,
  ]) {
    assert.equal(json.includes(value), false, `${value} reached the packet`);
  }
});

test("the builder runs when invoked directly, through a symlinked root too, and never on import", () => {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
  const script = "scripts/ecl/build_home_ecl_narrative_layer.ts";
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "home-narrative-entry-"));
  const linkedRoot = path.join(scratch, "linked-root");
  // Without a database URL, a run that reaches main() stops at its first precondition.
  const env = { ...process.env };
  delete env.DATABASE_URL;
  const run = (cwd: string, args: string[]) =>
    spawnSync(process.execPath, ["--import", "tsx", ...args], { cwd, env, encoding: "utf8" });
  const outDir = ["--out-dir", path.join(scratch, "out")];
  try {
    // An importer whose own path contains the script's name.
    const importer = path.join(scratch, "imports-build_home_ecl_narrative_layer.mjs");
    fs.writeFileSync(importer, 'await import(process.argv[2]);\nconsole.log("imported without running");\n');
    const imported = run(repoRoot, [importer, pathToFileURL(path.join(repoRoot, script)).href, ...outDir]);
    assert.equal(imported.status, 0, imported.stderr);
    assert.match(imported.stdout, /imported without running/);

    const direct = run(repoRoot, [script, ...outDir]);
    assert.equal(direct.status, 1, direct.stderr);
    assert.match(direct.stderr, /DATABASE_URL is required/);

    fs.symlinkSync(repoRoot, linkedRoot, "dir");
    const linked = run(linkedRoot, [path.join(linkedRoot, script), ...outDir]);
    assert.equal(linked.status, 1, linked.stderr);
    assert.match(linked.stderr, /DATABASE_URL is required/);
  } finally {
    if (fs.lstatSync(linkedRoot, { throwIfNoEntry: false })) fs.unlinkSync(linkedRoot);
    fs.rmSync(scratch, { recursive: true, force: true });
  }
});

test("the thesis and chapter builders the job imports run only when invoked directly", () => {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "home-narrative-data-build-entry-"));
  const linkedRoot = path.join(scratch, "linked-root");
  // With no model key, a run that reaches main() says so and stops. An unknown tenant keeps the
  // thesis builder from building anything on the way.
  const env = { ...process.env };
  for (const key of ["ANTHROPIC_API_KEY", "DATABASE_URL", "THESIS_WRITE", "THESIS_WRITE_APPROVED"]) delete env[key];
  const run = (cwd: string, args: string[]) =>
    spawnSync(process.execPath, ["--import", "tsx", ...args], { cwd, env, encoding: "utf8" });
  const scope = ["--tenant", "no-such-tenant", "--out-dir", path.join(scratch, "out")];
  try {
    fs.symlinkSync(repoRoot, linkedRoot, "dir");
    for (const script of ["scripts/data-build/build-home-chapters.ts", "scripts/data-build/build-enterprise-thesis.ts"]) {
      // An importer whose own path contains the script's name.
      const importer = path.join(scratch, `imports-${path.basename(script, ".ts")}.mjs`);
      fs.writeFileSync(importer, 'await import(process.argv[2]);\nconsole.log("imported without running");\n');
      const imported = run(repoRoot, [importer, pathToFileURL(path.join(repoRoot, script)).href, ...scope]);
      assert.equal(imported.status, 0, `${script}: ${imported.stderr}`);
      assert.equal(imported.stdout, "imported without running\n", script);

      const direct = run(repoRoot, [script, ...scope]);
      assert.equal(direct.status, 0, `${script}: ${direct.stderr}`);
      assert.match(direct.stdout, /ANTHROPIC_API_KEY absent/, script);

      const linked = run(linkedRoot, [path.join(linkedRoot, script), ...scope]);
      assert.equal(linked.status, 0, `${script}: ${linked.stderr}`);
      assert.match(linked.stdout, /ANTHROPIC_API_KEY absent/, script);
    }
  } finally {
    if (fs.lstatSync(linkedRoot, { throwIfNoEntry: false })) fs.unlinkSync(linkedRoot);
    fs.rmSync(scratch, { recursive: true, force: true });
  }
});

const businessRows = [
  projectionRow("business_unit_profile", "enterprise_profile", "ENTERPRISE-TEST", {
    business_model: "Integrated operating business", industry: "Recorded industry",
    annual_revenue_usd: "100,000,000", employee_count: 1234,
    customer_segments: ["Recorded customer A", "Recorded customer B"],
  }),
  projectionRow("business_unit_profile", "business_segment", "SEGMENT-TEST", {
    segment_name: "Recorded segment", revenue_share_pct: 60, pnl_owner_role: "Segment executive",
  }),
  projectionRow("strategy_value_creation", "priority", "PRIORITY-TEST", {
    priority_name: "Recorded quality priority", target_outcome: "Recorded target outcome",
  }),
  projectionRow("programs_initiatives", "program", "PROGRAM-TEST", {
    program_name: "Recorded transformation", pct_complete: 0, approved_budget_usd: 1_000_000,
    target_value_usd: 2_000_000, value_claim_status: "modelled_not_finance_validated",
    blocked_reason: "Recorded funding boundary",
  }),
  projectionRow("executive_interviews", "executive_interview", "INTERVIEW-TEST", {
    stakeholder_role: "Recorded executive role", theme: "Recorded leadership theme",
    synthetic_answer: "Recorded simulated response", response_basis: "modelled",
  }),
];

test("admitted canonical business fields populate the structured spine without raw-source access", () => {
  const built = build([...ADMITTED, ...businessRows], [...ADMITTED_PROOFS, ...businessRows.map((row) => rowProof(row))]);
  const packet = built.signalPacket;
  assert.deepEqual(packet.enterpriseIdentity, {
    businessModel: "Integrated operating business", industry: "Recorded industry", revenue: 100_000_000, employeeCount: 1234,
  });
  assert.deepEqual(packet.businessEconomics.operatingSegments, ["Recorded segment"]);
  assert.deepEqual(packet.businessEconomics.customerSegments, ["Recorded customer A", "Recorded customer B"]);
  assert.deepEqual(packet.strategicPriorities, ["Recorded quality priority"]);
  assert.equal(packet.businessEconomics.technologyBudget, null);
  assert.equal(packet.businessEconomics.technologyBudgetShareOfRevenue, null);
  assert.equal(packet.businessEconomics.recordedApplicationAnnualCost, 1_000_000);
  const byId = new Map(packet.contextItems.map((item) => [item.id, item]));
  assert.match(byId.get(contextIdOf(businessRows[0]))!.statement, /Recorded customer A, Recorded customer B/);
  const program = byId.get(contextIdOf(businessRows[3]))!;
  assert.match(program.statement, /Completion percent: 0/);
  assert.match(program.statement, /Recorded funding boundary/);
  assert.match(program.statement, /modelled_not_finance_validated/);
  assert.deepEqual(program.domains, ["program_initiative", "business_function"]);
  assert.deepEqual(program.evidenceRefs, ["source-record-PROGRAM-TEST"]);
  const leader = byId.get(contextIdOf(businessRows[4]))!;
  assert.match(leader.statement, /Synthetic or simulated response, not a transcribed client statement/);
  assert.match(leader.statement, /Recorded simulated response/);
  assert.deepEqual(leader.domains, ["leadership_voice", "ai_value_interview_evidence"]);
  assert.match(byId.get("ctx_ecl_scope_leadership_001")!.statement, /1 leadership observation records are supplied/);
  assert.ok(built.candidateSignals.some((signal) => signal.kind === "testimony" && signal.evidenceRefs.includes(leader.id)));
  assert.deepEqual(packet.signals, [], "new canonical signals still need their independent readiness proofs");
});

test("unadmitted canonical business fields cannot populate the spine or influence its signals", () => {
  const bare = build(ADMITTED, ADMITTED_PROOFS);
  const mixed = build([...ADMITTED, ...businessRows], ADMITTED_PROOFS);
  assert.deepEqual(mixed.signalPacket.enterpriseIdentity, bare.signalPacket.enterpriseIdentity);
  assert.deepEqual(mixed.signalPacket.businessEconomics, bare.signalPacket.businessEconomics);
  assert.deepEqual(mixed.signalPacket.strategicPriorities, []);
  assert.deepEqual(mixed.candidateSignals, bare.candidateSignals);
  for (const marker of ["Integrated operating business", "Recorded segment", "Recorded funding boundary", "Recorded simulated response"])
    assert.ok(!JSON.stringify(mixed.signalPacket).includes(marker), marker);
});

test("ambiguous profiles and missing numbers stay unknown; explicit zero is not treated as absence", () => {
  const first = businessRows[0];
  const second = projectionRow("business_unit_profile", "enterprise_profile", "ENTERPRISE-OTHER", {
    business_model: "Another scope", annual_revenue_usd: 50,
  });
  const ambiguous = build([first, second], [rowProof(first), rowProof(second)]).signalPacket;
  assert.deepEqual(ambiguous.enterpriseIdentity, { businessModel: null, industry: null, revenue: null, employeeCount: null });
  const zero = projectionRow("business_unit_profile", "enterprise_profile", "ENTERPRISE-ZERO", {
    annual_revenue_usd: 0, employee_count: 0,
  });
  const packet = build([zero], [rowProof(zero)]).signalPacket;
  assert.equal(packet.enterpriseIdentity.revenue, 0);
  assert.equal(packet.enterpriseIdentity.employeeCount, 0);
  assert.equal(packet.businessEconomics.recordedApplicationAnnualCost, null);
  assert.match(packet.contextItems.find((item) => item.id === contextIdOf(zero))!.statement, /Declared annual revenue: \$0/);
});

test("synthetic response columns override an inconsistent transcript label", () => {
  const row = projectionRow("executive_interviews", "executive_interview", "INTERVIEW-BASIS", {
    synthetic_answer: "Simulated response", response_basis: "transcribed",
  });
  const item = build([row], [rowProof(row)]).signalPacket.contextItems.find((item) => item.id === contextIdOf(row))!;
  assert.match(item.statement, /not a transcribed client statement/);
  assert.match(item.statement, /Simulated response/);
  assert.doesNotMatch(item.statement, /Declared response basis: transcribed/);
});

test("canonical mapping preserves readiness refusal on wrong tenant and stale source or content", () => {
  const row = businessRows[0];
  for (const change of [
    { client_key: "wrong-tenant", tenant_id: "wrong-tenant" },
    { source_hash: "obsolete-source" },
    { content_hash: "obsolete-content" },
    { retrievability: "not_indexed" },
    { cited_render_verified_at: null },
  ]) {
    const packet = build([row], [rowProof(row, change)]).signalPacket;
    assert.deepEqual(packet.enterpriseIdentity, { businessModel: null, industry: null, revenue: null, employeeCount: null });
    assert.ok(!JSON.stringify(packet).includes("Integrated operating business"));
  }
});

test("two admitted records with one normalized context ID fail closed", () => {
  const first = projectionRow("business_unit_profile", "enterprise_profile", "PROFILE/A", { business_model: "First record" });
  const second = projectionRow("business_unit_profile", "enterprise_profile", "PROFILE-A", { business_model: "Second record" });
  assert.equal(contextIdOf(first), contextIdOf(second));
  assert.throws(() => build([first, second], [rowProof(first), rowProof(second)]), /context IDs are ambiguous/);
});

test("bounded context retains nontechnical families and every admitted signal citation", () => {
  const technical = Array.from({ length: 950 }, (_, index) => projectionRow("data_assets_integrations", "data_analytics_workload", `BULK-${index}`, {
    workload_name: `Workload ${index}`, function: "Recorded function", technology_name: "Recorded technology", workload_count: 1,
  }));
  const rows = [...technical, ...businessRows];
  const proofs = [...rows.map((row) => rowProof(row)), ...signalProofs(rows)];
  const packet = build(rows, proofs).signalPacket;
  const rowIds = new Set(rows.map(contextIdOf));
  const context = packet.contextItems.filter((item) => rowIds.has(item.id));
  assert.equal(context.length, 900);
  for (const row of businessRows) assert.ok(context.some((item) => item.id === contextIdOf(row)), row.row_type);
  const available = new Set(packet.contextItems.map((item) => item.id));
  for (const signal of packet.signals) for (const ref of signal.evidenceRefs) assert.ok(available.has(ref), ref);
  const reordered = build([...rows].reverse(), rows.map((row) => rowProof(row))).signalPacket.contextItems.filter((item) => rowIds.has(item.id));
  const unproved = build(rows, rows.map((row) => rowProof(row))).signalPacket.contextItems.filter((item) => rowIds.has(item.id));
  assert.deepEqual(reordered, unproved);
});
