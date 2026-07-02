import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildContractOptimizationMveProfile,
  buildSkyHarborAmsExistingContractInput,
} from "@/lib/source/contract-optimization";
import { ContractOptimizationProfilePanel } from "../ContractOptimizationProfilePanel";

describe("ContractOptimizationProfilePanel", () => {
  it("renders the contract optimization sections before generic sourcing labels", () => {
    const profile = buildContractOptimizationMveProfile(
      buildSkyHarborAmsExistingContractInput(),
    );

    const html = renderToStaticMarkup(
      createElement(ContractOptimizationProfilePanel, { profile }),
    );

    expect(html).toContain("Contract Baseline");
    expect(html).toContain("Recommended Path");
    expect(html).toContain("Exposure Drivers");
    expect(html).toContain("Invoice Trend");
    expect(html).toContain("Operational Pressure");
    expect(html).toContain("Where value is leaking");
    expect(html).toContain("Optimization Findings");
    expect(html).toContain("Negotiation Levers");
    expect(html).toContain("Evidence Caveats");
    expect(html).toContain("$3.6M-$4.8M annualized");
    expect(html).toContain("Export DOCX brief");
    expect(html).toContain("Export PDF brief");
    expect(html).not.toMatch(/Vendor Response Profiles|Current state:|source_events/i);
  });
});
