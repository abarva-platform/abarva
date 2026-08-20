/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { SolutioningPanel } from "../SolutioningPanel";

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 500) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

async function waitForLoaded() {
  await waitFor(() => {
    expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
  });
}

describe("SolutioningPanel", () => {
  beforeEach(() => {
    global.fetch = jest.fn(() => jsonResponse({ fields: null }));
  });

  it("renders all 5 patterns with their routing notes and disables save until a pattern + rationale are given", async () => {
    render(<SolutioningPanel moveId="move-1" />);
    await waitForLoaded();

    expect(screen.getByText("Build on the Platform")).toBeInTheDocument();
    expect(screen.getByText("Point Automation")).toBeInTheDocument();
    expect(
      screen.getByText("Embedded in a Licensed Product"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Native to the Core Clinical System"),
    ).toBeInTheDocument();
    expect(screen.getByText("New Third-Party Platform")).toBeInTheDocument();
    expect(screen.getAllByText("Check coverage first.")).toHaveLength(2);
    expect(screen.getByText("Challenge by default.")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /save solutioning record/i }),
    ).toBeDisabled();
  });

  it("enables save once a pattern is selected and a rationale is typed, and POSTs both", async () => {
    const postBodies: unknown[] = [];
    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") {
        postBodies.push(JSON.parse(init.body as string));
        return jsonResponse({
          ok: true,
          fields: {
            pattern: "Build on the Platform",
            rationale: "No data leaves the tenant boundary.",
          },
        });
      }
      return jsonResponse({ fields: null });
    });

    render(<SolutioningPanel moveId="move-42" />);
    await waitForLoaded();

    fireEvent.click(
      screen.getByRole("radio", { name: /Build on the Platform/i }) ??
        screen.getByDisplayValue("Build on the Platform"),
    );
    fireEvent.change(screen.getByLabelText(/rationale/i), {
      target: { value: "No data leaves the tenant boundary." },
    });

    const saveButton = screen.getByRole("button", {
      name: /save solutioning record/i,
    });
    expect(saveButton).toBeEnabled();

    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Last saved/i)).toBeInTheDocument();
    });

    expect(postBodies).toEqual([
      {
        pattern: "Build on the Platform",
        rationale: "No data leaves the tenant boundary.",
      },
    ]);
  });

  it("loads a prior saved record and shows it as 'Last saved' immediately", async () => {
    global.fetch = jest.fn(() =>
      jsonResponse({
        fields: {
          pattern: "Point Automation",
          rationale:
            "RPA on an approved workflow step, nothing new enters the estate.",
        },
      }),
    );

    render(<SolutioningPanel moveId="move-1" />);
    await waitForLoaded();
    await waitFor(() => {
      expect(screen.getByText(/Last saved/i)).toBeInTheDocument();
    });
    expect(
      screen.getByTestId("solutioning-status-rationale"),
    ).toHaveTextContent(
      "RPA on an approved workflow step, nothing new enters the estate.",
    );
  });

  it("shows a save error and does not clear the form when the server rejects the save", async () => {
    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") {
        return jsonResponse({ error: "not_enabled" }, false, 404);
      }
      return jsonResponse({ fields: null });
    });

    render(<SolutioningPanel moveId="move-1" />);
    await waitForLoaded();
    fireEvent.change(screen.getByLabelText(/rationale/i), {
      target: { value: "Some rationale." },
    });
    fireEvent.click(screen.getByDisplayValue("New Third-Party Platform"));

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /save solutioning record/i }),
      );
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/not_enabled/i);
    });
    expect(screen.getByDisplayValue("Some rationale.")).toBeInTheDocument();
  });
});
