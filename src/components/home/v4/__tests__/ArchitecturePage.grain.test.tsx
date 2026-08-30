/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";

import fs from "node:fs";
import path from "node:path";

import { fireEvent, render, screen, within } from "@testing-library/react";

import type { TechRecordType } from "@/lib/home/preview/types";
import { ArchitecturePage } from "../ArchitecturePage";

const REPO_ROOT = process.cwd();

function loadSkyHarborRecordTypes() {
  const snapshot = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, "src/lib/home/preview/golden-snapshots/skyharbor-air.json"), "utf8"),
  ) as {
    technologyEstate: {
      recordTypes: TechRecordType[];
    };
  };
  const byObjectType = new Map(snapshot.technologyEstate.recordTypes.map((recordType) => [recordType.objectType, recordType]));
  return {
    applications: byObjectType.get("application_system")!,
    integrations: byObjectType.get("data_asset_or_integration")!,
    infrastructure: byObjectType.get("infrastructure_platform")!,
  };
}

describe("Home v4 architecture grain", () => {
  it("keeps function slices from reading as platform or report-volume proof", () => {
    const recordTypes = loadSkyHarborRecordTypes();

    render(
      <ArchitecturePage
        tenantKey="skyharbor-air"
        tenantDisplayName="SkyHarbor Global"
        applications={recordTypes.applications}
        integrations={recordTypes.integrations}
        infrastructure={recordTypes.infrastructure}
      />,
    );

    expect(screen.getByText("IBM z16 Mainframe LPAR — PROD1")).toBeInTheDocument();
    expect(screen.getByText("Teradata Enterprise Warehouse Appliance")).toBeInTheDocument();
    const runMap = within(screen.getByLabelText("Enterprise run map"));
    expect(runMap.getByText("Enterprise run map")).toBeInTheDocument();
    const wheel = within(screen.getByLabelText("Architecture wheel"));
    expect(wheel.getByText("Architecture wheel")).toBeInTheDocument();
    expect(wheel.getByText("Where the enterprise runs, and who answers for it.")).toBeInTheDocument();
    expect(wheel.getByText(/typed ECL views/i)).toBeInTheDocument();
    expect(wheel.getByText("Selected business block")).toBeInTheDocument();
    expect(wheel.getByText("Open logical view")).toBeInTheDocument();
    expect(runMap.getAllByText("Health Plan / Payer").length).toBeGreaterThan(0);
    expect(runMap.getAllByText("Provider / Delivery").length).toBeGreaterThan(0);
    expect(runMap.getAllByText("Back Office").length).toBeGreaterThan(0);
    expect(runMap.getAllByText("Data, Analytics & AI").length).toBeGreaterThan(0);
    expect(runMap.getAllByText("Infrastructure & Hosting").length).toBeGreaterThan(0);
    expect(runMap.getAllByText("Vendor & Commercial Spine").length).toBeGreaterThan(0);
    expect(runMap.getByText("System passport")).toBeInTheDocument();
    expect(runMap.getByText("Top systems in this block")).toBeInTheDocument();
    expect(runMap.getByText("Decision context")).toBeInTheDocument();
    expect(runMap.getByText("annual cost where recorded")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Finance & Accounting/i }));

    expect(screen.getByText(/platform attribution unproven/i)).toBeInTheDocument();
    expect(screen.getByText(/Counts here are recorded systems, movements, platform records/i)).toBeInTheDocument();
    expect(screen.getByText("3 · data / reporting layer")).toBeInTheDocument();
    expect(screen.getByText("Serving targets")).toBeInTheDocument();
    expect(screen.getByText("not report count")).toBeInTheDocument();
    expect(screen.getAllByText("Teradata Enterprise Warehouse — Finance Subject Area").length).toBeGreaterThan(0);
    expect(screen.getByText("Missing source needed")).toBeInTheDocument();
    expect(screen.getByText("Report/catalog inventory by function")).toBeInTheDocument();
    expect(screen.getByText("BI platform, mart, and semantic-model usage by report")).toBeInTheDocument();
    expect(screen.getByText(/report\/catalog extract/i)).toBeInTheDocument();

    expect(screen.queryByText(/0 platforms/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Datamarts")).not.toBeInTheDocument();
    expect(screen.queryByText(/dashboard facts/i)).not.toBeInTheDocument();
  });
});
