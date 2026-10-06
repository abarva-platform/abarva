import { renderToStaticMarkup } from "react-dom/server";

import type { SourceContractEvidenceCoverageRow } from "@/lib/source/data-model/types";
import { ContractEvidenceFamilies } from "../Contract360Surfaces";
import type { SourceWorkspaceVM } from "../buildViewModel";

it("keeps optimization candidates out of the evidence family list", () => {
  const coverage = {
    spend_rows: 12,
    scope_rows: 4,
    document_page_text_rows: 6,
    opportunity_rows: 6,
  } as SourceContractEvidenceCoverageRow;
  const vm = {
    detail: null,
    contractEducation: null,
  } as SourceWorkspaceVM;

  const html = renderToStaticMarkup(
    <ContractEvidenceFamilies coverage={coverage} vm={vm} />,
  );

  expect(html).toContain("22 governed rows across 3 evidence lanes");
  expect(html).not.toContain("Negotiation levers");
  expect(html).not.toContain("28 governed rows");
});
