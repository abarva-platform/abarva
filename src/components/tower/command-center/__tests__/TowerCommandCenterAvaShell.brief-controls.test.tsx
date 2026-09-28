/**
 * @jest-environment jsdom
 */

/**
 * Item C-416 — what the LIVE Tower surface renders of the five controls the
 * catalog entry `tower-atlas-program-pressure-brief` declares.
 *
 * That entry points at a component nothing imports (`routeReachable: false`);
 * the Tower route renders `TowerCommandCenterAvaShell`. Which surface should own
 * the brief is an open decision, so this suite does not assert what SHOULD be on
 * screen. It records, by execution, what IS: five cases, one per control, each
 * asserting the measured state. An absence is a measured gap and the case is
 * green about it — the day a control starts rendering, its case fails and the
 * catalog reason citing this suite has to be revisited.
 *
 * The search is over every state a signed-in reader can put the shell in
 * without a server: all 14 tab / sub-tab views with the aVa dock collapsed, the
 * dock opened, and an answered turn. The answer is deliberately rich — it
 * carries a trace key, server gaps and a table — so each absence is an absence
 * of rendering, not of data. Each case proves that with a precondition on the
 * packet the shell builds from the same response.
 *
 * Results and mutation evidence: docs/security/control-measurements/c416-tower-shell-brief-controls.md
 */

import "@testing-library/jest-dom";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { buildTowerChatAvaAnswerPacket } from "@/lib/cio-tower/tower-chat-artifacts";
import { designFixtureMart } from "@/lib/tower/command-center/__fixtures__/design-fixture";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";

import { TowerCommandCenterAvaShell } from "../TowerCommandCenterAvaShell";

let searchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
  usePathname: () => "/tower",
  useSearchParams: () => searchParams,
}));

const view = buildTowerCommandCenterView(designFixtureMart(), {
  tenantName: "Fixture Tenant",
})!;

/** Every tab and sub-tab TowerCommandCenter declares, in its own order. */
const VIEWS: ReadonlyArray<readonly [tab: string, subTab: string | null]> = [
  ["verdict", null],
  ["budget", "shape"],
  ["budget", "domain"],
  ["initiatives", "constraint"],
  ["initiatives", "table"],
  ["initiatives", "distribution"],
  ["initiatives", "proof"],
  ["tools", "rollouts"],
  ["tools", "vendor"],
  ["tools", "portfolio"],
  ["decisions", "review"],
  ["decisions", "queue"],
  ["decisions", "owner"],
  ["foundations", null],
];

const QUESTION = "What value is claimable?";
const ANSWER = "Claimable value is held behind finance validation.";
const TRACE_KEY = "trace-c416";
const SERVER_GAP = "Finance validation for the held cases is not loaded.";

const RESPONSE = {
  response: ANSWER,
  modelOutput: {
    version: "cio_tower_visible_answer_v1" as const,
    answer: ANSWER,
    tables: [
      {
        id: "held",
        title: "Held cases",
        columns: ["Case", "Value"],
        rows: [
          ["Case A", "$1.0M"],
          ["Case B", "$2.0M"],
        ],
      },
    ],
    tabs: [],
    followUpQuestion: null,
  },
  traceKey: TRACE_KEY,
  validationStatus: "passed" as const,
  gaps: [SERVER_GAP],
};

/** The packet the shell builds from RESPONSE — the preconditions read it. */
const packet = buildTowerChatAvaAnswerPacket({
  tenantKey: "fixture-tenant",
  tenantName: "Fixture Tenant",
  question: QUESTION,
  modelOutput: RESPONSE.modelOutput,
  response: RESPONSE.response,
  gaps: RESPONSE.gaps,
  validationStatus: RESPONSE.validationStatus,
  traceKey: RESPONSE.traceKey,
});

interface MeasuredState {
  name: string;
  text: string;
  aiLabels: number;
  evidenceBasis: number;
}

/** What a reader sees: text content with the renderer's inline <style> removed. */
function measure(name: string, root: Element): MeasuredState {
  const copy = root.cloneNode(true) as Element;
  copy.querySelectorAll("style, script").forEach((node) => node.remove());
  return {
    name,
    text: copy.textContent ?? "",
    aiLabels: root.querySelectorAll("[data-ai-label-status]").length,
    evidenceBasis: root.querySelectorAll('[data-testid="evidence-basis"]').length,
  };
}

function mountShell() {
  return render(
    <TowerCommandCenterAvaShell
      view={view}
      tenantName="Fixture Tenant"
      clientId="fixture-tenant"
      clientKey="fixture-tenant"
    />,
  );
}

let viewStates: MeasuredState[] = [];
let dockOpen: MeasuredState;
let answered: MeasuredState;
let allStates: MeasuredState[] = [];

beforeAll(async () => {
  viewStates = [];
  for (const [tab, subTab] of VIEWS) {
    searchParams = new URLSearchParams(subTab ? { tab, view: subTab } : { tab });
    const { container } = mountShell();
    expect(container.querySelector('[data-testid="tower-command-center"]')).not.toBeNull();
    viewStates.push(measure(subTab ? `${tab}/${subTab}` : tab, container));
    cleanup();
  }

  searchParams = new URLSearchParams();
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    value: jest.fn().mockResolvedValue({
      ok: true,
      body: null,
      headers: { get: () => "application/json" },
      json: async () => RESPONSE,
    }),
  });
  mountShell();
  fireEvent.click(screen.getByTestId("agent-dock-collapsed-chip"));
  await waitFor(() => expect(screen.getByTestId("agent-dock-form")).toBeInTheDocument());
  dockOpen = measure("dock open", document.body);

  fireEvent.change(screen.getByTestId("agent-dock-input"), {
    target: { value: QUESTION },
  });
  fireEvent.submit(screen.getByTestId("agent-dock-form"));
  await waitFor(() => expect(document.body.textContent).toContain(ANSWER));
  answered = measure("answered", document.body);

  allStates = [...viewStates, dockOpen, answered];
});

afterAll(() => {
  cleanup();
});

/** Names of the states whose visible text matches — [] means absent everywhere. */
function statesShowing(pattern: RegExp): string[] {
  return allStates.filter((state) => pattern.test(state.text)).map((state) => state.name);
}

describe("C-416 · the live Tower shell, measured against the pressure brief's five controls", () => {
  it("searched 16 distinct states, and the answered one has AI output on screen", () => {
    expect(allStates).toHaveLength(16);
    // 14 views that each render something different: the search is not one view counted 14 times.
    expect(new Set(viewStates.map((state) => state.text)).size).toBe(14);
    // Without an AI answer on screen, "no AI label" would be true of nothing.
    expect(answered.text).toContain(QUESTION);
    expect(answered.text).toContain(ANSWER);
    expect(answered.text).toContain("Held cases");
  });

  it("ai-label · MEASURED ABSENT: no AI-output label in any state, including on the answer", () => {
    expect(allStates.filter((state) => state.aiLabels > 0).map((state) => state.name)).toEqual([]);
    expect(statesShowing(/AI[- ]assisted|AI Draft|AI-Generated/i)).toEqual([]);
  });

  it("citation · MEASURED ABSENT: the answer's trace citation reaches no state", () => {
    // Precondition: the packet the shell builds from this response carries it.
    expect(packet.citations.map((citation) => citation.label)).toEqual([
      "Tower governed answer trace",
    ]);

    expect(allStates.filter((state) => state.evidenceBasis > 0).map((state) => state.name)).toEqual([]);
    expect(statesShowing(/Evidence basis|Tower governed answer trace/i)).toEqual([]);
  });

  it("confidence · MEASURED ABSENT: the citation's confidence is shown in no state", () => {
    // Precondition: the packet grades its citation.
    expect(packet.citations.map((citation) => citation.confidence)).toEqual(["high"]);

    expect(statesShowing(/confidence/i)).toEqual([]);
  });

  it("human-approval-gate · MEASURED ABSENT as a statement; only a partial clause reaches the open dock", () => {
    expect(statesShowing(/human approval|approval required|responsible for review and approval/i)).toEqual([]);

    // What does reach a reader: the opening turn says aVa approves nothing on its
    // own. It does not say a person must approve, so it is recorded as partial —
    // and it is only in the dock, never on any of the 14 views.
    expect(statesShowing(/without approving anything on its own/)).toEqual([
      "dock open",
      "answered",
    ]);
  });

  it("risk-caveat · MEASURED ABSENT: neither the server's gaps nor the decision-support caveat reach the answer", () => {
    // Precondition: the packet carries both.
    expect(packet.gaps.map((gap) => gap.detail)).toEqual([SERVER_GAP]);
    expect(packet.caveats.map((caveat) => caveat.label)).toEqual([
      "Decision-support boundary",
    ]);

    expect(statesShowing(new RegExp(SERVER_GAP))).toEqual([]);
    expect(statesShowing(/Decision-support boundary|accountable owners remain responsible/i)).toEqual([]);
  });
});
