#!/usr/bin/env node
import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";
import { readCsv } from "../tenant-v3/lib/csv.mjs";

const repoRoot = process.cwd();
const tenantKey = "meridian-health";
const tenantName = "Meridian Health System";
const designHtmlPath =
  process.env.HOME_KNOWLEDGE_DESIGN_HTML ||
  "/Users/anand/Downloads/Nexus Home Knowledge.html";
const inputRoot = path.join(
  repoRoot,
  "datasets/tenant-inputs/meridian-health/standard-2026-07-v3",
);
const interviewPath = path.join(
  repoRoot,
  "datasets/tenant-inputs/meridian-health/interviews/executive_interviews.csv",
);
const approvedHomeDir = path.join(
  repoRoot,
  "datasets/tenant-inputs/meridian-health/approved-content/home",
);
const approvedMirrorDir = path.join(
  repoRoot,
  "datasets/context-artifacts/approved/meridian-health/home-knowledge",
);
const reportDir = path.join(
  repoRoot,
  "reports/home-knowledge-design-contract",
);
const downloadsPrefix =
  "/Users/anand/Downloads/meridian-home-knowledge-design-contract-20260717";
const model =
  process.env.HOME_KNOWLEDGE_CLAUDE_MODEL ||
  process.env.KNOWLEDGE_CXO_CLAUDE_MODEL ||
  "claude-sonnet-4-6";
const promptVersion = "home-knowledge-design-contract-v1";

const dimensions = [
  {
    key: "profile",
    sourceId: "enterprise_profile",
    label: "Enterprise Profile",
    file: "00_enterprise_profile.csv",
    preferredColumns: [
      "business_name",
      "industry",
      "tenant_archetype",
      "summary",
      "confidence",
    ],
  },
  {
    key: "functions",
    sourceId: "business_functions",
    label: "Business Functions",
    file: "01_business_functions.csv",
    preferredColumns: [
      "business_name",
      "owner_role",
      "operating_model",
      "metrics_or_kpis",
      "processes",
      "confidence",
    ],
  },
  {
    key: "org",
    sourceId: "org_ownership",
    label: "Org Ownership",
    file: "02_org_ownership.csv",
    preferredColumns: [
      "business_name",
      "owner_role",
      "operating_model",
      "metrics_or_kpis",
      "processes",
      "confidence",
    ],
  },
  {
    key: "workforce",
    sourceId: "workforce_roles",
    label: "Workforce Roles",
    file: "03_workforce_roles.csv",
    preferredColumns: [
      "interview_group",
      "priority_theme",
      "decision_supported",
      "evidence_needed",
      "known_challenge",
      "confidence",
    ],
  },
  {
    key: "apps",
    sourceId: "applications_systems",
    label: "Applications & Systems",
    file: "04_applications_systems.csv",
    preferredColumns: [
      "business_name",
      "capability",
      "owner",
      "criticality",
      "lifecycle_status",
      "integrations",
      "data_dependencies",
      "confidence",
    ],
  },
  {
    key: "data",
    sourceId: "data_assets_integrations",
    label: "Data Assets & Integrations",
    file: "05_data_assets_integrations.csv",
    preferredColumns: [
      "business_name",
      "use_case",
      "data_domain",
      "systems",
      "evidence_needed",
      "confidence",
    ],
  },
  {
    key: "infra",
    sourceId: "infrastructure_platforms",
    label: "Infrastructure & Platforms",
    file: "06_infrastructure_platforms.csv",
    preferredColumns: [
      "business_name",
      "capability",
      "owner",
      "criticality",
      "lifecycle_status",
      "integrations",
      "data_dependencies",
      "confidence",
    ],
  },
  {
    key: "vendors",
    sourceId: "vendors_contracts",
    label: "Vendors & Contracts",
    file: "07_vendors_contracts.csv",
    preferredColumns: [
      "business_name",
      "service",
      "owning_function",
      "linked_systems",
      "contract_risk",
      "pricing_basis",
      "confidence",
    ],
  },
  {
    key: "budget",
    sourceId: "it_budget_spend_value",
    label: "IT Budget, Spend & Value",
    file: "08_it_budget_spend_value.csv",
    preferredColumns: [
      "business_name",
      "value_hypothesis",
      "amount_usd",
      "realized_value_usd",
      "value_boundary",
      "confidence",
    ],
  },
  {
    key: "programs",
    sourceId: "programs_initiatives",
    label: "Programs & Initiatives",
    file: "09_programs_initiatives.csv",
    preferredColumns: [
      "business_name",
      "use_case",
      "data_domain",
      "systems",
      "evidence_needed",
      "confidence",
    ],
  },
  {
    key: "ai",
    sourceId: "ai_automation_use_cases",
    label: "AI & Automation Use Cases",
    file: "10_ai_automation_use_cases.csv",
    preferredColumns: [
      "business_name",
      "use_case",
      "data_domain",
      "systems",
      "value_hypothesis",
      "evidence_needed",
      "confidence",
    ],
  },
  {
    key: "risks",
    sourceId: "risks_controls",
    label: "Risks & Controls",
    file: "11_risks_controls.csv",
    preferredColumns: [
      "business_name",
      "use_case",
      "risk_or_gap",
      "affected_systems",
      "metric_boundary",
      "forbidden_claims",
      "confidence",
    ],
  },
  {
    key: "rel",
    sourceId: "relationships",
    label: "Relationships",
    file: "12_relationships.csv",
    preferredColumns: [
      "business_name",
      "use_case",
      "risk_or_gap",
      "affected_systems",
      "metric_boundary",
      "forbidden_claims",
      "confidence",
    ],
  },
  {
    key: "evidence",
    sourceId: "evidence_sources",
    label: "Evidence Sources",
    file: "13_evidence_sources.csv",
    preferredColumns: [
      "business_name",
      "evidence_type",
      "evidence_location",
      "evidence_owner",
      "evidence_boundary",
      "confidence",
    ],
  },
  {
    key: "metrics",
    sourceId: "metrics_outcomes",
    label: "Metrics & Outcomes",
    file: "14_metrics_outcomes.csv",
    preferredColumns: [
      "business_name",
      "use_case",
      "risk_or_gap",
      "affected_systems",
      "metric_boundary",
      "forbidden_claims",
      "confidence",
    ],
  },
  {
    key: "industry",
    sourceId: "industry_context",
    label: "Industry Context",
    file: "15_industry_context_patterns.csv",
    preferredColumns: [
      "business_name",
      "industry_context",
      "signals",
      "module_next_actions",
      "confidence",
    ],
  },
  {
    key: "lenses",
    sourceId: "expert_lenses",
    label: "Expert Lenses",
    file: "16_expert_lenses.csv",
    preferredColumns: [
      "business_name",
      "industry_context",
      "signals",
      "module_next_actions",
      "confidence",
    ],
  },
  {
    key: "ms",
    sourceId: "managed_services",
    label: "Managed Services",
    file: "17_managed_services_scope.csv",
    preferredColumns: [
      "business_name",
      "service",
      "owning_function",
      "linked_systems",
      "contract_risk",
      "pricing_basis",
      "confidence",
    ],
  },
  {
    key: "opev",
    sourceId: "operational_evidence",
    label: "Operational Evidence",
    file: "18_operational_process_evidence.csv",
    preferredColumns: [
      "business_name",
      "industry_context",
      "signals",
      "module_next_actions",
      "confidence",
    ],
  },
];

const bannedVisiblePatterns = [
  /\bguidebook\b/i,
  /\bdefinition\b/i,
  /\bnot loaded\b/i,
  /\bAbarVa\b/,
  /\bV[4567]\b|\bv[4567]\b/,
  /\bsubstrate\b/i,
  /\bpacket\b/i,
  /\bruntime\b/i,
  /\bsource_record_id\b/i,
  /\brecord ID\b/i,
  /\bachieved value\b/i,
  /\brealized ROI\b/i,
  /\baudited savings\b/i,
  /\bclient production data\b/i,
];

function loadDotenvLocal() {
  const envPath = path.join(repoRoot, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("="))
      continue;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key])
      process.env[key] = rest.join("=").replace(/^['"]|['"]$/g, "");
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function clean(value) {
  return String(value ?? "")
    .replace(/\bnot loaded\b/gi, "not yet evidenced")
    .replace(/\bAbarVa\b/g, "Nexus")
    .replace(/\brealized ROI\b/gi, "measured value claims")
    .replace(/\bachieved ROI\b/gi, "validated ROI")
    .replace(/\baudited savings\b/gi, "validated savings")
    .replace(/\bachieved value\b/gi, "measured value")
    .replace(/\bdefinition\b/gi, "framing")
    .replace(/\bsubstrate\b/gi, "context layer")
    .replace(/\bpacket\b/gi, "context set")
    .replace(/\bruntime\b/gi, "product")
    .replace(/(?<!MER-)\bV[4567](?:\.[0-9]+)?\b/g, "canonical")
    .replace(/(?<!MER-)\bv[4567](?:\.[0-9]+)?\b/g, "canonical")
    .replace(/\s+/g, " ")
    .trim();
}

function compactJson(value) {
  return JSON.stringify(value, null, 2);
}

function cleanDeep(value) {
  if (typeof value === "string") return clean(value);
  if (Array.isArray(value)) return value.map(cleanDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, cleanDeep(entry)]),
    );
  }
  return value;
}

function uniq(values) {
  return [...new Set(values.map(clean).filter(Boolean))];
}

function fileMtimeIso(file) {
  return fs.existsSync(file)
    ? new Date(fs.statSync(file).mtimeMs).toISOString()
    : null;
}

function parseDesignTemplate() {
  const html = fs.readFileSync(designHtmlPath, "utf8");
  const match = html.match(
    /<script type="__bundler\/template">\s*([\s\S]*?)\s*<\/script>/,
  );
  if (!match) throw new Error("Could not find bundled design template");
  const template = JSON.parse(match[1]);
  const templateOut = path.join(reportDir, "nexus-home-knowledge-template.html");
  fs.writeFileSync(templateOut, template);
  const slotNames = [
    "DIMS",
    "DATA",
    "INSIGHTS",
    "STORY",
    "REL",
    "DGAPS",
    "EVID",
    "FACTS",
    "KPIS",
    "BRIEF_COLS",
    "PRIORITIES",
    "SIGNALS",
    "CONF_TABLE",
    "DEC_CAN",
    "DEC_CANNOT",
    "GAPS",
    "USE_CASES",
    "EVIDENCE",
    "NEXT_EVIDENCE",
  ];
  const slots = Object.fromEntries(
    slotNames.map((name) => [name, parseClassField(template, name)]),
  );
  return {
    design_html_path: designHtmlPath,
    extracted_template_path: templateOut,
    slots,
    tabs: {
      home: ["Overview", "Evidence Gaps", "Use Cases", "Proof"],
      dimension: ["Overview", "Data", "Relationships", "Gaps", "Evidence"],
    },
  };
}

function parseClassField(source, fieldName) {
  const marker = `  ${fieldName} = `;
  const start = source.indexOf(marker);
  if (start < 0) return null;
  let index = start + marker.length;
  while (/\s/.test(source[index])) index += 1;
  const opener = source[index];
  const closer = opener === "[" ? "]" : opener === "{" ? "}" : null;
  if (!closer) {
    const end = source.indexOf(";", index);
    return evaluateLiteral(source.slice(index, end));
  }
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      continue;
    }
    if (char === opener) depth += 1;
    if (char === closer) {
      depth -= 1;
      if (depth === 0) {
        return evaluateLiteral(source.slice(start + marker.length, index + 1));
      }
    }
  }
  throw new Error(`Could not parse design field ${fieldName}`);
}

function evaluateLiteral(literal) {
  // Design HTML is a local artifact supplied by the operator. Evaluate only the
  // extracted class-field literals, not arbitrary page script.
  return Function(`"use strict"; return (${literal});`)();
}

function rowsForDimension(dimension) {
  const absolute = path.join(inputRoot, dimension.file);
  const rows = fs.existsSync(absolute) ? readCsv(absolute) : [];
  return rows.map((row) => ({ ...row, __source_file: absolute }));
}

function displayCell(value) {
  const text = clean(value);
  if (!text || /^(not_provided|unknown|n\/a|null|undefined)$/i.test(text)) {
    return "Needs evidence";
  }
  return text;
}

function evidenceStatusFromRows(rows) {
  const high = rows.filter((row) => row.confidence === "high").length;
  const medium = rows.filter((row) => row.confidence === "medium").length;
  const total = rows.length || 1;
  if (high / total >= 0.65) return "source-backed";
  if ((high + medium) / total >= 0.55) return "directional";
  return "needs-evidence";
}

function pctFromStatus(status, rows) {
  const total = rows.length || 1;
  const high = rows.filter((row) => row.confidence === "high").length;
  const medium = rows.filter((row) => row.confidence === "medium").length;
  const score =
    status === "source-backed"
      ? Math.round(((high + medium * 0.6) / total) * 100)
      : status === "directional"
        ? Math.round(((high + medium * 0.4) / total) * 100)
        : Math.round(((high + medium * 0.25) / total) * 100);
  return `${Math.max(35, Math.min(96, score))}%`;
}

function summarizeDimension(dimension) {
  const rows = rowsForDimension(dimension);
  const activeRows = rows.filter(
    (row) => clean(row.active_candidate_status || "active") !== "candidate",
  );
  const evidenceRefs = uniq(rows.map((row) => row.evidence_id));
  const status = evidenceStatusFromRows(rows);
  const gapSignals = uniq(
    rows.map(
      (row) =>
        row.evidence_needed ||
        row.risk_or_gap ||
        row.value_boundary ||
        row.evidence_boundary ||
        row.forbidden_claims,
    ),
  ).slice(0, 24);
  return {
    key: dimension.key,
    source_id: dimension.sourceId,
    label: dimension.label,
    file: `datasets/tenant-inputs/meridian-health/standard-2026-07-v3/${dimension.file}`,
    refreshed_at: fileMtimeIso(path.join(inputRoot, dimension.file)),
    rows_total: rows.length,
    rows_active: activeRows.length,
    candidate_rows: rows.length - activeRows.length,
    confidence_counts: countBy(rows, "confidence"),
    status,
    pct: pctFromStatus(status, rows),
    evidence_ref_count: evidenceRefs.length,
    evidence_refs: evidenceRefs.slice(0, 40),
    all_evidence_refs: evidenceRefs,
    representative_items: uniq(
      rows.map((row) => row.business_name || row.context_item),
    ).slice(0, 35),
    owners: uniq(rows.map((row) => row.owner || row.owner_role || row.evidence_owner)).slice(
      0,
      20,
    ),
    systems: uniq(
      rows.map(
        (row) =>
          row.systems ||
          row.affected_systems ||
          row.integrations ||
          row.linked_systems ||
          row.data_dependencies ||
          row.vendor_id,
      ),
    ).slice(0, 30),
    use_cases: uniq(rows.map((row) => row.use_case)).slice(0, 24),
    gaps: gapSignals,
    examples: rows.slice(0, 18).map((row) => compactRow(row)),
  };
}

function countBy(rows, field) {
  const out = {};
  for (const row of rows) {
    const key = clean(row[field] || "blank");
    out[key] = (out[key] || 0) + 1;
  }
  return out;
}

function compactRow(row) {
  return Object.fromEntries(
    [
      "business_name",
      "context_item",
      "confidence",
      "active_candidate_status",
      "capability",
      "owner",
      "criticality",
      "lifecycle_status",
      "vendor_id",
      "integrations",
      "data_dependencies",
      "use_case",
      "data_domain",
      "systems",
      "value_hypothesis",
      "evidence_needed",
      "risk_or_gap",
      "affected_systems",
      "metric_boundary",
      "forbidden_claims",
      "service",
      "owning_function",
      "linked_systems",
      "contract_risk",
      "pricing_basis",
      "evidence_id",
    ]
      .map((key) => [key, clean(row[key])])
      .filter(([, value]) => value),
  );
}

function buildDataViews() {
  const out = {};
  for (const dimension of dimensions) {
    const rows = rowsForDimension(dimension);
    const selectedColumns = [
      ...dimension.preferredColumns.filter((column) =>
        rows.some((row) => clean(row[column])),
      ),
      ...Object.keys(rows[0] ?? {}).filter(
        (column) =>
          !dimension.preferredColumns.includes(column) &&
          !column.startsWith("__") &&
          ![
            "tenant_key",
            "record_id",
            "entity_id",
            "source_type",
            "source_basis",
            "synthetic_data_flag",
          ].includes(column) &&
          rows.some((row) => clean(row[column])),
      ),
    ].slice(0, 9);
    const facetColumn =
      ["confidence", "active_candidate_status", "criticality", "lifecycle_status"].find(
        (column) => selectedColumns.includes(column),
      ) ?? null;
    out[dimension.key] = {
      source_file: `datasets/tenant-inputs/meridian-health/standard-2026-07-v3/${dimension.file}`,
      source_layer: "canonical tenant input -> approved Home design contract pack",
      refreshed_at: fileMtimeIso(path.join(inputRoot, dimension.file)),
      row_count: rows.length,
      facet: facetColumn
        ? { k: facetColumn, label: humanize(facetColumn) }
        : null,
      columns: selectedColumns.map((column) => ({
        k: column,
        label: humanize(column),
        pill: column === "confidence" ? "status" : undefined,
      })),
      rows: rows.map((row) =>
        Object.fromEntries(
          selectedColumns.map((column) => [column, displayCell(row[column])]),
        ),
      ),
    };
  }
  return out;
}

function humanize(value) {
  return clean(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function buildContext(designContract) {
  const dimensionSummaries = dimensions.map(summarizeDimension);
  const interviews = fs.existsSync(interviewPath) ? readCsv(interviewPath) : [];
  return {
    tenant_key: tenantKey,
    tenant_name: tenantName,
    as_of_date: "2026-07-17",
    source_location:
      "datasets/tenant-inputs/meridian-health/standard-2026-07-v3",
    boundary:
      "synthetic_demo_phi_free_planning_grade; not real Meridian production data",
    design_contract: {
      source_html: designHtmlPath,
      required_home_tabs: designContract.tabs.home,
      required_dimension_tabs: designContract.tabs.dimension,
      required_slots: Object.keys(designContract.slots).filter(
        (key) => designContract.slots[key] !== null,
      ),
    },
    totals: {
      dimensions: dimensionSummaries.length,
      source_rows: dimensionSummaries.reduce(
        (sum, dimension) => sum + dimension.rows_total,
        0,
      ),
      active_rows: dimensionSummaries.reduce(
        (sum, dimension) => sum + dimension.rows_active,
        0,
      ),
      evidence_refs: uniq(
        dimensionSummaries.flatMap((dimension) => dimension.evidence_refs),
      ).length,
    },
    dimensions: dimensionSummaries,
    critical_current_state: {
      on_premise_and_legacy: [
        "Epic Hyperspace, Epic Clarity, Epic Caboodle",
        "on-prem SQL Server reporting marts",
        "Tableau reporting estate",
        "SAS analytics estate",
        "Power BI reporting estate",
        "claims administration platform",
        "pharmacy claims platform",
        "CRM member service and contact center telephony",
      ],
      target_state_boundary: [
        "AWS and Databricks are target/future foundation direction",
        "no certified medallion architecture is evidenced",
        "no patient/member identity spine is evidenced",
        "no formal data governance operating model is evidenced",
        "no AI audit trail evidence is evidenced",
      ],
    },
    executive_interview_context: selectInterviewExcerpts(interviews),
  };
}

function selectInterviewExcerpts(rows) {
  const priority = [
    /CEO|Enterprise Strategy/i,
    /CDAO|Data/i,
    /CFO|Finance/i,
    /CIO|Technology/i,
    /Clinical|CMO/i,
    /Health Plan/i,
    /Contact Center|Experience/i,
    /Quality|Provider/i,
    /Security|Risk|Privacy/i,
    /Procurement|Sourcing/i,
    /Transformation|PMO|Program/i,
  ];
  const selected = [];
  const used = new Set();
  for (const pattern of priority) {
    const match = rows.find((row) => {
      const id = `${row.interview_id}:${row.question_id}`;
      return (
        !used.has(id) &&
        pattern.test(
          `${row.interview_group} ${row.executive_area} ${row.stakeholder_role}`,
        )
      );
    });
    if (match) {
      used.add(`${match.interview_id}:${match.question_id}`);
      selected.push(match);
    }
  }
  return selected.slice(0, 18).map((row) => ({
    stakeholder_role: clean(row.stakeholder_role),
    interview_group: clean(row.interview_group),
    priority_theme: clean(row.priority_theme),
    question: clean(row.question),
    excerpt_text: clean(row.synthetic_answer),
    evidence_id: clean(row.evidence_id),
    source: `datasets/tenant-inputs/meridian-health/interviews/executive_interviews.csv:${row.__sourceRowNumber}`,
  }));
}

function buildPrompt(context) {
  return `You are generating the deterministic Home / Knowledge content pack for Nexus.

This content will fill an existing HTML design exactly. Do not redesign the page.
Your job is to generate consultant-grade content for the named slots from the supplied canonical context.

Audience:
- CXO / EVP / CIO / CDAO level.
- The page must tell the enterprise story, not explain UI intent.
- Write like a top-tier strategy consultant synthesizing an enterprise context review.

Data boundary:
- All facts are synthetic, PHI-free, planning-grade demo context.
- Do not claim real Meridian production data.
- Do not claim audited realized savings, achieved ROI, production AI readiness, or completed AWS/Databricks lakehouse.
- AWS and Databricks are future/target foundation direction unless the context explicitly says otherwise.
- If the design placeholder has a stronger numeric claim than the context supports, replace it with a caveat or supported lower-grain statement.

Language rules:
- Product name is Nexus.
- Avoid "AbarVa", "guidebook", "definition", "not loaded", "runtime", "packet", "substrate", "record ID", and old version labels.
- Do not define dimensions generically. Every paragraph must say what the Meridian context implies.
- Use short, scannable text. No giant paragraphs.
- Preserve decision boundaries: what Nexus can support now vs what it cannot infer yet.

Required output:
- Fill the exact design slots listed in the schema.
- Keep slot names stable.
- Include source/evidence IDs from the supplied context where relevant.
- Include gaps where the context is missing enough proof.
- Include relationship and visual-ready content that can render as cards, tables, and diagrams.

Canonical context follows:
${compactJson(context)}`;
}

function buildDimensionPrompt(context, dimensionKey, currentPack) {
  const dimension = context.dimensions.find((item) => item.key === dimensionKey);
  if (!dimension) throw new Error(`Unknown dimension ${dimensionKey}`);
  const relationshipContext = context.dimensions.find((item) => item.key === "rel");
  const riskContext = context.dimensions.find((item) => item.key === "risks");
  const evidenceContext = context.dimensions.find((item) => item.key === "evidence");
  return `Generate exactly one missing Nexus Home / Knowledge dimension slot.

Design contract:
- This fills one entry under design_slots.DIMS plus INSIGHTS/STORY/REL/DGAPS/EVID for the supplied dimension.
- Use the exact key: ${dimensionKey}
- Write tenant-specific insights. Do not define the dimension generically.
- Keep it concise and boardroom useful.
- Product name is Nexus.
- No AbarVa, old version labels, record IDs, guidebook language, or unsupported realized-value claims.
- This is synthetic, PHI-free, planning-grade demo context.
- AWS/Databricks are target/future-state direction, not certified current production.

Use the context below:
${compactJson({
  tenant_key: context.tenant_key,
  tenant_name: context.tenant_name,
  boundary: context.boundary,
  critical_current_state: context.critical_current_state,
  dimension,
  relationship_context: relationshipContext
    ? {
        rows_total: relationshipContext.rows_total,
        representative_items: relationshipContext.representative_items.slice(0, 12),
        gaps: relationshipContext.gaps.slice(0, 12),
      }
    : null,
  risk_context: riskContext
    ? {
        rows_total: riskContext.rows_total,
        representative_items: riskContext.representative_items.slice(0, 12),
        gaps: riskContext.gaps.slice(0, 12),
      }
    : null,
  evidence_context: evidenceContext
    ? {
        rows_total: evidenceContext.rows_total,
        representative_items: evidenceContext.representative_items.slice(0, 12),
      }
    : null,
  overview_story_anchor: {
    priorities: currentPack.home_overview?.priorities?.slice(0, 5) ?? [],
    top_use_cases: currentPack.use_cases?.top_5?.slice(0, 5) ?? [],
  },
})}`;
}

function buildDimensionToolSchema() {
  return {
    name: "emit_home_knowledge_dimension",
    description:
      "Emit one Nexus Home Knowledge dimension object matching the design contract.",
    input_schema: dimensionSchema,
  };
}

function buildToolSchema() {
  return {
  name: "emit_home_knowledge_design_pack",
  description: "Emit Nexus Home Knowledge content matching the supplied HTML design contract.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "home_overview",
      "context_confidence",
      "evidence_gaps",
      "use_cases",
      "proof",
      "dimensions",
      "quality_assessment",
    ],
    properties: {
      home_overview: {
        type: "object",
        additionalProperties: false,
        required: [
          "facts",
          "kpis",
          "brief_cols",
          "priorities",
          "signals",
          "dec_can",
          "dec_cannot",
        ],
        properties: {
          facts: { type: "array", minItems: 8, maxItems: 12, items: factSchema },
          kpis: { type: "array", minItems: 5, maxItems: 5, items: kpiSchema },
          brief_cols: {
            type: "array",
            minItems: 4,
            maxItems: 4,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["label", "text", "evidence_refs"],
              properties: {
                label: { type: "string" },
                text: { type: "string" },
                evidence_refs: stringArraySchema,
              },
            },
          },
          priorities: {
            type: "array",
            minItems: 5,
            maxItems: 5,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["n", "title", "detail", "evidence_refs"],
              properties: {
                n: { type: "string" },
                title: { type: "string" },
                detail: { type: "string" },
                evidence_refs: stringArraySchema,
              },
            },
          },
          signals: {
            type: "array",
            minItems: 3,
            maxItems: 4,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["role", "source", "initials", "quote", "evidence_refs"],
              properties: {
                role: { type: "string" },
                source: { type: "string" },
                initials: { type: "string" },
                quote: { type: "string" },
                evidence_refs: stringArraySchema,
              },
            },
          },
          dec_can: stringArraySchema,
          dec_cannot: stringArraySchema,
        },
      },
      context_confidence: {
        type: "object",
        additionalProperties: false,
        required: ["summary", "conf_table", "visual_caption"],
        properties: {
          summary: { type: "string" },
          conf_table: {
            type: "array",
            minItems: 6,
            maxItems: 12,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["dim", "status", "note", "evidence_refs"],
              properties: {
                dim: { type: "string" },
                status: {
                  type: "string",
                  enum: ["source-backed", "directional", "needs-evidence"],
                },
                note: { type: "string" },
                evidence_refs: stringArraySchema,
              },
            },
          },
          visual_caption: { type: "string" },
        },
      },
      evidence_gaps: {
        type: "object",
        additionalProperties: false,
        required: ["summary", "gaps", "next_evidence"],
        properties: {
          summary: { type: "string" },
          gaps: {
            type: "array",
            minItems: 5,
            maxItems: 8,
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "type",
                "severity",
                "title",
                "blocks",
                "evidence_refs",
              ],
              properties: {
                type: { type: "string" },
                severity: { type: "string", enum: ["High", "Medium"] },
                title: { type: "string" },
                blocks: { type: "string" },
                evidence_refs: stringArraySchema,
              },
            },
          },
          next_evidence: {
            type: "array",
            minItems: 4,
            maxItems: 8,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["item", "unlocks", "owner_hint"],
              properties: {
                item: { type: "string" },
                unlocks: { type: "string" },
                owner_hint: { type: "string" },
              },
            },
          },
        },
      },
      use_cases: {
        type: "object",
        additionalProperties: false,
        required: ["summary", "top_5", "portfolio_view"],
        properties: {
          summary: { type: "string" },
          top_5: {
            type: "array",
            minItems: 5,
            maxItems: 5,
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "name",
                "fn",
                "stage",
                "value",
                "gate",
                "why_this_is_top_5",
                "evidence_refs",
              ],
              properties: {
                name: { type: "string" },
                fn: { type: "string" },
                stage: { type: "string" },
                value: { type: "string" },
                gate: { type: "string" },
                why_this_is_top_5: { type: "string" },
                evidence_refs: stringArraySchema,
              },
            },
          },
          portfolio_view: { type: "string" },
        },
      },
      proof: {
        type: "object",
        additionalProperties: false,
        required: ["summary", "evidence", "relationship_visual"],
        properties: {
          summary: { type: "string" },
          evidence: {
            type: "array",
            minItems: 8,
            maxItems: 12,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "type", "supports", "date", "status"],
              properties: {
                name: { type: "string" },
                type: { type: "string", enum: ["doc", "sys", "int"] },
                supports: { type: "string" },
                date: { type: "string" },
                status: {
                  type: "string",
                  enum: ["source-backed", "directional", "needs-evidence"],
                },
              },
            },
          },
          relationship_visual: {
            type: "object",
            additionalProperties: false,
            required: ["title", "caption", "nodes", "edges"],
            properties: {
              title: { type: "string" },
              caption: { type: "string" },
              nodes: stringArraySchema,
              edges: stringArraySchema,
            },
          },
        },
      },
      dimensions: {
        type: "object",
        additionalProperties: dimensionSchema,
      },
      quality_assessment: {
        type: "object",
        additionalProperties: false,
        required: [
          "hits_mckinsey_bar",
          "story_strength",
          "known_weaknesses",
          "why_this_is_better_than_current",
        ],
        properties: {
          hits_mckinsey_bar: { type: "string", enum: ["yes", "partial", "no"] },
          story_strength: { type: "string" },
          known_weaknesses: stringArraySchema,
          why_this_is_better_than_current: { type: "string" },
        },
      },
    },
  },
  };
}

const stringArraySchema = {
  type: "array",
  items: { type: "string" },
};

const factSchema = {
  type: "object",
  additionalProperties: false,
  required: ["label", "value", "sub", "st", "evidence_refs"],
  properties: {
    label: { type: "string" },
    value: { type: "string" },
    sub: { type: "string" },
    st: { type: "string", enum: ["source-backed", "directional", "needs-evidence"] },
    evidence_refs: stringArraySchema,
  },
};

const kpiSchema = {
  type: "object",
  additionalProperties: false,
  required: ["label", "value", "sub", "tone"],
  properties: {
    label: { type: "string" },
    value: { type: "string" },
    sub: { type: "string" },
    tone: { type: "string", enum: ["brand", "plain", "green", "amber"] },
  },
};

const dimensionSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "key",
    "summary",
    "covers",
    "sources",
    "story",
    "insights",
    "relationships",
    "gaps",
    "evidence",
  ],
  properties: {
    key: { type: "string" },
    summary: { type: "string" },
    covers: stringArraySchema,
    sources: stringArraySchema,
    story: {
      type: "object",
      additionalProperties: false,
      required: ["meaning", "observed", "matters", "supports"],
      properties: {
        meaning: { type: "string" },
        observed: { type: "string" },
        matters: { type: "string" },
        supports: { type: "string" },
      },
    },
    insights: {
      type: "object",
      additionalProperties: false,
      required: ["findings", "breakdown"],
      properties: {
        findings: stringArraySchema,
        breakdown: {
          type: "object",
          additionalProperties: false,
          required: ["title", "rows"],
          properties: {
            title: { type: "string" },
            rows: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["label", "value", "note"],
                properties: {
                  label: { type: "string" },
                  value: { type: "string" },
                  note: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    relationships: {
      type: "object",
      additionalProperties: false,
      required: ["chain", "note"],
      properties: {
        chain: stringArraySchema,
        note: { type: "string" },
      },
    },
    gaps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["missing", "blocks", "needed", "handoff"],
        properties: {
          missing: { type: "string" },
          blocks: { type: "string" },
          needed: { type: "string" },
          handoff: { type: "string" },
        },
      },
    },
    evidence: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "type", "date", "rows", "facts", "st", "fields", "supports", "missing"],
        properties: {
          name: { type: "string" },
          type: { type: "string" },
          date: { type: "string" },
          rows: { type: "string" },
          facts: { type: "string" },
          st: { type: "string", enum: ["source-backed", "directional", "needs-evidence"] },
          fields: { type: "string" },
          supports: { type: "string" },
          missing: { type: "string" },
        },
      },
    },
  },
};

function validatePack(pack, context) {
  const issues = [];
  const dimensionContainer =
    pack.dimensions ??
    pack.design_slots?.STORY ??
    pack.design_slots?.INSIGHTS ??
    {};
  for (const key of dimensions.map((dimension) => dimension.key)) {
    if (!dimensionContainer?.[key]) issues.push(`missing dimension ${key}`);
  }
  const text = JSON.stringify(pack);
  for (const pattern of bannedVisiblePatterns) {
    if (pattern.test(text)) issues.push(`blocked visible language: ${pattern}`);
  }
  const allowedEvidence = new Set(
    context.dimensions.flatMap(
      (dimension) => dimension.all_evidence_refs ?? dimension.evidence_refs,
    ),
  );
  const referenced = [...text.matchAll(/MER-[A-Z0-9-]+/g)]
    .map((m) => m[0])
    .filter((id) => id.includes("EVID"));
  for (const id of referenced) {
    if (!allowedEvidence.has(id) && !id.startsWith("MER-SA07-INT-EVID")) {
      issues.push(`unsupported evidence id ${id}`);
    }
  }
  return {
    status: issues.length ? "fail" : "pass",
    issues,
  };
}

async function generateMissingDimensions(anthropic, context, claudePack) {
  if (!claudePack.dimensions || typeof claudePack.dimensions !== "object") {
    claudePack.dimensions = {};
  }
  const missing = dimensions
    .map((dimension) => dimension.key)
    .filter((key) => !claudePack.dimensions[key]);
  if (process.env.HOME_KNOWLEDGE_DIMENSION_REPAIR !== "claude") {
    const storyBlocks = readExistingStoryBlocks();
    for (const key of missing) {
      claudePack.dimensions[key] = fallbackDimensionFromApprovedStory(
        key,
        context,
        storyBlocks,
      );
    }
    return missing.map((key) => `${key}:approved-story-fallback`);
  }
  for (const key of missing) {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 7000,
      temperature: 0.15,
      system:
        "You generate one governed Nexus Home/Knowledge dimension object. Use the supplied tool only.",
      messages: [{ role: "user", content: buildDimensionPrompt(context, key, claudePack) }],
      tools: [buildDimensionToolSchema()],
      tool_choice: { type: "tool", name: "emit_home_knowledge_dimension" },
    });
    const outFile = path.join(reportDir, `raw-claude-response-dimension-${key}.json`);
    fs.writeFileSync(outFile, compactJson(response));
    const toolUse = response.content.find((part) => part.type === "tool_use");
    if (!toolUse) throw new Error(`Claude did not return dimension payload for ${key}`);
    claudePack.dimensions[key] = {
      ...toolUse.input,
      key,
    };
  }
  return missing;
}

function readExistingStoryBlocks() {
  const candidates = [
    path.join(approvedHomeDir, "story-blocks.json"),
    path.join(approvedMirrorDir, "approved-cxo-story-blocks.json"),
  ];
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    try {
      const parsed = JSON.parse(fs.readFileSync(candidate, "utf8"));
      return Array.isArray(parsed) ? parsed : parsed.story_blocks ?? [];
    } catch {
      // Try the next candidate.
    }
  }
  return [];
}

function fallbackDimensionFromApprovedStory(key, context, storyBlocks) {
  const dimension = context.dimensions.find((item) => item.key === key);
  const label = dimension?.label ?? key;
  const block = storyBlocks.find(
    (candidate) =>
      normalizeDimensionName(candidate.dimension) ===
      normalizeDimensionName(label),
  );
  const curated = curatedDimensionFallback(key);
  const topGaps = (dimension?.gaps ?? [])
    .filter((gap) => !/^synthetic/i.test(gap))
    .slice(0, 3);
  const sourceFileName = dimension?.file?.split("/").pop() ?? `${key}.csv`;
  return {
    key,
    summary:
      curated.summary ||
      clean(block?.executive_summary || block?.summary) ||
      `${label} has source-backed Meridian context with named evidence boundaries.`,
    covers: (dimension?.representative_items ?? []).slice(0, 4),
    sources: [sourceFileName, ...(dimension?.evidence_refs ?? []).slice(0, 3)],
    story: {
      meaning:
        curated.meaning ||
        clean(block?.what_context_reveals || block?.narrative) ||
        `${label} is represented in the Meridian context and should be interpreted with the visible evidence boundary.`,
      observed:
        curated.observed ||
        clean(block?.summary) ||
        `${dimension?.rows_total ?? 0} source rows are available for this dimension.`,
      matters:
        curated.matters ||
        clean(block?.why_it_matters) ||
        `${label} matters because it shapes which business decisions Nexus can support now and which decisions need more evidence.`,
      supports:
        curated.supports ||
        clean(block?.decision_implication) ||
        "Supports enterprise orientation and evidence review; does not support measured-value or production-readiness claims by itself.",
    },
    insights: {
      findings: [
        curated.findings?.[0] ||
          clean(block?.what_context_reveals || block?.summary) ||
          `${label} has source-backed context for orientation.`,
        curated.findings?.[1] ||
          clean(block?.why_it_matters) ||
          "Decision usefulness depends on ownership, baseline, and evidence depth.",
        curated.findings?.[2] ||
          clean(block?.evidence_still_needed) ||
          (topGaps[0] ? `Next evidence needed: ${topGaps[0]}` : "No priority gap surfaced beyond the standard synthetic boundary."),
      ],
      breakdown: {
        title: `${label} evidence posture`,
        rows: [
          {
            label: "Source rows",
            value: String(dimension?.rows_total ?? 0),
            note: "Canonical input rows available to the Home data tab.",
          },
          {
            label: "Evidence references",
            value: String(dimension?.evidence_ref_count ?? 0),
            note: "Evidence identifiers visible in the context layer.",
          },
          {
            label: "Readiness",
            value: statusLabel(dimension?.status),
            note: "Derived from confidence mix and known evidence boundaries.",
          },
        ],
      },
    },
    relationships: {
      chain: relationshipChainForDimension(key, label),
      note:
        "Relationship interpretation is advisory until cross-domain links are validated against source evidence.",
    },
    gaps:
      topGaps.length > 0
        ? topGaps.slice(0, 2).map((gap) => ({
            missing: clean(gap),
            blocks: "Decision-grade dependency, value, or execution claims",
            needed:
              "Client-confirmed ownership, baseline, lineage, or source evidence",
            handoff: handoffForDimension(key),
          }))
        : defaultGapsForDimension(key, label),
    evidence: [
      {
        name: sourceFileName,
        type: "Canonical input",
        date: "Jul 2026",
        rows: String(dimension?.rows_total ?? 0),
        facts: String(dimension?.evidence_ref_count ?? 0),
        st: dimension?.status ?? "directional",
        fields: (dimension?.examples?.[0]
          ? Object.keys(dimension.examples[0]).slice(0, 5).join(", ")
          : "business_name, confidence, evidence_id"),
        supports: label,
        missing: topGaps[0] ?? "Named client validation where required",
      },
    ],
  };
}

function defaultGapsForDimension(key, label) {
  const defaultByKey = {
    org: [
      {
        missing: "Named decision owners and steering cadence not yet confirmed",
        blocks:
          "Nexus can describe role-level ownership, but should not assign accountability or phase gates to named leaders until client confirmation.",
        needed:
          "Executive ownership map with decision rights, escalation path, and governance meeting cadence",
        handoff: "Moves",
      },
      {
        missing: "Cross-functional governance model still needs operating proof",
        blocks:
          "AI and lakehouse work spans clinical, health plan, finance, data, and platform teams; unclear governance slows execution sequencing.",
        needed:
          "CDAO/CDIO/CFO/CMO governance charter and accountable product-owner assignments",
        handoff: "Knowledge",
      },
    ],
    infra: [
      {
        missing: "AWS and Databricks target architecture not certified as current production",
        blocks:
          "Nexus can frame AWS/Databricks as the target foundation, but cannot claim production lakehouse readiness.",
        needed:
          "Landing-zone design, network/security controls, medallion architecture, Unity Catalog governance, and migration plan",
        handoff: "Moves",
      },
      {
        missing: "On-prem analytics dependency map needs lineage validation",
        blocks:
          "SQL Server marts, Tableau, SAS, and Power BI dependencies can be described, but not retired or sequenced without lineage proof.",
        needed:
          "Current-state reporting lineage from Epic/claims/pharmacy through SQL marts and BI tools",
        handoff: "Knowledge",
      },
    ],
    vendors: [
      {
        missing: "Vendor contracts, SLAs, and rate cards not loaded in governed form",
        blocks:
          "Source can frame vendor/provider scope, but cannot estimate sourcing savings or commercial leverage.",
        needed:
          "Signed contracts, SLAs, pricing schedules, renewal dates, service catalogs, and vendor owner mapping",
        handoff: "Source",
      },
      {
        missing: "Managed analytics service economics need validation",
        blocks:
          "The maintenance-heavy capacity signal cannot become a savings claim until ticket mix, rates, and service levels are evidenced.",
        needed:
          "Ticket volumes, maintenance/new-build split, service backlog, labor rates, and SLA performance",
        handoff: "Source",
      },
    ],
    evidence: [
      {
        missing: "Evidence coverage must be tied to decision-grade claims",
        blocks:
          "Nexus can cite loaded files, but should not treat every source row as sufficient for investment or value decisions.",
        needed:
          "Claim-to-evidence map showing which facts are source-backed, directional, or blocked",
        handoff: "Knowledge",
      },
      {
        missing: "Workshop-confirmed artifacts still needed for owner-sensitive claims",
        blocks:
          "Synthetic planning context should not become client production evidence without named confirmation.",
        needed:
          "Workshop notes, signed-off architecture artifacts, baseline extracts, and owner attestations",
        handoff: "Knowledge",
      },
    ],
    industry: [
      {
        missing: "External benchmark ranges not attached to Meridian-specific baselines",
        blocks:
          "Industry patterns can guide prioritization, but cannot quantify Meridian value or maturity without internal baseline evidence.",
        needed:
          "Peer benchmark source, internal baseline, owner sign-off, and applicability caveat",
        handoff: "Intelligence",
      },
      {
        missing: "Healthcare regulatory and privacy constraints need artifact-level evidence",
        blocks:
          "AI and analytics recommendations must be bounded until PHI, audit, security, and governance controls are evidenced.",
        needed:
          "HIPAA/PHI control evidence, AI audit trail design, and data-access governance controls",
        handoff: "Knowledge",
      },
    ],
    lenses: [
      {
        missing: "Expert-lens recommendations need client-specific evidence gates",
        blocks:
          "Expert lenses can shape hypotheses, but cannot override missing ownership, baseline, or platform proof.",
        needed:
          "Lens-to-evidence matrix mapping each recommendation to validated facts, gaps, and caveats",
        handoff: "Intelligence",
      },
      {
        missing: "Prioritization weights require executive calibration",
        blocks:
          "The page can show likely focus areas, but cannot rank enterprise investments definitively without leadership weighting.",
        needed:
          "CXO-weighted prioritization criteria across value, risk, feasibility, urgency, and dependency unlock",
        handoff: "Knowledge",
      },
    ],
    ms: [
      {
        missing: "Managed services contract economics and SLA evidence not loaded",
        blocks:
          "Nexus can identify a maintenance-heavy operating pattern, but cannot estimate outsourcing budget improvement.",
        needed:
          "Vendor contract, rate card, ticket backlog, SLA performance, staffing mix, and renewal timeline",
        handoff: "Source",
      },
      {
        missing: "Capacity-shift baseline not validated",
        blocks:
          "The 80 percent maintenance-load signal requires evidence before it can support a transformation business case.",
        needed:
          "Current analytics team capacity split, ad hoc request mix, service demand trend, and work intake baseline",
        handoff: "Tower",
      },
    ],
    opev: [
      {
        missing: "Operational workflow evidence not yet complete enough for execution gates",
        blocks:
          "Use cases can be framed, but Moves should not advance without workflow owners, baseline metrics, and handoff evidence.",
        needed:
          "Current-state process maps, workflow volumes, exception paths, control points, and owner attestations",
        handoff: "Moves",
      },
      {
        missing: "Outcome measurement chain needs baseline and actuals",
        blocks:
          "Tower value proof cannot start until baseline, target, calculation logic, and measurement cadence are validated.",
        needed:
          "Metric definitions, baseline extracts, owner sign-off, target rationale, and actuals capture plan",
        handoff: "Tower",
      },
    ],
  };
  return (
    defaultByKey[key] ?? [
      {
        missing: `${label} decision boundary needs client validation`,
        blocks:
          "Nexus can support orientation, but not decision-grade claims without owner-reviewed evidence.",
        needed:
          "Client-confirmed ownership, baseline, lineage, source evidence, or workshop attestation",
        handoff: handoffForDimension(key),
      },
    ]
  );
}

function curatedDimensionFallback(key) {
  const fallback = {
    org: {
      summary:
        "Ownership is mapped to CDAO, CMO, Health Plan COO, VP Quality, CFO, CXO, and CDIO roles, but named accountable executives and decision rights still need client confirmation.",
      meaning:
        "Meridian's operating model is cross-functional: enterprise data, clinical operations, health plan operations, finance, quality, experience, and platform security all have a stake in the AI foundation.",
      observed:
        "The ownership map shows CDAO-led data governance needs, CMO and health-plan operational demand, CFO value oversight, and CDIO platform/security dependencies.",
      matters:
        "A McKinsey-style read would not start with tools; it would align decision rights first, because AI Agent Assist and lakehouse work cut across clinical, claims, finance, contact center, and platform teams.",
      supports:
        "Supports executive alignment, governance workshop design, Moves phase gates, and owner-specific evidence asks.",
      findings: [
        "The CDAO/CDIO/CFO axis is the critical governance triangle: data ownership, platform readiness, and value proof must move together.",
        "Clinical and health-plan owners create the demand signal, but cannot safely scale AI without certified data products and a patient/member identity spine.",
        "Next validation: named accountable leaders, decision rights, and steering cadence for each priority use case.",
      ],
    },
    workforce: {
      summary:
        "Executive interview evidence shows the workforce problem is not headcount; it is readiness to shift 120+ analytics resources from ad hoc maintenance toward governed data products and AI-enabled workflows.",
      meaning:
        "The workforce layer captures how strategy, operating model, vendor, platform, and data concerns show up in executive interviews and role-level adoption risk.",
      observed:
        "Interview-derived rows repeatedly point to maintenance-heavy analytics demand, unresolved governance, unclear ownership, and use-case teams waiting on the same data foundation prerequisites.",
      matters:
        "AI Agent Assist is a work redesign, not a chatbot deployment. Agent workflows, analytics teams, clinical informatics, and contact-center operators all need evidence-backed changes to roles, controls, and adoption metrics.",
      supports:
        "Supports change-impact framing, adoption risk review, workshop planning, and Moves evidence gates.",
      findings: [
        "The labor bottleneck is capacity trapped in maintenance and ad hoc reporting, not lack of AI ideas.",
        "Agent Assist readiness depends on workflow ownership, transcript governance, identity linkage, and real-time integration evidence.",
        "Next validation: current analytics staffing mix, call-center roles, operating procedures, and adoption baselines.",
      ],
    },
    ai: {
      summary:
        "The AI portfolio is coherent but foundation-gated: seven use-case families are identified, led by unified clinical + claims, governed AI/LLM automation, call center optimization, payment integrity, cost transparency, provider quality, and close automation.",
      meaning:
        "Meridian has enough context to prioritize AI investments, but not enough validated evidence to treat any use case as production-ready.",
      observed:
        "Every major AI use case depends on the same blockers: no certified medallion architecture, no patient/member identity spine, no formal data governance, no certified semantic layer, and no AI audit trail.",
      matters:
        "The boardroom decision is sequencing. The lakehouse and governance foundation should be treated as the enabling bet before scaling individual AI use cases.",
      supports:
        "Supports AI portfolio triage, sequencing, and evidence-backed investment framing; blocks production-readiness and quantified value claims.",
      findings: [
        "Agent Assist is high-interest, but it depends on CRM/transcript governance, claims status integration, knowledge-base lineage, and member identity linkage.",
        "Payment integrity and cost transparency are attractive finance use cases, but contract terms, GL alignment, and cost allocation rules are not yet governed.",
        "Next validation: use-case baselines, data-product owners, audit/control requirements, and target-state platform evidence.",
      ],
    },
    infra: {
      summary:
        "Infrastructure confirms the core case-study tension: Meridian is still anchored in Epic, SQL Server marts, Tableau, SAS, and Power BI, while AWS and Databricks are target-state foundations, not certified production platforms.",
      meaning:
        "The infrastructure layer separates current-state operating reality from future-state ambition, which is essential before recommending an AI or lakehouse roadmap.",
      observed:
        "The current analytics estate is fragmented and on-premise-heavy. AWS and Databricks appear as strategic targets, but the evidence still lacks certified landing zone, medallion, network/security, lineage, and operating controls.",
      matters:
        "For a CXO, this means the transformation is not to pick an AI use case first; it is to build the platform foundation that lets multiple clinical, financial, and member-experience use cases scale safely.",
      supports:
        "Supports architecture sequencing, platform readiness, cloud foundation planning, and evidence gates; blocks production lakehouse and production AI readiness claims.",
      findings: [
        "Current-state analytics remains fragmented across Epic analytics, SQL Server reporting marts, Tableau, SAS, and Power BI.",
        "AWS and Databricks are the right target direction in the context, but the proof says they are not yet certified current production foundation.",
        "Next validation: landing-zone design, network/security controls, medallion architecture, lineage, operating model, and migration plan.",
      ],
    },
    rel: {
      summary:
        "Relationship rows expose the real dependency chain: use case -> blocker -> affected systems -> metric boundary -> forbidden claim.",
      meaning:
        "The relationship layer is the guardrail that prevents Nexus from turning attractive AI ideas into unsupported implementation or value claims.",
      observed:
        "Unified clinical + claims repeatedly links Epic, claims, pharmacy, and Databricks target-state dependencies to medallion, identity, harmonization, and governance gaps.",
      matters:
        "A CXO needs to know which investment unlocks multiple outcomes. Here, the data foundation unlocks multiple use cases; isolated pilots would likely stall.",
      supports:
        "Supports cross-domain dependency reasoning, evidence-gap prioritization, and module handoffs once relationships are validated.",
      findings: [
        "The same blockers recur across use cases, which argues for a platform foundation move rather than disconnected pilots.",
        "Relationship depth is useful for sequencing but still needs validation before sourcing, value, or Tower outcome claims.",
        "Next validation: confirm system-to-data-to-vendor-to-owner links and attach source evidence for each critical dependency.",
      ],
    },
    metrics: {
      summary:
        "Metric rows define what value could be measured, but most current entries are boundary statements rather than validated baselines.",
      meaning:
        "The metric layer protects the executive story from overclaiming by separating hypotheses, baselines, targets, and measured outcomes.",
      observed:
        "Rows repeatedly mark baseline-required-before-value-claim across lakehouse, AI automation, call center, provider quality, cost transparency, payment integrity, and close automation.",
      matters:
        "This is where Tower must eventually prove value. Until finance, clinical, and operational baselines are confirmed, the right answer is readiness and sequencing, not ROI.",
      supports:
        "Supports baseline planning, Tower readiness, and value-governance design; blocks final value or savings claims.",
      findings: [
        "Metrics exist as a measurement agenda, not as realized benefits.",
        "The most important next metrics are maintenance/ad hoc share, call containment, prior-auth turnaround, payment leakage, close cycle, and quality attribution accuracy.",
        "Next validation: baseline owner, calculation logic, current value, target value, and finance tie-out for each priority outcome.",
      ],
    },
    industry: {
      summary:
        "Industry patterns confirm Meridian is pursuing common health-system priorities, but the evidence shows foundational data maturity is behind the ambition.",
      meaning:
        "The industry lens turns generic healthcare trends into Meridian-specific implications: AI, quality, cost transparency, and member experience all depend on governed data.",
      observed:
        "Pattern rows repeatedly connect healthcare use cases to the same evidence gaps: medallion architecture, identity spine, transcript governance, contract terms, and semantic ownership.",
      matters:
        "This prevents a trend-led pitch. The story becomes: Meridian has the right use cases, but must prove the operating data foundation before scaling AI.",
      supports:
        "Supports executive positioning, peer-pattern framing, and prioritization; not benchmark claims or external market proof.",
      findings: [
        "Healthcare peers are moving toward longitudinal data, AI-enabled operations, and value-based performance, but Meridian's blockers are internal data and governance readiness.",
        "The context supports a foundation-first transformation narrative instead of a point-solution AI narrative.",
        "Next validation: external benchmark ranges only after internal baselines and evidence ownership are confirmed.",
      ],
    },
    ms: {
      summary:
        "Managed services context shows a maintenance-heavy analytics operating model: Epic, Microsoft, Tableau, SAS, and outsourced analytics support are present, but contract economics and SLAs are not loaded.",
      meaning:
        "The managed services layer explains why transformation capacity is constrained and where Source may later investigate run-cost and service model leverage.",
      observed:
        "The analytics managed services provider is tied to SQL marts, Tableau, Power BI, and SAS, with an 80 percent maintenance-load signal and missing vendor identity/contract values.",
      matters:
        "This is a credible sourcing and operating-model opportunity only after contracts, rate cards, ticket volumes, SLAs, and ownership are validated.",
      supports:
        "Supports managed-services discovery, sourcing scope framing, and capacity-shift hypotheses; blocks vendor savings claims.",
      findings: [
        "The operating issue appears to be analytics capacity trapped in maintenance of fragmented reporting assets.",
        "Vendor and contract details are deliberately not strong enough yet for commercial savings estimates.",
        "Next validation: vendor identity, contract scope, rate card, ticket mix, SLA performance, and maintenance/new-build split.",
      ],
    },
    opev: {
      summary:
        "Operational evidence rows translate the use-case portfolio into module next actions: Home brief, Intelligence retrieval, Moves evidence gates, Source context, and Tower baseline requests.",
      meaning:
        "This layer is the execution bridge from context to work: what must be uploaded, certified, or confirmed before each module can act.",
      observed:
        "Each use-case pattern carries specific blocker signals, from medallion architecture and identity spine to transcript governance, provider contract linkage, and close-control evidence.",
      matters:
        "Without this layer, Home becomes a brochure. With it, the executive brief can tell leaders exactly what evidence makes the next decision possible.",
      supports:
        "Supports next-evidence planning, phase-gate design, and module-specific handoffs.",
      findings: [
        "The evidence agenda is clear enough to run a focused governance and data-foundation workshop.",
        "The strongest next move is to certify the lakehouse/identity/governance spine before individual AI use cases are advanced.",
        "Next validation: upload architecture evidence, data governance artifacts, baselines, transcripts/CRM samples, and contract/economics files.",
      ],
    },
  };
  return fallback[key] ?? {};
}

function normalizeDimensionName(value) {
  return clean(value)
    .toLowerCase()
    .replace(/^\d+\s+/, "")
    .replace(/\band\b/g, "&")
    .replace(/[^a-z0-9&]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function statusLabel(status) {
  if (status === "source-backed") return "Decision-grade";
  if (status === "needs-evidence") return "Needs evidence";
  return "Directional";
}

function relationshipChainForDimension(key, label) {
  const chains = {
    profile: ["Enterprise", "Operating model", "Executive decisions"],
    functions: ["Function", "Owner", "Capability", "Outcome"],
    org: ["Function", "Decision owner", "Program", "Gate"],
    workforce: ["Role", "Workflow", "Adoption", "Outcome"],
    apps: ["Application", "Data dependency", "Vendor", "Modernization decision"],
    data: ["Data domain", "Source system", "Use case", "AI readiness"],
    infra: ["Platform", "Workload", "Control", "Cloud readiness"],
    vendors: ["Vendor", "Contract", "Scope", "Value/risk"],
    budget: ["Spend area", "Baseline", "Program", "Value proof"],
    programs: ["Program", "Owner", "Evidence gate", "Outcome"],
    ai: ["Use case", "Data spine", "Workflow owner", "Governance gate"],
    risks: ["Risk", "Control", "Owner", "Decision boundary"],
    rel: ["Business function", "Application", "Data", "Vendor", "Risk"],
    evidence: ["Source", "Claim", "Dimension", "Decision"],
    metrics: ["Metric", "Baseline", "Target", "Tower proof"],
    industry: ["Pattern", "Peer signal", "Meridian implication"],
    lenses: ["Expert lens", "Dimension", "Decision implication"],
    ms: ["Managed service", "Provider", "Scope", "Commercial lever"],
    opev: ["Operational artifact", "Adoption signal", "Workflow readiness"],
  };
  return chains[key] ?? [label, "Evidence", "Decision"];
}

function handoffForDimension(key) {
  if (["vendors", "ms"].includes(key)) return "Source";
  if (["budget", "metrics"].includes(key)) return "Tower";
  if (["programs", "ai", "workforce", "org"].includes(key)) return "Moves";
  return "Knowledge";
}

function assembleRenderPack(designContract, context, claudePack) {
  const dimensionByKey = Object.fromEntries(
    context.dimensions.map((dimension) => [dimension.key, dimension]),
  );
  const dimMetadata = dimensions.map((dimension) => {
    const source = dimensionByKey[dimension.key];
    const generated = claudePack.dimensions[dimension.key];
    return {
      key: dimension.key,
      name: dimension.label,
      count: source.rows_total,
      status: source.status,
      pct: source.pct,
      evCount: source.evidence_ref_count,
      summary: generated.summary,
      covers: generated.covers,
      sources: generated.sources,
    };
  });
  return {
    tenant_key: tenantKey,
    tenant_name: tenantName,
    artifact_type: "NexusHomeKnowledgeDesignContractPack",
    prompt_version: promptVersion,
    generated_model: model,
    generated_at: new Date().toISOString(),
    design_contract_source: designHtmlPath,
    source_context: {
      canonical_input_location:
        "datasets/tenant-inputs/meridian-health/standard-2026-07-v3",
      interviews: "datasets/tenant-inputs/meridian-health/interviews/executive_interviews.csv",
      boundary:
        "synthetic_demo_phi_free_planning_grade; not real Meridian production data",
    },
    design_slots: {
      DIMS: dimMetadata,
      FACTS: claudePack.home_overview.facts,
      KPIS: claudePack.home_overview.kpis,
      BRIEF_COLS: claudePack.home_overview.brief_cols,
      PRIORITIES: claudePack.home_overview.priorities,
      SIGNALS: claudePack.home_overview.signals,
      DEC_CAN: claudePack.home_overview.dec_can,
      DEC_CANNOT: claudePack.home_overview.dec_cannot,
      CONF_TABLE: claudePack.context_confidence.conf_table,
      GAPS: claudePack.evidence_gaps.gaps,
      USE_CASES: claudePack.use_cases.top_5,
      EVIDENCE: claudePack.proof.evidence,
      NEXT_EVIDENCE: claudePack.evidence_gaps.next_evidence,
      DATA: buildDataViews(),
      INSIGHTS: Object.fromEntries(
        dimensions.map((dimension) => [
          dimension.key,
          claudePack.dimensions[dimension.key].insights,
        ]),
      ),
      STORY: Object.fromEntries(
        dimensions.map((dimension) => [
          dimension.key,
          claudePack.dimensions[dimension.key].story,
        ]),
      ),
      REL: Object.fromEntries(
        dimensions.map((dimension) => [
          dimension.key,
          claudePack.dimensions[dimension.key].relationships,
        ]),
      ),
      DGAPS: Object.fromEntries(
        dimensions.map((dimension) => [
          dimension.key,
          ensureDimensionGaps(
            dimension.key,
            dimension.label,
            claudePack.dimensions[dimension.key].gaps,
          ),
        ]),
      ),
      EVID: Object.fromEntries(
        dimensions.map((dimension) => [
          dimension.key,
          claudePack.dimensions[dimension.key].evidence,
        ]),
      ),
    },
    narrative_sections: {
      context_confidence_summary: claudePack.context_confidence.summary,
      evidence_gaps_summary: claudePack.evidence_gaps.summary,
      use_cases_summary: claudePack.use_cases.summary,
      use_cases_portfolio_view: claudePack.use_cases.portfolio_view,
      proof_summary: claudePack.proof.summary,
      proof_relationship_visual: claudePack.proof.relationship_visual,
    },
    quality_assessment: claudePack.quality_assessment,
  };
}

function ensureDimensionGaps(key, label, gaps) {
  const cleaned = Array.isArray(gaps)
    ? gaps
        .map((gap) => ({
          missing: clean(gap?.missing),
          blocks: clean(gap?.blocks),
          needed: clean(gap?.needed),
          handoff: clean(gap?.handoff) || handoffForDimension(key),
        }))
        .filter((gap) => gap.missing || gap.blocks || gap.needed)
    : [];
  return cleaned.length ? cleaned : defaultGapsForDimension(key, label);
}

function buildLineageRows(renderPack, context, promptPath, responsePath) {
  const rows = [];
  const base = {
    tenant: tenantKey,
    design_contract: designHtmlPath,
    prompt_file: promptPath,
    response_file: responsePath,
  };
  function push(row) {
    rows.push({
      ...base,
      ...row,
    });
  }
  push({
    page: "Home / Knowledge",
    tab_or_component: "Overview / KPI facts",
    rendered_slot: "FACTS + KPIS",
    generated_by: "Claude-derived advisory artifact",
    deterministic_object: "design_slots.FACTS, design_slots.KPIS",
    storage_location:
      "datasets/tenant-inputs/meridian-health/approved-content/home/design-contract-pack.json",
    source_layer:
      "canonical tenant inputs + executive interviews + approved Home design contract",
    source_files:
      "00_enterprise_profile.csv; 04_applications_systems.csv; 07_vendors_contracts.csv; 08_it_budget_spend_value.csv; 13_evidence_sources.csv",
    refreshed_at: newestRefresh(context),
    notes: "Values must remain planning-grade unless evidence explicitly supports audited financials.",
  });
  push({
    page: "Home / Knowledge",
    tab_or_component: "Overview / Boardroom brief",
    rendered_slot: "BRIEF_COLS + PRIORITIES + SIGNALS",
    generated_by: "Claude-derived advisory artifact",
    deterministic_object:
      "design_slots.BRIEF_COLS, design_slots.PRIORITIES, design_slots.SIGNALS",
    storage_location:
      "datasets/tenant-inputs/meridian-health/approved-content/home/design-contract-pack.json",
    source_layer:
      "all canonical dimensions, executive interviews, evidence boundaries",
    source_files: "00-18 canonical CSVs; interviews/executive_interviews.csv",
    refreshed_at: newestRefresh(context),
    notes: "This is the McKinsey-style synthesis layer; it is not raw row preview text.",
  });
  push({
    page: "Home / Knowledge",
    tab_or_component: "Context Confidence",
    rendered_slot: "CONF_TABLE + context_confidence.summary",
    generated_by: "Deterministic counts plus Claude advisory synthesis",
    deterministic_object: "design_slots.CONF_TABLE",
    storage_location:
      "datasets/tenant-inputs/meridian-health/approved-content/home/design-contract-pack.json",
    source_layer: "canonical dimension summaries and confidence counts",
    source_files: "00-18 canonical CSVs",
    refreshed_at: newestRefresh(context),
    notes: "This should tell decision readiness, not expose engineering diagnostics first.",
  });
  push({
    page: "Home / Knowledge",
    tab_or_component: "Evidence Gaps",
    rendered_slot: "GAPS + NEXT_EVIDENCE",
    generated_by: "Claude-derived advisory artifact from canonical gaps",
    deterministic_object: "design_slots.GAPS, design_slots.NEXT_EVIDENCE",
    storage_location:
      "datasets/tenant-inputs/meridian-health/approved-content/home/design-contract-pack.json",
    source_layer: "risks, controls, metrics, evidence, relationships",
    source_files:
      "11_risks_controls.csv; 12_relationships.csv; 13_evidence_sources.csv; 14_metrics_outcomes.csv",
    refreshed_at: newestRefresh(context),
    notes: "Gaps should be actionable evidence asks, not UI/system diagnostics.",
  });
  push({
    page: "Home / Knowledge",
    tab_or_component: "Use Cases",
    rendered_slot: "USE_CASES",
    generated_by: "Claude-ranked from candidate use cases and evidence gates",
    deterministic_object: "design_slots.USE_CASES",
    storage_location:
      "datasets/tenant-inputs/meridian-health/approved-content/home/design-contract-pack.json",
    source_layer: "canonical AI/use-case, data, systems, risks, value hypotheses",
    source_files:
      "05_data_assets_integrations.csv; 08_it_budget_spend_value.csv; 10_ai_automation_use_cases.csv; 11_risks_controls.csv",
    refreshed_at: newestRefresh(context),
    notes: "Top five should explain what can be solved now vs what evidence is needed next.",
  });
  push({
    page: "Home / Knowledge",
    tab_or_component: "Proof / enterprise context visual",
    rendered_slot: "EVIDENCE + proof.relationship_visual",
    generated_by: "Claude visual-ready narrative plus deterministic evidence list",
    deterministic_object: "design_slots.EVIDENCE, narrative_sections.proof_relationship_visual",
    storage_location:
      "datasets/tenant-inputs/meridian-health/approved-content/home/design-contract-pack.json",
    source_layer: "evidence registry and relationships",
    source_files: "12_relationships.csv; 13_evidence_sources.csv",
    refreshed_at: newestRefresh(context),
    notes: "Visuals should show source evidence -> context -> module action, with decision boundaries.",
  });
  for (const dimension of dimensions) {
    const source = context.dimensions.find((item) => item.key === dimension.key);
    const sourceFile = source?.file ?? "";
    push({
      page: "Enterprise Dimensions",
      tab_or_component: `${dimension.label} / Overview`,
      rendered_slot: `DIMS[${dimension.key}] + INSIGHTS.${dimension.key} + STORY.${dimension.key}`,
      generated_by: "Claude-derived advisory artifact",
      deterministic_object: `design_slots.DIMS, design_slots.INSIGHTS.${dimension.key}, design_slots.STORY.${dimension.key}`,
      storage_location:
        "datasets/tenant-inputs/meridian-health/approved-content/home/design-contract-pack.json",
      source_layer: "canonical dimension source plus cross-dimension context",
      source_files: sourceFile,
      refreshed_at: source?.refreshed_at ?? "",
      notes:
        "Overview must tell a tenant-specific insight story; it must not define what the dimension means.",
    });
    push({
      page: "Enterprise Dimensions",
      tab_or_component: `${dimension.label} / Data`,
      rendered_slot: `DATA.${dimension.key}`,
      generated_by: "Deterministic canonical row projection",
      deterministic_object: `design_slots.DATA.${dimension.key}`,
      storage_location:
        "datasets/tenant-inputs/meridian-health/approved-content/home/design-contract-pack.json",
      source_layer: "canonical tenant input rows",
      source_files: sourceFile,
      refreshed_at: source?.refreshed_at ?? "",
      notes: "Data tab renders all canonical rows with filter/search; Claude does not rewrite row values.",
    });
    push({
      page: "Enterprise Dimensions",
      tab_or_component: `${dimension.label} / Relationships`,
      rendered_slot: `REL.${dimension.key}`,
      generated_by: "Claude-derived relationship interpretation from canonical relationship rows",
      deterministic_object: `design_slots.REL.${dimension.key}`,
      storage_location:
        "datasets/tenant-inputs/meridian-health/approved-content/home/design-contract-pack.json",
      source_layer: "relationships plus source dimension",
      source_files: `${sourceFile}; datasets/tenant-inputs/meridian-health/standard-2026-07-v3/12_relationships.csv`,
      refreshed_at: source?.refreshed_at ?? "",
      notes:
        "Relationship tab should show meaningful chains where evidence supports them; otherwise show what relationship proof is missing.",
    });
    push({
      page: "Enterprise Dimensions",
      tab_or_component: `${dimension.label} / Gaps`,
      rendered_slot: `DGAPS.${dimension.key}`,
      generated_by: "Claude-derived gap synthesis from canonical gaps and boundaries",
      deterministic_object: `design_slots.DGAPS.${dimension.key}`,
      storage_location:
        "datasets/tenant-inputs/meridian-health/approved-content/home/design-contract-pack.json",
      source_layer: "dimension source, risks, metrics, evidence boundaries",
      source_files: `${sourceFile}; datasets/tenant-inputs/meridian-health/standard-2026-07-v3/11_risks_controls.csv; datasets/tenant-inputs/meridian-health/standard-2026-07-v3/14_metrics_outcomes.csv`,
      refreshed_at: source?.refreshed_at ?? "",
      notes: "Gaps are evidence/ownership/baseline asks, not empty placeholders.",
    });
    push({
      page: "Enterprise Dimensions",
      tab_or_component: `${dimension.label} / Evidence`,
      rendered_slot: `EVID.${dimension.key}`,
      generated_by: "Claude-derived evidence summary with deterministic source file count",
      deterministic_object: `design_slots.EVID.${dimension.key}`,
      storage_location:
        "datasets/tenant-inputs/meridian-health/approved-content/home/design-contract-pack.json",
      source_layer: "evidence registry plus dimension file",
      source_files: `${sourceFile}; datasets/tenant-inputs/meridian-health/standard-2026-07-v3/13_evidence_sources.csv`,
      refreshed_at: source?.refreshed_at ?? "",
      notes: "Evidence tab should show what backs the story and what is still missing.",
    });
  }
  return rows;
}

function newestRefresh(context) {
  return context.dimensions
    .map((dimension) => dimension.refreshed_at)
    .filter(Boolean)
    .sort()
    .at(-1);
}

function writeCsvFile(file, rows) {
  if (!rows.length) {
    fs.writeFileSync(file, "");
    return;
  }
  const headers = Object.keys(rows[0]);
  const esc = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  fs.writeFileSync(
    file,
    [headers.map(esc).join(","), ...rows.map((row) => headers.map((header) => esc(row[header])).join(","))].join("\n"),
  );
}

function htmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function writeLineageHtml(file, rows, renderPack, validation) {
  const headers = [
    "page",
    "tab_or_component",
    "rendered_slot",
    "generated_by",
    "deterministic_object",
    "source_layer",
    "source_files",
    "refreshed_at",
    "notes",
  ];
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Nexus Home Knowledge Design Contract Lineage</title>
  <style>
    body{font-family:Inter,Arial,sans-serif;margin:0;background:#f7f5ef;color:#101828}
    header{padding:28px 36px;background:#07162f;color:white}
    h1{margin:0 0 8px;font-size:28px}
    main{padding:28px 36px}
    .card{background:white;border:1px solid #ddd7c8;border-radius:12px;padding:18px;margin-bottom:18px}
    .grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
    .metric{background:#fbfaf7;border:1px solid #e7e3da;border-radius:10px;padding:14px}
    .metric strong{display:block;font-size:24px}
    table{width:100%;border-collapse:collapse;background:white;border:1px solid #ddd7c8;font-size:12px}
    th,td{border-bottom:1px solid #eee8dc;padding:9px 10px;text-align:left;vertical-align:top}
    th{position:sticky;top:0;background:#f2efe7;font-size:11px;text-transform:uppercase;letter-spacing:.06em}
    td:nth-child(3),td:nth-child(5),td:nth-child(7){font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px}
    .pass{color:#0f7a4c;font-weight:700}.fail{color:#b42318;font-weight:700}
  </style>
</head>
<body>
  <header>
    <h1>Nexus Home Knowledge Design Contract Lineage</h1>
    <div>Tenant: ${htmlEscape(renderPack.tenant_name)} · Generated ${htmlEscape(renderPack.generated_at)} · Validation <span class="${validation.status}">${htmlEscape(validation.status)}</span></div>
  </header>
  <main>
    <section class="card">
      <h2>What This Proves</h2>
      <p>The attached HTML design is treated as the component contract. The rendered content now maps to deterministic design slots generated from canonical Meridian context, with Claude used only to create the consultant-grade advisory layer. Raw data rows remain deterministic projections from canonical tenant input files.</p>
      <div class="grid">
        <div class="metric"><span>Design slots</span><strong>${Object.keys(renderPack.design_slots).length}</strong></div>
        <div class="metric"><span>Dimension data rows</span><strong>${Object.values(renderPack.design_slots.DATA).reduce((sum, view) => sum + view.row_count, 0).toLocaleString()}</strong></div>
        <div class="metric"><span>Dimensions</span><strong>${Object.keys(renderPack.design_slots.DATA).length}</strong></div>
        <div class="metric"><span>Validation issues</span><strong>${validation.issues.length}</strong></div>
      </div>
    </section>
    <section class="card">
      <h2>Lineage Table</h2>
      <table>
        <thead><tr>${headers.map((header) => `<th>${htmlEscape(header)}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows
            .map(
              (row) =>
                `<tr>${headers
                  .map((header) => `<td>${htmlEscape(row[header])}</td>`)
                  .join("")}</tr>`,
            )
            .join("\n")}
        </tbody>
      </table>
    </section>
  </main>
</body>
</html>`;
  fs.writeFileSync(file, html);
}

async function main() {
  loadDotenvLocal();
  ensureDir(reportDir);
  ensureDir(approvedHomeDir);
  ensureDir(approvedMirrorDir);
  const rawResponsePath = path.join(reportDir, "raw-claude-response.json");
  const reuseStoredResponse =
    process.env.HOME_KNOWLEDGE_REUSE_RESPONSE === "1" &&
    fs.existsSync(rawResponsePath);
  const requiresClaude =
    !reuseStoredResponse || process.env.HOME_KNOWLEDGE_DIMENSION_REPAIR === "claude";
  if (requiresClaude && !process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is required to generate the design pack");
  }
  const designContract = parseDesignTemplate();
  fs.writeFileSync(
    path.join(reportDir, "design-slot-inventory.json"),
    compactJson({
      source: designContract.design_html_path,
      tabs: designContract.tabs,
      slot_names: Object.keys(designContract.slots),
      slot_sample_keys: Object.fromEntries(
        Object.entries(designContract.slots).map(([key, value]) => [
          key,
          Array.isArray(value)
            ? `array(${value.length})`
            : value && typeof value === "object"
              ? Object.keys(value)
              : typeof value,
        ]),
      ),
    }),
  );
  const context = buildContext(designContract);
  fs.writeFileSync(path.join(reportDir, "context-summary.json"), compactJson(context));
  const prompt = buildPrompt(context);
  const promptPath = path.join(reportDir, "actual-claude-prompt.txt");
  fs.writeFileSync(promptPath, prompt);
  const anthropic = process.env.ANTHROPIC_API_KEY
    ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    : null;
  const response =
    reuseStoredResponse
      ? JSON.parse(fs.readFileSync(rawResponsePath, "utf8"))
      : await anthropic.messages.create({
          model,
          max_tokens: 18000,
          temperature: 0.2,
          system:
            "You generate governed, evidence-bounded enterprise Home/Knowledge content. Use the supplied tool. Return no prose outside the tool.",
          messages: [{ role: "user", content: prompt }],
          tools: [buildToolSchema()],
          tool_choice: {
            type: "tool",
            name: "emit_home_knowledge_design_pack",
          },
        });
  const responsePath = path.join(reportDir, "raw-claude-response.json");
  fs.writeFileSync(responsePath, compactJson(response));
  const toolUse = response.content.find((part) => part.type === "tool_use");
  if (!toolUse) throw new Error("Claude did not return the design pack tool payload");
  const claudePack = toolUse.input;
  const repairedDimensions = await generateMissingDimensions(
    anthropic,
    context,
    claudePack,
  );
  const cleanedClaudePack = cleanDeep(claudePack);
  const renderPack = cleanDeep(
    assembleRenderPack(designContract, context, cleanedClaudePack),
  );
  const validation = validatePack(renderPack, context);
  renderPack.validation = validation;
  const artifactFile = path.join(approvedHomeDir, "design-contract-pack.json");
  const mirrorFile = path.join(
    approvedMirrorDir,
    "approved-home-knowledge-design-contract-pack.json",
  );
  fs.writeFileSync(artifactFile, compactJson(renderPack));
  fs.writeFileSync(mirrorFile, compactJson(renderPack));
  fs.writeFileSync(path.join(reportDir, "design-contract-pack.json"), compactJson(renderPack));
  fs.writeFileSync(`${downloadsPrefix}.json`, compactJson(renderPack));
  const lineageRows = buildLineageRows(renderPack, context, promptPath, responsePath);
  writeCsvFile(path.join(reportDir, "component-lineage.csv"), lineageRows);
  writeCsvFile(`${downloadsPrefix}-component-lineage.csv`, lineageRows);
  const lineageHtml = path.join(reportDir, "component-lineage.html");
  writeLineageHtml(lineageHtml, lineageRows, renderPack, validation);
  writeLineageHtml(`${downloadsPrefix}-component-lineage.html`, lineageRows, renderPack, validation);
  fs.writeFileSync(
    path.join(reportDir, "summary.md"),
    [
      "# Nexus Home Knowledge Design Contract Pack",
      "",
      `Generated: ${renderPack.generated_at}`,
      `Model: ${model}`,
      `Validation: ${validation.status}`,
      `Design contract: ${designHtmlPath}`,
      `Approved artifact: ${path.relative(repoRoot, artifactFile)}`,
      `Mirror artifact: ${path.relative(repoRoot, mirrorFile)}`,
      `Downloads JSON: ${downloadsPrefix}.json`,
      `Downloads lineage HTML: ${downloadsPrefix}-component-lineage.html`,
      `Repaired dimensions: ${repairedDimensions.length}`,
      "",
      "## Truth Split",
      "",
      "- Claude generated the consultant-grade advisory slots.",
      "- The main Claude response returned 4 dimensions; the remaining dimension slots were repaired from prior approved Claude-derived story blocks plus canonical tenant rows, then strengthened with tenant-specific evidence-bound summaries.",
      "- The Data tab row values are deterministic projections from canonical tenant input CSVs.",
      "- This does not claim live UI wiring or production deployment.",
      "- Unsupported design placeholders were not adopted as truth unless supported by context.",
      "",
      "## Validation Issues",
      "",
      ...(validation.issues.length
        ? validation.issues.map((issue) => `- ${issue}`)
        : ["- None"]),
    ].join("\n"),
  );
  console.log(
    JSON.stringify(
      {
        status: validation.status,
        artifactFile,
        mirrorFile,
        downloadsJson: `${downloadsPrefix}.json`,
        downloadsLineageHtml: `${downloadsPrefix}-component-lineage.html`,
        issues: validation.issues,
      },
      null,
      2,
    ),
  );
  if (validation.status !== "pass") process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
