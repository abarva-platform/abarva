import fs from "node:fs";
import path from "node:path";

import { buildSourceArtifactBindingMatrix } from "@/lib/source/artifact-binding-matrix";

const outputArgIndex = process.argv.findIndex((arg) => arg === "--output");
const outputPath =
  outputArgIndex >= 0 && process.argv[outputArgIndex + 1]
    ? process.argv[outputArgIndex + 1]
    : "reports/source-redesign/SOURCE_ARTIFACT_BINDING_MATRIX.md";

const matrix = buildSourceArtifactBindingMatrix(
  undefined,
  process.env.REPORT_TIMESTAMP ?? new Date().toISOString(),
);

const lines = [
  "# Source Artifact Binding Matrix",
  "",
  `Generated: ${matrix.generatedAt}`,
  "",
  "This report is the control surface for Source artifact reality. It separates upload intake, export/download rendering, and the gold-standard artifact expectations so the product cannot call an artifact finished unless the binding is actually wired.",
  "",
  "## Summary",
  "",
  "| Metric | Count |",
  "|---|---:|",
  `| Canonical artifacts | ${matrix.summary.totalArtifacts} |`,
  `| Upload intake ready | ${matrix.summary.uploadIntakeReady} |`,
  `| Declared downloads fully renderer-backed | ${matrix.summary.rendererBackedDeclaredDownloads} |`,
  `| Wired end-to-end | ${matrix.summary.wired} |`,
  `| Partial | ${matrix.summary.partial} |`,
  `| Planned | ${matrix.summary.planned} |`,
  `| Blocked | ${matrix.summary.blocked} |`,
  "",
  "## Matrix",
  "",
  "| Stage | Artifact | Status | Uploads | Downloads | Renderer-backed | Current gap |",
  "|---|---|---|---|---|---|---|",
  ...matrix.rows.map((row) => {
    const rendererBacked = row.rendererBackedFormats.length
      ? row.rendererBackedFormats.join(", ")
      : "none";
    const downloads = row.supportedDownloads
      .map((format) =>
        row.missingRendererForDeclaredDownloads.includes(format)
          ? `${format} (gap)`
          : format,
      )
      .join(", ");
    return [
      row.stageLabel,
      `${row.artifactName} (${row.artifactCode})`,
      row.bindingStatus,
      row.supportedUploads.join(", "),
      downloads,
      rendererBacked,
      row.nextGap,
    ]
      .map(escapeCell)
      .join(" | ");
  }).map((line) => `| ${line} |`),
  "",
  "## Acceptance Rule",
  "",
  "A user-visible upload/download control may ship only when its artifact row is `wired`, or when the UI clearly marks the action as a governed draft/planned state and does not initiate a silent or phantom action. Partial artifacts may still accept uploads, but downstream use must show parser, evidence, and approval status before the artifact influences a recommendation.",
  "",
];

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${lines.join("\n")}\n`);
console.log(`Wrote ${outputPath}`);

function escapeCell(value: string): string {
  return value.replaceAll("|", "\\|").replace(/\s+/g, " ").trim();
}
