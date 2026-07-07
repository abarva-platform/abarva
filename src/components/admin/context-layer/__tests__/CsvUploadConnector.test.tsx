/**
 * @jest-environment jsdom
 */

import fs from "node:fs";
import path from "node:path";

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { CsvUploadConnector } from "../CsvUploadConnector";

function skyharborDoraFile(): File {
  const csv = fs.readFileSync(
    path.join(
      process.cwd(),
      "datasets/skyharbor-air-synthetic-v1/source_uploads/dora_productivity_baseline.csv",
    ),
    "utf8",
  );
  return new File([csv], "dora_productivity_baseline.csv", {
    type: "text/csv",
  });
}

describe("CsvUploadConnector", () => {
  it("auto-proposes a plain-English DORA mapping and keeps advanced chunk controls hidden", async () => {
    render(
      <CsvUploadConnector
        clientId="client-skyharbor"
        tenantKey="skyharbor-air"
        tenantName="Skyharbor Air"
        initialTemplateId="dora-baseline"
        mode="package"
      />,
    );

    expect(screen.queryByText("Chunk text columns")).toBeNull();

    fireEvent.change(screen.getByLabelText("Data area"), {
      target: { value: "dora-baseline" },
    });
    fireEvent.change(screen.getByLabelText(/Choose file/i), {
      target: { files: [skyharborDoraFile()] },
    });

    expect(
      await screen.findByText(/Selected: dora_productivity_baseline.csv/),
    ).toBeTruthy();
    expect(
      await screen.findByText(
        /I read 42 rows and matched your columns to Delivery \/ DORA \/ DevEx\./,
      ),
    ).toBeTruthy();

    await waitFor(() =>
      expect(screen.getByLabelText("Team source column")).toHaveValue(
        "scorecard_id",
      ),
    );
    expect(screen.getByLabelText("Measurement date source column")).toHaveValue(
      "last_updated",
    );
    expect(
      screen.getByLabelText("Deployment frequency source column"),
    ).toHaveValue("deploy_frequency_per_week");
    expect(screen.getByLabelText("Lead time source column")).toHaveValue(
      "lead_time_for_change_hours",
    );
    expect(screen.getByLabelText("Record id")).toHaveValue("scorecard_id");
    expect(screen.getByLabelText("Title")).toHaveValue("metric");
    expect(screen.queryByText(/Supply or map the required field/i)).toBeNull();

    fireEvent.change(screen.getByLabelText("Lead time source column"), {
      target: { value: "MTTR_hours" },
    });
    expect(screen.getByLabelText("Lead time source column")).toHaveValue(
      "MTTR_hours",
    );

    fireEvent.click(screen.getByText("Advanced"));
    await waitFor(() =>
      expect(screen.getByText("Chunk text columns")).toBeTruthy(),
    );
    expect(screen.getByLabelText("lead_time_for_change_hours")).toBeChecked();
  });

  it("marks unresolved CSV headers as review-required in plain language", async () => {
    render(
      <CsvUploadConnector
        clientId="client-skyharbor"
        tenantKey="skyharbor-air"
        tenantName="Skyharbor Air"
        initialTemplateId="dora-baseline"
      />,
    );

    const file = new File(["mystery,unknown\none,two\n"], "unknown.csv", {
      type: "text/csv",
    });
    fireEvent.change(screen.getByLabelText(/Choose file/i), {
      target: { files: [file] },
    });

    expect(
      await screen.findByText(
        /I read 1 rows and matched your columns to Delivery \/ DORA \/ DevEx\./,
      ),
    ).toBeTruthy();
    expect(
      screen.getAllByText(/Needs a matching source column before commit/),
    ).toHaveLength(4);
    expect(
      screen.getByRole("button", { name: "Needs review before commit" }),
    ).toBeDisabled();
    expect(screen.queryByText(/Supply or map the required field/i)).toBeNull();
  });
});
