/**
 * @jest-environment jsdom
 */

// EvidenceBasis · component test (Meridian evidence-hardening lane).
//
// Locks in: grouping (TENANT/GRAPH → Client facts, PATTERN → Healthcare
// patterns), citation-gap behavior, PHI/path/raw-id scrubbing in the main
// excerpt, and partial-evidence labeling for inference-only / low-confidence
// answers.

import "@testing-library/jest-dom";
import { render, screen, within, fireEvent } from "@testing-library/react";
import {
  EvidenceBasis,
  scrubExcerpt,
} from "@/components/intelligence/EvidenceBasis";
import type { AskSource } from "@/lib/intelligence/ask/types";
import type { CoverageReport } from "@/lib/knowledge/coverage";

function expand() {
  fireEvent.click(screen.getByTestId("evidence-basis-toggle"));
}

describe("EvidenceBasis", () => {
  it("groups TENANT/GRAPH under Client facts and PATTERN under Healthcare patterns", () => {
    const sources: AskSource[] = [
      {
        type: "TENANT",
        name: "Meridian org structure",
        id: "seg-1",
        detail: "org structure facts",
        confidence: 0.9,
      },
      {
        type: "GRAPH",
        name: "Program dependency graph",
        id: "g-1",
        detail: "dependency edges",
        confidence: 0.88,
      },
      {
        type: "PATTERN",
        name: "EHR migration failure mode",
        id: "p-1",
        detail: "common pattern",
        confidence: 0.9,
      },
    ];
    render(<EvidenceBasis sources={sources} />);
    expand();

    const client = screen.getByTestId("evidence-group-client");
    expect(
      within(client).getByText("Meridian org structure"),
    ).toBeInTheDocument();
    expect(
      within(client).getByText("Program dependency graph"),
    ).toBeInTheDocument();

    const patterns = screen.getByTestId("evidence-group-patterns");
    expect(
      within(patterns).getByText("EHR migration failure mode"),
    ).toBeInTheDocument();

    // PATTERN must NOT leak into Client facts.
    expect(
      within(client).queryByText("EHR migration failure mode"),
    ).not.toBeInTheDocument();
  });

  it("shows the citation gap warning when sources are empty", () => {
    render(<EvidenceBasis sources={[]} />);
    expect(screen.getByTestId("evidence-citation-gap")).toBeInTheDocument();
    expect(screen.getByTestId("evidence-citation-gap").textContent).toMatch(
      /citation gap/i,
    );
  });

  it("does NOT show the citation gap warning when sources are present", () => {
    const sources: AskSource[] = [
      {
        type: "TENANT",
        name: "Client fact",
        id: "t-1",
        detail: "detail",
        confidence: 0.9,
      },
    ];
    render(<EvidenceBasis sources={sources} />);
    expect(
      screen.queryByTestId("evidence-citation-gap"),
    ).not.toBeInTheDocument();
  });

  it("scrubs filesystem paths and raw record ids from the main excerpt", () => {
    const sources: AskSource[] = [
      {
        type: "TENANT",
        name: "Change record",
        id: "CHG-MH-00034",
        detail:
          "Loaded from /tmp/meridian/uploads/changes.csv for record CHG-MH-00034 (sensitive).",
        confidence: 0.9,
      },
    ];
    render(<EvidenceBasis sources={sources} />);
    expand();

    const item = screen.getByTestId("evidence-item");
    const text = item.textContent ?? "";
    // The raw id and path must not appear in the main view.
    expect(text).not.toContain("/tmp/meridian/uploads/changes.csv");
    expect(text).not.toContain("CHG-MH-00034");
    // Title (human-readable) is still shown.
    expect(within(item).getByText("Change record")).toBeInTheDocument();
  });

  it("reveals the raw id only behind the diagnostics Details toggle", () => {
    const sources: AskSource[] = [
      {
        type: "TENANT",
        name: "Change record",
        id: "CHG-MH-00034",
        detail: "desc",
        confidence: 0.9,
      },
    ];
    render(<EvidenceBasis sources={sources} />);
    expand();
    // Not visible by default.
    expect(screen.queryByTestId("evidence-item-rawid")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("evidence-diagnostics-toggle"));
    const raw = screen.getByTestId("evidence-item-rawid");
    expect(raw.textContent).toContain("CHG-MH-00034");
  });

  it("shows partial evidence when only inference-class low-confidence sources exist", () => {
    const sources: AskSource[] = [
      {
        type: "GENERAL",
        name: "General reasoning",
        id: null,
        detail: "model inference",
        confidence: 0.5,
      },
      {
        type: "SURFACE",
        name: "Active tab context",
        id: null,
        detail: "surface",
        confidence: 0.4,
      },
    ];
    render(<EvidenceBasis sources={sources} />);
    // Header summary should not claim high confidence.
    expect(screen.getByTestId("evidence-basis").textContent).toMatch(
      /low confidence|partial evidence/i,
    );
    expect(screen.getByTestId("evidence-basis").textContent).not.toMatch(
      /high confidence/i,
    );
  });

  it("caps inference-only high-confidence sources at partial (no grounded citation)", () => {
    const sources: AskSource[] = [
      {
        type: "GENERAL",
        name: "Confident inference",
        id: null,
        detail: "reasoning",
        confidence: 0.95,
      },
    ];
    render(<EvidenceBasis sources={sources} />);
    expect(screen.getByTestId("evidence-basis").textContent).toMatch(
      /partial evidence/i,
    );
    expect(screen.getByTestId("evidence-basis").textContent).not.toMatch(
      /high confidence/i,
    );
  });

  it("renders a Missing evidence group from coverageReport gaps", () => {
    const sources: AskSource[] = [
      {
        type: "TENANT",
        name: "Client fact",
        id: "t-1",
        detail: "detail",
        confidence: 0.9,
      },
    ];
    const coverageReport = {
      category: "GENERAL_STRATEGY",
      status: "partial",
      requiredSegments: [
        "enterprise_profile",
        "program_inventory",
        "evidence_ledger",
      ],
      presentSegments: ["enterprise_profile"],
      missingSegments: ["program_inventory", "evidence_ledger"],
      optionalSegments: [],
      sourceCount: 1,
      minSources: 3,
    } as unknown as CoverageReport;
    render(<EvidenceBasis sources={sources} coverageReport={coverageReport} />);
    expand();
    const missing = screen.getByTestId("evidence-group-missing");
    expect(within(missing).getByText(/program inventory/i)).toBeInTheDocument();
    expect(within(missing).getByText(/evidence ledger/i)).toBeInTheDocument();
  });

  it("scrubExcerpt strips paths and raw ids", () => {
    const scrubbed = scrubExcerpt(
      "See /private/var/data/x.csv id DOC-1234 here",
    );
    expect(scrubbed).not.toContain("/private/var/data/x.csv");
    expect(scrubbed).not.toContain("DOC-1234");
  });
});
