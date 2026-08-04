import fs from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";
import JSZip from "jszip";

const DEFAULT_PACKAGE = "/Users/anand/Downloads/AbarVa_Source_Operational_Extraction_Package_v1.zip";
const PACKAGE_PATH = process.argv[2] ?? DEFAULT_PACKAGE;
const TARGET_CONTRACT_ANNUAL_VALUE = 1_480_500_000;

const expectedOuterFiles = [
  "AbarVa_Source_Client_Data_Request.xlsx",
  "SkyHarbor_Source_Normalized.xlsx",
  "SkyHarbor_Source_Synthetic_System_Extracts.zip",
  "source_mapping_manifest.json",
  "README.md",
];

const expectedExtracts = [
  "ARIBA_SUPPLIERS_20270630.csv",
  "ARIBA_CONTRACT_WORKSPACES_20270630.csv",
  "ARIBA_SOURCING_EVENTS_20270630.xlsx",
  "S4_PURCHASE_ORDERS_2025_2027.csv",
  "S4_VENDOR_INVOICES_2025_2027.csv",
  "SERVICENOW_APPLICATION_INVENTORY.csv",
  "SERVICENOW_VENDOR_KPI_MONTHLY.csv",
  "SERVICENOW_SLA_RESULTS.csv",
  "FIELDGLASS_WORK_ORDERS.csv",
  "FIELDGLASS_RATE_CARDS.csv",
  "FIELDGLASS_INVOICE_DETAILS.csv",
  "LEANIX_APPLICATION_LIFECYCLE.csv",
  "ENTRA_SAAS_USAGE_MONTHLY.csv",
  "AZURE_COST_EXPORT_MONTHLY.csv",
  "source_mapping_manifest.json",
];

const expectedNormalizedCounts = {
  "03_Vendors": 28,
  "04_Contracts": 119,
  "05_Contract_Scope": 418,
  "06_Spend_Consumption": 2856,
  "07_Performance_SLA": 1920,
  "08_Renewal_Commercial": 119,
  "09_Sourcing_Events": 3,
  "10_Event_Requirements": 6,
  "11_Event_Suppliers": 12,
  "12_Event_Responses": 9,
};

function fail(message, details = {}) {
  const error = new Error(message);
  error.details = details;
  throw error;
}

function roundCurrency(value) {
  return Math.round(Number(value) * 100) / 100;
}

async function readWorkbook(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook;
}

function getHeaderIndex(worksheet) {
  const headerRow = worksheet.getRow(1);
  const index = new Map();
  headerRow.eachCell((cell, colNumber) => {
    if (cell.value) index.set(String(cell.value), colNumber);
  });
  return index;
}

async function main() {
  const packageBuffer = await fs.readFile(PACKAGE_PATH);
  const outer = await JSZip.loadAsync(packageBuffer);
  const outerFiles = Object.keys(outer.files).filter((name) => !outer.files[name].dir).sort();
  const missingOuter = expectedOuterFiles.filter((file) => !outerFiles.includes(file));
  if (missingOuter.length) fail("Package is missing outer artifacts.", { missingOuter });

  const manifest = JSON.parse(await outer.file("source_mapping_manifest.json").async("string"));
  if (!manifest.acceptance_gate?.required_columns_have_primary_source_system) {
    fail("Field source map has columns without primary source systems.");
  }
  if (!manifest.acceptance_gate?.exact_report_or_api_present) {
    fail("Field source map has columns without exact report/API instructions.");
  }
  if (!manifest.acceptance_gate?.joining_key_present) {
    fail("Field source map has columns without joining keys.");
  }
  if (!manifest.acceptance_gate?.no_anchor_fallback_mappings) {
    fail("Field source map contains anchor fallback mappings.");
  }

  const missingFieldInstructions = manifest.field_lineage.filter((row) =>
    !row.primary_source_system ||
    !row.exact_report_or_API ||
    !row.joining_key ||
    row.mapping_rule === "anchor_fallback" ||
    /client to provide|ask client|tbd|theoretical/i.test(`${row.exact_report_or_API} ${row.source_object_or_report} ${row.transformation}`),
  );
  if (missingFieldInstructions.length) {
    fail("One or more field-lineage rows are not operationally extractable.", {
      sample: missingFieldInstructions.slice(0, 5),
      count: missingFieldInstructions.length,
    });
  }

  for (const [sheet, expected] of Object.entries(expectedNormalizedCounts)) {
    const actual = manifest.normalized_row_counts?.[sheet];
    if (actual !== expected) fail("Normalized row count drifted.", { sheet, expected, actual });
  }

  const nestedBuffer = await outer.file("SkyHarbor_Source_Synthetic_System_Extracts.zip").async("nodebuffer");
  const nested = await JSZip.loadAsync(nestedBuffer);
  const nestedFiles = Object.keys(nested.files).filter((name) => !nested.files[name].dir).sort();
  const missingExtracts = expectedExtracts.filter((file) => !nestedFiles.includes(file));
  if (missingExtracts.length) fail("Synthetic system extract ZIP is missing files.", { missingExtracts });

  const normalizedBuffer = await outer.file("SkyHarbor_Source_Normalized.xlsx").async("nodebuffer");
  const normalizedWorkbook = await readWorkbook(normalizedBuffer);
  for (const [sheetName, expectedRows] of Object.entries(expectedNormalizedCounts)) {
    const ws = normalizedWorkbook.getWorksheet(sheetName);
    if (!ws) fail("Normalized workbook is missing a sheet.", { sheetName });
    const headerIndex = getHeaderIndex(ws);
    for (const requiredColumn of ["extract_date", "load_run_id", "is_synthetic", "source_system", "source_record_id", "as_of_date"]) {
      if (!headerIndex.has(requiredColumn)) fail("Normalized sheet is missing required lineage column.", { sheetName, requiredColumn });
    }
    const dataRows = ws.rowCount - 1;
    if (dataRows !== expectedRows) fail("Normalized workbook row count drifted.", { sheetName, expectedRows, dataRows });
    for (let rowNumber = 2; rowNumber <= ws.rowCount; rowNumber += 1) {
      const row = ws.getRow(rowNumber);
      for (const requiredColumn of ["extract_date", "load_run_id", "is_synthetic", "source_system", "source_record_id", "as_of_date"]) {
        const value = row.getCell(headerIndex.get(requiredColumn)).value;
        if (value === null || value === undefined || value === "") {
          fail("Normalized lineage field is blank.", { sheetName, rowNumber, requiredColumn });
        }
      }
    }
  }

  const contracts = normalizedWorkbook.getWorksheet("04_Contracts");
  const contractHeader = getHeaderIndex(contracts);
  const annualValueColumn = contractHeader.get("annual_value");
  let contractAnnualValue = 0;
  for (let rowNumber = 2; rowNumber <= contracts.rowCount; rowNumber += 1) {
    contractAnnualValue += Number(contracts.getRow(rowNumber).getCell(annualValueColumn).value || 0);
  }
  contractAnnualValue = roundCurrency(contractAnnualValue);
  if (contractAnnualValue !== TARGET_CONTRACT_ANNUAL_VALUE) {
    fail("Contract annual value no longer reconciles.", {
      expected: TARGET_CONTRACT_ANNUAL_VALUE,
      actual: contractAnnualValue,
    });
  }

  const clientWorkbook = await readWorkbook(await outer.file("AbarVa_Source_Client_Data_Request.xlsx").async("nodebuffer"));
  for (const requiredSheet of ["00_READ_ME", "01_SOURCE_SYSTEM_INVENTORY", "02_FIELD_SOURCE_MAP", ...Object.keys(expectedNormalizedCounts)]) {
    if (!clientWorkbook.getWorksheet(requiredSheet)) fail("Client request workbook is missing a required sheet.", { requiredSheet });
  }

  const result = {
    ok: true,
    package: path.resolve(PACKAGE_PATH),
    outer_files: outerFiles.length,
    source_extract_files: nestedFiles.length,
    normalized_row_counts: manifest.normalized_row_counts,
    field_lineage_rows: manifest.field_lineage.length,
    contract_annual_value: contractAnnualValue,
  };
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: error.message,
    details: error.details ?? {},
  }, null, 2));
  process.exit(1);
});
