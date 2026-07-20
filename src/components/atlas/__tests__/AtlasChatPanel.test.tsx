/**
 * @jest-environment jsdom
 */

// AtlasChatPanel · adapter behavior on top of the shared AgentDock.
//
// Coverage:
//   - Translates AtlasMessage[] → AgentDock thread (atlas → agent role).
//   - Adds a transient progress turn while pending=true.
//   - Routes suggestion clicks to the caller's onSuggestion (no compose).
//   - Forwards composer submit (text + attachments) to onSubmit.
//   - Renders the workspace pane in side-rail mode by default.
//   - Honours surface key for AgentDock localStorage persistence.

import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";

import {
  ATLAS_DECISION_SUPPORT_DISCLOSURE,
  AtlasChatPanel,
  type AtlasMessage,
} from "../AtlasChatPanel";
import { modeStorageKey } from "@/components/agent/AgentDock";
import type { AtlasSuggestion } from "@/lib/atlas/types";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";

const SURFACE = "tower";

const MESSAGES: AtlasMessage[] = [
  {
    id: "a1",
    role: "atlas",
    content: "Three threads run through this morning.",
  },
  { id: "u1", role: "user", content: "Show me lagging programs." },
];

const SUGGESTIONS: AtlasSuggestion[] = [
  { label: "Open hero signal", value: "signal:abc", kind: "signal" },
  {
    label: "Peer position",
    value: "How do we compare to peers?",
    kind: "message",
  },
];

const AGENT_ANSWER: AvaAnswerPacket = {
  surface: "tower",
  mode: "CONTROL",
  tenantKey: "skyharbor",
  question: "Rank the value levers.",
  intent: "tower_governed_answer",
  status: "answered",
  directAnswer: "Prioritize the governed value levers.",
  prose: "Prioritize the governed value levers.",
  factsUsed: [],
  metricsUsed: [],
  relationshipsUsed: [],
  artifacts: [
    {
      artifact: "table",
      id: "tower_value_levers",
      title: "Tower value levers",
      columns: [
        { key: "lever", label: "Lever", format: "text", align: "left" },
        {
          key: "annual_value",
          label: "Annual value",
          format: "currency",
          align: "right",
        },
      ],
      rows: [{ lever: "Contact center deflection", annual_value: "$18M" }],
    },
  ],
  tables: [
    {
      id: "tower_value_levers",
      title: "Tower value levers",
      columns: [
        { key: "lever", label: "Lever", format: "text", align: "left" },
        {
          key: "annual_value",
          label: "Annual value",
          format: "currency",
          align: "right",
        },
      ],
      rows: [{ lever: "Contact center deflection", annual_value: "$18M" }],
    },
  ],
  charts: [],
  graphs: [],
  citations: [],
  gaps: [],
  caveats: [],
  nextSteps: [],
  quality: {
    confidence: "medium",
    evidenceStrength: "partial",
    tenantGrounding: "complete",
    answerCompleteness: "complete",
  },
  safety: {
    tenantFencePassed: true,
    rawIdsSuppressed: true,
    forbiddenLanguagePassed: true,
    unsupportedClaimsBlocked: true,
  },
};

beforeEach(() => {
  window.localStorage.clear();
});

describe("AtlasChatPanel · adapter", () => {
  it("translates atlas/user messages to AgentDock thread roles", () => {
    render(
      <AtlasChatPanel
        messages={MESSAGES}
        pending={false}
        onSubmit={jest.fn()}
        suggestions={[]}
        onSuggestion={jest.fn()}
        workspace={<div data-testid="tower-body">tower body</div>}
        surface={SURFACE}
      />,
    );

    const thread = screen.getByTestId("agent-dock-thread");
    expect(thread).toHaveTextContent("Three threads run through this morning.");
    expect(thread).toHaveTextContent("Show me lagging programs.");
    // workspace renders alongside in side-rail mode.
    expect(screen.getByTestId("tower-body")).toBeInTheDocument();
  });

  it("does not rewrite agent-visible prose", () => {
    render(
      <AtlasChatPanel
        messages={[
          {
            id: "a-raw",
            role: "atlas",
            content: "Atlas literal text should remain byte-visible.",
          },
        ]}
        pending={false}
        onSubmit={jest.fn()}
        suggestions={[]}
        onSuggestion={jest.fn()}
        workspace={<div>w</div>}
        surface={SURFACE}
      />,
    );

    expect(screen.getByTestId("agent-dock-thread")).toHaveTextContent(
      "Atlas literal text should remain byte-visible.",
    );
  });

  it("passes governed aVa answer artifacts through to AgentDock", () => {
    render(
      <AtlasChatPanel
        messages={[
          {
            id: "a-packet",
            role: "atlas",
            content: "Prioritize the governed value levers.",
            agentAnswer: AGENT_ANSWER,
          },
        ]}
        pending={false}
        onSubmit={jest.fn()}
        suggestions={[]}
        onSuggestion={jest.fn()}
        workspace={<div>w</div>}
        surface={SURFACE}
      />,
    );

    expect(screen.getByLabelText("aVa answer")).toHaveTextContent(
      "Tower value levers",
    );
    expect(screen.getByLabelText("aVa answer")).toHaveTextContent(
      "Contact center deflection",
    );
  });

  it("renders the aVa product profile and keeps the default rail uncluttered", () => {
    render(
      <AtlasChatPanel
        messages={[]}
        pending={false}
        onSubmit={jest.fn()}
        suggestions={[]}
        onSuggestion={jest.fn()}
        workspace={<div>w</div>}
        surface={SURFACE}
      />,
    );

    expect(screen.getByTestId("ava-ask-mark")).toBeInTheDocument();
    expect(screen.getAllByText("Tower advisor.").length).toBeGreaterThan(0);
    expect(screen.queryByLabelText("Quoted context")).not.toBeInTheDocument();
    expect(screen.queryByText("Atlas")).not.toBeInTheDocument();
  });

  it("still supports an explicit decision-support quote when a surface opts in", () => {
    render(
      <AtlasChatPanel
        messages={[]}
        pending={false}
        onSubmit={jest.fn()}
        suggestions={[]}
        onSuggestion={jest.fn()}
        workspace={<div>w</div>}
        surface={SURFACE}
        initialQuote={ATLAS_DECISION_SUPPORT_DISCLOSURE}
      />,
    );

    expect(screen.getByLabelText("Quoted context")).toHaveTextContent(
      ATLAS_DECISION_SUPPORT_DISCLOSURE,
    );
  });

  it('appends a transient "aVa is thinking…" turn while pending', () => {
    render(
      <AtlasChatPanel
        messages={MESSAGES}
        pending={true}
        onSubmit={jest.fn()}
        suggestions={[]}
        onSuggestion={jest.fn()}
        workspace={<div>w</div>}
        surface={SURFACE}
      />,
    );

    const thread = screen.getByTestId("agent-dock-thread");
    expect(thread).toHaveTextContent("aVa is thinking…");
  });

  it("uses a streamed pending status when provided", () => {
    render(
      <AtlasChatPanel
        messages={MESSAGES}
        pending={true}
        pendingMessage="Validating supporting evidence..."
        onSubmit={jest.fn()}
        suggestions={[]}
        onSuggestion={jest.fn()}
        workspace={<div>w</div>}
        surface={SURFACE}
      />,
    );

    const thread = screen.getByTestId("agent-dock-thread");
    expect(thread).toHaveTextContent("Validating supporting evidence...");
    expect(thread).not.toHaveTextContent("aVa is thinking…");
  });

  it("renders in side-rail mode by default and persists per-surface", () => {
    render(
      <AtlasChatPanel
        messages={[]}
        pending={false}
        onSubmit={jest.fn()}
        suggestions={[]}
        onSuggestion={jest.fn()}
        workspace={<div>w</div>}
        surface={SURFACE}
      />,
    );

    const panel = screen.getByTestId("agent-dock-panel");
    expect(panel).toHaveAttribute("data-mode", "side-rail");

    // Switch to pin-bottom — should write the surface-scoped storage key.
    fireEvent.click(screen.getByTestId("agent-dock-mode-pin-bottom"));
    expect(window.localStorage.getItem(modeStorageKey(SURFACE))).toBe(
      "pin-bottom",
    );
  });

  it("routes suggestion clicks to onSuggestion without pre-filling composer", () => {
    const onSuggestion = jest.fn();
    render(
      <AtlasChatPanel
        messages={[]}
        pending={false}
        onSubmit={jest.fn()}
        suggestions={SUGGESTIONS}
        onSuggestion={onSuggestion}
        workspace={<div>w</div>}
        surface={SURFACE}
      />,
    );

    const firstButton = screen.getByTestId("agent-dock-suggestion-signal-0");
    fireEvent.click(firstButton);

    expect(onSuggestion).toHaveBeenCalledTimes(1);
    expect(onSuggestion).toHaveBeenCalledWith(SUGGESTIONS[0]);
    // Composer should remain empty (no pre-fill from onClick path).
    const input = screen.getByTestId("agent-dock-input") as HTMLTextAreaElement;
    expect(input.value).toBe("");
  });

  it("forwards composer submit (text + attachments) to onSubmit", async () => {
    const onSubmit = jest.fn();
    render(
      <AtlasChatPanel
        messages={[]}
        pending={false}
        onSubmit={onSubmit}
        suggestions={[]}
        onSuggestion={jest.fn()}
        workspace={<div>w</div>}
        surface={SURFACE}
      />,
    );

    const input = screen.getByTestId("agent-dock-input");
    fireEvent.change(input, { target: { value: "hello ava" } });
    await act(async () => {
      fireEvent.submit(screen.getByTestId("agent-dock-form"));
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith("hello ava", []);
  });
});
