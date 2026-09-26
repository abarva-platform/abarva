/**
 * @jest-environment jsdom
 */
import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { EvidenceDrawer } from "../EvidenceDrawer";

function DrawerHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open evidence
      </button>
      <EvidenceDrawer
        open={open}
        onClose={() => setOpen(false)}
        kind="Application"
        title="Crew Legality Engine"
        subtitle="Accepted application record"
        evidence={[]}
        onAskAva={() => {}}
      />
    </>
  );
}

describe("EvidenceDrawer accessibility", () => {
  it("focuses the drawer on open, closes with Escape, and restores opener focus", async () => {
    render(<DrawerHarness />);

    const opener = screen.getByRole("button", { name: "Open evidence" });
    opener.focus();
    fireEvent.click(opener);

    const dialog = await screen.findByRole("dialog", {
      name: "Crew Legality Engine",
    });
    expect(dialog).toHaveAccessibleDescription("Accepted application record");

    const close = screen.getByRole("button", {
      name: "Close evidence drawer for Crew Legality Engine",
    });
    await waitFor(() => expect(close).toHaveFocus());

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it("keeps Tab focus inside the drawer controls", async () => {
    render(<DrawerHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Open evidence" }));

    const close = await screen.findByRole("button", {
      name: "Close evidence drawer for Crew Legality Engine",
    });
    const askAva = screen.getByRole("button", { name: "Ask aVa about this" });

    askAva.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(close).toHaveFocus();

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(askAva).toHaveFocus();
  });
});
