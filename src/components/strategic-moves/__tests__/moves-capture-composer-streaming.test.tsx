/**
 * @jest-environment jsdom
 */

// The `moves_capture_v2` capture dock stops offering a send aVa refuses.
//
// The host's send handler refuses while a turn streams
// (`if (!trimmed || avaStreaming) return;`). The legacy Moves chat rail reads
// that flag at seven sites and disables every control; the v2 dock read it at
// none, so during a stream the composer stayed open, `AgentDock` cleared the
// draft BEFORE calling the handler, and the typed message vanished with no
// turn and no sentence. The in-flight turn also rendered as an empty agent
// bubble, because `isAgentBusy` falls back to `useAtlasPageState().isStreaming`
// and this surface never sets it.
//
// These cases render the REAL `AgentDock`, not a mock: the sibling host suite
// mocks it down to `{ workspace }`, which cannot see a disabled control or a
// dropped send — see the lesson on mocks that drop props.

import "@testing-library/jest-dom";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { act, fireEvent, render, screen } from "@testing-library/react";

import {
  AVA_COMPOSER_STREAMING_REASON,
  avaComposerAvailability,
} from "../ava-composer-availability";
import { MovesCaptureWorkspace } from "../MovesCaptureWorkspace";
import type { MovesCaptureFlowProps } from "../MovesCaptureFlow";
import type { AvaThreadTurn } from "../ava-dock-adapter";
import type { PhaseCaptureSection } from "@/lib/programs/phase-capture-contract";

jest.mock("@/lib/agent/markdownRenderer", () => ({
  AgentMarkdown: ({ text }: { text: string }) => <div>{text}</div>,
}));

const SECTIONS: PhaseCaptureSection[] = [
  {
    key: "sponsor_commitment",
    label: "Sponsor contact and progress updates",
    description: "Name, role, email.",
    required: true,
  },
  {
    key: "scope_boundary",
    label: "Scope boundary",
    description: "In and out.",
    required: true,
  },
];

const CAPTURE_PROPS: MovesCaptureFlowProps = {
  phases: [
    {
      phase: 1,
      code: "P1",
      name: "Charter",
      answered: 0,
      total: 2,
      reachable: true,
    },
  ],
  phase: 1,
  sections: SECTIONS,
  isSectionComplete: () => false,
  renderSectionInput: (section) => <textarea aria-label={section.label} />,
  sectionRecap: () => "",
  onSelectPhase: jest.fn(),
  onSubmitPhase: jest.fn(),
  onAdvanceToNextPhase: jest.fn(),
  nextPhase: { code: "P2", name: "Discover" },
};

/** A thread whose last turn is the empty assistant turn a stream opens with. */
const STREAMING_THREAD: AvaThreadTurn[] = [
  { id: "t1", role: "user", text: "What is still missing?" },
  { id: "t2", role: "assistant", text: "" },
];

function renderWorkspace(
  overrides: {
    avaStreaming?: boolean;
    onAvaMessage?: jest.Mock;
    thread?: AvaThreadTurn[];
    omitStreamingProp?: boolean;
  } = {},
) {
  const onAvaMessage = overrides.onAvaMessage ?? jest.fn();
  const streamingProp = overrides.omitStreamingProp
    ? {}
    : { avaStreaming: overrides.avaStreaming ?? false };
  render(
    <MovesCaptureWorkspace
      moveId="move-1"
      moveName="Demo move"
      phase={1}
      avaRole="Charter partner"
      avaThread={overrides.thread ?? STREAMING_THREAD}
      avaQuestions={["What is still missing?", "Who approves this?"]}
      avaLeadingActions={[
        { id: "draft-inputs", label: "Draft proposed inputs", body: "" },
      ]}
      {...streamingProp}
      onAvaMessage={onAvaMessage}
      captureProps={CAPTURE_PROPS}
    />,
  );
  return { onAvaMessage };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("avaComposerAvailability", () => {
  it("leaves the composer open when no turn is streaming", () => {
    expect(avaComposerAvailability(false)).toEqual({
      canSend: true,
      disabledReason: null,
      agentBusy: false,
    });
  });

  it("withholds the composer while a turn streams, which is when the handler refuses", () => {
    expect(avaComposerAvailability(true)).toEqual({
      canSend: false,
      disabledReason: AVA_COMPOSER_STREAMING_REASON,
      agentBusy: true,
    });
  });

  it("names both the wait and when it ends, because the reason is read by a product user", () => {
    expect(AVA_COMPOSER_STREAMING_REASON).toMatch(/still answering/i);
    expect(AVA_COMPOSER_STREAMING_REASON).toMatch(/reopens/i);
  });

  it("agrees with canSend on both readings, so the control and the handler cannot drift", () => {
    for (const streaming of [false, true]) {
      const availability = avaComposerAvailability(streaming);
      expect(availability.canSend).toBe(availability.disabledReason === null);
      expect(availability.agentBusy).toBe(streaming);
    }
  });
});

describe("MovesCaptureWorkspace · composer while aVa streams", () => {
  it("disables the composer textarea", () => {
    renderWorkspace({ avaStreaming: true });
    expect(screen.getByTestId("agent-dock-input")).toBeDisabled();
  });

  it("shows the wait as the composer placeholder rather than an inviting prompt", () => {
    renderWorkspace({ avaStreaming: true });
    expect(screen.getByTestId("agent-dock-input")).toHaveAttribute(
      "placeholder",
      AVA_COMPOSER_STREAMING_REASON,
    );
  });

  it("disables the send button", () => {
    renderWorkspace({ avaStreaming: true });
    expect(screen.getByLabelText("Send message")).toBeDisabled();
  });

  it("disables the attach button", () => {
    renderWorkspace({ avaStreaming: true });
    expect(screen.getByTestId("agent-dock-attach")).toBeDisabled();
  });

  it("disables every suggestion chip, including the leading action", () => {
    renderWorkspace({ avaStreaming: true });
    expect(
      screen.getByTestId("agent-dock-suggestion-draft-inputs"),
    ).toBeDisabled();
    expect(screen.getByTestId("agent-dock-suggestion-ava-q-0")).toBeDisabled();
  });

  it("shows the throbber for the in-flight turn instead of an empty agent bubble", () => {
    renderWorkspace({ avaStreaming: true });
    expect(screen.getByTestId("agent-dock-throbber")).toBeInTheDocument();
  });

  it("does not hand the handler a send it would silently drop", () => {
    const { onAvaMessage } = renderWorkspace({ avaStreaming: true });
    const input = screen.getByTestId("agent-dock-input");
    fireEvent.change(input, { target: { value: "one more question" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.submit(screen.getByTestId("agent-dock-form"));
    expect(onAvaMessage).not.toHaveBeenCalled();
  });

  it("keeps a typed draft rather than clearing it into nothing", () => {
    renderWorkspace({ avaStreaming: true });
    const input = screen.getByTestId("agent-dock-input");
    fireEvent.change(input, { target: { value: "one more question" } });
    fireEvent.submit(screen.getByTestId("agent-dock-form"));
    expect(input).toHaveValue("one more question");
  });
});

describe("MovesCaptureWorkspace · composer when aVa is idle", () => {
  it("leaves the composer enabled", () => {
    renderWorkspace({ avaStreaming: false });
    expect(screen.getByTestId("agent-dock-input")).toBeEnabled();
    expect(screen.getByTestId("agent-dock-attach")).toBeEnabled();
  });

  it("does not claim the composer is paused", () => {
    renderWorkspace({ avaStreaming: false });
    expect(screen.getByTestId("agent-dock-input")).not.toHaveAttribute(
      "placeholder",
      AVA_COMPOSER_STREAMING_REASON,
    );
  });

  it("shows no throbber", () => {
    renderWorkspace({ avaStreaming: false });
    expect(screen.queryByTestId("agent-dock-throbber")).not.toBeInTheDocument();
  });

  it("passes a send through to the handler", async () => {
    const { onAvaMessage } = renderWorkspace({ avaStreaming: false });
    const input = screen.getByTestId("agent-dock-input");
    fireEvent.change(input, { target: { value: "who approves this?" } });
    await act(async () => {
      fireEvent.submit(screen.getByTestId("agent-dock-form"));
    });
    expect(onAvaMessage).toHaveBeenCalledWith("who approves this?");
  });

  it("leaves every suggestion chip clickable", () => {
    renderWorkspace({ avaStreaming: false });
    expect(
      screen.getByTestId("agent-dock-suggestion-draft-inputs"),
    ).toBeEnabled();
    expect(screen.getByTestId("agent-dock-suggestion-ava-q-0")).toBeEnabled();
  });

  it("treats an absent streaming prop as idle, so a host that has not wired it renders as before", async () => {
    const { onAvaMessage } = renderWorkspace({ omitStreamingProp: true });
    const input = screen.getByTestId("agent-dock-input");
    expect(input).toBeEnabled();
    fireEvent.change(input, { target: { value: "still open" } });
    await act(async () => {
      fireEvent.submit(screen.getByTestId("agent-dock-form"));
    });
    expect(onAvaMessage).toHaveBeenCalledWith("still open");
  });
});

// The host half. `MovesPhaseStandaloneClient` is the only product mount of the
// workspace, and the fix is inert unless it passes its own streaming flag —
// the same `avaStreaming` its send handler guards on. Rendering the host here
// would need its whole fixture, so this reads the mount slice directly, with
// an anchor sentinel so a refactor that moves the mount fails loudly instead
// of asserting against an empty string.
describe("MovesPhaseStandaloneClient · hands the dock its streaming flag", () => {
  const source = readFileSync(
    join(__dirname, "..", "MovesPhaseStandaloneClient.tsx"),
    "utf8",
  );

  function captureWorkspaceMount(): string {
    const open = source.indexOf("<MovesCaptureWorkspace");
    expect(open).toBeGreaterThan(-1);
    const close = source.indexOf("captureProps={{", open);
    expect(close).toBeGreaterThan(open);
    return source.slice(open, close);
  }

  it("finds exactly one product mount to reason about", () => {
    expect(source.split("<MovesCaptureWorkspace").length - 1).toBe(1);
  });

  it("passes the host's own streaming state, not a literal", () => {
    expect(captureWorkspaceMount()).toContain("avaStreaming={avaStreaming}");
  });

  it("guards its send handler on the same flag it hands the dock", () => {
    expect(source).toContain("if (!trimmed || avaStreaming) return;");
  });
});
