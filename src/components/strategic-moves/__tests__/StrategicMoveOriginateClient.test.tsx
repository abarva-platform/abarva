/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { TextDecoder } from "util";
import { StrategicMoveOriginateClient } from "../StrategicMoveOriginateClient";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

function makeMockBody(text: string) {
  const bytes = new Uint8Array(Array.from(text).map((c) => c.charCodeAt(0)));
  let yielded = false;
  return {
    getReader() {
      return {
        async read() {
          if (yielded) {
            return { done: true, value: undefined as Uint8Array | undefined };
          }
          yielded = true;
          return { done: false, value: bytes };
        },
      };
    },
  };
}

function mockFetchWithChatArtifact(artifactText: string) {
  const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url === "/api/chat/agent") {
      return {
        ok: true,
        status: 200,
        body: makeMockBody(artifactText),
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    };
  });
  (global as { fetch: unknown }).fetch = fetchMock;
  return fetchMock;
}

function mockFetchWithChatArtifactAndExtraction(
  artifactText: string,
  fields: Record<string, string>,
) {
  const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url === "/api/chat/agent") {
      return {
        ok: true,
        status: 200,
        body: makeMockBody(artifactText),
      };
    }
    if (url === "/api/v1/programs/originate/extract-brief") {
      return {
        ok: true,
        status: 200,
        json: async () => ({ fields }),
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    };
  });
  (global as { fetch: unknown }).fetch = fetchMock;
  return fetchMock;
}

describe("StrategicMoveOriginateClient", () => {
  beforeAll(() => {
    (global as unknown as { TextDecoder: typeof TextDecoder }).TextDecoder =
      TextDecoder;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithChatArtifact("");
  });

  it("requires all seven Move brief sections before promotion", async () => {
    const fourSectionProgress =
      "Captured four fields. [[artifact:brief-progress]]" +
      JSON.stringify({
        fieldsTotal: 7,
        fieldsFilled: 4,
        fields: [
          {
            id: "problem-statement",
            label: "What's the bet / hypothesis",
            status: "filled",
            value: "Consolidate AMS vendors to reduce run cost.",
          },
          {
            id: "archetype",
            label: "Archetype classification",
            status: "filled",
            value: "Cost efficiency",
          },
          {
            id: "sponsor-candidate",
            label: "Sponsor candidate",
            status: "filled",
            value: "CIO",
          },
          {
            id: "scope-boundary",
            label: "Scope / boundary",
            status: "filled",
            value: "Application managed services only.",
          },
        ],
      }) +
      "[[/artifact]]";
    const fetchMock = mockFetchWithChatArtifact(fourSectionProgress);

    render(<StrategicMoveOriginateClient tenantName="Apex Retail" />);

    const [headerMark] = screen.getAllByTestId("ava-ask-wordmark");
    expect(headerMark).toHaveAttribute(
      "src",
      "/brand/ava/ava-avatar-dark.svg",
    );
    expect(screen.queryByText(/^Ava$/)).not.toBeInTheDocument();

    const promoteButton = screen.getByRole("button", {
      name: /promote to p1 charter/i,
    });
    expect(promoteButton).toBeDisabled();
    expect(
      screen.getByText("0 of 7 required sections complete"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Describe the business problem or opportunity/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/optional/i)).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/describe the outcome/i), {
        target: { value: "Start with the AMS vendor consolidation signal." },
      });
      fireEvent.click(screen.getByRole("button", { name: "Send" }));
    });

    await waitFor(() => {
      expect(
        screen.getByText("4 of 7 required sections complete"),
      ).toBeInTheDocument();
    });

    expect(promoteButton).toBeDisabled();
    expect(
      screen.getByText("Complete all 7 brief sections to promote."),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/chat/agent",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("lets deterministic extraction override stale brief-progress artifact fields", async () => {
    const staleArtifact =
      "Captured all fields with a stale sponsor. [[artifact:brief-progress]]" +
      JSON.stringify({
        fieldsTotal: 7,
        fieldsFilled: 7,
        fields: [
          {
            id: "problem-statement",
            label: "What's the bet / hypothesis",
            status: "filled",
            value: "Treasury visibility risk.",
          },
          {
            id: "archetype",
            label: "Archetype classification",
            status: "filled",
            value: "Platform modernization",
          },
          {
            id: "sponsor-candidate",
            label: "Sponsor candidate",
            status: "filled",
            value: "Dr. Anita Krishnamurthy",
          },
          {
            id: "scope-boundary",
            label: "Scope / boundary",
            status: "filled",
            value: "Bank connectivity.",
          },
          {
            id: "evidence-family",
            label: "Evidence family selection",
            status: "filled",
            value: "Treasury and controls.",
          },
          {
            id: "value-hypothesis",
            label: "Value hypothesis seed",
            status: "filled",
            value: "Cleaner cash visibility.",
          },
          {
            id: "foundation-readiness",
            label: "Foundation readiness",
            status: "filled",
            value: "Kyriba rollout underway.",
          },
        ],
      }) +
      "[[/artifact]]";
    const extractionFields = {
      "problem-statement":
        "Treasury visibility and payment-control risk across banks and SAP feeds.",
      archetype: "Treasury modernization and finance-controls move.",
      "sponsor-candidate": "CFO and Treasurer, with CIO support.",
      "scope-boundary":
        "Treasury operations, bank connectivity, SAP finance feeds, payment controls, and control evidence.",
      "evidence-family":
        "Finance systems, treasury operations, risk and controls, vendor/contracts, data readiness.",
      "value-hypothesis":
        "Faster cash visibility and cleaner payment-control evidence.",
      "foundation-readiness":
        "Kyriba rollout is underway, but bank connectivity and SOX evidence need validation.",
    };
    mockFetchWithChatArtifactAndExtraction(staleArtifact, extractionFields);

    render(<StrategicMoveOriginateClient tenantName="Lakeshore Holdings" />);

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/describe the outcome/i), {
        target: { value: "Create the Kyriba treasury Move." },
      });
      fireEvent.click(screen.getByRole("button", { name: "Send" }));
    });

    await waitFor(() => {
      expect(screen.getByText("Ready to promote")).toBeInTheDocument();
    });
    expect(screen.getByText("CFO and Treasurer, with CIO support."))
      .toBeInTheDocument();
    expect(screen.queryByText("Dr. Anita Krishnamurthy")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /promote to p1 charter/i }),
    ).toBeEnabled();
  });
});
