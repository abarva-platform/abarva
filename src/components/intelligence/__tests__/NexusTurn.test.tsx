/**
 * @jest-environment jsdom
 */

// NexusTurn · citation-gap behavior (PR-7b, mirrors the #3322 Sentinel hardening).
//
// Locks in: an assistant answer with sources renders them; an assistant answer
// with NO sources surfaces a "citation gap" honesty notice (not silent), except
// for clarification / idk formats where grounding isn't expected.

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { NexusTurn } from "@/components/intelligence/NexusTurn";
import type { NexusTurnData, Source } from "@/lib/intelligence/types";

function turn(over: Partial<NexusTurnData> = {}): NexusTurnData {
  return {
    id: "t1",
    threadId: "th1",
    index: 1,
    role: "nexus",
    mode: "grounded",
    format: "one_sentence",
    confidence: "medium",
    payload: { answer: "Cloud spend is concentrated in three workloads." },
    sources: [],
    capabilitiesActive: [],
    counterOfTurnId: null,
    contradictionSelfCheck: null,
    personaKey: null,
    latencyMs: null,
    firstTokenMs: null,
    createdAt: "2026-06-08T00:00:00Z",
    ...over,
  };
}

const source: Source = {
  id: "s1",
  type: "client_fact",
  name: "FinOps cost export",
  confidence: "high",
};

describe("NexusTurn citation gap", () => {
  it("renders sources when present and shows no citation-gap notice", () => {
    render(<NexusTurn turn={turn({ sources: [source] })} />);
    expect(screen.getByText("Sources")).toBeInTheDocument();
    expect(screen.queryByText("citation gap")).not.toBeInTheDocument();
  });

  it("surfaces a citation-gap notice when an answer has no sources", () => {
    render(<NexusTurn turn={turn({ sources: [] })} />);
    expect(screen.getByText("citation gap")).toBeInTheDocument();
    expect(
      screen.getByText(/not grounded in retrieved sources/i),
    ).toBeInTheDocument();
  });

  it("does not nag on clarification turns (grounding not expected)", () => {
    render(
      <NexusTurn
        turn={turn({
          format: "clarification",
          sources: [],
          payload: { question: "Which unit?" },
        })}
      />,
    );
    expect(screen.queryByText("citation gap")).not.toBeInTheDocument();
  });

  it("does not show a citation gap on user turns", () => {
    render(
      <NexusTurn turn={turn({ role: "user", payload: { answer: "hi" } })} />,
    );
    expect(screen.queryByText("citation gap")).not.toBeInTheDocument();
  });
});
