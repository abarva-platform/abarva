/**
 * @jest-environment jsdom
 */

import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AiSuccessCommandCenter } from "@/components/home/ai-success-command-center/AiSuccessCommandCenter";
import { readSkyHarborAiSuccessHome } from "@/lib/home/readSkyHarborAiSuccessHome";

jest.mock("@/components/architecture/CurrentStateArchitectureMap", () => ({
  CurrentStateArchitectureMap: () => (
    <div data-testid="current-state-architecture-map" />
  ),
}));

jest.mock("@/lib/ava-answer/homeComposer", () => ({
  composeHomeKnowAvaAnswer: jest.fn((response) => ({
    surface: "home",
    mode: "KNOW",
    tenantKey: response.tenantKey,
    question: response.question,
    intent: response.intent,
    status: "answered",
    directAnswer: response.prose,
    factsUsed: [],
    metricsUsed: [],
    relationshipsUsed: [],
    artifacts: [],
    citations: [],
    gaps: [],
    caveats: [],
    nextSteps: [],
    quality: {
      confidence: "high",
      evidenceStrength: "strong",
      tenantGrounding: "complete",
      answerCompleteness: "complete",
    },
    safety: {
      tenantFencePassed: true,
      rawIdsSuppressed: true,
      forbiddenLanguagePassed: true,
      unsupportedClaimsBlocked: true,
    },
  })),
}));

jest.mock("@/components/agent-answer/AgentAnswerRenderer", () => ({
  AgentAnswerRenderer: ({
    answer,
    showExport,
  }: {
    answer: { directAnswer: string };
    showExport?: boolean;
  }) => (
    <section aria-label="mock aVa answer">
      <p>{answer.directAnswer}</p>
      {showExport ? <button type="button">Export HTML</button> : null}
      {showExport ? <button type="button">Export PDF</button> : null}
    </section>
  ),
}));

const fetchMock = jest.fn();

function homeKnowJsonResponse(payload: unknown) {
  return {
    ok: true,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-type" ? "application/json" : null,
    },
    body: null,
    json: async () => payload,
  } as unknown as Response;
}

function homeKnowJsonErrorResponse() {
  return {
    ok: false,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-type" ? "application/json" : null,
    },
    json: async () => ({
      error: "visible_answer_contract_failed",
      detail: "internal display boundary",
    }),
  } as unknown as Response;
}

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  Element.prototype.scrollIntoView = jest.fn();
  window.scrollTo = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

it("renders the generated advisory story and architecture canvas", () => {
  render(<AiSuccessCommandCenter data={readSkyHarborAiSuccessHome()} />);

  expect(
    screen.getByText(/AI scale is real. Value management has not caught up/i),
  ).toBeInTheDocument();
  expect(screen.getByText(/finance-validated outcomes/i)).toBeInTheDocument();

  fireEvent.click(
    screen.getByRole("button", { name: /Current-state architecture/i }),
  );
  expect(screen.getByText(/Evidence graph/i)).toBeInTheDocument();
  expect(
    screen.getByTestId("current-state-architecture-map"),
  ).toBeInTheDocument();
});

it("wires expanded Ask aVa to the Home KNOW provider with export-capable rendering", async () => {
  fetchMock.mockResolvedValueOnce(
    homeKnowJsonResponse({
      mode: "KNOW",
      intent: "table",
      tenantKey: "skyharbor_global",
      question: "Show the loaded context dimensions in a table.",
      prose: "The Home context is loaded enough to show a governed table.",
    }),
  );

  render(<AiSuccessCommandCenter data={readSkyHarborAiSuccessHome()} />);

  fireEvent.click(screen.getAllByRole("button", { name: /Ask aVa/i })[0]);
  fireEvent.click(
    screen.getByRole("button", {
      name: /Show the loaded context dimensions in a table/i,
    }),
  );

  await waitFor(() =>
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/home/know/ask",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          question: "Show the loaded context dimensions in a table.",
          tenantKey: "skyharbor_global",
          client: "skyharbor_global",
          stream: true,
        }),
      }),
    ),
  );

  expect(
    await screen.findByText(
      /The Home context is loaded enough to show a governed table/i,
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /Export HTML/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /Export PDF/i }),
  ).toBeInTheDocument();
});

it("does not expose internal provider errors in the Ask aVa drawer", async () => {
  fetchMock.mockResolvedValueOnce(homeKnowJsonErrorResponse());

  render(<AiSuccessCommandCenter data={readSkyHarborAiSuccessHome()} />);

  fireEvent.click(screen.getAllByRole("button", { name: /Ask aVa/i })[0]);
  fireEvent.click(
    screen.getByRole("button", {
      name: /Show the loaded context dimensions in a table/i,
    }),
  );

  expect(
    await screen.findByText(/aVa could not reach the Home KNOW provider/i),
  ).toBeInTheDocument();
  expect(
    screen.queryByText(/visible_answer_contract_failed/i),
  ).not.toBeInTheDocument();
});
