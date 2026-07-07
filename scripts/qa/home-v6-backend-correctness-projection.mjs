#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const DEFAULT_TENANTS = [
  "apex-retail-synthetic-v6",
  "first-capital-financial-synthetic-v6",
  "lakeshore-holdings-synthetic-v6",
  "meridian-health-synthetic-v6",
  "skyharbor-air-synthetic-v6",
];

const DEMO_SAFE_REPLACEMENTS = [
  [/\bApex Retail Group\b/gi, "Retail Demo"],
  [/\bApex Retail\b/gi, "Retail Demo"],
  [/\bMeridian Health System\b/gi, "Healthcare Demo"],
  [/\bMeridian Health\b/gi, "Healthcare Demo"],
  [/\bFirst Capital Financial\b/gi, "Financial Services Demo"],
  [/\bFirst Capital\b/gi, "Financial Services Demo"],
  [/\bArcturus Financial Group\b/gi, "Financial Services Demo"],
  [/\bArcturus\b/gi, "Financial Services Demo"],
  [/\bSkyHarbor Air Group\b/gi, "Airline Demo"],
  [/\bSkyHarbor Airlines\b/gi, "Airline Demo"],
  [/\bSkyHarbor Air\b/gi, "Airline Demo"],
  [/\bSkyHarbor\b/gi, "Airline Demo"],
  [/\bLakeshore Holdings\b/gi, "Lakeshore Holdings"],
  [/\bLakeshore Holdings\b/gi, "Lakeshore Holdings"],
  [/\bLakeshore\b/gi, "Lakeshore Holdings"],
];

const OLD_DEMO_NAME_RE =
  /\b(Apex Retail Group|Apex Retail|Meridian Health System|Meridian Health|First Capital Financial|First Capital|Arcturus Financial Group|Arcturus|SkyHarbor Air Group|SkyHarbor Airlines|SkyHarbor Air|SkyHarbor|Lakeshore Holdings|Lakeshore Holdings|Lakeshore)\b/i;
const TECHNICAL_OLD_NAME_SCAN_SKIP = new Set([
  "tenant_key",
  "v6_contract_version",
  "business_object_family",
  "record_id",
  "source_system",
  "source_file",
  "source_row_number",
  "created_at",
  "updated_at",
]);

const DIMENSION_FILES = {
  enterprise_profile: "V6_01_enterprise_profile.csv",
  business_function: "V6_02_business_functions.csv",
  org_ownership: "V6_03_org_ownership.csv",
  workforce_persona: "V6_04_workforce_personas.csv",
  application_system: "V6_05_applications_systems.csv",
  data_asset_integration: "V6_06_data_assets_integrations.csv",
  vendor_contract: "V6_07_vendors_contracts.csv",
  spend_value: "V6_08_spend_value.csv",
  program_initiative: "V6_09_programs_initiatives.csv",
  ai_initiative: "V6_10_ai_initiatives.csv",
  operations_risk_control: "V6_11_operations_risk_controls.csv",
  relationship: "V6_12_relationships.csv",
  evidence_source: "V6_13_evidence_sources.csv",
  metric_definition: "V6_14_metric_definitions.csv",
  industry_corpus_pattern: "V6_15_industry_corpus_patterns.csv",
  expert_lens: "V6_16_expert_lenses.csv",
};

const CRITICAL_COLUMNS = {
  enterprise_profile: [
    "company_name",
    "industry",
    "sub_industry",
    "revenue_usd",
    "employee_count",
    "business_model",
    "strategic_priorities",
  ],
  business_function: [
    "function_name",
    "executive_owner",
    "operating_model",
    "primary_kpis",
    "critical_processes",
  ],
  org_ownership: [
    "org_unit_name",
    "leader_role",
    "reports_to_role",
    "decision_rights",
    "owned_systems",
    "owned_processes",
  ],
  workforce_persona: [
    "persona_name",
    "business_area",
    "population_count",
    "ai_relevance",
    "work_context",
  ],
  application_system: [
    "system_name",
    "business_capability",
    "system_owner",
    "criticality",
    "lifecycle_status",
    "vendor_id",
    "annual_cost_usd",
    "integrations",
    "data_dependencies",
    "ai_relevance",
  ],
  data_asset_integration: [
    "data_asset_name",
    "data_owner",
    "system_of_record",
    "lineage",
    "consumers",
    "quality_score",
    "governance_status",
  ],
  vendor_contract: [
    "vendor_name",
    "contract_id",
    "service",
    "annual_cost_usd",
    "renewal_date",
    "owning_function",
    "linked_systems",
    "contract_risk",
    "pricing_basis",
  ],
  spend_value: [
    "amount_usd",
    "amount_type",
    "owner",
    "program_id",
    "vendor_id",
    "system_id",
    "committed_vs_discretionary",
    "renewal_or_gate_date",
    "value_linkage",
    "unit_economics",
  ],
  program_initiative: [
    "business_owner",
    "technology_owner",
    "executive_sponsor",
    "phase",
    "budget_usd",
    "spend_to_date_usd",
    "expected_value_usd",
    "realized_value_usd",
    "value_basis",
    "status",
    "target_date",
    "dependencies",
    "risks",
    "decision_needed",
  ],
  ai_initiative: [
    "use_case",
    "business_process",
    "tool_or_model",
    "agent_or_copilot_name",
    "user_group",
    "licensed_users",
    "active_users",
    "adoption_metric",
    "value_hypothesis",
    "measured_value_usd",
    "production_status",
    "risk_status",
    "model_risk_tier",
    "data_readiness",
    "decision_needed",
    "scale_hold_stop",
  ],
  operations_risk_control: [
    "process",
    "process_owner",
    "severity",
    "status",
    "control",
    "affected_systems",
    "business_impact",
  ],
  relationship: [
    "from_object_family",
    "from_record_id",
    "relationship_type",
    "to_object_family",
    "to_record_id",
    "evidence_basis",
    "relationship_confidence",
  ],
  evidence_source: [
    "evidence_title",
    "evidence_type",
    "source_location",
    "evidence_owner",
    "evidence_confidence",
  ],
  metric_definition: [
    "metric_name",
    "metric_definition",
    "calculation_basis",
    "unit_of_measure",
    "metric_owner",
    "metric_claim_level",
  ],
  industry_corpus_pattern: [
    "pattern_name",
    "industry_domain",
    "when_to_apply",
    "signals",
    "recommended_actions",
    "corpus_context_label",
  ],
  expert_lens: [
    "expert_lens_name",
    "domain_focus",
    "activation_conditions",
    "lens_questions",
    "lens_forbidden_claims",
  ],
};

const MONEY_VALUE_DIMENSIONS = new Set([
  "spend_value",
  "program_initiative",
  "ai_initiative",
  "vendor_contract",
  "application_system",
]);

const MONEY_VALUE_COLUMNS = {
  application_system: ["annual_cost_usd"],
  vendor_contract: ["annual_cost_usd", "renewal_date", "contract_risk", "pricing_basis"],
  spend_value: [
    "amount_usd",
    "amount_type",
    "owner",
    "period_start",
    "period_end",
    "value_linkage",
    "unit_economics",
  ],
  program_initiative: [
    "budget_usd",
    "spend_to_date_usd",
    "expected_value_usd",
    "realized_value_usd",
    "value_basis",
    "target_date",
  ],
  ai_initiative: [
    "licensed_users",
    "active_users",
    "adoption_metric",
    "value_hypothesis",
    "measured_value_usd",
    "production_status",
    "risk_status",
    "data_readiness",
    "scale_hold_stop",
  ],
};

const INTENT_TEMPLATES = [
  {
    id: "inventory",
    question: (label) => `What ${label} context is loaded, and what can Home safely answer from it?`,
    expectedSurface: "Home",
    expectedMode: "inventory",
  },
  {
    id: "coverage",
    question: (label) => `Where is the ${label} packet strong, thin, or missing evidence?`,
    expectedSurface: "Home",
    expectedMode: "gap",
  },
  {
    id: "ownership",
    question: (label) => `Who owns the important ${label} records, and where is ownership not proven?`,
    expectedSurface: "Home",
    expectedMode: "ownership",
  },
  {
    id: "metrics",
    question: (label) =>
      `Which metrics or maturity signals support ${label}, and what should be caveated?`,
    expectedSurface: "Home",
    expectedMode: "metric",
  },
  {
    id: "relationship",
    question: (label) => `How does ${label} connect to systems, vendors, data, risk, or AI initiatives?`,
    expectedSurface: "Home",
    expectedMode: "relationship",
  },
  {
    id: "board_boundary",
    question: (label) => `What board-ready claims can we make about ${label}, and what must not be claimed?`,
    expectedSurface: "Home",
    expectedMode: "claim_boundary",
  },
  {
    id: "intelligence_handoff",
    question: (label) => `Which ${label} questions should be handed off to Intelligence instead of answered in Home?`,
    expectedSurface: "Intelligence",
    expectedMode: "handoff",
  },
  {
    id: "tower_handoff",
    question: (label) => `Which ${label} questions should Tower handle for execution, adoption, readiness, or value tracking?`,
    expectedSurface: "Tower",
    expectedMode: "handoff",
  },
  {
    id: "source_handoff",
    question: (label) => `Which ${label} facts matter most for Source sourcing decisions?`,
    expectedSurface: "Source",
    expectedMode: "handoff",
  },
  {
    id: "unsupported_specific",
    question: (label) => `Can we prove a named-person accountability and audited dollar value for every ${label} item?`,
    expectedSurface: "Home",
    expectedMode: "unsupported_gap",
  },
];

const ENTITY_QUESTION_TEMPLATES = [
  {
    id: "entity_summary",
    question: (name, label) => `What do we know about ${name} in ${label}?`,
    expectedMode: "entity_lookup",
  },
  {
    id: "entity_gap",
    question: (name, label) => `What evidence is missing before we rely on ${name} from ${label}?`,
    expectedMode: "gap",
  },
  {
    id: "entity_claim_boundary",
    question: (name, _label) =>
      `What can we safely claim about ${name}, and what should aVa refuse or caveat?`,
    expectedMode: "claim_boundary",
  },
];

const SURFACE_HINT = {
  enterprise_profile: ["Home", "Intelligence"],
  business_function: ["Home", "Intelligence", "Moves"],
  org_ownership: ["Home", "Intelligence", "Moves", "Source"],
  workforce_persona: ["Intelligence", "Tower"],
  application_system: ["Home", "Intelligence", "Tower", "Moves"],
  data_asset_integration: ["Home", "Intelligence", "Tower"],
  vendor_contract: ["Source", "Tower", "Intelligence"],
  spend_value: ["Tower", "Intelligence"],
  program_initiative: ["Moves", "Tower", "Intelligence"],
  ai_initiative: ["Intelligence", "Tower", "Moves"],
  operations_risk_control: ["Tower", "Intelligence", "Moves"],
  relationship: ["Home", "Intelligence", "Tower", "Moves", "Source"],
  evidence_source: ["Home", "Intelligence", "Tower", "Moves", "Source"],
  metric_definition: ["Home", "Intelligence", "Tower", "Moves", "Source"],
  industry_corpus_pattern: ["Intelligence", "Moves"],
  expert_lens: ["Intelligence", "Moves", "Source", "Tower"],
};

const args = parseArgs(process.argv.slice(2));
const repoRoot = path.resolve(args.repoRoot ?? process.cwd());
const datasetRoot = path.resolve(args.datasetRoot ?? path.join(repoRoot, "datasets"));
const outDir = path.resolve(
  args.outDir ??
    path.join(
      repoRoot,
      "reports",
      `home-v6-backend-correctness-projection-${todayStamp()}`,
    ),
);
const requestedQuestionCount = Number(args.questions ?? 1000);
const tenants = (args.tenants ? args.tenants.split(",") : DEFAULT_TENANTS).filter(
  Boolean,
);

main();

function main() {
  const tenantPackets = tenants.map((tenantDir) =>
    loadTenantPacket(datasetRoot, tenantDir),
  );
  const questions = buildQuestions(tenantPackets, requestedQuestionCount);
  const scored = questions.map(scoreProjectedQuestion);
  const summary = summarize(scored, tenantPackets);

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "projected-question-results.json"),
    JSON.stringify(scored, null, 2),
  );
  fs.writeFileSync(
    path.join(outDir, "summary.json"),
    JSON.stringify(summary, null, 2),
  );
  fs.writeFileSync(
    path.join(outDir, "readme.md"),
    renderMarkdownReport(summary, scored),
  );

  console.log(JSON.stringify(summary, null, 2));
}

function buildQuestions(tenantPackets, targetCount) {
  const generatedGroups = [];
  for (const packet of tenantPackets) {
    for (const dimension of packet.dimensions) {
      const generated = [];
      const label = businessLabel(dimension.family);
      for (const template of INTENT_TEMPLATES) {
        generated.push({
          id: `${packet.tenantDir}:${dimension.family}:${template.id}`,
          tenantDir: packet.tenantDir,
          tenantDisplayName: packet.demoSafeName,
          dimension: dimension.family,
          dimensionLabel: label,
          intent: template.id,
          question: template.question(label),
          expectedSurface: template.expectedSurface,
          expectedMode: template.expectedMode,
          dimensionStats: dimension.stats,
          evidence: projectionEvidence(packet, dimension),
        });
      }

      for (const row of dimension.rows.slice(0, 8)) {
        const entityName = bestRecordName(row);
        if (!entityName) continue;
        for (const template of ENTITY_QUESTION_TEMPLATES) {
          generated.push({
            id: `${packet.tenantDir}:${dimension.family}:${template.id}:${safeId(entityName)}`,
            tenantDir: packet.tenantDir,
            tenantDisplayName: packet.demoSafeName,
            dimension: dimension.family,
            dimensionLabel: label,
            intent: template.id,
            question: template.question(entityName, label),
            expectedSurface: expectedSurfaceForDimension(dimension.family),
            expectedMode: template.expectedMode,
            dimensionStats: dimension.stats,
            evidence: projectionEvidence(packet, dimension, row),
          });
        }
      }
      generatedGroups.push(generated);
    }
  }

  const generated = roundRobin(generatedGroups);
  if (generated.length >= targetCount) {
    return generated.slice(0, targetCount);
  }

  const expandedGroups = generatedGroups.map((questions) => [...questions]);
  let variantIndex = 0;
  while (roundRobin(expandedGroups).length < targetCount) {
    for (const questions of expandedGroups) {
      if (!questions.length) continue;
      const source = questions[variantIndex % questions.length];
      questions.push({
        ...source,
        id: `${source.id}:variant-${Math.floor(variantIndex / questions.length) + 1}`,
        question: rephraseQuestion(source.question, variantIndex),
        variantOf: source.id,
      });
    }
    variantIndex += 1;
  }

  return roundRobin(expandedGroups).slice(0, targetCount);
}

function roundRobin(groups) {
  const output = [];
  const maxLength = groups.reduce(
    (max, group) => Math.max(max, group.length),
    0,
  );
  for (let index = 0; index < maxLength; index += 1) {
    for (const group of groups) {
      if (group[index]) output.push(group[index]);
    }
  }
  return output;
}

function scoreProjectedQuestion(item) {
  const stats = item.dimensionStats;
  const hasRows = stats.rowCount > 0;
  const completeness = stats.criticalCompleteness;
  const dataThinRate = stats.dataThinCellRate;
  const sourceOwnerGap = stats.missingSourceOwnerRate;
  const isUnsupported = item.expectedMode === "unsupported_gap";
  const isHandoff = item.expectedMode === "handoff";
  const oldNameRisk = item.evidence.oldNameLeakRisk;
  const moneyValueQuestion = isMoneyValueQuestion(item);
  const moneyValueReadiness = assessMoneyValueReadiness(item.dimension, stats);

  let projectedQualityScore = 5;
  const reasons = [];

  if (!hasRows) {
    projectedQualityScore = 1;
    reasons.push("No V6 rows are present for the selected dimension.");
  }

  if (hasRows && completeness < 0.35) {
    projectedQualityScore = Math.min(projectedQualityScore, 2);
    reasons.push(
      `Critical column completeness is only ${pct(completeness)}, so aVa should return DATA-THIN or hand off rather than answer richly.`,
    );
  } else if (hasRows && completeness < 0.65) {
    projectedQualityScore = Math.min(projectedQualityScore, 3);
    reasons.push(
      `Critical column completeness is ${pct(completeness)}, which supports a safe but thin answer.`,
    );
  } else if (hasRows && completeness < 0.85) {
    projectedQualityScore = Math.min(projectedQualityScore, 4);
    reasons.push(
      `Critical column completeness is ${pct(completeness)}, so aVa should include caveats.`,
    );
  }

  if (dataThinRate > 0.35) {
    projectedQualityScore = Math.min(projectedQualityScore, 3);
    reasons.push(
      `Data-thin marker rate is ${pct(dataThinRate)}, making unsupported specificity likely if not caveated.`,
    );
  }

  if (sourceOwnerGap > 0.5) {
    projectedQualityScore = Math.min(projectedQualityScore, 3);
    reasons.push(
      `Source-owner gap rate is ${pct(sourceOwnerGap)}, weakening ownership and stewardship claims.`,
    );
  }

  if (oldNameRisk) {
    projectedQualityScore = Math.min(projectedQualityScore, 4);
    reasons.push(
      "Raw V6 values contain old demo/legal tenant names, so public answer payloads must pass demo-safe sanitization.",
    );
  }

  if (moneyValueQuestion && !moneyValueReadiness.canMakeSpecificClaim) {
    projectedQualityScore = Math.min(projectedQualityScore, 2);
    reasons.push(
      `Money/value/adoption question is not claim-ready: ${moneyValueReadiness.reason}`,
    );
  } else if (moneyValueQuestion && moneyValueReadiness.mustCaveat) {
    projectedQualityScore = Math.min(projectedQualityScore, 3);
    reasons.push(
      `Money/value/adoption support is partial: ${moneyValueReadiness.reason}`,
    );
  }

  if (isUnsupported) {
    projectedQualityScore = Math.max(2, Math.min(projectedQualityScore, 4));
    reasons.push(
      "The question asks for exhaustive audited proof; expected correct behavior is to refuse or classify the gap, not fabricate.",
    );
  }

  if (isHandoff && !SURFACE_HINT[item.dimension]?.includes(item.expectedSurface)) {
    projectedQualityScore = Math.min(projectedQualityScore, 3);
    reasons.push(
      `${item.expectedSurface} is not listed in the V6 required surfaces for this dimension, so aVa should explain the boundary.`,
    );
  }

  const answerClass = classifyAnswer({
    score: projectedQualityScore,
    hasRows,
    isUnsupported,
    isHandoff,
    completeness,
  });

  if (projectedQualityScore < 3 && reasons.length === 0) {
    reasons.push("Projected score below 3 requires a concrete data-quality reason.");
  }

  return {
    ...item,
    expectedAnswerClass: answerClass,
    projectedQualityScore,
    correctnessExpectation: correctnessExpectation(answerClass, item),
    scoreReasons: reasons,
    qaFlags: {
      dataThin: answerClass === "DATA_THIN" || dataThinRate > 0.35,
      oldNameLeakRisk: oldNameRisk,
      shouldHandoff: isHandoff,
      shouldRefuseUnsupported: isUnsupported,
      lowScore: projectedQualityScore < 3,
      strictMoneyValueClaimGate: moneyValueQuestion,
      moneyValueClaimReady: moneyValueReadiness.canMakeSpecificClaim,
      mustCaveatMoneyValueClaim: moneyValueReadiness.mustCaveat,
    },
    moneyValueReadiness,
  };
}

function isMoneyValueQuestion(item) {
  if (MONEY_VALUE_DIMENSIONS.has(item.dimension)) return true;
  if (["metrics", "board_boundary", "entity_claim_boundary"].includes(item.intent)) return true;
  return /\b(money|value|budget|spend|cost|run cost|adoption|usage|roi|return|savings|benefit|renewal|license|copilot|agent)\b/i.test(
    item.question,
  );
}

function assessMoneyValueReadiness(dimension, stats) {
  const configuredColumns = MONEY_VALUE_COLUMNS[dimension] ?? [];
  if (configuredColumns.length === 0) {
    return {
      applicable: false,
      canMakeSpecificClaim: true,
      mustCaveat: false,
      completeness: 1,
      reason: "No strict money/value columns apply to this dimension.",
      missingColumns: [],
    };
  }
  const missingRequired = stats.missingMoneyValueColumns.filter(
    (column) => column.missingRate >= 0.8,
  );
  const completeness = stats.moneyValueCompleteness;
  if (stats.rowCount === 0) {
    return {
      applicable: true,
      canMakeSpecificClaim: false,
      mustCaveat: true,
      completeness,
      reason: "no V6 rows are present for the money/value dimension",
      missingColumns: configuredColumns,
    };
  }
  if (stats.supportedMoneyValueColumnCount === 0 || completeness < 0.25) {
    return {
      applicable: true,
      canMakeSpecificClaim: false,
      mustCaveat: true,
      completeness,
      reason: `supported money/value column completeness is ${pct(completeness)}; missing ${missingRequired
        .map((item) => item.column)
        .slice(0, 6)
        .join(", ") || "core value fields"}`,
      missingColumns: missingRequired.map((item) => item.column),
    };
  }
  if (completeness < 0.7 || missingRequired.length > 0) {
    return {
      applicable: true,
      canMakeSpecificClaim: true,
      mustCaveat: true,
      completeness,
      reason: `supported money/value column completeness is ${pct(completeness)}; caveat missing ${missingRequired
        .map((item) => item.column)
        .slice(0, 6)
        .join(", ") || "fields"}`,
      missingColumns: missingRequired.map((item) => item.column),
    };
  }
  return {
    applicable: true,
    canMakeSpecificClaim: true,
    mustCaveat: false,
    completeness,
    reason: `supported money/value column completeness is ${pct(completeness)}`,
    missingColumns: [],
  };
}

function classifyAnswer({ score, hasRows, isUnsupported, isHandoff, completeness }) {
  if (!hasRows) return "METADATA_ONLY";
  if (isUnsupported) return "DATA_THIN";
  if (isHandoff) return "HANDOFF_EXPECTED";
  if (score >= 4 && completeness >= 0.75) return "DECISION_READY_ADVISORY_PACKET";
  if (score >= 3) return "CLEAN_BUT_THIN_PACKET";
  return "DATA_THIN";
}

function correctnessExpectation(answerClass, item) {
  if (answerClass === "DECISION_READY_ADVISORY_PACKET") {
    return "Answer should cite concrete V6 rows, named entities, ownership where available, metrics/maturity signals, and known gaps.";
  }
  if (answerClass === "CLEAN_BUT_THIN_PACKET") {
    return "Answer should be safe and specific to loaded rows, but include clear caveats for missing fields.";
  }
  if (answerClass === "HANDOFF_EXPECTED") {
    return `Answer should briefly state the loaded context boundary and route the user to ${item.expectedSurface}.`;
  }
  if (answerClass === "METADATA_ONLY") {
    return "Answer should say the dimension has no usable V6 rows and identify the missing data.";
  }
  return "Answer should classify the gap as DATA-THIN or unsupported and avoid fabricating precise ownership, value, or proof.";
}

function loadTenantPacket(root, tenantDir) {
  const tenantRoot = path.join(root, tenantDir);
  const templatesRoot = path.join(tenantRoot, "templates");
  if (!fs.existsSync(templatesRoot)) {
    throw new Error(`Missing V6 templates folder: ${templatesRoot}`);
  }

  const dimensions = Object.entries(DIMENSION_FILES).map(([family, filename]) => {
    const filePath = path.join(templatesRoot, filename);
    const rows = fs.existsSync(filePath)
      ? parseCsv(fs.readFileSync(filePath, "utf8"))
      : [];
    return {
      family,
      filename,
      rows,
      stats: scoreDimension(family, rows),
    };
  });

  const profile =
    dimensions.find((dimension) => dimension.family === "enterprise_profile")
      ?.rows[0] ?? {};
  const rawName =
    cleanValue(profile.client_display_name) ||
    cleanValue(profile.company_name) ||
    tenantDir;

  return {
    tenantDir,
    rawName,
    demoSafeName: demoSafeText(rawName),
    dimensions,
  };
}

function scoreDimension(family, rows) {
  const criticalColumns = CRITICAL_COLUMNS[family] ?? [];
  const moneyValueColumns = MONEY_VALUE_COLUMNS[family] ?? [];
  const totalCriticalCells = rows.length * criticalColumns.length;
  const totalMoneyValueCells = rows.length * moneyValueColumns.length;
  let presentCriticalCells = 0;
  let presentMoneyValueCells = 0;
  let dataThinCells = 0;
  let totalCells = 0;
  let sourceOwnerMissing = 0;
  const missingByColumn = Object.fromEntries(
    criticalColumns.map((column) => [column, 0]),
  );
  const missingMoneyValueByColumn = Object.fromEntries(
    moneyValueColumns.map((column) => [column, 0]),
  );
  const oldNameHits = [];

  for (const row of rows) {
    for (const [column, value] of Object.entries(row)) {
      totalCells += 1;
      if (isDataThin(value)) dataThinCells += 1;
      if (shouldSkipOldNameScan(column)) continue;
      if (OLD_DEMO_NAME_RE.test(String(value))) {
        oldNameHits.push({ column, value: String(value).slice(0, 160) });
      }
    }

    if (!cleanValue(row.source_owner)) sourceOwnerMissing += 1;

    for (const column of criticalColumns) {
      if (cleanValue(row[column])) {
        presentCriticalCells += 1;
      } else {
        missingByColumn[column] += 1;
      }
    }

    for (const column of moneyValueColumns) {
      if (cleanValue(row[column])) {
        presentMoneyValueCells += 1;
      } else {
        missingMoneyValueByColumn[column] += 1;
      }
    }
  }

  return {
    rowCount: rows.length,
    criticalColumnCount: criticalColumns.length,
    criticalCompleteness:
      totalCriticalCells > 0 ? presentCriticalCells / totalCriticalCells : 0,
    dataThinCellRate: totalCells > 0 ? dataThinCells / totalCells : 0,
    moneyValueColumnCount: moneyValueColumns.length,
    supportedMoneyValueColumnCount: Object.values(missingMoneyValueByColumn).filter(
      (missingRows) => rows.length > 0 && missingRows < rows.length,
    ).length,
    moneyValueCompleteness:
      totalMoneyValueCells > 0 ? presentMoneyValueCells / totalMoneyValueCells : 1,
    missingSourceOwnerRate:
      rows.length > 0 ? sourceOwnerMissing / rows.length : 1,
    missingCriticalColumns: Object.entries(missingByColumn)
      .filter(([, count]) => count > 0)
      .map(([column, count]) => ({
        column,
        missingRows: count,
        missingRate: rows.length > 0 ? count / rows.length : 1,
      }))
      .sort((a, b) => b.missingRate - a.missingRate || a.column.localeCompare(b.column)),
    missingMoneyValueColumns: Object.entries(missingMoneyValueByColumn)
      .filter(([, count]) => count > 0)
      .map(([column, count]) => ({
        column,
        missingRows: count,
        missingRate: rows.length > 0 ? count / rows.length : 1,
      }))
      .sort((a, b) => b.missingRate - a.missingRate || a.column.localeCompare(b.column)),
    oldNameHitCount: oldNameHits.length,
    oldNameHitSamples: oldNameHits.slice(0, 5),
  };
}

function projectionEvidence(packet, dimension, row = null) {
  const rows = row ? [row] : dimension.rows.slice(0, 5);
  const sampleEntities = rows.map(bestRecordName).filter(Boolean).slice(0, 5);
  const missingCriticalColumns = dimension.stats.missingCriticalColumns
    .filter((item) => item.missingRate > 0)
    .slice(0, 8)
    .map((item) => item.column);

  return {
    sampleEntities: sampleEntities.map(demoSafeText),
    rowCount: dimension.stats.rowCount,
    criticalCompleteness: dimension.stats.criticalCompleteness,
    dataThinCellRate: dimension.stats.dataThinCellRate,
    moneyValueCompleteness: dimension.stats.moneyValueCompleteness,
    missingCriticalColumns,
    missingMoneyValueColumns: dimension.stats.missingMoneyValueColumns
      .filter((item) => item.missingRate > 0)
      .slice(0, 8)
      .map((item) => item.column),
    oldNameLeakRisk: dimension.stats.oldNameHitCount > 0,
    oldNameHitSamples: dimension.stats.oldNameHitSamples.map((hit) => ({
      ...hit,
      safeValue: demoSafeText(hit.value),
    })),
  };
}

function summarize(results, tenantPackets) {
  const byTenant = groupStats(results, "tenantDir");
  const byDimension = groupStats(results, "dimension");
  const byAnswerClass = groupStats(results, "expectedAnswerClass");
  const lowScoreItems = results.filter((item) => item.projectedQualityScore < 3);
  const lowScores = lowScoreItems.slice(0, 100).map((item) => ({
      id: item.id,
      tenantDir: item.tenantDir,
      dimension: item.dimension,
      question: item.question,
      projectedQualityScore: item.projectedQualityScore,
      reasons: item.scoreReasons,
    }));
  const oldNameRiskQuestions = results.filter((item) => item.qaFlags.oldNameLeakRisk);
  const strictMoneyValueFailures = results.filter(
    (item) =>
      item.qaFlags.strictMoneyValueClaimGate && !item.qaFlags.moneyValueClaimReady,
  );
  const strictMoneyValueCaveats = results.filter(
    (item) =>
      item.qaFlags.strictMoneyValueClaimGate &&
      item.qaFlags.moneyValueClaimReady &&
      item.qaFlags.mustCaveatMoneyValueClaim,
  );

  return {
    generatedAt: new Date().toISOString(),
    scope:
      "Backend V6 projected correctness audit. This predicts answerability from V6 coverage and Home KNOW rules; it does not replace live API/browser proof.",
    datasetRoot,
    outDir,
    requestedQuestionCount,
    totalQuestions: results.length,
    tenants: tenantPackets.map((packet) => ({
      tenantDir: packet.tenantDir,
      rawName: packet.rawName,
      demoSafeName: packet.demoSafeName,
      dimensions: packet.dimensions.length,
      totalRows: packet.dimensions.reduce(
        (sum, dimension) => sum + dimension.rows.length,
        0,
      ),
    })),
    byTenant,
    byDimension,
    byAnswerClass,
    projectedPassRate:
      results.length > 0
        ? results.filter((item) => item.projectedQualityScore >= 3).length /
          results.length
        : 0,
    projectedDecisionReadyRate:
      results.length > 0
        ? results.filter(
            (item) =>
              item.expectedAnswerClass === "DECISION_READY_ADVISORY_PACKET",
          ).length / results.length
        : 0,
    projectedThinOrGapRate:
      results.length > 0
        ? results.filter((item) =>
            [
              "CLEAN_BUT_THIN_PACKET",
              "DATA_THIN",
              "METADATA_ONLY",
              "HANDOFF_EXPECTED",
            ].includes(item.expectedAnswerClass),
          ).length / results.length
        : 0,
    lowScoreCount: lowScoreItems.length,
    lowScores,
    strictMoneyValueFailureCount: strictMoneyValueFailures.length,
    strictMoneyValueFailureSample: strictMoneyValueFailures.slice(0, 50).map((item) => ({
      id: item.id,
      tenantDir: item.tenantDir,
      dimension: item.dimension,
      question: item.question,
      reason: item.moneyValueReadiness.reason,
      missingColumns: item.moneyValueReadiness.missingColumns,
    })),
    strictMoneyValueCaveatCount: strictMoneyValueCaveats.length,
    oldNameLeakRiskQuestionCount: oldNameRiskQuestions.length,
    oldNameLeakRiskSample: oldNameRiskQuestions.slice(0, 25).map((item) => ({
      id: item.id,
      tenantDir: item.tenantDir,
      dimension: item.dimension,
      question: item.question,
      samples: item.evidence.oldNameHitSamples,
    })),
    recommendedLiveSmokeSample: selectLiveSmokeSample(results),
  };
}

function groupStats(items, key) {
  const groups = new Map();
  for (const item of items) {
    const groupKey = item[key];
    const current =
      groups.get(groupKey) ??
      {
        count: 0,
        avgProjectedQualityScore: 0,
        decisionReady: 0,
        cleanButThin: 0,
        dataThin: 0,
        metadataOnly: 0,
        handoffExpected: 0,
        oldNameLeakRisk: 0,
        lowScore: 0,
      };
    current.count += 1;
    current.avgProjectedQualityScore += item.projectedQualityScore;
    current.decisionReady +=
      item.expectedAnswerClass === "DECISION_READY_ADVISORY_PACKET" ? 1 : 0;
    current.cleanButThin +=
      item.expectedAnswerClass === "CLEAN_BUT_THIN_PACKET" ? 1 : 0;
    current.dataThin += item.expectedAnswerClass === "DATA_THIN" ? 1 : 0;
    current.metadataOnly += item.expectedAnswerClass === "METADATA_ONLY" ? 1 : 0;
    current.handoffExpected +=
      item.expectedAnswerClass === "HANDOFF_EXPECTED" ? 1 : 0;
    current.oldNameLeakRisk += item.qaFlags.oldNameLeakRisk ? 1 : 0;
    current.lowScore += item.projectedQualityScore < 3 ? 1 : 0;
    groups.set(groupKey, current);
  }

  return Object.fromEntries(
    [...groups.entries()].map(([groupKey, value]) => [
      groupKey,
      {
        ...value,
        avgProjectedQualityScore:
          value.count > 0
            ? Number((value.avgProjectedQualityScore / value.count).toFixed(2))
            : 0,
      },
    ]),
  );
}

function selectLiveSmokeSample(results) {
  const buckets = [
    (item) => item.projectedQualityScore < 3,
    (item) => item.qaFlags.oldNameLeakRisk,
    (item) => item.expectedAnswerClass === "CLEAN_BUT_THIN_PACKET",
    (item) => item.expectedAnswerClass === "DECISION_READY_ADVISORY_PACKET",
    (item) => item.expectedAnswerClass === "HANDOFF_EXPECTED",
  ];
  const selected = [];
  const seen = new Set();
  for (const predicate of buckets) {
    for (const item of results.filter(predicate)) {
      const tenantDimension = `${item.tenantDir}:${item.dimension}`;
      if (seen.has(item.id) || seen.has(tenantDimension)) continue;
      selected.push({
        id: item.id,
        tenantDir: item.tenantDir,
        dimension: item.dimension,
        question: item.question,
        expectedAnswerClass: item.expectedAnswerClass,
        projectedQualityScore: item.projectedQualityScore,
        reasons: item.scoreReasons,
      });
      seen.add(item.id);
      seen.add(tenantDimension);
      if (selected.length >= 40) return selected;
    }
  }
  return selected;
}

function renderMarkdownReport(summary, results) {
  const lines = [
    "# Home V6 Backend Correctness Projection",
    "",
    `Generated: ${summary.generatedAt}`,
    "",
    summary.scope,
    "",
    "## Summary",
    "",
    `- Total projected questions: ${summary.totalQuestions}`,
    `- Projected pass rate: ${pct(summary.projectedPassRate)}`,
    `- Projected decision-ready rate: ${pct(summary.projectedDecisionReadyRate)}`,
    `- Projected thin/gap/handoff rate: ${pct(summary.projectedThinOrGapRate)}`,
    `- Low-score projected questions: ${summary.lowScoreCount}`,
    `- Strict money/value/adoption failures: ${summary.strictMoneyValueFailureCount}`,
    `- Strict money/value/adoption caveat-required questions: ${summary.strictMoneyValueCaveatCount}`,
    `- Questions with raw old-name leak risk before API sanitization: ${summary.oldNameLeakRiskQuestionCount}`,
    "",
    "## Answer Classes",
    "",
    "| Class | Count | Avg Score |",
    "| --- | ---: | ---: |",
  ];

  for (const [className, stats] of Object.entries(summary.byAnswerClass)) {
    lines.push(`| ${className} | ${stats.count} | ${stats.avgProjectedQualityScore} |`);
  }

  lines.push("", "## Tenant Results", "", "| Tenant | Count | Avg Score | Decision-ready | Thin | Data-thin | Handoff | Old-name risk |", "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
  for (const [tenant, stats] of Object.entries(summary.byTenant)) {
    lines.push(
      `| ${tenant} | ${stats.count} | ${stats.avgProjectedQualityScore} | ${stats.decisionReady} | ${stats.cleanButThin} | ${stats.dataThin + stats.metadataOnly} | ${stats.handoffExpected} | ${stats.oldNameLeakRisk} |`,
    );
  }

  lines.push("", "## Highest-Risk Live Smoke Sample", "");
  for (const item of summary.recommendedLiveSmokeSample.slice(0, 20)) {
    lines.push(
      `- ${item.tenantDir} / ${item.dimension} / score ${item.projectedQualityScore}: ${item.question}`,
    );
    if (item.reasons.length) lines.push(`  Reason: ${item.reasons.join(" ")}`);
  }

  lines.push("", "## Low-Score Reasons", "");
  for (const item of summary.lowScores.slice(0, 30)) {
    lines.push(
      `- ${item.tenantDir} / ${item.dimension} / score ${item.projectedQualityScore}: ${item.question}`,
    );
    lines.push(`  Reason: ${item.reasons.join(" ")}`);
  }

  lines.push("", "## Strict Money/Value/Adoption Failures", "");
  for (const item of summary.strictMoneyValueFailureSample.slice(0, 30)) {
    lines.push(`- ${item.tenantDir} / ${item.dimension}: ${item.question}`);
    lines.push(`  Reason: ${item.reason}`);
    if (item.missingColumns.length) {
      lines.push(`  Missing columns: ${item.missingColumns.join(", ")}`);
    }
  }

  lines.push("", "## Method Boundary", "");
  lines.push(
    "This audit does not call Claude and does not prove renderer behavior. It projects the expected Home aVa answer class from V6 row coverage, critical column completeness, data-thin markers, source-owner gaps, old-name risk, and surface routing rules. Use the recommended smoke sample for live API/browser proof.",
  );

  const topRows = results.slice(0, 5);
  if (topRows.length) {
    lines.push("", "## Example Projected Questions", "");
    for (const item of topRows) {
      lines.push(
        `- ${item.id}: ${item.question} -> ${item.expectedAnswerClass} (${item.projectedQualityScore})`,
      );
    }
  }

  return `${lines.join("\n")}\n`;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const headers = rows.shift() ?? [];
  return rows
    .filter((values) => values.some((value) => String(value).trim()))
    .map((values) =>
      Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
    );
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = "1";
    } else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}

function bestRecordName(row) {
  return (
    cleanValue(row.record_name) ||
    cleanValue(row.company_name) ||
    cleanValue(row.function_name) ||
    cleanValue(row.org_unit_name) ||
    cleanValue(row.persona_name) ||
    cleanValue(row.system_name) ||
    cleanValue(row.data_asset_name) ||
    cleanValue(row.vendor_name) ||
    cleanValue(row.use_case) ||
    cleanValue(row.process) ||
    cleanValue(row.metric_name) ||
    cleanValue(row.pattern_name) ||
    cleanValue(row.expert_lens_name) ||
    null
  );
}

function cleanValue(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (/^data_thin:/i.test(text)) return "";
  if (/^unknown$/i.test(text)) return "";
  if (/^synthetic_demo$/i.test(text)) return "";
  if (/^v4_synthetic_pack$/i.test(text)) return "";
  if (/^static_snapshot$/i.test(text)) return "";
  if (/^confidential$/i.test(text)) return "";
  return text;
}

function isDataThin(value) {
  return /^data_thin:/i.test(String(value ?? "").trim());
}

function demoSafeText(value) {
  return DEMO_SAFE_REPLACEMENTS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    String(value ?? ""),
  );
}

function shouldSkipOldNameScan(column) {
  return TECHNICAL_OLD_NAME_SCAN_SKIP.has(column) || column.endsWith("_id");
}

function businessLabel(family) {
  return family.replace(/_/g, " ");
}

function expectedSurfaceForDimension(family) {
  return SURFACE_HINT[family]?.[0] ?? "Home";
}

function rephraseQuestion(question, index) {
  const prefixes = [
    "For a CIO review, ",
    "For an executive readout, ",
    "For demo QA, ",
    "For a board-prep view, ",
    "For a current-state check, ",
  ];
  return `${prefixes[index % prefixes.length]}${question.charAt(0).toLowerCase()}${question.slice(1)}`;
}

function safeId(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function pct(value) {
  return `${Math.round(value * 1000) / 10}%`;
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}
