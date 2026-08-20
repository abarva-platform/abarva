import ExcelJS from "exceljs";

import type {
  EvidenceSourceClass,
  QuestionState,
  WorkbookResponseType,
} from "./types";

export type StageReadinessWorkbookParseIssueSeverity = "error" | "warning";

export interface StageReadinessWorkbookParseIssue {
  severity: StageReadinessWorkbookParseIssueSeverity;
  code:
    | "missing_metadata"
    | "invalid_metadata"
    | "move_mismatch"
    | "phase_mismatch"
    | "missing_question_map"
    | "missing_visible_question"
    | "extra_visible_response";
  message: string;
  sheetName?: string;
  rowNumber?: number;
}

export interface StageReadinessWorkbookParsedResponse {
  questionId: string;
  dimensionId: string;
  requirement: "required" | "recommended";
  sourceClass: EvidenceSourceClass;
  sheetName: string;
  rowNumber: number;
  question: string;
  response: string;
  context: string;
  evidenceOrSource: string;
  owner: string;
  status: string;
  hasUserInput: boolean;
}

export interface StageReadinessWorkbookParsedMetadata {
  workbookId: string;
  workbookVersion: string | null;
  contractVersion: string | null;
  moveId: string;
  phase: number;
  nextPhase: number;
  archetype: string | null;
  generatedAt: string | null;
  workbookContentHash: string | null;
  dimensionPlanVersion: string | null;
}

export interface StageReadinessWorkbookParseResult {
  ok: boolean;
  metadata: StageReadinessWorkbookParsedMetadata | null;
  responses: StageReadinessWorkbookParsedResponse[];
  issues: StageReadinessWorkbookParseIssue[];
  summary: {
    totalQuestions: number;
    answeredQuestions: number;
    requiredAnswered: number;
    requiredTotal: number;
    warningCount: number;
    errorCount: number;
  };
}

interface QuestionMapEntry {
  questionId: string;
  dimensionId: string;
  requirement: "required" | "recommended";
  sourceClass: EvidenceSourceClass;
}

const NON_RESPONSE_SHEETS = new Set([
  "Start Here",
  "Evidence & Open Items",
  "_metadata",
]);

function cellText(cell: ExcelJS.Cell): string {
  const value = cell.value;
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && "text" in value) {
    return String(value.text ?? "").trim();
  }
  if (typeof value === "object" && "richText" in value) {
    const rich = value.richText;
    if (Array.isArray(rich)) {
      return rich
        .map((part) => String(part.text ?? ""))
        .join("")
        .trim();
    }
  }
  return String(value).trim();
}

function parseInteger(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function readMetadata(
  workbook: ExcelJS.Workbook,
  issues: StageReadinessWorkbookParseIssue[],
): {
  metadata: StageReadinessWorkbookParsedMetadata | null;
  questionMap: QuestionMapEntry[];
} {
  const sheet = workbook.getWorksheet("_metadata");
  if (!sheet) {
    issues.push({
      severity: "error",
      code: "missing_metadata",
      message: "Workbook is missing the hidden _metadata sheet.",
    });
    return { metadata: null, questionMap: [] };
  }

  const values = new Map<string, string>();
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const key = cellText(row.getCell(1));
    if (!key) return;
    values.set(key, cellText(row.getCell(2)));
  });

  const phase = parseInteger(values.get("phase") ?? "");
  const nextPhase = parseInteger(values.get("nextPhase") ?? "");
  const workbookId = values.get("workbookId") ?? "";
  const moveId = values.get("moveId") ?? "";
  if (!workbookId || !moveId || phase === null || nextPhase === null) {
    issues.push({
      severity: "error",
      code: "invalid_metadata",
      message:
        "Workbook metadata must include workbookId, moveId, phase, and nextPhase.",
      sheetName: "_metadata",
    });
  }

  let questionMap: QuestionMapEntry[] = [];
  const rawQuestionMap = values.get("questionMap") ?? "";
  try {
    const parsed = JSON.parse(rawQuestionMap) as unknown;
    if (!Array.isArray(parsed)) throw new Error("questionMap is not an array");
    questionMap = parsed.filter(isQuestionMapEntry);
    if (questionMap.length !== parsed.length) {
      throw new Error("questionMap has invalid entries");
    }
  } catch {
    issues.push({
      severity: "error",
      code: "missing_question_map",
      message: "Workbook metadata is missing a valid questionMap.",
      sheetName: "_metadata",
    });
  }

  return {
    metadata:
      workbookId && moveId && phase !== null && nextPhase !== null
        ? {
            workbookId,
            workbookVersion: values.get("workbookVersion") || null,
            contractVersion: values.get("contractVersion") || null,
            moveId,
            phase,
            nextPhase,
            archetype: values.get("archetype") || null,
            generatedAt: values.get("generatedAt") || null,
            workbookContentHash: values.get("workbookContentHash") || null,
            dimensionPlanVersion: values.get("dimensionPlanVersion") || null,
          }
        : null,
    questionMap,
  };
}

function isQuestionMapEntry(value: unknown): value is QuestionMapEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.questionId === "string" &&
    typeof entry.dimensionId === "string" &&
    (entry.requirement === "required" || entry.requirement === "recommended") &&
    typeof entry.sourceClass === "string"
  );
}

function visibleQuestionSheets(
  workbook: ExcelJS.Workbook,
): ExcelJS.Worksheet[] {
  return workbook.worksheets.filter(
    (sheet) => !NON_RESPONSE_SHEETS.has(sheet.name),
  );
}

export async function parseStageReadinessWorkbookXlsx(
  input: Buffer | ArrayBuffer | Uint8Array,
  options: { expectedMoveId?: string; expectedPhase?: number } = {},
): Promise<StageReadinessWorkbookParseResult> {
  const workbook = new ExcelJS.Workbook();
  const buffer = Buffer.isBuffer(input)
    ? input
    : input instanceof ArrayBuffer
      ? Buffer.from(input)
      : Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

  const issues: StageReadinessWorkbookParseIssue[] = [];
  const { metadata, questionMap } = readMetadata(workbook, issues);
  if (
    metadata &&
    options.expectedMoveId &&
    metadata.moveId !== options.expectedMoveId
  ) {
    issues.push({
      severity: "error",
      code: "move_mismatch",
      message: `Workbook moveId ${metadata.moveId} does not match expected moveId ${options.expectedMoveId}.`,
    });
  }
  if (
    metadata &&
    options.expectedPhase !== undefined &&
    metadata.phase !== options.expectedPhase
  ) {
    issues.push({
      severity: "error",
      code: "phase_mismatch",
      message: `Workbook phase ${metadata.phase} does not match expected phase ${options.expectedPhase}.`,
    });
  }

  const rows = visibleQuestionSheets(workbook).flatMap((sheet) => {
    const out: Array<{ sheet: ExcelJS.Worksheet; row: ExcelJS.Row }> = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const question = cellText(row.getCell(1));
      const response = cellText(row.getCell(2));
      const context = cellText(row.getCell(3));
      const evidence = cellText(row.getCell(4));
      const owner = cellText(row.getCell(5));
      const status = cellText(row.getCell(6));
      if (question || response || context || evidence || owner || status) {
        out.push({ sheet, row });
      }
    });
    return out;
  });

  const responses: StageReadinessWorkbookParsedResponse[] = [];
  const total = Math.max(questionMap.length, rows.length);
  for (let index = 0; index < total; index += 1) {
    const mapEntry = questionMap[index];
    const rowEntry = rows[index];
    if (!mapEntry && rowEntry) {
      issues.push({
        severity: "warning",
        code: "extra_visible_response",
        message:
          "Workbook contains a visible response row that has no metadata question mapping.",
        sheetName: rowEntry.sheet.name,
        rowNumber: rowEntry.row.number,
      });
      continue;
    }
    if (mapEntry && !rowEntry) {
      issues.push({
        severity: "error",
        code: "missing_visible_question",
        message: `Question ${mapEntry.questionId} is present in metadata but missing from visible question sheets.`,
      });
      continue;
    }
    if (!mapEntry || !rowEntry) continue;

    const response = cellText(rowEntry.row.getCell(2));
    const context = cellText(rowEntry.row.getCell(3));
    const evidenceOrSource = cellText(rowEntry.row.getCell(4));
    const owner = cellText(rowEntry.row.getCell(5));
    const status = cellText(rowEntry.row.getCell(6));
    responses.push({
      questionId: mapEntry.questionId,
      dimensionId: mapEntry.dimensionId,
      requirement: mapEntry.requirement,
      sourceClass: mapEntry.sourceClass,
      sheetName: rowEntry.sheet.name,
      rowNumber: rowEntry.row.number,
      question: cellText(rowEntry.row.getCell(1)),
      response,
      context,
      evidenceOrSource,
      owner,
      status,
      hasUserInput: Boolean(response || context || evidenceOrSource || status),
    });
  }

  const errorCount = issues.filter(
    (issue) => issue.severity === "error",
  ).length;
  const warningCount = issues.filter(
    (issue) => issue.severity === "warning",
  ).length;
  const required = responses.filter(
    (response) => response.requirement === "required",
  );
  return {
    ok: errorCount === 0,
    metadata,
    responses,
    issues,
    summary: {
      totalQuestions: responses.length,
      answeredQuestions: responses.filter((response) => response.hasUserInput)
        .length,
      requiredAnswered: required.filter((response) => response.hasUserInput)
        .length,
      requiredTotal: required.length,
      warningCount,
      errorCount,
    },
  };
}

export function workbookResponseTypeForParsedResponse(
  value: string,
): WorkbookResponseType {
  const trimmed = value.trim().toLowerCase();
  if (["yes", "no", "partial"].includes(trimmed)) return "yes_no_partial";
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return "number";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return "date";
  return "text";
}

export function questionStateFromParsedStatus(value: string): QuestionState {
  const normalized = value.trim() as QuestionState;
  const allowed: QuestionState[] = [
    "prefilled_confirmed",
    "prefilled_needs_confirmation",
    "needs_answer",
    "insufficient_evidence",
    "not_applicable",
  ];
  return allowed.includes(normalized) ? normalized : "needs_answer";
}
