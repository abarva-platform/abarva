/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  AvaAnswerSummary,
  AvaCanvas,
  AvaChatShell,
  AvaComposer,
  AvaEvidencePreview,
  AvaThread,
} from "@/components/ava-chat/AvaChatShell";

describe("AvaChatShell shared components", () => {
  it("renders the shared aVa shell with branded mark and human placeholder", () => {
    render(
      <AvaChatShell
        surface="intelligence"
        thread={[]}
        onMessage={jest.fn()}
        canvas={<div>Canvas proof</div>}
      />,
    );

    expect(screen.getByTestId("agent-dock-panel")).toBeInTheDocument();
    expect(screen.getAllByTestId("ava-ask-wordmark").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("ava-ask-wordmark")[0]).toHaveAttribute(
      "src",
      "/brand/ava/ava-wordmark-2tone-dark.svg",
    );
    expect(
      screen.getByPlaceholderText("Ask aVa about this enterprise context..."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Sentinel")).not.toBeInTheDocument();
  });

  it("composer submits on Enter and keeps Shift+Enter as a newline", () => {
    const onChange = jest.fn();
    const onSubmit = jest.fn();
    const { rerender } = render(
      <AvaComposer value="" onChange={onChange} onSubmit={onSubmit} />,
    );

    const input = screen.getByTestId("ava-composer-input");
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();

    rerender(
      <AvaComposer value="Line one\nLine two" onChange={onChange} onSubmit={onSubmit} />,
    );
    fireEvent.keyDown(screen.getByTestId("ava-composer-input"), {
      key: "Enter",
      shiftKey: false,
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("renders thread, summary, evidence preview, and canvas without backend internals", () => {
    render(
      <>
        <AvaThread
          messages={[
            { id: "u1", role: "user", body: "What do we know?" },
            { id: "a1", role: "agent", body: "Answer is ready on the canvas." },
          ]}
        />
        <AvaAnswerSummary
          directAnswer="The loaded context shows a concentrated systems risk."
          whyItMatters="The risk affects modernization sequencing."
          evidencePreview="Two tenant citations are attached."
          confidence="medium"
          nextAction="Open the evidence tab."
          suggestions={["Show sources", "Compare risks"]}
        />
        <AvaEvidencePreview
          items={[
            { id: "src1", label: "Systems inventory" },
            { id: "src2", label: "Integration ledger" },
          ]}
        />
        <AvaCanvas
          eyebrow="Intelligence canvas"
          title="Explore proof"
          status="done"
          tabs={[{ id: "answer", label: "Answer" }]}
          activeTab="answer"
          onTabChange={jest.fn()}
        >
          Canvas body
        </AvaCanvas>
      </>,
    );

    expect(screen.getByTestId("ava-thread")).toHaveTextContent("What do we know?");
    expect(screen.getByTestId("ava-answer-summary")).toHaveTextContent(
      "The loaded context shows a concentrated systems risk.",
    );
    expect(screen.getByTestId("ava-evidence-preview")).toHaveTextContent(
      "Systems inventory",
    );
    expect(screen.getByTestId("ava-canvas-panel-answer")).toHaveTextContent(
      "Canvas body",
    );
    expect(screen.queryByText(/semantic2|home_know|packet/i)).not.toBeInTheDocument();
  });
});
