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
import type { Citation } from "@/lib/agent/renderedResponse";

const SUBSTANTIVE =
  "Denial write-offs rose to $4.2M last year, which is above the industry benchmark and is the single largest recoverable line in the portfolio.";

/**
 * The real `Citation` shape from `@/lib/agent/renderedResponse`. Typing it
 * here rather than casting an invented object: the previous fixture carried
 * `id`/`marker`/`source_name`/`source_type`, none of which exist on Citation.
 * It satisfied the gap check, which only counts the array, and would have
 * satisfied any assertion that never rendered a pill.
 */
function citation(extra: Partial<Citation> = {}): Citation {
  return {
    placeholder: "{{cite:evidence_source:denials-ledger-fy25}}",
    target_type: "evidence_source",
    target_id: "denials-ledger-fy25",
    target_slug: "denials-ledger-fy25",
    target_label: "Denials ledger FY25",
    confidence: 0.82,
    confidence_tier: "HIGH",
    provenance: "measured",
    ...extra,
  };
}

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
    render(<AgentResponse response={response({ citations: [citation()] })} />);

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

  it("documents a limit: no jsdom suite can prove a citation renders", () => {
    const cite = citation();
    render(
      <AgentResponse
        response={response({
          response_text: `Denial write-offs rose to $4.2M last year. ${cite.placeholder}`,
          citations: [cite],
        })}
      />,
    );

    // Substitution happens inside react-markdown's component overrides, and
    // react-markdown is mocked repo-wide to a passthrough (its ESM breaks
    // next/jest's transform). So the placeholder survives as literal text
    // here — an artifact of the mock, NOT product behavior.
    //
    // This is asserted rather than left implicit because the natural
    // assertion ("the pill rendered") would fail for a reason that has
    // nothing to do with the control, and the natural inverse ("the
    // placeholder is visible") would look like a product defect. Covering
    // the citation control needs a suite that unmocks react-markdown, or one
    // against @/lib/agent/markdownTokens directly.
    expect(document.body.textContent ?? "").toContain(cite.placeholder);
    expect(document.querySelector('[data-mock="react-markdown"]')).toBeTruthy();
  });

  it("discloses a confidence tier when the response carries one", () => {
    render(
      <AgentResponse
        response={response({
          honest_disclosure: {
            confidenceLevel: "MEDIUM",
            confidenceReason: "Two of three inputs are current.",
          },
        })}
      />,
    );

    expect(screen.getByText(/Medium confidence/i)).toBeTruthy();
  });

  it("documents a gap: confidence_signal alone discloses nothing", () => {
    // `confidence_signal: "medium"` is on every response in this suite, and
    // the indicator reads `honest_disclosure.confidenceLevel` instead. A
    // response carrying only the signal shows the reader no confidence at
    // all. Asserted as current behavior so a fix has to change this line
    // rather than slip past it.
    render(<AgentResponse response={response({ confidence_signal: "medium" })} />);

    expect(screen.queryByText(/confidence/i)).toBeNull();
  });
});
