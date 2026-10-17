/**
 * @jest-environment jsdom
 */
import { fireEvent, render, within } from "@testing-library/react";

import type { RomResult } from "@/lib/pricing/moves-workflow/rom-service";
import {
  emptyRomEstimate,
  type RomAiAssistPlan,
  type RomEstimate,
  type RomRegisterRow,
} from "@/lib/programs/rom-estimate";

import { RomAiScenarioPanel } from "../RomAiScenarioPanel";

const reg = (registerId: string, status: RomRegisterRow["status"], extra: Partial<RomRegisterRow> = {}): RomRegisterRow => ({
  registerId,
  status,
  statement: `Statement ${registerId}`,
  whyItMatters: null,
  workingFigure: null,
  workingValue: null,
  source: "Synthetic notes",
  confidence: 3,
  ownerRole: "Engineering lead",
  answer: null,
  answerFigure: null,
  answerValue: null,
  answerSource: null,
  ...extra,
});
const REGISTER = [
  reg("AI1", "confirmed", { workingValue: 0.35 }),
  reg("AI2", "open", { workingFigure: "30%", workingValue: 0.3 }),
  reg("TC1", "confirmed", { workingValue: 190, ownerRole: "Finance partner" }),
];

function record(plan: RomAiAssistPlan | null): RomEstimate {
  return {
    ...emptyRomEstimate(),
    useCases: [{ code: "UC-1", name: "Use case", counts: { design_row_count: 40, validation_row_count: 20 }, source: { kind: "team" } }],
    aiAssist: plan,
  };
}
const PLAN: RomAiAssistPlan = {
  label: "AI coding agents",
  factors: { design_row_count: { kind: "register", registerId: "AI1" } },
  tools: [{ code: "T0", label: "Agent seats", seats: 3, cost: { kind: "register", registerId: "TC1" } }],
};
const ROM = {
  total: { hours: 1200, weeks: 15, planCents: 55_000_000 },
  aiAssisted: {
    label: "AI coding agents",
    total: { hours: 1000, weeks: 12, planCents: 47_000_000 },
    toolCostCents: 1_368_000,
    versusEstimate: { hours: -200, weeks: -3, planCents: -8_000_000 },
  },
} as unknown as RomResult;

function setup(plan: RomAiAssistPlan | null, opts: { rom?: RomResult | null; hidden?: string; register?: RomRegisterRow[] | null } = {}) {
  const onEdit = jest.fn((edit: { ok: boolean }) => edit.ok);
  const view = render(
    <RomAiScenarioPanel
      record={record(plan)}
      register={opts.register === undefined ? REGISTER : opts.register}
      rom={opts.rom === undefined ? ROM : opts.rom}
      hiddenMoney={opts.hidden ?? null}
      onEdit={onEdit}
    />,
  );
  const lastPlan = () => (onEdit.mock.calls.at(-1)?.[0] as { ok: true; value: RomEstimate }).value.aiAssist;
  return { ...view, onEdit, lastPlan };
}

describe("RomAiScenarioPanel", () => {
  it("offers to add a scenario and says the estimate is untouched", () => {
    const { getByTestId, getByRole, lastPlan } = setup(null);
    expect(getByTestId("rom-ai-scenario").textContent).toContain("P4, stay as they are");
    fireEvent.click(getByRole("button", { name: "Add an AI-assisted scenario" }));
    expect(lastPlan()).toEqual({ label: "AI-assisted delivery", factors: {}, tools: [] });
  });

  it("shows each linked reduction with its register source, and removes one", () => {
    const { getByTestId, getByLabelText, lastPlan } = setup(PLAN);
    expect(getByTestId("rom-ai-factor-design_row_count").textContent).toBe("35% fewer hours · [A:AI1] confirmed · Engineering lead");
    expect(getByTestId("rom-ai-factor-validation_row_count").textContent).toBe("No reduction assumed");
    expect((getByLabelText("Hours reduction for Design rows") as HTMLSelectElement).value).toBe("AI1");
    fireEvent.change(getByLabelText("Hours reduction for Design rows"), { target: { value: "" } });
    expect(lastPlan()?.factors).toEqual({});
  });

  it("compares the scenario with the estimate, signed, and labels it a scenario", () => {
    const { getByTestId } = setup(PLAN);
    const table = getByTestId("rom-ai-compare");
    const row = (name: string) => within(table).getByRole("rowheader", { name }).parentElement!.textContent;
    expect(row("Hours")).toBe("Hours1,200 h1,000 h−200 h");
    expect(row("Weeks")).toBe("Weeks15 wks12 wks−3 wks");
    expect(row("Cost at plan")).toBe("Cost at plan$0.55M$0.47M−$80.0K");
    expect(row("Tool cost")).toMatch(/\+\$/);
    expect(getByTestId("rom-ai-scenario").textContent).toContain("Scenario only.");
    // Narrow layouts get the same comparison as cards (the table is hidden below 680px).
    const cards = getByTestId("rom-ai-compare-cards").textContent;
    expect(cards).toContain("Difference");
    expect(cards).toContain("−200 h");
    expect(cards).toContain("−$80.0K");
  });

  it("hides every amount when the viewer may not see figures", () => {
    const { getByTestId } = setup(PLAN, { hidden: "Withheld" });
    for (const id of ["rom-ai-compare", "rom-ai-compare-cards"]) {
      const text = getByTestId(id).textContent ?? "";
      expect(text).not.toMatch(/\$/);
      expect(text).toContain("Withheld");
    }
  });

  it("says when the scenario is provisional, and lists what is left out", () => {
    const provisional = setup({ ...PLAN, factors: { design_row_count: { kind: "register", registerId: "AI2" } } });
    expect(provisional.getByTestId("rom-ai-provisional").textContent).toBe("Provisional until [A:AI2] is confirmed.");
    provisional.unmount();
    const unread = setup(PLAN, { register: null, rom: null });
    expect(unread.getByTestId("rom-ai-problems").textContent).toContain("could not be read");
    expect(unread.queryByTestId("rom-ai-compare")).toBeNull();
  });

  it("adds a tool only with a name, a seat count and a register row for its cost", () => {
    const { getByRole, getByLabelText, lastPlan } = setup({ ...PLAN, tools: [] });
    fireEvent.click(getByRole("button", { name: "Add a tool cost" }));
    const add = getByRole("button", { name: "Add tool" }) as HTMLButtonElement;
    expect(add.disabled).toBe(true);
    fireEvent.change(getByLabelText("Tool name"), { target: { value: "Agent seats" } });
    fireEvent.change(getByLabelText("Seats"), { target: { value: "3" } });
    expect(add.disabled).toBe(true);
    fireEvent.change(getByLabelText("Monthly cost per seat"), { target: { value: "TC1" } });
    fireEvent.click(add);
    expect(lastPlan()?.tools).toEqual([expect.objectContaining({ label: "Agent seats", seats: 3, cost: { kind: "register", registerId: "TC1" } })]);
  });

  it("says whether P4 will show the scenario", () => {
    const fresh = setup(PLAN);
    expect(fresh.getByTestId("rom-ai-carry").textContent).toBe("Approving the estimate carries this scenario to P4 as a comparison.");
    fresh.unmount();
    const provisional = setup({ ...PLAN, factors: { design_row_count: { kind: "register", registerId: "AI2" } } });
    expect(provisional.getByTestId("rom-ai-carry").textContent).toContain("shown here only");
  });

  it("removes the scenario", () => {
    const { getByRole, onEdit } = setup(PLAN);
    fireEvent.click(getByRole("button", { name: "Remove the scenario" }));
    expect(onEdit.mock.calls.at(-1)?.[0]).toMatchObject({ ok: true, value: { aiAssist: null } });
  });
});
