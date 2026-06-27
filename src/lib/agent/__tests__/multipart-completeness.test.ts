import {
  formatCompletenessRepairInstruction,
  validateMultipartCompleteness,
} from "../multipart-completeness";

describe("multipart completeness validator", () => {
  it("flags the Lakeshore-style 3-move answer that only renders move 1", () => {
    const result = validateMultipartCompleteness({
      question: "Build us a 3-move sequence for the next 90 days.",
      answer: [
        "Here's the 3-move sequence I'd use.",
        "Move 1: Certify the feed before automation. Require deterministic rules before AI is allowed to assist.",
      ].join("\n"),
    });

    expect(result.complete).toBe(false);
    expect(result.requiredCount).toBe(3);
    expect(result.observedParts).toEqual([1]);
    expect(result.missingParts).toEqual([2, 3]);
  });

  it("passes a complete 3-move answer", () => {
    const result = validateMultipartCompleteness({
      question: "Give me the three moves.",
      answer: [
        "Move 1: Certify the feed.",
        "Move 2: Bind ownership and exception routing.",
        "Move 3: Automate only after the evidence trail is clean.",
      ].join("\n"),
    });

    expect(result.complete).toBe(true);
    expect(result.missingParts).toEqual([]);
  });

  it("flags the production 3-step Kyriba answer that rendered only two steps", () => {
    const result = validateMultipartCompleteness({
      question:
        "Build a 3-step Kyriba readiness sequence. Include step 1, step 2, and step 3 explicitly.",
      answer: [
        "Here's the 3-step Kyriba readiness sequence, grounded in the specific control gaps in your loaded sources.",
        "Step 1 — Certify bank connectivity and resolve payment format defects (Months 0-3)",
        "Bank connectivity for critical banks is not certified, and ~85,000 payments/month carry a format-mapping defect.",
        "Step 2 — Close SOX signer controls and reconcile SAP/ERP feed quality (Months 2-5)",
        "SOX payment-approval signer evidence is incomplete.",
      ].join(" "),
    });

    expect(result.complete).toBe(false);
    expect(result.requiredCount).toBe(3);
    expect(result.observedParts).toEqual([1, 2]);
    expect(result.missingParts).toEqual([3]);
  });

  it("accepts step labels for a requested readiness sequence", () => {
    const result = validateMultipartCompleteness({
      question: "Build a 3-step Kyriba readiness sequence.",
      answer: [
        "Step 1: Certify bank connectivity.",
        "Step 2: Close SOX signer controls.",
        "Step 3: Run a guarded go-live with exception monitoring.",
      ].join("\n"),
    });

    expect(result.complete).toBe(true);
    expect(result.observedParts).toEqual([1, 2, 3]);
  });

  it("flags a promised top-five list that only renders three items", () => {
    const result = validateMultipartCompleteness({
      question: "What are the top 5 priorities for the CIO?",
      answer: [
        "1. Stabilize the evidence layer.",
        "2. Sequence the value case.",
        "3. Assign named owners.",
      ].join("\n"),
    });

    expect(result.complete).toBe(false);
    expect(result.requiredCount).toBe(5);
    expect(result.missingParts).toEqual([4, 5]);
  });

  it("formats a repair instruction without changing the recommendation posture", () => {
    const result = validateMultipartCompleteness({
      question: "Show a 3-step path.",
      answer: "Step 1: Start with the control evidence.",
    });

    expect(formatCompletenessRepairInstruction(result)).toContain(
      "previous draft promised 3 step",
    );
    expect(formatCompletenessRepairInstruction(result)).toContain(
      "step 1, step 2, step 3",
    );
    expect(formatCompletenessRepairInstruction(result)).toContain(
      "Keep the same recommendation",
    );
  });
});
