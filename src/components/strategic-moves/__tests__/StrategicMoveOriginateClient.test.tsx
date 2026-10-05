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
import {
  agreeNoun,
  buildOriginateRailRows,
  formatAnswersCaptured,
  formatAnswersCapturedNoun,
  formatOriginateDiscardProgress,
  formatOriginateNavFootProgress,
  formatOriginateRailTally,
  formatOriginateStepPosition,
  originateStepCount,
} from "../originate-figure-labels";

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
    /sponsor contact and update preference/i,
    /in scope/i,
    /out of scope/i,
    /value hypothesis/i,
    /intended outcomes and success criteria/i,
    /discovery questions and hypotheses to test/i,
    /evidence families to collect/i,
    /foundation readiness, constraints, and dependencies/i,
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
    screen.getAllByRole("button", {
      name: /submit section|update section|submit readiness|update readiness/i,
    })[0],
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

  it("requires all ten Move brief sections before promotion", async () => {
    const fourSectionProgress =
      "Captured four fields. [[artifact:brief-progress]]" +
      JSON.stringify({
        fieldsTotal: 10,
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
            id: "scope-in",
            label: "In scope",
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

    fireEvent.click(screen.getByRole("button", { name: /review p0 intake/i }));
    const approveButton = screen.getByRole("button", {
      name: /^submit p0 for review$/i,
    });
    expect(approveButton).toBeDisabled();
    expect(screen.getAllByText("0 of 10 answers")[0]).toBeInTheDocument();
    expect(
      screen.getByText(/Describe the business problem or opportunity/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/optional/i)).not.toBeInTheDocument();

    await act(async () => {
      sendDockMessage("Start with the AMS vendor consolidation signal.");
    });

    await waitFor(() => {
      expect(
        screen.getAllByText(/4 of 10 answers captured/i)[0],
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
        fieldsTotal: 10,
        fieldsFilled: 10,
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
            id: "scope-in",
            label: "In scope",
            status: "filled",
            value: "Bank connectivity.",
          },
          {
            id: "scope-out",
            label: "Out of scope",
            status: "filled",
            value: "Changing the ERP core.",
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
            id: "outcomes-success",
            label: "Intended outcomes and success criteria",
            status: "filled",
            value: "Faster cash visibility, validated against baseline.",
          },
          {
            id: "discovery-questions",
            label: "Discovery questions and hypotheses to test",
            status: "filled",
            value: "Hypothesis: reconciliation delay traces to bank feed lag.",
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
      "scope-in":
        "Treasury operations, bank connectivity, SAP finance feeds, payment controls, and control evidence.",
      "scope-out": "Changing the ERP core in this move.",
      "evidence-family":
        "Finance systems, treasury operations, risk and controls, vendor/contracts, data readiness.",
      "value-hypothesis":
        "Faster cash visibility and cleaner payment-control evidence.",
      "outcomes-success":
        "Faster cash visibility, validated against a P2 baseline.",
      "discovery-questions":
        "Hypothesis: reconciliation delay traces to bank feed lag.",
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
      expect(screen.getByText(/Answers complete/i)).toBeInTheDocument();
    });
    selectP0Tab(3);
    expect(
      screen.getByDisplayValue("CFO and Treasurer, with CIO support."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Dr. Anita Krishnamurthy"),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /review p0 intake/i }));
    expect(
      screen.getByRole("button", { name: /^submit p0 for review$/i }),
    ).toBeEnabled();
  });

  it("fills the scaffold directly from a complete labeled user prompt when artifacts and extraction are empty", async () => {
    mockFetchWithChatArtifactAndExtraction("", {});

    render(<StrategicMoveOriginateClient tenantName="Lakeshore Holdings" />);
    openAvaDock();

    const prompt = `Create a strategic Move named "Kyriba Treasury Controls Proof" for Lakeshore Holdings' Kyriba treasury rollout. The business problem is treasury visibility and payment-control risk across banks, SAP feeds, signers, payment formats, and SOX evidence. Sponsor candidate: CFO and Treasurer, with CIO support. Scope: treasury operations, bank connectivity, SAP finance feeds, payment controls, and control evidence; out of scope: changing the ERP core in this move. Evidence family: finance systems, treasury operations, risk and controls, vendor/contracts, data readiness. Value hypothesis: faster cash visibility, lower manual reconciliation effort, cleaner payment-control evidence, and better board confidence. Outcomes: faster cash visibility, validated against a P2 baseline. Discovery questions: hypothesis that reconciliation delay traces to bank feed lag. Foundation readiness: Kyriba rollout is underway, but data lineage, bank connectivity inventory, signer controls, and SOX evidence need validation.`;

    await act(async () => {
      sendDockMessage(prompt);
    });

    await waitFor(() => {
      expect(screen.getByText(/Answers complete/i)).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole("button", { name: /review p0 intake/i }));
    expect(
      screen.getByRole("button", { name: /^submit p0 for review$/i }),
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
      "Clinical decisions and appeals adjudication.",
      "Reduce avoidable handle time, repeat contact, transfers, and manual rework while improving answer consistency.",
      "Lower handle time and fewer transfers, validated against a P2 baseline.",
      "Hypothesis: most repeat contacts trace to a handful of intents. Question: which systems do agents use per intent?",
      "Call metrics, CRM history, claims samples, prior authorization samples, benefits and eligibility samples, systems inventory, controls, and value assumptions.",
      "CRM, claims, eligibility, prior authorization, knowledge, identity, audit, data quality, and PHI controls need validation.",
    ];

    values.forEach((value, index) => {
      submitP0Section(container, index + 1, value);
    });

    expect(screen.getByText(/Answers complete/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /review p0 intake/i }));
    expect(
      screen.getByRole("button", { name: /^submit p0 for review$/i }),
    ).toBeEnabled();
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/chat/agent",
      expect.anything(),
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /^submit p0 for review$/i }),
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
      "Clinical decisions.",
      "Reduce handle time and repeat contact.",
      "Lower handle time, validated against baseline.",
      "Hypothesis: repeat contacts trace to a few intents.",
      "Call metrics and CRM history.",
      "CRM, claims, eligibility, and PHI controls need validation.",
    ].forEach((value, index) => {
      submitP0Section(container, index + 1, value);
    });

    selectP0Tab(1);
    fireEvent.change(screen.getByLabelText(/move title/i), {
      target: {
        value:
          "Members experience long calls and inconsistent answers because agents navigate too many systems",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: /review p0 intake/i }));
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /^submit p0 for review$/i }),
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
      expect(screen.getByRole("tab", { name: /steps/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /files/i })).toBeInTheDocument();
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
          name: /review p0 intake/i,
        }),
      ).toBeInTheDocument();
    });

    it("distinguishes intake submission from evidence-backed authorized-user approval", () => {
      render(<StrategicMoveOriginateClient tenantName="Tenant A" />);

      fireEvent.click(
        screen.getByRole("button", { name: /review p0 intake/i }),
      );

      expect(
        screen.getByRole("heading", { name: "Submit P0 for review" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/this does not approve or advance the Move/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText("One uploaded, human-reviewed P0 source file"),
      ).toBeInTheDocument();
    });

    it("keeps P0 promotion blocked until all 10 sections are captured", async () => {
      const { container } = render(
        <StrategicMoveOriginateClient tenantName="Meridian Health" />,
      );

      fireEvent.click(
        screen.getByRole("button", { name: /review p0 intake/i }),
      );
      const approveButton = screen.getByRole("button", {
        name: /^submit p0 for review$/i,
      });
      expect(approveButton).toBeDisabled();

      submitP0Section(
        container,
        1,
        "Members experience long calls because agents navigate too many systems.",
      );

      expect(approveButton).toBeDisabled();
      expect(
        screen.getAllByText(/1 of 10 answers captured/i)[0],
      ).toBeInTheDocument();
    });
  });

  describe("extended intake fields (moves_extended_intake_fields_v1)", () => {
    it("renders exactly the original 10 steps when the flag is off (default) — byte-identical to today", () => {
      render(<StrategicMoveOriginateClient tenantName="Apex Retail" />);
      expect(screen.getByText(/0 \/ 10/)).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /business segment/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/front \/ middle \/ back office/i),
      ).not.toBeInTheDocument();
    });

    it("adds a Segment group of 7 steps (17 total) when the flag is on, with Business Segment options from the tenant prop", () => {
      render(
        <StrategicMoveOriginateClient
          tenantName="Meridian Health"
          extendedIntakeFieldsEnabled
          businessSegmentOptions={[
            "Health Plan Operations",
            "Hospital & Acute Delivery",
            "Ambulatory & Physician Network",
            "Shared Enterprise Services",
          ]}
        />,
      );
      expect(screen.getByText(/0 \/ 17/)).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", { name: /business segment/i }),
      );
      const select = document.querySelector(
        "#orig-canvas-brief-section-11-input",
      ) as HTMLSelectElement | null;
      expect(select).not.toBeNull();
      expect(select!.tagName).toBe("SELECT");
      const optionLabels = Array.from(select!.options).map((o) => o.value);
      expect(optionLabels).toEqual([
        "",
        "Health Plan Operations",
        "Hospital & Acute Delivery",
        "Ambulatory & Physician Network",
        "Shared Enterprise Services",
      ]);

      fireEvent.click(
        screen.getByRole("button", { name: /front \/ middle \/ back office/i }),
      );
      const officeSelect = document.querySelector(
        "#orig-canvas-brief-section-12-input",
      ) as HTMLSelectElement | null;
      expect(Array.from(officeSelect!.options).map((o) => o.value)).toEqual([
        "",
        "Front Office",
        "Middle Office",
        "Back Office",
        "Enterprise",
      ]);

      fireEvent.click(screen.getByRole("button", { name: /^care type$/i }));
      const careSelect = document.querySelector(
        "#orig-canvas-brief-section-13-input",
      ) as HTMLSelectElement | null;
      expect(Array.from(careSelect!.options).map((o) => o.value)).toEqual([
        "",
        "Clinical",
        "Non-Clinical",
      ]);
    });

    it("submits extendedIntake in the promote payload only when the flag is on, and null when it's off", async () => {
      const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url === "/api/programs/origination-submit") {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              ok: true,
              engagementId: "move-extended-p0",
              redirectTo: "/programs/move-extended-p0",
            }),
          };
        }
        return { ok: true, status: 200, json: async () => ({ ok: true }) };
      });
      (global as { fetch: unknown }).fetch = fetchMock;

      const { container } = render(
        <StrategicMoveOriginateClient
          tenantName="Meridian Health"
          extendedIntakeFieldsEnabled
          businessSegmentOptions={["Health Plan Operations"]}
        />,
      );

      // Base steps use EXACT label anchors here (not the shared
      // selectP0Tab/submitP0Section helpers) because with extended fields
      // rendered, "Value hypothesis" is a substring of two of the new step
      // labels ("Value hypothesis — quantified/qualitative") and would match
      // ambiguously.
      const baseSteps: Array<[RegExp, string]> = [
        [
          /^business problem or opportunity$/i,
          "Coding gaps are found after submission, not before.",
        ],
        [
          /^transformation pattern \(archetype\)$/i,
          "AI-powered ops decision support.",
        ],
        [/^sponsor contact and update preference$/i, "VP, Risk Adjustment."],
        [/^in scope$/i, "Claims and Epic chart data."],
        [/^out of scope$/i, "Clinical adjudication decisions."],
        [
          /^value hypothesis$/i,
          "Revenue capture improves and chart chases go down.",
        ],
        [
          /^intended outcomes and success criteria$/i,
          "Coding accuracy rate improves; validated in P2.",
        ],
        [
          /^discovery questions and hypotheses to test$/i,
          "Which claim types drive the most gaps?",
        ],
        [/^evidence families to collect$/i, "Claims mart, Epic Clarity."],
        [
          /^foundation readiness, constraints, and dependencies$/i,
          "Bronze-layer claims data availability.",
        ],
      ];
      baseSteps.forEach(([label, value], index) => {
        fireEvent.click(screen.getByRole("button", { name: label }));
        const input = container.querySelector(
          `#orig-canvas-brief-section-${index + 1}-input`,
        ) as HTMLTextAreaElement;
        fireEvent.change(input, { target: { value } });
        fireEvent.click(
          screen.getAllByRole("button", {
            name: /submit section|update section|submit readiness|update readiness/i,
          })[0],
        );
      });

      // Extended steps: 11-13 are selects, 14-16 are free text.
      fireEvent.click(
        screen.getByRole("button", { name: /business segment/i }),
      );
      fireEvent.change(
        document.querySelector("#orig-canvas-brief-section-11-input")!,
        { target: { value: "Health Plan Operations" } },
      );
      fireEvent.click(
        screen.getAllByRole("button", { name: /submit section/i })[0],
      );

      fireEvent.click(
        screen.getByRole("button", { name: /front \/ middle \/ back office/i }),
      );
      fireEvent.change(
        document.querySelector("#orig-canvas-brief-section-12-input")!,
        { target: { value: "Back Office" } },
      );
      fireEvent.click(
        screen.getAllByRole("button", { name: /submit section/i })[0],
      );

      fireEvent.click(screen.getByRole("button", { name: /^care type$/i }));
      fireEvent.change(
        document.querySelector("#orig-canvas-brief-section-13-input")!,
        { target: { value: "Non-Clinical" } },
      );
      fireEvent.click(
        screen.getAllByRole("button", { name: /submit section/i })[0],
      );

      const extendedTextSteps: Array<[RegExp, number, string]> = [
        [
          /^value hypothesis — quantified$/i,
          14,
          "Est. $2-4M/yr in recoverable revenue.",
        ],
        [
          /^value hypothesis — qualitative$/i,
          15,
          "Coding team trusts the data more.",
        ],
        [/^stakeholders$/i, 16, "Coding team lead; Actuarial; Compliance."],
      ];
      extendedTextSteps.forEach(([label, step, value]) => {
        fireEvent.click(screen.getByRole("button", { name: label }));
        const input = container.querySelector(
          `#orig-canvas-brief-section-${step}-input`,
        ) as HTMLTextAreaElement;
        fireEvent.change(input, { target: { value } });
        fireEvent.click(
          screen.getAllByRole("button", { name: /submit section/i })[0],
        );
      });

      fireEvent.click(
        screen.getByRole("button", { name: /^complexity tier$/i }),
      );
      fireEvent.change(
        document.querySelector("#orig-canvas-brief-section-17-input")!,
        { target: { value: "Straightforward" } },
      );
      fireEvent.click(
        screen.getAllByRole("button", { name: /submit section/i })[0],
      );

      fireEvent.click(
        screen.getByRole("button", { name: /review p0 intake/i }),
      );
      await act(async () => {
        fireEvent.click(
          screen.getByRole("button", { name: /^submit p0 for review$/i }),
        );
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          "/strategic-moves/move-extended-p0/phase/0?focus=gate",
        );
      });

      const submitCall = fetchMock.mock.calls.find(
        ([url]) => url === "/api/programs/origination-submit",
      );
      expect(submitCall).toBeDefined();
      const body = JSON.parse((submitCall![1] as { body: string }).body);
      expect(body.extendedIntake).toEqual({
        businessSegment: "Health Plan Operations",
        officeLens: "Back Office",
        careType: "Non-Clinical",
        valueHypothesisQuant: "Est. $2-4M/yr in recoverable revenue.",
        valueHypothesisQual: "Coding team trusts the data more.",
        stakeholders: "Coding team lead; Actuarial; Compliance.",
        tier: "Straightforward",
      });
    });

    it("sends extendedIntake: null when the flag is off, even though the base flow is unaffected", async () => {
      const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url === "/api/programs/origination-submit") {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              ok: true,
              engagementId: "move-no-extended-p0",
              redirectTo: "/programs/move-no-extended-p0",
            }),
          };
        }
        return { ok: true, status: 200, json: async () => ({ ok: true }) };
      });
      (global as { fetch: unknown }).fetch = fetchMock;

      const { container } = render(
        <StrategicMoveOriginateClient tenantName="Apex Retail" />,
      );
      const values = [
        "Members experience long calls and inconsistent answers.",
        "Contact Center Agent Assist.",
        "COO as executive sponsor.",
        "Claims status and CRM history.",
        "Clinical decisions.",
        "Reduce avoidable handle time.",
        "Lower handle time, validated.",
        "Which intents drive repeat contact?",
        "Call metrics, CRM history.",
        "CRM and claims access needed.",
      ];
      values.forEach((value, index) => {
        submitP0Section(container, index + 1, value);
      });
      fireEvent.click(
        screen.getByRole("button", { name: /review p0 intake/i }),
      );
      await act(async () => {
        fireEvent.click(
          screen.getByRole("button", { name: /^submit p0 for review$/i }),
        );
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          "/strategic-moves/move-no-extended-p0/phase/0?focus=gate",
        );
      });
      const submitCall = fetchMock.mock.calls.find(
        ([url]) => url === "/api/programs/origination-submit",
      );
      const body = JSON.parse((submitCall![1] as { body: string }).body);
      expect(body.extendedIntake).toBeNull();
    });
  });

  describe("the screen's figures say what they count (originate-figure-labels)", () => {
    it('agrees a noun to its denominator, so a single-answer scaffold never reads "1 answers"', () => {
      expect(agreeNoun(1, "answer", "answers")).toBe("answer");
      expect(agreeNoun(0, "answer", "answers")).toBe("answers");
      expect(agreeNoun(2, "answer", "answers")).toBe("answers");
    });

    it("measures only P0 — every later rail row carries no figure at all, not a zero", () => {
      const rows = buildOriginateRailRows({
        requiredFilled: 3,
        requiredFieldCount: 10,
        laterPhases: [
          { phase: 1, label: "P1 Charter" },
          { phase: 2, label: "P2 Discover" },
          { phase: 3, label: "P3 Design" },
          { phase: 4, label: "P4 Plan" },
          { phase: 5, label: "P5 Mobilize" },
        ],
      });

      expect(rows).toHaveLength(6);
      expect(rows[0].measured).toEqual({ met: 3, total: 10 });
      const later = rows.slice(1);
      expect(later.map((r) => r.measured)).toEqual([
        null,
        null,
        null,
        null,
        null,
      ]);
      // No number may reach a later row by any route: the whole row, serialized,
      // must contain no digit but its own phase number.
      for (const row of later) {
        expect(JSON.stringify(row.measured)).toBe("null");
      }
    });

    it("states the noun on a measured row and claims nothing on an unmeasured one", () => {
      const rows = buildOriginateRailRows({
        requiredFilled: 3,
        requiredFieldCount: 10,
        laterPhases: [{ phase: 1, label: "P1 Charter" }],
      });
      expect(formatOriginateRailTally(rows[0])).toBe("3 of 10 answers");
      expect(formatOriginateRailTally(rows[1])).toBe("Not started");
      expect(formatOriginateRailTally(rows[1])).not.toMatch(/\d/);
    });

    it("agrees the rail's own noun to a one-answer scaffold", () => {
      const [p0] = buildOriginateRailRows({
        requiredFilled: 0,
        requiredFieldCount: 1,
        laterPhases: [],
      });
      expect(formatOriginateRailTally(p0)).toBe("0 of 1 answer");
    });

    it("agrees the promote bar's noun to its denominator", () => {
      expect(formatAnswersCaptured({ filled: 0, total: 10 })).toMatch(
        /^0 of 10 answers captured/,
      );
      expect(formatAnswersCaptured({ filled: 0, total: 1 })).toMatch(
        /^0 of 1 answer captured/,
      );
    });

    it("counts the discard sentence's two sides over the SAME set, so it carries one figure that cannot exceed its own total", () => {
      const line = formatOriginateDiscardProgress({
        requiredFilled: 3,
        requiredFieldCount: 10,
      });
      expect(line).toBe("You\u2019ve captured 3 of 10 required answers.");
      // Exactly one N-of-M pair: the old copy carried two numerators over one
      // denominator, counting every brief field against the required-only total.
      expect(line.match(/\d+ of \d+/g)).toHaveLength(1);
      expect(
        formatOriginateDiscardProgress({
          requiredFilled: 0,
          requiredFieldCount: 1,
        }),
      ).toBe("You\u2019ve captured 0 of 1 required answer.");
    });

    it("counts the step position and its total over the SAME step list — the submit step is one past the last field, not a repeat of it", () => {
      // The nav's step list is the scaffold fields plus the submit step.
      expect(originateStepCount(10)).toBe(11);

      const lastField = formatOriginateStepPosition({
        fieldStep: 10,
        fieldCount: 10,
      });
      const submit = formatOriginateStepPosition({
        fieldStep: null,
        fieldCount: 10,
      });
      expect(lastField).toBe("Step 10 of 11");
      expect(submit).toBe("Step 11 of 11");
      // The defect: both used to render "Step 10 of 10", so two distinct nav
      // steps reported one position and the last position was unreachable.
      expect(submit).not.toBe(lastField);
    });

    it("tracks the extended scaffold, so the submit step is never pinned to a constant", () => {
      expect(
        formatOriginateStepPosition({ fieldStep: null, fieldCount: 17 }),
      ).toBe("Step 18 of 18");
      expect(
        formatOriginateStepPosition({ fieldStep: 1, fieldCount: 17 }),
      ).toBe("Step 1 of 18");
    });

    it("states what the nav foot's figure counts, instead of a bare N of M beside a clause that counts a larger set", () => {
      expect(
        formatOriginateNavFootProgress({
          requiredFilled: 4,
          requiredFieldCount: 10,
        }),
      ).toBe("4 of 10 answers captured · finish the required steps");
      // The old copy was `4 of 10 complete`: no noun, and the clause beside it
      // named "required steps", a set that includes the submit step the figure
      // does not measure.
      expect(
        formatOriginateNavFootProgress({
          requiredFilled: 4,
          requiredFieldCount: 10,
        }),
      ).toMatch(/4 of 10 answers/);
    });

    it("agrees the nav foot's noun to its own denominator", () => {
      expect(
        formatOriginateNavFootProgress({
          requiredFilled: 0,
          requiredFieldCount: 1,
        }),
      ).toBe("0 of 1 answer captured · finish the required steps");
    });

    it("agrees the progress pill's noun to the total its figure is bounded by", () => {
      expect(formatAnswersCapturedNoun(1)).toBe("answer captured");
      expect(formatAnswersCapturedNoun(0)).toBe("answers captured");
      expect(formatAnswersCapturedNoun(10)).toBe("answers captured");
    });
  });

  describe("the Originate rail's figures at the host call site", () => {
    it("renders no invented total for P1-P5 — five rows say they have not started", () => {
      render(<StrategicMoveOriginateClient tenantName="Apex Retail" />);

      // The five hard-coded literals this screen used to render.
      expect(screen.queryByText("0 of 5")).not.toBeInTheDocument();
      expect(screen.queryByText("0 of 4")).not.toBeInTheDocument();
      expect(screen.getAllByText("Not started")).toHaveLength(5);
    });

    it("states what the measured P0 row counts, and tracks the active scaffold size", () => {
      const { unmount } = render(
        <StrategicMoveOriginateClient tenantName="Apex Retail" />,
      );
      expect(screen.getByText("0 of 10 answers")).toBeInTheDocument();
      unmount();

      render(
        <StrategicMoveOriginateClient
          tenantName="Apex Retail"
          extendedIntakeFieldsEnabled
        />,
      );
      // Vacuity guard: the two scaffolds differ in size, so a figure pinned to
      // one of them cannot be a constant.
      expect(screen.queryByText("0 of 10 answers")).not.toBeInTheDocument();
      expect(screen.getByText("0 of 17 answers")).toBeInTheDocument();
    });
  });

  describe("the step position and nav foot at the host call site", () => {
    it("renders a position bounded by the nav's step list, not by the field count", () => {
      const { unmount } = render(
        <StrategicMoveOriginateClient tenantName="Apex Retail" />,
      );
      fireEvent.click(
        screen.getByRole("button", { name: /review p0 intake/i }),
      );
      // "Review P0 intake" lands on the submit step, which is the 11th of the
      // nav's 11 steps (10 scaffold fields + submit). It used to render
      // "Step 10 of 10" — the last field's own position.
      expect(screen.getByText("Step 11 of 11")).toBeInTheDocument();
      expect(screen.queryByText("Step 10 of 10")).not.toBeInTheDocument();
      unmount();

      render(
        <StrategicMoveOriginateClient
          tenantName="Apex Retail"
          extendedIntakeFieldsEnabled
        />,
      );
      fireEvent.click(
        screen.getByRole("button", { name: /review p0 intake/i }),
      );
      // Vacuity guard: the two scaffolds differ in size, so the total cannot
      // be a constant.
      expect(screen.getByText("Step 18 of 18")).toBeInTheDocument();
      expect(screen.queryByText("Step 17 of 17")).not.toBeInTheDocument();
      expect(screen.queryByText("Step 11 of 11")).not.toBeInTheDocument();
    });

    it("renders the nav foot's nouned figure, and no nounless one", () => {
      render(<StrategicMoveOriginateClient tenantName="Apex Retail" />);
      fireEvent.click(
        screen.getByRole("button", { name: /review p0 intake/i }),
      );
      expect(
        screen.getAllByText(
          /0 of 10 answers captured · finish the required steps/,
        )[0],
      ).toBeInTheDocument();
      expect(screen.queryByText(/0 of 10 complete/)).not.toBeInTheDocument();
    });
  });
});
