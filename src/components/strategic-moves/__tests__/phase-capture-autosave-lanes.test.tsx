/**
 * @jest-environment jsdom
 */

// Regression guard for the character-loss defect in phase capture.
//
// The badge tests in src/lib/programs/__tests__/phase-capture-status.test.ts
// assert what the UI *says*. This file asserts the thing that actually broke:
// fast typing must not lose characters. Someone could move the status write
// back into the autosave effect's body and every one of those tests would
// still pass.
//
// THE MECHANISM
//
// An input event commits on React's SyncLane, and React flushes passive
// effects synchronously inside that commit. A setState in an effect BODY
// therefore leaves DefaultLane work pending on every keystroke, so React's
// nested-update counter never resets and eventually throws "Maximum update
// depth exceeded". The throw surfaces inside the textarea's own onChange, and
// React's controlled-input restore runs in a `finally` — so it writes the
// stale committed value back to the DOM and the keystroke is destroyed.
//
// The user sees no error. The character simply does not appear.
//
// WHY THIS TEST LOOKS UNUSUAL
//
// It renders through `createRoot` and dispatches native input events instead
// of using React Testing Library. That is load-bearing: RTL wraps interactions
// in `act()`, which changes the exact scheduling semantics that cause this
// defect. Under `act()` the effect-body variant loses ZERO characters and the
// bug is invisible. Verified, not assumed — an RTL version of this test passed
// against the broken code.
//
// The harness reproduces the topology rather than mounting the real 5,000-line
// phase page: values state, a dirty-key set derived from it, an autosave effect
// whose deps get fresh identity every keystroke (matching the real effect's
// deps: move.id, phase.phase, phaseCaptureDirtyKeys, phaseCaptureRevision,
// phaseCaptureValues), and a controlled textarea. The two variants differ in
// exactly one thing: where the status write is scheduled.

import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";

type SaveStatus = "editing" | "saving" | "saved";
type Scheduling = "effect-body" | "timer";

function CaptureHarness({ scheduleIn }: { scheduleIn: Scheduling }) {
  const [values, setValues] = useState<Record<string, string>>({ a: "" });
  const [, setSaveStatus] = useState<Record<string, SaveStatus>>({});

  const dirtyKeys = useMemo(
    () => Object.keys(values).filter((key) => values[key] !== ""),
    [values],
  );

  useEffect(() => {
    if (dirtyKeys.length === 0) return;

    if (scheduleIn === "effect-body") {
      // The defect as it shipped: a DefaultLane update scheduled from an
      // effect that React flushed synchronously inside a SyncLane commit.
      setSaveStatus((prev) => {
        const next = { ...prev };
        for (const key of dirtyKeys) next[key] = "saving";
        return next;
      });
    }

    const timer = window.setTimeout(() => {
      if (scheduleIn === "timer") {
        // The fix: the keystroke commit leaves no React lane pending, only a
        // setTimeout, which React does not track.
        setSaveStatus((prev) => {
          const next = { ...prev };
          for (const key of dirtyKeys) next[key] = "saving";
          return next;
        });
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [values, dirtyKeys, scheduleIn]);

  return (
    <textarea
      aria-label="capture"
      onChange={(event) =>
        setValues((prev) => ({ ...prev, a: event.target.value }))
      }
      value={values.a}
    />
  );
}

interface TypingResult {
  /** React errors raised while typing. */
  errors: number;
  /** Characters that never made it into the control. */
  lost: number;
  finalValue: string;
}

/**
 * Mount the harness, type `text` one character at a time via native input
 * events, and report what survived.
 */
function typeInto(scheduleIn: Scheduling, text: string): TypingResult {
  // React's act() would mask the defect entirely — see the header comment.
  (
    globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = false;

  let errors = 0;
  // React reports the nested-update error through jsdom's uncaught-error path
  // rather than by throwing out of dispatchEvent, so we count it here.
  const onError = (event: ErrorEvent) => {
    if (/Maximum update depth exceeded/.test(event.message)) {
      errors += 1;
      event.preventDefault();
    }
  };
  window.addEventListener("error", onError);
  const consoleError = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  try {
    flushSync(() => root.render(<CaptureHarness scheduleIn={scheduleIn} />));
    const field = container.querySelector("textarea") as HTMLTextAreaElement;

    // Bypass React's value tracker the way a real keypress does.
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    )!.set!;

    for (const char of text) {
      nativeSetter.call(field, field.value + char);
      field.dispatchEvent(new Event("input", { bubbles: true }));
    }

    return {
      errors,
      lost: text.length - field.value.length,
      finalValue: field.value,
    };
  } finally {
    root.unmount();
    container.remove();
    consoleError.mockRestore();
    window.removeEventListener("error", onError);
  }
}

const LONG_ANSWER = (
  "The accountable sponsor is the SVP Flight Operations, who chairs the " +
  "weekly operations review and holds budget authority for the turnaround " +
  "programme. Decisions escalate to the COO only where they change the " +
  "published schedule or affect crew rostering agreements. "
).repeat(2);

describe("the control case — this harness really does reproduce the defect", () => {
  // Without this, every test below would pass just as happily against a
  // codebase where the bug never existed, which would make them decoration
  // rather than a guard.
  it("effect-body scheduling loses characters; timer scheduling does not", () => {
    const typed = "z".repeat(300);

    const broken = typeInto("effect-body", typed);
    const fixed = typeInto("timer", typed);

    expect(broken.errors).toBeGreaterThan(0);
    expect(broken.lost).toBeGreaterThan(0);
    // One lost character per error: the controlled-input restore in React's
    // `finally` writes the stale committed value back over the keystroke.
    expect(broken.lost).toBe(broken.errors);

    expect(fixed.errors).toBe(0);
    expect(fixed.lost).toBe(0);
  });
});

describe("phase capture autosave — fast typing", () => {
  it("does not lose a single character over a long, fast answer", () => {
    expect(LONG_ANSWER.length).toBeGreaterThan(500);

    const result = typeInto("timer", LONG_ANSWER);

    expect(result.errors).toBe(0);
    expect(result.lost).toBe(0);
    expect(result.finalValue).toBe(LONG_ANSWER);
  });

  it("holds well past React's nested-update limit", () => {
    // The limit is 50; the live app threw roughly every 53 characters.
    const result = typeInto("timer", "y".repeat(600));

    expect(result.errors).toBe(0);
    expect(result.finalValue.length).toBe(600);
  });

  it("survives characters that are not plain ASCII", () => {
    const text = "Résumé — 90% on-time, ±3 pts, “target” vs actual. ".repeat(8);

    const result = typeInto("timer", text);

    expect(result.lost).toBe(0);
    expect(result.finalValue).toBe(text);
  });
});
