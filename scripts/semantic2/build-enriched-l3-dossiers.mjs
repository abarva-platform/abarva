#!/usr/bin/env node
import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const DIMENSION_KEYS = [
  "ai_value_governance",
  "application_systems",
  "budget_financials",
  "data_analytics",
  "enterprise_profile",
  "moves_evidence",
  "operations_process",
  "organization_leadership",
  "risk_compliance",
  "vendor_contracts",
];

const DEFAULT_TENANTS = [
  "apex-retail",
  "first-capital",
  "lakefront-capital",
  "lakeshore-holdings",
  "meridian-health",
  "northstar-clinical",
  "roosevelt-holdings",
  "skyharbor-air",
];

const PROMPT_VERSION = "semantic2-l3-enriched-buildtime-claude-v2";
const DOSSIER_VERSION = `semantic2-l3-enriched-${new Date().toISOString().slice(0, 10)}`;
const MODEL = process.env.L3_DOSSIER_CLAUDE_MODEL || "claude-opus-4-8";
const MAX_FACTS = Number(process.env.L3_DOSSIER_MAX_FACTS || 240);
const RAW_FACT_LIMIT = Math.max(MAX_FACTS * 6, MAX_FACTS);
const MAX_ENTITIES = Number(process.env.L3_DOSSIER_MAX_ENTITIES || 80);
const MAX_RELATIONSHIPS = Number(process.env.L3_DOSSIER_MAX_RELATIONSHIPS || 120);
const MAX_INSIGHTS = Number(process.env.L3_DOSSIER_MAX_INSIGHTS || 4);
const CLAUDE_TIMEOUT_MS = Number(process.env.L3_DOSSIER_CLAUDE_TIMEOUT_MS || 45000);

const MACHINE_VALUE_PATTERNS = [
  /\bsemantic\b/i,
  /\bnode_type\b/i,
  /\bclient_id\b/i,
  /\brecords?\b/i,
  /\bevidence points?\b/i,
  /\bloaded context\b/i,
  /\bsource rows?\b/i,
  /\btable[_ ]name\b/i,
  /\benterprise_context_/i,
  /\bsemantic2_/i,
  /\bmv_home_/i,
  /\bsource reference\b/i,
  /\benterprise source material\b/i,
  /\bevidence item\b/i,
  /^\s*[{[]/,
  /\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/i,
  /\/Users\//i,
  /postgres(?:ql)?:\/\//i,
];

const SOURCE_LABELS = new Map([
  ["enterprise_context", "Enterprise profile and context evidence"],
  ["ai_control_tower", "AI value and control evidence"],
  ["moves_source", "Moves and sourcing evidence"],
  ["operational_evidence", "Operational process evidence"],
  ["business_core", "Business operating evidence"],
]);

const DIMENSION_BRANCHES = {
  ai_value_governance: [
    "AI initiative portfolio and ownership",
    "Value evidence and realization status",
    "Governance controls and scale readiness",
  ],
  application_systems: [
    "Application landscape and ownership",
    "Critical systems and lifecycle risk",
    "Dependencies across integrations and vendors",
  ],
  budget_financials: [
    "Run and change funding picture",
    "Spend concentration and cost drivers",
    "Finance assumptions and validation gaps",
  ],
  data_analytics: [
    "Data platforms and analytics estate",
    "Ownership, freshness, and trust posture",
    "AI dependency on governed data products",
  ],
  enterprise_profile: [
    "Enterprise scale and operating footprint",
    "Business model and strategic context",
    "Source coverage and missing attestation",
  ],
  moves_evidence: [
    "Move evidence readiness",
    "Phase artifacts and approvals",
    "Execution gaps and handoff needs",
  ],
  operations_process: [
    "Operational work patterns and queues",
    "Bottlenecks, handoffs, and service friction",
    "Automation candidates and control needs",
  ],
  organization_leadership: [
    "Leadership and role accountability",
    "Business functions and IT teams",
    "Ownership joins across systems and portfolios",
  ],
  risk_compliance: [
    "Risk and control landscape",
    "Compliance posture and mitigation ownership",
    "Affected systems and operating exposure",
  ],
  vendor_contracts: [
    "Vendor and contract footprint",
    "Commercial dependency and renewals",
    "Supported systems and sourcing evidence",
  ],
};

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  const get = (name, fallback = "") => {
    const index = process.argv.indexOf(name);
    return index >= 0 ? process.argv[index + 1] || fallback : fallback;
  };
  return {
    apply: args.has("--apply"),
    dryRun: args.has("--dry-run") || !args.has("--apply"),
    selfTest: args.has("--self-test"),
    emitFileBundle: args.has("--emit-file-bundle"),
    onlySample: args.has("--only-sample"),
    supersedeOldGenerations: args.has("--supersede-old-generations") || process.env.L3_DOSSIER_SUPERSEDE_OLD === "1",
    outDir:
      get("--out-dir") ||
      process.env.OUT_DIR ||
      path.join(
        "/tmp",
        `abarva-dossier-build-${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`,
      ),
    sampleTenant: get("--sample-tenant", "lakeshore-holdings"),
    sampleDimension: get("--sample-dimension", "organization_leadership"),
  };
}

function humanize(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\b(id|uuid|pk)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sentenceCase(value) {
  const text = humanize(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

function cleanBusinessText(value, fallback = "Not specified") {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  return text
    .replace(/\bsemantic2[_a-z0-9]*\b/gi, "source-backed")
    .replace(/\benterprise_context[_a-z0-9]*\b/gi, "enterprise profile evidence")
    .replace(/\bmv_home[_a-z0-9]*\b/gi, "Home source view")
    .replace(/\bsource rows?\b/gi, "source items")
    .replace(/\brecords?\b/gi, "items")
    .replace(/\bloaded context\b/gi, "available source picture")
    .replace(/\bsemantic\b/gi, "business")
    .replace(/\bclient_id\b/gi, "client")
    .replace(/\bnode_type\b/gi, "business object type")
    .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, "source reference");
}

function hasMachineLeak(value) {
  const text = String(value ?? "");
  return MACHINE_VALUE_PATTERNS.some((pattern) => pattern.test(text));
}

function sourceAreaLabel(sourceTable, sourceDimension, dimension) {
  if (sourceDimension) return sentenceCase(sourceDimension);
  const text = String(sourceTable ?? "");
  if (/ai_control/i.test(text)) return "AI value and control evidence";
  if (/operational/i.test(text)) return "Operational process evidence";
  if (/source_/i.test(text)) return "Sourcing and commercial evidence";
  if (/generated_artifacts|deliverable|move|program/i.test(text)) return "Moves evidence";
  if (/budget|spend|pricing|contract/i.test(text)) return "Commercial and finance evidence";
  if (/risk|control|govern/i.test(text)) return "Risk and governance evidence";
  if (/vendor/i.test(text)) return "Vendor and contract evidence";
  if (/application|system|platform|integration/i.test(text)) return "Technology estate evidence";
  if (/enterprise/i.test(text)) return "Enterprise profile and context evidence";
  return `${sentenceCase(dimension.business_label)} evidence`;
}

function sourceFamilyLabels(dimension) {
  const families = Array.isArray(dimension.expected_source_families)
    ? dimension.expected_source_families
    : [];
  return families.map((family) => SOURCE_LABELS.get(family) || sentenceCase(family));
}

function valueOfFact(row) {
  const parsed = parseStructuredFactValue(row.fact_value_json);
  if (parsed && parsed.value !== undefined && parsed.value !== null && parsed.value !== "") return parsed.value;
  if (row.fact_value_text !== null && row.fact_value_text !== undefined) return row.fact_value_text;
  if (row.fact_value_number !== null && row.fact_value_number !== undefined) return Number(row.fact_value_number);
  if (row.fact_value_bool !== null && row.fact_value_bool !== undefined) return Boolean(row.fact_value_bool);
  if (row.fact_value_json !== null && row.fact_value_json !== undefined) {
    return "Structured source value";
  }
  return "Not specified";
}

function trimForPrompt(value, maxLength = 240) {
  const text = cleanBusinessText(value, "");
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function compactFactForPrompt(fact) {
  return {
    fact_id: fact.fact_id,
    entity: trimForPrompt(fact.entity, 120),
    entityType: trimForPrompt(fact.entityType, 80),
    label: trimForPrompt(fact.label, 100),
    value: trimForPrompt(fact.value, 240),
    confidence: fact.confidence,
  };
}

function compactRelationshipForPrompt(relationship) {
  return {
    relationship_id: relationship.relationship_id,
    from: trimForPrompt(relationship.from, 120),
    relationship: trimForPrompt(relationship.relationship, 80),
    to: trimForPrompt(relationship.to, 120),
    confidence: relationship.confidence,
  };
}

function verdictFor(factCount, coverageScore) {
  if (factCount <= 0) return "EMPTY";
  if (coverageScore < 0.25 || factCount < 5) return "THIN";
  if (coverageScore < 0.7 || factCount < 30) return "PARTIAL";
  return "DEEP";
}

function confidenceFor(coverageScore, factCount) {
  if (factCount <= 0) return 0.15;
  if (coverageScore >= 0.75 && factCount >= 30) return 0.86;
  if (coverageScore >= 0.45) return 0.68;
  return 0.4;
}

function businessLanguageHits(value) {
  const hits = [];
  const scan = (item) => {
    if (typeof item === "string") {
      for (const pattern of MACHINE_VALUE_PATTERNS) {
        if (pattern.test(item)) hits.push(pattern.toString());
      }
      return;
    }
    if (Array.isArray(item)) {
      item.forEach(scan);
      return;
    }
    if (item && typeof item === "object") {
      for (const [key, nested] of Object.entries(item)) {
        if (["fact_id", "citation_ids", "supporting_fact_ids"].includes(key)) continue;
        scan(nested);
      }
    }
  };
  scan(value);
  return [...new Set(hits)];
}

function extractNumbers(text) {
  return String(text ?? "").match(/\b\d+(?:\.\d+)?%?|\$\d+(?:\.\d+)?[BMK]?\b/gi) ?? [];
}

function normalizeNumberToken(token) {
  return token.replace(/[,$]/g, "").toLowerCase();
}

function parseJsonObject(text) {
  const raw = String(text || "");
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

function parseStructuredFactValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function sourcePayload(row) {
  return parseStructuredFactValue(row?.source_payload) || {};
}

function structuredFact(row) {
  return parseStructuredFactValue(row?.fact_value_json) || {};
}

function fieldFromFact(row) {
  const parsed = structuredFact(row);
  const column = typeof parsed?.column === "string" ? parsed.column : "";
  if (column) return column;
  if (typeof parsed?.fact_key === "string" && parsed.fact_key) return parsed.fact_key;
  const key = String(row.fact_key || row.fact_type || "");
  const uploadMatch = key.match(/\b([a-z][a-z0-9_]+)\s*$/i);
  return uploadMatch?.[1] || key;
}

function readableFactLabel(row) {
  const column = fieldFromFact(row);
  const label = sentenceCase(column || row.fact_key || row.fact_type || "Source support");
  return label || "Source support";
}

function isPlaceholderValue(value) {
  return /^(required|defined|present|available|yes|no|true|false)$/i.test(String(value ?? "").trim());
}

function isGenericSubject(row) {
  const subject = String(row.subject_name || row.subject_semantic_key || "").toLowerCase();
  const type = String(row.subject_type || "").toLowerCase();
  return (
    !subject ||
    subject.includes("source reference") ||
    subject.includes("enterprise source material") ||
    type === "evidence_item" ||
    type === "evidence item"
  );
}

function factBusinessScore(row) {
  const parsed = structuredFact(row);
  const value = valueOfFact(row);
  const field = fieldFromFact(row);
  let score = Number(row.confidence ?? 0.5) * 10;
  if (parsed?.column || parsed?.fact_key) score += 25;
  if (parsed?.fact_text) score += 15;
  if (parsed?.source_state) score += 5;
  if (value !== "Structured source value" && !isPlaceholderValue(value)) score += 18;
  if (isGenericSubject(row)) score -= 18;
  if (!field || /source[_ ]?(state|reference|support|required|defined)/i.test(field)) score -= 12;
  if (/(^|_)id$/i.test(field) || /^mapping_id$/i.test(field)) score -= 18;
  if (/id$/i.test(field) && isUuidLike(value)) score -= 20;
  if (String(value).startsWith("{") || String(value).startsWith("[")) score -= 40;
  return score;
}

const DIMENSION_RELEVANCE_PATTERNS = {
  ai_value_governance: {
    positive: [
      /ai|automation|agent|model|tool|use[_ ]?case|initiative|benefit|value|realization|adoption/i,
      /governance|responsible[_ ]?ai|risk|control|approval|gate|policy/i,
    ],
    negative: [/ticket|incident|change|vendor|contract|budget/i],
  },
  application_systems: {
    positive: [
      /application|app[_ ]?name|system|platform|hosting|cloud|integration|interface|cmdb|service/i,
      /criticality|lifecycle|technical[_ ]?owner|business[_ ]?owner/i,
    ],
    negative: [/responsible[_ ]?ai|approval[_ ]?gate|benefit[_ ]?realization/i],
  },
  budget_financials: {
    positive: [/budget|spend|cost|run[_ ]?cost|change[_ ]?cost|amount|funding|portfolio|capex|opex|finance/i],
    negative: [/incident|ticket|responsible[_ ]?ai[_ ]?gate/i],
  },
  data_analytics: {
    positive: [/data|analytics|dataset|data[_ ]?product|warehouse|lakehouse|report|dashboard|lineage|refresh|quality/i],
    negative: [/incident|ticket|contract[_ ]?renewal/i],
  },
  enterprise_profile: {
    positive: [/enterprise|profile|revenue|employee|headcount|industry|hq|scale|business[_ ]?model/i],
    negative: [/ticket|incident|responsible[_ ]?ai[_ ]?gate/i],
  },
  moves_evidence: {
    positive: [/move|program|phase|gate|deliverable|artifact|charter|roadmap|business[_ ]?case|approval/i],
    negative: [/incident|ticket|cmdb/i],
  },
  operations_process: {
    positive: [/operation|process|ticket|incident|problem|change|request|queue|workflow|servicenow|jira|sla|cycle/i],
    negative: [/enterprise[_ ]?profile|revenue|contract[_ ]?renewal/i],
  },
  organization_leadership: {
    positive: [
      /organization|leadership|leader|executive|cio|cto|cfo|ciso|cdao|cdto/i,
      /business[_ ]?function|function[_ ]?name|org[_ ]?team|team[_ ]?name|role|persona|workforce|headcount/i,
      /owner|ownership|accountability|reports[_ ]?to|portfolio[_ ]?owner|business[_ ]?owner|technical[_ ]?owner/i,
    ],
    negative: [
      /responsible[_ ]?ai|ai[_ -]?gov|aigov|approval[_ ]?gate|gate[_ ]?status|model[_ ]?risk|prompt|llm/i,
      /ticket|incident|service[_ ]?request|contract[_ ]?renewal|pricing/i,
    ],
  },
  risk_compliance: {
    positive: [/risk|control|compliance|policy|security|privacy|audit|sox|hipaa|mitigation|severity/i],
    negative: [/budget|contract[_ ]?value|ticket[_ ]?volume/i],
  },
  vendor_contracts: {
    positive: [/vendor|supplier|contract|license|renewal|term|run[_ ]?rate|commercial|sow|pricing|bafo/i],
    negative: [/responsible[_ ]?ai|ticket|incident/i],
  },
};

function rowSearchText(row) {
  const parsed = structuredFact(row);
  const payload = sourcePayload(row);
  return [
    row.source_table,
    row.source_dimension,
    row.subject_semantic_key,
    row.subject_name,
    row.subject_type,
    row.fact_type,
    row.fact_key,
    fieldFromFact(row),
    valueOfFact(row),
    parsed?.fact_text,
    parsed?.source_file,
    parsed?.source_record_id,
    payload?.source_file,
    payload?.source_dimension,
    payload?.file_family,
    payload?.dimension,
    payload?.business_name,
    payload?.business_function,
    payload?.team_name,
    payload?.org_team,
    payload?.role_name,
    payload?.leader_name,
  ]
    .filter((value) => value !== undefined && value !== null)
    .map((value) => (typeof value === "object" ? JSON.stringify(value) : String(value)))
    .join(" ");
}

function dimensionFactRelevanceScore(dimensionKey, row) {
  const config = DIMENSION_RELEVANCE_PATTERNS[dimensionKey];
  if (!config) return 0;
  const text = rowSearchText(row);
  let score = 0;
  for (const pattern of config.positive || []) {
    if (pattern.test(text)) score += 40;
  }
  for (const pattern of config.negative || []) {
    if (pattern.test(text)) score -= 45;
  }
  const field = fieldFromFact(row);
  if (field && (config.positive || []).some((pattern) => pattern.test(field))) score += 25;
  if (field && (config.negative || []).some((pattern) => pattern.test(field))) score -= 35;
  return score;
}

function isUsableFact(row) {
  const label = readableFactLabel(row);
  const value = valueOfFact(row);
  if (!label || label === "Source support") return false;
  if (String(value).startsWith("{") || String(value).startsWith("[")) return false;
  if (isPlaceholderValue(value) && isGenericSubject(row)) return false;
  if (/source reference|enterprise source material|evidence item/i.test(`${label} ${value}`)) return false;
  return factBusinessScore(row) > 0;
}

function entityNameFromRowFields(fields, row) {
  const parsed = structuredFact(row);
  const factKey = fieldFromFact(row);
  const factText = typeof parsed.fact_text === "string" ? parsed.fact_text : "";
  const subjectFromFactText = factKey && factText.includes(`${factKey}:`)
    ? factText.slice(0, factText.indexOf(`${factKey}:`)).trim()
    : "";
  const candidates = [
    fields.persona_name,
    fields.role_name,
    fields.team_name,
    fields.org_team,
    fields.business_function,
    fields.application_name,
    fields.system_name,
    fields.platform_name,
    fields.vendor_name,
    fields.contract_name,
    fields.capability_name,
    fields.metric_name,
    fields.kpi_name,
    fields.process_name,
    fields.work_item_type,
    fields.service_name,
    fields.initiative_name,
    fields.ai_initiative_name,
    fields.risk_name,
    fields.control_name,
    subjectFromFactText,
  ];
  const candidate = candidates.find((item) => item !== undefined && item !== null && String(item).trim());
  if (candidate) return cleanBusinessText(candidate);
  if (!isGenericSubject(row)) return cleanBusinessText(row.subject_name || row.subject_semantic_key);
  return "";
}

function subjectNameFromFactText(row) {
  const parsed = structuredFact(row);
  const factKey = fieldFromFact(row);
  const factText = typeof parsed.fact_text === "string" ? parsed.fact_text : "";
  if (!factKey || !factText.includes(`${factKey}:`)) return "";
  const subject = factText.slice(0, factText.indexOf(`${factKey}:`)).trim();
  if (!subject || hasMachineLeak(subject)) return "";
  return cleanBusinessText(subject, "");
}

function entityTypeFromRowFields(fields, row, dimensionKey) {
  if (fields.persona_name) return "Persona";
  if (fields.role_name) return "Role";
  if (fields.team_name || fields.org_team) return "Org team";
  if (fields.business_function) return "Business function";
  if (fields.application_name || fields.system_name) return "Application or system";
  if (fields.vendor_name || fields.contract_name) return "Vendor or contract";
  if (fields.process_name || fields.work_item_type) return "Operational process";
  if (fields.initiative_name || fields.ai_initiative_name) return "Initiative";
  if (fields.risk_name || fields.control_name) return "Risk or control";
  if (!isGenericSubject(row) && row.subject_type) return sentenceCase(row.subject_type);
  return sentenceCase(dimensionKey);
}

function firstField(fields, names) {
  for (const name of names) {
    const value = fields[name];
    if (value !== undefined && value !== null && String(value).trim()) return value;
  }
  return "";
}

function groupFactRowsBySource(facts) {
  const groups = new Map();
  for (const row of facts) {
    const parsed = structuredFact(row);
    const key = parsed.record_id || parsed.source_record_id || row.source_row_id || `${row.source_table}:${row.source_primary_key || row.id}`;
    const group = groups.get(key) || {
      key,
      source_row_id: row.source_row_id,
      source_table: row.source_table,
      source_dimension: row.source_dimension,
      source_payload: sourcePayload(row),
      rows: [],
      fields: {},
      confidence: 0,
    };
    const field = fieldFromFact(row);
    const value = valueOfFact(row);
    if (field && value !== "Structured source value" && !String(value).startsWith("{")) {
      group.fields[field] = value;
    }
    const subjectName = subjectNameFromFactText(row);
    if (subjectName) group.fields.subject_name = subjectName;
    if (parsed.source_record_id) group.fields.source_record_id = parsed.source_record_id;
    if (parsed.source_file) group.fields.source_file = parsed.source_file;
    group.confidence = Math.max(group.confidence, Number(row.confidence ?? 0.6));
    group.rows.push(row);
    groups.set(key, group);
  }
  return [...groups.values()].map((group) => ({
    ...group,
    fields: { ...group.source_payload, ...group.fields },
  }));
}

function addUniqueEntity(map, name, type, confidence, description = "") {
  const cleanName = cleanBusinessText(name, "");
  if (!cleanName || hasMachineLeak(cleanName)) return;
  const key = `${cleanName.toLowerCase()}::${type.toLowerCase()}`;
  const existing = map.get(key);
  if (existing) {
    existing.confidence = Math.max(existing.confidence, Number(confidence ?? 0.7));
    return;
  }
  map.set(key, {
    name: cleanName,
    type: sentenceCase(type || "business object"),
    description: cleanBusinessText(description || "", ""),
    confidence: Number(confidence ?? 0.7),
  });
}

function deriveEntities(entities, factGroups, dimensionKey) {
  const map = new Map();
  for (const entity of entities) {
    addUniqueEntity(map, entity.business_name || entity.semantic_key, entity.entity_type, entity.confidence, entity.description || "");
  }
  for (const group of factGroups) {
    const fields = group.fields;
    addUniqueEntity(map, entityNameFromRowFields(fields, group.rows[0]), entityTypeFromRowFields(fields, group.rows[0], dimensionKey), group.confidence);
    addUniqueEntity(map, fields.business_function, "Business function", group.confidence);
    addUniqueEntity(map, fields.business_area, "Business area", group.confidence);
    addUniqueEntity(map, fields.team_name || fields.org_team, "Org team", group.confidence);
    addUniqueEntity(map, fields.application_name || fields.system_name, "Application or system", group.confidence);
    addUniqueEntity(map, fields.vendor_name, "Vendor", group.confidence);
    addUniqueEntity(map, fields.capability_name, "Capability", group.confidence);
    addUniqueEntity(map, fields.process_name, "Operational process", group.confidence);
  }
  return [...map.values()].slice(0, MAX_ENTITIES).map((entity, index) => ({
    entity_id: `E${String(index + 1).padStart(3, "0")}`,
    ...entity,
  }));
}

function deriveRelationshipCandidates(factGroups, citationFor) {
  const relationships = [];
  const seen = new Set();
  const add = (from, relationship, to, group, confidence = group.confidence) => {
    const cleanFrom = cleanBusinessText(from, "");
    const cleanTo = cleanBusinessText(to, "");
    if (!cleanFrom || !cleanTo || cleanFrom === cleanTo) return;
    if (hasMachineLeak(`${cleanFrom} ${relationship} ${cleanTo}`)) return;
    const key = `${cleanFrom.toLowerCase()}::${relationship}::${cleanTo.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    relationships.push({
      from: cleanFrom,
      relationship: cleanBusinessText(relationship),
      to: cleanTo,
      confidence: Number(confidence ?? 0.65),
      citation_ids: [citationFor(group.source_row_id, group.source_table, group.source_dimension)],
      derivedFrom: "structured evidence fields",
    });
  };
  for (const group of factGroups) {
    const f = group.fields;
    const subject = firstField(f, ["subject_name"]);
    const subjectType = group.rows.map((row) => row.subject_type).filter(Boolean).join(" ");
    const subjectLooksLikeSystem = /application|system|platform|tool|service/i.test(subjectType);
    const subjectLooksLikeTeam = /team|organization|org/i.test(subjectType);
    const persona = firstField(f, ["persona_name", "role_name", "role", "job_role"]);
    const leader = firstField(f, [
      "leader_name",
      "executive_name",
      "technology_leader",
      "cio_report",
      "owner_name",
      "executive_owner",
      "executive_owner_role",
      "portfolio_owner",
    ]);
    const team = firstField(f, ["team_name", "org_team", "technical_owner_team", "support_team", "owner_team", "delivery_team"]);
    const inferredTeam = team || (subjectLooksLikeTeam ? subject : "");
    const businessOwner = firstField(f, [
      "primary_business_owner",
      "business_owner",
      "owner_role",
      "executive_owner",
      "executive_owner_role",
      "portfolio_owner",
    ]);
    const functionName = firstField(f, ["business_function", "business_area", "function_name", "domain", "portfolio", "operating_area"]);
    const app = firstField(f, ["application_name", "system_name", "platform_name", "service_name", "system", "application"]) || (subjectLooksLikeSystem ? subject : "");
    const capability = firstField(f, ["capability_name", "business_capability", "value_stream", "capability", "process_capability"]);
    const vendor = firstField(f, ["vendor_name", "supplier_name", "provider_name"]);
    const contract = firstField(f, ["contract_name", "contract_id", "agreement_name", "license_name"]);
    const platform = firstField(f, ["platform_name", "cloud_platform", "hosting_platform", "hosting_model", "environment"]);
    const integration = firstField(f, ["integration_name", "interface_name", "feed_name", "source_system", "target_system"]);
    const dataProduct = firstField(f, ["data_product_name", "data_domain", "analytics_product", "report_name", "dataset_name"]);
    const metric = firstField(f, ["metric_name", "kpi_name", "outcome_name", "benefit_name"]);
    const initiative = firstField(f, ["ai_initiative_name", "initiative_name", "use_case_name", "automation_name"]);
    const tool = firstField(f, ["ai_tool_name", "tool_name", "agent_name", "model_name", "automation_tool"]);
    const control = firstField(f, ["control_name", "policy_name", "governance_gate", "approval_gate"]);
    const risk = firstField(f, ["risk_name", "risk_id", "issue_name", "blocker_name"]);
    const process = firstField(f, ["process_name", "work_item_type", "queue_name", "workflow_name", "service_name"]);
    const workItem = firstField(f, ["ticket_type", "issue_type", "incident_type", "request_type", "work_item_type"]);
    const budgetLine = firstField(f, ["budget_line", "cost_center", "portfolio_name", "spend_category", "funding_lane"]);
    const amount = firstField(f, ["amount", "annual_spend", "run_cost", "budget", "contract_value", "value_estimate"]);
    if (persona && functionName) add(persona, "works in", functionName, group);
    if (persona && process) add(persona, "performs", process, group);
    if (leader && functionName) add(leader, "leader owns function", functionName, group);
    if (leader && inferredTeam) add(leader, "leader owns team", inferredTeam, group);
    if (inferredTeam && functionName) add(inferredTeam, "supports", functionName, group);
    if (inferredTeam && app) add(inferredTeam, "team owns system", app, group);
    if (inferredTeam && capability) add(inferredTeam, "team supports capability", capability, group);
    if (businessOwner && app) add(businessOwner, "owns", app, group);
    if (businessOwner && functionName) add(businessOwner, "works in", functionName, group);
    if (functionName && app) add(functionName, "function supported by system", app, group);
    if (app && capability) add(app, "application supports capability", capability, group);
    if (app && team) add(app, "application owned by team", team, group);
    if (app && vendor) add(app, "application supported by vendor", vendor, group);
    if (app && platform) add(app, "runs on platform", platform, group);
    if (app && integration) add(app, "integrates with", integration, group);
    if (capability && app) add(capability, "depends on", app, group);
    if (vendor && contract) add(vendor, "vendor supplies contract", contract, group);
    if (contract && app) add(contract, "contract supports system", app, group);
    if (contract && functionName) add(contract, "contract owned by function", functionName, group);
    if (vendor && app) add(vendor, "supports", app, group);
    if (initiative && tool) add(initiative, "ai initiative uses tool", tool, group);
    if (initiative && metric) add(initiative, "ai initiative impacts outcome", metric, group);
    if (initiative && control) add(initiative, "ai initiative governed by control", control, group);
    if (initiative && risk) add(initiative, "ai initiative blocked by risk", risk, group);
    if (process && app) add(process, "uses", app, group);
    if (process && team) add(process, "owned by", team, group);
    if (workItem && team) add(workItem, "assigned to", team, group);
    if (process && initiative) add(process, "automates", initiative, group);
    if (process && capability) add(process, "supports", capability, group);
    if (risk && control) add(control, "mitigates", risk, group);
    if (risk && app) add(risk, "impacts", app, group);
    if (control && app) add(control, "governs", app, group);
    if (dataProduct && app) add(dataProduct, "feeds", app, group);
    if (dataProduct && functionName) add(dataProduct, "consumed by", functionName, group);
    if (dataProduct && metric) add(dataProduct, "measured by", metric, group);
    if (budgetLine && app) add(budgetLine, "funds", app, group);
    if (budgetLine && functionName) add(budgetLine, "funds", functionName, group);
    if (amount && budgetLine) add(budgetLine, "has amount", amount, group);
  }
  return relationships;
}

function buildBranches(dimension, coverageScore, hasEvidence) {
  const labels = DIMENSION_BRANCHES[dimension.dimension_key] || [
    `${sentenceCase(dimension.business_label)} overview`,
    "What is supported",
    "What still needs evidence",
  ];
  const branchCoverage = Number(coverageScore.toFixed(2));
  return labels.map((label, index) => ({
    id: `B${String(index + 1).padStart(2, "0")}`,
    label,
    summary: hasEvidence
      ? `Explore ${label.toLowerCase()} using the available ${sentenceCase(dimension.business_label).toLowerCase()} source picture.`
      : `Evidence is insufficient; use this branch to identify what must be loaded for ${label.toLowerCase()}.`,
    coverageScore: branchCoverage,
  }));
}

function buildCoverageGaps(dimension, expectedTables, sourceCounts, entityTypes, businessEntities, businessFacts, businessRelationships) {
  const gaps = [];
  const hasAnyEvidence = businessFacts.length > 0 || businessEntities.length > 0 || businessRelationships.length > 0;
  const supportedTables = new Set(sourceCounts.map((row) => row.source_table));
  const supportedAreas = new Set(sourceCounts.map((row) => sourceAreaLabel(row.source_table, row.source_dimension, dimension)));

  if (!hasAnyEvidence) {
    gaps.push({
      gap_id: `G${String(gaps.length + 1).padStart(2, "0")}`,
      label: `${sentenceCase(dimension.business_label)} evidence is not present for this topic.`,
      neededEvidence: [`Load source-backed ${sentenceCase(dimension.business_label).toLowerCase()} evidence before enabling this dossier on user surfaces.`],
    });
    return gaps;
  }

  if (expectedTables.length) {
    const dimensionLabel = sentenceCase(dimension.business_label).toLowerCase();
    const missingAreas = expectedTables
      .filter((table) => !supportedTables.has(table))
      .map((table) => sourceAreaLabel(table, "", dimension))
      .filter((label) => {
        const normalized = label.toLowerCase();
        return normalized !== dimensionLabel && normalized !== `${dimensionLabel} evidence`;
      })
      .filter((label) => !supportedAreas.has(label));
    for (const label of [...new Set(missingAreas)].slice(0, 3)) {
      gaps.push({
        gap_id: `G${String(gaps.length + 1).padStart(2, "0")}`,
        label: `${label} is not yet represented in the current ${sentenceCase(dimension.business_label).toLowerCase()} picture.`,
        neededEvidence: [`Add ${label.toLowerCase()} if this question must cover that adjacent source area.`],
      });
    }
  }

  const entityNames = new Set(businessEntities.map((entity) => String(entity.type || "").toLowerCase()));
  for (const type of entityTypes) {
    const label = sentenceCase(type);
    if (!label) continue;
    if (!entityNames.has(label.toLowerCase())) {
      gaps.push({
        gap_id: `G${String(gaps.length + 1).padStart(2, "0")}`,
        label: `${label} coverage is incomplete in the current ${sentenceCase(dimension.business_label).toLowerCase()} picture.`,
        neededEvidence: [`Load ${label.toLowerCase()} ownership and source support if named ${label.toLowerCase()} analysis is required.`],
      });
    }
  }

  if (!businessRelationships.length) {
    gaps.push({
      gap_id: `G${String(gaps.length + 1).padStart(2, "0")}`,
      label: `Relationship coverage is incomplete for ${sentenceCase(dimension.business_label).toLowerCase()}.`,
      neededEvidence: ["Load or derive source-backed ownership, support, dependency, or workflow links before rendering graph-style answers."],
    });
  }

  return gaps.slice(0, 8);
}

async function queryRows(client, sql, params) {
  const result = await client.query(sql, params);
  return result.rows;
}

function isUuidLike(value) {
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(String(value ?? ""));
}

function isExcludedTenantKey(value) {
  const text = String(value ?? "");
  return !text || text.startsWith("morgan");
}

function addTenantScope(scopes, tenantKey, aliases = []) {
  if (isExcludedTenantKey(tenantKey) || isUuidLike(tenantKey)) return;
  const current = scopes.get(tenantKey) || new Set();
  current.add(tenantKey);
  for (const alias of aliases) {
    if (alias && !isExcludedTenantKey(alias)) current.add(String(alias));
  }
  scopes.set(tenantKey, current);
}

async function loadTenantScopes(client) {
  const sourceRows = await queryRows(
    client,
    `
      SELECT DISTINCT tenant_key FROM (
        SELECT tenant_key FROM semantic2_source_rows
        UNION SELECT tenant_key FROM semantic2_facts
        UNION SELECT tenant_key FROM semantic2_dossiers
        UNION SELECT tenant_key FROM clients WHERE tenant_key IS NOT NULL
      ) x
      WHERE tenant_key IS NOT NULL
      ORDER BY tenant_key
    `,
    [],
  );
  const clientRows = await queryRows(
    client,
    "SELECT id::text, tenant_key, slug FROM clients WHERE COALESCE(tenant_key, slug, id::text) IS NOT NULL",
    [],
  );
  const byId = new Map(clientRows.map((row) => [row.id, row]));
  const scopes = new Map();

  for (const tenantKey of DEFAULT_TENANTS) addTenantScope(scopes, tenantKey);
  for (const row of clientRows) {
    const canonical = !isUuidLike(row.tenant_key) && row.tenant_key ? row.tenant_key : row.slug;
    addTenantScope(scopes, canonical, [row.id, row.tenant_key, row.slug]);
  }
  for (const row of sourceRows) {
    const raw = row.tenant_key;
    if (!raw) continue;
    if (isUuidLike(raw)) {
      const clientRow = byId.get(raw);
      const canonical = clientRow && !isUuidLike(clientRow.tenant_key) ? clientRow.tenant_key : clientRow?.slug;
      addTenantScope(scopes, canonical, [raw, clientRow?.tenant_key, clientRow?.slug]);
    } else {
      addTenantScope(scopes, raw);
    }
  }

  return [...scopes.entries()]
    .map(([tenantKey, aliases]) => ({ tenantKey, aliases: [...aliases].sort() }))
    .sort((a, b) => a.tenantKey.localeCompare(b.tenantKey));
}

async function loadDimensions(client) {
  const rows = await queryRows(
    client,
    "SELECT * FROM semantic2_dimensions WHERE dimension_key = ANY($1::text[]) ORDER BY dimension_key",
    [DIMENSION_KEYS],
  );
  const byKey = new Map(rows.map((row) => [row.dimension_key, row]));
  return DIMENSION_KEYS.map((key) => byKey.get(key)).filter(Boolean);
}

async function clientIdForTenant(client, tenantKey) {
  const rows = await queryRows(
    client,
    "SELECT id FROM clients WHERE tenant_key = $1 OR slug = $1 ORDER BY created_at NULLS LAST LIMIT 1",
    [tenantKey],
  );
  return rows[0]?.id ?? null;
}

async function buildSkeleton(client, tenantKey, tenantAliases, dimension) {
  const entityTypes = dimension.canonical_entity_types || [];
  const expectedTables = dimension.expected_source_tables || [];
  const requiredFactKeys = dimension.required_fact_keys || [];

  const entities = await queryRows(
    client,
    `
      SELECT id::text, entity_type, semantic_key, business_name, description, source_table, source_primary_key, confidence
      FROM semantic2_entities
      WHERE tenant_key = ANY($1::text[])
        AND lifecycle_status = 'active'
        AND ($2::text[] = '{}'::text[] OR entity_type = ANY($2::text[]))
      ORDER BY confidence DESC, updated_at DESC, business_name
      LIMIT $3
    `,
    [tenantAliases, entityTypes, MAX_ENTITIES],
  );

  const entityKeys = entities.map((entity) => entity.semantic_key).filter(Boolean);
  const factCandidates = await queryRows(
    client,
    `
      SELECT f.id::text, f.subject_semantic_key, COALESCE(e.business_name, f.subject_semantic_key, '') AS subject_name,
             COALESCE(e.entity_type, '') AS subject_type, f.fact_type, f.fact_key, f.fact_value_text,
             f.fact_value_number, f.fact_value_bool, f.fact_value_json, f.value_type, f.unit,
             f.confidence, f.freshness_at, f.source_row_id::text, f.source_table, f.source_primary_key,
             f.derived_flag, f.created_at, sr.source_dimension, sr.sanitized_payload AS source_payload
      FROM semantic2_facts f
      LEFT JOIN semantic2_entities e ON e.id = f.subject_entity_id
      LEFT JOIN semantic2_source_rows sr ON sr.id = f.source_row_id
      WHERE f.tenant_key = ANY($1::text[])
        AND f.valid_to IS NULL
        AND COALESCE(f.fact_key, '') !~* 'source[_ ]?(state|reference|support|required|defined)'
        AND COALESCE(f.subject_semantic_key, '') !~* 'source[_ -]?reference|enterprise[_ -]?source[_ -]?material'
        AND (
          ($2::text[] <> '{}'::text[] AND f.source_table = ANY($2::text[]))
          OR ($3::text[] <> '{}'::text[] AND e.entity_type = ANY($3::text[]))
          OR ($4::text[] <> '{}'::text[] AND f.fact_key = ANY($4::text[]))
        )
      ORDER BY
        CASE
          WHEN f.fact_type = 'ownership_accountability' THEN 0
          WHEN e.entity_type = ANY($3::text[]) THEN 1
          WHEN f.fact_value_json IS NOT NULL THEN 2
          WHEN f.fact_value_text IS NOT NULL OR f.fact_value_number IS NOT NULL OR f.fact_value_bool IS NOT NULL THEN 3
          ELSE 4
        END,
        f.derived_flag ASC,
        f.confidence DESC,
        f.created_at DESC,
        f.fact_key,
        f.source_table,
        f.source_primary_key,
        f.id
      LIMIT $5
    `,
    [tenantAliases, expectedTables, entityTypes, requiredFactKeys, RAW_FACT_LIMIT],
  );
  const facts = factCandidates
    .filter(isUsableFact)
    .sort(
      (a, b) =>
        dimensionFactRelevanceScore(dimension.dimension_key, b) - dimensionFactRelevanceScore(dimension.dimension_key, a) ||
        factBusinessScore(b) - factBusinessScore(a) ||
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime() ||
        String(a.fact_key || "").localeCompare(String(b.fact_key || "")) ||
        String(a.source_table || "").localeCompare(String(b.source_table || "")) ||
        String(a.source_primary_key || "").localeCompare(String(b.source_primary_key || "")) ||
        String(a.id || "").localeCompare(String(b.id || "")),
    )
    .slice(0, MAX_FACTS);
  const relationshipFactRows = factCandidates
    .filter(isUsableFact)
    .filter((row) => dimensionFactRelevanceScore(dimension.dimension_key, row) > 0)
    .sort(
      (a, b) =>
        dimensionFactRelevanceScore(dimension.dimension_key, b) - dimensionFactRelevanceScore(dimension.dimension_key, a) ||
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime() ||
        String(a.source_table || "").localeCompare(String(b.source_table || "")) ||
        String(a.source_primary_key || "").localeCompare(String(b.source_primary_key || "")) ||
        String(a.id || "").localeCompare(String(b.id || "")),
    )
    .slice(0, Math.max(MAX_FACTS * 3, MAX_FACTS));

  const factEntityKeys = facts.map((fact) => fact.subject_semantic_key).filter(Boolean);
  const relationshipKeys = [...new Set([...entityKeys, ...factEntityKeys])].slice(0, 200);
  const relationshipSourceTables = [
    ...expectedTables,
    ...(expectedTables.some((table) => table.startsWith("enterprise_context_")) ? ["enterprise_context_relationships"] : []),
    ...(expectedTables.some((table) => table.startsWith("ai_control_")) ? ["ai_control_graph_view"] : []),
  ];
  const relationships = await queryRows(
    client,
    `
      SELECT id::text, from_semantic_key, to_semantic_key, relationship_type, relationship_label,
             confidence, source_row_id::text, source_table, source_primary_key, evidence_basis
      FROM semantic2_relationships
      WHERE tenant_key = ANY($1::text[])
        AND valid_to IS NULL
        AND (
          ($2::text[] <> '{}'::text[] AND source_table = ANY($2::text[]))
          OR ($3::text[] <> '{}'::text[] AND (from_semantic_key = ANY($3::text[]) OR to_semantic_key = ANY($3::text[])))
        )
      ORDER BY confidence DESC, created_at DESC, relationship_type, from_semantic_key, to_semantic_key, id
      LIMIT $4
    `,
    [tenantAliases, [...new Set(relationshipSourceTables)], relationshipKeys, MAX_RELATIONSHIPS],
  );

  const sourceCounts = await queryRows(
    client,
    `
      SELECT source_table, source_dimension, count(*)::int AS count
      FROM semantic2_source_rows
      WHERE tenant_key = ANY($1::text[]) AND ($2::text[] = '{}'::text[] OR source_table = ANY($2::text[]))
      GROUP BY source_table, source_dimension
      ORDER BY count DESC
    `,
    [tenantAliases, expectedTables],
  );

  const selectedSourceRowIds = [
    ...new Set([
      ...facts.map((fact) => fact.source_row_id).filter(Boolean),
      ...relationships.map((relationship) => relationship.source_row_id).filter(Boolean),
      ...relationshipFactRows.map((fact) => fact.source_row_id).filter(Boolean),
    ]),
  ].slice(0, 80);
  const sourceRows = selectedSourceRowIds.length
    ? await queryRows(
        client,
        `
          SELECT id::text, source_table, source_dimension, sanitized_payload, confidence, freshness_at
          FROM semantic2_source_rows
          WHERE id::text = ANY($1::text[])
        `,
        [selectedSourceRowIds],
      )
    : [];
  const sourceRowsById = new Map(sourceRows.map((row) => [row.id, row]));

  const sourceTableCoverage = expectedTables.length
    ? expectedTables.filter((table) => sourceCounts.some((row) => row.source_table === table)).length / expectedTables.length
    : facts.length > 0
      ? 1
      : 0;

  const citations = [];
  const citationKeyToId = new Map();
  const citationFor = (sourceRowId, sourceTable, sourceDimension) => {
    const sourceRow = sourceRowId ? sourceRowsById.get(sourceRowId) : null;
    const sourceArea = sourceAreaLabel(sourceTable || sourceRow?.source_table, sourceDimension || sourceRow?.source_dimension, dimension);
    const key = `${sourceArea}:${sourceRowId || sourceTable || "source"}`;
    if (citationKeyToId.has(key)) return citationKeyToId.get(key);
    const citation = {
      citation_id: `C${String(citations.length + 1).padStart(3, "0")}`,
      label: `${sourceArea} source support`,
      source_area: sourceArea,
      confidence: Number(sourceRow?.confidence ?? 0.7),
      freshness: sourceRow?.freshness_at ? new Date(sourceRow.freshness_at).toISOString().slice(0, 10) : "freshness not attested",
    };
    citations.push(citation);
    citationKeyToId.set(key, citation.citation_id);
    return citation.citation_id;
  };

  const factGroups = groupFactRowsBySource(facts);
  const relationshipFactGroups = groupFactRowsBySource(relationshipFactRows);

  const businessFacts = facts.map((fact, index) => {
    const group = factGroups.find((candidate) => candidate.rows.some((row) => row.id === fact.id));
    const fields = group?.fields || sourcePayload(fact);
    const entity = entityNameFromRowFields(fields, fact) || readableFactLabel(fact);
    return {
      fact_id: `F${String(index + 1).padStart(3, "0")}`,
      entity,
      entityType: entityTypeFromRowFields(fields, fact, dimension.dimension_key),
      dimension: dimension.business_label,
      label: readableFactLabel(fact),
      value: cleanBusinessText(valueOfFact(fact)),
      unit: fact.unit || undefined,
      confidence: Number(fact.confidence ?? 0.7),
      citation_ids: [citationFor(fact.source_row_id, fact.source_table, fact.source_dimension)],
    };
  });

  const businessRelationships = relationships
    .map((relationship) => ({
      from: cleanBusinessText(relationship.from_semantic_key || "", ""),
      relationship: cleanBusinessText(relationship.relationship_label || relationship.relationship_type || "relates to"),
      to: cleanBusinessText(relationship.to_semantic_key || "", ""),
      confidence: Number(relationship.confidence ?? 0.65),
      citation_ids: [citationFor(relationship.source_row_id, relationship.source_table, "")],
    }))
    .filter((relationship) => relationship.from && relationship.to && !hasMachineLeak(`${relationship.from} ${relationship.relationship} ${relationship.to}`))
    .slice(0, MAX_RELATIONSHIPS)
    .map((relationship, index) => ({
      relationship_id: `R${String(index + 1).padStart(3, "0")}`,
      ...relationship,
    }));

  const derivedRelationships = deriveRelationshipCandidates(relationshipFactGroups, citationFor)
    .sort(
      (a, b) =>
        String(a.from || "").localeCompare(String(b.from || "")) ||
        String(a.relationship || "").localeCompare(String(b.relationship || "")) ||
        String(a.to || "").localeCompare(String(b.to || "")),
    )
    .slice(0, Math.max(0, MAX_RELATIONSHIPS - businessRelationships.length))
    .map((relationship, index) => ({
      relationship_id: `R${String(businessRelationships.length + index + 1).padStart(3, "0")}`,
      ...relationship,
    }));

  businessRelationships.push(...derivedRelationships);

  const businessEntities = deriveEntities(entities, factGroups, dimension.dimension_key);
  const entityCoverage = entityTypes.length
    ? entityTypes.filter((type) =>
        businessEntities.some(
          (entity) => String(entity.type || "").toLowerCase() === sentenceCase(type).toLowerCase(),
        ),
      ).length / entityTypes.length
    : businessFacts.length > 0
      ? 1
      : 0;
  const relationshipCoverage = businessRelationships.length > 0 ? 1 : businessFacts.length > 0 ? 0.5 : 0;
  const coverageScore = Number(((sourceTableCoverage + entityCoverage + relationshipCoverage) / 3).toFixed(4));
  const gaps = buildCoverageGaps(
    dimension,
    expectedTables,
    sourceCounts,
    entityTypes,
    businessEntities,
    businessFacts,
    businessRelationships,
  );

  const hasEvidence = businessFacts.length > 0 || businessEntities.length > 0 || businessRelationships.length > 0;
  const confidence = confidenceFor(coverageScore, businessFacts.length);
  const verdict = verdictFor(businessFacts.length, coverageScore);
  const branches = buildBranches(dimension, coverageScore, hasEvidence);
  const businessLabels = {
    tenant: sentenceCase(tenantKey),
    dimension: dimension.business_label,
    family: sentenceCase(dimension.family_key),
    sourceAreas: [...new Set([...sourceFamilyLabels(dimension), ...citations.map((citation) => citation.source_area)])],
  };

  const skeleton = {
    schemaVersion: "l3-enriched-dossier-v1",
    derivation: {
      stage1: "deterministic skeleton",
      stage2: "grounded build-time Claude insights",
      promptVersion: PROMPT_VERSION,
      dossierVersion: DOSSIER_VERSION,
    },
    tenantKey,
    dimensionKey: dimension.dimension_key,
    business_labels: businessLabels,
    coverage: {
      score: coverageScore,
      confidence,
      verdict,
      expectedSourceAreas: sourceFamilyLabels(dimension),
      supportedSourceAreas: [...new Set(citations.map((citation) => citation.source_area))],
    },
    facts: businessFacts,
    entities: businessEntities,
    relationships: businessRelationships,
    gaps,
    branch_options: branches,
    citations,
    derived_insights: [],
  };

  return {
    skeleton,
    sourceAreaLabels: businessLabels.sourceAreas,
    rawCounts: {
      entities: businessEntities.length,
      facts: businessFacts.length,
      relationships: businessRelationships.length,
      citations: citations.length,
      sourceAreas: sourceCounts.length,
      factCandidates: factCandidates.length,
      discardedFactCandidates: factCandidates.length - facts.length,
    },
  };
}

function insightPrompt(skeleton) {
  const compact = {
    tenant: skeleton.business_labels.tenant,
    dimension: skeleton.business_labels.dimension,
    coverage: {
      score: skeleton.coverage.score,
      confidence: skeleton.coverage.confidence,
      verdict: skeleton.coverage.verdict,
      expectedSourceAreas: skeleton.coverage.expectedSourceAreas.slice(0, 8),
      supportedSourceAreas: skeleton.coverage.supportedSourceAreas.slice(0, 8),
    },
    facts: skeleton.facts.slice(0, 60).map(compactFactForPrompt),
    relationships: skeleton.relationships.slice(0, 30).map(compactRelationshipForPrompt),
    gaps: skeleton.gaps.slice(0, 12).map((gap) => ({
      area: trimForPrompt(gap.area, 120),
      gap: trimForPrompt(gap.gap, 220),
      impact: trimForPrompt(gap.impact, 220),
    })),
  };
  return [
    "You are producing build-time derived insights for an enterprise dossier.",
    "Use ONLY the supplied facts and relationships. Do not invent facts, entities, numbers, systems, people, or values.",
    "Every insight must cite one or more supplied fact_id values. If no fact supports an insight, omit it.",
    "Use business language only. Avoid implementation words such as semantic, source rows, records, node, table, UUID, client_id, dossier, binder, or packet.",
    "If evidence is thin or empty, return one tentative insufficiency insight with low confidence.",
    `Return JSON only: {\"derived_insights\":[{\"insight\":\"...\",\"why_it_matters\":\"...\",\"supporting_fact_ids\":[\"F001\"],\"confidence\":\"high|medium|low|insufficient\"}]}. Limit ${MAX_INSIGHTS} insights.`,
    "",
    JSON.stringify(compact, null, 2),
  ].join("\n");
}

async function deriveInsightsWithClaude(skeleton) {
  if (skeleton.facts.length === 0) {
    return insufficientInsight(skeleton, "No source-backed facts were available for this tenant and dimension.");
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return [];
  }
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const prompt = insightPrompt(skeleton);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CLAUDE_TIMEOUT_MS);
  let response;
  try {
    response = await anthropic.messages.create(
      {
        model: MODEL,
        max_tokens: 900,
        messages: [{ role: "user", content: prompt }],
      },
      { signal: controller.signal, timeout: CLAUDE_TIMEOUT_MS },
    );
  } catch (error) {
    const label = error?.name === "AbortError" ? `Claude call exceeded ${CLAUDE_TIMEOUT_MS}ms` : `Claude call failed: ${error?.message || error}`;
    console.error(`[l3-dossiers] ${skeleton.tenantKey}/${skeleton.dimensionKey}: ${label}; storing grounded fallback insight.`);
    return validateInsights(
      [
        {
          insight: `${skeleton.business_labels.dimension} has source support, but additional build-time synthesis did not complete within the operator bound.`,
          why_it_matters: "The dossier keeps deterministic evidence and avoids storing an unsupported advisory claim.",
          supporting_fact_ids: skeleton.facts[0]?.fact_id ? [skeleton.facts[0].fact_id] : [],
          confidence: "low",
        },
      ],
      skeleton,
    );
  } finally {
    clearTimeout(timeout);
  }
  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");
  const parsed = parseJsonObject(text);
  const candidates = Array.isArray(parsed?.derived_insights) ? parsed.derived_insights : [];
  return validateInsights(candidates, skeleton);
}

function insufficientInsight(skeleton, reason = "The available source picture is insufficient for confident synthesis.") {
  return [
    {
      insight: `${skeleton.business_labels.dimension} cannot yet support confident advisory synthesis for ${skeleton.business_labels.tenant}.`,
      why_it_matters: reason,
      supporting_fact_ids: [],
      confidence: "insufficient",
    },
  ];
}

function validateInsights(candidates, skeleton) {
  if (skeleton.facts.length === 0) return insufficientInsight(skeleton);
  const factIds = new Set(skeleton.facts.map((fact) => fact.fact_id));
  const factText = JSON.stringify(skeleton.facts);
  const allowedNumbers = new Set(extractNumbers(factText).map(normalizeNumberToken));
  const valid = [];
  for (const raw of candidates) {
    const supporting = Array.isArray(raw?.supporting_fact_ids)
      ? raw.supporting_fact_ids.filter((id) => factIds.has(id))
      : [];
    if (supporting.length === 0) continue;
    const insight = cleanBusinessText(raw.insight || "", "");
    const why = cleanBusinessText(raw.why_it_matters || "", "");
    if (!insight) continue;
    const numbers = extractNumbers(`${insight} ${why}`).map(normalizeNumberToken);
    if (numbers.some((number) => !allowedNumbers.has(number))) continue;
    const candidate = {
      insight,
      why_it_matters: why || "This pattern is supported by the cited facts.",
      supporting_fact_ids: supporting,
      confidence: ["high", "medium", "low", "insufficient"].includes(raw.confidence)
        ? raw.confidence
        : skeleton.coverage.score >= 0.7
          ? "medium"
          : "low",
    };
    if (businessLanguageHits(candidate).length === 0) valid.push(candidate);
    if (valid.length >= MAX_INSIGHTS) break;
  }
  if (valid.length === 0) {
    return [
      {
        insight: `${skeleton.business_labels.dimension} has source support, but no additional derived pattern cleared grounding checks.`,
        why_it_matters: "The build dropped unsupported synthesis rather than storing a weak claim.",
        supporting_fact_ids: [skeleton.facts[0].fact_id],
        confidence: "low",
      },
    ];
  }
  return valid;
}

function supportedQuestions(dimension, skeleton) {
  const branches = skeleton.branch_options.map((branch) => branch.label);
  return [
    `What do we know about ${dimension.business_label.toLowerCase()}?`,
    ...branches.map((branch) => `Show ${branch.toLowerCase()}.`),
    `What is missing for ${dimension.business_label.toLowerCase()}?`,
  ];
}

function artifactsFor(skeleton) {
  return {
    tables: [
      {
        title: `${skeleton.business_labels.dimension} source-backed facts`,
        columns: ["Item", "Value", "Confidence"],
        rowCount: Math.min(12, skeleton.facts.length),
      },
    ],
    charts: skeleton.facts.length > 0
      ? [
          {
            title: `${skeleton.business_labels.dimension} coverage`,
            type: "bar",
            values: [
              { label: "Coverage", value: Math.round(skeleton.coverage.score * 100) },
              { label: "Confidence", value: Math.round(skeleton.coverage.confidence * 100) },
            ],
          },
        ]
      : [],
    graphs: skeleton.relationships.length > 0
      ? [
          {
            title: `${skeleton.business_labels.dimension} relationship map`,
            linkCount: skeleton.relationships.length,
          },
        ]
      : [],
  };
}

function validateDossier(skeleton) {
  const issues = [];
  const machineHits = businessLanguageHits(skeleton);
  if (machineHits.length) issues.push(`business_language_clean:${machineHits.join(",")}`);
  if ((skeleton.facts.length > 0 || skeleton.entities.length > 0) && skeleton.branch_options.length === 0) {
    issues.push("branches_populated");
  }
  if (skeleton.coverage.score < 1 && skeleton.gaps.length === 0 && skeleton.coverage.verdict !== "DEEP") {
    issues.push("coverage_honesty");
  }
  for (const insight of skeleton.derived_insights) {
    if (insight.confidence === "insufficient") continue;
    const ids = insight.supporting_fact_ids || [];
    if (ids.length === 0 || ids.some((id) => !skeleton.facts.some((fact) => fact.fact_id === id))) {
      issues.push("insight_grounding");
      break;
    }
  }
  if (!Array.isArray(skeleton.facts) || !Array.isArray(skeleton.relationships) || !skeleton.coverage || !Array.isArray(skeleton.citations)) {
    issues.push("structured_shape");
  }
  return { passed: issues.length === 0, issues };
}

async function writeDossier(client, tenantKey, dimension, skeleton) {
  const clientId = await clientIdForTenant(client, tenantKey);
  await client.query(
    `
      INSERT INTO semantic2_dossiers (
        client_id, tenant_key, dimension_key, family_key, evidence_packet, artifacts, gaps,
        citations, supported_questions, source_tables, coverage_score, confidence,
        prompt_version, dossier_version, built_at, updated_at
      )
      VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10::text[],$11,$12,$13,$14,now(),now())
      ON CONFLICT (tenant_key, dimension_key, prompt_version)
      DO UPDATE SET
        client_id = EXCLUDED.client_id,
        family_key = EXCLUDED.family_key,
        evidence_packet = EXCLUDED.evidence_packet,
        artifacts = EXCLUDED.artifacts,
        gaps = EXCLUDED.gaps,
        citations = EXCLUDED.citations,
        supported_questions = EXCLUDED.supported_questions,
        source_tables = EXCLUDED.source_tables,
        coverage_score = EXCLUDED.coverage_score,
        confidence = EXCLUDED.confidence,
        dossier_version = EXCLUDED.dossier_version,
        invalidated_at = NULL,
        built_at = now(),
        updated_at = now()
    `,
    [
      clientId,
      tenantKey,
      dimension.dimension_key,
      dimension.family_key,
      JSON.stringify(skeleton),
      JSON.stringify(artifactsFor(skeleton)),
      JSON.stringify(skeleton.gaps),
      JSON.stringify(skeleton.citations),
      JSON.stringify(supportedQuestions(dimension, skeleton)),
      skeleton.business_labels.sourceAreas,
      skeleton.coverage.score,
      skeleton.coverage.confidence,
      PROMPT_VERSION,
      DOSSIER_VERSION,
    ],
  );
}

async function supersedeOldGenerations(client) {
  const beforeRows = await queryRows(
    client,
    `
      SELECT prompt_version, count(*)::int AS count
      FROM semantic2_dossiers
      WHERE invalidated_at IS NULL
      GROUP BY prompt_version
      ORDER BY prompt_version
    `,
    [],
  );
  const newlySupersededRows = await queryRows(
    client,
    `
      WITH updated AS (
        UPDATE semantic2_dossiers d
           SET invalidated_at = now(),
               updated_at = now()
         WHERE d.prompt_version <> $1
           AND d.invalidated_at IS NULL
         RETURNING d.tenant_key, d.dimension_key, d.prompt_version, d.dossier_version,
                   jsonb_array_length(COALESCE(d.evidence_packet->'relationships', '[]'::jsonb))::int AS relationship_count,
                   jsonb_array_length(COALESCE(d.evidence_packet->'entities', '[]'::jsonb))::int AS entity_count,
                   jsonb_array_length(COALESCE(d.evidence_packet->'facts', '[]'::jsonb))::int AS fact_count
      )
      SELECT tenant_key, dimension_key, prompt_version, dossier_version, relationship_count, entity_count, fact_count
      FROM updated
      ORDER BY tenant_key, dimension_key, prompt_version
    `,
    [PROMPT_VERSION],
  );
  const supersededRows = await queryRows(
    client,
    `
      SELECT d.tenant_key, d.dimension_key, d.prompt_version, d.dossier_version,
             jsonb_array_length(COALESCE(d.evidence_packet->'relationships', '[]'::jsonb))::int AS relationship_count,
             jsonb_array_length(COALESCE(d.evidence_packet->'entities', '[]'::jsonb))::int AS entity_count,
             jsonb_array_length(COALESCE(d.evidence_packet->'facts', '[]'::jsonb))::int AS fact_count
      FROM semantic2_dossiers d
      WHERE d.prompt_version <> $1
        AND d.invalidated_at IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM semantic2_dossiers active
          WHERE active.tenant_key = d.tenant_key
            AND active.dimension_key = d.dimension_key
            AND active.prompt_version = $1
            AND active.invalidated_at IS NULL
        )
      ORDER BY d.tenant_key, d.dimension_key, d.prompt_version
    `,
    [PROMPT_VERSION],
  );
  const afterRows = await queryRows(
    client,
    `
      SELECT prompt_version, count(*)::int AS count
      FROM semantic2_dossiers
      WHERE invalidated_at IS NULL
      GROUP BY prompt_version
      ORDER BY prompt_version
    `,
    [],
  );
  return { activePromptVersion: PROMPT_VERSION, beforeRows, newlySupersededRows, supersededRows, afterRows };
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function reportMarkdown(rows) {
  const header = "| Tenant | Dimension | Facts | Insights | Coverage | Gaps | Verdict | Validation |\n|---|---|---:|---:|---:|---:|---|---|";
  const body = rows.map((row) =>
    `| ${row.tenant_key} | ${row.dimension_key} | ${row.fact_count} | ${row.insight_count} | ${row.coverage_score} | ${row.gap_count} | ${row.verdict} | ${row.validation_passed ? "PASS" : `FAIL: ${row.validation_issues}`} |`,
  );
  return ["# Enriched L3 Dossier Build Report", "", header, ...body, ""].join("\n");
}

function reportCsv(rows) {
  const columns = [
    "tenant_key",
    "dimension_key",
    "fact_count",
    "relationship_count",
    "citation_count",
    "insight_count",
    "coverage_score",
    "gap_count",
    "verdict",
    "validation_passed",
    "validation_issues",
  ];
  return [columns.join(","), ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(","))].join("\n");
}

function validationCsv(rows) {
  const columns = ["tenant_key", "dimension_key", "business_language_clean", "branches_populated", "insight_grounding", "coverage_honesty", "structured_shape", "passed", "issues"];
  return [
    columns.join(","),
    ...rows.map((row) => {
      const issues = String(row.validation_issues || "");
      const check = (name) => !issues.includes(name);
      return [
        row.tenant_key,
        row.dimension_key,
        check("business_language_clean"),
        row.fact_count > 0 ? row.branch_count > 0 : true,
        check("insight_grounding"),
        check("coverage_honesty"),
        check("structured_shape"),
        row.validation_passed,
        row.validation_issues,
      ].map(csvEscape).join(",");
    }),
  ].join("\n");
}

function insightsCatalog(dossiers) {
  const lines = ["# Derived Insights Catalog", ""];
  for (const dossier of dossiers) {
    lines.push(`## ${dossier.skeleton.tenantKey} / ${dossier.skeleton.dimensionKey}`, "");
    if (dossier.skeleton.derived_insights.length === 0) {
      lines.push("- No derived insights were stored.", "");
      continue;
    }
    for (const insight of dossier.skeleton.derived_insights) {
      lines.push(`- **${insight.confidence}** ${insight.insight}`);
      lines.push(`  - Why it matters: ${insight.why_it_matters}`);
      lines.push(`  - Cites: ${(insight.supporting_fact_ids || []).join(", ") || "insufficient evidence marker"}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function outcomeReport(rows, args) {
  const total = rows.length;
  const passed = rows.filter((row) => row.validation_passed).length;
  const byVerdict = rows.reduce((acc, row) => {
    acc[row.verdict] = (acc[row.verdict] || 0) + 1;
    return acc;
  }, {});
  const tenantLines = [...new Set(rows.map((row) => row.tenant_key))].map((tenant) => {
    const tenantRows = rows.filter((row) => row.tenant_key === tenant);
    const rich = tenantRows.filter((row) => row.verdict === "DEEP" || row.verdict === "PARTIAL").length;
    const empty = tenantRows.filter((row) => row.verdict === "EMPTY").length;
    return `- ${tenant}: ${rich}/${tenantRows.length} usable or deep dimensions; ${empty} empty.`;
  });
  const failed = rows.filter((row) => !row.validation_passed);
  return [
    "# Enriched L3 Dossier Outcome Report",
    "",
    `Generated at: ${new Date().toISOString()}`,
    `Prompt version: ${PROMPT_VERSION}`,
    `Dossier version: ${DOSSIER_VERSION}`,
    `Mode: ${args.apply ? "APPLY" : "DRY RUN"}`,
    "",
    "## Summary",
    "",
    `- Dossiers built: ${total}`,
    `- Validation passed: ${passed}/${total}`,
    `- Coverage distribution: ${Object.entries(byVerdict).map(([key, value]) => `${key}=${value}`).join(", ")}`,
    "- Stage 1 was deterministic from typed L2 tables.",
    "- Stage 2 used build-time Claude only for derived insights and dropped unsupported claims.",
    "- No Home, Intelligence, Source, Moves, Tower, or aVa surface was wired to this prompt version in this pass.",
    "",
    "## Tenant Coverage",
    "",
    ...tenantLines,
    "",
    "## Failed Dossiers",
    "",
    failed.length
      ? failed.map((row) => `- ${row.tenant_key}/${row.dimension_key}: ${row.validation_issues}`).join("\n")
      : "No dossier failed validation.",
    "",
    "## Human Gate",
    "",
    `Review SAMPLE_DOSSIER.json and SAMPLE_DOSSIER.md for ${args.sampleTenant}/${args.sampleDimension} before wiring any surface to ${PROMPT_VERSION}.`,
    "",
  ].join("\n");
}

function sampleMarkdown(skeleton) {
  return [
    `# Sample Enriched L3 Dossier: ${skeleton.business_labels.tenant} / ${skeleton.business_labels.dimension}`,
    "",
    `Coverage: ${Math.round(skeleton.coverage.score * 100)}% · ${skeleton.coverage.verdict} · confidence ${Math.round(skeleton.coverage.confidence * 100)}%`,
    "",
    "## Branch Options",
    "",
    ...skeleton.branch_options.map((branch) => `- ${branch.label}: ${branch.summary}`),
    "",
    "## Derived Insights",
    "",
    ...skeleton.derived_insights.map((insight) => `- ${insight.insight} (${insight.confidence}; cites ${(insight.supporting_fact_ids || []).join(", ") || "insufficient evidence marker"})`),
    "",
    "## Gaps",
    "",
    ...(skeleton.gaps.length ? skeleton.gaps.map((gap) => `- ${gap.label}`) : ["- No material gap was detected by the coverage check."]),
    "",
    "## Fact Sample",
    "",
    ...skeleton.facts.slice(0, 20).map((fact) => `- ${fact.fact_id}: ${fact.entity} — ${fact.label}: ${fact.value}`),
    "",
  ].join("\n");
}

async function writeReports(outDir, files) {
  await fs.mkdir(outDir, { recursive: true });
  for (const [fileName, content] of Object.entries(files)) {
    await fs.writeFile(path.join(outDir, fileName), typeof content === "string" ? content : JSON.stringify(content, null, 2));
  }
}

async function buildAll(args) {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required.");
  const client = new Client({
    connectionString,
    ssl: /localhost|127\.0\.0\.1/.test(connectionString) ? false : { rejectUnauthorized: false },
  });
  await client.connect();
  const rows = [];
  const dossiers = [];
  let supersedeRecord = null;
  try {
    const tenantScopes = await loadTenantScopes(client);
    const dimensions = await loadDimensions(client);
    if (dimensions.length !== DIMENSION_KEYS.length) {
      throw new Error(`Expected ${DIMENSION_KEYS.length} dimensions, found ${dimensions.length}.`);
    }
    const scopesToBuild = args.onlySample
      ? tenantScopes.filter(({ tenantKey }) => tenantKey === args.sampleTenant)
      : tenantScopes;
    const dimensionsToBuild = args.onlySample
      ? dimensions.filter((dimension) => dimension.dimension_key === args.sampleDimension)
      : dimensions;
    if (args.onlySample && (scopesToBuild.length === 0 || dimensionsToBuild.length === 0)) {
      throw new Error(`Sample scope not found: ${args.sampleTenant}/${args.sampleDimension}`);
    }
    for (const { tenantKey, aliases } of scopesToBuild) {
      for (const dimension of dimensionsToBuild) {
        console.error(`[l3-dossiers] ${tenantKey}/${dimension.dimension_key}: building skeleton aliases=${aliases.length}`);
        const { skeleton, rawCounts } = await buildSkeleton(client, tenantKey, aliases, dimension);
        console.error(`[l3-dossiers] ${tenantKey}/${dimension.dimension_key}: deriving insights`);
        skeleton.derived_insights = await deriveInsightsWithClaude(skeleton);
        const validation = validateDossier(skeleton);
        if (args.apply && validation.passed) await writeDossier(client, tenantKey, dimension, skeleton);
        console.error(
          `[l3-dossiers] ${tenantKey}/${dimension.dimension_key}: ${validation.passed ? "stored" : "failed validation"} facts=${skeleton.facts.length} relationships=${skeleton.relationships.length} insights=${skeleton.derived_insights.length}`,
        );
        dossiers.push({ skeleton, rawCounts, validation });
        rows.push({
          tenant_key: tenantKey,
          dimension_key: dimension.dimension_key,
          fact_count: skeleton.facts.length,
          relationship_count: skeleton.relationships.length,
          citation_count: skeleton.citations.length,
          branch_count: skeleton.branch_options.length,
          insight_count: skeleton.derived_insights.length,
          coverage_score: skeleton.coverage.score,
          gap_count: skeleton.gaps.length,
          verdict: skeleton.coverage.verdict,
          validation_passed: validation.passed,
          validation_issues: validation.issues.join(";"),
        });
      }
    }
    if (args.apply && args.supersedeOldGenerations) {
      supersedeRecord = await supersedeOldGenerations(client);
    }
  } finally {
    await client.end();
  }

  const sample =
    dossiers.find((entry) => entry.skeleton.tenantKey === args.sampleTenant && entry.skeleton.dimensionKey === args.sampleDimension)?.skeleton ||
    dossiers[0]?.skeleton;
  const files = {
    "SAMPLE_DOSSIER.json": JSON.stringify(sample, null, 2),
    "SAMPLE_DOSSIER.md": sampleMarkdown(sample),
    "dossier-build-report.md": reportMarkdown(rows),
    "dossier-build-report.csv": reportCsv(rows),
    "insights-catalog.md": insightsCatalog(dossiers),
    "OUTCOME_REPORT.md": outcomeReport(rows, args),
    "validation-summary.csv": validationCsv(rows),
    "SUPERSEDE_RECORD.md": supersedeRecord
      ? [
          "# Supersede Record",
          "",
          `Active prompt version: ${supersedeRecord.activePromptVersion}`,
          "",
          "Rows were not deleted. Active non-current dossier generations were marked with `invalidated_at` so the only active generation is the clean v2 prompt version. The listed rows can be restored by setting `invalidated_at = NULL` for a controlled rollback.",
          "",
          "## Active Prompt Counts Before",
          "",
          ...supersedeRecord.beforeRows.map((row) => `- ${row.prompt_version}: ${row.count}`),
          "",
          `Newly superseded this run: ${supersedeRecord.newlySupersededRows.length}`,
          `Recoverable non-current rows listed: ${supersedeRecord.supersededRows.length}`,
          "",
          "## Superseded Rows",
          "",
          ...(supersedeRecord.supersededRows.length
            ? supersedeRecord.supersededRows.map(
                (row) =>
                  `- ${row.tenant_key}/${row.dimension_key}: ${row.prompt_version} (${row.dossier_version}); facts=${row.fact_count}, entities=${row.entity_count}, relationships=${row.relationship_count}`,
              )
            : ["- No older active rows required supersession."]),
          "",
          "## Active Prompt Counts After",
          "",
          ...supersedeRecord.afterRows.map((row) => `- ${row.prompt_version}: ${row.count}`),
          "",
        ].join("\n")
      : "# Supersede Record\n\nSupersede step was not requested for this run.\n",
    "summary.json": JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        promptVersion: PROMPT_VERSION,
        dossierVersion: DOSSIER_VERSION,
        applied: args.apply,
        totalDossiers: rows.length,
        validationPassed: rows.filter((row) => row.validation_passed).length,
        validationFailed: rows.filter((row) => !row.validation_passed).length,
        supersedeOldGenerations: Boolean(args.supersedeOldGenerations),
        supersededRows: supersedeRecord?.supersededRows?.length ?? 0,
        newlySupersededRows: supersedeRecord?.newlySupersededRows?.length ?? 0,
        supersededRowDetails: supersedeRecord?.supersededRows ?? [],
      },
      null,
      2,
    ),
  };
  await writeReports(args.outDir, files);
  const result = {
    ok: rows.every((row) => row.validation_passed),
    outDir: args.outDir,
    promptVersion: PROMPT_VERSION,
    dossierVersion: DOSSIER_VERSION,
    applied: args.apply,
    summary: JSON.parse(files["summary.json"]),
    files: args.emitFileBundle ? files : undefined,
  };
  console.log("__ABARVA_L3_DOSSIER_RESULT_BEGIN__");
  console.log(JSON.stringify(result));
  console.log("__ABARVA_L3_DOSSIER_RESULT_END__");
}

function selfTest() {
  const clean = { text: "Leadership accountability is visible by role.", fact_id: "F001" };
  const dirty = { text: "semantic2_records expose client_id values." };
  if (businessLanguageHits(clean).length !== 0) throw new Error("clean business text failed");
  if (businessLanguageHits(dirty).length === 0) throw new Error("dirty machine text missed");
  const skeleton = {
    business_labels: { tenant: "Lakeshore Holdings", dimension: "Organization and Leadership" },
    coverage: { score: 0.5 },
    facts: [{ fact_id: "F001", value: "$42M", entity: "IT", label: "Budget" }],
  };
  const insights = validateInsights(
    [
      { insight: "IT has $42M in budget exposure.", supporting_fact_ids: ["F001"], confidence: "medium" },
      { insight: "IT has $99M in budget exposure.", supporting_fact_ids: ["F001"], confidence: "medium" },
      { insight: "Unsupported claim.", supporting_fact_ids: ["F999"], confidence: "high" },
    ],
    skeleton,
  );
  if (insights.length !== 1 || !insights[0].insight.includes("$42M")) {
    throw new Error("insight grounding self-test failed");
  }
  const oldBrokenSkeleton = {
    tenantKey: "lakeshore-holdings",
    dimensionKey: "organization_leadership",
    business_labels: { tenant: "Lakeshore Holdings", dimension: "Organization and Leadership", sourceAreas: ["Enterprise profile evidence"] },
    coverage: { score: 0.38, confidence: 0.4, verdict: "PARTIAL" },
    facts: [
      {
        fact_id: "F001",
        entity: "enterprise source material:source reference",
        entityType: "Evidence item",
        label: "",
        value: "required",
        citation_ids: ["C001"],
      },
      {
        fact_id: "F002",
        entity: "enterprise source material:source reference",
        entityType: "Evidence item",
        label: "Persona name",
        value: "{\"raw\":\"Treasury analyst\",\"value\":\"Treasury analyst\",\"column\":\"persona_name\"}",
        citation_ids: ["C002"],
      },
    ],
    entities: [],
    relationships: [],
    gaps: [],
    branch_options: [],
    citations: [{ label: "Enterprise context source support", source_area: "Enterprise profile evidence" }],
    derived_insights: [],
  };
  const oldBrokenValidation = validateDossier(oldBrokenSkeleton);
  if (oldBrokenValidation.passed || !oldBrokenValidation.issues.some((issue) => issue.startsWith("business_language_clean"))) {
    throw new Error("old source-reference skeleton regression was not caught");
  }
  console.log(JSON.stringify({ ok: true, selfTest: "build-enriched-l3-dossiers" }, null, 2));
}

async function main() {
  const args = parseArgs();
  if (args.selfTest) {
    selfTest();
    return;
  }
  await buildAll(args);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});

export const __filename = fileURLToPath(import.meta.url);
