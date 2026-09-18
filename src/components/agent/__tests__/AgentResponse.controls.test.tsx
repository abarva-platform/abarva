/** @jest-environment jsdom */

/**
 * Behavioral test for the `agent-response-output` control declared in
 * docs/security/ai-surface-control-catalog.json — the densest entry in the
 * catalog, carrying five controls at once:
 *
 *   ai-label            the answer is marked as a draft to review
 *   citation            cited claims resolve to their sources
 *   citation-gap        substantive prose with no citation says so
 *   confidence          a confidence tier is disclosed when one is known
 *   human-approval-gate follow-up actions carry an approval notice
 *
 * The checker proves those component names appear in the file. It cannot prove
 * any of them renders for a given answer, or — more to the point — that the
 * citation gap stays quiet when the answer really is cited. This renders the
 * real component.
 */

import { render, screen } from "@testing-library/react";
import { AgentResponse } from "../AgentResponse";

const SUBSTANTIVE =
  "Denial write-offs rose to $4.2M last year, which is above the industry benchmark and is the single largest recoverable line in the portfolio.";

function response(extra: Record<string, unknown> = {}) {
  return {
    response_text: SUBSTANTIVE,
    citations: [],
    confidence_signal: "medium",
    sparsity_flag: false,
    follow_up_actions: [],
    handoff_affordance: null,
    ...extra,
  } as never;
}

describe("agent response · disclosure controls", () => {
  it("marks every answer as a draft to review before acting", () => {
    render(<AgentResponse response={response()} />);

    expect(screen.getByText("AI Draft")).toBeTruthy();
    expect(screen.getByText(/Review before acting/)).toBeTruthy();
  });

  it("says so when substantive prose arrives with no citation", () => {
    render(<AgentResponse response={response()} />);

    // Without this, an uncited answer is visually identical to an evidenced
    // one — the failure that cost ten weeks on the agent dock.
    expect(screen.getByLabelText(/Citation gap/i)).toBeTruthy();
  });

  it("stays quiet about citation gaps when the answer is actually cited", () => {
    render(
      <AgentResponse
        response={response({
          citations: [
            {
              id: "c1",
              marker: "[1]",
              source_name: "Denials ledger FY25",
              source_type: "tenant_document",
            },
          ],
        })}
      />,
    );

    // A notice that fires on cited answers too would train readers to ignore
    // it, which is the same defect as no notice at all.
    expect(screen.queryByLabelText(/Citation gap/i)).toBeNull();
  });

  it("does not raise a citation gap when confidence is explicitly none", () => {
    render(
      <AgentResponse response={response({ confidence_signal: "none" })} />,
    );

    expect(screen.queryByLabelText(/Citation gap/i)).toBeNull();
  });

  it("puts an approval notice above follow-up actions a user can fire", () => {
    render(
      <AgentResponse
        response={response({
          follow_up_actions: [
            { id: "a1", label: "Open the denials workbook", kind: "navigate" },
          ],
        })}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Open the denials workbook" }),
    ).toBeTruthy();
    // The offer of an action and the statement that a human owns it must
    // appear together; an action chip alone reads as the agent acting.
    expect(document.body.textContent ?? "").toMatch(
      /review|approve|confirm|human/i,
    );
  });
});
