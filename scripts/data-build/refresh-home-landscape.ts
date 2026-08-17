#!/usr/bin/env npx tsx
/**
 * Home landscape projector — canonical model to Home's own read models.
 *
 * Home has had read-model tables all along: `public.home_knowledge_packs` and
 * `public.home_knowledge_dimensions`, filled by a handful of bespoke scripts. What it did not
 * have was a page that reads them. `src/app/(maestro)/home/page.tsx` imports
 * `@/lib/source/data-model/read-adapter` and renders Source's data instead — and Intelligence in
 * turn renders Home's view model, so three products deep, none of them touch the canonical
 * model.
 *
 * That is the anti-pattern the architecture doc names outright: a product adapter bypassing
 * Layer 3 to make one screen look correct. It is why every status report came back "Source
 * only" while 5,553 canonical entities sat unread by four of five products.
 *
 * This projects the enterprise landscape from canonical records into Home's existing tables:
 * one pack per tenant per build, one dimension row per canonical object type that Home owns,
 * carrying the entity count, the evidence count, and the build that produced it.
 *
 * It writes nothing without SOURCE_HOME_LANDSCAPE_WRITE_APPROVED=true, and dry-run is the
 * default, matching the other governed builders.
 *
 * Usage:
 *   npx tsx scripts/data-build/refresh-home-landscape.ts --out-dir <dir> [--tenant <key>]...
 */

import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

import { buildCanonicalTenantDataReport } from "../../src/lib/enterprise-data/canonical-build/canonical-tenant-data-build";

/**
 * Every canonical object type, with the products that consume it and the attribute that names an
 * instance of it.
 *
 * This registry is the point of the whole exercise. The first version of this file covered only the
 * nine types Home renders, which would have made it the fourth per-module supply chain rather than
 * the one shared projection. A dimension belongs here because it exists in the canonical model, not
 * because a particular screen wants it; `products` records who reads it, and adding a reader is an
 * entry in a list rather than a new pipeline.
 *
 * `nameAttribute` is what a human calls one of these — `systemName`, `vendorName`, `riskOrControlName`.
 * It is how a count becomes an answer: "804 applications" is inventory, "804 applications, including
 * Epic Hyperspace and Kronos" is a landscape.
 *
 * `section` maps the dimension onto the Intelligence advisory sections. Several dimensions share a
 * section — operations draws on process evidence, service performance, and managed service scope —
 * which is correct: a section is a question, and more than one kind of fact can answer it.
 */
type ProductSurface = "home" | "intelligence" | "moves" | "tower" | "source";

interface LandscapeDimension {
  objectType: string;
  key: string;
  label: string;
  nameAttribute: string;
  /** Intelligence advisory section id, or null when no section asks this question yet. */
  section: string | null;
  products: ProductSurface[];
}

const LANDSCAPE_DIMENSIONS: LandscapeDimension[] = [
  // THE ENTERPRISE
  { objectType: "tenant_profile", key: "enterprise_profile", label: "Enterprise profile", nameAttribute: "entityName", section: "profile", products: ["home", "intelligence"] },
  { objectType: "business_function", key: "business_functions", label: "Business functions", nameAttribute: "functionName", section: "operating", products: ["home", "intelligence", "moves"] },
  { objectType: "org_owner", key: "org_ownership", label: "Organisation and ownership", nameAttribute: "orgUnit", section: "operating", products: ["home", "intelligence"] },
  { objectType: "workforce_role", key: "workforce_roles", label: "Workforce and roles", nameAttribute: "personaOrRole", section: "workforce", products: ["home", "intelligence"] },

  // THE ESTATE
  { objectType: "application_system", key: "applications", label: "Applications and systems", nameAttribute: "systemName", section: "applications", products: ["home", "intelligence", "source", "tower"] },
  { objectType: "infrastructure_platform", key: "infrastructure", label: "Infrastructure platforms", nameAttribute: "platformName", section: "infrastructure", products: ["home", "intelligence", "tower"] },
  { objectType: "data_asset_or_integration", key: "data_assets", label: "Data assets and integrations", nameAttribute: "dataAssetName", section: "data", products: ["home", "intelligence"] },
  { objectType: "relationship_source_row", key: "integrations", label: "System relationships", nameAttribute: "fromObjectName", section: "integrations", products: ["intelligence"] },
  { objectType: "platform_maturity_assessment", key: "platform_maturity", label: "Platform maturity", nameAttribute: "platformOrCapability", section: "infrastructure", products: ["home", "intelligence"] },

  // MONEY & PARTNERS
  { objectType: "vendor_contract", key: "vendors", label: "Vendors and contracts", nameAttribute: "vendorName", section: "vendors", products: ["intelligence", "source", "tower"] },
  { objectType: "spend_value_fact", key: "spend", label: "Spend and value", nameAttribute: "spendCategory", section: "budget", products: ["intelligence", "source", "tower"] },
  { objectType: "managed_service_scope", key: "managed_services", label: "Managed service scope", nameAttribute: "serviceName", section: "operations", products: ["intelligence", "source"] },

  // AI & RISK
  { objectType: "ai_automation_use_case", key: "ai_use_cases", label: "AI and automation use cases", nameAttribute: "useCaseName", section: "ai", products: ["intelligence", "moves"] },
  { objectType: "ai_tool_usage_observation", key: "ai_tool_usage", label: "AI tool usage", nameAttribute: "toolName", section: "ai", products: ["intelligence"] },
  { objectType: "ai_value_realization_signal", key: "ai_value_signals", label: "AI value signals", nameAttribute: "programName", section: "ai", products: ["intelligence"] },
  { objectType: "ai_kpi_outcome_observation", key: "ai_kpis", label: "AI KPI outcomes", nameAttribute: "kpiName", section: "ai", products: ["intelligence"] },
  { objectType: "ai_value_interview_evidence", key: "ai_interviews", label: "AI value interviews", nameAttribute: "stakeholderRole", section: "ai", products: ["intelligence"] },
  { objectType: "risk_or_control", key: "risks_controls", label: "Risks and controls", nameAttribute: "riskOrControlName", section: "risk", products: ["home", "intelligence"] },
  { objectType: "operational_process_evidence", key: "processes", label: "Operational processes", nameAttribute: "processName", section: "operations", products: ["intelligence", "moves"] },
  { objectType: "service_performance_observation", key: "service_performance", label: "Service performance", nameAttribute: "systemName", section: "operations", products: ["intelligence", "tower"] },

  // OUTSIDE-IN
  { objectType: "industry_context_pattern", key: "industry_patterns", label: "Industry context patterns", nameAttribute: "patternName", section: "benchmarks", products: ["intelligence"] },
  { objectType: "expert_lens", key: "expert_lenses", label: "Expert lenses", nameAttribute: "lensName", section: "benchmarks", products: ["intelligence"] },
  { objectType: "evidence_source", key: "evidence_sources", label: "Evidence sources", nameAttribute: "sourceFile", section: "policies", products: ["home", "intelligence"] },
  { objectType: "semantic_crosswalk_evidence", key: "crosswalk", label: "Semantic crosswalk evidence", nameAttribute: "canonicalObjectName", section: "policies", products: ["intelligence"] },

  // PROGRAMS & OUTCOMES
  { objectType: "program_initiative", key: "programs", label: "Programs and initiatives", nameAttribute: "programName", section: null, products: ["moves", "tower"] },
  { objectType: "metric_outcome", key: "metrics", label: "Metrics and outcomes", nameAttribute: "metricName", section: null, products: ["moves", "tower"] },
];

/** How many named examples to carry per dimension, so a count can be shown as a landscape. */
const SAMPLE_LIMIT = 8;

const GENERATOR_VERSION = "home-landscape-projector/v2";

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
}
function args(name: string): string[] {
  const out: string[] = [];
  process.argv.forEach((a, i) => {
    if (a === `--${name}`) out.push(process.argv[i + 1]);
  });
  return out;
}

const OUT_DIR = arg("out-dir") ?? "/tmp/home-landscape";
const TENANTS = args("tenant").length ? args("tenant") : ["meridian-health", "skyharbor-air"];
const BUILD_VERSION = process.env.HOME_LANDSCAPE_BUILD_VERSION ?? arg("build-version") ?? "local";
const INPUT_SOURCE = process.env.HOME_LANDSCAPE_INPUT_SOURCE_VERSION ?? arg("input-source-version") ?? "local";
const WRITE =
  process.env.HOME_LANDSCAPE_WRITE === "true" &&
  process.env.HOME_LANDSCAPE_WRITE_APPROVED === "true";

async function main(): Promise<number> {
  const report = await buildCanonicalTenantDataReport({
    repoRoot: process.cwd(),
    tenantKeys: TENANTS,
  });

  /** Count entities and evidence per tenant per dimension, and carry named examples. */
  const projected = TENANTS.flatMap((tenantKey) => {
    const forTenant = report.canonicalRecords.filter((r) => r.tenantKey === tenantKey);
    return LANDSCAPE_DIMENSIONS.map((dim) => {
      const rows = forTenant.filter((r) => r.objectType === dim.objectType);
      const evidence = rows.reduce((n, r) => n + (r.evidenceReferences?.length ?? 0), 0);
      // Distinct names, in canonical order, capped. Duplicates are collapsed because the same
      // system appears once per relationship row and a reader should see eight systems, not one
      // system eight times.
      // Attributes are CanonicalValue wrappers, not bare strings — reading `attributes[key]`
      // directly yields an object and every name silently comes out empty, which reads as a
      // populated landscape with no content in it.
      const names = [
        ...new Set(
          rows
            .map((r) => r.attributes?.[dim.nameAttribute]?.value)
            .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
            .map((v) => v.trim()),
        ),
      ];
      return {
        tenantKey,
        dimensionKey: dim.key,
        displayName: dim.label,
        objectType: dim.objectType,
        section: dim.section,
        products: dim.products,
        recordCount: rows.length,
        distinctNameCount: names.length,
        sampleEntities: names.slice(0, SAMPLE_LIMIT),
        evidenceCount: evidence,
        // A dimension with no entities is reported as a gap, never as a confident zero.
        confidenceStatus: rows.length === 0 ? "not_available" : evidence > 0 ? "evidenced" : "directional",
      };
    });
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    mode: WRITE ? "write" : "dry-run",
    buildVersion: BUILD_VERSION,
    inputSourceVersion: INPUT_SOURCE,
    tenantScope: TENANTS,
    canonicalRecordsRead: report.canonicalRecords.length,
    dimensionsProjected: projected.length,
    entitiesProjected: projected.reduce((n, d) => n + d.recordCount, 0),
    gaps: projected.filter((d) => d.recordCount === 0).map((d) => `${d.tenantKey}:${d.dimensionKey}`),
    projected,
    packsWritten: 0,
    dimensionRowsWritten: 0,
    readbackDimensionRows: 0,
    productReadModelsUpdated: false as boolean,
  };

  if (WRITE) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is required in write mode");
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    try {
      await client.query("begin");
      for (const tenantKey of TENANTS) {
        const dims = projected.filter((d) => d.tenantKey === tenantKey);
        // One pack per tenant per build. Re-running the same build replaces its own rows rather
        // than accumulating, so the job is safe to retry.
        await client.query(
          `delete from public.home_knowledge_packs
             where tenant_key = $1 and pack_version = $2 and generator_version = $3`,
          [tenantKey, BUILD_VERSION, GENERATOR_VERSION],
        );
        const pack = await client.query<{ id: string }>(
          `insert into public.home_knowledge_packs
             (tenant_key, tenant_name, pack_version, status, artifact_type,
              source_pack_hash, source_dataset_version, generator_version, generated_by)
           values ($1, $2, $3, 'candidate', 'NexusHomeLandscapeV1', $4, $5, $6, $7)
           returning id`,
          [
            tenantKey,
            tenantKey,
            BUILD_VERSION,
            INPUT_SOURCE,
            INPUT_SOURCE,
            GENERATOR_VERSION,
            "refresh-home-landscape",
          ],
        );
        const packId = pack.rows[0].id;
        summary.packsWritten += 1;
        for (const [i, d] of dims.entries()) {
          await client.query(
            `insert into public.home_knowledge_dimensions
               (pack_id, tenant_key, dimension_key, display_name, record_count,
                evidence_count, confidence_status, sources, metadata, sort_order)
             values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10)`,
            [
              packId,
              tenantKey,
              d.dimensionKey,
              d.displayName,
              d.recordCount,
              d.evidenceCount,
              d.confidenceStatus,
              JSON.stringify([{ objectType: d.objectType, layer: "canonical" }]),
              JSON.stringify({
                buildVersion: BUILD_VERSION,
                inputSourceVersion: INPUT_SOURCE,
                objectType: d.objectType,
                section: d.section,
                products: d.products,
                distinctNameCount: d.distinctNameCount,
                sampleEntities: d.sampleEntities,
              }),
              i,
            ],
          );
          summary.dimensionRowsWritten += 1;
        }
      }
      // Read back inside the transaction, before commit: if the destination does not match what
      // we claim to have written, roll back rather than leave a half-truth behind.
      const back = await client.query<{ n: string }>(
        `select count(*)::text as n
           from public.home_knowledge_dimensions d
           join public.home_knowledge_packs p on p.id = d.pack_id
          where p.pack_version = $1 and p.generator_version = $2`,
        [BUILD_VERSION, GENERATOR_VERSION],
      );
      summary.readbackDimensionRows = Number(back.rows[0].n);
      if (summary.readbackDimensionRows !== summary.dimensionRowsWritten) {
        throw new Error(
          `readback ${summary.readbackDimensionRows} does not equal written ${summary.dimensionRowsWritten}`,
        );
      }
      await client.query("commit");
      summary.productReadModelsUpdated = true;
    } catch (error) {
      await client.query("rollback").catch(() => undefined);
      throw error;
    } finally {
      await client.end();
    }
  }

  fs.mkdirSync(path.resolve(OUT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(path.resolve(OUT_DIR), "summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
  );
  console.log(JSON.stringify(summary, null, 2));
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error("refresh-home-landscape failed:", error);
    process.exit(1);
  });
