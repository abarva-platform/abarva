import ExcelJS from "exceljs";

import type {
  StageReadinessWorkbookQuestion,
  StageReadinessWorkbookSpec,
} from "./types";

const VISIBLE_COLUMNS = [
  { key: "question", header: "Question", width: 42 },
  { key: "response", header: "Response", width: 20 },
  { key: "context", header: "Tell Us More / Context", width: 34 },
  { key: "evidence", header: "Evidence or Source", width: 34 },
  { key: "owner", header: "Owner", width: 28 },
  { key: "status", header: "Status", width: 22 },
] as const;

function safeSheetName(name: string, index: number): string {
  const cleaned = name
    .replace(/[[\]:*?/\\]/g, " ")
    .trim()
    .slice(0, 31);
  return cleaned.length > 0 ? cleaned : `Sheet ${index + 1}`;
}

function styleHeader(row: ExcelJS.Row): void {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF203864" },
  };
  row.alignment = { vertical: "middle", wrapText: true };
}

function styleWorksheet(ws: ExcelJS.Worksheet): void {
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.eachRow((row, rowNumber) => {
    row.alignment = { vertical: "top", wrapText: true };
    if (rowNumber === 1) styleHeader(row);
  });
}

function addQuestionRows(
  ws: ExcelJS.Worksheet,
  questions: StageReadinessWorkbookQuestion[],
): void {
  ws.columns = [...VISIBLE_COLUMNS];
  for (const question of questions) {
    ws.addRow({
      question: question.question,
      response: question.prefilledResponse ? "Needs validation" : "",
      context: question.prefilledResponse ?? "",
      evidence: question.evidenceRefs.join("; "),
      owner: question.likelyOwnerRole,
      status: question.state,
    });
  }
  styleWorksheet(ws);
}

export async function renderStageReadinessWorkbookXlsx(
  spec: StageReadinessWorkbookSpec,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AbarVa";
  wb.title = spec.artifactName;
  wb.subject = "Strategic Moves stage readiness workbook";
  wb.created = new Date(spec.generatedAt);
  wb.modified = new Date(spec.generatedAt);

  const start = wb.addWorksheet("Start Here");
  start.columns = [
    { key: "item", header: "Item", width: 28 },
    { key: "value", header: "Value", width: 80 },
  ];
  start.addRow({
    item: "Purpose",
    value: spec.startHere.purpose,
  });
  start.addRow({ item: "Move", value: spec.moveName });
  start.addRow({ item: "Workbook", value: spec.artifactName });
  start.addRow({
    item: "Pre-filled questions",
    value: String(spec.startHere.alreadyPrefilled),
  });
  start.addRow({
    item: "Needs input",
    value: String(spec.startHere.needsInput),
  });
  start.addRow({
    item: "Suggested sessions",
    value: spec.startHere.suggestedSessions
      .map(
        (session) =>
          `${session.session}: ${session.participants} (${session.typicalTime})`,
      )
      .join("\n"),
  });
  styleWorksheet(start);

  spec.tabs.forEach((tab, index) => {
    const ws = wb.addWorksheet(safeSheetName(tab.title, index + 1));
    addQuestionRows(ws, tab.questions);
  });

  const open = wb.addWorksheet("Evidence & Open Items");
  open.columns = [
    { key: "dimension", header: "Area", width: 30 },
    { key: "item", header: "Open Item", width: 48 },
    { key: "owner", header: "Owner", width: 28 },
    { key: "status", header: "Status", width: 22 },
    { key: "nextAction", header: "Next Action", width: 48 },
    { key: "blocks", header: "Blocks Next Phase", width: 18 },
  ];
  for (const item of spec.evidenceAndOpenItems) {
    open.addRow({
      dimension: item.dimensionId,
      item: item.title,
      owner: item.owner,
      status: item.status,
      nextAction: item.nextAction,
      blocks: item.blocksNextPhase ? "Yes" : "No",
    });
  }
  styleWorksheet(open);

  const metadata = wb.addWorksheet("_metadata");
  metadata.state = "veryHidden";
  metadata.columns = [
    { key: "key", header: "key", width: 36 },
    { key: "value", header: "value", width: 100 },
  ];
  for (const [key, value] of Object.entries({
    workbookId: spec.workbookId,
    workbookVersion: spec.workbookVersion,
    contractVersion: spec.contractVersion,
    moveId: spec.moveId,
    phase: String(spec.phase),
    nextPhase: String(spec.nextPhase),
    archetype: spec.archetype,
    generatedAt: spec.generatedAt,
    workbookContentHash: spec.metadata.workbookContentHash,
    dimensionPlanVersion: spec.metadata.dimensionPlanVersion,
  })) {
    metadata.addRow({ key, value });
  }
  metadata.addRow({
    key: "questionMap",
    value: JSON.stringify(
      spec.tabs.flatMap((tab) =>
        tab.questions.map((question) => ({
          questionId: question.questionId,
          dimensionId: question.dimensionId,
          requirement: question.required ? "required" : "recommended",
          sourceClass: question.sourceClass,
        })),
      ),
    ),
  });

  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out as ArrayBuffer);
}
