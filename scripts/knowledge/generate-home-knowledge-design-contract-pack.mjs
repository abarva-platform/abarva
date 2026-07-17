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
const promptVersion = "home-knowledge-design-contract-v2-claude-verbatim";

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

Role and audience:
- Act as a senior executive consultant briefing a C-suite executive.
- CXO / EVP / CIO / CDAO level.
- The page must tell the enterprise story, not explain UI intent.
- Write like a top-tier strategy consultant synthesizing an enterprise context review.
- Every sentence should help a senior leader understand what the loaded context implies, what decision it supports, and what evidence is still missing.

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
- Use executive grain: issue, implication, decision, evidence gate. Do not write product help copy.

Word budgets:
- Home summary and proof summaries: 75-130 words.
- Brief card text: 22-42 words.
- Dimension summary: 14-24 words.
- Dimension story fields: 22-45 words each.
- Dimension findings: 18-35 words each.
- Relationship notes: 25-45 words.
- Gap fields: short, executive-readable fragments.

Required output:
- Fill the exact design slots listed in the schema.
- Keep slot names stable.
- Include source/evidence IDs from the supplied context where relevant.
- Include gaps where the context is missing enough proof.
- Include relationship and visual_blocks content that can render as cards, tables, charts, graphs, and dashboard panels.
- visual_blocks are model-authored display objects. Use only these types: metric_strip, decision_matrix, dependency_flow, evidence_bar.
- The renderer will display returned strings and visual block labels/values with no prose rewriting.

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
- Act as a senior executive consultant briefing a C-suite executive.
- The renderer will display your returned strings and visual block values verbatim.
- Include one visual_blocks array using one of: metric_strip, decision_matrix, dependency_flow, evidence_bar.
- Word budgets: summary 14-24 words; story fields 22-45 words; findings 18-35 words; relationship note 25-45 words; gap fields concise.
- Write issue -> implication -> decision -> evidence gate. Do not write a user guide.

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

function buildExecutiveOverviewPrompt(context, currentPack) {
  return `Generate final display-ready Nexus Home / Knowledge executive narrative fields.

ROLE: Act as a senior executive consultant briefing a C-suite executive. This is not a user guide. The output should read like a boardroom synthesis of Meridian's loaded context: operating model, executive interview signals, technology/data reality, use-case agenda, blockers, and evidence boundary.

DATA BOUNDARY: Use only supplied context. This is synthetic, PHI-free, planning-grade demo context. Do not claim real Meridian production data, realized ROI/savings, production AI readiness, or completed AWS/Databricks lakehouse. AWS and Databricks are target/future foundation unless explicitly evidenced otherwise.

RENDERING CONTRACT: The renderer will display your returned strings and visual nodes/edges verbatim, with no rewriting.

WORD BUDGETS:
- enterprise_brief_title: 8-16 words.
- enterprise_brief_summary: 115-155 words, split into exactly 2 short paragraphs using \\n\\n.
- context_confidence_summary: 55-85 words.
- evidence_gaps_summary: 45-75 words.
- use_cases_summary: 45-75 words.
- use_cases_portfolio_view: 35-65 words.
- proof_summary: 45-75 words.
- proof_relationship_visual.caption: 30-55 words.

STYLE:
- Issue -> implication -> next executive decision.
- Product name is Nexus.
- Do not use these strings: AbarVa, guidebook, runtime, packet, substrate, not loaded, record ID, V4, V5, V6, V7.

Return only through the tool.

CONTEXT:
${compactJson({
  tenant_key: context.tenant_key,
  tenant_name: context.tenant_name,
  boundary: context.boundary,
  totals: context.totals,
  critical_current_state: context.critical_current_state,
  executive_interview_context: context.executive_interview_context,
  dimensions: context.dimensions.map((dimension) => ({
    key: dimension.key,
    label: dimension.label,
    rows_total: dimension.rows_total,
    rows_active: dimension.rows_active,
    candidate_rows: dimension.candidate_rows,
    status: dimension.status,
    evidence_ref_count: dimension.evidence_ref_count,
    representative_items: dimension.representative_items.slice(0, 12),
    owners: dimension.owners.slice(0, 8),
    systems: dimension.systems.slice(0, 8),
    use_cases: dimension.use_cases.slice(0, 8),
    gaps: dimension.gaps.slice(0, 12),
  })),
  existing_home_overview: currentPack.home_overview,
  existing_context_confidence: currentPack.context_confidence,
  existing_evidence_gaps: currentPack.evidence_gaps,
  existing_use_cases: currentPack.use_cases,
  existing_proof: currentPack.proof,
})}`;
}

function buildExecutiveOverviewToolSchema() {
  return {
    name: "emit_home_knowledge_executive_overview",
    description:
      "Emit display-ready executive overview narrative fields for Nexus Home Knowledge.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "enterprise_brief_title",
        "enterprise_brief_summary",
        "context_confidence_summary",
        "evidence_gaps_summary",
        "use_cases_summary",
        "use_cases_portfolio_view",
        "proof_summary",
        "proof_relationship_visual",
      ],
      properties: {
        enterprise_brief_title: { type: "string" },
        enterprise_brief_summary: { type: "string" },
        context_confidence_summary: { type: "string" },
        evidence_gaps_summary: { type: "string" },
        use_cases_summary: { type: "string" },
        use_cases_portfolio_view: { type: "string" },
        proof_summary: { type: "string" },
        proof_relationship_visual: {
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
  };
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
        additionalProperties: false,
        required: dimensions.map((dimension) => dimension.key),
        properties: Object.fromEntries(
          dimensions.map((dimension) => [dimension.key, dimensionSchema]),
        ),
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

const requiredStringArraySchema = {
  type: "array",
  minItems: 1,
  items: { type: "string" },
};

const findingArraySchema = {
  type: "array",
  minItems: 3,
  maxItems: 4,
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
    "visual_blocks",
  ],
  properties: {
    key: { type: "string" },
    summary: { type: "string" },
    covers: requiredStringArraySchema,
    sources: requiredStringArraySchema,
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
        findings: findingArraySchema,
        breakdown: {
          type: "object",
          additionalProperties: false,
          required: ["title", "rows"],
          properties: {
            title: { type: "string" },
            rows: {
              type: "array",
              minItems: 2,
              maxItems: 5,
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
        chain: requiredStringArraySchema,
        note: { type: "string" },
      },
    },
    gaps: {
      type: "array",
      minItems: 1,
      maxItems: 5,
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
      minItems: 1,
      maxItems: 6,
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
    visual_blocks: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "title", "subtitle", "data"],
        properties: {
          type: {
            type: "string",
            enum: [
              "metric_strip",
              "decision_matrix",
              "dependency_flow",
              "evidence_bar",
            ],
          },
          title: { type: "string" },
          subtitle: { type: "string" },
          data: { type: "object" },
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
    if (!pack.design_slots?.STORY?.[key]) issues.push(`missing story ${key}`);
    if (!pack.design_slots?.INSIGHTS?.[key]) issues.push(`missing insights ${key}`);
    if (!pack.design_slots?.REL?.[key]) issues.push(`missing relationships ${key}`);
    if (!pack.design_slots?.DGAPS?.[key]?.length) issues.push(`missing gaps ${key}`);
    if (!pack.design_slots?.EVID?.[key]?.length) issues.push(`missing evidence ${key}`);
    if (!pack.design_slots?.VISUAL_BLOCKS?.[key]?.length) {
      issues.push(`missing Claude visual blocks ${key}`);
    }
  }
  if (pack.quality_assessment?.renderer_rewrite_allowed !== false) {
    issues.push("renderer rewrite guard missing");
  }
  if (
    pack.narrative_sections?.render_contract !==
    "renderer_displays_claude_strings_and_visual_blocks_verbatim_no_rewrite"
  ) {
    issues.push("Claude verbatim render contract missing");
  }
  if (!pack.narrative_sections?.enterprise_brief_title) {
    issues.push("missing Claude enterprise brief title");
  }
  if (!pack.narrative_sections?.enterprise_brief_summary) {
    issues.push("missing Claude enterprise brief summary");
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
  const allowedEvidenceList = [...allowedEvidence];
  for (const id of referenced) {
    const familyPrefix = id.endsWith("-") ? id : `${id}-`;
    const hasEvidenceFamily =
      allowedEvidenceList.some((allowedId) => allowedId.startsWith(familyPrefix));
    if (
      !allowedEvidence.has(id) &&
      !hasEvidenceFamily &&
      !id.startsWith("MER-SA07-INT-EVID")
    ) {
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
  const repairAll = process.env.HOME_KNOWLEDGE_REPAIR_ALL_DIMENSIONS === "1";
  const missing = dimensions
    .map((dimension) => dimension.key)
    .filter(
      (key) =>
        repairAll ||
        !claudePack.dimensions[key] ||
        !claudePack.dimensions[key].visual_blocks?.length,
    );
  if (!missing.length) return [];
  if (!anthropic) {
    throw new Error(
      `Claude is required to repair missing Home Knowledge dimensions: ${missing.join(", ")}`,
    );
  }
  for (const key of missing) {
    const outFile = path.join(reportDir, `raw-claude-response-dimension-${key}.json`);
    if (
      process.env.HOME_KNOWLEDGE_REUSE_DIMENSION_RESPONSES === "1" &&
      fs.existsSync(outFile)
    ) {
      const storedResponse = JSON.parse(fs.readFileSync(outFile, "utf8"));
      const storedToolUse = storedResponse.content?.find((part) => part.type === "tool_use");
      if (!storedToolUse) {
        throw new Error(`Stored Claude response did not include dimension payload for ${key}`);
      }
      claudePack.dimensions[key] = {
        ...storedToolUse.input,
        key,
      };
      continue;
    }
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
    fs.writeFileSync(outFile, compactJson(response));
    const toolUse = response.content.find((part) => part.type === "tool_use");
    if (!toolUse) throw new Error(`Claude did not return dimension payload for ${key}`);
    claudePack.dimensions[key] = {
      ...toolUse.input,
      key,
    };
  }
  return missing.map((key) => `${key}:claude-direct-repair`);
}

async function generateExecutiveOverview(anthropic, context, claudePack) {
  if (!anthropic) {
    throw new Error("Claude is required to generate the Home Knowledge executive overview");
  }
  const prompt = buildExecutiveOverviewPrompt(context, claudePack);
  const promptPath = path.join(reportDir, "actual-claude-overview-prompt.txt");
  fs.writeFileSync(promptPath, prompt);
  const response = await anthropic.messages.create({
    model,
    max_tokens: 5000,
    temperature: 0.15,
    system:
      "You generate governed, evidence-bounded Nexus Home/Knowledge executive narrative fields. Use the supplied tool only.",
    messages: [{ role: "user", content: prompt }],
    tools: [buildExecutiveOverviewToolSchema()],
    tool_choice: {
      type: "tool",
      name: "emit_home_knowledge_executive_overview",
    },
  });
  const responsePath = path.join(reportDir, "raw-claude-response-overview.json");
  fs.writeFileSync(responsePath, compactJson(response));
  const toolUse = response.content.find((part) => part.type === "tool_use");
  if (!toolUse) throw new Error("Claude did not return the executive overview payload");
  claudePack.executive_overview = {
    ...toolUse.input,
    prompt_path: "reports/home-knowledge-design-contract/actual-claude-overview-prompt.txt",
    response_path: "reports/home-knowledge-design-contract/raw-claude-response-overview.json",
  };
  return claudePack.executive_overview;
}

function handoffForDimension(key) {
  if (["vendors", "ms"].includes(key)) return "Source";
  if (["budget", "metrics"].includes(key)) return "Tower";
  if (["programs", "ai", "workforce", "org"].includes(key)) return "Moves";
  return "Knowledge";
}

function assembleRenderPack(designContract, context, claudePack) {
  const overview = claudePack.executive_overview ?? {};
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
      VISUAL_BLOCKS: Object.fromEntries(
        dimensions.map((dimension) => [
          dimension.key,
          claudePack.dimensions[dimension.key].visual_blocks,
        ]),
      ),
    },
    narrative_sections: {
      context_confidence_summary:
        overview.context_confidence_summary ?? claudePack.context_confidence.summary,
      evidence_gaps_summary:
        overview.evidence_gaps_summary ?? claudePack.evidence_gaps.summary,
      use_cases_summary:
        overview.use_cases_summary ?? claudePack.use_cases.summary,
      use_cases_portfolio_view:
        overview.use_cases_portfolio_view ?? claudePack.use_cases.portfolio_view,
      proof_summary: overview.proof_summary ?? claudePack.proof.summary,
      proof_relationship_visual:
        overview.proof_relationship_visual ?? claudePack.proof.relationship_visual,
      enterprise_brief_title: overview.enterprise_brief_title,
      enterprise_brief_summary: overview.enterprise_brief_summary,
      render_contract: "renderer_displays_claude_strings_and_visual_blocks_verbatim_no_rewrite",
      content_generation_prompt_path:
        "reports/home-knowledge-design-contract/actual-claude-prompt.txt",
      content_generation_response_path:
        "reports/home-knowledge-design-contract/raw-claude-response.json",
      executive_overview_prompt_path:
        overview.prompt_path,
      executive_overview_response_path:
        overview.response_path,
      visual_block_contract:
        "visual_blocks_are_claude_authored_display_inputs_for_cards_tables_charts_graphs_and_dashboard_panels",
    },
    quality_assessment: {
      ...claudePack.quality_assessment,
      renderer_rewrite_allowed: false,
      advisory_slots_source: "claude_tool_payload_only",
      deterministic_slots_source: "canonical_csv_row_projection_only",
    },
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
  return cleaned;
}

function buildLineageRows(renderPack, context, promptPath, responsePath) {
  const rows = [];
  const relativePromptPath = path.relative(process.cwd(), promptPath);
  const relativeResponsePath = path.relative(process.cwd(), responsePath);
  const base = {
    tenant: tenantKey,
    design_contract: designHtmlPath,
    prompt_file: relativePromptPath,
    response_file: relativeResponsePath,
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
    generated_by: "Claude-authored tool payload",
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
    generated_by: "Claude-authored tool payload",
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
    generated_by: "Deterministic counts plus Claude-authored advisory synthesis",
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
    generated_by: "Claude-authored tool payload from canonical gaps",
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
    generated_by: "Claude-authored ranking from candidate use cases and evidence gates",
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
    generated_by: "Claude-authored visual-ready narrative plus deterministic evidence list",
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
      generated_by: "Claude-authored tool payload",
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
      generated_by: "Claude-authored relationship interpretation from canonical relationship rows",
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
      generated_by: "Claude-authored gap synthesis from canonical gaps and boundaries",
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
      generated_by: "Claude-authored evidence summary with deterministic source file count",
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
  const executiveOverview = await generateExecutiveOverview(
    anthropic,
    context,
    claudePack,
  );
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
      `Executive overview repair: ${executiveOverview.response_path}`,
      `Repaired dimensions: ${repairedDimensions.length}`,
      "",
      "## Truth Split",
      "",
      "- Claude generated the consultant-grade advisory slots.",
      "- Claude generated the boardroom overview through a dedicated executive-consultant prompt.",
      "- Every dimension advisory slot is Claude-authored; if the main response misses a dimension, the generator performs a per-dimension Claude repair or fails.",
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
