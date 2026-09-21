/**
 * @jest-environment jsdom
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AskAnythingBar } from "@/components/agent/AskAnythingBar";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";

const mockPageState = {
  ask: jest.fn(),
  currentResponse: "stream transcript that should be hidden",
  currentResponseParts: [],
  currentAgentAnswer: {
    surface: "source",
    mode: "CONTROL",
    tenantKey: "test-tenant",
    question: "Summarize the event",
    intent: "source_governed_answer",
    status: "answered",
    directAnswer: "Governed answer summary",
    prose: "Governed answer prose",
    factsUsed: [],
    metricsUsed: [],
    relationshipsUsed: [],
    citations: [],
    tables: [],
    charts: [],
    graphs: [],
    artifacts: [],
    gaps: [],
    caveats: [],
    nextSteps: [],
    quality: {
      confidence: "low",
      evidenceStrength: "thin",
      tenantGrounding: "partial",
      answerCompleteness: "partial",
    },
    safety: {
      tenantFencePassed: true,
      rawIdsSuppressed: true,
      forbiddenLanguagePassed: true,
      unsupportedClaimsBlocked: true,
    },
  } as unknown as AvaAnswerPacket,
  isStreaming: false,
  error: null,
  clearResponse: jest.fn(),
};

jest.mock("@/components/shell/AtlasPageStateProvider", () => ({
  useAtlasPageState: () => mockPageState,
}));

jest.mock("@/hooks/useAgentStream", () => ({
  useAgentStream: () => ({
    ask: jest.fn(),
    response: "",
    isStreaming: false,
    error: null,
    clear: jest.fn(),
  }),
}));

jest.mock("@/components/programs/attachments/usePendingAttachments", () => ({
  usePendingAttachments: () => ({
    count: 0,
    items: [],
    isUploading: false,
    addFiles: jest.fn(),
    uploadAll: jest.fn(),
    clearUploaded: jest.fn(),
    removeAttachment: jest.fn(),
    retry: jest.fn(),
  }),
}));

jest.mock("@/components/programs/attachments/AttachmentChip", () => ({
  PendingAttachmentChip: ({ filename }: { filename: string }) => (
    <span>{filename}</span>
  ),
}));

jest.mock("@/components/agent-answer/AgentAnswerRenderer", () => ({
  AgentAnswerRenderer: ({ answer }: { answer: AvaAnswerPacket }) => (
    <section aria-label="Governed Ava answer">{answer.directAnswer}</section>
  ),
}));

describe("AskAnythingBar governed answer rendering", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the governed answer packet from shared Atlas state", () => {
    render(
      <AskAnythingBar
        agent="nexus"
        scopeLabel="Source event"
        surface="/source/events/demo"
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Ask Ava" }), {
      target: { value: "Summarize the event" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(
      screen.getByRole("region", { name: "Governed Ava answer" }),
    ).toHaveTextContent("Governed answer summary");
    expect(
      screen.queryByText("stream transcript that should be hidden"),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "Dismiss response" }),
    ).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Ask Ava" })).toBeTruthy();
  });
});
