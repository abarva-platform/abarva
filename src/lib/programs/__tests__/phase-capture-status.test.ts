// The badge invariant:
//
//   DONE means the value currently visible in the control is reproducible from
//   authoritative server state after a no-store reload.
//
// These tests exist because a browser test proves the machine works today; only
// a unit test stops it regressing into a completeness decoration.

import {
  resolvePhaseCaptureStatus,
  statusSatisfiesDurabilityInvariant,
  type PhaseCaptureSaveStatus,
  type PhaseCaptureStatusInput,
} from "../phase-capture-status";

const SERVER = "Accountable sponsor is the SVP Flight Operations.";
const EDITED = "Accountable sponsor is the SVP Flight Operations, confirmed.";

function view(input: PhaseCaptureStatusInput) {
  return resolvePhaseCaptureStatus(input);
}

describe("the invariant — complete implies durable", () => {
  it("never reports complete while the draft differs from the server value", () => {
    const v = view({ draft: EDITED, persisted: SERVER });
    expect(v.complete).toBe(false);
    expect(v.label).toBe("Editing");
  });

  it("never reports complete while a save is in flight", () => {
    // Even when the strings match — a save can be in flight for a value that
    // coincidentally equals the last persisted one.
    const v = view({ draft: SERVER, persisted: SERVER, saveStatus: "saving" });
    expect(v.complete).toBe(false);
    expect(v.label).toBe("Saving");
  });

  it("never reports complete after a failed save", () => {
    const v = view({ draft: EDITED, persisted: SERVER, saveStatus: "error" });
    expect(v.complete).toBe(false);
    expect(v.label).toBe("Unsaved");
  });

  it("holds across every combination of draft, persisted and save status", () => {
    const drafts = ["", "  ", SERVER, EDITED];
    const persisteds = ["", "  ", SERVER, EDITED];
    const statuses: (PhaseCaptureSaveStatus | undefined)[] = [
      undefined,
      "editing",
      "saving",
      "saved",
      "error",
    ];
    for (const draft of drafts) {
      for (const persisted of persisteds) {
        for (const saveStatus of statuses) {
          const input = { draft, persisted, saveStatus };
          expect(statusSatisfiesDurabilityInvariant(input, view(input))).toBe(
            true,
          );
        }
      }
    }
  });
});

describe("transitions", () => {
  it("server value with nothing typed reads Done", () => {
    const v = view({ draft: SERVER, persisted: SERVER });
    expect(v).toEqual({ label: "Done", complete: true, tone: "saved" });
  });

  it("typing moves Done to Editing", () => {
    expect(view({ draft: EDITED, persisted: SERVER }).tone).toBe("editing");
  });

  it("save in flight moves Editing to Saving", () => {
    expect(
      view({ draft: EDITED, persisted: SERVER, saveStatus: "saving" }).tone,
    ).toBe("saving");
  });

  it("acknowledgement moves Saving to Done", () => {
    // The server has echoed the new value back; draft and persisted converge.
    expect(
      view({ draft: EDITED, persisted: EDITED, saveStatus: "saved" }),
    ).toEqual({ label: "Done", complete: true, tone: "saved" });
  });

  it("failure moves Saving to Unsaved, not back to Done", () => {
    expect(
      view({ draft: EDITED, persisted: SERVER, saveStatus: "error" }).label,
    ).toBe("Unsaved");
  });
});

describe("empty is not complete", () => {
  it("reports Open when nothing has ever been captured", () => {
    expect(view({ draft: "", persisted: "" })).toEqual({
      label: "Open",
      complete: false,
      tone: "open",
    });
  });

  it("does not treat whitespace as a captured value", () => {
    expect(view({ draft: "   ", persisted: "   " }).complete).toBe(false);
  });

  it("reports Editing when the user clears a previously saved value", () => {
    // Clearing is a real edit and must not read as Open until it is saved.
    const v = view({ draft: "", persisted: SERVER });
    expect(v.label).toBe("Editing");
    expect(v.complete).toBe(false);
  });
});

describe("degenerate input", () => {
  it("treats null and undefined as empty rather than throwing", () => {
    const v = view({
      draft: null as unknown as string,
      persisted: undefined as unknown as string,
    });
    expect(v.complete).toBe(false);
    expect(v.label).toBe("Open");
  });

  it("is not fooled by a draft that differs only in trailing whitespace", () => {
    // Round-trip whitespace drift is still a divergence from the server value,
    // so it must not claim Done — the reload would not reproduce it.
    expect(view({ draft: `${SERVER} `, persisted: SERVER }).complete).toBe(
      false,
    );
  });
});
