/**
 * The basis sentence is only worth deriving if it reaches the operator. These
 * cases render the real workbook and read it back: the statement has to appear
 * on the VISIBLE "Start Here" sheet, because the archetype's only previous
 * home was the `veryHidden` `_metadata` sheet nobody filling the workbook sees.
 *
 * The spec builder and both render sites are separate hops, so a case that
 * only asserted the module's output would stay green with the wiring deleted.
 */

import ExcelJS from "exceljs";
import JSZip from "jszip";

import type { DiscoveryEvidenceReadiness } from "@/lib/programs/discovery/evidence-readiness";
import { buildMoveEvidenceNeedPackets } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import { buildStageReadinessWorkbookSpec } from "@/lib/programs/stage-readiness-workbooks/resolver";
import { renderStageReadinessWorkbookXlsx } from "@/lib/programs/stage-readiness-workbooks/xlsx";
import { renderSyntheticStageReadinessEvidencePackZip } from "@/lib/programs/stage-readiness-workbooks/synthetic-evidence-pack";
import { DECLARED_ARCHETYPE_MARKER } from "@/lib/programs/stage-readiness-workbooks/archetype-basis";
import type { DiscoveryBlueprintBasis } from "@/lib/deliverables/orchestrator/briefs/discovery-blueprint";

function readinessFor(
  blueprintBasis: DiscoveryBlueprintBasis,
  unknownDeclaredArchetype: string | null = null,
  archetypeLabel = "Data-Intensive Predictive Use Case",
): DiscoveryEvidenceReadiness {
  return {
    blueprintId: "test_blueprint",
    blueprintVersion: "2026-08-20",
    archetypeLabel,
    blueprintBasis,
    unknownDeclaredArchetype,
    requiredTotal: 1,
    requiredCovered: 0,
    requiredMissing: 1,
    optionalCovered: 0,
    readinessScore: 0,
    readyForP3: false,
    families: [
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
}

function specFor(readiness: DiscoveryEvidenceReadiness) {
  return buildStageReadinessWorkbookSpec({
    moveId: "move-1",
    moveName: "Predictive Reliability",
    phase: 1,
    nextPhase: 2,
    archetype: readiness.archetypeLabel,
    readiness,
    evidenceNeedPackets: buildMoveEvidenceNeedPackets({
      moveId: "move-1",
      moveName: "Predictive Reliability",
      currentPhase: 1,
      readiness,
    }),
    generatedAt: "2026-08-20T00:00:00.000Z",
  });
}

async function startHereValues(
  readiness: DiscoveryEvidenceReadiness,
): Promise<Map<string, string>> {
  const bytes = await renderStageReadinessWorkbookXlsx(specFor(readiness));
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(bytes as unknown as ArrayBuffer);
  const sheet = wb.getWorksheet("Start Here");
  const values = new Map<string, string>();
  sheet?.eachRow((row) => {
    const key = String(row.getCell(1).value ?? "");
    values.set(key, String(row.getCell(2).value ?? ""));
  });
  return values;
}

describe("stage readiness workbook states what shaped its questions", () => {
  it("renders the basis sentence on the visible Start Here sheet", async () => {
    const values = await startHereValues(readinessFor("declared"));
    expect(values.get("Question set")).toBe(
      "These questions come from the Data-Intensive Predictive Use Case " +
        `archetype. ${DECLARED_ARCHETYPE_MARKER}`,
    );
  });

  it("does not hide the question set behind the veryHidden metadata sheet", async () => {
    const bytes = await renderStageReadinessWorkbookXlsx(
      specFor(readinessFor("declared")),
    );
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(bytes as unknown as ArrayBuffer);
    // The sheet the operator opens must not be hidden, or the sentence is as
    // dark as the metadata row it replaces.
    expect(wb.getWorksheet("Start Here")?.state ?? "visible").toBe("visible");
    expect(wb.getWorksheet("_metadata")?.state).toBe("veryHidden");
  });

  it("tells the operator when no archetype is declared", async () => {
    // The demo path today: nothing declared, so the resolver returns `default`
    // and the general blueprint shapes every question asked.
    const values = await startHereValues(
      readinessFor("default", null, "General (default)"),
    );
    expect(values.get("Question set")).toContain(
      "No archetype has been declared on this Move",
    );
    expect(values.get("Question set")).not.toContain(
      DECLARED_ARCHETYPE_MARKER,
    );
  });

  it("tells the operator when a supplied declaration was discarded", async () => {
    const values = await startHereValues(
      readinessFor("default", "finance", "General (default)"),
    );
    expect(values.get("Question set")).toContain('"finance" was supplied');
    expect(values.get("Question set")).toContain("was discarded");
  });

  it("records the basis in metadata so a parsed workbook keeps the provenance", async () => {
    const bytes = await renderStageReadinessWorkbookXlsx(
      specFor(readinessFor("inferred", null)),
    );
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(bytes as unknown as ArrayBuffer);
    const meta = new Map<string, string>();
    wb.getWorksheet("_metadata")?.eachRow((row) => {
      meta.set(String(row.getCell(1).value ?? ""), String(row.getCell(2).value ?? ""));
    });
    expect(meta.get("archetypeBasis")).toBe("inferred");
    expect(meta.get("archetypeDeclared")).toBe("false");
  });

  it("carries the same sentence into the sample evidence pack", async () => {
    const zip = await renderSyntheticStageReadinessEvidencePackZip(
      specFor(readinessFor("default", "finance", "General (default)")),
    );
    // The pack's sample rows are shaped by the same resolved archetype, so the
    // same provenance has to travel with them.
    const readme = await (await JSZip.loadAsync(zip))
      .file("README.md")
      ?.async("string");
    expect(readme).toContain('"finance" was supplied');
    expect(readme).toContain("was discarded");
    expect(readme).not.toContain(DECLARED_ARCHETYPE_MARKER);
  });
});
