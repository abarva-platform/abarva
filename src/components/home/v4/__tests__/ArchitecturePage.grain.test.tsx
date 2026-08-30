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
    expect(wheel.getByText(/business blocks/i)).toBeInTheDocument();
    expect(wheel.getByText(/applications ·/i)).toBeInTheDocument();
    expect(wheel.getByText(/movements · 0 workload segments/i)).toBeInTheDocument();
    expect(wheel.queryByText(/counted records/i)).not.toBeInTheDocument();
    expect(wheel.queryByText(/\b\d{3,4} records\b/i)).not.toBeInTheDocument();
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
    expect(screen.getByText("Workload evidence not loaded")).toBeInTheDocument();
    expect(screen.getByText("Report, ETL, script, and analytics workload counts by function")).toBeInTheDocument();
    expect(screen.getByText("BI platform, mart, and semantic-model usage by segment")).toBeInTheDocument();
    expect(screen.queryByText("Missing source needed")).not.toBeInTheDocument();
    expect(screen.queryByText(/Confirm reports, ETL jobs, users, scripts/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/report\/catalog extract/i)).not.toBeInTheDocument();

    expect(screen.queryByText(/0 platforms/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Datamarts")).not.toBeInTheDocument();
    expect(screen.queryByText(/dashboard facts/i)).not.toBeInTheDocument();
  });

  it("shows loaded data, BI, and ETL workload context when the deterministic layer provides it", () => {
    const recordTypes = loadSkyHarborRecordTypes();
    const integrationsWithWorkloads: TechRecordType = {
      ...recordTypes.integrations,
      rows: [
        ...recordTypes.integrations.rows,
        {
          recordKind: "data_analytics_workload",
          dataAssetName: "Enterprise Power BI Tenant",
          dataDomain: "Finance & Accounting",
          workloadType: "report",
          platformName: "Enterprise Power BI Tenant",
          technologyName: "Power BI",
          workloadCount: 420,
          activeUserCount: 1800,
          dataVolumeTb: 18.5,
          governanceState: "developing",
          ownerFunction: "Finance & Accounting",
        },
        {
          recordKind: "data_analytics_workload",
          dataAssetName: "Informatica Finance ETL",
          dataDomain: "Finance & Accounting",
          workloadType: "etl_job",
          platformName: "Informatica PowerCenter",
          technologyName: "Informatica",
          workloadCount: 95,
          activeUserCount: 42,
          dataVolumeTb: 11.2,
          governanceState: "governed",
          ownerFunction: "Finance & Accounting",
        },
      ],
    };

    render(
      <ArchitecturePage
        tenantKey="skyharbor-air"
        tenantDisplayName="SkyHarbor Global"
        applications={recordTypes.applications}
        integrations={integrationsWithWorkloads}
        infrastructure={recordTypes.infrastructure}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Finance & Accounting/i }));

    const wheel = within(screen.getByLabelText("Architecture wheel"));
    const movementCount = recordTypes.integrations.rows.length;
    const combinedCount = movementCount + 2;
    expect(
      wheel.getByText(new RegExp(`${movementCount.toLocaleString()} movements · 2 workload segments`, "i")),
    ).toBeInTheDocument();
    expect(wheel.queryByText(new RegExp(`${combinedCount.toLocaleString()} movements`, "i"))).not.toBeInTheDocument();

    const workloadPanel = screen.getByText("Data/BI/ETL evidence loaded").closest("article");
    expect(workloadPanel).toBeTruthy();
    expect(within(workloadPanel!).getByText("workload segments")).toBeInTheDocument();
    expect(within(workloadPanel!).getByText("2")).toBeInTheDocument();
    expect(within(workloadPanel!).getByText("workload items")).toBeInTheDocument();
    expect(within(workloadPanel!).getByText("515")).toBeInTheDocument();
    expect(within(workloadPanel!).getByText("active users")).toBeInTheDocument();
    expect(within(workloadPanel!).getByText("1,842")).toBeInTheDocument();
    expect(within(workloadPanel!).getByText("data volume TB")).toBeInTheDocument();
    expect(within(workloadPanel!).getByText("29.7")).toBeInTheDocument();
    expect(screen.queryByText("Workload evidence not loaded")).not.toBeInTheDocument();
    expect(screen.queryByText("Missing source needed")).not.toBeInTheDocument();
  });
});
