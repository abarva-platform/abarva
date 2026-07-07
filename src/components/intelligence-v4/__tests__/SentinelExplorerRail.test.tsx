/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TextDecoder } from "util";

import { SentinelExplorerRail } from "../SentinelExplorerRail";

function ndjsonResponse(lines: unknown[]): Response {
  const bytes = new Uint8Array(
    Buffer.from(lines.map((line) => JSON.stringify(line)).join("\n") + "\n"),
  );
  return {
    ok: true,
    status: 200,
    body: {
      getReader() {
        let sent = false;
        return {
          async read() {
            if (sent) return { done: true, value: undefined };
            sent = true;
            return { done: false, value: bytes };
          },
        };
      },
    },
  } as Response;
}

describe("SentinelExplorerRail", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    global.TextDecoder = TextDecoder as typeof global.TextDecoder;
  });

  it("submits typed composer text to the live QA route", async () => {
    const fetchMock = jest
      .fn<Promise<Response>, Parameters<typeof fetch>>()
      .mockResolvedValue(
        ndjsonResponse([
        {
          type: "route",
          routeUsed: "insight-lookup",
          confidence: "high",
          freshnessStatus: "fresh",
          citationCount: 1,
        },
        { type: "delta", text: "Live answer." },
        {
          type: "done",
          answer: {
            routeUsed: "insight-lookup",
            citations: [{ id: "c1" }],
            confidence: "high",
            freshnessStatus: "fresh",
          },
        },
        ]),
      );
    global.fetch = fetchMock;

    render(<SentinelExplorerRail tenantKey="skyharbor-air" />);

    const composer = screen.getByPlaceholderText(
      /Ask anything/,
    ) as HTMLTextAreaElement;
    fireEvent.input(composer, {
      target: { value: "What is my context telling me right now?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ask Ava" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/intelligence/qa",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            query: "What is my context telling me right now?",
            tenantKey: "skyharbor-air",
          }),
        }),
      ),
    );
    await waitFor(() => expect(screen.getByText("Live answer.")).toBeVisible());
  });
});
