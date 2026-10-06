import { recordSourceEventAward } from "@/lib/source/award/write-award-decision";

const eventId = "22222222-2222-4222-8222-222222222222";

type Call = { sql: string; params: unknown[] };

type Fixture = {
  events?: unknown[];
  candidates?: unknown[];
  awardInserted?: unknown[];
  contractInserted?: unknown[];
};

/**
 * Mimics `createTxSession`: it commits whatever the callback returns and
 * rethrows whatever it throws. The rollback flag is what proves a refusal
 * discovered after the first insert actually leaves by throwing, rather than
 * returning and committing a half-written award.
 */
function harness(fixture: Fixture = {}) {
  const calls: Call[] = [];
  let rolledBack = false;
  const rows = {
    events: fixture.events ?? [{ event_code: "SRC-0007" }],
    candidates: fixture.candidates ?? [{ authority_id: "AUTH-1", legal_name: "Named Supplier Ltd" }],
    awardInserted: fixture.awardInserted ?? [{ id: "award-row-1" }],
    contractInserted: fixture.contractInserted ?? [{ contract_id: "written" }],
  };

  const tx = async <T>(fn: (run: (sql: string, params?: unknown[]) => Promise<unknown[]>) => Promise<T>): Promise<T> => {
    try {
      return await fn(async (sql: string, params: unknown[] = []) => {
        calls.push({ sql, params });
        if (sql.includes("FROM source_events")) return rows.events;
        if (sql.includes("source_event_candidate_supplier_authority")) return rows.candidates;
        if (sql.includes("INSERT INTO source_event_award_decision")) return rows.awardInserted;
        if (sql.includes("INSERT INTO source.contract")) return rows.contractInserted;
        return [];
      });
    } catch (error) {
      rolledBack = true;
      throw error;
    }
  };

  return {
    calls,
    didRollBack: () => rolledBack,
    inserts: () => calls.filter((call) => call.sql.includes("INSERT INTO")),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: tx as any,
  };
}

const input = {
  clientKey: "tenant-alpha",
  eventId,
  vendorId: "VEN-001",
  approvedByUserId: "person-1",
  approvedByName: "Named approver",
  contractName: "Managed network services",
  awardRationale: "Lowest evaluated cost with the required service credits.",
  evidenceReference: "Evaluation summary accepted by the decision owner.",
};

const clock = () => "2026-10-05T12:00:00.000Z";
const id = () => "33333333-3333-4333-8333-333333333333";

describe("an award decision produces a canonical contract", () => {
  it("writes the award and its contract in one transaction", async () => {
    const h = harness();
    const result = await recordSourceEventAward(input, h.tx, clock, id);

    expect(result).toMatchObject({ ok: true, awardId: id() });
    expect(result.ok && result.contractId).toMatch(/^AWD-[0-9A-F]{12}$/);

    const inserts = h.inserts();
    expect(inserts).toHaveLength(2);
    // The award goes first: its partial unique index is what turns a replay
    // into a refusal, so it has to be the first write that can conflict.
    expect(inserts[0].sql).toContain("INSERT INTO source_event_award_decision");
    expect(inserts[1].sql).toContain("INSERT INTO source.contract");
    expect(h.didRollBack()).toBe(false);
  });

  it("binds the contract to the award that produced it", async () => {
    const h = harness();
    const result = await recordSourceEventAward(input, h.tx, clock, id);
    expect(result.ok).toBe(true);

    const contract = h.inserts()[1];
    expect(contract.sql).toContain("'source-event-award'");
    expect(contract.params).toContain(id());
    // Control: the slice really is the contract insert, so the assertions
    // above cannot be passing against some other statement.
    expect(contract.params).toContain("tenant-alpha");
  });

  it("never records an award-produced contract as reviewed", async () => {
    const h = harness();
    expect((await recordSourceEventAward(input, h.tx, clock, id)).ok).toBe(true);

    const contract = h.inserts()[1];
    expect(contract.sql).toContain("'unreviewed'");
    expect(contract.sql).not.toContain("'accepted'");
    expect(contract.sql).not.toContain("'approved'");
  });

  it("refuses a supplier the event never accepted, writing nothing", async () => {
    const h = harness({ candidates: [] });
    const result = await recordSourceEventAward(input, h.tx, clock, id);

    expect(result).toEqual({ ok: false, code: "candidate_not_accepted" });
    expect(h.inserts()).toHaveLength(0);
  });

  it("refuses an event in another tenant, writing nothing", async () => {
    const h = harness({ events: [] });
    const result = await recordSourceEventAward(input, h.tx, clock, id);

    expect(result).toEqual({ ok: false, code: "event_not_found" });
    expect(h.inserts()).toHaveLength(0);
  });

  it("refuses a replayed award without writing a second contract", async () => {
    const h = harness({ awardInserted: [] });
    const result = await recordSourceEventAward(input, h.tx, clock, id);

    expect(result).toEqual({ ok: false, code: "duplicate_award" });
    const inserts = h.inserts();
    expect(inserts).toHaveLength(1);
    expect(inserts[0].sql).toContain("INSERT INTO source_event_award_decision");
  });

  // The constraint on the award row requires a contract id. An award that
  // committed while its contract insert did nothing would assert it produced a
  // contract that does not exist.
  it("rolls the award back when the contract id is already taken", async () => {
    const h = harness({ contractInserted: [] });
    const result = await recordSourceEventAward(input, h.tx, clock, id);

    expect(result).toEqual({ ok: false, code: "contract_id_taken" });
    expect(h.didRollBack()).toBe(true);
    expect(h.inserts()).toHaveLength(2);
  });

  it("refuses an award with no named approver, reason or evidence", async () => {
    for (const field of ["approvedByUserId", "approvedByName", "contractName", "vendorId"] as const) {
      const h = harness();
      const result = await recordSourceEventAward({ ...input, [field]: "   " }, h.tx, clock, id);
      expect(result).toEqual({ ok: false, code: "invalid_record" });
      expect(h.calls).toHaveLength(0);
    }
    for (const field of ["awardRationale", "evidenceReference"] as const) {
      const h = harness();
      const result = await recordSourceEventAward({ ...input, [field]: "ok" }, h.tx, clock, id);
      expect(result).toEqual({ ok: false, code: "invalid_record" });
      expect(h.calls).toHaveLength(0);
    }
    // Control: the same harness accepts the unmodified input, so the refusals
    // above are caused by the blanked field and not by the fixture.
    const control = harness();
    expect((await recordSourceEventAward(input, control.tx, clock, id)).ok).toBe(true);
  });

  it("scopes every statement to the submitting tenant", async () => {
    const h = harness();
    await recordSourceEventAward(input, h.tx, clock, id);

    expect(h.calls[0].sql).toContain("set_config('app.tenant_key'");
    expect(h.calls[0].params).toEqual(["tenant-alpha"]);
    for (const call of h.calls.slice(1)) {
      expect(call.params).toContain("tenant-alpha");
    }
  });

  it("reports an unreachable data plane as a refusal, not a success", async () => {
    const failing = (async () => {
      throw new Error("connection refused");
    }) as unknown as Parameters<typeof recordSourceEventAward>[1];
    const result = await recordSourceEventAward(input, failing, clock, id);
    expect(result).toEqual({ ok: false, code: "award_unavailable" });
  });
});
