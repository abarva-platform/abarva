#!/usr/bin/env tsx
/**
 * SkyHarbor Strategic Moves + Source artifact seed.
 *
 * Usage:
 *   npm run seed:skyharbor-artifacts -- --plan-only
 *   DATABASE_URL=... npm run seed:skyharbor-artifacts
 *   DATABASE_URL=... npm run seed:skyharbor-artifacts -- --apply --reset-seeded
 *
 * The default DB mode is a dry run: it opens a transaction, performs the
 * writes, prints counts, and rolls back. `--apply` commits. `--reset-seeded`
 * removes only deterministic rows created by this seed before re-applying.
 */

import { buildEventScaffold } from "../../lib/source/canvas-substrate/scaffold";

const APP_CLIENT_KEY = "skyharbor";
const SOURCE_CLIENT_KEY = "skyharbor";
const CLIENT_NAME = "SkyHarbor";
const PROVENANCE_TAG = "skyharbor_demo_artifact_seed_2026_06_06";
const SOURCE_LABEL = "SkyHarbor Moves and Source artifact loader";
const SOURCE_ROOT = "src/scripts/seed/seed-skyharbor-moves-source-artifacts.ts";

type PersonaSeed = {
  graphNodeId: string;
  name: string;
  email: string;
  title: string;
  role: "client_viewer";
};

type MoveSeed = {
  seedKey: string;
  name: string;
  phase: number;
  status: "active" | "paused" | "completed";
  archetype:
    | "strategic_transformation"
    | "workflow_automation"
    | "platform_modernization"
    | "ai_product_enablement"
    | "operational_optimization";
  executiveSponsorRole: string;
  valueProjectedLowUsd: number;
  valueProjectedHighUsd: number;
  problemStatement: string;
  targetOutcome: string;
  timelineHorizon: string;
  currentModuleKey: string;
  deliverables: string[];
  evidenceThemes: string[];
};

type SourceEventSeed = {
  eventName: string;
  eventType:
    | "managed_service"
    | "software"
    | "staffing"
    | "infrastructure"
    | "consulting"
    | "other";
  linkedMoveSeedKey: string;
  decisionOwner: string;
  estimatedValueUsd: number;
  triggerDescription: string;
  scopeDescription: string;
  baselineEvidence: string[];
  stopCondition: string;
};

const VISIBILITY_PERSONAS: PersonaSeed[] = [
  {
    graphNodeId: "person:skyharbor:victor-hale",
    name: "Victor Hale",
    email: "cto@skyharbor-air.example.com",
    title: "Chief Technology Officer",
    role: "client_viewer",
  },
  {
    graphNodeId: "person:skyharbor:owen-mercer",
    name: "Owen Mercer",
    email: "admin@skyharbor-air.example.com",
    title: "Tenant Admin / Context Layer Steward",
    role: "client_viewer",
  },
];

const MOVES: MoveSeed[] = [
  {
    seedKey: "skyharbor-ai-led-product-development-operating-model",
    name: "AI-led product development operating model",
    phase: 3,
    status: "active",
    archetype: "ai_product_enablement",
    executiveSponsorRole: "Chief Technology Officer",
    valueProjectedLowUsd: 8_000_000,
    valueProjectedHighUsd: 18_000_000,
    problemStatement:
      "Product roadmap demand exceeds current engineering capacity, while AI-assisted delivery needs DORA discipline, secure code handling, and human approval controls.",
    targetOutcome:
      "Increase product-delivery throughput and release reliability without losing architecture, security, or executive command-and-control over AI-assisted engineering.",
    timelineHorizon: "2026-Q3 to 2027-Q1",
    currentModuleKey: "p3_architecture_options",
    deliverables: [
      "AI engineering operating model",
      "DORA baseline and improvement roadmap",
      "Human-in-the-loop product delivery control design",
      "Engineering productivity value case",
    ],
    evidenceThemes: [
      "DORA metrics",
      "developer experience",
      "AI-assisted SDLC",
      "product squad capacity",
      "release governance",
    ],
  },
  {
    seedKey: "skyharbor-outsourcing-vendor-spend-optimization",
    name: "Outsourcing and vendor spend optimization",
    phase: 2,
    status: "active",
    archetype: "operational_optimization",
    executiveSponsorRole: "Chief Information Officer",
    valueProjectedLowUsd: 12_000_000,
    valueProjectedHighUsd: 30_000_000,
    problemStatement:
      "Large SI and managed-service spend is spread across renewal windows, rate cards, and scopes with limited outcome-based productivity evidence.",
    targetOutcome:
      "Create a defensible sourcing and negotiation plan that can reduce vendor cost while improving delivery accountability and AI-enabled productivity.",
    timelineHorizon: "2026-Q3 to 2026-Q4",
    currentModuleKey: "p2_root_cause_analysis",
    deliverables: [
      "Vendor spend baseline",
      "Rate-card benchmark view",
      "Sourcing strategy and negotiation plan",
      "Benefits realization tracker",
    ],
    evidenceThemes: [
      "rate cards",
      "managed services",
      "contract leakage",
      "vendor productivity",
      "SI portfolio optimization",
    ],
  },
  {
    seedKey: "skyharbor-cloud-data-platform-modernization",
    name: "Cloud and data platform modernization",
    phase: 1,
    status: "active",
    archetype: "platform_modernization",
    executiveSponsorRole: "Chief Data Officer",
    valueProjectedLowUsd: 10_000_000,
    valueProjectedHighUsd: 24_000_000,
    problemStatement:
      "AI and analytics use cases need a safer data-product substrate, stronger integration patterns, and clearer Azure / Databricks execution sequencing.",
    targetOutcome:
      "Build a governed modernization roadmap that improves data readiness, platform reliability, and AI use-case execution quality.",
    timelineHorizon: "2026-Q3 to 2027-Q2",
    currentModuleKey: "p1_discovery_report",
    deliverables: [
      "Modernization use-case portfolio",
      "Target architecture considerations",
      "Data and integration readiness assessment",
      "Roadmap and sequencing model",
    ],
    evidenceThemes: [
      "Azure",
      "Databricks",
      "data products",
      "platform reliability",
      "FinOps",
      "integration modernization",
    ],
  },
  {
    seedKey: "skyharbor-responsible-ai-control-tower",
    name: "Responsible AI control tower and delivery governance",
    phase: 2,
    status: "active",
    archetype: "workflow_automation",
    executiveSponsorRole: "Chief Risk Officer",
    valueProjectedLowUsd: 4_000_000,
    valueProjectedHighUsd: 10_000_000,
    problemStatement:
      "The AI portfolio needs consistent intake, approval, evidence traceability, cost visibility, and value tracking to avoid unmanaged AI failure modes.",
    targetOutcome:
      "Stand up a control tower that keeps humans in command while accelerating AI strategy, solution shaping, sourcing, mobilization, and benefits tracking.",
    timelineHorizon: "2026-Q3 to 2026-Q4",
    currentModuleKey: "p2_continue_decision",
    deliverables: [
      "AI intake and approval model",
      "Risk and evidence matrix",
      "Control tower KPI model",
      "Portfolio governance cadence",
    ],
    evidenceThemes: [
      "responsible AI",
      "risk controls",
      "approval workflow",
      "benefits tracking",
      "AI failure avoidance",
    ],
  },
];

const SOURCE_EVENTS: SourceEventSeed[] = [
  {
    eventName: "SI rate-card optimization and delivery productivity",
    eventType: "consulting",
    linkedMoveSeedKey: "skyharbor-outsourcing-vendor-spend-optimization",
    decisionOwner: "CIO / Strategic Sourcing Lead",
    estimatedValueUsd: 18_000_000,
    triggerDescription:
      "Large outsourcing portfolio and upcoming renewal windows create a near-term opportunity to benchmark rates, scope, and productivity commitments.",
    scopeDescription:
      "Assess top SI and managed-service contracts, identify rate-card and scope optimization opportunities, and prepare a negotiation strategy with measurable productivity commitments.",
    baselineEvidence: [
      "Current vendor portfolio",
      "Rate cards",
      "Statement-of-work inventory",
      "Delivery productivity metrics",
      "Renewal calendar",
    ],
    stopCondition:
      "Do not proceed to negotiation unless baseline spend, benchmark bands, and decision-owner approval are confirmed.",
  },
  {
    eventName: "AI engineering pod augmentation partner",
    eventType: "staffing",
    linkedMoveSeedKey: "skyharbor-ai-led-product-development-operating-model",
    decisionOwner: "CTO / VP Engineering",
    estimatedValueUsd: 4_500_000,
    triggerDescription:
      "Product roadmap demand exceeds current squad capacity and leadership wants AI-enabled delivery without losing engineering control.",
    scopeDescription:
      "Select a partner or pod model for AI-assisted product development, including DORA measurement, code quality controls, and human review obligations.",
    baselineEvidence: [
      "Product roadmap",
      "Team capacity model",
      "DORA baseline",
      "Engineering standards",
      "Security review checklist",
    ],
    stopCondition:
      "Do not award until delivery model proves secure code handling, DORA reporting, and human approval gates.",
  },
  {
    eventName: "Cloud modernization partner selection",
    eventType: "managed_service",
    linkedMoveSeedKey: "skyharbor-cloud-data-platform-modernization",
    decisionOwner: "CIO / Cloud Platform Owner",
    estimatedValueUsd: 9_000_000,
    triggerDescription:
      "Platform modernization roadmap requires implementation capacity and cloud operating model support.",
    scopeDescription:
      "Source a modernization partner for target architecture execution, migration planning, FinOps setup, and reliability engineering support.",
    baselineEvidence: [
      "Current platform inventory",
      "Cloud spend baseline",
      "Modernization roadmap",
      "Architecture decision records",
      "Security and compliance constraints",
    ],
    stopCondition:
      "Do not proceed unless target architecture and migration waves are approved.",
  },
  {
    eventName: "Observability and developer-experience tooling rationalization",
    eventType: "software",
    linkedMoveSeedKey: "skyharbor-ai-led-product-development-operating-model",
    decisionOwner: "VP Engineering / Platform Lead",
    estimatedValueUsd: 2_200_000,
    triggerDescription:
      "Engineering teams use overlapping tools for telemetry, incident response, and delivery analytics.",
    scopeDescription:
      "Rationalize observability and developer-experience tooling to improve reliability, DORA visibility, and cost control.",
    baselineEvidence: [
      "Tool inventory",
      "License spend",
      "Incident metrics",
      "Deployment frequency",
      "Mean time to restore",
    ],
    stopCondition:
      "Do not consolidate until critical monitoring coverage and migration risk are validated.",
  },
  {
    eventName: "Data platform implementation partner",
    eventType: "consulting",
    linkedMoveSeedKey: "skyharbor-cloud-data-platform-modernization",
    decisionOwner: "Chief Data Officer",
    estimatedValueUsd: 6_500_000,
    triggerDescription:
      "AI and analytics use cases require trusted data products and stronger data engineering delivery capacity.",
    scopeDescription:
      "Select a partner to support data product design, ingestion patterns, quality controls, and platform enablement.",
    baselineEvidence: [
      "Data domain inventory",
      "Use-case backlog",
      "Data quality findings",
      "Integration backlog",
      "Security model",
    ],
    stopCondition:
      "Do not start build until priority domains and data ownership are confirmed.",
  },
  {
    eventName: "QA automation and DORA acceleration",
    eventType: "software",
    linkedMoveSeedKey: "skyharbor-ai-led-product-development-operating-model",
    decisionOwner: "Head of Quality Engineering",
    estimatedValueUsd: 1_800_000,
    triggerDescription:
      "Release velocity and regression effort are limiting AI-led product-development gains.",
    scopeDescription:
      "Evaluate QA automation, test-data, and release-risk tooling that improves DORA outcomes while preserving quality gates.",
    baselineEvidence: [
      "Regression suite inventory",
      "Release cycle time",
      "Defect leakage",
      "Automation coverage",
      "Change failure rate",
    ],
    stopCondition:
      "Do not buy tools until regression-critical journeys and integration constraints are mapped.",
  },
  {
    eventName: "AI governance and model monitoring platform",
    eventType: "software",
    linkedMoveSeedKey: "skyharbor-responsible-ai-control-tower",
    decisionOwner: "Chief Risk Officer / AI Governance Lead",
    estimatedValueUsd: 3_000_000,
    triggerDescription:
      "AI portfolio expansion needs consistent intake, approval, monitoring, and evidence traceability.",
    scopeDescription:
      "Evaluate governance and monitoring options for AI risk controls, model observability, evidence capture, and executive reporting.",
    baselineEvidence: [
      "AI use-case inventory",
      "Risk classification model",
      "Approval workflow",
      "Model monitoring requirements",
      "Audit evidence requirements",
    ],
    stopCondition:
      "Do not select a platform until control ownership and integration requirements are agreed.",
  },
  {
    eventName: "Legacy application support contract consolidation",
    eventType: "managed_service",
    linkedMoveSeedKey: "skyharbor-outsourcing-vendor-spend-optimization",
    decisionOwner: "CIO / Application Portfolio Owner",
    estimatedValueUsd: 11_000_000,
    triggerDescription:
      "Multiple legacy support contracts create fragmented accountability and avoidable run cost.",
    scopeDescription:
      "Consolidate selected application support contracts with outcome-based SLAs, automation commitments, and modernization off-ramps.",
    baselineEvidence: [
      "Application portfolio",
      "Support contract inventory",
      "Incident volume",
      "Run cost baseline",
      "Modernization dependency map",
    ],
    stopCondition:
      "Do not consolidate until service criticality, transition risk, and exit obligations are known.",
  },
];

type PgClient = {
  connect(): Promise<void>;
  end(): Promise<void>;
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ): Promise<{ rows: T[] }>;
};

type PgModule = {
  Client: new (config: {
    connectionString: string;
    ssl: false | { rejectUnauthorized: false };
  }) => PgClient;
};

type ColumnInfo = {
  columnName: string;
  dataType: string;
  udtName: string;
};

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
const PLAN_ONLY = args.has("--plan-only");
const RESET_SEEDED = args.has("--reset-seeded");

function eventCode(eventName: string): string {
  const nameSlug = eventName
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 3)
    .join("-");
  return `SKYH-${nameSlug || "EVENT"}-${new Date().getFullYear()}`;
}

function dbUrl(): string {
  return (process.env.DATABASE_URL ?? "")
    .replace(/^"|"$/g, "")
    .replace(/^'|'$/g, "");
}

function sslFor(url: string): false | { rejectUnauthorized: false } {
  return /localhost|127\.0\.0\.1/.test(url)
    ? false
    : { rejectUnauthorized: false };
}

function formatUsd(value: number): string {
  return `$${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
}

function asJsonb(value: unknown): string {
  return JSON.stringify(value);
}

function printPlan(): void {
  const moveValueLow = MOVES.reduce(
    (sum, move) => sum + move.valueProjectedLowUsd,
    0,
  );
  const moveValueHigh = MOVES.reduce(
    (sum, move) => sum + move.valueProjectedHighUsd,
    0,
  );
  const sourceValue = SOURCE_EVENTS.reduce(
    (sum, event) => sum + event.estimatedValueUsd,
    0,
  );
  console.log("SkyHarbor artifact seed plan");
  console.log(`- App client key: ${APP_CLIENT_KEY}`);
  console.log(`- Source runtime client key: ${SOURCE_CLIENT_KEY}`);
  console.log(`- Provenance: ${PROVENANCE_TAG}`);
  console.log(
    `- Strategic Moves: ${MOVES.length} (${formatUsd(moveValueLow)}-${formatUsd(moveValueHigh)} projected)`,
  );
  console.log(
    `- Source events: ${SOURCE_EVENTS.length} (${formatUsd(sourceValue)} sourcing value at stake)`,
  );
  console.log(
    `- Scoped visibility personas: ${VISIBILITY_PERSONAS.map((persona) => persona.email).join(", ")}`,
  );
  console.log(`- Reset seeded rows: ${RESET_SEEDED ? "yes" : "no"}`);
  console.log(
    `- Mode: ${PLAN_ONLY ? "plan-only" : APPLY ? "apply" : "dry-run rollback"}`,
  );
  for (const move of MOVES) {
    console.log(
      `  move · P${move.phase} · ${move.name} · ${formatUsd(move.valueProjectedLowUsd)}-${formatUsd(move.valueProjectedHighUsd)}`,
    );
  }
  for (const event of SOURCE_EVENTS) {
    console.log(
      `  source · ${eventCode(event.eventName)} · ${event.eventName} · ${formatUsd(event.estimatedValueUsd)}`,
    );
  }
}

async function tableColumns(
  client: PgClient,
  table: string,
): Promise<Set<string>> {
  const info = await tableColumnInfo(client, table);
  return new Set(info.keys());
}

async function tableHasColumns(
  client: PgClient,
  table: string,
  columns: string[],
): Promise<boolean> {
  const info = await tableColumnInfo(client, table);
  return columns.every((column) => info.has(column));
}

async function tableColumnInfo(
  client: PgClient,
  table: string,
): Promise<Map<string, ColumnInfo>> {
  const result = await client.query<{
    column_name: string;
    data_type: string;
    udt_name: string;
  }>(
    `
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    `,
    [table],
  );
  return new Map(
    result.rows.map((row) => [
      row.column_name,
      {
        columnName: row.column_name,
        dataType: row.data_type,
        udtName: row.udt_name,
      },
    ]),
  );
}

function valueForColumn(value: unknown, info: ColumnInfo | undefined): unknown {
  if (
    value !== null &&
    value !== undefined &&
    (info?.dataType === "json" ||
      info?.dataType === "jsonb" ||
      info?.udtName === "json" ||
      info?.udtName === "jsonb")
  ) {
    return asJsonb(value);
  }
  return value;
}

async function findSkyHarborClient(
  client: PgClient,
): Promise<{ id: string; name: string }> {
  const columns = await tableColumns(client, "clients");
  const nameExpr = columns.has("name")
    ? "name"
    : columns.has("legal_name")
      ? "legal_name"
      : `'${CLIENT_NAME}'`;
  const conditions: string[] = [];
  const orderParts: string[] = [];
  const params: unknown[] = [
    APP_CLIENT_KEY,
    SOURCE_CLIENT_KEY,
    "%skyharbor%",
    "%sky harbor%",
  ];

  if (columns.has("tenant_key")) {
    conditions.push("lower(coalesce(tenant_key, '')) IN ($1, $2)");
    orderParts.push(
      "CASE WHEN lower(coalesce(tenant_key, '')) = $1 THEN 0 WHEN lower(coalesce(tenant_key, '')) = $2 THEN 1 ELSE 2 END",
    );
  }
  if (columns.has("key")) {
    conditions.push("lower(coalesce(key, '')) IN ($1, $2)");
    orderParts.push(
      "CASE WHEN lower(coalesce(key, '')) = $1 THEN 0 WHEN lower(coalesce(key, '')) = $2 THEN 1 ELSE 2 END",
    );
  }
  if (columns.has("slug")) {
    conditions.push("lower(coalesce(slug, '')) IN ($1, $2)");
    orderParts.push(
      "CASE WHEN lower(coalesce(slug, '')) = $1 THEN 0 WHEN lower(coalesce(slug, '')) = $2 THEN 1 ELSE 2 END",
    );
  }
  if (columns.has("name")) {
    conditions.push("lower(coalesce(name, '')) LIKE $3");
    conditions.push("lower(coalesce(name, '')) LIKE $4");
  }
  if (columns.has("legal_name")) {
    conditions.push("lower(coalesce(legal_name, '')) LIKE $3");
    conditions.push("lower(coalesce(legal_name, '')) LIKE $4");
  }
  if (columns.has("updated_at")) orderParts.push("updated_at DESC NULLS LAST");
  if (columns.has("created_at")) orderParts.push("created_at DESC NULLS LAST");

  if (conditions.length === 0) {
    throw new Error(
      "clients table does not expose a usable SkyHarbor lookup column.",
    );
  }

  const result = await client.query<{ id: string; name: string }>(
    `
    SELECT id::text, ${nameExpr}::text AS name
    FROM clients
    WHERE ${conditions.join("\n       OR ")}
    ORDER BY ${orderParts.length > 0 ? orderParts.join(", ") : "id"}
    LIMIT 1
    `,
    params,
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error(
      "SkyHarbor client row not found. Load the SkyHarbor context layer before applying artifacts.",
    );
  }
  return row;
}

function valuesSql(start: number, count: number): string {
  return Array.from({ length: count }, (_, index) => `$${start + index}`).join(
    ", ",
  );
}

function whereSql(columns: string[], start = 1): string {
  return columns
    .map((column, index) => `${column} = $${start + index}`)
    .join(" AND ");
}

async function upsertRow(
  client: PgClient,
  table: string,
  row: Record<string, unknown>,
  conflictColumns: string[],
  returning = "id",
): Promise<string | null> {
  const columnInfo = await tableColumnInfo(client, table);
  const entries = Object.entries(row).filter(
    ([column, value]) => columnInfo.has(column) && value !== undefined,
  );
  const names = entries.map(([column]) => column);
  const values = entries.map(([column, value]) =>
    valueForColumn(value, columnInfo.get(column)),
  );
  const conflictValues = conflictColumns.map((column) =>
    valueForColumn(row[column], columnInfo.get(column)),
  );
  if (conflictValues.some((value) => value === undefined)) {
    throw new Error(
      `Missing conflict value for ${table}: ${conflictColumns.join(", ")}`,
    );
  }

  const existing = await client.query<Record<string, string>>(
    `
    SELECT ${returning}
    FROM ${table}
    WHERE ${whereSql(conflictColumns)}
    ORDER BY ${returning}
    LIMIT 1
    `,
    conflictValues,
  );
  const existingId = existing.rows[0]?.[returning];
  if (existingId) {
    const updateEntries = entries.filter(
      ([column]) => !conflictColumns.includes(column),
    );
    if (updateEntries.length === 0) return existingId;
    const updateValues = updateEntries.map(([column, value]) =>
      valueForColumn(value, columnInfo.get(column)),
    );
    const assignments = updateEntries
      .map(([column], index) => `${column} = $${index + 1}`)
      .join(", ");
    const result = await client.query<Record<string, string>>(
      `
      UPDATE ${table}
      SET ${assignments}
      WHERE ${returning} = $${updateValues.length + 1}
      RETURNING ${returning}
      `,
      [...updateValues, existingId],
    );
    return result.rows[0]?.[returning] ?? existingId;
  }

  const result = await client.query<Record<string, string>>(
    `
    INSERT INTO ${table} (${names.join(", ")})
    VALUES (${valuesSql(1, values.length)})
    RETURNING ${returning}
    `,
    values,
  );
  return result.rows[0]?.[returning] ?? null;
}

async function resetSeededRows(client: PgClient): Promise<void> {
  const sourceNames = SOURCE_EVENTS.map((event) => event.eventName);
  await client.query(
    "DELETE FROM source_events WHERE client_key = ANY($1::text[]) AND event_name = ANY($2::text[])",
    [[APP_CLIENT_KEY, SOURCE_CLIENT_KEY], sourceNames],
  );

  const graphNodeIds = MOVES.map(
    (move) => `eng_${move.seedKey.replace(/-/g, "_")}`,
  );
  await client.query(
    "DELETE FROM engagements WHERE graph_node_id = ANY($1) OR metadata->>'provenance_tag' = $2",
    [graphNodeIds, PROVENANCE_TAG],
  );
}

function moveMetadata(move: MoveSeed): Record<string, unknown> {
  return {
    provenance_tag: PROVENANCE_TAG,
    seed_key: move.seedKey,
    seeded_for: "SkyHarbor CTO demo",
    evidence_themes: move.evidenceThemes,
    executive_sponsor_role: move.executiveSponsorRole,
    demo_truth_note:
      "Deterministic demo artifact seeded after SkyHarbor context load; replace with client-approved live evidence during pilot.",
  };
}

async function seedMove(
  client: PgClient,
  clientId: string,
  move: MoveSeed,
): Promise<string> {
  const graphNodeId = `eng_${move.seedKey.replace(/-/g, "_")}`;
  const engagementId = await upsertRow(
    client,
    "engagements",
    {
      client_id: clientId,
      solution: move.seedKey,
      status: move.status,
      current_phase: move.phase,
      created_by: "seed-skyharbor-moves-source-artifacts",
      metadata: moveMetadata(move),
      engagement_name: move.name,
      is_active: true,
      graph_node_id: graphNodeId,
      name: move.name,
      industry_code: "technology",
      function_code: "technology",
      objective_code: "ai_success",
      topic_code: "product_engineering",
      charter: {
        problemStatement: move.problemStatement,
        targetOutcome: move.targetOutcome,
        evidenceThemes: move.evidenceThemes,
      },
      gates_passed: move.phase >= 2 ? ["P0", "P1"] : ["P0"],
      decisions: [
        {
          label: "Proceed with shaped demo move",
          status: "draft",
          provenanceTag: PROVENANCE_TAG,
        },
      ],
      deliverables: move.deliverables,
      sponsor_approvals: [],
      program_archetype: move.archetype,
      origin_source: "intelligence_promoted",
      maestro_oversight_level: "partial",
      founder_approval_required: false,
      current_module_key: move.currentModuleKey,
      problem_statement: move.problemStatement,
      target_outcome: move.targetOutcome,
      timeline_horizon: move.timelineHorizon,
      value_projected_low_usd: move.valueProjectedLowUsd,
      value_projected_high_usd: move.valueProjectedHighUsd,
      value_verified_usd: null,
      value_verified_status: "pending",
      value_currency: "USD",
      value_assumptions_jsonb: {
        source: PROVENANCE_TAG,
        basis: "demo_value_hypothesis",
        low_usd: move.valueProjectedLowUsd,
        high_usd: move.valueProjectedHighUsd,
        caveat:
          "Directional value range for demo readiness; validate with client baselines before commercial claim.",
      },
    },
    ["client_id", "solution"],
  );
  if (!engagementId)
    throw new Error(`No engagement id returned for ${move.name}`);

  await seedMoveChildren(client, engagementId, move);
  return engagementId;
}

async function seedMoveChildren(
  client: PgClient,
  engagementId: string,
  move: MoveSeed,
): Promise<void> {
  const moduleRows = [
    ["p0_signal_capture", "P0 signal capture", 0, "completed"],
    [
      "p1_discovery_report",
      "P1 discovery report",
      1,
      move.phase >= 1 ? "completed" : "not_started",
    ],
    [
      "p2_root_cause_analysis",
      "P2 root cause analysis",
      2,
      move.phase >= 2 ? "in_progress" : "not_started",
    ],
    [
      move.currentModuleKey,
      move.currentModuleKey.replace(/_/g, " "),
      move.phase,
      "in_progress",
    ],
  ] as const;
  for (let index = 0; index < moduleRows.length; index += 1) {
    const [moduleKey, moduleName, phaseNumber, status] = moduleRows[index];
    await upsertRow(
      client,
      "program_modules",
      {
        engagement_id: engagementId,
        module_key: moduleKey,
        module_name: moduleName,
        phase_number: phaseNumber,
        module_order: index + 1,
        status,
        state_jsonb: {
          provenance_tag: PROVENANCE_TAG,
          evidence_themes: move.evidenceThemes,
        },
      },
      ["engagement_id", "module_key"],
    );
  }

  const deliverableTypes = [
    ["charter", "Program Charter", [1, 2]],
    ["solution_design", "Solution Design", [3]],
    ["sourcing_strategy", "Sourcing Strategy", [3]],
    ["business_case", "Business Case", [2, 3]],
  ] as const;
  for (const [typeKey, title, phases] of deliverableTypes) {
    await upsertRow(
      client,
      "deliverable_types",
      {
        type_key: typeKey,
        title,
        description: `${title} used by the SkyHarbor demo artifact seed.`,
        applicable_phases: phases,
        applicable_topics: ["ai_success", "product_engineering"],
        template_structure: { provenance_tag: PROVENANCE_TAG },
        required_data_inputs: { evidence_themes: move.evidenceThemes },
        quality_rubric: {
          minimum: "Evidence-backed, owner-aware, value-linked.",
        },
        output_format: "markdown",
        version: 1,
        maturity: "pilot",
      },
      ["type_key"],
    );
  }

  for (const [index, title] of move.deliverables.entries()) {
    const typeKey =
      index === 0
        ? "charter"
        : index === 1
          ? "business_case"
          : index === 2
            ? "solution_design"
            : "sourcing_strategy";
    const existing = await client.query<{ id: string }>(
      `
      SELECT id::text
      FROM deliverables_v2
      WHERE engagement_id = $1 AND deliverable_type_key = $2 AND title = $3
      LIMIT 1
      `,
      [engagementId, typeKey, title],
    );
    const deliverableId =
      existing.rows[0]?.id ??
      (
        await client.query<{ id: string }>(
          `
          INSERT INTO deliverables_v2 (
            engagement_id, deliverable_type_key, title, status, current_version, created_by
          )
          VALUES ($1, $2, $3, $4, 1, $5)
          RETURNING id::text
          `,
          [
            engagementId,
            typeKey,
            title,
            index <= 1 ? "in_review" : "draft",
            PROVENANCE_TAG,
          ],
        )
      ).rows[0].id;

    await client.query(
      `
      INSERT INTO deliverable_versions (
        deliverable_id, version, content, structured_data, quality_score
      )
      VALUES ($1, 1, $2, $3::jsonb, $4::jsonb)
      ON CONFLICT (deliverable_id, version) DO UPDATE SET
        content = excluded.content,
        structured_data = excluded.structured_data,
        quality_score = excluded.quality_score
      `,
      [
        deliverableId,
        `# ${title}\n\n${move.targetOutcome}\n\nEvidence themes: ${move.evidenceThemes.join(", ")}.\n\nValue range: ${formatUsd(move.valueProjectedLowUsd)}-${formatUsd(move.valueProjectedHighUsd)}.\n\nHuman control: executive sponsor and owner approval remain required before mobilization.`,
        asJsonb({
          provenance_tag: PROVENANCE_TAG,
          move_seed_key: move.seedKey,
          evidence_themes: move.evidenceThemes,
        }),
        asJsonb({
          score: 0.82,
          caveat: "Demo-quality scaffold; client evidence validation pending.",
        }),
      ],
    );
  }

  const workItems = [
    ["Confirm executive sponsor and decision cadence", "task", "critical"],
    ["Load baseline evidence and identify gaps", "workstream", "high"],
    ["Shape solution and sourcing implications", "solution", "high"],
  ] as const;
  for (const [title, itemType, priority] of workItems) {
    await client.query(
      `
      INSERT INTO program_work_items (
        engagement_id, title, description, item_type, status, priority,
        module_key, phase_number, metadata_jsonb
      )
      VALUES ($1, $2, $3, $4, 'in_progress', $5, $6, $7, $8::jsonb)
      ON CONFLICT DO NOTHING
      `,
      [
        engagementId,
        `${move.name}: ${title}`,
        move.targetOutcome,
        itemType,
        priority,
        move.currentModuleKey,
        move.phase,
        asJsonb({ provenance_tag: PROVENANCE_TAG }),
      ],
    );
  }

  await client.query(
    `
    INSERT INTO program_risks (
      engagement_id, title, description, likelihood, impact, status,
      mitigation_plan, phase_number, module_key
    )
    VALUES ($1, $2, $3, 'medium', 'high', 'mitigating', $4, $5, $6)
    ON CONFLICT DO NOTHING
    `,
    [
      engagementId,
      `${move.name}: evidence quality and ownership gap`,
      "Seeded demo artifact needs client-confirmed baselines before it becomes a live delivery commitment.",
      "Use AbarVa context layer, evidence gaps, sponsor approval, and value tracking before mobilization.",
      move.phase,
      move.currentModuleKey,
    ],
  );
}

async function seedSourceEvent(
  client: PgClient,
  event: SourceEventSeed,
  linkedProgramId: string | null,
): Promise<string> {
  const code = eventCode(event.eventName);
  const eventId = await upsertRow(
    client,
    "source_events",
    {
      client_key: SOURCE_CLIENT_KEY,
      event_code: code,
      event_name: event.eventName,
      event_type: event.eventType,
      current_stage_key: "strategy",
      lifecycle_state: "waiting_on_client",
      linked_program_id: linkedProgramId,
      estimated_value_usd: event.estimatedValueUsd,
      trigger_description: `${event.triggerDescription}\n\nProvenance: ${PROVENANCE_TAG}`,
      scope_description: `${event.scopeDescription}\n\nBaseline evidence: ${event.baselineEvidence.join("; ")}.\n\nStop condition: ${event.stopCondition}`,
      decision_owner: event.decisionOwner,
      created_by_user_id: PROVENANCE_TAG,
    },
    ["client_key", "event_code"],
  );
  if (!eventId)
    throw new Error(`No Source event id returned for ${event.eventName}`);

  const scaffold = buildEventScaffold({
    sourceEventId: eventId,
    tenantKey: SOURCE_CLIENT_KEY,
  });
  for (const row of scaffold.artifactStates) {
    await upsertRow(
      client,
      "source_event_artifact_states",
      {
        source_event_id: row.source_event_id,
        tenant_key: row.tenant_key,
        artifact_code: row.artifact_code,
        stage_key: row.stage_key,
        artifact_family: row.artifact_family,
        tier: row.tier,
        status: row.status,
        requirement_level: row.requirement_level,
        gate_defining: row.gate_defining,
      },
      ["source_event_id", "artifact_code"],
    );
  }
  for (const row of scaffold.gateCriterionStates) {
    await upsertRow(
      client,
      "source_event_gate_criterion_states",
      {
        source_event_id: row.source_event_id,
        tenant_key: row.tenant_key,
        criterion_id: row.criterion_id,
        from_stage: row.from_stage,
        to_stage: row.to_stage,
        state: row.state,
      },
      ["source_event_id", "criterion_id"],
    );
  }
  for (const row of scaffold.evidenceStates) {
    await upsertRow(
      client,
      "source_event_evidence_states",
      {
        source_event_id: row.source_event_id,
        tenant_key: row.tenant_key,
        requirement_id: row.requirement_id,
        stage_key: row.stage_key,
        current_state: row.current_state,
      },
      ["source_event_id", "requirement_id"],
    );
  }

  const requiredArtifacts = scaffold.artifactStates
    .filter((row) => row.requirement_level === "required")
    .slice(0, 3);
  for (const row of requiredArtifacts) {
    await client.query(
      `
      UPDATE source_event_artifact_states
      SET
        tier = 'outline',
        status = 'drafting',
        notes = $3,
        body = $4,
        body_format = 'markdown',
        body_authored_by = $5,
        body_updated_at = now(),
        updated_at = now()
      WHERE source_event_id = $1 AND artifact_code = $2
      `,
      [
        eventId,
        row.artifact_code,
        `Seeded outline for SkyHarbor demo readiness (${PROVENANCE_TAG}).`,
        `# ${event.eventName}\n\n## Trigger\n${event.triggerDescription}\n\n## Scope\n${event.scopeDescription}\n\n## Baseline Evidence\n${event.baselineEvidence.map((item) => `- ${item}`).join("\n")}\n\n## Stop Condition\n${event.stopCondition}\n\n## Value at Stake\n${formatUsd(event.estimatedValueUsd)} directional sourcing value under review.\n\n## Human Control\nDecision owner: ${event.decisionOwner}. AbarVa can structure the sourcing motion, but award, scope, and mobilization approvals stay with accountable client leaders.`,
        PROVENANCE_TAG,
      ],
    );
  }

  await client.query(
    `
    UPDATE source_event_evidence_states
    SET current_state = 'Available', notes = $2, last_synced_at = now(), updated_at = now()
    WHERE source_event_id = $1
      AND requirement_id IN (
        SELECT requirement_id
        FROM source_event_evidence_states
        WHERE source_event_id = $1
        ORDER BY stage_key, requirement_id
        LIMIT 3
      )
    `,
    [
      eventId,
      `Baseline evidence named in seeded intake; client-approved files still pending (${PROVENANCE_TAG}).`,
    ],
  );

  return eventId;
}

async function ensurePersona(
  client: PgClient,
  persona: PersonaSeed,
): Promise<string> {
  const existing = await client.query<{ id: string }>(
    `
    SELECT id::text
    FROM persons
    WHERE graph_node_id = $1 OR lower(coalesce(email, '')) = lower($2)
    ORDER BY CASE WHEN graph_node_id = $1 THEN 0 ELSE 1 END
    LIMIT 1
    `,
    [persona.graphNodeId, persona.email],
  );
  const existingId = existing.rows[0]?.id;
  const personId = await upsertRow(
    client,
    "persons",
    {
      id: existingId,
      graph_node_id: persona.graphNodeId,
      name: persona.name,
      email: persona.email,
      role: persona.title,
      organization: "SkyHarbor Air",
      familiarity: "returning_recent",
      primary_role: persona.role,
      communication_style: {
        provenance_tag: PROVENANCE_TAG,
        demo_persona: true,
        tenant_key: SOURCE_CLIENT_KEY,
      },
    },
    existingId ? ["id"] : ["graph_node_id"],
  );
  if (!personId) throw new Error(`No person id returned for ${persona.email}`);
  return personId;
}

async function seedClientMembership(
  client: PgClient,
  clientId: string,
  personId: string,
  persona: PersonaSeed,
): Promise<void> {
  if (
    !(await tableHasColumns(client, "person_client_memberships", [
      "person_id",
      "client_id",
      "role",
    ]))
  ) {
    console.log(
      "Skipped person_client_memberships visibility backfill; table is unavailable.",
    );
    return;
  }
  await upsertRow(
    client,
    "person_client_memberships",
    {
      person_id: personId,
      client_id: clientId,
      role: persona.role,
      access_level: "client_admin",
      financial_visibility: true,
      can_admin_users: persona.email.startsWith("admin@"),
      can_create_programs: true,
      can_approve_gates: true,
      can_create_source_events: true,
      can_approve_source_stages: true,
      can_approve_award: true,
      can_upload_source_artifacts: true,
      can_generate_sourcing_artifacts: true,
      can_publish_sourcing_artifacts: true,
    },
    ["person_id", "client_id"],
  );
}

async function seedMoveParticipants(
  client: PgClient,
  persona: PersonaSeed,
  personId: string,
  moveIds: Map<string, string>,
): Promise<void> {
  if (
    !(await tableHasColumns(client, "engagement_participants", [
      "engagement_id",
      "user_id",
    ]))
  ) {
    console.log(
      "Skipped engagement_participants visibility backfill; table is unavailable.",
    );
    return;
  }
  for (const engagementId of moveIds.values()) {
    await upsertRow(
      client,
      "engagement_participants",
      {
        engagement_id: engagementId,
        user_id: personId,
        user_name: persona.name,
        role: persona.title,
        notify_on: ["gate_review", "value_review"],
        approval_authority: "approver",
        program_access_level: "program_member",
        can_view_financial: true,
        can_upload: true,
        can_generate_deliverables: true,
        can_publish_deliverables: true,
        can_approve_phase_gates: true,
      },
      ["engagement_id", "user_id"],
    );
  }
}

async function seedSourceParticipants(
  client: PgClient,
  persona: PersonaSeed,
  personId: string,
  sourceEventIds: string[],
): Promise<void> {
  if (
    !(await tableHasColumns(client, "source_event_participants", [
      "client_key",
      "source_event_id",
      "user_id",
    ]))
  ) {
    console.log(
      "Skipped source_event_participants visibility backfill; table is unavailable.",
    );
    return;
  }
  for (const sourceEventId of sourceEventIds) {
    await upsertRow(
      client,
      "source_event_participants",
      {
        client_key: SOURCE_CLIENT_KEY,
        source_event_id: sourceEventId,
        source_event_row_id: sourceEventId,
        user_id: personId,
        user_name: persona.name,
        role: persona.title,
        approval_authority: "approver",
        source_access_level: "source_member",
        can_view_financial: true,
        can_upload_source_artifacts: true,
        can_generate_sourcing_artifacts: true,
        can_publish_sourcing_artifacts: true,
        can_approve_source_stages: true,
        can_approve_award: true,
        notify_on: ["stage_gate", "award_review"],
      },
      ["client_key", "source_event_id", "user_id"],
    );
  }
}

async function seedPersonaVisibility(
  client: PgClient,
  clientId: string,
  moveIds: Map<string, string>,
  sourceEventIds: string[],
): Promise<void> {
  for (const persona of VISIBILITY_PERSONAS) {
    const personId = await ensurePersona(client, persona);
    await seedClientMembership(client, clientId, personId, persona);
    await seedMoveParticipants(client, persona, personId, moveIds);
    await seedSourceParticipants(client, persona, personId, sourceEventIds);
    console.log(
      `Seeded scoped visibility for ${persona.name} (${persona.email}).`,
    );
  }
}

async function summarize(client: PgClient, clientId: string): Promise<void> {
  const moveSummary = await client.query<{
    n: string;
    low: string | null;
    high: string | null;
  }>(
    `
    SELECT
      COUNT(*)::text AS n,
      COALESCE(SUM(value_projected_low_usd), 0)::text AS low,
      COALESCE(SUM(value_projected_high_usd), 0)::text AS high
    FROM engagements
    WHERE client_id::text = $1
      AND (metadata->>'provenance_tag' = $2 OR value_assumptions_jsonb->>'source' = $2)
    `,
    [clientId, PROVENANCE_TAG],
  );
  const sourceSummary = await client.query<{
    events: string;
    artifacts: string;
    outlined: string;
    evidence: string;
  }>(
    `
    SELECT
      COUNT(DISTINCT se.id)::text AS events,
      COUNT(DISTINCT sas.id)::text AS artifacts,
      COUNT(DISTINCT sas.id) FILTER (WHERE sas.tier IN ('outline','rich') OR sas.body IS NOT NULL)::text AS outlined,
      COUNT(DISTINCT ses.id) FILTER (WHERE ses.current_state <> 'Not Requested')::text AS evidence
    FROM source_events se
    LEFT JOIN source_event_artifact_states sas ON sas.source_event_id = se.id
    LEFT JOIN source_event_evidence_states ses ON ses.source_event_id = se.id
    WHERE se.client_key = $1
      AND se.event_name = ANY($2)
    `,
    [SOURCE_CLIENT_KEY, SOURCE_EVENTS.map((event) => event.eventName)],
  );
  const moves = moveSummary.rows[0];
  const source = sourceSummary.rows[0];
  console.log("Post-seed summary");
  console.log(
    `- Seeded moves in transaction: ${moves?.n ?? "0"} (${formatUsd(Number(moves?.low ?? 0))}-${formatUsd(Number(moves?.high ?? 0))})`,
  );
  console.log(
    `- Seeded source events in transaction: ${source?.events ?? "0"}`,
  );
  console.log(`- Source scaffold artifacts: ${source?.artifacts ?? "0"}`);
  console.log(`- Source outlined/rich artifacts: ${source?.outlined ?? "0"}`);
  console.log(
    `- Source evidence states beyond Not Requested: ${source?.evidence ?? "0"}`,
  );
}

async function ensureIngestionLedger(client: PgClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.data_ingestion_runs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
      tenant_key TEXT NOT NULL,
      source_label TEXT NOT NULL,
      source_root TEXT,
      status TEXT NOT NULL CHECK (status IN ('started','completed','failed')) DEFAULT 'started',
      records_loaded BIGINT NOT NULL DEFAULT 0,
      chunks_loaded BIGINT NOT NULL DEFAULT 0,
      nodes_loaded BIGINT NOT NULL DEFAULT 0,
      edges_loaded BIGINT NOT NULL DEFAULT 0,
      summary JSONB NOT NULL DEFAULT '{}'::jsonb,
      started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      completed_at TIMESTAMPTZ,
      error_message TEXT
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_data_ingestion_runs_tenant_started
    ON public.data_ingestion_runs(tenant_key, started_at DESC)
  `);
}

async function startIngestionRun(
  client: PgClient,
  clientId: string,
): Promise<string> {
  const result = await client.query<{ id: string }>(
    `
    INSERT INTO public.data_ingestion_runs (
      client_id, tenant_key, source_label, source_root, status, summary
    )
    VALUES ($1, $2, $3, $4, 'started', $5::jsonb)
    RETURNING id::text
    `,
    [
      clientId,
      SOURCE_CLIENT_KEY,
      SOURCE_LABEL,
      SOURCE_ROOT,
      asJsonb({
        provenance_tag: PROVENANCE_TAG,
        mode: APPLY ? "apply" : "dry-run",
        reset_seeded: RESET_SEEDED,
        planned_moves: MOVES.length,
        planned_source_events: SOURCE_EVENTS.length,
      }),
    ],
  );
  const id = result.rows[0]?.id;
  if (!id) throw new Error("data_ingestion_runs insert did not return an id");
  return id;
}

async function completeIngestionRun(
  client: PgClient,
  runId: string,
): Promise<void> {
  await client.query(
    `
    UPDATE public.data_ingestion_runs
    SET status = 'completed',
        records_loaded = $2,
        chunks_loaded = 0,
        nodes_loaded = $3,
        edges_loaded = $4,
        summary = $5::jsonb,
        completed_at = now()
    WHERE id = $1
    `,
    [
      runId,
      MOVES.length + SOURCE_EVENTS.length,
      MOVES.length,
      SOURCE_EVENTS.length,
      asJsonb({
        provenance_tag: PROVENANCE_TAG,
        loaded_moves: MOVES.length,
        loaded_source_events: SOURCE_EVENTS.length,
        projected_move_value_low_usd: MOVES.reduce(
          (sum, move) => sum + move.valueProjectedLowUsd,
          0,
        ),
        projected_move_value_high_usd: MOVES.reduce(
          (sum, move) => sum + move.valueProjectedHighUsd,
          0,
        ),
        source_value_at_stake_usd: SOURCE_EVENTS.reduce(
          (sum, event) => sum + event.estimatedValueUsd,
          0,
        ),
        loader_backed: true,
        no_side_load: true,
      }),
    ],
  );
}

async function main(): Promise<void> {
  printPlan();
  if (PLAN_ONLY) return;

  const url = dbUrl();
  if (!url) {
    throw new Error("DATABASE_URL is required unless --plan-only is used.");
  }

  const pg = (await import("pg")) as unknown as PgModule;
  const client = new pg.Client({ connectionString: url, ssl: sslFor(url) });
  await client.connect();
  await client.query("BEGIN");
  try {
    const skyharbor = await findSkyHarborClient(client);
    console.log(`Resolved client: ${skyharbor.name} (${skyharbor.id})`);
    await ensureIngestionLedger(client);
    console.log("Verified data_ingestion_runs ledger table.");
    const runId = await startIngestionRun(client, skyharbor.id);
    console.log(`Started data_ingestion_runs ledger: ${runId}`);

    if (RESET_SEEDED) {
      await resetSeededRows(client);
      console.log("Reset deterministic seeded rows.");
    }

    const moveIds = new Map<string, string>();
    for (const move of MOVES) {
      const id = await seedMove(client, skyharbor.id, move);
      moveIds.set(move.seedKey, id);
      console.log(`Seeded move: ${move.name} (${id})`);
    }

    const sourceEventIds: string[] = [];
    for (const event of SOURCE_EVENTS) {
      const eventId = await seedSourceEvent(
        client,
        event,
        moveIds.get(event.linkedMoveSeedKey) ?? null,
      );
      sourceEventIds.push(eventId);
      console.log(`Seeded source event: ${event.eventName} (${eventId})`);
    }

    await seedPersonaVisibility(client, skyharbor.id, moveIds, sourceEventIds);
    await summarize(client, skyharbor.id);
    await completeIngestionRun(client, runId);
    console.log(`Completed data_ingestion_runs ledger: ${runId}`);

    if (APPLY) {
      await client.query("COMMIT");
      console.log("Committed.");
    } else {
      await client.query("ROLLBACK");
      console.log("Rolled back dry run. Re-run with --apply to commit.");
    }
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
