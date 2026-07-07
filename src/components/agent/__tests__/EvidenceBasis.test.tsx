/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { EvidenceBasis } from "../EvidenceBasis";
import type { AskSource } from "@/lib/intelligence/ask/types";

const sources: AskSource[] = [
  {
    type: "TENANT",
    name: "Lakeshore IT systems inventory",
    id: "chunk-123",
    detail: "42 systems, 14 at Tier 1 across four OpCos",
    confidence: 0.9,
  },
  {
    type: "PATTERN",
    name: "Prioritize procurement calendars for timing local bids",
    id: "PAT-LSH-D18-00479",
    detail: "governs the related initiative gate",
    confidence: 0.8,
  },
];

describe("EvidenceBasis", () => {
  it("renders nothing when there are no citations (keeps the citation-gap path honest)", () => {
    const { container } = render(<EvidenceBasis citations={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows the source count and groups by class when expanded", () => {
    render(<EvidenceBasis citations={sources} />);
    expect(screen.getByText(/2 sources/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Client context")).toBeTruthy();
    expect(screen.getByText("Corpus patterns")).toBeTruthy();
    expect(screen.getByText("Lakeshore IT systems inventory")).toBeTruthy();
    expect(
      screen.getByText(
        "Prioritize procurement calendars for timing local bids",
      ),
    ).toBeTruthy();
  });

  it("never exposes raw internal ids in the visible prose (ids live in title only)", () => {
    render(<EvidenceBasis citations={sources} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByText(/chunk-123/)).toBeNull();
    expect(screen.queryByText(/PAT-LSH-D18-00479/)).toBeNull();
  });
});
