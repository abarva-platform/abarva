import ExcelJS from "exceljs";
import { createHash } from "node:crypto";

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
import { reviewOperationalInventory } from "@/lib/source/evidence-review/operational-inventory";

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
    expect(SOURCE_EVIDENCE_REQUIREMENTS.length).toBeGreaterThan(0);

    for (const requirement of SOURCE_EVIDENCE_REQUIREMENTS) {
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
      "EVID-SRC-SCOPE-TICKET-HISTORY": "TICKET_HISTORY_V1",
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
        ...(template.contextColumns ?? []),
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
      if (requirementId === "EVID-SRC-SCOPE-TICKET-HISTORY") {
        expect(header).toContain("Ticket Count");
        expect(header).toContain("Support Tier");
        expect(header).toContain("Time Window");
        expect(header).not.toContain("Annual Change-Order Spend (USD)");
      }
    }
  });

  it("offers a cover-first operational inventory that can be reviewed without cost facts", async () => {
    const requirement = SOURCE_EVIDENCE_REQUIREMENTS.find(
      (row) => row.requirementId === "EVID-SRC-SCOPE-APP-INV",
    );
    if (!requirement) throw new Error("missing inventory requirement");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await buildInputTemplateWorkbook({ requirement, event: SAMPLE_EVENT }) as unknown as ArrayBuffer);
    const sheet = workbook.getWorksheet("Intake");
    if (!sheet) throw new Error("missing Intake worksheet");
    expect(sheet.getRow(1).values).toEqual([,
      "Service ID", "Service Name", "Scope Boundary", "Criticality",
      "Lifecycle State", "Service Owner", "Source Basis", "As Of Date",
    ]);
    sheet.getRow(2).values = [,
      "SVC-001", "Service desk", "Ticket intake", "high", "active",
      "IT operations", "Synthetic service catalog", "2026-09-29",
    ];
    const bytes = Buffer.from(await workbook.xlsx.writeBuffer());
    const result = await reviewOperationalInventory({
      artifact: {
        originalName: inputTemplateFilename(requirement),
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        sha256: createHash("sha256").update(bytes).digest("hex"),
      },
      bytes,
    });
    expect(result).toEqual(expect.objectContaining({ ok: true, rowCount: 1 }));
  });
});

const operationalCsv = [
  "Service ID,Service Name,Scope Boundary,Criticality,Lifecycle State,Service Owner,Source Basis,As Of Date",
  "SVC-001,L1/L2 service desk,Intake triage and escalation,high,active,IT operations,Synthetic service catalog,2026-09-29",
  "SVC-002,Endpoint management,Device build patch and lifecycle,medium,active,Endpoint operations,Synthetic service catalog,2026-09-29",
].join("\n");

function inventoryArtifact(bytes: Buffer, overrides: Record<string, string> = {}) {
  return {
    originalName: "service_catalog_scope.csv",
    mimeType: "text/csv",
    sha256: createHash("sha256").update(bytes).digest("hex"),
    ...overrides,
  };
}

describe("operational inventory file review", () => {
  it("accepts a source-bound service inventory without inventing cost facts", async () => {
    const bytes = Buffer.from(operationalCsv);
    const result = await reviewOperationalInventory({
      artifact: inventoryArtifact(bytes), bytes,
    });
    expect(result).toEqual({
      ok: true, rowCount: 2, sourceSha256: inventoryArtifact(bytes).sha256,
    });
  });

  it.each([
    ["wrong byte hash", operationalCsv, { sha256: "0".repeat(64) }],
    ["missing stable identity", operationalCsv.replace("SVC-002", ""), {}],
    ["duplicate identity", operationalCsv.replace("SVC-002", "SVC-001"), {}],
    ["missing source basis", operationalCsv.replace("Synthetic service catalog", ""), {}],
    ["missing owner", operationalCsv.replace("Endpoint operations", ""), {}],
    ["missing lifecycle", operationalCsv.replace(",active,Endpoint operations", ",,Endpoint operations"), {}],
    ["invalid criticality", operationalCsv.replace(",medium,", ",unknown,"), {}],
    ["invalid as-of date", operationalCsv.replace("2026-09-29", "not-a-date"), {}],
    ["impossible as-of date", operationalCsv.replace("2026-09-29", "2026-02-30"), {}],
    ["extra unbound column", operationalCsv.replace("2026-09-29", "2026-09-29,unbound"), {}],
    ["empty data", operationalCsv.split("\n")[0], {}],
    ["duplicate header", operationalCsv.replace("Service Name,", "Service ID,"), {}],
  ])("refuses %s", async (_label, content, overrides) => {
    const bytes = Buffer.from(content);
    const result = await reviewOperationalInventory({
      artifact: inventoryArtifact(bytes, overrides), bytes,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a mislabeled file instead of trusting its extension", async () => {
    const bytes = Buffer.from(operationalCsv);
    expect((await reviewOperationalInventory({
      artifact: inventoryArtifact(bytes, { mimeType: "application/pdf" }), bytes,
    })).ok).toBe(false);
  });
});
