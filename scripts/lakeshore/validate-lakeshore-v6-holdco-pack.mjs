import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const tenantDir = path.join(repoRoot, "datasets/lakeshore-holdings-synthetic-v6");
const templateDir = path.join(tenantDir, "templates");
const holdcoDir = path.join(tenantDir, "holdco_tower");
const TENANT_KEY = "lakeshore-holdings";
const CLIENT = "Lakeshore Holdings";
const EXPECTED_DIRECT_IT_BUDGET = 190600000;
const EXPECTED_ALLOCATION_VIEW = 36500000;
const EXPECTED_INNOVATION_COMPONENT = 11800000;
const EXPECTED_PORTFOLIO_REVENUE = 7120000000;
const EXPECTED_NAMED_OPCO_REVENUE = 3560000000;
const EXPECTED_OPCO_REVENUE_TO_ALLOCATE = 3560000000;
const EXPECTED_EMPLOYEES = 11800;
const PORTFOLIO_COMPANIES = [
  "Northline",
  "Brightmark",
  "Forge & Field",
  "Great Lakes Pantry",
];

function parseCsv(text) {
  const rows = [];
  let cell = "";
  let row = [];
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((value) => value !== ""));
}

function readCsv(filePath) {
  const parsed = parseCsv(fs.readFileSync(filePath, "utf8"));
  const [headers, ...dataRows] = parsed;
  return dataRows.map((cells, rowIndex) => {
    const row = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? "";
    });
    row.__rowNumber = rowIndex + 2;
    row.__file = filePath;
    return row;
  });
}

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function sum(rows, predicate) {
  return rows.filter(predicate).reduce((total, row) => total + Number(row.amount_usd || 0), 0);
}

function main() {
  const templateFiles = fs.readdirSync(templateDir).filter((file) => file.endsWith(".csv")).sort();
  const allTemplateRows = [];
  const rowCounts = {};
  for (const file of templateFiles) {
    const filePath = path.join(templateDir, file);
    const rows = readCsv(filePath);
    rowCounts[file] = rows.length;
    allTemplateRows.push(...rows);
    for (const row of rows) {
      for (const [key, value] of Object.entries(row)) {
        if (key.startsWith("__")) continue;
        assert(value !== "", `${file}:${row.__rowNumber} has a blank value in ${key}`);
      }
      assert(row.tenant_key === TENANT_KEY, `${file}:${row.__rowNumber} has wrong tenant_key ${row.tenant_key}`);
      assert(row.client_display_name === CLIENT, `${file}:${row.__rowNumber} has wrong client_display_name ${row.client_display_name}`);
    }
  }

  const allText = allTemplateRows.map((row) => Object.values(row).join(" ")).join("\n");
  assert(!allText.includes("Industrial Demo"), "legacy Industrial Demo label still appears in Lakeshore v6 templates");

  const hierarchy = readCsv(path.join(holdcoDir, "H01_entity_hierarchy.csv"));
  const metricMap = readCsv(path.join(holdcoDir, "H02_dashboard_metric_map.csv"));
  assert(hierarchy.length === 8, `expected 8 holdco entities, found ${hierarchy.length}`);
  assert(
    PORTFOLIO_COMPANIES.every((name) => hierarchy.some((row) => row.entity_name === name && row.entity_type === "portfolio_company")),
    "not every portfolio company is present in H01_entity_hierarchy.csv",
  );
  assert(
    hierarchy.some((row) => row.entity_name === "Corporate Shared Services" && row.entity_type === "corporate_shared_services"),
    "Corporate Shared Services entity is missing",
  );
  assert(
    hierarchy.some((row) => row.entity_name === "Corporate Innovation IT and Data AI" && row.entity_type === "corporate_innovation_it"),
    "Corporate Innovation IT and Data AI entity is missing",
  );
  const holdco = hierarchy.find((row) => row.entity_id === "LH-HOLDCO");
  assert(Number(holdco?.revenue_usd) === 0, "Lakeshore Holdings must not carry direct operating revenue");
  assert(Number(holdco?.employees) === EXPECTED_EMPLOYEES, "Lakeshore Holdings employee rollup is wrong");
  const namedOpcoRevenue = hierarchy
    .filter((row) => row.entity_type === "portfolio_company")
    .reduce((total, row) => total + Number(row.revenue_usd || 0), 0);
  assert(namedOpcoRevenue === EXPECTED_NAMED_OPCO_REVENUE, `named opco revenue should be ${EXPECTED_NAMED_OPCO_REVENUE}, found ${namedOpcoRevenue}`);
  const allocationBucket = hierarchy.find((row) => row.entity_id === "LH-OPCO-ALLOC");
  assert(Number(allocationBucket?.revenue_usd) === EXPECTED_OPCO_REVENUE_TO_ALLOCATE, "opco revenue allocation bucket is wrong");
  assert(namedOpcoRevenue + Number(allocationBucket?.revenue_usd || 0) === EXPECTED_PORTFOLIO_REVENUE, "portfolio-company revenue rollup is wrong");

  const orgRows = readCsv(path.join(templateDir, "V6_03_org_ownership.csv"));
  for (const role of ["Group CIO", "Northline CIO", "Brightmark CIO", "Forge & Field CIO", "Great Lakes Pantry IT Director", "VP Corporate Innovation IT and Data AI"]) {
    assert(orgRows.some((row) => row.leader_role === role), `missing IT leadership role: ${role}`);
  }

  const systems = readCsv(path.join(templateDir, "V6_05_applications_systems.csv"));
  for (const owner of ["Northline CIO", "Brightmark CIO", "Forge & Field CIO", "Great Lakes Pantry IT Director", "VP Corporate Platforms", "VP Corporate Innovation IT and Data AI"]) {
    assert(systems.some((row) => row.system_owner === owner), `missing system ownership for ${owner}`);
  }

  const spendRows = readCsv(path.join(templateDir, "V6_08_spend_value.csv"));
  const directBudget = sum(spendRows, (row) => row.amount_type === "annual_it_budget");
  const allocationView = sum(spendRows, (row) => row.amount_type === "allocated_shared_services_cost");
  const innovationComponent = sum(spendRows, (row) => row.amount_type === "component_budget");
  const expectedValue = sum(spendRows, (row) => row.amount_type === "expected_value");
  const measuredValue = sum(spendRows, (row) => row.amount_type === "measured_value");
  assert(directBudget === EXPECTED_DIRECT_IT_BUDGET, `direct IT budget expected ${EXPECTED_DIRECT_IT_BUDGET}, found ${directBudget}`);
  assert(allocationView === EXPECTED_ALLOCATION_VIEW, `allocation view expected ${EXPECTED_ALLOCATION_VIEW}, found ${allocationView}`);
  assert(innovationComponent === EXPECTED_INNOVATION_COMPONENT, `innovation component expected ${EXPECTED_INNOVATION_COMPONENT}, found ${innovationComponent}`);
  assert(expectedValue > measuredValue, "expected value should exceed measured value for Tower value-gap proof");

  const amountTypes = new Set(spendRows.map((row) => row.amount_type));
  for (const amountType of [
    "annual_it_budget",
    "run_budget",
    "change_budget",
    "actual_spend_ytd",
    "allocated_shared_services_cost",
    "component_budget",
    "program_committed_budget",
    "program_spend_to_date",
    "expected_value",
    "measured_value",
  ]) {
    assert(amountTypes.has(amountType), `missing amount_type ${amountType}`);
  }

  const programs = readCsv(path.join(templateDir, "V6_09_programs_initiatives.csv"));
  assert(programs.length >= 15, `expected at least 15 program rows, found ${programs.length}`);
  for (const opco of ["Northline", "Brightmark", "Forge & Field", "Great Lakes Pantry"]) {
    assert(programs.some((row) => row.record_name.includes(opco)), `missing program rows for ${opco}`);
  }

  const aiRows = readCsv(path.join(templateDir, "V6_10_ai_initiatives.csv"));
  assert(aiRows.length >= 8, `expected at least 8 AI initiative rows, found ${aiRows.length}`);

  const relationships = readCsv(path.join(templateDir, "V6_12_relationships.csv"));
  assert(relationships.length >= 50, `expected at least 50 relationship rows, found ${relationships.length}`);

  const directMetric = metricMap.find((row) => row.metric_key === "total_direct_it_budget_fy26");
  assert(directMetric, "missing total_direct_it_budget_fy26 in H02_dashboard_metric_map.csv");
  assert(Number(directMetric.value_usd) === EXPECTED_DIRECT_IT_BUDGET, "H02 total_direct_it_budget_fy26 does not match spend rows");

  const proof = {
    tenantKey: TENANT_KEY,
    clientDisplayName: CLIENT,
    rowCounts,
    holdcoEntityCount: hierarchy.length,
    portfolioCompanies: PORTFOLIO_COMPANIES,
    directItBudgetUsd: directBudget,
    allocatedSharedServicesViewUsd: allocationView,
    innovationItDataAiComponentUsd: innovationComponent,
    programCommittedBudgetUsd: sum(spendRows, (row) => row.amount_type === "program_committed_budget"),
    programSpendToDateUsd: sum(spendRows, (row) => row.amount_type === "program_spend_to_date"),
    expectedValueUsd: expectedValue,
    measuredValueUsd: measuredValue,
    valueGapUsd: expectedValue - measuredValue,
    relationshipRows: relationships.length,
    validation: "passed",
  };

  fs.mkdirSync(path.join(repoRoot, "out"), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, "out/lakeshore-v6-holdco-validation.json"), `${JSON.stringify(proof, null, 2)}\n`);
  console.log(JSON.stringify(proof, null, 2));
}

main();
