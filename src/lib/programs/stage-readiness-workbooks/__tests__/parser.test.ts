import ExcelJS from "exceljs";

import type { DiscoveryEvidenceReadiness } from "@/lib/programs/discovery/evidence-readiness";
import { buildMoveEvidenceNeedPackets } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import { parseStageReadinessWorkbookXlsx } from "../parser";
import { buildStageReadinessWorkbookSpec } from "../resolver";
import { renderStageReadinessWorkbookXlsx } from "../xlsx";

const readiness: DiscoveryEvidenceReadiness = {
  blueprintId: "test_blueprint",
  blueprintVersion: "2026-08-20",
  archetypeLabel: "Data-Intensive Predictive Use Case",
  requiredTotal: 2,
  requiredCovered: 1,
  requiredMissing: 1,
  optionalCovered: 0,
  readinessScore: 50,
  readyForP3: false,
  families: [
    {
      familyId: "data_analytics_estate",
      label: "Data & analytics estate profile",
      required: true,
      status: "covered",
      evidenceIds: ["ev_data"],
      evidenceTitles: ["Approved data estate profile"],
    },
    {
      familyId: "kpi_baseline",
      label: "Outcome baseline and KPI packet",
      required: true,
      status: "missing",
      evidenceIds: [],
      evidenceTitles: [],
    },
  ],
  gapRegister: [],
};

async function buildWorkbookBuffer(): Promise<Buffer> {
  const packets = buildMoveEvidenceNeedPackets({
    moveId: "move-1",
    moveName: "Predictive Reliability",
    currentPhase: 1,
    readiness,
  });
  const spec = buildStageReadinessWorkbookSpec({
    moveId: "move-1",
    moveName: "Predictive Reliability",
    phase: 1,
    nextPhase: 2,
    archetype: readiness.archetypeLabel,
    readiness,
    evidenceNeedPackets: packets,
    generatedAt: "2026-08-20T00:00:00.000Z",
  });
  return renderStageReadinessWorkbookXlsx(spec);
}

describe("parseStageReadinessWorkbookXlsx", () => {
  it("round-trips generated workbook responses into proposed response rows", async () => {
    const original = await buildWorkbookBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(original as unknown as ArrayBuffer);

    const dataSheet = workbook.getWorksheet("Data & Quality");
    expect(dataSheet).toBeDefined();
    if (!dataSheet) throw new Error("Data & Quality sheet missing");
    dataSheet.getCell("B2").value = "Confirmed";
    dataSheet.getCell("C2").value =
      "Data estate profile reviewed with analytics owner.";
    dataSheet.getCell("D2").value = "Evidence review EV-100";
    dataSheet.getCell("F2").value = "prefilled_confirmed";

    const edited = Buffer.from(
      (await workbook.xlsx.writeBuffer()) as ArrayBuffer,
    );
    const parsed = await parseStageReadinessWorkbookXlsx(edited, {
      expectedMoveId: "move-1",
      expectedPhase: 1,
    });

    expect(parsed.ok).toBe(true);
    expect(parsed.metadata).toMatchObject({
      workbookId: "move-1:p1-p2:stage-readiness",
      moveId: "move-1",
      phase: 1,
      nextPhase: 2,
    });
    expect(parsed.summary).toMatchObject({
      totalQuestions: 2,
      answeredQuestions: 2,
      requiredAnswered: 2,
      requiredTotal: 2,
      errorCount: 0,
    });
    expect(parsed.responses[0]).toMatchObject({
      questionId: "q_data_analytics_estate",
      dimensionId: "data_analytics_estate",
      response: "Confirmed",
      context: "Data estate profile reviewed with analytics owner.",
      evidenceOrSource: "Evidence review EV-100",
      hasUserInput: true,
    });
  });

  it("blocks workbook uploads for the wrong Move or phase", async () => {
    const parsed = await parseStageReadinessWorkbookXlsx(
      await buildWorkbookBuffer(),
      {
        expectedMoveId: "different-move",
        expectedPhase: 2,
      },
    );

    expect(parsed.ok).toBe(false);
    expect(parsed.summary.errorCount).toBe(2);
    expect(parsed.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "move_mismatch" }),
        expect.objectContaining({ code: "phase_mismatch" }),
      ]),
    );
  });
});
