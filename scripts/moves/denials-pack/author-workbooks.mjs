// Lab authoring only. Run a copy with the bundled artifact-tool dependencies.
import fs from "node:fs/promises";
import path from "node:path";
import { Workbook, SpreadsheetFile } from "@oai/artifact-tool";
import JSZip from "jszip";
const out = path.resolve(process.argv[2]);
const qa = path.resolve(process.argv[3]);
const s = JSON.parse(
  await fs.readFile(path.join(out, "scenario.json"), "utf8"),
);
await fs.mkdir(qa, { recursive: true });
const col = (n) => {
  let t = "";
  for (let i = n + 1; i > 0; i = Math.floor((i - 1) / 26))
    t = String.fromCharCode(65 + ((i - 1) % 26)) + t;
  return t;
};
const money = '"$"#,##0;("$"#,##0);"-"';
const body = { name: "Arial", size: 10, color: "#17283C" };
function sheet(w, name, title, headers, rows, widths) {
  const sh = w.worksheets.add(name);
  sh.showGridLines = false;
  sh.getRange(
    `A1:${col(headers.length - 1)}${Math.max(6, rows.length + 5)}`,
  ).format.font = body;
  sh.getRange("A2").values = [[title]];
  sh.getRange("A2").format.font = {
    ...body,
    size: 14,
    bold: true,
    color: "#000000",
  };
  sh.getRange("A3").values = [[s.notice]];
  sh.getRange("A3").format.font = {
    ...body,
    size: 10,
    italic: true,
    color: "#5D6877",
  };
  sh.getRange(`A5:${col(headers.length - 1)}5`).values = [headers];
  sh.getRange(`A5:${col(headers.length - 1)}5`).format = {
    fill: "#17283C",
    font: { ...body, bold: true, color: "#FFFFFF" },
    rowHeight: 32,
    wrapText: true,
    verticalAlignment: "center",
    horizontalAlignment: "center",
  };
  if (rows.length)
    sh.getRange(`A6:${col(headers.length - 1)}${rows.length + 5}`).values =
      rows;
  const data = sh.getRange(
    `A6:${col(headers.length - 1)}${Math.max(6, rows.length + 5)}`,
  );
  data.format.verticalAlignment = "center";
  data.format.rowHeight = 24;
  data.format.numberFormat = "#,#0.00";
  headers.forEach(
    (_, i) =>
      (sh.getRange(
        `${col(i)}1:${col(i)}${rows.length + 5}`,
      ).format.columnWidth = widths[i] ?? 18),
  );
  if (rows.length > 20) sh.freezePanes.freezeRows(5);
  return sh;
}
async function save(w, file, ranges) {
  w.recalculate();
  const errors = await w.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!",
    options: { useRegex: true, maxResults: 10 },
    summary: "Final formula error scan",
  });
  await fs.writeFile(
    path.join(qa, file + ".inspection.json"),
    JSON.stringify(
      {
        errors: errors.ndjson,
        worksheets: w.worksheets.items.map((x) => x.name),
      },
      null,
      2,
    ),
  );
  for (const [sheetName, range] of ranges) {
    const image = await w.render({
      sheetName,
      range,
      scale: 1.5,
      format: "png",
    });
    await fs.writeFile(
      path.join(qa, file + "-" + sheetName + ".png"),
      new Uint8Array(await image.arrayBuffer()),
    );
  }
  const bytes = await SpreadsheetFile.exportXlsx(w);
  await bytes.save(path.join(out, file));
  // Keep cell data, styles and formulas; use unprefixed spreadsheet tags for
  // compatibility with the product's ExcelJS upload reader.
  const zip = await JSZip.loadAsync(await fs.readFile(path.join(out, file)));
  for (const name of Object.keys(zip.files).filter((n) => n.endsWith(".xml"))) {
    const xml = await zip.file(name).async("string");
    zip.file(
      name,
      xml.replace(/<(\/?)(?:x:)/g, "<$1").replace(/xmlns:x=/g, "xmlns="),
    );
  }
  await fs.writeFile(
    path.join(out, file),
    await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }),
  );
  console.log(
    JSON.stringify({ file, sheets: ranges.length, errorScan: errors.ndjson }),
  );
}
{
  const w = Workbook.create();
  const sh = sheet(
    w,
    "Summary",
    "Initial claim denials by submission quarter",
    [
      "Quarter",
      "Claims submitted",
      "Initial denials",
      "Denial rate",
      "Gross charges USD",
      "Allowed amount USD",
      "Denied allowed USD",
      "Recovered cash USD",
      "Write offs USD",
      "Adjustments USD",
      "Rework hours",
      "Preventable denials",
    ],
    s.quarterly.map((q) => [
      q.quarter,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ]),
    [19, 17, 17, 15, 21, 21, 21, 21, 21, 21, 18, 20],
  );
  const cs = sheet(
    w,
    "Claim cohorts",
    "Original submission cohorts",
    [
      "Cohort ID",
      "Quarter",
      "Facility ID",
      "Payer ID",
      "Service ID",
      "Claims submitted",
      "Gross charges USD",
      "Allowed amount USD",
    ],
    s.claims.map((c) => [
      c.id,
      c.quarter,
      c.facility,
      c.payer,
      c.service,
      c.claims,
      c.grossCharges,
      c.allowedAmount,
    ]),
    [43, 15, 14, 14, 14, 18, 22, 22],
  );
  const ds = sheet(
    w,
    "Denial cohorts",
    "First denials and final disposition",
    [
      "Denial cohort ID",
      "Submission cohort ID",
      "Quarter",
      "Facility ID",
      "Payer ID",
      "Service ID",
      "Reason code",
      "Initial denials",
      "Denied allowed USD",
      "Recovered cash USD",
      "Write offs USD",
      "Adjustments USD",
      "Rework hours",
      "Preventable denials",
    ],
    s.denials.map((d) => [
      d.id,
      d.cohortId,
      d.quarter,
      d.facility,
      d.payer,
      d.service,
      d.reason,
      d.denials,
      d.deniedAllowed,
      d.recoveries,
      d.writeOffs,
      d.adjustments,
      d.reworkHours,
      d.preventableDenials,
    ]),
    [49, 43, 15, 14, 14, 14, 14, 19, 23, 22, 22, 22, 19, 21],
  );
  cs.getRange(`F6:F${s.claims.length + 5}`).setNumberFormat("#,##0");
  cs.getRange(`G6:H${s.claims.length + 5}`).setNumberFormat(money);
  ds.getRange(`H6:H${s.denials.length + 5}`).setNumberFormat("#,##0");
  ds.getRange(`I6:L${s.denials.length + 5}`).setNumberFormat(money);
  ds.getRange(`M6:M${s.denials.length + 5}`).setNumberFormat("#,##0.00");
  ds.getRange(`N6:N${s.denials.length + 5}`).setNumberFormat("#,##0");
  const cend = s.claims.length + 5,
    dend = s.denials.length + 5;
  for (let i = 0; i < 8; i++) {
    const r = i + 6;
    sh.getRange(`B${r}:L${r}`).formulas = [
      [
        `=SUMIFS('Claim cohorts'!$F$6:$F$${cend},'Claim cohorts'!$B$6:$B$${cend},$A${r})`,
        `=SUMIFS('Denial cohorts'!$H$6:$H$${dend},'Denial cohorts'!$C$6:$C$${dend},$A${r})`,
        `=C${r}/B${r}`,
        ...["G", "H"].map(
          (c) =>
            `=SUMIFS('Claim cohorts'!$${c}$6:$${c}$${cend},'Claim cohorts'!$B$6:$B$${cend},$A${r})`,
        ),
        ...["I", "J", "K", "L", "M", "N"].map(
          (c) =>
            `=SUMIFS('Denial cohorts'!$${c}$6:$${c}$${dend},'Denial cohorts'!$C$6:$C$${dend},$A${r})`,
        ),
      ],
    ];
  }
  sh.getRange("B6:C13").setNumberFormat("#,##0");
  sh.getRange("D6:D13").setNumberFormat("0.0%");
  sh.getRange("E6:J13").setNumberFormat(money);
  sh.getRange("K6:K13").setNumberFormat("#,##0.00");
  sh.getRange("L6:L13").setNumberFormat("#,##0");
  sh.getRange("A15").values = [["Trailing year"]];
  sh.getRange("B15:L15").formulas = [
    [
      "=SUM(B10:B13)",
      "=SUM(C10:C13)",
      "=C15/B15",
      ..."EFGHIJKL".split("").map((c) => `=SUM(${c}10:${c}13)`),
    ],
  ];
  sh.getRange("B15:C15").setNumberFormat("#,##0");
  sh.getRange("D15").setNumberFormat("0.0%");
  sh.getRange("E15:J15").setNumberFormat(money);
  sh.getRange("K15").setNumberFormat("#,##0.00");
  sh.getRange("L15").setNumberFormat("#,##0");
  sh.getRange("A15:L15").format.font = { ...body, bold: true };
  sh.getRange("A17").values = [
    [
      "One denominator per original submission; first denial only. Recoveries are collected allowed revenue.",
    ],
  ];
  sh.getRange("A18").values = [
    [
      "Write-offs and adjustments are disjoint; corrected resubmissions do not add claims. All cohorts are invented and mature.",
    ],
  ];
  sh.getRange("A19").values = [
    [
      "Detailed cohort sheets use facility, payer, service and reason IDs defined in the use-case brief and taxonomy.",
    ],
  ];
  await save(w, "02-denials-baseline.xlsx", [
    ["Summary", "A1:L19"],
    ["Claim cohorts", "A1:H12"],
    ["Denial cohorts", "A1:N12"],
  ]);
  // Verify a changed original submission flows into summary; restore before delivery.
  const before = sh.getRange("B6").values[0][0],
    old = cs.getRange("F6").values[0][0];
  cs.getRange("F6").values = [[old + 7]];
  w.recalculate();
  if (sh.getRange("B6").values[0][0] !== before + 7)
    throw new Error("summary_input_change_did_not_recalculate");
  cs.getRange("F6").values = [[old]];
  w.recalculate();
}
{
  const w = Workbook.create();
  const rows = s.reasons.map((r) => [
    r.id,
    r.group,
    r.definition,
    r.owner,
    r.preventable,
    r.policy,
    "First reviewed cause per initial denial; no double-counting",
    r.group === "Documentation"
      ? "Missing attachment remains open until reviewer resolves it"
      : "Administrative source-team check before submission",
  ]);
  const sh = sheet(
    w,
    "Taxonomy",
    "Invented denial reason taxonomy",
    [
      "Reason code",
      "Cause group",
      "Definition",
      "Owning role",
      "Preventability hypothesis",
      "Policy ID",
      "Counting rule",
      "Review boundary",
    ],
    rows,
    [17, 20, 54, 30, 22, 18, 48, 52],
  );
  sh.getRange("E6:E9").setNumberFormat("0.0%");
  sh.getRange("C6:D9").format.wrapText = true;
  sh.getRange("G6:H9").format.wrapText = true;
  sh.getRange("A6:H9").format.rowHeight = 62;
  sh.getRange("A12").values = [
    [
      "These codes and policies are fictional administrative examples, not payer or clinical standards.",
    ],
  ];
  await save(w, "03-denial-reason-taxonomy.xlsx", [["Taxonomy", "A1:H12"]]);
}
{
  const w = Workbook.create();
  const rows = s.sources.map((r) => [
    r.id,
    r.name,
    r.owner,
    r.refresh,
    r.access,
    r.issue,
    r.tables,
    r.policy,
  ]);
  const sh = sheet(
    w,
    "Inventory",
    "Invented source inventory and access gaps",
    [
      "Source ID",
      "System",
      "Owner role",
      "Refresh",
      "Access condition",
      "Known data quality issue",
      "Tables in scope",
      "Policy link",
    ],
    rows,
    [16, 43, 32, 30, 46, 51, 19, 18],
  );
  sh.getRange("B6:F11").format.wrapText = true;
  sh.getRange("A6:H11").format.rowHeight = 66;
  sh.getRange("G6:G11").setNumberFormat("#,##0");
  sh.getRange("A13").values = [
    [
      "Access descriptions are proposed conditions; no live entitlement, extract or integration is asserted.",
    ],
  ];
  const bs = sheet(
    w,
    "Planning benchmarks",
    "Invented unit-hour proposals for separate owner review",
    ["Proposal key", "Value", "Unit", "Owner role", "Basis"],
    [
      ...[36, 8, 28, 24, 3, 2].map((v, i) => [
        `unit_${["source", "table", "entity", "view", "design", "validation"][i]}`,
        v,
        "hours per component",
        "Delivery architecture lead",
        "Invented benchmark; not approved and not a delivery rate",
      ]),
      [
        "friction",
        1.18,
        "multiplier",
        "Delivery architecture lead",
        "Invented planning hypothesis; no approval",
      ],
      [
        "productive_share",
        0.68,
        "share",
        "Delivery architecture lead",
        "Invented planning hypothesis; no approval",
      ],
      [
        "weekly_hours",
        40,
        "hours per FTE-week",
        "Delivery architecture lead",
        "Invented planning hypothesis; no approval",
      ],
    ],
    [28, 16, 30, 35, 65],
  );
  bs.getRange("C6:E14").format.wrapText = true;
  bs.getRange("A6:E14").format.rowHeight = 42;
  bs.getRange("B6:B11").setNumberFormat("#,##0");
  bs.getRange("B13").setNumberFormat("0.0%");
  bs.getRange("B14").setNumberFormat("#,##0");
  bs.getRange("A17").values = [
    [
      "All delivery rates come from pricing-engine-v1 and a reviewed pod. This sheet contains no rates or approval.",
    ],
  ];
  await save(w, "04-source-system-inventory.xlsx", [
    ["Inventory", "A1:H13"],
    ["Planning benchmarks", "A1:E17"],
  ]);
}
{
  const w = Workbook.create();
  const sh = sheet(
    w,
    "Finance",
    "Synthetic finance baseline and planning hypotheses",
    ["Measure", "Value", "Unit", "Basis"],
    [
      [
        "Original claims trailing year",
        s.trailingYear.claims,
        "claims",
        "Cohort baseline, last four submission quarters",
      ],
      [
        "Initial denials trailing year",
        s.trailingYear.denials,
        "denials",
        "First denial only, original submissions",
      ],
      [
        "Write offs trailing year",
        null,
        "USD",
        "Denial-quarter schedule; net allowed exposure",
      ],
      [
        "Recovered cash trailing year",
        null,
        "USD",
        "Collected receipts from previously denied allowed amounts",
      ],
      ["Rework hours trailing year", null, "hours", "Denial-quarter schedule"],
      [
        "Loaded administrative labour cost",
        s.assumptions.loadedAdminHourlyCost,
        "USD per hour",
        "Invented internal administrative expense; NOT a ROM delivery rate",
      ],
      [
        "Rework labour expense",
        null,
        "USD",
        "Rework hours times loaded administrative labour cost",
      ],
      [
        "Collection vendor annual spend",
        s.assumptions.vendorAnnualSpend,
        "USD",
        "Invented fixed contracted expense; no release proposed",
      ],
      [
        "Annual discount rate",
        s.assumptions.annualDiscountRate,
        "annual fraction",
        "Invented finance planning hypothesis",
      ],
      [
        "Days in accounts receivable",
        s.assumptions.currentDaysAR,
        "days",
        "Invented current collection observation",
      ],
      [
        "Target days in accounts receivable",
        s.assumptions.targetDaysAR,
        "days",
        "Proposed hypothesis; no realized cash claim",
      ],
      [
        "Rework hours per denial",
        s.assumptions.reworkHoursPerDenial,
        "hours",
        "Invented administrative queue observation",
      ],
      [
        "Write off prevention share",
        s.assumptions.preventionShare,
        "fraction",
        "Proposed hypothesis, owner review required",
      ],
      [
        "Attribution",
        s.assumptions.attribution,
        "fraction",
        "Proposed hypothesis, owner review required",
      ],
      [
        "Probability",
        s.assumptions.probability,
        "fraction",
        "Proposed hypothesis, owner review required",
      ],
      [
        "Rework reduction share",
        s.assumptions.reworkReductionShare,
        "fraction",
        "Proposed capacity hypothesis",
      ],
      [
        "Benefit start",
        s.assumptions.benefitStartMonth,
        "horizon month",
        "Proposed ramp begins after discovery and readiness",
      ],
      [
        "Ramp duration",
        s.assumptions.rampMonths,
        "months",
        "Proposed linear ramp",
      ],
      [
        "Conservative collection lag",
        s.assumptions.currentPaymentLagMonths,
        "whole months",
        "Engine cannot price an eight-day difference as a full month",
      ],
      [
        "Program budget ceiling",
        s.assumptions.budgetCeiling,
        "USD",
        "Ceiling only; investment cost waits for approved ROM",
      ],
      [
        "Rework cash value without release",
        0,
        "USD",
        "No role or contract release exists",
      ],
      [
        "Target rework hours per denial",
        null,
        "hours",
        "Baseline times one minus proposed reduction",
      ],
      [
        "Net receipt conversion",
        1,
        "USD per USD",
        "Write-offs are already net allowed dollars; not a gross-charge margin",
      ],
      [
        "Starting prevention share",
        0,
        "fraction",
        "Proposed comparator; no existing prevention benefit credited",
      ],
      [
        "Write-off share of denied allowed",
        s.assumptions.writeOffShare,
        "fraction",
        "Mature denied allowed disposition, separate from adjustments",
      ],
      [
        "Recovery share of denied allowed",
        s.assumptions.recoveryShare,
        "fraction",
        "Existing recovered cash; not incremental benefit",
      ],
      [
        "Adjustment share of denied allowed",
        s.assumptions.adjustmentShare,
        "fraction",
        "Contractual adjustments; not preventable cash value",
      ],
    ],
    [47, 24, 27, 83],
  );
  const qs = sheet(
    w,
    "Quarter finance",
    "Final denial dispositions by cohort quarter",
    [
      "Quarter",
      "Write offs USD",
      "Recovered cash USD",
      "Rework hours",
      "Labour expense USD",
      "Vendor spend USD",
      "Net revenue impact USD",
    ],
    s.quarterly.map((q) => [
      q.quarter,
      q.writeOffs,
      q.recoveries,
      q.reworkHours,
      null,
      s.assumptions.vendorAnnualSpend / 4,
      null,
    ]),
    [20, 24, 24, 23, 25, 25, 29],
  );
  for (let i = 0; i < 8; i++) {
    const r = i + 6;
    qs.getRange(`E${r}`).formulas = [[`=D${r}*'Finance'!$B$11`]];
    qs.getRange(`G${r}`).formulas = [[`=-B${r}`]];
  }
  sh.getRange("B8").formulas = [["=SUM('Quarter finance'!B10:B13)"]];
  sh.getRange("B9").formulas = [["=SUM('Quarter finance'!C10:C13)"]];
  sh.getRange("B10").formulas = [["=SUM('Quarter finance'!D10:D13)"]];
  sh.getRange("B12").formulas = [["=B10*B11"]];
  sh.getRange("B27").formulas = [["=B17*(1-B21)"]];
  sh.getRange("B6:B32").setNumberFormat("#,##0.00");
  for (const r of [8, 9, 11, 12, 13, 25, 26])
    sh.getRange(`B${r}`).setNumberFormat(money);
  for (const r of [6, 7, 15, 16, 22, 23, 24])
    sh.getRange(`B${r}`).setNumberFormat("#,##0");
  for (const r of [14, 18, 19, 20, 21, 29, 30, 31, 32])
    sh.getRange(`B${r}`).setNumberFormat("0.0%");
  qs.getRange("B6:C13").setNumberFormat(money);
  qs.getRange("D6:D13").setNumberFormat("#,##0.00");
  qs.getRange("E6:G13").setNumberFormat(money);
  sh.getRange("B6:B32").format.font = { ...body, color: "#0000FF" };
  for (const r of [8, 9, 10])
    sh.getRange(`B${r}`).format.font = { ...body, color: "#008000" };
  sh.getRange("B27").format.font = { ...body, color: "#000000" };
  sh.getRange("B12").format.font = { ...body, color: "#000000" };
  qs.getRange("B6:D13").format.font = { ...body, color: "#0000FF" };
  qs.getRange("E6:E13").format.font = { ...body, color: "#008000" };
  qs.getRange("G6:G13").format.font = { ...body, color: "#000000" };
  sh.getRange("A35").values = [
    [
      "Prevented write-offs count only when incremental cash is collected; existing recoveries are not counted again.",
    ],
  ];
  sh.getRange("A36").values = [
    [
      "No NPV, ROI or approved investment is asserted before the owner-approved ROM and governed value-engine evaluation.",
    ],
  ];
  await save(w, "06-finance-baseline.xlsx", [
    ["Finance", "A1:D36"],
    ["Quarter finance", "A1:G15"],
  ]);
}
