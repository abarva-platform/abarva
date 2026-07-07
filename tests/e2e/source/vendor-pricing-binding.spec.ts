import fs from "node:fs";

import { expect, test } from "@playwright/test";
import ExcelJS from "exceljs";

import { signInAs } from "./_auth";

const EVENT_ID = "apex-retail-ams-outsourcing-2026";
const ARTIFACT_CODE = "d19_pricing_workbook";

test.describe("Source d19 vendor pricing binding", () => {
  test("downloads template, uploads vendor pricing, lists it, and renders comparison from bound data", async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    const stamp = Date.now().toString(36);
    const vendorName = `Codex QA Pricing ${stamp}`;

    await signInAs(page, "apex-vp-sourcing");
    await page.goto(`/source/events/${EVENT_ID}?stage=pricing`);

    await expect(page.getByTestId("source-pricing-stage-view")).toBeVisible();
    await page.getByTestId(`source-canvas-artifact-${ARTIFACT_CODE}`).click();
    await expect(
      page.getByTestId(`vendor-pricing-submissions-${ARTIFACT_CODE}`),
    ).toBeVisible();

    const templateHref = await page
      .getByTestId(`source-canvas-document-body-download-xlsx-${ARTIFACT_CODE}`)
      .getAttribute("href");
    expect(templateHref).toBeTruthy();

    const templateResponse = await page.request.get(toAbsolute(templateHref!));
    expect(templateResponse.status()).toBe(200);
    expect(templateResponse.headers()["content-type"]).toContain(
      "spreadsheetml.sheet",
    );
    expect(templateResponse.headers()["x-source-artifact-code"]).toBe(
      ARTIFACT_CODE,
    );
    expect(templateResponse.headers()["x-source-artifact-format"]).toBe("xlsx");

    const templatePath = testInfo.outputPath(`${vendorName}-template.xlsx`);
    fs.writeFileSync(templatePath, await templateResponse.body());

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    workbook.getWorksheet("Cover")!.getCell("B16").value = vendorName;
    const detail = workbook.getWorksheet("Pricing Detail")!;
    let pricedLineCount = 0;
    detail.eachRow({ includeEmpty: false }, (row, rowNum) => {
      if (rowNum === 1) return;
      const lineId = String(row.getCell(1).value ?? "");
      if (!/^L[0-9A-Z-]+/i.test(lineId)) return;
      pricedLineCount += 1;
      row.getCell(6).value = 95 + pricedLineCount * 25;
      if (pricedLineCount === 1) {
        row.getCell(8).value = "Codex QA upload binding proof.";
      }
    });
    expect(pricedLineCount).toBeGreaterThan(0);
    const notes = workbook.getWorksheet("Pricing Notes")!;
    notes.getCell("B2").value =
      "Conforms to three-year horizon; no assumption deviation.";
    notes.getCell("B3").value = "No alternative pricing model requested.";

    const uploadPath = testInfo.outputPath(`${vendorName}.xlsx`);
    const uploadBuffer = await workbook.xlsx.writeBuffer();
    fs.writeFileSync(uploadPath, Buffer.from(uploadBuffer));

    await page
      .getByTestId("vendor-pricing-submission-file-input")
      .setInputFiles(uploadPath);
    await page
      .getByTestId("vendor-pricing-submission-name-input")
      .fill(vendorName);
    await page.getByTestId("vendor-pricing-submission-upload-button").click();

    await expect(
      page.getByTestId("vendor-pricing-submission-success"),
    ).toContainText(vendorName, { timeout: 45_000 });
    await expect(
      page.getByTestId("vendor-pricing-submissions-list"),
    ).toContainText(vendorName);
    await expect(
      page.getByTestId("vendor-pricing-submissions-list"),
    ).toContainText(`${pricedLineCount} priced`);

    const comparisonHref = await page
      .getByTestId(
        `source-canvas-document-body-download-xlsx-comparison-${ARTIFACT_CODE}`,
      )
      .getAttribute("href");
    expect(comparisonHref).toBeTruthy();

    const comparisonResponse = await page.request.get(toAbsolute(comparisonHref!));
    expect(comparisonResponse.status()).toBe(200);
    expect(comparisonResponse.headers()["content-type"]).toContain(
      "spreadsheetml.sheet",
    );
    expect(comparisonResponse.headers()["x-source-artifact-code"]).toBe(
      ARTIFACT_CODE,
    );
    expect(comparisonResponse.headers()["x-source-artifact-format"]).toBe(
      "xlsx",
    );
    expect(comparisonResponse.headers()["x-source-artifact-variant"]).toBe(
      "comparison",
    );

    const comparisonPath = testInfo.outputPath(`${vendorName}-comparison.xlsx`);
    fs.writeFileSync(comparisonPath, await comparisonResponse.body());

    const comparisonWorkbook = new ExcelJS.Workbook();
    await comparisonWorkbook.xlsx.readFile(comparisonPath);
    expect(workbookContains(comparisonWorkbook, vendorName)).toBe(true);
  });
});

function toAbsolute(href: string): string {
  return new URL(href, process.env.BASE_URL ?? "http://localhost:3000").toString();
}

function workbookContains(workbook: ExcelJS.Workbook, needle: string): boolean {
  let found = false;
  for (const sheet of workbook.worksheets) {
    for (const row of sheet.getRows(1, sheet.rowCount) ?? []) {
      row.eachCell({ includeEmpty: false }, (cell) => {
        if (String(cell.value ?? "").includes(needle)) found = true;
      });
      if (found) return true;
    }
  }
  return found;
}
