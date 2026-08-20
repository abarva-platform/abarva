import ExcelJS from "exceljs";

import type { DiscoveryEvidenceReadiness } from "@/lib/programs/discovery/evidence-readiness";
import { buildMoveEvidenceNeedPackets } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
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

describe("renderStageReadinessWorkbookXlsx", () => {
  it("renders visible workbook tabs plus hidden metadata", async () => {
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

    const buffer = await renderStageReadinessWorkbookXlsx(spec);
    expect(buffer.subarray(0, 2).toString("latin1")).toBe("PK");

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

    expect(workbook.getWorksheet("Start Here")).toBeDefined();
    expect(workbook.getWorksheet("Data & Quality")).toBeDefined();
    expect(workbook.getWorksheet("Performance & Value")).toBeDefined();
    expect(workbook.getWorksheet("Evidence & Open Items")).toBeDefined();

    const metadata = workbook.getWorksheet("_metadata");
    expect(metadata).toBeDefined();
    expect(metadata?.state).toBe("veryHidden");
    expect(metadata?.getCell("B2").value).toBe(spec.workbookId);

    const dataSheet = workbook.getWorksheet("Data & Quality");
    expect(dataSheet?.getCell("A1").value).toBe("Question");
    expect(dataSheet?.getCell("B2").value).toBe("Needs validation");
    expect(String(dataSheet?.getCell("C2").value)).toContain(
      "Approved data estate profile",
    );
  });
});
