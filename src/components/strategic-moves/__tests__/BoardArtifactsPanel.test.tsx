/**
 * @jest-environment jsdom
 */

// BoardArtifactsPanel · component tests
//
// Covers:
//   - Renders the "Board artifacts" panel listing each deck when the Move has
//     anchored board-grade artifacts (the Apex reference Move → 8 decks).
//   - A real, non-reference Move with a resolvable function identity surfaces
//     the generated board-grade deck set with `?moveId=` links.
//   - Renders nothing for a Move with no resolvable function (honest gap).

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { BoardArtifactsPanel } from "../BoardArtifactsPanel";
import type { StrategicMove } from "@/lib/programs/types.ui";

function makeMove(overrides: Partial<StrategicMove> = {}): StrategicMove {
  const base: StrategicMove = {
    id: "move-uuid",
    displayCode: "APX-CC-2026",
    name: "Contact Center AI Routing",
    tenant: {
      id: "tenant-apex",
      name: "Apex Retail Group",
      industryCode: "retail",
    },
    charter: null,
    functionPackKey: null,
    archetype: "AI Product Enablement",
    currentPhase: 3,
    phaseLabel: "Design & Plan",
    status: { key: "active", text: "On track", description: "" },
    statusColor: "green",
    sponsor: null,
    participants: [],
    valueAtStake: { projected: null, verified: null, assumptions: null },
    deliverables: [],
    gateCriteria: [],
    recentActivity: [],
    linkedEvidence: [],
    mapLabel: "",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };
  return { ...base, ...overrides };
}

describe("BoardArtifactsPanel — Apex reference Move", () => {
  it('renders the "Board artifacts" panel listing the reference decks', () => {
    render(<BoardArtifactsPanel move={makeMove()} />);

    expect(screen.getByTestId("board-artifacts-panel")).toBeInTheDocument();
    expect(screen.getByText("Executive artifacts")).toBeInTheDocument();
    expect(screen.getAllByTestId("board-artifact-row")).toHaveLength(8);

    expect(screen.getByText("Costed Business-Case Pack")).toBeInTheDocument();
    expect(screen.getByText("Discover Brief")).toBeInTheDocument();
    expect(screen.getByText("Solution Architecture Pack")).toBeInTheDocument();
  });

  it("shows a Download PowerPoint link only for the Costed pack", () => {
    render(<BoardArtifactsPanel move={makeMove()} />);
    const pptxLinks = screen.getAllByRole("link", { name: /PowerPoint/ });
    expect(pptxLinks).toHaveLength(1);
    expect(pptxLinks[0]).toHaveAttribute(
      "href",
      "/api/v1/moves/board-grade-business-case?format=pptx",
    );
  });
});

describe("BoardArtifactsPanel — real Move via the key-driven path", () => {
  it("surfaces the generated board-grade deck set with move-scoped links and client-safe wording", () => {
    const move = makeMove({
      id: "real-move-42",
      name: "Reduce contact-centre handle time",
      tenant: {
        id: "t-apex",
        name: "Apex Retail Group",
        industryCode: "retail",
      },
      charter: { functionPackKey: "customer_care" },
    });
    render(<BoardArtifactsPanel move={move} />);

    expect(screen.getByTestId("board-artifacts-panel")).toBeInTheDocument();
    const rows = screen.getAllByTestId("board-artifact-row");
    expect(rows).toHaveLength(8);
    expect(screen.getByText("Costed Business-Case Pack")).toBeInTheDocument();

    expect(
      screen
        .getAllByRole("link", { name: /View/ })
        .some(
          (link) =>
            link.getAttribute("href") ===
            "/api/v1/moves/board-grade-business-case?moveId=real-move-42",
        ),
    ).toBe(true);
    expect(
      screen.queryByText(/kernel|Function-Pack|seed gaps/i),
    ).not.toBeInTheDocument();
  });
});

describe("BoardArtifactsPanel — Move with no resolvable function", () => {
  it("renders nothing for a Move whose charter carries no function key", () => {
    const { container } = render(
      <BoardArtifactsPanel
        move={makeMove({ name: "Customer Data Platform", charter: null })}
      />,
    );
    expect(container).toBeEmptyDOMElement();
    expect(
      screen.queryByTestId("board-artifacts-panel"),
    ).not.toBeInTheDocument();
  });

  it("renders nothing for a Move whose industry code does not resolve", () => {
    const { container } = render(
      <BoardArtifactsPanel
        move={makeMove({
          name: "Some unrelated Move",
          tenant: { id: "t-x", name: "Some Other Company", industryCode: null },
          charter: { functionPackKey: "customer_care" },
        })}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
