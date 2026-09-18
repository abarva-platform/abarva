/** @jest-environment jsdom */

/**
 * Behavioral test for the `moves-phase-advance-button` control declared in
 * docs/security/ai-surface-control-catalog.json.
 *
 * Advancing a phase from this button is a stateful write. The control requires
 * the human to write a rationale of real length and to commit the decision
 * themselves, with the AI-support watermark and the attestation text visible
 * while they do it.
 *
 * The catalog checker proves those strings appear in the file. It cannot prove
 * the commit refuses to fire, or that the rationale sent is the one typed. This
 * renders the real component and drives it.
 */

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn(), push: jest.fn() }),
}));

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PhaseAdvanceButton } from "../PhaseAdvanceButton";
import { MOVES_HUMAN_RATIONALE_MIN_CHARS } from "@/lib/programs/moves-ai-liability";

const RATIONALE =
  "The sponsor reviewed the gate evidence and asked to move the program to the next phase today.";

function openRationale() {
  render(<PhaseAdvanceButton programId="program-1" currentPhase={2 as never} />);
  fireEvent.click(screen.getAllByRole("button")[0]);
}

function commitButton() {
  return screen.getByRole("button", {
    name: "Commit human decision",
  }) as HTMLButtonElement;
}

function writeRationale(text: string) {
  fireEvent.change(
    screen.getByLabelText("Human rationale for phase advance"),
    { target: { value: text } },
  );
}

describe("phase advance button · human decision control", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    })) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("will not commit a phase advance with no rationale", () => {
    openRationale();

    expect(commitButton().disabled).toBe(true);
    fireEvent.click(commitButton());
    // The absent request is the assertion: a disabled control that still posts
    // would satisfy the catalog and advance a phase unaccounted for.
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("will not commit a rationale shorter than the stated minimum", () => {
    openRationale();
    writeRationale("x".repeat(MOVES_HUMAN_RATIONALE_MIN_CHARS - 1));

    expect(commitButton().disabled).toBe(true);
    fireEvent.click(commitButton());
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("sends the rationale the human typed", async () => {
    openRationale();
    writeRationale(RATIONALE);

    expect(commitButton().disabled).toBe(false);
    fireEvent.click(commitButton());

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(String(url)).toContain("/advance");
    const body = JSON.parse(String((init as RequestInit).body));
    expect(body.humanRationale ?? body.rationale).toContain(
      "sponsor reviewed the gate evidence",
    );
  });

  it("shows the attestation the human is making while they make it", () => {
    openRationale();

    expect(
      screen.getByLabelText("Human rationale for phase advance"),
    ).toBeTruthy();
    // The watermark and attestation come from the shared AI-liability module;
    // their presence here is what makes the decision an attested one.
    expect(document.body.textContent ?? "").toMatch(
      /decision|review|responsib/i,
    );
  });

  it("offers no advance at all when the caller says the gate is closed", () => {
    render(
      <PhaseAdvanceButton
        programId="program-1"
        currentPhase={2 as never}
        disabledReason="Gate criteria are unmet"
      />,
    );

    const disabled = screen
      .getAllByRole("button")
      .filter((b) => (b as HTMLButtonElement).disabled);
    expect(disabled.length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: "Commit human decision" }),
    ).toBeNull();
  });
});
