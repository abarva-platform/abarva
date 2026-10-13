/** @jest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { ExecutiveReadingView } from "../ExecutiveReadingView";
import { modelAuthoredAnswerPacket } from "@/lib/intelligence/answer/model-authored-answer";

it("opens the complete authored answer instantly while retaining sources and the raw packet", () => {
  const text =
    "Charter discovery; baseline and benefits are unverified.\n\n" +
    Array(10)
      .fill(
        "Establish eligible inquiry volume and successful unassisted resolution before assessing value.",
      )
      .join("\n\n") +
    "\n\nThe complete cost model includes implementation, oversight and operating costs.";
  const raw = text + '\n\n```sources\n["S1"]\n```';
  const answer = modelAuthoredAnswerPacket(raw, "Plan discovery", "test", [
    {
      id: "context-plan",
      type: "TENANT",
      name: "Operating plan",
      detail: "Baseline is unverified.",
    },
  ]);
  const original = JSON.stringify(answer);
  render(
    <ExecutiveReadingView text={answer.prose!} answer={answer} budget={100} />,
  );
  expect(screen.queryByText(/The complete cost model/)).toBeNull();
  expect(screen.getByText("Sources")).toBeTruthy();
  expect(screen.getByText("Operating plan")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Read full analysis" }));
  expect(screen.getByTestId("executive-reading-content").textContent).toContain(
    "The complete cost model",
  );
  fireEvent.click(screen.getByRole("button", { name: "Show concise view" }));
  expect(screen.queryByText(/The complete cost model/)).toBeNull();
  expect(JSON.stringify(answer)).toBe(original);
});

it("keeps partial prose visible while withholding the completed-analysis control", () => {
  const partial =
    "Validate the baseline first.\n\n" + Array(110).fill("detail").join(" ");
  const { rerender } = render(
    <ExecutiveReadingView text={partial} budget={100} streaming />,
  );
  expect(screen.getByTestId("executive-reading-content").textContent).toContain(
    "Validate the baseline first.",
  );
  expect(
    screen.queryByRole("button", { name: "Read full analysis" }),
  ).toBeNull();
  rerender(<ExecutiveReadingView text={partial} budget={100} />);
  expect(
    screen.getByRole("button", { name: "Read full analysis" }),
  ).toBeTruthy();
});
