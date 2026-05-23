#!/usr/bin/env -S npx tsx

import * as path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import { postgresClientOptions } from '../../src/scripts/postgres-client-options';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv({ path: '/Users/anand/Projects/nexus/.env.local' });
loadEnv();

type VendorContractSeed = {
  vendor_id: string;
  vendor_name: string;
  contract_name: string;
  contract_category: string;
  scope_summary: string;
  annual_contract_value_usd: number;
  start_date: string;
  end_date: string;
  renewal_date: string;
  ai_usage_clauses: boolean;
  indemnity_provided: boolean;
  exit_terms_jsonb: Record<string, unknown>;
  concentration_pct: number;
  rate_card_vintage: string;
  outcome_based: boolean;
};

type ApplicationSeed = {
  app_id: string;
  name: string;
  stack: string;
  language: string;
  is_modern: boolean;
  change_rate_per_yr: number;
  fte_count: number;
  criticality_tier: number;
  time_classification: 'tolerate' | 'invest' | 'migrate' | 'eliminate';
  annual_run_cost_usd: number;
  ams_vendor_id: string | null;
  ams_contract_value_usd: number;
  sunset_decision_date: string | null;
  ai_fit_score: number;
};

type TeamSeed = {
  team_id: string;
  name: string;
  type: 'stream' | 'platform' | 'enabling' | 'complicated_subsystem';
  size_fte: number;
  span_of_control: number;
  geo: string;
  owning_apps: string[];
  maturity_stage: number;
};

type RoleSeed = {
  role_id: string;
  title: string;
  fte_count: number;
  source: 'fte' | 'contractor' | 'si' | 'gcc';
  geo: string;
  ladder_level: string;
  function_area: string;
};

type DoraSeed = {
  team_id: string;
  app_id: string | null;
  measured_at: string;
  deploy_freq_per_week: number;
  lead_time_hours: number;
  mttr_hours: number;
  change_failure_rate_pct: number;
  reliability_pct: number;
};

type SpaceSeed = {
  team_id: string;
  surveyed_at: string;
  responses_jsonb: Record<string, unknown>;
  n_responses: number;
  satisfaction_score: number;
  performance_score: number;
  activity_score: number;
  collab_score: number;
  efficiency_score: number;
};

type AiToolSeed = {
  tool_name: string;
  vendor: string;
  licensed_seats: number;
  activated_seats: number;
  dau: number;
  mau: number;
  annual_cost_usd: number;
  contract_end_date: string;
  indemnity_status: string;
  retention_policy: string;
};

type InfraContractSeed = {
  contract_id: string;
  vendor_name: string;
  service_tower: 'network' | 'datacenter' | 'cloud_ops' | 'security_ops' | 'aiops' | 'finops';
  scope_summary: string;
  annual_contract_value_usd: number;
  start_date: string;
  end_date: string;
  renewal_date: string;
  aiops_coverage_pct: number;
  outcome_based: boolean;
  concentration_pct: number;
  exit_terms_jsonb: Record<string, unknown>;
};

const SEED_ACTOR = 'p2-client-data-seed';

function databaseUrl(): string {
  const url = process.env.DATABASE_URL ?? process.env.AZURE_LAB_DATABASE_URL ?? '';
  if (!url.trim()) {
    throw new Error('Missing DATABASE_URL or AZURE_LAB_DATABASE_URL.');
  }
  return url.trim();
}

function money(base: number, jitter: number): number {
  return Math.round(base + jitter);
}

function asJson(rows: readonly unknown[]): string {
  return JSON.stringify(rows);
}

function appId(n: number): string {
  return `apx-app-${String(n).padStart(3, '0')}`;
}

async function ensureApexClient(client: Client): Promise<string> {
  await client.query(`
    INSERT INTO clients (name, legal_name, industry_code, tenant_key)
    SELECT 'Apex Retail', 'Apex Retail Group LLC', 'RETAIL', 'apex-retail'
    WHERE NOT EXISTS (
      SELECT 1 FROM clients
      WHERE name = 'Apex Retail'
         OR tenant_key IN ('apex-retail', 'apexretail')
    )
  `);

  await client.query(`
    UPDATE clients
       SET name = 'Apex Retail',
           legal_name = COALESCE(legal_name, 'Apex Retail Group LLC'),
           industry_code = COALESCE(industry_code, 'RETAIL'),
           tenant_key = 'apex-retail',
           updated_at = now()
     WHERE name = 'Apex Retail'
        OR tenant_key IN ('apex-retail', 'apexretail')
  `);

  const { rows } = await client.query<{ id: string }>(
    `
      SELECT id
        FROM clients
       WHERE tenant_key = 'apex-retail'
          OR name = 'Apex Retail'
       ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
       LIMIT 1
    `,
  );
  if (!rows[0]) throw new Error('Unable to resolve Apex Retail client_id.');
  return rows[0].id;
}

async function clearExisting(client: Client, clientId: string): Promise<void> {
  const tables = [
    'risk_register',
    'kill_criteria',
    'value_states',
    'move_dependencies',
    'discovery_instruments',
    'dora_baselines',
    'space_devex_surveys',
    'application_portfolio',
    'org_topology',
    'roles_inventory',
    'ai_tool_footprint',
    'infra_ms_contracts',
    'vendor_contracts',
  ];

  for (const table of tables) {
    await client.query(`DELETE FROM ${table} WHERE client_id = $1`, [clientId]);
  }
}

function vendorContracts(): VendorContractSeed[] {
  return [
    ['wipro-ams', 'Wipro', 'Retail L1 AMS and store support', 'ams', 'L1 application support across POS, merchandising, store ops, and field incident triage.', 14_800_000, 21, true, false],
    ['kyndryl-mainframe', 'Kyndryl', 'AS/400 and mainframe AMS', 'ams', 'Legacy inventory, finance, and batch operations support with sunset-assistance terms.', 12_400_000, 18, false, true],
    ['tcs-digital', 'TCS', 'Digital commerce engineering pod', 'ams', 'Managed engineering for web, mobile, and loyalty releases.', 9_600_000, 13, true, true],
    ['infosys-data', 'Infosys', 'Data platform managed services', 'ams', 'Snowflake, dbt, and reporting pipeline support.', 7_900_000, 10, true, true],
    ['accenture-sap', 'Accenture', 'SAP retail transformation support', 'si', 'SAP S/4 retail advisory and integration support.', 11_300_000, 9, true, true],
    ['deloitte-cdp', 'Deloitte', 'Customer data platform advisory', 'si', 'CDP activation, privacy segmentation, and marketing analytics governance.', 4_400_000, 5, true, true],
    ['oracle-retail', 'Oracle', 'Oracle Retail suite support', 'software', 'Merchandising, allocation, and planning support.', 8_100_000, 7, false, true],
    ['salesforce', 'Salesforce', 'Commerce and service cloud enterprise agreement', 'software', 'Commerce Cloud, Service Cloud, and Data Cloud seats.', 6_900_000, 6, true, true],
    ['microsoft', 'Microsoft', 'M365 E5 and GitHub enterprise', 'software', 'M365, GitHub Enterprise, and Copilot commercial terms.', 10_700_000, 8, true, true],
    ['aws', 'AWS', 'AWS enterprise discount program', 'cloud', 'Cloud hosting for ecommerce, data, and digital workloads.', 18_500_000, 15, true, true],
    ['snowflake', 'Snowflake', 'Enterprise data platform consumption', 'software', 'Warehouse consumption, governance, and support.', 5_700_000, 4, true, true],
    ['datadog', 'Datadog', 'Observability platform', 'software', 'APM, logs, synthetics, and cloud-cost observability.', 2_200_000, 3, true, true],
    ['servicenow', 'ServiceNow', 'ITSM and SAM Pro', 'software', 'ITSM, SAM, asset, and workflow automation.', 4_800_000, 5, true, true],
    ['okta', 'Okta', 'Identity services', 'software', 'Workforce identity, lifecycle, and privileged app access.', 1_900_000, 2, true, true],
    ['paloalto', 'Palo Alto Networks', 'Security platform subscription', 'security', 'SASE, cloud posture, and firewall services.', 3_600_000, 4, true, true],
    ['cisco', 'Cisco', 'Enterprise network agreement', 'network', 'Store, DC, campus network hardware and support.', 5_100_000, 5, false, true],
    ['zebra', 'Zebra Technologies', 'Store device estate support', 'hardware', 'Handheld scanners, printers, and device management.', 2_700_000, 3, false, false],
    ['blueyonder', 'Blue Yonder', 'Supply chain planning support', 'software', 'Demand forecasting, replenishment, and planning support.', 4_200_000, 4, false, true],
    ['manhattan', 'Manhattan Associates', 'WMS support', 'software', 'Warehouse management support and DC automation integrations.', 3_800_000, 3, false, true],
    ['adyen', 'Adyen', 'Payment processing platform', 'payments', 'Omnichannel payment processing and fraud controls.', 6_300_000, 5, true, true],
    ['fiserv', 'Fiserv', 'Legacy payment gateway support', 'payments', 'Legacy payment gateway for older store lanes.', 2_600_000, 3, false, false],
    ['hashicorp', 'HashiCorp', 'Terraform enterprise', 'software', 'IaC governance, module registry, and policy controls.', 900_000, 1, true, true],
    ['atlassian', 'Atlassian', 'Jira and Confluence enterprise', 'software', 'Delivery workflow, knowledge base, and portfolio planning.', 1_500_000, 2, true, true],
    ['github-copilot', 'GitHub', 'GitHub Copilot business pilot', 'ai_tooling', 'Copilot seats for engineering and platform teams.', 78_000, 1, true, true],
    ['cursor', 'Anysphere', 'Cursor enterprise pilot', 'ai_tooling', 'Cursor pilot for digital and data engineering squads.', 24_000, 1, true, false],
  ].map(([vendor_id, vendor_name, contract_name, contract_category, scope_summary, value, concentration, ai, indemnity], index) => ({
    vendor_id: String(vendor_id),
    vendor_name: String(vendor_name),
    contract_name: String(contract_name),
    contract_category: String(contract_category),
    scope_summary: String(scope_summary),
    annual_contract_value_usd: Number(value),
    start_date: `${2024 + (index % 2)}-${String((index % 9) + 1).padStart(2, '0')}-01`,
    end_date: `202${6 + (index % 3)}-${String(((index + 4) % 12) + 1).padStart(2, '0')}-28`,
    renewal_date: `202${6 + (index % 3)}-${String(((index + 3) % 12) + 1).padStart(2, '0')}-15`,
    ai_usage_clauses: Boolean(ai),
    indemnity_provided: Boolean(indemnity),
    exit_terms_jsonb: {
      notice_days: index % 3 === 0 ? 180 : 90,
      transition_assistance_months: index % 4 === 0 ? 9 : 6,
      data_return_required: true,
      source_code_escrow: index % 5 === 0,
    },
    concentration_pct: Number(concentration),
    rate_card_vintage: `${2023 + (index % 3)}-01-01`,
    outcome_based: index % 5 === 0 || contract_category === 'ams',
  }));
}

function applications(): ApplicationSeed[] {
  const modernDomains = ['POS', 'Ecommerce', 'Supply Chain', 'Store Ops', 'CDP Analytics'];
  const modernStacks = [
    ['Next.js / Node / Azure Postgres', 'TypeScript'],
    ['React Native / GraphQL', 'TypeScript'],
    ['Kafka / Flink / AKS', 'Java'],
    ['Databricks / dbt / Snowflake', 'SQL/Python'],
    ['Spring Boot / Kubernetes', 'Java'],
  ];
  const legacyStacks = [
    ['WebSphere / Oracle', 'Java'],
    ['IIS / SQL Server', 'C#/.NET Framework'],
  ];
  const mainframeStacks = [
    ['IBM i / DB2', 'RPG'],
    ['AS/400 batch', 'COBOL/RPG'],
  ];
  const timeClasses = [
    ...Array<'tolerate'>(30).fill('tolerate'),
    ...Array<'invest'>(40).fill('invest'),
    ...Array<'migrate'>(20).fill('migrate'),
    ...Array<'eliminate'>(10).fill('eliminate'),
  ];
  const rows: ApplicationSeed[] = [];

  for (let i = 1; i <= 100; i += 1) {
    const idx = i - 1;
    const time = timeClasses[idx];
    if (i <= 70) {
      const domain = modernDomains[idx % modernDomains.length];
      const [stack, language] = modernStacks[idx % modernStacks.length];
      rows.push({
        app_id: appId(i),
        name: `Apex ${domain} ${idx % 2 === 0 ? 'Platform' : 'Service'} ${String(Math.floor(idx / modernDomains.length) + 1).padStart(2, '0')}`,
        stack,
        language,
        is_modern: true,
        change_rate_per_yr: 18 + ((idx * 7) % 74),
        fte_count: 2 + ((idx * 3) % 17),
        criticality_tier: (idx % 9 === 0 ? 1 : idx % 4 === 0 ? 2 : idx % 3 === 0 ? 3 : 4),
        time_classification: time,
        annual_run_cost_usd: money(280_000, (idx % 11) * 82_000),
        ams_vendor_id: idx % 6 === 0 ? 'tcs-digital' : idx % 5 === 0 ? 'infosys-data' : null,
        ams_contract_value_usd: idx % 6 === 0 ? 180_000 : idx % 5 === 0 ? 140_000 : 0,
        sunset_decision_date: null,
        ai_fit_score: 62 + ((idx * 5) % 34),
      });
    } else if (i <= 90) {
      const legacyIdx = i - 71;
      const [stack, language] = legacyStacks[legacyIdx % legacyStacks.length];
      rows.push({
        app_id: appId(i),
        name: `Apex Legacy ${legacyIdx % 2 === 0 ? 'Merchandising' : 'Finance'} ${String(legacyIdx + 1).padStart(2, '0')}`,
        stack,
        language,
        is_modern: false,
        change_rate_per_yr: 4 + ((legacyIdx * 3) % 13),
        fte_count: 3 + ((legacyIdx * 2) % 12),
        criticality_tier: legacyIdx % 3 === 0 ? 1 : 2,
        time_classification: time,
        annual_run_cost_usd: money(620_000, (legacyIdx % 8) * 95_000),
        ams_vendor_id: legacyIdx % 2 === 0 ? 'wipro-ams' : 'oracle-retail',
        ams_contract_value_usd: 260_000 + (legacyIdx % 5) * 45_000,
        sunset_decision_date: legacyIdx % 4 === 0 ? '2027-12-31' : null,
        ai_fit_score: 38 + ((legacyIdx * 4) % 28),
      });
    } else {
      const mfIdx = i - 91;
      const [stack, language] = mainframeStacks[mfIdx % mainframeStacks.length];
      rows.push({
        app_id: appId(i),
        name: `Apex AS/400 ${mfIdx < 5 ? 'Inventory' : 'Finance'} Core ${String(mfIdx + 1).padStart(2, '0')}`,
        stack,
        language,
        is_modern: false,
        change_rate_per_yr: 1 + (mfIdx % 5),
        fte_count: 4 + (mfIdx % 9),
        criticality_tier: mfIdx % 2 === 0 ? 1 : 2,
        time_classification: time,
        annual_run_cost_usd: money(880_000, (mfIdx % 6) * 125_000),
        ams_vendor_id: 'kyndryl-mainframe',
        ams_contract_value_usd: 410_000 + (mfIdx % 4) * 70_000,
        sunset_decision_date: '2028-06-30',
        ai_fit_score: 22 + ((mfIdx * 3) % 20),
      });
    }
  }

  return rows;
}

function teams(apps: readonly ApplicationSeed[]): TeamSeed[] {
  const appsBy = (start: number, count: number) => apps.slice(start, start + count).map((app) => app.app_id);
  return [
    { team_id: 'apx-team-store-commerce', name: 'Store Commerce Stream', type: 'stream', size_fte: 42, span_of_control: 7, geo: 'US / India', owning_apps: appsBy(0, 10), maturity_stage: 4 },
    { team_id: 'apx-team-digital-cart', name: 'Digital Cart and Checkout Stream', type: 'stream', size_fte: 36, span_of_control: 6, geo: 'US / Brazil', owning_apps: appsBy(10, 10), maturity_stage: 4 },
    { team_id: 'apx-team-supply-chain', name: 'Supply Chain Flow Stream', type: 'stream', size_fte: 39, span_of_control: 7, geo: 'US / Poland', owning_apps: appsBy(20, 11), maturity_stage: 3 },
    { team_id: 'apx-team-store-ops', name: 'Store Operations Stream', type: 'stream', size_fte: 31, span_of_control: 6, geo: 'US / Mexico', owning_apps: appsBy(31, 10), maturity_stage: 3 },
    { team_id: 'apx-team-cdp-loyalty', name: 'Customer Data and Loyalty Stream', type: 'stream', size_fte: 28, span_of_control: 5, geo: 'US / Canada', owning_apps: appsBy(41, 9), maturity_stage: 4 },
    { team_id: 'apx-team-merch-planning', name: 'Merchandising Planning Stream', type: 'stream', size_fte: 34, span_of_control: 6, geo: 'US / India', owning_apps: appsBy(50, 10), maturity_stage: 3 },
    { team_id: 'apx-team-platform-engineering', name: 'Platform Engineering', type: 'platform', size_fte: 30, span_of_control: 6, geo: 'US / India', owning_apps: appsBy(60, 5), maturity_stage: 4 },
    { team_id: 'apx-team-data-platform', name: 'Data Platform', type: 'platform', size_fte: 26, span_of_control: 5, geo: 'US / Poland', owning_apps: appsBy(65, 5), maturity_stage: 4 },
    { team_id: 'apx-team-devex', name: 'Developer Experience Enablement', type: 'enabling', size_fte: 14, span_of_control: 5, geo: 'US', owning_apps: [], maturity_stage: 3 },
    { team_id: 'apx-team-security-enablement', name: 'Secure SDLC Enablement', type: 'enabling', size_fte: 12, span_of_control: 4, geo: 'US / India', owning_apps: [], maturity_stage: 3 },
    { team_id: 'apx-team-legacy-retail-core', name: 'Legacy Retail Core Subsystem', type: 'complicated_subsystem', size_fte: 22, span_of_control: 5, geo: 'US / India', owning_apps: appsBy(70, 20), maturity_stage: 2 },
    { team_id: 'apx-team-mainframe-inventory-finance', name: 'Mainframe Inventory and Finance Subsystem', type: 'complicated_subsystem', size_fte: 18, span_of_control: 4, geo: 'US / Kyndryl', owning_apps: appsBy(90, 10), maturity_stage: 2 },
  ];
}

function roles(): RoleSeed[] {
  const titles = [
    ['Principal Engineer', 'L6', 'Engineering'],
    ['Senior Software Engineer', 'L5', 'Engineering'],
    ['Software Engineer', 'L4', 'Engineering'],
    ['Staff Data Engineer', 'L6', 'Data'],
    ['Data Engineer', 'L4', 'Data'],
    ['Platform Engineer', 'L5', 'Platform'],
    ['SRE', 'L5', 'Reliability'],
    ['QA Automation Engineer', 'L4', 'Quality'],
    ['Product Manager', 'L5', 'Product'],
    ['Scrum Master', 'L4', 'Delivery'],
    ['Security Engineer', 'L5', 'Security'],
    ['Mainframe Developer', 'L5', 'Legacy'],
    ['Business Systems Analyst', 'L4', 'Analysis'],
    ['Release Manager', 'L5', 'Delivery'],
  ] as const;
  const geos = ['US', 'India', 'Poland', 'Brazil', 'Mexico', 'Canada'];
  const rows: RoleSeed[] = [];
  for (let i = 0; i < 200; i += 1) {
    const [title, ladder, area] = titles[i % titles.length];
    const source = i < 120 ? 'fte' : i < 150 ? 'contractor' : i < 180 ? 'si' : 'gcc';
    rows.push({
      role_id: `apx-role-${String(i + 1).padStart(3, '0')}`,
      title,
      fte_count: i % 17 === 0 ? 0.5 : 1,
      source,
      geo: geos[(i * 3 + Math.floor(i / 11)) % geos.length],
      ladder_level: ladder,
      function_area: area,
    });
  }
  return rows;
}

function doraRows(teamRows: readonly TeamSeed[]): DoraSeed[] {
  const measuredDates = ['2026-04-06', '2026-04-13', '2026-04-20', '2026-04-27', '2026-05-04', '2026-05-11'];
  const rows: DoraSeed[] = [];
  teamRows.forEach((team, teamIndex) => {
    measuredDates.forEach((date, weekIndex) => {
      const modernBias = team.type === 'stream' || team.type === 'platform';
      const deployBase = modernBias ? 4.2 : team.type === 'enabling' ? 2.4 : 0.6;
      rows.push({
        team_id: team.team_id,
        app_id: team.owning_apps[weekIndex % Math.max(team.owning_apps.length, 1)] ?? null,
        measured_at: `${date}T09:00:00.000Z`,
        deploy_freq_per_week: Number((deployBase + weekIndex * 0.18 + (teamIndex % 3) * 0.22).toFixed(2)),
        lead_time_hours: Number(((modernBias ? 38 : 124) - weekIndex * (modernBias ? 1.8 : 2.6) + teamIndex * 1.1).toFixed(2)),
        mttr_hours: Number(((modernBias ? 8.5 : 23) - weekIndex * 0.35 + (teamIndex % 4) * 0.6).toFixed(2)),
        change_failure_rate_pct: Number(((modernBias ? 10.5 : 18.5) - weekIndex * 0.25 + (teamIndex % 5) * 0.35).toFixed(2)),
        reliability_pct: Number(((modernBias ? 99.25 : 98.1) + weekIndex * 0.03 - (teamIndex % 4) * 0.04).toFixed(2)),
      });
    });
  });
  return rows;
}

function spaceRows(teamRows: readonly TeamSeed[]): SpaceSeed[] {
  return teamRows.map((team, index) => {
    const base = team.type === 'stream' ? 72 : team.type === 'platform' ? 76 : team.type === 'enabling' ? 69 : 58;
    return {
      team_id: team.team_id,
      surveyed_at: '2026-05-15T17:00:00.000Z',
      responses_jsonb: {
        instrument: 'Apex IT Productivity SPACE v1',
        response_window: '2026-05-01/2026-05-15',
        top_friction: index % 3 === 0 ? 'environment wait time' : index % 3 === 1 ? 'legacy regression burden' : 'approval latency',
        ai_usage_note: index < 8 ? 'pilot users report faster test generation and code search' : 'limited AI fit due to legacy surface area',
      },
      n_responses: Math.max(6, Math.round(team.size_fte * 0.55)),
      satisfaction_score: base + (index % 5),
      performance_score: base - 2 + (index % 4),
      activity_score: base + 4 - (index % 6),
      collab_score: base - 1 + (index % 5),
      efficiency_score: base - 3 + (index % 7),
    };
  });
}

function aiTools(): AiToolSeed[] {
  return [
    {
      tool_name: 'GitHub Copilot Business',
      vendor: 'GitHub',
      licensed_seats: 200,
      activated_seats: 130,
      dau: 80,
      mau: 118,
      annual_cost_usd: 78_000,
      contract_end_date: '2027-03-31',
      indemnity_status: 'covered by Microsoft Customer Copyright Commitment for eligible use',
      retention_policy: 'enterprise prompts not retained for model training; admin telemetry retained 24 months',
    },
    {
      tool_name: 'Cursor Enterprise Pilot',
      vendor: 'Anysphere',
      licensed_seats: 50,
      activated_seats: 45,
      dau: 38,
      mau: 44,
      annual_cost_usd: 24_000,
      contract_end_date: '2026-11-30',
      indemnity_status: 'pilot terms under legal review; no broad indemnity yet',
      retention_policy: 'privacy mode required; local code indexing allowed for approved repos only',
    },
  ];
}

function infraContracts(): InfraContractSeed[] {
  return [
    ['infra-wipro-l1', 'Wipro', 'security_ops', '24x7 L1 monitoring, ticket triage, and store incident dispatch.', 6_200_000, 35, false, 13],
    ['infra-kyndryl-mainframe', 'Kyndryl', 'datacenter', 'Mainframe hosting, batch operations, backup, and recovery drills.', 9_800_000, 28, false, 18],
    ['infra-aws-managed', 'AWS Managed Services', 'cloud_ops', 'AWS managed operations, patch coordination, and landing-zone guardrails.', 7_600_000, 62, true, 15],
    ['infra-cisco-network', 'Cisco CX', 'network', 'Store network support, SD-WAN lifecycle, and hardware replacement.', 4_900_000, 41, false, 10],
    ['infra-paloalto-soc', 'Palo Alto Networks', 'security_ops', 'SASE operations, firewall rule hygiene, and incident escalation.', 3_700_000, 48, true, 8],
    ['infra-equinix-dc', 'Equinix', 'datacenter', 'Co-location, cross-connects, and data center facilities operations.', 3_300_000, 18, false, 7],
    ['infra-datadog-aiops', 'Datadog', 'aiops', 'AIOps event correlation, observability telemetry, and incident analytics.', 2_100_000, 55, true, 4],
    ['infra-apptio-finops', 'Apptio', 'finops', 'Cloud cost allocation, showback, and commitment planning support.', 1_400_000, 45, true, 3],
  ].map(([contract_id, vendor_name, service_tower, scope_summary, value, aiops, outcome, concentration], index) => ({
    contract_id: String(contract_id),
    vendor_name: String(vendor_name),
    service_tower: service_tower as InfraContractSeed['service_tower'],
    scope_summary: String(scope_summary),
    annual_contract_value_usd: Number(value),
    start_date: `${2024 + (index % 2)}-0${(index % 6) + 1}-01`,
    end_date: `202${6 + (index % 3)}-${String(((index + 6) % 12) + 1).padStart(2, '0')}-28`,
    renewal_date: `202${6 + (index % 3)}-${String(((index + 5) % 12) + 1).padStart(2, '0')}-15`,
    aiops_coverage_pct: Number(aiops),
    outcome_based: Boolean(outcome),
    concentration_pct: Number(concentration),
    exit_terms_jsonb: {
      notice_days: index % 2 === 0 ? 120 : 90,
      transition_assistance_months: index % 3 === 0 ? 9 : 6,
      runbook_export_required: true,
    },
  }));
}

async function insertVendorContracts(client: Client, clientId: string, rows: readonly VendorContractSeed[]): Promise<void> {
  await client.query(
    `
      INSERT INTO vendor_contracts (
        client_id, vendor_id, vendor_name, contract_name, contract_category, scope_summary,
        annual_contract_value_usd, start_date, end_date, renewal_date, ai_usage_clauses,
        indemnity_provided, exit_terms_jsonb, concentration_pct, rate_card_vintage,
        outcome_based, created_by, updated_by
      )
      SELECT
        $1, vendor_id, vendor_name, contract_name, contract_category, scope_summary,
        annual_contract_value_usd, start_date, end_date, renewal_date, ai_usage_clauses,
        indemnity_provided, exit_terms_jsonb, concentration_pct, rate_card_vintage,
        outcome_based, $2, $2
      FROM jsonb_to_recordset($3::jsonb) AS x(
        vendor_id text,
        vendor_name text,
        contract_name text,
        contract_category text,
        scope_summary text,
        annual_contract_value_usd numeric,
        start_date date,
        end_date date,
        renewal_date date,
        ai_usage_clauses boolean,
        indemnity_provided boolean,
        exit_terms_jsonb jsonb,
        concentration_pct numeric,
        rate_card_vintage date,
        outcome_based boolean
      )
      ON CONFLICT (client_id, vendor_id) DO UPDATE SET
        vendor_name = excluded.vendor_name,
        contract_name = excluded.contract_name,
        contract_category = excluded.contract_category,
        scope_summary = excluded.scope_summary,
        annual_contract_value_usd = excluded.annual_contract_value_usd,
        start_date = excluded.start_date,
        end_date = excluded.end_date,
        renewal_date = excluded.renewal_date,
        ai_usage_clauses = excluded.ai_usage_clauses,
        indemnity_provided = excluded.indemnity_provided,
        exit_terms_jsonb = excluded.exit_terms_jsonb,
        concentration_pct = excluded.concentration_pct,
        rate_card_vintage = excluded.rate_card_vintage,
        outcome_based = excluded.outcome_based,
        updated_by = excluded.updated_by,
        updated_at = now(),
        deleted_at = null
    `,
    [clientId, SEED_ACTOR, asJson(rows)],
  );
}

async function insertApplications(client: Client, clientId: string, rows: readonly ApplicationSeed[]): Promise<void> {
  await client.query(
    `
      INSERT INTO application_portfolio (
        client_id, app_id, name, stack, language, is_modern, change_rate_per_yr,
        fte_count, criticality_tier, time_classification, annual_run_cost_usd,
        ams_vendor_id, ams_contract_value_usd, sunset_decision_date, ai_fit_score,
        created_by, updated_by
      )
      SELECT
        $1, app_id, name, stack, language, is_modern, change_rate_per_yr,
        fte_count, criticality_tier, time_classification::app_time_classification,
        annual_run_cost_usd, ams_vendor_id, ams_contract_value_usd,
        sunset_decision_date, ai_fit_score, $2, $2
      FROM jsonb_to_recordset($3::jsonb) AS x(
        app_id text,
        name text,
        stack text,
        language text,
        is_modern boolean,
        change_rate_per_yr integer,
        fte_count numeric,
        criticality_tier smallint,
        time_classification text,
        annual_run_cost_usd numeric,
        ams_vendor_id text,
        ams_contract_value_usd numeric,
        sunset_decision_date date,
        ai_fit_score numeric
      )
      ON CONFLICT (client_id, app_id) DO UPDATE SET
        name = excluded.name,
        stack = excluded.stack,
        language = excluded.language,
        is_modern = excluded.is_modern,
        change_rate_per_yr = excluded.change_rate_per_yr,
        fte_count = excluded.fte_count,
        criticality_tier = excluded.criticality_tier,
        time_classification = excluded.time_classification,
        annual_run_cost_usd = excluded.annual_run_cost_usd,
        ams_vendor_id = excluded.ams_vendor_id,
        ams_contract_value_usd = excluded.ams_contract_value_usd,
        sunset_decision_date = excluded.sunset_decision_date,
        ai_fit_score = excluded.ai_fit_score,
        updated_by = excluded.updated_by,
        updated_at = now(),
        deleted_at = null
    `,
    [clientId, SEED_ACTOR, asJson(rows)],
  );
}

async function insertTeams(client: Client, clientId: string, rows: readonly TeamSeed[]): Promise<void> {
  await client.query(
    `
      INSERT INTO org_topology (
        client_id, team_id, name, type, size_fte, span_of_control, geo,
        owning_apps, maturity_stage, created_by, updated_by
      )
      SELECT
        $1, team_id, name, type::org_topology_type, size_fte, span_of_control,
        geo, owning_apps, maturity_stage, $2, $2
      FROM jsonb_to_recordset($3::jsonb) AS x(
        team_id text,
        name text,
        type text,
        size_fte numeric,
        span_of_control smallint,
        geo text,
        owning_apps text[],
        maturity_stage smallint
      )
      ON CONFLICT (client_id, team_id) DO UPDATE SET
        name = excluded.name,
        type = excluded.type,
        size_fte = excluded.size_fte,
        span_of_control = excluded.span_of_control,
        geo = excluded.geo,
        owning_apps = excluded.owning_apps,
        maturity_stage = excluded.maturity_stage,
        updated_by = excluded.updated_by,
        updated_at = now(),
        deleted_at = null
    `,
    [clientId, SEED_ACTOR, asJson(rows)],
  );
}

async function insertRoles(client: Client, clientId: string, rows: readonly RoleSeed[]): Promise<void> {
  await client.query(
    `
      INSERT INTO roles_inventory (
        client_id, role_id, title, fte_count, source, geo, ladder_level,
        function_area, created_by, updated_by
      )
      SELECT
        $1, role_id, title, fte_count, source::role_inventory_source, geo,
        ladder_level, function_area, $2, $2
      FROM jsonb_to_recordset($3::jsonb) AS x(
        role_id text,
        title text,
        fte_count numeric,
        source text,
        geo text,
        ladder_level text,
        function_area text
      )
      ON CONFLICT (client_id, role_id) DO UPDATE SET
        title = excluded.title,
        fte_count = excluded.fte_count,
        source = excluded.source,
        geo = excluded.geo,
        ladder_level = excluded.ladder_level,
        function_area = excluded.function_area,
        updated_by = excluded.updated_by,
        updated_at = now(),
        deleted_at = null
    `,
    [clientId, SEED_ACTOR, asJson(rows)],
  );
}

async function insertDora(client: Client, clientId: string, rows: readonly DoraSeed[]): Promise<void> {
  await client.query(
    `
      INSERT INTO dora_baselines (
        client_id, team_id, app_id, measured_at, deploy_freq_per_week,
        lead_time_hours, mttr_hours, change_failure_rate_pct, reliability_pct,
        created_by, updated_by
      )
      SELECT
        $1, team_id, app_id, measured_at, deploy_freq_per_week,
        lead_time_hours, mttr_hours, change_failure_rate_pct, reliability_pct,
        $2, $2
      FROM jsonb_to_recordset($3::jsonb) AS x(
        team_id text,
        app_id text,
        measured_at timestamptz,
        deploy_freq_per_week numeric,
        lead_time_hours numeric,
        mttr_hours numeric,
        change_failure_rate_pct numeric,
        reliability_pct numeric
      )
      ON CONFLICT (client_id, team_id, app_id, measured_at) DO UPDATE SET
        deploy_freq_per_week = excluded.deploy_freq_per_week,
        lead_time_hours = excluded.lead_time_hours,
        mttr_hours = excluded.mttr_hours,
        change_failure_rate_pct = excluded.change_failure_rate_pct,
        reliability_pct = excluded.reliability_pct,
        updated_by = excluded.updated_by,
        updated_at = now(),
        deleted_at = null
    `,
    [clientId, SEED_ACTOR, asJson(rows)],
  );
}

async function insertSpace(client: Client, clientId: string, rows: readonly SpaceSeed[]): Promise<void> {
  await client.query(
    `
      INSERT INTO space_devex_surveys (
        client_id, team_id, surveyed_at, responses_jsonb, n_responses,
        satisfaction_score, performance_score, activity_score, collab_score,
        efficiency_score, created_by, updated_by
      )
      SELECT
        $1, team_id, surveyed_at, responses_jsonb, n_responses,
        satisfaction_score, performance_score, activity_score, collab_score,
        efficiency_score, $2, $2
      FROM jsonb_to_recordset($3::jsonb) AS x(
        team_id text,
        surveyed_at timestamptz,
        responses_jsonb jsonb,
        n_responses integer,
        satisfaction_score numeric,
        performance_score numeric,
        activity_score numeric,
        collab_score numeric,
        efficiency_score numeric
      )
      ON CONFLICT (client_id, team_id, surveyed_at) DO UPDATE SET
        responses_jsonb = excluded.responses_jsonb,
        n_responses = excluded.n_responses,
        satisfaction_score = excluded.satisfaction_score,
        performance_score = excluded.performance_score,
        activity_score = excluded.activity_score,
        collab_score = excluded.collab_score,
        efficiency_score = excluded.efficiency_score,
        updated_by = excluded.updated_by,
        updated_at = now(),
        deleted_at = null
    `,
    [clientId, SEED_ACTOR, asJson(rows)],
  );
}

async function insertAiTools(client: Client, clientId: string, rows: readonly AiToolSeed[]): Promise<void> {
  await client.query(
    `
      INSERT INTO ai_tool_footprint (
        client_id, tool_name, vendor, licensed_seats, activated_seats, dau, mau,
        annual_cost_usd, contract_end_date, indemnity_status, retention_policy,
        created_by, updated_by
      )
      SELECT
        $1, tool_name, vendor, licensed_seats, activated_seats, dau, mau,
        annual_cost_usd, contract_end_date, indemnity_status, retention_policy,
        $2, $2
      FROM jsonb_to_recordset($3::jsonb) AS x(
        tool_name text,
        vendor text,
        licensed_seats integer,
        activated_seats integer,
        dau integer,
        mau integer,
        annual_cost_usd numeric,
        contract_end_date date,
        indemnity_status text,
        retention_policy text
      )
      ON CONFLICT (client_id, tool_name, vendor) DO UPDATE SET
        licensed_seats = excluded.licensed_seats,
        activated_seats = excluded.activated_seats,
        dau = excluded.dau,
        mau = excluded.mau,
        annual_cost_usd = excluded.annual_cost_usd,
        contract_end_date = excluded.contract_end_date,
        indemnity_status = excluded.indemnity_status,
        retention_policy = excluded.retention_policy,
        updated_by = excluded.updated_by,
        updated_at = now(),
        deleted_at = null
    `,
    [clientId, SEED_ACTOR, asJson(rows)],
  );
}

async function insertInfra(client: Client, clientId: string, rows: readonly InfraContractSeed[]): Promise<void> {
  await client.query(
    `
      INSERT INTO infra_ms_contracts (
        client_id, contract_id, vendor_name, service_tower, scope_summary,
        annual_contract_value_usd, start_date, end_date, renewal_date,
        aiops_coverage_pct, outcome_based, concentration_pct, exit_terms_jsonb,
        created_by, updated_by
      )
      SELECT
        $1, contract_id, vendor_name, service_tower::infra_ms_tower, scope_summary,
        annual_contract_value_usd, start_date, end_date, renewal_date,
        aiops_coverage_pct, outcome_based, concentration_pct, exit_terms_jsonb,
        $2, $2
      FROM jsonb_to_recordset($3::jsonb) AS x(
        contract_id text,
        vendor_name text,
        service_tower text,
        scope_summary text,
        annual_contract_value_usd numeric,
        start_date date,
        end_date date,
        renewal_date date,
        aiops_coverage_pct numeric,
        outcome_based boolean,
        concentration_pct numeric,
        exit_terms_jsonb jsonb
      )
      ON CONFLICT (client_id, contract_id) DO UPDATE SET
        vendor_name = excluded.vendor_name,
        service_tower = excluded.service_tower,
        scope_summary = excluded.scope_summary,
        annual_contract_value_usd = excluded.annual_contract_value_usd,
        start_date = excluded.start_date,
        end_date = excluded.end_date,
        renewal_date = excluded.renewal_date,
        aiops_coverage_pct = excluded.aiops_coverage_pct,
        outcome_based = excluded.outcome_based,
        concentration_pct = excluded.concentration_pct,
        exit_terms_jsonb = excluded.exit_terms_jsonb,
        updated_by = excluded.updated_by,
        updated_at = now(),
        deleted_at = null
    `,
    [clientId, SEED_ACTOR, asJson(rows)],
  );
}

async function verifySeed(client: Client, clientId: string): Promise<void> {
  const expected: Record<string, number> = {
    application_portfolio: 100,
    org_topology: 12,
    roles_inventory: 200,
    dora_baselines: 72,
    space_devex_surveys: 12,
    ai_tool_footprint: 2,
    vendor_contracts: 25,
    infra_ms_contracts: 8,
  };

  for (const [table, count] of Object.entries(expected)) {
    const { rows } = await client.query<{ n: string }>(`SELECT COUNT(*)::text AS n FROM ${table} WHERE client_id = $1`, [clientId]);
    const actual = Number(rows[0]?.n ?? 0);
    if (actual !== count) {
      throw new Error(`${table} expected ${count}, found ${actual}`);
    }
  }

  const { rows: timeRows } = await client.query<{ time_classification: string; n: string }>(
    `
      SELECT time_classification::text, COUNT(*)::text AS n
        FROM application_portfolio
       WHERE client_id = $1
       GROUP BY time_classification
    `,
    [clientId],
  );
  const timeCounts = Object.fromEntries(timeRows.map((row) => [row.time_classification, Number(row.n)]));
  const expectedTime = { tolerate: 30, invest: 40, migrate: 20, eliminate: 10 };
  for (const [key, count] of Object.entries(expectedTime)) {
    if (timeCounts[key] !== count) throw new Error(`TIME ${key} expected ${count}, found ${timeCounts[key] ?? 0}`);
  }

  const { rows: modernRows } = await client.query<{ modern: string; legacy: string; mainframe: string }>(
    `
      SELECT
        COUNT(*) FILTER (WHERE is_modern)::text AS modern,
        COUNT(*) FILTER (WHERE NOT is_modern AND stack NOT ILIKE '%AS/400%' AND stack NOT ILIKE '%IBM i%')::text AS legacy,
        COUNT(*) FILTER (WHERE stack ILIKE '%AS/400%' OR stack ILIKE '%IBM i%')::text AS mainframe
        FROM application_portfolio
       WHERE client_id = $1
    `,
    [clientId],
  );
  const mix = modernRows[0];
  if (Number(mix?.modern ?? 0) !== 70 || Number(mix?.legacy ?? 0) !== 20 || Number(mix?.mainframe ?? 0) !== 10) {
    throw new Error(`Application mix expected 70/20/10, found ${mix?.modern}/${mix?.legacy}/${mix?.mainframe}`);
  }

  await client.query('BEGIN');
  try {
    await client.query(
      `
        SELECT set_config(
          'request.jwt.claims',
          jsonb_build_object('tenant_key', 'meridian-health', 'role', 'observer', 'sub', 'p2-seed-smoke')::text,
          true
        )
      `,
    );
    await client.query('SET LOCAL ROLE authenticated');
    const { rows } = await client.query<{ n: string }>(
      'SELECT COUNT(*)::text AS n FROM application_portfolio WHERE client_id = $1',
      [clientId],
    );
    const leaked = Number(rows[0]?.n ?? 0);
    if (leaked !== 0) throw new Error(`RLS leak: Meridian authenticated role saw ${leaked} Apex application rows`);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function main(): Promise<void> {
  const client = new Client(postgresClientOptions(databaseUrl(), 'seed-apex-it-productivity'));
  await client.connect();
  try {
    await client.query('BEGIN');
    const clientId = await ensureApexClient(client);
    await clearExisting(client, clientId);

    const vendorRows = vendorContracts();
    const appRows = applications();
    const teamRows = teams(appRows);
    const roleRows = roles();
    const dora = doraRows(teamRows);
    const space = spaceRows(teamRows);

    await insertVendorContracts(client, clientId, vendorRows);
    await insertApplications(client, clientId, appRows);
    await insertTeams(client, clientId, teamRows);
    await insertRoles(client, clientId, roleRows);
    await insertDora(client, clientId, dora);
    await insertSpace(client, clientId, space);
    await insertAiTools(client, clientId, aiTools());
    await insertInfra(client, clientId, infraContracts());
    await client.query('COMMIT');

    await verifySeed(client, clientId);
    console.log('Apex IT productivity seed complete');
    console.log('application_portfolio=100 org_topology=12 roles_inventory=200 dora_baselines=72');
    console.log('RLS smoke: meridian-health authenticated role sees 0 Apex application rows');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
