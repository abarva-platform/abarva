/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { CaptureNotesFill } from "../CaptureNotesFill";
import type { CaptureNotesTarget } from "@/lib/programs/capture-notes-proposal";

const TARGETS: CaptureNotesTarget[] = [
  {
    section: {
      key: "sponsor_commitment",
      label: "Sponsor commitment",
      description:
        "The named executive sponsor, their cadence of progress updates, and what they have committed.",
      required: true,
    },
    value: "",
  },
  {
    section: {
      key: "scope_boundary",
      label: "Scope boundary",
      description:
        "The boundary of this Move: which queues, systems, and cohorts are excluded.",
      required: true,
    },
    value: "",
  },
];

const NOTES = [
  "Sponsor is the COO; she committed to a fortnightly cadence of progress updates.",
  "",
  "Excluded queues: the billing systems and the offshore cohorts stay outside the boundary.",
].join("\n");

const paste = (text: string) => {
  fireEvent.click(screen.getByTestId("capture-notes-open"));
  fireEvent.change(screen.getByTestId("capture-notes-input"), {
    target: { value: text },
  });
};

describe("CaptureNotesFill", () => {
  it("starts collapsed and proposes nothing until asked", () => {
    const onInsert = jest.fn();
    render(<CaptureNotesFill targets={TARGETS} onInsert={onInsert} />);

    expect(screen.getByTestId("capture-notes-open")).toBeInTheDocument();
    expect(screen.queryByTestId("capture-notes-fill")).not.toBeInTheDocument();
    expect(onInsert).not.toHaveBeenCalled();
  });

  it("writes nothing on paste alone — only an explicit Insert writes", () => {
    const onInsert = jest.fn();
    render(<CaptureNotesFill targets={TARGETS} onInsert={onInsert} />);

    paste(NOTES);
    expect(onInsert).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("capture-notes-propose"));
    expect(
      screen.getByTestId("capture-notes-proposal-sponsor_commitment"),
    ).toBeInTheDocument();
    // Proposing is still not writing.
    expect(onInsert).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByTestId("capture-notes-insert-sponsor_commitment"),
    );
    expect(onInsert).toHaveBeenCalledTimes(1);
    expect(onInsert).toHaveBeenCalledWith(
      "sponsor_commitment",
      "Sponsor is the COO; she committed to a fortnightly cadence of progress updates.",
    );
  });

  it("inserts the pasted words verbatim, not a rewrite", () => {
    const onInsert = jest.fn();
    render(<CaptureNotesFill targets={TARGETS} onInsert={onInsert} />);

    paste(NOTES);
    fireEvent.click(screen.getByTestId("capture-notes-propose"));
    fireEvent.click(screen.getByTestId("capture-notes-insert-scope_boundary"));

    const [, inserted] = onInsert.mock.calls[0] as [string, string];
    expect(NOTES).toContain(inserted);
  });

  it("says a note-derived fill is an assertion and never calls it evidence", () => {
    render(<CaptureNotesFill targets={TARGETS} onInsert={jest.fn()} />);

    paste(NOTES);
    fireEvent.click(screen.getByTestId("capture-notes-propose"));

    const warning = screen.getByTestId("capture-notes-basis-warning");
    expect(warning).toHaveTextContent(/your assertion/i);
    expect(warning).toHaveTextContent(/not as approved evidence/i);

    const panel = screen.getByTestId("capture-notes-fill");
    expect(panel.textContent ?? "").not.toMatch(/evidence covered/i);
    expect(panel.textContent ?? "").not.toMatch(/backed by evidence/i);
  });

  it("shows the source line and the matched words as the reason", () => {
    render(<CaptureNotesFill targets={TARGETS} onInsert={jest.fn()} />);

    paste(NOTES);
    fireEvent.click(screen.getByTestId("capture-notes-propose"));

    const item = screen.getByTestId(
      "capture-notes-proposal-sponsor_commitment",
    );
    expect(item).toHaveTextContent(/line 1 · matched/);
  });

  it("drops a dismissed proposal without writing it", () => {
    const onInsert = jest.fn();
    render(<CaptureNotesFill targets={TARGETS} onInsert={onInsert} />);

    paste(NOTES);
    fireEvent.click(screen.getByTestId("capture-notes-propose"));
    fireEvent.click(
      screen.getByTestId("capture-notes-dismiss-sponsor_commitment"),
    );

    expect(
      screen.queryByTestId("capture-notes-proposal-sponsor_commitment"),
    ).not.toBeInTheDocument();
    expect(onInsert).not.toHaveBeenCalled();
    // The other proposal survives.
    expect(
      screen.getByTestId("capture-notes-proposal-scope_boundary"),
    ).toBeInTheDocument();
  });

  it("retires a proposal once inserted, so it cannot be inserted twice", () => {
    const onInsert = jest.fn();
    render(<CaptureNotesFill targets={TARGETS} onInsert={onInsert} />);

    paste(NOTES);
    fireEvent.click(screen.getByTestId("capture-notes-propose"));
    fireEvent.click(
      screen.getByTestId("capture-notes-insert-sponsor_commitment"),
    );

    expect(
      screen.queryByTestId("capture-notes-insert-sponsor_commitment"),
    ).not.toBeInTheDocument();
    expect(onInsert).toHaveBeenCalledTimes(1);
  });

  it("reports an answered field as left untouched rather than proposing over it", () => {
    const answered: CaptureNotesTarget[] = [
      { ...TARGETS[0], value: "The CFO sponsors this, monthly." },
      TARGETS[1],
    ];
    render(<CaptureNotesFill targets={answered} onInsert={jest.fn()} />);

    paste(NOTES);
    fireEvent.click(screen.getByTestId("capture-notes-propose"));

    expect(
      screen.queryByTestId("capture-notes-proposal-sponsor_commitment"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("capture-notes-skipped-answered"),
    ).toHaveTextContent(/1 question already answered/i);
  });

  it("cannot propose from empty notes", () => {
    render(<CaptureNotesFill targets={TARGETS} onInsert={jest.fn()} />);

    fireEvent.click(screen.getByTestId("capture-notes-open"));
    expect(screen.getByTestId("capture-notes-propose")).toBeDisabled();
  });

  it("says plainly when nothing matched instead of inventing a fill", () => {
    render(<CaptureNotesFill targets={TARGETS} onInsert={jest.fn()} />);

    paste("The weather in the office was unremarkable today.");
    fireEvent.click(screen.getByTestId("capture-notes-propose"));

    expect(screen.getByTestId("capture-notes-empty")).toHaveTextContent(
      /No passage matched an unanswered question/i,
    );
  });

  it("clears stale proposals when the notes are edited", () => {
    render(<CaptureNotesFill targets={TARGETS} onInsert={jest.fn()} />);

    paste(NOTES);
    fireEvent.click(screen.getByTestId("capture-notes-propose"));
    expect(
      screen.getByTestId("capture-notes-proposal-sponsor_commitment"),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("capture-notes-input"), {
      target: { value: "Different notes entirely." },
    });
    expect(
      screen.queryByTestId("capture-notes-proposal-sponsor_commitment"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("capture-notes-basis-warning"),
    ).not.toBeInTheDocument();
  });
});
