/** @jest-environment jsdom */

import { render, screen, within } from "@testing-library/react";

import {
  ContractEvidenceDocuments,
  contractCoverageWithDetailLanes,
} from "../WorkspaceExecutiveShell";
import type { SourceContract360Row } from "@/lib/source/data-model/types";

describe("ContractEvidenceDocuments", () => {
  it("prioritizes clause-bearing documents and keeps the inventory compact", () => {
    const files = Array.from({ length: 10 }, (_, index) => ({
      file_id: index === 9 ? "DOC-SLA" : `DOC-EVIDENCE-${index + 1}`,
      tenant_key: "skyharbor_global" as const,
      file_name: `evidence-${index + 1}.txt`,
      media_type: "text/plain",
      page_count: 1,
      load_run_id: "load-1",
      document_role: index === 9 ? "performance_schedule" : "evidence",
      document_type: index === 9 ? "sla_report" : "invoice_export",
      contract_ref: "CONTRACT-001",
      visibility_class: "internal",
      content_authenticity: "synthetic",
      uploaded_at: "2027-01-01T00:00:00Z",
      metadata_json: {},
    }));
    const extractions = [
      {
        extraction_id: "extraction-1",
        tenant_key: "skyharbor_global" as const,
        concept_ref: "contract.sla_credit",
        subject_kind: "contract",
        subject_ref: "CONTRACT-001",
        value_text: "Two percent service credit",
        value_num: null,
        confidence: 0.95,
        method: "pdf_text_extraction",
        review_state: "reviewed",
        source_file_id: "DOC-SLA",
        source_page: 7,
        source_section: "Service credits",
        extracted_at: "2027-01-01T00:00:00Z",
      },
    ];

    render(
      <ContractEvidenceDocuments files={files} extractions={extractions} />,
    );

    const summary = screen.getByLabelText("Contract document evidence summary");
    expect(within(summary).getAllByText("10")).toHaveLength(2);
    expect(screen.getByText("SLA schedule and performance evidence")).toBeTruthy();
    expect(screen.getByText("DOC-SLA")).toBeTruthy();
    expect(screen.getByText(/2 additional governed evidence files/)).toBeTruthy();
    expect(screen.queryByText("DOC-EVIDENCE-9")).toBeNull();
  });
});

describe("contractCoverageWithDetailLanes", () => {
  it("uses loaded contract-detail lanes when portfolio coverage has stale zeroes", () => {
    const contract = {
      tenant_key: "skyharbor_global",
      contract_id: "CONTRACT-001",
      vendor_ref: "VENDOR-001",
      vendor_name: "Synthetic Vendor",
      vendor_category: "technology",
      contract_archetype: "cloud_consumption_commit",
      contract_name: "Synthetic platform agreement",
    } as unknown as SourceContract360Row;
    const coverage = {
      contract_id: contract.contract_id,
      spend_rows: 0,
      performance_rows: 0,
      document_page_text_rows: 0,
      opportunity_rows: 0,
    } as never;
    const vm = {
      detailState: "ready",
      detail: {
        spendMonths: Array.from({ length: 12 }, (_, index) => ({
          actual_spend: index === 0 ? 66_100 : 0,
          committed_amount: index === 0 ? 1_550_000 : 0,
        })),
        performancePeriods: Array.from({ length: 4 }),
        docExtractions: Array.from({ length: 8 }),
        optimizationOpportunitySet: {
          opportunities: Array.from({ length: 4 }),
        },
      },
      opportunityView: null,
    } as never;

    const resolved = contractCoverageWithDetailLanes(
      coverage,
      contract,
      Array.from({ length: 4 }) as never,
      vm,
    );

    expect(resolved).toMatchObject({
      spend_rows: 12,
      actual_spend_usd: 66_100,
      committed_spend_usd: 1_550_000,
      performance_rows: 4,
      document_page_text_rows: 8,
      opportunity_rows: 4,
      scope_rows: 4,
    });
  });
});
