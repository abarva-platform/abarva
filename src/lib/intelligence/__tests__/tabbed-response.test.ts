import {
  hasChartReadyMarkdownData,
  INTELLIGENCE_TABBED_OUTPUT_CONTRACT,
  parseIntelligenceTabbedResponse,
} from "@/lib/intelligence/tabbed-response";

const skyharborIropsRaw = [
  "SkyHarbor should make IROPS recovery decisioning the next AI investment, but only through a governed readiness gate. It is the largest operational value pool in the packet, and the decision is not to buy autonomy; it is to fund decision support where certified operating data, crew legality, and passenger reaccommodation controls are already clear.",
  "",
  "<<<TAB: Decision | grounding: tenant-evidence>>>",
  "Approve a gated IROPS decisioning tranche. The executive choice is to fund recovery option ranking and human dispatch support before autonomous write-back.",
  "",
  "<<<TAB: Industry Insights | grounding: industry-context>>>",
  "Industry context: airlines that improve disruption recovery usually start with decision support around crew, aircraft, and passenger recovery. This is not tenant proof; it is context for why the SkyHarbor operating problem is worth prioritizing.",
  "",
  "<<<TAB: Chart | grounding: tenant-evidence>>>",
  "| Value pool | Annual value | Readiness score |",
  "|---|---:|---:|",
  "| IROPS recovery decisioning | $270M | 2 |",
  "| Customer AI concierge | $180M | 2 |",
  "| Data estate rationalization | $122M | 3 |",
  "",
  "<<<TAB: Table | grounding: tenant-evidence>>>",
  "| Option | Value | Readiness | Risk | Decision |",
  "|---|---:|---|---|---|",
  "| IROPS recovery decisioning | $270M | Gate required | Operational data freshness | Fund gated tranche |",
  "| Customer AI concierge | $180M | Identity dependency | Consent fragmentation | Hold scale |",
  "| Data estate rationalization | $122M | Foundation work | Benefit timing | Start as enabler |",
  "",
  "<<<TAB: Evidence | grounding: mixed>>>",
  "- Tenant facts: IROPS recovery, customer AI, and data rationalization are named value pools in the packet.",
  "- Industry context: disruption recovery decisioning is a known airline AI pattern, but not tenant proof.",
  "- Missing evidence: signed data freshness SLA, crew legality owner, and recovery write-back control.",
].join("\n");

describe("Intelligence tabbed response parser", () => {
  it("requires Markdown tables to live in Table or Chart tabs", () => {
    expect(INTELLIGENCE_TABBED_OUTPUT_CONTRACT).toContain(
      "If you emit any Markdown table, it must appear inside the Table tab or Chart tab",
    );
    expect(INTELLIGENCE_TABBED_OUTPUT_CONTRACT).toContain(
      "never inside the main answer, Decision tab, Industry Insights tab, or Evidence tab",
    );
  });

  it("keeps Claude main answer and tab content exactly while placing tabs", () => {
    const parsed = parseIntelligenceTabbedResponse(skyharborIropsRaw);

    expect(parsed.mainAnswer).toBe(
      "SkyHarbor should make IROPS recovery decisioning the next AI investment, but only through a governed readiness gate. It is the largest operational value pool in the packet, and the decision is not to buy autonomy; it is to fund decision support where certified operating data, crew legality, and passenger reaccommodation controls are already clear.",
    );
    expect(parsed.tabs.map((tab) => tab.label)).toEqual([
      "Decision",
      "Industry Insights",
      "Chart",
      "Table",
      "Evidence",
    ]);
    expect(parsed.tabs.find((tab) => tab.id === "industry_insights")).toMatchObject({
      grounding: "industry-context",
    });
    expect(parsed.tabs.find((tab) => tab.id === "table")?.content).toBe(
      [
        "| Option | Value | Readiness | Risk | Decision |",
        "|---|---:|---|---|---|",
        "| IROPS recovery decisioning | $270M | Gate required | Operational data freshness | Fund gated tranche |",
        "| Customer AI concierge | $180M | Identity dependency | Consent fragmentation | Hold scale |",
        "| Data estate rationalization | $122M | Foundation work | Benefit timing | Start as enabler |",
      ].join("\n"),
    );
    expect(parsed.rawText).toBe(skyharborIropsRaw);
    expect(parsed.rawText).not.toContain("the referenced evidence");
  });

  it("drops Chart tab only when chart-ready data is absent", () => {
    const parsed = parseIntelligenceTabbedResponse(
      [
        "The answer is straightforward.",
        "",
        "<<<TAB: Chart | grounding: tenant-evidence>>>",
        "This is useful context, but it has no numeric data table.",
        "",
        "<<<TAB: Table | grounding: tenant-evidence>>>",
        "| Option | Decision |",
        "|---|---|",
        "| IROPS | Fund gated tranche |",
      ].join("\n"),
    );

    expect(parsed.tabs.map((tab) => tab.id)).toEqual(["table"]);
    expect(hasChartReadyMarkdownData("No table here")).toBe(false);
  });
});
