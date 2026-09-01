/**
 * @jest-environment jsdom
 */

/**
 * The surface reports an unserved record; it does not crash on one.
 *
 * The projection reader throws when it gets no rows, and that exception reached the browser as an
 * application error on the page a client opens first. These tests hold two lines: the page renders,
 * and it does not invent numbers to fill the gap.
 */
import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import { HomeRecordNotServed } from "../HomeRecordNotServed";

describe("an unserved record", () => {
  it("renders rather than throwing", () => {
    expect(() =>
      render(<HomeRecordNotServed tenantKey="meridian-health" />),
    ).not.toThrow();
  });

  it("says the read returned nothing, in the reader's words", () => {
    render(<HomeRecordNotServed tenantKey="meridian-health" />);
    expect(screen.getByText(/not being served right now/i)).toBeInTheDocument();
    expect(
      screen.getByText(/that read returned\s+nothing/i),
    ).toBeInTheDocument();
  });

  it("shows no figure at all, rather than a stale or zero one", () => {
    const { container } = render(
      <HomeRecordNotServed tenantKey="meridian-health" />,
    );
    // A count here would be read as this client's count. There is no count to show.
    expect(container.textContent ?? "").not.toMatch(
      /\b\d[\d,]*\s+(applications|contracts|platforms|records|rows)\b/i,
    );
    expect(container.textContent ?? "").not.toMatch(/\b0\b/);
  });

  it("carries no builder vocabulary", () => {
    const { container } = render(
      <HomeRecordNotServed tenantKey="meridian-health" />,
    );
    const text = container.textContent ?? "";
    for (const pattern of [
      /\bECL\b/,
      /\bprojection\b/i,
      /\bassessment-/i,
      /\bserving\b/i,
      /\b500\b/,
      /\bexception\b/i,
    ]) {
      expect(text).not.toMatch(pattern);
    }
  });
});
