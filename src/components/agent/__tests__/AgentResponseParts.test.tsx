/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { AgentResponseParts } from "../AgentResponseParts";

describe("AgentResponseParts", () => {
  it("renders Source citation metadata with business-facing labels", () => {
    render(
      <AgentResponseParts
        parts={[
          {
            type: "citations",
            title: "Evidence used",
            citations: [
              {
                label:
                  "Sourcing Artifacts - Vendor A — incumbent operations profile BAFO instruction",
                sourceDoc: "source_events",
                excerpt:
                  "productivity gap: provide a year-by-year productivity credit schedule.",
                confidence: "high",
              },
            ],
          },
        ]}
      />,
    );

    expect(
      screen.getByText(
        "Vendor A — incumbent operations profile BAFO instruction",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Source event evidence - confidence high/)).toBeInTheDocument();
    expect(screen.queryByText(/Sourcing Artifacts/)).not.toBeInTheDocument();
    expect(screen.queryByText(/source_events/)).not.toBeInTheDocument();
  });
});
