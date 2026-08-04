import ExcelJS from "exceljs";

import {
  SOURCE_EVIDENCE_REQUIREMENTS,
  type SourceEvidenceRequirement,
} from "@/lib/source/canonical-specs";
import {
  matchEvidenceRequirementForUpload,
  templateFilenameTokenForRequirement,
} from "@/lib/source/canvas-substrate/upload-sync";
import {
  buildInputTemplateWorkbook,
  inputTemplateFilename,
} from "@/lib/source/exports/input-template";
import { templateFactMapByCode } from "@/lib/source/facts/template-fact-map";

const SAMPLE_EVENT = {
  eventCode: "SRC-2026-014",
  eventName: "Application Management Resourcing",
  companyName: "First Capital Financial",
  generatedAtIso: "2026-06-18T00:00:00.000Z",
};

function reqWithToken(): SourceEvidenceRequirement {
  const found = SOURCE_EVIDENCE_REQUIREMENTS.find((r) =>
    templateFilenameTokenForRequirement(r.requirementId),
  );
  if (!found) throw new Error("no requirement has a reconcile token");
  return found;
}

describe("source input template", () => {
  it("ROUND-TRIP: a template's filename reconciles back to its own requirement", () => {
    // The whole contract: download a template, fill it, upload it, and it
    // attaches to the SAME requirement with no manual picking. If this breaks,
    // uploads silently misattach.
    const withTokens = SOURCE_EVIDENCE_REQUIREMENTS.filter((r) =>
      templateFilenameTokenForRequirement(r.requirementId),
    );
    expect(withTokens.length).toBeGreaterThan(0);

    for (const requirement of withTokens) {
      const filename = inputTemplateFilename(requirement);
      const matched = matchEvidenceRequirementForUpload({
        stageKey: requirement.stage,
        filename,
      });
      expect(matched?.requirementId).toBe(requirement.requirementId);
    }
  });

  it("embeds the canonical token in the filename", () => {
    const requirement = reqWithToken();
    const token = templateFilenameTokenForRequirement(requirement.requirementId);
    const filename = inputTemplateFilename(requirement);
    expect(filename).toContain(token as string);
    expect(filename.endsWith(".xlsx")).toBe(true);
  });

  it("builds a real workbook with Cover + Intake sheets and the requirement label", async () => {
    const requirement = reqWithToken();
    const buffer = await buildInputTemplateWorkbook({
      requirement,
      event: SAMPLE_EVENT,
    });
    expect(buffer.length).toBeGreaterThan(0);

    const reloaded = new ExcelJS.Workbook();
    await reloaded.xlsx.load(buffer as unknown as ArrayBuffer);
    expect(reloaded.getWorksheet("Cover")).toBeDefined();
    expect(reloaded.getWorksheet("Intake")).toBeDefined();

    const cover = reloaded.getWorksheet("Cover");
    const flat = JSON.stringify(cover?.getSheetValues() ?? []);
    expect(flat).toContain(requirement.label);
    expect(flat).toContain(SAMPLE_EVENT.companyName);
    // Client-clean: the company name shows, the internal tenant key never does.
    expect(flat).not.toContain("tenant_key");
  });

  it("gives fact-backed requirements parser-aligned intake headers", async () => {
    const factTemplatesByRequirement = {
      "EVID-SRC-SCOPE-APP-INV": "APP_INVENTORY_V1",
      "EVID-SRC-SCOPE-TICKET-HISTORY": "VOLUMETRICS_V1",
      "EVID-SRC-RESP-PROPOSALS": "RESPONSE_COVERAGE_V1",
      "EVID-SRC-PRICE-VENDOR-PRICING": "VENDOR_BIDS_V1",
    } as const;

    for (const [requirementId, templateCode] of Object.entries(
      factTemplatesByRequirement,
    )) {
      const requirement = SOURCE_EVIDENCE_REQUIREMENTS.find(
        (r) => r.requirementId === requirementId,
      );
      if (!requirement) throw new Error(`expected ${requirementId}`);

      const template = templateFactMapByCode(templateCode);
      if (!template) throw new Error(`expected ${templateCode}`);
      const expectedHeaders = [
        ...(template.entityRefColumn
          ? [template.entityRefColumn]
          : template.entityRefColumns ?? []),
        ...template.columns.map((column) => column.header),
      ];

      const buffer = await buildInputTemplateWorkbook({
        requirement,
        event: SAMPLE_EVENT,
      });
      const reloaded = new ExcelJS.Workbook();
      await reloaded.xlsx.load(buffer as unknown as ArrayBuffer);
      const rowValues = reloaded.getWorksheet("Intake")?.getRow(1).values;
      if (!Array.isArray(rowValues)) {
        throw new Error(`expected array headers for ${requirementId}`);
      }
      const header = rowValues.slice(1);

      expect(header).toEqual(expectedHeaders);
    }
  });
});
