/**
 * @jest-environment jsdom
 */

import { TextDecoder, TextEncoder } from "util";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  AdvisoryIntelligencePage,
  buildStarterPrompts,
} from "../AdvisoryIntelligencePage";
import { getEnterpriseLandscapeViewModel } from "@/lib/home/enterprise-landscape-view-model";

describe("AdvisoryIntelligencePage", () => {
  const viewModel = getEnterpriseLandscapeViewModel({
    clientKey: "skyharbor",
    tenantName: "SkyHarbor Air",
  });

  it("renders Intelligence as a chat-only advisor surface", () => {
    render(<AdvisoryIntelligencePage viewModel={viewModel} />);

    expect(screen.getByTestId("agent-dock-chat-only-shell")).toBeTruthy();
    expect(screen.queryByTestId("agent-dock-side-rail-shell")).toBeNull();
    expect(screen.getAllByText("Intelligence advisor").length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("Ask aVa anything.")).toBeTruthy();
    expect(screen.queryByLabelText("Intelligence briefing")).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Industry Outlook/i }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: /Future Trends/i })).toBeNull();
    expect(screen.queryByText(/<<<TAB:/i)).toBeNull();
    expect(screen.queryByText(/grounding:/i)).toBeNull();
  });

  it("keeps vertical starter questions visible in chat-only mode", () => {
    render(<AdvisoryIntelligencePage viewModel={viewModel} />);

    // Assert against the builder rather than pinned copy: the wording is
    // covered by intelligence-starter-prompts.test.ts, which checks the answer
    // mode each starter reaches. What matters here is that they all render.
    const prompts = buildStarterPrompts(viewModel);
    expect(prompts.length).toBeGreaterThan(0);
    for (const prompt of prompts) {
      expect(screen.getByText(prompt)).toBeTruthy();
    }
  });
});

/**
 * Item U-549. The page, mounted, fed an /api/intelligence/ask stream with no
 * `agent-answer` packet, released one chunk at a time so the rendered answer
 * can be read while the stream is still open.
 *
 * The `delta` handler used to strip the running accumulation and store the
 * stripped text, then append the next chunk to it. A chunk boundary inside a
 * governed payload's JSON dropped the unclosed opener on one chunk and left
 * the next chunk's tail on clean text no strip pattern recognises.
 */
describe("AdvisoryIntelligencePage stream chunk boundaries", () => {
  const viewModel = getEnterpriseLandscapeViewModel({
    clientKey: "skyharbor",
    tenantName: "SkyHarbor Air",
  });
  const PROSE =
    "The evidence supports an advisory read, not a certified decision.";
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
  const delta = (text: string) => line({ type: "delta", delta: text });

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
    const settle = async (mutate: () => void) => {
      await act(async () => {
        mutate();
        notify();
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
    };
    return {
      body: { getReader: () => reader },
      push: (chunk: string) => settle(() => queued.push(chunk)),
      close: () =>
        settle(() => {
          closed = true;
        }),
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
    render(<AdvisoryIntelligencePage viewModel={viewModel} />);
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

  const LEAK = /change this view|What would|followups|```|"\]/;

  it("never shows a follow-up payload whose JSON is split across chunks", async () => {
    const stream = await askFirstStarter();

    await stream.push(delta(PROSE));
    await waitFor(() => expect(agentTurnText()).toContain(PROSE));

    await stream.push(delta('\n\n```followups\n["What would'));
    expect(agentTurnText()).toContain(PROSE);
    expect(agentTurnText()).not.toMatch(LEAK);

    await stream.push(delta(' change this view?"]\n```'));
    expect(agentTurnText()).toContain(PROSE);
    expect(agentTurnText()).not.toMatch(LEAK);

    await stream.close();

    const settled = agentTurnText();
    expect(settled).toContain(PROSE);
    expect(settled).not.toMatch(LEAK);
  });

  it("shows ordinary prose as it arrives and keeps the whitespace a chunk ends on", async () => {
    // Holding text back to be safe about payloads is not the fix: each prose
    // chunk is visible before the next one is sent. A chunk that ends on a
    // paragraph break must not be glued to the next one either.
    const stream = await askFirstStarter();

    await stream.push(delta("First paragraph ends here.\n\n"));
    await waitFor(() =>
      expect(agentTurnText()).toContain("First paragraph ends here."),
    );

    await stream.push(delta("Second paragraph "));
    expect(agentTurnText()).toContain("Second paragraph");

    await stream.push(delta("follows it."));
    expect(agentTurnText()).toContain("Second paragraph follows it.");

    await stream.close();

    // The paragraph break the first chunk ended on survived into the text the
    // markdown renderer receives.
    expect(agentTurnText()).toContain(
      "First paragraph ends here.\n\nSecond paragraph follows it.",
    );
  });
});
