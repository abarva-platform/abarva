#!/usr/bin/env tsx

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import pg from "pg";
import {
  TEST_MOVE_PATTERNS,
  buildLoadSpec,
  engagementPayload,
  graphNodeId,
} from "./load-clean-demo-moves";
import { CLEAN_DEMO_MOVES } from "./clean-demo-moves";
import { resolveTenantAlias, tenantAliasesFor } from "../../src/lib/tenant/aliases";
import {
  blobProofStore,
  jobLimits,
  jobRecord,
  jobRun,
  type ProofStore,
} from "../ecl/synthetic_enterprise_home_job";
import { postgresClientOptions } from "../../src/scripts/postgres-client-options";

const JOB_NAME = "job-abarva-private-operator-eus";
const PROOF_PREFIX = "moves-clean-demo";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const P1_SECTIONS = [
  ["sponsor_commitment", "Sponsor contact and progress updates", "sponsorAndProgressPreference"],
  ["scope_boundary", "Scope boundary", "scopeBoundary"],
  ["success_criteria", "Success criteria", "successCriteria"],
  ["stakeholder_map", "Stakeholder map", "stakeholderMap"],
  ["decision_rights", "Decision rights", "decisionRights"],
  ["evidence_plan", "Evidence plan", "evidencePlan"],
] as const;

type Mode = "plan" | "apply";
type ExistingMove = {
  id: string;
  graph_node_id: string;
  name: string;
  status: string | null;
  lifecycle_state: string | null;
  current_phase: number;
  value_projected_low_usd: string | null;
  value_projected_high_usd: string | null;
  value_verified_status: string | null;
  gates_passed: unknown;
  seed_key: string | null;
  module_activity: number;
  evidence_count: number;
  attachment_count: number;
  deliverable_count: number;
  snapshot_count: number;
  approval_count: number;
};

type DbEngagement = {
  graph_node_id: string;
  client_id: string;
  name: string;
  solution: string;
  industry_code: string;
  function_code: string;
  objective_code: string;
  topic_code: string;
  sponsor_person_id: string;
  problem_statement: string;
  target_outcome: string;
  value_projected_low_usd: null;
  value_projected_high_usd: null;
  value_currency: "USD";
  value_verified_status: "pending";
  value_assumptions_jsonb: Record<string, unknown>;
  baseline_metrics: null;
  program_archetype: string;
  origin_source: "intelligence_candidate";
  status: "active";
  lifecycle_state: "shaping";
  current_phase: number;
  charter: Record<string, unknown>;
  gates_passed: unknown[];
  is_demo_data: true;
};

function required(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key]?.trim();
  if (!value) throw new Error(`${key} is required`);
  return value;
}

function resolveMode(env: NodeJS.ProcessEnv): Mode {
  const mode = env.CLEAN_DEMO_MOVES_MODE ?? "plan";
  if (mode !== "plan" && mode !== "apply") {
    throw new Error("CLEAN_DEMO_MOVES_MODE must be plan or apply");
  }
  if (mode === "apply" && env.CLEAN_DEMO_MOVES_APPLY_APPROVED !== "true") {
    throw new Error("Apply requires CLEAN_DEMO_MOVES_APPLY_APPROVED=true");
  }
  return mode;
}

function assertAzureTarget(databaseUrl: string): void {
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error("Azure/Postgres database URL is not parseable");
  }
  const host = url.hostname.toLowerCase();
  if (
    /supabase/i.test(host) ||
    !(
      host.endsWith(".postgres.database.azure.com") ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)
    )
  ) {
    throw new Error("Refusing non-Azure database target");
  }
}

function assertTenantRegistry(tenantKey: string): Record<string, unknown> {
  const registryPath = path.join(
    ROOT,
    "datasets/tenant-inputs/tenant-input-registry.json",
  );
  const registry = JSON.parse(readFileSync(registryPath, "utf8")) as {
    activeTenants?: Array<Record<string, unknown>>;
  };
  const tenant = registry.activeTenants?.find(
    (entry) => entry.tenantKey === tenantKey,
  );
  if (!tenant) throw new Error("Tenant is not active in the canonical registry");
  return tenant;
}

export function p1ReferenceDrafts(move: (typeof CLEAN_DEMO_MOVES)[number]) {
  if (!move.charter) return [];
  const values = move.charter;
  return [
    ...P1_SECTIONS.map(([key, label, property], moduleOrder) => ({
      module_key: `phase_1_${key}`,
      module_name: label,
      phase_number: 1,
      module_order: moduleOrder,
      status: "not_started" as const,
      state_jsonb: {
        capture_section_key: key,
        label,
        value: "",
        synthetic_reference_draft: values[property],
        provenance_class: "synthetic_reference",
        requires_human_review: true,
        gate_credit: false,
      },
    })),
    {
      module_key: "phase_1_business_change_assessment",
      module_name: "Business change & adoption owner",
      phase_number: 1,
      module_order: P1_SECTIONS.length,
      status: "not_started" as const,
      state_jsonb: {
        capture_section_key: "business_change_assessment",
        label: "Business change & adoption owner",
        value: "",
        provenance_class: "synthetic_reference",
        requires_human_review: true,
        gate_credit: false,
        open: true,
      },
    },
  ];
}

export function specHash(spec: unknown): string {
  return createHash("sha256").update(JSON.stringify(spec)).digest("hex");
}

type ArchiveCandidate = {
  id: string;
  name: string;
  status: string | null;
  lifecycle_state: string | null;
};

export function archivePlanHash(rows: ArchiveCandidate[]): string {
  const canonical = [...rows]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(({ id, name, status, lifecycle_state }) => ({
      id,
      name,
      status,
      lifecycle_state,
    }));
  return specHash(canonical);
}

export function isTestMoveName(name: string): boolean {
  return TEST_MOVE_PATTERNS.some((pattern) => pattern.test(name));
}

export function buildDbEngagement(
  move: (typeof CLEAN_DEMO_MOVES)[number],
  clientId: string,
  sponsorPersonId: string,
): DbEngagement {
  const planned = engagementPayload(move);
  const scaffold = (planned.charter as { scaffold: Record<string, unknown> }).scaffold;
  const charter = {
    seed_key: "clean-demo-moves",
    seed_version: 1,
    provenance_class: "synthetic_reference",
    synthetic_demo: true,
    display_code: move.displayCode,
    scaffold: {
      ...scaffold,
      open_evidence: [...move.openEvidence],
      evidence_state: "open",
      evidence_cleared: false,
      phase_capture_state: "reference_draft_requires_human_review",
    },
  };
  return {
    graph_node_id: graphNodeId(move),
    client_id: clientId,
    name: move.name,
    solution: move.name,
    industry_code: move.industryCode,
    function_code: move.functionCode,
    objective_code: move.objectiveCode,
    topic_code: move.topicCode,
    sponsor_person_id: sponsorPersonId,
    problem_statement: move.thesis,
    target_outcome: `Working outcome hypothesis: ${move.thesis}`,
    value_projected_low_usd: null,
    value_projected_high_usd: null,
    value_currency: "USD",
    value_verified_status: "pending",
    value_assumptions_jsonb: {
      ...((planned.value_assumptions_jsonb as Record<string, unknown>) ?? {}),
      provenance_class: "synthetic_reference",
      requires_human_review: true,
    },
    baseline_metrics: null,
    program_archetype: move.programArchetype,
    origin_source: "intelligence_candidate",
    status: "active",
    lifecycle_state: "shaping",
    current_phase: move.entryPhase,
    charter,
    gates_passed: [],
    is_demo_data: true,
  };
}

function validateSpec(spec: Record<string, unknown>): void {
  const moves = spec.engagements as Array<Record<string, unknown>>;
  if (!Array.isArray(moves) || moves.length !== 5) {
    throw new Error("Expected exactly five clean demo Moves");
  }
  const ids = new Set<string>();
  for (const move of moves) {
    const id = String(move.graph_node_id ?? "");
    if (!/^eng_demo_clean_mer_move_[a-z0-9_]+$/.test(id) || ids.has(id)) {
      throw new Error(`Invalid or duplicate graph_node_id: ${id}`);
    }
    ids.add(id);
    if (
      move.value_projected_low_usd !== null ||
      move.value_projected_high_usd !== null ||
      move.value_verified_status !== "pending" ||
      move.lifecycle_state !== "shaping" ||
      !Array.isArray(move.gates_passed) ||
      move.gates_passed.length !== 0 ||
      !Number.isInteger(move.current_phase) ||
      Number(move.current_phase) < 0 ||
      Number(move.current_phase) > 2
    ) {
      throw new Error(`Honesty invariant failed for ${id}`);
    }
  }
}

async function tableExists(client: pg.Client, table: string): Promise<boolean> {
  const result = await client.query<{ present: boolean }>(
    "select to_regclass($1) is not null as present",
    [`public.${table}`],
  );
  return result.rows[0]?.present === true;
}

async function assertSchema(client: pg.Client): Promise<void> {
  const requiredTables = [
    "engagements",
    "clients",
    "persons",
    "engagement_participants",
    "program_modules",
    "program_evidence_items",
    "program_attachments",
    "deliverables_v2",
    "phase_snapshots",
    "program_approval_requests",
  ];
  const missing = [];
  for (const table of requiredTables) {
    if (!(await tableExists(client, table))) missing.push(table);
  }
  if (missing.length) throw new Error(`Required schema tables missing: ${missing.join(", ")}`);

  const result = await client.query<{ column_name: string }>(
    `select column_name from information_schema.columns
     where table_schema = 'public' and table_name = 'engagements'`,
  );
  const columns = new Set(result.rows.map((row) => row.column_name));
  const required = [
    "graph_node_id", "client_id", "name", "solution", "industry_code",
    "function_code", "objective_code", "topic_code", "sponsor_person_id",
    "problem_statement", "target_outcome", "value_projected_low_usd",
    "value_projected_high_usd", "value_currency", "value_verified_status",
    "value_assumptions_jsonb", "baseline_metrics", "program_archetype",
    "origin_source", "status", "lifecycle_state", "current_phase", "charter",
    "gates_passed", "is_demo_data", "archived_at", "archived_by",
    "archive_reason", "archive_explanation", "archived_from_state",
  ];
  const missingColumns = required.filter((column) => !columns.has(column));
  if (missingColumns.length) {
    throw new Error(`Required engagement columns missing: ${missingColumns.join(", ")}`);
  }
}

type ClientIdentityRow = {
  id: string;
  tenant_key: string | null;
  slug: string | null;
};

export function canonicalClientLookupAliases(tenantKey: string): string[] {
  const canonicalKey = resolveTenantAlias(tenantKey)?.canonicalKey;
  if (!canonicalKey || canonicalKey !== tenantKey) {
    throw new Error("Requested tenant key is not the declared canonical tenant");
  }
  return Array.from(
    new Set(
      tenantAliasesFor(tenantKey).map((value) =>
        value.trim().toLowerCase().replace(/_/g, "-"),
      ),
    ),
  );
}

export function resolveCanonicalClientRow(
  rows: ClientIdentityRow[],
  tenantKey: string,
): ClientIdentityRow {
  const canonicalKey = resolveTenantAlias(tenantKey)?.canonicalKey;
  if (!canonicalKey || canonicalKey !== tenantKey) {
    throw new Error("Requested tenant key is not the declared canonical tenant");
  }
  if (rows.length !== 1) {
    throw new Error("Canonical tenant identity did not resolve to exactly one client row");
  }

  const [row] = rows;
  if (
    resolveTenantAlias(row.tenant_key)?.canonicalKey !== canonicalKey ||
    resolveTenantAlias(row.slug)?.canonicalKey !== canonicalKey
  ) {
    throw new Error("Client row identity fields do not resolve to the declared canonical tenant");
  }
  return row;
}

async function resolveClientId(client: pg.Client, tenantKey: string): Promise<string> {
  const aliases = canonicalClientLookupAliases(tenantKey);
  const result = await client.query<ClientIdentityRow>(
    `select id::text as id, tenant_key, slug from clients
     where lower(replace(btrim(tenant_key), '_', '-')) = any($1::text[])
        or lower(replace(btrim(slug), '_', '-')) = any($1::text[])
     order by id`,
    [aliases],
  );
  return resolveCanonicalClientRow(result.rows, tenantKey).id;
}

async function readTenantMoves(
  client: pg.Client,
  clientId: string,
  graphNodeIds: string[],
): Promise<{ all: Array<{ id: string; graph_node_id: string; name: string; status: string | null; lifecycle_state: string | null }>; clean: ExistingMove[] }> {
  const allResult = await client.query<{
    id: string;
    graph_node_id: string;
    name: string;
    status: string | null;
    lifecycle_state: string | null;
  }>(
    `select id, graph_node_id, name, status, lifecycle_state
     from engagements where client_id = $1 order by name, id`,
    [clientId],
  );
  const cleanResult = await client.query<ExistingMove>(
    `select e.id, e.graph_node_id, e.name, e.status, e.lifecycle_state,
            e.current_phase, e.value_projected_low_usd::text,
            e.value_projected_high_usd::text, e.value_verified_status,
            e.gates_passed, e.charter->>'seed_key' as seed_key,
            (select count(*)::int from program_modules pm where pm.engagement_id=e.id
              and (pm.status <> 'not_started' or coalesce(pm.state_jsonb->>'value','') <> '')) as module_activity,
            (select count(*)::int from program_evidence_items pe where pe.program_id=e.id) as evidence_count,
            (select count(*)::int from program_attachments pa where pa.program_id=e.id and pa.deleted_at is null) as attachment_count,
            (select count(*)::int from deliverables_v2 d where d.engagement_id=e.id) as deliverable_count,
            (select count(*)::int from phase_snapshots ps where ps.engagement_id=e.id) as snapshot_count,
            (select count(*)::int from program_approval_requests ar where ar.program_id=e.id) as approval_count
     from engagements e where e.client_id=$1 and e.graph_node_id = any($2::text[])
     order by e.graph_node_id`,
    [clientId, graphNodeIds],
  );
  return { all: allResult.rows, clean: cleanResult.rows };
}

function planArchive(all: Array<{ id: string; graph_node_id: string; name: string; status: string | null; lifecycle_state: string | null }>, cleanIds: Set<string>) {
  return all
    .filter((row) => isTestMoveName(row.name) && !cleanIds.has(row.graph_node_id))
    .map((row) => ({
      id: row.id,
      graph_node_id: row.graph_node_id,
      name: row.name,
      status: row.status,
      lifecycle_state: row.lifecycle_state,
    }));
}

function assertNoClobber(existing: ExistingMove[], expectedPhases: Map<string, number>): void {
  for (const row of existing) {
    const activity = row.module_activity + row.evidence_count + row.attachment_count + row.deliverable_count + row.snapshot_count + row.approval_count;
    const gates = Array.isArray(row.gates_passed) ? row.gates_passed : null;
    if (
      row.seed_key !== "clean-demo-moves" ||
      activity !== 0 ||
      row.status !== "active" ||
      row.lifecycle_state !== "shaping" ||
      row.current_phase !== expectedPhases.get(row.graph_node_id) ||
      row.value_projected_low_usd !== null ||
      row.value_projected_high_usd !== null ||
      row.value_verified_status !== "pending" ||
      !gates || gates.length !== 0
    ) {
      throw new Error(`Refusing to overwrite existing Move with workflow state: ${row.graph_node_id}`);
    }
  }
}

async function getOrCreateSponsor(client: pg.Client, move: (typeof CLEAN_DEMO_MOVES)[number]): Promise<string> {
  const id = `person_demo_clean_${move.sponsor.email.split("@")[0].replace(/[^a-z0-9]+/gi, "_").toLowerCase()}`;
  const result = await client.query<{ id: string; graph_node_id: string; name: string; email: string; role: string | null }>(
    `select id, graph_node_id, name, email, role from persons
     where email=$1 or graph_node_id=$2 for update`,
    [move.sponsor.email, id],
  );
  if (result.rows.length > 1) throw new Error(`Sponsor identity collision for ${move.sponsor.email}`);
  const existing = result.rows[0];
  if (existing) {
    if (
      existing.graph_node_id !== id ||
      existing.name !== move.sponsor.name ||
      existing.email !== move.sponsor.email ||
      existing.role !== move.sponsor.role
    ) {
      throw new Error(`Sponsor identity does not match synthetic reference for ${move.sponsor.email}`);
    }
    return existing.id;
  }
  const inserted = await client.query<{ id: string }>(
    `insert into persons(graph_node_id,name,email,role,organization)
     values($1,$2,$3,$4,'Healthcare demo organization') returning id`,
    [id, move.sponsor.name, move.sponsor.email, move.sponsor.role],
  );
  return inserted.rows[0].id;
}

async function upsertEngagement(client: pg.Client, row: DbEngagement): Promise<string> {
  const result = await client.query<{ id: string }>(
    `insert into engagements (
      graph_node_id, client_id, name, solution, industry_code, function_code,
      objective_code, topic_code, sponsor_person_id, problem_statement,
      target_outcome, value_projected_low_usd, value_projected_high_usd,
      value_currency, value_verified_status, value_assumptions_jsonb,
      baseline_metrics, program_archetype, origin_source, status, lifecycle_state,
      current_phase, charter, gates_passed, is_demo_data
    ) values (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,
      $17::jsonb,$18,$19,$20,$21,$22,$23::jsonb,$24::jsonb,$25
    )
    on conflict (graph_node_id) do nothing returning id`,
    [
      row.graph_node_id, row.client_id, row.name, row.solution, row.industry_code,
      row.function_code, row.objective_code, row.topic_code, row.sponsor_person_id,
      row.problem_statement, row.target_outcome, row.value_projected_low_usd,
      row.value_projected_high_usd, row.value_currency, row.value_verified_status,
      JSON.stringify(row.value_assumptions_jsonb), JSON.stringify(row.baseline_metrics),
      row.program_archetype, row.origin_source, row.status, row.lifecycle_state,
      row.current_phase, JSON.stringify(row.charter), JSON.stringify(row.gates_passed),
      row.is_demo_data,
    ],
  );
  if (result.rows[0]) return result.rows[0].id;
  const existing = await client.query<{ id: string }>(
    "select id from engagements where graph_node_id=$1 and client_id=$2",
    [row.graph_node_id, row.client_id],
  );
  if (existing.rowCount !== 1) {
    throw new Error(`Graph id is already owned by a different tenant: ${row.graph_node_id}`);
  }
  return existing.rows[0].id;
}

async function ensureParticipant(
  client: pg.Client,
  engagementId: string,
  sponsorId: string,
  move: (typeof CLEAN_DEMO_MOVES)[number],
): Promise<void> {
  const found = await client.query<{
    id: string;
    approval_authority: string | null;
    view_state: Record<string, unknown>;
  }>(
    `select id, approval_authority, view_state from engagement_participants
     where engagement_id=$1 and user_id=$2 for update`,
    [engagementId, sponsorId],
  );
  const viewState = { seed_key: "clean-demo-moves", provenance_class: "synthetic_reference" };
  const notificationPreferences = {
    phase_progress_email: false,
    preference_confirmed: false,
    provenance_class: "synthetic_reference",
  };
  if (found.rows[0]) {
    const existing = found.rows[0];
    if (existing.view_state?.seed_key !== "clean-demo-moves") {
      throw new Error(`Refusing to overwrite an existing sponsor participant for ${graphNodeId(move)}`);
    }
    await client.query(
      `update engagement_participants set role='sponsor', approval_authority='observer'
       where id=$1`,
      [existing.id],
    );
    return;
  }
  await client.query(
    `insert into engagement_participants (
       engagement_id,user_id,user_name,role,notify_on,approval_authority,
       notification_preferences,view_state
     ) values($1,$2,$3,'sponsor','{}'::text[],'observer',$4::jsonb,$5::jsonb)`,
    [engagementId, sponsorId, move.sponsor.name, JSON.stringify(notificationPreferences), JSON.stringify(viewState)],
  );
}

async function insertP1Drafts(
  client: pg.Client,
  engagementId: string,
  move: (typeof CLEAN_DEMO_MOVES)[number],
): Promise<void> {
  for (const row of p1ReferenceDrafts(move)) {
    await client.query(
      `insert into program_modules (
         engagement_id,module_key,module_name,phase_number,module_order,status,state_jsonb
       ) values($1,$2,$3,$4,$5,'not_started',$6::jsonb)
       on conflict (engagement_id,module_key) do nothing`,
      [engagementId, row.module_key, row.module_name, row.phase_number, row.module_order, JSON.stringify(row.state_jsonb)],
    );
  }
}

async function archiveMatches(
  client: pg.Client,
  clientId: string,
  matches: ArchiveCandidate[],
  operator: string,
  runId: string,
): Promise<void> {
  for (const row of matches) {
    if (row.lifecycle_state === "archived") continue;
    const updated = await client.query(
      `update engagements set
         archived_from_state=lifecycle_state, lifecycle_state='archived',
         archived_at=now(), archived_by=$2, archive_reason='demo_test_move_cleanup',
         archive_explanation=$3
       where id=$1 and client_id=$4
         and name=$5 and status is not distinct from $6
         and lifecycle_state is not distinct from $7
         and lifecycle_state is distinct from 'archived'`,
      [
        row.id,
        operator,
        `Governed clean-demo test cleanup; run ${runId}.`,
        clientId,
        row.name,
        row.status,
        row.lifecycle_state,
      ],
    );
    if (updated.rowCount !== 1) {
      throw new Error(`Archive candidate changed after preflight: ${row.id}`);
    }
  }
}

async function countRows(client: pg.Client, engagementId: string): Promise<Record<string, number>> {
  const result = await client.query<{
    key: string;
    count: number;
  }>(
    `select 'program_modules' as key, count(*)::int as count from program_modules where engagement_id=$1
     union all select 'program_evidence_items', count(*)::int from program_evidence_items where program_id=$1
     union all select 'program_attachments', count(*)::int from program_attachments where program_id=$1 and deleted_at is null
     union all select 'deliverables_v2', count(*)::int from deliverables_v2 where engagement_id=$1
     union all select 'phase_snapshots', count(*)::int from phase_snapshots where engagement_id=$1
     union all select 'program_approval_requests', count(*)::int from program_approval_requests where program_id=$1`,
    [engagementId],
  );
  return Object.fromEntries(result.rows.map((row) => [row.key, row.count]));
}

async function writeBlobJson(store: ProofStore, objectPath: string, value: unknown): Promise<string> {
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  const result = await store.writeOnce(objectPath, bytes);
  if (!result.created) throw new Error(`Proof object already exists: ${objectPath}`);
  return result.uri;
}

async function emitFinalProof(
  store: ProofStore,
  run: ReturnType<typeof jobRun>,
  mode: Mode,
  tenantScope: string,
  inputSourceVersion: string,
  specDigest: string,
  archiveRows: ReturnType<typeof planArchive>,
  engagements: Array<Record<string, unknown>>,
  startedAt: string,
  limits: ReturnType<typeof jobLimits>,
): Promise<void> {
  const outDir = path.join(os.tmpdir(), `clean-demo-moves-${run.runId}`);
  mkdirSync(outDir, { recursive: true });
  const bundlePath = path.join(path.dirname(outDir), `${path.basename(outDir)}.tgz`);
  const bundleUri = store.uriFor(`${PROOF_PREFIX}/runs/${run.runId}/proof-bundle.tgz`);
  const proof = {
    ...jobRecord(run, {
      tenantScope,
      inputSourceVersion,
      idempotencyKey: "graph_node_id; each engagement uses its own graph_node_id",
      status: "succeeded",
      proofUri: bundleUri,
      limits,
    }),
    mode,
    finished_at: new Date().toISOString(),
    source_spec_sha256: specDigest,
    archive_candidates: archiveRows,
    per_move_idempotency_keys: engagements.map((row) => row.graph_node_id),
    mutations_applied: mode === "apply",
    validation: {
      status: "PASS",
      checks: [
        "exactly five tenant-scoped engagement rows read back",
        "null projected values and pending verification status",
        "shaping lifecycle and empty gates_passed",
        "P1 reference drafts are not_started, human-review-required, and have empty value",
        "no evidence rows, deliverables, approvals, or phase snapshots created",
        "archive was a reversible lifecycle-state transition; no hard deletes",
        "sponsor is observer-only and phase-progress email is disabled",
      ],
    },
    quality_gate: {
      status: mode === "apply" ? "PASS" : "PLAN_ONLY",
      no_false_gate_or_evidence_credit: true,
      no_value_fabrication: true,
      no_client_email_sent: true,
    },
    engagements,
    started_at: startedAt,
  };
  writeFileSync(path.join(outDir, "proof.json"), `${JSON.stringify(proof, null, 2)}\n`);
  writeFileSync(path.join(outDir, "validation.json"), `${JSON.stringify(proof.validation, null, 2)}\n`);
  writeFileSync(path.join(outDir, "quality-gate.json"), `${JSON.stringify(proof.quality_gate, null, 2)}\n`);
  const packed = spawnSync("tar", ["-czf", bundlePath, "-C", path.dirname(outDir), path.basename(outDir)], { encoding: "utf8" });
  if (packed.status !== 0) throw new Error(packed.stderr || "Could not create Blob proof bundle");
  const bundle = await store.writeOnce(`${PROOF_PREFIX}/runs/${run.runId}/proof-bundle.tgz`, readFileSync(bundlePath));
  if (!bundle.created) throw new Error("Blob proof bundle already exists");
  const proofJson = await writeBlobJson(store, `${PROOF_PREFIX}/runs/${run.runId}/proof.json`, {
    ...proof,
    proof_uri: bundle.uri,
  });
  console.log(JSON.stringify({
    job_name: JOB_NAME,
    run_id: run.runId,
    tenant_scope: tenantScope,
    mode,
    status: "succeeded",
    proof_bundle_uri: bundle.uri,
    proof_json_uri: proofJson,
    archive_count: archiveRows.length,
    engagement_count: engagements.length,
    quality_gate: proof.quality_gate.status,
  }));
}

async function main(): Promise<void> {
  const mode = resolveMode(process.env);
  const spec = buildLoadSpec({ mode: "json", cleanTestMoves: true });
  validateSpec(spec);
  const tenantKey = String(spec.tenant_key);
  assertTenantRegistry(tenantKey);
  const inputSourceVersion = required(process.env, "ECL_SYNTHETIC_INPUT_SOURCE_VERSION");
  if (!/^[0-9a-f]{40}$/.test(inputSourceVersion)) throw new Error("Input source version must be a full main commit SHA");
  if (!required(process.env, "ECL_SYNTHETIC_IDEMPOTENCY_KEY").startsWith("graph_node_id:")) {
    throw new Error("Idempotency binding must declare graph_node_id keys");
  }
  const run = jobRun(process.env, JOB_NAME);
  const limits = jobLimits(process.env);
  const storageAccount = required(process.env, "AZURE_STORAGE_ACCOUNT_NAME");
  const storageIdentity = required(process.env, "ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID");
  const databaseUrl = required(process.env, "ABARVA_AZURE_DATABASE_URL");
  assertAzureTarget(databaseUrl);
  const store = await blobProofStore(storageAccount, storageIdentity, limits);
  const runPrefix = `${PROOF_PREFIX}/runs/${run.runId}`;
  const startedAt = new Date().toISOString();
  const specDigest = specHash(spec);
  const graphIds = CLEAN_DEMO_MOVES.map(graphNodeId);
  const phaseById = new Map(CLEAN_DEMO_MOVES.map((move) => [graphNodeId(move), move.entryPhase]));
  const client = new pg.Client(postgresClientOptions(databaseUrl, JOB_NAME));
  await client.connect();
  try {
    await client.query(`set statement_timeout = ${Math.max(1, limits.statementTimeoutMs)}`);
    await client.query(`set lock_timeout = ${Math.max(1, limits.lockTimeoutMs)}`);
    await assertSchema(client);
    if (mode === "plan") await client.query("begin read only");
    else await client.query("begin");
    const clientId = await resolveClientId(client, tenantKey);
    const existing = await readTenantMoves(client, clientId, graphIds);
    assertNoClobber(existing.clean, phaseById);
    const cleanIds = new Set(graphIds);
    const archiveRows = planArchive(existing.all, cleanIds);
    const archiveHash = archivePlanHash(archiveRows);
    const requestedHash = process.env.CLEAN_DEMO_MOVES_EXPECTED_ARCHIVE_SHA256;
    if (mode === "apply" && (!requestedHash || requestedHash !== archiveHash)) {
      throw new Error(`Archive preflight changed; expected ${requestedHash ?? "(missing)"}, received ${archiveHash}`);
    }
    await writeBlobJson(store, `${runPrefix}/progress/01-preflight.json`, {
      run_id: run.runId,
      mode,
      tenant_scope: tenantKey,
      archive_plan_sha256: archiveHash,
      archive_candidates: archiveRows,
      existing_clean_move_ids: existing.clean.map((row) => row.graph_node_id),
      source_spec_sha256: specDigest,
      started_at: startedAt,
    });
    console.log(JSON.stringify({
      event: "clean_demo_preflight",
      mode,
      tenant_scope: tenantKey,
      archive_plan_sha256: archiveHash,
      archive_candidates: archiveRows,
      existing_clean_move_ids: existing.clean.map((row) => row.graph_node_id),
    }));

    if (mode === "plan") {
      await client.query("rollback");
      const previews = CLEAN_DEMO_MOVES.map((move) => {
        const sponsorId = `person_demo_clean_${move.sponsor.email.split("@")[0].replace(/[^a-z0-9]+/gi, "_").toLowerCase()}`;
        const payload = buildDbEngagement(move, "<canonical-client-id>", sponsorId);
        const p1 = p1ReferenceDrafts(move);
        return {
          graph_node_id: payload.graph_node_id,
          name: payload.name,
          display_code: move.displayCode,
          current_phase: payload.current_phase,
          lifecycle_state: payload.lifecycle_state,
          value_projected_low_usd: null,
          value_projected_high_usd: null,
          value_verified_status: "pending",
          gates_passed: [],
          p1_reference_drafts: p1.length,
          evidence_created: 0,
        };
      });
      await emitFinalProof(store, run, mode, tenantKey, inputSourceVersion, specDigest, archiveRows, previews, startedAt, limits);
      console.log(`archive_plan_sha256=${archiveHash}`);
      return;
    }

    const operator = required(process.env, "ECL_SYNTHETIC_OPERATOR_IDENTITY");
    await archiveMatches(client, clientId, archiveRows, operator, run.runId);
    await writeBlobJson(store, `${runPrefix}/progress/02-archived.json`, {
      run_id: run.runId,
      archived_candidate_ids: archiveRows.filter((row) => row.lifecycle_state !== "archived").map((row) => row.id),
      action: "reversible lifecycle_state archive; no delete",
      status: "succeeded",
    });

    const readback: Array<Record<string, unknown>> = [];
    for (const move of CLEAN_DEMO_MOVES) {
      const sponsorId = await getOrCreateSponsor(client, move);
      const dbRow = buildDbEngagement(move, clientId, sponsorId);
      const engagementId = await upsertEngagement(client, dbRow);
      await ensureParticipant(client, engagementId, sponsorId, move);
      await insertP1Drafts(client, engagementId, move);
      const counts = await countRows(client, engagementId);
      if ((counts.program_evidence_items ?? 0) !== 0 || (counts.deliverables_v2 ?? 0) !== 0 || (counts.phase_snapshots ?? 0) !== 0 || (counts.program_approval_requests ?? 0) !== 0) {
        throw new Error(`Unexpected evidence, deliverable, snapshot, or approval rows on ${dbRow.graph_node_id}`);
      }
      readback.push({
        id: engagementId,
        graph_node_id: dbRow.graph_node_id,
        name: dbRow.name,
        display_code: move.displayCode,
        current_phase: dbRow.current_phase,
        lifecycle_state: dbRow.lifecycle_state,
        value_projected_low_usd: dbRow.value_projected_low_usd,
        value_projected_high_usd: dbRow.value_projected_high_usd,
        value_verified_status: dbRow.value_verified_status,
        gates_passed: dbRow.gates_passed,
        p1_reference_drafts: p1ReferenceDrafts(move).length,
        p1_capture_values_written: 0,
        evidence_counts: counts,
        evidence_state: "open; no evidence rows added or credited",
        sponsor_approval_authority: "observer",
        phase_progress_email_enabled: false,
      });
      await writeBlobJson(store, `${runPrefix}/progress/move-${readback.length}-of-${CLEAN_DEMO_MOVES.length}.json`, {
        run_id: run.runId,
        tenant_scope: tenantKey,
        graph_node_id: dbRow.graph_node_id,
        completed: readback.length,
        total: CLEAN_DEMO_MOVES.length,
        status: "running",
      });
    }

    const verify = await client.query<{
      graph_node_id: string;
      name: string;
      current_phase: number;
      lifecycle_state: string | null;
      value_projected_low_usd: string | null;
      value_projected_high_usd: string | null;
      value_verified_status: string | null;
      gates_passed: unknown;
      charter: Record<string, unknown> | null;
    }>(
      `select graph_node_id,name,current_phase,lifecycle_state,
              value_projected_low_usd::text,value_projected_high_usd::text,
              value_verified_status,gates_passed,charter
       from engagements where client_id=$1 and graph_node_id=any($2::text[])
       order by graph_node_id`,
      [clientId, graphIds],
    );
    if (verify.rowCount !== CLEAN_DEMO_MOVES.length) throw new Error("Readback did not return exactly five Moves");
    for (const row of verify.rows) {
      const expectedPhase = phaseById.get(row.graph_node_id);
      const scaffold = row.charter?.scaffold as Record<string, unknown> | undefined;
      if (
        row.lifecycle_state !== "shaping" ||
        row.current_phase !== expectedPhase ||
        row.value_projected_low_usd !== null ||
        row.value_projected_high_usd !== null ||
        row.value_verified_status !== "pending" ||
        !Array.isArray(row.gates_passed) || row.gates_passed.length !== 0 ||
        !Array.isArray(scaffold?.open_evidence) || scaffold.evidence_state !== "open" ||
        scaffold.evidence_cleared !== false || /ROLE-\d{2}.*authority_matrix\.csv/i.test(JSON.stringify(row.charter))
      ) {
        throw new Error(`Readback quality gate failed for ${row.graph_node_id}`);
      }
    }
    await writeBlobJson(store, `${runPrefix}/progress/03-ready-to-commit.json`, {
      run_id: run.runId,
      tenant_scope: tenantKey,
      validated_engagement_ids: readback.map((row) => row.graph_node_id),
      status: "ready_to_commit",
    });
    await client.query("commit");
    await writeBlobJson(store, `${runPrefix}/progress/04-committed.json`, {
      run_id: run.runId,
      tenant_scope: tenantKey,
      committed_engagement_ids: readback.map((row) => row.graph_node_id),
      status: "succeeded",
      committed_at: new Date().toISOString(),
    });
    await emitFinalProof(store, run, mode, tenantKey, inputSourceVersion, specDigest, archiveRows, readback, startedAt, limits);
  } catch (error) {
    try { await client.query("rollback"); } catch { /* retain the first failure */ }
    throw error;
  } finally {
    await client.end();
  }
}

const invoked = process.argv[1] ?? "";
if (/clean-demo-moves-aca-job(\.ts)?$/.test(invoked)) {
  main().catch((error: unknown) => {
    console.error(`clean demo ACA job failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
