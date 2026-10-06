/**
 * @jest-environment jsdom
 */

/**
 * ITEM U-406 — the gate's copy on the TERMINAL stage.
 *
 * WHAT THIS SUITE CLAIMS, AND WHAT IT DOES NOT. `ScopeGate` is mounted by
 * `ScopeAnalyticsStage`, which is imported by the analytics barrel and by tests
 * and BY NO ROUTE — that asymmetry was established by the U-535 suite beside
 * this one and is not re-litigated here. So these cases mount the component
 * DIRECTLY and prove a property of the component. Nothing here is evidence that
 * a signed-in reader sees anything, and no signed-in claim is made. The live
 * destinations for the same contract are the model's grounding block and the
 * aVa packet, proved in `src/lib/source/__tests__/stage-terminal-contract.test.ts`.
 *
 * The defect this pins: the "What good looks like here" box promised that the
 * approval workspace "records the human rationale and advances the event" on
 * EVERY stage, including the one with nothing onward to advance to, and
 * terminality was read off `gate.nextStageName` rather than off the stage key
 * the component was already being handed.
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

import { ScopeGate } from "../ScopeGate";
import { SAMPLE_RFP_STAGE, SAMPLE_VALUE_STAGE } from "../sample-view-model";
import {
  SOURCE_TERMINAL_GATE_CONTRACT,
  TERMINAL_SOURCE_STAGE_KEY,
} from "@/lib/source/stage-terminal-contract";

describe("U-406 · ScopeGate on the terminal stage, mounted directly", () => {
  it("states the completion review and never promises the event advances", () => {
    render(
      <ScopeGate
        gate={SAMPLE_VALUE_STAGE.gate}
        stageName="Value"
        stageKey={TERMINAL_SOURCE_STAGE_KEY}
      />,
    );

    expect(
      screen.getByText(
        new RegExp(SOURCE_TERMINAL_GATE_CONTRACT.gateSummarySentence.slice(0, 60)),
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/advances the event/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(SOURCE_TERMINAL_GATE_CONTRACT.decisionLabel)),
    ).toBeInTheDocument();
  });

  it("reads terminality from the stage key, not from a gate label a fixture can fill", () => {
    // The exact shape that carried the defect: a terminal gate arriving with an
    // onward target. The stage key says terminal, so the copy must not follow
    // the label.
    render(
      <ScopeGate
        gate={{ ...SAMPLE_VALUE_STAGE.gate, nextStageName: "Closed" }}
        stageName="Value"
        stageKey={TERMINAL_SOURCE_STAGE_KEY}
      />,
    );

    expect(screen.queryByText(/Closed/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/advances the event/i),
    ).not.toBeInTheDocument();
  });

  it("keeps the advance wording on a non-terminal stage", () => {
    // The other branch, so the terminal copy cannot have been implemented by
    // dropping advance language everywhere.
    render(
      <ScopeGate
        gate={SAMPLE_RFP_STAGE.gate}
        stageName="RFP"
        stageKey="rfp"
      />,
    );

    expect(screen.getByText(/advances the event/i)).toBeInTheDocument();
    expect(
      screen.queryByText(
        new RegExp(SOURCE_TERMINAL_GATE_CONTRACT.gateSummarySentence.slice(0, 60)),
      ),
    ).not.toBeInTheDocument();
  });
});
