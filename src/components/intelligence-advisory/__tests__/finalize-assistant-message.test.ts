/**
 * @jest-environment jsdom
 */

import { createElement } from "react";
import { TextDecoder, TextEncoder } from "util";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  AdvisoryIntelligencePage,
  buildStarterPrompts,
  finalizeAssistantMessage,
  resolveAssistantAnswerText,
} from "../AdvisoryIntelligencePage";
import { getEnterpriseLandscapeViewModel } from "@/lib/home/enterprise-landscape-view-model";

const PROSE =
  "The evidence supports an advisory read, not a certified decision.";

const FENCED_ANSWER = [
  PROSE,
  "",
  "```followups",
  '["What would change this view?","What evidence is still missing?"]',
  "```",
].join("\n");

describe("streamed answer finalization", () => {
  it("strips a governed follow-up payload when no answer packet arrived", () => {
    // resolveAssistantAnswerText only runs in the agent-answer branch, so an
    // answer that completes without a packet was previously rendered from the
    // raw streamed accumulation with the fence intact.
    const finalized = finalizeAssistantMessage({
      status: "streaming",
      answer: FENCED_ANSWER,
    });

    expect(finalized.answer).toContain("advisory read");
    expect(finalized.answer).not.toContain("followups");
    expect(finalized.answer).not.toContain("What would change this view?");
    expect(finalized.status).toBe("done");
  });

  it("leaves an already-clean packet answer untouched in substance", () => {
    const clean = resolveAssistantAnswerText("", "The read is clear.", false);
    expect(finalizeAssistantMessage({ status: "streaming", answer: clean }).answer).toBe(
      "The read is clear.",
    );
  });

  it("preserves an error status rather than reporting a failed stream as done", () => {
    expect(
      finalizeAssistantMessage({ status: "error", answer: "boom" }).status,
    ).toBe("error");
  });
});

/**
 * The page, mounted, fed an /api/intelligence/ask stream that never sends an
 * `agent-answer` packet. These replace a case that read the component's source
 * text for the call site, which a comment could satisfy.
 *
 * Two guards strip the fence on this path: the `delta` handler re-strips the
 * whole accumulation on every chunk, and `finalizeAssistantMessage` strips it
 * again on completion. Each case below names the guard it can see fail.
 */
describe("AdvisoryIntelligencePage stream completion without an answer packet", () => {
  const viewModel = getEnterpriseLandscapeViewModel({
    clientKey: "skyharbor",
    tenantName: "SkyHarbor Air",
  });
  const originalFetch = global.fetch;
  const originalDecoder = global.TextDecoder;

  beforeAll(() => {
    global.TextDecoder = TextDecoder as typeof global.TextDecoder;
  });

  afterAll(() => {
    global.fetch = originalFetch;
    global.TextDecoder = originalDecoder;
  });

  const line = (event: Record<string, unknown>) => `${JSON.stringify(event)}\n`;

  /**
   * A response body whose chunks the test releases one at a time, so the
   * rendered answer can be read while the stream is still open.
   */
  function controlledStream() {
    const encoder = new TextEncoder();
    const queued: string[] = [];
    let closed = false;
    let wake: (() => void) | null = null;
    const notify = () => {
      wake?.();
      wake = null;
    };
    const reader = {
      async read(): Promise<{ done: boolean; value?: Uint8Array }> {
        while (queued.length === 0 && !closed) {
          await new Promise<void>((resolve) => {
            wake = resolve;
          });
        }
        const next = queued.shift();
        return next === undefined
          ? { done: true }
          : { done: false, value: encoder.encode(next) };
      },
    };
    return {
      body: { getReader: () => reader },
      push: async (chunk: string) => {
        await act(async () => {
          queued.push(chunk);
          notify();
          await new Promise((resolve) => setTimeout(resolve, 0));
        });
      },
      close: async () => {
        await act(async () => {
          closed = true;
          notify();
          await new Promise((resolve) => setTimeout(resolve, 0));
        });
      },
    };
  }

  async function askFirstStarter() {
    const stream = controlledStream();
    const fetchMock = jest.fn(async () => ({
      ok: true,
      status: 200,
      body: stream.body,
    }));
    global.fetch = fetchMock as unknown as typeof global.fetch;
    render(createElement(AdvisoryIntelligencePage, { viewModel }));
    const [starter] = buildStarterPrompts(viewModel);
    fireEvent.click(screen.getByTestId(`agent-dock-suggestion-${starter}`));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    return stream;
  }

  const agentTurnText = () =>
    screen
      .getAllByTestId("agent-dock-turn-agent")
      .map((turn) => turn.textContent ?? "")
      .join("\n");

  it("never shows the follow-up fence, mid-stream or after completion", async () => {
    const stream = await askFirstStarter();

    await stream.push(line({ type: "delta", delta: `${PROSE}\n\n\`\`\`follow` }));
    await stream.push(
      line({
        type: "delta",
        delta: 'ups\n["What would change this view?","What evidence is still missing?"]\n```',
      }),
    );

    // Still streaming: only the per-chunk strip in the delta handler can
    // have run. Removing it shows the fence here even though completion
    // would later clean it up.
    await waitFor(() => expect(agentTurnText()).toContain(PROSE));
    expect(agentTurnText()).not.toMatch(/followups|What would change this view\?/);

    await stream.close();

    // Completed without a packet: what the reader is left with.
    const settled = agentTurnText();
    expect(settled).toContain(PROSE);
    expect(settled).not.toMatch(/followups|What would change this view\?|```/);
  });

  it("clears the in-progress stream status once a fence-only answer completes", async () => {
    // The answer is nothing but a governed payload, so the stripped body is
    // empty and the turn falls back to the stream status. Only finalization
    // clears that status; without it the last progress line is left standing
    // as the finished answer.
    const stream = await askFirstStarter();

    await stream.push(
      line({ type: "delta", delta: '```followups\n["What would change this view?"]\n```' }),
    );
    await stream.push(line({ type: "sources", sources: [] }));
    await waitFor(() =>
      expect(agentTurnText()).toContain("Checking available client context..."),
    );

    await stream.close();

    await waitFor(() =>
      expect(agentTurnText()).not.toContain("Checking available client context..."),
    );
    expect(agentTurnText()).not.toMatch(/followups|What would change this view\?/);
  });
});
