import { isUserProvidedPercentageProposal } from "../proposed-quantities";

const question =
  "Assess the proposed 20% resolution target, not a measured result or savings commitment.";

it.each([
  "The proposed 20% resolution target is not a measured result or a savings commitment.",
  "The 20% successful self-service resolution target remains proposed, not measured or committed savings.",
  "A 20 percent target is a proposed assumption, not an achieved result.",
  "The proposed 20% target is not a measured baseline or a savings commitment.",
])(
  "recognizes the local proposed percentage as an assumption: %s",
  (passage) => {
    expect(isUserProvidedPercentageProposal([passage], question, "20%")).toBe(
      true,
    );
  },
);

it.each([
  "Evidence shows 20% resolution.",
  "The 20% target is not proposed.",
  "A proposed 20% target delivered 20% savings.",
  "A proposed 20% target is not measured, but 20% resolution was achieved.",
  "Current resolution is 20% against a proposed 20% target.",
  "Current resolution is 20% against a 20% target that remains proposed.",
  "The proposed 40% target is unmeasured.",
  "The proposed 20% target is the recorded current resolution baseline.",
  "Recorded current resolution stands at the proposed 20% target.",
  "Evidence confirms this is not currently a proposed 20% resolution target.",
  "Evidence confirms this is not a proposed 20% resolution target.",
  "This is not a proposed 20% target; it remains unmeasured.",
  "This is not a proposed 20% resolution target that is unmeasured.",
  "Evidence informs the proposed 20%% target.",
  "Evidence informs the proposed 20%USD target.",
])(
  "does not borrow a proposal label for an achieved or different value: %s",
  (passage) => {
    expect(isUserProvidedPercentageProposal([passage], question, "20%")).toBe(
      false,
    );
  },
);

it("does not borrow a qualification from another answer field", () => {
  expect(
    isUserProvidedPercentageProposal(
      [
        "Evidence shows 20% resolution.",
        "The 20% target remains proposed, not measured.",
      ],
      question,
      "20%",
    ),
  ).toBe(false);
});

it("does not invent a user input from the answer", () => {
  expect(
    isUserProvidedPercentageProposal(
      ["The proposed 20% target is unmeasured."],
      "Assess business fit.",
      "20%",
    ),
  ).toBe(false);
});

it("retains the sign and rejects malformed input-unit borrowing", () => {
  expect(
    isUserProvidedPercentageProposal(
      [
        "Evidence informs the proposed -20% change target, not a measured result.",
      ],
      "Assess a proposed -20% change target.",
      "-20%",
    ),
  ).toBe(true);
  expect(
    isUserProvidedPercentageProposal(
      ["The proposed 20% change target is unmeasured."],
      "Assess a proposed -20% change target.",
      "20%",
    ),
  ).toBe(false);
  expect(
    isUserProvidedPercentageProposal(
      ["The proposed 20% target is unmeasured."],
      "Assess a proposed 20%USD target.",
      "20%",
    ),
  ).toBe(false);
});
