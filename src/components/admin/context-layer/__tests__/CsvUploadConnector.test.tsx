/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { CsvUploadConnector } from "../CsvUploadConnector";

function enterpriseProfileFile(): File {
  const header = [
    "tenant_key",
    "company_name",
    "revenue_usd",
    "employees",
    "fiscal_year_end",
  ].join(",");
  const rows = Array.from({ length: 42 }, (_, index) =>
    [
      `tenant-${index + 1}`,
      `Company ${index + 1}`,
      "1000000",
      "100",
      "2026-12-31",
    ].join(","),
  );
  const csv = [header, ...rows].join("\n");
  return new File([csv], "enterprise_profile.csv", {
    type: "text/csv",
  });
}

describe("CsvUploadConnector", () => {
  it("auto-proposes a plain-English enterprise mapping and keeps advanced chunk controls hidden", async () => {
    render(
      <CsvUploadConnector
        clientId="client-test"
        tenantKey="test-tenant"
        tenantName="Test tenant"
        initialTemplateId="enterprise-profile"
        mode="package"
      />,
    );

    expect(screen.queryByText("Chunk text columns")).toBeNull();

    fireEvent.change(screen.getByLabelText("Data area"), {
      target: { value: "enterprise-profile" },
    });
    fireEvent.change(screen.getByLabelText(/Choose file/i), {
      target: { files: [enterpriseProfileFile()] },
    });

    expect(
      await screen.findByText(/Selected: enterprise_profile.csv/),
    ).toBeTruthy();
    expect(
      await screen.findByRole("region", { name: "Column mapping confirmation" }),
    ).toHaveTextContent(
      /I read 42 rows and matched your columns to Enterprise profile\./,
    );

    await waitFor(() =>
      expect(screen.getByLabelText("Tenant Key source column")).toHaveValue(
        "tenant_key",
      ),
    );
    expect(screen.getByLabelText("Company Name source column")).toHaveValue(
      "company_name",
    );
    expect(screen.getByLabelText("Revenue Usd source column")).toHaveValue(
      "revenue_usd",
    );
    expect(screen.getByLabelText("Employees source column")).toHaveValue("employees");
    expect(screen.getByLabelText("Fiscal Year End source column")).toHaveValue(
      "fiscal_year_end",
    );
    expect(screen.getByLabelText("Record id")).toHaveValue("");
    expect(screen.getByLabelText("Title")).toHaveValue("company_name");
    expect(screen.queryByText(/Supply or map the required field/i)).toBeNull();

    fireEvent.change(screen.getByLabelText("Employees source column"), {
      target: { value: "revenue_usd" },
    });
    expect(screen.getByLabelText("Employees source column")).toHaveValue(
      "revenue_usd",
    );

    fireEvent.click(screen.getByText("Advanced"));
    await waitFor(() =>
      expect(screen.getByText("Chunk text columns")).toBeTruthy(),
    );
    expect(screen.getByLabelText("tenant_key")).toBeChecked();
  });

  it("marks unresolved CSV headers as review-required in plain language", async () => {
    render(
      <CsvUploadConnector
        clientId="client-test"
        tenantKey="test-tenant"
        tenantName="Test tenant"
        initialTemplateId="enterprise-profile"
      />,
    );

    fireEvent.change(screen.getByLabelText("Data area"), {
      target: { value: "enterprise-profile" },
    });

    const file = new File(["mystery,unknown\none,two\n"], "unknown.csv", {
      type: "text/csv",
    });
    fireEvent.change(screen.getByLabelText(/Choose file/i), {
      target: { files: [file] },
    });

    expect(
      await screen.findByRole("region", { name: "Column mapping confirmation" }),
    ).toHaveTextContent(
      /I read 1 rows and matched your columns to Enterprise profile\./,
    );
    expect(
      screen.getAllByText(/Needs a matching source column before commit/),
    ).toHaveLength(5);
    expect(
      screen.getByRole("button", { name: "Needs review before commit" }),
    ).toBeDisabled();
    expect(screen.queryByText(/Supply or map the required field/i)).toBeNull();
  });
});
