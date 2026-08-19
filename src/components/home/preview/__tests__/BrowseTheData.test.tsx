/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

import { BrowseTheData } from "../BrowseTheData";
import { getHomeReviewBundle } from "@/lib/home/preview/golden-snapshot";

describe("BrowseTheData", () => {
  const bundle = getHomeReviewBundle("meridian-health")!;

  it("shows every signal and context item with no filter applied", () => {
    render(<BrowseTheData signalPacket={bundle.thesis.signalPacket} />);
    const total = bundle.thesis.signalPacket.signals.length + bundle.thesis.signalPacket.contextItems.length;
    expect(screen.getByText(`${total} of ${total} shown`)).toBeInTheDocument();
  });

  it("narrows results on search text", () => {
    render(<BrowseTheData signalPacket={bundle.thesis.signalPacket} />);
    const target = bundle.thesis.signalPacket.signals[0];
    const searchTerm = target.statement.split(" ").find((w) => w.length > 5) ?? target.statement.slice(0, 8);
    fireEvent.change(screen.getByLabelText("Search facts"), { target: { value: searchTerm } });
    expect(screen.getByText(target.statement)).toBeInTheDocument();
  });

  it("shows an honest empty state for a search matching nothing", () => {
    render(<BrowseTheData signalPacket={bundle.thesis.signalPacket} />);
    fireEvent.change(screen.getByLabelText("Search facts"), { target: { value: "zzz_no_such_fact_zzz" } });
    expect(screen.getByText("No facts match this search.")).toBeInTheDocument();
  });
});
