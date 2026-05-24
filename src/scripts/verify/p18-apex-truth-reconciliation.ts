import { Client } from "pg";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { postgresClientOptions } from "../postgres-client-options";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv();

type ApexClientRow = {
  id: string;
  name: string;
  tenant_key: string | null;
  slug: string | null;
  annual_revenue_usd: string | null;
  employee_count: number | null;
  it_budget_usd: string | null;
};

type SapRow = {
  id: string;
  vendor_name: string;
  product_name: string | null;
  status: string | null;
  annual_spend_usd: string | null;
  metadata: Record<string, unknown>;
};

type InitiativeRow = {
  initiative_id: string;
  name: string;
  stage: string;
  stage_detail: string | null;
  committed_total_usd: string | null;
  status_flag: string;
  metadata: Record<string, unknown>;
};

type CountRow = { count: number };

function asNumber(value: string | number | null): number | null {
  if (value === null) return null;
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function assertEqual<T>(
  label: string,
  actual: T,
  expected: T,
  failures: string[],
) {
  if (actual !== expected) {
    failures.push(
      `${label}: expected ${String(expected)}, got ${String(actual)}`,
    );
  }
}

function assertTruthy(label: string, condition: unknown, failures: string[]) {
  if (!condition) failures.push(label);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "x DATABASE_URL is required for P18 Apex truth verification.",
    );
    process.exit(1);
  }

  const client = new Client(
    postgresClientOptions(url, "verify-p18-apex-truth-reconciliation"),
  );
  await client.connect();

  const failures: string[] = [];

  try {
    const apexResult = await client.query<ApexClientRow>(
      `
        SELECT
          id::text,
          name,
          tenant_key,
          slug,
          annual_revenue_usd::text,
          employee_count,
          it_budget_usd::text
        FROM public.clients
        WHERE tenant_key = ANY($1)
           OR slug = ANY($1)
           OR name ILIKE '%Apex Retail%'
        ORDER BY CASE WHEN tenant_key = 'apex-retail' THEN 0 WHEN tenant_key = 'apexretail' THEN 1 ELSE 2 END
        LIMIT 1
      `,
      [["apex-retail", "apexretail"]],
    );

    const apex = apexResult.rows[0];
    assertTruthy("Apex client row exists", apex, failures);
    if (!apex) {
      throw new Error("Apex client row missing.");
    }

    assertEqual(
      "Apex annual revenue",
      asNumber(apex.annual_revenue_usd),
      24800000000,
      failures,
    );
    assertEqual("Apex employee count", apex.employee_count, 96000, failures);
    assertEqual(
      "Apex IT budget",
      asNumber(apex.it_budget_usd),
      545000000,
      failures,
    );

    const sapResult = await client.query<SapRow>(
      `
        SELECT
          id::text,
          vendor_name,
          product_name,
          status,
          annual_spend_usd::text,
          metadata
        FROM public.tech_stack_items
        WHERE client_id = $1
          AND lower(vendor_name) = 'sap'
        ORDER BY annual_spend_usd DESC NULLS LAST, created_at ASC
        LIMIT 1
      `,
      [apex.id],
    );

    const sap = sapResult.rows[0];
    assertTruthy("Apex SAP tech_stack_items row exists", sap, failures);
    if (!sap) {
      throw new Error("Apex SAP tech_stack_items row missing.");
    }

    assertEqual("SAP product", sap.product_name, "SAP ECC 6.0", failures);
    assertEqual("SAP status", sap.status, "mature_with_debt", failures);
    assertEqual(
      "SAP annual spend",
      asNumber(sap.annual_spend_usd),
      22000000,
      failures,
    );
    assertEqual(
      "SAP migration decision pending",
      sap.metadata.migration_decision_pending,
      true,
      failures,
    );
    assertEqual(
      "SAP customizations",
      sap.metadata.customizations,
      8400,
      failures,
    );
    assertEqual(
      "SAP future move id",
      sap.metadata.future_decision_move_id,
      "APX-ERP-FUTURE-2027",
      failures,
    );

    const s4Result = await client.query<CountRow>(
      `
        SELECT count(*)::int
        FROM public.tech_stack_items
        WHERE client_id = $1
          AND lower(vendor_name) = 'sap'
          AND product_name ILIKE '%S/4%'
      `,
      [apex.id],
    );
    assertEqual(
      "SAP S/4HANA current-state tech rows",
      s4Result.rows[0]?.count ?? -1,
      0,
      failures,
    );

    const initiativeResult = await client.query<InitiativeRow>(
      `
        SELECT
          initiative_id,
          name,
          stage,
          stage_detail,
          committed_total_usd::text,
          status_flag,
          metadata
        FROM public.ai_initiatives
        WHERE initiative_id = 'APX-ERP-FUTURE-2027'
          AND client_id = $1
      `,
      [apex.id],
    );

    const initiative = initiativeResult.rows[0];
    assertTruthy(
      "SAP ERP Future Decision initiative exists",
      initiative,
      failures,
    );
    if (!initiative) {
      throw new Error("SAP ERP Future Decision initiative missing.");
    }

    assertEqual(
      "ERP initiative stage",
      initiative.stage,
      "in_strategic_move",
      failures,
    );
    assertEqual(
      "ERP initiative stage detail",
      initiative.stage_detail,
      "in_scoping",
      failures,
    );
    assertEqual(
      "ERP initiative committed total",
      asNumber(initiative.committed_total_usd),
      14000000,
      failures,
    );
    assertEqual(
      "ERP initiative status flag",
      initiative.status_flag,
      "foundation_phase",
      failures,
    );
    assertEqual(
      "ERP initiative metadata status",
      initiative.metadata.status,
      "in_scoping",
      failures,
    );
    assertEqual(
      "ERP initiative program low estimate",
      (
        initiative.metadata.projected_full_program_usd as
          | Record<string, unknown>
          | undefined
      )?.low,
      80000000,
      failures,
    );
    assertEqual(
      "ERP initiative program high estimate",
      (
        initiative.metadata.projected_full_program_usd as
          | Record<string, unknown>
          | undefined
      )?.high,
      120000000,
      failures,
    );

    const auditResult = await client.query<CountRow>(
      `
        SELECT count(*)::int
        FROM public.admin_audit_log
        WHERE client_id = $1
          AND category = 'dataset'
          AND action = ANY($2)
      `,
      [
        apex.id,
        [
          "packet18.apex.client_profile_reconciled",
          "packet18.apex.sap_reconciled",
          "packet18.apex.erp_future_move_upserted",
        ],
      ],
    );
    assertEqual(
      "Packet 18 audit rows",
      auditResult.rows[0]?.count ?? -1,
      3,
      failures,
    );

    if (failures.length > 0) {
      console.error("x P18 Apex truth reconciliation verification failed:");
      for (const failure of failures) console.error(`  - ${failure}`);
      process.exit(1);
    }

    console.log("✓ P18 Apex truth reconciliation verified");
    console.log(
      JSON.stringify(
        {
          client: {
            id: apex.id,
            name: apex.name,
            tenantKey: apex.tenant_key,
            slug: apex.slug,
            annualRevenueUsd: asNumber(apex.annual_revenue_usd),
            employees: apex.employee_count,
            itBudgetUsd: asNumber(apex.it_budget_usd),
          },
          sap: {
            id: sap.id,
            vendor: sap.vendor_name,
            product: sap.product_name,
            status: sap.status,
            annualSpendUsd: asNumber(sap.annual_spend_usd),
            migrationDecisionPending: sap.metadata.migration_decision_pending,
          },
          initiative: {
            initiativeId: initiative.initiative_id,
            name: initiative.name,
            stage: initiative.stage,
            stageDetail: initiative.stage_detail,
            committedTotalUsd: asNumber(initiative.committed_total_usd),
          },
          auditRows: auditResult.rows[0]?.count ?? 0,
        },
        null,
        2,
      ),
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("x P18 Apex truth reconciliation verification failed.");
  console.error(error);
  process.exit(1);
});
