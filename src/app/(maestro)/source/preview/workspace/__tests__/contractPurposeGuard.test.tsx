import { renderToStaticMarkup } from "react-dom/server";

import type {
  SourceContract360Row,
  SourceContractEvidenceCoverageRow,
} from "@/lib/source/data-model/types";
import { ContractBriefingHeader } from "../Contract360Surfaces";
import { contractPurposeSummary } from "../WorkspaceExecutiveShell";
import type { SourceWorkspaceVM } from "../buildViewModel";

const contract = {
  contract_id: "C1",
  contract_name: "Infrastructure Managed Services Agreement",
  vendor_name: "Example Supplier",
  vendor_category: "infra_service_desk_managed_services",
  annual_value: 12_000_000,
  purpose_summary:
    "Managed Services - present - termination for convenience with 120-day notice after year two",
  scope_summary: null,
} as SourceContract360Row;

it("keeps an unreviewed-purpose status out of the contract title", () => {
  const vm = {
    detail: {
      contractTabIntelligence: [
        {
          tab_key: "Story",
          headline: "Example Supplier: contract purpose is not yet reviewed.",
        },
      ],
    },
    contractEducation: null,
    optWorkflow: null,
  } as unknown as SourceWorkspaceVM;

  const html = renderToStaticMarkup(
    <ContractBriefingHeader contract={contract} vm={vm} noticeDays={null} onBack={() => {}} />,
  );

  expect(html).toContain("Infrastructure Managed Services Agreement");
  expect(html).not.toContain("contract purpose is not yet reviewed");
});

it("does not describe concatenated clause states as reviewed scope", () => {
  const coverage = {
    contract_id: "C1",
    contract_archetype: "infra_service_desk_managed_services",
  } as SourceContractEvidenceCoverageRow;

  const summary = contractPurposeSummary(contract, coverage, []);

  expect(summary.body).not.toContain("termination for convenience");
  expect(summary.body).not.toContain("covering Managed Services - present");
  expect(summary.heading).toBe("Purpose review needed");
  expect(summary.body).toBe(
    "No reviewed contract-purpose extraction is available.",
  );
});
