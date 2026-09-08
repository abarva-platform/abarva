/** @jest-environment jsdom */

import { render, screen, within } from "@testing-library/react";

import { ContractEvidenceDocuments } from "../WorkspaceExecutiveShell";

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
