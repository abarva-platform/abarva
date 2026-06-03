/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { EventLifecycleStatusBadge } from "../EventLifecycleStatusBadge";

describe("EventLifecycleStatusBadge", () => {
  it("explains waiting_on_client with a tooltip", () => {
    render(<EventLifecycleStatusBadge status="waiting_on_client" />);

    expect(screen.getByText("Waiting on Client")).toHaveAttribute(
      "title",
      expect.stringContaining("named client-side approval"),
    );
  });
});
