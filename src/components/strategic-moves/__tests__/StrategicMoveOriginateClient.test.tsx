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

function openAvaDock() {
  const chip = screen.queryByTestId("agent-dock-collapsed-chip");
  if (chip) fireEvent.click(chip);
}

function sendDockMessage(message: string) {
  fireEvent.change(screen.getByTestId("agent-dock-input"), {
    target: { value: message },
  });
  fireEvent.click(screen.getByTestId("agent-dock-send"));
}

function selectP0Tab(step: number) {
  const labels = [
    /business problem or opportunity/i,
    /transformation pattern/i,
    /executive sponsor/i,
    /move scope and guardrails/i,
    /value hypothesis/i,
    /evidence families to collect/i,
    /evidence families to collect/i,
  ];
  fireEvent.click(screen.getByRole("button", { name: labels[step - 1] }));
}

function submitP0Section(container: HTMLElement, step: number, value: string) {
  selectP0Tab(step);
  const input = container.querySelector(
    `#orig-canvas-brief-section-${step}-input`,
  ) as HTMLTextAreaElement | null;
  expect(input).not.toBeNull();
  fireEvent.change(input!, { target: { value } });
  fireEvent.click(
    screen.getByRole("button", {
      name:
        step === 7
          ? /submit readiness|update readiness/i
          : /submit section|update section/i,
    }),
  );
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

    expect(
      screen.getByRole("complementary", { name: /move journey/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("agent-dock-collapsed-chip")).toBeInTheDocument();
    openAvaDock();

    expect(screen.getAllByTestId("ava-ask-wordmark")[0]).toHaveAttribute(
      "src",
      "/brand/ava/ava-wordmark-2tone-dark.svg",
    );
    expect(screen.queryByText(/^Ava$/)).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /approve and build the charter/i }),
    );
    const approveButton = screen.getByRole("button", {
      name: /^approve and build$/i,
    });
    expect(approveButton).toBeDisabled();
    expect(screen.getAllByText("0 of 7")[0]).toBeInTheDocument();
    expect(
      screen.getByText(/Describe the business problem or opportunity/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/optional/i)).not.toBeInTheDocument();

    await act(async () => {
      sendDockMessage("Start with the AMS vendor consolidation signal.");
    });

    await waitFor(() => {
      expect(
        screen.getAllByText(/4 of 7 complete/i)[0],
      ).toBeInTheDocument();
    });

    expect(approveButton).toBeDisabled();
    expect(
      screen.getByText(/finish the remaining P0 answers/i),
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
    openAvaDock();

    await act(async () => {
      sendDockMessage("Create the Kyriba treasury Move.");
    });

    await waitFor(() => {
      expect(screen.getByText(/All steps complete/i)).toBeInTheDocument();
    });
    selectP0Tab(3);
    expect(
      screen.getByDisplayValue("CFO and Treasurer, with CIO support."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Dr. Anita Krishnamurthy"),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /approve and build the charter/i }),
    );
    expect(
      screen.getByRole("button", { name: /^approve and build$/i }),
    ).toBeEnabled();
  });

  it("fills the scaffold directly from a complete labeled user prompt when artifacts and extraction are empty", async () => {
    mockFetchWithChatArtifactAndExtraction("", {});

    render(<StrategicMoveOriginateClient tenantName="Lakeshore Holdings" />);
    openAvaDock();

    const prompt = `Create a strategic Move named "Kyriba Treasury Controls Proof" for Lakeshore Holdings' Kyriba treasury rollout. The business problem is treasury visibility and payment-control risk across banks, SAP feeds, signers, payment formats, and SOX evidence. Sponsor candidate: CFO and Treasurer, with CIO support. Scope: treasury operations, bank connectivity, SAP finance feeds, payment controls, and control evidence; out of scope: changing the ERP core in this move. Evidence family: finance systems, treasury operations, risk and controls, vendor/contracts, data readiness. Value hypothesis: faster cash visibility, lower manual reconciliation effort, cleaner payment-control evidence, and better board confidence. Foundation readiness: Kyriba rollout is underway, but data lineage, bank connectivity inventory, signer controls, and SOX evidence need validation.`;

    await act(async () => {
      sendDockMessage(prompt);
    });

    await waitFor(() => {
      expect(screen.getByText(/All steps complete/i)).toBeInTheDocument();
    });
    expect(
      screen.getByDisplayValue("Kyriba Treasury Controls Proof"),
    ).toBeInTheDocument();
    selectP0Tab(3);
    expect(
      screen.getByDisplayValue("CFO and Treasurer, with CIO support."),
    ).toBeInTheDocument();
    selectP0Tab(2);
    expect(
      screen.getAllByText(
        "Treasury modernization and finance-controls move.",
      )[0],
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /approve and build the charter/i }),
    );
    expect(
      screen.getByRole("button", { name: /^approve and build$/i }),
    ).toBeEnabled();
  });

  it("allows each P0 brief section to be typed and submitted without using chat", async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/programs/origination-submit") {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            engagementId: "move-manual-p0",
            redirectTo: "/programs/move-manual-p0",
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      };
    });
    (global as { fetch: unknown }).fetch = fetchMock;

    const { container } = render(
      <StrategicMoveOriginateClient tenantName="Meridian Health" />,
    );

    const values = [
      "Member service quality is constrained by fragmented system navigation and inconsistent knowledge access.",
      "Contact Center Agent Assist — agent augmentation for member-service operations.",
      "Chief Operating Officer, with CDIO as data/platform co-sponsor.",
      "Claims status, prior authorization status, benefits and eligibility, CRM history, and agent knowledge lookup.",
      "Reduce avoidable handle time, repeat contact, transfers, and manual rework while improving answer consistency.",
      "Call metrics, CRM history, claims samples, prior authorization samples, benefits and eligibility samples, systems inventory, controls, and value assumptions.",
      "CRM, claims, eligibility, prior authorization, knowledge, identity, audit, data quality, and PHI controls need validation.",
    ];

    values.forEach((value, index) => {
      submitP0Section(container, index + 1, value);
    });

    expect(screen.getByText(/All steps complete/i)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /approve and build the charter/i }),
    );
    expect(
      screen.getByRole("button", { name: /^approve and build$/i }),
    ).toBeEnabled();
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/chat/agent",
      expect.anything(),
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /^approve and build$/i }),
      );
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        "/strategic-moves/move-manual-p0/phase/0?focus=gate",
      );
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/programs/origination-submit",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining(
          '"sponsor":"Chief Operating Officer, with CDIO as data/platform co-sponsor."',
        ),
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/programs/origination-submit",
      expect.objectContaining({
        body: expect.stringContaining(
          '"programName":"Member Service Agent Assist"',
        ),
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/programs/origination-submit",
      expect.objectContaining({
        body: expect.stringContaining('"evidenceFamily":"Call metrics'),
      }),
    );
  });

  it("normalizes a sentence-like manual move name into a short strategic name", async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/programs/origination-submit") {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            engagementId: "move-short-name",
            redirectTo: "/strategic-moves/move-short-name/phase/0?focus=gate",
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      };
    });
    (global as { fetch: unknown }).fetch = fetchMock;

    const { container } = render(
      <StrategicMoveOriginateClient tenantName="Meridian Health" />,
    );

    [
      "Members experience long calls because agents navigate too many systems.",
      "Contact Center Agent Assist.",
      "COO.",
      "Member-service call center workflows.",
      "Reduce handle time and repeat contact.",
      "Call metrics and CRM history.",
      "CRM, claims, eligibility, and PHI controls need validation.",
    ].forEach((value, index) => {
      submitP0Section(container, index + 1, value);
    });

    selectP0Tab(1);
    fireEvent.change(
      screen.getByLabelText(/move title/i),
      {
        target: {
          value:
            "Members experience long calls and inconsistent answers because agents navigate too many systems",
        },
      },
    );

    fireEvent.click(
      screen.getByRole("button", { name: /approve and build the charter/i }),
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /^approve and build$/i }),
      );
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/programs/origination-submit",
      expect.objectContaining({
        body: expect.stringContaining(
          '"programName":"Member Service Agent Assist"',
        ),
      }),
    );
  });

  describe("P0 HTML contract shell", () => {
    it("renders the universal Moves shell structure for origination", () => {
      const { container } = render(
        <StrategicMoveOriginateClient tenantName="Lakeshore Holdings" />,
      );

      const page = container.querySelector("#orig-page");
      expect(page).not.toBeNull();
      expect(page).toHaveClass("page");
      expect(
        screen.getByRole("complementary", {
          name: /move journey: phase 0/i,
        }),
      ).toBeInTheDocument();
      expect(screen.getByText("Phases")).toBeInTheDocument();
      expect(screen.getByText("Workspace")).toBeInTheDocument();
      expect(screen.getByText("Files & Evidence")).toBeInTheDocument();
      expect(screen.getByText("Phase Intelligence")).toBeInTheDocument();
      expect(screen.getByText("Approvals")).toBeInTheDocument();
      expect(screen.getAllByText("P0 Originate")[0]).toBeInTheDocument();
      expect(screen.getByText("P0 · aVa")).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /steps/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /files/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /intelligence/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", {
          name: /business problem or opportunity/i,
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", {
          name: /approve and build the charter/i,
        }),
      ).toBeInTheDocument();
    });

    it("keeps P0 promotion blocked until all 7 sections are captured", async () => {
      const { container } = render(
        <StrategicMoveOriginateClient tenantName="Meridian Health" />,
      );

      fireEvent.click(
        screen.getByRole("button", { name: /approve and build the charter/i }),
      );
      const approveButton = screen.getByRole("button", {
        name: /^approve and build$/i,
      });
      expect(approveButton).toBeDisabled();

      submitP0Section(
        container,
        1,
        "Members experience long calls because agents navigate too many systems.",
      );

      expect(approveButton).toBeDisabled();
      expect(
        screen.getAllByText(/1 of 7 complete/i)[0],
      ).toBeInTheDocument();
    });
  });
});
