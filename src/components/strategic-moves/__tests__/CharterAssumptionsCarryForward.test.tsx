/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { CharterAssumptionsCarryForward } from "../CharterAssumptionsCarryForward";
import type { CarriedCharterAssumption } from "@/lib/programs/charter-assumptions-carry-forward";

const scopeAssumption: CarriedCharterAssumption = {
  sectionKey: "scope_boundary",
  label: "Scope boundary",
  answer: "Claims intake only, excluding adjudication.",
  owner: "Head of Shared Services",
  validationPlan: "Confirm against the Q3 volume extract in Discover.",
  recordedAt: "2026-10-05T09:00:00.000Z",
};

const sponsorAssumption: CarriedCharterAssumption = {
  sectionKey: "sponsor_commitment",
  label: "Sponsor contact and progress updates",
  answer: "Sponsor has committed two days a month.",
  owner: "Programme lead",
  validationPlan: "Ask the sponsor to confirm the cadence in the kickoff.",
  recordedAt: "2026-10-05T09:05:00.000Z",
};

const panel = () => screen.queryByTestId("charter-assumptions-carry-forward");

/**
 * The panel's rendered words, with each text node separated.
 *
 * `textContent` concatenates adjacent elements with no separator, so a row
 * reading "Scope boundary" + "Backed by evidence" arrives as
 * "Scope boundaryBacked by evidence" and a `\b`-anchored pattern silently
 * fails to match the very wording it exists to forbid. Joining the text nodes
 * (and dropping the inlined <style>) keeps word boundaries real.
 */
function visibleText(root: Element | null): string {
  if (!root) return "";
  const parts: string[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) parts.push(text);
      return;
    }
    if ((node as Element).tagName?.toLowerCase() === "style") return;
    node.childNodes.forEach(walk);
  };
  walk(root);
  return parts.join(" ");
}

describe("CharterAssumptionsCarryForward", () => {
  it("renders nothing when the surface is inactive (null)", () => {
    render(<CharterAssumptionsCarryForward assumptions={null} />);
    expect(panel()).not.toBeInTheDocument();
  });

  it("renders nothing when active with no open assumption", () => {
    render(<CharterAssumptionsCarryForward assumptions={[]} />);
    expect(panel()).not.toBeInTheDocument();
  });

  it("names the field, the owner and the validation plan for each assumption", () => {
    render(
      <CharterAssumptionsCarryForward
        assumptions={[scopeAssumption, sponsorAssumption]}
      />,
    );
    expect(panel()).toHaveAttribute("data-count", "2");
    for (const row of [scopeAssumption, sponsorAssumption]) {
      expect(screen.getByText(row.label)).toBeInTheDocument();
      expect(screen.getByText(row.owner)).toBeInTheDocument();
      expect(screen.getByText(row.validationPlan)).toBeInTheDocument();
      expect(screen.getByText(row.answer)).toBeInTheDocument();
    }
  });

  it("agrees in number with one assumption", () => {
    render(<CharterAssumptionsCarryForward assumptions={[scopeAssumption]} />);
    // The singular reading must be a whole sentence, not a fragment a plural
    // headline would also satisfy.
    expect(
      screen.getByText(
        /1 charter answer is still an assumption\. Discover is where it gets confirmed or corrected\./,
      ),
    ).toBeInTheDocument();
  });

  it("agrees in number with several assumptions", () => {
    render(
      <CharterAssumptionsCarryForward
        assumptions={[scopeAssumption, sponsorAssumption]}
      />,
    );
    expect(
      screen.getByText(
        /2 charter answers are still an assumption\. Discover is where they get confirmed or corrected\./,
      ),
    ).toBeInTheDocument();
  });

  it("never describes a carried assumption as evidence-covered", () => {
    render(
      <CharterAssumptionsCarryForward
        assumptions={[scopeAssumption, sponsorAssumption]}
      />,
    );
    // Guard the panel's AUTHORED chrome, with the user-supplied strings
    // removed: the plan a person types may legitimately say "verify", and the
    // lede legitimately DENIES coverage ("none ... counts as established
    // fact"), so matching raw panel text would fail on correct copy and pass
    // on a wrong badge. What a defect emits is an affirmative coverage claim
    // attached to a row, which survives in the chrome below.
    let chrome = visibleText(panel());
    for (const row of [scopeAssumption, sponsorAssumption]) {
      for (const supplied of [row.answer, row.owner, row.validationPlan]) {
        chrome = chrome.split(supplied).join(" ");
      }
    }
    // The lede's denial is a sentence we own; drop it so only claims remain.
    chrome = chrome.replace(
      /These completed the charter without evidence behind them\. None of them counts as established fact, and none is covered by evidence[^.]*\./,
      " ",
    );
    expect(chrome).not.toMatch(
      /\b(evidence[- ]covered|covered by evidence|backed by evidence|evidenced|verified|established fact)\b/i,
    );
    // ...and the denial really was present to be dropped.
    expect(visibleText(panel())).toMatch(/none is covered by evidence/i);
    expect(chrome).toMatch(/still an assumption/i);
  });

  it("marks every row as open rather than only the first", () => {
    render(
      <CharterAssumptionsCarryForward
        assumptions={[scopeAssumption, sponsorAssumption]}
      />,
    );
    expect(screen.getAllByText("Assumption · open")).toHaveLength(2);
  });

  it("omits the answer line when the stored answer is blank", () => {
    render(
      <CharterAssumptionsCarryForward
        assumptions={[{ ...scopeAssumption, answer: "" }]}
      />,
    );
    expect(panel()).toBeInTheDocument();
    expect(screen.getByText(scopeAssumption.owner)).toBeInTheDocument();
    expect(panel()?.querySelector(".cac-answer")).not.toBeInTheDocument();
  });
});
