#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  emitProofBundle,
  foundationPostgresClientOptions,
  proofRef,
  sha256,
  stableJson,
  writeCsv,
  writeJson,
} from "./golden-slice-support.mjs";

const DATABASE_SCHEMA = "foundation_v2_meridian_health_demo";
const TENANT_KEY = "meridian_health_global";
const TEST_NAMESPACE = "meridian-health-source-volume-v1";
const SOURCE_RELEASE_ID = "meridian-health-source-v1-202608:source-volume-v1:447910ac3c16";
const FOUNDATION_RELEASE_ALIAS = "meridian-health-demo-phase-a-source-volume-v1";
const WRITER_ROLE = "foundation_v2_meridian_health_demo_writer";
const READER_ROLE = "foundation_v2_meridian_health_demo_reader";
const PROJECTION_VERSION = "meridian-health-layer4-consumption-projections-v1";
const PROJECTION_EXECUTION_ID = `${SOURCE_RELEASE_ID}:${PROJECTION_VERSION}`;
const EVENT_ID = "MERIDIAN-BPO-RFP-2026-001";
const EVENT_CONTEXT_SNAPSHOT_ID = `meridian-health:event-context:${EVENT_ID}:v1`;
const LAYER3_COUNTS = {
  canonical_entities: 439,
  canonical_observations: 47_941,
  canonical_relationships: 2_390,
  canonical_evidence_records: 16_000,
  event_native_records: 4_370,
  canonical_promotion_decisions: 54_967,
};
const REQUIRED_PROJECTIONS = [
  ["enterprise_context", "vendor_portfolio", "vendor"],
  ["doc", "contract_families_and_instruments", "contract_family"],
  ["source", "contract_scope", "contract_scope_edge"],
  ["tower", "spend_invoice_history", "vendor_contract_month"],
  ["tower", "workforce_rate_card_economics", "contract_role_location"],
  ["source", "sla_itsm_performance", "service_performance"],
  ["source", "service_credits", "service_credit"],
  ["enterprise_context", "applications_services_dependencies", "application"],
  ["governance", "renewal_exit_terms", "contract_family"],
  ["enterprise_context", "programs_modernization_dependencies", "program"],
  ["tower", "enterprise_outcomes", "enterprise_outcome"],
  ["sourcing_event", "bpo_baseline", "function_process"],
  ["sourcing_event", "supplier_proposals_bafo", "supplier"],
  ["sourcing_event", "rebadge_transition_commitments", "supplier_transition_commitment"],
  ["sourcing_event", "ai_automation_commitments", "automation_commitment"],
  ["sourcing_event", "retained_org_scenarios", "retained_org_scenario"],
  ["consumption", "normalized_tco_recommendation_inputs", "supplier_scenario"],
  ["governance", "event_context_snapshot", "sourcing_event_context"],
];

const args = parseArgs(process.argv.slice(2));

await main().catch((error) => {
  console.error(JSON.stringify({ status: "MERIDIAN_HEALTH_DEMO_LAYER4_PROJECTION_FAILED", error: error.message }, null, 2));
  process.exit(1);
});

async function main() {
  fs.mkdirSync(args.outDir, { recursive: true });
  if (args.mode === "self-test") {
    const result = manifest("MERIDIAN_HEALTH_DEMO_LAYER4_PROJECTION_SELF_TEST_PASSED", {
      mutation_executed: false,
      projection_version: PROJECTION_VERSION,
      required_projection_count: REQUIRED_PROJECTIONS.length,
      required_projections: REQUIRED_PROJECTIONS.map(([projection_namespace, projection_name, business_grain]) => ({
        projection_namespace,
        projection_name,
        business_grain,
      })),
      rule: "Layer 4 exposes typed business-grain projections; generic observations are not product-facing.",
    });
    writeJson(proofRef(args.outDir, "MERIDIAN_HEALTH_LAYER4_PROJECTION_SELF_TEST.json"), result);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const { Client } = await import("pg");
  const client = new Client(await foundationPostgresClientOptions("meridian-health-demo-layer4-projections"));
  await client.connect();
  try {
    if (args.mode === "preflight") {
      const result = await preflight(client);
      writeProofSet(args.outDir, result);
      console.log(JSON.stringify(result, null, 2));
      maybeEmitProofBundle();
      if (result.status !== "MERIDIAN_HEALTH_DEMO_LAYER4_PROJECTION_PREFLIGHT_PASSED") process.exitCode = 1;
      return;
    }
    if (args.mode === "verify") {
      const result = await verify(client);
      writeProofSet(args.outDir, result);
      console.log(JSON.stringify(result, null, 2));
      maybeEmitProofBundle();
      if (result.status !== "MERIDIAN_HEALTH_DEMO_LAYER4_PROJECTION_VERIFIED") process.exitCode = 1;
      return;
    }
    if (args.mode !== "apply") throw new Error(`Unsupported mode ${args.mode}`);
    const result = await apply(client);
    writeProofSet(args.outDir, result);
    console.log(JSON.stringify(result, null, 2));
    maybeEmitProofBundle();
    if (!["MERIDIAN_HEALTH_DEMO_LAYER4_PROJECTION_VERIFIED", "MERIDIAN_HEALTH_DEMO_LAYER4_PROJECTION_ALREADY_VERIFIED"].includes(result.status)) {
      process.exitCode = 1;
    }
  } finally {
    await client.end();
  }
}

function parseArgs(argv) {
  const parsed = {
    mode: process.env.MERIDIAN_HEALTH_LAYER4_PROJECTION_MODE || "preflight",
    outDir:
      process.env.MERIDIAN_HEALTH_LAYER4_PROJECTION_OUT_DIR ||
      path.join(os.tmpdir(), `meridian-health-demo-layer4-${new Date().toISOString().replace(/[:.]/g, "-")}`),
    emitProofBundle:
      process.env.EMIT_ACA_PROOF_BUNDLE === "true" ||
      process.env.MERIDIAN_HEALTH_LAYER4_PROJECTION_EMIT_PROOF_BUNDLE === "true",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };
    if (arg === "--mode") parsed.mode = next();
    else if (arg === "--out-dir") parsed.outDir = path.resolve(next());
    else if (arg === "--emit-proof-bundle") parsed.emitProofBundle = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!["self-test", "preflight", "apply", "verify"].includes(parsed.mode)) throw new Error(`Unsupported mode ${parsed.mode}`);
  return parsed;
}

async function preflight(client) {
  await client.query("BEGIN");
  try {
    await setContext(client, READER_ROLE);
    const schema = await schemaReadback(client);
    const layer3 = await layer3Counts(client);
    const existing = await projectionReadback(client);
    const exact = await layer4Exact(client, { schema, layer3, existing });
    await client.query("ROLLBACK");
    const ready = schema.defects.length === 0 && exact.layer3_ok && (existing.projection_rows === 0 || exact.ok);
    return manifest(ready ? "MERIDIAN_HEALTH_DEMO_LAYER4_PROJECTION_PREFLIGHT_PASSED" : "MERIDIAN_HEALTH_DEMO_LAYER4_PROJECTION_PREFLIGHT_FAILED", {
      mutation_executed: false,
      schema,
      layer3_counts: layer3,
      existing_projection_counts: existing,
      existing_exact_match: existing.projection_rows === 0 || exact.ok,
      defects: ready ? [] : [...schema.defects, ...exact.defects],
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

async function apply(client) {
  assertApplyApproved();
  const startedAt = new Date().toISOString();
  await client.query("BEGIN");
  try {
    progress("apply.begin", { execution_id: PROJECTION_EXECUTION_ID });
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`${DATABASE_SCHEMA}:${TENANT_KEY}:${TEST_NAMESPACE}:layer4-projections`]);
    await setContext(client, WRITER_ROLE);
    const schema = await schemaReadback(client);
    if (schema.defects.length > 0) throw new Error(`Layer 4 schema is not ready: ${schema.defects.join(", ")}`);
    const layer3 = await layer3Counts(client);
    if (!exactObject(layer3, LAYER3_COUNTS)) throw new Error(`Layer 3 counts are not exact for Layer 4: ${stableJson(layer3)}`);
    const existing = await projectionReadback(client);
    if (existing.projection_rows > 0) {
      const exact = await layer4Exact(client, { schema, layer3, existing });
      const forceRebuild = process.env.MERIDIAN_HEALTH_LAYER4_PROJECTION_FORCE_REBUILD === "true";
      if (exact.ok && !forceRebuild) {
        await client.query("ROLLBACK");
        return await verifiedManifest(client, "MERIDIAN_HEALTH_DEMO_LAYER4_PROJECTION_ALREADY_VERIFIED", {
          mutation_executed: false,
          started_at: startedAt,
          completed_at: new Date().toISOString(),
        });
      }
      progress("apply.repair_reset_layer4_rows", { existing_projection_counts: existing, existing_defects: exact.defects, force_rebuild: forceRebuild });
      await resetLayer4Rows(client);
    }
    progress("apply.source_payload_start");
    await createTempSourcePayload(client);
    progress("apply.source_payload_ready");
    const sourceRows = await sourcePayloadRows(client);
    const canonical = await canonicalBundle(client);
    const projectionSet = buildProjectionSet(sourceRows, canonical);
    assertProjectionSet(projectionSet);
    await insertEventContextSnapshot(client, projectionSet.eventContextSnapshot, layer3);
    progress("apply.event_context_snapshot_ready");
    for (const projection of projectionSet.projections) {
      await insertProjection(client, projection, layer3);
      progress("apply.projection_ready", { projection_name: projection.name, projection_rows: projection.rows.length });
    }
    const result = await verifiedManifest(client, "MERIDIAN_HEALTH_DEMO_LAYER4_PROJECTION_VERIFIED", {
      mutation_executed: true,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
    });
    assertManifestOk(result);
    await insertGateResults(client, result);
    await client.query("COMMIT");
    progress("apply.commit", { projection_counts: result.projection_counts });
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

async function verify(client) {
  await client.query("BEGIN");
  try {
    await setContext(client, READER_ROLE);
    const result = await verifiedManifest(client, "MERIDIAN_HEALTH_DEMO_LAYER4_PROJECTION_VERIFIED", {
      mutation_executed: false,
    });
    await client.query("ROLLBACK");
    if (!result.exact_match) result.status = "MERIDIAN_HEALTH_DEMO_LAYER4_PROJECTION_VERIFY_FAILED";
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

async function createTempSourcePayload(client) {
  await client.query(`
    CREATE TEMP TABLE meridian_health_l4_source_payload AS
    SELECT sr.source_record_id,
           sf.file_name,
           sfc.source_group,
           coalesce(sfc.event_id, '') AS event_id,
           jsonb_object_agg(sfv.source_field_name, coalesce(sfv.normalized_value, sfv.raw_value, '') ORDER BY sfv.source_field_name) AS payload
      FROM ${tableRef("source_records")} sr
      JOIN ${tableRef("source_files")} sf
        ON sf.source_file_id=sr.source_file_id
       AND sf.tenant_key=sr.tenant_key
       AND sf.test_namespace=sr.test_namespace
      JOIN ${tableRef("source_file_context")} sfc
        ON sfc.source_file_id=sf.source_file_id
       AND sfc.tenant_key=sf.tenant_key
       AND sfc.test_namespace=sf.test_namespace
      JOIN ${tableRef("source_field_values")} sfv
        ON sfv.source_record_id=sr.source_record_id
       AND sfv.tenant_key=sr.tenant_key
       AND sfv.test_namespace=sr.test_namespace
     WHERE sr.tenant_key=$1 AND sr.test_namespace=$2 AND sr.source_release_id=$3
     GROUP BY sr.source_record_id, sf.file_name, sfc.source_group, sfc.event_id
  `, [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID]);
  await client.query("CREATE INDEX ON meridian_health_l4_source_payload(file_name)");
  await client.query("CREATE INDEX ON meridian_health_l4_source_payload(source_record_id)");
}

async function sourcePayloadRows(client) {
  return rows(client, "SELECT source_record_id, file_name, source_group, event_id, payload FROM meridian_health_l4_source_payload ORDER BY file_name, source_record_id");
}

async function canonicalBundle(client) {
  const [entities, relationships, evidence] = await Promise.all([
    rows(client, `SELECT canonical_entity_id, canonical_entity_type, business_key, display_name, source_record_count, source_file_names, entity_payload FROM ${tableRef("canonical_entities")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3`, [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID]),
    rows(client, `SELECT canonical_relationship_id, source_record_id, relationship_type, source_entity_ref, target_entity_ref, relationship_state, relationship_payload FROM ${tableRef("canonical_relationships")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3`, [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID]),
    rows(client, `SELECT canonical_evidence_id, source_record_id, evidence_ref, document_ref, evidence_subject FROM ${tableRef("canonical_evidence_records")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3`, [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID]),
  ]);
  return { entities, relationships, evidence };
}

function buildProjectionSet(sourceRows, canonical) {
  const byFile = groupBy(sourceRows, (row) => row.file_name);
  const relsBySource = groupBy(canonical.relationships, (row) => row.source_record_id);
  const evidenceBySource = groupBy(canonical.evidence, (row) => row.source_record_id);
  const entityByTypeKey = new Map(canonical.entities.map((row) => [`${row.canonical_entity_type}\u0000${row.business_key}`, row]));
  const ctx = { byFile, relsBySource, evidenceBySource, entityByTypeKey };
  const projections = [
    buildVendorPortfolio(ctx),
    buildContractFamilies(ctx),
    buildContractScope(ctx),
    buildSpendInvoiceHistory(ctx),
    buildWorkforceRateEconomics(ctx),
    buildSlaItsmPerformance(ctx),
    buildServiceCredits(ctx),
    buildApplicationsServicesDependencies(ctx),
    buildRenewalExitTerms(ctx),
    buildProgramsModernizationDependencies(ctx),
    buildEnterpriseOutcomes(ctx),
    buildBpoBaseline(ctx),
    buildSupplierProposalsBafo(ctx),
    buildRebadgeTransitionCommitments(ctx),
    buildAiAutomationCommitments(ctx),
    buildRetainedOrgScenarios(ctx),
    buildNormalizedTcoRecommendationInputs(ctx),
  ];
  const eventContextSnapshot = buildEventContextSnapshot(ctx, projections, canonical);
  projections.push(buildEventContextProjection(ctx, eventContextSnapshot));
  return { projections, eventContextSnapshot };
}

function buildVendorPortfolio(ctx) {
  const suppliers = fileRows(ctx, "WORKDAY_SUPPLIERS.csv");
  const contractsByVendor = groupBy(fileRows(ctx, "CONTRACT_REGISTER.csv"), (row) => v(row, "vendor_id"));
  const servicesByVendor = groupBy(fileRows(ctx, "SERVICENOW_VENDOR_SERVICES.csv"), (row) => v(row, "vendor_id"));
  const invoicesByVendor = groupBy(fileRows(ctx, "WORKDAY_SUPPLIER_INVOICES.csv"), (row) => v(row, "vendor_id"));
  return projection("enterprise_context", "vendor_portfolio", "vendor", ["WORKDAY_SUPPLIERS.csv", "CONTRACT_REGISTER.csv", "SERVICENOW_VENDOR_SERVICES.csv", "WORKDAY_SUPPLIER_INVOICES.csv"], suppliers.map((row) => {
    const vendorId = v(row, "vendor_id");
    const invoiceRows = invoicesByVendor.get(vendorId) || [];
    return makeProjectionRow(ctx, "enterprise_context", "vendor_portfolio", "vendor", vendorId, {
      vendor_id: vendorId,
      legal_name: v(row, "legal_name"),
      supplier_category: v(row, "supplier_category"),
      risk_tier: v(row, "risk_tier"),
      status: v(row, "status"),
      contract_family_count: (contractsByVendor.get(vendorId) || []).length,
      supported_service_count: (servicesByVendor.get(vendorId) || []).length,
      invoice_line_count: invoiceRows.length,
      invoice_line_amount: sum(invoiceRows, "line_amount"),
    }, collectSources([row], contractsByVendor.get(vendorId), servicesByVendor.get(vendorId), invoiceRows.slice(0, 25)), [entity(ctx, "vendor", vendorId)]);
  }));
}

function buildContractFamilies(ctx) {
  const registers = fileRows(ctx, "CONTRACT_REGISTER.csv");
  const instrumentsByContract = groupBy(fileRows(ctx, "CONTRACT_INSTRUMENTS.csv"), (row) => v(row, "contract_family_id"));
  const amendmentsByContract = groupBy(fileRows(ctx, "CONTRACT_AMENDMENTS.csv"), (row) => v(row, "contract_family_id"));
  const slasByContract = groupBy(fileRows(ctx, "CONTRACT_SLA_TERMS.csv"), (row) => v(row, "contract_family_id"));
  return projection("doc", "contract_families_and_instruments", "contract_family", ["CONTRACT_REGISTER.csv", "CONTRACT_INSTRUMENTS.csv", "CONTRACT_AMENDMENTS.csv", "CONTRACT_SLA_TERMS.csv"], registers.map((row) => {
    const contractId = v(row, "contract_family_id");
    const instruments = (instrumentsByContract.get(contractId) || []).map((item) => pick(item, ["instrument_id", "instrument_type", "effective_date", "document_ref"]));
    return makeProjectionRow(ctx, "doc", "contract_families_and_instruments", "contract_family", contractId, {
      contract_family_id: contractId,
      contract_name: v(row, "contract_name"),
      vendor_id: v(row, "vendor_id"),
      synthetic_midpoint_total_contract_value: num(v(row, "synthetic_midpoint_total_contract_value")),
      evidence_tier: v(row, "evidence_tier"),
      renewal_window: v(row, "renewal_window"),
      instruments,
      amendment_count: (amendmentsByContract.get(contractId) || []).length,
      sla_term_count: (slasByContract.get(contractId) || []).length,
    }, collectSources([row], instrumentsByContract.get(contractId), amendmentsByContract.get(contractId), slasByContract.get(contractId)), [entity(ctx, "contract_family", contractId), entity(ctx, "vendor", v(row, "vendor_id"))]);
  }));
}

function buildContractScope(ctx) {
  const scopeRows = fileRows(ctx, "CONTRACT_SCOPE_RELATIONSHIPS.csv");
  return projection("source", "contract_scope", "contract_scope_edge", ["CONTRACT_SCOPE_RELATIONSHIPS.csv"], scopeRows.map((row) => {
    const key = v(row, "scope_relationship_id") || row.source_record_id;
    return makeProjectionRow(ctx, "source", "contract_scope", "contract_scope_edge", key, {
      scope_relationship_id: key,
      vendor_id: v(row, "vendor_id"),
      contract_family_id: v(row, "contract_family_id"),
      legal_instrument_id: v(row, "legal_instrument_id"),
      contracted_service_id: v(row, "contracted_service_id"),
      business_service_ref: v(row, "business_service_ref"),
      application_ref: v(row, "application_ref"),
      ci_ref: v(row, "ci_ref"),
      relationship_confidence: num(v(row, "relationship_confidence")),
    }, [row], [
      entity(ctx, "vendor", v(row, "vendor_id")),
      entity(ctx, "contract_family", v(row, "contract_family_id")),
      entity(ctx, "legal_instrument", v(row, "legal_instrument_id")),
      entity(ctx, "application", v(row, "application_ref")),
    ]);
  }));
}

function buildSpendInvoiceHistory(ctx) {
  const groups = aggregate(fileRows(ctx, "WORKDAY_SUPPLIER_INVOICES.csv"), (row) => [v(row, "vendor_id"), v(row, "contract_family_id"), month(v(row, "invoice_date"))].join("|"));
  return projection("tower", "spend_invoice_history", "vendor_contract_month", ["WORKDAY_SUPPLIER_INVOICES.csv", "WORKDAY_PAYMENTS.csv"], [...groups.values()].map((items) => {
    const first = items[0];
    const key = [v(first, "vendor_id"), v(first, "contract_family_id"), month(v(first, "invoice_date"))].join("|");
    return makeProjectionRow(ctx, "tower", "spend_invoice_history", "vendor_contract_month", key, {
      vendor_id: v(first, "vendor_id"),
      contract_family_id: v(first, "contract_family_id"),
      invoice_month: month(v(first, "invoice_date")),
      invoice_line_count: items.length,
      line_amount: sum(items, "line_amount"),
      rate_card_matched_lines: items.filter((row) => /match/i.test(v(row, "rate_card_match_state"))).length,
      cost_center_count: unique(items.map((row) => v(row, "cost_center_id"))).length,
      spend_category_count: unique(items.map((row) => v(row, "spend_category_id"))).length,
    }, items.slice(0, 50), [entity(ctx, "vendor", v(first, "vendor_id")), entity(ctx, "contract_family", v(first, "contract_family_id"))]);
  }));
}

function buildWorkforceRateEconomics(ctx) {
  const workforce = aggregate(fileRows(ctx, "VENDOR_WORKFORCE_MONTHLY.csv"), (row) => [v(row, "contract_family_id"), v(row, "role_title"), v(row, "location_model")].join("|"));
  const rates = groupBy(fileRows(ctx, "CONTRACT_RATE_CARDS.csv"), (row) => [v(row, "contract_family_id"), v(row, "role_title"), v(row, "location_model")].join("|"));
  const invoices = groupBy(fileRows(ctx, "VENDOR_RATE_CARD_INVOICES.csv"), (row) => v(row, "rate_card_id"));
  return projection("tower", "workforce_rate_card_economics", "contract_role_location", ["VENDOR_WORKFORCE_MONTHLY.csv", "CONTRACT_RATE_CARDS.csv", "VENDOR_RATE_CARD_INVOICES.csv"], [...workforce.entries()].map(([key, items]) => {
    const first = items[0];
    const rateRows = rates.get(key) || [];
    return makeProjectionRow(ctx, "tower", "workforce_rate_card_economics", "contract_role_location", key, {
      contract_family_id: v(first, "contract_family_id"),
      role_title: v(first, "role_title"),
      location_model: v(first, "location_model"),
      workforce_month_count: items.length,
      billed_fte: sum(items, "billed_fte"),
      average_contracted_mix_pct: avg(items, "contracted_mix_pct"),
      average_billed_mix_pct: avg(items, "billed_mix_pct"),
      contracted_rate_cards: rateRows.map((row) => ({
        rate_card_id: v(row, "rate_card_id"),
        contracted_rate: num(v(row, "contracted_rate")),
        billed_rate_observed: num(v(row, "billed_rate_observed")),
        invoice_line_count: (invoices.get(v(row, "rate_card_id")) || []).length,
      })),
    }, collectSources(items.slice(0, 50), rateRows), [entity(ctx, "contract_family", v(first, "contract_family_id"))]);
  }));
}

function buildSlaItsmPerformance(ctx) {
  const groups = aggregate(fileRows(ctx, "SERVICENOW_MONTHLY_ITSM_SUMMARY.csv"), (row) => [v(row, "vendor_id"), v(row, "contract_id"), v(row, "service_ref"), v(row, "application_ref"), v(row, "service_tower")].join("|"));
  const slaRows = groupBy(fileRows(ctx, "SERVICENOW_MONTHLY_SLA_SUMMARY.csv"), (row) => [v(row, "vendor_id"), v(row, "contract_id"), v(row, "service_ref")].join("|"));
  return projection("source", "sla_itsm_performance", "service_performance", ["SERVICENOW_MONTHLY_ITSM_SUMMARY.csv", "SERVICENOW_MONTHLY_SLA_SUMMARY.csv"], [...groups.values()].map((items) => {
    const first = items[0];
    const sla = slaRows.get([v(first, "vendor_id"), v(first, "contract_id"), v(first, "service_ref")].join("|")) || [];
    const key = [v(first, "vendor_id"), v(first, "contract_id"), v(first, "service_ref"), v(first, "application_ref"), v(first, "service_tower")].join("|");
    return makeProjectionRow(ctx, "source", "sla_itsm_performance", "service_performance", key, {
      vendor_id: v(first, "vendor_id"),
      contract_id: v(first, "contract_id"),
      service_ref: v(first, "service_ref"),
      business_service_ref: v(first, "business_service_ref"),
      application_ref: v(first, "application_ref"),
      service_tower: v(first, "service_tower"),
      period_count: items.length,
      tickets_opened: sum(items, "tickets_opened"),
      p1_count: sum(items, "p1_count"),
      p2_count: sum(items, "p2_count"),
      sla_breach_count: sum(items, "sla_breach_count") + sum(sla, "breach_count"),
      average_response_sla_pct: avg(items, "response_sla_pct"),
      average_resolution_sla_pct: avg(items, "resolution_sla_pct"),
      average_availability_pct: avg(items, "availability_pct"),
      service_credit_eligible_amount: sum(items, "service_credit_eligible_amount"),
      service_credit_claimed_amount: sum(items, "service_credit_claimed_amount"),
    }, collectSources(items.slice(0, 50), sla.slice(0, 25)), [entity(ctx, "vendor", v(first, "vendor_id")), entity(ctx, "contract_family", v(first, "contract_id")), entity(ctx, "application", v(first, "application_ref"))]);
  }));
}

function buildServiceCredits(ctx) {
  return projection("source", "service_credits", "service_credit", ["SERVICENOW_SERVICE_CREDITS.csv"], fileRows(ctx, "SERVICENOW_SERVICE_CREDITS.csv").map((row) => {
    const key = v(row, "service_credit_id") || row.source_record_id;
    return makeProjectionRow(ctx, "source", "service_credits", "service_credit", key, {
      service_credit_id: key,
      contract_id: v(row, "contract_id"),
      service_ref: v(row, "service_ref"),
      eligible_amount: num(v(row, "eligible_amount")),
      claimed_amount: num(v(row, "claimed_amount")),
      claim_state: v(row, "claim_state"),
    }, [row], [entity(ctx, "contract_family", v(row, "contract_id"))]);
  }));
}

function buildApplicationsServicesDependencies(ctx) {
  const apps = fileRows(ctx, "SERVICENOW_CMDB_APPLICATIONS.csv");
  const servicesByApp = groupBy(fileRows(ctx, "SERVICENOW_CSDM_BUSINESS_SERVICES.csv"), (row) => v(row, "application_id"));
  const epicByApp = groupBy(fileRows(ctx, "EPIC_INTERFACE_INVENTORY.csv"), (row) => v(row, "application_id"));
  const analyticsBySource = groupBy(fileRows(ctx, "ANALYTICS_PLATFORM_DEPENDENCIES.csv"), (row) => v(row, "source_ref"));
  return projection("enterprise_context", "applications_services_dependencies", "application", ["SERVICENOW_CMDB_APPLICATIONS.csv", "SERVICENOW_CSDM_BUSINESS_SERVICES.csv", "EPIC_INTERFACE_INVENTORY.csv", "ANALYTICS_PLATFORM_DEPENDENCIES.csv"], apps.map((row) => {
    const appId = v(row, "application_id");
    const serviceRows = servicesByApp.get(appId) || [];
    const epicRows = epicByApp.get(appId) || [];
    const depRows = analyticsBySource.get(appId) || [];
    return makeProjectionRow(ctx, "enterprise_context", "applications_services_dependencies", "application", appId, {
      application_id: appId,
      application_name: v(row, "application_name"),
      owner_function: v(row, "owner_function"),
      lifecycle: v(row, "lifecycle"),
      criticality: v(row, "criticality"),
      business_service_refs: unique(serviceRows.map((item) => v(item, "business_service_ref"))),
      epic_interface_count: epicRows.length,
      analytics_dependency_count: depRows.length,
      dependency_targets: unique(depRows.map((item) => v(item, "target_ref"))),
    }, collectSources([row], serviceRows, epicRows, depRows), [entity(ctx, "application", appId)]);
  }));
}

function buildRenewalExitTerms(ctx) {
  const registerByContract = new Map(fileRows(ctx, "CONTRACT_REGISTER.csv").map((row) => [v(row, "contract_family_id"), row]));
  const groups = groupBy(fileRows(ctx, "CONTRACT_RENEWAL_EXIT_TERMS.csv"), (row) => v(row, "contract_family_id"));
  return projection("governance", "renewal_exit_terms", "contract_family", ["CONTRACT_RENEWAL_EXIT_TERMS.csv", "CONTRACT_REGISTER.csv"], [...groups.entries()].map(([contractId, items]) => makeProjectionRow(ctx, "governance", "renewal_exit_terms", "contract_family", contractId, {
    contract_family_id: contractId,
    renewal_window: v(registerByContract.get(contractId), "renewal_window"),
    clauses: items.map((row) => pick(row, ["clause_id", "clause_type", "extracted_state"])),
  }, collectSources([registerByContract.get(contractId)].filter(Boolean), items), [entity(ctx, "contract_family", contractId)])));
}

function buildProgramsModernizationDependencies(ctx) {
  const groups = groupBy(fileRows(ctx, "PROGRAMS_INITIATIVES_DEPENDENCIES.csv"), (row) => v(row, "program_ref"));
  return projection("enterprise_context", "programs_modernization_dependencies", "program", ["PROGRAMS_INITIATIVES_DEPENDENCIES.csv"], [...groups.entries()].map(([programRef, items]) => makeProjectionRow(ctx, "enterprise_context", "programs_modernization_dependencies", "program", programRef, {
    program_ref: programRef,
    source_dependency_rows: items.length,
    canonical_initiative_concepts: unique(items.map((row) => v(row, "dependency_ref"))),
    target_quarters: unique(items.map((row) => v(row, "target_quarter"))),
    dependencies: items.map((row) => ({
      program_dependency_id: v(row, "program_dependency_id"),
      source_initiative_ref: v(row, "initiative_ref"),
      dependency_ref: v(row, "dependency_ref"),
      canonical_initiative_key: `initiative_concept:${slug(v(row, "dependency_ref"))}`,
      target_quarter: v(row, "target_quarter"),
    })),
  }, items, [entity(ctx, "program", programRef), ...unique(items.map((row) => v(row, "dependency_ref"))).map((name) => entity(ctx, "initiative", `initiative_concept:${slug(name)}`))])));
}

function buildEnterpriseOutcomes(ctx) {
  return projection("tower", "enterprise_outcomes", "enterprise_outcome", ["HEALTH_PLAN_OUTCOME_SNAPSHOT.csv"], fileRows(ctx, "HEALTH_PLAN_OUTCOME_SNAPSHOT.csv").map((row) => {
    const key = v(row, "health_plan_outcome_snapshot_id") || v(row, "outcome_name");
    return makeProjectionRow(ctx, "tower", "enterprise_outcomes", "enterprise_outcome", key, pick(row, [
      "health_plan_outcome_snapshot_id", "outcome_name", "outcome_category", "current_value_optional",
      "target_value_optional", "trend_state", "measurement_period", "data_owner_role",
      "evidence_status", "attestation_status", "decision_linkage", "sensitivity_classification", "source_grain",
    ]), [row], [entity(ctx, "outcome", key), entity(ctx, "outcome", v(row, "outcome_name"))]);
  }));
}

function buildBpoBaseline(ctx) {
  const processRows = fileRows(ctx, "BPO_CURRENT_STATE_PROCESS_VOLUMES.csv");
  const costsByFunction = groupBy(fileRows(ctx, "BPO_CURRENT_STATE_COST_BASELINE.csv"), (row) => v(row, "function_ref"));
  const workforceByFunction = groupBy(fileRows(ctx, "BPO_CURRENT_STATE_WORKFORCE.csv"), (row) => v(row, "function_ref"));
  const baselineHorizonYears = 5;
  const processCountByFunction = new Map();
  for (const row of processRows) {
    const functionRef = v(row, "function_ref");
    processCountByFunction.set(functionRef, (processCountByFunction.get(functionRef) || 0) + 1);
  }
  return projection("sourcing_event", "bpo_baseline", "function_process", ["BPO_CURRENT_STATE_PROCESS_VOLUMES.csv", "BPO_CURRENT_STATE_COST_BASELINE.csv", "BPO_CURRENT_STATE_WORKFORCE.csv"], processRows.map((row) => {
    const functionRef = v(row, "function_ref");
    const key = [functionRef, v(row, "process_name")].join("|");
    const costs = costsByFunction.get(functionRef) || [];
    const workforce = workforceByFunction.get(functionRef) || [];
    const processCount = Math.max(processCountByFunction.get(functionRef) || 1, 1);
    const functionLaborCost = sum(costs, "labor_cost");
    const functionTechnologyCost = sum(costs, "technology_cost");
    const functionControlsCost = sum(costs, "controls_cost");
    const functionFiveYearBaselineCost = functionLaborCost + functionTechnologyCost + functionControlsCost;
    const functionResourceCount = sum(workforce, "resource_count");
    const allocatedLaborCost = round(functionLaborCost / processCount, 2);
    const allocatedTechnologyCost = round(functionTechnologyCost / processCount, 2);
    const allocatedControlsCost = round(functionControlsCost / processCount, 2);
    const allocatedFiveYearBaselineCost = round(functionFiveYearBaselineCost / processCount, 2);
    return makeProjectionRow(ctx, "sourcing_event", "bpo_baseline", "function_process", key, {
      event_id: EVENT_ID,
      function_ref: functionRef,
      process_name: v(row, "process_name"),
      monthly_volume: num(v(row, "monthly_volume")),
      current_sla: v(row, "current_sla"),
      automation_opportunity: v(row, "automation_opportunity"),
      baseline_cost_time_horizon: "five_year",
      baseline_cost_horizon_years: baselineHorizonYears,
      baseline_labor_cost: allocatedLaborCost,
      baseline_technology_cost: allocatedTechnologyCost,
      baseline_controls_cost: allocatedControlsCost,
      five_year_current_state_baseline_cost: allocatedFiveYearBaselineCost,
      annualized_current_state_cost: round(allocatedFiveYearBaselineCost / baselineHorizonYears, 2),
      five_year_labor_cost: allocatedLaborCost,
      five_year_technology_platform_cost: allocatedTechnologyCost,
      five_year_controls_or_other_cost: allocatedControlsCost,
      current_resource_count: round(functionResourceCount / processCount, 4),
      function_total_labor_cost: functionLaborCost,
      function_total_technology_cost: functionTechnologyCost,
      function_total_controls_cost: functionControlsCost,
      function_five_year_current_state_baseline_cost: functionFiveYearBaselineCost,
      function_annualized_current_state_cost: round(functionFiveYearBaselineCost / baselineHorizonYears, 2),
      function_total_resource_count: functionResourceCount,
      function_process_row_count: processCount,
      additive_measure_policy: "allocated_function_total_to_process_grain",
    }, collectSources([row], costs, workforce), [], EVENT_CONTEXT_SNAPSHOT_ID);
  }));
}

function buildSupplierProposalsBafo(ctx) {
  const suppliers = fileRows(ctx, "BPO_SUPPLIERS.csv");
  const responses = groupBy(fileRows(ctx, "BPO_SUPPLIER_RESPONSES.csv"), (row) => v(row, "supplier_id"));
  const bafo = groupBy(fileRows(ctx, "BPO_BAFO_RESPONSES.csv"), (row) => v(row, "supplier_id"));
  const scores = groupBy(fileRows(ctx, "BPO_EVALUATION_SCORES.csv"), (row) => v(row, "supplier_id"));
  const commercial = groupBy(fileRows(ctx, "BPO_COMMERCIAL_LINES.csv"), (row) => v(row, "supplier_id"));
  return projection("sourcing_event", "supplier_proposals_bafo", "supplier", ["BPO_SUPPLIERS.csv", "BPO_SUPPLIER_RESPONSES.csv", "BPO_BAFO_RESPONSES.csv", "BPO_EVALUATION_SCORES.csv", "BPO_COMMERCIAL_LINES.csv"], suppliers.map((row) => {
    const supplierId = v(row, "supplier_id");
    const supplierScores = scores.get(supplierId) || [];
    const supplierCommercial = commercial.get(supplierId) || [];
    return makeProjectionRow(ctx, "sourcing_event", "supplier_proposals_bafo", "supplier", supplierId, {
      event_id: EVENT_ID,
      supplier_id: supplierId,
      invitation_state: v(row, "invitation_state"),
      headline_price_rank: num(v(row, "headline_price_rank")),
      normalized_recommendation_rank: num(v(row, "normalized_recommendation_rank")),
      response_count: (responses.get(supplierId) || []).length,
      bafo_count: (bafo.get(supplierId) || []).length,
      evaluation_weighted_score: sum(supplierScores, "weighted_score"),
      five_year_service_fee: sum(supplierCommercial, "service_fee"),
      transition_cost: sum(supplierCommercial, "transition_cost"),
      risk_adjustment: sum(supplierCommercial, "risk_adjustment"),
    }, collectSources([row], responses.get(supplierId), bafo.get(supplierId), supplierScores, supplierCommercial), [entity(ctx, "bpo_supplier", supplierId)], EVENT_CONTEXT_SNAPSHOT_ID);
  }));
}

function buildRebadgeTransitionCommitments(ctx) {
  const rebadge = fileRows(ctx, "BPO_REBADGE_RETENTION_PLAN.csv");
  const ktBySupplierProcess = groupBy(fileRows(ctx, "BPO_TRANSITION_KNOWLEDGE_TRANSFER_PLAN.csv"), (row) => [v(row, "supplier_id"), v(row, "function_ref"), v(row, "process_name")].join("|"));
  const eligibleUniqueWorkforce = bpoEligibleUniqueCurrentWorkforce(ctx);
  const rowsBySupplier = groupBy(rebadge, (row) => v(row, "supplier_id"));
  const supplierProposedCounts = new Map();
  for (const [supplierId, supplierRows] of rowsBySupplier.entries()) {
    supplierProposedCounts.set(supplierId, supplierRebadgeCount(supplierId, eligibleUniqueWorkforce, supplierRows));
  }
  return projection("sourcing_event", "rebadge_transition_commitments", "supplier_transition_commitment", ["BPO_REBADGE_RETENTION_PLAN.csv", "BPO_TRANSITION_KNOWLEDGE_TRANSFER_PLAN.csv"], rebadge.map((row) => {
    const key = [v(row, "supplier_id"), v(row, "function_ref"), v(row, "process_name"), v(row, "employee_cohort")].join("|");
    const ktRows = ktBySupplierProcess.get([v(row, "supplier_id"), v(row, "function_ref"), v(row, "process_name")].join("|")) || [];
    const supplierId = v(row, "supplier_id");
    const supplierRows = rowsBySupplier.get(supplierId) || [];
    const sourceSupplierProposedCount = sum(supplierRows, "number_proposed_for_rebadge");
    const normalizedSupplierProposedCount = supplierProposedCounts.get(supplierId) || 0;
    const rowShare = sourceSupplierProposedCount > 0 ? num(v(row, "number_proposed_for_rebadge")) / sourceSupplierProposedCount : 1 / Math.max(supplierRows.length, 1);
    return makeProjectionRow(ctx, "sourcing_event", "rebadge_transition_commitments", "supplier_transition_commitment", key, {
      event_id: EVENT_ID,
      supplier_id: supplierId,
      function_ref: v(row, "function_ref"),
      process_name: v(row, "process_name"),
      employee_cohort: v(row, "employee_cohort"),
      source_workforce_cohort_count: num(v(row, "source_workforce_cohort_count")),
      source_proposed_rebadge_count: num(v(row, "number_proposed_for_rebadge")),
      eligible_unique_current_workforce_count: eligibleUniqueWorkforce,
      rebadge_denominator_policy: "unique_current_people_or_positions_in_bpo_scope",
      rebadge_strategy: supplierRebadgeStrategy(supplierId),
      number_proposed_for_rebadge: round(normalizedSupplierProposedCount * rowShare, 4),
      normalized_supplier_proposed_rebadge_count: normalizedSupplierProposedCount,
      retention_commitment_months: num(v(row, "retention_commitment_months")),
      knowledge_critical_designation: v(row, "knowledge_critical_designation"),
      contractual_or_proposed_status: v(row, "contractual_or_proposed_status"),
      kt_plan_count: ktRows.length,
      continuity_risks: unique(ktRows.map((item) => v(item, "service_continuity_risk"))),
    }, collectSources([row], ktRows), [entity(ctx, "bpo_supplier", supplierId)], EVENT_CONTEXT_SNAPSHOT_ID);
  }));
}

function bpoEligibleUniqueCurrentWorkforce(ctx) {
  const workforce = fileRows(ctx, "BPO_CURRENT_STATE_WORKFORCE.csv");
  return round(sum(workforce, "resource_count"), 4);
}

function supplierRebadgeStrategy(supplierId) {
  const strategies = {
    "BPO-A": { label: "low rebadge / aggressive migration", ratio: 0.45 },
    "BPO-B": { label: "moderate rebadge / stabilize then transform", ratio: 0.60 },
    "BPO-C": { label: "continuity-first transition", ratio: 0.75 },
    "BPO-D": { label: "high rebadge / continuity-heavy transition", ratio: 0.85 },
    "BPO-E": { label: "maximum rebadge / lowest near-term disruption", ratio: 0.90 },
  };
  return strategies[supplierId]?.label || "supplier-specific rebadge strategy";
}

function supplierRebadgeCount(supplierId, eligibleUniqueWorkforce, supplierRows) {
  const ratios = {
    "BPO-A": 0.45,
    "BPO-B": 0.60,
    "BPO-C": 0.75,
    "BPO-D": 0.85,
    "BPO-E": 0.90,
  };
  const sourceCount = sum(supplierRows, "number_proposed_for_rebadge");
  const ratio = ratios[supplierId] || 0.65;
  return Math.min(Math.round(eligibleUniqueWorkforce * ratio), Math.floor(eligibleUniqueWorkforce), sourceCount);
}

function buildAiAutomationCommitments(ctx) {
  return projection("sourcing_event", "ai_automation_commitments", "automation_commitment", ["BPO_AI_AUTOMATION_TRANSFORMATION_COMMITMENTS.csv"], fileRows(ctx, "BPO_AI_AUTOMATION_TRANSFORMATION_COMMITMENTS.csv").map((row) => {
    const key = v(row, "automation_commitment_id") || row.source_record_id;
    return makeProjectionRow(ctx, "sourcing_event", "ai_automation_commitments", "automation_commitment", key, {
      event_id: EVENT_ID,
      automation_commitment_id: key,
      supplier_id: v(row, "supplier_id"),
      process_name: v(row, "process_name"),
      ai_rpa_use_case: v(row, "ai_rpa_use_case"),
      current_manual_volume: num(v(row, "current_manual_volume")),
      current_manual_effort_hours: num(v(row, "current_manual_effort_hours")),
      target_automation_percentage: num(v(row, "target_automation_percentage")),
      productivity_commitment_pct: num(v(row, "productivity_commitment_pct")),
      contracted_benefit_amount: num(v(row, "contracted_benefit_amount")),
      counted_in_normalized_tco: v(row, "counted_in_normalized_tco"),
      evidence_required: v(row, "evidence_required"),
      commitment_state: v(row, "commitment_state"),
      automation_basis: /contract/i.test(v(row, "commitment_state")) ? "contractual" : "aspirational_or_proposed",
    }, [row], [entity(ctx, "bpo_supplier", v(row, "supplier_id"))], EVENT_CONTEXT_SNAPSHOT_ID);
  }));
}

function buildRetainedOrgScenarios(ctx) {
  return projection("sourcing_event", "retained_org_scenarios", "retained_org_scenario", ["BPO_RETAINED_ORGANIZATION_SCENARIOS.csv"], fileRows(ctx, "BPO_RETAINED_ORGANIZATION_SCENARIOS.csv").map((row) => {
    const key = v(row, "retained_org_scenario_id") || row.source_record_id;
    return makeProjectionRow(ctx, "sourcing_event", "retained_org_scenarios", "retained_org_scenario", key, {
      event_id: EVENT_ID,
      retained_org_scenario_id: key,
      supplier_id: v(row, "supplier_id"),
      sourcing_model: v(row, "sourcing_model"),
      meridian_health_retained_function: v(row, "meridian_health_retained_function"),
      retained_role: v(row, "retained_role"),
      transition_fte: num(v(row, "transition_fte")),
      steady_state_fte: num(v(row, "steady_state_fte")),
      location: v(row, "location"),
      responsibility: v(row, "responsibility"),
      decision_right: v(row, "decision_right"),
      annual_cost: num(v(row, "annual_cost")),
      dependency_on_supplier_transformation: v(row, "dependency_on_supplier_transformation"),
      consequence_if_transformation_delayed: v(row, "consequence_if_transformation_delayed"),
    }, [row], [entity(ctx, "bpo_supplier", v(row, "supplier_id"))], EVENT_CONTEXT_SNAPSHOT_ID);
  }));
}

function buildNormalizedTcoRecommendationInputs(ctx) {
  const tco = fileRows(ctx, "BPO_NORMALIZED_TCO.csv");
  const commercial = groupBy(fileRows(ctx, "BPO_COMMERCIAL_LINES.csv"), (row) => [v(row, "supplier_id"), v(row, "year")].join("|"));
  return projection("consumption", "normalized_tco_recommendation_inputs", "supplier_scenario", ["BPO_NORMALIZED_TCO.csv", "BPO_COMMERCIAL_LINES.csv", "BPO_EVALUATION_SCORES.csv"], tco.map((row) => {
    const key = [v(row, "supplier_id"), v(row, "scenario"), v(row, "year")].join("|");
    const commercialRows = commercial.get([v(row, "supplier_id"), v(row, "year")].join("|")) || [];
    return makeProjectionRow(ctx, "consumption", "normalized_tco_recommendation_inputs", "supplier_scenario", key, {
      event_id: EVENT_ID,
      supplier_id: v(row, "supplier_id"),
      scenario: v(row, "scenario"),
      year: v(row, "year"),
      headline_price: num(v(row, "headline_price")),
      normalized_five_year_tco: num(v(row, "normalized_five_year_tco")),
      recommendation_state: v(row, "recommendation_state"),
      commercial_service_fee: sum(commercialRows, "service_fee"),
      transition_cost: sum(commercialRows, "transition_cost"),
      retained_org_cost: sum(commercialRows, "retained_org_cost"),
      risk_adjustment: sum(commercialRows, "risk_adjustment"),
      recommendation_basis: "deterministic_normalized_tco_projection",
    }, collectSources([row], commercialRows), [entity(ctx, "bpo_supplier", v(row, "supplier_id"))], EVENT_CONTEXT_SNAPSHOT_ID);
  }));
}

function buildEventContextSnapshot(ctx, projections, canonical) {
  const eventSourceRows = [...ctx.byFile.values()].flat().filter((row) => row.source_group === "bpo_sourcing_event" || row.source_group === "bpo_transformation_event");
  const selectedEntityIds = canonical.entities
    .filter((row) => ["bpo_supplier", "vendor", "contract_family", "application", "program", "initiative", "outcome"].includes(row.canonical_entity_type))
    .map((row) => row.canonical_entity_id)
    .sort();
  const selectedRelationshipIds = canonical.relationships
    .filter((row) => ["contract_scope_relationships", "programs_initiatives_dependencies", "servicenow_vendor_services"].includes(row.relationship_type))
    .map((row) => row.canonical_relationship_id)
    .sort();
  const payload = {
    event_id: EVENT_ID,
    snapshot_version: "v1",
    source_release_id: SOURCE_RELEASE_ID,
    selected_projection_names: projections.map((projectionRow) => `${projectionRow.namespace}.${projectionRow.name}`).sort(),
    event_source_record_count: eventSourceRows.length,
    selected_canonical_entity_count: selectedEntityIds.length,
    selected_canonical_relationship_count: selectedRelationshipIds.length,
    immutable_reason: "sourcing event references selected canonical IDs and pins the event context for downstream Source, Moves and aVa use.",
  };
  return {
    id: EVENT_CONTEXT_SNAPSHOT_ID,
    event_id: EVENT_ID,
    snapshot_version: "v1",
    selected_canonical_entity_ids: selectedEntityIds,
    selected_canonical_relationship_ids: selectedRelationshipIds,
    selected_source_record_ids: eventSourceRows.map((row) => row.source_record_id).sort(),
    payload,
    hash: sha256(stableJson(payload)),
  };
}

function buildEventContextProjection(ctx, snapshot) {
  return projection("governance", "event_context_snapshot", "sourcing_event_context", ["BPO_SUPPLIERS.csv", "BPO_NORMALIZED_TCO.csv", "BPO_AI_AUTOMATION_TRANSFORMATION_COMMITMENTS.csv"], [
    makeProjectionRow(ctx, "governance", "event_context_snapshot", "sourcing_event_context", EVENT_ID, {
      event_id: EVENT_ID,
      event_context_snapshot_id: snapshot.id,
      snapshot_version: snapshot.snapshot_version,
      snapshot_hash: snapshot.hash,
      selected_source_record_count: snapshot.selected_source_record_ids.length,
      selected_canonical_entity_count: snapshot.selected_canonical_entity_ids.length,
      selected_canonical_relationship_count: snapshot.selected_canonical_relationship_ids.length,
    }, snapshot.selected_source_record_ids.slice(0, 100).map((source_record_id) => ({ source_record_id })), [], snapshot.id),
  ]);
}

function projection(namespace, name, businessGrain, sourceFileNames, rowsForProjection) {
  const rows = rowsForProjection.filter(Boolean).map((row) => ({
    ...row,
    namespace,
    projection_name: name,
    business_grain: businessGrain,
  }));
  const hash = sha256(stableJson(rows.map((row) => ({ business_key: row.business_key, row_hash: row.row_hash })).sort(compareByBusinessKey)));
  return {
    id: `meridian-health:projection-authority:${namespace}:${name}:v1`,
    namespace,
    name,
    business_grain: businessGrain,
    source_file_names: sourceFileNames,
    hash,
    rows,
  };
}

function makeProjectionRow(ctx, namespace, name, businessGrain, businessKey, payload, sourceRows = [], canonicalEntityIds = [], eventContextSnapshotId = "") {
  const compactSources = sourceRows.flat().filter(Boolean);
  const sourceRecordIds = unique(compactSources.map((row) => typeof row === "string" ? row : row.source_record_id).filter(Boolean)).sort();
  const relationshipIds = unique(sourceRecordIds.flatMap((id) => (ctx.relsBySource.get(id) || []).map((row) => row.canonical_relationship_id))).sort();
  const evidenceRefs = unique(sourceRecordIds.flatMap((id) => (ctx.evidenceBySource.get(id) || []).map((row) => row.evidence_ref).filter(Boolean))).sort();
  const entityIds = unique(canonicalEntityIds.filter(Boolean)).sort();
  const rowHash = sha256(stableJson({
    namespace,
    name,
    businessGrain,
    businessKey,
    payload,
    sourceRecordIds,
    relationshipIds,
    evidenceRefs,
    entityIds,
    eventContextSnapshotId,
  }));
  return {
    row_id: `meridian-health:projection-row:${namespace}:${name}:${slug(businessKey || rowHash)}:${rowHash.slice(0, 16)}`,
    business_key: businessKey || rowHash,
    source_record_ids: sourceRecordIds,
    canonical_entity_ids: entityIds,
    canonical_relationship_ids: relationshipIds,
    evidence_refs: evidenceRefs,
    event_context_snapshot_id: eventContextSnapshotId || null,
    payload,
    row_hash: rowHash,
  };
}

async function insertEventContextSnapshot(client, snapshot) {
  await client.query(
    `INSERT INTO ${tableRef("event_context_snapshots")}
      (event_context_snapshot_id, tenant_key, test_namespace, source_release_id, event_id, snapshot_version,
       snapshot_hash, immutable_state, selected_canonical_entity_ids, selected_canonical_relationship_ids,
       selected_source_record_ids, snapshot_payload, writer_job_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'pinned',$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,$12)`,
    [
      snapshot.id,
      TENANT_KEY,
      TEST_NAMESPACE,
      SOURCE_RELEASE_ID,
      snapshot.event_id,
      snapshot.snapshot_version,
      snapshot.hash,
      stableJson(snapshot.selected_canonical_entity_ids),
      stableJson(snapshot.selected_canonical_relationship_ids),
      stableJson(snapshot.selected_source_record_ids),
      stableJson(snapshot.payload),
      PROJECTION_EXECUTION_ID,
    ],
  );
}

async function insertProjection(client, projectionRow, layer3Counts) {
  await client.query(
    `INSERT INTO ${tableRef("projection_authority")}
      (projection_authority_id, tenant_key, test_namespace, source_release_id, projection_namespace,
       projection_name, projection_version, business_grain, projection_hash, projection_row_count,
       freshness_state, source_file_names, upstream_layer3_counts, writer_job_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'fresh',$11,$12::jsonb,$13)`,
    [
      projectionRow.id,
      TENANT_KEY,
      TEST_NAMESPACE,
      SOURCE_RELEASE_ID,
      projectionRow.namespace,
      projectionRow.name,
      PROJECTION_VERSION,
      projectionRow.business_grain,
      projectionRow.hash,
      projectionRow.rows.length,
      projectionRow.source_file_names,
      stableJson(layer3Counts),
      PROJECTION_EXECUTION_ID,
    ],
  );
  await insertRowsInBatches(client, projectionRow);
}

async function insertRowsInBatches(client, projectionRow) {
  for (const batch of chunks(projectionRow.rows, 250)) {
    const rowValues = [];
    const params = [];
    for (const row of batch) {
      const base = params.length;
      rowValues.push(`($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8},$${base + 9},$${base + 10},$${base + 11}::jsonb,$${base + 12}::jsonb,$${base + 13}::jsonb,$${base + 14}::jsonb,$${base + 15},'available',$${base + 16}::jsonb,$${base + 17})`);
      params.push(
        row.row_id,
        projectionRow.id,
        TENANT_KEY,
        TEST_NAMESPACE,
        SOURCE_RELEASE_ID,
        projectionRow.namespace,
        projectionRow.name,
        projectionRow.business_grain,
        row.business_key,
        row.event_context_snapshot_id,
        stableJson(row.canonical_entity_ids),
        stableJson(row.canonical_relationship_ids),
        stableJson(row.source_record_ids),
        stableJson(row.evidence_refs),
        row.row_hash,
        stableJson(row.payload),
        PROJECTION_EXECUTION_ID,
      );
    }
    await client.query(
      `INSERT INTO ${tableRef("projection_rows")}
        (projection_row_id, projection_authority_id, tenant_key, test_namespace, source_release_id,
         projection_namespace, projection_name, business_grain, business_key, event_context_snapshot_id,
         canonical_entity_ids, canonical_relationship_ids, source_record_ids, evidence_refs, row_hash,
         availability_state, projection_payload, writer_job_id)
       VALUES ${rowValues.join(",")}`,
      params,
    );
  }
  const lineageRows = projectionRow.rows.map((row) => ({
    id: `meridian-health:projection-lineage:${slug(row.row_id)}:${row.row_hash.slice(0, 16)}:payload`,
    row_id: row.row_id,
    source_record_id: row.source_record_ids[0] || null,
    canonical_entity_id: row.canonical_entity_ids[0] || null,
    canonical_relationship_id: row.canonical_relationship_ids[0] || null,
    evidence_ref: row.evidence_refs[0] || "",
  }));
  for (const batch of chunks(lineageRows, 500)) {
    const rowValues = [];
    const params = [];
    for (const row of batch) {
      const base = params.length;
      rowValues.push(`($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},'projection_payload',$${base + 6},NULL,$${base + 7},$${base + 8},$${base + 9},'derived',$${base + 10})`);
      params.push(row.id, row.row_id, TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID, row.source_record_id, row.canonical_entity_id, row.canonical_relationship_id, row.evidence_ref, PROJECTION_EXECUTION_ID);
    }
    await client.query(
      `INSERT INTO ${tableRef("projection_field_lineage")}
        (projection_field_lineage_id, projection_row_id, tenant_key, test_namespace, source_release_id,
         projection_field_name, source_record_id, source_field_value_id, canonical_entity_id,
         canonical_relationship_id, evidence_ref, contribution_type, writer_job_id)
       VALUES ${rowValues.join(",")}`,
      params,
    );
  }
}

async function resetLayer4Rows(client) {
  await resetLayer6RowsForProjectionRebuild(client);
  for (const table of ["projection_field_lineage", "projection_rows", "projection_authority", "event_context_snapshots"]) {
    await client.query(`DELETE FROM ${tableRef(table)} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3`, [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID]);
  }
  await client.query(
    `DELETE FROM ${tableRef("gate_results")} WHERE tenant_key=$1 AND test_namespace=$2 AND gate_id LIKE 'Meridian Health-L4-%'`,
    [TENANT_KEY, TEST_NAMESPACE],
  );
}

async function resetLayer6RowsForProjectionRebuild(client) {
  const layer6Tables = [
    "layer6_gate_results",
    "layer6_governed_narrative_artifacts",
    "layer6_hero_journey_findings",
    "layer6_app_module_bindings",
  ];
  const existing = await rows(
    client,
    `SELECT table_name FROM information_schema.tables WHERE table_schema=$1 AND table_name = ANY($2::text[])`,
    [DATABASE_SCHEMA, layer6Tables],
  );
  const existingNames = new Set(existing.map((row) => row.table_name));
  for (const table of layer6Tables) {
    if (!existingNames.has(table)) continue;
    await client.query(`DELETE FROM ${tableRef(table)} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3`, [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID]);
  }
}

async function verifiedManifest(client, status, extra = {}) {
  const schema = await schemaReadback(client);
  const layer3 = await layer3Counts(client);
  const counts = await projectionReadback(client);
  const summaries = await projectionSummaries(client);
  const exact = await layer4Exact(client, { schema, layer3, existing: counts, summaries });
  return manifest(status, {
    ...extra,
    schema,
    layer3_counts: layer3,
    projection_counts: counts,
    projection_summaries: summaries,
    exact_match: exact.ok,
    defects: exact.defects,
    earliest_broken_transition: exact.ok ? null : exact.defects[0],
  });
}

async function schemaReadback(client) {
  const required = ["event_context_snapshots", "projection_authority", "projection_rows", "projection_field_lineage"];
  const tables = await rows(client, `SELECT table_name FROM information_schema.tables WHERE table_schema=$1 AND table_name=ANY($2::text[]) ORDER BY table_name`, [DATABASE_SCHEMA, required]);
  const rls = await rows(client, `
    SELECT c.relname AS table_name, c.relrowsecurity, c.relforcerowsecurity
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
     WHERE n.nspname=$1 AND c.relname=ANY($2::text[])
     ORDER BY c.relname`, [DATABASE_SCHEMA, required]);
  const policies = await rows(client, `SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname=$1 AND tablename=ANY($2::text[])`, [DATABASE_SCHEMA, required]);
  const defects = [];
  for (const table of required) {
    if (!tables.some((row) => row.table_name === table)) defects.push(`table_missing:${table}`);
    const tableRls = rls.find((row) => row.table_name === table);
    if (!tableRls?.relrowsecurity) defects.push(`rls_not_enabled:${table}`);
    if (!tableRls?.relforcerowsecurity) defects.push(`rls_not_forced:${table}`);
    const tablePolicies = policies.filter((row) => row.tablename === table);
    for (const cmd of ["SELECT", "INSERT", "DELETE"]) {
      if (!tablePolicies.some((row) => row.cmd === cmd)) defects.push(`policy_missing:${table}:${cmd}`);
    }
  }
  return { tables: tables.map((row) => row.table_name), rls, policies, defects };
}

async function layer3Counts(client) {
  const [row] = await rows(client, `
    SELECT
      (SELECT count(*)::int FROM ${tableRef("canonical_entities")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS canonical_entities,
      (SELECT count(*)::int FROM ${tableRef("canonical_observations")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS canonical_observations,
      (SELECT count(*)::int FROM ${tableRef("canonical_relationships")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS canonical_relationships,
      (SELECT count(*)::int FROM ${tableRef("canonical_evidence_records")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS canonical_evidence_records,
      (SELECT count(*)::int FROM ${tableRef("event_native_records")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS event_native_records,
      (SELECT count(*)::int FROM ${tableRef("canonical_promotion_decisions")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS canonical_promotion_decisions
  `, [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID]);
  return numericObject(row);
}

async function projectionReadback(client) {
  const [row] = await rows(client, `
    SELECT
      (SELECT count(*)::int FROM ${tableRef("event_context_snapshots")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS event_context_snapshots,
      (SELECT count(*)::int FROM ${tableRef("projection_authority")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS projection_authority,
      (SELECT count(*)::int FROM ${tableRef("projection_rows")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS projection_rows,
      (SELECT count(*)::int FROM ${tableRef("projection_field_lineage")} WHERE tenant_key=$1 AND test_namespace=$2 AND source_release_id=$3) AS projection_field_lineage,
      (SELECT count(*)::int FROM ${tableRef("projection_rows")} WHERE tenant_key LIKE 'skyharbor%') AS skyharbor_projection_rows,
      (SELECT count(*)::int FROM ${tableRef("projection_rows")} WHERE projection_name IN ('generic_observation','canonical_observations')) AS generic_observation_projection_rows,
      (SELECT count(*)::int FROM ${tableRef("projection_rows")} WHERE jsonb_array_length(source_record_ids)=0) AS rows_without_source_refs
  `, [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID]);
  return numericObject(row);
}

async function projectionSummaries(client) {
  return rows(client, `
    SELECT pa.projection_namespace, pa.projection_name, pa.business_grain,
           pa.projection_row_count AS authority_row_count,
           count(pr.projection_row_id)::int AS actual_row_count,
           pa.projection_hash
      FROM ${tableRef("projection_authority")} pa
      LEFT JOIN ${tableRef("projection_rows")} pr
        ON pr.projection_authority_id=pa.projection_authority_id
       AND pr.tenant_key=pa.tenant_key
       AND pr.test_namespace=pa.test_namespace
     WHERE pa.tenant_key=$1 AND pa.test_namespace=$2 AND pa.source_release_id=$3
     GROUP BY pa.projection_namespace, pa.projection_name, pa.business_grain, pa.projection_row_count, pa.projection_hash
     ORDER BY pa.projection_namespace, pa.projection_name
  `, [TENANT_KEY, TEST_NAMESPACE, SOURCE_RELEASE_ID]);
}

async function layer4Exact(client, precomputed = {}) {
  const schema = precomputed.schema || await schemaReadback(client);
  const layer3 = precomputed.layer3 || await layer3Counts(client);
  const existing = precomputed.existing || await projectionReadback(client);
  const summaries = precomputed.summaries || await projectionSummaries(client);
  const defects = [...schema.defects];
  const layer3Ok = exactObject(layer3, LAYER3_COUNTS);
  if (!layer3Ok) defects.push("layer3_counts_not_exact");
  if (existing.projection_authority !== REQUIRED_PROJECTIONS.length && existing.projection_rows > 0) defects.push(`projection_authority_count_mismatch:${existing.projection_authority}`);
  if (existing.event_context_snapshots !== 1 && existing.projection_rows > 0) defects.push(`event_context_snapshot_count_mismatch:${existing.event_context_snapshots}`);
  if (existing.projection_rows > 0 && existing.projection_field_lineage < existing.projection_rows) defects.push("projection_lineage_below_projection_rows");
  if (existing.skyharbor_projection_rows !== 0) defects.push(`skyharbor_projection_rows_present:${existing.skyharbor_projection_rows}`);
  if (existing.generic_observation_projection_rows !== 0) defects.push(`generic_observation_projection_rows_present:${existing.generic_observation_projection_rows}`);
  if (existing.rows_without_source_refs !== 0) defects.push(`projection_rows_without_source_refs:${existing.rows_without_source_refs}`);
  for (const [projection_namespace, projection_name, business_grain] of REQUIRED_PROJECTIONS) {
    const summary = summaries.find((row) => row.projection_namespace === projection_namespace && row.projection_name === projection_name);
    if (!summary && existing.projection_rows > 0) defects.push(`projection_missing:${projection_namespace}.${projection_name}`);
    if (summary && summary.business_grain !== business_grain) defects.push(`business_grain_mismatch:${projection_namespace}.${projection_name}:${summary.business_grain}`);
    if (summary && Number(summary.actual_row_count) !== Number(summary.authority_row_count)) defects.push(`projection_row_count_mismatch:${projection_namespace}.${projection_name}`);
    if (summary && Number(summary.actual_row_count) <= 0) defects.push(`projection_empty:${projection_namespace}.${projection_name}`);
  }
  return { ok: defects.length === 0 && existing.projection_rows > 0, defects, layer3_ok: layer3Ok };
}

async function insertGateResults(client, result) {
  const rowsForGate = [
    ["Meridian Health-L4-K4A-TYPED-PROJECTION-COVERAGE", "Layer 3 canonical facts to typed projection authorities", REQUIRED_PROJECTIONS.length, result.projection_counts.projection_authority],
    ["Meridian Health-L4-K4B-BUSINESS-GRAIN-ROWS", "Typed projection authorities to business-grain rows", result.projection_counts.projection_authority, result.projection_counts.projection_rows],
    ["Meridian Health-L4-K4C-PROJECTION-LINEAGE", "Projection rows to source/canonical lineage", result.projection_counts.projection_rows, result.projection_counts.projection_field_lineage],
    ["Meridian Health-L4-K4D-EVENT-CONTEXT-SNAPSHOT", "Sourcing event selected canonical IDs to immutable event snapshot", 1, result.projection_counts.event_context_snapshots],
  ];
  for (const [gateId, transition, inputCount, outputCount] of rowsForGate) {
    await client.query(
      `INSERT INTO ${tableRef("gate_results")}
        (gate_result_id, tenant_key, test_namespace, gate_id, transition, input_count, output_count,
         unexplained_variance, gate_status, failure_classification, repair_owner, rerun_scope, proof_uri, writer_job_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,0,'passed',NULL,'foundation-v2-meridian-health-layer4','none',$8,$9)
       ON CONFLICT (tenant_key, test_namespace, gate_id, writer_job_id) DO NOTHING`,
      [`${PROJECTION_EXECUTION_ID}:${gateId}`, TENANT_KEY, TEST_NAMESPACE, gateId, transition, inputCount, outputCount, `proof://meridian-health-layer4/${gateId}`, PROJECTION_EXECUTION_ID],
    );
  }
}

function assertProjectionSet(set) {
  const keys = new Set(set.projections.map((projectionRow) => `${projectionRow.namespace}.${projectionRow.name}`));
  const rowIds = new Set();
  for (const [namespace, name] of REQUIRED_PROJECTIONS) {
    if (!keys.has(`${namespace}.${name}`)) throw new Error(`Projection not built: ${namespace}.${name}`);
  }
  for (const projectionRow of set.projections) {
    if (projectionRow.rows.length === 0) throw new Error(`Projection is empty: ${projectionRow.namespace}.${projectionRow.name}`);
    for (const row of projectionRow.rows) {
      if (row.source_record_ids.length === 0) throw new Error(`Projection row lacks source refs: ${projectionRow.namespace}.${projectionRow.name}:${row.business_key}`);
      if (rowIds.has(row.row_id)) throw new Error(`Duplicate projection row id: ${row.row_id}`);
      rowIds.add(row.row_id);
    }
  }
}

function assertManifestOk(result) {
  if (!result.exact_match || result.defects.length > 0) throw new Error(`Layer 4 exact proof failed: ${result.defects.join(", ")}`);
}

function assertApplyApproved() {
  if (process.env.MERIDIAN_HEALTH_LAYER4_PROJECTION_APPLY_APPROVED !== "true") {
    throw new Error("MERIDIAN_HEALTH_LAYER4_PROJECTION_APPLY_APPROVED=true is required for apply mode");
  }
}

function manifest(status, extra = {}) {
  return {
    status,
    generated_at: new Date().toISOString(),
    tenant_key: TENANT_KEY,
    test_namespace: TEST_NAMESPACE,
    source_release_id: SOURCE_RELEASE_ID,
    foundation_release_alias: FOUNDATION_RELEASE_ALIAS,
    execution_id: PROJECTION_EXECUTION_ID,
    projection_version: PROJECTION_VERSION,
    ...extra,
  };
}

function writeProofSet(outDir, result) {
  writeJson(proofRef(outDir, "MERIDIAN_HEALTH_LAYER4_PROJECTIONS.json"), result);
  writeCsv(
    proofRef(outDir, "MERIDIAN_HEALTH_LAYER4_PROJECTION_SUMMARY.csv"),
    ["projection_namespace", "projection_name", "business_grain", "authority_row_count", "actual_row_count", "projection_hash"],
    result.projection_summaries || [],
  );
}

function maybeEmitProofBundle() {
  if (args.emitProofBundle) emitProofBundle(args.outDir);
}

async function setContext(client, role) {
  await client.query("RESET ROLE");
  await client.query(`SET ROLE ${quoteIdent(role)}`);
  await client.query("SELECT set_config('app.tenant_key', $1, true)", [TENANT_KEY]);
  await client.query("SELECT set_config('app.foundation_v2_test_namespace', $1, true)", [TEST_NAMESPACE]);
  await client.query("SELECT set_config('app.foundation_v2_source_release_id', $1, true)", [SOURCE_RELEASE_ID]);
  await client.query("SELECT set_config('app.foundation_v2_release_alias', $1, true)", [FOUNDATION_RELEASE_ALIAS]);
}

async function rows(client, text, params = []) {
  return (await client.query(text, params)).rows;
}

function tableRef(table) {
  return `${quoteIdent(DATABASE_SCHEMA)}.${quoteIdent(table)}`;
}

function quoteIdent(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function fileRows(ctx, fileName) {
  return ctx.byFile.get(fileName) || [];
}

function entity(ctx, type, key) {
  if (!key) return "";
  return ctx.entityByTypeKey.get(`${type}\u0000${key}`)?.canonical_entity_id || "";
}

function v(row, field) {
  return row?.payload?.[field] == null ? "" : String(row.payload[field]);
}

function pick(row, fields) {
  const out = {};
  for (const field of fields) out[field] = v(row, field);
  return out;
}

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sum(rowsForSum = [], field) {
  return Number(rowsForSum.reduce((total, row) => total + num(v(row, field)), 0).toFixed(4));
}

function round(value, digits = 2) {
  return Number((Number(value) || 0).toFixed(digits));
}

function avg(rowsForAvg = [], field) {
  if (rowsForAvg.length === 0) return 0;
  return Number((sum(rowsForAvg, field) / rowsForAvg.length).toFixed(4));
}

function month(value) {
  return String(value || "").slice(0, 7) || "unknown";
}

function unique(values) {
  return [...new Set(values.filter((value) => value != null && String(value) !== ""))];
}

function collectSources(...groups) {
  return groups.flat().filter(Boolean);
}

function groupBy(items, keyFn) {
  const grouped = new Map();
  for (const item of items || []) {
    const key = keyFn(item);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(item);
  }
  return grouped;
}

function aggregate(items, keyFn) {
  return groupBy(items, keyFn);
}

function chunks(items, size) {
  const out = [];
  for (let index = 0; index < items.length; index += size) out.push(items.slice(index, index + size));
  return out;
}

function compareByBusinessKey(a, b) {
  return String(a.business_key).localeCompare(String(b.business_key));
}

function exactObject(actual, expected) {
  return Object.entries(expected).every(([key, value]) => Number(actual[key] || 0) === Number(value));
}

function numericObject(row) {
  return Object.fromEntries(Object.entries(row || {}).map(([key, value]) => [key, Number(value || 0)]));
}

function slug(value) {
  return String(value || "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 160) || "unknown";
}

function progress(event, payload = {}) {
  console.log(JSON.stringify({ status: "MERIDIAN_HEALTH_DEMO_LAYER4_PROJECTION_PROGRESS", event, generated_at: new Date().toISOString(), ...payload }));
}
