/** @jest-environment jsdom */
import { TextDecoder, TextEncoder } from "util";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { IntelligenceQualityReview } from "../IntelligenceQualityReview";
import { getEnterpriseLandscapeViewModel } from "@/lib/home/enterprise-landscape-view-model";
import { modelAuthoredAnswerPacket } from "@/lib/intelligence/answer/model-authored-answer";

const viewModel = getEnterpriseLandscapeViewModel({
  clientKey: "skyharbor",
  tenantName: "Example organization",
});
const raw = "**Validate first.**  Keep this spacing.\n\nSet a clear gate.";
const originalFetch = global.fetch,
  originalDecoder = global.TextDecoder;
beforeEach(() => {
  global.TextDecoder = TextDecoder as typeof global.TextDecoder;
});
afterEach(() => {
  global.fetch = originalFetch;
  global.TextDecoder = originalDecoder;
  jest.restoreAllMocks();
});

function response(packet: ReturnType<typeof modelAuthoredAnswerPacket>) {
  const encoder = new TextEncoder();
  const ndjson = `${JSON.stringify({ type: "agent-answer", answer: packet })}\n${JSON.stringify({ type: "done" })}\n`;
  let i = 0;
  return {
    ok: true,
    status: 200,
    body: {
      getReader: () => ({
        read: async () =>
          i++ === 0
            ? { done: false, value: encoder.encode(ndjson.slice(0, 23)) }
            : i === 2
              ? { done: false, value: encoder.encode(ndjson.slice(23)) }
              : { done: true },
      }),
    },
  };
}

it("runs ten isolated questions and exports their exact responses in one session", async () => {
  const fetchMock = jest.fn(async (url: string, init: RequestInit) => {
    const body = JSON.parse(init.body as string);
    if (url.endsWith("/export"))
      return { ok: true, blob: async () => new Blob(["PDF"]) };
    return response(modelAuthoredAnswerPacket(raw, body.query, "test", []));
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  const create = jest.fn(() => "blob:review"),
    revoke = jest.fn();
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: create,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: revoke,
  });
  jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  const onRunningChange = jest.fn();
  render(
    <IntelligenceQualityReview
      viewModel={viewModel}
      surfaceContext={{ activeTab: "intelligence" }}
      disabled={false}
      onRunningChange={onRunningChange}
    />,
  );
  fireEvent.click(screen.getByText("10-question quality review"));
  fireEvent.click(screen.getByRole("button", { name: "Run 10 questions" }));
  await waitFor(() =>
    expect(screen.getByRole("status").textContent).toBe(
      "10 of 10 answers completed",
    ),
  );
  expect(fetchMock).toHaveBeenCalledTimes(10);
  const asks = fetchMock.mock.calls.map(([, init]) =>
    JSON.parse(init.body as string),
  );
  expect(new Set(asks.map((a) => a.tabId)).size).toBe(10);
  expect(
    asks.every(
      (a) =>
        a.modelAuthoredOutput &&
        a.answerOnlyStreaming &&
        a.surfaceContext.activeTab === "intelligence",
    ),
  ).toBe(true);
  expect(onRunningChange.mock.calls).toEqual([[true], [false]]);
  fireEvent.click(screen.getByRole("button", { name: "Export review PDF" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(11));
  const exported = JSON.parse(fetchMock.mock.calls[10][1].body as string);
  expect(exported.format).toBe("pdf");
  expect(exported.session.turns).toHaveLength(20);
  expect(exported.session.qualityReview.completedQuestions).toBe(10);
  expect(exported.session.qualityReview.includeOriginalResponses).toBe(false);
  expect(
    exported.session.turns
      .filter((t: { role: string }) => t.role === "agent")
      .every(
        (t: { body: string; answer: { modelAuthored: { rawText: string } } }) =>
          t.body === raw && t.answer.modelAuthored.rawText === raw,
      ),
  ).toBe(true);
  fireEvent.click(screen.getByRole("checkbox", { name: "Include original response appendix" }));
  fireEvent.click(screen.getByRole("button", { name: "Export review PDF" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(12));
  const auditExport = JSON.parse(fetchMock.mock.calls[11][1].body as string);
  expect(auditExport.session.qualityReview.includeOriginalResponses).toBe(true);
  expect(auditExport.session.turns).toEqual(exported.session.turns);
});

it("keeps failed requests explicit and continues the remaining questions", async () => {
  let count = 0;
  global.fetch = jest.fn(async (_url: string, init: RequestInit) => {
    count++;
    if (count === 2) return { ok: false, status: 503 };
    const query = JSON.parse(init.body as string).query;
    return response(modelAuthoredAnswerPacket(raw, query, "test", []));
  }) as unknown as typeof fetch;
  render(
    <IntelligenceQualityReview
      viewModel={viewModel}
      surfaceContext={{ activeTab: "intelligence" }}
      disabled={false}
      onRunningChange={() => {}}
    />,
  );
  fireEvent.click(screen.getByText("10-question quality review"));
  fireEvent.click(screen.getByRole("button", { name: "Run 10 questions" }));
  await waitFor(() =>
    expect(screen.getByRole("status").textContent).toBe(
      "9 of 10 answers completed",
    ),
  );
  expect(count).toBe(10);
  expect(screen.getByText(/Question 2 · failed/)).toBeTruthy();
});

it("cancels the active request and keeps a partial review exportable", async () => {
  const fetchMock = jest.fn(
    (_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError")),
        );
      }),
  );
  global.fetch = fetchMock as unknown as typeof fetch;
  render(
    <IntelligenceQualityReview
      viewModel={viewModel}
      surfaceContext={{ activeTab: "intelligence" }}
      disabled={false}
      onRunningChange={() => {}}
    />,
  );
  fireEvent.click(screen.getByText("10-question quality review"));
  fireEvent.click(screen.getByRole("button", { name: "Run 10 questions" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole("button", { name: "Stop review" }));
  await waitFor(() =>
    expect(screen.getByRole("status").textContent).toBe(
      "0 of 10 answers completed",
    ),
  );
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(screen.getByText(/Question 1 · cancelled/)).toBeTruthy();
  expect(
    (
      screen.getByRole("button", {
        name: "Export review PDF",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(false);
});

it("retains a completed packet when cancellation interrupts only the trailing stream", async () => {
  const encoder = new TextEncoder();
  let packetRead = false;
  const fetchMock = jest.fn(async (_url: string, init: RequestInit) => {
    const query = JSON.parse(init.body as string).query;
    const packet = modelAuthoredAnswerPacket(raw, query, "test", []);
    return {
      ok: true,
      status: 200,
      body: {
        getReader: () => ({
          read: () => {
            if (!packetRead) {
              packetRead = true;
              return Promise.resolve({
                done: false,
                value: encoder.encode(
                  JSON.stringify({ type: "agent-answer", answer: packet }) +
                    "\n",
                ),
              });
            }
            return new Promise((_resolve, reject) =>
              init.signal?.addEventListener("abort", () =>
                reject(new DOMException("Aborted", "AbortError")),
              ),
            );
          },
        }),
      },
    };
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  render(
    <IntelligenceQualityReview
      viewModel={viewModel}
      surfaceContext={{ activeTab: "intelligence" }}
      disabled={false}
      onRunningChange={() => {}}
    />,
  );
  fireEvent.click(screen.getByText("10-question quality review"));
  fireEvent.click(screen.getByRole("button", { name: "Run 10 questions" }));
  await waitFor(() => expect(packetRead).toBe(true));
  fireEvent.click(screen.getByRole("button", { name: "Stop review" }));
  await waitFor(() =>
    expect(screen.getByRole("status").textContent).toBe(
      "1 of 10 answers completed",
    ),
  );
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(screen.getByText(/Question 1 · complete/)).toBeTruthy();
});
