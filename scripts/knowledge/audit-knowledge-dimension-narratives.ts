import {
  MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES,
  validateDimensionNarrative,
} from "../../src/lib/enterprise-knowledge/narratives/knowledge-narrative-store";

const failures = MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES.flatMap(
  validateDimensionNarrative,
);

if (MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES.length !== 19) {
  failures.push(
    `expected 19 Meridian dimension summaries, found ${MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES.length}`,
  );
}

const keys = new Set(
  MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES.map((summary) => summary.dimension_key),
);
if (keys.size !== MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES.length) {
  failures.push("duplicate dimension keys detected");
}

const applications = MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES.find(
  (summary) => summary.dimension_key === "04_applications_systems",
);
if (!applications) {
  failures.push("missing Meridian Applications & Systems summary");
} else {
  const text = [
    applications.executive_summary,
    applications.what_nexus_knows.join(" "),
    applications.why_it_matters,
    applications.questions_supported.join(" "),
    applications.current_caveats.join(" "),
    applications.next_validation_actions.join(" "),
  ].join(" ");
  for (const required of [
    "contact center",
    "CRM",
    "claims",
    "eligibility",
    "knowledge",
    "Epic Clarity",
    "Epic Caboodle",
    "SQL Server",
    "Tableau",
    "SAS",
    "AWS",
    "Databricks",
  ]) {
    if (!text.toLowerCase().includes(required.toLowerCase())) {
      failures.push(`Applications & Systems summary missing ${required}`);
    }
  }
  if (!/not current certified production|not production-certified|not certified current production|target-state.*not current production|target-state direction/i.test(text)) {
    failures.push(
      "Applications & Systems summary does not preserve AWS/Databricks target-state caveat",
    );
  }
}

if (failures.length > 0) {
  console.error("Knowledge dimension narrative audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Knowledge dimension narrative audit passed for ${MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES.length} Meridian dimensions.`,
);
