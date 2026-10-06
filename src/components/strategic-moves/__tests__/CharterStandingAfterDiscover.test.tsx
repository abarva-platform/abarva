/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { CharterStandingAfterDiscover } from "../CharterStandingAfterDiscover";
import type {
  KnownWrongCharterAnswer,
  UnvalidatedCharterAnswer,
} from "@/lib/programs/charter-standing-after-discover";

const unvalidated: UnvalidatedCharterAnswer = {
  sectionKey: "scope_boundary",
  label: "Scope boundary",
  answer: "Intake only, excluding downstream adjudication.",
  owner: "Head of Shared Services",
  recordedAt: "2026-10-05T09:00:00.000Z",
  standing: "unvalidated",
  plannedValidation: "Confirm against the volume extract in Discover.",
};

const knownWrong: KnownWrongCharterAnswer = {
  sectionKey: "value_hypothesis",
  label: "Value hypothesis",
  answer: "Around 40% of effort is manual rekeying.",
  owner: "Programme lead",
  recordedAt: "2026-10-05T09:05:00.000Z",
  standing: "known_wrong",
  correction: "Discover measured 12%; the rekeying sits in a second team.",
  resolvedAt: "2026-10-05T17:30:00.000Z",
};

const panel = () => screen.queryByTestId("charter-standing-after-discover");

/**
 * The panel's rendered words, with each text node separated. `textContent`
 * concatenates adjacent elements with no separator, so a row reading
 * "Scope boundary" + "Unvalidated" arrives as "Scope boundaryUnvalidated" and
 * a `\b`-anchored pattern silently fails to match the wording it exists to
 * forbid. Joining text NODES keeps word boundaries real.
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

describe("CharterStandingAfterDiscover", () => {
  it("renders nothing when the surface is inactive (null)", () => {
    render(<CharterStandingAfterDiscover rows={null} />);
    expect(panel()).not.toBeInTheDocument();
  });

  it("renders nothing when active and every answer stands clean", () => {
    // `[]` is a real all-clear, but this panel's whole subject is the answers
    // that carry a caveat, so it must not announce an empty charter as clean.
    render(<CharterStandingAfterDiscover rows={[]} />);
    expect(panel()).not.toBeInTheDocument();
  });

  it("separates the two standings into their own groups", () => {
    render(<CharterStandingAfterDiscover rows={[unvalidated, knownWrong]} />);
    const groupWrong = screen.getByTestId("csad-known-wrong");
    const groupOpen = screen.getByTestId("csad-unvalidated");
    // Each row belongs to exactly one group — a known-wrong answer read as
    // merely unchecked would understate it.
    expect(visibleText(groupWrong)).toContain("Value hypothesis");
    expect(visibleText(groupWrong)).not.toContain("Scope boundary");
    expect(visibleText(groupOpen)).toContain("Scope boundary");
    expect(visibleText(groupOpen)).not.toContain("Value hypothesis");
  });

  it("omits a group entirely when no row carries that standing", () => {
    render(<CharterStandingAfterDiscover rows={[unvalidated]} />);
    expect(screen.queryByTestId("csad-known-wrong")).not.toBeInTheDocument();
    expect(screen.getByTestId("csad-unvalidated")).toBeInTheDocument();
  });

  it("states what Discover found against a corrected answer", () => {
    render(<CharterStandingAfterDiscover rows={[knownWrong]} />);
    const text = visibleText(panel());
    // Both halves: the wording the charter still carries, AND the correction.
    // Showing only one of them is what made the standing unreadable before.
    expect(text).toContain("Around 40% of effort is manual rekeying.");
    expect(text).toContain(
      "Discover measured 12%; the rekeying sits in a second team.",
    );
    expect(text).toContain("Known wrong");
  });

  it("names the owner and the validation that was planned but never done", () => {
    render(<CharterStandingAfterDiscover rows={[unvalidated]} />);
    const text = visibleText(panel());
    expect(text).toContain("Head of Shared Services");
    expect(text).toContain("Confirm against the volume extract in Discover.");
    expect(text).toContain("Unvalidated");
  });

  it("counts the rows it is showing, per standing", () => {
    render(<CharterStandingAfterDiscover rows={[unvalidated, knownWrong]} />);
    const root = panel();
    // Read off the rendered attributes rather than a copy literal: a count
    // derived from display wording reports the wrong thing when wording moves.
    expect(root).toHaveAttribute("data-count", "2");
    expect(root).toHaveAttribute("data-known-wrong", "1");
    expect(root).toHaveAttribute("data-unvalidated", "1");
    // `textContent`, not `visibleText`, for THIS reading: the plural "s" is a
    // separate JSX expression, so joining text nodes would split "answers"
    // into "answer s". The negative assertions below need the opposite
    // treatment, which is why both readings are used in this suite.
    expect(root?.textContent).toContain("2 charter answers should not be");
  });

  it("never renders a caveated answer in evidence wording", () => {
    render(<CharterStandingAfterDiscover rows={[unvalidated, knownWrong]} />);
    const text = visibleText(panel());
    // The whole point is that these answers are NOT established. Any of these
    // words beside them would say the opposite of the panel's subject.
    expect(text).not.toMatch(/backed by evidence|verified|confirmed|approved/i);
  });

  it("renders a row with no answer text without inventing one", () => {
    render(
      <CharterStandingAfterDiscover
        rows={[{ ...unvalidated, answer: "" }]}
      />,
    );
    const text = visibleText(panel());
    expect(text).toContain("Scope boundary");
    expect(text).toContain("Head of Shared Services");
  });
});
