/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

import { designFixtureMart } from "@/lib/tower/command-center/__fixtures__/design-fixture";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";
import { FoundationSourceInventory } from "../views/FoundationSourceInventory";
import { FoundationsPanel } from "../views/FoundationsPanel";

const replace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/tower",
  useSearchParams: () => new URLSearchParams("tab=foundations&client=example-tenant"),
}));

it("browses source records separately from AI foundation cases and never sums source money", () => {
  const view = buildTowerCommandCenterView(designFixtureMart(), { tenantName: "Example" })!;
  render(<FoundationsPanel view={{
    ...view,
    allInitiatives: [],
    foundationInventory: {
      records: [{
        id: "foundation:application:APP-041", objectType: "application", sourceObjectId: "APP-041",
        canonicalObjectId: "canonical-object-41", sourceRecordId: "source-record-41",
        name: "Example system", sourceFields: { annual_cost_usd: 500, annual_cost_basis: "synthetic_modeled", hosting_model: "cloud" },
        sourceFile: "02_applications.csv", sourceRow: 42, sourceSha256: "file-hash",
        qualityLabel: "Source-reported; not independently verified", reviewState: "not_reviewed",
        segmentIdentityStatus: null,
      }],
      totalRecords: 41, matchingRecords: 41, page: 1, pageSize: 40,
      filter: "all", search: "", unreadableRowCount: 0,
      rawMaturityRowsWithoutId: 17, rawRelationshipRows: 2302,
      segmentRowsMappingPending: 4, itsmExtractAvailable: false,
    },
  }} />);

  expect(screen.getByText(/41 projected records with declared IDs/)).toBeInTheDocument();
  expect(screen.getByText(/No AI case is classified/)).toBeInTheDocument();
  expect(screen.getByText(/17 source rows describe maturity but have no individual record ID/)).toBeInTheDocument();
  expect(screen.getByText(/2,302 source rows describe possible connections/)).toBeInTheDocument();
  expect(screen.getByText(/4 business segment source rows still need their links checked/)).toBeInTheDocument();
  expect(screen.queryByText(/\$500 in approved/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByText(/Example system/));
  expect(screen.getByText("Source yearly cost (year unverified)")).toBeInTheDocument();
  expect(screen.getByText("$500")).toBeInTheDocument();
  expect(screen.getByText("Cost basis in source")).toBeInTheDocument();
  expect(screen.getByText("Modeled estimate")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  expect(replace).toHaveBeenCalledWith(
    "/tower?tab=foundations&client=example-tenant&foundationFilter=all&foundationSearch=&foundationPage=2",
    { scroll: false },
  );
});

it("keeps an empty search honest and sends filters and search through the bounded read URL", () => {
  replace.mockClear();
  render(<FoundationSourceInventory inventory={{
    records: [], totalRecords: 41, matchingRecords: 0, page: 1, pageSize: 40,
    filter: "all", search: "unmatched", unreadableRowCount: 0,
    rawMaturityRowsWithoutId: null, rawRelationshipRows: null,
    segmentRowsMappingPending: null, itsmExtractAvailable: null,
  }} />);
  expect(screen.getByText("No matching records.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Next page" })).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole("combobox", { name: "Browse source records" }), { target: { value: "functions" } });
  expect(replace).toHaveBeenLastCalledWith(
    "/tower?tab=foundations&client=example-tenant&foundationFilter=functions&foundationSearch=unmatched&foundationPage=1",
    { scroll: false },
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Find a record" }), { target: { value: "APP-041" } });
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  expect(replace).toHaveBeenLastCalledWith(
    "/tower?tab=foundations&client=example-tenant&foundationFilter=all&foundationSearch=APP-041&foundationPage=1",
    { scroll: false },
  );
});
