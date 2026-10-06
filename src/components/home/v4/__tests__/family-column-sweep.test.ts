/**
 * Every chapter's tables, built from the intake's REAL column set, checked for columns that say
 * nothing while looking like a result.
 *
 * Three separate defects of one shape reached the page before this existed: an organisation table
 * printing a headcount of zero against every level, a measures table reporting "0 of the 0 blocked
 * claims" over an empty body, and five money columns rendered as a dash in every cell. Each was
 * found by hand, one at a time, and each was the same mistake -- a column built from a field the
 * intake never collected.
 *
 * They share a direction, too. Absence always renders as the reassuring answer: nobody blocked,
 * nothing regulatory, no auto-renewals, no cost. So this reads the intake CSVs, builds projection
 * rows from them, runs the real bundle builder and the real chapter depth, and fails on any table
 * that has no rows, an all-dash column, or a count column that is zero everywhere.
 *
 * It uses the CSVs rather than a fixture on purpose: a fixture is written by whoever writes the
 * test, and would have the columns they remembered.
 */
import fs from "node:fs";
import path from "node:path";

import {
  buildHomeReviewBundleFromEclProjectionRows,
  type HomeProjectionRow,
} from "@/lib/home/preview/ecl-projection-bundle";
import { getHomeReviewBundle } from "@/lib/home/preview/golden-snapshot";
import type { ChapterId } from "@/lib/home/preview/types";
import { chapterDepth, type EstateRecordTypes } from "../chapter-page-content";
import type { EstateRow } from "../page-tables";

const INTAKE = path.resolve(
  __dirname,
  "../../../../../datasets/tenant-inputs/active/skyharbor-air/current",
);

/** file, the page key the loader writes it under, and the row type within it. */
const FAMILIES: ReadonlyArray<readonly [string, string, string]> = [
  ["04_applications_systems.csv", "applications_systems", "application"],
  ["07_vendors_contracts.csv", "vendor_contracts", "contract"],
  [
    "06_infrastructure_platforms.csv",
    "infrastructure_platforms",
    "infrastructure",
  ],
  ["05_data_assets_integrations.csv", "current_state_data_flow", "data_flow"],
  ["14_metrics_outcomes.csv", "metrics_outcomes", "metric"],
  ["11_risks_controls.csv", "risks_controls", "risk"],
  ["09_programs_initiatives.csv", "programs_initiatives", "program"],
  ["02_org_ownership.csv", "org_ownership", "org"],
  ["10_ai_automation_use_cases.csv", "ai_use_cases", "ai"],
];

const CHAPTERS: ChapterId[] = [
  "technology_data",
  "how_we_operate",
  "what_needs_attention",
  "performance_value",
  "strategy_value_creation",
];

function parseCsv(text: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char !== '"') field += char;
      else if (text[i + 1] === '"') ((field += '"'), (i += 1));
      else quoted = false;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") (current.push(field), (field = ""));
    else if (char === "\n")
      (current.push(field), rows.push(current), (current = []), (field = ""));
    else if (char !== "\r") field += char;
  }
  if (field || current.length > 0) (current.push(field), rows.push(current));
  const [head, ...body] = rows;
  return body
    .filter((row) => row.some((value) => value.trim()))
    .map((row) =>
      Object.fromEntries(head.map((key, i) => [key, row[i] ?? ""])),
    );
}

function estateFromIntake(): EstateRecordTypes {
  const projectionRows: HomeProjectionRow[] = [];
  for (const [file, pageKey, rowType] of FAMILIES) {
    const filePath = path.join(INTAKE, file);
    if (!fs.existsSync(filePath)) continue;
    parseCsv(fs.readFileSync(filePath, "utf8")).forEach((payload, index) => {
      projectionRows.push({
        page_key: pageKey,
        row_key: `${pageKey}-${index}`,
        row_type: rowType,
        title: Object.values(payload)[1] ?? "",
        summary: null,
        display_payload_json: payload,
      } as HomeProjectionRow);
    });
  }
  const base = getHomeReviewBundle("skyharbor-air");
  if (!base) throw new Error("stored copy missing");
  const bundle = buildHomeReviewBundleFromEclProjectionRows(
    base,
    projectionRows,
    "column-sweep",
  );
  const byType = new Map(
    (
      (
        bundle as unknown as {
          technologyEstate?: {
            recordTypes: Array<{ objectType: string; rows: unknown[] }>;
          };
        }
      ).technologyEstate?.recordTypes ?? []
    ).map((record) => [record.objectType, record.rows]),
  );
  const rowsOf = (type: string) =>
    (byType.get(type) ?? []) as EstateRecordTypes["applications"];
  return {
    applications: rowsOf("application_system"),
    vendors: rowsOf("vendor_contract"),
    infrastructure: rowsOf("infrastructure_platform"),
    data: rowsOf("data_asset_or_integration"),
    metrics: rowsOf("metric_outcome"),
    risks: rowsOf("risk_control"),
    programs: rowsOf("program_initiative"),
    organization: rowsOf("organization_ownership"),
    ai: rowsOf("ai_use_case"),
  };
}

const estate = estateFromIntake();

/**
 * The fields the chapter tables are built from, by family.
 *
 * These are asserted because a sweep is only as wide as the record it reads, and a thinner record
 * makes every check below pass by having less to check. I ran this sweep against a locally stripped
 * copy of the intake -- one missing headcount, budget authority, claim readiness, regulatory driver
 * and auto-renew -- and read the result as a statement about the product. It was a statement about
 * my own working copy.
 */
const REQUIRED_FIELDS: Partial<Record<keyof EstateRecordTypes, string[]>> = {
  organization: [
    "headcount",
    "budgetAuthorityUsd",
    "ownedSystems",
    "decisionRights",
  ],
  metrics: ["baselineValue", "targetValue", "actualValue", "claimReadiness"],
  risks: ["severity", "controlStatus", "regulatoryDriver"],
  // Not annualSpendUsd or commercialModel. The contract mapper reads a different vocabulary from
  // the one the intake writes -- `annualized_value_usd` against the intake's `annual_spend_usd` --
  // so this path, which feeds intake columns straight in, cannot see them. That is a limit of this
  // sweep, recorded here rather than papered over with an alias invented in a test.
  vendors: ["riskRating", "autoRenewFlag"],
  applications: ["lifecycleState", "businessFunction"],
};

describe("the intake this sweep reads", () => {
  it("carries every family, so a silent parse failure cannot pass the sweep", () => {
    // Without this, a wrong path or a renamed file empties every family and every check below
    // trivially holds -- the sweep would report clean because it examined nothing.
    for (const family of Object.keys(estate) as Array<
      keyof EstateRecordTypes
    >) {
      if (family === "asOf") continue;
      expect(estate[family]?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("still declares the fields these tables are built from", () => {
    // A stripped intake does not fail the sweep -- it shrinks it, and the sweep then reports clean
    // because the columns it would have caught were never drawn. This is what makes the sweep's
    // silence mean something.
    const missing: string[] = [];
    for (const [family, fields] of Object.entries(REQUIRED_FIELDS)) {
      // `asOf` is a string on the same record; the cast below narrows to the row arrays only.
      const rows = (estate[family as keyof EstateRecordTypes] ??
        []) as EstateRow[];
      for (const field of fields) {
        if (!rows.some((row) => String(row[field] ?? "").trim())) {
          missing.push(`${family}.${field}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

describe.each(CHAPTERS)("%s", (chapter) => {
  const depth = chapterDepth(chapter, estate);

  it("draws at least one table", () => {
    expect(depth.tables.length).toBeGreaterThan(0);
  });

  it("draws no table with an empty body", () => {
    // An empty table with a total of zero reads as a result. It means the record does not carry the
    // column the table groups on, and that belongs in the unsupported list instead.
    expect(depth.tables.filter((table) => table.rows.length === 0)).toEqual([]);
  });

  it("draws no column that is absent in every row", () => {
    const offenders: string[] = [];
    for (const table of depth.tables) {
      for (let column = 1; column < table.columns.length; column += 1) {
        const cells = table.rows.map((row) => String(row[column] ?? ""));
        if (cells.length > 1 && cells.every((cell) => cell === "—")) {
          offenders.push(
            `${table.caption} / ${table.columns[column]} (all absent)`,
          );
        }
        if (cells.length > 1 && cells.every((cell) => cell === "0")) {
          offenders.push(
            `${table.caption} / ${table.columns[column]} (all zero)`,
          );
        }
      }
    }
    // An all-zero count column is only allowed to reach here when the field behind it is declared
    // somewhere; countedWhereDeclared turns the other case into an absent mark, which is dropped.
    expect(offenders).toEqual([]);
  });

  it("writes no note that counts nothing against nothing", () => {
    const vacuous = depth.tables
      .filter(
        (table) => table.note && /\b0 of the 0\b|\ball 0\b/.test(table.note),
      )
      .map((table) => table.caption);
    expect(vacuous).toEqual([]);
  });
});
