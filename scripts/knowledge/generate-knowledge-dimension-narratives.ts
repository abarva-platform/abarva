import fs from "node:fs";
import path from "node:path";

import {
  MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES,
  validateDimensionNarrative,
} from "../../src/lib/enterprise-knowledge/narratives/knowledge-narrative-store";

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, "reports/knowledge-dimension-narratives");

function csvEscape(value: string | number): string {
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function write(fileName: string, content: string): void {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, fileName), content);
}

const validationRows = MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES.flatMap(
  (summary) =>
    validateDimensionNarrative(summary).map((failure) => ({
      tenant_key: summary.tenant_key,
      dimension_key: summary.dimension_key,
      dimension_name: summary.dimension_name,
      failure,
    })),
);

const coverageRows = MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES.map((summary) => ({
  tenant_key: summary.tenant_key,
  dimension_key: summary.dimension_key,
  dimension_name: summary.dimension_name,
  evidence_refs: summary.evidence_refs_used.length,
  relationship_edges: summary.relationship_edge_ids_used.length,
  gaps: summary.context_gap_ids_used.length,
  validation_status: summary.validation_status,
  generated_by: summary.generated_by,
}));

write(
  "summary.json",
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      status: validationRows.length === 0 ? "pass" : "fail",
      tenant: "meridian-health",
      dimensionNarratives: MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES.length,
      expectedDimensions: 19,
      validationFailures: validationRows,
      truthSplit: {
        generatedBy: "approved_executive_narrative_seed",
        callsClaudeDuringThisCommand: false,
        mutatesSourceData: false,
        promotesCandidateData: false,
        changesModuleRuntimeBehavior: false,
      },
    },
    null,
    2,
  ),
);

write(
  "summary.md",
  [
    "# Knowledge Dimension Narratives",
    "",
    `Status: ${validationRows.length === 0 ? "Pass" : "Fail"}`,
    "",
    "Tenant: Meridian Health",
    "",
    `Dimension summaries: ${MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES.length} of 19`,
    "",
    "Truth split: this command writes deterministic proof reports from the stored approved narrative artifact. It does not call Claude locally, mutate source data, promote candidate data, or change module runtime behavior.",
    "",
    "## Coverage",
    "",
    ...coverageRows.map(
      (row) =>
        `- ${row.dimension_key} ${row.dimension_name}: ${row.validation_status}, ${row.evidence_refs} evidence refs, ${row.relationship_edges} relationship refs, ${row.gaps} gaps`,
    ),
    "",
  ].join("\n"),
);

write(
  "meridian-dimension-summary-coverage.csv",
  [
    "tenant_key,dimension_key,dimension_name,evidence_refs,relationship_edges,gaps,validation_status,generated_by",
    ...coverageRows.map((row) =>
      [
        row.tenant_key,
        row.dimension_key,
        row.dimension_name,
        row.evidence_refs,
        row.relationship_edges,
        row.gaps,
        row.validation_status,
        row.generated_by,
      ]
        .map(csvEscape)
        .join(","),
    ),
  ].join("\n"),
);

write(
  "validation-failures.csv",
  [
    "tenant_key,dimension_key,dimension_name,failure",
    ...validationRows.map((row) =>
      [row.tenant_key, row.dimension_key, row.dimension_name, row.failure]
        .map(csvEscape)
        .join(","),
    ),
  ].join("\n"),
);

write(
  "source-context-hashes.csv",
  [
    "tenant_key,dimension_key,dimension_name,source_context_hash",
    ...MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES.map((summary) =>
      [
        summary.tenant_key,
        summary.dimension_key,
        summary.dimension_name,
        summary.source_context_hash,
      ]
        .map(csvEscape)
        .join(","),
    ),
  ].join("\n"),
);

const applicationsSummary = MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES.find(
  (summary) => summary.dimension_key === "04_applications_systems",
);
write(
  "meridian-applications-systems-summary.json",
  JSON.stringify(applicationsSummary, null, 2),
);

write(
  "knowledge-dimension-narratives-proof.html",
  `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Knowledge Dimension Narrative Proof</title>
  <style>
    body{font-family:Inter,Arial,sans-serif;margin:32px;color:#0c1a3a;background:#fbfcff}
    h1{font-size:32px;margin:0 0 8px} h2{margin-top:28px}
    .card{border:1px solid #e5eaf2;border-radius:12px;background:white;padding:18px;margin:14px 0}
    .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
    .badge{display:inline-flex;border-radius:999px;background:#edf9f2;color:#126449;padding:5px 10px;font-weight:700;font-size:12px}
    li{margin:6px 0;line-height:1.45}
  </style>
</head>
<body>
  <h1>Knowledge Dimension Narrative Proof</h1>
  <p><strong>Tenant:</strong> Meridian Health</p>
  <p><span class="badge">${validationRows.length === 0 ? "PASS" : "FAIL"}</span> ${MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES.length} of 19 dimensions represented.</p>
  <div class="card">
    <h2>Applications &amp; Systems Sample</h2>
    <p>${applicationsSummary?.executive_summary ?? ""}</p>
    <div class="grid">
      <div><h3>What Nexus knows</h3><ul>${(applicationsSummary?.what_nexus_knows ?? []).map((item) => `<li>${item}</li>`).join("")}</ul></div>
      <div><h3>Current caveats</h3><ul>${(applicationsSummary?.current_caveats ?? []).map((item) => `<li>${item}</li>`).join("")}</ul></div>
    </div>
  </div>
  ${MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES.map(
    (summary) => `<div class="card"><h2>${summary.dimension_name}</h2><p>${summary.executive_summary}</p><p><strong>Next:</strong> ${summary.next_validation_actions[0]}</p></div>`,
  ).join("")}
</body>
</html>`,
);

if (validationRows.length > 0) {
  console.error(
    `Knowledge dimension narrative generation completed with ${validationRows.length} validation failures.`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `Knowledge dimension narrative reports written to ${path.relative(repoRoot, outDir)}`,
  );
}
