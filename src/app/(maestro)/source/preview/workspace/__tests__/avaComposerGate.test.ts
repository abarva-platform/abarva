import { sourceAvaComposerDisabledReason } from "../avaComposerGate";

describe("sourceAvaComposerDisabledReason", () => {
  it("keeps aVa open on non-contract surfaces", () => {
    expect(
      sourceAvaComposerDisabledReason({
        sourceContract360Mode: false,
        detailState: "loading",
      }),
    ).toBeNull();
  });

  it("keeps aVa open once selected contract detail is ready", () => {
    expect(
      sourceAvaComposerDisabledReason({
        sourceContract360Mode: true,
        detailState: "ready",
      }),
    ).toBeNull();
  });

  it("blocks contract-specific aVa asks until governed detail is loaded", () => {
    expect(
      sourceAvaComposerDisabledReason({
        sourceContract360Mode: true,
        detailState: "loading",
      }),
    ).toBe("Loading governed contract context before aVa can answer.");

    expect(
      sourceAvaComposerDisabledReason({
        sourceContract360Mode: true,
        detailState: "idle",
      }),
    ).toBe("Loading governed contract context before aVa can answer.");
  });

  it("keeps failed contract context from being sent as a grounded ask", () => {
    expect(
      sourceAvaComposerDisabledReason({
        sourceContract360Mode: true,
        detailState: "error",
      }),
    ).toBe(
      "Contract context could not load. Reopen the contract before asking aVa.",
    );
  });
});
