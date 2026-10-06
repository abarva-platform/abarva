/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import SourceEventLoading from "@/app/(maestro)/source/events/[eventId]/loading";

describe("Source New event route loading shell", () => {
  it("keeps the operator in the sourcing-event journey while the event loads", () => {
    render(<SourceEventLoading />);

    expect(
      screen.getByRole("region", { name: "Source New event is preparing" }),
    ).toBeTruthy();
    expect(screen.getByText("Opening the governed event.")).toBeTruthy();
    expect(
      screen.getByText(
        "Loading the event stage, files, intelligence, and approval trail.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText("Opening Source command center.")).toBeNull();
    expect(screen.queryByText("Portfolio")).toBeNull();
  });
});
