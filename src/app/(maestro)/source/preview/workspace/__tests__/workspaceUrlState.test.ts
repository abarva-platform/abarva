import {
  buildInitialWorkspaceState,
  workspaceTabParamFor,
} from "../viewModel";

/**
 * The defect these guard: selecting a contract and switching a contract tab
 * were React state only, while the URL kept whatever workspace tab the page was
 * opened on. A refresh rebuilt the workspace from the stale parameters, the
 * contract vanished, and the portfolio list reappeared — which reads as the
 * layout changing by itself.
 *
 * Reading a URL into state already worked. These cover the other direction, and
 * the round trip.
 */

describe("workspaceTabParamFor", () => {
  it("names the parameter that reproduces each workspace selection", () => {
    const cases: [string, { kind: string; id: string | null }, string][] = [
      ["command", { kind: "portfolio", id: null }, "Portfolio"],
      ["contracts", { kind: "contractList", id: null }, ""],
      ["levers", { kind: "optimize", id: null }, "Queue"],
      ["evidence", { kind: "evidence", id: null }, "Coverage"],
      ["coverage", { kind: "vendorList", id: null }, ""],
    ];

    for (const [expected, sel, tab] of cases) {
      const tabs = tab ? { [sel.kind]: tab } : {};
      expect(workspaceTabParamFor(sel, tabs)).toBe(expected);
    }
  });

  it("returns null for a contract, which the URL addresses by id instead", () => {
    expect(
      workspaceTabParamFor(
        { kind: "contract", id: "MER-TECH-DBX-001" },
        { contract: "Evidence" },
      ),
    ).toBeNull();
  });

  it("returns null for a selection no workspace tab represents", () => {
    expect(workspaceTabParamFor({ kind: "nowhere", id: null }, {})).toBeNull();
  });
});

describe("workspace URL round trip", () => {
  it("restores the same selection a workspace tab produced", () => {
    for (const param of [
      "command",
      "contracts",
      "levers",
      "evidence",
      "coverage",
    ]) {
      const state = buildInitialWorkspaceState({ workspaceTab: param });
      expect(workspaceTabParamFor(state.sel, state.tabs)).toBe(param);
    }
  });

  it("restores a contract and its tab from the parameters a click would write", () => {
    const state = buildInitialWorkspaceState({
      contractId: "MER-TECH-DBX-001",
      contractTab: "Evidence",
    });

    expect(state.sel.kind).toBe("contract");
    expect(state.sel.id).toBe("MER-TECH-DBX-001");
    expect(state.tabs.contract).toBe("Evidence");
  });

  it("falls back to a safe contract tab rather than dropping the contract", () => {
    // A stale or misspelled tab parameter must not cost the reader the
    // contract they opened.
    const state = buildInitialWorkspaceState({
      contractId: "MER-TECH-DBX-001",
      contractTab: "NotATab",
    });

    expect(state.sel.id).toBe("MER-TECH-DBX-001");
    expect(typeof state.tabs.contract).toBe("string");
    expect(state.tabs.contract.length).toBeGreaterThan(0);
  });
});
