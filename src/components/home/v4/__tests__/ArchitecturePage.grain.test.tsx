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
    expect(runMap.getByText("Health Plan / Payer")).toBeInTheDocument();
    expect(runMap.getByText("Provider / Delivery")).toBeInTheDocument();
    expect(runMap.getByText("Back Office")).toBeInTheDocument();
    expect(runMap.getByText("Data, Analytics & AI")).toBeInTheDocument();
    expect(runMap.getByText("Infrastructure & Hosting")).toBeInTheDocument();
    expect(runMap.getByText("Vendor & Commercial Spine")).toBeInTheDocument();

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
