/** @jest-environment node */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  reconcilePack,
  type PackSnapshot,
} from "../../../../scripts/moves/denials-pack/reconcile";
import {
  buildScenario,
  PACK_FILES,
} from "../../../../scripts/moves/denials-pack/scenario";
import { resolvePhaseWorkflow } from "@/lib/programs/phase-workflow-registry";
import { getPhaseCaptureSections } from "@/lib/programs/phase-capture-contract";
import { captureTextStepNotes } from "@/lib/programs/capture-text-step-record";
import { proposeCaptureValuesFromNotes } from "@/lib/programs/capture-notes-proposal";
import { proposeRootCausesFromNotes } from "@/lib/programs/root-cause-notes";
import { proposeDesignFromNotes } from "@/lib/programs/design-traceability-notes";
import { proposeChoiceFromNotes } from "@/lib/programs/architecture-choice-notes";
import { fillFromNotes } from "@/lib/programs/operating-adoption-notes";
import { emptyOperatingAdoption } from "@/lib/programs/operating-adoption";
import { addFoundation, emptyRomEstimate } from "@/lib/programs/rom-estimate";
import {
  proposeRomCountsFromNotes,
  applyRomNotesProposals,
} from "@/lib/programs/rom-estimate-notes";
import {
  evaluateValueCase,
  type ValueCase,
  type ValueInputResolver,
} from "@/lib/programs/value-engine";

const directory = path.resolve(
  "datasets/tenant-inputs/meridian-health/moves/denials-pack-v1",
);
interface Step {
  stepId: string;
  phase: number;
  parser: string;
  pasteBlock: string;
  fields: { key: string; label: string }[];
  humanClicks: string[];
  approvalRecorded: boolean;
  uploads: string[];
}
const walk = JSON.parse(
  fs.readFileSync(path.join(directory, "walk-notes.json"), "utf8"),
) as {
  moveId: null;
  steps: Step[];
  proposedCauses: { id: string; cause: string; short: string }[];
};
const proposal = JSON.parse(
  fs.readFileSync(
    path.join(directory, "register-rebind-proposal.json"),
    "utf8",
  ),
) as ValueCase & {
  moveId: null;
  loadApproval: null;
  registerRows: {
    key: string;
    value: number;
    registerId: null;
    approvedBy: null;
    sourceFile: string;
    status: "proposed";
  }[];
  ratePolicy: { rates: unknown[] };
};
const step = (id: string) => walk.steps.find((s) => s.stepId === id)!;
let snapshot: PackSnapshot & {
  ingestion: Record<
    string,
    {
      method: string;
      chars: number;
      syntheticNotice: boolean;
      warnings: string[];
    }
  >;
};
beforeAll(() => {
  snapshot = JSON.parse(
    execFileSync(
      process.execPath,
      [
        "node_modules/tsx/dist/cli.mjs",
        "scripts/moves/denials-pack/read-pack.ts",
        directory,
      ],
      { encoding: "utf8", timeout: 30000, maxBuffer: 4 * 1024 * 1024 },
    ),
  ) as typeof snapshot;
}, 35000);

describe("synthetic discovery pack reconciles actual eight files", () => {
  it.each(PACK_FILES)(
    "existing upload parser reads original %s bytes with the synthetic notice",
    (file) => {
      expect(snapshot.ingestion[file].chars).toBeGreaterThan(200);
      expect(snapshot.ingestion[file].syntheticNotice).toBe(true);
      expect(snapshot.ingestion[file].method).not.toBe("unsupported");
      expect(
        snapshot.ingestion[file].warnings.every((w) =>
          /truncated|limited/i.test(w),
        ),
      ).toBe(true);
    },
  );
  it("reads every original artifact and agrees across ledgers, text, policies and finance", () => {
    expect(reconcilePack(snapshot)).toMatchObject({
      ok: true,
      files: 8,
      claimRows: 384,
      denialRows: 1536,
      errors: [],
    });
    expect(Object.keys(snapshot.hashes).sort()).toEqual([...PACK_FILES].sort());
  });
  it.each(PACK_FILES)("refuses a missing synthetic notice in %s", (file) => {
    const changed = structuredClone(snapshot);
    changed.text[file] = "Unmarked document";
    expect(reconcilePack(changed).errors).toContain(`synthetic_notice:${file}`);
  });
  it("refuses a changed submission denominator or stale formula result", () => {
    const changed = structuredClone(snapshot);
    changed.sheets[PACK_FILES[1]]["Claim cohorts"][5][5] = 1;
    const errors = reconcilePack(changed).errors;
    expect(errors).toContain("submission:0:5");
    expect(errors.some((e) => e.startsWith("quarter_summary:"))).toBe(true);
  });
  it("refuses disposition overlap, duplicate identity and missing parent", () => {
    const changed = structuredClone(snapshot);
    const rows = changed.sheets[PACK_FILES[1]]["Denial cohorts"];
    rows[5][9] = 0;
    rows[6][0] = rows[5][0];
    rows[7][1] = "absent";
    expect(reconcilePack(changed).errors).toEqual(
      expect.arrayContaining([
        "disposition_partition:0",
        "duplicate_denial",
        "denial_parent:2",
      ]),
    );
  });
  it("refuses wrong finance cost and a changed source-policy link", () => {
    const changed = structuredClone(snapshot);
    changed.sheets[PACK_FILES[5]].Finance[10][1] = 250;
    changed.sheets[PACK_FILES[3]].Inventory[5][7] = "POL-99";
    expect(reconcilePack(changed).errors).toEqual(
      expect.arrayContaining(["finance:11", "inventory:SYS-01:7"]),
    );
  });
  it("refuses prose with a different baseline", () => {
    const changed = structuredClone(snapshot);
    changed.text[PACK_FILES[4]] = changed.text[PACK_FILES[4]].replace(
      "618,000",
      "620,000",
    );
    expect(reconcilePack(changed).errors).toContain(
      `narrative_denominator:${PACK_FILES[4]}:618000`,
    );
  });
  it("every proposed register value is present in its stated workbook", () => {
    for (const row of proposal.registerRows) {
      const values = Object.values(snapshot.sheets[row.sourceFile])
        .flat()
        .flat();
      expect(
        values.some(
          (v) => typeof v === "number" && Math.abs(v - row.value) < 1e-8,
        ),
      ).toBe(true);
      expect(row).toMatchObject({
        status: "proposed",
        registerId: null,
        approvedBy: null,
      });
    }
    expect(proposal.registerRows).toHaveLength(22);
  });
});

describe("walk notes exercise the real deterministic parsers", () => {
  it("covers the actual 29 steps and records no approvals or Move binding", () => {
    expect(walk.steps.map((s) => s.stepId)).toEqual(
      Array.from({ length: 6 }, (_, p) =>
        resolvePhaseWorkflow(p, null).map((s) => s.id),
      ).flat(),
    );
    expect(walk.steps).toHaveLength(29);
    expect(walk.moveId).toBeNull();
    for (const s of walk.steps) {
      expect(s.approvalRecorded).toBe(false);
      expect(s.humanClicks.length).toBeGreaterThan(0);
      for (const f of s.uploads) expect(PACK_FILES).toContain(f);
    }
  });
  it.each(walk.steps.filter((s) => s.parser === "capture-text-step-notes"))(
    "$stepId fills exact labels as drafts",
    (s) => {
      const filled = captureTextStepNotes(s.pasteBlock, s.fields, {});
      expect(Object.keys(filled).sort()).toEqual(
        s.fields.map((f) => f.key).sort(),
      );
      for (const field of Object.values(filled))
        expect(field).toMatchObject({ source: "notes", status: "draft" });
      const occupied = Object.fromEntries(
        s.fields.map((f) => [f.key, "Already saved"]),
      );
      expect(captureTextStepNotes(s.pasteBlock, s.fields, occupied)).toEqual(
        {},
      );
    },
  );
  it.each(walk.steps.filter((s) => s.parser === "capture-notes-proposal"))(
    "$stepId matches each field without overwriting",
    (s) => {
      const targets = getPhaseCaptureSections(s.phase)
        .filter((x) => s.fields.some((f) => f.key === x.key))
        .map((section) => ({
          section: {
            ...section,
            label: s.fields.find((f) => f.key === section.key)!.label,
          },
          value: "",
        }));
      const result = proposeCaptureValuesFromNotes({
        notes: s.pasteBlock,
        targets,
      });
      expect(result.unmatchedSections).toEqual([]);
      expect(result.proposals.map((p) => p.sectionKey).sort()).toEqual(
        s.fields.map((f) => f.key).sort(),
      );
      for (const p of result.proposals)
        expect(p.basis).toBe("workspace_assertion");
      expect(
        proposeCaptureValuesFromNotes({
          notes: s.pasteBlock,
          targets: targets.map((t) => ({ ...t, value: "Already saved" })),
        }).proposals,
      ).toEqual([]);
    },
  );
  it("proposes three causal findings without assigning a human owner or rank", () => {
    const result = proposeRootCausesFromNotes(step("P2.3").pasteBlock, {
      kind: "root_cause_register",
      version: 1,
      causes: [],
    });
    expect(result).toHaveLength(3);
    expect(result.every((p) => p.kind === "cause")).toBe(true);
  });
  const rows = walk.proposedCauses.map((c, i) => ({
    rank: i + 1,
    causeId: c.id,
    cause: c.cause,
  }));
  it("proposes one design response for each actual cause", () => {
    expect(
      proposeDesignFromNotes(step("P3.1").pasteBlock, rows).map(
        (p) => p.causeId,
      ),
    ).toEqual(["RC-1", "RC-2", "RC-3"]);
  });
  it("fills option rationale and partial coverage only after a person has chosen and marked the option", () => {
    const elements = walk.proposedCauses.map((c, i) => ({
      causeId: c.id,
      rank: i + 1,
      short: c.short,
      element: c.cause,
    }));
    const result = proposeChoiceFromNotes(step("P3.2").pasteBlock, {
      choice: {
        kind: "architecture_choice",
        version: 1,
        optionId: "SYNTHETIC-OPTION",
        optionLabel: "Governed batch prevention and recovery",
        optionSetSource: "move_uploaded_options",
        chosenBy: "synthetic test reviewer",
        chosenAt: "2026-10-10",
        coverage: elements.map((e) => ({
          causeId: e.causeId,
          element: e.element,
          mark: "partly",
          source: "team",
        })),
      },
      recommendation: "",
      elements,
    });
    expect(result.filter((p) => p.kind === "why")).toHaveLength(1);
    expect(result.filter((p) => p.kind === "how")).toHaveLength(3);
  });
  it("role-only adoption notes draft words, never assign participants or accept owners", () => {
    const result = fillFromNotes(step("P3.3").pasteBlock, {
      profile: "full",
      record: emptyOperatingAdoption(),
      rows: [],
      people: [],
      values: {},
    });
    expect(result.record.answers.map((a) => a.key)).toEqual(
      expect.arrayContaining(["operating_model", "process_design"]),
    );
    expect(result.record.answers.every((a) => a.draft && !a.accepted)).toBe(
      true,
    );
    expect(result.record.rows).toEqual([]);
    expect(result.record.ownersAcceptedAt).toBeUndefined();
  });
  it("foundation and two use cases fill counts only and cannot approve or price", () => {
    const empty = emptyRomEstimate();
    const added = addFoundation(empty);
    if (!added.ok) throw new Error(added.reason);
    const proposals = proposeRomCountsFromNotes(
      step("P3.4").pasteBlock,
      added.value,
    );
    expect(proposals.map((p) => p.code)).toEqual([
      "FOUNDATION",
      "UC-1",
      "UC-2",
    ]);
    expect(proposals[0].counts).toMatchObject({
      data_source_count: 6,
      source_table_count: 28,
    });
    expect(
      proposals
        .slice(1)
        .every(
          (p) =>
            p.counts.data_source_count === 0 &&
            p.counts.source_table_count === 0,
        ),
    ).toBe(true);
    const record = applyRomNotesProposals(added.value, proposals);
    expect(record.approval).toBeNull();
    expect(record.unitHours).toEqual({});
    expect(record.pod).toBeNull();
    expect(record.useCases.every((u) => !u.confirmedAt)).toBe(true);
  });
  it("human-only and read-only steps explicitly have no pretend notes parser", () => {
    for (const s of walk.steps.filter((s) =>
      ["human-only", "read-only"].includes(s.parser),
    ))
      expect(s.pasteBlock).toBe("");
    expect(step("P4.2").parser).toBe("read-only");
  });
});

describe("value engine preserves missing approval and non-cash capacity", () => {
  const model: ValueCase = {
    levers: proposal.levers.map(({ releasePath, ...l }) => ({
      ...l,
      ...(releasePath ? { releasePath } : {}),
    })),
    cost: proposal.cost,
    horizonYears: 3,
    discountRate: proposal.discountRate,
  };
  const resolver: ValueInputResolver = (ref) => {
    if (ref.kind !== "register") return null;
    const row = proposal.registerRows.find(
      (r) => `UNBOUND_${r.key}` === ref.registerId,
    );
    return row
      ? {
          value: row.value,
          source: "offline synthetic proposal",
          status: "proposed",
          confidence: 3,
        }
      : null;
  };
  it("proposed inputs and absent approved ROM block economics rather than using the budget", () => {
    const result = evaluateValueCase(model, { resolver });
    expect(result.status).toBe("blocked");
    expect(result.economics).toBeNull();
    expect(result.readyForApproval).toBe(false);
    expect(proposal.ratePolicy.rates).toEqual([]);
    expect(proposal.moveId).toBeNull();
    expect(proposal.loadApproval).toBeNull();
  });
  it("isolated conversion simulation never monetizes rework or days-AR and keeps the payment lag", () => {
    // A zero-cost test isolates conversion/timing, not investment economics or approval.
    const counted: ValueInputResolver = (ref) => {
      const r = resolver(ref);
      return r ? { ...r, status: "open" } : null;
    };
    const result = evaluateValueCase(
      { ...model, cost: { kind: "estimate", baseCents: 0 } },
      { resolver: counted },
    );
    expect(result.status).toBe("evaluated");
    for (const id of ["L2", "L3"]) {
      const lever = result.levers.find((l) => l.leverId === id)!;
      expect(lever.status).toBe("zero_no_release_path");
      expect(lever.annualCents?.base).toBe(0);
      expect(lever.inCash).toBe(false);
    }
    const revenue = result.levers.find((l) => l.leverId === "L1")!;
    expect(revenue.annualCents?.base).toBe(
      Math.round(
        buildScenario().trailingYear.writeOffs * 0.18 * 0.65 * 0.75 * 100,
      ),
    );
    expect(revenue.monthlyCashCents.base.slice(0, 9)).toEqual(Array(9).fill(0));
    expect(revenue.monthlyCashCents.base[9]).toBeGreaterThan(0);
    expect(
      result.levers.find((l) => l.leverId === "L2")!.nonMoneyMetric?.value.base,
    ).toBeCloseTo(8928.6376, 3);
  });
  it("counted synthetic lever inputs still cannot replace an absent approved ROM with the budget", () => {
    const counted: ValueInputResolver = (ref) => {
      const r = resolver(ref);
      return r ? { ...r, status: "open" } : null;
    };
    expect(model.cost).toEqual({
      kind: "rom",
      snapshotId: "UNBOUND_OWNER_APPROVED_CURRENT_P3_ROM",
    });
    const result = evaluateValueCase(model, { resolver: counted });
    expect(result.status).toBe("blocked");
    expect(result.economics).toBeNull();
    expect(result.caseInputIssues.length).toBeGreaterThan(0);
  });
});
