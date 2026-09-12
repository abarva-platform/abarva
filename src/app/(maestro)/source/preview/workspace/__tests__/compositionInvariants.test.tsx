/** @jest-environment jsdom */

import {
  expectCleanComposition,
  expectNoIdentifierLeak,
  expectNoRepeatedGovernedSentence,
} from "../test-support/compositionInvariants";

/**
 * The invariants themselves, checked against the shapes that actually shipped.
 *
 * A composition check nobody trusts gets deleted the first time it flags
 * something legitimate, so these pin what it must catch and — just as
 * important — what it must leave alone.
 */

const surface = (html: string): HTMLElement => {
  const root = document.createElement("div");
  root.innerHTML = html;
  return root;
};

describe("expectNoIdentifierLeak", () => {
  it("catches the provenance identifier that shipped", () => {
    const root = surface(
      "<p>Basis: Economics intelligence · system_generated_from_reviewed_sources.</p>",
    );
    expect(() => expectNoIdentifierLeak(root)).toThrow(
      /system_generated_from_reviewed_sources/,
    );
  });

  it("catches the lane caption that shipped", () => {
    const root = surface("<span>contract_pdf · restricted</span>");
    expect(() => expectNoIdentifierLeak(root)).toThrow(/contract_pdf/);
  });

  it("leaves the canonical-record column alone, which is schema on purpose", () => {
    // The anatomy surface documents real table and column names under a
    // heading that says so. That is not a leak, and a check that flagged it
    // would be switched off within the day.
    const root = surface(`
      <div class="sw-c3-anatomy-canonical">
        <p>source.contract</p>
        <code>contract_term</code>
        <code>contract_consumption_observation</code>
      </div>
      <p>Every question this contract type requires has evidence behind it.</p>
    `);
    expect(() => expectNoIdentifierLeak(root)).not.toThrow();
  });

  it("does not mistake a contract or document id for an identifier", () => {
    const root = surface(
      "<p>MER-TECH-DBX-001 and DOC-MER-TECH-DBX-001-ORDER are loaded.</p>",
    );
    expect(() => expectNoIdentifierLeak(root)).not.toThrow();
  });
});

describe("expectNoRepeatedGovernedSentence", () => {
  const reason =
    "This archetype is governed by consumption, entitlement, or commercial evidence; SLA and service-credit performance is not a required lane unless the contract declares it.";

  it("catches the applicability reason four times, as it shipped", () => {
    const root = surface(
      [
        `<div class="card"><p>${reason}</p></div>`,
        `<div class="panel"><p>${reason}</p></div>`,
        `<div class="readout"><p>${reason}</p></div>`,
        `<div class="statement"><p>${reason}</p></div>`,
      ].join(""),
    );
    expect(() => expectNoRepeatedGovernedSentence(root)).toThrow(/4x/);
  });

  it("passes when the same claim is stated once", () => {
    const root = surface(
      `<div class="card"><p>${reason}</p></div><p>Not a gap — a state.</p>`,
    );
    expect(() => expectNoRepeatedGovernedSentence(root)).not.toThrow();
  });

  it("leaves short repeated labels alone", () => {
    // Column headings, state chips and lane names repeat by design.
    const root = surface(`
      <span>Loaded</span><span>Loaded</span><span>Loaded</span>
      <span>Not required</span><span>Not required</span>
      <th>Candidate</th><th>Candidate</th>
    `);
    expect(() => expectNoRepeatedGovernedSentence(root)).not.toThrow();
  });

  it("counts a sentence repeated across tabs of one render", () => {
    const clause =
      "Evidence basis: annual value loaded; end date loaded; 6 document page rows; 6 opportunity rows.";
    const root = surface(
      `<section>${clause}</section><aside>${clause}</aside>`,
    );
    expect(() => expectNoRepeatedGovernedSentence(root)).toThrow(/2x/);
  });
});

describe("expectCleanComposition", () => {
  it("reports the identifier first when a surface has both faults", () => {
    const long =
      "Committed capacity runs materially ahead of observed consumption across the twelve loaded months.";
    const root = surface(
      `<p>${long}</p><p>${long}</p><p>Basis: draft_gap.</p>`,
    );
    expect(() => expectCleanComposition(root)).toThrow(/draft_gap/);
  });

  it("passes a surface that states each claim once and leaks nothing", () => {
    const root = surface(`
      <p>Capacity bought ahead of use: $1.6M committed, 4% of it drawn on.</p>
      <p>$1.48M of committed capacity was not drawn on. This is the shape of the renegotiation, not the size of the ask.</p>
      <p>Basis: Economics intelligence · generated from reviewed rows.</p>
    `);
    expect(() => expectCleanComposition(root)).not.toThrow();
  });
});
