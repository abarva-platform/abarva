#!/usr/bin/env tsx
import { createHash } from "crypto";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { config as loadEnv } from "dotenv";

import {
  createFileSourceOperationalProvider,
  readOperationalReleasePackage,
} from "../../src/lib/source/operational/source-operational-provider";
import { buildSourceOperationalDemoViewModel } from "../../src/lib/source/operational/source-view-model-assembler";
import {
  AIRLINE_SOURCE_OPERATIONAL_RELEASE_ID,
  type SourceOperationalPackage,
  type SourceOperationalPricingRecord,
  type SourceOperationalRelease,
} from "../../src/lib/source/operational/types";
import { getAzureWriteFluentClient } from "../../src/lib/data-plane/postgresCompat";
import { buildEventScaffold } from "../../src/lib/source/canvas-substrate/scaffold";

const REPO_ROOT = process.cwd();
const DEFAULT_ENV = "/Users/anand/Projects/nexus/.env.local";
const DEFAULT_RELEASE_DIR = path.join(
  REPO_ROOT,
  "clients",
  "airline-demo-new",
  "23-source-operational-demo",
  AIRLINE_SOURCE_OPERATIONAL_RELEASE_ID,
);
const DEFAULT_RUNTIME_FIXTURE_DIR = path.join(
  REPO_ROOT,
  "scripts",
  "source",
  "fixtures",
  AIRLINE_SOURCE_OPERATIONAL_RELEASE_ID,
);
const DEFAULT_PROOF_DIR = path.join(
  REPO_ROOT,
  "reports",
  "source-operational-demo",
  AIRLINE_SOURCE_OPERATIONAL_RELEASE_ID,
);

interface Args {
  apply: boolean;
  releaseDir: string;
  proofDir: string;
  allowLabTenantRegistration: boolean;
}

interface ClientRow {
  id: string;
  name?: string | null;
  tenant_key?: string | null;
}

interface EventRow {
  id: string;
  client_key: string;
  event_code: string;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

async function main(): Promise<void> {
  loadEnv({ path: path.join(REPO_ROOT, ".env.local") });
  loadEnv({ path: DEFAULT_ENV });

  const args = parseArgs(process.argv.slice(2));
  const sourcePackage = await readOperationalReleasePackage(args.releaseDir);
  assertReleaseIsAllowed(sourcePackage);

  const viewModel = await buildSourceOperationalDemoViewModel(
    createFileSourceOperationalProvider({ releaseDir: args.releaseDir }),
  );
  const plan = buildLoadPlan(sourcePackage);
  const proof = {
    mode: args.apply ? "apply" : "dry-run",
    generatedAt: new Date().toISOString(),
    releaseId: sourcePackage.manifest.releaseId,
    releaseHashSha256: sourcePackage.manifest.releaseHashSha256,
    tenantKey: sourcePackage.manifest.tenantKey,
    eventId: sourcePackage.release.event.eventId,
    eventCode: sourcePackage.release.event.eventCode,
    provider: viewModel.providerIdentity,
    knowledgeContext: sourcePackage.manifest.knowledgeContext,
    objectCounts: sourcePackage.manifest.objectCounts,
    validationChecks: sourcePackage.validation.checks,
    loadPlan: plan,
    limitations: viewModel.limitations,
  };

  if (!args.apply) {
    await writeProof(args.proofDir, "dry-run-proof.json", proof);
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: "dry-run",
          releaseId: proof.releaseId,
          releaseHashSha256: proof.releaseHashSha256,
          loadPlan: plan,
          proofPath: path.join(args.proofDir, "dry-run-proof.json"),
        },
        null,
        2,
      ),
    );
    return;
  }

  const result = await applyLoad(sourcePackage, args);
  await writeProof(args.proofDir, "apply-proof.json", {
    ...proof,
    applyResult: result,
  });
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: "apply",
        releaseId: proof.releaseId,
        releaseHashSha256: proof.releaseHashSha256,
        applyResult: result,
        proofPath: path.join(args.proofDir, "apply-proof.json"),
      },
      null,
      2,
    ),
  );
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    apply: false,
    releaseDir: existsSync(path.join(DEFAULT_RELEASE_DIR, "release.json"))
      ? DEFAULT_RELEASE_DIR
      : DEFAULT_RUNTIME_FIXTURE_DIR,
    proofDir: DEFAULT_PROOF_DIR,
    allowLabTenantRegistration: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--apply") args.apply = true;
    else if (arg === "--dry-run") args.apply = false;
    else if (arg === "--allow-lab-tenant-registration") {
      args.allowLabTenantRegistration = true;
    } else if (arg === "--release-dir") {
      args.releaseDir = requiredValue(argv, (index += 1), arg);
    } else if (arg === "--proof-dir") {
      args.proofDir = requiredValue(argv, (index += 1), arg);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function requiredValue(argv: string[], index: number, flag: string): string {
  const value = argv[index];
  if (!value) throw new Error(`${flag} requires a value`);
  return value;
}

function assertReleaseIsAllowed(sourcePackage: SourceOperationalPackage): void {
  const { manifest, release, validation } = sourcePackage;
  if (manifest.releaseId !== AIRLINE_SOURCE_OPERATIONAL_RELEASE_ID) {
    throw new Error(`Unexpected release id: ${manifest.releaseId}`);
  }
  if (manifest.tenantKey !== "airline-demo-new") {
    throw new Error(`Unexpected tenant key: ${manifest.tenantKey}`);
  }
  if (manifest.loadPolicy.allowed !== "lab_only_source_operational_schema") {
    throw new Error(`Unexpected load policy: ${manifest.loadPolicy.allowed}`);
  }
  if (release.event.knowledgeContext.provider !== "KnowledgeConsumptionProvider") {
    throw new Error("Release does not declare KnowledgeConsumptionProvider");
  }
  if (!validation.ok || !Object.values(validation.checks).every(Boolean)) {
    throw new Error(`Release validation failed: ${manifest.releaseId}`);
  }
}

function buildLoadPlan(sourcePackage: SourceOperationalPackage) {
  const { release } = sourcePackage;
  return {
    eventRows: 1,
    sourceEventFactRows:
      1 +
      release.requirements.length +
      release.proposalResponses.length +
      release.evaluations.length +
      release.bafo.length +
      release.transitionCommitments.length +
      2,
    pricingSubmissionRows: release.pricing.length,
    sourceArtifactRows: 2,
    scaffoldOperation: "source_event_artifact_states/source_event_gate_criterion_states/source_event_evidence_states",
    duplicateGuard:
      "source_event_facts.source_operational_release_id for event + tenant + release",
  };
}

async function applyLoad(sourcePackage: SourceOperationalPackage, args: Args) {
  const db = getAzureWriteFluentClient();
  const tenantKey = sourcePackage.manifest.tenantKey;
  const client = await resolveClient(db, tenantKey, args.allowLabTenantRegistration);
  const eventRow = await upsertSourceEvent(db, sourcePackage, client);
  await assertNoDuplicateRelease(db, eventRow.id, tenantKey, sourcePackage.manifest.releaseId);

  await scaffoldEventSubstrate(db, eventRow.id, tenantKey);

  const artifacts = await insertSourceArtifacts(
    db,
    sourcePackage.release,
    sourcePackage.manifest.releaseHashSha256,
    client,
    eventRow,
  );
  const facts = await insertSourceEventFacts(
    db,
    sourcePackage,
    eventRow,
    artifacts,
  );
  const pricing = await insertPricingSubmissions(db, sourcePackage.release, eventRow);

  return {
    tenantKey,
    clientId: client.id,
    sourceEventRowId: eventRow.id,
    eventCode: eventRow.event_code,
    inserted: {
      sourceArtifacts: artifacts.length,
      sourceEventFacts: facts.length,
      pricingSubmissions: pricing.length,
    },
  };
}

async function scaffoldEventSubstrate(
  db: ReturnType<typeof getAzureWriteFluentClient>,
  sourceEventId: string,
  tenantKey: string,
): Promise<void> {
  const { artifactStates, gateCriterionStates, evidenceStates } =
    buildEventScaffold({ sourceEventId, tenantKey });
  const results = await Promise.all([
    db.from("source_event_artifact_states").upsert(artifactStates, {
      onConflict: "source_event_id,artifact_code",
      ignoreDuplicates: true,
    }),
    db.from("source_event_gate_criterion_states").upsert(gateCriterionStates, {
      onConflict: "source_event_id,criterion_id",
      ignoreDuplicates: true,
    }),
    db.from("source_event_evidence_states").upsert(evidenceStates, {
      onConflict: "source_event_id,requirement_id",
      ignoreDuplicates: true,
    }),
  ]);
  for (const result of results) {
    if (result.error) {
      throw new Error(`source event scaffold failed: ${result.error.message}`);
    }
  }
}

async function resolveClient(
  db: ReturnType<typeof getAzureWriteFluentClient>,
  tenantKey: string,
  allowRegistration: boolean,
): Promise<ClientRow> {
  const { data, error } = await db
    .from("clients")
    .select("id,name,tenant_key")
    .eq("tenant_key", tenantKey)
    .maybeSingle<ClientRow>();
  if (error) throw new Error(`client lookup failed: ${error.message}`);
  if (data) return data;
  if (!allowRegistration) {
    throw new Error(
      `tenant ${tenantKey} is not registered in clients; rerun with --allow-lab-tenant-registration only in the lab path`,
    );
  }
  const inserted = await db
    .from("clients")
    .insert({
      tenant_key: tenantKey,
      name: "Airline Demo New",
      legal_name: "Airline Demo New",
      industry_code: "airline_demo",
    })
    .select("id,name,tenant_key")
    .single<ClientRow>();
  if (inserted.error || !inserted.data) {
    throw new Error(
      `tenant lab registration failed: ${inserted.error?.message ?? "no row returned"}`,
    );
  }
  return inserted.data;
}

async function upsertSourceEvent(
  db: ReturnType<typeof getAzureWriteFluentClient>,
  sourcePackage: SourceOperationalPackage,
  client: ClientRow,
): Promise<EventRow> {
  const { release } = sourcePackage;
  const nowIso = new Date().toISOString();
  const result = await db
    .from("source_events")
    .upsert(
      {
        client_key: sourcePackage.manifest.tenantKey,
        event_code: release.event.eventCode,
        event_name: release.event.name,
        event_type: "operational_recovery_crew_data_platform",
        current_stage_key: "executive_decision",
        current_stage_entered_at: nowIso,
        lifecycle_state: "waiting_on_executive_decision",
        estimated_value_usd: release.valueScorecard.totalAnnualValueUsd,
        value_at_stake_low_usd: Math.round(release.valueScorecard.totalAnnualValueUsd * 0.8),
        value_at_stake_high_usd: Math.round(release.valueScorecard.totalAnnualValueUsd * 1.2),
        trigger_description: release.event.scenario,
        scope_description:
          "Lab-only synthetic Source operational release for operational recovery and crew data platform selection.",
        decision_owner: "Lab proof reviewer",
        created_by_user_id: "source-operational-loader",
        linked_program_id: null,
        lead_agent: "sentinel",
        classified_category: "operational_recovery_crew_data_platform",
        updated_at: nowIso,
      },
      {
        onConflict: "client_key,event_code",
        ignoreDuplicates: false,
      },
    )
    .select("id,client_key,event_code")
    .single<EventRow>();
  if (result.error || !result.data) {
    throw new Error(`source event upsert failed: ${result.error?.message ?? "no row returned"}`);
  }
  if (result.data.client_key !== sourcePackage.manifest.tenantKey) {
    throw new Error(`source event tenant mismatch for client ${client.id}`);
  }
  return result.data;
}

async function assertNoDuplicateRelease(
  db: ReturnType<typeof getAzureWriteFluentClient>,
  eventId: string,
  tenantKey: string,
  releaseId: string,
): Promise<void> {
  const result = await db
    .from("source_event_facts")
    .select("id")
    .eq("source_event_id", eventId)
    .eq("client_key", tenantKey)
    .eq("fact_key", "source_operational_release_id")
    .eq("value_text", releaseId)
    .eq("is_stale", false)
    .maybeSingle<{ id: string }>();
  if (result.error) throw new Error(`duplicate release check failed: ${result.error.message}`);
  if (result.data) {
    throw new Error(`duplicate release refused: ${releaseId} is already loaded for event ${eventId}`);
  }
}

async function insertSourceArtifacts(
  db: ReturnType<typeof getAzureWriteFluentClient>,
  release: SourceOperationalRelease,
  releaseHash: string,
  client: ClientRow,
  event: EventRow,
): Promise<Array<{ id: string; artifact_type: string }>> {
  const rows = [
    artifactRow({
      client,
      event,
      artifactType: "decision_brief",
      artifactFamily: "decision_brief",
      artifactKind: "decision_brief",
      stageKey: "executive_decision",
      title: release.decisionBrief.title,
      fileName: `${release.decisionBrief.id}.md`,
      sourceFormat: "markdown",
      fileFormat: "md",
      body: JSON.stringify(release.decisionBrief),
      releaseHash,
    }),
    artifactRow({
      client,
      event,
      artifactType: "scorecard",
      artifactFamily: "scorecard",
      artifactKind: "scorecard",
      stageKey: "value",
      title: "Synthetic value scorecard",
      fileName: `${release.valueScorecard.id}.json`,
      sourceFormat: "unknown",
      fileFormat: "json",
      body: JSON.stringify(release.valueScorecard),
      releaseHash,
    }),
  ];
  const result = await db.from("source_artifacts").insert(rows).select("id,artifact_type");
  if (result.error || !result.data) {
    throw new Error(`source artifact insert failed: ${result.error?.message ?? "no rows returned"}`);
  }
  return result.data as Array<{ id: string; artifact_type: string }>;
}

function artifactRow(input: {
  client: ClientRow;
  event: EventRow;
  artifactType: string;
  artifactFamily: string;
  artifactKind: string;
  stageKey: string;
  title: string;
  fileName: string;
  sourceFormat: string;
  fileFormat: string;
  body: string;
  releaseHash: string;
}): Record<string, unknown> {
  const blobPath = `${input.event.client_key}/${input.event.id}/${AIRLINE_SOURCE_OPERATIONAL_RELEASE_ID}/${input.fileName}`;
  const bodyHash = sha256(input.body);
  return {
    client_id: input.client.id,
    tenant_key: input.event.client_key,
    source_event_id: input.event.id,
    source_event_row_id: input.event.id,
    sourcing_stage: input.stageKey,
    stage_key: input.stageKey,
    artifact_group: "generated",
    artifact_type: input.artifactType,
    artifact_family: input.artifactFamily,
    artifact_kind: input.artifactKind,
    source_origin: "generated",
    source_format: input.sourceFormat,
    original_name: input.fileName,
    title: input.title,
    description: `Synthetic Source operational demo artifact for ${AIRLINE_SOURCE_OPERATIONAL_RELEASE_ID}.`,
    file_name: input.fileName,
    file_format: input.fileFormat,
    blob_container: "source-artifacts",
    blob_path: blobPath,
    blob_uri: `source-artifacts/${blobPath}`,
    file_size: Buffer.byteLength(input.body),
    size_bytes: Buffer.byteLength(input.body),
    sha256: bodyHash,
    blob_sha256: bodyHash,
    uploader_user_id: "source-operational-loader",
    mime_type: input.sourceFormat === "json" ? "application/json" : "text/markdown",
    status: "draft",
    source_basis: "synthetic_source_operational_demo",
    confidence: "medium",
    citation_ready: true,
    evidence_families_used: ["source_operational_release"],
    source_register_id: AIRLINE_SOURCE_OPERATIONAL_RELEASE_ID,
    parse_status: "parsed",
    embedding_status: "not_applicable",
    graph_status: "pending",
    classification_status: "classified",
    data_classification: "Internal",
    evidence_state: "cited",
    approval_state: "draft",
    lifecycle_state: "current",
    generated_by: "source-operational-loader",
    missing_inputs: [],
    client_complete_items: [],
    assumptions: [
      "Lab-only synthetic Source operational record.",
      `Release hash ${input.releaseHash}`,
    ],
  };
}

async function insertSourceEventFacts(
  db: ReturnType<typeof getAzureWriteFluentClient>,
  sourcePackage: SourceOperationalPackage,
  event: EventRow,
  artifacts: Array<{ id: string; artifact_type: string }>,
): Promise<Array<{ id: string }>> {
  const { release, manifest } = sourcePackage;
  const decisionBriefArtifact = artifacts.find(
    (artifact) => artifact.artifact_type === "decision_brief",
  );
  const rows: Record<string, unknown>[] = [
    factRow(event, manifest.tenantKey, "source_operational_release_id", {
      valueText: manifest.releaseId,
      citationDoc: "release-manifest.json",
      locator: "releaseId",
    }),
    factRow(event, manifest.tenantKey, "source_operational_release_hash", {
      valueText: manifest.releaseHashSha256,
      citationDoc: "release-manifest.json",
      locator: "releaseHashSha256",
    }),
    factRow(event, manifest.tenantKey, "source_operational_recommendation", {
      valueText: JSON.stringify(release.recommendation),
      citationDoc: "release.json",
      locator: "recommendation",
    }),
  ];

  rows.push(
    ...release.requirements.map((requirement) =>
      factRow(event, manifest.tenantKey, "source_operational_requirement", {
        valueText: JSON.stringify(requirement),
        citationDoc: "release.json",
        locator: `requirements.${requirement.id}`,
      }),
    ),
    ...release.proposalResponses.map((response) =>
      factRow(event, manifest.tenantKey, "source_operational_proposal_response", {
        entityKind: "vendor",
        entityRef: response.vendorId,
        valueText: JSON.stringify(response),
        citationDoc: "release.json",
        locator: `proposalResponses.${response.id}`,
      }),
    ),
    ...release.evaluations.map((evaluation) =>
      factRow(event, manifest.tenantKey, "source_operational_weighted_evaluation", {
        entityKind: "vendor",
        entityRef: evaluation.vendorId,
        valueNumeric: evaluation.weightedScore,
        citationDoc: "release.json",
        locator: `evaluations.${evaluation.id}`,
      }),
    ),
    ...release.bafo.map((bafo) =>
      factRow(event, manifest.tenantKey, "source_operational_bafo", {
        entityKind: "vendor",
        entityRef: bafo.vendorId,
        valueText: JSON.stringify(bafo),
        citationDoc: "release.json",
        locator: `bafo.${bafo.id}`,
      }),
    ),
    ...release.transitionCommitments.map((commitment) =>
      factRow(event, manifest.tenantKey, "source_operational_transition_commitment", {
        entityKind: "vendor",
        entityRef: commitment.vendorId,
        valueText: JSON.stringify(commitment),
        citationDoc: "release.json",
        locator: `transitionCommitments.${commitment.id}`,
      }),
    ),
  );

  if (decisionBriefArtifact) {
    rows.push(
      factRow(event, manifest.tenantKey, "source_operational_decision_brief_artifact", {
        valueText: decisionBriefArtifact.id,
        citationDoc: "source_artifacts",
        locator: decisionBriefArtifact.id,
      }),
    );
  }

  const result = await db.from("source_event_facts").insert(rows).select("id");
  if (result.error || !result.data) {
    throw new Error(`source_event_facts insert failed: ${result.error?.message ?? "no rows returned"}`);
  }
  return result.data as Array<{ id: string }>;
}

function factRow(
  event: EventRow,
  tenantKey: string,
  factKey: string,
  input: {
    valueNumeric?: number;
    valueText?: string;
    entityKind?: string;
    entityRef?: string;
    citationDoc: string;
    locator: string;
  },
): Record<string, unknown> {
  return {
    source_event_id: event.id,
    client_key: tenantKey,
    fact_key: factKey,
    entity_kind: input.entityKind ?? "event",
    entity_ref: input.entityRef ?? null,
    value_numeric: input.valueNumeric ?? null,
    value_text: input.valueText ?? null,
    unit: input.valueNumeric == null ? "text" : "count",
    source_method: "structured_map",
    source_citation: {
      doc: input.citationDoc,
      locator: input.locator,
      releaseId: AIRLINE_SOURCE_OPERATIONAL_RELEASE_ID,
    },
    confidence: "med",
    is_stale: false,
  };
}

async function insertPricingSubmissions(
  db: ReturnType<typeof getAzureWriteFluentClient>,
  release: SourceOperationalRelease,
  event: EventRow,
): Promise<Array<{ id: string }>> {
  const rows = release.pricing.map((pricing) => pricingSubmissionRow(pricing, event));
  const result = await db.from("source_event_pricing_submissions").insert(rows).select("id");
  if (result.error || !result.data) {
    throw new Error(
      `source_event_pricing_submissions insert failed: ${result.error?.message ?? "no rows returned"}`,
    );
  }
  return result.data as Array<{ id: string }>;
}

function pricingSubmissionRow(
  pricing: SourceOperationalPricingRecord,
  event: EventRow,
): Record<string, unknown> {
  return {
    source_event_id: event.id,
    tenant_key: event.client_key,
    vendor_name: pricing.vendorId,
    uploaded_by_user_id: "source-operational-loader",
    uploaded_filename: `${pricing.id}.json`,
    unit_prices_by_id: Object.fromEntries(
      pricing.lines.map((line) => [line.type, line.amountUsd]),
    ),
    vendor_notes_by_id: {},
    pricing_notes: `Synthetic Source operational demo pricing total ${pricing.totalYearOneUsd}.`,
    assumption_deviations: [
      {
        assumptionKey: "source_operational_release",
        proposedAlternative: AIRLINE_SOURCE_OPERATIONAL_RELEASE_ID,
        severity: "info",
      },
    ],
    parse_status: "parsed",
    parse_warnings: [],
  };
}

async function writeProof(
  proofDir: string,
  name: string,
  value: Record<string, unknown>,
): Promise<void> {
  await mkdir(proofDir, { recursive: true });
  await writeFile(path.join(proofDir, name), `${JSON.stringify(value, null, 2)}\n`);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
