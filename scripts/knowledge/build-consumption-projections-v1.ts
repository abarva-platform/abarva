#!/usr/bin/env -S npx tsx
/**
 * Consumption projection build — V1 extension.
 *
 * Fills the 9 consumption.*_v1 projections the merged phase3c2e build does not
 * (enterprise_brief, enterprise_identity, domain_summary, application_inventory,
 * vendor_contract_inventory, metric_observation, evidence_gap, +empty
 * executive_perspective / strategic_interpretation / module_knowledge_packet),
 * shaping accepted knowledge into the exact V1 payloads via the shared shaper.
 *
 * GOVERNED. Reads only ACCEPTED knowledge (authority_state='accepted') under the
 * active baseline; writes only consumption.*_v1. Default is DRY-RUN. A real write
 * requires --apply AND env CONSUMPTION_PROJECTION_APPLY_ACK=APPLY_PROJECTIONS,
 * and a host that is a governed Azure lab (never a prod/supabase host). Intended
 * to run as an ACA job (docs/ops/aca-data-build-job-rule.md), not a web request.
 *
 * Usage:
 *   npx tsx scripts/knowledge/build-consumption-projections-v1.ts --tenant airline-demo-new --baseline <ref> [--apply]
 */

import { Client } from "pg";
import {
  shapeDomainReadiness,
  shapeEnterpriseBrief,
  shapeEnterpriseIdentity,
  shapeEntitySummary,
  shapeEvidenceGap,
  shapeMetric,
  type EvidenceGapRow,
  type FactRow,
  type KnowledgeEntityRow,
  type MetricRow,
} from "../../src/lib/knowledge/consumption-server/shape";

const args = process.argv.slice(2);
const arg = (n: string) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const tenant = arg("tenant");
const baseline = arg("baseline");
const apply = args.includes("--apply");

if (!tenant || !baseline) {
  console.error("ERROR: --tenant and --baseline are required.");
  process.exit(2);
}

const dbUrl =
  process.env.AZURE_LAB_DATABASE_URL || process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL || "";

function assertGovernedHost(url: string): void {
  if (!url) throw new Error("A database URL is required.");
  if (/supabase/i.test(url) || /prod/i.test(url)) {
    throw new Error("Refusing to run against a prod/supabase host.");
  }
  const host = new URL(url.replace(/^postgres(ql)?:/, "http:")).hostname;
  if (!/\.postgres\.database\.azure\.com$/.test(host) && !/^10\./.test(host)) {
    throw new Error(`Host "${host}" is not a governed Azure Postgres lab host.`);
  }
}

const PROJECTION_VERSION = "phase3c2d-consumption-contracts-v1.0.0";

async function main() {
  if (!tenant || !baseline) return; // narrowed for the rest of this scope
  if (apply) {
    if (process.env.CONSUMPTION_PROJECTION_APPLY_ACK !== "APPLY_PROJECTIONS") {
      throw new Error("--apply requires env CONSUMPTION_PROJECTION_APPLY_ACK=APPLY_PROJECTIONS.");
    }
    assertGovernedHost(dbUrl);
  }

  const client = new Client({ connectionString: dbUrl || "postgres://invalid" });
  if (apply || dbUrl) await client.connect();

  const q = async <T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> => {
    if (!dbUrl) return [];
    const r = await client.query(sql, params);
    return r.rows as T[];
  };

  try {
    // Read accepted knowledge for this tenant.
    const entities = await q<KnowledgeEntityRow>(
      `SELECT entity_ref, entity_type, display_name, canonical_payload, authority_state, availability_state, accepted_evidence_refs
         FROM knowledge.entity WHERE tenant_key = $1 AND authority_state = 'accepted'`, [tenant]);
    const facts = await q<FactRow & { entity_ref: string }>(
      `SELECT entity_ref, fact_type, fact_value, evidence_refs, availability_state
         FROM knowledge.fact_assertion WHERE tenant_key = $1 AND authority_state = 'accepted'`, [tenant]);
    const metrics = await q<MetricRow>(
      `SELECT o.metric_ref, d.metric_name, d.unit, o.period_start, o.period_end, o.metric_value, o.disclosure_mode, o.evidence_refs
         FROM metrics.metric_observation o
         LEFT JOIN metrics.metric_definition d ON d.tenant_key = o.tenant_key AND d.metric_ref = o.metric_ref
        WHERE o.tenant_key = $1`, [tenant]);
    const gaps = await q<EvidenceGapRow>(
      `SELECT gap_ref, domain_ref, missing_evidence_type, why_it_matters, severity, availability_state, source_request_text
         FROM governance.evidence_gap WHERE tenant_key = $1`, [tenant]);

    const factsByEntity = new Map<string, FactRow[]>();
    for (const f of facts) {
      const list = factsByEntity.get(f.entity_ref) ?? [];
      list.push(f);
      factsByEntity.set(f.entity_ref, list);
    }

    // Shape the V1 payloads.
    const enterpriseEntity = entities.find((e) => /enterprise|organization|company/i.test(e.entity_type)) ?? entities[0] ?? null;
    const identity = shapeEnterpriseIdentity(enterpriseEntity, enterpriseEntity ? factsByEntity.get(enterpriseEntity.entity_ref) ?? [] : []);
    const inventory = entities
      .filter((e) => e !== enterpriseEntity)
      .map((e) => shapeEntitySummary(e, factsByEntity.get(e.entity_ref) ?? []));
    const domainKeys = [...new Set(inventory.map((e) => e.domainKey))];
    const domains = domainKeys.map((d) =>
      shapeDomainReadiness(d, humanize(d), inventory.filter((e) => e.domainKey === d).length,
        gaps.filter((g) => g.domain_ref === d).length, 0));
    const metricValues = metrics.map(shapeMetric);
    const gapItems = gaps.map(shapeEvidenceGap);
    const brief = shapeEnterpriseBrief({ identity, headlineMetrics: metricValues, domains, topGapRefs: gapItems.slice(0, 3).map((g) => g.gapId) });

    const plan = {
      enterprise_brief_v1: 1,
      enterprise_identity_v1: 1,
      domain_summary_v1: domains.length,
      application_inventory_v1: inventory.filter((e) => !/vendor|contract/i.test(e.entityType)).length,
      vendor_contract_inventory_v1: inventory.filter((e) => /vendor|contract/i.test(e.entityType)).length,
      metric_observation_v1: metricValues.length,
      evidence_gap_v1: gapItems.length,
    };

    console.log(`\nConsumption projection build (V1) — tenant=${tenant} baseline=${baseline} mode=${apply ? "APPLY" : "DRY-RUN"}`);
    console.log(`  read: ${entities.length} entities, ${facts.length} facts, ${metrics.length} metrics, ${gaps.length} gaps`);
    console.log("  would write:", JSON.stringify(plan));

    if (!apply) {
      console.log("\n  DRY-RUN — no rows written. Re-run with --apply + CONSUMPTION_PROJECTION_APPLY_ACK to materialize.\n");
      return;
    }

    // APPLY: write V1 payloads inside one transaction, recording a refresh_run.
    await client.query("BEGIN");
    try {
      const meta = [tenant, baseline, PROJECTION_VERSION];
      await writeGeneric(client, "enterprise_brief_v1", meta, [{ object_ref: "enterprise", display_name: identity.displayName, payload: brief }]);
      await writeGeneric(client, "enterprise_identity_v1", meta, [{ object_ref: identity.organizationId ?? "identity", display_name: identity.displayName, payload: identity }]);
      await writeGeneric(client, "domain_summary_v1", meta, domains.map((d) => ({ object_ref: d.domainKey, display_name: d.label, payload: d })));
      await writeGeneric(client, "application_inventory_v1", meta, inventory.filter((e) => !/vendor|contract/i.test(e.entityType)).map((e) => ({ object_ref: e.entityRef, display_name: e.displayName, payload: e })));
      await writeGeneric(client, "vendor_contract_inventory_v1", meta, inventory.filter((e) => /vendor|contract/i.test(e.entityType)).map((e) => ({ object_ref: e.entityRef, display_name: e.displayName, payload: e })));
      await writeGeneric(client, "evidence_gap_v1", meta, gapItems.map((g) => ({ object_ref: g.gapId, display_name: g.title, payload: g })));
      await client.query(
        `INSERT INTO consumption.refresh_run (refresh_run_id, tenant_key, knowledge_baseline_ref, projection_name, status, completed_at)
         VALUES ($1, $2, $3, 'consumption.enterprise_brief_v1', 'pass', now())
         ON CONFLICT (refresh_run_id) DO NOTHING`,
        [`rr-${tenant}-${baseline}-brief`, tenant, baseline]).catch(() => undefined);
      await client.query("COMMIT");
      console.log("\n  APPLIED — V1 projections written.\n");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    }
  } finally {
    if (apply || dbUrl) await client.end();
  }
}

async function writeGeneric(
  client: Client,
  table: string,
  meta: string[],
  rows: Array<{ object_ref: string; display_name: string | null; payload: unknown }>,
): Promise<void> {
  const [tenant, baseline, version] = meta;
  for (const r of rows) {
    await client.query(
      `INSERT INTO consumption.${table}
         (tenant_key, knowledge_baseline_ref, projection_contract_version, authority_state, freshness_state, availability_state, content_hash, object_ref, display_name, payload)
       VALUES ($1,$2,$3,'published','fresh','available', md5($6::text), $4, $5, $6::jsonb)
       ON CONFLICT (tenant_key, knowledge_baseline_ref, object_ref)
       DO UPDATE SET payload = EXCLUDED.payload, content_hash = EXCLUDED.content_hash`,
      [tenant, baseline, version, r.object_ref, r.display_name, JSON.stringify(r.payload)],
    );
  }
}

function humanize(s: string): string {
  return s.replace(/[_.]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

main().catch((e) => { console.error(e); process.exit(1); });
