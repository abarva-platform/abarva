import { buildAppInventoryPromptBlock } from "../app-inventory";
import type { SourceAppInventoryEntry } from "../types";

const entry = (
  over: Partial<SourceAppInventoryEntry> = {},
): SourceAppInventoryEntry => ({
  appId: "APP-001",
  name: "Core Banking Platform",
  tier: "Tier 1",
  owner: "Jane Doe",
  vendor: "Acme",
  criticality: "High",
  notes: "Primary ledger",
  ...over,
});

describe("buildAppInventoryPromptBlock", () => {
  it("emits a not-loaded note (no table) when inventory is empty", () => {
    const block = buildAppInventoryPromptBlock([]);
    expect(block).toContain("none loaded for this company");
    expect(block).toContain("Do not invent applications");
    expect(block).not.toContain("| App ID |");
  });

  it("treats undefined inventory the same as empty", () => {
    expect(buildAppInventoryPromptBlock(undefined)).toContain("none loaded");
  });

  it("renders a header count and a markdown table when inventory is present", () => {
    const block = buildAppInventoryPromptBlock([
      entry(),
      entry({ appId: "APP-002", name: "CRM" }),
    ]);
    expect(block).toContain("2 systems already on record");
    expect(block).toContain(
      "| App ID | Name | Tier | Owner | Vendor | Criticality | Notes |",
    );
    expect(block).toContain(
      "| APP-001 | Core Banking Platform | Tier 1 | Jane Doe | Acme | High | Primary ledger |",
    );
    expect(block).toContain("| APP-002 | CRM |");
  });

  it("singularises the header for a single system", () => {
    expect(buildAppInventoryPromptBlock([entry()])).toContain(
      "1 system already on record",
    );
  });

  it("leaves blank cells empty rather than inventing values", () => {
    const block = buildAppInventoryPromptBlock([
      entry({
        appId: "APP-003",
        name: "Legacy HR",
        tier: null,
        owner: null,
        vendor: null,
        criticality: null,
        notes: null,
      }),
    ]);
    expect(block).toContain("| APP-003 | Legacy HR |  |  |  |  |  |");
  });

  it("escapes pipes and newlines so a payload value cannot break the table", () => {
    const block = buildAppInventoryPromptBlock([
      entry({ appId: "APP-004", name: "Weird | App", notes: "line one\nline two" }),
    ]);
    expect(block).toContain("Weird / App");
    expect(block).toContain("line one line two");
    expect(
      block.split("\n").filter((l) => l.startsWith("| APP-004")),
    ).toHaveLength(1);
  });
});
