/**
 * The Move assumptions register's pure domain model.
 *
 * What is pinned, and why each case can fail:
 *
 *   - the lifecycle: every (status × action) pair is tried, and the allowed set
 *     is written out here from the product decision rather than read back from
 *     the module, so widening or narrowing the table fails;
 *   - aVa never moves or edits a row, even on an edge a person may take;
 *   - an answer always names its source, and a correction states its answer;
 *   - the ID scheme: four prefixes, `DL` never read as data row `L…`, sequence
 *     is max+1 over EVERY status so a superseded or rejected row's ID is never
 *     handed out again;
 *   - citations `[A:V3]` parse exactly and nothing near them does;
 *   - the generation view carries the owner ROLE, never a personal name, and
 *     the figure a corrected row stands on is the answer, never the figure
 *     that was wrong;
 *   - the governed projection evaluates to `warn` under the real policy and
 *     never claims agent_ready; an unknown tenant is blocked;
 *   - the migration's CHECK vocabularies match the model's, so the two cannot
 *     drift apart unnoticed.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { CANONICAL_TENANT_KEYS as GOVERNED_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import { evaluateGovernedObject } from "@/lib/governance/context-corpus-policy";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import {
  CANONICAL_TENANT_KEYS,
  appClientKeyForTenant,
  canonicalTenantKey,
} from "@/lib/tenant/aliases";
import {
  AREA_ID_PREFIX,
  ASSUMPTION_AREAS,
  ASSUMPTION_ORIGINS,
  ASSUMPTION_STATUSES,
  INITIAL_STATUS_BY_ORIGIN,
  agentContextAssumptions,
  assumptionFromRow,
  confidenceLevel,
  confidenceScore,
  effectiveFigure,
  effectiveValue,
  findRegisterCitations,
  formatRegisterId,
  isRegisterConfidence,
  nextRegisterSeq,
  parseRegisterCitation,
  parseRegisterId,
  patchToRow,
  planEdit,
  planTransition,
  toApprovedAssumption,
  toGovernedObject,
  validateNewAssumption,
  type AssumptionAction,
  type AssumptionRecord,
  type AssumptionStatus,
  type NewAssumptionInput,
  type TransitionRequest,
} from "../assumption-register/model";

const NOW = "2026-10-10T12:00:00.000Z";
const PERSON = { kind: "person" as const, userId: "user-1" };
const AVA = { kind: "ava" as const, userId: "ava" };
/** A tenant the governance policy recognises, read from code. */
const DEMO_APP_KEY = appClientKeyForTenant(GOVERNED_TENANT_KEYS[0])!;

function record(overrides: Partial<AssumptionRecord> = {}): AssumptionRecord {
  return {
    id: "a-1",
    tenantKey: DEMO_APP_KEY,
    programId: "move-1",
    area: "value",
    seq: 3,
    registerId: "V3",
    statement: "Handle time falls after the change",
    whyItMatters: "Drives the labour saving",
    workingFigure: "12%",
    workingValue: 12,
    unit: "percent",
    source: "Team workshop estimate",
    confidence: 3,
    ownerRole: "Finance office",
    ownerName: "Pat Example",
    ownerPersonId: null,
    status: "open",
    origin: "team",
    answer: null,
    answerFigure: null,
    answerValue: null,
    answerSource: null,
    answeredByUserId: null,
    answeredAt: null,
    acceptedByUserId: null,
    acceptedAt: null,
    supersededBy: null,
    raisedPhase: 1,
    raisedStepId: null,
    evidenceIds: [],
    charterSectionKey: null,
    charterValueRevision: null,
    revision: 1,
    createdByUserId: "user-1",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

/** A well-formed request for each action. */
const REQUESTS: Record<AssumptionAction, TransitionRequest> = {
  accept: { action: "accept" },
  reject: { action: "reject" },
  confirm: { action: "confirm", answerSource: "Finance ledger extract" },
  correct: {
    action: "correct",
    answerSource: "Finance ledger extract",
    answer: "It is 9%, not 12%",
    answerFigure: "9%",
  },
  supersede: { action: "supersede", supersededBy: "a-2" },
};

/** The product decision, written out independently of the module's table. */
const ALLOWED: ReadonlyArray<
  [AssumptionStatus, AssumptionAction, AssumptionStatus]
> = [
  ["proposed", "accept", "open"],
  ["proposed", "reject", "rejected"],
  ["open", "confirm", "confirmed"],
  ["open", "correct", "corrected"],
  ["open", "supersede", "superseded"],
  ["confirmed", "correct", "corrected"],
  ["confirmed", "supersede", "superseded"],
  ["corrected", "correct", "corrected"],
  ["corrected", "supersede", "superseded"],
];
const ACTIONS = Object.keys(REQUESTS) as AssumptionAction[];

describe("register lifecycle", () => {
  const cases = ASSUMPTION_STATUSES.flatMap((from) =>
    ACTIONS.map((action) => [from, action] as const),
  );

  it.each(cases)("%s --%s-->", (from, action) => {
    const allowed = ALLOWED.find(([f, a]) => f === from && a === action);
    const result = planTransition(
      record({ status: from }),
      REQUESTS[action],
      PERSON,
      NOW,
    );
    if (allowed) {
      expect(result).toMatchObject({
        ok: true,
        to: allowed[2],
        patch: { status: allowed[2] },
      });
    } else {
      expect(result).toEqual({
        ok: false,
        refusal: { code: "invalid_transition", from, action },
      });
    }
  });

  it("allows exactly the decided status edges and nothing out of a terminal status", () => {
    const reached = new Set<string>();
    for (const [from, action] of cases) {
      const result = planTransition(
        record({ status: from }),
        REQUESTS[action],
        PERSON,
        NOW,
      );
      if (result.ok) reached.add(`${from}->${result.to}`);
    }
    expect([...reached].sort()).toEqual(
      [...new Set(ALLOWED.map(([f, , t]) => `${f}->${t}`))].sort(),
    );
    expect([...reached].some((edge) => edge.startsWith("superseded->"))).toBe(
      false,
    );
    expect([...reached].some((edge) => edge.startsWith("rejected->"))).toBe(
      false,
    );
  });

  it.each(ALLOWED)(
    "aVa may not take %s --%s--> even though a person may",
    (from, action) => {
      expect(
        planTransition(record({ status: from }), REQUESTS[action], AVA, NOW),
      ).toEqual({
        ok: false,
        refusal: { code: "actor_not_permitted", action },
      });
    },
  );

  it("accept records who accepted and when; reject records no acceptance", () => {
    const accepted = planTransition(
      record({ status: "proposed" }),
      REQUESTS.accept,
      PERSON,
      NOW,
    );
    expect(accepted).toEqual({
      ok: true,
      to: "open",
      patch: { status: "open", acceptedByUserId: "user-1", acceptedAt: NOW },
    });
    const rejected = planTransition(
      record({ status: "proposed" }),
      REQUESTS.reject,
      PERSON,
      NOW,
    );
    expect(rejected).toEqual({
      ok: true,
      to: "rejected",
      patch: { status: "rejected" },
    });
  });

  it("an answer names its source; blank or missing source is refused", () => {
    for (const answerSource of ["", "   "]) {
      expect(
        planTransition(
          record(),
          { action: "confirm", answerSource },
          PERSON,
          NOW,
        ),
      ).toEqual({ ok: false, refusal: { code: "answer_source_required" } });
      expect(
        planTransition(
          record(),
          { action: "correct", answerSource, answer: "9%" },
          PERSON,
          NOW,
        ),
      ).toEqual({ ok: false, refusal: { code: "answer_source_required" } });
    }
  });

  it("a correction states its answer; a confirmation need not", () => {
    expect(
      planTransition(
        record(),
        { action: "correct", answerSource: "Ledger", answer: "  " },
        PERSON,
        NOW,
      ),
    ).toEqual({ ok: false, refusal: { code: "answer_required" } });
    const confirmed = planTransition(
      record(),
      { action: "confirm", answerSource: "  Ledger  " },
      PERSON,
      NOW,
    );
    expect(confirmed).toEqual({
      ok: true,
      to: "confirmed",
      patch: {
        status: "confirmed",
        answer: null,
        answerFigure: null,
        answerValue: null,
        answerSource: "Ledger",
        answeredByUserId: "user-1",
        answeredAt: NOW,
      },
    });
  });

  it("a correction writes the trimmed answer, figure and value", () => {
    const corrected = planTransition(
      record({ status: "confirmed" }),
      {
        action: "correct",
        answerSource: "Ledger",
        answer: " It is 9% ",
        answerFigure: " 9% ",
        answerValue: 9,
      },
      PERSON,
      NOW,
    );
    expect(corrected).toMatchObject({
      ok: true,
      patch: {
        answer: "It is 9%",
        answerFigure: "9%",
        answerValue: 9,
        answerSource: "Ledger",
      },
    });
  });

  it("a supersede points at another row, never at nothing or itself", () => {
    for (const supersededBy of ["", "a-1"]) {
      expect(
        planTransition(
          record({ id: "a-1" }),
          { action: "supersede", supersededBy },
          PERSON,
          NOW,
        ),
      ).toEqual({ ok: false, refusal: { code: "superseded_by_required" } });
    }
    expect(
      planTransition(
        record(),
        { action: "supersede", supersededBy: "a-9" },
        PERSON,
        NOW,
      ),
    ).toEqual({
      ok: true,
      to: "superseded",
      patch: { status: "superseded", supersededBy: "a-9" },
    });
  });
});

describe("register edits", () => {
  it.each(ASSUMPTION_STATUSES)("status %s", (status) => {
    const result = planEdit(
      record({ status }),
      { statement: "Revised" },
      PERSON,
    );
    if (status === "proposed" || status === "open") {
      expect(result).toEqual({
        ok: true,
        to: status,
        patch: { statement: "Revised" },
      });
    } else {
      expect(result).toEqual({
        ok: false,
        refusal: { code: "edit_not_allowed", status },
      });
    }
  });

  it("aVa never edits", () => {
    expect(
      planEdit(record({ status: "proposed" }), { statement: "x" }, AVA),
    ).toEqual({
      ok: false,
      refusal: { code: "actor_not_permitted", action: "edit" },
    });
  });

  it.each(["statement", "source", "ownerRole"] as const)(
    "a blank %s is refused",
    (field) => {
      expect(planEdit(record(), { [field]: " " }, PERSON)).toEqual({
        ok: false,
        refusal: { code: "invalid_input", field },
      });
    },
  );

  it("confidence stays on the 1/3/5 scale, and an empty edit is refused", () => {
    expect(planEdit(record(), { confidence: 2 as never }, PERSON)).toEqual({
      ok: false,
      refusal: { code: "invalid_input", field: "confidence" },
    });
    expect(planEdit(record(), {}, PERSON)).toEqual({
      ok: false,
      refusal: { code: "invalid_input", field: "edit" },
    });
  });

  it("area is not editable — it is part of the ID", () => {
    const result = planEdit(
      record(),
      { area: "data", status: "confirmed", workingFigure: "15%" } as never,
      PERSON,
    );
    expect(result).toEqual({
      ok: true,
      to: "open",
      patch: { workingFigure: "15%" },
    });
  });

  it("patchToRow writes snake_case columns and skips undefined", () => {
    expect(
      patchToRow({
        ownerRole: "CFO office",
        answerSource: undefined,
        supersededBy: "x",
      }),
    ).toEqual({ owner_role: "CFO office", superseded_by: "x" });
  });
});

describe("register IDs", () => {
  it("uses V, D, DL and A", () => {
    expect(AREA_ID_PREFIX).toEqual({
      value: "V",
      data: "D",
      delivery: "DL",
      adoption: "A",
    });
    expect(ASSUMPTION_AREAS.map((area) => formatRegisterId(area, 4))).toEqual([
      "V4",
      "D4",
      "DL4",
      "A4",
    ]);
  });

  it.each([0, -1, 1.5, Number.NaN])("refuses sequence %p", (seq) => {
    expect(() => formatRegisterId("value", seq)).toThrow();
  });

  it("round-trips every area, and DL is delivery, never data", () => {
    for (const area of ASSUMPTION_AREAS) {
      expect(parseRegisterId(formatRegisterId(area, 12))).toEqual({
        area,
        seq: 12,
        registerId: formatRegisterId(area, 12),
      });
    }
    expect(parseRegisterId("DL3")?.area).toBe("delivery");
    expect(parseRegisterId("D3")?.area).toBe("data");
  });

  it.each(["V0", "V01", "X3", "v3", "DL", "V", "VV3", " V3", "DL-3"])(
    "%p is not a register ID",
    (value) => {
      expect(parseRegisterId(value)).toBeNull();
    },
  );

  it("allocates max+1 per area, counting every row ever allocated", () => {
    expect(nextRegisterSeq([], "value")).toBe(1);
    const rows = [
      { area: "value" as const, seq: 1 }, // superseded, still owns V1
      { area: "value" as const, seq: 3 }, // rejected, still owns V3
      { area: "data" as const, seq: 7 },
    ];
    expect(nextRegisterSeq(rows, "value")).toBe(4);
    expect(nextRegisterSeq(rows, "data")).toBe(8);
    expect(nextRegisterSeq(rows, "delivery")).toBe(1);
  });
});

describe("register citations", () => {
  it.each([
    ["[A:V3]", "V3", "value", 3],
    ["[A:D2]", "D2", "data", 2],
    ["[A:DL12]", "DL12", "delivery", 12],
    ["  [A:A1] ", "A1", "adoption", 1],
  ] as const)("%p", (token, registerId, area, seq) => {
    expect(parseRegisterCitation(token)).toEqual({ registerId, area, seq });
  });

  it.each([
    "[A:V0]",
    "[A:X1]",
    "[V3]",
    "[A:V3",
    "[a:v3]",
    "[A:V3] extra",
    "[A: V3]",
    "[A:V3,D2]",
  ])("%p is not a citation", (token) => {
    expect(parseRegisterCitation(token)).toBeNull();
  });

  it("finds every citation in a text, in order, skipping near-misses", () => {
    expect(
      findRegisterCitations(
        "Saves 12% [A:V3], needs data [A:D2] and [A:DL2]; not [A:X9] or [A:V0]. Again [A:V3].",
      ).map((c) => c.registerId),
    ).toEqual(["V3", "D2", "DL2", "V3"]);
    expect(
      findRegisterCitations("no citations [1] [ASSUMPTION TO VALIDATE]"),
    ).toEqual([]);
  });
});

describe("confidence", () => {
  it("maps 1/3/5 to low/medium/high and back", () => {
    expect([1, 3, 5].map((s) => confidenceLevel(s as 1 | 3 | 5))).toEqual([
      "low",
      "medium",
      "high",
    ]);
    expect((["low", "medium", "high"] as const).map(confidenceScore)).toEqual([
      1, 3, 5,
    ]);
    expect(() => confidenceScore("certain" as never)).toThrow();
  });

  it.each([0, 2, 4, 6, "3", null])(
    "%p is not a register confidence",
    (value) => {
      expect(isRegisterConfidence(value)).toBe(false);
    },
  );
});

describe("new rows", () => {
  const base: NewAssumptionInput = {
    area: "value",
    statement: "Handle time falls",
    source: "Workshop",
    confidence: 1,
    ownerRole: "Operations lead",
    origin: "team",
    workingFigure: "10%",
  };

  it("a person's row is open at once; anything a machine raised waits", () => {
    expect(INITIAL_STATUS_BY_ORIGIN).toEqual({
      team: "open",
      charter_carry_forward: "open",
      ava_proposal: "proposed",
      evidence_extraction: "proposed",
    });
  });

  it("aVa may only raise an ava_proposal, and a person may not raise one", () => {
    expect(validateNewAssumption(base, PERSON)).toEqual({ ok: true });
    expect(validateNewAssumption(base, AVA)).toEqual({
      ok: false,
      refusal: { code: "invalid_input", field: "origin" },
    });
    expect(
      validateNewAssumption({ ...base, origin: "ava_proposal" }, PERSON),
    ).toEqual({
      ok: false,
      refusal: { code: "invalid_input", field: "origin" },
    });
    expect(
      validateNewAssumption({ ...base, origin: "ava_proposal" }, AVA),
    ).toEqual({ ok: true });
  });

  it("an aVa proposal must carry its figure; a team row need not", () => {
    expect(
      validateNewAssumption(
        { ...base, origin: "ava_proposal", workingFigure: " " },
        AVA,
      ),
    ).toEqual({
      ok: false,
      refusal: { code: "invalid_input", field: "workingFigure" },
    });
    expect(
      validateNewAssumption({ ...base, workingFigure: null }, PERSON),
    ).toEqual({ ok: true });
  });

  it.each([
    ["statement", { statement: " " }],
    ["source", { source: "" }],
    ["ownerRole", { ownerRole: "  " }],
    ["confidence", { confidence: 2 }],
    ["area", { area: "cost" }],
    ["origin", { origin: "import" }],
    ["raisedPhase", { raisedPhase: 6 }],
    ["raisedPhase", { raisedPhase: -1 }],
  ])("refuses a bad %s", (field, overrides) => {
    expect(
      validateNewAssumption(
        { ...base, ...(overrides as object) } as NewAssumptionInput,
        PERSON,
      ),
    ).toEqual({ ok: false, refusal: { code: "invalid_input", field } });
  });

  it("accepts phases 0 through 5", () => {
    for (const raisedPhase of [0, 5]) {
      expect(validateNewAssumption({ ...base, raisedPhase }, PERSON)).toEqual({
        ok: true,
      });
    }
  });
});

describe("row mapping", () => {
  const row = {
    id: "a-1",
    tenant_key: DEMO_APP_KEY,
    program_id: "move-1",
    area: "delivery",
    seq: "2",
    register_id: "DL2",
    statement: "Two squads are free in Q1",
    working_value: "4.50",
    source: "Resourcing plan",
    confidence: 5,
    owner_role: "Delivery lead",
    status: "open",
    origin: "team",
    revision: 3,
    evidence_ids: ["e-1", 7],
    created_by_user_id: "user-1",
    created_at: NOW,
    updated_at: NOW,
  };

  it("maps a row, reading NUMERIC strings as numbers", () => {
    expect(assumptionFromRow(row)).toMatchObject({
      area: "delivery",
      seq: 2,
      registerId: "DL2",
      workingValue: 4.5,
      confidence: 5,
      revision: 3,
      evidenceIds: ["e-1"],
      workingFigure: null,
    });
  });

  it.each([
    ["status", { status: "draft" }],
    ["area", { area: "cost" }],
    ["origin", { origin: "import" }],
    ["confidence", { confidence: 2 }],
    ["source", { source: "" }],
    ["owner_role", { owner_role: null }],
    ["seq", { seq: null }],
  ])("refuses a row with a bad %s", (_field, overrides) => {
    expect(assumptionFromRow({ ...row, ...overrides })).toBeNull();
  });
});

describe("generation view", () => {
  it.each(["proposed", "rejected", "superseded"] as const)(
    "a %s row never reaches a document",
    (status) => {
      expect(toApprovedAssumption(record({ status }))).toBeNull();
    },
  );

  it("an open row stands on its working figure and must be validated", () => {
    expect(toApprovedAssumption(record())).toEqual({
      key: "V3",
      statement: "Handle time falls after the change",
      basis: "Team workshop estimate",
      mustValidate: true,
      registerId: "V3",
      figure: "12%",
      ownerRole: "Finance office",
      confidence: 3,
      status: "open",
    });
  });

  it("a confirmed row stands on its answer figure, or the figure it confirmed", () => {
    const confirmed = record({
      status: "confirmed",
      answerSource: "Ledger",
      answeredAt: NOW,
    });
    expect(toApprovedAssumption(confirmed)).toMatchObject({
      figure: "12%",
      mustValidate: false,
      basis: "Team workshop estimate; answered from Ledger",
    });
    expect(
      toApprovedAssumption({ ...confirmed, answerFigure: "11%" })?.figure,
    ).toBe("11%");
  });

  it("a corrected row stands only on its answer, never the figure that was wrong", () => {
    const corrected = record({
      status: "corrected",
      answer: "It is 9%",
      answerFigure: "9%",
      answerSource: "Ledger",
    });
    expect(toApprovedAssumption(corrected)).toMatchObject({
      figure: "9%",
      mustValidate: false,
      statement: "Handle time falls after the change — corrected: It is 9%",
    });
    expect(effectiveFigure({ ...corrected, answerFigure: null })).toBeNull();
  });

  it.each(ASSUMPTION_STATUSES)(
    "never carries the owner's personal name (%s)",
    (status) => {
      const view = toApprovedAssumption(
        record({ status, answer: "x", answerSource: "y" }),
      );
      expect(JSON.stringify(view ?? {})).not.toContain("Pat Example");
    },
  );
});

describe("effective value (the value engine's numeric twin of the figure)", () => {
  it.each(["proposed", "rejected", "superseded"] as const)(
    "a %s row stands on no value, whatever numbers it holds",
    (status) => {
      expect(
        effectiveValue(record({ status, workingValue: 12, answerValue: 9 })),
      ).toBeNull();
    },
  );

  it("an open row stands on its working value, counts, and must be validated", () => {
    expect(effectiveValue(record({ answerValue: 9 }))).toEqual({
      value: 12,
      confidence: 3,
      status: "open",
      mustValidate: true,
    });
  });

  it("a confirmed row stands on its answer value, else the working value it confirmed", () => {
    const confirmed = record({ status: "confirmed", confidence: 5 });
    expect(effectiveValue(confirmed)).toEqual({
      value: 12,
      confidence: 5,
      status: "confirmed",
      mustValidate: false,
    });
    expect(effectiveValue({ ...confirmed, answerValue: 11 })?.value).toBe(11);
  });

  it("a corrected row stands ONLY on its answer value, never the value that was wrong", () => {
    const corrected = record({
      status: "corrected",
      confidence: 1,
      answerValue: 9,
    });
    expect(effectiveValue(corrected)).toEqual({
      value: 9,
      confidence: 1,
      status: "corrected",
      mustValidate: false,
    });
    expect(effectiveValue({ ...corrected, answerValue: null })).toBeNull();
  });

  it("a counted row with no finite value stands on nothing, never zero", () => {
    expect(effectiveValue(record({ workingValue: null }))).toBeNull();
    expect(
      effectiveValue(record({ workingValue: Number.POSITIVE_INFINITY })),
    ).toBeNull();
    expect(
      effectiveValue(record({ status: "confirmed", answerValue: Number.NaN })),
    ).toBeNull();
  });

  it("zero is a value, not an absence", () => {
    expect(effectiveValue(record({ workingValue: 0 }))?.value).toBe(0);
  });

  it.each(ASSUMPTION_STATUSES)(
    "agrees with the figure rule on whether a %s row stands on anything",
    (status) => {
      const both = record({
        status,
        workingFigure: "12%",
        answerFigure: "9%",
        answerValue: 9,
      });
      expect(effectiveValue(both) === null).toBe(
        effectiveFigure(both) === null,
      );
    },
  );
});

describe("governed projection", () => {
  const scope = { tenantId: "client-uuid-1" };

  it.each([...GOVERNED_TENANT_KEYS])(
    "evaluates to warn and is never agent_ready (%s)",
    (tenant) => {
      const appKey = appClientKeyForTenant(tenant) ?? tenant;
      for (const status of ASSUMPTION_STATUSES) {
        const object = toGovernedObject(
          record({ status, tenantKey: appKey }),
          scope,
        );
        const evaluation = evaluateGovernedObject(object);
        expect(evaluation.errors).toEqual([]);
        expect(evaluation.decision).toBe("warn");
        expect(evaluation.agentReady).toBe(false);
        expect(object.agent_readiness_status).not.toBe("agent_ready");
        expect(object.client_key).toBe(canonicalTenantKey(tenant));
      }
    },
  );

  it("is Move-layer, confidential, owned by a role, and cites its register ID", () => {
    const object = toGovernedObject(record({ evidenceIds: ["e-1"] }), scope);
    expect(object).toMatchObject({
      source_layer: "move",
      classification: "confidential",
      owner: "Finance office",
      confidence_level: "medium",
      strategic_move_phase_applicability: ["P1"],
      source_references: ["[A:V3]", "e-1"],
      tenant_id: "client-uuid-1",
      retrievability: "committed_not_indexed",
    });
    expect(object.source_basis).toBe("Team workshop estimate");
    expect(JSON.stringify(object)).not.toContain("Pat Example");
  });

  it("a tenant the governance policy does not recognise is blocked, not passed", () => {
    const ungoverned = CANONICAL_TENANT_KEYS.filter(
      (key) => !(GOVERNED_TENANT_KEYS as readonly string[]).includes(key),
    );
    for (const tenant of ungoverned) {
      const appKey = appClientKeyForTenant(tenant) ?? tenant;
      expect(
        evaluateGovernedObject(
          toGovernedObject(record({ tenantKey: appKey }), scope),
        ).decision,
      ).toBe("block");
    }
  });

  it("an unknown tenant or a missing tenant id is blocked", () => {
    expect(
      evaluateGovernedObject(
        toGovernedObject(record({ tenantKey: "not-a-tenant" }), scope),
      ).decision,
    ).toBe("block");
    expect(
      evaluateGovernedObject(toGovernedObject(record(), { tenantId: "" }))
        .decision,
    ).toBe("block");
  });

  it("agent context keeps only counted, unblocked rows", () => {
    const rows = ASSUMPTION_STATUSES.map((status, index) =>
      record({ id: `a-${index}`, status }),
    );
    rows.push(record({ id: "foreign", tenantKey: "not-a-tenant" }));
    expect(agentContextAssumptions(rows, scope).map((r) => r.status)).toEqual([
      "open",
      "confirmed",
      "corrected",
    ]);
  });
});

describe("flag", () => {
  it("is on for the synthetic demo tenant only", () => {
    const enrolled = CANONICAL_TENANT_KEYS.map(appClientKeyForTenant).filter(
      (key): key is NonNullable<typeof key> =>
        key !== null &&
        isFeatureEnabled({ clientKey: key }, "moves_assumption_register_v1"),
    );
    expect(enrolled).toEqual(["meridian"]);
    expect(isFeatureEnabled(null, "moves_assumption_register_v1")).toBe(false);
  });
});

describe("migration vocabulary", () => {
  const sql = readFileSync(
    path.join(
      process.cwd(),
      "supabase/migrations/20261010120000_move_assumption_register.sql",
    ),
    "utf8",
  );
  const checkList = (constraint: string): string[] => {
    const match = new RegExp(
      `${constraint}\\s+CHECK \\(\\w+ IN \\(([^)]*)\\)\\)`,
    ).exec(sql);
    if (!match) throw new Error(`constraint ${constraint} not found`);
    return match[1].split(",").map((value) => value.trim().replace(/'/g, ""));
  };

  it("matches the model's statuses, origins, areas and confidence scale", () => {
    expect(checkList("move_assumptions_status_check")).toEqual([
      ...ASSUMPTION_STATUSES,
    ]);
    expect(checkList("move_assumptions_origin_check")).toEqual([
      ...ASSUMPTION_ORIGINS,
    ]);
    expect(checkList("move_assumptions_area_check")).toEqual([
      ...ASSUMPTION_AREAS,
    ]);
    expect(checkList("move_assumptions_confidence_check")).toEqual([
      "1",
      "3",
      "5",
    ]);
    expect(checkList("move_assumption_events_to_status_check")).toEqual([
      ...ASSUMPTION_STATUSES,
    ]);
  });

  it("derives the register ID from the same prefixes", () => {
    for (const area of ASSUMPTION_AREAS) {
      expect(sql).toContain(`WHEN '${area}' THEN '${AREA_ID_PREFIX[area]}'`);
    }
  });
});
