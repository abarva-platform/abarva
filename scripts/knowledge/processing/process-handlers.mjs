import {
  KnowledgeProcessError,
  checkpointFor,
  createProcessResult,
  sha256Value,
  stableJson,
} from "./executor-framework.mjs";

export const TERMINAL_SOURCE_STATES = Object.freeze([
  "parsed",
  "parsed_with_warnings",
  "quarantined",
  "failed",
  "not_applicable",
]);

const PROCESS_ORDER = Object.freeze({
  "source-register-v1": {
    stage: "source_register",
    outputs: ["source_registry.source", "source_registry.source_version"],
    prerequisites: ["operational source landing", "frozen release manifest"],
  },
  "source-parse-v1": {
    stage: "parse",
    outputs: ["working parser outputs"],
    prerequisites: ["source-register-v1 passed", "parser-visible source versions"],
  },
  "evidence-extract-v1": {
    stage: "evidence_extract",
    outputs: ["evidence.evidence_item", "working.*_candidate"],
    prerequisites: ["source-parse-v1 passed"],
  },
  "knowledge-normalize-v1": {
    stage: "normalize",
    outputs: ["working normalized candidates", "normalization lineage"],
    prerequisites: ["evidence-extract-v1 passed"],
  },
  "entity-resolve-v1": {
    stage: "entity_resolve",
    outputs: ["identity crosswalk", "unresolved queue", "ambiguous queue"],
    prerequisites: ["knowledge-normalize-v1 passed"],
  },
  "knowledge-validate-v1": {
    stage: "validate",
    outputs: ["semantic validation ledger", "conflict ledger", "quarantine ledger"],
    prerequisites: ["entity-resolve-v1 passed"],
  },
  "knowledge-review-v1": {
    stage: "review_apply",
    outputs: ["knowledge.entity", "knowledge.fact_assertion", "knowledge.relationship_assertion"],
    prerequisites: ["knowledge-validate-v1 passed", "explicit review decision ledger"],
  },
  "domain-publish-v1": {
    stage: "domain_publish",
    outputs: ["publication.domain_publication"],
    prerequisites: ["review_apply passed for selected domain"],
  },
  "baseline-publish-v1": {
    stage: "baseline_publish",
    outputs: ["publication.knowledge_baseline", "publication.publication_activation"],
    prerequisites: ["mandatory domain publications passed"],
  },
  "projection-build-v1": {
    stage: "projection_build",
    outputs: ["consumption.*_v1", "publication.projection_version"],
    prerequisites: ["active knowledge baseline"],
  },
  "home-readmodel-v1": {
    stage: "home_read_model",
    outputs: ["Home/Knowledge read model projections"],
    prerequisites: ["projection-build-v1 passed"],
  },
  "knowledge-backfill-v1": {
    stage: "knowledge_backfill",
    outputs: ["replay ledger"],
    prerequisites: ["approved backfill manifest"],
  },
  "reconciliation-audit-v1": {
    stage: "reconciliation_audit",
    outputs: ["restricted evaluator audit results only"],
    prerequisites: ["published baseline", "evaluator identity", "restricted hidden truth"],
  },
  "metric-parity-v1": {
    stage: "metric_parity",
    outputs: ["Cube/Postgres metric parity ledger"],
    prerequisites: ["active knowledge baseline", "baseline-versioned consumption projections", "evaluator identity"],
  },
});

export function assertTerminalSourceState(state) {
  if (!TERMINAL_SOURCE_STATES.includes(state)) {
    throw new KnowledgeProcessError("invalid_terminal_source_state", `Invalid terminal source state: ${state}`, {
      allowed: TERMINAL_SOURCE_STATES,
    });
  }
}

function planFor(context, spec) {
  return {
    processName: context.canonicalProcess,
    stage: spec.stage,
    prerequisites: spec.prerequisites,
    expectedOutputs: spec.outputs,
    inputContentHash: sha256Value({
      tenantKey: context.tenantKey,
      releaseId: context.releaseId,
      processName: context.processName,
      sourceRunRef: context.sourceRunRef,
      scope: context.scope,
      domain: context.domain,
    }),
    parserModelVersion: "deterministic-executor-contract-v1",
  };
}

function adapterFor(context) {
  const adapters = context.adapters ?? {};
  return adapters[context.canonicalProcess] ?? adapters[context.processName] ?? null;
}

function assertStoreMethod(store, method, canonicalProcess) {
  if (typeof store?.[method] !== "function") {
    throw new KnowledgeProcessError("store_method_missing", `${canonicalProcess} requires store.${method}().`, {
      method,
      canonicalProcess,
    });
  }
}

function resultStatusForBlockers(blockers) {
  return blockers.length ? "blocked" : "passed";
}

function normalizeKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export const SOURCE_IDENTITY_MAP = Object.freeze({
  "00_enterprise_profile.csv": { entityType: "enterprise", nameColumn: "entity_name", idColumns: ["original_row_id"] },
  "01_business_functions.csv": { entityType: "business_function", nameColumn: "function_name", idColumns: ["original_row_id"] },
  "02_org_ownership.csv": { entityType: "organization", nameColumn: "org_unit", idColumns: ["original_row_id"] },
  "03_workforce_roles.csv": { entityType: "workforce_role", nameColumn: "persona_or_role", idColumns: ["original_row_id"] },
  "04_applications_systems.csv": { entityType: "application_platform", nameColumn: "system_name", idColumns: ["original_row_id"] },
  "05_data_assets_integrations.csv": { entityType: "data_asset", nameColumns: ["data_asset_name", "source_system", "target_system"], idColumns: ["original_row_id"] },
  "06_infrastructure_platforms.csv": { entityType: "infrastructure_platform", nameColumn: "platform_name", idColumns: ["original_row_id"] },
  "07_vendors_contracts.csv": { entityType: "vendor", nameColumn: "vendor_name", idColumns: ["original_row_id"] },
  "08_spend_value.csv": { entityType: "spend_category", nameColumn: "spend_category", idColumns: ["original_row_id"] },
  "09_programs_initiatives.csv": { entityType: "program", nameColumn: "program_name", idColumns: ["original_row_id"] },
  "10_ai_automation_use_cases.csv": { entityType: "ai_use_case", nameColumn: "use_case_name", idColumns: ["original_row_id"] },
  "11_risks_controls.csv": { entityType: "risk_control", nameColumn: "risk_or_control_name", idColumns: ["original_row_id"] },
  "12_relationships.csv": {
    entityType: "relationship",
    nameColumns: ["from_object_name", "relationship_type", "to_object_name"],
    idCompositeColumns: ["from_object_name", "relationship_type", "to_object_name"],
    idColumns: ["record_id", "source_row_id", "evidence_id"],
  },
  "12b_interview_initiative_metric_crosswalk.csv": {
    entityType: "interview_crosswalk",
    nameColumn: "interview_mention_text",
    idCompositeColumns: ["mention_field", "canonical_object_type", "interview_mention_text"],
    idColumns: [],
  },
  "13_evidence_sources.csv": { entityType: "evidence_source", nameColumns: ["context_item", "evidence_id"], idColumns: ["original_row_id", "evidence_id"] },
  "14_metrics_outcomes.csv": { entityType: "metric", nameColumn: "metric_name", idColumns: ["original_row_id"] },
  "15_industry_context_patterns.csv": { entityType: "industry_pattern", nameColumn: "pattern_name", idColumns: ["original_row_id"] },
  "16_expert_lenses.csv": { entityType: "expert_lens", nameColumn: "lens_name", idColumns: ["original_row_id"] },
  "17_service_scope_managed_services.csv": { entityType: "service_scope", nameColumn: "service_name", idColumns: ["original_row_id"] },
  "18_operational_process_evidence.csv": { entityType: "business_process", nameColumn: "process_name", idColumns: ["original_row_id"] },
  "19_data_analytics_platform_maturity.csv": { entityType: "analytics_maturity", nameColumns: ["platform_or_capability", "maturity_dimension"], idColumns: ["original_row_id"] },
  "20_itsm_ticket_sla_performance.csv": { entityType: "service_performance_observation", nameColumn: "system_name", idColumns: ["servicenow_ci_sys_id"] },
  "SA08_AI_Benefits_Realization_Usage_Ledger.csv": { entityType: "ai_benefit_record", nameColumn: "program_name", idColumns: ["source_record_id", "evidence_id"] },
  "SA09_AI_Tool_Usage_Feed.csv": { entityType: "ai_tool_usage", nameColumn: "tool_name", idColumns: ["source_record_id", "evidence_id"] },
  "SA10_AI_Value_Interview_Evidence.csv": { entityType: "interview_evidence", nameColumn: "question", idColumns: ["source_record_id", "evidence_id"] },
  "SA11_AI_KPI_Operational_Outcome_Feed.csv": { entityType: "kpi_outcome", nameColumns: ["kpi_name", "ai_use_case_id"], idColumns: ["source_record_id", "evidence_id"] },
});

function sourceIdentityFor(source) {
  const sourceName = source.sourceName ?? source.source_name ?? "";
  const identity = SOURCE_IDENTITY_MAP[sourceName];
  if (!identity) {
    throw new KnowledgeProcessError("source_identity_mapping_missing", `No source identity mapping declared for ${sourceName}.`, {
      sourceName,
      sourceRef: source.sourceRef,
      sourceVersionRef: source.sourceVersionRef,
    });
  }
  return identity;
}

function displayNameFromRow(source, row, identity) {
  if (Array.isArray(identity.nameColumns) && identity.nameColumns.length) {
    const values = identity.nameColumns.map((column) => String(row[column] ?? "").trim());
    const missingIndex = values.findIndex((value) => !value);
    if (missingIndex === -1) return values.join(" | ");
    throw new KnowledgeProcessError("source_name_column_missing", `Source row is missing declared name column ${identity.nameColumns[missingIndex]}.`, {
      sourceName: source.sourceName ?? source.source_name ?? "",
      sourceVersionRef: source.sourceVersionRef,
      nameColumn: identity.nameColumns[missingIndex],
      nameColumns: identity.nameColumns,
    });
  }
  const value = row[identity.nameColumn];
  if (String(value ?? "").trim()) return String(value).trim();
  throw new KnowledgeProcessError("source_name_column_missing", `Source row is missing declared name column ${identity.nameColumn}.`, {
    sourceName: source.sourceName ?? source.source_name ?? "",
    sourceVersionRef: source.sourceVersionRef,
    nameColumn: identity.nameColumn,
  });
}

function objectIdFromRow(row, identity, fallback) {
  if (Array.isArray(identity.idCompositeColumns) && identity.idCompositeColumns.length) {
    const values = identity.idCompositeColumns.map((column) => String(row[column] ?? "").trim());
    if (values.every(Boolean)) return values.join("|");
    throw new KnowledgeProcessError("source_identity_column_missing", `Source row is missing a declared identity column.`, {
      idCompositeColumns: identity.idCompositeColumns,
      missingColumns: identity.idCompositeColumns.filter((column) => !String(row[column] ?? "").trim()),
    });
  }
  const preferred = [
    ...(identity.idColumns ?? []),
    "original_row_id",
    "source_record_id",
  ];
  for (const key of preferred) {
    if (String(row[key] ?? "").trim()) return String(row[key]).trim();
  }
  return fallback;
}

function naturalKeyFromRow(entityType, row, objectId) {
  const naturalPart = row.original_row_id || row.source_record_id || objectId;
  return `${entityType}:${normalizeKey(naturalPart)}`;
}

function entityTypeForSource(identity) {
  return identity.entityType;
}

function relationshipCandidateFromRow(source, row, sourceRowRef, evidenceRef) {
  const fromRef = row.from_source_native_id || row.from_object_id || row.from_application_id || row.process_id;
  const toRef = row.to_source_native_id || row.to_object_id || row.to_application_id || row.data_dependency || row.system_dependency;
  const relationshipTypeRef = normalizeKey(row.relationship_type || (row.from_application_id && row.to_application_id ? "integrates_with" : ""));
  if (!fromRef || !toRef || !relationshipTypeRef) return null;
  return {
    candidateRef: `relcand:${source.sourceVersionRef}:${sourceRowRef}`,
    sourceVersionRef: source.sourceVersionRef,
    fromCandidateRef: String(fromRef),
    toCandidateRef: String(toRef),
    fromRef: String(fromRef),
    toRef: String(toRef),
    relationshipTypeRef,
    currentTargetState: ["current", "target", "current_and_target", "unknown"].includes(row.current_target_state)
      ? row.current_target_state
      : "unknown",
    evidenceRefs: [evidenceRef],
    confidence: 0.72,
  };
}

async function parseSourceRows(source) {
  if (Array.isArray(source.rows)) return source.rows;
  if (source.contentText) return parseTextRows(source.contentText, source.sourceName);
  if (source.contentBuffer) return parseBufferRows(source.contentBuffer, source.sourceName);
  throw new KnowledgeProcessError("source_content_unavailable", `Source content unavailable for ${source.sourceRef}.`, {
    sourceRef: source.sourceRef,
    sourceUri: source.sourceUri,
  });
}

async function parseBufferRows(buffer, sourceName = "") {
  if (/\.xlsx$/i.test(sourceName)) {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const rows = [];
    workbook.eachSheet((sheet) => {
      const header = [];
      sheet.eachRow((row, rowNumber) => {
        const values = row.values.slice(1).map((value) => String(value ?? "").trim());
        if (rowNumber === 1) {
          header.push(...values.map(normalizeKey));
          return;
        }
        if (!values.some(Boolean)) return;
        const obj = {};
        header.forEach((key, index) => {
          obj[key || `column_${index + 1}`] = values[index] ?? "";
        });
        obj.__sheet = sheet.name;
        rows.push(obj);
      });
    });
    return rows;
  }
  return parseTextRows(Buffer.from(buffer).toString("utf8"), sourceName);
}

async function parseTextRows(text, sourceName = "") {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) return [];
  if (/\.jsonl$/i.test(sourceName)) {
    return trimmed.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  }
  if (/\.json$/i.test(sourceName)) {
    const value = JSON.parse(trimmed);
    return Array.isArray(value) ? value : [value];
  }
  if (/\.csv$/i.test(sourceName)) {
    return parseCsvRows(trimmed);
  }
  return [{ text: trimmed }];
}

function parseCsvRows(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  const [headerRow, ...dataRows] = rows;
  if (!headerRow?.length) return [];
  const headers = headerRow.map(normalizeKey);
  return dataRows.map((values) => {
    const obj = {};
    headers.forEach((key, index) => {
      obj[key || `column_${index + 1}`] = values[index] ?? "";
    });
    return obj;
  });
}

function buildCandidatesForParsedRows(parsedSources) {
  const evidenceRecords = [];
  const entityCandidates = [];
  const factCandidates = [];
  const relationshipCandidates = [];

  for (const source of parsedSources) {
    source.rows.forEach((row, index) => {
      const sourceRowRef = `${source.sourceRef || source.sourceVersionRef}:row:${index + 1}`;
      const identity = sourceIdentityFor(source);
      const objectId = objectIdFromRow(row, identity, sourceRowRef);
      const displayName = displayNameFromRow(source, row, identity);
      const entityType = entityTypeForSource(identity);
      const naturalKey = naturalKeyFromRow(entityType, row, objectId);
      const evidenceRef = `ev:${source.sourceVersionRef}:${index + 1}`;
      const candidateRef = `entcand:${source.sourceVersionRef}:${objectId}`;

      evidenceRecords.push({
        evidenceRef,
        sourceVersionRef: source.sourceVersionRef,
        citationLabel: `${source.sourceName ?? source.sourceRef} row ${index + 1}`,
        sourceRowRef,
        sourceObjectRef: objectId,
        evidenceText: stableJson(row).slice(0, 4000),
        evidenceHash: sha256Value({ sourceVersionRef: source.sourceVersionRef, row }),
        metadata: {
          sourceFamily: source.sourceFamily,
          parserContractRef: source.parserContractRef,
        },
      });
      entityCandidates.push({
        candidateRef,
        sourceVersionRef: source.sourceVersionRef,
        entityType,
        displayName,
        naturalKey,
        naturalKeyBasis: {
          sourceObjectRef: objectId,
          sourceRowRef,
          fields: identity.idColumns ?? [],
          compositeFields: identity.idCompositeColumns ?? [],
          nameColumn: identity.nameColumn ?? null,
          nameColumns: identity.nameColumns ?? [],
        },
        sourceRowRef,
        sourceObjectRef: objectId,
        originalRowId: row.original_row_id || row.source_record_id || objectId,
        evidenceRefs: [evidenceRef],
        confidence: 0.68,
        candidatePayload: {
          natural_key: naturalKey,
          source_native_id: objectId,
          source_row_ref: sourceRowRef,
          source_object_ref: objectId,
          original_row_id: row.original_row_id || row.source_record_id || objectId,
          display_name: displayName,
          source_family: source.sourceFamily,
          raw_row: row,
        },
        evidenceRefs: [evidenceRef],
      });
      factCandidates.push({
        candidateRef: `factcand:${source.sourceVersionRef}:${objectId}`,
        sourceVersionRef: source.sourceVersionRef,
        subjectCandidateRef: candidateRef,
        factType: `${entityType}_source_row`,
        factValue: {
          source_native_id: objectId,
          raw_row: row,
          availability_state: Object.values(row).some((value) => /withheld/i.test(String(value))) ? "withheld" : "available",
        },
        evidenceRefs: [evidenceRef],
        confidence: 0.68,
      });
      const rel = relationshipCandidateFromRow(source, row, `${index + 1}`, evidenceRef);
      if (rel) relationshipCandidates.push(rel);
    });
  }

  return { evidenceRecords, entityCandidates, factCandidates, relationshipCandidates };
}

function createSourceParseHandler() {
  const canonicalProcess = "source-parse-v1";
  const spec = PROCESS_ORDER[canonicalProcess];
  return {
    processName: canonicalProcess,
    async plan(context) {
      return planFor(context, spec);
    },
    async execute(context, plan, { store }) {
      assertStoreMethod(store, "listParserVisibleSources", canonicalProcess);
      assertStoreMethod(store, "writeParsedRecords", canonicalProcess);
      const sources = await store.listParserVisibleSources(context);
      const records = [];
      const blockers = [];
      for (const source of sources) {
        try {
          const rows = await parseSourceRows(source);
          records.push({
            ...source,
            rows,
            rowCount: rows.length,
            terminalState: rows.length ? "parsed" : "parsed_with_warnings",
            contentHash: sha256Value({ sourceVersionRef: source.sourceVersionRef, rows }),
            warnings: rows.length ? [] : ["source_had_no_rows"],
          });
        } catch (error) {
          records.push({
            ...source,
            rows: [],
            rowCount: 0,
            terminalState: "failed",
            contentHash: sha256Value({ sourceVersionRef: source.sourceVersionRef, error: error.message }),
            warnings: [error.code ?? "parse_failed"],
          });
          blockers.push(`parse_failed:${source.sourceRef}`);
        }
      }
      const summary = await store.writeParsedRecords(context, records);
      return createProcessResult({
        context,
        plan,
        status: resultStatusForBlockers(blockers),
        counts: { input: sources.length, output: summary.rowCount, quarantine: summary.failedCount },
        blockers,
        warnings: records.flatMap((record) => record.warnings ?? []),
        checkpoints: [
          checkpointFor(context, "parser-visible sources loaded", sources.length ? "passed" : "blocked", 1, sources.length),
          checkpointFor(context, "source terminal states recorded", blockers.length ? "blocked" : "passed", sources.length, records.length),
          checkpointFor(context, "no silent parser skips", blockers.length ? "blocked" : "passed", sources.length, records.filter((row) => row.terminalState !== "failed").length),
        ],
        lineage: { parserRegistry: "source_family+parser_contract_ref", parsedSourceCount: records.length },
      });
    },
    async verify(_context, result) {
      if (result.status !== "passed") return { passed: false, blockers: result.blockers };
      if (result.inputCount <= 0) return { passed: false, blockers: ["no_parser_visible_sources"] };
      return { passed: true, blockers: [] };
    },
  };
}

function createEvidenceExtractHandler() {
  const canonicalProcess = "evidence-extract-v1";
  const spec = PROCESS_ORDER[canonicalProcess];
  return {
    processName: canonicalProcess,
    async plan(context) {
      return planFor(context, spec);
    },
    async execute(context, plan, { store }) {
      for (const method of ["listParserVisibleSources", "writeEvidenceAndCandidates"]) {
        assertStoreMethod(store, method, canonicalProcess);
      }
      const sources = await store.listParserVisibleSources(context);
      const parsedSources = [];
      const blockers = [];
      for (const source of sources) {
        try {
          parsedSources.push({ ...source, rows: await parseSourceRows(source) });
        } catch {
          blockers.push(`evidence_source_not_parseable:${source.sourceRef}`);
        }
      }
      const candidates = buildCandidatesForParsedRows(parsedSources);
      const counts = await store.writeEvidenceAndCandidates(context, candidates);
      return createProcessResult({
        context,
        plan,
        status: resultStatusForBlockers(blockers),
        counts: {
          input: parsedSources.reduce((sum, source) => sum + source.rows.length, 0),
          output: counts.evidence + counts.entityCandidates + counts.factCandidates + counts.relationshipCandidates,
          accepted: 0,
          quarantine: blockers.length,
        },
        blockers,
        checkpoints: [
          checkpointFor(context, "evidence lineage created", counts.evidence ? "passed" : "blocked", 1, counts.evidence),
          checkpointFor(context, "candidate entities created", counts.entityCandidates ? "passed" : "blocked", 1, counts.entityCandidates),
          checkpointFor(context, "candidate facts created", counts.factCandidates ? "passed" : "blocked", 1, counts.factCandidates),
          checkpointFor(context, "candidate relationships are evidence-backed when present", "passed", counts.relationshipCandidates, counts.relationshipCandidates),
        ],
        lineage: { evidence: "evidence.evidence_item", candidates: ["working.entity_candidate", "working.fact_candidate", "working.relationship_candidate"] },
      });
    },
    async verify(_context, result) {
      if (result.status !== "passed") return { passed: false, blockers: result.blockers };
      if (result.outputCount <= 0) return { passed: false, blockers: ["no_evidence_or_candidates_created"] };
      return { passed: true, blockers: [] };
    },
  };
}

function createStoreOperationHandler(canonicalProcess, method, checkpointName, verifyResult) {
  const spec = PROCESS_ORDER[canonicalProcess];
  return {
    processName: canonicalProcess,
    async plan(context) {
      const adapter = adapterFor(context);
      if (adapter?.plan) return adapter.plan(context);
      return planFor(context, spec);
    },
    async execute(context, plan, runtime) {
      const adapter = adapterFor(context);
      if (!adapter?.execute) {
        assertStoreMethod(runtime.store, method, canonicalProcess);
        const op = await runtime.store[method](context, plan, runtime);
        const blockers = verifyResult(op, context);
        const output = Object.values(op).filter((value) => typeof value === "number").reduce((sum, value) => sum + value, 0);
        return createProcessResult({
          context,
          plan,
          status: resultStatusForBlockers(blockers),
          counts: {
            input: op.input ?? op.inputCount ?? 0,
            output: op.output ?? op.outputCount ?? output,
            accepted: op.accepted ?? op.knowledgeEntities ?? op.entityCount ?? 0,
            rejected: op.rejected ?? 0,
            quarantine: op.quarantine ?? op.unresolved ?? 0,
            conflict: op.conflicts ?? op.conflicted ?? 0,
          },
          blockers,
          checkpoints: [checkpointFor(context, checkpointName, blockers.length ? "blocked" : "passed", 1, blockers.length ? 0 : 1, op)],
          lineage: { storeOperation: method, outputs: spec.outputs },
        });
      }
      return adapter.execute(context, plan, runtime);
    },
    async verify(_context, result) {
      if (result.status !== "passed") {
        return { passed: false, blockers: result.blockers ?? [`${canonicalProcess}:not_passed`] };
      }
      if (!result.checkpoints?.length) {
        return { passed: false, blockers: [`${canonicalProcess}:missing_checkpoint`] };
      }
      return { passed: true, blockers: [] };
    },
  };
}

const GENERIC_STORE_OPERATIONS = Object.freeze({
  "knowledge-normalize-v1": ["normalizeCandidates", "candidate values normalized", (op) => (op.normalized > 0 ? [] : ["no_candidates_to_normalize"])],
  "entity-resolve-v1": ["resolveEntityCandidates", "canonical identity candidates resolved", (op) => (op.unresolved > 0 ? ["unresolved_required_entities"] : op.resolved > 0 ? [] : ["no_entity_candidates_to_resolve"])],
  "knowledge-validate-v1": [
    "validateKnowledgeCandidates",
    "semantic validation gates passed",
    (op) => {
      const blockers = [];
      if (op.crossTenantRecords > 0) blockers.push("cross_tenant_records");
      if (op.brokenRequiredRelationshipEndpoints > 0) blockers.push("broken_required_relationship_endpoints");
      if (op.hiddenTruthReferences > 0) blockers.push("hidden_truth_references");
      if (op.invalidRequiredIds > 0) blockers.push("invalid_required_ids");
      if (op.silentSourceSkips > 0) blockers.push("silent_source_skips");
      return blockers;
    },
  ],
  "knowledge-review-v1": ["applyReviewDecisions", "explicit review ledger applied", (op) => (op.accepted > 0 ? [] : ["no_explicit_accepted_review_decisions"])],
  "domain-publish-v1": ["publishDomain", "immutable domain publication created", (op) => (op.entityCount + op.factCount + op.relationshipCount > 0 ? [] : ["empty_domain_publication"])],
  "baseline-publish-v1": ["publishBaseline", "atomic active baseline pointer switched", (op) => (op.domainPublicationRefs?.length > 0 && op.isActive ? [] : ["mandatory_domain_publications_missing"])],
  "projection-build-v1": ["buildConsumptionProjections", "consumption projections built from active baseline", (op) => (op.rowCount > 0 ? [] : ["no_active_baseline_projection_rows"])],
  "home-readmodel-v1": ["verifyHomeReadModel", "Home read model projections verified", (op) => (op.enterpriseBriefRows + op.searchRows + op.relationshipRows > 0 ? [] : ["home_read_model_empty"])],
  "reconciliation-audit-v1": [
    "runReconciliationAudit",
    "evaluator reconciliation wrote audit-only results",
    (op) => {
      const blockers = [];
      if (op.mutatedKnowledge) blockers.push("evaluator_mutated_knowledge");
      if (!op.knowledgeBaselineRef) blockers.push("no_published_baseline_to_reconcile");
      for (const row of op.sourceCoverageBlockers ?? []) {
        blockers.push(`source_to_consumption_unpublished:${row.domainKey}`);
      }
      return blockers;
    },
  ],
  "metric-parity-v1": [
    "runMetricParityAudit",
    "Cube/Postgres metric parity wrote governed results",
    (op) => {
      const blockers = [];
      if (!op.knowledgeBaselineRef) blockers.push("no_published_baseline_for_metric_parity");
      if (op.failedCount > 0) blockers.push("metric_parity_failed");
      return blockers;
    },
  ],
});

function createSourceRegisterHandler() {
  const canonicalProcess = "source-register-v1";
  const spec = PROCESS_ORDER[canonicalProcess];
  return {
    processName: canonicalProcess,
    async plan(context) {
      return {
        ...planFor(context, spec),
        expectedSourceCount: Number(context.env.ABARVA_EXPECTED_SOURCE_COUNT || 48),
        expectedParserVisibleCount: Number(context.env.ABARVA_EXPECTED_PARSER_VISIBLE_SOURCE_COUNT || 25),
        expectedEvaluatorVisibleCount: Number(context.env.ABARVA_EXPECTED_EVALUATOR_VISIBLE_SOURCE_COUNT || 0),
      };
    },
    async execute(context, plan, { store }) {
      const summary = await store.sourceRegistrationSummary(context);
      if (!summary) {
        return createProcessResult({
          context,
          plan,
          status: "blocked",
          counts: { input: plan.expectedSourceCount, output: 0 },
          blockers: ["source_registry_summary_unavailable"],
          checkpoints: [
            checkpointFor(context, "source registry summary available", "blocked", 1, 0, {
              reason: "The store did not expose source_registry verification data.",
            }),
          ],
        });
      }

      const sourceCount = Number(summary.source_count ?? summary.sourceCount ?? 0);
      const parserVisibleCount = Number(summary.parser_visible_count ?? summary.parserVisibleCount ?? 0);
      const evaluatorVisibleCount = Number(summary.evaluator_visible_count ?? summary.evaluatorVisibleCount ?? 0);
      const nonBlobUriCount = Number(summary.non_blob_uri_count ?? summary.nonBlobUriCount ?? 0);
      const releaseScopedCount = Number(summary.release_scoped_count ?? summary.releaseScopedCount ?? sourceCount);
      const blockers = [];

      if (sourceCount !== plan.expectedSourceCount) blockers.push("operational_source_count_mismatch");
      if (parserVisibleCount !== plan.expectedParserVisibleCount) blockers.push("parser_visible_source_count_mismatch");
      if (evaluatorVisibleCount !== plan.expectedEvaluatorVisibleCount) blockers.push("evaluator_source_registry_leakage");
      if (nonBlobUriCount !== 0) blockers.push("non_blob_source_uri");
      if (releaseScopedCount !== plan.expectedSourceCount) blockers.push("release_scope_count_mismatch");

      return createProcessResult({
        context,
        plan,
        status: blockers.length ? "blocked" : "passed",
        counts: {
          input: plan.expectedSourceCount,
          output: sourceCount,
          accepted: parserVisibleCount,
          rejected: 0,
          quarantine: 0,
          conflict: 0,
        },
        blockers,
        checkpoints: [
          checkpointFor(context, "48 operational files registered", blockers.includes("operational_source_count_mismatch") ? "blocked" : "passed", plan.expectedSourceCount, sourceCount),
          checkpointFor(context, "25 parser-visible files eligible", blockers.includes("parser_visible_source_count_mismatch") ? "blocked" : "passed", plan.expectedParserVisibleCount, parserVisibleCount),
          checkpointFor(context, "evaluator truth absent from source registry", blockers.includes("evaluator_source_registry_leakage") ? "blocked" : "passed", plan.expectedEvaluatorVisibleCount, evaluatorVisibleCount),
          checkpointFor(context, "all registered sources are immutable blob-backed release members", blockers.length ? "blocked" : "passed", plan.expectedSourceCount, releaseScopedCount, {
            nonBlobUriCount,
          }),
        ],
        lineage: {
          sourceRegistry: "source_registry.source",
          sourceVersions: "source_registry.source_version",
          releaseId: context.releaseId,
        },
      });
    },
    async verify(_context, result) {
      if (result.status !== "passed") return { passed: false, blockers: result.blockers };
      if (result.outputCount !== result.inputCount) return { passed: false, blockers: ["source_register_output_count_mismatch"] };
      if (result.quarantineCount !== 0 || result.conflictCount !== 0) return { passed: false, blockers: ["source_register_unexpected_quarantine_or_conflict"] };
      return { passed: true, blockers: [] };
    },
  };
}

export function buildDefaultProcessHandlers() {
  return Object.fromEntries(
    Object.keys(PROCESS_ORDER).map((canonicalProcess) => {
      if (canonicalProcess === "source-register-v1") return [canonicalProcess, createSourceRegisterHandler()];
      if (canonicalProcess === "source-parse-v1") return [canonicalProcess, createSourceParseHandler()];
      if (canonicalProcess === "evidence-extract-v1") return [canonicalProcess, createEvidenceExtractHandler()];
      const operation = GENERIC_STORE_OPERATIONS[canonicalProcess];
      if (operation) {
        return [canonicalProcess, createStoreOperationHandler(canonicalProcess, operation[0], operation[1], operation[2])];
      }
      return [canonicalProcess, createStoreOperationHandler(canonicalProcess, "runKnowledgeBackfill", "approved replay backfill executed", () => ["backfill_adapter_required"])];
    }),
  );
}

export const DEFAULT_PROCESS_HANDLERS = Object.freeze(buildDefaultProcessHandlers());

export function resolveProcessHandler(canonicalProcess, handlers = DEFAULT_PROCESS_HANDLERS) {
  return handlers[canonicalProcess] ?? null;
}
