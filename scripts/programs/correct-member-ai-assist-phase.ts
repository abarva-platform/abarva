#!/usr/bin/env tsx

import "dotenv/config";

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Client } from "pg";

const AUTHORIZED_MOVE_ID = "cd51e4fe-b5c4-4024-bc46-73afaff4e4b7";
const AUTHORIZED_MOVE_NAME = "MEMBER AI ASSIST";
const AUTHORIZED_GRAPH_NODE_ID = "eng_member_ai_assist_mrp7yhe4";
const DEFAULT_WORKFLOW_RUN_ID = `local-${new Date().toISOString().replace(/[-:.]/g, "")}`;
const AUTHORIZATION_TOKEN = "return-to-p3-approved-2026-07-23";
const TARGET_PHASE = 3;
const EXPECTED_SOURCE_PHASE = 4;
const PROOF_BEGIN = "__SEMANTIC2_PROOF_TGZ_BEGIN__";
const PROOF_END = "__SEMANTIC2_PROOF_TGZ_END__";

const P4_DELIVERABLE_TYPES_REQUIRING_REVALIDATION = [
  "execution_roadmap",
  "business_case",
  "financial_model",
  "tower_metrics_plan",
  "roadmap",
] as const;

interface Args {
  mode: "inspect" | "apply";
  selfTest: boolean;
  moveId: string;
  expectedCurrentPhase: number;
  targetPhase: number;
  workflowRunId: string;
  authorizationToken: string | null;
  outDir: string;
  operator: string;
}

interface MoveRow {
  id: string;
  name: string | null;
  graph_node_id: string | null;
  client_id: string | null;
  client_slug: string | null;
  client_name: string | null;
  status: string | null;
  lifecycle_state: string | null;
  current_phase: number | null;
  gates_passed: unknown;
  metadata: Record<string, unknown> | null;
  updated_at: string | null;
}

interface CorrectionPlan {
  status: "would_correct" | "already_at_target" | "blocked";
  reason: string;
  sanitizedGatesPassed: unknown[];
}

function usage(): string {
  return `Usage:
  npx tsx scripts/programs/correct-member-ai-assist-phase.ts [options]

Default mode is inspect. Apply mode requires the explicit authorization token.

Options:
  --mode inspect|apply
  --move-id <uuid>              Defaults to the authorized MEMBER AI ASSIST Move id.
  --workflow-run-id <id>        Audit/proof run id. Defaults to local timestamp.
  --authorization-token <text>  Required for apply. Must equal ${AUTHORIZATION_TOKEN}.
  --out-dir <path>              Proof output directory.
  --operator <id>               Audit actor label.
  --self-test                   Run pure-function self-test without a database.
  --help

ACA operator env:
  MOVES_MEMBER_AI_ASSIST_CORRECTION_MODE=inspect|apply
  MOVES_MEMBER_AI_ASSIST_CORRECTION_AUTHORIZATION=${AUTHORIZATION_TOKEN}
  MOVES_MEMBER_AI_ASSIST_CORRECTION_WORKFLOW_RUN_ID=<id>
  MOVES_MEMBER_AI_ASSIST_EMIT_PROOF_BUNDLE=1
`;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    mode: (process.env.MOVES_MEMBER_AI_ASSIST_CORRECTION_MODE as Args["mode"]) || "inspect",
    selfTest: false,
    moveId: process.env.MOVES_MEMBER_AI_ASSIST_CORRECTION_MOVE_ID || AUTHORIZED_MOVE_ID,
    expectedCurrentPhase: Number.parseInt(
      process.env.MOVES_MEMBER_AI_ASSIST_EXPECTED_CURRENT_PHASE || String(EXPECTED_SOURCE_PHASE),
      10,
    ),
    targetPhase: Number.parseInt(process.env.MOVES_MEMBER_AI_ASSIST_TARGET_PHASE || String(TARGET_PHASE), 10),
    workflowRunId: process.env.MOVES_MEMBER_AI_ASSIST_CORRECTION_WORKFLOW_RUN_ID || DEFAULT_WORKFLOW_RUN_ID,
    authorizationToken: process.env.MOVES_MEMBER_AI_ASSIST_CORRECTION_AUTHORIZATION || null,
    outDir:
      process.env.MOVES_MEMBER_AI_ASSIST_CORRECTION_OUT_DIR ||
      path.join(process.cwd(), "reports", "moves-remediation", "member-ai-assist", DEFAULT_WORKFLOW_RUN_ID),
    operator: process.env.ABARVA_OPERATOR_ID || "codex-governed-correction",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!;
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index]!;
    };
    if (arg === "--help" || arg === "-h") {
      console.log(usage());
      process.exit(0);
    } else if (arg === "--mode") args.mode = next() as Args["mode"];
    else if (arg === "--move-id") args.moveId = next();
    else if (arg === "--workflow-run-id") args.workflowRunId = next();
    else if (arg === "--authorization-token") args.authorizationToken = next();
    else if (arg === "--out-dir") args.outDir = next();
    else if (arg === "--operator") args.operator = next();
    else if (arg === "--self-test") args.selfTest = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!["inspect", "apply"].includes(args.mode)) throw new Error("--mode must be inspect or apply");
  if (args.moveId !== AUTHORIZED_MOVE_ID) {
    throw new Error(`This correction is authorized only for Move ${AUTHORIZED_MOVE_ID}.`);
  }
  if (args.mode === "apply" && args.authorizationToken !== AUTHORIZATION_TOKEN) {
    throw new Error("Apply mode requires the exact owner authorization token.");
  }
  if (!Number.isInteger(args.expectedCurrentPhase) || !Number.isInteger(args.targetPhase)) {
    throw new Error("Phase values must be integers.");
  }
  return args;
}

function connectionString(): string {
  const value =
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL ||
    process.env.DATABASE_URL;
  if (!value) throw new Error("ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL is required.");
  return value.replace(/^"|"$/g, "").replace(/^'|'$/g, "");
}

function tenantKeyFor(row: MoveRow): string {
  return row.client_slug || row.client_name || row.client_id || "unknown-tenant";
}

export function sanitizeGatesPassed(gatesPassed: unknown, targetPhase: number): unknown[] {
  if (!Array.isArray(gatesPassed)) return [];
  return gatesPassed.filter((gate) => {
    if (typeof gate === "number") return gate <= targetPhase;
    if (gate && typeof gate === "object") {
      const phase = (gate as { phase?: unknown }).phase;
      return typeof phase === "number" ? phase <= targetPhase : true;
    }
    return true;
  });
}

export function buildCorrectionPlan(row: MoveRow, args: Pick<Args, "expectedCurrentPhase" | "targetPhase">): CorrectionPlan {
  if ((row.name || "").toUpperCase() !== AUTHORIZED_MOVE_NAME) {
    return {
      status: "blocked",
      reason: `Move name mismatch: expected ${AUTHORIZED_MOVE_NAME}, got ${row.name || "(null)"}`,
      sanitizedGatesPassed: [],
    };
  }
  if (row.graph_node_id !== AUTHORIZED_GRAPH_NODE_ID) {
    return {
      status: "blocked",
      reason: `Graph node mismatch: expected ${AUTHORIZED_GRAPH_NODE_ID}, got ${row.graph_node_id || "(null)"}`,
      sanitizedGatesPassed: [],
    };
  }
  if (row.current_phase === args.targetPhase) {
    return {
      status: "already_at_target",
      reason: `Move is already at P${args.targetPhase}; no mutation needed.`,
      sanitizedGatesPassed: sanitizeGatesPassed(row.gates_passed, args.targetPhase),
    };
  }
  if (row.current_phase !== args.expectedCurrentPhase) {
    return {
      status: "blocked",
      reason: `Expected current phase P${args.expectedCurrentPhase} or already P${args.targetPhase}, got P${row.current_phase ?? "null"}.`,
      sanitizedGatesPassed: sanitizeGatesPassed(row.gates_passed, args.targetPhase),
    };
  }
  return {
    status: "would_correct",
    reason: `Return authorized Move from P${args.expectedCurrentPhase} to P${args.targetPhase}.`,
    sanitizedGatesPassed: sanitizeGatesPassed(row.gates_passed, args.targetPhase),
  };
}

async function readMove(client: Client, moveId: string): Promise<MoveRow | null> {
  const result = await client.query<MoveRow>(
    `select
       e.id::text,
       e.name,
       e.graph_node_id,
       e.client_id::text,
       c.slug as client_slug,
       c.name as client_name,
       e.status,
       e.lifecycle_state,
       e.current_phase,
       e.gates_passed,
       e.metadata,
       e.updated_at::text
     from public.engagements e
     left join public.clients c on c.id::text = e.client_id::text
     where e.id = $1`,
    [moveId],
  );
  return result.rows[0] ?? null;
}

async function countOtherMoveUpdates(client: Client, moveId: string): Promise<number> {
  const result = await client.query<{ count: string }>(
    `select count(*)::text as count
     from public.engagements
     where id <> $1
       and graph_node_id = $2`,
    [moveId, AUTHORIZED_GRAPH_NODE_ID],
  );
  return Number.parseInt(result.rows[0]?.count || "0", 10);
}

async function applyCorrection(client: Client, row: MoveRow, plan: CorrectionPlan, args: Args) {
  const tenantKey = tenantKeyFor(row);
  const correctionContext = {
    correctionId: "MOVES-REMEDIATION-001",
    workflowRunId: args.workflowRunId,
    authorization: "Anand Sundaram delegated owner decision, 2026-07-23",
    decisionRecord: "docs/backlog/decisions/2026-07-23-moves-owner-decisions.md",
    incidentRecord: "docs/incidents/2026-07-20-member-ai-assist-p4-phase-integrity-disputed.md",
    dossier: "docs/incidents/2026-07-20-member-ai-assist-decision-dossier.md",
    action: "return_to_p3_governed_correction",
    fromPhase: row.current_phase,
    toPhase: args.targetPhase,
    p4GeneratedContentDisposition: "preserved_and_requires_revalidation",
  };

  await client.query("begin");
  try {
    const updated = await client.query<MoveRow>(
      `update public.engagements
       set current_phase = $1,
           gates_passed = $2::jsonb,
           metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('member_ai_assist_phase_correction_20260723', $3::jsonb),
           updated_at = now()
       where id = $4
         and current_phase = $5
       returning id::text, name, graph_node_id, client_id::text, status, lifecycle_state, current_phase, gates_passed, metadata, updated_at::text`,
      [
        args.targetPhase,
        JSON.stringify(plan.sanitizedGatesPassed),
        JSON.stringify(correctionContext),
        args.moveId,
        args.expectedCurrentPhase,
      ],
    );
    if (updated.rowCount !== 1) {
      throw new Error(`Expected to update exactly one authorized Move row; updated ${updated.rowCount ?? 0}.`);
    }

    const deliverables = await client.query(
      `update public.deliverables_v2
       set requires_revalidation = true,
           updated_at = now()
       where engagement_id = $1
         and deliverable_type_key = any($2::text[])
       returning id::text, deliverable_type_key, title, status, current_version, requires_revalidation`,
      [args.moveId, P4_DELIVERABLE_TYPES_REQUIRING_REVALIDATION],
    );

    await client.query(
      `insert into public.program_audit_log (
         tenant_key, program_id, engagement_id, actor_id, actor_role,
         action, from_state, to_state, rationale, evidence_refs
       )
       values ($1, $2, $3, null, $4, $5, $6, $7, $8, $9::text[])`,
      [
        tenantKey,
        args.moveId,
        args.moveId,
        args.operator,
        "governed_phase_correction_return_to_p3",
        `P${row.current_phase}`,
        `P${args.targetPhase}`,
        "Owner-authorized correction for MOVES-REMEDIATION-001: P3→P4 advancement was reached through the now-fixed fabricated-evidence defect; return to P3 and preserve P4 content for revalidation.",
        [
          "docs/backlog/decisions/2026-07-23-moves-owner-decisions.md",
          "docs/incidents/2026-07-20-member-ai-assist-p4-phase-integrity-disputed.md",
          "docs/incidents/2026-07-20-member-ai-assist-decision-dossier.md",
          `moves-remediation-run:${args.workflowRunId}`,
        ],
      ],
    );

    await client.query(
      `insert into public.module_state_log (
         engagement_id, module_key, previous_state, new_state,
         changed_by_user_id, changed_by_agent, notes, context_jsonb
       )
       values ($1, $2, $3, $4, null, $5, $6, $7::jsonb)`,
      [
        args.moveId,
        "phase_integrity_correction",
        `P${row.current_phase}`,
        `P${args.targetPhase}`,
        args.operator,
        "Governed correction returned MEMBER AI ASSIST to P3. P4 artifacts preserved and marked for revalidation.",
        JSON.stringify(correctionContext),
      ],
    );

    await client.query(
      `insert into public.maestro_oversight_flags (
         engagement_id, flag_type, severity, raised_by,
         raised_by_user_id, headline, context_jsonb
       )
       values ($1, 'policy_violation', 'critical', 'system', null, $2, $3::jsonb)`,
      [
        args.moveId,
        "MEMBER AI ASSIST returned to P3 after disputed P3→P4 phase integrity incident",
        JSON.stringify(correctionContext),
      ],
    );

    await client.query("commit");
    return {
      updatedMove: updated.rows[0],
      p4DeliverablesMarkedForRevalidation: deliverables.rows,
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function emitProofBundle(outDir: string): void {
  if (process.env.MOVES_MEMBER_AI_ASSIST_EMIT_PROOF_BUNDLE !== "1") return;
  const tarPath = path.join(os.tmpdir(), `member-ai-assist-correction-${path.basename(outDir)}.tgz`);
  const tar = spawnSync("tar", ["-czf", tarPath, "-C", path.dirname(outDir), path.basename(outDir)], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (tar.status !== 0) {
    throw new Error(`Failed to create proof bundle: ${tar.stderr || tar.stdout || "tar failed"}`);
  }
  const payload = fs.readFileSync(tarPath).toString("base64");
  console.log(PROOF_BEGIN);
  console.log(payload);
  console.log(PROOF_END);
}

function runSelfTest(): void {
  const row: MoveRow = {
    id: AUTHORIZED_MOVE_ID,
    name: AUTHORIZED_MOVE_NAME,
    graph_node_id: AUTHORIZED_GRAPH_NODE_ID,
    client_id: "client",
    client_slug: "meridian-health",
    client_name: "Meridian Health",
    status: "active",
    lifecycle_state: null,
    current_phase: 4,
    gates_passed: [1, 2, 3, 4, { phase: 4, status: "approved" }, { phase: 2, status: "approved" }],
    metadata: {},
    updated_at: null,
  };
  const plan = buildCorrectionPlan(row, { expectedCurrentPhase: 4, targetPhase: 3 });
  if (plan.status !== "would_correct") throw new Error("self-test expected correction plan");
  if (JSON.stringify(plan.sanitizedGatesPassed) !== JSON.stringify([1, 2, 3, { phase: 2, status: "approved" }])) {
    throw new Error(`self-test sanitized gates mismatch: ${JSON.stringify(plan.sanitizedGatesPassed)}`);
  }
  const already = buildCorrectionPlan({ ...row, current_phase: 3 }, { expectedCurrentPhase: 4, targetPhase: 3 });
  if (already.status !== "already_at_target") throw new Error("self-test expected already_at_target");
  const blocked = buildCorrectionPlan({ ...row, current_phase: 5 }, { expectedCurrentPhase: 4, targetPhase: 3 });
  if (blocked.status !== "blocked") throw new Error("self-test expected blocked for unexpected current phase");
  console.log("MEMBER AI ASSIST correction self-test passed.");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.selfTest) {
    runSelfTest();
    return;
  }

  const outDir = path.resolve(args.outDir);
  fs.mkdirSync(outDir, { recursive: true });
  const client = new Client({
    connectionString: connectionString(),
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    const row = await readMove(client, args.moveId);
    if (!row) throw new Error(`Authorized Move not found: ${args.moveId}`);

    const otherMatchingMoves = await countOtherMoveUpdates(client, args.moveId);
    const plan = buildCorrectionPlan(row, args);
    const before = {
      move: row,
      otherMatchingMoves,
      plan,
    };
    writeJson(path.join(outDir, "before.json"), before);

    if (otherMatchingMoves !== 0) {
      throw new Error(`Found ${otherMatchingMoves} other Move rows with the authorized graph node id; refusing correction.`);
    }
    if (plan.status === "blocked") {
      writeJson(path.join(outDir, "summary.json"), {
        status: "BLOCKED",
        mode: args.mode,
        workflowRunId: args.workflowRunId,
        plan,
      });
      throw new Error(plan.reason);
    }

    let mutation: unknown = null;
    if (args.mode === "apply" && plan.status === "would_correct") {
      mutation = await applyCorrection(client, row, plan, args);
    }

    const after = await readMove(client, args.moveId);
    const summary = {
      status: "PASS",
      mode: args.mode,
      workflowRunId: args.workflowRunId,
      moveId: args.moveId,
      beforePhase: row.current_phase,
      afterPhase: after?.current_phase ?? null,
      planStatus: plan.status,
      mutationApplied: Boolean(mutation),
      p4DeliverableTypesPreservedForRevalidation: P4_DELIVERABLE_TYPES_REQUIRING_REVALIDATION,
      mutation,
    };
    writeJson(path.join(outDir, "after.json"), after);
    writeJson(path.join(outDir, "summary.json"), summary);
    fs.writeFileSync(
      path.join(outDir, "summary.md"),
      [
        "# MEMBER AI ASSIST governed correction proof",
        "",
        `- Status: ${summary.status}`,
        `- Mode: ${summary.mode}`,
        `- Workflow run id: ${summary.workflowRunId}`,
        `- Move id: ${summary.moveId}`,
        `- Before phase: P${summary.beforePhase}`,
        `- After phase: P${summary.afterPhase}`,
        `- Plan status: ${summary.planStatus}`,
        `- Mutation applied: ${summary.mutationApplied ? "yes" : "no"}`,
        "",
        "P4 generated content was preserved. Matching P4 deliverable rows, if any, are marked `requires_revalidation=true` in apply mode.",
        "",
      ].join("\n"),
    );
    emitProofBundle(outDir);
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await client.end();
  }
}

if (process.argv[1]?.endsWith("correct-member-ai-assist-phase.ts")) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack || error.message : error);
    process.exit(1);
  });
}
