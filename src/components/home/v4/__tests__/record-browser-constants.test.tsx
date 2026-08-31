/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import fs from "node:fs"; import path from "node:path";
import { render } from "@testing-library/react";
import type { TechRecordType } from "@/lib/home/preview/types";
import { RecordBrowser } from "../RecordBrowser";

const snapshot = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "src/lib/home/preview/golden-snapshots/meridian-health.json"), "utf8"),
);
const applications: TechRecordType = snapshot.technologyEstate.recordTypes.find(
  (r: { objectType: string }) => r.objectType === "application_system",
);

describe("a column that never varies is reported as a default, not a result", () => {
  it("says nothing when every column varies", () => {
    const varied: TechRecordType = {
      ...applications,
      columns: ["systemName", "criticality"],
      rows: [
        { systemName: "A", criticality: "tier1" },
        { systemName: "B", criticality: "tier2" },
      ],
    };
    render(<RecordBrowser recordType={varied} />);
    expect(document.querySelector("[data-record-constant-columns]")).not.toBeInTheDocument();
  });

  // The succession-risk shape: a column filled on every row with one value reads as a clean result
  // and is a form nobody completed.
  it("names the column, its value and the row count", () => {
    const constant: TechRecordType = {
      ...applications,
      columns: ["systemName", "successionRisk"],
      rows: [
        { systemName: "A", successionRisk: "low" },
        { systemName: "B", successionRisk: "low" },
        { systemName: "C", successionRisk: "low" },
      ],
    };
    render(<RecordBrowser recordType={constant} />);
    const band = document.querySelector("[data-record-constant-columns]");
    expect(band).toBeInTheDocument();
    expect(band?.getAttribute("data-record-constant-columns")).toBe("1");
    expect(band?.textContent).toMatch(/successionRisk reads "low" on all 3 rows/);
    expect(band?.textContent).toMatch(/default rather than an assessment/);
  });

  it("does not flag a column that is simply empty", () => {
    const empty: TechRecordType = {
      ...applications,
      columns: ["systemName", "notes"],
      rows: [{ systemName: "A", notes: "" }, { systemName: "B", notes: "" }],
    };
    render(<RecordBrowser recordType={empty} />);
    expect(document.querySelector("[data-record-constant-columns]")).not.toBeInTheDocument();
  });
});
