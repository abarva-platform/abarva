/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SourceNewNdaCapture } from "./SourceNewNdaCapture";
import type { SourceNewFileRow } from "./SourceNewFiles";
import type { SourceNewStage05NdaCoverage } from "@/lib/source/new-workspace/stage05-nda-coverage";

const refreshMock = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh: refreshMock }) }));

const eventId = "11111111-1111-4111-8111-111111111111";
const file = {
  id: "22222222-2222-4222-8222-222222222222",
  title: "Executed NDA scan",
  artifactGroup: "upload",
  artifactType: "nda_executed",
  lifecycleState: "current",
  blobSha256: "a".repeat(64),
} as SourceNewFileRow;

function coverage(templates: string[]): SourceNewStage05NdaCoverage {
  return {
    status: "blocked",
    asOf: "2026-10-02T00:00:00Z",
    publishedTemplateVersions: templates,
    suppliers: [{
      legalEntityId: "VEN-001", legalName: "Example supplier", state: "not_covered",
      reason: "No authority recorded", authorityReference: null,
      evidenceReference: "candidate-1", evidenceCaveats: [],
    }],
    nextAction: { label: "Resolve NDA coverage", detail: "Record evidence." },
  };
}

beforeEach(() => { jest.clearAllMocks(); });

describe("Source New executed NDA capture", () => {
  it("does not offer a record action without published template and current uploaded evidence", () => {
    const { rerender } = render(<SourceNewNdaCapture eventId={eventId} files={[file]} coverage={coverage([])} />);
    expect(screen.queryByRole("button", { name: "Record executed NDA" })).toBeNull();
    expect(screen.getByText(/Legal must publish/)).toBeTruthy();

    rerender(<SourceNewNdaCapture eventId={eventId} files={[]} coverage={coverage(["NDA-V1"])} />);
    expect(screen.queryByRole("button", { name: "Record executed NDA" })).toBeNull();
    expect(screen.getByText(/Upload the executed NDA/)).toBeTruthy();
  });

  it("submits only the selected governed identities and refreshes coverage after success", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    const priorFetch = global.fetch;
    global.fetch = fetchMock;
    try {
      render(<SourceNewNdaCapture eventId={eventId} files={[file]} coverage={coverage(["NDA-V1"])} />);
      const form = screen.getByRole("form", { name: "Record executed NDA" });
      const inputs = form.querySelectorAll("input");
      for (const input of inputs) {
        if (input.name === "effectiveFrom") input.value = "2026-09-30";
        if (input.name === "executedAt") input.value = "2026-09-30T12:00";
        if (input.name === "supplierSignatoryName") input.value = "Supplier signer";
        if (input.name === "buyerSignatoryName") input.value = "Buyer signer";
        if (input.name === "privateEvidenceRef") input.value = "private://nda-evidence";
        if (input.name === "evidenceReference") input.value = "Reviewed the signed pages and private record.";
      }
      fireEvent.submit(form);
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
      const body = fetchMock.mock.calls[0][1].body as FormData;
      expect(body.get("vendorId")).toBe("VEN-001");
      expect(body.get("artifactId")).toBe(file.id);
      expect(body.get("templateVersion")).toBe("NDA-V1");
      expect(body.get("executedAt")).toBe(new Date("2026-09-30T12:00").toISOString());
      await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
    } finally {
      global.fetch = priorFetch;
    }
  });
});
