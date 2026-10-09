import JSZip from "jszip";

import type {
  StageReadinessWorkbookQuestion,
  StageReadinessWorkbookSpec,
  StageReadinessWorkbookTab,
} from "./types";

export const SYNTHETIC_EVIDENCE_PACK_VERSION =
  "stage-readiness-synthetic-evidence-pack-v1";
export const SYNTHETIC_EVIDENCE_PACK_MARKER = "SYNTHETIC DEMO EVIDENCE";

export interface SyntheticEvidencePackFile {
  path: string;
  mimeType: "text/markdown" | "text/csv" | "application/json";
  content: string;
}

export interface SyntheticEvidencePack {
  packId: string;
  version: string;
  files: SyntheticEvidencePackFile[];
}

function sanitizePathPart(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "evidence"
  );
}

function csvCell(value: string | number | boolean | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function csv(rows: Array<Array<string | number | boolean | null | undefined>>) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function syntheticHeader(spec: StageReadinessWorkbookSpec): string {
  return [
    `# ${SYNTHETIC_EVIDENCE_PACK_MARKER}`,
    "",
    "These files are generated sample evidence for planning and demo workflows.",
    "They are not client-attested and must be reviewed before any row is treated as evidence.",
    `Move: ${spec.moveName}`,
    `Phase: P${spec.phase} to P${spec.nextPhase}`,
    `Workbook: ${spec.workbookId}`,
    // The sample rows are shaped by the same resolved archetype as the
    // workbook's questions, so the pack carries the same provenance sentence.
    `Question set: ${spec.archetypeBasis.statement}`,
    "",
  ].join("\n");
}

function promptList(questions: StageReadinessWorkbookQuestion[]): string {
  return questions
    .map(
      (question, index) =>
        `${index + 1}. ${question.question}\n   Owner: ${question.likelyOwnerRole}\n   Suggested source: ${question.suggestedEvidence.join("; ") || "Owner attestation or uploaded source file"}`,
    )
    .join("\n");
}

function evidenceRegisterForTab(
  spec: StageReadinessWorkbookSpec,
  tab: StageReadinessWorkbookTab,
): SyntheticEvidencePackFile {
  const rows = [
    [
      "synthetic_marker",
      "workbook_id",
      "question_id",
      "dimension_id",
      "evidence_title",
      "sample_owner",
      "sample_status",
      "sample_source_type",
      "review_instruction",
    ],
    ...tab.questions.map((question) => [
      SYNTHETIC_EVIDENCE_PACK_MARKER,
      spec.workbookId,
      question.questionId,
      question.dimensionId,
      `Sample support for ${question.dimensionId}`,
      question.likelyOwnerRole,
      "sample_not_attested",
      question.suggestedEvidence[0] ?? "interview notes",
      "Replace or validate before accepting into governed evidence.",
    ]),
  ];
  return {
    path: `${sanitizePathPart(tab.title)}/evidence-register.csv`,
    mimeType: "text/csv",
    content: `${csv(rows)}\n`,
  };
}

function interviewNotesForTab(
  spec: StageReadinessWorkbookSpec,
  tab: StageReadinessWorkbookTab,
): SyntheticEvidencePackFile {
  return {
    path: `${sanitizePathPart(tab.title)}/interview-notes.md`,
    mimeType: "text/markdown",
    content: [
      syntheticHeader(spec),
      `## ${tab.title}`,
      "",
      "Use this file as a starting agenda for a 45 minute evidence interview. Replace the sample notes with the reviewed client record before upload.",
      "",
      "### Questions to cover",
      "",
      promptList(tab.questions),
      "",
      "### Sample notes",
      "",
      "- Current process owner confirms the operating path and identifies records that need upload.",
      "- Data owner confirms system of record, refresh cadence, and any access constraint.",
      "- Risk or control owner identifies exceptions, approval points, and unresolved evidence gaps.",
      "- Finance or operations owner confirms whether volumes, cycle times, costs, and service metrics are available for the stated period.",
      "",
      "### Review status",
      "",
      "Sample only. Not client-attested. Upload only after replacing this content with reviewed evidence.",
      "",
    ].join("\n"),
  };
}

function dimensionWorkbookMap(
  spec: StageReadinessWorkbookSpec,
): SyntheticEvidencePackFile {
  const rows = [
    [
      "synthetic_marker",
      "tab",
      "dimension_id",
      "question_id",
      "required",
      "state",
      "owner",
      "question",
    ],
    ...spec.tabs.flatMap((tab) =>
      tab.questions.map((question) => [
        SYNTHETIC_EVIDENCE_PACK_MARKER,
        tab.title,
        question.dimensionId,
        question.questionId,
        question.required ? "yes" : "no",
        question.state,
        question.likelyOwnerRole,
        question.question,
      ]),
    ),
  ];
  return {
    path: "workbook-question-map.csv",
    mimeType: "text/csv",
    content: `${csv(rows)}\n`,
  };
}

function controlsMatrix(spec: StageReadinessWorkbookSpec): SyntheticEvidencePackFile {
  return {
    path: "cross-functional/controls-and-decision-rights.csv",
    mimeType: "text/csv",
    content: `${csv([
      [
        "synthetic_marker",
        "control_area",
        "decision_or_control",
        "sample_owner",
        "sample_evidence",
        "review_status",
      ],
      [
        SYNTHETIC_EVIDENCE_PACK_MARKER,
        "Privacy and security",
        "Confirm whether protected data is in scope and which controls apply.",
        "Security / compliance owner",
        "Controls matrix or policy excerpt",
        "sample_not_attested",
      ],
      [
        SYNTHETIC_EVIDENCE_PACK_MARKER,
        "Operational approval",
        `Confirm who can approve P${spec.nextPhase} entry once workbook responses are reviewed.`,
        "Sponsor delegate",
        "Decision note",
        "sample_not_attested",
      ],
      [
        SYNTHETIC_EVIDENCE_PACK_MARKER,
        "Data access",
        "Confirm source system owner, field availability, extract method, and refresh cadence.",
        "Data owner",
        "System inventory or data extract",
        "sample_not_attested",
      ],
    ])}\n`,
  };
}

function baselineMatrix(): SyntheticEvidencePackFile {
  return {
    path: "cross-functional/baseline-metrics-template.csv",
    mimeType: "text/csv",
    content: `${csv([
      [
        "synthetic_marker",
        "metric",
        "sample_period",
        "sample_population",
        "sample_value",
        "unit",
        "source_system",
        "review_status",
      ],
      [
        SYNTHETIC_EVIDENCE_PACK_MARKER,
        "Case volume",
        "latest complete month",
        "target workflow",
        "",
        "count",
        "system of record",
        "replace_with_reviewed_value",
      ],
      [
        SYNTHETIC_EVIDENCE_PACK_MARKER,
        "Average handle time",
        "latest complete month",
        "target workflow",
        "",
        "minutes",
        "operations report",
        "replace_with_reviewed_value",
      ],
      [
        SYNTHETIC_EVIDENCE_PACK_MARKER,
        "Exception rate",
        "latest complete month",
        "target workflow",
        "",
        "percent",
        "quality report",
        "replace_with_reviewed_value",
      ],
    ])}\n`,
  };
}

function manifest(spec: StageReadinessWorkbookSpec, files: SyntheticEvidencePackFile[]) {
  return {
    path: "manifest.json",
    mimeType: "application/json" as const,
    content: `${JSON.stringify(
      {
        marker: SYNTHETIC_EVIDENCE_PACK_MARKER,
        version: SYNTHETIC_EVIDENCE_PACK_VERSION,
        workbookId: spec.workbookId,
        phase: spec.phase,
        nextPhase: spec.nextPhase,
        generatedAt: spec.generatedAt,
        attestation: "sample_not_client_attested",
        usage:
          "Extract the zip and upload individual markdown, csv, or json files only after human review or replacement with client evidence.",
        files: files.map((file) => ({
          path: file.path,
          mimeType: file.mimeType,
        })),
      },
      null,
      2,
    )}\n`,
  };
}

export function buildSyntheticStageReadinessEvidencePack(
  spec: StageReadinessWorkbookSpec,
): SyntheticEvidencePack {
  const tabFiles = spec.tabs.flatMap((tab) => [
    interviewNotesForTab(spec, tab),
    evidenceRegisterForTab(spec, tab),
  ]);
  const filesWithoutManifest: SyntheticEvidencePackFile[] = [
    {
      path: "README.md",
      mimeType: "text/markdown",
      content: [
        syntheticHeader(spec),
        "## How to use this pack",
        "",
        "1. Extract the zip.",
        "2. Review or replace each sample file with the actual client record.",
        "3. Upload the individual markdown, CSV, or JSON files. Do not upload the zip as evidence.",
        "4. Keep unverified samples out of governed evidence. The marker in every file makes that state explicit.",
        "",
        "## Included files",
        "",
        "- Interview-note files for each workbook tab.",
        "- Evidence-register CSV files mapped back to workbook questions.",
        "- Cross-functional controls and baseline metric templates.",
        "",
      ].join("\n"),
    },
    dimensionWorkbookMap(spec),
    controlsMatrix(spec),
    baselineMatrix(),
    ...tabFiles,
  ];
  const files = [manifest(spec, filesWithoutManifest), ...filesWithoutManifest];
  return {
    packId: `${spec.workbookId}:synthetic-evidence-pack`,
    version: SYNTHETIC_EVIDENCE_PACK_VERSION,
    files,
  };
}

export async function renderSyntheticStageReadinessEvidencePackZip(
  spec: StageReadinessWorkbookSpec,
): Promise<Buffer> {
  const pack = buildSyntheticStageReadinessEvidencePack(spec);
  const zip = new JSZip();
  for (const file of pack.files) {
    zip.file(file.path, file.content);
  }
  return zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}
