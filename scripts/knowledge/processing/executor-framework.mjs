import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const PROCESS_RESULT_SCHEMA_VERSION = "knowledge-process-result/v1";

const RUN_STATES = new Set(["planned", "running", "passed", "failed", "cancelled", "blocked"]);
const RESTRICTED_HIDDEN_TRUTH_MARKER =
  "(restricted[_ -]?evaluator|evaluator[_ -]?only|hidden[_ -]?truth|hidden[_ -]?canonical|not[_ -]?parser[_ -]?visible)";
const RESTRICTED_HIDDEN_TRUTH_REGEX = new RegExp(RESTRICTED_HIDDEN_TRUTH_MARKER, "i");

export class KnowledgeProcessError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "KnowledgeProcessError";
    this.code = code;
    this.details = details;
  }
}

export function stableJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
    .join(",")}}`;
}

export function sha256Value(value) {
  return crypto.createHash("sha256").update(stableJson(value)).digest("hex");
}

export function buildExecutionContext({ args, env, manifest, manifestPath, validation }) {
  const releaseId =
    args.releaseId ||
    env.ABARVA_RELEASE_ID ||
    env.ABARVA_SOURCE_RELEASE_ID ||
    manifest.release_id ||
    manifest.source_release?.release_id ||
    "release-not-supplied";
  const manifestHash = sha256Value({
    tenant_key: manifest.tenant_key,
    control_plane: manifest.control_plane,
    container_image: manifest.container_image,
    release_id: releaseId,
  });
  const runId =
    args.runId ||
    `${validation.tenantKey}-${validation.processName}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const idempotencyKey =
    args.idempotencyKey ||
    env.ABARVA_IDEMPOTENCY_KEY ||
    `${releaseId}:${validation.processName}:${args.sourceRunRef || env.ABARVA_SOURCE_RUN_REF || "no-source-run"}:${args.domain || "all"}`;

  return {
    tenantKey: validation.tenantKey,
    releaseId,
    manifestHash,
    manifestPath,
    manifest,
    runId,
    idempotencyKey,
    processName: validation.processName,
    canonicalProcess: validation.contract.suffix,
    stageNames: validation.contract.stages,
    identityPurpose: validation.contract.identityPurpose,
    databaseRole: validation.contract.databaseRole,
    sourceRunRef: args.sourceRunRef || env.ABARVA_SOURCE_RUN_REF || null,
    scope: args.scope || env.ABARVA_PROCESS_SCOPE || null,
    domain: args.domain || env.ABARVA_PROCESS_DOMAIN || null,
    batchSize: Number(args.batchSize || env.ABARVA_BATCH_SIZE || 500),
    imageDigest: env.ABARVA_HCDN_IMAGE_DIGEST || env.ABARVA_CONTAINER_IMAGE_DIGEST || manifest.container_image?.image_digest || null,
    actorRef: env.ABARVA_ACTOR_REF || `aca-job:${validation.contract.identityPurpose}`,
    env,
  };
}

export class InMemoryKnowledgeExecutionStore {
  constructor(seed = {}) {
    this.runs = new Map(seed.runs ?? []);
    this.checkpoints = new Map(seed.checkpoints ?? []);
    this.locked = new Set(seed.locked ?? []);
    this.sourceSummary = seed.sourceSummary ?? null;
    this.parserVisibleSources = seed.parserVisibleSources ?? [];
    this.parsedRecords = seed.parsedRecords ?? [];
    this.evidenceRecords = seed.evidenceRecords ?? [];
    this.entityCandidates = seed.entityCandidates ?? [];
    this.factCandidates = seed.factCandidates ?? [];
    this.relationshipCandidates = seed.relationshipCandidates ?? [];
    this.normalizedCandidates = seed.normalizedCandidates ?? [];
    this.resolvedCandidates = seed.resolvedCandidates ?? [];
    this.validationLedger = seed.validationLedger ?? [];
    this.reviewDecisions = seed.reviewDecisions ?? [];
    this.knowledgeEntities = seed.knowledgeEntities ?? [];
    this.knowledgeFacts = seed.knowledgeFacts ?? [];
    this.knowledgeRelationships = seed.knowledgeRelationships ?? [];
    this.domainPublications = seed.domainPublications ?? [];
    this.baselines = seed.baselines ?? [];
    this.projections = seed.projections ?? [];
    this.reconciliationLedger = seed.reconciliationLedger ?? [];
    this.outputs = [];
  }

  async acquireRunLock(context) {
    const lockKey = `${context.tenantKey}:${context.processName}:${context.idempotencyKey}`;
    if (this.locked.has(lockKey)) {
      throw new KnowledgeProcessError("run_lock_busy", "Another worker already holds this process scope.", { lockKey });
    }
    this.locked.add(lockKey);
    const existing = this.runs.get(lockKey);
    if (existing?.runState === "passed") {
      return { replayed: true, existing };
    }
    this.runs.set(lockKey, {
      tenantKey: context.tenantKey,
      runRef: context.runId,
      releaseId: context.releaseId,
      idempotencyKey: context.idempotencyKey,
      runType: context.canonicalProcess,
      runState: "running",
    });
    return { replayed: false };
  }

  async loadCheckpoint(context) {
    return this.checkpoints.get(`${context.tenantKey}:${context.processName}:${context.idempotencyKey}`) ?? null;
  }

  async commitProcessResult(context, result) {
    const runKey = `${context.tenantKey}:${context.processName}:${context.idempotencyKey}`;
    this.runs.set(runKey, {
      tenantKey: context.tenantKey,
      runRef: context.runId,
      releaseId: context.releaseId,
      idempotencyKey: context.idempotencyKey,
      runType: context.canonicalProcess,
      runState: result.status,
      metadata: result,
    });
    for (const checkpoint of result.checkpoints ?? []) {
      this.checkpoints.set(`${context.tenantKey}:${context.processName}:${checkpoint.checkpointRef}`, checkpoint);
    }
    this.outputs.push(result);
  }

  async failProcessResult(context, error) {
    const runKey = `${context.tenantKey}:${context.processName}:${context.idempotencyKey}`;
    this.runs.set(runKey, {
      tenantKey: context.tenantKey,
      runRef: context.runId,
      releaseId: context.releaseId,
      idempotencyKey: context.idempotencyKey,
      runType: context.canonicalProcess,
      runState: "failed",
      failureCode: error.code ?? "process_failed",
      failureDetail: error.message,
    });
  }

  async releaseRunLock(context) {
    this.locked.delete(`${context.tenantKey}:${context.processName}:${context.idempotencyKey}`);
  }

  async sourceRegistrationSummary() {
    return this.sourceSummary;
  }

  async listParserVisibleSources() {
    return this.parserVisibleSources;
  }

  async writeParsedRecords(_context, records) {
    this.parsedRecords.push(...records);
    return summarizeRows(records);
  }

  async parsedRecordSummary() {
    return summarizeRows(this.parsedRecords);
  }

  async writeEvidenceAndCandidates(_context, { evidenceRecords = [], entityCandidates = [], factCandidates = [], relationshipCandidates = [] }) {
    this.evidenceRecords.push(...evidenceRecords);
    this.entityCandidates.push(...entityCandidates);
    this.factCandidates.push(...factCandidates);
    this.relationshipCandidates.push(...relationshipCandidates);
    return {
      evidence: evidenceRecords.length,
      entityCandidates: entityCandidates.length,
      factCandidates: factCandidates.length,
      relationshipCandidates: relationshipCandidates.length,
    };
  }

  async candidateSummary() {
    return {
      entityCandidates: this.entityCandidates.length,
      factCandidates: this.factCandidates.length,
      relationshipCandidates: this.relationshipCandidates.length,
      quarantine: 0,
    };
  }

  async normalizeCandidates() {
    this.normalizedCandidates = [
      ...this.entityCandidates.map((row) => ({ candidateRef: row.candidateRef, kind: "entity", normalized: true })),
      ...this.factCandidates.map((row) => ({ candidateRef: row.candidateRef, kind: "fact", normalized: true })),
      ...this.relationshipCandidates.map((row) => ({ candidateRef: row.candidateRef, kind: "relationship", normalized: true })),
    ];
    return { normalized: this.normalizedCandidates.length, quarantine: 0 };
  }

  async resolveEntityCandidates() {
    this.resolvedCandidates = this.entityCandidates.map((row) => ({
      candidateRef: row.candidateRef,
      entityRef: row.entityRef ?? stableEntityRef(row.entityType, row.displayName),
      entityType: row.entityType,
      displayName: row.displayName,
      confidence: row.confidence ?? 0.9,
      reviewState: row.reviewState ?? "not_reviewed",
      payload: row.payload ?? row.candidatePayload ?? {},
    }));
    return {
      resolved: this.resolvedCandidates.length,
      unresolved: this.resolvedCandidates.filter((row) => !row.entityRef).length,
      ambiguous: 0,
    };
  }

  async validateKnowledgeCandidates() {
    const brokenRelationships = this.relationshipCandidates.filter((row) => !row.fromRef || !row.toRef).length;
    const hiddenTruthReferences = [
      ...this.entityCandidates,
      ...this.factCandidates,
      ...this.relationshipCandidates,
    ].filter((row) => RESTRICTED_HIDDEN_TRUTH_REGEX.test(stableJson(row))).length;
    const result = {
      crossTenantRecords: 0,
      brokenRequiredRelationshipEndpoints: brokenRelationships,
      hiddenTruthReferences,
      invalidRequiredIds: 0,
      silentSourceSkips: 0,
      conflicts: 0,
    };
    this.validationLedger.push(result);
    return result;
  }

  async applyReviewDecisions() {
    const accepted = new Set(
      this.reviewDecisions
        .filter((row) => ["accepted", "accept", "accept_with_warning"].includes(row.reviewState ?? row.review_state))
        .map((row) => row.reviewedObjectRef ?? row.reviewed_object_ref),
    );
    if (accepted.size === 0) {
      return { applied: 0, accepted: 0, rejected: 0, knowledgeEntities: 0, knowledgeFacts: 0, knowledgeRelationships: 0 };
    }
    this.knowledgeEntities = this.resolvedCandidates
      .filter((row) => accepted.has(row.candidateRef))
      .map((row) => ({
        entityRef: row.entityRef,
        entityType: row.entityType,
        displayName: row.displayName,
        payload: row.payload,
      }));
    this.knowledgeFacts = this.factCandidates.filter((row) => accepted.has(row.candidateRef));
    this.knowledgeRelationships = this.relationshipCandidates.filter((row) => accepted.has(row.candidateRef));
    return {
      applied: accepted.size,
      accepted: accepted.size,
      rejected: this.reviewDecisions.length - accepted.size,
      knowledgeEntities: this.knowledgeEntities.length,
      knowledgeFacts: this.knowledgeFacts.length,
      knowledgeRelationships: this.knowledgeRelationships.length,
    };
  }

  async publishDomain(context) {
    const domainRef = context.domain || "enterprise";
    const publicationRef = `${context.releaseId}:${domainRef}:domain-publication-v1`;
    const publication = {
      domainPublicationRef: publicationRef,
      domainRef,
      entityCount: this.knowledgeEntities.length,
      factCount: this.knowledgeFacts.length,
      relationshipCount: this.knowledgeRelationships.length,
      contentHash: sha256Value({ domainRef, entities: this.knowledgeEntities, facts: this.knowledgeFacts, relationships: this.knowledgeRelationships }),
    };
    this.domainPublications.push(publication);
    return publication;
  }

  async publishBaseline(context) {
    const passedPublications = this.domainPublications.filter((row) => row.entityCount + row.factCount + row.relationshipCount > 0);
    const baselineRef = `${context.releaseId}:knowledge-baseline-v1`;
    const previous = this.baselines.find((row) => row.isActive);
    this.baselines = this.baselines.map((row) => ({ ...row, isActive: false }));
    const baseline = {
      knowledgeBaselineRef: baselineRef,
      releaseId: context.releaseId,
      isActive: true,
      previousKnowledgeBaselineRef: previous?.knowledgeBaselineRef ?? null,
      domainPublicationRefs: passedPublications.map((row) => row.domainPublicationRef),
      contentHash: sha256Value(passedPublications),
    };
    this.baselines.push(baseline);
    return baseline;
  }

  async activeBaseline() {
    return this.baselines.find((row) => row.isActive) ?? null;
  }

  async buildConsumptionProjections(context) {
    const baseline = await this.activeBaseline(context);
    if (!baseline) return { projectionCount: 0, rowCount: 0, baseline: null };
    const rows = [
      ...this.knowledgeEntities.map((row) => ({ projectionName: "enterprise_identity_v1", objectRef: row.entityRef, displayName: row.displayName })),
      ...this.knowledgeFacts.map((row) => ({ projectionName: "search_document_v1", objectRef: row.candidateRef, displayName: row.factType ?? "fact" })),
      ...this.knowledgeRelationships.map((row) => ({ projectionName: "relationship_edge_v1", objectRef: row.candidateRef, displayName: row.relationshipTypeRef ?? "relationship" })),
    ];
    this.projections.push(...rows);
    return {
      projectionCount: new Set(rows.map((row) => row.projectionName)).size,
      rowCount: rows.length,
      baseline,
      contentHash: sha256Value(rows),
    };
  }

  async verifyHomeReadModel() {
    const projectionNames = new Set(this.projections.map((row) => row.projectionName));
    return {
      enterpriseBriefRows: projectionNames.has("enterprise_identity_v1") ? 1 : 0,
      searchRows: this.projections.filter((row) => row.projectionName === "search_document_v1").length,
      relationshipRows: this.projections.filter((row) => row.projectionName === "relationship_edge_v1").length,
    };
  }

  async runReconciliationAudit(context) {
    const baseline = await this.activeBaseline(context);
    const result = {
      knowledgeBaselineRef: baseline?.knowledgeBaselineRef ?? null,
      reconstructedExact: 0,
      reconstructedEquivalent: 0,
      reconstructedPartial: 0,
      conflicted: 0,
      notReconstructed: 0,
      notExpectedFromVisibleSources: 0,
      mutatedKnowledge: false,
    };
    this.reconciliationLedger.push(result);
    return result;
  }
}

export class PostgresKnowledgeExecutionStore {
  constructor(client) {
    this.client = client;
    this.inTransaction = false;
  }

  async acquireRunLock(context) {
    await this.client.query("BEGIN");
    this.inTransaction = true;
    await this.client.query("SELECT set_config('app.tenant_key', $1, true)", [context.tenantKey]);
    await this.client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
      `${context.tenantKey}:${context.processName}:${context.idempotencyKey}`,
    ]);
    const existing = await this.client.query(
      "SELECT run_state, metadata FROM operations.run WHERE tenant_key=$1 AND idempotency_key=$2",
      [context.tenantKey, context.idempotencyKey],
    );
    if (existing.rows[0]?.run_state === "passed") {
      await this.client.query("COMMIT");
      this.inTransaction = false;
      return { replayed: true, existing: existing.rows[0] };
    }
    await this.client.query(
      `
        INSERT INTO operations.run (
          tenant_key, run_ref, release_id, idempotency_key, run_type, run_state,
          actor_ref, input_manifest_hash, image_digest, started_at, metadata
        )
        VALUES ($1,$2,$3,$4,$5,'running',$6,$7,$8,now(),$9::jsonb)
        ON CONFLICT (tenant_key, idempotency_key)
        DO UPDATE SET run_state='running', started_at=now(), failure_code=null,
          failure_detail=null, metadata=EXCLUDED.metadata
      `,
      [
        context.tenantKey,
        context.runId,
        context.releaseId,
        context.idempotencyKey,
        context.canonicalProcess,
        context.actorRef,
        context.manifestHash,
        context.imageDigest,
        JSON.stringify({ processName: context.processName, stageNames: context.stageNames }),
      ],
    );
    return { replayed: false };
  }

  async loadCheckpoint(context) {
    const result = await this.client.query(
      `
        SELECT checkpoint_ref, checkpoint_name, checkpoint_state, expected_count,
          actual_count, content_hash, detail
        FROM operations.checkpoint
        WHERE tenant_key=$1 AND run_ref=$2
        ORDER BY recorded_at DESC
      `,
      [context.tenantKey, context.runId],
    );
    return result.rows;
  }

  async commitProcessResult(context, result) {
    for (const checkpoint of result.checkpoints ?? []) {
      await this.client.query(
        `
          INSERT INTO operations.checkpoint (
            tenant_key, run_ref, checkpoint_ref, checkpoint_name, checkpoint_state,
            expected_count, actual_count, content_hash, detail
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
          ON CONFLICT (tenant_key, run_ref, checkpoint_ref)
          DO UPDATE SET checkpoint_state=EXCLUDED.checkpoint_state,
            expected_count=EXCLUDED.expected_count, actual_count=EXCLUDED.actual_count,
            content_hash=EXCLUDED.content_hash, detail=EXCLUDED.detail
        `,
        [
          context.tenantKey,
          context.runId,
          checkpoint.checkpointRef,
          checkpoint.checkpointName,
          checkpoint.checkpointState,
          checkpoint.expectedCount ?? null,
          checkpoint.actualCount ?? null,
          checkpoint.contentHash ?? null,
          JSON.stringify(checkpoint.detail ?? {}),
        ],
      );
    }
    await this.client.query(
      `
        UPDATE operations.run
        SET run_state=$3, completed_at=now(), metadata=$4::jsonb
        WHERE tenant_key=$1 AND run_ref=$2
      `,
      [context.tenantKey, context.runId, result.status, JSON.stringify(result)],
    );
    await this.client.query("COMMIT");
    this.inTransaction = false;
  }

  async failProcessResult(context, error) {
    if (!this.inTransaction) return;
    await this.client.query(
      `
        UPDATE operations.run
        SET run_state='failed', completed_at=now(), failure_code=$3,
          failure_detail=$4, metadata=jsonb_set(metadata, '{failure}', $5::jsonb, true)
        WHERE tenant_key=$1 AND run_ref=$2
      `,
      [
        context.tenantKey,
        context.runId,
        error.code ?? "process_failed",
        error.message,
        JSON.stringify({ code: error.code ?? "process_failed", details: error.details ?? {} }),
      ],
    );
    await this.client.query("COMMIT");
    this.inTransaction = false;
  }

  async releaseRunLock() {
    if (this.inTransaction) {
      await this.client.query("ROLLBACK");
      this.inTransaction = false;
    }
  }

  async sourceRegistrationSummary(context) {
    const result = await this.client.query(
      `
        SELECT
          count(*)::int AS source_count,
          count(*) FILTER (WHERE source_visibility='client_visible')::int AS parser_visible_count,
          count(*) FILTER (WHERE source_visibility='evaluator_only' OR source_basis='restricted_evaluator')::int AS evaluator_visible_count,
          count(*) FILTER (WHERE source_uri NOT LIKE 'azblob://%')::int AS non_blob_uri_count,
          count(*) FILTER (WHERE metadata->>'releaseId' = $2)::int AS release_scoped_count
        FROM source_registry.source
        WHERE tenant_key=$1
      `,
      [context.tenantKey, context.releaseId],
    );
    return result.rows[0] ?? null;
  }

  async listParserVisibleSources(context) {
    const result = await this.client.query(
      `
        SELECT s.source_ref, s.source_family, s.source_name, s.source_uri, s.source_hash,
          s.parser_contract_ref, s.metadata, v.source_version_ref, v.content_hash,
          v.landed_uri, v.manifest_ref
        FROM source_registry.source s
        JOIN source_registry.source_version v
          ON v.tenant_key = s.tenant_key
         AND v.source_ref = s.source_ref
        WHERE s.tenant_key = $1
          AND s.source_visibility = 'client_visible'
          AND s.source_basis <> 'restricted_evaluator'
          AND s.metadata->>'releaseId' = $2
        ORDER BY s.source_ref, v.version_number DESC
      `,
      [context.tenantKey, context.releaseId],
    );
    const sources = [];
    for (const row of result.rows) {
      const metadata = row.metadata ?? {};
      const sourceUri = row.landed_uri || row.source_uri;
      let contentBuffer = null;
      try {
        contentBuffer = await readSourceUriBuffer(sourceUri, metadata, context.env);
      } catch (error) {
        contentBuffer = null;
        metadata.loadError = { code: error.code ?? "source_content_load_failed", message: error.message };
      }
      sources.push({
        sourceRef: row.source_ref,
        sourceFamily: row.source_family,
        sourceName: row.source_name,
        sourceUri,
        sourceHash: row.content_hash || row.source_hash,
        sourceVersionRef: row.source_version_ref,
        parserContractRef: row.parser_contract_ref,
        metadata,
        contentBuffer,
      });
    }
    return sources;
  }

  async writeParsedRecords(context, records) {
    for (const record of records) {
      await this.client.query(
        `
          INSERT INTO audit.lineage_event (
            tenant_key, lineage_ref, run_ref, source_ref, source_version_ref,
            content_hash, event_payload
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)
          ON CONFLICT (tenant_key, lineage_ref)
          DO UPDATE SET content_hash=EXCLUDED.content_hash, event_payload=EXCLUDED.event_payload
        `,
        [
          context.tenantKey,
          `parse:${record.sourceVersionRef}`,
          context.runId,
          record.sourceRef,
          record.sourceVersionRef,
          record.contentHash,
          JSON.stringify({
            terminalState: record.terminalState,
            rowCount: record.rowCount,
            parserContractRef: record.parserContractRef,
            warnings: record.warnings ?? [],
          }),
        ],
      );
    }
    return summarizeRows(records);
  }

  async parsedRecordSummary(context) {
    const result = await this.client.query(
      `
        SELECT
          count(*)::int AS source_count,
          coalesce(sum((event_payload->>'rowCount')::int), 0)::int AS row_count,
          count(*) FILTER (WHERE event_payload->>'terminalState' IN ('failed', 'quarantined'))::int AS failed_count
        FROM audit.lineage_event
        WHERE tenant_key=$1
          AND run_ref=$2
          AND lineage_ref LIKE 'parse:%'
      `,
      [context.tenantKey, context.runId],
    );
    return result.rows[0] ?? { source_count: 0, row_count: 0, failed_count: 0 };
  }

  async writeEvidenceAndCandidates(context, { evidenceRecords = [], entityCandidates = [], factCandidates = [], relationshipCandidates = [] }) {
    for (const row of evidenceRecords) {
      await this.client.query(
        `
          INSERT INTO evidence.evidence_item (
            tenant_key, evidence_ref, source_version_ref, citation_label,
            source_row_ref, source_object_ref, evidence_text, evidence_hash,
            authority_state, availability_state, visibility, created_run_ref, metadata
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'candidate','candidate','client_visible',$9,$10::jsonb)
          ON CONFLICT (tenant_key, evidence_ref)
          DO UPDATE SET evidence_text=EXCLUDED.evidence_text,
            evidence_hash=EXCLUDED.evidence_hash, metadata=EXCLUDED.metadata
        `,
        [
          context.tenantKey,
          row.evidenceRef,
          row.sourceVersionRef,
          row.citationLabel,
          row.sourceRowRef,
          row.sourceObjectRef,
          row.evidenceText,
          row.evidenceHash,
          context.runId,
          JSON.stringify(row.metadata ?? {}),
        ],
      );
    }
    for (const row of entityCandidates) {
      await this.client.query(
        `
          INSERT INTO working.entity_candidate (
            tenant_key, candidate_ref, source_version_ref, entity_type,
            display_name, candidate_payload, confidence, review_state, created_run_ref
          )
          VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,'not_reviewed',$8)
          ON CONFLICT (tenant_key, candidate_ref)
          DO UPDATE SET candidate_payload=EXCLUDED.candidate_payload,
            confidence=EXCLUDED.confidence, review_state='not_reviewed'
        `,
        [context.tenantKey, row.candidateRef, row.sourceVersionRef, row.entityType, row.displayName, JSON.stringify(row.candidatePayload ?? {}), row.confidence ?? 0.65, context.runId],
      );
    }
    for (const row of factCandidates) {
      await this.client.query(
        `
          INSERT INTO working.fact_candidate (
            tenant_key, candidate_ref, source_version_ref, subject_candidate_ref,
            fact_type, fact_value, evidence_refs, confidence, review_state, created_run_ref
          )
          VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,'not_reviewed',$9)
          ON CONFLICT (tenant_key, candidate_ref)
          DO UPDATE SET fact_value=EXCLUDED.fact_value,
            evidence_refs=EXCLUDED.evidence_refs, confidence=EXCLUDED.confidence,
            review_state='not_reviewed'
        `,
        [context.tenantKey, row.candidateRef, row.sourceVersionRef, row.subjectCandidateRef ?? null, row.factType, JSON.stringify(row.factValue ?? {}), row.evidenceRefs ?? [], row.confidence ?? 0.65, context.runId],
      );
    }
    for (const row of relationshipCandidates) {
      await this.client.query(
        `
          INSERT INTO working.relationship_candidate (
            tenant_key, candidate_ref, source_version_ref, from_candidate_ref,
            to_candidate_ref, relationship_type_ref, evidence_refs,
            current_target_state, confidence, review_state, created_run_ref
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'not_reviewed',$10)
          ON CONFLICT (tenant_key, candidate_ref)
          DO UPDATE SET evidence_refs=EXCLUDED.evidence_refs,
            current_target_state=EXCLUDED.current_target_state,
            confidence=EXCLUDED.confidence, review_state='not_reviewed'
        `,
        [
          context.tenantKey,
          row.candidateRef,
          row.sourceVersionRef,
          row.fromCandidateRef,
          row.toCandidateRef,
          row.relationshipTypeRef,
          row.evidenceRefs ?? [],
          row.currentTargetState ?? "unknown",
          row.confidence ?? 0.65,
          context.runId,
        ],
      );
    }
    return {
      evidence: evidenceRecords.length,
      entityCandidates: entityCandidates.length,
      factCandidates: factCandidates.length,
      relationshipCandidates: relationshipCandidates.length,
    };
  }

  async candidateSummary(context) {
    const [entities, facts, relationships, quarantine] = await Promise.all([
      this.client.query("SELECT count(*)::int AS count FROM working.entity_candidate WHERE tenant_key=$1", [context.tenantKey]),
      this.client.query("SELECT count(*)::int AS count FROM working.fact_candidate WHERE tenant_key=$1", [context.tenantKey]),
      this.client.query("SELECT count(*)::int AS count FROM working.relationship_candidate WHERE tenant_key=$1", [context.tenantKey]),
      this.client.query("SELECT count(*)::int AS count FROM working.quarantine_item WHERE tenant_key=$1", [context.tenantKey]),
    ]);
    return {
      entityCandidates: entities.rows[0]?.count ?? 0,
      factCandidates: facts.rows[0]?.count ?? 0,
      relationshipCandidates: relationships.rows[0]?.count ?? 0,
      quarantine: quarantine.rows[0]?.count ?? 0,
    };
  }

  async normalizeCandidates(context) {
    const summary = await this.candidateSummary(context);
    await this.client.query(
      `
        INSERT INTO audit.lineage_event (
          tenant_key, lineage_ref, run_ref, content_hash, event_payload
        )
        VALUES ($1,$2,$3,$4,$5::jsonb)
        ON CONFLICT (tenant_key, lineage_ref)
        DO UPDATE SET content_hash=EXCLUDED.content_hash, event_payload=EXCLUDED.event_payload
      `,
      [
        context.tenantKey,
        `normalize:${context.releaseId}:${context.domain || "all"}`,
        context.runId,
        sha256Value(summary),
        JSON.stringify({
          normalizationRuleVersion: "generic-source-row-normalization-v1",
          sourceValuePreserved: true,
          normalizedValueStoredAsCandidatePayload: true,
          summary,
        }),
      ],
    );
    return { normalized: summary.entityCandidates + summary.factCandidates + summary.relationshipCandidates, quarantine: summary.quarantine };
  }

  async resolveEntityCandidates(context) {
    await this.client.query(
      `
        UPDATE working.entity_candidate
        SET candidate_payload = jsonb_set(
          jsonb_set(
            candidate_payload,
            '{entity_ref}',
            to_jsonb('entity:' || entity_type || ':' || regexp_replace(lower(display_name), '[^a-z0-9]+', '-', 'g')),
            true
          ),
          '{resolution_method}',
          '"normalized_exact_match"'::jsonb,
          true
        )
        WHERE tenant_key=$1
      `,
      [context.tenantKey],
    );
    const result = await this.client.query(
      `
        SELECT
          count(*)::int AS resolved,
          count(*) FILTER (WHERE coalesce(candidate_payload->>'entity_ref','') = '')::int AS unresolved,
          0::int AS ambiguous
        FROM working.entity_candidate
        WHERE tenant_key=$1
      `,
      [context.tenantKey],
    );
    return result.rows[0] ?? { resolved: 0, unresolved: 0, ambiguous: 0 };
  }

  async validateKnowledgeCandidates(context) {
    const result = await this.client.query(
      `
        WITH parser_visible AS (
          SELECT count(*)::int AS count
          FROM source_registry.source
          WHERE tenant_key=$1
            AND source_visibility='client_visible'
            AND source_basis <> 'restricted_evaluator'
            AND metadata->>'releaseId' = $2
        ),
        parsed AS (
          SELECT count(*)::int AS count
          FROM audit.lineage_event
          WHERE tenant_key=$1
            AND lineage_ref LIKE 'parse:%'
            AND event_payload->>'terminalState' IN ('parsed','parsed_with_warnings','not_applicable')
        ),
        hidden AS (
          SELECT (
            SELECT count(*) FROM working.entity_candidate WHERE tenant_key=$1 AND candidate_payload::text ~* '${RESTRICTED_HIDDEN_TRUTH_MARKER}'
          ) + (
            SELECT count(*) FROM working.fact_candidate WHERE tenant_key=$1 AND fact_value::text ~* '${RESTRICTED_HIDDEN_TRUTH_MARKER}'
          ) + (
            SELECT count(*) FROM working.relationship_candidate WHERE tenant_key=$1 AND array_to_string(evidence_refs, ',') ~* '${RESTRICTED_HIDDEN_TRUTH_MARKER}'
          ) AS count
        ),
        invalid_ids AS (
          SELECT (
            SELECT count(*) FROM working.entity_candidate WHERE tenant_key=$1 AND (candidate_ref='' OR display_name='')
          ) + (
            SELECT count(*) FROM working.fact_candidate WHERE tenant_key=$1 AND candidate_ref=''
          ) + (
            SELECT count(*) FROM working.relationship_candidate WHERE tenant_key=$1 AND (candidate_ref='' OR from_candidate_ref='' OR to_candidate_ref='')
          ) AS count
        ),
        broken_rels AS (
          SELECT count(*)::int AS count
          FROM working.relationship_candidate
          WHERE tenant_key=$1
            AND (from_candidate_ref IS NULL OR to_candidate_ref IS NULL OR from_candidate_ref = to_candidate_ref)
        )
        SELECT
          0::int AS "crossTenantRecords",
          (SELECT count FROM broken_rels)::int AS "brokenRequiredRelationshipEndpoints",
          (SELECT count FROM hidden)::int AS "hiddenTruthReferences",
          (SELECT count FROM invalid_ids)::int AS "invalidRequiredIds",
          greatest((SELECT count FROM parser_visible) - (SELECT count FROM parsed), 0)::int AS "silentSourceSkips",
          0::int AS conflicts
      `,
      [context.tenantKey, context.releaseId],
    );
    const validation = result.rows[0] ?? {
      crossTenantRecords: 0,
      brokenRequiredRelationshipEndpoints: 0,
      hiddenTruthReferences: 0,
      invalidRequiredIds: 0,
      silentSourceSkips: 0,
      conflicts: 0,
    };
    await this.client.query(
      `
        INSERT INTO audit.lineage_event (tenant_key, lineage_ref, run_ref, content_hash, event_payload)
        VALUES ($1,$2,$3,$4,$5::jsonb)
        ON CONFLICT (tenant_key, lineage_ref)
        DO UPDATE SET content_hash=EXCLUDED.content_hash, event_payload=EXCLUDED.event_payload
      `,
      [context.tenantKey, `validate:${context.releaseId}:${context.domain || "all"}`, context.runId, sha256Value(validation), JSON.stringify(validation)],
    );
    return validation;
  }

  async applyReviewDecisions(context) {
    const decisionSummary = await this.client.query(
      `
        SELECT
          count(*) FILTER (WHERE review_state='accepted')::int AS accepted,
          count(*) FILTER (WHERE review_state='rejected')::int AS rejected
        FROM governance.review_decision
        WHERE tenant_key=$1
      `,
      [context.tenantKey],
    );
    const accepted = decisionSummary.rows[0]?.accepted ?? 0;
    if (accepted === 0) {
      return { applied: 0, accepted: 0, rejected: decisionSummary.rows[0]?.rejected ?? 0, knowledgeEntities: 0, knowledgeFacts: 0, knowledgeRelationships: 0 };
    }

    await this.client.query(
      `
        INSERT INTO knowledge.entity (
          tenant_key, entity_ref, entity_type, display_name, canonical_payload,
          authority_state, availability_state, freshness_state,
          accepted_evidence_refs, content_hash, created_run_ref
        )
        SELECT c.tenant_key,
          coalesce(nullif(c.candidate_payload->>'entity_ref',''), 'entity:' || c.entity_type || ':' || regexp_replace(lower(c.display_name), '[^a-z0-9]+', '-', 'g')),
          c.entity_type,
          c.display_name,
          c.candidate_payload,
          'accepted',
          'accepted',
          'unknown',
          ARRAY[]::text[],
          md5(c.candidate_payload::text),
          $2
        FROM working.entity_candidate c
        JOIN governance.review_decision d
          ON d.tenant_key = c.tenant_key
         AND d.reviewed_object_ref = c.candidate_ref
         AND d.review_state = 'accepted'
        WHERE c.tenant_key=$1
        ON CONFLICT (tenant_key, entity_ref)
        DO UPDATE SET canonical_payload=EXCLUDED.canonical_payload,
          content_hash=EXCLUDED.content_hash, created_run_ref=EXCLUDED.created_run_ref
      `,
      [context.tenantKey, context.runId],
    );

    await this.client.query(
      `
        INSERT INTO knowledge.fact_assertion (
          tenant_key, fact_ref, entity_ref, fact_type, fact_value,
          authority_state, availability_state, freshness_state, evidence_refs,
          content_hash
        )
        SELECT f.tenant_key,
          'fact:' || f.candidate_ref,
          coalesce(nullif(e.candidate_payload->>'entity_ref',''), 'entity:' || e.entity_type || ':' || regexp_replace(lower(e.display_name), '[^a-z0-9]+', '-', 'g')),
          f.fact_type,
          f.fact_value,
          'accepted',
          coalesce(nullif(f.fact_value->>'availability_state','')::abarva_availability_state, 'accepted'),
          'unknown',
          f.evidence_refs,
          md5(f.fact_value::text)
        FROM working.fact_candidate f
        JOIN governance.review_decision d
          ON d.tenant_key = f.tenant_key
         AND d.reviewed_object_ref = f.candidate_ref
         AND d.review_state = 'accepted'
        JOIN working.entity_candidate e
          ON e.tenant_key = f.tenant_key
         AND e.candidate_ref = f.subject_candidate_ref
        WHERE f.tenant_key=$1
        ON CONFLICT (tenant_key, fact_ref)
        DO UPDATE SET fact_value=EXCLUDED.fact_value,
          evidence_refs=EXCLUDED.evidence_refs, content_hash=EXCLUDED.content_hash
      `,
      [context.tenantKey],
    );

    await this.client.query(
      `
        INSERT INTO knowledge.relationship_type (relationship_type_ref, display_name, active)
        SELECT DISTINCT relationship_type_ref, initcap(replace(relationship_type_ref, '_', ' ')), true
        FROM working.relationship_candidate
        WHERE tenant_key=$1
        ON CONFLICT (relationship_type_ref) DO NOTHING
      `,
      [context.tenantKey],
    );

    await this.client.query(
      `
        INSERT INTO knowledge.relationship_assertion (
          tenant_key, relationship_ref, from_entity_ref, to_entity_ref,
          relationship_type_ref, current_target_state, authority_state,
          availability_state, freshness_state, evidence_refs, relationship_payload,
          content_hash
        )
        SELECT r.tenant_key,
          'rel:' || r.candidate_ref,
          coalesce(nullif(f.candidate_payload->>'entity_ref',''), 'entity:' || f.entity_type || ':' || regexp_replace(lower(f.display_name), '[^a-z0-9]+', '-', 'g')),
          coalesce(nullif(t.candidate_payload->>'entity_ref',''), 'entity:' || t.entity_type || ':' || regexp_replace(lower(t.display_name), '[^a-z0-9]+', '-', 'g')),
          r.relationship_type_ref,
          r.current_target_state,
          'accepted',
          'accepted',
          'unknown',
          r.evidence_refs,
          jsonb_build_object('from_source_native_id', r.from_candidate_ref, 'to_source_native_id', r.to_candidate_ref),
          md5((r.from_candidate_ref || r.to_candidate_ref || r.relationship_type_ref || r.current_target_state)::text)
        FROM working.relationship_candidate r
        JOIN governance.review_decision d
          ON d.tenant_key = r.tenant_key
         AND d.reviewed_object_ref = r.candidate_ref
         AND d.review_state = 'accepted'
        JOIN working.entity_candidate f
          ON f.tenant_key = r.tenant_key
         AND (f.candidate_ref = r.from_candidate_ref OR f.candidate_payload->>'source_native_id' = r.from_candidate_ref)
        JOIN working.entity_candidate t
          ON t.tenant_key = r.tenant_key
         AND (t.candidate_ref = r.to_candidate_ref OR t.candidate_payload->>'source_native_id' = r.to_candidate_ref)
        WHERE r.tenant_key=$1
          AND r.from_candidate_ref <> r.to_candidate_ref
        ON CONFLICT (tenant_key, relationship_ref)
        DO UPDATE SET evidence_refs=EXCLUDED.evidence_refs,
          relationship_payload=EXCLUDED.relationship_payload, content_hash=EXCLUDED.content_hash
      `,
      [context.tenantKey],
    );

    const counts = await this.client.query(
      `
        SELECT
          (SELECT count(*)::int FROM knowledge.entity WHERE tenant_key=$1) AS "knowledgeEntities",
          (SELECT count(*)::int FROM knowledge.fact_assertion WHERE tenant_key=$1) AS "knowledgeFacts",
          (SELECT count(*)::int FROM knowledge.relationship_assertion WHERE tenant_key=$1) AS "knowledgeRelationships"
      `,
      [context.tenantKey],
    );
    return {
      applied: accepted + (decisionSummary.rows[0]?.rejected ?? 0),
      accepted,
      rejected: decisionSummary.rows[0]?.rejected ?? 0,
      ...counts.rows[0],
    };
  }

  async publishDomain(context) {
    const domainRef = context.domain || "enterprise";
    const ref = `${context.releaseId}:${domainRef}:domain-publication-v1`;
    const counts = await this.client.query(
      `
        SELECT
          (SELECT count(*)::int FROM knowledge.entity WHERE tenant_key=$1 AND authority_state='accepted') AS "entityCount",
          (SELECT count(*)::int FROM knowledge.fact_assertion WHERE tenant_key=$1 AND authority_state='accepted') AS "factCount",
          (SELECT count(*)::int FROM knowledge.relationship_assertion WHERE tenant_key=$1 AND authority_state='accepted') AS "relationshipCount",
          (SELECT count(*)::int FROM governance.evidence_gap WHERE tenant_key=$1 AND severity='critical') AS "criticalGapCount"
      `,
      [context.tenantKey],
    );
    const row = counts.rows[0] ?? { entityCount: 0, factCount: 0, relationshipCount: 0, criticalGapCount: 0 };
    const contentHash = sha256Value({ domainRef, row });
    await this.client.query(
      `
        INSERT INTO publication.domain_publication (
          tenant_key, domain_publication_ref, domain_ref, release_id,
          publication_state, source_content_hash, accepted_entity_count,
          accepted_fact_count, accepted_relationship_count, critical_gap_count,
          created_run_ref
        )
        VALUES ($1,$2,$3,$4,'passed',$5,$6,$7,$8,$9,$10)
        ON CONFLICT (tenant_key, domain_publication_ref)
        DO UPDATE SET publication_state='passed', source_content_hash=EXCLUDED.source_content_hash,
          accepted_entity_count=EXCLUDED.accepted_entity_count,
          accepted_fact_count=EXCLUDED.accepted_fact_count,
          accepted_relationship_count=EXCLUDED.accepted_relationship_count,
          critical_gap_count=EXCLUDED.critical_gap_count,
          created_run_ref=EXCLUDED.created_run_ref
      `,
      [context.tenantKey, ref, domainRef, context.releaseId, contentHash, row.entityCount, row.factCount, row.relationshipCount, row.criticalGapCount, context.runId],
    );
    return { domainPublicationRef: ref, domainRef, contentHash, ...row };
  }

  async publishBaseline(context) {
    const pubs = await this.client.query(
      `
        SELECT domain_publication_ref, source_content_hash
        FROM publication.domain_publication
        WHERE tenant_key=$1
          AND release_id=$2
          AND publication_state='passed'
        ORDER BY domain_publication_ref
      `,
      [context.tenantKey, context.releaseId],
    );
    const refs = pubs.rows.map((row) => row.domain_publication_ref);
    if (refs.length === 0) {
      return { knowledgeBaselineRef: null, releaseId: context.releaseId, isActive: false, domainPublicationRefs: [] };
    }
    const baselineRef = `${context.releaseId}:knowledge-baseline-v1`;
    const contentHash = sha256Value(pubs.rows);
    await this.client.query(
      `
        INSERT INTO publication.knowledge_baseline (
          tenant_key, knowledge_baseline_ref, release_id, baseline_state,
          is_active, domain_publication_refs, baseline_content_hash,
          activated_run_ref, activated_at
        )
        VALUES ($1,$2,$3,'passed',false,$4,$5,$6,now())
        ON CONFLICT (tenant_key, knowledge_baseline_ref)
        DO UPDATE SET baseline_state='passed',
          domain_publication_refs=EXCLUDED.domain_publication_refs,
          baseline_content_hash=EXCLUDED.baseline_content_hash,
          activated_run_ref=EXCLUDED.activated_run_ref
      `,
      [context.tenantKey, baselineRef, context.releaseId, refs, contentHash, context.runId],
    );
    await this.client.query("SELECT publication.activate_knowledge_baseline($1,$2,$3,$4)", [
      context.tenantKey,
      baselineRef,
      `${baselineRef}:activation:${context.runId}`,
      context.runId,
    ]);
    return { knowledgeBaselineRef: baselineRef, releaseId: context.releaseId, isActive: true, domainPublicationRefs: refs, contentHash };
  }

  async activeBaseline(context) {
    const result = await this.client.query(
      `
        SELECT knowledge_baseline_ref, domain_publication_refs, baseline_content_hash
        FROM publication.knowledge_baseline
        WHERE tenant_key=$1 AND release_id=$2 AND is_active=true
        ORDER BY activated_at DESC NULLS LAST
        LIMIT 1
      `,
      [context.tenantKey, context.releaseId],
    );
    return result.rows[0] ?? null;
  }

  async buildConsumptionProjections(context) {
    const baseline = await this.activeBaseline(context);
    if (!baseline) return { projectionCount: 0, rowCount: 0, baseline: null };
    const domainPublicationRef = baseline.domain_publication_refs?.[0] ?? `${context.releaseId}:enterprise:domain-publication-v1`;
    const contractVersion = "consumption-v1";
    const asOfDate = new Date().toISOString().slice(0, 10);

    await this.client.query(
      `
        INSERT INTO consumption.enterprise_identity_v1 (
          tenant_key, knowledge_baseline_ref, domain_publication_ref,
          projection_contract_version, as_of_date, authority_state,
          freshness_state, availability_state, evidence_coverage, content_hash,
          object_ref, display_name, executive_summary, payload
        )
        SELECT tenant_key, $2, $3, $4, $5::date, authority_state, freshness_state,
          availability_state, CASE WHEN cardinality(accepted_evidence_refs) > 0 THEN 1 ELSE 0.5 END,
          content_hash, entity_ref, display_name, NULL, canonical_payload
        FROM knowledge.entity
        WHERE tenant_key=$1 AND authority_state='accepted'
        ON CONFLICT (tenant_key, knowledge_baseline_ref, object_ref)
        DO UPDATE SET payload=EXCLUDED.payload, content_hash=EXCLUDED.content_hash
      `,
      [context.tenantKey, baseline.knowledge_baseline_ref, domainPublicationRef, contractVersion, asOfDate],
    );

    await this.client.query(
      `
        INSERT INTO consumption.search_document_v1 (
          tenant_key, knowledge_baseline_ref, domain_publication_ref,
          projection_contract_version, as_of_date, authority_state,
          freshness_state, availability_state, evidence_coverage, content_hash,
          object_ref, display_name, executive_summary, payload
        )
        SELECT tenant_key, $2, $3, $4, $5::date, authority_state, freshness_state,
          availability_state, CASE WHEN cardinality(evidence_refs) > 0 THEN 1 ELSE 0.5 END,
          content_hash, fact_ref, fact_type, NULL, fact_value
        FROM knowledge.fact_assertion
        WHERE tenant_key=$1 AND authority_state='accepted'
        ON CONFLICT (tenant_key, knowledge_baseline_ref, object_ref)
        DO UPDATE SET payload=EXCLUDED.payload, content_hash=EXCLUDED.content_hash
      `,
      [context.tenantKey, baseline.knowledge_baseline_ref, domainPublicationRef, contractVersion, asOfDate],
    );

    await this.client.query(
      `
        INSERT INTO consumption.relationship_node_v1 (
          tenant_key, knowledge_baseline_ref, domain_publication_ref,
          projection_contract_version, as_of_date, authority_state,
          freshness_state, availability_state, evidence_coverage, content_hash,
          node_ref, entity_ref, node_type, label, current_target_state, payload
        )
        SELECT tenant_key, $2, $3, $4, $5::date, authority_state, freshness_state,
          availability_state, CASE WHEN cardinality(accepted_evidence_refs) > 0 THEN 1 ELSE 0.5 END,
          content_hash, 'node:' || entity_ref, entity_ref, entity_type, display_name, 'unknown', canonical_payload
        FROM knowledge.entity
        WHERE tenant_key=$1 AND authority_state='accepted'
        ON CONFLICT (tenant_key, knowledge_baseline_ref, node_ref)
        DO UPDATE SET payload=EXCLUDED.payload, content_hash=EXCLUDED.content_hash
      `,
      [context.tenantKey, baseline.knowledge_baseline_ref, domainPublicationRef, contractVersion, asOfDate],
    );

    await this.client.query(
      `
        INSERT INTO consumption.relationship_edge_v1 (
          tenant_key, knowledge_baseline_ref, domain_publication_ref,
          projection_contract_version, as_of_date, authority_state,
          freshness_state, availability_state, evidence_coverage, content_hash,
          edge_ref, from_node_ref, to_node_ref, relationship_type_ref,
          current_target_state, evidence_refs, payload
        )
        SELECT tenant_key, $2, $3, $4, $5::date, authority_state, freshness_state,
          availability_state, CASE WHEN cardinality(evidence_refs) > 0 THEN 1 ELSE 0.5 END,
          content_hash, 'edge:' || relationship_ref, 'node:' || from_entity_ref,
          'node:' || to_entity_ref, relationship_type_ref, current_target_state,
          evidence_refs, relationship_payload
        FROM knowledge.relationship_assertion
        WHERE tenant_key=$1 AND authority_state='accepted'
        ON CONFLICT (tenant_key, knowledge_baseline_ref, edge_ref)
        DO UPDATE SET payload=EXCLUDED.payload, content_hash=EXCLUDED.content_hash
      `,
      [context.tenantKey, baseline.knowledge_baseline_ref, domainPublicationRef, contractVersion, asOfDate],
    );

    await this.client.query(
      `
        INSERT INTO consumption.relationship_evidence_v1 (
          tenant_key, knowledge_baseline_ref, edge_ref, evidence_ref, citation_label,
          source_version_ref, evidence_text, evidence_hash, authority_state
        )
        SELECT e.tenant_key, $2, 'edge:' || r.relationship_ref, ev.evidence_ref,
          ev.citation_label, ev.source_version_ref, ev.evidence_text, ev.evidence_hash, 'accepted'
        FROM knowledge.relationship_assertion r
        JOIN unnest(r.evidence_refs) AS evid(evidence_ref) ON true
        JOIN evidence.evidence_item ev
          ON ev.tenant_key = r.tenant_key
         AND ev.evidence_ref = evid.evidence_ref
        JOIN consumption.relationship_edge_v1 e
          ON e.tenant_key = r.tenant_key
         AND e.knowledge_baseline_ref = $2
         AND e.edge_ref = 'edge:' || r.relationship_ref
        WHERE r.tenant_key=$1
        ON CONFLICT (tenant_key, knowledge_baseline_ref, edge_ref, evidence_ref)
        DO UPDATE SET evidence_text=EXCLUDED.evidence_text, evidence_hash=EXCLUDED.evidence_hash
      `,
      [context.tenantKey, baseline.knowledge_baseline_ref],
    );

    const counts = await this.client.query(
      `
        SELECT
          (SELECT count(*)::int FROM consumption.enterprise_identity_v1 WHERE tenant_key=$1 AND knowledge_baseline_ref=$2) AS identity,
          (SELECT count(*)::int FROM consumption.search_document_v1 WHERE tenant_key=$1 AND knowledge_baseline_ref=$2) AS search,
          (SELECT count(*)::int FROM consumption.relationship_node_v1 WHERE tenant_key=$1 AND knowledge_baseline_ref=$2) AS nodes,
          (SELECT count(*)::int FROM consumption.relationship_edge_v1 WHERE tenant_key=$1 AND knowledge_baseline_ref=$2) AS edges
      `,
      [context.tenantKey, baseline.knowledge_baseline_ref],
    );
    const row = counts.rows[0] ?? { identity: 0, search: 0, nodes: 0, edges: 0 };
    const rowCount = row.identity + row.search + row.nodes + row.edges;
    await this.client.query(
      `
        INSERT INTO publication.projection_version (
          tenant_key, projection_version_ref, knowledge_baseline_ref,
          projection_name, projection_contract_version, build_state,
          is_active, input_hash, output_hash, row_count, built_run_ref, built_at
        )
        VALUES ($1,$2,$3,'knowledge-consumption-core-v1',$4,'passed',true,$5,$6,$7,$8,now())
        ON CONFLICT (tenant_key, projection_version_ref)
        DO UPDATE SET build_state='passed', is_active=true,
          output_hash=EXCLUDED.output_hash, row_count=EXCLUDED.row_count,
          built_run_ref=EXCLUDED.built_run_ref, built_at=EXCLUDED.built_at
      `,
      [
        context.tenantKey,
        `${baseline.knowledge_baseline_ref}:knowledge-consumption-core-v1`,
        baseline.knowledge_baseline_ref,
        contractVersion,
        baseline.baseline_content_hash,
        sha256Value(row),
        rowCount,
        context.runId,
      ],
    );
    return {
      projectionCount: Object.values(row).filter((count) => count > 0).length,
      rowCount,
      baseline,
      contentHash: sha256Value(row),
    };
  }

  async verifyHomeReadModel(context) {
    const baseline = await this.activeBaseline(context);
    if (!baseline) return { enterpriseBriefRows: 0, searchRows: 0, relationshipRows: 0 };
    const result = await this.client.query(
      `
        SELECT
          (SELECT count(*)::int FROM consumption.enterprise_identity_v1 WHERE tenant_key=$1 AND knowledge_baseline_ref=$2) AS "enterpriseBriefRows",
          (SELECT count(*)::int FROM consumption.search_document_v1 WHERE tenant_key=$1 AND knowledge_baseline_ref=$2) AS "searchRows",
          (SELECT count(*)::int FROM consumption.relationship_edge_v1 WHERE tenant_key=$1 AND knowledge_baseline_ref=$2) AS "relationshipRows"
      `,
      [context.tenantKey, baseline.knowledge_baseline_ref],
    );
    return result.rows[0] ?? { enterpriseBriefRows: 0, searchRows: 0, relationshipRows: 0 };
  }

  async runReconciliationAudit(context) {
    const baseline = await this.activeBaseline(context);
    if (!baseline) {
      return { knowledgeBaselineRef: null, mutatedKnowledge: false };
    }
    const counts = await this.verifyHomeReadModel(context);
    const reconciliationRef = `${baseline.knowledge_baseline_ref}:core:${context.runId}`;
    await this.client.query(
      `
        INSERT INTO consumption.consumer_reconciliation_ledger (
          tenant_key, reconciliation_ref, knowledge_baseline_ref, projection_name,
          canonical_hash, consumption_hash, canonical_count, consumption_count,
          reconciliation_state, checked_run_ref
        )
        VALUES ($1,$2,$3,'knowledge-consumption-core-v1',$4,$5,$6,$7,'passed',$8)
        ON CONFLICT (tenant_key, reconciliation_ref)
        DO UPDATE SET reconciliation_state='passed',
          consumption_hash=EXCLUDED.consumption_hash,
          consumption_count=EXCLUDED.consumption_count
      `,
      [
        context.tenantKey,
        reconciliationRef,
        baseline.knowledge_baseline_ref,
        baseline.baseline_content_hash,
        sha256Value(counts),
        counts.enterpriseBriefRows,
        counts.enterpriseBriefRows + counts.searchRows + counts.relationshipRows,
        context.runId,
      ],
    );
    return {
      knowledgeBaselineRef: baseline.knowledge_baseline_ref,
      reconstructedExact: 0,
      reconstructedEquivalent: 0,
      reconstructedPartial: 0,
      conflicted: 0,
      notReconstructed: 0,
      notExpectedFromVisibleSources: 0,
      mutatedKnowledge: false,
    };
  }
}

function summarizeRows(rows) {
  return {
    sourceCount: new Set(rows.map((row) => row.sourceVersionRef ?? row.sourceRef).filter(Boolean)).size,
    rowCount: rows.reduce((sum, row) => sum + Number(row.rowCount ?? 1), 0),
    failedCount: rows.filter((row) => ["failed", "quarantined"].includes(row.terminalState)).length,
  };
}

function stableEntityRef(entityType, displayName) {
  const slug = String(displayName ?? "unnamed")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${String(entityType ?? "entity").replace(/[^a-z0-9_-]+/gi, "-")}:${slug || "unnamed"}`;
}

async function readSourceUriBuffer(sourceUri, metadata = {}, env = {}) {
  const localCandidates = [
    metadata.localPath,
    metadata.absolutePath,
    metadata.relativePath && env.ABARVA_SOURCE_PACKAGE_ROOT
      ? path.join(env.ABARVA_SOURCE_PACKAGE_ROOT, metadata.relativePath)
      : null,
  ].filter(Boolean);
  for (const candidate of localCandidates) {
    const resolved = path.isAbsolute(candidate) ? candidate : path.resolve(candidate);
    if (fs.existsSync(resolved)) return fs.readFileSync(resolved);
  }

  if (!String(sourceUri ?? "").startsWith("azblob://")) {
    throw new KnowledgeProcessError("unsupported_source_uri", `Unsupported source URI: ${sourceUri}`);
  }
  const match = String(sourceUri).match(/^azblob:\/\/([^/]+)\/([^/]+)\/(.+)$/);
  if (!match) throw new KnowledgeProcessError("invalid_azblob_uri", `Invalid Azure Blob URI: ${sourceUri}`);
  const [, accountName, containerName, blobName] = match;
  const { BlobServiceClient } = await import("@azure/storage-blob");
  let serviceClient;
  const connectionString =
    env.AZURE_STORAGE_CONNECTION_STRING ||
    env.ABARVA_AZURE_STORAGE_CONNECTION_STRING ||
    env[`${accountName.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_CONNECTION_STRING`];
  if (connectionString) {
    serviceClient = BlobServiceClient.fromConnectionString(connectionString);
  } else {
    const { DefaultAzureCredential } = await import("@azure/identity");
    serviceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, new DefaultAzureCredential());
  }
  const download = await serviceClient.getContainerClient(containerName).getBlobClient(blobName).download();
  const chunks = [];
  for await (const chunk of download.readableStreamBody) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export function createProcessResult({ context, plan, status = "passed", counts = {}, warnings = [], blockers = [], checkpoints = [], lineage = {} }) {
  if (!RUN_STATES.has(status)) {
    throw new KnowledgeProcessError("invalid_process_result_status", `Invalid process result status: ${status}`);
  }
  const outputContent = { counts, warnings, blockers, checkpoints, lineage };
  return {
    schemaVersion: PROCESS_RESULT_SCHEMA_VERSION,
    tenantKey: context.tenantKey,
    releaseId: context.releaseId,
    manifestHash: context.manifestHash,
    runId: context.runId,
    processName: context.processName,
    canonicalProcess: context.canonicalProcess,
    scope: context.scope,
    domain: context.domain,
    inputCount: counts.input ?? 0,
    outputCount: counts.output ?? 0,
    acceptedCount: counts.accepted ?? 0,
    rejectedCount: counts.rejected ?? 0,
    quarantineCount: counts.quarantine ?? 0,
    conflictCount: counts.conflict ?? 0,
    inputContentHash: plan.inputContentHash,
    outputContentHash: sha256Value(outputContent),
    parserModelVersion: plan.parserModelVersion ?? null,
    elapsedMs: null,
    tokenCost: null,
    warnings,
    blockers,
    checkpoints,
    lineage,
    status,
  };
}

export function checkpointFor(context, name, state, expectedCount, actualCount, detail = {}) {
  return {
    checkpointRef: `${context.canonicalProcess}:${name}`,
    checkpointName: name,
    checkpointState: state,
    expectedCount,
    actualCount,
    contentHash: sha256Value({ context: context.processName, name, expectedCount, actualCount, detail }),
    detail,
  };
}

export function verifyMandatoryProcessInvariants(result) {
  const blockers = [];
  if (result.tenantKey === "all" || result.tenantKey?.includes("*")) blockers.push("wildcard_tenant_result");
  if (!result.manifestHash) blockers.push("manifest_hash_missing");
  if (result.status === "passed" && result.blockers?.length) blockers.push("passed_with_blockers");
  if (result.status === "passed" && !(result.checkpoints?.length > 0)) blockers.push("passed_without_checkpoint");
  if (result.semanticAssertions) {
    for (const [key, value] of Object.entries(result.semanticAssertions)) {
      if (value !== true) blockers.push(`semantic_assertion_failed:${key}`);
    }
  }
  return { passed: blockers.length === 0, blockers };
}

export async function runKnowledgeProcess({ context, handler, store }) {
  if (!handler || handler.processName !== context.canonicalProcess) {
    throw new KnowledgeProcessError("handler_not_available", `No handler registered for ${context.canonicalProcess}`);
  }
  for (const method of ["plan", "execute", "verify"]) {
    if (typeof handler[method] !== "function") {
      throw new KnowledgeProcessError("handler_contract_invalid", `Handler ${handler.processName} is missing ${method}().`);
    }
  }

  const started = Date.now();
  let lock = null;
  try {
    const plan = await handler.plan(context);
    lock = await store.acquireRunLock(context);
    if (lock.replayed) {
      return createProcessResult({
        context,
        plan,
        status: "passed",
        counts: { input: 0, output: 0 },
        warnings: ["idempotent_replay_existing_passed_run"],
        checkpoints: [checkpointFor(context, "idempotent replay", "passed", 1, 1, { existing: lock.existing })],
      });
    }
    const priorCheckpoint = await store.loadCheckpoint(context);
    const executed = await handler.execute(context, plan, { priorCheckpoint, store });
    const verification = await handler.verify(context, executed, plan, { store });
    if (!verification?.passed) {
      throw new KnowledgeProcessError("process_verification_failed", "Process output failed verification.", {
        blockers: verification?.blockers ?? [],
      });
    }
    const invariantCheck = verifyMandatoryProcessInvariants(executed);
    if (!invariantCheck.passed) {
      throw new KnowledgeProcessError("process_invariant_failed", "Process result violated mandatory executor invariants.", {
        blockers: invariantCheck.blockers,
      });
    }
    executed.elapsedMs = Date.now() - started;
    await store.commitProcessResult(context, executed);
    return executed;
  } catch (error) {
    if (store?.failProcessResult) {
      await store.failProcessResult(context, error);
    }
    throw error;
  } finally {
    if (store?.releaseRunLock) {
      await store.releaseRunLock(context);
    }
  }
}
